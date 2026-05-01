---
name: Khevin Mituti — Portfolio
namespace: khevin-mituti/portfolio
register: brand
lane: kinetic editorial
inherits-from: ../design-expert-landing/styles.css

color:
  ink:           "#1a1815"
  ink-soft:      "#423e38"
  ink-mute:      "#6b655c"
  ink-faint:     "#a8a195"
  rule:          "#d6cfc1"
  rule-soft:     "#e8e2d4"
  paper:         "#f5f1ea"
  paper-warm:    "#efe9dc"
  paper-deep:    "#e8e1d0"
  accent:        "oklch(72% 0.15 55)"        # warm amber-orange (shared with design-expert)
  accent-deep:   "oklch(56% 0.13 55)"
  accent-mute:   "oklch(82% 0.07 55)"
  signal:        "oklch(48% 0.10 145)"        # moss, used once per page max
  mark:          "oklch(94% 0.13 95)"         # parchment-warm yellow, highlighter only
  favo:          "oklch(64% 0.24 350)"        # magenta — Favo case study flood
  favo-deep:     "oklch(48% 0.21 350)"
  spaces:        "oklch(86% 0.17 95)"         # warm sun yellow — Spaces case study flood
  spaces-deep:   "oklch(72% 0.16 88)"
  amway:         "oklch(72% 0.13 295)"        # lavender — Amway case study flood
  amway-deep:    "oklch(56% 0.12 295)"

type:
  serif:    "Source Serif 4, GT Sectra, Iowan Old Style, Georgia, serif"
  sans:     "Inter Tight, Söhne, Helvetica Neue, system-ui, sans-serif"
  mono:     "JetBrains Mono, Berkeley Mono, ui-monospace, monospace"
  display:  { family: serif, size: "clamp(64px, 9vw, 144px)", weight: 400, line: 0.96, letter: "-0.024em" }
  h2:       { family: serif, size: "clamp(40px, 5.4vw, 76px)",  weight: 400, line: 1.02, letter: "-0.018em" }
  h3:       { family: serif, size: "clamp(26px, 2.6vw, 38px)",  weight: 400, line: 1.10, letter: "-0.012em" }
  lede:     { family: serif, size: "clamp(22px, 2.2vw, 30px)",  weight: 400, line: 1.32, letter: "0",       style: italic }
  body-lg:  { family: sans,  size: "18px",                       weight: 400, line: 1.55, letter: "0" }
  body:     { family: sans,  size: "16px",                       weight: 400, line: 1.55, letter: "0" }
  small:    { family: sans,  size: "14px",                       weight: 400, line: 1.50, letter: "0" }
  eyebrow:  { family: mono,  size: "11px",                       weight: 500, line: 1.40, letter: "0.14em", case: upper }
  idx:      { family: mono,  size: "11px",                       weight: 500, line: 1.20, letter: "0.08em" }

space:
  4:   "4px"
  8:   "8px"
  12:  "12px"
  16:  "16px"
  24:  "24px"
  32:  "32px"
  48:  "48px"
  64:  "64px"
  96:  "96px"
  128: "128px"
  base: 4

radius:
  none: "0"
  sm:   "2px"
  md:   "4px"
  lg:   "8px"
  pill: "999px"
  note: "Editorial register limits radius. No radius is the default; sm/md only when the component is a pill or chip."

elevation:
  canvas:      "var(--paper)"
  surface-100: "color-mix(in oklch, var(--paper) 93%, var(--ink) 7%)"
  surface-200: "color-mix(in oklch, var(--paper) 91%, var(--ink) 9%)"
  surface-300: "color-mix(in oklch, var(--paper) 88%, var(--ink) 12%)"
  shadow-soft: "0 1px 0 0 var(--rule)"
  shadow-deep: "0 8px 32px -16px color-mix(in oklch, var(--ink) 16%, transparent)"
  strategy:    "borders-only with one earned shadow"

