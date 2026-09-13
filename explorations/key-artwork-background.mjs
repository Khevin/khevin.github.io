/* Keys the flat background out of a flattened illustration.
 *
 * assets/hats-signal.png was generated onto a solid #FCFDFF rather than onto
 * transparency, which was invisible only for as long as the page was that exact
 * colour. Move the paper and a lighter rectangle appears around the artwork.
 *
 * This replaces the background with real alpha, so the art sits on whatever the
 * page happens to be. Anti-aliased edge pixels are deliberately left alone: at
 * a tolerance this tight the survivors are within about 3/255 of any near-white
 * paper, which is far below a visible fringe, and keying them too would chew
 * into the artwork's own outlines.
 *
 *   node explorations/key-artwork-background.mjs <png> [tolerance]
 */
import { readFile, writeFile } from 'node:fs/promises';
import zlib from 'node:zlib';

const [file, tolArg] = process.argv.slice(2);
if (!file) throw new Error('usage: key-artwork-background.mjs <png> [tolerance]');
const TOL = Number(tolArg ?? 10);

/* ---- read ---- */
const src = await readFile(file);
if (src.toString('latin1', 1, 4) !== 'PNG') throw new Error('not a PNG');
const width = src.readUInt32BE(16), height = src.readUInt32BE(20);
const depth = src[24], colour = src[25];
if (depth !== 8 || (colour !== 2 && colour !== 6)) {
  throw new Error(`only 8-bit RGB/RGBA handled here (depth ${depth}, colour type ${colour})`);
}
const inCh = colour === 6 ? 4 : 3;

let idat = [];
for (let off = 8; off < src.length;) {
  const len = src.readUInt32BE(off);
  const tag = src.toString('ascii', off + 4, off + 8);
  if (tag === 'IDAT') idat.push(src.subarray(off + 8, off + 8 + len));
  if (tag === 'IEND') break;
  off += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));

/* ---- un-filter ---- */
const stride = width * inCh;
const flat = Buffer.alloc(height * stride);
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
for (let y = 0, pos = 0; y < height; y++) {
  const ft = raw[pos++];
  const line = flat.subarray(y * stride, (y + 1) * stride);
  const prev = y ? flat.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
  for (let x = 0; x < stride; x++) {
    const cur = raw[pos + x];
    const a = x >= inCh ? line[x - inCh] : 0;
    const b = prev[x];
    const c = x >= inCh ? prev[x - inCh] : 0;
    line[x] = (cur + (ft === 1 ? a : ft === 2 ? b : ft === 3 ? ((a + b) >> 1) : ft === 4 ? paeth(a, b, c) : 0)) & 0xff;
  }
  pos += stride;
}

/* ---- key ---- */
const bg = [flat[0], flat[1], flat[2]];
const out = Buffer.alloc(width * height * 4);
let keyed = 0;
for (let i = 0, o = 0; i < width * height; i++) {
  const p = i * inCh;
  const r = flat[p], g = flat[p + 1], b = flat[p + 2];
  const near = Math.abs(r - bg[0]) <= TOL && Math.abs(g - bg[1]) <= TOL && Math.abs(b - bg[2]) <= TOL;
  out[o++] = r; out[o++] = g; out[o++] = b;
  out[o++] = near ? 0 : (inCh === 4 ? flat[p + 3] : 255);
  if (near) keyed++;
}

/* ---- write ---- */
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

const filtered = Buffer.alloc(height * (width * 4 + 1));
for (let y = 0; y < height; y++) {
  filtered[y * (width * 4 + 1)] = 0;                    // filter: none
  out.copy(filtered, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

await writeFile(file, Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(filtered, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]));

const pct = (keyed / (width * height) * 100).toFixed(1);
const hex = '#' + bg.map((v) => v.toString(16).padStart(2, '0')).join('');
console.log(`${file}  ${width}x${height}`);
console.log(`  background ${hex}, tolerance ${TOL}`);
console.log(`  ${keyed.toLocaleString()} px keyed transparent (${pct}%)`);
