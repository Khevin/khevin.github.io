import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kanaToRomaji, tokenRomaji, toKatakana } from './romaji.js';

test('basic syllables, combos, long vowels, doubled consonants, n before vowels', () => {
  assert.equal(kanaToRomaji('ワタシ'), 'watashi');
  assert.equal(kanaToRomaji('ミテイル'), 'miteiru');
  assert.equal(kanaToRomaji('ショウネン'), 'shounen');
  assert.equal(kanaToRomaji('トライフォース'), 'toraifoosu');
  assert.equal(kanaToRomaji('ガッコウ'), 'gakkou');
  assert.equal(kanaToRomaji('マッチャ'), 'matcha');
  assert.equal(kanaToRomaji('シンヤ'), "shin'ya");
  assert.equal(kanaToRomaji('コンニチハ'), 'konnichiha');
  assert.equal(kanaToRomaji('モクロム'), 'mokuromu');
});

test('hiragana input is accepted; unknown characters pass through', () => {
  assert.equal(toKatakana('もくろ'), 'モクロ');
  assert.equal(kanaToRomaji('もくろ'), 'mokuro');
  assert.equal(kanaToRomaji('A・B'), 'A・B');
});

test('tokenRomaji uses lesson spelling for particles and falls back to the surface', () => {
  assert.equal(tokenRomaji({ surface: 'は', pos: 'particle', reading: { value: 'ハ' } }), 'wa');
  assert.equal(tokenRomaji({ surface: 'を', pos: 'particle', reading: { value: 'ヲ' } }), 'wo');
  assert.equal(tokenRomaji({ surface: 'へ', pos: 'particle', reading: { value: 'エ' } }), 'e');
  assert.equal(tokenRomaji({ surface: 'が', pos: 'particle', reading: { value: 'ガ' } }), 'ga');
  assert.equal(tokenRomaji({ surface: '。', pos: 'punctuation', reading: null }), '。');
  assert.equal(tokenRomaji({ surface: 'コキリ', pos: 'noun', reading: null }), 'kokiri');
});
