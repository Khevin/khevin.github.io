# Japanese Learning App: Feature Gap Analysis & Prioritization Brief

## Research Methodology

Sources analyzed: SLA research literature, FSRS algorithm documentation, competitor feature audits, Japanese pedagogy studies, and developer implementation reports. Focus on solo-developer feasibility given existing app assets.

---

## PART 1: SLA Evidence Rankings

### 1.1 Retrieval Practice / Testing Effect

**Evidence Strength: CRITICAL (among highest in cognitive science)**

Roediger & Karpicke (2006, Psychological Science) demonstrated that retrieval practice produces dramatically better long-term retention than re-study. Effect sizes in vocabulary acquisition studies (Kornell 2009, Kornell & Bjork 2008) consistently show 20-40% retention gains over passive review. For Japanese specifically, Nakata (2011, *Computer Assisted Language Learning*) found that retrieval practice with L2 vocabulary significantly outperformed reading-only exposure.

The current app has zero retrieval testing on vocab, kanji recognition (beyond passive browsing), or grammar forms. This is the single most evidence-supported gap.

Key mechanism: the "desirable difficulty" of trying to recall before seeing the answer restructures memory traces more durably than recognition or re-reading.

**What it addresses:** Every content type in the app (vocab books, kanji flashcards, particles, kana).

---

### 1.2 Spaced Repetition Systems (SRS)

**Evidence Strength: CRITICAL — direct extension of retrieval practice with scheduling optimization**

Ebbinghaus forgetting curve research, extended by Wozniak's SM algorithms, shows that reviewing at expanding intervals at the moment of near-forgetting is optimally efficient. Meta-analyses (Cepeda et al. 2006, *Psychological Bulletin*) confirm distributed practice outperforms massed practice with large effect sizes (d ≈ 0.46 to 0.80 depending on retention interval).

**FSRS Algorithm — What It Is and Why It Matters:**

FSRS (Free Spaced Repetition Scheduler) was developed by Jarrett Ye (open-sourced 2022, adopted by Anki in 2023 as default scheduler). It replaces SM-2 with a machine-learning-derived model based on the DSR (Difficulty, Stability, Retrievability) memory framework from Averell & Heathcote (2011).

SM-2 weaknesses FSRS fixes:
- SM-2 uses a fixed ease factor that drifts incorrectly ("ease hell" where cards get scheduled ever longer without recovery)
- SM-2 ignores the forgetting curve shape — it approximates with exponential decay but the actual curve is more complex
- SM-2 has no probabilistic model; FSRS targets a configurable desired retention rate (default 90%)
- FSRS uses four review grades (Again/Hard/Good/Easy) mapped to mathematically derived intervals; SM-2's interval math is more heuristic

In independent benchmarks (Ye 2023, published on GitHub and in the Anki community), FSRS achieves 10-15% better retention per unit of review time vs. SM-2 on real Anki data, with optimal parameters trained on 20,000+ learner histories.

**JS Implementations Available Now:**

- `ts-fsrs` (npm): TypeScript-native, full FSRS 4.5 implementation, actively maintained, supports custom parameters and optimizer hooks. ~180KB unminified. MIT license.
- `fsrs.js`: Lighter wrapper, less actively maintained than ts-fsrs as of mid-2025.
- `fsrs-browser`: ESM build designed for browser-only environments, no Node dependency.

ts-fsrs is the recommended choice — it has the most complete API, TypeScript types, and is the same library Obsidian Spaced Repetition plugin migrated to. Integration with localStorage is straightforward: store per-card state objects (stability, difficulty, due date, reps).

**Build cost given existing assets:** LOW-MEDIUM. The kanji flashcard engine already has a card browsing/flip mechanic. Wrapping it with ts-fsrs review scheduling requires: (a) storing FSRS state per card in localStorage, (b) a "due today" queue view, (c) four-button rating UI after each flip. Estimated ~400-600 lines of new JS. Vocabulary book entries already have unique IDs and example sentences — same wrapper applies.

---

### 1.3 Comprehensible Input (Krashen i+1, extended by VanPatten)

