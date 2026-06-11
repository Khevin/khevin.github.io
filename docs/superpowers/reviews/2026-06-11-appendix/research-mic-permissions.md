I now have comprehensive data to synthesize an authoritative report. Let me compile everything.

---

## Chrome Microphone Permission Persistence: Research Report

### 1. Chrome Permission Persistence Model (Current Versions, Chrome 116+)

**Two grant types exist from the prompt:**

- **"Allow while visiting the site"** (persistent): Stored in content settings per origin. Survives page reload, tab close, and browser restart. Expires only if the user revokes it, Chrome auto-expires long-unused permissions (~90 days inactive), or the origin changes.
- **"Allow this time"** (one-time, since Chrome 116/M116, August 2023): Scoped to the current page visit. Expires on any of: page closed or navigated away, 16 hours elapsed, user manual revocation, or the background-tab 5-minute timer (see below).

**The 5-minute background timer for camera/microphone (critical distinction):**
Camera and microphone are "background-capable" capabilities. The 5-minute expiration timer for one-time grants does NOT start when the tab goes to the background. It starts only after the site STOPS using the capability (i.e., after tracks are stopped). So if a user grants "Allow this time," leaves the tab in background for an hour while tracks are stopped, the 5-minute clock begins the moment tracks stop. After 5 minutes with no active stream, the one-time grant expires and permission state reverts to `prompt`.

**Does stopping all tracks immediately revoke a one-time grant?**
No — not immediately. Stopping all MediaStreamTracks starts the 5-minute countdown. The grant remains `granted` for those 5 minutes. After 5 minutes pass without the mic being re-acquired, the state becomes `prompt`. During those 5 minutes, a call to `getUserMedia` would succeed without re-prompting.

**Practical implication for the described app:** When the user leaves the recording section and tracks are stopped, there is a 5-minute window in which re-entering the section and calling `getUserMedia` again will silently succeed. After 5+ minutes away, the one-time grant has expired and a new prompt will appear. If the user chose "Allow while visiting," this issue does not occur at all.

---

**file:// origin — does permission ever persist?**

Chrome treats `file://` URLs as a "secure context" for purposes of allowing `getUserMedia` to run (alongside `http://localhost` and `http://127.0.0.1`). However, the origin model for `file://` in Chrome's content settings has a critical characteristic: Chrome's contentSettings documentation states that for `file://` URL patterns, "the path must be completely specified and must not contain wildcards." In practice, each distinct file path is treated as its own content settings entry. Because a `file://` origin is not a registrable domain, Chrome historically has not stored "persistent allow" decisions for `file://` in the same durable way it does for HTTPS origins.

The confirmed behavior, corroborated by multiple developer reports and the fact that the Clipy guide's "secure origin" section lists `file://` without calling out persistent permission storage, is: **Chrome does not reliably persist microphone permission grants for `file://` origins.** Each time the file is opened in a new session/window, the permission will typically be re-prompted. Within the same browser session/tab the permission state may survive, but across browser restarts it does not reliably persist. This is the primary driver of re-prompting in file://-served deployments.

**localhost is treated as fully secure AND persistent:** `http://localhost` (and `127.0.0.1`) receives full secure-context treatment. Persistent "Allow while visiting" grants for localhost are stored and survive browser restarts, behaving identically to an HTTPS origin.

---

### 2. webkitSpeechRecognition vs. getUserMedia: Permission Relationship

**Key confirmed facts:**

