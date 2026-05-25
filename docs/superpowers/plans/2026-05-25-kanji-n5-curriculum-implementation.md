# Kanji N5 Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the Nihongo flashcard deck from its current ~104 unique kanji across 18 uneven classes to ≈130 unique kanji across 16 didactic, radical-ordered classes (~100 official JLPT N5 + ~30 useful N4/N3 exceptions), and teach the back-face stroke-order panel to handle compound cards (元気) and kana-only cards (にこにこ) correctly.

**Architecture:** Primarily a data change in `nihongo/data.js`. One small renderer change in `editorialFlashcardHTML` (`nihongo/app.html`) to split the stroke-order panel across each kanji in a multi-glyph `card.kanji` and skip it entirely for pure-kana cards. A new validation script catches broken `seeAlso` chips, missing card fields, and per-class count drift. Ships in four staged batches (Cleanup → Reshape → Add new → Radical interludes) so each commit is independently safe.

**Tech Stack:** Vanilla JS modules (no test framework, no bundler). `data.js` is a `window.FLASHCARD_CLASSES = [...]` declaration loaded directly into `app.html`. Validation script runs under Node ≥18 with no dependencies (parses `data.js` text-mode and reflects via a JSDOM-lite shim built into the script). Static Python HTTP server (`py -m http.server 8766`) hosts the live preview at `nihongo/app.html` for visual verification.

---

## Reference: the design spec

Every per-class card list, ordering rationale, and policy lives in `docs/superpowers/specs/2026-05-25-kanji-n5-curriculum-design.md`. Sections referenced from this plan:

- §2 — 16-class inventory + change counts (use to verify card counts at each task)
- §3.1 – §3.16 — per-class card lists (Basic, Numbers, Colors, People, Body, Nature, Sky & Seasons, Time, School, Animals, Places, Rooms, Food & Drink, Verbs, Adjectives, Onomatopoeia)
- §4.1 — radical-interlude policy (when ◆ card vs inline)
- §4.2 — `seeAlso` chip convention
- §4.3 — compound-card policy (keep / demote to `usage` / drop)
- §4.4 — back-face stroke order rule
- §4.5 — retroactive audit

Open the spec in a separate tab while implementing; you'll reference it constantly.

---

## File structure

Three files touched:

```
nihongo/
├── data.js                                        # Edit — restructure FLASHCARD_CLASSES
├── app.html                                       # Edit — editorialFlashcardHTML (~line 15254)
└── scripts/
    └── validate-flashcard-curriculum.mjs          # Create — node validation script
```

`data.js` schema unchanged. `app.html` renderer change touches one function. No bundler, no build step — reload the browser to see changes.

---

## Task 0: Build the validation script (run after every later task)

**Files:**
- Create: `nihongo/scripts/validate-flashcard-curriculum.mjs`

- [ ] **Step 1: Create the script file with the validator**

```js
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
const ALLOWED_DUPLICATES = new Set(['茶', '本', '魚', '半']);

// Card count band per class. Onomatopoeia is the only narrow class.
const MIN_PER_CLASS = 9;
const MAX_PER_CLASS = 22;

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
      if (cards.length < MIN_PER_CLASS || cards.length > MAX_PER_CLASS) {
        warnings.push(`[${cls.id}] has ${cards.length} cards, outside final range [${MIN_PER_CLASS},${MAX_PER_CLASS}]`);
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
```

- [ ] **Step 2: Run it against the current (pre-change) deck to confirm it works**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected on the pre-change deck: Loads 18 classes, prints per-class counts, prints warnings about (a) stub classes below the 9-card floor (`drinks:1`, `food:1`, `concepts:2`, `people2:2`, `body2:6`) and (b) cross-class glyph duplicates (姉妹/兄弟 compound cards still present). Exits 0 — no hard errors. Final Task 20 verifies all warnings have cleared (or are intentional cross-listings).

If the script throws or exits non-zero (i.e. hits an actual error from §(b) Required fields / §(c) seeAlso refs / §(d) duplicate ids), fix the data first — that's a structural bug, not a count drift.

- [ ] **Step 3: Commit**

```bash
cd nihongo
git add scripts/validate-flashcard-curriculum.mjs
git commit -m "nihongo: add flashcard curriculum validation script

Walks window.FLASHCARD_CLASSES and asserts per-class card counts,
required card fields, no duplicate ids within a class, valid
seeAlso targets, and tolerated cross-class duplicates (茶, 本, 魚,
半).

Run via: node scripts/validate-flashcard-curriculum.mjs"
```

---

## Batch 1 — Cleanup

Move existing cards into their new homes. No new content yet; just deletion + relocation.

---

## Task 1: Drop the 5 stub classes; relocate their cards

**Files:**
- Modify: `nihongo/data.js` (search for the relevant class blocks)

The stub classes to delete entirely: `drinks` (1 card: 茶), `food` (1 card: 御飯), `concepts` (2 cards: 音, 双), `people2` (2 cards: 赤ちゃん, 双子), `body2` (6 cards: 頭, 顔, 髪, 歯, 鼻, 腕).

