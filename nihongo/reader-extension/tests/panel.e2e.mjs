#!/usr/bin/env node
/*
 * panel.e2e.mjs — the M1 reading loop end to end, in the served-dist mode
 * (dist/ over 127.0.0.1 with the MV3 CSP header, headless shell):
 *   import the sample library → paste a Nintendo sentence → blocks render with
 *   labels → click the 森 block → word panel → click 森 → kanji panel shows the
 *   card with its image → set familiarity → encounter count 1 → reload → still 1
 *   → second sentence containing 森 → count 2 → Phrases view renders groups.
 *
 *   npm run build:reader && npm run build:sample-library && node reader-extension/tests/panel.e2e.mjs
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '..');
const DIST = path.join(EXT, 'dist');
const ZIP = path.join(EXT, 'fixtures', 'sample-library.zip');
for (const [p, hint] of [[path.join(DIST, 'sidepanel.html'), 'npm run build:reader'], [ZIP, 'npm run build:sample-library']]) if (!fs.existsSync(p)) { console.error(`${p} missing — run ${hint}`); process.exit(1); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.gz': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  const data = fs.readFileSync(file);
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': data.length, 'Content-Security-Policy': "script-src 'self'; object-src 'self'" });
  res.end(data);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/sidepanel.html`;
const zipB64 = fs.readFileSync(ZIP).toString('base64');

const results = [];
const check = (name, pass, detail = '') => { results.push([name, pass]); console.log(`  ${pass ? '✔' : '✖'} ${name}${detail ? ' — ' + detail : ''}`); };
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 900 } });
  // Record what the panel plays and what it speaks. Applied to the context so
  // it survives the reload step, which opens a fresh page.
  await ctx.addInitScript(`
    window.__played = []; window.__spoke = [];
    window.Audio = class { constructor(src) { this.src = src; window.__played.push(src); } play() { return Promise.resolve(); } pause() {} };
    if (window.speechSynthesis) window.speechSynthesis.speak = (u) => { window.__spoke.push(u.text); };
  `);
  let page = await ctx.newPage();
  const errors = [];
  const hook = (p) => { p.on('pageerror', e => errors.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); }); };
  hook(page);
  await page.goto(url);
  await page.waitForFunction(() => window.__reader && window.__reader.state);
  await page.evaluate(() => indexedDB.deleteDatabase('nihongo-reader'));
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload(); await page.waitForFunction(() => window.__reader && window.__reader.state);

  // empty state
  check('empty state shows instructions and a paste box', await page.locator('textarea.paste').count() === 1);
  // the library arrives by itself (bundled copy in dist/library) — no import step
  await page.waitForFunction(() => window.__reader.state.library && window.__reader.state.library.count > 0, null, { timeout: 60000 });
  const autoLib = await page.evaluate(() => ({ count: window.__reader.state.library.count, rev: window.__reader.state.library.manifest.revision, src: window.__reader.state.library.source && window.__reader.state.library.source.source }));
  check('library loads automatically at first boot from the bundled copy (whole curriculum)', autoLib.count >= 250 && autoLib.src === 'bundled', JSON.stringify(autoLib));

  // import library (manual zip path still works and is idempotent for the same snapshot)
  await page.evaluate(async (b64) => { const bin = atob(b64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); await window.__reader.importZipBytes(bytes, 'sample-library.zip'); }, zipB64);
  await page.waitForFunction(() => window.__reader.state.library && window.__reader.state.library.count > 0, null, { timeout: 60000 });
  const libCount = await page.evaluate(() => window.__reader.state.library.count);
  check('sample library imported into IndexedDB', libCount > 50, `${libCount} cards`);

  // study a sentence via the paste path
  await page.evaluate(() => window.__reader.studyText('コキリの森で暮らす少年。'));
  await page.waitForFunction(() => window.__reader.state.analysis && !window.__reader.state.analyzing, null, { timeout: 60000 });
  await page.waitForFunction(() => /saved/.test(document.getElementById('status')?.textContent || ''), null, { timeout: 20000 });
  const blocks = await page.$$eval('.ss-blocks-row .ss-blk', els => els.map(e => ({ text: e.textContent.replace(/\s+/g, ''), cls: e.className, aria: e.getAttribute('aria-label') })));
  check('Words view renders one block per word with kind classes', blocks.length === 7 && blocks[0].cls.includes('ss-noun') && blocks[1].cls.includes('ss-part') && blocks[1].cls.includes('ss-h-no') && blocks[4].cls.includes('ss-verb') && blocks[6].cls.includes('ss-stop'), blocks.map(b => b.text).join(' | '));
  check('every block carries a text role in its accessible name', blocks.every(b => !b.aria || /noun|verb|particle|sentence end|word/.test(b.aria)));
  const legend = await page.$$eval('.ss-breakdown .ss-bd', els => els.map(e => e.textContent));
  check('legend explains roles in Words view (genitive, で-marked place, relative clause, の link)', legend.length >= 5 && legend.some(t => t.includes('of / belonging to')) && legend.some(t => t.includes('で-marked')) && legend.some(t => t.includes('describes')) && legend.some(t => t.includes('of / links nouns')), legend.join(' · '));
  check('status reports the encounter save', /saved ✓ 4/.test(await page.textContent('#status')), await page.textContent('#status'));

  // word → kanji
  await page.locator('.ss-blocks-row .ss-blk', { hasText: '森' }).first().click();
  await page.waitForSelector('#word-panel');
  const wordTitle = await page.textContent('#word-panel h2');
  check('word panel shows the word with reading', /森/.test(wordTitle) && /mori/.test(wordTitle), wordTitle.trim());
  await page.click('#word-panel .kbtns button[data-glyph="森"]');
  await page.waitForSelector('#kanji-panel');
  const avail = await page.textContent('#kanji-panel .avail');
  check('kanji panel finds the card in the imported library', /In your cards/.test(avail) && /nature\/forest|forest/.test(avail), avail.trim());
  await page.waitForFunction(() => { const img = document.querySelector('#kanji-panel .card img'); return img && img.complete && img.naturalWidth > 0; }, null, { timeout: 15000 });
  const imgInfo = await page.$eval('#kanji-panel .card img', img => ({ w: img.naturalWidth, src: img.src.slice(0, 5) }));
  check('mnemonic image renders from IndexedDB (blob URL, offline)', imgInfo.w > 0 && imgInfo.src === 'blob:', `${imgInfo.w}px`);
  check('keyword and story are hidden until revealed', (await page.locator('#kanji-panel .reveal').count()) === 1);
  await page.click('#kanji-panel .reveal');
  check('reveal shows keyword', /keyword/.test(await page.textContent('#kanji-panel dl')));
  check('encounter count is 1 after one sentence', /Studied encounters: 1/.test(await page.textContent('#kanji-panel .enc')));
  await page.click('#kanji-panel .fam button[data-f="unfamiliar"]');
  await page.waitForFunction(() => document.querySelector('#kanji-panel .fam button[data-f="unfamiliar"]')?.getAttribute('aria-pressed') === 'true');
  check('familiarity can be set to unfamiliar (separate from card availability)', true);
  await page.click('#kanji-panel .back[data-act="back-word"]');
  await page.waitForSelector('#word-panel');
  check('back from the kanji returns to the same word so the other kanji stay reachable', /森/.test(await page.textContent('#word-panel h2')));
  // a phrase block lists its words first, then the individual kanji
  await page.click('.seg button[data-level="phrases"]');
  await page.waitForSelector('.ss-sentence-build[data-level="phrases"]');
  await page.locator('.ss-blocks-row .ss-blk', { hasText: 'コキリの森' }).first().click();
  await page.waitForSelector('#word-panel .wlist');
  const wordsListed = await page.$$eval('#word-panel .wrow b', els => els.map(e => e.textContent));
  const chips = await page.$$eval('#word-panel .kbtns .kchip .g', els => els.map(e => e.textContent));
  check('phrase panel: words first (コキリ, 森), separator, then kanji chips (森)', wordsListed.includes('森') && chips.join('') === '森' && (await page.locator('#word-panel .sep').count()) === 1, `${wordsListed.join(', ')} | ${chips.join(', ')}`);
  const moriRow = await page.$eval('#word-panel .wrow:has-text("森") .right', e => e.textContent);
  const kokiriRow = await page.$eval('#word-panel .wrow:has-text("コキリ") .right', e => e.textContent);
  check('word rows carry the Nihongo meaning right-aligned (森 → forest · noun) and offer translate for unknown names', /forest/.test(moriRow) && /noun/.test(moriRow) && /translate/.test(kokiriRow), `${moriRow.trim()} | ${kokiriRow.trim()}`);
  // translation opens INSIDE the panel (Google endpoint mocked), Japanese on top, English below, dictionary senses, external link kept
  await page.route('https://commons.wikimedia.org/**', (route) => route.fulfill({ json: { query: { pages: {} } } }));
  await page.route('https://translate.googleapis.com/**', (route) => route.fulfill({ json: { sentences: [{ trans: 'Kokiri', orig: 'コキリ' }, { src_translit: 'Kokiri' }], dict: [{ pos: 'noun', terms: ['Kokiri', 'forest folk'] }] } }));
  // One manual click, one outside request. Pictures used to ride along with
  // translate, which quietly spent a Google Custom Search query (100 a day)
  // on every translation.
  const outbound = [];
  page.on('request', (r) => { const u = r.url(); if (/translate\.googleapis|googleapis\.com\/customsearch|pixabay\.com\/api|commons\.wikimedia/.test(u)) outbound.push(u.split('?')[0]); });

  await page.click('#word-panel .wrow:has-text("コキリ") .xlate');
  await page.waitForFunction(() => document.querySelector('#xlate-panel .xl-en') && !/translating/.test(document.querySelector('#xlate-panel .xl-en').textContent));
  const xl = await page.$eval('#xlate-panel', (el) => ({ ja: el.querySelector('.xl-ja').textContent, en: el.querySelector('.xl-en').textContent, senses: el.querySelector('.xl-senses')?.textContent, link: el.querySelector('.xl-foot a')?.getAttribute('href'), belowWord: el.compareDocumentPosition(document.getElementById('word-panel')) & Node.DOCUMENT_POSITION_PRECEDING }));
  check('inline translation renders under the details: Japanese, English, senses, and the external link as fallback', /コキリ/.test(xl.ja) && /Kokiri/.test(xl.en) && /forest folk/.test(xl.senses || '') && /translate\.google\.com/.test(xl.link || '') && !!xl.belowWord, `${xl.ja} → ${xl.en}`);
  check('a translate click sends one request, and no picture search rides along with it', outbound.length === 1 && /translate\.googleapis/.test(outbound[0]), outbound.join(', ') || 'nothing sent');

  await page.click('#word-panel .wrow:has-text("コキリ") .xlate');
  await page.waitForFunction(() => /cached/.test(document.querySelector('#xlate-panel .xl-foot')?.textContent || ''));
  check('a repeat translation costs no request at all', outbound.length === 1, outbound.join(', '));
  check('the second request for the same word is served from the cache', true);
  // pictures: Google Custom Search mocked (two results: an illustration and a white text card); the text card is screened out
  const photoPng = await sharp({ create: { width: 120, height: 90, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).png().toBuffer();
  const textPng = await sharp({ create: { width: 120, height: 90, channels: 3, background: '#ffffff' } }).composite([{ input: Buffer.from('<svg width="120" height="90"><rect x="10" y="20" width="100" height="6" fill="#111"/><rect x="10" y="40" width="80" height="6" fill="#111"/><rect x="10" y="60" width="95" height="6" fill="#111"/></svg>'), top: 0, left: 0 }]).png().toBuffer();
  await page.route('https://www.googleapis.com/customsearch/**', (route) => route.fulfill({ json: { items: [{ link: 'https://img.test/photo.png', title: 'photo', image: { thumbnailLink: 'https://thumbs.test/photo.png', contextLink: 'https://page.test/photo', width: 800, height: 600 } }, { link: 'https://img.test/text.png', title: 'text card', image: { thumbnailLink: 'https://thumbs.test/text.png', contextLink: 'https://page.test/text', width: 800, height: 600 } }], queries: { nextPage: [{ startIndex: 11 }] } } }));
  await page.route('https://pixabay.com/api/**', (route) => { const u = new URL(route.request().url()); const ok = u.searchParams.get('lang') === 'ja' && u.searchParams.get('key') === 'px' && u.searchParams.get('safesearch') === 'true'; return route.fulfill({ json: ok ? { total: 2, totalHits: 2, hits: [{ id: 1, pageURL: 'https://pixabay.com/photos/photo-1/', tags: 'photo', previewURL: 'https://thumbs.test/photo.png' }, { id: 2, pageURL: 'https://pixabay.com/photos/text-2/', tags: 'text card', previewURL: 'https://thumbs.test/text.png' }] } : { hits: [] } }); });
  await page.route('https://thumbs.test/**', (route) => route.fulfill({ contentType: 'image/png', body: route.request().url().endsWith('text.png') ? textPng : photoPng }));
  await page.evaluate(() => { window.__reader.state.pixabayKey = 'px'; window.__reader.state.imagesKey = 'k'; window.__reader.state.imagesCx = 'c'; });

  // One manual click, one outside request. Pictures used to ride along with
  // translate, which quietly spent a Google Custom Search query (100 a day)
  // on every translation.
  // pictures live where the word is the subject: its own panel and the translation footer
  await page.click('#word-panel .wrow:has-text("コキリ") .jp');
  await page.waitForSelector('#word-panel [data-act="images"]');
  await page.click('#word-panel [data-act="images"]');
  await page.waitForFunction(() => document.querySelector('#images-panel .image-gallery') && document.querySelectorAll('#images-panel .thumb img').length >= 1 && /text-only/.test(document.querySelector('#images-panel .xl-foot')?.textContent || ''), null, { timeout: 15000 });
  const gal = await page.$eval('#images-panel', (el) => ({ shown: el.querySelectorAll('.thumb').length, imgs: el.querySelectorAll('.thumb img').length, foot: el.querySelector('.xl-foot').textContent, below: !!(document.getElementById('xlate-panel') && (document.getElementById('xlate-panel').compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) }));
  check('picture gallery renders under the translation from Pixabay (lang=ja, safesearch) ahead of the Google key, screening out the text-only card (1 shown, 1 hidden, toggle offered)', gal.shown === 1 && gal.imgs === 1 && /show 1 text-only/.test(gal.foot) && /Pixabay/.test(gal.foot) && !/more/.test(gal.foot) && gal.below, gal.foot.trim());
  check('the picture search goes out only when pictures are asked for', outbound.filter(u => /pixabay/.test(u)).length === 1, outbound.join(', '));
  await page.click('#images-panel [data-act="images-toggle"]');
  const shownAll = await page.$$eval('#images-panel .thumb', els => els.length);
  check('"show text-only" reveals the screened picture', shownAll === 2);

  // Fill the existing gallery to exercise wrapping and scrolling at panel widths.
  await page.evaluate(() => {
    const g = window.__reader.state.images;
    const photo = g.items.find(i => !i.textLike);
    g.items = Array.from({ length: 15 }, (_, i) => ({ ...photo, title: `Picture ${i + 1}` }));
    g.showHidden = false; g.hidden = 0;
    window.__reader.render();
  });
  const galleryMetrics = () => page.$eval('.image-gallery', el => {
    const boxes = [...el.querySelectorAll('.thumb')].map(x => x.getBoundingClientRect());
    return { columns: boxes.filter(b => Math.abs(b.top - boxes[0].top) < 1).length, vertical: el.scrollHeight > el.clientHeight, horizontal: el.scrollWidth > el.clientWidth + 1, count: boxes.length };
  });
  const narrow = await galleryMetrics();
  check('narrow gallery shows three pictures per row and scrolls vertically without horizontal overflow', narrow.columns === 3 && narrow.vertical && !narrow.horizontal && narrow.count === 15, JSON.stringify(narrow));
  const scrollBefore = await page.evaluate(() => { const gallery = document.querySelector('.image-gallery'); gallery.focus(); gallery.scrollTop = 80; const top = gallery.scrollTop; window.__reader.render(); return top; });
  const keptScroll = await page.$eval('.image-gallery', el => ({ top: el.scrollTop, focused: document.activeElement === el }));
  check('gallery keeps its scroll position and keyboard focus when thumbnails repaint', scrollBefore > 0 && keptScroll.top === scrollBefore && keptScroll.focused, JSON.stringify(keptScroll));
  if (process.env.NIHONGO_GALLERY_PREVIEW_DIR) {
    fs.mkdirSync(process.env.NIHONGO_GALLERY_PREVIEW_DIR, { recursive: true });
    await page.locator('#images-panel').screenshot({ path: path.join(process.env.NIHONGO_GALLERY_PREVIEW_DIR, 'gallery-three-columns.png') });
  }
  await page.setViewportSize({ width: 560, height: 900 });
  const wide = await galleryMetrics();
  check('a wider panel shows four pictures per row with no horizontal overflow', wide.columns === 4 && !wide.horizontal, JSON.stringify(wide));
  if (process.env.NIHONGO_GALLERY_PREVIEW_DIR) await page.locator('#images-panel').screenshot({ path: path.join(process.env.NIHONGO_GALLERY_PREVIEW_DIR, 'gallery-four-columns.png') });
  await page.evaluate(() => { const g = window.__reader.state.images; g.id++; g.galleryKey = g.id; window.__reader.render(); });
  check('a new gallery starts at the top instead of inheriting the last word’s scroll', await page.$eval('.image-gallery', el => el.scrollTop) === 0);
  await page.setViewportSize({ width: 400, height: 900 });

  // back to the phrase, where the word list lives
  await page.click('#word-panel .back[data-act="back-phrase"]');
  await page.waitForSelector('#word-panel .wlist');

  // Listen with the learner's Google Cloud voice: the panel is an extension
  // page, so it fetches and plays the clip itself, with no service worker.
  const synth = [];
  await page.route('https://texttospeech.googleapis.com/**', (route) => {
    synth.push({ url: route.request().url(), body: JSON.parse(route.request().postData() || '{}') });
    return synth.length === 1 ? route.fulfill({ json: { audioContent: 'QUJD' } }) : route.fulfill({ status: 403, json: { error: { message: 'API key not valid.' } } });
  });
  await page.evaluate(() => { window.__reader.state.tts = { rate: 0.8, voiceURI: 'gcloud:ja-JP-Wavenet-A', key: 'AIza-panel' }; window.__played = []; window.__spoke = []; });
  await page.click('[data-act="listen"]');
  await page.waitForFunction(() => window.__played.length > 0, null, { timeout: 10000 });
  const listened = await page.evaluate(() => ({ played: window.__played, spoke: window.__spoke }));
  check('the panel speaks with the chosen Cloud voice on its own, without the service worker or a browser utterance', synth.length === 1 && synth[0].body.voice.name === 'ja-JP-Wavenet-A' && synth[0].body.audioConfig.speakingRate === 0.8 && listened.played[0] === 'data:audio/mpeg;base64,QUJD' && listened.spoke.length === 0, JSON.stringify(listened.played) + ' · spoke ' + listened.spoke.length);

  await page.waitForTimeout(750);            // the same phrase inside 700 ms is a double-click
  await page.evaluate(() => { window.__played = []; window.__spoke = []; });
  await page.click('[data-act="listen"]');
  await page.waitForFunction(() => window.__spoke.length > 0, null, { timeout: 10000 });
  const fellBack = await page.evaluate(() => ({ played: window.__played.length, spoke: window.__spoke.length }));
  check('a refused key falls back to the browser voice, so Listen always makes a sound', fellBack.played === 0 && fellBack.spoke === 1, JSON.stringify(fellBack));

  // moving to another word fades the translation out instead of leaving it behind
  await page.click('#word-panel .wrow[data-token]:has-text("森")');
  const leaving = await page.evaluate(() => { const el = document.getElementById('xlate-panel'); return el ? el.classList.contains('leaving') : 'gone'; });
  await page.waitForFunction(() => !document.getElementById('xlate-panel') && !document.getElementById('images-panel'), null, { timeout: 3000 });
  check('changing words fades the stale translation and gallery out (300 ms) and removes them', leaving === true || leaving === 'gone', String(leaving));
  await page.click('#word-panel .back[data-act="back-phrase"]');
  await page.waitForSelector('#word-panel .wlist');
  await page.click('#word-panel .wrow[data-token]:has-text("森")');
  await page.waitForFunction(() => document.querySelector('#word-panel .back[data-act="back-phrase"]'));
  check('choosing a word narrows the panel and offers a way back to the phrase', /森/.test(await page.textContent('#word-panel h2')));
  await page.click('#word-panel .back[data-act="back-phrase"]');
  await page.waitForSelector('#word-panel .wlist');
  await page.click('.seg button[data-level="words"]');

  // reload: history persists, reopening the same sentence in the same session adds nothing
  await page.reload(); await page.waitForFunction(() => window.__reader && window.__reader.state && window.__reader.state.library);
  await page.evaluate(() => window.__reader.studyText('コキリの森で暮らす少年。'));
  await page.waitForFunction(() => /saved/.test(document.getElementById('status')?.textContent || ''), null, { timeout: 60000 });
  await page.evaluate(() => window.__reader.openKanji('森', '森'));
  await page.waitForSelector('#kanji-panel');
  const meta1 = await page.textContent('#kanji-panel .enc');
  const fam = await page.getAttribute('#kanji-panel .fam button[data-f="unfamiliar"]', 'aria-pressed');
  check('after reload: count still 1 (same session, same sentence) and familiarity retained', /Studied encounters: 1/.test(meta1) && fam === 'true', meta1.trim().slice(0, 60));

  // second sentence with 森 → 2
  await page.evaluate(() => window.__reader.studyText('森の守り神「デクの樹サマ」から、自身が背負う運命を告げられる。'));
  await page.waitForFunction(() => /saved ✓ \d/.test(document.getElementById('status')?.textContent || ''), null, { timeout: 60000 });
  await page.evaluate(() => window.__reader.openKanji('森', '森'));
  await page.waitForSelector('#kanji-panel');
  check('another sentence containing 森 raises the count to 2', /Studied encounters: 2/.test(await page.textContent('#kanji-panel .enc')));

  // phrases view
  await page.click('.seg button[data-level="phrases"]');
  await page.waitForSelector('.ss-sentence-build[data-level="phrases"]');
  const phraseBlocks = await page.$$eval('.ss-blocks-row .ss-blk', els => els.map(e => e.textContent.replace(/\s+/g, '')));
  check('Phrases view groups the の-chain into one noun block', phraseBlocks.some(t => t.includes('森の守り神')), phraseBlocks.join(' | '));
  const keys = await page.evaluate(() => Object.keys(window.__reader.state.analysis));
  check('analysis carries versions for reproducibility', keys.includes('versions'));
  check('no console or page errors across the loop', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter(r => !r[1]);
console.log(`\npanel e2e: ${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
