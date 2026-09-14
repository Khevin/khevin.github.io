/* Cuts bar-signal.png into three depth planes and rebuilds what sits behind
   each one.
     BG  the red wall and the pendant lamp        (opaque, complete)
     MG  the black architecture, shelf, bottles   (alpha)
     FG  the bar counter and the wine glass       (alpha)
   Run with --debug to write a tinted overlay instead of the layers. */
import { readPng, writePng } from './png.mjs';

const DEBUG = process.argv.includes('--debug');
const { w, h, ch, px } = await readPng('assets/bar-signal.png');
const N = w * h;

const CREAM = 1, WINE = 2, BLACK = 3, RED = 4;
const cls = new Uint8Array(N);
for (let i = 0, p = 0; i < N; i++, p += ch) {
  const r = px[p], g = px[p + 1], b = px[p + 2];
  if (r > 150 && g > 140 && b > 115) cls[i] = CREAM;
  else if (r > 35 && r < 130 && g < 45 && b < 60 && r > g * 1.8) cls[i] = WINE;
  else if (Math.max(r, g, b) < 72) cls[i] = BLACK;
  else cls[i] = RED;
}
const lit = (i) => cls[i] === CREAM || cls[i] === WINE;
const ink = (i) => cls[i] !== RED;

// ---- the counter: the solid band across the bottom -------------------------
/* Walk up from the bottom while the row is still essentially solid. The
   threshold is loose on purpose: the counter's cream edge is a single ruled
   line and it breaks in a few places, and at 0.97 the walk stopped just under
   it — which left that line in the midground while the counter it belongs to
   was in the foreground. They would have slid apart. */
let counterTop = h;
for (let y = h - 1; y >= 0; y--) {
  let dark = 0;
  for (let x = 0; x < w; x++) if (ink(y * w + x)) dark++;
  if (dark / w < 0.86) { counterTop = y + 1; break; }
}

// ---- the glass -------------------------------------------------------------
/* The bowl is the lit region around the wine. Filling over CREAM+WINE only —
   never BLACK — keeps it from leaking into the column its rim crosses. */
const glass = new Uint8Array(N);
const BOWL = { x0: 1225, x1: 1500, y0: 235, y1: 545 };
{
  const seed = (390 * w) + 1360;            // inside the wine
  const st = new Int32Array(N); let sp = 0;
  if (lit(seed)) { st[sp++] = seed; glass[seed] = 1; }
  while (sp) {
    const i = st[--sp], x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < BOWL.x0 || nx > BOWL.x1 || ny < BOWL.y0 || ny > BOWL.y1) continue;
      const j = ny * w + nx;
      if (!glass[j] && lit(j)) { glass[j] = 1; st[sp++] = j; }
    }
  }
}
// bowl extent, then the stem below it: the narrow dark run under the bowl's centre
let bx0 = w, bx1 = 0, by1 = 0;
for (let i = 0; i < N; i++) if (glass[i]) { const x = i % w, y = (i / w) | 0; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y > by1) by1 = y; }
const cx = ((bx0 + bx1) / 2) | 0;
/* Walk down from the bowl taking every narrow dark run near its centre line.
   Scanning a window and choosing the closest run — rather than testing one
   column and giving up when it misses — is what keeps the stem whole: it is
   only a few pixels wide, it drifts, and a skipped row leaves a gap that the
   midground then claims. The tolerance widens at the foot, where the base
   flares onto the counter. */
for (let y = by1; y < counterTop; y++) {
  const maxRun = y > counterTop - 34 ? 170 : 52;
  let best = null;
  for (let x = cx - 80; x <= cx + 80; x++) {
    if (!ink(y * w + x)) continue;
    let l = x, r = x;
    while (l > 0 && ink(y * w + l - 1)) l--;
    while (r < w - 1 && ink(y * w + r + 1)) r++;
    x = r;                                   // jump past this run
    if (r - l > maxRun) continue;            // that is the column, not the stem
    const d = Math.abs((l + r) / 2 - cx);
    if (!best || d < best.d) best = { l, r, d };
  }
  if (best) for (let k = best.l; k <= best.r; k++) glass[y * w + k] = 1;
}

/* Close the stem down its length. The highlight rings across it read as their
   own runs and a couple of rows still fell to the midground; a short vertical
   close takes any ink pixel bridged by glass above and below. */
for (let x = bx0 - 40; x <= bx1 + 40; x++) {
  if (x < 0 || x >= w) continue;
  let last = -1;
  for (let y = BOWL.y0; y < counterTop; y++) {
    if (!glass[y * w + x]) continue;
    if (last >= 0 && y - last <= 14) {
      for (let k = last + 1; k < y; k++) if (ink(k * w + x)) glass[k * w + x] = 1;
    }
    last = y;
  }
}

