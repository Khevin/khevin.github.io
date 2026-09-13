/*
 * reader-core/grammar.js — conservative phrase grouping and relations over the
 * adapter's Token stream (handoff §5). Pure ESM, no DOM, no dictionary.
 *
 * The output vocabulary is the Sentence Structure lesson's: noun groups
 * (nouns, names, numbers, な-adjectives, の-chains, with their modifiers),
 * predicate groups (verbs / い-adjectives / copulas with their auxiliaries),
 * particles as tags on the group they follow, and a predicate anchor.
 * Every relation carries a rule id, evidence spans and a discrete status:
 * `supported` only when the rule's adjacency condition holds; `uncertain`
 * otherwise. Nothing is forced: a sentence without a predicate yields groups
 * and modifier relations only.
 */

export const RULES_VERSION = '1';

export const CASE_PARTICLES = { は: 'wa', が: 'ga', を: 'o', に: 'ni', で: 'de', と: 'to', へ: 'e', から: 'kara', まで: 'made', も: 'mo', や: 'ya', の: 'no' };
const PARTICLE_ROLE = {
  は: ['topic', 'topic — what the sentence is about'],
  が: ['subject', 'subject — who or what does it'],
  を: ['object', 'object — what the action acts on'],
  も: ['also', 'also — adds this to the picture'],
  から: ['source', 'from — starting point or origin'],
  まで: ['limit', 'until / as far as — the end point'],
  へ: ['destination', 'toward — direction of movement'],
  に: ['ni-marked', 'に-marked — target, place, or time (role not resolved)'],
  で: ['de-marked', 'で-marked — place of action or means (role not resolved)'],
  と: ['to-marked', 'と-marked — with, and, or a quoted thought'],
  や: ['ya-marked', 'や — a non-exhaustive list'],
};
const CONNECTOR_TYPE = { ので: 'reason', から: 'reason', ば: 'conditional', たら: 'conditional', なら: 'conditional', て: 'sequence', で: 'sequence', が: 'contrast', けど: 'contrast', けれど: 'contrast', けれども: 'contrast', のに: 'contrast', し: 'and' };
const CONNECTOR_LABEL = { reason: 'because — the reason for what follows', conditional: 'if / when — the condition', sequence: 'and then — linked to the next action', contrast: 'but / although — contrast with what follows', and: 'and also' };
const ASPECT_VERBS = new Set(['いる', 'いく', 'くる', 'くれる', 'ある', 'おく', 'みる', 'しまう', 'あげる', 'もらう', 'くださる', 'いただく', 'ゆく']);
const NOUNISH = new Set(['noun', 'name', 'number', 'pronoun', 'prefix', 'suffix', 'na-adjective']);
const STOP = new Set(['。', '！', '？', '!', '?']);

const isCase = (t) => t.pos === 'particle' && t.surface in CASE_PARTICLES;
const isConnector = (t) => t.pos === 'particle' && (t.rawPos[1] === '接続助詞' || t.surface === 'ので');
const isCopulaAux = (t) => t.pos === 'auxiliary' && ['です', 'だ', 'でし', 'でした', 'だっ', 'である'].includes(t.surface) && t.rawPos[0] === '助動詞' && (t.lemma === 'です' || t.lemma === 'だ' || t.lemma === 'である');

/**
 * @param {string} text analysisText
 * @param {object[]} tokensIn adapter tokens (whitespace tokens ignored)
 * @returns {{groups:object[], relations:object[], warnings:string[]}}
 */
export function analyze(text, tokensIn) {
  const toks = tokensIn.filter(t => t.pos !== 'whitespace');
  const chunks = chunk(toks);
  return build(text, toks, chunks);
}

