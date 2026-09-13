#!/usr/bin/env node
// Real app + real FSRS, in fresh browser contexts. No personal study data.
// STUDY_SCREENSHOTS=1 writes screenshots to a temporary directory.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.gif':'image/gif' };
const server = http.createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/nihongo/app.html#flashcards`;
const browser = await chromium.launch({ ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}), headless: true });
const errors = [];
let checks = 0;
const shotDir = process.env.STUDY_SCREENSHOTS ? await fs.mkdtemp(path.join(os.tmpdir(), 'nihongo-study-qa-')) : null;
function check(name, actual) { assert.ok(actual, name); checks++; console.log('PASS ' + name); }
async function open(options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, ...options });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-flash-study]').click();
  return page;
}
async function shot(page, name) {
  if (shotDir) await page.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: true });
}
async function state(page) {
  return page.evaluate(() => ({ idx: APP._review.idx, length: APP._review.queue.length,
    revealed: APP._review.revealed, reviewed: APP._review.reviewed,
    key: APP._review.queue[APP._review.idx], phase: APP._review.phase,
    saved: JSON.parse(localStorage.getItem('jp:srs') || '{"cards":{},"days":{}}') }));
}
async function complete(page, rating = 3) {
  for (let n = 0; n < 30 && await page.locator('.flash-review.is-question, .flash-review.is-answer').count(); n++) {
    if (await page.locator('[data-review-reveal]').count()) await page.locator('[data-review-reveal]').click();
    await page.locator(`[data-rate="${rating}"]`).click();
  }
  await page.locator('.flash-review.is-complete').waitFor();
}

