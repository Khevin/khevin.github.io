# Nihongo — Learning-Feature Roadmap · 2026-06-11

> Grounded in: a full content inventory of the app (appendix `inventory.md`), SLA research and
> competitor analysis (appendix `research-features.md`, fully sourced), and the brand/product
> constraints in `docs/superpowers/specs/` (Sensory · Patient · Disciplined; no streak anxiety,
> no XP, no leaderboards, no emoji feedback).

## Where the app stands (the honest map)

What exists is unusually strong on **presentation and production**: 17 flashcard decks (262 cards
with images, stroke order, Heisig links, radical decompositions), ~530 vocab items across 26
books, a 21-restaurant branching dialogue engine, a shadowing studio with real DSP scoring and
pitch contours, a 194-question particle quiz, radical search, and 7 teaching pages. Few hobby apps
— few *commercial* apps — have this surface area with this level of authorial care.

What's missing is one thing, systemically: **recall**. The inventory's bottom line:

- Surfaces with a graded test mechanic: **2.5 of ~9** (particle quiz, speaking studio, half-credit
  for scene choices).
- Items under spaced review: **0**. Review history: **none**. Per-item outcome memory: **none**.
  All 43 localStorage keys are prefs/navigation — nothing remembers what you know.

The two strongest effects in the learning literature — **retrieval practice** (testing effect)
and **spaced repetition** — are exactly the two mechanics the app doesn't have. And the unusual
leverage: every piece of *content* these mechanics need already exists. You don't have a content
problem; you have a missing drill layer (~2–3 weeks of focused work total).

A second, smaller systemic gap: **listening comprehension** exists only as shadowing (production-
coupled). There is no listen→understand exercise (dictation, audio-first recognition).

---

## Tier 1 — the recall layer (build first; ~2 weeks total; everything reuses existing assets)

### 1. FSRS spaced review on the flashcard engine ★ the single highest-impact feature
Wrap the existing deck/flip engine with the FSRS scheduler (the open algorithm Anki adopted as
default in 2023; ~10–15% better retention per review-minute than SM-2 in benchmarks).
- Use `ts-fsrs` (MIT). Per-card state `{stability, difficulty, due, reps, lapses}` ≈ 150 bytes —
  262 cards ≈ 40 KB localStorage; trivial.
- UI: a "review" entry in the flash sidebar → due-queue ("23 due today"); after flip, four quiet
  buttons (Again / Hard / Good / Easy — text, not emoji, per brand). The existing card layout is
  untouched; browse mode stays as-is.
- Respect the Patient pillar: no overdue nagging, no red badges. The queue is an invitation.
- Later: the same state object attaches to vocab items and cloze items (one schema, three uses).
Effort: ~1 week incl. forecast view. Evidence: strongest in the field (Cepeda 2006; Roediger &
Karpicke 2006).

### 2. Typed-recall mode on flashcards (production, not recognition)
On the question side, type the reading (romaji→kana via `wanakana`, ~40 KB MIT) before flipping;
self-grade feeds FSRS. Typed production encodes differently (and harder) than recognition — and it
builds kana-typing automaticity, a real-world skill. Effort: 1–2 days on top of #1.

### 3. Cloze deletion from the sentences you already wrote
The data already holds: 36 usage items + 37 sentence items + examples on 257 cards + 105
scene-menu lines. A cloze generator (blank the target word or particle, kana input, normalized
compare) turns all of it into recall items, schedulable by the same FSRS state. Start with vocab
books and particle examples (the particle quiz proves the interaction pattern works). Effort: 3–5
days. Evidence: generation effect (Slamecka & Graf 1978) + cloze validity literature.

### 4. Minimal-pair pitch perception quiz (the missing half of your pitch story)
You teach pitch (theory page) and score pitch production (studio) — but perception training is the
step research says comes first, with the larger transfer effect (Hirata 2020-line of work):
hear 橋/箸, 雨/飴, 柿/牡蠣 …, answer "which pattern?", reveal with the studio's existing contour
SVG. ~50 documented high-value pairs + existing TTS + existing pitch renderer = 2–3 days. This is
also the most *on-brand* possible quiz — it deepens the app's distinctive pitch focus.