Relocation rules (spec §2 / §3):
- 茶 → temporarily into `colors` (its final cross-listed home; also moves to `food-drink` later in Task 15)
- 御飯 → temporarily park as a card at the end of `food` block — wait, that block is being deleted. Actually park 御飯 in `colors` as a marker, no — just delete the class for now and Task 15 will recreate it. Capture 御飯's full card object in a scratch comment near the deleted block so Task 15 can paste it back.
- 音 → drop entirely (not in final spec — §3.7 doesn't include it; was a mis-shelved card in `concepts`)
- 双 → into `people` (already there as `id:'pair'` per spec §3.4 line 17 — verify it exists; if duplicate, deduplicate)
- 赤ちゃん, 双子 → drop standalone cards; their content lives in the existing People cards' `usage` or `examples` fields (spec §3.4 explicitly says "absorbs from `people2`: 赤ちゃん, 双子 → folded into the existing People examples / usage chips, not full new cards")
- 頭, 顔, 髪, 歯, 鼻, 腕 → into `body` (Task 6 will reorder Body to include them in the final order; for now, just paste them at the end of `body`'s cards array as a no-op move)

- [ ] **Step 1: Locate the 5 stub class blocks in `data.js`**

Run: `cd nihongo && grep -n "id: '\(drinks\|food\|concepts\|people2\|body2\)'" data.js`

Expected output (line numbers approximate): roughly lines 1780, 1796, 1648, 1880, 1938 per the inventory done earlier.

- [ ] **Step 2: Move 頭/顔/髪/歯/鼻/腕 cards from `body2` into `body` (append at end of body.cards)**

Open the file, find the `body2` class block, copy the 6 card objects, paste them inside the `body` class's `cards: [ ... ]` array just before the closing `]`. Final order will be set in Task 6 — for now, just relocate.

- [ ] **Step 3: Verify 双 is already in `people` as `id:'pair'`**

Run: `cd nihongo && grep -n "id:'pair'\|kanji:'双'" data.js`

Expected: one match in the `people` class. If absent, copy 双's full card from `concepts` into `people` (Task 5 will set the final position).

- [ ] **Step 4: Delete the 5 stub class blocks**

Delete the entire `{ id: 'drinks', ... }`, `{ id: 'food', ... }`, `{ id: 'concepts', ... }`, `{ id: 'people2', ... }`, `{ id: 'body2', ... }` objects from `FLASHCARD_CLASSES`. Mind the trailing commas — each one's outer comma should also be removed if it leaves a dangling `,]` at the array end.

Note: Save the full card objects for 茶 and 御飯 into a scratch comment block just above `window.FLASHCARD_CLASSES = [` so Tasks 14 (Colors gets 茶 with proper examples) and 15 (Food & Drink gets both back) can paste them in. Use the exact existing data — currently at data.js lines ~1785 (茶) and ~1801 (御飯):

```js
// ── SCRATCH (delete after Tasks 14 + 15 land) ────────────────────
// Saved for relocation when the drinks/food stub classes are dropped:
//
// 茶 (from old `drinks` class):
//   { id:'tea', kanji:'茶', kun:'ちゃ', on:'チャ', en:'tea',
//     strokes:9,
//     usage:{ ja:'お茶', kana:'おちゃ' },
//     examples:[
//       {word:'お茶',     reading:'ocha',     meaning:'tea (polite)'},
//       {word:'紅茶',     reading:'kōcha',    meaning:'black tea'},
//       {word:'抹茶',     reading:'matcha',   meaning:'matcha (powdered green tea)'},
//       {word:'喫茶店',   reading:'kissaten', meaning:'café'},
//     ] }
//
// 御飯 (from old `food` class):
//   { id:'gohan', kanji:'御飯', kun:'ごはん', on:'', en:'cooked rice / meal',
//     notes:'御 [go] is the honorific prefix that softens 飯 [han, meal] into everyday polite speech. Often written ご飯 with the prefix in hiragana.',
//     examples:[
//       {word:'御飯を食べる', reading:'gohan o taberu', meaning:'to eat a meal'},
//       // ... copy the remaining 2-3 examples from the original card at line ~1804
//     ] }
```

The 茶 card's `kun` field is empty in the source — populated to `'ちゃ'` above to align with N5 standard reading. Verify against the original before pasting.

- [ ] **Step 5: Run validation**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected: Loads 13 classes (was 18). `body` now reports ~23 cards (might exceed MAX_PER_CLASS=22 — that's OK, Task 6 trims it). If the script errors on the count, temporarily bump the body cards' arrangement.

- [ ] **Step 6: Live preview verification**

Run the static server (already in `.claude/launch.json`):
```bash
# from repo root, not nihongo/:
py -m http.server 8766
```
Open `http://localhost:8766/nihongo/app.html#vocab` → click the Flashcards bookmark. Confirm:
- The sidebar shows 13 categories (no Drinks, Food, Concepts, People2, Body2)
- Clicking each remaining category loads cards
- Body category shows 頭/顔/髪/歯/鼻/腕 at the END (final order comes in Task 6)

- [ ] **Step 7: Commit**

```bash
cd nihongo
git add data.js
git commit -m "nihongo: drop 5 stub flashcard classes, relocate their cards

Removes drinks/food/concepts/people2/body2. Body2's 6 cards
(頭顔髪歯鼻腕) appended to Body; final ordering in a later commit.
茶 and 御飯 captured in a scratch comment above FLASHCARD_CLASSES
for re-injection when Colors/Food&Drink are rebuilt.

赤ちゃん/双子/音 drop; their meaning lives on parent cards via
usage/examples fields (spec §4.3)."
```

---

## Task 2: Fold compound cards into parent `usage` fields

**Files:**
- Modify: `nihongo/data.js` (Time and People classes mostly)

Per spec §4.3, these compound cards drop as standalone flashcards. Their kana/reading lives on the parent kanji's `usage:{ja, kana}` field so the front face still shows the common phrase.

Compounds to demote:
- 姉妹 → already covered by 姉's `usage:{ja:'お姉さん', kana:'おねえさん'}` (verify present; if a separate `姉妹` card exists, delete it)
- 兄弟 → covered by 兄's `usage:{ja:'お兄さん', kana:'おにいさん'}` (same — verify, delete dup)
- 黄色 → covered by 黄's `usage:{ja:'黄色', kana:'きいろ'}` (add to 黄's card if absent)
- 今日 / 今週 / 今月 / 今年 → covered by 今's `usage:{ja:'今日', kana:'きょう'}` (only one usage chip per card; pick the most common — 今日 — and leave the rest as `examples` on the 今 card)
- 去年 / 来年 → covered by 去's or 来's `usage`. Since 去 drops entirely (spec §3.8) and 来 moves to Verbs, fold 去年 as an `examples` entry on 来's card (`{word:'去年', reading:'kyonen', meaning:'last year'}`) and same for 来年.
- 先生 → fold into 先's `usage:{ja:'先生', kana:'せんせい'}`.

- [ ] **Step 1: Find all standalone compound cards (kanji length > 1)**

Run: `cd nihongo && node -e "
const fs = require('fs');
const sandboxedWindow = {};
const src = fs.readFileSync('data.js','utf8');
new Function('window', src+';return window;')(sandboxedWindow);
for (const cls of sandboxedWindow.FLASHCARD_CLASSES) {
  for (const card of cls.cards || []) {
    const k = card.kanji || '';
    if ([...k].length > 1) console.log(cls.id + '/' + card.id + ': ' + k);
  }
}
"`

Expected output (from current state): compound cards like `time/today: 今日`, `time/this-week: 今週`, `people/shimai: 姉妹`, etc.

- [ ] **Step 2: For each compound listed, delete the card and ensure its kana is on a parent card**

Specific edits:

**Time class** — delete cards with these `id`s if present: `today` (今日), `this-week` (今週), `this-month` (今月), `this-year` (今年), `last-year` (去年), `next-year` (来年), `teacher` (先生). Before deleting:
- Verify 今's card has `usage: { ja:'今日', kana:'きょう' }`. If absent, add it.
- Verify 先's card has `usage: { ja:'先生', kana:'せんせい' }`. If absent, add it.
- If 来 doesn't have an `examples` entry for `来年`, add `{word:'来年', reading:'rainen', meaning:'next year'}`. (来 lives in Time still in this batch; it moves to Verbs in Task 16.)
- Add a `来's examples` entry for 去年: `{word:'去年', reading:'kyonen', meaning:'last year'}` so the meaning isn't lost when 去 drops.

**People class** — delete cards with these `id`s if present: `shimai` (姉妹), `kyoudai` (兄弟). Verify 姉's `usage` already has `お姉さん` and 兄's has `お兄さん` (the dump showed they do; if not, add).

**Colors class** — if a standalone `黄色` card exists, delete it and add `usage:{ja:'黄色', kana:'きいろ'}` to the 黄 card.

- [ ] **Step 3: Run validation**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected: Total card count drops by ~10. Time class shrinks. Warnings about cross-class glyph duplicates should be reduced.

- [ ] **Step 4: Live preview verification**

Reload `app.html#flashcards` in the browser. In list view (top toggle: `list`), confirm:
- Time class no longer shows 今日/今週/今月/今年/去年/来年/先生 as separate rows
- People class no longer shows 姉妹 or 兄弟 separately
- Colors class no longer shows 黄色
- The front face of 今 / 先 / 姉 / 兄 / 黄 / 来 still shows the demoted compound as a usage chip below the glyph

- [ ] **Step 5: Commit**

```bash
cd nihongo
git add data.js
git commit -m "nihongo: demote transparent compound cards into parent usage

姉妹, 兄弟, 黄色, 今日/今週/今月/今年, 去年, 来年, 先生 are no
longer standalone flashcards. Their reading lives on the parent
kanji's usage:{ja, kana} field (today/teacher) or as an examples
entry (last year, next year). Spec §4.3.

去's last-year meaning preserved on 来's examples since 去 drops
entirely in a later commit. 来 still in Time class here; moves to
Verbs in batch 3."
```

---

## Batch 2 — Reshape existing classes

Rename two class ids and reorder every kept class to match spec §3.

---

## Task 3: Rename `nature2` → `sky-seasons` and `directions` → `places`

**Files:**
- Modify: `nihongo/data.js`

Two class ids change. Titles, glyphs, and content stay (content reorders in later tasks). Verify that nothing in the rest of the app references the old ids.

- [ ] **Step 1: Find every reference to the old ids**

Run: `cd nihongo && grep -nE "(nature2|'directions')" data.js app.html`

Expected: matches in `data.js` (the class definitions, plus any `imageFolder` strings) and possibly in `app.html` (renderer defaults — check if `'directions'` is hard-coded anywhere).

- [ ] **Step 2: Rename in `data.js`**

Change:
- `{ id: 'nature2', titleJa: 'しぜん 2', titleEn: 'Nature 2', ... }` → `{ id: 'sky-seasons', titleJa: 'そらときせつ', titleEn: 'Sky & Seasons', glyph: '空', ... }`
- `{ id: 'directions', titleJa: 'ほうこう', titleEn: 'Directions', ... }` → `{ id: 'places', titleJa: 'ばしょ', titleEn: 'Places & Compass', glyph: '東', ... }`

Glyph 空 picked because that class's most prominent visual is 空 (after the reorder); glyph 東 picked because it's the new top of Places (after 上下左右中, the compass cards start at 東).

- [ ] **Step 3: Update any string references in `app.html`**

Search results from Step 1 — if any `'directions'` or `'nature2'` literal exists in `app.html` (e.g., in default bg-folder maps), replace with the new id. The flashcard renderer (`renderFlashcards`) reads `cls.id` dynamically; no changes there.

- [ ] **Step 4: Run validation**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected: Sees `sky-seasons` and `places` ids; total card count unchanged.

- [ ] **Step 5: Live preview verification**

Reload. Sidebar shows the renamed categories with their new titles and glyphs. Clicking each loads the same content as before (positions unchanged for now).

- [ ] **Step 6: Commit**

```bash
cd nihongo
git add data.js app.html
git commit -m "nihongo: rename flashcard class ids nature2 → sky-seasons, directions → places

Content unchanged; just the id, glyph, and title. The Sky & Seasons
class will absorb new sky/season kanji in batch 3; Places & Compass
absorbs 東西南北 + 王/国/家/店/駅 (spec §3.11)."
```

---

## Task 4: Reorder & trim Basic class — final 15 cards

**Files:**
- Modify: `nihongo/data.js` — the `basic` class's `cards: [ ... ]` array

Replace the existing Basic cards array with the order defined in spec §3.1:

```
日 月 山 川 木 火 水 土 田 大 小 円 玉 金 車
```

The card objects (with `kun`, `on`, `en`, `examples`) already exist for most of these in the current `basic` class. The work is:
1. Remove the cards being moved out (王 → Places in Task 12, 生 → School in Task 10, 国 → Places in Task 12, 立 → Verbs in Task 16, 力/刀/弓/糸 → drop or seeAlso-only).
2. Reorder the remaining 15 cards to match the spec order.
3. 金 and 車 may already exist in Basic — verify and keep.

- [ ] **Step 1: Read spec §3.1 (lines 60–80 of the spec file) into context**

Run: `cat docs/superpowers/specs/2026-05-25-kanji-n5-curriculum-design.md | sed -n '60,80p'`

Confirm the 15-card list and the "Moves out of current `basic`" notes.

- [ ] **Step 2: In data.js, find and isolate the current Basic class**

Run: `cd nihongo && grep -n "id: 'basic'" data.js`

Note the line number. The class block spans from `{ id: 'basic', ...` to its closing `},` — typically ~25 lines.

- [ ] **Step 3: Reorder the Basic class cards array**

Open data.js, navigate to the Basic class. Replace the existing `cards: [ ... ]` array with these 15 entries in order. Keep each card's existing fields (`kun`, `on`, `en`, `strokes`, `examples`) intact — only the order and membership change.

```
1. 日 (existing — keep all fields)
2. 月 (existing)
3. 山 (existing — current id 'mtn')
4. 川 (existing — current id 'river')
5. 木 (existing)
6. 火 (currently in nature; MOVE — copy the card here, delete from nature)
7. 水 (currently in nature; MOVE)
8. 土 (currently in nature; MOVE)
9. 田 (existing — id 'ricefield')
10. 大 (existing — id 'big')
11. 小 (existing — id 'small')
12. 円 (existing — id 'yen')
13. 玉 (existing — id 'jewel')
14. 金 (existing — id 'gold')
15. 車 (existing — id 'vehicle')
```

For cards in steps 6–8 (火/水/木 — wait, 木 already in basic): only 火, 水, 土 actually move from `nature` into `basic`. 木 stays in basic. Open the `nature` class, cut the 火/水/土 card objects, paste them in their new Basic positions.

Cards to delete from Basic (no relocation, they drop or move to other classes Tasks 5/10/12/16):
- 宀 (id: 'roof') — drop here; Rooms will recreate as ◆ radical card in Task 18
- 刀, 力, 弓, 糸 — drop (referenced inline on cards in Verbs and elsewhere via seeAlso text)
- 王 — leave in place temporarily; Task 12 (Places) will move it
- 生 — leave in place temporarily; Task 10 (School) will move it
- 国 — leave in place temporarily; Task 12 will move it
- 立 — leave in place temporarily; Task 16 will move it
- 町, 村, 市 — drop (referenced via seeAlso on Places kanji per spec §3.11)

- [ ] **Step 4: Run validation**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected: Basic = 15 cards (plus the four cards still parked in-place that move in later tasks → 19 temporarily). Nature shrinks by 3 (火水土 moved out). No `seeAlso` errors yet.

- [ ] **Step 5: Live preview**

Reload. Open Basic → verify the order: 日月山川木火水土田大小円玉金車. Spot-check that 日 still shows readings and examples (proves the card object copied intact).

- [ ] **Step 6: Commit**

```bash
cd nihongo
git add data.js
git commit -m "nihongo: reorder Basic class to 15-card pictographic foundation

日月山川木火水土田大小円玉金車 — pictographs only. 火/水/土 moved
in from Nature; 刀/力/弓/糸/町/村/市/宀 dropped (referenced via
seeAlso or inline elsewhere). 王/生/国/立 still parked in Basic and
move out in later tasks (Places, School, Verbs)."
```

---

## Task 5: Reorder & trim People class — final 17 cards

**Files:**
- Modify: `nihongo/data.js` — the `people` class's `cards: [ ... ]` array

Final order per spec §3.4:
```
人 ◆亻 休 入 子 女 好 母 姉 妹 父 男 兄 弟 ◆hands 友 双
```

(◆亻 and ◆hands are radical-interlude cards already present in the current deck under their existing ids `person-radical` and `hands-radical`.)

- [ ] **Step 1: Reorder People's cards array**

Pin the 17 entries in the order above. Drop these existing cards from People: `worker` (仕), `what` (何), `take` (取), `receive` (受), `oppose` (反) — they go to Verbs (Task 16) or drop. Verify 友 and 双 are present; if missing, recreate from the concepts/old data using these stub objects:

```js
// 友 — if missing
{ id:'friend', kanji:'友', kun:'とも', on:'ユウ', en:'friend', strokes:4,
  seeAlso:['手'],
  examples:[
    {word:'友達', reading:'tomodachi', meaning:'friend'},
    {word:'親友', reading:'shin\'yū', meaning:'best friend'},
    {word:'友情', reading:'yūjō', meaning:'friendship'},
  ] },
// 双 — if missing
{ id:'pair', kanji:'双', kun:'ふた', on:'ソウ', en:'pair / twin', strokes:4,
  examples:[
    {word:'双子', reading:'futago', meaning:'twins'},
    {word:'双方', reading:'sōhō', meaning:'both sides'},
    {word:'双葉', reading:'futaba', meaning:'two leaves / sprout'},
  ] },
```

- [ ] **Step 2: Add seeAlso chips for cross-class deps**

On 休: `seeAlso:['木']`
On 男: `seeAlso:['田', '力']`  (力 not a card in the final deck but the chip can still reference it for rendering)

Actually 力 isn't in the deck — adjust to `seeAlso:['田']` only. The 力 component is described in the card's `descEn`/`descJa` text inline (no chip).

- [ ] **Step 3: Run validation**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected: People = 17 cards. No broken seeAlso.

- [ ] **Step 4: Live preview**

Reload. People class: order matches spec; click 男 → back face shows 田 chip in seeAlso.

- [ ] **Step 5: Commit**

```bash
cd nihongo
git add data.js
git commit -m "nihongo: reorder People to 17-card radical-prereq order

人 → 亻radical → 休 → 入 → 子/女/好/母 (女偏 cluster) →
姉/妹/父/男/兄/弟 (family) → hands radical → 友/双. Spec §3.4.

仕/何/取/受/反 drop (move to Verbs or N4-only). 姉妹/兄弟 compound
cards already demoted to usage in batch 1."
```

---

## Task 6: Reorder Body class — final 19 cards (including 持/打 you requested)

**Files:**
- Modify: `nihongo/data.js` — the `body` class's `cards: [ ... ]` array

Final order per spec §3.5:
```
体 口 目 見 自 鼻 耳 心 手 ◆扌 持 打 足 首 頭 顔 髪 歯 腕
```

The 扌 (◆) radical card is NEW — Task 18 adds it. For now, leave a placeholder gap in the order (the radical card will slot in there in Task 18). 持 and 打 are also NEW — they're stub cards added now.

- [ ] **Step 1: Add 持 and 打 stub cards**

```js
// 持
{ id:'hold', kanji:'持', kun:'も', on:'ジ', en:'hold / carry', strokes:9,
  seeAlso:['手'],
  examples:[
    {word:'持つ', reading:'motsu', meaning:'to hold'},
    {word:'気持ち', reading:'kimochi', meaning:'feeling / mood'},
    {word:'持参', reading:'jisan', meaning:'bringing along'},
  ] },
// 打
{ id:'hit', kanji:'打', kun:'う', on:'ダ', en:'hit / strike', strokes:5,
  seeAlso:['手'],
  examples:[
    {word:'打つ', reading:'utsu', meaning:'to hit'},
    {word:'打者', reading:'dasha', meaning:'batter'},
    {word:'打撃', reading:'dageki', meaning:'blow / impact'},
  ] },
```

- [ ] **Step 2: Reorder Body's cards array**

Pin the 18 non-radical entries in spec order. Drop the mis-shelved cards from the current Body class (the dump showed `录`, `書`, `当`, `雪`, `有`, `佐` were in Body — those don't belong; remove them; 書 will be added to School in Task 10).

If any of the 18 expected cards is missing from the current Body data, recreate using a stub (use the same field pattern as the 持/打 examples above; look up the kanji in a standard N5 reference for kun/on/meaning).

- [ ] **Step 3: Add seeAlso chips**

On 体: `seeAlso:['本']`

- [ ] **Step 4: Run validation**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected: Body = 18 cards (the 19th, the ◆扌 radical card, lands in Task 18).

- [ ] **Step 5: Live preview**

Reload. Body class: order matches spec, glyph + readings render for 持 and 打 (new cards).

- [ ] **Step 6: Commit**

```bash
cd nihongo
git add data.js
git commit -m "nihongo: reorder Body to 18 cards + add 持/打 (radical interlude in next commit)

体口目見自鼻耳心手 → 持打 (new, N4 useful) → 足首頭顔髪歯腕. Spec
§3.5. ◆扌 radical card slot reserved between 手 and 持; lands in
batch 4. 录/書/当/雪/有/佐 were mis-shelved in current Body; removed
(書 moves to School next)."
```

---

## Task 7: Reorder & trim Nature class — final 12 cards

**Files:**
- Modify: `nihongo/data.js` — the `nature` class's `cards: [ ... ]` array

Final order per spec §3.6:
```
林 森 本 石 岩 雨 雪 竹 草 虫 気 元気
```

Note: 火, 水, 土, 木, 山, 川 already moved out (Basic). 本 cross-listed in School (single card; physically lives in this class's array). 元気 is the only compound card kept.

- [ ] **Step 1: Reorder Nature's cards array**

Pin the 12 entries above in order. Drop these existing cards from Nature: `cliff` (厂), `cave` (宕), `not-yet` (未), `flame` (炎), `umbrella` (傘), `wind` (風 — moves to Sky & Seasons Task 8), `去` (去 drops entirely; meaning preserved on 来 from Task 2).

Add `本` if not already in this class — copy the card object from wherever it currently lives.

- [ ] **Step 2: Add seeAlso chips**

On 林: `seeAlso:['木']`
On 森: `seeAlso:['木']`
On 本: `seeAlso:['木']`
On 岩: `seeAlso:['山', '石']`
On 雪: `seeAlso:['雨']`
On 草: `seeAlso:['茶']` (茶 has the grass-radical inline note; cross-ref drives the connection)

- [ ] **Step 3: Run validation**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`
Expected: Nature = 12 cards. No seeAlso errors as long as 茶 is still in Colors (it is — Task 14 doesn't touch it).

- [ ] **Step 4: Live preview & commit**

Reload, verify. Commit:

```bash
cd nihongo
git add data.js
git commit -m "nihongo: reorder Nature to 12 cards (composed natural objects)

林森本石岩雨雪竹草虫気元気. Drops 厂/宕/未/炎/傘 (rare or N4);
風 moves to Sky & Seasons. seeAlso chips added for木→林/森/本,
山→岩, 石→岩, 雨→雪, 茶→草 (grass-radical link). Spec §3.6."
```

---

## Task 8: Reorder Sky & Seasons class — final 11 cards

**Files:**
- Modify: `nihongo/data.js` — the `sky-seasons` class

Final order per spec §3.7:
```
天 空 雲 星 風 花 葉 春 夏 秋 冬
```

風 moves in from Nature (done in Task 7's drop list). The remaining 10 are mostly already in `nature2` — just reorder.

- [ ] **Step 1: Reorder cards array per spec §3.7**

If any card is missing, stub it using the schema:
```js
{ id:'<id>', kanji:'<kanji>', kun:'<reading>', on:'<reading>', en:'<meaning>', strokes:N,
  examples:[ {word:'...', reading:'...', meaning:'...'}, ... ] }
```

- [ ] **Step 2: Add seeAlso chips**

On 雲: `seeAlso:['雨']`
On 星: `seeAlso:['日']`
On 花: `seeAlso:['茶']` (grass radical)
On 葉: `seeAlso:['木']`
On 秋: `seeAlso:['火']`

- [ ] **Step 3: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
# (reload and visually verify)
git add data.js
git commit -m "nihongo: reorder Sky & Seasons to 11 cards

天空雲星風花葉春夏秋冬. 風 absorbed from Nature. Spec §3.7."
```

---

## Task 9: Reorder & trim Time class — final 15 cards

**Files:**
- Modify: `nihongo/data.js` — the `time` class

Final order per spec §3.8:
```
時 分 半 年 今 先 前 後 何 早 遅 朝 昼 夕 夜
```

半 is also in Numbers (Task 14 adds it there) — cross-listed.
前 後 何 朝 夜 are NEW — add stubs.
来 moves OUT to Verbs (Task 16) — delete here.
秒 drops (N4-leaning).

- [ ] **Step 1: Delete current Time entries that go away**

Remove: 秒 (drop), 来 (will be added to Verbs in Task 16 — for now copy the full card object into a scratch comment near the Verbs slot to make Task 16 trivial).

- [ ] **Step 2: Add the 5 new stubs (半 前 後 何 朝 夜)**

```js
// 半
{ id:'half', kanji:'半', kun:'なか', on:'ハン', en:'half', strokes:5,
  examples:[
    {word:'半分', reading:'hanbun', meaning:'half'},
    {word:'半年', reading:'hantoshi', meaning:'half a year'},
    {word:'半額', reading:'hangaku', meaning:'half price'},
  ] },
// 前
{ id:'before', kanji:'前', kun:'まえ', on:'ゼン', en:'before / front', strokes:9,
  examples:[
    {word:'前',   reading:'mae',  meaning:'before / in front'},
    {word:'午前', reading:'gozen', meaning:'morning / AM'},
    {word:'名前', reading:'namae', meaning:'name'},
  ] },
// 後
{ id:'after', kanji:'後', kun:'うし', on:'ゴ', en:'after / behind', strokes:9,
  examples:[
    {word:'後',   reading:'ato',  meaning:'later / after'},
    {word:'午後', reading:'gogo', meaning:'afternoon / PM'},
    {word:'最後', reading:'saigo', meaning:'last / final'},
  ] },
// 何
{ id:'what', kanji:'何', kun:'なに', on:'カ', en:'what / how many', strokes:7,
  examples:[
    {word:'何時', reading:'nanji', meaning:'what time'},
    {word:'何人', reading:'nannin', meaning:'how many people'},
    {word:'何か', reading:'nanika', meaning:'something'},
  ] },
// 朝
{ id:'morning', kanji:'朝', kun:'あさ', on:'チョウ', en:'morning', strokes:12,
  seeAlso:['月'],
  examples:[
    {word:'朝',     reading:'asa', meaning:'morning'},
    {word:'今朝',   reading:'kesa', meaning:'this morning'},
    {word:'朝食',   reading:'chōshoku', meaning:'breakfast'},
  ] },
// 夜
{ id:'night', kanji:'夜', kun:'よる', on:'ヤ', en:'night', strokes:8,
  examples:[
    {word:'夜',     reading:'yoru', meaning:'night'},
    {word:'今夜',   reading:'kon\'ya', meaning:'tonight'},
    {word:'夜中',   reading:'yonaka', meaning:'midnight'},
  ] },
```

- [ ] **Step 3: Reorder cards array per spec §3.8 (15 entries)**

- [ ] **Step 4: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
# reload and visually verify
git add data.js
git commit -m "nihongo: reorder Time to 15 cards, add 半前後何朝夜

時分半年今先前後何早遅朝昼夕夜. Compound cards
今日/今週/今月/今年/去年/来年/先生 already demoted in batch 1.
来 carved out for Verbs (next batch). 秒 drops. Spec §3.8."
```

---

## Task 10: Reorder & trim School class — final 12 cards

**Files:**
- Modify: `nihongo/data.js` — the `school` class

Final order per spec §3.9:
```
学 校 字 文 名 ◆言 言 話 読 書 本 生
```

NEW kanji: 言, 話, 読. 書 moves in from Body (where it was mis-shelved). 本 cross-listed (also in Nature). 生 moves in from Basic.
◆言 (left-side speech radical card) — placeholder slot; Task 18 adds.

- [ ] **Step 1: Add 3 new stub cards (言, 話, 読)**

```js
// 言
{ id:'say', kanji:'言', kun:'い', on:'ゲン', en:'say / word', strokes:7,
  seeAlso:['口'],
  examples:[
    {word:'言う',   reading:'iu', meaning:'to say'},
    {word:'言葉',   reading:'kotoba', meaning:'word / language'},
    {word:'方言',   reading:'hōgen', meaning:'dialect'},
  ] },
// 話
{ id:'talk', kanji:'話', kun:'はな', on:'ワ', en:'talk / story', strokes:13,
  seeAlso:['言'],
  examples:[
    {word:'話す',   reading:'hanasu', meaning:'to speak'},
    {word:'電話',   reading:'denwa', meaning:'telephone'},
    {word:'会話',   reading:'kaiwa', meaning:'conversation'},
  ] },
// 読
{ id:'read', kanji:'読', kun:'よ', on:'ドク', en:'read', strokes:14,
  seeAlso:['言'],
  examples:[
    {word:'読む',   reading:'yomu', meaning:'to read'},
    {word:'読書',   reading:'dokusho', meaning:'reading (a book)'},
    {word:'音読',   reading:'ondoku', meaning:'reading aloud'},
  ] },
```

- [ ] **Step 2: Move 書 in from Body, 生 from Basic, ensure 本 cross-listed**

If 書 still has an entry in Body's cards (it shouldn't after Task 6), cut it and paste into School at its spec position. Same for 生 from Basic. For 本, keep one card object in Nature (Task 7 placed it there) and add a SECOND entry in School — yes, this is a deliberate cross-listing (allowed per spec, see ALLOWED_DUPLICATES in the validator).

- [ ] **Step 3: Reorder per spec §3.9**

- [ ] **Step 4: Add seeAlso chips for cross-class deps**

On 校: `seeAlso:['木']`

- [ ] **Step 5: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
# expect: validator now flags 本 as cross-class — ALLOWED_DUPLICATES already
# includes 本, so it's a warning, not error.
git add data.js
git commit -m "nihongo: reorder School to 12 cards + add 言/話/読 (言 radical interlude in next batch)

学校字文名 → 言radical → 言話読 (speech cluster) → 書本生.
書 moved from Body, 生 from Basic. 本 cross-listed with Nature.
Spec §3.9."
```

---

## Task 11: Reorder & trim Animals class — final 11 cards

**Files:**
- Modify: `nihongo/data.js` — the `animals` class

Final order per spec §3.10:
```
犬 猫 鳥 魚 馬 牛 豚 鶏 貝 蛸 烏賊
```

`小鳥` drops as standalone (it was a compound; demote to 鳥's `usage` or `examples`).

- [ ] **Step 1: Demote 小鳥 to 鳥's examples**

If 鳥's `examples` doesn't include `小鳥`, add `{word:'小鳥', reading:'kotori', meaning:'small bird'}`. Delete the standalone `小鳥` card.

- [ ] **Step 2: Reorder Animals per spec §3.10**

- [ ] **Step 3: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
git add data.js
git commit -m "nihongo: reorder Animals to 11 cards

犬猫鳥魚馬牛豚鶏貝蛸烏賊. 小鳥 demoted to 鳥's examples. Spec §3.10."
```

---

## Task 12: Reorder Places & Compass class — final 14 cards (was `places` post-rename)

**Files:**
- Modify: `nihongo/data.js` — the `places` class (formerly `directions`)

Final order per spec §3.11:
```
上 下 左 右 中 東 西 南 北 王 国 家 店 駅
```

東 西 南 北 家 店 駅 are NEW. 王 国 move in from Basic.

- [ ] **Step 1: Add 7 new stub cards**

```js
// 東
{ id:'east', kanji:'東', kun:'ひがし', on:'トウ', en:'east', strokes:8,
  examples:[
    {word:'東京', reading:'tōkyō', meaning:'Tokyo'},
    {word:'東口', reading:'higashiguchi', meaning:'east exit'},
    {word:'関東', reading:'kantō', meaning:'Kanto region'},
  ] },
// 西
{ id:'west', kanji:'西', kun:'にし', on:'セイ', en:'west', strokes:6,
  examples:[
    {word:'関西', reading:'kansai', meaning:'Kansai region'},
    {word:'西口', reading:'nishiguchi', meaning:'west exit'},
    {word:'北西', reading:'hokusei', meaning:'northwest'},
  ] },
// 南
{ id:'south', kanji:'南', kun:'みなみ', on:'ナン', en:'south', strokes:9,
  examples:[
    {word:'南口', reading:'minamiguchi', meaning:'south exit'},
    {word:'南極', reading:'nankyoku', meaning:'south pole'},
    {word:'南米', reading:'nanbei', meaning:'South America'},
  ] },
// 北
{ id:'north', kanji:'北', kun:'きた', on:'ホク', en:'north', strokes:5,
  examples:[
    {word:'北口', reading:'kitaguchi', meaning:'north exit'},
    {word:'北海道', reading:'hokkaidō', meaning:'Hokkaido'},
    {word:'東北', reading:'tōhoku', meaning:'northeast / Tohoku region'},
  ] },
// 家
{ id:'house', kanji:'家', kun:'いえ', on:'カ', en:'house / home', strokes:10,
  examples:[
    {word:'家',     reading:'ie', meaning:'house'},
    {word:'家族',   reading:'kazoku', meaning:'family'},
    {word:'画家',   reading:'gaka', meaning:'painter'},
  ] },
// 店
{ id:'shop', kanji:'店', kun:'みせ', on:'テン', en:'shop / store', strokes:8,
  examples:[
    {word:'店',     reading:'mise', meaning:'shop'},
    {word:'書店',   reading:'shoten', meaning:'bookstore'},
    {word:'店員',   reading:'ten\'in', meaning:'shop clerk'},
  ] },
// 駅
{ id:'station', kanji:'駅', kun:'えき', on:'エキ', en:'station', strokes:14,
  seeAlso:['馬'],
  examples:[
    {word:'駅',     reading:'eki', meaning:'station'},
    {word:'駅前',   reading:'ekimae', meaning:'in front of the station'},
    {word:'東京駅', reading:'tōkyō-eki', meaning:'Tokyo Station'},
  ] },
```

- [ ] **Step 2: Move 王 and 国 in from Basic**

Find both card objects in the `basic` class (still there after Task 4), cut, paste into Places at positions 10 and 11. Add `seeAlso:['王']` to 国.

- [ ] **Step 3: Reorder per spec §3.11**

- [ ] **Step 4: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
git add data.js
git commit -m "nihongo: grow Places & Compass to 14 cards

上下左右中 → 東西南北 (compass, NEW) → 王/国 (moved from Basic) →
家/店/駅 (NEW). 駅 → 馬 seeAlso. Spec §3.11."
```

---

## Task 13: Reorder Rooms class — final 10 cards

**Files:**
- Modify: `nihongo/data.js` — the `rooms` class

Final order per spec §3.12:
```
◆宀 戸 門 開 閉 窓 床 天井 棚 本棚
```

◆宀 (NEW radical card) — placeholder slot for Task 18.
閉 is NEW. 開 stays. 出 moves OUT to Verbs (Task 16). 閤 drops.

- [ ] **Step 1: Add 閉 stub card**

```js
// 閉
{ id:'close', kanji:'閉', kun:'し', on:'ヘイ', en:'close / shut', strokes:11,
  seeAlso:['門'],
  examples:[
    {word:'閉める', reading:'shimeru', meaning:'to close (tr.)'},
    {word:'閉まる', reading:'shimaru', meaning:'to close (intr.)'},
    {word:'閉店',   reading:'heiten', meaning:'shop closing'},
  ] },
```

- [ ] **Step 2: Drop 閤; move 出 to Verbs scratch (Task 16 picks up)**

Delete the 閤 card. Cut the 出 card object — keep it in a scratch comment near where Verbs will be built so Task 16 can paste in.

- [ ] **Step 3: Reorder per spec §3.12 (9 cards; 10th lands in Task 18 as ◆宀)**

- [ ] **Step 4: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
# Rooms = 9 cards temporarily; below MIN_PER_CLASS — accept the
# warning, ◆宀 lands in Task 18.
git add data.js
git commit -m "nihongo: reorder Rooms to 9 cards + add 閉 (宀 radical interlude in next batch)

戸門開閉窓床天井棚本棚. 閤 drops, 出 carved for Verbs. Spec §3.12."
```

---

## Task 14: Tighten Numbers (+万 +半) and Colors (drop loanwords)

**Files:**
- Modify: `nihongo/data.js` — the `numbers` and `colors` classes

Numbers final per §3.2:
```
一 二 三 四 五 六 七 八 九 十 百 千 万 半
```

Colors final per §3.3:
```
色 白 黒 赤 青 黄 茶 緑 紫
```

万 NEW. 半 cross-listed with Time (already in Time after Task 9 — also lives here).
オレンジ, ピンク, 黄色, 灰色, 水色 drop.

- [ ] **Step 1: Add 万 stub card to Numbers**

```js
// 万
{ id:'ten-thousand', kanji:'万', kun:'よろず', on:'マン', en:'ten thousand', strokes:3,
  examples:[
    {word:'一万',   reading:'ichiman', meaning:'10,000'},
    {word:'万歳',   reading:'banzai', meaning:'banzai / hurray'},
    {word:'万一',   reading:'man\'ichi', meaning:'just in case'},
  ] },
```

- [ ] **Step 2: Add 半 to Numbers (cross-listed)**

Copy the 半 card object from Time (added in Task 9), paste as the last Numbers entry.

- [ ] **Step 3: Replace compound color cards with their single-glyph kanji**

The current Colors class has these cards: 色 白 赤 青 **黄色** 黒 緑 **茶色** 紫 オレンジ ピンク 灰色 水色 (13 cards).

The target is 9 single-glyph kanji: 色 白 黒 赤 青 黄 茶 緑 紫.

Do these edits in order:

1. **Drop the 4 katakana/loanword/grey cards**: オレンジ, ピンク, 灰色, 水色 → delete entirely. Their meanings will live in a future vocab page (out of scope here).

2. **Transform the existing 黄色 card into a 黄 card**: change its `kanji` field from `'黄色'` to `'黄'`. Keep the existing `kun`, `on`, `en`, `examples`. Add `usage:{ja:'黄色', kana:'きいろ'}` so the front face still surfaces the common compound. Set `id` to `'yellow'` if not already.

3. **Transform the existing 茶色 card into a 茶 card**: same approach. Change `kanji:'茶色'` → `kanji:'茶'`. Keep its examples (they probably already include 茶色 as a usage variant — leave them). Update readings to match 茶 single-glyph: `kun:'ちゃ', on:'チャ'`. Add `usage:{ja:'お茶', kana:'おちゃ'}`. Set `id:'tea'`. Compare against the 茶 card preserved in the scratch comment from Task 1 — if the scratch card has richer examples, paste those in.

4. **Verify the final 9 cards in order**: 色, 白, 黒, 赤, 青, 黄, 茶, 緑, 紫. Reorder if needed (the dump showed the current order has 黄色 before 黒 — final order puts 黒 third, so swap positions).

- [ ] **Step 4: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
# Expect: 半 now flagged as cross-class duplicate (Time + Numbers).
# ALLOWED_DUPLICATES already includes 半 — warning, not error.
git add data.js
git commit -m "nihongo: tighten Numbers (+万+半 cross-listed) and Colors (drop loanwords)

Numbers: 一二三四五六七八九十百千万半 (14 cards, +万 new, +半
cross-listed with Time).
Colors: 色白黒赤青黄茶緑紫 (9 cards). オレンジ/ピンク/灰色/水色
drop (loanwords + compounds, not single-glyph kanji). 黄色 demoted
to 黄's usage. Spec §3.2, §3.3."
```

---

## Batch 3 — Add new classes

Three new classes built from scratch. Each is a clean append at the end of `FLASHCARD_CLASSES`.

---

## Task 15: Create Food & Drink class — 10 cards

**Files:**
- Modify: `nihongo/data.js` — append a new class block to `FLASHCARD_CLASSES`

Final order per §3.13:
```
米 飯 ◆飠 食 飲 茶 酒 肉 卵 御飯
```

茶 cross-listed (also in Colors). 御飯 reactivated from the scratch comment in Task 1.
◆飠 lands in Task 18.

- [ ] **Step 1: Build the class block**

Append this to `FLASHCARD_CLASSES`:

```js
{
  id: 'food-drink',
  titleJa: 'たべもの・のみもの',
  titleEn: 'Food & Drink',
  glyph: '食',
  imageFolder: 'food',
  cards: [
    // 米
    { id:'rice-grain', kanji:'米', kun:'こめ', on:'ベイ', en:'rice / America (kome / bei)', strokes:6,
      examples:[
        {word:'米',     reading:'kome', meaning:'rice (raw)'},
        {word:'米国',   reading:'beikoku', meaning:'America'},
        {word:'新米',   reading:'shinmai', meaning:'new rice / novice'},
      ] },
    // 飯
    { id:'cooked-rice', kanji:'飯', kun:'めし', on:'ハン', en:'cooked rice / meal', strokes:12,
      seeAlso:['米'],
      examples:[
        {word:'御飯',   reading:'gohan', meaning:'cooked rice / meal'},
        {word:'朝飯',   reading:'asameshi', meaning:'breakfast'},
        {word:'夕飯',   reading:'yūhan', meaning:'dinner'},
      ] },
    // ◆ 飠 — radical card placeholder; Task 18 replaces this comment with the full radical block
    // 食
    { id:'eat', kanji:'食', kun:'た', on:'ショク', en:'eat / food', strokes:9,
      examples:[
        {word:'食べる', reading:'taberu', meaning:'to eat'},
        {word:'食事',   reading:'shokuji', meaning:'a meal'},
        {word:'食堂',   reading:'shokudō', meaning:'cafeteria'},
      ] },
    // 飲
    { id:'drink', kanji:'飲', kun:'の', on:'イン', en:'drink', strokes:12,
      seeAlso:['食'],
      examples:[
        {word:'飲む',   reading:'nomu', meaning:'to drink'},
        {word:'飲み物', reading:'nomimono', meaning:'a drink'},
        {word:'飲料',   reading:'inryō', meaning:'beverage'},
      ] },
    // 茶 — paste from the scratch comment at top of data.js
    // 酒
    { id:'alcohol', kanji:'酒', kun:'さけ', on:'シュ', en:'alcohol / sake', strokes:10,
      examples:[
        {word:'酒',     reading:'sake', meaning:'sake / alcohol'},
        {word:'日本酒', reading:'nihonshu', meaning:'Japanese sake'},
        {word:'居酒屋', reading:'izakaya', meaning:'izakaya'},
      ] },
    // 肉
    { id:'meat', kanji:'肉', kun:'にく', on:'ニク', en:'meat / flesh', strokes:6,
      examples:[
        {word:'牛肉',   reading:'gyūniku', meaning:'beef'},
        {word:'豚肉',   reading:'butaniku', meaning:'pork'},
        {word:'鶏肉',   reading:'toriniku', meaning:'chicken (meat)'},
      ] },
    // 卵
    { id:'egg', kanji:'卵', kun:'たまご', on:'ラン', en:'egg', strokes:7,
      examples:[
        {word:'卵',     reading:'tamago', meaning:'egg'},
        {word:'生卵',   reading:'namatamago', meaning:'raw egg'},
        {word:'卵焼き', reading:'tamagoyaki', meaning:'rolled omelet'},
      ] },
    // 御飯 — paste from the scratch comment
  ],
},
```

- [ ] **Step 2: Paste 茶 and 御飯 cards from the scratch comment created in Task 1**

Find the scratch comment block, copy the 茶 and 御飯 card definitions, paste at the indicated positions in the Food & Drink array. Then DELETE the scratch comment block — it's no longer needed.

- [ ] **Step 3: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
# Expect: Food & Drink at 9 cards (◆飠 placeholder is a comment, not a
# card). Below MIN_PER_CLASS — warning until Task 18 lands the radical
# card.
git add data.js
git commit -m "nihongo: create Food & Drink class (9 cards + 飠 radical pending)

米飯 → ◆飠 (next batch) → 食飲茶酒肉卵御飯. Absorbs drinks (茶) and
food (御飯) stubs. 茶 cross-listed with Colors. Spec §3.13."
```

---

## Task 16: Create Verbs class — 15 cards

**Files:**
- Modify: `nihongo/data.js`

Final order per §3.14:
```
行 来 出 立 聞 買 売 知 思 待 帰 切 走 働 忙
```

- [ ] **Step 1: Append the class block with all 15 cards**

```js
{
  id: 'verbs',
  titleJa: 'どうし',
  titleEn: 'Verbs',
  glyph: '行',
  imageFolder: 'kanji',
  cards: [
    { id:'go', kanji:'行', kun:'い', on:'コウ', en:'go', strokes:6,
      examples:[
        {word:'行く',   reading:'iku', meaning:'to go'},
        {word:'銀行',   reading:'ginkō', meaning:'bank'},
        {word:'旅行',   reading:'ryokō', meaning:'travel'},
      ] },
    // 来 — paste from Task 9 scratch
    // 出 — paste from Task 13 scratch
    { id:'stand', kanji:'立', kun:'た', on:'リツ', en:'stand / establish', strokes:5,
      examples:[
        {word:'立つ',   reading:'tatsu', meaning:'to stand'},
        {word:'独立',   reading:'dokuritsu', meaning:'independence'},
        {word:'立場',   reading:'tachiba', meaning:'standpoint'},
      ] },
    { id:'hear', kanji:'聞', kun:'き', on:'ブン', en:'hear / ask', strokes:14,
      seeAlso:['耳','門'],
      examples:[
        {word:'聞く',   reading:'kiku', meaning:'to hear / ask'},
        {word:'新聞',   reading:'shinbun', meaning:'newspaper'},
        {word:'見聞',   reading:'kenbun', meaning:'observation'},
      ] },
    { id:'buy', kanji:'買', kun:'か', on:'バイ', en:'buy', strokes:12,
      seeAlso:['貝'],
      examples:[
        {word:'買う',   reading:'kau', meaning:'to buy'},
        {word:'買物',   reading:'kaimono', meaning:'shopping'},
        {word:'売買',   reading:'baibai', meaning:'buying and selling'},
      ] },
    { id:'sell', kanji:'売', kun:'う', on:'バイ', en:'sell', strokes:7,
      seeAlso:['買'],
      examples:[
        {word:'売る',   reading:'uru', meaning:'to sell'},
        {word:'売れる', reading:'ureru', meaning:'to sell well'},
        {word:'売店',   reading:'baiten', meaning:'kiosk'},
      ] },
    { id:'know', kanji:'知', kun:'し', on:'チ', en:'know', strokes:8,
      examples:[
        {word:'知る',   reading:'shiru', meaning:'to know'},
        {word:'知識',   reading:'chishiki', meaning:'knowledge'},
        {word:'知人',   reading:'chijin', meaning:'acquaintance'},
      ] },
    { id:'think', kanji:'思', kun:'おも', on:'シ', en:'think', strokes:9,
      seeAlso:['心','田'],
      examples:[
        {word:'思う',   reading:'omou', meaning:'to think'},
        {word:'意思',   reading:'ishi', meaning:'intention'},
        {word:'思想',   reading:'shisō', meaning:'thought / ideology'},
      ] },
    { id:'wait', kanji:'待', kun:'ま', on:'タイ', en:'wait', strokes:9,
      examples:[
        {word:'待つ',   reading:'matsu', meaning:'to wait'},
        {word:'期待',   reading:'kitai', meaning:'expectation'},
        {word:'招待',   reading:'shōtai', meaning:'invitation'},
      ] },
    { id:'return', kanji:'帰', kun:'かえ', on:'キ', en:'return (home)', strokes:10,
      examples:[
        {word:'帰る',   reading:'kaeru', meaning:'to return home'},
        {word:'帰国',   reading:'kikoku', meaning:'returning to home country'},
        {word:'日帰り', reading:'higaeri', meaning:'day trip'},
      ] },
    { id:'cut', kanji:'切', kun:'き', on:'セツ', en:'cut', strokes:4,
      examples:[
        {word:'切る',   reading:'kiru', meaning:'to cut'},
        {word:'親切',   reading:'shinsetsu', meaning:'kindness'},
        {word:'大切',   reading:'taisetsu', meaning:'important'},
      ] },
    { id:'run', kanji:'走', kun:'はし', on:'ソウ', en:'run', strokes:7,
      examples:[
        {word:'走る',   reading:'hashiru', meaning:'to run'},
        {word:'競走',   reading:'kyōsō', meaning:'race'},
        {word:'脱走',   reading:'dassō', meaning:'escape'},
      ] },
    { id:'work', kanji:'働', kun:'はたら', on:'ドウ', en:'work / labor', strokes:13,
      examples:[
        {word:'働く',   reading:'hataraku', meaning:'to work'},
        {word:'労働',   reading:'rōdō', meaning:'labor'},
        {word:'共働き', reading:'tomobataraki', meaning:'dual-income household'},
      ] },
    { id:'busy', kanji:'忙', kun:'いそが', on:'ボウ', en:'busy', strokes:6,
      examples:[
        {word:'忙しい', reading:'isogashii', meaning:'busy'},
        {word:'多忙',   reading:'tabō', meaning:'very busy'},
        {word:'繁忙',   reading:'hanbō', meaning:'pressure of business'},
      ] },
  ],
},
```

- [ ] **Step 2: Paste 来 (from Task 9 scratch), 出 (from Task 13 scratch) in the marked positions**

- [ ] **Step 3: Delete the scratch comments — Verbs is now complete**

- [ ] **Step 4: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
git add data.js
git commit -m "nihongo: create Verbs class — 15 N5/N4 action kanji

行来出立 → 聞 → 買売 (貝 chain) → 知思待帰切走 → 働忙 (N4 useful).
食/飲 not duplicated (Food & Drink). 見 stays in Body. 言/話/読 in
School. 開/閉 in Rooms. Spec §3.14."
```

---

## Task 17: Create Adjectives class — 10 cards

**Files:**
- Modify: `nihongo/data.js`

Final order per §3.15:
```
高 安 多 少 古 新 長 短 強 弱
```

- [ ] **Step 1: Append the class block**

```js
{
  id: 'adjectives',
  titleJa: 'けいようし',
  titleEn: 'Adjectives',
  glyph: '高',
  imageFolder: 'kanji',
  cards: [
    { id:'tall', kanji:'高', kun:'たか', on:'コウ', en:'tall / expensive / high', strokes:10,
      examples:[
        {word:'高い',   reading:'takai', meaning:'tall / expensive'},
        {word:'高校',   reading:'kōkō', meaning:'high school'},
        {word:'最高',   reading:'saikō', meaning:'the best / highest'},
      ] },
    { id:'cheap', kanji:'安', kun:'やす', on:'アン', en:'cheap / safe / peaceful', strokes:6,
      examples:[
        {word:'安い',   reading:'yasui', meaning:'cheap'},
        {word:'安心',   reading:'anshin', meaning:'relief / peace of mind'},
        {word:'安全',   reading:'anzen', meaning:'safety'},
      ] },
    { id:'many', kanji:'多', kun:'おお', on:'タ', en:'many / much', strokes:6,
      examples:[
        {word:'多い',   reading:'ōi', meaning:'many'},
        {word:'多分',   reading:'tabun', meaning:'probably'},
        {word:'多数',   reading:'tasū', meaning:'majority'},
      ] },
    { id:'few', kanji:'少', kun:'すく', on:'ショウ', en:'few / a little', strokes:4,
      examples:[
        {word:'少ない', reading:'sukunai', meaning:'few'},
        {word:'少し',   reading:'sukoshi', meaning:'a little'},
        {word:'少年',   reading:'shōnen', meaning:'boy / youth'},
      ] },
    { id:'old', kanji:'古', kun:'ふる', on:'コ', en:'old', strokes:5,
      examples:[
        {word:'古い',   reading:'furui', meaning:'old (of things)'},
        {word:'古本',   reading:'furuhon', meaning:'used book'},
        {word:'中古',   reading:'chūko', meaning:'second-hand'},
      ] },
    { id:'new', kanji:'新', kun:'あたら', on:'シン', en:'new', strokes:13,
      examples:[
        {word:'新しい', reading:'atarashii', meaning:'new'},
        {word:'新聞',   reading:'shinbun', meaning:'newspaper'},
        {word:'最新',   reading:'saishin', meaning:'newest'},
      ] },
    { id:'long', kanji:'長', kun:'なが', on:'チョウ', en:'long / chief', strokes:8,
      examples:[
        {word:'長い',   reading:'nagai', meaning:'long'},
        {word:'社長',   reading:'shachō', meaning:'company president'},
        {word:'校長',   reading:'kōchō', meaning:'school principal'},
      ] },
    { id:'short', kanji:'短', kun:'みじか', on:'タン', en:'short', strokes:12,
      examples:[
        {word:'短い',   reading:'mijikai', meaning:'short'},
        {word:'短時間', reading:'tanjikan', meaning:'short time'},
        {word:'短歌',   reading:'tanka', meaning:'tanka poetry'},
      ] },
    { id:'strong', kanji:'強', kun:'つよ', on:'キョウ', en:'strong', strokes:11,
      examples:[
        {word:'強い',   reading:'tsuyoi', meaning:'strong'},
        {word:'勉強',   reading:'benkyō', meaning:'study'},
        {word:'強化',   reading:'kyōka', meaning:'reinforcement'},
      ] },
    { id:'weak', kanji:'弱', kun:'よわ', on:'ジャク', en:'weak', strokes:10,
      examples:[
        {word:'弱い',   reading:'yowai', meaning:'weak'},
        {word:'弱点',   reading:'jakuten', meaning:'weakness'},
        {word:'弱気',   reading:'yowaki', meaning:'timidity'},
      ] },
  ],
},
```

- [ ] **Step 2: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
git add data.js
git commit -m "nihongo: create Adjectives class — 10 N5/N4 size/quantity kanji

高安多少古新長短強弱. 大/小 stay in Basic (pictographs);
早/遅 stay in Time. Spec §3.15."
```

---

## Batch 4 — Radical interludes

Four new ◆ radical-interlude cards. Each is inserted at a specific position in an already-reordered class.

---

## Task 18: Add the 4 new ◆ radical-interlude cards

**Files:**
- Modify: `nihongo/data.js`

Per spec §4.1, the new radical cards:
- `扌` (left-side hand) → Body, between 手 (pos 9) and 持 (pos 11) — slot at pos 10
- `言` (left-side speech) → School, between 名 (pos 5) and 言 (pos 7) — slot at pos 6
- `飠` (food/eat) → Food & Drink, between 飯 (pos 2) and 食 (pos 4) — slot at pos 3
- `宀` (roof) → Rooms, at the top (pos 1)

Card shape follows the existing pattern for the `亻` and `ナ・ヨ + 又` cards (see current `people` class entries `person-radical` and `hands-radical`).

- [ ] **Step 1: Insert ◆扌 into Body at position 10**

```js
{ id:'tehen-radical', type:'radical',
  radical:'扌', from:'手',
  titleJa:'てへん', titleEn:'left-side hand',
  descEn:'When 手 lives on the LEFT side of a compound kanji, the bottom-right stroke flattens and it becomes 扌 — same hand, side-on. Marks kanji that involve doing something with the hands: holding, hitting, pushing, drawing.',
  descJa:'「手」が漢字の左がわに立つとき、右下の払いが平らになり「扌」になる。同じ手の形をふくむ。手で何かをすること—持つ、打つ、押す、引く—に関する漢字につく。',
  examples:[
    { kanji:'持', kun:'も',   on:'ジ',   en:'hold / carry' },
    { kanji:'打', kun:'う',   on:'ダ',   en:'hit / strike' },
    { kanji:'押', kun:'お',   on:'オウ', en:'push' },
    { kanji:'引', kun:'ひ',   on:'イン', en:'pull' },
  ] },
```

- [ ] **Step 2: Insert ◆言 into School at position 6**

```js
{ id:'gonben-radical', type:'radical',
  radical:'言', from:'言',
  titleJa:'ごんべん', titleEn:'left-side speech',
  descEn:'When 言 (say / word) lives on the left side of a compound, it keeps its full shape — the rectangular speech-marks stacked above an open mouth (口). Marks kanji about saying, asking, reading, naming, recording.',
  descJa:'「言」が漢字の左がわに立つときも、形はそのまま。口の上に積まれた言葉のかたち。話す、訊く、読む、名づける、記すこと—言葉に関する漢字につく。',
  examples:[
    { kanji:'話', kun:'はな', on:'ワ',   en:'talk / story' },
    { kanji:'読', kun:'よ',   on:'ドク', en:'read' },
    { kanji:'語', kun:'かた', on:'ゴ',   en:'language / tell' },
    { kanji:'記', kun:'しる', on:'キ',   en:'record / chronicle' },
  ] },
```

- [ ] **Step 3: Insert ◆飠 into Food & Drink at position 3**

```js
{ id:'shoku-radical', type:'radical',
  radical:'飠', from:'食',
  titleJa:'しょくへん', titleEn:'food / eat (left side)',
  descEn:'When 食 (eat / food) lives on the LEFT side of a compound, it compresses into 飠 — the same lid + heaped-rice silhouette, made narrow. Marks kanji about food: cooking, drinking, restaurants, particular dishes.',
  descJa:'「食」が漢字の左がわに立つとき、せまく圧縮されて「飠」になる。同じふた + ご飯の山のかたち。食べること、飲むこと、料理、料理屋に関する漢字につく。',
  examples:[
    { kanji:'飯', kun:'めし', on:'ハン', en:'cooked rice / meal' },
    { kanji:'飲', kun:'の',   on:'イン', en:'drink' },
    { kanji:'館', kun:'やかた', on:'カン', en:'large building / hall' },
    { kanji:'飼', kun:'か',   on:'シ',   en:'raise / keep (animal)' },
  ] },
```

- [ ] **Step 4: Insert ◆宀 into Rooms at position 1**

```js
{ id:'ukanmuri-radical', type:'radical',
  radical:'宀', from:'宀',
  titleJa:'うかんむり', titleEn:'roof / cap',
  descEn:'A roof in profile — left wall, gabled top, right wall. Sits on top of a compound kanji to mark "things that happen under a roof": houses, rooms, family life, shelter from the elements.',
  descJa:'横から見た屋根のかたち。漢字の上にのって、家・部屋・家族・しのぎの場—屋根の下で起きること—を表す漢字につく。',
  examples:[
    { kanji:'家', kun:'いえ', on:'カ',  en:'house / home' },
    { kanji:'室', kun:'むろ', on:'シツ', en:'room' },
    { kanji:'宿', kun:'やど', on:'シュク', en:'lodging / inn' },
    { kanji:'守', kun:'まも', on:'シュ', en:'protect / keep' },
  ] },
```

- [ ] **Step 5: Validate, preview, commit**

```bash
cd nihongo
node scripts/validate-flashcard-curriculum.mjs
# Expect: all 16 classes now in their final card counts. Total ~205 cards.
# All previously sub-minimum classes (Rooms 9→10, Food&Drink 9→10) now at 10.
git add data.js
git commit -m "nihongo: add 4 ◆ radical-interlude cards (扌, 言, 飠, 宀)

扌 in Body between 手 and 持. 言 in School between 名 and 言.
飠 in Food & Drink between 飯 and 食. 宀 at top of Rooms.

All four follow the existing radical-card pattern (亻 / hands /
roof from before): type:'radical', radical glyph, descEn/descJa,
4 example kanji that use it. Spec §4.1."
```

---

## Batch 5 — Back-face renderer (§4.4)

---

## Task 19: Update editorialFlashcardHTML for multi-kanji + kana-only stroke order

**Files:**
- Modify: `nihongo/app.html` (`editorialFlashcardHTML` function, ~line 15254)

Replace the single-kanji stroke lookup with a per-kanji-character iteration. Skip the section entirely when no CJK chars present.

- [ ] **Step 1: Read the current implementation**

Run: `cd nihongo && grep -n "strokeFormat\|testcard-back-stroke" app.html | head -10`

Locate the block (line ~15254 in current file).

- [ ] **Step 2: Replace the single-kanji branch**

Find this block:

```js
const strokeFormat = (window.STROKE_FORMATS || {})[card.kanji] || null;
const strokeSrc = strokeFormat
  ? `images/stroke/${card.kanji}-order.${strokeFormat}`
  : null;
```

Replace with:

```js
// Extract kanji-only chars from card.kanji. The back-face stroke-order
// panel needs to handle three shapes:
//   1. Pure kana cards (にこにこ, ピンク) → no kanji at all → skip the
//      stroke section entirely.
//   2. Single kanji (人, 食, 茶) → existing single-panel render.
//   3. Multi-kanji compound (元気, 御飯, 昨日) → render one panel
//      per kanji, side by side.
// Spec §4.4 / §4.5.
const kanjiChars = [...(card.kanji || '')].filter(c => {
  const code = c.codePointAt(0);
  return (code >= 0x4E00 && code <= 0x9FFF)   // CJK Unified Ideographs
      || (code >= 0x3400 && code <= 0x4DBF);  // Extension A (rare but legal)
});
const strokePanels = kanjiChars.map(k => {
  const fmt = (window.STROKE_FORMATS || {})[k] || null;
  return {
    kanji: k,
    fmt,
    src: fmt ? `images/stroke/${k}-order.${fmt}` : null,
  };
});
```

- [ ] **Step 3: Find the existing usage of `strokeSrc` in the back-face HTML and replace**

Locate the block that renders the stroke panel (search for `testcard-back-stroke` in the template literal). It currently uses `strokeSrc` and `strokeFormat`. Replace with a loop:

```js
// In the testcard back face — search for the existing
// `<div class="testcard-back-stroke">` block and replace with this:
${strokePanels.length === 0 ? '' : `
  <div class="testcard-back-stroke ${strokePanels.length > 1 ? 'is-multi' : ''}">
    ${strokePanels.map(p => `
      <div class="testcard-back-stroke-panel">
        ${p.src ? (p.fmt === 'svg' ? `
          <object class="testcard-stroke-gif"
                  type="image/svg+xml"
                  data="${escAttr(p.src)}"
                  aria-label="Stroke order for ${escAttr(p.kanji)}"></object>
        ` : `
          <img class="testcard-stroke-gif"
               src="${escAttr(p.src)}"
               alt="Stroke order for ${escAttr(p.kanji)}">
        `) : `
          <img class="testcard-stroke-gif is-missing" alt="" aria-hidden="true">
          <div class="testcard-stroke-missing">
            Stroke order for <strong>${escHTML(p.kanji)}</strong> isn't downloaded yet.<br>
            Run <code>node scripts/download-stroke-gifs.mjs --jouyou</code> to fetch it.
          </div>
        `}
        ${strokePanels.length > 1 ? `<div class="testcard-back-stroke-label">${escHTML(p.kanji)}</div>` : ''}
      </div>
    `).join('')}
  </div>
`}
```

- [ ] **Step 4: Add CSS for the multi-panel layout**

In the `<style>` block of `app.html`, find the `.testcard-back-stroke` rule. After it, add:

```css
/* Multi-kanji back face — when a compound card (元気, 御飯, 烏賊) is
   showing, the stroke-order area splits into N equal panels side by
   side, one per kanji. A small label under each panel re-states the
   kanji so the learner knows which stroke order belongs to which
   half of the compound. Single-kanji cards (the majority) use the
   default flow above — no flex container needed. Spec §4.4. */
.testcard-back-stroke.is-multi {
  display: flex;
  gap: 14px;
  align-items: stretch;
}
.testcard-back-stroke.is-multi .testcard-back-stroke-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.testcard-back-stroke.is-multi .testcard-stroke-gif {
  width: 100%;
  height: auto;
  display: block;
}
.testcard-back-stroke-label {
  font-family: var(--serif-jp);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-2);
  text-align: center;
  line-height: 1;
}
```

- [ ] **Step 5: Live preview verification**

Run `py -m http.server 8766` from repo root. Open `app.html#flashcards`.

Test each rule:
- **Pure kana**: navigate to Onomatopoeia class, flip a card (にこにこ). The back face should show the meaning header but NO stroke-order section.
- **Single kanji**: navigate to Basic class, flip 日. The back face shows ONE stroke panel (existing behavior).
- **Multi-kanji compound**: navigate to Nature class, find 元気. Flip it. The back face shows TWO panels side by side: 元 on the left, 気 on the right, each with its own stroke animation.
- **Mixed kanji + kana**: if any survived the redesign (unlikely — they were demoted), flip and confirm only the kanji part renders.

- [ ] **Step 6: Commit**

```bash
cd nihongo
git add app.html
git commit -m "nihongo: back-face stroke order — split for compound cards, skip for kana

editorialFlashcardHTML now extracts CJK chars from card.kanji and:
- renders 0 panels (no section) when card.kanji is pure kana
- renders 1 panel (existing layout) for single kanji
- renders N panels side by side for multi-kanji compounds, each
  with a sub-label showing which kanji it belongs to

CSS: .testcard-back-stroke.is-multi flex layout + per-panel label.
Spec §4.4."
```

---

## Batch 6 — Final verification

---

## Task 20: Final pass — validation, broken-ref hunt, deck walkthrough

**Files:**
- Read-only: `nihongo/data.js`, `nihongo/app.html`

- [ ] **Step 1: Run the validator one more time**

Run: `cd nihongo && node scripts/validate-flashcard-curriculum.mjs`

Expected output:
```
Loaded 16 classes, ~130 unique kanji glyphs.
  basic            15 cards
  numbers          14 cards
  colors           9 cards
  people           17 cards
  body             19 cards
  nature           12 cards
  sky-seasons      11 cards
  time             15 cards
  school           12 cards
  animals          11 cards
  places           14 cards
  rooms            10 cards
  food-drink       10 cards
  verbs            15 cards
  adjectives       10 cards
  onomatopoeia     11 cards

Warnings (4):
  glyph "茶" appears in 2 cards: colors/tea, food-drink/tea
  glyph "本" appears in 2 cards: nature/book, school/book
  glyph "魚" appears in 2 cards: animals/fish, food-drink/fish (if you added it)
  glyph "半" appears in 2 cards: time/half, numbers/half

OK — all curriculum invariants hold.
```

If anything other than the documented cross-list duplicates warns, investigate. If any error fires (broken seeAlso, missing field, count out of band), open the offending card and fix.

- [ ] **Step 2: Walk the deck in the live preview**

```bash
# from repo root:
py -m http.server 8766
```

Open `http://localhost:8766/nihongo/app.html` → Flashcards bookmark. For each of the 16 classes:
1. Click the class in the sidebar
2. Verify the class title and glyph match spec §2
3. Scroll through 3-4 cards in card view; flip a couple
4. Click the `list` toggle, scan the order, switch back to `card`

Watch for:
- Cards rendering with empty image wells (the Task 1/Task 14 fixes should have handled all stub kanji — if any still show an empty 320×320 well, the `image-slot.js` fix from earlier isn't being picked up; check the cache-bust query string)
- Broken `seeAlso` chips on the back face (should already be impossible — the validator would have caught them)
- Stroke-order panels rendering correctly for the compound cards (元気, 御飯, 天井, 本棚, 烏賊)
- No stroke panel on the kana cards (Onomatopoeia)

- [ ] **Step 3: Verify the §4.5 audit cards all work**

Specifically navigate to each of these compound + kana cards and flip:
- にこにこ (Onomatopoeia) → no stroke panel ✓
- ぴょんぴょん (Onomatopoeia) → no stroke panel ✓
- 元気 (Nature) → 2-panel split (元 + 気) ✓
- 御飯 (Food & Drink) → 2-panel split (御 + 飯) ✓
- 天井 (Rooms) → 2-panel split (天 + 井) ✓
- 本棚 (Rooms) → 2-panel split (本 + 棚) ✓
- 烏賊 (Animals) → 2-panel split (烏 + 賊) ✓ (note: 烏 may not have stroke art on disk; placeholder OK)

- [ ] **Step 4: Commit a final "curriculum stable" tag commit (optional but recommended)**

```bash
cd nihongo
# nothing to add — this is a tagging commit only
cd ..
git tag -a kanji-n5-curriculum-v1 -m "Kanji N5 curriculum: 16 classes, ~205 cards, ~130 unique kanji

100% N5 coverage + ~30 useful N4/N3 exceptions. Theme-first
categories with radical-ordered cards inside each. 7 radical
interludes. Back-face stroke order handles compound + kana
cards. See docs/superpowers/specs/2026-05-25-kanji-n5-curriculum-design.md
and docs/superpowers/plans/2026-05-25-kanji-n5-curriculum-implementation.md."
```

- [ ] **Step 5: Done — report back**

Summary template for the implementer to relay:

> Curriculum implementation complete.
> - 16 classes (was 18), 205 cards (was ~200), ~130 unique kanji glyphs (was ~104).
> - 3 new classes: Food & Drink, Verbs, Adjectives.
> - 4 new radical-interlude cards (扌, 言, 飠, 宀).
> - Back-face stroke order now splits per kanji for compound cards and skips for kana-only.
> - Validator at `scripts/validate-flashcard-curriculum.mjs`; current run: 16 classes, OK, 4 expected cross-class warnings.
> - Tagged `kanji-n5-curriculum-v1`.
