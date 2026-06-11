# Microphone Permission Trace — nihongo Speaking Studio

## Architecture facts (verified)

- `navigator.mediaDevices.getUserMedia` is called in exactly ONE place in the codebase: `ensureStream()` at `nihongo/app.js:14127`, reached only via `SpeakingRecorder.start()` (app.js:14192), reached only from the mic-button click handler (app.js:15197). Nothing acquires the mic at app start, on section entry, or on render.
- Stream staleness test (app.js:14123): the cached stream is reused iff `mediaStream && mediaStream.active`. It is stale when (a) `release()` nulled it, or (b) the browser/OS ended all tracks (device unplug, OS revoke, tab-level one-time-grant expiry).
- Tracks are `stop()`'d in exactly ONE place: `release()` (app.js:14291-14294). `teardownRecorder()` (app.js:14273-14277) deliberately keeps the stream alive between takes.
- `release()` is called from exactly ONE place: `setSection()` at app.js:282, guarded by `APP.section === 'speaking' && s !== 'speaking'`. Callers of `setSection`: sidebar nav buttons (app.js:1776), kanji→flashcards jumps (app.js:8071, 11330, 12705), library deep-link (app.js:1634), home CTA (app.js:15547).
- The `hashchange` handler (app.js:12957-12960) does NOT call `setSection` and does NOT call `release()` — it mutates `APP.section` directly and re-renders. Browser back/forward out of Speaking bypasses mic teardown entirely.
- SpeechRecognition lifecycle: ONE recognizer object, created lazily in `ensureRecog()` (app.js:14155-14184) and never recreated — `release()` stops it but keeps the object (app.js:14287, comment 14279-14282). `recog.start()` fires in two places: `startRecog()` (app.js:14187, on every record tap when cloud STT is off and `recogRunning` is false) and the `onend` revive (app.js:14182, only while `sessionActive && isRecording()` — i.e., Chrome ended it mid-take). `recog.stop()` fires only in `release()`. Between takes the recognizer is left to auto-end on silence (Chrome behavior); the idle `onend` does NOT revive (comment 14176-14181 records that idle auto-restart used to fire a stray prompt).
- Flags: `sessionActive` = true from the first browser-STT take (app.js:14201) until `release()` (14285) — it survives phrase/category switches and hash-back navigation. `captureWindow` = true only during a take (14204), closed in the `onstop` finish (14246, sometimes after a 700ms grace, 14249).
- Cloud STT path: when `gcloudSttEnabled()` (app.js:14052-14054, key present + `APP.gcloudStt !== false`), the recognizer is never started (app.js:14199-14206); transcription is a `fetch` of the recorded clip (`cloudRecognizeJa`, app.js:14077-14101). getUserMedia is then the only mic consumer.
- `navigator.permissions` is used NOWHERE in app.js (zero grep hits; only prose comments mention "permission"). The app never queries grant state.
- No per-render path touches the mic: `renderSpeaking` (13697-13716), `wireSpeakingStudio` (15100+), and `updateSpeakingScoresInPlace` (15315-15335) make no SpeakingRecorder calls; `stopAndForgetUserRecording` (14304-14308) only stops an in-flight MediaRecorder take — it never stops tracks or the recognizer. The autoplay-model path (app.js:15109-15113) is `TTS.speak` — output only, no mic.

## (1) Event → action table

| Event | getUserMedia called? | Tracks stopped? | Recognizer (recog) |
|---|---|---|---|
| App start | No | No | Not created |
| Enter Speaking (any route) | No | No | Untouched (object may exist from prior session, stopped) |
| Autoplay model (TTS, 15109-15113) | No | No | Untouched |
| Press record, 1st time | **YES** (14127) → prompt #1 | No | Browser-STT mode: created (ensureRecog) + **started** (14187); Cloud mode: never |
| Stop record (tap or 10s cap, 14262) | No | No (teardownRecorder keeps stream, 14272-14277) | **Not stopped** — keeps running until Chrome auto-ends on silence; idle `onend` leaves it stopped (14174-14183) |
| Press record again, same phrase | No (cached stream `.active`, 14123) — unless stream went inactive, then YES | No | **started again** (14187) if it auto-ended between takes (typical); no-op if still running |
| Switch phrase (filmstrip, 15261-15269) | No | No | Untouched; `sessionActive` stays true; full re-render |
| Switch category (sidebar, 13676-13693) | No | No | Untouched; same as phrase switch |
| Leave Speaking via sidebar (setSection 281-287) | No | **YES** — release(): tracks stopped, `mediaStream = null` | **stopped** (14287), object kept, `sessionActive = false` |
| Leave via browser back (hashchange, 12957-12960) | No | **NO — release never runs; mic stays hot, indicator stays on** | Untouched; `sessionActive` stays true |
| Return to Speaking | No | No | Untouched |
| Press record after return | After sidebar-leave: **YES** (stream was nulled) → re-prompt on non-persistent grants. After hash-back-leave: No (stream still active) | No | started again (14187) |

## (2) Verbatim snippets

**ensureStream — app.js:14120-14131**
```js
  // Acquire the mic stream once, cache it. Reused on every subsequent
  // record so the permission prompt fires only the first time.
  async function ensureStream() {
    if (mediaStream && mediaStream.active) return mediaStream;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices unavailable');
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    return mediaStream;
  }
```

