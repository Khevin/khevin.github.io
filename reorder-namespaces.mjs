/* Makes the namespace switcher identical on every page that carries one.
 *
 * Two things drift here and both did. The ORDER has to match everywhere or the
 * menu shifts under the pointer as you move between sites, which is the one
 * thing a persistent switcher must not do. And the CONTENTS drift silently: the
 * three case-study pages still listed two namespaces, having been written
 * before skillstone and nihongo existed, and nothing had ever noticed.
 *
 * So this rebuilds each panel from one definition rather than patching what it
 * finds. Depth-aware — pages in projects/ need ../ — and it keeps whichever
 * namespace that page belongs to marked as current.
 *
 *   node reorder-namespaces.mjs
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const slash = (p) => p.split(path.sep).join('/');

/* The canon. `href` takes the prefix a page needs to reach the repo root. */
const NAMESPACES = [
  { key: 'portfolio',     ns: 'khevin-mituti', href: (up) => `${up}index.html`,         desc: 'the work — what khevin ships for clients' },
  { key: 'design-expert', ns: 'khev-tools',    href: (up) => `${up}design-expert.html`, desc: 'the plugin — what khevin makes for designers' },
  { key: 'skillstone',    ns: 'khevin-mituti', href: (up) => `${up}skillstone/`,        desc: 'the character sheet — what khevin keeps for himself' },
  { key: 'nihongo',       ns: 'khevin-mituti', href: (up) => `${up}nihongo.html`,       desc: 'the study space — what khevin is learning' },
];

const files = [];
for (const dir of ['.', 'projects', 'skillstone']) {
  for (const name of await readdir(dir)) {
    if (name.endsWith('.html')) files.push(slash(path.join(dir, name)).replace(/^\.\//, ''));
  }
}

let changed = 0;
for (const rel of files) {
  let s = await readFile(rel, 'utf8');
  const m = s.match(/(<ul class="ns-(?:panel|list)"[^>]*>)([\s\S]*?)(<\/ul>)/);
  if (!m) continue;
  const [whole, open, body, close] = m;

  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  const inProjects = rel.startsWith('projects/');
  const inSkillstone = rel.startsWith('skillstone/');
  const up = inProjects || inSkillstone ? '../' : './';

  /* Which namespace is this page? Prefer what it already claims; fall back to
     where it sits, which is what the case-study pages need. */
  const claimed = body.match(/class="current"[\s\S]*?<span class="child">([^<]+)<\/span>/)
    || body.match(/<span class="child">([^<]+)<\/span>(?=[\s\S]*?class="current")/);
  let current = claimed?.[1];
  if (!NAMESPACES.some((n) => n.key === current)) {
    current = inSkillstone ? 'skillstone'
      : rel === 'design-expert.html' ? 'design-expert'
      : rel === 'nihongo.html' ? 'nihongo'
      : 'portfolio';
  }

  const item = (n) => {
    const isCur = n.key === current;
    // skillstone is its own root, so it links to ./ rather than ../skillstone/
    const href = inSkillstone && n.key === 'skillstone' ? './' : n.href(up);
    return [
      `      <li role="option" aria-selected="${isCur}" data-href="${href}"${isCur ? ' class="current" tabindex="0"' : ' tabindex="-1"'}>`,
      `        <span class="ns-row">`,
      `          <span class="mark" aria-hidden="true">${isCur ? '✓' : ''}</span>`,
      `          <span>${n.ns}<span class="slash">/</span><span class="child">${n.key}</span></span>`,
      `        </span>`,
      `        <span class="ns-desc">${n.desc}</span>`,
      `      </li>`,
    ].join(nl);
  };

  const rebuilt = open + nl + NAMESPACES.map(item).join(nl) + nl + '    ' + close;
  if (rebuilt === whole) { console.log(`  ${rel.padEnd(24)} ok`); continue; }

  const had = [...body.matchAll(/<span class="child">([^<]+)<\/span>/g)].map((x) => x[1]);
  s = s.replace(whole, rebuilt);
  await writeFile(rel, s, 'utf8');
  changed += 1;
  console.log(`  ${rel.padEnd(24)} [${had.join(', ')}] → current: ${current}`);
}
console.log(`\n${changed} panel(s) rebuilt to the canon.`);
