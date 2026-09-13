/*
 * repo-harness.js — bundled by tests/repository.test.mjs into an IIFE and
 * injected into a served blank page so the real IndexedDB path can be driven
 * from Playwright. Not part of the extension.
 */
import { openRepo, DB_NAME } from '../src/repository.js';
import { commitStudy, webStorageKv } from '../src/study-commit.js';
import { sentenceKey } from '../../reader-core/text.js';

const kv = webStorageKv();
window.__repo = {
  DB_NAME,
  kv,
  reset: async () => {
    localStorage.clear(); sessionStorage.clear();
    await new Promise((res, rej) => { const r = indexedDB.deleteDatabase(DB_NAME); r.onsuccess = res; r.onerror = () => rej(r.error); r.onblocked = res; });
  },
  study: (payload, opts) => commitStudy(payload, kv, opts),
  studyMany: (payloads) => Promise.all(payloads.map(p => commitStudy(p, kv))),
  count: async (kanji) => { const repo = await openRepo(); try { const k = await repo.getKanji(kanji); return k.aggregate ? k.aggregate.count : 0; } finally { repo.close(); } },
  kanji: async (kanji) => { const repo = await openRepo(); try { return await repo.getKanji(kanji); } finally { repo.close(); } },
  voidAction: async (actionId) => { const repo = await openRepo(); try { return await repo.voidAction(actionId, { installationId: await kv.local.get('installationId'), now: new Date().toISOString() }); } finally { repo.close(); } },
  setState: async (partial) => { const repo = await openRepo(); try { return await repo.setKanjiState(partial, await kv.local.get('installationId')); } finally { repo.close(); } },
  sentenceKey,
  newBrowserRun: async () => { sessionStorage.clear(); },
  expireSession: async () => { const s = await kv.local.get('session'); if (s) { s.lastStudyAt = new Date(Date.now() - 31 * 60 * 1000).toISOString(); await kv.local.set('session', s); } },
  session: () => kv.local.get('session'),
};
