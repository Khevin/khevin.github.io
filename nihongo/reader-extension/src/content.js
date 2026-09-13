/*
 * content.js — runs on every http(s) page (host_permissions) and stays inert
 * until the learner selects Japanese text. Then: a floating Nihongo button near
 * the selection → click → the sentence is captured (extract.js), analysed by the
 * service worker's offscreen worker, and rendered as Sentence Structure blocks
 * in a floating bar at the bottom of the page. Tapping a block asks the service
 * worker to open the side panel with the word's details.
 *
 * Everything lives inside a closed-off shadow root so page CSS cannot leak in
 * or out. No dictionary, no storage, no network here. Honours prefs.enabled.
 */
import blocksCss from './panel/blocks.css';
import { extractRange } from './extract.js';
import { isJapaneseSelection, placeFab, actionIdFor } from './fab.js';
import { segmentSentences, toDisplayTextWithMap, remapSpans } from '../../reader-core/text.js';
import { buildBlockRowHTML } from './panel/blocks.js';
import { speak, ttsAvailable } from './panel/tts.js';

const PROTOCOL_VERSION = 1;
const TRACKING = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'yclid', 'mc_cid', 'mc_eid', 'igshid'];
const DEFAULT_PREFS = { enabled: true, level: 'words', romaji: false, furigana: false, appUrl: 'https://khevin.com/nihongo/app.html', mutedHosts: [], ttsRate: 0.85, ttsVoiceURI: null };
/** Ask the service worker for the Google Cloud voice; false = use ours. */
async function speakRemote(text) {
  try {
    const r = await chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `sp-${Date.now()}`, type: 'SPEAK', payload: { text } });
    return !!(r && r.ok && r.played);
  } catch { return false; }
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const BAR_CSS = `
:host { all: initial; }
.nr-fab { position: fixed; z-index: 2147483646; width: 36px; height: 36px; border-radius: 50%; border: 0; background: #1a140e; color: #f6f1e8; font: 700 18px/36px 'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.35), inset 0 0 0 1.5px #d4884a; padding: 0; }
.nr-fab:hover, .nr-fab:focus-visible { background: #2e261e; outline: none; box-shadow: 0 2px 10px rgba(0,0,0,.45), inset 0 0 0 2px #d4884a; }
.nr-bar { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); width: min(960px, calc(100vw - 24px)); z-index: 2147483645; background: linear-gradient(180deg, #2e261e, #1a140e); color: #f6f1e8; border-radius: 14px; box-shadow: 0 10px 34px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06); font: 13px/1.4 Georgia, 'Times New Roman', serif; }
.nr-bar[hidden] { display: none; }
.nr-bar, .nr-bar * { box-sizing: border-box; }
.nr-bar.ss-page { padding: 0; }   /* .ss-page only supplies the palette tokens here */
.nr-head { display: flex; align-items: center; gap: 8px; padding: 8px 12px 0; flex-wrap: wrap; }
.nr-head .nr-title { font: 700 13px 'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; color: #d4884a; letter-spacing: .04em; }
.nr-head .nr-spacer { flex: 1; }
.nr-btn { border: 1px solid rgba(255,255,255,.18); background: transparent; color: inherit; border-radius: 6px; padding: 2px 8px; cursor: pointer; font: inherit; font-size: 12px; }
.nr-btn:hover { background: rgba(255,255,255,.08); }
.nr-btn[disabled] { opacity: .4; cursor: default; }
.nr-btn.nr-x { border: 0; font-size: 16px; padding: 0 6px; }
.nr-seg { display: inline-flex; border: 1px solid rgba(255,255,255,.18); border-radius: 6px; overflow: hidden; }
.nr-seg button { border: 0; background: transparent; color: inherit; padding: 2px 8px; cursor: pointer; font: inherit; font-size: 12px; }
.nr-seg button[aria-pressed="true"] { background: #f6f1e8; color: #1a140e; }
.nr-status { font-style: italic; color: rgba(255,255,255,.6); font-size: 12px; }
.nr-status.err { color: #f0a08f; }
.nr-body { padding: 6px 12px 12px; max-height: 190px; overflow: auto; }
.nr-body .ss-blocks-row { justify-content: flex-start; row-gap: 12px; margin-top: 8px; }
.nr-body .ss-sentence-jp-text { text-align: left; font-size: 14px; margin: 0 0 6px; }
.nr-body .ss-blk { cursor: pointer; }
.ss-blk.ss-selected { filter: drop-shadow(0 3px 0 #fff) !important; }
.nr-partial { margin: 8px 0 0; font-style: italic; color: rgba(255,255,255,.55); font-size: 12px; }
.nr-hint { margin: 6px 12px 10px; color: rgba(255,255,255,.6); font-size: 12px; }
@keyframes nr-fab-in { from { opacity: 0; transform: translateY(-10px) scale(.92); } to { opacity: 1; transform: none; } }
@keyframes nr-bar-in { from { opacity: 0; transform: translate(-50%, 28px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes nr-blocks-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: no-preference) {
  .nr-fab { transition: transform .12s; }
  .nr-fab:hover { transform: scale(1.06); }
  .nr-fab.nr-enter { animation: nr-fab-in .22s cubic-bezier(.2,.8,.2,1) both; }          /* slide down, ease in */
  .nr-bar.nr-enter { animation: nr-bar-in .42s cubic-bezier(.34,1.56,.64,1) both; }      /* bounce in from below */
  .nr-body .ss-blocks-row { animation: nr-blocks-in .18s cubic-bezier(.2,.8,.2,1) both; } /* settle when the sentence changes */
}
`;

