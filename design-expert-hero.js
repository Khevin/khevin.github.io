/* A small, user-directed demonstration, not a simulated live council. */
(() => {
  const table = document.querySelector('[data-council-table]');
  if (!table) return;
  const seats = [...table.querySelectorAll('[data-council-seat]')];
  const title = table.querySelector('.council-decision__title');
  const verdict = table.querySelector('.council-decision__verdict span');
  const drawing = table.querySelector('.council-decision__drawing');
  const note = document.getElementById('council-note');
  const principles = {
    rams: {
      title: ['Keep what', 'earns its place.'], verdict: 'Less, but better',
      note: 'Remove the extra card. Let the essential action lead.',
      art: '<g class="study-muted"><rect x="6" y="7" width="76" height="50"/><path d="M15 20h58M15 29h40M15 38h58M15 47h30"/></g><path class="study-arrow" d="M96 32h22m-7-5 7 5-7 5"/><g class="study-ink"><rect x="126" y="7" width="68" height="50"/><path d="M135 22h50M135 32h32"/></g><path class="study-arrow" d="M135 45h28"/>'
    },
    vignelli: {
      title: ['One system.', 'Everywhere.'], verdict: 'Consistency, by design',
      note: 'Use the same type scale and spacing, from the first screen to the last.',
      art: '<g class="study-muted"><rect x="6" y="6" width="72" height="52"/><rect x="86" y="6" width="44" height="52"/><rect x="138" y="6" width="56" height="48"/></g><path class="study-ink" d="M15 19h44m-44 9h30M95 19h26m-26 9h18M147 19h38m-38 9h24"/><path class="study-arrow" d="M15 48h26M95 48h26M147 44h26"/>'
    },
    kare: {
      title: ['A symbol worth', 'recognizing.'], verdict: 'Meaning at a glance',
      note: 'Pair an unfamiliar icon with a clear label. Recognition comes before decoration.',
      art: '<g class="study-muted"><rect x="25" y="10" width="42" height="42" rx="4"/><path d="m46 21 11 10-11 10-11-10z"/></g><text x="75" y="36" fill="var(--ink-faint)" stroke="none" font-family="monospace" font-size="13">?</text><path class="study-arrow" d="M95 31h22m-7-5 7 5-7 5"/><g class="study-ink"><rect x="133" y="4" width="42" height="42" rx="4"/><path d="m154 15 11 10-11 10-11-10z"/><path d="M135 55h38"/></g>'
    },
    itten: {
      title: ['Let color', 'direct attention.'], verdict: 'Contrast with purpose',
      note: 'Reserve the accent for the next action. Make its contrast do the work.',
      art: '<g class="study-muted"><rect x="12" y="12" width="176" height="40"/><path d="M24 25h60m-60 8h44m-44 8h52"/></g><rect class="study-fill" x="119" y="23" width="55" height="19" rx="2"/><path d="M138 32h16m-4-4 4 4-4 4" stroke="var(--paper)"/>'
    },
    tufte: {
      title: ['Show the data.', 'Lose the noise.'], verdict: 'Evidence before ornament',
      note: 'Remove the chart’s frame. Keep the comparison and label the values.',
      art: '<path class="study-muted" d="M20 13v38h165"/><path class="study-ink" d="M30 42 60 35 91 39 122 20 153 14"/><circle class="study-fill" cx="153" cy="14" r="3"/><text x="163" y="18" fill="var(--ink)" stroke="none" font-family="monospace" font-size="10">84</text><path class="study-muted" d="M30 25 60 28 91 23 122 34 153 34"/><text x="163" y="38" fill="var(--ink-mute)" stroke="none" font-family="monospace" font-size="10">42</text>'
    },
    'muller-brockmann': {
      title: ['A place for', 'every element.'], verdict: 'Structure before styling',
      note: 'Align the heading, content, and action to the same underlying grid.',
      art: '<path class="study-muted" stroke-dasharray="2 3" d="M8 3v58M54 3v58M100 3v58M146 3v58M192 3v58"/><path class="study-muted" stroke-dasharray="2 3" d="M8 19h184"/><g class="study-ink"><path d="M8 11h138" style="stroke-width:2"/><rect x="8" y="25" width="84" height="26"/><path d="M100 29h92m-92 9h64m-64 9h92"/></g><path class="study-arrow" d="M146 57h46" style="stroke-width:2"/>'
    }
  };
  function select(seat) {
    const key = seat.dataset.councilSeat;
    const principle = principles[key];
    if (!principle) return;
    seats.forEach(button => {
      const active = button === seat;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    table.querySelectorAll('[data-council-line]').forEach(line => {
      line.classList.toggle('is-selected', line.dataset.councilLine === key);
    });
    title.replaceChildren(principle.title[0], document.createElement('br'), principle.title[1]);
    verdict.textContent = principle.verdict;
    note.textContent = principle.note;
    // All illustration markup is fixed, authored data above; never user input.
    drawing.innerHTML = '<svg viewBox="0 0 200 64">' + principle.art + '</svg>';
  }
  seats.forEach((seat, index) => {
    seat.addEventListener('click', () => select(seat));
    seat.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % seats.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + seats.length) % seats.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = seats.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      seats[next].focus();
      select(seats[next]);
    });
  });
})();
