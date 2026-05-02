# system.md — design-expert landing

Patterns the build introduced. Read before the next mobile pass on a new section, before the next nav addition, before any responsive redesign on this surface. The point of this file is that decisions made once stay made — drift is what breaks systems.

---

## Canonical breakpoints

The site collapses at fixed thresholds, named by what changes rather than by device. Use these everywhere; do not introduce ad-hoc widths.

| Token | px | What it gates |
|---|---|---|
| `--break-stack` | **760** | Mobile threshold. Multi-column rows collapse to one column. Nav inline list collapses behind a hamburger. Library descriptions hide. Pantheon cards switch to compact mode. |
| `--break-narrow` | **600** | Sub-mobile, used only for the popover dialogs to drop their portrait + name pair into smaller cells. Avoid creating new rules at this width unless the popover system asks for them. |
| `--break-tight` | **800** | The namespace switcher panel adopts edge-to-edge gutters at this width; the install grid drops to 1-col. Used sparingly; default to `--break-stack` (760) for new layout work. |

The single canonical mobile breakpoint is **760px**. Adding a new media query at any other width should be justified in the commit message; otherwise reuse 760.

---

## Pattern: responsive nav-toggle (hamburger)

A 44×44 native `<button>` reveals the primary nav as a dropdown panel anchored to the right edge of the nav. The pattern is the model for any future toggleable mobile UI on this surface (a future tag-filter panel, a section-jumping ToC, a mobile sort menu).

**Markup contract.**

```html
<button class="nav-toggle" id="<id>" type="button"
        aria-haspopup="menu" aria-controls="<panel-id>"
        aria-expanded="false" aria-label="Open menu">
  <svg class="nav-toggle__open"  viewBox="0 0 24 24" …><path d="M4 7 H20 M4 12 H20 M4 17 H20"/></svg>
  <svg class="nav-toggle__close" viewBox="0 0 24 24" …><path d="M5 5 L19 19 M5 19 L19 5"/></svg>
</button>
<ul class="<panel-class>" id="<panel-id>"> … </ul>
```

**CSS contract.**

- Hamburger is `display: none` on desktop, `display: inline-flex` at `≤760px`. Always 44×44 minimum.
- Open icon and close icon both live inside the button; visibility is toggled by `[aria-expanded="true"]` selector. No JS image swap.
- Panel is `display: none` on mobile by default, `display: flex` when the panel has `data-open="true"`. Position absolute, anchored to the right edge of the nav, paper background, 1px ink-faintest border, `0 12px 32px rgba(20,18,14,0.10)` shadow. **Do not** use a fullscreen overlay for short link lists — overkill.
- Link rows inside the panel are 44px min-height, mono 13px, hover background `--rule-soft`.

**JS contract.**

- Toggle flips `aria-expanded`, `aria-label`, and `data-open`.
- Close on: link click inside the panel, Esc keypress, outside click, resize crossing back to ≥761px (`matchMedia('(min-width: 761px)')` change event).
- Mirror the namespace-switcher IIFE pattern; do not reach for a framework.

**Hard rules carried forward.**

- Native `<button>`, never a div with role.
- `aria-expanded` and `aria-controls` are required.
- 44×44 touch target.
- `prefers-reduced-motion` honored — transitions ≤150ms, no entrance motion on the panel.

---

## Pattern: hero-row collapse

The hero pairs a copy column with an art column on desktop and stacks them on mobile. The previous inline `style="grid-column: span N"` blocked media queries; the fix is class-based.

**Markup.**

```html
<div class="row hero-row">
  <div class="hero-col-text"> … body-lg + hero-copy … </div>
  <div class="hero-col-art">  … hero-art tile …       </div>
</div>
```

**CSS.**

- Desktop default: `.hero-col-text { grid-column: span 6 }`, `.hero-col-art { grid-column: 8 / span 5 }`.
- At `≤760px`: `.hero-row { grid-template-columns: 1fr; gap: 28px }` and both children `grid-column: 1 / -1`. Both span the full width; the value-prop sentence finally has its full measure.

**Rule.** No inline grid-column styles on a row that needs to collapse. If the row is desktop-only, an inline style is acceptable; if it needs to reflow, ship classes.

---

## Pattern: compact-mode list and card

Two list/grid surfaces — the library row-items and the pantheon figures — switch to a compact mode below 760px. The pattern is reusable for any future list with primary content + secondary description.

**Library row.**

