/*
 * panel/blocks.js — builds the Sentence Structure diagram (romaji line, block
 * row, legend) from an ANALYZE_RESULT, reusing the lesson's `.ss-*` class names
 * so its CSS ports verbatim (app.css:14832-14990).
 *
 * Kinds follow the lesson's four blocks: noun (incl. な-adjectives), verb
 * (incl. い-adjectives), particle (12 hues), stop; plus `ss-other` for words the
 * lesson does not classify (adverbs, adnominals, conjunctions…), labelled with
 * their part of speech so colour is never the only cue.
 *
 * Levels: 'words' = one block per token (auxiliaries fold into their verb, as
 * 見ている in the lesson); 'phrases' = one block per group (a の-chain becomes
 * one wide noun block with inline の chips; a predicate group one green block).
 */
import { tokenRomaji, toHiragana } from '../../../reader-core/romaji.js';
import { iterateKanji, rubyReadingFor } from '../../../reader-core/text.js';
import { CASE_PARTICLES, topLevelGroups } from '../../../reader-core/grammar.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NOUNISH = new Set(['noun', 'name', 'number', 'pronoun', 'prefix', 'suffix', 'na-adjective']);
const KIND_LABEL = { noun: 'noun', verb: 'verb', part: 'particle', stop: 'stop', other: '' };

export function kindForToken(t) {
  if (t.pos === 'punctuation' && /[。！？!?]/.test(t.surface)) return 'stop';
  if (t.pos === 'punctuation' || t.pos === 'symbol') return 'other';
  if (t.pos === 'particle') return 'part';
  if (t.pos === 'auxiliary') return (t.lemma === 'です' || t.lemma === 'だ' || t.lemma === 'である') ? 'part' : 'verb';
  if (t.pos === 'verb' || t.pos === 'i-adjective') return 'verb';
  if (NOUNISH.has(t.pos)) return 'noun';
  return 'other';
}
const posLabel = (t) => ({ 'i-adjective': 'i-adj', 'na-adjective': 'na-adj', adnominal: 'this/that', adverb: 'adverb', conjunction: 'joins', interjection: 'exclaim', name: 'name', number: 'number', pronoun: 'pronoun', suffix: 'suffix', prefix: 'prefix', unknown: '?' }[t.pos] || '');
const hueOf = (surface) => CASE_PARTICLES[surface] ? ` ss-h-${CASE_PARTICLES[surface]}` : '';
/** Hue of a particle unit comes from its first (case) particle: には → に. */
const hueOfUnit = (u) => hueOf(u.tokens && u.tokens[0] ? u.tokens[0].surface : u.surface);
const CASE_HEADS = new Set(['に', 'で', 'と', 'へ', 'から', 'まで']);
/** Token text, with furigana when asked: the publisher's ruby if it covers exactly this token, else the tokenizer reading in hiragana. Kana-only tokens get none. */
function tokenHTML(t, opts) {
  const text = esc(t.surface);
  if (!opts || !opts.furigana) return text;
  if (!iterateKanji(t.surface).some(k => k.kanjiKey)) return text;
  // publisher ruby wins for the span it actually covers, even inside a longer token (目論む: 目論 = もくろ, む plain)
  const inside = (opts.rubySpans || []).filter(r => r.start >= t.startUtf16 && r.end <= t.endUtf16 && r.end > r.start).sort((a, b) => a.start - b.start);
  if (inside.length) {
    let out = '', cursor = t.startUtf16;
    for (const r of inside) {
      if (r.start < cursor) continue;
      out += esc(t.surface.slice(cursor - t.startUtf16, r.start - t.startUtf16));
      out += `<ruby>${esc(t.surface.slice(r.start - t.startUtf16, r.end - t.startUtf16))}<rt>${esc(r.reading)}</rt></ruby>`;
      cursor = r.end;
    }
    return out + esc(t.surface.slice(cursor - t.startUtf16));
  }
  const pub = rubyReadingFor(opts.rubySpans, t.startUtf16, t.endUtf16);
  const reading = pub ? pub.reading : (t.reading && t.reading.value ? toHiragana(t.reading.value) : null);
  if (!reading || reading === t.surface) return text;
  return `<ruby>${text}<rt>${esc(reading)}</rt></ruby>`;
}
/** には / では / とは / からは / にも / でも …: a case particle followed by は or も is ONE tag on the same word. */
const isCompoundTail = (prevUnit, t) => !!prevUnit && prevUnit.kind === 'part' && t.pos === 'particle' && (t.surface === 'は' || t.surface === 'も') && prevUnit.tokens.length === 1 && CASE_HEADS.has(prevUnit.tokens[0].surface);

