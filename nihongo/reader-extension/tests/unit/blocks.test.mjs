import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBlockRowHTML, buildLegendHTML } from '../../src/panel/blocks.js';
import { analyze } from '../../../reader-core/grammar.js';

// 森には守り神がいた。 — には is one tag (に case + は topic), not two diamonds
const tok = (id, s, e, surface, pos, raw, extra = {}) => ({ tokenId: id, startUtf16: s, endUtf16: e, surface, lemma: surface, pos, rawPos: raw.split('/'), conjugatedType: null, conjugatedForm: null, reading: null, lexical: 'known', ...extra });
const text = '森には守り神がいた。';
const tokens = [
  tok('t0', 0, 1, '森', 'noun', '名詞/一般/*/*', { reading: { value: 'モリ', provenance: 'tokenizer' } }),
  tok('t1', 1, 2, 'に', 'particle', '助詞/格助詞/一般/*'),
  tok('t2', 2, 3, 'は', 'particle', '助詞/係助詞/*/*'),
  tok('t3', 3, 6, '守り神', 'noun', '名詞/一般/*/*'),
  tok('t4', 6, 7, 'が', 'particle', '助詞/格助詞/一般/*'),
  tok('t5', 7, 8, 'い', 'verb', '動詞/自立/*/*', { lemma: 'いる', conjugatedForm: '連用形' }),
  tok('t6', 8, 9, 'た', 'auxiliary', '助動詞/*/*/*', { conjugatedForm: '基本形' }),
  tok('t7', 9, 10, '。', 'punctuation', '記号/句点/*/*'),
];
const g = analyze(text, tokens);
const analysis = { text, tokens, gaps: [], ...g };

test('grammar attaches には as one particle sequence and labels the relation as に-marked, made the topic', () => {
  const mori = g.groups.find(x => x.headSurface === '森には');
  assert.ok(mori, 'noun group 森には exists');
  assert.deepEqual(mori.particleTokenIds, ['t1', 't2']);
  const rel = g.relations.find(r => r.sourceGroupId === mori.groupId);
  assert.equal(rel.type, 'ni-marked');
  assert.match(rel.label, /made the topic \(は\)/);
});

test('Words view renders には as a single wide diamond in the に hue', () => {
  const html = buildBlockRowHTML(analysis, { level: 'words', romaji: true });
  const diamonds = [...html.matchAll(/<button type="button" class="(ss-blk ss-part[^"]*)"[^>]*>(?:<span class="ss-txt">)?([^<]*)/g)].map(m => [m[1], m[2]]);
  const niwa = diamonds.find(d => d[1] === 'には');
  assert.ok(niwa, `には rendered as one block; got ${JSON.stringify(diamonds)}`);
  assert.match(niwa[0], /ss-h-ni/);
  assert.match(niwa[0], /ss-wide/);
  assert.ok(!diamonds.some(d => d[1] === 'は'), 'no separate は diamond');
  assert.match(html, /ss-w-h-ni">ni wa</, 'romaji line reads "ni wa" in the に hue');
});

test('furigana: tokenizer reading in hiragana over kanji words; publisher ruby wins for the span it covers, even inside a longer token', () => {
  const t2 = '底知れぬ野望を抱き、トライフォースを手に入れようと目論む。';
  const toks = [
    tok('a0', 0, 1, '底', 'noun', '名詞/一般/*/*', { reading: { value: 'ソコ', provenance: 'tokenizer' } }),
    tok('a1', 1, 3, '知れ', 'verb', '動詞/自立/*/*', { lemma: '知れる', reading: { value: 'シレ', provenance: 'tokenizer' }, conjugatedForm: '未然形' }),
    tok('a2', 3, 4, 'ぬ', 'auxiliary', '助動詞/*/*/*'),
    tok('a3', 4, 6, '野望', 'noun', '名詞/一般/*/*', { reading: { value: 'ヤボウ', provenance: 'tokenizer' } }),
    tok('a4', 6, 7, 'を', 'particle', '助詞/格助詞/一般/*'),
    tok('a5', 7, 9, '抱き', 'verb', '動詞/自立/*/*', { lemma: '抱く', reading: { value: 'イダキ', provenance: 'tokenizer' }, conjugatedForm: '連用形' }),
    tok('a6', 9, 10, '、', 'punctuation', '記号/読点/*/*'),
    tok('a7', 10, 17, 'トライフォース', 'noun', '名詞/一般/*/*', { lexical: 'unknown' }),
    tok('a8', 17, 18, 'を', 'particle', '助詞/格助詞/一般/*'),
    tok('a9', 18, 19, '手', 'noun', '名詞/一般/*/*', { reading: { value: 'テ', provenance: 'tokenizer' } }),
    tok('b0', 19, 20, 'に', 'particle', '助詞/格助詞/一般/*'),
    tok('b1', 20, 23, '入れよ', 'verb', '動詞/自立/*/*', { lemma: '入れる', reading: { value: 'イレヨ', provenance: 'tokenizer' }, conjugatedForm: '未然ウ接続' }),
    tok('b2', 23, 24, 'う', 'auxiliary', '助動詞/*/*/*'),
    tok('b3', 24, 25, 'と', 'particle', '助詞/格助詞/引用/*'),
    tok('b4', 25, 28, '目論む', 'verb', '動詞/自立/*/*', { lemma: '目論む', reading: { value: 'モクロム', provenance: 'tokenizer' }, conjugatedForm: '基本形' }),
    tok('b5', 28, 29, '。', 'punctuation', '記号/句点/*/*'),
  ];
  const an = { text: t2, tokens: toks, gaps: [], ...analyze(t2, toks) };
  const off = buildBlockRowHTML(an, { level: 'words', romaji: false });
  assert.ok(!/<ruby>/.test(off), 'no ruby unless asked');
  const on = buildBlockRowHTML(an, { level: 'words', romaji: false, furigana: true, rubySpans: [{ start: 25, end: 27, reading: 'もくろ' }] });
  assert.match(on, /data-furigana="on"/);
  assert.match(on, /<ruby>野望<rt>やぼう<\/rt><\/ruby>/, 'tokenizer katakana becomes hiragana');
  assert.match(on, /<ruby>目論<rt>もくろ<\/rt><\/ruby>む/, 'publisher ruby covers only 目論; む stays plain');
  assert.ok(!/<ruby>トライフォース/.test(on), 'kana-only words get no furigana');
  assert.ok(!/<ruby>を/.test(on), 'particles get none');
});

test('Phrases view merges the group particles the same way and the legend explains the compound', () => {
  const html = buildBlockRowHTML(analysis, { level: 'phrases', romaji: false });
  assert.match(html, /ss-blk ss-part ss-h-ni ss-wide[^>]*><span class="ss-txt">には</);
  const legend = buildLegendHTML(analysis, { level: 'words', romaji: false });
  assert.match(legend, /には<\/span><span class="ss-role">に \+ は — at \/ to \/ in …, made the topic/);
});
