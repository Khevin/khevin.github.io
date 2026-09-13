/*
 * offscreen.js — the extension's single analysis host (chrome.offscreen,
 * reasons WORKERS + AUDIO_PLAYBACK). Owns one module worker (analysis-worker.js) so the bar and
 * the panel share one dictionary in memory. Also plays Google Cloud
 * text-to-speech clips, because a host page's CSP can block both the fetch and
 * the data: audio for the in-page bar. Answers runtime messages whose `target`
 * is 'offscreen'; holds no learner state (the key arrives with each request).
 */
import { synthesize } from './panel/tts.js';
const PROTOCOL_VERSION = 1;
let worker = null, seq = 0;
const pending = new Map();
const IDLE_MS = 10 * 60 * 1000;
const REQUEST_MS = 30 * 1000;
let idleTimer = null;

function releaseWorker(message = 'Analysis was released; please try again') {
  clearTimeout(idleTimer);
  if (worker) worker.terminate();
  worker = null;
  for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(message)); }
  pending.clear();
}
function armIdle() {
  clearTimeout(idleTimer);
  // This timer belongs to the document that owns the dictionary. A timer in
  // background.js disappears when Chrome suspends its service worker.
  if (worker && !pending.size) idleTimer = setTimeout(() => releaseWorker(), IDLE_MS);
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('analysis-worker.js', location.href), { type: 'module' });
  worker.onmessage = (ev) => { const { requestId, type, payload } = ev.data || {}; const p = pending.get(requestId); if (!p) return; pending.delete(requestId); clearTimeout(p.timer); type === 'WORKER_ERROR' ? p.reject(new Error(payload.message)) : p.resolve(payload); armIdle(); };
  worker.onerror = (e) => releaseWorker(e.message || 'Analysis worker failed; please try again');
  return worker;
}
function ask(type, payload) {
  clearTimeout(idleTimer);
  const requestId = `o${++seq}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => releaseWorker('Analysis timed out; please try again'), REQUEST_MS);
    pending.set(requestId, { resolve, reject, timer });
    try { getWorker().postMessage({ protocolVersion: PROTOCOL_VERSION, requestId, type, payload }); }
    catch (err) { releaseWorker(err.message); }
  });
}

// ── Listen (Google Cloud voice) ─────────────────────────────────────────────
// One clip at a time. `playGen` is bumped by every new request and every stop,
// so a fetch that resolves after it was superseded drops its clip instead of
// overlapping the newer one.
let audioEl = null, playGen = 0;
function stopAudio() {
  playGen++;
  if (audioEl) { try { audioEl.pause(); } catch { /* already gone */ } audioEl = null; }
}
async function speakClip({ text, voice, rate, key }) {
  const gen = ++playGen;
  if (audioEl) { try { audioEl.pause(); } catch { /* already gone */ } audioEl = null; }
  const audioContent = await synthesize(text, { key, voice, rate });
  if (gen !== playGen) return { played: false, stale: true };
  const el = new Audio('data:audio/mpeg;base64,' + audioContent);
  el.onended = () => { if (audioEl === el) audioEl = null; };
  audioEl = el;
  await el.play();
  return { played: true };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.target !== 'offscreen' || msg.protocolVersion !== PROTOCOL_VERSION) return false;
  if (msg.type === 'ANALYZE' || msg.type === 'TOKENIZE' || msg.type === 'INIT') {
    ask(msg.type, msg.payload).then((r) => sendResponse({ ok: true, result: r })).catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'SPEAK') {
    speakClip(msg.payload || {}).then((r) => sendResponse({ ok: true, ...r })).catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));
    return true;
  }
  if (msg.type === 'STOP_SPEAK') { stopAudio(); sendResponse({ ok: true }); return false; }
  if (msg.type === 'RELEASE') { releaseWorker(); sendResponse({ ok: true }); return false; }
  return false;
});
