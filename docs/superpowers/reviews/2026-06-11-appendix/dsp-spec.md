# Speaking/Shadowing Pronunciation-Scoring Pipeline — Technical Specification

All references are `nihongo/app.js:<lines>` (verified by direct read).

---

## (A) Phrase data model (13100–13180)

`window.SPEAKING_CATEGORIES` (13110) is a global array. Each **category**:

```js
{ id, kana, kanji, en, glyph, description, phrases: [...] }
```

Each **phrase** (e.g. 13119–13130, 13131–13143):

| Field | Type | Meaning |
|---|---|---|
| `id` | string | stable key, also seeds the synthesized model waveform |
| `chunks` | array | word-level groups; each chunk `{ mora: string[], pitch: ('H'\|'L')[] }`, parallel arrays. **One array entry = one mora** (じょ is one entry; ん, っ, ー are each their own entry — splitMora 13580–13590 fuses only the small-kana set at 13575–13579) |
| `kanji` | string | display form (may be pure kana, e.g. こんにちは) |
| `romaji` | string | romanization (display only — never used in scoring) |
| `en` | string | translation |
| `pattern` | enum | `heiban`/`atamadaka`/`nakadaka`/`odaka` (display chip only, 13535–13551) |
| `accent` | number | downstep mora index, 0 = heiban (display only) |
| `notes` | string | pedagogical note |
| `image` | string? | optional override for the scene illustration key (13741–13743) |

**There are no audio fields.** The model audio is synthesized at runtime by TTS (`TTS.speak(fullKana)`, 15106–15118); the "Original" waveform is a **fake** deterministic SVG seeded from `phrase.id + ':original'` with H-mora bars taller (0.55 base) than L (0.30) plus jitter and a sine envelope (`synthesizedWaveformPath`, 13968–14000).

Derived quantities used by scoring:
- `moraCount` = total mora across chunks, `|| 1` (14780)
- `expectedPitch` = flatMap of all `chunk.pitch` (14781)
- expected vowel backbone via `expectedVowelSequence` (14672–14683, see C7)
- full kana string (for STT comparison) = all mora joined (14752)

## (B) Recording pipeline (14103–14302)

**Mic acquisition** (14122–14131): `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })`. Stream is acquired once and cached for the whole Speaking session; released only on section leave (`release()`, 14283–14295). Note: scoring DSP therefore always operates on **browser-processed** audio (AEC/NS/AGC), acknowledged as harming pitch periodicity at 14984–14988.

**Recorder** (14208–14263): `new MediaRecorder(stream)` with **no explicit mimeType**; blob type = first chunk's type or `'audio/webm'` (14211). `start()` with no timeslice; hard 10 s auto-stop (14262). A parallel `AnalyserNode` (fftSize 256, 14257) drives only the UI recording pulse.

**Browser STT session pattern** (14146–14188): one persistent `(webkit)SpeechRecognition`, `lang='ja-JP'`, `interimResults=true`, `continuous=true`, `maxAlternatives=1`. A take opens a "capture window": `capturedFinal`/`capturedInterim` accumulate only while `captureWindow` is true; `onend` revives the recognizer only if a take is still recording (14182). Used only when cloud STT is off.

**Stop flow** (`mediaRecorder.onstop`, 14210–14252):
1. Blob → `arrayBuffer` → `decodeAudioData` → `fullBuffer` (null on decode failure).
2. `audioBuffer = trimToRealBuffer(fullBuffer, ctx)` — silence-trimmed copy used for waveform, playback, **and scoring** (14223).
3. `teardownRecorder()` (keeps stream + recognizer alive).
4. **Cloud path**: `cloudRecognizeJa(fullBuffer)` on the **untrimmed** buffer (deliberate — trailing trim clips devoiced endings, 14216–14222); on throw, `sttAvailable=false` so scoring falls back to acoustics (14236–14241).
5. **Browser path**: if STT supported and no final result yet, a 700 ms grace `setTimeout` before snapshotting `(capturedFinal || capturedInterim).trim()` (14245–14250).
6. `deliver({ audioBuffer, duration, transcript, sttAvailable })` → the mic-button callback (15197–15243) which stores `APP.speakingUserBuffer`, runs `scoreSpeakingAttempt`, draws the real waveform, and updates chips in place.

