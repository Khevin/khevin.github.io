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
  type-mono:    "JetBrains Mono, monospace" # weight 500, uppercase letterspaced

  # Per-section type scale (matches spaces.DESIGN.md / favo.DESIGN.md tokens).
  hero-h1:        "clamp(56px, 8vw, 88px)"   # serif 400, italic ems
  chapter-num:    "clamp(64px, 7vw, 96px)"   # display sans 700, in rail
  chapter-h2:     "clamp(28px, 3.5vw, 40px)" # display sans 600 with serif italic ems
  body-prose:     "18px / 1.55"              # serif 400, max-w 62ch
  pull-quote:     "clamp(22px, 2.4vw, 30px)" # serif italic, ink left-rule
  kpi-numeral:    "clamp(56px, 8vw, 104px)"  # display sans 700, tabular-nums
  rail-kicker:    "12px / 0.14em tracking"   # label sans 500, uppercase (hidden via CSS)
  caption:        "15.5px italic"            # serif italic, ink-soft

  # Status-table-specific type
  status-pill:     "12px / 0.02em"           # sans 500, sentence-case
  status-table-mono: "11px / 0.06em tracking" # mono 500, uppercase

  # Spacing — editorial register, generous
  chapter-padding-vertical: "clamp(64px, 8vw, 112px)"
  chapter-bar-thickness: "4px solid var(--ink)"  # heavy chapter break
  hairline: "1px solid var(--ink-faintest)"      # sub-section break

  # Image-shape constraints
  hero-aspect:        "1/1 (isometric)"
  recommendations-aspect: "16/9 to 4/3"  # wide horizontal lead figure
  compliance-aspect:  "1/1 square"       # chapter 2 square-highlight
  carousel-card-aspect: "varies per card" # mixed, normalised by --card-w
  tablet-aspect:      "16/10"            # closing chapter 4 figure

  # Status-icon palette — Carbon Design System semantics
  status-active:    "#24a148 (green)"
  status-testing:   "#0f62fe (blue)"
  status-paused:    "#f1c21b (amber)"
  status-failed:    "#da1e28 (red)"
  status-archived:  "var(--ink-soft)"

  # Motion — editorial gets 240–360ms with deceleration ease;
  # carousel transitions get 500ms with anticipate-ease for tactile feel
  motion-duration: 240ms
  motion-easing:   "cubic-bezier(0.16, 1, 0.3, 1)"
  carousel-duration: 500ms
  carousel-easing:   "cubic-bezier(0.32, 0.72, 0, 1)"
---

# Overview

amway.html sits inside the existing portfolio's design system, inheriting all chrome tokens (ink, paper, rule, accent) from `styles.css`. The case-study chrome at `body[data-project]` already overrides `--accent` to `--ink` for editorial register; amway.html doesn't introduce new tokens, only new compositions of existing ones.

The page commits to four chapters in the rail-and-body layout: *Three months to first market* (the APR launch), *The first product earned us five more* (the system decision that scaled to six tools), *Data-heavy by design* (the 40+ recommendation-models reality), *Six tools shipped, metrics held* (the closing outcome chapter with the suite-carousel and the metrics block). Display sans for chapter numerals (Inter Tight 700) and chapter titles (Inter Tight 600 with serif italic ems for emphasis); body prose stays in Source Serif 4. Small label sans (Inter Tight 500, uppercase, 12px) carries kickers (which are CSS-hidden) and figure tags. Mono (JetBrains Mono) appears in three places: the status-table headers, the status-pill labels in chapter 3, and the carousel counter. The discipline is the editorial three-role pairing from `typography.md` § Type for case studies and long-form, with mono as a fourth role for data-fact registers.

The page-level title (the hero `h1`) stays in serif to match the rest of the portfolio. Continuity with `index.html`, `process.html`, `spaces.html`, `favo.html`. Display-sans begins at chapter numerals (`01.`, `02.`, `03.`, `04.`).

The signature compositions for amway are two: the Carbon-inspired **status table** in chapter 3 (with status icons, filter affordances, sort glyphs, and a checkbox column — production-fidelity data-table register inside an editorial page) and the **suite-carousel** in chapter 4 (a card-stack with peek-effect, click-to-front, arrow controls in the rail position, equalised card areas via `--card-w` per-card variable). Both components live as `body[data-project="amway"]`-scoped classes.

