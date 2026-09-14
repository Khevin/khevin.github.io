/* Builds the footer's skyline band.
 *
 * Khevin's São Paulo drawing is a composition, not a repeating strip: palms at
 * both ends, the cathedral and Martinelli in the middle. Stretched to the width
 * of a screen it became a picture of a city taking a third of the page, and
 * squashing it to fit made the buildings squat. So the drawing keeps its own
 * proportions at a quarter of that size, and the rest of the band is city built
 * around it — flanking skylines drawn here, on both planes, so the footer reads
 * as one wide horizon with São Paulo at the centre of it.
 *
 *   near   ink, detailed, the São Paulo drawing at 360 of 1400
 *   far    one flat pale tone, lower, standing behind
 *
 * Both bands are the same 1400x124 box on the same ground line, so they need no
 * offset against each other and cannot drift. Both fade out at the ends.
 *
 * The two cleaned layers it reads are intermediates and live beside the Figma
 * exports, not in assets — nothing serves them.
 *
 *   node explorations/clean-skyline.mjs explorations/skyline-src/figma-export.svg      explorations/skyline-src/clean-near.svg
 *   node explorations/clean-skyline.mjs explorations/skyline-src/figma-export-back.svg explorations/skyline-src/clean-far.svg '#c8c8d2'
 *   node explorations/build-skyline-band.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';

const BAND_W = 1400;
const BAND_H = 124;
/* The ground the whole band stands on. It matches the ground bar in the São
   Paulo drawing at this scale, and the footer sinks exactly this much into the
   night, so the bar is never seen and the city meets the dark field directly. */
const GROUND = 11;

const INK = '#16161b';
const INK_2 = '#232223';        // the tone the drawing uses for its nearest depth
const FAR_TONE = '#c8c8d2';
const IDENTITY = new URL('./parked/signal.css', import.meta.url);
const PAPER = (await readFile(IDENTITY, 'utf8')).match(/--paper:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
if (!PAPER) throw new Error('could not read --paper from signal.css');

/* Seeded, so the skyline is the same every build. A city that reshuffled itself
   on each run would make every regeneration a visual diff. */
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* One run of buildings between two x positions.
   Blocks overlap by a few pixels so the run reads as a city seen end-on rather
   than as a row of separate towers with daylight between every pair. */
function run({ x0, x1, seed, minH, maxH, tone, tone2, windows, detail, base = BAND_H }) {
  const rand = rng(seed);
  const pick = (a, b) => a + rand() * (b - a);
  const out = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = Math.round(pick(16, 46));
    const h = Math.round(pick(minH, maxH));
    const left = Math.round(x);
    const right = Math.min(left + w, x1);
    if (right - left < 8) break;
    const top = base - h;
    const fill = tone2 && rand() < 0.22 ? tone2 : tone;

    // the block
    out.push(`<rect x="${left}" y="${top}" width="${right - left}" height="${base - top}" fill="${fill}"/>`);

    if (detail) {
      const r = rand();
      if (r < 0.18) {
        // a setback: a narrower storey riding the roof
        const sw = Math.max(8, Math.round((right - left) * pick(0.4, 0.66)));
        const sh = Math.round(pick(6, 16));
        out.push(`<rect x="${left + Math.round(((right - left) - sw) / 2)}" y="${top - sh}" width="${sw}" height="${sh}" fill="${fill}"/>`);
      } else if (r < 0.3) {
        // an antenna
        const ax = left + Math.round((right - left) / 2);
        out.push(`<rect x="${ax}" y="${top - Math.round(pick(8, 20))}" width="2" height="${Math.round(pick(8, 20))}" fill="${fill}"/>`);
      } else if (r < 0.4) {
        // a water tank on legs
        const tw = Math.round(pick(9, 15));
        const tx = left + Math.round(((right - left) - tw) / 2);
        out.push(`<rect x="${tx}" y="${top - 9}" width="${tw}" height="6" fill="${fill}"/>`);
        out.push(`<rect x="${tx + 1}" y="${top - 3}" width="2" height="3" fill="${fill}"/>`);
        out.push(`<rect x="${tx + tw - 3}" y="${top - 3}" width="2" height="3" fill="${fill}"/>`);
      }
    }

    if (windows && h > 26 && right - left > 18) {
      /* Sparse and gridded. At this size a full grid turns to grey mush, so a
         handful of lit floors reads better than every floor drawn. */
      const cols = Math.max(2, Math.floor((right - left - 8) / 8));
      const rows = Math.max(2, Math.floor((h - 16) / 11));
      for (let c = 0; c < cols; c++) {
        for (let rw = 0; rw < rows; rw++) {
          if (rand() > 0.42) continue;
          const wx = left + 5 + c * 8;
          const wy = top + 8 + rw * 11;
          if (wx + 3 > right - 3 || wy + 5 > base - GROUND - 2) continue;
          out.push(`<rect x="${wx}" y="${wy}" width="3" height="5" fill="${PAPER}"/>`);
        }
      }
    }

    x = right - pick(2, 7);
    i += 1;
    if (i > 200) break;
  }
  return out.join('');
}

