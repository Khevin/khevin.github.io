import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGtx, translate, createTranslator, retryAfterMs, translateUrl, cacheKeyFor, TARGETS, parseCloudError, translationProviderFor } from '../../src/panel/translate.js';

test('parseGtx joins sentence translations and keeps dictionary senses', () => {
  const r = parseGtx({ sentences: [{ trans: 'Frontier / Remote region', orig: '辺境' }, { src_translit: 'Henkyō' }], dict: [{ pos: 'noun', terms: ['remote region', 'frontier'], base_form: '辺境' }] });
  assert.equal(r.translation, 'Frontier / Remote region');
  assert.equal(r.romaji, 'Henkyō');
  assert.deepEqual(r.senses, [{ pos: 'noun', terms: ['remote region', 'frontier'] }]);
  assert.throws(() => parseGtx({ sentences: [] }), /empty translation/);
  assert.throws(() => parseGtx(null), /unexpected/);
});

test('translateUrl escapes text and targets; cache keys separate provider and language', () => {
  const u = new URL(translateUrl('森 & 少年', 'pt-BR'));
  assert.equal(u.hostname, 'translate.google.com');
  assert.equal(u.searchParams.get('text'), '森 & 少年');
  assert.equal(u.searchParams.get('tl'), 'pt-BR');
  assert.equal(cacheKeyFor('森', 'en', null), 'gtx|en|森');
  assert.equal(cacheKeyFor(' 森 ', 'xx', 'k'), 'cloud|en|森');
  assert.ok(TARGETS.en && TARGETS['pt-BR']);
});

test('a failed online translation is retryable; only a successful result is cached', async () => {
  let calls = 0;
  const fetchImpl = async (_url, options) => {
    calls++;
    assert.equal(options.credentials, 'omit');
    assert.ok(options.signal instanceof AbortSignal);
    if (calls === 1) throw new DOMException('The operation timed out', 'TimeoutError');
    return Response.json({ sentences: [{ trans: 'Read in the forest.' }] });
  };
  await assert.rejects(translate('森で読む。', { fetchImpl }), { name: 'TimeoutError' });
  assert.equal((await translate('森で読む。', { fetchImpl })).translation, 'Read in the forest.');
  await translate('森で読む。', { fetchImpl });
  assert.equal(calls, 2);
});

test('Cloud translation uses the chosen language and a bounded credential-free request', async () => {
  const r = await translate('山へ行く。', { to: 'pt-BR', key: 'test-key', fetchImpl: async (url, options) => {
    assert.equal(new URL(url).searchParams.get('key'), 'test-key');
    assert.deepEqual(JSON.parse(options.body), { q: '山へ行く。', source: 'ja', target: 'pt-BR', format: 'text' });
    assert.equal(options.credentials, 'omit');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ data: { translations: [{ translatedText: 'Ir à montanha.' }] } });
  } });
  assert.equal(r.provider, 'cloud');
  assert.equal(r.translation, 'Ir à montanha.');
});

test('simultaneous requests for the same word share one network request', async () => {
  const translate = createTranslator({ storage: null });
  let resolve, calls = 0;
  const fetchImpl = () => { calls++; return new Promise(r => { resolve = r; }); };
  const first = translate('王国', { fetchImpl });
  const second = translate('王国', { fetchImpl });
  resolve(Response.json({ sentences: [{ trans: 'kingdom' }] }));
  assert.equal((await first).translation, 'kingdom');
  assert.equal((await second).translation, 'kingdom');
  assert.equal(calls, 1);
});