- webkitSpeechRecognition checks and uses the same underlying microphone permission as getUserMedia. They share the same `{name: 'microphone'}` permission descriptor in Chrome's permission system. A prior `getUserMedia` grant (whether "Allow this time" or persistent) satisfies the SpeechRecognition permission check — no additional prompt appears.
- The "per-protocol" re-prompting behavior documented for Web Speech API confirms this: "if the page uses HTTPS, the browser asks for permission only once; on HTTP-hosted pages it prompts on every new recognition process start." This maps directly to Chrome's content settings not storing persistent grants for `http://` (non-localhost) — the same reason getUserMedia re-prompts on plain HTTP. Localhost and `file://` behave as: localhost = treated as HTTPS (persists), `file://` = inconsistent as noted above.
- **recognition.start() after recognition.stop() on the SAME instance:** This does NOT trigger a new permission prompt as long as the page's permission state is `granted`. The issue that can arise is a race condition — calling `start()` before the `end` event fires after `stop()` throws an `InvalidStateError` ("recognition has already started"). The correct pattern is to call `start()` only inside the `onend` handler. Permission is not re-checked between stop/start cycles on an HTTPS or localhost origin.

---

### 3. navigator.permissions.query({name: 'microphone'}) — Support Matrix

| Browser | Version Support | Returns 'microphone'? | onchange fires? | Key Caveat |
|---|---|---|---|---|
| Chrome (desktop) | Supported since ~Chrome 64 (2018) | Yes | Yes, including when one-time grant expires (reverts to 'prompt') | Cannot distinguish one-time from persistent grant — both return 'granted' |
| Edge | Same as Chrome (Chromium-based) | Yes | Yes | Identical to Chrome |
| Firefox | Since Firefox 131 (late 2024) | Yes | Yes (per spec) | Temporary (60+ min session) grants return 'granted'; always-ask returns 'granted' to avoid fingerprinting; `privacy.resistFingerprinting` may alter results |
| Safari macOS | Supported since Safari 16 (Sep 2022) | Yes | Unreliable — confirmed bug on iOS 16.7/17.1 where onchange does NOT fire and the stored status object stays frozen at initial state | Returns 'prompt' even for denied state until getUserMedia is called; macOS desktop may be more reliable than iOS |
| Safari iOS | Partial | Yes (query works) | Broken — confirmed Apple Developer Forum bug report: onchange does not fire, status object remains stale at 'prompt' | Unreliable for detecting state changes |

**Critical Safari caveat confirmed:** A reported bug (iOS 16.7.2, iOS 17.1.1, Chrome on iOS 119) shows that the `PermissionStatus` object returned from `navigator.permissions.query({name:'microphone'})` is frozen — it stays at 'prompt' even after the user grants permission, and `onchange` never fires. This makes the change event unreliable on Safari/iOS.

**Chrome one-time permission expiration fires onchange:** When a Chrome one-time grant expires (5-minute timer after tracks stop, or tab backgrounded), the Permissions API fires `onchange` and the state transitions from `granted` back to `prompt`. This is the intended mechanism for apps to detect expiration.

---

### 4. Best-Practice Pattern: "Prompt at Most Once Per Session"

**track.enabled = false vs. track.stop() — tab indicator behavior:**

The MDN specification for `MediaStreamTrack.enabled` states: setting `enabled = false` updates device activity indicators (the example is camera, but the same applies to microphone). The OS-level hardware indicator turns off when `enabled` is set to false. However, the **Chrome tab-strip recording indicator** (the red dot in the tab) behavior is more nuanced:

- `track.stop()`: The track enters `ended` state permanently. Chrome removes the tab indicator only when ALL tracks on ALL active streams from that tab are stopped. This is the clean, reliable way to kill the indicator.
- `track.enabled = false`: The track stays `live` and `enabled=false`, producing silence. Empirical evidence and Chromium bug reports (e.g., Chromium issue 261321, the Firefox bug 1192170 noting `MediaStream.stop()` historically needed for indicator removal) indicate that **Chrome's tab indicator remains active when tracks are live but disabled**. The stream is still open from Chrome's perspective; it just sends silence. The indicator does NOT turn off with `enabled = false` alone.

**OS-level indicator on macOS/Windows with `enabled = false`:** Per MDN's camera example, the OS hardware indicator does turn off. But Chrome's own tab-strip dot does not.

