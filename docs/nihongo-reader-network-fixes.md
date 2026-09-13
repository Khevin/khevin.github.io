# Reader update and translation failures

## Confirmed causes

- The live Nihongo app returns HTTP 200. Its expected update endpoint, `https://khevin.com/nihongo/reader-library/manifest.json`, returns HTTP 404. The generated library exists locally but is untracked and has not been published.
- The screenshot's Google Translate response is HTTP 429. One later live request for the same word succeeded with `王国 → kingdom`, so the failure appears transient. The code cannot remove Google's server-side rate limit.

## Local fixes

- Update checks now compare the extension's bundled library against the installed library, allowing newer builds to update existing installations. Library identity and revision rules still prevent downgrades and replacement of unrelated imports.
- An unpublished online library is shown as a notice while the saved library remains usable. HTTP errors, invalid JSON/HTML fallback pages and network failures have distinct diagnostics. The popup refreshes the displayed library revision after an update.
- Concurrent requests for the same translation share one request. HTTP 429 starts a provider cooldown using `Retry-After`, or 60 seconds if no usable header is available. The cooldown survives reopening the panel; it stores only a provider name and deadline, with no API keys or Japanese text.
- Cached translations remain available during cooldown. The panel offers a retry button when the delay expires and retains the exact Google Translate external link. Where a word exists in the local glossary, its English meaning is shown separately as Nihongo material, including when the selected translation language is Portuguese.
- A retry requests only translation; it does not repeat picture searches. No automatic retries or alternate-host requests bypass Google's limit.

The cooldown behavior follows the [HTTP 429 and Retry-After guidance](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429).

## Validation

- Translation unit checks: 7/7 passed, including duplicate requests, persisted cooldown, cached-result access and recovery.
- Library browser checks: 11/11 passed, including missing online manifests, newer bundled updates, HTTP 503 and HTML fallback responses.
- UI regression checks: 14/14 passed, including the two reported screenshot scenarios and successful translation retry after the delay.
- Existing side-panel reading loop: 28/28 passed, including inline translation, cached results, pictures and mnemonic cards.
- Extension build passed. Reload `nihongo/reader-extension/dist/` in Chrome, reopen the side panel, and refresh reading tabs to use the rebuilt scripts.

These browser checks use the served-build harness with controlled Chrome/network responses. They do not claim a newly verified installed Chrome extension runtime.

## Published online library

The concrete site change is to add these four generated files under the existing Nihongo site:

| File | Bytes |
|---|---:|
| `nihongo/reader-library/manifest.json` | 85,539 |
| `nihongo/reader-library/cards.json` | 152,573 |
| `nihongo/reader-library/glossary.json` | 95,625 |
| `nihongo/reader-library/lessons.json` | 3 |

They contain revision 1: 262 cards and references to 155 existing image assets. Every referenced local image exists, matches its manifest SHA-256, and is already tracked in Git. The publication does not require extension source, dependencies, test fixtures or the rest of the current uncommitted work.

Published with user approval on 9 September 2026 in commit `c60bb204f24ec342331df9e1718e80d2580c94df`. GitHub Pages reports this commit as built. The live manifest now returns the expected revision 1 snapshot, `snap-7c5832544319`.

Post-deployment validation fetched all four JSON files and all 155 referenced images from khevin.com. The JSON bytes match the approved local files; package preflight and every image integrity check passed. Online update checks can now reach the library.

Publication used a temporary checkout of the latest remote `main`, preserving newer remote work and leaving the original workspace branch and unrelated edits unchanged. Only the four JSON files were committed and published; this report remains local.
