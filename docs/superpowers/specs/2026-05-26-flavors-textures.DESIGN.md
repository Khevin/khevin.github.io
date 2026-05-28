---
# Flavors & Textures + Edibles Database — DESIGN.md (frontmatter tokens)
# Companion: 2026-05-26-flavors-textures.PRODUCT.md
# Scope: vocab/eating-out → Flavors, Textures, Edibles Database
# Register: editorial · Layout: bento → drill-in immersion (flavors/textures), category-browse → item-detail (edibles)

# ── Foundation palette (inherited from the existing Nihongo app) ───────────
colors:
  ink:           "#1c1a18"   # primary text, ink-on-paper
  ink-soft:      "#3a3530"   # secondary text, ink at 80%
  ink-faint:     "#6d645b"   # tertiary, label chrome
  paper:         "#f6efe2"   # canvas background, warm cream
  paper-soft:    "#ece3d2"   # card surfaces, slightly deeper
  paper-deep:    "#e0d4be"   # rule lines, hairlines, drawer surfaces
  rule:          "#cbbfa8"   # hairline borders
  accent-vermilion: "#c34b30" # the existing app's sumi-e accent (sparingly)
  accent-gold:   "#a8843c"   # secondary accent — clock markers, key emphasis

# ── Per-flavor color worlds (Phase 1, 10 flavors) ──────────────────────────
# Each flavor carries: --flood (viewport-fill on immersion view, desaturated
# enough to keep type legible), --ink (the type color paired with the flood),
# --chip (the small color hint on the bento card front).
# Format: { flood, ink, chip } — three values per flavor.
flavor-worlds:
  oishii:    { flood: "#fbf3e8", ink: "#2a2520", chip: "#d8a06a" }  # warm cream + caramel chip — anchor flavor, umami warmth
  mazui:    { flood: "#d8d9b0", ink: "#3a3a25", chip: "#7d8a4a" }  # sallow olive — rejected food, sickly green
  amai:     { flood: "#fbe1e7", ink: "#5a2a3a", chip: "#e69cb1" }  # sakura pink — soft, strawberry shortcake
  karai:    { flood: "#c84a3a", ink: "#fbf3e8", chip: "#e6603a" }  # chili crimson — high heat, white text on flood
  shoppai:  { flood: "#dfe6ec", ink: "#1e3a5f", chip: "#7d96ad" }  # sea-salt blue — brine, chip-bag silver
  suppai:   { flood: "#f4dd6a", ink: "#3a2e10", chip: "#e6c440" }  # lemon yellow — citric acid universal
  nigai:    { flood: "#3a2a1f", ink: "#f0d8b8", chip: "#6e4a30" }  # espresso — dark roast, light ink on dark flood
  atsui:    { flood: "#e07645", ink: "#3a1a10", chip: "#c8541f" }  # ember — thermal red, warmer than chili
  sawayaka: { flood: "#c8e6d8", ink: "#1f3a30", chip: "#6ea890" }  # mint-water — refreshing, mid-cool
  tsumetai: { flood: "#c8e0e8", ink: "#1e3a4f", chip: "#7ba8b8" }  # ice cyan — cold without being white

