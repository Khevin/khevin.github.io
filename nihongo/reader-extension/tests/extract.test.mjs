#!/usr/bin/env node
/*
 * extract.test.mjs — runs src/extract.js against fixtures/dom/*.html in the
 * Playwright headless shell (same launch as tests/capture.mjs; no extension
 * needed). The module is bundled to an IIFE with esbuild and injected, then
 * ranges are built in-page and the extraction result is asserted here.
 *
 *   node reader-extension/tests/extract.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import esbuild from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '..');
const fixture = pathToFileURL(path.join(EXT, 'fixtures', 'dom', 'nintendo-like.html')).href;

const bundle = await esbuild.build({ entryPoints: [path.join(EXT, 'src', 'extract.js')], bundle: true, format: 'iife', globalName: '__extract', write: false });
const extractSrc = bundle.outputFiles[0].text;

const results = [];
const check = (name, fn) => { try { fn(); results.push([name, true]); console.log(`  ✔ ${name}`); } catch (e) { results.push([name, false, e.message]); console.log(`  ✖ ${name}\n      ${e.message.split('\n')[0]}`); } };

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(fixture);
  await page.addScriptTag({ content: extractSrc });

  // helper: select from (startSel, startOffsetInTextContent) to (endSel, endOffset) at the text-node level, or whole elements
  const run = (spec) => page.evaluate((spec) => {
    const r = document.createRange();
    const pick = (sel, off) => {
      const el = document.querySelector(sel);
      if (off == null) return null;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n, acc = 0;
      while ((n = w.nextNode())) { if (acc + n.data.length >= off) return [n, off - acc]; acc += n.data.length; }
      return null;
    };
    if (spec.start) { const [n, o] = pick(spec.start[0], spec.start[1]); r.setStart(n, o); } else r.setStartBefore(document.querySelector(spec.startBefore));
    if (spec.end) { const [n, o] = pick(spec.end[0], spec.end[1]); r.setEnd(n, o); } else r.setEndAfter(document.querySelector(spec.endAfter));
    const out = __extract.extractRange(r);
    return { captureKind: out.captureKind, blocks: out.blocks.map(b => ({ text: b.text, ruby: b.ruby, spans: b.sourceMap.length })) };
  }, spec);

  const intro = await run({ startBefore: '#intro', endAfter: '#intro' });
  check('responsive <br class=sp> and plain <br> stay inside ONE block as layout breaks', () => {
    assert.equal(intro.blocks.length, 1);
    assert.equal(intro.blocks[0].text, '3つの力をつかさどる聖三角――トライフォース。\nはるか昔にこの世界を創りし\n三大神がのこした力で、\n触れた者の願いをかなえるとされる。');
  });
  check('inline <span class=hyphen> is concatenated, not split', () => {
    assert.ok(intro.blocks[0].text.includes('聖三角――トライフォース'));
    assert.ok(intro.blocks[0].spans >= 3);
  });

  const wholeBody = await run({ startBefore: '#heading', endAfter: '#form-line' });
  const texts = wholeBody.blocks.map(b => b.text);
  check('hidden twin (display:none), pre-reveal (visibility:hidden), modal, script text are excluded', () => {
    assert.ok(!texts.some(t => t.includes('隠しコピー')));
    assert.ok(!texts.some(t => t.includes('まだ表示されていない')));
    assert.ok(!texts.some(t => t.includes('オカリナ')));
    assert.ok(!texts.some(t => t.includes('スクリプト')));
  });
  check('form fields and contenteditable are never collected automatically', () => {
    const line = texts.find(t => t.startsWith('名前'));
    assert.ok(line, 'form line block exists');
    assert.ok(!line.includes('入力された') && !line.includes('編集中') && !line.includes('編集可能'));
    assert.ok(line.includes('以上。'));
  });
  check('separate <p> elements become separate blocks (paragraph queue)', () => {
    assert.ok(texts.includes('コキリの森で暮らす少年。'));
    assert.ok(texts.includes('ハイラル王国の姫君。'));
  });
  check('image headings contribute nothing to selection text', () => {
    assert.ok(!texts.some(t => t.includes('運命に導く')));
  });

  const profile = await run({ startBefore: '#profile', endAfter: '#profile' });
  check('ruby: rt excluded from base text, reading recorded as a span over 目論', () => {
    const t = profile.blocks[0].text;
    assert.ok(t.endsWith('トライフォースを手に入れようと目論む。'), t);
    assert.ok(!t.includes('もくろ'));
    assert.equal(profile.blocks[0].ruby.length, 1);
    const r = profile.blocks[0].ruby[0];
    assert.equal(t.slice(r.start, r.end), '目論');
    assert.equal(r.reading, 'もくろ');
  });

  const partial = await run({ start: ['#nested', 3], end: ['#nested', 15] });
  check('partial first/last text nodes across nested inline elements are sliced exactly', () => {
    assert.equal(partial.blocks.length, 1);
    assert.equal(partial.blocks[0].text, '、森の守り神「デクの樹サマ」'.slice(0, 12));
  });

  const alt = await page.evaluate(() => {
    const a = __extract.extractImageAlt(document.getElementById('alt-heading'));
    const b = __extract.extractImageAlt(document.getElementById('empty-alt'));
    return { a: a && { kind: a.captureKind, text: a.blocks[0].text }, b };
  });
  check('image alt: meaningful alt becomes an image-alt capture; empty alt is null', () => {
    assert.deepEqual(alt.a, { kind: 'image-alt', text: '運命に導くトライフォース' });
    assert.equal(alt.b, null);
  });

  check('no page errors while extracting', () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
}

const failed = results.filter(r => !r[1]);
console.log(`\nextract: ${results.length - failed.length}/${results.length} passed`);
process.exitCode = failed.length ? 1 : 0;
