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
 * That file is built in two storeys and both are needed:
 *
 *   - a full-canvas dark plate with the sky, in two big halves, laid over the
 *     top of it. Cutting that sky out of the plate reveals the low, dense part
 *     of the city.
 *   - every TOWER drawn again, dark, ON TOP of that sky. So cutting the sky
 *     alone deletes them — which is what once flattened this layer into half a
 *     skyline with a single spire floating above it.
 *
 * So the silhouette is the plate minus the sky, with the towers laid back on.
 * Only the two big halves count as sky; the other #FEFEFE shapes are small
 * highlights drawn on the buildings, and punching those out scratched white
 * lines through the towers. Everything else — the outlines and the shading —
 * is dropped. At the size a layer set this far back is drawn that detail is
 * only noise, and losing it is most of what makes it read as distance.
 *
 *   node explorations/clean-skyline.mjs explorations/skyline-src/figma-export.svg assets/skyline-sp.svg
 *   node explorations/clean-skyline.mjs explorations/skyline-src/figma-export-back.svg assets/skyline-sp-back.svg '#c8c8d2'
 */
import { readFile, writeFile } from 'node:fs/promises';

const [input, output, farTone] = process.argv.slice(2);
if (!input || !output) throw new Error('usage: clean-skyline.mjs <in.svg> <out.svg> [farTone]');

const INK = '#16161b';

/* The page colour, read out of the identity rather than written down here, so
   the asset and the stylesheet cannot drift apart. The drawing needs it because
   its sky is PAINTED, not empty: the buildings are one dark mass and the sky is
   pale shapes laid over the top. Wherever such a shape touches the real page —
   the bridge's cable fan most of all — a tone that is merely close reads as a
   panel sitting on the paper. White is 2.4% brighter than this paper, which over
   an area that size is exactly the smudge you see. */
