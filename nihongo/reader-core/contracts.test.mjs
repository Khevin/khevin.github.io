import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA_VERSION, SCHEMAS, validate, assertValid, analysisInvariants } from './contracts.js';

const HEX = 'a'.repeat(64);
const NOW = '2026-09-08T12:00:00.000Z';

const source = { url: 'https://www.nintendo.com/jp/games/switch2/aa9ja/triforce/index.html', domain: 'www.nintendo.com', title: 'トライフォース', capturedAt: NOW };

test('schema version is 1 and every schema is an object schema', () => {
  assert.equal(SCHEMA_VERSION, 1);
  for (const [name, s] of Object.entries(SCHEMAS)) assert.equal(s.kind, 'object', name);
});

test('EncounterEvent: valid record passes; bad timestamp, bad hash, unknown field fail with paths', () => {
  const ev = { eventId: HEX, installationId: 'inst-1', sessionId: 'sess-1', sentenceKey: HEX, kanjiKey: '森', occurredAt: NOW, actionId: 'act-1', source, glyph: '森', word: '森' };
  assert.deepEqual(validate('EncounterEvent', ev), { ok: true, errors: [] });
  const bad = validate('EncounterEvent', { ...ev, occurredAt: '2026-09-08 12:00', eventId: 'xyz', extra: 1 });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some(e => e.startsWith('EncounterEvent.occurredAt')));
  assert.ok(bad.errors.some(e => e.startsWith('EncounterEvent.eventId')));
  assert.ok(bad.errors.some(e => e === 'EncounterEvent.extra: unknown field'));
  assert.throws(() => assertValid('EncounterEvent', { ...ev, kanjiKey: '' }), /EncounterEvent invalid/);
});

test('KanjiState separates familiarity from card availability and rejects unknown labels', () => {
  const st = { kanjiKey: '森', familiarity: 'unfamiliar', wantCard: true, revision: 3, installationId: 'inst-1', updatedAt: NOW, preferredCard: { libraryId: 'lib-1', cardKey: 'nature/forest' } };
  assert.equal(validate('KanjiState', st).ok, true);
  assert.equal(validate('KanjiState', { ...st, familiarity: 'known' }).ok, false);
  assert.equal(validate('KanjiState', { ...st, preferredCard: null }).ok, true);
});

test('CardRecord keeps the classId/cardId key scheme and nullable glyph for radicals', () => {
  const card = { cardKey: 'basic/water', classId: 'basic', cardIdOrGlyph: 'water', order: 3, kind: 'kanji', glyph: '水', readings: { kun: 'みず', on: 'スイ' }, keyword: 'water', image: { assetHash: HEX, variant: 1 } };
  assert.equal(validate('CardRecord', card).ok, true);
  const radical = { ...card, cardKey: 'people/r-person', cardIdOrGlyph: 'r-person', kind: 'radical', glyph: null, readings: { kun: null, on: null }, keyword: null, image: null };
  assert.equal(validate('CardRecord', radical).ok, true);
});

test('ImageRecord framing bounds and asset path pattern', () => {
  const img = { assetHash: HEX, mime: 'image/webp', bytes: 1234, width: 600, height: 600, path: `assets/${HEX}.webp`, sourceKind: 'shipped', slotId: 'flash-water', imageKey: 'kanji/水', variant: 1, framing: { fit: 'contain', s: 1, x: 0, y: 0 } };
  assert.equal(validate('ImageRecord', img).ok, true);
  assert.equal(validate('ImageRecord', { ...img, framing: { ...img.framing, s: 6 } }).ok, false);
  assert.equal(validate('ImageRecord', { ...img, path: '../evil.webp' }).ok, false);
});

test('LibraryManifest rejects a schemaVersion above the one we understand', () => {
  const m = { schemaVersion: 1, libraryId: 'lib-1', snapshotId: 'snap-1', revision: 1, exportedAt: NOW, sourceAppUrl: 'https://khevin.com/nihongo/app.html', exporterVersion: '0.1.0', deckIds: ['basic'], files: { cards: 'cards.json', lessons: 'lessons.json' }, assets: [], counts: { cards: 20, images: 20, missingImages: 0 } };
  assert.equal(validate('LibraryManifest', m).ok, true);
  assert.equal(validate('LibraryManifest', { ...m, schemaVersion: 2 }).ok, false);
});

test('MessageEnvelope only accepts the protocol types', () => {
  assert.equal(validate('MessageEnvelope', { protocolVersion: 1, requestId: 'r1', type: 'TOKENIZE', payload: { text: 'x' } }).ok, true);
  assert.equal(validate('MessageEnvelope', { protocolVersion: 1, requestId: 'r1', type: 'DROP_TABLES', payload: {} }).ok, false);
});

test('analysisInvariants: reconstruction, child spans, and supported-relation cycles', () => {
  const text = 'コキリの森で暮らす少年。';
  const tok = (id, s, e, surface, pos) => ({ tokenId: id, startUtf16: s, endUtf16: e, surface, lemma: surface, pos, rawPos: ['*', '*', '*', '*'], conjugatedType: null, conjugatedForm: null, reading: null, lexical: 'known' });
  const tokens = [tok('t0', 0, 3, 'コキリ', 'name'), tok('t1', 3, 4, 'の', 'particle'), tok('t2', 4, 5, '森', 'noun'), tok('t3', 5, 6, 'で', 'particle'), tok('t4', 6, 9, '暮らす', 'verb'), tok('t5', 9, 11, '少年', 'noun'), tok('t6', 11, 12, '。', 'punctuation')];
  const groups = [
    { groupId: 'g0', type: 'noun-group', children: ['t0', 't1'], startUtf16: 0, endUtf16: 4, headTokenId: 't0', status: 'supported' },
    { groupId: 'g1', type: 'noun-group', children: ['t2', 't3'], startUtf16: 4, endUtf16: 6, headTokenId: 't2', status: 'supported' },
    { groupId: 'g2', type: 'predicate-group', children: ['t4'], startUtf16: 6, endUtf16: 9, headTokenId: 't4', status: 'supported' },
    { groupId: 'g3', type: 'noun-group', children: ['t5'], startUtf16: 9, endUtf16: 11, headTokenId: 't5', status: 'supported' },
  ];
  const rel = (id, s, t, type) => ({ relationId: id, sourceGroupId: s, targetGroupId: t, type, status: 'supported', ruleId: 'rule-x', evidence: [{ startUtf16: 0, endUtf16: 1 }] });
  const result = { sentenceKey: HEX, analysisText: text, versions: { tokenizer: '@patdx/kuromoji@1.0.4', dictionary: 'ipadic', rules: '0', adapter: 1 }, tokens, gaps: [], groups, relations: [rel('r0', 'g0', 'g1', 'genitive'), rel('r1', 'g1', 'g2', 'location'), rel('r2', 'g2', 'g3', 'modifier')], warnings: [] };
  assert.equal(validate('AnalysisResult', result).ok, true, validate('AnalysisResult', result).errors.join('; '));
  assert.deepEqual(analysisInvariants(result), []);

  const cyclic = { ...result, relations: [...result.relations, rel('r3', 'g3', 'g0', 'bogus')] };
  assert.ok(analysisInvariants(cyclic).includes('supported relations form a cycle'));

  const outside = { ...result, groups: [{ ...groups[0], endUtf16: 3 }, ...groups.slice(1)] };
  assert.ok(analysisInvariants(outside).some(p => p.includes('outside span')));

  const holed = { ...result, tokens: tokens.filter(t => t.tokenId !== 't3') };
  assert.ok(analysisInvariants(holed).some(p => p.includes('gap or overlap')));
});
