# spaces.html — PRODUCT.md

A redesign of the Spaces Parking case study. The page sits in the editorial register and uses the hybrid layout (rail-and-body with a cinematic chapter pivot), with a deliberately varied image-shape rhythm grounded in the available mockup inventory.

## Users

Four personas, additive constraints. Justified per the soft-cap rule in `commands/plan.md` Gate 5 — each persona contributes a distinct, non-contradictory constraint to the design.

**Power User** — *peer designer, 8-minute scan.*
A senior designer at 9pm Tuesday, AirPods in, having read fifteen minutes of design-expert documentation earlier in the week. Opens spaces.html on a desktop with eight minutes of attention to decide whether the work backs up the discipline. Drives evidence-density, scanability, pull-quote weight, named decisions in the prose.

**Junior Designer** — *mentee, 15-minute learn.*
A designer two-to-four years in, came here from design-expert or from Khevin's recommendation, reading the case study as a reference for their own future work. Drives reasoning-visibility — explicit decision-walks ("we considered chapter-scroll for cinematic weight, picked rail-and-body because the eight-minute scanning constraint made the rail's orientation pay off"), patterns cited by name, trade-offs surfaced.

**First-Timer** — *hiring manager, 3-minute decide.*
A hiring manager arriving from a referral or LinkedIn link with no design-expert context. Three minutes to decide whether Khevin is worth a portfolio review. Drives above-the-fold strength, the takeaways pre-summary, verb-in-first-viewport, the case-study identity in the first scroll.

**Mobile** — *couch reader, one-handed.*
Phone, vertical, often interrupted. Drives the rail-collapse rules, the ultra-wide cinematic break degrading gracefully to vertical, the multi-shape grid stacking sanely, the touch targets at 44×44.

**Floor checks (mandatory but not design-driving):** Accessibility-Dependent and Stress Tester apply as rules — 44px targets, prefers-reduced-motion, no color-only encoding, graceful degradation when one or more mockups fail to load — but do not shape the page composition.

## Brand personality

Three pillars. Editorial · Evidenced · Considered.

**Editorial** — type and grid carry meaning, monochrome chrome, color confined to artwork, density inverts toward breathing. The page reads as a magazine piece, not a marketing landing.

**Evidenced** — every claim is named with a number, a specific stakeholder, or a trade-off. No marketing voice. No "Streamline / Elevate / Unleash." Decisions defended.

**Considered** — discipline is shown, not lectured. Decision-walks appear inline as a peer would discuss them, not as a tutorial would teach them. Patterns can be cited by name without explaining what the pattern is. The reader infers the thinking from the work; the work doesn't perform the thinking.

## Restrictions

What this page is NOT.

- No marketing voice — no "Streamline / Elevate / Unleash / Game-changer / Tapestry / Revolutionize" verbs
- No three-equal-cards layout — explicit ban (catalogued as "marketing-page cargo cult" in `styles/editorial.md`)
- No card vocabulary for editorial sections — hairlines, headings, whitespace do containment work
- No accent-colored section dividers — heavy ink bar at chapter breaks, hairlines elsewhere
- No emojis as UI
- No pure black backgrounds — off-black tinted toward warm if dark surfaces appear
- No purple/violet gradients (per `anti-slop.md` § Color tells, disqualifying on editorial)
- No mono "FIG · NN · LABEL" eyebrows above figures — captions are italic serif prose where they add information
- No display-sans for body — three type roles enforced (display sans for chapter heads, body serif for narrative, small sans for labels)

## Register

`register: editorial`

The page commits 8–15 minutes of attention contract. Inverted density vs. product. Color confined to artwork. See `styles/editorial.md` for the canonical discipline and the six editorial moves.

## Layout

`layout: hybrid (rail-and-body + cinematic pivot)`

Rail-and-body at the page level (3/9 split, small kicker labels in narrow rail, body+figures in wide column). One strategic cinematic break — the V2.0 reveal — uses the chapter-scroll pattern's full-bleed pinned-hero treatment, with an ultra-wide (21:9) image. Three numbered chapters; KPI-editorial block sits inside the closing chapter, not as a separate section.

## Image-rhythm strategy

Held loosely per `layouts.md` § Layout is iterative. Sourced from `projects/assets/spaces/mockups/` (the curated mockup folder; the wider `assets/` folder is a dump and not preferred).

| Section | Shape | Mockup pick |
|---|---|---|
| Hero key visual | 16:9 horizontal | `mock1.png` or `mock2 - horizontal.png` |
| Chapter 1 vertical-split | 3:4 vertical | `mock6 - vertical.png` |
| Chapter 2 square highlight | 1:1 square | `mock6 - square.png` or `notes.png` |
| Cinematic break (V2.0 reveal) | 21:9 ultra-wide | `mock5.png` (cropped/letterboxed if native is 16:9) |
| Chapter 3 multi-shape grid | mixed (1:1 + 2:3 + 16:9) | `mock3.png` (horizontal) + a square + the vertical, mixed |
| Evidence-of-inheritance (chapter 1 supplement) | small horizontals | `clutter1-customerdetails.png` + `clutter2-garagedetails.png` + `clutter3-webapp.png` (3-thumb strip, low-emphasis) |

**Vertical is the inventory constraint** — only `mock6 - vertical.png` exists. The chapter-1 vertical-split is the one place vertical lives in the layout. If a second vertical mockup gets added during build, the multi-shape grid in chapter 3 can absorb it; if the vertical gets removed, the chapter-1 split degrades to a horizontal-image full-width and the rail-and-body pattern absorbs the change without rebuild.

The Gate 10 layout-image fit re-check applies if shapes shift materially during build (see `layouts.md` § Layout is iterative).
