# Nihongo Reader — code review and improvements

Reviewed and changed on 9 September 2026. This report describes the implementation in the working tree, including the newer UX added after the original handoff plan.

## Outcome

The existing design is a useful foundation: Japanese stays on the page; a compact bottom bar carries the sentence blocks; the side panel carries word details, kanji, personal mnemonic pictures and optional lookups. The most valuable improvements in this pass were correctness and recovery during normal reading, especially when selections change faster than asynchronous work finishes.

The floating bar, side panel, building-block vocabulary, reading mode that follows completed selections, Words/Phrases views, furigana, romaji, speech, translations and picture gallery remain. No learning-content, SRS, grammar-rule or database-schema migration was introduced.

The extension has been rebuilt in `nihongo/reader-extension/dist/`. Changes are local and uncommitted.

## How the implementation fits together

| Area | Responsibility | Assessment |
|---|---|---|
| `nihongo/reader-core/` | Sentence normalization, UTF-16 spans, tokenizer adapter, grammar groups/relations, card matching, encounter identities and package validation | Good separation from browser UI. Keep this layer deterministic. |
| `reader-extension/src/content.js` | Selection capture, selection button, bottom bar, sentence queue and detail requests | Preserves page layout with a fixed UI inside a closed shadow root. Async ownership needed tightening. |
| `src/background.js` | Message routing, capture state per tab, opening the panel and study commits | Correct place to coordinate extension actions; persistent state cannot depend on its lifetime. |
| `src/offscreen.js` and `src/analysis-worker.js` | One shared tokenizer worker and locally packaged dictionary | Avoids a separate large dictionary for the bar and panel. Recovery and memory release are now explicit. |
| `src/sidepanel.js` and `src/panel/` | Paste workflow, blocks, word/kanji details, pictures, speech and translation | Features are coherent. The main panel file is large; extract controllers incrementally when changing those features, rather than rewriting it now. |
| `src/study-commit.js` and `src/repository.js` | Session policy, deterministic encounter events, IndexedDB transactions, familiarity and library assets | Event-based counting and separate familiarity/card availability are sound. Concurrent first use exposed an identity race. |
| `scripts/build-sample-library.mjs` and `src/library-sync.js` | Build a library from repository decks/images; import bundled assets and newer site snapshots | Hash verification and atomic library replacement are valuable. Manual refresh had bypassed replacement policy. |
| Existing Nihongo application | Lessons, dictionary, flashcards, images and SRS | Kept its current behavior; existing characterization and interaction checks pass. |

Typical flow: selection → extracted sentences → bottom bar → background → offscreen tokenizer → blocks. Opening a block also sets panel focus. Study commits go through one session/identity coordinator into IndexedDB. Optional online lookups are separate from local parsing and mnemonic-card retrieval.

## Fixes made

### Reliable encounter counts on first use

Concurrent initial study requests could each create an installation ID, browser-run ID or session before the other write completed. Their event IDs then differed, defeating the repository's otherwise correct deduplication.

Identity assignment, session resolution, study commits and explicit session ending now share a Web Lock. A promise queue provides a fallback where that API is unavailable. A new browser regression starts multiple studies with empty identity storage and verifies one installation, run and session, with each kanji counted once. It failed before the fix and passes now.

The counting policy is unchanged: each distinct kanji counts once per studied sentence per reading session. Repeated glyphs in that sentence and reopening the same sentence in that session add nothing. Familiarity and possession of a flashcard remain separate from this counter.

### Selection and navigation cannot be overwritten by old work

The bar now associates analysis and save responses with their originating capture and sentence. Closing it invalidates pending analysis. The panel uses request generations and captured context for analysis, kanji reads and image reads. An old parse failure cannot replace the current sentence or count old text under its capture.

Familiarity and “Want a flashcard” writes retain the kanji that was selected when the action began. Translation results also retain their request identity, target language and provider choice; retired results cannot reappear over a newer selection. Replaced galleries release their object URLs.

