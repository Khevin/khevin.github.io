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

## Pattern: council hero

The hero pairs editorial copy with an interactive council, using six of the existing Pantheon SVG drawings. It introduces the full eighteen-designer method without pretending to run a live review or implying personal endorsement.

- `.council-hero__layout` uses two columns, `1fr 1.1fr`, and stacks at `≤760px`. Responsive rules live in `design-expert-hero.css`; no inline grid-column styles.
- The council uses a circular arrangement on wide screens and a taller oval on narrow screens, preserving enough room between the seats and the decision card. Designer buttons sit around a central principle and a small worked example. Shared drawings live in `assets/council-symbols.svg`, with non-scaling strokes so they remain legible at small sizes.
- Six native buttons expose `aria-pressed` and control a polite live region. Click, Enter, Space, arrows, Home, and End work. `design-expert-hero.js` changes only authored example content. The tour has no controls. It runs on its own, one seat every 4.8 seconds, through the six studies and stops; the pointer resting over the council pauses it, a click, key or focus hands the council to the reader, and once the pointer has been away eight seconds it picks up again. Reduced motion never starts it. The live region is `off` while the tour runs and `polite` the moment the reader takes over. Nothing under the council says any of this: the seats are buttons and look it, and the Play and Replay buttons that briefly sat there came out on 15 Sep 2026. There is no remote call or framework dependency.
- Default Rams content is readable before JavaScript loads. Motion is the tour above, the six studies, short hover transitions and the 600ms hue travel, all disabled for reduced-motion preferences; anchor scrolling also honors that preference.
- **Each seat carries Itten's hue for its position on the wheel**, yellow at the top and then orange, red, violet, blue, green clockwise, declared as three registered oklch components (`--seat-l`, `--seat-c`, `--seat-h`) on the seat. The table holds the selected copy, which the spokes and the worked example read through `--hue`; the script moves it the short way round the wheel, so a change of seat crosses the hues between and never the grey between two colours. Labels read `--hue-tint`, the hue mixed fifty-five per cent toward the ink, which keeps every seat above 4.5:1 on the page as drawn. A custom property resolves where it is declared, so `--hue` is restated on the seat; inherited from the table it would carry the table's colour into every seat.
- The final call remains the user's. The hero ends on a full-width hairline, the same rule that separates every other pair of sections; the footer that once carried "18 perspectives" and a link to the Pantheon is gone, since the nav already goes there.
- The ChatGPT glyph uses a white filter on the ink theme and keeps its dark original on paper. Both compatibility links remain equally prominent.

---

## Pattern: graphite atmosphere

`design-expert-atmosphere.css` adds depth without changing the content hierarchy. A static, tiled SVG grain sits beneath the page at 2.2% opacity. A twelve-column drafting grid aligns with the shell in the hero and library, fades through a mask, and becomes six columns below 760px. Localized crimson, green, violet, and gold washes follow existing section colors; the FAQ and changelog have neither a grid nor a wash.

The council alone has a small halo that inherits the selected designer's hue. It changes with selection, never on an independent loop. Decorative layers have no pointer events and sit behind content; high-contrast and forced-color modes remove them. Do not add cursor spotlights, floating particles, or continuous background motion to this treatment.

Connector anchors use untransformed glyph layout dimensions. Long paths carry a constant-speed highlight; short paths receive a soft whole-line emphasis rather than a twitchy dash. The central study remains the primary moving element.

---

## Pattern: the painters' colours

The palette picker colours the page; two painters colour the drawings. Every token the page reads follows the palette, and two sets of constants do not: Itten's six hues in the council (above) and each designer's own colour in the pantheon. The drawings keep their colour under every palette, which is what lets the picker be a comparison of pages rather than eighteen recolourings of the artwork.

