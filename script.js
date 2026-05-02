/* khevin-mituti / portfolio — interactive layer
   Order: utilities → namespace switcher → smooth scroll → hero reveal →
          scroll-progress → section observer → custom cursor.
   Every kinetic block guards prefers-reduced-motion and pointer: coarse. */

(() => {
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  /* ——— Contact links · single source of truth ———
     Edit this list to update every contact-link block on the site
     (homepage contact, about-me, etc). Any element marked with
     [data-contact-links] is rendered from this config. */
  const CONTACT_LINKS = [
    { kind: 'Email',    label: 'hi@khevin.com',    href: 'mailto:hi@khevin.com' },
    { kind: 'LinkedIn', label: '/in/khevin',       href: 'https://www.linkedin.com/in/khevin', external: true },
    { kind: 'Writing',  label: 'medium / @khevin', href: 'https://medium.com/@khevin',         external: true },
  ];

  $$('[data-contact-links]').forEach((host) => {
    host.classList.add('contact-links');
    host.innerHTML = CONTACT_LINKS.map((l) => {
      const ext = l.external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${l.href}"${ext}><span>${l.kind}</span><span class="v">${l.label}</span></a>`;
    }).join('');
  });

  /* ——— Namespace switcher ——— */
  (() => {
    const trigger = document.getElementById('ns-trigger');
    const panel = document.getElementById('ns-panel');
    if (!trigger || !panel) return;

    const options = $$('[role="option"]', panel);
    const setOpen = (state) => {
      trigger.setAttribute('aria-expanded', String(state));
      panel.hidden = !state;
      if (state) (panel.querySelector('.current') || options[0])?.focus();
    };
    const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!isOpen());
    });
    trigger.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
    });

    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        const href = opt.dataset.href;
        if (href) window.location.href = href;
      });
      opt.addEventListener('keydown', (e) => {
        const idx = options.indexOf(opt);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          options[(idx + 1) % options.length].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          options[(idx - 1 + options.length) % options.length].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const href = opt.dataset.href;
          if (href) window.location.href = href;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
          trigger.focus();
        } else if (e.key === 'Tab') {
          setOpen(false);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!isOpen()) return;
      if (e.target.closest('#ns-trigger') || e.target.closest('#ns-panel')) return;
      setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        trigger.focus();
      }
    });
  })();

  /* ——— Mobile nav toggle (hamburger) ———
     Mirrors the design-expert pattern documented in system.md. */
  (() => {
    const toggle = document.getElementById('nav-toggle');
    const panel = document.getElementById('nav-primary');
    if (!toggle || !panel) return;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = (state) => {
      toggle.setAttribute('aria-expanded', String(state));
      toggle.setAttribute('aria-label', state ? 'Close menu' : 'Open menu');
      if (state) panel.setAttribute('data-open', 'true');
      else panel.removeAttribute('data-open');
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!isOpen());
    });

    panel.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (!isOpen()) return;
      if (e.target.closest('#nav-toggle') || e.target.closest('#nav-primary')) return;
      setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });

    const mql = matchMedia('(min-width: 801px)');
    mql.addEventListener('change', (e) => { if (e.matches && isOpen()) setOpen(false); });
  })();

  /* ——— Smooth in-page scroll ——— */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({
        top: t.getBoundingClientRect().top + window.scrollY - 60,
        behavior: reduced ? 'auto' : 'smooth',
      });
    });
  });

  /* ——— Hero cascade reveal ——— */
  (() => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hero.classList.add('in-view'));
    });
  })();

  /* ——— Scroll-progress hairline ——— */
  (() => {
    const bar = document.querySelector('.scroll-progress');
    if (!bar || reduced) return;
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct.toFixed(2) + '%';
      ticking = false;
    };
    update();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  })();

  /* ——— Section observer + current-section indicator ——— */
  (() => {
    const indicator = document.querySelector('.current-section');
    const sections = $$('section[id]');
    const indexLinks = $$('.index-nav a');
    if (!sections.length) return;

    const labels = {
      'about': '01 — About',
      'companies': '02 — Companies',
      'responsibilities': '03 — Responsibilities',
      'work': '04 — Selected work',
      'smaller': '05 — Smaller bets',
      'process': '06 — Process & notes',
    };

    let currentId = null;
    const setCurrent = (id) => {
      if (id === currentId) return;
      currentId = id;
      if (indicator) indicator.textContent = id ? labels[id] || '' : '';
      indexLinks.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    };

    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) setCurrent(visible[0].target.id);
    }, {
      threshold: [0.15, 0.4],
      rootMargin: '-80px 0px -45% 0px',
    });

    sections.forEach((s) => obs.observe(s));
  })();

  /* ——— Custom cursor mark ——— */
  (() => {
    if (reduced || coarse) return;
    const cursor = document.querySelector('.cursor-mark');
    if (!cursor) return;
    const targets = $$('.project-strip, .wayfinder');
    if (!targets.length) return;

    let mx = 0, my = 0, cx = 0, cy = 0;
    const lerp = 0.22;

    const tick = () => {
      cx += (mx - cx) * lerp;
      cy += (my - cy) * lerp;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    targets.forEach((t) => {
      t.addEventListener('mouseenter', () => cursor.classList.add('active'));
      t.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });

    requestAnimationFrame(tick);
  })();

  /* ——— FAVO · field-cut reveal (legacy, kept for back-compat) ——— */
  $$('.field-cut').forEach((el) => {
    const toggle = el.querySelector('.toggle');
    if (!toggle) return;
    const setState = (state) => {
      el.dataset.state = state;
      toggle.textContent = state === 'cut' ? 'Show all 17 ↑' : 'Cut to four ↘';
      toggle.setAttribute('aria-pressed', String(state === 'cut'));
    };
    toggle.addEventListener('click', () => {
      const next = el.dataset.state === 'cut' ? 'all' : 'cut';
      setState(next);
    });
  });

  /* ——— FAVO · logo evolution toggle (Aiyu ↔ Favo) ——— */
  $$('.logo-evolution').forEach((el) => {
    const buttons = $$('.controls button[data-state]', el);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const state = btn.dataset.state;
        el.dataset.state = state;
        buttons.forEach((b) => {
          b.classList.toggle('active', b.dataset.state === state);
          b.setAttribute('aria-pressed', String(b.dataset.state === state));
        });
      });
    });
  });

  /* ——— SPACES · park-and-go state machine ——— */
  $$('.park-proto').forEach((el) => {
    const timerEl = el.querySelector('.timer');
    let timerInterval = null;
    let startTime = 0;

    const tick = () => {
      if (!timerEl) return;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    };

    const setState = (state) => {
      el.dataset.state = state;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (state === 'active' && timerEl) {
        startTime = Date.now();
        tick();
        if (!reduced) timerInterval = setInterval(tick, 1000);
      } else if (state === 'idle' && timerEl) {
        timerEl.textContent = '00:00';
      }
    };

    el.querySelectorAll('button.action').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'start') setState('active');
        else if (action === 'stop') setState('done');
        else if (action === 'reset') setState('idle');
      });
    });
  });

  /* ——— AMWAY · before/after image-comparison slider ——— */
  $$('.compare-slider').forEach((el) => {
    const handle = el.querySelector('.handle');
    if (!handle) return;
    const update = () => el.style.setProperty('--pos', handle.value);
    handle.addEventListener('input', update);
    update();
  });
})();