# ── Texture treatments (Phase 2, 10 textures) — refined 2026-05-27 ─────────
# Textures DON'T get a full color flood — they get a subtle paper-tint shift
# plus a brushed motion-line glyph that IS the visual identity. Each texture
# carries five fields:
#   tint         — paper-tint applied to immersion canvas. Always above ~92%
#                  lightness; it's a whisper, not a commit. Sensory-specific
#                  (mochi pink, nori slate, shrimp coral) rather than amber-
#                  leaning (the pre-2026-05-27 draft was too yellow across
#                  all 10 — the world reads as one warm tone).
#   motion       — the CSS class hint mapping to the brushstroke style.
#   motion-shape — describes the actual SVG curve. Used at build time to
#                  generate the brushed motion-line that fills the bento
#                  card's image slot AND sits under the immersion kana.
#                  NO food image on the bento card — the texture IS its
#                  brushed glyph. (Departure from the flavors-page pattern
#                  where the bento card front carries a canonical food.)
#   food-pool    — 4-8 edible item ids the right-column collage on the
#                  immersion view samples from. The collage is the texture's
#                  visual answer to "where does this texture live in the
#                  world?" Pool can grow; the field is the seed.
#   audio-foley  — the texture-sound that plays sandwiched between the two
#                  spoken-kana readings (audio = word slow + foley + word
#                  natural). Build task: source/record one per texture.
texture-treatments:
  mochimochi:
    tint: "#F5E8E4"           # mochi cream-pink — pressed sweet rice blush
    motion: "soft-bounce"
    motion-shape: "rounded sine wave, slight squash on the peaks — the bouncy spring of pressed mochi"
    food-pool: [mochi, daifuku, ohagi, taiyaki, dango, manjuu, pan, shokupan, hikiniku]
    audio-foley: "soft squish / chewy-press"
  sakusaku:
    tint: "#F2E9D1"           # tempura golden — light-fried batter
    motion: "crisp-angular"
    motion-shape: "angular sawtooth with sharp downward peaks — the shatter of crisp tempura batter"
    food-pool: [furaido-poteto, poteto-chippusu, beekon, kabita-pan, taiyaki, dorayaki]
    audio-foley: "crisp shatter / batter-snap"
  nebaneba:
    tint: "#ECE2C2"           # natto amber — fermented soybean
    motion: "wet-drag"
    motion-shape: "stretched-thread arcs with sag and drooping strings — the stringy pull of natto / okra"
    food-pool: [nattou, youkan, mochi, daifuku, warabimochi, anmitsu]
    audio-foley: "wet stretch / stringy pull"
  paripari:
    tint: "#E5E8E0"           # nori slate — dry seaweed muted green-grey
    motion: "sharp-thin"
    motion-shape: "zigzag with hard 90° corners, thin stroke — the brittle snap of dry nori"
    food-pool: [onigiri, beekon, taiyaki, kabita-pan, poteto-chippusu, dish-tempura]
    audio-foley: "thin snap / sheet-crack"
  sarasara:
    tint: "#F7F4EE"           # rice-paper near-default — absence-of-texture as texture
    motion: "smooth-flow"
    motion-shape: "long flowing horizontal wave, very low amplitude — the smoothness of loose rice / fine hair / pour-over water"
    food-pool: [gohan, genmai, ocha, mizu, uuroncha, tansansui, soba, udon]
    audio-foley: "gentle pour / brushed silk"
  fuwafuwa:
    tint: "#F5EDD8"           # pancake cream — airy lift cream-yellow
    motion: "airy-cloud"
    motion-shape: "three rising cloud-bumps stacked — the airy lift of pancake / cotton candy / soufflé"
    food-pool: [pan, shokupan, namakuriimu, taiyaki, dorayaki, manjuu, purin]
    audio-foley: "soft puff / cotton-press"
  torotoro:
    tint: "#F6E8C9"           # yolk pale — soft-boiled egg yolk
    motion: "thick-melt"
    motion-shape: "sagging arc with a slow drip on the right — the melt-and-flow of onsen-egg yolk / nikujaga sauce / melted cheese"
    food-pool: [tamago, namakuriimu, purin, aisukuriimu, bataa, gyuunyuu, unagi, anmitsu]
    audio-foley: "thick pour / honey-drag"
  shakishaki:
    tint: "#E6EEDE"           # vegetable celadon — fresh-green crispness
    motion: "vegetal-snap"
    motion-shape: "short vertical hatch-lines, evenly spaced — the crisp-fresh stand of lettuce / daikon / cucumber"
    food-pool: [kyabetsu, daikon, ninjin, kyuuri, tomato, ringo, nashi, kaki, renkon, gobou]
    audio-foley: "vegetable snap / leaf-crunch"
  puripuri:
    tint: "#F4E4DA"           # shrimp coral — cooked-prawn pink
    motion: "plump-bounce"
    motion-shape: "taut rounded bubbles in a row — the plump bounce of shrimp / scallops / sausage"
    food-pool: [ebi, tako, ika, kani, sooseeji, toriniku, hikiniku, hot-frankfurt]
    audio-foley: "plump-pop / sausage-bite"
  karikari:
    tint: "#E8D8B8"           # bacon toast — crisped golden-brown
    motion: "hard-crunch"
    motion-shape: "jagged dry-broken line, snapped mid-stroke — the crunch of bacon / karaage / croutons"
    food-pool: [beekon, dish-karaage, furaido-chikin, furaido-poteto, poteto-chippusu, piinattsu, dish-tempura]
    audio-foley: "hard crunch / bacon-snap"

