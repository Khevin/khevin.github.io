#!/usr/bin/env node
/*
 * score-reader.mjs — scores tokenizer output against the M0 gold corpus.
 *
 *   node scripts/score-reader.mjs            → report
 *   node scripts/score-reader.mjs --gate     → exit 1 if a gate fails
 *
 * Inputs: reader-extension/fixtures/corpus.json (gold) and
 *         reader-extension/fixtures/tokenizer-output.json (from reader-tokenize.mjs)
 *
 * Token units are matched on exact UTF-16 spans. When a gold case lists
 * alternative segmentations for a span, the variant that yields the most
 * matches is used for that span (and its unit count becomes the gold count).
 * Precision = matched / predicted, Recall = matched / gold; both are reported
 * with raw numerators and denominators. POS accuracy is computed on matched
 * units only. Whitespace units are ignored on both sides.
 *
 * Relations: no rule engine exists at M0, so supported-relation precision is
 * undefined (0/0) and coverage is 0/N — reported, never omitted.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(fs.readFileSync(path.join(DIR, 'reader-extension/fixtures/corpus.json'), 'utf8'));
const output = JSON.parse(fs.readFileSync(path.join(DIR, 'reader-extension/fixtures/tokenizer-output.json'), 'utf8'));
const GATE = process.argv.includes('--gate');
const GATES = { tokenPrecision: 0.95, tokenRecall: 0.95, posAccuracy: 0.95 };

const isWs = (s) => /^[\s　]+$/.test(s);

/** Turn surface units into offset units by walking the text (skipping whitespace). */
function layout(text, units, from = 0) {
  const out = [];
  let cursor = from;
  for (const [surface, pos] of units) {
    while (cursor < text.length && isWs(text[cursor])) cursor++;
    if (text.slice(cursor, cursor + surface.length) !== surface) {
      throw new Error(`gold does not rebuild text at ${cursor}: expected "${surface}", saw "${text.slice(cursor, cursor + surface.length)}"`);
    }
    out.push({ s: cursor, e: cursor + surface.length, surface, pos: Array.isArray(pos) ? pos : [pos] });
    cursor += surface.length;
  }
  return { units: out, end: cursor };
}

function scoreCase(c, pred) {
  const gold = layout(c.text, c.gold.units);
  let tail = c.text.slice(gold.end);
  if (tail && !isWs(tail)) throw new Error(`[${c.id}] gold leaves unconsumed text "${tail}"`);
  const predicted = (pred.tokens || []).filter(t => t.pos !== 'whitespace').map(t => ({ s: t.s, e: t.e, surface: t.surface, pos: t.pos }));
  const predKey = new Map(predicted.map(p => [`${p.s}-${p.e}`, p]));

  // Resolve alternatives span by span: choose the variant with the most exact matches.
  let goldUnits = gold.units;
  for (const alt of (c.gold.alt || [])) {
    const start = c.text.indexOf(alt.span);
    if (start < 0) throw new Error(`[${c.id}] alt span "${alt.span}" not in text`);
    const end = start + alt.span.length;
    const inSpan = goldUnits.filter(u => u.s >= start && u.e <= end);
    if (inSpan.length === 0 || inSpan[0].s !== start || inSpan[inSpan.length - 1].e !== end) {
      throw new Error(`[${c.id}] alt span "${alt.span}" does not align with gold unit boundaries`);
    }
    const altUnits = layout(c.text, alt.units, start).units;
    const hits = (us) => us.filter(u => predKey.has(`${u.s}-${u.e}`)).length;
    if (hits(altUnits) > hits(inSpan)) {
      goldUnits = [...goldUnits.filter(u => u.e <= start), ...altUnits, ...goldUnits.filter(u => u.s >= end)];
    }
  }

  const goldKey = new Map(goldUnits.map(u => [`${u.s}-${u.e}`, u]));
  let matched = 0, posOk = 0;
  const posErrors = [], spurious = [], missing = [];
  for (const p of predicted) {
    const g = goldKey.get(`${p.s}-${p.e}`);
    if (!g) { spurious.push(p.surface); continue; }
    matched++;
    if (g.pos.includes(p.pos)) posOk++; else posErrors.push(`${p.surface}:${p.pos}→${g.pos.join('|')}`);
  }
  for (const g of goldUnits) if (!predKey.has(`${g.s}-${g.e}`)) missing.push(g.surface);

  const relGold = Array.isArray(c.gold.relations) ? c.gold.relations.length : null;
  return { id: c.id, group: c.group, predicted: predicted.length, gold: goldUnits.length, matched, posOk, posErrors, spurious, missing, relGold };
}

const byId = new Map(output.cases.map(c => [c.id, c]));
const rows = [];
for (const c of corpus.cases) {
  if (!c.gold) { rows.push({ id: c.id, group: c.group, skipped: 'no gold' }); continue; }
  const pred = byId.get(c.id);
  if (!pred || pred.error) { rows.push({ id: c.id, group: c.group, skipped: pred ? pred.error : 'no output' }); continue; }
  rows.push(scoreCase(c, pred));
}

