/*
 * reader-core/text.js — text normalization, sentence identity, and Unicode
 * helpers for the Nihongo Reader. Pure ESM, no DOM, no Chrome APIs; runs in
 * Node (tests), the side panel, and the analysis worker.
 *
 * Three representations of one captured sentence (handoff §6):
 *   displayText     what the learner sees; actual glyphs and punctuation.
 *   analysisText    what the tokenizer receives; identical to displayText in v1.
 *   fingerprintText versioned normalization for deduplication ONLY.
 *
 * Layout breaks: the capture layer encodes a layout-generated break (<br>,
 * block boundary inside one selection) as '\n'. Authored spaces stay ' '.
 */

/** Bump when fingerprint() changes behaviour. Stored with every sentence. */
export const NORMALIZATION_VERSION = 1;

const WS_RUN = /[ \t\f\v 　]+/g;

/**
 * Fingerprint normalization: NFC, drop layout breaks, collapse whitespace runs
 * to one ASCII space, trim. Never NFKC (it would fold ㍻/full-width forms),
 * never phonetic or spelling substitutions.
 * @param {string} text
 * @returns {string}
 */
export function fingerprint(text) {
  return String(text)
    .normalize('NFC')
    .replace(/\r\n|\r|\n/g, '')
    .replace(WS_RUN, ' ')
    .trim();
}

/**
 * displayText from captured text: keep authored spaces and glyphs, but a
 * layout break inside a sentence must not become a visible newline.
 * @param {string} captured
 */
export function toDisplayText(captured) {
  return String(captured).normalize('NFC').replace(/\r\n|\r|\n/g, '').replace(WS_RUN, ' ').trim();
}

/**
 * displayText plus an index map so spans measured on the captured text (ruby
 * readings) can be carried across the normalization. `map[i]` is the display
 * index of captured char i, or -1 when the char was dropped (layout break,
 * collapsed whitespace, trimmed edge). `map` is null when NFC changed the
 * string length (rare; spans are then dropped rather than guessed).
 * @param {string} captured
 * @returns {{text:string, map:Int32Array|null}}
 */
export function toDisplayTextWithMap(captured) {
  const src = String(captured);
  const nfc = src.normalize('NFC');
  if (nfc.length !== src.length) return { text: toDisplayText(src), map: null };
  const map = new Int32Array(src.length).fill(-1);
  let out = '';
  let inSpace = false;
  for (let i = 0; i < nfc.length; i++) {
    const ch = nfc[i];
    if (ch === '\n' || ch === '\r') continue;
    if (/[ \t\f\v　]/.test(ch)) { if (!inSpace) { map[i] = out.length; out += ' '; inSpace = true; } continue; }
    inSpace = false;
    map[i] = out.length; out += ch;
  }
  // trim edges and shift the map
  const lead = out.length - out.trimStart().length;
  const trimmed = out.trim();
  for (let i = 0; i < map.length; i++) { if (map[i] < 0) continue; const j = map[i] - lead; map[i] = j >= 0 && j < trimmed.length ? j : -1; }
  return { text: trimmed, map };
}

/**
 * Re-express spans measured on the captured text in display-text offsets.
 * Spans whose characters were all dropped are omitted.
 * @param {{start:number,end:number}[]} spans
 * @param {Int32Array|null} map from toDisplayTextWithMap
 */
export function remapSpans(spans, map) {
  if (!spans || !spans.length) return [];
  if (!map) return [];
  const out = [];
  for (const sp of spans) {
    let s = -1, e = -1;
    for (let i = sp.start; i < sp.end && i < map.length; i++) if (map[i] >= 0) { s = map[i]; break; }
    for (let i = Math.min(sp.end, map.length) - 1; i >= sp.start; i--) if (map[i] >= 0) { e = map[i] + 1; break; }
    if (s >= 0 && e > s) out.push({ ...sp, start: s, end: e });
  }
  return out;
}

/**
 * SHA-256 hex of a UTF-8 string via WebCrypto (Node ≥ 20 and browsers).
 * @param {string} s
 * @returns {Promise<string>}
 */
