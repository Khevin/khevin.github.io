/*
 * sidepanel.js — the Reader panel application (M1). One state object, one
 * render function, event delegation. Talks to: the analysis worker (lazy,
 * terminated on pagehide), the repository (library, kanji state, counts), and
 * the service worker (STUDY_SENTENCE commits, so session identity is owned in
 * one place). Exposes window.__reader for the e2e harness.
 */
import { unzipSync } from 'fflate';
import { segmentSentences, toDisplayTextWithMap, remapSpans, iterateKanji, kanjiKeyOf } from '../../reader-core/text.js';
import { buildCardIndex, cardsFor, availabilityFor, preflightPackage, wordCards, glossFor } from '../../reader-core/library.js';
import { tokenRomaji } from '../../reader-core/romaji.js';
import { buildSentenceHTML } from './panel/blocks.js';
import { openRepo } from './repository.js';
import { commitStudy, webStorageKv } from './study-commit.js';
import { speak, ttsAvailable, localRemote } from './panel/tts.js';
import { translate, translateUrl as gtUrl, cacheKeyFor, TARGETS, translationProviderFor } from './panel/translate.js';
import { syncLibrary, dueSince } from './library-sync.js';
import { searchImages, googleImagesUrl, providerFor, PROVIDER_LABEL, GALLERY_MAX } from './panel/images.js';
import { bump as bumpUsage } from './panel/usage.js';
import { classifyThumbnail } from './panel/image-filter.js';

const PROTOCOL_VERSION = 1;
const DEFAULT_APP_URL = 'https://khevin.com/nihongo/app.html';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime && chrome.runtime.id;

/**
 * Listen with the learner's Google Cloud voice. The panel is an extension page,
 * so it fetches and plays the clip itself — no service worker, nothing to go
 * stale. Returning false (or throwing) sends speak() to the browser voice.
 */
async function speakRemote(text) {
  const play = localRemote({ gcloudTtsKey: state.tts.key, ttsVoiceURI: state.tts.voiceURI, ttsRate: state.tts.rate });
  if (!play) return false;
  return play(text);
}

const state = {
  capture: null,        // { captureId, status, payload, source }
  sentences: [],        // [{ text, fragment, ruby, captureKind }]
  active: 0,
  analysis: null,
  analyzing: false,
  level: 'words',
  romaji: false,
  furigana: false,
  appUrl: DEFAULT_APP_URL,
  library: null,        // { index, manifest, snapshotId, importedAt }
  selection: null,      // { tokenIds: [] }
  kanji: null,          // { key, glyph, word, info, card, cards, imageUrl, revealed }
  studied: new Map(),   // actionId -> { added, skipped, sessionId }
  status: { text: '', kind: '' },
  workerReady: false,
  paste: '',
  tts: { rate: 0.85, voiceURI: null },
  translateTo: 'en',
  translateKey: null,
  translateProvider: 'gtx',
  translation: null,   // { text, status: 'loading'|'ok'|'error', result?, error? }
  images: null,        // { q, status, provider, items:[{...,blobUrl,textLike}], nextStart, showHidden, error? }
  imagesKey: null, imagesCx: null, pixabayKey: null,
};
/** Pasted text has no in-page bar, so the panel shows the full diagram; captures from the bar show details only. */
const isPasteMode = () => !!(state.capture && state.capture.payload && state.capture.payload.captureKind === 'paste');

let repo = null;
let worker = null, seq = 0;
const pending = new Map();
const assetUrls = new Map();
let analysisSeq = 0, kanjiSeq = 0;
let translationRetryTimer = null;
const studying = new Set();

function applyPrefs(p = {}) {
  state.level = p.level || state.level; state.romaji = !!p.romaji; state.furigana = !!p.furigana;
  state.appUrl = p.appUrl || state.appUrl;
  state.tts = { rate: p.ttsRate ?? 0.85, voiceURI: p.ttsVoiceURI || null, key: p.gcloudTtsKey || null };
  const to = TARGETS[p.translateTo] ? p.translateTo : 'en';
  const provider = translationProviderFor(p);
  if (to !== state.translateTo || (p.translateKey || null) !== state.translateKey || provider !== state.translateProvider) retireTranslation();
  state.translateTo = to; state.translateKey = p.translateKey || null;
  state.translateProvider = provider;
  state.imagesKey = p.imagesKey || null; state.imagesCx = p.imagesCx || null; state.pixabayKey = p.pixabayKey || null;
}
async function savePrefs(partial) {
  if (!hasChrome) return;
  try {
    const { prefs } = await chrome.storage.local.get('prefs');
    await chrome.storage.local.set({ prefs: { ...(prefs || {}), ...partial } });
  } catch (err) { setStatus(`settings not saved: ${err.message}`, 'err'); }
}

// ── worker client (lazy) ──────────────────────────────────────────────────
function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('analysis-worker.js', location.href), { type: 'module' });
  worker.onmessage = (ev) => { const { requestId, type, payload } = ev.data || {}; const p = pending.get(requestId); if (!p) return; pending.delete(requestId); type === 'WORKER_ERROR' ? p.reject(Object.assign(new Error(payload.message), { stage: payload.stage })) : p.resolve(payload); };
  worker.onerror = (e) => { for (const p of pending.values()) p.reject(new Error(e.message || 'worker error')); pending.clear(); };
  return worker;
}
function send(type, payload) { const requestId = `r${++seq}`; return new Promise((resolve, reject) => { pending.set(requestId, { resolve, reject }); getWorker().postMessage({ protocolVersion: PROTOCOL_VERSION, requestId, type, payload }); }); }
/** Analysis: via the service worker's offscreen document in the extension (one shared dictionary); local worker only without a runtime (served-dist tests). */
async function analyzeText(text) {
  if (!hasChrome) return send('ANALYZE', { text });
  const r = await chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `p-${Date.now()}`, type: 'ANALYZE_TEXT', payload: { text } });
  if (!r || !r.ok) throw new Error(r ? r.error : 'no reply from the extension');
  return r.analysis;
}
window.addEventListener('pagehide', () => { if (worker) { worker.terminate(); worker = null; } for (const u of assetUrls.values()) URL.revokeObjectURL(u); for (const u of galleryUrls) URL.revokeObjectURL(u); });

