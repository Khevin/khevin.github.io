/*
 * library-sync.js — keeps the learner's card library current without a manual
 * import. Two sources, same package format, same preflight as a ZIP import:
 *
 *   bundled  chrome-extension://<id>/library/   (copied into dist at build time; first run, offline)
 *   site     <Nihongo origin>/reader-library/   (manifest + cards + glossary JSON committed with the
 *            app; images fetched from the site's own images/ paths via `sourcePath`, sha256-verified)
 *
 * A snapshot is imported once (content-addressed snapshotId); a newer `revision`
 * on the site replaces the active snapshot atomically (repository.importLibrary),
 * never touching encounter history or familiarity. Used by the service worker
 * (install/startup), the side panel (boot) and the popup ("Check for updates").
 */
import { openRepo } from './repository.js';
import { preflightPackage } from '../../reader-core/library.js';

const enc = (o) => new TextEncoder().encode(typeof o === 'string' ? o : JSON.stringify(o));
const PARALLEL = 6;

/** URL of an asset when the package lives on the Nihongo site (images/ paths, segments encoded). */
export const siteAssetUrl = (rec, base) => rec.sourcePath ? new URL(rec.sourcePath.split('/').map(encodeURIComponent).join('/'), new URL('..', base)) : null;
/** URL of an asset when the package is the bundled copy (assets/<hash>.<ext> next to the manifest). */
export const bundledAssetUrl = (rec, base) => new URL(rec.path, base);

async function fetchBytes(url) {
  const res = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function readManifest(base) {
  const url = new URL('manifest.json', base);
  try {
    const res = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return { manifest: null, code: res.status === 404 ? 'not-published' : 'http', error: `HTTP ${res.status} at ${url}` };
    let m;
    try { m = await res.json(); } catch { return { manifest: null, code: 'invalid', error: `Expected a JSON library manifest at ${url}` }; }
    return m && m.snapshotId && m.libraryId ? { manifest: m } : { manifest: null, code: 'invalid', error: `Invalid library manifest at ${url}` };
  } catch (err) { return { manifest: null, code: 'network', error: `Could not reach ${url}: ${err.message}` }; }
}

export async function peekManifest(base) { return (await readManifest(base)).manifest; }

/**
 * Fetch a whole package into the Map shape preflightPackage expects.
 * @param {URL|string} base directory URL ending in '/'
 * @param {(rec:object, base:URL)=>URL|null} assetUrlFor
 * @param {(p:{done:number,total:number})=>void} [onProgress]
 */
export async function fetchPackage(base, assetUrlFor, onProgress) {
  const b = new URL(String(base));
  const manifest = await peekManifest(b);
  if (!manifest) throw new Error(`no manifest at ${b}`);
  const files = new Map();
  files.set('manifest.json', enc(manifest));
  for (const f of Object.values(manifest.files || {})) if (f) files.set(f, await fetchBytes(new URL(f, b)));
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  let done = 0;
  const queue = [...assets];
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (queue.length) {
      const rec = queue.shift();
      const url = assetUrlFor(rec, b);
      if (!url) throw new Error(`no source for asset ${rec.path}`);
      files.set(rec.path, await fetchBytes(url));
      done++; onProgress && onProgress({ done, total: assets.length });
    }
  }));
  return { manifest, files };
}

/**
 * Decide whether `remote` should replace `active` (manifests). Same library,
 * different snapshot, revision not older → yes. Different library id → yes
 * when nothing is active. Never downgrade silently.
 */
export function shouldReplace(active, remote) {
  if (!remote) return false;
  if (!active) return true;
  if (active.libraryId !== remote.libraryId) return false;
  if (active.snapshotId === remote.snapshotId) return false;
  return (remote.revision || 0) >= (active.revision || 0);
}

/**
 * Import from a base URL through the shared preflight; returns the result or throws.
 */
export async function importFrom(repo, base, assetUrlFor, onProgress) {
  const { files } = await fetchPackage(base, assetUrlFor, (p) => onProgress && onProgress({ phase: 'fetch', ...p }));
  const pre = await preflightPackage(files);
  if (!pre.ok) throw new Error(`package rejected: ${pre.errors.slice(0, 3).join(' · ')}`);
  const r = await repo.importLibrary(pre, { onProgress });
  return { ...r, manifest: pre.manifest, cards: pre.cards.length };
}

/**
 * Make sure a library is present and current.
 * @param {{appUrl?:string|null, bundledBase?:string|URL|null, force?:boolean, onStatus?:(s:string)=>void}} o
 * @returns {Promise<{action:'none'|'imported', source?:'bundled'|'site', manifest:object|null, error?:string, notice?:string, remoteStatus?:string}>}
 */
export async function syncLibrary(o = {}) {
  const status = (s) => { try { o.onStatus && o.onStatus(s); } catch { /* ignore */ } };
  const repo = await openRepo();
  try {
    const activeLib = await repo.getActiveLibrary();
    let active = activeLib ? activeLib.manifest : null;
    let action = 'none', source, error, notice, remoteStatus;

    if (o.bundledBase) {
      const bundled = await peekManifest(o.bundledBase);
      if (!active || shouldReplace(active, bundled)) {
        status('loading the bundled Nihongo library…');
        try {
          const r = await importFrom(repo, o.bundledBase, bundledAssetUrl, (p) => p.phase === 'fetch' && status(`loading bundled library ${p.done}/${p.total}…`));
          active = r.manifest; action = 'imported'; source = 'bundled';
        } catch (e) { error = `bundled: ${e.message}`; }
      }
    }

    if (o.appUrl) {
      let base = null;
      try { base = new URL('reader-library/', new URL('.', o.appUrl)); } catch { error = 'Invalid Nihongo URL. Set the full app URL in Defaults.'; }
      if (base) {
        const remoteRead = await readManifest(base);
        const remote = remoteRead.manifest;
        remoteStatus = remote ? 'available' : remoteRead.code;
        // Force means "check now", never "discard the learner's newer or
        // unrelated library". Revision/identity rules apply to every check.
        if (remote && shouldReplace(active, remote)) {
          status(`updating library from ${base.hostname} (revision ${remote.revision})…`);
          try {
            const r = await importFrom(repo, base, siteAssetUrl, (p) => p.phase === 'fetch' && status(`downloading pictures ${p.done}/${p.total}…`));
            active = r.manifest; action = 'imported'; source = 'site';
            await repo.setMeta('librarySource', { source: 'site', host: base.hostname, revision: active.revision, at: new Date().toISOString() });
          } catch (e) { error = (error ? error + ' · ' : '') + `site: ${e.message}`; }
        } else if (!remote && remoteRead.code === 'not-published' && active) {
          notice = `Online library updates are not published at ${base.hostname} yet. Your saved library is ready to use. Reload a newer extension build or import a library ZIP to update locally.`;
        } else if (!remote) {
          error = (error ? error + ' · ' : '') + `site: ${remoteRead.error}`;
        }
      }
    }
    if (action === 'imported' && source === 'bundled') await repo.setMeta('librarySource', { source: 'bundled', revision: active.revision, at: new Date().toISOString() });
    return { action, source, manifest: active, error, notice, remoteStatus };
  } finally { repo.close(); }
}

/** Throttle helper: true when the last check is older than `ms`. */
export function dueSince(lastIso, ms) { const t = lastIso ? Date.parse(lastIso) : 0; return !t || Date.now() - t > ms; }
