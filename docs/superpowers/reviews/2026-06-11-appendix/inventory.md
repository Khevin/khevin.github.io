# Nihongo — Learning-Surface & Content Inventory

Method: counts computed by evaluating `data.js`, `heisig-data.js`, `particle-*.js`, `images/stroke/manifest.js` in Node and bracket-extracting `SPEAKING_CATEGORIES`/`BOOKS` literals from `app.js`; cross-checked against the filesystem (`images/kanji/`). All counts are exact.

## 1. Top-level navigation
- **5 sections** (`nihongo/app.js:13-27`): Basics (writing), Flashcards, Vocabulary, Speaking, Library.
- **Library sub-pages: 3** (`nihongo/app.js:8535-8539`): Search (radicals), Dictionary, Books.
- **Writing sub-pages: 7** (`nihongo/app.js:8435-8457`).

## 2. Vocabulary (`window.VOCAB_CLASSES`, `nihongo/data.js:443-2246`)
**5 classes, 26 books.**

| Class | Books | Nature |
|---|---|---|
| Food (`eating-out`) | 11 | Flavors (10 sensory primitives, `data.js:475-557`), Edibles (**121 items** in 8 categories: yasai 30, kudamono 22, kashi 13, niku 12, kokumotsu 12, sakana 11, nyuuseihin 11, nomimono 10; `data.js:558` `isEdiblesPage`), Textures (10, `data.js:1082`), Eating Out (`isExperience` interactive scene launcher), + 7 place books (yatai, sushi, omakase, izakaya, ramen, konbini, fast-food) of cheatsheet/explanation/menu-reference pages |
| Home | 6 | bathroom/kitchen/livingroom/bedroom/entrance/hallway — cheatsheet + usage + sentences pages (`data.js:8-441` `HOME_BOOKS`, attached at `data.js:1924`) |
| Stays | 4 | **all placeholders** (`pages: []`): hotel, office, airbnb, dorm |
| Internet | 2 | **all placeholders**: gmail, whatsapp |
| Jougo | 3 | intro (explainer) + 2 `jougo-overview` pages (onomatopoeia) |

**Item totals across book pages:** cheatsheet **243**, menu-reference **77**, usage **36**, sentences **37** (= 393 page items) + flavors 10 + textures 10 + edibles 121 (= 141 bento items). 6 of 26 books are empty placeholders.