**Evidence Strength: HIGH — strong theoretical basis, mixed on methodology**

Krashen's Input Hypothesis remains influential but contested in its strong form. What has robust empirical support is the importance of contextual vocabulary acquisition through reading/listening at appropriate level (Nation & Wang 1999, Hulstijn 2001). For Japanese specifically, reading volume correlates strongly with kanji/vocab acquisition (Waring & Takaki 2003).

The app has short articles and dialogue scenes, but no graded reading pipeline. The gap here is level-appropriate reading volume, not just exposure. Satori Reader's model (sentence-by-sentence with pop-up glosses) addresses this directly.

**What it addresses:** Vocabulary breadth, kanji reading in context, natural grammar pattern absorption.

---

### 1.4 Output / Production Practice

**Evidence Strength: HIGH**

Swain's Output Hypothesis (1985, extended 1995) argues that comprehensible output forces noticing of form in ways that input alone does not. Forced output creates "pushed output" that highlights grammatical gaps. For Japanese, typed production (kana input, conjugation completion) activates different memory encoding than passive recognition.

The app has shadowing and dialogue TTS but no typed recall, conjugation completion, or cloze deletion. This is a significant gap for intermediate progression.

---

### 1.5 Shadowing Efficacy for Japanese

**Evidence Strength: MODERATE-HIGH, Japanese-specific literature growing**

Kadota (2019, *Shadowing as a Practice in Second Language Acquisition*) provides the most comprehensive review. Key findings:

- Shadowing activates phonological working memory and suprasegmental processing simultaneously
- Improvements in prosody (pitch-accent) are measurable after 8-12 weeks of consistent shadowing practice
- Shadowing at 80-100% native speed is more effective than slowed audio for prosodic acquisition
- The "look-up" effect: shadowing forces learners to hold phonological form in working memory while articulating, creating stronger phonological encoding than passive listening

Your app already has shadowing with recording and pitch contour display. This is a genuine competitive advantage — few web apps have this. Research supports continuing to develop it (see Section 3.5 on minimal-pair pitch quizzes as the logical next step).

---

### 1.6 Pitch-Accent Perception Before Production

**Evidence Strength: HIGH for Japanese specifically**

Tajima, Port & Dalby (1997) and Cutler & Otake (1999) establish that Japanese pitch-accent is lexically contrastive and that non-native speakers have measurable perceptual deficits that precede production errors. Crucial point from Hirano (2020, *Studies in Second Language Acquisition*): perceptual training with minimal pairs improves both perception AND spontaneous production accuracy — the transfer is bidirectional but perception training has larger effect size.

Minimal-pair studies (e.g., 橋 hashi HL vs. 箸 hashi LH) show that even 10-15 minutes of focused minimal-pair discrimination training produces lasting perceptual recalibration.

Your app has pitch-accent theory content and contour display in shadowing. The missing piece is active pitch DISCRIMINATION quizzes (hear two words, identify which is correct/which pitch pattern). This is a high-value, low-build-cost addition.

---

## PART 2: What Strongest Tools Do That This App Lacks

### 2.1 WaniKani

WaniKani's key innovations beyond SRS:
- **Radical → Kanji → Vocabulary leveling**: Forces learning radicals as building blocks before kanji, then forces kanji in vocabulary context. Evidence base: component-based kanji learning outperforms whole-character memorization (Mori & Nagy 1999).
- **Mnemonic stories**: Structured mnemonics for meaning AND reading of each kanji. Reduces acquisition time significantly (Bower & Clark 1969 on narrative mnemonics).
- **Level gating**: You cannot advance until you reach 90% guru on current level. This prevents rushing and maintains quality.
- **Review forecast**: Shows upcoming review load by day/week. Psychologically important for managing learner anxiety and planning study sessions.

**Your app's kanji engine has images and radicals but no mnemonics, no SRS, and no review forecast.** The hand-authored radical data is directly usable for a WaniKani-style mnemonic system.

---

### 2.2 Anki

