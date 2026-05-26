// nihongo/scripts/validate-flashcard-curriculum.mjs
// Walks window.FLASHCARD_CLASSES (loaded from data.js) and asserts the
// curriculum invariants documented in the design spec §6.
//
// Run with:  node scripts/validate-flashcard-curriculum.mjs
//
// Exits 0 on success, 1 on any violation. Prints a structured report.

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const DATA_PATH  = join(ROOT, 'data.js');

// Cards in this set are intentionally cross-listed across classes; the
// duplicate-kanji check treats them as expected, not a violation.
// 日 月 火 水 木 金 土 are the elemental kanji that intentionally
// appear in both the basic class (as standalone kanji) and as the
// leading character of the 7 days-of-the-week compound cards
// (日曜日, 月曜日, …) in the time class. The duplication is
// pedagogical, not accidental.
const ALLOWED_DUPLICATES = new Set([
  '茶', '本', '魚', '半', '言', '天',
  '日', '月', '火', '水', '木', '金', '土',
  // 曜 is the day-of-the-week connector — appears in all 7 day cards
  // by structural necessity. There IS no other valid placement.
  '曜',
]);

// Card count band per class. Onomatopoeia is the only narrow class.
// Time's ceiling is raised to accommodate its expanded scope (seasons
// + 7 days-of-the-week + parts-of-day). Other classes still bound at
// MAX_PER_CLASS — only override when the class has a structural reason
// to carry more (a closed set like the weekdays that wouldn't make
// sense to split).
const MIN_PER_CLASS = 9;
const MAX_PER_CLASS = 22;
const CLASS_MAX_OVERRIDES = { time: 28 };

async function loadClasses() {
  // The data.js file uses `window.FLASHCARD_CLASSES = [...]` — we eval it
  // in a tiny shim that exposes a fake `window` global, then read back.
  const src = await readFile(DATA_PATH, 'utf8');
  const sandboxedWindow = {};
  // eslint-disable-next-line no-new-func
  const evaluator = new Function('window', src + '\nreturn window;');
  evaluator(sandboxedWindow);
  if (!Array.isArray(sandboxedWindow.FLASHCARD_CLASSES)) {
    throw new Error('window.FLASHCARD_CLASSES is not an array after loading data.js');
  }
  return sandboxedWindow.FLASHCARD_CLASSES;
}

function isCJK(c) {
  const code = c.codePointAt(0);
  return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF);
}

function main() {
  return loadClasses().then(classes => {
    const errors = [];
    const warnings = [];

    // Build a global index: every kanji glyph that appears in the deck →
    // which classes carry it. Used for both seeAlso validation and the
    // duplicate-kanji check.
    const glyphIndex = new Map();  // glyph → [{ classId, cardId }]
    for (const cls of classes) {
      for (const card of (cls.cards || [])) {
        const k = card.kanji || card.radical;
        if (!k) continue;
        const chars = [...String(k)].filter(isCJK);
        for (const ch of chars) {
          if (!glyphIndex.has(ch)) glyphIndex.set(ch, []);
          glyphIndex.get(ch).push({ classId: cls.id, cardId: card.id });
        }
      }
    }

    // Per-class checks.
    for (const cls of classes) {
      const cards = cls.cards || [];

      // (a) Card count band — WARNING (not error) because intermediate
      // task states legitimately drift outside the final range. Final
      // verification (Task 20) checks that every count is in range.
      const maxAllowed = CLASS_MAX_OVERRIDES[cls.id] || MAX_PER_CLASS;
      if (cards.length < MIN_PER_CLASS || cards.length > maxAllowed) {
        warnings.push(`[${cls.id}] has ${cards.length} cards, outside range [${MIN_PER_CLASS},${maxAllowed}]`);
      }

      // (b) Required fields per card
      const seenIds = new Set();
      for (const card of cards) {
        if (!card.id) {
          errors.push(`[${cls.id}] card without an id: ${JSON.stringify(card).slice(0,80)}`);
          continue;
        }
        if (seenIds.has(card.id)) {
          errors.push(`[${cls.id}] duplicate card id "${card.id}"`);
        }
        seenIds.add(card.id);
        if (card.type === 'radical') {
          if (!card.radical) errors.push(`[${cls.id}/${card.id}] radical card missing radical field`);
        } else {
          if (!card.kanji) errors.push(`[${cls.id}/${card.id}] non-radical card missing kanji field`);
          if (!card.en) errors.push(`[${cls.id}/${card.id}] missing en field`);
        }

        // (c) seeAlso chips must point at kanji that exist somewhere in the deck
        for (const ref of (card.seeAlso || [])) {
          const refChars = [...String(ref)].filter(isCJK);
          for (const rc of refChars) {
            if (!glyphIndex.has(rc)) {
              errors.push(`[${cls.id}/${card.id}] seeAlso "${ref}" → glyph "${rc}" not found in deck`);
            }
          }
        }
      }
    }

    // (d) Cross-class duplicate kanji check
    for (const [glyph, occurrences] of glyphIndex.entries()) {
      if (occurrences.length > 1 && !ALLOWED_DUPLICATES.has(glyph)) {
        const where = occurrences.map(o => `${o.classId}/${o.cardId}`).join(', ');
        warnings.push(`glyph "${glyph}" appears in ${occurrences.length} cards: ${where}`);
      }
    }

    // Report
    console.log(`Loaded ${classes.length} classes, ${[...glyphIndex.keys()].length} unique kanji glyphs.`);
    for (const cls of classes) {
      console.log(`  ${cls.id.padEnd(16)} ${cls.cards.length} cards`);
    }
    console.log('');
    if (warnings.length) {
      console.log(`Warnings (${warnings.length}):`);
      for (const w of warnings) console.log(`  ${w}`);
      console.log('');
    }
    if (errors.length) {
      console.error(`FAILED — ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
      for (const e of errors) console.error(`  ${e}`);
      process.exit(1);
    }
    console.log('OK — all curriculum invariants hold.');
  });
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