motion:
  fast:        "120ms"
  base:        "240ms"
  slow:        "440ms"
  scroll:      "640ms"
  ease-out:    "cubic-bezier(0.16, 1, 0.3, 1)"
  ease-in-out: "cubic-bezier(0.65, 0, 0.35, 1)"
  budget:      "every animation must communicate state. prefers-reduced-motion disables all non-essential motion."

layout:
  max:    "1400px"
  gutter: "clamp(20px, 4vw, 56px)"
  cols:   12
  baseline: "8px"
---

# DESIGN.md

> The visual file. Tokens above; reasoning below. Read on every `/design-expert:build` against this surface, and cited on every `/design-expert:review`. Token names belong to *this product's world* — `--ink`, `--paper`, `--rule`, `--mark` — not generic placeholders.

---

## 1 · Overview

Khevin's portfolio is the editorial sibling of `khev-tools/design-expert`. The two surfaces share a font stack, a token base, and a hand. They differ in pace: design-expert is a manifesto with a build CTA at the end, dense and decisive; the portfolio is a long-form essay with a body of work attached, slower and more deliberate. Same brand register, different rhythm.

The visual lane is **kinetic editorial**. Static palette, ink everywhere, but interaction-heavy in a way that earns its weight: hover reveals project metadata, scroll locks section numbers into the eyebrow, the cursor picks up a mark when it crosses a case-study link. Motion is identity, not decoration — every kinetic moment communicates state, hierarchy, or progress, and all of it has a static fallback for `prefers-reduced-motion`. This is the discipline that separates the lane from "animated portfolio." The reader who turns motion off must be able to use the page just as well as the reader who leaves it on.

The page is one tone, considered, not two flipped — no light/dark toggle. The base palette is parchment + ink, the same as design-expert, because two sibling surfaces should not arrive at the reader's eye as two separate brands. The case-study hero banners are where the portfolio departs visually: each project (Favo, Spaces Parking, Amway) introduces its brand color as a hero flood that lasts exactly as long as the masthead, then returns to ink for the body. The flood is a memory aid (each project has its own temperature) and a registration of the actual brand each project shipped, never a costume.

---

## 2 · Colors

The base palette inherits from `khev-tools/design-expert` without modification. `--ink` is the primary text and primary surface dark. `--paper` is the canvas. `--rule` is every hairline. `--accent` (warm amber-orange in OKLCH) is reserved for the same moments it serves on design-expert: italics in display headlines, the slash in the brand block, one or two earned highlights per page. **Adding a new accent for the portfolio would be the wrong call** — siblings share their primary palette, and the per-project floods give the portfolio its own visual personality without a base-palette change.

Three new color tokens enter for case studies only. `--favo` is magenta, `--spaces` is sun yellow, `--amway` is lavender. Each carries a `-deep` variant for the rare moments where the flood needs a second layer (a chip on a screenshot, a typographic underline). These tokens live in the YAML so they can be requested by any case study but they are **never** used outside a case-study page. The homepage stays parchment + ink + accent. The process and notes pages stay parchment + ink + accent. Only the three project pages flood.

`--mark` is a parchment-warm yellow used as a highlighter, and only as a highlighter — applied as a CSS `background-image` linear-gradient to a span of body text on hover or focus to call attention to a phrase. It must never appear as a fill on a card, a button, or a section background.

`--signal` (moss green) is in the YAML but used **once per page maximum** — typically reserved for an "outcome" check or a positive metric callout in a case study. The discipline is that `--signal` only appears when the design needs to signal "good outcome" without saying it; using it twice on the same page erodes its meaning.

Color contrast: every ink-on-paper combination clears WCAG AA at body size and AAA at display size. Accent and mark are decorative, never load-bearing for legibility — body copy is always `--ink-soft` or `--ink` on `--paper`, never `--accent` on `--paper`.

---

## 3 · Typography

Three families. Source Serif 4 for display and editorial body; Inter Tight for UI body and metadata; JetBrains Mono for eyebrows, indices, and the namespace block in the nav. The serif carries the editorial register; the sans carries the product-shaped moments (case study metadata, button labels, the responsibilities grid); the mono carries the system labels that announce structure (`01 — About`, `S · 01`, `khev-tools / design-expert`).

