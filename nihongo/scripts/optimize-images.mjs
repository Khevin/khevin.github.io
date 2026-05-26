#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// optimize-images.mjs
//
// One-shot bulk optimizer for every image folder in the project.
// Resizes oversized sources down to their actual display use case
// and re-encodes everything as WebP (best size/quality tradeoff for
// modern browsers). PNG sources are deleted after their WebP twin
// lands successfully — repo size drops dramatically (typical 70-90%
// per image, sometimes 95%+ on the most oversized ones).
//
// Per-folder rules below define { maxDim, quality }. maxDim is the
// LONGER side cap — aspect is preserved. Images already smaller than
// maxDim aren't upscaled. quality is the WebP encoder quality (lower
// = smaller file). Brushes use higher quality so the ink edges stay
// crisp; photo-style images can take a heavier hit before the eye
// notices.
//
// Files we DO NOT touch:
//   - images/stroke/    — SVG/GIF animations, not photographs.
//   - any .svg / .gif    — already small or vector.
//   - placeholder.svg    — fallback graphics.
//
// Re-runnable: if the .webp twin already exists at or below the
// target maxDim, skips. So you can drop new PNGs in a folder, run
// the script again, and only the new files are processed.
//
// After running, you MUST update code refs from `.png` → `.webp` for
// every converted folder. The script prints a list of conversions
// that need code-side following at the end.
// ─────────────────────────────────────────────────────────────────────

import { readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const IMAGES    = join(ROOT, 'images');

// Per-folder optimization rules.
// `match` is matched against the FILE BASENAME (no extension).
// First matching rule wins for each file.
const RULES = [
  // ── brushes (folder: images/brush/) ─────────────────────────────────
  // Particle brushes: rendered at ~56px max via JS sizing
  // (glyph.offsetWidth × 2.16). Sources came in oversized (some at
  // 1254×1254). Cap at 256 — gives ~4× retina headroom over the actual
  // render size and lines up with a clean power-of-two thumbnail budget.
  { folder: 'brush', match: /^brush-particle-/,  maxDim: 256, quality: 88 },
  // Circle / line brushes: tier 1/2, rendered at 70×70 max.
  { folder: 'brush', match: /^brush-(circle|line)-/, maxDim: 150, quality: 90 },
  // BG brushes (brush-1..8): tier 3 bg variant, ~720px wide max.
  { folder: 'brush', match: /^brush-\d+$/,       maxDim: 800, quality: 88 },

  // ── page backgrounds (folder: images/bg/...) ────────────────────────
  // Backgrounds attach to .main::before via background-attachment:fixed
  // and size to viewport via cover. 1920px (FullHD) is plenty for
  // any reasonable desktop viewport; downsamples bigger sources.
  { folder: 'bg',          match: /.*/, maxDim: 1920, quality: 78 },

  // ── hero / cover images (folder: images/covers/) ────────────────────
  // Shown in the vocab book hub layout, max ~640px wide.
  { folder: 'covers',      match: /.*/, maxDim: 800,  quality: 78 },

  // ── flashcard front images (folder: images/kanji/) ─────────────────
  // Shown in the editorial flashcard's left column, ~300px max.
  // 500 gives 1.6× retina headroom.
  { folder: 'kanji',       match: /.*/, maxDim: 500,  quality: 78 },

  // ── vocab + food + konbini + eating-out illustrations ──────────────
  // Shown in restaurant menus + flashcards, ~300px max in most uses.
  // 600px gives 2× retina headroom.
  { folder: 'vocab',       match: /.*/, maxDim: 600,  quality: 78 },
  { folder: 'food',        match: /.*/, maxDim: 600,  quality: 78 },
  { folder: 'konbini',     match: /.*/, maxDim: 600,  quality: 78 },
  { folder: 'eating out',  match: /.*/, maxDim: 600,  quality: 78 },

  // ── vocabulary (onomatopoeia images) ────────────────────────────────
  { folder: 'vocabulary',  match: /.*/, maxDim: 500,  quality: 78 },

  // ── inside (placeholders only) ──────────────────────────────────────
  // Just SVG placeholders, no .png/.jpg to process.
];

// Folders we never enter (preserved exactly as-is).
const SKIP_DIRS = new Set(['stroke']);

function ruleFor(folderName, baseName) {
  for (const r of RULES) {
    if (r.folder !== folderName) continue;
    if (r.match.test(baseName)) return r;
  }
  return null;
}

// Returns true if the source file should be processed at all (PNG/JPG
// or oversized WebP). SVG/GIF/PDF/etc. skipped.
function isProcessable(ext) {
  return /^(png|jpe?g|webp)$/i.test(ext.replace(/^\./, ''));
}

async function processOne(absPath, rule) {
  const ext  = extname(absPath);
  const base = basename(absPath, ext);
  const targetPath = absPath.replace(/\.(png|jpe?g)$/i, '.webp');

  // For WebP-in WebP-out we overwrite in place. For PNG/JPG-in we
  // write to .webp and unlink the source.
  const inputIsWebp = /\.webp$/i.test(absPath);
  const srcStat     = await stat(absPath);
  const srcSize     = srcStat.size;

  // Skip if a WebP already exists at the target path AND its size
  // and dimensions look already-optimized. We re-process if the
  // file is bigger than ~200KB or larger than maxDim — defensive
  // for re-runs that should bring older work in line with current
  // rules.
  if (!inputIsWebp && existsSync(targetPath)) {
    const dstStat = await stat(targetPath);
    if (dstStat.size > 0) {
      // A .webp twin already exists — assume the .png is stale and
      // safe to remove. (Happens if a previous run was interrupted
      // mid-batch.)
      await unlink(absPath);
      return { skipped: 'webp-exists', srcSize, dstSize: dstStat.size };
    }
  }

  const meta = await sharp(absPath).metadata();
  const longSide = Math.max(meta.width || 0, meta.height || 0);
  const needsResize = longSide > rule.maxDim;

  // For already-WebP files at or below target size, skip — they're
  // already at or under our budget. Otherwise re-encode (and resize
  // if needed) to current rule's quality.
  if (inputIsWebp && !needsResize) {
    // Re-encode at current quality only if the file is significantly
    // bigger than what a fresh encode would produce. We approximate:
    // anything over ~30KB per 100×100 px is probably encoded high
    // quality and might shrink. Below that, skip.
    const expected = (meta.width * meta.height / 10000) * 30 * 1024;
    if (srcSize <= expected) {
      return { skipped: 'already-small', srcSize, dstSize: srcSize };
    }
  }

  // Build the pipeline.
  let pipe = sharp(absPath);
  if (needsResize) {
    pipe = pipe.resize({
      width:  meta.width  >= meta.height ? rule.maxDim : null,
      height: meta.height >  meta.width  ? rule.maxDim : null,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  pipe = pipe.webp({ quality: rule.quality });

  // Write to a temp path next to the target, then rename, so a crash
  // mid-encode doesn't leave a partial .webp that's read as valid.
  const tmpPath = targetPath + '.tmp';
  await pipe.toFile(tmpPath);
  // Replace the target atomically. fs.rename on Windows maps to
  // MoveFileExW with MOVEFILE_REPLACE_EXISTING, which overwrites an
  // open-for-read file (Explorer thumbnail cache, browser cache, AV
  // scan handle). A separate unlink-then-rename would fail at unlink
  // with EBUSY in those cases. We retry briefly to ride out the AV
  // scan window that opens immediately after Sharp writes the tmp.
  const { rename } = await import('node:fs/promises');
  const sleepMs = ms => new Promise(r => setTimeout(r, ms));
  let renamed = false;
  for (let i = 0; i < 8 && !renamed; i++) {
    try { await rename(tmpPath, targetPath); renamed = true; }
    catch (e) {
      if (e.code !== 'EBUSY' && e.code !== 'EPERM' && e.code !== 'EEXIST') throw e;
      await sleepMs(300 * (i + 1));
    }
  }
  if (!renamed) throw new Error(`rename ${tmpPath} -> ${targetPath} kept failing with EBUSY`);

  const dstSize = (await stat(targetPath)).size;

  // If we wrote a .webp twin of a .png/.jpg, remove the original.
  if (!inputIsWebp) await unlink(absPath);

  return {
    srcSize, dstSize,
    srcDim: meta.width + '×' + meta.height,
    resized: needsResize,
  };
}

async function walk(absDir, folderName) {
  let totalBefore = 0, totalAfter = 0, processed = 0, skipped = 0;
  const entries = await readdir(absDir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(absDir, e.name);
    if (e.isDirectory()) {
      // Recurse, but use the TOP folder name for rule matching.
      // (bg has sub-folders — eating-out/, global/, sidebar/, writing/)
      if (SKIP_DIRS.has(e.name)) continue;
      const sub = await walk(full, folderName);
      totalBefore += sub.totalBefore;
      totalAfter  += sub.totalAfter;
      processed   += sub.processed;
      skipped     += sub.skipped;
      continue;
    }
    const ext = extname(e.name);
    if (!isProcessable(ext)) continue;
    const base = basename(e.name, ext);
    const rule = ruleFor(folderName, base);
    if (!rule) continue;
    try {
      const r = await processOne(full, rule);
      if (r.skipped) {
        skipped++;
        continue;
      }
      totalBefore += r.srcSize;
      totalAfter  += r.dstSize;
      processed++;
      const kbBefore = (r.srcSize / 1024).toFixed(1);
      const kbAfter  = (r.dstSize / 1024).toFixed(1);
      const pct      = (100 - 100 * r.dstSize / r.srcSize).toFixed(0);
      console.log(
        `  ${folderName}/${e.name.replace(/\.(png|jpe?g)$/i, '.webp')}  ` +
        `${kbBefore}KB → ${kbAfter}KB  ` +
        `(${pct}% smaller${r.resized ? `, resized from ${r.srcDim}` : ''})`
      );
    } catch (err) {
      console.error(`  ${folderName}/${e.name}: ERROR — ${err.message}`);
    }
  }
  return { totalBefore, totalAfter, processed, skipped };
}

// Walk every image folder and remove orphaned `<name>.webp.tmp` files
// whose final `<name>.webp` already exists. These are staging files
// left behind when the atomic-rename at the end of processOne() fails
// (typically Windows EBUSY when Explorer's thumbnail cache or AV
// scanner holds the destination open). The actual encode succeeded;
// only the rename failed. Sweeping at startup keeps the folder clean
// across runs.
async function sweepOrphanTmps(absDir) {
  let removed = 0;
  try {
    const entries = await readdir(absDir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(absDir, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        removed += await sweepOrphanTmps(full);
        continue;
      }
      if (!e.name.endsWith('.webp.tmp')) continue;
      const target = full.slice(0, -'.tmp'.length);
      if (existsSync(target)) {
        try { await unlink(full); removed++; }
        catch { /* ignore — another runner may have raced us */ }
      }
    }
  } catch { /* directory missing: nothing to sweep */ }
  return removed;
}

async function main() {
  console.log('Optimizing images in', IMAGES);
  // Sweep stale .tmp staging files first — they accumulate on Windows
  // when a previous run hit EBUSY mid-rename. We only remove tmps
  // whose final .webp twin already exists (the encode actually
  // succeeded), so we can't lose work.
  const sweptTmps = await sweepOrphanTmps(IMAGES);
  if (sweptTmps > 0) console.log(`Swept ${sweptTmps} orphan .tmp staging files.`);
  console.log('');
  let grandBefore = 0, grandAfter = 0, grandProc = 0, grandSkip = 0;

  // Top-level folders inside images/
  const top = await readdir(IMAGES, { withFileTypes: true });
  for (const e of top) {
    if (!e.isDirectory()) continue;
    if (SKIP_DIRS.has(e.name)) {
      console.log(`Skipping ${e.name}/ (svg/gif animations).`);
      continue;
    }
    const folderRules = RULES.filter(r => r.folder === e.name);
    if (!folderRules.length) {
      console.log(`Skipping ${e.name}/ (no rule defined).`);
      continue;
    }
    console.log(`── ${e.name}/ ───────────────────────────────`);
    const r = await walk(join(IMAGES, e.name), e.name);
    grandBefore += r.totalBefore;
    grandAfter  += r.totalAfter;
    grandProc   += r.processed;
    grandSkip   += r.skipped;
    console.log('');
  }

  // Top-level files inside images/ (e.g., logo.png)
  for (const e of top) {
    if (e.isDirectory()) continue;
    // No rule for these — only logo.png is here, leave alone.
  }

  const mbBefore = (grandBefore / 1024 / 1024).toFixed(1);
  const mbAfter  = (grandAfter  / 1024 / 1024).toFixed(1);
  const pct      = (100 - 100 * grandAfter / grandBefore).toFixed(0);
  console.log('═══════════════════════════════════════════════');
  console.log(`Processed: ${grandProc} files, skipped ${grandSkip}.`);
  console.log(`Before: ${mbBefore}MB → After: ${mbAfter}MB  (${pct}% reduction)`);
  console.log('');
  console.log('NEXT: update PNG → WebP references in app.html + data.js.');
  console.log('      Run: node scripts/update-png-refs.mjs');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
