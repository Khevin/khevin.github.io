#!/usr/bin/env node
// Quick targeted PNG→WebP converter for vocab, flavorballs, and root.
// The main optimize-images.mjs is exhaustive and slow (re-scans every
// folder); this one walks only the three directories that still carry
// PNGs and converts each. Same sharp pipeline (resize to maxDim,
// quality 78, drop the .png after success), just scoped.

import { readdir, stat, unlink } from 'node:fs/promises';
import { join, dirname, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

// Each target: { dir: relative-to-images/, maxDim, quality }
const TARGETS = [
  { dir: 'images/vocab',                maxDim: 600, quality: 78 },
  { dir: 'images/vocab/flavorballs',    maxDim: 300, quality: 82 },
  { dir: 'images',                      maxDim: 800, quality: 80 },
];

let total = 0, ok = 0, skip = 0, fail = 0;

for (const t of TARGETS) {
  const abs = resolve(ROOT, t.dir);
  if (!existsSync(abs)) { console.log('skip (missing)', t.dir); continue; }
  const entries = await readdir(abs);
  const pngs = entries.filter(f => /\.png$/i.test(f));
  if (!pngs.length) { console.log('(no PNGs in', t.dir, ')'); continue; }
  console.log('==', t.dir, '— ' + pngs.length + ' PNGs ==');
  for (const f of pngs) {
    total++;
    const src = join(abs, f);
    const dst = src.replace(/\.png$/i, '.webp');
    try {
      if (existsSync(dst)) {
        // Existing webp twin — assume stale png, drop it.
        await unlink(src);
        skip++;
        continue;
      }
      const meta = await sharp(src).metadata();
      const longSide = Math.max(meta.width || 0, meta.height || 0);
      let pipe = sharp(src);
      if (longSide > t.maxDim) {
        pipe = pipe.resize({
          width:  meta.width  >= meta.height ? t.maxDim : null,
          height: meta.height >  meta.width  ? t.maxDim : null,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
      await pipe.webp({ quality: t.quality, alphaQuality: 90 }).toFile(dst);
      await unlink(src);
      ok++;
      if (ok % 10 === 0) console.log('   ' + ok + '/' + total);
    } catch (e) {
      console.error('   FAIL', f, '—', e.message);
      fail++;
    }
  }
}

console.log('');
console.log('Done. converted=' + ok + ' skipped=' + skip + ' failed=' + fail + ' total=' + total);