The display face is set in `clamp(64px, 9vw, 144px)` — slightly larger than design-expert's display because the portfolio has fewer competing typographic moments per page. The display is set with `letter-spacing: -0.024em` and `line-height: 0.96`, balanced with `text-wrap: balance` so the headline never breaks into widows on narrow viewports.

Italics in the display use `--accent` — the same rule as design-expert, with the same restraint: italicize one phrase per headline, never two. The italic-as-accent pattern is part of the shared hand between the two surfaces; abandoning it would visually divorce them.

The lede class (an italic Source Serif at `clamp(22px, 2.2vw, 30px)`) appears at most twice per page: once in the homepage hero ("Throughout my 15-year design career…"), and once in each case study below the metadata block. Italic body in long-form prose is reserved for *book titles, proper names of foreign concepts, and earned emphasis* — never for "voice." The voice is in the sentence rhythm, not in the tilt of the type.

Body copy is Inter Tight at 16/18px, line-height 1.55, max-width 60ch. The 60ch cap is non-negotiable — any line wider than 75ch breaks reading, and the editorial register insists on the discipline. Captions, eyebrows, and indices live in JetBrains Mono — fixed width, narrow letter-spacing increments, never larger than 13px. The mono is the structural voice; raising its size breaks the hierarchy.

A note on font pairings as anti-slop: this stack is the same one used by Stripe Press, Cabinet magazine, and Studio Apparatus. It is *not* the same one the model defaults to (Inter + Inter, or Geist + Geist). The pairing is a small statement about taste; protecting it is part of the brand.

---

## 4 · Elevation

The strategy is **borders-only with one earned shadow**. The portfolio's depth is built from hairlines (`1px solid var(--rule)`) and surface tints (`surface-100`/`-200`/`-300`), never from drop shadows. Three `surface` tokens map to canvas, +7%, +9%, +12% mixes of ink into paper — same percentages as `craft.md` recommends. Anything deeper than `surface-300` becomes a tint that reads as "section background," and at that point the page would benefit from a structural break instead of a deeper surface.

The "one earned shadow" is `--shadow-deep`, applied exclusively to the **case-study hero banner** as it transitions out of the masthead flood into the editorial body. It is a single soft shadow at `0 8px 32px -16px` ink-mixed, and it appears once per case study. No card, no button, no nav, no dropdown gets a shadow. The shadow's job is to mark the visual seam between the project's color world and the editorial world below it.

Hairlines are everywhere: between sections, under the nav, around case-study metadata blocks, in the responsibilities grid. The portfolio has no rounded cards on parchment — that pattern reads as "SaaS dashboard," which is the wrong register for a designer's portfolio. Where a card-shape is needed (mini case studies, responsibility tiles), the card is bordered (`1px solid var(--rule-soft)`) on a tinted surface, with no radius greater than 2px.

`prefers-reduced-motion` does not affect elevation; reducing motion reduces motion, not visual hierarchy.

---

## 5 · Components

Twelve components carry the system. Each is described by anatomy and rule. Order is approximate render-tree order — top-of-page to bottom-of-page, then page-level primitives, then accessibility primitives.

### 5.1 · Namespace switcher (the dropdown)

The load-bearing component shared with `khev-tools/design-expert`. Anatomy:

```
[brand-block]                                    [nav-links] [install]
│
└── on click ─→ panel opens below
                ┌─────────────────────────────────────────────┐
                │ ✓ khev-tools     / design-expert            │
                │   the plugin — what khevin makes for designers │
                ├─────────────────────────────────────────────┤
                │   khevin-mituti  / portfolio                │
                │   the work — what khevin ships for clients  │
                └─────────────────────────────────────────────┘
```

