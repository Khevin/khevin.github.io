#!/usr/bin/env node
/*
 * compare.mjs — diff two characterization snapshots produced by characterize.js.
 *
 *   node tests/compare.mjs tests/golden-baseline.json tests/golden-after.json
 *
 * Exit code 0 = identical (refactor preserved behavior).
 * Exit code 1 = differences found (printed per state / per surface).
 *
 * No dependencies — plain Node (built-in fs only).
 */
import fs from 'node:fs';

const [, , beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) {
  console.error('usage: node tests/compare.mjs <before.json> <after.json>');
  process.exit(2);
}

const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
const after = JSON.parse(fs.readFileSync(afterPath, 'utf8'));

const diffs = [];

function eqArr(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function diffTagCounts(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = [];
  for (const k of keys) {
    if ((a[k] || 0) !== (b[k] || 0)) out.push(`${k}: ${a[k] || 0} → ${b[k] || 0}`);
  }
  return out;
}

function firstTextDivergence(a = '', b = '') {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return null;
  return { at: i, before: a.slice(Math.max(0, i - 40), i + 40), after: b.slice(Math.max(0, i - 40), i + 40) };
}

const stateKeys = new Set([...Object.keys(before.states || {}), ...Object.keys(after.states || {})]);

for (const key of stateKeys) {
  const bs = before.states[key];
  const as = after.states[key];
  if (!bs) { diffs.push(`[${key}] only in AFTER`); continue; }
  if (!as) { diffs.push(`[${key}] only in BEFORE (state dropped)`); continue; }
  if (bs.ok !== as.ok) { diffs.push(`[${key}] ok flag: ${bs.ok} → ${as.ok}  (${as.error || bs.error || ''})`); continue; }
  if (!bs.ok) continue; // both errored identically — separate concern

  const surfaceKeys = new Set([...Object.keys(bs.surfaces), ...Object.keys(as.surfaces)]);
  for (const sk of surfaceKeys) {
    const a = bs.surfaces[sk] || {};
    const b = as.surfaces[sk] || {};
    const where = `[${key}] #${sk}`;
    if (!!a.missing !== !!b.missing) { diffs.push(`${where} missing: ${!!a.missing} → ${!!b.missing}`); continue; }
    if (a.missing) continue;

    if (a.len !== b.len) {
      const d = firstTextDivergence(a.text, b.text);
      diffs.push(`${where} text length ${a.len} → ${b.len}` + (d ? `\n    first diff @${d.at}:\n      before …${d.before}…\n      after  …${d.after}…` : ''));
    } else if (a.text !== b.text) {
      const d = firstTextDivergence(a.text, b.text);
      diffs.push(`${where} text changed (same length)` + (d ? `\n    @${d.at}: …${d.before}…  →  …${d.after}…` : ''));
    }
    const tc = diffTagCounts(a.tagCounts, b.tagCounts);
    if (tc.length) diffs.push(`${where} tagCounts: ${tc.join(', ')}`);
    if (!eqArr(a.dataAttrs, b.dataAttrs)) diffs.push(`${where} dataAttrs: [${a.dataAttrs}] → [${b.dataAttrs}]`);
    if (a.controls !== b.controls) diffs.push(`${where} controls: ${a.controls} → ${b.controls}`);
    if (!eqArr(a.imgSrcs, b.imgSrcs)) {
      const removed = a.imgSrcs.filter((s) => !b.imgSrcs.includes(s));
      const added = b.imgSrcs.filter((s) => !a.imgSrcs.includes(s));
      diffs.push(`${where} imgSrcs changed` + (removed.length ? `\n    removed: ${removed.join(', ')}` : '') + (added.length ? `\n    added: ${added.join(', ')}` : ''));
    }
  }
}

if (diffs.length === 0) {
  console.log(`✓ identical — ${stateKeys.size} states match. Behavior preserved.`);
  process.exit(0);
}
console.log(`✗ ${diffs.length} difference(s) found:\n`);
for (const d of diffs) console.log('  • ' + d);
process.exit(1);