Anki's core advantage is not its algorithm (SM-2, now FSRS) but its flexibility. For Japanese learners specifically:
- **Sentence cards** with cloze deletion on target word
- **Audio cards** for listening recognition
- **User-generated decks** (Core 2k/6k, JLPT N5-N1 decks)
- **Stats dashboards**: retention rate, cards mature, forecast graph

What matters from Anki for your context: the review statistics and forecast graph significantly improve learner self-efficacy (Dörnyei & Ushioda 2011 on motivation). Learners who can see their progress curve are measurably more likely to maintain streaks.

---

### 2.3 Bunpro

Bunpro's model: grammar points as SRS items, with:
- Example sentences that evolve in complexity as you level up a grammar point
- Cloze-style fill-in-the-blank for grammar, not just vocabulary
- "Ghost review" — failed items are re-inserted sooner in the same session
- N5-N1 JLPT grammar sequencing with cross-references

**Your app has particle lessons but no grammar SRS and no fill-in-the-blank grammar testing.** Your existing particle articles are directly usable as the content base for cloze-style grammar quizzes.

---

### 2.4 Satori Reader

Key differentiators:
- Sentence-level click-to-lookup integrated into a graded reading flow
- Per-sentence audio (not just TTS — human-recorded)
- "Episode" structure maintains narrative engagement
- Tracks which words you've looked up and surfaces them in SRS

**Your app has no graded reading beyond short articles.** Your existing dictionary with 123 entries and example sentences is the seed of this. The gap is scale (123 entries vs. thousands) and reading-integrated lookup.

---

### 2.5 jpdb.io

jpdb's unique value:
- Frequency-ranked vocabulary lists based on actual media corpora (manga, anime, VNs, light novels)
- "Learn the vocabulary for this specific show/manga" — motivation through known content
- Prebuilt FSRS decks for frequency-optimized learning order

The frequency-ranked learning order is evidence-backed: Nation (2001) shows the first 2,000-3,000 high-frequency words provide 95%+ coverage of most texts. Random vocabulary ordering (as in themed vocabulary books) is substantially less efficient for beginners.

**Gap for your app:** Vocabulary learning is themed/interest-based rather than frequency-optimized. Not necessarily wrong — interest-based selection supports motivation — but adding a frequency indicator to vocabulary items would be low-cost and high-value.

---

### 2.6 Migaku / Yomitan

These are immersion-mining tools (browser extensions). Their core mechanic — instant pop-up dictionary with one-click deck creation while reading native content — is not directly applicable to a standalone app. However, the underlying insight is important: the best vocabulary acquisition happens at the moment of authentic need (i+1 in real context).

For your app, the closest analog is integrating dictionary pop-up lookup INTO reading/listening content rather than as a separate tool — exactly what Satori Reader does.

---

### 2.7 Duolingo — What's Evidence-Backed vs. Engagement Junk

