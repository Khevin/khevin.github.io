#!/usr/bin/env node
/*
 * validate-data.mjs — referential-integrity + consistency checks for the
 * nihongo data files. The app trusts this data completely at render time and
 * fails SILENTLY on bad references (a stale id just drops the row), so this
 * is where typos get caught instead of in production.
 *
 *   node scripts/validate-data.mjs        (also wired into `npm run verify`)
 *
 * ERRORS (exit 1): dangling foreign keys, duplicate dictionary entries,
 *   script-variant texture tags that break reverse lookups.
 * WARNINGS (exit 0): editorial drift (gloss differences), descriptive-only
 *   texture tags, field-shape dialects — reported for awareness.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Evaluate the classic-script data files in a sandbox with a `window`.
const sandbox = { window: {} };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['data.js', 'heisig-data.js', 'particle-quiz-data.js',
                 'particle-lessons-data.js', 'particle-articles-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), sandbox, { filename: f });
}
const W = sandbox.window;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ── Collect the food world ──────────────────────────────────────────────────
const classes = W.VOCAB_CLASSES || [];
const ediblesById = new Map();
let flavorsBook = null, texturesBook = null;
for (const cls of classes) {
  for (const book of (cls.books || [])) {
    if (book.isEdiblesPage) {
      for (const cat of (book.categories || [])) {
        for (const item of (cat.items || [])) {
          if (!item.id) err(`edibles: item without id in category "${cat.id}" (${item.kana || item.kanji || '?'})`);
          else if (ediblesById.has(item.id)) err(`edibles: duplicate item id "${item.id}"`);
          else ediblesById.set(item.id, item);
        }
      }
    }
    if (book.isFlavorsPage) flavorsBook = book;
    if (book.isTexturesPage || book.textures) texturesBook = texturesBook || (book.textures ? book : null);
  }
}
const flavorIds = new Set((flavorsBook && flavorsBook.flavors || []).map(f => f.id));
const textures = (texturesBook && texturesBook.textures) || [];
const textureKanas = new Set(textures.map(t => t.kana));

// ── FK: edible.flavors[] → flavor ids ───────────────────────────────────────
for (const [id, item] of ediblesById) {
  for (const f of (item.flavors || [])) {
    if (!flavorIds.has(f)) err(`edibles."${id}".flavors: unknown flavor id "${f}"`);
  }
}

// ── FK: texture.foodPool[] / .staple → edible ids ──────────────────────────
for (const t of textures) {
  for (const fid of (t.foodPool || [])) {
    if (!ediblesById.has(fid)) err(`textures."${t.id}".foodPool: unknown edible id "${fid}" (row silently drops at render)`);
  }
  if (t.staple && !ediblesById.has(t.staple)) warn(`textures."${t.id}".staple: "${t.staple}" not in edibles (staple img resolves by filename, may still exist)`);
}

// ── Texture tags: script-variant collisions ────────────────────────────────
// findEdiblesWithTexture matches item.textures[] against the spectrum kana
// EXACTLY, so a hiragana spelling of a katakana texture (ぷちぷち vs プチプチ)
// silently breaks the reverse lookup. Purely descriptive tags that match no
// texture even after normalization are allowed (warn-level, for awareness).
const kataToHira = (s) => s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
const canonByNorm = new Map();
for (const k of textureKanas) canonByNorm.set(kataToHira(k), k);
const offTags = new Map();
for (const [id, item] of ediblesById) {
  for (const tag of (item.textures || [])) {
    if (textureKanas.has(tag)) continue;
    const canon = canonByNorm.get(kataToHira(tag));
    if (canon) err(`edibles."${id}".textures: "${tag}" is a script variant of spectrum texture "${canon}" — reverse lookup misses it`);
    else offTags.set(tag, (offTags.get(tag) || 0) + 1);
  }
}
if (offTags.size) {
  warn(`texture tags not on the 10-texture spectrum (descriptive only, no reverse lookup): ${[...offTags.entries()].map(([t, n]) => `${t}×${n}`).join(', ')}`);
}

// ── Flashcards: seeAlso targets must exist ──────────────────────────────────
// A target may be a kanji card OR a radical-interlude card (those key on
// `radical:` and carry no `kanji:` field). NOTE: the runtime seeAlso lookup
// currently resolves kanji cards only, so radical targets render as silent
// no-ops — valid data, dormant link (surfacing it is a UI decision).
const cards = (W.FLASHCARD_CLASSES || []).flatMap(c => c.cards || []);
const cardKanji = new Set(cards.map(c => c.kanji).filter(Boolean));
const radicalGlyphs = new Set(cards.filter(c => c.type === 'radical').map(c => c.radical).filter(Boolean));
for (const c of cards) {
  for (const target of (c.seeAlso || [])) {
    if (!cardKanji.has(target) && !radicalGlyphs.has(target)) {
      err(`flashcards."${c.kanji}".seeAlso: no card (kanji or radical) for "${target}"`);
    }
  }
}

// ── Dictionary: duplicates + gloss drift vs cards ───────────────────────────
const dictSeen = new Map();
for (const e of (W.DICTIONARY || [])) {
  const key = `${e.kind}|${e.kanji}`;
  if (dictSeen.has(key)) {
    const prev = dictSeen.get(key);
    const sameLevel = prev.level === e.level;
    err(`dictionary: duplicate ${e.kind} entry "${e.kanji}"${sameLevel ? '' : ` with CONFLICTING levels (${prev.level} vs ${e.level})`}`);
  } else dictSeen.set(key, e);
}
const cardByKanji = new Map(cards.filter(c => c.kanji).map(c => [c.kanji, c]));
let glossDrift = 0;
for (const e of (W.DICTIONARY || [])) {
  if (e.kind !== 'kanji') continue;
  const card = cardByKanji.get(e.kanji);
  if (card && card.en && e.en && card.en.toLowerCase() !== e.en.toLowerCase()) glossDrift++;
}
if (glossDrift) warn(`dictionary: ${glossDrift} kanji entries gloss differently than their flashcard (editorial drift — cards are the source of truth)`);

// ── Vocab page items: required fields per page type ────────────────────────
for (const cls of classes) {
  for (const book of (cls.books || [])) {
    for (const page of (book.pages || [])) {
      for (const [i, item] of (page.items || []).entries()) {
        if (page.type === 'cheatsheet' && (!item.kanji || !item.kana || !item.en))
          warn(`vocab ${book.id}/${page.id} item ${i}: cheatsheet item missing kanji/kana/en`);
        if (page.type === 'usage' && (!item.ja || !item.kana || !item.en))
          warn(`vocab ${book.id}/${page.id} item ${i}: usage item missing ja/kana/en`);
      }
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
for (const w of warnings) console.log('  ⚠ ' + w);
if (errors.length) {
  console.log('');
  for (const e of errors) console.log('  ✗ ' + e);
  console.log(`\n✗ data validation: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`✓ data validation clean — ${ediblesById.size} edibles, ${cards.length} cards, ${(W.DICTIONARY || []).length} dictionary entries checked (${warnings.length} warning(s))`);
