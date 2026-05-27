#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// convert-flavor-images.mjs
//
// One-shot. Renames + webp-converts the 10 ChatGPT poster images for
// the Flavors page (Phase 1).
//
//   nihongo/images/vocabulary/ChatGPT Image …(N).png   →
//   nihongo/images/vocab/<flavor>.webp
//
// Mapping (confirmed by user, poster reading-order):
//   1=oishii, 2=mazui, 3=amai, 4=karai, 5=shoppai,
//   6=suppai, 7=nigai, 8=atsui, 9=sawayaka, 10=tsumetai
//
// Per the existing vocab folder rule in optimize-images.mjs:
// maxDim 600px (longest side), webp quality 78.
//
// Source PNGs are deleted after the .webp twin lands successfully.
// Re-runnable: if a webp twin already exists, skips that flavor.
// ─────────────────────────────────────────────────────────────────────

import { readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

const SRC_DIR = join(ROOT, 'images', 'vocabulary');
const DST_DIR = join(ROOT, 'images', 'vocab');

// Order matches the user's confirmed mapping. Index in the array (1-based
// after sort) corresponds to the (N) suffix on the ChatGPT filename.
const FLAVOR_ORDER = [
  'oishii',    // (1)
  'mazui',     // (2)
  'amai',      // (3)
  'karai',     // (4)
  'shoppai',   // (5)
  'suppai',    // (6)
  'nigai',     // (7)
  'atsui',     // (8)
  'sawayaka',  // (9)
  'tsumetai',  // (10)
];

const MAX_DIM = 600;
const QUALITY = 78;

// Extract the (N) index from a ChatGPT filename. Returns null on no match.
function extractIndex(filename) {
  const m = filename.match(/\((\d+)\)\.png$/i);
  return m ? parseInt(m[1], 10) : null;
}

async function main() {
  console.log(`Source:      ${SRC_DIR}`);
  console.log(`Destination: ${DST_DIR}`);
  console.log('');

  let entries;
  try {
    entries = await readdir(SRC_DIR);
  } catch (err) {
    console.error(`FATAL: cannot read ${SRC_DIR}: ${err.message}`);
    process.exit(1);
  }

  // Find the 10 ChatGPT files and key them by their (N) index.
  const byIndex = new Map();
  for (const entry of entries) {
    if (!entry.startsWith('ChatGPT Image')) continue;
    if (!entry.toLowerCase().endsWith('.png')) continue;
    const idx = extractIndex(entry);
    if (idx === null) continue;
    if (idx < 1 || idx > 10) continue;
    byIndex.set(idx, entry);
  }

  if (byIndex.size === 0) {
    console.log('No ChatGPT-named PNGs found in source. Nothing to do.');
    return;
  }

  console.log(`Found ${byIndex.size} ChatGPT PNG(s) to process.\n`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 1; i <= 10; i++) {
    const flavorId = FLAVOR_ORDER[i - 1];
    const srcFile  = byIndex.get(i);
    if (!srcFile) {
      console.log(`  ${i.toString().padStart(2)}. ${flavorId.padEnd(10)} — source PNG missing, skipping`);
      continue;
    }
    const srcPath = join(SRC_DIR, srcFile);
    const dstPath = join(DST_DIR, `${flavorId}.webp`);

    if (existsSync(dstPath)) {
      console.log(`  ${i.toString().padStart(2)}. ${flavorId.padEnd(10)} — webp twin exists, skipping`);
      skipped++;
      continue;
    }

    try {
      await sharp(srcPath)
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(dstPath);

      // Source PNG deleted only after the webp twin lands successfully.
      await unlink(srcPath);

      console.log(`  ${i.toString().padStart(2)}. ${flavorId.padEnd(10)} → ${dstPath}`);
      converted++;
    } catch (err) {
      console.error(`  ${i.toString().padStart(2)}. ${flavorId.padEnd(10)} — FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Done. converted=${converted} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('FATAL', err);
  process.exit(1);
});
