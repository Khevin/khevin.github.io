#!/usr/bin/env node
/*
 * reader-tokenize.mjs — M0 tokenizer harness for the Nihongo Reader.
 *
 * Loads the IPADIC dictionary through @patdx/kuromoji's Node loader, runs the
 * evaluation corpus (reader-extension/fixtures/corpus.json) through the
 * reader-core adapter, and records:
 *   - per-case tokens (surface, offsets, normalized + raw POS, lemma, reading)
 *   - cold build time over N builds (p50/p95) and warm tokenize latency on a
 *     ~200-character text over M runs (p50/p95)
 *   - heap delta after the dictionary is resident
 *
 *   node scripts/reader-tokenize.mjs                 → summary to stdout
 *   node scripts/reader-tokenize.mjs --write         → also writes
 *       reader-extension/fixtures/tokenizer-output.json
 *   node scripts/reader-tokenize.mjs --text "文"     → tokenize one string
 *
 * Node-side numbers are NOT the extension's numbers; the worker e2e measures
 * those. This harness exists for corpus annotation and fast iteration.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { TokenizerBuilder } from '@patdx/kuromoji';
import NodeDictionaryLoader from '@patdx/kuromoji/node';
import { adaptTokens, ADAPTER_VERSION } from '../reader-core/tokenizer-adapter.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DICT = path.join(DIR, 'node_modules', '@patdx', 'kuromoji', 'dict');
const CORPUS = path.join(DIR, 'reader-extension', 'fixtures', 'corpus.json');
const OUT = path.join(DIR, 'reader-extension', 'fixtures', 'tokenizer-output.json');
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const textArg = args.includes('--text') ? args[args.indexOf('--text') + 1] : null;
const COLD_RUNS = 5;
const WARM_RUNS = 20;

const pkg = JSON.parse(fs.readFileSync(path.join(DIR, 'node_modules', '@patdx', 'kuromoji', 'package.json'), 'utf8'));
const dictBytes = fs.readdirSync(DICT).reduce((a, f) => a + fs.statSync(path.join(DICT, f)).size, 0);

const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)]; };
const ms = (x) => Math.round(x);

async function build() {
  const t0 = performance.now();
  const tokenizer = await new TokenizerBuilder({ loader: new NodeDictionaryLoader({ dic_path: DICT }) }).build();
  return { tokenizer, ms: performance.now() - t0 };
}

// ── Cold builds ─────────────────────────────────────────────────────────────
const heapBefore = process.memoryUsage().heapUsed;
const coldTimes = [];
let tokenizer = null;
for (let i = 0; i < COLD_RUNS; i++) {
  const r = await build();
  coldTimes.push(r.ms);
  tokenizer = r.tokenizer; // keep the last one resident
}
const heapAfter = process.memoryUsage().heapUsed;

// ── Single-text mode ────────────────────────────────────────────────────────
if (textArg) {
  const raw = tokenizer.tokenize(textArg);
  const { tokens } = adaptTokens(textArg, raw);
  for (const t of tokens) console.log(`${String(t.startUtf16).padStart(3)}-${String(t.endUtf16).padEnd(3)} ${t.surface.padEnd(8)} ${t.pos.padEnd(13)} ${t.rawPos.join('/')}  lemma=${t.lemma ?? '-'}  reading=${t.reading?.value ?? '-'}`);
  process.exit(0);
}

// ── Corpus ──────────────────────────────────────────────────────────────────
const corpus = JSON.parse(fs.readFileSync(CORPUS, 'utf8'));
const cases = [];
let failures = 0;
for (const c of corpus.cases) {
  const t0 = performance.now();
  const raw = tokenizer.tokenize(c.text);
  const elapsed = performance.now() - t0;
  let adapted = null, error = null;
  try { adapted = adaptTokens(c.text, raw); } catch (e) { error = e.message; failures++; }
  cases.push({
    id: c.id, group: c.group, text: c.text, ms: +elapsed.toFixed(2), error,
    tokens: adapted ? adapted.tokens.map(t => ({
      s: t.startUtf16, e: t.endUtf16, surface: t.surface, pos: t.pos, raw: t.rawPos.join('/'),
      lemma: t.lemma, reading: t.reading?.value ?? null, form: t.conjugatedForm, type: t.conjugatedType, lexical: t.lexical,
    })) : null,
    gaps: adapted ? adapted.gaps : null,
    unknownCount: raw.filter(r => r.word_type !== 'KNOWN').length,
  });
}

// ── Warm latency on a ~200-char text ───────────────────────────────────────
const warmText = corpus.cases.filter(c => c.group === 'site').map(c => c.text).join('').slice(0, 200);
const warm = [];
for (let i = 0; i < WARM_RUNS; i++) { const t0 = performance.now(); tokenizer.tokenize(warmText); warm.push(performance.now() - t0); }

const summary = {
  generatedAt: new Date().toISOString(),
  engine: { package: pkg.name, version: pkg.version, dictionary: 'IPADIC (bundled, gzipped)', dictBytes, dictMiB: +(dictBytes / 1048576).toFixed(2), adapterVersion: ADAPTER_VERSION },
  host: { node: process.version, platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model?.trim(), cores: os.cpus().length, ramGiB: +(os.totalmem() / 1073741824).toFixed(1) },
  coldBuildMs: { runs: COLD_RUNS, samples: coldTimes.map(ms), p50: ms(pct(coldTimes, 50)), p95: ms(pct(coldTimes, 95)) },
  warmTokenizeMs: { runs: WARM_RUNS, chars: warmText.length, p50: +pct(warm, 50).toFixed(2), p95: +pct(warm, 95).toFixed(2) },
  heapDeltaMiB: +((heapAfter - heapBefore) / 1048576).toFixed(1),
  cases: cases.length,
  reconstructionFailures: failures,
  unknownTokens: cases.reduce((a, c) => a + c.unknownCount, 0),
};

console.log(`reader-tokenize — ${summary.engine.package}@${summary.engine.version}, dict ${summary.engine.dictMiB} MiB gz`);
console.log(`  host: ${summary.host.cpu} ×${summary.host.cores}, node ${summary.host.node}`);
console.log(`  cold build ms: ${summary.coldBuildMs.samples.join(', ')} → p50 ${summary.coldBuildMs.p50}, p95 ${summary.coldBuildMs.p95}`);
console.log(`  warm tokenize ${warmText.length} chars: p50 ${summary.warmTokenizeMs.p50} ms, p95 ${summary.warmTokenizeMs.p95} ms`);
console.log(`  heap delta after ${COLD_RUNS} builds (last resident): ${summary.heapDeltaMiB} MiB`);
console.log(`  cases ${cases.length}, reconstruction failures ${failures}, UNKNOWN tokens ${summary.unknownTokens}\n`);
for (const c of cases) {
  console.log(`[${c.id}] ${c.text}${c.error ? '  ERROR: ' + c.error : ''}`);
  if (c.tokens) console.log('   ' + c.tokens.map(t => `${t.surface}‹${t.pos}${t.lexical === 'unknown' ? '?' : ''}›`).join(' '));
}

if (WRITE) {
  fs.writeFileSync(OUT, JSON.stringify({ summary, cases }, null, 2) + '\n');
  console.log(`\n  wrote ${path.relative(DIR, OUT)}`);
}