// ── boot ──────────────────────────────────────────────────────────────────
async function boot() {
  try { repo = await openRepo(); } catch (err) { setStatus(`storage unavailable: ${err.message}`, 'err'); }
  if (hasChrome) {
    const { prefs, level, romaji, appUrl } = await chrome.storage.local.get(['prefs', 'level', 'romaji', 'appUrl']);
    // Canonical prefs win; old panel-only keys are fallback for older installs.
    applyPrefs({ level, romaji, appUrl, ...(prefs || {}) });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.prefs) { applyPrefs(changes.prefs.newValue); render(); }
    });
  }
  await loadLibrary();
  render();
  ensureLibrary();   // bundled on first run, site revision when newer — never blocks the UI
  if (hasChrome) {
    await readLatestCapture();
    chrome.storage.session.onChanged.addListener((changes) => {
      const latest = changes['capture:latestTab'] ? changes['capture:latestTab'].newValue : null;
      const tabId = latest ?? (state.capture && state.capture.tabId);
      const key = `capture:${tabId}`;
      if (changes[key]) setCapture(changes[key].newValue);
      if (changes[`focus:${tabId}`]) applyFocus(changes[`focus:${tabId}`].newValue);
    });
  }
  // without a runtime, warm the local dictionary so the first sentence is quick (in the extension the offscreen document holds it)
  if (!hasChrome) send('INIT').then(() => { state.workerReady = true; render(); }).catch((err) => setStatus(`dictionary failed to load: ${err.message}`, 'err'));
}

async function readLatestCapture() {
  const { 'capture:latestTab': tabId } = await chrome.storage.session.get('capture:latestTab');
  if (tabId == null) return;
  const r = await chrome.storage.session.get([`capture:${tabId}`, `focus:${tabId}`]);
  if (r[`capture:${tabId}`]) setCapture(r[`capture:${tabId}`]);
  if (r[`focus:${tabId}`]) applyFocus(r[`focus:${tabId}`]);
}

/** The in-page bar asked for details of sentence `index`, tokens `tokenIds`. */
let pendingFocus = null;
function applyFocus(f) {
  if (!f || !state.capture || f.captureId !== state.capture.captureId) { pendingFocus = f || null; return; }
  pendingFocus = null;
  kanjiSeq++; state.kanji = null;
  retireTranslation();
  const sel = f.tokenIds && f.tokenIds.length ? { tokenIds: f.tokenIds } : null;
  if (f.index !== state.active || !state.analysis) { state.active = f.index; state.selection = sel; analyzeActive(); }
  else { state.selection = sel; render(); document.getElementById('word-panel')?.focus(); }
}

const LIBRARY_CHECK_MS = 6 * 60 * 60 * 1000;
/** The library works out of the box: import the bundled copy when none is active, then check the Nihongo site for a newer revision (throttled). */
async function ensureLibrary({ force = false } = {}) {
  if (!repo) return;
  const params = new URLSearchParams(location.search);
  const appUrl = hasChrome ? state.appUrl : (params.get('appUrl') || null);   // served-dist tests can point at a fake site
  const bundledBase = new URL('library/', location.href);
  const lastKey = 'librarySyncAt';
  let last = null;
  try { last = hasChrome ? (await chrome.storage.local.get(lastKey))[lastKey] : sessionStorage.getItem(lastKey); } catch { /* ignore */ }
  const remoteDue = force || !state.library || dueSince(last, LIBRARY_CHECK_MS);
  if (state.library && !remoteDue) return;
  try {
    if (hasChrome) await chrome.storage.local.set({ [lastKey]: new Date().toISOString() }); else sessionStorage.setItem(lastKey, new Date().toISOString());
    const r = await syncLibrary({ appUrl: remoteDue ? appUrl : null, bundledBase, force, onStatus: (s) => setStatus(s) });
    if (r.action === 'imported') {
      for (const u of assetUrls.values()) URL.revokeObjectURL(u); assetUrls.clear();
      await loadLibrary();
      setStatus(`library ${r.source === 'site' ? 'updated from ' + new URL(appUrl).hostname : 'ready'} ✓ ${r.manifest.counts.cards} cards · revision ${r.manifest.revision}`, 'ok');
      if (state.kanji) await openKanji(state.kanji.glyph, state.kanji.word); else render();
    } else if (r.error && !state.library) { setStatus(`library unavailable: ${r.error}`, 'err'); render(); }
    else if (force) { setStatus(r.error ? `library check: ${r.error}` : (r.notice || 'library is up to date ✓'), r.error ? 'err' : 'ok'); }
  } catch (err) { if (!state.library) setStatus(`library sync failed: ${err.message}`, 'err'); }
}

async function loadLibrary() {
  if (!repo) return;
  try {
    const lib = await repo.getActiveLibrary();
    state.library = lib ? { index: buildCardIndex(lib.libraryId, lib.cards), glossary: lib.glossary || null, manifest: lib.manifest, snapshotId: lib.snapshotId, importedAt: lib.importedAt, count: lib.cards.length, source: await repo.getMeta('librarySource').catch(() => null) } : null;
  } catch (err) { setStatus(`library read failed: ${err.message}`, 'err'); }
}

// ── captures and sentences ────────────────────────────────────────────────
function setCapture(cap) {
  if (!cap) return;
  if (state.capture && state.capture.captureId === cap.captureId && state.sentences.length) return; // same capture re-sent (with a focus): keep state
  state.capture = cap;
  analysisSeq++; kanjiSeq++; state.studied.clear();
  state.selection = null; state.kanji = null; state.analysis = null; retireTranslation();
  if (cap.status === 'ready' && cap.payload) {
    state.sentences = sentencesFrom(cap.payload);
    state.active = 0;
    if (pendingFocus && pendingFocus.captureId === cap.captureId) { const f = pendingFocus; pendingFocus = null; state.active = f.index; state.selection = f.tokenIds && f.tokenIds.length ? { tokenIds: f.tokenIds } : null; }
    render();
    analyzeActive();
  } else {
    state.sentences = [];
    render();
  }
}

function sentencesFrom(payload) {
  if (Array.isArray(payload.sentences)) return payload.sentences.map(s => ({ text: s.text, fragment: !!s.fragment, ruby: s.ruby || [], captureKind: payload.captureKind || 'selection' }));
  const out = [];
  for (const b of payload.blocks || []) {
    for (const s of segmentSentences(b.text)) {
      const local = (b.ruby || []).filter(r => r.start >= s.start && r.end <= s.end).map(r => ({ start: r.start - s.start, end: r.end - s.start, reading: r.reading }));
      const { text, map } = toDisplayTextWithMap(s.text);   // layout breaks/whitespace shift offsets: remap the ruby spans
      out.push({ text, fragment: s.fragment, ruby: remapSpans(local, map), captureKind: payload.captureKind });
    }
  }
  return out;
}

async function analyzeActive() {
  const s = state.sentences[state.active];
  if (!s) return;
  const request = ++analysisSeq;
  const capture = state.capture, index = state.active;
  const current = () => request === analysisSeq && state.capture === capture && state.sentences[state.active] === s;
  const keepSelection = state.selection;
  state.analyzing = true; state.analysis = null; render();
  try {
    const res = await analyzeText(s.text);
    if (!current()) return;
    state.workerReady = true;
    state.analysis = res;
    state.analyzing = false;
    state.selection = keepSelection;
    render();
    if (keepSelection) document.getElementById('word-panel')?.focus();
    await study(s, capture, index);
  } catch (err) {
    if (!current()) return;
    state.analyzing = false;
    state.analysis = { text: s.text, tokens: [], gaps: [], groups: [], relations: [], warnings: [`analysis failed (${err.stage || 'worker'}): ${err.message}`] };
    render();
    await study(s, capture, index); // a parser failure still counts the studied sentence (handoff §10.4)
  }
}

