# learn-jp Vanilla Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the learn-jp React/JSX/Babel app as a self-contained vanilla HTML/JS file that works on `file://` locally and deploys to GitHub Pages without a build step.

**Architecture:** Single `learn jp/app.html` file with all CSS inline, all JS inline in one `<script>` block, loading only `data.js` and a modified `image-slot.js` (localStorage persistence). State lives in a plain `APP` object; re-rendering is section-scoped, not whole-page. Hash-based navigation preserved.

**Tech Stack:** Vanilla HTML, CSS, ES2020 JS, `<image-slot>` custom element, `data.js` (unchanged), `localStorage` for preferences and image persistence.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `learn jp/app.html` | **Replace** | All CSS, all JS logic, HTML shell |
| `learn jp/data.js` | **Keep as-is** | All data (VOCAB_BOOKS, FLASHCARDS, DICTIONARY, JLPT_LEVELS, KANJI_MEANINGS) |
| `learn jp/image-slot.js` | **Modify** | Swap fetch/omelette persistence → localStorage |
| `learn jp/*.jsx` | Keep (unused) | Original source reference |

---

## Task 1: Modify image-slot.js for localStorage persistence

**Files:**
- Modify: `learn jp/image-slot.js` (lines 64–137 — the shared sidecar store)

The current store uses `fetch('.image-slots.state.json')` to load and `window.omelette.writeFile` to save. Replace both with `localStorage`.

- [ ] **Step 1: Replace the shared store block**

Find the block from `const subs = new Set();` through `if (loaded) save(); else load().then(save);` (roughly lines 65–137) and replace with:

```javascript
  const subs = new Set();
  let slots = {};

  function load() {
    try {
      const raw = localStorage.getItem('jp:image-slots');
      if (raw) slots = JSON.parse(raw);
    } catch {}
    subs.forEach(fn => fn());
  }

  function save() {
    try { localStorage.setItem('jp:image-slots', JSON.stringify(slots)); } catch {}
  }

  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? { u: v, s: 1, x: 0, y: 0 } : v;
  }

  function setSlot(id, val) {
    if (!id) return;
    if (val) slots[id] = val;
    else delete slots[id];
    save();
    subs.forEach(fn => fn());
  }
```

- [ ] **Step 2: Update connectedCallback to call load() synchronously**

Find `connectedCallback()` and replace the `load();` call (currently triggers a fetch promise) — it now resolves synchronously, so no change needed in the element itself. Just verify `load()` is still called in `connectedCallback`.

- [ ] **Step 3: Remove the `loaded` / `saveDirty` / `loadP` / `tombstones` variables**

They were needed only for the async fetch/write path. The new store is synchronous so they're dead code. Verify the `_render()` method still works — it calls `getSlot()` which now reads from the in-memory `slots` object populated by `load()`.

- [ ] **Step 4: Test locally**

Open `learn jp/app.html` in a browser via `file://`. Drop an image into a cheatsheet slot. Reload. Verify the image persists. Open DevTools → Application → Local Storage and confirm the `jp:image-slots` key exists.

---

## Task 2: Build the app.html shell and CSS

**Files:**
- Replace: `learn jp/app.html`

Create a new `app.html` from scratch. This task covers the document head, all CSS (copied verbatim from the current `app.html` `<style>` block), the HTML skeleton, and the script loading order.

- [ ] **Step 1: Write the document head**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>learn jp</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Caveat:wght@400;600&display=swap" rel="stylesheet">
<style>
  /* paste the full <style> block from the current app.html here — lines 10–796 */
</style>
</head>
```

- [ ] **Step 2: Write the HTML skeleton**

```html
<body>
<div class="app">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="main" id="main">
    <div class="main-inner" id="main-inner"></div>
  </main>
</div>

<!-- Word popover — single persistent element, shown/hidden by JS -->
<div id="word-pop-backdrop" class="word-pop-backdrop" style="display:none"></div>
<div id="word-pop" class="word-pop is-hidden"></div>

<!-- Settings panel -->
<button id="settings-btn" class="settings-btn" aria-label="Settings" title="Settings">⚙</button>
<div id="settings-panel" class="settings-panel" hidden></div>

<script src="image-slot.js"></script>
<script src="data.js"></script>
<script>
/* all app logic here — Tasks 3–7 */
</script>
</body>
</html>
```

- [ ] **Step 3: Add settings button CSS**

Add to the `<style>` block (after the existing rules):

```css
/* ── settings button ─── */
.settings-btn {
  position: fixed; bottom: 16px; right: 16px; z-index: 90;
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--paper-2); border: 1px solid var(--jp-edge, var(--paper-edge));
  color: var(--ink-2); font-size: 17px; cursor: pointer;
  box-shadow: 0 2px 8px rgba(100,72,30,0.12);
  transition: background .15s, transform .15s;
  display: flex; align-items: center; justify-content: center;
}
.settings-btn:hover { background: var(--gold-soft); transform: rotate(30deg); }