- Desktop: 5-column grid (`50px 56px 1.1fr 2.4fr 1fr`) showing number, icon, name, description, tag.
- Mobile: 4-column grid (`44px 44px 1fr auto`), description hides via `.desc { display: none }`. Padding shrinks to 16px vertical. Row height halves.

**Pantheon figure.**

- Desktop: 240px min-height, padding 28px 26px, full credo + squiggle.
- Mobile: 120px min-height, padding 18px 18px, credo hides, h4 scales 30→22px (first-name 18→14px), squiggle width 65%→50% with right offset 10px.

**Rule.** Compact mode hides the secondary explanatory text, never the primary identifier. The user must still know which item they are looking at by name — only the description disappears. If the design wants to hide the primary identifier, it is not compact mode; it is a different layout.

---

## Pattern: link-affordance chip

A chip that navigates somewhere needs to read as navigable, not as a label. The fix is twofold: make it a real `<a>`, and add a small typographic `↗` glyph that is the navigation receipt.

**Markup.**

```html
<a class="chip primary" href="#install">
  <span class="glyph clawd">…</span>
  Claude Code
  <span class="chip-arrow" aria-hidden="true">↗</span>
</a>
```

**CSS.**

- `text-decoration: none`, `cursor: pointer`, hover background `color-mix(in oklch, var(--paper-warm) 70%, var(--accent) 12%)`.
- `:focus-visible` ring 2px accent, 2px offset.
- `.chip-arrow` is mono 13px, ink-faint by default, accent on hover, translate(2px, -2px) on hover.

**Rule.** Whenever a chip-shaped element navigates, ship it as `<a>` with the `↗`. Whenever a chip is purely informational (a category label, a metric, a "still working" tag), keep it as `<span>` and never add the arrow. The arrow is a contract: this thing goes somewhere.

---

## Pattern: typographic monogram fallback for missing portraits

Used by the pantheon popover (`.god-pop__portrait`). When a designer's photo doesn't exist on disk, the slot renders a sepia-warm card with the designer's initials in serif italic. The pattern is the model for any future avatar slot where the image source might be missing.

**Behavior.**

- JS attempts `new Image()` with the expected path (`assets/<dir>/<key>.jpg`).
- `img.onload` → replace the slot's children with the `<img>`.
- `img.onerror` → fall back to the monogram element.
- Render the monogram immediately so there is no empty flash while the image loads; it gets replaced if the image succeeds.

**Rule.** Avatar slots that can be missing must have a typed fallback, not an empty box and not a generic silhouette. The monogram is editorial; the silhouette is a stock-photo concession.

---

## Pattern: case-study editorial layout

Case-study pages (`projects/{spaces,favo,amway}.html`) use a thin set of conventions so each one is recognizably part of the same series while the per-section composition varies according to the work being shown.

**Markup contract.**

- `body[data-project="<slug>"]` enables the case-study CSS overrides.
- Hero: `.case-hero.case-hero--wide` with full-width title, subtitle below, and a `.fact-ribbon` of six fact cells.
- Each section is `<section class="case-section" id="<slug>">` whose `.shell` directly contains a `.case-prose` block (text) and any number of figure blocks (free to use the full container width).
- No section eyebrow kicker (no `<div class="lab"><span class="n">01</span>Background</div>`). The h2 carries the section. The number was theatre.
- No mono "FIG · NN · LABEL" caption prefixes on figures. Captions are plain serif italic prose where they add information; removed entirely where the surrounding body explains the figure.
- No section dividers inside case studies (`body[data-project] .case-section { border-bottom: 0 }`). The composition does the work; the rules were redundant and visually noisy.

**Reading column.**

`.case-prose` constrains body text to `max-width: 65ch`, centered. Figures live as siblings of `.case-prose` inside the same `.shell`, free to use their own grid arrangements at the full container width. This separation is what lets prose stay readable while figures vary.

`.case-prose.case-caption` is the prose caption that follows a figure block — serif italic, smaller, left-aligned (no `margin: 0 auto`).

**Color rule.** All accents inside case studies tint to `--ink` (dark grey), not the page accent (terracotta). Italic ems, pull-quote rules, and KPI numerals all use `var(--case-accent)` which is set to `var(--ink)` for every `body[data-project]`. The result reads as an editorial spread — hierarchy through weight and italics, not through color shifts.

---

## Pattern: image-driven asymmetric grid

The grid for a figure block follows the dimensions and intent of the image, not a fixed template. The case-study patterns below are the four shapes in current use; new image groupings should pick from these or earn a new one.

