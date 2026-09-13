/*
 * panel/image-filter.js — "is this thumbnail just text?" without OCR.
 * Text slides, quote cards and posters share a pixel signature: one dominant
 * flat background, very few distinct colours, low saturation. Photos and
 * illustrations do not. The score is a cheap heuristic on a 40×40 downsample,
 * fast enough to run on every thumbnail as it arrives; the UI keeps hidden
 * items one tap away so a wrong call costs nothing.
 *
 * analyzePixels() is pure (unit-tested in Node); classifyThumbnail() adds the
 * browser decode step (createImageBitmap + OffscreenCanvas).
 */

export const SIZE = 40;

/**
 * @param {Uint8ClampedArray|Uint8Array} data RGBA pixels
 * @param {number} width
 * @param {number} height
 * @returns {{textLike:boolean, dominant:number, colors:number, saturation:number, edges:number}}
 */
export function analyzePixels(data, width, height) {
  const n = width * height;
  const counts = new Map();
  let satSum = 0;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    // treat transparent as white background
    const rr = a < 128 ? 255 : r, gg = a < 128 ? 255 : g, bb = a < 128 ? 255 : b;
    const key = ((rr >> 4) << 8) | ((gg >> 4) << 4) | (bb >> 4);   // 4 bits per channel → 4096 bins
    counts.set(key, (counts.get(key) || 0) + 1);
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    satSum += max ? (max - min) / max : 0;
    lum[i] = 0.299 * rr + 0.587 * gg + 0.114 * bb;
  }
  let top = 0;
  for (const c of counts.values()) if (c > top) top = c;
  const dominant = top / n;
  const colors = [...counts.values()].filter(c => c >= n * 0.002).length;   // ignore antialiasing dust
  const saturation = satSum / n;
  // sharp edges per pixel (text has many, gradients/photos fewer relative to colour count)
  let edges = 0;
  for (let y = 0; y < height; y++) for (let x = 1; x < width; x++) if (Math.abs(lum[y * width + x] - lum[y * width + x - 1]) > 60) edges++;
  edges /= n;
  const textLike = (dominant >= 0.5 && colors <= 40 && saturation < 0.28) || (dominant >= 0.7 && colors <= 60 && edges > 0.04);
  return { textLike, dominant: +dominant.toFixed(3), colors, saturation: +saturation.toFixed(3), edges: +edges.toFixed(3) };
}

/**
 * Decode thumbnail bytes and classify. Returns null when decoding is impossible
 * (no OffscreenCanvas, unsupported format) so the caller keeps the image visible.
 * @param {Uint8Array|Blob} bytesOrBlob
 * @param {string} [mime]
 */
export async function classifyThumbnail(bytesOrBlob, mime = 'image/jpeg') {
  try {
    if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined') return null;
    const blob = bytesOrBlob instanceof Blob ? bytesOrBlob : new Blob([bytesOrBlob], { type: mime });
    const bmp = await createImageBitmap(blob, { resizeWidth: SIZE, resizeHeight: SIZE, resizeQuality: 'low' });
    const canvas = new OffscreenCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, SIZE, SIZE);
    bmp.close && bmp.close();
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    return analyzePixels(img.data, SIZE, SIZE);
  } catch { return null; }
}
