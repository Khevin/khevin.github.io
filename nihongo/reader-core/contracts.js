/*
 * reader-core/contracts.js — schema v1 for every record that crosses a
 * boundary (message envelope, IndexedDB, export file). Runtime-validated with
 * a tiny declarative DSL so the panel, worker, service worker, and Nihongo
 * import code all reject the same malformed data the same way.
 *
 * Rules (handoff §9): JSON-safe values only at boundaries, UTC ISO timestamps,
 * stable natural keys, no numeric confidence percentages.
 */

export const SCHEMA_VERSION = 1;

// ── DSL ─────────────────────────────────────────────────────────────────────
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const HEX64 = /^[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9_\-:./]{1,200}$/;

const T = {
  str: (o = {}) => ({ kind: 'string', ...o }),
  int: (o = {}) => ({ kind: 'integer', ...o }),
  num: (o = {}) => ({ kind: 'number', ...o }),
  bool: () => ({ kind: 'boolean' }),
  iso: () => ({ kind: 'string', pattern: ISO_UTC, label: 'UTC ISO timestamp' }),
  hex64: () => ({ kind: 'string', pattern: HEX64, label: 'sha256 hex' }),
  id: () => ({ kind: 'string', pattern: ID, label: 'identifier' }),
  enum: (values) => ({ kind: 'enum', values }),
  arr: (item, o = {}) => ({ kind: 'array', item, ...o }),
  obj: (fields) => ({ kind: 'object', fields }),
  ref: (name) => ({ kind: 'ref', name }),
  opt: (t) => ({ ...t, optional: true }),
  nullable: (t) => ({ ...t, nullable: true }),
};

export const FAMILIARITY = ['unassessed', 'unfamiliar', 'learning', 'familiar'];
export const CARD_AVAILABILITY = ['standalone', 'compound-only', 'none'];
export const CARD_KIND = ['kanji', 'word', 'radical', 'reference'];
export const CAPTURE_KIND = ['selection', 'selection-text', 'image-alt', 'paste'];
export const RELATION_STATUS = ['supported', 'uncertain'];
export const GROUP_STATUS = ['supported', 'uncertain', 'unavailable'];
export const GROUP_TYPE = ['noun-group', 'predicate-group', 'modifier-group', 'clause-group', 'unknown-span'];
export const LEXICAL = ['known', 'unknown'];
export const IMAGE_FIT = ['cover', 'contain', 'fill', 'natural'];