Delayed-response browser tests reproduced the stale-result failures before these fixes. They now exercise success and failure arriving in the wrong order.

### Failed saves remain retryable

The bar only marks a sentence saved after a successful acknowledgement. In-flight writes are deduplicated; failures retain a visible **Retry save** action. Retry uses the same action identity, so a lost acknowledgement cannot cause a second count. The regression clicks the actual retry button and checks the successful save.

Successful reading stays quiet: no persistent save chatter was added to the bar.

### Settings and typing behave consistently

The popup and panel now use the canonical `prefs` object, with older panel keys accepted as a boot fallback. The open panel reacts to changes from the popup. The bar persists Words/Phrases, and both reader surfaces react to relevant preference changes. Popup saves merge against the latest stored values instead of a stale boot snapshot.

Repeated enable/disable cycles no longer register another copy of the content script's document listeners within that script instance.

A panel repaint during background library/settings work now preserves focus, selection direction, cursor position and scroll within the paste box. The regression reproduced focus loss and a cursor reset before the fix.

### Tokenizer cleanup and recovery

The ten-minute idle timer moved from the disposable service worker to the offscreen document that owns the tokenizer. Cleanup only arms when no requests remain. It terminates the large worker while retaining the lightweight offscreen document for reuse.

Worker crashes, explicit release and a 30-second request deadline settle pending callers and permit a fresh worker on the next request. A rejected dictionary-building promise is cleared so a subsequent attempt can succeed. Four deterministic lifecycle tests cover idle release, active requests, timeout/crash recovery and explicit release.

This follows Chrome's documented lifecycle: service-worker globals and timers are not durable. See [service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [offscreen documents](https://developer.chrome.com/docs/extensions/reference/api/offscreen), and [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).

### Library refresh and online requests

“Check for updates” now obeys the same replacement policy as automatic sync. It cannot silently downgrade a newer library or replace an unrelated imported library. Two additional browser checks cover these cases; existing hash-tampering and atomic-replacement tests still pass.

Translation, image-search and thumbnail requests have 15-second abort deadlines. Library requests have 20-second deadlines per fetch. The signal also applies while reading the response body. Failures continue to use the existing error UI and external lookup links. Translation failures are not cached, and tests verify a subsequent request can succeed. No external provider credentials were used for validation.

## Validation

| Check | Result |
|---|---|
| Reader core and unit tests | 65/65 pass |
| DOM extraction | 10/10 pass |
| IndexedDB/session/counting checks | 14/14 pass |
| Library sync | 7/7 pass |
| Tokenizer and served-page CSP checks | 9/9 pass |
| Side-panel browser flow | 28/28 pass |
| Floating-bar browser flow | 19/19 pass |
| Delayed-response, save-retry, preferences and paste-focus checks | 9/9 pass |
| Existing Nihongo app interactions | 65/65 pass |
| Existing app characterization | 18 states identical to the golden baseline; no captured console errors |
| Final extension build | Pass; about 20.55 MB unpacked, including dictionary and library |

The app data validator also passed, with its pre-existing texture-tag and seven dictionary/card-gloss warnings. Content was not silently rewritten to clear those warnings.

The latest tokenizer benchmark measured a 432 ms cold-start p95 and 2.4 ms warm 200-character tokenization p95 in the served browser harness. The dictionary inflates to about 95.6 MiB; this is dictionary-byte size, not a measurement of total Chrome memory. Timing results are local observations, not universal performance guarantees.

**Validation boundary:** full Chromium failed to launch with `spawn UNKNOWN`; system Chrome did not load the unpacked extension through the automation flag. The existing suite therefore used its explicit served-dist fallback with MV3 CSP. Browser UI, tokenizer and persistence checks passed, and offscreen lifecycle logic was tested with a controlled worker/clock. The actual Chrome service-worker → offscreen-document message chain, extension installation and gesture-bound panel opening remain unverified in this automated run.