# Colors

Inherited from portfolio. No new global color tokens. Editorial register confines color to the artwork itself; the page chrome reads in ink, paper, and mid-grey only. Italic ems, pull-quote rules, KPI numerals all tint to `var(--case-accent)` which resolves to `var(--ink)` for `body[data-project]`.

The exception — and the one place the chrome carries semantic color — is the status-table in chapter 3. The status icons use Carbon Design System's standard palette (green for Active, blue for Testing, amber for Paused, red for Failed, ink-soft for Archived). This is a justified break from "color confined to artwork" because the icons live inside a data-table register, not narrative prose; their job is semantic, not decorative. The icon body uses fill: currentColor so the same SVG renders in the right hue per pill variant.

The suite-carousel cards have progressive beige tints behind the front card — paper-warm at pos=1, then darker beige steps via hand-picked hex values (#E8DEC6, #DAC9A8, #CAB58A, #B79F6D, #A28851) that hold the warm yellow hue without shifting toward red. The earlier oklch-mix-with-black approach drove chroma toward zero and produced muddy red-brown results.

# Typography

Four roles for amway.

**Display sans (Inter Tight 600–700):** chapter numerals at 64–96px, chapter headers at 28–40px. The display voice carries structure and the sense that this is a piece of work, not a piece of marketing. Chapter h2 may carry serif italic ems for emphasis (matching v1's pattern: `<em>` inside the h2 renders in Source Serif 4 italic).

**Body serif (Source Serif 4, 400 + italic 400):** narrative prose at 18px/1.55, max-width 62ch, ink-2 color. Italic ems on load-bearing words. Italic pull quotes at 22–30px (chapter 2: *"A design system isn't a Figma library. It's a contract between teams who don't talk every day."*) with no left-rule on amway (pull-quote rule-bar dropped per the discipline used across the editorial series). Hero h1 also lives in this voice (400 weight, italic ems for the active verb), per portfolio continuity.

**Label sans (Inter Tight 500, uppercase, 12–14px, letter-spacing 0.14em):** rail kickers (CSS-hidden), figure tags, KPI labels. Mid-grey (ink-soft) by default; never accent-colored.

**Mono (JetBrains Mono 500, uppercase, 10–11px, letter-spacing 0.06–0.18em):** status-table headers, status-pill labels in chapter 3, the carousel counter ("1 / 6"), and the filter-info bar above the status table ("3 active filters · 7 of 47 models"). The data-fact register — these are timestamped/quantified data, not narrative.

# Elevation

Whisper-quiet for the page chrome. Hairlines (1px ink-faintest) separate sub-sections inside chapters. A heavy ink bar (4px solid ink) marks each chapter break. The chapter kicker labels below the numerals are CSS-hidden — the chapter h2 in the body column carries the narrative, the rail carries only the numeral.

The two signature components carry their own depth strategies:

- **Status-table** (chapter 3) — flat, no card frames. Hairline borders define the table itself, status pills have transparent backgrounds (the icon carries the semantic color, the label reads in ink). The earlier rounded-corners + white-fill version was stripped in favour of the flat editorial register.
- **Suite-carousel** (chapter 4) — cards are stacked in the same grid cell with progressive translate + scale + rotate transforms. The front card has full opacity and no overlay; cards behind have overlays in progressively darker beige tints. Subtle box-shadow on the active card gives just enough lift to distinguish from the page; the back cards have no shadow.

Images are bare (no `paper-frame` mounting) per `styles/editorial.md` discipline.

# Components

Reused from existing portfolio CSS where possible; new compositions documented inline.

- **`.case-hero.case-hero--wide` + `.fact-ribbon`** (existing) — page hero and fact ribbon, 5-cell row count: Role · Team · Industry · Region · Duration.
- **`.case-key__fig`** (existing, bare) — hero key visual, the isometric `isometric.png`.
- **`.takeaways` + `.takeaways__list`** (existing) — three-takeaways pre-summary, naming the APR / system / metrics at the highest level.
- **`.chapter` rail-and-body** (existing) — 280px rail + body column, four chapters; `.chapter__kicker` hidden via CSS.
- **`.chapter__body .v2-fig`** (existing) — figures break out of the 62ch prose cap and use the full body-column width. Uses `--lead` for chapter 1's `recommendations.png`.
- **`.chapter__body .square-highlight`** (existing, shared with spaces) — within chapter 2, a 320px square image + content split, sitting in a `paper-warm` block. Reuses the spaces pattern for the Compliance Reviewer callout.
- **`.chapter__body .product-list`** (existing, amway-specific) — within chapter 2, a hairline-divided list of the six tools with `<strong>` lead-words.
- **`.chapter__body .amway-status-table`** (NEW, amway-specific) — within chapter 3, a Carbon-inspired data table with filter info bar, sort/filter affordances on column headers, status pills with semantic-color icons. Class: `.amway-status-table` with internal `.status-table-label`, `.status-table-filters`, `.status-pill`, `.status-icon`, `.header-glyph` sub-components. Scoped to `body[data-project="amway"]`.
- **`.chapter__body .suite-carousel`** (NEW, amway-specific) — within chapter 4, a card-stack carousel with peek effect, click-to-front, prev/next arrows projected into the rail column at top, counter with mono "1 / 6" indicator. Class: `.suite-carousel` with internal `.carousel-stack`, `.carousel-card[data-pos="N"]`, `.carousel-content`, `.carousel-controls`. Card areas equalised via `--card-w` CSS variable (set inline per card from a sqrt-of-aspect-ratio formula). Scoped to `body[data-project="amway"]`.
- **`.kpi-editorial`** (existing) — display-sans numerals + serif labels, hairline divided. Sits inside chapter 4. Four rows: 36% / 24% / $M+ / days → 1h.

# Do's and Don'ts

**Do.**

- Use the editorial three-role pairing (display sans / body serif / label sans) consistently per role, not per section. Add mono as a fourth role for data-fact registers (status-table headers + cells, carousel counter).
- Keep the hero h1 in serif (Source Serif 4, 400) to match portfolio continuity. Display-sans begins at chapter numerals.
- Show decision-walks inline ("we picked the slower path because…", "we made the call to build a custom PIM and WMS rather than license off-the-shelf") — peer-voiced, not tutorial-voiced. The Considered pillar.
- Carbon Design System status icons are the canonical reference for any data-table semantic color (Active green, Testing blue, Paused amber, Failed red, Archived gray). Use them adapted, never blind-copied with their default Carbon greys around them.
- Card-area equalisation in the suite-carousel uses sqrt(aspect-ratio) on `--card-w` — not equal absolute pixel sizes, which would distort smaller-aspect cards.

**Don't.**

- Don't use display-sans for body prose (per `anti-slop.md` § Typography, "single font family throughout" tell — disqualifying on editorial).
- Don't switch the hero h1 to display-sans for cinematic effect. Portfolio continuity wins; amway stays in family.
- Don't add card frames around the hero, isometric figure, or carousel cards beyond what the carousel pattern itself provides (`anti-slop.md` § Visual + `styles/editorial.md` § Anti-patterns "Card-everywhere template").
- Don't show the chapter kicker labels — chapter h2 in the body carries the narrative, the rail carries only the numeral. CSS-hidden per series convention.
- Don't add pie or donut charts. Bar shapes, status pills, KPI numerals, and the prose paragraph above the KPI block carry the metrics. Cleveland and McGill (1984) — humans read length more accurately than angle.
- Don't promote Considered into Pedagogical — the case study should not explain rail-and-body, it should USE it and let the reader infer.
- Don't add a three-equal-card "Discovery / Build / Ship" trio anywhere — explicit ban (per PRODUCT.md restrictions and `styles/editorial.md` § Marketing-page cargo cult).
- Don't fork the system per chapter — the four chapters share the same component register; new compositions appear only when the work being shown demands one (the suite-carousel and the status-table, both justified by the surface they're representing).
- Don't change layout impulsively at Gate 10 — only re-check if image inventory has materially shifted (per `layouts.md` § Layout is iterative).
