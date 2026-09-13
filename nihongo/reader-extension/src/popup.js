/*
 * popup.js — the icon popover: master switch, per-site mute, "Study selection",
 * "Open side panel", defaults, Nihongo URL, library status. Writes `prefs` to
 * chrome.storage.local; content scripts and the panel react via onChanged.
 */
import { openRepo } from './repository.js';
import { syncLibrary } from './library-sync.js';
import { translationProviderFor } from './panel/translate.js';
import { GCLOUD_VOICES, CLOUD_PREFIX, listJaVoices, cloudVoiceName, localRemote, voiceErrorKind, firstUrl, speak } from './panel/tts.js';
import { read as readUsage, summarize, overCap } from './panel/usage.js';

const PROTOCOL_VERSION = 1;
const DEFAULT_PREFS = { enabled: true, level: 'words', romaji: false, furigana: false, appUrl: 'https://khevin.com/nihongo/app.html', mutedHosts: [], ttsRate: 0.85, ttsVoiceURI: null, translateTo: 'en', translateKey: null, imagesKey: null, imagesCx: null, pixabayKey: null, gcloudTtsKey: null };
const $ = (id) => document.getElementById(id);
let prefs = { ...DEFAULT_PREFS };
let tab = null;
let host = null;

const TEST_PHRASE = '日本語';
const CREDENTIALS_URL = 'https://console.cloud.google.com/apis/credentials';

/** Google's own words, then one line saying what to do about them. */
function voiceFailureHTML(message) {
  const kind = voiceErrorKind(message);
  const link = (href, text) => `<a href="${escH(href)}" target="_blank" rel="noopener">${escH(text)}</a>`;
  const url = firstUrl(message);
  const advice = {
    billing: `Cloud Text-to-Speech needs billing on the project, even inside the free monthly characters. ${url ? link(url, 'Enable billing') + ', then' : 'After enabling it,'} wait a minute or two and press Test voice again.`,
    disabled: `Turn the API on for this project: ${link(url || 'https://console.cloud.google.com/apis/library/texttospeech.googleapis.com', 'enable Cloud Text-to-Speech')}, then try again.`,
    referrer: `The key is restricted to websites, so it refuses this extension. In ${link(CREDENTIALS_URL, 'Credentials')}, add <code>chrome-extension://${escH(chrome.runtime.id)}</code> to its allowed referrers, or use an unrestricted key.`,
    key: `That key is not valid for the project holding the API. Copy it again from ${link(CREDENTIALS_URL, 'Credentials')}.`,
    quota: 'The project is out of Text-to-Speech quota for now. Listen keeps working with the browser voice.',
    other: '',
  };
  return `Voice failed: ${escH(message)}${advice[kind] ? '<br>' + advice[kind] : ''}`;
}

/**
 * The app keeps its key in localStorage under jp:gcloudTtsKey, per origin, so
 * it can only be read from a tab already showing the app. Runs on an explicit
 * click and copies nothing else.
 */
