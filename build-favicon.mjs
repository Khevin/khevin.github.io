/* Draws the favicon: the wordmark's own lowercase k, Fraunces 900, ink on paper,
 * with the Signal dot for the counter.
 *
 * The mark is vector and belongs in the repo as vector — assets/favicon/favicon.svg
 * is the master and the icon modern browsers actually use. Everything else here is
 * derived from it: the two PNGs for tabs, the apple-touch icon, the two Android
 * icons the manifest names, and the .ico for Windows and anything old.
 *
 * It is regenerated rather than hand-exported because the paper is baked in.
 * assets/hats-signal.png taught that lesson the hard way — a flat ground painted
 * into an image is a hidden dependency on one exact page colour, invisible until
 * the colour moves. Here the ground is deliberate (a favicon sits on the browser's
 * chrome, not on the page) but it is still a dependency, so it is written down as
 * PAPER below and one command puts every file back in agreement:
 *
 *   node build-favicon.mjs
 *
 * assets/favicon/site.webmanifest carries the same colour twice, for the Android
 * splash. Move PAPER and move those too.
 *
 * No dependencies, same as the rest of the scripts here: the rasteriser is a
 * scanline fill (analytic across x, 8 samples down y) and the PNG writer is the
 * one from explorations/key-artwork-background.mjs.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import zlib from 'node:zlib';

/* ---- 1. the mark ------------------------------------------------------- */
/* Two paths, drawn in this order: the letter, then the dot on top of it. Their
   own tight box is 45.8836 x 54.756, which is what MARK records — the placement
   maths below needs the ink's real bounds, not a rounded viewBox. */
const LETTER = 'M1.40395 53.928C0.923951 53.928 0.575951 53.832 0.359951 53.64C0.143951 53.448 0.0359513 53.172 0.0359513 52.812C0.0359513 52.572 0.107951 52.356 0.251951 52.164C0.395951 51.972 0.647951 51.816 1.00795 51.696L2.37595 51.336C2.73595 51.216 2.98795 51.012 3.13195 50.724C3.27595 50.436 3.34795 49.98 3.34795 49.356V7.41598C3.34795 6.95998 3.27595 6.63598 3.13195 6.44398C2.98795 6.25198 2.75995 6.13198 2.44795 6.08397L0.863951 5.97598C0.551951 5.90398 0.323951 5.78398 0.179951 5.61598C0.0599512 5.44798 -4.88013e-05 5.23198 -4.88013e-05 4.96798C-4.88013e-05 4.65598 0.0839512 4.41598 0.251951 4.24797C0.419951 4.07998 0.731951 3.91198 1.18795 3.74398L10.656 0.719977C11.352 0.455976 11.892 0.275976 12.276 0.179977C12.684 0.0599775 13.08 -2.24113e-05 13.464 -2.24113e-05C14.04 -2.24113e-05 14.472 0.167977 14.76 0.503975C15.048 0.815976 15.192 1.22398 15.192 1.72798V49.356C15.192 49.98 15.264 50.436 15.408 50.724C15.576 51.012 15.84 51.216 16.2 51.336L17.532 51.696C18.06 51.936 18.324 52.296 18.324 52.776C18.324 53.544 17.844 53.928 16.884 53.928H1.40395ZM12.42 39.888L26.316 27.468C27.3 26.58 27.684 25.728 27.468 24.912C27.276 24.072 26.58 23.484 25.38 23.148L24.156 22.824C23.82 22.704 23.592 22.56 23.472 22.392C23.352 22.224 23.292 22.02 23.292 21.78C23.292 21.42 23.412 21.144 23.652 20.952C23.916 20.76 24.252 20.664 24.66 20.664H38.448C38.88 20.664 39.216 20.76 39.456 20.952C39.72 21.144 39.852 21.408 39.852 21.744C39.852 22.056 39.744 22.32 39.528 22.536C39.336 22.752 38.904 22.944 38.232 23.112C36.624 23.472 35.148 24.036 33.804 24.804C32.46 25.548 31.02 26.604 29.484 27.972L13.464 42.012L12.42 39.888ZM25.2 29.556L37.764 49.536C38.148 50.112 38.508 50.544 38.844 50.832C39.204 51.096 39.648 51.348 40.176 51.588C40.56 51.804 40.836 52.02 41.004 52.236C41.172 52.428 41.256 52.656 41.256 52.92C41.256 53.232 41.136 53.484 40.896 53.676C40.656 53.844 40.332 53.928 39.924 53.928H23.292C22.908 53.928 22.596 53.832 22.356 53.64C22.14 53.448 22.032 53.184 22.032 52.848C22.032 52.608 22.092 52.416 22.212 52.272C22.332 52.104 22.536 51.96 22.824 51.84L23.976 51.516C24.528 51.372 24.84 51.132 24.912 50.796C25.008 50.46 24.84 49.956 24.408 49.284L17.136 37.26L25.2 29.556Z';
const DOT = 'M38.9356 54.756C37.6396 54.756 36.4636 54.432 35.4076 53.784C34.3756 53.112 33.5476 52.236 32.9236 51.156C32.3236 50.076 32.0236 48.9 32.0236 47.628C32.0236 46.332 32.3236 45.156 32.9236 44.1C33.5476 43.044 34.3756 42.204 35.4076 41.58C36.4636 40.932 37.6396 40.608 38.9356 40.608C40.2316 40.608 41.4076 40.932 42.4636 41.58C43.5196 42.204 44.3476 43.044 44.9476 44.1C45.5716 45.156 45.8836 46.332 45.8836 47.628C45.8836 48.9 45.5716 50.076 44.9476 51.156C44.3476 52.236 43.5196 53.112 42.4636 53.784C41.4316 54.432 40.2556 54.756 38.9356 54.756Z';
const MARK = { w: 45.8836, h: 54.756 };