// ── Step A: chunks ─────────────────────────────────────────────────────────
// A chunk is a contiguous run with one role: noun | pred | mod | punct | stop | other.
function chunk(toks) {
  const out = [];
  let i = 0;
  const last = () => out[out.length - 1];
  const nounStartsAt = (k) => k < toks.length && (NOUNISH.has(toks[k].pos) || (toks[k].pos === 'adnominal') || (toks[k].pos === 'i-adjective' && k + 1 < toks.length && NOUNISH.has(toks[k + 1].pos)));

  while (i < toks.length) {
    const t = toks[i];

    if (t.pos === 'punctuation' || t.pos === 'symbol') {
      // 「X」/『X』/（X）: a quoted noun phrase is one noun chunk (brackets included), so a particle after 」 attaches to it
      if (/^[「『（(]$/.test(t.surface)) {
        let j = i + 1;
        while (j < toks.length && (NOUNISH.has(toks[j].pos) || toks[j].pos === 'adnominal' || (toks[j].pos === 'particle' && toks[j].surface === 'の'))) j++;
        if (j > i + 1 && j < toks.length && /^[」』）)]$/.test(toks[j].surface) && toks[j - 1].pos !== 'particle') {
          out.push({ kind: 'noun', tokens: toks.slice(i, j + 1), particles: [], modifiers: [], quoted: true });
          i = j + 1; continue;
        }
      }
      out.push({ kind: STOP.has(t.surface) ? 'stop' : 'punct', tokens: [t], comma: t.surface === '、' });
      i++; continue;
    }

    if (t.pos === 'verb') {
      const pred = { kind: 'pred', tokens: [t], particles: [], connector: null, copula: false };
      // サ変: 勉強 + し → one predicate
      const prev = last();
      if (t.lemma === 'する' && prev && prev.kind === 'noun' && prev.particles.length === 0 && !prev.noLink && prev.tokens[prev.tokens.length - 1].rawPos[1] === 'サ変接続') {
        pred.tokens.unshift(...prev.tokens); pred.modifiers = prev.modifiers; out.pop();
      }
      i = absorbPredicateTail(toks, i + 1, pred);
      out.push(pred); continue;
    }

    if (t.pos === 'i-adjective') {
      if (i + 1 < toks.length && NOUNISH.has(toks[i + 1].pos)) { out.push({ kind: 'mod', tokens: [t], modType: 'i-adjective' }); i++; continue; }
      const pred = { kind: 'pred', tokens: [t], particles: [], connector: null, copula: false };
      i = absorbPredicateTail(toks, i + 1, pred);
      out.push(pred); continue;
    }

    if (t.pos === 'adnominal') { out.push({ kind: 'mod', tokens: [t], modType: 'adnominal' }); i++; continue; }

    if (t.pos === 'na-adjective' && i + 2 < toks.length && toks[i + 1].pos === 'auxiliary' && toks[i + 1].surface === 'な' && NOUNISH.has(toks[i + 2].pos)) {
      out.push({ kind: 'mod', tokens: [t, toks[i + 1]], modType: 'na-adjective' }); i += 2; continue;
    }

    if (NOUNISH.has(t.pos)) {
      const noun = { kind: 'noun', tokens: [t], particles: [], modifiers: [] };
      i++;
      while (i < toks.length && NOUNISH.has(toks[i].pos) && !(toks[i].pos === 'na-adjective' && i + 1 < toks.length && toks[i + 1].surface === 'な')) {
        const prevTok = noun.tokens[noun.tokens.length - 1];
        if (toks[i].pos === 'number' && prevTok.pos !== 'number' && prevTok.pos !== 'prefix') break; // 毎朝 | 六時
        noun.tokens.push(toks[i]); i++;
      }
      out.push(noun); continue;
    }

    if (t.pos === 'auxiliary' && isCopulaAux(t) && last() && last().kind === 'noun' && last().particles.length === 0) {
      const noun = out.pop();
      const pred = { kind: 'pred', tokens: [t], particles: [], connector: null, copula: true, subject: noun };
      i = absorbPredicateTail(toks, i + 1, pred);
      out.push(pred); continue;
    }

    if (t.pos === 'particle') {
      const prev = last();
      // ではありません / ではない: noun + で + は + ある/ない → negative copula
      if (prev && prev.kind === 'noun' && prev.particles.length === 0 && t.surface === 'で') {
        let k = i + 1;
        if (k < toks.length && toks[k].surface === 'は' && toks[k].pos === 'particle') k++;
        if (k < toks.length && ((toks[k].pos === 'verb' && toks[k].lemma === 'ある') || (toks[k].pos === 'auxiliary' && toks[k].lemma === 'ない') || (toks[k].pos === 'i-adjective' && toks[k].lemma === 'ない'))) {
          const noun = out.pop();
          const pred = { kind: 'pred', tokens: toks.slice(i, k + 1), particles: [], connector: null, copula: true, subject: noun };
          i = absorbPredicateTail(toks, k + 1, pred);
          out.push(pred); continue;
        }
      }
      if (prev && (prev.kind === 'noun' || prev.kind === 'pred') && isCase(t) && !prev.connector) {
        if (t.surface === 'の' && prev.kind === 'noun' && prev.particles.length === 0) { prev.link = t; i++; continue; }
        if (t.surface !== 'の' || prev.kind === 'pred') { prev.particles.push(t); i++; continue; }
      }
      if (prev && prev.kind === 'pred' && isConnector(t)) { prev.connector = t; i++; continue; }
      if (prev && prev.kind === 'pred' && (t.surface === 'ので' || t.surface === 'から' || t.surface === 'けど')) { prev.connector = t; i++; continue; }
      out.push({ kind: 'other', tokens: [t] }); i++; continue;
    }

    out.push({ kind: 'other', tokens: [t] }); i++;
  }
  return out;
}

