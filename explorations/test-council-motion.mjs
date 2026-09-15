import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const media = new EventTarget();
media.matches = false;
const document = new EventTarget();
document.hidden = false;
let observer;
const context = { window: {}, document, matchMedia: () => media, AbortController,
  CustomEvent, IntersectionObserver: class {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {} disconnect() { this.disconnected = true; }
  } };
runInNewContext(readFileSync(new URL('../site-motion.js', import.meta.url), 'utf8'), context);
const root = new EventTarget();
const scope = new context.window.KhevMotion.Scope(root);
const element = { animate() { return {
  playState: 'running', play() { this.playState = 'running'; },
  pause() { this.playState = 'paused'; }, cancel() { this.playState = 'idle'; }
}; } };
const first = scope.animate(element, [{opacity:0},{opacity:1}]);
assert.equal(first.playState, 'paused', 'offscreen effects start paused');
observer.callback([{isIntersecting:true}]);
assert.equal(first.playState, 'running');
scope.pause();
assert.equal(first.playState, 'paused');
scope.pause(false);
document.hidden = true; document.dispatchEvent(new Event('visibilitychange'));
assert.equal(first.playState, 'paused', 'background tab pauses');
document.hidden = false; document.dispatchEvent(new Event('visibilitychange'));
assert.equal(first.playState, 'running');
media.matches = true; media.dispatchEvent(new Event('change'));
assert.equal(first.playState, 'idle', 'runtime reduced motion releases effects');
assert.equal(scope.animations.size, 0);
assert.equal(scope.animate(element, []), null);
media.matches = false; media.dispatchEvent(new Event('change'));
const second = scope.animate(element, []);
second.onfinish();
assert.equal(scope.animations.size, 0, 'completed animations do not accumulate');
assert.equal(second.playState, 'idle');
scope.animate(element, []); scope.clear();
assert.equal(scope.animations.size, 0, 'rapid replacement clears all effects');
scope.destroy(); assert.equal(observer.disconnected, true);
console.log('PASS: visibility, pause/resume, runtime reduced motion, completion cleanup, replacement, teardown');