async function study(s, capture = state.capture, index = state.active) {
  const captureId = capture ? capture.captureId : 'paste';
  const actionId = `${captureId}:${index}`;
  if (state.studied.has(actionId) || studying.has(actionId)) return;
  const current = () => state.capture === capture && state.active === index;
  studying.add(actionId);
  const source = capture?.payload?.source || { url: null, title: null, domain: 'paste', capturedAt: new Date().toISOString() };
  const payload = { actionId, displayText: s.text, source, captureKind: s.captureKind || 'paste', fragment: s.fragment, rubySpans: s.ruby.length ? s.ruby : undefined };
  setStatus('saving…');
  try {
    // In the extension the service worker owns session identity; without a runtime (served page, tests) commit locally.
    const r = hasChrome
      ? await chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: actionId, type: 'STUDY_SENTENCE', payload })
      : { ok: true, ...(await commitStudy(payload, webStorageKv())) };
    if (!r || !r.ok) throw new Error(r ? r.error : 'no reply');
    if (state.capture === capture) state.studied.set(actionId, r);
    if (!current()) return;
    setStatus(r.added ? `saved ✓ ${r.added} kanji encounter${r.added === 1 ? '' : 's'} recorded${r.newSession ? ' · new reading session' : ''}` : 'saved ✓ already counted in this session', 'ok');
  } catch (err) { if (current()) setStatus(`not saved: ${err.message}`, 'err'); }
  finally { studying.delete(actionId); }
}

function setStatus(text, kind = '') { state.status = { text, kind }; const el = document.getElementById('status'); if (el) { el.textContent = text; el.className = `status ${kind}`; } }

// ── kanji / word details ──────────────────────────────────────────────────
async function openKanji(glyph, word) {
  const request = ++kanjiSeq, capture = state.capture, selection = state.selection;
  const current = () => request === kanjiSeq && capture === state.capture && selection === state.selection;
  const key = kanjiKeyOf(glyph);
  const idx = state.library && state.library.index;
  const found = cardsFor(idx, key, null);
  let info = null;
  try { info = repo ? await repo.getKanji(key) : null; } catch (err) { setStatus(`storage read failed: ${err.message}`, 'err'); }
  if (!current()) return;
  const pref = info && info.state && info.state.preferredCard ? cardsFor(idx, key, info.state.preferredCard).preferred : found.preferred;
  const card = pref;
  let imageUrl = null, imageMissing = false;
  if (card && card.image && repo) {
    try {
      if (!assetUrls.has(card.image.assetHash)) { const a = await repo.getAsset(card.image.assetHash); if (!current()) return; if (a && a.blob) { if (!assetUrls.has(card.image.assetHash)) assetUrls.set(card.image.assetHash, URL.createObjectURL(a.blob)); } else imageMissing = true; }
      imageUrl = assetUrls.get(card.image.assetHash) || null;
    } catch { imageMissing = true; }
  }
  if (!current()) return;
  state.kanji = { key, glyph, word, info, card, cards: found, availability: availabilityFor(idx, key), imageUrl, imageMissing, revealed: false };
  render();   // state.selection is kept: the kanji panel offers a way back to the word
  document.getElementById('kanji-panel')?.focus();
}

async function setFamiliarity(f) {
  if (!repo || !state.kanji) return;
  const kanji = state.kanji;
  const inst = hasChrome ? (await chrome.storage.local.get('installationId')).installationId : 'inst-local';
  try { const st = await repo.setKanjiState({ kanjiKey: kanji.key, familiarity: f }, inst || 'inst-local'); if (state.kanji !== kanji) return; kanji.info = { ...(kanji.info || {}), state: st }; setStatus('saved ✓', 'ok'); }
  catch (err) { setStatus(`not saved: ${err.message}`, 'err'); }
  render();
}
async function toggleWantCard() {
  if (!repo || !state.kanji) return;
  const kanji = state.kanji;
  const inst = hasChrome ? (await chrome.storage.local.get('installationId')).installationId : 'inst-local';
  const cur = !!(kanji.info && kanji.info.state && kanji.info.state.wantCard);
  try { const st = await repo.setKanjiState({ kanjiKey: kanji.key, wantCard: !cur }, inst || 'inst-local'); if (state.kanji !== kanji) return; kanji.info = { ...(kanji.info || {}), state: st }; setStatus('saved ✓', 'ok'); }
  catch (err) { setStatus(`not saved: ${err.message}`, 'err'); }
  render();
}

// ── library import ────────────────────────────────────────────────────────
async function importZip(file) {
  if (!repo) { setStatus('storage unavailable', 'err'); return; }
  setStatus(`reading ${file.name}…`);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const files = new Map(Object.entries(unzipSync(bytes)).filter(([p]) => !p.endsWith('/')));
    const pre = await preflightPackage(files);
    if (!pre.ok) { setStatus(`package rejected: ${pre.errors.slice(0, 3).join(' · ')}${pre.errors.length > 3 ? ` (+${pre.errors.length - 3})` : ''}`, 'err'); return; }
    const cur = state.library;
    if (cur && cur.manifest.libraryId === pre.manifest.libraryId && pre.manifest.revision < cur.manifest.revision) { setStatus(`older snapshot (revision ${pre.manifest.revision} < ${cur.manifest.revision}) — not applied; rollback is an explicit choice in a later milestone`, 'err'); return; }
    const r = await repo.importLibrary(pre, { onProgress: (p) => setStatus(`importing ${p.phase} ${p.done}/${p.total}…`) });
    for (const u of assetUrls.values()) URL.revokeObjectURL(u); assetUrls.clear();
    await loadLibrary();
    setStatus(`library imported ✓ ${r.cards} cards, ${r.assets} images`, 'ok');
    if (state.kanji) await openKanji(state.kanji.glyph, state.kanji.word); else render();
  } catch (err) { setStatus(`import failed: ${err.message}`, 'err'); }
}

// ── render ────────────────────────────────────────────────────────────────
function paint(app, html) {
  // Library/settings callbacks may repaint while the learner is still typing.
  const paste = document.activeElement;
  const editing = paste?.id === 'paste' && app.contains(paste);
  const cursor = editing ? [paste.selectionStart, paste.selectionEnd, paste.selectionDirection, paste.scrollTop] : null;
  const gallery = app.querySelector('.image-gallery');
  const galleryScroll = gallery ? { key: gallery.dataset.gallery, top: gallery.scrollTop, focused: document.activeElement === gallery } : null;
  app.innerHTML = html;
  const nextGallery = galleryScroll && app.querySelector('.image-gallery');
  if (nextGallery && nextGallery.dataset.gallery === galleryScroll.key) {
    nextGallery.scrollTop = galleryScroll.top;
    if (galleryScroll.focused) nextGallery.focus({ preventScroll: true });
  }
  const next = editing && document.getElementById('paste');
  if (next) {
    next.focus({ preventScroll: true });
    next.setSelectionRange(cursor[0], cursor[1], cursor[2]);
    next.scrollTop = cursor[3];
  }
}

