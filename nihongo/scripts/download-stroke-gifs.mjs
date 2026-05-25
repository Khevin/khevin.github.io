#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// download-stroke-gifs.mjs
//
// Fetches kanji stroke-order GIFs from Wiktionary (Wikimedia Commons)
// and saves them locally under nihongo/images/stroke/<kanji>-order.gif
// so the flashcard back face can render them without hotlinking.
//
// Usage:
//   node scripts/download-stroke-gifs.mjs              # downloads ALL flashcard kanji
//   node scripts/download-stroke-gifs.mjs --jouyou     # downloads ALL ~2,131 jouyou kanji
//                                                       (reads scripts/jouyou-kanji.txt)
//   node scripts/download-stroke-gifs.mjs --limit=20   # demo set (first 20)
//   node scripts/download-stroke-gifs.mjs --only=本,木  # specific list
//   node scripts/download-stroke-gifs.mjs --dry        # show what would download, no writes
//   node scripts/download-stroke-gifs.mjs --force      # re-download even if already on disk
//
// Politeness:
//   1 request/sec (Wikimedia API rate-limit-friendly), no parallel fetches.
//   Sets a User-Agent identifying the project + a contact e-mail —
//   Wikimedia asks scripts to do this so abusive scripts can be tracked.
//
// License:
//   Stroke-order GIFs on Commons are typically CC BY-SA 3.0. Each file
//   page may carry its own license; the manifest captures whatever the
//   API returns under `extmetadata.LicenseShortName`. The flashcard back
//   face credits Wiktionary + the license name on every render.
//
// Requirements:
//   - Node 18+ (native fetch)
//   - run from the nihongo/ directory (or any directory; paths resolve
//     relative to this script's location)
// ─────────────────────────────────────────────────────────────────────

import { writeFile, mkdir, readFile, readdir, access, constants } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const STROKE_DIR = join(ROOT, 'images', 'stroke');
const MANIFEST   = join(STROKE_DIR, 'manifest.json');
const DATA_JS    = join(ROOT, 'data.js');

const USER_AGENT = 'nihongo-flashcards/1.0 (khevin.mituti@lastro.co) stroke-order-fetcher';
const RATE_LIMIT_MS = 1000;  // wait between API calls

// ── arg parsing ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const DRY    = !!args.dry;
const FORCE  = !!args.force;
const LIMIT  = args.limit ? parseInt(args.limit, 10) : null;
const ONLY   = args.only ? String(args.only).split(',').map(s => s.trim()).filter(Boolean) : null;
const JOUYOU = !!args.jouyou;
const JOUYOU_LIST = join(__dirname, 'jouyou-kanji.txt');

// ── extract the kanji list from data.js ─────────────────────────────────
// Three modes:
//   --only=...    explicit list  (highest priority)
//   --jouyou      reads scripts/jouyou-kanji.txt (2,131 jouyou kanji)
//   default       extracts from data.js FLASHCARD_CLASSES (~200 cards)
async function readFlashcardKanji() {
  if (ONLY) return [...new Set(ONLY)];
  if (JOUYOU) {
    const raw = await readFile(JOUYOU_LIST, 'utf8');
    const set = new Set();
    for (const line of raw.split(/\r?\n/)) {
      const k = line.trim();
      if (k.length === 1 && /\p{Script=Han}/u.test(k)) set.add(k);
    }
    const out = [...set];
    return LIMIT ? out.slice(0, LIMIT) : out;
  }
  const src = await readFile(DATA_JS, 'utf8');
  const set = new Set();
  // Find all `kanji: 'X'` and `kanji:'X'` patterns inside FLASHCARD_CLASSES.
  // Single-character only — multi-char entries are vocab compounds, not
  // single-kanji entries Wiktionary stroke gifs cover.
  const re = /kanji\s*:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const k = m[1];
    // Only single CJK characters
    if (k.length === 1 && /\p{Script=Han}/u.test(k)) set.add(k);
  }
  // Also include radical-card glyphs that are themselves CJK characters
  const reR = /radical\s*:\s*['"]([^'"]+)['"]/g;
  while ((m = reR.exec(src))) {
    const k = m[1];
    if (k.length === 1 && /\p{Script=Han}/u.test(k)) set.add(k);
  }
  const out = [...set];
  return LIMIT ? out.slice(0, LIMIT) : out;
}

