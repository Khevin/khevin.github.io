/*
 * panel/translate.js — on-demand translation shown inside the side panel
 * (Japanese on top, target language below), so an external lookup never
 * replaces the page the learner is reading. Strictly user-triggered: nothing
 * is sent anywhere until the learner clicks "translate" on a word or sentence.
 *
 * Providers:
 *   gtx    — Google Translate's public web endpoint (no key). Unofficial, so it
 *            may rate-limit or change; the UI always keeps an "open in Google
 *            Translate" link as the fallback. Also returns dictionary senses.
 *   cloud  — Google Cloud Translation v2 with the learner's own API key
 *            (prefs.translateKey), for reliability. No dictionary senses.
 * Results are cached in memory here and durably by the caller (repository).
 */

const MEM_MAX = 200;

export function retryAfterMs(value, now = Date.now()) {
  if (value && /^\d+(?:\.\d+)?$/.test(value.trim())) return Math.max(1000, Number(value) * 1000);
  const date = value ? Date.parse(value) : NaN;
  return Number.isFinite(date) && date > now ? date - now : 60_000;
}

function responseError(res, name) {
  return Object.assign(new Error(`${name} answered ${res.status}`), { status: res.status, retryAfter: res.headers?.get('Retry-After') });
}

/** Keep Cloud credentials separate from the optional no-key provider. Old installs retain their provider. */
export function translationProviderFor(prefs = {}) { return prefs.translateProvider !== 'gtx' && prefs.translateKey ? 'cloud' : 'gtx'; }

