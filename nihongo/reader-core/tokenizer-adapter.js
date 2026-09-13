/*
 * reader-core/tokenizer-adapter.js — turns kuromoji (IPADIC) output into the
 * Reader's lossless `Token` stream. Pure ESM, no DOM.
 *
 * Contract (handoff §6/§9): every token's `surface` equals
 * `text.slice(startUtf16, endUtf16)`, and tokens plus explicit whitespace gaps
 * reconstruct the whole text. Anything else is a hard error, not a warning.
 *
 * `lexical` is dictionary membership (KNOWN/UNKNOWN), never learner knowledge.
 */

export const ADAPTER_VERSION = 1;

/** Normalized part-of-speech labels the UI knows how to colour and explain. */
export const POS_LABELS = [
  'noun', 'name', 'number', 'pronoun', 'particle', 'verb', 'i-adjective', 'na-adjective',
  'adnominal', 'adverb', 'auxiliary', 'conjunction', 'interjection', 'prefix', 'suffix',
  'punctuation', 'symbol', 'whitespace', 'unknown',
];

/**
 * Map IPADIC `pos` + `pos_detail_1` to a normalized label.
 * @param {{pos:string,pos_detail_1?:string,pos_detail_2?:string}} t
 * @returns {string}
 */
export function normalizePos(t) {
  const pos = t.pos || '';
  const d1 = t.pos_detail_1 || '*';
  const d2 = t.pos_detail_2 || '*';
  switch (pos) {
    case '名詞':
      if (d1 === '固有名詞') return 'name';
      if (d1 === '数') return 'number';
      if (d1 === '代名詞') return 'pronoun';
      if (d1 === '形容動詞語幹' || d1 === 'ナイ形容詞語幹') return 'na-adjective';
      if (d1 === '接尾') return 'suffix';
      return 'noun';                 // 一般, サ変接続, 副詞可能, 非自立, 接続詞的, 動詞非自立的 …
    case '助詞': return 'particle';
    case '動詞':
      // IPADIC files passive/causative れる・られる・せる・させる as 動詞/接尾; the learner-facing label is auxiliary.
      if (d1 === '接尾') return 'auxiliary';
      return 'verb';
    case '形容詞': return 'i-adjective';
    case '連体詞': return 'adnominal';
    case '副詞': return 'adverb';
    case '助動詞': return 'auxiliary';
    case '接続詞': return 'conjunction';
    case '感動詞': return 'interjection';
    case 'フィラー': return 'interjection';
    case '接頭詞': return 'prefix';
    case '記号':
      if (d1 === '空白') return 'whitespace';
      if (d1 === '句点' || d1 === '読点' || d1 === '括弧開' || d1 === '括弧閉') return 'punctuation';
      if (d2 === '*' && /^[。、！？!?「」『』（）()…・――\-]+$/.test(t.surface_form || '')) return 'punctuation';
      return 'symbol';
    default: return 'unknown';
  }
}

/**
 * Convert kuromoji tokens for `text` into Reader tokens with validated UTF-16
 * offsets. Throws if the token stream does not reconstruct the text.
 * @param {string} text analysisText that was tokenized
 * @param {Array<object>} raw kuromoji IpadicFeatures[]
 * @returns {{tokens: object[], gaps: {startUtf16:number,endUtf16:number,text:string}[]}}
 */
export function adaptTokens(text, raw) {
  const tokens = [];
  const gaps = [];
  let cursor = 0;
  raw.forEach((t, i) => {
    const surface = t.surface_form;
    if (typeof surface !== 'string' || surface.length === 0) {
      throw new Error(`adaptTokens: token ${i} has no surface_form`);
    }
    // kuromoji word_position is 1-based UTF-16 index into the input string.
    let start = typeof t.word_position === 'number' ? t.word_position - 1 : -1;
    let positionSource = 'word_position';
    if (start < cursor || text.slice(start, start + surface.length) !== surface) {
      const found = text.indexOf(surface, cursor);
      if (found < 0) {
        throw new Error(`adaptTokens: token ${i} "${surface}" not found at or after offset ${cursor} in text`);
      }
      start = found;
      positionSource = 'indexOf';
    }
    if (start > cursor) {
      const gapText = text.slice(cursor, start);
      if (!/^[\s　]+$/.test(gapText)) {
        throw new Error(`adaptTokens: non-whitespace gap "${gapText}" before token ${i} "${surface}"`);
      }
      gaps.push({ startUtf16: cursor, endUtf16: start, text: gapText });
    }
    const end = start + surface.length;
    const reading = t.reading && t.reading !== '*' ? { value: t.reading, provenance: 'tokenizer' } : null;
    tokens.push({
      tokenId: `t${tokens.length}`,
      startUtf16: start,
      endUtf16: end,
      surface,
      lemma: t.basic_form && t.basic_form !== '*' ? t.basic_form : null,
      pos: normalizePos(t),
      rawPos: [t.pos, t.pos_detail_1, t.pos_detail_2, t.pos_detail_3].map(x => (x == null ? '*' : x)),
      conjugatedType: t.conjugated_type && t.conjugated_type !== '*' ? t.conjugated_type : null,
      conjugatedForm: t.conjugated_form && t.conjugated_form !== '*' ? t.conjugated_form : null,
      reading,
      pronunciation: t.pronunciation && t.pronunciation !== '*' ? t.pronunciation : null,
      lexical: t.word_type === 'KNOWN' ? 'known' : 'unknown',
      positionSource,
    });
    cursor = end;
  });
  if (cursor < text.length) {
    const tail = text.slice(cursor);
    if (!/^[\s　]+$/.test(tail)) {
      throw new Error(`adaptTokens: unconsumed non-whitespace tail "${tail}"`);
    }
    gaps.push({ startUtf16: cursor, endUtf16: text.length, text: tail });
  }
  assertReconstructs(text, tokens, gaps);
  return { tokens, gaps };
}

/**
 * Exact reconstruction check. Exported so callers (worker, tests) can re-run
 * it on deserialized data.
 * @param {string} text
 * @param {object[]} tokens
 * @param {{startUtf16:number,endUtf16:number,text:string}[]} gaps
 */
export function assertReconstructs(text, tokens, gaps) {
  const pieces = [...tokens.map(t => ({ s: t.startUtf16, e: t.endUtf16, text: t.surface })),
                  ...gaps.map(g => ({ s: g.startUtf16, e: g.endUtf16, text: g.text }))]
    .sort((a, b) => a.s - b.s);
  let cursor = 0;
  let rebuilt = '';
  for (const p of pieces) {
    if (p.s !== cursor) throw new Error(`reconstruction: gap/overlap at ${cursor}→${p.s}`);
    if (text.slice(p.s, p.e) !== p.text) throw new Error(`reconstruction: slice mismatch at ${p.s}`);
    rebuilt += p.text;
    cursor = p.e;
  }
  if (rebuilt !== text) throw new Error('reconstruction: rebuilt text differs from source');
  return true;
}
