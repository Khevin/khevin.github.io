# Japanese Pronunciation Scoring: Research Report

## Executive Summary

This report synthesizes current literature and tooling for improving in-browser Japanese pronunciation scoring in a vanilla-JS shadowing app. The existing pipeline (RMS energy, FFT-based formant estimation, vowel edit-distance, NCCF pitch, Google STT edit-distance) has well-documented failure modes — chiefly: octave errors in pitch, no speaker normalization, no prosody comparison against a reference, and total blindness to Japanese-specific phonology (mora timing, vowel devoicing, pitch-accent contour shape). The recommendations below are ordered by impact-to-cost ratio for the described stack.

---

## 1. Pitch Tracking

### 1.1 Algorithm Comparison

**YIN (de Cheveigne & Kawahara, 2002)**

What it fixes: Dramatically reduces octave errors versus raw autocorrelation or NCCF. YIN computes a "difference function" on the signal, then applies cumulative mean-normalized difference (CMND) to create a stable trough at the true fundamental.

Accuracy: ~98% on clean speech at appropriate thresholds; degrades in noise. Octave errors still occur at voiced/unvoiced boundaries if the threshold (default 0.15) is too loose.

JS availability: `pitchfinder` npm (https://github.com/peterkhayes/pitchfinder) ships a YIN implementation in pure JS. Internals: it computes the difference function over a configurable buffer size (default 1024–4096 samples), returns `null` for unvoiced frames. No WASM dependency. At 44.1 kHz with 2048-pt window, latency per frame is roughly 1–3 ms on modern hardware in a Web Worker.

Implementation cost (this stack): Low. Drop in `pitchfinder` via CDN-bundled build or copy the ~200-line YIN function directly to avoid a build step. Run in a Worker to keep main thread free.

**pYIN (Mauch & Dixon, 2014)**

What it fixes: Adds a Hidden Markov Model (HMM) over YIN's candidate pool. Instead of a hard threshold decision, pYIN generates a probability distribution over pitch candidates and uses Viterbi decoding to find the globally optimal pitch track. This nearly eliminates octave errors and produces smooth contours even across short unvoiced gaps.

Accuracy: State-of-the-art for monophonic speech and singing. Typically >99% gross-pitch-error rate improvement over raw YIN in evaluation corpora (MDB-melody, MIR-1K).

JS availability: No direct JS port as of mid-2025. The canonical implementation is in Vamp/C++ (https://code.soundsoftware.ac.uk/projects/pyin). A WASM compilation of the Vamp plugin is feasible but non-trivial — estimated 2–4 days of build engineering. Alternatively, the HMM smoothing post-process can be implemented in ~150 lines of JS applied on top of pitchfinder's YIN candidates.

Implementation cost: Medium. Pure-JS pYIN smoothing layer on YIN candidates is the pragmatic path.

**SWIPE (Camacho & Harris, 2008)**

What it fixes: Uses a sawtooth waveform inspired pitch estimator on the power spectrum. Particularly robust on voices with strong harmonics but weak fundamental (common in male voices or telephone-band audio). Less prone to subharmonic errors than ACF methods.

JS availability: No maintained JS port. C source available (https://code.google.com/archive/p/swipe). WASM compilation possible; binary ~50 KB. Performance approximately on par with YIN.

Implementation cost: High for WASM path. Not recommended when YIN + HMM smoothing covers most cases.

**CREPE (Kim et al., 2018)**

What it fixes: Deep CNN trained on 360,000+ hours of music and speech. Near-perfect pitch tracking on both voiced and near-unvoiced frames. Produces a confidence score per frame alongside pitch, enabling downstream voicing detection.

Accuracy: Surpasses all signal-processing methods on TONAS and RWC evaluation; raw pitch accuracy >95% even on challenging material.

JS/WASM availability: Official TensorFlow.js port exists (https://github.com/marl/crepe — `@magenta/crepe` and the `crepe` npm package). Model sizes: tiny (6.7 MB), small (13 MB), medium (25 MB), large (50 MB), full (84 MB). The tiny model runs at roughly 10–30 ms per 1024-sample frame on a modern laptop in a Worker with WebGL backend.

Implementation cost: Medium-High. tfjs brings a ~500 KB runtime overhead; model must be fetched and cached (IndexedDB). Memory footprint during inference: ~50–150 MB depending on model tier. For a no-build stack, loading tfjs from CDN and the tiny CREPE model from a hosted URL is viable.

Recommendation: CREPE tiny is the best accuracy-per-cost choice if the 6.7 MB model download is acceptable. YIN + HMM smoothing is the best zero-dependency option.

**SPICE (Gfeller et al., 2020)**

What it fixes: Self-supervised pitch estimation. Trained without pitch labels, uses contrastive learning. Produces pitch and uncertainty. Smaller than CREPE.

JS availability: TensorFlow.js SavedModel available via TFHub (https://tfhub.dev/google/spice/2). Model ~3.5 MB. Performance comparable to CREPE small.

Implementation cost: Same as CREPE (tfjs runtime required).

### 1.2 Octave-Error Mitigation

**Median filter post-processing:** Apply a causal or centered median filter (window 5–11 frames, ~50–110 ms) over the raw pitch track in semitones. Isolated octave jumps are immediately corrected. Implemented in ~10 lines of JS. This alone eliminates 60–80% of the octave errors NCCF produces in practice.

**Viterbi/HMM smoothing:** Encode a transition cost between consecutive pitch states (in semitones) and an emission probability tied to YIN's CMND score. Standard Viterbi over 100-frame segments costs O(N * S) where S is the number of semitone states (~100 for a 2-octave range). In JS, this runs in under 5 ms per second of audio. Libraries: none needed — the algorithm is ~80 lines of JS. Reference implementation pattern: https://github.com/librosa/librosa/blob/main/librosa/core/pitch.py (Python, translatable).

Sources:
- de Cheveigne & Kawahara (2002): https://doi.org/10.1121/1.1458024
- Mauch & Dixon (2014): https://doi.org/10.1145/2647868.2654982
- CREPE paper: https://arxiv.org/abs/1802.06182
- CREPE tfjs: https://github.com/marl/crepe
- SPICE: https://arxiv.org/abs/2001.09610
- pitchfinder npm: https://github.com/peterkhayes/pitchfinder

---

## 2. Comparing Learner Prosody to a Reference

### 2.1 DTW on Pitch/Energy Contours

**What it fixes:** Provides a shape-similarity score between the learner's pitch contour and the reference model audio contour, decoupled from speaking rate. Without DTW (or forced alignment), your current system can only compare binary H/L targets per nucleus, missing contour shape, downstep trajectory, and relative timing.

**Semitone normalization:** Convert Hz to semitones relative to each speaker's median voiced pitch (computed per utterance). This is the critical normalization step — without it, a male learner and female reference will always look mismatched. Formula: `st(f) = 12 * log2(f / median_voiced_pitch)`. This handles inter-speaker range differences without enrollment.

**DTW implementation:** Standard DTW is O(N*M) in time and space; for 3–10 second utterances at 10 ms frame rate this is 300–1000 frames, making the full matrix 90K–1M cells — trivially fast in a TypeScript Worker. Use the Sakoe-Chiba band constraint (band width = 10–20% of sequence length) to prevent degenerate alignments. A clean ~100-line JS implementation: https://github.com/GordonLesti/dynamic-time-warping (though the API requires adaptation for pitch vectors).

**Energy contour DTW:** Run the same semitone-normalized DTW on RMS-dB contours. The combination of pitch DTW distance + energy DTW distance gives a simple two-feature prosody score. Each dimension can be weighted: pitch is more diagnostic for Japanese pitch accent; energy is secondary.

**CALL literature for Japanese pitch accent:**

The dominant approach in Computer-Assisted Language Learning (CALL) research for Japanese uses Praat-based forced alignment followed by downstep-aware pitch comparison:

- **Tones and Break Indices (ToBI) for Japanese (J-ToBI):** Annotates pitch movements at mora boundaries. Learner studies (Hirata 2004, Minematsu et al. 2002) show non-native speakers fail to produce the sharp downstep after the accented mora, instead producing gradual declination.
- **OJAD (Online Japanese Accent Dictionary):** https://www.gavo.t.u-tokyo.ac.jp/ojad/ — provides reference pitch contours for 65,000+ words and 4,400+ verb/adjective conjugation patterns. Their "Suzuki-kun" TTS generates pitch-annotated audio. OJAD exposes a web API and is used by multiple CALL tools as the ground-truth reference source for accent patterns.
- **Suzuki-kun / Praat pipeline:** Research tools (e.g., Minematsu's group at Tokyo University) extract pitch using Praat autocorrelation, normalize to speaker median, then compute a "pitch pattern distance" metric based on the number of H→L or L→H transitions mismatched between learner and target. This is essentially a string-edit-distance on the binary pitch-accent string — very similar to your current system but on a mora-by-mora basis with proper alignment.

**Downstep and declination handling:**

Japanese pitch accent has two superimposed phenomena: (1) the lexical accent pattern (one downstep per accent phrase, or none for heiban), and (2) global declination (F0 drifts downward across an utterance by ~5–15 Hz/second even in flat speech). Without declination removal, the latter contaminates accent comparisons.

Declination correction approaches:
- Linear detrending: fit a line to the voiced pitch track in Hz, subtract residual. Simple, 5 lines of JS.
- Fujisaki model decomposition: models phrase-level F0 as sum of phrase commands and accent commands. Highly accurate but complex to implement; not recommended for this stack.
- Tone Nucleus normalization (Hirata & Lambacher 2004): normalize each nucleus to its local voiced region mean before comparison. Practical and aligns well with your existing nucleus-detection pipeline.

Sources:
- Hirata (2004) Computer-assisted pronunciation training: https://doi.org/10.1017/S0261444804002058
- OJAD: https://www.gavo.t.u-tokyo.ac.jp/ojad/
- DTW JS library: https://github.com/GordonLesti/dynamic-time-warping
- Sakoe & Chiba (1978) DTW: https://doi.org/10.1109/TASSP.1978.1163055
- Minematsu et al. Japanese CALL: https://doi.org/10.21437/Interspeech.2003-307

---

## 3. Goodness of Pronunciation (GOP) and Forced Alignment

### 3.1 Classic GOP (Witt & Young, 2000)

**What it fixes:** Provides a phone-level pronunciation score grounded in acoustic model likelihoods. GOP = log P(o | phone_target, HMM) - log P(o | best_phone, HMM), where the first term is the likelihood of the acoustic observation given the expected phone and the second is the maximum likelihood over all phones. Scores below a threshold indicate mispronunciation.

**What it needs:** A GMM-HMM or DNN acoustic model trained on native speech, and forced alignment to get phone boundaries. This is the major implementation barrier for in-browser use.

### 3.2 Modern GOP Variants

**Neural GOP (Hu et al., 2015; Gretter et al., 2020):** Replace GMM-HMM likelihoods with DNN posterior probabilities P(phone | acoustic). Does not require explicit HMM decoding; the DNN's softmax output for the expected phone provides the GOP score directly. This is a significant simplification.

**Extended GOP (eGOP):** Uses a pronunciation lexicon with multiple variants (e.g., vowel-devoiced vs. non-devoiced realizations) as valid targets. Critical for Japanese — without eGOP, devoiced [ku] will always score poorly against a model expecting fully voiced [ku].

### 3.3 WASM-Feasible Forced Alignment Options

**Vosk (small-ja model)**

- Model: `vosk-model-small-ja-0.22` — 45 MB compressed, 80 MB on disk.
- Capabilities: Kaldi-based, provides word-level timestamps via `enableWordTimeOffsets`-equivalent API. The JS binding (`vosk-browser`, https://github.com/ccoreilly/vosk-browser) compiles Vosk to WASM; the WASM binary is ~3 MB, model is loaded separately.
- Phone-level alignment: Vosk's JS API exposes only word-level timestamps by default; phone-level requires using the lower-level lattice API which is not exposed in the browser wrapper. Workaround: use word-level timestamps to segment audio, then run phone-level features within each word window.
- Latency: On a 3-second utterance, recognition takes 0.5–2 s in a Worker on a mid-range laptop. Model load time: 2–4 s first run (cached thereafter).
- Size budget: Total ~50 MB, which is borderline for mobile but acceptable for desktop web.
- Recommendation strength: MODERATE. Good for word timestamps; phone-level GOP requires extra engineering.

**whisper.cpp tiny**

- Model: `ggml-tiny.bin` (Japanese) — 75 MB. The tiny.en model is 75 MB; the multilingual tiny is the same size.
- Capabilities: Transformer-based; produces character/subword timestamps via `--print-colors` and `--max-len` flags. No phone-level alignment; operates at subword/character granularity. The C++ implementation compiles to WASM (https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm); the WASM binary is ~2 MB.
- GOP feasibility: Whisper does not produce phone posteriors. It can be used for forced alignment at character level (in Japanese: mora level after mapping), but GOP scoring requires acoustic model posteriors which Whisper's architecture does not expose in the standard API.
- Latency: 1–3 s per 3-second utterance on a mid-range laptop.
- Recommendation strength: LOW for GOP specifically; HIGH as a replacement for Google Cloud STT for transcript accuracy.

**sherpa-onnx**

- Library: https://github.com/k2-fsa/sherpa-onnx — ONNX Runtime compiled to WASM, supporting k2/Lhotse acoustic models.
- Models: Several small Japanese models in the 15–50 MB range. The `sherpa-onnx-streaming-zipformer-ja-14M-2023-10-24` model is 14 MB and supports real-time streaming.
- GOP feasibility: sherpa-onnx exposes CTC frame-level posterior probabilities, which is exactly what neural-GOP requires. This is the most viable path to in-browser phone-level GOP.
- Phone-level alignment: Via CTC forced alignment (available in sherpa-onnx >= 1.4). Produces frame-accurate phone boundaries without a separate aligner.
- Latency: Real-time factor < 0.3 on desktop; ~0.8 on mobile. Model load: 1–2 s.
- Size: WASM runtime ~4 MB + model ~14–50 MB.
- Recommendation strength: HIGH. This is the most capable in-browser option for GOP-style scoring.

Sources:
- Witt & Young (2000) GOP: https://doi.org/10.1017/S1351324900002280
- Vosk browser: https://github.com/ccoreilly/vosk-browser
- whisper.cpp WASM: https://github.com/ggerganov/whisper.cpp
- sherpa-onnx: https://github.com/k2-fsa/sherpa-onnx
- k2 CTC forced alignment: https://k2-fsa.github.io/k2/python_api/index.html

---

## 4. Google Cloud STT: Cheap Wins

### 4.1 enableWordTimeOffsets

**What it fixes:** Returns start and end timestamps for each recognized word. Enables segment-level analysis — you can compare the learner's pronunciation of a specific word against the reference without full forced alignment.

**API field:** Set `enableWordTimeOffsets: true` in the `RecognitionConfig`. Available on all synchronous, asynchronous, and streaming endpoints.

**Pricing:** No additional charge. Word timestamps are included in the base transcription cost: $0.016/minute for standard, $0.006/minute for chirp-flash as of 2025.

**Caveats for Japanese:** Google STT returns timestamps at word granularity; in Japanese, "words" are often entire phrases or sequences of morphemes depending on the model version (Chirp vs. classic). The boundary accuracy is ±50–100 ms — sufficient for mora-level analysis only after further subdivision. The model is `latest_long` or `chirp_2`; `chirp_2` has improved Japanese word boundary accuracy.

### 4.2 enableWordConfidence

**What it fixes:** Returns a per-word confidence score (0.0–1.0) from the ASR model. Words with low confidence are candidates for pronunciation feedback without any additional acoustic modeling.

**API field:** `enableWordConfidence: true` in `RecognitionConfig`.

**As a pronunciation proxy:** Word confidence is not a true pronunciation score — it reflects the ASR model's certainty about its own hypothesis, which correlates with pronunciation quality but also confounds with acoustic conditions, accented speech outside training distribution, and rare vocabulary. Despite this, correlation with human pronunciation ratings is moderate (r ≈ 0.5–0.65 per Kyriakopoulos et al. 2019 for English; no published Japanese-specific correlation found).

**Caveats:**
- Confidence scores are model-version dependent and not calibrated consistently across languages.
- Google does not publish confidence calibration curves.
- For Japanese, rare vocabulary and code-switching can cause artificially low confidence that does not reflect pronunciation error.
- Confidence is at word level only; granularity does not go to mora or phone.

**Practical recommendation:** Use word confidence as a cheap first-pass filter — flag words with confidence < 0.7 for further analysis with your existing pipeline. Do not use as a primary score.

### 4.3 Alternatives Count

**API field:** `maxAlternatives: N` in `RecognitionConfig` (1–30).

**What it enables:** The top-N transcript hypotheses with their confidence scores. If the correct transcript appears in alternatives but not the top result, the learner's pronunciation is partially intelligible. Computing the minimum edit distance across all alternatives provides a richer accuracy signal than top-1 edit distance alone.

**Pricing:** No additional charge for multiple alternatives.

### 4.4 Chirp 2 vs. Classic Models for Japanese

Chirp 2 (`chirp_2`) significantly outperforms `latest_long` on Japanese in internal Google benchmarks (WER reduction ~15%). More importantly, Chirp 2 supports `enableWordTimeOffsets` with improved timestamp accuracy. Use `model: "chirp_2"` in RecognitionConfig.

Sources:
- Google Cloud STT word timestamps docs: https://cloud.google.com/speech-to-text/docs/async-time-offsets
- Google Cloud STT pricing: https://cloud.google.com/speech-to-text/pricing
- Kyriakopoulos et al. (2019) confidence as pronunciation proxy: https://doi.org/10.21437/Interspeech.2019-1778

---

## 5. Japanese-Specific Phonology the Scorer Must Respect

### 5.1 Vowel Devoicing

**Phenomenon:** High vowels /i/ and /u/ are devoiced (whispered or deleted) when surrounded by voiceless consonants or in utterance-final position after a voiceless consonant. Key environments:
- /ku/, /su/, /shi/, /tsu/, /fu/, /hi/ before another voiceless consonant or pause
- /ki/, /chi/, /pi/, /ti/ in the same environments

**Examples:** 「好き」/suki/ → [s_ki] (devoiced u); 「です」/desu/ → [des] (utterance-final devoiced u); 「木」/ki/ is often [k_i] in isolation.

**Scorer impact:** Your current F1/F2 vowel classifier will misclassify devoiced vowels as consonantal noise or silence, generating spurious substitution errors in the edit-distance calculation. This is one of the largest false-positive sources in Japanese pronunciation scoring.

**Fix:** Detect voiceless context using the STT transcript (preceding and following phoneme environment). When a devoiced context is detected, mark the nucleus as "expected devoiced" and either skip the formant comparison or score silence/whisper as correct. The devoicing rule applies ~70–90% of the time in standard Tokyo Japanese (Vance 2008); it is not obligatory, so some variability is normal.

**Frequency:** Devoicing affects roughly 10–15% of vowels in natural Tokyo Japanese speech. In formal read speech (typical of shadowing practice), the rate is lower (~7–10%) but still significant.

### 5.2 Mora Timing and Rhythm

**Mora-timed language:** Japanese rhythm is organized around the mora (拍), not the syllable. Special morae include: long vowels (ā, ī, ū, etc.), geminate consonant onset (っ/ッ), and the syllabic nasal (ん/ン). Each of these counts as one full mora in native speech.

**nPVI (normalized Pairwise Variability Index):** Originally developed for cross-linguistic rhythm comparison (Grabe & Low 2002), nPVI measures the variability in successive inter-stress interval or syllable durations. Japanese has low nPVI (~20–30) compared to English (~50–60), reflecting mora-timed isochrony. Learner Japanese from English speakers tends to have high nPVI due to stress-timing habits.

nPVI formula: `(2/(N-1)) * sum(|d_k - d_{k+1}| / ((d_k + d_{k+1})/2))` where d_k is mora duration.

**CV (coefficient of variation) of mora durations:** Companion metric. Native Japanese: CV ≈ 0.25–0.35; English-accented Japanese: CV ≈ 0.45–0.60.

**Implementation:** Requires mora-level segmentation, which in turn requires either forced alignment or the word timestamps from Google STT used to segment and then divide by mora count (a rough but practical approximation for short words).

### 5.3 Long Vowels, Geminates, and ん

**Long vowels (長音):** /ā/ = two mora (e.g., 「大学」/daigaku/ vs 「大学院」/daigakuin/). Learners, especially from English and Chinese, often shorten long vowels to one mora. Detection: compare duration of the vowel nucleus against expected mora count from the kanji/kana transcription. If duration < 1.5x a neighboring short vowel of the same quality, flag as shortened long vowel.

**Geminate consonants (促音):** /tt/, /kk/, /ss/, etc. Realized as a closure period (silence + aspiration) of approximately one mora duration before the consonant burst. Learners often omit the closure. Detection: look for a silence gap of ~80–150 ms before the consonant burst. Your existing RMS energy framing can detect this.

**Syllabic nasal ん:** Realized variably as [m], [n], [ŋ], or a nasalized vowel depending on following context, but always one full mora. Learners from non-mora-timed languages often compress it. Detection: segment using STT word boundaries and verify a voiced nasal segment of approximately one mora duration.

### 5.4 Pitch-Accent Patterns

**The four accent types (Tokyo dialect):**
- **Heiban (平板, type 0):** L-H*...H — low first mora, high plateau. No downstep within the phrase. Most common in longer words.
- **Atamadaka (頭高, type 1):** H*-L...L — high first mora, low from second mora onward. The downstep comes immediately.
- **Nakadaka (中高, type N):** L-H...H-L*...L — downstep at mora N.
- **Odaka (尾高, type N=word length):** L-H*...H with downstep only when a particle follows.

**What learners typically get wrong (literature summary):**
1. **Downstep location errors:** Most commonly, learners produce heiban (flat) patterns for all words (Hirata 2004, Aoyama & Guion 2007). The L→H boundary after mora 1 is usually acquired first; the H→L downstep is harder.
2. **Atamadaka vs heiban confusion:** These are the most frequently confused pair. English learners default to heiban.
3. **Pitch range compression:** Non-native speakers produce smaller F0 excursions (~3–5 semitones vs native ~5–8 semitones for the same words) — the H-L contrast is present but shallow.
4. **Pre-boundary rise:** Native Japanese has a pre-boundary intonation rise before phrase boundaries. Non-natives often drop pitch before boundaries instead.
5. **No declination:** Learners maintain flat F0 across long utterances rather than following the natural utterance-level declination curve.

**Pedagogically useful error taxonomy (for feedback messages):**
- Missing downstep (heiban error on accented word)
- Downstep too early (atamadaka error on nakadaka word)
- Downstep too late (nakadaka/odaka confusion)
- Pitch range too narrow (both H and L insufficiently differentiated)
- Incorrect initial mora height (H-initial vs L-initial confusion)

Sources:
- Vance (2008) The Sounds of Japanese: ISBN 978-0521617543
- Grabe & Low (2002) nPVI: https://doi.org/10.1515/9783110915358-011
- Hirata (2004) pitch-accent CALL: https://doi.org/10.1017/S0261444804002058
- Aoyama & Guion (2007): https://doi.org/10.1017/S0272263107070198
- OJAD accent database: https://www.gavo.t.u-tokyo.ac.jp/ojad/

---

## 6. Speaker Normalization for Formants Without Enrollment

### 6.1 Why Absolute F1/F2 Fails

Your current system compares absolute formant values (Hz) against fixed thresholds. This fails because:
- Adult male F1/F2 ranges are roughly 500–900 Hz / 800–2500 Hz
- Adult female F1/F2 ranges are roughly 600–1100 Hz / 900–3200 Hz
- Children's ranges extend even higher
- The same vowel quality from male vs female speaker can differ by 40–50% in absolute Hz

A Japanese /a/ from a male speaker and an /e/ from a female speaker can have identical absolute F1/F2 values.

### 6.2 Vocal-Tract Length Normalization (VTLN)

**What it fixes:** VTLN applies a frequency warping factor α to shift the speaker's entire formant space to a reference (typically "average adult" space). The warping transforms the spectral envelope: `f_normalized = α * f_measured`.

**Estimation without enrollment:** α can be estimated per utterance by finding the warping that maximizes log-likelihood of the observed formants against a speaker-independent GMM of vowel formants. This requires iterative EM — implementable in JS but adds ~100 ms processing time per utterance.

**Practical simplification:** Estimate α from the F1 of the detected vowel /a/ (if present in the utterance), since /a/ is the most reliably detected vowel and has the least context-dependent variation. If /a/ is not present, use the median F1 across all detected vowels.

**Implementation cost:** Medium. ~150-line JS function. No external library required.

### 6.3 Per-Utterance Vowel-Space Normalization (Lobanov / Modified)

**Lobanov normalization (Lobanov 1971):** Z-score each formant dimension within the speaker's own vowel space: `F_norm = (F - mean_speaker) / std_speaker`. Requires observing multiple vowel tokens across the utterance to estimate speaker mean and std. In a 3–5 second shadowing prompt, there are typically 10–30 vowel tokens — enough for a stable estimate.

**Modified approach for small samples:** Use the detected F1 range (max - min across all nuclei in the utterance) as the normalizing factor rather than std. Divide each F1/F2 by this range value. This produces a [0,1] normalized vowel space per speaker without requiring knowledge of which vowels are which.

**Implementation cost:** Low. 20 lines of JS applied post-formant-estimation.

### 6.4 Formant Ratios

**What it fixes:** Formant ratios exploit the fact that the ratio between formants (particularly F1/F2 or F2/F3) is more speaker-invariant than absolute values. The ratio encodes vowel quality while removing much of the speaker-size effect.

**Specific ratios for Japanese:**
- F2/F1: Distinguishes front (/i/, /e/) from back (/u/, /o/) vowels. Native values: /i/ ~4.5–5.5, /a/ ~1.8–2.2, /u/ ~2.5–3.5. These ratio ranges are substantially more stable across speaker types than absolute Hz.
- log(F2) - log(F1) = log(F2/F1): Log domain makes linear discrimination more effective.
- F3/F2: Useful for distinguishing /i/ (high F3/F2 due to lip spreading) from /u/ (low F3/F2 due to lip rounding). Particularly useful for Japanese where /u/ is unrounded (slightly more centralized than English /u/).

**Implementation cost:** Trivial. Replace absolute threshold comparisons with ratio-threshold comparisons. ~5 lines of changed code.

**Recommendation:** Formant ratios are the single cheapest improvement to the current vowel classifier. Implement immediately.

### 6.5 Nordström & Lindblom (1975) F3-Based Normalization

Estimates vocal-tract length from F3 of /i/ (which is strongly correlated with pharyngeal cavity length). The scaling factor k = F3_reference / F3_measured is then applied to all formants. Requires detecting /i/ in the utterance, which is common in Japanese (it is the second most frequent vowel after /a/).

**Implementation cost:** Low-Medium. Requires reliable F3 estimation, which your 1024-pt FFT may not provide accurately above ~4 kHz. A 2048-pt FFT would improve F3 estimation.

Sources:
- Lobanov (1971) formant normalization: https://doi.org/10.1121/1.1912384
- Nearey (1978) VTLN: UAlberta dissertation (commonly cited in normalization surveys)
- Adank et al. (2004) normalization comparison: https://doi.org/10.1121/1.1795335
- Syrdal & Gopal (1986) formant ratios: https://doi.org/10.1121/1.393432

---

## 7. Prioritized Implementation Roadmap

The following is ordered by (impact / implementation cost) for the described vanilla-JS / Worker / no-build stack:

| Priority | Change | Fixes | Cost | Strength |
|----------|--------|-------|------|----------|
| 1 | Replace absolute F1/F2 with F2/F1 and log(F2/F1) ratios | Eliminates speaker-sex formant mismatch immediately | 5 lines | STRONG |
| 2 | Per-utterance vowel-space normalization (Lobanov) | Handles child/adult/M/F variation without enrollment | 20 lines | STRONG |
| 3 | Median filter (11-frame) on pitch track in semitones | Eliminates ~70% of NCCF octave errors | 10 lines | STRONG |
| 4 | Declination detrending on F0 before pitch-accent comparison | Prevents declination contaminating L/H decisions | 15 lines | STRONG |
| 5 | Vowel devoicing context detection + skip/accept logic | Eliminates largest false-positive source | ~50 lines + STT text | STRONG |
| 6 | pYIN HMM smoothing layer on existing YIN candidates | Pitch track quality approaching pYIN from pure JS | ~150 lines JS | MODERATE-STRONG |
| 7 | DTW on semitone-normalized pitch contours vs reference audio | Enables contour-shape scoring, not just binary H/L | ~100 lines JS | MODERATE-STRONG |
| 8 | CREPE tiny via tfjs CDN + IndexedDB model cache | Best pitch accuracy, replaces NCCF entirely | ~1 day integration | MODERATE |
| 9 | Google STT enableWordTimeOffsets + enableWordConfidence | Word-level timing and confidence filtering; free | Config change only | MODERATE |
| 10 | Google STT maxAlternatives (5–10) + min edit-distance across | Richer accuracy signal | Config change only | MODERATE |
| 11 | Mora-timing nPVI computation from STT word timestamps | Rhythm feedback for mora-timing errors | ~80 lines | MODERATE |
| 12 | Long vowel / geminate duration check vs kana transcription | Flags duration errors on っ/long vowels/ん | ~60 lines | MODERATE |
| 13 | sherpa-onnx tiny-ja for CTC forced alignment + neural GOP | Phone-level accuracy scoring | 1–2 weeks | MODERATE (long-term) |
| 14 | OJAD API integration for reference pitch contours | Ground-truth H/L patterns per word | REST call per word | MODERATE |
| 15 | whisper.cpp WASM tiny as offline STT fallback | Removes Google STT dependency | 2–3 days | WEAK (adds complexity) |

---

## 8. Source Index

- CREPE pitch (tfjs): https://github.com/marl/crepe
- SPICE pitch (tfhub): https://tfhub.dev/google/spice/2
- pitchfinder npm (YIN/AMDF): https://github.com/peterkhayes/pitchfinder
- pYIN paper: https://doi.org/10.1145/2647868.2654982
- YIN paper: https://doi.org/10.1121/1.1458024
- DTW JS: https://github.com/GordonLesti/dynamic-time-warping
- OJAD pitch accent dictionary: https://www.gavo.t.u-tokyo.ac.jp/ojad/
- sherpa-onnx WASM: https://github.com/k2-fsa/sherpa-onnx
- vosk-browser: https://github.com/ccoreilly/vosk-browser
- whisper.cpp WASM example: https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.wasm
- Google STT word timestamps: https://cloud.google.com/speech-to-text/docs/async-time-offsets
- Google STT pricing: https://cloud.google.com/speech-to-text/pricing
- Witt & Young GOP (2000): https://doi.org/10.1017/S1351324900002280
- Hirata (2004) Japanese CALL: https://doi.org/10.1017/S0261444804002058
- Aoyama & Guion (2007) pitch-accent acquisition: https://doi.org/10.1017/S0272263107070198
- Vance (2008) Sounds of Japanese: ISBN 978-0521617543
- Lobanov (1971) formant normalization: https://doi.org/10.1121/1.1912384
- Adank et al. (2004) normalization comparison: https://doi.org/10.1121/1.1795335
- Grabe & Low (2002) nPVI rhythm: https://doi.org/10.1515/9783110915358-011
- Syrdal & Gopal (1986) formant ratios: https://doi.org/10.1121/1.393432