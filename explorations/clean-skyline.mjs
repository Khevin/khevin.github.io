/* Cleans Khevin's Figma São Paulo skyline for use as the footer divider.
 *
 * The export arrives as 649 paths in 13 greys on an opaque #F5F5F5 plate. Three
 * things have to change and nothing else — it is his drawing, not mine.
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
 *   node explorations/clean-skyline.mjs <in.svg> <out.svg>
 */
import { readFile, writeFile } from 'node:fs/promises';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('usage: clean-skyline.mjs <in.svg> <out.svg>');

const INK = '#16161b';
/* Everything at or below this luminance is silhouette rather than detail.
   #232223 sits just above the footer ink and reads as the nearest layer of
   depth, so it is deliberately left alone. */
const SILHOUETTE = ['#030303', '#171718', '#1A1A1A', '#000000'];

let svg = await readFile(input, 'utf8');
const before = svg.length;

// 1. the plate
const plate = svg.match(/<rect[^>]*fill="#F5F5F5"[^>]*\/>\s*/i);
svg = svg.replace(/<rect[^>]*fill="#F5F5F5"[^>]*\/>\s*/i, '');

// 2. silhouette tones to the footer ink
let recoloured = 0;
for (const tone of SILHOUETTE) {
  const re = new RegExp(`fill="${tone}"`, 'gi');
  recoloured += (svg.match(re) || []).length;
  svg = svg.replace(re, `fill="${INK}"`);
}

// 3. make it scalable and unannounced — it is decoration, and the copyright
//    below already carries the meaning.
svg = svg.replace(
  /<svg[^>]*>/,
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 711 245" fill="none" ' +
  'preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">'
);

// Figma ships every path with an id; none of them are referenced.
svg = svg.replace(/\s+id="[^"]*"/g, '');

/* Figma writes six decimal places. At the size this is ever drawn, one decimal
   is finer than a pixel, and the difference is most of the file — which loads
   on every page of the site. */
svg = svg.replace(/-?\d+\.\d+/g, (v) => String(Math.round(parseFloat(v) * 10) / 10));
// "12 -3" is as valid as "12,-3" and the minus already separates the pair
svg = svg.replace(/ -/g, '-');

await writeFile(output, svg, 'utf8');

const tones = [...new Set((svg.match(/fill="#[0-9A-Fa-f]{6}"/g) || []))].length;
console.log(`${output}`);
console.log(`  plate removed:   ${plate ? 'yes' : 'NOT FOUND — check the export'}`);
console.log(`  recoloured:      ${recoloured} paths → ${INK}`);
console.log(`  tones remaining: ${tones}`);
console.log(`  size:            ${Math.round(before / 1024)}KB → ${Math.round(svg.length / 1024)}KB`);
