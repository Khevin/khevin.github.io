import { test } from 'node:test';
import assert from 'node:assert/strict';
import { counted, summarize, overCap, today, DAILY_CAP, bump, read } from '../../src/panel/usage.js';

const AT = new Date('2026-09-09T14:00:00').getTime();
const NEXT = new Date('2026-09-10T09:00:00').getTime();

test('counts are kept per kind, per provider, per local day', () => {
  let u = counted(undefined, 'images', 'google', AT);
  u = counted(u, 'images', 'google', AT);
  u = counted(u, 'images', 'pixabay', AT);
  u = counted(u, 'translate', 'gtx', AT);
  assert.equal(u.date, today(AT));
  assert.deepEqual(u.images, { google: 2, pixabay: 1 });
  assert.deepEqual(u.translate, { gtx: 1 });

  const tomorrow = counted(u, 'images', 'google', NEXT);
  assert.equal(tomorrow.date, today(NEXT));
  assert.deepEqual(tomorrow.images, { google: 1 }, 'a new day starts from zero, it does not accumulate');
  assert.equal(tomorrow.translate, undefined);
});

test('the summary names the cap that actually bites and stays quiet otherwise', () => {
  assert.match(summarize(null, AT), /nothing sent/);
  assert.match(summarize({ date: today(AT) }, AT), /nothing sent/, 'an empty day is not a report');
  assert.match(summarize({ date: '2000-01-01', images: { google: 40 } }, AT), /nothing sent/, 'yesterday is not today');

  const u = { date: today(AT), images: { google: 7, pixabay: 3 }, translate: { gtx: 2, cloud: 1 } };
  const line = summarize(u, AT);
  assert.match(line, /7 of 100 Google picture searches/, 'the 100-a-day free tier is the number worth showing');
  assert.match(line, /3 from pixabay/);
  assert.match(line, /3 translations/, 'providers are summed for translation, which has no per-request cap');
  assert.equal(DAILY_CAP.google, 100);
  assert.match(summarize({ date: today(AT), translate: { gtx: 1 } }, AT), /1 translation\b/, 'singular reads correctly');
});

test('the cap flag turns on at the limit, not after it is exceeded', () => {
  assert.equal(overCap({ date: today(AT), images: { google: 99 } }, AT), false);
  assert.equal(overCap({ date: today(AT), images: { google: 100 } }, AT), true);
  assert.equal(overCap({ date: '2000-01-01', images: { google: 500 } }, AT), false, 'an old count does not block today');
  assert.equal(overCap(null, AT), false);
});

test('bump persists through storage and survives a storage that throws', async () => {
  let store = {};
  const ok = { get: async (k) => ({ [k]: store[k] }), set: async (o) => { Object.assign(store, o); } };
  await bump('images', 'google', ok);
  await bump('images', 'google', ok);
  assert.equal(store.usage.images.google, 2);
  assert.equal((await read(ok)).images.google, 2);

  const broken = { get: async () => { throw new Error('storage gone'); }, set: async () => {} };
  assert.equal(await bump('translate', 'gtx', broken), null, 'a counter must never break the feature it counts');
  assert.equal(await read(broken), null);
  assert.equal(await bump('translate', 'gtx', null), null);
});
