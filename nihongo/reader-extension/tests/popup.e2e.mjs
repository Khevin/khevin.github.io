#!/usr/bin/env node
/*
 * popup.e2e.mjs — the icon popover's voice controls, in the served-dist mode
 * (dist/ over 127.0.0.1 with the MV3 CSP header, headless shell):
 *   no key → Auto + the device's browser voices only
 *   key pasted → the app's five Google Cloud voices appear and can be picked
 *   Test voice → fetches and plays the clip in the popover itself, so it never
 *     depends on the service worker; a refused key shows Google's own message
 *   a service worker from an older build → a plain "reload the extension" line
 *   Import key from the app → reads jp:gcloudTtsKey out of an open Nihongo tab
 *
 *   npm run build:reader && node reader-extension/tests/popup.e2e.mjs
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '..', 'dist');
if (!fs.existsSync(path.join(DIST, 'popup.html'))) { console.error(`${DIST}/popup.html missing — run npm run build:reader`); process.exit(1); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  const data = fs.readFileSync(file);
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': data.length, 'Content-Security-Policy': "script-src 'self'; object-src 'self'" });
  res.end(data);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/popup.html`;

// chrome.* stub: prefs in memory, one fake Nihongo tab holding the app's key, a
// runtime whose PING answer the test controls, and an Audio that records the
// clips it was handed (headless shells have no audio device).
const STUB = `
(() => {
  let prefs = { enabled: true, level: 'words', romaji: false, appUrl: 'https://khevin.com/nihongo/app.html', mutedHosts: [], ttsRate: 0.8, ttsVoiceURI: null, gcloudTtsKey: null };
  window.__sent = [];
  window.__played = [];
  window.__appKey = 'AIza-from-the-app';
  window.__pingAnswer = { ok: true, speak: true, version: '0.2.0' };
  window.Audio = class { constructor(src) { this.src = src; window.__played.push(src); } play() { return Promise.resolve(); } pause() {} };
  window.chrome = {
    runtime: {
      id: 'stub',
      onMessage: { addListener() {} },
      getURL: (p) => '/' + p,
      getManifest: () => ({ version: '0.2.0' }),
      async sendMessage(msg) {
        window.__sent.push(msg);
        if (msg.type === 'PING') { if (window.__pingAnswer === 'throw') throw new Error('Could not establish connection. Receiving end does not exist.'); return window.__pingAnswer; }
        return { ok: false, error: 'unknown ' + msg.type };
      },
    },
    storage: { local: { get: async () => ({ prefs }), set: async (o) => { prefs = { ...prefs, ...o.prefs }; } }, onChanged: { addListener() {} } },
    tabs: { query: async () => [{ id: 7, url: 'https://khevin.com/nihongo/app.html' }] },
    scripting: { executeScript: async () => [{ result: window.__appKey }] },
    sidePanel: { open: async () => {} },
  };
  window.__prefs = () => prefs;
  window.__setPrefs = (p) => { prefs = { ...prefs, ...p }; };
})();`;

const results = [];
const check = (name, pass, detail = '') => { results.push([name, pass]); console.log(`  ${pass ? '✔' : '✖'} ${name}${detail ? ' — ' + detail : ''}`); };
const openDefaults = (page) => page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // the 403 below is this test's own mock; a failed request is not a page error
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(STUB);

  // Cloud Text-to-Speech, mocked. The body is the contract with Google.
  const synth = [];
  await page.route('https://texttospeech.googleapis.com/**', async (route) => {
    const req = route.request();
    synth.push({ url: req.url(), body: JSON.parse(req.postData() || '{}') });
    if (await page.evaluate(() => window.__denyKey === true)) return route.fulfill({ status: 403, json: { error: { message: 'Requests from referer <empty> are blocked.' } } });
    if (await page.evaluate(() => window.__denyBilling === true)) return route.fulfill({ status: 403, json: { error: { message: 'This API method requires billing to be enabled. Please enable billing on project #153406461054 by visiting https://console.developers.google.com/billing/enable?project=153406461054 then retry. If you enabled billing for this project recently, wait a few minutes for the action to propagate to our systems and retry.' } } });
    return route.fulfill({ json: { audioContent: 'QUJD' } });
  });

  await page.goto(url);
  await openDefaults(page);
  await page.waitForFunction(() => document.querySelectorAll('#ttsVoice option').length > 0);

  // the popover review's P0 items: every control named, categories bounded
  const form = await page.evaluate(() => ({
    unlabelled: [...document.querySelectorAll('input, select')].filter(i => !(i.labels && i.labels.length) && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby')).map(i => i.id || i.type),
    sections: [...document.querySelectorAll('.sec-head')].map(h => h.textContent.trim()),
    smallTargets: [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().height < 24).map(b => b.id || b.textContent.trim()),
    placeholderOnly: [...document.querySelectorAll('input[type=password], input[type=text]')].filter(i => !(i.labels && i.labels.length)).map(i => i.id),
  }));
  check('every control is named by a real label, not by a placeholder', form.unlabelled.length === 0 && form.placeholderOnly.length === 0, form.unlabelled.concat(form.placeholderOnly).join(', ') || 'all labelled');
  check('the settings are grouped into named sections with edges', form.sections.join(',') === 'reading,voice,translation,pictures,app', form.sections.join(' · '));
  check('no pointer target is under 24 px (Universal Design 7c)', form.smallTargets.length === 0, form.smallTargets.join(', ') || 'all ≥ 24 px');

  const closed = await page.evaluate(async () => { document.querySelectorAll('details').forEach((d, i) => { d.open = i === 0; }); await new Promise(r => setTimeout(r, 50)); return document.body.scrollHeight; });
  check('the popover fits Chrome’s 600 px popup with its first section open', closed <= 600, closed + ' px');
  await openDefaults(page);

  const bare = await page.$eval('#ttsVoice', (s) => ({ groups: [...s.querySelectorAll('optgroup')].map(g => g.label), first: s.options[0].textContent, value: s.value }));
  check('with no key the picker offers Auto and the device voices, never a cloud voice', bare.first === 'Auto (best available)' && !bare.groups.some(g => /Google Cloud/.test(g)) && bare.value === '', JSON.stringify(bare));

  await page.click('#furigana');
  const withFurigana = await page.evaluate(() => window.__prefs().furigana);
  check('the furigana default sits beside romaji, as the bar shows them', withFurigana === true, String(withFurigana));

  await page.fill('#gcloudTtsKey', 'AIza-test-key');
  await page.dispatchEvent('#gcloudTtsKey', 'change');
  await page.waitForFunction(() => document.querySelectorAll('#ttsVoice optgroup').length > 0);
  const withKey = await page.$eval('#ttsVoice', (s) => ({ groups: [...s.querySelectorAll('optgroup')].map(g => g.label), cloud: [...s.querySelectorAll('optgroup option')].filter(o => o.value.startsWith('gcloud:')).map(o => o.textContent) }));
  check('pasting the key reveals the app’s five Neural2 / WaveNet voices under one group', withKey.cloud.length === 5 && /Google Cloud · neural/.test(withKey.groups[0]) && withKey.cloud[1] === 'Google Cloud · Neural2 C (male)', withKey.cloud.join(' | '));

  await page.selectOption('#ttsVoice', 'gcloud:ja-JP-Neural2-C');
  const stored = await page.evaluate(() => window.__prefs());
  check('the chosen voice and key are stored as prefs, in the app’s own gcloud: shape', stored.ttsVoiceURI === 'gcloud:ja-JP-Neural2-C' && stored.gcloudTtsKey === 'AIza-test-key', `${stored.ttsVoiceURI} · key ${stored.gcloudTtsKey ? 'set' : 'missing'}`);

  await page.click('#ttsTest');
  await page.waitForFunction(() => /spoke/.test(document.getElementById('ttsHint').textContent), null, { timeout: 10000 });
  const played = await page.evaluate(() => window.__played);
  const askedWorker = await page.evaluate(() => window.__sent.filter(m => m.type === 'SPEAK').length);
  check('Test voice fetches and plays the clip in the popover, never through the service worker', synth.length === 1 && played.length === 1 && played[0] === 'data:audio/mpeg;base64,QUJD' && askedWorker === 0, `${synth.length} request(s), ${played.length} clip(s), ${askedWorker} worker call(s)`);
  check('the request carries the picked voice, ja-JP, MP3 and the rate slider’s value', synth[0].body.voice.name === 'ja-JP-Neural2-C' && synth[0].body.voice.languageCode === 'ja-JP' && synth[0].body.audioConfig.audioEncoding === 'MP3' && synth[0].body.audioConfig.speakingRate === 0.8 && synth[0].body.input.text === '日本語' && /key=AIza-test-key/.test(synth[0].url), JSON.stringify(synth[0].body));

  await page.evaluate(() => { window.__denyKey = true; });
  await page.click('#ttsTest');
  await page.waitForFunction(() => /Voice failed/.test(document.getElementById('ttsHint').textContent), null, { timeout: 10000 });
  const failHint = await page.$eval('#ttsHint', (el) => el.textContent);
  check('a refused key shows Google’s own message in the popover', /403 — Requests from referer/.test(failHint), failHint.trim());

  // the exact refusal the owner hit: quote Google, then say what to do
  await page.evaluate(() => { window.__denyKey = false; window.__denyBilling = true; });
  await page.waitForTimeout(750);
  await page.click('#ttsTest');
  await page.waitForFunction(() => /billing/i.test(document.getElementById('ttsHint').textContent), null, { timeout: 10000 });
  const billing = await page.$eval('#ttsHint', (el) => ({ text: el.textContent, href: el.querySelector('a') && el.querySelector('a').href }));
  check('a billing refusal keeps Google words and adds one actionable line with its own link', /requires billing/.test(billing.text) && /wait a minute/.test(billing.text) && billing.href === 'https://console.developers.google.com/billing/enable?project=153406461054', billing.href || billing.text.slice(0, 80));

  await page.evaluate(() => { window.__prefs().gcloudTtsKey = null; });
  await page.click('#ttsImport');
  await page.waitForFunction(() => /copied from the Nihongo app/.test(document.getElementById('ttsHint').textContent));
  const imported = await page.evaluate(() => window.__prefs().gcloudTtsKey);
  check('Import reads jp:gcloudTtsKey out of an open Nihongo tab, on an explicit click', imported === 'AIza-from-the-app', String(imported));

  await page.evaluate(() => { window.__appKey = null; });
  await page.click('#ttsImport');
  await page.waitForFunction(() => /Open your Nihongo app/.test(document.getElementById('ttsHint').textContent));
  check('with no Nihongo tab open, Import says where the key actually lives', true);

  // a worker left over from an older build answers nothing: say so, in words
  const stalePage = await ctx.newPage();
  stalePage.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await stalePage.addInitScript(STUB);
  await stalePage.addInitScript(`window.__pingAnswer = 'throw';`);
  await stalePage.goto(url);
  await stalePage.waitForFunction(() => /chrome:\/\/extensions/.test(document.getElementById('ttsHint').textContent), null, { timeout: 10000 });
  const staleHint = await stalePage.$eval('#ttsHint', (el) => el.textContent);
  check('a background worker from an older build is named as the problem, with the fix', /older build/.test(staleHint) && /Reload/.test(staleHint) && /side panel/.test(staleHint), staleHint.trim());

  const freshHint = await page.$eval('#ttsHint', (el) => el.textContent);
  check('a current worker raises no reload notice', !/older build/.test(freshHint), freshHint.trim().slice(0, 60));

  check('no page errors', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
  server.close();
}
const passed = results.filter(([, p]) => p).length;
console.log(`popup e2e: ${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