Rules:
- The brand block is always visible (`khev-tools/design-expert` or `khevin-mituti/portfolio`), with a small chevron `▾` after it indicating it's a switcher.
- The current namespace shows a `✓` mark in the panel; the other namespace is unmarked.
- Clicking the unmarked row navigates to the sibling site. A real navigation, not a fake tab — each surface owns its own URL.
- The panel uses `surface-200` background with a `1px solid var(--rule)` border. Radius `2px`. No shadow.
- Each row is two lines: a mono namespace path (`khev-tools / design-expert`) and a one-line descriptor (`the plugin — what khevin makes for designers`).
- Keyboard: the brand block is `tabindex="0"`. Space/Enter toggles the panel. Arrow keys move between rows. Escape closes.
- Reduced motion: panel appears instantly instead of sliding.
- Mobile: the panel takes full viewport width below the nav, with the same content. Tap-target is 48px minimum.

### 5.2 · Numbered section header

Identical to design-expert — `01 — About`, `02 — Selected work`, etc. Mono eyebrow on the left, serif title on the right. The number locks into the eyebrow on scroll (kinetic moment), so the reader always knows which section they're in.

### 5.3 · Project hero block (homepage selected work)

The three big project tiles on the homepage. Each is a full-width strip:

- Left half: a flat-color block matching the project's brand color (`--favo`, `--spaces`, `--amway`) with the project name in oversized serif, all caps, white or `--ink` depending on contrast.
- Right half: parchment surface with a one-sentence project frame in lede style and a `[ See the case study ]` verb-plus-object link.
- On hover: the color block subtly lightens (`accent-mute` overlay at 8% opacity), the cursor picks up a small `→` mark, and a tertiary line of metadata appears below the frame: `2024 · Product Design + UX Research · Brazil`. Reduced-motion: metadata is always visible.
- Strips alternate which half is colored (Favo: left; Spaces: right; Amway: left).

### 5.4 · Mini project tile

Bottom-of-homepage 4-tile grid (litcapital, v3rso, Z Money, awarelog Bluebee). Each tile:

- Square aspect, `surface-100` background, `1px solid var(--rule-soft)`.
- Top: a single representative artifact (a screen, a logo, a poster crop) — set so the artifact doesn't bleed to the edges (16px inset all sides).
- Bottom: project name in `Inter Tight` 18px medium, plus a one-sentence frame in 14px `--ink-mute`.
- On hover: year + role appear, fading in below the frame; the artifact zooms 1.02x. Reduced-motion: year/role always visible, no zoom.

### 5.5 · Case study masthead (the flood)

Top of each case study page. Anatomy:

- Full-width band, `--favo` / `--spaces` / `--amway` background, `120px` tall on desktop.
- Inside: project title in serif display on the left, metadata block on the right (`CLIENT`, `MY ROLE`, `INDUSTRY` — three labeled lines, mono eyebrow + sans value).
- The flood ends with `--shadow-deep` applied to the bottom edge — the one earned shadow on the page, marking the transition into the editorial body.
- Below the flood: hero artifact (a single hero image of the project), then the lede paragraph in italic serif.

### 5.6 · Editorial paragraph

Long-form body of every case study and the process page. Source Serif body at 18px, `line-height: 1.6`, `max-width: 60ch`, `text-wrap: pretty`. Paragraphs separated by `1.5rem` of vertical space, never by `<br>`. The first letter of the lede paragraph is **not** a drop cap — drop caps are an editorial cliché the model reaches for; the lede earns its weight from the italic, not from typographic ornament.

### 5.7 · Marginalia

Margin notes alongside body copy on desktop (left margin, 240px wide). Used sparingly: a credit for a teammate, a tool name, a date, a citation. Mono 12px, `--ink-mute`. On viewports below 1100px, marginalia collapses inline (italic, smaller, indented under the relevant paragraph). On mobile, marginalia disappears entirely or moves to a footnote at the end of the section.

### 5.8 · Pull quote

One per case study, never two. Serif italic at `clamp(28px, 3vw, 44px)`, `line-height: 1.2`, indented 64px from the body. Pull quotes are direct excerpts from the body — never a separate sentence written for the pull. A quote that doesn't appear elsewhere in the body is editorial dishonesty.

### 5.9 · Image + caption

