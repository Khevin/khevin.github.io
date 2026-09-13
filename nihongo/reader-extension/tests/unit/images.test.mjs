import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePixels } from '../../src/panel/image-filter.js';
import { parseGoogle, parseWikimedia, parsePixabay, googleImagesUrl, providerFor, GALLERY_MAX } from '../../src/panel/images.js';

// synthetic 40×40 RGBA images
const W = 40, H = 40;
function make(fill) { const d = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = fill(x, y); const i = (y * W + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } return d; }

test('a white card with black text lines is text-like', () => {
  const textCard = make((x, y) => ((y % 6 < 2) && x > 4 && x < 36 && (x % 3 !== 0)) ? [20, 20, 20] : [255, 255, 255]);
  const r = analyzePixels(textCard, W, H);
  assert.equal(r.textLike, true, JSON.stringify(r));
  assert.ok(r.dominant > 0.6 && r.colors <= 5 && r.saturation < 0.05);
});

test('a colourful gradient illustration is not text-like', () => {
  const gradient = make((x, y) => [Math.round(255 * x / W), Math.round(255 * y / H), Math.round(255 * (1 - x / W))]);
  const r = analyzePixels(gradient, W, H);
  assert.equal(r.textLike, false, JSON.stringify(r));
  assert.ok(r.colors > 60 && r.dominant < 0.1);
});

test('a photo-like noisy image with many colours is kept even on a light background', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const photo = make((x, y) => (y > 24 ? [40 + rnd() * 80, 90 + rnd() * 100, 30 + rnd() * 60] : [180 + rnd() * 60, 200 + rnd() * 50, 230 + rnd() * 25]));
  const r = analyzePixels(photo, W, H);
  assert.equal(r.textLike, false, JSON.stringify(r));
});

test('a transparent background counts as white (icon on transparency with a little colour is judged like a card)', () => {
  const d = new Uint8ClampedArray(W * H * 4); // all transparent
  for (let i = 0; i < W * H; i++) { d[i * 4 + 3] = 0; }
  const r = analyzePixels(d, W, H);
  assert.equal(r.dominant, 1);
  assert.equal(r.textLike, true);
});

test('parsers map provider payloads to gallery items and paging', () => {
  const g = parseGoogle({ items: [{ link: 'https://x/a.jpg', title: 'A', image: { thumbnailLink: 'https://t/a', contextLink: 'https://p/a', width: 800, height: 600, thumbnailWidth: 150, thumbnailHeight: 112 } }, { link: 'https://x/b', image: {} }], queries: { nextPage: [{ startIndex: 11 }] } });
  assert.equal(g.items.length, 1); assert.equal(g.items[0].page, 'https://p/a'); assert.equal(g.nextStart, 11);
  const w = parseWikimedia({ query: { pages: { 2: { index: 2, title: 'File:B.png', imageinfo: [{ thumburl: 'https://c/b', url: 'https://c/B.png', mime: 'image/png', descriptionurl: 'https://c/page/B' }] }, 1: { index: 1, title: 'File:A.svg', imageinfo: [{ thumburl: 'https://c/a', url: 'https://c/A.svg', mime: 'image/svg+xml' }] } } }, continue: { gsroffset: 10 } });
  assert.deepEqual(w.items.map(i => i.title), ['B.png'], 'svg skipped, ordered by index');
  assert.equal(w.nextStart, 11);
  assert.equal(new URL(googleImagesUrl('広がる')).searchParams.get('tbm'), 'isch');
  assert.equal(providerFor({}), 'wikimedia'); assert.equal(providerFor({ imagesKey: 'k', imagesCx: 'c' }), 'google');
  assert.equal(providerFor({ pixabayKey: 'p', imagesKey: 'k', imagesCx: 'c' }), 'pixabay', 'Pixabay wins when its key is present');
  const px = parsePixabay({ total: 500, totalHits: 25, hits: [{ id: 1, pageURL: 'https://pixabay.com/photos/forest-1/', tags: 'forest, trees', previewURL: 'https://cdn.pixabay.com/photo/1_150.jpg', webformatURL: 'https://cdn.pixabay.com/photo/1_640.jpg', largeImageURL: 'https://pixabay.com/get/1_1280.jpg', previewWidth: 150, previewHeight: 100, imageWidth: 4000, imageHeight: 2667 }, { id: 2, previewURL: 'https://cdn.pixabay.com/photo/2_150.jpg', pageURL: 'https://pixabay.com/photos/2/' }] }, 1);
  assert.equal(px.items.length, 2); assert.equal(px.items[0].thumb, 'https://cdn.pixabay.com/photo/1_150.jpg'); assert.equal(px.items[0].page, 'https://pixabay.com/photos/forest-1/'); assert.equal(px.items[0].title, 'forest, trees');
  assert.equal(px.nextStart, 3, 'more hits remain → next start after the two seen');
  assert.equal(parsePixabay({ totalHits: 2, hits: [{ previewURL: 'a', pageURL: 'p' }, { previewURL: 'b', pageURL: 'q' }] }, 1).nextStart, null, 'all hits seen → no more');
  assert.equal(GALLERY_MAX, 15);
});
