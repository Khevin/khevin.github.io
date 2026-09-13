/* Title font selector — an exploration tool, not shipping UI.
 *
 * Injects a picker into the nav and drives the display type through three
 * custom properties: --display-font, --display-track, --display-weight.
 * The choice persists in localStorage so it survives clicking through the
 * four pages.
 *
 * The licensed faces Khevin asked for (Riking, Ezra, Futura Black,
 * TT Travels Pro, Construction) cannot be fetched and self-hosted. They are
 * reached through local() instead, which means they only render on a machine
 * where they are installed. So every candidate is PROBED before it is listed,
 * and the ones that did not resolve go into a disabled group that says so —
 * otherwise the picker would quietly show Arial and call it Futura Black,
 * and a judgement would get made about the wrong typeface.
 */
(() => {
  const KEY = 'signal-title-font';

  const { selfHosted: SELF_HOSTED, licensed: LICENSED } = window.SIGNAL_FONTS || { selfHosted: [], licensed: [] };
  const ALL = [...SELF_HOSTED, ...LICENSED];

  /* Canvas metrics, not document.fonts.check() — check() is unreliable for
     fonts installed on the system but never declared in an @font-face rule,
     which is exactly the case that matters here. A family that failed to
     resolve measures identically to the generic it fell back to. */
  const ctx = document.createElement('canvas').getContext('2d');
  const SAMPLE = 'WHOAmMiljl 0123 ggyy';
  const GENERICS = ['monospace', 'serif', 'sans-serif'];
  const width = (font) => { ctx.font = `72px ${font}`; return ctx.measureText(SAMPLE).width; };
  const resolves = (family) =>
    GENERICS.every((g) => width(`"${family}", ${g}`) !== width(g));

  const apply = (font) => {
    const root = document.documentElement.style;
    root.setProperty('--display-font', `"${font.family}"`);
    root.setProperty('--display-track', font.track);
    root.setProperty('--display-weight', String(font.weight));
  };

  const build = (available) => {
    const nav = document.querySelector('nav.top .inner');
    const primary = nav && nav.querySelector('ul.primary');
    if (!nav || !primary) return;

    const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
    const current = available.find((f) => f.id === saved) || available[0];
    if (current) apply(current);

    const opt = (f) =>
      `<option value="${f.id}"${f.id === current?.id ? ' selected' : ''}>` +
      `${f.label}${f.note ? ` · ${f.note}` : ''}</option>`;

    const missing = ALL.filter((f) => !available.includes(f));
    const wrap = document.createElement('label');
    wrap.className = 'font-pick';
    wrap.innerHTML =
      '<span class="font-pick__k">titles</span>' +
      '<select class="font-pick__sel" aria-label="Title typeface">' +
        `<optgroup label="Self-hosted">${available.filter((f) => SELF_HOSTED.includes(f)).map(opt).join('')}</optgroup>` +
        (available.some((f) => LICENSED.includes(f))
          ? `<optgroup label="Installed on this machine">${available.filter((f) => LICENSED.includes(f)).map(opt).join('')}</optgroup>`
          : '') +
        (missing.length
          ? `<optgroup label="Not installed — cannot be shown" disabled>${missing.map((f) => `<option>${f.label}</option>`).join('')}</optgroup>`
          : '') +
      '</select>';

    wrap.querySelector('select').addEventListener('change', (e) => {
      const font = available.find((f) => f.id === e.target.value);
      if (!font) return;
      apply(font);
      try { localStorage.setItem(KEY, font.id); } catch { /* private mode */ }
    });

    nav.insertBefore(wrap, primary);
  };

  const start = async () => {
    /* Self-hosted faces need loading before they can be measured, or they all
       report their fallback's width and the probe calls them missing. */
    await Promise.all(SELF_HOSTED.map((f) =>
      document.fonts.load(`${f.weight} 72px "${f.family}"`).catch(() => {})
    ));
    const available = ALL.filter((f) => resolves(f.family));
    build(available.length ? available : SELF_HOSTED.slice(0, 1));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