// ---- the lamp: the big lit disc up right, plus the cord above it -----------
const lamp = new Uint8Array(N);
{
  const st = new Int32Array(N); let sp = 0;
  const seed = (130 * w) + 1570;
  if (lit(seed)) { st[sp++] = seed; lamp[seed] = 1; }
  while (sp) {
    const i = st[--sp], x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1450 || nx > 1700 || ny < 0 || ny > 260) continue;
      const j = ny * w + nx;
      if (!lamp[j] && lit(j)) { lamp[j] = 1; st[sp++] = j; }
    }
  }
  // the fitting and cord: dark pixels directly above the globe
  let gx0 = w, gx1 = 0, gy0 = h;
  for (let i = 0; i < N; i++) if (lamp[i]) { const x = i % w, y = (i / w) | 0; if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; }
  const mid = ((gx0 + gx1) / 2) | 0;
  for (let y = 0; y < gy0 + 12; y++) for (let x = mid - 45; x <= mid + 45; x++) {
    const j = y * w + x; if (ink(j)) lamp[j] = 1;
  }
}

// ---- assemble the three planes --------------------------------------------
const FG = new Uint8Array(N), MG = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const y = (i / w) | 0;
  if (y >= counterTop || glass[i]) { FG[i] = 1; continue; }
  if (ink(i) && !lamp[i]) MG[i] = 1;
}

if (DEBUG) {
  const out = Buffer.alloc(N * 4);
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    const s = i * ch;
    let [r, g, b] = [px[s], px[s + 1], px[s + 2]];
    if (FG[i]) { r = (r + 255) >> 1; g = g >> 1; b = b >> 1; }            // red tint
    else if (MG[i]) { r = r >> 1; g = (g + 255) >> 1; b = b >> 1; }       // green tint
    else if (lamp[i]) { r = r >> 1; g = g >> 1; b = (b + 255) >> 1; }     // blue tint
    out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = 255;
  }
  const sz = await writePng('explorations/bar-debug.png', { w, h, px: out });
  console.log(`counter top y=${counterTop}`);
  console.log(`glass  ${[...glass].reduce((a, b) => a + b, 0)}px  bbox x ${bx0}-${bx1}`);
  console.log(`FG ${(FG.reduce((a, b) => a + b, 0) / N * 100).toFixed(1)}%  MG ${(MG.reduce((a, b) => a + b, 0) / N * 100).toFixed(1)}%  lamp ${(lamp.reduce((a, b) => a + b, 0) / N * 100).toFixed(1)}%`);
  console.log(`wrote debug overlay (${Math.round(sz / 1024)}KB)`);
  process.exit(0);
}

/* ---- rebuild what is behind ------------------------------------------------
   A hole is filled by walking outward from its rim, so every hidden pixel takes
   the colour of the nearest thing that is actually there. On art this flat that
   reproduces the wall and the beams exactly; it is only ever asked to guess
   along the few pixels of an edge that passed behind something. */
/* Grow outward from a chosen SOURCE class only, and record how far each pixel
   had to reach to find one.
   Healing from whatever happens to touch the rim is what smeared the first
   attempt: a hole bounded partly by red wall and partly by a black beam takes
   both, and you get streaks. Restricting the sources to the one class that
   belongs on this plane — the wall for the background, the architecture for the
   midground — means a hole can only ever be filled with the right material. */
function grow(src, isSource) {
  const out = Buffer.from(src);
  const dist = new Int32Array(N).fill(-1);
  const q = new Int32Array(N); let qh = 0, qt = 0;
  for (let i = 0; i < N; i++) if (isSource[i]) { dist[i] = 0; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++], x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const j = ny * w + nx;
      if (dist[j] !== -1) continue;
      dist[j] = dist[i] + 1;
      out[j * 4] = out[i * 4]; out[j * 4 + 1] = out[i * 4 + 1];
      out[j * 4 + 2] = out[i * 4 + 2]; out[j * 4 + 3] = 255;
      q[qt++] = j;
    }
  }
  return { out, dist };
}

const rgba = Buffer.alloc(N * 4);
for (let i = 0, p = 0; i < N; i++, p += 4) {
  const s = i * ch;
  rgba[p] = px[s]; rgba[p + 1] = px[s + 1]; rgba[p + 2] = px[s + 2]; rgba[p + 3] = 255;
}

/* Every edge in this picture is a two-pixel blend between the object and what
   is behind it. A classifier with hard thresholds puts that fringe in neither
   camp, so it stayed on the wall and the glass left a wireframe of itself
   behind. Each mask grows by a couple of pixels to swallow its own fringe: the
   layer carries the blend it belongs to, and the plane beneath loses it. */