# ── Typography (inherited 3-role system) ───────────────────────────────────
typography:
  display:
    family: "Noto Serif JP, 'Hiragino Mincho Pro', serif"
    sizes:
      bento-label:        { font: "24px",   weight: 500, line: 1.2,  spacing: "0.02em"  }
      immersion-kana:     { font: "12rem",  weight: 600, line: 1.0,  spacing: "-0.02em" }  # clamp(6rem, 18vw, 18rem)
      texture-kana:       { font: "10rem",  weight: 700, line: 1.0,  spacing: "0.0em"   }  # doubled syllables read denser
      item-kanji-hero:    { font: "6rem",   weight: 500, line: 1.1,  spacing: "0.0em"   }
      category-tile-kanji:{ font: "5rem",   weight: 500, line: 1.1,  spacing: "0.0em"   }
  body:
    family: "Noto Sans JP, system-ui, sans-serif"
    sizes:
      furigana:        { font: "14px",  weight: 400, line: 1.4,  spacing: "0.05em"  }
      audio-button:    { font: "13px",  weight: 500, line: 1.0,  spacing: "0.06em"  }
      flavor-badge:    { font: "14px",  weight: 500, line: 1.0,  spacing: "0.04em"  }
      similar-items:   { font: "15px",  weight: 400, line: 1.4,  spacing: "0.02em"  }
  english:
    family: "Inter, system-ui, sans-serif"
    sizes:
      drawer-gloss:    { font: "16px",  weight: 400, line: 1.5,  spacing: "0.0em"   }   # English ONLY appears here
      cultural-note:   { font: "15px",  weight: 400, line: 1.6,  spacing: "0.0em"   }
      ui-chrome:       { font: "13px",  weight: 500, line: 1.0,  spacing: "0.04em"  }

# ── Spacing (existing 4pt base scale, no additions) ────────────────────────
spacing:
  xs:    "4px"
  sm:    "8px"
  md:    "12px"
  base:  "16px"
  lg:    "24px"
  xl:    "32px"
  2xl:   "48px"
  3xl:   "64px"
  4xl:   "96px"

# ── Radius ─────────────────────────────────────────────────────────────────
radius:
  sm:        "4px"     # badges, chips
  md:        "8px"     # bento cards, item cards
  lg:        "16px"    # category tiles, immersion hero block
  full:      "9999px"  # round audio buttons

# ── Elevation (paper-on-paper, percent-based per craft.md) ─────────────────
# The system stays nearly flat — borders and paper-deep shifts do the work
# that shadows would do in a product-register UI. One subtle drop-shadow
# only on bento card hover, and only off the hover surface.
elevation:
  canvas:        "var(--paper)"                  # 0% — base
  surface-100:   "var(--paper-soft)"             # +7% — bento card resting
  surface-200:   "var(--paper-deep)"             # +9% — drawer / footer when open
  surface-300:   "color-mix(in oklch, var(--paper-deep) 85%, var(--ink) 15%)"  # +12% — item-detail spread background
  hover-shadow:  "0 2px 12px -4px rgba(28, 26, 24, 0.18)"  # ONLY on bento hover, ONLY on desktop, ONLY if !prefers-reduced-motion

