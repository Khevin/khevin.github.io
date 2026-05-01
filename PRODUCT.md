---
name: Khevin Mituti — Portfolio
namespace: khevin-mituti/portfolio
sibling: khev-tools/design-expert
register: brand
voice: hybrid (editorial frame, first-person beats)
lane: kinetic editorial
---

# PRODUCT.md

> The strategic file. Audience, voice, pillars, bans, register. Read on every `/design-expert:build` and `/design-expert:review` against this surface. Amend rarely; never silently.

---

## Scene

**A design lead at a global product company opens this on a desktop, second tab, four minutes between meetings, deciding whether Khevin moves to the call.** A senior designer in peer-review mode arrives later — sometimes the same person, often a colleague the lead forwards a link to — reads the case studies for craft tells, and will read `DESIGN.md` if it ships.

The two readers are intersecting, not contradicting. The work has to skim cleanly for the first reader and reward depth for the second. Buzzwords flatten both audiences — they exit, separately, for the same reason.

This single sentence is the foundation. Every downstream choice — type density, project tile shape, color flood vs. ink, motion budget, case-study length — is rendered from it. When in doubt at any point in the build, return here.

---

## Users

### 1 · Hiring lead — "the second tab"

- Tuesday morning, desktop, between meetings.
- Goal: enough signal in 4 minutes to decide whether to take the call.
- Reads: hero, the project tiles, maybe one case study above the fold.
- Failure mode: the homepage is a logo wall.
- Success criterion: by minute four, this person can name what Khevin's role *is*, what he's done, and whether he's the kind of designer they want.

### 2 · Peer designer — "the critic"

- Reading on a desktop, sometimes a phone, often after-hours.
- Goal: assess craft. Will not be flattered.
- Reads: the case studies in full, then `DESIGN.md`, then revisits the homepage with a colder eye.
- Failure mode: case studies are after-the-fact reconstructions with round-number outcomes ("100% improvement") and no decisions named.
- Success criterion: by the end of one case study, this reader has seen at least three concrete decisions, named, with rationale.

### 3 · Mobile / a11y reader — "the constraint that protects everyone"

- A11y, screen readers, keyboard navigation. Both audiences read on phones at least sometimes — recruiters during commutes, peers across time zones.
- Motion respects `prefers-reduced-motion`. Every kinetic moment has a static fallback. Every hover-revealed item is also reachable by tab. The portfolio is operable without a mouse.
- Failure mode: the kinetic-editorial lane becomes "motion as default" and the page is unusable for anyone who turns motion off.

The personas don't contradict: the kinetic lane is the personality, not the load-bearing path. The hiring lead and the peer designer both want signal-to-noise; mobile/a11y demand the same thing structurally. If the design fails any one persona, it has been wrongly built — not wrongly briefed.

---

## Brand pillars (3, capped)

### Editorial
Long-form prose that earns its length. Sentences with rhythm. No headers shouting at empty pages. The portfolio reads like a magazine essay, not a deck. Source Serif 4 for display, italics where the voice leans, em-dashes used like Joan Didion uses them — once a paragraph, never twice.

### Hands-on
*"Diving into hands-on work"* is the spine of Khevin's career. Every case study names the work he did with his own hands — the screen, the flow, the framework, the call he ran — not the work the team did at large. When he led, the page says he led. When he handed off, the page says who he handed off to. Specific verbs only.

### Confident
Fifteen years, 100+ projects, real outcomes. The voice does not hedge, does not over-claim, does not perform humility. The hiring lead reads "I led the redesign" and trusts it because the next sentence is concrete. The peer designer reads it and trusts it because the third paragraph names a decision they've also had to make.

Three pillars is the cap. A fourth would dilute. *Calm authority* is the resulting register.

---

## Restrictions (the bans)

These are non-negotiable. Each is a known anti-slop tell and each one would, alone, weaken the page.

