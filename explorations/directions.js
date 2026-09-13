(() => {
  const direction = document.documentElement.dataset.direction;
  const embedded = new URLSearchParams(location.search).has('embed');
  document.body.classList.toggle('embedded', embedded);
  document.title = `${({signal:'Signal',studio:'Studio',afterhours:'After Hours'})[direction]} — Khevin Mituti / local exploration`;
  document.querySelector(`[data-direction-link="${direction}"]`)?.setAttribute('aria-current', 'page');
  const works = [
    ['projects/assets/favo/hero.png', 'Favo brand and product design'],
    ['projects/assets/spaces/mock1.png', 'Spaces operator portal'],
    ['projects/assets/amway/tablet.png', 'Amway product recommender']
  ];
  document.querySelectorAll('.work-list .item').forEach((item, index) => {
    const visual = document.createElement('span');
    visual.className = 'case-visual';
    const image = document.createElement('img');
    image.src = works[index][0]; image.alt = works[index][1]; image.loading = 'lazy';
    visual.append(image); item.prepend(visual);
  });
  // Preserve the section when comparing directions; browser history remains useful.
  document.querySelectorAll('[data-direction-link]').forEach(link => {
    link.addEventListener('click', () => {
      const sections = [...document.querySelectorAll('main > section[id]')];
      const active = sections.filter(section => section.getBoundingClientRect().top < innerHeight * .45).at(-1);
      if (active) link.hash = active.id;
    });
  });
})();