// ── Schemas ─────────────────────────────────────────────────────────────────
export const SCHEMAS = {
  CardRef: T.obj({ libraryId: T.id(), cardKey: T.id() }),

  SourceRef: T.obj({
    url: T.nullable(T.str({ max: 2048 })),
    domain: T.str({ max: 253 }),
    title: T.nullable(T.str({ max: 500 })),
    capturedAt: T.iso(),
    quote: T.opt(T.obj({ exact: T.str({ max: 1000 }), prefix: T.opt(T.str({ max: 64 })), suffix: T.opt(T.str({ max: 64 })) })),
  }),

  SentenceRecord: T.obj({
    sentenceKey: T.hex64(),
    normalizationVersion: T.int({ min: 1 }),
    displayText: T.str({ min: 1, max: 5000 }),
    fingerprintText: T.str({ min: 1, max: 5000 }),
    captureKind: T.enum(CAPTURE_KIND),
    fragment: T.bool(),
    rubySpans: T.opt(T.arr(T.obj({ start: T.int({ min: 0 }), end: T.int({ min: 1 }), reading: T.str({ max: 100 }) }))),
  }),

  Token: T.obj({
    tokenId: T.id(),
    startUtf16: T.int({ min: 0 }),
    endUtf16: T.int({ min: 1 }),
    surface: T.str({ min: 1 }),
    lemma: T.nullable(T.str()),
    pos: T.str(),
    rawPos: T.arr(T.str(), { length: 4 }),
    conjugatedType: T.nullable(T.str()),
    conjugatedForm: T.nullable(T.str()),
    reading: T.nullable(T.obj({ value: T.str(), provenance: T.enum(['ruby', 'tokenizer', 'library']) })),
    pronunciation: T.opt(T.nullable(T.str())),
    lexical: T.enum(LEXICAL),
    positionSource: T.opt(T.str()),
  }),

  Group: T.obj({
    groupId: T.id(),
    type: T.enum(GROUP_TYPE),
    children: T.arr(T.id(), { min: 1 }),          // tokenIds or groupIds
    startUtf16: T.int({ min: 0 }),
    endUtf16: T.int({ min: 1 }),
    headTokenId: T.nullable(T.id()),
    status: T.enum(GROUP_STATUS),
    parentGroupId: T.opt(T.nullable(T.id())),
    particleTokenIds: T.opt(T.arr(T.id())),     // case/topic particle(s) attached to this group
    connectorTokenId: T.opt(T.nullable(T.id())), // clause connector (て/ので/ば…) closing a predicate
    headSurface: T.opt(T.str()),                 // head run + particle, e.g. 前に for 駅の前に
    coreSurface: T.opt(T.str()),                 // own tokens without particles/connector, e.g. 前, 降った
    label: T.opt(T.str()),                       // learner-facing role text
    anchor: T.opt(T.bool()),                     // main predicate of the sentence
  }),

  Relation: T.obj({
    relationId: T.id(),
    sourceGroupId: T.id(),
    targetGroupId: T.id(),
    type: T.str(),
    status: T.enum(RELATION_STATUS),
    ruleId: T.id(),
    evidence: T.arr(T.obj({ startUtf16: T.int({ min: 0 }), endUtf16: T.int({ min: 1 }) })),
    alternatives: T.opt(T.arr(T.obj({ targetGroupId: T.id(), type: T.str() }))),
    label: T.opt(T.str()),
  }),

  AnalysisResult: T.obj({
    sentenceKey: T.hex64(),
    analysisText: T.str({ min: 1 }),
    versions: T.obj({ tokenizer: T.str(), dictionary: T.str(), rules: T.str(), adapter: T.int({ min: 1 }) }),
    tokens: T.arr(T.ref('Token')),
    gaps: T.arr(T.obj({ startUtf16: T.int({ min: 0 }), endUtf16: T.int({ min: 1 }), text: T.str() })),
    groups: T.arr(T.ref('Group')),
    relations: T.arr(T.ref('Relation')),
    warnings: T.arr(T.str()),
  }),

  SessionRecord: T.obj({
    installationId: T.id(),
    sessionId: T.id(),
    browserRunId: T.id(),
    startedAt: T.iso(),
    lastStudyAt: T.iso(),
    endedAt: T.opt(T.nullable(T.iso())),
  }),

  EncounterEvent: T.obj({
    eventId: T.hex64(),
    installationId: T.id(),
    sessionId: T.id(),
    sentenceKey: T.hex64(),
    kanjiKey: T.str({ min: 1, max: 2 }),
    occurredAt: T.iso(),
    actionId: T.id(),
    source: T.ref('SourceRef'),
    glyph: T.str({ min: 1, max: 4 }),
    word: T.opt(T.nullable(T.str({ max: 100 }))),
  }),

  EventVoid: T.obj({
    eventId: T.hex64(),
    voidedAt: T.iso(),
    installationId: T.id(),
    reason: T.enum(['undo', 'delete', 'reset']),
  }),

  KanjiState: T.obj({
    kanjiKey: T.str({ min: 1, max: 2 }),
    familiarity: T.enum(FAMILIARITY),
    wantCard: T.bool(),
    note: T.opt(T.nullable(T.str({ max: 2000 }))),
    preferredCard: T.opt(T.nullable(T.ref('CardRef'))),
    revision: T.int({ min: 1 }),
    installationId: T.id(),
    updatedAt: T.iso(),
  }),

  KanjiAggregate: T.obj({
    kanjiKey: T.str({ min: 1, max: 2 }),
    count: T.int({ min: 0 }),
    firstAt: T.nullable(T.iso()),
    lastAt: T.nullable(T.iso()),
    sourceCount: T.int({ min: 0 }),
    sentenceCount: T.int({ min: 0 }),
  }),

  CardRecord: T.obj({
    cardKey: T.id(),                 // `${classId}/${cardId}` — existing SRS scheme
    classId: T.id(),
    cardIdOrGlyph: T.str({ min: 1 }),
    order: T.int({ min: 0 }),
    kind: T.enum(CARD_KIND),
    glyph: T.nullable(T.str({ min: 1, max: 20 })),
    readings: T.obj({ kun: T.nullable(T.str()), on: T.nullable(T.str()) }),
    keyword: T.nullable(T.str()),
    story: T.opt(T.nullable(T.str())),
    heisigFrame: T.opt(T.nullable(T.int({ min: 1 }))),
    examples: T.opt(T.arr(T.obj({ word: T.str(), reading: T.opt(T.str()), meaning: T.opt(T.str()) }))),
    image: T.opt(T.nullable(T.obj({ assetHash: T.hex64(), variant: T.int({ min: 1 }) }))),
    reviewSummary: T.opt(T.nullable(T.obj({ state: T.str(), due: T.nullable(T.iso()), reps: T.int({ min: 0 }), asOf: T.iso() }))),
  }),

  ImageRecord: T.obj({
    assetHash: T.hex64(),
    mime: T.enum(['image/webp', 'image/png', 'image/jpeg']),
    bytes: T.int({ min: 1 }),
    width: T.int({ min: 1 }),
    height: T.int({ min: 1 }),
    path: T.str({ pattern: /^assets\/[0-9a-f]{64}\.(webp|png|jpg)$/ }),
    sourcePath: T.opt(T.str({ max: 500 })),     // site-relative original file (images/kanji/水.webp) for remote sync
    sourceKind: T.enum(['custom', 'shipped', 'shipped-variant', 'authored']),
    slotId: T.nullable(T.str()),
    imageKey: T.nullable(T.str()),
    variant: T.int({ min: 1 }),
    framing: T.obj({ fit: T.enum(IMAGE_FIT), s: T.num({ min: 1, max: 5 }), x: T.num(), y: T.num() }),
  }),

  LibraryManifest: T.obj({
    schemaVersion: T.int({ min: 1, max: SCHEMA_VERSION }),
    libraryId: T.id(),
    snapshotId: T.id(),
    revision: T.int({ min: 1 }),
    contentHash: T.opt(T.hex64()),              // content-addressed identity; snapshotId derives from it
    exportedAt: T.iso(),
    sourceAppUrl: T.str({ max: 2048 }),
    exporterVersion: T.str(),
    deckIds: T.arr(T.id()),
    files: T.obj({ cards: T.str(), lessons: T.str(), glossary: T.opt(T.str()) }),
    assets: T.arr(T.ref('ImageRecord')),
    counts: T.obj({ cards: T.int({ min: 0 }), images: T.int({ min: 0 }), missingImages: T.int({ min: 0 }) }),
  }),

  MessageEnvelope: T.obj({
    protocolVersion: T.int({ min: 1 }),
    requestId: T.id(),
    type: T.enum(['CAPTURE_REQUEST', 'CAPTURE_READY', 'STUDY_SENTENCE', 'STUDY_COMMITTED', 'GET_KANJI', 'VOID_ACTION', 'SESSION_END', 'TOKENIZE', 'TOKENIZE_RESULT', 'ANALYZE', 'ANALYZE_RESULT', 'ANALYZE_SENTENCE', 'ANALYZE_TEXT', 'INIT', 'RELEASE', 'WORKER_READY', 'WORKER_ERROR', 'STUDY_REQUEST', 'SENTENCE_SHOWN', 'OPEN_DETAILS', 'STUDY_SELECTION', 'SPEAK', 'STOP_SPEAK', 'PING']),
    target: T.opt(T.enum(['offscreen'])),
    payload: T.obj({}),
  }),
};