/* Pull the drawn content out of a cleaned layer, without its own wrapper or the
   fade it carries for standing alone. */
async function inner(path) {
  let s = await readFile(path, 'utf8');
  s = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  s = s.replace(/<defs>[\s\S]*?<\/defs>/g, '');
  s = s.replace(/\s+mask="url\(#[^)]+\)"/g, '');
  return s.trim();
}

const fade = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">` +
  `<stop offset="0" stop-color="#fff" stop-opacity="0"/>` +
  `<stop offset="0.11" stop-color="#fff" stop-opacity="1"/>` +
  `<stop offset="0.89" stop-color="#fff" stop-opacity="1"/>` +
  `<stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
  `</linearGradient>` +
  `<mask id="${id}-m"><rect width="${BAND_W}" height="${BAND_H}" fill="url(#${id})"/></mask>`;

const open = (title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BAND_W} ${BAND_H}" fill="none" ` +
  `preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"><!-- ${title} -->`;

// ---- near: São Paulo at a quarter, city either side ------------------------
{
  const SP_W = 360;                       // a quarter of the width it used to fill
  const s = SP_W / 711;
  const x = Math.round((BAND_W - SP_W) / 2);
  const body =
    `<rect x="0" y="${BAND_H - GROUND}" width="${BAND_W}" height="${GROUND}" fill="${INK}"/>` +
    run({ x0: -20, x1: x + 14, seed: 8117, minH: 26, maxH: 84, tone: INK, tone2: INK_2, windows: true, detail: true }) +
    run({ x0: x + SP_W - 14, x1: BAND_W + 20, seed: 4463, minH: 26, maxH: 88, tone: INK, tone2: INK_2, windows: true, detail: true }) +
    `<g transform="translate(${x} 0) scale(${s.toFixed(5)})">${await inner('explorations/skyline-src/clean-near.svg')}</g>`;
  const svg = open('near — the São Paulo drawing, with city built either side of it') +
    `<defs>${fade('bandN')}</defs><g mask="url(#bandN-m)">${body}</g></svg>`;
  await writeFile('assets/skyline-band-near.svg', svg, 'utf8');
  console.log(`  skyline-band-near.svg   ${Math.round(svg.length / 1024)}KB   São Paulo ${SP_W}px of ${BAND_W}`);
}

// ---- far: the same shape, one tone, standing lower --------------------------
{
  const SP_W = 430;
  const s = SP_W / 878;
  const h = 222 * s;
  const x = Math.round((BAND_W - SP_W) / 2);
  /* Its base lands on the ground line, not below it: this plane is pale, and
     anything of it that overhangs into the night would show. */
  const y = Math.round(BAND_H - GROUND - h);
  const body =
    run({ x0: -20, x1: x + 20, seed: 2909, minH: 20, maxH: 62, tone: FAR_TONE, windows: false, detail: true, base: BAND_H - GROUND }) +
    run({ x0: x + SP_W - 20, x1: BAND_W + 20, seed: 7351, minH: 20, maxH: 66, tone: FAR_TONE, windows: false, detail: true, base: BAND_H - GROUND }) +
    `<g transform="translate(${x} ${y}) scale(${s.toFixed(5)})">${await inner('explorations/skyline-src/clean-far.svg')}</g>`;
  const svg = open('far — one flat tone, lower, standing behind the near band') +
    `<defs>${fade('bandF')}</defs><g mask="url(#bandF-m)">${body}</g></svg>`;
  await writeFile('assets/skyline-band-far.svg', svg, 'utf8');
  console.log(`  skyline-band-far.svg    ${Math.round(svg.length / 1024)}KB   São Paulo ${SP_W}px of ${BAND_W}`);
}

console.log(`\n  band ${BAND_W}x${BAND_H}, ground ${GROUND}px — the footer sinks exactly that.`);
