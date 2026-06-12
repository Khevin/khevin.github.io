# Nihongo — Code & Architecture Review (2nd pass) · 2026-06-11

> Scope: the post-refactor codebase (after the 16-commit hardening session: decomposition into
> `app.html`/`app.css`/`app.js`, characterization harness, 6 bug fixes, memoized indexes, dedup,
> targeted updates). Produced by a 12-agent parallel review (architecture, performance,
> correctness, CSS, data+tests, a11y, plus DSP/mic extraction and research agents), followed by
> adversarial verification. **Verification caveat:** the verification fleet hit the session usage
> limit partway through; items marked ✓ were verified (by a verifier or by direct re-reading of
> the cited code), items marked ● carry reviewer-cited line evidence but were not independently
> re-verified. Raw materials: `2026-06-11-appendix/`.
>
> Companions: `2026-06-11-feature-roadmap.md`, `2026-06-11-speaking-algorithm.md`.

## Verdict

The structural work from the refactor session holds up: the harness (golden + 43 interaction
assertions) is real protection, the decomposition gave tooling a foothold, and the hot paths that
were converted to targeted updates behave well. The remaining debt clusters in five places:

1. **Event-listener and navigation lifecycle** — one critical (flashcards) and one high
   (hashchange divergence) both come from the same root cause: *side-effectful renders with no
   single owner for enter/leave transitions*.
2. **The unaudited surfaces** — `app.css` (17k lines, never reviewed until now) and the data
   files (no validation, FK drift).
3. **Accessibility** — strong bones (real `<button>`s in most places, reduced-motion coverage),
   but several hard keyboard blocks.
4. **Load performance** — 2.2 MB raw JS+CSS + a 2.18 MB Google-Fonts request, all render-blocking,
   none minified.
5. **No failure containment** — zero error boundaries; one data typo can blank a section.

---

## P0 — fix now (user-facing breakage)

### 1. ✓ Flashcard keydown listener stacks per re-render *(fixed in this session's commit)*
`renderFlashcards` assigns a **new** `APP._flashKeyHandler` and `window.addEventListener`s it on
every call (app.js:12774–12790), but the only matching `removeEventListener` lives in `renderMain`
(app.js:2546–2551) — which the internal re-render paths (arrow keys, Space, `f`, class switch,
view toggle, font pickers) never go through. Each keypress therefore re-renders once per stacked
listener *and stacks another*: 1→2→4→…; after ~10 presses the tab freezes on hundreds of full
innerHTML rebuilds per keystroke. Leaving the section removes only the **last** handler, so stale
handlers keep firing in other sections — ArrowRight in the dictionary repaints flashcard UI over
the page. **Fix (applied):** remove the previous handler at the top of the assignment site.
Effort: S. Severity: critical.

