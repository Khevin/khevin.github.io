#!/usr/bin/env node
/*
 * library-sync.test.mjs — the automatic library, in the headless shell:
 * one server plays both roles — the extension bundle (dist/library/…) and the
 * Nihongo site (/site/nihongo/reader-library/ + /site/nihongo/images/…).
 *   1. empty store → sync with the bundled copy → whole curriculum imported
 *   2. sync against the site with the same content → no re-import
 *   3. site publishes a newer revision → imported, replacing the active snapshot
 *   4. site publishes a tampered image (hash mismatch) → rejected, old snapshot stays active
 *
 *   npm run build:library && npm run build:reader && node reader-extension/tests/library-sync.test.mjs
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import esbuild from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '..');
const NIHONGO = path.resolve(EXT, '..');
const DIST = path.join(EXT, 'dist');
for (const p of [path.join(DIST, 'library', 'manifest.json'), path.join(NIHONGO, 'reader-library', 'manifest.json')]) if (!fs.existsSync(p)) { console.error(`${p} missing — run npm run build:library && npm run build:reader`); process.exit(1); }

const bundle = await esbuild.build({ entryPoints: [path.join(HERE, 'sync-harness.js')], bundle: true, format: 'iife', write: false, platform: 'browser' });
const harness = bundle.outputFiles[0].text;
// site override state (mutated by the test between steps)
const site = { manifestOverride: null, tamperAsset: null, manifestStatus: 200, htmlManifest: false, bundledOverride: null };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/page.html') { res.writeHead(200, { 'Content-Type': TYPES['.html'] }); res.end(`<!doctype html><meta charset="utf-8"><title>sync test</title><script>${harness.replace(/<\/script>/g, '<\\/script>')}</script>`); return; }
  let file;
  if (rel === '/library/manifest.json' && site.bundledOverride) { res.writeHead(200, { 'Content-Type': TYPES['.json'] }); res.end(JSON.stringify(site.bundledOverride)); return; }
  if (rel.startsWith('/site/nihongo/')) {
    file = path.normalize(path.join(NIHONGO, rel.slice('/site/nihongo/'.length)));
    if (rel === '/site/nihongo/reader-library/manifest.json') {
      if (site.manifestStatus !== 200) { res.writeHead(site.manifestStatus); res.end('unavailable'); return; }
      if (site.htmlManifest) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html>app fallback</html>'); return; }
      if (site.manifestOverride) { res.writeHead(200, { 'Content-Type': TYPES['.json'] }); res.end(JSON.stringify(site.manifestOverride)); return; }
    }
    if (site.tamperAsset && rel.endsWith(site.tamperAsset)) { res.writeHead(200, { 'Content-Type': TYPES['.webp'] }); res.end(Buffer.from([1, 2, 3, 4])); return; }
  } else file = path.normalize(path.join(DIST, rel));
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const siteManifest = JSON.parse(fs.readFileSync(path.join(NIHONGO, 'reader-library', 'manifest.json'), 'utf8'));

const results = [];
const check = (name, fn) => { try { fn(); results.push([name, true]); console.log(`  ✔ ${name}`); } catch (e) { results.push([name, false]); console.log(`  ✖ ${name}\n      ${e.message.split('\n')[0]}`); } };
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${origin}/page.html`);
  await page.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('nihongo-reader'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
  const active = async () => page.evaluate(async () => { const repo = await window.__repoOpen.openRepo(); try { const lib = await repo.getActiveLibrary(); const src = await repo.getMeta('librarySource'); return lib ? { snapshotId: lib.snapshotId, revision: lib.manifest.revision, cards: lib.cards.length, source: src && src.source } : null; } finally { repo.close(); } });
  const sync = (o) => page.evaluate((o) => window.__sync.syncLibrary(o), o);

  const r1 = await sync({ bundledBase: `${origin}/library/`, appUrl: null });
  const a1 = await active();
  check('1. empty store: the bundled copy is imported (whole curriculum, all images hash-verified)', () => { assert.equal(r1.action, 'imported'); assert.equal(r1.source, 'bundled'); assert.equal(a1.cards, siteManifest.counts.cards); assert.equal(a1.snapshotId, siteManifest.snapshotId); assert.equal(a1.source, 'bundled'); });

  const r2 = await sync({ bundledBase: `${origin}/library/`, appUrl: `${origin}/site/nihongo/app.html` });
  check('2. site has the same content: nothing is re-imported', () => { assert.equal(r2.action, 'none'); assert.equal(r2.error, undefined); });

  site.manifestOverride = { ...siteManifest, revision: siteManifest.revision + 1, snapshotId: 'snap-newer0000001', exportedAt: new Date().toISOString() };
  const r3 = await sync({ bundledBase: `${origin}/library/`, appUrl: `${origin}/site/nihongo/app.html` });
  const a3 = await active();
  check('3. site publishes a newer revision: imported from the site (images from images/), replacing the active snapshot', () => { assert.equal(r3.action, 'imported'); assert.equal(r3.source, 'site'); assert.equal(a3.snapshotId, 'snap-newer0000001'); assert.equal(a3.revision, siteManifest.revision + 1); assert.equal(a3.source, 'site'); assert.equal(a3.cards, siteManifest.counts.cards); });

  const victim = siteManifest.assets[0];
  site.manifestOverride = { ...siteManifest };
  const forced = await sync({ appUrl: `${origin}/site/nihongo/app.html`, force: true });
  const afterForced = await active();
  check('manual check never downgrades a newer imported library', () => {
    assert.equal(forced.action, 'none');
    assert.equal(afterForced.snapshotId, 'snap-newer0000001');
  });

  site.manifestOverride = { ...siteManifest, libraryId: 'another-library', revision: siteManifest.revision + 99 };
  const foreign = await sync({ appUrl: `${origin}/site/nihongo/app.html`, force: true });
  check('manual check never silently replaces an unrelated library', () => assert.equal(foreign.action, 'none'));

  site.manifestOverride = { ...siteManifest, revision: siteManifest.revision + 2, snapshotId: 'snap-tampered00001', exportedAt: new Date().toISOString() };
  site.tamperAsset = victim.sourcePath.split('/').pop();
  const r4 = await sync({ bundledBase: `${origin}/library/`, appUrl: `${origin}/site/nihongo/app.html` });
  const a4 = await active();
  check('4. a tampered image on the site fails the hash check: rejected, previous snapshot stays active', () => { assert.equal(r4.action, 'none'); assert.match(r4.error || '', /hash mismatch|size mismatch|rejected/); assert.equal(a4.snapshotId, 'snap-newer0000001'); });

  site.manifestStatus = 404;
  const unpublished = await sync({ bundledBase: `${origin}/library/`, appUrl: `${origin}/site/nihongo/app.html`, force: true });
  check('unpublished online updates keep the existing library usable, without claiming it is current online', () => {
    assert.equal(unpublished.action, 'none'); assert.equal(unpublished.error, undefined);
    assert.equal(unpublished.remoteStatus, 'not-published'); assert.match(unpublished.notice, /not published/);
    assert.equal(unpublished.manifest.snapshotId, 'snap-newer0000001');
  });

  site.bundledOverride = { ...siteManifest, revision: siteManifest.revision + 3, snapshotId: 'snap-bundleupdate1' };
  const localUpdate = await sync({ bundledBase: `${origin}/library/`, appUrl: `${origin}/site/nihongo/app.html` });
  const afterLocal = await active();
  check('a newer extension bundle updates an existing installation even when the site has no manifest', () => {
    assert.equal(localUpdate.action, 'imported'); assert.equal(localUpdate.source, 'bundled');
    assert.equal(afterLocal.snapshotId, 'snap-bundleupdate1'); assert.match(localUpdate.notice, /not published/);
  });

  site.manifestStatus = 503;
  const serverFailure = await sync({ appUrl: `${origin}/site/nihongo/app.html` });
  check('server failures retain their HTTP status and full manifest URL', () => {
    assert.equal(serverFailure.remoteStatus, 'http'); assert.match(serverFailure.error, /HTTP 503.*reader-library\/manifest.json/);
  });
  site.manifestStatus = 200; site.htmlManifest = true;
  const invalid = await sync({ appUrl: `${origin}/site/nihongo/app.html` });
  check('an HTML fallback is distinguished from an unpublished library', () => {
    assert.equal(invalid.remoteStatus, 'invalid'); assert.match(invalid.error, /Expected a JSON/);
  });

  check('no page errors', () => assert.deepEqual(errors, []));
} finally { await browser.close(); server.close(); }
const failed = results.filter(r => !r[1]);
console.log(`\nlibrary sync: ${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
