#!/usr/bin/env node
/*
 * extension.e2e.mjs — measures the packaged tokenizer through the real module
 * worker + fetch + DecompressionStream path and checks the bundle under the
 * MV3 content-security policy.
 *
 *   npm run build:reader && npm run test:reader:e2e
 *   node reader-extension/tests/extension.e2e.mjs --write   → also writes fixtures/extension-e2e.json
 *
 * Mode A — unpacked extension (preferred): launchPersistentContext with
 *   --load-extension in a Chromium that supports it (Playwright's full Chromium
 *   headless, then system Chrome). The extension ID is derived from the fixed
 *   manifest `key`, so the panel is opened directly as
 *   chrome-extension://<id>/sidepanel.html. Google Chrome ≥ 137 ignores
 *   --load-extension, so this mode needs Chrome for Testing / Chromium.
 * Mode B — served dist (fallback): if no browser can load the extension, the
 *   dist/ folder is served over 127.0.0.1 with the MV3 extension-page CSP
 *   (`script-src 'self'; object-src 'self'`) and opened in the headless shell.
 *   This proves the worker, inflate, tokenizer, offsets, and CSP-compliance of
 *   the bundle; it does NOT prove the chrome-extension:// load itself, which
 *   is then reported as NOT VERIFIED and must be done by hand
 *   (chrome://extensions → Load unpacked → reader-extension/dist).
 *
 * Numbers reported: cold start (worker build incl. dictionary fetch+inflate)
 * p50/p95 over COLD_RUNS fresh pages, warm tokenize p50/p95 over WARM_RUNS on
 * a ~200-char text, and reconstruction checks on three sentences.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { extensionIdFromKey } from '../../scripts/reader-extension-id.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '..');
const DIST = path.join(EXT, 'dist');
const OUT = path.join(EXT, 'fixtures', 'extension-e2e.json');
const WRITE = process.argv.includes('--write');
const COLD_RUNS = 5;
const WARM_RUNS = 20;
const MV3_CSP = "script-src 'self'; object-src 'self'";

if (!fs.existsSync(path.join(DIST, 'manifest.json'))) { console.error('dist/ missing — run `npm run build:reader` first'); process.exit(1); }
const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
if (!manifest.key) { console.error('manifest.json needs a fixed "key" (see scripts/reader-extension-id.mjs)'); process.exit(1); }
const extensionId = extensionIdFromKey(manifest.key);

const corpus = JSON.parse(fs.readFileSync(path.join(EXT, 'fixtures', 'corpus.json'), 'utf8'));
const sentences = ['s01', 'n04', 'a01'].map(id => corpus.cases.find(c => c.id === id).text);
const warmText = corpus.cases.filter(c => c.group === 'site').map(c => c.text).join('').slice(0, 200);

// ── Mode A: try to load the unpacked extension ──────────────────────────────
const args = [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`];
const attempts = [
  { label: 'playwright chromium (headless)', opts: { channel: 'chromium', headless: true } },
  { label: 'system chrome (headless)', opts: { channel: 'chrome', headless: true } },
];
async function openPanel(context, url) {
  const page = await context.newPage();
  for (let i = 0; i < 8; i++) {
    try { await page.goto(url, { timeout: 5000 }); await page.waitForFunction(() => window.__reader, null, { timeout: 5000 }); return page; }
    catch { await page.waitForTimeout(500); }
  }
  await page.close();
  throw new Error('panel page did not load — extension not installed in this browser');
}

let context = null, page = null, mode = null, panelUrl = null, server = null, browser = null;
const attemptLog = [];
const tempDirs = [];
for (const a of attempts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nihongo-reader-e2e-'));
  tempDirs.push(dir);
  try {
    context = await chromium.launchPersistentContext(dir, { ...a.opts, args });
    panelUrl = `chrome-extension://${extensionId}/sidepanel.html?probe=csp`;
    page = await openPanel(context, panelUrl);
    mode = `A: unpacked extension via ${a.label}`;
    break;
  } catch (e) {
    attemptLog.push(`${a.label}: ${e.message.split('\n')[0]}`);
    console.log(`  ${a.label}: ${e.message.split('\n')[0]}`);
    if (context) { await context.close().catch(() => {}); context = null; }
  }
}

// ── Mode B: serve dist/ with the MV3 CSP in the headless shell ─────────────
if (!context) {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.gz': 'application/octet-stream', '.txt': 'text/plain', '.md': 'text/markdown' };
  server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const data = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': data.length, 'Content-Security-Policy': MV3_CSP });
    res.end(data);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  panelUrl = `http://127.0.0.1:${server.address().port}/sidepanel.html?probe=csp`;
  browser = await chromium.launch();
  context = await browser.newContext();
  page = await openPanel(context, panelUrl);
  mode = 'B: served dist with MV3 CSP header in headless shell (extension load NOT verified)';
  console.log(`  falling back to ${mode}`);
}

const results = { generatedAt: new Date().toISOString(), mode, attemptLog, extensionId, panelUrl, chrome: null, host: { cpu: os.cpus()[0]?.model?.trim(), cores: os.cpus().length, platform: `${os.platform()} ${os.release()}` }, cold: [], warm: null, reconstruction: [], consoleErrors: [], files: null, memory: null };
const checks = [];
const check = (name, pass, detail = '') => { checks.push({ name, pass, detail }); console.log(`  ${pass ? '✔' : '✖'} ${name}${detail ? ' — ' + detail : ''}`); };

try {
  for (let i = 0; i < COLD_RUNS; i++) {
    if (i > 0) page = await openPanel(context, panelUrl);
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    if (i === 0) results.chrome = await page.evaluate(() => navigator.userAgent);
    const t0 = Date.now();
    const ready = await page.evaluate(() => window.__reader.init());
    const observed = Date.now() - t0;
    results.cold.push({ buildMs: ready.buildMs, pageObservedMs: observed });
    if (i === 0) { results.files = ready.files; results.memory = { worker: ready.memory, page: await page.evaluate(() => window.__reader.pageMemory()) }; }
    if (i === COLD_RUNS - 1) {
      for (const text of sentences) {
        const r = await page.evaluate((t) => window.__reader.tokenize(t), text);
        const rebuilt = [...r.tokens.map(t => ({ s: t.startUtf16, t: t.surface })), ...r.gaps.map(g => ({ s: g.startUtf16, t: g.text }))].sort((a, b) => a.s - b.s).map(x => x.t).join('');
        results.reconstruction.push({ text, tokens: r.tokens.length, ok: rebuilt === text });
      }
      results.warm = await page.evaluate(({ text, n }) => window.__reader.bench(text, n), { text: warmText, n: WARM_RUNS });
      results.memory.afterWarm = { worker: (await page.evaluate((t) => window.__reader.tokenize(t), 'テスト')).memory };
      // CSP probe ran during the page's own boot (see sidepanel.js) — evaluate() only reads the stored result,
      // because code reached through the automation channel is exempt from CSP eval blocking.
      results.cspProbe = await page.evaluate(() => window.__cspProbe);
    }
    results.consoleErrors.push(...errors.filter(e => !/Content Security Policy/.test(e) || i !== COLD_RUNS - 1));
    await page.close();
  }
} finally {
  if (browser) await browser.close().catch(() => {}); else await context.close().catch(() => {});
  if (server) server.close();
  for (const d of tempDirs) fs.rmSync(d, { recursive: true, force: true, maxRetries: 3 });
}

const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]; };
const coldBuild = results.cold.map(c => c.buildMs);
results.summary = {
  coldBuildMs: { runs: COLD_RUNS, samples: coldBuild, p50: pct(coldBuild, 50), p95: pct(coldBuild, 95) },
  warmTokenizeMs: results.warm ? { runs: results.warm.runs, chars: results.warm.chars, p50: results.warm.p50, p95: results.warm.p95 } : null,
  dictRawBytes: results.files ? results.files.reduce((a, f) => a + f.rawBytes, 0) : null,
  dictGzBytes: results.files ? results.files.reduce((a, f) => a + (f.gzBytes || 0), 0) : null,
};

console.log(`\nextension e2e — mode ${mode}\n  ${results.chrome}`);
console.log(`  extension id ${extensionId} · opened ${panelUrl}`);
console.log(`  cold build ms: ${coldBuild.join(', ')} → p50 ${results.summary.coldBuildMs.p50}, p95 ${results.summary.coldBuildMs.p95}`);
if (results.warm) console.log(`  warm tokenize ${results.warm.chars} chars ×${results.warm.runs}: p50 ${results.warm.p50} ms, p95 ${results.warm.p95} ms`);
if (results.files) { const slowest = results.files.slice().sort((a, b) => b.ms - a.ms)[0]; console.log(`  dictionary: ${results.files.length} files, ${(results.summary.dictRawBytes / 1048576).toFixed(1)} MiB inflated; slowest ${slowest.name} ${slowest.ms} ms`); }
console.log(`  memory: worker ${JSON.stringify(results.memory?.worker)} · page ${JSON.stringify(results.memory?.page)} · worker after warm ${JSON.stringify(results.memory?.afterWarm?.worker)}`);
console.log('');
check('worker ready on every cold page', results.cold.length === COLD_RUNS && coldBuild.every(x => x > 0));
check('12 dictionary files inflated via DecompressionStream', results.files && results.files.length === 12);
for (const r of results.reconstruction) check(`reconstruction: ${r.text}`, r.ok, `${r.tokens} tokens`);
check('no console errors from the bundle (module worker, ESM, no eval)', results.consoleErrors.length === 0, results.consoleErrors.slice(0, 3).join(' | '));
check('MV3 CSP in force: eval, Function() and inline script blocked for page code', results.cspProbe && results.cspProbe.inlineBlocked && results.cspProbe.evalBlocked && results.cspProbe.functionCtorBlocked, JSON.stringify(results.cspProbe));
check('cold start target ≤ 3000 ms (p95)', results.summary.coldBuildMs.p95 <= 3000, `${results.summary.coldBuildMs.p95} ms`);
check('warm 200-char tokenize ≤ 300 ms (p95)', results.warm && results.warm.p95 <= 300, results.warm ? `${results.warm.p95} ms` : 'n/a');
if (mode.startsWith('B')) console.log('\n  NOT VERIFIED here: chrome-extension:// load of dist/. Do it by hand: chrome://extensions → Developer mode → Load unpacked → reader-extension/dist, open the side panel, confirm the status line reads "worker ready".');

results.checks = checks;
if (WRITE) { fs.writeFileSync(OUT, JSON.stringify(results, null, 2) + '\n'); console.log(`\n  wrote ${path.relative(EXT, OUT)}`); }
process.exitCode = checks.every(c => c.pass) ? 0 : 1;
