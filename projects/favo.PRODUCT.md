# favo.html — PRODUCT.md

A redesign of the Favo case study. The page sits in the editorial register and uses Lane 1 (product-forward, brand-as-context) — four chapters, rail-and-body, with the rebrand told as the second chapter and the partner app + website + internal tools threaded as one stitched arc through chapter three. Favo was in-house work between Khevin's freelance years and the KIS Solutions consulting era — the voice reflects that.

## Users

Four personas, additive constraints. Justified per the soft-cap rule in `commands/plan.md` Gate 5 — each persona contributes a distinct, non-contradictory constraint to the design.

**Power User** — *peer designer, 8-minute scan.*
A senior designer at 9pm Tuesday, AirPods in, having read fifteen minutes of design-expert documentation earlier in the week. Opens favo.html on a desktop with eight minutes of attention to decide whether the work backs up the discipline. Drives evidence-density, scanability, pull-quote weight, named decisions in the prose, the timeline cues that prove the parallel work-streams happened on a real calendar.

**Junior Designer** — *mentee, 15-minute learn.*
A designer two-to-four years in, came here from design-expert or from Khevin's recommendation, reading the case study as a reference for their own future work. Drives reasoning-visibility — explicit decision-walks ("we ran archetype workshops because the brand had to land in two cultures, not one"), patterns cited by name, the brand-convergence process surfaced as method, not as deliverable.

**First-Timer** — *hiring manager, 3-minute decide.*
A hiring manager arriving from a referral or LinkedIn link with no design-expert context. Three minutes to decide whether Khevin is worth a portfolio review. Drives above-the-fold strength, the takeaways pre-summary, verb-in-first-viewport, the case-study identity in the first scroll.

**Mobile** — *couch reader, one-handed.*
Phone, vertical, often interrupted. Drives the rail-collapse rules, the wordmark pair stacking gracefully, the Aiyu archive strip degrading from a 4-up grid to a 2-up grid to a single stack, touch targets at 44×44.

**Floor checks (mandatory but not design-driving):** Accessibility-Dependent and Stress Tester apply as rules — 44px targets, prefers-reduced-motion, no color-only encoding, graceful degradation when one or more mockups fail to load — but do not shape the page composition.

## Brand personality

