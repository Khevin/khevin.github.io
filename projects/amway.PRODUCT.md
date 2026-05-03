# amway.html — PRODUCT.md

A forensic brief documenting the Amway case study as it was built. The page sits in the editorial register and uses the rail-and-body layout with four chapters, threading a single product launch (the APR) into a suite-of-six narrative and closing on a four-row metrics block. Backfilled in line with the per-surface naming convention introduced for `spaces.html` and `favo.html`; the page itself shipped before this brief was written and is the source of truth.

## Users

Four personas, additive constraints. Justified per the soft-cap rule in `commands/plan.md` Gate 5 — each persona contributes a distinct, non-contradictory constraint to the design.

**Power User** — *peer designer, 8-minute scan.*
A senior designer at 9pm Tuesday, AirPods in, having read fifteen minutes of design-expert documentation earlier in the week. Opens amway.html on a desktop with eight minutes of attention to decide whether the work backs up the discipline. Drives evidence-density, scanability, the named decisions inside the prose, the Carbon-style status table that proves the surfaces shipped at production fidelity.

**Junior Designer** — *mentee, 15-minute learn.*
A designer two-to-four years in, came here from design-expert or from Khevin's recommendation, reading the case study as a reference for their own future work. Drives reasoning-visibility — the "we picked the slower path" decision-walks, the named alternatives (off-the-shelf vs. custom build), the explicit trades surfaced inline rather than as marketing claims.

**First-Timer** — *hiring manager, 3-minute decide.*
A hiring manager arriving from a referral or LinkedIn link with no design-expert context. Three minutes to decide whether Khevin is worth a portfolio review. Drives above-the-fold strength, the takeaways pre-summary that names the APR shipping, the design system, and the metrics, the case-study identity in the first scroll.

**Mobile** — *couch reader, one-handed.*
Phone, vertical, often interrupted. Drives the rail-collapse rules, the suite-carousel degrading to a stacked vertical sequence, the status-table going horizontally scrollable rather than reflowing, the multi-shape grid stacking to single-column.

**Floor checks (mandatory but not design-driving):** Accessibility-Dependent and Stress Tester apply as rules — 44px targets, prefers-reduced-motion, no color-only encoding, graceful degradation when one or more mockups fail to load — but do not shape the page composition.

## Brand personality

Three pillars. Editorial · Evidenced · Considered. *(Inherited from the spaces / favo series — the case studies are of-a-piece.)*

**Editorial** — type and grid carry meaning, monochrome chrome, color confined to artwork (the Carbon-style status icons in chapter 3 carry their semantic colors; the page chrome stays paper-on-ink). The page reads as a magazine piece, not a marketing landing.

**Evidenced** — every claim is named with a number, a specific stakeholder, or a trade-off. APR shipping in three months. Forty-plus recommendation models. 24% of platform sales. Three months to first market. Days to under an hour for compliance review. No marketing voice.

**Considered** — discipline is shown, not lectured. The "we picked the slower path" decision around building the system instead of forking each product is named inline. The reader infers the thinking from the work; the page doesn't perform the thinking.

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
- No pie or donut charts — bar charts and the kpi-editorial numerals carry the metrics

## Register

`register: editorial`

The page commits 8–15 minutes of attention contract. Inverted density vs. product. Color confined to artwork (the Carbon-style status icons being the rare case where chrome carries semantic color, justified by the data-table register the icons live inside). See `styles/editorial.md` for the canonical discipline and the six editorial moves.

## Layout

`layout: rail-and-body, four chapters, suite-carousel inside chapter 4, status-table inside chapter 3`

Rail-and-body at the page level (3/9 split, small kicker labels in narrow rail — kicker hidden via CSS in line with the spaces/favo discipline, body+figures in wide column). Four numbered chapters; KPI-editorial block sits inside the closing chapter, not as a separate section.

**Chapter outline:**
- **Chapter 1 — *Three months to first market.*** *"Useful, usable, and three months to first market."* The APR's launch. Single-product narrative. Lead figure of the recommendations surface.
- **Chapter 2 — *The first product earned us five more.*** *"The first product earned us five more."* The system decision. Builds the contract that would scale to six tools. Pull-quote about the design system as a contract between teams. Square-highlight callout for the Compliance Reviewer (the fastest-shipping of the six). Product list naming all six tools.
- **Chapter 3 — *Data-heavy by design.*** *"Data-heavy by design — not by accident."* The 40+ recommendation-models reality. Carbon-inspired status table with filter affordances and status icons (Active / Testing / Paused / Failed / Archived). Names the data-density problem the surfaces had to solve.
- **Chapter 4 — *Six tools shipped, metrics held.*** *"Six tools shipped. The metrics held across the suite."* Outcome chapter. Suite-carousel (card-stack, click-to-front, peek effect) showing the five complementary tools that joined APR. KPI-editorial closing block with four rows: 36% click-through, 24% of items sold, $M+ in annual savings, days → 1 hour for compliance review.

## Image-rhythm strategy

Held loosely per `layouts.md` § Layout is iterative. Sourced from `projects/assets/amway/` (the mockups subfolder was flattened post-shipment as part of repo cleanup; assets now live at the project's top level).

| Section | Shape | Mockup pick |
|---|---|---|
| Hero key visual | square-ish isometric | `isometric.png` |
| Chapter 1 (APR) — lead figure | wide horizontal | `recommendations.png` |
| Chapter 2 (System) — square highlight | 1:1 square | `compliance.png` |
| Chapter 3 (Data-heavy) — embedded | inline status-table component (no figure) | rendered as `.amway-status-table` HTML |
| Chapter 4 (Suite) — card-stack carousel | mixed aspects (card-per-tool) | `moreprojects-1..6` PNGs |
| Chapter 4 (Closing tablet) | wide horizontal | `tablet.png` |

## Voice cues

Voice is "we" / "the team" — Amway was a client engagement at KIS Solutions, not in-house work. Khevin's role was Design Lead & Manager with two direct reports across the engagement. The page reflects that — the "we" includes the design team, the engineering team, and the client where appropriate.

Inline decision-walks to thread the discipline:

- Chapter 2's pull-quote: *"A design system isn't a Figma library. It's a contract between teams who don't talk every day."*
- The "slower path" decision is named twice — once as the system decision in chapter 2, once as the build-vs-license decision in chapter 4 (the off-the-shelf alternative explicitly considered, the trade explicitly named, the outcome explicitly tied to year-end ROI).

Marketing framing, polymath language, and effort-quantification are banned per Restrictions.
