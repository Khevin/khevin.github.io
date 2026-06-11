# Speaking Studio — Scoring-Algorithm Analysis & Improvement Plan · 2026-06-11

> Sources: full code extraction of the DSP pipeline (appendix `dsp-spec.md`; line refs are
> `nihongo/app.js` as of this date), a literature/tooling survey of pronunciation assessment
> (appendix `research-pronunciation.md`, fully sourced), and the binding product constraints in
> `2026-05-28-speaking.PRODUCT.md` (scores must derive from real signals; no perfect verdict; user
> audio never persisted; phoneme-level scoring was *deferred, not rejected* — and the v0.8 cloud-
> STT ban has already been deliberately lifted, so this plan is v1.0 territory).

## 1. The pipeline as built

**Capture** (app.js:14103–14302): `getUserMedia` (AEC+NS+AGC requested) → MediaRecorder → decode →
`trimToRealBuffer` for display/playback. Cloud STT (when key set) gets the **untrimmed** buffer —
a deliberate choice because trailing-silence trim clips devoiced endings (14216–14222). Transcript
comes from Google STT (`LINEAR16`, native sample rate, `ja-JP`, `model:"latest_short"`,
`maxAlternatives:1`; **only `results[0].alternatives[0]` is read**, no word offsets/confidence, no
speech adaptation — 14077–14101) or from a single kept-alive `webkitSpeechRecognition`.

**Analysis** (`scoreSpeakingAttempt`, 14769–14964):
1. `trimSilence` → `analyzeAudio`: 10 ms RMS frames; noise floor = 15th percentile; voiced
   threshold `max(0.014, 2.2×floor)`; ~50 ms smoothed envelope.
2. `detectSyllableNuclei`: local maxima ≥20% of global peak, merged unless a valley dips below
   70% of the quieter peak → the "mora beats."
3. **Content**: per-nucleus formants (downsample→8 kHz, 1024-pt FFT, Hamming, cepstral lifter
   L=30, F1∈[200,1000], F2∈[850,3000]) → nearest of 5 fixed log-space vowel prototypes → DTW vs
   the phrase's expected vowel string (gap 0.8; only i↔e/u↔o forgiven at 0.5). STT transcript
   Levenshtein vs kana/kanji (best of), with a forgiveness ramp (0.12→0, 0.80→1);
   `content01 = 0.8·stt + 0.2·formant` (or `0.30 + 0.55·formant` without STT).
4. **Rhythm**: beat count vs mora count (penalty 1.0/mora) 60% + interval-CV evenness 40%.
5. **Clarity**: inter-nucleus envelope modulation depth (72%) + SNR (18%) + audibility (10%).
6. **Pitch** (`scorePitchAtNuclei`, 14979–15039): NCCF F0 at each nucleus (±60 ms window,
   two-pass confidence gate 0.30→0.20) → binary H/L against the *speaker's own* 20/80-percentile
   midpoint → compared to the phrase's per-mora `['L','H',…]` by **proportional index**
   alignment → agreement remapped (0.5→0.32, 1.0→0.92), damped by count-match and coverage.
7. **Naturalness**: mean of the other three × (0.70 + 0.18·rate[4.5–9.5 mora/s] + 0.12·balance).
8. **Content gate**: normalized logistic (k=8, c₀=0.40) multiplies every dimension (rhythm carries
   it 65%, others 85–88%), `ease(γ=0.85)`, calibration `LIFT=1.07`, caps 98–99.

This is a *defensible heuristic system* — honestly built, no fake numbers, every score traceable
to a signal, exactly as the PRODUCT brief demands. The silence-gate history (the "WHOA" and
silence-scores-60 bugs) shows the calibration loop works. What follows is not a teardown; it's
where the model of Japanese speech inside the scorer diverges from actual Japanese speech, and
what that costs.

## 2. The flaw inventory (ordered by how much score-truth each costs)

