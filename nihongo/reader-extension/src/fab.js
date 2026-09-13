/*
 * fab.js — pure helpers for the in-page floating button: which selections
 * deserve it, and where it goes. No DOM, unit-tested in Node.
 */

const JP = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu;

/**
 * A selection is worth a FAB when it contains at least `min` kana/kanji.
 * @param {string} text
 * @param {number} [min=2]
 */
export function isJapaneseSelection(text, min = 2) {
  if (!text) return false;
  const m = String(text).match(JP);
  return !!m && m.length >= min;
}

/**
 * Place a `size`px button next to the selection's first client rect.
 * Horizontal side follows where the selection sits on screen (left half →
 * start of the rect, right half → end of the rect); vertical placement is
 * above the rect, or below when there is no room. Everything is clamped
 * `gap`px inside the viewport.
 * @param {{left:number,top:number,right:number,bottom:number}} rect viewport coordinates
 * @param {{width:number,height:number}} viewport
 * @param {{size?:number,gap?:number}} [o]
 * @returns {{x:number,y:number,side:'left'|'right',placement:'above'|'below'}}
 */
export function placeFab(rect, viewport, o = {}) {
  const size = o.size ?? 36, gap = o.gap ?? 8;
  const side = (rect.left + rect.right) / 2 < viewport.width / 2 ? 'left' : 'right';
  let x = side === 'left' ? rect.left : rect.right - size;
  let y = rect.top - size - gap;
  let placement = 'above';
  if (y < gap) { y = rect.bottom + gap; placement = 'below'; }
  x = Math.min(Math.max(x, gap), viewport.width - size - gap);
  y = Math.min(Math.max(y, gap), viewport.height - size - gap);
  return { x: Math.round(x), y: Math.round(y), side, placement };
}

/** Deterministic idempotency key for "sentence i of capture c was shown". */
export function actionIdFor(captureId, index) { return `${captureId}:${index}`; }
