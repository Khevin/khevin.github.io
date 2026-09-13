/*
 * reader-core/romaji.js — katakana/hiragana → Hepburn romaji for the optional
 * romaji line. Tokenizer readings arrive as katakana. Particles は/へ/を are
 * written wa/e/wo as in the Sentence Structure lesson (WATASHI WA … WO …).
 */

const BASE = {
  ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'wo', ン: 'n',
  ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
  ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
  ダ: 'da', ヂ: 'ji', ヅ: 'zu', デ: 'de', ド: 'do',
  バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
  パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',
  ヴ: 'vu',
  ァ: 'a', ィ: 'i', ゥ: 'u', ェ: 'e', ォ: 'o',
};
const COMBO = {
  キャ: 'kya', キュ: 'kyu', キョ: 'kyo', シャ: 'sha', シュ: 'shu', ショ: 'sho', シェ: 'she',
  チャ: 'cha', チュ: 'chu', チョ: 'cho', チェ: 'che', ニャ: 'nya', ニュ: 'nyu', ニョ: 'nyo',
  ヒャ: 'hya', ヒュ: 'hyu', ヒョ: 'hyo', ミャ: 'mya', ミュ: 'myu', ミョ: 'myo',
  リャ: 'rya', リュ: 'ryu', リョ: 'ryo', ギャ: 'gya', ギュ: 'gyu', ギョ: 'gyo',
  ジャ: 'ja', ジュ: 'ju', ジョ: 'jo', ジェ: 'je', ビャ: 'bya', ビュ: 'byu', ビョ: 'byo',
  ピャ: 'pya', ピュ: 'pyu', ピョ: 'pyo', ファ: 'fa', フィ: 'fi', フェ: 'fe', フォ: 'fo',
  ティ: 'ti', ディ: 'di', トゥ: 'tu', ドゥ: 'du', ウィ: 'wi', ウェ: 'we', ウォ: 'wo',
  ヴァ: 'va', ヴィ: 'vi', ヴェ: 've', ヴォ: 'vo', デュ: 'dyu', テュ: 'tyu', ツァ: 'tsa', ツェ: 'tse', ツォ: 'tso',
};
const PARTICLE_ROMAJI = { は: 'wa', へ: 'e', を: 'wo' };

/** Katakana → hiragana (furigana is conventionally hiragana; tokenizer readings are katakana). */
export function toHiragana(s) {
  return String(s).replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** Hiragana → katakana (readings sometimes arrive in hiragana from ruby). */
export function toKatakana(s) {
  return String(s).replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

/**
 * @param {string} kana katakana or hiragana reading
 * @returns {string} lowercase Hepburn romaji; unknown characters pass through
 */
export function kanaToRomaji(kana) {
  const s = toKatakana(kana);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const two = s.slice(i, i + 2);
    if (ch === 'ッ') {
      // double the consonant of the following syllable
      const next = COMBO[s.slice(i + 1, i + 3)] || BASE[s[i + 1]] || '';
      out += next.startsWith('ch') ? 't' : (next[0] || '');
      continue;
    }
    if (ch === 'ー') { out += out.slice(-1) || ''; continue; }
    if (COMBO[two]) { out += COMBO[two]; i++; continue; }
    if (ch === 'ン') {
      const nextRomaji = COMBO[s.slice(i + 1, i + 3)] || BASE[s[i + 1]] || '';
      out += /^[aiueoy]/.test(nextRomaji) ? "n'" : 'n';
      continue;
    }
    out += BASE[ch] ?? ch;
  }
  return out;
}

/**
 * Romaji for one token: particles keep the lesson's wa/e/wo spelling.
 * @param {{surface:string,pos:string,reading?:{value:string}|null}} token
 */
export function tokenRomaji(token) {
  if (token.pos === 'particle' && PARTICLE_ROMAJI[token.surface]) return PARTICLE_ROMAJI[token.surface];
  if (token.pos === 'punctuation' || token.pos === 'symbol') return token.surface;
  if (!token.reading || !token.reading.value) return kanaToRomaji(token.surface);
  return kanaToRomaji(token.reading.value);
}
