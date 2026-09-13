/*
 * repository.js — IndexedDB `nihongo-reader` (schema v1). Shared by the service
 * worker (study commits) and the side panel (reads, kanji state, imports).
 * Pure promise wrappers over IDB; all cross-record invariants come from
 * reader-core (eventId, merge/void rules, projections).
 *
 * Stores (keyPath in brackets):
 *   meta[name]              installationId, activeLibrary, prefs
 *   libraries[snapshotId]   { manifest, libraryId, state: staged|active|old, importedAt }
 *   cards[key]              key = `${snapshotId}|${cardKey}`; index bySnapshot
 *   assets[assetHash]       { record, blob }
 *   sentences[sentenceKey]  SentenceRecord + sources[] (bounded)
 *   sessions[sessionId]     SessionRecord
 *   events[eventId]         EncounterEvent; indexes byKanji, byAction, bySentence
 *   voids[eventId]          EventVoid
 *   kanjiState[kanjiKey]    KanjiState
 *   aggregates[kanjiKey]    KanjiAggregate + sources[] + sentenceKeys[] + lastSource
 *   translations[key]       cached on-demand translations (`${provider}|${to}|${text}`)
 */
export const DB_NAME = 'nihongo-reader';
export const DB_VERSION = 2;   // v2: + translations (on-demand lookups, cached so a word is fetched once)
const MAX_SOURCES = 25;

const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const done = (tx) => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('transaction aborted')); });

export function openRepo() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('IndexedDB unavailable'));
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      const mk = (name, keyPath, indexes = []) => { if (db.objectStoreNames.contains(name)) return null; const s = db.createObjectStore(name, { keyPath }); for (const [n, kp] of indexes) s.createIndex(n, kp); return s; };
      mk('meta', 'name');
      mk('libraries', 'snapshotId', [['byLibrary', 'libraryId']]);
      mk('cards', 'key', [['bySnapshot', 'snapshotId']]);
      mk('assets', 'assetHash');
      mk('sentences', 'sentenceKey');
      mk('sessions', 'sessionId');
      mk('events', 'eventId', [['byKanji', 'kanjiKey'], ['byAction', 'actionId'], ['bySentence', 'sentenceKey']]);
      mk('voids', 'eventId');
      mk('kanjiState', 'kanjiKey');
      mk('aggregates', 'kanjiKey');
      mk('translations', 'key');
    };
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('database blocked by another connection'));
    open.onsuccess = () => resolve(new Repo(open.result));
  });
}

class Repo {
  constructor(db) { this.db = db; }
  close() { this.db.close(); }

  // ── meta ─────────────────────────────────────────────────────────────────
  async getMeta(name) { const tx = this.db.transaction('meta'); const r = await req(tx.objectStore('meta').get(name)); return r ? r.value : undefined; }
  async setMeta(name, value) { const tx = this.db.transaction('meta', 'readwrite'); tx.objectStore('meta').put({ name, value }); await done(tx); }

  // ── sessions ─────────────────────────────────────────────────────────────
  async putSession(session) { const tx = this.db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put(session); await done(tx); }