test('429 respects Retry-After across reopened clients, preserves cached results, and recovers', async () => {
  let time = 1_000_000, calls = 0;
  const saved = new Map();
  const storage = { getItem: k => saved.get(k), setItem: (k, v) => saved.set(k, v) };
  const original = createTranslator({ now: () => time, storage });
  await original('森', { fetchImpl: async () => Response.json({ sentences: [{ trans: 'forest' }] }) });
  const limited = async () => { calls++; return new Response('', { status: 429, headers: { 'Retry-After': '120' } }); };
  await assert.rejects(original('王国', { fetchImpl: limited }), e => e.code === 'rate-limited' && e.retryAt === time + 120_000);
  assert.equal((await original('森', { fetchImpl: limited })).translation, 'forest');
  const reopened = createTranslator({ now: () => time, storage });
  await assert.rejects(reopened('少年', { fetchImpl: limited }), e => e.code === 'rate-limited');
  assert.equal(calls, 1);
  time += 120_001;
  assert.equal((await reopened('王国', { fetchImpl: async () => { calls++; return Response.json({ sentences: [{ trans: 'kingdom' }] }); } })).translation, 'kingdom');
  assert.equal(calls, 2);
  assert.deepEqual([...saved.keys()], ['nihongo-reader:translation-retry:gtx']);
});

test('Retry-After supports seconds, HTTP dates and a conservative missing-header default', () => {
  const now = Date.parse('2026-09-09T12:00:00Z');
  assert.equal(retryAfterMs('90', now), 90_000);
  assert.equal(retryAfterMs('Wed, 09 Sep 2026 12:02:00 GMT', now), 120_000);
  assert.equal(retryAfterMs(null, now), 60_000);
  assert.equal(retryAfterMs('invalid', now), 60_000);
});

test('Cloud error reasons distinguish API setup, billing, restrictions and daily quota', () => {
  for (const [reason, code, expected] of [
    ['SERVICE_DISABLED', 'cloud-setup', /not enabled/],
    ['BILLING_DISABLED', 'cloud-setup', /billing/],
    ['API_KEY_SERVICE_BLOCKED', 'cloud-setup', /API restrictions/],
    ['API_KEY_HTTP_REFERRER_BLOCKED', 'cloud-setup', /application restrictions/],
    ['API_KEY_INVALID', 'cloud-setup', /did not accept/],
    ['dailyLimitExceeded', 'cloud-quota', /daily quota/],
  ]) {
    const error = parseCloudError({ error: { details: [{ reason }] } }, 403);
    assert.equal(error.code, code); assert.equal(error.retryable, false); assert.match(error.message, expected);
  }
  assert.match(parseCloudError(null, 403).message, /denied/);
  assert.equal(parseCloudError(null, 503).retryable, true);
});

test('Cloud permission failures surface safe details without silently switching providers', async () => {
  const translate = createTranslator({ storage: null });
  const key = 'test-cloud-key';
  let calls = 0;
  await assert.rejects(translate('辺境', { key, fetchImpl: async () => {
    calls++;
    return Response.json({ error: { message: `Request with key ${key} was blocked.`, details: [{ reason: 'API_KEY_SERVICE_BLOCKED' }] } }, { status: 403 });
  } }), error => error.code === 'cloud-setup' && error.retryable === false && error.details.includes('[redacted]') && !error.details.includes(key));
  assert.equal(calls, 1);
});

test('Cloud 403 per-minute quota uses the same cooldown as HTTP 429', async () => {
  let time = 100_000, calls = 0;
  const translate = createTranslator({ storage: null, now: () => time });
  const fetchImpl = async () => { calls++; return Response.json({ error: { message: 'User Rate Limit Exceeded', errors: [{ reason: 'userRateLimitExceeded' }] } }, { status: 403 }); };
  await assert.rejects(translate('辺境', { key: 'test-key', fetchImpl }), e => e.code === 'rate-limited' && e.retryAt === 160_000);
  await assert.rejects(translate('森', { key: 'test-key', fetchImpl }), e => e.code === 'rate-limited');
  assert.equal(calls, 1);
});

test('provider choice preserves existing installs and permits no-key translation without deleting Cloud keys', () => {
  assert.equal(translationProviderFor({}), 'gtx');
  assert.equal(translationProviderFor({ translateKey: 'key' }), 'cloud');
  assert.equal(translationProviderFor({ translateKey: 'key', translateProvider: 'gtx' }), 'gtx');
  assert.equal(translationProviderFor({ translateProvider: 'cloud' }), 'gtx');
});
