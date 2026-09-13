# Parked

Work that is out of the build but not thrown away.

- `broad-lettering.mjs`, `build-proof.mjs`, `proof.html` — the custom monoline
  Broad alphabet (two widths keyed to case, glyphs as stroke centrelines).
  Replaced on the about title by Fraunces 900. `node build-proof.mjs` still
  regenerates the specimen; nothing in the built pages references it.
- `signal-fonts.js` — the nav title-font picker. Removed from the nav, but
  `display-font-list.js` and `title-fonts.html` are still live, so the candidate
  set and the side-by-side specimen sheet both still work.