// ── Validator ───────────────────────────────────────────────────────────────

/**
 * Validate `value` against a named schema. Returns `{ ok, errors }` where each
 * error is `"path: message"`. Never throws on bad data (only on unknown schema).
 * @param {keyof typeof SCHEMAS} name
 * @param {unknown} value
 */
export function validate(name, value) {
  const schema = SCHEMAS[name];
  if (!schema) throw new Error(`unknown schema "${name}"`);
  const errors = [];
  check(schema, value, name, errors);
  return { ok: errors.length === 0, errors };
}

/** Throwing variant for internal boundaries. */
export function assertValid(name, value) {
  const r = validate(name, value);
  if (!r.ok) throw new TypeError(`${name} invalid: ${r.errors.slice(0, 5).join('; ')}${r.errors.length > 5 ? ` (+${r.errors.length - 5})` : ''}`);
  return value;
}

function check(t, v, path, errors) {
  if (v === undefined) { if (!t.optional) errors.push(`${path}: required`); return; }
  if (v === null) { if (!t.nullable) errors.push(`${path}: must not be null`); return; }
  switch (t.kind) {
    case 'string':
      if (typeof v !== 'string') return void errors.push(`${path}: expected string`);
      if (t.min != null && v.length < t.min) errors.push(`${path}: shorter than ${t.min}`);
      if (t.max != null && v.length > t.max) errors.push(`${path}: longer than ${t.max}`);
      if (t.pattern && !t.pattern.test(v)) errors.push(`${path}: not a valid ${t.label || 'value'}`);
      return;
    case 'integer':
      if (!Number.isInteger(v)) return void errors.push(`${path}: expected integer`);
      if (t.min != null && v < t.min) errors.push(`${path}: below ${t.min}`);
      if (t.max != null && v > t.max) errors.push(`${path}: above ${t.max}`);
      return;
    case 'number':
      if (typeof v !== 'number' || !Number.isFinite(v)) return void errors.push(`${path}: expected finite number`);
      if (t.min != null && v < t.min) errors.push(`${path}: below ${t.min}`);
      if (t.max != null && v > t.max) errors.push(`${path}: above ${t.max}`);
      return;
    case 'boolean':
      if (typeof v !== 'boolean') errors.push(`${path}: expected boolean`);
      return;
    case 'enum':
      if (!t.values.includes(v)) errors.push(`${path}: expected one of ${t.values.join('|')}`);
      return;
    case 'array':
      if (!Array.isArray(v)) return void errors.push(`${path}: expected array`);
      if (t.length != null && v.length !== t.length) errors.push(`${path}: expected length ${t.length}`);
      if (t.min != null && v.length < t.min) errors.push(`${path}: fewer than ${t.min} items`);
      v.forEach((item, i) => check(t.item, item, `${path}[${i}]`, errors));
      return;
    case 'object':
      if (typeof v !== 'object' || Array.isArray(v)) return void errors.push(`${path}: expected object`);
      for (const [k, ft] of Object.entries(t.fields)) check(ft, v[k], `${path}.${k}`, errors);
      for (const k of Object.keys(v)) if (!(k in t.fields) && Object.keys(t.fields).length) errors.push(`${path}.${k}: unknown field`);
      return;
    case 'ref':
      return check(SCHEMAS[t.name], v, path, errors);
    default:
      errors.push(`${path}: unknown schema kind ${t.kind}`);
  }
}