| Pattern | When to use | Span |
|---|---|---|
| `.case-figure--offset` | Lead image break that nudges off the symmetric center line | cols 2 / -1 (offset right) |
| `.case-figure--system` | Single artifact (component library, system map) anchored left | cols 1 / span 7 (right third = breathing room) |
| `.case-figure--wide` | Full-bleed moment within the shell | cols 1 / -1 |
| `.v2-fig--{lead,hands,right}` | Three figures at three distinct anchors so a multi-image section reads as varied composition | cols 2 / span 9 → 1 / span 8 → 4 / span 9 |

**Rule.** When two figures sit in a pair (`.system-pair` style), their split should follow image dimensions: portrait + landscape → 5/7. Two similar landscapes → 7/5 if one is denser, 6/6 if they're equally weighted. Symmetric splits are the default to avoid; pick one only when the images genuinely warrant equal billing.

**Evidence-wall variant** (`.evidence-wall`): a left-anchored trio packed in the left two-thirds of the 12-col grid (3-col cells at cols 1-3 / 4-6 / 7-9). The right third stays empty as deliberate breathing room. Caption sits below at cols 1-9, also left-anchored. Used for "what we inherited" sections where three before-images are shown together.

---

## Pattern: editorial register for case studies

> **Canonical reference:** `design-expert/styles/editorial.md` (in the `khev-tools/design-expert` plugin). This system.md retains the project-specific contract for `projects/{spaces,favo,amway}.html`; the canonical discipline lives in the plugin. When the two diverge, the plugin file is authoritative — this section is the project-side mirror.

Case-study pages on this site (`projects/{spaces,favo,amway}.html`) sit in the **editorial register**, not the brand register and not the product register. Treat them as long-form magazine pieces. The shape is borrowed from Work & Co's client work, Pentagram's project pages, and the wider editorial-design tradition.

**The two-column rail.** A narrow left rail (200–280px) holds section labels and chapter eyebrows. A wider right column (700–900px, capped at 65–75 ch for readability) holds body prose, KPI numerals, and figures. The rail is fixed-width; the body breathes. On a 12-col grid this is a 3/9 or 4/8 split.

**Three type roles.** Display sans-serif for KPI numerals and chapter headers (80–130px, bold), body serif for narrative prose (Source Serif on this site), small sans-serif for rail labels and figure captions (12–14px, ink-mute). Three distinct voices, one for each job. One font doing all three jobs is the templated-case-study tell.

**Hairlines and bars.** Hairline rules (1px ink-faintest) separate sub-sections. A heavy bar (3–5px solid ink) marks major chapter breaks. Most sub-sections within a chapter use no divider at all — whitespace alone. The contrast IS the hierarchy.

**Numbered chapter anchors.** "01." in the rail at the same scale as the chapter title — both 80–100px sans-serif. The number lands first; the title reads as the chapter. Optional pre-summary block ("Three big takeaways" / 01–02–03) before the chapters begin, as a courtesy table-of-contents.

**Asymmetric image rhythm.** No symmetric grids of equally-sized screenshots. Images anchor right with whitespace left, anchor left with whitespace right, or sit full-width inside a tinted band. Bare imagery — no shadows, no card frames, no rounded mounting. The image is the artwork; let it sit. Generous vertical padding around every image moment.

**Monochrome chrome, color in the work.** The page chrome reads in ink, paper, mid-grey. Brand color appears only inside the artwork (hero band, screenshots, illustrations). Italic emphasis, pull-quote rules, and KPI numerals tint to ink, not accent. The principle: "the work has color, the layout doesn't."

**Rule.** When in doubt about whether a surface is editorial, brand, or product, ask: how long is the user on this page? If twenty minutes of attention is the contract, the register is editorial — the rail-and-body grid, the three type roles, the hairlines-and-bars hierarchy, and the monochrome chrome all apply. If the user is in-and-out in under a minute, it's brand. If they live in it for hours, it's product.

See `craft.md` § Editorial layouts for the full pattern, `grids.md` § Brand vs. product vs. editorial for the grid mechanics, and `typography.md` § Brand vs. product register for type for the three-role pairing.

---

## Closing

This file is small on purpose. Each pattern is a contract for the next build to honor — adding a new pattern means the system has a real new surface to support, not a one-off being smuggled in. If a build introduces a pattern not described here, either it should not exist (use the closest existing pattern instead) or it earns its place and gets documented before it ships.
