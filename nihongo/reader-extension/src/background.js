/*
 * background.js — extension service worker. Listeners are registered at top
 * level; every handler reconstructs what it needs from storage, because Chrome
 * may terminate this worker at any time.
 *
 * Responsibilities: route analysis requests from the in-page bar and the panel
 * to the offscreen document (one dictionary for everything), keep the current
 * capture per tab in chrome.storage.session so the panel can mirror it, own
 * study commits (study-commit.js), open the side panel on request, and serve
 * the keyboard command.
 */
import { commitStudy, endSession, ensureInstallationId, chromeKv } from './study-commit.js';
import { syncLibrary, dueSince } from './library-sync.js';
import { cloudVoiceName } from './panel/tts.js';

const PROTOCOL_VERSION = 1;
const PANEL_ORIGIN = `chrome-extension://${chrome.runtime.id}`;
const OFFSCREEN_URL = 'offscreen.html';
const DEFAULT_PREFS = { enabled: true, level: 'words', romaji: false, appUrl: 'https://khevin.com/nihongo/app.html', mutedHosts: [], ttsRate: 0.85, ttsVoiceURI: null, gcloudTtsKey: null };
const LIBRARY_CHECK_MS = 6 * 60 * 60 * 1000;

/** Bundled library on first run, then the site's newer revision if any. Throttled unless forced. */
async function syncLibraryNow({ force = false } = {}) {
  const { prefs, librarySyncAt } = await chrome.storage.local.get(['prefs', 'librarySyncAt']);
  if (!force && !dueSince(librarySyncAt, LIBRARY_CHECK_MS)) return null;
  await chrome.storage.local.set({ librarySyncAt: new Date().toISOString() });
  try {
    const r = await syncLibrary({ appUrl: (prefs && prefs.appUrl) || DEFAULT_PREFS.appUrl, bundledBase: chrome.runtime.getURL('library/') });
    if (r.error) console.warn('library sync:', r.error);
    return r;
  } catch (err) { console.warn('library sync failed', err && err.message); return null; }
}
let creating = null;

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  await ensureInstallationId(chromeKv());
  const { prefs } = await chrome.storage.local.get('prefs');
  if (!prefs) await chrome.storage.local.set({ prefs: DEFAULT_PREFS });
  // Chrome injects declared content scripts only into pages loaded after (re)install.
  // Inject into the tabs that are already open so the FAB works without a refresh.
  try {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    await Promise.all(tabs.map(t => chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['content.js'] }).catch(() => {})));
  } catch (err) { console.warn('content script injection into open tabs failed', err && err.message); }
  await syncLibraryNow({ force: true });
});

chrome.runtime.onStartup.addListener(() => { syncLibraryNow(); });

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'study-selection') return;
  const target = tab && tab.id != null ? tab : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (!target || target.id == null) return;
  try { await chrome.tabs.sendMessage(target.id, { protocolVersion: PROTOCOL_VERSION, requestId: `cmd-${Date.now()}`, type: 'STUDY_SELECTION', payload: {} }); }
  catch (err) { console.warn('study-selection: no content script in tab', err && err.message); }
});

// ── offscreen analysis host ─────────────────────────────────────────────────
async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (contexts.length) return;
  if (!creating) {
    creating = chrome.offscreen.createDocument({ url: OFFSCREEN_URL, reasons: ['WORKERS', 'AUDIO_PLAYBACK'], justification: 'Runs the Japanese tokenizer in a Web Worker shared by the in-page bar and the side panel, and plays Google Cloud text-to-speech clips for Listen.' })
      .catch((err) => { if (!/single offscreen|already exists/i.test(String(err && err.message))) throw err; })
      .finally(() => { creating = null; });
  }
  await creating;
}
/**
 * Listen, cloud path. The key never leaves the service worker and the
 * offscreen document: a host page's CSP would block both the fetch and the
 * data: audio, and the in-page bar has no business holding the learner's key.
 * Resolves { played:false } when no cloud voice is configured, which tells the
 * caller to use its own web voice.
 */
async function speakCloud(payload, strict) {
  const { prefs } = await chrome.storage.local.get('prefs');
  const p = { ...DEFAULT_PREFS, ...(prefs || {}) };
  const voice = cloudVoiceName(p.ttsVoiceURI);
  if (!p.gcloudTtsKey || !voice) {
    if (strict) throw new Error(!p.gcloudTtsKey ? 'No Google Cloud key set' : 'Pick a Google Cloud voice to test');
    return { played: false, reason: 'no-cloud-voice' };
  }
  await ensureOffscreen();
  const r = await chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `sp-${Date.now()}`, type: 'SPEAK', target: 'offscreen', payload: { text: payload.text, voice, rate: p.ttsRate ?? 0.85, key: p.gcloudTtsKey } });
  if (!r || !r.ok) {
    const error = r ? r.error : 'offscreen document did not answer';
    if (strict) throw new Error(error);
    console.warn('Nihongo Reader: cloud voice failed —', error);
    return { played: false, error };
  }
  return { played: r.played !== false, voice };
}

