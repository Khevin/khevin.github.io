/* type-tester: a title typeface selector you can drop into any page.
 *
 *   <script src="./type-tester-faces.js"></script>
 *   <script src="./type-tester.js" data-measure="h1"></script>
 *   <link rel="stylesheet" href="./display-fonts.css">
 *   <link rel="stylesheet" href="./type-tester.css">
 *   ...
 *   <div class="type-tester"></div>
 *
 * The page needs one thing of its own: every heading must take its family
 * from a custom property (--title by default) rather than naming a font.
 * That is the whole integration. Nothing else here knows anything about the
 * page it is running in.
 *
 * Both scripts go in the <head>, not deferred. This one writes the face rules
 * into a <style> block and restores the stored choice before the body is
 * parsed, so a reload does not flash the default face first.
 *
 * ——— On --title-scale ———
 *
 * Display faces do not fill the em by the same amount. Set at one font-size,
 * a headline runs more than twice as long in Climate Crisis as in Fraunces,
 * so swapping the family alone either leaves the headline tiny or breaks it
 * onto a second line. Every face therefore carries a scale: the base face's
 * width ratio over its own.
 *
 * Those numbers used to be measured by hand and written into the stylesheet,
 * which is exactly what made this hard to reuse: the measurements belong to
 * one headline in one column, and copying the file to another project carried
 * twenty-seven numbers that were all quietly wrong. So the control measures
 * instead. Point data-measure at the headline that has to hold its line, and
 * each face is measured against it the first time it is chosen, then cached in
 * localStorage so later visits apply it before the first paint.
 */