const PAPER = '#f9f9fc';   /* identity.css --paper */
const INK = '#16161b';     /* eigengrau, the wordmark's own black */
const ACCENT = '#c93123';  /* identity.css --accent */

/* ---- 2. where it sits on the tile -------------------------------------- */
/* One number decides the whole drawing: how much of the tile's height the mark
   takes. It was picked by rendering 0.72 through 0.90 and looking at 16px, which
   is the size with an opinion — below about 0.78 the stem lands across three
   pixel columns and greys out and the dot goes pink; above about 0.82 the dot
   crowds the right edge and the 32 and 180 tiles feel airless. 0.80 is where the
   stem is two solid black columns at 16px and there is still paper around the
   mark at 512.
   The tile's own ground does the separating, so this padding is composition
   rather than clearance. The box is centred on the real ink, dot included, so
   the dot counts as part of the mark's width rather than hanging off a centred
   letter. */
const TILE = 64;
const FILL = 0.80;

const unit = (TILE * FILL) / MARK.h;
const originX = (TILE - MARK.w * unit) / 2;
const originY = (TILE - MARK.h * unit) / 2;
const r3 = (n) => +n.toFixed(3);

/* ---- 3. the master ----------------------------------------------------- */
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}" width="${TILE}" height="${TILE}">`,
  `  <title>khevin mituti</title>`,
  `  <rect width="${TILE}" height="${TILE}" fill="${PAPER}"/>`,
  `  <g transform="translate(${r3(originX)} ${r3(originY)}) scale(${r3(unit)})">`,
  `    <path fill="${INK}" d="${LETTER}"/>`,
  `    <path fill="${ACCENT}" d="${DOT}"/>`,
  `  </g>`,
  `</svg>`,
  '',
].join('\n');

/* ---- 4. path -> polygons ----------------------------------------------- */
/* Absolute commands only, which is all the mark uses. Anything else throws
   rather than being silently skipped: a path that drew most of itself would be
   far harder to notice than one that refused to build. */
const TOKEN = /([A-Za-z])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;

