import { readFile, writeFile, mkdir } from 'node:fs/promises';
const dir = new URL('../fonts/', import.meta.url);
await mkdir(dir, { recursive:true });
const css = await readFile(new URL('font-source.css', import.meta.url), 'utf8');
const blocks = [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(m => m[0]).filter(block => /font-weight: (400|500|600|700);/.test(block));
const local = await Promise.all(blocks.map(async block => {
  const family = block.match(/font-family: '([^']+)'/)[1];
  const weight = block.match(/font-weight: (\d+)/)[1];
  const style = block.match(/font-style: (\w+)/)[1];
  const url = block.match(/url\(([^)]+)\)/)[1];
  const name = `${family.toLowerCase().replaceAll(' ', '-')}-${weight}-${style}.ttf`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  await writeFile(new URL(name, dir), Buffer.from(await response.arrayBuffer()));
  return block.replace(url, `./fonts/${name}`);
}));
await writeFile(new URL('../fonts.css', import.meta.url), '/* Self-hosted fonts from Google Fonts. SIL Open Font License; see fonts/OFL-*.txt. */\n' + local.join('\n'));
await Promise.all(['archivoblack','manrope','spacegrotesk','instrumentserif'].map(async family => {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${family} license: ${response.status}`);
  await writeFile(new URL(`OFL-${family}.txt`, dir), await response.text());
}));
console.log(`Downloaded ${local.length} font faces and four licenses.`);
