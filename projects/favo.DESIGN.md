---
inherits: ../styles.css
register: editorial
layout: rail-and-body

tokens:
  # Tokens inherited from portfolio styles.css unless overridden below.
  # Editorial register flips --case-accent to ink (already set in
  # body[data-project] block, lines 2694–2697 of styles.css).
  case-accent: var(--ink)

  # Type roles (the editorial three-role pairing — display + body + label)
  type-display: "Inter Tight, sans-serif"   # weight 600–700
  type-body:    "Source Serif 4, serif"     # weight 400, italic 400
  type-label:   "Inter Tight, sans-serif"   # weight 500, often uppercase letterspaced

  # Per-section type scale, inherited from spaces.DESIGN.md tokens.
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

  # Brand-comparison-specific type
  wordmark-label: "11px / 0.14em tracking"   # mono, uppercase, ink-faint
  archive-label:  "10px / 0.18em tracking"   # mono, uppercase, ink-faint

  # Spacing — editorial register, generous
  chapter-padding-vertical: "clamp(64px, 8vw, 112px)"
  chapter-bar-thickness: "4px solid var(--ink)"  # heavy chapter break
  hairline: "1px solid var(--ink-faintest)"      # sub-section break

  # Image-shape constraints
  hero-aspect:        "16/9"
  brand-system-aspect: "16/9 to 21/9"  # wide horizontal for brand medley
  partner-app-aspect:  "1/1 or 4/3"    # the iPhone-trio image
  archive-aspect:      "1/1 or 4/3"    # small Aiyu artifact tiles

  # Motion — editorial gets 240–360ms with deceleration ease;
  # no choreography, no entrance animation on load
  motion-duration: 240ms
  motion-easing:   "cubic-bezier(0.16, 1, 0.3, 1)"
---

# Overview

favo.html sits inside the existing portfolio's design system, inheriting all chrome tokens (ink, paper, rule, accent) from `styles.css`. The case-study chrome at `body[data-project]` already overrides `--accent` to `--ink` for editorial register; favo.html doesn't introduce new tokens, only new compositions of existing ones.

The page commits to Lane 1 (product-forward, brand-as-context) with four chapters: Background, Rebrand, Product (in parallel), Outcome. Rail-and-body at the page level (3/9 split). Display sans for chapter numerals (Inter Tight 700) and chapter titles (Inter Tight 600 with serif italic ems for emphasis); body prose stays in Source Serif 4. Small label sans (Inter Tight 500, uppercase, 12px) carries kickers and figure tags. The discipline is the editorial three-role pairing from `typography.md` § Type for case studies and long-form.

The page-level title (the hero `h1`) stays in serif to match the rest of the portfolio. Continuity with `index.html`, `process.html`, `spaces.html`, `amway.html`. Display-sans begins at chapter numerals (`01.`, `02.`, `03.`, `04.`).

The brand-comparison moment in chapter 2 is the page's signature composition — a static side-by-side wordmark pair (Aiyu left, Favo right) on a hairline-divided sub-grid, with a mono label above each (`BEFORE — 2020` / `AFTER — 2020`). Lower in the same chapter, an Aiyu archive strip (3–4 retired artifacts in a 4-up hairline-bordered grid, mono `RETIRED · 2020` captions) does evidence-by-context. These two components are net-new for the portfolio CSS and live as `.brand-comparison` and `.aiyu-archive` classes scoped to `body[data-project="favo"]`.

# Colors

Inherited from portfolio. No new color tokens. Editorial register confines color to the artwork itself; the page chrome reads in ink, paper, and mid-grey only. Italic ems, pull-quote rules, KPI numerals all tint to `var(--case-accent)` which resolves to `var(--ink)` for `body[data-project]`. The brand-comparison and Aiyu-archive blocks both sit on plain paper — no tinted bands, no callout backgrounds. The brand artwork inside (Aiyu wordmark with its old red/orange palette, Favo wordmark with its honeycomb-yellow palette) carries its own color naturally; that's the point of "color confined to artwork."

# Typography

Three roles, one each.