function polygons(d, k, tx, ty) {
  const px = (x) => x * k + tx;
  const py = (y) => y * k + ty;
  const toks = [];
  for (const m of d.matchAll(TOKEN)) toks.push(m[1] ?? Number(m[2]));

  const out = [];
  let cur = null, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
  const push = (x, y) => { cur.push([px(x), py(y)]); cx = x; cy = y; };

  for (let i = 0; i < toks.length;) {
    const at = i;
    if (typeof toks[i] === 'string') cmd = toks[i++].toUpperCase();
    else if (cmd === 'M') cmd = 'L';          /* extra pairs after M are lines */
    switch (cmd) {
      case 'M':
        cur = []; out.push(cur);
        sx = toks[i++]; sy = toks[i++];
        push(sx, sy);
        break;
      case 'L': push(toks[i++], toks[i++]); break;
      case 'H': push(toks[i++], cy); break;
      case 'V': push(cx, toks[i++]); break;
      case 'C': {
        const [x1, y1, x2, y2, x, y] = toks.slice(i, i + 6); i += 6;
        /* Steps come from the control polygon's length on screen, so a long sweep
           at 512px gets the subdivisions it needs and a 3px flick does not. */
        const len = Math.hypot(x1 - cx, y1 - cy) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2);
        const n = Math.max(3, Math.min(96, Math.ceil((len * k) / 0.35)));
        const ax = cx, ay = cy;
        for (let s = 1; s <= n; s++) {
          const t = s / n, u = 1 - t;
          cur.push([
            px(u * u * u * ax + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x),
            py(u * u * u * ay + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y),
          ]);
        }
        cx = x; cy = y;
        break;
      }
      case 'Z': cx = sx; cy = sy; break;
      default: throw new Error(`unsupported path command "${cmd}"`);
    }
    /* Every branch above has to eat at least one token. A branch that does not —
       coordinates trailing a Z, say — would spin here forever rather than fail. */
    if (i === at) throw new Error(`path stalled after "${cmd}"`);
  }
  return out.filter((p) => p.length > 2);
}

/* ---- 5. scanline fill --------------------------------------------------- */
/* Coverage is exact across x — a span contributes the fraction of each pixel it
   actually covers — and sampled 8 deep down y. Nonzero winding, which is what
   the counters in the k and the bowl of the dot need. */
const DEPTH = 8;

function coverage(subpaths, size) {
  const edges = [];
  for (const pts of subpaths) {
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if (y0 !== y1) edges.push([x0, y0, x1, y1, y1 > y0 ? 1 : -1]);
    }
  }
  const out = new Uint8Array(size * size);
  const acc = new Float64Array(size);
  let hits = [];

  for (let row = 0; row < size; row++) {
    acc.fill(0);
    for (let s = 0; s < DEPTH; s++) {
      const y = row + (s + 0.5) / DEPTH;
      hits.length = 0;
      for (const [x0, y0, x1, y1, dir] of edges) {
        if (y < Math.min(y0, y1) || y >= Math.max(y0, y1)) continue;
        hits.push([x0 + ((y - y0) * (x1 - x0)) / (y1 - y0), dir]);
      }
      if (!hits.length) continue;
      hits.sort((a, b) => a[0] - b[0]);
      let wind = 0, from = 0;
      for (const [x, dir] of hits) {
        if (wind === 0) from = x;
        wind += dir;
        if (wind !== 0) continue;
        const a = Math.max(from, 0), b = Math.min(x, size);
        for (let p = Math.floor(a); p < b; p++) acc[p] += Math.min(b, p + 1) - Math.max(a, p);
      }
    }
    for (let x = 0; x < size; x++) {
      const a = acc[x] / DEPTH;
      out[row * size + x] = a <= 0 ? 0 : a >= 1 ? 255 : Math.round(a * 255);
    }
  }
  return out;
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function tile(size) {
  const k = unit * (size / TILE);
  const tx = originX * (size / TILE);
  const ty = originY * (size / TILE);
  const px = Buffer.alloc(size * size * 3);
  const paper = rgb(PAPER);
  for (let i = 0; i < size * size; i++) px.set(paper, i * 3);

  for (const [d, hex] of [[LETTER, INK], [DOT, ACCENT]]) {
    const cov = coverage(polygons(d, k, tx, ty), size);
    const [r, g, b] = rgb(hex);
    for (let i = 0; i < cov.length; i++) {
      const a = cov[i] / 255;
      if (!a) continue;
      const o = i * 3;
      px[o] = Math.round(px[o] * (1 - a) + r * a);
      px[o + 1] = Math.round(px[o + 1] * (1 - a) + g * a);
      px[o + 2] = Math.round(px[o + 2] * (1 - a) + b * a);
    }
  }
  return px;
}