.settings-panel {
  position: fixed; bottom: 62px; right: 16px; z-index: 91;
  width: 240px; background: var(--paper-2);
  border: 1px solid var(--paper-edge); border-radius: 10px;
  padding: 14px 16px; box-shadow: 0 4px 18px rgba(100,72,30,0.14);
}
.settings-panel[hidden] { display: none; }
.settings-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 0; font-family: var(--serif); font-size: 13px; color: var(--ink-2);
  border-bottom: 1px dashed rgba(141,102,48,0.15);
}
.settings-row:last-child { border-bottom: none; }
.settings-toggle {
  position: relative; width: 32px; height: 18px;
  background: rgba(0,0,0,.15); border: none; border-radius: 999px;
  cursor: pointer; padding: 0; transition: background .15s;
}
.settings-toggle[aria-checked="true"] { background: var(--gold); }
.settings-toggle i {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
  border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25);
  transition: transform .15s; pointer-events: none;
}
.settings-toggle[aria-checked="true"] i { transform: translateX(14px); }
.settings-density { display: flex; gap: 4px; }
.settings-density button {
  padding: 3px 8px; border-radius: 5px; border: 1px solid var(--paper-edge);
  background: var(--paper); font-family: var(--serif); font-size: 12px;
  color: var(--ink-3); cursor: pointer; transition: all .12s;
}
.settings-density button.active {
  background: var(--gold); color: white; border-color: var(--gold-dark);
}
```

---

## Task 3: Core JS — state, navigation, sidebar, settings

**Files:**
- Modify: `learn jp/app.html` — the `<script>` block

- [ ] **Step 1: State object and persistence helpers**

```javascript
// ── State ──────────────────────────────────────────────────────────────
function lsGet(key, def) {
  try { const r = localStorage.getItem(key); return r == null ? def : JSON.parse(r); }
  catch { return def; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const SECTIONS = [
  { id: 'vocab',      glyph: '語', ja: '語彙',  en: 'Vocabulary' },
  { id: 'flashcards', glyph: '札', ja: '単語札', en: 'Flashcards' },
  { id: 'dictionary', glyph: '辞', ja: '辞書',   en: 'Dictionary' },
];

function hashSection() {
  const h = (location.hash || '').replace('#', '');
  return ['vocab','flashcards','dictionary'].includes(h) ? h : lsGet('jp:section', 'vocab');
}

const APP = {
  section:      hashSection(),
  showEnglish:  lsGet('jp:showEnglish', true),
  density:      lsGet('jp:density', 'comfortable'),
  particlesOn:  lsGet('jp:particles', true),
  // vocab
  vocabBookId:  lsGet('jp:vocabBook', VOCAB_BOOKS[0].id),
  vocabPageIdx: 0,
  // flashcards
  flashIdx:     0,
  flashShowEn:  true,
  // dictionary
  dictQ:        '',
  dictKind:     'all',
  dictLevel:    'all',
  dictTag:      'all',
  // popover
  popoverItem:  null,
  popoverRect:  null,
  // pending dict jump
  pendingDictQ: null,
};

function setSection(s) {
  APP.section = s;
  location.hash = s;
  lsSet('jp:section', s);
  renderMain();
  updateSidebar();
}
```

- [ ] **Step 2: Apply global body classes on state change**

```javascript
function applyBodyClasses() {
  document.body.classList.toggle('no-english', !APP.showEnglish);
  document.body.classList.toggle('no-particles', !APP.particlesOn);
  const pad = APP.density === 'compact' ? '32px' : APP.density === 'roomy' ? '72px' : '56px';
  document.documentElement.style.setProperty('--pad-page', pad);
}
```

- [ ] **Step 3: Render sidebar**

```javascript
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="brand">
        <div class="brand-mark">学</div>
        <div>
          <div class="brand-name">learn jp</div>
          <div class="brand-sub">a quiet notebook</div>
        </div>
      </div>
      <ul class="nav-list">
        <li class="nav-section-label">sections</li>
        ${SECTIONS.map(s => `
          <li>
            <button class="bookmark ${APP.section === s.id ? 'active' : ''}"
                    data-section="${s.id}">
              <span class="glyph">${s.glyph}</span>
              <span class="label">
                <span class="ja">${s.ja}</span>
                <span class="en">${s.en}</span>
              </span>
            </button>
          </li>
        `).join('')}
      </ul>
      <div class="sidebar-foot">
        <div class="streak"><span class="streak-dot"></span> 12-day streak</div>
        <div style="font-size:11px">312 words learned</div>
      </div>
    </div>`;
  sidebar.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', () => setSection(btn.dataset.section));
  });
}

function updateSidebar() {
  document.querySelectorAll('.bookmark').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === APP.section);
  });
}
```

- [ ] **Step 4: Settings panel**

```javascript
function renderSettings() {
  const panel = document.getElementById('settings-panel');
  panel.innerHTML = `
    <div class="settings-row">
      <span>Show English</span>
      <button class="settings-toggle" aria-checked="${APP.showEnglish}" data-setting="showEnglish"
              role="switch"><i></i></button>
    </div>
    <div class="settings-row">
      <span>Particle colors</span>
      <button class="settings-toggle" aria-checked="${APP.particlesOn}" data-setting="particlesOn"
              role="switch"><i></i></button>
    </div>
    <div class="settings-row">
      <span>Density</span>
      <div class="settings-density">
        ${['compact','comfortable','roomy'].map(d => `
          <button data-density="${d}" class="${APP.density === d ? 'active' : ''}">${d[0].toUpperCase()}</button>
        `).join('')}
      </div>
    </div>`;

  panel.querySelectorAll('[data-setting]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.setting;
      APP[key] = !APP[key];
      lsSet('jp:' + (key === 'showEnglish' ? 'showEnglish' : 'particles'), APP[key]);
      applyBodyClasses();
      renderSettings();
    });
  });
  panel.querySelectorAll('[data-density]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.density = btn.dataset.density;
      lsSet('jp:density', APP.density);
      applyBodyClasses();
      renderSettings();
    });
  });
}

function initSettings() {
  const btn = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = panel.hasAttribute('hidden');
    if (hidden) { renderSettings(); panel.removeAttribute('hidden'); }
    else panel.setAttribute('hidden', '');
  });
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.setAttribute('hidden', '');
    }
  });
}
```

- [ ] **Step 5: Hash-change listener + init**

```javascript
window.addEventListener('hashchange', () => {
  const s = hashSection();
  if (s !== APP.section) { APP.section = s; renderMain(); updateSidebar(); }
});

function init() {
  applyBodyClasses();
  renderSidebar();
  renderMain();
  initSettings();
  initPopover();
}

document.addEventListener('DOMContentLoaded', init);
```

---

## Task 4: Utility functions (particles, chunk parsing, word lookup, popover)

**Files:**
- Modify: `learn jp/app.html` — `<script>` block, before section renderers

- [ ] **Step 1: colorParticles — returns HTML string instead of React fragments**

```javascript
const PARTICLE_COLORS = {
  'は':'#8a2538','を':'#5a2e8a','が':'#c97a2c',
  'と':'#2a5b94','の':'#c43a4a','で':'#2e7a3f',
};
const PARTICLE_CHARS = ['は','を','が','と','の','で'];
function _isHiragana(c) { return !!c && /[぀-ゟ]/.test(c); }

function colorParticles(ja) {
  if (!ja) return '';
  let html = '';
  for (let i = 0; i < ja.length; i++) {
    const c = ja[i];
    const next = ja[i + 1] || '';
    if (PARTICLE_COLORS[c] && !_isHiragana(next)) {
      html += `<span class="ja-particle" style="color:${PARTICLE_COLORS[c]};margin:0 0.18em;font-weight:500">${c}</span>`;
    } else {
      html += c;
    }
  }
  return html;
}
```

- [ ] **Step 2: splitKanjiBreakdown**

```javascript
function splitKanjiBreakdown(word) {
  if (!word) return null;
  const meanings = window.KANJI_MEANINGS || {};
  const chars = [...word];
  const kanji = chars.filter(c => /[㐀-鿿]/.test(c));
  const hiragana = chars.filter(c => /[぀-ゟ]/.test(c));
  if (kanji.length === 0) return null;
  if (kanji.length === 1 && hiragana.length === 0) return null;
  return kanji.map(c => ({ char: c, meaning: meanings[c] || '?' }));
}
```

- [ ] **Step 3: parseChunk + lookupWord**

```javascript
function parseChunk(text) {
  if (!text) return { stem: '', particles: [], punct: '' };
  let rest = text;
  const punctMatch = rest.match(/([。、！？!?,\.…]+)$/);
  const punct = punctMatch ? punctMatch[0] : '';
  if (punct) rest = rest.slice(0, -punct.length);
  const particles = [];
  while (rest.length > 1 && PARTICLE_CHARS.includes(rest[rest.length - 1])) {
    particles.unshift(rest[rest.length - 1]);
    rest = rest.slice(0, -1);
  }
  return { stem: rest, particles, punct };
}

function lookupWord(text) {
  if (!text) return null;
  for (const book of (window.VOCAB_BOOKS || [])) {
    for (const page of (book.pages || [])) {
      for (const item of (page.items || [])) {
        const k = item.kanji || item.ja;
        if (k === text || item.kana === text || item.ja === text)
          return { kanji: k || text, kana: item.kana || '', en: item.en || '' };
      }
    }
  }
  const d = (window.DICTIONARY || []).find(e => e.kanji === text || e.kana === text);
  if (d) return { kanji: d.kanji, kana: d.kana, en: d.en };
  return { kanji: text, kana: '', en: '' };
}
```

- [ ] **Step 4: WordChunk HTML builder**

```javascript
// Returns an HTML string for a single whitespace-bounded chunk.
// Click/dblclick events are delegated from the sentence container.
function wordChunkHTML(text) {
  const { stem, particles, punct } = parseChunk(text);
  if (!stem) return escHTML(text);
  const particleSpans = particles.map(p =>
    `<span class="ja-particle" style="color:${PARTICLE_COLORS[p]||'inherit'};font-weight:500;margin:0">${p}</span>`
  ).join('');
  return `<span class="word-chunk" data-stem="${escAttr(stem)}"
               title="click to look up · double-click for dictionary"
               ><span class="wc-stem">${escHTML(stem)}</span>${particleSpans}</span>${escHTML(punct)}`;
}

function jaSentenceHTML(text) {
  if (!text) return '';
  return text.split(/[\s　]+/).filter(Boolean).map(wordChunkHTML).join('');
}

function escHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  return String(s).replace(/"/g,'&quot;');
}
```

- [ ] **Step 5: Word popover — init and open/close**

```javascript
function initPopover() {
  const backdrop = document.getElementById('word-pop-backdrop');
  const pop = document.getElementById('word-pop');

  backdrop.addEventListener('click', closePopover);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });

  // Event delegation for word chunks anywhere in #main
  document.getElementById('main').addEventListener('click', e => {
    const chunk = e.target.closest('.word-chunk');
    if (!chunk) return;
    e.stopPropagation();
    const item = lookupWord(chunk.dataset.stem);
    openPopover(item, chunk.getBoundingClientRect());
  });
  document.getElementById('main').addEventListener('dblclick', e => {
    const chunk = e.target.closest('.word-chunk');
    if (!chunk) return;
    e.preventDefault(); e.stopPropagation();
    jumpToDictionary(chunk.dataset.stem);
  });

  // Vocab row click/dblclick (rows are not word-chunks, handled separately)
  document.getElementById('main').addEventListener('click', e => {
    const row = e.target.closest('.vocab-row[data-kanji]');
    if (!row) return;
    const item = { kanji: row.dataset.kanji, kana: row.dataset.kana, en: row.dataset.en };
    openPopover(item, row.getBoundingClientRect());
  });
  document.getElementById('main').addEventListener('dblclick', e => {
    const row = e.target.closest('.vocab-row[data-kanji]');
    if (!row) return;
    e.preventDefault();
    jumpToDictionary(row.dataset.kanji);
  });
}

function jumpToDictionary(q) {
  APP.pendingDictQ = q;
  setSection('dictionary');
}

function openPopover(item, anchorRect) {
  const pop = document.getElementById('word-pop');
  const backdrop = document.getElementById('word-pop-backdrop');
  const breakdown = splitKanjiBreakdown(item.kanji);
  const bdHTML = breakdown ? `
    <div class="word-pop-breakdown">
      ${breakdown.map((b, i) => `
        ${i > 0 ? '<span class="bk-sep">·</span>' : ''}
        <span class="bk-pair">
          <span class="bk-kanji">${escHTML(b.char)}</span>
          <span class="bk-eq">=</span>
          <span class="bk-meaning">${escHTML(b.meaning)}</span>
        </span>
      `).join('')}
    </div>` : '';

  pop.innerHTML = `
    <button class="word-pop-close" id="pop-close" aria-label="close">×</button>
    <div class="word-pop-glyph">${escHTML(item.kanji || '')}</div>
    <div class="word-pop-kana">${escHTML(item.kana || '')}</div>
    <div class="word-pop-en">${escHTML(item.en || '')}</div>
    ${bdHTML}`;

  document.getElementById('pop-close').addEventListener('click', closePopover);
  pop.querySelector('.word-pop-glyph').addEventListener('dblclick', e => {
    e.preventDefault(); jumpToDictionary(item.kanji || item.kana);
  });

  pop.classList.remove('is-hidden');
  backdrop.style.display = 'block';

  // Position: prefer right of anchor, fallback left, fallback below
  const popW = pop.offsetWidth || 304;
  const popH = pop.offsetHeight || 200;
  const gap = 14, margin = 16;
  const vw = window.innerWidth, vh = window.innerHeight;
  const r = anchorRect;
  let left = r.right + gap;
  let top = r.top - 8;
  if (left + popW > vw - margin) {
    left = r.left - popW - gap;
    if (left < margin) { left = Math.max(margin, Math.min(vw - popW - margin, r.left)); top = r.bottom + gap; }
  }
  if (top + popH > vh - margin) top = vh - popH - margin;
  if (top < margin) top = margin;
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function closePopover() {
  document.getElementById('word-pop').classList.add('is-hidden');
  document.getElementById('word-pop-backdrop').style.display = 'none';
}
```

---

## Task 5: Vocab section

**Files:**
- Modify: `learn jp/app.html` — `<script>` block

- [ ] **Step 1: renderMain dispatcher**

```javascript
function renderMain() {
  closePopover();
  const el = document.getElementById('main-inner');
  el.className = 'main-inner fade-enter';
  if (APP.section === 'vocab')       renderVocab(el);
  else if (APP.section === 'flashcards') renderFlashcards(el);
  else if (APP.section === 'dictionary') renderDictionary(el);
}
```

- [ ] **Step 2: renderVocab**

```javascript
function renderVocab(container) {
  const book = VOCAB_BOOKS.find(b => b.id === APP.vocabBookId) || VOCAB_BOOKS[0];
  const page = book.pages[APP.vocabPageIdx];

  container.innerHTML = `
    <div class="page-head">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div class="page-eyebrow">vocabulary · 語彙</div>
          <h1 class="page-title-jp">部屋ごとに ことばを 集める</h1>
          <div class="page-title-en">Vocabulary, gathered room by room</div>
        </div>
      </div>
      <div class="rule"></div>
    </div>

    <div class="book-strip">
      ${VOCAB_BOOKS.map(b => `
        <button class="book-card ${b.id === APP.vocabBookId ? 'active' : ''}" data-book="${b.id}">
          <div class="glyph">${b.glyph}</div>
          <div class="ja">${b.titleJa}</div>
          <div class="en">${b.titleEn}</div>
        </button>
      `).join('')}
    </div>

    <div id="vocab-page-content"></div>

    <div class="pager">
      <button class="icon-btn" id="pager-prev" ${APP.vocabPageIdx === 0 ? 'disabled' : ''} title="previous page">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18" style="transform:rotate(180deg);transform-origin:50% 50%"/></svg>
      </button>
      <div class="dots">
        ${book.pages.map((p, i) => `
          <button class="dot ${i === APP.vocabPageIdx ? 'active' : ''}" data-page="${i}" title="${escAttr(p.title)}"></button>
        `).join('')}
      </div>
      <button class="icon-btn" id="pager-next" ${APP.vocabPageIdx === book.pages.length - 1 ? 'disabled' : ''} title="next page">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
      </button>
      <span class="small-label" style="margin-left:12px">page ${APP.vocabPageIdx + 1} / ${book.pages.length}</span>
    </div>`;

  renderVocabPage(book, page);

  // Book picker
  container.querySelectorAll('[data-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.vocabBookId = btn.dataset.book;
      APP.vocabPageIdx = 0;
      lsSet('jp:vocabBook', APP.vocabBookId);
      renderVocab(container);
    });
  });
  // Pager
  container.querySelector('#pager-prev').addEventListener('click', () => {
    APP.vocabPageIdx = Math.max(0, APP.vocabPageIdx - 1);
    renderVocab(container);
  });
  container.querySelector('#pager-next').addEventListener('click', () => {
    APP.vocabPageIdx = Math.min(book.pages.length - 1, APP.vocabPageIdx + 1);
    renderVocab(container);
  });
  container.querySelectorAll('.dot[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.vocabPageIdx = parseInt(btn.dataset.page);
      renderVocab(container);
    });
  });
}
```

- [ ] **Step 3: renderVocabPage (dispatches to cheatsheet / usage / sentences)**

```javascript
function renderVocabPage(book, page) {
  const el = document.getElementById('vocab-page-content');
  if (page.type === 'cheatsheet') el.innerHTML = cheatsheetHTML(book, page);
  else if (page.type === 'usage')  el.innerHTML = usageHTML(page);
  else if (page.type === 'sentences') {
    el.innerHTML = sentencesHTML(page, 'ALL', false);
    attachSentencesEvents(el, page);
  }
}

function cheatsheetHTML(book, page) {
  // Highlight の and と in the title
  const titleHTML = page.title.replace(/(の|と)/g, '<span class="particle">$1</span>');
  const items = page.items.map(item => `
    <div class="vocab-row" data-kanji="${escAttr(item.kanji)}" data-kana="${escAttr(item.kana)}" data-en="${escAttr(item.en)}">
      <span class="num">${item.num}.</span>
      <div class="body">
        <span class="kanji">${escHTML(item.kanji)}</span>
        <span class="kana">（${escHTML(item.kana)}）</span>
        <span class="en">${escHTML(item.en)}</span>
      </div>
    </div>`).join('');

  return `
    <div class="book-frame">
      <span class="corner-tl"></span><span class="corner-tr"></span>
      <h2 class="book-title">${titleHTML}</h2>
      <div class="sheet-image">
        <image-slot
          id="vocab-${book.id}-${page.imageSlotId}"
          shape="rounded" radius="4"
          placeholder="Drop the ${book.titleEn.toLowerCase()} cheatsheet illustration"
          style="width:100%;height:100%"></image-slot>
      </div>
      <div class="vocab-grid">${items}</div>
    </div>`;
}

function usageHTML(page) {
  const cards = page.items.map(u => `
    <div class="usage-card">
      <div class="ja">${jaSentenceHTML(u.ja)}</div>
      <div class="kana">${escHTML(u.kana)}</div>
      <div class="en">${escHTML(u.en)}</div>
    </div>`).join('');
  return `
    <div class="panel">
      <div style="margin-bottom:18px">
        <h2 style="font-family:var(--serif-jp);font-size:26px;color:var(--ink);margin:0;font-weight:600">${escHTML(page.title)}</h2>
        <div style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3);margin-top:4px">${escHTML(page.subtitle)}</div>
      </div>
      <div class="usage-grid">${cards}</div>
    </div>`;
}

function sentencesHTML(page, level, showAll) {
  const LEVELS = ['ALL', ...JLPT_LEVELS];
  const filtered = page.items.filter(s => level === 'ALL' || s.level === level);
  const INITIAL = 5;
  const visible = showAll ? filtered : filtered.slice(0, INITIAL);
  const hidden = filtered.length - visible.length;

  const levelPills = LEVELS.map(L => `
    <button class="pill ${level === L ? 'active' : ''}" data-level="${L}">
      ${L === 'ALL' ? 'all' : L}
    </button>`).join('');

  const rows = visible.map(s => `
    <div class="sentence">
      <span class="level-tag">${s.level}</span>
      <div class="body">
        <div class="ja">${jaSentenceHTML(s.ja)}</div>
        <div class="en">${escHTML(s.en)}</div>
      </div>
      <button class="icon-btn audio" title="play audio">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      </button>
    </div>`).join('');

  const emptyState = visible.length === 0
    ? `<div class="empty-state">no sentences at ${level} yet — try another level</div>` : '';

  const showMoreBtn = hidden > 0 && !showAll
    ? `<div style="text-align:center;margin-top:20px"><button class="btn ghost" data-show-more>see ${hidden} more ↓</button></div>` : '';
  const collapseBtn = showAll && filtered.length > INITIAL
    ? `<div style="text-align:center;margin-top:20px"><button class="btn ghost" data-collapse>collapse ↑</button></div>` : '';

  return `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:18px">
        <div>
          <h2 style="font-family:var(--serif-jp);font-size:26px;color:var(--ink);margin:0;font-weight:600">${escHTML(page.title)}</h2>
          <div style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3);margin-top:4px">${escHTML(page.subtitle)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="small-label">level:</span>
          ${levelPills}
        </div>
      </div>
      <div class="sentences">${emptyState}${rows}</div>
      ${showMoreBtn}${collapseBtn}
    </div>`;
}

function attachSentencesEvents(container, page) {
  let level = 'ALL', showAll = false;
  function rerender() {
    container.innerHTML = sentencesHTML(page, level, showAll);
    attachSentencesEvents(container, page);
  }
  container.querySelectorAll('[data-level]').forEach(btn => {
    btn.addEventListener('click', () => { level = btn.dataset.level; showAll = false; rerender(); });
  });
  const more = container.querySelector('[data-show-more]');
  if (more) more.addEventListener('click', () => { showAll = true; rerender(); });
  const collapse = container.querySelector('[data-collapse]');
  if (collapse) collapse.addEventListener('click', () => { showAll = false; rerender(); });
}
```

