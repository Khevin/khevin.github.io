/* Fetches the self-hostable display candidates for the title font selector.
 *
 * Only open-licence families live here. The licensed faces Khevin asked for —
 * Riking, Ezra, Futura Black, TT Travels Pro, Construction — cannot be fetched,
 * so the selector reaches them through local() and says plainly when they are
 * not installed. See signal-fonts.js.
 *
 * woff2, not ttf: a quarter the bytes and universally supported. The older
 * download-fonts.mjs pulls ttf only because of how it was first written.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';

const dir = new URL('../fonts/', import.meta.url);   /* served from the repo root */
await mkdir(dir, { recursive: true });

/* `spec` is the css2 family query; `slug` is the google/fonts repo directory,
   used only to pull the licence next to the binary. */
const FAMILIES = [
  { spec: 'Anton',                         slug: 'anton' },
  { spec: 'Bodoni+Moda:opsz,wght@6..96,900', slug: 'bodonimoda' },
  { spec: 'Libre+Baskerville:wght@700',    slug: 'librebaskerville' },
  { spec: 'Alfa+Slab+One',                 slug: 'alfaslabone' },
  { spec: 'Unbounded:wght@800',            slug: 'unbounded' },
  { spec: 'Bungee',                        slug: 'bungee' },
  { spec: 'Syne:wght@800',                 slug: 'syne' },
  { spec: 'Climate+Crisis',                slug: 'climatecrisis' },
  { spec: 'Big+Shoulders+Display:wght@800', slug: 'bigshouldersdisplay' },
  { spec: 'Gloock',                        slug: 'gloock' },
  { spec: 'Fraunces:opsz,wght@9..144,900', slug: 'fraunces' },
  { spec: 'Fraunces:ital,opsz,wght@1,9..144,900', slug: 'fraunces' },
];

// A modern UA gets woff2 back; without one Google serves ttf.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const faces = [];
const failed = [];

for (const { spec, slug } of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`css ${res.status}`);
    const css = await res.text();

    const blocks = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/g)].map((m) => m[0]);
    /* Google emits one block per subset. Keep the latin one — it is the only
       subset this page needs, and taking them all would quadruple the download
       for glyphs no title will ever use. */
    const latin = blocks.find((b) => /unicode-range:[^;]*U\+0000-00FF/.test(b)) || blocks.at(-1);
    if (!latin) throw new Error('no @font-face in response');

    const family = latin.match(/font-family:\s*'([^']+)'/)[1];
    const weight = (latin.match(/font-weight:\s*([\d\s]+);/) || [, '400'])[1].trim().split(/\s+/).pop();
    const style = (latin.match(/font-style:\s*(\w+)/) || [, 'normal'])[1];
    const src = latin.match(/url\(([^)]+)\)/)[1];

    const bin = await fetch(src);
    if (!bin.ok) throw new Error(`font ${bin.status}`);
    const name = `${slugify(family)}-${weight}${style === 'italic' ? '-italic' : ''}.woff2`;
    await writeFile(new URL(name, dir), Buffer.from(await bin.arrayBuffer()));

    faces.push(
      `@font-face {\n` +
      `  font-family: '${family}';\n` +
      `  font-style: ${style};\n` +
      `  font-weight: ${weight};\n` +
      `  font-display: swap;\n` +
      `  src: url(./fonts/${name}) format('woff2');\n` +
      `}`
    );

    const lic = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${slug}/OFL.txt`);
    if (lic.ok) await writeFile(new URL(`OFL-${slug}.txt`, dir), await lic.text());

    console.log(`  ${family} ${weight} ${style}`.padEnd(38) + name);
  } catch (err) {
    failed.push(`${spec}: ${err.message}`);
    console.log(`  ${spec}`.padEnd(34) + `SKIPPED — ${err.message}`);
  }
}

await writeFile(
  new URL('../display-fonts.css', import.meta.url),
  '/* Self-hosted display candidates for the title selector.\n' +
  '   Fetched by download-display-fonts.mjs. SIL Open Font License;\n' +
  '   see fonts/OFL-*.txt. Re-run that script to change the set. */\n' +
  faces.join('\n') + '\n'
);

console.log(`\n${faces.length} families written to display-fonts.css.`);
if (failed.length) console.log(`${failed.length} skipped:\n  ${failed.join('\n  ')}`);
