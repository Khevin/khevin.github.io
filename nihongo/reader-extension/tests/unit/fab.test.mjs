import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isJapaneseSelection, placeFab, actionIdFor } from '../../src/fab.js';

test('isJapaneseSelection needs at least two kana/kanji and ignores Latin-only or single-character selections', () => {
  assert.equal(isJapaneseSelection('コキリの森で暮らす少年。'), true);
  assert.equal(isJapaneseSelection('森'), false);
  assert.equal(isJapaneseSelection('Nintendo Switch 2'), false);
  assert.equal(isJapaneseSelection('Nintendo 本体'), true);
  assert.equal(isJapaneseSelection('𠮷野家'), true);
  assert.equal(isJapaneseSelection(''), false);
  assert.equal(isJapaneseSelection(null), false);
});

const vp = { width: 1000, height: 800 };

test('placeFab sits above the selection, at its start when the selection is in the left half', () => {
  const p = placeFab({ left: 100, top: 300, right: 400, bottom: 320 }, vp);
  assert.deepEqual(p, { x: 100, y: 256, side: 'left', placement: 'above' });
});

test('placeFab uses the end of the rect in the right half of the screen', () => {
  const p = placeFab({ left: 600, top: 300, right: 900, bottom: 320 }, vp);
  assert.deepEqual(p, { x: 864, y: 256, side: 'right', placement: 'above' });
});

test('placeFab falls below the selection when there is no room above, and clamps to the viewport', () => {
  const p = placeFab({ left: 990, top: 10, right: 1010, bottom: 30 }, vp);
  assert.equal(p.placement, 'below');
  assert.equal(p.y, 38);
  assert.equal(p.x, 1000 - 36 - 8);
  const q = placeFab({ left: -50, top: 820, right: 20, bottom: 840 }, vp);
  assert.equal(q.x, 8);
  assert.equal(q.placement, 'above');
  assert.equal(q.y, 800 - 36 - 8);
});

test('actionIdFor is stable per capture and sentence index', () => {
  assert.equal(actionIdFor('cap-1', 0), 'cap-1:0');
  assert.notEqual(actionIdFor('cap-1', 0), actionIdFor('cap-1', 1));
});