Every screenshot, diagram, photo. Image fills the body width (or the full grid, depending on weight). Caption below, mono 12px `--ink-mute`, max-width 60ch. Captions are full sentences and explain *why this image is here* — never "Screenshot of the dashboard."

### 5.10 · Continue-to-next CTA

Bottom of every case study. Anatomy: a horizontal rule, then a single line: *"Continue to the next project →"*, with the next project's name in serif italic, set in the destination's brand color. Click anywhere on the row navigates. Hover: the row floods with a 4% tint of the destination color, the cursor picks up the mark.

### 5.11 · Footer / contact line

A single full-width band at parchment with a single line of editorial body: *"Currently leading product design at Lastro. Email me at khevin.mituti@lastro.co or read the next thing on Medium."* The links are inline, underlined with `--rule`, and follow the verb-plus-object discipline (`Email me`, `read the next thing`). Below: small print with the year and a one-line credit (`set in Source Serif 4 + Inter Tight`).

### 5.12 · Custom cursor mark

A small `→` arrow that the cursor picks up when it enters a hoverable case study link. Implemented in JS with a 8px×8px element following `mousemove`. On `prefers-reduced-motion`, the cursor mark is disabled and the link itself gets a stronger underline + subtle background tint to compensate.

---

## 6 · Do's and Don'ts

The do's reinforce the pillars; the don'ts cite the bans from PRODUCT.md and the anti-slop tells from `design-expert/anti-slop.md`. These rules are non-negotiable in `/design-expert:build` and they will be flagged on `/design-expert:review`.

### Do

- Set every body paragraph at max-width 60ch.
- Italicize one phrase per display headline, in `--accent`. Never two.
- Use the project flood at the top of each case study only. Return to ink immediately after.
- Cite outcomes with real numbers (R$ 14.382 GMV / mo, 47.2% drop in support tickets) and the timeframe.
- Name the work Khevin did with his hands. Use "I" when he led; use "we" when the team led; never blur the two.
- Respect `prefers-reduced-motion` on every kinetic moment. Static fallback is the default; motion is the enhancement.
- Keep every case study reachable by tab. Every hover-reveal also reveals on focus.
- Use mono for system labels (`01 — Selected work`), serif for content (everything readable), sans for UI (buttons, metadata).
- Set images and screenshots with a 16px inset on mini cards, full-bleed inside case-study bodies, and always with a meaningful caption.
- Maintain the hairline discipline — `1px solid var(--rule)` between sections, never a heavier border, never a shadow on a card.
- Use `--mark` as a highlighter only, applied as a `linear-gradient` background to body-text spans, on hover/focus.

### Don't

- Don't open the homepage with "Hi, I'm Khevin." (Banned in PRODUCT.md.)
- Don't use the word "passionate." (Anti-slop tell.)
- Don't ship skill bars, tag clouds, or star ratings. (Senior portfolio anti-pattern.)
- Don't use round-number outcomes. (Reads as fiction.)
- Don't add a "Get in touch" CTA. (Verb-plus-object only.)
- Don't reveal body copy on scroll. Headlines may have a one-time stagger reveal in the hero. Body copy is always present at load.
- Don't decorate with motion. Every animation must communicate state, hierarchy, or progress; if it does none, cut it.
- Don't use a carousel for case studies. The homepage shows three big projects above the fold; carousels hide work behind interaction.
- Don't add a light/dark toggle. The portfolio is one tone.
- Don't use shadows on cards. (Borders-only, except the one earned shadow on the case-study masthead.)
- Don't let the case-study color flood escape the masthead. The body of each case study is editorial parchment + ink — never magenta + ink, never yellow + ink, never lavender + ink.
- Don't render emojis as UI. (Tolerated in body copy, rare and earned.)
- Don't pair Inter with Inter, Geist with Geist, or any other "default" stack. The Source Serif 4 + Inter Tight + JetBrains Mono triad is the brand.
- Don't ship a hero image of Khevin's face. The old portfolio led with a portrait; the new one leads with the work. (Per scene sentence.)

---