const IDENTITY = new URL('./parked/signal.css', import.meta.url);
const PAPER = (await readFile(IDENTITY, 'utf8')).match(/--paper:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
if (!PAPER) throw new Error('could not read --paper from signal.css');

/* The bridge, in the drawing's own coordinates. Inside it the mid greys are
   more sky — the fan is carved in three tones that disagree, which is what webs
   the cables together instead of separating them. Outside it those same greys
   are real building shading and lit windows, so this is deliberately a region
   and not a global swap. Paths are placed by their first move-to, which for
   shapes this small sits inside the shape; checked against real bounding boxes
   in the browser, the two agree exactly on every grey path here. */
const BRIDGE = { x0: 248, x1: 432, y0: 95, y1: 215 };
const FAN = new Set(['#E2E2E3', '#CDCECF', '#B6B7B8']);

/* The cables have the same problem from the other end: one object drawn in five
   tones. Most are ink, but a handful came out of the trace two or three steps
   lighter, and a lighter cable does not read as a cable further away — it reads
   as a smear across the ones around it. They go to one ink, so the fan is a fan.
   Stops short of the Luz tower at 425, whose body is drawn in #232223 too. */
const CABLE = { x0: 248, x1: 425, y0: 95, y1: 215 };
const STRAND = new Set(['#232223', '#363738', '#555556', '#737272']);
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
  const slot = (x) => `<rect x="${x}" y="36" width="2.7" height="6.4" fill="${PAPER}"/>`;
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
let skyed = 0;
let fanned = 0;
let stranded = 0;
let towersN = 0;

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

  /* The drawing is in two storeys and both are needed.
     The plate carries the low, dense part of the city, revealed by cutting the
     sky out of it. But every TOWER is drawn again, dark, ON TOP of that sky —
     so cutting the sky alone deletes them, which is what flattened this layer
     into half a skyline with one spire floating over it.
     So: plate minus sky, and then the towers laid back on. */
  const SKY = '#FEFEFE';
  const white = paths.filter((p) => fillOf(p).toUpperCase() === SKY)
    .sort((a, b) => b[1].length - a[1].length);
  if (white.length < 2) throw new Error(`expected at least two ${SKY} paths — check the export`);

  /* Only the two big halves of sky are sky. The other #FEFEFE shapes are small
     highlights drawn ON the buildings, and punching those out scratched white
     lines through the towers. The split is not close — the halves are six times
     the next one — so it is taken as a ratio rather than a magic number. */
  const sky = white.filter((p) => p[1].length > white[0][1].length / 2);
  if (sky.length !== 2) throw new Error(`expected two sky halves, found ${sky.length}`);
  sky_n = sky.length;

  const towers = paths.filter((p, i) => i !== plateIdx && fillOf(p) === '#141313');
  towersN = towers.length;
  dropped = paths.length - 1 - sky.length - towers.length;

  const ground = [paths[plateIdx][1], ...sky.map((p) => p[1])].join(' ');

  /* Haze. The drawing is a rectangle, so left to itself it ends in two vertical
     cuts and a ground line that stops in mid-air over the paper — which reads
     as a crop, not as a city carrying on past the edge of the page. Fading both
     ends is also just what distance does to a skyline. Baked into the asset
     rather than set in CSS so the file is self-contained. */
  const body =
    '<defs>' +
    `<linearGradient id="haze" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="0.14" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="0.86" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
    `</linearGradient>` +
    `<mask id="ends"><rect width="${W}" height="${H}" fill="url(#haze)"/></mask>` +
    '</defs>' +
    `<g mask="url(#ends)">` +
    `<path fill-rule="evenodd" clip-rule="evenodd" d="${ground}" fill="${farTone}"/>` +
    towers.map((p) => `<path d="${p[1]}" fill="${farTone}"/>`).join('') +
    '</g>';
  svg = svg.replace(/(<svg[^>]*>)[\s\S]*(<\/svg>)/, `$1${body}$2`);
} else {
  // 2. silhouette tones to the footer ink
  for (const tone of SILHOUETTE) {
    const re = new RegExp(`fill="${tone}"`, 'gi');
    recoloured += (svg.match(re) || []).length;
    svg = svg.replace(re, `fill="${INK}"`);
  }

  /* 3. the sky becomes the page.
     Every pure white in the drawing, wherever it is. Against a dark building a
     window painted white and one painted paper are the same to the eye, so
     nothing that reads as a lit window changes; against the page, a cut-out
     stops being a slightly brighter panel and simply becomes the page. */
  skyed = (svg.match(/fill="white"/g) || []).length;
  svg = svg.replace(/fill="white"/g, `fill="${PAPER}"`);

  /* and the bridge's disagreeing tones: its three pale greys are sky, its four
     darks are all the same cable. Placed by first move-to — for shapes this
     small that point is inside the shape, and checked against real bounding
     boxes in the browser the two agree on every path here. */
  svg = svg.replace(/<path[^>]*>/g, (tag) => {
    const f = (tag.match(/fill="([^"]+)"/) || [, ''])[1].toUpperCase();
    const sky = FAN.has(f), strand = STRAND.has(f);
    if (!sky && !strand) return tag;
    const m = tag.match(/\sd="M(-?[\d.]+)[\s,]+(-?[\d.]+)/);
    if (!m) return tag;
    const x = +m[1], y = +m[2];
    const box = sky ? BRIDGE : CABLE;
    if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1) return tag;
    if (sky) fanned += 1; else stranded += 1;
    return tag.replace(/fill="[^"]+"/, `fill="${sky ? PAPER : INK}"`);
  });

  // 4. Martinelli
  svg = svg.replace('</svg>', martinelli() + '</svg>');
}

// 3. make it scalable and unannounced — it is decoration, and the copyright
//    below already carries the meaning.
svg = svg.replace(
  /<svg[^>]*>/,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" ` +
  /* These two are intermediates now: build-skyline-band.mjs embeds them into a
     wider band, so they keep their true proportions and nothing here stretches
     them. */
  'preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">'
);

// Figma ships every path with an id; none of them are referenced.
svg = svg.replace(/\s+id="(?!haze|ends)[^"]*"/g, '');

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
if (farTone) console.log(`  rebuilt:         plate minus ${sky_n} sky halves + ${towersN} towers, ${dropped} detail paths dropped`);
else console.log(`  recoloured:      ${recoloured} paths → ${INK}`);
if (!farTone) console.log(`  sky → page:      ${skyed} white + ${fanned} bridge greys → ${PAPER}`);
if (!farTone) console.log(`  cables unified:  ${stranded} paths → ${INK}`);
console.log(`  tones remaining: ${tones}`);
console.log(`  size:            ${Math.round(before / 1024)}KB → ${Math.round(svg.length / 1024)}KB`);
