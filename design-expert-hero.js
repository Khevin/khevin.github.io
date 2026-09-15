/* The council performs six finite design studies. No simulated live agents. */
(() => {
  const table = document.querySelector('[data-council-table]');
  if (!table || !window.KhevMotion || !window.CouncilScenes) return;
  const study = table.closest('.council-study');
  const seats = [...table.querySelectorAll('[data-council-seat]')];
  const decision = document.getElementById('council-decision');
  const title = table.querySelector('.council-decision__title');
  const verdict = table.querySelector('.council-decision__verdict');
  const drawing = table.querySelector('.council-decision__drawing');
  const note = document.getElementById('council-note');
  const label = table.querySelector('.council-decision__label');
  const principles = {
    rams: {
      title: ['Keep what', 'earns its place.'], verdict: 'Less, but better',
      note: 'Remove the extra card. Let the essential action lead.',

    },
    vignelli: {
      title: ['One system.', 'Everywhere.'], verdict: 'Consistency, by design',
      note: 'Use the same type scale and spacing, from the first screen to the last.',

    },
    kare: {
      title: ['A symbol worth', 'recognizing.'], verdict: 'Meaning at a glance',
      note: 'Pair an unfamiliar icon with a clear label. Recognition comes before decoration.',

    },
    itten: {
      title: ['Let color', 'direct attention.'], verdict: 'Contrast with purpose',
      note: 'Reserve the accent for the next action. Make its contrast do the work.',

    },
    tufte: {
      title: ['Show the data.', 'Lose the noise.'], verdict: 'Evidence before ornament',
      note: 'Remove the chart’s frame. Keep the comparison and label the values.',

    },
    'muller-brockmann': {
      title: ['A place for', 'every element.'], verdict: 'Structure before styling',
      note: 'Align the heading, content, and action to the same underlying grid.',

    }
  };

  const scope = new KhevMotion.Scope(study);
  const read = (el, prop) => getComputedStyle(el).getPropertyValue(prop).trim();
  let angle = parseFloat(read(table, '--seat-h')) || 0;
  let orbitOffset = 0.75;   /* the top of the ring, where the first seat sits */
  let active = 0, timer = 0, steps = 0, entered = false, hovered = false;
  let touring = !scope.reduced.matches;
  let resumeTimer = 0;
  const cancelResume = () => { clearTimeout(resumeTimer); resumeTimer = 0; };
  const halt = () => { clearTimeout(timer); timer = 0; };
  function resumeAfterIdle() {
    cancelResume();
    if (hovered || !scope.running || scope.reduced.matches || table.matches(':focus-within')) return;
    resumeTimer = setTimeout(() => {
      touring = true; steps = 0; updateLive();
      // Resume at the next seat. The tour ends where it began, and the seat
      // has been on screen for the whole idle wait, so re-selecting it played
      // the same study twice.
      select((active + 1) % seats.length); schedule();
    }, 8000);
  }
  // The tour has no controls. It runs on its own, waits while the pointer is
  // over the council, and picks up again once the pointer has been away a
  // while; a click, a key or focus hands the council to the reader.
  function updateLive() {
    // Automatic demonstrations never produce unsolicited announcements.
    decision.setAttribute('aria-live', touring ? 'off' : 'polite');
  }
  function stopTour() { touring = false; halt(); cancelResume(); updateLive(); }
  function schedule() {
    halt();
    if (!touring || !scope.running || hovered) return;
    timer = setTimeout(() => {
      select((active + 1) % seats.length);
      if (++steps >= seats.length) { stopTour(); resumeAfterIdle(); }
      else schedule();
    }, 4800);
  }
  // Anchor to actual component edges, not fixed illustration coordinates.
  // This keeps the connectors out of the names and central typography as
  // the layout changes, including the taller mobile arrangement.
  const connections = seats.map(seat => {
    const path = table.querySelector('[data-council-line="' + seat.dataset.councilSeat + '"]');
    const pulse = path.cloneNode(false);
    pulse.removeAttribute('data-council-line');
    pulse.setAttribute('class', 'council-connection-pulse');
    pulse.setAttribute('pathLength', '1');
    path.parentNode.append(pulse);
    return { seat, path, pulse };
  });
  function updateConnections() {
    const box = table.getBoundingClientRect(), center = decision.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const target = { x: center.x + center.width / 2, y: center.y + center.height / 2 };
    const edge = (rect, toward, gap) => {
      const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
      const dx = toward.x - x, dy = toward.y - y;
      const t = Math.min((rect.width / 2 + gap) / (Math.abs(dx) || .001), (rect.height / 2 + gap) / (Math.abs(dy) || .001));
      return { x: x + dx * t, y: y + dy * t };
    };
    const point = p => ((p.x - box.x) * 600 / box.width).toFixed(2) + ' ' + ((p.y - box.y) * 570 / box.height).toFixed(2);
    connections.forEach(({ seat, path, pulse }) => {
      const bounds = seat.getBoundingClientRect();
      // Side seats have generous hit areas. Anchor beside their artwork,
      // rather than letting those invisible hit areas swallow the line.
      if (!['rams', 'itten'].includes(seat.dataset.councilSeat)) {
        const icon = seat.querySelector('svg').getBoundingClientRect();
        bounds.x = icon.x; bounds.y = icon.y;
        bounds.width = icon.width; bounds.height = icon.height;
      }
      const origin = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const near = edge(bounds, target, 0), far = edge(center, origin, 0);
      const clearance = Math.hypot(far.x - near.x, far.y - near.y) * .2;
      const start = edge(bounds, target, Math.min(7, clearance)), end = edge(center, origin, Math.min(9, clearance));
      const d = 'M' + point(start) + 'L' + point(end);
      path.setAttribute('d', d); pulse.setAttribute('d', d);
    });
  }
  const connectionObserver = new ResizeObserver(updateConnections);
  connectionObserver.observe(table); connectionObserver.observe(decision);
  function travel(seat) {
    const target = parseFloat(read(seat, '--seat-h'));
    angle += ((target - angle) % 360 + 540) % 360 - 180;
    table.style.setProperty('--seat-h', angle + 'deg');
    table.style.setProperty('--seat-l', read(seat, '--seat-l'));
    table.style.setProperty('--seat-c', read(seat, '--seat-c'));
  }
  function animateScene() {
    drawing.querySelectorAll('[data-motion]').forEach(el => {
      const delay = Number(el.dataset.delay || 0) + 220;
      const x = Number(el.dataset.x || 0), y = Number(el.dataset.y || 0);
      if (el.dataset.motion === 'draw') {
        el.setAttribute('pathLength', '1');
        scope.animate(el, [{ strokeDasharray: '1', strokeDashoffset: 1 }, { strokeDasharray: '1', strokeDashoffset: 0 }], { delay, duration: 1200 });
      } else if (el.dataset.motion === 'remove') {
        scope.animate(el, [{ opacity: .65, transform: 'translate(0, 0) scale(1)' }, { opacity: 0, transform: 'translate(' + x + 'px, -8px) scale(.86)' }], { delay, duration: 950 });
      } else if (el.dataset.motion === 'assemble') {
        scope.animate(el, [
          { opacity: .35, transform: 'translate(' + x + 'px, ' + y + 'px) rotate(' + (el.dataset.turn || 0) + 'deg) scale(.92)' },
          { opacity: 1, transform: 'translate(0, 0) rotate(0deg) scale(1)' }
        ], { delay, duration: 1250 });
      } else {
        scope.animate(el, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay, duration: 700 });
      }
    });
  }
  function select(index) {
    active = index;
    scope.clear(); // Rapid input replaces, never queues, choreography.
    const seat = seats[index], key = seat.dataset.councilSeat;
    const principle = principles[key], scene = CouncilScenes[key];
    seats.forEach(button => {
      const selected = button === seat;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    table.querySelectorAll('[data-council-line]').forEach(line => {
      line.classList.toggle('is-selected', line.dataset.councilLine === key);
    });
    travel(seat);
    // The geometry is drawn with preserveAspectRatio="none", so the ring is an
    // ellipse on screen and rotating the element tumbled that ellipse: it
    // changed shape as it turned, which is what made the sweep look wrong.
    // Moving the dash along a stationary path instead leaves the ring alone.
    // A circle path starts at three o'clock, so the seat at the top is three
    // quarters of the way round.
    const previousOffset = orbitOffset;
    const seatOffset = ((index * 60 - 90) % 360 + 360) % 360 / 360;
    orbitOffset += ((seatOffset - orbitOffset) % 1 + 1.5) % 1 - 0.5;
    scope.animate(table.querySelector('.council-orbit-sweep'), [
      { opacity: 0, strokeDashoffset: -previousOffset },
      { opacity: .85, offset: .3 },
      { opacity: 0, strokeDashoffset: -orbitOffset }
    ], { duration: 1400, easing: 'cubic-bezier(.33,0,.2,1)' });
    title.replaceChildren(principle.title[0], document.createElement('br'), principle.title[1]);
    verdict.querySelector('span').textContent = principle.verdict;
    note.textContent = principle.note;
    label.textContent = scene.label;
    // Fixed, repository-authored SVGs; no remote or user-supplied HTML.
    drawing.innerHTML = '<svg class="council-scene" viewBox="0 0 240 120">' + scene.art + '</svg>';
    drawing.dataset.scene = key;
    updateConnections();
    animateScene();
    scope.animate(seat.querySelector('svg'), [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-6px) scale(1.08)', offset: .35 },
      { transform: 'translateY(0) scale(1)' }
    ], { duration: 1000 });
    const pulse = connections[index].pulse;
    scope.animate(pulse, [
      { opacity: 0, strokeDashoffset: .18 },
      { opacity: 1, offset: .2 },
      { opacity: 1, offset: .75 },
      { opacity: 0, strokeDashoffset: -1 }
    ], { duration: 1000, easing: 'cubic-bezier(.45,0,.2,1)' });
    scope.animate(title, [{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay: 180, duration: 700 });
    scope.animate(label, [{ opacity: 0 }, { opacity: 1 }], { delay: 120, duration: 500 });
    scope.animate(note, [{ opacity: 0 }, { opacity: 1 }], { delay: 350, duration: 750 });
    scope.animate(verdict, [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay: 3100, duration: 600 });
    scope.animate(verdict.querySelector('path'), [{ strokeDasharray: '20', strokeDashoffset: 20 }, { strokeDasharray: '20', strokeDashoffset: 0 }], { delay: 3200, duration: 500 });
  }
  seats.forEach((seat, index) => {
    seat.addEventListener('click', () => { stopTour(); scope.pause(false); select(index); });
    seat.addEventListener('keydown', event => {
      const next = { ArrowRight: (index + 1) % seats.length, ArrowDown: (index + 1) % seats.length, ArrowLeft: (index + seats.length - 1) % seats.length, ArrowUp: (index + seats.length - 1) % seats.length, Home: 0, End: seats.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault(); stopTour(); scope.pause(false);
      seats[next].focus(); select(next);
    });
    seat.addEventListener('pointerenter', () => {
      scope.animate(seat.querySelector('svg'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)', offset: .45 }, { transform: 'translateY(0)' }], { duration: 750 });
    });
  });
  table.addEventListener('focusin', stopTour);
  table.addEventListener('pointerenter', () => { hovered = true; halt(); cancelResume(); });
  table.addEventListener('pointerleave', () => { hovered = false; halt(); resumeAfterIdle(); });
  table.addEventListener('focusout', () => { queueMicrotask(resumeAfterIdle); });
  study.addEventListener('motionstatechange', () => {
    cancelResume();
    if (scope.reduced.matches) { stopTour(); scope.paused = false; return; }
    if (!entered && scope.visible) {
      entered = true; select(active);
      seats.forEach((seat, i) => scope.animate(seat, [{ opacity: 0 }, { opacity: 1 }], { delay: i * 85, duration: 900 }));
    }
    if (touring) schedule(); else resumeAfterIdle();
    updateLive();
  });
  // Base state is useful even before intersection (and with reduced motion).
  select(active); updateLive();
})();