// verb/adjective tail: auxiliaries, て/で + aspect verb, 連用形 verb + verb compounds
function absorbPredicateTail(toks, i, pred) {
  while (i < toks.length) {
    const t = toks[i];
    if (t.pos === 'auxiliary' && !(t.surface === 'な' && i + 1 < toks.length && NOUNISH.has(toks[i + 1].pos))) { pred.tokens.push(t); i++; continue; }
    if (t.pos === 'particle' && (t.surface === 'て' || t.surface === 'で') && t.rawPos[1] === '接続助詞' && i + 1 < toks.length && toks[i + 1].pos === 'verb' && ASPECT_VERBS.has(toks[i + 1].lemma)) {
      pred.tokens.push(t, toks[i + 1]); i += 2; continue;
    }
    const lastTok = pred.tokens[pred.tokens.length - 1];
    if (t.pos === 'verb' && lastTok.pos === 'verb' && lastTok.conjugatedForm === '連用形') { pred.tokens.push(t); i++; continue; }
    if (t.pos === 'i-adjective' && t.lemma === 'ない' && lastTok.pos !== 'i-adjective') { pred.tokens.push(t); i++; continue; }
    break;
  }
  return i;
}

// ── Step B: groups and relations ───────────────────────────────────────────
function build(text, toks, chunks) {
  const groups = [];
  const relations = [];
  const warnings = [];
  let gid = 0, rid = 0;
  const span = (tokens) => ({ startUtf16: tokens[0].startUtf16, endUtf16: tokens[tokens.length - 1].endUtf16 });
  const surf = (s, e) => text.slice(s, e);
  const mkGroup = (type, tokens, extra = {}) => {
    const sp = span(tokens);
    const g = { groupId: `g${gid++}`, type, children: tokens.map(t => t.tokenId), ...sp, headTokenId: tokens[tokens.length - 1].tokenId, status: 'supported', parentGroupId: null, particleTokenIds: [], connectorTokenId: null, coreSurface: surf(sp.startUtf16, sp.endUtf16), ...extra };
    groups.push(g); return g;
  };
  const extend = (g, s, e) => { g.startUtf16 = Math.min(g.startUtf16, s); g.endUtf16 = Math.max(g.endUtf16, e); };
  const adopt = (parent, child) => { child.parentGroupId = parent.groupId; parent.children.push(child.groupId); extend(parent, child.startUtf16, child.endUtf16); };
  const mkRel = (source, target, type, status, ruleId, evidence, label) => {
    const r = { relationId: `r${rid++}`, sourceGroupId: source.groupId, targetGroupId: target.groupId, type, status, ruleId, evidence, label };
    relations.push(r); return r;
  };
  const attachParticles = (g, particles) => {
    if (!particles.length) return;
    g.particleTokenIds = particles.map(p => p.tokenId);
    g.children.push(...g.particleTokenIds);
    extend(g, particles[0].startUtf16, particles[particles.length - 1].endUtf16);
    g.headSurface = (g.coreSurface || surf(g.startUtf16, particles[0].startUtf16)) + particles.map(p => p.surface).join('');
  };

  // Pass 1: materialise chunks into top-level items in order.
  const items = []; // { kind, group, chunk }
  let pendingMods = [];
  for (let c = 0; c < chunks.length; c++) {
    const ch = chunks[c];
    if (ch.kind === 'mod') { pendingMods.push(ch); continue; }
    if (ch.kind === 'noun') {
      const g = mkGroup('noun-group', ch.tokens, { headSurface: surf(ch.tokens[0].startUtf16, ch.tokens[ch.tokens.length - 1].endUtf16), label: labelNoun(ch) });
      for (const m of pendingMods.splice(0)) {
        const mg = mkGroup('modifier-group', m.tokens, { label: m.modType === 'adnominal' ? 'points at / describes the noun' : `${m.modType} — describes the noun` });
        adopt(g, mg);
        mkRel(mg, g, 'modifier', 'supported', `mod-${m.modType}`, [span(m.tokens)], 'describes');
      }
      if (ch.link) {
        // の chain: this group becomes the possessor of the next noun group
        g.particleTokenIds = [ch.link.tokenId]; g.children.push(ch.link.tokenId); extend(g, ch.link.startUtf16, ch.link.endUtf16);
        g.headSurface += 'の';
        items.push({ kind: 'noun', group: g, chunk: ch, link: true });
        continue;
      }
      attachParticles(g, ch.particles);
      items.push({ kind: 'noun', group: g, chunk: ch });
      continue;
    }
    if (ch.kind === 'pred') {
      pendingMods.splice(0).forEach(m => items.push({ kind: 'other', group: mkGroup('unknown-span', m.tokens, { label: m.modType, status: 'uncertain' }), chunk: m }));
      let g;
      if (ch.copula) {
        const nounG = mkGroup('noun-group', ch.subject.tokens, { headSurface: surf(ch.subject.tokens[0].startUtf16, ch.subject.tokens[ch.subject.tokens.length - 1].endUtf16), label: 'what it is' });
        const cop = mkGroup('predicate-group', ch.tokens, { label: ch.tokens.some(t => t.lemma === 'ある' || t.lemma === 'ない') ? 'is not — negative copula' : 'is — the copula, anchoring the noun' });
        g = mkGroup('predicate-group', [...ch.subject.tokens, ...ch.tokens], { label: 'noun + copula predicate', children: [] });
        g.children = [];
        adopt(g, nounG); adopt(g, cop);
        g.headTokenId = cop.headTokenId;
        mkRel(nounG, cop, 'predicate', 'supported', 'copula', [span(ch.tokens)], 'is');
        // modifiers before the subject noun (静かな町です) are re-attached in pass 1b
      } else {
        g = mkGroup('predicate-group', ch.tokens, { label: labelPred(ch) });
      }
      attachParticles(g, ch.particles);
      if (ch.connector) { g.connectorTokenId = ch.connector.tokenId; g.children.push(ch.connector.tokenId); g.coreSurface = surf(g.startUtf16, ch.connector.startUtf16); extend(g, ch.connector.startUtf16, ch.connector.endUtf16); }
      items.push({ kind: 'pred', group: g, chunk: ch });
      continue;
    }
    if (ch.kind === 'stop' || ch.kind === 'punct') { items.push({ kind: ch.kind, chunk: ch, comma: ch.comma }); continue; }
    pendingMods.splice(0).forEach(m => items.push({ kind: 'other', group: mkGroup('unknown-span', m.tokens, { label: m.modType, status: 'uncertain' }), chunk: m }));
    items.push({ kind: 'other', group: mkGroup('unknown-span', ch.tokens, { label: ch.tokens[0].pos, status: ch.tokens[0].pos === 'adverb' || ch.tokens[0].pos === 'conjunction' ? 'supported' : 'uncertain' }), chunk: ch });
  }
  if (pendingMods.length) pendingMods.splice(0).forEach(m => items.push({ kind: 'other', group: mkGroup('unknown-span', m.tokens, { label: m.modType, status: 'uncertain' }), chunk: m }));

  // Pass 1b: a modifier immediately before a copula predicate's subject noun (静かな町です) —
  // the noun was consumed by the copula, so re-attach any unknown-span modifiers preceding it.
  for (let k = 0; k < items.length; k++) {
    const it = items[k];
    if (it.kind !== 'pred' || !it.chunk.copula) continue;
    let j = k - 1;
    const nounG = groups.find(g => g.parentGroupId === it.group.groupId && g.type === 'noun-group');
    while (j >= 0 && items[j].kind === 'other' && items[j].chunk.kind === 'mod') {
      const m = items[j].chunk; const mg = items[j].group;
      mg.type = 'modifier-group'; mg.status = 'supported'; mg.label = `${m.modType} — describes the noun`;
      adopt(nounG, mg); extend(it.group, mg.startUtf16, mg.endUtf16);
      mkRel(mg, nounG, 'modifier', 'supported', `mod-${m.modType}`, [span(m.tokens)], 'describes');
      items.splice(j, 1); k--; j--;
    }
  }

  // Pass 2: の chains → one noun phrase (outer group) with genitive relations inside.
  for (let k = 0; k < items.length; k++) {
    if (items[k].kind !== 'noun' || !items[k].link) continue;
    // find the next noun item (skipping nothing: modifiers were already adopted by that noun)
    const next = items[k + 1];
    if (!next || next.kind !== 'noun') { items[k].group.status = 'uncertain'; items[k].group.label = 'の without a following noun'; warnings.push(`の at ${items[k].group.endUtf16} has no head noun`); items[k].link = false; continue; }
    const a = items[k].group, b = next.group;
    mkRel(a, b, 'genitive', 'supported', 'no-chain', [{ startUtf16: a.endUtf16 - 1, endUtf16: a.endUtf16 }], 'of / belonging to');
    const outer = mkGroup('noun-group', toks.filter(t => t.startUtf16 >= a.startUtf16 && t.endUtf16 <= b.endUtf16), { label: 'one big noun phrase', headSurface: b.headSurface, coreSurface: b.coreSurface });
    outer.children = [];
    adopt(outer, a); adopt(outer, b);
    outer.headTokenId = b.headTokenId;
    outer.particleTokenIds = b.particleTokenIds;
    items.splice(k, 2, { kind: 'noun', group: outer, chunk: next.chunk, link: next.link, inner: b });
    k--; // re-examine in case the merged phrase itself links onward
  }

  // Pass 3: clauses. A comma closes a clause only after a predicate (or after an 'other' item).
  const clauses = [];
  let cur = [];
  for (let k = 0; k < items.length; k++) {
    const it = items[k];
    if (it.kind === 'punct' && it.comma) {
      const prev = cur[cur.length - 1];
      if (prev && (prev.kind === 'pred')) { clauses.push(cur); cur = []; }
      else if (items[k + 1]) items[k + 1].afterComma = true;   // a comma inside a clause still separates phrases
      continue;
    }
    if (it.kind === 'stop') { continue; }
    if (it.kind === 'punct') { continue; }
    cur.push(it);
    // a predicate with a connector always ends its clause
    if (it.kind === 'pred' && it.chunk.connector) { clauses.push(cur); cur = []; }
  }
  if (cur.length) clauses.push(cur);

  // Pass 4: relative clauses — a predicate (no particle, no connector) directly before a noun.
  const predArgs = new Map(); // pred groupId -> [arg groups]
  for (const cl of clauses) {
    for (let k = 0; k < cl.length - 1; k++) {
      const it = cl[k], nx = cl[k + 1];
      if (it.kind !== 'pred' || nx.kind !== 'noun' || it.chunk.connector || it.chunk.particles.length) continue;
      const lastTok = it.chunk.tokens[it.chunk.tokens.length - 1];
      const adjacent = lastTok.endUtf16 === nx.group.startUtf16 || text.slice(lastTok.endUtf16, nx.group.startUtf16).trim() === '';
      const form = lastTok.conjugatedForm;
      const ok = adjacent && (form === '基本形' || form === '連体形' || lastTok.pos === 'auxiliary' || lastTok.pos === 'i-adjective' || form == null);
      // arguments to the left that belong to this predicate (contiguous, inside the clause);
      // a topic (は) phrase belongs to the main clause, never to a relative clause
      const isTopic = (x) => x.chunk.particles && x.chunk.particles.some(p => p.surface === 'は');
      let s = k; while (s > 0 && cl[s - 1].kind === 'noun' && !cl[s - 1].link && !isTopic(cl[s - 1]) && !cl[s].afterComma) s--;
      const argItems = cl.slice(s, k);
      const clauseTokens = toks.filter(t => t.startUtf16 >= (argItems[0] || it).group.startUtf16 && t.endUtf16 <= it.group.endUtf16);
      const rel = mkGroup('clause-group', clauseTokens, { label: 'describes the noun that follows (relative clause)', status: ok ? 'supported' : 'uncertain' });
      rel.children = [...argItems.map(a => a.group.groupId), it.group.groupId];
      for (const a of argItems) { a.group.parentGroupId = rel.groupId; }
      it.group.parentGroupId = rel.groupId;
      const headNoun = nx.inner || nx.group;
      mkRel(rel, headNoun, 'modifier', ok ? 'supported' : 'uncertain', 'relative-clause', [{ startUtf16: lastTok.startUtf16, endUtf16: lastTok.endUtf16 }], 'describes');
      it.relative = true;
      // the args attach to this predicate
      for (const a of argItems) attachArg(a, it, cl);
      argItems.forEach(a => { a.consumed = true; });
    }
  }

  // Pass 5: arguments → nearest predicate to the right in the clause; connectors → next predicate.
  for (let ci = 0; ci < clauses.length; ci++) {
    const cl = clauses[ci];
    const preds = cl.filter(it => it.kind === 'pred' && !it.relative);
    const nextPred = (fromIdx, particle = null) => {
      const rest = cl.slice(fromIdx + 1).filter(it => it.kind === 'pred' && !it.relative);
      for (const p of rest) { if (p.chunk.particles.length && particle !== 'を') continue; return p; }
      return null;
    };
    for (let k = 0; k < cl.length; k++) {
      const it = cl[k];
      if (it.consumed) continue;
      if (it.kind === 'noun') {
        const target = nextPred(k, it.chunk.particles[0] ? it.chunk.particles[0].surface : null);
        if (target) { attachArg(it, target, cl); continue; }
        // no predicate to the right in this clause: try a later clause (uncertain)
        const later = clauses.slice(ci + 1).flat().find(x => x.kind === 'pred' && !x.relative);
        if (later && (it.chunk.particles.length || isAdverbial(it))) {
          mkRel(it.group, later.group, relType(it), 'uncertain', 'arg-cross-clause', evidenceFor(it), relLabel(it));
        } else if (it.chunk.particles.length) {
          it.group.status = 'uncertain';
          warnings.push(`${it.group.headSurface}: no predicate to attach to`);
        }
        continue;
      }
      if (it.kind === 'pred' && it.chunk.particles.length && !it.relative) {
        const target = nextPred(k);
        if (target) {
          const p = it.chunk.particles[0].surface;
          mkRel(it.group, target.group, p === 'に' ? 'destination' : (PARTICLE_ROLE[p] ? PARTICLE_ROLE[p][0] : 'marked'), 'supported', 'verb-particle', evidenceFor(it), p === 'に' ? 'purpose — in order to' : (p === 'と' ? 'quoted thought / intention' : relLabel(it)));
        }
      }
      if (it.kind === 'pred' && it.chunk.connector) {
        const later = clauses.slice(ci + 1).flat().find(x => x.kind === 'pred' && !x.relative);
        const type = CONNECTOR_TYPE[it.chunk.connector.surface] || 'linked';
        // clause group = everything in this clause up to the connector
        const clauseTokens = toks.filter(t => t.startUtf16 >= cl[0].group.startUtf16 && t.endUtf16 <= it.group.endUtf16);
        const cg = mkGroup('clause-group', clauseTokens, { label: CONNECTOR_LABEL[type] || 'linked clause', status: later ? 'supported' : 'uncertain' });
        cg.children = cl.filter(x => x.group && x.group.startUtf16 >= cg.startUtf16 && x.group.endUtf16 <= cg.endUtf16).map(x => x.group.groupId);
        for (const x of cl) if (x.group && cg.children.includes(x.group.groupId)) x.group.parentGroupId = cg.groupId;
        if (later) mkRel(cg, later.group, type, 'supported', `connector-${type}`, [span([it.chunk.connector])], CONNECTOR_LABEL[type]);
        else warnings.push(`connector ${it.chunk.connector.surface} without a following predicate`);
      }
    }
    // 連用中止 (信じ、その時を待つ): predicate in 連用形 closing a clause without a connector → uncertain sequence
    const lastIt = cl[cl.length - 1];
    if (lastIt && lastIt.kind === 'pred' && !lastIt.chunk.connector && !lastIt.relative && ci < clauses.length - 1) {
      const lt = lastIt.chunk.tokens[lastIt.chunk.tokens.length - 1];
      const later = clauses.slice(ci + 1).flat().find(x => x.kind === 'pred' && !x.relative);
      if (later && lt.conjugatedForm === '連用形') mkRel(lastIt.group, later.group, 'sequence', 'uncertain', 'renyou-chuushi', [span([lt])], 'and then (linked by the verb form)');
    }
  }

  // Anchor: last non-relative predicate without a connector.
  const anchor = [...items].reverse().find(it => it.kind === 'pred' && !it.relative && !it.chunk.connector);
  if (anchor) anchor.group.anchor = true;
  else if (items.some(it => it.kind === 'noun')) warnings.push('no predicate: noun phrase or fragment');

  return { groups, relations, warnings };

  function attachArg(it, target, cl) {
    if (it.chunk.particles.length) {
      mkRel(it.group, target.group, relType(it), 'supported', `particle-${CASE_PARTICLES[it.chunk.particles[0].surface] || 'x'}`, evidenceFor(it), relLabel(it));
    } else if (isAdverbial(it)) {
      mkRel(it.group, target.group, 'adverbial', 'supported', 'bare-adverbial-noun', [{ startUtf16: it.group.startUtf16, endUtf16: it.group.endUtf16 }], 'when / how — adverbial noun');
    } else {
      it.group.status = 'uncertain';
      warnings.push(`${it.group.headSurface}: bare noun with no particle`);
    }
  }
}

