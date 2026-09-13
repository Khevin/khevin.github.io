/*
 * panel/tts.js — text-to-speech for the bar, the panel and the popup,
 * mirroring the Nihongo app's TTS module (app.js): ja-JP, rate 0.85 by
 * default, the app's voice preference order, and identical text debounced for
 * 700 ms so a double-click never replays.
 *
 * Two playback paths, exactly like the app:
 *   web    SpeechSynthesis in the calling context — whatever voices the OS has.
 *   cloud  texttospeech.googleapis.com with the learner's own Google Cloud key,
 *          the same five ja-JP Neural2 / WaveNet voices the app offers.
 * Where the cloud clip is fetched and played depends on who is asking:
 *   extension pages (side panel, popover) do it themselves with playCloud(),
 *     so Listen keeps working even when the service worker is asleep or stale;
 *   the in-page bar cannot, because a host page's Content-Security-Policy can
 *     block both the request and the data: audio, so it asks the service
 *     worker, which plays the clip in the offscreen document.
 * Either way the caller passes a `remote` to speak(), and any failure falls
 * back to the web voice, so a tap always makes sound.
 */
const NAME_PREFS = ['Google 日本語', 'Google Japanese', 'Google ja-JP', 'Kyoko', 'Otoya', 'Haruka', 'Sayaka', 'Nanami'];
const SPEAK_DEBOUNCE_MS = 700;
let voices = [];
let lastText = '', lastAt = 0;

function refresh() { if (globalThis.speechSynthesis) voices = speechSynthesis.getVoices(); }
if (globalThis.speechSynthesis) {
  refresh();
  if (typeof speechSynthesis.onvoiceschanged !== 'undefined') speechSynthesis.addEventListener('voiceschanged', refresh);
}

// ── Google Cloud voices (the app's list, same ids and labels) ───────────────
export const CLOUD_PREFIX = 'gcloud:';
export const GCLOUD_VOICES = [
  { id: 'ja-JP-Neural2-B', label: 'Google Cloud · Neural2 B (female)' },
  { id: 'ja-JP-Neural2-C', label: 'Google Cloud · Neural2 C (male)' },
  { id: 'ja-JP-Neural2-D', label: 'Google Cloud · Neural2 D (male, deep)' },
  { id: 'ja-JP-Wavenet-A', label: 'Google Cloud · WaveNet A (female)' },
  { id: 'ja-JP-Wavenet-C', label: 'Google Cloud · WaveNet C (male)' },
];

/** `gcloud:ja-JP-Neural2-C` → `ja-JP-Neural2-C`; anything else → null. */
export function cloudVoiceName(voiceURI) {
  const s = String(voiceURI || '');
  if (!s.startsWith(CLOUD_PREFIX)) return null;
  const name = s.slice(CLOUD_PREFIX.length);
  return GCLOUD_VOICES.some(v => v.id === name) ? name : null;
}
/** Would this preference use the cloud, given the stored key? */
export function usesCloud(prefs = {}) { return !!(prefs.gcloudTtsKey && cloudVoiceName(prefs.ttsVoiceURI)); }

export function synthesizeUrl(key) { return 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(key); }

export function synthesizeBody(text, voiceName, rate) {
  const r = +rate;
  return {
    input: { text },
    voice: { languageCode: 'ja-JP', name: voiceName || GCLOUD_VOICES[0].id },
    // The API accepts 0.25–4.0; the bar's slider stays well inside that.
    audioConfig: { audioEncoding: 'MP3', speakingRate: Number.isFinite(r) && r > 0 ? Math.max(0.25, Math.min(4, r)) : 1 },
  };
}

/**
 * POST one phrase to Cloud Text-to-Speech and return the base64 MP3.
 * Throws with Google's own message ("403 — Requests from referer … are
 * blocked") so a caller in strict mode can show it instead of masking it.
 * @returns {Promise<string>} base64 audio
 */
export async function synthesize(text, { key, voice, rate, fetchImpl } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) throw new Error('nothing to speak');
  if (!key) throw new Error('No Google Cloud key set');
  const f = fetchImpl || globalThis.fetch;
  const res = await f(synthesizeUrl(key), {
    method: 'POST', credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(synthesizeBody(clean, voice, rate)),
  });
  if (!res.ok) {
    let detail = 'HTTP ' + res.status;
    try { const ej = await res.json(); if (ej && ej.error && ej.error.message) detail = res.status + ' — ' + ej.error.message; } catch { /* keep the status */ }
    throw new Error(detail);
  }
  const data = await res.json();
  if (!data || !data.audioContent) throw new Error('empty audio response');
  return data.audioContent;
}

/**
 * Sort a Cloud Text-to-Speech refusal into the handful of things that are
 * actually wrong, so the popover can say what to do instead of only quoting
 * Google. The message text is Google's; only the classification is ours.
 * @returns {'billing'|'disabled'|'referrer'|'key'|'quota'|'other'}
 */
