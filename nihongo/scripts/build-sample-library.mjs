#!/usr/bin/env node
/*
 * build-sample-library.mjs — builds the Reader library from the repository
 * (data.js + heisig-data.js + images/), without the app running. Two outputs:
 *
 *   nihongo/reader-library/{manifest,cards,glossary,lessons}.json   (COMMITTED — served by the site
 *                              at <app origin>/nihongo/reader-library/; images are the site's own
 *                              images/ files, referenced by `sourcePath` and verified by sha256)
 *   reader-extension/fixtures/sample-library.zip                     (git-ignored; the same package
 *                              with the image bytes inside, for the import tests and manual import)
 *
 *   node scripts/build-sample-library.mjs                → ALL decks (the whole curriculum)
 *   node scripts/build-sample-library.mjs basic nature   → chosen deck ids
 *   (npm run build:library / build:sample-library)
 *
 * Identity is content-addressed so re-running without changes changes nothing:
 * `contentHash` = sha256 over cards + glossary + asset records; `snapshotId` =
 * `snap-<hash prefix>`; `revision` only increments when the hash changes (the
 * previous manifest is read back). The extension imports a snapshot once and
 * upgrades when a newer revision appears on the site.
 *
 * Image rules mirror app.js/image-slot.js: folder = card.imageFolder || cls.imageFolder || 'kanji';
 * key = folder/kanji; exts webp,png,jpg,jpeg; variants " (2..9)" until the first gap.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { zipSync, strToU8 } from 'fflate';
import { validate } from '../reader-core/contracts.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = path.join(DIR, 'images');
const OUT_DIR = path.join(DIR, 'reader-library');
const OUT_ZIP = path.join(DIR, 'reader-extension', 'fixtures', 'sample-library.zip');
const EXTS = ['webp', 'png', 'jpg', 'jpeg'];
const LIBRARY_ID = 'nihongo-curriculum';
const EXPORTER = '0.2.0-build-script';

// Load the classic data scripts in a sandbox; HEISIG is a lexical const, so expose it explicitly.
const sandbox = { window: {} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['data.js', 'heisig-data.js']) vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), sandbox, { filename: f });
vm.runInContext('this.__HEISIG = typeof HEISIG === "undefined" ? {} : HEISIG;', sandbox);
const W = sandbox.window;
const all = W.FLASHCARD_CLASSES || [];
const deckIds = process.argv.slice(2).length ? process.argv.slice(2) : all.map(c => c.id);
const classes = all.filter(c => deckIds.includes(c.id));
const HEISIG = sandbox.__HEISIG;
if (!classes.length) { console.error(`no classes matched ${deckIds.join(', ')}`); process.exit(1); }

function probeBases(imageKey) { const m = /^vocab\/(?!food\/)(.+)$/.exec(imageKey); return m ? ['vocab/food/' + m[1], imageKey] : [imageKey]; }
function fileFor(base, suffix) {
  for (const ext of EXTS) { const rel = `${base}${suffix}.${ext}`; const abs = path.join(IMAGES, rel); if (fs.existsSync(abs)) return { abs, ext, rel }; }
  return null;
}
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

const cards = [];
const assets = new Map(); // hash -> { record, abs }
let missingImages = 0;
for (const cls of classes) {
  let order = 0;
  for (const card of (cls.cards || [])) {
    const cardKey = `${cls.id}/${card.id}`;
    const rad = typeof card.radical === 'string' ? card.radical : (card.radical && typeof card.radical.glyph === 'string' ? card.radical.glyph : null);
    const glyph = typeof card.kanji === 'string' && card.kanji ? card.kanji : rad;
    const single = glyph && [...glyph].length === 1;
    const kind = card.type === 'radical' ? 'radical' : (card.vocabOnly || (glyph && !single) ? 'word' : 'kanji');
    const h = single && HEISIG[glyph] ? HEISIG[glyph] : null;
    const rec = {
      cardKey, classId: cls.id, cardIdOrGlyph: card.id, order: order++, kind, glyph,
      readings: { kun: card.kun || null, on: card.on || null },
      keyword: card.en ?? card.titleEn ?? null,
      story: h ? h.story : null,
      heisigFrame: h ? h.frame : null,
      examples: card.type === 'radical' ? [] : (card.examples || []).filter(e => e.word).map(e => ({ word: e.word, reading: e.reading, meaning: e.meaning })),
      image: null,
    };
    if (card.kanji && !card.digit) {
      const folder = card.imageFolder || cls.imageFolder || 'kanji';
      let found = null;
      for (const base of probeBases(`${folder}/${card.kanji}`)) { const f = fileFor(base, ''); if (f) { found = { base, f }; break; } }
      if (!found) missingImages++;
      else {
        const files = [{ variant: 1, ...found.f }];
        for (let n = 2; n <= 9; n++) { const f = fileFor(found.base, ` (${n})`); if (!f) break; files.push({ variant: n, ...f }); }
        for (const file of files) {
          const bytes = fs.readFileSync(file.abs);
          const hash = crypto.createHash('sha256').update(bytes).digest('hex');
          if (!assets.has(hash)) {
            const meta = await sharp(bytes).metadata();
            const ext = file.ext === 'jpeg' ? 'jpg' : file.ext;
            assets.set(hash, { abs: file.abs, record: { assetHash: hash, mime: MIME[file.ext], bytes: bytes.length, width: meta.width, height: meta.height, path: `assets/${hash}.${ext}`, sourcePath: `images/${file.rel}`, sourceKind: file.variant === 1 ? 'shipped' : 'shipped-variant', slotId: `flash-${card.id}`, imageKey: `${folder}/${card.kanji}`, variant: file.variant, framing: { fit: 'contain', s: 1, x: 0, y: 0 } } });
          }
          if (file.variant === 1) rec.image = { assetHash: hash, variant: 1 };
        }
      }
    }
    const v = validate('CardRecord', rec);
    if (!v.ok) { console.error(`${cardKey}: ${v.errors.join('; ')}`); process.exit(1); }
    cards.push(rec);
  }
}

// ── Glossary: English glosses the app already owns (no external dictionary) ──
const glossary = { words: {}, kanji: {} };
for (const d of (W.DICTIONARY || [])) if (d && d.kanji && d.en) glossary.words[d.kanji] = { reading: d.kana || null, meaning: d.en, source: 'dictionary' };
for (const cls of classes) for (const card of (cls.cards || [])) for (const e of (card.examples || [])) if (e && e.word && e.meaning && !glossary.words[e.word]) glossary.words[e.word] = { reading: e.reading || null, meaning: e.meaning, source: `example:${cls.id}/${card.id}` };
for (const [k, m] of Object.entries(W.KANJI_MEANINGS || {})) glossary.kanji[k] = { meaning: m, reading: (W.KANJI_READINGS || {})[k] || null, source: 'kanji-meanings' };
// Everyday kanji and game vocabulary, so the reader answers from its own
// files before it considers a translation API. The learner's own cards and
// dictionary entries are written after these and win any collision.
const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(path.join(DIR, p), 'utf8')); } catch { return null; } };
const kanjiIndex = readJSON('kanji-index.json');
let kanjidicCount = 0;
for (const [glyph, e] of Object.entries(kanjiIndex?.kanji || {})) {
  if (!e || !e.meaning) continue;
  glossary.kanji[glyph] = { meaning: e.meaning, reading: [e.kun?.[0], e.on?.[0]].filter(Boolean).join(' · ') || null, on: e.on || [], kun: e.kun || [], source: 'kanjidic' };
  kanjidicCount++;
}
const popCulture = readJSON('pop-culture.json');
let popCount = 0;
for (const e of (popCulture?.entries || [])) {
  if (!e || !e.word || !e.meaning) continue;
  const target = [...e.word].length === 1 ? glossary.kanji : glossary.words;
  target[e.word] = { meaning: e.meaning, reading: e.reading || null, source: 'pop-culture', tags: e.tags || [], seen: e.seen || '' };
  popCount++;
}
for (const c of cards) if (c.glyph && [...c.glyph].length === 1 && c.keyword) glossary.kanji[c.glyph] = { meaning: c.keyword, reading: [c.readings.kun, c.readings.on].filter(Boolean).join(' · ') || null, source: `card:${c.cardKey}` };

// ── Content-addressed identity ───────────────────────────────────────────────
const assetRecords = [...assets.values()].map(a => a.record).sort((a, b) => a.path.localeCompare(b.path));
const contentHash = crypto.createHash('sha256').update(JSON.stringify({ deckIds, cards, glossary, assets: assetRecords })).digest('hex');
console.log(`  kanji index ${kanjidicCount} (KANJIDIC2) · pop culture ${popCount}`);
let previous = null;
try { previous = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'manifest.json'), 'utf8')); } catch { /* first build */ }
const unchanged = previous && previous.contentHash === contentHash;
const revision = unchanged ? previous.revision : ((previous && previous.revision) || 0) + 1;
const exportedAt = unchanged ? previous.exportedAt : new Date().toISOString();

