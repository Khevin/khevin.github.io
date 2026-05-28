# Flavors & Textures + Edibles Database — `PRODUCT.md`

> **Scope.** This brief is per-surface, covering the Flavors page, the Textures page, and the Edibles Database that connects them. It sits under `vocab → eating-out → interactive` in the Nihongo app. Companion: `2026-05-26-flavors-textures.DESIGN.md`.
>
> **Authoring rule (carry-over from `design-expert:plan` Gate 9).** Future `/design-expert:build` and `/design-expert:review` runs against this sub-system read `register:` and `layout:` from this file as canonical. Amend carefully.

---

## 1. Register & layout (the binding decisions)

| Field | Value |
|---|---|
| **`register:`** | `editorial` |
| **`layout:`** (Flavors + Textures pages) | `bento-grid → drill-in immersion` |
| **`layout:`** (Edibles Database) | `category-browse → item-detail`, with search overlay |
| **Connective layer** | reverse-browse rows linking the three surfaces (flavor → items; item → flavors; texture → items) |

Editorial register is inherited from the Nihongo app's established visual language (sumi-e brushes, paper textures, vertical Japanese typography, monochrome chrome with color confined to artwork, long-form jougo essays and particle lessons). The Flavors brief itself reinforces it: contemplative, immersive, sensory, single-thing-at-a-time. The Edibles Database adds product-shaped browse affordances (search, faceted filter) but stays inside the editorial chrome — same paper canvas, same ink palette, same vertical-title pattern.

