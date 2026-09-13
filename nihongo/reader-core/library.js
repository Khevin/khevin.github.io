/*
 * reader-core/library.js — card indexes and library-package preflight
 * (handoff §8–§9). Pure ESM; ZIP decoding happens in the caller (fflate).
 *
 * Package layout:  manifest.json · cards.json · lessons.json (optional) · assets/<sha256>.<ext>
 */
import { validate } from './contracts.js';
import { iterateKanji } from './text.js';

export const IMPORT_BOUNDS = { maxExpandedBytes: 128 * 1024 * 1024, maxImageBytes: 8 * 1024 * 1024, maxCards: 10000, maxPixels: 40_000_000 };
const ASSET_PATH = /^assets\/([0-9a-f]{64})\.(webp|png|jpg)$/;

/**
 * Build lookup indexes for one library's cards.
 * - byKanji:     single-glyph kanji cards → standalone matches
 * - byWord:      exact glyph string (multi-character words, kana words)
 * - byComponent: kanji appearing inside multi-character glyphs → compound-only matches
 * @param {string} libraryId
 * @param {object[]} cards CardRecord[]
 */
export function buildCardIndex(libraryId, cards) {
  const byKanji = new Map(), byWord = new Map(), byComponent = new Map(), examples = new Map();
  const push = (m, k, ref) => m.set(k, [...(m.get(k) || []), ref]);
  const sorted = [...cards].sort((a, b) => a.order - b.order);
  for (const c of sorted) {
    for (const e of (c.examples || [])) if (e && e.word && e.meaning && !examples.has(e.word)) examples.set(e.word, { meaning: e.meaning, reading: e.reading || null, cardKey: c.cardKey });
    if (!c.glyph) continue;
    const ref = { libraryId, cardKey: c.cardKey };
    const ks = iterateKanji(c.glyph).filter(k => !k.repetition && k.kanjiKey);
    if (ks.length === 1 && [...c.glyph].length === 1 && c.kind !== 'radical') push(byKanji, ks[0].kanjiKey, ref);
    else {
      push(byWord, c.glyph, ref);
      for (const k of new Set(ks.map(k => k.kanjiKey))) push(byComponent, k, ref);
    }
  }
  return { libraryId, byKanji, byWord, byComponent, examples, cards: new Map(cards.map(c => [c.cardKey, c])) };
}

/**
 * English gloss for a word, from the learner's own Nihongo material only:
 * an exact card keyword, an example word on a card, the imported glossary
 * (app DICTIONARY / KANJI_MEANINGS), or a single kanji's meaning. Null when
 * nothing local knows the word — the UI then offers an external lookup.
 * @returns {{meaning:string, source:string}|null}
 */
export function glossFor(index, glossary, surface, lemma = null) {
  const keys = [surface, lemma].filter((k, i, a) => k && a.indexOf(k) === i);
  for (const k of keys) {
    const cards = wordCards(index, k);
    if (cards.length && cards[0].keyword) return { meaning: cards[0].keyword, source: `card:${cards[0].cardKey}` };
  }
  for (const k of keys) { const e = index && index.examples && index.examples.get(k); if (e) return { meaning: e.meaning, source: `example:${e.cardKey}` }; }
  for (const k of keys) { const g = glossary && glossary.words && glossary.words[k]; if (g && g.meaning) return { meaning: g.meaning, source: g.source || 'glossary', reading: g.reading || null, seen: g.seen || null, tags: g.tags || null }; }
  if ([...surface].length === 1) { const g = glossary && glossary.kanji && glossary.kanji[surface]; if (g && g.meaning) return { meaning: g.meaning, source: g.source || 'kanji-meanings', on: g.on || null, kun: g.kun || null, reading: g.reading || null }; }
  return null;
}

/** Bounded, shape-checked glossary from a package file; returns {glossary, errors}. */
export function parseGlossary(bytes) {
  const errors = [];
  let g;
  try { g = JSON.parse(new TextDecoder().decode(bytes)); } catch { return { glossary: null, errors: ['glossary.json not JSON'] }; }
  if (!g || typeof g !== 'object') return { glossary: null, errors: ['glossary.json must be an object'] };
  const out = { words: {}, kanji: {} };
  let n = 0;
  for (const part of ['words', 'kanji']) {
    const src = g[part];
    if (src == null) continue;
    if (typeof src !== 'object' || Array.isArray(src)) { errors.push(`glossary.${part} must be an object`); continue; }
    for (const [k, v] of Object.entries(src)) {
      if (++n > 20000) { errors.push('glossary too large (> 20000 entries)'); break; }
      if (!v || typeof v !== 'object' || typeof v.meaning !== 'string' || v.meaning.length > 500 || k.length > 100) { errors.push(`glossary.${part}["${k}"] invalid`); continue; }
      const list = (x) => Array.isArray(x) ? x.filter(y => typeof y === 'string' && y.length <= 24).slice(0, 4) : [];
      const entry = { meaning: v.meaning, reading: typeof v.reading === 'string' ? v.reading : null, source: typeof v.source === 'string' ? v.source : part };
      const on = list(v.on), kun = list(v.kun), tags = list(v.tags);
      if (on.length) entry.on = on;
      if (kun.length) entry.kun = kun;
      if (tags.length) entry.tags = tags;
      if (typeof v.seen === 'string' && v.seen.length <= 200) entry.seen = v.seen;
      out[part][k] = entry;
    }
  }
  return { glossary: out, errors };
}

/** @returns {'standalone'|'compound-only'|'none'} */
export function availabilityFor(index, kanjiKey) {
  if (!index) return 'none';
  if (index.byKanji.has(kanjiKey)) return 'standalone';
  if (index.byComponent.has(kanjiKey)) return 'compound-only';
  return 'none';
}

