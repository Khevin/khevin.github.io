'use strict';

// Study UI over the existing, stable SRS card keys. A round is a finite pass;
// FSRS alone decides when each card returns. Card content stays in data.js.
const REVIEW_RATINGS = [
  { r: 1, en: 'Again', description: 'Forgot or got it wrong' },
  { r: 2, en: 'Hard', description: 'Correct, with a struggle' },
  { r: 3, en: 'Good', description: 'Correct, with some effort' },
  { r: 4, en: 'Easy', description: 'Knew it straight away' },
];
let reviewRefreshTimer = null;

function clearReviewBindings() {
  clearTimeout(reviewRefreshTimer);
  reviewRefreshTimer = null;
  if (APP._flashKeyHandler) window.removeEventListener('keydown', APP._flashKeyHandler);
  APP._flashKeyHandler = null;
}

function freshReview() {
  return { phase: 'setup', queue: [], idx: 0, revealed: false, reviewed: 0,
    ratings: [], last: null, error: '', classId: APP.flashClassId, limit: 5 };
}

function enterReviewMode() {
  if (!SRS.available()) return;
  APP.flashMode = 'review';
  APP.flashFlipped = false;
  if (!APP._review) APP._review = freshReview();
  renderFlashcards(document.getElementById('main-inner'));
}

function exitReviewMode() {
  clearReviewBindings();
  APP.flashMode = 'browse';
  // Keep an unfinished round in memory when browsing, until this tab closes.
  if (APP._review?.phase === 'active') APP._review.phase = 'setup';
  APP.flashFlipped = false;
  renderFlashcards(document.getElementById('main-inner'));
}

function resolveSrsKey(key) {
  for (const cls of (window.FLASHCARD_CLASSES || [])) {
    for (const card of (cls.cards || [])) {
      if (!card.vocabOnly && card.type !== 'radical' && SRS.keyFor(cls.id, card) === key) return { card, cls };
    }
  }
  return null;
}

function reviewInterval(label) {
  const match = /^(\d+(?:\.\d+)?)(mo|m|h|d|y)$/.exec(label || '');
  if (!match) return label || 'soon';
  const unit = { m: 'minute', h: 'hour', d: 'day', mo: 'month', y: 'year' }[match[2]];
  return `${match[1]} ${unit}${Number(match[1]) === 1 ? '' : 's'}`;
}

