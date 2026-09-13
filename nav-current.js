/* Marks the nav link for where you are — by page, and on the home page also by
 * how far you have scrolled.
 *
 * books.html ships `aria-current="page"` by hand; the other pages do not, and
 * adding it in markup means editing every one. Setting it here keeps that in a
 * single place — and because it is `aria-current` rather than a class, a screen
 * reader announces the current page rather than the styling being the only
 * signal.
 *
 * The home page is the interesting case. Two of its nav items are in-page
 * anchors — Home at the top, Work at #clients — so which one is "current"
 * depends on the scroll position, not the URL. Once you reach the work region
 * Work lights up and stays lit to the end of it; clicking Work gets there the
 * same way, so the two behave identically without being wired separately.
 */
(() => {
  const links = [...document.querySelectorAll('nav.top ul.primary a')];
  if (!links.length) return;

  const norm = (p) => p.replace(/\/index\.html$/, '/');
  const here = norm(location.pathname);
  const pathOf = (a) => norm(new URL(a.getAttribute('href'), location.href).pathname);

  const set = (link) => {
    for (const a of links) {
      if (a === link) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  };

  /* Links that point at this very page. On a sub-page there is one and it is
     the answer; on the home page there are two (Home and Work) and the scroll
     decides between them. */
  const onThisPage = links.filter((a) => pathOf(a) === here);
  set(onThisPage[0] ?? null);
  if (onThisPage.length < 2) return;

  /* Map each in-page link to the stretch of the document it stands for. Work
     covers the whole run of work sections, not just the one it links to —
     "until the end" of the work is the ask, and #clients alone would drop out
     again the moment you scrolled past the logos. */
  const REGIONS = {
    '#clients': ['clients', 'work', 'snippets'],
  };

  const spans = onThisPage.map((a) => {
    const hash = new URL(a.getAttribute('href'), location.href).hash;
    const ids = REGIONS[hash] || (hash ? [hash.slice(1)] : []);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    return { link: a, els };
  }).filter((s) => s.els.length);

  if (!spans.length) return;

  const home = onThisPage[0];
  let raf = 0;
  const update = () => {
    raf = 0;
    /* The line just under the header is what counts as "where you are" —
       measuring from the viewport top switches a section early, while it is
       still hidden behind the nav. */
    /* The offset has to be at least as generous as the one script.js scrolls to
       when a nav anchor is clicked (nav height + 12), or clicking Work lands
       four pixels short of its own trigger and the item you just pressed does
       not light. Same number would be exact; a little more is safe. */
    const line = (document.querySelector('nav.top')?.getBoundingClientRect().height ?? 60) + 24;
    /* The last region that has STARTED wins, rather than the one containing the
       line. Work then stays lit through everything past it instead of dropping
       back to Home over the sections that have no nav item of their own — and
       there is always exactly one marker, which a nav that goes blank halfway
       down the page does not manage. */
    let active = home;
    for (const { link, els } of spans) {
      const top = Math.min(...els.map((e) => e.getBoundingClientRect().top));
      if (top <= line) active = link;
    }
    set(active);
  };

  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
})();