### 5. Dictation (listen → type) — the listening-comprehension gap
TTS plays a sentence from the existing data (rate slider 0.75×/1.0× — one line with the existing
TTS settings); learner types kana; normalized diff highlights misses. Doubles as kana-typing and
segmentation practice. Effort: 2–4 days. (Research note: don't default to slowed audio — slowed
helps segmentation early but impairs prosody acquisition; default 1.0× with 0.75× as an option.)

### 6. Katakana loanword sprint (cheapest meaningful win)
~200 high-frequency loanwords + TTS + the existing quiz engine. English L1 speakers carry
thousands of "free" words they fail to activate (Daulton 2008); this drills the phonological
mapping (テレビ→television) directly. Effort: ~1 day.

## Tier 2 — consolidation (after the recall layer)

7. **Counter drills** (個/枚/本/匹/冊/杯/台/人/回…) via the particle-quiz engine + a data file.
   Notorious gap, no good competitor solution, 1–2 days.
8. **Study calendar + review forecast** — a quiet GitHub-style heatmap of days studied and an
   FSRS due-forecast graph. Explicitly *not* a streak with loss-anxiety (brand ban, and the
   Duolingo research shows streaks drive engagement, not retention). Self-monitoring without
   nagging. 1–2 days.
9. **Listening-first card mode** — play TTS first, reveal kana/kanji after the answer; flips the
   existing cards into audio-recognition items. ~1 day on top of #1/#2.
10. **Scene-engine recall pass** — after completing a restaurant scene, a 5-item cloze/recall
    epilogue built from that scene's lines ("what did the cashier ask?"). Converts the strongest
    content in the app from experience into retention. 2–3 days.

## Tier 3 — the intermediate wall (bigger builds, plan deliberately)

11. **Conjugation drills** (て/た/ない/potential/passive/conditional; godan vs ichidan; い/な
    adjectives). Form-focused instruction shows ~the largest effect sizes in SLA meta-analyses
    (Norris & Ortega 2000, d≈0.96). Needs a verb dataset + a rule engine (algorithmic, well-
    documented problem) + typed input from #2. 1–2 weeks. This is the single most important
    *content* addition for progressing past N5.
12. **Grammar cloze beyond particles** (Bunpro-style graded fill-ins reusing #3's engine).
13. **Keigo annotations in scenes** (the restaurant engine already models politeness implicitly —
    surface it; content work, days).
14. **Frequency badges on vocab** (N5/N4 tags exist; add a corpus-frequency rank so learners know
    which themed words are high-yield). 1–2 days with an open frequency list.

## Deliberately skip (evidence- or brand-based)

- **Handwriting/stroke tracing** — high build cost, weak modern-use evidence (recognition is what
  digital-era learners need; JLPT doesn't test writing). The stroke-order images already serve the
  recognition-aid purpose.
- **Streaks/XP/leaderboards/hearts** — brand-banned and research-weak for retention.
- **A full graded-reader pipeline** — the highest-value version needs thousands of dictionary
  entries and leveled stories; that's a content-acquisition project, not a feature. Revisit after
  the recall layer; if reading hunger appears sooner, the existing popover dictionary + furigana
  toggle could host a *small* set of hand-written leveled passages (the speaking `notes` prose
  shows the authorial voice for it).

## Sequencing logic

FSRS (#1) first because everything else feeds it: typed recall (#2), cloze (#3), listening cards
(#9), and eventually conjugations (#11) all want the same scheduling + state substrate. The pitch
minimal-pairs (#4) and loanword sprint (#6) are independent quick wins that can interleave
anywhere. After Tier 1, the app covers: recognition ✓, recall ✓, spacing ✓, listening ✓,
production (typed ✓ + spoken ✓), perception ✓ — at which point the honest gap analysis shifts from
*mechanics* to *content volume*, which is where you, as the author, were always going to win.
