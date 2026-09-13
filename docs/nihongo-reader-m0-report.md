# Nihongo Reader — M0 evidence report

Date: 2026-09-08 · Scope: handoff milestone M0 (feasibility and contracts) · Status: **M1 go, with two manual acceptance items open**

Everything below was measured on this workstation unless marked *not verified*. No existing Nihongo app file was modified; `npm run verify` exits 0 (18 golden states identical, data validation clean).

Host: AMD Ryzen 5 5600 (12 threads), Windows 11 10.0.26200, Node v24.14.1, Playwright 1.60 with HeadlessChrome 148.0.7778.96.

## 1. Decisions confirmed or revised

| Handoff item | Outcome |
|---|---|
| Local tokenizer via Kuromoji.js | **Go**, using the ESM fork `@patdx/kuromoji@1.0.4` (Apache-2.0, same IPADIC dictionary, zero runtime deps, custom loader). The original `kuromoji@0.1.2` was not needed as fallback. |
| Dedicated Web Worker + packaged dictionary | **Works**: module worker, `fetch` from the bundle's own URL, native `DecompressionStream('gzip')`, no zlib, no remote requests. |
| Cold start ≤ 3 s, warm 200 chars ≤ 300 ms | **Met by a wide margin**: worker ready p95 345 ms; warm p95 1.6 ms (see §3). |
| Image export from image-slot.js | **Simplified**: every flashcard `<image-slot>` in app.js is `readonly`, so no custom card image can exist in IndexedDB today. The v1 library export can be built from `data.js` + `images/` by a script; the narrow read API in image-slot.js is only needed once custom card images become possible. |
| Nihongo origin | `https://khevin.com/nihongo/app.html` is live and serves the app. Default configured origin. |
| Extension identity | Added a fixed manifest `key`; the unpacked extension ID is stable: `bpkdpokjcikodoeepjfbbpmbfjlmmnlm` (`node scripts/reader-extension-id.mjs`). Needed for tests, later for exact routes and `externally_connectable`. |
| Corpus review | Gold annotation done by Claude from a first tokenizer pass with hand corrections; **not yet reviewed by a competent Japanese reader**. Numbers in §4 are provisional. |
| Lockfile / dist | `nihongo/package-lock.json` is now committed (un-ignored); `nihongo/reader-extension/dist/` is git-ignored. |

## 2. Package size (`npm run build:reader`)

| Part | Size |
|---|---|
| analysis-worker.js (tokenizer bundle, minified) | 25.3 KB |
| sidepanel.js + html + css, background.js, manifest | ~4.8 KB |
| vendor notices | 12.6 KB |
| dict/ (12 gzipped IPADIC files) | 17,375 KB (16.97 MiB) |
| **Total unpacked** | **17,418 KB (17.0 MiB)** |

Inflated dictionary in the worker: **95.6 MiB** (sum of `ArrayBuffer` bytes after gunzip). This is the memory floor of a live worker; real process memory was *not verified* (`performance.memory` is undefined in workers). Node heap delta after building the tokenizer: 152.7 MiB. Recommendation for M1: create the worker lazily on first study action and terminate it when the panel closes.

## 3. Tokenizer and worker performance

Browser numbers come from `npm run test:reader:e2e` (fixture `reader-extension/fixtures/extension-e2e.json`), mode B (see §7). Node numbers from `node scripts/reader-tokenize.mjs`.

| Measurement | Browser (HeadlessChrome 148) | Node 24 |
|---|---|---|
| Cold start: fetch + inflate 12 files + build tokenizer, 5 fresh pages | 345, 318, 334, 299, 301 ms → **p50 318, p95 345** | 354, 323, 341, 317, 292 ms → p50 323, p95 354 |
| Slowest dictionary file | tid_pos.dat.gz 306 ms | — |
| Warm tokenize, 200 chars, 20 runs | **p50 0.6 ms, p95 1.6 ms** | p50 0.7 ms, p95 1.3 ms |
| Reconstruction (tokens + gaps == text) | 3/3 sentences incl. 𠮷 | 30/30 corpus cases |
| Console errors from the bundle | 0 | — |
| MV3 CSP (`script-src 'self'; object-src 'self'`) | eval, `Function()`, inline script all blocked for page code; bundle still works | — |

