# Nihongo Reader — Chrome extension implementation handoff

Version: 1.0 · Prepared: 2026-09-08 · Status: proposed implementation specification

This document is the development handoff for a personal Chrome extension that connects Japanese websites to Khevin's existing Nihongo project. It is self-contained. No extension, parser, export feature, or site integration was implemented while preparing it. Only this Markdown document was created.

The user requested planning first, with development deferred to a later session. Reading the handoff does not authorize deployment, publishing, or starting scheduled work. A future development request should begin with milestone M0 below.

For a quick review, read sections 1, 4, 7, and 14. For implementation, read the contracts and runtime decisions in sections 8–12 before starting. Source links use the original workstation's absolute paths; on another machine, use the filenames and named symbols to locate the same code in the repository.

## 1. Outcome and product decisions

Enable the learner to read real Japanese websites with progressively revealed guidance:

1. Understand a sentence through Nihongo's particle-tagged blocks and predicate anchor analogy.
2. Recognize a kanji through their own flashcards and mnemonic pictures.
3. Accumulate a reliable list of encountered kanji, including characters with no flashcard.
4. Look up an unfamiliar word or character externally when local learning material is insufficient.
5. Bring encounters back into Nihongo to choose what to learn next.

The initial reference page is [Nintendo's Triforce page](https://www.nintendo.com/jp/games/switch2/aa9ja/triforce/index.html). Success is reading several passages there, understanding useful grammatical relationships, recovering a familiar mnemonic, and recording repeat encounters accurately.

### Decisions to carry into development

| Topic | Recommended decision |
|---|---|
| Interface | Chrome side panel beside the original website; selection is the first capture mechanism. |
| Help order | Structure, then optional reading or mnemonic, then word meaning, then external sentence translation. |
| Analysis | Local morphological analysis plus conservative grammar rules; explicit partial results when relationships are uncertain. |
| Data ownership | Nihongo owns cards and pictures; the extension owns reading sessions, encounters, and reader familiarity labels. |
| Integration v1 | Versioned file import/export in both directions. |
| Integration v2 | An explicit connection to the configured Nihongo origin, reusing the same contracts. |
| Meaning of “seen” | A kanji in a sentence explicitly opened for study, counted once per distinct sentence per reading session. |
| Learning status | Separate from card availability and separate from FSRS review state. |
| External lookup | User-triggered navigation to search/translation/reference websites; no embedded API dependency. |
| Delivery | A locally loadable unpacked extension and small, tested Nihongo integration changes. |

Defaults: English explanations, Japanese text preserved, romaji off, furigana off, English glosses off, automatic encounter recording on when opening a sentence for study. Allow English/Portuguese lookup preference without duplicating grammar content in v1.

### Scope boundaries

The first release includes selection, sentence queues, word and phrase blocks, kanji/card previews, imported mnemonic images, encounter history, lookup links, file exchange, and exact links back to cards/lessons.

Defer page-wide rewriting, passive background tracking, OCR, automatic card/image generation, full offline bilingual dictionaries, cloud accounts, cross-device synchronization, AI explanations, review scheduling inside the extension, Firefox support, and store publication. These are extensions of the product, not prerequisites for the first reading loop.

## 2. What was verified in the existing project

The local source was inspected on the preparation date. Browser profile data, custom images in the user's running browser, and live interaction behavior were not inspected. Source observations are distinct from proposed behavior below. Line references may move as the project changes.

| Existing component | Evidence and implication |
|---|---|
| Static browser app | [app.html](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.html>) loads classic scripts, including data, image slots, lessons, FSRS, and app logic. Avoid introducing a framework migration as a dependency. |
| Sentence analogy | [app.js:10168](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.js:10168>) contains the sentence-structure lesson: particles as tags, noun/verb/particle blocks, and the verb as anchor. |
| Existing palette | [app.css:14281](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.css:14281>) defines noun orange, verb green, particle teal, stop purple, and individual particle hues. Extend these tokens rather than inventing another visual language. |
| Authored decks | [data.js:2256](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/data.js:2256>) declares `window.FLASHCARD_CLASSES`. Cards carry IDs, glyphs, readings, English keywords, examples, and optional extra fields. Multiple cards may refer to the same kanji. |
| Review identity | [app.js:1384](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.js:1384>) uses the class ID plus the card ID, falling back to its kanji, separated by `/`, for SRS identity. Preserve this scheme. |
| Review persistence | [app.js:1354](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.js:1354>) reads `jp:srs` from localStorage. Absence from this store means no scheduler record, not proof that a character is unknown. |
| Mnemonic assets | [image-slot.js:62](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/image-slot.js:62>) uses IndexedDB database `nihongo`, store `image-slots`, and migrates legacy `jp:image-slots`. The opening file comment still mentions localStorage; the implementation is authoritative. |
| Actual image selection | [image-slot.js:755](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/image-slot.js:755>) resolves custom stored images, shipped images/variants, and authored sources. Crop/zoom sidecars can exist without image bytes. |
| Canonical card picture | [app.js:11849](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.js:11849>) starts the editorial card renderer. Image folder priority is card override, class override, then `kanji`; the key is `card.kanji` and the slot is `flash-${card.id}`. Related grids use other slot IDs. |
| Variant caveat | [image-slot.js:934](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/image-slot.js:934>) changes `_variantIdx` in memory. No durable selected-variant write was found in that handler. Do not promise existing variant preferences survive export/restart automatically. |
| Mnemonic notes | [heisig-data.js](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/heisig-data.js>) declares lexical `const HEISIG`, not `window.HEISIG`. Likewise, `APP` is not a window property. Pass these values explicitly to new integration code. |
| Particle lessons | [particle-lessons-data.js](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/particle-lessons-data.js>) supplies stable lesson IDs, particle associations, content, and readiness status. Link only to available lessons. |
| Navigation limitation | [app.js:13462](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.js:13462>) handles section-level hash changes and returns early if the section is unchanged. Exact-card/lesson routing needs an explicit addition. |
| Filtered cards | [app.js:12701](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/app.js:12701>) removes `vocabOnly` cards in the flashcard view. New routes must resolve against the displayed deck rather than an unfiltered array index. |
| Tooling | [package.json](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/package.json>) already includes esbuild, Playwright, and validation/interaction scripts. |

The repository's [CNAME](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/CNAME>) contains `khevin.com`. Treat `https://khevin.com/nihongo/app.html` as a candidate app URL, not a verified deployment endpoint. Onboarding should accept the actual Nihongo URL. Localhost and production are different origins and can contain different personal images/state.

## 3. Verified Nintendo extraction requirements

The public page's server HTML was read. It contains selectable paragraph text, `br` elements used for layout, headings represented by images with alternative text, responsive `picture` sources, and ruby annotations. JavaScript and final rendered visibility still need browser verification in M0. [Source page](https://www.nintendo.com/jp/games/switch2/aa9ja/triforce/index.html)

Concrete implications:

- Do not split sentences at every line break. The page puts responsive line breaks inside grammatical sentences.
- Preserve ruby base text and its reading separately. The inspected markup includes `<ruby>目論<rt>もくろ</rt></ruby>む`; the analysis text must contain the base characters followed by the outside kana, without inserting the ruby reading into the sentence.
- Offer a separate “Read image text” action for meaningful `alt` text. Empty alternative text is not a sentence.
- A responsive `picture` is one content item. Do not count its alternative image sources as multiple encounters.
- Treat names, noun phrases, and literary language as expected inputs. A marketing heading does not necessarily contain a complete modern Japanese sentence.
- Ship generic extraction behavior. Keep any Nintendo-specific workaround isolated and introduce one only after a failing fixture establishes the need.

No complete page copy or remote artwork needs to be included in the extension or this handoff.

## 4. Interaction specification

### 4.1 Entry and sentence queue

1. The learner selects text and clicks the extension action or uses its configured shortcut.
2. Initiate selection capture in the action handler and open the side panel from the same user gesture without waiting for analysis.
3. While authorized, the capture script retains the latest valid Range/text for its document. Initial activation has no previously injected listener, so M0 must verify selection survives the toolbar/shortcut flow; do not assume it does.
4. For one sentence, open it directly. For multiple sentences, open the first and show a navigable queue; only the active sentence becomes an encounter.
5. A selection without ending punctuation remains usable as a fragment. Do not automatically widen it into unrelated paragraphs.
6. With no selection, show an empty state with selection instructions and a paste box. Opening an empty panel records nothing.

After initial activation, later selections can show a “Study selection” action. Selection changes alone do not record encounters. Add a selection context-menu entry after the main action flow works.

If initial toolbar focus makes capture unreliable, promote the selection context-menu entry into M1. Its `selectionText` is a plain-text fallback when a live Range cannot be recovered. Label that fallback internally, omit unsupported DOM highlighting/ruby mapping, and offer correction/paste if the captured text is wrong. Never present stale text from another document as the new selection.

The panel header shows the source title, domain, sentence position, and a link back. Each capture is bound to its originating tab/document. Switching tabs never silently reattributes an existing sentence. Disable “show on page” if the original document is gone; keep the captured sentence readable.

Chrome supports side-panel content alongside a page. `sidePanel.open()` requires a qualifying user interaction; use the action or context-menu handler directly, before awaiting expensive work. Set Chrome 116 as the initial minimum if using this method, and verify against that baseline. [Chrome side-panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel?hl=en)

### 4.2 Sentence presentation

The first view contains Japanese text, grammatical block shapes, short role labels, and an optional predicate anchor indicator. The natural order never changes. Color always has an accompanying label or shape cue.

Two levels share the same offsets:

- **Words:** noun, particle, verb, i-adjective, na-adjective, adverb, auxiliary, conjunction, name, punctuation, or unknown.
- **Phrases:** a noun group with its particle tag, a predicate group, or a modifier group attached to another block.

Do not add separate kanji status background colors over part-of-speech colors. Use a small underline/dot and the details panel for card availability and familiarity. Give adjectives a distinct, accessible extension of the existing palette. Explanations remain short; linguistic diagnostics belong in an optional developer view.

### 4.3 Clicking blocks and characters

Clicking a phrase opens its job in the sentence and a relevant Nihongo lesson link. Clicking a word opens its reading, dictionary form, and supported form details. The word panel exposes individual kanji as buttons so glyph selection does not conflict with phrase selection.

A kanji detail card shows:

- Character and the selected containing word.
- “In your cards” or “No standalone kanji card”; compound-only references are labeled separately.
- The preferred card's mnemonic image; reveal its English keyword/story on demand.
- Familiarity label, encounter count, first/last encounter, and recent source examples.
- “Open in Nihongo”, external lookup actions, a note, and “Want a flashcard”.

Do not silently choose among conflicting deck mnemonics. Use a saved preferred card per kanji when set; otherwise use the current imported deck preference, then stable authored order. Offer the other matches without changing any card's identity.

### 4.4 Accessibility and interaction states

Support keyboard sentence navigation, focusable word/kanji buttons, Escape to close details, visible focus, readable Japanese font sizes, and a persistent compact legend. Test the side panel at approximately 320, 400, and 600 CSS pixels wide. Long phrases wrap without detaching the particle visually from its noun group.

Represent loading, partial analysis, no card, missing image, stale import, storage failure, and unsupported page as distinct states. Imported metadata without an image is still useful. A parser failure must leave the text, kanji lookup, and encounter controls operational.

## 5. Grammar strategy and limits

### 5.1 Preserve the analogy without teaching incorrect rules

Use **predicate anchor** as the implementation concept. Verbs, adjective predicates, and noun/copula predicates can anchor clauses. A sentence can contain multiple clauses; a noun phrase can contain an internal predicate without a main clause predicate.

For the short Nintendo phrase **コキリの森で暮らす少年。**, the intended manual annotation is:

```text
[ [コキリ の 森] で 暮らす ] -> 少年
          place    verb        head noun
└──────── modifies 少年 ────────┘
```

This is an analysis target, not output from an implemented parser. Show the noun phrase and its internal relationship; do not invent a final verb. Japanese noun modification can involve predicates and clauses, which motivates the nested representation. [Nintendo example](https://www.nintendo.com/jp/games/switch2/aa9ja/triforce/index.html), [NINJAL-hosted research on noun modification](https://mmsrv.ninjal.ac.jp/adnominal-modification/pdf/Syntax-and-Semantics-of-Noun-Modification-Part1.pdf)

### 5.2 Pipeline

```text
Captured text + source mapping + optional ruby
    -> sentence/fragment boundaries
    -> local tokenizer adapter
    -> lossless surface token stream
    -> lexical/form normalization
    -> conservative phrase grouping
    -> supported relation candidates + warnings
    -> Nihongo card/lesson references
    -> rendered study view
```

Start by evaluating Kuromoji.js with its packaged dictionary. It returns surface forms, positions, parts of speech, dictionary forms, readings, and conjugation fields; these are useful building blocks, not dependency relations or English translations. Its `KNOWN`/`UNKNOWN` field describes dictionary membership, never learner knowledge. [Kuromoji documentation](https://github.com/takuyaa/kuromoji.js)

Use a dedicated Web Worker owned by the extension panel for tokenization and grammar rules. The current browser dictionary loader uses XHR and decompression; prove it works with packaged extension URLs and the chosen bundle. Do not place this browser loader in the extension service worker without adapting it. Record package versions, dictionary provenance, installed size, cold-start time, and steady-state memory. [Kuromoji loader source](https://github.com/takuyaa/kuromoji.js/blob/master/src/loader/BrowserDictionaryLoader.js)

If the candidate fails M0's compatibility or accuracy gate, retain the adapter contract and evaluate another local morphological engine. Do not compensate for a failed tokenizer by calling single-character splitting “sentence analysis”. A backend parser or AI service is a separately scoped decision after the local baseline is measured.

### 5.3 Initial rules

| Rule family | Supported first behavior | Guardrail |
|---|---|---|
| Noun groups | Group supported compounds and noun + の + noun patterns. | Avoid deciding that every の means ownership; nominalization and other uses remain separate. |
| Particle attachment | Attach recognized case/topic particles to the preceding supported group. | Never find particles by matching kana inside arbitrary words. |
| Predicate forms | Group verbs with recognized auxiliaries/endings; retain expandable underlying tokens. | Display only form features justified by the analysis. |
| Adjectives | Distinguish i-adjectives and na-adjective stems; show supported modifiers/predicates. | Do not classify by the final character い alone. |
| Simple noun modifiers | Identify a tested predicate/adjective phrase before a head noun. | Missing or competing attachment evidence yields an uncertain group, not a forced arrow. |
| Coordination/subordination | Preserve boundaries and supported connectors. | Do not attach every argument to the last verb. |
| Names/unknown spans | Preserve exact text and expose character lookup. | Do not fabricate readings for fantasy names. |
| Literary constructions | Preserve text and tag unsupported analysis when necessary. | Do not silently turn a literary form into a modern tense analysis. |

Particle roles require context: は can mark topic/contrast; が has different uses across constructions; に can indicate destination, time, recipient, and more; で can indicate action location, means, cause, and more. Begin with verified narrow rules and neutral labels such as “に-marked phrase” when a semantic role cannot be resolved.

### 5.4 Uncertainty contract

Use discrete statuses: `supported`, `uncertain`, and `unavailable`. Store the rule ID, evidence spans, and alternatives for every phrase relation. Do not invent numeric confidence percentages from a rule engine that has no calibrated probabilities.

Confidence is local to a claim. A sentence may have reliable word tags and an uncertain clause boundary. Render supported detail while hiding or marking the uncertain relation. Manual corrections, if added later, belong to the saved analysis and must not mutate source text or retokenize encounter identities.

### 5.5 Readings and vocabulary

Prefer publisher ruby for the span it actually covers, then tokenizer word readings, then a reliable whole-word match in imported Nihongo data. Preserve provenance and allow conflicts to be visible on expansion. Ruby can be creative, and a kanji card's on/kun list is not a contextual pronunciation algorithm.

Keep multi-kanji words intact for vocabulary lookup while indexing their individual characters for mnemonics. Handle inflected vocabulary via the lemma when supported. An exact compound match and a set of individual kanji matches are different results.

## 6. Text capture and offset contract

Capture only selected content or an explicitly chosen image's alternative text. A content script can read the page DOM but executes in an isolated JavaScript world; it cannot directly consume Nihongo's page globals from an unrelated tab. Use structured messages to the extension. [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

Implementation requirements:

1. Walk text nodes intersecting the selected Range, respecting partial first/last nodes and inline spans. Maintain a source map back to original nodes and UTF-16 offsets while that document is alive.
2. Exclude script/style/template content, ruby `rt`/`rp` from base text, and hidden descendants. Avoid wholesale `innerText` or `textContent` extraction as the only strategy.
3. Do not collect text from input, textarea, or contenteditable fields automatically. The panel paste box remains an explicit alternative.
4. Treat `br` as a layout boundary initially; use punctuation and parent block boundaries to segment sentences. Honor Japanese quotes and retain punctuation with the sentence it closes.
5. Split paragraphs into a queue without merging unrelated block elements. Label unfinished selections as fragments.
6. Reject inaccessible frames/closed shadow roots cleanly; first release targets the top frame's ordinary DOM. Optional open-shadow support follows a fixture. Manual paste is the fallback for restricted pages, PDF viewers, or image-only text.
7. For image alternative text, keep `captureKind: 'image-alt'`; highlight the image element rather than pretending to have character-level coordinates in it.

Maintain three separate representations:

- `displayText`: cleaned base text shown to the learner; retains actual glyphs and punctuation.
- `analysisText`: initially identical to displayText. Any future tokenizer normalization must provide a reversible mapping.
- `fingerprintText`: versioned normalization for deduplication only; NFC, trimmed/collapsed whitespace, and removal of layout-generated breaks. Preserve authored word spaces and punctuation. Avoid NFKC or phonetic/spelling substitutions.

Tokenizer offsets must be converted and validated against JavaScript UTF-16 offsets. Every token's text must equal its source slice; tokens plus explicit whitespace/punctuation gaps must reconstruct the entire display text. Iterate kanji by code point/grapheme so supplementary characters do not become two broken halves. Preserve variation selectors in display; lookup may strip a selector while retaining the original glyph.

Use Unicode unified-ideograph detection rather than a basic-BMP-only character range. Treat 々 as a repetition mark with contextual lookup, not an independent kanji record. Do not automatically merge distinct visible kanji variants. Any aliases must be explicit data.

Recommended initial capture limits: 5,000 UTF-16 code units and 30 sentences per request, with an explanatory message when exceeded. A fragment over 500 code units should remain readable while asking the learner to select a smaller passage for grammar analysis. These are proposed UI bounds, to adjust from M0 measurements.

## 7. Encounter and familiarity model

### 7.1 Counting rule

An encounter is a character in an active study sentence, not evidence that the learner understood it. Display the label “Studied encounters” in the counter's help text.

Create at most one event per `(installationId, sessionId, sentenceKey, kanjiKey)`. `sentenceKey` hashes versioned fingerprintText independently of URL, so identical repeated text across page copies/tabs does not inflate a session. Store the source of the first recorded encounter; later distinct sessions may carry other sources.

| Action | Count change |
|---|---:|
| Load or scroll a page | 0 |
| Select text without opening study | 0 |
| Open a sentence containing a kanji | +1 for that kanji |
| Same kanji appears three times in that sentence | Still +1 |
| Click its mnemonic or translation link | 0 |
| Reopen/reanalyze/rerender that sentence in the same session | 0 |
| Open another sentence containing the kanji | +1 |
| Open identical text in another tab in the same session | 0 |
| Reload the source page and reopen the same sentence | 0 while the reading session remains active |
| Open it in a new reading session | +1 |
| Import the same event file twice | 0 additional events on the second import |

A session is global to this extension installation, across tabs. It starts on the first study action, ends explicitly via “End reading session”, or expires after 30 minutes without a study action. Use a persisted session ID and lastStudyAt within the browser run; service-worker sleep and panel closure do not end it. A new browser run starts a new session. A browser/extension restart may therefore count another deliberate reading; explain this policy and test it.

When tracking is paused, analysis and lookups continue without events. History opens in review mode and does not create encounters unless the learner chooses “Study again”. Undoing the last recorded sentence voids only events created by that action; re-rendering must not recreate them.

### 7.2 Familiarity and card status

Use separate fields:

- `familiarity`: `unassessed | unfamiliar | learning | familiar`, set by the learner.
- `cardAvailability`: derived from the active imported library: `standalone | compound-only | none`.
- `reviewSummary`: optional imported FSRS summary, timestamped and read-only.
- `wantCard`: independent boolean.

Store encounters for all kanji in studied sentences. The “Kanji I've seen” screen defaults to characters without a standalone card and characters explicitly marked unfamiliar; an All filter exposes everything. A missing card is never silently converted to an assertion about learner knowledge.

No reading action writes a review rating, changes due dates, or promotes a kanji to familiar. When a later card import adds a character, keep its history and familiarity while updating availability automatically.

### 7.3 Persistence and deletion

Use IndexedDB transactions and a unique natural event key so concurrent panels, message retries, and worker restarts cannot double-increment. Store an event and update its derived aggregate in one transaction. If acknowledgment is lost, retry the same logical key. The UI shows “saved” only after commit.

Counts, first/last timestamps, and distinct-source totals are rebuildable projections of non-voided events. Export stable event IDs. Include durable void records for undo/deletion so importing an older file cannot resurrect events already removed in the receiving store. A full library/history reset should be explicit and separate from reimporting cards.

Keep per-event metadata compact; store repeated sentence text once by sentenceKey. Retain source context needed for lookup/history, not complete page HTML. User removal of an event should update projections and garbage-collect unreferenced sentence content locally; retain only the minimal void identifier needed for later deduplication.

## 8. Nihongo integration and image export

### 8.1 Versioned reader package

Add a Nihongo “Export for Reader” action that produces one ZIP file containing a JSON manifest and image assets. Use a bundled ZIP library selected and pinned during implementation. Metadata-only export is allowed but must explicitly report missing pictures.

```text
nihongo-reader-library.zip
  manifest.json
  cards.json
  lessons.json
  assets/<sha256>.<extension>
```

The user chooses decks and sees card/image counts, export size, and image-resolution failures before download. Default to the decks they intend to study; a full curriculum can be exported in multiple named libraries if necessary. Asset names are content hashes and references are package-relative, so exports do not depend on the source site's continued availability.

Give each logical exported library a persistent `libraryId` and each snapshot a new `snapshotId`. Preserve stable card keys. A newer import of the same library atomically replaces its active card snapshot; it never replaces encounter history or changes familiarity. An older snapshot is identified by its revision and shown as an intentional rollback choice rather than silently applied. Multiple libraries remain namespaced.

### 8.2 Export from the app's context

Create a small integration entry point called by the existing app with explicit arguments, conceptually:

```text
createReaderSnapshot({ classes, heisig, lessons, reviewSummary, resolveImage })
```

The app passes its lexical `HEISIG`/SRS values and window-backed classes/lessons. Do not evaluate the entire app inside the extension, fetch executable data scripts as an interchange format, or assume an extension origin can read the app's IndexedDB. Extension and page storage belong to different origins; content-script web storage refers to its host page. [Chrome storage and cookies](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies)

Add a narrow read/export API inside the existing image-slot module, where the loaded sidecar state is accessible. It must resolve image bytes and framing without modifying slots. Wait for the store to load and report failed reads rather than exporting a false empty state.

### 8.3 Picture-resolution policy

For each card, construct a descriptor with its stable card key, canonical flashcard slot ID, image folder/key, authored source if any, and framing defaults. Use the actual card renderer as the reference. Do not take an arbitrary thumbnail from another lesson/grid simply because the kanji matches.

Resolve in this order:

1. An explicit Reader image preference for this card, if one exists.
2. The custom image stored for the canonical card slot.
3. The currently displayed shipped variant when the canonical card is mounted and its choice can be read reliably.
4. The shipped/default asset resolution used by that card, including applicable authored source fallback.
5. A missing-image record with a useful reason.

Export the resolved original bytes plus rendering metadata: fit, object position, zoom `s`, horizontal/vertical frame-percentage offsets `x/y`, and frame aspect ratio. Do not bake a crop into the only retained image. The source uses frame-relative offsets, so resizing must retain their meaning.

Selected variants are not reliably durable today. For v1, save explicit Reader picture preferences in the new integration store and expose an export preview/selector. This gives the reader a stable choice without requiring a migration of all existing image slots. Sharing that preference with every Nihongo card renderer can be a later, separately tested improvement.

Audit duplicated legacy slot IDs such as `flash-${card.id}` across classes. Preserve their existing effect when exporting; namespace the new reader's identities by library and class. Report conflicts in export diagnostics rather than inventing a source image or rewriting legacy IDs during this feature.

Keep personally imported mnemonic content in the learner's package. The distributable extension bundle should contain application code, the tokenizer/dictionary with its required notices, and generic fixtures. Do not include the repository's reference PDFs or automatically publish personal mnemonic assets.

### 8.4 Encounters back into Nihongo

Export a JSON history bundle containing source identities, sessions, sentences, events, voids, and familiarity/note snapshots. Nihongo imports it into a separate `nihongo-reader` IndexedDB database and presents a “Kanji I've seen” library page. Avoid altering the existing image database schema for this feature.

V1 has clear editing ownership: edit encounters/familiarity/notes in the extension; the Nihongo page is a history viewer with links into its cards and a visible import timestamp. This makes manual exchange predictable. Nihongo card edits become visible in the extension after a new library export/import.

Preserve foreign event IDs and source installation IDs on import. Familiarity snapshots carry a monotonically increasing revision per originating installation; reject stale overwrites. If histories from multiple installations disagree, show a conflict or retain per-source labels until the learner chooses. Do not design silent cross-device merges into v1.

### 8.5 Exact navigation

Proposed hash routes, not existing behavior:

```text
<app-url>#flashcards?class=<class-id>&card=<card-id-or-glyph>
<app-url>#writing?page=particles&mode=lessons&lesson=<lesson-id>
<app-url>#library?page=seen-kanji&kanji=<character>
```

Add a route parser that separates the section from query parameters, resolves IDs before rendering, and handles startup, hashchange, and browser back/forward. Same-section navigation must still apply new parameters. Opening a card selects its non-review browsing state without creating a rating. Resolve indexes after filtering `vocabOnly`; use a reference-view fallback for entries that are not flashcards. Missing/deleted IDs produce a useful fallback search, not the wrong card.

## 9. Data contracts

All schemas below are proposed. Make them runtime-validated and versioned before UI work expands. Use UTC ISO timestamps and JSON-safe values at message/export boundaries; use Blobs only within IndexedDB or local package processing.

| Record | Required fields and rules |
|---|---|
| `LibraryManifest` | `schemaVersion`, `libraryId`, `snapshotId`, monotonic `revision`, `exportedAt`, `sourceAppUrl`, selected deck IDs, cards/lessons paths, asset hashes/sizes/MIME types, exporter version. |
| `CardRecord` | `cardKey` preserving the existing class/card scheme, `classId`, `cardIdOrGlyph`, authored order, kind (`kanji`, `word`, `radical`, `reference`), glyph, readings, keyword, optional mnemonic story/examples, optional image reference, optional timestamped review summary. |
| `CardIndex` | `(libraryId, kanjiKey) -> CardRef[]` for standalone matches; a separate word-surface/lemma index and component-character index. Never collapse everything into one card per character. |
| `ImageRecord` | `assetHash`, MIME, byte size, dimensions, package path, source kind, original slot/image key, optional variant identity, and framing metadata. |
| `SentenceRecord` | `sentenceKey`, normalization version, display/fingerprint text, capture kind, optional ruby spans. Parser output is optional cached data, not identity. |
| `Token` | `tokenId`, `startUtf16`, `endUtf16`, surface, lemma or null, normalized/raw POS, reading plus provenance, supported form features, lexical status. |
| `Group` | `groupId`, token/group children, span, type, optional head token, status. Children must remain within the parent's span. |
| `Relation` | source/target group IDs, relation type, `supported/uncertain`, rule ID, evidence spans, optional alternatives. Supported relations must not create cycles. |
| `AnalysisResult` | sentenceKey, tokenizer/dictionary/rules versions, tokens, groups, relations, warnings. Exact text reconstruction is mandatory. |
| `SessionRecord` | installation/session IDs, browser-run ID, startedAt, lastStudyAt, optional endedAt. |
| `EncounterEvent` | stable event ID, installation/session/sentence/kanji keys, occurredAt, action ID, source reference, observed glyph, optional containing word. Unique natural key is mandatory. |
| `SourceRef` | source URL/title/domain, capture timestamp; optional text quote with prefix/suffix and frame metadata. Live DOM pointers stay ephemeral. |
| `EventVoid` | event ID, voidedAt, originating installation, reason. Void wins over an older event copy. |
| `KanjiState` | kanji key, familiarity, wantCard, optional note/preferred CardRef, revision, updatedAt. |
| `KanjiAggregate` | encounter count, first/last timestamp, source count; derived from active events and rebuildable. |

Use `CardRef = { libraryId, cardKey }`. The inspected Basic deck has class ID `basic` and the water card has ID `water`, giving `cardKey: 'basic/water'`. Generate these identities from source data rather than maintaining a parallel handwritten list.

Event IDs should hash a canonical, version-tagged JSON array of the natural-key fields, or use an equivalent collision-resistant stable construction. Do not concatenate unescaped user strings with ambiguous separators. Preserve the event ID in every subsequent export. Retain the normalization version with saved sentences; parser upgrades never re-key old events or retroactively recount them.

A source URL retains query parameters needed to reopen content. Strip obvious tracking parameters using a small explicit list; allow “store domain only” as a privacy preference, with the resulting loss of exact navigation made clear. URLs never determine sentence identity.

### Import integrity

Preflight schema version, ID uniqueness, type/length bounds, asset hashes, MIME/dimensions, references, and total expanded size. Reject absolute/traversal ZIP paths and unexpected executable content. Text fields render as text; imported HTML is not executed.

Stage snapshots under their snapshot ID. Decode/validate assets outside a long-running IndexedDB transaction; write bounded batches; switch the active snapshot pointer only after validation succeeds. Cancellation or failure leaves the old library active. Clean abandoned staging records later. Report quota/storage failures visibly.

Initial configurable import bounds: 128 MiB expanded per package, 8 MiB per image, and 10,000 card records. Measure actual exports in M0 and revise these bounds deliberately; larger libraries can use deck selection/splitting. Protect against excessive decoded pixel dimensions as well as compressed byte sizes.

## 10. Extension runtime, messaging, and permissions

### 10.1 Responsibilities

```text
Authorized page capture script
  -> capture payload (text, ruby, source; no cards/images)
Extension service worker
  -> activation, capture routing, session identity, encounter commits
Side-panel application
  -> study queue, details, history, import/export
Dedicated analysis worker
  -> tokenizer and conservative grammar rules
Extension IndexedDB
  -> libraries, assets, sessions, events, voids, states, projections
```

Use plain JavaScript ES modules with JSDoc contracts and esbuild, matching the repository's existing tooling. UI components should have explicit state/render boundaries; importing the current large app renderer into the extension would create unnecessary coupling.

Keep service-worker listeners registered at top level. Handle messages as small independent operations backed by storage. Chrome can terminate an idle extension service worker; loss of in-memory state must not lose an encounter or library. Reconstruct state on wake rather than using keepalive loops. [Service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

### 10.2 Minimal manifest direction

Planning fragment; add names, paths, icons, and version during implementation:

```json
{
  "manifest_version": 3,
  "minimum_chrome_version": "116",
  "permissions": ["activeTab", "scripting", "sidePanel", "storage"],
  "action": { "default_title": "Study with Nihongo" },
  "background": { "service_worker": "background.js", "type": "module" },
  "side_panel": { "default_path": "sidepanel.html" }
}
```

Add `contextMenus` only when its action is implemented. Start without broad host permissions, `tabs`, `downloads`, or `unlimitedStorage`. User-invoked `activeTab` plus `scripting` supports temporary access to the current site; cross-origin navigation requires another qualifying activation. Panel visibility by itself is not a new page-access grant. [activeTab documentation](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)

Opening lookup tabs does not require the `tabs` permission. File export can use an extension-page Blob download. Add permissions only for a concrete tested need. [Tabs API permissions](https://developer.chrome.com/docs/extensions/reference/api/tabs)

Package scripts and tokenizer assets. No remote scripts, inline event handlers, `eval`, or remote module imports. Keep analysis resources inside extension-owned pages/workers so personal images and dictionaries do not need web-accessible-resource exposure. Validate the actual production bundle under MV3 CSP. If a future engine uses WASM, evaluate its CSP requirements as an explicit change. [Chrome CSP](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)

### 10.3 Storage ownership

Use `chrome.storage.local` for small preferences and installation identity, `chrome.storage.session` for browser-run routing state, and IndexedDB for durable content/events. Restrict Chrome storage access to trusted extension contexts when possible. Do not put mnemonic images/history in `chrome.storage.sync`; treat storage capacity and failure as observable states. [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)

The service worker serializes session assignment and persists the durable session record. Panel/import code uses shared repository functions and transactions. The parser worker owns no durable learner state. Old analysis responses are discarded using request IDs and the current sentence key.

### 10.4 Message flow

Use an envelope with `protocolVersion`, `requestId`, `type`, and a validated payload. Proposed types: `CAPTURE_REQUEST`, `CAPTURE_READY`, `STUDY_SENTENCE`, `STUDY_COMMITTED`, `GET_KANJI`, `VOID_ACTION`, and `SESSION_END`.

The service worker keeps the capture until the panel announces readiness; action-before-panel and panel-before-capture must both work. After the active sentence renders, the panel sends one idempotent study request. A failed parse still allows the raw sentence study view to count. Switching away before the requested sentence is displayed creates no encounter. Retried requests use the same action ID.

Validate sender extension/tab/document identity; ordinary capture scripts cannot issue history exports or write arbitrary kanji state. Render captured text with text APIs. Chrome runtime messages use JSON serialization, so do not send DOM nodes, Maps, or Blobs through them. Image import operates within the panel's extension origin. [Chrome messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)

## 11. External lookup behavior

The provider receives only the scope the learner selected: word by default, character on request, sentence only through an explicit sentence-translation action. Local word meanings come from imported Nihongo content; otherwise show external lookup instead of implying an offline dictionary exists.

| Action | Query and destination strategy |
|---|---|
| Search web | Whole word plus a meaning-oriented term; allow switching to the character. Construct a Google Search URL using `URL`/`URLSearchParams`. |
| Google Translate | Japanese source, English or Portuguese target, selected scope as `text`. Proposed template: `https://translate.google.com/?sl=ja&tl=en&text=...&op=translate`. |
| Wikipedia | Open a search query on Japanese Wikipedia; useful for names, places, objects, and concepts. Do not promise a dictionary definition or a matching English article. |
| Open in Nihongo | Use the configured app base URL and the exact route contract above. |

These are browser navigation actions, not scraped APIs. Smoke-test provider links with Japanese text, spaces, ampersands, fragments, and supplementary kanji before release. Open only constructed HTTPS provider URLs; escape text through URL APIs. If a provider fails or changes, the user can still copy the selected text.

No external request occurs on selection, hovering, parsing, or ordinary mnemonic display. The first release works offline for captured/pasted text, imported cards/images, and encounter recording; external lookups require a connection. Google Translate remains an optional escape hatch, not the default sentence view. [Google Translate](https://translate.google.com/)

## 12. Proposed source organization

The following tree is a proposed addition under the existing repository; these modules do not exist yet. Keep this feature isolated and avoid a broad refactor of the Nihongo monolith.

```text
nihongo/
  reader-core/
    contracts.js             # Runtime validation and JSDoc types
    text.js                  # Normalization, sentence IDs, Unicode helpers
    grammar/                 # Token adapter, groups, relations, explanations
    library.js               # Card/image indexes and snapshot validation
    encounters.js            # Event IDs, projections, merge/void rules
    routes.js                # Parse/build reader deep links
  reader-integration/
    export-library.js        # Snapshot builder receiving app context
    import-history.js        # Site-side history mirror
    seen-kanji-view.js       # Nihongo's imported history view
    image-preferences.js     # Explicit Reader picture preferences
  reader-extension/
    manifest.json
    src/background.js
    src/capture.js
    src/analysis-worker.js
    src/sidepanel.js
    src/repository.js
    src/providers.js
    sidepanel.html
    sidepanel.css
    fixtures/
    tests/
    vendor-notices/
    dist/                    # Generated unpacked extension; normally ignored
  scripts/build-reader.mjs
```

Bundle app integration separately and pass data from the existing classic scripts. Extract only the small palette/explanation constants actually shared. Add a stable image-export API inside image-slot.js and explicit routing hooks in app.js. Keep analysis code independent of the DOM so fixtures can validate it without Chrome.

Planned commands: `build:reader`, `test:reader`, and `test:reader:e2e`. Define them only during implementation, with a committed lockfile policy for any new dependencies. Reuse esbuild/Playwright where practical; do not introduce a development server, backend, or UI framework solely to support this feature.

## 13. Verification and acceptance criteria

### 13.1 M0 corpus and honest accuracy reporting

Prepare approximately 30 manually annotated cases: 15 simple authored grammar cases, 10 short passages/headings selected from the target site, and 5 adversarial cases. Keep site excerpts minimal and source-attributed; include synthetic DOM fixtures for ruby, responsive breaks, and nested spans. Have a competent Japanese reader review the expected relationships before treating them as correctness evidence.

Report token boundary/POS accuracy separately from supported-relation precision and relation coverage. A parser that marks every relation uncertain has high apparent caution but no useful phrase guidance. Initial release gate: at least 95% token/POS correctness on manually labeled in-scope units, at least 95% correctness among relations displayed as supported, and at least 80% supported relation coverage on the simple authored subset. Publish raw numerators/denominators; these small-set targets are acceptance proposals, not claims about general Japanese accuracy. Correct every identified misleading supported claim before release.

Define gold token units by source spans and accepted POS labels, allowing explicitly documented alternative segmentations. Count both missing gold units and spurious predictions; report precision and recall rather than a token “accuracy” that ignores extra tokens. For relations, precision is correct supported predictions divided by all supported predictions; coverage is gold relations correctly shown as supported divided by gold relations in the chosen subset. Require both token precision and recall to meet the 95% gate. No-prediction results have zero coverage, not a passing score.

Target-site literary cases may pass via readable text, valid kanji lookup, and visibly partial analysis. They must not be excluded from the report to inflate accuracy. Include a held-out subset of ordinary sentences to catch rules hardcoded to the demonstration page.

### 13.2 Required fixture groups

| Area | Cases that must pass |
|---|---|
| Extraction | Selection across inline spans; partial nodes; responsive breaks; Japanese quotes; ruby base/readings; image alt; punctuation-free heading; hidden duplicate content. |
| Unicode | Supplementary kanji such as 𠮷; variation selectors; repeated characters; 々; mixed Latin/Japanese; exact token reconstruction. |
| Grammar | Original fixtures such as 私は本を読みます。, 赤い花が咲く。, 静かな町です。, 昨日買った本を読む。, 学校で勉強しています。; also ambiguous particles, names, and unsupported literary forms. |
| Cards | Duplicate kanji across classes; exact compound vs component matches; `vocabOnly`; absent IDs using glyph fallback; card removal/readdition; selected deck preference. |
| Images | Custom upload; default shipped file; chosen variant; framing-only sidecar; missing file; duplicate legacy slot ID; offline imported rendering. |
| Encounters | Every row of the counting table; concurrent tabs; acknowledgment loss; worker restart; browser restart; tracking pause; review-history mode; undo; repeated imports. |
| Imports | Corrupt archive; unsupported schema; bad hash; missing asset; oversized expansion; cancellation; quota failure; older snapshot; void propagation. |
| Routing | Cold-start deep link; same-section card change; back/forward; filtered index; deleted card; coming-soon lesson; non-review opening. |
| Integration | Card export/import and history return preserve IDs, pictures, counts, and familiarity without changing SRS records. |

Use unit tests for identity, extraction transformations, parser relations, route parsing, and merge behavior. Use browser tests for actual extension permissions, capture, persistence, and imports. Playwright requires a persistent Chromium context for extension tests; use its bundled Chromium and test the panel application directly where browser chrome is not exposed. Manually verify real toolbar/shortcut/side-panel interaction in Chrome as a separate acceptance step. [Playwright extension testing](https://playwright.dev/docs/chrome-extensions)

### 13.3 Performance and privacy checks

Proposed local targets, to be measured rather than claimed: usable empty panel within 500 ms; cold tokenizer readiness within 3 seconds; warm analysis of a 200-character sentence within 300 ms; cached kanji detail within 100 ms. Record hardware, Chrome version, cold/warm distinction, and a p95 over repeated samples. Keep the page responsive and show loading state if targets are missed.

Verify that repeated panel openings do not accumulate workers, listeners, or decoded image buffers. Revoke object URLs after use and bound caches. Inspect network activity: after installation/import, ordinary capture, parsing, card viewing, and tracking must not send page text to a remote service. Test storage failure instead of swallowing it.

For existing app changes, run its current validation and interaction commands and the characterization workflow documented in [tests/README.md](<C:/Users/khevi/Claude Projects/khevin-mituti-portfolio/nihongo/tests/README.md>). Review intentional changes to golden output before updating a baseline. Do not rewrite unrelated fixtures to get a green result.

## 14. Milestones and implementation order

| Milestone | Work | Exit condition |
|---|---|---|
| **M0: Feasibility and contracts** | Check current project instructions and status; verify the actual Nihongo origin; build the annotated corpus; inspect live Nintendo selection/ruby behavior; prove packaged tokenizer + worker compatibility; resolve several real card images; fix schema v1. | A short evidence report gives actual parser quality/performance, image export behavior, package size, and any revised decisions. No polished UI dependency. |
| **M1: One complete reading loop** | Create minimal extension shell, selection capture, one-sentence view, word tags plus a small supported grouping set, imported sample cards/images, and idempotent encounter storage. | A real sentence can be studied, a matching personal mnemonic opened, an unfamiliar kanji recorded, and the result retained after restart. |
| **M2: Full v1 behavior** | Add paragraph queues, library export/import, all in-scope rule families, uncertainty display, history filters, image selection preview, lookup actions, and keyboard behavior. | Corpus gates pass; duplicate tabs, retries, imports, and undo produce correct counts; imported pictures work offline. |
| **M3: Nihongo round trip** | Add exact routes, history import/view, atomic library refresh, and regression protection around images/navigation/SRS. | Repeated round trips preserve events and pictures; new cards attach to existing history; SRS state is unchanged. |
| **M4: Release candidate** | Validate live Nintendo and at least one ordinary text-heavy Japanese page; run browser/storage/error checks; document unpacked installation, backup, and known grammar limits. | All v1 acceptance criteria pass and the learner completes the end-to-end reading scenario. |

M0 should settle risks before estimates are expanded. Tokenization/grammar and image export are the highest-uncertainty work; they are not merely finishing details. Deliver each milestone as a reviewable increment with its tests and known limits. No time estimate here assumes unmeasured parser accuracy.

### End-to-end release scenario

1. Export a selected Nihongo deck with at least one custom mnemonic and one shipped variant; import it into the extension.
2. Study several target-page sentences, revealing grammar and pictures without automatically translating them.
3. Open a kanji without a standalone card, record it, and launch a whole-word lookup.
4. Encounter it in a different sentence; observe the correct increment. Reopen the same sentence; observe no increment.
5. Restart the service worker and reload the source page; verify durable history and session policy.
6. Export history to Nihongo twice; counts do not change on the second import.
7. Open the exact linked card and particle lesson; verify the correct destination and no review rating.
8. Add a matching card in Nihongo, refresh the library package, and verify that the old encounter history now links to it.

## 15. Later improvements and decision triggers

### Direct app connection

After manual exchange works, allow only the configured Nihongo site to initiate a connection using `externally_connectable`. Validate sender origin and expected app path in code. The app initiates requests with the installed extension ID and receives responses; do not assume an extension can initiate an arbitrary message to a normal webpage. Reuse the package/history schema and explicit connection control. [Chrome external messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)

Use small versioned metadata messages and bounded, acknowledged asset chunks or a measured alternative transport. Chrome JSON message serialization means a Blob is not a transferable image payload in this channel. File exchange stays available for localhost, connection failures, and backup. Do not expose this bridge on arbitrary Japanese websites.

### Better grammar

Consider a dependency parser when measured grouping coverage is too low for useful reading despite good tokenization. Compare its accuracy, dictionary coverage, load size, and local deployment requirements against the baseline corpus. If optional AI explanations are later requested, scope them to a selected sentence, keep them distinguishable from local analysis, cache by text/model/prompt version, and handle authentication/cost separately. There is no AI or cloud requirement in v1.

### More automatic reading

Add on-page highlights only after source-offset mapping is reliable. Prefer temporary, reversible highlighting over wrapping/replacing all text nodes. Broader visible-text tracking must introduce a different metric such as “visible occurrences”; it must not silently change the established studied-encounter count. OCR follows only if image text without useful alt is a demonstrated frequent blocker.

## 16. Next-session handoff prompt

> Implement the Nihongo Reader Chrome extension using this document as the proposed specification. Begin with M0 and report measured findings before broadening the build. Preserve the existing Nihongo app and its review state. Use particle-tagged word/phrase blocks, local analysis with explicit uncertainty, personal mnemonic imports, and idempotent studied-encounter events. Build the first complete reading loop before polishing the UI. Keep file exchange as the first integration method, add exact card/lesson routes, and validate against the Nintendo page plus generic fixtures. Treat all new module names, schemas, performance targets, and routes here as proposed work, not existing functionality. Recheck source details that may have changed. Do not deploy or publish without a subsequent request.

The planning session produced this handoff only. Outstanding feasibility questions are explicit in M0: actual selected image state, canonical app origin, tokenizer compatibility/performance, grammar coverage, and final rendered-page selection behavior.