export async function sha256Hex(s) {
  const data = new TextEncoder().encode(s);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sentence identity: hash of a version-tagged canonical JSON array, so the
 * key never depends on URL, tab, or tokenizer version.
 * @param {string} displayText
 * @returns {Promise<string>} 64 hex chars
 */
export async function sentenceKey(displayText) {
  return sha256Hex(JSON.stringify(['sentence', NORMALIZATION_VERSION, fingerprint(displayText)]));
}

// ── Sentence segmentation ───────────────────────────────────────────────────

const TERMINALS = '。！？!?‼⁇⁈⁉';
const CLOSERS = '」』）)】〕］]”’';

/**
 * Split one block of text into sentences. Terminal punctuation and any
 * closing quotes/brackets that follow stay with the sentence they close.
 * A trailing run without terminal punctuation is returned as a fragment.
 * Layout breaks ('\n') never split. Offsets are UTF-16 into the input.
 * @param {string} text
 * @returns {{text:string,start:number,end:number,fragment:boolean}[]}
 */
export function segmentSentences(text) {
  const out = [];
  let start = 0;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (TERMINALS.includes(ch)) {
      let j = i + 1;
      while (j < n && (TERMINALS.includes(text[j]) || CLOSERS.includes(text[j]))) j++;
      push(start, j, false);
      start = j;
      i = j;
    } else {
      i++;
    }
  }
  if (start < n) push(start, n, true);
  return out;

  function push(s, e, fragment) {
    // trim whitespace/layout breaks at the edges but keep offsets honest
    while (s < e && /[\s　]/.test(text[s])) s++;
    while (e > s && /[\s　]/.test(text[e - 1])) e--;
    if (e > s) out.push({ text: text.slice(s, e), start: s, end: e, fragment });
  }
}

// ── Unicode / kanji helpers ─────────────────────────────────────────────────

const UNIFIED_IDEOGRAPH = /^\p{Unified_Ideograph}$/u;
const VARIATION_SELECTOR = /[︀-️\u{e0100}-\u{e01ef}]/u;
export const REPETITION_MARK = '々';

/** @param {string} ch one code point */
export function isKanji(ch) {
  return UNIFIED_IDEOGRAPH.test(ch);
}

/**
 * Iterate kanji by code point. Each hit reports the UTF-16 index and length
 * (2 for supplementary characters such as 𠮷), the glyph as displayed
 * (variation selector kept), and a `kanjiKey` for lookup (selector stripped).
 * 々 is reported with `repetition: true` and the key of the kanji it repeats,
 * or `null` when nothing precedes it.
 * @param {string} text
 * @returns {{index:number,length:number,glyph:string,kanjiKey:string|null,repetition:boolean}[]}
 */
export function iterateKanji(text) {
  const out = [];
  let index = 0;
  let prevKey = null;
  const cps = [...text];
  for (let k = 0; k < cps.length; k++) {
    const cp = cps[k];
    if (isKanji(cp)) {
      let glyph = cp;
      let length = cp.length;
      const next = cps[k + 1];
      if (next && VARIATION_SELECTOR.test(next)) { glyph += next; length += next.length; k++; }
      out.push({ index, length, glyph, kanjiKey: cp, repetition: false });
      prevKey = cp;
      index += length;
      continue;
    }
    if (cp === REPETITION_MARK) {
      out.push({ index, length: 1, glyph: cp, kanjiKey: prevKey, repetition: true });
      index += 1;
      continue;
    }
    if (!VARIATION_SELECTOR.test(cp)) prevKey = null;
    index += cp.length;
  }
  return out;
}

/** Distinct kanji keys in text (variation selectors stripped, 々 excluded). */
export function distinctKanji(text) {
  return [...new Set(iterateKanji(text).filter(k => !k.repetition && k.kanjiKey).map(k => k.kanjiKey))];
}

/**
 * Lookup key for a glyph: strip variation selectors, keep the base code point.
 * @param {string} glyph
 */
export function kanjiKeyOf(glyph) {
  return String(glyph).replace(new RegExp(VARIATION_SELECTOR.source, 'gu'), '');
}

// ── Ruby ────────────────────────────────────────────────────────────────────

/**
 * Publisher reading for a span, if a ruby annotation covers it exactly or
 * contains it. Ruby spans are UTF-16 offsets into displayText.
 * @param {{start:number,end:number,reading:string}[]|undefined} rubySpans
 * @param {number} start
 * @param {number} end
 * @returns {{reading:string, exact:boolean}|null}
 */
export function rubyReadingFor(rubySpans, start, end) {
  if (!rubySpans) return null;
  for (const r of rubySpans) {
    if (r.start === start && r.end === end) return { reading: r.reading, exact: true };
    if (r.start <= start && r.end >= end) return { reading: r.reading, exact: false };
  }
  return null;
}