The **bento → drill-in** pattern for flavors and textures answers two demands at once: *scan all ten at a glance* (the affordance the user's reference poster already trains them to expect) and *immerse in one at a time* (the affordance the printed poster cannot provide). The bento is the map; the immersion view is the territory.

The **category-browse → item-detail** pattern for the Edibles Database mirrors the existing eating-out `food-gallery` book — eight category tiles, each opening a grid of edible items, each item opening a detail spread. Search is overlaid, not the primary entry point: browse-first preserves discovery; search is a tool for users who already know what they want.

---

## 2. Users

Three personas, additive constraints.

### 2.1. The self-directed adult learner

> *On a quiet evening, app open beside a cup of green tea, encountering すっぱい for the first time — wanting to feel the sourness, see the lemon-yellow flood, hear the puckered すっぱい, taste the cheek-tightening sour — before they ever read the English word "sour."*

Roughly N5 kanji depth. Comes back daily. Reads slowly. Says new words out loud. Wants *acquisition*, not *translation*. Has 30–60 minute sessions, alternates between flashcards, jougo essays, and the eating-out experience. Hungry for associative learning that compounds — a word learned today should connect to a food they'll meet next week.

**Drives:** the no-English-by-default rule; the color-flood immersion view; the audio-on-tap-by-default mobile pattern; the reverse-browse rows that turn every flavor page into a discovery surface for foods.

### 2.2. The first-timer

> *Just finished learning hiragana yesterday. Opens the app curious about Japanese food. Cannot read kanji. Has zero context for 甘い, but has plenty of context for what sweet feels like.*

Assumes nothing about the user's kanji depth. The system must work cold — image-first, audio-first, color-first. Kana with furigana when kanji appears. The English gloss is available but reaches it through a deliberate action (tap-to-reveal, flip side, expand drawer).

**Drives:** the image-leads-the-card rule on the bento front; the kana-over-kanji default in the immersion view's centerpiece; the "tap to hear" prompt visible on every card; the search bar accepting romaji ("ringo") so a first-timer who only knows the sound can find the apple page.

### 2.3. The mobile learner

> *On a couch or commute, one-handed, touch-only, expects to tap a card and hear the word play immediately.*

No hover affordances; every hover-state must have a tap-equivalent. The color flood must remain legible at a small viewport (no white text on cream backgrounds; no thin type that vanishes when the flood is at 1× scale). Bento card touch targets ≥ 44×44px. Audio buttons reachable with one thumb.

**Drives:** the touch-first interaction matrix; the audio-on-card-open behavior in immersion view (auto-play once, then on-demand); the bento grid responsive break (2 columns on phone, 4 on tablet, 5 on desktop — never 1, which would erase the at-a-glance affordance).

### Accessibility — backstop constraint, not a fourth persona

Color flooding the viewport is the single highest-risk decision in this brief for screen-reader and low-vision users. Every flavor's color cue *must* double as a text or audio cue (the kana label, the audio button, the explicit flavor name in the page heading). Color is decoration on the immersion view, not the encoding. `prefers-reduced-motion` disables the bento→immersion cross-fade transition and renders an instant swap. Every interactive element keyboard-reachable; focus rings visible against every flavor's flood color.

---

## 3. Brand personality

Three pillars, capped at three.

### 3.1. Sensory

The whole sub-system trusts the body to do the learning the brain alone cannot. The word lands as image first, sound second, color third, written form fourth, English glossary fifth. Every surface earns its sensory weight: the immersion view commits the whole canvas to one flavor; the bento front withholds the English; the item detail leads with the photographic image and the audio button.

This is what separates this sub-system from every translation-shaped flashcard app — and from the rest of the Nihongo app, which is more contemplative than sensory. The Flavors / Textures / Edibles surfaces are louder, more committal to the sensory channel, more willing to flood the viewport with color and sound.

### 3.2. Patient

One thing at a time inside the immersion view. The bento is a map, but the immersion view is a meditation — *sit with すっぱい until you can feel it, then move on.* No information density race. No "in the next lesson…" call-to-action. No countdown timers. No engagement metrics. The page lets the learner stop.

This pillar also constrains the data model: the item detail spread doesn't try to show every related flavor + texture + season + region at once. It surfaces the *primary* flavor and texture in a hero treatment; secondary facets sit in a quieter drawer.

### 3.3. Disciplined

The pedagogical rules are strict and never compromised. English appears only after a deliberate action. Color flood is always paired with an audio + text cue. The bento card front is exactly one image + one kana label + one color hint — no English, no badges, no chrome. The system never wavers on its core contract, because the moment it does — the moment a "helpful" English label sneaks onto a card front — the multi-channel acquisition goal collapses into translation.

---

## 4. Restrictions (what this sub-system is NOT)

The bans are at least as load-bearing as the pillars. They land here to constrain every future build decision.

| # | Restriction | Why it's banned |
|---|---|---|
| 1 | **No English on a card's first state.** | English short-circuits the multi-channel encoding the system exists for. Reveals must be deliberate (tap, flip, drawer expand). |
| 2 | **No emojis as UI.** | Inherited from the Nihongo app's hard rules. |
| 3 | **No "did you know!" trivia chrome.** | The sub-system teaches; it does not entertain. Cultural notes are welcome inside the immersion view, in long-form prose, never as marketing-style chips. |
| 4 | **No paginated bento.** | All flavors / textures / category tiles visible at once on desktop. Pagination would erase the at-a-glance map and break the *scan + commit* interaction. (Mobile responsive collapse to 2 columns is fine — that's not pagination, the user still scrolls through everything in one viewport-stack.) |
| 5 | **No color flood without a paired non-color cue.** | A11y backstop. Every immersion view carries a kana label + audio button + explicit flavor name. Color is decoration, never the encoding. |
| 6 | **No motion that doesn't carry meaning.** | Cross-fades into immersion view = OK (signals state transition). Color flood reveal = OK (the page becoming this flavor). Decorative parallax, ambient particle drift, "delightful" micro-interactions on hover = banned. |
| 7 | **No translation in route paths.** | URLs use the Japanese romanization: `/flavors/suppai`, not `/flavors/sour`. The path is part of the encoding. |
| 8 | **No mixed icon families.** | Inherited rule. The existing app uses sumi-e brush motifs and the Heroicons family in chrome; this sub-system stays inside both. |
| 9 | **No translated quotation in chrome.** | If the page heading says すっぱい, it says すっぱい — not "Sour (suppai)" with the JP in parentheses. The English never leads. |
| 10 | **No autoplay-with-sound at viewport entry.** | A user landing on the page must not be ambushed by audio. Audio plays on the *first interaction* with the immersion view (click, tap, key), then on demand. |
| 11 | **No N3+ kanji in the bento card front without furigana.** | First-timer support. The bento label is always reachable by a learner who only knows kana. |
| 12 | **No flavor card without a color world.** | Every flavor token in the DESIGN.md color block. Adding a flavor without a color world is incomplete data. |
| 13 | **No edible item without a primary-flavor and primary-texture FK.** | The reverse-browse rows depend on it. An apple has to declare it is `[amai, suppai]` + `[shakishaki]` or the connective layer breaks. |
| 14 | **No flavor as a property of multiple unrelated entities.** | Flavors are a closed enum of ~10 sensory primitives, not a free-tag list. The same for textures. This keeps the reverse-browse rows tight. |
| 15 | **No "coming soon" placeholder copy in shipped surfaces.** | If a surface isn't done, it isn't in the sidebar yet (or it carries the existing `isComingSoon` flag and renders the canonical empty state). No partial pages dressed up as finished. |

---

## 5. The pedagogical thesis (carries forward into every build)

The sub-system rests on one claim: **Japanese acquisition stalls when the L2 form is paired to an L1 label.** The standard flashcard pattern (すっぱい ↔ "sour") makes the learner *retrieve* English instead of *perceiving* Japanese. Once the pairing is stamped, the brain stops feeling the word.

The fix is **multi-channel encoding with English as last resort.** Each flavor and texture word lands across six channels, in this order:

1. **Image** — the canonical food (lemon, chili, mochi). Pre-linguistic. Carries the concept itself.
2. **Color** — a sensory palette flooding the viewport when the word is active. Yellow for すっぱい. Crimson for からい. Espresso for にがい.
3. **Audio** — native pronunciation, two speeds (slow + normal). The word's *sound shape*.
4. **Onomatopoeia link** — the texture or bodily-reaction word that travels with the flavor. すっぱい+うっ. からい+ピリピリ. もちもち+chewy bounce.
5. **Form** — the kana (and, for some, kanji) written large, alone, no English beside it. The written word as gestalt.
6. **Co-occurrences** — foods that carry this flavor, surfaced as a reverse-browse row. Flavor as a *property of the world*, not a label.

**English is the seventh channel.** Always available, never the path of least resistance. The user has to *want* the translation — tap, flip, expand a drawer. The English appears, satisfies the curiosity, then the user closes it and the page returns to the Japanese encoding.

This rule applies to flavors, textures, *and* the edibles database. The whole sub-system runs on it. Every UI choice answers to it: card fronts withhold English, immersion views relegate English to a collapsed footer, item detail pages put the kanji-and-kana name at the top and tuck the English into a sub-line.

The rule isn't *anti-English*. It's anti-shortcut. English remains the safety net for a learner who is stuck — but the page makes them work to get there.

---

## 6. The information architecture (where the surfaces live)

The sub-system adds three surfaces inside the existing `eating-out` vocab class, in the `interactive` sidebar bucket.

```
eating-out (vocab class)
├── interactive
│   ├── 体 Experience              (existing — random restaurant scene)
│   ├── 絵 Food vocabulary          (existing — SVG gallery)
│   ├── 味 Flavors                  ← new (Phase 1)
│   ├── 食感 Textures               ← new (Phase 2)
│   └── 食材 Edibles Database       ← new (Phase 3 — placeholder until built)
└── books
    └── (existing yatai, sushi, ramen, etc. — untouched)
```

The current placeholder `Flavors & Textures` book (added in the previous task with `isComingSoon: true`) splits into two: **Flavors** (the 10 cards already authored on the user's reference poster) and **Textures** (a parallel surface with onomatopoeia-led words). The third new entry **Edibles Database** is a separate book whose data model is locked early (Phase 3 scaffolding) and whose UI lights up in Phases 3–5.

Splitting flavors from textures matters: the two word classes have different sensory primitives (flavors map to color cleanly; textures map to mouth-feel and sound). A combined page would force a compromise on both. Two pages, same engine, lets each surface its native channel.

---

## 7. Surface contracts

The shape of each surface is locked here at the brief level. The component-level details belong in `DESIGN.md`; the page-level intent belongs here.

### 7.1. Flavors page (`vocab/eating-out/flavors`)

**Two states, one page.**

- **Bento state (default).** Top of page: 10 paper cards in a 5×2 desktop grid (4×3 tablet, 2×5 mobile). Each card shows the *image* (the canonical food), the *kana* label (no English), a *color hint* (a small swatch or paper-tint), and a *play-audio* affordance. No English glossary visible.
- **Immersion state (drill-in).** Click a card → the page transforms: the bento collapses to a thin top rail of 10 small thumbnails (current flavor highlighted); the body floods with the flavor's color world; the canonical image enlarges to a full hero block; the kana centerpiece is huge; an audio button plays slow + normal; a related-foods strip surfaces 4–8 edibles from the database that carry this flavor; the English gloss is tucked into a collapsed footer drawer that the user must explicitly open.

**Navigation between flavors in immersion state.** The top rail of thumbnails is clickable. Keyboard arrows (←/→) walk through the 10 in order. The back button returns to the full bento.

**Pages, not modals.** The immersion state is a route (`/flavors/suppai`), not a dialog. Bookmarkable. Browser back works. The transition between bento and immersion is a route-level cross-fade.

### 7.2. Textures page (`vocab/eating-out/textures`)

**Same bento → drill-in engine as Flavors, different sensory channel — and three deliberate departures from the Flavors-page conventions.**

#### Scene sentence (the brief in one breath)

> *On the train home, app open one-handed, encountering もちもち for the first time — wanting to feel the chewy bounce in the body before the brain reaches for the word "chewy." The doubled kana brushes across the left column; a soft squish plays; a wall of mochi, daifuku, sticky rice, and shokupan radiates across the right column — every food in the world that feels this way.*

This sentence determines every later decision: mobile-first one-handed orientation (touch-only audio button), kana-large left + food-collage right (the two-column immersion split), audio that plays a foley sound between the two readings (the sandwich pattern), no single canonical food (textures live across many foods — the *wall*, not one hero).

#### Three deliberate departures from the Flavors-page pattern

The Textures page is *not* a re-skin of Flavors. Three brief-level decisions diverge:

1. **No canonical food per texture.** Flavors pin one iconic food per word (suppai → lemon, amai → strawberry shortcake). Textures don't — シャキシャキ lives in lettuce *and* daikon *and* cucumber *and* apple; ふわふわ in pancake *and* whipped cream *and* shokupan *and* タイヤキ. Forcing a single anchor would lie about how textures distribute through food. Instead: every texture carries a `food-pool` of 4-8 edibles, surfaced as a collage.

2. **The bento card front carries a brushed motion-line glyph, not a food image.** The 10 bento cards become a wall of ink-on-paper texture-glyphs — もちもち is a soft sine wave, さくさく an angular sawtooth, とろとろ a sagging arc with a drip, シャキシャキ a row of short vertical hatch-lines. *The texture IS its glyph.* The kana label sits below the glyph; no food appears on the bento card front. This is the strongest visual signature in the sub-system: pure brushed ink, no photos, ten different stroke languages on one grid.

3. **Color is a whisper, not a flood.** Flavors commit the whole canvas to one hue (chili crimson for karai, ember red-orange for atsui, espresso brown for nigai). Textures use *subtle paper-tints* — all 10 tints sit above ~92% lightness. The page reads as "the same paper, slightly tinted" rather than "this is the textures world." The motion-line glyph + doubled kana + food collage do the encoding work; the tint is sensory atmosphere, not category encoding.

#### Bento state

Ten paper cards in a 5×2 desktop grid (4×3 tablet, 2×5 mobile). Each card:
- **Image slot**: the texture's brushed motion-line glyph — a single ink stroke that visually IS the texture (see DESIGN.md `texture-treatments[*].motion-shape` for the 10 specific stroke languages).
- **Label**: the kana with the reduplication visible (もちもち, not just もち) — the doubling that makes the word *feel like the texture*.
- **Play-audio affordance**: the same speaker-icon-circle the Flavors bento uses, same sandwich audio pattern when pressed.

No English on the card front. No food image. No color flood — the card sits on the standard paper canvas; the glyph and kana do all the work.

#### Immersion state — the two-column split

Click a card → the page transforms: the bento collapses to a thin top rail of 10 small motion-line-glyph thumbnails (current texture highlighted); the canvas tints with the texture's paper-tint (subtle, ~92% lightness wash); the body splits left/right:

- **Left column (≈45% width)**: the doubled kana written huge (clamp 6rem → 18rem), the brushed motion-line shape below it, the speaker-icon-circle below that. Vertical stack, generous whitespace.
- **Right column (≈55% width)**: a 2×3 or 2×4 grid of edible thumbnails from the texture's `food-pool` — 6 to 8 foods that carry this texture, each a small image-only card (kana tooltip on hover/long-press). This is the "wall of foods" the scene sentence describes.

The collage is the texture's *answer* to "where does this texture live?" — not as a list of examples but as a saturated visual mosaic that reads "this texture is everywhere."

#### Audio — the sandwich pattern

Three-segment audio plays when the button is pressed (or on first interaction with the immersion view, per restriction #10):

1. **Word, slow** — もちもち read slowly, syllables separated
2. **Foley sound** — the texture itself: a soft squish for もちもち, a hard crunch for カリカリ, a wet stretch for ねばねば. One foley per texture, sourced/recorded as a Phase 2 build task (see DESIGN.md `texture-treatments[*].audio-foley` for the 10 sound briefs).
3. **Word, natural** — もちもち again, at speaking speed

The sandwich pattern anchors the meaning *between* the two readings: the brain encodes the word, then encodes the sensory phenomenon, then re-encodes the word now-attached-to-phenomenon. The foley is the channel that makes this page meaningfully different from the Flavors-page audio (which is just slow + natural).

#### Navigation

Same as Flavors. Top-rail thumbnails clickable; keyboard arrows ← → walk through the 10 in seed order; back button returns to full bento; route is `/textures/<id>` (e.g. `/textures/mochimochi`); browser-back works; cross-fade transition between bento and immersion respects `prefers-reduced-motion`.

#### The 10 textures (seed, locked)

`もちもち` (chewy/sticky-soft) · `さくさく` (crisp/flaky) · `ねばねば` (sticky/slimy) · `ぱりぱり` (crunchy/crisp-thin) · `さらさら` (smooth-flowing) · `ふわふわ` (fluffy/airy) · `とろとろ` (thick-creamy/melting) · `シャキシャキ` (crisp-fresh, vegetal) · `ぷりぷり` (plump-bouncy, seafood) · `カリカリ` (crunchy-hard, deep-fried).

Each carries `tint`, `motion-shape`, `food-pool`, and `audio-foley` per DESIGN.md `texture-treatments`. Future additions follow the same five-field shape; the list is bounded by what the project actually needs.

### 7.3. Edibles Database (`vocab/eating-out/edibles`)

**Three views, one data model.**

- **Category-browse (entry).** 8 large category tiles in a 4×2 desktop grid: 果物 / 野菜 / 肉 / 魚 / 穀物 / 乳製品 / 菓子 / 飲み物. Each tile carries the category kanji, the furigana, and a representative photographic icon. Click a tile → category-grid view.
- **Category-grid.** All items in the category laid out as a denser bento (e.g., 6×N grid). Each item card: image, kanji + kana stacked, two tiny *flavor badges* + one *texture badge* surfacing the primary sensory profile. Click an item card → item-detail view.
- **Item-detail.** Full spread. Image left (large), identity right (kanji huge + kana + romaji small + category tag). Below identity: flavor badges + texture badges (clickable, jump to the relevant flavors/textures immersion page). Below badges: a *similar items* row (other items sharing the primary flavor or texture). At the bottom of the spread: a collapsed *English + cultural notes* drawer.

**Search overlay.** A search bar pinned to the top of the database (sticky on scroll). Accepts kanji, kana, romaji, English. Results render as a vertical list of item-tile thumbnails. Search is a tool, not the primary entry — the user starts with browse by default, opens search when they have a specific target.

**Phase 3 seed inventory** — at least 50 items, ideally 80, spread across the 8 categories. Per-category targets:
- 果物 (fruits) — 12 (apple, mikan, strawberry, grape, melon, peach, pear, persimmon, banana, watermelon, kiwi, plum/ume)
- 野菜 (vegetables) — 14 (cabbage, daikon, carrot, onion, garlic, ginger, scallion, lotus root, eggplant, cucumber, tomato, mushroom-shiitake, spinach, edamame)
- 肉 (meat) — 6 (beef, pork, chicken, lamb, duck, horse)
- 魚 (fish & sea) — 14 (tuna, salmon, mackerel, sea bream, yellowtail, eel, octopus, squid, shrimp, crab, scallop, oyster, urchin, ikura)
- 穀物 (grains) — 8 (rice, noodles-soba, noodles-udon, noodles-ramen, bread, mochi-rice, rice-balls-onigiri, soba-cha)
- 乳製品 (dairy & eggs) — 4 (egg, milk, butter, cheese)
- 菓子 (sweets) — 8 (dango, daifuku, dorayaki, taiyaki, ohagi, manju, anko, kintsuba)
- 飲み物 (drinks) — 8 (green tea, matcha, sake, beer, water, coffee, oolong, mugicha)

Total ≈ 74. The data model is the contract; the actual list can grow.

---

## 8. Cross-linking — the connective tissue

The reverse-browse rows are what make the database pedagogical instead of dictionary-shaped.

| Surface | Connects to | How |
|---|---|---|
| Flavor immersion | Edibles items | "foods that taste this way" row, horizontal scroll of 4–8 item thumbnails sharing this flavor |
| Texture immersion | Edibles items | "foods that feel this way" row, same pattern |
| Item-detail | Flavor pages | flavor badges on the item are clickable chips → flavor immersion |
| Item-detail | Texture pages | texture badges on the item are clickable chips → texture immersion |
| Item-detail | Other items | "similar items" row — items sharing the primary flavor *or* texture |

These cross-links are not optional UI nice-to-haves. They are *the way the multi-channel encoding compounds*. Every flavor page becomes a discovery surface for foods; every food page becomes a sensory reframing. The user learns あまい on Tuesday, meets 林檎 on Wednesday, and the link surfaces both — *apple is the あまい I learned, and there are five more あまい foods to meet.*

---

## 9. What this brief explicitly does NOT decide

Scoping carefully so `DESIGN.md` and the build plan retain the right amount of freedom.

- **Component-level visual treatment** (paper texture stack, brush flourishes, exact corner radii, focus-ring style) lives in `DESIGN.md`.
- **The exact data shape** (field names, optional vs required, JSON structure) lives in the build plan. The conceptual model (item carries flavors+textures+category) is locked here; the wire format is not.
- **Phase boundaries and task decomposition** belong in the implementation plan that `superpowers:writing-plans` will draft from this brief.
- **Image renaming + webp conversion** (the 10 ChatGPT poster images currently in `images/vocabulary/`) is a Phase-1 build task, not a planning decision.
- **The exact size of the seed edibles inventory** — 50 vs 80 vs 100 — is build-plan scope. The minimum is 50; the per-category guidance above is a target, not a contract.
- **Audio sourcing** — whether the system records its own audio, uses TTS, or pulls from an open Japanese pronunciation corpus — is a build-plan decision. The brief commits to *audio exists for every flavor, every texture, every edible item.*
- **The exact set of texture words** beyond the Phase 2 seed of 10. The brief commits to 10 minimum; future additions follow the same shape.

---

## 10. Success criteria

The sub-system has succeeded when:

1. A user can learn すっぱい without ever seeing the word "sour."
2. A user who knows 林檎 can click "あまい" on its detail page and land on a flavor immersion view that surfaces 5+ other あまい foods they have not yet met.
3. A first-timer who can read only hiragana can navigate the bento, hear the audio, see the image, and *not get stuck* anywhere — every step has a kana or audio fallback for the kanji.
4. The mobile learner gets the same depth of encoding as the desktop learner — no hover-only affordances, no information hidden behind viewport width.
5. The eight category tiles in the database read as a *map of edible Japan* — a learner with no prior knowledge can scan them and recognize the world they describe.

Failure modes to watch for in `/design-expert:review`:
- English appearing on a bento card front (regression of the core contract)
- The color flood becoming decoration instead of encoding (a flavor page where the color could be swapped without changing meaning)
- The texture page borrowing the flavor page's color-flood — textures don't map to color, they map to mouth-feel
- Item-detail pages turning into dictionary entries (English up top, kanji as a footnote)
- The reverse-browse rows getting dropped because "the data isn't ready yet" (the data model has to be filled in — empty rows are a failure of Phase 3, not a UI shortcut)

---

## 11. Out-of-scope (don't build, even if tempted)

- **Spaced repetition / quiz UI** for flavors and textures. The page is a sensory artifact, not a memorization tool. SRS lives elsewhere in the app.
- **User accounts / progress tracking** for which flavors a user has "learned." The page is open browse; the user knows what they have seen.
- **Multi-language support** beyond JP + EN. The pedagogy is JP-acquisition-via-multi-channel-encoding; adding a third language fractures the encoding.
- **Procedural generation of new flavor / texture cards.** The set is closed. Curating manually is the point.
- **Recipe generation, meal planning, dietary filters.** This is a vocab acquisition surface, not a cooking app.