try {
  const page = await open();
  await page.clock.install();
  check('Setup shows due cards and defaults to five new cards', (await page.locator('[data-review-learn]').innerText()) === 'Learn 5 new cards' && (await page.locator('#review-due-heading').innerText()).includes('0'));
  check('Opening study does not create review history', Object.keys((await state(page)).saved.cards).length === 0);
  await shot(page, '01-setup');
  await page.locator('[data-review-deck]').selectOption('colors');
  await page.locator('[data-review-limit]').selectOption('10');
  await page.locator('[data-review-learn]').click();
  check('Deck and round size are honored; reference-only cards stay out', await page.evaluate(() => APP._review.queue.length === 10 && APP._review.queue.every(key => key.startsWith('colors/') && !resolveSrsKey(key).card.vocabOnly)));
  check('Color swatches do not disclose the answer', await page.locator('.review-card-glyph').evaluate(el => !el.style.color));
  await page.locator('[data-review-pause]').click();
  await page.locator('[data-review-finish]').click();
  await page.locator('[data-review-deck]').selectOption('basic');
  await page.locator('[data-review-limit]').selectOption('5');
  await page.locator('[data-review-learn]').click();
  check('Question contains the kanji alone, without meaning or artwork', await page.locator('.review-card').innerText() === '日' && await page.locator('.review-card image-slot').count() === 0);
  check('Category rail steps aside during recall', await page.locator('#flash-sidebar').isHidden());
  await page.keyboard.press('3');
  check('Ratings cannot run before reveal', (await state(page)).reviewed === 0);
  await shot(page, '02-recall');
  await page.keyboard.press('Space');
  await page.locator('.review-card-image image-slot[data-filled]').waitFor();
  check('Reveal shows authored meaning, readings and mnemonic', (await page.locator('.review-card-meaning').innerText()).includes('sun') && (await page.locator('.review-card-readings').innerText()).includes('ひ'));
  check('All four ratings explain their meaning and next interval', await page.locator('.review-rate-description').count() === 4 && (await page.locator('[data-rate="1"]').innerText()).includes('1 minute'));
  await shot(page, '03-answer');
  await page.keyboard.press('Space');
  check('A second Space does not accidentally rate', (await state(page)).reviewed === 0);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', {key:'3', repeat:true, bubbles:true})));
  check('Held number keys cannot repeatedly rate', (await state(page)).reviewed === 0);
  await page.keyboard.press('1');
  let result = await state(page);
  check('Again saves once without appending an immediate repeat', result.idx === 1 && result.length === 5 && result.saved.cards['basic/sun'].reps === 1);
  check('Again schedules the next review in one minute', await page.evaluate(() => { const c = SRS.stateFor('basic/sun'); return c.due - c.last_review === 60000 && !SRS.isDue('basic/sun'); }));
  await page.locator('[data-review-undo]').click();
  result = await state(page);
  check('Undo restores the card and daily tally, including first-ever ratings', result.idx === 0 && result.revealed && Object.keys(result.saved.cards).length === 0 && Object.keys(result.saved.days).length === 0);
  await page.evaluate(() => { const b = document.querySelector('[data-rate="1"]'); b.click(); b.click(); });
  result = await state(page);
  check('A stale/double click cannot rate the next card', result.idx === 1 && result.reviewed === 1);
  await page.locator('[data-review-pause]').click();
  check('Pause preserves the round and restores category navigation', (await state(page)).idx === 1 && await page.locator('#flash-sidebar').isVisible());
  await page.locator('[data-review-exit]').click();
  await page.locator('[data-flash-study]').click();
  await page.locator('[data-review-resume]').click();
  check('Browsing and resuming returns to the same ungraded card', (await state(page)).key === 'basic/moon');
  await page.locator('[data-review-reveal]').click();
  await page.evaluate(() => {
    window.originalStudySetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'jp:srs') throw new DOMException('Storage full', 'QuotaExceededError');
      return window.originalStudySetItem.call(this, key, value);
    };
  });
  await page.locator('[data-rate="3"]').click();
  result = await state(page);
  check('Failed saves keep the answer visible and do not advance or add history', result.idx === 1 && result.revealed && !result.saved.cards['basic/moon'] && await page.locator('.review-error').isVisible());
  await page.evaluate(() => { Storage.prototype.setItem = window.originalStudySetItem; });
  await complete(page);
  result = await state(page);
  check('Finite round reports five unique reviews with accurate results', result.reviewed === 5 && Object.keys(result.saved.cards).length === 5 && (await page.locator('.review-results').innerText()).includes('4\nRemembered\n1\nTo revisit'));
  await shot(page, '04-complete');
  const saved = JSON.stringify(result.saved);
  await page.evaluate(() => { for (const key of [' ', '1', '3']) window.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles:true})); });
  check('Completion removes the old card keyboard handler', JSON.stringify((await state(page)).saved) === saved);
  await page.locator('[data-review-undo]').click();
  check('Undo remains available on the completion screen', (await state(page)).idx === 4 && (await state(page)).revealed);
  await page.locator('[data-rate="3"]').click();
  await page.locator('[data-review-deck]').focus();
  await page.clock.fastForward(61000);
  await page.locator('[data-review-start]').waitFor();
  check('The missed card becomes reviewable when due without refreshing the page', (await page.locator('[data-review-start]').innerText()) === 'Review 1 card');
  check('Due updates preserve the deck picker and focus', await page.locator('[data-review-deck]').evaluate(el => el === document.activeElement));
  await page.locator('[data-review-start]').click();
  check('Scheduled repeat uses the same saved card', (await state(page)).key === 'basic/sun' && (await state(page)).length === 1);
  await page.locator('[data-review-reveal]').click();
  const previous = (await state(page)).saved.cards['basic/sun'];
  await page.locator('[data-rate="3"]').click();
  await page.locator('[data-review-undo]').click();
  check('Undo restores an existing card’s exact scheduling state', JSON.stringify((await state(page)).saved.cards['basic/sun']) === JSON.stringify(previous));
  await page.locator('[data-rate="3"]').click();
  const persisted = (await state(page)).saved;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-flash-study]').click();
  check('Reload preserves scheduling and existing daily tallies', JSON.stringify((await state(page)).saved) === JSON.stringify(persisted));
  await page.close();

  const legacy = await open();
  await legacy.evaluate(() => {
    SRS.rate('basic/sun', 3, new Date(Date.now() - 2 * 86400000));
    SRS.rate('basic/moon', 3, new Date(Date.now() - 86400000));
    const raw = JSON.parse(localStorage.getItem('jp:srs'));
    raw.cards['removed/card'] = {...raw.cards['basic/sun']};
    localStorage.setItem('jp:srs', JSON.stringify(raw));
  });
  await legacy.reload({waitUntil:'domcontentloaded'});
  await legacy.locator('[data-flash-study]').click();
  check('Existing overdue history is respected; removed cards do not inflate counts', await legacy.evaluate(() => SRS.counts().due === 2 && SRS.counts().tracked === 2));
  await legacy.locator('[data-review-start]').click();
  check('Due cards retain their oldest-due-first order', (await state(legacy)).key === 'basic/sun');
  await legacy.locator('[data-review-reveal]').click();
  await legacy.locator('[data-rate="3"]').click();
  await legacy.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('jp:srs'));
    raw.cards['basic/sun'].reps++;
    localStorage.setItem('jp:srs', JSON.stringify(raw));
  });
  await legacy.locator('[data-review-undo]').click();
  check('Undo refuses to overwrite a later edit', (await state(legacy)).idx === 1 && (await legacy.locator('.review-error').innerText()).includes('another session'));
  await legacy.evaluate(() => setSection('writing'));
  const beforeKeys = JSON.stringify((await state(legacy)).saved);
  await legacy.keyboard.press('3');
  check('Leaving Study clears its keyboard bindings', JSON.stringify((await state(legacy)).saved) === beforeKeys);
  await legacy.close();

  for (const width of [390, 768]) {
    const mobile = await open({viewport:{width,height:844}});
    await shot(mobile, `05-setup-${width}`);
    await mobile.locator('[data-review-learn]').click();
    await mobile.locator('[data-review-reveal]').click();
    await mobile.locator('.review-card-image image-slot[data-filled]').waitFor();
    await shot(mobile, `06-answer-${width}`);
    check(`${width}px layout has no horizontal overflow`, await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`${width}px ratings are comfortable touch targets`, await mobile.locator('[data-rate]').evaluateAll(buttons => buttons.every(b => b.getBoundingClientRect().height >= 44 && b.getBoundingClientRect().width >= 44)));
    await mobile.evaluate(() => document.documentElement.style.fontSize = '200%');
    check(`${width}px enlarged text keeps the study surface inside the viewport`, await mobile.locator('.flash-review').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    await shot(mobile, `07-large-text-${width}`);
    await mobile.close();
  }
  check('No uncaught browser errors across study flows', errors.length === 0);
  console.log(`\n${checks} study checks passed.${shotDir ? '\nScreenshots: ' + shotDir : ''}`);
} finally {
  await browser.close();
  server.close();
}