export function voiceErrorKind(message) {
  const m = String(message || '');
  if (/billing/i.test(m)) return 'billing';
  if (/SERVICE_DISABLED|has not been used in project|API is not enabled|is disabled/i.test(m)) return 'disabled';
  if (/referer|referrer|API_KEY_HTTP_REFERRER|blocked/i.test(m)) return 'referrer';
  if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(m)) return 'key';
  if (/quota|RESOURCE_EXHAUSTED|rate limit|429/i.test(m)) return 'quota';
  return 'other';
}

/** The first http(s) link Google put in its message, for the popover to offer. */
export function firstUrl(message) {
  const m = String(message || '').match(/https?:\/\/[^\s)<>"']+/);
  return m ? m[0].replace(/[.,;]$/, '') : null;
}

// ── web speech ──────────────────────────────────────────────────────────────
export function listJaVoices() { refresh(); return voices.filter(v => (v.lang || '').toLowerCase().startsWith('ja')); }

export function pickVoice(voiceURI = null) {
  const ja = listJaVoices();
  if (voiceURI && !cloudVoiceName(voiceURI)) { const v = ja.find(x => x.voiceURI === voiceURI); if (v) return v; }
  for (const name of NAME_PREFS) { const v = ja.find(x => (x.name || '').includes(name)); if (v) return v; }
  return ja[0] || null;
}

export function ttsAvailable() { return !!globalThis.speechSynthesis; }

function speakWeb(clean, o) {
  if (!globalThis.speechSynthesis) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'ja-JP';
  u.rate = Number.isFinite(+o.rate) && +o.rate > 0 ? +o.rate : 0.85;
  u.volume = Number.isFinite(+o.volume) ? Math.max(0, Math.min(1, +o.volume)) : 1;
  const v = pickVoice(o.voiceURI || null);
  if (v) { u.voice = v; u.lang = v.lang || 'ja-JP'; }
  speechSynthesis.speak(u);
  return true;
}

/**
 * @param {string} text Japanese text
 * @param {{rate?:number, volume?:number, voiceURI?:string|null,
 *          remote?:(text:string)=>Promise<boolean>}} [o]
 *   `remote` asks the service worker to play this phrase with the learner's
 *   Google Cloud voice. Resolving false (no key, no cloud voice picked) or
 *   rejecting falls through to the web voice.
 * @returns {boolean} true when playback was started or handed to the cloud
 */
export function speak(text, o = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return false;
  const now = Date.now();
  if (clean === lastText && now - lastAt < SPEAK_DEBOUNCE_MS) return false;
  lastText = clean; lastAt = now;
  if (typeof o.remote === 'function') {
    if (globalThis.speechSynthesis) speechSynthesis.cancel();
    Promise.resolve(o.remote(clean))
      .then((played) => { if (!played) speakWeb(clean, o); })
      .catch((err) => { console.warn('Nihongo Reader: cloud voice failed, using the browser voice —', err && err.message); speakWeb(clean, o); });
    return true;
  }
  return speakWeb(clean, o);
}

/**
 * Fetch and play one clip in THIS context (extension pages only). One clip at
 * a time: `cloudGen` is bumped by every new request and every stop, so a fetch
 * that resolves after it was superseded drops its clip instead of overlapping.
 * @returns {Promise<boolean>} true when the clip started playing
 */
let cloudAudio = null, cloudGen = 0;
export async function playCloud(text, { key, voice, rate } = {}) {
  const gen = ++cloudGen;
  if (cloudAudio) { try { cloudAudio.pause(); } catch { /* already gone */ } cloudAudio = null; }
  const audioContent = await synthesize(text, { key, voice, rate });
  if (gen !== cloudGen) return false;
  const el = new Audio('data:audio/mpeg;base64,' + audioContent);
  el.onended = () => { if (cloudAudio === el) cloudAudio = null; };
  cloudAudio = el;
  await el.play();
  return true;
}
export function stopCloud() { cloudGen++; if (cloudAudio) { try { cloudAudio.pause(); } catch { /* already gone */ } cloudAudio = null; } }

/**
 * A `remote` for extension pages: plays the clip here, no service worker in
 * the way. Returns null when prefs name no cloud voice, which tells the caller
 * there is nothing to try.
 * @param {{gcloudTtsKey?:string, ttsVoiceURI?:string, ttsRate?:number}} prefs
 */
export function localRemote(prefs = {}) {
  const voice = cloudVoiceName(prefs.ttsVoiceURI);
  if (!voice || !prefs.gcloudTtsKey) return null;
  return (text) => playCloud(text, { key: prefs.gcloudTtsKey, voice, rate: prefs.ttsRate });
}

export function stop() { stopCloud(); if (globalThis.speechSynthesis) speechSynthesis.cancel(); }