/** Words level: fold auxiliaries (and て+aspect verbs) into the preceding verb block. */
function wordUnits(tokens) {
  const units = [];
  for (const t of tokens) {
    if (t.pos === 'whitespace') continue;
    const prev = units[units.length - 1];
    const foldable = prev && prev.kind === 'verb' && (
      (t.pos === 'auxiliary' && !(t.lemma === 'です' || t.lemma === 'だ')) ||
      (t.pos === 'particle' && (t.surface === 'て' || t.surface === 'で') && t.rawPos[1] === '接続助詞') ||
      (t.pos === 'verb' && prev.tokens[prev.tokens.length - 1].pos === 'particle') ||
      (t.pos === 'verb' && prev.tokens[prev.tokens.length - 1].conjugatedForm === '連用形' && prev.tokens[prev.tokens.length - 1].pos === 'verb') ||
      (t.pos === 'i-adjective' && t.lemma === 'ない'));
    if (foldable) { prev.tokens.push(t); continue; }
    // な after a na-adjective folds into it (静かな) so the block reads as one word
    if (prev && prev.kind === 'noun' && prev.tokens[0].pos === 'na-adjective' && t.pos === 'auxiliary' && t.surface === 'な') { prev.tokens.push(t); continue; }
    // compound particles (には, では, にも …) are one diamond
    if (isCompoundTail(prev, t)) { prev.tokens.push(t); continue; }
    units.push({ kind: kindForToken(t), tokens: [t] });
  }
  return units.map(u => ({ ...u, surface: u.tokens.map(t => t.surface).join(''), start: u.tokens[0].startUtf16, end: u.tokens[u.tokens.length - 1].endUtf16, tokenIds: u.tokens.map(t => t.tokenId), sub: posLabel(u.tokens[0]) }));
}

/** Phrases level: one unit per top-level group; particles attached to a group become diamonds after it. */
function phraseUnits(analysis) {
  const tokById = new Map(analysis.tokens.map(t => [t.tokenId, t]));
  const units = [];
  const used = new Set();
  for (const g of topLevelGroups(analysis.groups)) {
    const particleIds = new Set(g.particleTokenIds || []);
    const connectorId = g.connectorTokenId || null;
    const body = analysis.tokens.filter(t => t.startUtf16 >= g.startUtf16 && t.endUtf16 <= g.endUtf16 && !particleIds.has(t.tokenId) && t.tokenId !== connectorId && t.pos !== 'whitespace');
    if (!body.length) continue;
    const kind = g.type === 'predicate-group' ? 'verb' : (g.type === 'noun-group' ? 'noun' : 'other');
    units.push({ kind, tokens: body, phrase: true, surface: body.map(t => t.surface).join(''), start: body[0].startUtf16, end: body[body.length - 1].endUtf16, tokenIds: body.map(t => t.tokenId), groupId: g.groupId, status: g.status, label: g.label, sub: g.type === 'unknown-span' ? posLabel(body[0]) : (g.anchor ? 'anchor' : '') });
    body.forEach(t => used.add(t.tokenId));
    for (const pid of [...(g.particleTokenIds || []), ...(connectorId ? [connectorId] : [])]) {
      const p = tokById.get(pid); if (!p) continue;
      const prev = units[units.length - 1];
      if (pid !== connectorId && isCompoundTail(prev, p) && prev.groupParticle === g.groupId) { prev.tokens.push(p); prev.surface += p.surface; prev.end = p.endUtf16; prev.tokenIds.push(p.tokenId); used.add(pid); continue; }
      units.push({ kind: 'part', tokens: [p], surface: p.surface, start: p.startUtf16, end: p.endUtf16, tokenIds: [p.tokenId], sub: pid === connectorId ? 'joins' : '', groupParticle: g.groupId });
      used.add(pid);
    }
  }
  // tokens not covered by any group (punctuation, stray particles) keep their place
  for (const t of analysis.tokens) if (!used.has(t.tokenId) && t.pos !== 'whitespace') units.push({ kind: kindForToken(t), tokens: [t], surface: t.surface, start: t.startUtf16, end: t.endUtf16, tokenIds: [t.tokenId], sub: posLabel(t) });
  units.sort((a, b) => a.start - b.start);
  return units;
}

/** Units + roles for a level; shared by the row and the legend builders. */
function prepare(analysis, opts) {
  const level = opts.level === 'phrases' && analysis.groups.length ? 'phrases' : 'words';
  const units = level === 'phrases' ? phraseUnits(analysis) : wordUnits(analysis.tokens);
  const roleByGroup = relationLabels(analysis);
  // Words view: a word inherits the role of the smallest phrase that contains it (森 → で-marked place; 暮らす → describes 少年)
  if (level === 'words') for (const u of units) { if (!u.groupId && u.kind !== 'part' && u.kind !== 'stop') { const g = smallestGroupFor(analysis, u.start, u.end); if (g) { u.groupId = g.groupId; u.label = g.label; u.status = u.status || (g.status === 'uncertain' ? 'uncertain' : undefined); if (g.anchor) u.sub = u.sub || 'anchor'; } } }
  // a sentence-final noun with nothing pointing out of it is the head the rest describes
  const lastNoun = [...units].reverse().find(u => u.kind === 'noun');
  if (lastNoun && lastNoun.groupId && !roleByGroup.has(lastNoun.groupId) && !analysis.groups.some(g => g.anchor)) roleByGroup.set(lastNoun.groupId, 'the head noun — what the rest describes');
  return { level, units, roleByGroup };
}