let prefs = { ...DEFAULT_PREFS };
let host = null, root = null, fab = null, bar = null;
const state = { capture: null, sentences: [], analyses: new Map(), active: 0, level: 'words', romaji: false, furigana: false, shown: new Set(), saving: new Set(), saveFailed: new Set(), selection: null, status: '' };
let selTimer = null;
let started = false;
const isCurrent = (capture, i = state.active) => state.capture === capture && state.active === i && bar && !bar.hidden;

// ── setup ────────────────────────────────────────────────────────────────────
function mount() {
  if (host) return;
  host = document.createElement('nihongo-reader-root');
  host.setAttribute('lang', 'ja');
  root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = blocksCss + BAR_CSS;
  root.appendChild(style);
  fab = document.createElement('button');
  fab.className = 'nr-fab'; fab.type = 'button'; fab.textContent = '札'; fab.title = 'Study with Nihongo (Alt+Shift+N)'; fab.setAttribute('aria-label', 'Study this selection with Nihongo'); fab.hidden = true;
  fab.addEventListener('mousedown', (e) => e.preventDefault()); // keep the page selection alive
  fab.addEventListener('click', () => study());
  bar = document.createElement('div');
  bar.className = 'nr-bar ss-page'; bar.hidden = true; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Nihongo Reader');
  bar.addEventListener('click', onBarClick);
  bar.addEventListener('change', (e) => { const a = e.target.dataset.act; if (a === 'romaji') { state.romaji = e.target.checked; savePref({ romaji: state.romaji }); renderBar(); } if (a === 'furigana') { state.furigana = e.target.checked; savePref({ furigana: state.furigana }); renderBar(); } });
  root.append(fab, bar);
  document.documentElement.appendChild(host);
}
function unmount() { if (host) { host.remove(); host = root = fab = bar = null; } }

async function loadPrefs() {
  try { const r = await chrome.storage.local.get('prefs'); prefs = { ...DEFAULT_PREFS, ...(r.prefs || {}) }; } catch { prefs = { ...DEFAULT_PREFS }; }
  state.level = prefs.level; state.romaji = !!prefs.romaji; state.furigana = !!prefs.furigana;
}
async function savePref(partial) { try { const r = await chrome.storage.local.get('prefs'); await chrome.storage.local.set({ prefs: { ...DEFAULT_PREFS, ...(r.prefs || {}), ...partial } }); } catch { /* no runtime */ } }
function isActive() { return prefs.enabled && !(prefs.mutedHosts || []).includes(location.hostname); }

