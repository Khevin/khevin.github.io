#!/usr/bin/env node
// Delayed replies expose races that fast tokenizer happy-path tests cannot.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/fixture.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><meta charset="utf-8"><p id="a">森で読む。</p><p id="b">山で遊ぶ。</p>'); return;
  }
  const file = path.resolve(DIST, '.' + pathname.replace('/reader-library/', '/library/'));
  if (!file.startsWith(DIST + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log(`  ✔ ${name}`); }
  catch (e) { failed++; console.error(`  ✖ ${name}: ${e.message}`); }
}
try {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const localListeners = [], sessionListeners = [], globalListeners = [];
    const local = { prefs: { enabled: true, level: 'words', romaji: false, furigana: false, appUrl: location.origin + '/app.html', mutedHosts: [] } };
    const session = {};
    const area = (data, name, listeners) => ({
      async get(keys) { return keys == null ? { ...data } : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(k => [k, data[k]])); },
      async set(values) {
        const changes = Object.fromEntries(Object.entries(values).map(([k, newValue]) => [k, { oldValue: data[k], newValue }]));
        Object.assign(data, values);
        for (const fn of listeners) fn(changes);
        for (const fn of globalListeners) fn(changes, name);
      },
      onChanged: { addListener(fn) { listeners.push(fn); }, removeListener(fn) { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); } },
    });
    window.__requests = []; window.__commits = []; window.__tasks = [];
    window.__failSave = false;
    window.chrome = {
      tabs: { async query() { return [{ id: 1, url: location.origin + '/fixture.html' }]; } },
      sidePanel: { async open() {} },
      runtime: {
        id: 'test', getURL: p => location.origin + '/' + p,
        onMessage: { addListener() {}, removeListener() {} },
        sendMessage(msg) {
          if (['STUDY_REQUEST', 'ANALYZE_TEXT', 'ANALYZE_SENTENCE'].includes(msg.type)) {
            return new Promise((resolve, reject) => window.__requests.push({ msg, resolve, reject }));
          }
          if (['SENTENCE_SHOWN', 'STUDY_SENTENCE'].includes(msg.type)) {
            window.__commits.push(msg.payload);
            return Promise.resolve(window.__failSave ? { ok: false, error: 'temporary storage failure' } : { ok: true, added: 2 });
          }
          return Promise.resolve({ ok: true });
        },
      },
      storage: {
        local: area(local, 'local', localListeners), session: area(session, 'session', sessionListeners),
        onChanged: { addListener(fn) { globalListeners.push(fn); }, removeListener(fn) { const i = globalListeners.indexOf(fn); if (i >= 0) globalListeners.splice(i, 1); } },
      },
    };
    window.__answer = (i) => {
      const r = window.__requests[i];
      const text = r.msg.payload.text || r.msg.payload.sentences[0].text;
      r.resolve({ ok: true, analysis: { text, tokens: [], gaps: [{ start: 0, end: text.length, surface: text }], groups: [], relations: [], warnings: [] } });
    };
    window.__select = (id) => {
      const r = document.createRange(); r.selectNodeContents(document.getElementById(id));
      getSelection().removeAllRanges(); getSelection().addRange(r);
      window.__tasks.push(window.__nihongoReaderBar.study());
    };
    window.__capture = (id, text) => window.__reader.setCapture({ captureId: id, status: 'ready', payload: {
      captureKind: 'paste', sentences: [{ text, fragment: false, ruby: [] }], source: { url: null, domain: 'paste', capturedAt: new Date().toISOString() },
    } });
  });

  const bar = await context.newPage();
  const errors = [];
  bar.on('pageerror', e => errors.push(e.message));
  await bar.goto(origin + '/fixture.html');
  await bar.addScriptTag({ url: origin + '/content.js' });
  await bar.waitForFunction(() => window.__nihongoReaderBar);
  await bar.evaluate(() => { window.__select('a'); window.__select('b'); });
  await bar.waitForFunction(() => window.__requests.length === 2);
  await bar.evaluate(async () => { window.__answer(1); await window.__tasks[1]; window.__answer(0); await window.__tasks[0]; });
  await check('floating bar ignores a late result from a previous selection', async () => {
    assert.equal(await bar.evaluate(() => window.__nihongoReaderBar.state.analyses.get(0)?.text), '山で遊ぶ。');
    assert.deepEqual(await bar.evaluate(() => window.__commits.map(c => c.displayText)), ['山で遊ぶ。']);
  });

  await bar.evaluate(() => { window.__select('a'); window.__nihongoReaderBar.root.querySelector('[data-act="close"]').click(); });
  await bar.evaluate(async () => { window.__answer(2); await window.__tasks[2]; });
  await check('closing the floating bar invalidates unfinished analysis and saves', async () => {
    assert.equal(await bar.evaluate(() => window.__nihongoReaderBar.state.analyses.size), 0);
    assert.equal(await bar.evaluate(() => window.__commits.length), 1);
  });

  await bar.evaluate(() => { window.__failSave = true; window.__select('a'); });
  await bar.evaluate(async () => { window.__answer(3); await window.__tasks[3]; });
  await check('a failed save remains retryable and the retry records the same sentence', async () => {
    assert.equal(await bar.evaluate(() => window.__nihongoReaderBar.state.shown.size), 0);
    await bar.evaluate(() => { window.__failSave = false; window.__nihongoReaderBar.root.querySelector('[data-act="retry-save"]').click(); });
    await bar.waitForFunction(() => window.__nihongoReaderBar.state.shown.size === 1);
    assert.equal(await bar.evaluate(() => window.__nihongoReaderBar.state.shown.size), 1);
    assert.equal(await bar.evaluate(() => window.__commits.length), 3);
  });

  await check('the floating bar saves its Words/Phrases preference', async () => {
    await bar.evaluate(() => window.__nihongoReaderBar.root.querySelector('[data-level="phrases"]').click());
    await bar.waitForFunction(async () => (await chrome.storage.local.get('prefs')).prefs.level === 'phrases');
  });

  const panel = await context.newPage();
  panel.on('pageerror', e => errors.push(e.message));
  await panel.goto(origin + '/sidepanel.html');
  await panel.waitForFunction(() => window.__reader?.state.library);
  await panel.evaluate(() => { window.__capture('old', '森で読む。'); window.__capture('new', '山で遊ぶ。'); });
  await panel.waitForFunction(() => window.__requests.length === 2);
  await panel.evaluate(() => window.__answer(1));
  await panel.waitForFunction(() => window.__commits.length === 1);
  await panel.evaluate(() => window.__requests[0].reject(new Error('late analysis failure')));
  await panel.waitForTimeout(100);
  await check('side panel ignores an old failure and does not count it under the new capture', async () => {
    assert.equal(await panel.evaluate(() => window.__reader.state.analysis.text), '山で遊ぶ。');
    assert.deepEqual(await panel.evaluate(() => window.__commits.map(c => c.displayText)), ['山で遊ぶ。']);
    assert.equal(await panel.evaluate(() => window.__reader.state.analysis.warnings.length), 0);
  });
  await panel.evaluate(async () => { const old = window.__reader.openKanji('森', '森'); window.__capture('third', '川を見る。'); await old; });
  await check('a previous kanji lookup cannot reopen over a new sentence', async () => {
    assert.equal(await panel.evaluate(() => window.__reader.state.kanji), null);
  });
  await check('popup preference changes immediately reach an already open panel', async () => {
    await panel.evaluate(async () => { const { prefs } = await chrome.storage.local.get('prefs'); await chrome.storage.local.set({ prefs: { ...prefs, romaji: true, furigana: true, level: 'phrases', translateTo: 'pt-BR' } }); });
    assert.deepEqual(await panel.evaluate(() => { const s = window.__reader.state; return [s.romaji, s.furigana, s.level, s.translateTo]; }), [true, true, 'phrases', 'pt-BR']);
  });
  await check('background refresh preserves the pasted text, keyboard focus and selection', async () => {
    await panel.locator('[data-act="clear"]').click();
    await panel.locator('#paste').fill('森で読む。山で遊ぶ。');
    await panel.locator('#paste').evaluate(el => { el.focus(); el.setSelectionRange(2, 5, 'backward'); });
    await panel.evaluate(async () => { const { prefs } = await chrome.storage.local.get('prefs'); await chrome.storage.local.set({ prefs: { ...prefs, romaji: false } }); });
    assert.deepEqual(await panel.locator('#paste').evaluate(el => [document.activeElement === el, el.value, el.selectionStart, el.selectionEnd, el.selectionDirection]), [true, '森で読む。山で遊ぶ。', 2, 5, 'backward']);
  });

  let translationCalls = 0;
  await panel.route('https://translate.googleapis.com/**', route => {
    translationCalls++;
    return route.fulfill(translationCalls === 2
      ? { status: 200, contentType: 'application/json', body: JSON.stringify({ sentences: [{ trans: 'kingdom' }] }) }
      : { status: 429, headers: { 'Retry-After': '2', 'Access-Control-Expose-Headers': 'Retry-After' }, body: 'Too many requests' });
  });
  await panel.route('https://commons.wikimedia.org/**', route => route.fulfill({ contentType: 'application/json', body: '{"query":{"pages":{}}}' }));
  const showForTranslation = async (text) => {
    await panel.evaluate(text => { window.__capture('lookup-' + text, text); window.__answer(window.__requests.length - 1); }, text);
    await panel.waitForFunction(text => window.__reader.state.analysis?.text === text, text);
    await panel.locator('.toolbar [data-act="xlate"]').click();
    await panel.waitForFunction(() => window.__reader.state.translation?.status === 'error');
  };
  await showForTranslation('王国');
  await check('rate-limited translation explains the pause and retains the exact external lookup', async () => {
    assert.match(await panel.locator('#xlate-panel').innerText(), /temporarily rate-limiting/);
    assert.equal(await panel.locator('[data-act="xlate-retry"]').isDisabled(), true);
    assert.equal(new URL(await panel.locator('#xlate-panel .xl-foot a').getAttribute('href')).searchParams.get('text'), '王国');
  });
  await panel.locator('.toolbar [data-act="xlate"]').click();
  await panel.waitForFunction(() => window.__reader.state.translation?.status === 'error');
  await check('repeated translate clicks during cooldown do not send more requests', () => assert.equal(translationCalls, 1));
  await panel.waitForFunction(() => !document.querySelector('[data-act="xlate-retry"]')?.disabled, null, { timeout: 5000 });
  await panel.locator('[data-act="xlate-retry"]').click();
  await panel.waitForFunction(() => window.__reader.state.translation?.status === 'ok');
  await check('the retry button recovers inline translation after Retry-After', async () => {
    assert.equal(await panel.locator('#xlate-panel .xl-en').innerText(), 'kingdom');
    assert.equal(translationCalls, 2);
  });
  await showForTranslation('森');
  await check('known words retain their local English meaning when online translation is unavailable', async () => {
    assert.match(await panel.locator('#xlate-panel .xl-local').innerText(), /Nihongo material \(English\).*forest/);
  });

  let cloudCalls = 0, webFallbackCalls = 0;
  await panel.unroute('https://translate.googleapis.com/**');
  await panel.route('https://translate.googleapis.com/**', route => {
    webFallbackCalls++;
    assert.equal(new URL(route.request().url()).searchParams.has('key'), false);
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ sentences: [{ trans: 'frontier' }] }) });
  });
  await panel.route('https://translation.googleapis.com/**', route => {
    cloudCalls++;
    return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { message: 'API test-cloud-key is blocked for this service.', details: [{ reason: 'API_KEY_SERVICE_BLOCKED' }] } }) });
  });
  await panel.evaluate(async () => {
    localStorage.removeItem('nihongo-reader:translation-retry:gtx');
    const { prefs } = await chrome.storage.local.get('prefs');
    await chrome.storage.local.set({ prefs: { ...prefs, translateKey: 'test-cloud-key', gcloudTtsKey: 'test-speech-key', translateProvider: 'cloud' } });
  });
  // The earlier per-provider timer may still live in memory; honor its short test cooldown.
  await panel.waitForTimeout(2100);
  await showForTranslation('辺境');
  await check('Cloud 403 explains the rejected API permission, redacts the key and avoids a useless retry', async () => {
    assert.match(await panel.locator('#xlate-panel .xl-en').innerText(), /not allowed.*Cloud Translation/);
    assert.equal(await panel.locator('#xlate-panel [data-act="xlate-retry"]').count(), 0);
    assert.equal(await panel.locator('#xlate-panel').textContent().then(s => s.includes('test-cloud-key')), false);
    assert.equal(cloudCalls, 1); assert.equal(webFallbackCalls, 0);
  });
  await panel.locator('[data-act="xlate-use-web"]').click();
  await panel.waitForFunction(() => window.__reader.state.translation?.status === 'ok');
  await check('explicit no-key choice translates in-panel and preserves separate translation and speech keys', async () => {
    assert.equal(await panel.locator('#xlate-panel .xl-en').innerText(), 'frontier');
    assert.deepEqual(await panel.evaluate(async () => { const { prefs } = await chrome.storage.local.get('prefs'); return [prefs.translateProvider, prefs.translateKey, prefs.gcloudTtsKey]; }), ['gtx', 'test-cloud-key', 'test-speech-key']);
    assert.equal(cloudCalls, 1); assert.equal(webFallbackCalls, 1);
  });

  const popup = await context.newPage();
  popup.on('pageerror', e => errors.push(e.message));
  await popup.route(origin + '/reader-library/manifest.json', route => route.fulfill({ status: 404, body: 'Not published' }));
  await popup.goto(origin + '/popup.html');
  await popup.waitForFunction(() => document.getElementById('version')?.textContent);
  await check('popup shows the version from the built extension manifest', async () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
    assert.equal(await popup.locator('#version').innerText(), `v${manifest.version}`);
  });
  await popup.locator('#syncLib').click();
  await popup.waitForFunction(() => !document.getElementById('syncLib').disabled);
  await check('popup distinguishes unpublished online updates from a broken saved library', async () => {
    assert.equal(await popup.locator('#syncLib').innerText(), 'Saved library ready');
    assert.match(await popup.locator('#hint').innerText(), /not published.*saved library is ready/i);
    assert.match(await popup.locator('#libSummary').innerText(), /262 cards/);
  });
  await check('no uncaught browser errors', () => assert.deepEqual(errors, []));
} finally { await browser.close(); server.close(); }
console.log(`async UI regressions: ${failed ? failed + ' failed' : 'all passed'}`);
process.exitCode = failed ? 1 : 0;
