/* Broad — custom monoline lettering for the Signal exploration.
 *
 * Not a font file and not a trace of one: an original geometric alphabet drawn
 * in the spirit of the wide modern display faces (the Envato "Broad" specimen
 * was the reference for proportion and mood). Each glyph is a set of stroke
 * CENTRELINES rather than filled outlines, so weight is one number, corners
 * stay crisp at any size, and every glyph can be drawn on with a dash offset.
 *
 * TWO WIDTHS, KEYED TO CASE — the thing that makes this face worth having.
 * UPPERCASE input gives the wide form, lowercase input gives the narrow one.
 * Both render as capitals; only the proportion changes. So `HaS` is a wide H,
 * a narrow A, a wide S — and a sentence can be composed with a deliberate
 * rhythm of wide and narrow letters instead of an even texture.
 *
 * Glyphs are FUNCTIONS of their advance, not fixed path strings. That is what
 * keeps the two widths genuinely the same alphabet rather than two drawings
 * that drift apart: round letters become ellipses as they narrow, diagonals
 * close their splay, flat-sided letters simply stretch.
 *
 * Unit system: cap height 100, baseline at y=100, stroke 12.
 * Centrelines are inset by half a stroke (6), so a glyph of advance w paints
 * ink from x=6 to x=w-6 — which makes flush-left/flush-right alignment exact.
 */

export const STROKE = 12;
export const CAP = 100;

const T = 6, B = 94, MID = 50, LEFT = 6;

const n = (v) => Math.round(v * 100) / 100;

/** Geometry handed to every glyph builder for a given advance. */
const geo = (w) => {
  const L = LEFT, R = w - 6;
  return { w, L, R, T, B, M: MID, W: R - L, cx: (L + R) / 2, rx: (R - L) / 2, ry: 44 };
};

/** Full ellipse — the broad face's answer to a circle. */
const ellipse = (g) =>
  `M ${g.L} 50 A ${n(g.rx)} 44 0 1 1 ${n(g.R)} 50 A ${n(g.rx)} 44 0 1 1 ${g.L} 50 Z`;

/** Point on that ellipse at screen-angle deg (0 = right, 90 = bottom). */
const pt = (g, deg) => {
  const a = (deg * Math.PI) / 180;
  return [n(g.cx + g.rx * Math.cos(a)), n(50 + 44 * Math.sin(a))];
};

/* Advances are [wide, narrow]. Wide runs about 1.25x the cap height — the
   reference's defining proportion — and narrow lands a little over half that. */
