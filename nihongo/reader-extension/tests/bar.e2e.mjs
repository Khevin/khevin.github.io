#!/usr/bin/env node
/*
 * bar.e2e.mjs — the in-page reading surface, in the headless shell:
 * serve dist/ plus the Nintendo-like DOM fixture, stub `chrome.*` so the
 * content script's messages are answered by an in-page copy of the analysis
 * worker (no service worker available outside an extension), then:
 *   select 「コキリの森で暮らす少年。」 → FAB appears above the selection on the
 *   left → click → bar renders 7 blocks → Phrases view → second sentence via ›
 *   → Escape hides → page layout untouched (shadow DOM) → prefs.enabled=false hides everything.
 *
 *   npm run build:reader && node reader-extension/tests/bar.e2e.mjs
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = path.resolve(HERE, '..');
const DIST = path.join(EXT, 'dist');
const FIXTURE = fs.readFileSync(path.join(EXT, 'fixtures', 'dom', 'nintendo-like.html'), 'utf8');
if (!fs.existsSync(path.join(DIST, 'content.js'))) { console.error('dist/content.js missing — run npm run build:reader'); process.exit(1); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.gz': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/fixture.html') { res.writeHead(200, { 'Content-Type': TYPES['.html'] }); res.end(FIXTURE); return; }
  const file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  const data = fs.readFileSync(file);
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': data.length });
  res.end(data);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

// chrome.* stub: storage.local.prefs + runtime.sendMessage routed to an in-page worker
const STUB = `
(() => {
  let prefs = { enabled: true, level: 'words', romaji: false, appUrl: 'https://khevin.com/nihongo/app.html', mutedHosts: [] };
  const changedListeners = [];
  let worker = null, seq = 0; const pending = new Map();
  const ask = (type, payload) => new Promise((resolve, reject) => {
    if (!worker) { worker = new Worker('/analysis-worker.js', { type: 'module' }); worker.onmessage = (ev) => { const { requestId, type, payload } = ev.data; const p = pending.get(requestId); if (!p) return; pending.delete(requestId); type === 'WORKER_ERROR' ? p.reject(new Error(payload.message)) : p.resolve(payload); }; }
    const requestId = 'w' + (++seq); pending.set(requestId, { resolve, reject }); worker.postMessage({ protocolVersion: 1, requestId, type, payload });
  });
  window.__stubLog = [];
  // Listen: record which path spoke. The offscreen document is not reachable
  // from a page test, so the stub stands in for the service worker's answer.
  window.__spoke = [];
  window.__cloudVoice = true;
  const realSpeak = window.speechSynthesis && window.speechSynthesis.speak;
  if (window.speechSynthesis) window.speechSynthesis.speak = function (u) { window.__spoke.push({ where: 'web', text: u.text }); };
  window.chrome = {
    runtime: {
      id: 'stub',
      onMessage: { addListener() {} },
      async sendMessage(msg) {
        window.__stubLog.push(msg.type);
        if (msg.type === 'STUDY_REQUEST') return { ok: true, analysis: await ask('ANALYZE', { text: msg.payload.sentences[0].text }) };
        if (msg.type === 'ANALYZE_SENTENCE') return { ok: true, analysis: await ask('ANALYZE', { text: msg.payload.text }) };
        if (msg.type === 'SENTENCE_SHOWN') return { ok: true, added: 4 };
        if (msg.type === 'OPEN_DETAILS') return { ok: true, opened: true };
        if (msg.type === 'SPEAK') { window.__spoke.push({ where: 'cloud', text: msg.payload.text }); return { ok: true, played: window.__cloudVoice !== false, voice: 'ja-JP-Neural2-C' }; }
        if (msg.type === 'STOP_SPEAK') { window.__spoke.push({ where: 'stop' }); return { ok: true, stopped: true }; }
        return { ok: false, error: 'unknown ' + msg.type };
      },
    },
    storage: { local: { get: async () => ({ prefs }), set: async (o) => { prefs = o.prefs; changedListeners.forEach(fn => fn({ prefs: { newValue: prefs } }, 'local')); } }, onChanged: { addListener(fn) { changedListeners.push(fn); } } },
  };
  window.__setPrefs = (p) => window.chrome.storage.local.set({ prefs: { ...prefs, ...p } });
})();`;

const results = [];
const check = (name, pass, detail = '') => { results.push([name, pass]); console.log(`  ${pass ? '✔' : '✖'} ${name}${detail ? ' — ' + detail : ''}`); };
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(STUB);
  await page.goto(`${origin}/fixture.html`);
  const layoutBefore = await page.evaluate(() => JSON.stringify([...document.querySelectorAll('p')].map(p => p.getBoundingClientRect().toJSON())));
  await page.addScriptTag({ url: '/content.js' });
  await page.waitForFunction(() => window.__nihongoReaderBar);

  // select the sentence in #b1 and fire the events the watcher listens to
  const rect = await page.evaluate(() => {
    const p = document.getElementById('b1');
    const r = document.createRange(); r.selectNodeContents(p);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return r.getClientRects()[0].toJSON();
  });
  await page.waitForFunction(() => { const r = window.__nihongoReaderBar.root; const f = r && r.querySelector('.nr-fab'); return f && !f.hidden; }, null, { timeout: 5000 });
  const fab = await page.evaluate(() => { const f = window.__nihongoReaderBar.root.querySelector('.nr-fab'); return { left: parseFloat(f.style.left), top: parseFloat(f.style.top), side: f.dataset.side, placement: f.dataset.placement, text: f.textContent }; });
  check('FAB appears for a Japanese selection, above it, aligned to the start (left half of the screen)', fab.placement === 'above' && fab.side === 'left' && Math.abs(fab.left - rect.left) < 2 && fab.top < rect.top && fab.text === '札', JSON.stringify(fab));

  // a Latin selection gets no FAB
  await page.evaluate(() => { const p = document.getElementById('form-line'); const r = document.createRange(); r.setStart(p.firstChild, 0); r.setEnd(p.firstChild, 1); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForTimeout(250);
  const fabHiddenForShort = await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-fab').hidden);
  check('a single-kanji selection (名) does not show the FAB', fabHiddenForShort === true);

  // reselect and click the FAB → bar
  await page.evaluate(() => { const p = document.getElementById('b1'); const r = document.createRange(); r.selectNodeContents(p); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForFunction(() => !window.__nihongoReaderBar.root.querySelector('.nr-fab').hidden);
  await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-fab').click());
  await page.waitForFunction(() => window.__nihongoReaderBar.root.querySelectorAll('.nr-bar .ss-blk').length > 0, null, { timeout: 60000 });
  const blocks = await page.evaluate(() => [...window.__nihongoReaderBar.root.querySelectorAll('.nr-bar .ss-blk')].map(b => ({ t: b.textContent.replace(/\s+/g, ''), c: b.className })));
  check('bar renders the sentence as 7 blocks with lesson kinds', blocks.length === 7 && blocks[0].c.includes('ss-noun') && blocks[1].c.includes('ss-h-no') && blocks[4].c.includes('ss-verb') && blocks[6].c.includes('ss-stop'), blocks.map(b => b.t).join(' | '));
  const barBox = await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-bar').getBoundingClientRect().toJSON());
  check('bar floats at the bottom, centred, ≤ 960px wide, ≤ 2 block lines tall', barBox.bottom > 700 && barBox.width <= 960 && Math.abs((barBox.left + barBox.right) / 2 - 550) < 12 && barBox.height < 150, `${Math.round(barBox.width)}×${Math.round(barBox.height)} at y=${Math.round(barBox.top)}`);
  await page.waitForFunction(() => (window.__stubLog || []).includes('SENTENCE_SHOWN'));
  await page.waitForTimeout(150);
  const status = await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-status')?.textContent || '');
  check('bar shows no save chatter after a successful commit', status === '', JSON.stringify(status));
  const log = await page.evaluate(() => window.__stubLog.slice());
  check('the shown sentence is committed once (STUDY_REQUEST then SENTENCE_SHOWN)', log.filter(t => t === 'SENTENCE_SHOWN').length === 1 && log[0] === 'STUDY_REQUEST', log.join(' → '));

  // block click → OPEN_DETAILS + selected ring
  await page.evaluate(() => [...window.__nihongoReaderBar.root.querySelectorAll('.nr-bar .ss-blk')].find(b => b.textContent.includes('森')).click());
  await page.waitForFunction(() => window.__stubLog.includes('OPEN_DETAILS'));
  const sel = await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-bar .ss-blk.ss-selected')?.textContent.trim());
  check('tapping 森 asks for details and marks the block', sel === '森', sel);

  // Listen routes to the learner's Google Cloud voice, and falls back on its own
  await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-bar [data-act="listen"]').click());
  await page.waitForFunction(() => window.__spoke.some(s => s.where === 'cloud'));
  const cloudOnly = await page.evaluate(() => JSON.stringify(window.__spoke.filter(s => s.where !== 'stop')));
  check('Listen asks the service worker for the Google Cloud voice and does not double-speak in the browser', /"where":"cloud"/.test(cloudOnly) && !/"where":"web"/.test(cloudOnly), cloudOnly);

  await page.waitForTimeout(750);   // the same phrase inside 700 ms is a double-click, not a replay
  await page.evaluate(() => { window.__spoke = []; window.__cloudVoice = false; });
  await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-bar [data-act="listen"]').click());
  await page.waitForFunction(() => window.__spoke.some(s => s.where === 'web'), null, { timeout: 3000 });
  const fell = await page.evaluate(() => window.__spoke.map(s => s.where).join(','));
  check('no cloud voice configured → the bar speaks with the browser voice instead', /cloud/.test(fell) && /web/.test(fell), fell);

  // phrases view
  await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-bar [data-level="phrases"]').click());
  const phr = await page.evaluate(() => [...window.__nihongoReaderBar.root.querySelectorAll('.nr-bar .ss-blk')].map(b => b.textContent.replace(/\s+/g, '')));
  check('Phrases view groups コキリの森 into one block', phr[0] === 'コキリの森' || phr.some(t => t.startsWith('コキリの森')), phr.join(' | '));

  // multi-sentence: with the bar open, releasing a new selection (reading mode) loads the profile paragraph; no FAB is shown
  await page.evaluate(() => { const p = document.getElementById('profile'); const r = document.createRange(); r.selectNodeContents(p); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange')); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); });
  await page.waitForFunction(() => window.__nihongoReaderBar.state.sentences.length === 2 && window.__nihongoReaderBar.state.analyses.size >= 1, null, { timeout: 60000 });
  check('while the bar is open the FAB stays hidden and the released selection loads directly', await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-fab').hidden));
  await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-bar [data-act="next"]').click());
  await page.waitForFunction(() => window.__nihongoReaderBar.state.active === 1 && window.__nihongoReaderBar.state.analyses.has(1), null, { timeout: 60000 });
  const counter = await page.evaluate(() => window.__nihongoReaderBar.root.querySelector('.nr-head span:not([class])')?.textContent);
  check('a paragraph with <br> breaks becomes a 2-sentence queue and › analyses the next one (no fragment tag)', (counter || '').trim() === '2 / 2', counter);
  await page.evaluate(() => { const cb = window.__nihongoReaderBar.root.querySelector('.nr-bar [data-act="furigana"]'); cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); });
  const rts = await page.evaluate(() => [...window.__nihongoReaderBar.root.querySelectorAll('.nr-bar ruby')].map(r => r.textContent.replace(/\s+/g, '')));
  check('furigana toggle adds readings over kanji words and keeps the publisher ruby もくろ', rts.length >= 3 && rts.some(t => t === '目論もくろ'), rts.join(' | '));
  const heights = await page.evaluate(() => { const r = window.__nihongoReaderBar.root; const on = r.querySelector('.nr-bar .ss-blk.ss-noun').getBoundingClientRect().height; const cb = r.querySelector('.nr-bar [data-act="furigana"]'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); const off = r.querySelector('.nr-bar .ss-blk.ss-noun').getBoundingClientRect().height; cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); return { on, off }; });
  check('furigana does not make the blocks taller', Math.abs(heights.on - heights.off) < 1, `${heights.on}px with, ${heights.off}px without`);
  const rubyKept = await page.evaluate(() => { const s = window.__nihongoReaderBar.state.sentences[1]; return s.ruby.length === 1 && s.text.slice(s.ruby[0].start, s.ruby[0].end) === '目論' && s.ruby[0].reading === 'もくろ'; });
  check('ruby reading survives segmentation (目論 → もくろ span on the second sentence)', rubyKept);

  // reading mode: with the bar open, finishing a new selection replaces the bar's content without the FAB
  const logBefore = await page.evaluate(() => window.__stubLog.length);
  await page.evaluate(() => { const p = document.getElementById('b2'); const r = document.createRange(); r.selectNodeContents(p); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange')); document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); });
  await page.waitForFunction(() => window.__nihongoReaderBar.state.sentences.length === 1 && window.__nihongoReaderBar.state.sentences[0].text === 'ハイラル王国の姫君。' && window.__nihongoReaderBar.state.analyses.has(0), null, { timeout: 60000 });
  const swapped = await page.evaluate(() => ({ fabHidden: window.__nihongoReaderBar.root.querySelector('.nr-fab').hidden, blocks: [...window.__nihongoReaderBar.root.querySelectorAll('.nr-bar .ss-blk')].map(b => b.textContent.replace(/\s+/g, '')).join('|'), counter: window.__nihongoReaderBar.root.querySelector('.nr-head span:not([class])')?.textContent.trim() }));
  check('a new selection while the bar is open replaces the previous sentence (no FAB needed)', swapped.fabHidden && swapped.counter === '1 / 1' && swapped.blocks.startsWith('ハイラル'), swapped.blocks);
  await page.evaluate(() => { document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); });
  await page.waitForTimeout(300);
  const logAfter = await page.evaluate(() => window.__stubLog.slice(-8));
  const logLen = await page.evaluate(() => window.__stubLog.length);
  check('re-releasing the mouse on the same selection does not re-study or re-count it', logLen === logBefore + 2, `${logLen - logBefore} messages since the swap: ${logAfter.slice(-(logLen - logBefore)).join(' → ')}`);

  // Escape hides the bar
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__nihongoReaderBar.root.querySelector('.nr-bar').hidden);
  check('Escape closes the bar', true);

  // isolation and switch-off
  const layoutAfter = await page.evaluate(() => JSON.stringify([...document.querySelectorAll('p')].map(p => p.getBoundingClientRect().toJSON())));
  check('page layout is untouched (shadow DOM, fixed positioning)', layoutBefore === layoutAfter);
  await page.evaluate(() => window.__setPrefs({ enabled: false }));
  await page.evaluate(() => { const p = document.getElementById('b2'); const r = document.createRange(); r.selectNodeContents(p); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForTimeout(300);
  const off = await page.evaluate(() => !document.querySelector('nihongo-reader-root'));
  check('switching the extension off removes the UI and stops watching selections', off);
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter(r => !r[1]);
console.log(`\nbar e2e: ${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
