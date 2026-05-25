#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// process-png-brushes.mjs
//
// Walks images/brush/ for any *.png files and converts them to *.webp
// in place (then deletes the PNG). For each file we also check whether
// it has >= 5% near-white pixels among its opaque content — if so, run
// a threshold + trim pass first to strip the white halo. Otherwise just
// convert.
//
// Re-runs safely: skips when the matching .webp already exists.
// ─────────────────────────────────────────────────────────────────────

import { readdir, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const DIR        = join(ROOT, 'images', 'brush');

const WHITE_THRESHOLD     = 240;
const TRIM_PADDING        = 2;
const HALO_PCT_THRESHOLD  = 5;  // % near-white among opaque → run threshold pass

async function analyze(srcPath) {
  // Returns { needsThreshold, width, height, data } — `data` is the
  // raw RGBA buffer (mutated by the threshold pass).
  const img = sharp(srcPath).ensureAlpha();
  const meta = await img.metadata();
  const { width, height } = meta;
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  let opaque = 0, white = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      opaque++;
      if (data[i] >= WHITE_THRESHOLD && data[i+1] >= WHITE_THRESHOLD && data[i+2] >= WHITE_THRESHOLD) {
        white++;
      }
    }
  }
  const haloPct = opaque ? (100 * white / opaque) : 0;
  return { needsThreshold: haloPct >= HALO_PCT_THRESHOLD, width, height, data, haloPct };
}

async function processOne(file) {
  const srcPath = join(DIR, file);
  const dstPath = srcPath.replace(/\.png$/i, '.webp');

  if (existsSync(dstPath)) {
    console.log(`  ${file} → ${file.replace(/\.png$/i, '.webp')}  [skip, .webp already exists]`);
    return;
  }

  const before = (await stat(srcPath)).size;
  const a = await analyze(srcPath);

  if (a.needsThreshold) {
    // Threshold + trim: nuke near-white pixels to transparent, then crop
    // to the bounding box of the remaining colored pixels (with padding).
    let minX = a.width, minY = a.height, maxX = -1, maxY = -1;
    for (let i = 0; i < a.data.length; i += 4) {
      const r = a.data[i], g = a.data[i+1], b = a.data[i+2];
      if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
        a.data[i + 3] = 0;
      }
      if (a.data[i + 3] > 0) {
        const px = (i / 4) % a.width;
        const py = Math.floor((i / 4) / a.width);
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
    }
    const cropX = Math.max(0, minX - TRIM_PADDING);
    const cropY = Math.max(0, minY - TRIM_PADDING);
    const cropW = Math.min(a.width  - cropX, (maxX - minX + 1) + TRIM_PADDING * 2);
    const cropH = Math.min(a.height - cropY, (maxY - minY + 1) + TRIM_PADDING * 2);
    await sharp(a.data, { raw: { width: a.width, height: a.height, channels: 4 } })
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .webp({ quality: 90 })
      .toFile(dstPath);
    const after = (await stat(dstPath)).size;
    console.log(
      `  ${file} → ${file.replace(/\.png$/i, '.webp')}  ` +
      `[threshold+trim, ${a.haloPct.toFixed(1)}% halo, ` +
      `${a.width}×${a.height} → ${cropW}×${cropH}, ` +
      `${(before/1024).toFixed(1)}KB → ${(after/1024).toFixed(1)}KB]`
    );
  } else {
    // Clean PNG — just convert format.
    await sharp(srcPath).webp({ quality: 90 }).toFile(dstPath);
    const after = (await stat(dstPath)).size;
    console.log(
      `  ${file} → ${file.replace(/\.png$/i, '.webp')}  ` +
      `[convert only, ${a.haloPct.toFixed(1)}% halo, ` +
      `${(before/1024).toFixed(1)}KB → ${(after/1024).toFixed(1)}KB]`
    );
  }

  await unlink(srcPath);
}

async function main() {
  const all = await readdir(DIR);
  const targets = all.filter(f => /\.png$/i.test(f)).sort();
  if (!targets.length) {
    console.log('No .png files in images/brush/.');
    return;
  }
  console.log(`Processing ${targets.length} png brush${targets.length === 1 ? '' : 'es'}:`);
  for (const f of targets) await processOne(f);
  console.log('');
  console.log('Done.');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