### 2. ✓ Mic re-prompts every Speaking visit *(fixed in this session's commit — see companion doc §mic)*
`release()` stopped the tracks on every section exit; on origins where the grant doesn't persist
(`file://` — the way the app is normally opened — plus one-time grants and Safari), every
return+record was a fresh `getUserMedia` prompt. In browser-STT mode the recognizer re-arm added a
second per-take prompt path. And leaving via browser back/forward (hashchange) never released at
all — the mic stayed hot indefinitely. **Fix (applied):** permission-aware release (fully stop
only when `permissions.query` reports a durable grant on a persisting origin; otherwise *park* the
stream — `track.enabled=false` — so the session's one grant is reused), and a shared
`releaseSpeakingResources()` now called from **both** navigation paths. Also: serve the app from
`http://localhost` (the repo's preview server) and answer "Allow while visiting" once — that is
the zero-prompt configuration; `file://` can never durably persist mic permission in Chrome.
Effort: S. Severity: critical (UX-breaking annoyance + privacy leak on the back-nav path).

### 3. ✓ Restaurant scene menu is keyboard-dead — flow hard-blocks *(fixed: rows are role="button" with Enter/Space + focus restore + focus ring; verified live)*
The traditional-restaurant menu step renders orderable items as bare `<li data-menu-item>` with
click-only wiring (app.js:6951–6963, 7585–7606), while the Next button stays `disabled` until a
pick (6975–6979). Keyboard/switch users dead-end mid-scene. The fix is established in-house: the
brand-shop variant of the *same handler* uses `<button data-menu-item>` (6917) and the sizes step
uses `<button class="size-card">` (7038). Convert the `<li>`s to `<button>`s inside the `<li>`s
(or `role="button"`+tabindex+keys), mirror the existing `.scene-menu-row` styling onto the button
(needs a small CSS reset: `appearance:none; background:none; border:0; text-align:inherit;
width:100%`), and verify visually — golden doesn't capture scene steps. Effort: S–M.
Severity: critical (a11y hard block).

---

## P1 — high (correctness / heavy perf)

### 4. ✓ Section navigation has three divergent copies; consolidate into one `applySection`
`setSection` (app.js:267–306), the `hashchange` handler (12957–12960), and `init` (15557–15564)
each hand-maintain the section side-effects, and they disagree: hashchange misses the speaking/
library sidebar toggles, `lsSet('jp:section')`, the flash-sidebar cache reset — and (until this
session's fix) the mic release. Every new section gets wired into `setSection` and forgotten in
the handler. A fourth listener exists just for the vocab FAB (7775–7790). **Action:** one
`applySection(s, {fromHash})` owning per-section leave hooks (derived from a small table), the
sidebar class loop (derived from `SECTIONS`), persistence, and renders; everything else delegates.
This also retires the `_lastRenderedFlashClass` divergence (12160–12169). Effort: S–M.

### 5. ● Google Fonts: 11 families / 26 weights, ~2.18 MB render-blocking
The single fonts request (app.html:9) pulls 2,400 `@font-face` blocks; with `display=swap` the
page still pays layout shift + a long critical path. Several families serve one decorative surface
each. **Action:** audit actual usage (the four KANA_FONTS + UI serif/sans are the core), subset
(`text=` for the decorative one-offs or self-host woff2 subsets), drop unused weights. Likely
60–80% reduction with no visual change. Effort: M.

### 6. ● `alignReadings` mis-assigns furigana on ~40 shipped words
The proportional fallback (app.js:~1296) splits readings by `Math.round` share, which can split
inside digraphs (きょ) and overrun `total.length` for trailing kanji (I flagged the overrun in the
first review; the reviewer's sweep now counts ~40 affected dictionary/vocab words rendered with
wrong per-kanji furigana). **Action:** prefer a kana-alignment that anchors on okurigana and
on-yomi tables (the data already carries per-kanji readings in `KANJI_READINGS` for 243 chars —
use them as candidates before falling back to proportional). Add a data test that asserts
`join(per-kanji readings) === kana` for every aligned word. Effort: M.

### 7. ● Stale foodPool FK ids silently drop texture examples (karikari shows 3 of 6)
Texture `foodPool`/`examples` ids that no longer exist in the edibles set are silently dropped at
render (the "quiet failure mode" comment, app.js:4769–4772). Plus the textures[] tag split:
63/186 edible texture tags are non-canonical (ぷちぷち vs プチプチ etc.), so reverse lookups
under-match. **Action:** ship the data validator (a flashcards-only one exists but isn't in any
npm script) extended to: FK checks (foodPool→edibles, seeAlso→cards, examples→ids), tag-canon
checks, and required-field checks per page type. Wire as `npm run validate-data` + into `verify`.
Effort: S–M. This converts a whole class of silent content bugs into loud ones.

### 8. ✓ No error boundary; render throws blank the pane
Zero `window.onerror`/`unhandledrejection`/try-catch around section dispatch (renderMain
app.js:2546–2567). One malformed data entry = blank section, no message, and since drill-state is
persisted, reload can resurrect the broken state. **Action:** try/catch per section branch with a
minimal "section failed — reset" fallback that clears that section's persisted drill keys;
global onerror logging APP.section + active ids. ~25 lines. Effort: S.

### 9. ● A11y: focus loss + modal traps + live regions (cluster)
- innerHTML re-renders drop focus to `<body>`; dictionary filter pills then *steal* focus into the
  search input (focus() at app.js:12904).
- Div-based modals (`#card-modal`, settings) declare `aria-modal` but trap nothing and never
  receive focus; the jougo `<dialog>` does it right — reuse that pattern.
- No `aria-live` for dictionary count / speaking scores; flashcards' window-level Space handler
  hijacks Space on focused buttons/selects (no focus guard, app.js:12780).
- `lang="en"` on a Japanese-dominant document (2 `lang="ja"` attributes total) — screen readers
  read kana as English. Set `lang` per Japanese block (the renderers already centralize markup).
**Action:** one focused a11y pass; each item is S. Severity: high in aggregate.

---

## P2 — medium (debt that compounds)

### 10. ● CSS audit results (first ever; cluster, do as one pass)
- 632 KB / 17,191 lines, **26.7% comments**, unminified, single render-blocking file. Minify+gzip
  → ~54 KB transfer (vs 132 KB now). Add a tiny build step (esbuild/lightningcss) *or* a
  pre-commit minify producing `app.min.css` — keep the readable source.
- ~88 dead class selectors (~530 lines), some being never-firing state classes (intended UX that
  silently never engages — worth a quick check whether the JS or the CSS is the stale side).
- Six copy-paste secondary-sidebar blocks (3 byte-identical) — the CSS twin of the JS sidebar
  dedup; one shared block + per-section overrides.
- ~460 hardcoded color literals bypassing the token system; `--gold-dark` hand-expanded as
  `rgba(141,102,48,…)` 119 times in 22 alpha variants; `--accent-vermilion` referenced 18× but
  **never defined** (those declarations are no-ops — check what visually regressed).
- 16 distinct `max-width` breakpoints across 141 scattered @media blocks clustered around a
  de-facto 760px line — pick 2–3 canonical breakpoints, alias with custom media if a build step
  lands.
Effort: M–L total, parallelizable, all behavior-preserving and golden-guarded.

### 11. ● Data-layer hygiene (cluster)
- Same word defined 2–3× with drift (鍵 has two DICTIONARY entries with different JLPT levels;
  7 kanji gloss differently between FLASHCARDS and DICTIONARY). Decide the source of truth
  (cards) and generate/check the dictionary against it.
- Three field-name dialects across vocab page types; two shapes for flashcard examples. Normalize
  at load time (one adapter) rather than editing 6,500 data lines.
- `image-slot` probes ≥8 sequential 404s per image key per page load (variant probing) — the
  console noise the harness deliberately filters. Generate a manifest (like stroke `manifest.js`)
  at tool-time so the client never probes.
- `grade1-kanji.json` + `kanji-guide.md` + a 1.9 MB extracted-book file ship in the web root but
  are loaded by nothing — move out of the deployable root (also a copyright exposure).
Effort: S–M each.

### 12. ✓/● Remaining perf items
- Brush repositioning runs 3 document-wide `querySelectorAll`s + interleaved read/write layout on
  every scroll frame and DOM mutation app-wide (app.js:~540–700) even with zero brushes — gate on
  brush existence, batch reads/writes, and scope the observer. Effort: S.
- `APP.scenes = APP.scenes || {}` at three sites can bypass lazy hydration of `jp:scenes` and then
  `saveSceneState()` overwrites all saved restaurant progress with one entry — a latent wipe
  hazard kept safe only by render order today (app.js:3314–3325 lives in *dead code* —
  `renderRandomCategoryRestaurant`/`renderForcedRestaurant` have no live callers; delete them).
  Make hydration the only accessor. Effort: S.
- ~29 of 53 inline `<img>` sites lack `loading="lazy"`; scene/grid renders decode whole image sets
  eagerly on every full re-render. Effort: S.
- First-load payload: 2.24 MB raw / ~592 KB gzip across 9 synchronous scripts — minify at minimum;
  consider `defer` for the data files + boot-after-load. Effort: S–M.
- `typewriterReveal` allocates a span + an uncancelled `setTimeout` per character; timers outlive
  navigation (low, but trivial to clear on teardown).

### 13. Carried over from the first review (still open, unchanged)
- Persistence centralization (~110 `lsSet` sites; quota failures are silently fatal to all saves).
- Settings toggles + scene picks still full-re-render (Phase 5 leftovers).
- DSP off the main thread (now folded into the speaking-algorithm plan, see companion doc).
- The 6 edibles transitions dedup (needs live visual verification).
- Split `app.js` into per-section plain `<script>` files (zero build; the seams are clean).

---

## P3 — low / polish
- Midnight/noon readings teach 午前十二時/午後十二時 (English 12-AM/PM transplanted); prefer 午前0時 /
  正午 (or 午後0時). Small data fix, pedagogically worth it.
- Konbini オレンジ row: label/kana/TTS disagree (kana says orange *juice*).
- DICTIONARY kana mixes three reading conventions and renders raw.
- JS smooth-scrolls + the global section fade ignore `prefers-reduced-motion` (the CSS coverage is
  otherwise strong).
- A short table of contents comment at the top of `app.css`.

---

## Status after the 2026-06-11 fix pass (same day)

Done and committed, each gated by golden 18/18 + interactions (now 55) + validator:
- **P0.1 / P0.2 / P0.3** — flashcard listener stacking, mic permission lifecycle, scene
  keyboard access. All verified live.
- **P1.4** — `applySection` now solely owns section-switch side-effects; setSection /
  hashchange / init delegate. **P1.8** — render error boundary + per-section reset keys +
  global error/rejection loggers.
- **P1.7** — `scripts/validate-data.mjs` wired into `npm run verify`; fixed what it caught
  (7 dangling foodPool ids, script-variant texture tag, orange-juice label mismatch) plus the
  P3 clock fix (午前零時/午後零時). **Refuted:** the "duplicate 鍵 with conflicting levels"
  claim — it's one `kind:'kanji'` + one `kind:'word'` entry, intended design. The 厶 seeAlso
  refs point at a real radical card; the runtime lookup just doesn't resolve radical cards
  (dormant link — surfacing it is a future UI decision).
- **P2.12** — `scenes()` hydration accessor (wipe hazard closed), dead scene launchers deleted
  (~60 lines), brush-reposition early-exit probe, typewriter timer cancellation, konbini lazy
  imgs. The "~29 img sites lack lazy" count was inflated by multi-line tags — only one real gap.
- **P1.9 (subset)** — key-hijack guard, aria-live on dictionary count + speaking scores,
  card-modal focus management, reduced-motion-aware `scrollPageTop()` replacing 9 copies.

**P1.5 fonts — audited, no mechanical trim available.** All 11 families are referenced
(several via the user-facing font pickers) and every loaded weight is used (400–700 heavily,
800 once at app.css:419; a font-weight:900 at app.css:14749 exceeds what's loaded and is
already browser-synthesized — pre-existing). Real transfer is also lower than the 2.18 MB
headline because Google Fonts unicode-range slicing downloads only rendered slices. The
meaningful win here is a deliberate **self-host + subset pipeline** (woff2 subsets of used
glyph sets) — promoted to a standalone project alongside the CSS minification decision.

**Still open, in priority order:** P1.6 furigana alignment (with the join==kana data test) ·
P1.9 remainder (focus restoration on re-renders, jougo-style focus traps for the settings
modal, lang attributes) · P2.10 CSS pass · P2.11 remaining data hygiene (field-dialect adapter,
image-slot probe manifest, dead generated assets) · P2.13 carried-over phases.

## Suggested sequencing

| Week | Work |
|---|---|
| now (done) | P0.1 flashcard listener ✓, P0.2 mic ✓ (this session) |
| 1 | P0.3 scene keyboard, P1.4 applySection, P1.8 error boundary, P2 quick wins (lazy-img, brush gating, scenes hydration, dead code) |
| 2 | P1.7 data validator + FK fixes, P1.6 furigana alignment, P1.9 a11y pass |
| 3 | P1.5 fonts + P2.10 CSS pass (minify, dead rules, tokens) |
| ongoing | P2.13 carried-over refactor phases as their own sessions |

Bar for every change: `npm run verify` (golden 18/18) + `npm run test:interactions` green, plus
live checks for anything golden can't see (scenes, animations, focus).