**Cloud STT request** (`cloudRecognizeJa`, 14077–14101): `POST https://speech.googleapis.com/v1/speech:recognize?key=<APP.gcloudTtsKey>` with

```json
config: { encoding: "LINEAR16", sampleRateHertz: round(buf.sampleRate),
          languageCode: "ja-JP", maxAlternatives: 1, model: "latest_short" }
audio:  { content: <base64 headerless little-endian PCM16 of channel 0> }
```

Encoding (`audioBufferToBase64PCM16`, 14057–14072): clamp to [−1,1], `s<0 ? s*0x8000 : s*0x7FFF`, little-endian, `btoa` over 32 K-char chunks. **Not requested**: word time offsets, word confidence, automatic punctuation, speech adaptation / phrase hints (the expected phrase is never boosted), `useEnhanced`, alternative languages. Only `results[0].alternatives[0].transcript` is read (14099–14100) — any further result segments are discarded. Audio is sent at the native decoded rate (typically 48 kHz), uncompressed.

## (C) Signal-processing chain

1. **`trimSilence`** (14427–14455): 10 ms non-overlapping RMS frames; noise floor = 15th-percentile frame RMS; speech threshold `max(0.012, 3 × floor)`; crop to [first, last] frame above threshold, padded ±6 frames (60 ms); skipped if it would remove < 80 ms or if all-silence. Returns a zero-copy `makeBufferView` (14406–14415). `trimToRealBuffer` (14462–14473) copies the view into a real AudioBuffer for playback.

2. **`analyzeAudio`** (14343–14399): 10 ms hop (FRAME_SEC = 0.01), non-overlapping; per-frame RMS + global peak |sample|; noise floor = 15th-percentile RMS; **voicedThreshold = max(0.014, 2.2 × floor)**; voiced frame count/ratio/duration, `meanVoicedRms`; `smooth` = ±2-frame (~50 ms) moving average of RMS.

3. **`detectSyllableNuclei`** (14482–14516): operates on `smooth`. Bail if max < 1e-4. `peakThresh = 0.20 × max`. Candidate peaks = local maxima (`>=` left, `>` right) above threshold; if none, a single nucleus at the argmax (held-vowel case). Merge rule: two adjacent peaks are distinct nuclei only if the minimum between them falls below **0.70 × min(peak energies)**; otherwise keep the louder. Output `[{ frame, t = frame×0.01, energy }]`.

4. **`fftRadix2`** (14538–14562): standard in-place iterative radix-2 FFT; inverse divides by N.

5. **`estimateFormants`** (14569–14625): window ±50 ms around the nucleus center sample (reject if < 30 ms available). Downsample to 8 kHz via box average (`box = round(sr/8000)` samples starting at `floor(x)`, stride = exact ratio — **no true anti-alias filter**, fractional strides overlap). Need ≥ 64 samples. N = 1024 FFT, Hamming window over `min(len,1024)` samples, energy gate 1e-6. Cepstral smoothing: IFFT(log|X|), keep quefrency bins < **L = 30**, FFT back. Bin width 8000/1024 ≈ 7.81 Hz. **F1 = strongest local max in 200–1000 Hz; F2 = strongest local max in 850–3000 Hz** (comment at 14567 says 800; code passes 850 at 14622). Null unless `f1 && f2 && f2 > f1`.

6. **`classifyVowel`** (14630–14644): nearest prototype by squared Euclidean distance in **(log F1, log F2)** space. Prototypes: a(750,1250), i(320,2300), u(350,1250), e(480,1900), o(480,850). No per-speaker calibration beyond the log scale.

