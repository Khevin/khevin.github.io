/*
 * reader-core/encounters.js — studied-encounter identity, session policy,
 * projections, and merge/void rules (handoff §7). Pure ESM; storage lives in
 * the extension's repository module, which calls these functions inside its
 * IndexedDB transactions.
 *
 * An encounter is "a kanji in a sentence explicitly opened for study", counted
 * once per (installationId, sessionId, sentenceKey, kanjiKey). The event ID
 * is derived from exactly those fields, so retries, re-renders, duplicate
 * tabs, and repeated imports collapse onto the same ID.
 */
import { sha256Hex, distinctKanji, iterateKanji } from './text.js';

export const EVENT_ID_VERSION = 1;
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Stable event identity: hash of a version-tagged canonical JSON array. No
 * string concatenation with ambiguous separators.
 * @param {{installationId:string,sessionId:string,sentenceKey:string,kanjiKey:string}} k
 * @returns {Promise<string>}
 */
export function eventId(k) {
  return sha256Hex(JSON.stringify(['encounter', EVENT_ID_VERSION, k.installationId, k.sessionId, k.sentenceKey, k.kanjiKey]));
}

/**
 * Build the encounter events for one study action. One event per distinct
 * kanji key in the sentence (repeats within the sentence do not add events).
 * @param {object} a
 * @param {string} a.installationId
 * @param {string} a.sessionId
 * @param {string} a.sentenceKey
 * @param {string} a.displayText
 * @param {string} a.occurredAt UTC ISO
 * @param {string} a.actionId  idempotency key of the study request
 * @param {object} a.source    SourceRef
 * @param {(kanjiKey:string)=>string|null} [a.wordFor] containing word lookup
 * @returns {Promise<object[]>} EncounterEvent[]
 */
export async function buildEvents(a) {
  const glyphByKey = new Map();
  for (const k of iterateKanji(a.displayText)) if (!k.repetition && k.kanjiKey && !glyphByKey.has(k.kanjiKey)) glyphByKey.set(k.kanjiKey, k.glyph);
  const keys = distinctKanji(a.displayText);
  return Promise.all(keys.map(async (kanjiKey) => ({
    eventId: await eventId({ installationId: a.installationId, sessionId: a.sessionId, sentenceKey: a.sentenceKey, kanjiKey }),
    installationId: a.installationId,
    sessionId: a.sessionId,
    sentenceKey: a.sentenceKey,
    kanjiKey,
    occurredAt: a.occurredAt,
    actionId: a.actionId,
    source: a.source,
    glyph: glyphByKey.get(kanjiKey) || kanjiKey,
    word: a.wordFor ? a.wordFor(kanjiKey) : null,
  })));
}

/**
 * Session policy. A session is global to the installation, starts on the
 * first study action, ends explicitly, or expires after 30 minutes without a
 * study action. A new browser run always starts a new session.
 * @param {{sessionId:string,browserRunId:string,lastStudyAt:string,endedAt?:string|null}|null} current
 * @param {{now:string,browserRunId:string,newSessionId:()=>string}} ctx
 * @returns {{session:object, isNew:boolean}}
 */
export function resolveSession(current, ctx) {
  const nowMs = Date.parse(ctx.now);
  const reusable = current
    && !current.endedAt
    && current.browserRunId === ctx.browserRunId
    && nowMs - Date.parse(current.lastStudyAt) < SESSION_TIMEOUT_MS;
  if (reusable) return { session: { ...current, lastStudyAt: ctx.now }, isNew: false };
  return {
    session: { installationId: current?.installationId, sessionId: ctx.newSessionId(), browserRunId: ctx.browserRunId, startedAt: ctx.now, lastStudyAt: ctx.now, endedAt: null },
    isNew: true,
  };
}

/**
 * Merge incoming events and voids into an existing store view. Events are
 * keyed by eventId; a void always wins over any copy of its event, whatever
 * order the files arrive in. Returns a new store, never mutates inputs.
 * @param {{events:Map<string,object>,voids:Map<string,object>}} store
 * @param {{events?:object[],voids?:object[]}} incoming
 * @returns {{events:Map<string,object>,voids:Map<string,object>,added:number,voided:number,ignored:number}}
 */
export function merge(store, incoming) {
  const events = new Map(store.events);
  const voids = new Map(store.voids);
  let added = 0, voided = 0, ignored = 0;
  for (const v of (incoming.voids || [])) {
    if (!voids.has(v.eventId)) { voids.set(v.eventId, v); voided++; }
  }
  for (const e of (incoming.events || [])) {
    if (voids.has(e.eventId) || events.has(e.eventId)) { ignored++; continue; }
    events.set(e.eventId, e);
    added++;
  }
  return { events, voids, added, voided, ignored };
}

/** Events that count: present and not voided. */
export function activeEvents(store) {
  return [...store.events.values()].filter(e => !store.voids.has(e.eventId));
}

/**
 * Void every event created by one study action (undo). Returns the void
 * records to persist; re-rendering the sentence later must not recreate them
 * because the same eventIds are now in the void set.
 * @param {{events:Map<string,object>}} store
 * @param {string} actionId
 * @param {{installationId:string,now:string,reason?:'undo'|'delete'|'reset'}} ctx
 */
export function voidAction(store, actionId, ctx) {
  return [...store.events.values()].filter(e => e.actionId === actionId).map(e => ({
    eventId: e.eventId, voidedAt: ctx.now, installationId: ctx.installationId, reason: ctx.reason || 'undo',
  }));
}

/**
 * Rebuild per-kanji aggregates from active events. Pure projection: counts,
 * first/last timestamps, distinct sources (by URL, else domain), sentences.
 * @param {{events:Map<string,object>,voids:Map<string,object>}} store
 * @returns {Map<string, object>} kanjiKey -> KanjiAggregate
 */
export function projectAggregates(store) {
  const out = new Map();
  const sources = new Map();
  const sentences = new Map();
  for (const e of activeEvents(store)) {
    let a = out.get(e.kanjiKey);
    if (!a) { a = { kanjiKey: e.kanjiKey, count: 0, firstAt: null, lastAt: null, sourceCount: 0, sentenceCount: 0 }; out.set(e.kanjiKey, a); sources.set(e.kanjiKey, new Set()); sentences.set(e.kanjiKey, new Set()); }
    a.count++;
    if (!a.firstAt || e.occurredAt < a.firstAt) a.firstAt = e.occurredAt;
    if (!a.lastAt || e.occurredAt > a.lastAt) a.lastAt = e.occurredAt;
    sources.get(e.kanjiKey).add(e.source?.url || e.source?.domain || '');
    sentences.get(e.kanjiKey).add(e.sentenceKey);
  }
  for (const [k, a] of out) { a.sourceCount = sources.get(k).size; a.sentenceCount = sentences.get(k).size; }
  return out;
}

/**
 * Familiarity snapshots carry a per-installation monotonic revision; an
 * incoming state replaces the stored one only when its revision is higher for
 * the same installation. Different installations never silently merge.
 * @param {object|null} stored KanjiState
 * @param {object} incoming KanjiState
 * @returns {{accept:boolean, reason:string}}
 */
export function acceptKanjiState(stored, incoming) {
  if (!stored) return { accept: true, reason: 'new' };
  if (stored.installationId !== incoming.installationId) return { accept: false, reason: 'conflict:different-installation' };
  if (incoming.revision > stored.revision) return { accept: true, reason: 'newer-revision' };
  return { accept: false, reason: 'stale' };
}