// ── Span invariants beyond field shapes ─────────────────────────────────────

/**
 * Structural checks for an AnalysisResult that the field validator cannot
 * express: token/gap reconstruction, group spans containing children,
 * relations referencing known groups, and no cycles among supported relations.
 * @param {object} r a shape-valid AnalysisResult
 * @returns {string[]} problems (empty when sound)
 */
export function analysisInvariants(r) {
  const problems = [];
  const text = r.analysisText;
  const pieces = [...r.tokens.map(t => [t.startUtf16, t.endUtf16, t.surface]), ...r.gaps.map(g => [g.startUtf16, g.endUtf16, g.text])].sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  for (const [s, e, txt] of pieces) {
    if (s !== cursor) problems.push(`coverage gap or overlap at ${cursor}`);
    if (text.slice(s, e) !== txt) problems.push(`slice mismatch at ${s}`);
    cursor = e;
  }
  if (cursor !== text.length) problems.push('tokens+gaps do not cover the text');

  const tokenById = new Map(r.tokens.map(t => [t.tokenId, t]));
  const groupById = new Map(r.groups.map(g => [g.groupId, g]));
  for (const g of r.groups) {
    for (const c of g.children) {
      const node = tokenById.get(c) || groupById.get(c);
      if (!node) { problems.push(`group ${g.groupId}: unknown child ${c}`); continue; }
      if (node.startUtf16 < g.startUtf16 || node.endUtf16 > g.endUtf16) problems.push(`group ${g.groupId}: child ${c} outside span`);
    }
    if (g.headTokenId && !tokenById.has(g.headTokenId)) problems.push(`group ${g.groupId}: unknown head ${g.headTokenId}`);
  }
  const adj = new Map();
  for (const rel of r.relations) {
    if (!groupById.has(rel.sourceGroupId) || !groupById.has(rel.targetGroupId)) problems.push(`relation ${rel.relationId}: unknown group`);
    if (rel.status === 'supported') adj.set(rel.sourceGroupId, [...(adj.get(rel.sourceGroupId) || []), rel.targetGroupId]);
  }
  const state = new Map();
  const visit = (n) => {
    if (state.get(n) === 1) return true;
    if (state.get(n) === 2) return false;
    state.set(n, 1);
    for (const m of (adj.get(n) || [])) if (visit(m)) return true;
    state.set(n, 2);
    return false;
  };
  for (const n of adj.keys()) if (visit(n)) { problems.push('supported relations form a cycle'); break; }
  return problems;
}