**Best practice pattern for the app's use case:**

Preferred approach (avoids all re-prompting issues on HTTPS/localhost, clean UX):

```
On section entry:
  1. query navigator.permissions.query({name:'microphone'})
  2. if state === 'granted': call getUserMedia immediately (no prompt shown)
  3. if state === 'prompt': call getUserMedia on user gesture (prompt will appear)
  4. if state === 'denied': show error UI, direct to browser settings

On section leave (want indicator off):
  Option A — Keep stream alive, mute with enabled=false:
    - Tab indicator STAYS ON (red dot visible in tab)
    - OS indicator turns off
    - No re-prompt ever when returning (stream never stopped)
    - Re-enable with track.enabled = true instantly

  Option B — Stop tracks, re-acquire on return:
    - Tab indicator turns OFF
    - On return: if permissionState === 'granted', getUserMedia() is silent (no prompt)
    - If one-time grant and >5 min elapsed: permissionState returns to 'prompt', re-prompt appears
    - Mitigated entirely by using persistent 'Allow while visiting' or serving from localhost/HTTPS
```

**Recommendation decision table (see Section 5 below).**

For SpeechRecognition specifically: keep a single `webkitSpeechRecognition` instance. Call `recognition.stop()` when leaving the section, and `recognition.start()` only inside the `onend` callback when re-entering. On HTTPS/localhost, zero re-prompts. On `file://`, behavior is origin-dependent.

---

### 5. Firefox and Safari Specifics

**Firefox:**
- Default behavior since Firefox added one-time support: when a user clicks "Allow," it is session-scoped ("Allow for this visit") unless they explicitly choose "Allow (permanent)" via the "Remember this decision" checkbox.
- This means on Firefox, stopping tracks and navigating away, then returning in the SAME browser session — likely still gets `granted`. Opening a new browser session re-prompts.
- `navigator.permissions.query({name:'microphone'})` returns `granted` for both temporary and persistent grants (does not distinguish). `onchange` is spec-supported but Firefox 131+ only.
- localhost is treated as secure context; permissions behave normally.

**Safari macOS desktop:**
- Permission model: "Allow," "Deny," or "Ask" per site in Safari Settings > Websites > Microphone. "Allow" is persistent across sessions (unlike iOS). "Ask" re-prompts each session.
- No "one-time" option distinct from "Ask" — it is effectively a per-session grant.
- `navigator.permissions.query` for microphone: returns `prompt` for denied state (Safari masks denied to prevent fingerprinting) until getUserMedia is called. Does not reliably reflect pre-call state.
- Stopping tracks does not affect Safari's session-level permission for the current page load.

**Safari iOS:**
- No per-site persistent browser-level allow. Users set Camera/Microphone globally in iOS Settings per-app (Safari, Chrome iOS, etc.), not per-website.
- Chrome on iOS uses WebKit (required by Apple App Store rules), inheriting all Safari iOS permission behaviors.
- `navigator.permissions.query` onchange is broken (confirmed bug, Apple Developer Forums).
- Every new PWA launch or app-close/reopen re-prompts unless global iOS Settings is set to "Allow."

---

### Decision Table: permissionState x action-on-section-leave