## 4. Corpus accuracy (`node scripts/score-reader.mjs`)

30 cases in `reader-extension/fixtures/corpus.json`: 15 authored simple sentences, 10 excerpts from the Nintendo Triforce page, 5 adversarial (supplementary kanji 𠮷, variation selector, 々, mixed Latin, classical し + name). Token units matched on exact UTF-16 spans; documented alternative segmentations allowed; whitespace ignored.

| Group | Cases | Precision | Recall | POS accuracy on matched |
|---|---|---|---|---|
| simple | 15 | 100.0% (112/112) | 100.0% (112/112) | 100.0% (112/112) |
| site | 10 | 98.5% (135/137) | 99.3% (135/136) | 94.8% (128/135) |
| adversarial | 5 | 88.5% (54/61) | 94.7% (54/57) | 98.1% (53/54) |
| **all** | 30 | **97.1% (301/310)** | **98.7% (301/305)** | **97.3% (293/301)** |

Gates (≥ 95% precision, recall, POS on all cases): **pass**. Relations: no rule engine exists at M0, so supported-relation precision is undefined (0/0) and coverage is 0/42 gold relations (0/36 on the simple subset). The ≥ 80% coverage gate applies from M1.

Remaining errors, all in the tokenizer, none masked:
- Unknown katakana names come out as `noun` + `lexical: unknown` (ハイラル, コキリ, デク, ゼルダ). M1 rule: an UNKNOWN katakana run is a *name candidate*; show "not in dictionary".
- 聖三角 split to 聖/三/角; 牛丼 split to 牛/丼; 𠮷野家 split with 𠮷 as a symbol; the variation selector after 葛 became its own token. M1: merge an isolated variation-selector token into the preceding glyph in the adapter (display keeps it; lookup strips it, which `text.js` already does).
- Counter つ after a numeral tagged auxiliary; 森 / 樹 tagged as proper nouns in 森の守り神 / デクの樹. Context rules, not POS remaps.
- Fixed during M0: passive れる/られる (IPADIC 動詞/接尾) now map to `auxiliary`.

## 5. Live Nintendo page (`reader-extension/fixtures/nintendo-findings.json`)

Inspected in a desktop Chromium viewport. Ten Japanese text blocks; exactly one ruby (`<ruby>目論<rt>もくろ</rt></ruby>む`); 20 `<br>`, of which `<br class="sp">` sit **mid-sentence** (mobile-only breaks) while plain `<br>` sit between sentences inside one paragraph; the dash ―― is wrapped in `<span class="hyphen">`; all seven headings are images with meaningful `alt` text; 5 iframes; no open shadow roots; no `user-select: none`; no `contenteditable`. Body paragraphs are `visibility:hidden` until a scroll-triggered reveal, and modal text is `display:none` until opened, so hidden-descendant exclusion must be evaluated against the live selection at capture time.

`src/extract.js` implements the §6 capture rules and passes 10/10 fixture checks (`reader-extension/fixtures/dom/nintendo-like.html`): one block per paragraph, `<br>` as an in-block layout break, inline spans concatenated, `rt` excluded with the reading recorded as a span, hidden/duplicate/modal/script text excluded, form fields and contenteditable skipped, partial first/last text nodes sliced exactly, `alt` captured as `image-alt`, empty alt rejected.

*Not verified:* whether a live selection survives clicking the toolbar action (needs the M1 shell); mobile-viewport rendering; iframe contents.

## 6. Image resolution (`node scripts/reader-resolve-images.mjs`, fixture `image-resolution.json`)

Rules mirrored from app.js/image-slot.js: slot `flash-${card.id}`, folder `card.imageFolder || cls.imageFolder || 'kanji'`, key `folder/kanji`, extensions webp→png→jpg→jpeg, variants ` (2..9)` until the first gap.

| Total | Value |
|---|---|
| Classes / cards | 17 / 262 |
| Cards resolving to a shipped image | **152** |
| Cards with a kanji but no file | **81** |
| Cards with no image by design (17 radicals, 12 numeral cards) | 29 |
| Image files / variant files / distinct hashes | 156 / 4 / 155 |
| Total bytes | 2.54 MiB (largest 64,190 B; max side 600 px) |