### F1 — The scorer punishes *correct native* speech: devoicing, っ, long vowels ★ worst
- **Devoicing**: /i,u/ between voiceless consonants and utterance-finally devoice in Tokyo
  Japanese (です→[des], 好き→[s_ki]; ~7–15% of vowels in read speech). A devoiced mora produces no
  energy nucleus → the *correct* rendition loses a beat (rhythm countErr) **and** a vowel (DTW gap
  in content). A learner who says "desu" with a full vowel scores *better* than a native.
- **っ (sokuon)** is, by definition, a silent closure — it can never produce a nucleus, yet it
  counts in `moraCount` (14780). ちょっとまって (6 morae, 2 of them っ) has a structural rhythm
  ceiling of `countScore = 0.67` for a perfect utterance.
- **Long vowels / ー** contribute two entries to the expected vowel string but physically merge
  into one nucleus (no valley) → systematic −1 beat + DTW gap. Same for ん, which usually rides
  the neighbouring vowel's envelope (it's dropped from the vowel string — correctly — but not
  from `moraCount`).
- Aggravation: the recorder *deliberately* keeps the untrimmed buffer so STT sees devoiced endings
  (14216–14222), but `scoreSpeakingAttempt` **re-trims** at 14775 — re-introducing into the
  acoustic path exactly the clipping the capture path avoided.

**Fix (T1.1): an expected-*nuclei* model distinct from mora count.** From the phrase's kana,
compute `expectedNuclei`: drop っ; merge ー/repeated vowel into the preceding nucleus; drop ん
(or mark optional); mark devoiceable morae (/i,u/ whose consonant is in {k,s,sh,t,ch,h,f,p} and
whose *next* consonant is voiceless, plus phrase-final す/し especially です・ます) as **optional**
nuclei. Rhythm then scores `N` against `[minNuclei, maxNuclei]` (penalty only outside the range);
the expected-vowel string likewise gets optional slots (DTW gap cost 0 for skipping an optional).
~60 lines, pure JS, no UI change — and it stops teaching users to *avoid* native reduction.

### F2 — Heiban (flat) phrases mathematically can't score well on pitch ★ subtle and severe
The H/L threshold is the speaker's own 20/80-percentile midpoint (15012–15015) — it **always
bisects the speaker's range**. For a correctly-flat heiban phrase (こんにちは = LHHHH), the
speaker's natural micro-variation gets split into ~half H / ~half L labels regardless of how good
they are. 6 of the 22 phrases are heiban; their pitch dimension is noise. Conversely the
"agreement" baseline for binary labels is 0.5 by chance, which the remap acknowledges — but the
real fix is structural:

**Fix (T1.2): score pitch *steps*, not absolute labels.** The pedagogical content of Tokyo accent
is in the **transitions**: the initial L→H rise, the location of the one H→L downstep (or its
absence for heiban). Convert detected F0 (semitones, see F3) to per-boundary deltas; convert the
expected `['L','H','H',…]` to expected deltas (+1, 0, 0, …). Score: (a) initial rise present?
(b) downstep located at the right boundary (±1 mora)? (c) no spurious large drops? For heiban, the
score is "no downstep + sustained plateau," which a flat speaker now aces. This also enables the
error taxonomy the persona in the PRODUCT brief wants: *"downstep missing"*, *"downstep too
early"*, *"range too narrow"* — real diagnostics, from the same data.

### F3 — Pitch track fragility: octave errors, confidence overstatement, no continuity
`estimatePitchHz` picks the first peak ≥80% of the global NCCF max (octave-*down* guard) but has
no octave-*up* guard (a strong 2nd harmonic can win), and it reports the **global** max as the
confidence of a peak that may be 20% weaker (15078–15096). Each nucleus is estimated independently
— no temporal continuity at all.
**Fix (T1.3):** work in semitones; median-filter (5-point) across nuclei; when picking the lag,
also consider ±1-octave candidates and choose the one nearest the running median; report the
*chosen* peak's NCCF as `conf`. ~30 lines. (T3 upgrade path: YIN + Viterbi smoothing, or CREPE-
tiny in a Worker — see §4.)