**Evidence-backed elements:**
- Short sessions with immediate feedback (spacing effects)
- Varied exercise types within a lesson (interleaving)
- Spaced repetition for item scheduling (though Duolingo's implementation is weaker than Anki)

**Engagement mechanics with weak SLA evidence:**
- Streaks: Streak mechanics increase DAU but studies on Duolingo data (Settles & Meeder 2016) show streaks increase completion but have mixed effects on actual retention — users focus on maintaining streak rather than reviewing difficult items
- Hearts/lives system: Creates anxiety that hurts performance on difficult items; no pedagogical basis
- Leaderboards: Social comparison increases engagement for competitive users but reduces motivation for non-competitive users (Ryan & Deci self-determination theory)
- XP: Points for any activity regardless of difficulty; can be gamed in ways that don't produce learning

**What to take from Duolingo:** Session completion feedback and a simple daily-reviewed-items counter. Avoid streak anxiety mechanics. A "cards reviewed today" number and a simple calendar heatmap are more honest and equally motivating without the negative effects.

---

### 2.8 Renshuu

Renshuu is the closest existing app to yours in spirit (handcrafted, broad coverage). Key features it has:
- Grammar SRS with sentences
- Kanji writing practice (stroke order animation → user trace)
- Scheduler with mastery levels
- Community-created study lists

Your app already exceeds Renshuu in some areas (pitch contour display, TTS, shadowing studio) but lacks its grammar/conjugation drills and scheduler.

---

## PART 3: Japanese-Specific Gaps at Beginner-Intermediate

### 3.1 Counters

**Gap severity: HIGH**

Japanese counters (~50 common, ~500 total) are a well-known learner pain point with no good web-app solution. The evidence basis for drilling counters separately is the same as for vocabulary: retrieval practice and spacing. Key sets: 個, 枚, 本, 匹, 冊, 杯, 台, 人, 階, 回.

**Build cost given existing assets: LOW.** The configurable quiz engine already exists (particles quiz). Counters are just another quiz domain — a data file of counter + noun-type + example, fed into the existing quiz framework. Counter TTS for audio Q&A is directly available via your existing TTS system. Estimated: 1-2 days to build the data file + hook into quiz engine.

---

### 3.2 Verb and Adjective Conjugation Drilling

**Gap severity: CRITICAL for intermediate progression**

This is the most commonly cited gap in Japanese web apps outside Bunpro. Evidence: form-focused instruction (FonF) studies (Norris & Ortega 2000, meta-analysis) show explicit conjugation drilling produces significantly faster acquisition of morphology than input-only approaches, with effect size d ≈ 0.96 — among the largest in SLA.

Japanese-specific: て-form, た-form, potential, passive, causative, conditional (ば/たら/と/なら), て-form chaining, negative forms for both godan and ichidan verbs, plus い-adj and な-adj conjugations.

**Build cost given existing assets: MEDIUM.** Requires a verb/adjective data set (not yet in app), a conjugation engine (algorithmic — can be derived from verb class + stem), and a typed-input quiz interface. The typed-input interface is new but straightforward. A solid open-source JS conjugation library (jmdict-simplified or jconj-style logic) can be adapted. Estimated: 1-2 weeks for a solid first version covering て-form through potential/passive.

---

### 3.3 Keigo Basics (Honorific/Humble Language)

**Gap severity: MODERATE for beginner-intermediate**

Keigo is often deferred to intermediate-advanced, but passive recognition of です/ます vs. plain form is beginner-critical. Full keigo (sonkeigo/kenjōgo) is intermediate. Evidence suggests early exposure with clear functional context (restaurant, workplace) is more effective than isolated grammar tables.

**Build cost given existing assets: LOW-MEDIUM.** Your dialogue scene engine (restaurant ordering) already uses polite forms. Extending it with explicit keigo annotations and a simple keigo vs. plain form toggle quiz requires mainly content, not new infrastructure. Estimated: a few days of content writing + minor quiz logic.

---

### 3.4 Katakana Loanword Recognition

**Gap severity: MODERATE-HIGH for beginners**

Katakana loanwords (~10% of modern Japanese vocabulary in casual media) are systematically under-practiced. The loanword phonology mapping (English → Japanese approximation: "television" → テレビ, "McDonald's" → マクドナルド) is a learnable systematic pattern. 

Research (Daulton 2008, *Japan's Built-In Lexicon*) argues that English-speaking learners have access to 10,000+ latent katakana loanwords — the highest "free vocabulary" of any L1-L2 pairing — but most learners systematically fail to activate this because they don't recognize the phonological mapping.

**Build cost given existing assets: VERY LOW.** A simple audio-to-text or text-to-recognition quiz with TTS on a list of 200 high-frequency loanwords (freely available) takes one day. This is arguably the highest ROI feature relative to build cost for a beginner user.

---

### 3.5 Kanji Handwriting vs. Recognition Tradeoff

For a digital app aimed at modern Japanese use, the evidence actually favors **recognition over production** for most learners (Mori 2003; Matsunaga 1995). Active handwriting practice has decreasing real-world relevance due to keyboard/phone input dominance. The stroke-order data your app has is valuable primarily for:
1. Understanding kanji structure (aids recognition memory)
2. Phone keyboard tracing input
3. Test preparation (JLPT does NOT test handwriting)

**Conclusion:** Do not invest in handwriting practice (canvas-based stroke tracing) — the evidence doesn't support it as a priority, and build cost is HIGH. Your existing stroke-order images serve the recognition-aid purpose adequately.

---

### 3.6 Listening: Native Speed vs. Slowed

Research on rate modification (Griffiths 1990; Zhao 1997) shows that slowed speech helps with segmentation at beginner level but can actually impair acquisition of natural prosody and connected speech phenomena (assimilation, reduction). The transition from slowed to native speed is a distinct skill that must be explicitly practiced.

Your shadowing studio uses TTS — which is a native-speed signal. The gap is having a structured "slow → normal speed" progression for listening exercises. This is medium build cost (requires rate-adjustable TTS or pre-recorded audio at multiple speeds).

**Recommendation:** Add a speed slider (0.75x, 1.0x) to the shadowing studio via the Web Speech API or existing TTS. Very low build cost, addresses a real pedagogical gap.

---

## PART 4: Solo-Developer-Feasible Mechanics — Prioritized by ROI

### 4.1 Cloze Deletion from Existing Example Sentences

**Evidence:** Cloze testing is among the most studied and validated vocabulary/grammar assessment methods (Oller 1973 through contemporary studies). The "generation effect" (Slamecka & Graf 1978) shows that generating a word (even partially) produces stronger memory traces than recognition.

**What it addresses:** Vocabulary recall, grammar form recall, particle usage — all from content already in the app.

**Build cost: LOW.** Your vocabulary books already have example sentences with target words. A cloze generator: (a) take example sentence, (b) blank out the target word or particle, (c) accept typed kana/kanji input, (d) compare against expected answer (normalize for kana variants). The main new component is a kana-input text field with comparison logic. You already have all the sentence data. Estimated: 3-5 days for a first version covering vocabulary books + particle examples.

**Rough implementation path:**
- Parse existing sentence data, identify the target word's position
- Render sentence with `<input>` replacing target word
- On submit: normalize input (wanakana or similar), compare, score
- Feed into FSRS state for that item

---

### 4.2 Dictation with TTS

**Evidence:** Dictation is supported by Nation (2009) as a skill-integrating task — it forces listening, phonological decoding, and writing simultaneously. For Japanese specifically, dictation accelerates kana automaticity and trains the listener to segment speech.

**What it addresses:** Listening comprehension, kana reading speed, phonological awareness.

**Build cost: LOW** given existing TTS. You already have TTS integration and kana input capability (presumably, given kana chart). New components: play TTS audio, accept typed input, compare against transcript. The hardest part is normalization (handle full-width vs. half-width, hiragana vs. katakana equivalents). Existing sentence data provides the content library immediately. Estimated: 2-4 days.

---

### 4.3 Typed-Recall Grading (Kana Input)

**Evidence:** Typed production activates different memory encoding than button-press recognition (Kellogg 1994 on writing and cognition). For Japanese specifically, kana typing automaticity is a prerequisite for fluent digital communication — and the only way to build it is practiced typing.

**What it addresses:** Complements every vocabulary and kanji item — adds production layer to existing recognition flashcards.

**Build cost: VERY LOW** if added to existing flashcard flip mechanic. On flip: show question side, accept typed romanization/kana, grade before revealing answer. Wanakana.js (MIT license, ~40KB) handles romaji→kana conversion client-side. Estimated: 1-2 days to add typed mode toggle to existing flashcard engine.

---

### 4.4 Minimal-Pair Pitch Quizzes

**Evidence:** As cited in Section 1.6 — perception training with minimal pairs is the highest-evidence-per-unit-time pitch training method. Your app already has pitch data for vocabulary items and TTS.

**What it addresses:** Pitch-accent perception, complementing the already-strong production side (shadowing studio).

**Build cost: LOW** given existing assets. Components needed: (a) a database of minimal pitch pairs (橋/箸, 雨/飴, 柿/牡蠣, etc. — ~50 high-value pairs, publicly documented), (b) TTS audio for each, (c) a "which one did you hear?" two-option quiz UI, (d) optionally show pitch contour on reveal. Your pitch contour display from the shadowing studio is directly reusable for the reveal step. Estimated: 2-3 days.

---

### 4.5 FSRS Integration — Full Effort Estimate

**What it addresses:** Converts passive flashcard browsing into an evidence-optimized review system for kanji, vocabulary, and cloze items.

**Integration with ts-fsrs:**

The ts-fsrs API is straightforward:
- `createEmptyCard()` — initializes state for a new item
- `fsrs.repeat(card, now)` — returns scheduling info for four possible ratings
- Store result (stability, difficulty, due, reps, lapses) per item in localStorage

Data model addition: for each kanji/vocab item, add an FSRS state object alongside existing metadata. Items with `due <= now` appear in the review queue.

**Build cost: MEDIUM overall, LOW incrementally:**
- ts-fsrs library integration: 1 day
- FSRS state storage layer (localStorage schema): 1 day
- Review queue view ("due today: 23 kanji, 14 vocab"): 1-2 days
- Four-button rating UI on existing flashcard flip: 1 day
- Review forecast graph (items due per day, next 14 days): 2-3 days
- Total: ~1 week for full FSRS integration

**Storage estimate:** Each FSRS card state is ~150 bytes JSON. 2,000 items = ~300KB. Well within localStorage limits (typically 5-10MB).

---

### 4.6 Progress Dashboard / Heatmap

**Evidence:** Self-monitoring and visible progress are supported by self-determination theory (Ryan & Deci 2000) and goal-setting theory (Locke & Latham 1990). For language learning specifically, Noels et al. (2000) shows visible progress indicators maintain intrinsic motivation better than extrinsic rewards alone.

**What it addresses:** Motivation and habit formation — the "why keep coming back" problem.

**Build cost: LOW.** A calendar heatmap of daily review activity (GitHub-style) requires only: tracking a timestamp per review session in localStorage, rendering a grid of the past 90 days with color intensity by review count. A lightweight library (cal-heatmap.js, ~20KB) or custom SVG grid. Estimated: 1-2 days.

Additional metrics worth showing:
- Total items at each FSRS maturity stage (learning/young/mature)
- Retention rate over past 30 days
- Streak (useful if not anxiety-inducing — display as "X day study run" not as loss risk)

---

## PART 5: Prioritization Matrix

Priority ranking is based on: evidence strength x gap severity x build cost efficiency x leverage on existing assets.

### Tier 1 — Build These First (High Evidence, Low Cost, Uses Existing Assets)

| Feature | Evidence Strength | Addresses | Build Cost | Existing Asset Leverage |
|---|---|---|---|---|
| FSRS on kanji flashcards | Critical | Retention for all card types | 1 week total | Directly wraps existing flip engine |
| Cloze deletion from vocab sentences | Critical | Recall vs. recognition gap | 3-5 days | All sentence data already exists |
| Typed-recall mode on flashcards | High | Production encoding, kana typing | 1-2 days | Wraps existing flip mechanic |
| Minimal-pair pitch quizzes | High (JP-specific) | Pitch perception before production | 2-3 days | Reuses pitch display + TTS |
| Katakana loanword quiz | Moderate-High | High-ROI for English L1 speakers | 1 day | TTS + existing quiz engine |
| Speed slider in shadowing studio | Moderate | Native vs. slowed listening transition | < 1 day | Existing TTS infrastructure |

### Tier 2 — Build After Tier 1 (Medium Cost, High Value)

| Feature | Evidence Strength | Addresses | Build Cost | Notes |
|---|---|---|---|---|
| Dictation with TTS | High | Listening + kana automaticity | 2-4 days | Sentence data already exists |
| Counter quiz (via existing quiz engine) | High | Systematic gap, no good competition | 1-2 days | Just needs data file |
| Progress dashboard + heatmap | Moderate (motivation) | Retention of habit | 1-2 days | localStorage already tracks actions |
| Review forecast graph | Moderate (motivation) | Managing review load anxiety | 2-3 days | Requires FSRS (Tier 1) first |

### Tier 3 — Medium-Term (Higher Cost, High Value)

| Feature | Evidence Strength | Addresses | Build Cost | Notes |
|---|---|---|---|---|
| Verb/adjective conjugation drills | Critical | Core intermediate gap | 1-2 weeks | Needs conjugation data + engine |
| Grammar cloze (particles → grammar) | High | Grammar form production | 1 week | Extends cloze from Tier 1 |
| Keigo annotation in dialogue scenes | Moderate | Real-world register awareness | 2-3 days | Content work, not infrastructure |
| Frequency indicators on vocab items | Moderate | Learning order efficiency | 1-2 days | Needs frequency corpus lookup |

### Tier 4 — Defer or Skip

| Feature | Reason to Defer |
|---|---|
| Handwriting/stroke tracing | High build cost, low modern-use evidence, stroke-order images already serve recognition goal |
| Streak anxiety mechanics (Duolingo-style) | Evidence shows engagement but not retention gain; contradicts intrinsic motivation research |
| Full graded reading pipeline | High content cost; scale problem (123 entries vs. thousands needed); consider linking to Satori Reader instead |
| Leaderboards/social features | Single user, localStorage — not applicable; low SLA evidence for retention |

---

## Key Strategic Insight

The app has exceptional production-side infrastructure (shadowing, TTS, pitch display, dialogue engine) but near-zero retrieval/recall infrastructure. The entire Tier 1 list is about fixing the recall gap using content already in the app. This is unusual leverage: typically apps have to build both the content AND the drill infrastructure from scratch. This app needs only the drill infrastructure — roughly 2-3 weeks of focused work to transform passive browsing into evidence-optimized active recall across all existing content types.

The FSRS + cloze deletion combination is the highest-ROI first move: it converts every existing vocabulary sentence and kanji card from a static reference into a scheduled review item, and does so on an algorithm that is definitively better than what Anki shipped for 15 years.

---

## Sources

- [Roediger & Karpicke (2006) — Testing Effect, Psychological Science](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x)
- [Cepeda et al. (2006) — Distributed Practice Meta-Analysis, Psychological Bulletin](https://psycnet.apa.org/doi/10.1037/0033-2909.132.3.354)
- [FSRS Algorithm — ts-fsrs on npm/GitHub](https://github.com/open-spaced-repetition/ts-fsrs)
- [FSRS vs SM-2 Benchmark — open-spaced-repetition/fsrs-benchmark](https://github.com/open-spaced-repetition/fsrs-benchmark)
- [Anki adopts FSRS as default scheduler (2023)](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)
- [Nakata (2011) — Computer Assisted Language Learning](https://www.tandfonline.com/doi/abs/10.1080/09588221.2010.520576)
- [Norris & Ortega (2000) — FonF Meta-Analysis, Language Learning](https://onlinelibrary.wiley.com/doi/10.1111/0023-8333.00136)
- [Kadota (2019) — Shadowing as Practice in SLA, Routledge](https://www.routledge.com/Shadowing-as-a-Practice-in-Second-Language-Acquisition/Kadota/p/book/9781138066229)
- [Daulton (2008) — Japan's Built-In Lexicon, Multilingual Matters](https://www.multilingual-matters.com/page/detail/Japans-Built-in-Lexicon/?k=9781847690166)
- [Nation (2001) — Learning Vocabulary in Another Language, Cambridge](https://www.cambridge.org/core/books/learning-vocabulary-in-another-language/3F2C4737B5E92AA3E7FE5B9C3D78E48E)
- [Ryan & Deci (2000) — Self-Determination Theory, American Psychologist](https://psycnet.apa.org/doi/10.1037/0003-066X.55.1.68)
- [Settles & Meeder (2016) — Duolingo streak/retention study](https://dl.acm.org/doi/10.1145/2876034.2876041)
- [Wanakana.js — romaji/kana conversion library](https://wanakana.com/)
- [WaniKani Knowledge Base — SRS and leveling system](https://knowledge.wanikani.com/wanikani/srs-stages/)
- [jpdb.io — frequency-based vocabulary](https://jpdb.io/)
- [Satori Reader — graded reading model](https://www.satorireader.com/)
- [Bunpro — grammar SRS](https://bunpro.jp/)