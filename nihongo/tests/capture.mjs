#!/usr/bin/env node
/*
 * capture.mjs — headless characterization capture (Playwright).
 *
 *   node tests/capture.mjs [outPath]
 *
 * Self-contained: starts a static file server over the repo root, launches
 * headless Chromium, loads the app, clears jp:* localStorage for clean
 * first-visit defaults, injects characterize.js, runs window.__capture(), and
 * writes the snapshot JSON (default: tests/golden-after.json).
 *
 * Pair with compare.mjs:
 *   node tests/capture.mjs tests/golden-after.json
 *   node tests/compare.mjs tests/golden-baseline.json tests/golden-after.json
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..'); // tests/ -> nihongo/ -> repo root
const NIHONGO_DIR = path.resolve(__dirname, '..');

const outPath = process.argv[2] || path.join(__dirname, 'golden-after.json');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const filePath = path.normalize(path.join(REPO_ROOT, urlPath));
      // Path-traversal guard: must stay under the repo root.
      if (!filePath.startsWith(REPO_ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const appUrl = `http://127.0.0.1:${port}/nihongo/app.html`;
  const characterizeSrc = fs.readFileSync(path.join(__dirname, 'characterize.js'), 'utf8');

  const browser = await chromium.launch();
  const errors = [];
  try {
    const page = await browser.newPage();
    // Ignore environmental resource 404s (some image files simply aren't on
    // disk in this checkout) — they're not JS regressions. Keep real script
    // errors and uncaught exceptions.
    const isResource404 = (t) => /Failed to load resource/i.test(t);
    page.on('console', (m) => { if (m.type() === 'error' && !isResource404(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

    // A fresh Playwright context starts with empty localStorage, i.e. the
    // first-visit defaults — exactly the reproducible baseline we want. No
    // clear/reload needed. domcontentloaded (not load) avoids stalling on
    // external Google Fonts / 404 images, which don't affect the fingerprint.
    await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
    // NOTE: APP is a top-level `const`, so it lives in the global lexical scope,
    // NOT on `window` (only var/function decls attach to window). Poll the bare
    // binding — the same way characterize.js and renderMain reference it.
    await page.waitForFunction(
      () => typeof APP !== 'undefined' && !!(document.getElementById('main-inner') || {}).innerHTML,
      { timeout: 20000 }
    );

    await page.evaluate(characterizeSrc);
    const snap = await page.evaluate(() => window.__capture());

    fs.writeFileSync(outPath, JSON.stringify(snap, null, 2), 'utf8');

    const stateKeys = Object.keys(snap.states);
    const failed = stateKeys.filter((k) => !snap.states[k].ok);
    console.log(`captured ${stateKeys.length} states → ${path.relative(process.cwd(), outPath)}`);
    if (failed.length) console.log(`  ⚠ render-failed states: ${failed.join(', ')}`);
    if (errors.length) {
      console.log(`  ⚠ ${errors.length} console error(s) during load:`);
      errors.slice(0, 10).forEach((e) => console.log('    ' + e));
    } else {
      console.log('  ✓ no console errors during load');
    }
    process.exitCode = failed.length || errors.length ? 1 : 0;
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
