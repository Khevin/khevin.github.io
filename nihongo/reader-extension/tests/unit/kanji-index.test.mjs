import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGlossary, glossFor } from '../../../reader-core/library.js';

const NIHONGO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(NIHONGO, p), 'utf8'));

test('the everyday-kanji file covers the jōyō set and keeps its licence with it', () => {
  const idx = read('kanji-index.json');
  const n = Object.keys(idx.kanji).length;
  assert.ok(n >= 2136, `expected the full jōyō set, got ${n}`);
  assert.match(idx._license, /KANJIDIC2/);
  assert.match(idx._license, /CC BY-SA/, 'attribution must travel with the data');

  const mori = idx.kanji['森'];
  assert.deepEqual(mori.on, ['シン']);
  assert.deepEqual(mori.kun, ['もり']);
  assert.match(mori.meaning, /forest/);
  assert.equal(mori.grade, 1);
  assert.ok(mori.strokes === 12 && mori.freq > 0);

  for (const g of ['誰', '姫', '剣', '進', '化', '王']) assert.ok(idx.kanji[g], `${g} should be present`);
  const over = Object.entries(idx.kanji).filter(([, e]) => (e.on || []).length > 3 || (e.kun || []).length > 3);
  assert.equal(over.length, 0, 'readings are capped so the file stays small');
});

test('the games set is curated, tagged, and says where each word turns up', () => {
  const pop = read('pop-culture.json');
  assert.ok(pop.entries.length >= 60);
  const tags = new Set(pop.entries.flatMap(e => e.tags || []));
  for (const t of ['zelda', 'mario', 'pokemon', 'nintendo']) assert.ok(tags.has(t), `missing the ${t} tag`);
  for (const e of pop.entries) {
    assert.ok(e.word && e.meaning && Array.isArray(e.tags) && e.tags.length, `incomplete entry: ${e.word}`);
    assert.ok(e.meaning.length <= 60, `meaning too long on ${e.word}`);
  }
  assert.equal(pop.entries.filter(e => e.word === '任天堂')[0].meaning, 'Nintendo');
  const words = pop.entries.map(e => e.word);
  assert.equal(words.length, new Set(words).size, 'no duplicate entries');
});

test('the built glossary answers a kanji and a game word without a translation API', () => {
  const bytes = fs.readFileSync(path.join(NIHONGO, 'reader-library', 'glossary.json'));
  const { glossary, errors } = parseGlossary(bytes);
  assert.deepEqual(errors, []);
  assert.ok(Object.keys(glossary.kanji).length >= 2136);

  const dare = glossFor(null, glossary, '誰');
  assert.match(dare.meaning, /who/);
  assert.equal(dare.source, 'kanjidic');
  assert.deepEqual(dare.kun, ['だれ', 'たれ', 'た'], 'kun readings survive the package round trip');
  assert.deepEqual(dare.on, ['スイ']);

  const zukan = glossFor(null, glossary, '図鑑');
  assert.match(zukan.meaning, /illustrated/);
  assert.equal(zukan.source, 'pop-culture');
  assert.match(zukan.seen, /Pokédex/);

  const own = glossFor(null, glossary, '王国');
  assert.ok(own.meaning, 'the learner’s own material still resolves');
});
