/*
 * Characterization harness for the nihongo app (Phase 0 safety net).
 *
 * WHY THIS EXISTS
 * ---------------
 * The app has zero automated tests. The refactor plan needs to *prove* that
 * structural changes (extracting CSS/JS, centralizing persistence, swapping
 * innerHTML-blasts for targeted updates) do not change what the user sees.
 *
 * This harness captures a deterministic *content + structure fingerprint* of
 * every section/sub-page. We deliberately do NOT hash raw innerHTML, because
 * the app injects cosmetic randomness on every render (brush rotations/delays,
 * a random section background, random restaurant pick). Hashing innerHTML would
 * produce false-positive diffs on every run. Instead, for each state we record:
 *
 *   - text        : normalized textContent (all the JA/EN learning copy)
 *   - tagCounts   : { div: 40, button: 12, ... } structural signature
 *   - dataAttrs   : sorted inventory of data-* attribute *names* present
 *   - controls    : count of buttons / inputs / selects / [tabindex]
 *   - imgSrcs     : sorted, normalized <img> src list (content imagery, brush
 *                   decorations stripped)
 *   - len         : textContent length
 *
 * A refactor that preserves behavior leaves all of these identical. A real
 * regression (missing words, dropped control, changed structure) shows up as a
 * diff. Decorative randomness does not.
 *
 * HOW TO USE
 * ----------
 *  1. Serve the app (preview server / `py -m http.server 8766` from repo root).
 *  2. Open http://localhost:8766/nihongo/app.html
 *  3. In the console:  copy this file's contents, paste, then run:
 *        copy(JSON.stringify(window.__capture(), null, 2))
 *     and save the clipboard to tests/golden-baseline.json
 *  4. After a refactor, repeat step 3 into a new file and run:
 *        node tests/compare.mjs golden-baseline.json golden-after.json
 *
 * The capture function snapshots current APP/localStorage, walks a fixed list
 * of states, renders each, fingerprints it, then RESTORES the original state
 * so running it never corrupts the user's saved progress.
 */
