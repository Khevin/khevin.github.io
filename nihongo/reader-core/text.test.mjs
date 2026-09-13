import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NORMALIZATION_VERSION, fingerprint, toDisplayText, sentenceKey, segmentSentences,
  isKanji, iterateKanji, distinctKanji, kanjiKeyOf, rubyReadingFor, toDisplayTextWithMap, remapSpans,
} from './text.js';

test('toDisplayTextWithMap carries ruby spans across dropped layout breaks and collapsed spaces', () => {
  const captured = '底知れぬ野望を抱き、\nトライフォースを手に入れようと目論む。';
  const rubyStart = captured.indexOf('目論');
  const { text, map } = toDisplayTextWithMap(captured);
  assert.equal(text, toDisplayText(captured));
  const [r] = remapSpans([{ start: rubyStart, end: rubyStart + 2, reading: 'もくろ' }], map);
  assert.equal(text.slice(r.start, r.end), '目論');
  assert.equal(r.reading, 'もくろ');
  // whitespace collapse + trim
  const m2 = toDisplayTextWithMap('  Nintendo   Switch 2　本体 ');
  assert.equal(m2.text, 'Nintendo Switch 2 本体');
  const sw = '  Nintendo   Switch 2　本体 '.indexOf('Switch');
  assert.deepEqual(remapSpans([{ start: sw, end: sw + 6 }], m2.map).map(x => m2.text.slice(x.start, x.end)), ['Switch']);
  // a span made only of dropped characters disappears; null map drops everything
  assert.deepEqual(remapSpans([{ start: 10, end: 11 }], map), []);
  assert.deepEqual(remapSpans([{ start: 0, end: 2 }], null), []);
});

test('fingerprint drops layout breaks, collapses whitespace, NFC, keeps punctuation', () => {
  assert.equal(fingerprint('はるか昔に\n三大神が、のこした。'), 'はるか昔に三大神が、のこした。');
  assert.equal(fingerprint('  Nintendo   Switch 2　本体 '), 'Nintendo Switch 2 本体');
  // NFC: decomposed が (か + combining dakuten) folds to composed が
  assert.equal(fingerprint('が'), 'が');
  // never NFKC: full-width digits and ㍻ stay
  assert.equal(fingerprint('３つ㍻'), '３つ㍻');
});

test('toDisplayText mirrors fingerprint in v1 (identical analysis/display text)', () => {
  assert.equal(toDisplayText('コキリの森で\n暮らす少年。'), 'コキリの森で暮らす少年。');
});

test('sentenceKey is stable, version-tagged, and independent of layout', async () => {
  const a = await sentenceKey('コキリの森で暮らす少年。');
  const b = await sentenceKey('コキリの森で\n暮らす少年。 ');
  const c = await sentenceKey('コキリの森で暮らす少女。');
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(NORMALIZATION_VERSION, 1);
});

test('segmentSentences keeps terminal punctuation and closers with their sentence', () => {
  const s = segmentSentences('コキリの森で暮らす少年。ある日、「デクの樹サマ」から告げられる。');
  assert.deepEqual(s.map(x => x.text), ['コキリの森で暮らす少年。', 'ある日、「デクの樹サマ」から告げられる。']);
  assert.deepEqual(s.map(x => x.fragment), [false, false]);
  assert.equal(s[1].start, 12);
  const q = segmentSentences('「行く？」と言った。');
  assert.deepEqual(q.map(x => x.text), ['「行く？」', 'と言った。']);
});

test('segmentSentences never splits on layout breaks and labels a tail without punctuation as fragment', () => {
  const s = segmentSentences('はるか昔に\n三大神がのこした力で、触れた者の願いをかなえるとされる。運命に導くトライフォース');
  assert.equal(s.length, 2);
  assert.equal(s[0].fragment, false);
  assert.equal(s[1].text, '運命に導くトライフォース');
  assert.equal(s[1].fragment, true);
  // dash + 。 stays together
  assert.deepEqual(segmentSentences('巻き込んでいく――。').map(x => x.text), ['巻き込んでいく――。']);
});

test('isKanji uses Unified_Ideograph, not a BMP range', () => {
  assert.equal(isKanji('水'), true);
  assert.equal(isKanji('𠮷'), true);
  assert.equal(isKanji('々'), false);
  assert.equal(isKanji('カ'), false);
  assert.equal(isKanji('a'), false);
});

test('iterateKanji reports UTF-16 offsets, supplementary length 2, and keeps text slices exact', () => {
  const text = '𠮷野家で牛丼を食べた。';
  const ks = iterateKanji(text);
  assert.deepEqual(ks.map(k => k.glyph), ['𠮷', '野', '家', '牛', '丼', '食']);
  assert.deepEqual(ks.map(k => [k.index, k.length]), [[0, 2], [2, 1], [3, 1], [5, 1], [6, 1], [8, 1]]);
  for (const k of ks) assert.equal(text.slice(k.index, k.index + k.length), k.glyph);
});

test('iterateKanji keeps variation selectors in glyph and strips them from the key', () => {
  const text = '葛\u{e0100}城さん';
  const ks = iterateKanji(text);
  assert.equal(ks.length, 2);
  assert.equal(ks[0].glyph, '葛\u{e0100}');
  assert.equal(ks[0].kanjiKey, '葛');
  assert.equal(ks[0].length, 3);
  assert.equal(ks[1].index, 3);
  assert.equal(kanjiKeyOf('葛\u{e0100}'), '葛');
  assert.equal(kanjiKeyOf('葛︀'), '葛');
});

test('々 is a repetition mark keyed to the preceding kanji, never its own record', () => {
  const ks = iterateKanji('人々が次々と、々');
  const rep = ks.filter(k => k.repetition);
  assert.deepEqual(rep.map(k => k.kanjiKey), ['人', '次', null]);
  assert.deepEqual(distinctKanji('人々が次々と集まった'), ['人', '次', '集']);
});

test('rubyReadingFor distinguishes exact cover from containment', () => {
  const ruby = [{ start: 15, end: 17, reading: 'もくろ' }];
  assert.deepEqual(rubyReadingFor(ruby, 15, 17), { reading: 'もくろ', exact: true });
  assert.deepEqual(rubyReadingFor(ruby, 15, 16), { reading: 'もくろ', exact: false });
  assert.equal(rubyReadingFor(ruby, 14, 17), null);
  assert.equal(rubyReadingFor(undefined, 0, 1), null);
});
