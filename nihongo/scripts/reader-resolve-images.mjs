#!/usr/bin/env node
/*
 * reader-resolve-images.mjs — M0 spike for the Nihongo Reader extension.
 *
 * Resolves, for every flashcard in window.FLASHCARD_CLASSES, the image the
 * editorial card renderer would show, using the SAME rules as app.js /
 * image-slot.js but from the filesystem instead of the DOM:
 *
 *   slot id    = `flash-${card.id}`                       (app.js editorialFlashcardHTML)
 *   folder     = card.imageFolder || cls.imageFolder || 'kanji'
 *   image key  = `${folder}/${card.kanji}`
 *   candidates = ./images/<key>.{webp,png,jpg,jpeg}       (image-slot.js _imageExts order)
 *   variants   = ./images/<key> (2..9).<ext>, stop at first gap (image-slot.js _probeVariants)
 *
 * Custom (IndexedDB) images are out of scope here: every flashcard slot is
 * `readonly`, so no `flash-*` entry can exist in the store today.
 *
 *   node scripts/reader-resolve-images.mjs            → prints a summary
 *   node scripts/reader-resolve-images.mjs --write    → also writes
 *       reader-extension/fixtures/image-resolution.json
 *
 * Read-only against the app: it never modifies data.js or images/.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = path.join(DIR, 'images');
const OUT = path.join(DIR, 'reader-extension', 'fixtures', 'image-resolution.json');
const EXTS = ['webp', 'png', 'jpg', 'jpeg'];
const WRITE = process.argv.includes('--write');

// Evaluate data.js in a sandbox with a `window`, like validate-data.mjs.
const sandbox = { window: {} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR, 'data.js'), 'utf8'), sandbox, { filename: 'data.js' });
const classes = sandbox.window.FLASHCARD_CLASSES || [];

// image-slot.js rewrites vocab/<x> (but not vocab/food/<x>) to try vocab/food/<x> first.
function probeBases(imageKey) {
  const m = /^vocab\/(?!food\/)(.+)$/.exec(imageKey);
  return m ? ['vocab/food/' + m[1], imageKey] : [imageKey];
}

function fileFor(base, suffix) {
  for (const ext of EXTS) {
    const rel = `${base}${suffix}.${ext}`;
    const abs = path.join(IMAGES, rel);
    if (fs.existsSync(abs)) return { rel: `images/${rel}`, abs, ext };
  }
  return null;
}

async function describe(file) {
  const bytes = fs.readFileSync(file.abs);
  const meta = await sharp(bytes).metadata();
  return {
    path: file.rel,
    ext: file.ext,
    bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    width: meta.width,
    height: meta.height,
    format: meta.format,
  };
}

const cards = [];
const idIndex = new Map();     // card.id -> [cardKey]
const kanjiIndex = new Map();  // card.kanji -> [cardKey]

for (const cls of classes) {
  for (const card of (cls.cards || [])) {
    const cardKey = `${cls.id}/${card.id}`;
    idIndex.set(card.id, [...(idIndex.get(card.id) || []), cardKey]);
    const folder = card.imageFolder || cls.imageFolder || 'kanji';
    const rec = {
      cardKey,
      classId: cls.id,
      cardId: card.id,
      kanji: card.kanji ?? null,
      kind: card.type === 'radical' ? 'radical' : (card.vocabOnly ? 'word' : 'kanji'),
      slotId: `flash-${card.id}`,
      folder,
      imageKey: card.kanji ? `${folder}/${card.kanji}` : null,
      status: null,
      reason: null,
      images: [],
    };
    if (card.kanji) kanjiIndex.set(card.kanji, [...(kanjiIndex.get(card.kanji) || []), cardKey]);

    if (!card.kanji) {
      rec.status = 'unavailable'; rec.reason = 'no-kanji-field';
    } else if (card.digit) {
      // Renderer draws a numeral instead of mounting the slot.
      rec.status = 'unavailable'; rec.reason = 'digit-card-renders-numeral';
    } else {
      let found = null;
      for (const base of probeBases(rec.imageKey)) {
        const f = fileFor(base, '');
        if (f) { found = { base, file: f }; break; }
      }
      if (!found) {
        rec.status = 'missing'; rec.reason = `no file ./images/${rec.imageKey}.{${EXTS.join(',')}}`;
      } else {
        rec.status = 'found';
        rec.images.push({ variant: 1, ...(await describe(found.file)) });
        for (let n = 2; n <= 9; n++) {
          const f = fileFor(found.base, ` (${n})`);
          if (!f) break;
          rec.images.push({ variant: n, ...(await describe(f)) });
        }
      }
    }
    cards.push(rec);
  }
}

// ── Totals ──────────────────────────────────────────────────────────────────
const byStatus = (s) => cards.filter(c => c.status === s);
const found = byStatus('found');
const missing = byStatus('missing');
const totalBytes = found.reduce((a, c) => a + c.images.reduce((b, i) => b + i.bytes, 0), 0);
const variantFiles = found.reduce((a, c) => a + (c.images.length - 1), 0);
const distinctHashes = new Set(found.flatMap(c => c.images.map(i => i.sha256))).size;

const perClass = classes.map(cls => {
  const rows = cards.filter(c => c.classId === cls.id);
  return {
    classId: cls.id,
    folder: cls.imageFolder || 'kanji',
    cards: rows.length,
    found: rows.filter(c => c.status === 'found').length,
    missing: rows.filter(c => c.status === 'missing').length,
    unavailable: rows.filter(c => c.status === 'unavailable').length,
  };
});

const duplicateIds = [...idIndex].filter(([, ks]) => ks.length > 1).map(([id, ks]) => ({ id, cardKeys: ks, slotId: `flash-${id}` }));
const duplicateKanji = [...kanjiIndex].filter(([, ks]) => ks.length > 1).map(([kanji, ks]) => ({ kanji, cardKeys: ks }));

const summary = {
  generatedAt: new Date().toISOString(),
  source: 'data.js window.FLASHCARD_CLASSES + images/ (filesystem probe)',
  rules: 'slot=flash-${card.id}; folder=card.imageFolder||cls.imageFolder||kanji; key=folder/kanji; exts webp,png,jpg,jpeg; variants " (2..9)" until first gap',
  totals: {
    classes: classes.length,
    cards: cards.length,
    withKanjiField: cards.filter(c => c.kanji).length,
    found: found.length,
    missing: missing.length,
    unavailable: byStatus('unavailable').length,
    imageFiles: found.reduce((a, c) => a + c.images.length, 0),
    variantFiles,
    distinctHashes,
    totalBytes,
    totalMiB: +(totalBytes / 1048576).toFixed(2),
    largestFileBytes: Math.max(0, ...found.flatMap(c => c.images.map(i => i.bytes))),
    maxDimension: Math.max(0, ...found.flatMap(c => c.images.map(i => Math.max(i.width || 0, i.height || 0)))),
  },
  perClass,
  duplicateCardIds: duplicateIds,
  duplicateKanji,
  missing: missing.map(c => ({ cardKey: c.cardKey, kanji: c.kanji, imageKey: c.imageKey })),
};

// ── Print ───────────────────────────────────────────────────────────────────
const t = summary.totals;
console.log(`reader-resolve-images — ${t.classes} classes, ${t.cards} cards`);
console.log(`  found ${t.found} · missing ${t.missing} · unavailable ${t.unavailable} (radical/digit)`);
console.log(`  files ${t.imageFiles} (${t.variantFiles} variants) · ${t.distinctHashes} distinct hashes · ${t.totalMiB} MiB · largest ${t.largestFileBytes} B · max side ${t.maxDimension}px`);
console.log('\n  class            folder      cards found missing unavail');
for (const r of perClass) {
  console.log(`  ${r.classId.padEnd(16)} ${r.folder.padEnd(11)} ${String(r.cards).padStart(5)} ${String(r.found).padStart(5)} ${String(r.missing).padStart(7)} ${String(r.unavailable).padStart(7)}`);
}
console.log(`\n  duplicate card.id across classes (slot-id collision): ${duplicateIds.map(d => `${d.slotId} ← ${d.cardKeys.join(', ')}`).join('; ') || 'none'}`);
console.log(`  duplicate kanji across classes: ${duplicateKanji.map(d => `${d.kanji} ← ${d.cardKeys.join(', ')}`).join('; ') || 'none'}`);
const multi = found.filter(c => c.images.length > 1);
console.log(`  cards with variants: ${multi.map(c => `${c.cardKey} ×${c.images.length}`).join(', ') || 'none'}`);

if (WRITE) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ summary, cards }, null, 2) + '\n');
  console.log(`\n  wrote ${path.relative(DIR, OUT)}`);
}