  // ── study commit: events + aggregates + sentence in ONE transaction ─────
  async commitStudy({ events, sentence }) {
    const tx = this.db.transaction(['events', 'voids', 'aggregates', 'sentences'], 'readwrite');
    const ev = tx.objectStore('events'), vo = tx.objectStore('voids'), ag = tx.objectStore('aggregates'), se = tx.objectStore('sentences');
    let added = 0, skipped = 0;
    if (sentence) {
      const cur = await req(se.get(sentence.sentenceKey));
      const sources = cur ? cur.sources || [] : [];
      const src = events[0] && events[0].source;
      if (src && !sources.some(s => s.url === src.url)) sources.push({ url: src.url, title: src.title, domain: src.domain, capturedAt: src.capturedAt });
      se.put({ ...(cur || {}), ...sentence, sources: sources.slice(-MAX_SOURCES), firstStudiedAt: cur ? cur.firstStudiedAt : (events[0] ? events[0].occurredAt : new Date().toISOString()) });
    }
    for (const e of events) {
      if (await req(vo.get(e.eventId))) { skipped++; continue; }
      if (await req(ev.get(e.eventId))) { skipped++; continue; }
      ev.put(e);
      added++;
      const a = (await req(ag.get(e.kanjiKey))) || { kanjiKey: e.kanjiKey, count: 0, firstAt: null, lastAt: null, sourceCount: 0, sentenceCount: 0, sources: [], sentenceKeys: [], lastSource: null };
      a.count++;
      if (!a.firstAt || e.occurredAt < a.firstAt) a.firstAt = e.occurredAt;
      if (!a.lastAt || e.occurredAt > a.lastAt) a.lastAt = e.occurredAt;
      const srcKey = (e.source && (e.source.url || e.source.domain)) || '';
      if (!a.sources.includes(srcKey)) a.sources = [...a.sources, srcKey].slice(-MAX_SOURCES);
      if (!a.sentenceKeys.includes(e.sentenceKey)) a.sentenceKeys.push(e.sentenceKey);
      a.sourceCount = a.sources.length; a.sentenceCount = a.sentenceKeys.length;
      a.lastSource = e.source ? { url: e.source.url, title: e.source.title, domain: e.source.domain } : null;
      ag.put(a);
    }
    await done(tx);
    return { added, skipped };
  }

  // ── undo: void every event of an action and rebuild affected aggregates ──
  async voidAction(actionId, { installationId, now, reason = 'undo' }) {
    const tx = this.db.transaction(['events', 'voids', 'aggregates'], 'readwrite');
    const ev = tx.objectStore('events'), vo = tx.objectStore('voids'), ag = tx.objectStore('aggregates');
    const events = await req(ev.index('byAction').getAll(actionId));
    const kanji = new Set();
    for (const e of events) { vo.put({ eventId: e.eventId, voidedAt: now, installationId, reason }); kanji.add(e.kanjiKey); }
    for (const k of kanji) await this._rebuildAggregate(k, ev, vo, ag);
    await done(tx);
    return { voided: events.length };
  }

  async _rebuildAggregate(kanjiKey, ev, vo, ag) {
    const all = await req(ev.index('byKanji').getAll(kanjiKey));
    const active = [];
    for (const e of all) if (!(await req(vo.get(e.eventId)))) active.push(e);
    if (!active.length) { ag.delete(kanjiKey); return; }
    active.sort((a, b) => a.occurredAt < b.occurredAt ? -1 : 1);
    const sources = [...new Set(active.map(e => (e.source && (e.source.url || e.source.domain)) || ''))];
    const sentenceKeys = [...new Set(active.map(e => e.sentenceKey))];
    const last = active[active.length - 1];
    ag.put({ kanjiKey, count: active.length, firstAt: active[0].occurredAt, lastAt: last.occurredAt, sourceCount: sources.length, sentenceCount: sentenceKeys.length, sources: sources.slice(-MAX_SOURCES), sentenceKeys, lastSource: last.source ? { url: last.source.url, title: last.source.title, domain: last.source.domain } : null });
  }

  // ── kanji reads/writes ───────────────────────────────────────────────────
  async getKanji(kanjiKey) {
    const tx = this.db.transaction(['aggregates', 'kanjiState', 'events', 'voids']);
    const aggregate = await req(tx.objectStore('aggregates').get(kanjiKey));
    const state = await req(tx.objectStore('kanjiState').get(kanjiKey));
    const all = await req(tx.objectStore('events').index('byKanji').getAll(kanjiKey));
    const vo = tx.objectStore('voids');
    const recent = [];
    for (const e of all.sort((a, b) => a.occurredAt < b.occurredAt ? 1 : -1)) { if (recent.length >= 5) break; if (!(await req(vo.get(e.eventId)))) recent.push(e); }
    return { aggregate: aggregate || null, state: state || null, recent };
  }

  async setKanjiState(partial, installationId) {
    const tx = this.db.transaction('kanjiState', 'readwrite');
    const st = tx.objectStore('kanjiState');
    const cur = await req(st.get(partial.kanjiKey));
    const next = { kanjiKey: partial.kanjiKey, familiarity: 'unassessed', wantCard: false, note: null, preferredCard: null, ...(cur || {}), ...partial, installationId, revision: (cur ? cur.revision : 0) + 1, updatedAt: new Date().toISOString() };
    st.put(next);
    await done(tx);
    return next;
  }

