/*
 * analysis-worker.js — dedicated Web Worker owned by the side panel. Owns the
 * tokenizer and the grammar rules. Holds no durable learner state.
 *
 * Dictionary loading: the 12 IPADIC files ship gzipped inside the extension
 * (dist/dict/*.dat.gz). They are fetched from the extension origin and
 * inflated with the platform DecompressionStream — no zlib dependency, no
 * remote requests. The dictionary base URL is derived from this script's own
 * URL so no chrome.* API is needed inside the worker.
 *
 * Protocol (MessageEnvelope, protocolVersion 1):
 *   → { type:'INIT' }                    ← WORKER_READY { buildMs, files:[{name,gzBytes,rawBytes,ms}], memory }
 *   → { type:'TOKENIZE', payload:{text} } ← TOKENIZE_RESULT { text, tokens, gaps, ms }
 *   → { type:'ANALYZE',  payload:{text} } ← ANALYZE_RESULT  { text, tokens, gaps, groups, relations, warnings, versions, ms }
 *   any failure                          ← WORKER_ERROR { message, stage }
 */
import { TokenizerBuilder } from '@patdx/kuromoji';
import { adaptTokens, ADAPTER_VERSION } from '../../reader-core/tokenizer-adapter.js';
import { analyze, RULES_VERSION } from '../../reader-core/grammar.js';

const PROTOCOL_VERSION = 1;
const DICT_BASE = new URL('dict/', self.location.href);
const VERSIONS = { tokenizer: '@patdx/kuromoji@1.0.4', dictionary: 'mecab-ipadic-2.7.0-20070801', rules: RULES_VERSION, adapter: ADAPTER_VERSION };

let tokenizer = null;
let building = null;
const fileStats = [];

const loader = {
  async loadArrayBuffer(name) {
    const t0 = performance.now();
    const res = await fetch(new URL(name, DICT_BASE));
    if (!res.ok) throw new Error(`dictionary fetch failed: ${name} (${res.status})`);
    const gzBytes = Number(res.headers.get('content-length')) || null;
    const inflated = res.body.pipeThrough(new DecompressionStream('gzip'));
    const buffer = await new Response(inflated).arrayBuffer();
    fileStats.push({ name, gzBytes, rawBytes: buffer.byteLength, ms: Math.round(performance.now() - t0) });
    return buffer;
  },
};

function memorySnapshot() {
  const m = self.performance && self.performance.memory;
  return m ? { usedJSHeapSize: m.usedJSHeapSize, totalJSHeapSize: m.totalJSHeapSize } : null;
}

async function ensureTokenizer() {
  if (tokenizer) return { buildMs: 0, cached: true };
  if (!building) {
    building = (async () => {
      const t0 = performance.now();
      tokenizer = await new TokenizerBuilder({ loader }).build();
      return { buildMs: Math.round(performance.now() - t0), cached: false };
    })().catch((err) => { building = null; fileStats.length = 0; throw err; });
  }
  return building;
}

function reply(requestId, type, payload) {
  self.postMessage({ protocolVersion: PROTOCOL_VERSION, requestId, type, payload });
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  const { requestId, type, payload } = msg;
  let stage = 'protocol';
  try {
    if (msg.protocolVersion !== PROTOCOL_VERSION) throw new Error(`unsupported protocolVersion ${msg.protocolVersion}`);
    if (type === 'INIT') {
      stage = 'dictionary';
      const r = await ensureTokenizer();
      reply(requestId, 'WORKER_READY', { ...r, files: fileStats, memory: memorySnapshot(), versions: VERSIONS });
      return;
    }
    if (type === 'TOKENIZE' || type === 'ANALYZE') {
      stage = 'dictionary';
      await ensureTokenizer();
      const text = String(payload && payload.text || '');
      const t0 = performance.now();
      stage = 'tokenize';
      const raw = tokenizer.tokenize(text);
      const { tokens, gaps } = adaptTokens(text, raw);   // throws if reconstruction fails
      if (type === 'TOKENIZE') { reply(requestId, 'TOKENIZE_RESULT', { text, tokens, gaps, ms: +(performance.now() - t0).toFixed(2), memory: memorySnapshot() }); return; }
      stage = 'grammar';
      let grammar;
      try { grammar = analyze(text, tokens); }
      catch (err) { grammar = { groups: [], relations: [], warnings: [`grammar failed: ${err && err.message}`] }; }
      reply(requestId, 'ANALYZE_RESULT', { text, tokens, gaps, ...grammar, versions: VERSIONS, ms: +(performance.now() - t0).toFixed(2) });
      return;
    }
    throw new Error(`unknown message type ${type}`);
  } catch (err) {
    reply(requestId, 'WORKER_ERROR', { message: err && err.message ? err.message : String(err), stage });
  }
};