async function importAppKey() {
  let origin = null;
  try { origin = new URL(prefs.appUrl || DEFAULT_PREFS.appUrl).origin; } catch { /* fall through to any nihongo tab */ }
  const tabs = await chrome.tabs.query({});
  const candidates = tabs.filter(t => t.url && (/\/nihongo\//.test(t.url) || (origin && t.url.startsWith(origin))));
  for (const t of candidates) {
    try {
      const [hit] = await chrome.scripting.executeScript({ target: { tabId: t.id }, func: () => { try { return localStorage.getItem('jp:gcloudTtsKey'); } catch { return null; } } });
      if (hit && hit.result) return String(hit.result).trim();
    } catch { /* restricted tab, try the next */ }
  }
  return null;
}

async function librarySummary() {
  const repo = await openRepo();
  try {
    const lib = await repo.getActiveLibrary();
    const src = await repo.getMeta('librarySource').catch(() => null);
    return lib ? `library: ${lib.cards.length} cards · revision ${lib.manifest.revision}${src ? (src.source === 'site' ? ' · from ' + src.host : ' · bundled') : ''}` : 'library: not loaded';
  } finally { repo.close(); }
}

async function save(partial) {
  const latest = await chrome.storage.local.get('prefs');
  prefs = { ...DEFAULT_PREFS, ...(latest.prefs || prefs), ...partial };
  await chrome.storage.local.set({ prefs });
  render();
}

function render() {
  $('version').textContent = `v${__READER_VERSION__}`;
  $('enabled').checked = !!prefs.enabled;
  $('hint').textContent = prefs.enabled ? 'Select Japanese text on any page and tap the 札 button that appears.' : 'Off. Turn the switch on to read pages with Nihongo.';
  $('lvl-words').setAttribute('aria-pressed', String(prefs.level !== 'phrases'));
  $('lvl-phrases').setAttribute('aria-pressed', String(prefs.level === 'phrases'));
  $('romaji').checked = !!prefs.romaji;
  $('furigana').checked = !!prefs.furigana;
  $('translateTo').value = prefs.translateTo || 'en';
  $('translateProvider').value = translationProviderFor(prefs);
  $('translateProvider').querySelector('[value="cloud"]').disabled = !prefs.translateKey;
  if (document.activeElement !== $('pixabayKey')) $('pixabayKey').value = prefs.pixabayKey || '';
  if (document.activeElement !== $('imagesKey')) $('imagesKey').value = prefs.imagesKey || '';
  if (document.activeElement !== $('imagesCx')) $('imagesCx').value = prefs.imagesCx || '';
  if (document.activeElement !== $('translateKey')) $('translateKey').value = prefs.translateKey || '';
  if (document.activeElement !== $('gcloudTtsKey')) $('gcloudTtsKey').value = prefs.gcloudTtsKey || '';
  renderVoices();
  $('ttsRate').value = String(prefs.ttsRate ?? 0.85); $('ttsRateOut').textContent = (+(prefs.ttsRate ?? 0.85)).toFixed(2);
  if (document.activeElement !== $('appUrl')) $('appUrl').value = prefs.appUrl || '';
  $('host').textContent = host || 'this site';
  $('mute').checked = !!(host && (prefs.mutedHosts || []).includes(host));
  $('mute').disabled = !host;
  $('study').disabled = !tab || !prefs.enabled;
}

const escH = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Auto + the app's five cloud voices (only with a key) + this device's ja voices. */
function renderVoices() {
  const sel = $('ttsVoice');
  const ja = listJaVoices();
  const cloud = prefs.gcloudTtsKey ? `<optgroup label="Google Cloud · neural (Translate quality)">${GCLOUD_VOICES.map(v => `<option value="${CLOUD_PREFIX}${escH(v.id)}">${escH(v.label)}</option>`).join('')}</optgroup>` : '';
  const web = ja.length ? `<optgroup label="Browser voices">${ja.map(v => `<option value="${escH(v.voiceURI)}">${escH(v.name)} · ${v.localService ? 'local' : 'cloud'}</option>`).join('')}</optgroup>` : '';
  sel.innerHTML = `<option value="">Auto (best available)</option>${cloud}${web}`;
  sel.value = prefs.ttsVoiceURI || '';
  if (sel.value !== (prefs.ttsVoiceURI || '')) sel.value = '';   // stored voice not on this device
  $('ttsTest').disabled = !cloudVoiceName(prefs.ttsVoiceURI) && !ja.length;
}

/**
 * The popover and the panel read their files from disk every time they open,
 * but an unpacked extension keeps running the service worker it started with.
 * After a rebuild that worker can be older than this page and answer nothing —
 * which is what "the extension did not answer" used to mean. Ask it once, and
 * say plainly what to do about it.
 */
let workerStale = false;
async function checkWorker() {
  try {
    const r = await chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `pi-${Date.now()}`, type: 'PING', payload: {} });
    workerStale = !(r && r.ok && r.speak);
  } catch { workerStale = true; }
  if (workerStale) $('ttsHint').innerHTML = 'The background worker is running an older build, so Listen on the page bar will use the browser voice. Open <b>chrome://extensions</b> and press Reload on Nihongo Reader. The side panel and this Test already use your Cloud voice.';
}

/** What today actually cost, next to the keys that pay for it. */
async function showUsage() {
  const el = $('usage');
  if (!el) return;
  const usage = await readUsage();
  el.textContent = summarize(usage);
  el.classList.toggle('over', overCap(usage));
}

