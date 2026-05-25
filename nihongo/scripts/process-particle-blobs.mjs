#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// process-particle-blobs.mjs
//
// Strips near-white background from every blob-particle-*.png in
// images/blob/ and trims the resulting transparent edges so the saved
// file contains only the colored pigment pixels (no surrounding white
// halo, no transparent padding).
//
// Why: the source PNGs come from an image generator that paints the
// sumi blob on an opaque white field. The renderer uses mix-blend-mode:
// multiply to dissolve the white into the cream paper at display time,
// which works visually — but the BOUNDING BOX still includes all the
// white pixels, so JS positioning math measures a much bigger image
// than the actual visible stroke. Trimming gives the renderer an
// honest aspect ratio that matches what the eye sees.
//
// Two passes:
//   1. THRESHOLD — any pixel whose luminance is above WHITE_THRESHOLD
//      (defaults to 240 — i.e. R, G, B all ≥ 240) becomes fully
//      transparent. The "near-white" tolerance handles JPEG-style
//      gradient anti-aliasing on the brush edges; a strict ==255 would
//      leave thin halos.
//   2. TRIM — compute the bounding box of all remaining non-transparent
//      pixels (alpha > 0) and crop to that rectangle, with a small
//      uniform padding so the brush has a few pixels of breathing room
//      and isn't flush against the edge.
//
// Idempotent: re-running on already-processed files just confirms the
// trim (the threshold pass is a no-op on already-transparent pixels).
//
// Usage:
//   node scripts/process-particle-blobs.mjs              # processes all blob-particle-*.png
//   node scripts/process-particle-blobs.mjs --dry         # report only, no writes
//   node scripts/process-particle-blobs.mjs --pattern=N  # process only blob-particle-N.png
// ─────────────────────────────────────────────────────────────────────

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const BLOB_DIR   = join(ROOT, 'images', 'blob');

// Anything with R, G, AND B all above this is considered "white" and
// gets nuked to alpha 0. 240 catches the soft cream-to-white edge
// fringe without eating into the brush's gray midtones.
const WHITE_THRESHOLD = 240;
// Padding in pixels added around the trimmed brush. Zero would give a
// brush flush against every edge — fine in theory, but a couple of
// pixels of breathing room makes the renderer's `object-fit: contain`
// more forgiving and avoids any subpixel cutoff at the brush's
// thinnest hairline edges.
const TRIM_PADDING = 2;

// CLI parsing.
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const DRY     = !!args.dry;
const PATTERN = args.pattern ? String(args.pattern) : null;

function fileMatches(name) {
  if (!/^blob-particle-.+\.png$/i.test(name)) return false;
  if (PATTERN && !name.includes(PATTERN)) return false;
  return true;
}

async function processOne(file) {
  const path = join(BLOB_DIR, file);
  const buf  = await readFile(path);
  const img  = sharp(buf).ensureAlpha();
  const meta = await img.metadata();
  const { width, height } = meta;
  // Read raw RGBA so we can manipulate per-pixel alpha and compute the
  // bounding box in one pass.
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });

  // Pass 1 — alpha threshold. For each pixel, if all three RGB
  // channels are above WHITE_THRESHOLD, zero the alpha. We mutate the
  // raw buffer in place; sharp will repackage from this on write.
  let kept = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      data[i + 3] = 0;
    }
    if (data[i + 3] > 0) {
      kept++;
      const px = (i / 4) % width;
      const py = Math.floor((i / 4) / width);
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
  }

  if (kept === 0) {
    console.log(`  ${file}: 0 colored pixels found — image looks empty or fully white. SKIPPED.`);
    return;
  }

  // Apply uniform padding to the bounding box, clipped to image bounds.
  const cropX = Math.max(0, minX - TRIM_PADDING);
  const cropY = Math.max(0, minY - TRIM_PADDING);
  const cropW = Math.min(width  - cropX, (maxX - minX + 1) + TRIM_PADDING * 2);
  const cropH = Math.min(height - cropY, (maxY - minY + 1) + TRIM_PADDING * 2);

  const trimmedKB = (cropW * cropH * 4 / 1024).toFixed(1);
  const origKB    = (width * height * 4 / 1024).toFixed(1);
  console.log(
    `  ${file}: ${width}×${height} → ${cropW}×${cropH}  ` +
    `(${origKB}KB raw → ${trimmedKB}KB raw, kept ${kept} px)`
  );

  if (DRY) return;

  // Re-pack the mutated raw buffer back into a PNG, then extract the
  // crop rect. Sharp needs to be told the input is raw + dimensions
  // since we already destructured into a Uint8Array.
  await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .png()
    .toFile(path);
}

async function main() {
  const all = await readdir(BLOB_DIR);
  const targets = all.filter(fileMatches).sort();
  if (!targets.length) {
    console.log('No blob-particle-*.png files found.');
    return;
  }
  console.log(
    `Processing ${targets.length} particle blob${targets.length === 1 ? '' : 's'} ` +
    `(threshold ${WHITE_THRESHOLD}, padding ${TRIM_PADDING}px)` +
    (DRY ? ' [DRY RUN — no writes]' : '')
  );
  console.log('');
  for (const f of targets) {
    try {
      await processOne(f);
    } catch (e) {
      console.error(`  ${f}: ERROR — ${e.message}`);
    }
  }
  console.log('');
  console.log('Done.');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