| Origin | Grant Type | permissionState on return | Action on Leave | Result on Re-entry |
|---|---|---|---|---|
| HTTPS / localhost | "Allow while visiting" (persistent) | `granted` | Stop all tracks | getUserMedia silent, no prompt |
| HTTPS / localhost | "Allow this time" (one-time) + returned < 5 min | `granted` | Stop all tracks | getUserMedia silent, no prompt |
| HTTPS / localhost | "Allow this time" (one-time) + returned > 5 min | `prompt` | Stop all tracks | Re-prompt appears |
| HTTPS / localhost | "Allow while visiting" (persistent) | `granted` | keep alive, track.enabled=false | No prompt; tab indicator stays on |
| HTTPS / localhost | Any granted | `granted` | keep alive, track.enabled=false | No prompt ever; cleanest for in-session UX |
| `file://` | Any | `prompt` (unreliable persistence) | Stop all tracks | Re-prompt on most browser restarts; within same session may survive |
| `file://` | Any | unknown | keep alive, enabled=false | No re-prompt within current page load; but cross-session persistence unreliable |
| Firefox (any secure origin) | Session grant (default) | `granted` (same session) | Stop all tracks | No re-prompt in same session; re-prompts on new session |
| Safari macOS | "Allow" (persistent) | Unreliable query | Stop all tracks | No re-prompt (persistent site setting) |
| Safari macOS | "Ask" | Unreliable query | Stop all tracks | Re-prompts next session/visit |
| Safari iOS / Chrome iOS | Global OS allow | N/A | Stop all tracks | No re-prompt if iOS Settings allows |

---

### Concrete Recommendations for the App

1. **Serve from `http://localhost`, not `file://`.** This is the single most impactful fix. localhost gets persistent permission storage; `file://` does not. This eliminates the most common cause of repeated prompts in a local-file-opened app.

2. **On section leave, prefer `track.enabled = false` over `track.stop()`** if the concern is re-prompting. The trade-off is the tab-strip recording indicator stays lit. If users find that acceptable, this eliminates all re-prompt risk within a session.

3. **If you must stop tracks** (to clear the tab indicator), use `navigator.permissions.query({name:'microphone'})` before calling `getUserMedia` on re-entry. If state is `granted`, call `getUserMedia` silently. If state is `prompt`, call it on a user gesture only.

4. **Attach a `permissionStatus.onchange` listener** (Chrome/Edge/Firefox 131+) to detect one-time grant expiration. When it fires with state `prompt`, show UI prompting the user to re-enable the mic before attempting to re-enter the recording section.

5. **For webkitSpeechRecognition:** Use a single instance per recording session. Wire `recognition.start()` inside the `onend` handler for restart. No separate permission prompt occurs on HTTPS/localhost if getUserMedia was already granted. On `file://`, SpeechRecognition follows the same HTTP-page rule — it re-prompts on each new recognition start. This is another reason to migrate to localhost.

6. **Do not rely on `onchange` in Safari iOS** — it is broken. Poll or re-query on user interaction instead.

---

Sources:
- [One-time permissions in Chrome — Chrome for Developers](https://developer.chrome.com/blog/one-time-permissions)
- [One-time permissions are here to stay! — Mozilla WebRTC Blog](https://blog.mozilla.org/webrtc/one-time-permissions-are-here-to-stay/)
- [MediaStreamTrack: enabled property — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/enabled)
- [Permissions: query() method — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query)
- [PermissionStatus: change event — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus/change_event)
- [Firefox bug 1609427 — Add microphone and camera to navigator.permissions.query](https://bugzilla.mozilla.org/show_bug.cgi?id=1609427)
- [Safari bug 215884 — getUserMedia recurring permissions prompts in standalone](https://bugs.webkit.org/show_bug.cgi?id=215884)
- [iOS navigator.permissions.query onchange bug — Apple Developer Forums](https://developer.apple.com/forums/thread/742439)
- [Voice driven web apps — Web Speech API, Chrome for Developers](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api/)
- [Webcam & Mic Permissions: Chrome, Safari, Firefox, Edge — Clipy](https://clipy.online/blogs/webcam-microphone-permissions-chrome-safari-firefox-edge/)
- [Getting Started With getUserMedia in 2026 — addpipe.com](https://blog.addpipe.com/getusermedia-getting-started/)
- [One-Time Permissions in Chrome — Notificare](https://notificare.com/blog/2023/08/18/one-time-permissions-in-chrome/)
- [How to Access Microphones Through the Browser API — Speechmatics](https://blog.speechmatics.com/browser-microphone-access)
- [SpeechRecognition: start() method — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start)