// ── manifest helpers ────────────────────────────────────────────────────
async function readManifest() {
  try {
    const raw = await readFile(MANIFEST, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { _comment: '', license: '', attribution: '', downloads: [] };
  }
}
async function writeManifest(manifest) {
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

// ── file-exists check ───────────────────────────────────────────────────
async function exists(path) {
  try { await access(path, constants.F_OK); return true; }
  catch { return false; }
}

// ── Wikimedia API call to resolve a File: page → direct image URL ──────
// Note: Wiktionary's File: page often reports `missing: true` even when
// the file is hosted on Commons (imagerepository: 'shared'). We only
// treat the file as truly missing when the API returns no imageinfo at
// all. Otherwise, imageinfo[0].url is the canonical upload URL.
async function resolveImageUrl(kanji) {
  const filename = `${kanji}-order.gif`;
  const api = `https://en.wiktionary.org/w/api.php?action=query&titles=${
    encodeURIComponent('File:' + filename)
  }&prop=imageinfo&iiprop=url|extmetadata&format=json&formatversion=2&origin=*`;
  const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`API ${res.status} for ${filename}`);
  const json = await res.json();
  const page = (json?.query?.pages || [])[0];
  if (!page) return null;
  const info = (page.imageinfo || [])[0];
  if (!info?.url) return null;
  const md = info.extmetadata || {};
  // Strip Wikimedia tracking query params from the canonical URL so the
  // saved file lineage reads clean. The actual download still uses the
  // full URL — tracking params are harmless during the GET.
  return {
    url:        info.url,
    descUrl:    info.descriptionurl || info.descriptionshorturl,
    license:    md.LicenseShortName?.value || 'unknown',
    artist:     stripHtml(md.Artist?.value || ''),
    description: stripHtml(md.ImageDescription?.value || ''),
  };
}
function stripHtml(s) { return String(s || '').replace(/<[^>]*>/g, '').trim(); }

// ── Wikimedia animated SVG (mid-tier fallback) ─────────────────────────
// Some kanji on Commons have hand-authored animated SVGs (Yug/Hugo Lopez
// project). Filename patterns we try, in order: `-animated.svg`,
// `-animated2.svg`. Both use SMIL <animate> elements to draw strokes
// one at a time. Returns the same shape as resolveImageUrl when found.
async function resolveWikimediaSvgUrl(kanji) {
  for (const suffix of ['-animated.svg', '-animated2.svg']) {
    const filename = `${kanji}${suffix}`;
    const api = `https://en.wiktionary.org/w/api.php?action=query&titles=${
      encodeURIComponent('File:' + filename)
    }&prop=imageinfo&iiprop=url|extmetadata&format=json&formatversion=2&origin=*`;
    try {
      const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const json = await res.json();
      const info = (json?.query?.pages?.[0]?.imageinfo || [])[0];
      if (!info?.url) continue;
      const md = info.extmetadata || {};
      return {
        url: info.url,
        descUrl: info.descriptionurl,
        license: md.LicenseShortName?.value || 'unknown',
        artist:  stripHtml(md.Artist?.value || ''),
        suffix,
      };
    } catch { /* try next */ }
  }
  return null;
}

// ── KanjiVG SVG + SMIL animation generator ─────────────────────────────
// KanjiVG (kanjivg.tagaini.net) covers every jouyou kanji as a static SVG
// with one <path> per stroke. We post-process it to add SMIL <animate>
// elements that reveal each stroke in sequence via stroke-dashoffset.
// Replicates the visual effect of Yug's animated SVGs at scale, since
// the hand-authored ones only exist for a small subset.
//
// File pattern: 5-digit lowercase hex codepoint + '.svg'.
//   鏡 (U+93E1) → '093e1.svg' · 本 (U+672C) → '0672c.svg'
function kanjivgPath(kanji) {
  const cp = kanji.codePointAt(0).toString(16).padStart(5, '0');
  return `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${cp}.svg`;
}
async function fetchKanjivgSvg(kanji) {
  const url = kanjivgPath(kanji);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.includes('<svg')) return null;
  return { url, text };
}
// Convert a KanjiVG static SVG into an animated one by adding SMIL
// <animate> elements that reveal each stroke in sequence. Falls back to
// the original static SVG if the parse finds no <path> elements (so the
// tier-3 "static numbered" fallback is still useful).
function animateKanjivgSvg(svgText, opts = {}) {
  const dur = opts.dur || 5;            // total cycle seconds
  const pauseFrac = opts.pauseFrac || 0.25;  // pause at end so the
                                              // learner can read the
                                              // finished kanji before
                                              // the loop restarts
  // Each KanjiVG stroke is a single self-closing <path .../> tag inside
  // the StrokePaths group. We grab them in document order — that IS
  // stroke order in KanjiVG.
  const pathRe = /<path\b[^>]*\/>/g;
  const matches = [...svgText.matchAll(pathRe)];
  const total = matches.length;
  if (!total) return svgText; // nothing to animate; return static
  // Time math: each stroke gets equal share of (1 - pauseFrac).
  const drawFrac = (1 - pauseFrac) / total;
  // Walk replacements in REVERSE so prior offsets don't shift.
  let out = svgText;
  for (let i = total - 1; i >= 0; i--) {
    const m = matches[i];
    const orig = m[0];
    const startFrac = (i * drawFrac).toFixed(4);
    const endFrac   = ((i + 1) * drawFrac).toFixed(4);
    // Inject pathLength + dasharray/dashoffset attrs and an <animate>
    // child. pathLength="1" normalizes any path to a 1-unit length so
    // the dashoffset math is identical across all strokes regardless
    // of their actual geometric length.
    const inner = orig.slice(5, -2); // strip leading "<path" and trailing "/>"
    const newPath = `<path${inner} pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1">
      <animate attributeName="stroke-dashoffset"
               values="1;1;0;0"
               keyTimes="0;${startFrac};${endFrac};1"
               dur="${dur}s"
               repeatCount="indefinite"/>
    </path>`;
    out = out.slice(0, m.index) + newPath + out.slice(m.index + orig.length);
  }
  // Hide the numbered-stroke labels by default for the animated view —
  // the animation itself shows the order. (Static fallback consumers
  // can re-enable via CSS by overriding `display`.)
  //
  // The KanjiVG source has the numbers in a group with an EXISTING
  // style attribute (`style="font-size:8;fill:#808080"`). The earlier
  // version of this regex matched only the `<g id="...">` prefix and
  // inserted a second `style="display:none"` attribute alongside the
  // original — producing invalid XML with duplicate attributes. That
  // works in <img> (lenient HTML-like parsing) but breaks in <object
  // type="image/svg+xml"> (strict XML parsing, browser shows a parse
  // error overlay). Now we match the WHOLE opening tag and merge
  // display:none into the existing style attribute (or append a fresh
  // one if there isn't a style yet).
  out = out.replace(
    /<g id="kvg:StrokeNumbers_[^"]+"([^>]*)>/,
    (_, rest) => {
      const merged = /style\s*=/.test(rest)
        ? rest.replace(/style\s*=\s*"([^"]*)"/, 'style="display:none;$1"')
        : `${rest} style="display:none"`;
      return `<g id="kvg:StrokeNumbers_animated"${merged}>`;
    }
  );
  return out;
}