# ── Motion ─────────────────────────────────────────────────────────────────
# 100/300/500ms scale per craft.md. `prefers-reduced-motion` reduces all to
# instant swaps; the color flood appears without transition.
motion:
  instant:       "100ms"
  base:          "300ms"
  immersive:     "500ms"
  ease-out:      "cubic-bezier(0.16, 1, 0.3, 1)"   # the existing app's sumi-e brush curve
  ease-in-out:   "cubic-bezier(0.4, 0, 0.2, 1)"

# ── Z-stack (named layers) ─────────────────────────────────────────────────
z:
  canvas:        0
  card:          10
  rail:          50          # immersion-view thin top rail
  search-bar:    100          # database sticky search
  drawer:        500          # English / cultural notes collapsed footer
  modal:         1000         # rare — only for accessibility settings

# ── Breakpoints (mobile-first, the existing app's values) ──────────────────
breakpoints:
  phone:     "480px"
  tablet:    "768px"
  desktop:   "1024px"
  wide:      "1440px"

# ── Grid columns per surface ───────────────────────────────────────────────
grid:
  flavors-bento:
    phone:    2
    tablet:   4
    desktop:  5     # 5×2, matches 10 flavors
  textures-bento:
    phone:    2
    tablet:   4
    desktop:  5     # same shape, 10 textures
  edibles-category-tiles:
    phone:    2
    tablet:   4
    desktop:  4     # 4×2, matches 8 categories
  edibles-item-grid:
    phone:    3
    tablet:   5
    desktop:  6     # dense; items are smaller than category tiles

---

# Flavors & Textures + Edibles Database — `DESIGN.md`

> Token block above is the source of truth. Prose below explains the rationale and the do/don't rules that govern build decisions.

---

## 1. Overview

The sub-system inherits the Nihongo app's editorial language — ink and paper, sumi-e brush motifs, vertical Japanese typography, three-role type system, monochrome chrome with color confined to artwork — and *extends* it in exactly one place: the immersion view of the flavors and textures pages, where the canvas commits its full color budget to the active word.

This commit is the design's signature. Most editorial designs reserve color for illustration; this sub-system reserves color for the *encoded sensory primitive*. Yellow doesn't appear on the すっぱい page because lemon illustrations happen to be yellow; yellow appears because *suppai is yellow.* The flood is the encoding. Strip it out and the page no longer teaches sourness — it just shows a picture of a lemon.

Everywhere outside the immersion view, the system stays inside the app's existing palette. Bento card fronts are paper-on-paper with a small color *chip* as the only flood preview. Item detail pages are paper-on-paper with the flavor and texture badges carrying small chips. Category tiles are paper-on-paper with kanji and a photographic icon. Chrome — sidebar, route header, search bar — never floods.

The textures page is intentionally quieter on color. Textures don't map to color the way flavors do; they map to mouth-feel and sound. The page swaps color flood for a *paper-tint shift* and a *brushed motion-line* under the doubled-kana centerpiece. The motion line is the visual signature for the texture: a soft bouncing line under もちもち, a sharp angular line under さくさく, a wet drag-line under ねばねば. The motion line carries the same role color carries on the flavors page — it *is* the encoding, not decoration of it.

The Edibles Database is the busiest surface visually, because it has the most content per square pixel, but it stays inside the editorial language by leaning on the existing food-gallery treatment: photographic images on paper canvas, kanji-as-identity, badges as the only chromatic flourish.

---

## 2. Colors

Three color systems, layered.

### 2.1. Foundation (inherited)

Ink and paper, plus two restrained accents the existing app already uses sparingly: vermilion (sumi-e signature red) and gold (clock markers, key emphasis on the writing/datetime page). These tokens never change for this sub-system. Don't reach for the accents inside the flavors / textures / database surfaces — they belong to the wider app, and using them here would pull the surface back toward chrome and away from the sensory commit.

### 2.2. Per-flavor color worlds (the signature)

Ten flavors, ten triples. Each triple carries:

