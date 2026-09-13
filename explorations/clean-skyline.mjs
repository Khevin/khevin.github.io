/* Turns Khevin's Figma São Paulo skylines into the two footer layers.
 *
 * There are two drawings and they are built differently, so there are two modes.
 *
 * NEAR (default) — the detailed 711x245 city. It arrives as 649 paths in 13
 * greys on an opaque #F5F5F5 plate. Three things change and nothing else:
 *
 *  1. The background plate goes, so the artwork sits on whatever is behind it.
 *  2. The near-blacks become the footer's own ink. They are the silhouette, and
 *     matching the field below is what lets the buildings merge into it and act
 *     as the divider rather than as a picture pasted on top of one.
 *  3. The mid and light greys stay exactly as drawn. They are the lit windows
 *     and the buildings standing behind — the depth in the piece — and flatting
 *     them to one tone would throw away the reason to use this over a
 *     silhouette.
 *
 * FAR (pass a tone) — the wider, plainer 878x222 city that stands behind it.
 * That file is drawn as a NEGATIVE: a full-canvas dark plate with a white sky
 * path cut around the rooftops laid over the top, so the buildings are the
 * plate showing through. Treating its fills the way the near file's are treated
 * fills the sky solid, because the tones do not mean the same thing. So the sky
 * is turned into a mask instead. The silhouette keeps its exact outline, the
 * sky becomes genuinely transparent rather than a baked-in paper colour, and
 * the window and shading detail is dropped — at the size a layer set this far
 * back is drawn that detail is only noise, and losing it is most of what makes
 * it read as distance.
 *
 *   node explorations/clean-skyline.mjs explorations/skyline-src/figma-export.svg assets/skyline-sp.svg
 *   node explorations/clean-skyline.mjs explorations/skyline-src/figma-export-back.svg assets/skyline-sp-back.svg '#c8c8d2'
 */
import { readFile, writeFile } from 'node:fs/promises';

const [input, output, farTone] = process.argv.slice(2);
if (!input || !output) throw new Error('usage: clean-skyline.mjs <in.svg> <out.svg> [farTone]');

const INK = '#16161b';
/* Everything at or below this luminance is silhouette rather than detail.
   #232223 sits just above the footer ink and reads as the nearest layer of
   depth, so it is deliberately left alone. */
const SILHOUETTE = ['#030303', '#171718', '#1A1A1A', '#000000'];

/* The one addition to the near drawing: São Paulo's first skyscraper, put on
   the tallest tower that was not already a portrait of somewhere real.
 *
 * The cathedral, the Estaiada bridge, the Luz clock tower and the arcade are
 * all drawn as themselves. The slab at x 558-601 is generic, and it is the
 * tallest one that is — so Martinelli goes there: the stepped setbacks and the
 * little rooftop temple that make it recognisable from a kilometre away, and
 * the flag it has flown since 1929.
 *
 * Everything here is drawn ABOVE the tower's existing roofline (y 60.3), so
 * none of Khevin's drawing is covered or altered — the crown is added to it.
 *
 * The flag is the state flag, and it is built out of gaps rather than white
 * paint: its pale stripes are holes that let the page through, bound by a thin
 * ruled border. White stripes really painted white would vanish on paper this
 * close to white, and painting them the paper colour is the trap the hats
 * illustration fell into — an asset that silently depends on one page colour.
 * Thirteen stripes at this size would alias into grey mush, so it carries
 * seven, which still reads as the flag next to the red canton. */
const RED = '#c93123';
const martinelli = () => {
  const shaft = '#232223';  // the tone the tower itself is drawn in
  const slot = (x) => `<rect x="${x}" y="36" width="2.7" height="6.4" fill="white"/>`;
  const band = (y) => `<rect x="579.75" y="${y}" width="16.9" height="1.56" fill="${INK}"/>`;
  return [
    // setbacks, stepping in twice the way the real tower does
    `<rect x="561" y="51" width="35" height="9.8" fill="${shaft}"/>`,
    `<rect x="564.8" y="43.4" width="27.4" height="7.8" fill="${shaft}"/>`,
    // the rooftop temple, and its overhanging roof
    `<rect x="568" y="33.8" width="21" height="9.8" fill="${shaft}"/>`,
    `<path d="M565.8 33.9L570 30H587L591.2 33.9Z" fill="${shaft}"/>`,
    `<rect x="575" y="26.2" width="7" height="4" fill="${shaft}"/>`,
    // its colonnade
    slot(570), slot(574.9), slot(579.8), slot(584.7),
    // the flagpole
    `<rect x="577.8" y="10.4" width="1.4" height="16" fill="${INK}"/>`,
    // and the flag: four ruled stripes, three gaps, a red canton, a thin border
    band(11.95), band(15.06), band(18.18), band(21.29),
    `<rect x="579.75" y="11.95" width="6.76" height="4.67" fill="${RED}"/>`,
    `<rect x="579.475" y="11.675" width="17.45" height="11.45" fill="none" stroke="${INK}" stroke-width="0.55"/>`,
  ].join('');
};