// ── one kanji ──────────────────────────────────────────────────────────
// Fallback chain:
//   1. Wikimedia animated GIF  (preferred — best loop quality)
//   2. Wikimedia animated SVG  (Yug/Hugo Lopez hand-authored)
//   3. KanjiVG SVG + SMIL animation injected by us
//   4. KanjiVG SVG static (numbered strokes) — ultimate placeholder
// Whatever lands, it always animates if a viewer is available; the
// renderer falls back .gif → .svg → "not downloaded" placeholder.
async function fetchOne(kanji, manifest) {
  const gifPath = join(STROKE_DIR, `${kanji}-order.gif`);
  const svgPath = join(STROKE_DIR, `${kanji}-order.svg`);
  if (!FORCE && (await exists(gifPath) || await exists(svgPath))) {
    console.log(`  skip  ${kanji}  (already on disk)`);
    return { kanji, status: 'skipped' };
  }

  // ── Tier 1: Wikimedia animated GIF ─────────────────────────────────
  let gifInfo;
  try { gifInfo = await resolveImageUrl(kanji); }
  catch (e) { console.warn(`  FAIL  ${kanji}  GIF API error: ${e.message}`); return { kanji, status: 'error' }; }
  if (gifInfo) {
    if (DRY) {
      console.log(`  dry   ${kanji}  ← gif ${gifInfo.url}`);
      return { kanji, status: 'dry' };
    }
    const res = await fetch(gifInfo.url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(gifPath, buf);
      const size = (buf.length / 1024).toFixed(1) + 'KB';
      console.log(`  ok    ${kanji}  ${size}  (GIF, ${gifInfo.license})`);
      manifest.downloads = manifest.downloads.filter(d => d.kanji !== kanji);
      manifest.downloads.push({
        kanji, file: `${kanji}-order.gif`, format: 'gif',
        sourceUrl: gifInfo.url, descUrl: gifInfo.descUrl,
        license: gifInfo.license, artist: gifInfo.artist,
        description: gifInfo.description,
        bytes: buf.length, downloadedAt: new Date().toISOString(),
      });
      return { kanji, status: 'ok-gif' };
    }
    console.warn(`  ...  ${kanji}  GIF download failed (${res.status}), trying SVG tiers`);
  }

  // ── Tier 2: Wikimedia hand-authored animated SVG ───────────────────
  let wmSvg;
  try { wmSvg = await resolveWikimediaSvgUrl(kanji); }
  catch { /* swallow and try next tier */ }
  if (wmSvg) {
    if (DRY) {
      console.log(`  dry   ${kanji}  ← wm-svg ${wmSvg.url}`);
      return { kanji, status: 'dry' };
    }
    const res = await fetch(wmSvg.url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) {
      const txt = await res.text();
      await writeFile(svgPath, txt, 'utf8');
      const size = (Buffer.byteLength(txt, 'utf8') / 1024).toFixed(1) + 'KB';
      console.log(`  ok    ${kanji}  ${size}  (Wikimedia animated SVG${wmSvg.suffix}, ${wmSvg.license})`);
      manifest.downloads = manifest.downloads.filter(d => d.kanji !== kanji);
      manifest.downloads.push({
        kanji, file: `${kanji}-order.svg`, format: 'svg-wm-animated',
        sourceUrl: wmSvg.url, descUrl: wmSvg.descUrl,
        license: wmSvg.license, artist: wmSvg.artist,
        bytes: Buffer.byteLength(txt, 'utf8'),
        downloadedAt: new Date().toISOString(),
      });
      return { kanji, status: 'ok-wm-svg' };
    }
  }

  // ── Tier 3: KanjiVG static SVG + our SMIL animation injection ──────
  if (DRY) {
    console.log(`  dry   ${kanji}  ← kanjivg+smil ${kanjivgPath(kanji)}`);
    return { kanji, status: 'dry' };
  }
  let kvg;
  try { kvg = await fetchKanjivgSvg(kanji); }
  catch { /* fall through to miss */ }
  if (!kvg) {
    console.warn(`  miss  ${kanji}  (no GIF, no Wikimedia SVG, no KanjiVG SVG)`);
    return { kanji, status: 'missing' };
  }
  // Inject SMIL <animate> elements. If post-processing finds no <path>
  // (shouldn't happen for KanjiVG), the function returns the static SVG
  // unchanged — that's the tier-4 ultimate fallback (numbered strokes).
  const animated = animateKanjivgSvg(kvg.text);
  const isAnimated = animated !== kvg.text;
  await writeFile(svgPath, animated, 'utf8');
  const size = (Buffer.byteLength(animated, 'utf8') / 1024).toFixed(1) + 'KB';
  console.log(`  ok    ${kanji}  ${size}  (KanjiVG ${isAnimated ? '+SMIL' : 'static numbered'}, CC BY-SA 3.0)`);
  manifest.downloads = manifest.downloads.filter(d => d.kanji !== kanji);
  manifest.downloads.push({
    kanji, file: `${kanji}-order.svg`,
    format: isAnimated ? 'svg-kanjivg-animated' : 'svg-kanjivg-static',
    sourceUrl: kvg.url,
    license: 'CC BY-SA 3.0',
    artist: 'Ulrich Apel and KanjiVG contributors',
    description: isAnimated
      ? 'KanjiVG static SVG with SMIL stroke-by-stroke reveal injected.'
      : 'KanjiVG static SVG with numbered strokes (animation injection skipped).',
    bytes: Buffer.byteLength(animated, 'utf8'),
    downloadedAt: new Date().toISOString(),
  });
  return { kanji, status: isAnimated ? 'ok-kvg-animated' : 'ok-kvg-static' };
}