- **`--flood`** — the viewport-fill color on the immersion view. Desaturated enough to keep type legible at 100vh. Some flavors flood light (oishii cream, amai pink, suppai yellow, sawayaka mint, tsumetai cyan, shoppai blue) — these use **dark ink**. Some flavors flood dark (karai crimson, nigai espresso, atsui ember) — these use **light ink** (paper or near-paper).
- **`--ink`** — the type color paired with the flood. Chosen so contrast ratio against the flood is ≥ 7:1 for the kana centerpiece (display weight) and ≥ 4.5:1 for body copy in the drawer.
- **`--chip`** — the small color swatch shown on the bento card front. More saturated than the flood (a chip is a *preview*, a flood is an environment); typically 1.4–1.8× the saturation of the flood.

**Justification for each color choice** — these are not arbitrary:
- **おいしい** = warm cream → the *anchor* flavor, near-neutral, umami warmth. Floods feel "delicious in general."
- **まずい** = sallow olive → the *rejected food* shade. Sickly green-yellow. Most learners read this color as "off" before they read the kana.
- **甘い** = sakura pink → strawberry shortcake, mochi, ringo-ame. Soft, sweet, slightly feminine in the Japanese sweet-color register.
- **辛い** = chili crimson → high-saturation red, active heat. The only flavor that floods *darker* and uses cream ink — visual heat.
- **しょっぱい** = sea-salt blue → brine, chip-bag silver-blue, the cooler salt-water register (vs the warm salt-on-skin register).
- **酸っぱい** = lemon yellow → the universal citric-acid color, no surprise.
- **苦い** = espresso → dark roast, the only fully-dark flood. Coffee, beer foam, charred fish skin.
- **熱い** = ember → thermal heat, warmer than chili-heat. Closer to terracotta than to fire-engine red. Distinguishes from karai by being orange-leaning.
- **爽やか** = mint-water → cool refreshment, mid-saturation cool green.
- **冷たい** = ice cyan → cold without being white. Closer to glacier-edge than to pure ice (which would be untintable).

### 2.3. Texture paper-tints

Textures don't flood. They shift the paper. Each texture's tint is a slight warm/cool/yellow/green push on the base paper color — subtle enough that a learner moving between two texture pages reads the shift as *mood change*, not *color change*. The tint is paired with the brush-motion line; the motion line carries the encoding, the tint carries the ambient register.

### 2.4. Color usage rules

- Color floods ONLY on the active immersion view. Never on bento cards, never on chrome, never on the database.
- Color chips on bento card fronts are ≤ 24×24px. They preview the flood, they don't *become* the flood.
- Flavor badges on item-detail pages use the `--chip` token, not the `--flood`. Chips are surface-level decoration; floods are environment.
- Texture badges use a neutral paper-deep + ink treatment, *not* the texture tint. The tint belongs to the texture page, not to a chip elsewhere.
- The vermilion and gold accents inherited from the wider app stay out of this sub-system entirely.

---

## 3. Typography

The existing three-role system carries through, unchanged in family and weight rules, but the *sizes* push much larger inside the immersion views. The kana centerpiece on a flavors immersion view is `clamp(6rem, 18vw, 18rem)` — a single character (or two, for double-mora words like すっぱい) takes a third of the viewport width. This is intentional. The huge size lets the word land as *visual form*, not as something the user has to decode. At small sizes, a learner reads characters; at this size, a learner sees a shape.

The textures kana centerpiece is slightly smaller (`10rem`) because doubled-syllable words (もちもち, さくさく) are wider — the smaller size gives them room to breathe. The doubled syllables are intentionally written without compression — もち+もち, with a hair of extra space between the two halves, so the reduplication reads.

Furigana is `14px` regardless of host size. Always present above any kanji that hasn't appeared in the visible viewport already. The first-timer persona depends on this.

English is `16px` body weight, restricted to the collapsed drawer. It never appears in display sizes anywhere in this sub-system — that would re-introduce the translation crutch the whole pedagogy is designed to avoid.

### 3.1. Brand-vs-product-vs-editorial type rationale

