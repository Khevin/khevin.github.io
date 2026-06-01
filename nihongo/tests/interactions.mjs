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

    // ── BUG-2: animation lock self-heals (no permanent navigation freeze) ────
    // The flavors/edibles transition guards are literally `if (animLocked(flag))
    // return;`. animLocked treats a fresh lock as blocking (debounce preserved)
    // and a stale lock (older than the longest animation) as released, so a
    // stranded flag can never permanently freeze navigation.
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const LOCK = (typeof ANIM_LOCK_MS !== 'undefined') ? ANIM_LOCK_MS : 3000;
        return {
          isFn: typeof animLocked === 'function',
          freshBlocks: animLocked(Date.now()),                 // mid-animation → blocked
          staleReleases: animLocked(Date.now() - (LOCK + 1000)),// stranded flag → released
          falseUnlocked: animLocked(false),                    // cleared → unlocked
          zeroUnlocked: animLocked(0),                         // never set → unlocked
          nullUnlocked: animLocked(null),
          lockMs: LOCK,
        };
      });
      check('BUG-2 animLocked is defined', r.isFn === true, `typeof=${r.isFn}`);
      check('BUG-2 fresh lock blocks (debounce preserved)', r.freshBlocks === true, `fresh=${r.freshBlocks}`);
      check('BUG-2 stale lock releases (no permanent freeze)', r.staleReleases === false, `stale=${r.staleReleases}`);
      check('BUG-2 cleared flag (false) is unlocked', r.falseUnlocked === false, `false=${r.falseUnlocked}`);
      check('BUG-2 unset flag (0/null) is unlocked', r.zeroUnlocked === false && r.nullUnlocked === false, `0=${r.zeroUnlocked} null=${r.nullUnlocked}`);
      check('BUG-2 lock window exceeds longest animation (~2.2s)', r.lockMs > 2200, `lockMs=${r.lockMs}`);
      await page.close();
    }

    // ── BUG-3 + BUG-4: scene-engine state robustness ────────────────────────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const out = {};
        // BUG-3: gotoStep with an unknown id must advance sequentially, not no-op.
        const scene = { id: 'test', steps: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
        const s1 = { stepIdx: 0, history: [] };
        gotoStep(scene, s1, 'does-not-exist');
        out.unknownAdvances = s1.stepIdx;          // expect 1
        const s2 = { stepIdx: 0, history: [] };
        gotoStep(scene, s2, 'c');
        out.knownJumps = s2.stepIdx;               // expect 2 (normal jump preserved)
        const s3 = { stepIdx: 2, history: [] };
        gotoStep(scene, s3, 'nope');
        out.clampAtEnd = s3.stepIdx;               // expect 2 (clamped, no overshoot)

        // BUG-4: a legacy/partial persisted scene state must be backfilled on load.
        APP.scenes = { legacy: { stepIdx: 2, selected: [] } }; // missing npcVariants/history/choices/sizes
        const st = sceneStateFor('legacy');
        out.npcVariantsObj = st.npcVariants && typeof st.npcVariants === 'object';
        out.historyArr = Array.isArray(st.history);
        out.choicesObj = st.choices && typeof st.choices === 'object';
        out.preservedStepIdx = st.stepIdx;         // expect 2 (existing value wins)
        let threw = false;
        try { sceneVariant(st, 'greet', [{ x: 1 }, { x: 2 }]); } catch (e) { threw = true; }
        out.sceneVariantSafe = !threw;             // must not throw on backfilled state
        return out;
      });
      check('BUG-3 unknown step id advances sequentially (no dead-end)', r.unknownAdvances === 1, `stepIdx=${r.unknownAdvances}`);
      check('BUG-3 known step id still jumps normally', r.knownJumps === 2, `stepIdx=${r.knownJumps}`);
      check('BUG-3 fallback clamps at last step', r.clampAtEnd === 2, `stepIdx=${r.clampAtEnd}`);
      check('BUG-4 legacy state backfills npcVariants', r.npcVariantsObj === true, `npcVariants=${r.npcVariantsObj}`);
      check('BUG-4 legacy state backfills history array', r.historyArr === true, `history=${r.historyArr}`);
      check('BUG-4 legacy state backfills choices', r.choicesObj === true, `choices=${r.choicesObj}`);
      check('BUG-4 existing field value preserved (stepIdx=2)', r.preservedStepIdx === 2, `stepIdx=${r.preservedStepIdx}`);
      check('BUG-4 sceneVariant no longer throws on legacy state', r.sceneVariantSafe === true, `safe=${r.sceneVariantSafe}`);
      await page.close();
    }

    // ── BUG-5: leaving Speaking closes the reused playback AudioContext ──────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        APP.section = 'speaking';
        let closed = false, stopped = false;
        APP._speakingPlayCtx = { state: 'running', close() { closed = true; } };
        APP._speakingPlaySrc = { stop() { stopped = true; } };
        setSection('flashcards'); // leaving Speaking must release the playback ctx
        return { closed, stopped, ctxNulled: APP._speakingPlayCtx === null, srcNulled: APP._speakingPlaySrc === null };
      });
      check('BUG-5 leaving Speaking closes the playback AudioContext', r.closed === true, `closed=${r.closed}`);
      check('BUG-5 leaving Speaking stops the active source', r.stopped === true, `stopped=${r.stopped}`);
      check('BUG-5 playback ctx + src refs cleared', r.ctxNulled === true && r.srcNulled === true, `ctxNulled=${r.ctxNulled} srcNulled=${r.srcNulled}`);
      await page.close();
    }

    // ── BUG-6: shop-picker does not orphan document listeners on re-render ───
    // Open the picker (adds 2 document listeners), then re-wire on fresh DOM
    // (simulating a scene re-render). The previous instance's listeners must be
    // torn down, returning the document-listener count to baseline.
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        let active = 0;
        const realAdd = document.addEventListener.bind(document);
        const realRemove = document.removeEventListener.bind(document);
        const counted = (t) => t === 'click' || t === 'keydown';
        document.addEventListener = (t, fn, o) => { if (counted(t)) active++; return realAdd(t, fn, o); };
        document.removeEventListener = (t, fn, o) => { if (counted(t)) active--; return realRemove(t, fn, o); };
        const mk = () => {
          const el = document.createElement('div');
          el.className = 'exp-shop';
          el.innerHTML = '<button data-exp-shop-open aria-expanded="false">shop</button>' +
            '<div class="exp-shop-dropdown" hidden><button data-exp-shop="x">X</button></div>';
          document.body.appendChild(el);
          return el;
        };
        const baseline = active;
        const root1 = mk();
        wireExperienceShopPicker(root1);
        root1.querySelector('[data-exp-shop-open]').click(); // open → +2 doc listeners
        const afterOpen = active;
        const root2 = mk();
        wireExperienceShopPicker(root2);                     // re-render → tear down root1's listeners
        const afterReWire = active;
        // restore
        document.addEventListener = realAdd; document.removeEventListener = realRemove;
        return { baseline, afterOpen, afterReWire };
      });
      check('BUG-6 opening picker adds 2 document listeners', r.afterOpen === r.baseline + 2, `open=${r.afterOpen} base=${r.baseline}`);
      check('BUG-6 re-render tears down orphaned listeners (back to baseline)', r.afterReWire === r.baseline, `afterReWire=${r.afterReWire} base=${r.baseline}`);
      await page.close();
    }

    // ── Phase 4: memoized indexes return identical results to naive scans ────
    // Exhaustively compare the now-indexed production lookups against fresh
    // full-scan reference implementations (the pre-Phase-4 logic) across the
    // entire input domain. Any divergence — order, dedup, first-match — fails.
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const J = (x) => JSON.stringify(x);
        // Reference (naive) implementations — copies of the original scans.
        const nLookupWord = (text) => {
          if (!text) return null;
          for (const book of (window.VOCAB_BOOKS || [])) for (const page of (book.pages || [])) for (const item of (page.items || [])) {
            const k = item.kanji || item.ja;
            if (k === text || item.kana === text || item.ja === text) return { kanji: k || text, kana: item.kana || '', en: item.en || '' };
          }
          const d = (window.DICTIONARY || []).find(e => e.kanji === text || e.kana === text);
          if (d) return { kanji: d.kanji, kana: d.kana, en: d.en };
          const chars = [...text];
          if (chars.length === 1) { const c = chars[0], m = window.KANJI_MEANINGS || {}, rd = window.KANJI_READINGS || {}; if (m[c] || rd[c]) return { kanji: c, kana: rd[c] || '', en: m[c] || '' }; }
          return { kanji: text, kana: '', en: '' };
        };
        const nCard = (kanji) => { for (const cls of (window.FLASHCARD_CLASSES || [])) { const card = cls.cards.find(c => c.kanji === kanji); if (card) return Object.assign({}, card, { classId: cls.id }); } return null; };
        const nReading = (c) => { const rd = window.KANJI_READINGS || {}; if (rd[c]) return rd[c]; const de = (window.DICTIONARY || []).find(e => e.kind === 'kanji' && e.kanji === c); if (de && de.kana) return de.kana.split('.')[0].replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)); return ''; };
        const nRadicals = (sel) => { const out = [], seen = new Set(); for (const cls of (window.FLASHCARD_CLASSES || [])) for (const card of cls.cards) { if (card.type === 'radical') continue; if (!card.kanji || seen.has(card.kanji)) continue; const rad = radicalsForKanji(card.kanji); if (!rad.length) continue; const hit = sel.length === 0 || sel.every(x => rad.includes(x)); if (hit) { out.push({ ...card, classId: cls.id }); seen.add(card.kanji); } } return out; };
        const nSeeAlso = (card) => { if (!card) return []; const seen = new Set(), out = []; for (const k of (card.seeAlso || [])) { if (k === card.kanji || seen.has(k)) continue; const c = nCard(k); if (c) { out.push(c); seen.add(k); } } for (const cls of (window.FLASHCARD_CLASSES || [])) for (const c of cls.cards) { if (!c.seeAlso || !c.seeAlso.includes(card.kanji)) continue; if (c.kanji === card.kanji || seen.has(c.kanji)) continue; out.push(Object.assign({}, c, { classId: cls.id })); seen.add(c.kanji); } return out; };

        // Domains.
        const words = new Set();
        for (const b of (window.VOCAB_BOOKS || [])) for (const p of (b.pages || [])) for (const it of (p.items || [])) { [it.kanji, it.ja, it.kana].forEach(x => x && words.add(x)); }
        for (const e of (window.DICTIONARY || [])) { if (e.kanji) words.add(e.kanji); if (e.kana) words.add(e.kana); }
        Object.keys(window.KANJI_READINGS || {}).forEach(c => words.add(c));
        words.add('___nonexistent___');
        const allCards = (window.FLASHCARD_CLASSES || []).flatMap(c => c.cards);
        const kanjis = new Set(allCards.map(c => c.kanji).filter(Boolean)); kanjis.add('___none___');
        const readingChars = new Set([...Object.keys(window.KANJI_READINGS || {}), ...(window.DICTIONARY || []).filter(e => e.kind === 'kanji').map(e => e.kanji)]); readingChars.add('〇');
        const radSet = new Set(); Object.values(window.KANJI_RADICALS || {}).forEach(arr => (arr || []).forEach(x => radSet.add(x)));
        const someRads = [...radSet].slice(0, 5);
        const radSelections = [[], ...someRads.map(x => [x]), someRads.slice(0, 2)];

        let lw = 0, cd = 0, rd = 0, ra = 0, sa = 0;
        for (const t of words) if (J(nLookupWord(t)) !== J(lookupWord(t))) lw++;
        for (const k of kanjis) if (J(nCard(k)) !== J(lookupCardByKanji(k))) cd++;
        for (const c of readingChars) if (nReading(c) !== kanjiReading(c)) rd++;
        for (const sel of radSelections) if (J(nRadicals(sel)) !== J(kanjiMatchingRadicals(sel))) ra++;
        for (const card of allCards) if (J(nSeeAlso(card)) !== J(seeAlsoCards(card))) sa++;
        return { lw, cd, rd, ra, sa, n: { words: words.size, kanjis: kanjis.size, readingChars: readingChars.size, radSel: radSelections.length, cards: allCards.length } };
      });
      check(`P4 lookupWord matches naive scan over ${r.n.words} inputs`, r.lw === 0, `mismatches=${r.lw}`);
      check(`P4 lookupCardByKanji matches naive scan over ${r.n.kanjis} inputs`, r.cd === 0, `mismatches=${r.cd}`);
      check(`P4 kanjiReading matches naive scan over ${r.n.readingChars} inputs`, r.rd === 0, `mismatches=${r.rd}`);
      check(`P4 kanjiMatchingRadicals matches naive scan over ${r.n.radSel} selections`, r.ra === 0, `mismatches=${r.ra}`);
      check(`P4 seeAlsoCards matches naive scan over ${r.n.cards} cards`, r.sa === 0, `mismatches=${r.sa}`);
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