Three pillars. Editorial · Evidenced · Considered. *(Inherited from the spaces / amway series — the case studies are of-a-piece. Favo's per-page particularity is encoded in Restrictions and Layout, not in the pillars.)*

**Editorial** — type and grid carry meaning, monochrome chrome, color confined to artwork (the brand identity images carry their own color naturally; the page chrome stays paper-on-ink). The page reads as a magazine piece, not a marketing landing.

**Evidenced** — every claim is named with a number, a specific stakeholder, or a trade-off. Workshop counts, archetype names, the convergence moment, the timeline cues, the markets, the customer figures. No marketing voice.

**Considered** — discipline is shown, not lectured. The four work-streams are named at the close, threaded with timeline cues throughout, but never performed as polymath theatre. The reader infers the breadth from the artifacts and the calendar; the page doesn't perform the breadth.

## Restrictions

What this page is NOT.

- No marketing voice — no "Streamline / Elevate / Unleash / Game-changer / Tapestry / Revolutionize" verbs
- No "we shipped" voice for in-house work — Favo was an employer, not a client; the voice is "I" or "the team," not "we delivered"
- No quantification of effort hours — *months* and *overlap* are the units; "60+ hour weeks" or "I worked X hours" do not ship even though they were true
- No polymath framing — "I did everything" or "I'm a unicorn" voice is banned; the page names the four work-streams (rebrand, partner app, website, internal tools) at the close as a *factual reflection*, with the pandemic context as the *condition* of the work, not as a flex
- No before/after toggle for the brand comparison — wordmark pair is **static, side-by-side, A**; the visual contrast does the work without performing it
- No bee-hive visual metaphor as a marketing motif — the bee-hive is mentioned once as the *origin* of the name "Favo" (Portuguese for honeycomb), then the page moves on; no honeycomb pattern as decorative chrome
- No three-equal-cards layout — explicit ban (catalogued as "marketing-page cargo cult" in `styles/editorial.md`)
- No card vocabulary for editorial sections — hairlines, headings, whitespace do containment work
- No accent-colored section dividers — heavy ink bar at chapter breaks, hairlines elsewhere
- No emojis as UI
- No pure black backgrounds — off-black tinted toward warm if dark surfaces appear
- No purple/violet gradients (per `anti-slop.md` § Color tells, disqualifying on editorial)
- No display-sans for body — three type roles enforced (display sans for chapter heads, body serif for narrative, small sans for labels)

## Register

`register: editorial`

The page commits 8–15 minutes of attention contract. Inverted density vs. product. Color confined to artwork. See `styles/editorial.md` for the canonical discipline and the six editorial moves.

## Layout

`layout: rail-and-body, four chapters, brand-comparison A+D inside chapter 2`

Rail-and-body at the page level (3/9 split, small kicker labels in narrow rail, body+figures in wide column). Four numbered chapters; KPI-editorial block sits inside the closing chapter, not as a separate section. Brand-comparison treatment is **A + D** — wordmark pair static side-by-side as the headline rebrand moment in chapter 2, with a small Aiyu archive evidence strip lower in chapter 2 (3–4 retired Aiyu artifacts in a hairline-bordered grid, mono `RETIRED · 2020` captions). The Aiyu strip can be dropped at build time if it reads weird.

**Chapter outline:**
- **Chapter 1 — *Background.*** *"A door-to-door sales model rebuilt for WhatsApp."* Operator scene, 700k orders shipped in the first year, the model the company already was. Sets the stage. Small contextual figure if available.
- **Chapter 2 — *The rebrand.*** *"From Aiyu, to Favo."* Workshops, archetypes, brand attributes, concept tests, team convergence. Wordmark pair (A) at the climax. Aiyu archive strip (D) below, a quiet evidence cluster of what was retired. Brand-comparison done.
- **Chapter 3 — *The product, in parallel.*** *"The partner app, the website, and the internal tools — built alongside the rebrand."* Partner app primary image (the surface a local entrepreneur opens forty times a day). Website + internal tools mentioned with their timeline cues (months 4–6, months 8–12). The chapter is one stitched arc, not three separate sub-chapters.
- **Chapter 4 — *Where it landed.*** Outcome. KPI-editorial block (650% growth / 1.2M customers from 0 / NPS 63→86 / 13,000 community entrepreneurs / two new markets). Closing reflection naming the four work-streams together, with pandemic context as the condition, not as a complaint or flex.

## Image-rhythm strategy

Held loosely per `layouts.md` § Layout is iterative. Sourced from `projects/assets/favo/mockups/` (priority folder; the wider `assets/favo/` folder has more material and is fallback).

| Section | Shape | Mockup pick |
|---|---|---|
| Hero key visual | 16:9 horizontal | `favo_three_iphones_real_transparent_tight.png` or `hero.png` |
| Chapter 1 (Background) — small contextual figure | small horizontal | a single Aiyu screenshot (`assets/favo/aiyu-dashboard.png` or `assets/favo/aiyu-examples.png`) at low emphasis |
| Chapter 2 (Rebrand) — wordmark pair (A) | inline diptych | `assets/favo/aiyu-logo.png` + `assets/favo/favo-logo.png` side-by-side |
| Chapter 2 (Rebrand) — Aiyu archive strip (D) | 4-up small grid | `assets/favo/aiyu-brand.png`, `aiyu-brand2.png`, `aiyu-dashboard.png`, `ativacao-aiyu.png` (or whichever combo reads cleanest) |
| Chapter 2 (Rebrand) — brand system | wide horizontal | `mockups/favo-brand.png` or `assets/favo/favo-medley.png` |
| Chapter 3 (Product) — partner app | 16:9 or square | `mockups/favo_three_iphones_real_transparent_tight.png` or `assets/favo/favo-phones.png` |
| Chapter 3 (Product) — website + tools | secondary horizontal | `assets/favo/favo-site-bundle.png` and/or `assets/favo/favo-tablet.png` |
| Chapter 4 (Outcome) — closing | KPI block, no image | KPI-editorial 4-row block; optional small montage at the very end |

The Gate 10 layout-image fit re-check applies if shapes shift materially during build (see `layouts.md` § Layout is iterative).

## Voice cues

Inline timeline cues to thread the parallel-work-streams beat without bragging. Examples (final language is a build-time decision, not locked here):

- Chapter 2 opens with: *"The rebrand started in the first month and converged by the second."*
- Chapter 3 opens with: *"The partner app ran the entire engagement; the website joined in month four; the internal tools came in month eight."*
- Chapter 4 closes with: *"Looking back: a rebrand, a partner app, a website, and a set of internal tools — built across roughly a year, mostly in parallel, mostly during the pandemic. The work was the work; the calendar carried it."*

Cocky framing, polymath language, and effort-quantification are banned per Restrictions.