/* ---- 6. PNG ------------------------------------------------------------- */
const TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (tag, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(tag, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
};

function png(px, size) {
  const stride = size * 3;
  const filtered = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    filtered[y * (stride + 1)] = 0;                       /* filter: none */
    px.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;  /* 8-bit RGB */
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(filtered, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---- 7. ICO ------------------------------------------------------------- */
/* Uncompressed DIBs rather than PNGs-in-ICO. Every browser reads either, but the
   Windows shell only learned PNG entries in Vista, and at these sizes the whole
   file still comes out smaller than the one it replaces. */
function ico(tiles) {
  const dir = Buffer.alloc(6 + tiles.length * 16);
  dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(tiles.length, 4);

  const bodies = [];
  let offset = dir.length;
  tiles.forEach(([size, px], n) => {
    const maskStride = Math.ceil(size / 32) * 4;
    const head = Buffer.alloc(40);
    head.writeUInt32LE(40, 0);
    head.writeInt32LE(size, 4);
    head.writeInt32LE(size * 2, 8);          /* colour rows + mask rows */
    head.writeUInt16LE(1, 12);
    head.writeUInt16LE(32, 14);
    head.writeUInt32LE(size * size * 4 + size * maskStride, 20);

    const bgra = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
      const src = (size - 1 - y) * size * 3;               /* DIBs run bottom-up */
      for (let x = 0; x < size; x++) {
        const o = (y * size + x) * 4, s = src + x * 3;
        bgra[o] = px[s + 2]; bgra[o + 1] = px[s + 1]; bgra[o + 2] = px[s]; bgra[o + 3] = 255;
      }
    }
    const body = Buffer.concat([head, bgra, Buffer.alloc(size * maskStride)]);  /* mask: all opaque */
    bodies.push(body);

    const e = 6 + n * 16;
    dir[e] = size % 256; dir[e + 1] = size % 256;
    dir.writeUInt16LE(1, e + 4); dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(body.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += body.length;
  });
  return Buffer.concat([dir, ...bodies]);
}

/* ---- 8. write ----------------------------------------------------------- */
const DIR = new URL('./assets/favicon/', import.meta.url);
await mkdir(DIR, { recursive: true });
const put = (name, data) => writeFile(new URL(name, DIR), data);

await put('favicon.svg', svg);
console.log(`favicon.svg                ${TILE}x${TILE}  mark at ${(FILL * 100).toFixed(0)}% height`);

const drawn = new Map();
for (const size of [16, 32, 48, 180, 192, 512]) drawn.set(size, tile(size));

for (const [size, name] of [
  [16, 'favicon-16x16.png'],
  [32, 'favicon-32x32.png'],
  [180, 'apple-touch-icon.png'],
  [192, 'android-chrome-192x192.png'],
  [512, 'android-chrome-512x512.png'],
]) {
  const file = png(drawn.get(size), size);
  await put(name, file);
  console.log(`${name.padEnd(27)}${size}x${size}  ${(file.length / 1024).toFixed(1)} kB`);
}

const icon = ico([16, 32, 48].map((s) => [s, drawn.get(s)]));
await put('favicon.ico', icon);
console.log(`favicon.ico                16/32/48  ${(icon.length / 1024).toFixed(1)} kB`);
