/*
 * grammar.test.mjs — runs analyze() over the corpus using the recorded tokenizer
 * output (no dictionary needed) and scores relations against the gold in
 * fixtures/corpus.json. Prints precision/coverage with numerators; asserts the
 * handoff gates on the simple subset (≥ 95% supported precision, ≥ 80% coverage)
 * and structural soundness (contracts + analysisInvariants) on every case.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, topLevelGroups, RULES_VERSION } from './grammar.js';
import { validate, analysisInvariants } from './contracts.js';
import { scoreRelations } from './relation-score.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(fs.readFileSync(path.join(DIR, 'reader-extension/fixtures/corpus.json'), 'utf8'));
const output = JSON.parse(fs.readFileSync(path.join(DIR, 'reader-extension/fixtures/tokenizer-output.json'), 'utf8'));

/** fixture token → adapter Token */
const toToken = (t, i) => ({
  tokenId: `t${i}`, startUtf16: t.s, endUtf16: t.e, surface: t.surface, lemma: t.lemma, pos: t.pos,
  rawPos: t.raw.split('/'), conjugatedType: t.type, conjugatedForm: t.form,
  reading: t.reading ? { value: t.reading, provenance: 'tokenizer' } : null, lexical: t.lexical,
});

const results = new Map();
for (const c of output.cases) {
  const tokens = c.tokens.map(toToken);
  const { groups, relations, warnings } = analyze(c.text, tokens);
  results.set(c.id, { text: c.text, tokens, gaps: c.gaps, groups, relations, warnings });
}

test('every analysis is shape-valid and structurally sound', () => {
  for (const [id, r] of results) {
    const ar = { sentenceKey: 'a'.repeat(64), analysisText: r.text, versions: { tokenizer: 'fixture', dictionary: 'ipadic', rules: RULES_VERSION, adapter: 1 }, tokens: r.tokens.map(t => ({ ...t, rawPos: t.rawPos.length === 4 ? t.rawPos : [...t.rawPos, '*', '*', '*'].slice(0, 4) })), gaps: r.gaps.map(g => ({ startUtf16: g.startUtf16, endUtf16: g.endUtf16, text: g.text })), groups: r.groups, relations: r.relations, warnings: r.warnings };
    const v = validate('AnalysisResult', ar);
    assert.ok(v.ok, `[${id}] ${v.errors.slice(0, 4).join('; ')}`);
    const problems = analysisInvariants(ar);
    assert.deepEqual(problems, [], `[${id}] ${problems.join('; ')}`);
  }
});

test('the handoff example コキリの森で暮らす少年 gets the nested noun-modification analysis', () => {
  const r = results.get('n04');
  const byId = new Map(r.groups.map(g => [g.groupId, g]));
  const full = (g) => r.text.slice(g.startUtf16, g.endUtf16);
  const rels = r.relations.map(x => [x.type, full(byId.get(x.sourceGroupId)), byId.get(x.targetGroupId).coreSurface || full(byId.get(x.targetGroupId)), x.status]);
  assert.deepEqual(rels.find(x => x[0] === 'genitive'), ['genitive', 'コキリの', '森', 'supported']);
  assert.deepEqual(rels.find(x => x[0] === 'de-marked'), ['de-marked', 'コキリの森で', '暮らす', 'supported']);
  assert.deepEqual(rels.find(x => x[0] === 'modifier'), ['modifier', 'コキリの森で暮らす', '少年', 'supported']);
  assert.equal(r.groups.filter(g => g.anchor).length, 0, 'no main-clause predicate is invented for a noun phrase');
  assert.deepEqual(topLevelGroups(r.groups).map(g => r.text.slice(g.startUtf16, g.endUtf16)), ['コキリの森で', '暮らす', '少年']);
});

test('a noun-phrase sentence yields no anchor and no forced relation', () => {
  const r = results.get('n06');
  assert.equal(r.relations.filter(x => x.status === 'supported').map(x => x.type).join(','), 'genitive');
  assert.ok(r.warnings.some(w => /no predicate/.test(w)));
});

test('relation gates on the simple subset (≥95% precision, ≥80% coverage) and honest totals', () => {
  const score = scoreRelations(corpus, results);
  const line = (g) => `${g.name.padEnd(12)} supported-precision ${pct(g.precision)} (${g.correct}/${g.predicted})  coverage ${pct(g.coverage)} (${g.covered}/${g.gold})`;
  console.log('\n  relation scores (rules v' + RULES_VERSION + '):');
  for (const g of score.groups) console.log('  ' + line(g));
  for (const m of score.misses.slice(0, 40)) console.log(`    ${m}`);
  const simple = score.groups.find(g => g.name === 'simple');
  assert.ok(simple.precision >= 0.95, `simple precision ${simple.correct}/${simple.predicted}`);
  assert.ok(simple.coverage >= 0.80, `simple coverage ${simple.covered}/${simple.gold}`);
  const all = score.groups.find(g => g.name === 'ALL');
  assert.ok(all.precision >= 0.95, `all-annotated precision ${all.correct}/${all.predicted}`);
});

const pct = (x) => (100 * x).toFixed(1) + '%';