- **Each pantheon drawing takes the one colour its designer is known by**, set as `--pigment` and `--pigment-alpha` by `data-god`: Braun cream for Rams, IBM blue for Rand, Tufte's rust, the Public Theater yellow for Scher, the Tonhalle orange for Müller-Brockmann, CRT phosphor for Muriel Cooper. Itten's wheel is the exception: every stroke in it carries a hue, set inline in the drawing, with the rings split into twelve arcs, one per sector. An af Klint pyramid mapping was tried first and read as arbitrary; a colour has to belong to the person.
- **Hairlines on dark paper are seen by luminance**, so `--pigment-alpha` rises as a colour darkens (.5 for cream, .9 for a deep red) to keep every card in one band of visibility, roughly 3.5 to 4.5:1 at rest. Hover multiplies the opacity by 1.4, capped at 1.
- Names, discipline tags and quotation marks stay on `--accent`. Only the drawings are the painter's.
- Measure a new pigment the way the palette rule says: composite it over `--paper` at its rest opacity (the screen blend adds almost nothing on this ground) and read the ratio through a canvas pixel.

---

## Pattern: emphasis, and the wheel down the page

- **Emphasis is not a colour.** The italic in a headline and the marks around a quotation read `--em`, the ink mixed toward white, so the emphasis is the italic itself. The accent is spent on small things: eyebrows, tags, rules, the one underline in the hero.
- **Each section turns the accent sixty degrees.** `--accent-0` is the palette's accent; every `.section` sets `--accent` to it turned by `--turn` to the hue that section was asked for (the turns are named in the stylesheet) at the same lightness with chroma capped at .13, and derives `--accent-deep` and `--accent-mute` again from the turned colour. Same lightness is what keeps every section as visible as the one the palette chose. The hero, nav and dialogs keep the accent itself. The rule sits behind `@supports` for relative colour syntax; without it the page is one accent, as before.
- The page has one palette now, graphite, and the turn is written against `--accent-0`, so a change of palette is still five lines at the root. The crimson was toned from #d50032 to #c23545 because the neon read as an alarm.

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

## Pattern: the page's colours

The page is graphite: `#141414` ground, `#414141` graphite, `#c23545` crimson as the accent, `#ebebeb` near white. Those four colours and the accent sit on `:root` as `--c1` to `--c4` and `--c-accent`, and every token the page reads is derived from them by one block of `color-mix`, so a change of palette is five lines. A picker in the nav once offered twenty-three other palettes and a mixer; it came out on 15 Sep 2026 once the choice was made, and with it the head script that restored a remembered palette and the `design-expert:palette` key.

**Rules.**

- **The tokens live on the root**, not on body. The html background paints the canvas and the document scrollbar resolves its properties there, so tokens set on body would leave the gutter and the overscroll behind.
- **The lightest colour tints the text toward off-white rather than becoming it.** `--ink` is `--c4` mixed twenty per cent into `#fbf9f6`, because a saturated colour set as body copy at 14px is unreadable.
- **Check contrast after changing a colour.** Measure `--ink-soft`, `--ink-mute` and `--accent` against `--paper`, and require 4.5, 3 and 3. Read the colours through a canvas pixel: `getComputedStyle` serialises a `color-mix` result as `oklab(...)`, and parsing those three numbers as if they were RGB gives silently wrong ratios.

---

## Pattern: a headline phrase that never breaks

The hero headline reads "The design-expert, / at your service." and the first line is one phrase. Breaking it, and especially breaking it at the hyphen inside the product name, reads as a bug rather than as typesetting.

**Rules.**

- The phrase lives in its own `.council-hero__line` span with `white-space: nowrap`, so it can never break mid-word.
- The size is capped twice: `clamp(56px, 6.7vw, 94px)` sets the ceiling, and `15.5cqw` keeps the line inside its own column at every width. The second cap needs `container-type: inline-size` on `.council-hero__intro`. Sizing a headline off the viewport when its column is a fraction of that viewport is what let it break in the first place, and no amount of tuning the clamp fixes that.
- **The hero pins Fraunces to its display cut with `font-variation-settings: "opsz" 144`.** Left on automatic optical sizing, the same phrase runs 7.19px per font-px at 56px and 6.09px at 94px, a twenty per cent spread, so no single `cqw` coefficient can hold the line at both ends. Pinning the axis makes the width predictable, and the display cut is the right drawing for a hero anyway. Smaller headings keep automatic sizing, which is what the axis is for.
- A different title face needs the coefficient measured again: set the phrase at 100px with `letter-spacing: -0.045em` and the italic on the product name, check the result differs from the fallback, then divide.
- The intro column is the wider of the two (`1.12fr 1fr`). The council drawing gave up about ten per cent for this and can afford it.