async function analyze(text) {
  await ensureOffscreen();
  const r = await chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `an-${Date.now()}`, type: 'ANALYZE', target: 'offscreen', payload: { text } });
  if (!r || !r.ok) throw new Error(r ? r.error : 'offscreen document did not answer');
  return r.result;
}

// ── messages ────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.protocolVersion !== PROTOCOL_VERSION || msg.target === 'offscreen') return false;
  const fromTab = sender.tab && sender.tab.id != null;
  const fromPanel = sender.url && sender.url.startsWith(PANEL_ORIGIN);
  const reply = (p) => p.then((r) => sendResponse({ ok: true, ...r })).catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));

  if (msg.type === 'STUDY_REQUEST' && fromTab) {
    const tabId = sender.tab.id;
    reply((async () => {
      const p = msg.payload;
      await chrome.storage.session.set({ [`capture:${tabId}`]: { captureId: p.captureId, tabId, status: 'ready', payload: { captureKind: p.captureKind, sentences: p.sentences, source: p.source }, at: new Date().toISOString() }, 'capture:latestTab': tabId });
      const analysis = await analyze(p.sentences[0].text);
      return { analysis };
    })());
    return true;
  }
  if ((msg.type === 'ANALYZE_SENTENCE' || msg.type === 'ANALYZE_TEXT') && (fromTab || fromPanel)) {
    reply(analyze(msg.payload.text).then((analysis) => ({ analysis })));
    return true;
  }
  if (msg.type === 'SENTENCE_SHOWN' && fromTab) {
    reply(commitStudy(msg.payload, chromeKv()));
    return true;
  }
  if (msg.type === 'STUDY_SENTENCE' && fromPanel) {
    reply(commitStudy(msg.payload, chromeKv()));
    return true;
  }
  if (msg.type === 'OPEN_DETAILS' && fromTab) {
    const tabId = sender.tab.id;
    const p = msg.payload;
    // The user gesture from the bar tap only lasts until the first await: open the panel FIRST, then persist the focus.
    const opening = chrome.sidePanel.open({ tabId }).then(() => ({ opened: true }))
      .catch((err) => ({ opened: false, reason: /gesture/i.test(String(err && err.message)) ? 'gesture' : 'error', error: String(err && err.message) }));
    reply((async () => {
      await chrome.storage.session.set({
        [`capture:${tabId}`]: { captureId: p.captureId, tabId, status: 'ready', payload: { captureKind: p.captureKind, sentences: p.sentences, source: p.source }, at: new Date().toISOString() },
        [`focus:${tabId}`]: { captureId: p.captureId, index: p.index, tokenIds: p.tokenIds || [], at: Date.now() },
        'capture:latestTab': tabId,
      });
      return opening;
    })());
    return true;
  }
  if (msg.type === 'PING') {
    // Proves this worker is the build that shipped with the pages asking it.
    sendResponse({ ok: true, speak: true, version: chrome.runtime.getManifest().version });
    return false;
  }
  if (msg.type === 'SPEAK' && (fromTab || fromPanel || (sender.url && sender.url.startsWith(PANEL_ORIGIN)))) {
    reply(speakCloud(msg.payload || {}, !!(msg.payload && msg.payload.strict)));
    return true;
  }
  if (msg.type === 'STOP_SPEAK') {
    reply((async () => {
      const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
      if (!contexts.length) return { stopped: false };
      await chrome.runtime.sendMessage({ protocolVersion: PROTOCOL_VERSION, requestId: `st-${Date.now()}`, type: 'STOP_SPEAK', target: 'offscreen', payload: {} });
      return { stopped: true };
    })());
    return true;
  }
  if (msg.type === 'SYNC_LIBRARY' && (fromPanel || (sender.url && sender.url.startsWith(PANEL_ORIGIN)))) {
    reply(syncLibraryNow({ force: !!(msg.payload && msg.payload.force) }).then((r) => ({ result: r })));
    return true;
  }
  if (msg.type === 'SESSION_END' && fromPanel) {
    reply(endSession(chromeKv()).then((s) => ({ session: s })));
    return true;
  }
  return false;
});
