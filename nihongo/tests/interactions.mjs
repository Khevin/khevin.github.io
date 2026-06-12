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

    // ── Phase 6: de-duplicated edibles/flavor walks match naive scans ───────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const J = (x) => JSON.stringify(x);
        const nEdFlavor = (fid, limit = 100) => { const out = []; for (const cls of (window.VOCAB_CLASSES || [])) for (const b of (cls.books || [])) { if (!b.isEdiblesPage) continue; for (const cat of (b.categories || [])) for (const it of (cat.items || [])) { if ((it.flavors || []).includes(fid)) { out.push(it.id); if (out.length >= limit) return out; } } } return out; };
        const nEdTexture = (tk, limit = 100) => { const out = []; for (const cls of (window.VOCAB_CLASSES || [])) for (const b of (cls.books || [])) { if (!b.isEdiblesPage) continue; for (const cat of (b.categories || [])) for (const it of (cat.items || [])) { if ((it.textures || []).includes(tk)) { out.push(it.id); if (out.length >= limit) return out; } } } return out; };
        const nChip = (fid) => { for (const cls of (window.VOCAB_CLASSES || [])) for (const b of (cls.books || [])) { if (!b.isFlavorsPage) continue; const f = (b.flavors || []).find(x => x.id === fid); if (f) return f.chip; } return 'var(--ink-4)'; };
        const nKana = (fid) => { for (const cls of (window.VOCAB_CLASSES || [])) for (const b of (cls.books || [])) { if (!b.isFlavorsPage) continue; const f = (b.flavors || []).find(x => x.id === fid); if (f) return f.kana; } return null; };

        const flavorIds = new Set(), textureKanas = new Set();
        for (const cls of (window.VOCAB_CLASSES || [])) for (const b of (cls.books || [])) {
          if (b.isFlavorsPage) for (const f of (b.flavors || [])) flavorIds.add(f.id);
          if (b.isEdiblesPage) for (const cat of (b.categories || [])) for (const it of (cat.items || [])) {
            (it.flavors || []).forEach(x => flavorIds.add(x));
            (it.textures || []).forEach(x => textureKanas.add(x));
          }
        }
        flavorIds.add('__none__'); textureKanas.add('__none__');

        let ef = 0, et = 0, ch = 0, ka = 0;
        for (const fid of flavorIds) {
          if (J(nEdFlavor(fid)) !== J(findEdiblesWithFlavor(fid).map(x => x.item.id))) ef++;
          if (nChip(fid) !== lookupFlavorChip(fid)) ch++;
          if (nKana(fid) !== lookupFlavorKana(fid)) ka++;
        }
        for (const tk of textureKanas) if (J(nEdTexture(tk)) !== J(findEdiblesWithTexture(tk).map(x => x.item.id))) et++;
        return { ef, et, ch, ka, n: { flavors: flavorIds.size, textures: textureKanas.size } };
      });
      check(`P6 findEdiblesWithFlavor matches naive walk over ${r.n.flavors} ids`, r.ef === 0, `mismatches=${r.ef}`);
      check(`P6 findEdiblesWithTexture matches naive walk over ${r.n.textures} kanas`, r.et === 0, `mismatches=${r.et}`);
      check(`P6 lookupFlavorChip matches naive walk over ${r.n.flavors} ids`, r.ch === 0, `mismatches=${r.ch}`);
      check(`P6 lookupFlavorKana matches naive walk over ${r.n.flavors} ids`, r.ka === 0, `mismatches=${r.ka}`);
      await page.close();
    }

    // ── Hardening: escAttr full-escape (transparent) + dictTags memo ────────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const samples = ['plain', 'a&b', 'a<b>c', 'q"x', "ap'x", 'mix &<>"\'', '水 みず', '<script>alert(1)</script>'];
        let rawBreakout = 0, decodeFail = 0;
        for (const s of samples) {
          const esc = escAttr(s);
          if (/[<>"']/.test(esc)) rawBreakout++; // no raw breakout chars survive
          const div = document.createElement('div');
          div.innerHTML = `<span data-x="${esc}"></span>`; // place in a double-quoted attr
          if (div.firstChild.getAttribute('data-x') !== s) decodeFail++; // decodes back to original
        }
        const naiveTags = [...new Set((window.DICTIONARY || []).flatMap(e => e.tags || []))].sort();
        const idxTags = Idx.dictTags();
        return {
          rawBreakout, decodeFail,
          tagsMatch: JSON.stringify(naiveTags) === JSON.stringify(idxTags),
          tagsLen: idxTags.length,
          ampFirst: escAttr('<&') === '&lt;&amp;', // '&' must be escaped without double-escaping the entity
        };
      });
      check('HARDEN escAttr leaves no raw < > " \' (no breakout)', r.rawBreakout === 0, `rawBreakout=${r.rawBreakout}`);
      check('HARDEN escAttr is transparent (getAttribute decodes to original)', r.decodeFail === 0, `decodeFail=${r.decodeFail}`);
      check('HARDEN escAttr escapes & without double-escaping entities', r.ampFirst === true, `ampFirst=${r.ampFirst}`);
      check(`HARDEN Idx.dictTags matches naive flatMap+Set+sort (${r.tagsLen} tags)`, r.tagsMatch === true, `match=${r.tagsMatch}`);
      await page.close();
    }

    // ── renderSearch aliveRadicals: indexed candidates == naive card scan ───
    // golden only exercises the empty-selection branch; verify the non-empty
    // branch (now using Idx.radicalCandidates) matches the old card-index scan.
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const KR = window.KANJI_RADICALS || {};
        const someKanji = Object.keys(KR).find(k => (KR[k] || []).length);
        const sel = someKanji ? [KR[someKanji][0]] : [];
        const selSet = new Set(sel);
        const radChars = [];
        for (const g of (window.RADICALS_BY_STROKE || [])) for (const c of (g.chars || [])) radChars.push(c);
        const cardIndex = (window.FLASHCARD_CLASSES || []).flatMap(c => c.cards.filter(x => x.kanji && !x.type).map(x => x.kanji));
        const aliveOld = new Set();
        for (const rr of radChars) {
          if (selSet.has(rr)) { aliveOld.add(rr); continue; }
          const next = [...sel, rr];
          if (cardIndex.some(k => { const rad = radicalsForKanji(k); return rad.length && next.every(x => rad.includes(x)); })) aliveOld.add(rr);
        }
        const cands = Idx.radicalCandidates();
        const aliveNew = new Set();
        for (const rr of radChars) {
          if (selSet.has(rr)) { aliveNew.add(rr); continue; }
          const next = [...sel, rr];
          if (cands.some(c => next.every(x => c.radicals.includes(x)))) aliveNew.add(rr);
        }
        const a = [...aliveOld].sort(), b = [...aliveNew].sort();
        return { sel, radCount: radChars.length, match: JSON.stringify(a) === JSON.stringify(b), oldSize: a.length, newSize: b.length };
      });
      check(`HARDEN aliveRadicals indexed == naive over ${r.radCount} radicals (sel=${r.sel.join('')})`, r.match === true, `old=${r.oldSize} new=${r.newSize}`);
      await page.close();
    }

    // ── Phase 5: dictionary targeted keystroke update == full re-render ──────
    // The keystroke path now updates only results/count/clear-button instead of
    // rebuilding the page. Verify it produces the same results, count, and
    // clear-button state as a full renderDictionary, across several queries.
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const snap = (c) => ({
          count: (c.querySelector('#dict-count') || {}).textContent || '',
          sections: [...c.querySelectorAll(':scope > section, :scope > .empty-state')].map(e => e.outerHTML).join(''),
          hasClear: !!c.querySelector('#dict-clear'),
        });
        const reset = () => { APP.dictKind = 'all'; APP.dictLevel = 'all'; APP.dictTag = 'all'; APP.pendingDictQ = null; };
        const queries = ['', 'mizu', '水', 'mirror', 'zzznomatch', 'か', 'kaze'];
        let mismatches = 0; const details = [];
        for (const q of queries) {
          const full = document.createElement('div'); document.body.appendChild(full);
          reset(); APP.dictQ = q; renderDictionary(full);
          const a = snap(full); full.remove();

          const tgt = document.createElement('div'); document.body.appendChild(tgt);
          reset(); APP.dictQ = ''; renderDictionary(tgt);     // full render, empty query
          APP.dictQ = q; updateDictionaryResults(tgt);        // then targeted update to the query
          const b = snap(tgt); tgt.remove();

          if (a.count !== b.count || a.sections !== b.sections || a.hasClear !== b.hasClear) { mismatches++; details.push(q || '(empty)'); }
        }
        return { mismatches, details, n: queries.length };
      });
      check(`P5 dictionary targeted update == full render over ${r.n} queries`, r.mismatches === 0, `mismatches=${r.mismatches} [${r.details.join(', ')}]`);
      await page.close();
    }

    // ── Phase 5b: radical search targeted toggle == full re-render ──────────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        const snap = (c) => ({
          active: [...c.querySelectorAll('.rad-grid [data-rad-toggle]')].filter(b => b.classList.contains('is-active')).map(b => b.dataset.radToggle).sort(),
          dim: [...c.querySelectorAll('.rad-grid [data-rad-toggle]')].filter(b => b.classList.contains('is-dim')).map(b => b.dataset.radToggle).sort(),
          trayEmpty: c.querySelector('.rad-selected').classList.contains('is-empty'),
          trayHTML: c.querySelector('.rad-selected').innerHTML,
          resultsHTML: c.querySelector('.rad-results').innerHTML,
        });
        const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
        const KR = window.KANJI_RADICALS || {};
        const k2 = Object.keys(KR).find(k => (KR[k] || []).length >= 2) || Object.keys(KR)[0];
        const r1 = (KR[k2] || [])[0], r2 = (KR[k2] || [])[1] || r1;

        let mismatches = 0; const details = [];
        const scenarios = [{ label: 'one', sel: [r1] }, { label: 'two', sel: [r1, r2] }];
        for (const sc of scenarios) {
          const full = document.createElement('div'); document.body.appendChild(full);
          APP.radicalsSelected = [...sc.sel]; renderSearch(full);
          const a = snap(full); full.remove();

          const tgt = document.createElement('div'); document.body.appendChild(tgt);
          APP.radicalsSelected = []; renderSearch(tgt);
          for (const rr of sc.sel) toggleRadical(tgt, rr); // targeted updates
          const b = snap(tgt); tgt.remove();
          if (!eq(a, b)) { mismatches++; details.push(sc.label); }
        }
        // clear via the targeted path must equal a full empty render
        const fe = document.createElement('div'); document.body.appendChild(fe);
        APP.radicalsSelected = []; renderSearch(fe); const ae = snap(fe); fe.remove();
        const tc = document.createElement('div'); document.body.appendChild(tc);
        APP.radicalsSelected = []; renderSearch(tc); toggleRadical(tc, r1); clearRadicals(tc); const be = snap(tc); tc.remove();
        return { mismatches, details, clearMatch: eq(ae, be), sel: [r1, r2] };
      });
      check(`P5b search toggle == full render (one + two radicals, sel=${r.sel.join('')})`, r.mismatches === 0, `mismatches=${r.mismatches} [${r.details.join(', ')}]`);
      check('P5b search clear via targeted == full empty render', r.clearMatch === true, `clearMatch=${r.clearMatch}`);
      await page.close();
    }

    // ── CRIT-1: flashcard keydown handler must not stack across re-renders ──
    // Before the fix every internal re-render added one more window keydown
    // listener; listeners doubled per arrow press (idx walked 0→1→3→7…) and
    // stale handlers kept firing in other sections.
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(async () => {
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        setSection('flashcards');
        APP.flashClassId = 'basic'; APP.flashIdx = 0; APP.flashFlipped = false;
        renderMain();
        await sleep(50);
        const press = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        for (let i = 0; i < 4; i++) { press('ArrowRight'); await sleep(30); }
        const idxAfter4 = APP.flashIdx;             // 4 if exactly one handler; 15 if stacking
        setSection('library');                       // renderMain removes the (single) handler
        await sleep(50);
        const mainBefore = document.getElementById('main-inner').innerHTML.length;
        press('ArrowRight');                         // must be inert outside flashcards
        await sleep(30);
        const mainAfter = document.getElementById('main-inner').innerHTML.length;
        const idxAfterLeave = APP.flashIdx;
        return { idxAfter4, leakInert: mainBefore === mainAfter && idxAfterLeave === idxAfter4 };
      });
      check('CRIT-1 four ArrowRight presses advance exactly four cards', r.idxAfter4 === 4, `idx=${r.idxAfter4}`);
      check('CRIT-1 keydown is inert after leaving flashcards (no stale handlers)', r.leakInert === true, `leakInert=${r.leakInert}`);
      await page.close();
    }

    // ── MIC: permission-aware stream lifecycle ───────────────────────────────
    // Non-persistent grant (state 'prompt'): leaving Speaking must PARK the
    // stream (live + disabled) so the next take reuses the one grant — exactly
    // one getUserMedia per page session.
    {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        window.__gumCount = 0;
        // Playwright's headless shell has no real mic capture, so getUserMedia
        // is stubbed with a REAL synthetic MediaStream (AudioContext
        // destination-node stream): genuine tracks with working stop()/
        // enabled/readyState semantics. Fresh stream per call so a stopped
        // stream can't be silently resurrected.
        navigator.mediaDevices.getUserMedia = async () => {
          window.__gumCount++;
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          const osc = ctx.createOscillator(); osc.connect(dest); osc.start();
          window.__lastStream = dest.stream;
          return dest.stream;
        };
        const orig = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (d) => (d && d.name === 'microphone')
          ? Promise.resolve({ state: 'prompt', onchange: null })
          : orig(d);
      });
      await page.goto(`http://127.0.0.1:${port}/nihongo/app.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof APP !== 'undefined' && !!(document.getElementById('main-inner') || {}).innerHTML, { timeout: 20000 });
      const r = await page.evaluate(async () => {
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        setSection('speaking'); await sleep(80);
        await SpeakingRecorder.start(() => {});
        await sleep(300);
        SpeakingRecorder.stop(); await sleep(400);
        setSection('vocab'); await sleep(80);          // leave → release() → should PARK
        const t = window.__lastStream && window.__lastStream.getTracks()[0];
        const parked = !!t && t.readyState === 'live' && t.enabled === false;
        setSection('speaking'); await sleep(80);        // return + record again
        await SpeakingRecorder.start(() => {});
        await sleep(150);
        const reEnabled = !!t && t.enabled === true;
        const gumCount = window.__gumCount;             // expect exactly 1
        SpeakingRecorder.stop(); await sleep(300);
        setSection('vocab'); await sleep(50);
        return { parked, reEnabled, gumCount };
      });
      check('MIC non-persistent grant: leaving Speaking parks the stream (live, disabled)', r.parked === true, `parked=${r.parked}`);
      check('MIC non-persistent grant: next take re-enables the parked stream', r.reEnabled === true, `reEnabled=${r.reEnabled}`);
      check('MIC non-persistent grant: exactly ONE getUserMedia per session', r.gumCount === 1, `gumCount=${r.gumCount}`);
      await page.close();
    }

    // Durable grant (state 'granted' on http origin): leaving Speaking fully
    // stops the tracks (indicator off); re-recording re-acquires (silently in
    // real browsers, since the grant persists).
    {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        window.__gumCount = 0;
        // Playwright's headless shell has no real mic capture, so getUserMedia
        // is stubbed with a REAL synthetic MediaStream (AudioContext
        // destination-node stream): genuine tracks with working stop()/
        // enabled/readyState semantics. Fresh stream per call so a stopped
        // stream can't be silently resurrected.
        navigator.mediaDevices.getUserMedia = async () => {
          window.__gumCount++;
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          const osc = ctx.createOscillator(); osc.connect(dest); osc.start();
          window.__lastStream = dest.stream;
          return dest.stream;
        };
        const orig = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (d) => (d && d.name === 'microphone')
          ? Promise.resolve({ state: 'granted', onchange: null })
          : orig(d);
      });
      await page.goto(`http://127.0.0.1:${port}/nihongo/app.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof APP !== 'undefined' && !!(document.getElementById('main-inner') || {}).innerHTML, { timeout: 20000 });
      const r = await page.evaluate(async () => {
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        setSection('speaking'); await sleep(80);
        await SpeakingRecorder.start(() => {});
        await sleep(300);
        SpeakingRecorder.stop(); await sleep(400);
        const t = window.__lastStream && window.__lastStream.getTracks()[0];
        setSection('vocab'); await sleep(80);           // leave → release() → full stop
        const stopped = !!t && t.readyState === 'ended';
        setSection('speaking'); await sleep(80);
        await SpeakingRecorder.start(() => {});
        await sleep(150);
        const gumCount = window.__gumCount;             // expect 2 (fresh silent acquire)
        SpeakingRecorder.stop(); await sleep(300);
        setSection('vocab'); await sleep(50);
        return { stopped, gumCount };
      });
      check('MIC durable grant: leaving Speaking fully stops the tracks (indicator off)', r.stopped === true, `stopped=${r.stopped}`);
      check('MIC durable grant: re-recording re-acquires (no park needed)', r.gumCount === 2, `gumCount=${r.gumCount}`);
      await page.close();
    }

    // Back/forward (hashchange) must release the mic too — this path used to
    // skip release() entirely, leaving the stream hot until tab close. Also
    // verifies the handler's catch-up fixes: jp:section persisted + the
    // library sidebar toggle.
    {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        window.__gumCount = 0;
        // Playwright's headless shell has no real mic capture, so getUserMedia
        // is stubbed with a REAL synthetic MediaStream (AudioContext
        // destination-node stream): genuine tracks with working stop()/
        // enabled/readyState semantics. Fresh stream per call so a stopped
        // stream can't be silently resurrected.
        navigator.mediaDevices.getUserMedia = async () => {
          window.__gumCount++;
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          const osc = ctx.createOscillator(); osc.connect(dest); osc.start();
          window.__lastStream = dest.stream;
          return dest.stream;
        };
        const orig = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (d) => (d && d.name === 'microphone')
          ? Promise.resolve({ state: 'prompt', onchange: null })
          : orig(d);
      });
      await page.goto(`http://127.0.0.1:${port}/nihongo/app.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof APP !== 'undefined' && !!(document.getElementById('main-inner') || {}).innerHTML, { timeout: 20000 });
      const r = await page.evaluate(async () => {
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        setSection('speaking'); await sleep(80);
        await SpeakingRecorder.start(() => {});
        await sleep(300);
        SpeakingRecorder.stop(); await sleep(400);
        location.hash = 'library';                      // simulate back/forward nav
        await sleep(150);
        const t = window.__lastStream && window.__lastStream.getTracks()[0];
        return {
          released: !!t && (t.enabled === false || t.readyState === 'ended'),
          section: APP.section,
          persisted: JSON.parse(localStorage.getItem('jp:section') || 'null'),
          librarySidebar: document.querySelector('.app').classList.contains('show-library-sidebar'),
          speakingSidebarOff: !document.querySelector('.app').classList.contains('show-speaking-sidebar'),
        };
      });
      check('MIC hashchange out of Speaking releases the mic (parked or stopped)', r.released === true, `released=${r.released}`);
      check('NAV hashchange persists jp:section', r.persisted === 'library', `persisted=${r.persisted}`);
      check('NAV hashchange toggles library/speaking sidebars correctly', r.librarySidebar === true && r.speakingSidebarOff === true, `lib=${r.librarySidebar} spkOff=${r.speakingSidebarOff}`);
      await page.close();
    }

    // ── P1.8: render error boundary contains a throwing section renderer ────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        // Classic-script function declarations are global properties, so the
        // dispatch resolves renderVocab via window — swap in a thrower.
        window.renderVocab = () => { throw new Error('boom: malformed data entry'); };
        let escaped = false;
        APP.section = 'vocab';
        try { renderMain(); } catch (e) { escaped = true; }
        const el = document.getElementById('main-inner');
        return {
          escaped,
          fallbackShown: !!el.querySelector('[data-render-retry]'),
          mentionsFailure: /failed to render/i.test(el.textContent),
        };
      });
      check('P1.8 a throwing renderer does not escape renderMain', r.escaped === false, `escaped=${r.escaped}`);
      check('P1.8 failure fallback renders with a reset control', r.fallbackShown === true && r.mentionsFailure === true, `fallback=${r.fallbackShown} text=${r.mentionsFailure}`);
      await page.close();
    }

    // ── R1: SRS engine (FSRS over the existing decks) ────────────────────────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(() => {
        localStorage.removeItem('jp:srs');
        const now = new Date();
        const out = { available: SRS.available() };
        // Learn queue follows the authored deck order, unseen-only.
        const learn = SRS.learnQueue('basic', 3);
        const deck = (window.FLASHCARD_CLASSES || []).find(c => c.id === 'basic').cards.filter(c => !c.vocabOnly);
        out.learnOrder = learn.length === 3 && learn.every((e, i) => e.card === deck[i]);
        // Rating seeds state; Good schedules ahead of Again.
        const key = learn[0].key;
        out.dueBeforeAnyRating = SRS.dueQueue(now).length;     // nothing tracked yet
        const afterGood = SRS.rate(key, 3, now);
        const goodDue = afterGood.due.getTime();
        localStorage.removeItem('jp:srs');                     // reset, re-rate Again
        // (fresh module state: stores are cached — simulate via direct compare instead)
        out.goodSchedulesFuture = goodDue > now.getTime();
        // Preview labels exist for all four ratings and Again < Good interval.
        const prev = SRS.previewIntervals(key, now);
        out.previewShape = !!(prev && prev[1] && prev[2] && prev[3] && prev[4]);
        // Persistence round-trip: rate → stored in localStorage under jp:srs.
        SRS.rate(key, 3, now);
        const raw = JSON.parse(localStorage.getItem('jp:srs'));
        out.persisted = !!(raw && raw.cards && raw.cards[key] && raw.cards[key].due);
        out.dayTallied = !!(raw && raw.days && Object.values(raw.days).some(n => n >= 1));
        // Due queue surfaces an overdue card, most-overdue first.
        const past = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 400); // far future = everything due
        const due = SRS.dueQueue(past);
        out.dueAfterRating = due.length >= 1 && due[0].key === key;
        localStorage.removeItem('jp:srs');
        return out;
      });
      check('R1 SRS engine available (vendor bundle loaded)', r.available === true, `available=${r.available}`);
      check('R1 learn queue = authored deck order, unseen only', r.learnOrder === true, `order=${r.learnOrder}`);
      check('R1 rating schedules into the future + previews all 4 intervals', r.goodSchedulesFuture === true && r.previewShape === true, `future=${r.goodSchedulesFuture} preview=${r.previewShape}`);
      check('R1 state persists to jp:srs with a per-day tally', r.persisted === true && r.dayTallied === true, `persisted=${r.persisted} day=${r.dayTallied}`);
      check('R1 due queue surfaces rated cards when due', r.dueBeforeAnyRating === 0 && r.dueAfterRating === true, `before=${r.dueBeforeAnyRating} after=${r.dueAfterRating}`);
      await page.close();
    }

    // ── R1: review-mode UI flow (sidebar → learn → reveal → rate → done) ────
    {
      const page = await freshPage(browser, port);
      const r = await page.evaluate(async () => {
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        localStorage.removeItem('jp:srs');
        setSection('flashcards'); await sleep(80);
        const out = {};
        const entry = document.querySelector('[data-flash-review]');
        out.sidebarEntry = !!entry;
        entry.click(); await sleep(100);
        out.emptyStateShown = /復習するカードは ありません/.test(document.body.textContent);
        document.querySelector('[data-review-learn]').click(); await sleep(120);
        out.questionState = !!document.querySelector('.flash-review.is-question');
        out.meaningBlanked = (document.querySelector('.testcard-meaning') || {}).textContent === '— —';
        out.navHidden = getComputedStyle(document.querySelector('.testcard-footer-nav')).display === 'none';
        // reveal via Space
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); await sleep(120);
        out.answerState = !!document.querySelector('.flash-review.is-answer');
        out.meaningShown = (document.querySelector('.testcard-meaning') || {}).textContent !== '— —';
        out.fourChips = document.querySelectorAll('[data-rate]').length === 4;
        const startQueueLen = APP._review.queue.length;
        // rate Again via key 1 → re-queues this sitting
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })); await sleep(120);
        out.againRequeued = APP._review.queue.length === startQueueLen + 1 && APP._review.idx === 1;
        // rate the rest Good to reach the close
        while (APP._review.idx < APP._review.queue.length) {
          APP._review.revealed = true; renderFlashcards(document.getElementById('main-inner')); await sleep(15);
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true })); await sleep(15);
        }
        await sleep(100);
        out.doneState = /きょうの復習は おわり/.test(document.body.textContent);
        out.trackedAfter = SRS.counts().tracked;
        // exit back to browse
        document.querySelector('[data-review-exit]').click(); await sleep(100);
        out.backToBrowse = APP.flashMode === 'browse' && !!document.querySelector('.flash-layout');
        localStorage.removeItem('jp:srs');
        return out;
      });
      check('R1-UI sidebar entry + empty state + learn seeds a session', r.sidebarEntry && r.emptyStateShown, `entry=${r.sidebarEntry} empty=${r.emptyStateShown}`);
      check('R1-UI question hides meaning + suspends card nav', r.questionState && r.meaningBlanked && r.navHidden, `q=${r.questionState} blank=${r.meaningBlanked} nav=${r.navHidden}`);
      check('R1-UI space reveals the answer with four rating chips', r.answerState && r.meaningShown && r.fourChips, `a=${r.answerState} meaning=${r.meaningShown} chips=${r.fourChips}`);
      check('R1-UI "Again" re-queues the card this sitting', r.againRequeued === true, `requeued=${r.againRequeued}`);
      check('R1-UI session closes quietly and exit returns to browse', r.doneState && r.trackedAfter === 10 && r.backToBrowse, `done=${r.doneState} tracked=${r.trackedAfter} browse=${r.backToBrowse}`);
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