/**
 * Romaji line + interlocking block row (no legend). Used by the in-page bar and the panel.
 * @param {object} analysis ANALYZE_RESULT
 * @param {{level:'words'|'phrases', romaji:boolean, selectedTokenIds?:string[]}} opts
 */
export function buildBlockRowHTML(analysis, opts) {
  const { level, units, roleByGroup } = prepare(analysis, opts);
  const selected = new Set(opts.selectedTokenIds || []);
  const romaji = opts.romaji ? `<p class="ss-sentence-jp-text" lang="ja-Latn">${units.map(u => u.kind === 'stop' ? `<span class="ss-w-stop">${esc(u.surface)}</span>` : `<span class="ss-w-${u.kind}${u.kind === 'part' ? hueOfUnit(u).replace(' ss-h-', ' ss-w-h-') : ''}">${esc(u.tokens.map(tokenRomaji).join(level === 'phrases' || u.kind === 'part' ? ' ' : ''))}</span>`).join(' ')}</p>` : '';
  const runs = [];
  for (const u of units) {
    const last = runs[runs.length - 1];
    const isPunct = u.kind === 'other' && (u.tokens[0].pos === 'punctuation' || u.tokens[0].pos === 'symbol');
    if ((u.kind === 'part' || u.kind === 'stop' || isPunct) && last && last.length && last[last.length - 1].kind !== 'stop') last.push(u);
    else runs.push([u]);
  }
  const blocks = runs.map(run => `<span class="ss-unit">${run.map(u => blockHTML(u, roleByGroup, level, selected, opts)).join('')}</span>`).join('');
  return `${romaji}<div class="ss-blocks-row" role="list" aria-label="Sentence blocks, ${level} view" data-level="${level}"${opts.furigana ? ' data-furigana="on"' : ''}>${blocks}</div>`;
}

/**
 * Legend rows (word, reading, role). Panel only.
 */
export function buildLegendHTML(analysis, opts) {
  const { level, units, roleByGroup } = prepare(analysis, opts);
  const legend = units.filter(u => (u.kind !== 'stop' && u.kind !== 'other') || (u.kind === 'other' && u.sub && u.tokens[0].pos !== 'punctuation' && u.tokens[0].pos !== 'symbol')).map(u => {
    const role = u.kind === 'part' ? particleRole(u.surface) : (u.groupId ? (roleByGroup.get(u.groupId) || u.label || '') : (u.sub || KIND_LABEL[u.kind]));
    const reading = u.kind === 'part' ? '' : ` (${esc(u.tokens.filter(t => t.pos !== 'punctuation').map(tokenRomaji).join(level === 'phrases' ? ' ' : ''))})`;
    return `<div class="ss-bd ss-w-${u.kind}"><span class="ss-jp" lang="ja">${esc(u.surface)}${reading}</span><span class="ss-role">${esc(role)}</span></div>`;
  }).join('');
  return `<div class="ss-breakdown">${legend}</div>`;
}

/** True when any group/relation is uncertain or the analysis carries warnings. */
export function isPartial(analysis) {
  return analysis.groups.some(g => g.status === 'uncertain') || analysis.relations.some(r => r.status === 'uncertain') || (analysis.warnings && analysis.warnings.length > 0);
}

/**
 * Full panel diagram: romaji line + row + partial note + legend, inside .ss-sentence-build.
 * @param {object} analysis ANALYZE_RESULT
 * @param {{level:'words'|'phrases', romaji:boolean, relationsById?:Map}} opts
 * @returns {string} HTML
 */
export function buildSentenceHTML(analysis, opts) {
  const level = opts.level === 'phrases' && analysis.groups.length ? 'phrases' : 'words';
  return `<div class="ss-sentence-build" data-level="${level}">
    ${buildBlockRowHTML(analysis, opts)}
    ${buildLegendHTML(analysis, opts)}
  </div>`;
}

