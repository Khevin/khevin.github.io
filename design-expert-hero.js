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
      art: '<g class="study-muted"><rect x="12" y="13" width="30" height="38"/><rect x="48" y="13" width="30" height="38"/></g><path class="study-cut" d="m10 53 70-42"/><path class="study-arrow" d="M94 32h24m-5-5 5 5-5 5"/><g class="study-ink"><rect x="135" y="10" width="50" height="44"/><path d="M145 22h30m-30 7h20"/></g><path class="study-arrow" d="M145 43h30"/>'
    },
    vignelli: {
      title: ['One system.', 'Everywhere.'], verdict: 'Consistency, by design',
      note: 'Use the same type scale and spacing, from the first screen to the last.',
      art: '<g class="study-muted"><rect x="14" y="8" width="48" height="48"/><rect x="76" y="8" width="48" height="48"/><rect x="138" y="8" width="48" height="48"/></g><path class="study-ink" d="M22 20h32m-32 9h23m-23 5h32M84 20h32m-32 9h23m-23 5h32M146 20h32m-32 9h23m-23 5h32"/><path class="study-arrow" d="M22 46h18m44 0h18m44 0h18"/>'
    },
    kare: {
      title: ['A symbol worth', 'recognizing.'], verdict: 'Meaning at a glance',
      note: 'Pair an unfamiliar icon with a clear label. Recognition comes before decoration.',
      art: '<path class="study-muted" d="M38 12h30v36H38zM44 20h18m-18 8h18m-18 8h10"/><path class="study-arrow" d="M84 32h24m-5-5 5 5-5 5"/><g class="study-ink"><path d="M127 17h8v-5h18v5h8v29h-34z"/><circle cx="144" cy="31" r="9"/><path d="M127 54h34"/></g>'
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
      art: '<path class="study-muted" stroke-dasharray="2 3" d="M26 5v54M74 5v54M126 5v54M174 5v54M16 15h168M16 45h168"/><g class="study-ink"><rect x="26" y="15" width="48" height="30"/><path d="M84 15h90m-90 8h64m-64 8h90"/></g><path class="study-arrow" d="M126 45h48"/>'
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