function dilate(mask, r) {
  const out = Uint8Array.from(mask);
  const dist = new Int32Array(N).fill(-1);
  const q = new Int32Array(N); let qh = 0, qt = 0;
  for (let i = 0; i < N; i++) if (mask[i]) { dist[i] = 0; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++];
    if (dist[i] >= r) continue;
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const j = ny * w + nx;
      if (dist[j] !== -1) continue;
      dist[j] = dist[i] + 1; out[j] = 1; q[qt++] = j;
    }
  }
  return out;
}
const FGd = dilate(FG, 2);
const MGd = dilate(MG, 2);

/* BG — the wall, grown from the wall alone, then the lamp put back on top.
   The wall is the flattest thing in the picture (five levels across a
   500x300 patch), so growing it over the holes reproduces it exactly. */
const wall = new Uint8Array(N);
for (let i = 0; i < N; i++) if (cls[i] === RED && !FGd[i] && !MGd[i]) wall[i] = 1;
const grownWall = grow(rgba, wall);
const bg = grownWall.out;
/* Holes take one flat red rather than the nearest wall pixel. Carrying the
   wall's grain into them cost 400KB in a file that is 80% one colour, and at a
   spread of five levels there is nothing to carry. */
let sr = 0, sg = 0, sb = 0, sn = 0;
for (let i = 0, p = 0; i < N; i++, p += 4) if (wall[i]) { sr += rgba[p]; sg += rgba[p + 1]; sb += rgba[p + 2]; sn++; }
const flat = [Math.round(sr / sn), Math.round(sg / sn), Math.round(sb / sn)];
for (let i = 0, p = 0; i < N; i++, p += 4) {
  if (lamp[i]) { bg[p] = rgba[p]; bg[p + 1] = rgba[p + 1]; bg[p + 2] = rgba[p + 2]; continue; }
  if (grownWall.dist[i] > 0) { bg[p] = flat[0]; bg[p + 1] = flat[1]; bg[p + 2] = flat[2]; }
}
console.log(`  wall fill    #${flat.map((v) => v.toString(16).padStart(2, '0')).join('')}`);

/* MG — the architecture, grown from the architecture alone so the beams carry
   on behind the glass rather than stopping at its rim. Capped at REACH: far
   enough to cross anything the glass hides, short of spreading across the
   open wall, which is not this layer's to fill. */
/* Only as far as the glass can ever travel. Any further and the beam's cuff
   stops being a cuff and becomes a glass-shaped blob on this layer. */
const REACH = 30;
/* Sources are the UNgrown architecture. The dilated mask reaches two pixels
   into the glass's own fringe, and feeding those back in as "architecture"
   grew flecks of cream and wine into the cuff. */
const arch = new Uint8Array(N);
for (let i = 0; i < N; i++) if (MG[i]) arch[i] = 1;
const grown = grow(rgba, arch);
/* The cuff is painted one flat beam-black rather than the nearest architecture
   pixel. Nearest-pixel dragged the thin cream edge-lines into it, and once the
   glass slid off, that showed as a speckled strip down its rim. What is behind
   the glass is beam, and beam is one colour. */
let br = 0, bg_ = 0, bb = 0, bn = 0;
for (let i = 0, p = 0; i < N; i++, p += 4) if (MG[i] && cls[i] === BLACK) { br += rgba[p]; bg_ += rgba[p + 1]; bb += rgba[p + 2]; bn++; }
const beam = [Math.round(br / bn), Math.round(bg_ / bn), Math.round(bb / bn)];
const mg = Buffer.alloc(N * 4);
for (let i = 0, p = 0; i < N; i++, p += 4) {
  if (MGd[i]) {
    mg[p] = rgba[p]; mg[p + 1] = rgba[p + 1]; mg[p + 2] = rgba[p + 2]; mg[p + 3] = 255;
  } else if (FGd[i] && grown.dist[i] > 0 && grown.dist[i] <= REACH) {
    mg[p] = beam[0]; mg[p + 1] = beam[1]; mg[p + 2] = beam[2]; mg[p + 3] = 255;
  }
}
console.log(`  beam cuff    #${beam.map((v) => v.toString(16).padStart(2, '0')).join('')}`);

// FG: the counter and the glass, as they are
const fg = Buffer.alloc(N * 4);
for (let i = 0, p = 0; i < N; i++, p += 4) {
  if (!FGd[i]) continue;
  fg[p] = rgba[p]; fg[p + 1] = rgba[p + 1]; fg[p + 2] = rgba[p + 2]; fg[p + 3] = 255;
}

const a = await writePng('assets/bar/bar-bg.png', { w, h, px: bg });
const b = await writePng('assets/bar/bar-mg.png', { w, h, px: mg });
const c = await writePng('assets/bar/bar-fg.png', { w, h, px: fg });
console.log(`counter top y=${counterTop}`);
console.log(`  bar-bg.png  ${Math.round(a / 1024)}KB   wall + lamp, healed`);
console.log(`  bar-mg.png  ${Math.round(b / 1024)}KB   architecture + shelf + bottles`);
console.log(`  bar-fg.png  ${Math.round(c / 1024)}KB   counter + glass`);
