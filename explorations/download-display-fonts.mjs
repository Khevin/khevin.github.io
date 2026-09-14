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
   used only to pull the licence next to the binary.

   Two optional fields serve the hero's weight animation. `text` asks Google for
   a subset carrying only those characters, which is what makes a variable face
   affordable here: the whole wght axis over the sixteen letters of one headline
   is 10KB, where the latin range of the same face is 67KB. `as` renames the
   family on the way out, so the variable cut can sit beside the static 900
   without the two being picked for each other's text — the hero opts in by
   name, and nothing else on the site changes. */
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
  /* The hero headline, and only it, on a live weight axis. The text is the
     headline verbatim: change that line and this has to be changed with it, or
     the new letters fall through the unicode-range to the static 900 and the
     one word that is missing stops animating. */
  {
    spec: 'Fraunces:opsz,wght@9..144,100..900',
    slug: 'fraunces',
    as: 'Fraunces Flex',
    text: 'Design that solves & ships.',
  },
];

// A modern UA gets woff2 back; without one Google serves ttf.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const faces = [];
const failed = [];

for (const { spec, slug, as, text } of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${spec}` +
    (text ? `&text=${encodeURIComponent(text)}` : '') + '&display=swap';
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

    const family = as || latin.match(/font-family:\s*'([^']+)'/)[1];
    /* Kept whole rather than reduced to a number: a variable face answers with
       a range ("100 900"), and that range is the declaration that tells the
       browser the axis is there to animate. Collapsing it to its last value
       would ship the file and then pin it shut. */
    const weight = (latin.match(/font-weight:\s*([\d\s]+);/) || [, '400'])[1].trim();
    const style = (latin.match(/font-style:\s*(\w+)/) || [, 'normal'])[1];
    const src = latin.match(/url\(([^)]+)\)/)[1];
    /* A text subset covers only what was asked for, so it has to say so — the
       range is what lets anything outside it fall through to the full face
       instead of rendering as nothing. */
    const range = text ? latin.match(/unicode-range:\s*([^;]+);/)?.[1] : null;

    const bin = await fetch(src);
    if (!bin.ok) throw new Error(`font ${bin.status}`);
    const name = as
      ? `${slugify(as)}.woff2`
      : `${slugify(family)}-${weight}${style === 'italic' ? '-italic' : ''}.woff2`;
    await writeFile(new URL(name, dir), Buffer.from(await bin.arrayBuffer()));

    faces.push(
      `@font-face {\n` +
      `  font-family: '${family}';\n` +
      `  font-style: ${style};\n` +
      `  font-weight: ${weight};\n` +
      `  font-display: swap;\n` +
      `  src: url(./fonts/${name}) format('woff2');\n` +
      (range ? `  unicode-range: ${range};\n` : '') +
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