---

## Task 6: Flashcards section

**Files:**
- Modify: `learn jp/app.html` — `<script>` block

- [ ] **Step 1: renderFlashcards**

```javascript
function renderFlashcards(container) {
  const deck = window.FLASHCARDS;
  const card = deck[APP.flashIdx];

  container.innerHTML = `
    <div class="page-head">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div class="page-eyebrow">flashcards · 単語札</div>
          <h1 class="page-title-jp">絵 · 漢字 · よみかた</h1>
          <div class="page-title-en">Picture, character, reading — English only if you need it</div>
        </div>
        <div class="floating-controls" style="margin:0">
          <span class="small-label">english</span>
          <button class="pill ${APP.flashShowEn ? 'active' : ''}" data-flash-en="true">show</button>
          <button class="pill ${!APP.flashShowEn ? 'active' : ''}" data-flash-en="false">hide</button>
        </div>
      </div>
      <div class="rule"></div>
    </div>

    <div class="flash-deck">
      <div class="flash-stage">
        <div class="flash-card">
          <div class="flash-image">
            <image-slot id="flash-${card.id}" shape="rounded" radius="4"
              placeholder="Drop image for &quot;${escAttr(card.en)}&quot;"
              style="width:100%;height:100%"></image-slot>
          </div>
          <div class="flash-kanji">${escHTML(card.kanji)}</div>
          <div class="flash-reading">
            <span class="kun"><span class="label">kun</span>${escHTML(card.kun)}</span>
            <span style="color:var(--ink-4)">·</span>
            <span class="on"><span class="label">on</span>${escHTML(card.on)}</span>
          </div>
          <div class="flash-en" style="opacity:${APP.flashShowEn ? 1 : 0.3};font-style:${APP.flashShowEn ? 'italic' : 'normal'}">
            <span class="eyebrow">meaning</span>
            ${APP.flashShowEn ? escHTML(card.en) : '— —'}
          </div>
        </div>
      </div>

      <div class="flash-controls">
        <button class="icon-btn" id="flash-prev" title="previous (←)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18" style="transform:rotate(180deg);transform-origin:50% 50%"/></svg>
        </button>
        <div class="flash-progress">
          <div style="width:${((APP.flashIdx + 1) / deck.length) * 100}%"></div>
        </div>
        <button class="icon-btn" id="flash-next" title="next (→)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        </button>
      </div>

      <div style="text-align:center;font-family:var(--serif);font-style:italic;font-size:13px;color:var(--ink-3)">
        ${APP.flashIdx + 1} of ${deck.length} · use ← → to flip, space to hide English
      </div>
    </div>`;

  // English toggle pills
  container.querySelectorAll('[data-flash-en]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.flashShowEn = btn.dataset.flashEn === 'true';
      renderFlashcards(container);
    });
  });

  container.querySelector('#flash-prev').addEventListener('click', () => {
    APP.flashIdx = (APP.flashIdx - 1 + deck.length) % deck.length;
    renderFlashcards(container);
  });
  container.querySelector('#flash-next').addEventListener('click', () => {
    APP.flashIdx = (APP.flashIdx + 1) % deck.length;
    renderFlashcards(container);
  });

  // Keyboard nav — stored on a named function so it can be removed on section change
  APP._flashKeyHandler = (e) => {
    if (e.key === 'ArrowLeft')  { APP.flashIdx = (APP.flashIdx - 1 + deck.length) % deck.length; renderFlashcards(container); }
    if (e.key === 'ArrowRight') { APP.flashIdx = (APP.flashIdx + 1) % deck.length; renderFlashcards(container); }
    if (e.key === ' ')          { e.preventDefault(); APP.flashShowEn = !APP.flashShowEn; renderFlashcards(container); }
  };
  window.removeEventListener('keydown', APP._flashKeyHandler);
  window.addEventListener('keydown', APP._flashKeyHandler);
}
```

