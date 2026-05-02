---
inherits: ../styles.css
register: editorial
layout: hybrid

tokens:
  # Tokens inherited from portfolio styles.css unless overridden below.
  # Editorial register flips --case-accent to ink (already set in
  # body[data-project] block, lines 2694–2697 of styles.css).
  case-accent: var(--ink)

  # Type roles (the editorial three-role pairing — display + body + label)
  type-display: "Inter Tight, sans-serif"   # weight 600–700
  type-body:    "Source Serif 4, serif"     # weight 400, italic 400
  type-label:   "Inter Tight, sans-serif"   # weight 500, often uppercase letterspaced

  # Per-section type scale for hybrid layout.
  # Hero h1 stays in serif (Source Serif 4, 400) to match the rest of the
  # portfolio where titles are serifed. Display-sans begins at chapter numerals.
  hero-h1:        "clamp(56px, 8vw, 88px)"   # serif 400, italic ems
  chapter-num:    "clamp(64px, 7vw, 96px)"   # display sans 700, in rail
  chapter-h2:     "clamp(28px, 3.5vw, 40px)" # display sans 600 with serif italic ems
  body-prose:     "18px / 1.55"              # serif 400, max-w 62ch
  pull-quote:     "clamp(22px, 2.4vw, 30px)" # serif italic, ink left-rule
  kpi-numeral:    "clamp(56px, 8vw, 104px)"  # display sans 700, tabular-nums
  rail-kicker:    "12px / 0.14em tracking"   # label sans 500, uppercase
  caption:        "15.5px italic"            # serif italic, ink-soft

  # Spacing — editorial register, generous
  chapter-padding-vertical: "clamp(64px, 8vw, 112px)"
  chapter-bar-thickness: "4px solid var(--ink)"  # heavy chapter break
  hairline: "1px solid var(--ink-faintest)"      # sub-section break

  # Image-shape constraints
  hero-aspect:        "16/9"
  vertical-aspect:    "3/4"
  square-aspect:      "1/1"
  cinematic-aspect:   "21/9"
  multi-grid-aspects: "[1/1, 2/3, 16/9]"

  # Motion — editorial gets 240–360ms with deceleration ease;
  # no choreography, no entrance animation on load
  motion-duration: 240ms
  motion-easing:   "cubic-bezier(0.16, 1, 0.3, 1)"
---

# Overview

spaces.html sits inside the existing portfolio's design system, inheriting all chrome tokens (ink, paper, rule, accent) from `styles.css`. The case-study chrome at `body[data-project]` already overrides `--accent` to `--ink` for editorial register; spaces.html doesn't introduce new tokens, only new compositions of existing ones.

The hybrid layout demands two distinct type rhythms in the same page — rail-and-body sections use display sans for chapter numerals (Inter Tight 700) and a hybrid display-sans-with-serif-italic-ems treatment for chapter titles, while the cinematic break uses centered italic body serif at scale to punctuate the moment as editorial rather than marketing. Body prose stays in Source Serif 4 throughout. Small label sans (Inter Tight 500, uppercase, 12px) carries kickers and figure tags. The discipline is the editorial three-role pairing from `typography.md` § Type for case studies and long-form.

The page-level title (the hero `h1`) stays in serif to match the rest of the portfolio. This is a deliberate continuity with v1 and with the broader portfolio voice — every page title across `index.html`, `process.html`, `about-me.html` reads in serif. Switching the hero to display-sans for spaces alone would create a one-off that fights the portfolio's coherence. Display-sans begins at chapter numerals (`01.`, `02.`, `03.`) and chapter headers, where it does the work of marking structural pivots without competing with the page-level identity.

The chapter spine is three (not four like v1). Each chapter has a numbered rail anchor and a body that can host figures, splits, or feature highlights inline. The cinematic break sits between chapters 2 and 3 — full-bleed-within-shell, 21:9, on a `--paper-warm` tinted band that releases the eye from the rail discipline and reads as a single climactic moment.

# Colors

Inherited from portfolio. No new color tokens. Editorial register confines color to the artwork itself; the page chrome reads in ink, paper, and mid-grey only. Italic ems, pull-quote rules, KPI numerals all tint to `var(--case-accent)` which resolves to `var(--ink)` for `body[data-project]`. The cinematic break's tinted band uses `--paper-warm` (already defined in styles.css) as the only elevation cue — not an accent color.

# Typography

Three roles, one each.

