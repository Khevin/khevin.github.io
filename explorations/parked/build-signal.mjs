import { readFile, writeFile } from 'node:fs/promises';

/* Builds the Signal exploration: index plus process, notes and library.
 *
 * Every page is generated from its original, never hand-edited. Each page
 * declares the changes it makes to the original body; the build reverses all of
 * them at the end and refuses to write unless what is left matches the source
 * byte for byte. That is the whole safety story — the exploration can restyle
 * freely because it can prove it never quietly restructured.
 */

const HATS_FROM = '../assets/hats.png';
const HATS_TO = '../assets/hats-signal.png';

/* Inter-page links are rewritten so navigating inside the exploration stays
   inside the exploration. Anything not listed falls through to the original. */
const PAGE_MAP = {
  './index.html': './signal-original.html',
  './process.html': './signal-process.html',
  './blog.html': './signal-blog.html',
  './books.html': './signal-library.html',
};

const PAGES = [
  {
    source: 'index.html',
    out: 'signal-original.html',
    title: 'Signal · Home — Khevin Mituti',
    css: ['./display-fonts.css', './signal.css', './signal-original.css'],
    swaps: [{ from: HATS_FROM, to: HATS_TO, all: true }],
  },
  { source: 'process.html', out: 'signal-process.html', title: 'Signal · Process — Khevin Mituti', css: ['./display-fonts.css', './signal.css'] },
  { source: 'blog.html', out: 'signal-blog.html', title: 'Signal · Notes — Khevin Mituti', css: ['./display-fonts.css', './signal.css'] },
  { source: 'books.html', out: 'signal-library.html', title: 'Signal · Library — Khevin Mituti', css: ['./display-fonts.css', './signal.css'] },
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let built = 0;
for (const page of PAGES) {
  const source = await readFile(new URL(`../${page.source}`, import.meta.url), 'utf8');

  /* Resolve local assets one directory up and point inter-page links at their
     Signal twin. Fragments have to survive the rewrite: `./index.html#contact`
     is a nav link, and leaving it alone drops the visitor out of the
     exploration and back onto the live site mid-browse. */
  const rebased = source.replace(/\b(href|src|srcset|data-href)="([^"]+)"/g, (m, attr, value) => {
    if (/^(?:https?:|mailto:|data:|\/|#)/.test(value)) return m;
    const hash = value.indexOf('#');
    const path = hash === -1 ? value : value.slice(0, hash);
    const frag = hash === -1 ? '' : value.slice(hash);
    if (!path) return m;
    const norm = path.startsWith('./') ? path : `./${path}`;
    if (PAGE_MAP[norm]) return `${attr}="${PAGE_MAP[norm]}${frag}"`;
    return `${attr}="../${path.replace(/^\.\//, '')}${frag}"`;
  });

  const swaps = page.swaps ?? [];
  let html = rebased;
  for (const s of swaps) {
    if (!html.includes(s.from)) {
      throw new Error(`${page.source}: expected to find\n  ${s.from.slice(0, 90)}…\nbut it is not there. Update the swap.`);
    }
    html = s.all ? html.replaceAll(s.from, s.to) : html.replace(s.from, s.to);
  }

  const links = page.css.map((href) => `<link rel="stylesheet" href="${href}" />`).join('\n');
  html = html
    .replace(/<title>[^<]+<\/title>/, `<title>${page.title}</title>`)
    .replace(/<link rel="preconnect"[^>]+>\r?\n/g, '')
    .replace(/<link href="https:\/\/fonts.googleapis.com\/css2[^>]+>/, '<link rel="stylesheet" href="./fonts.css" />')
    .replace(
      /<link rel="stylesheet" href="\.\.\/styles\.css" \/>/,
      `<link rel="stylesheet" href="../styles.css" />\n${links}\n` +
      '<script src="./signal.js" defer></script>\n' +
      '<meta name="robots" content="noindex,nofollow" />'
    );

  /* Reverse every declared swap. Link rebasing already happened on both sides
     of this comparison, so it cancels out and what is left is exactly the
     question worth asking: did anything change that we did not declare? */
  let restored = html.slice(html.indexOf('<body'));
  for (const s of [...swaps].reverse()) {
    restored = s.all
      ? restored.replaceAll(s.to, s.from)
      : restored.replace(new RegExp(escapeRe(s.to)), s.from);
  }
  if (restored !== rebased.slice(rebased.indexOf('<body'))) {
    throw new Error(`${page.source}: body changed beyond the declared swaps.`);
  }

  await writeFile(new URL(page.out, import.meta.url), html);
  built += 1;
  console.log(`  ${page.source.padEnd(14)} → ${page.out}`);
}

console.log(`\nBuilt ${built} pages. Bodies verified unchanged apart from the declared swaps.`);
