#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// update-png-refs.mjs
//
// Pairs with optimize-images.mjs. After the optimizer has converted
// PNGs to WebP and deleted the originals, this script rewrites the
// code references so the app loads the new files.
//
// Files touched:
//   - app.html  (HTML img srcs + CSS selectors + JS template strings)
//   - data.js   (foodImg / heroImageSrc / per-card image filenames)
//
// References we DO NOT touch:
//   - images/logo.png        — top-level, never converted
//   - placeholder.svg        — already SVG
//   - any .gif / .svg path   — preserved
//
// Strategy: regex over image-path patterns. We only rewrite `.png`
// when it's at the end of a token that looks like an image path
// (preceded by an alphanumeric / kana / extension-safe character).
// Won't touch comments mentioning `.png`, but those are harmless
// either way.
// ─────────────────────────────────────────────────────────────────────

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

const FILES = ['app.html', 'data.js'];

// Replace .png with .webp inside any image-looking string literal,
// but spare:
//   - images/logo.png            (stays PNG)
//   - any .png appearing in a // or /* */ comment (harmless either
//     way, but we leave them so the code's narrative still reads
//     the same — comments are descriptive, not executable)
//
// The replacement is two-pass:
//   PASS 1: rewrite the obvious `images/<folder>/<name>.png` paths
//           inside string/template literals to `.webp`.
//   PASS 2: rewrite bare filename values like 'sushi-maguro.png'
//           that are used in template constructions (e.g.,
//           foodImg:'sushi-maguro.png' resolved at runtime to
//           images/food/<foodImg>). Limited to strings of the form
//           ASCII-or-kana + .png inside quotes.

function rewrite(src) {
  let out = src;
  let changed = 0;

  // PASS 1 — paths in any string/template literal that include
  // `images/...png`. We DO NOT match when the path is `images/logo.png`.
  // The character class excludes only string delimiters / whitespace /
  // angle brackets — `{`, `}`, `(`, `)`, `$` are ALLOWED so paths
  // built inside template literals (e.g. `images/eating%20out/
  // ${escAttr(name)}.png`) are captured. Without this, the dynamic
  // image-builder helpers for eating-out / food / konbini / vocab
  // experiences would still point at the deleted .png files and the
  // whole gallery silently falls through to the placeholder SVG.
  out = out.replace(
    /(images\/(?!logo\.png\b)[^"'`\s<>]+?)\.png/g,
    (m, prefix) => { changed++; return prefix + '.webp'; }
  );

  // PASS 2 — bare filename values inside string literals (single,
  // double, or backtick). Restricted to names that look like image
  // filenames: ASCII letters/digits/underscore/dash plus a final
  // .png. Wide enough to catch food/konbini image names, narrow
  // enough to skip random `.png` strings that aren't filenames.
  out = out.replace(
    /(["'`])([A-Za-z0-9_\- ]+)\.png(\1)/g,
    (m, q, name, qEnd) => {
      // Don't rewrite "logo.png" — that one file stays PNG.
      if (name === 'logo') return m;
      changed++;
      return q + name + '.webp' + qEnd;
    }
  );

  return { out, changed };
}

async function main() {
  let totalChanged = 0;
  for (const f of FILES) {
    const path = join(ROOT, f);
    const before = await readFile(path, 'utf8');
    const { out, changed } = rewrite(before);
    if (out !== before) {
      await writeFile(path, out, 'utf8');
      console.log(`  ${f}: ${changed} reference${changed === 1 ? '' : 's'} updated`);
      totalChanged += changed;
    } else {
      console.log(`  ${f}: nothing to update`);
    }
  }
  console.log('');
  console.log(`Done. ${totalChanged} reference${totalChanged === 1 ? '' : 's'} converted from .png → .webp.`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
