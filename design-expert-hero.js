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
  const controls = document.createElement('div');
  controls.className = 'council-playback';
  controls.innerHTML = '<span class="council-playback__hint">Six principles. See them in motion.</span><button type="button" class="council-playback__toggle" aria-label="Pause council tour">Pause tour <span aria-hidden="true">Ⅱ</span></button><button type="button" class="council-playback__replay" aria-label="Replay selected principle">Replay <span aria-hidden="true">↻</span></button>';
  study.append(controls);
  const toggle = controls.querySelector('.council-playback__toggle');
  const replay = controls.querySelector('.council-playback__replay');
  const read = (el, prop) => getComputedStyle(el).getPropertyValue(prop).trim();
  let angle = parseFloat(read(table, '--seat-h')) || 0;
  let orbitAngle = -90;
  let active = 0, timer = 0, steps = 0, entered = false, hovered = false;
  let touring = !scope.reduced.matches;
  const halt = () => { clearTimeout(timer); timer = 0; };
  function updateControls() {
    toggle.disabled = scope.reduced.matches;
    replay.disabled = scope.reduced.matches;
    toggle.textContent = scope.reduced.matches ? 'Reduced motion' : touring ? 'Pause tour Ⅱ' : 'Play tour ▷';
    toggle.setAttribute('aria-label', scope.reduced.matches ? 'Reduced motion enabled' : touring ? 'Pause council tour' : 'Play council tour');
    // Automatic demonstrations never produce unsolicited announcements.
    decision.setAttribute('aria-live', touring ? 'off' : 'polite');
  }
  function stopTour() { touring = false; halt(); updateControls(); }
  function schedule() {
    halt();
    if (!touring || !scope.running || hovered) return;
    timer = setTimeout(() => {
      select((active + 1) % seats.length);
      if (++steps >= seats.length) stopTour();
      else schedule();
    }, 4800);
  }
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
    const previousAngle = orbitAngle;
    orbitAngle += ((index * 60 - 90 - orbitAngle) % 360 + 540) % 360 - 180;
    scope.animate(table.querySelector('.council-orbit-sweep'), [
      { opacity: 0, transform: 'rotate(' + previousAngle + 'deg)' },
      { opacity: .85, offset: .3 },
      { opacity: 0, transform: 'rotate(' + orbitAngle + 'deg)' }
    ], { duration: 1400 });
    title.replaceChildren(principle.title[0], document.createElement('br'), principle.title[1]);
    verdict.querySelector('span').textContent = principle.verdict;
    note.textContent = principle.note;
    label.textContent = scene.label;
    // Fixed, repository-authored SVGs; no remote or user-supplied HTML.
    drawing.innerHTML = '<svg class="council-scene" viewBox="0 0 240 120">' + scene.art + '</svg>';
    drawing.dataset.scene = key;
    animateScene();
    scope.animate(seat.querySelector('svg'), [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-6px) scale(1.08)', offset: .35 },
      { transform: 'translateY(0) scale(1)' }
    ], { duration: 1000 });
    const spoke = table.querySelector('[data-council-line="' + key + '"]');
    spoke.setAttribute('pathLength', '1');
    scope.animate(spoke, [{ strokeDasharray: '.16 1', strokeDashoffset: 1.16 }, { strokeDasharray: '.16 1', strokeDashoffset: 0 }], { duration: 750, easing: 'cubic-bezier(.45,0,.2,1)' });
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
  table.addEventListener('pointerenter', () => { hovered = true; halt(); });
  table.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  toggle.addEventListener('click', () => {
    if (touring) { stopTour(); scope.pause(true); }
    else { touring = true; steps = 0; updateControls(); scope.pause(false); select(active); schedule(); }
  });
  replay.addEventListener('click', () => { stopTour(); scope.pause(false); select(active); });
  study.addEventListener('motionstatechange', () => {
    if (scope.reduced.matches) { stopTour(); scope.paused = false; return; }
    if (!entered && scope.visible) {
      entered = true; select(active);
      seats.forEach((seat, i) => scope.animate(seat, [{ opacity: 0 }, { opacity: 1 }], { delay: i * 85, duration: 900 }));
    }
    schedule(); updateControls();
  });
  // Base state is useful even before intersection (and with reduced motion).
  select(active); updateControls();
})();