function reviewDueLabel(due) {
  const mins = Math.max(1, Math.ceil((due - new Date()) / 60000));
  if (mins < 60) return `in ${mins} minute${mins === 1 ? '' : 's'}`;
  if (mins < 1440) { const hours = Math.ceil(mins / 60); return `in ${hours} hour${hours === 1 ? '' : 's'}`; }
  return `on ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function startReviewRound(container, entries, kind) {
  const old = APP._review;
  APP._review = { ...freshReview(), classId: old.classId, limit: old.limit,
    phase: entries.length ? 'active' : 'setup', queue: entries.map(e => e.key), kind };
  renderFlashcards(container);
  container.querySelector('[data-review-reveal]')?.focus({ preventScroll: true });
}

function reviewCardHTML(card, cls, revealed) {
  const isWhite = card.swatch?.toLowerCase() === '#ffffff';
  const color = revealed && card.swatch && !isWhite ? `;color:${escAttr(card.swatch)}` : '';
  const glyph = `<div class="review-card-glyph${revealed && isWhite ? ' color-glyph-light' : ''}" lang="ja"
    style="font-family:${fontStackFor(APP.flashGlyphFont || 'brush')}${color}">${escHTML(card.kanji)}</div>`;
  if (!revealed) return `<div class="review-card is-front">${glyph}</div>`;
  const folder = card.imageFolder || cls.imageFolder || 'kanji';
  const example = card.examples?.find(e => e.word && e.meaning);
  return `<div class="review-card is-back">
    <div class="review-card-pair">
      ${glyph}
      <div class="review-card-image" aria-label="Your mnemonic picture">
        <image-slot id="review-${escAttr(card.id || card.kanji)}" image-key="${escAttr(folder)}/${escAttr(card.kanji)}"
          shape="rounded" radius="10" fit="contain" position="50% 50%" readonly placeholder=""></image-slot>
      </div>
    </div>
    <div class="review-card-meaning">${escHTML(card.en || '')}</div>
    ${(card.kun || card.on) ? `<div class="review-card-readings">
      ${card.kun ? `<span class="review-reading"><span class="review-reading-label">kun</span><span lang="ja">${escHTML(card.kun)}</span></span>` : ''}
      ${card.on ? `<span class="review-reading"><span class="review-reading-label">on</span><span lang="ja">${escHTML(card.on)}</span></span>` : ''}
    </div>` : ''}
    ${example ? `<details class="review-context"><summary>See it in a word</summary>
      <div><span lang="ja">${escHTML(example.word)}</span>${example.reading ? ` <span class="review-example-reading">${escHTML(example.reading)}</span>` : ''} · ${escHTML(example.meaning)}</div>
    </details>` : ''}
  </div>`;
}

function reviewUndoHTML(rv) {
  return rv.last ? `<button class="review-link" data-review-undo type="button"${rv.phase === 'active' ? ' aria-keyshortcuts="Z"' : ''}>Undo last rating</button>` : '';
}

function undoReviewRating(container) {
  const rv = APP._review;
  if (!rv?.last) return;
  try {
    if (!SRS.undo(rv.last.key)) throw new Error('This rating has changed in another session and can no longer be undone.');
    rv.idx = rv.last.idx;
    rv.reviewed--;
    rv.ratings.pop();
    rv.revealed = true;
    rv.phase = 'active';
    rv.last = null;
    rv.error = '';
  } catch (err) { rv.error = err.message || 'Could not undo. Please try again.'; }
  renderFlashcards(container);
  container.querySelector('[data-rate="3"]')?.focus({ preventScroll: true });
}

function renderReviewOverview(container, rv) {
  const classes = window.FLASHCARD_CLASSES || [];
  const cls = classes.find(c => c.id === rv.classId) || classes[0];
  rv.classId = cls?.id;
  const due = SRS.dueQueue();
  const next = SRS.nextDue();
  const learnable = cls ? SRS.learnQueue(cls.id, rv.limit) : [];
  const paused = rv.idx < rv.queue.length;
  const done = rv.phase === 'complete';
  const remembered = rv.ratings.filter(r => r > 1).length;
  const missed = rv.ratings.filter(r => r === 1).length;
  container.innerHTML = `<section class="flash-review is-overview${done ? ' is-complete' : ''}" aria-labelledby="review-title">
    <header class="flash-review-meta"><span class="review-eyebrow"><span lang="ja">復習</span> / Study</span>
      <button class="review-link" data-review-exit type="button">Browse my cards</button></header>
    <div class="review-overview-heading">
      <h1 id="review-title" tabindex="-1">${done ? 'Round complete.' : paused ? 'Pick up where you left off.' : 'A little practice, every day.'}</h1>
      <p>${done ? `${rv.reviewed} card${rv.reviewed === 1 ? '' : 's'} reviewed. Your progress is saved.` : 'Recall the meaning. Reveal your card. Decide how well you remembered.'}</p>
    </div>
    ${done ? `<div class="review-results" aria-label="Round results">
      <div><strong>${remembered}</strong><span>Remembered</span></div>
      <div><strong>${missed}</strong><span>To revisit</span></div>
      <div class="review-results-note">${missed ? 'Missed cards return at their next scheduled review.' : 'Each card will return when it is due again.'}</div>
    </div>` : ''}
    ${rv.error ? `<p class="review-error" role="alert">${escHTML(rv.error)}</p>` : ''}
    <div class="review-setup-grid">
      <section class="review-setup-panel review-due-panel" aria-labelledby="review-due-heading">
        <span class="review-eyebrow">${paused ? 'Your round' : 'Ready to review'}</span>
        <h2 id="review-due-heading"><strong>${paused ? rv.queue.length - rv.idx : due.length}</strong> ${paused ? 'cards left' : 'cards due'}</h2>
        <p>${paused ? `${rv.reviewed} already reviewed. Resume with the next card.` : due.length ? 'From across your decks, oldest due first.' : next ? `Next review ${escHTML(reviewDueLabel(next))}.` : 'Start with a few cards from a deck you know.'}</p>
        ${paused ? '<button class="review-primary" data-review-resume type="button">Resume round</button>' : due.length ? `<button class="review-primary" data-review-start type="button">Review ${due.length} card${due.length === 1 ? '' : 's'}</button>` : '<div class="review-rest-note">Nothing due right now</div>'}
        ${paused ? '<button class="review-link" data-review-finish type="button">Finish this round</button>' : '<p class="review-small">Ratings save as you go. Stop whenever you need.</p>'}
      </section>
      <section class="review-setup-panel" aria-labelledby="review-new-heading">
        <h2 id="review-new-heading">Add a few new cards</h2>
        <p>From your own collection, in deck order.</p>
        <div class="review-selects">
          <label>Deck<select data-review-deck ${paused ? 'disabled' : ''}>${classes.map(c => `<option value="${escAttr(c.id)}" ${c.id === rv.classId ? 'selected' : ''}>${escHTML(c.titleEn)} · ${escHTML(c.titleJa)}</option>`).join('')}</select></label>
          <label>Round size<select data-review-limit ${paused ? 'disabled' : ''}>${[5, 10, 20].map(n => `<option value="${n}" ${n === rv.limit ? 'selected' : ''}>${n} cards</option>`).join('')}</select></label>
        </div>
        <button class="${!due.length && !paused ? 'review-primary' : 'review-secondary'}" data-review-learn type="button" ${paused || !learnable.length ? 'disabled' : ''}>${learnable.length ? `Learn ${learnable.length} new card${learnable.length === 1 ? '' : 's'}` : 'No new cards in this deck'}</button>
        <p class="review-small">${paused ? 'Finish your current round before starting another.' : due.length ? 'Review due cards first, then add new ones if you like.' : learnable.length ? 'These cards join your review schedule after you rate them.' : 'Choose another deck, or browse these cards again.'}</p>
      </section>
    </div>
    ${!done ? '<ol class="review-guide"><li><span>01</span><strong>Recall</strong> Think of the meaning.</li><li><span>02</span><strong>Reveal</strong> Check your mnemonic.</li><li><span>03</span><strong>Rate</strong> Set the next review.</li></ol>' : ''}
    <footer class="review-overview-footer">${reviewUndoHTML(rv)}<span>Progress is saved in this browser.</span></footer>
  </section>`;
  container.querySelector('[data-review-exit]').onclick = exitReviewMode;
  container.querySelector('[data-review-start]')?.addEventListener('click', () => startReviewRound(container, SRS.dueQueue(), 'review'));
  container.querySelector('[data-review-learn]')?.addEventListener('click', () => startReviewRound(container, SRS.learnQueue(rv.classId, rv.limit), 'learn'));
  container.querySelector('[data-review-resume]')?.addEventListener('click', () => { rv.phase = 'active'; renderFlashcards(container); });
  container.querySelector('[data-review-finish]')?.addEventListener('click', () => { rv.queue = rv.queue.slice(0, rv.idx); rv.phase = 'complete'; renderFlashcards(container); });
  container.querySelector('[data-review-undo]')?.addEventListener('click', () => undoReviewRating(container));
  for (const [attr, prop] of [['deck', 'classId'], ['limit', 'limit']]) {
    container.querySelector(`[data-review-${attr}]`).onchange = e => {
      rv[prop] = prop === 'limit' ? Number(e.target.value) : e.target.value;
      renderFlashcards(container);
      container.querySelector(`[data-review-${attr}]`).focus({ preventScroll: true });
    };
  }
  // Refresh just the due panel so an open deck picker and its focus survive.
  const refreshDue = () => {
    if (APP.section !== 'flashcards' || APP.flashMode !== 'review' || APP._review !== rv || rv.phase === 'active') return;
    const currentDue = SRS.dueQueue();
    const nextDue = SRS.nextDue();
    const panel = container.querySelector('.review-due-panel');
    const hadFocus = panel.contains(document.activeElement);
    panel.innerHTML = `<span class="review-eyebrow">Ready to review</span>
      <h2 id="review-due-heading"><strong>${currentDue.length}</strong> cards due</h2>
      <p>${currentDue.length ? 'From across your decks, oldest due first.' : nextDue ? `Next review ${escHTML(reviewDueLabel(nextDue))}.` : 'Nothing due right now.'}</p>
      ${currentDue.length ? `<button class="review-primary" data-review-start type="button">Review ${currentDue.length} card${currentDue.length === 1 ? '' : 's'}</button>` : '<div class="review-rest-note">Nothing due right now</div>'}
      <p class="review-small">Ratings save as you go. Stop whenever you need.</p>`;
    const start = panel.querySelector('[data-review-start]');
    start?.addEventListener('click', () => startReviewRound(container, SRS.dueQueue(), 'review'));
    if (hadFocus) start?.focus({ preventScroll: true });
    renderFlashSidebar();
    if (nextDue) reviewRefreshTimer = setTimeout(refreshDue, Math.max(1000, Math.min(60000, nextDue - new Date() + 100)));
  };
  if (!paused && next) reviewRefreshTimer = setTimeout(refreshDue, Math.max(1000, Math.min(60000, next - new Date() + 100)));
}

function renderReview(container) {
  clearReviewBindings();
  const rv = APP._review || (APP._review = freshReview());
  if (rv.phase === 'active') {
    while (rv.idx < rv.queue.length && !resolveSrsKey(rv.queue[rv.idx])) rv.idx++;
    if (rv.idx >= rv.queue.length) rv.phase = 'complete';
  }
  if (rv.phase !== 'active') {
    renderReviewOverview(container, rv);
    renderFlashSidebar();
    return;
  }
  const key = rv.queue[rv.idx];
  const { card, cls } = resolveSrsKey(key);
  const intervals = SRS.previewIntervals(key) || {};
  container.innerHTML = `<section class="flash-review ${rv.revealed ? 'is-answer' : 'is-question'}" aria-label="Flashcard study">
    <header class="flash-review-meta">
      <span class="review-eyebrow"><span lang="ja">復習</span> / ${rv.kind === 'learn' ? 'New cards' : 'Review'}</span>
      <span class="review-deck">${escHTML(cls.titleEn)}</span>
      <button class="review-link" data-review-pause type="button">Pause round</button>
    </header>
    <div class="review-progress-row"><span>Card ${rv.idx + 1} of ${rv.queue.length}</span><span>${rv.reviewed} reviewed</span></div>
    <progress class="review-progress" value="${rv.idx}" max="${rv.queue.length}" aria-label="Cards completed"></progress>
    <div class="review-sheet">
      <ol class="review-steps" aria-label="Study steps"><li ${!rv.revealed ? 'aria-current="step"' : ''}>1 · Recall</li><li>2 · Reveal</li><li ${rv.revealed ? 'aria-current="step"' : ''}>3 · Rate</li></ol>
      <h1 class="review-prompt">${rv.revealed ? 'Did you remember the meaning?' : 'What does this mean?'}</h1>
      ${reviewCardHTML(card, cls, rv.revealed)}
      <p class="review-instruction">${rv.revealed ? 'Rate the meaning. The readings are here for reference.' : 'Say the meaning to yourself before revealing the answer.'}</p>
    </div>
    <div class="review-actions">
      ${rv.revealed ? `<div class="review-bar">${REVIEW_RATINGS.map(c => `<button class="review-rate review-rate-${c.en.toLowerCase()}" data-rate="${c.r}" type="button"
        aria-label="${c.en}: ${c.description}. Next review in ${escAttr(reviewInterval(intervals[c.r]))}" aria-keyshortcuts="${c.r}">
        <span class="review-rate-top"><strong>${c.en}</strong><kbd>${c.r}</kbd></span>
        <span class="review-rate-description">${c.description}</span>
        <span class="review-rate-next">Next: ${escHTML(reviewInterval(intervals[c.r]))}</span>
      </button>`).join('')}</div>` : '<button class="review-primary review-reveal" data-review-reveal type="button" aria-keyshortcuts="Space Enter">Show answer <kbd>Space</kbd></button>'}
      <p class="review-kbd-hint">${rv.revealed ? 'Forgot or only partly right? Choose Again. · 1–4 to rate' : 'Take a moment. There is no timer.'}</p>
    </div>
    <p class="review-error" role="alert" ${rv.error ? '' : 'hidden'}>${escHTML(rv.error)}</p>
    <footer class="review-session-footer"><span role="status">${rv.last ? `${escHTML(resolveSrsKey(rv.last.key)?.card.kanji || '')} · ${REVIEW_RATINGS[rv.last.rating - 1].en} · next ${escHTML(reviewDueLabel(rv.last.due))}` : 'Your mnemonic picture appears with the answer.'}</span>${reviewUndoHTML(rv)}</footer>
  </section>`;
  const live = () => APP.section === 'flashcards' && APP.flashMode === 'review' && APP._review === rv && rv.phase === 'active' && rv.queue[rv.idx] === key;
  const reveal = () => {
    if (!live() || rv.revealed) return;
    rv.revealed = true;
    renderFlashcards(container);
    // Focus the question, not a rating: a second Space cannot accidentally grade.
    const heading = container.querySelector('.review-prompt');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  };
  const rate = rating => {
    if (!live() || !rv.revealed) return;
    try {
      const next = SRS.rate(key, rating);
      if (!next) throw new Error('Review scheduling is unavailable. Please reload and try again.');
      rv.last = { key, idx: rv.idx, rating, due: next.due };
      rv.ratings.push(rating);
      rv.idx++;
      rv.reviewed++;
      rv.revealed = false;
      rv.error = '';
      renderFlashcards(container);
      container.querySelector('[data-review-reveal], #review-title')?.focus({ preventScroll: true });
      container.querySelector('.review-prompt, #review-title')?.scrollIntoView({ block: 'nearest' });
    } catch (err) {
      rv.error = 'Your rating could not be saved. Check that browser storage is available, then try again.';
      const error = container.querySelector('.review-error');
      error.textContent = rv.error;
      error.hidden = false;
    }
  };
  container.querySelector('[data-review-pause]').onclick = () => { rv.phase = 'setup'; renderFlashcards(container); };
  container.querySelector('[data-review-reveal]')?.addEventListener('click', reveal);
  container.querySelector('[data-review-undo]')?.addEventListener('click', () => undoReviewRating(container));
  container.querySelectorAll('[data-rate]').forEach(b => b.addEventListener('click', () => rate(Number(b.dataset.rate))));
  APP._flashKeyHandler = e => {
    if (e.repeat || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || !live()) return;
    const t = e.target;
    if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable], dialog, [role="dialog"]')) return;
    if (e.key.toLowerCase() === 'z' && rv.last) { e.preventDefault(); undoReviewRating(container); return; }
    // Number shortcuts work even after tabbing to a control. Space/Enter retain
    // native button behavior, and never grade an answer globally.
    if (rv.revealed && /^[1-4]$/.test(e.key)) { e.preventDefault(); rate(Number(e.key)); return; }
    if (t instanceof HTMLElement && t.closest('button, a, summary')) return;
    if (!rv.revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reveal(); }
  };
  window.addEventListener('keydown', APP._flashKeyHandler);
  renderFlashSidebar();
}
