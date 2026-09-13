import { writeFile } from 'node:fs/promises';
import { lettering, GLYPHS, resolve, lineWidth, STROKE } from './broad-lettering.mjs';

const esc = (ch) => ch === '&' ? '&amp;' : ch === "'" ? '&apos;' : ch === '<' ? '&lt;' : ch;

/* The sentence exactly as Khevin cased it in the Envato specimen — the wide /
   narrow rhythm is the composition, not an accident of typing. */
const HATS = 'A dESIGnER WHO HaS WORN MAnY HAtS';

const specimens = [
  ['wide set · uppercase input', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&'],
  ['narrow set · lowercase input', 'abcdefghijklmnopqrstuvwxyz&'],
  ['the sentence, as cased', HATS],
  ['the same sentence, all wide', HATS.toUpperCase()],
  ['the same sentence, all narrow', HATS.toLowerCase()],
].map(([label, text]) => {
  const svg = lettering([text], { track: 18 });
  const adv = (lineWidth(text) / text.length / 100).toFixed(2);
  return `<h1>${label} <i>— advance/cap ${adv}</i></h1><div class="trial">${svg}</div>`;
}).join('');

const cells = Object.keys(GLYPHS)
  .filter((ch) => resolve(ch).d.length)
  .map((ch) => {
    const wide = resolve(ch);
    const narrow = resolve(ch.toLowerCase());
    const draw = (g) => {
      const cap = g.cap ? ` stroke-linecap="${g.cap}"` : '';
      return `<svg viewBox="-8 -14 ${g.w + 16} 128">` +
        `<line x1="-8" y1="100" x2="${g.w + 8}" y2="100" class="g"/>` +
        `<line x1="-8" y1="0" x2="${g.w + 8}" y2="0" class="g"/>` +
        `<line x1="0" y1="-14" x2="0" y2="114" class="g"/>` +
        `<line x1="${g.w}" y1="-14" x2="${g.w}" y2="114" class="g"/>` +
        g.d.map((d) => `<path d="${d}"${cap}/>`).join('') + `</svg>`;
    };
    return `<div class="cell"><b>${esc(ch)}</b><i>${wide.w} / ${narrow.w}</i>` +
      `<div class="pair"><div style="flex:${wide.w}">${draw(wide)}</div>` +
      `<div style="flex:${narrow.w}">${draw(narrow)}</div></div></div>`;
  }).join('');

await writeFile('proof.html', `<!doctype html><meta charset="utf-8"><title>Broad proof</title>
<style>
  body{margin:0;background:#fcfdff;color:#1a1815;font:14px/1.4 system-ui;padding:40px}
  .wrap{max-width:1240px;margin:0 auto}
  h1{font:600 12px/1 system-ui;letter-spacing:.16em;text-transform:uppercase;color:#9a958a;margin:44px 0 14px}
  h1 i{font-style:normal;color:#c9c2b2;letter-spacing:.06em}
  .trial{outline:1px dashed #e0dcd2}
  .broad{width:100%;height:auto;display:block}
  svg{fill:none;stroke:#1a1815;stroke-width:${STROKE};stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:8}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:24px}
  .cell{position:relative;border:1px solid #e6e3db;padding:26px 12px 12px;background:#fff}
  .cell .pair{display:flex;align-items:flex-end;gap:10px}
  .cell svg{width:100%;height:auto;display:block}
  .cell b{position:absolute;top:5px;left:8px;font:600 11px/1 system-ui;color:#c93123}
  .cell i{position:absolute;top:5px;right:8px;font:11px/1 system-ui;color:#c9c2b2;font-style:normal}
  .cell .g{stroke:#c93123;stroke-width:1;opacity:.3}
</style>
<div class="wrap">${specimens}<h1>glyph set <i>— wide / narrow, drawn to scale</i></h1><div class="grid">${cells}</div></div>`);

console.log('proof.html written');