### F4 — Proportional-index alignment breaks the pitch comparison on any count mismatch
`k = round((j/(M−1))·(N−1))` (15019–15023) assumes perfectly even beats; one missed/inserted beat
early misaligns *everything after it*. The vowel DTW already exists two functions up.
**Fix (T1.4):** reuse the same DTW (gap 0.8) to align detected nuclei to expected morae — keyed on
the vowel labels where available — and evaluate pitch deltas across *aligned* pairs only. ~40
lines, big stability gain for longer phrases.

### F5 — Vowel classifier: absolute prototypes, no speaker normalization, F2 floor clips /o/
Fixed prototypes (14630–14635) + log distance tolerate uniform scaling only; female/child tracts
shift F1/F2 non-uniformly (the i↔e and u↔o boundaries move) — and `vowelCost` then *forgives*
exactly those confusions at 0.5, masking systematic error. The F2 search floor of 850 Hz
(14622) sits **above** many male speakers' /o/ F2 (~700–850 Hz) → /o/ systematically lands wrong.
The "downsample" is a box average with fractional stride (no true anti-aliasing), and the fixed
L=30 lifter under-smooths low-F0 voices (harmonic ripple → spurious peaks).
**Fix (T1.5):** (a) widen F2 search to ~600–3000 Hz; (b) classify on `log(F2/F1)` (+`F1`) ratios —
ratios are far more speaker-invariant (Syrdal & Gopal 1986); (c) Lobanov-style per-utterance
z-scoring of F1/F2 across the detected nuclei (10–30 tokens per phrase is enough); (d) only then
re-tighten `vowelCost`. ~40 lines total. (Optional: scale lifter cutoff with detected F0.)

### F6 — Absolute amplitude constants assume one mic-gain regime
0.014 voiced floor, 0.012 trim floor, `rms/0.05` loudness, `peak/0.10` audibility, the SNR
denominator (14371, 14441, 14834–14835, 14880) are all absolute; AGC is *requested* but not
guaranteed (Safari). Clarity/SNR therefore shift with hardware.
**Fix (T1.6):** normalize the working buffer to a target RMS (or replace absolute terms with
floor-relative ones) before scoring. ~15 lines.

### F7 — The STT channel is leaving accuracy on the table (config-only fixes)
(14077–14101) — all of these are request-body changes, no algorithm work:
- **`speechContexts` phrase hints are absent** — the app *knows the expected phrase*; boosting it
  (and its kana) materially improves recognition of accented attempts. Single biggest STT win.
- **Only `results[0]` is read** — a pause between chunks (おはよう ‖ ございます) yields multiple
  result segments; the tail is silently dropped → a correct read scores as half-missing. Join all
  segments.
- **`maxAlternatives:1`** — taking the min edit distance across 5–10 alternatives is a strictly
  richer signal, free.
- **No `enableWordTimeOffsets` / `enableWordConfidence`** — free per-word timings (mora-rate,
  pause structure, long-vowel/geminate duration checks all become possible) and a confidence
  signal that correlates r≈0.5–0.65 with human pronunciation ratings (use as a *flag*, not a
  score).
- The transcript-similarity floor: `stringSimilarity` on raw kanji/kana mixes scripts — normalize
  both sides to hiragana (the kana the STT usually returns for short phrases) before Levenshtein.

### F8 — Naturalness is mostly an echo
`naturalness01 = trio_mean × modifiers` (14906–14913) re-reports the other three dimensions; only
rate and "balance" are new information, and balance penalizes legitimately spiky profiles (e.g.
great rhythm + weak pitch). The PRODUCT brief says each dimension should map to *one thing the
learner can do*. **Fix (T2):** once per-word timings or model-reference durations exist, make
Naturalness = prosodic timing: mora-duration evenness (nPVI/CV vs native bands), geminate/long-
vowel duration correctness, pause placement. Until then, consider renaming the chip "Flow" — or
fold rate into Rhythm and drop the fourth chip (the brief's 4-dimension contract is the binding
constraint; renaming its *meaning* is allowed, faking independence is not).

