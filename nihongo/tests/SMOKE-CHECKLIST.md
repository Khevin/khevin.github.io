# Nihongo — Manual Smoke Checklist

Run this by hand after each refactor phase, in addition to the automated
characterization diff (`characterize.js` + `compare.mjs`). The automated check
proves *rendered output* is unchanged; this checklist proves *interactions*
(clicks, audio, keyboard, persistence) still work — things a static DOM
fingerprint can't see.

Serve from the repo root and open the app:

```
py -m http.server 8766      # (already configured in .claude/launch.json)
# → http://localhost:8766/nihongo/app.html
```

## A. Section navigation (sidebar — leftmost rail)
- [ ] **Basics** (基) loads; writing sub-sidebar appears.
- [ ] **Flashcards** (札) loads; class list appears in flash sidebar.
- [ ] **Vocabulary** (語) loads; categories + books sidebars appear.
- [ ] **Speaking** (話) loads; categories appear.
- [ ] **Library** (図) loads; Search / Dictionary / Books sub-nav appears.
- [ ] Reload the page on each section → it resumes on that section (localStorage `jp:section`).
- [ ] Browser **back/forward** moves between visited sections.

## B. Vocabulary — Food
- [ ] Flavors bento shows 10 flavor cards; click one → immersion view; ← → walk flavors; back returns to bento.
- [ ] Textures page shows the spectrum; click a card → spotlight updates; Space speaks the word.
- [ ] Edibles: 8 category tiles → click one → item grid → click an item → detail spread with flavor badges.
- [ ] Click a flavor badge inside an edible detail → jumps to that flavor's world (breadcrumb back-button appears).
- [ ] Eating Out → pick a restaurant → scene plays; **Next** advances every step to the end; **Back** works; the shop-picker dropdown opens and closes.
- [ ] A paged book (e.g. Home → Bathroom): stepper advances pages; word drawer / FAB (札) opens the cheatsheet list.

## C. Flashcards
- [ ] Card view shows image + glyph + info; flip reveals stroke order / radicals.
- [ ] Arrow keys move between cards; flip key works.
- [ ] List view renders the whole class; switching class updates the deck.
- [ ] Colors class: glyph paints in the swatch color; clicking a tile opens the color flashcard modal.

## D. Writing / Basics
- [ ] Kana page renders hiragana + katakana; size/romaji toggles work.
- [ ] Numbers, Colors, Datetime, Particles, Sentence Structure, Pitch & Tones each render.
- [ ] Datetime page shows a plausible current time reading.

## E. Speaking / Shadowing
- [ ] Studio loads a phrase; model audio plays (autoplay or play button).
- [ ] Record button prompts for mic the first time, records, and produces a score.
- [ ] Leaving the Speaking section turns off the mic indicator.

## F. Library
- [ ] Search: select radicals → kanji grid narrows; clicking a kanji jumps to its flashcard.
- [ ] Dictionary: typing filters results; kind/level/tag filters work.
- [ ] Books page renders the shelf.

## G. Audio / TTS (site-wide)
- [ ] Any 🔊 speaker button speaks Japanese.
- [ ] Double-clicking the same speaker does NOT double-speak (700ms debounce).
- [ ] Navigating mid-speech cancels the previous clip (no overlap).

## H. Settings
- [ ] Settings opens; font theme, TTS voice/rate/volume, furigana, density toggles apply and persist across reload.

---

## Known bugs — verify these are FIXED after Phase 2 (regression guards)

> Captured before-states on `main` (2026-06-01). Re-run after fixes.

- [ ] **BUG-1 — word lookup.** Double-click a Japanese word (or use the popover "look up").
  - *Before fix:* lands on Library showing the **last-open library page** (e.g. Books), with **no sidebar visible**, and the looked-up word is dropped. `localStorage 'jp:section'` gets set to the invalid `"dictionary"`.
  - *Expected after fix:* lands on the **Dictionary** page with the looked-up word pre-filled and the library sidebar visible.
- [ ] **BUG-2 — stuck animation flag.** Rapidly switch flavors / edibles categories, including during a transition.
  - *Before fix:* if a re-render throws mid-transition, `window.__flavorsAnimating` / `__ediblesAnimating` stays `true` and all further navigation silently freezes.
  - *Expected after fix:* navigation never permanently locks (flag cleared in a `finally`).
- [ ] **BUG-3 — scene dead-end.** Advance through any restaurant scene whose step `next` points at a missing id.
  - *Before fix:* Next button silently does nothing.
  - *Expected after fix:* falls through to the next sequential step (no dead-end).
- [ ] **BUG-4 — legacy scene crash.** Load with an old `jp:scenes` value lacking `npcVariants`.
  - *Before fix:* throws on the first NPC step.
  - *Expected after fix:* renders with a default variant.
- [ ] **BUG-5 — playback context leak.** Play a recording in Speaking, navigate away mid-playback, repeat several times.
  - *Before fix:* a new AudioContext leaks each time (eventually "max AudioContext" errors).
  - *Expected after fix:* contexts are closed/reused.
- [ ] **BUG-6 — orphaned dropdown listeners.** Open the restaurant shop-picker, then trigger a scene re-render (Next) while it's open.
  - *Before fix:* two `document` listeners orphaned per occurrence.
  - *Expected after fix:* listeners removed on teardown.