const manifest = {
  schemaVersion: 1,
  libraryId: LIBRARY_ID,
  snapshotId: `snap-${contentHash.slice(0, 12)}`,
  revision,
  contentHash,
  exportedAt,
  sourceAppUrl: 'https://khevin.com/nihongo/app.html',
  exporterVersion: EXPORTER,
  deckIds,
  files: { cards: 'cards.json', lessons: 'lessons.json', glossary: 'glossary.json' },
  assets: assetRecords,
  counts: { cards: cards.length, images: assets.size, missingImages },
};
const mv = validate('LibraryManifest', manifest);
if (!mv.ok) { console.error(mv.errors.join('\n')); process.exit(1); }

// ── Write the site package (JSON only) and the self-contained zip ────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'cards.json'), JSON.stringify(cards) + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'glossary.json'), JSON.stringify(glossary) + '\n');
fs.writeFileSync(path.join(OUT_DIR, 'lessons.json'), '[]\n');
fs.writeFileSync(path.join(OUT_DIR, 'README.md'), `# Nihongo Reader library (generated)\n\nGenerated by \`scripts/build-sample-library.mjs\` from data.js, heisig-data.js and images/. Do not edit by hand.\nServed by the site at \`/nihongo/reader-library/\`; the Chrome extension fetches \`manifest.json\`, imports a new \`revision\`,\nand loads each image from the site's own \`images/\` path named in \`sourcePath\`, verifying its sha256.\nRebuild after changing decks or images: \`npm run build:library\`.\n`);