- **No "passionate about design."** AI default. Cheapens on contact. Banned in every register, every tone, every section.
- **No skill bars or star ratings.** Every senior portfolio that ships them weakens the page. Khevin's range is shown by the work, not by visualizing his self-rating.
- **No emojis as UI.** Emojis in long-form prose are tolerated where rare and earned. Emojis in nav, buttons, section labels, headings — banned.
- **No team-erasing "we."** "We" is fine when the work was actually shared. "We" is banned when Khevin led alone — the case study should say "I" then.
- **No round-number outcomes.** "Improved conversion 50%" reads as fiction. Real numbers (R$ 14.382 GMV / month, 47.2% drop in support tickets) with the unit, the timeframe, and the methodology if non-obvious.
- **No "Get in touch" CTA.** Verb-plus-object only. *"Email Khevin," "Read the Spaces case study," "See the project."*
- **No anonymous logo wall.** Every client logo that appears on the page is contextualized somewhere — what was the work, what was the role, what did Khevin actually do there.
- **No motion as decoration.** Direct cite from `design-expert/anti-slop.md`. Motion that does not communicate state, hierarchy, or affordance — banned, even in the kinetic lane.
- **No exclamation marks.** The voice is calm. The work speaks; the page does not yell.
- **No "Hi, I'm Khevin" hero.** That headline is the AI default for personal portfolios. The hero opens with the work, the role, or the line that earns the next scroll — never a wave.

---

## Register

**Brand.** This is a portfolio surface; memorability outranks product-grade consistency. The kinetic-editorial lane is licensed by this register. The hand is editorial; the rhythm is essayistic; the tokens borrow from print.

The portfolio is allowed to break product conventions for memorability — asymmetric layouts, oversized type, unconventional grid breaks, a custom cursor on hover targets — provided each break communicates *something* about the work or the reader's progress. Memorability for its own sake is decoration; memorability that earns recall is craft.

---

## Sibling relationship — `khev-tools/design-expert` ↔ `khevin-mituti/portfolio`

The two surfaces share a font stack, a token base, and a hand. They live behind a namespace dropdown in the nav:

```
khev-tools     / design-expert     ← the plugin (what Khevin makes for designers)
khevin-mituti  / portfolio         ← the work (what Khevin ships for clients)
```

The dropdown is the only structural indicator that they're related — visually, they are kin, not twins. Each surface owns its own register decision; both happen to be `brand` but design-expert leans more product-like in information density, while the portfolio leans more editorial in pace and rhythm.

The dropdown itself is a load-bearing component. Its UX is specified in `DESIGN.md` under *Components → Namespace switcher*.

---

## Out-of-scope

- Real-time content. No live blog feed, no Twitter embed, no Substack integration.
- Light-mode / dark-mode toggle. The page is one tone, considered, not two flipped.
- I18n / Portuguese variant of the site at v1. Khevin's working audience is global-English by default. A `/pt` localization can come later but is not load-bearing.
- A "now" page in the Derek Sivers sense. Folded into the homepage footer as a single line ("Currently leading product design at Lastro") — does not earn a route.
- A blog as a first-class feature. The Writing/Notes page is an *index* of links out, not a publishing CMS.

---

## Confirmed scope (v1)

1. **Homepage** — hero, about, responsibilities grid, client logos, three big project blocks, four mini case study tiles, contact footer.
2. **Three long-form case studies** — Favo, Spaces Parking, Amway. Each: hero, metadata, narrative sections (Background, Role/Challenges, Process, Outcomes), continue-to-next.
3. **Mini case study cards** — litcapital, v3rso, Z Money, awarelog Bluebee. Homepage-only, no dedicated page; one-sentence frame each.
4. **Process / how-I-think page** — pantheon-style, but for Khevin's working method instead of designers he listens to.
5. **Writing / notes page** — index of short-form posts. Each entry is a date + title + link out (Medium, Substack, etc.).
6. **Namespace dropdown** — global nav component shared between this surface and `khev-tools/design-expert`.

Six routes. Sixth is shared. The build sequence is in the DESIGN.md trailer (Gate 7).