(function () {
  'use strict';

  var config = document.currentScript;
  var read = function (key, fallback) {
    var v = config && config.dataset[key];
    return v === undefined || v === '' ? fallback : v;
  };

  var OPTIONS = {
    mount: read('mount', '.type-tester'),
    /* The custom properties written on :root. A project that already calls
       its token something else renames it here rather than in its stylesheet. */
    varFamily: read('var', '--title'),
    varAxes: read('varAxes', '--title-vf'),
    varScale: read('varScale', '--title-scale'),
    /* The element whose line length must not change. Leave it unset and the
       control skips scaling entirely, which is the right choice for a page
       whose headings are free to rewrap. */
    measure: read('measure', ''),
    storage: read('storage', 'type-tester:face'),
    label: read('label', 'Typeface for every title on this page'),
  };

  var MANIFEST = window.TYPE_TESTER;
  if (!MANIFEST) return;

  var FACES = [];
  MANIFEST.categories.forEach(function (cat) {
    cat.faces.forEach(function (face) {
      FACES.push({
        id: face.id,
        family: face.family,
        name: face.name,
        note: face.note,
        axes: face.vf || 'normal',
        stack: '"' + face.family + '", ' + cat.fallback,
        category: cat,
      });
    });
  });
  var byId = function (id) {
    for (var i = 0; i < FACES.length; i++) if (FACES[i].id === id) return FACES[i];
    return null;
  };
  var BASE = byId(MANIFEST.base) || FACES[0];

  /* ——— storage ——— */

  var store = {
    get: function (key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try {
        if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
      } catch (e) { /* private window, or storage is off */ }
    },
  };
  var RATIO_KEY = OPTIONS.storage + ':ratios';

  /* Ratios are cached against the exact text they were measured from. Change
     the headline and every cached number is wrong by some amount, so the
     sample is stored beside them and a mismatch throws the lot away. */
  var cache = { sample: '', ratios: {} };
  try {
    var raw = store.get(RATIO_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed.sample === 'string' && parsed.ratios) cache = parsed;
    }
  } catch (e) { /* malformed, start over */ }

  /* ——— the face rules ——— */

  /* Written as CSS rather than set on the element, so the restored face is
     already in the cascade when the body is parsed. A face whose ratio has
     not been measured yet simply has no scale line, and var(--title-scale, 1)
     in the page's stylesheet leaves the size alone until it does. */
  function faceRules() {
    var out = [];
    FACES.forEach(function (face) {
      if (face.id === BASE.id) return;   /* the page's own CSS is the base */
      var decls = [
        OPTIONS.varFamily + ': ' + face.stack,
        OPTIONS.varAxes + ': ' + face.axes,
      ];
      var ratio = cache.ratios[face.id];
      var baseRatio = cache.ratios[BASE.id];
      if (ratio && baseRatio) decls.push(OPTIONS.varScale + ': ' + (baseRatio / ratio).toFixed(4));
      out.push(':root[data-face="' + face.id + '"] { ' + decls.join('; ') + '; }');
    });
    return out.join('\n');
  }

  var styleEl = document.createElement('style');
  styleEl.id = 'type-tester-faces';
  styleEl.textContent = faceRules();
  (document.head || document.documentElement).appendChild(styleEl);

  var stored = store.get(OPTIONS.storage);
  if (stored && byId(stored) && stored !== BASE.id) document.documentElement.dataset.face = stored;
  else delete document.documentElement.dataset.face;

  /* ——— measuring ——— */

  var ruler = null;
  function sampleText() {
    if (!OPTIONS.measure) return '';
    var el = document.querySelector(OPTIONS.measure);
    if (!el) return '';
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* Width per pixel of font-size, measured offscreen on one unwrapped line.
     Letter-spacing is carried across as an em value so it scales with the
     reference size instead of being frozen at whatever the headline is set
     to right now. */
  var REF = 100;
  function measure(face, sample, model) {
    if (!ruler) {
      ruler = document.createElement('span');
      ruler.setAttribute('aria-hidden', 'true');
      ruler.style.cssText =
        'position:absolute;left:-9999px;top:0;white-space:nowrap;visibility:hidden;' +
        'pointer-events:none;font-size:' + REF + 'px;line-height:1;';
      document.body.appendChild(ruler);
    }
    ruler.style.fontFamily = face.stack;
    ruler.style.fontWeight = model.weight;
    ruler.style.fontStyle = model.style;
    ruler.style.letterSpacing = model.letterSpacingEm + 'em';
    ruler.style.textTransform = model.textTransform;
    ruler.style.fontVariationSettings = face.axes;
    ruler.textContent = sample;
    return ruler.getBoundingClientRect().width / REF;
  }

  function modelFrom(el) {
    var cs = getComputedStyle(el);
    var size = parseFloat(cs.fontSize) || 16;
    var ls = parseFloat(cs.letterSpacing);
    return {
      weight: cs.fontWeight,
      style: cs.fontStyle,
      textTransform: cs.textTransform,
      letterSpacingEm: isNaN(ls) ? 0 : ls / size,
    };
  }

  /* Resolves once the face is measured, or immediately when there is nothing
     to measure against. Faces are measured in pairs with the base, because a
     ratio on its own says nothing. */
  function ensureScale(face) {
    var sample = sampleText();
    if (!sample || face.id === BASE.id) return Promise.resolve();
    if (cache.sample !== sample) cache = { sample: sample, ratios: {} };
    if (cache.ratios[face.id] && cache.ratios[BASE.id]) return Promise.resolve();

    var el = document.querySelector(OPTIONS.measure);
    var model = modelFrom(el);
    var needed = [face];
    if (!cache.ratios[BASE.id]) needed.push(BASE);

    var loads = needed.map(function (f) {
      var spec = model.style + ' ' + model.weight + ' ' + REF + 'px "' + f.family + '"';
      /* A face that fails to load is not an error worth stopping for: it
         measures at its fallback's width, which is the width it will render
         at anyway. */
      return document.fonts.load(spec, sample).catch(function () {});
    });

    return Promise.all(loads).then(function () {
      needed.forEach(function (f) { cache.ratios[f.id] = measure(f, sample, model); });
      store.set(RATIO_KEY, JSON.stringify(cache));
      styleEl.textContent = faceRules();
    });
  }

  /* ——— the control ——— */

  function build(mount) {
    mount.classList.add('tt');
    mount.innerHTML = '';

    var uid = 'tt-' + Math.random().toString(36).slice(2, 8);
    var current = byId(document.documentElement.dataset.face || BASE.id) || BASE;

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tt__trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', uid);
    trigger.setAttribute('aria-label', OPTIONS.label);
    trigger.innerHTML =
      '<span class="tt__aa" aria-hidden="true">Aa</span>' +
      '<span class="tt__name"></span>' +
      '<span class="tt__chev" aria-hidden="true">&#9662;</span>';
    var nameEl = trigger.querySelector('.tt__name');

    var panel = document.createElement('div');
    panel.className = 'tt__panel';
    panel.id = uid;
    panel.hidden = true;

    var tablist = document.createElement('div');
    tablist.className = 'tt__tabs';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Typeface categories');
    panel.appendChild(tablist);

    var lists = document.createElement('div');
    lists.className = 'tt__lists';
    panel.appendChild(lists);

    var tabs = [];
    var options = [];

    MANIFEST.categories.forEach(function (cat, index) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tt__tab';
      tab.id = uid + '-tab-' + cat.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', uid + '-list-' + cat.id);
      tab.textContent = cat.label;
      tab.dataset.cat = cat.id;
      tablist.appendChild(tab);
      tabs.push(tab);

      var list = document.createElement('ul');
      list.className = 'tt__list';
      list.id = uid + '-list-' + cat.id;
      list.setAttribute('role', 'listbox');
      list.setAttribute('aria-labelledby', tab.id);
      list.dataset.cat = cat.id;
      if (index > 0) list.hidden = true;
      lists.appendChild(list);

      cat.faces.forEach(function (faceDef) {
        var face = byId(faceDef.id);
        var li = document.createElement('li');
        li.className = 'tt__option';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.setAttribute('aria-label', face.name);
        li.tabIndex = -1;
        li.dataset.face = face.id;
        li.innerHTML =
          '<span class="tt__row">' +
            '<span class="tt__mark" aria-hidden="true"></span>' +
            '<span class="tt__specimen"></span>' +
          '</span>' +
          '<span class="tt__note"></span>';
        /* The name is set in its own face, which is the only honest preview.
           Styles go on the element because they come from data, not from a
           stylesheet that would have to know every face by name. */
        var specimen = li.querySelector('.tt__specimen');
        specimen.textContent = face.name;
        specimen.style.fontFamily = face.stack;
        specimen.style.fontVariationSettings = face.axes;
        li.querySelector('.tt__note').textContent = face.note;
        list.appendChild(li);
        options.push(li);
      });
    });

    mount.appendChild(trigger);
    mount.appendChild(panel);

    /* ——— state ——— */

    function optionsIn(catId) {
      return options.filter(function (o) { return o.closest('.tt__list').dataset.cat === catId; });
    }

    function showTab(catId, focusList) {
      tabs.forEach(function (t) {
        var on = t.dataset.cat === catId;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('is-on', on);
      });
      Array.prototype.forEach.call(lists.children, function (l) {
        l.hidden = l.dataset.cat !== catId;
      });
      if (focusList) {
        var inTab = optionsIn(catId);
        var target = inTab.filter(function (o) { return o.classList.contains('is-current'); })[0] || inTab[0];
        if (target) target.focus();
      }
    }

    function paintCurrent(face) {
      current = face;
      nameEl.textContent = face.name;
      options.forEach(function (o) {
        var on = o.dataset.face === face.id;
        o.setAttribute('aria-selected', String(on));
        o.classList.toggle('is-current', on);
        o.tabIndex = on ? 0 : -1;
        o.querySelector('.tt__mark').textContent = on ? '✓' : '';
      });
      /* Every category needs one reachable stop, or tabbing into a list that
         does not hold the current face lands nowhere. */
      MANIFEST.categories.forEach(function (cat) {
        var inTab = optionsIn(cat.id);
        if (inTab.length && !inTab.some(function (o) { return o.tabIndex === 0; })) inTab[0].tabIndex = 0;
      });
    }

    function select(face, remember) {
      /* Measured before the family changes, so the headline moves once rather
         than jumping to the wrong size and then correcting itself. */
      return ensureScale(face).then(function () {
        if (face.id === BASE.id) delete document.documentElement.dataset.face;
        else document.documentElement.dataset.face = face.id;
        if (remember) store.set(OPTIONS.storage, face.id === BASE.id ? null : face.id);
        paintCurrent(face);
      });
    }

    function setOpen(state) {
      trigger.setAttribute('aria-expanded', String(state));
      panel.hidden = !state;
      if (state) showTab(current.category.id, true);
    }
    var isOpen = function () { return trigger.getAttribute('aria-expanded') === 'true'; };

    function close(refocus) {
      setOpen(false);
      if (refocus) trigger.focus();
    }

    /* ——— events ——— */

    trigger.addEventListener('click', function () { setOpen(!isOpen()); });
    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' && !isOpen()) { event.preventDefault(); setOpen(true); }
    });

    tablist.addEventListener('click', function (event) {
      var tab = event.target.closest('.tt__tab');
      if (tab) showTab(tab.dataset.cat, false);
    });
    tablist.addEventListener('keydown', function (event) {
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      var next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === 'ArrowDown') { event.preventDefault(); showTab(tabs[index].dataset.cat, true); return; }
      else if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      if (next === null) return;
      event.preventDefault();
      showTab(tabs[next].dataset.cat, false);
      tabs[next].focus();
    });

    lists.addEventListener('click', function (event) {
      var option = event.target.closest('.tt__option');
      if (option) select(byId(option.dataset.face), true).then(function () { close(true); });
    });

    lists.addEventListener('keydown', function (event) {
      var option = event.target.closest('.tt__option');
      if (!option) return;
      var siblings = optionsIn(option.closest('.tt__list').dataset.cat);
      var index = siblings.indexOf(option);
      var next = null;
      if (event.key === 'ArrowDown') next = Math.min(index + 1, siblings.length - 1);
      else if (event.key === 'ArrowUp') next = Math.max(index - 1, 0);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = siblings.length - 1;
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(byId(option.dataset.face), true).then(function () { close(true); });
        return;
      } else if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      if (next === null) return;
      event.preventDefault();
      siblings[next].focus();
    });

    document.addEventListener('pointerdown', function (event) {
      if (isOpen() && !mount.contains(event.target)) close(false);
    });
    document.addEventListener('focusin', function (event) {
      if (isOpen() && !mount.contains(event.target)) close(false);
    });

    /* Lock the list area to the tallest category, so moving between tabs
       does not resize the panel under the pointer. The specimens have a
       fixed line-height, so a row is the same height whatever face is in
       it and this can be measured before the fonts arrive. */
    function lockHeight() {
      var wasHidden = panel.hidden;
      panel.hidden = false;
      panel.style.visibility = "hidden";
      var tallest = 0;
      Array.prototype.forEach.call(lists.children, function (list) {
        var listHidden = list.hidden;
        list.hidden = false;
        tallest = Math.max(tallest, list.getBoundingClientRect().height);
        list.hidden = listHidden;
      });
      if (tallest) lists.style.minHeight = Math.ceil(tallest) + "px";
      panel.hidden = wasHidden;
      panel.style.visibility = "";
    }

    paintCurrent(current);
    showTab(current.category.id, false);
    lockHeight();

    /* The restored face was applied from cache before paint. If its ratio was
       never cached the scale is missing, so measure it now, quietly. */
    if (current.id !== BASE.id) ensureScale(current).catch(function () {});
  }

  function start() {
    var mount = document.querySelector(OPTIONS.mount);
    if (mount) build(mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