function isAdverbial(it) {
  // judged by the head (last) token: 昨日, 毎朝, ある日 (日 is 副詞可能), 六時 (時 is 接尾 after a number)
  const toksOf = it.chunk.tokens;
  if (!toksOf.length || it.chunk.quoted) return false;
  const head = toksOf[toksOf.length - 1];
  return head.rawPos.includes('副詞可能') || (head.rawPos[1] === '接尾' && toksOf.some(t => t.pos === 'number'));
}
function relType(it) {
  const p = it.chunk.particles.map(x => x.surface).join('');
  const main = it.chunk.particles.find(x => x.surface !== 'は' && x.surface !== 'も') || it.chunk.particles[0];
  const entry = PARTICLE_ROLE[main.surface];
  return entry ? entry[0] : `${p}-marked`;
}
function relLabel(it) {
  const ps = it.chunk.particles;
  const main = ps.find(x => x.surface !== 'は' && x.surface !== 'も') || ps[0];
  const entry = PARTICLE_ROLE[main.surface];
  let label = entry ? entry[1] : `${main.surface}-marked`;
  // compound particles: には = に (case) + は (topic); にも = に + も (also)
  if (ps.length > 1 && ps.some(p => p !== main && p.surface === 'は')) label += ' · made the topic (は)';
  if (ps.length > 1 && ps.some(p => p !== main && p.surface === 'も')) label += ' · also (も)';
  return label;
}
function evidenceFor(it) { return it.chunk.particles.map(p => ({ startUtf16: p.startUtf16, endUtf16: p.endUtf16 })); }
function labelNoun(ch) {
  if (ch.quoted) return 'a quoted name or phrase';
  if (ch.tokens.some(t => t.pos === 'name')) return 'a name';
  if (ch.tokens.some(t => t.pos === 'na-adjective')) return 'な-adjective — a noun-like quality';
  return 'a thing, person, place or idea';
}
function labelPred(ch) {
  const first = ch.tokens[0];
  if (first.pos === 'i-adjective') return 'い-adjective — a quality that conjugates like a verb';
  const forms = ch.tokens.filter(t => t.pos === 'auxiliary').map(t => t.lemma);
  const bits = [];
  if (forms.includes('た')) bits.push('past');
  if (forms.includes('ます')) bits.push('polite');
  if (forms.includes('ない') || forms.includes('ん')) bits.push('negative');
  if (forms.includes('れる') || forms.includes('られる')) bits.push('passive/potential');
  if (ch.tokens.some(t => t.surface === 'て' || t.surface === 'で') && ch.tokens.some(t => t.lemma === 'いる')) bits.push('ongoing');
  if (forms.includes('う')) bits.push('volitional');
  return bits.length ? `the verb, anchoring it all — ${bits.join(', ')}` : 'the verb, anchoring it all';
}

/**
 * Learner-facing ordering for the Phrases view: top-level noun/predicate/unknown
 * groups (clause groups are relation sources only), in text order.
 * @param {object[]} groups
 */
export function topLevelGroups(groups) {
  const byId = new Map(groups.map(g => [g.groupId, g]));
  const isRenderable = (g) => g.type === 'noun-group' || g.type === 'predicate-group' || g.type === 'unknown-span';
  return groups
    .filter(g => isRenderable(g) && !(g.parentGroupId && byId.get(g.parentGroupId) && byId.get(g.parentGroupId).type !== 'clause-group'))
    .sort((a, b) => a.startUtf16 - b.startUtf16);
}
