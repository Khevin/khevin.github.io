#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// migrate-blob-to-brush.mjs
//
// One-time migration that:
//   1. Creates images/brush/ if it doesn't exist.
//   2. Copies every blob-*.png from images/blob/ into images/brush/
//      under the new "brush-*" naming, converting PNG → WebP along
//      the way (WebP is consistently ~3-10× smaller for our brushes).
//   3. Special case: blob-bg-1/2/3.png become brush-7/8/9.webp so
//      they merge into the sequential brush-N pool that already
//      contains brush-1..6 (the user's new sumi sweeps).
//   4. Copies the already-webp brush-1..6 files straight across.
//   5. Removes the old images/blob/ folder after every source has
//      a verified copy in images/brush/.
//
// Run once; afterwards the script is a no-op (it'll skip files that
// already exist in the destination).
// ─────────────────────────────────────────────────────────────────────

import { readdir, copyFile, stat, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const SRC        = join(ROOT, 'images', 'blob');
const DST        = join(ROOT, 'images', 'brush');

if (!existsSync(SRC)) {
  console.log('Source folder ' + SRC + ' does not exist — migration already complete?');
  process.exit(0);
}

await mkdir(DST, { recursive: true });

function classify(filename) {
  // Returns { dst, action } where action is 'convert' (PNG → WebP via
  // sharp) or 'copy' (already a webp, just move it). Null = unrecognized.
  let m;
  if ((m = filename.match(/^blob-circle-(\d+)\.png$/))) {
    return { dst: `brush-circle-${m[1]}.webp`, action: 'convert' };
  }
  if ((m = filename.match(/^blob-line-(\d+)\.png$/))) {
    return { dst: `brush-line-${m[1]}.webp`, action: 'convert' };
  }
  if ((m = filename.match(/^blob-particle-([a-z]+)\.png$/))) {
    return { dst: `brush-particle-${m[1]}.webp`, action: 'convert' };
  }
  if ((m = filename.match(/^blob-bg-(\d+)\.png$/))) {
    // bg-blobs merge into the sequential brush-N pool. Original
    // indices 1/2/3 land at 7/8/9 (after the user's existing 1..6).
    const oldIdx = parseInt(m[1], 10);
    return { dst: `brush-${oldIdx + 6}.webp`, action: 'convert' };
  }
  if ((m = filename.match(/^brush-(\d+)\.webp$/))) {
    // Already-webp brush, drop straight into destination.
    return { dst: filename, action: 'copy' };
  }
  return null;
}

const files = (await readdir(SRC)).sort();
let converted = 0, copied = 0, skipped = 0;

for (const f of files) {
  const c = classify(f);
  if (!c) {
    console.log(`  ${f}: unrecognized, skipping.`);
    continue;
  }
  const dstPath = join(DST, c.dst);
  if (existsSync(dstPath)) {
    console.log(`  ${f} → ${c.dst} [exists, skipped]`);
    skipped++;
    continue;
  }
  const srcPath = join(SRC, f);
  if (c.action === 'convert') {
    await sharp(srcPath).webp({ quality: 90 }).toFile(dstPath);
    const before = (await stat(srcPath)).size;
    const after  = (await stat(dstPath)).size;
    console.log(
      `  ${f} → ${c.dst}  ` +
      `(${(before/1024).toFixed(1)}KB png → ${(after/1024).toFixed(1)}KB webp, ` +
      `${(100 - 100*after/before).toFixed(0)}% smaller)`
    );
    converted++;
  } else {
    await copyFile(srcPath, dstPath);
    console.log(`  ${f} → ${c.dst}  [copy, already webp]`);
    copied++;
  }
}

console.log('');
console.log(`Converted ${converted}, copied ${copied}, skipped ${skipped}.`);

// Sanity check: every recognized source has a destination. If so, drop
// the old folder.
const sources = files.filter(f => classify(f) !== null);
let allMigrated = true;
for (const f of sources) {
  const c = classify(f);
  if (!existsSync(join(DST, c.dst))) {
    console.log(`WARN: ${f} → ${c.dst} missing in destination, NOT removing source folder.`);
    allMigrated = false;
  }
}
if (allMigrated) {
  console.log('All sources migrated. Removing old images/blob/ folder.');
  await rm(SRC, { recursive: true, force: true });
} else {
  console.log('Some files did not migrate — keeping images/blob/ for inspection.');
}
