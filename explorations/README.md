# explorations

The Signal direction that became the live site.

**It is published.** `identity.css`, `fonts.css`, `display-fonts.css`,
`fonts/` and `nav-current.js` at the repo root are the real thing now, linked
from index / process / blog / books. Edit those.

`parked/` holds what this folder used for the trial run — the page builder, the
two stylesheets it layered, and the nav script — superseded by their root
copies. Also the custom Broad monoline alphabet and the nav font picker, both
retired earlier. Nothing here is loaded by the site.

Still live and still useful:

- `title-fonts.html` — every display candidate at one cap height, with an
  editable line and a size slider. The fastest way to try another title face.
- `display-font-list.js` — the candidate set that page reads.
- `download-display-fonts.mjs` — adds or swaps self-hosted families. It writes
  into *this* folder, so follow it with `node publish-identity.mjs` from the
  repo root to push the change to the live site.
- `bar-artwork.md`, `hats-artwork.md` — the prompts the two illustrations were
  generated from. Worth keeping: regenerating either without them means
  starting the art direction over.
