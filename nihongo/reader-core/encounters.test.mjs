import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sentenceKey } from './text.js';
import { validate } from './contracts.js';
import { eventId, buildEvents, resolveSession, merge, activeEvents, voidAction, projectAggregates, acceptKanjiState, SESSION_TIMEOUT_MS } from './encounters.js';

const NOW = '2026-09-08T12:00:00.000Z';
const later = (ms) => new Date(Date.parse(NOW) + ms).toISOString();
const source = (url) => ({ url, domain: new URL(url).hostname, title: 't', capturedAt: NOW });
const nintendo = source('https://www.nintendo.com/jp/games/switch2/aa9ja/triforce/index.html');
const other = source('https://example.jp/article');

const base = { installationId: 'inst-A', sessionId: 'sess-1', occurredAt: NOW, source: nintendo };
async function study(text, over = {}) {
  const a = { ...base, ...over, displayText: text, sentenceKey: await sentenceKey(text), actionId: over.actionId || `act-${Math.random().toString(36).slice(2)}` };
  return buildEvents(a);
}
const emptyStore = () => ({ events: new Map(), voids: new Map() });
const count = (store, kanji) => projectAggregates(store).get(kanji)?.count ?? 0;

test('eventId is a version-tagged hash, deterministic, and sensitive to every natural-key field', async () => {
  const k = { installationId: 'i', sessionId: 's', sentenceKey: 'k', kanjiKey: '森' };
  const a = await eventId(k);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await eventId({ ...k }));
  for (const f of Object.keys(k)) assert.notEqual(a, await eventId({ ...k, [f]: k[f] + 'x' }), f);
  // separators cannot be gamed: "a/b" + "c" ≠ "a" + "b/c"
  assert.notEqual(await eventId({ ...k, installationId: 'a/b', sessionId: 'c' }), await eventId({ ...k, installationId: 'a', sessionId: 'b/c' }));
});

test('opening a sentence yields one valid event per distinct kanji; repeats inside the sentence do not add', async () => {
  const events = await study('森の森で森を見る。人々が来る。');
  assert.deepEqual(events.map(e => e.kanjiKey).sort(), ['人', '来', '森', '見'].sort());
  for (const e of events) assert.deepEqual(validate('EncounterEvent', e), { ok: true, errors: [] });
});

test('counting table: same sentence again in the session = 0; another sentence = +1; new session = +1', async () => {
  let store = emptyStore();
  store = merge(store, { events: await study('コキリの森で暮らす少年。') });
  assert.equal(count(store, '森'), 1);
  // reopen / re-render / retry (different actionId, same natural key)
  const again = merge(store, { events: await study('コキリの森で暮らす少年。') });
  assert.equal(again.added, 0);
  assert.equal(count(again, '森'), 1);
  // identical text in another tab, same session: layout break differs, key does not
  const otherTab = merge(again, { events: await study('コキリの森で\n暮らす少年。', { source: other }) });
  assert.equal(count(otherTab, '森'), 1);
  // another sentence containing 森
  const second = merge(otherTab, { events: await study('森の守り神から告げられる。') });
  assert.equal(count(second, '森'), 2);
  // new reading session
  const newSession = merge(second, { events: await study('コキリの森で暮らす少年。', { sessionId: 'sess-2' }) });
  assert.equal(count(newSession, '森'), 3);
  const agg = projectAggregates(newSession).get('森');
  assert.equal(agg.sentenceCount, 2);
  assert.equal(agg.sourceCount, 1);
  assert.equal(validate('KanjiAggregate', agg).ok, true);
});

test('importing the same event file twice adds nothing the second time', async () => {
  const file = { events: await study('猫が魚を食べた。') };
  const once = merge(emptyStore(), file);
  const twice = merge(once, file);
  assert.equal(once.added, 3);
  assert.equal(twice.added, 0);
  assert.equal(twice.ignored, 3);
});

test('undo voids only that action; re-rendering does not resurrect; an older file cannot revive a voided event', async () => {
  const first = await study('雨が降った。', { actionId: 'act-1' });
  const second = await study('家にいた。', { actionId: 'act-2' });
  let store = merge(emptyStore(), { events: [...first, ...second] });
  const voids = voidAction(store, 'act-1', { installationId: 'inst-A', now: later(1000) });
  assert.equal(voids.length, 2);
  for (const v of voids) assert.equal(validate('EventVoid', v).ok, true);
  store = merge(store, { voids });
  assert.equal(count(store, '雨'), 0);
  assert.equal(count(store, '家'), 1);
  // re-render creates the same eventIds → still voided
  const rerender = merge(store, { events: await study('雨が降った。', { actionId: 'act-9' }) });
  assert.equal(rerender.added, 0);
  assert.equal(count(rerender, '雨'), 0);
  // an "older" export that still contains the event, imported after the void: void wins
  const stale = merge(emptyStore(), { events: first });                 // receiving store had the event…
  const withVoid = merge(stale, { voids });                              // …then learned about the void…
  const revived = merge(withVoid, { events: first });                    // …and an old file arrives again
  assert.equal(activeEvents(revived).length, 0);
  // void arriving BEFORE its event also wins
  const voidFirst = merge(merge(emptyStore(), { voids }), { events: first });
  assert.equal(activeEvents(voidFirst).length, 0);
});

test('session policy: reuse within 30 min in the same browser run; expire, explicit end, or new run start a new one', () => {
  let n = 1;
  const ctx = (now, run = 'run-1') => ({ now, browserRunId: run, newSessionId: () => `sess-${++n}` });
  const s1 = { installationId: 'inst-A', sessionId: 'sess-1', browserRunId: 'run-1', startedAt: NOW, lastStudyAt: NOW, endedAt: null };
  const r1 = resolveSession(s1, ctx(later(10 * 60 * 1000)));
  assert.equal(r1.isNew, false);
  assert.equal(r1.session.sessionId, 'sess-1');
  assert.equal(r1.session.lastStudyAt, later(10 * 60 * 1000));
  assert.equal(resolveSession(s1, ctx(later(SESSION_TIMEOUT_MS))).isNew, true);           // exactly 30 min → expired
  assert.equal(resolveSession({ ...s1, endedAt: later(1) }, ctx(later(2))).isNew, true);  // explicit end
  const r4 = resolveSession(s1, ctx(later(5), 'run-2'));                                    // browser restart
  assert.equal(r4.isNew, true);
  assert.equal(validate('SessionRecord', r4.session).ok, true);
  assert.equal(resolveSession(null, ctx(NOW)).isNew, true);
});

test('familiarity snapshots: newer revision from the same installation wins; other installations conflict', () => {
  const stored = { kanjiKey: '森', familiarity: 'learning', wantCard: false, revision: 2, installationId: 'inst-A', updatedAt: NOW };
  assert.deepEqual(acceptKanjiState(null, stored), { accept: true, reason: 'new' });
  assert.equal(acceptKanjiState(stored, { ...stored, revision: 3 }).accept, true);
  assert.equal(acceptKanjiState(stored, { ...stored, revision: 2 }).accept, false);
  assert.equal(acceptKanjiState(stored, { ...stored, revision: 9, installationId: 'inst-B' }).reason, 'conflict:different-installation');
});