## 7 · Build sequence (Gate 7)

The build sequence is below. Every step gates the next. `/design-expert:build` should walk this list in order and stop at the gates.

| # | Step | Gates the next step |
|---|---|---|
| 1 | **Fork tokens.** Copy `design-expert-landing/styles.css` token block into `khevin-mituti-portfolio/styles.css` and add the per-project flood tokens from this file's frontmatter. | Required for everything below. |
| 2 | **Build the namespace switcher.** Implement the dropdown component on a stub homepage. Verify it lives in both surfaces (also added to `design-expert-landing/index.html` as a sibling fix). | Step 3 cannot start until the dropdown navigates correctly between the two surfaces. |
| 3 | **Homepage v1 — static fallback only.** Hero, About, Responsibilities grid, Client logos, three Project hero blocks (no hover yet), four Mini tiles (no hover yet), Footer/Contact line. No motion. Reads correctly with `prefers-reduced-motion: reduce`. | Step 4 cannot start until the static page passes a peer-designer read-through. |
| 4 | **Layer in kinetic moments.** Hero stagger, project tile metadata reveals, mini tile zoom + role reveal, scroll-progress hairline, section-number lock-in, custom cursor mark. Each one wrapped in a `prefers-reduced-motion` guard. | Step 5 cannot start until kinetic moments work and degrade cleanly. |
| 5 | **Case-study template.** Build a single template page (`case-study.html`) with the masthead flood, metadata block, hero artifact, lede, editorial body, marginalia, pull quote, image+caption, and continue-to-next CTA. | Step 6 cannot start until the template renders cleanly with placeholder content. |
| 6 | **Populate three case studies.** Favo (magenta), Spaces Parking (yellow), Amway (lavender). Each gets one distinctive interactive moment: Favo logo evolution Aiyu→Favo, Spaces parking flow micro-prototype, Amway before/after slider on the admin portal. | Step 7 cannot start until all three case studies are reviewed against PRODUCT.md voice and DESIGN.md craft. |
| 7 | **Process / how-I-think page.** Pantheon-style, but for Khevin's working method instead of designers. Five to seven cards: how he scopes work, the questions he asks first, the bar he holds, the moments he hands off, the things he refuses to do. | Step 8 can start in parallel with Step 7. |
| 8 | **Notes / writing index page.** A list view: date, title, link out. No publishing CMS. Static markdown rendered to HTML at build time, or hardcoded entries for v1. | Step 9 starts after both Step 7 and Step 8. |
| 9 | **Cross-page polish.** Keyboard audit (every interactive element reachable by tab, every hover-reveal also focus-reveals). Screen reader audit (alt text on every image, aria-labels on the namespace switcher and the cursor mark). Lighthouse / a11y pass. | Step 10 cannot start until accessibility passes ship. |
| 10 | **Sibling fix on `design-expert-landing/`.** Replace the static brand block with the namespace switcher; ensure the dropdown navigates back. | Final step. |
| 11 | **`/design-expert:review` against the full portfolio.** The reviewer reads every page, scores against the 10-lens framework, flags every anti-slop tell, cites the principle behind each note. | Ship gate. |

Eleven steps. Some run in parallel (7 & 8). Steps 1–4 are foundational; step 5 is the architectural pivot; 6 is the bulk of the writing work; 9–11 are the discipline that earns the ship.

---

## 8 · What this brief is not

This brief does not specify pixel-perfect layouts, exact line-heights for every heading, or the precise grid rhythm of every section. Those decisions are made on `/design-expert:build` against this brief — the brief gives the builder *enough* to make those decisions, not all of them. A tighter brief would foreclose judgment; a looser brief would foreclose discipline. The line is here.

The brief also does not specify the case-study *content* — the actual prose for Favo, Spaces, Amway. That work lives in the case-study writing phase, run as a series of `/design-expert:write` invocations against the populated case-study template, with Khevin's drafts as input.

---

*End of DESIGN.md. The next move is `/design-expert:build` against this brief, starting with step 1 of the sequence above. Do not start before the brief has been read.*