function blockHTML(u, roleByGroup, level, selected = new Set(), opts = {}) {
  const kind = u.kind;
  const isSel = u.tokenIds && u.tokenIds.some(id => selected.has(id));
  const wide = kind === 'part' && [...u.surface].length > 1 ? ' ss-wide' : '';
  const cls = `ss-blk ss-${kind}${kind === 'part' ? hueOfUnit(u) : ''}${wide}${u.status === 'uncertain' ? ' ss-uncertain' : ''}${u.sub === 'anchor' ? ' ss-anchor' : ''}${isSel ? ' ss-selected' : ''}`;
  const label = kind === 'part' ? particleRole(u.surface) : (u.groupId ? (roleByGroup.get(u.groupId) || u.label || KIND_LABEL[kind]) : (u.sub || KIND_LABEL[kind]));
  const aria = `${u.surface} — ${kind === 'part' ? 'particle' : (KIND_LABEL[kind] || u.sub || 'word')}${label ? ', ' + label : ''}`;
  const inner = `<span class="ss-txt">${u.tokens.map(t => (u.phrase && t.pos === 'particle' && t.surface === 'の') ? `<span class="ss-pmark ss-no" aria-label="の">の</span>` : tokenHTML(t, opts)).join('')}</span>`;
  const sub = u.sub && u.sub !== 'anchor' ? `<small>${esc(u.sub)}</small>` : '';
  if (kind === 'stop') return `<span class="${cls}" role="listitem" aria-label="sentence end">${inner}</span>`;
  if (kind === 'other' && (u.tokens[0].pos === 'punctuation' || u.tokens[0].pos === 'symbol')) return `<span class="ss-punct" role="listitem" aria-label="punctuation ${esc(u.surface)}" lang="ja">${esc(u.surface)}</span>`;
  return `<button type="button" class="${cls}" role="listitem" lang="ja" aria-label="${esc(aria)}" data-tokens="${u.tokenIds.join(',')}" data-group="${u.groupId || ''}">${inner}${sub}</button>`;
}

const PARTICLE_ROLE_TEXT = { は: 'topic marker', が: 'subject marker', を: 'object marker', に: 'に — target / place / time', で: 'で — place of action / means', と: 'と — with / and / quote', へ: 'toward', から: 'from', まで: 'until', も: 'also', や: 'and (list)', の: 'of / links nouns', て: 'and then', ので: 'because', ば: 'if', けど: 'but', です: 'is (polite)', だ: 'is' };
const COMPOUND_ROLE_TEXT = { には: 'に + は — at / to / in …, made the topic', では: 'で + は — at / by means of …, made the topic', とは: 'と + は — “as for … with” / defines a term', へは: 'へ + は — toward …, made the topic', からは: 'から + は — from …, made the topic', までは: 'まで + は — up to …, made the topic', にも: 'に + も — also at / to …', でも: 'で + も — even / also at …', とも: 'と + も — also with …', へも: 'へ + も — also toward …', からも: 'から + も — also from …', までも: 'まで + も — even up to …' };
function particleRole(surface) {
  if (PARTICLE_ROLE_TEXT[surface]) return PARTICLE_ROLE_TEXT[surface];
  if (COMPOUND_ROLE_TEXT[surface]) return COMPOUND_ROLE_TEXT[surface];
  const m = /^(.+)(は|も)$/.exec(surface);
  if (m && PARTICLE_ROLE_TEXT[m[1]]) return `${PARTICLE_ROLE_TEXT[m[1]]} + ${m[2] === 'は' ? 'topic (は)' : 'also (も)'}`;
  return 'particle';
}

/** Smallest noun/predicate group whose span contains [s,e). */
function smallestGroupFor(analysis, s, e) {
  let best = null;
  for (const g of analysis.groups) {
    if ((g.type !== 'noun-group' && g.type !== 'predicate-group') || g.startUtf16 > s || g.endUtf16 < e) continue;
    if (!best || (g.endUtf16 - g.startUtf16) < (best.endUtf16 - best.startUtf16)) best = g;
  }
  return best;
}

/** group id → learner-facing role: its outgoing relation, else its label, else the nearest ancestor's role. */
function relationLabels(analysis) {
  const out = new Map();
  const byId = new Map(analysis.groups.map(g => [g.groupId, g]));
  for (const g of analysis.groups) if (g.anchor) out.set(g.groupId, g.label || 'the verb, anchoring it all');
  for (const r of analysis.relations) {
    if (out.has(r.sourceGroupId) && byId.get(r.sourceGroupId)?.anchor) continue;
    const suffix = r.status === 'uncertain' ? ' (uncertain)' : '';
    out.set(r.sourceGroupId, (r.label || r.type) + suffix);
  }
  // inherit upwards: 森 inside 森で inherits "で-marked …"; a relative-clause predicate inherits "describes"
  for (const g of analysis.groups) {
    if (out.has(g.groupId)) continue;
    let p = g.parentGroupId ? byId.get(g.parentGroupId) : null;
    while (p && !out.has(p.groupId)) p = p.parentGroupId ? byId.get(p.parentGroupId) : null;
    if (p) out.set(g.groupId, out.get(p.groupId));
  }
  return out;
}