**Restaurant scene engine** (`data.js:4438-5745`, engine `app.js:~6380-7700`): **21 restaurants** (`EATING_OUT_RESTAURANTS`, `data.js:5241`) — ramen 3, sushi 3, omakase 3, izakaya 3, yatai 3, fast-food 2 (KFC/McDonald's), konbini 3, friend 1 — over **5 step templates** (ramen 12 steps, lite 7, fastfood 10, konbini 8, friend 8). Per-restaurant menus total **105 items**; konbini shelf pulls `KONBINI_SECTIONS` (**5 sections, 28 items**, `data.js:4377`). Each restaurant carries NPC, personality, setting, monologue.

## 3. Flashcards (`window.FLASHCARD_CLASSES`, `nihongo/data.js:2252-4245`)
**17 classes, 262 cards** = 245 kanji/word cards (243 unique strings; 206 unique single-kanji) + **17 radical-primitive interlude cards** (`type:'radical'`).

Metadata coverage (of 262):
- **examples** (word/reading/meaning): 257
- **stroke-order asset** (in `STROKE_FORMATS`, `images/stroke/manifest.js`): **202**
- **strokes-count field**: 210
- **Heisig frame link** (key in `HEISIG`, `heisig-data.js` — frame/keyword/story; chip rendered at `app.js:1153-1177`, used `app.js:11642`): **186**
- **card image** (`images/kanji/<kanji>.webp`, auto-loaded via image-slot, `image-slot.js:766`): **143** of 245 (160 files on disk; the rest serve writing pages, e.g. 日曜日 cards `app.js:9357-9371`)
- **seeAlso** cross-links: 73; **digit-as-image** (Numbers deck): 12
- Smallest decks: Animals II (2 cards), Rooms (9); Onomatopoeia (11) is kana-only — 0 heisig/stroke/kanji metadata.

## 4. Dictionary (`window.DICTIONARY`, `nihongo/data.js:5750-5880`)
**123 entries**: kanji **95**, word **28**. JLPT: N5 54, N4 36, N3 24, N2 5, N1 1, unleveled 3. Entry shape: `kind, kanji, kana, en, level, tags`. Supporting maps `KANJI_READINGS` / `KANJI_MEANINGS` (`data.js:5887/5989`) each cover **243 keys** — the full flashcard deck, i.e. deck kanji are searchable even though only 123 curated dictionary rows exist.

## 5. Radical search (`data.js:4253-4377`, UI `app.js:~11900-12160`)
- Picker: `RADICALS_BY_STROKE` — **15 stroke groups, 253 radical chars**.
- `KANJI_RADICALS` decompositions: **158 kanji**.
- Deck coverage: **132 / 206 unique single-kanji cards (64%)** are decomposed; multi-char cards (世界, 日曜日…) and kana-only cards are inherently outside the index.

## 6. Speaking (`window.SPEAKING_CATEGORIES`, `nihongo/app.js:13110+`)
**2 categories, 22 phrases**: Greetings 7, Food & Meals 15. Per-phrase metadata: `chunks` (mora arrays + per-mora L/H pitch), display `kanji`, `romaji`, `en`, `pattern` (heiban 6, nakadaka 11, atamadaka 5 — no odaka exemplar), `accent` (downstep index), `notes`. No recorded audio — model audio is TTS; learner recordings scored by the DSP pipeline (score chips at `app.js:13751-13763`).

## 7. Particles (data files + hub `app.js:9826+`)
- **Reference**: 12 particles (`PARTICLES`, `data.js:6103`) — は が を に で へ の と も から まで や, each with role/tagline/uses/compare.
- **Lessons**: **18** in **9 blocks** (`particle-lessons-data.js:28,40`), each with intro/steps/takeaways/time/status.
- **Articles**: **3** (`particle-articles-data.js:18`).
- **Quiz bank**: **194 questions** (`particle-quiz-data.js:20`) — N5 96, N4 64, N3 32, N2 2; per-particle: が 25, に 25, を 21, で 20, の 18, は 16, と 15, も 14, から 12, へ/まで 10 each, や 8. Question shape: sentence/en/answer/options/explain/particle/level.

## 8. Writing (Basics) pages (`app.js:8435-8457`, renderers `8517-8530`)
1. **kana** — hiragana + katakana charts (per-script size prefs `jp:kana-size-h/k`)
2. **numbers** — counting system
3. **sentence-structure** — word-order/grammar scaffold
4. **particles** — hub hosting lessons/articles/quiz/reference above
5. **colors** — color vocabulary
6. **datetime** — days of week (7 day cards w/ images) + time-of-day (`app.js:9357-9371`)
7. **pitch** — pitch-accent patterns + notation legend, editorial scroll (notation pref `jp:pitchNotation`)

## 9. Books shelf (`const BOOKS`, `app.js:8592-8665`)
**3 recommended books** (Hiragana & Katakana workbook; 1000 Core Words; Remembering the Kanji 1), each a cover + 3-section editorial modal.

## 10. Recall mechanics vs. pure browse — and progress state
**Has a test/recall mechanic (2.5 of ~9 surfaces):**
- **Particle quiz** — the only graded quiz in the app; session state is explicitly transient (`APP._quiz`, `app.js:11077-11187`; "State is kept on APP._quiz (transient). Config preferences persist" `app.js:11090`). Final score is shown then discarded.
- **Speaking studio** — production scored vs. model (5 score dims, `app.js:13751+`); scores are per-attempt only, never persisted (only `jp:speakingCategory/Phrase/Autoplay` + STT prefs saved, `app.js:13681-15288`).
- **Restaurant scenes** (half-credit) — interactive choices with branch/order/pay steps; state persists for *resume* (`jp:scenes`, `app.js:6445-6462`; `jp:experience` = `{restaurantId, completed}`, `app.js:3508-3512`) but nothing is graded.

**Pure browse/reference:** flashcards (flip only — no shuffle-test, no known/unknown marking), all vocab books, all 7 writing pages (kana page is by design "a contemplative surface, not a quiz", `app.js:63`), dictionary, radical search, books shelf, particle lessons/articles.

**Progress/SRS/history state: NONE.** All 43 distinct `lsSet` keys are UI/nav prefs (section, page, deck, item ids), TTS/STT settings, or quiz *config* (`jp:quizSize/quizLevels/quizParticles`). The only behavioral state is scene-resume (`jp:scenes`, `jp:experience`). There is no SRS schedule, no review history, no streaks, no per-card or per-question outcome stored anywhere.

## Headline numbers (for gap analysis)
| Surface | Volume | Recall? |
|---|---|---|
| Vocab books | 5 classes / 26 books (6 empty) / ~530 items + 105 scene-menu + 28 shelf items | No |
| Restaurant scenes | 21 restaurants / 5 templates | Choices, ungraded |
| Flashcards | 17 decks / 262 cards (186 Heisig, 202 stroke, 143 image) | Flip only |
| Dictionary | 123 entries (95 kanji / 28 word) + 243-kanji reading/meaning maps | No |
| Radical search | 253 radicals / 158 decompositions / 64% deck coverage | No |
| Speaking | 2 categories / 22 pitch-annotated phrases | DSP-scored, unsaved |
| Particles | 18 lessons / 3 articles / 194-question bank (N5-N2) | Quiz, score unsaved |
| Writing | 7 pages | No |
| Books shelf | 3 books | No |