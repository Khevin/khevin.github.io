/* Draws the São Paulo skyline that divides the footer.
 *
 * Original artwork, not a sourced silhouette — the stock ones are licensed, and
 * none of them give MASP the room it needs. Flat one-colour, in the spirit of
 * the Mad Men title card: geometry only, legible at a glance and at 90px tall.
 *
 * Two rules the first attempt broke. A skyline is a CONTINUOUS band — buildings
 * abut and overlap, and any gap at the baseline reads as a missing tooth, not
 * as space. And landmarks have to sit IN that band rather than beside it, or
 * they read as objects on a shelf.
 *
 * Left to right: the Estaiada bridge, the Sé cathedral's twin spires, Copan's
 * wave, Altino Arantes stepping up, Edifício Itália, and MASP. MASP is the one
 * shape that depends on the baseline: its suspended box reads as a VOID under
 * the beam, and a void needs sky behind it, so the run behind it is kept low
 * and its two legs are all that touch down.
 *
 *   node explorations/build-skyline.mjs
 */
import { writeFile } from 'node:fs/promises';

const W = 1600, H = 240, BASE = 240;
const parts = [];
const n = (v) => Math.round(v * 10) / 10;

const box = (x, w, h) => parts.push(`M${n(x)} ${BASE}V${n(BASE - h)}h${n(w)}V${BASE}Z`);

/** A run of abutting blocks. Returns where it ends so the next thing butts on. */
const run = (x, heights, w = 34) => {
  let at = x;
  for (const h of heights) { box(at, w, h); at += w; }
  return at;
};

/* ---- the city floor: unbroken, edge to edge ----------------------------- */
/* Drawn first and low, so everything else stands in front of it and no gap can
   open at the baseline whatever the landmarks do. */
{
  let at = 0;
  const seed = [46, 62, 38, 74, 52, 44, 68, 40, 58, 50, 72, 42, 60, 36, 66, 48,
                54, 70, 40, 62, 44, 56, 38, 64, 50, 46, 68, 42, 58, 52, 36, 60,
                48, 66, 40, 54, 44, 70, 38, 62, 30, 34, 28, 32, 26, 30, 24, 28];
  for (let i = 0; at < W; i++) { box(at, 36, seed[i % seed.length]); at += 34; }
}

/* ---- Ponte Estaiada ----------------------------------------------------- */
{
  const x = 150, deck = BASE - 78, top = BASE - 224, cross = BASE - 148;
  parts.push(`M${x - 96} ${deck}h332v13h-332Z`);                       // deck
  const mast = (lx, rx) => {                                           // one crossed leg pair
    parts.push(`M${lx} ${deck}L${n(lx + 44)} ${cross}L${n(rx)} ${top}h13L${n(lx + 57)} ${cross}L${n(lx + 13)} ${deck}Z`);
  };
  mast(x + 18, x + 74);
  parts.push(`M${n(x + 150)} ${deck}L${n(x + 106)} ${cross}L${n(x + 93)} ${top}h13L${n(x + 119)} ${cross}L${n(x + 163)} ${deck}Z`);
  for (let i = 0; i < 7; i++) {                                        // cable fans
    const t = i / 6;
    parts.push(`M${n(x + 80)} ${n(top + 8)}L${n(x - 82 + t * 120)} ${deck}l7 0Z`);
    parts.push(`M${n(x + 99)} ${n(top + 8)}L${n(x + 148 + t * 120)} ${deck}l7 0Z`);
  }
}

/* ---- a denser mid-rise shoulder ---------------------------------------- */
run(470, [96, 128, 110, 150, 118], 40);

/* ---- Catedral da Sé ----------------------------------------------------- */
{
  const x = 680, body = 96, b = BASE - body;
  box(x, 120, body);
  parts.push(`M${x + 14} ${b}l6 -58 5 -26 5 26 6 58Z`);        // left spire, stepped
  parts.push(`M${x + 84} ${b}l6 -58 5 -26 5 26 6 58Z`);        // right spire
  parts.push(`M${x + 40} ${b}a20 26 0 0 1 40 0Z`);             // dome
  box(x + 56, 8, body + 34);                                   // lantern
}

/* ---- Copan — Niemeyer's wave ------------------------------------------- */
{
  const x = 812, w = 176, h = 138, y = BASE - h;
  parts.push(
    `M${x} ${BASE}V${n(y + 22)}` +
    `C${n(x + 40)} ${n(y - 16)} ${n(x + 84)} ${n(y + 40)} ${n(x + 124)} ${n(y + 8)}` +
    `C${n(x + 148)} ${n(y - 10)} ${n(x + 166)} ${n(y + 4)} ${n(x + w)} ${n(y + 16)}` +
    `V${BASE}Z`
  );
}

run(988, [104, 132, 118], 38);

/* ---- Altino Arantes (Farol Santander) ---------------------------------- */
{
  const x = 1102;
  box(x, 92, 132);
  box(x + 16, 60, 182);
  box(x + 30, 32, 214);
  box(x + 43, 6, 244);                                          // mast
}

/* ---- Edifício Itália ---------------------------------------------------- */
{
  const x = 1206;
  box(x, 70, 198);
  box(x + 17, 36, 216);
}

run(1282, [86, 104, 72], 36);

/* ---- MASP --------------------------------------------------------------- */
/* The run behind it is the low tail of the city floor, so the void keeps its
   sky. The beam oversails both legs — that overhang is the whole gesture. */
{
  const x = 1414, span = 172, legW = 17, legH = 104;
  const beamBottom = BASE - legH, beamTop = beamBottom - 56;
  parts.push(`M${n(x - 14)} ${n(beamTop)}h${n(span + 28)}v56h-${n(span + 28)}Z`);
  parts.push(`M${n(x)} ${n(beamBottom)}h${legW}V${BASE}h-${legW}Z`);
  parts.push(`M${n(x + span - legW)} ${n(beamBottom)}h${legW}V${BASE}h-${legW}Z`);
}

/* The footer band is about 12:1. Drawing at 6.7:1 and stretching to fit halved
   every height, and by a different amount at every viewport width. Draw in
   coordinates that read well, then emit at the proportion it is displayed at. */
const SQUASH = 0.55;
const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Math.round(H * SQUASH)}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <g transform="scale(1 ${SQUASH})"><path fill="#000" d="${parts.join('')}"/></g>
</svg>
`;

await writeFile('assets/skyline-sp.svg', svg, 'utf8');
console.log(`assets/skyline-sp.svg  ${Math.round(svg.length / 102.4) / 10}KB, ${parts.length} shapes`);