### F9 — The model audio is thrown away ★ the biggest untapped asset
`TTS.speak` fetches the Cloud-TTS MP3 **per play and discards it** (app.js:445–470). The studio
therefore compares the learner to a *symbolic* H/L string instead of to the very rendition the
learner just heard and imitated. Shadowing is imitation — the reference signal should be the model
clip.
**Fix (T2.1, reference-based scoring):** cache the synthesized MP3 per (phrase, voice, rate) →
`decodeAudioData` once → run the *existing* pipeline on it (envelope, nuclei, F0 at nuclei) →
score the learner by comparison: DTW between semitone-normalized contours (each speaker normalized
to their own voiced median — the standard inter-speaker trick), and mora-duration pattern
similarity from the aligned nuclei. Browser-TTS mode has no audio access → keep the symbolic path
as fallback. This single change upgrades pitch *and* rhythm *and* enables honest per-mora feedback,
all with code that already exists (the analysis pipeline runs unchanged on the model buffer).
Storage: in-memory Map + optional IndexedDB; model audio is not user audio, so caching it violates
nothing in the brief.

### F10 — Everything runs on the main thread (known, now part of this plan)
~18 FFTs + an O(N·lag) NCCF per attempt inside `mediaRecorder.onstop`. With T2.1 doubling the
analysis (model + user), move scoring to a **Worker** (transfer the Float32Array; the pipeline is
already pure functions over a buffer-view object — it ports as-is). The scoring functions live in
their own file after the split, which also unlocks unit-testing them in Node.

## 3. What to build, in order

| Phase | Items | Effort | Score-truth gained |
|---|---|---|---|
| **T0 — config week** | F7 all: phrase hints, join segments, alternatives, word offsets+confidence, hiragana-normalize; stop re-trimming for scoring (score the STT buffer minus a fixed pad) | ~1 day | STT accuracy ↑ sharply for accented + paused reads; duration data unlocked |
| **T1 — algorithm week** | F1 expected-nuclei model · F2 step-based pitch · F3 octave/median/conf fix · F4 DTW alignment · F5 ratio+Lobanov vowels · F6 level normalization | ~1 week | Correct native-like speech stops being penalized; heiban scoreable; pitch track stable; speaker-independent vowels |
| **T2 — reference week** | F9 model-audio caching + contour/duration DTW · per-mora feedback chips (which mora's step missed — the persona's ask) · F8 naturalness→timing · F10 Worker | ~1–1.5 weeks | Scores measure "how close to the model you just heard" — the actual shadowing contract |
| **T3 — later** | YIN+Viterbi or CREPE-tiny (tfjs, 6.7 MB) pitch · nPVI rhythm metric · sherpa-onnx CTC forced alignment for phone-level GOP (~14–50 MB models) · OJAD cross-check of authored pitch patterns | as desired | Research-grade accuracy; phoneme-level feedback (explicitly "deferred, not forgotten" in the brief) |

## 4. Validation — make score changes provable (do alongside T0)

The golden harness can't hear. Add a tiny fixture suite so every algorithm change is regression-
tested the way the DOM already is:
1. **Fixtures**: for 3–4 phrases, commit short clips: (a) Cloud-TTS rendition voice A (the
   "model"), (b) Cloud-TTS voice B (different speaker, correct — should score high), (c) a
   *wrong* phrase clip, (d) silence, (e) noise. (TTS-generated fixtures keep real voices out of
   the repo; a couple of genuine recordings can live locally untracked.)
2. **Assertions** (Node, reusing the extracted scoring module): monotonicity
   `score(b) > score(c) > score(d/e)`; speaker independence `|score(a)−score(b)|` small; heiban
   flatness scores high on heiban phrases (the F2 regression test); devoiced です rendition ≥
   fully-voiced rendition (the F1 regression test).
3. **Calibration log**: persist nothing per the brief — but print sub-score vectors in dev mode so
   tuning sessions have data.

## 5. Explicitly out of scope (per the brief, unchanged)
No per-user audio persistence; no verbal coaching sentences ("try dropping after の") until the
step-detection is proven; no "perfect" verdict; scores stay signal-derived. Everything above
sharpens the existing contract — four dimensions, each improvable by one nameable action — rather
than replacing it.
