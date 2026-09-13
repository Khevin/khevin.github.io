# Nihongo study redesign

Implemented locally on September 11, 2026. This changes the app's Flashcards →
Study experience. The Reader extension version remains 0.5.0.

## Learning approach

The design uses question-first recall, answer feedback, and spaced review.
[Anki's studying guide](https://docs.ankiweb.net/studying.html) documents this
sequence and distinguishes an incorrect answer (Again) from a correct but
difficult answer (Hard). Its answer-button model informed the plain-language
ratings here. [Retrieval Practice's feedback guidance](https://www.retrievalpractice.org/feedback/)
and [spacing guidance](https://www.retrievalpractice.org/spacing) support showing
feedback after an attempt and distributing recall over time.

Application to Nihongo: ask for the **meaning** of the kanji or word. Readings
are reference material on the revealed card. A context-free kanji with several
possible readings should not leave the learner guessing what counts as correct.
The personal mnemonic picture is revealed after the attempt, so it supports
feedback without giving away the initial answer.

## The experience

- **Setup:** see due cards across decks; review those first, or introduce the
  next 5, 10, or 20 unseen cards from a chosen deck in its authored order.
- **Recall:** one clear question and the bare glyph. The category rail steps
  aside; the main app navigation stays available.
- **Reveal:** the original meaning, mnemonic image, kun/on readings, and an
  optional example from the existing card. No card content was rewritten.
- **Rate:** Again = wrong/forgotten; Hard = correct with a struggle; Good =
  correct with effort; Easy = immediate recall. Each button displays its next
  review interval in full words. Good has the strongest visual emphasis.
- **Finish:** a finite round with remembered/to-revisit counts. These describe
  this round, not permanent mastery. Missed cards wait for the scheduler's due
  time instead of looping immediately at the end. The overview updates when
  another review becomes available.
- **Recovery:** undo the last rating, pause and resume while the tab remains
  open, or browse other cards. Ratings persist as they are made. Reloading
  preserves scheduling but starts a fresh session setup.

Space/Enter reveals the question; 1–4 rates the answer. Z undoes during an
active round. Space does not globally select Good after reveal. Repeated
keypresses, obsolete controls, and ratings before reveal are guarded.

## Implementation and data

- `nihongo/study-review.js` owns the study presentation and session state.
- `nihongo/study-review.css` contains the scoped study styles and the narrow
  Flashcards layout corrections needed to make Study reachable on mobile.
- `nihongo/app.js` retains browse rendering and SRS. The study UI is loaded
  before it in `app.html`. Existing `jp:srs` keys, schema, FSRS parameters,
  authored card order, and mnemonic images are preserved.
- Saving a rating now writes successfully before advancing the in-memory
  schedule or UI. A failed write leaves the answer available for retry.
- Undo restores that card's prior state and its daily tally. It refuses to
  overwrite a later change. This is a local-browser store, not a cross-device
  synchronization system; simultaneous writes from multiple tabs are not a
  transactional multi-user workflow.
- Counts exclude removed/reference-only cards while retaining stored history.
- A direct **Study cards** button is available from both card and list views.
- Study timers and keyboard handlers are cleared on navigation. Due-panel
  refreshes preserve the deck picker and focus.
- No packages or services were added. No publication was performed.

## Validation

- 37 dedicated browser checks, including save failure, exact undo restoration,
  existing history, scheduled repeats, pause/resume, and stale input guards.
- 65 general app interaction checks passed.
- 18 characterized app states compared: only the intentional Study entry
  changed in the card/list snapshots; those two baselines were updated.
- Data validation passed for 262 cards, 121 edibles, and 123 dictionary entries.
  Existing warnings concern descriptive texture tags and seven dictionary
  glosses that differ from their cards; the redesign does not change these.
- Desktop, 390px phone, and 768px tablet views inspected; enlarged text checks
  passed with no horizontal overflow in the study surface.

Run `npm run test:study`, `npm run test:interactions`, and `npm run verify`
from `nihongo/`. Browser tests use isolated profiles. Optional
`BROWSER_CHANNEL=msedge` selects an installed Edge browser;
`STUDY_SCREENSHOTS=1` saves temporary study screenshots.