/** Cloud's 403 can mean configuration, billing or quota; status alone cannot distinguish them. */
export function parseCloudError(json, status, key = '') {
  const error = json?.error || {};
  const reasons = [...(Array.isArray(error.errors) ? error.errors : []), ...(Array.isArray(error.details) ? error.details : [])].map(x => String(x?.reason || '').toLowerCase().replace(/[^a-z]/g, ''));
  const raw = typeof error.message === 'string' ? error.message : '';
  const message = raw.toLowerCase();
  const has = (...values) => values.some(x => reasons.includes(x));
  let code = 'cloud-request', retryable = status >= 500;
  let help = `Cloud Translation could not complete this request (HTTP ${status}).`;
  if (has('dailylimitexceeded') || /daily limit|daily quota/.test(message)) {
    code = 'cloud-quota'; help = 'Cloud Translation has reached its daily quota. Check the project’s translation quota or wait for it to reset.';
  } else if (has('userratelimitexceeded', 'ratelimitexceeded') || /user rate limit|per.minute.*quota|rate limit exceeded/.test(message)) {
    code = 'cloud-rate-limited'; retryable = true; help = 'Cloud Translation is temporarily rate-limiting requests.';
  } else if (has('quotaexceeded', 'resourceexhausted') || /quota exceeded|quota has been exceeded/.test(message)) {
    code = 'cloud-quota'; help = 'Cloud Translation has reached a project quota. Check the translation quota before retrying.';
  } else if (has('servicedisabled', 'accessnotconfigured') || /has not been used.*before|api.*disabled|service.*disabled/.test(message)) {
    code = 'cloud-setup'; help = 'Cloud Translation API is not enabled for this key’s project. Enable Cloud Translation in that Google Cloud project.';
  } else if (has('billingdisabled', 'billingnotactive') || /billing.*(?:disabled|not enabled|not active|enable|required)/.test(message)) {
    code = 'cloud-setup'; help = 'Google Cloud requires active billing for this project’s translation requests. Review the project’s billing settings.';
  } else if (has('apikeyserviceblocked')) {
    code = 'cloud-setup'; help = 'This key is not allowed to use Cloud Translation. Check its API restrictions; access to speech or picture APIs does not grant translation access.';
  } else if (has('apikeyhttpreferrerblocked', 'apikeyipaddressblocked', 'iprefererblocked') || /refer(?:r)?er|ip address.*blocked/.test(message)) {
    code = 'cloud-setup'; help = 'This key’s application restrictions reject the extension’s request. Review the allowed application settings for the translation key.';
  } else if (has('apikeyinvalid', 'apikeyexpired') || /api key not valid|invalid api key|api key expired/.test(message) || status === 401) {
    code = 'cloud-setup'; help = 'Google Cloud did not accept the translation key. Check the saved Cloud Translation key in Defaults.';
  } else if (status === 403) {
    code = 'cloud-setup'; help = 'Google Cloud denied this translation request. Check Cloud Translation access, billing, key restrictions and quotas for the key’s project.';
  }
  let details = raw;
  // Error messages can echo credentials or request URLs. Never display the saved key.
  for (const secret of [key, encodeURIComponent(key)].filter(Boolean)) details = details.split(secret).join('[redacted]');
  details = details.replace(/AIza[\w-]+/g, '[redacted]').replace(/([?&]key=)[^\s&"']+/gi, '$1[redacted]').slice(0, 600);
  return Object.assign(new Error(help), { status, code, retryable, details });
}

function rateLimitError(provider, until, now) {
  const seconds = Math.max(1, Math.ceil((until - now) / 1000));
  const minutes = Math.ceil(seconds / 60);
  const wait = seconds < 60 ? `${seconds} second${seconds === 1 ? '' : 's'}` : `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const name = provider === 'cloud' ? 'Google Cloud Translation' : 'Google Translate';
  return Object.assign(new Error(`${name} is temporarily rate-limiting requests. Try again in ${wait}, or open Google Translate below.`), { code: 'rate-limited', retryAt: until });
}

export const TARGETS = { en: 'English', 'pt-BR': 'Português (Brasil)' };

export function translateUrl(text, to = 'en') {
  const u = new URL('https://translate.google.com/');
  u.searchParams.set('sl', 'ja'); u.searchParams.set('tl', to); u.searchParams.set('op', 'translate'); u.searchParams.set('text', text);
  return u.toString();
}

/**
 * Parse the gtx `dj=1` response into { translation, senses[], romaji }.
 * senses: [{ pos, terms: [] }] from the `dict` array when present.
 * @param {any} json
 */
export function parseGtx(json) {
  if (!json || typeof json !== 'object') throw new Error('unexpected translate response');
  const sentences = Array.isArray(json.sentences) ? json.sentences : [];
  const translation = sentences.map(s => s && s.trans ? s.trans : '').join('').trim();
  const romaji = sentences.map(s => s && s.src_translit ? s.src_translit : '').join('').trim() || null;
  const senses = Array.isArray(json.dict) ? json.dict.map(d => ({ pos: d.pos || '', terms: Array.isArray(d.terms) ? d.terms.slice(0, 6) : [] })).filter(d => d.terms.length) : [];
  if (!translation) throw new Error('empty translation');
  return { translation, senses, romaji };
}

async function viaGtx(text, to, fetchImpl) {
  const u = new URL('https://translate.googleapis.com/translate_a/single');
  u.searchParams.set('client', 'gtx'); u.searchParams.set('sl', 'ja'); u.searchParams.set('tl', to); u.searchParams.set('dj', '1');
  u.searchParams.append('dt', 't'); u.searchParams.append('dt', 'bd'); u.searchParams.append('dt', 'rm');
  u.searchParams.set('q', text);
  const res = await fetchImpl(u.toString(), { credentials: 'omit', signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw responseError(res, 'Google Translate');
  return { ...parseGtx(await res.json()), provider: 'gtx' };
}

async function viaCloud(text, to, key, fetchImpl) {
  const res = await fetchImpl(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'omit', signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({ q: text, source: 'ja', target: to, format: 'text' }),
  });
  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch { /* HTML or empty error: keep status-based guidance */ }
    const error = parseCloudError(body, res.status, key);
    error.retryAfter = res.headers?.get('Retry-After');
    throw error;
  }
  const json = await res.json();
  const t = json && json.data && json.data.translations && json.data.translations[0] && json.data.translations[0].translatedText;
  if (!t) throw new Error('empty Cloud Translation response');
  return { translation: t, senses: [], romaji: null, provider: 'cloud' };
}

/** Separate clocks/storage let tests verify cooldown recovery without waiting for Google's real limits. */
export function createTranslator({ now = Date.now, storage } = {}) {
  const memory = new Map(), inFlight = new Map(), cooldowns = new Map();
  const store = () => { try { return storage === undefined ? globalThis.localStorage : storage; } catch { return null; } };
  const storageKey = provider => `nihongo-reader:translation-retry:${provider}`;
  return async function translate(text, o = {}) {
    const to = TARGETS[o.to] ? o.to : 'en';
    const clean = String(text || '').trim();
    if (!clean) throw new Error('nothing to translate');
    const provider = o.key ? 'cloud' : 'gtx';
    const cacheKey = cacheKeyFor(clean, to, o.key);
    if (memory.has(cacheKey)) return memory.get(cacheKey);
    const requestKey = `${cacheKey}|${o.key || ''}`; // credentials stay in memory, never in stored cooldown keys
    if (inFlight.has(requestKey)) return inFlight.get(requestKey);
    let until = cooldowns.get(provider) || 0;
    try { until = Math.max(until, Number(store()?.getItem(storageKey(provider))) || 0); } catch { /* memory fallback */ }
    if (until > now()) throw rateLimitError(provider, until, now());
    const request = (async () => {
      try {
        const fetchImpl = o.fetchImpl || fetch;
        const result = o.key ? await viaCloud(clean, to, o.key, fetchImpl) : await viaGtx(clean, to, fetchImpl);
        if (memory.size >= MEM_MAX) memory.delete(memory.keys().next().value);
        memory.set(cacheKey, result);
        return result;
      } catch (err) {
        if (err.status !== 429 && err.code !== 'cloud-rate-limited') throw err;
        const until = Math.max(cooldowns.get(provider) || 0, now() + retryAfterMs(err.retryAfter, now()));
        cooldowns.set(provider, until);
        try { store()?.setItem(storageKey(provider), String(until)); } catch { /* memory fallback */ }
        throw rateLimitError(provider, until, now());
      }
    })();
    inFlight.set(requestKey, request);
    try { return await request; } finally { inFlight.delete(requestKey); }
  };
}

/**
 * @param {string} text Japanese
 * @param {{to?:string, key?:string|null, fetchImpl?:Function}} [o]
 * @returns {Promise<{translation:string, senses:{pos:string,terms:string[]}[], romaji:string|null, provider:string}>}
 */
export const translate = createTranslator();

export function cacheKeyFor(text, to, key) { return `${key ? 'cloud' : 'gtx'}|${TARGETS[to] ? to : 'en'}|${String(text || '').trim()}`; }