7. **Expected vowels** (14648–14683): vowel keyed on the **last** kana of each mora (so きょ→ょ→o); katakana mapped to hiragana by −0x60; ー repeats the previous vowel (a long vowel contributes a second identical entry); ん→'N', っ→'Q', and **both are dropped** from the expected sequence; `prev` initialized to 'a'. **Devoicing is not modeled** — です expects a final 'u', ました expects the devoiced 'i'.

8. **`vowelCost`** (14688–14697): identical = 0; only sorted pairs `ei` and `ou` = 0.5; all other substitutions = 1.0.

9. **`vowelSequenceAccuracy`** (14701–14720): edit-distance DP (substitution = vowelCost, insertion/deletion = **GAP 0.8**), similarity = `clamp(1 − D[n][m]/max(n,m), 0, 1)`. Special cases: empty expected → 0.5; fewer than 2 detected vowels → **0.15**.

10. **`stringSimilarity`** (14724–14740): per-code-point Levenshtein, `1 − dist/max(len)`. **`transcriptAccuracy`** (14747–14757): strips whitespace/JP+EN punctuation, compares the transcript against **both** the kana reading and the kanji form, returns the max; `null` when no transcript.

11. **`estimatePitchHz`** (15057–15097) — NCCF pitch detector: requires ≥ 200 samples; F0 search 70–420 Hz (lag `sr/420 … sr/70`); prefix-sum-of-squares for O(1) window energies; total energy gate 1e-5. `nccf[lag] = Σ buf[i]·buf[i+lag] / sqrt(E[0..N−lag) · E[lag..N))`. If global max `gmax < 0.18` → `{hz:0, conf:gmax}` (deliberately still reports conf so the caller's relaxed pass can use it, 15080–15083). Otherwise pick the **first local maximum whose NCCF ≥ 0.80 × gmax** (octave-halving guard); fallback to the global argmax. Returns `{ hz: sr/lag, conf: gmax }` — note **conf is the global max, not the chosen peak's value**.

## (D) Sub-scores (`scoreSpeakingAttempt`, 14769–14964)

Input buffer is re-trimmed (`trimSilence` again at 14775 — the capture path already trimmed once at 14223), then `analyzeAudio` + `detectSyllableNuclei`. N = nucleus count, M = moraCount.

**Content (0..1)** (14787–14827):
- `formantAccuracy` = DTW similarity of per-nucleus classified vowels vs expected sequence.
- `sttAccuracy` = transcript similarity or null.
- With STT: `sttForgiven = clamp((sttAccuracy − 0.12)/0.68, 0, 1)` (0.12→0, 0.80→1), `content01 = clamp(0.80·sttForgiven + 0.20·formantAccuracy, 0, 1)`.
- Without STT: `content01 = clamp(0.30 + 0.55·formantAccuracy, 0, 1)` — hard floor 0.30, ceiling 0.85.

**Rhythm (0..1)** (14837–14859): `countScore = clamp(1 − |N−M|/M, 0, 1)`; `evenness` (only if N≥3) = `clamp(1 − (cv − 0.15)/0.70, 0, 1)` where cv = stddev/mean of inter-nucleus intervals, else 0. `rhythm01 = 0.60·countScore + 0.40·evenness`. Failure mode: っ (a silent mora) is counted in M but can never produce a nucleus — phrases with sokuon are structurally penalized.

**Clarity (0..1)** (14861–14886): `modDepth` = mean over adjacent nucleus pairs of `clamp((min(peakE) − valley)/min(peakE), 0, 1)` (0 if N<2); `snr = clamp((meanVoicedRms − floor)/(floor·6 + 0.04), 0, 1)` (or `loud = clamp(meanVoicedRms/0.05,0,1)` if floor=0); `audible = clamp(peak/0.10, 0, 1)`. `clarity01 = clamp(modDepth·1.6, 0, 1)·0.72 + snr·0.18 + audible·0.10`.

**Pitch (0..1)** (`scorePitchAtNuclei`, 14979–15039): F0 sampled in ±max(256 samples, 60 ms) windows at each nucleus. Two-pass confidence gate: keep readings with `conf > 0.30` and `70 < hz < 450`; if < 2 survive, relax to `conf > 0.20`. If still < 2 valid → sliver `clamp(0.18·(1+coverage), 0.05, 0.30)`. H/L threshold = midpoint of the speaker's own 20th/80th-percentile F0. Alignment: expected mora j maps to detected beat `k = round((j/(M−1))·(N−1))` (proportional index, no DTW). `agreement = matches/total`; `agree01 = clamp((agreement−0.5)/0.5, 0, 1)`; `pitchShape = 0.30 + 0.62·agree01`; `countMatch = clamp(1 − 0.8·|N−M|/M, 0, 1)`; `cov01 = clamp(coverage/0.6, 0, 1)`; result = `clamp(pitchShape·(0.60+0.40·countMatch)·(0.70+0.30·cov01), 0, 1)`.

**Naturalness (0..1)** (14896–14913): `rate = N / span` where span = time between first and last nucleus (or voiced duration if N<2; 0 if span ≤ 0.05 s). `rateScore`: 1 in [4.5, 9.5] mora/s; below → `rate/4.5`; above → `clamp(1 − (rate−9.5)/8, 0, 1)`. `trio01 = mean(rhythm01, clarity01, pitch01)`; `balance = clamp(1 − 1.6·popStdDev(trio), 0, 1)`. `naturalness01 = trio01 · (0.70 + 0.18·rateScore + 0.12·balance)` — multiplicative, capped by the trio itself.

## (E) Score combination + UI surfacing

**Content gate** (14921–14926): normalized logistic, `g = σ((content01 − 0.40)·8)`, `gate = clamp(g / σ((1−0.40)·8), 0, 1)`. content01=1 → 1.0; 0.40 → ≈0.50; ≤0.2 → near 0.17.

**Final 0–100 scores** (14930–14952), with `ease(x) = x^0.85` and `LIFT = 1.07`:

```
rhythm      = round(clamp(ease(rhythm01)      · (0.35 + 0.65·gate) · 99 · 1.07, 0, 99))
clarity     = round(clamp(ease(clarity01)     · (0.12 + 0.88·gate) · 97 · 1.07, 0, 98))
pitch       = round(clamp(ease(pitch01)       · (0.15 + 0.85·gate) · 96 · 1.07, 0, 98))
naturalness = round(clamp(ease(naturalness01) · (0.12 + 0.88·gate) · 97 · 1.07, 0, 98))
overall     = round(mean of the four)          // 100 is unreachable by design
```

**Flags** (14953–14963): `silent = (N === 0) || overall < 8`; `noWords = !silent && sttAvailable && !transcript`. Returned object also carries `accuracy` (= content01) and the transcript. **Note**: the header comment (14321–14331) describes an explicit "SILENCE GATE → return all zeros" and a "PRESENCE RAMP" multiplier; neither exists in the current code — silence scores ~0 only emergently (N=0 zeroes the dimensions). `loud` is computed (14834) but used only as the snr fallback. `durationSec` is effectively unused in scoring.

**UI** (13752–13772, 15197–15243, 15315–15335): four chips show `round(score/20)` filled dots (max 5); overall shows the number /100. After a take, `updateSpeakingScoresInPlace` patches dots/number without re-rendering (preserving the drawn user waveform, ~120 max-abs bars boosted ×2.5, 14005–14031). The "Heard" line shows the transcript with furigana (`furiganaTranscript`, 13722–13731), a "no words" coaching message, or an STT-unavailable notice; a separate silent-recording hint covers the silent case. Scores and buffer are RAM-only and die on phrase/category change (`stopAndForgetUserRecording`, 14304–14308).

## (F) Most suspect weaknesses

1. **Devoiced vowels are unmodeled and double-punished** (14672–14683, 14775, 14219–14223). です/ます endings expect a 'u'/'i' nucleus that natives devoice; the devoiced mora produces no energy peak → rhythm countErr AND a DTW gap. Worse, the capture path deliberately keeps the full buffer for STT because trimming clips devoiced endings — but **scoring re-trims at 14775**, re-introducing exactly that clipping into the acoustic path.
2. **っ (sokuon) is unwinnable for rhythm** (14780 vs 14482): moraCount includes っ but it is acoustically silence — a correct utterance of a っ-bearing phrase is structurally short one nucleus. ん similarly tends to merge into the neighboring vowel's energy bump.
3. **Heiban/flat phrases break the H/L self-calibration** (15009–15016): the 20/80-percentile midpoint always bisects the speaker's range, so a correctly flat こんにちは (LHHHH) gets ~half its nuclei labeled L; agreement for all-H-ish phrases is capped well below 1 no matter how good the speaker is. Expected-pattern-aware thresholding (or relative-step comparison) is needed.
4. **Proportional-index alignment, not DTW, for pitch** (15019–15023): `k = round((j/(M−1))·(N−1))` assumes perfectly uniform beat spacing; one inserted/missed beat early misaligns every following comparison, and when N<M several expected morae collapse onto one detected beat.
5. **Absolute amplitude constants assume one mic gain regime** (0.014 voiced floor 14371, 0.012 trim floor 14441, `rms/0.05` 14834, `peak/0.10` 14835, `snr` denominator 14880): no normalization to the clip's own level; AGC is requested (14128) but not guaranteed (e.g. Safari), so clarity/snr shift with hardware.
6. **Formant front-end fragility** (14574–14624): "downsample" is a box average with fractional stride and no real anti-alias filter; F2 search floor is 850 Hz, above many male speakers' 'o' F2 (~700–850 Hz) → 'o' systematically misclassified; the fixed L=30 lifter under-smooths low-F0 voices (harmonic ripple survives → spurious peaks). One single-window estimate per nucleus, no temporal voting.
7. **No speaker normalization in vowel classification** (14630–14644): fixed prototypes in log space tolerate uniform scaling only; female/child vocal tracts shift F1/F2 non-uniformly, biasing the u/o and i/e boundaries — and `vowelCost` forgives exactly those confusions at 0.5, masking systematic classifier error rather than fixing it.
8. **`estimatePitchHz` confidence is the global NCCF max, not the chosen peak's** (15078–15096): the first-peak-over-80% octave guard can select a lag whose actual correlation is up to 20% lower than the reported `conf`, overstating confidence right at the 0.30/0.20 gates; octave-doubling (too-short lag passing the 80% bar on bright/processed audio) has no symmetric guard.
9. **Cloud STT reads only `results[0]`** (14099–14100) and sends no phrase hints/speech adaptation (14085–14092): multi-segment recognitions (common for two-chunk phrases with a pause) silently lose the second segment, tanking `sttAccuracy` for a correct read; the expected phrase is known and could be supplied as an adaptation boost for ~free accuracy.
10. **Browser-STT 700 ms race + doc drift** (14245–14250; 14310–14334): a final result arriving after the grace window is dropped → false "no words" with `sttAvailable=true`; and the scoring header documents a silence gate + presence ramp that no longer exist in the code — misleading for anyone modifying the gate behavior.

Supporting detail for any reimplementation: the DSP path operates on AEC/NS/AGC-processed audio by construction (14127–14129) — the comment at 14984–14988 already attributes a past pitch-scoring bug to this; requesting a second unprocessed track (or `echoCancellation:false` constraints for the scoring copy) is the obvious upstream fix candidate.