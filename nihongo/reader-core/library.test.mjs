import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCardIndex, availabilityFor, cardsFor, wordCards, preflightPackage, sha256Bytes } from './library.js';

const card = (cardKey, glyph, order, extra = {}) => ({ cardKey, classId: cardKey.split('/')[0], cardIdOrGlyph: cardKey.split('/')[1], order, kind: glyph && [...glyph].length > 1 ? 'word' : 'kanji', glyph, readings: { kun: null, on: null }, keyword: 'k', ...extra });
const cards = [
  card('basic/water', '水', 0), card('basic/sun', '日', 1), card('time/sunday', '日曜日', 2), card('sky/sun', '寸', 3),
  card('colors/tea', '茶', 4), card('food/tea', '茶', 5), card('onomatopoeia/niko', 'にこにこ', 6), { ...card('people/r-person', '人', 7), kind: 'radical' },
];
const index = buildCardIndex('lib-1', cards);

test('index separates standalone kanji, words, and component matches; radicals are not standalone kanji cards', () => {
  assert.equal(availabilityFor(index, '水'), 'standalone');
  assert.equal(availabilityFor(index, '曜'), 'compound-only');
  assert.equal(availabilityFor(index, '森'), 'none');
  assert.equal(availabilityFor(index, '人'), 'compound-only' === availabilityFor(index, '人') ? 'compound-only' : 'none');
  assert.deepEqual(wordCards(index, '日曜日').map(c => c.cardKey), ['time/sunday']);
  assert.deepEqual(wordCards(index, 'にこにこ').map(c => c.cardKey), ['onomatopoeia/niko']);
  assert.equal(availabilityFor(null, '水'), 'none');
});

test('cardsFor keeps authored order, honours a saved preference, and never collapses duplicates', () => {
  const tea = cardsFor(index, '茶');
  assert.deepEqual(tea.standalone.map(c => c.cardKey), ['colors/tea', 'food/tea']);
  assert.equal(tea.preferred.cardKey, 'colors/tea');
  assert.equal(cardsFor(index, '茶', { libraryId: 'lib-1', cardKey: 'food/tea' }).preferred.cardKey, 'food/tea');
  assert.equal(cardsFor(index, '茶', { libraryId: 'other', cardKey: 'food/tea' }).preferred.cardKey, 'colors/tea');
  const sun = cardsFor(index, '日');
  assert.deepEqual(sun.standalone.map(c => c.cardKey), ['basic/sun']);
  assert.deepEqual(sun.compounds.map(c => c.cardKey), ['time/sunday']);
});

async function makePackage(overrides = {}) {
  const enc = (o) => new TextEncoder().encode(JSON.stringify(o));
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
  const hash = await sha256Bytes(png);
  const asset = { assetHash: hash, mime: 'image/png', bytes: png.byteLength, width: 10, height: 10, path: `assets/${hash}.png`, sourceKind: 'shipped', slotId: 'flash-water', imageKey: 'kanji/水', variant: 1, framing: { fit: 'contain', s: 1, x: 0, y: 0 } };
  const manifest = { schemaVersion: 1, libraryId: 'lib-1', snapshotId: 'snap-1', revision: 1, exportedAt: '2026-09-08T00:00:00Z', sourceAppUrl: 'https://khevin.com/nihongo/app.html', exporterVersion: '0.1.0', deckIds: ['basic'], files: { cards: 'cards.json', lessons: 'lessons.json' }, assets: [asset], counts: { cards: 1, images: 1, missingImages: 0 }, ...overrides.manifest };
  const cardsJson = overrides.cards || [{ ...card('basic/water', '水', 0), image: { assetHash: hash, variant: 1 } }];
  const files = new Map([['manifest.json', enc(manifest)], ['cards.json', enc(cardsJson)], [asset.path, overrides.assetBytes || png]]);
  for (const [k, v] of Object.entries(overrides.extraFiles || {})) files.set(k, v);
  return { files, hash };
}

test('preflight accepts a well-formed package and verifies hashes', async () => {
  const { files } = await makePackage();
  const r = await preflightPackage(files);
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.equal(r.cards.length, 1);
  assert.equal(r.assets.length, 1);
});

test('preflight rejects traversal paths, executables, hash mismatch, unknown asset refs, and future schema', async () => {
  const bad1 = await makePackage({ extraFiles: { '../evil.txt': new Uint8Array(1), 'assets/x.js': new Uint8Array(1) } });
  const r1 = await preflightPackage(bad1.files);
  assert.ok(r1.errors.some(e => e.startsWith('rejected path: ../evil.txt')));
  assert.ok(r1.errors.some(e => e.startsWith('rejected path: assets/x.js')));

  const bad2 = await makePackage({ assetBytes: new Uint8Array([1, 2, 3]) });
  const r2 = await preflightPackage(bad2.files);
  assert.ok(r2.errors.some(e => /hash mismatch|size mismatch/.test(e)));
  assert.equal(r2.ok, false);

  const bad3 = await makePackage({ cards: [{ ...card('basic/water', '水', 0), image: { assetHash: 'b'.repeat(64), variant: 1 } }] });
  const r3 = await preflightPackage(bad3.files);
  assert.ok(r3.errors.some(e => /unknown asset/.test(e)));

  const bad4 = await makePackage({ manifest: { schemaVersion: 9 } });
  const r4 = await preflightPackage(bad4.files);
  assert.ok(r4.errors.some(e => /schemaVersion/.test(e)));
});