**Display sans (Inter Tight 600–700):** chapter numerals at 64–96px, chapter headers at 28–40px. The display voice carries structure and the sense that this is a piece of work, not a piece of marketing. Chapter h2 may carry serif italic ems for emphasis (matching v1's pattern: `<em>` inside the h2 renders in Source Serif 4 italic).

**Body serif (Source Serif 4, 400 + italic 400):** narrative prose at 18px/1.55, max-width 62ch, ink-2 color. Italic ems on load-bearing words. Italic pull quotes at 22–30px with a 2px ink left-rule and 20px left padding, capped at 44ch. Hero h1 also lives in this voice (400 weight, italic ems for the active verb), per portfolio continuity.

**Label sans (Inter Tight 500, uppercase, 12–14px, letter-spacing 0.14em):** rail kickers, figure tags, KPI labels, the cinematic-break "Version 2.0 — the reveal" label. Mid-grey (ink-soft) by default; never accent-colored.

# Elevation

Whisper-quiet. The page is essentially flat. Hairlines (1px ink-faintest) separate sub-sections inside chapters. A heavy ink bar (4px solid ink) marks each chapter break. The cinematic break uses a tinted background band (`--paper-warm`) as its only elevation cue — no shadows, no card frames. Images are bare (no `paper-frame` mounting) per `styles/editorial.md` discipline. The Notes-style square highlight in chapter 2 sits in a `paper-warm` callout block (similar to the existing `.feature-highlight` in styles.css) with a 1px hairline border.

# Components

Reused from existing portfolio CSS where possible; new compositions documented inline.

- **`.case-hero.case-hero--wide` + `.fact-ribbon`** (existing) — page hero and six-cell fact ribbon, unchanged.
- **`.case-key__fig`** (existing, bare) — hero key visual, 16:9 horizontal.
- **`.takeaways` + `.takeaways__list`** (existing) — three-takeaways pre-summary, unchanged.
- **`.chapter` rail-and-body** (existing) — 280px rail + body column, three chapters.
- **`.chapter__body .vertical-split`** (NEW) — within chapter 1, a 240px-wide vertical-image figure sits in a sub-grid alongside prose. Class: `.vertical-split` with `grid-template-columns: 240px 1fr; gap: 40px`.
- **`.chapter__body .square-highlight`** (REVISED from existing `.feature-highlight`) — within chapter 2, a 320px square image + content split, sitting in a `paper-warm` block. Reuses existing `.feature-highlight` with the image slot constrained to 1:1.
- **`.cinematic-break`** (NEW) — between chapters 2 and 3, full-bleed-within-shell, tinted band, 21:9 image, label above, italic serif caption below. Class: `.cinematic-break` with `padding: clamp(64px, 8vw, 112px) 0; background: var(--paper-warm); margin: 80px -32px;` (negative margin to break out of chapter constraints).
- **`.kpi-editorial`** (existing) — display-sans numerals + serif labels, hairline divided. Sits inside chapter 3.
- **`.multi-shape-grid`** (NEW) — within chapter 3, three figures in a varied grid. Class: `.multi-shape-grid` with `grid-template-columns: 1fr 1fr 1.5fr` and per-figure aspect ratios (1/1, 2/3, 16/9).
- **`.evidence-wall`** (existing) — three-clutter inheritance strip, optional in chapter 1 alongside the vertical-split.
- **`.side-quest`** (existing) — closer for the marketing-site companion piece, unchanged.

# Do's and Don'ts

**Do.**

- Use the editorial three-role pairing (display sans / body serif / label sans) consistently per role, not per section.
- Keep the hero h1 in serif (Source Serif 4, 400) to match portfolio continuity. Display-sans begins at chapter numerals.
- Show decision-walks inline ("we considered chapter-scroll, picked rail-and-body because…") — peer-voiced, not tutorial-voiced. The Considered pillar.
- Keep image-shape variety deliberate: horizontal lead, vertical split, square detail, ultra-wide cinematic, multi-shape close.
- Tint the cinematic-break band toward `paper-warm` — not pure paper, not accent. The band is the only elevation cue.
- Use italic serif for figure captions when the caption adds information; drop the caption entirely when the surrounding prose explains the figure.

**Don't.**

- Don't use display-sans for body prose (per `anti-slop.md` § Typography, "single font family throughout" tell — disqualifying on editorial).
- Don't switch the hero h1 to display-sans for cinematic effect. Portfolio continuity wins; spaces stays in family.
- Don't add card frames around the hero, cinematic-break image, or multi-shape grid figures (`anti-slop.md` § Visual + `styles/editorial.md` § Anti-patterns "Card-everywhere template").
- Don't use mono "FIG · NN · LABEL" eyebrows above figures (already banned in PRODUCT.md restrictions).
- Don't promote Considered into Pedagogical — the case study should not explain rail-and-body, it should USE it and let the reader infer.
- Don't add a three-equal-card "Process / Discovery / Delivery" trio anywhere — explicit ban (per PRODUCT.md restrictions and `styles/editorial.md` § Marketing-page cargo cult).
- Don't change layout impulsively at Gate 10 — only re-check if image inventory has materially shifted (per `layouts.md` § Layout is iterative).