let svg = await readFile(input, 'utf8');
const vb = (svg.match(/viewBox="([^"]+)"/) || [, '0 0 711 245'])[1];
const [, , W, H] = vb.split(/[\s,]+/).map(Number);
const before = svg.length;

// 1. the plate
const plate = svg.match(/<rect[^>]*fill="#F5F5F5"[^>]*\/>\s*/i);
svg = svg.replace(/<rect[^>]*fill="#F5F5F5"[^>]*\/>\s*/i, '');

let recoloured = 0;
let dropped = 0;
let sky_n = 0;

if (farTone) {
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]*)"[^>]*>/g)];
  const fillOf = (p) => (p[0].match(/fill="([^"]+)"/) || [])[1];

  /* The plate: the one path that is the whole canvas. A rectangle in path data
     uses only the straight-line commands, so it is recognisable without parsing
     the geometry — and its corner is matched on value, since the viewBox is
     rounded (878) where the drawing is not (877.594). */
  const reach = (d, cmd) => Math.max(0, ...[...d.matchAll(new RegExp(`${cmd}(-?[\\d.]+)`, 'g'))].map((m) => +m[1]));
  const isPlate = (p) => !/[CSQTA]/i.test(p[1]) && p[1].startsWith('M0 0')
    && reach(p[1], 'H') >= W * 0.99 && reach(p[1], 'V') >= H * 0.99;
  const plateIdx = paths.findIndex(isPlate);
  if (plateIdx < 0) throw new Error('no full-canvas plate path — check the export');

  /* In this drawing #FEFEFE is the sky, everywhere it appears: the two halves
     it was split into, and the slivers of daylight between towers. Every other
     tone is shading ON a building. So the silhouette is the plate with the sky
     punched out of it, which one even-odd path says exactly — no mask element,
     and no page colour baked into the asset. */
  const SKY = '#FEFEFE';
  const sky = paths.filter((p) => fillOf(p).toUpperCase() === SKY);
  sky_n = sky.length;
  if (!sky.length) throw new Error(`no ${SKY} sky paths — check the export`);

  dropped = paths.length - 1 - sky.length;
  const d = [paths[plateIdx][1], ...sky.map((p) => p[1])].join(' ');
  const body = `<path fill-rule="evenodd" clip-rule="evenodd" d="${d}" fill="${farTone}"/>`;
  svg = svg.replace(/(<svg[^>]*>)[\s\S]*(<\/svg>)/, `$1${body}$2`);
} else {
  // 2. silhouette tones to the footer ink
  for (const tone of SILHOUETTE) {
    const re = new RegExp(`fill="${tone}"`, 'gi');
    recoloured += (svg.match(re) || []).length;
    svg = svg.replace(re, `fill="${INK}"`);
  }

  // 3. Martinelli
  svg = svg.replace('</svg>', martinelli() + '</svg>');
}

// 3. make it scalable and unannounced — it is decoration, and the copyright
//    below already carries the meaning.
svg = svg.replace(
  /<svg[^>]*>/,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" ` +
  'preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">'
);

// Figma ships every path with an id; none of them are referenced.
svg = svg.replace(/\s+id="(?!sky)[^"]*"/g, '');

/* Figma writes six decimal places. At the size this is ever drawn, one decimal
   is finer than a pixel, and the difference is most of the file — which loads
   on every page of the site. */
svg = svg.replace(/-?\d+\.\d+/g, (v) => String(Math.round(parseFloat(v) * 10) / 10));
// "12 -3" is as valid as "12,-3" and the minus already separates the pair
svg = svg.replace(/ -/g, '-');

await writeFile(output, svg, 'utf8');

const tones = [...new Set((svg.match(/fill="#[0-9A-Fa-f]{6}"/g) || []))].length;
console.log(`${output}   (${farTone ? 'far' : 'near'}, viewBox ${vb})`);
console.log(`  plate removed:   ${plate ? 'yes' : 'none in this export'}`);
if (farTone) console.log(`  plate minus sky: ${sky_n} sky paths punched out, ${dropped} detail paths dropped`);
else console.log(`  recoloured:      ${recoloured} paths → ${INK}`);
console.log(`  tones remaining: ${tones}`);
console.log(`  size:            ${Math.round(before / 1024)}KB → ${Math.round(svg.length / 1024)}KB`);