Per class: basic 20/20, nature 14/15, sky-seasons 18/21, people 20/25, time 17/28, animals 14/21, colors 10/13, body 10/20, school 5/12, verbs 6/16, rooms 2/9, places 2/12, numbers 3/17, animals-2 1/2, onomatopoeia 10/11, **adjectives 0/10, food-drink 0/10**.

Findings for the app (report only, nothing changed):
- `food-drink` uses `imageFolder: 'food'`, but `images/food/` has no kanji-named files, so all nine illustrated food cards render no picture.
- `card.id` collides across classes: `sun` (basic 日 vs sky-seasons 寸) and `tea` (colors vs food-drink) share the slot ids `flash-sun` / `flash-tea`. Harmless today because those slots are readonly; the Reader keys everything by `classId/cardId`.
- Variants exist only for basic/book (×2), colors/red (×2), rooms/open (×3), and the chosen variant is not persisted, as the handoff suspected.
- Routing: no hash query parsing exists, `hashchange` early-returns on the same section, and the two existing card-jump handlers index the unfiltered deck while the renderer indexes the `vocabOnly`-filtered one (off-by-N in `colors`). M3 must add the route parser the handoff describes.

## 7. What is built (all new files; app untouched)

- `nihongo/reader-core/`: `text.js` (fingerprint v1, sentenceKey, segmentation, Unicode kanji iteration with 々 and variation selectors, ruby lookup), `tokenizer-adapter.js` (IPADIC → normalized POS, validated UTF-16 offsets, reconstruction assertion), `contracts.js` (schema v1 validators for all §9 records + analysis invariants incl. cycle check), `encounters.js` (event IDs, session policy, merge/void, projections, familiarity revisions). **31 node:test cases pass**, including every row of the §7.1 counting table that needs no browser.
- `nihongo/reader-extension/`: manifest (MV3, min Chrome 116, fixed key), `src/background.js`, `src/analysis-worker.js`, `src/sidepanel.js` + html/css (spike UI only), `src/extract.js`, fixtures (corpus, tokenizer output, image resolution, Nintendo findings, DOM fixture, e2e results), `vendor-notices/`, tests.
- `nihongo/scripts/`: `build-reader.mjs`, `reader-tokenize.mjs`, `score-reader.mjs`, `reader-resolve-images.mjs`, `reader-extension-id.mjs`.
- npm scripts: `build:reader`, `test:reader`, `test:reader:e2e`. `tests/README.md` documents the harness.

## 8. Not verified here — manual acceptance items

1. **Loading `reader-extension/dist/` as an unpacked extension.** Chrome for Testing cannot start from this tool's shells on this machine (Windows SideBySide activation error for the Chromium assembly, reproduced after a clean re-download), and Google Chrome 137+ ignores `--load-extension`. The e2e therefore ran in mode B: `dist/` served over 127.0.0.1 with the MV3 CSP header in the headless shell. To close this item: `chrome://extensions` → Developer mode → Load unpacked → `nihongo/reader-extension/dist` → open the side panel → the status line should read "worker ready in N ms". Running `npm run test:reader:e2e` from a normal terminal may also reach mode A.
2. **Japanese-reader review of the gold corpus** before the accuracy numbers are treated as correctness evidence.

## 9. M1 recommendation

Proceed to M1 (one complete reading loop) on the current stack. Carry these into M1: lazy worker lifecycle for the 95.6 MiB dictionary; adapter merge of stray variation-selector tokens; UNKNOWN-katakana name candidates; the grammar rule set that turns the 36 simple-subset gold relations into the first coverage measurement; a script that builds the sample library package from `data.js` + `images/` (no app change needed until custom card images exist).

---

# M1 status — one complete reading loop (2026-09-08, same day)

Built on the M0 stack; still **no existing app file changed** (`npm run verify`: 18 golden states identical). Design decisions taken with Khevin: follow the lesson's four block kinds (い-adjectives ride in the green verb block, な-adjectives in the orange noun block, both labelled), keep white block text (contrast logged for M2), and a Words / Phrases toggle.

