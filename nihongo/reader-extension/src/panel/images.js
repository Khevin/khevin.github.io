/*
 * panel/images.js — picture lookup for a selected word, shown as a small
 * gallery under the translation ("what does 広がる look like?").
 *
 * Providers (first one whose key is present wins):
 *   pixabay    Pixabay API — photos + illustrations, accepts lang=ja so Japanese
 *              words search natively. Free key, 100 requests/min. Owner's first choice.
 *   google     Google Programmable Search Engine, Custom Search JSON API with
 *              searchType=image — the real Google Images results. Needs the
 *              learner's API key + search-engine id (cx); 100 free queries/day.
 *   wikimedia  Wikimedia Commons search (free, no key, CORS-enabled). Weaker
 *              for Japanese words, so it is the fallback, clearly labelled.
 * Strictly user-triggered (the learner asked to translate/see a word). Results
 * are cached by the caller. The "open in Google Images" link is always offered.
 */

export const GALLERY_MAX = 15;

export function googleImagesUrl(q) {
  const u = new URL('https://www.google.com/search');
  u.searchParams.set('tbm', 'isch'); u.searchParams.set('hl', 'ja'); u.searchParams.set('q', q);
  return u.toString();
}

export function providerFor(prefs = {}) { return prefs.pixabayKey ? 'pixabay' : prefs.imagesKey && prefs.imagesCx ? 'google' : 'wikimedia'; }
export const PROVIDER_LABEL = { pixabay: 'Pixabay', google: 'Google Images', wikimedia: 'Wikimedia Commons' };

/** Parse a Pixabay `hits` response; `start` is the 1-based index of the first hit requested. */
export function parsePixabay(json, start = 1) {
  const hits = Array.isArray(json && json.hits) ? json.hits : [];
  const items = hits.filter(h => h && h.previewURL).map(h => ({
    thumb: h.previewURL, url: h.largeImageURL || h.webformatURL || h.previewURL, page: h.pageURL || h.webformatURL, title: h.tags || '',
    w: h.imageWidth || null, h: h.imageHeight || null, tw: h.previewWidth || null, th: h.previewHeight || null,
  }));
  const seen = start - 1 + hits.length;
  const total = Number(json && json.totalHits) || 0;
  return { items, nextStart: hits.length && seen < total ? seen + 1 : null };
}

/** Parse a Custom Search image response into gallery items. */
export function parseGoogle(json) {
  const items = Array.isArray(json && json.items) ? json.items : [];
  const out = items.filter(i => i && i.image && i.image.thumbnailLink).map(i => ({
    thumb: i.image.thumbnailLink, url: i.link, page: i.image.contextLink || i.link, title: i.title || '',
    w: i.image.width || null, h: i.image.height || null, tw: i.image.thumbnailWidth || null, th: i.image.thumbnailHeight || null,
  }));
  const next = json && json.queries && json.queries.nextPage && json.queries.nextPage[0] ? json.queries.nextPage[0].startIndex : null;
  return { items: out, nextStart: next };
}

/** Parse a Commons API response (generator=search, prop=imageinfo with iiurlwidth). */
export function parseWikimedia(json) {
  const pages = json && json.query && json.query.pages ? Object.values(json.query.pages) : [];
  const out = [];
  for (const p of pages.sort((a, b) => (a.index || 0) - (b.index || 0))) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !ii.thumburl) continue;
    if (ii.mime && !/^image\/(jpeg|png|webp|gif)$/.test(ii.mime)) continue;
    out.push({ thumb: ii.thumburl, url: ii.url, page: ii.descriptionurl || ii.url, title: String(p.title || '').replace(/^File:/, ''), w: ii.width || null, h: ii.height || null, tw: ii.thumbwidth || null, th: ii.thumbheight || null });
  }
  return { items: out, nextStart: json && json.continue && json.continue.gsroffset ? json.continue.gsroffset + 1 : null };
}

/**
 * @param {string} q
 * @param {{provider?:'google'|'wikimedia', key?:string, cx?:string, start?:number, num?:number}} o
 * @returns {Promise<{provider:string, items:object[], nextStart:number|null}>}
 */
export async function searchImages(q, o = {}) {
  const query = String(q || '').trim();
  if (!query) throw new Error('nothing to search');
  const provider = o.provider || providerFor({ pixabayKey: o.pixabayKey, imagesKey: o.key, imagesCx: o.cx });
  const num = Math.max(1, Math.min(10, o.num || 10));
  if (provider === 'pixabay') {
    const per = Math.max(3, num);                         // Pixabay's minimum per_page is 3
    const page = Math.floor(((o.start || 1) - 1) / per) + 1;
    const u = new URL('https://pixabay.com/api/');
    u.searchParams.set('key', o.pixabayKey); u.searchParams.set('q', query); u.searchParams.set('lang', 'ja');
    u.searchParams.set('image_type', 'all'); u.searchParams.set('safesearch', 'true'); u.searchParams.set('per_page', String(per)); u.searchParams.set('page', String(page));
    const res = await fetch(u.toString(), { credentials: 'omit', signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(res.status === 400 ? 'Pixabay rejected the key or query' : res.status === 429 ? 'Pixabay rate limit reached, try again in a minute' : `Pixabay answered ${res.status}`);
    return { provider, ...parsePixabay(await res.json(), (page - 1) * per + 1) };
  }
  if (provider === 'google') {
    const u = new URL('https://www.googleapis.com/customsearch/v1');
    u.searchParams.set('key', o.key); u.searchParams.set('cx', o.cx); u.searchParams.set('searchType', 'image');
    u.searchParams.set('q', query); u.searchParams.set('num', String(num)); u.searchParams.set('start', String(o.start || 1));
    u.searchParams.set('safe', 'active'); u.searchParams.set('hl', 'ja');
    const res = await fetch(u.toString(), { credentials: 'omit', signal: AbortSignal.timeout(15_000) });
    if (!res.ok) { let msg = `Google image search answered ${res.status}`; try { const j = await res.json(); if (j.error && j.error.message) msg += `: ${j.error.message}`; } catch { /* ignore */ } throw new Error(msg); }
    return { provider, ...parseGoogle(await res.json()) };
  }
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.searchParams.set('action', 'query'); u.searchParams.set('format', 'json'); u.searchParams.set('origin', '*');
  u.searchParams.set('generator', 'search'); u.searchParams.set('gsrnamespace', '6'); u.searchParams.set('gsrlimit', String(num));
  u.searchParams.set('gsroffset', String((o.start || 1) - 1)); u.searchParams.set('gsrsearch', `filetype:bitmap ${query}`);
  u.searchParams.set('prop', 'imageinfo'); u.searchParams.set('iiprop', 'url|mime|size'); u.searchParams.set('iiurlwidth', '240');
  const res = await fetch(u.toString(), { credentials: 'omit', signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Wikimedia Commons answered ${res.status}`);
  return { provider, ...parseWikimedia(await res.json()) };
}
