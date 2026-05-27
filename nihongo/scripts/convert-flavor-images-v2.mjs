#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// convert-flavor-images-v2.mjs
//
// Second-pass conversion for the Flavors page images. The user re-saved
// the 10 flavor PNGs as TRANSPARENT versions and dropped them directly
// into nihongo/images/vocab/. The OS de-duplicated the filenames against
// the existing .webp twins by appending " 1": so we have
//
//   images/vocab/oishii 1.png        ← new transparent source
//   images/vocab/oishii.webp         ← old non-transparent webp (stale)
//
// The image-slot probes `<key>.webp` → `<key>.png` → ... — none of which
// match " 1". So the new transparent images are invisible to the page.
//
// This script:
//   1. Finds every "<flavor> 1.png" in images/vocab/ for the 10 known
//      flavor ids.
//   2. Converts to "<flavor>.webp" via sharp (same maxDim 600, q78 as
//      the existing vocab folder rule).
//   3. Deletes the " 1.png" source AND any older "<flavor>.webp" stub.
//
// Re-runnable. Idempotent — if the source PNG is already gone (because a
// previous run consumed it), the script no-ops for that flavor.
// ─────────────────────────────────────────────────────────────────────

import { readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const VOCAB_DIR  = join(ROOT, 'images', 'vocab');

const FLAVORS = [
  'oishii', 'mazui', 'amai', 'karai', 'shoppai',
  'suppai', 'nigai', 'atsui', 'sawayaka', 'tsumetai',
];

const MAX_DIM = 600;
const QUALITY = 78;

async function main() {
  const entries = await readdir(VOCAB_DIR);
  const onDisk = new Set(entries);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const flavor of FLAVORS) {
    // Look for the user's saved file. Most likely "<flavor> 1.png" from
    // the OS dedupe. Also try " (1)" and "<flavor> 2.png" in case of
    // multiple re-saves. First match wins.
    const candidates = [
      `${flavor} 1.png`,
      `${flavor} (1).png`,
      `${flavor} 2.png`,
      `${flavor} 1.webp`,
    ];
    const srcName = candidates.find(c => onDisk.has(c));
    if (!srcName) {
      console.log(`  ${flavor.padEnd(10)} — no fresh source found, skipping`);
      skipped++;
      continue;
    }

    const srcPath = join(VOCAB_DIR, srcName);
    const dstPath = join(VOCAB_DIR, `${flavor}.webp`);

    try {
      // Convert + resize. fit=inside preserves aspect; withoutEnlargement
      // skips small images. effort=4 is sharp's mid-quality knob —
      // produces consistent transparent webps without thrashing CPU.
      const buf = await sharp(srcPath)
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY, alphaQuality: 95, effort: 4 })
        .toBuffer();

      // Write to dest. If the old <flavor>.webp existed, this overwrites
      // it. We don't bother unlinking first — sharp's pipeline buffers
      // before writing so the write is atomic-ish on Windows.
      await sharp(buf).toFile(dstPath);

      // Delete the source so a re-run doesn't pick it up again.
      await unlink(srcPath);

      console.log(`  ${flavor.padEnd(10)} ← ${srcName}`);
      converted++;
    } catch (err) {
      console.error(`  ${flavor.padEnd(10)} — FAILED: ${err.message}`);
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