// ── selection watcher → FAB ─────────────────────────────────────────────────
function currentRange() {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const anchor = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  if (!anchor || anchor.closest('input, textarea, [contenteditable=""], [contenteditable="true"]')) return null;
  if (host && (anchor === host || host.contains(anchor))) return null;
  return sel.getRangeAt(0);
}
const barOpen = () => !!(bar && !bar.hidden && state.sentences.length);
function updateFab() {
  if (!isActive()) return;
  const range = currentRange();
  const text = range ? range.toString() : '';
  if (!range || !isJapaneseSelection(text)) { hideFab(); return; }
  if (barOpen()) { hideFab(); return; }   // reading mode: the bar follows the selection itself (see onSelectionEnd)
  mount();
  const rects = range.getClientRects();
  const rect = rects.length ? rects[0] : range.getBoundingClientRect();
  const p = placeFab({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }, { width: window.innerWidth, height: window.innerHeight });
  fab.style.left = `${p.x}px`; fab.style.top = `${p.y}px`; fab.dataset.side = p.side; fab.dataset.placement = p.placement;
  if (fab.hidden) enter(fab);
  fab.hidden = false;
}
function hideFab() { if (fab) fab.hidden = true; }
/** Play the element's enter animation once (class removed on animationend so hover transitions work afterwards). */
function enter(el) { el.classList.remove('nr-enter'); void el.offsetWidth; el.classList.add('nr-enter'); el.addEventListener('animationend', () => el.classList.remove('nr-enter'), { once: true }); }
function onSelectionChange() { clearTimeout(selTimer); selTimer = setTimeout(updateFab, 150); }
/** A selection that has just ENDED (mouse released, key released) while the bar is open replaces the bar's content. Never fires mid-drag, so partial selections are never analysed or counted. */
function onSelectionEnd() {
  setTimeout(() => {
    if (!isActive() || !barOpen()) return;
    const range = currentRange();
    if (!range || !isJapaneseSelection(range.toString())) return;
    study({ auto: true });
  }, 0);
}

function cleanUrl(href) { try { const u = new URL(href); for (const p of TRACKING) u.searchParams.delete(p); return u.toString(); } catch { return href; } }
function sourceRef() { return { url: cleanUrl(location.href), title: document.title || null, domain: location.hostname, capturedAt: new Date().toISOString() }; }

// ── study flow ──────────────────────────────────────────────────────────────
function sentencesFrom(blocks, captureKind) {
  const out = [];
  for (const b of blocks) for (const s of segmentSentences(b.text)) {
    const { text, map } = toDisplayTextWithMap(s.text);
    const local = (b.ruby || []).filter(r => r.start >= s.start && r.end <= s.end).map(r => ({ start: r.start - s.start, end: r.end - s.start, reading: r.reading }));
    out.push({ text, fragment: s.fragment, ruby: remapSpans(local, map), captureKind });
  }
  return out;
}