Reproduce from `nihongo/`:

```text
npm run build:reader
npm run test:reader
npm run test:reader:e2e
npm run verify
npm run test:interactions
```

On this workstation the npm command shim was broken; the equivalent used was `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run <script>`. Browser tooling required execution outside the restricted sandbox. No project dependency versions were changed.

## Remaining work, in recommended order

These are follow-up findings, not completed features or regressions introduced by this review.

1. **Confirm the real extension runtime.** Reload the extension and refresh existing Japanese-page tabs. Exercise a selection, a block-to-panel click, rapid sentence changes and disable/enable. After ten idle minutes, study another sentence and confirm analysis recovers. This is the highest-priority validation gap.
2. **Finish the “kanji I've seen” workflow.** The event store, counts, familiarity and want-card state exist, but there is no complete browsing/export/import bridge back to Nihongo. Add a searchable list with sort by encounters/last seen, explicit familiarity filters and event export before attempting automatic two-way synchronization. Keep event IDs and voided-event semantics intact.
3. **Link to the exact personal card and image.** “Open in Nihongo” currently opens the flashcards section, not the matched card. The generated library reads repository decks and image files; it does not export browser-local custom image overrides or framing. Add a versioned app export and stable card deep-link contract before claiming all personal flashcard imagery stays synchronized.
4. **Correct distinct-source statistics beyond 25 sources.** Incremental aggregates derive `sourceCount` from a list capped at 25; rebuilding after undo counts the full event history. Encounter totals are separate, but the displayed source statistic can disagree. Separate the complete distinct-source identity set from the bounded list of source details, with a migration/rebuild test.
5. **Bound unusually large input and imports.** ZIP expansion currently happens synchronously before package preflight. Very large pasted selections also lack an explicit UI workload limit. Add bounded decompression off the panel thread and character/sentence limits with actionable errors. Preserve UTF-16 and ruby-offset invariants.
6. **Make parser-failure behavior consistent across surfaces.** The panel still counts a studied sentence when parsing fails; the bar currently saves only after successful analysis. Agree on one policy, show a parse-retry control and cover both surfaces before changing counting semantics.
7. **Expand linguistic evaluation before extending grammar rules.** The current checked corpus scores 49/49 supported relations, but that is a small authored fixture set. Add independently reviewed examples covering quotations, omitted arguments, auxiliary chains and ambiguous particles. Do not treat the fixture score as general Japanese accuracy.
8. **Harden simultaneous cross-surface operations as usage grows.** Preference merges still use read/modify/write, so exactly concurrent edits from separate surfaces can conflict. Library imports also deserve a concurrent-refresh test. Full content-script reinjection on extension update is separate from the enable/disable listener fix; test that in actual Chrome before adding lifecycle machinery.

The next implementation pass should prioritize the visible seen-kanji list and exact-card link after the runtime check. Those complete the learning loop while preserving the bar/panel division that already works.

## Reload checklist

1. Open Chrome's extension-management page and reload Nihongo Reader, or load `nihongo/reader-extension/dist/` unpacked if it is not installed. Refresh existing reading tabs so they receive the rebuilt content script.
2. On the Nintendo Japanese page, select a sentence and click the selection button. Confirm the bar stays at the bottom, the page layout remains intact, and Words/Phrases, furigana and romaji behave as expected.
3. Tap a word, inspect a known kanji and its mnemonic, then inspect an unknown kanji. Confirm familiarity and “Want a flashcard” survive closing/reopening the panel.
4. Change selections quickly, close the bar during loading, and reopen it. Old text should not return. Reopen the same sentence in the same session and verify its encounter count does not increase.
5. Change preferences in the popup while the panel is open. Paste text and leave the cursor in the middle while background work finishes; typing should continue in place.

This checklist has not been marked complete by the automated fallback.
