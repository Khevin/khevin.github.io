#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// resize-particle-brushes.mjs
//
// Targeted re-encoder for images/brush/brush-particle-*.webp.
// Caps the long side at 256px (current sources range from 591×522 up
// to 1254×1254 — all well above the actual render budget of ~56px).
// Quality 88 matches the rule in optimize-images.mjs.
//
// Built as its own script because optimize-images.mjs's atomic
// rename trips Windows AV: Sharp writes the new file → AV grabs an
// exclusive scan handle for a fraction of a second → the script's
// follow-up unlink/rename hits EBUSY. We work around that by writing
// each tmp file FIRST, waiting a moment, then doing the in-place
// swap with a few retries.
//
// Re-runnable. If a particle brush is already ≤ 256 on its long
// side, the script reports "already small" and skips it.
// ─────────────────────────────────────────────────────────────────────

import { readdir, stat, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const DIR        = join(ROOT, 'images', 'brush');

const MAX_DIM = 256;
const QUALITY = 88;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// On Windows, fs.rename uses MoveFileExW with MOVEFILE_REPLACE_EXISTING,
// which can replace a file that's open elsewhere for read (e.g.,
// Explorer thumbnail cache, browser image cache, AV scan handle). A
// separate unlink + rename pair FAILS on the unlink step in those
// cases because unlink demands exclusive write access. So we use the
// atomic rename and skip the unlink. Retries still cover the case
// where AV is briefly holding an exclusive handle (a few hundred ms
// in practice).
async function retryRename(from, to, attempts = 12) {
  for (let i = 0; i < attempts; i++) {
    try { await rename(from, to); return; }
    catch (e) {
      if (e.code !== 'EBUSY' && e.code !== 'EPERM' && e.code !== 'EEXIST') throw e;
      await sleep(300 * (i + 1));
    }
  }
  throw new Error(`rename ${from} -> ${to} kept failing with EBUSY after ${attempts} retries`);
}

async function processOne(file) {
  const src    = join(DIR, file);
  const tmp    = src + '.tmp';
  const meta   = await sharp(src).metadata();
  const longSide = Math.max(meta.width || 0, meta.height || 0);
  const srcSize  = (await stat(src)).size;

  if (longSide <= MAX_DIM) {
    console.log(`  ${file}  ${meta.width}×${meta.height}  (already ≤ ${MAX_DIM}, ${(srcSize/1024).toFixed(1)}KB — skipped)`);
    return { skipped: true };
  }

  // Write the resized copy to a sibling .tmp path.
  await sharp(src)
    .resize({
      width:  meta.width  >= meta.height ? MAX_DIM : null,
      height: meta.height >  meta.width  ? MAX_DIM : null,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toFile(tmp);

  // Give AV a beat to finish scanning the new file before the swap.
  await sleep(150);

  // Atomic overwrite — rename replaces an open-for-read file on
  // Windows; an explicit unlink would fail with EBUSY when Explorer's
  // thumbnail cache or the AV scanner is holding a read handle.
  await retryRename(tmp, src);

  const dstSize = (await stat(src)).size;
  const dstMeta = await sharp(src).metadata();
  const pct = (100 - 100 * dstSize / srcSize).toFixed(0);
  console.log(
    `  ${file}  ${meta.width}×${meta.height} → ${dstMeta.width}×${dstMeta.height}  ` +
    `${(srcSize/1024).toFixed(1)}KB → ${(dstSize/1024).toFixed(1)}KB  (${pct}% smaller)`
  );
  return { srcSize, dstSize };
}

async function main() {
  const all = await readdir(DIR);
  const targets = all
    .filter(f => /^brush-particle-.*\.webp$/i.test(f))
    .sort();
  if (!targets.length) {
    console.log('No brush-particle-*.webp files found in images/brush/.');
    return;
  }
  console.log(`Resizing ${targets.length} particle brush${targets.length === 1 ? '' : 'es'} to ${MAX_DIM}px max:`);
  console.log('');

  let totalBefore = 0, totalAfter = 0, processed = 0, skipped = 0;
  for (const f of targets) {
    try {
      const r = await processOne(f);
      if (r.skipped) { skipped++; continue; }
      totalBefore += r.srcSize;
      totalAfter  += r.dstSize;
      processed++;
    } catch (err) {
      console.error(`  ${f}: ERROR — ${err.message}`);
    }
  }

  console.log('');
  if (processed > 0) {
    const kbBefore = (totalBefore / 1024).toFixed(1);
    const kbAfter  = (totalAfter  / 1024).toFixed(1);
    const pct      = (100 - 100 * totalAfter / totalBefore).toFixed(0);
    console.log(`Processed ${processed} file${processed === 1 ? '' : 's'}: ${kbBefore}KB → ${kbAfter}KB  (${pct}% reduction).`);
  }
  if (skipped > 0) {
    console.log(`Skipped ${skipped} file${skipped === 1 ? '' : 's'} already at or below ${MAX_DIM}px.`);
  }
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