async function study({ auto = false } = {}) {
  const range = currentRange();
  if (!range || !isJapaneseSelection(range.toString())) { if (!auto) flash('Select some Japanese text first'); return; }
  mount();
  let extracted;
  try { extracted = extractRange(range); } catch (err) { if (!auto) flash(`Could not read the selection: ${err.message}`, true); return; }
  const sentences = sentencesFrom(extracted.blocks, extracted.captureKind);
  if (!sentences.length) { if (!auto) flash('The selection has no readable text', true); return; }
  const key = sentences.map(s => s.text).join('\n');
  if (auto && key === state.lastKey) return;   // same text re-selected: keep what is shown
  state.lastKey = key;
  const captureId = `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  state.capture = { captureId, source: sourceRef(), captureKind: extracted.captureKind };
  const capture = state.capture;
  state.sentences = sentences; state.analyses = new Map(); state.active = 0; state.shown = new Set(); state.saving = new Set(); state.saveFailed = new Set(); state.selection = null;
  hideFab();
  setStatus('analysing…'); if (bar.hidden) { bar.hidden = false; enter(bar); } renderBar();
  try {
    const r = await send('STUDY_REQUEST', { captureId, captureKind: extracted.captureKind, sentences: sentences.map(s => ({ text: s.text, fragment: s.fragment, ruby: s.ruby })), source: state.capture.source });
    if (state.capture !== capture) return;
    if (!r || !r.ok) throw new Error(r ? r.error : 'no reply from the extension');
    state.analyses.set(0, r.analysis);
    if (!isCurrent(capture, 0)) return;
    setStatus('');
    renderBar();
    await markShown(0);
  } catch (err) { if (isCurrent(capture, 0)) { setStatus(`analysis failed: ${err.message}`, true); renderBar(); } }
}

async function showSentence(i) {
  if (i < 0 || i >= state.sentences.length) return;
  const capture = state.capture;
  state.active = i; state.selection = null;
  if (!state.analyses.has(i)) {
    setStatus('analysing…'); renderBar();
    try {
      const r = await send('ANALYZE_SENTENCE', { captureId: state.capture.captureId, index: i, text: state.sentences[i].text });
      if (!r || !r.ok) throw new Error(r ? r.error : 'no reply');
      if (!isCurrent(capture, i)) return;
      state.analyses.set(i, r.analysis); setStatus('');
    } catch (err) { if (isCurrent(capture, i)) { setStatus(`analysis failed: ${err.message}`, true); renderBar(); } return; }
  }
  renderBar();
  await markShown(i);
}

async function markShown(i) {
  const capture = state.capture;
  if (!capture || !isCurrent(capture, i)) return;
  const actionId = actionIdFor(capture.captureId, i);
  if (state.shown.has(actionId) || state.saving.has(actionId)) return;
  const saving = state.saving;
  saving.add(actionId);
  const s = state.sentences[i];
  try {
    const r = await send('SENTENCE_SHOWN', { actionId, displayText: s.text, source: capture.source, captureKind: s.captureKind || 'selection', fragment: s.fragment, rubySpans: s.ruby.length ? s.ruby : undefined, captureId: capture.captureId, index: i });
    if (!r || !r.ok) throw new Error(r?.error || 'no reply from the extension');
    if (state.capture === capture) { state.shown.add(actionId); state.saveFailed.delete(actionId); }
    if (isCurrent(capture, i)) setStatus('');
  } catch (err) {
    if (state.capture === capture) state.saveFailed.add(actionId);
    if (isCurrent(capture, i)) setStatus(`not saved: ${err.message}`, true);
  } finally { saving.delete(actionId); if (isCurrent(capture, i)) renderBar(); }
}

async function openDetails(tokenIds) {
  const capture = state.capture, index = state.active;
  if (!capture) return;
  state.selection = tokenIds; renderBar();
  try {
    const r = await send('OPEN_DETAILS', { captureId: state.capture.captureId, index: state.active, tokenIds, sentences: state.sentences.map(s => ({ text: s.text, fragment: s.fragment, ruby: s.ruby })), source: state.capture.source, captureKind: state.capture.captureKind });
    if (isCurrent(capture, index) && (!r || !r.ok || r.opened === false)) setStatus(r && r.reason === 'gesture' ? 'Chrome needs a click on the Nihongo icon to open the side panel — details are waiting there' : `could not open the side panel: ${r ? (r.error || 'unknown error') : 'no reply'}`, true);
  } catch (err) { if (isCurrent(capture, index)) setStatus(`could not open details: ${err.message}`, true); }
}

function send(type, payload) {
  return chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, payload });
}

// ── bar rendering ───────────────────────────────────────────────────────────
function setStatus(text, err = false) { state.status = text; state.statusErr = err; const el = bar && bar.querySelector('.nr-status'); if (el) { el.textContent = text; el.className = `nr-status${err ? ' err' : ''}`; } }
function flash(text, err = false) { mount(); bar.hidden = false; if (!state.sentences.length) bar.innerHTML = `<div class="nr-head"><span class="nr-title">Nihongo Reader</span><span class="nr-status${err ? ' err' : ''}">${esc(text)}</span><span class="nr-spacer"></span><button class="nr-btn nr-x" data-act="close" aria-label="close">×</button></div>`; else setStatus(text, err); }

function renderBar() {
  if (!bar) return;
  const n = state.sentences.length, i = state.active;
  const a = state.analyses.get(i);
  const s = state.sentences[i];
  const head = `<div class="nr-head">
    <span class="nr-title">Nihongo Reader</span>
    <button class="nr-btn" data-act="prev" ${i === 0 ? 'disabled' : ''} aria-label="previous sentence">‹</button><span>${i + 1} / ${n}</span><button class="nr-btn" data-act="next" ${i >= n - 1 ? 'disabled' : ''} aria-label="next sentence">›</button>
    <span class="nr-seg" role="group" aria-label="detail level"><button data-act="level" data-level="words" aria-pressed="${state.level === 'words'}">Words</button><button data-act="level" data-level="phrases" aria-pressed="${state.level === 'phrases'}">Phrases</button></span>
    <label><input type="checkbox" data-act="romaji" ${state.romaji ? 'checked' : ''}> romaji</label>
    <label><input type="checkbox" data-act="furigana" ${state.furigana ? 'checked' : ''}> furigana</label>
    <span class="nr-status${state.statusErr ? ' err' : ''}" role="status">${esc(state.status)}</span>
    ${state.capture && state.saveFailed.has(actionIdFor(state.capture.captureId, i)) ? '<button class="nr-btn" data-act="retry-save">Retry save</button>' : ''}
    <span class="nr-spacer"></span>
    ${ttsAvailable() ? `<button class="nr-btn" data-act="listen" aria-label="listen to this sentence" title="Listen (Nihongo voice)">🔊 Listen</button>` : ''}
    <button class="nr-btn" data-act="details" title="Open the Nihongo side panel with word and kanji details">Side panel ›</button>
    <button class="nr-btn nr-x" data-act="close" aria-label="close">×</button>
  </div>`;
  let body;
  if (!a) body = `<div class="nr-body"><p class="ss-sentence-jp-text" lang="ja" style="text-transform:none">${esc(s ? s.text : '')}</p></div>`;
  else body = `<div class="nr-body">${buildBlockRowHTML(a, { level: state.level, romaji: state.romaji, furigana: state.furigana, rubySpans: s ? s.ruby : [], selectedTokenIds: state.selection || [] })}</div>`;
  bar.innerHTML = head + body;
}

function onBarClick(e) {
  const blk = e.target.closest('.ss-blk[data-tokens]');
  if (blk) { openDetails(blk.dataset.tokens.split(',').filter(Boolean)); return; }
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'close') { closeBar(); return; }
  if (act === 'retry-save') { markShown(state.active); return; }
  if (act === 'prev') { showSentence(state.active - 1); return; }
  if (act === 'next') { showSentence(state.active + 1); return; }
  if (act === 'level') { state.level = btn.dataset.level; savePref({ level: state.level }); renderBar(); return; }
  if (act === 'details') { openDetails(state.selection || []); return; }
  if (act === 'listen') { const s = state.sentences[state.active]; if (s) speak(s.text, { rate: prefs.ttsRate, voiceURI: prefs.ttsVoiceURI || null, remote: speakRemote }); return; }
}
function closeBar() { try { chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `st-${Date.now()}`, type: 'STOP_SPEAK', payload: {} }); } catch { /* worker asleep, nothing playing */ }
  if (bar) bar.hidden = true; state.capture = null; state.sentences = []; state.analyses = new Map(); state.selection = null; state.lastKey = null; }

// ── wiring ──────────────────────────────────────────────────────────────────
function start() {
  if (started) return;
  started = true;
  document.addEventListener('selectionchange', onSelectionChange, true);
  document.addEventListener('mouseup', (e) => { if (host && e.composedPath().includes(host)) return; onSelectionChange(); onSelectionEnd(); }, true);
  document.addEventListener('keyup', (e) => { if (e.key === 'Escape') { hideFab(); if (bar && !bar.hidden) closeBar(); return; } onSelectionChange(); if (e.shiftKey || /^Arrow|^(Home|End)$/.test(e.key)) onSelectionEnd(); }, true);
  window.addEventListener('scroll', hideFab, { passive: true, capture: true });
  window.addEventListener('resize', hideFab, { passive: true });
}

(async function init() {
  if (window !== window.top) return;              // top frame only in v1
  await loadPrefs();
  if (isActive()) start();
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.prefs) return;
      const was = isActive();
      prefs = { ...DEFAULT_PREFS, ...(changes.prefs.newValue || {}) };
      state.level = prefs.level; state.romaji = !!prefs.romaji; state.furigana = !!prefs.furigana;
      if (was && !isActive()) { hideFab(); closeBar(); unmount(); }
      else if (!was && isActive()) start();
      else if (barOpen()) renderBar();
    });
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (!msg || msg.protocolVersion !== PROTOCOL_VERSION || msg.target === 'offscreen') return false;
      if (msg.type === 'STUDY_SELECTION') { if (isActive()) study(); sendResponse({ ok: true }); return false; }
      return false;
    });
  } catch { /* no extension runtime (tests) */ }
})();

// test hook (harmless in production; the shadow root is closed, so this is the only way in)
window.__nihongoReaderBar = { get state() { return state; }, get root() { return root; }, study, showSentence, updateFab };