- [ ] **Step 2: Clean up keyboard listener when leaving flashcards**

In `renderMain()`, before dispatching, add:

```javascript
if (APP._flashKeyHandler) {
  window.removeEventListener('keydown', APP._flashKeyHandler);
  APP._flashKeyHandler = null;
}
```

---

## Task 7: Dictionary section

**Files:**
- Modify: `learn jp/app.html` — `<script>` block

- [ ] **Step 1: renderDictionary**

```javascript
function renderDictionary(container) {
  // Consume any pending query from another section (e.g. "see in dictionary →")
  if (APP.pendingDictQ) {
    APP.dictQ = APP.pendingDictQ;
    APP.dictKind = 'all'; APP.dictLevel = 'all'; APP.dictTag = 'all';
    APP.pendingDictQ = null;
  }

  // Compute unique tags
  const allTags = [...new Set(DICTIONARY.flatMap(e => e.tags || []))].sort();

  const norm = s => (s || '').toLowerCase().normalize('NFC');
  const query = norm(APP.dictQ);
  const filtered = DICTIONARY.filter(e => {
    if (APP.dictKind !== 'all' && e.kind !== APP.dictKind) return false;
    if (APP.dictLevel !== 'all' && e.level !== APP.dictLevel) return false;
    if (APP.dictTag !== 'all' && !(e.tags || []).includes(APP.dictTag)) return false;
    if (!query) return true;
    return e.kanji.includes(APP.dictQ) || norm(e.kana).includes(query) || norm(e.en).includes(query);
  });
  const kanjiHits = filtered.filter(e => e.kind === 'kanji');
  const wordHits  = filtered.filter(e => e.kind === 'word');

  const pill = (val, cur, key) =>
    `<button class="pill ${val === APP[key] ? 'active' : ''}" data-filter-key="${key}" data-filter-val="${escAttr(val)}">${escHTML(val === 'all' ? (key === 'dictTag' ? 'any' : 'all') : val)}</button>`;

  const clearBtn = APP.dictQ
    ? `<button class="icon-btn" id="dict-clear" title="clear">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : '';

  const dictGroupHTML = (label, entries) => entries.length === 0 ? '' : `
    <section style="margin-bottom:36px">
      <div style="font-family:var(--serif);font-style:italic;font-size:13px;color:var(--ink-3);
                  letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;padding-bottom:6px;
                  border-bottom:1px dashed rgba(141,102,48,.25)">${label} · ${entries.length}</div>
      <div class="dict-list">
        ${entries.map(e => `
          <div class="dict-row">
            <div class="kanji-cell">${escHTML(e.kanji)}</div>
            <div class="word-cell">
              <div class="kana">${escHTML(e.kana)}</div>
              <div class="en">${escHTML(e.en)}</div>
            </div>
            <div class="meta"><span class="level">${escHTML(e.level)}</span></div>
            <div class="meta" style="min-width:80px">${escHTML((e.tags||[]).slice(0,2).join(' · '))}</div>
          </div>`).join('')}
      </div>
    </section>`;

  container.innerHTML = `
    <div class="page-head">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div class="page-eyebrow">dictionary · 辞書</div>
          <h1 class="page-title-jp">さがす</h1>
          <div class="page-title-en">Browse and search — kanji, words, and what they mean</div>
        </div>
        <div class="small-label">${filtered.length} entries</div>
      </div>
      <div class="rule"></div>
    </div>

    <div class="search-bar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="dict-input" value="${escAttr(APP.dictQ)}" placeholder="kanji, kana, or english… (e.g. 風, kaze, mirror)" />
      ${clearBtn}
    </div>

    <div class="filters">
      <span class="small-label">kind:</span>
      ${['all','kanji','word'].map(v => pill(v, APP.dictKind, 'dictKind')).join('')}
      <span class="floating-controls" style="margin:0"><span class="sep"></span></span>
      <span class="small-label">level:</span>
      ${['all',...JLPT_LEVELS].map(v => pill(v, APP.dictLevel, 'dictLevel')).join('')}
      <span class="floating-controls" style="margin:0"><span class="sep"></span></span>
      <span class="small-label">tag:</span>
      ${['all',...allTags].map(v => pill(v, APP.dictTag, 'dictTag')).join('')}
    </div>

    ${filtered.length === 0 ? '<div class="empty-state">nothing matches yet — try clearing some filters</div>' : ''}
    ${dictGroupHTML('Kanji', kanjiHits)}
    ${dictGroupHTML('Words', wordHits)}`;

  // Search input — debounced re-render
  const input = container.querySelector('#dict-input');
  let debTimer;
  input.addEventListener('input', () => {
    clearTimeout(debTimer);
    debTimer = setTimeout(() => {
      APP.dictQ = input.value;
      renderDictionary(container);
    }, 120);
  });
  // Focus input and move cursor to end
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  const clearBtn2 = container.querySelector('#dict-clear');
  if (clearBtn2) clearBtn2.addEventListener('click', () => { APP.dictQ = ''; renderDictionary(container); });

  // Filter pills
  container.querySelectorAll('[data-filter-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP[btn.dataset.filterKey] = btn.dataset.filterVal;
      renderDictionary(container);
    });
  });
}
```

---

## Task 8: Wire everything together and verify

**Files:**
- Final review of `learn jp/app.html`

- [ ] **Step 1: Confirm script load order in `<body>`**

```html
<script src="image-slot.js"></script>
<script src="data.js"></script>
<script>
  /* all inline JS from Tasks 3–7 in this order:
     1. State + helpers (lsGet, lsSet, APP, setSection)
     2. applyBodyClasses
     3. Utility functions (escHTML, escAttr, colorParticles, splitKanjiBreakdown,
        parseChunk, lookupWord, wordChunkHTML, jaSentenceHTML)
     4. Popover (initPopover, openPopover, closePopover)
     5. renderSidebar, updateSidebar
     6. Settings (renderSettings, initSettings)
     7. renderMain + renderVocab + renderVocabPage + page helpers
     8. renderFlashcards
     9. renderDictionary
     10. init() + DOMContentLoaded
  */
</script>
```

- [ ] **Step 2: Open `learn jp/app.html` via `file://`**

Open `C:\Users\khevi\Claude Projects\khevin-mituti-portfolio\learn jp\app.html` directly in Chrome/Firefox. Verify:
- Sidebar renders with 3 sections
- Vocabulary section shows book picker and cheatsheet
- Can click book tabs and page through cheatsheet/usage/sentences
- Flashcard section renders, ← → keys work, spacebar toggles English
- Dictionary section shows all entries, search field filters, pills filter by kind/level/tag
- Settings ⚙ button opens a panel, toggling English hides/shows English in vocab + sentences
- Word click in a sentence opens the popover
- Double-click on word chunk jumps to dictionary

- [ ] **Step 3: Open via nihongo.html CTA link**

Click the "Open the study app" link on `nihongo.html`. Confirm it opens `learn jp/app.html` and the app works.

- [ ] **Step 4: Commit**

```bash
git add "learn jp/app.html" "learn jp/image-slot.js"
git commit -m "learn-jp: rewrite to vanilla HTML/JS, works on file:// and GitHub Pages"
```
