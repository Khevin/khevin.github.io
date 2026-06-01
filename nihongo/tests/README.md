# Nihongo characterization harness (Phase 0 safety net)

The app has no automated tests. This harness lets us **prove** that a refactor
did not change what the user sees, before/after any structural change.

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
