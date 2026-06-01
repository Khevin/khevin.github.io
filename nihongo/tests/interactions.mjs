#!/usr/bin/env node
/*
 * interactions.mjs — headless interaction regression tests (Playwright).
 *
 *   node tests/interactions.mjs
 *
 * The golden-diff harness (characterize.js + compare.mjs) proves *rendered
 * output* of default states is unchanged. This file proves *behavior* of the
 * interaction paths the bug-fixes touched — things a static fingerprint can't
 * see (navigation, state transitions, cleanup). Each fixed bug gets an
 * assertion here so a future regression fails loudly.
 *
 * Self-contained: starts a static server + headless Chromium (same pattern as
 * capture.mjs). Exit 0 = all pass, 1 = a failure (printed).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CT = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff' };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const fp = path.normalize(path.join(REPO_ROOT, urlPath));
      if (!fp.startsWith(REPO_ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': CT[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const results = [];
function check(name, pass, detail) { results.push({ name, pass, detail }); }

async function freshPage(browser, port) {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/nihongo/app.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof APP !== 'undefined' && !!(document.getElementById('main-inner') || {}).innerHTML, { timeout: 20000 });
  return page;
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch();
  try {
    // ── BUG-1: word lookup lands on the Dictionary page ─────────────────────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(async () => {
        jumpToDictionary('水');
        await new Promise((res) => setTimeout(res, 120)); // let hashchange settle
        const appEl = document.querySelector('.app');
        return {
          section: APP.section,
          libraryPage: APP.libraryPage,
          dictQ: APP.dictQ,
          pendingDictQ: APP.pendingDictQ,
          lsSection: JSON.parse(localStorage.getItem('jp:section') || 'null'),
          librarySidebarShown: appEl.classList.contains('show-library-sidebar'),
          dictNavActive: !!document.querySelector('[data-library-page="dictionary"].active, [data-library-page="dictionary"][aria-current], .library-sidebar .active[data-library-page="dictionary"]'),
          mainHas水: (document.getElementById('main-inner') || {}).textContent?.includes('水') || false,
        };
      });
      check('BUG-1 section is the valid "library" (not invalid "dictionary")', r.section === 'library', `section=${r.section}`);
      check('BUG-1 libraryPage is "dictionary"', r.libraryPage === 'dictionary', `libraryPage=${r.libraryPage}`);
      check('BUG-1 query carried into dictQ', r.dictQ === '水', `dictQ=${r.dictQ}`);
      check('BUG-1 pendingDictQ consumed', r.pendingDictQ == null, `pendingDictQ=${r.pendingDictQ}`);
      check('BUG-1 jp:section persisted as valid "library"', r.lsSection === 'library', `jp:section=${r.lsSection}`);
      check('BUG-1 library sidebar is visible', r.librarySidebarShown === true, `shown=${r.librarySidebarShown}`);
      check('BUG-1 dictionary content rendered (contains 水)', r.mainHas水 === true, `mainHas水=${r.mainHas水}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : '  [' + r.detail + ']'}`);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
