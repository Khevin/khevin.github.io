#!/usr/bin/env node
/*
 * build-kanji-index.mjs — the everyday kanji, with their main readings and
 * meanings, so the reader can answer "what is this character" from its own
 * files instead of asking Google.
 *
 * Source: KANJIDIC2 by the Electronic Dictionary Research and Development
 * Group (EDRDG), used under CC BY-SA 4.0. The attribution travels with the
 * data in the generated file's `_license` field; keep it there.
 *   https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
 *
 * Selection: every jōyō character (the 2,136 taught in Japanese schools, grades
 * 1–6 and 8) plus any other character inside the top 2,500 of the Mainichi
 * Shimbun frequency list, which catches common non-jōyō characters like 誰
 * and 頃 that turn up constantly in games and on the web.
 *
 * Output: nihongo/kanji-index.json, committed, one compact record per kanji.
 *   "森": { "on": ["シン"], "kun": ["もり"], "meaning": "forest, woods",
 *           "strokes": 12, "grade": 1, "jlpt": 2, "freq": 609 }
 *
 *   node scripts/build-kanji-index.mjs [--freq 2500]
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'kanji-index.json');
const CACHE = path.join(ROOT, '.cache', 'kanjidic2.xml.gz');
const SOURCE = 'https://www.edrdg.org/kanjidic/kanjidic2.xml.gz';
const FREQ_MAX = Number((process.argv.find(a => a.startsWith('--freq'))?.split('=')[1]) || process.argv[process.argv.indexOf('--freq') + 1] || 2500);

// Readings and meanings are capped: this file answers "what does it mean and
// how is it usually read", not "everything known about it". The long tail is
// what makes a kanji file megabytes instead of a few hundred kilobytes.
const MAX_ON = 3, MAX_KUN = 3, MAX_MEANINGS = 4;

async function source() {
  if (fs.existsSync(CACHE)) return fs.readFileSync(CACHE);
  process.stdout.write(`fetching ${SOURCE} …\n`);
  const res = await fetch(SOURCE, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`KANJIDIC2 answered ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, buf);          // cached, never committed (.gitignore)
  return buf;
}

const tagAll = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}(\\s[^>]*)?>([^<]*)</${tag}>`, 'g'))].map(m => ({ attrs: m[1] || '', value: m[2] }));
const tagOne = (xml, tag) => { const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`)); return m ? m[1] : null; };

const xml = zlib.gunzipSync(await source()).toString('utf8');
const blocks = xml.split('<character>').slice(1);
const index = {};
let jouyou = 0, extra = 0;

for (const raw of blocks) {
  const block = raw.split('</character>')[0];
  const literal = tagOne(block, 'literal');
  if (!literal || [...literal].length !== 1) continue;

  const grade = Number(tagOne(block, 'grade')) || null;
  const freq = Number(tagOne(block, 'freq')) || null;
  const isJouyou = grade !== null && grade <= 8;          // 9 and 10 are name-only kanji
  const isCommon = freq !== null && freq <= FREQ_MAX;
  if (!isJouyou && !isCommon) continue;

  // Only the first rmgroup: later groups are rare readings of split senses.
  const rm = block.split('<rmgroup>')[1]?.split('</rmgroup>')[0] || '';
  const readings = tagAll(rm, 'reading');
  const on = readings.filter(r => /ja_on/.test(r.attrs)).map(r => r.value).slice(0, MAX_ON);
  const kun = readings.filter(r => /ja_kun/.test(r.attrs)).map(r => r.value).slice(0, MAX_KUN);
  // A meaning with an m_lang attribute is a translation into another language.
  const meanings = tagAll(rm, 'meaning').filter(m => !/m_lang/.test(m.attrs)).map(m => m.value.replace(/&quot;/g, '"').replace(/&amp;/g, '&')).slice(0, MAX_MEANINGS);
  if (!meanings.length && !on.length && !kun.length) continue;

  index[literal] = {
    on, kun,
    meaning: meanings.join(', '),
    strokes: Number(tagOne(block, 'stroke_count')) || null,
    grade,
    jlpt: Number(tagOne(block, 'jlpt')) || null,
    freq,
  };
  isJouyou ? jouyou++ : extra++;
}

const out = {
  _license: 'KANJIDIC2 © Electronic Dictionary Research and Development Group, used under CC BY-SA 4.0 — https://www.edrdg.org/wiki/index.php/KANJIDIC_Project',
  _generated: new Date().toISOString().slice(0, 10),
  _selection: `jōyō (grades 1-8) plus any kanji with a newspaper frequency rank of ${FREQ_MAX} or better`,
  kanji: index,
};
const json = JSON.stringify(out);
fs.writeFileSync(OUT, json + '\n');

const gz = zlib.gzipSync(Buffer.from(json)).length;
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`kanji-index.json  ${Object.keys(index).length} kanji (${jouyou} jōyō + ${extra} common non-jōyō)`);
console.log(`  raw ${kb(json.length)} · gzipped ${kb(gz)}`);
