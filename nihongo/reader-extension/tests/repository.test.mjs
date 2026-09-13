#!/usr/bin/env node
/*
 * repository.test.mjs — drives the real IndexedDB repository + study commit in
 * the Playwright headless shell (served over 127.0.0.1 so crypto.subtle and
 * IndexedDB are available). Covers the handoff §7.1 counting table rows that
 * need storage: retries with the same actionId, concurrent double-send,
 * reopen after reload, undo void, browser restart, session expiry.
 *
 *   node reader-extension/tests/repository.test.mjs
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import esbuild from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundle = await esbuild.build({ entryPoints: [path.join(HERE, 'repo-harness.js')], bundle: true, format: 'iife', write: false, platform: 'browser' });
const harness = bundle.outputFiles[0].text;
const html = `<!doctype html><meta charset="utf-8"><title>repo test</title><script>${harness.replace(/<\/script>/g, '<\\/script>')}</script>`;
const server = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const results = [];
const check = (name, fn) => { try { fn(); results.push([name, true]); console.log(`  ✔ ${name}`); } catch (e) { results.push([name, false]); console.log(`  ✖ ${name}\n      ${e.message.split('\n')[0]}`); } };
const src = (u) => ({ url: u, title: 't', domain: new URL(u).hostname, capturedAt: '2026-09-08T12:00:00.000Z' });
const N = 'https://www.nintendo.com/jp/games/switch2/aa9ja/triforce/index.html';

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext();
  let page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => window.__repo.reset());
  const study = (p, o) => page.evaluate(([p, o]) => window.__repo.study(p, o), [p, o || {}]);
  const count = (k) => page.evaluate((k) => window.__repo.count(k), k);

  const firstConcurrent = await page.evaluate(() => window.__repo.studyMany(Array.from({ length: 4 }, (_, i) => ({
    actionId: `first-${i}`, displayText: '森で読む。', captureKind: 'paste', fragment: false,
    source: { url: null, title: null, domain: 'paste', capturedAt: new Date().toISOString() },
  }))));
  check('concurrent FIRST studies share one installation/run/session and count each kanji once', () => {
    assert.equal(new Set(firstConcurrent.map(r => r.sessionId)).size, 1);
    assert.equal(firstConcurrent.filter(r => r.newSession).length, 1);
    assert.equal(firstConcurrent.reduce((n, r) => n + r.added, 0), 2);
  });
  await page.evaluate(() => window.__repo.reset());

  const r1 = await study({ actionId: 'a1', displayText: 'コキリの森で暮らす少年。', source: src(N), captureKind: 'selection', fragment: false });
  check('first study adds one event per distinct kanji and opens a session', () => { assert.equal(r1.added, 4); assert.equal(r1.newSession, true); assert.deepEqual(r1.kanji.sort(), ['少', '年', '暮', '森']); });
  check('count(森) is 1 after one sentence', async () => {});
  assert.equal(await count('森'), 1);

  const r2 = await study({ actionId: 'a1', displayText: 'コキリの森で暮らす少年。', source: src(N), captureKind: 'selection', fragment: false });
  check('retry with the same actionId (lost ack) adds 0', () => { assert.equal(r2.added, 0); assert.equal(r2.skipped, 4); });
  const r3 = await study({ actionId: 'a2', displayText: 'コキリの森で\n暮らす少年。', source: src('https://example.jp/copy'), captureKind: 'selection', fragment: false });
  check('same text in another tab/source (different actionId) adds 0 in the same session', () => assert.equal(r3.added, 0));
  assert.equal(await count('森'), 1);

  const dbl = await page.evaluate(() => window.__repo.studyMany([
    { actionId: 'b1', displayText: '森の守り神から告げられる。', source: { url: 'https://x.jp/1', title: 't', domain: 'x.jp', capturedAt: '2026-09-08T12:00:00.000Z' }, captureKind: 'paste', fragment: false },
    { actionId: 'b2', displayText: '森の守り神から告げられる。', source: { url: 'https://x.jp/1', title: 't', domain: 'x.jp', capturedAt: '2026-09-08T12:00:00.000Z' }, captureKind: 'paste', fragment: false },
  ]));
  check('two concurrent commits of the same sentence add its 4 kanji exactly once', () => { assert.equal(dbl[0].added + dbl[1].added, 4); });
  assert.equal(await count('森'), 2, 'second distinct sentence increments 森 to 2');
  assert.equal(await count('守'), 1);

  // reload the page (panel closed/reopened; worker restarted) — storage persists, same browser run (same tab)
  await page.reload();
  await page.waitForFunction(() => window.__repo);
  check('history survives a page reload', () => {});
  assert.equal(await count('森'), 2);
  const r4 = await study({ actionId: 'c1', displayText: 'コキリの森で暮らす少年。', source: src(N), captureKind: 'selection', fragment: false });
  check('reopening the same sentence after reload (same browser run, session alive) adds 0', () => assert.equal(r4.added, 0));

  const v = await page.evaluate(() => window.__repo.voidAction('b1'));
  const v2 = await page.evaluate(() => window.__repo.voidAction('b2'));
  check('undo voids the events of one action and the aggregate is rebuilt', () => { assert.equal(v.voided + v2.voided, 4); });
  assert.equal(await count('森'), 1);
  assert.equal(await count('守'), 0);
  const r5 = await study({ actionId: 'b3', displayText: '森の守り神から告げられる。', source: src('https://x.jp/1'), captureKind: 'paste', fragment: false });
  check('re-rendering a voided sentence in the same session does not resurrect its events', () => assert.equal(r5.added, 0));
  assert.equal(await count('守'), 0);

  await page.evaluate(() => window.__repo.expireSession());
  const r6 = await study({ actionId: 'd1', displayText: 'コキリの森で暮らす少年。', source: src(N), captureKind: 'selection', fragment: false });
  check('after 30 minutes without study, the same sentence starts a new session and counts again', () => { assert.equal(r6.newSession, true); assert.equal(r6.added, 4); });
  assert.equal(await count('森'), 2);

  await page.evaluate(() => window.__repo.newBrowserRun());
  const r7 = await study({ actionId: 'e1', displayText: 'コキリの森で暮らす少年。', source: src(N), captureKind: 'selection', fragment: false });
  check('a new browser run starts a new session (deliberate policy)', () => { assert.equal(r7.newSession, true); assert.equal(r7.added, 4); });
  assert.equal(await count('森'), 3);

  const st = await page.evaluate(() => window.__repo.setState({ kanjiKey: '森', familiarity: 'unfamiliar' }));
  const st2 = await page.evaluate(() => window.__repo.setState({ kanjiKey: '森', wantCard: true }));
  const k = await page.evaluate(() => window.__repo.kanji('森'));
  check('familiarity and wantCard are stored separately from counts with a rising revision', () => { assert.equal(st.revision, 1); assert.equal(st2.revision, 2); assert.equal(k.state.familiarity, 'unfamiliar'); assert.equal(k.state.wantCard, true); assert.equal(k.aggregate.count, 3); assert.equal(k.recent.length, 3); });
  check('no page errors', () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter(r => !r[1]);
console.log(`\nrepository: ${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