const entries = {
  'manifest.json': strToU8(JSON.stringify(manifest, null, 2)),
  'cards.json': strToU8(JSON.stringify(cards)),
  'lessons.json': strToU8('[]'),
  'glossary.json': strToU8(JSON.stringify(glossary)),
};
for (const a of assets.values()) entries[a.record.path] = [new Uint8Array(fs.readFileSync(a.abs)), { level: 0 }];
const zip = zipSync(entries, { level: 6 });
fs.mkdirSync(path.dirname(OUT_ZIP), { recursive: true });
fs.writeFileSync(OUT_ZIP, zip);

const jsonBytes = ['manifest.json', 'cards.json', 'glossary.json', 'lessons.json'].reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0);
console.log(`build-library → reader-library/ (${(jsonBytes / 1024).toFixed(0)} KB json, ${unchanged ? 'unchanged' : 'NEW'} revision ${revision}, snapshot ${manifest.snapshotId}) + ${path.relative(DIR, OUT_ZIP)} (${(zip.length / 1024).toFixed(0)} KB)`);
console.log(`  decks ${deckIds.length} · ${cards.length} cards · ${assets.size} images (${missingImages} cards without image) · glossary ${Object.keys(glossary.words).length} words / ${Object.keys(glossary.kanji).length} kanji`);