export const GLYPHS = {
  ' ': { w: [46, 32], d: () => [] },

  A: {
    w: [130, 68],
    d: (g) => {                                    // wide: pointed apex
      const bar = 68, k = (B - bar) / (B - T);
      return [
        `M ${g.L} ${B} L ${n(g.cx)} ${T} L ${n(g.R)} ${B}`,
        `M ${n(g.L + (g.cx - g.L) * k)} ${bar} H ${n(g.R - (g.R - g.cx) * k)}`,
      ];
    },
    alt: (g) => {                                  // narrow: flat top
      const i = g.W * 0.26, bar = 68, k = (B - bar) / (B - T);
      return [
        `M ${g.L} ${B} L ${n(g.L + i)} ${T} L ${n(g.R - i)} ${T} L ${n(g.R)} ${B}`,
        `M ${n(g.L + i * k)} ${bar} H ${n(g.R - i * k)}`,
      ];
    },
  },

  B: { w: [124, 66], d: (g) => [
    `M ${g.L} ${T} V ${B}`,
    `M ${g.L} ${T} H ${n(g.R - g.W * 0.42)} A ${n(g.W * 0.42)} 22 0 0 1 ${n(g.R - g.W * 0.42)} ${MID} H ${g.L}`,
    `M ${g.L} ${MID} H ${n(g.R - g.W * 0.46)} A ${n(g.W * 0.46)} 22 0 0 1 ${n(g.R - g.W * 0.46)} ${B} H ${g.L}`,
  ] },

  C: { w: [126, 66], d: (g) => {
    const [sx, sy] = pt(g, -52), [ex, ey] = pt(g, 52);
    return [`M ${sx} ${sy} A ${n(g.rx)} 44 0 1 0 ${ex} ${ey}`];
  } },

  D: { w: [128, 68], d: (g) => {
    const f = g.L + g.W * 0.26;
    return [`M ${g.L} ${T} V ${B}`, `M ${g.L} ${T} H ${n(f)} A ${n(g.R - f)} 44 0 0 1 ${n(f)} ${B} H ${g.L}`];
  } },

  E: { w: [118, 62], d: (g) => [`M ${n(g.R)} ${T} H ${g.L} V ${B} H ${n(g.R)}`, `M ${g.L} ${MID} H ${n(g.L + g.W * 0.78)}`] },
  F: { w: [116, 60], d: (g) => [`M ${n(g.R)} ${T} H ${g.L} V ${B}`, `M ${g.L} ${MID} H ${n(g.L + g.W * 0.78)}`] },

  G: { w: [128, 68], d: (g) => {
    const [sx, sy] = pt(g, -52);
    return [`M ${sx} ${sy} A ${n(g.rx)} 44 0 1 0 ${n(g.R)} ${MID} H ${n(g.R - g.W * 0.34)}`];
  } },

  H: { w: [124, 66], d: (g) => [`M ${g.L} ${T} V ${B}`, `M ${n(g.R)} ${T} V ${B}`, `M ${g.L} ${MID} H ${n(g.R)}`] },
  I: { w: [50, 40], d: (g) => [`M ${n(g.cx)} ${T} V ${B}`] },

  J: { w: [112, 62], d: (g) => {
    const r = g.W * 0.5;
    return [`M ${n(g.R)} ${T} V ${n(B - r)} A ${n(g.rx)} ${n(r)} 0 0 1 ${g.L} ${n(B - r)}`];
  } },

  K: { w: [122, 64], d: (g) => [`M ${g.L} ${T} V ${B}`, `M ${n(g.R)} ${T} L ${g.L} ${MID}`, `M ${g.L} ${MID} L ${n(g.R)} ${B}`] },
  L: { w: [114, 60], d: (g) => [`M ${g.L} ${T} V ${B} H ${n(g.R)}`] },

  M: { w: [152, 80], d: (g) => [`M ${g.L} ${B} V ${T} L ${n(g.cx)} ${n(B - 10)} L ${n(g.R)} ${T} V ${B}`] },
  N: { w: [128, 68], d: (g) => [`M ${g.L} ${B} V ${T} L ${n(g.R)} ${B} V ${T}`] },
  O: { w: [130, 70], d: (g) => [ellipse(g)] },

  P: { w: [120, 64], d: (g) => [
    `M ${g.L} ${T} V ${B}`,
    `M ${g.L} ${T} H ${n(g.R - g.W * 0.44)} A ${n(g.W * 0.44)} 22 0 0 1 ${n(g.R - g.W * 0.44)} ${MID} H ${g.L}`,
  ] },

  Q: { w: [134, 72], d: (g) => [ellipse(g), `M ${n(g.cx + g.rx * 0.32)} ${n(50 + 44 * 0.46)} L ${n(g.R + 4)} 102`] },

  R: { w: [124, 66], d: (g) => [
    `M ${g.L} ${T} V ${B}`,
    `M ${g.L} ${T} H ${n(g.R - g.W * 0.44)} A ${n(g.W * 0.44)} 22 0 0 1 ${n(g.R - g.W * 0.44)} ${MID} H ${g.L}`,
    `M ${n(g.L + g.W * 0.42)} ${MID} L ${n(g.R)} ${B}`,
  ] },

  S: { w: [122, 66], d: (g) => {
    const a = g.L + g.W * 0.06, b = g.R - g.W * 0.06;
    return [
      `M ${n(b)} 26 C ${n(b)} 12 ${n(g.cx + g.W * 0.2)} ${T} ${n(g.cx)} ${T} ` +
      `C ${n(g.cx - g.W * 0.24)} ${T} ${n(a)} 16 ${n(a)} 32 ` +
      `C ${n(a)} 46 ${n(g.cx - g.W * 0.2)} ${MID} ${n(g.cx)} ${MID} ` +
      `C ${n(g.cx + g.W * 0.2)} ${MID} ${n(b)} 56 ${n(b)} 70 ` +
      `C ${n(b)} 86 ${n(g.cx + g.W * 0.22)} ${B} ${n(g.cx)} ${B} ` +
      `C ${n(g.cx - g.W * 0.22)} ${B} ${n(a)} 88 ${n(a)} 74`,
    ];
  } },

  T: { w: [120, 62], d: (g) => [`M ${g.L} ${T} H ${n(g.R)}`, `M ${n(g.cx)} ${T} V ${B}`] },
  U: { w: [126, 66], d: (g) => [`M ${g.L} ${T} V ${MID} A ${n(g.rx)} 44 0 0 0 ${n(g.R)} ${MID} V ${T}`] },
  V: { w: [128, 68], d: (g) => [`M ${g.L} ${T} L ${n(g.cx)} ${B} L ${n(g.R)} ${T}`] },

  W: { w: [168, 90], d: (g) => {
    const q = g.W / 4;
    return [`M ${g.L} ${T} L ${n(g.L + q)} ${B} L ${n(g.cx)} ${n(T + 8)} L ${n(g.R - q)} ${B} L ${n(g.R)} ${T}`];
  } },

  X: { w: [124, 66], d: (g) => [`M ${g.L} ${T} L ${n(g.R)} ${B}`, `M ${n(g.R)} ${T} L ${g.L} ${B}`] },
  Y: { w: [124, 66], d: (g) => [`M ${g.L} ${T} L ${n(g.cx)} ${MID} L ${n(g.R)} ${T}`, `M ${n(g.cx)} ${MID} V ${B}`] },
  Z: { w: [120, 64], d: (g) => [`M ${g.L} ${T} H ${n(g.R)} L ${g.L} ${B} H ${n(g.R)}`] },

  // A round full stop echoes the elliptical O; it needs its own cap to exist.
  '.': { w: [48, 40], d: (g) => [`M ${n(g.cx)} ${B} L ${n(g.cx)} ${B}`], cap: 'round' },
  ',': { w: [48, 40], d: (g) => [`M ${n(g.cx)} 88 L ${n(g.cx - 8)} 108`] },
  "'": { w: [44, 34], d: (g) => [`M ${n(g.cx)} ${T} V 34`] },
  '-': { w: [90, 56], d: (g) => [`M ${g.L} ${MID} H ${n(g.R)}`] },

  '&': { w: [136, 76], d: (g) => {
    const r = g.W * 0.17;
    return [
      `M ${n(g.R)} ${B} C ${n(g.R - g.W * 0.2)} 70 ${n(g.L + g.W * 0.24)} 44 ${n(g.L + g.W * 0.24)} 30 ` +
      `A ${n(r)} 17 0 1 1 ${n(g.L + g.W * 0.46)} 26 ` +
      `C ${n(g.L + g.W * 0.46)} 44 ${g.L} 58 ${g.L} 74 ` +
      `A ${n(g.W * 0.2)} 20 0 0 0 ${n(g.L + g.W * 0.36)} 84 ` +
      `C ${n(g.L + g.W * 0.44)} 66 ${n(g.L + g.W * 0.6)} 54 ${n(g.R)} 48`,
    ];
  } },
};