function agg(list) {
  const t = { cases: list.length, predicted: 0, gold: 0, matched: 0, posOk: 0, relGold: 0, relCases: 0 };
  for (const r of list) { t.predicted += r.predicted; t.gold += r.gold; t.matched += r.matched; t.posOk += r.posOk; if (r.relGold != null) { t.relGold += r.relGold; t.relCases++; } }
  t.precision = t.predicted ? t.matched / t.predicted : 0;
  t.recall = t.gold ? t.matched / t.gold : 0;
  t.posAccuracy = t.matched ? t.posOk / t.matched : 0;
  return t;
}
const pctS = (x) => (100 * x).toFixed(1).padStart(5) + '%';
const scored = rows.filter(r => !r.skipped);
const groups = ['simple', 'site', 'adversarial'];

console.log(`score-reader — ${corpus.annotationStatus}\n`);
console.log('  group        cases  predicted  gold  matched  precision   recall  POS-ok  POS-acc');
for (const g of [...groups, 'ALL']) {
  const list = g === 'ALL' ? scored : scored.filter(r => r.group === g);
  const t = agg(list);
  console.log(`  ${g.padEnd(12)} ${String(t.cases).padStart(5)} ${String(t.predicted).padStart(10)} ${String(t.gold).padStart(5)} ${String(t.matched).padStart(8)}  ${pctS(t.precision)} (${t.matched}/${t.predicted})  ${pctS(t.recall)} (${t.matched}/${t.gold})  ${String(t.posOk).padStart(6)}  ${pctS(t.posAccuracy)} (${t.posOk}/${t.matched})`);
}
const all = agg(scored);
console.log(`\n  gold relations: ${all.relGold} across ${all.relCases} annotated cases (scored below)`);

console.log('\n  per-case errors (spurious ⊕ / missing ⊖ / POS ✗):');
for (const r of rows) {
  if (r.skipped) { console.log(`  [${r.id}] skipped: ${r.skipped}`); continue; }
  if (!r.spurious.length && !r.missing.length && !r.posErrors.length) continue;
  const parts = [];
  if (r.spurious.length) parts.push('⊕ ' + r.spurious.join(' '));
  if (r.missing.length) parts.push('⊖ ' + r.missing.join(' '));
  if (r.posErrors.length) parts.push('✗ ' + r.posErrors.join(' '));
  console.log(`  [${r.id}] ${parts.join('   ')}`);
}

const gateResults = {
  tokenPrecision: all.precision >= GATES.tokenPrecision,
  tokenRecall: all.recall >= GATES.tokenRecall,
  posAccuracy: all.posAccuracy >= GATES.posAccuracy,
};
console.log(`\n  gates (all cases): precision ${gateResults.tokenPrecision ? 'PASS' : 'FAIL'} · recall ${gateResults.tokenRecall ? 'PASS' : 'FAIL'} · POS ${gateResults.posAccuracy ? 'PASS' : 'FAIL'}  (threshold 95%)`);
if (GATE && Object.values(gateResults).some(v => !v)) process.exit(1);

// ── Relations (grammar v1 over the recorded tokenizer output) ──────────────
{
  const { analyze, RULES_VERSION } = await import('../reader-core/grammar.js');
  const { scoreRelations } = await import('../reader-core/relation-score.js');
  const toToken = (t, i) => ({ tokenId: `t${i}`, startUtf16: t.s, endUtf16: t.e, surface: t.surface, lemma: t.lemma, pos: t.pos, rawPos: t.raw.split('/'), conjugatedType: t.type, conjugatedForm: t.form, reading: t.reading ? { value: t.reading, provenance: 'tokenizer' } : null, lexical: t.lexical });
  const results = new Map();
  for (const c of output.cases) if (c.tokens) { const tokens = c.tokens.map(toToken); const r = analyze(c.text, tokens); results.set(c.id, { text: c.text, groups: r.groups, relations: r.relations }); }
  const score = scoreRelations(corpus, results);
  console.log(`\n  relations (rules v${RULES_VERSION}; supported predictions only; neutral に/で/と-marked labels accepted for their roles):`);
  for (const g of score.groups) console.log(`  ${g.name.padEnd(12)} supported-precision ${pctS(g.precision)} (${g.correct}/${g.predicted})  coverage ${pctS(g.coverage)} (${g.covered}/${g.gold})`);
  for (const m of score.misses) console.log(`    ${m}`);
  const simple = score.groups.find(g => g.name === 'simple');
  if (simple) console.log(`  gates (simple subset): precision ${simple.precision >= 0.95 ? 'PASS' : 'FAIL'} (≥95%) · coverage ${simple.coverage >= 0.80 ? 'PASS' : 'FAIL'} (≥80%)`);
  if (GATE && simple && (simple.precision < 0.95 || simple.coverage < 0.80)) process.exit(1);
}
