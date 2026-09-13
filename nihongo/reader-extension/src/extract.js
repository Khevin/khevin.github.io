/*
 * extract.js — DOM → captured text for the Nihongo Reader (handoff §6).
 * Runs in the page (content script from M1; injected into fixtures for tests).
 * Depends on DOM APIs only; no Chrome APIs, no messaging.
 *
 * extractRange(range) walks the text nodes intersecting a live Range and
 * returns paragraph blocks:
 *   { captureKind:'selection', blocks:[{ text, ruby:[{start,end,reading}], sourceMap:[{start,end,node,nodeOffset}] }] }
 *
 * Rules:
 *   - partial first/last text nodes are sliced at the Range offsets;
 *   - script/style/template/noscript, ruby rt/rp, hidden descendants
 *     (display:none, visibility:hidden, hidden attr, aria-hidden=true), and
 *     form fields / contenteditable are excluded;
 *   - <br> is a LAYOUT break: encoded as '\n' inside the same block (the
 *     normalizer removes it, so a <br class="sp"> mid-sentence never splits);
 *   - a change of nearest block-level ancestor starts a new block (paragraph);
 *   - ruby base text stays in `text`; each <rt> becomes a reading span over
 *     the base text that preceded it inside the same <ruby>.
 * extractImageAlt(img) returns { captureKind:'image-alt', blocks:[{text}] } or null.
 * `sourceMap` holds live node references; it is ephemeral and must never be
 * serialized or sent through chrome.runtime messaging.
 */

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'RT', 'RP', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION']);
const BLOCK_DISPLAY = new Set(['block', 'list-item', 'table', 'table-row', 'table-cell', 'flex', 'grid', 'flow-root', 'table-caption']);

function isExcluded(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName)) return true;
    if (e.hasAttribute('hidden') || e.getAttribute('aria-hidden') === 'true') return true;
    if (e.isContentEditable) return true;
    const cs = e.ownerDocument.defaultView.getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
  }
  return false;
}

function blockAncestor(node) {
  for (let e = node.nodeType === 1 ? node : node.parentElement; e; e = e.parentElement) {
    const cs = e.ownerDocument.defaultView.getComputedStyle(e);
    if (BLOCK_DISPLAY.has(cs.display) || e.tagName === 'BODY') return e;
  }
  return null;
}

/**
 * @param {Range} range
 */
export function extractRange(range) {
  const doc = range.startContainer.ownerDocument || document;
  const root = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  const blocks = [];
  let cur = null;          // current block being filled
  let curBlockEl = null;
  let pendingBreak = false;
  const rubyBase = new Map(); // ruby element -> start offset of its current base run

  const startBlock = (blockEl) => {
    cur = { text: '', ruby: [], sourceMap: [] };
    curBlockEl = blockEl;
    pendingBreak = false;
    blocks.push(cur);
  };

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === 1) {
        if (node.tagName === 'BR' || node.tagName === 'RT') return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
      return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === 1) {
      if (!range.intersectsNode(node) || isExcluded(node.parentElement)) continue;
      if (node.tagName === 'BR') { if (cur) pendingBreak = true; continue; }
      // RT: close the ruby base run that preceded it
      const ruby = node.closest('ruby');
      if (cur && ruby && rubyBase.has(ruby)) {
        const start = rubyBase.get(ruby);
        if (cur.text.length > start) cur.ruby.push({ start, end: cur.text.length, reading: node.textContent.trim() });
        rubyBase.delete(ruby);
      }
      continue;
    }
    const parent = node.parentElement;
    if (!parent || isExcluded(parent)) continue;
    let s = 0, e = node.data.length;
    if (node === range.startContainer) s = range.startOffset;
    if (node === range.endContainer) e = Math.min(e, range.endOffset);
    if (e <= s) continue;
    const slice = node.data.slice(s, e);
    if (!slice) continue;

    const blockEl = blockAncestor(node);
    if (!cur || blockEl !== curBlockEl) {
      // whitespace-only runs between blocks are layout, not content
      if (!slice.trim() && (!cur || blockEl !== curBlockEl)) continue;
      startBlock(blockEl);
    } else if (pendingBreak) {
      cur.text += '\n';
      pendingBreak = false;
    }
    const ruby = parent.closest('ruby');
    if (ruby && !rubyBase.has(ruby)) rubyBase.set(ruby, cur.text.length);
    const start = cur.text.length;
    cur.text += slice;
    cur.sourceMap.push({ start, end: cur.text.length, node, nodeOffset: s });
  }

  // Drop blocks that are only whitespace/layout
  const kept = blocks.filter(b => b.text.replace(/[\s　]+/g, '').length > 0);
  return { captureKind: 'selection', blocks: kept };
}

/**
 * @param {HTMLImageElement} img
 */
export function extractImageAlt(img) {
  if (!img || img.tagName !== 'IMG') return null;
  const alt = (img.getAttribute('alt') || '').trim();
  if (!alt) return null;
  return { captureKind: 'image-alt', blocks: [{ text: alt, ruby: [], sourceMap: [] }], element: img };
}
