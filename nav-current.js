/* Marks the nav link for the page you are on.
 *
 * books.html already ships `aria-current="page"` by hand; the other three
 * pages do not, and the exploration cannot add it without a declared body swap
 * in the build. Setting it here keeps the markup untouched and gets the same
 * result on every page — and because it is `aria-current` rather than a class,
 * a screen reader announces the current page for free rather than the styling
 * being the only signal.
 */
(() => {
  const links = document.querySelectorAll('nav.top ul.primary a');
  if (!links.length) return;

  const here = location.pathname.replace(/\/index\.html$/, '/');
  /* "Home" and "Work" both point at the home page (one to #top, one to
     #clients), so take the first match rather than lighting up both. */
  const match = [...links].find((a) => {
    const path = new URL(a.getAttribute('href'), location.href).pathname
      .replace(/\/index\.html$/, '/');
    return path === here;
  });

  links.forEach((a) => a.removeAttribute('aria-current'));
  if (match) match.setAttribute('aria-current', 'page');
})();