---

## Pattern: tab group

Used by the install section, where Claude Code and ChatGPT / Codex are alternatives rather than steps. The model for any future place on this site where two or more paths exist and a reader only needs one of them.

**Markup contract.**

```html
<div class="install-tabs" id="<group-id>">
  <div class="install-tabs__list" role="tablist" aria-label="<what is being chosen>">
    <button class="install-tab" id="<deep-link-id>" type="button" role="tab"
            aria-selected="true" aria-controls="<panel-id>" tabindex="0"> … </button>
  </div>
  <div class="install-card install-panel" id="<panel-id>" role="tabpanel"
       aria-labelledby="<deep-link-id>" tabindex="0"> … </div>
</div>
```

**Rules.**

- The **id that anything already deep-links to goes on the tab, not on the panel**. A hidden panel cannot be scrolled to, and moving the id keeps every existing link working; the script selects the tab whose id the link named. The hero's compatibility chips depend on this.
- Selection is automatic: arrow keys move focus and select in one step, which is correct when the panels are already in the DOM and cost nothing to show. Home and End jump to the ends. `tabindex` is roving, so the group is one tab stop.
- **`.install-card` sets `display: grid`, and an author `display` beats the UA rule that the `hidden` attribute relies on.** Any panel styled with an author `display` needs `[hidden] { display: none }` said explicitly, or both panels render at once.
- The tab row sits on the same 1px hairline the cards use as a divider, and the selected tab draws a 2px accent rule over it. State is a change in the existing line language, never a pill, a filled tab, or a shadow.
- Panels drop the card's bottom border because the group is already bounded; the card that follows the group takes a top border instead.
- The tab label is the panel's label. Do not repeat it as a rail heading inside the panel.
- 48px minimum tab height, accent `:focus-visible` ring at 2px offset, transitions at 150ms.

---

## Pattern: the title typeface token

Every heading on this surface reads `--title`; body prose, ledes that are really body, credos, popover text, mono and the interface chrome read `--serif` or `--sans`. The token is currently Fraunces, a soft old-style with a deliberate wobble, backed by Source Serif 4.

**Rules.**

- A new heading rule reads `var(--title)`. A new body rule reads `var(--serif)`. A heading that reads `--serif` is the drift this token exists to prevent.
- The hero's dek is the one non-heading on the token, because it is the second line of the title block and would otherwise sit in a different face two lines below the first.
- Changing the token changes every heading at once, which is the point. It also changes the headline's width, so re-check the rule above before shipping a new face.

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

The compatibility strip now carries two equal first-class install links: Claude Code and ChatGPT / Codex. Both use this treatment with their own glyph; future or unsupported harnesses do not appear as muted "soon" labels.

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

## Pattern: per-surface PRODUCT.md / DESIGN.md naming

Project briefs and design specs live next to the surface they describe, named `<surface>.PRODUCT.md` and `<surface>.DESIGN.md`. Examples on this site: `projects/spaces2.PRODUCT.md` + `projects/spaces2.DESIGN.md` for the spaces case-study redesign. When future case studies land (`favo`, `amway`, `bitcapital`, etc.), they get their own pair at `projects/<slug>.PRODUCT.md` + `projects/<slug>.DESIGN.md`. The portfolio root may earn a portfolio-wide brief later (`PRODUCT.md` + `DESIGN.md` at the repo root) for cross-surface voice and token decisions, but per-surface briefs are the canonical scope for individual case studies.

The naming convention is set per `commands/plan.md` Gate 6. Stick to it for every new surface.

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