## What the loop does now

1. Select text on a page → click the action or press Alt+Shift+N → the side panel opens inside the same gesture and `capture.js` is injected with `activeTab`. The capture (blocks + ruby + source, no DOM nodes) is parked in `chrome.storage.session` per tab, so panel-first and capture-first both work. Restricted pages fall back to a paste box.
2. The panel segments sentences, analyses the active one in the worker (tokens + grammar v1), and renders the Sentence Structure diagram: romaji line (off by default), interlocking clip-path blocks with the lesson's palette, particle diamonds with the 12 hues, a legend with a learner-facing role per word, `role="list"` + `aria-label` per block, uncertainty shown as a stripe overlay.
3. Clicking a block opens the word panel (reading, dictionary form, part of speech, conjugation, dictionary membership, your word cards) with one button per kanji; clicking a kanji opens the kanji panel: card availability (standalone / compound-only / none), the mnemonic image from IndexedDB (blob URL, offline), keyword + Heisig story on demand, familiarity (4 states), "Want a flashcard", studied-encounter count with first/last/source, "Open in Nihongo".
4. After a sentence renders, one `STUDY_SENTENCE` goes to the service worker, which owns the session policy and writes events + aggregates in one IndexedDB transaction. Retries, re-renders, duplicate tabs and repeated sentences in a session add 0.
5. Library import: a ZIP built by `npm run build:sample-library` (125 cards from six decks, 96 images, 1.7 MB) is preflighted (schema, paths, hashes, bounds), staged, then activated atomically. An older revision is refused.

## Measured

| Check | Result |
|---|---|
| Grammar v1 vs corpus gold (supported relations) | precision 100% (49/49), coverage 100% (49/49); simple subset 36/36, site 13/13 — gates ≥95% / ≥80% pass |
| Tokenizer (unchanged) | P 97.1%, R 98.7%, POS 97.3% |
| Unit tests (`node --test reader-core`) | 42/42 (contracts, text, encounters, adapter, romaji, library, grammar) |
| DOM extraction fixtures | 10/10 |
| Repository in real IndexedDB (headless shell) | 13/13: retry same actionId = 0, concurrent double-send = once, reload = 0, undo void + no resurrection, 30-min expiry = new session, new browser run = new session, familiarity/wantCard revisions |
| Panel e2e, served-dist mode with MV3 CSP | 18/18: import → blocks (7 words, correct kinds) → legend roles → 森 word panel → card `nature/forest` with 600 px image → reveal → count 1 → familiarity → reload keeps 1 → second sentence → 2 → Phrases view groups 森の守り神 → no console errors |
| Worker cold start / warm 200 chars (mode B) | p95 287 ms / 1.3 ms |
| Bundle | sidepanel 52 KB, worker 41 KB, background 12 KB, capture 3 KB; total unpacked 17.5 MiB (dictionary 17.0) |

Relation-scoring rule, stated plainly: に/で/と keep neutral labels ("に-marked — target, place, or time") and count as correct when the gold role is one the particle can carry; heads may match on the bare noun/verb (前, 降った) while dependents include their particle (前に), because that is how the gold was written.

## Known limits (honest list)

- Grammar v1 covers the 36 simple-subset relations and 13 relations from four Nintendo sentences (incl. quoted names 「デクの樹サマ」から, relative clauses bounded by commas, adverbial nouns like ある日); broader rule families (coordination, quotation, keigo, more connectors) are M2 work and will be measured against new gold, not assumed.
- Unknown katakana runs (ハイラル, コキリ) are labelled "noun · not in the tokenizer dictionary — may be a name"; a name-candidate rule is still pending.
- The stray variation-selector token (葛󠄀) is not yet merged in the adapter.
- A wrapped block row starts its second line with a notch, as in the lesson.
- Extension e2e still runs in mode B here (Chrome for Testing cannot spawn from these shells); the chrome-extension:// load was verified by hand for M0 and needs the same manual pass for M1: load `reader-extension/dist` unpacked, select a sentence on the Nintendo page, click the action, confirm blocks, open 森, restart Chrome, confirm history and the new-session count.
- Corpus gold and the new relation gold remain unreviewed by a competent Japanese reader.

