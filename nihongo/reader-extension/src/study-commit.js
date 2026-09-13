/*
 * study-commit.js — the one place a "sentence opened for study" becomes
 * encounter events: session policy (reader-core/encounters.js), event
 * construction, and the single-transaction repository write.
 *
 * `kv` abstracts the small key/value stores so the same code runs in the
 * service worker (chrome.storage.local + chrome.storage.session) and in the
 * panel when no extension runtime exists (localStorage + sessionStorage, used
 * by the served-dist e2e). Shape: { local: {get(k), set(k,v)}, session: {get(k), set(k,v)} }.
 */
import { openRepo } from './repository.js';
import { resolveSession, buildEvents } from '../../reader-core/encounters.js';
import { sentenceKey, fingerprint, NORMALIZATION_VERSION } from '../../reader-core/text.js';

const uuid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

// IDB deduplicates event IDs, but only after identity/session assignment. Two
// first requests must not mint different identities before reaching that write.
// Web Locks also coordinates extension pages sharing this storage origin.
let queue = Promise.resolve();
function withStudyLock(fn) {
  if (globalThis.navigator?.locks) return navigator.locks.request('nihongo-reader-study', fn);
  const result = queue.then(fn);
  queue = result.catch(() => {});
  return result;
}

async function readInstallationId(kv) {
  let id = await kv.local.get('installationId');
  if (!id) { id = `inst-${uuid()}`; await kv.local.set('installationId', id); }
  return id;
}

export function ensureInstallationId(kv) { return withStudyLock(() => readInstallationId(kv)); }

async function readBrowserRunId(kv) {
  let id = await kv.session.get('browserRunId');
  if (!id) { id = `run-${uuid()}`; await kv.session.set('browserRunId', id); }
  return id;
}
export function ensureBrowserRunId(kv) { return withStudyLock(() => readBrowserRunId(kv)); }

/**
 * payload: { actionId, displayText, source, captureKind, fragment, rubySpans? }
 * Idempotent: identical natural keys yield identical eventIds; the repository
 * skips duplicates inside one transaction, so retries and re-renders add 0.
 */
export function commitStudy(payload, kv, options = {}) {
  return withStudyLock(() => commitStudyLocked(payload, kv, options));
}

async function commitStudyLocked(payload, kv, { now = new Date().toISOString() } = {}) {
  const installationId = await readInstallationId(kv);
  const runId = await readBrowserRunId(kv);
  const current = await kv.local.get('session');
  const { session, isNew } = resolveSession(current ? { ...current, installationId } : null, { now, browserRunId: runId, newSessionId: () => `sess-${uuid()}` });
  session.installationId = installationId;
  await kv.local.set('session', session);

  const key = await sentenceKey(payload.displayText);
  const events = await buildEvents({ installationId, sessionId: session.sessionId, sentenceKey: key, displayText: payload.displayText, occurredAt: now, actionId: payload.actionId, source: payload.source });
  const repo = await openRepo();
  try {
    await repo.putSession(session);
    const sentence = { sentenceKey: key, normalizationVersion: NORMALIZATION_VERSION, displayText: payload.displayText, fingerprintText: fingerprint(payload.displayText), captureKind: payload.captureKind || 'paste', fragment: !!payload.fragment, rubySpans: payload.rubySpans || undefined };
    const r = await repo.commitStudy({ events, sentence });
    return { ...r, sessionId: session.sessionId, newSession: isNew, sentenceKey: key, kanji: events.map(e => e.kanjiKey) };
  } finally { repo.close(); }
}

export function endSession(kv) { return withStudyLock(() => endSessionLocked(kv)); }

async function endSessionLocked(kv) {
  const session = await kv.local.get('session');
  if (!session) return null;
  session.endedAt = new Date().toISOString();
  await kv.local.set('session', session);
  const repo = await openRepo();
  try { await repo.putSession(session); } finally { repo.close(); }
  return session;
}

/** chrome.storage-backed kv for the service worker / panel. */
export function chromeKv() {
  const wrap = (area) => ({ get: async (k) => (await area.get(k))[k], set: (k, v) => area.set({ [k]: v }) });
  return { local: wrap(chrome.storage.local), session: wrap(chrome.storage.session) };
}

/** Web-storage-backed kv for pages without an extension runtime (tests). */
export function webStorageKv() {
  const wrap = (store) => ({ get: async (k) => { const v = store.getItem(`nihongo-reader:${k}`); return v == null ? undefined : JSON.parse(v); }, set: async (k, v) => store.setItem(`nihongo-reader:${k}`, JSON.stringify(v)) });
  return { local: wrap(localStorage), session: wrap(sessionStorage) };
}