function render() {
  const app = document.getElementById('app');
  const lib = state.library;
  const s = state.sentences[state.active];
  const cap = state.capture;
  const html = [];
  html.push(`<header class="hdr"><h1>Nihongo Reader</h1><span class="lib">${lib ? `<span title="revision ${esc(lib.manifest && lib.manifest.revision)}${lib.source ? ' · ' + esc(lib.source.source === 'site' ? 'from ' + lib.source.host : 'bundled copy') : ''}">${lib.count} cards</span> · <button class="btn" data-act="sync" title="Check the Nihongo site for a newer library">↻</button> <button class="btn" data-act="import" title="Import a library zip by hand">Replace…</button>` : `<span>library loading…</span> <button class="btn" data-act="import">Import zip…</button>`}<input id="zip" type="file" accept=".zip,application/zip" hidden></span></header>`);

  if (!s) {
    const reason = cap && cap.status === 'unsupported' ? `<p class="status err">This page can't be read by the extension (${esc(cap.reason || 'restricted page')}). Paste the text instead.</p>` : (cap && cap.status === 'empty' ? `<p class="status">No Japanese text was selected.</p>` : (cap && cap.status === 'pending' ? `<p class="status">Capturing selection…</p>` : ''));
    html.push(`<section class="empty">${reason}<h2>Read a Japanese page</h2><ol><li>Select a sentence or paragraph on the page.</li><li>Tap the 札 button that appears next to it (or press Alt+Shift+N).</li><li>Tap a block in the bar at the bottom to see the word and its kanji here.</li></ol><label for="paste">Or paste Japanese text</label><textarea id="paste" class="paste" lang="ja" placeholder="コキリの森で暮らす少年。">${esc(state.paste)}</textarea><div class="row"><button class="btn primary" data-act="study-paste">Study pasted text</button><span class="status" id="status">${esc(state.status.text)}</span></div></section>`);
    if (!lib) html.push(`<p class="meta">Your Nihongo library loads automatically (bundled copy first, then the newest from the Nihongo site). If it does not appear, press ↻ or import a zip.</p>`);
    paint(app, html.join(''));
    return;
  }

  const src = cap && cap.payload && cap.payload.source;
  if (src) html.push(`<p class="src" title="${esc(src.url || '')}">${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.title || src.domain)}</a> · ${esc(src.domain || '')}` : 'pasted text'}</p>`);

  if (isPasteMode()) {
    // No bar for pasted text: the panel carries the whole diagram.
    html.push(`<div class="nav"><button class="btn" data-act="prev" ${state.active === 0 ? 'disabled' : ''} aria-label="previous sentence">‹</button><span>sentence ${state.active + 1} of ${state.sentences.length}${s.fragment ? ' · fragment' : ''}</span><button class="btn" data-act="next" ${state.active >= state.sentences.length - 1 ? 'disabled' : ''} aria-label="next sentence">›</button><span class="spacer"></span><button class="btn" data-act="clear">New selection</button></div>`);
    html.push(`<div class="toolbar"><span class="seg" role="group" aria-label="detail level"><button data-act="level" data-level="words" aria-pressed="${state.level === 'words'}">Words</button><button data-act="level" data-level="phrases" aria-pressed="${state.level === 'phrases'}">Phrases</button></span><label><input type="checkbox" data-act="romaji" ${state.romaji ? 'checked' : ''}> romaji</label><label><input type="checkbox" data-act="furigana" ${state.furigana ? 'checked' : ''}> furigana</label>${ttsAvailable() ? `<button class="btn" data-act="listen" data-text="${esc(s.text)}" aria-label="listen to this sentence">🔊</button>` : ''}<button class="btn" data-act="xlate" data-text="${esc(s.text)}">translate</button><span class="status ${esc(state.status.kind)}" id="status">${esc(state.status.text)}</span></div>`);
    if (state.analyzing || !state.analysis) html.push(`<div class="ss-sentence-build"><p class="ss-sentence-jp-text" lang="ja" style="text-transform:none">${esc(s.text)}</p><p class="ss-partial">${state.workerReady ? 'analysing…' : 'loading dictionary (first time ~1 s)…'}</p></div>`);
    else html.push(buildSentenceHTML(state.analysis, { level: state.level, romaji: state.romaji, furigana: state.furigana, rubySpans: s.ruby || [] }));
  } else {
    // The floating bar on the page shows the blocks; here, the sentence as plain text plus the details.
    html.push(`<p class="sent" lang="ja">${esc(s.text)}${ttsAvailable() ? ` <button class="btn mini" data-act="listen" data-text="${esc(s.text)}" aria-label="listen to this sentence">🔊</button>` : ''} <button class="btn mini" data-act="xlate" data-text="${esc(s.text)}" aria-label="translate this sentence">translate</button></p>`);
    html.push(`<p class="status ${esc(state.status.kind)}" id="status">${esc(state.status.text)}</p>`);
    if (!state.selection && !state.kanji) html.push(`<p class="meta">${state.analyzing || !state.analysis ? 'analysing…' : 'Tap a block in the bar on the page to see the word and its kanji here.'}</p>`);
  }

  if (state.kanji) html.push(kanjiPanelHTML());
  else if (state.selection && state.analysis) html.push(wordPanelHTML());

  html.push(translationHTML());
  html.push(imagesHTML());

  if (isPasteMode() && state.sentences.length > 1) {
    html.push(`<ul class="list" aria-label="captured sentences">${state.sentences.map((x, i) => `<li><button data-act="goto" data-i="${i}" aria-current="${i === state.active}" lang="ja">${esc(x.text)}${x.fragment ? ' <span class="frag">fragment</span>' : ''}</button></li>`).join('')}</ul>`);
  }
  paint(app, html.join(''));
}

function meaningOf(surface, lemma) { return glossFor(state.library && state.library.index, state.library && state.library.glossary, surface, lemma); }

/** The everyday-kanji entry (KANJIDIC2) behind a character, if the library carries one. */
function kanjiGloss(glyph) {
  const g = state.library && state.library.glossary && state.library.glossary.kanji;
  return (g && g[glyph]) || null;
}
const SOURCE_LABEL = { kanjidic: 'everyday kanji', 'pop-culture': 'games', 'kanji-meanings': 'your cards', dictionary: 'your dictionary' };

/** Readings and meaning for a kanji the learner has no card for. */
function kanjiDictHTML(glyph) {
  const g = kanjiGloss(glyph);
  if (!g) return '<p class="meta">Look at the picture in your head first: which parts do you recognise?</p>';
  const readings = [...(g.kun || []), ...(g.on || [])].filter(Boolean);
  const line = readings.length ? readings.join(' · ') : (g.reading || '—');
  return `<dl class="kdict">
      ${line !== '—' ? `<dt>readings</dt><dd lang="ja">${esc(line)}</dd>` : ''}
      <dt>meaning</dt><dd>${esc(g.meaning)} <span class="meta">· ${esc(SOURCE_LABEL[g.source] || g.source)}</span></dd>
      ${g.seen ? `<dt>where</dt><dd class="meta">${esc(g.seen)}</dd>` : ''}
    </dl>
    <p class="meta">No flashcard for this one yet. Look at the shape first: which parts do you recognise?</p>`;
}
// a span, not a <button>: it sits inside the row <button> and nested buttons are invalid HTML (the parser would eject it)
const translateLink = (text) => `<span class="xlate" role="button" tabindex="0" data-act="xlate" data-text="${esc(text)}" title="Translate here, in the panel (Google Translate)">translate</span>`;

/** On-demand translation into the panel's own section; cached in memory and IndexedDB. */
async function requestTranslation(text) {
  const clean = String(text || '').trim();
  if (!clean) return;
  clearTimeout(translationRetryTimer);
  const request = { text: clean, status: 'loading' };
  const to = state.translateTo, providerKey = state.translateProvider === 'cloud' ? state.translateKey : null;
  state.translation = request;
  render();
  const key = cacheKeyFor(clean, to, providerKey);
  try {
    let cached = null;
    try { cached = repo ? await repo.getTranslation(key) : null; } catch { /* cache miss is fine */ }
    const result = cached ? cached.result : await translate(clean, { to, key: providerKey });
    if (!cached) { bumpUsage('translate', providerKey ? 'cloud' : 'gtx'); if (repo) { try { await repo.putTranslation({ key, text: clean, to, result, at: new Date().toISOString() }); } catch { /* not fatal */ } } }
    if (state.translation === request && !request.leaving) { state.translation = { text: clean, status: 'ok', result, cached: !!cached }; render(); document.getElementById('xlate-panel')?.scrollIntoView({ block: 'nearest' }); }
  } catch (err) {
    if (state.translation === request && !request.leaving) {
      const failure = { text: clean, status: 'error', error: err.message, code: err.code, retryAt: err.retryAt, retryable: err.retryable !== false, details: err.details, provider: providerKey ? 'cloud' : 'gtx', localMeaning: meaningOf(clean)?.meaning || null };
      state.translation = failure;
      render();
      if (err.retryAt > Date.now()) translationRetryTimer = setTimeout(() => { if (state.translation === failure) render(); }, Math.min(2_147_483_647, err.retryAt - Date.now() + 50));
    }
  }
}

/** A translation belongs to the text it was asked for: when the learner moves to another word, it fades out (300 ms) instead of lingering. */
function retireTranslation(keepText = null) { retireLookups('translation', keepText); retireLookups('images', keepText); }
function retireLookups(which, keepText = null) {
  const t = which === 'translation' ? state.translation : state.images;
  const text = t && (which === 'translation' ? t.text : t.q);
  if (!t || t.leaving || text === keepText) return;
  t.leaving = true;
  setTimeout(() => {
    if (which === 'translation' && state.translation === t) { state.translation = null; render(); }
    if (which === 'images' && state.images && state.images.id === t.id) { state.images = null; releaseGallery(); render(); }
  }, 320);
}

const galleryUrls = new Set();
let imageSeq = 0;
const isWordLike = (text) => text && [...text].length <= 12 && !/[。！？!?、]/.test(text);

/** Pictures for a word: cached per provider+query; thumbnails fetched through the extension (no CORS taint) and screened for text-only images. */
async function requestImages(q, { more = false } = {}) {
  const query = String(q || '').trim();
  if (!isWordLike(query)) { if (state.images && state.images.q !== query) retireLookups('images'); return; }
  const provider = providerFor({ pixabayKey: state.pixabayKey, imagesKey: state.imagesKey, imagesCx: state.imagesCx });
  const start = more && state.images && state.images.q === query ? (state.images.nextStart || 11) : 1;
  const num = more ? Math.max(1, GALLERY_MAX - (state.images ? state.images.items.length : 0)) : 10;
  if (more && (!state.images || state.images.items.length >= GALLERY_MAX || !state.images.nextStart)) return;
  const cacheKey = `images|${provider}|${start}|${query}`;
  const prev = more ? state.images : null;
  if (!more) releaseGallery();
  const id = ++imageSeq;
  const live = () => state.images && state.images.id === id && !state.images.leaving;
  state.images = { id, galleryKey: prev ? (prev.galleryKey || prev.id) : id, q: query, status: 'loading', provider, items: prev ? prev.items : [], nextStart: prev ? prev.nextStart : null, hidden: prev ? prev.hidden : 0, showHidden: prev ? prev.showHidden : false };
  render();
  try {
    let cached = null;
    try { cached = repo ? await repo.getTranslation(cacheKey) : null; } catch { /* miss */ }
    const r = cached ? cached.result : await searchImages(query, { provider, pixabayKey: state.pixabayKey, key: state.imagesKey, cx: state.imagesCx, start, num });
    if (!cached) { bumpUsage('images', provider); if (repo) { try { await repo.putTranslation({ key: cacheKey, text: query, result: r, at: new Date().toISOString() }); } catch { /* not fatal */ } } }
    if (!live()) return;
    const items = [...state.images.items, ...r.items.slice(0, GALLERY_MAX - state.images.items.length).map(i => ({ ...i, blobUrl: null, textLike: null }))];
    state.images = { ...state.images, status: 'ok', items, nextStart: r.nextStart, cached: !!cached };
    render();
    // thumbnails: fetch bytes (works cross-origin inside the extension), classify, show
    await Promise.all(items.filter(i => !i.blobUrl && !i.failed).map(async (item) => {
      try {
        const res = await fetch(item.thumb, { credentials: 'omit', signal: AbortSignal.timeout(15_000) });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const cls = await classifyThumbnail(blob, blob.type || 'image/jpeg');
        if (!live()) return;
        item.blobUrl = URL.createObjectURL(blob); galleryUrls.add(item.blobUrl);
        item.textLike = cls ? cls.textLike : false; item.analysis = cls;
      } catch (err) { item.failed = true; item.textLike = false; }
      if (live()) { state.images.hidden = state.images.items.filter(x => x.textLike).length; render(); }
    }));
  } catch (err) {
    if (live()) { state.images = { ...state.images, status: 'error', error: err.message }; render(); }
  }
}
function releaseGallery() { for (const u of galleryUrls) URL.revokeObjectURL(u); galleryUrls.clear(); }

function imagesHTML() {
  const g = state.images; if (!g) return '';
  const visible = g.items.filter(i => g.showHidden || !i.textLike);
  const provider = PROVIDER_LABEL[g.provider] || g.provider;
  const setup = g.provider === 'wikimedia' ? ` · <span class="meta">add a Pixabay key (or Google key + cx) in the popover for better pictures</span>` : '';
  const body = g.status === 'loading' && !g.items.length ? '<p class="meta">searching…</p>'
    : g.status === 'error' ? `<p class="xl-en err">No pictures here (${esc(g.error)}).</p>`
    : !g.items.length ? '<p class="meta">no pictures found</p>'
    : `<div class="image-gallery" data-gallery="${esc(g.galleryKey || g.id)}" role="list" tabindex="0" aria-label="pictures for ${esc(g.q)}">${visible.map(i => `<a class="thumb${i.textLike ? ' textlike' : ''}" role="listitem" href="${esc(i.page || i.url)}" target="_blank" rel="noopener" title="${esc(i.title || '')}">${i.blobUrl ? `<img src="${i.blobUrl}" alt="${esc(i.title || g.q)}" loading="lazy">` : (i.failed ? '<span class="ph">✕</span>' : '<span class="ph">…</span>')}</a>`).join('')}</div>`;
  const hiddenNote = g.hidden ? `<span role="button" tabindex="0" class="xlate" data-act="images-toggle">${g.showHidden ? 'hide' : 'show'} ${g.hidden} text-only</span> · ` : '';
  const more = g.items.length < GALLERY_MAX && g.nextStart && g.status !== 'loading' ? `<span role="button" tabindex="0" class="xlate" data-act="images-more">more</span> · ` : '';
  return `<section class="detail gal${g.leaving ? ' leaving' : ''}" id="images-panel" aria-label="pictures"${g.leaving ? ' aria-hidden="true"' : ''}>
    <div class="top"><h3 class="xl-h">pictures · ${esc(g.q)}</h3><button class="close" data-act="images-close" aria-label="close pictures">×</button></div>
    ${body}
    <p class="meta xl-foot">${hiddenNote}${more}${esc(provider)}${g.cached ? ' · cached' : ''}${setup} · <a href="${esc(googleImagesUrl(g.q))}" target="_blank" rel="noopener">open in Google Images ⇗</a></p>
  </section>`;
}

const picturesLink = (text) => `<span class="xlate" role="button" tabindex="0" data-act="images" data-text="${esc(text)}" title="Search pictures for this word">pictures</span>`;

function translationHTML() {
  const t = state.translation; if (!t) return '';
  const lang = TARGETS[state.translateTo] || 'English';
  const waiting = t.retryAt > Date.now();
  const errorText = t.code === 'rate-limited' && !waiting ? 'Google paused inline translations. You can try again now, or open Google Translate below.' : t.error;
  const body = t.status === 'loading' ? `<p class="xl-en meta">translating…</p>`
    : t.status === 'error' ? `<p class="xl-en err">${esc(errorText)}</p>${t.details ? `<details class="meta"><summary>Google’s error details</summary><p>${esc(t.details)}</p></details>` : ''}${t.localMeaning ? `<p class="xl-local">From your Nihongo material (English): <strong>${esc(t.localMeaning)}</strong></p>` : ''}<div class="row">${t.provider === 'cloud' ? `<button class="btn" data-act="xlate-use-web" data-text="${esc(t.text)}">Use Google Translate without a key</button><a href="https://docs.cloud.google.com/translate/docs/setup" target="_blank" rel="noopener">Cloud setup help ⇗</a>` : ''}${t.retryable !== false ? `<button class="btn" data-act="xlate-retry" data-text="${esc(t.text)}" ${waiting ? 'disabled' : ''}>${waiting ? 'Waiting before retry' : 'Try translation again'}</button>` : ''}</div>`
    : `<p class="xl-en">${esc(t.result.translation)}</p>${t.result.senses && t.result.senses.length ? `<dl class="xl-senses">${t.result.senses.map(s => `<dt>${esc(s.pos)}</dt><dd>${s.terms.map(esc).join(' · ')}</dd>`).join('')}</dl>` : ''}`;
  return `<section class="detail xl${t.leaving ? ' leaving' : ''}" id="xlate-panel" aria-label="translation" aria-live="polite"${t.leaving ? ' aria-hidden="true"' : ''}>
    <div class="top"><h3 class="xl-h">translation · ${esc(lang)}</h3><button class="close" data-act="xlate-close" aria-label="close translation">×</button></div>
    <p class="xl-ja" lang="ja">${esc(t.text)}${t.status === 'ok' && t.result.romaji ? ` <small>${esc(t.result.romaji)}</small>` : ''}</p>
    ${body}
    <p class="meta xl-foot">${t.status === 'ok' ? picturesLink(t.text) + ' · ' : ''}${t.status === 'ok' ? (t.result.provider === 'cloud' ? 'Google Cloud Translation (your key)' : 'Google Translate') + (t.cached ? ' · cached' : '') : ''} · <a href="${esc(gtUrl(t.text, state.translateTo))}" target="_blank" rel="noopener">open in Google Translate ⇗</a></p>
  </section>`;
}

function wordPanelHTML() {
  const a = state.analysis; if (!a) return '';
  const sel = state.selection;
  const toks = a.tokens.filter(t => sel.tokenIds.includes(t.tokenId)).sort((x, y) => x.startUtf16 - y.startUtf16);
  if (!toks.length) return '';
  const idx = state.library && state.library.index;
  const surface = toks.map(t => t.surface).join('');
  const kana = toks.map(t => t.reading ? t.reading.value : t.surface).join(toks.length > 1 ? ' ' : '');
  const romaji = toks.map(tokenRomaji).join(toks.length > 1 ? ' ' : '');
  const single = toks.length === 1;
  const lemma = single && toks[0].lemma && toks[0].lemma !== toks[0].surface ? toks[0].lemma : null;
  const forms = toks.filter(t => t.conjugatedForm).map(t => `${t.surface}: ${t.conjugatedForm}`);
  const known = toks.every(t => t.lexical === 'known');
  const words = single ? [] : toks.filter(t => iterateKanji(t.surface).some(k => k.kanjiKey && !k.repetition) || /[ぁ-ゖァ-ヺ]{2,}/.test(t.surface) && t.pos !== 'particle');
  const kanji = []; const seen = new Set();
  for (const t of toks) for (const k of iterateKanji(t.surface)) if (k.kanjiKey && !k.repetition && !seen.has(k.kanjiKey)) { seen.add(k.kanjiKey); kanji.push({ ...k, word: t.surface }); }
  const cardsOf = single ? wordCards(idx, surface, toks[0].lemma) : [];
  const chip = (k) => {
    const av = availabilityFor(idx, k.kanjiKey);
    const c = cardsFor(idx, k.kanjiKey).preferred;
    const reading = c ? [c.readings.kun, c.readings.on].filter(Boolean).join(' · ') : '';
    return `<button class="kchip" data-act="kanji" data-glyph="${esc(k.glyph)}" data-word="${esc(k.word)}" aria-label="${esc(k.glyph)} — ${av === 'standalone' ? 'in your cards' : av === 'compound-only' ? 'inside a compound card' : 'no card'}"><span class="g" lang="ja">${esc(k.glyph)}</span>${reading ? `<small lang="ja">${esc(reading)}</small>` : ''}<span class="dot ${av}"></span></button>`;
  };
  return `<section class="detail" id="word-panel" tabindex="-1" aria-label="word details">
    <div class="top"><h2 lang="ja">${sel.parent ? `<button class="back" data-act="back-phrase" aria-label="back to the phrase">‹</button>` : ''}${esc(surface)}<small>${esc(kana)} · ${esc(romaji)}</small></h2><span class="row tight">${ttsAvailable() ? `<button class="btn mini" data-act="listen" data-text="${esc(surface)}" aria-label="listen">🔊</button>` : ''}<button class="close" data-act="close" aria-label="close">×</button></span></div>
    <dl>${lemma ? `<dt>dictionary form</dt><dd lang="ja">${esc(lemma)}</dd>` : ''}${(() => { const m = meaningOf(surface, single ? toks[0].lemma : null); return `<dt>meaning</dt><dd>${m ? `${esc(m.meaning)} <span class="meta">· ${esc(SOURCE_LABEL[m.source] || m.source.split(':')[0])}</span>${m.seen ? `<div class="meta seen">${esc(m.seen)}</div>` : ''} · ${translateLink(surface)}` : `<span class="meta">not in your Nihongo material</span> · ${translateLink(surface)}`}${isWordLike(surface) ? ` · <span class="xlate" role="button" tabindex="0" data-act="images" data-text="${esc(surface)}" title="Show pictures for this word">pictures</span>` : ''}</dd>`; })()}<dt>part of speech</dt><dd>${esc(toks.map(t => t.pos).join(' + '))}</dd>${forms.length ? `<dt>form</dt><dd>${esc(forms.join(', '))}</dd>` : ''}<dt>dictionary</dt><dd>${known ? 'known word' : 'not in the tokenizer dictionary — may be a name'}</dd>${cardsOf.length ? `<dt>your cards</dt><dd>${cardsOf.map(c => esc(c.cardKey)).join(', ')}</dd>` : ''}</dl>
    ${words.length ? `<h3>Words</h3><div class="wlist" role="list">${words.map(t => { const m = meaningOf(t.surface, t.lemma); const wc = wordCards(idx, t.surface, t.lemma); return `<button class="wrow" role="listitem" data-act="word" data-token="${t.tokenId}" lang="ja"><span class="jp"><b>${esc(t.surface)}</b><small>${t.reading ? esc(t.reading.value) + ' · ' : ''}${esc(tokenRomaji(t))}</small></span><span class="right">${m ? `<span class="en">${esc(m.meaning)}</span> · ` : ''}<em>${esc(t.pos)}${wc.length ? ' · card' : ''}</em>${m ? '' : ` · ${translateLink(t.surface)}`}</span></button>`; }).join('')}</div><hr class="sep">` : ''}
    ${kanji.length ? `<h3>Kanji</h3><div class="kbtns" role="list" aria-label="kanji in this ${words.length ? 'phrase' : 'word'}">${kanji.map(chip).join('')}</div>` : '<p class="meta">no kanji here</p>'}
  </section>`;
}

function kanjiPanelHTML() {
  const k = state.kanji; const c = k.card; const info = k.info || {}; const agg = info.aggregate; const st = info.state || {};
  const avail = { standalone: 'In your cards', 'compound-only': 'Only inside a compound card', none: state.library ? 'No standalone kanji card' : 'No library imported' }[k.availability];
  const famBtn = (f, label) => `<button data-act="fam" data-f="${f}" aria-pressed="${(st.familiarity || 'unassessed') === f}">${label}</button>`;
  const img = c && c.image ? (k.imageUrl ? `<img src="${k.imageUrl}" alt="mnemonic picture for ${esc(k.glyph)}">` : `<span>${k.imageMissing ? 'picture missing from the imported library' : 'loading…'}</span>`) : `<span>${c ? 'this card has no picture yet' : ''}</span>`;
  const back = state.selection ? `<button class="back" data-act="back-word" aria-label="back to the word">‹</button>` : '';
  return `<section class="detail" id="kanji-panel" tabindex="-1" aria-label="kanji details">
    <div class="top"><h2 lang="ja">${back}${esc(k.glyph)}<small>in ${esc(k.word)}</small></h2><button class="close" data-act="close" aria-label="close">×</button></div>
    <p class="avail ${k.availability}">${avail}${c ? ` · ${esc(c.cardKey)}` : ''}${k.cards.standalone.length > 1 ? ` · ${k.cards.standalone.length} cards match` : ''}${k.availability === 'compound-only' ? ` · ${k.cards.compounds.map(x => esc(x.glyph)).join(', ')}` : ''}</p>
    <div class="card"><div class="img">${c ? img : `<span class="glyph" lang="ja">${esc(k.glyph)}</span>`}</div><div>
      ${c ? `<dl><dt>readings</dt><dd lang="ja">${esc([c.readings.kun, c.readings.on].filter(Boolean).join(' · ') || '—')}</dd>${k.revealed ? `<dt>keyword</dt><dd>${esc(c.keyword || '—')}</dd>` : ''}</dl>${k.revealed ? (c.story ? `<p class="story">${esc(c.story)}${c.heisigFrame ? ` <span class="meta">(Heisig #${c.heisigFrame})</span>` : ''}</p>` : '<p class="meta">no mnemonic story on this card</p>') : `<button class="btn reveal" data-act="reveal">Reveal keyword & story</button>`}` : kanjiDictHTML(k.glyph)}
    </div></div>
    <div class="fam" role="group" aria-label="familiarity">${famBtn('unassessed', 'unassessed')}${famBtn('unfamiliar', 'unfamiliar')}${famBtn('learning', 'learning')}${famBtn('familiar', 'familiar')}</div>
    <p class="meta enc">Studied encounters: <strong>${agg ? agg.count : 0}</strong>${agg ? ` · first ${esc(agg.firstAt.slice(0, 10))} · last ${esc(agg.lastAt.slice(0, 10))} · ${agg.sourceCount} source${agg.sourceCount === 1 ? '' : 's'}${agg.lastSource && agg.lastSource.title ? ` · last from ${esc(agg.lastSource.title)}` : ''}` : ' · counted once per sentence you open, per reading session'}</p>
    <div class="row"><label><input type="checkbox" data-act="want" ${st.wantCard ? 'checked' : ''}> Want a flashcard</label><a class="btn" href="${esc(state.appUrl)}#flashcards" target="_blank" rel="noopener">Open in Nihongo</a></div>
  </section>`;
}

// ── events ────────────────────────────────────────────────────────────────
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act], .ss-blk[data-tokens]');
  if (!btn) return;
  if (btn.classList.contains('ss-blk')) {
    state.selection = { tokenIds: btn.dataset.tokens.split(',').filter(Boolean) }; state.kanji = null; retireTranslation(); render();
    document.getElementById('word-panel')?.focus();
    return;
  }
  const act = btn.dataset.act;
  if (act === 'import') { document.getElementById('zip').click(); return; }
  if (act === 'sync') { await ensureLibrary({ force: true }); return; }
  if (act === 'study-paste') {
    const text = document.getElementById('paste').value.trim(); if (!text) return;
    state.paste = '';
    setCapture({ captureId: `paste-${Date.now()}`, status: 'ready', payload: { captureKind: 'paste', blocks: text.split(/\n{2,}/).map(t => ({ text: t, ruby: [] })), source: { url: null, title: null, domain: 'paste', capturedAt: new Date().toISOString() } } });
    return;
  }
  if (act === 'prev' || act === 'next' || act === 'goto') {
    const i = act === 'goto' ? Number(btn.dataset.i) : state.active + (act === 'next' ? 1 : -1);
    if (i < 0 || i >= state.sentences.length) return;
    state.active = i; state.selection = null; state.kanji = null; analyzeActive(); return;
  }
  if (act === 'clear') { analysisSeq++; kanjiSeq++; state.capture = null; state.sentences = []; state.analysis = null; state.analyzing = false; state.selection = null; state.kanji = null; retireTranslation(); render(); return; }
  if (act === 'level') { state.level = btn.dataset.level; savePrefs({ level: state.level }); render(); return; }
  if (act === 'close') { kanjiSeq++; state.kanji = null; state.selection = null; retireTranslation(); render(); return; }
  if (act === 'word') { state.selection = { tokenIds: [btn.dataset.token], parent: state.selection }; state.kanji = null; retireTranslation(); render(); document.getElementById('word-panel')?.focus(); return; }
  if (act === 'back-phrase') { state.selection = state.selection.parent || null; retireTranslation(); render(); document.getElementById('word-panel')?.focus(); return; }
  if (act === 'back-word') { state.kanji = null; render(); document.getElementById('word-panel')?.focus(); return; }
  if (act === 'listen') { speak(btn.dataset.text, { rate: state.tts.rate, voiceURI: state.tts.voiceURI, remote: speakRemote }); return; }
  if (act === 'xlate') { requestTranslation(btn.dataset.text); return; }
  if (act === 'xlate-retry') { requestTranslation(btn.dataset.text); return; }
  if (act === 'xlate-use-web') {
    const previous = state.translation, text = btn.dataset.text;
    state.translateProvider = 'gtx';
    await savePrefs({ translateProvider: 'gtx' });
    if (state.translation === previous && !previous?.leaving) requestTranslation(text);
    return;
  }
  if (act === 'images') { requestImages(btn.dataset.text); return; }
  if (act === 'images-more') { requestImages(state.images && state.images.q, { more: true }); return; }
  if (act === 'images-toggle') { if (state.images) { state.images.showHidden = !state.images.showHidden; render(); } return; }
  if (act === 'images-close') { state.images = null; releaseGallery(); render(); return; }
  if (act === 'xlate-close') { clearTimeout(translationRetryTimer); state.translation = null; render(); return; }
  if (act === 'kanji') { retireTranslation(); await openKanji(btn.dataset.glyph, btn.dataset.word); return; }
  if (act === 'reveal') { state.kanji.revealed = true; render(); return; }
  if (act === 'fam') { await setFamiliarity(btn.dataset.f); return; }
});
document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.id === 'zip' && el.files && el.files[0]) { await importZip(el.files[0]); el.value = ''; return; }
  if (el.dataset.act === 'romaji') { state.romaji = el.checked; savePrefs({ romaji: state.romaji }); render(); return; }
  if (el.dataset.act === 'furigana') { state.furigana = el.checked; savePrefs({ furigana: state.furigana }); render(); return; }
  if (el.dataset.act === 'want') { await toggleWantCard(); return; }
});
document.addEventListener('input', (e) => { if (e.target.id === 'paste') state.paste = e.target.value; });
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.xlate[role="button"]')) { e.preventDefault(); e.stopPropagation(); if (e.target.dataset.act === 'xlate') { requestTranslation(e.target.dataset.text); } else e.target.click(); return; }
  if (e.key !== 'Escape') return;
  kanjiSeq++;
  if (state.kanji) { state.kanji = null; render(); document.getElementById('word-panel')?.focus(); }
  else if (state.selection && state.selection.parent) { state.selection = state.selection.parent; render(); }
  else if (state.selection) { state.selection = null; render(); }
});

// ── test hooks ────────────────────────────────────────────────────────────
window.__reader = {
  state,
  init: () => send('INIT'),
  tokenize: (text) => send('TOKENIZE', { text }),
  analyze: (text) => send('ANALYZE', { text }),
  studyText: (text) => { setCapture({ captureId: `paste-${Date.now()}`, status: 'ready', payload: { captureKind: 'paste', blocks: [{ text, ruby: [] }], source: { url: null, title: null, domain: 'paste', capturedAt: new Date().toISOString() } } }); return new Promise(r => setTimeout(r, 0)); },
  openKanji,
  importZipBytes: async (bytes, name = 'library.zip') => importZip(new File([bytes], name)),
  setCapture,
  render,
  async bench(text, n = 20) { const samples = []; for (let i = 0; i < n; i++) { const r = await send('TOKENIZE', { text }); samples.push(r.ms); } const s = [...samples].sort((a, b) => a - b); const pct = (p) => s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]; return { runs: n, chars: text.length, p50: pct(50), p95: pct(95), samples }; },
  pageMemory: () => (performance.memory ? { usedJSHeapSize: performance.memory.usedJSHeapSize } : null),
  cspProbe() { const out = { evalBlocked: null, functionCtorBlocked: null, inlineBlocked: null }; try { (0, eval)('1'); out.evalBlocked = false; } catch { out.evalBlocked = true; } try { new Function('return 1')(); out.functionCtorBlocked = false; } catch { out.functionCtorBlocked = true; } try { window.__inlineRan = false; const s = document.createElement('script'); s.textContent = 'window.__inlineRan = true'; document.body.appendChild(s); s.remove(); out.inlineBlocked = !window.__inlineRan; } catch { out.inlineBlocked = true; } return out; },
};
// The probe deliberately triggers a CSP violation, so it only runs when a test asks for it (sidepanel.html?probe=csp).
if (new URLSearchParams(location.search).get('probe') === 'csp') window.__cspProbe = window.__reader.cspProbe();
document.addEventListener('DOMContentLoaded', boot);