/**
 * UPPERCASE gives the wide form, lowercase the narrow one.
 * Everything renders as a capital; only the proportion changes.
 */
export const resolve = (ch) => {
  const upper = ch.toUpperCase();
  const spec = GLYPHS[upper] || GLYPHS[' '];
  const wide = ch === upper;
  const w = spec.w[wide ? 0 : 1];
  const build = (!wide && spec.alt) ? spec.alt : spec.d;
  return { w, cap: spec.cap, wide, d: build(geo(w)) };
};

/** Ink width of a line at a given tracking. */
export const lineWidth = (text, track = 0) => {
  const chars = [...text];
  return chars.reduce((s, ch) => s + resolve(ch).w, 0) + Math.max(chars.length - 1, 0) * track;
};

/**
 * Lay out lines of lettering as one SVG string.
 *
 *  - `track` given: one tracking for every line, so the letter texture is
 *    identical throughout and the block rags right. Monoline diagonals carry
 *    mechanical side bearings and need the air; this is the safe mode.
 *  - `track` omitted: lines justify to a common `measure` by tracking, never by
 *    scaling, so cap height and weight stay constant. Only for lines of similar
 *    length — otherwise the longest one sets solid and its letters collide.
 *
 * @param {Array<string | {text: string, cls?: string}>} lines
 * @param {{track?: number, measure?: number, lineGap?: number, cls?: string}} [opts]
 */
export function lettering(lines, { track, measure, lineGap = 40, cls = 'broad' } = {}) {
  const rows = lines.map((l) => (typeof l === 'string' ? { text: l } : l));
  const justify = track == null;
  const solid = rows.map((r) => lineWidth(r.text));
  const width = justify
    ? (measure ?? Math.max(...solid))
    : Math.max(...rows.map((r) => lineWidth(r.text, track)));
  const height = rows.length * CAP + (rows.length - 1) * lineGap;

  let i = 0;
  const body = rows.map((row, li) => {
    const chars = [...row.text];
    const t = justify ? (width - solid[li]) / Math.max(chars.length - 1, 1) : track;
    const top = li * (CAP + lineGap);

    let x = 0;
    const paths = chars.flatMap((ch) => {
      const g = resolve(ch);
      const at = x;
      x += g.w + t;
      if (!g.d.length) return [];
      const k = i++;
      const cap = g.cap ? ` stroke-linecap="${g.cap}"` : '';
      return g.d.map((d) =>
        `<path class="${cls}__g" style="--i:${k}" pathLength="100"${cap} ` +
        `transform="translate(${n(at)} ${top})" d="${d}"/>`
      );
    });

    const rowCls = [`${cls}__line`, row.cls].filter(Boolean).join(' ');
    return `  <g class="${rowCls}">\n    ${paths.join('\n    ')}\n  </g>`;
  }).join('\n');

  return `<svg class="${cls}" viewBox="0 0 ${n(width)} ${height}" ` +
    `preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">\n${body}\n</svg>`;
}