(function () {
  'use strict';

  // ── Volatile-attribute / decoration scrubbing ───────────────────────────
  // Brush decorations and the cycling section background are pure cosmetics
  // driven by Math.random; they must not contribute to the fingerprint.
  function isDecorative(el) {
    const cl = el.classList;
    return cl.contains('active-brush') ||
           cl.contains('bg-brush') ||
           cl.contains('particle-brush') ||
           cl.contains('tier3-brush') ||
           el.hasAttribute('data-brush');
  }

  function normalizeText(s) {
    return String(s || '')
      .replace(/　/g, ' ')   // full-width space → space
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Decorative imagery is chosen at random on each render (hand-painted
  // brushstrokes, cycling section backgrounds) and must not enter the
  // fingerprint — only content imagery (food photos, kanji, logo) counts.
  function isDecorativeSrc(pathname) {
    return /\/images\/(brush|bg)\//.test(pathname);
  }

  function normalizeImgSrc(src) {
    if (!src) return '';
    // Strip the cache-buster query and the origin so the fingerprint is
    // portable across hosts/ports. Drop data: URIs (audio clips etc).
    if (src.startsWith('data:')) return 'data:<inline>';
    try {
      const u = new URL(src, location.href);
      return u.pathname.replace(/\?.*$/, '');
    } catch (e) {
      return src.replace(/\?.*$/, '');
    }
  }

  function fingerprint(root) {
    if (!root) return { missing: true };
    const clone = root.cloneNode(true);
    // Remove decorative nodes before measuring.
    clone.querySelectorAll('img,span,div,svg').forEach((el) => {
      if (isDecorative(el)) el.remove();
    });
    const tagCounts = {};
    const dataAttrs = new Set();
    const imgSrcs = [];
    let controls = 0;
    clone.querySelectorAll('*').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-')) dataAttrs.add(attr.name);
      }
      if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || el.hasAttribute('tabindex')) {
        controls++;
      }
      if (tag === 'img') {
        const s = normalizeImgSrc(el.getAttribute('src'));
        if (s && !isDecorativeSrc(s)) imgSrcs.push(s);
      }
    });
    const text = normalizeText(clone.textContent);
    return {
      len: text.length,
      text,
      tagCounts,
      dataAttrs: Array.from(dataAttrs).sort(),
      controls,
      imgSrcs: imgSrcs.sort(),
    };
  }

  // Capture #main-inner + every sidebar in one shot — sidebars carry the nav
  // structure that a render must preserve.
  function captureSurfaces() {
    const ids = [
      'main-inner', 'main-stepper', 'sidebar', 'vocab-sidebar',
      'vocab-books-sidebar', 'flash-sidebar', 'writing-sidebar',
      'particles-sidebar', 'speaking-sidebar', 'library-sidebar',
    ];
    const out = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      out[id] = el ? fingerprint(el) : { missing: true };
    });
    return out;
  }

  // ── State matrix ─────────────────────────────────────────────────────────
  // Each entry sets the minimum APP fields then calls renderMain(). Wrapped in
  // try/catch so a render error becomes a recorded finding instead of aborting
  // the whole capture.
  const STATES = [
    { key: 'vocab/default',            apply: () => { APP.section = 'vocab'; } },
    { key: 'vocab/flavors',            apply: () => { APP.section = 'vocab'; APP.vocabClassId = 'eating-out'; APP.vocabBookId = 'flavors'; APP.flavorId = null; } },
    { key: 'vocab/textures',           apply: () => { APP.section = 'vocab'; APP.vocabClassId = 'eating-out'; APP.vocabBookId = 'textures'; APP.textureId = null; } },
    { key: 'vocab/edibles',            apply: () => { APP.section = 'vocab'; APP.vocabClassId = 'eating-out'; APP.vocabBookId = 'edibles'; APP.edibleCategory = null; APP.edibleItem = null; } },
    { key: 'vocab/bathroom',           apply: () => { APP.section = 'vocab'; APP.vocabClassId = 'home'; APP.vocabBookId = 'bathroom'; APP.vocabPageIdx = 0; } },
    { key: 'writing/kana',             apply: () => { APP.section = 'writing'; APP.writingPage = 'kana'; } },
    { key: 'writing/numbers',          apply: () => { APP.section = 'writing'; APP.writingPage = 'numbers'; } },
    { key: 'writing/colors',           apply: () => { APP.section = 'writing'; APP.writingPage = 'colors'; } },
    { key: 'writing/datetime',         apply: () => { APP.section = 'writing'; APP.writingPage = 'datetime'; } },
    { key: 'writing/particles',        apply: () => { APP.section = 'writing'; APP.writingPage = 'particles'; } },
    { key: 'writing/sentence',         apply: () => { APP.section = 'writing'; APP.writingPage = 'sentence-structure'; } },
    { key: 'writing/pitch',            apply: () => { APP.section = 'writing'; APP.writingPage = 'pitch'; } },
    { key: 'flashcards/card',          apply: () => { APP.section = 'flashcards'; APP.flashClassId = 'basic'; APP.flashView = 'card'; APP.flashIdx = 0; APP.flashFlipped = false; } },
    { key: 'flashcards/list',          apply: () => { APP.section = 'flashcards'; APP.flashClassId = 'basic'; APP.flashView = 'list'; } },
    { key: 'speaking/studio',          apply: () => { APP.section = 'speaking'; } },
    { key: 'library/search',           apply: () => { APP.section = 'library'; APP.libraryPage = 'search'; APP.radicalsSelected = []; } },
    { key: 'library/dictionary',       apply: () => { APP.section = 'library'; APP.libraryPage = 'dictionary'; APP.dictQ = ''; APP.dictKind = 'all'; APP.dictLevel = 'all'; APP.dictTag = 'all'; } },
    { key: 'library/books',            apply: () => { APP.section = 'library'; APP.libraryPage = 'books'; } },
  ];

  function snapshotAppState() {
    return JSON.parse(JSON.stringify({
      section: APP.section, vocabClassId: APP.vocabClassId, vocabBookId: APP.vocabBookId,
      vocabPageIdx: APP.vocabPageIdx, flavorId: APP.flavorId, textureId: APP.textureId,
      edibleCategory: APP.edibleCategory, edibleItem: APP.edibleItem,
      flashClassId: APP.flashClassId, flashView: APP.flashView, flashIdx: APP.flashIdx,
      flashFlipped: APP.flashFlipped, writingPage: APP.writingPage, libraryPage: APP.libraryPage,
      dictQ: APP.dictQ, dictKind: APP.dictKind, dictLevel: APP.dictLevel, dictTag: APP.dictTag,
      radicalsSelected: APP.radicalsSelected,
    }));
  }

  function restoreAppState(saved) {
    Object.assign(APP, saved);
  }

  window.__capture = function () {
    const saved = snapshotAppState();
    // Freeze cosmetic randomness so even un-scrubbed corners are stable.
    const origRandom = Math.random;
    let seed = 0x2545f491;
    Math.random = function () {
      // xorshift32 — deterministic, good enough for decoration freezing.
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return ((seed >>> 0) % 1e6) / 1e6;
    };
    const result = { capturedAt: new Date().toISOString().slice(0, 10), states: {} };
    try {
      for (const st of STATES) {
        try {
          st.apply();
          if (typeof renderMain === 'function') renderMain();
          result.states[st.key] = { ok: true, surfaces: captureSurfaces() };
        } catch (err) {
          result.states[st.key] = { ok: false, error: String(err && err.stack || err) };
        }
      }
    } finally {
      Math.random = origRandom;
      restoreAppState(saved);
      if (typeof renderMain === 'function') renderMain();
    }
    return result;
  };

  return 'window.__capture installed — run window.__capture()';
})();
