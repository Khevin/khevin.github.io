import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const html = source
  .replace('<head>', '<head>\n<base href="../" />\n<meta name="robots" content="noindex,nofollow" />\n<script>document.documentElement.dataset.direction = ["signal","studio","afterhours"].includes(new URLSearchParams(location.search).get("direction")) ? new URLSearchParams(location.search).get("direction") : "signal";</script>')
  .replace(/<link href="https:\/\/fonts.googleapis.com\/css2[^>]+>/, '<link rel="stylesheet" href="explorations/fonts.css" />')
  .replace('<link rel="stylesheet" href="styles.css" />', '<link rel="stylesheet" href="styles.css" />\n<link rel="stylesheet" href="explorations/directions.css" />')
  .replace('<body>', '<body>\n<a class="skip-link" href="#top">Skip to content</a>\n<div class="review-bar" aria-label="Design directions"><a class="review-home" href="explorations/">All directions</a><div><a data-direction-link="signal" href="explorations/portfolio.html?direction=signal">01 Signal</a><a data-direction-link="studio" href="explorations/portfolio.html?direction=studio">02 Studio</a><a data-direction-link="afterhours" href="explorations/portfolio.html?direction=afterhours">03 After Hours</a></div><a href="index.html" target="_blank" rel="noopener">Original ↗</a></div>')
  .replace('href="#clients">work', 'href="#work">work')
  .replace('<div class="left">\n', '<div class="left">\n')
  .replace('<h1 class="hx-display">', '<div class="hero-eyebrow"><span>Independent designer</span><span>Product / Brand / Experience</span></div><h1 class="hx-display">')
  .replace('<span class="b">solves &amp; ships.</span>', '<span class="b">solves <span class="amp">&amp;</span> ships.</span>')
  .replace('<div class="right">', '<div class="right"><a class="practice-mark" href="#work" aria-label="Explore fifteen years of design work"><span class="mark-years">15</span><span class="mark-unit">Years in practice</span><span class="mark-arrow" aria-hidden="true">↘</span></a>')
  .replace('</h1>', '</h1><a class="hero-cta" href="#work">Explore selected work <span aria-hidden="true">↘</span></a>')
  .replace('<script src="./script.js" defer></script>', '<script src="./script.js" defer></script>\n<script src="explorations/directions.js" defer></script>');
await writeFile(new URL('portfolio.html', import.meta.url), html);
console.log('Built three directions from the current homepage.');