**Display sans (Inter Tight 600–700):** chapter numerals at 64–96px, chapter headers at 28–40px. The display voice carries structure and the sense that this is a piece of work, not a piece of marketing. Chapter h2 may carry serif italic ems for emphasis (matching v1's pattern: `<em>` inside the h2 renders in Source Serif 4 italic).

**Body serif (Source Serif 4, 400 + italic 400):** narrative prose at 18px/1.55, max-width 62ch, ink-2 color. Italic ems on load-bearing words. Italic pull quotes at 22–30px with a 2px ink left-rule and 20px left padding, capped at 44ch. Hero h1 also lives in this voice (400 weight, italic ems for the active verb), per portfolio continuity.

**Label sans (Inter Tight 500, uppercase, 12–14px, letter-spacing 0.14em):** rail kickers, figure tags, KPI labels. Mid-grey (ink-soft) by default; never accent-colored.

**Mono (JetBrains Mono 500, uppercase, 10–11px, letter-spacing 0.14–0.18em):** the brand-comparison `BEFORE — 2020` / `AFTER — 2020` labels above each wordmark, and the Aiyu-archive `RETIRED · 2020` captions on each retired artifact. Mono is the "data-fact" register here — these are timestamped archival markers, not narrative.

# Elevation

Whisper-quiet. The page is essentially flat. Hairlines (1px ink-faintest) separate sub-sections inside chapters and frame the brand-comparison + Aiyu-archive blocks. A heavy ink bar (4px solid ink) marks each chapter break. No tinted bands (no cinematic-break in this case study — Lane 1 is the cleaner four-chapter cadence). Images are bare (no `paper-frame` mounting) per `styles/editorial.md` discipline. The Aiyu-archive tiles each sit on a `paper-warm` background with a 1px hairline border to mark them as "filed" / retired — that's the only elevation differentiation on the page.

# Components

Reused from existing portfolio CSS where possible; new compositions documented inline.

- **`.case-hero.case-hero--wide` + `.fact-ribbon`** (existing) — page hero and fact ribbon, with row count fitting Favo's facts: Role · Team · Industry · Region · Duration. No "Stack" row.
- **`.case-key__fig`** (existing, bare) — hero key visual, 16:9 horizontal.
- **`.takeaways` + `.takeaways__list`** (existing) — three-takeaways pre-summary, unchanged.
- **`.chapter` rail-and-body** (existing) — 280px rail + body column, four chapters.
- **`.chapter__body .brand-comparison`** (NEW) — within chapter 2, a side-by-side wordmark pair. Class: `.brand-comparison` with `display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 4vw, 56px); padding: clamp(40px, 5vw, 72px) 0; border-top: 1px solid var(--ink-faintest); border-bottom: 1px solid var(--ink-faintest)`. Each side has a mono `BEFORE — 2020` / `AFTER — 2020` label above the wordmark (positioned absolute or as a small label-sans header). Wordmark images contained, max-height 96–128px, centered. Static — no toggle, no hover transition that changes which mark is showing.
- **`.chapter__body .aiyu-archive`** (NEW) — within chapter 2, lower than the brand-comparison. A 4-up grid (degrades to 2-up at tablet, 1-up at phone) of retired Aiyu artifacts. Class: `.aiyu-archive` with `display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px`. Each tile is `aspect-ratio: 1/1` (or 4/3 if asset is more landscape), `background: var(--paper-warm); border: 1px solid var(--ink-faintest); padding: 0; overflow: hidden`. The retired artifact image inside uses `object-fit: contain; padding: 16px` to sit naturally inside the tile. Each tile carries a small mono `RETIRED · 2020` caption beneath, centered, 10px JetBrains Mono uppercase. The strip can be dropped at build time if the chapter feels overlong; the wordmark pair (`.brand-comparison`) carries the comparison alone if so.
- **`.chapter__body > figure`** (existing breakout, see styles.css line 3380) — figures inside chapter body (partner app, brand medley, website, internal tools) break out of the 62ch prose cap and use the full body-column width. Reuses the `--lead`, `--right`, `--hands` v2-fig variants from spaces; favo will likely use `--lead` for the partner-app image and `--hands` for the brand-medley image.
- **`.kpi-editorial`** (existing) — display-sans numerals + serif labels, hairline divided. Sits inside chapter 4. Four rows: 650% / 1.2M from 0 / NPS 63→86 / 13,000 community entrepreneurs.

# Do's and Don'ts

**Do.**

- Use the editorial three-role pairing (display sans / body serif / label sans) consistently per role, not per section. Add mono as a fourth role only for the brand-comparison `BEFORE/AFTER` markers and the Aiyu-archive `RETIRED` captions — both are timestamped archival, not narrative.
- Keep the hero h1 in serif (Source Serif 4, 400) to match portfolio continuity. Display-sans begins at chapter numerals.
- Show decision-walks inline ("we ran archetype workshops because the brand had to land in two cultures, not one") — peer-voiced, not tutorial-voiced. The Considered pillar.
- Keep the brand comparison as **A** (wordmark pair, static, side-by-side) — no toggle, no hover state that swaps marks, no animation on the wordmark exchange. The static contrast is the move.
- Keep the Aiyu archive small and quiet — 4 tiles maximum, paper-warm background, mono captions, sized down. The strip is evidence, not a feature.
- Thread timeline cues inline through chapters 2 and 3 (months 1–2, months 4–6, months 8–12) so the parallel-work-streams beat lands without bragging. The Restrictions ban polymath voice — the timeline is the proof.
- Close chapter 4 with the four-work-streams reflection in plain language: "Looking back, four work-streams: a rebrand, a partner app, a website, and a set of internal tools — built across roughly a year, mostly in parallel, mostly during the pandemic. The work was the work; the calendar carried it." Pandemic context as condition, not as flex.

**Don't.**

- Don't use display-sans for body prose (per `anti-slop.md` § Typography, "single font family throughout" tell — disqualifying on editorial).
- Don't switch the hero h1 to display-sans for cinematic effect. Portfolio continuity wins; favo stays in family.
- Don't add a before/after toggle, slider, or animated swap on the brand comparison. Static. The wordmark pair is a typography artifact, not an interaction.
- Don't add card frames around the hero, partner-app figure, or website figure (`anti-slop.md` § Visual + `styles/editorial.md` § Anti-patterns "Card-everywhere template"). Bare images only.
- Don't use the bee-hive metaphor as decorative chrome — no honeycomb pattern, no hexagonal grid, no yellow-on-paper accent treatment. The bee-hive is named once in chapter 2 as the origin of the name "Favo" (Portuguese for honeycomb), then the page moves on.
- Don't use mono "FIG · NN · LABEL" eyebrows above figures (banned in PRODUCT.md restrictions; the existing `.cap` class with the `.num` span goes unused on this page).
- Don't promote Considered into Pedagogical — the case study should not explain rail-and-body, it should USE it and let the reader infer.
- Don't add a three-equal-card "Brand / Product / Outcome" trio or any three-equal-card layout — explicit ban (per PRODUCT.md restrictions and `styles/editorial.md` § Marketing-page cargo cult).
- Don't quantify effort hours anywhere on the page. Months and overlap are the units. "60+ hour weeks" stays out, even though it's true.
- Don't use "we shipped" voice. Favo was an employer; the voice is "I" or "the team," not "we delivered."
- Don't change layout impulsively at Gate 10 — only re-check if image inventory has materially shifted (per `layouts.md` § Layout is iterative).
