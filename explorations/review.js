(() => {
  const select = document.getElementById('direction');
  const frame = document.getElementById('live-preview');
  const shell = document.getElementById('preview-shell');
  const open = document.getElementById('open-preview');
  let width = 1440;
  const fit = () => {
    const scale = Math.min(1, shell.clientWidth / width);
    const height = Math.min(850, Math.max(580, window.innerHeight * .78));
    frame.style.width = width + 'px';
    frame.style.height = Math.round(height / scale) + 'px';
    frame.style.setProperty('--preview-scale', scale);
    shell.style.height = height + 'px';
  };
  const initial = new URLSearchParams(location.search).get('direction');
  if (['signal', 'studio', 'afterhours', 'original'].includes(initial)) select.value = initial;
  const changeDirection = () => {
    const original = select.value === 'original';
    frame.src = original ? '../index.html' : `portfolio.html?direction=${select.value}&embed=1`;
    open.href = original ? '../index.html' : `portfolio.html?direction=${select.value}`;
    frame.title = `${select.options[select.selectedIndex].text} portfolio preview`;
  };
  select.addEventListener('change', changeDirection);
  if (initial) changeDirection();
  document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
    width = Number(button.dataset.width);
    document.querySelectorAll('[data-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    fit();
  }));
  new ResizeObserver(fit).observe(shell);
  window.addEventListener('resize', fit);
  fit();
})();