Editorial register loosens the strict-rem-only rule that governs the product surfaces in the rest of the Nihongo app. The clamp-based responsive scaling on the immersion-view centerpieces is a deliberate exception, justified by the *case-study* depth of the page (one word per page, sit with it for minutes). The bento and database surfaces stay on fixed-rem sizes because they're browse-shaped (scan multiple items, predictable density wins).

The texture page leans heaviest on display weight (700) for the kana — heavier than the flavor page's 600 — because the doubled syllables need extra optical weight to read as a single word rather than as two separate kana clusters.

---

## 4. Elevation

The system is nearly flat. Paper-on-paper layering uses subtle background shifts (paper → paper-soft → paper-deep → paper-deep + ink mix) instead of shadows. The only drop-shadow in the whole sub-system is a soft hover lift on bento cards — `0 2px 12px -4px rgba(28, 26, 24, 0.18)` — and only on desktop, only when `!prefers-reduced-motion`. Touch devices don't get the hover lift; they get a card-down press-state instead (paper-soft → paper-deep on `:active`).

The immersion view doesn't lift its hero image — the image sits flat against the color flood. Lifting it would re-introduce product-shaped elevation cues that the pedagogy doesn't want; the flood does the work of *making the page feel like this flavor*, not the elevation.

Item-detail pages use paper-on-paper-deep-with-ink-mix (`surface-300`) for the spread background — a slight contrast against the canvas paper. The flavor and texture badges sit on `surface-100` (paper-soft) — one step up from the spread background, just enough to read as interactive without becoming buttons-on-tiles.

The collapsed drawer (English gloss, cultural notes) sits on `surface-200` (paper-deep) when open — visually heaviest, signaling *you've crossed a deliberate boundary into translation land*. The slight depth shift is the discipline pillar manifesting in visual hierarchy.

---

## 5. Components

Eight components carry this sub-system. Each is anatomized below; the build phase implements them.

### 5.1. `bento-flavor-card`

Paper card, `surface-100` resting. Contents stacked vertically with `lg` gap:

1. **Image-slot** (top, taking ~60% of card height) — the canonical food, square aspect, paper background showing around the image
2. **Kana label** (display weight, `bento-label` size) — the JP form, no English ever
3. **Color chip** (small swatch, 16×16px, paired with a tiny play-audio icon) — the flood preview + the audio affordance

Hover (desktop) raises with `hover-shadow`, scales image-slot to 1.02×, plays a soft `instant`-duration audio preview cue (not the full word — just a quick sound, ~120ms, identifying the card is alive). Click navigates to the immersion view for that flavor.

Touch (mobile) replaces hover with a press-state: paper-soft → paper-deep, no scale. First tap on a card does *not* play full audio (mobile users don't want surprise sound); the immersion view auto-plays once after the transition completes.

### 5.2. `bento-texture-card`

Same anatomy as `bento-flavor-card`, with two adjustments:

- The color chip is replaced with a *brush-motion icon* — a small SVG hint of the kana's mouth-feel line (soft bounce, crisp angular, wet drag, etc.)
- The kana label is larger and bolder (texture display weight 700, ~30px instead of 24px) to land the doubled-syllable shape

### 5.3. `immersion-view` (flavor variant)

Full-page flood. Layout:

```
┌─────────────────────────────────────────────────────────┐
│  thin-rail [9 small thumbnails] [active highlighted]    │  ← --rail z-layer, sticky top
├─────────────────────────────────────────────────────────┤
│                                                          │
│       [huge canonical image]      [kana centerpiece]    │  ← 50/50 split desktop
│                                    [play audio button]   │     stacked mobile
│                                                          │
├─────────────────────────────────────────────────────────┤
│  related foods row → [item1] [item2] [item3] [item4]    │  ← horizontal scroll
├─────────────────────────────────────────────────────────┤
│  [▾ English & cultural notes]                            │  ← collapsed drawer, footer
└─────────────────────────────────────────────────────────┘
```

The background is the flavor's `--flood` color. The image is on a slight paper-card backing (`surface-100` at 8% opacity over the flood — barely visible, just enough to keep the image's edge from disappearing into the flood). The kana uses the flavor's `--ink`. The audio button is a circle, `--chip` background, `--ink` icon. The related-foods row uses `surface-100` thumbnails over the flood. The drawer is closed by default; opening it raises a `surface-200` panel that pushes the rest of the view up.