// ── main ────────────────────────────────────────────────────────────────
async function main() {
  await mkdir(STROKE_DIR, { recursive: true });
  const kanjis = await readFlashcardKanji();
  if (!kanjis.length) {
    console.error('No kanji to download. Check data.js parsing.');
    process.exit(1);
  }
  console.log(`Targets (${kanjis.length}): ${kanjis.join(' ')}`);
  console.log(`Mode: ${DRY ? 'DRY RUN' : FORCE ? 'FORCE' : 'normal'}`);
  console.log('');

  const manifest = await readManifest();
  let okGif = 0, okWmSvg = 0, okKvgAnim = 0, okKvgStatic = 0, skipped = 0, missing = 0, error = 0;
  for (const k of kanjis) {
    const r = await fetchOne(k, manifest);
    switch (r.status) {
      case 'ok-gif':         okGif++; break;
      case 'ok-wm-svg':      okWmSvg++; break;
      case 'ok-kvg-animated':okKvgAnim++; break;
      case 'ok-kvg-static':  okKvgStatic++; break;
      case 'skipped':        skipped++; break;
      case 'missing':        missing++; break;
      case 'error':          error++; break;
    }
    if (r.status !== 'skipped' && r.status !== 'dry') {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }
  }
  if (!DRY) {
    manifest.downloads.sort((a, b) => a.kanji.localeCompare(b.kanji));
    await writeManifest(manifest);
    // Also emit a JS sibling the app loads at startup: kanji → 'gif'|'svg'.
    // The browser renderer uses this map to pick the right URL directly,
    // avoiding any 404-then-fallback hop that depends on onerror firing
    // reliably across browsers and file:// quirks.
    //
    // Scan the stroke directory DIRECTLY rather than relying on the
    // manifest.downloads array. Older entries can be missing the
    // `format` field, and partial runs (e.g. --limit) leave files on
    // disk that have no metadata entry — both modes used to leak into
    // manifest.js as wrong/missing data. Disk is the source of truth.
    // GIFs win over SVGs when a kanji has both (we prefer the original
    // Wikimedia animated GIF over a KanjiVG fallback if the GIF exists).
    const files = await readdir(STROKE_DIR);
    const formats = {};
    for (const f of files) {
      const m = f.match(/^(.+)-order\.gif$/);
      if (m) formats[m[1]] = 'gif';
    }
    for (const f of files) {
      const m = f.match(/^(.+)-order\.svg$/);
      if (m && !formats[m[1]]) formats[m[1]] = 'svg';
    }
    // Stable codepoint ordering keeps git diffs readable.
    const ordered = {};
    for (const k of Object.keys(formats).sort()) ordered[k] = formats[k];
    const js = '// Auto-generated by scripts/download-stroke-gifs.mjs by\n'
      + '// scanning images/stroke/ directly. Maps each kanji we have a\n'
      + '// stroke-order asset for to its file extension on disk (gif =\n'
      + '// Wikimedia animated GIF, svg = any SVG variant — Wikimedia\n'
      + '// animated SVG or KanjiVG with our SMIL injection). The flashcard\n'
      + '// back-face renderer reads this map to construct the src URL\n'
      + '// directly. GIFs are preferred over SVGs when both exist for the\n'
      + '// same kanji. Source of truth is the filesystem, not metadata.\n'
      + 'window.STROKE_FORMATS = ' + JSON.stringify(ordered) + ';\n';
    await writeFile(join(STROKE_DIR, 'manifest.js'), js, 'utf8');
  }
  console.log('');
  console.log(`Done. gif=${okGif}  wm-svg=${okWmSvg}  kvg-anim=${okKvgAnim}  kvg-static=${okKvgStatic}  skipped=${skipped}  missing=${missing}  error=${error}`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