---

# M2a status — in-page reading: FAB + floating bar (2026-09-09)

Prompted by Khevin's first live use: the block row is horizontal and wide, so the 400 px side panel wrapped it into four lines. Decisions taken with him: broad host access with an on/off popover on the icon; the bar must work with the panel closed; the floating button appears only for selections containing kana or kanji. Still **no existing app file changed** (`npm run verify` identical).

## What changed

- **Entry point.** A content script (`content.js`, manifest `host_permissions` http/https, `run_at: document_idle`) watches selections; when a selection holds ≥ 2 kana/kanji, a 36 px 札 button appears above it, at the selection's start in the left half of the screen or its end in the right half, clamped inside the viewport, below the selection when there is no room above. Alt+Shift+N (`commands.study-selection`) does the same. Everything lives in a closed shadow root; the page's layout is provably untouched (bar e2e compares every paragraph's rect before and after).
- **Floating bar.** Bottom-centred, ≤ 960 px, dark like the lesson: the block row (Words / Phrases, romaji toggle), sentence `i / n` with ‹ ›, status, Details, ×, Escape to close. Tapping a block marks it and asks the service worker to open the side panel on that word (`focus:<tabId>` in `chrome.storage.session`).
- **Analysis host.** The single tokenizer worker moved to an offscreen document (`chrome.offscreen`, reason WORKERS, Chrome 109+), created on demand and closed after 10 idle minutes, so bar and panel share one 95 MiB dictionary and the bar works with the panel closed. The panel routes its analyses through the service worker too, falling back to a local worker only when no extension runtime exists (served-dist tests).
- **Popup on the icon.** Master switch, per-site mute, "Study selection", "Open side panel", default view, romaji default, Nihongo URL, library status. The icon click now opens this popover instead of the panel.
- **Shared renderer.** `blocks.js` split into row and legend builders; the diagram CSS moved to `blocks.css` (linked by the panel, embedded in the bar's shadow root). Ruby spans now survive normalization through `toDisplayTextWithMap` + `remapSpans`.
- Manifest 0.2.0 ("Nihongo Reader"); `activeTab`/`scripting` dropped; `offscreen` added; `capture.js` folded into `content.js`.

## Measured

| Check | Result |
|---|---|
| Unit tests (`node --test`, incl. FAB placement + Japanese detection + ruby remap) | 48/48; grammar still 49/49 |
| DOM extraction / IndexedDB repository | 10/10 / 13/13 |
| Bar e2e (headless shell, `chrome.*` stubbed to an in-page worker) | 13/13: FAB position, single-kanji ignored, 7 blocks, bar 960×130 at the bottom, one commit per sentence, block tap → details, Phrases view, 2-sentence queue, ruby kept, Escape, layout untouched, switch-off removes the UI |
| Panel e2e / extension e2e | 18/18 / green (cold p95 288 ms) |
| Bundle | content 33.5 KB, sidepanel 55.6 KB, background 13.4 KB, popup 9.3 KB, offscreen 1 KB; total unpacked 17.6 MiB |

## Not verified here (owner)

- The real chain service worker → offscreen document → content script, and `sidePanel.open` triggered by a tap inside the page's shadow DOM (documented as a valid gesture; if Chrome refuses, the bar shows "open the side panel from the Nihongo icon" and the popup's button is the route).
- Reloading the unpacked extension will prompt for the new permissions (all http/https sites). Then: Nintendo page → select → 札 → bar → tap 森 → panel opens with the card; popup switch off → no FAB; Alt+Shift+N; restart Chrome → history intact.

## Feedback round after live use (same day)

Khevin verified the FAB and bar on the Nintendo page (10 encounters saved) and asked for five changes, all done and covered by the panel e2e (now 21/21):
- The side panel no longer duplicates the block diagram for bar-driven captures; it shows the sentence as text plus details. Pasted text (no bar) keeps the full diagram.
- **Listen** (🔊) on the bar, on the panel's sentence line and in the word panel: Web Speech with the app's voice preference order (Google 日本語 → … → Nanami), rate 0.85 by default, 700 ms debounce on identical text; a speech-rate slider lives in the popup. The app's optional Google Cloud voice path is not mirrored (needs the user's key).
- The "partial analysis" line is gone everywhere; the bar's button reads "Side panel ›".
- The kanji panel has ‹ back to its word, so the other kanji of the same word stay one tap away; Escape steps kanji → word → phrase → closed.
- A phrase block (e.g. ハイラル王国の辺境) lists its words first (王国, 辺境, each with reading and romaji), then a separator, then the individual kanji as chips carrying the card's readings when a card exists; choosing a word narrows the panel with ‹ back to the phrase.
- Root cause of "where's the floating panel?": Chrome only injects a newly declared content script into pages loaded after the extension reload. The service worker now injects `content.js` into all open http/https tabs on install and update (`scripting` permission restored).
- **Meanings, right-aligned like the app's vocab lists.** Word rows read `王国 · オウコク · oukoku …… kingdom · noun`. The English comes only from the learner's own Nihongo material, in this order: an exact card keyword, an example word on a card, the imported glossary, a single kanji's meaning. The glossary is a new package file (`glossary.json`) built from the app's `DICTIONARY` (123 entries), `KANJI_MEANINGS`/`KANJI_READINGS` (243) and the selected decks' example words — 472 words and 273 kanji in the sample library. Words nothing local knows get a "translate ⇗" link to Google Translate (constructed URL, user-triggered, per handoff §11); no dictionary is scraped or bundled.
- **Compound particles.** 森には is に (case) + は (topic). The rules already attached both to the same noun group; the renderer now draws them as one wide diamond in the に hue (`には`, also では/とは/からは/までは/にも/でも…), the romaji line reads "ni wa", the legend says "に + は — at / to / in …, made the topic", and the relation label carries "· made the topic (は)". Two-character particles (から, まで) also get the wide shape instead of a cramped 36 px rhombus. Covered by `tests/unit/blocks.test.mjs` (51 units total).