async function boot() {
  const r = await chrome.storage.local.get('prefs');
  prefs = { ...DEFAULT_PREFS, ...(r.prefs || {}) };
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try { host = tab && tab.url ? new URL(tab.url).hostname : null; } catch { host = null; }
  if (host && !/^https?:$/.test(new URL(tab.url).protocol)) host = null;
  render();
  checkWorker();
  showUsage();
  try {
    const summary = await librarySummary();
    $('lib').innerHTML = '<span id="libSummary"></span> <button class="btn mini" id="syncLib">Check for updates</button>';
    $('libSummary').textContent = summary;
  } catch { $('lib').textContent = 'library: storage unavailable'; }
  const syncBtn = $('syncLib');
  if (syncBtn) syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true; syncBtn.textContent = 'checking…';
    try {
      const r = await syncLibrary({ appUrl: prefs.appUrl || DEFAULT_PREFS.appUrl, bundledBase: chrome.runtime.getURL('library/'), force: true, onStatus: (s) => { syncBtn.textContent = s.length > 28 ? s.slice(0, 26) + '…' : s; } });
      syncBtn.textContent = r.action === 'imported' ? `updated ✓ revision ${r.manifest.revision}` : (r.error ? 'Try update check again' : r.notice ? 'Saved library ready' : 'up to date ✓');
      $('hint').textContent = r.error || r.notice || (r.action === 'imported' ? `Library updated from ${r.source === 'bundled' ? 'this extension build' : 'your Nihongo site'}.` : 'Your library is up to date.');
      $('libSummary').textContent = await librarySummary();
    } catch (err) { syncBtn.textContent = 'check failed'; $('hint').textContent = err.message; }
    finally { syncBtn.disabled = false; }
  });

  $('enabled').addEventListener('change', (e) => save({ enabled: e.target.checked }));
  $('romaji').addEventListener('change', (e) => save({ romaji: e.target.checked }));
  $('furigana').addEventListener('change', (e) => save({ furigana: e.target.checked }));
  $('translateTo').addEventListener('change', (e) => save({ translateTo: e.target.value }));
  $('translateProvider').addEventListener('change', (e) => save({ translateProvider: e.target.value }));
  $('pixabayKey').addEventListener('change', (e) => save({ pixabayKey: e.target.value.trim() || null }));
  $('imagesKey').addEventListener('change', (e) => save({ imagesKey: e.target.value.trim() || null }));
  $('imagesCx').addEventListener('change', (e) => save({ imagesCx: e.target.value.trim() || null }));
  $('translateKey').addEventListener('change', (e) => { const key = e.target.value.trim() || null; save({ translateKey: key, translateProvider: key ? 'cloud' : 'gtx' }); });
  $('gcloudTtsKey').addEventListener('change', (e) => save({ gcloudTtsKey: e.target.value.trim() || null }));
  $('ttsVoice').addEventListener('change', (e) => save({ ttsVoiceURI: e.target.value || null }));
  $('ttsTest').addEventListener('click', async () => {
    const btn = $('ttsTest'); btn.disabled = true; const was = btn.textContent; btn.textContent = 'speaking…';
    const name = cloudVoiceName(prefs.ttsVoiceURI);
    try {
      if (name) {
        const play = localRemote({ gcloudTtsKey: prefs.gcloudTtsKey, ttsVoiceURI: prefs.ttsVoiceURI, ttsRate: prefs.ttsRate });
        if (!play) throw new Error('No Google Cloud key set');
        await play(TEST_PHRASE);
        $('ttsHint').textContent = `${name} spoke 「${TEST_PHRASE}」.${workerStale ? ' The in-page bar still needs a reload (below).' : ''}`;
      } else {
        speak(TEST_PHRASE, { rate: prefs.ttsRate ?? 0.85, voiceURI: prefs.ttsVoiceURI || null });
        $('ttsHint').textContent = 'Browser voice. Add a key and pick a Google Cloud voice for Translate quality.';
      }
    } catch (err) { $('ttsHint').innerHTML = voiceFailureHTML(err.message); }
    finally { btn.textContent = was; btn.disabled = false; }
  });
  $('ttsImport').addEventListener('click', async () => {
    const btn = $('ttsImport'); btn.disabled = true; const was = btn.textContent; btn.textContent = 'looking…';
    try {
      const key = await importAppKey();
      if (key) { await save({ gcloudTtsKey: key }); $('ttsHint').textContent = 'Key copied from the Nihongo app.'; }
      else $('ttsHint').textContent = 'Open your Nihongo app in a tab first — the key lives in that page, not in the extension.';
    } catch (err) { $('ttsHint').textContent = `Could not read the app: ${err.message}`; }
    finally { btn.textContent = was; btn.disabled = false; }
  });
  $('ttsRate').addEventListener('input', (e) => { $('ttsRateOut').textContent = (+e.target.value).toFixed(2); });
  $('ttsRate').addEventListener('change', (e) => save({ ttsRate: +e.target.value }));
  $('lvl-words').addEventListener('click', () => save({ level: 'words' }));
  $('lvl-phrases').addEventListener('click', () => save({ level: 'phrases' }));
  $('appUrl').addEventListener('change', (e) => { const v = e.target.value.trim(); save({ appUrl: /^https?:\/\//.test(v) ? v : DEFAULT_PREFS.appUrl }); });
  $('mute').addEventListener('change', (e) => { if (!host) return; const set = new Set(prefs.mutedHosts || []); e.target.checked ? set.add(host) : set.delete(host); save({ mutedHosts: [...set] }); });
  $('study').addEventListener('click', async () => {
    if (!tab) return;
    try { await chrome.tabs.sendMessage(tab.id, { protocolVersion: PROTOCOL_VERSION, requestId: `pop-${Date.now()}`, type: 'STUDY_SELECTION', payload: {} }); window.close(); }
    catch { $('hint').textContent = 'This page cannot be read here (restricted page or not loaded yet). Reload it and try again.'; }
  });
  $('panel').addEventListener('click', async () => {
    if (!tab) return;
    try { await chrome.sidePanel.open({ tabId: tab.id }); window.close(); }
    catch (err) { $('hint').textContent = `Could not open the side panel: ${err.message}`; }
  });
}
document.addEventListener('DOMContentLoaded', boot);