  async listAggregates() { const tx = this.db.transaction('aggregates'); return req(tx.objectStore('aggregates').getAll()); }

  // ── libraries ────────────────────────────────────────────────────────────
  /**
   * Stage and activate a preflighted package. Assets are shared by hash;
   * cards are written per snapshot in bounded batches; the active pointer
   * switches only after everything is written. Failure leaves the old library active.
   */
  async importLibrary(pre, { onProgress } = {}) {
    const { manifest, cards, assets } = pre;
    const glossary = pre.glossary || null;
    const snapshotId = manifest.snapshotId;
    {
      const tx = this.db.transaction('libraries', 'readwrite');
      tx.objectStore('libraries').put({ snapshotId, libraryId: manifest.libraryId, manifest, glossary, state: 'staged', importedAt: new Date().toISOString() });
      await done(tx);
    }
    for (let i = 0; i < assets.length; i += 20) {
      const tx = this.db.transaction('assets', 'readwrite');
      const st = tx.objectStore('assets');
      for (const a of assets.slice(i, i + 20)) {
        if (!(await req(st.get(a.record.assetHash)))) st.put({ assetHash: a.record.assetHash, record: a.record, blob: new Blob([a.bytes], { type: a.record.mime }) });
      }
      await done(tx);
      onProgress && onProgress({ phase: 'assets', done: Math.min(i + 20, assets.length), total: assets.length });
    }
    for (let i = 0; i < cards.length; i += 200) {
      const tx = this.db.transaction('cards', 'readwrite');
      const st = tx.objectStore('cards');
      for (const c of cards.slice(i, i + 200)) st.put({ key: `${snapshotId}|${c.cardKey}`, snapshotId, ...c });
      await done(tx);
      onProgress && onProgress({ phase: 'cards', done: Math.min(i + 200, cards.length), total: cards.length });
    }
    {
      const tx = this.db.transaction(['libraries', 'meta'], 'readwrite');
      const lib = tx.objectStore('libraries');
      const all = await req(lib.index('byLibrary').getAll(manifest.libraryId));
      for (const l of all) if (l.snapshotId !== snapshotId && l.state === 'active') { l.state = 'old'; lib.put(l); }
      lib.put({ snapshotId, libraryId: manifest.libraryId, manifest, glossary, state: 'active', importedAt: new Date().toISOString() });
      tx.objectStore('meta').put({ name: 'activeLibrary', value: { libraryId: manifest.libraryId, snapshotId } });
      await done(tx);
    }
    return { snapshotId, cards: cards.length, assets: assets.length };
  }

  async getActiveLibrary() {
    const active = await this.getMeta('activeLibrary');
    if (!active) return null;
    const tx = this.db.transaction(['libraries', 'cards']);
    const lib = await req(tx.objectStore('libraries').get(active.snapshotId));
    if (!lib) return null;
    const rows = await req(tx.objectStore('cards').index('bySnapshot').getAll(active.snapshotId));
    const cards = rows.map(({ key, snapshotId, ...c }) => c);
    return { libraryId: lib.libraryId, snapshotId: lib.snapshotId, manifest: lib.manifest, glossary: lib.glossary || null, importedAt: lib.importedAt, cards };
  }

  async getAsset(assetHash) { const tx = this.db.transaction('assets'); return req(tx.objectStore('assets').get(assetHash)); }

  async getTranslation(key) { const tx = this.db.transaction('translations'); return req(tx.objectStore('translations').get(key)); }
  async putTranslation(rec) { const tx = this.db.transaction('translations', 'readwrite'); tx.objectStore('translations').put(rec); await done(tx); }

  /** Full reset of learner data (explicit, separate from re-importing cards). */
  async resetHistory() {
    const tx = this.db.transaction(['events', 'voids', 'aggregates', 'sentences', 'sessions', 'kanjiState'], 'readwrite');
    for (const s of ['events', 'voids', 'aggregates', 'sentences', 'sessions', 'kanjiState']) tx.objectStore(s).clear();
    await done(tx);
  }
}
