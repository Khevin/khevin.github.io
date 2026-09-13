import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptTokens, assertReconstructs, normalizePos, POS_LABELS } from './tokenizer-adapter.js';

const k = (surface, pos, d1 = '*', extra = {}) => ({ surface_form: surface, pos, pos_detail_1: d1, pos_detail_2: '*', pos_detail_3: '*', basic_form: surface, conjugated_type: '*', conjugated_form: '*', word_type: 'KNOWN', reading: 'ヨミ', ...extra });

test('normalizePos maps IPADIC categories to the fixed label set', () => {
  assert.equal(normalizePos(k('東京', '名詞', '固有名詞')), 'name');
  assert.equal(normalizePos(k('六', '名詞', '数')), 'number');
  assert.equal(normalizePos(k('私', '名詞', '代名詞')), 'pronoun');
  assert.equal(normalizePos(k('静か', '名詞', '形容動詞語幹')), 'na-adjective');
  assert.equal(normalizePos(k('時', '名詞', '接尾')), 'suffix');
  assert.equal(normalizePos(k('本', '名詞', '一般')), 'noun');
  assert.equal(normalizePos(k('は', '助詞', '係助詞')), 'particle');
  assert.equal(normalizePos(k('この', '連体詞')), 'adnominal');
  assert.equal(normalizePos(k('。', '記号', '句点')), 'punctuation');
  assert.equal(normalizePos(k(' ', '記号', '空白')), 'whitespace');
  assert.equal(normalizePos(k('★', '記号', '一般')), 'symbol');
  assert.equal(normalizePos(k('？？', 'その他')), 'unknown');
  for (const t of [k('a', '名詞'), k('b', '動詞'), k('c', '形容詞'), k('d', '助動詞'), k('e', '副詞'), k('f', '接続詞'), k('g', '感動詞'), k('h', '接頭詞')]) {
    assert.ok(POS_LABELS.includes(normalizePos(t)));
  }
});

test('adaptTokens trusts word_position when it agrees with the text', () => {
  const text = '私は本を読む。';
  const raw = [
    k('私', '名詞', '代名詞', { word_position: 1 }),
    k('は', '助詞', '係助詞', { word_position: 2 }),
    k('本', '名詞', '一般', { word_position: 3 }),
    k('を', '助詞', '格助詞', { word_position: 4 }),
    k('読む', '動詞', '自立', { word_position: 5, basic_form: '読む', conjugated_type: '五段・マ行', conjugated_form: '基本形' }),
    k('。', '記号', '句点', { word_position: 7 }),
  ];
  const { tokens, gaps } = adaptTokens(text, raw);
  assert.equal(gaps.length, 0);
  assert.deepEqual(tokens.map(t => [t.startUtf16, t.endUtf16]), [[0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [6, 7]]);
  assert.equal(tokens[4].conjugatedForm, '基本形');
  assert.equal(tokens[4].lemma, '読む');
  assert.deepEqual(tokens[0].reading, { value: 'ヨミ', provenance: 'tokenizer' });
  assert.equal(tokens.every(t => t.positionSource === 'word_position'), true);
  for (const t of tokens) assert.equal(text.slice(t.startUtf16, t.endUtf16), t.surface);
});

test('adaptTokens records whitespace gaps and falls back to indexOf when word_position is wrong', () => {
  const text = 'Nintendo Switch 2 本体';
  const raw = [
    k('Nintendo', '名詞', '固有名詞', { word_position: 1, word_type: 'UNKNOWN', reading: undefined }),
    k('Switch', '名詞', '固有名詞', { word_position: 99, word_type: 'UNKNOWN' }),  // wrong position
    k('2', '名詞', '数', { word_position: 17, word_type: 'UNKNOWN' }),
    k('本体', '名詞', '一般', { word_position: 19 }),
  ];
  const { tokens, gaps } = adaptTokens(text, raw);
  assert.deepEqual(gaps.map(g => [g.startUtf16, g.endUtf16]), [[8, 9], [15, 16], [17, 18]]);
  assert.equal(tokens[1].startUtf16, 9);
  assert.equal(tokens[1].positionSource, 'indexOf');
  assert.equal(tokens[0].reading, null);
  assert.equal(tokens[0].lexical, 'unknown');
  assertReconstructs(text, tokens, gaps);
});

test('adaptTokens handles supplementary characters as two UTF-16 units', () => {
  const text = '𠮷野家';
  const raw = [k('𠮷', '記号', '一般', { word_position: 1, word_type: 'UNKNOWN' }), k('野家', '名詞', '固有名詞', { word_position: 3 })];
  const { tokens } = adaptTokens(text, raw);
  assert.deepEqual(tokens.map(t => [t.startUtf16, t.endUtf16]), [[0, 2], [2, 4]]);
});

test('adaptTokens throws on non-whitespace gaps, missing surfaces, and unconsumed tails', () => {
  assert.throws(() => adaptTokens('私は本', [k('私', '名詞', '代名詞', { word_position: 1 }), k('本', '名詞', '一般', { word_position: 3 })]), /non-whitespace gap "は"/);
  assert.throws(() => adaptTokens('私は', [k('私', '名詞', '代名詞', { word_position: 1 })]), /unconsumed non-whitespace tail "は"/);
  assert.throws(() => adaptTokens('私', [{ pos: '名詞' }]), /no surface_form/);
  assert.throws(() => adaptTokens('私は', [k('僕', '名詞', '代名詞', { word_position: 1 })]), /not found/);
});

test('assertReconstructs rejects overlaps and mismatched slices', () => {
  const text = 'ab';
  assert.throws(() => assertReconstructs(text, [{ startUtf16: 0, endUtf16: 2, surface: 'ab' }, { startUtf16: 1, endUtf16: 2, surface: 'b' }], []), /gap\/overlap/);
  assert.throws(() => assertReconstructs(text, [{ startUtf16: 0, endUtf16: 2, surface: 'ba' }], []), /slice mismatch/);
  assert.equal(assertReconstructs(text, [{ startUtf16: 0, endUtf16: 1, surface: 'a' }], [{ startUtf16: 1, endUtf16: 2, text: 'b' }]), true);
});
