# Nihongo characterization harness (Phase 0 safety net)

The app has characterization and interaction tests. This harness checks that
a refactor preserves the captured content and structure; interaction tests
cover navigation, keyboard handling, audio cleanup and review scheduling.

## What's here

| File | Purpose |
|---|---|
| `characterize.js` | Installs `window.__capture()`, which fingerprints every section/sub-page (content + structure, with cosmetic randomness frozen) and returns a JSON snapshot. Runs in any browser console **and** is injected by `capture.mjs`. |
| `capture.mjs` | Headless capture (Playwright). Self-contained: starts a static server, launches Chromium, injects `characterize.js`, writes the snapshot JSON, and reports console errors. |
| `compare.mjs` | Plain-Node diff of two snapshots. Exit 0 = identical, 1 = differences (printed). |
| `golden-baseline.json` | The reference snapshot captured against `main` (headless). Regenerate only when behavior is *intentionally* changed. |
| `SMOKE-CHECKLIST.md` | Manual interaction checklist (clicks/audio/keyboard/persistence) + the known-bug regression guards. |

## One-command workflow (preferred)

```bash
# from nihongo/
npm run verify        # captures current app headlessly → diffs against golden-baseline.json
```

`npm run verify` exits 0 when behavior is preserved, 1 (with a printed diff) when
something changed. To re-bless the baseline after an *intentional* change:

```bash
npm run characterize  # overwrites golden-baseline.json with a fresh headless capture
```

Determinism is verified: two consecutive headless captures of the same code are
identical, so any diff is a real signal.

## Why a "fingerprint" and not an innerHTML hash

Every render injects cosmetic randomness (brush rotation/delay, a cycling
section background, a random restaurant pick). Hashing raw `innerHTML` would
diff on every run. Instead each surface is reduced to: normalized `textContent`,
element-type counts, the inventory of `data-*` attribute names, a count of
interactive controls, and the list of content image `src`s (brush decorations
stripped). Behavior-preserving refactors leave all of these identical; real
regressions (missing words, a dropped button, changed structure) surface as a
diff. Determinism is verified: two consecutive captures of the same code are
byte-identical.

## Manual console capture (fallback, no Node)

If you can't run Node/Playwright, capture from a real browser instead:

1. Serve from the repo root (already configured): `py -m http.server 8766`
2. Open `http://localhost:8766/nihongo/app.html`
3. In the DevTools console:
   ```js
   const s = await fetch('/nihongo/tests/characterize.js').then(r => r.text());
   (0, eval)(s);
   copy(JSON.stringify(window.__capture(), null, 2));   // now on your clipboard
   ```
4. Paste into `tests/golden-after.json`, then run `node tests/compare.mjs ...`.

Note: capture from a **fresh** browser profile (cleared `jp:*` localStorage).
The headless `capture.mjs` does this automatically; a browser where you've
navigated around will have populated inactive sidebars and won't match.

`__capture()` snapshots and restores the live `APP` state, so running it never
corrupts your saved progress.

## The bar each refactor phase must clear

`npm run verify` green **and** a clean pass through `SMOKE-CHECKLIST.md`.

## Implementation note

`characterize.js` references the app's `APP` state by its bare global binding,
not `window.APP` — `APP` is a top-level `const`, which lives in the global
lexical scope and is *not* a property of `window` (only `var`/function
declarations attach to `window`).

## Flashcard study interaction

`npm run test:study` exercises the actual app and vendored FSRS scheduler in a
fresh browser profile. It covers recall/reveal/rating, finite rounds, scheduling,
undo, save failures, pause/resume, existing history, automatic due updates,
keyboard cleanup, phone/tablet layouts, and enlarged text. It does not access
personal study progress.

Set `BROWSER_CHANNEL=msedge` (or another installed Playwright channel) to use a
system browser. Set `STUDY_SCREENSHOTS=1` to save visual checks to a temporary
directory printed by the test. The general interaction suite also supports
`BROWSER_CHANNEL`.

The September 11, 2026 baseline update adds only the intentional **Study cards**
button to the card/list browse snapshots. All other captured content is preserved.

## Nihongo Reader extension tests (reader-extension/)

The extension has its own harness, run from `nihongo/`:

```bash
npm run test:reader        # node:test units (incl. image text-filter heuristic, provider parsers, Cloud TTS request + offscreen playback) + DOM extraction + IndexedDB repository + automatic library sync (headless shell)
npm run build:reader       # esbuild -> reader-extension/dist/ (git-ignored)
npm run build:library         # data.js + images/ -> reader-library/ (committed, served by the site) + fixtures/sample-library.zip
npm run test:reader:e2e    # tokenizer + CSP, panel + bar flows, and delayed-response/paste-focus regressions
```

`tests/bar.e2e.mjs` exercises the content script outside an extension: it serves
`dist/` plus `fixtures/dom/nintendo-like.html`, installs a `chrome.*` stub whose
`runtime.sendMessage` answers with an in-page copy of the analysis worker, then
selects text, checks the FAB position, clicks it and asserts the bar. The
shadow root is closed, so the test reaches in through `window.__nihongoReaderBar`.
The real service-worker → offscreen-document chain is a manual owner check.

`tests/async-ui.e2e.mjs` controls reply ordering and save failures to exercise
selection replacement, closing during analysis, stale kanji lookups, save
retries, shared settings and paste-box focus. These use a Chrome API stub;
they do not replace the real-extension check. `tests/unit/offscreen.test.mjs`
tests the offscreen host's idle release, request timeout and worker recovery
with a controlled clock. The repository tests include concurrent first use
before installation and session identities exist.

`test:reader:e2e` is the one place this repo departs from `chromium.launch()`:
an MV3 extension can only run in a persistent context
(`chromium.launchPersistentContext(dir, { args: [--load-extension=...] })`)
and the headless shell cannot load extensions at all. The script first tries
Playwright full Chromium and system Chrome; Google Chrome 137+ ignores
`--load-extension`, and on this workstation Chrome for Testing fails to start
with a Windows side-by-side error, so the script falls back to serving `dist/`
over 127.0.0.1 with the MV3 CSP header in the headless shell. The fallback
proves the worker, gzip inflate, tokenizer, offsets and CSP compliance, and
prints "NOT VERIFIED" for the chrome-extension:// load, which is then a manual
step: chrome://extensions -> Load unpacked -> reader-extension/dist.