- **Furigana toggle** (next to romaji, in the bar and the panel's paste mode, persisted in prefs). Kanji-bearing words get `<ruby>` readings: the publisher's ruby wins for exactly the span it covers, even inside a longer token (目論む → 目論〈もくろ〉む), otherwise the tokenizer reading converted to hiragana; kana words and particles get none. The bar's save-success text and the "· fragment" tag are gone; only errors are shown. Tests: unit (52 total) + bar e2e (15/15).

- **Inline translation.** "translate" no longer navigates the tab away. It renders a section at the bottom of the panel: Japanese on top, the target language below, Google's dictionary senses when available, provider note, and "open in Google Translate ⇗" as the fallback. Provider: Google Translate's public endpoint by default (unofficial, no key), or Google Cloud Translation v2 with the learner's own key from the popover; target English or Português (Brasil). Results are cached in memory and in IndexedDB (schema v2 adds `translations`), so a word is fetched once. Strictly user-triggered: no text leaves the machine until "translate" is clicked. This departs from the handoff's "no embedded API dependency" by owner request, with the external link kept as the guaranteed path. Panel e2e 24/24 (endpoint mocked), units 54.

- **Reading mode.** While the bar is open, finishing a new selection (mouse or keyboard release) replaces the bar's content directly; the 札 button stays hidden. Only the end of a selection triggers it, so partial drags are never analysed or counted, and re-releasing on the same text is ignored. Closing the bar returns to button mode. Bar e2e 18/18.

- **Motion, compact furigana, side-panel gesture.** The 札 button slides down into place (220 ms, ease-out); the bar bounces in from below (420 ms, overshoot curve) and the block row settles briefly when the sentence changes; all disabled under `prefers-reduced-motion`. Furigana no longer grows the blocks: the ruby line uses the block's own vertical slack (8 px readings, tight line-height), verified equal heights with and without. "Side panel ›" had two defects: the service worker awaited a storage write before calling `sidePanel.open`, which can spend Chrome's user-gesture window, and the bar ignored an `opened:false` reply. The open call now happens first, synchronously in the message handler, and a refusal shows a clear hint in the bar.

- **Automatic library (no manual zip).** `npm run build:library` now writes `nihongo/reader-library/{manifest,cards,glossary,lessons}.json` (326 KB, committed with the app and served by the site) for all 17 decks — 262 cards, 155 images, glossary 792 words / 318 kanji. Identity is content-addressed (`contentHash` → `snapshotId`; `revision` increments only when content changes, verified: a second build is a no-op). `npm run build:reader` copies the JSON plus the referenced images (from `images/`, by `sourcePath`) into `dist/library/`, so the first run works offline. `library-sync.js` imports the bundled copy when nothing is active, then checks `<Nihongo origin>/reader-library/manifest.json` and upgrades when the site publishes a newer revision, fetching images from the site's own `images/` paths and verifying every sha256 through the same preflight as a zip import. Runs on install, on browser startup, on panel boot (6-hour throttle) and from the popover's "Check for updates"; "Replace…" still accepts a zip. Tested end to end against a fake site: bundled import, no re-import on identical content, upgrade on a newer revision, tampered image rejected with the previous snapshot kept (5/5).
- **Translation fades** (300 ms) when the learner moves to another word or sentence, instead of lingering under unrelated details.
- **Pictures under the translation.** "translate" (and a new "pictures" control on the meaning row) also fetches a small horizontal gallery of images for the word: up to 15 thumbnails (84 px tall, first 10 then "more"), each linking to its source page, plus "open in Google Images ⇗". Sources, first key present wins: **Pixabay** (owner's first choice, 2026-09-09: free key, photos and illustrations, `lang=ja` so 広がる searches natively, safesearch on, 100 requests a minute), then Google's Programmable Search Engine (Custom Search JSON API, `searchType=image`, key + search-engine id, 100 free queries a day; the only sanctioned way to get real Google Images results, since scraping the results page is fragile and against Google's terms), otherwise Wikimedia Commons (free, no key, CORS; fine for concrete nouns, drifts on verbs). Probed keyless alternatives and rejected them: Openverse rate-limits anonymous calls on the first request, Japanese Wikipedia lead images are worse than Commons (森 → people named Mori), Irasutoya has no API, Bing Image Search was retired in 2025. Text-only results are screened without OCR by a 40×40-pixel heuristic (one dominant flat colour ≥ 50 %, ≤ 40 distinct colours, low saturation, or a very flat card with many sharp edges) in `panel/image-filter.js`; screened items are counted ("show 1 text-only") and one tap away. Live check on Commons for 森: the kanji-glyph image was screened, nine photos stayed. Results are cached in IDB with the translations; thumbnails are fetched by the extension and shown as blob URLs (revoked on close). Late answers from an earlier lookup of the same word are ignored (per-request id). Panel e2e now 28/28 with Google + thumbnails mocked and Commons stubbed.
- **Listen speaks with the app's Google Cloud voices.** The extension now mirrors the app's cloud path, not just its Web Speech one: the same `gcloud:<voice>` preference shape, the same five ja-JP voices (Neural2 B/C/D, WaveNet A/C), the same `texttospeech.googleapis.com` request (MP3, `speakingRate` from the rate slider, clamped to the API's 0.25–4.0). The popover gained a voice picker, a key field, "Test voice" and "Import key from the app". Import reads `jp:gcloudTtsKey` out of an open Nihongo tab on an explicit click, since the app keeps its key in that origin's localStorage and nowhere else. Two design points: the key never reaches a content script, because the service worker resolves prefs and answers `{played:false}` when no cloud voice is set, which tells the bar to use its own browser voice; and the fetch plus the `<audio>` live in the offscreen document (now created with reasons WORKERS + AUDIO_PLAYBACK), because a host page's Content-Security-Policy can block both for the in-page bar. Every failure falls back to the browser voice so a tap always makes sound, except in the popover's Test, which is strict and shows Google's own text ("403 — Requests from referer … are blocked"). One clip at a time: a fetch that resolves after a newer request or a bar close drops its clip. Covered by 5 TTS units, 4 offscreen-playback units, 2 bar e2e checks, 2 panel e2e checks and `tests/popup.e2e.mjs` (11 checks).
- **"Voice failed: the extension did not answer" (owner, 2026-09-09).** An unpacked extension re-reads the popover and the panel from disk every time they open, but keeps running the service worker it started with. After a rebuild without pressing Reload on chrome://extensions, those pages were the new build while the worker was the old one, so the SPEAK message hit a worker that had never heard of it, and Chrome resolved the send with `undefined`. Two changes: the side panel and the popover no longer involve the worker at all, since they are extension pages and can fetch and play the clip themselves (`playCloud` / `localRemote` in `panel/tts.js`); and the popover asks the worker a PING on open, saying in words when it is from an older build and what to do about it. Only the in-page bar still needs the worker, because a host page's CSP can block both the request and the data: audio, and its failure path was already a quiet fall back to the browser voice.
- **Popover rebuilt after a design review** (`docs/nihongo-reader-popover-review.md`, design-expert review mode at sub-surface depth). The popover had grown from three defaults to thirteen controls inside one flat two-column grid: nine of them had no programmatic label, three picture credentials were told apart only by placeholder text, the row label was vertically centred against tall stacks so it floated beside the wrong field, and "Defaults" had come to hold API keys. Now each subject is its own disclosure (reading, voice, translation, pictures, app) with a hairline and a lowercase italic head in the side panel's idiom, every control carries a real `<label for>` above it with the identity out of the placeholder, the two mini buttons meet the 24 px target, and the furigana default joins romaji as the bar has always shown them. Closed the popover is 453 px and fits Chrome's 600 px limit with its first section open; before it was 871 px with everything at one level. Four new popup e2e checks assert the labelling, the grouping, the target size and the height.
- **One click, one request** (owner hit a quota, 2026-09-09). Nothing in the reader translates by itself: the in-page bar never calls a translation API, and every request comes from a click in the panel. The multiplier was a design decision of mine — "translate" also fired a picture search, so a learner with a Custom Search key spent two quotas per click, and Custom Search's free tier is 100 queries a **day**, the smallest budget in the extension and the likeliest source of the limit the owner saw. Pictures are now their own action, offered on the word's meaning row and in the translation footer. Caching was already correct and is now asserted: a repeat translation of the same word costs no request. `panel/usage.js` counts what actually goes out, per kind and provider, per local day, and the popover shows it under the keys ("today: 7 of 100 Google picture searches · 3 translations"), turning red at the cap. Only uncached calls are counted. Two panel e2e checks now measure real outbound requests, so a future feature cannot quietly attach itself to a click again.
- **The reader carries its own kanji dictionary** (2026-09-13). `scripts/build-kanji-index.mjs` (`npm run build:kanji`) generates `nihongo/kanji-index.json` from KANJIDIC2 (EDRDG, CC BY-SA 4.0, attribution kept in the file's `_license` field): all 2,136 jōyō characters with up to three on and three kun readings, up to four English meanings, stroke count, grade, JLPT level and newspaper frequency. 284 KB raw, 73 KB gzipped; the download itself is cached in `nihongo/.cache/` and git-ignored. A curated `nihongo/pop-culture.json` adds 93 hand-written game terms tagged zelda / mario / pokemon / nintendo, each with the reading, a short meaning, and a line saying where you meet it (図鑑 → ポケモン図鑑, the Pokédex). Both fold into the library glossary, which now answers 2,157 kanji and 856 words; the learner's own cards and dictionary are written last and win any collision. The glossary schema gained `on`, `kun`, `tags` and `seen`, so the kanji panel finally has something to show for a character with no flashcard: readings, meaning and provenance ("everyday kanji", "games", "your cards"). The whole library JSON went from 326 KB to 599 KB, which is the entire cost of never asking Google about a single kanji again.
- Deploy note: the site must serve `nihongo/reader-library/` for remote updates to flow; until it is committed and published, the bundled copy is what the extension uses.

## Known limits carried to M2b

Counter つ after a numeral still renders as a stray block (IPADIC tags it 助動詞); a wrapped bar row starts its second line with a notch; unknown katakana names are "noun · not in dictionary"; block-text contrast decision pending; corpus gold unreviewed.
