import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// The document is run as a script in a VM, so its ES imports are stripped and
// the imported helpers are handed in as context globals instead.
const source = fs.readFileSync(new URL('../../src/offscreen.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '');
function harness({ synth } = {}) {
  let listener, sequence = 0;
  const timers = new Map(), workers = [];
  const clips = [];
  class Audio {
    constructor(src) { this.src = src; this.paused = false; clips.push(this); }
    play() { this.played = true; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  class Worker {
    constructor() { this.messages = []; this.terminated = false; workers.push(this); }
    postMessage(m) { this.messages.push(m); }
    terminate() { this.terminated = true; }
    answer(i = 0) { this.onmessage({ data: { requestId: this.messages[i].requestId, type: 'ANALYZE_RESULT', payload: { text: '森' } } }); }
  }
  vm.runInNewContext(source, {
    Worker, URL, Audio, location: { href: 'https://extension.test/offscreen.html' },
    synthesize: synth || (async () => 'QUJD'),
    chrome: { runtime: { onMessage: { addListener(fn) { listener = fn; } } } },
    setTimeout(fn, ms) { const id = ++sequence; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  return {
    workers, timers, clips,
    speak(payload = { text: '森', voice: 'ja-JP-Neural2-C', rate: 0.85, key: 'k' }) { return new Promise(resolve => listener({ protocolVersion: 1, target: 'offscreen', type: 'SPEAK', payload }, {}, resolve)); },
    stopSpeak() { return new Promise(resolve => listener({ protocolVersion: 1, target: 'offscreen', type: 'STOP_SPEAK', payload: {} }, {}, resolve)); },
    send(type = 'ANALYZE') { return new Promise(resolve => listener({ protocolVersion: 1, target: 'offscreen', type, payload: { text: '森' } }, {}, resolve)); },
    fire(ms) { const entry = [...timers].find(([, t]) => t.ms === ms); assert.ok(entry, `missing ${ms}ms timer`); timers.delete(entry[0]); entry[1].fn(); },
  };
}

test('offscreen owner releases an idle dictionary and rebuilds it on the next request', async () => {
  const h = harness(), first = h.send();
  h.workers[0].answer(); assert.equal((await first).ok, true);
  h.fire(600000); assert.equal(h.workers[0].terminated, true);
  const next = h.send(); assert.equal(h.workers.length, 2);
  h.workers[1].answer(); assert.equal((await next).ok, true);
});

test('idle cleanup never interrupts outstanding analysis', async () => {
  const h = harness(), a = h.send(), b = h.send();
  h.workers[0].answer(0); await a;
  assert.equal([...h.timers.values()].some(t => t.ms === 600000), false);
  h.workers[0].answer(1); await b;
  assert.equal([...h.timers.values()].some(t => t.ms === 600000), true);
});

test('timeout and worker failure reject pending callers and allow recovery', async () => {
  const h = harness(), a = h.send(), b = h.send();
  h.fire(30000);
  assert.match((await a).error, /timed out/); assert.equal((await b).ok, false);
  assert.equal(h.workers[0].terminated, true);
  const next = h.send(); h.workers[1].onerror({ message: 'worker crashed' });
  assert.match((await next).error, /worker crashed/);
  const retry = h.send(); h.workers[2].answer(); assert.equal((await retry).ok, true);
});

test('explicit release settles pending requests rather than leaving their promises open', async () => {
  const h = harness(), pending = h.send();
  assert.equal((await h.send('RELEASE')).ok, true);
  assert.equal((await pending).ok, false);
  assert.equal(h.timers.size, 0);
});

test('the offscreen document plays one Google Cloud clip at a time', async () => {
  const h = harness();
  const r = await h.speak();
  assert.deepEqual({ ...r }, { ok: true, played: true });
  assert.equal(h.clips.length, 1);
  assert.equal(h.clips[0].src, 'data:audio/mpeg;base64,QUJD', 'the base64 MP3 is played as a data: URI, out of reach of the page CSP');

  await h.speak({ text: '別の文', voice: 'ja-JP-Neural2-C', rate: 0.85, key: 'k' });
  assert.equal(h.clips.length, 2);
  assert.equal(h.clips[0].paused, true, 'the previous clip is stopped, never overlapped');
});

test('a clip superseded while its fetch was in the air is dropped, not played late', async () => {
  let release; const slow = new Promise(r => { release = r; });
  const h = harness({ synth: async () => { await slow; return 'QUJD'; } });
  const first = h.speak();
  await h.stopSpeak();                    // the learner closed the bar meanwhile
  release('QUJD');
  assert.deepEqual({ ...(await first) }, { ok: true, played: false, stale: true });
  assert.equal(h.clips.length, 0, 'nothing started playing after the stop');
});

test('a rejected key comes back as an error the caller can show', async () => {
  const h = harness({ synth: async () => { throw new Error('403 — Requests from referer <empty> are blocked.'); } });
  const r = await h.speak();
  assert.equal(r.ok, false);
  assert.match(r.error, /403 — Requests from referer/);
  assert.equal(h.clips.length, 0);
});

test('stopping silences the clip that is playing', async () => {
  const h = harness();
  await h.speak();
  assert.deepEqual({ ...(await h.stopSpeak()) }, { ok: true });
  assert.equal(h.clips[0].paused, true);
});