/**
 * Preferred card for a kanji: the learner's saved preference when it still
 * exists, else the first standalone card in authored order, else null.
 * Other matches are returned so the UI can offer them without changing identity.
 */
export function cardsFor(index, kanjiKey, preferred = null) {
  if (!index) return { preferred: null, standalone: [], compounds: [] };
  const standalone = (index.byKanji.get(kanjiKey) || []).map(r => index.cards.get(r.cardKey)).filter(Boolean);
  const compounds = (index.byComponent.get(kanjiKey) || []).map(r => index.cards.get(r.cardKey)).filter(Boolean);
  let pick = null;
  if (preferred && preferred.libraryId === index.libraryId) pick = standalone.find(c => c.cardKey === preferred.cardKey) || compounds.find(c => c.cardKey === preferred.cardKey) || null;
  return { preferred: pick || standalone[0] || null, standalone, compounds };
}

/** Exact word match (multi-character glyph) for vocabulary lookup. */
export function wordCards(index, surface, lemma = null) {
  if (!index) return [];
  const refs = [...(index.byWord.get(surface) || []), ...(lemma && lemma !== surface ? (index.byWord.get(lemma) || []) : [])];
  return refs.map(r => index.cards.get(r.cardKey)).filter(Boolean);
}

/**
 * Preflight a decoded package. `files` maps package-relative path → Uint8Array.
 * Never throws on bad data; returns { ok, errors, manifest, cards, lessons, assets }.
 * Asset hashes are verified (sha256 of bytes must equal the path's hash).
 */
export async function preflightPackage(files) {
  const errors = [];
  const get = (p) => files.get(p);
  for (const p of files.keys()) {
    if (p.startsWith('/') || p.includes('..') || p.includes('\\') || /\.(js|mjs|html|htm|svg|exe|sh|bat|wasm)$/i.test(p)) errors.push(`rejected path: ${p}`);
  }
  let manifest = null, cards = null, lessons = [], glossary = null;
  try { manifest = JSON.parse(new TextDecoder().decode(get('manifest.json'))); } catch { errors.push('manifest.json missing or not JSON'); }
  if (manifest) {
    const v = validate('LibraryManifest', manifest);
    if (!v.ok) errors.push(...v.errors.slice(0, 10));
  }
  if (manifest && manifest.files) {
    try { cards = JSON.parse(new TextDecoder().decode(get(manifest.files.cards))); } catch { errors.push(`${manifest.files.cards} missing or not JSON`); }
    if (manifest.files.lessons && get(manifest.files.lessons)) { try { lessons = JSON.parse(new TextDecoder().decode(get(manifest.files.lessons))); } catch { errors.push('lessons.json not JSON'); } }
    if (manifest.files.glossary && get(manifest.files.glossary)) { const r = parseGlossary(get(manifest.files.glossary)); errors.push(...r.errors.slice(0, 5)); glossary = r.glossary; }
  }
  if (Array.isArray(cards)) {
    if (cards.length > IMPORT_BOUNDS.maxCards) errors.push(`too many cards: ${cards.length}`);
    const keys = new Set();
    cards.forEach((c, i) => {
      const v = validate('CardRecord', c);
      if (!v.ok) errors.push(`cards[${i}] ${v.errors[0]}`);
      if (c && keys.has(c.cardKey)) errors.push(`duplicate cardKey ${c.cardKey}`);
      if (c) keys.add(c.cardKey);
    });
  } else if (cards !== null) { errors.push('cards.json must be an array'); }

  const assets = [];
  let expanded = 0;
  for (const [p, bytes] of files) expanded += bytes.byteLength;
  if (expanded > IMPORT_BOUNDS.maxExpandedBytes) errors.push(`package too large: ${expanded} bytes`);
  if (manifest && Array.isArray(manifest.assets)) {
    const declared = new Set();
    for (const rec of manifest.assets) {
      declared.add(rec.path);
      const m = ASSET_PATH.exec(rec.path || '');
      if (!m) { errors.push(`asset path invalid: ${rec.path}`); continue; }
      const bytes = get(rec.path);
      if (!bytes) { errors.push(`asset missing: ${rec.path}`); continue; }
      if (bytes.byteLength > IMPORT_BOUNDS.maxImageBytes) errors.push(`asset too large: ${rec.path}`);
      if (bytes.byteLength !== rec.bytes) errors.push(`asset size mismatch: ${rec.path}`);
      if ((rec.width || 0) * (rec.height || 0) > IMPORT_BOUNDS.maxPixels) errors.push(`asset dimensions too large: ${rec.path}`);
      const hash = await sha256Bytes(bytes);
      if (hash !== m[1] || hash !== rec.assetHash) { errors.push(`asset hash mismatch: ${rec.path}`); continue; }
      assets.push({ record: rec, bytes });
    }
    for (const p of files.keys()) if (p.startsWith('assets/') && !declared.has(p)) errors.push(`undeclared asset: ${p}`);
    if (Array.isArray(cards)) {
      const hashes = new Set(manifest.assets.map(a => a.assetHash));
      for (const c of cards) if (c && c.image && !hashes.has(c.image.assetHash)) errors.push(`card ${c.cardKey} references unknown asset`);
    }
  }
  return { ok: errors.length === 0, errors, manifest, cards: Array.isArray(cards) ? cards : [], lessons, glossary, assets, expandedBytes: expanded };
}

/**
 * sha256Hex over bytes (text.js's version takes a string).
 * @param {Uint8Array} bytes
 */
export async function sha256Bytes(bytes) {
  const d = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