**release — app.js:14279-14295**
```js
  // Fully release the mic when leaving the Speaking section — stop the
  // recognizer AND the stream tracks so the browser's recording indicator
  // turns off. The recognizer OBJECT is kept (just stopped) so re-entering
  // the section reuses the existing permission grant instead of re-prompting.
  function release() {
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    sessionActive = false;
    captureWindow = false;
    if (recog && recogRunning) { try { recog.stop(); } catch (e) {} }
    recogRunning = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') { try { mediaRecorder.stop(); } catch (e) {} }
    teardownRecorder();
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
  }
```

**setSection release call — app.js:278-287**
```js
  // Leaving Speaking → release the mic so the browser indicator turns off.
  // (The stream is held alive across recordings WITHIN the section so the
  // permission prompt fires only once — see SpeakingRecorder.)
  if (APP.section === 'speaking' && s !== 'speaking' && typeof SpeakingRecorder !== 'undefined') {
    SpeakingRecorder.release();
    // Stop + close the user-playback AudioContext (see wireSpeakingStudio) so
    // it doesn't linger past the section. Lazily re-created on next playback.
    if (APP._speakingPlaySrc) { try { APP._speakingPlaySrc.stop(); } catch (e) {} APP._speakingPlaySrc = null; }
    if (APP._speakingPlayCtx) { try { APP._speakingPlayCtx.close(); } catch (e) {} APP._speakingPlayCtx = null; }
  }
```

**Record-button start call — app.js:15188-15197 (and recog arming inside start, 14190-14206)**
```js
  if (micBtn) micBtn.addEventListener('click', async () => {
    if (SpeakingRecorder.isRecording()) {
      SpeakingRecorder.stop();
      return;
    }
    micBtn.dataset.state = 'requesting';
    if (micLabelJa) micLabelJa.innerHTML = '<ruby>準備<rt>じゅんび</rt></ruby><ruby>中<rt>ちゅう</rt></ruby>…';
    if (micLabelEn) micLabelEn.textContent = 'Preparing…';
    try {
      await SpeakingRecorder.start(({ audioBuffer, duration, transcript, sttAvailable }) => {
```
```js
  async function start(onDoneCallback) {
    onStop = onDoneCallback;
    const stream = await ensureStream();          // mic grant FIRST (one prompt)
    chunks = [];
    ...
    const useCloud = gcloudSttEnabled();
    if (!useCloud) {
      sessionActive = true;
      capturedFinal = '';
      capturedInterim = '';
      captureWindow = true;
      startRecog();
    }
```

## (3) Which paths cause a NEW permission prompt

**(a) Persistent "Allow" grant (https origin, remembered):**
- getUserMedia never re-prompts regardless of release/re-acquire cycles — every `ensureStream()` after a `release()` silently re-grants.
- Chrome's SpeechRecognition reuses the origin's granted mic permission, so the per-take `recog.start()` calls (14187) and the mid-take revive (14182) don't prompt either.
- Net: at most ONE prompt ever. If the user reports constant prompting, they are NOT on a persistent grant — see (b).

**(b) One-time / non-persistent grant (file://, or Chrome "Allow this time"):**
Three distinct re-prompt paths, in order of likely impact:

1. **Per-visit prompt via release-on-leave.** Every exit through `setSection` (sidebar click, any flashcard jump, home CTA) runs `release()` → tracks stopped, `mediaStream = null`. The next record tap fails the `mediaStream.active` check (14123) → fresh `getUserMedia` → fresh prompt. So under a non-persistent grant, EVERY Speaking visit costs one prompt. The code's own comment (14038-14045) documents that stopping tracks re-triggers prompts on file:// — the current design just moved the re-prompt from per-take to per-visit.

2. **Per-take prompt via SpeechRecognition (browser-STT mode only).** Between takes the recognizer auto-ends on silence and is deliberately not revived at idle, so nearly every record tap re-runs `recog.start()` (14187). SpeechRecognition opens its OWN capture, separate from the cached getUserMedia stream (comment 14133-14135); a one-time grant was consumed by the gUM stream and does not extend to a new recognition session on non-persisting origins. Result: potentially a prompt on every take even though the gUM stream never re-prompts. Cloud-STT mode (`gcloudSttEnabled()`) bypasses this entirely — the recognizer never starts.

3. **Random mid-take prompt via the onend revive.** If Chrome ends the recognizer mid-recording, app.js:14182 calls `recog.start()` outside any user gesture. Under a non-persistent grant this can surface a prompt at an arbitrary moment during a take.

Asymmetry worth noting: leaving via **browser back** (hashchange, 12957-12960) skips `release()`, so the stream stays live → returning and recording does NOT re-prompt (the one-time grant's track is still active) — but the mic indicator stays on while the user is elsewhere in the app, and `release()` then never runs at all for that visit (the `APP.section === 'speaking'` guard at 281 is already false by the next `setSection`), leaving the mic hot indefinitely until the user re-enters and exits Speaking via `setSection`, or closes the tab. The app never consults `navigator.permissions.query` anywhere, so it cannot distinguish persistent from one-time grants or adapt either behavior.