Keyboard: ←/→ walks through the 10 flavors. Esc returns to bento. Space plays audio.

### 5.4. `immersion-view` (texture variant)

Same layout, but:

- Background is `paper` with the texture's `--tint` applied as a paper-tint overlay (`mix-blend-mode: multiply` at 60% opacity, so the existing paper texture still shows through)
- Under the kana centerpiece, a *brush-motion-line* SVG plays once on view entry (matching the texture's `--motion` style — soft-bounce, crisp-angular, wet-drag, sharp-thin, smooth-flow, airy-cloud, thick-melt, vegetal-snap, plump-bounce, hard-crunch). The motion-line replays on a tap on the kana.
- The kana is heavier (display weight 700) and slightly smaller (`texture-kana` size) than the flavor centerpiece

### 5.5. `related-foods-row`

Horizontal scroll strip. 4 thumbnails visible on desktop, 3 on tablet, 2 on phone with overflow scroll. Each thumbnail:

- Square aspect, image-slot, paper-soft backing
- Kanji + kana stacked below, small
- Tap → item-detail page for that edible

The strip's source data is the reverse-browse query: "items where `flavors` includes this flavor" (for flavor pages) or "items where `textures` includes this texture" (for texture pages). Limited to 8 max; if more exist, a final "+N more" tile links to a filtered database view.

### 5.6. `category-tile` (database entry)

Large paper card, `surface-100` resting. Contents:

- **Kanji** at `category-tile-kanji` display size (5rem)
- **Furigana** above (small, `furigana` style)
- **Photographic icon** to the right (or below on mobile) — a single representative image (apple for 果物, daikon for 野菜, salmon-sashimi for 魚)
- **Item count** small, footer of card ("12 items")

Hover lifts to `hover-shadow`. Click navigates to category-grid view.

### 5.7. `edible-item-card` (database item grid)

Compact card, paper-soft. Contents:

- **Image-slot** (top, square)
- **Kanji** display size (~`item-kanji-hero` reduced — about 2rem in grid context)
- **Kana** below kanji, body weight
- **Badge row** — two flavor chips + one texture chip (the *primary* sensory profile of the item)

The card is significantly smaller than the category tile because the grid is denser (6 columns desktop). Tap navigates to item-detail.

### 5.8. `edible-item-detail`

Full spread, two-column desktop (image left 5/12, identity + rest right 7/12), stacked mobile.

- **Image-slot** large, square aspect, paper-soft backing on `surface-300` spread
- **Identity** — kanji `item-kanji-hero` (6rem), kana below (body, large), romaji small below that, category tag a small label up top
- **Badges** — flavor badges (clickable, jump to flavor immersion) and texture badges (clickable, jump to texture immersion) on a single row below identity
- **Similar items row** — same anatomy as `related-foods-row`, but the query is "items sharing the primary flavor OR primary texture, excluding this one"
- **Drawer** — collapsed footer with English gloss + cultural notes (the dish's role in Japanese food culture, regional variations, seasonal availability)

### 5.9. `flavor-badge` / `texture-badge`

Small clickable chip, `radius: sm`, paper-soft background, ink text. Padding `xs` vertical, `sm` horizontal. Contains:

- The flavor or texture name in kana (small display weight, no English)
- For flavor badges: a tiny color dot (`--chip`) at the leading edge
- For texture badges: a tiny brush-motion glyph at the leading edge

Hover (desktop) raises slightly with `hover-shadow`. Click navigates to the flavor or texture immersion view.

### 5.10. `search-bar` (database)

Pinned to top of database route. Editorial chrome: a paper-soft input on the canvas, hairline `rule` border, no rounded "search pill" treatment (that's a product-register affordance). Placeholder text: `見つけたいもの…` ("what you're looking for…"). Accepts kanji, kana, romaji, English. Results render below the search-bar as a vertical list of `edible-item-card` thumbnails, dimmed to indicate "preview, click to commit."

---

## 6. Do's and Don'ts

### Do

- Withhold English on every card front. The reveal is always a deliberate action.
- Commit the canvas to the flavor's color world on the immersion view — that *is* the encoding.
- Pair every color flood with the kana label, the audio button, and the flavor name in the page heading. Color is a redundant cue, never the only cue.
- Use furigana on every kanji that hasn't appeared earlier in the same view.
- Let the texture kana be heavier and wider than the flavor kana — the doubled-syllable shape needs the weight.
- Use the existing image-slot custom element for every photographic image. It handles the variant probing, IndexedDB persistence, and lazy-loading the rest of the app depends on.
- Auto-play audio once on immersion view entry, then on demand. (Desktop only; mobile is on-demand from the first interaction.)
- Make every interactive surface a route — `/flavors/suppai`, `/textures/mochimochi`, `/edibles/ringo`. Bookmarkable, back-button-correct.

### Don't

- Don't put English on a bento card front, ever. Not even small. Not even "(en)" in parentheses. The whole pedagogy fails if this rule slips.
- Don't flood color on the textures page. Use paper-tints instead. Texture encodes through mouth-feel and sound; conflating it with the flavor encoding loses both.
- Don't use the vermilion or gold accents inside this sub-system. They belong to the wider app's chrome; importing them here pulls the design back toward decoration.
- Don't lift the immersion view's hero image with a shadow. The flood is the elevation. A drop-shadow would be product-shaped chrome.
- Don't paginate the bento. All 10 flavors visible at once is the contract. Mobile responsive collapse to 2 columns ≠ pagination — the user scrolls through everything in one viewport-stack.
- Don't autoplay-with-sound at viewport entry. The audio plays after the *first interaction*.
- Don't translate URL paths. `/flavors/suppai`, never `/flavors/sour`.
- Don't add a fourth icon family. The app uses sumi-e brush motifs and Heroicons; this sub-system stays inside both.
- Don't ship the database without at least 50 seed items. An empty database is not a feature; it's a regression.
- Don't add flavor or texture badges to category tiles. Category tiles describe a *family*, not a sensory profile — adding badges to them would imply that all fruits taste the same, which is false.
- Don't render the search-bar as a rounded "search pill" with a magnifying glass inside. Editorial chrome wants a paper input with a hairline border. Rounded pills are product-shaped.

---

## 7. Token naming rationale

Token names are named in this product's world, not in generic UI vocabulary:

- `--ink`, `--paper`, `--rule` (carried over from existing app) — these names belong to a sumi-e + editorial Japanese learning surface. Generic names like `--text-primary`, `--bg-default`, `--border` would erase the project's identity at the variable level.
- `--flavor-suppai-flood` — the flood color *belongs to* the suppai flavor, not to a generic "yellow-3" position in a palette. The name reads like the encoding it does.
- `--texture-mochimochi-tint` + `--texture-mochimochi-motion` — same logic. The names belong to the texture, not to a generic palette position.

If a future build introduces a new flavor or texture, the new tokens follow the same naming: `--flavor-<romaji>-flood` + `--ink` + `--chip` for flavors; `--texture-<romaji>-tint` + `--motion` for textures. Generic palette tokens are not added.

---

## 8. Cross-references

- `2026-05-26-flavors-textures.PRODUCT.md` — the strategic brief (users, pillars, restrictions, register, layout).
- `2026-05-25-kanji-n5-curriculum-design.md` — the existing kanji curriculum, which intersects this sub-system (some edible kanji like 林檎, 茶, 飯 already live in `FLASHCARD_CLASSES`; the database treats them as cross-references).
- Existing app code — `image-slot` custom element, `editorialFlashcardHTML` renderer pattern, `VOCAB_CLASSES` data shape, `food-gallery` book pattern, `isExperience` + `isComingSoon` sidebar bucketing flags. All inherited as-is.
