import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GCLOUD_VOICES, CLOUD_PREFIX, cloudVoiceName, usesCloud, synthesizeUrl, synthesizeBody, synthesize, speak } from '../../src/panel/tts.js';

test('the cloud voice list mirrors the Nihongo app, ids and all', () => {
  assert.deepEqual(GCLOUD_VOICES.map(v => v.id), ['ja-JP-Neural2-B', 'ja-JP-Neural2-C', 'ja-JP-Neural2-D', 'ja-JP-Wavenet-A', 'ja-JP-Wavenet-C']);
  assert.ok(GCLOUD_VOICES.every(v => /^Google Cloud · /.test(v.label)));
  assert.equal(CLOUD_PREFIX, 'gcloud:', 'same stored value shape as the app, so a key/voice pair can be copied over');
});

test('a stored voice is recognised as cloud only when it names a real voice', () => {
  assert.equal(cloudVoiceName('gcloud:ja-JP-Neural2-C'), 'ja-JP-Neural2-C');
  assert.equal(cloudVoiceName('gcloud:ja-JP-Made-Up'), null, 'unknown voice falls back to the browser');
  assert.equal(cloudVoiceName('com.apple.voice.Kyoko'), null);
  assert.equal(cloudVoiceName(null), null);
  assert.equal(usesCloud({ gcloudTtsKey: 'k', ttsVoiceURI: 'gcloud:ja-JP-Wavenet-A' }), true);
  assert.equal(usesCloud({ ttsVoiceURI: 'gcloud:ja-JP-Wavenet-A' }), false, 'no key, no cloud');
  assert.equal(usesCloud({ gcloudTtsKey: 'k', ttsVoiceURI: null }), false, 'key alone does not force the cloud');
});

test('the synthesize request matches the app: ja-JP, MP3, rate clamped to the API range', () => {
  assert.equal(synthesizeUrl('a b&c'), 'https://texttospeech.googleapis.com/v1/text:synthesize?key=a%20b%26c');
  const b = synthesizeBody('森', 'ja-JP-Neural2-C', 0.85);
  assert.deepEqual(b, { input: { text: '森' }, voice: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C' }, audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 } });
  assert.equal(synthesizeBody('森', 'ja-JP-Neural2-C', 9).audioConfig.speakingRate, 4);
  assert.equal(synthesizeBody('森', 'ja-JP-Neural2-C', 0).audioConfig.speakingRate, 1, 'zero or missing rate → normal speed');
  assert.equal(synthesizeBody('森', null, 1).voice.name, 'ja-JP-Neural2-B', 'no voice named → the first one');
});

test('synthesize returns the base64 clip and surfaces Google’s own error text', async () => {
  const calls = [];
  const okFetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { ok: true, json: async () => ({ audioContent: 'QUJD' }) }; };
  assert.equal(await synthesize(' 森 の 音 ', { key: 'k', voice: 'ja-JP-Wavenet-C', rate: 1, fetchImpl: okFetch }), 'QUJD');
  assert.equal(calls[0].body.input.text, '森 の 音', 'whitespace collapsed, like the app');

  const denied = { ok: false, status: 403, json: async () => ({ error: { message: 'Requests from referer <empty> are blocked.' } }) };
  await assert.rejects(() => synthesize('森', { key: 'k', fetchImpl: async () => denied }), /403 — Requests from referer/);
  const plain = { ok: false, status: 500, json: async () => { throw new Error('not json'); } };
  await assert.rejects(() => synthesize('森', { key: 'k', fetchImpl: async () => plain }), /HTTP 500/);
  await assert.rejects(() => synthesize('森', { key: 'k', fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), /empty audio response/);
  await assert.rejects(() => synthesize('森', { fetchImpl: okFetch }), /No Google Cloud key set/);
  await assert.rejects(() => synthesize('  ', { key: 'k', fetchImpl: okFetch }), /nothing to speak/);
});

test('speak hands the phrase to the cloud, and falls back to the browser voice when it declines or fails', async () => {
  const spoken = [];
  globalThis.speechSynthesis = { getVoices: () => [], cancel() {}, speak: (u) => spoken.push(u.text) };
  globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  const settle = () => new Promise(r => setTimeout(r, 0));

  const asked = [];
  assert.equal(speak('森が広がる', { remote: async (t) => { asked.push(t); return true; } }), true);
  await settle();
  assert.deepEqual(asked, ['森が広がる']);
  assert.deepEqual(spoken, [], 'the cloud played it, so no browser utterance');

  speak('別の文', { remote: async () => false });                      // no cloud voice configured
  await settle();
  assert.deepEqual(spoken, ['別の文'], 'declined → browser voice');

  speak('三つ目', { remote: async () => { throw new Error('403'); } }); // key rejected mid-read
  await settle();
  assert.deepEqual(spoken, ['別の文', '三つ目'], 'failed → browser voice, so a tap always makes sound');

  const before = spoken.length;
  speak('三つ目', { remote: async () => false });
  await settle();
  assert.equal(spoken.length, before, 'the same phrase within 700 ms is a double-click, not a replay');
  delete globalThis.speechSynthesis; delete globalThis.SpeechSynthesisUtterance;
});

test('a Cloud Text-to-Speech refusal is sorted into the thing that is actually wrong', async () => {
  const { voiceErrorKind, firstUrl } = await import('../../src/panel/tts.js');
  const billing = '403 — This API method requires billing to be enabled. Please enable billing on project #153406461054 by visiting https://console.developers.google.com/billing/enable?project=153406461054 then retry.';
  assert.equal(voiceErrorKind(billing), 'billing');
  assert.equal(firstUrl(billing), 'https://console.developers.google.com/billing/enable?project=153406461054', 'Google’s own link is offered, unmangled and without the trailing stop');
  assert.equal(voiceErrorKind('403 — Requests from referer <empty> are blocked.'), 'referrer');
  assert.equal(voiceErrorKind('403 — Cloud Text-to-Speech API has not been used in project 12 before or it is disabled.'), 'disabled');
  assert.equal(voiceErrorKind('400 — API key not valid. Please pass a valid API key.'), 'key');
  assert.equal(voiceErrorKind('429 — Quota exceeded'), 'quota');
  assert.equal(voiceErrorKind('empty audio response'), 'other');
  assert.equal(firstUrl('HTTP 500'), null);
});
