/*
 * reader-core/relation-score.js — scores predicted relations against corpus
 * gold. Shared by grammar.test.mjs and scripts/score-reader.mjs.
 *
 * A gold relation {type, dep, head} (surfaces) is matched by a predicted
 * relation when:
 *   - dep equals the source group's full surface OR its headSurface
 *     (head run + particle: gold writes 前に for 駅の前に), and
 *   - head equals the target group's full surface OR its headSurface, and
 *   - the type matches, or the prediction is a deliberately neutral v1 label
 *     that covers the gold role (に-marked ⊇ destination/time/location/recipient,
 *     で-marked ⊇ location/means, と-marked ⊇ with/and/quote, adverbial ⊇ time for a bare noun).
 * Precision counts only `supported` predictions; coverage counts gold relations
 * matched by a supported prediction. Gold-less cases contribute nothing.
 */

const NEUTRAL_COVERS = {
  'ni-marked': new Set(['destination', 'time', 'location', 'recipient', 'ni-marked']),
  'de-marked': new Set(['location', 'means', 'reason', 'de-marked']),
  'to-marked': new Set(['with', 'and', 'quote', 'to-marked']),
  adverbial: new Set(['time', 'adverbial', 'manner']),
};

function typeMatches(pred, gold) {
  if (pred === gold) return true;
  const set = NEUTRAL_COVERS[pred];
  return !!(set && set.has(gold));
}

/**
 * @param {{cases:object[]}} corpus
 * @param {Map<string,{text:string,groups:object[],relations:object[]}>} results id → analysis
 */
export function scoreRelations(corpus, results) {
  const perGroup = new Map();
  const misses = [];
  const bump = (name, k, n = 1) => { const g = perGroup.get(name) || { name, predicted: 0, correct: 0, gold: 0, covered: 0 }; g[k] += n; perGroup.set(name, g); };

  for (const c of corpus.cases) {
    if (!c.gold || !Array.isArray(c.gold.relations)) continue;
    const r = results.get(c.id);
    if (!r) continue;
    const byId = new Map(r.groups.map(g => [g.groupId, g]));
    // dep: full span or head-run+particle (前に); head: full span, head-run, or core without particle/connector (前, 降った)
    const depSurfaces = (g) => new Set([r.text.slice(g.startUtf16, g.endUtf16), g.headSurface].filter(Boolean));
    const headSurfaces = (g) => new Set([r.text.slice(g.startUtf16, g.endUtf16), g.headSurface, g.coreSurface].filter(Boolean));
    const supported = r.relations.filter(x => x.status === 'supported');
    const goldLeft = [...c.gold.relations];
    const usedPred = new Set();

    for (const gold of c.gold.relations) {
      const hit = supported.find((p, i) => !usedPred.has(i) && depSurfaces(byId.get(p.sourceGroupId)).has(gold.dep) && headSurfaces(byId.get(p.targetGroupId)).has(gold.head) && typeMatches(p.type, gold.type));
      if (hit) { usedPred.add(supported.indexOf(hit)); goldLeft.splice(goldLeft.indexOf(gold), 1); }
    }
    const correct = usedPred.size;
    for (const name of [c.group, 'ALL']) {
      bump(name, 'predicted', supported.length);
      bump(name, 'correct', correct);
      bump(name, 'gold', c.gold.relations.length);
      bump(name, 'covered', correct);
    }
    for (const g of goldLeft) misses.push(`[${c.id}] missed gold ${g.type} ${g.dep} → ${g.head}`);
    supported.forEach((p, i) => { if (!usedPred.has(i)) { const s = byId.get(p.sourceGroupId), t = byId.get(p.targetGroupId); misses.push(`[${c.id}] spurious ${p.type} ${r.text.slice(s.startUtf16, s.endUtf16)} → ${r.text.slice(t.startUtf16, t.endUtf16)}`); } });
  }

  const groups = ['simple', 'site', 'adversarial', 'ALL'].filter(n => perGroup.has(n)).map(n => {
    const g = perGroup.get(n);
    return { ...g, precision: g.predicted ? g.correct / g.predicted : 0, coverage: g.gold ? g.covered / g.gold : 0 };
  });
  return { groups, misses };
}
