# Nihongo Reader releases

## 0.5.0

Version confirmed by the owner for this release.

- Pictures use a vertically scrolling gallery: three thumbnails per row in narrow panels, four in wider panels, with consistent framing and no horizontal strip.
- Gallery scroll position and keyboard focus survive thumbnail refreshes. A new search starts at the top.
- The popup displays the installed build's version, derived from the extension manifest.
- Follow-up retained at 0.5.0 by owner request: Cloud Translation errors distinguish setup, billing, restrictions and quotas; details redact credentials. An explicit no-key provider choice preserves saved translation and speech keys.
- Includes the preceding reader reliability improvements: encounter deduplication, stale-result protection, save retries, shared preferences, tokenizer recovery, bundled-library updates and translation cooldown/retry handling.

## Version policy

The extension's release version lives in `manifest.json`. Small follow-up releases should propose `0.5.1`, `0.5.2`, etc.; a larger release can propose a new minor version. Ask the owner to confirm the proposed number before changing it.

The tooling package version, tokenizer version, library revision and library exporter version describe separate components. Do not change those simply to match the extension release.
