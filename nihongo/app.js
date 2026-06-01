'use strict';

// ── Persistence helpers ─────────────────────────────────────────────────
function lsGet(key, def) {
  try { const r = localStorage.getItem(key); return r == null ? def : JSON.parse(r); }
  catch { return def; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Sections ────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'writing',    glyph: '基', ja: '基礎',  en: 'Basics' },
  { id: 'flashcards', glyph: '札', ja: '単語札', en: 'Flashcards' },
  { id: 'vocab',      glyph: '語', ja: '語彙',  en: 'Vocabulary' },
  // Speaking — shadowing studio (Phase 1 of the Speaking sub-system).
  // 話 = "speak". Sits between Vocabulary (receptive: see/hear/recognize)
  // and Search (lookup) because the verb shifts here from absorbing to
  // producing — the learner imitates, records, and is scored against
  // the model. See docs/superpowers/specs/2026-05-28-speaking.PRODUCT.md.
  { id: 'speaking',   glyph: '話', ja: 'はなす',  en: 'Speaking' },
  // Library — a reference hub. Search, Dictionary, and Books live as pages
  // inside its nested sidebar (renderLibrary / LIBRARY_PAGES). Replaces the
  // former standalone Search + Dictionary top-level items.
  { id: 'library',    glyph: '図', ja: 'としょ',  en: 'Library' },
];

function hashSection() {
  let h = (location.hash || '').replace('#', '');
  // Search + Dictionary were merged into Library; map old hashes/prefs.
  if (h === 'search' || h === 'dictionary') h = 'library';
  if (['vocab','writing','flashcards','speaking','library'].includes(h)) return h;
  const saved = lsGet('jp:section', 'vocab');
  return (saved === 'search' || saved === 'dictionary') ? 'library' : saved;
}

const APP = {
  section:      hashSection(),
  showEnglish:  lsGet('jp:showEnglish', true),
  density:      lsGet('jp:density', 'comfortable'),
  particlesOn:  lsGet('jp:particles', true),
  // Migrate legacy vocab class ids: 'onomatopoeia' → 'jougo'.
  // Default for first-time visitors is 'eating-out' (Food) — the
  // project's headline surface (Flavors, Edibles, Textures) lives
  // here and now sits first in the sidebar order. Returning visitors
  // resume whatever class their localStorage carries.
  vocabClassId: (() => {
    const v = lsGet('jp:vocabClass', 'eating-out');
    if (v === 'onomatopoeia') return 'jougo';
    return v;
  })(),
  vocabBookId:  (() => {
    const v = lsGet('jp:vocabBook', 'bathroom');
    if (v === 'ono-basics') return 'ono';
    return v;
  })(),
  vocabPageIdx: 0,
  // Flavors page (Phase 1 of the Flavors & Textures sub-system). Holds
  // the active flavor id when the user has drilled into a flavor's
  // immersion view; null when the bento map is showing. Persisted so
  // a session-resume lands the user back in the flavor they were
  // sitting with — the page is a contemplative surface, not a quiz,
  // and breaking immersion across reloads would break the contract.
  flavorId:     lsGet('jp:flavorId', null),
  // Textures page (Phase 2). Same shape as flavorId — when set, the
  // user is drilled into a texture immersion view; when null, the
  // textures bento is showing. Persisted across reloads so the page
  // resumes where the learner left it.
  textureId:    lsGet('jp:textureId', null),
  // Edibles database (Phase 3 of the sub-system). Two state slots
  // drive three views:
  //   edibleCategory=null, edibleItem=null   → category-browse (8 tiles)
  //   edibleCategory='kudamono', item=null   → item-grid in that category
  //   edibleCategory='kudamono', item='ringo'→ item-detail spread
  // Both persisted; reload resumes wherever the user was.
  edibleCategory: lsGet('jp:edibleCategory', null),
  edibleItem:     lsGet('jp:edibleItem', null),
  // Cross-link breadcrumb: when the user navigates from a flavor's
  // "foods that taste like X" row into an edible detail, this slot
  // records which flavor they came from. The edible-detail spread
  // renders a second back button labeled with the flavor's kana so
  // the user can bounce back to that flavor's color world. Cleared
  // when the user navigates up out of detail view (or jumps into a
  // different flavor via a badge); preserved when walking sideways
  // through "similar items" since the flavor context still applies.
  edibleFromFlavor: lsGet('jp:edibleFromFlavor', null),
  // Texture-cross-link breadcrumb — twin of edibleFromFlavor, fires
  // when the user navigates from a texture's foodPool collage into
  // an edible's detail spread. Used to render a second back-button
  // chip labeled with the texture's kana so the user can bounce back
  // to that texture's brushstroke world.
  edibleFromTexture: lsGet('jp:edibleFromTexture', null),
  // Migrate legacy class ids: 'weather' → 'nature', 'doors' → 'rooms'.
  flashClassId: (() => {
    const v = lsGet('jp:flashClass', 'basic');
    if (v === 'weather') return 'nature';
    if (v === 'doors') return 'rooms';
    return v;
  })(),
  flashIdx:     0,
  flashShowEn:  lsGet('jp:flashShowEn', true),
  // Card flip state — false = front (image + meaning + examples), true =
  // back (stroke order GIF + radical composition + writing notes). Reset
  // to false whenever the active card changes so a fresh card always
  // shows its front. Not persisted across sessions (transient study state).
  flashFlipped: false,
  // Background preference for the flashcards page only. 'random' (the
  // default) cycles a new bg on every category change; a filename like
  // 'bg-fuji.webp' locks the page to that specific image. Persisted so
  // the learner's preference survives reloads.
  flashBgPref:  lsGet('jp:flashBgPref', 'random'),
  // Colors-class only: paint the kanji itself in the swatch color so the
  // glyph IS the color it names. The trailing 色 in compound names stays in
  // ink for easy cross-referencing back to the base 色 kanji.
  flashColorize: lsGet('jp:flashColorize', true),
  // Furigana toggle — when on, scene dialogues and titles render with
  // <ruby> reading guides above kanji. Off by default so first-time
  // visitors aren't overwhelmed; the toggle lives in the scene-head.
  showFurigana: lsGet('jp:showFurigana', false),
  // ── TTS + settings preferences ───────────────────────────────
  // Site-wide JP font theme. One of: mincho | gothic | kyokasho | brush.
  // Mirrors the four fonts the writing/kana page already uses so the
  // app feels consistent end-to-end.
  uiFont:           lsGet('jp:uiFont', 'mincho'),
  // Per-role font assignments. Title defaults to brush (calligraphic),
  // menu / body keep the chosen body font. menu-en gets a Latin default
  // since it sets English label typography.
  fontTitle:        lsGet('jp:fontTitle', 'brush'),
  fontMenu1:        lsGet('jp:fontMenu1', 'mincho'),
  fontMenu2:        lsGet('jp:fontMenu2', 'garamond'),
  // The voiceURI of the user-picked TTS voice. null = auto-pick the
  // best available Japanese voice (prefers Google → Kyoko → others).
  // May also hold a `gcloud:<voiceName>` value when a Google Cloud voice
  // is selected (see gcloudTtsKey below).
  ttsVoiceURI:      lsGet('jp:ttsVoiceURI', null),
  // Optional Google Cloud Text-to-Speech API key. When set, the premium
  // neural voices (the same ones Google Translate uses) become selectable.
  // Stored ONLY in this browser's localStorage — never committed, never
  // sent anywhere except Google's synthesize endpoint. Lock it to your
  // domain in the Google Cloud console (HTTP-referrer restriction).
  gcloudTtsKey:     lsGet('jp:gcloudTtsKey', null),
  // When a Google Cloud key is set, also use Cloud Speech-to-Text to
  // transcribe Shadowing recordings (more accurate than the browser
  // recognizer). Same key. Default on; falls back to the browser when off
  // or when the cloud call fails.
  gcloudStt:        lsGet('jp:gcloudStt', true),
  // Speech rate. 0.85 reads slightly slower than the SpeechSynthesis
  // default; that's better for learners catching unfamiliar kanji.
  ttsRate:          lsGet('jp:ttsRate', 0.85),
  // Speech volume 0-1. Default 1.0 (full). Adjusted via the audio-
  // settings popover in the sidebar; persists via localStorage.
  ttsVolume:        lsGet('jp:ttsVolume', 1.0),
  // Autoplay NPC dialogue in the immersive (restaurant scene) flow.
  ttsAutoplay:      lsGet('jp:ttsAutoplay', true),
  // Delay before autoplay fires after a scene step renders, in seconds.
  // 0.4s feels natural — long enough to read the speaker's name, short
  // enough that the voice still feels reactive.
  ttsAutoplayDelay: lsGet('jp:ttsAutoplayDelay', 0.4),
  dictQ:        '',
  dictKind:     'all',
  dictLevel:    'all',
  dictTag:      'all',
  popoverItem:  null,
  popoverRect:  null,
  pendingDictQ: null,
  _flashKeyHandler: null,
  // writing / kana
  kanaShowH:    lsGet('jp:kana-show-h', true),
  kanaShowK:    lsGet('jp:kana-show-k', true),
  kanaRomaji:   lsGet('jp:kana-romaji', true),
  // Direct sizes for each script — the user sets them independently.
  // Migrates from the previous (emphasis + min/max) model so saved
  // preferences keep working.
  kanaSizeH: (function() {
    const v = lsGet('jp:kana-size-h', null);
    if (typeof v === 'number') return v;
    // Migration from old emphasis + min/max scheme
    const emph = lsGet('jp:kana-emphasis', 0);
    const min  = lsGet('jp:kana-font-min', 20);
    const max  = lsGet('jp:kana-font-max', 36);
    const e = typeof emph === 'number' ? emph : (emph === 'h' ? -1 : emph === 'k' ? 1 : 0);
    return Math.round((min + max) / 2 - e * (max - min) / 2);
  })(),
  kanaSizeK: (function() {
    const v = lsGet('jp:kana-size-k', null);
    if (typeof v === 'number') return v;
    const emph = lsGet('jp:kana-emphasis', 0);
    const min  = lsGet('jp:kana-font-min', 20);
    const max  = lsGet('jp:kana-font-max', 36);
    const e = typeof emph === 'number' ? emph : (emph === 'h' ? -1 : emph === 'k' ? 1 : 0);
    return Math.round((min + max) / 2 + e * (max - min) / 2);
  })(),
  // Rōmaji size — small caption-style label under each kana. Default
  // matches the original 11px caption size used in the original CSS.
  kanaSizeR: lsGet('jp:kana-size-r', 11),
  kanaFont:     lsGet('jp:kana-font', 'mincho'),
  writingPage:  lsGet('jp:writingPage', 'kana'),
  // Library hub — which page of the nested sidebar is active: search,
  // dictionary, or books. Migrates an old #dictionary deep-link to land on
  // the dictionary page.
  libraryPage:  lsGet('jp:libraryPage', (location.hash.replace('#','') === 'dictionary') ? 'dictionary' : 'search'),
  // Speaking sub-system state. Single category + single phrase active at a
  // time. Persisted across reloads so a session resumes where the learner
  // left it. Permission state for the mic is NOT persisted — every load
  // re-asks via the browser's native prompt the first time the user taps
  // record. (We don't try to remember it; the browser already does, per
  // origin, and pretending we control it would lie to the learner.)
  speakingCategoryId: lsGet('jp:speakingCategory', null),
  speakingPhraseId:   lsGet('jp:speakingPhrase', null),
  speakingScores:     null,  // { rhythm, clarity, pitch, naturalness, overall } | null
  speakingUserBuffer: null,  // AudioBuffer of the user's last recording — in-memory only, dies on phrase change
  // Pitch-accent contour notation style, site-wide. 'lines' = the OJAD /
  // textbook step-line style (horizontal bars at high/low with vertical
  // drops — the canonical notation, what learners see in every Japanese
  // textbook). 'dots' = the connected-dot polyline. Default 'lines'.
  // Set via settings → Display. Applies to the studio AND the Pitch &
  // Tones basics page.
  pitchNotation:      lsGet('jp:pitchNotation', 'lines'),
  // Auto-play the model phrase when a Shadowing phrase loads. On by
  // default ("listen first" pedagogy); the learner can turn it off in
  // settings if they'd rather trigger playback themselves.
  speakingAutoplay:   lsGet('jp:speakingAutoplay', true),
  particleIdx:  lsGet('jp:particleIdx', 0),
  // 'quiz' shows the test, 'particle' shows the single-particle lesson.
  particleMode: lsGet('jp:particleMode', 'lessons'),
  // Quiz config (drives the start screen). All particles, levels chosen,
  // and size persist across sessions so users don't reconfigure every time.
  quizParticles: lsGet('jp:quizParticles', ['は','が','を','に','で','へ','の','と','も','から','まで','や']),
  quizLevels:    lsGet('jp:quizLevels', ['N5','N4']),
  quizSize:      lsGet('jp:quizSize', 20),
  // Lesson id currently being viewed (null = catalog screen).
  lessonId:      lsGet('jp:lessonId', null),
  // Article id currently being viewed (null = articles catalog).
  articleId:     lsGet('jp:articleId', null),
  // Radicals page — array of selected radical glyphs. Selecting two or more
  // intersects: a kanji must contain ALL selected radicals to appear.
  radicalsSelected: lsGet('jp:radicalsSelected', []),
  // Flashcards view mode — two options:
  //   'card' — editorial 2-column layout (image + brush glyph + info pane)
  //   'list' — every kanji in the class as a 2-col scrollable list
  // The legacy 'old' / 'new' values both migrate to 'card' (the old
  // classic layout has been retired).
  flashView:        (function() {
    const v = lsGet('jp:flashView', 'card');
    if (v === 'list') return 'list';
    return 'card';
  })(),
  // Card view typography — glyph for the big kanji, text for the JP
  // segments inside the card body. All 5 KANA_FONTS available.
  flashGlyphFont:   lsGet('jp:flashGlyphFont', 'brush'),
  flashTextFont:    lsGet('jp:flashTextFont', 'mincho'),
  // List view typography — separate from card so each surface can be
  // tuned independently. Brush is excluded from the list options
  // (too decorative for a scannable list), so defaults stay readable.
  listGlyphFont:    lsGet('jp:listGlyphFont', 'mincho'),
  listTextFont:     lsGet('jp:listTextFont',  'mincho'),
};

// True only when the user is on Writing AND the active writing page is
// 'particles'. The particles sidebar piggy-backs on the writing sidebar
// and only appears at this exact intersection.
function shouldShowParticlesSidebar() {
  return APP.section === 'writing' && (APP.writingPage || 'kana') === 'particles';
}

function setSection(s) {
  // Reset the flash-sidebar render cache whenever we cross the
  // flashcards section boundary — entering or leaving. This way the
  // tier-2 brush always fires fresh as part of the cascade when the
  // user returns to flashcards, even though APP.flashClassId hasn't
  // changed. Without this reset, the cache from a previous visit
  // would silently skip the sidebar render, and the cascade would
  // be missing its tier-2 stroke.
  if (APP.section === 'flashcards' || s === 'flashcards') {
    _lastRenderedFlashClass = null;
  }
  // Leaving Speaking → release the mic so the browser indicator turns off.
  // (The stream is held alive across recordings WITHIN the section so the
  // permission prompt fires only once — see SpeakingRecorder.)
  if (APP.section === 'speaking' && s !== 'speaking' && typeof SpeakingRecorder !== 'undefined') {
    SpeakingRecorder.release();
    // Stop + close the user-playback AudioContext (see wireSpeakingStudio) so
    // it doesn't linger past the section. Lazily re-created on next playback.
    if (APP._speakingPlaySrc) { try { APP._speakingPlaySrc.stop(); } catch (e) {} APP._speakingPlaySrc = null; }
    if (APP._speakingPlayCtx) { try { APP._speakingPlayCtx.close(); } catch (e) {} APP._speakingPlayCtx = null; }
  }
  APP.section = s;
  location.hash = s;
  lsSet('jp:section', s);
  const scl = document.querySelector('.app').classList;
  scl.toggle('show-vocab-sidebar', s === 'vocab');
  scl.toggle('show-flash-sidebar', s === 'flashcards');
  scl.toggle('show-writing-sidebar', s === 'writing');
  scl.toggle('show-speaking-sidebar', s === 'speaking');
  scl.toggle('show-library-sidebar', s === 'library');
  scl.toggle('show-particles-sidebar', shouldShowParticlesSidebar());
  // Order matters — updateSidebar queues the tier-1 brush into
  // _brushRenderQueue; renderMain then queues tier-2 and tier-3. If
  // renderMain runs first, the cascade animates 2→3→1, which the
  // brain reads as "wrong" (the outer context arriving last). Tier-1
  // FIRST so the cascade reads as a coherent zoom-in: section →
  // sub-page → item.
  updateSidebar();
  renderMain();
}

// ── Body classes ────────────────────────────────────────────────────────
function applyBodyClasses() {
  document.body.classList.toggle('no-english', !APP.showEnglish);
  document.body.classList.toggle('no-particles', !APP.particlesOn);
  const pad = APP.density === 'compact' ? '32px' : APP.density === 'roomy' ? '72px' : '56px';
  document.documentElement.style.setProperty('--pad-page', pad);
  // Site-wide JP font theme. CSS reads `--serif-jp` from the
  // [data-font-body] attribute on <html> — see the theme rules in CSS.
  // Legacy `data-font` kept in sync for older selectors that still depend
  // on it.
  const html = document.documentElement;
  html.setAttribute('data-font',       APP.uiFont    || 'mincho');
  html.setAttribute('data-font-body',  APP.uiFont    || 'mincho');
  html.setAttribute('data-font-title', APP.fontTitle || 'brush');
  html.setAttribute('data-font-menu-ja', APP.fontMenu1 || 'mincho');
  html.setAttribute('data-font-menu-en', APP.fontMenu2 || 'garamond');
}

// ── TTS (Web Speech API) ────────────────────────────────────────────────
// Single module that handles all Japanese voice playback. Voices load
// async — onvoiceschanged fires when the browser has them ready. The
// picker prefers Google's Japanese voice (best quality on Android
// Chrome + most desktop Chrome installs), falling through to Kyoko,
// Otoya, Haruka, Sayaka, Nanami before settling on whatever ja-JP
// voice is installed. User can override the auto-pick from settings.
const TTS = (function () {
  let voices = [];
  function refresh() {
    if (!window.speechSynthesis) return;
    voices = window.speechSynthesis.getVoices();
  }
  if (window.speechSynthesis) {
    refresh();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.addEventListener('voiceschanged', refresh);
    }
  }
  function listJa() {
    return voices.filter(v => (v.lang || '').toLowerCase().startsWith('ja'));
  }
  // Preference order for auto-pick: Google variants first, then the
  // good built-in OS voices. Anyone with Google's voice installed
  // (Android Chrome especially, also many desktop Chrome installs)
  // gets the high-quality voice by default.
  const NAME_PREFS = [
    'Google 日本語',
    'Google Japanese',
    'Google ja-JP',
    'Kyoko',
    'Otoya',
    'Haruka',
    'Sayaka',
    'Nanami',
    'Ichiro',
  ];
  function pickVoice() {
    const ja = listJa();
    if (!ja.length) return null;
    if (APP.ttsVoiceURI) {
      const saved = ja.find(v => v.voiceURI === APP.ttsVoiceURI);
      if (saved) return saved;
    }
    for (const pref of NAME_PREFS) {
      const found = ja.find(v => (v.name || '').includes(pref));
      if (found) return found;
    }
    return ja[0];
  }
  // Strip HTML (in case furigana ruby got passed in), collapse
  // whitespace, drop punctuation that confuses some engines.
  function clean(text) {
    if (!text) return '';
    return String(text)
      .replace(/<rt>[^<]*<\/rt>/g, '')  // drop ruby annotations
      .replace(/<[^>]+>/g, '')          // strip remaining HTML
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Google Cloud Text-to-Speech neural voices (the same engine family
  // Google Translate uses — far better Japanese pitch accent than the
  // browser's built-in "Google 日本語"). Only offered when the user has
  // pasted an API key in Settings. Voice names per Google's catalog.
  const GCLOUD_VOICES = [
    { id: 'ja-JP-Neural2-B', label: 'Google Cloud · Neural2 B (female)' },
    { id: 'ja-JP-Neural2-C', label: 'Google Cloud · Neural2 C (male)' },
    { id: 'ja-JP-Neural2-D', label: 'Google Cloud · Neural2 D (male, deep)' },
    { id: 'ja-JP-Wavenet-A', label: 'Google Cloud · WaveNet A (female)' },
    { id: 'ja-JP-Wavenet-C', label: 'Google Cloud · WaveNet C (male)' },
  ];
  let currentAudio = null;   // the <Audio> playing a cloud clip, so we can stop it
  // Monotonic request token. Bumped on every cancel()/new speak so an
  // in-flight cloud fetch that resolves AFTER it was superseded knows not
  // to play — otherwise two quick taps (or a tap during fetch latency)
  // produce two overlapping clips, since cancel() can only stop a clip that
  // already exists, not a fetch still in the air.
  let speakGen = 0;
  // Double-trigger debounce. A play of the SAME phrase requested again within
  // this window is almost always an accident — a double-click, a touch that
  // fires click twice, or a stray second handler — never an intentional
  // replay (you'd wait to hear the clip first). Different phrases are NOT
  // debounced, so fast navigation between items still speaks each one.
  const SPEAK_DEBOUNCE_MS = 700;
  let lastSpeakText = '';
  let lastSpeakAt = 0;

  function vol01() {
    const vol = +APP.ttsVolume;
    return Number.isFinite(vol) ? Math.max(0, Math.min(1, vol)) : 1;
  }

  // Browser Web Speech path (free, on-device / Google standard voice).
  function speakWeb(clean_) {
    if (!window.speechSynthesis || !clean_) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean_);
    u.lang = 'ja-JP';
    u.rate = +APP.ttsRate || 0.85;
    u.volume = vol01();
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang || 'ja-JP'; }
    window.speechSynthesis.speak(u);
  }

  // Google Cloud neural path. POSTs to the synthesize REST endpoint with
  // the user's key, gets base64 MP3 back, and plays it.
  //   • Normal playback (strict=false): on ANY failure (bad key, 403, quota,
  //     offline) it falls back to the Web Speech voice so a tap always makes
  //     sound — but quietly.
  //   • Test / diagnostic (strict=true): THROWS a descriptive error (parsed
  //     from Google's response, e.g. "403 — Requests from referer … are
  //     blocked") so the caller can show it inline instead of masking it.
  async function speakCloud(clean_, voiceName, strict) {
    const key = APP.gcloudTtsKey;
    if (!key) { if (strict) throw new Error('No Google Cloud key set'); return speakWeb(clean_); }
    cancel();
    const myGen = speakGen;   // captured AFTER cancel()'s bump — see speakGen
    try {
      const res = await fetch(
        'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(key),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: clean_ },
            voice: { languageCode: 'ja-JP', name: voiceName },
            audioConfig: { audioEncoding: 'MP3', speakingRate: +APP.ttsRate || 1.0 },
          }),
        }
      );
      if (!res.ok) {
        // Pull Google's human-readable reason out of the error body.
        let detail = 'HTTP ' + res.status;
        try { const ej = await res.json(); if (ej && ej.error && ej.error.message) detail = res.status + ' — ' + ej.error.message; } catch (e) {}
        throw new Error(detail);
      }
      const data = await res.json();
      if (!data.audioContent) throw new Error('empty audio response');
      // A newer speak()/cancel() ran while we were fetching — drop this
      // stale clip so the two don't overlap.
      if (myGen !== speakGen) return;
      const audio = new Audio('data:audio/mpeg;base64,' + data.audioContent);
      audio.volume = vol01();
      currentAudio = audio;
      audio.onended = () => { if (currentAudio === audio) currentAudio = null; };
      await audio.play();
    } catch (e) {
      if (strict) throw e;   // surface it (Test button) instead of masking
      // Same staleness guard for the fallback voice.
      if (myGen !== speakGen) return;
      console.warn('Google Cloud TTS failed — falling back to the browser voice:', e);
      speakWeb(clean_);
    }
  }

  // Like speak(), but for the cloud path it REJECTS (with a detailed error)
  // instead of silently falling back — used by the Settings "Test voice"
  // button so a 403 / quota / bad-key shows inline. Returns a promise.
  function speakStrict(text) {
    const clean_ = clean(text);
    if (!clean_) return Promise.resolve();
    const sel = APP.ttsVoiceURI || '';
    if (sel.indexOf('gcloud:') === 0 && APP.gcloudTtsKey) {
      return speakCloud(clean_, sel.slice(7), true);
    }
    speakWeb(clean_);
    return Promise.resolve();
  }

  function speak(text) {
    const clean_ = clean(text);
    if (!clean_) return;
    const now = Date.now();
    // Ignore a rapid repeat of the same phrase (double-click / double-fired
    // event / accidental second handler). See SPEAK_DEBOUNCE_MS.
    if (clean_ === lastSpeakText && (now - lastSpeakAt) < SPEAK_DEBOUNCE_MS) return;
    lastSpeakText = clean_;
    lastSpeakAt = now;
    cancel();   // stop anything playing + invalidate any in-flight cloud fetch
    const sel = APP.ttsVoiceURI || '';
    if (sel.indexOf('gcloud:') === 0 && APP.gcloudTtsKey) {
      speakCloud(clean_, sel.slice(7));
    } else {
      speakWeb(clean_);
    }
  }
  function cancel() {
    speakGen++;   // invalidate any cloud fetch still in flight
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
  }
  // Re-query voices on demand (some browsers populate the list lazily).
  function ensureVoices() {
    if (!voices.length) refresh();
    return voices;
  }
  return { speak, speakStrict, cancel, listJa, refresh, ensureVoices, GCLOUD_VOICES };
})();
// Expose for inline handlers (speaker buttons use onclick="TTS.speak(...)")
window.TTS = TTS;
// Backwards-compat alias — several wireXxxHandlers blocks call a
// non-existent `speakJapanese()` function via typeof guards (which
// silently no-op'd the audio). Aliasing it here makes those buttons
// actually fire the speech synth.
window.speakJapanese = (text) => TTS.speak(text);

// Reusable speaker glyph for any TTS trigger button. Small Lucide-style
// icon — outline only, picks up currentColor.
// ── Active-item brush brushes ───────────────────────────────────────────
// Four hand-painted brushstrokes live under images/brush/, half LINE
// (horizontal / vertical brush sweeps) and half CIRCLE (ensos). Each
// sidebar tier gets a specific brush assignment so the cascade reads as
// a deliberate composition rather than four random marks. When a
// sidebar item becomes active we inject an <img class="active-brush
// is-<type> tier-<N>"> child — CSS animations handle the entry
// (line → right-to-left wipe, circle → counter-clockwise conic mask).
//
// Tier mapping (matches the visual hierarchy of the three sidebars):
//   1 — main bookmark nav (Basics / Flashcards / Vocab / Search / Dict)
//   2 — first sub-sidebar  (categories: kana, vocab classes, flash classes)
//   3 — deeper sub-sidebar (books, particles, particle modes)
//
// Centralized random helper — used wherever organic variance is
// wanted (brush rotation, duration drift, future hand-painted feels).
// Inclusive on min, exclusive on max — standard JS convention. Pass
// negative-to-positive ranges for symmetric ±N variance.
function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Cascade timing — sequential, wait-for-previous-to-finish. Each tier
// in a multi-tier render cycle waits for the previous tier's stroke
// to fully complete before its own begins. This restores the "rule"
// the user noticed went missing during the fixed-step experiment:
// when navigation expands the whole sidebar tree, the strokes paint
// in strict order with no overlap, like a calligrapher finishing one
// stroke before lifting the brush to start the next.
//
// Each entry in _brushRenderQueue carries { tier, start, dur } so
// downstream tiers can compute "wait until last queued entry's end".
// Tier 0 marks phantom entries (not used in the new model, kept for
// backwards-compat in case some old code path pushes them).
//
// Key property preserved: the CLICKED tier always fires first because
// the queue starts empty each render cycle (microtask reset). Tier-3
// click → empty queue → delay 0 → instant. Section switch → tier-1
// has only the small ceremonial pre-roll, no waiting.
//
// Durations live as JS constants AND CSS values. They must match —
// if they drift apart, the cascade math will overlap or leave gaps.
const BRUSH_TIER1_PRE_ROLL  = 0.18;   // ceremonial pause before sidebar enso
const BRUSH_CIRCLE_DUR      = 1.10;   // tier-1 circle, must match CSS
const BRUSH_LINE_DUR        = 0.85;   // tier-2 line, must match CSS
// Per-brush organic randomness — small enough to read as natural
// variation, not so much that it reads as broken. ±2deg rotation
// applies to all brush types; bg-brushes additionally get a small
// duration drift so no two strokes feel identically timed.
const BRUSH_ROT_RANGE = 2;        // degrees, ±
const BRUSH_BG_DUR_BASE = 0.42;
const BRUSH_BG_DUR_VARIANCE = 0.08;

// All tier-2 line brushstrokes carry a consistent NE → SW diagonal
// tilt. Negative rotation = counter-clockwise = right end lifts and
// left end drops, so a horizontal-looking line image visually runs
// from upper-right (NE) to lower-left (SW). The reveal animation
// (clip-path right-to-left in local coords) flows along that
// diagonal — local right is upper-right after rotation, so the
// brush appears drawn from its TOP end (NE) toward its BOTTOM end
// (SW). That's "top to bottom along the stroke's axis", which is
// what the user means when asking for top-to-bottom direction —
// NOT a 90deg vertical rotation, which makes the brushes look
// like pillars rather than calligraphic strokes.
//
// Small per-stroke random ±2deg rotation stacks on top so no two
// strokes are identical, but the base tilt keeps them in the
// NE-SW family.
//
// Only LINES get this — circles (tier 1) stay rotationally neutral
// (ensos look the same at any angle), and bg/particle brushes (tier 3)
// keep their own ±2deg organic-only rotation since they're not
// shaped as directional strokes.
const BRUSH_LINE_TILT = -15;      // degrees — NE→SW diagonal
// Two shape-keyed pools. Adding more brushes is one-line: drop a file
// into images/brush/ + append its path to the matching pool. All
// circles share the conic-mask reveal animation, all lines share the
// right-to-left clip-path sweep — no per-file CSS ever needed.
//
// linesTier3 = lines reserved for tier-3 only (rarer brushstrokes
// that should be a treat when they appear, never the everyday tier-2
// signal). Tier-3's full line pool is `lines + linesTier3`.
const BRUSH_POOLS = {
  circles: [
    'images/brush/brush-circle-1.webp',
    'images/brush/brush-circle-2.webp',
    'images/brush/brush-circle-3.webp',
    'images/brush/brush-circle-4.webp',
  ],
  lines: [
    'images/brush/brush-line-1.webp',
    'images/brush/brush-line-2.webp',
    'images/brush/brush-line-3.webp',
    'images/brush/brush-line-4.webp',
    'images/brush/brush-line-5.webp',
    'images/brush/brush-line-6.webp',
    'images/brush/brush-line-7.webp',
    // brush-line-8 retired.
  ],
  // Reserved for tier-3-only brushes — empty until new strokes land.
  // Adding paths here makes them appear only in deeper sub-sidebars,
  // never in tier 2.
  linesTier3: [],
};
// No-repeat picker — every brush pool gets its own "last pick" memory so
// the next random draw excludes whatever was just shown. Pools of size 1
// degrade to "always the same" (degenerate case, no harm). Pools of size
// ≥2 guarantee the user never sees the same brush twice in a row in the
// same tier. Each tier has its OWN memory key, so a circle in tier 1
// doesn't influence a circle in tier 3 (they're independent sequences).
const _brushLast = { circle: null, line: null, bg: null, particle: null };
function _pickNoRepeat(pool, kind) {
  if (!pool.length) return null;
  if (pool.length === 1) {
    _brushLast[kind] = pool[0];
    return pool[0];
  }
  let pick;
  do {
    pick = pool[Math.floor(Math.random() * pool.length)];
  } while (pick === _brushLast[kind]);
  _brushLast[kind] = pick;
  return pick;
}
let _brushRenderQueue = [];
let _brushCascadeReset = null;
// Walks the queue backwards looking for the most-recent non-phantom
// entry and returns its end-time (start + dur). If the queue is empty
// (or only phantoms), returns 0 — meaning "fire immediately." Shared
// by activeBrushHTML and nextBgBrushDelay so every tier follows the
// same wait-for-previous rule.
function _delayAfterLastQueued() {
  for (let i = _brushRenderQueue.length - 1; i >= 0; i--) {
    const e = _brushRenderQueue[i];
    if (e.tier > 0) return e.start + e.dur;
  }
  return 0;
}
function activeBrushHTML(tier = 1) {
  // Tier → pool mapping is strict:
  //   Tier 1 (main nav)          → circles only, random no-repeat
  //   Tier 2 (mid sub-sidebars)  → lines only, random no-repeat
  //   Tier 3 (deepest sidebars)  → bg-brushes, handled by bgBrushHTML()
  // This function only emits tier-1 and tier-2 brushes. Any tier-3
  // callsite should use bgBrushHTML(nextBgBrushDelay()) instead — but as
  // a defensive fallback (in case a caller passes tier=3 here), we
  // route through the line pool with no-repeat so something still
  // renders rather than throwing.
  let brush;
  if (tier === 1) {
    brush = { src: _pickNoRepeat(BRUSH_POOLS.circles, 'circle'), type: 'circle' };
  } else if (tier === 2) {
    brush = { src: _pickNoRepeat(BRUSH_POOLS.lines, 'line'), type: 'line' };
  } else {
    // Defensive fallback — tier-3 callers should use bgBrushHTML instead.
    brush = { src: _pickNoRepeat(BRUSH_POOLS.lines, 'line'), type: 'line' };
  }
  // Wait-for-previous cascade. Walk the queue backwards to find the
  // last non-phantom entry; this brush starts when THAT entry finishes
  // its own animation. If the queue is empty, this brush starts at 0
  // — preserving the "clicked tier fires immediately" property.
  //
  // Tier-1 additionally gets a ceremonial pre-roll: when the queue
  // is empty AND we're queueing tier-1, bump delay up to the pre-roll
  // value (the sidebar enso always feels deliberate, never reactive).
  // If tier-1 is already queued in this cascade (impossible in
  // current code paths but defensive), the pre-roll doesn't reapply.
  const dur = (brush.type === 'circle') ? BRUSH_CIRCLE_DUR : BRUSH_LINE_DUR;
  let delay = _delayAfterLastQueued();
  if (tier === 1 && delay === 0) delay = BRUSH_TIER1_PRE_ROLL;
  _brushRenderQueue.push({ tier, start: delay, dur });
  // Reset the queue on the next microtask. All synchronous renders
  // that fire within the current event-loop turn share the queue
  // (they're part of the same cascade); anything fired async after
  // (e.g., a deferred fetch result re-rendering) starts a fresh queue.
  if (_brushCascadeReset === null) {
    _brushCascadeReset = Promise.resolve().then(() => {
      _brushRenderQueue = [];
      _brushCascadeReset = null;
    });
  }
  // Organic rotation. Tier 1/2 use position: absolute with CSS
  // transform: translateY(-50%) for vertical centering, so we must
  // preserve that translation when adding the rotation. Tier 3 isn't
  // hit here (migrated to bg-brush) but we preserve translateY for it
  // too in case the fallback path runs.
  //
  // LINES additionally carry a -15deg base tilt (NE → SW diagonal);
  // circles stay rotationally neutral (organic ±2deg only). The base
  // tilt + variance combine into the final rotation.
  const baseTilt = brush.type === 'line' ? BRUSH_LINE_TILT : 0;
  const rotation = baseTilt + randBetween(-BRUSH_ROT_RANGE, BRUSH_ROT_RANGE);
  const transform = `translateY(-50%) rotate(${rotation.toFixed(2)}deg)`;
  const styleParts = [`transform:${transform}`];
  if (delay > 0) styleParts.push(`animation-delay:${delay}s`);
  const style = ` style="${styleParts.join(';')}"`;
  return `<img class="active-brush is-${brush.type} tier-${tier}" src="${brush.src}" alt="" aria-hidden="true"${style} />`;
}

// Brush-bg variant — a tier-3 alternative where the active brush paints
// BEHIND the text AND breaks out of the column, trailing rightward into
// the content area. The text color crossfades from ink to white in sync
// with the brush's left-to-right wipe. Used for the particles
// "interactive" buttons (Lessons / Articles / Test). The text color
// animation lives in CSS; the renderer hands it the same delay via a
// custom property so both layers stay in lockstep.
//
// Adding more brush variants is one line: drop a file into images/brush/
// and append its path to BRUSH_BG_POOL. The picker cycles randomly across
// the pool on each activation.
const BRUSH_BG_POOL = [
  'images/brush/brush-1.webp',
  'images/brush/brush-2.webp',
  'images/brush/brush-3.webp',
  'images/brush/brush-4.webp',
  'images/brush/brush-5.webp',
  // brush-6 retired earlier — slot kept open for future strokes.
  'images/brush/brush-7.webp',
  'images/brush/brush-8.webp',
  // brush-9 retired with the latest update; pool is now 7 entries.
];
function nextBgBrushDelay(dur = BRUSH_BG_DUR_BASE) {
  // Tier-3 follows the same wait-for-previous rule as tier-1 and 2.
  // Caller passes the per-instance duration (with random variance)
  // so downstream entries wait for the right end-time.
  const delay = _delayAfterLastQueued();
  _brushRenderQueue.push({ tier: 3, start: delay, dur });
  if (_brushCascadeReset === null) {
    _brushCascadeReset = Promise.resolve().then(() => {
      _brushRenderQueue = [];
      _brushCascadeReset = null;
    });
  }
  return delay;
}
function bgBrushHTML(delay, duration, rotation) {
  // No-repeat picker — never the same bg-brush twice in a row.
  const src = _pickNoRepeat(BRUSH_BG_POOL, 'bg');
  // Inline overrides:
  //   animation-delay     — cascade position in this render cycle
  //   animation-duration  — per-instance drift, so no two strokes feel
  //                         identically timed (matches the sumi-e
  //                         hand-feel of slightly varied gestures)
  //   transform: rotate   — ±2deg tilt for organic variance. Brush is
  //                         position:fixed, so rotate doesn't conflict
  //                         with JS-set left/top; it rotates around
  //                         the brush's center.
  const styleParts = [];
  if (delay > 0)    styleParts.push(`animation-delay:${delay}s`);
  if (duration > 0) styleParts.push(`animation-duration:${duration.toFixed(3)}s`);
  if (rotation)     styleParts.push(`transform:rotate(${rotation.toFixed(2)}deg)`);
  const style = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
  return `<img class="active-brush-bg" src="${src}" alt="" aria-hidden="true"${style} />`;
}
// Helper for tier-3 callsites — returns the pieces needed to switch a
// button to the bg-brush variant: a class fragment (adds 'has-bg-brush'),
// a CSS custom-property fragment (passes delay + duration to the text
// crossfade so both layers stay in lockstep), and the brush <img>.
//
// Each call generates fresh randomness — duration drift around the
// sumi-e base (BRUSH_BG_DUR_BASE ± BRUSH_BG_DUR_VARIANCE), rotation
// inside ±BRUSH_ROT_RANGE. Re-clicking the SAME tier-3 button creates
// a new bgBrushBits() call, so every activation is its own gesture.
//
// Usage in a template:
//   const bb = isActive ? bgBrushBits() : null;
//   <button class="cat-item ${isActive ? 'active ' + bb.cls : ''}"
//           ${bb ? `style="${bb.style}"` : ''}>
//     ...
//     ${bb ? bb.html : ''}
//   </button>
function bgBrushBits() {
  // Compute duration FIRST so the cascade queue records the actual
  // (with-variance) length rather than the base — downstream entries
  // wait for the real end-time, not an approximation.
  const duration = BRUSH_BG_DUR_BASE +
                   randBetween(-BRUSH_BG_DUR_VARIANCE, BRUSH_BG_DUR_VARIANCE);
  const delay    = nextBgBrushDelay(duration);
  const rotation = randBetween(-BRUSH_ROT_RANGE, BRUSH_ROT_RANGE);
  return {
    cls:   'has-bg-brush',
    style: `--bg-brush-delay:${delay}s; --bg-brush-dur:${duration.toFixed(3)}s`,
    html:  bgBrushHTML(delay, duration, rotation),
  };
}

// ── Particle-brush variant ─────────────────────────────────────────────
// A SMALLER tier-3 brush specifically for the individual particle list
// items (は が を に で へ の と も から まで や). The full bg-brush is too
// loud for these tightly-packed rows where the user is browsing many
// particles in sequence — the particle variant is sized to overlap the
// colored glyph on the left of the row but NOT bleed across the
// romaji + EN labels.
//
// Sizing: width = sub-sidebar.width × 0.5 (half the sidebar), anchored
// at sidebar.left − 10% sidebar.width (subtle leftward spill outside
// the column). Brush is roughly 50% column-width wide, centered on
// the row's left half. The 10 new sumi PNGs are 1:1 square at native
// resolution, so contain keeps them looking like organic dabs of ink
// rather than horizontal strokes.
//
// Text behavior: ONLY the .cat-glyph fades to white (since the brush
// only covers the glyph area). The .cat-ja and .cat-en labels stay in
// their default colors — readable against the cream paper unaffected
// by the brush.
// Each particle gets its OWN dedicated brush — no random pick, no
// rotation through a pool. The character →  file mapping below means
// the same particle always paints with the same brush, so the user
// associates a specific stroke gesture with that particle's identity.
// File suffixes use particle romaji (the particle's pronunciation as
// a particle — は = "wa", へ = "e", を = "o" — NOT the kana name).
//
// Only 10 of the 12 particles in PARTICLES have a dedicated brush
// today; まで and や fall back to the no-repeat random pool below
// (drawn from the same 10 brushes) until more are added. Drop a new
// brush-particle-{romaji}.webp into images/brush/ and add a line here
// to give those two their own brush.
const BRUSH_PARTICLE_MAP = {
  // は uses "ha" naming (the kana's name in isolation, not its
  // particle reading "wa") to match the file the user uploaded.
  'は':   'images/brush/brush-particle-ha.webp',
  'が':   'images/brush/brush-particle-ga.webp',
  'を':   'images/brush/brush-particle-o.webp',
  'に':   'images/brush/brush-particle-ni.webp',
  'で':   'images/brush/brush-particle-de.webp',
  'へ':   'images/brush/brush-particle-e.webp',
  'の':   'images/brush/brush-particle-no.webp',
  'と':   'images/brush/brush-particle-to.webp',
  'も':   'images/brush/brush-particle-mo.webp',
  'から': 'images/brush/brush-particle-kara.webp',
  'まで': 'images/brush/brush-particle-made.webp',
  'や':   'images/brush/brush-particle-ya.webp',
};
// Fallback pool for any particle not in the map — picks from the same
// 10 brushes with no-repeat memory so the unmapped particles still
// feel varied without cross-contaminating the mapped ones.
const BRUSH_PARTICLE_FALLBACK_POOL = Object.values(BRUSH_PARTICLE_MAP);

// Brush is positioned RELATIVE TO THE GLYPH ELEMENT, not the
// sub-sidebar. Previous version anchored to sidebar.left with a 10%
// leftward overlap, which placed the brush mostly outside the row and
// barely overlapping the glyph. Now we measure the glyph (cat-glyph)
// directly and center the brush on it — the brush always lands on
// the kana character regardless of sidebar width or row layout.
//
// Brush size = glyph.width × scale. 2.16 = ~56px brush for the 26px
// glyph, leaving ~15px of brush extending past each side of the glyph.
// The brush reaches close to the cat-label's start (cat-glyph + 10px
// gap = label.left at glyph.right + 10); at this scale the brush right
// edge sits ~5px before the label start, so the romaji + EN labels
// stay on clean paper outside the brush. Was 1.8 (47px); user asked
// for 20% larger.
const BRUSH_PARTICLE_GLYPH_SCALE = 2.16;
function particleBrushHTML(particleChar, delay, duration, rotation) {
  // Mapped particle → its own dedicated brush (deterministic).
  // Unmapped particle → no-repeat random from the fallback pool.
  const src = BRUSH_PARTICLE_MAP[particleChar]
    || _pickNoRepeat(BRUSH_PARTICLE_FALLBACK_POOL, 'particle');
  const styleParts = [];
  if (delay > 0)    styleParts.push(`animation-delay:${delay}s`);
  if (duration > 0) styleParts.push(`animation-duration:${duration.toFixed(3)}s`);
  if (rotation)     styleParts.push(`transform:rotate(${rotation.toFixed(2)}deg)`);
  const style = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
  return `<img class="active-brush-particle" src="${src}" alt="" aria-hidden="true"${style} />`;
}
function particleBrushBits(particleChar) {
  const duration = BRUSH_BG_DUR_BASE +
                   randBetween(-BRUSH_BG_DUR_VARIANCE, BRUSH_BG_DUR_VARIANCE);
  const delay    = nextBgBrushDelay(duration);
  const rotation = randBetween(-BRUSH_ROT_RANGE, BRUSH_ROT_RANGE);
  return {
    cls:   'has-particle-brush',
    style: `--bg-brush-delay:${delay}s; --bg-brush-dur:${duration.toFixed(3)}s`,
    html:  particleBrushHTML(particleChar, delay, duration, rotation),
  };
}
function repositionParticleBrushes() {
  document.querySelectorAll('.active-brush-particle').forEach(brush => {
    const row = brush.parentElement;
    if (!row) return;
    // Anchor to the GLYPH element, not the sidebar. The glyph is the
    // kana character (は が を …) that the brush should visually wrap.
    const glyph = row.querySelector('.cat-glyph');
    if (!glyph) return;
    const glyphRect = glyph.getBoundingClientRect();
    if (glyphRect.width === 0 && glyphRect.height === 0) return;
    // SIZE — derived from the glyph's LAYOUT width (offsetWidth),
    // NOT the bounding-rect width. The particle-glyph-emerge keyframe
    // scales the glyph to 1.22 via CSS transform, which inflates its
    // getBoundingClientRect dimensions. Using rect.width here meant
    // the brush kept growing as the emerge animation played — and
    // each scroll-triggered reposition picked up the new scaled rect
    // and ratcheted the brush size up further. offsetWidth ignores
    // CSS transforms (returns the layout box), so brush size stays
    // stable regardless of the glyph's current scale state.
    const refWidth = glyph.offsetWidth || 26;
    const brushWidth = refWidth * BRUSH_PARTICLE_GLYPH_SCALE;
    const aspect = (brush.naturalWidth && brush.naturalHeight)
      ? brush.naturalWidth / brush.naturalHeight
      : 1.0;
    const brushHeight = brushWidth / aspect;
    brush.style.width  = brushWidth + 'px';
    brush.style.height = brushHeight + 'px';
    // POSITION — derived from getBoundingClientRect, which DOES
    // include transforms. We want the brush to follow the glyph's
    // current visual center (including the -2px emerge translate),
    // so this is correct: brush slides with the glyph as it emerges,
    // and follows the row as the user scrolls the sub-sidebar.
    const cx = glyphRect.left + glyphRect.width  / 2;
    const cy = glyphRect.top  + glyphRect.height / 2;
    brush.style.left = (cx - brushWidth  / 2) + 'px';
    brush.style.top  = (cy - brushHeight / 2) + 'px';
  });
}
// Brush-bg positioning ────────────────────────────────────────────────
// The .active-brush-bg <img> is position:fixed (escapes the sub-sidebar's
// overflow-y:auto clip), so JS sets ALL geometry — width, height, left,
// top — each frame. The math derives everything from two things:
//
//   1. The host sub-sidebar's rendered width (measured live)
//   2. The brush image's native aspect ratio (read from naturalWidth/
//      naturalHeight once the image loads)
//
// Formula:
//   brushWidth  = sidebar.width × (1 + 2 × spillRatio)
//                 ↳ default spillRatio = 0.10 means sidebar + 10% on
//                   each side = sidebar × 1.20
//   brushHeight = brushWidth / aspect
//                 ↳ preserves the artist's stroke aspect regardless
//                   of how wide the sidebar is
//   left        = sidebar.left − sidebar.width × spillRatio
//                 ↳ 10% of the sidebar leaks into the previous column
//   top         = row.top + (row.height − brushHeight) / 2
//                 ↳ vertically centered on the active row
//
// This adapts automatically when:
//   - The user swaps brush images (different native aspect → new height)
//   - The viewport resizes (sub-sidebar widths reflow → re-measure)
//   - A new sub-sidebar gets the brush-bg variant later (any class
//     listed in SUB_SIDEBAR_SELECTOR is supported)
//
// BRUSH_BG_FALLBACK_ASPECT covers the brief window between <img> insert
// and the image's `load` event firing (naturalWidth is 0 until then).
// We register a capture-phase `load` listener in initTier3BrushPositioning
// that re-schedules a reposition when any brush image finishes loading,
// so the fallback only governs the first paint frame before the image
// arrives.
const BRUSH_BG_SPILL_RATIO = 0.10;
const BRUSH_BG_FALLBACK_ASPECT = 2.0;
const SUB_SIDEBAR_SELECTOR =
  '.particles-sidebar, .flash-sidebar, .writing-sidebar, ' +
  '.vocab-sidebar, .vocab-books-sidebar, .library-sidebar';
function repositionBgBrushes() {
  document.querySelectorAll('.active-brush-bg').forEach(brush => {
    const row = brush.parentElement;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    // Hidden ancestor — skip rather than paint at (0,0). Next mutation
    // pass catches us when the row becomes visible.
    if (rect.width === 0 && rect.height === 0) return;
    // The brush sizes itself relative to the SUB-SIDEBAR it lives in
    // (not the main nav sidebar), so look up that ancestor specifically.
    const subSidebar = row.closest(SUB_SIDEBAR_SELECTOR);
    if (!subSidebar) return;
    const sidebarRect = subSidebar.getBoundingClientRect();
    if (sidebarRect.width === 0) return;

    // Width = sidebar + (spillRatio × 2) overhang.
    const brushWidth = sidebarRect.width * (1 + BRUSH_BG_SPILL_RATIO * 2);
    // Height proportional to the picked image's native aspect. If the
    // image hasn't loaded yet (naturalWidth = 0), use the fallback and
    // self-correct on the next reposition triggered by the load event.
    const aspect = (brush.naturalWidth && brush.naturalHeight)
      ? brush.naturalWidth / brush.naturalHeight
      : BRUSH_BG_FALLBACK_ASPECT;
    const brushHeight = brushWidth / aspect;

    brush.style.width = brushWidth + 'px';
    brush.style.height = brushHeight + 'px';
    // Anchor the brush's left edge to the sub-sidebar's left edge minus
    // the leftward spill. This keeps the brush positionally consistent
    // across rows in the same sidebar — no per-row drift even if some
    // rows have different padding.
    brush.style.left = (sidebarRect.left - sidebarRect.width * BRUSH_BG_SPILL_RATIO) + 'px';
    // Vertically center the brush on the active row.
    brush.style.top = (rect.top + (rect.height - brushHeight) / 2) + 'px';
  });
}

// Tier-3 brush positioning ─────────────────────────────────────────────
// Tier-3 brushes use `position: fixed` (see CSS at .cat-item .active-brush.tier-3)
// so they can escape the sub-sidebars' overflow:hidden clip. Fixed strips
// them out of normal flow, so JS sets their left/top each frame to keep
// them centered on their parent row's right edge — half inside the row,
// half spilling into the content area beyond the sub-sidebar.
//
// Triggers a reposition on:
//   - DOM mutations (new active state inserted/removed during section change)
//   - Window resize (sidebar widths change)
//   - Scroll events anywhere (sub-sidebars have their own overflow:auto;
//     capture phase catches inner scrolls before they bubble up)
const TIER3_BRUSH_SIZE = 70;
function repositionTier3Brushes() {
  document.querySelectorAll('.active-brush.tier-3').forEach(brush => {
    const parent = brush.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    // Hidden parent (display:none somewhere up the tree) — skip rather
    // than place at (0,0) where it would flash before the next tick
    // catches it.
    if (rect.width === 0 && rect.height === 0) return;
    brush.style.left = (rect.right - TIER3_BRUSH_SIZE / 2) + 'px';
    brush.style.top  = (rect.top + (rect.height - TIER3_BRUSH_SIZE) / 2) + 'px';
  });
}
function initTier3BrushPositioning() {
  // rAF-coalesce so multiple triggers in a single frame collapse to one
  // measurement pass. Every fixed-positioned brush variant — the small
  // tier-3 dots, the wide bg-brushes, and the medium-sized particle brushes
  // — is a child of a cat-item that needs to track its parent row, so
  // we run every repositioner on the same trigger set.
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      repositionTier3Brushes();
      repositionBgBrushes();
      repositionParticleBrushes();
    });
  };
  // DOM changes anywhere — covers active-state swaps inside any sidebar.
  // Scoped to document.body with subtree:true; the per-call work is just
  // a querySelectorAll on a tiny set of nodes, so noisy mutations are fine.
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
  });
  // Viewport size changes — sidebar widths reflow, parent rects shift.
  window.addEventListener('resize', schedule);
  // Capture-phase scroll listener — needed because sub-sidebars scroll
  // independently (each has overflow-y:auto), and scroll events from
  // them do NOT bubble to window. Capture catches every scroll regardless
  // of origin.
  document.addEventListener('scroll', schedule, true);
  // Capture-phase load listener — brush-bg <img>s arrive with width/
  // height zero until the PNG/SVG byte stream finishes loading. The
  // first reposition uses BRUSH_BG_FALLBACK_ASPECT; we need a second
  // reposition once the actual naturalWidth/naturalHeight are known so
  // the brush adopts its native aspect. `load` events don't bubble, so
  // we listen at capture phase to catch every <img> load in the page.
  document.addEventListener('load', (e) => {
    const t = e.target;
    if (!t || !t.classList) return;
    if (t.classList.contains('active-brush-bg') ||
        t.classList.contains('active-brush-particle')) schedule();
  }, true);
  // Initial pass on the next frame so anything already in the DOM at
  // boot gets anchored before paint.
  schedule();
}

function speakerIconSVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  `;
}

// Global delegated click handler — any element with [data-speak]
// triggers TTS. Avoids per-spot event wiring; covers popover, flashcards,
// scene NPC bubbles, and any future location with one rule. Stops the
// click from bubbling into other handlers (popover open, etc.).
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-speak]');
  if (!btn) return;
  e.stopPropagation();
  e.preventDefault();
  TTS.speak(btn.dataset.speak);
});

// ── Utilities ───────────────────────────────────────────────────────────
function escHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  // Escape the full set so a value is safe in BOTH single- and double-quoted
  // attributes and can't break out into markup. `&` must go first so the other
  // entities aren't double-escaped. All values are author-authored today, so
  // this is defense-in-depth — but several data-* attributes (data-speak,
  // data-stem, data-kanji…) flow user-reachable strings into innerHTML, and
  // these entities decode back to the original on getAttribute(), so handlers
  // read the identical value (the change is transparent to existing behavior).
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render a Japanese label that may contain '\n' as a stack-on-line-break
// directive. Each line becomes its own <span> so the existing CSS rule
// `.cat-ja > span { display: block }` lays them out as stacked lines —
// useful for multi-word loanword titles (ファスト + フード) that would
// otherwise wrap mid-word in narrow sidebar columns. Plain strings (no
// \n) render as a single escaped text node, identical to before.
function multilineJa(s) {
  const text = String(s);
  if (!text.includes('\n')) return escHTML(text);
  return text.split('\n').map(line => `<span>${escHTML(line)}</span>`).join('');
}

/** Heisig chip: tiny badge with tooltip showing RTK frame + keyword + story. */
function heisigChip(kanji) {
  if (typeof HEISIG === 'undefined') return '';
  // For multi-char entries, try first char
  const key = kanji.length === 1 ? kanji : kanji[0];
  const h = HEISIG[key];
  if (!h) return '';
  // When the learner toggles English OFF (study mode), strip the keyword
  // from the visible chip AND suppress the hover tooltip — both surfaces
  // would otherwise leak the meaning the learner is trying to recall.
  // Toggle English back ON to check.
  if (!APP.flashShowEn) {
    return `
      <span class="heisig-chip heisig-chip-noen" title="Heisig frame #${h.frame}">
        <span class="h-icon">H</span>
        <span class="h-kw">#${h.frame}</span>
      </span>`;
  }
  return `
    <span class="heisig-chip">
      <span class="h-icon">H</span>
      <span class="h-kw">#${h.frame} · ${escHTML(h.keyword)}</span>
      <span class="heisig-tip">
        <div class="ht-head">
          <span class="ht-frame">#${h.frame}</span>
          <span class="ht-kw">${escHTML(h.keyword)}</span>
        </div>
        ${h.story ? `<div class="ht-story">${escHTML(h.story)}</div>` : ''}
        <div class="ht-src">Remembering the Kanji — James Heisig, 4th Ed.</div>
      </span>
    </span>`;
}

// Particle colors are keyed to grammatical role so the same color travels
// with the same function across every sentence. に joins で in the green
// family because both mark place/time — slightly different shades so the
// two stay distinguishable side-by-side.
const PARTICLE_COLORS = {
  'は':'#8a2538', // topic        — wine
  'を':'#5a2e8a', // direct object — purple
  'が':'#c97a2c', // subject       — orange
  'と':'#2a5b94', // with/and      — blue
  'の':'#c43a4a', // possessive    — red
  'で':'#2e7a3f', // place of action / means — forest green
  'に':'#1f7a5e', // destination / time / indirect object — teal green
};
const PARTICLE_CHARS = ['は','を','が','と','の','で','に'];

function _isHiragana(c) { return !!c && /[぀-ゟ]/.test(c); }

function colorParticles(ja) {
  if (!ja) return '';
  let html = '';
  for (let i = 0; i < ja.length; i++) {
    const c = ja[i];
    const next = ja[i + 1] || '';
    if (PARTICLE_COLORS[c] && !_isHiragana(next)) {
      html += `<span class="ja-particle" style="color:${PARTICLE_COLORS[c]};margin:0 0.18em;font-weight:500">${c}</span>`;
    } else {
      html += c;
    }
  }
  return html;
}

// ── Lookup indexes ───────────────────────────────────────────────────────
// window.VOCAB_BOOKS / FLASHCARD_CLASSES / DICTIONARY are static seed data,
// loaded once via <script> and never mutated at runtime. These indexes are
// therefore built lazily on first use and cached for the page lifetime (no
// invalidation needed), replacing the repeated linear scans that previously ran
// on every popover lookup, dictionary keystroke, flashcard render, and radical
// toggle. Each builder preserves the original scan's first-match-wins order, and
// each accessor returns the same shape (fresh `{...card, classId}` copies where
// the originals did) so rendered output is byte-identical.
const Idx = (function () {
  let _vocabItem = null;       // kanji|ja|kana            -> vocab item (first match)
  let _dictEntry = null;       // kanji|kana               -> DICTIONARY entry (first match)
  let _dictKanjiByChar = null; // char                     -> kind:'kanji' entry (first match)
  let _cardByKanji = null;     // kanji                    -> { card, classId, idx } (first match)
  let _kunIndex = null;        // normalized kun           -> [{...card, classId}]
  let _seeAlsoReverse = null;  // target kanji             -> [{ card, classId }] (cards pointing at it)
  let _radicalCandidates = null; // [{ card, classId, radicals }] deduped non-radical cards
  let _dictTags = null;        // sorted unique DICTIONARY tag list

  function buildVocab() {
    _vocabItem = new Map();
    for (const book of (window.VOCAB_BOOKS || [])) {
      for (const page of (book.pages || [])) {
        for (const item of (page.items || [])) {
          for (const key of [item.kanji, item.ja, item.kana]) {
            if (key && !_vocabItem.has(key)) _vocabItem.set(key, item);
          }
        }
      }
    }
  }
  function buildDict() {
    _dictEntry = new Map();
    _dictKanjiByChar = new Map();
    const tags = new Set();
    for (const e of (window.DICTIONARY || [])) {
      if (e.kanji && !_dictEntry.has(e.kanji)) _dictEntry.set(e.kanji, e);
      if (e.kana && !_dictEntry.has(e.kana)) _dictEntry.set(e.kana, e);
      if (e.kind === 'kanji' && e.kanji && !_dictKanjiByChar.has(e.kanji)) _dictKanjiByChar.set(e.kanji, e);
      for (const t of (e.tags || [])) tags.add(t);
    }
    _dictTags = [...tags].sort();
  }
  function buildCards() {
    _cardByKanji = new Map();
    _kunIndex = new Map();
    _seeAlsoReverse = new Map();
    _radicalCandidates = [];
    const radSeen = new Set();
    for (const cls of (window.FLASHCARD_CLASSES || [])) {
      let idx = 0;
      for (const card of cls.cards) {
        const here = idx++;
        if (card.kanji && !_cardByKanji.has(card.kanji)) {
          _cardByKanji.set(card.kanji, { card, classId: cls.id, idx: here });
        }
        const kun = (card.kun || '').replace(/[().\s]/g, '');
        if (kun) {
          if (!_kunIndex.has(kun)) _kunIndex.set(kun, []);
          _kunIndex.get(kun).push(Object.assign({}, card, { classId: cls.id }));
        }
        for (const target of (card.seeAlso || [])) {
          if (!_seeAlsoReverse.has(target)) _seeAlsoReverse.set(target, []);
          _seeAlsoReverse.get(target).push({ card, classId: cls.id });
        }
        if (card.type !== 'radical' && card.kanji && !radSeen.has(card.kanji)) {
          const radicals = radicalsForKanji(card.kanji);
          if (radicals.length) {
            _radicalCandidates.push({ card, classId: cls.id, radicals });
            radSeen.add(card.kanji);
          }
        }
      }
    }
  }

  return {
    vocabItem(text)        { if (!_vocabItem) buildVocab(); return _vocabItem.get(text) || null; },
    dictEntry(text)        { if (!_dictEntry) buildDict(); return _dictEntry.get(text) || null; },
    dictKanjiByChar(c)     { if (!_dictKanjiByChar) buildDict(); return _dictKanjiByChar.get(c) || null; },
    dictTags()             { if (!_dictTags) buildDict(); return _dictTags; },
    cardEntry(kanji)       { if (!_cardByKanji) buildCards(); return _cardByKanji.get(kanji) || null; },
    kunIndex()             { if (!_kunIndex) buildCards(); return _kunIndex; },
    seeAlsoReverse(kanji)  { if (!_seeAlsoReverse) buildCards(); return _seeAlsoReverse.get(kanji) || []; },
    radicalCandidates()    { if (!_radicalCandidates) buildCards(); return _radicalCandidates; },
  };
})();

function kanjiReading(c) {
  const readings = window.KANJI_READINGS || {};
  if (readings[c]) return readings[c];
  // Fall back to a dictionary kanji entry's kana (convert katakana → hiragana,
  // drop the okurigana marker after `.`).
  const dictEntry = Idx.dictKanjiByChar(c);
  if (dictEntry && dictEntry.kana) {
    return dictEntry.kana.split('.')[0]
      .replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  }
  return '';
}

function splitKanjiBreakdown(word, kana) {
  if (!word) return null;
  const meanings = window.KANJI_MEANINGS || {};
  const chars = [...word];
  const kanji = chars.filter(c => /[㐀-鿿]/.test(c));
  const hiragana = chars.filter(c => /[぀-ゟ]/.test(c));
  if (kanji.length === 0) return null;
  if (kanji.length === 1 && hiragana.length === 0) return null;
  const aligned = alignReadings(word, kana);
  const out = [];
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    if (/[㐀-鿿]/.test(c)) {
      out.push({
        char: c,
        reading: (aligned && aligned.get(i)) || kanjiReading(c),
        meaning: meanings[c] || '?'
      });
    }
  }
  return out;
}

// Align a word's per-kanji reading against the supplied kana, so context-
// dependent readings come out right. The hiragana runs in the word are
// matched literally in the kana; everything else is attributed to the
// surrounding kanji. Adjacent kanji are split by walking each one's default
// reading from KANJI_READINGS. Returns a Map(index → reading) or null on
// mismatch.
function alignReadings(word, kana) {
  if (!word || !kana) return null;
  const ka = kana.replace(/[\s　]/g, '');
  const toHira = s => s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));

  // Tokenize word into kanji singletons + literal (non-kanji) runs.
  const tokens = [];
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    if (/[㐀-鿿]/.test(c)) {
      tokens.push({ type: 'k', char: c, idx: i });
    } else {
      const last = tokens[tokens.length - 1];
      if (last && last.type === 'lit') last.text += c;
      else tokens.push({ type: 'lit', text: c });
    }
  }

  // Locate each literal in the kana; the gaps between them are kanji.
  let kPos = 0;
  for (const tok of tokens) {
    if (tok.type !== 'lit') continue;
    const hira = toHira(tok.text);
    const idx = ka.indexOf(hira, kPos);
    if (idx < 0) return null;
    tok.kanaStart = idx;
    tok.kanaEnd = idx + hira.length;
    kPos = tok.kanaEnd;
  }

  // Fill in kanji readings from the gaps.
  const out = new Map();
  let prevEnd = 0;
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (tok.type === 'lit') { prevEnd = tok.kanaEnd; continue; }
    const nextLit = tokens.slice(t + 1).find(x => x.type === 'lit');
    const endPos = nextLit ? nextLit.kanaStart : ka.length;
    const cluster = [tok];
    while (t + 1 < tokens.length && tokens[t + 1].type === 'k') {
      cluster.push(tokens[t + 1]); t++;
    }
    const total = ka.slice(prevEnd, endPos);
    if (cluster.length === 1) {
      out.set(cluster[0].idx, total);
    } else {
      // First pass: match each kanji's default reading sequentially. If every
      // default lines up, great. If any default fails, split the cluster's
      // total kana proportionally by the default *lengths* instead — this
      // catches rendaku and other one-mora shifts (e.g. お風呂: defaults よく
      // /ろ don't match, but lengths 2/1 → wrong; the actual ふ/ろ wants 1/1).
      const defs = cluster.map(k => (window.KANJI_READINGS || {})[k.char] || '');
      let pos = 0;
      let ok = true;
      for (let i = 0; i < cluster.length; i++) {
        if (defs[i] && total.slice(pos).startsWith(defs[i])) pos += defs[i].length;
        else { ok = false; break; }
      }
      if (ok && pos === total.length) {
        for (let i = 0, p = 0; i < cluster.length; i++) {
          out.set(cluster[i].idx, defs[i]); p += defs[i].length;
        }
      } else {
        // Proportional fallback: distribute `total` across the cluster using
        // the ratio of each kanji's default-reading length. Kanji with no
        // default reading get an equal share.
        const lens = defs.map(d => d.length || 1);
        const lensSum = lens.reduce((a, b) => a + b, 0);
        let p = 0;
        for (let i = 0; i < cluster.length; i++) {
          const share = i === cluster.length - 1
            ? total.length - p
            : Math.round(total.length * lens[i] / lensSum);
          out.set(cluster[i].idx, total.slice(p, p + share));
          p += share;
        }
      }
    }
    prevEnd = endPos;
  }
  return out;
}

// Wrap each kanji in a word with <ruby>k<rt>reading</rt></ruby>. Non-kanji
// characters pass through unchanged so シャワーを浴びる only annotates 浴.
// When `kana` is provided, the per-kanji reading is aligned against it
// (so 浴 reads あ in 浴びる but よく in 浴室).
function withFurigana(word, kana) {
  if (!word) return '';
  const aligned = alignReadings(word, kana);
  let html = '';
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    if (/[㐀-鿿]/.test(c)) {
      const r = (aligned && aligned.get(i)) || kanjiReading(c);
      html += r
        ? `<ruby>${escHTML(c)}<rt>${escHTML(r)}</rt></ruby>`
        : escHTML(c);
    } else {
      html += escHTML(c);
    }
  }
  return html;
}

function parseChunk(text) {
  if (!text) return { stem: '', particles: [], punct: '' };
  let rest = text;
  const punctMatch = rest.match(/([。、！？!?,\.…]+)$/);
  const punct = punctMatch ? punctMatch[0] : '';
  if (punct) rest = rest.slice(0, -punct.length);
  const particles = [];
  while (rest.length > 1 && PARTICLE_CHARS.includes(rest[rest.length - 1])) {
    particles.unshift(rest[rest.length - 1]);
    rest = rest.slice(0, -1);
  }
  return { stem: rest, particles, punct };
}

function lookupWord(text) {
  if (!text) return null;
  const item = Idx.vocabItem(text);
  if (item) {
    const k = item.kanji || item.ja;
    return { kanji: k || text, kana: item.kana || '', en: item.en || '' };
  }
  const d = Idx.dictEntry(text);
  if (d) return { kanji: d.kanji, kana: d.kana, en: d.en };

  // Character-level fallback: a single kanji that's not in any vocab book
  // or DICTIONARY entry might still have an entry in KANJI_READINGS and
  // KANJI_MEANINGS. Without this, clicking unknown kanji inside a sentence
  // (e.g. 前 inside 食べる 前に) showed an empty popover. The rule now is
  // that every kanji we have any data for surfaces at least its reading
  // and meaning when clicked.
  const chars = [...text];
  if (chars.length === 1) {
    const c = chars[0];
    const meanings = window.KANJI_MEANINGS || {};
    const readings = window.KANJI_READINGS || {};
    if (meanings[c] || readings[c]) {
      return { kanji: c, kana: readings[c] || '', en: meanings[c] || '' };
    }
  }
  return { kanji: text, kana: '', en: '' };
}

function wordChunkHTML(text) {
  const { stem, particles, punct } = parseChunk(text);
  if (!stem) return escHTML(text);
  const particleSpans = particles.map(p =>
    `<span class="ja-particle" style="color:${PARTICLE_COLORS[p]||'inherit'};font-weight:500;margin:0">${p}</span>`
  ).join('');
  return `<span class="word-chunk" data-stem="${escAttr(stem)}" title="click to look up · double-click for dictionary"><span class="wc-stem">${escHTML(stem)}</span>${particleSpans}</span>${escHTML(punct)}`;
}

// Split a Japanese line into clickable chunks. A chunk boundary is either
// whitespace OR the position right after a punctuation mark — so "前に、手を"
// becomes ["前に、", "手を"] and the に particle separates cleanly from the
// 手 that follows it.
function splitJaChunks(text) {
  const chunks = [];
  let cur = '';
  for (const c of text) {
    if (/[\s　]/.test(c)) {
      if (cur) { chunks.push(cur); cur = ''; }
    } else {
      cur += c;
      if (/[、。！？!?,…]/.test(c)) { chunks.push(cur); cur = ''; }
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

function jaSentenceHTML(text) {
  if (!text) return '';
  return splitJaChunks(text).map(wordChunkHTML).join('');
}

// ── Popover ─────────────────────────────────────────────────────────────
function initPopover() {
  const backdrop = document.getElementById('word-pop-backdrop');

  backdrop.addEventListener('click', closePopover);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });

  document.getElementById('main').addEventListener('click', e => {
    const chunk = e.target.closest('.word-chunk');
    if (!chunk) return;
    e.stopPropagation();
    openPopover(lookupWord(chunk.dataset.stem), chunk.getBoundingClientRect());
  });
  document.getElementById('main').addEventListener('dblclick', e => {
    const chunk = e.target.closest('.word-chunk');
    if (!chunk) return;
    e.preventDefault(); e.stopPropagation();
    jumpToDictionary(chunk.dataset.stem);
  });

  document.getElementById('main').addEventListener('click', e => {
    // A click on a hotspot opens the popover the same way the row does —
    // hotspots are just an alternate entry point. Take this branch first
    // because the hotspot lives inside the image column, not the row.
    const hot = e.target.closest('.sheet-hotspot[data-kanji]');
    if (hot) {
      openPopover({ kanji: hot.dataset.kanji, kana: hot.dataset.kana, en: hot.dataset.en }, hot.getBoundingClientRect());
      return;
    }
    const row = e.target.closest('.vocab-row[data-kanji]');
    if (!row) return;
    openPopover({ kanji: row.dataset.kanji, kana: row.dataset.kana, en: row.dataset.en }, row.getBoundingClientRect());
  });
  document.getElementById('main').addEventListener('dblclick', e => {
    const hot = e.target.closest('.sheet-hotspot[data-kanji]');
    if (hot) { e.preventDefault(); jumpToDictionary(hot.dataset.kanji); return; }
    const row = e.target.closest('.vocab-row[data-kanji]');
    if (!row) return;
    e.preventDefault();
    jumpToDictionary(row.dataset.kanji);
  });

  // ── Bidirectional hover sync: vocab row ↔ image hotspot ─────────────
  // Hovering either side lights up its partner. Uses `data-num` as the
  // join key (set by cheatsheetHTML). Scoped to whatever cheatsheet is
  // currently mounted — selectors run against `#main` each event.
  const syncHover = (num, on) => {
    if (num == null) return;
    document.querySelectorAll(`.vocab-row[data-num="${num}"]`).forEach(r => r.classList.toggle('is-synced', on));
    document.querySelectorAll(`.sheet-hotspot[data-num="${num}"]`).forEach(h => h.classList.toggle('is-active', on));
  };
  document.getElementById('main').addEventListener('pointerover', e => {
    const target = e.target.closest('.vocab-row[data-num], .sheet-hotspot[data-num]');
    if (!target) return;
    syncHover(target.dataset.num, true);
    // If this is a hotspot, decide whether the tooltip needs to flip up
    // or leftward to stay inside the image bounds. We measure once per
    // enter so the tip never clips off-screen.
    if (target.classList.contains('sheet-hotspot')) {
      target.classList.remove('tip-up', 'tip-left');
      const img = target.closest('.sheet-image');
      if (!img) return;
      const imgRect = img.getBoundingClientRect();
      const tip = target.querySelector('.sheet-hotspot-tip');
      if (!tip) return;
      // Force layout so we can measure the tooltip\'s natural rect.
      tip.style.visibility = 'hidden'; tip.style.opacity = '1';
      const tipRect = tip.getBoundingClientRect();
      tip.style.visibility = ''; tip.style.opacity = '';
      if (tipRect.bottom > imgRect.bottom - 4)   target.classList.add('tip-up');
      if (tipRect.right  > imgRect.right  - 4)   target.classList.add('tip-left');
      else if (tipRect.left < imgRect.left + 4)  target.classList.remove('tip-left'); // edge case — stays default
    }
  });
  document.getElementById('main').addEventListener('pointerout', e => {
    const target = e.target.closest('.vocab-row[data-num], .sheet-hotspot[data-num]');
    if (!target) return;
    // Only fire when the pointer truly leaves the element (not just moves
    // between its own children). `relatedTarget` may be null on touch/blur.
    if (target.contains(e.relatedTarget)) return;
    syncHover(target.dataset.num, false);
  });

  // Usage cards: the whole card is the click target, not its contents.
  document.getElementById('main').addEventListener('click', e => {
    const card = e.target.closest('.usage-card[data-kanji]');
    if (!card) return;
    openPopover({ kanji: card.dataset.kanji, kana: card.dataset.kana, en: card.dataset.en }, card.getBoundingClientRect());
  });
  document.getElementById('main').addEventListener('dblclick', e => {
    const card = e.target.closest('.usage-card[data-kanji]');
    if (!card) return;
    e.preventDefault();
    jumpToDictionary(card.dataset.kanji);
  });
}

function jumpToDictionary(q) {
  // Search + Dictionary were merged into the Library hub; 'dictionary' is no
  // longer a top-level section. Route to the library section on its Dictionary
  // page so setSection toggles the library sidebar and renderLibrary →
  // renderDictionary consumes pendingDictQ. (Calling setSection('dictionary')
  // here left the app on an invalid section with no sidebar and dropped the
  // query.)
  APP.pendingDictQ = q;
  APP.libraryPage = 'dictionary';
  lsSet('jp:libraryPage', 'dictionary');
  setSection('library');
}

function openPopover(item, anchorRect) {
  const pop = document.getElementById('word-pop');
  const backdrop = document.getElementById('word-pop-backdrop');
  const breakdown = splitKanjiBreakdown(item.kanji, item.kana);
  const bdHTML = breakdown ? `
    <div class="word-pop-breakdown">
      ${breakdown.map((b, i) => `
        ${i > 0 ? '<span class="bk-sep">·</span>' : ''}
        <span class="bk-pair">
          <span class="bk-stack">
            <span class="bk-reading">${escHTML(b.reading)}</span>
            <span class="bk-kanji">${escHTML(b.char)}</span>
          </span>
          <span class="bk-eq">=</span>
          <span class="bk-meaning">${escHTML(b.meaning)}</span>
        </span>
      `).join('')}
    </div>` : '';

  // Glyph font scales down with length so a single kanji stays imposing but
  // a six-character phrase still fits the popover without wrapping.
  const glyphLen = [...(item.kanji || '')].length;
  const glyphSize = glyphLen <= 2 ? 52 : glyphLen <= 4 ? 34 : glyphLen <= 6 ? 26 : 22;

  pop.innerHTML = `
    <button class="word-pop-close" id="pop-close" aria-label="close">×</button>
    <button class="tts-btn" type="button" aria-label="読み上げ (speak)" title="読み上げ"
            data-speak="${escAttr(item.kana || item.kanji || '')}">
      ${speakerIconSVG()}
    </button>
    <div class="word-pop-glyph" style="font-size:${glyphSize}px;line-height:1.35">${withFurigana(item.kanji || '', item.kana || '')}</div>
    <div class="word-pop-kana">${escHTML(item.kana || '')}</div>
    <div class="word-pop-en">${escHTML(item.en || '')}</div>
    ${bdHTML}`;

  document.getElementById('pop-close').addEventListener('click', closePopover);
  // Auto-speak on open so the user hears the word immediately, then
  // the speaker button is for replays.
  const initialSpeak = item.kana || item.kanji;
  if (initialSpeak) TTS.speak(initialSpeak);
  pop.querySelector('.word-pop-glyph').addEventListener('dblclick', e => {
    e.preventDefault(); jumpToDictionary(item.kanji || item.kana);
  });

  pop.classList.remove('is-hidden');
  backdrop.style.display = 'block';

  const popW = pop.offsetWidth || 304;
  const popH = pop.offsetHeight || 200;
  const gap = 14, margin = 16;
  const vw = window.innerWidth, vh = window.innerHeight;
  const r = anchorRect;
  let left = r.right + gap;
  let top = r.top - 8;
  if (left + popW > vw - margin) {
    left = r.left - popW - gap;
    if (left < margin) { left = Math.max(margin, Math.min(vw - popW - margin, r.left)); top = r.bottom + gap; }
  }
  if (top + popH > vh - margin) top = vh - popH - margin;
  if (top < margin) top = margin;
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function closePopover() {
  document.getElementById('word-pop').classList.add('is-hidden');
  document.getElementById('word-pop-backdrop').style.display = 'none';
}

// ── Sidebar ─────────────────────────────────────────────────────────────
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="brand" tabindex="0" aria-describedby="brand-tooltip">
        <img class="brand-logo" src="images/logo.webp" alt="nihongo" loading="eager" />
        <div class="brand-tooltip" id="brand-tooltip" role="tooltip">
          <div class="brand-tooltip-head">
            <span class="brand-tooltip-glyph">明</span>
            <span class="brand-tooltip-meaning">
              <span class="kw">brightness · clarity · understanding</span>
              <span class="reading">めい · あか-るい</span>
            </span>
          </div>
          <div class="brand-tooltip-compose">
            <span class="brand-tooltip-radical brand-tooltip-radical-sun">日</span>
            <span class="brand-tooltip-plus">+</span>
            <span class="brand-tooltip-radical">月</span>
            <span class="brand-tooltip-arrow">→</span>
            <span class="brand-tooltip-result">明</span>
          </div>
          <p>
            A composite kanji: <strong>日</strong> (sun) plus <strong>月</strong> (moon)
            — the two largest things in the sky pressed together to mean
            <em>bright, lucid, comprehensible</em>. In the logo the sun radical
            is rendered in vermilion to echo the <em>hinomaru</em>; 月 stays in
            sumi ink.
          </p>
          <p>
            Fitting for a project about reading and learning Japanese:
            <em>明</em> is what we want the language to become for the learner.
          </p>
        </div>
      </div>
      <ul class="nav-list">
        ${SECTIONS.map(s => {
          const isActive = APP.section === s.id;
          return `
          <li>
            <button class="bookmark ${isActive ? 'active' : ''}" data-section="${s.id}">
              <span class="glyph">${s.glyph}</span>
              <span class="label">
                <span class="ja">${s.ja}</span>
                <span class="en">${s.en}</span>
              </span>
              ${isActive ? activeBrushHTML(1) : ''}
            </button>
          </li>
        `;
        }).join('')}
      </ul>
      <div class="settings-link">
        <button type="button" id="settings-open" aria-label="設定 (settings)">設定</button>
        <button type="button"
                id="audio-settings-open"
                class="audio-settings-btn"
                aria-label="音声 (voice, volume, speed)"
                title="音声 — voice, volume, speed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 010 14.14"/>
            <path d="M15.54 8.46a5 5 0 010 7.07"/>
          </svg>
        </button>
      </div>
      <div id="audio-settings-popover" class="audio-settings-popover" hidden></div>
    </div>`;
  sidebar.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', () => setSection(btn.dataset.section));
  });
  const openBtn = sidebar.querySelector('#settings-open');
  if (openBtn) openBtn.addEventListener('click', openSettingsModal);
  const audioBtn = sidebar.querySelector('#audio-settings-open');
  if (audioBtn) audioBtn.addEventListener('click', toggleAudioSettingsPopover);
}

function updateSidebar() {
  // Toggle the .active class AND manage the active-brush child element.
  // Without managing the brush, switching sections leaves the old brush
  // sitting on whichever bookmark it was last rendered on — the class
  // moves, the brush doesn't. We add/remove the img directly so a fresh
  // brush animation fires on each section switch.
  document.querySelectorAll('.bookmark').forEach(btn => {
    const isActive = btn.dataset.section === APP.section;
    btn.classList.toggle('active', isActive);
    const existing = btn.querySelector(':scope > .active-brush');
    if (isActive && !existing) {
      btn.insertAdjacentHTML('beforeend', activeBrushHTML(1));
    } else if (!isActive && existing) {
      existing.remove();
    }
  });
}

// ── Settings ────────────────────────────────────────────────────────────
function renderSettings() {
  const panel = document.getElementById('settings-panel');
  panel.innerHTML = `
    <div class="settings-row">
      <span>Show English</span>
      <button class="settings-toggle" aria-checked="${APP.showEnglish}" data-setting="showEnglish" role="switch"><i></i></button>
    </div>
    <div class="settings-row">
      <span>Particle colors</span>
      <button class="settings-toggle" aria-checked="${APP.particlesOn}" data-setting="particlesOn" role="switch"><i></i></button>
    </div>
    <div class="settings-row">
      <span>Density</span>
      <div class="settings-density">
        ${['compact','comfortable','roomy'].map(d =>
          `<button data-density="${d}" class="${APP.density === d ? 'active' : ''}">${d[0].toUpperCase()}</button>`
        ).join('')}
      </div>
    </div>`;

  panel.querySelectorAll('[data-setting]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.setting;
      APP[key] = !APP[key];
      lsSet(key === 'showEnglish' ? 'jp:showEnglish' : 'jp:particles', APP[key]);
      applyBodyClasses();
      renderSettings();
    });
  });
  panel.querySelectorAll('[data-density]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.density = btn.dataset.density;
      lsSet('jp:density', APP.density);
      applyBodyClasses();
      renderSettings();
    });
  });
}

function initSettings() {
  // FAB removed from the UI; bail safely. The renderSettings()
  // function is kept around in case we surface those toggles later
  // (in the sidebar, say) without rewriting them.
  const btn = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  if (!btn || !panel) return;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (panel.hasAttribute('hidden')) { renderSettings(); panel.removeAttribute('hidden'); }
    else panel.setAttribute('hidden', '');
  });
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn) panel.setAttribute('hidden', '');
  });
}

// ── Audio settings popover ──────────────────────────────────────────────
// Light-weight popover anchored next to the 設定 button. Three controls:
//   - Volume      (0-100 → 0-1 stored in APP.ttsVolume)
//   - Speed       (0.5-1.5 stored in APP.ttsRate)
//   - Voice       (dropdown of Japanese voices from window.speechSynthesis)
// Plus a small "テスト" play button that fires a sample phrase so the user
// can hear their settings without leaving the popover. All three persist
// to localStorage immediately on change. The popover is dismissed by
// clicking outside or pressing Escape — same pattern as the existing
// dictionary-card popovers. Used for every TTS call across the site
// (the TTS module reads APP.* on each speak()).
function toggleAudioSettingsPopover(evt, anchorEl) {
  if (evt) evt.stopPropagation();
  const pop = document.getElementById('audio-settings-popover');
  if (!pop) return;
  // Anchor the popover to whichever control opened it (sidebar speaker by
  // default, or the Shadowing studio's voice icon when passed).
  const anchor = anchorEl || document.getElementById('audio-settings-open');
  if (pop.hasAttribute('hidden')) {
    // Move the popover element to <body> so its z-index escapes any
    // stacking context the sidebar ancestor (transform / overflow /
    // isolation) has created. Idempotent — if already a body child,
    // this is a no-op re-insert at the same point in the tree.
    if (pop.parentElement !== document.body) {
      document.body.appendChild(pop);
    }
    renderAudioSettingsPopover();
    positionAudioSettingsPopover(pop, anchor);
    pop.removeAttribute('hidden');
    // Close on outside-click / escape — one-shot listeners so they
    // self-detach when the popover closes. Outside-click ignores the
    // anchor that opened it so the same click doesn't re-toggle.
    const closeOnOutside = (e) => {
      if (pop.contains(e.target) || (anchor && anchor.contains(e.target)) || e.target.closest('#audio-settings-open')) return;
      pop.setAttribute('hidden', '');
      document.removeEventListener('click', closeOnOutside);
      document.removeEventListener('keydown', closeOnEsc);
    };
    const closeOnEsc = (e) => {
      if (e.key !== 'Escape') return;
      pop.setAttribute('hidden', '');
      document.removeEventListener('click', closeOnOutside);
      document.removeEventListener('keydown', closeOnEsc);
    };
    // Defer the listener attachment so the current click that opened
    // the popover doesn't immediately close it.
    setTimeout(() => {
      document.addEventListener('click', closeOnOutside);
      document.addEventListener('keydown', closeOnEsc);
    }, 0);
  } else {
    pop.setAttribute('hidden', '');
  }
}

// Position the popover above the audio-settings button using
// position: fixed coordinates so it always lands at the button
// regardless of DOM ancestry, scroll offsets, or transforms. Anchor:
// 8px gap above the button, popover's right edge aligned to the
// button's right edge. Falls back to viewport-margin if computed
// position would push the panel off-screen on either side.
function positionAudioSettingsPopover(pop, anchorEl) {
  const btn = anchorEl || document.getElementById('audio-settings-open');
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  const POP_W = 340;     // matches the CSS width
  const GAP   = 8;
  const MARGIN = 12;     // min viewport margin
  // Pre-measure popover height by reading offsetHeight after a
  // visibility:hidden mount — but to avoid that flicker, just guess
  // a sane height (350px) for the upward offset; the popover content
  // is bounded by its 4 rows + header + test row.
  const POP_H_EST = 340;
  // Default: above the button (sidebar lives at bottom of viewport).
  let top  = r.top - POP_H_EST - GAP;
  let left = r.right - POP_W;
  // If above doesn't fit (panel would clip off the top), drop below.
  if (top < MARGIN) top = r.bottom + GAP;
  // Horizontal clamp — keep within viewport.
  if (left < MARGIN) left = MARGIN;
  if (left + POP_W > window.innerWidth - MARGIN) {
    left = window.innerWidth - POP_W - MARGIN;
  }
  pop.style.top    = top  + 'px';
  pop.style.left   = left + 'px';
  pop.style.right  = 'auto';
  pop.style.bottom = 'auto';
}

function renderAudioSettingsPopover() {
  const pop = document.getElementById('audio-settings-popover');
  if (!pop) return;
  // Ensure the voice list is populated — on first open the browser
  // may have queued voices behind onvoiceschanged. ensureVoices()
  // both retrieves and triggers a refresh if empty.
  if (window.TTS && typeof window.TTS.ensureVoices === 'function') {
    window.TTS.ensureVoices();
  }
  const jaVoices = (window.TTS && window.TTS.listJa) ? window.TTS.listJa() : [];
  const currentVoiceURI = APP.ttsVoiceURI || '';
  const vol  = Math.max(0, Math.min(1, +APP.ttsVolume || 1));
  const rate = Math.max(0.5, Math.min(1.5, +APP.ttsRate || 0.85));

  const gcloudVoices = (APP.gcloudTtsKey && window.TTS && TTS.GCLOUD_VOICES) ? TTS.GCLOUD_VOICES : [];
  const voiceOpts = [
    `<option value="">${escHTML('Auto (best Japanese voice)')}</option>`,
    ...gcloudVoices.map(g => {
      const val = 'gcloud:' + g.id;
      return `<option value="${escAttr(val)}"${val === currentVoiceURI ? ' selected' : ''}>${escHTML(g.label)}</option>`;
    }),
    ...jaVoices.map(v => {
      const sel = v.voiceURI === currentVoiceURI ? ' selected' : '';
      return `<option value="${escAttr(v.voiceURI)}"${sel}>${escHTML(v.name || v.voiceURI)}</option>`;
    })
  ].join('');

  pop.innerHTML = `
    <div class="audio-settings-pop-head">
      <span class="audio-settings-pop-title">
        <ruby>音声<rt>おんせい</rt></ruby>
      </span>
      <span class="audio-settings-pop-en">voice &amp; volume</span>
    </div>
    <label class="audio-settings-row">
      <span class="audio-settings-label">
        <ruby>音量<rt>おんりょう</rt></ruby>
        <span class="audio-settings-label-en">volume</span>
      </span>
      <input class="audio-settings-slider" type="range" min="0" max="1" step="0.05"
             id="audio-vol-slider" value="${vol}">
      <span class="audio-settings-value" id="audio-vol-value">${Math.round(vol * 100)}%</span>
    </label>
    <label class="audio-settings-row">
      <span class="audio-settings-label">
        <ruby>速度<rt>そくど</rt></ruby>
        <span class="audio-settings-label-en">speed</span>
      </span>
      <input class="audio-settings-slider" type="range" min="0.5" max="1.5" step="0.05"
             id="audio-rate-slider" value="${rate}">
      <span class="audio-settings-value" id="audio-rate-value">${rate.toFixed(2)}×</span>
    </label>
    <label class="audio-settings-row audio-settings-row-voice">
      <span class="audio-settings-label">
        <ruby>声<rt>こえ</rt></ruby>
        <span class="audio-settings-label-en">voice</span>
      </span>
      <select class="audio-settings-select" id="audio-voice-select">
        ${voiceOpts}
      </select>
    </label>
    <div class="audio-settings-test-row">
      <button type="button" class="audio-settings-test" id="audio-test-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M19.07 4.93a10 10 0 010 14.14"/>
          <path d="M15.54 8.46a5 5 0 010 7.07"/>
        </svg>
        <span>テスト</span>
      </button>
      <span class="audio-settings-test-hint">こんにちは、おいしいです。</span>
    </div>`;

  // Live-update each control: slider input event writes immediately so
  // dragging gives audible/visual feedback; localStorage write happens
  // on every event so a refresh mid-drag still preserves the last set
  // value (writes are cheap, debounce unnecessary).
  const volSlider = pop.querySelector('#audio-vol-slider');
  const volValue  = pop.querySelector('#audio-vol-value');
  volSlider.addEventListener('input', e => {
    const v = +e.target.value;
    APP.ttsVolume = v;
    lsSet('jp:ttsVolume', v);
    volValue.textContent = Math.round(v * 100) + '%';
  });

  const rateSlider = pop.querySelector('#audio-rate-slider');
  const rateValue  = pop.querySelector('#audio-rate-value');
  rateSlider.addEventListener('input', e => {
    const v = +e.target.value;
    APP.ttsRate = v;
    lsSet('jp:ttsRate', v);
    rateValue.textContent = v.toFixed(2) + '×';
  });

  const voiceSel = pop.querySelector('#audio-voice-select');
  voiceSel.addEventListener('change', e => {
    const v = e.target.value || null;
    APP.ttsVoiceURI = v;
    lsSet('jp:ttsVoiceURI', v);
  });

  const testBtn = pop.querySelector('#audio-test-btn');
  testBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (window.TTS) window.TTS.speak('こんにちは、おいしいです。');
  });
}

// ── Settings modal (opened from the sidebar 設定 link) ──────────────────
// Full-featured user preferences: site-wide JP font, TTS voice picker,
// rate, autoplay toggle + delay, and the legacy showEnglish / particles
// toggles. Persists everything to localStorage via lsSet and applies
// changes live (no reload).
function openSettingsModal() {
  closeSettingsModal();
  const wrap = document.createElement('div');
  wrap.className = 'settings-modal-backdrop';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.id = 'settings-modal-backdrop';
  document.body.appendChild(wrap);

  function renderInside() {
    const voices = TTS.listJa();
    // Four font roles, each picks from its own set of options. JP roles
    // share the 4 kana-page fonts; the English-menu role gets Latin
    // alternatives since it sets English label typography.
    // Each option has two identifiers:
    //   `sample` — single-char fingerprint rendered in the font itself,
    //              fits the narrow sample column without wrapping.
    //   `ja` + `en` — combined into the longer descriptive label
    //              shown beside the sample (e.g. "明朝 · Mincho").
    const JP_FONT_OPTIONS = [
      { id:'mincho',   sample:'ミ', ja:'明朝',     en:'Mincho',    preview:'桜の花が咲きました' },
      { id:'gothic',   sample:'ゴ', ja:'ゴシック', en:'Gothic',    preview:'桜の花が咲きました' },
      { id:'kyokasho', sample:'あ', ja:'教科書',   en:'Textbook',  preview:'桜の花が咲きました' },
      { id:'brush',    sample:'筆', ja:'筆',       en:'Brush',     preview:'桜の花が咲きました' },
      { id:'noto',     sample:'の', ja:'ノト',     en:'Noto Sans', preview:'桜の花が咲きました' },
    ];
    const EN_FONT_OPTIONS = [
      { id:'garamond', sample:'Aa', ja:'ガラモン', en:'Garamond',  preview:'Eating out · Stays' },
      { id:'sans',     sample:'Aa', ja:'サンス',   en:'Sans',      preview:'Eating out · Stays' },
      { id:'caveat',   sample:'Aa', ja:'手書き',   en:'Hand',      preview:'Eating out · Stays' },
      { id:'mincho',   sample:'Aa', ja:'明朝',     en:'Mincho',    preview:'Eating out · Stays' },
      { id:'noto',     sample:'Aa', ja:'ノト',     en:'Noto Sans', preview:'Eating out · Stays' },
    ];
    // Settings tabs — one per font role.
    const FONT_TABS = [
      { id:'title', ja:'見出し',       en:'Title',           stateKey:'fontTitle', lsKey:'jp:fontTitle', attr:'data-font-title', options:JP_FONT_OPTIONS, sample:'ひらがな と カタカナ', sampleStyle:'font-size:28px;font-weight:600' },
      { id:'menu1', ja:'メニュー (JP)', en:'Menu 1 · sidebar JP', stateKey:'fontMenu1', lsKey:'jp:fontMenu1', attr:'data-font-menu-ja', options:JP_FONT_OPTIONS, sample:'語彙 · 単語札 · 文字',     sampleStyle:'font-size:15px' },
      { id:'menu2', ja:'メニュー (EN)', en:'Menu 2 · sidebar EN', stateKey:'fontMenu2', lsKey:'jp:fontMenu2', attr:'data-font-menu-en', options:EN_FONT_OPTIONS, sample:'Vocabulary · Flashcards · Writing', sampleStyle:'font-size:13px;font-style:italic' },
      { id:'body',  ja:'本文',         en:'Body · rest of text', stateKey:'uiFont',   lsKey:'jp:uiFont',   attr:'data-font',         options:JP_FONT_OPTIONS, sample:'今日は寒いです。本を読みます。', sampleStyle:'font-size:16px' },
    ];
    // Which tab is open. Default to title — that's the new control most
    // users will explore first. State sticks via APP._fontTab so the
    // selection survives in-modal re-renders.
    if (!APP._fontTab) APP._fontTab = 'title';
    const activeTab = FONT_TABS.find(t => t.id === APP._fontTab) || FONT_TABS[0];
    const activeFontId = APP[activeTab.stateKey];

    // Helpers: each font option in a tab needs its own preview stack.
    const stackFor = (tabId, fontId) => {
      // For JP-role tabs, reuse the existing JP stacks.
      if (tabId === 'title' || tabId === 'menu1' || tabId === 'body') {
        return fontStackFor(fontId);
      }
      // English-menu — return one of the Latin stacks.
      switch (fontId) {
        case 'garamond': return "'EB Garamond', Georgia, serif";
        case 'sans':     return "'Inter', 'Helvetica Neue', system-ui, sans-serif";
        case 'caveat':   return "'Caveat', cursive";
        case 'mincho':   return "'Shippori Mincho', 'Noto Serif JP', serif";
        case 'noto':     return "'Noto Sans', 'Helvetica Neue', system-ui, sans-serif";
        default:         return "'EB Garamond', Georgia, serif";
      }
    };

    wrap.innerHTML = `
      <div class="settings-modal" tabindex="-1">
        <button class="settings-modal-close" aria-label="閉じる (close)" type="button" data-settings-close>×</button>
        <h2>設定</h2>
        <div class="settings-eyebrow">site preferences · saved automatically</div>

        <section class="settings-section">
          <div class="settings-section-head">
            <span class="ja">フォント</span>
            <span class="en">Fonts · per role</span>
          </div>
          <div class="settings-font-tabs" role="tablist">
            ${FONT_TABS.map(t => `
              <button type="button" role="tab"
                      class="settings-font-tab ${activeTab.id === t.id ? 'is-active' : ''}"
                      data-font-tab="${escAttr(t.id)}"
                      aria-selected="${activeTab.id === t.id}">
                <span class="settings-font-tab-ja">${escHTML(t.ja)}</span>
                <span class="settings-font-tab-en">${escHTML(t.en)}</span>
              </button>
            `).join('')}
          </div>
          <div class="settings-font-sample" style="font-family:${escAttr(stackFor(activeTab.id, activeFontId))};${activeTab.sampleStyle}">
            ${escHTML(activeTab.sample)}
          </div>
          <div class="settings-font-dropdown-wrap">
            ${fontDropdownHTML(
              activeTab.options.map(o => ({
                id: o.id,
                label: o.ja + ' · ' + o.en,               // matches new-card dropdown labels
                sample: o.sample,                         // single-char fingerprint per font
                family: stackFor(activeTab.id, o.id),
              })),
              activeFontId,
              activeTab.stateKey === 'fontTitle'  ? 'fontTitle'  :
              activeTab.stateKey === 'fontMenu1' ? 'fontMenu1' :
              activeTab.stateKey === 'fontMenu2' ? 'fontMenu2' :
              'uiFont'
            )}
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-section-head">
            <span class="ja">音声</span>
            <span class="en">Voice · text-to-speech</span>
          </div>
          <div class="settings-field">
            <label class="settings-field-label" for="gcloud-key">
              Google Cloud API key
              <span class="hint">Optional. Unlocks Translate-quality neural voices and (in Shadowing) accurate speech recognition. One key powers both — enable the Text-to-Speech AND Speech-to-Text APIs on it. Stored only in this browser; restrict it to your domain.</span>
            </label>
            <input type="password" id="gcloud-key" placeholder="AIza…" autocomplete="off" spellcheck="false"
                   value="${escAttr(APP.gcloudTtsKey || '')}" />
          </div>
          ${APP.gcloudTtsKey ? `
          <div class="settings-toggle-row">
            <span class="settings-field-label">Cloud speech recognition
              <span class="hint">Shadowing transcribes your recording with Google Cloud STT (more accurate than the browser). Off = use the browser recognizer.</span>
            </span>
            <button class="settings-toggle" id="set-gcloud-stt" aria-checked="${APP.gcloudStt !== false}" role="switch"><i></i></button>
          </div>` : ''}
          <div class="settings-field">
            <label class="settings-field-label" for="tts-voice">
              Voice
              <span class="hint">${voices.length} browser voice${voices.length === 1 ? '' : 's'}${APP.gcloudTtsKey ? ' + Google Cloud neural' : ''} — Google preferred</span>
            </label>
            <select id="tts-voice">
              <option value="">Auto (best available)</option>
              ${APP.gcloudTtsKey ? `<optgroup label="Google Cloud · neural (Translate quality)">
                ${TTS.GCLOUD_VOICES.map(g => `
                  <option value="gcloud:${escAttr(g.id)}" ${APP.ttsVoiceURI === 'gcloud:' + g.id ? 'selected' : ''}>${escHTML(g.label)}</option>
                `).join('')}
              </optgroup>` : ''}
              ${voices.length ? `<optgroup label="Browser voices">
                ${voices.map(v => `
                  <option value="${escAttr(v.voiceURI)}" ${v.voiceURI === APP.ttsVoiceURI ? 'selected' : ''}>${escHTML(v.name)} ${v.localService ? '· local' : '· cloud'}</option>
                `).join('')}
              </optgroup>` : ''}
            </select>
          </div>
          ${(voices.length === 0 && !APP.gcloudTtsKey) ? `
            <div class="settings-no-voice">
              No Japanese voice installed on this device. On macOS / iOS, install Kyoko via
              System Settings → Accessibility → Spoken Content → Voices; on Android Chrome
              Google's voice is built in. Or paste a Google Cloud key above. Refresh after installing.
            </div>
          ` : ''}
          <div class="settings-field">
            <label class="settings-field-label" for="tts-rate">
              Speech rate
              <span class="hint">1.0 = default · 0.85 reads cleaner</span>
            </label>
            <select id="tts-rate">
              <option value="0.7"  ${+APP.ttsRate === 0.7  ? 'selected' : ''}>Slow (0.7×)</option>
              <option value="0.85" ${+APP.ttsRate === 0.85 ? 'selected' : ''}>Comfortable (0.85×)</option>
              <option value="1.0"  ${+APP.ttsRate === 1.0  ? 'selected' : ''}>Normal (1.0×)</option>
              <option value="1.15" ${+APP.ttsRate === 1.15 ? 'selected' : ''}>Fast (1.15×)</option>
            </select>
          </div>
          <button type="button" class="settings-test-btn" data-test-voice>テスト · Test voice</button>
          <p class="settings-test-status" id="tts-test-status" role="status" aria-live="polite" hidden></p>
        </section>

        <section class="settings-section">
          <div class="settings-section-head">
            <span class="ja">体験中の自動再生</span>
            <span class="en">Autoplay in the immersive experience</span>
          </div>
          <div class="settings-toggle-row">
            <span class="settings-field-label">
              Speak NPC dialogue automatically
              <span class="hint">When you reach a new scene step, the dialogue plays after a short pause</span>
            </span>
            <button class="settings-toggle" id="set-autoplay" aria-checked="${APP.ttsAutoplay}" role="switch"><i></i></button>
          </div>
          <div class="settings-field" ${!APP.ttsAutoplay ? 'style="opacity:0.5;pointer-events:none"' : ''}>
            <label class="settings-field-label" for="set-autoplay-delay">
              Delay before autoplay
              <span class="hint">Seconds to wait after a step renders</span>
            </label>
            <input type="number" id="set-autoplay-delay" min="0" max="3" step="0.1" value="${+APP.ttsAutoplayDelay}"> s
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-section-head">
            <span class="ja">表示</span>
            <span class="en">Display</span>
          </div>
          <div class="settings-toggle-row">
            <span class="settings-field-label">Show English glosses</span>
            <button class="settings-toggle" id="set-english" aria-checked="${APP.showEnglish}" role="switch"><i></i></button>
          </div>
          <div class="settings-toggle-row">
            <span class="settings-field-label">Particle colors
              <span class="hint">は・を・が highlighted in soft hues</span>
            </span>
            <button class="settings-toggle" id="set-particles" aria-checked="${APP.particlesOn}" role="switch"><i></i></button>
          </div>
          <div class="settings-toggle-row">
            <span class="settings-field-label">Pitch-accent notation
              <span class="hint">${APP.pitchNotation === 'dots' ? 'Connected dots' : 'Step lines'} — toggle for textbook step lines (on) vs connected dots (off). Used in Speaking &amp; Pitch lessons.</span>
            </span>
            <button class="settings-toggle" id="set-pitch-notation" aria-checked="${APP.pitchNotation === 'lines'}" role="switch"><i></i></button>
          </div>
          <div class="settings-toggle-row">
            <span class="settings-field-label">Auto-play phrases
              <span class="hint">In the Shadowing studio, play the model automatically when a phrase loads</span>
            </span>
            <button class="settings-toggle" id="set-speaking-autoplay" aria-checked="${APP.speakingAutoplay}" role="switch"><i></i></button>
          </div>
        </section>
      </div>
    `;

    // Focus the dialog so Escape works without an extra click
    const dlg = wrap.querySelector('.settings-modal');
    if (dlg) dlg.focus();

    // Wire all the interactions.
    // Tabs — pick which role we're configuring.
    wrap.querySelectorAll('[data-font-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        APP._fontTab = btn.dataset.fontTab;
        renderInside();
      });
    });
    // Font dropdown (per-role) — wired through the shared dropdown
    // handler. Each tab\'s dropdown carries its own target key (fontTitle
    // / fontMenu1 / fontMenu2 / uiFont) so the right APP state slot
    // updates when an option is picked, then the modal re-renders so
    // the live sample reflects the change.
    initFontDropdownHandlers((target, fontId) => {
      const cfg = FONT_DROPDOWN_TARGETS[target];
      if (!cfg) return;
      APP[cfg.state] = fontId;
      lsSet(cfg.ls, fontId);
      applyBodyClasses();
      renderInside();
    });
    const voiceSel = wrap.querySelector('#tts-voice');
    if (voiceSel) voiceSel.addEventListener('change', () => {
      APP.ttsVoiceURI = voiceSel.value || null;
      lsSet('jp:ttsVoiceURI', APP.ttsVoiceURI);
    });
    // Google Cloud TTS key — save on commit (change/blur) and re-render so
    // the neural voices appear in the picker. Kept only in localStorage.
    const gkey = wrap.querySelector('#gcloud-key');
    if (gkey) gkey.addEventListener('change', () => {
      const v = gkey.value.trim();
      APP.gcloudTtsKey = v || null;
      lsSet('jp:gcloudTtsKey', APP.gcloudTtsKey);
      renderInside();
    });
    // Cloud speech-recognition toggle (only shown when a key is set).
    const gstt = wrap.querySelector('#set-gcloud-stt');
    if (gstt) gstt.addEventListener('click', () => {
      APP.gcloudStt = (APP.gcloudStt === false);   // flip; default is on
      lsSet('jp:gcloudStt', APP.gcloudStt);
      gstt.setAttribute('aria-checked', String(APP.gcloudStt));
    });
    const rateSel = wrap.querySelector('#tts-rate');
    if (rateSel) rateSel.addEventListener('change', () => {
      APP.ttsRate = +rateSel.value;
      lsSet('jp:ttsRate', APP.ttsRate);
    });
    const testBtn = wrap.querySelector('[data-test-voice]');
    const testStatus = wrap.querySelector('#tts-test-status');
    if (testBtn) testBtn.addEventListener('click', async () => {
      // Commit whatever's currently selected in the dropdown first, so Test
      // always plays the VISIBLE choice (don't depend on the change event
      // having fired — e.g. picking an option then clicking straight here).
      const vs = wrap.querySelector('#tts-voice');
      if (vs) {
        APP.ttsVoiceURI = vs.value || null;
        lsSet('jp:ttsVoiceURI', APP.ttsVoiceURI);
      }
      if (testStatus) { testStatus.hidden = true; testStatus.textContent = ''; }
      try {
        // speakStrict surfaces cloud errors (e.g. 403) instead of silently
        // falling back to the browser voice.
        await TTS.speakStrict('こんにちは。日本語の音声テストです。');
      } catch (e) {
        if (testStatus) {
          testStatus.hidden = false;
          testStatus.textContent = 'Cloud voice failed — ' + (e && e.message ? e.message : 'unknown error') +
            '. Check the key’s API + HTTP-referrer restrictions for this site, and that the Text-to-Speech API is enabled.';
        }
      }
    });
    const autoplay = wrap.querySelector('#set-autoplay');
    if (autoplay) autoplay.addEventListener('click', () => {
      APP.ttsAutoplay = !APP.ttsAutoplay;
      lsSet('jp:ttsAutoplay', APP.ttsAutoplay);
      renderInside();
    });
    const delayInput = wrap.querySelector('#set-autoplay-delay');
    if (delayInput) delayInput.addEventListener('change', () => {
      const v = Math.max(0, Math.min(3, +delayInput.value || 0));
      APP.ttsAutoplayDelay = v;
      lsSet('jp:ttsAutoplayDelay', v);
    });
    const engToggle = wrap.querySelector('#set-english');
    if (engToggle) engToggle.addEventListener('click', () => {
      APP.showEnglish = !APP.showEnglish;
      lsSet('jp:showEnglish', APP.showEnglish);
      applyBodyClasses();
      renderInside();
    });
    const partToggle = wrap.querySelector('#set-particles');
    if (partToggle) partToggle.addEventListener('click', () => {
      APP.particlesOn = !APP.particlesOn;
      lsSet('jp:particles', APP.particlesOn);
      applyBodyClasses();
      renderInside();
    });
    const pitchNotaToggle = wrap.querySelector('#set-pitch-notation');
    if (pitchNotaToggle) pitchNotaToggle.addEventListener('click', () => {
      APP.pitchNotation = APP.pitchNotation === 'lines' ? 'dots' : 'lines';
      lsSet('jp:pitchNotation', APP.pitchNotation);
      renderInside();
      // Live-refresh whatever pitch surface is open so the change shows
      // immediately without a manual reload.
      if (APP.section === 'speaking') {
        renderSpeaking(document.getElementById('main-inner'));
      } else if (APP.section === 'writing' && APP.writingPage === 'pitch') {
        renderWriting(document.getElementById('main-inner'));
      }
    });
    const speakingAutoplayToggle = wrap.querySelector('#set-speaking-autoplay');
    if (speakingAutoplayToggle) speakingAutoplayToggle.addEventListener('click', () => {
      APP.speakingAutoplay = !APP.speakingAutoplay;
      lsSet('jp:speakingAutoplay', APP.speakingAutoplay);
      renderInside();
    });
    wrap.querySelectorAll('[data-settings-close]').forEach(b =>
      b.addEventListener('click', closeSettingsModal));
  }
  renderInside();

  const onClick = (e) => { if (e.target === wrap) closeSettingsModal(); };
  const onKey   = (e) => { if (e.key === 'Escape') closeSettingsModal(); };
  wrap.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  wrap._cleanup = () => {
    wrap.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
}
function closeSettingsModal() {
  const existing = document.getElementById('settings-modal-backdrop');
  if (!existing) return;
  if (typeof existing._cleanup === 'function') existing._cleanup();
  existing.remove();
}
function fontStackFor(id) {
  switch (id) {
    case 'gothic':   return '"Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic", sans-serif';
    case 'kyokasho': return '"Klee One", "Shippori Mincho", serif';
    case 'brush':    return '"Yuji Syuku", "Kaisei Decol", "Hina Mincho", "Shippori Mincho", serif';
    case 'noto':     return '"Noto Sans JP", "Hiragino Sans", system-ui, sans-serif';
    default:         return '"Shippori Mincho", "Noto Serif JP", serif';
  }
}

// ─── Context backgrounds ──────────────────────────────────────────────
// Per-section background atlas. Values are FULL paths from the app
// root — that frees the folder layout from the key shape, so a key
// like 'writing-kana' can still point at a file that physically lives
// in images/bg/writing/.
//
// Specific writing-subpage keys (writing-kana, writing-numbers, etc.)
// override the section default. `global` is the universal fallback
// pool for pages with no section bg of their own.
const SECTION_BGS = {
  'eating-out':        ['images/bg/eating-out/bg1.webp',
                        'images/bg/eating-out/bg2.webp',
                        'images/bg/eating-out/bg3.webp'],
  // Per-book deterministic overrides inside the eating-out class. flavors and
  // edibles each get a fixed bg that matches the page's identity; books not
  // listed here fall back to the random 'eating-out' pool above.
  'vocab-flavors':     ['images/bg/eating-out/bg3.webp'],
  'vocab-edibles':     ['images/bg/eating-out/bg1.webp'],
  // 'vocab-textures' intentionally omitted — the Textures book suppresses its
  // context bg (see currentBgContextKey) so it doesn't double up on texture.
  // Each writing subpage carries one specific bg — the brush + ink
  // aesthetics map to the subject they teach.
  'writing-kana':               ['images/bg/writing/bg-shodo.webp'],            // calligraphy → hiragana/katakana
  'writing-numbers':            ['images/bg/writing/bg-sumi.webp'],             // sumi strokes → numerals
  'writing-particles':          ['images/bg/writing/bg-shodo.webp'],            // calligraphy → particles
  'writing-sentence-structure': ['images/bg/writing/sentence-structure.webp'],  // building blocks → sentence structure
  'writing-colors':             ['images/bg/writing/bg-suzuri.webp'],           // ink + brush + bamboo → colors
  'writing-datetime':           ['images/bg/writing/bg-sumi.webp'],             // sumi strokes → days & time
  // Flashcards draws from the same global pool. The dropdown in the
  // flashcards top-row lets the learner lock to one image, choose
  // 'none' to suppress the bg entirely, or stay on 'random' to get
  // a fresh pick on every category change.
  'flashcards':        ['images/bg/global/bg-fuji.webp',
                        'images/bg/global/bg-sakura.webp',
                        'images/bg/global/bg-shoji.webp',
                        'images/bg/global/bg-temple.webp',
                        'images/bg/global/bg-waves.webp'],
  'global':            ['images/bg/global/bg-fuji.webp',
                        'images/bg/global/bg-sakura.webp',
                        'images/bg/global/bg-shoji.webp',
                        'images/bg/global/bg-temple.webp',
                        'images/bg/global/bg-waves.webp'],
};
// Remember which bg index we showed last per section so the next pick
// doesn't repeat — gives the user a fresh atmosphere on each visit
// without strict round-robin predictability.
const _ctxBgLastIdx = {};
function pickSectionBg(key) {
  const list = SECTION_BGS[key];
  if (!list || !list.length) return null;
  // Flashcards has a user-facing preference. 'none' suppresses the bg
  // entirely (returns null → applyContextBg clears --ctx-bg-url and the
  // paper shows through). A specific filename ('bg-fuji.webp' etc.) locks
  // the page to that bg. 'random' (or any unknown value) falls through
  // to the normal cycle logic below.
  if (key === 'flashcards' && APP.flashBgPref && APP.flashBgPref !== 'random') {
    if (APP.flashBgPref === 'none') return null;
    const match = list.find(p => p.endsWith('/' + APP.flashBgPref));
    if (match) return match;
  }
  // SECTION_BGS values are full paths — pick + return directly.
  if (list.length === 1) { _ctxBgLastIdx[key] = 0; return list[0]; }
  let idx;
  do { idx = Math.floor(Math.random() * list.length); }
  while (idx === _ctxBgLastIdx[key]);
  _ctxBgLastIdx[key] = idx;
  return list[idx];
}
// Resolve the current context's bg key from APP state. Cascades from
// most-specific (a writing subpage, or a class within vocab) to
// least-specific (the global fallback pool). Returns null only if even
// the global pool is empty.
function currentBgContextKey() {
  // The Textures book is itself a wall of food-texture imagery — a second
  // textured page background behind it just reads as two competing textures.
  // Suppress the context bg entirely so the paper shows through cleanly.
  // (flavors / edibles keep their backgrounds — see SECTION_BGS.)
  if (APP.section === 'vocab' && APP.vocabBookId === 'textures') return null;
  // Section-class / subpage specific overrides come first.
  if (APP.section === 'vocab' && APP.vocabClassId === 'eating-out') {
    // Per-book overrides: flavors / edibles / textures each get a
    // deterministic bg. Other eating-out books fall back to the
    // random three-image pool below.
    const bookKey = `vocab-${APP.vocabBookId}`;
    if ((SECTION_BGS[bookKey] || []).length) return bookKey;
    return 'eating-out';
  }
  if (APP.section === 'writing') {
    // Writing has four subpages, each gets its own bg mapping. Falls
    // back to 'global' if a subpage isn't registered.
    const subKey = `writing-${APP.writingPage || 'kana'}`;
    if ((SECTION_BGS[subKey] || []).length) return subKey;
  }
  // Flashcards uses its own pool so the user's bg preference (random
  // vs. locked) is honored. pickSectionBg reads APP.flashBgPref.
  if (APP.section === 'flashcards') return 'flashcards';
  // Universal fallback — every other page draws from the generic pool.
  if ((SECTION_BGS.global || []).length) return 'global';
  return null;
}
function applyContextBg() {
  const key = currentBgContextKey();
  const url = key ? pickSectionBg(key) : null;
  const mainEl = document.getElementById('main');
  if (!mainEl) return;
  if (url) {
    mainEl.style.setProperty('--ctx-bg-url', `url("${url}")`);
  } else {
    mainEl.style.removeProperty('--ctx-bg-url');
  }
}

// ── Main dispatcher ──────────────────────────────────────────────────────
function renderMain() {
  closePopover();
  if (APP._flashKeyHandler) {
    window.removeEventListener('keydown', APP._flashKeyHandler);
    APP._flashKeyHandler = null;
  }
  // Reset the shared stepper slot — vocab repopulates it on render; other
  // sections leave it empty (`:empty` rule in CSS collapses the space).
  const stepperHost = document.getElementById('main-stepper');
  if (stepperHost) stepperHost.innerHTML = '';
  // Cycle the section bg every render (cheap: one random pick + one
  // custom-property write). Cleared when the current section doesn't
  // have a registered bg folder.
  applyContextBg();
  const el = document.getElementById('main-inner');
  el.className = 'main-inner fade-enter';
  if (APP.section === 'vocab')           { renderVocab(el); renderVocabSidebar(); renderVocabBooksSidebar(); }
  else if (APP.section === 'writing')    { renderWriting(el); renderWritingSidebar(); renderParticlesSidebar(); }
  else if (APP.section === 'flashcards') renderFlashcards(el);
  else if (APP.section === 'speaking')   { renderSpeaking(el); renderSpeakingSidebar(); }
  else if (APP.section === 'library')    { renderLibrary(el); renderLibrarySidebar(); }
}

// Reset every piece of book-local state. Called whenever the user
// clicks a book card in either sidebar (the books-strip column on the
// left, or the per-class books sidebar). The contract is "clicking a
// menu item lands you at page 1 of that flow" — that's only true if
// the previous flow's drill-state is wiped first. Without this
// helper, switching to Flavors would resume on whatever flavor
// immersion the user last looked at; switching to Edibles would
// resume on the item-detail page they last opened; switching to a
// restaurant would resume on whatever scene step they were on.
//
// Fields reset:
//   vocabPageIdx       — pager position inside a paged book → step 1
//   flavorId           → null (back to the bento map)
//   edibleCategory     → null (back to the 8-tile category browse)
//   edibleItem         → null
//   edibleFromFlavor   → null (clears the cross-link breadcrumb)
//   APP.scenes[bookId] — the restaurant scene flow → fresh state
//
// Same handler covers both clicking a different book AND re-clicking
// the currently-active one — the "menu click = fresh start" contract
// is uniform.
function resetBookEntryState(bookId) {
  // Mark this book as "fresh from menu" so the page-entry choreography
  // fires on the next renderVocab. wireFlavors/Edibles/TexturesPageHandlers
  // each check this flag, play their entrance animation if it matches
  // their book, then clear it. Internal re-renders (e.g. flavor switch,
  // edibles category click) never set this — only the sidebar / strip
  // menu clicks and the initial page paint do.
  window.__bookEntranceFlag = bookId;
  APP.vocabPageIdx = 0;
  if (APP.flavorId !== null) {
    APP.flavorId = null;
    lsSet('jp:flavorId', null);
  }
  if (APP.textureId !== null && APP.textureId !== undefined) {
    APP.textureId = null;
    lsSet('jp:textureId', null);
  }
  if (APP.edibleCategory !== null) {
    APP.edibleCategory = null;
    lsSet('jp:edibleCategory', null);
  }
  if (APP.edibleItem !== null) {
    APP.edibleItem = null;
    lsSet('jp:edibleItem', null);
  }
  if (APP.edibleFromFlavor !== null) {
    APP.edibleFromFlavor = null;
    lsSet('jp:edibleFromFlavor', null);
  }
  if (APP.edibleFromTexture) {
    APP.edibleFromTexture = null;
    lsSet('jp:edibleFromTexture', null);
  }
  // Restaurant scene flows live in APP.scenes[bookId]. Reset only the
  // clicked book's scene — leave other restaurants' progress intact
  // so the user can resume them later.
  if (APP.scenes && bookId && APP.scenes[bookId] && typeof freshSceneState === 'function') {
    APP.scenes[bookId] = freshSceneState();
    if (typeof saveSceneState === 'function') saveSceneState();
  }
}

// ── Vocab sidebar ───────────────────────────────────────────────────────
function renderVocabSidebar() {
  const el = document.getElementById('vocab-sidebar');
  if (!el) return;
  const classes = window.VOCAB_CLASSES || [];
  el.innerHTML = `
    <div class="flash-sidebar-head">categories</div>
    <ul class="cat-list">
      ${classes.map(c => {
        const isActive = c.id === APP.vocabClassId;
        return `
        <li>
          <button class="cat-item ${isActive ? 'active' : ''}" data-vocab-cat="${c.id}">
            <span class="cat-glyph">${c.glyph}</span>
            <span class="cat-label">
              <span class="cat-ja">${escHTML(c.titleJa)}</span>
              <span class="cat-en">${escHTML(c.titleEn)}</span>
            </span>
            ${isActive ? activeBrushHTML(2) : ''}
          </button>
        </li>
      `;
      }).join('')}
    </ul>`;
  el.querySelectorAll('[data-vocab-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Same-item click → no-op so the brush + bg don't re-trigger.
      if (btn.dataset.vocabCat === APP.vocabClassId) return;
      APP.vocabClassId = btn.dataset.vocabCat;
      APP.vocabBookId = null;
      APP.vocabPageIdx = 0;
      lsSet('jp:vocabClass', APP.vocabClassId);
      renderVocab(document.getElementById('main-inner'));
      renderVocabSidebar();
      renderVocabBooksSidebar();
    });
  });
}

// Third sidebar — books within the currently selected category. Renders the
// same cat-list pattern as the categories sidebar so the visual rhythm
// cascades left-to-right: main nav → categories → books → content.
function renderVocabBooksSidebar() {
  const el = document.getElementById('vocab-books-sidebar');
  if (!el) return;
  const cls = (window.VOCAB_CLASSES || []).find(c => c.id === APP.vocabClassId);
  const books = cls ? (cls.books || []) : [];
  if (!books.length) { el.innerHTML = ''; return; }

  // Group every book by its sidebar section. Experience books
  // (isExperience:true) fall into the 'interactive' section; everything
  // else uses its `section` field or defaults to 'books'. Map iteration
  // order = insertion order, so groups appear in the order their first
  // member appears in the source array — authors control sidebar
  // ordering by ordering books in data.js (no hardcoded
  // experience-always-first anymore).
  const sectionMap = new Map();
  for (const b of books) {
    const sec = b.isExperience ? 'interactive' : (b.section || 'books');
    if (!sectionMap.has(sec)) sectionMap.set(sec, []);
    sectionMap.get(sec).push(b);
  }

  const cardHTML = (b, isExp) => {
    const isActive = b.id === APP.vocabBookId;
    // Tier-3 brush — bg-brush behind text, escapes the column and trails
    // into .main. bgBrushBits() reserves a slot in the cascade queue and
    // returns the class/style/html fragments the template needs.
    const bb = isActive ? bgBrushBits() : null;
    return `
    <li>
      <button class="cat-item ${isExp ? 'cat-item-exp' : ''} ${isActive ? 'active has-bg-brush' : ''}"
              ${bb ? `style="${bb.style}"` : ''}
              data-vocab-book="${b.id}">
        <span class="cat-glyph">${b.glyph}</span>
        <span class="cat-label">
          <span class="cat-ja">${multilineJa(b.titleJa)}</span>
          <span class="cat-en">${escHTML(b.titleEn)}</span>
        </span>
        ${bb ? bb.html : ''}
      </button>
    </li>`;
  };

  // Render every section in the order it first appeared in the books
  // array. The 'interactive' section gets the cat-list-exp class so
  // experience books keep their distinctive launcher styling; other
  // sections render with the plain cat-list class. The first section
  // doesn't draw the divider above it; every subsequent one does.
  let hasPrior = false;
  const sectionsHTML = [];
  for (const [secTitle, secBooks] of sectionMap) {
    const isExpSection = secTitle === 'interactive';
    sectionsHTML.push(`
      <div class="flash-sidebar-head ${hasPrior ? 'with-divider' : ''}">${escHTML(secTitle)}</div>
      <ul class="cat-list ${isExpSection ? 'cat-list-exp' : ''}">
        ${secBooks.map(b => cardHTML(b, isExpSection)).join('')}
      </ul>
    `);
    hasPrior = true;
  }

  el.innerHTML = sectionsHTML.join('');

  el.querySelectorAll('[data-vocab-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      // No early-return on same-book clicks — the contract is that
      // every sidebar click resets the flow to page 1. Re-clicking
      // the active book is a deliberate "start over" gesture.
      const newId = btn.dataset.vocabBook;
      APP.vocabBookId = newId;
      resetBookEntryState(newId);
      lsSet('jp:vocabBook', APP.vocabBookId);
      renderVocab(document.getElementById('main-inner'));
      renderVocabBooksSidebar();
    });
  });
}

// ── Vocab ────────────────────────────────────────────────────────────────
function renderVocab(container) {
  // Refresh the context bg every time the vocab page rerenders (class
  // change, book change, page change). renderMain already calls this on
  // section switch, but in-section navigation only routes through
  // renderVocab — so do it here too. Cheap (one CSS var write).
  if (typeof applyContextBg === 'function') applyContextBg();
  const cls = VOCAB_CLASSES.find(c => c.id === APP.vocabClassId) || VOCAB_CLASSES[0];
  // If the stored book doesn't belong to this class (e.g. user switched
  // classes), drop to the first book in the class.
  if (!cls.books.some(b => b.id === APP.vocabBookId)) {
    APP.vocabBookId = cls.books[0] ? cls.books[0].id : null;
    APP.vocabPageIdx = 0;
  }
  const book = cls.books.find(b => b.id === APP.vocabBookId) || cls.books[0];
  const hasPages = !!(book && book.pages && book.pages.length);
  if (hasPages && APP.vocabPageIdx >= book.pages.length) APP.vocabPageIdx = 0;
  const page = hasPages ? book.pages[APP.vocabPageIdx] : null;

  // Bottom pager is suppressed in two cases:
  //   1. *Multi-chain* hub books (Fast Food, Street Food) where the
  //      top chain selector replaces it.
  //   2. *Single-page* books (e.g. jougo → intro → jougo-explainer)
  //      where the stepper would be a one-step nav with nowhere to
  //      step. The page stands alone; the stepper would just clutter
  //      the top of the viewport.
  // Single-chain hub books (Sushi, Omakase, Izakaya, Ramen) keep the
  // pager — it steps between vocab / explanation / menu-reference.
  const isMultiChainHub = book && book.isCategoryHub
    && book.pages && book.pages.length > 1
    && book.pages.every(p => p.chainName);
  const isSinglePage = hasPages && book.pages.length === 1;
  const showPager = hasPages && !isMultiChainHub && !isSinglePage;
  // Stepper — full-width horizontal step indicator. Each step is a
  // clickable column with a numbered marker, JP step label, and EN
  // sub-label. Connectors between markers color gold as you progress
  // (left of and including the active step → gold; right of it →
  // muted). Replaces the tiny dot pager with something that titles
  // each destination so the user knows where they're going before
  // clicking.
  const pagerHTML = showPager ? `
    <nav class="stepper" role="tablist" style="--steps:${book.pages.length}">
      ${book.pages.map((p, i) => {
        const lbl = stepperLabel(p);
        const state = i === APP.vocabPageIdx ? 'is-active'
          : (i < APP.vocabPageIdx ? 'is-done' : 'is-todo');
        return `
          <button class="step ${state}" role="tab" data-page="${i}"
                  aria-selected="${i === APP.vocabPageIdx}" title="${escAttr(p.title || lbl.ja)}">
            <span class="step-marker"><span class="step-num">${i + 1}</span></span>
            <span class="step-label">
              <span class="step-ja">${escHTML(lbl.ja)}</span>
              <span class="step-en">${escHTML(lbl.en)}</span>
            </span>
          </button>
        `;
      }).join('')}
    </nav>` : '';

  // Page head and class-strip stay around for mobile fallback (where the
  // sidebars collapse). On desktop the CSS hides .class-strip and .book-strip
  // when .show-vocab-sidebar is active. Dropped the per-class page-title
  // entirely — the sidebar selection already tells the user where they are,
  // and reclaiming that vertical space lets the image breathe.
  //
  // The stepper lives OUTSIDE main-inner now (in #main-stepper). Inject
  // it separately so it sits flush to the top of .main while the rest
  // of the vocab content stays inset by the .main-inner padding.
  const stepperHost = document.getElementById('main-stepper');
  if (stepperHost) stepperHost.innerHTML = pagerHTML;

  container.innerHTML = `
    <div class="class-strip">
      ${VOCAB_CLASSES.map(c => `
        <button class="class-tab ${c.id === APP.vocabClassId ? 'active' : ''}" data-class="${c.id}">
          <span class="glyph">${c.glyph}</span>
          <span class="label">
            <span class="ja">${escHTML(c.titleJa)}</span>
            <span class="en">${escHTML(c.titleEn)}</span>
          </span>
        </button>
      `).join('')}
    </div>

    <div class="book-strip book-strip-scroll">
      ${cls.books.map(b => `
        <button class="book-card ${b.id === APP.vocabBookId ? 'active' : ''}" data-book="${b.id}">
          <div class="glyph">${b.glyph}</div>
          <div class="ja">${escHTML(b.titleJa)}</div>
          <div class="en">${escHTML(b.titleEn)}</div>
        </button>
      `).join('')}
    </div>

    <div id="vocab-page-content"></div>`;

  if (hasPages) {
    renderVocabPage(book, page);
  } else {
    // Interactive books are routed by their own flag:
    //  - isComingSoon → renders the empty-state notice; takes
    //    precedence over the other flags so an `isExperience` book
    //    can still be visually grouped with the interactive entries
    //    in the sidebar while showing "coming soon" in the body.
    //  - isFlavorsPage → the bento → drill-in immersion engine for
    //    the Flavors page (Phase 1 of the Flavors & Textures sub-
    //    system). Phase 2 textures will reuse the same engine via an
    //    isTexturesPage flag.
    //  - isFoodGallery → the food-SVG reference gallery
    //  - isExperience → the random-restaurant scene engine
    // Anything else with no pages shows "coming soon".
    const pageEl = document.getElementById('vocab-page-content');
    if (book && book.isComingSoon) {
      pageEl.innerHTML =
        `<div class="empty-state">${escHTML(book.titleEn)} — coming soon.</div>`;
    } else if (book && book.isFlavorsPage) {
      pageEl.innerHTML = flavorsPageHTML(book);
      wireFlavorsPageHandlers(book);
    } else if (book && book.isTexturesPage) {
      pageEl.innerHTML = texturesPageHTML(book);
      wireTexturesPageHandlers(book);
    } else if (book && book.isEdiblesPage) {
      pageEl.innerHTML = ediblesPageHTML(book);
      wireEdiblesPageHandlers(book);
    } else if (book && book.isFoodGallery) {
      pageEl.innerHTML = foodGalleryHTML();
    } else if (book && book.isExperience) {
      renderExperience();
    } else {
      pageEl.innerHTML =
        `<div class="empty-state">${escHTML(book ? book.titleEn : 'This category')} — coming soon.</div>`;
    }
    updateVocabDrawer(book, null);
  }

  container.querySelectorAll('[data-class]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.vocabClassId = btn.dataset.class;
      APP.vocabBookId = null;
      APP.vocabPageIdx = 0;
      lsSet('jp:vocabClass', APP.vocabClassId);
      renderVocab(container);
      renderVocabSidebar();
    });
  });
  container.querySelectorAll('[data-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Always reset the book's flow state — every menu click is a
      // "page 1" gesture, even when re-clicking the active book. See
      // resetBookEntryState() for the full list of slots wiped.
      const newId = btn.dataset.book;
      APP.vocabBookId = newId;
      resetBookEntryState(newId);
      lsSet('jp:vocabBook', APP.vocabBookId);
      renderVocab(container);
    });
  });
  // Stepper step clicks — jump to that page. The stepper now lives in
  // #main-stepper (OUTSIDE main-inner) so we query the host directly
  // instead of `container.querySelectorAll`. Each renderVocab call
  // re-injects the stepper HTML, so listeners attach fresh every time.
  // (The same const was declared earlier in this function when we
  // injected the stepper HTML; re-use it via querySelectorAll on
  // document to avoid the redeclaration.)
  document.querySelectorAll('#main-stepper [data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.vocabPageIdx = parseInt(btn.dataset.page, 10);
      renderVocab(container);
    });
  });
}

// Short label used on the stepper. Pages can override via
// `page.stepLabel: { ja, en }`; otherwise derived from page.type so
// every page type has a predictable name. Falls back to page.title
// for unknown types.
function stepperLabel(page) {
  if (page.stepLabel) return page.stepLabel;
  switch (page.type) {
    case 'cheatsheet':       return { ja:'ことば',     en:'Vocab' };
    case 'explanation':      return { ja:'について',   en:'About' };
    case 'menu-reference':   return { ja:'メニュー',   en:'Menu' };
    case 'usage':            return { ja:'つかいかた', en:'Usage' };
    case 'sentences':        return { ja:'ぶん',       en:'Sentences' };
    case 'restaurant':       return { ja:'体験',       en:'Experience' };
    case 'explainer':        return { ja:'について',   en:'Concept' };
    case 'flashcards-grid':  return { ja:'単語札',     en:'Flashcards' };
    default:                 return { ja: page.title || '', en:'' };
  }
}

function renderVocabPage(book, page) {
  const el = document.getElementById('vocab-page-content');
  // Fast Food hub — same page types (cheatsheet for now) but wraps
  // them with a chain selector at the top + an "experience" launch
  // button. Custom renderer; replaces the standard page body.
  if (book.isCategoryHub) {
    el.innerHTML = fastFoodHubHTML(book, page);
    wireFastFoodHubHandlers(book);
    updateVocabDrawer(book, page);
    return;
  }
  if (page.type === 'cheatsheet')  el.innerHTML = cheatsheetHTML(book, page);
  else if (page.type === 'usage')  el.innerHTML = usageHTML(page);
  else if (page.type === 'sentences') {
    el.innerHTML = sentencesHTML(page, 'ALL', false);
    attachSentencesEvents(el, page);
  }
  else if (page.type === 'explainer') el.innerHTML = explainerHTML(page);
  else if (page.type === 'flashcards-grid') {
    el.innerHTML = flashcardsGridHTML(page);
    attachFlashcardsGridEvents(el, page);
  }
  else if (page.type === 'jougo-overview') {
    el.innerHTML = jougoOverviewHTML(page);
    // No per-page attach: tile clicks reuse the document-level
    // [data-jougo-modal] delegate, sentence TTS reuses [data-speak].
  }
  // Sync the mobile drawer state to the current page. Cheatsheets get the
  // FAB + drawer (items list); other page types hide it.
  updateVocabDrawer(book, page);
}

// ── Category hub renderer ──────────────────────────────────────────
// Used by every book with `isCategoryHub: true` — Fast Food, Street
// Food, Sushi, Omakase, Izakaya, Ramen. Shape:
//
//   [ chain selector ]   ← only when multiple chain pages exist
//                          (Fast Food: McD/KFC, Street Food: 4 stalls)
//   [ page body ]         ← cheatsheet | explanation | menu-reference,
//                          each with an experience button in its header
//
// Experience button targets:
//   - page.restaurantId   → a specific restaurant (Fast Food chains)
//   - book.randomCategory → a random restaurant in that category
//                          (Sushi, Omakase, Izakaya, Ramen, Street Food)
function fastFoodHubHTML(book, page) {
  // The "chain selector" only renders when the book has multiple pages
  // *of the same kind* (typically all-cheatsheet hub books with 1 page
  // per chain). Single-chain hubs (Sushi etc.) hide the selector and
  // rely on the bottom pager to step between vocab / explanation /
  // menu-reference.
  const isChainHub = book.pages.length > 1 && book.pages.every(p => p.chainName);
  const idx = book.pages.indexOf(page);
  const selector = isChainHub ? `
    <nav class="ff-selector ff-selector-cols-${book.pages.length}" role="tablist">
      ${book.pages.map((p, i) => `
          <button class="ff-card ${i === idx ? 'is-active' : ''}" data-ff-page="${i}">
            <span class="ff-card-img">
              <img src="${escAttr(chainPageThumbSrc(p))}"
                   onerror="this.onerror=null;this.src='images/eating%20out/scene-placeholder.svg';this.dataset.placeholder='1';"
                   alt="" loading="lazy" />
            </span>
            <span class="ff-card-name">
              <span class="ja">${escHTML(p.chainName && p.chainName.ja || p.title)}</span>
              <span class="en">${escHTML(p.chainName && p.chainName.en || '')}</span>
            </span>
          </button>
        `).join('')}
    </nav>
  ` : '';

  const body = hubPageBodyHTML(book, page);
  return `
    <div class="ff-hub">
      ${selector}
      <div class="ff-body">${body}</div>
    </div>
  `;
}

// Build the page body for a hub page. Routes by page.type and threads
// the experience button into each layout consistently.
function hubPageBodyHTML(book, page) {
  const expBtn = experienceBtnHTML(book, page);
  if (page.type === 'cheatsheet') {
    // Auto-resolve the cheatsheet's big-image src when no explicit
    // imageSrc is set. Two conventions, in order:
    //   1. Chain page (Street Food: takoyaki, okonomiyaki, …) →
    //      images/vocab/<page.id>.png
    //   2. Single-chain hub vocab (Sushi, Omakase, Izakaya, Ramen) →
    //      images/vocab/<book.randomCategory>.png
    // Drop a file matching either pattern and it appears with no
    // code change. Fast Food keeps its explicit imageSrc.
    const auto = chainPageBigSrc(page, book);
    const effective = (auto && !page.imageSrc) ? { ...page, imageSrc: auto } : page;
    return cheatsheetHTML(book, effective, { prefix: expBtn });
  }
  if (page.type === 'explanation')     return explanationHTML(book, page, expBtn);
  if (page.type === 'menu-reference')  return menuReferenceHTML(book, page, expBtn);
  if (page.type === 'usage')           return usageHTML(page);
  if (page.type === 'sentences')       return sentencesHTML(page, 'ALL', false);
  return `<div class="empty-state">Unknown page type: ${escHTML(page.type)}</div>`;
}

// Resolve the small selector-card thumbnail for a chain page.
// Precedence:
//   1. page.coverImageSrc   — explicit absolute path
//   2. page.coverImage      — name within images/eating out/
//   3. auto-derive          — images/vocab/<page.id>.png (chain pages)
//   4. scene placeholder    — graceful default
function chainPageThumbSrc(p) {
  if (p.coverImageSrc) return p.coverImageSrc;
  if (p.coverImage)    return `images/eating%20out/${p.coverImage}.webp`;
  if (p.chainName && p.id) return `images/vocab/${p.id}.webp`;
  return 'images/eating%20out/scene-placeholder.svg';
}

// Resolve the big-image src for a hub page's cheatsheet.
// Precedence:
//   1. page.imageSrc                — explicit override
//   2. chain page (chainName + id)  — images/vocab/<page.id>.png
//      (Street Food: takoyaki, okonomiyaki, yakitori, festival)
//   3. single-chain hub vocab page  — images/vocab/<book.randomCategory>.png
//      (Sushi → sushi, Omakase → omakase, Izakaya → izakaya, Ramen → ramen)
//   4. nothing — image-slot shows its placeholder
function chainPageBigSrc(p, book) {
  if (p.imageSrc) return p.imageSrc;
  if (p.chainName && p.id) return `images/vocab/${p.id}.webp`;
  if (book && book.randomCategory && p.type === 'cheatsheet') {
    return `images/vocab/${book.randomCategory}.webp`;
  }
  return null;
}

// "Experience eating at X" button. Two modes:
//   - page.restaurantId   → launches that specific restaurant.
//                           Label uses the chain name (Fast Food: each
//                           page is its own chain, so "McDonald's").
//   - book.randomCategory → rolls a random restaurant in the category.
//                           Label uses the *book* title, not the page's
//                           chain name — Street Food pages are sub-types
//                           (たこ焼き, お好み焼き…) but the random roll
//                           spans the whole yatai category, so the
//                           button reads "experience street food."
function experienceBtnHTML(book, page) {
  const restaurantId = page.restaurantId;
  const randomCategory = !restaurantId ? (book.randomCategory || page.randomCategory) : null;
  if (!restaurantId && !randomCategory) return '';

  let labelJa, labelEn;
  if (restaurantId) {
    labelJa = (page.chainName && page.chainName.ja) || book.titleJa || '体験';
    labelEn = (page.chainName && page.chainName.en) || book.titleEn || '';
  } else {
    // Random-from-category — use the BOOK name so the label honestly
    // describes the scope of the roll, not the current sub-page.
    labelJa = book.titleJa || '体験';
    labelEn = book.titleEn || '';
  }

  const target = restaurantId
    ? `data-ff-experience="${escAttr(restaurantId)}"`
    : `data-ff-random="${escAttr(randomCategory)}"`;
  return `
    <button class="ff-experience-btn" ${target}>
      <span class="ff-experience-ja">${escHTML(labelJa)}で 体験する</span>
      <span class="ff-experience-en">→ Experience ${escHTML(labelEn ? labelEn.toLowerCase() : 'this kind of place')}</span>
    </button>
  `;
}

// Explanation page — used by Sushi / Omakase / Izakaya / Ramen to
// frame "what is this kind of place?" Renders a 16:9 hero image, an
// experience button + title row, and a stack of paragraph sections.
// Each section pairs JA (primary, full ink) with EN (smaller, faded).
function explanationHTML(book, page, expBtn) {
  // Hero image resolution priority:
  //   1. heroImageSrc — explicit absolute path (covers/, eating out/, anywhere)
  //   2. heroImage    — convention: name inside images/eating out/<name>.png
  //   3. placeholder
  const heroSrc = page.heroImageSrc
    ? page.heroImageSrc
    : page.heroImage
      ? `images/eating%20out/${escAttr(page.heroImage)}.webp`
      : 'images/eating%20out/scene-placeholder.svg';
  const sectionsHTML = (page.sections || []).map(s => `
    <section class="intro-section">
      <p class="intro-ja">${escHTML(s.ja || '')}</p>
      ${s.en ? `<p class="intro-en">${escHTML(s.en)}</p>` : ''}
    </section>
  `).join('');
  return `
    <div class="book-frame intro-frame">
      <span class="corner-tl"></span><span class="corner-tr"></span>
      <div class="sheet-head-row intro-head">
        <h2 class="book-title intro-title">
          <span class="intro-title-ja">${escHTML(page.title)}</span>
          ${page.subtitleEn ? `<span class="intro-title-en">${escHTML(page.subtitleEn)}</span>` : ''}
        </h2>
        ${expBtn}
      </div>
      <div class="intro-hero">
        <img src="${heroSrc}"
             onerror="${page.heroImage && !page.heroImageSrc
               ? `if(this.src.endsWith('.png')){this.src='images/eating%20out/${escAttr(page.heroImage)}.jpg';}else if(!this.src.endsWith('scene-placeholder.svg')){this.src='images/eating%20out/scene-placeholder.svg';this.dataset.placeholder='1';}`
               : `if(!this.src.endsWith('scene-placeholder.svg')){this.src='images/eating%20out/scene-placeholder.svg';this.dataset.placeholder='1';}`}"
             alt="" loading="lazy" />
      </div>
      <div class="intro-body">${sectionsHTML}</div>
    </div>
  `;
}

// Menu-reference page — a scrollable list of typical dishes for the
// category, with a small food-SVG thumb on the left when available.
// Not interactive — pure reference. Reuses the existing scene-menu
// row visual so it reads like "what you'd see on a real menu here."
// Build the visual food-gallery header that sits at the top of every
// menu page. Scans the menu's items[].foodImg values against the
// FOOD_GALLERY data (a parallel set keyed by image filename). Any
// match is rendered as a `.food-card` — the same image-heavy card the
// food vocabulary page uses — grouped by FOOD_GALLERY section
// (ramen, sushi, dumplings, drinks, etc.). Clicks open the same
// cultural-note dialog the food gallery uses, because the click
// delegation watches `[data-food-section][data-food-idx]` on the
// shared `#vocab-page-content` root.
//
// Cross-restaurant pull-in: items in the "dumplings" or "other"
// FOOD_GALLERY sections that appear on a restaurant's menu (gyoza on
// the ramen-ya and izakaya menus, yakitori platter on izakaya, etc.)
// flow into this header alongside the restaurant's primary section.
// One image is shown at most once per page — the first-matched
// section wins, so a sushi-platter image on the omakase menu shows
// under omakase's bucket, not the "other" bucket.
//
// Returns '' when no menu rows carry a matching foodImg — the menu
// then renders without a visual header, falling through to the row
// list directly.
function menuFoodGalleryHeaderHTML(menuItems) {
  if (!Array.isArray(menuItems) || !menuItems.length) return '';
  // Stem-aware match — drink-beer.webp on a menu matches drink-beer.svg
  // in FOOD_GALLERY (drinks are intentionally flat illustrations in the
  // gallery, but photographed on menu rows). Drops the extension on
  // both sides before comparing.
  const stem = (f) => (f || '').replace(/\.[^.]+$/, '');
  const matchedBySection = new Map();
  const seenStems = new Set();
  for (const m of menuItems) {
    if (!m.foodImg) continue;
    const mStem = stem(m.foodImg);
    if (seenStems.has(mStem)) continue;
    for (const sec of FOOD_GALLERY) {
      const idx = sec.items.findIndex(g => stem(g.file) === mStem);
      if (idx >= 0) {
        seenStems.add(mStem);
        if (!matchedBySection.has(sec.id)) {
          matchedBySection.set(sec.id, { sec, hits: [] });
        }
        matchedBySection.get(sec.id).hits.push({ idx, item: sec.items[idx] });
        break;
      }
    }
  }
  if (!matchedBySection.size) return '';

  const sectionsHTML = Array.from(matchedBySection.values()).map(({ sec, hits }) => `
    <section class="menu-food-section">
      <h3 class="menu-food-section-head">
        <span class="ja">${escHTML(sec.titleJa)}</span>
        <span class="en">${escHTML(sec.titleEn)}</span>
        <span class="count">${hits.length}</span>
      </h3>
      <div class="food-grid menu-food-grid">
        ${hits.map(({ idx, item }) => `
          <button class="food-card"
                  data-food-section="${escAttr(sec.id)}"
                  data-food-idx="${idx}"
                  aria-label="${escAttr(item.ja)} — ${escAttr(item.en)}"
                  type="button">
            <div class="food-svg-frame">
              <img class="food-svg" src="images/food/${escAttr(item.file)}" alt="" loading="lazy" />
            </div>
            <div class="food-card-name">
              <span class="ja">${escHTML(item.ja)}</span>
              <span class="en">${escHTML(item.en)}</span>
            </div>
          </button>
        `).join('')}
      </div>
    </section>
  `).join('');

  // Ensure the food-card click delegation is wired. The food gallery
  // page wires the same listener on the same root with the same
  // dataset guard — calling this again is a no-op when the gallery
  // page rendered first, and sets up the listener when the menu page
  // is the user's entry point. Idempotent.
  queueMicrotask(() => {
    const root = document.getElementById('vocab-page-content');
    if (!root || root.dataset.foodClicksWired) return;
    root.dataset.foodClicksWired = '1';
    root.addEventListener('click', e => {
      const card = e.target.closest('[data-food-section]');
      if (!card) return;
      const s = FOOD_GALLERY.find(x => x.id === card.dataset.foodSection);
      const it = s && s.items[+card.dataset.foodIdx];
      if (it) openFoodDialog(s, it);
    });
  });

  return `
    <div class="menu-food-gallery">
      ${sectionsHTML}
    </div>
  `;
}

function menuReferenceHTML(book, page, expBtn) {
  // Four image fields for menu rows:
  //   - foodImg:    'name.webp' → images/food/name.webp (full filename)
  //   - foodSvg:    'name'      → images/food/name.svg (legacy, no ext)
  //   - vocabImg:   'name.webp' → images/vocab/name.webp
  //   - konbiniImg: 'name.webp' → images/konbini/name.webp (the
  //                              dedicated konbini-shelf artwork
  //                              folder; one image per scene item id)
  // First non-null match wins, in the order above.
  const resolveSrc = (item) => {
    if (item.foodImg)    return `images/food/${item.foodImg}`;
    if (item.foodSvg)    return `images/food/${item.foodSvg}.svg`;
    if (item.vocabImg)   return vocabImgSrc(item.vocabImg);
    if (item.konbiniImg) return `images/konbini/${item.konbiniImg}`;
    return null;
  };
  const rowsHTML = (page.items || []).map(item => {
    const src = resolveSrc(item);
    return `
    <li class="menu-ref-row">
      <span class="menu-ref-svg">
        ${src
          ? `<img src="${escAttr(src)}" alt="" loading="lazy" onerror="${escAttr(VOCAB_IMG_ONERROR)}" />`
          : '<span class="menu-ref-svg-empty" aria-hidden="true">·</span>'
        }
      </span>
      <span class="menu-ref-kanji">${escHTML(item.kanji)}</span>
      <span class="menu-ref-kana">${escHTML(item.kana)}</span>
      <span class="menu-ref-dots"></span>
      <span class="menu-ref-en">${escHTML(item.en || '')}</span>
      ${item.price != null ? `<span class="menu-ref-price">${item.price === 0 ? '—' : '¥' + item.price.toLocaleString()}</span>` : ''}
    </li>
  `;
  }).join('');
  return `
    <div class="book-frame menu-ref-frame">
      <span class="corner-tl"></span><span class="corner-tr"></span>
      <div class="sheet-head-row">
        <h2 class="book-title menu-ref-title">
          <span class="intro-title-ja">${escHTML(page.title)}</span>
          ${page.subtitleEn ? `<span class="intro-title-en">${escHTML(page.subtitleEn)}</span>` : ''}
        </h2>
        ${expBtn}
      </div>
      ${menuFoodGalleryHeaderHTML(page.items)}
      <ul class="menu-ref-list">${rowsHTML}</ul>
    </div>
  `;
}

// Roll a random restaurant from a category and launch it fresh. Each
// click starts a brand new scene flow at the cover step — picking the
// same restaurant twice in a row still feels like a new visit. Used
// by the "experience" button on category hub books (Sushi, Omakase,
// Izakaya, Ramen, Street Food).
function renderRandomCategoryRestaurant(categoryId) {
  const all = (window.EATING_OUT_RESTAURANTS || []).filter(r => r.category === categoryId);
  if (!all.length) return null;
  const pick = all[Math.floor(Math.random() * all.length)];
  // Wipe any prior scene state for this restaurant so the random roll
  // always begins at the cover, regardless of whether the player was
  // mid-flow there from a previous random or direct visit.
  APP.scenes = APP.scenes || {};
  APP.scenes[pick.id] = freshSceneState();
  saveSceneState();
  return renderForcedRestaurant(pick.id);
}

// Route an "experience ___" button click through the existing
// Experience book (book.id = 'experience') rather than rendering a
// divergent scene flow into vocab-page-content directly. The forked
// renderRandomCategoryRestaurant() / renderForcedRestaurant() paths
// had their own subtle bugs (no sidebar update, no scene-state
// hygiene, no back-navigation context). Funneling through the
// Experience book gets us a single canonical entry point that
// handles all of that for free.
//
// State changes per click:
//   - APP.experience.restaurantId  → the target restaurant id
//   - APP.experience.completed     → false (clear any "you finished
//                                    the receipt" flag so a re-entry
//                                    starts fresh at the cover)
//   - APP.scenes[restaurantId]     → reset to fresh scene state, so
//                                    the user always lands at step 1
//                                    even if they were mid-flow there
//                                    previously
//   - APP.vocabBookId              → 'experience' (book switch)
function launchExperienceWithRestaurant(restaurantId) {
  if (!restaurantId) return;
  if (typeof experienceState === 'function') {
    const state = experienceState();
    state.restaurantId = restaurantId;
    state.completed = false;
    if (typeof saveExperienceState === 'function') saveExperienceState();
  }
  // Reset that restaurant's scene flow so we always land on the cover.
  // The flow's natural progression resumes from here as if it's a
  // fresh visit — matches the convention the bottom-bar back button
  // and sidebar-click reset already use elsewhere.
  if (APP.scenes && APP.scenes[restaurantId] && typeof freshSceneState === 'function') {
    APP.scenes[restaurantId] = freshSceneState();
    if (typeof saveSceneState === 'function') saveSceneState();
  }
  // Switch into the Experience book + persist.
  APP.vocabBookId = 'experience';
  APP.vocabPageIdx = 0;
  lsSet('jp:vocabBook', 'experience');
  // Re-render: renderVocab dispatches to renderExperience() for the
  // experience book; renderVocabSidebar / renderVocabBooksSidebar
  // refresh the sidebar highlight so the active book card is correct.
  renderVocab(document.getElementById('main-inner'));
  if (typeof renderVocabSidebar      === 'function') renderVocabSidebar();
  if (typeof renderVocabBooksSidebar === 'function') renderVocabBooksSidebar();
}

// Pick the FIRST restaurant in a category (deterministic — not the
// random roll). The user's request was to use the first option so
// the experience launch is predictable rather than surprise-random,
// which is what the previous renderRandomCategoryRestaurant did.
function launchExperienceWithFirstInCategory(categoryId) {
  const all = (window.EATING_OUT_RESTAURANTS || []).filter(r => r.category === categoryId);
  if (!all.length) return;
  launchExperienceWithRestaurant(all[0].id);
}

function wireFastFoodHubHandlers(book) {
  const root = document.getElementById('vocab-page-content');
  if (!root) return;
  root.querySelectorAll('[data-ff-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.ffPage;
      APP.vocabPageIdx = i;
      renderVocab(document.getElementById('main-inner'));
    });
  });
  // Specific-restaurant launch (Fast Food chains: McDonald's / KFC
  // each have their own page → their own restaurantId).
  root.querySelectorAll('[data-ff-experience]').forEach(btn => {
    btn.addEventListener('click', () => {
      launchExperienceWithRestaurant(btn.dataset.ffExperience);
    });
  });
  // Category-launch (Sushi / Omakase / Izakaya / Ramen / Konbini /
  // Yatai books) — picks the first restaurant in the category.
  root.querySelectorAll('[data-ff-random]').forEach(btn => {
    btn.addEventListener('click', () => {
      launchExperienceWithFirstInCategory(btn.dataset.ffRandom);
    });
  });
}

// ── Eating Out Experience — random-restaurant roller ────────────────
// Wraps the scene engine: opening the "Experience" book picks a random
// restaurant from EATING_OUT_RESTAURANTS (sticky for the session), then
// hands off to renderRestaurantScene. A reroll button rolls again.
function pickRandomRestaurant(excludeId) {
  const all = (window.EATING_OUT_RESTAURANTS || []).filter(r => r.id !== excludeId);
  if (!all.length) return (window.EATING_OUT_RESTAURANTS || [])[0];
  return all[Math.floor(Math.random() * all.length)];
}

// Merge a restaurant variant onto its template — returns a scene object
// shaped like the old RESTAURANT_SCENES['ramen-ya'] entry. Variant overrides
// take precedence: menu items, receive vocab, and receive SVG can be
// supplied at the variant level and they swap into the appropriate steps.
// Default "is the food hot" per category. Drives whether steam rises from
// the food image on the receive step.
const HOT_BY_CATEGORY = {
  ramen: true, sushi: false, omakase: false, izakaya: true, yatai: true, konbini: false,
};

function resolveScene(restaurant) {
  const tpl = (window.RESTAURANT_TEMPLATES || {})[restaurant.template];
  if (!tpl) return null;
  // Deep-ish clone so per-render edits don't bleed back into the template.
  const steps = tpl.steps.map(s => ({ ...s }));
  for (const step of steps) {
    if (step.id === 'menu' && restaurant.menu) {
      step.items = restaurant.menu;
    }
    // Shelf step (konbini) — fill sections from the shared KONBINI_SECTIONS
    // table. Variants don't override; the experience is identical across
    // the three chains by design.
    if (step.type === 'shelf' && (!step.sections || !step.sections.length)) {
      step.sections = (window.KONBINI_SECTIONS || []).map(s => ({ ...s }));
    }
    if (step.id === 'receive') {
      if (restaurant.receiveVocab) step.vocab = restaurant.receiveVocab;
      if (restaurant.receiveSvg !== undefined) step.svg = restaurant.receiveSvg;
      // 16:9 tray photo — when set, the renderer uses it in place of
      // the food SVG and suppresses the per-drink SVG cluster (the
      // tray composition already shows food + drink together).
      if (restaurant.receiveImage) step.receiveImage = restaurant.receiveImage;
      step.hot = restaurant.receiveHot !== undefined
        ? !!restaurant.receiveHot
        : !!HOT_BY_CATEGORY[restaurant.category];
    }
  }

  // Inject three new screens — cover (selector), monologue (inner thoughts),
  // and lookAround (atmospheric beat between order and food arrival).
  // Cover + monologue prepend before the existing greet/first step;
  // lookAround sits after the order step's next.
  const firstId = steps[0] && steps[0].id;
  steps.unshift({ id:'cover',     type:'cover',     restaurant, next: 'monologue' });
  steps.splice(1, 0, { id:'monologue', type:'monologue', monologue: restaurant.monologue, next: firstId || 'greet' });
  // Insert lookAround right after the order step. The order step's `next`
  // becomes 'lookAround'; lookAround's `next` becomes the original target
  // (typically 'wait' for ramen, 'receive' for lite). Two opt-outs:
  //   - tpl.skipLookAround → whole template skips (konbini: no kitchen
  //     wait between paying and leaving with the basket)
  //   - !restaurant.hasInside → restaurant hasn't had its interior
  //     artwork drawn yet, so the placeholder paper card would just
  //     interrupt pacing for no visual payoff. Flip hasInside:true on
  //     the restaurant once a real <id>-inside.png ships.
  if (!tpl.skipLookAround && restaurant.hasInside) {
    const orderIdx = steps.findIndex(s => s.id === 'order');
    if (orderIdx >= 0) {
      const originalNext = steps[orderIdx].next;
      steps[orderIdx] = { ...steps[orderIdx], next: 'lookAround' };
      steps.splice(orderIdx + 1, 0, {
        id:'lookAround',
        type:'lookAround',
        restaurant,
        next: originalNext,
      });
    }
  }

  return {
    npc: restaurant.npc,
    setting: restaurant.setting,
    name: restaurant.name,
    // Personality drives which NPC variants and player choices the engine
    // surfaces — warm shops use casual lines, formal shops use keigo, gruff
    // shops drop pleasantries entirely. Default is 'warm' for backward compat.
    personality: restaurant.personality || 'warm',
    // Brand theming for fast-food / chain restaurants. When present, the
    // menu renderer paints itself in these colors (KFC red, McDonald's
    // red+yellow, etc.) instead of the default paper look. Undefined for
    // every traditional restaurant — those stay paper-toned.
    brand: restaurant.brand || null,
    category: restaurant.category || null,
    steps,
    _variantId: restaurant.id,
  };
}

function experienceState() {
  if (!APP.experience) APP.experience = lsGet('jp:experience', { restaurantId: null });
  return APP.experience;
}
function saveExperienceState() {
  lsSet('jp:experience', APP.experience || {});
}

// Centralized helper — roll a new restaurant for the experience and reset
// the relevant state. Returns the picked restaurant.
function rollNewExperienceRestaurant(currentId) {
  const next = pickRandomRestaurant(currentId);
  if (!next) return null;
  const state = experienceState();
  state.restaurantId = next.id;
  state.completed = false;
  saveExperienceState();
  APP.scenes = APP.scenes || {};
  APP.scenes[next.id] = freshSceneState();
  saveSceneState();
  return next;
}

// True when we're inside the Experience book — used by renderRestaurantScene
// to know whether to apply the experience overlays (reroll button, shop
// name, receipt's 別の店へ override) after every render.
function inExperienceBook() {
  return APP.section === 'vocab'
      && APP.vocabClassId === 'eating-out'
      && APP.vocabBookId === 'experience';
}

// Apply experience-mode overlays to the just-rendered scene DOM. Called
// after every renderRestaurantScene call when in the experience book, so
// the reroll button + shop name + receipt-replay override survive
// internal re-renders (Next/Back/choice clicks) — not just the initial
// renderExperience entry.
function applyExperienceOverlays(el) {
  const state = experienceState();
  const restaurants = window.EATING_OUT_RESTAURANTS || [];
  const restaurant = restaurants.find(r => r.id === state.restaurantId);
  if (!restaurant) return;

  // Mark completion when the receipt is on screen.
  if (el.querySelector('.scene-receipt')) {
    state.completed = true;
    saveExperienceState();
  }

  // Header reroll button intentionally removed — the cover step's
  // `別の店 (different shop)` button covers the same intent at a more
  // appropriate point in the flow (when the player is still picking
  // a restaurant), and the receipt's `別の店へ` override handles the
  // end-of-meal re-roll. A floating dice icon in the header competed
  // visually for no real gain.

  // Receipt's 別の店へ override — rolls a new restaurant instead of
  // restarting the same one.
  const replayBtn = el.querySelector('.scene-menu-foot-receipt .scene-next[data-scene-restart], .scene-menu-foot .scene-next[data-scene-restart]');
  if (replayBtn && !replayBtn.hasAttribute('data-exp-replay-wired')) {
    const clone = replayBtn.cloneNode(true);
    clone.innerHTML = '別の店へ · try another shop';
    clone.setAttribute('data-exp-replay-wired', '');
    replayBtn.parentNode.replaceChild(clone, replayBtn);
    clone.addEventListener('click', () => {
      if (rollNewExperienceRestaurant(restaurant.id)) renderExperience();
    });
  }

  // Cover step's inline "different shop" button.
  el.querySelectorAll('[data-experience-reroll-inline]:not([data-wired])').forEach(btn => {
    btn.setAttribute('data-wired', '');
    btn.addEventListener('click', () => {
      if (rollNewExperienceRestaurant(restaurant.id)) renderExperience();
    });
  });

  // Shop name + EN gloss in the place slot of the header. The whole
  // line is also a subtle picker — click it to open a paper-toned
  // dropdown listing every restaurant grouped by category, jump to
  // any of them.
  const place = el.querySelector('.scene-head-place');
  if (place && restaurant.name) {
    place.innerHTML = `
      <button class="exp-shop-picker" type="button" data-exp-shop-open aria-haspopup="listbox" aria-expanded="false">
        <span class="exp-shop-name">${escHTML(restaurant.name.ja)}</span>
        <span class="exp-shop-sep">·</span>
        <span class="exp-shop-en">${escHTML(restaurant.name.en)}</span>
        <span class="exp-shop-caret" aria-hidden="true">▾</span>
      </button>
      ${experienceShopPickerHTML(restaurant.id)}
    `;
    wireExperienceShopPicker(place);
  }
}

// Build the restaurant dropdown markup. Restaurants are grouped by
// category in the canonical order seen in the books sidebar; the
// currently-active restaurant gets a ✓ + a highlight.
function experienceShopPickerHTML(currentId) {
  const restaurants = window.EATING_OUT_RESTAURANTS || [];
  const groups = {};
  for (const r of restaurants) {
    const cat = r.category || 'other';
    (groups[cat] = groups[cat] || []).push(r);
  }
  const CAT_LABELS = {
    ramen:    { ja:'ラーメン',     en:'Ramen' },
    sushi:    { ja:'寿司',         en:'Sushi' },
    omakase:  { ja:'おまかせ',     en:'Omakase' },
    izakaya:  { ja:'居酒屋',       en:'Izakaya' },
    yatai:    { ja:'屋台',         en:'Street food' },
    fastfood: { ja:'ファストフード', en:'Fast food' },
    konbini:  { ja:'コンビニ',     en:'Conbini' },
  };
  const CAT_ORDER = ['ramen','sushi','omakase','izakaya','yatai','fastfood','konbini'];
  const groupsHTML = CAT_ORDER.filter(c => groups[c]).map(cat => {
    const label = CAT_LABELS[cat] || { ja:cat, en:'' };
    return `
      <div class="exp-shop-group">
        <div class="exp-shop-group-head">
          <span class="ja">${escHTML(label.ja)}</span>
          <span class="en">${escHTML(label.en)}</span>
        </div>
        <ul class="exp-shop-list" role="listbox">
          ${groups[cat].map(r => `
            <li>
              <button class="exp-shop-option ${r.id === currentId ? 'is-active' : ''}"
                      type="button" data-exp-shop="${escAttr(r.id)}" role="option"
                      aria-selected="${r.id === currentId}">
                <span class="ja">${escHTML(r.name.ja)}</span>
                <span class="en">${escHTML(r.name.en)}</span>
                ${r.id === currentId ? '<span class="mark" aria-hidden="true">✓</span>' : ''}
              </button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');
  return `<div class="exp-shop-dropdown" role="dialog" hidden>${groupsHTML}</div>`;
}

// Wire the dropdown — toggle on trigger, close on outside click or
// Escape, switch restaurant on option click.
function wireExperienceShopPicker(root) {
  // If a previous render left the picker OPEN, its document-level listeners are
  // still attached (close() only fires on outside-click/Esc/select). Re-wiring
  // on the fresh DOM would orphan those old listeners onto detached nodes — a
  // leak. Tear down the previous instance's listeners before wiring this one.
  if (wireExperienceShopPicker._cleanup) {
    wireExperienceShopPicker._cleanup();
    wireExperienceShopPicker._cleanup = null;
  }
  const trigger = root.querySelector('[data-exp-shop-open]');
  const dropdown = root.querySelector('.exp-shop-dropdown');
  if (!trigger || !dropdown) return;
  const close = () => {
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKey);
    wireExperienceShopPicker._cleanup = null;
  };
  const onDocClick = (e) => {
    if (root.contains(e.target)) return; // clicks inside the picker handled separately
    close();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !dropdown.hidden;
    if (isOpen) { close(); return; }
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey);
    // Remember how to tear this open picker down if a re-render replaces it.
    wireExperienceShopPicker._cleanup = close;
  });
  dropdown.querySelectorAll('[data-exp-shop]').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = opt.dataset.expShop;
      close();
      if (selectExperienceRestaurant(id)) renderExperience();
    });
  });
}

// Set the experience state's active restaurant to a specific id and
// reset its scene state so the flow begins from the cover step.
function selectExperienceRestaurant(restaurantId) {
  const next = (window.EATING_OUT_RESTAURANTS || []).find(r => r.id === restaurantId);
  if (!next) return null;
  const state = experienceState();
  state.restaurantId = next.id;
  state.completed = false;
  saveExperienceState();
  APP.scenes = APP.scenes || {};
  APP.scenes[next.id] = freshSceneState();
  saveSceneState();
  return next;
}

// ── Food vocabulary gallery ──────────────────────────────────────────
// Sectioned grid of food illustrations sourced from images/food/. Sits
// as page 2 of the Experience book (page 1 is the interactive random-
// restaurant flow). Filenames here are the only contract — each entry
// points at a real SVG already on disk.
//
// Scene/menu illustrations from the same SVG set (greet-bow, menu-point,
// pay-register, etc.) intentionally omitted — this page is food-only,
// per the design brief.
const FOOD_GALLERY = [
  { id:'ramen', titleJa:'ラーメン', titleEn:'Ramen',
    items: [
      { file:'ramen-shio.webp',      ja:'塩ラーメン',     kana:'shio rāmen',      en:'shio — clear salt broth',
        explainJa: "日本で一番古いラーメン。函館（北海道）が発祥。鶏や魚介のだしを塩で味付けした、澄んだスープが特徴。四つのスープの中で一番あっさり。",
        explain: "The oldest ramen style, traced to Hakodate (Hokkaido). A pale, almost transparent broth made from chicken or seafood seasoned with salt — no soy sauce, no miso. The cleanest tasting of the four broth styles; you can read the noodles through it." },
      { file:'ramen-shoyu.webp',     ja:'醤油ラーメン',   kana:'shōyu rāmen',     en:'shōyu — soy broth',
        explainJa: "東京の定番。鶏や豚のだしを醤油で味付けした、茶色いスープ。ちぢれ麺、チャーシュー、メンマ、半熟卵がのっている。東京の人が「ラーメン」と聞いて思い浮かべるのはこれ。",
        explain: "Tokyo's classic. A clear brown chicken or pork broth seasoned with soy sauce. Usually served with curly noodles, chashu pork, menma (bamboo shoots), and a halved soft-boiled egg. The default \"ramen\" most Tokyoites picture." },
      { file:'ramen-miso.webp',      ja:'味噌ラーメン',   kana:'miso rāmen',      en:'miso — fermented soy paste broth',
        explainJa: "1955年、札幌（北海道）の「味の三平」で生まれた。豚のだしに味噌を合わせた濃いスープ。コーン、バター、ひき肉、もやしをのせる。寒い冬にぴったり。",
        explain: "Invented at Aji no Sanpei in Sapporo (Hokkaido) in 1955. Hearty fermented-soybean broth, often built on a pork base, topped with corn, butter, ground pork, and bean sprouts. Designed to defeat northern winters." },
      { file:'ramen-tonkotsu.webp',  ja:'豚骨ラーメン',   kana:'tonkotsu rāmen',  en:'tonkotsu — creamy pork bone',
        explainJa: "博多（福岡・九州）のスタイル。豚の骨を8〜12時間煮込んで作る、白くてクリーミーなスープ。細くてまっすぐな麺に合わせる。途中で「替え玉（麺のおかわり）」が頼める。",
        explain: "Hakata (Fukuoka, Kyushu) style. Pork bones simmered for 8-12 hours until the collagen breaks down into a thick, creamy white emulsion. Served with thin straight noodles you can order \"kaedama\" (a refill) on as the broth cools." },
      { file:'ramen-tantanmen.webp', ja:'担々麺',         kana:'tantanmen',       en:'tantanmen — spicy sesame',
        explainJa: "中国・四川の「担担麺」がもと。ごまだれと辣油、ひき肉、花椒のピリッとした香り。日本版はスープ多めで、本場よりマイルド。1950年代に陳建民が東京で広めた。",
        explain: "Adapted from Sichuan's dāndān miàn. Spicy sesame paste broth with chili oil, ground pork, and Sichuan peppercorn. The Japanese version is soupier and milder than the Chinese original — chef Chen Kenmin popularized it in Tokyo in the 1950s." },
      { file:'ramen-tsukemen.webp',  ja:'つけ麺',         kana:'tsukemen',        en:'tsukemen — cold noodles + dip',
        explainJa: "1961年、東京の「大勝軒」で生まれた。冷たい麺を、別のお椀の濃い熱いスープにつけて食べる。麺自体の味と食感がよくわかるのが魅力。",
        explain: "Invented at Taishōken (Tokyo) in 1961. The noodles are served cold on a separate plate; you dip them into a small bowl of concentrated, almost gravy-thick hot broth. Lets you taste the noodle texture you'd never notice submerged in soup." },
    ],
  },
  { id:'sushi', titleJa:'寿司', titleEn:'Sushi (nigiri)',
    items: [
      // Photographs replace the previous illustrated SVGs (sushi-maguro.svg,
      // sushi-salmon.svg, sushi-ebi.svg, sushi-maki.svg are now legacy —
      // the renderer reads file: directly, so just swapping the extension
      // is enough). Four new entries (uni, ikura, tamago, hamachi) round
      // out the section into a representative sushi-bar sampler.
      { file:'sushi-maguro.webp', ja:'マグロ',     kana:'maguro',  en:'maguro — tuna nigiri',
        explainJa: "寿司の王様。赤身（普通の身）、中トロ（少し脂）、大トロ（脂の多い腹）の順で脂が多くなり、値段も高くなる。本マグロは豊洲の競りで一番高い値がつく。",
        explain: "The default sushi topping. Akami (red lean meat) is the everyday cut; chūtoro (medium-fatty) and ōtoro (fatty belly) are progressively richer and more expensive. Bluefin commands the highest prices at Toyosu auctions." },
      { file:'sushi-salmon.webp', ja:'サーモン',   kana:'sāmon',   en:'salmon — striped fillet',
        explainJa: "実は日本の伝統的な寿司ネタではない。1980年、ノルウェーの貿易使節団が「プロジェクト・ジャパン」として持ち込んだ。今は回転寿司の人気者。",
        explain: "Not traditional Japanese sushi. Introduced by a Norwegian seafood trade mission in 1980 (\"Project Japan\") because Japan didn't eat Pacific salmon raw — only Atlantic farmed salmon was parasite-safe. Took two decades to catch on, now ubiquitous at conveyor-belt shops." },
      { file:'sushi-ebi.webp',    ja:'エビ',       kana:'ebi',     en:'ebi — prawn with tail',
        explainJa: "茹でた車海老を開いて、尻尾つきでにぎる。甘くてやさしい味で、火が通っている数少ないネタ。子供や寿司初心者に人気。",
        explain: "Cooked tiger prawn, butterflied and draped tail-on over rice. One of the few traditionally cooked nigiri toppings — sweet, mild, a gentle pick for kids and sushi novices." },
      { file:'sushi-hamachi.webp', ja:'ハマチ',    kana:'hamachi', en:'hamachi — yellowtail nigiri',
        explainJa: "ブリ（成魚）の若い時の呼び名。脂がのっていて、口の中でとろける食感が特徴。冬が旬で、寒ブリは最高級。マグロとサーモンの中間のような味で、寿司屋の人気ネタの一つ。",
        explain: "Young yellowtail (the same fish later becomes buri when fully mature). Buttery, with a soft melt-in-the-mouth texture from the natural fat. Winter is peak season — kanburi (cold-season yellowtail) is the most prized. Flavor sits between tuna's depth and salmon's softness." },
      { file:'sushi-tamago.webp', ja:'玉子',       kana:'tamago',  en:'tamago — sweet egg omelet',
        explainJa: "出汁、醤油、砂糖、みりんで味付けした卵焼きを、海苔の帯でにぎりに留めた一貫。江戸時代から続く伝統的なネタ。職人の腕がよく分かるネタなので、初めて行く店では「玉子から食べる」のがツウのやり方。",
        explain: "Dashi-sweetened layered omelet bound to rice with a nori belt. A traditional Edo-era nigiri and the most low-key reveal of a chef's skill — getting the layers thin, even, and just-set is hard. Connoisseurs order tamago first at a new shop to read how the place is built." },
      { file:'sushi-maki.webp',   ja:'巻き寿司',   kana:'maki-zushi', en:'maki — nori-wrapped rolls',
        explainJa: "海苔とご飯で巻いた寿司。細巻き（一種類の具）、太巻き（具がたくさん）、裏巻き（ご飯が外側）の三種類。カリフォルニアロールなどの裏巻きは、1960年代のロサンゼルスで生まれた洋風アレンジ。",
        explain: "Hosomaki (thin, single filling like tuna or cucumber), futomaki (thick, multiple fillings), and uramaki (rice-on-the-outside) are the three forms. Uramaki — including the California roll — is a Western invention from 1960s Los Angeles, not a Japanese tradition." },
      { file:'sushi-uni.webp',    ja:'ウニ',       kana:'uni',     en:'uni — sea urchin gunkan',
        explainJa: "ウニ（雲丹）の生殖巣。海苔を帯にして「軍艦巻き」（船の形）にして、ご飯の上にのせる。北海道のエゾバフンウニとムラサキウニが最高級。クリーミーで濃厚な海の味。",
        explain: "Sea urchin gonads — creamy, briny, ocean-rich. Served gunkan-style (\"battleship\"), with nori wrapped as a wall around the rice to hold the loose roe. Hokkaido's ezo-bafun (orange) and murasaki (yellow) varieties are the most prized. Polarizing — people love it or don't." },
      { file:'sushi-ikura.webp',  ja:'いくら',     kana:'ikura',   en:'ikura — salmon roe gunkan',
        explainJa: "鮭の卵を醤油漬けにしたもの。一粒一粒が口の中で弾けて、塩気と旨味がじゅわっと出る。「いくら」はロシア語の「икра」（魚卵全般）から。北海道や東北の郷土料理。軍艦巻きで出される。",
        explain: "Salmon eggs cured in soy and mirin. Each pearl-sized egg pops between the teeth and releases a hit of salt and umami. The word \"ikura\" comes from Russian (икра, \"fish roe\") — historically a Hokkaidō and Tōhoku regional dish. Almost always served gunkan-style." },
    ],
  },
  { id:'omakase', titleJa:'おまかせ', titleEn:'Omakase',
    items: [
      { file:'omakase-classic-five.webp', ja:'おまかせ五貫',       kana:'omakase go-kan',       en:'classic five nigiri',
        explainJa: "「おまかせ」は「シェフに任せる」という意味。五貫は入門コース。季節の白身、マグロ、サーモン、エビ、脂の多いネタなど、お店のスタイルを知るのに良い。",
        explain: "\"Omakase\" means \"I leave it to you\" — the chef picks. The five-piece set is the standard entry-level omakase: seasonal whitefish, tuna, salmon, shrimp, and a fattier piece. A clean introduction to a chef's style without committing to a full course." },
      { file:'omakase-premium-five.webp', ja:'おまかせプレミアム', kana:'omakase puremiamu',    en:'premium five — uni, ikura, toro, aburi',
        explainJa: "高級ネタの五貫。ウニ（雲丹）、いくら、大トロ、炙りなど。どれも技術が必要なネタで、値段の半分は職人の腕と言ってもいい。",
        explain: "The splurge tier. Uni (sea urchin gonads, briny and creamy), ikura (salmon roe that pops), ōtoro (fatty bluefin belly), and aburi (torch-seared with a brushed soy glaze). Each piece is technically demanding — half the price is the chef's skill." },
      { file:'dish-sashimi-platter.webp', ja:'おまかせ刺身',       kana:'omakase sashimi',      en:'sashimi assortment on daikon nest',
        explainJa: "ご飯なしで魚を切ったもの。大根のツマの上に、しそとわさびを添えて出す。全部が包丁仕事 — 切る角度、厚み、繊維の方向で職人の腕が見える。",
        explain: "Sliced raw fish without rice. Served on a bed of finely shredded daikon, with shiso leaf and wasabi. The whole dish is knife work — a great sashimi cut shows the angle, thickness, and grain handling of the chef." },
      { file:'omakase-tempura.webp',      ja:'おまかせ天ぷら',     kana:'omakase tenpura',      en:'tempura course at the bar',
        explainJa: "江戸前の天ぷらは、カウンターで一品ずつ揚げて、出来立てを出す。ごま油入りの油、薄い衣、塩か天つゆで食べる。",
        explain: "Edo-style tempura is course-by-course at the counter: each piece fried in front of you and served the moment it leaves the oil. Sesame-oil-blended fryer, light batter, eaten with salt or a tentsuyu dipping sauce." },
      { file:'omakase-kaiseki.webp',      ja:'おまかせ懐石',       kana:'omakase kaiseki',      en:'kaiseki — small-plate tasting course',
        explainJa: "茶道から生まれた高級料理。京都が本場。季節の食材、決まったコース順（先付・椀物・向付・焼物…）、器や盛り付けの美しさを大切にする。",
        explain: "Multi-course haute cuisine descended from the tea ceremony tradition in Kyoto. Strict seasonal ingredients, prescribed course order (sakizuke, wanmono, mukōzuke, yakimono...), and aesthetic focus on the bowls and presentation as much as the food itself." },
    ],
  },
  { id:'yakitori', titleJa:'焼き鳥', titleEn:'Yakitori',
    items: [
      { file:'yakitori-momo.webp',    ja:'もも',     kana:'momo',     en:'momo — chicken thigh',
        explainJa: "鶏のもも肉。一番人気の部位。ジューシーで、備長炭の火でも焼きやすい。「タレ」（甘い醤油のタレ）か「塩」（塩だけ）を選べる。通は塩派が多い。",
        explain: "Thigh meat — the most popular cut. Juicy, forgiving on the binchōtan charcoal grill, hard to overcook. Comes in two seasonings: tare (sweet soy glaze) or shio (just salt). Salt is purists' preference for tasting the meat." },
      { file:'yakitori-negima.webp',  ja:'ねぎま',   kana:'negima',   en:'negima — chicken + scallion',
        explainJa: "もも肉と長ねぎを交互に串に刺したもの。鶏の脂で長ねぎが甘くなる。江戸（東京）の定番の組み合わせ。何を頼むか迷ったらこれ。",
        explain: "Thigh alternated with chunks of Japanese leek (negi) on the skewer. The leek caramelizes and softens against the chicken fat — the classic Edo (Tokyo) yakitori combination. Order one if you're unsure where to start." },
      { file:'yakitori-kawa.webp',    ja:'皮',       kana:'kawa',     en:'kawa — crispy chicken skin',
        explainJa: "鶏の皮を串に巻いて、カリカリに焼く。安くて、脂っこくて、ビールに合う。脂の多い串の間に食べると口の中がリセットされる。",
        explain: "Chicken skin wound onto a skewer and grilled until shatter-crisp. Cheap, fatty, addictive. Often eaten between richer skewers as a palate cleanser — or with a beer, as a snack on its own." },
      { file:'yakitori-sasami.webp',  ja:'ささみ',   kana:'sasami',   en:'sasami — breast tenderloin',
        explainJa: "胸肉の内側の柔らかい部分。中がほんのりピンクのまま、さっと焼く。しそと梅干しを添えるのが定番。脂っこい串の合間にちょうどいい。",
        explain: "The lean inner fillet of the breast. Grilled briefly so the inside stays slightly pink and very tender. Usually topped with shiso leaf and umeboshi (pickled plum) — a clean, almost herbal counterpoint to the fattier skewers." },
      { file:'yakitori-tebasaki.webp', ja:'手羽先',  kana:'tebasaki', en:'tebasaki — chicken wings',
        explainJa: "鶏の手羽。焼くか揚げる。名古屋名物で、塩こしょうの甘辛タレで味付けする。手で食べるのが普通。「世界の山ちゃん」のチェーン店で全国に広まった。",
        explain: "Whole chicken wings, grilled or deep-fried. Nagoya is famous for its tebasaki style: a sweet-soy glaze with black pepper, eaten with fingers. Sekai-no-Yamachan is the chain that made it nationally famous." },
      { file:'yakitori-tsukune.webp', ja:'つくね',   kana:'tsukune',  en:'tsukune — chicken meatball',
        explainJa: "鶏のひき肉を、軟骨や時にしそ・椎茸と一緒にこねて作る団子。東京では生の卵黄を添えて、つけて食べる。他の地域では甘いタレを塗ったもの。",
        explain: "Ground chicken kneaded with cartilage for texture, sometimes shiso and shiitake. In Tokyo, served with a raw egg yolk on the side — you roll each bite through the yolk before eating. Other regions just glaze it with tare." },
    ],
  },
  { id:'dumplings', titleJa:'餃子', titleEn:'Dumplings',
    items: [
      { file:'dish-gyoza.webp',         ja:'焼き餃子',  kana:'yaki-gyōza', en:'yaki — pan-fried',
        explainJa: "日本の標準。下はカリカリに焼いて、水を入れて蓋をして上を蒸す。もとは中国の餃子で、戦後、満州から帰ってきた日本兵が技術を持ち帰った。宇都宮と浜松が「餃子の街」を争う。",
        explain: "The standard Japanese gyoza. Pan-fried until the bottom is crisp and golden, then steamed with a splash of water under a lid. Originally Chinese (jiaozi), Japanese soldiers returning from Manchuria after WWII brought back the technique — Utsunomiya and Hamamatsu both claim the title of \"gyoza capital.\"" },
      { file:'dumpling-gyoza-sui.webp', ja:'水餃子',   kana:'sui-gyōza',  en:'sui — boiled in broth',
        explainJa: "中国の本場のスタイル。塩水かスープで茹でる。皮が柔らかくてつるっとしている。醤油・酢・ラー油のたれにつけて食べる。日本では焼き餃子より少ないが、中華料理店の定番。",
        explain: "Closer to the original Chinese style. Boiled in salted water or broth, served soft and slippery with a dipping sauce of soy + vinegar + chili oil. Less common in Japan than the pan-fried version, but standard in Chinese restaurants." },
      { file:'dumpling-gyoza-age.webp', ja:'揚げ餃子', kana:'age-gyōza',  en:'age — deep-fried',
        explainJa: "全部揚げる。表も中もカリカリ。サイズが小さくて乾いていて、ご飯のおかずというよりお酒のおつまみ。居酒屋のメニューによくある。",
        explain: "Deep-fried all the way through — crunchy edge to edge, no soft side. Usually a pub snack rather than a meal: smaller, drier, made for beer pairing. Not as common as yaki-gyoza in Japan, but a fixture on izakaya menus." },
      { file:'dumpling-shumai.webp',   ja:'焼売',      kana:'shūmai',     en:'shūmai — open-top steamed',
        explainJa: "上が開いた蒸し餃子。発祥は中国・内モンゴル（フフホト）。横浜中華街の「崎陽軒」は横浜駅で月に約100万個売る — 日本人にとっての焼売はこの形。",
        explain: "Open-topped steamed dumpling, originally from Inner Mongolia (Hohhot). The Yokohama Chinatown chain Kiyoken sells about a million boxes a month at Yokohama Station — they're the canonical Japanese shūmai for most people." },
    ],
  },
  { id:'drinks', titleJa:'飲み物', titleEn:'Drinks',
    items: [
      { file:'drink-beer.svg',      ja:'生ビール',  kana:'nama bīru',    en:'draft beer',
        explainJa: "樽から注ぐビール。日本の四大ビールメーカーはアサヒ、キリン、サッポロ、サントリー。どれもキリッとしたラガー系で、冷たく出される。「とりあえず生で」が居酒屋の合言葉。",
        explain: "Draft beer from the tap. Japan's four big breweries — Asahi, Kirin, Sapporo, Suntory — all make crisp, dry, ice-cold lagers. \"Toriaezu nama\" (\"a draft to start\") is the unofficial opening line of every izakaya order." },
      { file:'drink-beer-can.svg',  ja:'缶ビール',  kana:'kan bīru',     en:'beer in a can',
        explainJa: "コンビニで売っているビール。同じ銘柄でも、バーで600円のところがコンビニでは250円ぐらい。冷たく売られていて、ほとんどの公共の場所では飲んでも大丈夫。",
        explain: "Canned beer. Same brands as draft, but bought at konbini for around ¥250 instead of ¥600 at the bar. Sold cold and drinkable on the street — Japan has no open-container law in most public spaces." },
      { file:'drink-highball.svg',  ja:'ハイボール', kana:'haibōru',      en:'whisky + soda over ice',
        explainJa: "ウイスキー + 炭酸水 + レモンを氷の上に。2008年、サントリーが「角瓶」の販売促進で復活させた。ウイスキーが重いと感じる若い人向けに広めて、今では居酒屋でビール以外の定番。",
        explain: "Whisky + carbonated water + lemon over ice. Suntory revived it in 2008 as a sales push for their Kakubin whisky, marketing it to younger drinkers who found whisky too heavy. Now the default \"non-beer\" izakaya order." },
      { file:'drink-sake.svg',      ja:'日本酒',    kana:'nihonshu',     en:'rice wine — tokkuri & ochoko',
        explainJa: "米から作るお酒。純米（醸造アルコールなし）、吟醸（精米歩合60%以下）、大吟醸（50%以下）が等級。米を磨くほど、すっきりした味になる。冬は熱燗、夏は冷酒で、徳利とお猪口で飲む。",
        explain: "\"Nihonshu\" literally means \"Japanese liquor.\" Junmai (no added alcohol), ginjō (rice polished to ≤60%), daiginjō (≤50%) are the polish-level grades — more polished rice = clearer, more delicate flavor. Served warm (kan) in winter, cold (reishu) in summer, in a tokkuri (small flask) + ochoko (cup)." },
      { file:'drink-cola.svg',      ja:'コーラ',    kana:'kōra',         en:'cola bottle',
        explainJa: "コカ・コーラ。日本では300mlの瓶も普通で、味もアメリカ版より少し甘さ控えめ。ペプシもあるが、コカ・コーラのシェアが約7割。",
        explain: "Coca-Cola. Japan-only sizing (300ml bottles are common, 500ml standard), and a slightly less-sweet formula than the US version. Pepsi exists but Coke dominates ~70% of the market." },
      { file:'drink-water.svg',     ja:'お水',      kana:'omizu',        en:'water with ice',
        explainJa: "レストランでは注文前にお茶と一緒に無料で出てくる。日本の水道水は全国どこでも安全に飲める。ペットボトルの水は、品質よりも持ち運びのために買われる。",
        explain: "Water — always free at restaurants, served alongside hot tea before you order. Tap water in Japan is safe and clean nationwide, so bottled water is mostly a portability thing rather than a quality one." },
      { file:'drink-sparkling.svg', ja:'炭酸水',    kana:'tansansui',    en:'sparkling water',
        explainJa: "味のない、または少しレモン味の炭酸水。家でハイボールを作る時にも使うし、甘くないノンアルコールとしても飲まれる。ウィルキンソン（1904年から）が代表的なブランド。",
        explain: "Plain or lemon-flavored carbonated water. Often used as a highball mixer at home, or as a non-alcoholic alternative when you don't want sweet drinks. Wilkinson (since 1904) is the iconic brand." },
      { file:'drink-tea.svg',       ja:'お茶',      kana:'ocha',         en:'tea',
        explainJa: "ただの「お茶」 — ほとんどの場合、緑茶（煎茶かほうじ茶）を指す。レストランでは食事と一緒に無料で出る。冬は温かく、夏は冷たくして出される。コンビニのペットボトルのお茶は何十種類もある。",
        explain: "Just \"tea\" — almost always green (sencha or hōjicha). Served free with the meal at restaurants, hot in winter and cold (oicha) in summer. Bottled green tea at konbini comes in dozens of brands and roasts." },
    ],
  },
  { id:'other', titleJa:'一品', titleEn:'Other dishes',
    items: [
      { file:'dish-tonkatsu.webp', ja:'とんかつ', kana:'tonkatsu', en:'fried pork cutlet',
        explainJa: "明治時代の洋食。豚のロースかヒレ肉に、パン粉の衣をつけて油で揚げる。千切りキャベツ、ご飯、味噌汁と一緒に、とんかつソース（りんご、トマト、ウスターソースが入った濃いソース）をかけて食べる。",
        explain: "A Western-influenced (\"yōshoku\") dish from the late 1800s. Pork loin or fillet, breaded in panko, deep-fried in lard or oil. Served with finely shredded raw cabbage, rice, miso soup, and tonkatsu sauce — a thick brown sauce with apple, tomato, and Worcestershire notes." },
      { file:'dish-sushi.webp',   ja:'寿司',     kana:'sushi',    en:'sushi — assorted plate',
        explainJa: "寿司の総称。にぎり（酢飯にネタをのせる）、巻き、ちらし（酢飯の上に散らす）、いなり（油揚げに詰める）など色々ある。普通の寿司屋は江戸前 — 酢飯に一切れの魚をのせる形。",
        explain: "The umbrella term — covers nigiri (the rice + topping form), maki (rolls), chirashi (scattered on rice), inari (in tofu pockets), and more. Most casual sushi shops are Edomae-style: vinegared rice with a single fish piece on top." },
      { file:'dish-tempura.webp', ja:'天ぷら',   kana:'tenpura',  en:'battered & fried',
        explainJa: "魚や野菜に衣をつけて揚げた料理。16世紀にポルトガルの宣教師が技術を伝えた（「天ぷら」の語源はラテン語の「tempora」 — 四旬節の断食日のこと）。日本では薄くて軽い衣に進化した。塩か天つゆで食べる。",
        explain: "Battered and deep-fried seafood and vegetables. Portuguese missionaries introduced the technique in the 16th century (the word \"tempura\" probably comes from Latin \"tempora\" — Lent fasting days). Japan refined it into a light, almost lacy batter, eaten with salt or a soy-mirin dip." },
      { file:'dish-yakitori.webp', ja:'焼き鳥',   kana:'yakitori', en:'assorted grilled chicken skewers',
        explainJa: "鶏を部位ごとに串にして焼いた料理の総称。もも、皮、砂肝、ハツ、ぼんじりなど、それぞれが別の串。備長炭の上で焼くお店が本格的。一羽の鶏を無駄なく使うのが上手な焼き鳥屋。",
        explain: "Skewered grilled chicken — the umbrella term. Every part of the bird gets its own skewer (momo, kawa, sunagimo for gizzard, hatsu for heart, bonjiri for tail), grilled over binchōtan charcoal. A good yakitori-ya uses the whole chicken across one menu." },
    ],
  },
];

// ── Flavors page ─────────────────────────────────────────────────────
// Phase 1 of the Flavors & Textures sub-system. Renders the bento +
// drill-in immersion engine. Dispatched from the renderVocab() empty-
// state branch when a book carries isFlavorsPage:true. The book also
// carries a `flavors` array of 10 sensory primitives with their kana,
// kanji, romaji, canonical food, color tokens, and english+notes.
//
// Two states share one container:
//   data-mode="bento"     → 10-card scan grid (encounter)
//   data-mode="immersion" → full-bleed color flood, one flavor at a time
// The active state is set from APP.flavorId (null = bento, string = drill-in).
//
// Spec: docs/superpowers/specs/2026-05-26-flavors-textures.{PRODUCT,DESIGN}.md
//
// Pedagogical contract: NO ENGLISH on the bento card front. English
// only surfaces inside the immersion view's collapsed <details> drawer.
// Color floods the canvas (not a hero card) because the color IS the
// encoding of the flavor — yellow IS suppai, not "yellow because lemons."
function flavorsPageHTML(book) {
  const flavors = book.flavors || [];
  // Resolve current flavor — defensive against stale localStorage that
  // references a flavor id no longer in the book.
  const currentFlavor = APP.flavorId && flavors.find(f => f.id === APP.flavorId);
  const mode = currentFlavor ? 'immersion' : 'bento';

  // ── Bento HTML ──
  const bentoHTML = `
    <header class="flavors-bento-head">
      <div class="flavors-bento-eyebrow">flavors · 味</div>
      <h1 class="flavors-bento-title"><ruby>味<rt>あじ</rt></ruby>の <ruby>世界<rt>せかい</rt></ruby></h1>
      <p class="flavors-bento-sub">
        Tap a card to enter that flavor's world. No English on the cards
        — listen, look, feel. The translation waits in the drawer.
      </p>
    </header>
    <ul class="flavors-bento" role="list">
      ${flavors.map((f, i) => `
        <li class="flavor-bento-card"
            style="--chip:${escAttr(f.chip)}; --flood:${escAttr(f.flood)}; --ink-on-flood:${escAttr(f.ink)}; --exit-i:${i};">
          <button class="flavor-bento-enter"
                  data-flavor-id="${escAttr(f.id)}"
                  aria-label="${escAttr(f.kana)} — enter this flavor's world"
                  type="button">
            <div class="flavor-bento-image">
              <image-slot image-key="vocab/${escAttr(f.id)}" readonly></image-slot>
            </div>
            <p class="flavor-bento-kana">${escHTML(f.kana)}</p>
          </button>
        </li>
      `).join('')}
    </ul>
  `;

  // ── Immersion HTML ──
  // Only rendered with real content when a flavor is active; otherwise
  // it's an empty shell that the CSS hides via data-mode="bento".
  const immersionHTML = currentFlavor
    ? renderFlavorImmersionInner(currentFlavor, flavors)
    : '';

  return `
    <div class="flavors-frame"
         data-mode="${mode}"
         data-book-id="${escAttr(book.id)}"
         ${currentFlavor ? `style="
           --flood:${escAttr(currentFlavor.flood)};
           --ink-on-flood:${escAttr(currentFlavor.ink)};
           --chip:${escAttr(currentFlavor.chip)};
         "` : ''}>
      <div class="flavors-bento-wrap">${bentoHTML}</div>
      <div class="flavors-immersion-wrap">${immersionHTML}</div>
    </div>
  `;
}

// Renders the inner content of an immersion view for one flavor. Split
// out so we can re-render JUST this fragment when the user walks between
// flavors via the rail or arrow keys, without rebuilding the whole page.
function renderFlavorImmersionInner(flavor, allFlavors) {
  // The 10-thumb rail. Order matches the book's flavors array; the
  // active flavor's thumb is highlighted, the rest are ghosted (CSS).
  const railHTML = allFlavors.map((f, i) => `
    <button class="flavor-rail-thumb ${f.id === flavor.id ? 'is-active' : ''}"
            data-flavor-id="${escAttr(f.id)}"
            style="--enter-i:${i};"
            type="button"
            aria-label="${escAttr(f.kana)}"
            ${f.id === flavor.id ? 'aria-current="true"' : ''}>
      <image-slot image-key="vocab/${escAttr(f.id)}" readonly></image-slot>
    </button>
  `).join('');

  // Kana centerpiece — if a kanji exists, render as ruby so furigana
  // sits above the kanji at small size. Otherwise just the kana plain.
  // The clamp-sized type is set in CSS on .flavor-immersion-kana.
  const kanaHTML = flavor.kanji
    ? `<ruby>${escHTML(flavor.kanji)}<rt>${escHTML(flavor.kana)}</rt></ruby>`
    : escHTML(flavor.kana);

  return `
    <nav class="flavor-rail" aria-label="Flavors">
      <button class="flavor-rail-back"
              data-flavor-back
              type="button"
              aria-label="Back to all flavors (bento overview)"
              title="Back to the bento (ESC)">
        <!-- 2×2 grid icon = "back to the grid of all flavors", visually
             distinct from a left arrow so it doesn't read as
             "walk one left". -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <rect x="3"  y="3"  width="7" height="7" rx="1.2"/>
          <rect x="14" y="3"  width="7" height="7" rx="1.2"/>
          <rect x="3"  y="14" width="7" height="7" rx="1.2"/>
          <rect x="14" y="14" width="7" height="7" rx="1.2"/>
        </svg>
      </button>
      <div class="flavor-rail-thumbs" role="tablist">
        <span class="flavor-rail-spacer" aria-hidden="true"></span>
        ${railHTML}
        <span class="flavor-rail-spacer" aria-hidden="true"></span>
      </div>
      <div class="flavor-rail-keys" aria-hidden="true">
        <kbd>←</kbd><kbd>→</kbd>
        <span class="flavor-rail-keys-sep">/</span>
        <kbd>A</kbd><kbd>D</kbd>
        <span>walk</span>
      </div>
    </nav>

    <div class="flavors-immersion-body" tabindex="-1">
      <div class="flavor-immersion-image">
        <image-slot image-key="vocab/${escAttr(flavor.id)}" readonly></image-slot>
      </div>
      <div class="flavor-immersion-identity">
        <p class="flavor-immersion-kana">${kanaHTML}</p>
        <p class="flavor-immersion-food">${escHTML(flavor.canonicalFood.ja)}</p>
        <button class="flavor-immersion-audio"
                data-speak="${escAttr(flavor.kana)}"
                data-flavor-audio="${escAttr(flavor.id)}"
                type="button"
                aria-label="Hear ${escAttr(flavor.kana)} pronounced">
          ${speakerIconSVG()}
        </button>
      </div>
    </div>

    <section class="flavor-related" aria-label="Foods that carry this flavor">
      <div class="flavor-related-notes">
        <p class="en-gloss">${escHTML(flavor.en)}</p>
        ${flavor.notes ? `<p class="notes">${escHTML(flavor.notes)}</p>` : ''}
      </div>
      ${(() => {
        // Phase 3+ cross-link: foods from the edibles database whose
        // flavors[] includes this flavor's id. Each card opens that
        // edible's detail spread when clicked — the same navigation
        // path the items grid uses, just initiated from the flavors
        // immersion view. The flavor + paper aesthetic is preserved:
        // small image-slot cards on a flood-tinted paper backing.
        //
        // Standalone FLAVOR_EXAMPLES are appended after carriers so
        // the row works even for flavors no edible carries (mazui has
        // zero carriers; its examples are the rotten/moldy set).
        // Example cards are non-clickable divs — no detail to open.
        // No explicit limit — the function caps at 100 internally,
        // which is well above the total edibles set size. All items
        // carrying this flavor (across all 8 categories) surface here.
        const carriers = findEdiblesWithFlavor(flavor.id);
        const examples = findFlavorExamples(flavor.id);
        if (!carriers.length && !examples.length) {
          return `
            <div class="flavor-related-placeholder">
              No edibles in the database yet carry ${escHTML(flavor.kana)}.
              Add them in the Edibles section and they'll appear here.
            </div>
          `;
        }
        const carriersHTML = carriers.map(({ item, cat, book }, i) => `
          <button class="flavor-related-card"
                  data-flavor-to-edible="${escAttr(book.id)}/${escAttr(cat.id)}/${escAttr(item.id)}"
                  style="--enter-i:${i};"
                  type="button"
                  aria-label="Open ${escAttr(item.kana)} — ${escAttr(item.en)}">
            <div class="flavor-related-image">
              <image-slot image-key="vocab/${escAttr(item.id)}" readonly></image-slot>
            </div>
            <div class="flavor-related-name">
              <span class="ja">${escHTML(item.kana)}</span>
            </div>
          </button>
        `).join('');
        const examplesHTML = examples.map((ex, i) => {
          // Split label into colored verb prefix + noun. Mazui examples
          // carry verbKana + nounKana so the verb (kusatta / kabita /
          // shioreta) renders smaller and tinted while the noun keeps
          // the default ink weight. Falls back to a single .ja span
          // for examples that only carry a flat .kana (other flavors).
          const labelHTML = (ex.verbKana && ex.nounKana)
            ? `<span class="example-verb verb-${escAttr(ex.verb || '')}">${escHTML(ex.verbKana)}</span><span class="example-noun">${escHTML(ex.nounKana)}</span>`
            : `<span class="ja">${escHTML(ex.kana || '')}</span>`;
          const aria = (ex.verbKana && ex.nounKana)
            ? ex.verbKana + ex.nounKana
            : (ex.kana || '');
          return `
            <div class="flavor-related-card is-example"
                 role="img"
                 style="--enter-i:${carriers.length + i};"
                 aria-label="Example: ${escAttr(aria)}">
              <div class="flavor-related-image">
                <image-slot image-key="vocab/${escAttr(ex.id)}" readonly></image-slot>
              </div>
              <div class="flavor-related-name">
                ${labelHTML}
              </div>
            </div>
          `;
        }).join('');
        // Verb-grammar notes that explain the three "gone bad" verbs
        // beneath the mazui row. Each row carries the same color class
        // as the card labels (verb-kusatta / verb-kabita / verb-shioreta)
        // so the visual cue is consistent: yellowy-green kana on the
        // card matches the yellowy-green chip in the notes.
        const verbNotes = findFlavorVerbNotes(flavor.id);
        const verbNotesHTML = verbNotes ? `
          <section class="flavor-verb-notes" aria-label="Verb grammar reference">
            <p class="flavor-verb-intro">${escHTML(verbNotes.intro || '')}</p>
            <ul class="flavor-verb-list" role="list">
              ${verbNotes.verbs.map(v => `
                <li class="flavor-verb-row">
                  <span class="flavor-verb-chip verb-${escAttr(v.verb)}">
                    <span class="flavor-verb-kanji">${escHTML(v.kanji)}</span>
                    <span class="flavor-verb-romaji">${escHTML(v.romaji)}</span>
                  </span>
                  <span class="flavor-verb-meaning">${escHTML(v.meaning)}</span>
                  <span class="flavor-verb-pairs">${escHTML(v.pairs)}</span>
                </li>
              `).join('')}
            </ul>
          </section>
        ` : '';
        return `
          <div class="flavor-related-row">
            ${carriersHTML}${examplesHTML}
          </div>
          ${verbNotesHTML}
        `;
      })()}
    </section>

    <p class="flavor-keys-hint">esc returns · space hears the word</p>
  `;
}

// Attaches click + keyboard handlers to the flavors page DOM. Called
// after flavorsPageHTML() has been written into #vocab-page-content.
function wireFlavorsPageHandlers(book) {
  const frame = document.querySelector('.flavors-frame[data-book-id="' + book.id + '"]');
  if (!frame) return;

  // ── Bento card click → enter immersion ──
  // Use event delegation on the bento <ul> so the listener survives
  // any inner re-render that swaps the cards.
  //
  // The audio button (.flavor-bento-audio with [data-flavor-audio]) is
  // a SIBLING of the enter button (.flavor-bento-enter with
  // [data-flavor-id]) — they're not nested. So when the user clicks
  // audio, the click bubbles up here but doesn't match
  // [data-flavor-id], and we early-return without entering immersion.
  // The document-level [data-speak] delegate (line ~13399) then fires
  // TTS on the same bubble. Don't stopPropagation — that would suppress
  // the TTS too.
  const bento = frame.querySelector('.flavors-bento');
  if (bento) {
    bento.addEventListener('click', e => {
      const enterBtn = e.target.closest('[data-flavor-id]');
      if (!enterBtn) return;       // clicked the audio button or the chip or empty space
      enterFlavorImmersion(book, enterBtn.dataset.flavorId);
    });
  }

  // ── Immersion: rail thumb / back / drawer / arrows ──
  // Attached to the frame so the listener survives between fragment
  // re-renders. The handlers check what was clicked.
  frame.addEventListener('click', e => {
    // Back to bento
    if (e.target.closest('[data-flavor-back]')) {
      exitFlavorImmersion(book);
      return;
    }
    // Switch flavor via rail thumb
    const thumb = e.target.closest('.flavor-rail-thumb');
    if (thumb && thumb.dataset.flavorId) {
      // No re-enter if user clicked the already-active thumb
      if (thumb.dataset.flavorId === APP.flavorId) return;
      switchFlavor(book, thumb.dataset.flavorId);
      return;
    }
    // Cross-link: foods-that-carry-this-flavor card → jump into the
    // edibles book's item-detail spread. data-flavor-to-edible carries
    // "<bookId>/<catId>/<itemId>" so we know which edible to open.
    const relatedBtn = e.target.closest('[data-flavor-to-edible]');
    if (relatedBtn) {
      const [edibleBookId, catId, itemId] = relatedBtn.dataset.flavorToEdible.split('/');
      // Record the flavor we came from so the edible detail spread
      // can render a second back button labeled with this flavor's
      // kana — letting the user bounce straight back to the flavor's
      // color world without going through the sidebar.
      APP.edibleFromFlavor = APP.flavorId;
      lsSet('jp:edibleFromFlavor', APP.edibleFromFlavor);
      // Clear flavor immersion state — the flavor breadcrumb above
      // is the only thing that carries forward; coming back here via
      // sidebar should land in bento, not in the previous immersion.
      APP.flavorId = null;
      lsSet('jp:flavorId', null);
      // Switch the active vocab book to the edibles book and land
      // directly in the chosen item's detail spread.
      APP.vocabBookId = edibleBookId;
      APP.edibleCategory = catId;
      APP.edibleItem = itemId;
      lsSet('jp:vocabBook', edibleBookId);
      lsSet('jp:edibleCategory', catId);
      lsSet('jp:edibleItem', itemId);
      const inner = document.getElementById('main-inner');
      if (inner) renderVocab(inner);
      if (typeof renderVocabBooksSidebar === 'function') renderVocabBooksSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  });

  // ── Keyboard handler ──
  // Bound to document, but self-cleans when the immersion frame leaves
  // the DOM (user navigated to a different book / page / app section).
  if (!flavorsPageHandlersWired._keyBound) {
    flavorsPageHandlersWired._keyBound = true;
    document.addEventListener('keydown', flavorsKeyHandler);
  }

  // ── Mount focus ──
  // If immersion just landed, focus the body so arrow keys work even
  // without a click. tabindex=-1 in the HTML makes it focusable without
  // entering the tab order.
  if (frame.dataset.mode === 'immersion') {
    const body = frame.querySelector('.flavors-immersion-body');
    if (body && document.activeElement === document.body) {
      // Don't yank focus if the user has already focused something else
      // (search bar, sidebar item). Only grab focus when nothing else
      // claimed it.
      requestAnimationFrame(() => body.focus({ preventScroll: false }));
    }
  }

  // ── Page-entry choreography ──
  // Fire ONCE when the user lands on this book from the sidebar (or on
  // first paint after a reload). Re-uses the same .is-entering-bento
  // cascade the exit-immersion path uses, so the bento cards "drop in"
  // with stagger every time the user opens flavors fresh. Internal
  // re-renders (immersion swaps, rail clicks) don't set the entrance
  // flag, so they skip this entirely. Reduced-motion users skip too.
  if (window.__bookEntranceFlag === book.id && frame.dataset.mode === 'bento') {
    window.__bookEntranceFlag = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      void frame.offsetWidth; // restart from 0 if the class was already there
      frame.classList.add('is-entering-bento');
      setTimeout(() => frame.classList.remove('is-entering-bento'), 1100);
    }
  }
}
// Module-private flag — used to avoid double-binding the keyboard
// handler across re-renders. Stored on the function itself so it
// survives without leaking into global scope.
const flavorsPageHandlersWired = wireFlavorsPageHandlers;

// Global keydown handler for the flavors immersion. Self-removes when
// the immersion frame is no longer in the DOM (page navigated away).
function flavorsKeyHandler(e) {
  const frame = document.querySelector('.flavors-frame[data-mode="immersion"]');
  if (!frame) {
    // Self-clean: nothing to handle. Tear down so we don't leak into
    // other pages' keyboard handling.
    document.removeEventListener('keydown', flavorsKeyHandler);
    flavorsPageHandlersWired._keyBound = false;
    return;
  }
  // Don't fight an open modal / dialog / contenteditable.
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
  // Find the book + flavor list. The frame carries the book id.
  const book = findFlavorsBook(frame.dataset.bookId);
  if (!book) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    exitFlavorImmersion(book);
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
    // Right / Down / D — walk to the next flavor. WASD-style D supports
    // the right-hand-on-mouse, left-hand-on-keyboard learner.
    e.preventDefault();
    walkFlavor(book, +1);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A') {
    // Left / Up / A — walk to the previous flavor.
    e.preventDefault();
    walkFlavor(book, -1);
  } else if (e.key === ' ' || e.key === 'Enter') {
    // Space / Enter plays the current flavor's audio. Native TTS
    // through the same [data-speak] route the audio button uses.
    const flavor = book.flavors.find(f => f.id === APP.flavorId);
    if (!flavor || !window.speechSynthesis) return;
    e.preventDefault();
    // Reuse the global [data-speak] delegate: synthesise a click on
    // the immersion-audio button. Simpler than calling into the TTS
    // helper directly and keeps one code path.
    const audioBtn = frame.querySelector('.flavor-immersion-audio[data-speak]');
    if (audioBtn) audioBtn.click();
  }
}

// Locate the book in VOCAB_CLASSES by id. Used by the keyboard handler
// since it doesn't carry a closure reference to the book.
function findFlavorsBook(bookId) {
  for (const cls of (window.VOCAB_CLASSES || [])) {
    const b = (cls.books || []).find(b => b.id === bookId && b.isFlavorsPage);
    if (b) return b;
  }
  return null;
}

// Standalone example items for the flavor immersion "foods" row.
// These are visual examples that don't live in the edibles database —
// either because they don't fit any category cleanly (rotten food
// isn't a "dairy", "fruit", etc. — it's the spoiled-form of any of
// them), or because adding them as real edibles would pollute the
// grid. Image files live at images/vocab/<id>.png and are referenced
// by image-slot like the rest. Rendered as non-clickable cards (no
// detail spread to navigate to).
const FLAVOR_EXAMPLES = {
  mazui: [
    { id: 'kusatta-tamago',    verb: 'kusatta',  verbKana: 'くさった', nounKana: 'たまご' },
    { id: 'kusatta-gyuunyuu',  verb: 'kusatta',  verbKana: 'くさった', nounKana: 'ぎゅうにゅう' },
    { id: 'kabita-pan',        verb: 'kabita',   verbKana: 'カビた',   nounKana: 'パン' },
    { id: 'kabita-ichigo',     verb: 'kabita',   verbKana: 'カビた',   nounKana: 'いちご' },
    { id: 'kusatta-banana',    verb: 'kusatta',  verbKana: 'くさった', nounKana: 'バナナ' },
    { id: 'kusatta-sakana',    verb: 'kusatta',  verbKana: 'くさった', nounKana: 'さかな' },
    { id: 'kusatta-yooguruto', verb: 'kusatta',  verbKana: 'くさった', nounKana: 'ヨーグルト' },
    { id: 'kabita-onigiri',    verb: 'kabita',   verbKana: 'カビた',   nounKana: 'おにぎり' },
    { id: 'shioreta-retasu',   verb: 'shioreta', verbKana: 'しおれた', nounKana: 'レタス' },
    { id: 'kabita-chiizu',     verb: 'kabita',   verbKana: 'カビた',   nounKana: 'チーズ' },
  ],
  tsumetai: [
    { id: 'zaru-soba',      kana: 'ざるそば' },
    { id: 'hiyashi-chuuka', kana: '冷やし中華' },
    { id: 'hiyayakko',      kana: '冷奴' },
  ],
  atsui: [
    { id: 'misoshiru',   kana: 'みそしる' },
    { id: 'nabe',        kana: 'なべ' },
    { id: 'oden',        kana: 'おでん' },
    { id: 'nikuman',     kana: 'にくまん' },
    { id: 'chawanmushi', kana: 'ちゃわんむし' },
  ],
  karai: [
    { id: 'tougarashi', kana: 'とうがらし' },
    { id: 'shishitou',  kana: 'ししとう' },
  ],
  // Industrial snacks — removed from the edibles category (they didn't
  // fit the traditional-sweets framing of kashi) but still useful as
  // visual examples of the shoppai (salty) flavor world. These render
  // alongside the carrier-based shoppai cards (onigiri, ham, bacon,
  // sausage) on the shoppai immersion view.
  shoppai: [
    { id: 'poppukoon',       kana: 'ポップコーン' },
    { id: 'furaido-poteto',  kana: 'フライドポテト' },
    { id: 'poteto-chippusu', kana: 'ポテトチップス' },
    { id: 'piinattsu',       kana: 'ピーナッツ' },
  ],
};
function findFlavorExamples(flavorId) {
  return FLAVOR_EXAMPLES[flavorId] || [];
}

// Verb-grammar notes shown beneath the FLAVOR_EXAMPLES row. The mazui
// world is built on three "this food has gone bad" verbs in past-tense
// adjectival form — kusatta / kabita / shioreta — each pairing with a
// distinct kind of food. Surfacing the distinction below the example
// cards turns the row from a vocabulary list into a small mini-grammar
// lesson: the learner sees that kabita pairs with bread, not banana,
// and the example cards above visually anchor that pairing.
//
// Color tokens match the .example-verb tints baked into the cards —
// so the chip in the explanation reads as the same word the learner
// just saw labeled on the picture.
const FLAVOR_VERB_NOTES = {
  mazui: {
    intro: 'Three "this food has gone bad" verbs — pick by what kind of food it is.',
    verbs: [
      { verb: 'kusatta',  kanji: '腐った',  kana: 'くさった',  romaji: 'kusatta',
        meaning: 'biologically spoiled — bacterial, smelly',
        pairs: 'proteins, dairy, fruit going off' },
      { verb: 'kabita',   kanji: 'カビた',  kana: 'カビた',    romaji: 'kabita',
        meaning: 'visibly moldy (fungal fuzz, spots)',
        pairs: 'bread, cheese, soft surfaces' },
      { verb: 'shioreta', kanji: '萎れた',  kana: 'しおれた',  romaji: 'shioreta',
        meaning: 'wilted — lost rigidity, drooped',
        pairs: 'leafy greens and herbs' },
    ],
  },
};
function findFlavorVerbNotes(flavorId) {
  return FLAVOR_VERB_NOTES[flavorId] || null;
}

// Walk every edibles book in VOCAB_CLASSES and return all items whose
// flavors[] array includes the given flavorId. Used by the flavors
// immersion view to populate the "foods that carry this flavor"
// reverse-browse row. Returns [{ item, cat, book }] so the click
// handler can navigate to that edible's detail view.
//
// Limit defaults to 100 — effectively uncapped against the current
// edibles set (~95 total items). A previous 12-item cap was clipping
// popular flavors silently: 'oishii' had 52 carriers but only the
// first 12 (kudamono + yasai + 4 of niku) ever rendered; everything
// in kokumotsu (onigiri, mochi, nattou…), nyuuseihin, and kashi was
// invisible. The clip wasn't categorical — it was the linear walk
// order hitting the cap before later categories. Raising the ceiling
// to 100 ensures any new edibles item with a flavor tag surfaces on
// its flavor's immersion view automatically, no matter which
// category it sits in.
//
// If the total ever climbs past 100, raise the constant — but the
// row layout (grid auto-fill) gracefully wraps to multiple rows, so
// the only downside of more matches is more vertical scroll.
// Single iterator over every edible row across all edibles books, yielding
// { item, cat, book } in book→category→item order. Return `false` from `fn` to
// stop early. Replaces four hand-copied 4-deep VOCAB_CLASSES walks.
function eachEdible(fn) {
  for (const cls of (window.VOCAB_CLASSES || [])) {
    for (const book of (cls.books || [])) {
      if (!book.isEdiblesPage) continue;
      for (const cat of (book.categories || [])) {
        for (const item of (cat.items || [])) {
          if (fn({ item, cat, book }) === false) return;
        }
      }
    }
  }
}

function findEdiblesWithFlavor(flavorId, limit = 100) {
  const results = [];
  eachEdible(row => {
    if ((row.item.flavors || []).includes(flavorId)) {
      results.push(row);
      if (results.length >= limit) return false;
    }
  });
  return results;
}

// Mirror of findEdiblesWithFlavor for the texture cross-link. Walks
// edibles by their textures[] array (kana strings like 'もちもち',
// 'シャキシャキ'). Used by the texture immersion view to render its
// right-column food collage AND by the texture-cards-on-edible-detail
// to verify a back-link target exists. Defaults to 100; current
// edibles set is ~95 items so the cap is effectively uncapped.
function findEdiblesWithTexture(textureKana, limit = 100) {
  const results = [];
  eachEdible(row => {
    if ((row.item.textures || []).includes(textureKana)) {
      results.push(row);
      if (results.length >= limit) return false;
    }
  });
  return results;
}

// Look up the edible row from an id list (the foodPool array on each
// texture). Returns [{ item, cat, book }] in pool-order, dropping
// missing ids silently. Used by the texture immersion's right-column
// collage when the brief locks a curated food-pool per texture rather
// than walking the whole edibles set.
function lookupEdiblesByIds(ids) {
  if (!Array.isArray(ids) || !ids.length) return [];
  const index = new Map();
  eachEdible(row => { index.set(row.item.id, row); });
  return ids.map(id => index.get(id)).filter(Boolean);
}

// ── Textures page (Phase 2 of the Flavors & Textures sub-system) ─────
// Brief: docs/superpowers/specs/2026-05-26-flavors-textures.PRODUCT.md §7.2.
// Three deliberate departures from the Flavors-page pattern:
//   1. NO single canonical food per texture. The right-column collage
//      surfaces 4-8 example foods from the texture's foodPool.
//   2. The bento card carries an INK MOTION-LINE GLYPH, not a food
//      image. The texture IS its brushstroke.
//   3. Color is a WHISPER (~92%+ lightness paper-tint), not a flood.
//
// Same engine as flavorsPageHTML: bento (10 cards) → drill-in immersion.
// Different visual signature, same navigation contract.

// Inline SVG motion-line glyph generator. Each texture gets a
// 100×60 viewBox brushed stroke that visually IS the texture. Shapes
// are hand-tuned per the motionShape field — soft sine for もちもち,
// sawtooth for さくさく, sagging arc with drip for とろとろ, etc.
// All strokes use the ink color (var(--ink)), 4px width with rounded
// caps, intentionally hand-drawn rather than geometric-perfect.
function textureMotionLineSVG(motionShape) {
  // 100×60 viewBox; the path's y=30 is the visual baseline.
  const shapes = {
    'soft-bounce':     'M5,30 Q15,12 25,30 T45,30 T65,30 T85,30 T95,30',
    'crisp-angular':   'M5,40 L18,12 L24,40 L37,12 L43,40 L56,12 L62,40 L75,12 L81,40 L94,12 L99,40',
    'wet-drag':        'M5,20 Q20,38 35,20 Q50,2 65,28 Q75,40 85,32 L85,46 M70,30 L70,42 M50,28 L50,40',
    'sharp-thin':      'M5,40 L5,20 L18,20 L18,40 L31,40 L31,20 L44,20 L44,40 L57,40 L57,20 L70,20 L70,40 L83,40 L83,20 L95,20',
    'smooth-flow':     'M3,30 Q12,27 22,30 T42,30 T62,30 T82,30 T97,30',
    'airy-cloud':      'M8,42 Q12,18 22,28 Q30,12 42,28 Q52,14 62,28 Q72,16 82,28 Q92,18 95,42',
    'thick-melt':      'M5,18 Q25,18 45,30 Q65,42 75,38 L75,52 Q73,55 75,55 Q77,55 75,52 L75,38 Q85,36 95,42',
    'vegetal-snap':    'M10,12 L10,48 M22,12 L22,48 M34,12 L34,48 M46,12 L46,48 M58,12 L58,48 M70,12 L70,48 M82,12 L82,48 M94,12 L94,48',
    'plump-bounce':    'M5,30 Q12,12 22,30 Q32,48 42,30 Q52,12 62,30 Q72,48 82,30 Q92,12 99,30',
    'hard-crunch':     'M5,32 L15,18 L20,42 L30,16 L36,38 L44,22 L52,44 L60,18 L68,40 L76,16 L84,42 L92,20 L98,38',
  };
  const d = shapes[motionShape] || shapes['soft-bounce'];
  return `
    <svg class="texture-motion-line" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d="${d}" fill="none" stroke="currentColor" stroke-width="3.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

// Inline ink-on-paper icons for the MOOD chips. Hand-tuned tiny SVGs;
// stroke="currentColor" so they inherit the chip's ink color. No
// emojis (project hard rule). Keys map to the `moods[].icon` field.
function textureMoodIconSVG(key) {
  const icons = {
    cup:       '<path d="M5 10h11v6a3 3 0 01-3 3H8a3 3 0 01-3-3v-6z"/><path d="M16 12h2a2 2 0 010 4h-2"/><path d="M8 4c.4 1 0 1.8-.4 2.4-.4.6-.4 1.1 0 1.6"/><path d="M11 4c.4 1 0 1.8-.4 2.4-.4.6-.4 1.1 0 1.6"/>',
    heart:     '<path d="M12 19s-7-4.3-7-9.3a3.7 3.7 0 016.5-2.4 3.7 3.7 0 016.5 2.4c0 5-7 9.3-7 9.3z"/>',
    gift:      '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M2 9h20"/><path d="M12 9v11"/><path d="M12 9c-1-3-5-3-5-1s2 1 5 1z"/><path d="M12 9c1-3 5-3 5-1s-2 1-5 1z"/>',
    sakura:    '<circle cx="12" cy="12" r="1.5"/><path d="M12 6c1.4 1.5 1.4 3.5 0 5"/><path d="M12 18c-1.4-1.5-1.4-3.5 0-5"/><path d="M6 12c1.5-1.4 3.5-1.4 5 0"/><path d="M18 12c-1.5 1.4-3.5 1.4-5 0"/><path d="M8.2 8.2c1.6.3 2.7 1.4 3 3"/><path d="M15.8 15.8c-1.6-.3-2.7-1.4-3-3"/><path d="M8.2 15.8c.3-1.6 1.4-2.7 3-3"/><path d="M15.8 8.2c-.3 1.6-1.4 2.7-3 3"/>',
    sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 3v2"/><path d="M12 19v2"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M5.6 5.6l1.4 1.4"/><path d="M17 17l1.4 1.4"/><path d="M5.6 18.4L7 17"/><path d="M17 7l1.4-1.4"/>',
    leaf:      '<path d="M5 19c0-9 6-15 15-15 0 9-6 15-15 15z"/><path d="M5 19c5-5 9-9 14-14"/>',
    drop:      '<path d="M12 3c-3 5-6 8-6 12a6 6 0 0012 0c0-4-3-7-6-12z"/>',
    spark:     '<path d="M12 4l1.7 5L19 11l-5.3 2L12 18l-1.7-5L5 11l5.3-2L12 4z"/>',
    sparkbig:  '<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7z"/>',
  };
  const inner = icons[key] || icons.spark;
  return `<svg class="mood-icon" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.6"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// Generic speaker-SVG used by audio buttons across the textures page.
function textureSpeakerSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 010 14.14"/>
            <path d="M15.54 8.46a5 5 0 010 7.07"/>
          </svg>`;
}

// Spectrum-tile kana formatter. Tiles are narrow (one-tenth the row
// width on desktop) so a 6-character kana like シャキシャキ has to
// stack to stay legible. Splitting at the half mark keeps the stack
// symmetric (シャキ / シャキ) instead of an awkward 4+2 wrap that the
// browser would default to.
function formatSpectrumKana(kana) {
  if (typeof kana !== 'string') return '';
  if (kana.length === 6) {
    return escHTML(kana.slice(0, 3)) + '<br>' + escHTML(kana.slice(3));
  }
  return escHTML(kana);
}

// Resolve an edible id → its image src for use in the spectrum tile.
// Two storage conventions coexist in the project: vocab items live
// under images/vocab/<id>.webp, and FOOD_GALLERY / menu dishes (the
// ones whose ids carry a 'dish-' prefix) live under images/food/.
// Direct <img src=...> probe — the image-slot probe chain isn't in
// play here because we deliberately use a plain <img> for the spectrum
// tiles so they can `display:none` themselves on error without
// disturbing the layout.
function textureStapleImgSrc(id) {
  if (!id) return '';
  if (id.startsWith('dish-')) return `images/food/${id}.webp`;
  return vocabImgSrc(id);
}

// Food-art path resolver for plain <img> tags. Food illustrations now live
// under images/vocab/food/<id>; a handful of dual-purpose covers + room
// sheets (sushi, ramen, *-sheet-*, …) stayed flat in images/vocab/. So point
// the img at the food/ subfolder and fall back to the flat path on error.
// Mirrors the food/→vocab/ fallback baked into <image-slot>'s probe, so a
// food reference resolves whether the file moved or stayed flat.
//   - id        → images/vocab/food/<id>.webp
//   - file.ext  → images/vocab/food/<file.ext>
function vocabImgSrc(idOrFile) {
  if (!idOrFile) return '';
  const file = /\.[a-z0-9]+$/i.test(idOrFile) ? idOrFile : idOrFile + '.webp';
  return `images/vocab/food/${file}`;
}
// Inline onerror for the imgs above. No-op for non-food srcs (the replace
// only fires when '/vocab/food/' is present), so it's safe to attach to any
// vocab/food/ img tag.
const VOCAB_IMG_ONERROR =
  "if(this.src.indexOf('/vocab/food/')>-1){this.onerror=null;this.src=this.src.replace('/vocab/food/','/vocab/');}";
// Same fallback, but for imgs that should hide themselves if BOTH the food/
// and the flat path miss (texture-page example/neighbour tiles).
const VOCAB_IMG_ONERROR_HIDE =
  "if(this.src.indexOf('/vocab/food/')>-1){this.src=this.src.replace('/vocab/food/','/vocab/');}else{this.style.display='none';}";

// Phase 2.2 — single scrollable page (no bento mode).
// Sections, top-to-bottom:
//   1. Header (eyebrow + title + intro)
//   2. Spectrum row (soft → hard, all 10 textures w/ staple food tile;
//      each tile carries its brushstroke glyph so the bento layer is
//      no longer needed)
//   3. Spotlight (selected texture: image + brushstroke under it,
//      kana, feelsLike, examples, mood, paragraph description)
//   4. Food collage (foodPool grid — more foods that share this texture)
//   5. English drawer (collapsed gloss + cultural note)
function texturesPageHTML(book) {
  const textures = book.textures || [];
  // Default-select first texture by softness if nothing chosen yet.
  let currentTex = APP.textureId && textures.find(t => t.id === APP.textureId);
  if (!currentTex && textures.length) {
    const sorted = [...textures].sort((a, b) => (a.softness || 5) - (b.softness || 5));
    currentTex = sorted[0];
  }
  if (!currentTex) {
    return `<div class="empty-state">No textures registered.</div>`;
  }

  // ── 1. Header ─────────────────────────────────────────────────
  const headerHTML = `
    <header class="textures-page-head">
      <div class="textures-page-eyebrow">textures · 食感</div>
      <h1 class="textures-page-title">
        <ruby>食感<rt>しょっかん</rt></ruby>の <ruby>世界<rt>せかい</rt></ruby>
      </h1>
      <p class="textures-page-sub">
        Each texture is a brushstroke that IS the feel — soft sine for
        もちもち, sharp sawtooth for さくさく. Tap a card to enter that
        texture's world.
      </p>
    </header>`;

  // ── 2. Spectrum (soft → hard) ─────────────────────────────────
  const spectrumOrder = [...textures].sort((a, b) => (a.softness || 5) - (b.softness || 5));
  const spectrumHTML = `
    <section class="textures-spectrum" aria-label="Texture spectrum from soft to hard">
      <div class="textures-spectrum-row">
        <span class="spectrum-edge spectrum-edge-soft">
          <span class="spectrum-edge-ja">やわらかい</span>
          <span class="spectrum-edge-kanji">柔らかい</span>
        </span>
        <div class="spectrum-mid">
          <ul class="textures-spectrum-tiles" role="list">
            ${spectrumOrder.map(t => `
              <li class="textures-spectrum-tile-wrap">
                <button class="textures-spectrum-tile ${t.id === currentTex.id ? 'is-active' : ''}"
                        data-spectrum-texture="${escAttr(t.id)}"
                        style="--tint:${escAttr(t.tint)};"
                        type="button"
                        aria-label="${escAttr(t.kana + ' — ' + t.en)}">
                  <span class="spectrum-tile-image">
                    <img src="${escAttr(textureStapleImgSrc(t.staple))}"
                         alt="" loading="lazy"
                         onerror="this.style.display='none'" />
                  </span>
                  <span class="spectrum-tile-glyph">${textureMotionLineSVG(t.motionShape)}</span>
                  <span class="spectrum-tile-kana">${formatSpectrumKana(t.kana)}</span>
                </button>
              </li>
            `).join('')}
          </ul>
          <div class="textures-spectrum-line" aria-hidden="true">
            ${spectrumOrder.map(t => `
              <span class="spectrum-line-dot ${t.id === currentTex.id ? 'is-active' : ''}"
                    style="--tint:${escAttr(t.tint)};"></span>
            `).join('')}
          </div>
        </div>
        <span class="spectrum-edge spectrum-edge-hard">
          <span class="spectrum-edge-ja">かたい</span>
          <span class="spectrum-edge-kanji">硬い</span>
        </span>
      </div>
    </section>`;

  // ── 3. Spotlight (selected texture) ───────────────────────────
  const spotlightHTML = renderTextureSpotlight(currentTex);

  // The standalone collage section was removed in this iteration —
  // the bottom-of-card examples row inside the spotlight now carries
  // the food browsing job, so a second grid below the card became
  // redundant.

  // ── 4. Extra textures explainer (non-canonical) ──────────────
  const extrasHTML = renderExtraTexturesSection();

  // ── 5. English & notes drawer ─────────────────────────────────
  const drawerHTML = `
    <details class="texture-drawer">
      <summary class="texture-drawer-toggle">English &amp; cultural notes</summary>
      <div class="texture-drawer-body">
        <p class="en-gloss">${escHTML(currentTex.en)}</p>
        <p class="notes">${escHTML(currentTex.notes || '')}</p>
      </div>
    </details>`;

  return `
    <div class="textures-page" tabindex="-1"
         style="--tint:${escAttr(currentTex.tint)};">
      ${headerHTML}
      ${spectrumHTML}
      ${spotlightHTML}
      ${drawerHTML}
      ${extrasHTML}
      <p class="texture-keys-hint">space hears the word · ← → walks the spectrum</p>
    </div>`;
}

// ── Extra textures explainer ───────────────────────────────────
// The 8 non-canonical texture descriptors that don't have their own
// immersion page get a quiet zig-zag explainer at the foot of the
// textures page. Each row is image-on-one-side, JP-first text on the
// other, with the side alternating row-by-row. Supporting cast tone:
// no audio, no big hero, no patterned background — just paper, a
// watercolor icon, and a short JP sentence with EN translation.
//
// Each entry carries its kana headword, the kanji form (with rt
// reading) when one exists, a simple JP sentence describing what the
// texture feels like, the EN translation, and 4-6 example food ids
// pulled from the edibles database.
// Each extra-texture row picks the closest canonical texture from the
// spectrum to use as its repeating background tile (images/bg/textures/
// <id>.webp), plus a soft solid tint behind that tile. The combination
// is rendered at ~30% opacity so the row stays readable while gaining
// a sense of "what world does this texture live in."
//
//   bgTexture — canonical texture id; null means no tile (solid only)
//   bgTint    — hex/rgba color for the solid behind the tile
//   bgOpacity — 0..1 layer opacity (default 0.32)
//
// つるつる is an explicit exception — the user asked for it to read as
// "light" (off-white / beige / yellowish), so it skips the texture
// tile and uses a pale cream solid instead.
const EXTRA_TEXTURE_EXPLAINERS = [
  { kana:'やわらかい', kanji:'柔らかい', kanjiRt:'やわ',
    icon:'yawarakai',
    bgTexture:'fuwafuwa', bgTint:'#F4DDD4', bgOpacity:0.38,
    ja:'やわらかい ものは、おしたら すぐ かたちが かわります。',
    en:'Soft things change shape easily when pressed.',
    examples:['shokupan','jagaimo','hourensou','toofu','hanbaagaa'] },
  { kana:'なめらか', kanji:'滑らか', kanjiRt:'なめ',
    icon:'nameraka',
    bgTexture:'sarasara', bgTint:'#DDE5E8', bgOpacity:0.42,
    ja:'なめらかは、ざらざらしない、つるっとした かんじです。',
    en:'Nameraka is the feeling of no roughness — clean and gliding.',
    examples:['purin','wasabi','toofu','namakuriimu','yooguruto'] },
  { kana:'つるつる',
    icon:'tsurutsuru',
    bgTexture:null, bgTint:'#F6EFD9', bgOpacity:0.55,
    ja:'つるつるは、すべるような、なめらかな かんじです。うどんを つるつると すすります。',
    en:'Tsurutsuru is a slippery, sliding feel — we slurp udon and ramen this way.',
    examples:['udon','soba','raamen','wakame'] },
  { kana:'ぷるぷる',
    icon:'purupuru',
    bgTexture:'mochimochi', bgTint:'#F2D6D5', bgOpacity:0.38,
    ja:'ぷるぷるは、ゆれる、やわらかい かんじです。ゼリーや 豆腐が ぷるぷるです。',
    en:'Purupuru is the wobbly, jiggly feel — jelly and tofu are purupuru.',
    examples:['purin','toofu','warabimochi'] },
  { kana:'プチプチ',
    icon:'puchipuchi',
    bgTexture:'puripuri', bgTint:'#F4C7AA', bgOpacity:0.34,
    ja:'プチプチは、ちいさい つぶが はじける かんじです。いくらや なっとうが プチプチです。',
    en:'Puchipuchi is tiny grains bursting — salmon roe and natto are puchipuchi.',
    examples:['nattou','mikan','orenji','buruuberii','kiwi'] },
  { kana:'シャリシャリ',
    icon:'sharishari',
    bgTexture:'sakusaku', bgTint:'#EFE2A8', bgOpacity:0.36,
    ja:'シャリシャリは、こおりや ざらざらした かんじです。かき氷や なしが シャリシャリです。',
    en:'Sharishari is icy and granular — shaved ice and Japanese pear are sharishari.',
    examples:['kakigoori','nashi','genmai','suika'] },
  { kana:'クリーミー',
    icon:'kuriimii',
    bgTexture:'torotoro', bgTint:'#F8EBC4', bgOpacity:0.42,
    ja:'クリーミーは、こくがあって、なめらかな かんじです。バターや 生クリームが クリーミーです。',
    en:'Creamy is rich and smooth — butter and whipped cream are creamy.',
    examples:['gyuunyuu','namakuriimu','aisukuriimu','bataa','chiizu','maccha'] },
  { kana:'ジューシー',
    icon:'juushii',
    bgTexture:'puripuri', bgTint:'#F2B9A3', bgOpacity:0.34,
    ja:'ジューシーは、かむと しるが あふれる かんじです。りんごや ももが ジューシーです。',
    en:'Juicy is when liquid overflows on bite — apples and peaches are juicy.',
    examples:['ringo','momo','meron','suika','tomato','sakuranbo'] },
];

function renderExtraTexturesSection() {
  // Walk every edibles book once to build an id → item map so the
  // example-pill row can resolve kana labels without a per-row
  // re-walk. Quiet failure mode: a stale example id silently drops
  // out of the rendered row (no slot reserved).
  const ediblesIndex = new Map();
  eachEdible(row => ediblesIndex.set(row.item.id, row.item));

  const rowsHTML = EXTRA_TEXTURE_EXPLAINERS.map((ex, i) => {
    // Kanji block: ruby with rt furigana when a kanji exists; just
    // the kana headword when it's a katakana loanword (ジューシー)
    // or a pure-kana onomatopoeia (つるつる, ぷるぷる, etc.).
    const headWordHTML = ex.kanji
      ? `<ruby>${escHTML(ex.kanji)}<rt>${escHTML(ex.kanjiRt || '')}</rt></ruby>`
      : escHTML(ex.kana);
    // No kana subtitle: when the headword is kanji, its <rt> furigana
    // already spells the reading (柔らかい → やわ), so a separate
    // やわらかい / なめらか line just repeats it. Pure-kana words never
    // had one. (subtitle removed per the no-redundant-kana rule.)
    const examplesHTML = (ex.examples || []).map(id => {
      const item = ediblesIndex.get(id);
      if (!item) return '';
      return `
        <span class="extra-texture-example">
          <img class="extra-texture-example-img"
               src="${escAttr(vocabImgSrc(id))}"
               alt=""
               aria-hidden="true"
               loading="lazy"
               onerror="${escAttr(VOCAB_IMG_ONERROR_HIDE)}">
          <span class="extra-texture-example-kana">${escHTML(item.kana)}</span>
        </span>`;
    }).join('');
    // Per-row background style. The colored band sits behind the row
    // and breaks out to fill the .main column (see .extra-texture-row::before
    // in CSS). bgTexture is the canonical texture id whose tile we
    // reuse as a repeating pattern; bgTint is a solid color underneath.
    // つるつる uses bgTexture:null to opt out of the tile for a clean
    // light-only band.
    const bgImgUrl = ex.bgTexture ? `images/bg/textures/${ex.bgTexture}.webp` : null;
    const rowStyle = [
      ex.bgTint     ? `--row-tint:${escAttr(ex.bgTint)}` : null,
      bgImgUrl      ? `--row-bg-image:url('${escAttr(bgImgUrl)}')` : null,
      ex.bgOpacity != null ? `--row-bg-opacity:${escAttr(String(ex.bgOpacity))}` : null,
    ].filter(Boolean).join(';');
    return `
      <article class="extra-texture-row ${i % 2 === 1 ? 'is-flipped' : ''}${ex.bgTexture || ex.bgTint ? ' has-bg' : ''}"
               ${rowStyle ? `style="${rowStyle};"` : ''}>
        <div class="extra-texture-row-image">
          <img src="images/bg/texture-icons/${escAttr(ex.icon)}.webp"
               alt=""
               aria-hidden="true"
               loading="lazy">
        </div>
        <div class="extra-texture-row-body">
          <h3 class="extra-texture-row-head">
            <span class="extra-texture-row-head-word">${headWordHTML}</span>
            <button class="extra-texture-row-audio"
                    data-speak="${escAttr(ex.kana)}"
                    type="button"
                    aria-label="Hear ${escAttr(ex.kana)} pronounced">
              ${textureSpeakerSVG()}
            </button>
          </h3>
          <p class="extra-texture-row-ja" lang="ja">${escHTML(ex.ja)}</p>
          <p class="extra-texture-row-en">${escHTML(ex.en)}</p>
          ${examplesHTML ? `
            <div class="extra-texture-row-examples">
              ${examplesHTML}
            </div>
          ` : ''}
        </div>
      </article>`;
  }).join('');

  return `
    <section class="textures-extras" aria-label="Other texture descriptors">
      <header class="textures-section-head">
        <h2 class="section-title">
          <ruby>他<rt>ほか</rt></ruby>の <ruby>食感<rt>しょっかん</rt></ruby>
        </h2>
        <p class="section-sub">
          スペクトラムに のっていない、よく つかう 食感の ことば。<br>
          <span class="section-sub-en">Other texture descriptors that didn't make the spectrum — useful supporting vocabulary.</span>
        </p>
      </header>
      <div class="textures-extras-list">
        ${rowsHTML}
      </div>
    </section>`;
}

function renderTextureSpotlight(texture) {
  // `spotlightStaple` lets a texture nominate a richer dish image for
  // the spotlight while keeping a cleaner single-ingredient anchor in
  // the spectrum tile. Currently used only by とろとろ (egg in the
  // spectrum, omurice in the spotlight).
  const stapleSrc = textureStapleImgSrc(texture.spotlightStaple || texture.staple);

  // Bottom-of-card examples row — 4-6 foods from the texture's pool,
  // rendered as image + name with no card chrome (per editorial brief:
  // photo on paper, no UI box). NON-INTERACTIVE — these are reference
  // examples, not links. Plain <div> wrappers, no click handler, no
  // cursor:pointer, no aria-label naming an action. Hover lift is
  // kept as a subtle paper-on-paper effect, not as an affordance.
  // Images that 404 hide their entire item via onerror so a stray
  // missing asset doesn't leave a ghost slot.
  const examplePool = lookupEdiblesByIds((texture.foodPool || []).slice(0, 6));
  const examplesRowHTML = examplePool.length ? `
    <div class="textures-spotlight-examples">
      ${examplePool.map(({ item }) => `
        <div class="spotlight-example-item">
          <span class="spotlight-example-image">
            <img src="${escAttr(textureStapleImgSrc(item.id))}"
                 alt="" loading="lazy"
                 onerror="this.closest('.spotlight-example-item').style.display='none'" />
          </span>
          <span class="spotlight-example-name">${escHTML(item.kana)}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Each texture ships a tileable watercolor pattern as a card
  // background — mochi rounds for もちもち, zigzag crumbs for カリカリ,
  // etc. The renderer hands the file URL through a CSS variable so
  // the per-texture pattern swaps in alongside the tint. CSS layers
  // a translucent paper veil over the pattern so the kana + body
  // copy stay readable.
  const patternUrl = `images/bg/textures/${texture.id}.webp`;

  return `
    <section class="textures-spotlight" aria-label="Spotlight on ${escAttr(texture.kana)}"
             style="--tint:${escAttr(texture.tint)}; --spotlight-pattern:url('${escAttr(patternUrl)}');">
      <div class="textures-spotlight-body">
        <div class="textures-spotlight-imagecol">
          <div class="textures-spotlight-image">
            ${stapleSrc ? `<img src="${escAttr(stapleSrc)}" alt="${escAttr(texture.kana)}" loading="eager"
                                onerror="this.style.display='none'" />` : ''}
          </div>
          <div class="textures-spotlight-glyph" aria-hidden="true">
            ${textureMotionLineSVG(texture.motionShape)}
          </div>
        </div>
        <div class="textures-spotlight-info">
          <h3 class="spotlight-kana">${escHTML(texture.kana)}</h3>
          <p class="spotlight-romaji">${escHTML(texture.romaji)}</p>
          <button class="textures-spotlight-audio"
                  data-speak="${escAttr(texture.kana)}"
                  aria-label="Hear ${escAttr(texture.kana)} pronunciation"
                  type="button">
            ${textureSpeakerSVG()}
          </button>
          <p class="spotlight-description" lang="ja">${escHTML(texture.notesJa || texture.notes || '')}</p>
        </div>
      </div>
      ${examplesRowHTML}
    </section>`;
}

// ── State transitions for textures ──
// No more bento↔immersion split — there's only one page. switchTexture
// updates the spotlight in place. enterTextureImmersion / exit are
// dead but kept as no-ops for any external callers.
function switchTexture(book, textureId) {
  if (APP.textureId === textureId) return;
  APP.textureId = textureId;
  lsSet('jp:textureId', textureId);
  rerenderTexturesPage(book);
  // No scroll-to-anchor. On desktop the bento + spectrum + spotlight
  // all coexist on a single tall surface; jumping the viewport every
  // click is disorienting. The active-state highlights on the bento
  // card and spectrum tile carry the focus signal instead.
}
function enterTextureImmersion(book, textureId) { switchTexture(book, textureId); }
function exitTextureImmersion(book) { /* no-op — no bento to return to */ }

function walkTexture(book, direction) {
  const textures = [...(book.textures || [])].sort((a, b) => (a.softness || 5) - (b.softness || 5));
  const idx = textures.findIndex(t => t.id === APP.textureId);
  if (idx < 0) return;
  const next = textures[(idx + direction + textures.length) % textures.length];
  switchTexture(book, next.id);
}

function rerenderTexturesPage(book) {
  const el = document.getElementById('vocab-page-content');
  if (!el) return;
  el.innerHTML = texturesPageHTML(book);
  wireTexturesPageHandlers(book);
  const page = el.querySelector('.textures-page');
  if (page) page.focus({ preventScroll: true });
}

function wireTexturesPageHandlers(book) {
  const root = document.getElementById('vocab-page-content');
  if (!root) return;

  // Spectrum tile click → switch texture (updates spotlight in place)
  root.querySelectorAll('[data-spectrum-texture]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTexture(book, btn.dataset.spectrumTexture);
    });
  });

  // The [data-texture-to-edible] click handler was removed in this
  // iteration: the collage section is gone, and the spotlight
  // examples row no longer carries the attribute (the examples are
  // now non-interactive reference cards, not links).

  // Audio buttons → speak the kana. NOTE: do NOT wire a click listener
  // here — the global document-level [data-speak] delegate (see
  // ~line 18372) already speaks on click. A second listener here made the
  // textures-page audio play twice (TTS.speak + speakJapanese on one click).
  // The delegate is the single source of truth for [data-speak] clicks.

  // Keyboard navigation: ← → walks spectrum (in softness order),
  // space speaks the current texture.
  const page = root.querySelector('.textures-page');
  if (page) {
    page.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')       { e.preventDefault(); walkTexture(book, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); walkTexture(book, +1); }
      else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        const tex = (book.textures || []).find(t => t.id === APP.textureId);
        if (tex && typeof speakJapanese === 'function') speakJapanese(tex.kana);
      }
    });
  }

  // ── Page-entry choreography ──
  // Editorial register: slow, deliberate, ink-settling. The spectrum
  // line draws across left → right, tiles fade in as it passes, the
  // spotlight glyph presses down onto paper, paragraphs lift one at a
  // time with hairline rules drawing in beneath the headings. Total
  // window ~2.6s — longer than product surfaces because the user is
  // here to read, not to scan.
  //
  // Like the other entrances, fires once per sidebar entry and skips
  // for reduced-motion + internal swaps (texture rail click).
  if (page && window.__bookEntranceFlag === book.id) {
    window.__bookEntranceFlag = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      void page.offsetWidth;
      page.classList.add('is-entering-textures');
      // Per-tile stagger index for the spectrum row (the renderer
      // doesn't carry an --enter-i, so set it here once at mount).
      page.querySelectorAll('.textures-spectrum-tile-wrap').forEach((el, i) => {
        el.style.setProperty('--enter-i', i);
      });
      // Per-row stagger for the extras zig-zag rows below.
      page.querySelectorAll('.extra-texture-row').forEach((el, i) => {
        el.style.setProperty('--enter-i', i);
      });
      setTimeout(() => page.classList.remove('is-entering-textures'), 2800);
    }
  }
}

// ── State transitions ──
// All three (enter / exit / switch) go through the same cross-fade
// helper so the transition is uniform regardless of trigger (click vs
// arrow vs rail thumb).
// Shared rapid-click guard for the three flavor transition functions.
// A click while a transition is already mid-flight would queue a
// second rerenderFlavorsPage and stack a second .is-entering setTimeout
// on top of the first — visually you'd see a stutter or a class-removal
// firing on the wrong frame. Setting the flag at function entry and
// clearing it at the end of the longest setTimeout chain blocks the
// second click cleanly. Per-target same-id guards stay in place
// (`APP.flavorId === flavorId` etc.) — this only blocks DIFFERENT-target
// rapid clicks.
// Self-healing animation lock. The flavors/edibles two-phase transitions set
// their flag on entry and clear it when the entrance animation completes. If
// the mid-transition rerender throws (bad data) — or the user navigates away
// before the inner timeout fires — the flag could otherwise stay set forever,
// and since every transition early-returns while it's set, ALL navigation
// would silently freeze. Storing Date.now() instead of `true` lets the guard
// treat a stale lock (older than the longest animation) as released, so
// navigation always recovers. A `false` clear stays falsy → animLocked(false)
// is false, so the success path is unchanged.
const ANIM_LOCK_MS = 3000; // > the longest transition (flavors entry ~2.2s)
function animLocked(stamp) {
  return !!stamp && (Date.now() - stamp) < ANIM_LOCK_MS;
}

// Shared two-phase enter/exit/switch choreography. Adds `outClass` to the
// current frame, waits `outMs`, runs `commit` (state mutation + persist) then
// `rerender`, force-reflows the new frame, adds `inClass`, and removes it after
// `inMs` — clearing the lock at the end (or immediately if the new frame is
// gone). Honors prefers-reduced-motion / no-frame with an instant commit, and
// the self-healing animation lock (window[flag]). Behavior is identical to the
// three hand-written copies it replaced; only the class names, delays, flag,
// frame selector, and commit body ever differed.
function twoPhaseSwap(opts, commit, rerender) {
  const { flag, frameSel, outClass, outMs, inClass, inMs } = opts;
  if (animLocked(window[flag])) return; // mid-transition
  const frame = document.querySelector(frameSel);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!frame || reduced) { commit(); rerender(); return; }
  window[flag] = Date.now();
  frame.classList.add(outClass);
  setTimeout(() => {
    commit();
    rerender();
    const next = document.querySelector(frameSel);
    if (next) {
      void next.offsetWidth; // force reflow so the entrance restarts from frame 0
      next.classList.add(inClass);
      setTimeout(() => {
        next.classList.remove(inClass);
        window[flag] = false;
      }, inMs);
    } else {
      window[flag] = false;
    }
  }, outMs);
}

// bento → immersion (is-leaving-bento 280ms → is-entering 2200ms)
function enterFlavorImmersion(book, flavorId) {
  if (APP.flavorId === flavorId) return; // already there
  twoPhaseSwap(
    { flag: '__flavorsAnimating', frameSel: '.flavors-frame', outClass: 'is-leaving-bento', outMs: 280, inClass: 'is-entering', inMs: 2200 },
    () => { APP.flavorId = flavorId; lsSet('jp:flavorId', flavorId); },
    () => rerenderFlavorsPage(book)
  );
}

// immersion → bento (is-leaving-immersion 500ms → is-entering-bento 1000ms)
function exitFlavorImmersion(book) {
  if (APP.flavorId == null) return;
  twoPhaseSwap(
    { flag: '__flavorsAnimating', frameSel: '.flavors-frame', outClass: 'is-leaving-immersion', outMs: 500, inClass: 'is-entering-bento', inMs: 1000 },
    () => { APP.flavorId = null; lsSet('jp:flavorId', null); },
    () => rerenderFlavorsPage(book)
  );
}

// within-immersion swap (is-switching-out 280ms → is-switching-in 900ms)
function switchFlavor(book, flavorId) {
  if (APP.flavorId === flavorId) return;
  twoPhaseSwap(
    { flag: '__flavorsAnimating', frameSel: '.flavors-frame', outClass: 'is-switching-out', outMs: 280, inClass: 'is-switching-in', inMs: 900 },
    () => { APP.flavorId = flavorId; lsSet('jp:flavorId', flavorId); },
    () => rerenderFlavorsPage(book)
  );
}

function walkFlavor(book, dir) {
  const flavors = book.flavors || [];
  const idx = flavors.findIndex(f => f.id === APP.flavorId);
  if (idx < 0) return;
  const next = flavors[(idx + dir + flavors.length) % flavors.length];
  switchFlavor(book, next.id);
}

// Cross-fade helper. Applies .is-fading-out to the frame, waits one
// transition cycle, runs the swap callback (which re-renders), then
// removes the class so the new content fades in. prefers-reduced-motion
// short-circuits to an instant swap (CSS overrides the transition).
function fadeFlavorsThen(swap) {
  const frame = document.querySelector('.flavors-frame');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!frame || reduced) {
    swap();
    return;
  }
  frame.classList.add('is-fading-out');
  setTimeout(() => {
    swap();
    // After re-render the .flavors-frame is a NEW element — the new
    // frame fades in via its own .opacity:1 default transition.
  }, 240);
}

// Re-render the flavors page in place by calling the existing renderer.
// Used after every state transition.
function rerenderFlavorsPage(book) {
  const pageEl = document.getElementById('vocab-page-content');
  if (!pageEl) return;
  pageEl.innerHTML = flavorsPageHTML(book);
  wireFlavorsPageHandlers(book);
}

// ── Edibles database ─────────────────────────────────────────────────
// Phase 3 of the Flavors & Textures sub-system. Renders three views
// in one container, gated by APP.edibleCategory and APP.edibleItem.
//
// View 1 — category-browse: 8 paper tiles, click → category-grid.
//          Empty categories (items.length === 0) render as "coming soon."
// View 2 — item-grid: N items in the active category, click → item-detail.
// View 3 — item-detail: hero image + identity stack + flavor/texture
//          badges + notes drawer. Flavor badges cross-link to the
//          Flavors immersion view (Phase 1) via the global
//          ediblesToFlavor helper.
//
// Spec: docs/superpowers/specs/2026-05-26-flavors-textures.{PRODUCT,DESIGN}.md
function ediblesPageHTML(book) {
  const categories = book.categories || [];
  // Resolve current state defensively against stale localStorage.
  const cat = APP.edibleCategory && categories.find(c => c.id === APP.edibleCategory);
  const item = cat && APP.edibleItem && (cat.items || []).find(i => i.id === APP.edibleItem);

  let mode = 'categories';
  if (cat && item) mode = 'detail';
  else if (cat)  mode = 'items';

  return `
    <div class="edibles-frame" data-mode="${mode}" data-book-id="${escAttr(book.id)}">
      ${ediblesCategoriesHTML(categories)}
      ${cat ? ediblesItemsHTML(cat) : '<div class="edibles-items"></div>'}
      ${item ? ediblesDetailHTML(cat, item, categories) : '<div class="edibles-detail"></div>'}
    </div>
  `;
}

// Per-category curated stack overrides. The default auto-picker takes
// [first, middle, last] from the category's items, which works for
// most tiles but produces dull pairs when the underlying alphabetical
// order isn't visually balanced. For categories listed here, the
// override is used in [left, center-front, right] order — pick a
// trio that shows the category's range at a glance, with the strongest
// instantly-readable exemplar in the center. Categories not listed
// fall back to the auto-picker.
//
// Pattern: prefer (1) color/shape variety across the trio so the tile
// doesn't read as "three things that look the same", (2) a single
// canonical anchor in the center-front slot, (3) Japan-coded items
// over Western imports unless the category's identity is the
// Western-Japan fusion (e.g. kashi's wagashi-anchored + cafe-modern
// flanks). Re-curate any entry whenever a stronger third exemplar
// lands.
// Hard-coded list of item ids whose PNGs render with a baked-in soft
// shadow or have a light/yellow body that fights the global drop-shadow
// filter (the shadow ends up reading as a dirty bottom edge — bananas
// were the canonical example). For these items we drop the drop-shadow
// and switch to `mix-blend-mode: multiply`, which makes the off-white
// halo melt into the paper surface and reuses the PNG's own shading
// for depth. Add an id here when you spot the symptom: a hard / muddy
// shadow under a light-toned food on the items grid or detail hero.
const EDIBLES_MULTIPLY_IDS = new Set([
  'banana',
]);

const EDIBLES_CATEGORY_STACK_OVERRIDES = {
  // 果物 (kudamono, fruits): budou left (purple cluster — color +
  // shape contrast), ichigo center (the Japanese-Christmas-cake
  // hero, bright red rounded-triangle, the most instantly
  // recognizable Japanese fruit), meron right (the luxury gift
  // fruit — green/yellow, large round, totally different silhouette
  // from the other two). Three premium fruits, three distinct
  // palettes (purple / red / green-yellow).
  kudamono: ['budou', 'ichigo', 'meron'],

  // 野菜 (yasai, vegetables): daikon left (long white radish — the
  // most iconic Japanese-pantry vegetable), shiitake center (the
  // umami-king mushroom, brown cap — the anchor most users will
  // recognize as "Japanese cooking"), nasu right (Japanese
  // eggplant — slim purple, distinctive silhouette). Three earthy
  // distinct palettes (white / brown / purple).
  yasai: ['daikon', 'shiitake', 'nasu'],

  // 肉 (niku, meat): butaniku left (pork — the everyday Japanese
  // workhorse meat, central to tonkatsu/shabu-shabu/豚汁),
  // gyuuniku center (wagyu beef — the prestige anchor that defines
  // Japanese meat globally), toriniku right (chicken — versatile,
  // base of karaage/yakitori/oyakodon). The three principal meats
  // of Japanese home cooking, beef centered as the cultural
  // prestige.
  niku: ['butaniku', 'gyuuniku', 'toriniku'],

  // 魚 (sakana, fish & sea): ebi left (shrimp's curled pink form —
  // distinctive silhouette), tako center (octopus — multi-tentacle
  // shape reads as "sea creature" more instantly than a tuna slab;
  // very Japan-coded via takoyaki and sushi), buri right (yellowtail
  // — the winter prestige fish, fattier silver-and-blue body reads
  // as a whole fish rather than a sliced cut). Three sushi-bar canon
  // proteins, three distinct shapes (curl / tentacles / whole fish),
  // three palettes (pink / purple-pink / silver-blue).
  sakana: ['ebi', 'tako', 'buri'],

  // 菓子 (kashi, sweets): daifuku left (the wagashi anchor — soft
  // mochi-ball reads instantly as "Japanese sweet"), hottokeeki
  // center (fluffy pancakes — visually the richest of the three,
  // golden stack with butter melting into syrup carries the tile),
  // buraunii right (dark chocolate brownie — color anchor against
  // the lighter daifuku + pancake).
  kashi: ['daifuku', 'hottokeeki', 'buraunii'],
};

// View 1 — category browse.
function ediblesCategoriesHTML(categories) {
  const tilesHTML = categories.map((c, _i) => {
    const tileIndex = _i;
    const isEmpty = !c.items || c.items.length === 0;
    const furigana = c.kana && c.kanji ? c.kana : '';
    // Pick three representative items for the stack. Curated override
    // wins if present; otherwise spread across the list (first +
    // middle + last) so the trio feels varied even if the first three
    // items happen to be visually similar.
    const items = c.items || [];
    let stackIds = [];
    const override = EDIBLES_CATEGORY_STACK_OVERRIDES[c.id];
    if (override && override.length === 3) {
      stackIds = override.slice();
    } else if (items.length >= 3) {
      stackIds = [
        items[0].id,
        items[Math.floor(items.length / 2)].id,
        items[items.length - 1].id,
      ];
    } else if (items.length > 0) {
      // Defensive: tile has fewer than 3 items. Repeat to fill.
      stackIds = [items[0].id, items[items.length > 1 ? 1 : 0].id, items[0].id];
    }
    const stackHTML = stackIds.length === 3 ? `
      <div class="edibles-category-stack" aria-hidden="true">
        <div class="edibles-category-stack-img" data-pos="left">
          <image-slot image-key="vocab/${escAttr(stackIds[0])}" readonly></image-slot>
        </div>
        <div class="edibles-category-stack-img" data-pos="right">
          <image-slot image-key="vocab/${escAttr(stackIds[2])}" readonly></image-slot>
        </div>
        <div class="edibles-category-stack-img" data-pos="center">
          <image-slot image-key="vocab/${escAttr(stackIds[1])}" readonly></image-slot>
        </div>
      </div>
    ` : '';
    return `
      <button class="edibles-category-tile ${isEmpty ? 'is-empty' : ''}"
              data-category-id="${escAttr(c.id)}"
              style="--enter-i:${tileIndex};"
              type="button"
              ${isEmpty ? 'disabled aria-disabled="true"' : ''}
              aria-label="${escAttr(c.en)}">
        ${stackHTML}
        <span class="edibles-category-glyph">${escHTML(c.kanji || c.kana)}</span>
        ${furigana ? `<span class="edibles-category-furigana">${escHTML(furigana)}</span>` : ''}
      </button>
    `;
  }).join('');
  return `
    <div class="edibles-categories">
      <header class="edibles-head" style="grid-column:1/-1">
        <div class="edibles-eyebrow">edibles · 食材</div>
        <h1 class="edibles-title">
          <ruby>食材<rt>しょくざい</rt></ruby>の <ruby>世界<rt>せかい</rt></ruby>
        </h1>
        <p class="edibles-sub">
          Browse foods by category. Each carries its flavor profile —
          click a flavor badge inside an item to walk back to that
          flavor's world.
        </p>
      </header>
      ${tilesHTML}
    </div>
  `;
}

// View 2 — items in the active category.
function ediblesItemsHTML(cat) {
  const items = cat.items || [];
  if (items.length === 0) {
    return `
      <div class="edibles-items-wrap">
        <button class="edibles-back" data-edibles-back="categories" type="button"
                aria-label="食材の世界に戻る (back to all categories)">
          <svg class="edibles-back-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.2"/>
            <rect x="14" y="3" width="7" height="7" rx="1.2"/>
            <rect x="3" y="14" width="7" height="7" rx="1.2"/>
            <rect x="14" y="14" width="7" height="7" rx="1.2"/>
          </svg>
          <span class="edibles-back-arrow" aria-hidden="true">←</span>
          <span class="edibles-back-label">
            <ruby>食材<rt>しょくざい</rt></ruby>の<ruby>世界<rt>せかい</rt></ruby>
          </span>
        </button>
        <header class="edibles-head">
          <div class="edibles-eyebrow is-kana">${escHTML(cat.kana || cat.kanji || '')}</div>
          <h1 class="edibles-title">${escHTML(cat.kanji || cat.kana)}</h1>
        </header>
        <div class="edibles-empty-grid">
          ${escHTML(cat.en)} content arrives in a future Phase 3 commit.
        </div>
      </div>
    `;
  }
  const cardsHTML = items.map((it, _i) => {
    const cardIndex = _i;
    const blendAttr = EDIBLES_MULTIPLY_IDS.has(it.id) ? ' data-blend="multiply"' : '';
    return `
      <button class="edibles-item-card"
              data-item-id="${escAttr(it.id)}"
              type="button"
              style="--enter-i:${cardIndex};"
              aria-label="${escAttr(it.kana)} — ${escAttr(it.en)}">
        <div class="edibles-item-image"${blendAttr}>
          <image-slot image-key="vocab/${escAttr(it.id)}" readonly></image-slot>
        </div>
        <div class="edibles-item-name">
          <span class="edibles-item-kana">${escHTML(it.kana)}</span>
        </div>
        ${(it.flavors && it.flavors.length) ? `
          <div class="edibles-item-chips">
            ${it.flavors.slice(0, 2).map(fid => {
              const fkana = lookupFlavorKana(fid) || fid;
              return `
                <span class="edibles-item-pip">
                  <img class="edibles-item-pip-ball"
                       src="images/vocab/flavorballs/${escAttr(fid)}.webp"
                       alt=""
                       aria-hidden="true"
                       loading="lazy">
                  ${escHTML(fkana)}
                </span>
              `;
            }).join('')}
          </div>
        ` : ''}
      </button>
    `;
  }).join('');
  return `
    <div class="edibles-items">
      <div style="grid-column:1/-1">
        <button class="edibles-back" data-edibles-back="categories" type="button"
                aria-label="食材の世界に戻る (back to all categories)">
          <svg class="edibles-back-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.2"/>
            <rect x="14" y="3" width="7" height="7" rx="1.2"/>
            <rect x="3" y="14" width="7" height="7" rx="1.2"/>
            <rect x="14" y="14" width="7" height="7" rx="1.2"/>
          </svg>
          <span class="edibles-back-arrow" aria-hidden="true">←</span>
          <span class="edibles-back-label">
            <ruby>食材<rt>しょくざい</rt></ruby>の<ruby>世界<rt>せかい</rt></ruby>
          </span>
        </button>
        <header class="edibles-head">
          <div class="edibles-eyebrow is-kana">${escHTML(cat.kana || cat.kanji || '')}</div>
          <h1 class="edibles-title">${escHTML(cat.kanji || cat.kana)}</h1>
          <p class="edibles-sub">${items.length} item${items.length === 1 ? '' : 's'}</p>
        </header>
      </div>
      ${cardsHTML}
    </div>
  `;
}

// View 3 — single item detail spread.
// Glosses for the "extra" texture descriptors that aren't part of the
// canonical 10 onomatopoeia (those have their own immersion pages, so
// clicking the pill is the path-to-explanation). These extras live in
// items' textures[] arrays as freeform descriptors; the detail card
// shows them as display-only spans, and this glossary surfaces their
// meaning as a tooltip on hover. Short English-only gloss — keeps the
// pill itself Japanese, the tooltip is the "what does that mean?"
// answer for learners.
// Glosses + (optional) icons for the non-canonical texture descriptors.
// Each entry is either a plain string (just an English gloss) or an
// object with { en, icon } — icon is the filename in
// images/bg/texture-icons/ minus the extension. The renderer reads
// both shapes for backward compatibility; entries without icons stay
// label-only on the pill.
// Icon names must match files under images/bg/texture-icons/<icon>.webp.
// Every gloss entry should carry one if a matching file exists — without
// it, the badge falls back to a kana-only pill (which is what triggered
// the user-reported "プチプチ has no icon" bug).
const EXTRA_TEXTURE_GLOSSES = {
  'ジューシー'  : { en: 'juicy — releases liquid when bitten',     icon: 'juushii' },
  'やわらかい'  : { en: 'soft / tender',                            icon: 'yawarakai' },
  'プチプチ'   : { en: 'popping — like fish roe bursting',         icon: 'puchipuchi' },
  'ぷちぷち'   : { en: 'popping — like fish roe bursting',         icon: 'puchipuchi' },
  'シャリシャリ': { en: 'granular crunch — like shaved ice',        icon: 'sharishari' },
  'クリーミー'  : { en: 'creamy / rich',                            icon: 'kuriimii' },
  'つるつる'   : { en: 'smooth-slippery — slurped noodles',         icon: 'tsurutsuru' },
  'なめらか'   : { en: 'smooth / silky',                            icon: 'nameraka' },
  'ぷるぷる'   : { en: 'jiggly / wobbly — like jelly or soft tofu', icon: 'purupuru' },
};

function ediblesDetailHTML(cat, item, allCategories) {
  // Kanji block — ruby with furigana when there's a kanji, plain
  // kana when the word is a loanword (no kanji).
  const isKanaOnly = !item.kanji;
  const kanjiHTML = isKanaOnly
    ? escHTML(item.kana)
    : `<ruby>${escHTML(item.kanji)}<rt>${escHTML(item.kana)}</rt></ruby>`;

  // Flavor badges — clickable, jump to flavor immersion via
  // ediblesToFlavor handler. The flavorball image replaces what used
  // to be a chip-colored dot; --badge-chip is still passed so the
  // hover tint on the badge surface picks up the flavor's color.
  const flavorBadges = (item.flavors || []).map(fid => {
    const chip = lookupFlavorChip(fid);
    const fkana = lookupFlavorKana(fid) || fid;
    return `
      <button class="edibles-flavor-badge"
              data-edible-to-flavor="${escAttr(fid)}"
              style="--badge-chip:${escAttr(chip)}"
              type="button"
              aria-label="Walk to the ${escAttr(fkana)} flavor world">
        <img class="edibles-flavor-badge-ball"
             src="images/vocab/flavorballs/${escAttr(fid)}.webp"
             alt=""
             aria-hidden="true"
             loading="lazy">
        ${escHTML(fkana)}
      </button>
    `;
  }).join('');

  // Texture badges — clickable cross-link to the textures immersion
  // view (Phase 2). Each item.textures entry is a kana string that
  // looks up its texture id from the textures book. If a match
  // exists, render a button that opens the texture immersion;
  // otherwise fall back to a display-only span (defensive against
  // unmapped kana like 'やわらかい' that the textures seed list
  // doesn't yet cover).
  const texturesBook = (() => {
    for (const cls of (window.VOCAB_CLASSES || [])) {
      for (const b of (cls.books || [])) {
        if (b.isTexturesPage) return b;
      }
    }
    return null;
  })();
  const textureBadges = (item.textures || []).map(t => {
    const tex = texturesBook && (texturesBook.textures || []).find(x => x.kana === t);
    if (tex) {
      // Improved pill: motion-line SVG glyph in front, kana label
      // beside it, and the texture's pattern wallpaper as a faint
      // background. Together they make the pill instantly recognizable
      // — the brushstroke shape IS the texture, the pattern locks
      // the visual identity established on the textures page.
      return `<button class="edibles-texture-badge is-link"
                      data-edible-to-texture="${escAttr(tex.id)}"
                      type="button"
                      style="--tint:${escAttr(tex.tint)}; --texture-pattern:url('images/bg/textures/${escAttr(tex.id)}.webp');"
                      aria-label="Open ${escAttr(t)} texture page">
                <span class="edibles-texture-badge-glyph" aria-hidden="true">${textureMotionLineSVG(tex.motionShape)}</span>
                <span class="edibles-texture-badge-kana">${escHTML(t)}</span>
              </button>`;
    }
    // Display-only fallback (texture not in the textures book). If
    // we have a gloss entry for it, attach a hover tooltip so the
    // learner can see what the descriptor means — ジューシー = juicy,
    // やわらかい = soft, etc. If an icon is registered for it too,
    // render the icon in front of the kana so the pill carries some
    // visual identity (mirrors the brushstroke glyph on the canonical
    // textures' pills). tabindex makes the pill keyboard-reachable.
    const glossEntry = EXTRA_TEXTURE_GLOSSES[t];
    if (glossEntry) {
      const en   = typeof glossEntry === 'string' ? glossEntry : glossEntry.en;
      const icon = (typeof glossEntry === 'object') ? glossEntry.icon : null;
      const iconHTML = icon
        ? `<img class="extra-texture-icon"
                src="images/bg/texture-icons/${escAttr(icon)}.webp"
                alt=""
                aria-hidden="true"
                loading="lazy"
                onerror="this.style.display='none'">`
        : '';
      return `<span class="edibles-texture-badge has-en-tooltip ${icon ? 'has-extra-icon' : ''}"
                    data-tooltip="${escAttr(en)}"
                    tabindex="0">${iconHTML}<span class="extra-texture-kana">${escHTML(t)}</span></span>`;
    }
    return `<span class="edibles-texture-badge">${escHTML(t)}</span>`;
  }).join('');

  // Season chips — display only.
  const seasonChips = (item.season || []).map(s => `
    <span class="edibles-season-chip">${escHTML(s)}</span>
  `).join('');

  // Optional flavor-back breadcrumb — rendered next to the category
  // back button when the user arrived via the "foods that taste like X"
  // row on a flavor immersion view. The colored dot picks up the
  // flavor's chip color so the back-target reads instantly.
  const fromFlavorId = APP.edibleFromFlavor;
  const fromFlavorKana = fromFlavorId ? lookupFlavorKana(fromFlavorId) : null;
  const fromFlavorChip = fromFlavorId ? lookupFlavorChip(fromFlavorId) : null;

  // Prev / Next walk buttons — cycle through items in the same
  // category, wrapping at the end (last → first). Each carries the
  // neighbor's image thumbnail so the user previews where they're
  // walking. Only renders when there are >=2 items in the category;
  // a single-item category has nowhere to walk.
  const catItems = cat.items || [];
  const itemIndex = catItems.findIndex(x => x.id === item.id);
  const hasWalk = catItems.length >= 2 && itemIndex >= 0;
  const prevItem = hasWalk ? catItems[(itemIndex - 1 + catItems.length) % catItems.length] : null;
  const nextItem = hasWalk ? catItems[(itemIndex + 1) % catItems.length] : null;

  return `
    <div class="edibles-detail">
      <div class="edibles-detail-backs" style="grid-column:1/-1">
        <button class="edibles-back edibles-back-kana" data-edibles-back="items" type="button"
                aria-label="Back to ${escAttr(cat.en)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          <span>${escHTML(cat.kana || cat.kanji || cat.en)}</span>
        </button>
        ${hasWalk ? `
          <button class="edibles-back edibles-back-walk edibles-back-walk-prev"
                  data-edibles-walk
                  data-target-item="${escAttr(prevItem.id)}"
                  type="button"
                  aria-label="Previous: ${escAttr(prevItem.kana)} — ${escAttr(prevItem.en)}">
            <span class="walk-arrow" aria-hidden="true">←</span>
            <img class="walk-img"
                 src="${escAttr(vocabImgSrc(prevItem.id))}"
                 alt=""
                 aria-hidden="true"
                 loading="lazy"
                 onerror="${escAttr(VOCAB_IMG_ONERROR_HIDE)}">
            <ruby class="walk-label">前<rt>まえ</rt></ruby>
          </button>
          <button class="edibles-back edibles-back-walk edibles-back-walk-next"
                  data-edibles-walk
                  data-target-item="${escAttr(nextItem.id)}"
                  type="button"
                  aria-label="Next: ${escAttr(nextItem.kana)} — ${escAttr(nextItem.en)}">
            <ruby class="walk-label">次<rt>つぎ</rt></ruby>
            <img class="walk-img"
                 src="${escAttr(vocabImgSrc(nextItem.id))}"
                 alt=""
                 aria-hidden="true"
                 loading="lazy"
                 onerror="${escAttr(VOCAB_IMG_ONERROR_HIDE)}">
            <span class="walk-arrow" aria-hidden="true">→</span>
          </button>
        ` : ''}
        ${fromFlavorId && fromFlavorKana ? `
          <button class="edibles-back edibles-back-kana edibles-back-to-flavor"
                  data-edibles-back-to-flavor="${escAttr(fromFlavorId)}"
                  style="--chip:${escAttr(fromFlavorChip)};"
                  type="button"
                  aria-label="Back to the ${escAttr(fromFlavorKana)} flavor world">
            <img class="edibles-back-ball"
                 src="images/vocab/flavorballs/${escAttr(fromFlavorId)}.webp"
                 alt=""
                 aria-hidden="true"
                 loading="lazy">
            <span>${escHTML(fromFlavorKana)}</span>
          </button>
        ` : ''}
      </div>
      <div class="edibles-detail-hero"${EDIBLES_MULTIPLY_IDS.has(item.id) ? ' data-blend="multiply"' : ''}>
        <image-slot image-key="vocab/${escAttr(item.id)}" readonly></image-slot>
      </div>
      <div class="edibles-detail-body">
        <div class="edibles-detail-identity">
          <h1 class="edibles-detail-kanji ${isKanaOnly ? 'is-kana-only' : ''}">${kanjiHTML}</h1>
          ${item.kanji ? `<p class="edibles-detail-kana">${escHTML(item.kana)}</p>` : ''}
          <p class="edibles-detail-romaji">${escHTML(item.romaji || '')}</p>
        </div>
        ${item.notes ? `
          <p class="edibles-detail-notes">${escHTML(item.notes)}</p>
        ` : ''}
        ${(flavorBadges || textureBadges || seasonChips) ? `
          <div class="edibles-detail-badges">
            <button class="edibles-badge-legend" type="button"
                    aria-label="Show English translations of the row labels">
              <span class="edibles-badge-legend-icon" aria-hidden="true">?</span>
              <span class="edibles-badge-legend-tooltip" role="tooltip">
                <span class="legend-row"><span class="legend-ja">味</span><span class="legend-en">flavors</span></span>
                <span class="legend-row"><span class="legend-ja">食感</span><span class="legend-en">textures</span></span>
                <span class="legend-row"><span class="legend-ja">季節</span><span class="legend-en">season</span></span>
              </span>
            </button>
            ${flavorBadges ? `
              <div class="edibles-badge-row">
                <span class="edibles-badge-label">
                  <ruby class="hover-furigana" data-fur="あじ" tabindex="0">味<rt>あじ</rt></ruby>
                </span>
                ${flavorBadges}
              </div>
            ` : ''}
            ${textureBadges ? `
              <div class="edibles-badge-row">
                <span class="edibles-badge-label">
                  <ruby class="hover-furigana" data-fur="しょっかん" tabindex="0">食感<rt>しょっかん</rt></ruby>
                </span>
                ${textureBadges}
              </div>
            ` : ''}
            ${seasonChips ? `
              <div class="edibles-badge-row">
                <span class="edibles-badge-label">
                  <ruby class="hover-furigana" data-fur="きせつ" tabindex="0">季節<rt>きせつ</rt></ruby>
                </span>
                ${seasonChips}
              </div>
            ` : ''}
          </div>
        ` : ''}
        ${(() => {
          // Reverse-browse row: items sharing a flavor or texture with
          // this one (Phase 4). Cross-links go through the same
          // edibles-frame state-swap as the within-category card
          // clicks, so the user can keep walking the database.
          const similar = findSimilarEdibles(item, allCategories || []);
          if (!similar.length) return '';
          return `
            <section class="edibles-detail-similar">
              <header class="edibles-similar-head">
                <span class="ja">
                  <ruby class="hover-furigana" data-fur="に" tabindex="0">似<rt>に</rt></ruby>ている <ruby class="hover-furigana" data-fur="しょくざい" tabindex="0">食材<rt>しょくざい</rt></ruby>
                </span>
                <span class="en">items sharing a flavor or texture</span>
              </header>
              <div class="edibles-similar-row">
                ${similar.map(({ item: si, cat: sc }) => `
                  <button class="edibles-similar-card"
                          data-similar-to="${escAttr(sc.id)}/${escAttr(si.id)}"
                          type="button"
                          aria-label="Open ${escAttr(si.kana)} — ${escAttr(si.en)}">
                    <div class="edibles-similar-image"${EDIBLES_MULTIPLY_IDS.has(si.id) ? ' data-blend="multiply"' : ''}>
                      <image-slot image-key="vocab/${escAttr(si.id)}" readonly></image-slot>
                    </div>
                    <div class="edibles-similar-name">
                      <span class="ja">${escHTML(si.kana)}</span>
                      <span class="en">${escHTML(si.en)}</span>
                    </div>
                  </button>
                `).join('')}
              </div>
            </section>
          `;
        })()}
      </div>
    </div>
  `;
}

// Phase 4 cross-link helper — find items elsewhere in the database
// that share a flavor or texture with the current item. Scored by
// overlap: shared flavors weight 2× (more specific signal — only 10
// flavors total), shared textures weight 1× (less specific — same
// kana texture word can appear on many items). Returns top N.
function findSimilarEdibles(currentItem, allCategories, limit = 6) {
  const targetFlavors  = new Set(currentItem.flavors || []);
  const targetTextures = new Set(currentItem.textures || []);
  if (targetFlavors.size === 0 && targetTextures.size === 0) return [];

  const candidates = [];
  for (const cat of allCategories) {
    for (const item of (cat.items || [])) {
      if (item.id === currentItem.id) continue;
      let score = 0;
      const sharedF = [];
      const sharedT = [];
      for (const f of (item.flavors || [])) {
        if (targetFlavors.has(f)) { score += 2; sharedF.push(f); }
      }
      for (const t of (item.textures || [])) {
        if (targetTextures.has(t)) { score += 1; sharedT.push(t); }
      }
      if (score > 0) {
        candidates.push({ item, cat, score, sharedF, sharedT });
      }
    }
  }
  // Higher score first; stable order for ties (deterministic across renders).
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

// Helpers — look up a flavor's chip color and kana by id, from the
// Flavors book sitting elsewhere in VOCAB_CLASSES.
// Find a flavor definition by id across all flavors books (first match).
function findFlavorDef(flavorId) {
  for (const cls of (window.VOCAB_CLASSES || [])) {
    for (const book of (cls.books || [])) {
      if (!book.isFlavorsPage) continue;
      const f = (book.flavors || []).find(x => x.id === flavorId);
      if (f) return f;
    }
  }
  return null;
}
function lookupFlavorChip(flavorId) { const f = findFlavorDef(flavorId); return f ? f.chip : 'var(--ink-4)'; }
function lookupFlavorKana(flavorId) { const f = findFlavorDef(flavorId); return f ? f.kana : null; }

// Wire handlers — category tile click, item card click, back buttons,
// flavor badge cross-links.
function wireEdiblesPageHandlers(book) {
  const frame = document.querySelector('.edibles-frame[data-book-id="' + book.id + '"]');
  if (!frame) return;

  frame.addEventListener('click', e => {
    // Cross-link: flavor badge → flavors immersion view.
    const flavorBtn = e.target.closest('[data-edible-to-flavor]');
    if (flavorBtn) {
      ediblesToFlavor(flavorBtn.dataset.edibleToFlavor);
      return;
    }
    // Cross-link: texture badge → textures immersion view (mirror of
    // flavor branch above). Looks up the textures book by isTexturesPage
    // flag rather than hardcoding the book id so a future textures
    // book rename doesn't break this jump.
    const textureBtn = e.target.closest('[data-edible-to-texture]');
    if (textureBtn) {
      const texturesBook = (window.VOCAB_CLASSES || [])
        .flatMap(c => c.books || []).find(b => b.isTexturesPage);
      if (!texturesBook) return;
      APP.vocabBookId = texturesBook.id;
      APP.textureId = textureBtn.dataset.edibleToTexture;
      APP.edibleFromFlavor = null;
      APP.edibleFromTexture = null;
      lsSet('jp:vocabBook', texturesBook.id);
      lsSet('jp:textureId', APP.textureId);
      lsSet('jp:edibleFromFlavor', null);
      lsSet('jp:edibleFromTexture', null);
      const inner = document.getElementById('main-inner');
      if (inner) renderVocab(inner);
      if (typeof renderVocabBooksSidebar === 'function') renderVocabBooksSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Back button: takes a `data-edibles-back` of either "categories"
    // (from item-grid view) or "items" (from item-detail view).
    const backBtn = e.target.closest('[data-edibles-back]');
    if (backBtn) {
      const target = backBtn.dataset.ediblesBack;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const ediFrame = document.querySelector('.edibles-frame');

      // items → categories transition gets the reverse choreography:
      // existing item cards stagger out, then categories stagger in.
      // Rapid-click guard: same shared flag as the other edibles
      // transitions; blocks the second click while the first is still
      // animating (see comment on enterFlavorImmersion for full rationale).
      if (target === 'categories' && ediFrame && !reduced) {
        if (animLocked(window.__ediblesAnimating)) return;
        window.__ediblesAnimating = Date.now();
        ediFrame.classList.add('is-leaving-items');
        setTimeout(() => {
          APP.edibleCategory = null;
          APP.edibleItem = null;
          lsSet('jp:edibleCategory', null);
          lsSet('jp:edibleItem', null);
          APP.edibleFromFlavor = null;
          lsSet('jp:edibleFromFlavor', null);
          rerenderEdibles(book);
          const next = document.querySelector('.edibles-frame');
          if (next) {
            void next.offsetWidth;
            next.classList.add('is-entering-categories');
            setTimeout(() => {
              next.classList.remove('is-entering-categories');
              window.__ediblesAnimating = false;
            }, 900);
          } else {
            window.__ediblesAnimating = false;
          }
        }, 360);
        return;
      }

      // Detail → items: mirror of the item-card click choreography.
      // The detail hero shrinks down toward the card's resting size,
      // then we swap, then the matching card "lands with a hop" while
      // its siblings stagger-fade in. Mark the returning card by
      // data-item-id BEFORE adding the entering class so the keyframe
      // selector targets it specifically (vs the sibling cascade).
      //
      // IMPORTANT: strip is-zoom-target from the returning card AFTER
      // the entrance animation finishes. If we leave it on, the next
      // item click would tag a NEW card with is-zoom-target while the
      // old one still carries it — both match the .is-zoom-target
      // selector and BOTH animate as targets, which reads as a shaky
      // double-hop. (This was the bug the user reported.)
      if (target === 'items' && ediFrame && !reduced) {
        if (animLocked(window.__ediblesAnimating)) return;
        window.__ediblesAnimating = Date.now();
        const returningItemId = APP.edibleItem;
        ediFrame.classList.add('is-zoom-out-detail');
        setTimeout(() => {
          APP.edibleItem = null;
          lsSet('jp:edibleItem', null);
          APP.edibleFromFlavor = null;
          lsSet('jp:edibleFromFlavor', null);
          rerenderEdibles(book);
          const next = document.querySelector('.edibles-frame');
          if (next) {
            const returningCard = next.querySelector(`[data-item-id="${returningItemId}"]`);
            if (returningCard) returningCard.classList.add('is-zoom-target');
            void next.offsetWidth;
            next.classList.add('is-zoom-in-items');
            setTimeout(() => {
              next.classList.remove('is-zoom-in-items');
              if (returningCard) returningCard.classList.remove('is-zoom-target');
              window.__ediblesAnimating = false;
            }, 1000);
          } else {
            window.__ediblesAnimating = false;
          }
        }, 320);
        return;
      }

      if (target === 'categories') {
        APP.edibleCategory = null;
        APP.edibleItem = null;
        lsSet('jp:edibleCategory', null);
        lsSet('jp:edibleItem', null);
      } else if (target === 'items') {
        APP.edibleItem = null;
        lsSet('jp:edibleItem', null);
      }
      // Going up out of detail view drops the flavor breadcrumb —
      // the cross-link context only makes sense inside an item-detail
      // spread (where the back button can be rendered).
      APP.edibleFromFlavor = null;
      lsSet('jp:edibleFromFlavor', null);
      rerenderEdibles(book);
      return;
    }
    // Back to the flavor we came from. This is the second back button
    // rendered next to the category one when edibleFromFlavor is set.
    const flavorBackBtn = e.target.closest('[data-edibles-back-to-flavor]');
    if (flavorBackBtn) {
      const flavorId = flavorBackBtn.dataset.ediblesBackToFlavor;
      APP.vocabBookId = 'flavors';
      APP.flavorId = flavorId;
      APP.edibleFromFlavor = null;
      lsSet('jp:vocabBook', 'flavors');
      lsSet('jp:flavorId', flavorId);
      lsSet('jp:edibleFromFlavor', null);
      const inner = document.getElementById('main-inner');
      if (inner) renderVocab(inner);
      if (typeof renderVocabBooksSidebar === 'function') renderVocabBooksSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Category tile click — enter that category's item-grid. Empty
    // tiles are disabled in the HTML, so no need to filter here.
    // Wraps the swap in a stagger choreography: categories leave,
    // then items slide in. Mirrors the flavors bento→immersion feel.
    const catTile = e.target.closest('[data-category-id]');
    if (catTile && !catTile.disabled) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const ediFrame = document.querySelector('.edibles-frame');
      const nextCatId = catTile.dataset.categoryId;
      if (!ediFrame || reduced) {
        APP.edibleCategory = nextCatId;
        APP.edibleItem = null;
        lsSet('jp:edibleCategory', APP.edibleCategory);
        lsSet('jp:edibleItem', null);
        rerenderEdibles(book);
        return;
      }
      if (animLocked(window.__ediblesAnimating)) return;
      window.__ediblesAnimating = Date.now();
      ediFrame.classList.add('is-leaving-categories');
      setTimeout(() => {
        APP.edibleCategory = nextCatId;
        APP.edibleItem = null;
        lsSet('jp:edibleCategory', APP.edibleCategory);
        lsSet('jp:edibleItem', null);
        rerenderEdibles(book);
        const next = document.querySelector('.edibles-frame');
        if (next) {
          void next.offsetWidth;
          next.classList.add('is-entering-items');
          setTimeout(() => {
            next.classList.remove('is-entering-items');
            window.__ediblesAnimating = false;
          }, 900);
        } else {
          window.__ediblesAnimating = false;
        }
      }, 360);
      return;
    }
    // Item card click — open detail spread. Scroll the page back to
    // the top so the user lands on the hero, not at whatever scroll
    // offset the items grid was sitting at when they clicked.
    //
    // Choreography simulates a "shared element transition" between
    // the same item in two representations. The clicked card hops up
    // and scales (~1.18) while its siblings fade-shrink around it,
    // then the swap fires, and the detail hero "settles" from a
    // larger scale down to 1.0 — visually continuous with the card's
    // last frame. The reverse handler below mirrors this.
    const itemBtn = e.target.closest('[data-item-id]');
    if (itemBtn) {
      const itemId = itemBtn.dataset.itemId;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const ediFrame = document.querySelector('.edibles-frame');
      if (!ediFrame || reduced) {
        APP.edibleItem = itemId;
        lsSet('jp:edibleItem', itemId);
        rerenderEdibles(book);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (animLocked(window.__ediblesAnimating)) return;
      window.__ediblesAnimating = Date.now();
      // Defensive: strip is-zoom-target from any sibling card that
      // might still carry it from a prior back-from-detail flow. The
      // back path adds the class then strips it in its inner timeout,
      // but if the timing windows ever overlap (or a future path
      // forgets), we'd double-tag here and the keyframe selector
      // would fire on two cards = the "shaky double hop" bug.
      ediFrame.querySelectorAll('.edibles-item-card.is-zoom-target')
        .forEach(c => c.classList.remove('is-zoom-target'));
      // Tag the clicked card so the CSS hops it up (vs the siblings
      // which fade-shrink). z-index lift comes via the class — the
      // hop card needs to render above its neighbors when scaling up.
      itemBtn.classList.add('is-zoom-target');
      ediFrame.classList.add('is-zoom-out-items');
      setTimeout(() => {
        APP.edibleItem = itemId;
        lsSet('jp:edibleItem', itemId);
        rerenderEdibles(book);
        const next = document.querySelector('.edibles-frame');
        if (next) {
          void next.offsetWidth;
          next.classList.add('is-zoom-in-detail');
          setTimeout(() => {
            next.classList.remove('is-zoom-in-detail');
            window.__ediblesAnimating = false;
          }, 1000);
        } else {
          window.__ediblesAnimating = false;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 380);
      return;
    }
    // Walk button (前 / 次): cycle to the previous or next item in the
    // same category, wrapping at either end. data-target-item carries
    // the destination id (already wrap-computed by the renderer).
    //
    // Choreography: this is the ONLY edibles transition that does NOT
    // use the shared-element hop pattern. Walk = carousel. Current
    // detail slides off-screen in one direction, swap, new detail
    // slides in from the OPPOSITE direction — the eye reads "the
    // carousel scrolled."
    //   click 次 (next) → current slides LEFT, new comes from RIGHT
    //   click 前 (prev) → current slides RIGHT, new comes from LEFT
    // Direction comes from the button's class (.edibles-back-walk-next
    // / -prev), set by the renderer at line ~20879.
    const walkBtn = e.target.closest('[data-edibles-walk]');
    if (walkBtn) {
      const targetId = walkBtn.dataset.targetItem;
      if (!targetId) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const ediFrame = document.querySelector('.edibles-frame');
      if (!ediFrame || reduced) {
        APP.edibleItem = targetId;
        lsSet('jp:edibleItem', targetId);
        rerenderEdibles(book);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (animLocked(window.__ediblesAnimating)) return;
      window.__ediblesAnimating = Date.now();
      const isNext = walkBtn.classList.contains('edibles-back-walk-next');
      const outClass = isNext ? 'is-sliding-out-left' : 'is-sliding-out-right';
      const inClass  = isNext ? 'is-sliding-in-from-right' : 'is-sliding-in-from-left';
      ediFrame.classList.add(outClass);
      setTimeout(() => {
        APP.edibleItem = targetId;
        lsSet('jp:edibleItem', targetId);
        rerenderEdibles(book);
        const next = document.querySelector('.edibles-frame');
        if (next) {
          void next.offsetWidth;
          next.classList.add(inClass);
          setTimeout(() => {
            next.classList.remove(inClass);
            window.__ediblesAnimating = false;
          }, 420);
        } else {
          window.__ediblesAnimating = false;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 320);
      return;
    }
    // Phase 4 cross-link: similar-item card on a detail spread.
    // data-similar-to carries "<catId>/<itemId>" so a single click
    // walks the user from one similar card into that item's full detail.
    //
    // Choreography: same "shared element" pattern as the items-grid →
    // detail flow — the clicked similar card is the same picture as
    // the next hero, so the eye tracks it through the swap. The card
    // hops up + scales (mirroring the items-grid hop-out), the rest
    // of the detail page fades down around it, swap, then the new
    // detail's hero settles in from scale 1.18 (the same arrival
    // shape as a fresh item click).
    const simBtn = e.target.closest('[data-similar-to]');
    if (simBtn) {
      const [catId, itemId] = simBtn.dataset.similarTo.split('/');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const ediFrame = document.querySelector('.edibles-frame');
      if (!ediFrame || reduced) {
        APP.edibleCategory = catId;
        APP.edibleItem = itemId;
        lsSet('jp:edibleCategory', catId);
        lsSet('jp:edibleItem', itemId);
        rerenderEdibles(book);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (animLocked(window.__ediblesAnimating)) return;
      window.__ediblesAnimating = Date.now();
      simBtn.classList.add('is-zoom-target');
      ediFrame.classList.add('is-launching-similar');
      setTimeout(() => {
        APP.edibleCategory = catId;
        APP.edibleItem = itemId;
        lsSet('jp:edibleCategory', catId);
        lsSet('jp:edibleItem', itemId);
        rerenderEdibles(book);
        const next = document.querySelector('.edibles-frame');
        if (next) {
          void next.offsetWidth;
          next.classList.add('is-zoom-in-detail');
          setTimeout(() => {
            next.classList.remove('is-zoom-in-detail');
            window.__ediblesAnimating = false;
          }, 1000);
        } else {
          window.__ediblesAnimating = false;
        }
        // Scroll to top so the user lands on the new item's hero, not
        // mid-page where the previous similar-row used to be.
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 420);
      return;
    }
  });

  // ── Page-entry choreography ──
  // "Show some love" — bigger production than the categories↔items
  // swap inside the page. Plays only when the user arrives at edibles
  // from the sidebar (or first paint), and only in categories mode.
  //
  // What animates (see CSS .is-entering-edibles):
  //   1. Head eyebrow + title + sub fade up, widely staggered.
  //   2. Each tile rises with a slight 3D tilt — the wave sweeps the
  //      grid in reading order.
  //   3. The category glyph (kanji) inside each tile scales-pop on
  //      arrival, sized down then settling to 1.0 with a soft rebound.
  //   4. The three stack images per tile bloom out from the glyph
  //      (each travels to its left/right/center resting position).
  //   5. Furigana labels fade in last.
  if (window.__bookEntranceFlag === book.id && frame.dataset.mode === 'categories') {
    window.__bookEntranceFlag = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      // Set --enter-i per tile so the bloom stagger reads left → right
      // in the source order. The CSS uses var(--enter-i, 0) but the
      // tile renderer doesn't carry the variable (unlike the items
      // renderer, which does emit it inline). Without this loop, every
      // tile fires at delay 0 and the wave promised in the comment
      // doesn't happen.
      frame.querySelectorAll('.edibles-category-tile').forEach((el, i) => {
        el.style.setProperty('--enter-i', i);
      });
      void frame.offsetWidth;
      frame.classList.add('is-entering-edibles');
      setTimeout(() => frame.classList.remove('is-entering-edibles'), 1600);
    }
  }
}

// IMPORTANT: this implementation relies on `pageEl.innerHTML = ...`
// destroying the old `.edibles-frame` element entirely on each call.
// All the transition class hygiene (`is-leaving-categories`, etc.) is
// implicit because the next render gives us a fresh frame with no
// classes — we never have to explicitly clean up the leaving classes.
// If someone refactors this into a diff-and-patch path, they MUST
// either preserve that contract or add explicit classList.remove calls
// at every setTimeout boundary in wireEdiblesPageHandlers.
function rerenderEdibles(book) {
  const pageEl = document.getElementById('vocab-page-content');
  if (!pageEl) return;
  pageEl.innerHTML = ediblesPageHTML(book);
  wireEdiblesPageHandlers(book);
}

// Cross-link: jump from an edible's flavor badge → the Flavors book's
// immersion view for that flavor. Switches the active vocab book and
// sets the flavor id, then triggers a re-render. The user's edible
// category + item are preserved in localStorage so they can come
// back to them via the sidebar.
function ediblesToFlavor(flavorId) {
  APP.vocabBookId = 'flavors';
  APP.flavorId = flavorId;
  // Going to a flavor consumes the edible→flavor breadcrumb; the
  // user is at a flavor now, no need to back-button to one.
  APP.edibleFromFlavor = null;
  lsSet('jp:vocabBook', 'flavors');
  lsSet('jp:flavorId', flavorId);
  lsSet('jp:edibleFromFlavor', null);
  const inner = document.getElementById('main-inner');
  if (inner) renderVocab(inner);
  if (typeof renderVocabBooksSidebar === 'function') renderVocabBooksSidebar();
}

function foodGalleryHTML() {
  // Plain <img> tags. Earlier version used fetch() + inline-svg so the
  // line-art could inherit `currentColor` from the parent — but fetch()
  // is blocked when the page is opened via file://, which left every
  // card with an empty square and zero scroll height. <img> always
  // resolves locally; SVGs render in their own document context so
  // currentColor defaults to black (still legible on the cream paper).
  //
  // Cards are <button>s so they're keyboard-focusable. Click opens
  // a small modal with the dish's name, reading, and a 2-3 sentence
  // cultural/origin note (see openFoodDialog).
  const sections = FOOD_GALLERY.map(s => `
    <section class="food-section" id="food-${escAttr(s.id)}">
      <h2 class="food-section-head">
        <span class="ja">${escHTML(s.titleJa)}</span>
        <span class="en">${escHTML(s.titleEn)}</span>
        <span class="count">${s.items.length}</span>
      </h2>
      <div class="food-grid">
        ${s.items.map((it, i) => `
          <button class="food-card" data-food-section="${escAttr(s.id)}" data-food-idx="${i}" aria-label="${escAttr(it.ja)} — ${escAttr(it.en)}">
            <div class="food-svg-frame">
              <img class="food-svg" src="images/food/${escAttr(it.file)}" alt="" loading="lazy" />
            </div>
            <div class="food-card-name">
              <span class="ja">${escHTML(it.ja)}</span>
              <span class="en">${escHTML(it.en)}</span>
            </div>
          </button>
        `).join('')}
      </div>
    </section>
  `).join('');

  // Intra-page nav — anchor chips that jump to each food section.
  const navHTML = FOOD_GALLERY.map(s => `
    <a class="food-nav-chip" href="#food-${escAttr(s.id)}">
      <span class="ja">${escHTML(s.titleJa)}</span>
      <span class="en">${escHTML(s.titleEn)}</span>
    </a>
  `).join('');

  // Delegate card clicks → open the food dialog. Attached after the
  // HTML is written into the page by the caller; one delegated listener
  // covers every card across every section.
  queueMicrotask(() => {
    const root = document.getElementById('vocab-page-content');
    if (!root || root.dataset.foodClicksWired) return;
    root.dataset.foodClicksWired = '1';
    root.addEventListener('click', e => {
      const card = e.target.closest('[data-food-section]');
      if (!card) return;
      const sec = FOOD_GALLERY.find(s => s.id === card.dataset.foodSection);
      const it  = sec && sec.items[+card.dataset.foodIdx];
      if (it) openFoodDialog(sec, it);
    });
  });

  return `
    <div class="book-frame food-gallery-frame">
      <span class="corner-tl"></span><span class="corner-tr"></span>
      <header class="food-gallery-head">
        <div class="page-eyebrow">food vocabulary · 食べ物</div>
        <h1 class="page-title-jp">食べ物の絵</h1>
        <div class="page-title-en">A reference set of dishes and drinks you'll find at the restaurants in this book. Tap any card for a short cultural note.</div>
        <nav class="food-nav">${navHTML}</nav>
      </header>
      <div class="rule"></div>
      ${sections}
    </div>
  `;
}

// ── Food dialog ──────────────────────────────────────────────────────
// Small modal anchored to the body root. Shows the chosen dish's SVG,
// JP + reading + EN, and the cultural note from FOOD_GALLERY. Closes
// on backdrop click, the × button, or Escape.
function openFoodDialog(section, item) {
  closeFoodDialog();
  const wrap = document.createElement('div');
  wrap.className = 'food-modal-backdrop';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.innerHTML = `
    <div class="food-modal" tabindex="-1">
      <button class="food-modal-close" aria-label="Close" type="button">×</button>
      <div class="food-modal-head">
        <div class="food-modal-svg">
          <img src="images/food/${escAttr(item.file)}" alt="" />
        </div>
        <div class="food-modal-title">
          <div class="food-modal-section">${escHTML(section.titleJa)} · ${escHTML(section.titleEn)}</div>
          <div class="food-modal-ja">${escHTML(item.ja)}</div>
          ${item.kana ? `<div class="food-modal-kana">${escHTML(item.kana)}</div>` : ''}
          <div class="food-modal-en">${escHTML(item.en)}</div>
        </div>
      </div>
      <div class="food-modal-body">
        ${item.explainJa ? `<p class="food-modal-ja-body">${escHTML(item.explainJa)}</p>` : ''}
        ${item.explain   ? `<p class="food-modal-en-body">${escHTML(item.explain)}</p>` : ''}
        ${!item.explainJa && !item.explain ? `<p class="food-modal-ja-body">${escHTML('まだメモがありません。')}</p>` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  // Focus the dialog so Escape works without an extra click.
  const dlg = wrap.querySelector('.food-modal');
  if (dlg) dlg.focus();

  const onClick = e => {
    if (e.target === wrap || e.target.classList.contains('food-modal-close')) {
      closeFoodDialog();
    }
  };
  const onKey = e => {
    if (e.key === 'Escape') closeFoodDialog();
  };
  wrap.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  wrap._cleanup = () => {
    wrap.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
}
function closeFoodDialog() {
  const existing = document.querySelector('.food-modal-backdrop');
  if (!existing) return;
  if (typeof existing._cleanup === 'function') existing._cleanup();
  existing.remove();
}

// Direct-launch a specific restaurant by id (no random roll, no
// reroll button). Used by the "fast food" sidebar group — when the
// player clicks マック or ケンタ, they land straight in that scene
// flow instead of going through the random experience. Each fast
// food book has its own scene state keyed by the restaurant id, so
// pausing mid-order at KFC then visiting McDonald's saves both flows
// independently.
function renderForcedRestaurant(restaurantId) {
  const el = document.getElementById('vocab-page-content');
  if (!el) return;
  const restaurants = window.EATING_OUT_RESTAURANTS || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    el.innerHTML = `<div class="empty-state">Restaurant '${escHTML(restaurantId)}' not found.</div>`;
    return;
  }
  const scene = resolveScene(restaurant);
  if (!scene) {
    el.innerHTML = `<div class="empty-state">Scene template missing for ${escHTML(restaurant.template || restaurant.id)}.</div>`;
    return;
  }
  // Use a book object whose id matches the restaurant id — that keys
  // scene state under jp:scenes[restaurantId], same shape the
  // Experience roll uses. The two share state by design: if you've
  // already started a McDonald's order via the random roller, opening
  // the McDonald's book picks up where you left off (and vice versa).
  const fakeBook = { id: restaurant.id, titleEn: restaurant.name.en, titleJa: restaurant.name.ja };
  renderRestaurantScene(fakeBook, scene);
}

function renderExperience() {
  const el = document.getElementById('vocab-page-content');
  if (!el) return;
  const state = experienceState();
  const restaurants = window.EATING_OUT_RESTAURANTS || [];

  // If the last visit completed the scene (hit the receipt and the user
  // walked away), re-entering the experience rolls a fresh restaurant
  // instead of dropping back into the finished receipt.
  if (state.completed && state.restaurantId) {
    state.completed = false;
    state.restaurantId = null;
    saveExperienceState();
  }

  let restaurant = restaurants.find(r => r.id === state.restaurantId);
  if (!restaurant) {
    restaurant = pickRandomRestaurant();
    if (!restaurant) {
      el.innerHTML = `<div class="empty-state">No restaurants registered.</div>`;
      return;
    }
    state.restaurantId = restaurant.id;
    saveExperienceState();
    if (APP.scenes && APP.scenes[restaurant.id]) {
      APP.scenes[restaurant.id] = freshSceneState();
      saveSceneState();
    }
  }
  const scene = resolveScene(restaurant);
  if (!scene) {
    el.innerHTML = `<div class="empty-state">Scene template missing for ${escHTML(restaurant.template || restaurant.id)}.</div>`;
    return;
  }
  const fakeBook = { id: restaurant.id, titleEn: restaurant.name.en, titleJa: restaurant.name.ja };
  renderRestaurantScene(fakeBook, scene);
  // renderRestaurantScene calls applyExperienceOverlays at the end when
  // inExperienceBook() returns true — so the overlays are kept in sync on
  // every internal re-render (not just this top-level call).
}

// ── Restaurant scenes engine ─────────────────────────────────────────
// A small state machine for the interactive "ordering at a restaurant"
// vocab experiences. Each scene is a step-array (defined in data.js as
// RESTAURANT_SCENES). The engine walks one step at a time, handling user
// choices, randomized NPC variants, and per-book persistent state.
//
// State shape (per book.id):
//   { stepIdx, history, selected, choices, npcVariants, addPrice, payment, waitLine }
// - stepIdx       index into scene.steps
// - history       stack of stepIdx for the back button
// - selected      menu items chosen
// - choices       { stepId: choice object } — what the user said
// - npcVariants   { stepId: variantIdx } — sticky random NPC line per visit
// - addPrice      extra yen from kaedama / sides added mid-scene
// - payment       'cash' | 'card'
// - waitLine      index into the wait step's narrative lines (random)

function freshSceneState() {
  return { stepIdx:0, history:[], selected:[], choices:{}, npcVariants:{}, addPrice:0, payment:null, waitLine:0, sizes:{} };
}

// ── Sized-item helpers ─────────────────────────────────────────────
// Some items declare a `sizes` array (KFC chicken buckets, fries).
// After the player picks a size in the sizes step, the choice lives
// at state.sizes[item.id]. These helpers resolve the *effective*
// price + display label, falling back to the item's base values when
// no size is chosen yet.
function pickedSize(item, state) {
  if (!item || !item.sizes || !state || !state.sizes) return null;
  const sizeId = state.sizes[item.id];
  if (!sizeId) return null;
  return item.sizes.find(s => s.id === sizeId) || null;
}
function itemPrice(item, state) {
  const sz = pickedSize(item, state);
  return sz ? sz.price : (item.price || 0);
}
function itemDisplayKanji(item, state) {
  const sz = pickedSize(item, state);
  if (sz) return item.kanji + ' ' + sz.label;
  return item.kanji;
}
function itemFurigana(item, state) {
  // When a size is picked, append the size label to the furigana too
  // so the ご注文 readout retains the kanji + size formatting.
  const sz = pickedSize(item, state);
  if (sz && item.furigana) return item.furigana + ' ' + sz.label;
  if (sz) return null; // no original furigana — fall through to kanji
  return item.furigana || null;
}

function sceneStateFor(bookId) {
  if (!APP.scenes) APP.scenes = lsGet('jp:scenes', {});
  if (!APP.scenes[bookId]) {
    APP.scenes[bookId] = freshSceneState();
  } else {
    // Backfill fields added to freshSceneState() after this state was
    // persisted. A localStorage 'jp:scenes' entry written before, e.g.,
    // npcVariants existed would otherwise throw on first read
    // (state.npcVariants[stepId], state.history.push(...), state.selected.map).
    // Existing values win; only absent keys take the fresh default.
    APP.scenes[bookId] = { ...freshSceneState(), ...APP.scenes[bookId] };
  }
  return APP.scenes[bookId];
}

function saveSceneState() {
  lsSet('jp:scenes', APP.scenes || {});
}

// Personality-compatible filter — items can declare a `personality`
// (string or array). Missing = universal. Returns true if compatible.
function isPersonalityMatch(field, restaurantPersonality) {
  if (!field) return true; // no constraint = universal
  if (Array.isArray(field)) return field.includes(restaurantPersonality);
  return field === restaurantPersonality;
}

// Sticky random pick — once chosen for this step in this scene state, the
// same variant is returned on re-render. Restart resets the state map.
// When a scene has a personality, NPC variants are filtered to those that
// match (with universal variants always included). Falls back to the full
// list if filtering would leave nothing.
function sceneVariant(state, stepId, items, scene = null) {
  if (!items || !items.length) return null;
  let pool = items;
  const personality = scene && scene.personality;
  if (personality) {
    const compatible = items.filter(i => isPersonalityMatch(i.personality, personality));
    if (compatible.length) pool = compatible;
  }
  if (state.npcVariants[stepId] == null) {
    state.npcVariants[stepId] = Math.floor(Math.random() * pool.length);
  }
  // Modulo guards against stale indices when the pool shrinks between
  // renders (e.g., reroll changes personality).
  return pool[state.npcVariants[stepId] % pool.length];
}

// Build a "you ordered X and Y" string from selected items (kanji form).
// Sized items include the chosen size label inline (e.g. "オリジナルチキン 4ピースパック").
function sceneOrderText(state) {
  return state.selected.map(s => itemDisplayKanji(s, state)).join(' と ');
}
function sceneTotal(state) {
  return state.selected.reduce((sum, item) => sum + itemPrice(item, state), 0) + (state.addPrice || 0);
}

// Replace {items} and {total} placeholders in NPC/template strings.
function sceneInterp(str, state) {
  if (!str) return '';
  return str
    .replace(/\{items\}/g, sceneOrderText(state) || '—')
    .replace(/\{total\}/g, sceneTotal(state).toLocaleString());
}

function gotoStep(scene, state, stepId) {
  let idx = scene.steps.findIndex(s => s.id === stepId);
  if (idx < 0) {
    // Unknown target id (a `next`/`choice.next` typo, or a step that was
    // removed from the scene data). Previously this returned silently, leaving
    // the Next button doing nothing — an unrecoverable dead-end. Fall back to
    // the next sequential step instead, mirroring the falsy-`next` branch in
    // the step handlers, so a data error degrades to linear progression.
    console.warn(`gotoStep: step id "${stepId}" not found in scene "${scene.id || '?'}"; advancing sequentially`);
    idx = Math.min(state.stepIdx + 1, scene.steps.length - 1);
  }
  state.history.push(state.stepIdx);
  state.stepIdx = idx;
  saveSceneState();
}

function sceneBack(state) {
  if (!state.history.length) return;
  state.stepIdx = state.history.pop();
  saveSceneState();
}

function sceneRestart(bookId) {
  APP.scenes[bookId] = freshSceneState();
  saveSceneState();
}

// Typewriter reveal — walks the rendered DOM of a dialogue line, wraps
// each visible character in a transparent span, and stages fade-ins at
// `perCharMs` intervals. Ruby blocks (<ruby><rt>) are treated as a single
// atom so the reading guide doesn't reveal mid-word.
// Respects prefers-reduced-motion (shows everything instantly).
function typewriterReveal(el, perCharMs = 64) {
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const atoms = [];
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text) return;
      const parent = node.parentNode;
      const frag = document.createDocumentFragment();
      for (const ch of [...text]) {
        if (ch === '\n' || ch === '\r') { frag.appendChild(document.createTextNode(ch)); continue; }
        if (ch === ' ' || ch === '　') { frag.appendChild(document.createTextNode(ch)); continue; }
        const s = document.createElement('span');
        s.className = 'typewriter-atom';
        s.textContent = ch;
        frag.appendChild(s);
        atoms.push(s);
      }
      parent.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'RUBY') {
        node.classList.add('typewriter-atom');
        atoms.push(node);
      } else {
        for (const child of [...node.childNodes]) walk(child);
      }
    }
  };
  walk(el);
  atoms.forEach((atom, i) => {
    setTimeout(() => atom.classList.add('is-shown'), i * perCharMs);
  });
}

// ── Step renderers — small per-type HTML builders ────────────────────
// Each returns a snippet that goes inside .scene-body. Wiring (clicks)
// happens in attachSceneHandlers after innerHTML.

// Bilingual line: Japanese visible, English revealed on hover/tap.
// Optional 4th arg `furigana` is pre-baked <ruby>…<rt>…</rt></ruby> HTML;
// when APP.showFurigana is on AND the line provides it, render that instead
// of the plain ja string. Furigana strings are author-controlled HTML so
// they're injected verbatim; ja strings get escHTML escaping.
function jpLineHTML(ja, en, cls = '', furigana = null) {
  const showFuri = APP.showFurigana && furigana;
  const content = showFuri ? furigana : escHTML(ja);
  return `<span class="jp-line ${cls}${showFuri ? ' has-furi' : ''}" data-en="${escAttr(en || '')}">${content}</span>`;
}
// Same idea for short standalone bits of Japanese inside templates.
function jpFuriHTML(ja, furigana) {
  return (APP.showFurigana && furigana) ? furigana : escHTML(ja);
}

function npcBlockHTML(scene, state, step, opts = {}) {
  let npc = step.npc;
  if (npc && npc.variants) {
    npc = sceneVariant(state, step.id, npc.variants, scene) || npc;
  }
  if (!npc) return '';
  const ja = sceneInterp(npc.ja, state);
  const en = sceneInterp(npc.en, state);
  const furigana = npc.furigana ? sceneInterp(npc.furigana, state) : null;
  // Long dialogue flows into two columns instead of expanding the bubble
  // tall enough to need scroll. Threshold tuned to roughly the point where
  // single-column wrap exceeds 3 lines at the current font size.
  const isLong = (ja || '').length > 60;
  return `
    <div class="scene-npc${opts.shout ? ' scene-npc-shout' : ''}" data-npc-speak="${escAttr(ja || '')}">
      ${opts.shout ? shoutLinesSVG() : ''}
      <div class="scene-npc-avatar" title="${escAttr(scene.npc.nameJa)}">${escHTML(scene.npc.glyph)}</div>
      <div class="scene-npc-bubble${isLong ? ' is-long' : ''}">
        <button class="tts-btn" type="button" aria-label="読み上げ" title="読み上げ"
                data-speak="${escAttr(ja || '')}">${speakerIconSVG()}</button>
        ${jpLineHTML(ja, en, 'scene-npc-line', furigana)}
      </div>
    </div>`;
}

function narrativeHTML(text) {
  if (!text) return '';
  return `<div class="scene-narrative">${jpLineHTML(text.ja, text.en, '', text.furigana)}</div>`;
}

function choicesHTML(choices, dataAttr = 'data-choice', scene = null) {
  if (!choices || !choices.length) return '';
  // Filter by personality if the scene declares one — keeps the player's
  // response options socially appropriate for the shop's vibe (no formal
  // keigo at the gruff stand-up bar, no casual greetings at the omakase
  // counter). Universal choices (no personality field) always show.
  let pool = choices;
  const personality = scene && scene.personality;
  if (personality) {
    const compatible = choices.filter(c => isPersonalityMatch(c.personality, personality));
    if (compatible.length) pool = compatible;
  }
  // The dataAttr index needs to match the ORIGINAL choices array so the
  // handler resolves the right choice. Track original indices.
  const indexed = pool.map(c => ({ c, i: choices.indexOf(c) }));
  return `
    <div class="scene-choices">
      ${indexed.map(({ c, i }) => `
        <button class="scene-choice" ${dataAttr}="${i}">
          <span class="ja">${jpFuriHTML(c.ja, c.furigana)}</span>
          ${c.kana ? `<span class="kana">${escHTML(c.kana)}</span>` : ''}
          <span class="en">${escHTML(c.en)}</span>
        </button>
      `).join('')}
    </div>`;
}

// ── Cover step — visual selector / decision panel ──────────────────
// Shows the restaurant's cover image (or a placeholder when no file exists)
// with the shop name + category pill overlay, plus enter / different-shop
// buttons. The first screen before any interaction.
function coverStepHTML(scene, state, step) {
  const r = step.restaurant;
  if (!r) return '<div class="empty-state">No restaurant data</div>';
  const id = r.id;
  // The cover artwork carries its own typography (shop name on the noren,
  // lantern, awning, etc.) and that storefront detail is the whole point of
  // the cover step. We intentionally render nothing on top of it — no
  // eyebrow, no category tag, no name card. The chrome around the frame
  // (scene header with shop name, step counter, controls; action buttons
  // below) is enough context. The image is the cover.
  return `
    <div class="cover-step">
      <div class="cover-frame">
        <img class="cover-img" src="images/eating%20out/${escAttr(id)}.webp"
             onerror="if(!this.src.endsWith('placeholder.svg')){this.src='images/covers/placeholder.svg';this.dataset.placeholder='1';}" />
      </div>
      <div class="cover-actions">
        <button class="scene-next cover-enter" data-scene-next>入る →</button>
        <button class="scene-cover-reroll" data-experience-reroll-inline>別の店 (different shop)</button>
      </div>
    </div>
  `;
}

// ── Monologue step — inner thoughts before approaching the staff ──
// Brief Japanese-language context about the restaurant type, expected
// behavior, register. Helps the player frame the upcoming interaction.
function monologueStepHTML(scene, state, step) {
  const m = step.monologue || { ja:'(no notes)', en:'(no notes)' };
  return `
    <div class="monologue-step">
      <div class="monologue-card">
        <div class="monologue-eyebrow">心の中で · inner thoughts</div>
        <div class="monologue-text">
          ${jpLineHTML(m.ja, m.en, 'monologue-line', m.furigana)}
        </div>
      </div>
      <div class="cover-actions">
        <button class="scene-next" data-scene-next>${jpLineHTML('準備OK', 'ready', '', '<ruby>準備<rt>じゅんび</rt></ruby>OK')} →</button>
      </div>
    </div>
  `;
}

// ── Look-around step — atmospheric pause between order and food ──
// Shows an inside-the-shop image while the player "looks around" while
// waiting. Sits between order and wait/receive. Brief narrative + continue.
function lookAroundStepHTML(scene, state, step) {
  const r = step.restaurant;
  const id = r && r.id;
  return `
    <div class="lookaround-step">
      <div class="lookaround-frame">
        <img class="lookaround-img" src="images/eating%20out/${escAttr(id)}-inside.webp"
             onerror="if(!this.src.endsWith('placeholder.svg')){this.src='images/inside/placeholder.svg';this.dataset.placeholder='1';}" />
      </div>
      <div class="lookaround-narrative">
        ${jpLineHTML('店内を見渡す。', 'You look around the shop.', '', '<ruby>店内<rt>てんない</rt></ruby>を<ruby>見渡<rt>みわた</rt></ruby>す。')}
      </div>
      <div class="cover-actions">
        <button class="scene-next" data-scene-next>${jpLineHTML('続ける', 'continue', '', '<ruby>続<rt>つづ</rt></ruby>ける')} →</button>
      </div>
    </div>
  `;
}

// ── Cashier-image block ──────────────────────────────────────────────
// A 16:9 image used by konbini steps (order + change) in place of the
// per-step SVG. Files live at images/eating out/<name>.png; falls back
// through .jpg and finally to the shared scene-placeholder.svg so the
// flow keeps working before the user drops real art in.
function cashierImageBlock(name) {
  if (!name) return '';
  return `
    <div class="cashier-frame">
      <img class="cashier-img" src="images/eating%20out/${escAttr(name)}.webp"
           onerror="if(!this.src.endsWith('scene-placeholder.svg')){this.src='images/eating%20out/scene-placeholder.svg';this.dataset.placeholder='1';}" alt="" />
    </div>
  `;
}

// ── Change calculator ────────────────────────────────────────────────
// Round the bill UP to a realistic payment (next 500 or next 1000) and
// return both the payment offered + the change due. Result is memoized
// on the scene state so paging back and forth doesn't reshuffle the
// rounding decision.
function computeChange(state, total) {
  if (state._cashChange && state._cashChange.total === total) {
    return state._cashChange;
  }
  let payment;
  if (total <= 0) {
    payment = 0;
  } else if (total % 1000 === 0) {
    // Exact round thousand — pay one extra 1000 just so there's a
    // visible change interaction (otherwise the screen is empty).
    payment = total + 1000;
  } else {
    const next500  = Math.ceil(total / 500)  * 500;
    const next1000 = Math.ceil(total / 1000) * 1000;
    // Bias toward the next 1000 on larger bills (more realistic — you
    // don't carry that many 500-yen coins for a 4000-yen bill).
    if (total >= 5000) {
      payment = next1000;
    } else if (next500 === total) {
      payment = next1000;
    } else {
      payment = (Math.random() < 0.5) ? next500 : next1000;
    }
  }
  const change = payment - total;
  const result = { total, payment, change, breakdown: breakChange(change) };
  state._cashChange = result;
  saveSceneState();
  return result;
}

// Greedy-break the change amount into Japanese denominations.
// Returns [{ value, count }, …] in descending order — skips zeros.
function breakChange(amount) {
  const denoms = [10000, 5000, 1000, 500, 100, 50, 10, 5, 1];
  const out = [];
  let remaining = amount;
  for (const v of denoms) {
    const n = Math.floor(remaining / v);
    if (n > 0) {
      out.push({ value: v, count: n });
      remaining -= n * v;
    }
  }
  return out;
}

// Render a single bill or coin element. Bills are rectangular, coins
// are round. Colors approximate the real Japanese currency palette so
// the breakdown reads at a glance.
function moneyPieceHTML(value) {
  const isBill = value >= 1000;
  if (isBill) {
    return `<span class="money-bill money-bill-${value}" title="¥${value}"><span class="money-num">${value.toLocaleString()}</span><span class="money-mon">円</span></span>`;
  }
  const hole = (value === 50 || value === 5) ? '<span class="money-hole"></span>' : '';
  return `<span class="money-coin money-coin-${value}" title="¥${value}">${hole}<span class="money-num">${value}</span></span>`;
}

// ── Change step ──────────────────────────────────────────────────────
// Shown after the player pays with cash. Three rows of receipt-style
// numbers (bill / paid / change), then a visual breakdown of the change
// as individual bills and coins so the math is obvious.
function changeStepHTML(scene, state, step) {
  const total = sceneTotal(state);
  const { payment, change, breakdown } = computeChange(state, total);
  // Interpolate the NPC line with both payment + change.
  const fillTpl = (tpl) => (tpl || '')
    .replace(/\{total\}/g,    total.toLocaleString())
    .replace(/\{payment\}/g,  payment.toLocaleString())
    .replace(/\{change\}/g,   change.toLocaleString());
  const npc = step.npc || {};
  const npcJa = fillTpl(npc.ja);
  const npcEn = fillTpl(npc.en);
  const npcFuri = npc.furigana ? fillTpl(npc.furigana) : null;

  const breakdownHTML = change === 0
    ? `<div class="change-empty">${jpLineHTML('お釣りはありません。', 'No change.', '', 'お<ruby>釣<rt>つ</rt></ruby>りはありません。')}</div>`
    : breakdown.map(row => `
        <div class="change-row">
          <div class="change-row-pieces">
            ${Array(row.count).fill(0).map(() => moneyPieceHTML(row.value)).join('')}
          </div>
          <div class="change-row-label">
            <span class="change-denom">¥${row.value.toLocaleString()}</span>
            <span class="change-times">× ${row.count}</span>
          </div>
        </div>
      `).join('');

  return `
    ${cashierImageBlock(step.cashierImage)}
    <div class="scene-npc">
      <div class="scene-npc-avatar">${escHTML(scene.npc.glyph)}</div>
      <div class="scene-npc-bubble">${jpLineHTML(npcJa, npcEn, 'scene-npc-line', npcFuri)}</div>
    </div>
    <div class="change-ledger">
      <div class="change-ledger-row">
        <span class="change-ledger-label">${jpLineHTML('お会計', 'total', '', 'お<ruby>会計<rt>かいけい</rt></ruby>')}</span>
        <span class="change-ledger-value">¥${total.toLocaleString()}</span>
      </div>
      <div class="change-ledger-row">
        <span class="change-ledger-label">${jpLineHTML('お預かり', 'received', '', 'お<ruby>預<rt>あず</rt></ruby>かり')}</span>
        <span class="change-ledger-value">¥${payment.toLocaleString()}</span>
      </div>
      <div class="change-ledger-row change-ledger-result">
        <span class="change-ledger-label">${jpLineHTML('お釣り', 'change', '', 'お<ruby>釣<rt>つ</rt></ruby>り')}</span>
        <span class="change-ledger-value">¥${change.toLocaleString()}</span>
      </div>
    </div>
    <div class="change-breakdown">${breakdownHTML}</div>
    <div class="cover-actions">
      <button class="scene-next" data-scene-next>${jpLineHTML('受け取る', 'take it', '', '<ruby>受<rt>う</rt></ruby>け<ruby>取<rt>と</rt></ruby>る')} →</button>
    </div>
  `;
}

function dialogueStepHTML(scene, state, step) {
  // The very first NPC line of the scene gets the manga-shout effect.
  const isFirstGreeting = step.id === 'greet';
  return `
    ${narrativeHTML(step.narrative)}
    ${npcBlockHTML(scene, state, step, { shout: isFirstGreeting })}
    ${choicesHTML(step.choices, 'data-choice', scene)}
  `;
}

function menuStepHTML(scene, state, step) {
  const selectedIds = new Set(state.selected.map(s => s.kanji));

  // Brand-themed fast-food menu: colored board with stacked item cards,
  // big prices, brand-accent typography. Triggered by scene.brand (set
  // on KFC / McDonald's etc. via the restaurant data → resolveScene).
  if (scene.brand) {
    const b = scene.brand;
    // Inline custom properties so each chain gets its own palette
    // without a CSS-variable explosion. Sanitized via escAttr.
    const brandStyle = [
      `--brand-primary:${escAttr(b.primary || '#222')}`,
      `--brand-accent:${escAttr(b.accent || '#fff')}`,
      `--brand-badge:${escAttr(b.badge || '#fff')}`,
    ].join(';');
    return `
      ${narrativeHTML(step.prompt)}
      <div class="scene-menu scene-menu-brand" style="${brandStyle}">
        <div class="scene-menu-brand-head">
          <span class="brand-eyebrow">menu board</span>
          <span class="brand-label">${escHTML(b.label || '')}</span>
        </div>
        <div class="scene-menu-brand-grid">
          ${step.items.map((item, i) => {
            const picked = selectedIds.has(item.kanji);
            const isDrink = item.category === 'drink';
            const hasSizes = !!(item.sizes && item.sizes.length);
            // Sized items show "from ¥X〜" using the cheapest size so
            // the menu communicates "starts at this price, pick a
            // size next." Non-sized items show the flat price.
            const fromPrice = hasSizes
              ? Math.min(...item.sizes.map(s => s.price))
              : (item.price || 0);
            const priceLabel = hasSizes
              ? `¥${fromPrice.toLocaleString()}〜`
              : `¥${fromPrice.toLocaleString()}`;
            // When the item has an `id`, look up images/food/<id>.png for
            // a product shot. Falls back through .jpg and finally to the
            // 16:9 scene-placeholder so cards always have something in
            // the image slot.
            const imageBlock = item.id ? `
              <div class="brand-item-image">
                <img src="images/food/${escAttr(item.id)}.webp"
                     onerror="if(!this.src.endsWith('scene-placeholder.svg')){this.src='images/eating%20out/scene-placeholder.svg';this.dataset.placeholder='1';}"
                     data-id="${escAttr(item.id)}" alt="" loading="lazy" />
              </div>` : '';
            return `
              <button class="brand-item ${imageBlock ? 'has-image' : ''} ${picked ? 'is-picked' : ''} ${isDrink ? 'is-drink' : ''} ${hasSizes ? 'has-sizes' : ''}" data-menu-item="${i}">
                ${imageBlock}
                <span class="brand-item-name">${jpLineHTML(item.kanji, item.en, '', item.furigana)}</span>
                <span class="brand-item-kana">${escHTML(item.kana)}</span>
                <span class="brand-item-price">${priceLabel}</span>
                ${picked ? '<span class="brand-item-mark" aria-hidden="true">✓</span>' : ''}
              </button>`;
          }).join('')}
        </div>
      </div>
      <div class="scene-menu-foot">
        ${state.selected.length ? `
          <div class="scene-selection">
            <span class="eyebrow">${jpLineHTML('ご注文', 'your order', '', '<ruby>ご<rt>　</rt></ruby><ruby>注文<rt>ちゅうもん</rt></ruby>')}</span>
            <span class="scene-selection-text">${escHTML(sceneOrderText(state))}</span>
            <span class="scene-selection-total">¥${sceneTotal(state).toLocaleString()}</span>
          </div>
        ` : `
          <div class="scene-hint">${jpLineHTML('カウンターで注文する。', 'order at the counter', '', 'カウンターで<ruby>注文<rt>ちゅうもん</rt></ruby>する。')}</div>
        `}
        <button class="scene-next" data-scene-next ${state.selected.length === 0 ? 'disabled' : ''}>
          ${state.selected.length === 0
            ? jpLineHTML('一品以上', 'at least one', '', '<ruby>一品以上<rt>いっぴんいじょう</rt></ruby>')
            : jpLineHTML('注文する', 'order', '', '<ruby>注文<rt>ちゅうもん</rt></ruby>する') + ' →'}
        </button>
      </div>
    `;
  }

  // Default: paper-toned sit-down menu.
  return `
    ${narrativeHTML(step.prompt)}
    <div class="scene-menu">
      <div class="scene-menu-head">${jpLineHTML('お品書き', 'menu', '', '<ruby>お<rt>　</rt></ruby><ruby>品<rt>しな</rt></ruby><ruby>書<rt>が</rt></ruby>き')}</div>
      <ul class="scene-menu-list">
        ${step.items.map((item, i) => {
          const picked = selectedIds.has(item.kanji);
          return `
            <li class="scene-menu-row ${picked ? 'is-picked' : ''}" data-menu-item="${i}">
              <span class="m-kanji">${jpLineHTML(item.kanji, item.en, '', item.furigana)}</span>
              <span class="m-kana">${escHTML(item.kana)}</span>
              <span class="m-dots"></span>
              <span class="m-price">¥${item.price.toLocaleString()}</span>
              <span class="m-mark">${picked ? '✓' : ''}</span>
            </li>`;
        }).join('')}
      </ul>
    </div>
    <div class="scene-menu-foot">
      ${state.selected.length ? `
        <div class="scene-selection">
          <span class="eyebrow">${jpLineHTML('ご注文', 'your order', '', '<ruby>ご<rt>　</rt></ruby><ruby>注文<rt>ちゅうもん</rt></ruby>')}</span>
          <span class="scene-selection-text">${escHTML(sceneOrderText(state))}</span>
          <span class="scene-selection-total">¥${sceneTotal(state).toLocaleString()}</span>
        </div>
      ` : `
        <div class="scene-hint">${jpLineHTML('好きなものを選んでね。', 'pick whatever looks good', '', '<ruby>好<rt>す</rt></ruby>きなものを<ruby>選<rt>えら</rt></ruby>んでね。')}</div>
      `}
      <button class="scene-next" data-scene-next ${state.selected.length === 0 ? 'disabled' : ''}>
        ${state.selected.length === 0
          ? jpLineHTML('一品以上', 'at least one', '', '<ruby>一品以上<rt>いっぴんいじょう</rt></ruby>')
          : jpLineHTML('次へ', 'next', '', '<ruby>次<rt>つぎ</rt></ruby>へ') + ' →'}
      </button>
    </div>
  `;
}

function branchStepHTML(scene, state, step) {
  return `
    ${narrativeHTML(step.prompt)}
    ${choicesHTML(step.choices, 'data-branch', scene)}
  `;
}

// ── Sizes step (KFC chicken buckets, fries) ─────────────────────────
// Shown when the player picked items with a `sizes` array. Renders one
// size grid per sized item: each size card has its bucket SVG (or
// nothing for fries), the JP label, the kana reading (what the clerk
// says aloud), the EN gloss, and the price. Picked size highlights.
// "Next" unlocks only when every sized item has its size chosen.
function sizesStepHTML(scene, state, step) {
  const sized = state.selected.filter(it => it.sizes && it.sizes.length);
  if (!sized.length) {
    // Defensive fallback — shouldn't reach here normally.
    return `
      <div class="empty-state">${escHTML('No items need sizing.')}</div>
      <div class="scene-menu-foot">
        <button class="scene-next" data-scene-next>${jpLineHTML('次へ', 'next', '', '<ruby>次<rt>つぎ</rt></ruby>へ')} →</button>
      </div>
    `;
  }
  state.sizes = state.sizes || {};
  const allPicked = sized.every(it => state.sizes[it.id]);
  // NPC asks the size question — uses the step's own NPC block so it
  // reads as the clerk speaking at the counter, same shape as every
  // other dialogue beat in the flow.
  const npc = step.npc || {};
  const isBrand = !!scene.brand;
  return `
    <div class="scene-npc">
      <div class="scene-npc-avatar">${escHTML(scene.npc.glyph)}</div>
      <div class="scene-npc-bubble">${jpLineHTML(
        npc.ja || 'サイズはどうしますか?',
        npc.en || 'What size?',
        'scene-npc-line',
        npc.furigana || null
      )}</div>
    </div>
    <div class="sizes-step ${isBrand ? 'sizes-step-brand' : ''}">
      ${sized.map(item => {
        const chosenId = state.sizes[item.id];
        return `
          <section class="sizes-block">
            <header class="sizes-block-head">
              <span class="sizes-block-ja">${escHTML(item.kanji)}</span>
              <span class="sizes-block-en">${escHTML(item.en || '')}</span>
            </header>
            <div class="sizes-grid">
              ${item.sizes.map(s => {
                const picked = chosenId === s.id;
                return `
                  <button class="size-card ${picked ? 'is-picked' : ''}"
                          data-size-item="${escAttr(item.id)}"
                          data-size-id="${escAttr(s.id)}">
                    ${s.svg ? `
                      <span class="size-card-svg">
                        <img src="images/food/${escAttr(s.svg)}.webp" alt="" loading="lazy"
                             onerror="if(this.src.endsWith('.webp')){this.src='images/food/${escAttr(s.svg)}.svg';}" />
                      </span>
                    ` : `
                      <span class="size-card-letter">${escHTML(String(s.id).toUpperCase())}</span>
                    `}
                    <span class="size-card-name">${escHTML(s.label)}</span>
                    <span class="size-card-kana">${escHTML(s.kana)}</span>
                    <span class="size-card-en">${escHTML(s.en || '')}</span>
                    <span class="size-card-price">¥${s.price.toLocaleString()}</span>
                    ${picked ? '<span class="size-card-mark" aria-hidden="true">✓</span>' : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </section>
        `;
      }).join('')}
    </div>
    <div class="scene-menu-foot">
      ${allPicked ? `
        <div class="scene-selection">
          <span class="eyebrow">${jpLineHTML('ご注文', 'your order', '', '<ruby>ご<rt>　</rt></ruby><ruby>注文<rt>ちゅうもん</rt></ruby>')}</span>
          <span class="scene-selection-text">${escHTML(sceneOrderText(state))}</span>
          <span class="scene-selection-total">¥${sceneTotal(state).toLocaleString()}</span>
        </div>
      ` : `
        <div class="scene-hint">${jpLineHTML('サイズを全部選んでください', 'pick a size for each item', '', 'サイズを<ruby>全部<rt>ぜんぶ</rt></ruby><ruby>選<rt>えら</rt></ruby>んでください')}</div>
      `}
      <button class="scene-next" data-scene-next ${allPicked ? '' : 'disabled'}>
        ${jpLineHTML('注文する', 'order', '', '<ruby>注文<rt>ちゅうもん</rt></ruby>する')} →
      </button>
    </div>
  `;
}

// ── Shelf step (konbini) ─────────────────────────────────────────────
// Tabs across the top (KONBINI_SECTIONS), then a 2-column body: left is
// a 3:4 section "hero" image (a styled konbini-shelf illustration);
// right is a vertical list of items in that section. Each item row has
// a small thumbnail + kanji + kana + price. Click toggles into
// state.selected (same pool the menu step uses, so order/pay/receipt
// keep working). state.shelfTab persists the active section.
function shelfStepHTML(scene, state, step) {
  const sections = step.sections || [];
  if (!sections.length) return '<div class="empty-state">No sections.</div>';
  const activeId = state.shelfTab && sections.find(s => s.id === state.shelfTab)
    ? state.shelfTab : sections[0].id;
  const section = sections.find(s => s.id === activeId) || sections[0];
  const selectedIds = new Set(state.selected.map(s => s.id || s.kanji));

  const tabsHTML = sections.map(s => `
    <button class="shelf-tab ${s.id === activeId ? 'active' : ''}" data-shelf-tab="${escAttr(s.id)}">
      <span class="shelf-tab-glyph">${escHTML(s.glyph)}</span>
      <span class="shelf-tab-label">
        <span class="ja">${s.label.furigana || escHTML(s.label.ja)}</span>
        <span class="en">${escHTML(s.label.en)}</span>
      </span>
    </button>
  `).join('');

  const itemsHTML = (section.items || []).map((item, i) => {
    const picked = selectedIds.has(item.id || item.kanji);
    return `
      <button class="shelf-row ${picked ? 'is-picked' : ''}" data-shelf-item="${i}">
        <span class="shelf-row-img">
          <img src="images/konbini/${escAttr(item.id)}.webp"
               onerror="if(!this.src.endsWith('placeholder.svg')){this.src='images/konbini/placeholder.svg';this.dataset.placeholder='1';}"
               data-id="${escAttr(item.id)}" alt="" />
        </span>
        <span class="shelf-row-text">
          <span class="shelf-row-kanji">${jpLineHTML(item.kanji, item.en, '', item.furigana)}</span>
          <span class="shelf-row-kana">${escHTML(item.kana)}</span>
        </span>
        <span class="shelf-row-price">¥${item.price.toLocaleString()}</span>
        ${picked ? '<span class="shelf-row-mark">✓</span>' : ''}
      </button>
    `;
  }).join('');

  // Section hero: section-<id>.png lives next to the item thumbnails;
  // falls back to section-placeholder.svg if the section doesn't have
  // its own art yet (only onigiri ships with one today).
  const heroHTML = `
    <div class="shelf-hero">
      <img class="shelf-hero-img" src="images/konbini/section-${escAttr(section.id)}.webp"
           onerror="if(!this.src.endsWith('section-placeholder.svg')){this.src='images/konbini/section-placeholder.svg';this.dataset.placeholder='1';}"
           alt="" />
    </div>
  `;

  return `
    ${narrativeHTML(step.prompt)}
    <div class="scene-shelf">
      <div class="shelf-tabs" role="tablist">${tabsHTML}</div>
      <div class="shelf-body">
        ${heroHTML}
        <div class="shelf-list">${itemsHTML}</div>
      </div>
    </div>
    <div class="scene-menu-foot">
      ${state.selected.length ? `
        <div class="scene-selection">
          <span class="eyebrow">${jpLineHTML('カゴ', 'basket', '')}</span>
          <span class="scene-selection-text">${escHTML(sceneOrderText(state))}</span>
          <span class="scene-selection-total">¥${sceneTotal(state).toLocaleString()}</span>
        </div>
      ` : `
        <div class="scene-hint">${jpLineHTML('棚を見て、必要なものをカゴに入れる。', 'browse the shelves, drop what you need into the basket', '', '<ruby>棚<rt>たな</rt></ruby>を<ruby>見<rt>み</rt></ruby>て、<ruby>必要<rt>ひつよう</rt></ruby>なものをカゴに<ruby>入<rt>い</rt></ruby>れる。')}</div>
      `}
      <button class="scene-next" data-scene-next ${state.selected.length === 0 ? 'disabled' : ''}>
        ${state.selected.length === 0
          ? jpLineHTML('何か選んでね', 'pick something', '', '<ruby>何<rt>なに</rt></ruby>か<ruby>選<rt>えら</rt></ruby>んでね')
          : jpLineHTML('レジへ', 'to the register', '', 'レジへ') + ' →'}
      </button>
    </div>
  `;
}

function orderStepHTML(scene, state, step) {
  const itemsText = sceneOrderText(state);
  const playerJa = (step.template.ja || '').replace('{items}', itemsText);
  const playerEn = (step.template.en || '').replace('{items}', itemsText);
  const npcJa = sceneInterp(step.confirm.ja, state);
  const npcEn = sceneInterp(step.confirm.en, state);
  const playerFuri = step.template.furigana
    ? step.template.furigana.replace('{items}', escHTML(itemsText))
    : null;
  const npcFuri = step.confirm.furigana
    ? sceneInterp(step.confirm.furigana, state)
    : null;
  return `
    ${cashierImageBlock(step.cashierImage)}
    ${narrativeHTML(step.prompt)}
    <div class="scene-player-line">
      ${jpLineHTML(playerJa, playerEn, 'scene-player', playerFuri)}
    </div>
    <div class="scene-npc">
      <div class="scene-npc-avatar">${escHTML(scene.npc.glyph)}</div>
      <div class="scene-npc-bubble">${jpLineHTML(npcJa, npcEn, 'scene-npc-line', npcFuri)}</div>
    </div>
    <div class="scene-menu-foot">
      <button class="scene-next" data-scene-next>
        ${jpLineHTML('次へ', 'next', '', '<ruby>次<rt>つぎ</rt></ruby>へ')} →
      </button>
    </div>
  `;
}

function waitStepHTML(scene, state, step) {
  if (state.npcVariants[step.id] == null) {
    state.npcVariants[step.id] = Math.floor(Math.random() * step.lines.length);
  }
  const line = step.lines[state.npcVariants[step.id]];
  return `
    <div class="scene-wait">
      ${waitGionSVG()}
      <div class="scene-wait-line">${jpLineHTML(line.ja, line.en, '', line.furigana)}</div>
    </div>
    <div class="scene-menu-foot">
      <button class="scene-next" data-scene-next>
        ${jpLineHTML('次へ', 'next', '', '<ruby>次<rt>つぎ</rt></ruby>へ')} →
      </button>
    </div>
  `;
}

// Map ordered drink names → their SVG filenames in images/food/. Used by
// the receive step to render the drink(s) the player ordered alongside
// the food (real meals arrive together — drink + dish on one tray).
// Includes a few aliases (冷酒 / 熱燗 share the sake illustration; 水
// without お, etc.) so we don't have to be picky about how the menus
// spell each drink.
const DRINK_SVG_BY_KANJI = {
  '生ビール':   'drink-beer',
  '缶ビール':   'drink-beer-can',
  'ビール':     'drink-beer',
  'ハイボール': 'drink-highball',
  '日本酒':     'drink-sake',
  '冷酒':       'drink-sake',
  '熱燗':       'drink-sake',
  'お酒':       'drink-sake',
  'コーラ':     'drink-cola',
  'お水':       'drink-water',
  '水':         'drink-water',
  '炭酸水':     'drink-sparkling',
  'お茶':       'drink-tea',
  '緑茶':       'drink-tea',
  '白ワイン':   'drink-sake',  // no wine SVG yet — sake is the closest visual
};

function receiveStepHTML(scene, state, step) {
  // Only show vocab items the user actually ordered + a few atmospheric
  // extras (葱, 玉子) so the receive screen reflects their meal.
  const ramen = state.selected.find(s => s.category === 'ramen');
  const vocab = (step.vocab || []).filter(v => {
    if (['麺','スープ','葱'].includes(v.kanji)) return !!ramen;
    if (v.kanji === 'チャーシュー') return ramen && ramen.kanji !== '塩ラーメン';
    if (v.kanji === '玉子') return ramen && (ramen.kanji === '味噌ラーメン' || ramen.kanji === '醤油ラーメン');
    return true;
  });
  // Food visual — uses the step's svg key (overridden per-restaurant via
  // resolveScene). Steam shows when step.hot is true. When step.svg is
  // explicitly null (fast food — no matching illustration on hand), we
  // omit the image entirely so the receive screen reads as a clean
  // counter handoff instead of an unrelated bowl of ramen.
  const foodSvg = step.svg === null ? null : (step.svg || 'bowl-ramen');
  const hot = step.hot !== false && !!foodSvg; // no food image → no steam

  // Drink visuals — only shown when there's no full tray image. When a
  // tray photo (mcd-tray, kfc-tray) is provided, the composition already
  // shows food + drink together; rendering small drink SVGs on top
  // would just stack with the tray and confuse the eye.
  const drinks = [];
  if (!step.receiveImage) {
    const seenDrinks = new Set();
    for (const it of state.selected) {
      const svg = DRINK_SVG_BY_KANJI[it.kanji];
      if (svg && !seenDrinks.has(svg)) {
        seenDrinks.add(svg);
        drinks.push({ svg, kanji: it.kanji });
      }
    }
  }
  const drinksHTML = drinks.length ? `
    <div class="receive-drinks">
      ${drinks.map(d => `
        <div class="receive-drink" title="${escAttr(d.kanji)}">
          <img src="images/food/${escAttr(d.svg)}.webp" alt="${escAttr(d.kanji)}" loading="lazy"
               onerror="if(this.src.endsWith('.webp')){this.src='images/food/${escAttr(d.svg)}.svg';}" />
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <div class="scene-receive">
      <div class="receive-message">
        ${npcBlockHTML(scene, state, step)}
        ${narrativeHTML(step.narrative)}
      </div>
      <div class="receive-main">
        <div class="receive-food ${step.receiveImage ? 'has-tray-image' : ''}">
          ${hot && !step.receiveImage ? steamSVG() : ''}
          ${step.receiveImage
            ? `<img class="receive-tray-img" src="images/food/${escAttr(step.receiveImage)}.webp"
                    onerror="if(!this.src.endsWith('scene-placeholder.svg')){this.src='images/eating%20out/scene-placeholder.svg';this.dataset.placeholder='1';}"
                    alt="" loading="lazy" />`
            : foodSvg
              ? `<img class="food-img" src="images/food/${escAttr(foodSvg)}.webp" alt="" loading="lazy"
                      onerror="if(this.src.endsWith('.webp')){this.src='images/food/${escAttr(foodSvg)}.svg';}" />`
              : `<div class="receive-tray-placeholder">${jpLineHTML('トレー', 'tray', '', 'トレー')}</div>`
          }
          ${drinksHTML}
        </div>
        <div class="receive-vocab">
          <div class="receive-vocab-head">${escHTML(state.selected.map(s => s.kanji).join(' · ')) || '—'}</div>
          <ul class="receive-vocab-list">
            ${vocab.map(v => `
              <li class="scene-vocab-row">
                <span class="v-kanji">${jpFuriHTML(v.kanji, v.furigana)}</span>
                <span class="v-kana">${escHTML(v.kana)}</span>
                <span class="v-en">${escHTML(v.en)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
      <div class="receive-foot">
        <div class="scene-player-line">${jpLineHTML(step.prompt.ja, step.prompt.en, 'scene-player', step.prompt.furigana)}</div>
        <button class="scene-next" data-scene-next>
          ${jpLineHTML('次へ', 'next', '', '<ruby>次<rt>つぎ</rt></ruby>へ')} →
        </button>
      </div>
    </div>
  `;
}

function payStepHTML(scene, state, step) {
  const total = sceneTotal(state);
  const npcJa = step.npc.ja.replace('{total}', total.toLocaleString());
  const npcEn = step.npc.en.replace('{total}', total.toLocaleString());
  const npcFuri = step.npc.furigana
    ? step.npc.furigana.replace('{total}', escHTML(total.toLocaleString()))
    : null;
  return `
    <div class="scene-npc">
      <div class="scene-npc-avatar">${escHTML(scene.npc.glyph)}</div>
      <div class="scene-npc-bubble">${jpLineHTML(npcJa, npcEn, 'scene-npc-line', npcFuri)}</div>
    </div>
    <div class="scene-total-card">
      <span class="eyebrow">${jpLineHTML('合計', 'total', '', '<ruby>合計<rt>ごうけい</rt></ruby>')}</span>
      <span class="scene-total-yen">¥${total.toLocaleString()}</span>
    </div>
    ${choicesHTML(step.choices, 'data-pay', scene)}
  `;
}

function goodbyeStepHTML(scene, state, step) {
  return `
    ${npcBlockHTML(scene, state, step)}
    ${choicesHTML(step.choices, 'data-choice', scene)}
  `;
}

function receiptStepHTML(scene, state, step) {
  const total = sceneTotal(state);
  const vocab = state.selected.map(s => ({ kanji:s.kanji, kana:s.kana, en:s.en, furigana:s.furigana }));
  return `
    <div class="scene-receipt">
      <div class="receipt-shop">${escHTML(scene.npc.nameJa)}・${escHTML(scene.setting.ja)}</div>
      <div class="receipt-rule"></div>
      <div class="receipt-section">
        <div class="receipt-label">${jpLineHTML('ご注文', 'your order', '', '<ruby>ご<rt>　</rt></ruby><ruby>注文<rt>ちゅうもん</rt></ruby>')}</div>
        <ul class="receipt-lines">
          ${state.selected.map(s => `
            <li>
              <span>${jpFuriHTML(s.kanji, s.furigana)}</span>
              <span class="dot-line"></span>
              <span>¥${s.price.toLocaleString()}</span>
            </li>
          `).join('')}
          ${state.addPrice ? `
            <li><span>${jpFuriHTML('替え玉', '<ruby>替<rt>か</rt></ruby>え<ruby>玉<rt>だま</rt></ruby>')}</span><span class="dot-line"></span><span>¥${state.addPrice.toLocaleString()}</span></li>
          ` : ''}
        </ul>
      </div>
      <div class="receipt-total">
        <span>${jpFuriHTML('合計', '<ruby>合計<rt>ごうけい</rt></ruby>')}</span>
        <span class="dot-line"></span>
        <span>¥${total.toLocaleString()}</span>
      </div>
      <div class="receipt-section">
        <div class="receipt-label">${jpLineHTML('学んだ言葉', 'vocabulary learned', '', '<ruby>学<rt>まな</rt></ruby>んだ<ruby>言葉<rt>ことば</rt></ruby>')}</div>
        <ul class="receipt-vocab">
          ${vocab.map(v => `
            <li>
              <span class="rv-kanji">${jpFuriHTML(v.kanji, v.furigana)}</span>
              <span class="rv-kana">${escHTML(v.kana)}</span>
              <span class="rv-en">${escHTML(v.en)}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ${state.payment ? `
        <div class="receipt-foot">${jpFuriHTML('お支払い', '<ruby>お<rt>　</rt></ruby><ruby>支払<rt>しはら</rt></ruby>い')}: ${state.payment === 'cash' ? jpFuriHTML('現金', '<ruby>現金<rt>げんきん</rt></ruby>') : 'カード'}</div>
      ` : ''}
    </div>
    <div class="scene-menu-foot scene-menu-foot-receipt">
      <button class="scene-next" data-scene-restart>もう一度 · play again</button>
    </div>
  `;
}

// ── SVG helpers — manga-style atmosphere ─────────────────────────────
// Steam wisps: three curling paths that rise from the bowl-card head.
// Each wisp has its own delay so the staggered loop feels alive. CSS
// handles the animation; SVG is just the path geometry.
function steamSVG() {
  return `
    <svg class="scene-steam" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path class="steam-wisp steam-wisp-1" d="M30 70 Q26 50 34 40 T28 14" fill="none"/>
      <path class="steam-wisp steam-wisp-2" d="M60 72 Q56 50 64 38 T58 8"  fill="none"/>
      <path class="steam-wisp steam-wisp-3" d="M90 70 Q86 52 92 40 T88 18" fill="none"/>
    </svg>`;
}

// Manga shout / 集中線 (concentration lines) — radial ink-strokes that
// burst behind the NPC bubble on the greeting step only. CSS plays the
// burst once on enter, then fades it out.
function shoutLinesSVG() {
  const lines = [];
  for (let i = 0; i < 18; i++) {
    const angle = (360 / 18) * i + (i % 2 === 0 ? 0 : 5);
    lines.push(`<line x1="50" y1="50" x2="${50 + Math.cos(angle * Math.PI / 180) * 60}" y2="${50 + Math.sin(angle * Math.PI / 180) * 60}" />`);
  }
  return `
    <svg class="scene-shout" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${lines.join('')}
    </svg>`;
}

// 擬音 (gion / onomatopoeia) floating during the wait step — small
// katakana drift in then fade. Different beats per visit.
function waitGionSVG() {
  const beats = ['シュッ', 'ジュー', 'コトコト', 'ポン'];
  // Anchor on the wait variant index already chosen in state — keeps the
  // sound effect in sync with the narrative line. State isn't accessible
  // here directly, so just rotate through the beats by Math.random; the
  // wait step's npcVariants already locks in the parent line.
  const beat = beats[Math.floor(Math.random() * beats.length)];
  return `<div class="scene-gion" aria-hidden="true">${escHTML(beat)}</div>`;
}

function sceneStubHTML(book, scene) {
  return `
    <div class="scene-frame scene-frame-stub">
      <div class="scene-stub-eyebrow">coming soon</div>
      <h2 class="scene-stub-title">${escHTML(book.titleJa)} · ${escHTML(book.titleEn)}</h2>
      <p class="scene-stub-text">${escHTML(scene.planned || 'An interactive ordering experience for this place is on the way.')}</p>
    </div>
  `;
}

// Top-level scene renderer.
function renderRestaurantScene(book, scene) {
  const el = document.getElementById('vocab-page-content');
  if (!el) return;
  if (scene.stub) {
    el.innerHTML = sceneStubHTML(book, scene);
    return;
  }
  const state = sceneStateFor(book.id);
  if (state.stepIdx >= scene.steps.length) state.stepIdx = 0;
  const step = scene.steps[state.stepIdx];
  const totalSteps = scene.steps.length;
  const stepInner = (function () {
    switch (step.type) {
      case 'cover':      return coverStepHTML(scene, state, step);
      case 'monologue':  return monologueStepHTML(scene, state, step);
      case 'lookAround': return lookAroundStepHTML(scene, state, step);
      case 'dialogue':   return dialogueStepHTML(scene, state, step);
      case 'menu':       return menuStepHTML(scene, state, step);
      case 'shelf':      return shelfStepHTML(scene, state, step);
      case 'sizes':      return sizesStepHTML(scene, state, step);
      case 'branch':     return branchStepHTML(scene, state, step);
      case 'order':      return orderStepHTML(scene, state, step);
      case 'change':     return changeStepHTML(scene, state, step);
      case 'wait':       return waitStepHTML(scene, state, step);
      case 'receive':    return receiveStepHTML(scene, state, step);
      case 'pay':        return payStepHTML(scene, state, step);
      case 'goodbye':    return goodbyeStepHTML(scene, state, step);
      case 'receipt':    return receiptStepHTML(scene, state, step);
      default:           return `<div class="empty-state">Unknown step: ${escHTML(step.type)}</div>`;
    }
  })();
  // SVG silhouette anchor — sits above the step content, gives the panel
  // a manga-page feel. Skipped on `receipt`, `receive`, `cover`,
  // `monologue`, `lookAround` (those use their own focal visuals or are
  // text-focused), and when the step has svg: null.
  const skipSvg = step.type === 'receipt'
              || step.type === 'receive'
              || step.type === 'cover'
              || step.type === 'monologue'
              || step.type === 'lookAround'
              || step.type === 'shelf'
              || step.type === 'sizes'
              || step.type === 'change'
              || !!step.cashierImage
              || step.svg === null
              || step.svg === undefined;
  const svgBlock = skipSvg ? '' : `
    <div class="scene-svg">
      <img src="images/food/${escAttr(step.svg)}.webp" alt="" loading="lazy"
           onerror="if(this.src.endsWith('.webp')){this.src='images/food/${escAttr(step.svg)}.svg';}" />
    </div>`;
  const stepBody = svgBlock + stepInner;
  el.innerHTML = `
    <div class="scene-frame">
      <div class="scene-head">
        <div class="scene-head-left">
          <span class="scene-head-place">${jpLineHTML(scene.setting.ja, scene.setting.en)}</span>
        </div>
        <div class="scene-head-progress">
          <span class="scene-step-num">${state.stepIdx + 1}</span>
          <span class="scene-step-sep">/</span>
          <span class="scene-step-total">${totalSteps}</span>
        </div>
        <div class="scene-head-right">
          <button class="scene-control ${APP.showFurigana ? 'is-on' : ''}" data-scene-furi title="ふりがな (furigana toggle)" aria-label="Toggle furigana">ふ</button>
          <button class="scene-control" data-scene-back ${state.history.length === 0 ? 'disabled' : ''} title="戻る (back)" aria-label="Back">←</button>
          <button class="scene-control" data-scene-restart title="やり直す (restart)" aria-label="Restart">↻</button>
        </div>
      </div>
      <div class="scene-body">${stepBody}</div>
    </div>
  `;

  // Typewriter reveal — only when the step actually advanced (not on
  // re-renders triggered by selection, furigana toggle, or menu pick).
  // Targets dialogue lines, narrative prose, and the wait/player lines.
  // Also triggers the food-arrival animation on the receive step.
  if (state._lastShownStep !== step.id) {
    state._lastShownStep = step.id;
    saveSceneState();
    const targets = el.querySelectorAll(
      '.scene-body .scene-npc-line, ' +
      '.scene-body .scene-narrative .jp-line, ' +
      '.scene-body .scene-wait-line, ' +
      '.scene-body .scene-player'
    );
    targets.forEach(t => typewriterReveal(t));
    // Food image arrival animation on receive step (only on entry).
    const foodImg = el.querySelector('.receive-food .food-img');
    if (foodImg) foodImg.classList.add('is-arriving');
  }

  // Wire up the active handlers for this step.
  el.querySelectorAll('[data-scene-back]').forEach(b => b.addEventListener('click', () => { sceneBack(state); renderRestaurantScene(book, scene); }));
  el.querySelectorAll('[data-scene-restart]').forEach(b => b.addEventListener('click', () => { sceneRestart(book.id); renderRestaurantScene(book, scene); }));
  el.querySelectorAll('[data-scene-furi]').forEach(b => b.addEventListener('click', () => {
    APP.showFurigana = !APP.showFurigana;
    lsSet('jp:showFurigana', APP.showFurigana);
    renderRestaurantScene(book, scene);
  }));
  el.querySelectorAll('[data-scene-next]').forEach(b => b.addEventListener('click', () => {
    // Special case: the menu step's next is 'sizes', but we only want to
    // visit the sizes step when the player picked items with sizes. If
    // nothing in the basket has a `sizes` array, jump straight to order.
    if (step.id === 'menu' && step.next === 'sizes') {
      const hasSized = state.selected.some(it => it.sizes && it.sizes.length);
      gotoStep(scene, state, hasSized ? 'sizes' : 'order');
    } else if (step.next) {
      gotoStep(scene, state, step.next);
    } else {
      state.stepIdx = Math.min(state.stepIdx + 1, scene.steps.length - 1);
    }
    saveSceneState();
    renderRestaurantScene(book, scene);
  }));
  // Generic choice (dialogue / goodbye) — just records and advances via step.next.
  el.querySelectorAll('[data-choice]').forEach(b => {
    b.addEventListener('click', () => {
      const idx = +b.dataset.choice;
      state.choices[step.id] = step.choices[idx];
      if (step.next) gotoStep(scene, state, step.next);
      saveSceneState();
      renderRestaurantScene(book, scene);
    });
  });
  // Branch choices — each carries its own `next`.
  el.querySelectorAll('[data-branch]').forEach(b => {
    b.addEventListener('click', () => {
      const idx = +b.dataset.branch;
      const choice = step.choices[idx];
      state.choices[step.id] = choice;
      if (choice.next) gotoStep(scene, state, choice.next);
      saveSceneState();
      renderRestaurantScene(book, scene);
    });
  });
  // Menu item picker — toggles selection.
  el.querySelectorAll('[data-menu-item]').forEach(row => {
    row.addEventListener('click', () => {
      const i = +row.dataset.menuItem;
      const item = step.items[i];
      const existing = state.selected.findIndex(s => s.kanji === item.kanji);
      if (existing >= 0) {
        const removed = state.selected.splice(existing, 1)[0];
        // If the removed item had a chosen size, clear that mapping too
        // so a re-pick starts fresh on the sizes step.
        if (removed && removed.id && state.sizes) delete state.sizes[removed.id];
      } else {
        const max = (step.pick && step.pick.max) || 1;
        if (state.selected.length >= max) {
          // Replace the last picked item to keep within max.
          const popped = state.selected.pop();
          if (popped && popped.id && state.sizes) delete state.sizes[popped.id];
        }
        state.selected.push(item);
      }
      saveSceneState();
      renderRestaurantScene(book, scene);
    });
  });
  // Size-card picker — records the chosen size for one item at a time.
  el.querySelectorAll('[data-size-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.sizeItem;
      const sizeId = btn.dataset.sizeId;
      state.sizes = state.sizes || {};
      state.sizes[itemId] = sizeId;
      saveSceneState();
      renderRestaurantScene(book, scene);
    });
  });
  // Shelf tab switcher — persists the active section across re-renders.
  el.querySelectorAll('[data-shelf-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.shelfTab = btn.dataset.shelfTab;
      saveSceneState();
      renderRestaurantScene(book, scene);
    });
  });
  // Shelf item picker — toggles into state.selected. Identifies by `id`
  // (konbini items have stable ids) and falls back to kanji match for
  // safety. Honors the shelf's pick.max if set.
  el.querySelectorAll('[data-shelf-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.shelfItem;
      const sections = step.sections || [];
      const activeId = state.shelfTab || (sections[0] && sections[0].id);
      const section = sections.find(s => s.id === activeId) || sections[0];
      const item = section && section.items[i];
      if (!item) return;
      const key = item.id || item.kanji;
      const existing = state.selected.findIndex(s => (s.id || s.kanji) === key);
      if (existing >= 0) {
        state.selected.splice(existing, 1);
      } else {
        const max = (step.pick && step.pick.max) || 6;
        if (state.selected.length >= max) state.selected.shift();
        state.selected.push(item);
      }
      saveSceneState();
      renderRestaurantScene(book, scene);
    });
  });
  // Pay choice — records payment + adds kaedama price already tracked.
  // Per-choice `next` takes precedence over step.next so cash payments
  // can divert to the change step while card/IC fall through to goodbye.
  el.querySelectorAll('[data-pay]').forEach(b => {
    b.addEventListener('click', () => {
      const idx = +b.dataset.pay;
      const choice = step.choices[idx];
      state.payment = choice.id;
      state.choices[step.id] = choice;
      // Clear any prior cash-change memo so a re-run rerolls the round.
      if (choice.id !== 'cash') state._cashChange = null;
      const dest = choice.next || step.next;
      if (dest) gotoStep(scene, state, dest);
      saveSceneState();
      renderRestaurantScene(book, scene);
    });
  });
  // Kaedama dialogue step bumps the addPrice when the player asks for refill.
  if (step.id === 'kaedama-reply' && !state._addedKaedama) {
    state.addPrice = (state.addPrice || 0) + (step.addPrice || 0);
    state._addedKaedama = true;
    saveSceneState();
  }

  // Experience-mode overlays — re-applied after every scene render (not
  // just the top-level renderExperience entry) so the reroll button + shop
  // name + receipt 別の店へ override survive Next/Back/choice re-renders.
  if (typeof inExperienceBook === 'function' && inExperienceBook()) {
    applyExperienceOverlays(el);
  }

  // Autoplay NPC dialogue when enabled in settings. Picks up the
  // current step's NPC line (we tagged the .scene-npc wrapper with
  // `data-npc-speak="..."` so any future scene step type works
  // automatically). Fires once per render after the configured delay.
  if (APP.ttsAutoplay) {
    const npcEl = el.querySelector('[data-npc-speak]');
    const text = npcEl && npcEl.dataset.npcSpeak;
    if (text) {
      // Cancel any speech still in flight from a previous step so we
      // don't pile up an utterance queue when the player advances fast.
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const delayMs = Math.max(0, (+APP.ttsAutoplayDelay || 0)) * 1000;
      // Track the timer on APP so re-renders cancel pending playback.
      clearTimeout(APP._ttsAutoplayTimer);
      APP._ttsAutoplayTimer = setTimeout(() => TTS.speak(text), delayMs);
    }
  }
}

// Mobile-only: the cheatsheet items list moves into a bottom drawer that the
// FAB opens. updateVocabDrawer mirrors the items into the drawer body and
// hides/shows the FAB based on page type. The drawer's actual visibility
// toggle is wired once at boot (see attachVocabDrawerEvents).
function updateVocabDrawer(book, page) {
  const fab    = document.getElementById('vocab-fab');
  const fabCt  = document.getElementById('vocab-fab-count');
  const body   = document.getElementById('vocab-drawer-body');
  const title  = document.getElementById('vocab-drawer-title');
  if (!fab || !body) return;
  if (page && page.type === 'cheatsheet') {
    fab.hidden = false;
    fab.style.removeProperty('display'); // CSS @media handles inline-flex
    if (title) title.textContent = page.title || 'ことば';
    if (fabCt) {
      fabCt.textContent = String((page.items || []).length);
      fabCt.hidden = false;
    }
    // Mirror the items grid into the drawer body. The vocab-row markup is
    // reused as-is, so click handlers / popovers wired elsewhere still work
    // if they walk the DOM.
    body.innerHTML = `
      <div class="vocab-grid">
        ${(page.items || []).map(item => `
          <div class="vocab-row" data-kanji="${escAttr(item.kanji)}" data-kana="${escAttr(item.kana)}" data-en="${escAttr(item.en)}">
            <span class="num">${item.num}.</span>
            <div class="body">
              <span class="kanji">${escHTML(item.kanji)}</span>
              <span class="kana">（${escHTML(item.kana)}）</span>
              <span class="en">${escHTML(item.en)}</span>
            </div>
          </div>
        `).join('')}
      </div>`;
  } else {
    fab.hidden = true;
    fab.style.display = 'none';
    if (fabCt) { fabCt.hidden = true; }
    body.innerHTML = '';
    closeVocabDrawer();
  }
}

function openVocabDrawer() {
  const d = document.getElementById('vocab-drawer');
  const b = document.getElementById('vocab-drawer-backdrop');
  if (!d || !b) return;
  d.classList.add('is-open');
  d.setAttribute('aria-hidden', 'false');
  b.classList.add('is-open');
}

function closeVocabDrawer() {
  const d = document.getElementById('vocab-drawer');
  const b = document.getElementById('vocab-drawer-backdrop');
  if (!d || !b) return;
  d.classList.remove('is-open');
  d.setAttribute('aria-hidden', 'true');
  b.classList.remove('is-open');
}

function attachVocabDrawerEvents() {
  const fab = document.getElementById('vocab-fab');
  const close = document.getElementById('vocab-drawer-close');
  const backdrop = document.getElementById('vocab-drawer-backdrop');
  if (fab) fab.addEventListener('click', openVocabDrawer);
  if (close) close.addEventListener('click', closeVocabDrawer);
  if (backdrop) backdrop.addEventListener('click', closeVocabDrawer);
  // Escape closes the drawer on desktop in case it's somehow open.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVocabDrawer();
  });
  // Hide the FAB when we're not on the vocab section. It's positioned fixed
  // so without this it would persist over other pages.
  const refresh = () => {
    if (!fab) return;
    if (APP.section !== 'vocab') {
      fab.style.display = 'none';
      closeVocabDrawer();
    } else {
      // Let the CSS @media query decide whether to show. Clear inline style
      // unless the page type set it.
      fab.style.removeProperty('display');
    }
  };
  // Refresh on every hash change (section switch). The renderMain pipeline
  // also calls updateVocabDrawer, but section switches don't always go
  // through it (e.g. from flashcard radical jumps).
  window.addEventListener('hashchange', refresh);
  refresh();
}

function cheatsheetHTML(book, page, opts = {}) {
  // Only treat の / と as particles when they're standalone tokens — the
  // `と` inside ことば (kotoba) is part of the word, not a particle.
  const titleHTML = page.title.replace(/(^|[\s　])(の|と)(?=[\s　]|$)/g,
    '$1<span class="particle">$2</span>');
  // `data-num` lets the hotspot ↔ row linker find pairs without scanning
  // text. Rows without a paired hotspot just have the attribute ignored.
  const items = page.items.map(item => `
    <div class="vocab-row" data-num="${item.num}" data-kanji="${escAttr(item.kanji)}" data-kana="${escAttr(item.kana)}" data-en="${escAttr(item.en)}">
      <span class="num">${item.num}.</span>
      <div class="body">
        <span class="kanji">${escHTML(item.kanji)}</span>
        <span class="kana">（${escHTML(item.kana)}）</span>
        <span class="en">${escHTML(item.en)}</span>
      </div>
    </div>`).join('');

  // Hotspot overlay — only when at least one item declares a `spot`.
  // Hotspot rendering disabled. Each cheatsheet item could carry a
  // spot:{x,y} percent-coord and we'd overlay a hoverable numbered
  // circle on the image at that position — but the coords rarely
  // line up against the actual painted numbers (different artists,
  // different framings), and any image-size/aspect-ratio change
  // would have to be paired with a coordinate retune across every
  // cheatsheet to keep things visually correct. Not worth the
  // maintenance burden against the small UX win. The CSS rules
  // (.sheet-hotspot*) and the row↔hotspot sync JS are left intact
  // in case we ever want to revive this — the data spot:{x,y}
  // fields are now dormant metadata, safe to leave in or strip
  // later. For now, the filter resolves to zero items so the
  // markup below collapses to an empty string.
  const hotspotItems = [];
  const hotspotsHTML = hotspotItems.length ? `
    <div class="sheet-hotspots" aria-hidden="false">
      ${hotspotItems.map(it => `
        <button
          class="sheet-hotspot"
          data-num="${it.num}"
          data-kanji="${escAttr(it.kanji)}"
          data-kana="${escAttr(it.kana)}"
          data-en="${escAttr(it.en)}"
          style="left:${it.spot.x}%;top:${it.spot.y}%"
          aria-label="${escAttr(it.kanji + ' — ' + it.en)}">
          <span class="sheet-hotspot-ring"></span>
          <span class="sheet-hotspot-tip" role="tooltip">
            <span class="ht-num">${it.num}</span>
            <span class="ht-kanji">${escHTML(it.kanji)}</span>
            <span class="ht-reading">
              <span class="ht-kana">${escHTML(it.kana)}</span>
              ${it.romaji ? `<span class="ht-romaji">· ${escHTML(it.romaji)}</span>` : ''}
            </span>
            <span class="ht-en">${escHTML(it.en)}</span>
            ${it.note ? `<span class="ht-note">${escHTML(it.note)}</span>` : ''}
          </span>
        </button>
      `).join('')}
    </div>
  ` : '';

  // Two-column layout — title + image on the left, items list on the right.
  // CSS collapses it to single column on narrow viewports, where the items
  // grid is hidden and the FAB/drawer take over for mobile.
  //
  // `opts.prefix` injects custom markup next to the title in a flex row.
  // Used by the Fast Food hub to mount its "experience eating at X"
  // button next to the page title so they share a line instead of
  // stacking — saves vertical space inside the card.
  const prefix = opts.prefix || '';
  const titleEl = `<h2 class="book-title">${titleHTML}</h2>`;
  // Order: title first (left), prefix/button second (right). Flipped
  // from the original layout — title sits next to where reading starts,
  // button sits at the right edge as a flush action.
  const headerBlock = prefix
    ? `<div class="sheet-head-row">${titleEl}${prefix}</div>`
    : titleEl;
  return `
    <div class="book-frame cheatsheet-2col" data-page-title="${escAttr(page.title)}">
      <span class="corner-tl"></span><span class="corner-tr"></span>
      <div class="sheet-col-image">
        ${headerBlock}
        <div class="sheet-image ${hotspotItems.length ? 'has-hotspots' : ''}">
          <image-slot
            id="vocab-${book.id}-${page.imageSlotId}"
            image-key="vocab/${escAttr(book.id)}-${escAttr(page.imageSlotId)}"
            ${page.imageSrc ? `src="${escAttr(page.imageSrc)}"` : ''}
            shape="rounded" radius="4" fit="natural" data-bound-height
            placeholder="Drop an illustration"></image-slot>
          ${hotspotsHTML}
        </div>
      </div>
      <div class="vocab-grid">${items}</div>
    </div>`;
}

function usageHTML(page) {
  const cards = page.items.map(u => `
    <div class="usage-card" data-kanji="${escAttr(u.ja)}" data-kana="${escAttr(u.kana||'')}" data-en="${escAttr(u.en||'')}">
      <div class="ja">${colorParticles(u.ja)}</div>
      <div class="kana">${escHTML(u.kana)}</div>
      <div class="en">${escHTML(u.en)}</div>
    </div>`).join('');
  return `
    <div class="panel">
      <div style="margin-bottom:18px">
        <h2 style="font-family:var(--serif-jp);font-size:26px;color:var(--ink);margin:0;font-weight:600">${escHTML(page.title)}</h2>
        <div style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3);margin-top:4px">${escHTML(page.subtitle)}</div>
      </div>
      <div class="usage-grid">${cards}</div>
    </div>`;
}

function sentencesHTML(page, level, showAll) {
  const LEVELS = ['ALL', ...(window.JLPT_LEVELS || ['N5','N4','N3','N2','N1'])];
  const filtered = page.items.filter(s => level === 'ALL' || s.level === level);
  const INITIAL = 5;
  const visible = showAll ? filtered : filtered.slice(0, INITIAL);
  const hidden = filtered.length - visible.length;

  const levelPills = LEVELS.map(L => `
    <button class="pill ${level === L ? 'active' : ''}" data-level="${L}">${L === 'ALL' ? 'all' : L}</button>`
  ).join('');

  const rows = visible.map(s => `
    <div class="sentence">
      <span class="level-tag level-${escAttr(s.level || 'NA')}">${escHTML(s.level)}</span>
      <div class="body">
        <div class="ja">${jaSentenceHTML(s.ja)}</div>
        <div class="en">${escHTML(s.en)}</div>
      </div>
      <button class="icon-btn audio" title="play audio"
              data-speak="${escAttr(s.ja || '')}"
              aria-label="play sentence audio">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      </button>
    </div>`).join('');

  const emptyState = visible.length === 0
    ? `<div class="empty-state">no sentences at ${escHTML(level)} yet — try another level</div>` : '';
  const showMoreBtn = hidden > 0 && !showAll
    ? `<div style="text-align:center;margin-top:20px"><button class="btn ghost" data-show-more>see ${hidden} more ↓</button></div>` : '';
  const collapseBtn = showAll && filtered.length > INITIAL
    ? `<div style="text-align:center;margin-top:20px"><button class="btn ghost" data-collapse>collapse ↑</button></div>` : '';

  return `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:18px">
        <div>
          <h2 style="font-family:var(--serif-jp);font-size:26px;color:var(--ink);margin:0;font-weight:600">${escHTML(page.title)}</h2>
          <div style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3);margin-top:4px">${escHTML(page.subtitle)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="small-label">level:</span>
          ${levelPills}
        </div>
      </div>
      <div class="sentences">${emptyState}${rows}</div>
      ${showMoreBtn}${collapseBtn}
    </div>`;
}

function attachSentencesEvents(container, page) {
  let level = 'ALL', showAll = false;
  function rerender() {
    container.innerHTML = sentencesHTML(page, level, showAll);
    attachSentencesEvents(container, page);
  }
  container.querySelectorAll('[data-level]').forEach(btn => {
    btn.addEventListener('click', () => { level = btn.dataset.level; showAll = false; rerender(); });
  });
  const more = container.querySelector('[data-show-more]');
  if (more) more.addEventListener('click', () => { showAll = true; rerender(); });
  const collapse = container.querySelector('[data-collapse]');
  if (collapse) collapse.addEventListener('click', () => { showAll = false; rerender(); });
}

// ── Explainer page (long-form HTML body) ───────────────────────────────
// Trusts page.bodyHTML — this is first-party content authored in data.js,
// so no escaping. Used by the Jougo "Intro" book to host the 々-and-jōgo
// explainer with its grouped tile examples and external study links.
function explainerHTML(page) {
  return `
    <div class="panel">
      <div style="margin-bottom:18px">
        <h2 style="font-family:var(--serif-jp);font-size:26px;color:var(--ink);margin:0;font-weight:600">${escHTML(page.title)}</h2>
        <div style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3);margin-top:4px">${escHTML(page.subtitle)}</div>
      </div>
      <div class="explainer-body">
        ${page.bodyHTML || ''}
      </div>
    </div>
  `;
}

// ── Flashcards-grid page (cross-class tag aggregator) ───────────────────
// Walks every FLASHCARD_CLASSES card, collects any whose card.tags[]
// array includes page.tag, and renders them as a click-to-study grid.
// Generic: any card in any class can opt into a tag-bucket by adding
// the tag string to its tags[] field — no per-tag code required here.
function flashcardsGridHTML(page) {
  const tag = page.tag;
  const matches = [];
  for (const cls of (window.FLASHCARD_CLASSES || [])) {
    for (const card of (cls.cards || [])) {
      if (Array.isArray(card.tags) && card.tags.includes(tag)) {
        matches.push({ classId: cls.id, card });
      }
    }
  }
  const cards = matches.map(({classId, card}) => {
    // Radical-type cards (e.g. ◆々 the iteration-mark explainer) use
    // card.radical instead of card.kanji. Fall through cleanly so the
    // aggregator can include radical cards alongside kanji cards.
    const glyph = card.kanji || card.radical || '';
    const glyphHtml = (typeof splitJougoGlyph === 'function')
      ? splitJougoGlyph(glyph)
      : escHTML(glyph);
    // Resolve the same image-key the editorial flashcard uses, so
    // `<image-slot>` finds the existing illustration on disk (e.g.
    // images/vocabulary/にこにこ.webp). card.imageFolder wins, then the
    // owning class's imageFolder, then 'kanji' as a last resort. When no
    // image exists the slot collapses to its paper-2 placeholder via the
    // shared :has(image-slot[readonly]:not([data-filled])) rule, so every
    // tile in the grid still occupies the same height.
    const cls = (window.FLASHCARD_CLASSES || []).find(c => c.id === classId);
    const folder = card.imageFolder || (cls && cls.imageFolder) || 'kanji';
    const imageKey = folder + '/' + glyph;
    const slotId = 'jougo-fc-' + classId + '-' + card.id;
    // Radical cards have titleEn/titleJa instead of en/kun.
    const reading = card.kun || card.kana || card.titleJa || '';
    const gloss   = card.en  || card.titleEn || '';
    return `
      <button class="jougo-fc" data-jump-class="${escAttr(classId)}" data-jump-id="${escAttr(card.id)}">
        <span class="jougo-fc-image">
          <image-slot
            id="${escAttr(slotId)}"
            image-key="${escAttr(imageKey)}"
            shape="rounded" radius="6" fit="contain" position="50% 50%" readonly
            placeholder=""></image-slot>
        </span>
        <span class="jougo-fc-glyph">${glyphHtml}</span>
        <span class="jougo-fc-reading">${escHTML(reading)}</span>
        <span class="jougo-fc-en">${escHTML(gloss)}</span>
      </button>
    `;
  }).join('');
  const emptyState = matches.length === 0
    ? `<div class="empty-state">no flashcards tagged "${escHTML(tag)}" yet</div>` : '';
  return `
    <div class="panel">
      <div style="margin-bottom:18px">
        <h2 style="font-family:var(--serif-jp);font-size:26px;color:var(--ink);margin:0;font-weight:600">${escHTML(page.title)}</h2>
        <div style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3);margin-top:4px">${escHTML(page.subtitle)}</div>
        <div style="font-family:var(--serif);font-style:italic;font-size:12px;color:var(--ink-4);margin-top:6px">${matches.length} cards tagged "${escHTML(tag)}" — click any card to study it in flashcards.</div>
      </div>
      ${emptyState}
      <div class="jougo-flashcards-grid">${cards}</div>
    </div>
  `;
}

// Wire click-to-jump for the flashcards-grid. Each card sets the
// active class + index in APP state, persists the class for next visit,
// then calls setSection('flashcards') — the app's canonical navigation
// hook, which handles hash update, sidebar swap, and renderMain.
function attachFlashcardsGridEvents(el, page) {
  el.querySelectorAll('[data-jump-class][data-jump-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const classId = btn.dataset.jumpClass;
      const cardId = btn.dataset.jumpId;
      const cls = (window.FLASHCARD_CLASSES || []).find(c => c.id === classId);
      if (!cls) return;
      const idx = cls.cards.findIndex(c => c.id === cardId);
      if (idx < 0) return;
      APP.flashClassId = classId;
      APP.flashIdx = idx;
      APP.flashFlipped = false;
      try { lsSet('jp:flashClass', classId); } catch (e) {}
      if (typeof setSection === 'function') {
        setSection('flashcards');
      } else {
        location.hash = '#flashcards';
        location.reload();
      }
    });
  });
}

// ── Jougo overview page ────────────────────────────────────────────────
// Editorial three-zone layout used by the jougo/onomatopoeia and
// jougo/common-jougo books. Replaces the older cheatsheet + usage +
// sentences trio with one scrollable page:
//
//   Zone A · 形   gallery grid    (clickable tiles → existing modal)
//   Zone B · 暮らし  collocation cards (compact text-only phrase cards)
//   Zone C · 文   sentence stripes (JP + EN + TTS speaker per row)
//
// Each zone has a distinct visual rhythm — gallery is image-heavy, daily
// is text-only, sentences are long letterpressed rows — so the reader
// never confuses one for another.
function jougoOverviewHTML(page) {
  const gallery   = page.gallery   || [];
  const daily     = page.daily     || [];
  const sentences = page.sentences || [];
  // Splits reduplicated kana onto two lines (にこ / にこ) for the giant
  // gallery glyph. Falls back to a plain HTML-escape if the helper
  // hasn't loaded yet (defensive — it's defined further down).
  const splitGlyph = (typeof splitJougoGlyph === 'function')
    ? splitJougoGlyph : escHTML;

  // Zone A — Image gallery. Reuses the .jougo-tile-illus chrome from the
  // intro page so the visual grammar is consistent (same paper-2 tile,
  // squared top corners, 4:3 image, click-to-open modal). Tiles without
  // an image fall through to a paper-2 placeholder that displays the
  // giant glyph centered.
  //
  // Each tile carries the FIRST matching sentence from Zone C as its
  // example — so clicking the tile opens the modal with the gallery
  // image enlarged + the right sentence + TTS. The match is glyph-by-
  // substring (e.g. tile glyph 'にこにこ' picks up any sentence whose
  // ja contains 'にこにこ'). No match → empty example, which the modal
  // already handles by hiding the speaker row.
  const findExample = (glyph) => {
    if (!glyph) return { jp:'', en:'' };
    const hit = sentences.find(s => s.ja && s.ja.includes(glyph));
    return hit ? { jp: hit.ja, en: hit.en || '' } : { jp:'', en:'' };
  };
  const galleryHTML = gallery.length ? `
    <section class="jougo-section jougo-overview-zone jougo-overview-zone-gallery">
      <h3>A · 形 <span class="zone-label-en">— the shape</span></h3>
      ${page.galleryIntro ? `<p>${escHTML(page.galleryIntro)}</p>` : ''}
      <div class="jougo-grid">
        ${gallery.map(item => {
          const hasImg = !!item.image;
          const ex = findExample(item.glyph);
          return `
          <div class="jougo-tile ${hasImg ? 'jougo-tile-illus' : 'jougo-tile-placeholder'}"
               role="button" tabindex="0" data-jougo-modal="1"
               data-ex-jp="${escAttr(ex.jp)}" data-ex-en="${escAttr(ex.en)}">
            ${hasImg ? `<img class="jougo-tile-img" src="images/vocabulary/${escAttr(item.image)}.webp" alt="" loading="lazy">`
                     : `<div class="jougo-tile-glyph-large">${splitGlyph(item.glyph)}</div>`}
            <span class="jougo-tile-glyph">${splitGlyph(item.glyph)}</span>
            <span class="jougo-tile-reading">${escHTML(item.reading || '')}</span>
            <span class="jougo-tile-en">${escHTML(item.en || '')}</span>
          </div>`;
        }).join('')}
      </div>
    </section>` : '';

  // Zone B — Daily-use collocations. Text-only on purpose; the rhythm
  // change (no images) is what tells the reader "you're in a different
  // section now." Each card stacks the JP phrase + kana + EN gloss in
  // a tight letterpressed unit. Glyph eyebrow on top so the card is
  // still anchored to its word at a glance.
  const dailyHTML = daily.length ? `
    <section class="jougo-section jougo-overview-zone jougo-overview-zone-daily">
      <h3>B · 暮らし <span class="zone-label-en">— in daily life</span></h3>
      ${page.dailyIntro ? `<p>${escHTML(page.dailyIntro)}</p>` : ''}
      <div class="jougo-daily-grid">
        ${daily.map(item => `
          <div class="jougo-daily-card">
            <span class="jougo-daily-eyebrow">${splitGlyph(item.glyph)}</span>
            <p class="jougo-daily-phrase">${escHTML(item.phrase)}</p>
            ${item.phraseKana ? `<p class="jougo-daily-kana">${escHTML(item.phraseKana)}</p>` : ''}
            <p class="jougo-daily-en">${escHTML(item.en || '')}</p>
          </div>
        `).join('')}
      </div>
    </section>` : '';

  // Zone C — Example sentences. Wide letterpressed stripes (one per
  // row, full width) so the JP gets generous reading line-height. EN
  // gloss underneath in italic. JLPT level chip at the right. TTS
  // speaker on the right of the JP, routes through the existing
  // [data-speak] document-level delegate.
  const sentencesHTML_ = sentences.length ? `
    <section class="jougo-section jougo-overview-zone jougo-overview-zone-sentences">
      <h3>C · 文 <span class="zone-label-en">— in a sentence</span></h3>
      ${page.sentencesIntro ? `<p>${escHTML(page.sentencesIntro)}</p>` : ''}
      <div class="jougo-sentences-list">
        ${sentences.map(s => `
          <div class="jougo-sentence-stripe">
            <div class="jougo-sentence-jp-row">
              <p class="jp">${escHTML(s.ja)}</p>
              <div class="jougo-sentence-meta">
                ${s.level ? `<span class="jougo-sentence-level">${escHTML(s.level)}</span>` : ''}
                <button class="tts-btn jougo-sentence-tts" type="button"
                        aria-label="読み上げ (speak)" title="読み上げ"
                        data-speak="${escAttr(s.ja)}">
                  ${speakerIconSVG()}
                </button>
              </div>
            </div>
            <p class="en">${escHTML(s.en || '')}</p>
          </div>
        `).join('')}
      </div>
    </section>` : '';

  return `
    <div class="panel jougo-overview">
      <div style="margin-bottom:18px">
        <h2 style="font-family:var(--serif-jp);font-size:26px;color:var(--ink);margin:0;font-weight:600">${escHTML(page.title)}</h2>
        ${page.subtitle ? `<div style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3);margin-top:4px">${escHTML(page.subtitle)}</div>` : ''}
      </div>
      <div class="explainer-body">
        ${galleryHTML}
        ${dailyHTML}
        ${sentencesHTML_}
      </div>
    </div>`;
}

// ── Writing / Kana ───────────────────────────────────────────────────────
// Reference grids for hiragana, katakana, and number kanji. Persists
// preferences (show toggles, emphasis, font, romaji) to localStorage.
const GOJUUON_ROWS = [
  { label: '—', romaji: ['a','i','u','e','o'],         h: ['あ','い','う','え','お'], k: ['ア','イ','ウ','エ','オ'] },
  { label: 'k', romaji: ['ka','ki','ku','ke','ko'],    h: ['か','き','く','け','こ'], k: ['カ','キ','ク','ケ','コ'] },
  { label: 's', romaji: ['sa','shi','su','se','so'],   h: ['さ','し','す','せ','そ'], k: ['サ','シ','ス','セ','ソ'] },
  { label: 't', romaji: ['ta','chi','tsu','te','to'],  h: ['た','ち','つ','て','と'], k: ['タ','チ','ツ','テ','ト'] },
  { label: 'n', romaji: ['na','ni','nu','ne','no'],    h: ['な','に','ぬ','ね','の'], k: ['ナ','ニ','ヌ','ネ','ノ'] },
  { label: 'h', romaji: ['ha','hi','fu','he','ho'],    h: ['は','ひ','ふ','へ','ほ'], k: ['ハ','ヒ','フ','ヘ','ホ'] },
  { label: 'm', romaji: ['ma','mi','mu','me','mo'],    h: ['ま','み','む','め','も'], k: ['マ','ミ','ム','メ','モ'] },
  { label: 'y', romaji: ['ya', null,'yu', null,'yo'],  h: ['や', null,'ゆ', null,'よ'], k: ['ヤ', null,'ユ', null,'ヨ'] },
  { label: 'r', romaji: ['ra','ri','ru','re','ro'],    h: ['ら','り','る','れ','ろ'], k: ['ラ','リ','ル','レ','ロ'] },
  { label: 'w', romaji: ['wa', null, null, null,'wo'], h: ['わ', null, null, null,'を'], k: ['ワ', null, null, null,'ヲ'] },
  { label: 'n', romaji: [null, null,'n', null, null],  h: [null, null,'ん', null, null], k: [null, null,'ン', null, null] },
];

const NUMBERS_1_10 = [
  { v:1, k:'一', r:'いち' }, { v:2, k:'二', r:'に' }, { v:3, k:'三', r:'さん' },
  { v:4, k:'四', r:'よん' }, { v:5, k:'五', r:'ご' }, { v:6, k:'六', r:'ろく' },
  { v:7, k:'七', r:'なな' }, { v:8, k:'八', r:'はち' }, { v:9, k:'九', r:'きゅう' },
  { v:10, k:'十', r:'じゅう' },
];
const NUMBERS_11_20 = [
  { v:11, k:'十一', r:'じゅういち' }, { v:12, k:'十二', r:'じゅうに' },
  { v:13, k:'十三', r:'じゅうさん' }, { v:14, k:'十四', r:'じゅうよん' },
  { v:15, k:'十五', r:'じゅうご' },   { v:16, k:'十六', r:'じゅうろく' },
  { v:17, k:'十七', r:'じゅうなな' }, { v:18, k:'十八', r:'じゅうはち' },
  { v:19, k:'十九', r:'じゅうきゅう' }, { v:20, k:'二十', r:'にじゅう' },
];
const TENS = [
  { v:30, k:'三十', r:'さんじゅう' }, { v:40, k:'四十', r:'よんじゅう' },
  { v:50, k:'五十', r:'ごじゅう' },   { v:60, k:'六十', r:'ろくじゅう' },
  { v:70, k:'七十', r:'ななじゅう' }, { v:80, k:'八十', r:'はちじゅう' },
  { v:90, k:'九十', r:'きゅうじゅう' }, { v:100, k:'百',  r:'ひゃく' },
];
const HUNDREDS = [
  { v:100, k:'百',   r:'ひゃく' },          { v:200, k:'二百', r:'にひゃく' },
  { v:300, k:'三百', r:'さんびゃく', irregular:true }, { v:400, k:'四百', r:'よんひゃく' },
  { v:500, k:'五百', r:'ごひゃく' },        { v:600, k:'六百', r:'ろっぴゃく', irregular:true },
  { v:700, k:'七百', r:'ななひゃく' },      { v:800, k:'八百', r:'はっぴゃく', irregular:true },
  { v:900, k:'九百', r:'きゅうひゃく' },
];
const THOUSANDS = [
  { v:1000, k:'千',   r:'せん' },              { v:2000, k:'二千', r:'にせん' },
  { v:3000, k:'三千', r:'さんぜん', irregular:true }, { v:4000, k:'四千', r:'よんせん' },
  { v:5000, k:'五千', r:'ごせん' },            { v:6000, k:'六千', r:'ろくせん' },
  { v:7000, k:'七千', r:'ななせん' },          { v:8000, k:'八千', r:'はっせん', irregular:true },
  { v:9000, k:'九千', r:'きゅうせん' },
];
const CONSTRUCTION_EXAMPLES = [
  { v:21, k:'二十一', r:'にじゅういち',      parts:[['二十',20],['一',1]] },
  { v:34, k:'三十四', r:'さんじゅうよん',    parts:[['三十',30],['四',4]] },
  { v:68, k:'六十八', r:'ろくじゅうはち',    parts:[['六十',60],['八',8]] },
  { v:99, k:'九十九', r:'きゅうじゅうきゅう', parts:[['九十',90],['九',9]] },
];
const KANA_FONTS = [
  // Each font has two layers of identification in the dropdown:
  //   `sample` — a short Japanese character rendered IN the font itself
  //              (ミ for mincho, ゴ for gothic, あ for textbook, 筆 for
  //              brush, の for noto). Acts as the visual fingerprint.
  //   `label`  — the longer descriptive name combining the JA
  //              category name + the English label, matching what
  //              shows in the settings modal.
  { id:'mincho',   sample:'ミ', label:'明朝 · Mincho',     family:'"Shippori Mincho", "Noto Serif JP", serif' },
  { id:'gothic',   sample:'ゴ', label:'ゴシック · Gothic', family:'"Zen Kaku Gothic New", "Hiragino Sans", sans-serif' },
  { id:'kyokasho', sample:'あ', label:'教科書 · Textbook', family:'"Klee One", "Shippori Mincho", serif' },
  { id:'brush',    sample:'筆', label:'筆 · Brush',         family:'"Yuji Syuku", "Kaisei Decol", "Hina Mincho", "Shippori Mincho", serif' },
  { id:'noto',     sample:'の', label:'ノト · Noto Sans',   family:'"Noto Sans JP", "Hiragino Sans", system-ui, sans-serif' },
];

// ── Reusable font dropdown ─────────────────────────────────────────────
// A single component used by the kana page, the editorial flashcard, and
// the settings modal — replaces the previous pill / card-grid pickers.
//
//   options    — array of { id, label, family }
//   currentId  — id of the currently-selected font
//   targetKey  — string identifying which APP-state field this controls
//                (e.g. 'glyph', 'kana', 'fontTitle'). The click handler
//                reads this via data-fontdd-target and updates the right
//                state slot.
//   sample     — the JP/Latin preview string shown in each option
function fontDropdownHTML(options, currentId, targetKey) {
  // Defensive: if options is empty or missing, render nothing rather
  // than throw on `current.family` below.
  if (!Array.isArray(options) || options.length === 0) return '';
  const current = options.find(o => o.id === currentId) || options[0];
  // The label itself is rendered IN the option\'s font — so each row
  // visually previews the font through its own label (e.g. "明朝 ·
  // Mincho" rendered in Mincho, "ゴシック · Gothic" rendered in Gothic).
  // No separate sample column needed — the label IS the preview.
  const optionsHTML = options.map(o => `
    <li>
      <button type="button" role="option"
              class="font-dropdown-option ${o.id === currentId ? 'is-active' : ''}"
              data-fontdd-pick="${escAttr(o.id)}"
              aria-selected="${o.id === currentId}">
        <span class="font-dropdown-opt-label" style="font-family:${escAttr(o.family)}">${escHTML(o.label)}</span>
        <span class="font-dropdown-opt-check" aria-hidden="true">${o.id === currentId ? '✓' : ''}</span>
      </button>
    </li>
  `).join('');
  return `
    <div class="font-dropdown" data-fontdd-target="${escAttr(targetKey)}">
      <button type="button" class="font-dropdown-trigger" data-fontdd-trigger aria-haspopup="listbox" aria-expanded="false">
        <span class="font-dropdown-trigger-label" style="font-family:${escAttr(current.family)}">${escHTML(current.label)}</span>
        <span class="font-dropdown-caret" aria-hidden="true">▾</span>
      </button>
      <ul class="font-dropdown-menu" role="listbox" hidden>
        ${optionsHTML}
      </ul>
    </div>`;
}

// Map a dropdown target key → APP state slot + localStorage key. Single
// source of truth for which dropdowns control which preferences.
const FONT_DROPDOWN_TARGETS = {
  glyph:     { state: 'flashGlyphFont', ls: 'jp:flashGlyphFont' },
  cardText:  { state: 'flashTextFont',  ls: 'jp:flashTextFont' },
  listGlyph: { state: 'listGlyphFont',  ls: 'jp:listGlyphFont' },
  listText:  { state: 'listTextFont',   ls: 'jp:listTextFont' },
  kana:      { state: 'kanaFont',       ls: 'jp:kana-font' },
  fontTitle: { state: 'fontTitle',      ls: 'jp:fontTitle' },
  fontMenu1: { state: 'fontMenu1',      ls: 'jp:fontMenu1' },
  fontMenu2: { state: 'fontMenu2',      ls: 'jp:fontMenu2' },
  uiFont:    { state: 'uiFont',         ls: 'jp:uiFont' },
};

// Generic click handler — attached once at document level. Toggles the
// open/closed state of any dropdown menu, closes others when one opens,
// dismisses on outside click, and handles option selection.
//
// IMPORTANT: this function is called from MANY surfaces (settings modal,
// writing/kana, flashcards card view, flashcards list view, etc.), each
// passing its own onPick callback. The document-level click listener
// must only be attached once (otherwise picks stack and fire N times),
// but the LIVE onPick must always be the most-recently-registered one —
// otherwise a font picked on the flashcards page would fire the
// settings-modal onPick (or the kana onPick), leading to silent failure
// or the wrong surface re-rendering. Routing through a module-level
// `_fontDropdownOnPick` slot keeps the listener idempotent while letting
// the onPick callback follow the user across sections.
let _fontDropdownInited = false;
let _fontDropdownOnPick = null;
function initFontDropdownHandlers(onPick /* (target, fontId) => void */) {
  // Always update the current onPick so the live document listener
  // calls whichever surface most recently registered itself.
  _fontDropdownOnPick = onPick;
  if (_fontDropdownInited) return;
  _fontDropdownInited = true;
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-fontdd-trigger]');
    if (trigger) {
      e.stopPropagation();
      const menu = trigger.nextElementSibling;
      const opening = menu && menu.hidden;
      // Close all other open menus first
      document.querySelectorAll('.font-dropdown-menu:not([hidden])').forEach(m => {
        if (m !== menu) m.hidden = true;
        const t = m.previousElementSibling;
        if (t && t.dataset.fontddTrigger !== undefined) t.setAttribute('aria-expanded', 'false');
      });
      if (menu) {
        menu.hidden = !opening;
        trigger.setAttribute('aria-expanded', String(opening));
      }
      return;
    }
    const opt = e.target.closest('[data-fontdd-pick]');
    if (opt) {
      e.stopPropagation();
      const wrap = opt.closest('.font-dropdown');
      const target = wrap && wrap.dataset.fontddTarget;
      const fontId = opt.dataset.fontddPick;
      if (target && fontId && typeof _fontDropdownOnPick === 'function') _fontDropdownOnPick(target, fontId);
      // Close this menu
      const menu = wrap && wrap.querySelector('.font-dropdown-menu');
      if (menu) menu.hidden = true;
      const trig = wrap && wrap.querySelector('[data-fontdd-trigger]');
      if (trig) trig.setAttribute('aria-expanded', 'false');
      return;
    }
    // Click outside any dropdown → close all
    if (!e.target.closest('.font-dropdown')) {
      document.querySelectorAll('.font-dropdown-menu:not([hidden])').forEach(m => {
        m.hidden = true;
        const t = m.previousElementSibling;
        if (t && t.dataset.fontddTrigger !== undefined) t.setAttribute('aria-expanded', 'false');
      });
    }
  });
  // Escape closes any open menu
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.font-dropdown-menu:not([hidden])').forEach(m => {
      m.hidden = true;
      const t = m.previousElementSibling;
      if (t && t.dataset.fontddTrigger !== undefined) t.setAttribute('aria-expanded', 'false');
    });
  });
}

function numTableHTML(rows, highlightIrregular) {
  return `
    <table class="num-table">
      <tbody>
        ${rows.map(r => `
          <tr class="${r.irregular ? 'is-irregular' : ''}">
            <td class="num-table-v">${r.v}</td>
            <td class="num-table-k">${escHTML(r.k)}</td>
            <td class="num-table-r ${r.irregular && highlightIrregular ? 'is-irregular-r' : ''}">${escHTML(r.r)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function numCardHTML({ badge, title, body, aside, wide, font }) {
  return `
    <div class="num-card ${wide ? 'num-card-wide' : ''}">
      <div class="num-card-hd">
        <span class="num-badge">${escHTML(badge)}</span>
        <span class="num-card-title" style="font-family:${escAttr(font)}">${escHTML(title)}</span>
      </div>
      <div class="num-card-body">
        <div class="num-card-main">${body}</div>
        ${aside ? `<div class="num-card-aside">${aside}</div>` : ''}
      </div>
    </div>`;
}

const WRITING_PAGES = [
  { id:'kana',               glyph:'あ', ja:'ひらがな・カタカナ', en:'Hiragana & Katakana' },
  { id:'numbers',            glyph:'数', ja:'すうじ',             en:'Numbers' },
  // ぶんの・くみたて — middle-dot triggers the sidebar's two-line stack
  // (renderWritingSidebar stackedJa helper) so the title reads BUN NO /
  // KUMITATE on two rows instead of crowding a single line.
  { id:'sentence-structure', glyph:'文', ja:'ぶんの・くみたて',   en:'Sentence Structure' },
  { id:'particles',          glyph:'は', ja:'じょし',             en:'Particles' },
  { id:'colors',             glyph:'色', ja:'いろ',               en:'Colors' },
  // Days & Time — last basics page. ようび (day-of-week) and じこく
  // (time-of-day) chosen as the JP label because together they signal
  // both halves of the page: the weekly calendar and the clock.
  { id:'datetime',           glyph:'時', ja:'ようび・じこく',     en:'Days & Time' },
  // Pitch & Tones — the speaking sub-system's teaching companion. Lives
  // here under Basics rather than under Speaking because it's pure
  // pedagogy (read, don't perform). 抑 (yoku) + 揚 (you) = "down + up",
  // the canonical kanji compound for "intonation / pitch accent".
  // Inherits all writing-section chrome; renders as a single editorial
  // scroll with worked examples (the four named patterns) + a notation
  // legend. See docs/superpowers/specs/2026-05-28-speaking.PRODUCT.md
  // and .DESIGN.md §6.6.
  { id:'pitch',              glyph:'抑', ja:'よくよう・トーン',   en:'Pitch & Tones' },
];

function renderWritingSidebar() {
  const el = document.getElementById('writing-sidebar');
  if (!el) return;
  // Split a JA label like "ひらがな・カタカナ" into stacked spans so the
  // sidebar doesn't break mid-script-name. Labels without ・ render as a
  // single line. The middle dot is dropped — the vertical stack does the
  // separation work.
  const stackedJa = (ja) => ja.includes('・')
    ? ja.split('・').map(s => `<span>${escHTML(s)}</span>`).join('')
    : escHTML(ja);

  el.innerHTML = `
    <div class="flash-sidebar-head">sections</div>
    <ul class="cat-list">
      ${WRITING_PAGES.map(p => {
        const isActive = p.id === APP.writingPage;
        return `
        <li>
          <button class="cat-item ${isActive ? 'active' : ''}" data-writing-page="${p.id}">
            <span class="cat-glyph">${p.glyph}</span>
            <span class="cat-label">
              <span class="cat-ja">${stackedJa(p.ja)}</span>
              <span class="cat-en">${escHTML(p.en)}</span>
            </span>
            ${isActive ? activeBrushHTML(2) : ''}
          </button>
        </li>
      `;
      }).join('')}
    </ul>`;
  el.querySelectorAll('[data-writing-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.writingPage === APP.writingPage) return;
      APP.writingPage = btn.dataset.writingPage;
      lsSet('jp:writingPage', APP.writingPage);
      // When entering the particles page, always land on Lessons (the
      // first category in the INTERACTIVE list) so new arrivals see
      // the learning content first.
      if (APP.writingPage === 'particles') {
        APP.particleMode = 'lessons';
        lsSet('jp:particleMode', 'lessons');
        APP.lessonId = null;
        lsSet('jp:lessonId', null);
      }
      // Toggle the 3rd sidebar (particles list) based on the new page.
      document.querySelector('.app').classList
        .toggle('show-particles-sidebar', shouldShowParticlesSidebar());
      // Each writing subpage has its own bg mapping — refresh the
      // context-bg layer so kana→numbers→colors→particles each get
      // their specific image.
      if (typeof applyContextBg === 'function') applyContextBg();
      renderWriting(document.getElementById('main-inner'));
      renderWritingSidebar();
      renderParticlesSidebar();
    });
  });
}

function renderWriting(container) {
  const page = APP.writingPage || 'kana';
  // 'radicals' was promoted to a top-level Search section; if a stored
  // preference still points here, redirect on next render.
  if (page === 'radicals') { APP.writingPage = 'kana'; lsSet('jp:writingPage', 'kana'); }
  const actual = APP.writingPage || 'kana';
  if (actual === 'kana')                    renderWritingKana(container);
  else if (actual === 'numbers')            renderWritingNumbers(container);
  else if (actual === 'particles')          renderWritingParticles(container);
  else if (actual === 'sentence-structure') renderWritingSentenceStructure(container);
  else if (actual === 'colors')             renderWritingColors(container);
  else if (actual === 'datetime')           renderWritingDatetime(container);
  else if (actual === 'pitch')              renderWritingPitch(container);
}

// ── Library hub — Search · Dictionary · Books in a nested sidebar ─────
// Mirrors the Writing-section pattern: a fixed page list rendered into a
// second-rail sidebar, with a dispatch that swaps the main column.
const LIBRARY_PAGES = [
  { id: 'search',     glyph: '検', ja: 'けんさく', en: 'Search' },
  { id: 'dictionary', glyph: '辞', ja: 'じしょ',   en: 'Dictionary' },
  { id: 'books',      glyph: '本', ja: 'ほん',     en: 'Books' },
];

function renderLibrarySidebar() {
  const el = document.getElementById('library-sidebar');
  if (!el) return;
  el.innerHTML = `
    <div class="flash-sidebar-head">sections</div>
    <ul class="cat-list">
      ${LIBRARY_PAGES.map(p => {
        const isActive = p.id === APP.libraryPage;
        return `
        <li>
          <button class="cat-item ${isActive ? 'active' : ''}" data-library-page="${p.id}">
            <span class="cat-glyph">${p.glyph}</span>
            <span class="cat-label">
              <span class="cat-ja">${escHTML(p.ja)}</span>
              <span class="cat-en">${escHTML(p.en)}</span>
            </span>
            ${isActive ? activeBrushHTML(2) : ''}
          </button>
        </li>`;
      }).join('')}
    </ul>`;
  el.querySelectorAll('[data-library-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.libraryPage === APP.libraryPage) return;
      APP.libraryPage = btn.dataset.libraryPage;
      lsSet('jp:libraryPage', APP.libraryPage);
      if (typeof applyContextBg === 'function') applyContextBg();
      renderLibrary(document.getElementById('main-inner'));
      renderLibrarySidebar();
    });
  });
}

function renderLibrary(container) {
  const page = APP.libraryPage || 'search';
  if (page === 'dictionary')    renderDictionary(container);
  else if (page === 'books')    renderBooks(container);
  else                          renderSearch(container);
}

// Books — a static port of the portfolio Library page (the 3D open-cover
// shelf + detail dialog). 3 sample books for now; real shelves/links/images
// land later. Covers come from the shared assets/books/ folder (one level up
// from nihongo/). No Embla carousel — the shelf is a static wrapped grid.
// Recommended Japanese-learning books. Each book is a cover (shown in the
// shelf) plus an ordered list of `sections` that render inside the editorial
// modal when the cover is clicked. A section's `layout` decides its shape:
//   'two-col'    — image 60% / text 40% (set imageSide 'left' | 'right')
//   'full-image' — the page scan, full width (portrait scans are height-capped)
//   'full-text'  — a centred column of prose
// Images live at images/books/<file>. `body` may contain inline <em>.
const BOOKS = [
  {
    id: 'hiragana-katakana',
    cover: 'hiragana-katakana.webp',
    title: 'Learning Japanese Hiragana & Katakana',
    author: 'Kenneth G. Henshall & Tetsuo Takagaki',
    meta: 'Tuttle · Revised 2nd ed.',
    tagline: 'The workbook that puts the two kana syllabaries into your hand, not just your head.',
    sections: [
      {
        layout: 'two-col', imageSide: 'left', image: 'hiragana-katakana-2.webp',
        heading: 'One character, one page',
        body: 'Every kana gets the full treatment: a large model glyph, the sound it makes (“う as in <em>hula</em>, but shorter”), the kanji it was abbreviated from, numbered stroke order, and a grid to write it yourself. You copy until the shape is muscle memory.'
      },
      {
        layout: 'two-col', imageSide: 'right', image: 'hiragana-katakana-3.webp',
        heading: 'Then real words, right away',
        body: 'Once the chart is learned the drills shift to words you’ll actually meet — <em>kimono, sashimi, hanami, mikoshi</em> — written in kana with the gloss beside them. Reading and writing reinforce each other from the first lesson.'
      },
      {
        layout: 'full-text',
        heading: 'Why it opens the shelf',
        body: 'Kana is the one thing you can’t fake your way around, and this is the cleanest path through it. A week here and the rest of Japanese stops looking like wallpaper.'
      },
    ],
  },
  {
    id: 'master-vocabulary',
    cover: 'master-japanese-vocabulary.webp',
    title: 'Master Japanese Vocabulary: The 1000 Core Words',
    author: '語彙を学ぶ',
    meta: 'Frequency-first · 1000 core words',
    tagline: 'A vocabulary trainer built around the thousand words that actually carry a conversation.',
    sections: [
      {
        layout: 'full-image', image: 'master-japanese-vocabulary-2.webp',
        caption: 'Each entry pairs kanji + kana, marks the pitch accent, gives an example sentence with furigana, and leaves a grid to write the word yourself.'
      },
      {
        layout: 'full-text',
        heading: 'The thousand that matter',
        body: 'Instead of themed lists you’ll never finish, it takes the highest-frequency words and drills them — <em>出る</em> (to leave), <em>思う</em> (to think), <em>まだ</em> (not yet), <em>顔</em> (face). Learn these and you’ve got the spine of everyday speech.'
      },
      {
        layout: 'full-image', image: 'master-japanese-vocabulary-3.webp',
        caption: 'Word-search, crossword and matching puzzles turn passive recognition into recall — the part most vocabulary books leave out.'
      },
    ],
  },
  {
    id: 'remembering-the-kanji',
    cover: 'remembering-the-kanji.webp',
    title: 'Remembering the Kanji 1',
    author: 'James W. Heisig',
    meta: 'Univ. of Hawai‘i Press · 6th ed.',
    tagline: 'The method this app’s flashcards are built on — meaning and writing first, readings later.',
    sections: [
      {
        layout: 'two-col', imageSide: 'left', image: 'remembering-the-kanji-2.webp',
        heading: 'A keyword and a story',
        body: 'Heisig breaks every character into a handful of recurring “primitives,” gives each kanji one English keyword, and ties them together with a short imaginative story. <em>工</em> (craft) beside a primitive becomes <em>左</em> (left). Remember the picture and the strokes follow.'
      },
      {
        layout: 'full-image', image: 'remembering-the-kanji-3.webp',
        caption: 'Frames build on one another in order — by Lesson 27 you’re assembling 人 (person) into 佐 · 但 · 住 · 位. 2,200 characters, one stackable system.'
      },
      {
        layout: 'full-text',
        heading: 'Why it’s here',
        body: 'This is the backbone of the Flashcards section — the keywords and primitive stories on the card backs come straight from Heisig’s frames. Reading the source makes the whole deck click.'
      },
    ],
  },
];

// One section of the editorial modal → HTML. `body` is trusted authored
// copy (may carry <em>); headings/captions are escaped.
function bookModalSectionHTML(s) {
  const imgTag = s.image
    ? `<figure class="bms-figure"><img src="images/books/${escAttr(s.image)}" alt="" loading="lazy" decoding="async">${
        s.caption ? `<figcaption class="bms-cap">${escHTML(s.caption)}</figcaption>` : ''}</figure>`
    : '';
  const textBlock = (s.heading || s.body)
    ? `<div class="bms-text">${s.heading ? `<h3 class="bms-heading">${escHTML(s.heading)}</h3>` : ''}${
        s.body ? `<div class="bms-body">${s.body}</div>` : ''}</div>`
    : '';
  if (s.layout === 'full-text')  return `<section class="book-modal-section" data-layout="full-text">${textBlock}</section>`;
  if (s.layout === 'full-image') return `<section class="book-modal-section" data-layout="full-image">${imgTag}</section>`;
  return `<section class="book-modal-section" data-layout="two-col" data-image-side="${escAttr(s.imageSide || 'left')}">${imgTag}${textBlock}</section>`;
}

function renderBooks(container) {
  const cards = BOOKS.map(b => `
    <button class="book-items" type="button" data-book-id="${escAttr(b.id)}"
            aria-label="${escAttr(b.title + (b.author ? ' — ' + b.author : ''))}">
      <div class="main-book-wrap" aria-hidden="true">
        <div class="book-cover">
          <div class="book-inside"></div>
          <div class="book-image">
            <img src="images/books/${escAttr(b.cover)}" alt="" loading="lazy" decoding="async" />
            <div class="effect"></div>
            <div class="light"></div>
          </div>
        </div>
      </div>
    </button>`).join('');

  // Standard app page header (page-head / eyebrow / page-title-jp /
  // page-title-en / rule) — kept OUTSIDE .books-page so it inherits the
  // app's global type tokens rather than the .books-page editorial overrides.
  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">books · 本</div>
      <h1 class="page-title-jp">推薦図書</h1>
      <div class="page-title-en">Books I recommend — a small shelf for learning Japanese.</div>
      <div class="rule"></div>
    </div>
    <div class="books-page">
      <section class="shelf books-shelf">
        <div class="shelf-grid-wrap">
          <div class="shelf-grid"><div class="embla__container">${cards}</div></div>
        </div>
      </section>

      <dialog class="book-modal" id="book-modal" aria-labelledby="book-modal-title">
        <button type="button" class="book-modal-close" aria-label="Close">&times;</button>
        <div class="book-modal-scroll" id="book-modal-scroll"></div>
      </dialog>
    </div>`;

  // Per-cover aspect-ratio → --cw/--bh (ported from the portfolio).
  const PORTRAIT_AR = 0.667, CAP_AR = PORTRAIT_AR * 1.33, BASE_H = 260;
  const setBookDims = (cell, w, h) => {
    if (!w || !h) return;
    const ar = w / h; let cw, bh;
    if (ar <= CAP_AR) { bh = BASE_H; cw = Math.round(BASE_H * ar); }
    else { cw = Math.round(BASE_H * CAP_AR); bh = Math.round(cw / ar); }
    cell.style.setProperty('--cw', cw + 'px');
    cell.style.setProperty('--bh', bh + 'px');
  };
  container.querySelectorAll('.book-image img').forEach(img => {
    const cell = img.closest('.book-items');
    if (!cell) return;
    if (img.complete && img.naturalWidth) setBookDims(cell, img.naturalWidth, img.naturalHeight);
    else img.addEventListener('load', () => setBookDims(cell, img.naturalWidth, img.naturalHeight), { once: true });
  });

  // Cover → editorial modal.
  const dlg = container.querySelector('#book-modal');
  const scroll = container.querySelector('#book-modal-scroll');
  if (dlg && scroll) {
    const openBook = (b) => {
      scroll.innerHTML = `
        <header class="book-modal-head">
          ${b.meta ? `<p class="book-modal-eyebrow">${escHTML(b.meta)}</p>` : ''}
          <h2 class="book-modal-title" id="book-modal-title">${escHTML(b.title)}</h2>
          ${b.author ? `<p class="book-modal-author">${escHTML(b.author)}</p>` : ''}
          ${b.tagline ? `<p class="book-modal-tagline">${escHTML(b.tagline)}</p>` : ''}
        </header>
        <div class="book-modal-sections">${(b.sections || []).map(bookModalSectionHTML).join('')}</div>`;
      scroll.scrollTop = 0;
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    };
    container.querySelectorAll('.book-items').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = BOOKS.find(x => x.id === btn.dataset.bookId);
        if (b) openBook(b);
      });
    });
    const closeBtn = dlg.querySelector('.book-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
}

function renderWritingKana(container) {
  const font = KANA_FONTS.find(f => f.id === APP.kanaFont) || KANA_FONTS[0];
  const sizeH = Math.max(12, Math.min(80, +APP.kanaSizeH || 26));
  const sizeK = Math.max(12, Math.min(80, +APP.kanaSizeK || 26));
  const sizeR = Math.max(8,  Math.min(36, +APP.kanaSizeR || 11));

  // All filters live in a single horizontal row on desktop. The size
  // inputs sit at the right edge as part of the same control bar — each
  // script (hiragana / katakana) gets its own direct size input. No
  // slider needed; the inputs are the control.
  const controlsHTML = `
    <div class="kana-controls">
      <span class="small-label">show:</span>
      <button class="pill ${APP.kanaShowH ? 'active' : ''}" data-toggle="kanaShowH">ひらがな</button>
      <button class="pill ${APP.kanaShowK ? 'active' : ''}" data-toggle="kanaShowK">カタカナ</button>
      <span class="kana-ctl-sep"></span>
      <button class="pill ${APP.kanaRomaji ? 'active' : ''}" data-toggle="kanaRomaji">rōmaji</button>
      <span class="kana-ctl-sep"></span>
      <span class="small-label">style:</span>
      ${fontDropdownHTML(KANA_FONTS, APP.kanaFont, 'kana', 'あ')}
      <span class="kana-ctl-sep"></span>
      <span class="small-label">size:</span>
      <label class="kana-size-mini" title="hiragana size">
        <span class="kana-size-mini-glyph" style="font-family:${escAttr(font.family)}">あ</span>
        <input type="number" min="12" max="80" step="1" value="${sizeH}" data-size="h" aria-label="hiragana size px" />
        <span class="kana-size-stepper">
          <button type="button" class="kana-size-step" data-size-step="h" data-dir="up" aria-label="hiragana bigger" title="bigger">▲</button>
          <button type="button" class="kana-size-step" data-size-step="h" data-dir="down" aria-label="hiragana smaller" title="smaller">▼</button>
        </span>
      </label>
      <label class="kana-size-mini" title="katakana size">
        <span class="kana-size-mini-glyph" style="font-family:${escAttr(font.family)}">ア</span>
        <input type="number" min="12" max="80" step="1" value="${sizeK}" data-size="k" aria-label="katakana size px" />
        <span class="kana-size-stepper">
          <button type="button" class="kana-size-step" data-size-step="k" data-dir="up" aria-label="katakana bigger" title="bigger">▲</button>
          <button type="button" class="kana-size-step" data-size-step="k" data-dir="down" aria-label="katakana smaller" title="smaller">▼</button>
        </span>
      </label>
      <button class="kana-size-reset-mini" data-size-reset title="reset sizes" aria-label="reset sizes">↺</button>
    </div>`;

  const gridRowsHTML = GOJUUON_ROWS.map(row => `
    <div class="kana-row">
      <div class="kana-cell-label">${escHTML(row.label)}</div>
      ${row.h.map((_, ci) => {
        const h = row.h[ci], k = row.k[ci], r = row.romaji[ci];
        if (!h && !k) return `<div class="kana-cell kana-empty"></div>`;
        const onlyOne = !APP.kanaShowH || !APP.kanaShowK;
        return `
          <div class="kana-cell ${onlyOne ? 'kana-only-one' : ''}">
            ${APP.kanaShowH && h ? `<span class="kana-h" style="font-size:${sizeH}px">${escHTML(h)}</span>` : ''}
            ${APP.kanaShowK && k ? `<span class="kana-k" style="font-size:${sizeK}px">${escHTML(k)}</span>` : ''}
            ${APP.kanaRomaji && r ? `<span class="kana-r">${escHTML(r)}</span>` : ''}
          </div>`;
      }).join('')}
    </div>`).join('');

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · 文字</div>
      <h1 class="page-title-jp">
        ひらがな<span class="title-conj">と</span>カタカナ
      </h1>
      <div class="rule"></div>
    </div>

    ${controlsHTML}

    <div class="kana-card" style="font-family:${escAttr(font.family)}">
      <div class="kana-grid">
        <div class="kana-row kana-header">
          <div class="kana-cell-label"></div>
          ${['a','i','u','e','o'].map(v => `<div class="kana-cell kana-col-label">${v}</div>`).join('')}
        </div>
        ${gridRowsHTML}
      </div>
    </div>

    <div class="kana-note">
      <span class="kana-note-jp" style="font-family:${escAttr(font.family)}">か→が・は→ば・は→ぱ</span>
      <span class="kana-note-en">
        Voicing marks (゛dakuten · ゜handakuten) bend a kana's sound.
        Same shape, different voice — pair them once and they'll lock in.
      </span>
    </div>`;

  // Wire controls
  container.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle;
      APP[key] = !APP[key];
      const lsKey = ({
        kanaShowH:'jp:kana-show-h', kanaShowK:'jp:kana-show-k', kanaRomaji:'jp:kana-romaji'
      })[key];
      lsSet(lsKey, APP[key]);
      renderWritingKana(container);
    });
  });
  // Per-script size inputs. Direct numeric — each script\'s size lives on
  // its own. `change` fires after the user commits (blur / enter), so
  // typing isn\'t re-rendered character-by-character. Step buttons still
  // trigger live changes since the browser dispatches `change` on each
  // step in number inputs.
  container.querySelectorAll('[data-size]').forEach(input => {
    input.addEventListener('change', () => {
      const which = input.dataset.size;          // 'h' or 'k'
      let v = parseInt(input.value, 10);
      if (isNaN(v)) v = 26;
      v = Math.max(12, Math.min(80, v));
      if (which === 'h') { APP.kanaSizeH = v; lsSet('jp:kana-size-h', v); }
      else               { APP.kanaSizeK = v; lsSet('jp:kana-size-k', v); }
      renderWritingKana(container);
    });
  });
  container.querySelectorAll('[data-size-reset]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.kanaSizeH = 26; APP.kanaSizeK = 26;
      lsSet('jp:kana-size-h', 26); lsSet('jp:kana-size-k', 26);
      renderWritingKana(container);
    });
  });
  // ▲ / ▼ stepper buttons next to each size input. One click = ±1 px,
  // clamped 12–80. The whole render is cheap so a re-render per click is
  // fine; if a user wanted to hold-to-repeat, we\'d add a pointerdown +
  // interval — leaving that as an enhancement for later.
  container.querySelectorAll('[data-size-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const which = btn.dataset.sizeStep;            // 'h' or 'k'
      const dir = btn.dataset.dir === 'up' ? 1 : -1;
      const key   = which === 'h' ? 'kanaSizeH'    : 'kanaSizeK';
      const lsKey = which === 'h' ? 'jp:kana-size-h' : 'jp:kana-size-k';
      const v = Math.max(12, Math.min(80, (+APP[key] || 26) + dir));
      APP[key] = v;
      lsSet(lsKey, v);
      renderWritingKana(container);
    });
  });
  // Font dropdown (replaces the old 4 pills). Routes through the shared
  // initFontDropdownHandlers — `target='kana'` updates APP.kanaFont and
  // re-renders this page.
  initFontDropdownHandlers((target, fontId) => {
    const cfg = FONT_DROPDOWN_TARGETS[target];
    if (!cfg) return;
    APP[cfg.state] = fontId;
    lsSet(cfg.ls, fontId);
    if (typeof applyBodyClasses === 'function') applyBodyClasses();
    if (target === 'kana') renderWritingKana(container);
  });
}

function renderWritingNumbers(container) {
  const font = KANA_FONTS.find(f => f.id === APP.kanaFont) || KANA_FONTS[0];

  const calloutHTML = `
    <div class="num-callout">
      <div class="num-callout-hd">⭑</div>
      <div class="num-callout-body">
        <div>11 〜 19 =</div>
        <div class="num-callout-jp" style="font-family:${escAttr(font.family)}">じゅう</div>
        <div>+</div>
        <div>1 〜 9</div>
      </div>
    </div>`;

  const formulaAsideHTML = `
    <div class="num-formula-area">
      <div class="num-formula" style="font-family:${escAttr(font.family)}">
        30 〜 90 = <span class="num-pill ten">tens</span>
        <span class="num-plus">+</span>
        <span class="num-pill" style="color:var(--ink-2)">じゅう</span>
      </div>
      <div class="num-construct">
        <div class="num-construct-pill tens">tens<br><span class="hint">十の位</span></div>
        <div class="num-plus">+</div>
        <div class="num-construct-pill ones">ones<br><span class="hint">一の位</span></div>
        <div class="num-arrow">→</div>
        <div class="num-construct-pill result">number<br><span class="hint">数字</span></div>
      </div>
      <div class="num-divider"><span>examples</span></div>
      <div class="num-examples">
        ${CONSTRUCTION_EXAMPLES.map(ex => `
          <div class="num-example">
            <div class="num-example-v">${ex.v}</div>
            <div class="num-example-k" style="font-family:${escAttr(font.family)}">
              ${ex.parts.map(([p, n]) => `<span class="${n >= 10 ? 'as-tens' : 'as-ones'}">${escHTML(p)}</span>`).join('')}
            </div>
            <div class="num-example-arrow">↓</div>
            <div class="num-example-r" style="font-family:${escAttr(font.family)}">${escHTML(ex.r)}</div>
          </div>`).join('')}
      </div>
    </div>`;

  const irregularAsideHTML = `
    <div class="num-irregular-callout">
      <div class="num-irregular-hd">⭐ irregular sounds</div>
      <div class="num-irregular-body" style="font-family:${escAttr(font.family)}">
        <span class="ir">さんびゃく</span> · <span class="ir">ろっぴゃく</span> ·
        <span class="ir">はっぴゃく</span> · <span class="ir">さんぜん</span> ·
        <span class="ir">はっせん</span>
      </div>
    </div>
    <div class="num-divider"><span>construction examples</span></div>
    <div class="num-bigex">
      <div class="num-bigex-line">
        <span class="num-bigex-v">356</span>
        <span class="dash">—</span>
        <span class="num-bigex-k" style="font-family:${escAttr(font.family)}">
          <span class="hundreds">三百</span><span class="tens">五十</span><span class="ones">六</span>
        </span>
        <span class="dash">—</span>
        <span class="num-bigex-r" style="font-family:${escAttr(font.family)}">さんびゃくごじゅうろく</span>
      </div>
      <div class="num-bigex-parts">
        <span class="hundreds">300</span> + <span class="tens">50</span> + <span class="ones">6</span>
      </div>
      <div class="num-bigex-line" style="margin-top:14px">
        <span class="num-bigex-v">1,200</span>
        <span class="dash">—</span>
        <span class="num-bigex-k" style="font-family:${escAttr(font.family)}">
          <span class="thousands">千</span> <span class="hundreds">二百</span>
        </span>
        <span class="dash">—</span>
        <span class="num-bigex-r" style="font-family:${escAttr(font.family)}">せんにひゃく</span>
      </div>
      <div class="num-bigex-parts">
        <span class="thousands">1000</span> + <span class="hundreds">200</span>
      </div>
    </div>`;

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · 文字</div>
      <h1 class="page-title-jp">すうじ · 数字</h1>
      <div class="rule"></div>
    </div>

    <div class="num-twocol">
      ${numCardHTML({ badge:'1', title:'1 ～ 10', font:font.family, body:numTableHTML(NUMBERS_1_10) })}
      ${numCardHTML({ badge:'2', title:'11 ～ 20', font:font.family, body:numTableHTML(NUMBERS_11_20), aside:calloutHTML })}
    </div>

    ${numCardHTML({ badge:'3', title:'30 ～ 100', font:font.family, wide:true, body:numTableHTML(TENS), aside:formulaAsideHTML })}

    ${numCardHTML({ badge:'4', title:'100s and 1000s', font:font.family, wide:true, body:numTableHTML([...HUNDREDS, ...THOUSANDS], true), aside:irregularAsideHTML })}`;
}

function renderWritingColors(container) {
  const classes = window.FLASHCARD_CLASSES || [];
  const colorCls = classes.find(c => c.id === 'colors');
  // Only render cards that have an actual swatch — drops 色 (the abstract
  // "color" concept) which lives in the flashcard deck but has nothing to
  // show on a color-reference grid.
  const colors = colorCls ? colorCls.cards.filter(c => c.swatch) : [];

  const swatchSVG = (fill, isLight) =>
    `<svg class="color-ref-swatch"${isLight ? ' data-light' : ''} viewBox="0 0 60 80" fill="${escAttr(fill)}"${isLight ? ' stroke="#c2b294" stroke-width="2.5"' : ''} xmlns="http://www.w3.org/2000/svg"><path d="M18 5C28 2 45 6 52 16C58 26 56 40 50 52C44 62 34 72 22 76C12 79 4 74 2 64C0 54 4 40 12 28C18 18 28 10 18 5Z"/>${!isLight ? '<path d="M38 12C44 18 48 30 46 42C44 54 36 64 26 70C20 73 14 72 12 66C10 58 14 46 22 36C28 28 36 20 38 12Z" opacity=".6"/>' : ''}</svg>`;

  // Build the colorized-kanji HTML for one color card. Same rule as the
  // flashcards Colors-class toggle: trailing 色 stays in ink so the learner
  // can still anchor on the base "color" kanji. Shares APP.flashColorize so
  // the preference is unified across writing and flashcards.
  const colorizeKanji = (c) => {
    if (!APP.flashColorize || !c.swatch) return escHTML(c.kanji);
    const endsWithIro = c.kanji.endsWith('色');
    const main = endsWithIro ? c.kanji.slice(0, -1) : c.kanji;
    const suffix = endsWithIro ? '色' : '';
    const isWhite = c.swatch.toLowerCase() === '#ffffff';
    return `<span class="color-glyph${isWhite ? ' color-glyph-light' : ''}"${isWhite ? '' : ` style="color:${escAttr(c.swatch)}"`}>${escHTML(main)}</span>${suffix ? `<span>${escHTML(suffix)}</span>` : ''}`;
  };

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · 文字</div>
      <h1 class="page-title-jp">いろ · 色</h1>
      <div class="rule"></div>
      <div class="writing-colors-controls">
        <span class="small-label">kanji color</span>
        <button class="pill ${APP.flashColorize ? 'active' : ''}" data-flash-colorize="true">on</button>
        <button class="pill ${!APP.flashColorize ? 'active' : ''}" data-flash-colorize="false">off</button>
      </div>
    </div>

    <div class="color-ref-grid">
      ${colors.map(c => {
        const isLight = (c.swatch || '').toLowerCase() === '#ffffff';
        return `
          <div class="color-ref-card" data-color-kanji="${escAttr(c.kanji)}" role="button" tabindex="0">
            ${swatchSVG(c.swatch || '#999', isLight)}
            <div class="color-ref-body">
              <div class="color-ref-top">
                <div class="color-ref-kanji">${colorizeKanji(c)}</div>
                <div class="color-ref-furi">${escHTML(c.kun)}</div>
              </div>
              ${c.alt ? `<div class="color-ref-alt">${escHTML(c.alt)}</div>` : ''}
              <div class="color-ref-en">${escHTML(c.en)}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  container.querySelectorAll('[data-flash-colorize]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.flashColorize = btn.dataset.flashColorize === 'true';
      lsSet('jp:flashColorize', APP.flashColorize);
      renderWritingColors(container);
    });
  });
  // Click (or Enter/Space) on a color tile → open the corresponding deck
  // flashcard in the modal. The grid stays in place so the learner doesn't
  // lose their browsing position.
  container.querySelectorAll('[data-color-kanji]').forEach(el => {
    const open = () => openColorFlashcard(el.dataset.colorKanji);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

// ── Writing → Particles sidebar (3rd column) ───────────────────────────
// Two sections: TEST (the multi-particle quiz) and PARTICLES (one
// clickable entry per particle, with its colored accent stripe). Lives in
// #particles-sidebar — only rendered visually when on Writing →
// Particles. Renders even when hidden so the markup is ready when the
// user switches in.
function renderParticlesSidebar() {
  const el = document.getElementById('particles-sidebar');
  if (!el) return;
  // If not on particles, clear it so we don't carry stale markup.
  if (APP.writingPage !== 'particles') { el.innerHTML = ''; return; }

  const list = (window.PARTICLES || []);
  const quizActive     = APP.particleMode === 'quiz';
  const lessonsActive  = APP.particleMode === 'lessons';
  const articlesActive = APP.particleMode === 'articles';
  const particleActive = !quizActive && !lessonsActive && !articlesActive;

  // The three "interactive" buttons share the new brush-bg-behind-text
  // treatment. Only ONE is active at a time, so at most one delay is
  // queued per render — but the queue still cascades correctly behind
  // any tier-1/tier-2 brushes that animated earlier in the same cycle.
  const lessonsDelay  = lessonsActive  ? nextBgBrushDelay() : 0;
  const articlesDelay = articlesActive ? nextBgBrushDelay() : 0;
  const quizDelay     = quizActive     ? nextBgBrushDelay() : 0;

  el.innerHTML = `
    <div class="flash-sidebar-head">interactive</div>
    <ul class="cat-list">
      <li>
        <button class="cat-item ${lessonsActive ? 'active has-bg-brush' : ''}"
                ${lessonsActive ? `style="--bg-brush-delay:${lessonsDelay}s"` : ''}
                data-particle-mode="lessons">
          <span class="cat-glyph">講</span>
          <span class="cat-label">
            <span class="cat-ja">レッスン</span>
            <span class="cat-en">Lessons</span>
          </span>
          ${lessonsActive ? bgBrushHTML(lessonsDelay) : ''}
        </button>
      </li>
      <li>
        <button class="cat-item ${articlesActive ? 'active has-bg-brush' : ''}"
                ${articlesActive ? `style="--bg-brush-delay:${articlesDelay}s"` : ''}
                data-particle-mode="articles">
          <span class="cat-glyph">記</span>
          <span class="cat-label">
            <span class="cat-ja">記事</span>
            <span class="cat-en">Articles</span>
          </span>
          ${articlesActive ? bgBrushHTML(articlesDelay) : ''}
        </button>
      </li>
      <li>
        <button class="cat-item ${quizActive ? 'active has-bg-brush' : ''}"
                ${quizActive ? `style="--bg-brush-delay:${quizDelay}s"` : ''}
                data-particle-mode="quiz">
          <span class="cat-glyph">問</span>
          <span class="cat-label">
            <span class="cat-ja">クイズ</span>
            <span class="cat-en">Particle test</span>
          </span>
          ${quizActive ? bgBrushHTML(quizDelay) : ''}
        </button>
      </li>
    </ul>
    <div class="flash-sidebar-head with-divider">particles</div>
    <ul class="cat-list">
      ${list.map((p, i) => {
        const isActive = particleActive && i === APP.particleIdx;
        // Tier-3 brush — PARTICLE variant (smaller than bg-brush, sized
        // to ~50% of the sidebar width). The brush covers the colored
        // glyph on the left but leaves the romaji + EN labels in their
        // default color. The particle's accent color (--pc) stays in
        // the style attribute alongside the brush delay; the accent
        // stripe ::before still paints under the brush, signaling
        // color identity in the brief moment before the wipe lands.
        const bb = isActive ? particleBrushBits(p.char) : null;
        const style = bb
          ? `--pc:${escAttr(p.color)}; ${bb.style}`
          : `--pc:${escAttr(p.color)}`;
        return `
        <li>
          <button class="cat-item ${isActive ? 'active ' + bb.cls : ''}"
                  data-particle-key="${i}" style="${style}">
            <span class="cat-glyph ${p.char.length > 1 ? 'cat-glyph-long' : ''}">${escHTML(p.char)}</span>
            <span class="cat-label">
              <span class="cat-ja">${escHTML(p.romaji)}</span>
              <span class="cat-en">${escHTML((p.role.split('—')[1] || p.role).trim())}</span>
            </span>
            ${bb ? bb.html : ''}
          </button>
        </li>
      `;
      }).join('')}
    </ul>`;

  el.querySelectorAll('[data-particle-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.particleMode;
      if (mode === APP.particleMode) return;   // same-item click → no-op
      // Reset quiz session when re-entering the quiz so the user starts
      // fresh — old answers and progress are not what they came back for.
      if (mode === 'quiz')     APP._quiz = null;
      // Re-entering lessons / articles from the sidebar always lands on the
      // catalog, not whatever item the user last opened — clicking the menu
      // signals "show me the list."
      if (mode === 'lessons')  { APP.lessonId  = null; lsSet('jp:lessonId',  null); APP._lessonChecks = {}; }
      if (mode === 'articles') { APP.articleId = null; lsSet('jp:articleId', null); }
      APP.particleMode = mode;
      lsSet('jp:particleMode', APP.particleMode);
      renderWritingParticles(document.getElementById('main-inner'));
      renderParticlesSidebar();
    });
  });
  el.querySelectorAll('[data-particle-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.particleKey || 0;
      // Same particle already active → no-op so the brush stays put.
      if (APP.particleMode === 'particle' && APP.particleIdx === idx) return;
      // Clicking a particle exits the quiz cleanly.
      APP._quiz = null;
      APP.particleIdx = idx;
      APP.particleMode = 'particle';
      lsSet('jp:particleIdx', APP.particleIdx);
      lsSet('jp:particleMode', APP.particleMode);
      renderWritingParticles(document.getElementById('main-inner'));
      renderParticlesSidebar();
    });
  });
}

// ── Writing → Days & Time — time-reading helpers ───────────────────────
// Converts a 24-hour-clock (h, m) into Japanese. Used by the interactive
// clock at the bottom of Section 3. The two big rules the readout has to
// honor:
//   1. Hour irregulars — 四時 yoji (not yon-ji), 七時 shichi-ji (not
//      nana-ji), 九時 kuji (not kyuu-ji). Lookup table, no logic.
//   2. Minute rendaku — fun after 2/4/5/7/9, pun (with っ) after
//      1/3/6/8/10. Tens place follows the same pun rule on its own,
//      with the ones-place chip layered on top for compound minutes.
// Two helpers: buildMinuteReading handles 1–59 minute math; buildTimeReading
// stitches the period (午前/午後), hour, and minute into one readout.
// buildMinuteReading returns the structural pieces of a minute reading
// (number kanji, number kana, kana-unit ふん/ぷん) separately so the
// caller can wrap the marker units in styling. Kanji unit is always 分
// and is added by the caller.
function buildMinuteReading(m) {
  const tens = Math.floor(m / 10);
  const ones = m % 10;
  // Number-only kana (no unit) — each entry is the ones-place reading
  // up to the small っ glue.
  const ONES_NUM_R  = ['', 'いっ', 'に', 'さん', 'よん', 'ご', 'ろっ', 'なな', 'はっ', 'きゅう'];
  // Unit kana per ones place — fun after 2/5/7/9, pun (with っ) after
  // 1/3/4/6/8. The ones-place 4 is the only "regular" ones digit that
  // takes pun via よんぷん (the literature varies, but よんぷん is the
  // dominant modern reading).
  const ONES_UNIT_R = ['', 'ぷん', 'ふん', 'ぷん', 'ぷん', 'ふん', 'ぷん', 'ふん', 'ぷん', 'ふん'];
  // Tens-only kana when ones === 0 — じゅっ, にじゅっ, etc. Always
  // pun after the tens digit.
  const TENS_ONLY_NUM_R = ['', 'じゅっ', 'にじゅっ', 'さんじゅっ', 'よんじゅっ', 'ごじゅっ'];
  // Tens-prefix kana when combining with a non-zero ones (21 = にじゅう
  // + いっぷん; no っ glue between the tens and the ones).
  const TENS_PREFIX_R = ['', 'じゅう', 'にじゅう', 'さんじゅう', 'よんじゅう', 'ごじゅう'];
  const ONES_K = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const TENS_K = ['', '十', '二十', '三十', '四十', '五十'];
  let kanjiNum, kanaNum, kanaUnit;
  if (tens === 0) {
    kanjiNum = ONES_K[ones];
    kanaNum  = ONES_NUM_R[ones];
    kanaUnit = ONES_UNIT_R[ones];
  } else if (ones === 0) {
    kanjiNum = TENS_K[tens];
    kanaNum  = TENS_ONLY_NUM_R[tens];
    kanaUnit = 'ぷん'; // tens-only always lands on pun
  } else {
    kanjiNum = TENS_K[tens] + ONES_K[ones];
    kanaNum  = TENS_PREFIX_R[tens] + ONES_NUM_R[ones];
    kanaUnit = ONES_UNIT_R[ones];
  }
  return { kanjiNum, kanaNum, kanaUnit };
}
function buildTimeReading(hour24, minute) {
  // Hours 1–12 with the three irregulars baked in (4→よ, 7→しち, 9→く).
  const HOUR_K = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const HOUR_R = ['', 'いち', 'に', 'さん', 'よ', 'ご', 'ろく', 'しち', 'はち', 'く', 'じゅう', 'じゅういち', 'じゅうに'];
  let h12 = hour24 % 12;
  if (h12 === 0) h12 = 12;
  const periodJa   = hour24 < 12 ? '午前' : '午後';
  const periodKana = hour24 < 12 ? 'ごぜん' : 'ごご';
  const periodEn   = hour24 < 12 ? 'AM' : 'PM';
  // Marker-wrapper. Used to tint 時 / 分 / 半 (and their kana
  // equivalents じ / ふん|ぷん / はん) in gold so the unit boundaries
  // pop out — readouts like 午後十二時五十五分 are otherwise a wall of
  // characters with no visual break.
  const M = s => '<span class="dt-clock-mk">' + s + '</span>';
  const hourK = HOUR_K[h12] + M('時');
  const hourR = HOUR_R[h12] + M('じ');
  let minK = '', minR = '', altK = '', altR = '';
  if (minute > 0) {
    const min = buildMinuteReading(minute);
    minK = min.kanjiNum + M('分');
    minR = min.kanaNum + M(min.kanaUnit);
    if (minute === 30) {
      // The 半 alternative — both 三十分 and 半 are correct for 30.
      altK = periodJa + HOUR_K[h12] + M('時') + M('半');
      altR = periodKana + ' ' + HOUR_R[h12] + M('じ') + M('はん');
    }
  }
  const ja   = periodJa + hourK + minK + (altK ? ' / ' + altK : '');
  const kana = periodKana + ' ' + hourR + (minR ? ' ' + minR : '') + (altR ? ' / ' + altR : '');
  const en   = h12 + ':' + String(minute).padStart(2, '0') + ' ' + periodEn;
  return { ja, kana, en };
}

// ── Writing → Days & Time ──────────────────────────────────────────────
// Last basics page. Three sections mirror the spec carved out during
// design-expert:plan / :build:
//   一. Days of the week — the 7 ようび anchored by their elemental
//       kanji + the planetary parallel that pairs each day with its
//       Romance / Germanic counterpart.
//   二. Reading dates — 年→月→日, big-to-small (the OPPOSITE of English
//       "Oct 15, 2024"). A worked example breaks one date into its
//       three stamps.
//   三. Telling time — the 〜時 system, irregular readings (四 七 九
//       drop their normal on-yomi), 半 for "half past," and 〜分 with
//       the rendaku-driven pun/fun split, plus an interactive clock
//       (analog + numeric input) that converts any time to Japanese.
// Visual language: kanji-numbered section heads from sentence-structure
// (.dt-section-num one / two / three), numbered-card chrome from
// numbers (.dt-card), color-coded role stamps from the particle-verb
// diagram (.dt-stamp variants). Reads as a phrasebook chapter.
function renderWritingDatetime(container) {
  // Months are a formula, not a table. The rule (number + 月) is the
  // lesson; surface the rule once with inline canonical examples,
  // then surface the three exceptions prominently. The 12-cell grid
  // we used to render was a default — pattern-as-data when the
  // pattern itself IS the meaningful content.
  const monthIrregulars = [
    { n:4, kanji:'四月', kana:'しがつ',   en:'April',     wrong:'よんがつ' },
    { n:7, kanji:'七月', kana:'しちがつ', en:'July',      wrong:'なながつ' },
    { n:9, kanji:'九月', kana:'くがつ',   en:'September', wrong:'きゅうがつ' },
  ];
  const monthIrregularsHTML = monthIrregulars.map(m => `
    <div class="dt-month-irr-card">
      <div class="dt-month-irr-glyph">${escHTML(m.kanji)}</div>
      <div class="dt-month-irr-kana">${escHTML(m.kana)}</div>
      <div class="dt-month-irr-en">${escHTML(m.en)}</div>
      <div class="dt-month-irr-wrong">
        <span class="dt-month-irr-x">not</span>
        <span class="ja">${escHTML(m.wrong)}</span>
      </div>
    </div>`).join('');

  // Clock face hour-mark generation — 12 ticks at 30° intervals,
  // with 12/3/6/9 emphasized (longer + thicker). Computed in JS
  // because writing 12 hand-positioned SVG lines is more error-
  // prone than a single trig loop.
  const clockMarksHTML = [...Array(12)].map((_, i) => {
    const angle = i * 30;
    const isMain = i % 3 === 0;
    const r1 = isMain ? 74 : 80;
    const r2 = 88;
    const rad = angle * Math.PI / 180;
    const x1 = 100 + r1 * Math.sin(rad);
    const y1 = 100 - r1 * Math.cos(rad);
    const x2 = 100 + r2 * Math.sin(rad);
    const y2 = 100 - r2 * Math.cos(rad);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--dt-ink)" stroke-width="${isMain ? 2.5 : 1.2}" stroke-linecap="round" opacity="${isMain ? 1 : 0.6}"/>`;
  }).join('');

  // 7 days — Sunday first per JIS standard week start. The image
  // (provided in images/kanji/<日曜日>.webp etc.) does the visual
  // work; the elemental kanji moves into the body as a small line
  // beside the EN day name. No more paper-2 sub-frame fighting the
  // image; no more planet glyph floating on every card (the planetary
  // parallel lives in the section lede).
  const days = [
    { id:'nichi', ja:'日曜日', kana:'にちようび', en:'Sunday',    elem:'日' },
    { id:'getsu', ja:'月曜日', kana:'げつようび', en:'Monday',    elem:'月' },
    { id:'ka',    ja:'火曜日', kana:'かようび',   en:'Tuesday',   elem:'火' },
    { id:'sui',   ja:'水曜日', kana:'すいようび', en:'Wednesday', elem:'水' },
    { id:'moku',  ja:'木曜日', kana:'もくようび', en:'Thursday',  elem:'木' },
    { id:'kin',   ja:'金曜日', kana:'きんようび', en:'Friday',    elem:'金' },
    { id:'do',    ja:'土曜日', kana:'どようび',   en:'Saturday',  elem:'土' },
  ];
  const dayCardsHTML = days.map(d => `
    <div class="dt-day-card">
      <div class="dt-day-image">
        <image-slot
          id="day-${escAttr(d.id)}"
          image-key="kanji/${escAttr(d.ja)}"
          shape="rounded" radius="6" fit="contain" position="50% 50%" readonly
          placeholder=""></image-slot>
      </div>
      <div class="dt-day-body">
        <div class="dt-day-ja">${escHTML(d.ja)}</div>
        <div class="dt-day-kana">${escHTML(d.kana)}</div>
        <div class="dt-day-meta">
          <span class="dt-day-elem">${escHTML(d.elem)}</span>
          <span class="dt-day-sep">·</span>
          <span class="dt-day-en">${escHTML(d.en)}</span>
        </div>
      </div>
    </div>`).join('');

  // Worked date example — same date shown three ways to make the
  // big-to-small order land. 2024年12月31日 → 2024 / 12 / 31. The
  // 年 / 月 / 日 marker is the visual lead (large kanji), the numeral
  // sits below it as the data; the row reads as "kanji name first."
  const dateExampleHTML = `
    <div class="dt-date-row">
      <div class="dt-date-stamp">
        <span class="dt-date-marker">年</span>
        <span class="dt-date-num">2024</span>
        <span class="dt-date-label">year · ねん</span>
      </div>
      <div class="dt-date-stamp">
        <span class="dt-date-marker">月</span>
        <span class="dt-date-num">12</span>
        <span class="dt-date-label">month · がつ</span>
      </div>
      <div class="dt-date-stamp">
        <span class="dt-date-marker">日</span>
        <span class="dt-date-num">31</span>
        <span class="dt-date-label">day · にち</span>
      </div>
    </div>
    <div class="dt-date-translation">
      <span class="dt-date-trans-ja">二〇二四年十二月三十一日</span>
      <span class="dt-date-trans-en">December 31, 2024</span>
    </div>`;

  // 1〜12 hours — every entry shows the kanji number + 時. The four
  // irregular readings (四 七 九) get .is-irregular for a subtle
  // gold ring + label callout.
  const hours = [
    { n:1,  ja:'一時',  kana:'いちじ',   irr:false },
    { n:2,  ja:'二時',  kana:'にじ',     irr:false },
    { n:3,  ja:'三時',  kana:'さんじ',   irr:false },
    { n:4,  ja:'四時',  kana:'よじ',     irr:true,  note:'not しじ' },
    { n:5,  ja:'五時',  kana:'ごじ',     irr:false },
    { n:6,  ja:'六時',  kana:'ろくじ',   irr:false },
    { n:7,  ja:'七時',  kana:'しちじ',   irr:true,  note:'not ななじ' },
    { n:8,  ja:'八時',  kana:'はちじ',   irr:false },
    { n:9,  ja:'九時',  kana:'くじ',     irr:true,  note:'not きゅうじ' },
    { n:10, ja:'十時',  kana:'じゅうじ', irr:false },
    { n:11, ja:'十一時', kana:'じゅういちじ', irr:false },
    { n:12, ja:'十二時', kana:'じゅうにじ',   irr:false },
  ];
  const hoursHTML = hours.map(h => `
    <div class="dt-hour-cell${h.irr ? ' is-irregular' : ''}">
      <span class="dt-hour-num">${h.n}</span>
      <span class="dt-hour-ja">${escHTML(h.ja)}</span>
      <span class="dt-hour-kana">${escHTML(h.kana)}</span>
      ${h.irr ? `<span class="dt-hour-note">${escHTML(h.note)}</span>` : ''}
    </div>`).join('');

  // Minutes — show the fun/pun rendaku split with one canonical
  // example per cell. 6 entries gives enough rhythm without
  // overwhelming.
  const minutes = [
    { n:1,  ja:'一分',  kana:'いっぷん', stem:'pun' },
    { n:2,  ja:'二分',  kana:'にふん',   stem:'fun' },
    { n:3,  ja:'三分',  kana:'さんぷん', stem:'pun' },
    { n:5,  ja:'五分',  kana:'ごふん',   stem:'fun' },
    { n:10, ja:'十分',  kana:'じゅっぷん', stem:'pun', note:'also じっぷん' },
    { n:30, ja:'三十分', kana:'さんじゅっぷん', stem:'pun', altJa:'半', altKana:'はん' },
  ];
  const minutesHTML = minutes.map(m => `
    <div class="dt-min-cell">
      <span class="dt-min-num">${m.n}</span>
      <span class="dt-min-ja">${escHTML(m.ja)}</span>
      <span class="dt-min-kana">${escHTML(m.kana)}</span>
      ${m.altJa ? `<span class="dt-min-alt"><span class="dt-min-alt-ja">${escHTML(m.altJa)}</span><span class="dt-min-alt-kana">${escHTML(m.altKana)}</span></span>` : ''}
      <span class="dt-min-stem dt-min-stem-${escAttr(m.stem)}">${escHTML(m.stem)}</span>
    </div>`).join('');

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · 日付と時刻</div>
      <div class="page-title-jp">ようび と じこく <span style="font-family:var(--serif); font-style:italic; color:var(--ink-3); font-weight:400; font-size:0.5em;">— days and the clock</span></div>
      <div class="page-title-en">The seven days, the year–month–day order that runs the opposite of English, and the clock readings that bend the numbers you already know.</div>
      <div class="rule"></div>
    </div>

    <div class="dt-page">

      <!-- Days of the week ─────────────────────────────────────────── -->
      <section class="dt-section">
        <div class="dt-section-head">
          <h2 class="dt-section-title">The seven elemental days</h2>
          <p class="dt-section-lede">Each day is an elemental kanji + 曜日. Sun → Moon → Mars → Mercury → Jupiter → Venus → Saturn — the same planetary order that runs the Romance week, so 火曜日 matches Italian <i>martedì</i>, 金曜日 matches French <i>vendredi</i>.</p>
        </div>

        <!-- 曜 construction diagram — visual equation that primes
             the day grid below. Reads as "any element + the 曜
             marker + 日 = a day name." The 曜 image is the
             centerpiece (the kanji the learner doesn't already
             know), flanked by the swap-slot of 7 elementals on
             the left and the closing 日 on the right. -->
        <div class="dt-yo-build">
          <div class="dt-yo-build-slot">
            <span class="dt-yo-build-slot-eyebrow">any one of</span>
            <div class="dt-yo-build-elements">
              <span class="dt-yo-build-elem" style="--dt-elem:var(--dt-elem-sun)">日</span>
              <span class="dt-yo-build-elem" style="--dt-elem:var(--dt-elem-moon)">月</span>
              <span class="dt-yo-build-elem" style="--dt-elem:var(--dt-elem-fire)">火</span>
              <span class="dt-yo-build-elem" style="--dt-elem:var(--dt-elem-water)">水</span>
              <span class="dt-yo-build-elem" style="--dt-elem:var(--dt-elem-wood)">木</span>
              <span class="dt-yo-build-elem" style="--dt-elem:var(--dt-elem-metal)">金</span>
              <span class="dt-yo-build-elem" style="--dt-elem:var(--dt-elem-earth)">土</span>
            </div>
            <span class="dt-yo-build-slot-label">elemental kanji</span>
          </div>
          <span class="dt-yo-build-plus">+</span>
          <div class="dt-yo-build-yo">
            <span class="dt-yo-build-yo-eyebrow">the marker</span>
            <div class="dt-yo-build-yo-image">
              <image-slot id="dt-yo-image"
                          image-key="kanji/曜"
                          shape="rounded" radius="8" fit="contain" position="50% 50%" readonly
                          placeholder=""></image-slot>
            </div>
            <span class="dt-yo-build-yo-label"><span class="ja">曜 · よう</span></span>
          </div>
          <span class="dt-yo-build-plus">+</span>
          <div class="dt-yo-build-day">
            <span class="dt-yo-build-day-eyebrow">closing</span>
            <span class="dt-yo-build-day-glyph">日</span>
            <span class="dt-yo-build-day-label"><span class="ja">日 · び</span></span>
          </div>
          <span class="dt-yo-build-eq">=</span>
          <div class="dt-yo-build-result">
            <span class="dt-yo-build-result-eyebrow">a day name</span>
            <div class="dt-yo-build-result-formula">
              <span class="dt-yo-build-result-slot">X</span>
              <span class="dt-yo-build-result-tail">曜日</span>
            </div>
            <span class="dt-yo-build-result-ex">
              <span class="ja">火曜日</span> · <span class="ja">水曜日</span> · <span class="ja">金曜日</span>…
            </span>
          </div>
        </div>
        <p class="dt-yo-build-explain">
          The 曜 in the middle is the same character in all seven days — it never changes. The learner's job is just to recognize which elemental kanji goes in the left slot. Once you know the seven elements (<span class="ja">日 月 火 水 木 金 土</span>), every day name is one substitution away.
        </p>

        <div class="dt-day-grid">
          ${dayCardsHTML}
        </div>

        <!-- Months: formula + exceptions ──────────────────────────
             Showing all 12 was the AI-default — pattern rendered as a
             data table. The rule (number + 月 → Nがつ) is the lesson;
             the work is memorizing the three exceptions. Formula card
             on top, three exception cards below. -->
        <h3 class="dt-subsection-title">Months are read as numbers of the moon<em>月 · the lunar count</em></h3>
        <div class="dt-block-label"><span class="ja">月</span> · the twelve months — a formula and three exceptions</div>

        <div class="dt-month-formula-card">
          <div class="dt-month-formula">
            <span class="dt-month-formula-n">N</span>
            <span class="dt-month-formula-glyph">月</span>
            <span class="dt-month-formula-eq">=</span>
            <span class="dt-month-formula-n">N</span>
            <span class="dt-month-formula-suffix">がつ</span>
          </div>
          <p class="dt-month-formula-explain">
            Months are just <b>a number + <span class="ja">月</span></b>. Plug any 1–12 into the slot and the reading is just that number + <span class="ja">がつ</span>.<br>
            <span class="dt-month-formula-examples"><span class="ja">一月 (いちがつ)</span> · <span class="ja">三月 (さんがつ)</span> · <span class="ja">十月 (じゅうがつ)</span> · <span class="ja">十二月 (じゅうにがつ)</span></span>
          </p>
        </div>

        <div class="dt-month-irr-label">Three readings that bend <em>— memorize as exceptions</em></div>
        <div class="dt-month-irr-grid">
          ${monthIrregularsHTML}
        </div>
        <p class="dt-month-footnote">
          Same irregulars as the hours (<span class="ja">四 七 九</span>): the on-readings clip into a shorter form. Once these three click, every other month follows the formula.
        </p>
      </section>

      <!-- Reading dates ────────────────────────────────────────────── -->
      <section class="dt-section">
        <div class="dt-section-head">
          <h2 class="dt-section-title">Dates run big to small</h2>
          <p class="dt-section-lede">Year → month → day, biggest unit first, each marked by its kanji (年 / 月 / 日).</p>
        </div>
        ${dateExampleHTML}
        <dl class="dt-date-rules">
          <dt><span class="dt-date-rule-marker">年</span> <span class="dt-date-rule-kana">ねん</span></dt>
          <dd>Read each digit individually (<span class="ja">に・ぜろ・に・よん年</span>) or as a number (<span class="ja">にせんにじゅうよねん</span>).</dd>
          <dt><span class="dt-date-rule-marker">月</span> <span class="dt-date-rule-kana">がつ</span></dt>
          <dd>Months use the on-readings: <span class="ja">一月 (いちがつ)</span> through <span class="ja">十二月 (じゅうにがつ)</span>.</dd>
          <dt><span class="dt-date-rule-marker">日</span> <span class="dt-date-rule-kana">にち / か</span></dt>
          <dd>Day-of-month is irregular for 1〜10 + 14, 20, 24 — they take <i>kun</i>-readings ending in <span class="ja">か</span>: <span class="ja">一日 ついたち, 二日 ふつか, 三日 みっか, 廿日 はつか</span>. Everything else takes <span class="ja">にち</span>.</dd>
        </dl>
      </section>

      <!-- Telling time ─────────────────────────────────────────────── -->
      <section class="dt-section">
        <div class="dt-section-head">
          <h2 class="dt-section-title">Reading the clock</h2>
          <p class="dt-section-lede"><span class="ja">〜時</span> for hours, <span class="ja">〜分</span> for minutes, <span class="ja">半</span> for half-past — three of the hours bend their reading (<span class="ja">四 七 九</span>).</p>
        </div>

        <div class="dt-block-label"><span class="ja">時</span> · the hours 1 〜 12</div>
        <div class="dt-hour-grid">${hoursHTML}</div>

        <div class="dt-block-label"><span class="ja">分</span> · the minutes</div>
        <div class="dt-min-grid">${minutesHTML}</div>
        <p class="dt-min-explain-prose">
          <span class="dt-min-stem dt-min-stem-fun">fun</span> after 2, 4, 5, 7, 9 — the plain reading.
          <span class="dt-min-stem dt-min-stem-pun">pun</span> after 1, 3, 6, 8, 10 — rendaku-driven, often paired with a small <span class="ja">っ</span> in the kana (<span class="ja">いっぷん, さんぷん, ろっぷん</span>).
          <span class="ja">半 (han)</span> replaces "30 minutes" — <span class="ja">三時半</span> is "three thirty," not "three hours and a half."
        </p>

        <div class="dt-block-label">午前 · 午後 — AM and PM</div>
        <div class="dt-ampm-row">
          <div class="dt-ampm-block dt-ampm-am">
            <div class="dt-ampm-ja">午前</div>
            <div class="dt-ampm-kana">ごぜん</div>
            <div class="dt-ampm-en">AM — before noon</div>
          </div>
          <div class="dt-ampm-block dt-ampm-pm">
            <div class="dt-ampm-ja">午後</div>
            <div class="dt-ampm-kana">ごご</div>
            <div class="dt-ampm-en">PM — after noon</div>
          </div>
        </div>
        <p class="dt-ampm-footnote">
          AM/PM markers PRECEDE the hour: <span class="ja">午前九時 (ごぜん くじ)</span> is 9 AM, <span class="ja">午後三時半 (ごご さんじはん)</span> is 3:30 PM. The 24-hour clock just keeps counting: <span class="ja">十八時三十分</span> is 18:30.
        </p>

        <!-- Interactive clock — convert any time to its Japanese
             reading. Two input paths: drag the hour/minute hands on
             the SVG face, or type the hour (0–23) and minute (0–59).
             Both are bidirectional with one shared state. Helper
             functions buildTimeReading / buildMinuteReading (above
             this renderer) bake in the hour irregulars and the
             fun/pun rendaku rule so the readout is correct without
             the learner needing to think about either. -->
        <div class="dt-block-label"><span class="ja">時刻</span> · convert any time to Japanese</div>
        <div class="dt-clock-card">
          <div class="dt-clock-left">
            <svg id="dt-clock-svg" viewBox="0 0 200 200" class="dt-clock-svg" role="img" aria-label="interactive clock — drag the hands to set a time">
              <!-- face -->
              <circle cx="100" cy="100" r="92" fill="var(--dt-paper-2)" stroke="var(--paper-edge)" stroke-width="2"/>
              <!-- hour marks -->
              ${clockMarksHTML}
              <!-- hour numbers at 12 / 3 / 6 / 9 in kanji -->
              <text x="100" y="36" text-anchor="middle" font-family="var(--serif-jp)" font-size="13" font-weight="700" fill="var(--dt-ink)">十二</text>
              <text x="166" y="106" text-anchor="middle" font-family="var(--serif-jp)" font-size="14" font-weight="700" fill="var(--dt-ink)">三</text>
              <text x="100" y="174" text-anchor="middle" font-family="var(--serif-jp)" font-size="14" font-weight="700" fill="var(--dt-ink)">六</text>
              <text x="34" y="106" text-anchor="middle" font-family="var(--serif-jp)" font-size="14" font-weight="700" fill="var(--dt-ink)">九</text>
              <!-- minute hand (drawn first so the hour hand sits on top) -->
              <line id="dt-clock-min-hand" data-clock-hand="min"
                    x1="100" y1="100" x2="100" y2="22"
                    stroke="var(--dt-ink-2)" stroke-width="3" stroke-linecap="round"
                    transform="rotate(180 100 100)" style="cursor: grab"/>
              <!-- hour hand -->
              <line id="dt-clock-hour-hand" data-clock-hand="hour"
                    x1="100" y1="100" x2="100" y2="48"
                    stroke="var(--dt-ink)" stroke-width="5" stroke-linecap="round"
                    transform="rotate(270 100 100)" style="cursor: grab"/>
              <!-- center pin -->
              <circle cx="100" cy="100" r="6" fill="var(--dt-gold-dark)"/>
              <circle cx="100" cy="100" r="2.5" fill="var(--dt-paper)"/>
            </svg>
          </div>
          <div class="dt-clock-right">
            <div class="dt-clock-inputs">
              <label class="dt-clock-input-group">
                <span class="dt-clock-input-glyph">時</span>
                <span class="dt-clock-input-label">hour</span>
                <input type="number" id="dt-clock-hour" min="0" max="23" step="1" value="9" aria-label="hour 0 to 23">
                <span class="dt-clock-input-hint">0–23</span>
              </label>
              <label class="dt-clock-input-group">
                <span class="dt-clock-input-glyph">分</span>
                <span class="dt-clock-input-label">min</span>
                <input type="number" id="dt-clock-min" min="0" max="59" step="1" value="30" aria-label="minute 0 to 59">
                <span class="dt-clock-input-hint">0–59</span>
              </label>
              <button type="button" id="dt-clock-ampm" class="dt-clock-ampm-btn" aria-label="flip between AM and PM">
                <span class="dt-clock-ampm-icon">⇄</span>
                <span class="dt-clock-ampm-text">flip AM/PM</span>
              </button>
            </div>
            <div class="dt-clock-readout">
              <div class="dt-clock-readout-label"><span class="ja">日本語で</span> · in Japanese</div>
              <div class="dt-clock-ja" id="dt-clock-ja"></div>
              <div class="dt-clock-kana" id="dt-clock-kana"></div>
              <div class="dt-clock-en" id="dt-clock-en"></div>
            </div>
          </div>
        </div>
        <p class="dt-clock-explain">
          <b>Two ways to set the time.</b> Type the hour (0–23) and minute (0–59) into the inputs, or grab the clock hands and drag — both paths stay in sync. The Japanese reading updates live, with the hour irregulars (<span class="ja">四 七 九</span>) and the <span class="ja">ぷん</span>/<span class="ja">ふん</span> rendaku applied automatically. At 30 minutes you'll see both <span class="ja">三十分</span> and the <span class="ja">半</span> alternative — they're interchangeable. Use the <b>flip AM/PM</b> button to swap between morning and afternoon while keeping the same clock position.
        </p>
      </section>
    </div>`;

  // Wire the interactive clock — synced inputs + draggable SVG hands.
  // Bound here rather than in a separate function so the closure has
  // direct access to the buildTimeReading helper above.
  const clockSvg  = container.querySelector('#dt-clock-svg');
  const hourIn    = container.querySelector('#dt-clock-hour');
  const minIn     = container.querySelector('#dt-clock-min');
  const ampmBtn   = container.querySelector('#dt-clock-ampm');
  const jaOut     = container.querySelector('#dt-clock-ja');
  const kanaOut   = container.querySelector('#dt-clock-kana');
  const enOut     = container.querySelector('#dt-clock-en');
  const hourHand  = container.querySelector('#dt-clock-hour-hand');
  const minHand   = container.querySelector('#dt-clock-min-hand');
  if (clockSvg && hourIn && minIn) {
    // State lives inside this closure so re-renders of the page reset
    // to the initial value. Two-way sync between inputs and hands.
    const state = { h: 9, m: 30 };

    function render() {
      const r = buildTimeReading(state.h, state.m);
      // ja/kana strings carry <span class="dt-clock-mk"> markers so the
      // unit kanji/kana tint gold — use innerHTML. Strings come from
      // our own code (no user input), so no XSS surface. en stays
      // plain text (no markers there).
      jaOut.innerHTML = r.ja;
      kanaOut.innerHTML = r.kana;
      enOut.textContent = r.en;
      // 12-hour position on the face — hour hand also creeps with minute
      // (e.g. 9:30 sits the hour hand halfway between 9 and 10).
      const hAngle = ((state.h % 12) + state.m / 60) * 30;
      const mAngle = state.m * 6;
      hourHand.setAttribute('transform', `rotate(${hAngle} 100 100)`);
      minHand.setAttribute('transform', `rotate(${mAngle} 100 100)`);
      // Reflect state back into the inputs (in case a drag changed them).
      if (document.activeElement !== hourIn) hourIn.value = state.h;
      if (document.activeElement !== minIn)  minIn.value = state.m;
    }

    function clampInt(v, lo, hi) {
      const n = parseInt(v, 10);
      if (isNaN(n)) return lo;
      return Math.max(lo, Math.min(hi, n));
    }
    hourIn.addEventListener('input', () => { state.h = clampInt(hourIn.value, 0, 23); render(); });
    minIn.addEventListener('input',  () => { state.m = clampInt(minIn.value,  0, 59); render(); });
    ampmBtn.addEventListener('click', () => { state.h = (state.h + 12) % 24; render(); });

    // Drag the clock hands. The angle is measured from 12 o'clock
    // clockwise. We use atan2(dx, -dy) so straight up = 0°, 3
    // o'clock = 90°, etc. — matches the rotate(deg 100 100) the
    // SVG uses, no conversion needed.
    let dragging = null;
    function angleFromPointer(clientX, clientY) {
      const rect = clockSvg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let a = Math.atan2(clientX - cx, cy - clientY) * 180 / Math.PI;
      if (a < 0) a += 360;
      return a;
    }
    function onMove(e) {
      if (!dragging) return;
      const cx = e.clientX != null ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
      const cy = e.clientY != null ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY);
      if (cx == null || cy == null) return;
      const a = angleFromPointer(cx, cy);
      if (dragging === 'min') {
        // Wrap-aware minute: crossing 12 forward (59→0) bumps the hour
        // up; crossing backward (0→59) bumps it down. Detect by signed
        // delta — if the raw (oldM → newM) diff exceeds half a
        // revolution, treat as a wraparound in the OPPOSITE direction.
        // The arithmetic ends up as `finalM = oldM + signedDelta`; the
        // hour shifts if finalM lands outside [0, 60).
        const newM = Math.round(a / 6) % 60;
        let signedDelta = newM - state.m;
        if (signedDelta >  30) signedDelta -= 60;
        if (signedDelta < -30) signedDelta += 60;
        const finalM = state.m + signedDelta;
        if (finalM < 0)        state.h = (state.h - 1 + 24) % 24;
        else if (finalM >= 60) state.h = (state.h + 1) % 24;
        state.m = (finalM + 60) % 60;
      } else if (dragging === 'hour') {
        // Wrap-aware hour: the hour hand cycles the 12-position face
        // twice per day. Crossing 12 (top) toggles between AM and PM.
        // We pick whichever of the two candidate h24 values matches
        // the angle (the AM one and the PM one — e.g., 3 o'clock means
        // EITHER 3 AM (h=3) OR 3 PM (h=15)) by closest modulo-24
        // distance to the current state. So dragging clockwise from
        // 11 AM (h=11) past 12 lands at 12 PM (h=12) rather than 0
        // (12 AM), because 12 is closer than 0 in the wraparound.
        let h12 = Math.round(a / 30) % 12;
        if (h12 === 0) h12 = 12;
        const candAm = h12 === 12 ? 0  : h12;       // 12→0   (AM hour)
        const candPm = h12 === 12 ? 12 : h12 + 12;  // 12→12  (PM hour)
        const modDist = (x, y) => {
          const d = Math.abs(x - y) % 24;
          return Math.min(d, 24 - d);
        };
        state.h = modDist(candAm, state.h) <= modDist(candPm, state.h) ? candAm : candPm;
      }
      render();
      e.preventDefault();
    }
    function onUp() {
      dragging = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    }
    function onDown(e) {
      const t = e.target.closest('[data-clock-hand]');
      if (!t) return;
      dragging = t.dataset.clockHand;
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp, { once: true });
      window.addEventListener('touchend', onUp, { once: true });
      e.preventDefault();
    }
    clockSvg.addEventListener('mousedown', onDown);
    clockSvg.addEventListener('touchstart', onDown, { passive: false });

    render();
  }
}

// ── Writing → Particles ────────────────────────────────────────────────
// Picker row + lesson card. Reads window.PARTICLES (and, eventually,
// window.PARTICLE_QUIZ) from data.js. This is a starting point — the
// /design-expert:build pass will refine the layout next.
function renderWritingParticles(container) {
  const list = (window.PARTICLES || []);
  if (!list.length) {
    container.innerHTML = `<div class="page-head"><div class="page-title-jp">じょし</div><div class="page-title-en">Particles — data not loaded</div></div>`;
    return;
  }
  // Four top-level modes: 'quiz' (the test), 'lessons' (guided walk-throughs),
  // 'articles' (curiosity reads), 'particle' (single-particle lesson).
  // The 3rd sidebar drives this switch.
  if (APP.particleMode === 'quiz')     return renderParticleQuiz(container);
  if (APP.particleMode === 'lessons')  return renderParticleLessons(container);
  if (APP.particleMode === 'articles') return renderParticleArticles(container);
  // Clamp the saved index in case the data set shrunk.
  if (APP.particleIdx >= list.length || APP.particleIdx < 0) APP.particleIdx = 0;
  const p = list[APP.particleIdx];

  // Map every known particle char to its assigned color (built once per
  // render). Used for the parts-array path below.
  const colorOf = {};
  list.forEach(q => { colorOf[q.char] = q.color; });

  // Render an example sentence with EVERY particle in its assigned color.
  //
  // Preferred path: example provides `parts: ['コーヒー','は','好きです','が', …]`
  // — each entry that matches a known particle char gets its color span;
  // everything else is plain text. This is unambiguous and avoids the
  // ありがとう / できます false-positive problem that naive substring
  // matching would hit.
  //
  // Fallback (legacy data without parts): highlight ONLY the lesson's
  // particle, first occurrence, in the lesson's color — same behavior as
  // the original v1.
  const paintExample = (ex) => {
    if (Array.isArray(ex.parts)) {
      return ex.parts.map(seg => {
        const col = colorOf[seg];
        return col
          ? `<span class="pc" style="color:${escAttr(col)}">${escHTML(seg)}</span>`
          : escHTML(seg);
      }).join('');
    }
    const text = ex.ja || '';
    const ch = p.char;
    const color = p.color;
    if (!ch) return escHTML(text);
    const idx = text.indexOf(ch);
    if (idx < 0) return escHTML(text);
    return escHTML(text.slice(0, idx))
         + `<span class="pc" style="color:${escAttr(color)}">${escHTML(ch)}</span>`
         + escHTML(text.slice(idx + ch.length));
  };

  // Pattern row: JP cells render in the particle color; everything else is
  // an italic placeholder slot. Arrow joiner passes through.
  const isJp = (s) => /[぀-ヿ㐀-鿿]/.test(s || '');
  const patternHTML = (cells, color) => `
    <span class="use-pattern">
      ${cells.map(c => {
        if (isJp(c)) return `<span class="pcc" style="color:${escAttr(color)}">${escHTML(c)}</span>`;
        if (c === '→') return `<span class="arrow">→</span>`;
        return `<span class="slot">${escHTML(c)}</span>`;
      }).join('')}
    </span>`;

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · particle</div>
      <div class="page-title-jp">${escHTML(p.char)} <span style="color:${escAttr(p.color)};font-style:italic;font-family:var(--serif);font-size:0.6em;margin-left:8px">${escHTML(p.romaji)}</span></div>
      <div class="page-title-en">${escHTML(p.role)}</div>
    </div>
    <div class="rule"></div>

    <div class="particle-lesson" style="--pc:${escAttr(p.color)}">
      <span class="corner-tl"></span>
      <span class="corner-tr"></span>

      <div class="lesson-hd">
        <div class="glyph-big">${escHTML(p.char)}</div>
        <div class="lesson-titles">
          <div class="romaji">${escHTML(p.romaji)}</div>
          <div class="role">${escHTML(p.role)}</div>
          <div class="tagline">${escHTML(p.tagline)}</div>
          ${p.note ? `<div class="pronounce-note">✎ ${p.note}</div>` : ''}
        </div>
      </div>

      <div class="uses">
        ${p.uses.map((u, i) => `
          <div class="use">
            <div class="use-num">${i + 1}</div>
            <div class="use-body">
              <div class="use-rule">${escHTML(u.rule)}</div>
              <div class="use-title">${escHTML(u.title)}</div>
              ${patternHTML(u.pattern, p.color)}
              <div class="examples">
                ${u.examples.map(ex => `
                  <div class="example">
                    <div class="ja">${paintExample(ex)}</div>
                    ${ex.kana ? `<div class="kana">${escHTML(ex.kana)}</div>` : ''}
                    <div class="en">${escHTML(ex.en)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${p.compare ? `
        <div class="compare">
          <div class="compare-hd">↔ ${escHTML(p.compare.hd)}</div>
          <div class="compare-body">${p.compare.body}</div>
        </div>
      ` : ''}
    </div>`;

}

// ── Sentence Structure page ────────────────────────────────────────────
// Pure educational content — no clicks, no state, no quizzes. Eight
// sections that walk a learner from "English vs Japanese" through the
// verb-as-anchor metaphor, the four lego-block parts of speech, building
// short and long sentences, word reordering for emphasis, the two
// non-negotiable rules, and the は/が + に/で confusing pairs.
//
// CSS lives in the main <style> block, all classes prefixed `ss-`. The
// only side effect is a single setTimeout that flips the ss-drawn class
// on each section-num so the kanji "brush" themselves in on first paint.
function renderWritingSentenceStructure(container) {
  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · grammar</div>
      <div class="page-title-jp">ぶんの くみたて <span style="font-family:var(--serif); font-style:italic; color:var(--ink-3); font-weight:400; font-size:0.5em;">— building a Japanese sentence</span></div>
      <div class="page-title-en">If English is a line, Japanese is a constellation. Words can sit almost anywhere — what matters is the little tag that follows each one, and the verb that pins everything to the end.</div>
      <div class="rule"></div>
    </div>

    <div class="ss-page">

      <!-- 1. English vs Japanese -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="h" style="--rot: -4deg;"><span class="ss-kanji-num">一</span></span>
          <h2 class="ss-section-title">A different way of saying the same thing<em>english vs japanese</em></h2>
          <p class="ss-section-lede">English uses <b>word order</b> to tell you who's doing what to whom. Japanese uses <b>little markers called particles</b> — and the verb almost always lands at the very end.</p>
        </div>

        <div class="ss-card">
          <div class="ss-contrast">
            <div class="ss-lang-panel">
              <h3>English</h3>
              <div class="ss-lang-sentence">
                <span class="ss-en-word">I</span>
                <span class="ss-verb-pop">watch</span>
                <span class="ss-en-word">anime</span>.
              </div>
              <div class="ss-lang-rule">
                <b>Word order = meaning.</b><br>
                Subject &nbsp;→&nbsp; <i>Verb</i> &nbsp;→&nbsp; Object.<br>
                Move "I" and "anime" and the sentence breaks.
              </div>
            </div>

            <div class="ss-vs">vs.</div>

            <div class="ss-lang-panel">
              <h3>Japanese</h3>
              <div class="ss-lang-sentence">
                私<span class="ss-pmark ss-wa">は</span> アニメ<span class="ss-pmark ss-o">を</span> <span class="ss-verb-pop">見る</span>。
              </div>
              <div class="ss-lang-rule">
                <b>Particles = meaning.</b><br>
                Each noun carries a marker telling its job.<br>
                The <span style="color:var(--block-verb-dk); font-weight:600;">verb</span> sits at the end.
              </div>
            </div>
          </div>
        </div>

        <p class="ss-footnote">
          So <span class="ss-pmark ss-wa">は</span> tags <i>watashi</i> as the topic. <span class="ss-pmark ss-o">を</span> tags <i>anime</i> as the thing being watched. Once those tags are in place, the order can shuffle — and the meaning still holds.
        </p>
      </section>

      <!-- 2. The verb is the anchor -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="h" style="--rot: -2deg;"><span class="ss-kanji-num">二</span></span>
          <h2 class="ss-section-title">The verb is the anchor<em>動詞 / どうし</em></h2>
          <p class="ss-section-lede">Picture every Japanese sentence as a planet. The <b>verb</b> sits at the center. Everything else orbits — and each piece of information clips on with its own little particle.</p>
        </div>

        <div class="ss-card ss-feature">
          <span class="ss-corner-a"></span><span class="ss-corner-b"></span>
          <div class="pv-wrap">
            <!-- Anatomy: a real Japanese sentence laid out left-to-right
                 as a sequence of paper-stamps, terminating in the verb.
                 The sentence is plain SVO with 5 particles — wide
                 enough to demonstrate the rule, narrow enough to scan
                 without strain. The verb sits at the FAR RIGHT as the
                 terminus; this geometry IS the lesson. -->
            <div class="pv-eyebrow">
              <span class="pv-eyebrow-ja">読みやすい順</span>
              natural order — verb arrives last
            </div>

            <div class="pv-track" role="presentation">
              <div class="pv-stamp" data-pc="wa" style="--pc:var(--pc-wa)">
                <div class="pv-stamp-body">
                  <span class="pv-stamp-word">田中さん</span>
                  <span class="pv-stamp-particle">は</span>
                </div>
                <span class="pv-stamp-role">Topic<em>主題</em></span>
              </div>
              <div class="pv-stamp" data-pc="ni-time" style="--pc:var(--pc-ni)">
                <div class="pv-stamp-body">
                  <span class="pv-stamp-word">月曜日</span>
                  <span class="pv-stamp-particle">に</span>
                </div>
                <span class="pv-stamp-role">Time<em>時間</em></span>
              </div>
              <div class="pv-stamp" data-pc="de-loc" style="--pc:var(--pc-de)">
                <div class="pv-stamp-body">
                  <span class="pv-stamp-word">学校</span>
                  <span class="pv-stamp-particle">で</span>
                </div>
                <span class="pv-stamp-role">Location<em>場所</em></span>
              </div>
              <div class="pv-stamp" data-pc="to" style="--pc:var(--pc-to)">
                <div class="pv-stamp-body">
                  <span class="pv-stamp-word">先生</span>
                  <span class="pv-stamp-particle">と</span>
                </div>
                <span class="pv-stamp-role">With<em>同伴者</em></span>
              </div>
              <div class="pv-stamp" data-pc="o" style="--pc:var(--pc-o)">
                <div class="pv-stamp-body">
                  <span class="pv-stamp-word">本</span>
                  <span class="pv-stamp-particle">を</span>
                </div>
                <span class="pv-stamp-role">Object<em>目的語</em></span>
              </div>
              <div class="pv-verb">
                <span class="pv-verb-eyebrow">
                  <span class="pv-verb-eyebrow-ja">終わり</span>· the end
                </span>
                <div class="pv-verb-body">
                  <span class="pv-verb-word">読みます</span>
                </div>
                <span class="pv-verb-label">Verb<em>動詞</em></span>
              </div>
            </div>

            <p class="pv-translation">
              Tanaka-san reads a book with the teacher at school on Monday.
            </p>

            <!-- Catalogue: every particle by role, including the dual
                 jobs of に (Time / Destination) and で (Location /
                 Means). Two cards each for に and で carry the
                 .pv-cat-card-dual modifier so the eye notices the
                 dashed border-left and registers "same shape, two
                 jobs." -->
            <div class="pv-catalog">
              <div class="pv-catalog-title">
                全部の助詞 <em>· all eight particles, by role</em>
              </div>
              <div class="pv-catalog-grid">
                <div class="pv-cat-card" style="--pc:var(--pc-wa)">
                  <span class="pv-cat-glyph">は</span>
                  <span class="pv-cat-role-en">Topic</span>
                  <span class="pv-cat-role-ja">主題 — what we're talking about</span>
                  <span class="pv-cat-ex">田中さん<span>は</span></span>
                </div>
                <div class="pv-cat-card" style="--pc:var(--pc-o)">
                  <span class="pv-cat-glyph">を</span>
                  <span class="pv-cat-role-en">Object</span>
                  <span class="pv-cat-role-ja">目的語 — what the verb acts on</span>
                  <span class="pv-cat-ex">本<span>を</span></span>
                </div>
                <div class="pv-cat-card" style="--pc:var(--pc-ni)">
                  <span class="pv-cat-glyph">に</span>
                  <span class="pv-cat-role-en">Time</span>
                  <span class="pv-cat-role-ja">時間 — when it happens</span>
                  <span class="pv-cat-ex">月曜日<span>に</span></span>
                </div>
                <div class="pv-cat-card pv-cat-card-dual" style="--pc:var(--pc-ni)">
                  <span class="pv-cat-glyph">に</span>
                  <span class="pv-cat-role-en">Destination</span>
                  <span class="pv-cat-role-ja">行き先 — where it's heading</span>
                  <span class="pv-cat-ex">学校<span>に</span></span>
                </div>
                <div class="pv-cat-card" style="--pc:var(--pc-de)">
                  <span class="pv-cat-glyph">で</span>
                  <span class="pv-cat-role-en">Location</span>
                  <span class="pv-cat-role-ja">場所 — where it happens</span>
                  <span class="pv-cat-ex">学校<span>で</span></span>
                </div>
                <div class="pv-cat-card pv-cat-card-dual" style="--pc:var(--pc-de)">
                  <span class="pv-cat-glyph">で</span>
                  <span class="pv-cat-role-en">Means</span>
                  <span class="pv-cat-role-ja">手段 — how it's done</span>
                  <span class="pv-cat-ex">電車<span>で</span></span>
                </div>
                <div class="pv-cat-card" style="--pc:var(--pc-kara)">
                  <span class="pv-cat-glyph">から</span>
                  <span class="pv-cat-role-en">Origin</span>
                  <span class="pv-cat-role-ja">出発点 — where it starts</span>
                  <span class="pv-cat-ex">駅<span>から</span></span>
                </div>
                <div class="pv-cat-card" style="--pc:var(--pc-to)">
                  <span class="pv-cat-glyph">と</span>
                  <span class="pv-cat-role-en">Co-participant</span>
                  <span class="pv-cat-role-ja">同伴者 — who's along</span>
                  <span class="pv-cat-ex">先生<span>と</span></span>
                </div>
              </div>
            </div>

            <p class="pv-note">
              The verb arrives last. Everything before it is <em>optional</em> — even the topic <span class="pv-pc" style="--pc:var(--pc-wa)">は</span>.<br>
              Word order tweaks the <em>emphasis</em>, but rarely the underlying meaning.
            </p>
          </div>
        </div>
      </section>

      <!-- 3. The four building blocks -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="h" style="--rot: 3deg;"><span class="ss-kanji-num">三</span></span>
          <h2 class="ss-section-title">Four kinds of building block<em>like clip-together pieces</em></h2>
          <p class="ss-section-lede">If we colour every word in a Japanese sentence by its <b>part of speech</b>, only four colours come back. Memorise these four shapes and you'll see the seams in every sentence.</p>
        </div>

        <div class="ss-lego-legend">
          <div class="ss-lego-card">
            <div class="ss-shape-row"><span class="ss-blk ss-noun">名詞 <small>noun</small></span></div>
            <h4>Nouns &amp; な-adjectives</h4>
            <p class="ss-what">The "things" of the sentence: people, places, ideas. <i>な</i>-adjectives feel like nouns and behave like them.</p>
            <p class="ss-ex"><span class="ss-jp">私 · 学校 · アニメ · 静か(な)</span><br>watashi · gakkou · anime · shizuka</p>
          </div>

          <div class="ss-lego-card">
            <div class="ss-shape-row"><span class="ss-blk ss-verb">動詞 <small>verb</small></span></div>
            <h4>Verbs &amp; い-adjectives</h4>
            <p class="ss-what">Words that conjugate. <i>い</i>-adjectives count here too — they take tense and negation just like verbs.</p>
            <p class="ss-ex"><span class="ss-jp">見る · 食べる · 行く · 寒い · 楽しい</span><br>miru · taberu · iku · samui · tanoshii</p>
          </div>

          <div class="ss-lego-card">
            <div class="ss-shape-row"><span class="ss-blk ss-part">助詞</span></div>
            <h4>Particles &amp; です</h4>
            <p class="ss-what">The tiny clips that label nouns and glue clauses together. <i>です</i> belongs here too — it's grammar, not vocabulary.</p>
            <p class="ss-ex"><span class="ss-jp">は · が · を · に · で · の · と · です</span><br>wa · ga · o · ni · de · no · to · desu</p>
          </div>

          <div class="ss-lego-card">
            <div class="ss-shape-row"><span class="ss-blk ss-stop">。</span></div>
            <h4>Sentence ender</h4>
            <p class="ss-what">The full stop. In Japanese it's the little circle <span class="ss-jp" style="font-family:var(--serif-jp); font-weight:700; color:var(--ink);">。</span> — and once you reach it, the sentence is sealed.</p>
            <p class="ss-ex"><span class="ss-jp">見る<span style="color:var(--block-stop-dk); font-weight:700;">。</span></span><br>"watch <i>(period)</i>"</p>
          </div>
        </div>

        <p class="ss-footnote">
          Notice the shapes: nouns and verbs are <i>arrows</i> that pass meaning forward. Particles are <i>diamonds</i> that snap between them. The full stop is the cap on the end.
        </p>
      </section>

      <!-- 4. Build a simple sentence -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="v" style="--rot: -5deg;"><span class="ss-kanji-num">四</span></span>
          <h2 class="ss-section-title">Snap the pieces together<em>your first sentence</em></h2>
          <p class="ss-section-lede">Let's build "<i>I watch anime.</i>" Each block clips onto the next — and the diamond particles are what hold the noun arrows in place.</p>
        </div>

        <div class="ss-sentence-build">
          <p class="ss-sentence-en">"I watch anime."</p>
          <p class="ss-sentence-jp-text">
            <span class="ss-w-noun">WATASHI</span>
            <span class="ss-w-h-wa">WA</span>
            <span class="ss-w-noun">ANIME</span>
            <span class="ss-w-h-o">WO</span>
            <span class="ss-w-verb">MITEIRU</span><span class="ss-w-stop">。</span>
          </p>
          <div class="ss-blocks-row">
            <span class="ss-blk ss-noun">私 <small>watashi</small></span>
            <span class="ss-blk ss-part ss-h-wa">は</span>
            <span class="ss-blk ss-noun">アニメ <small>anime</small></span>
            <span class="ss-blk ss-part ss-h-o">を</span>
            <span class="ss-blk ss-verb">見ている <small>miteiru</small></span>
            <span class="ss-blk ss-stop">。</span>
          </div>
          <div class="ss-breakdown">
            <div class="ss-bd ss-w-noun"><span class="ss-jp">私 (watashi)</span><span class="ss-role">I — the topic</span></div>
            <div class="ss-bd ss-w-part"><span class="ss-jp">は (wa)</span><span class="ss-role">topic marker</span></div>
            <div class="ss-bd ss-w-noun"><span class="ss-jp">アニメ (anime)</span><span class="ss-role">the thing watched</span></div>
            <div class="ss-bd ss-w-part"><span class="ss-jp">を (wo)</span><span class="ss-role">object marker</span></div>
            <div class="ss-bd ss-w-verb"><span class="ss-jp">見ている (miteiru)</span><span class="ss-role">am watching</span></div>
          </div>
        </div>
      </section>

      <!-- 5. Extend the sentence -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="v" style="--rot: 2deg;"><span class="ss-kanji-num">五</span></span>
          <h2 class="ss-section-title">Now make it longer<em>same shape, more pieces</em></h2>
          <p class="ss-section-lede">The same clip-together rule scales. Add more nouns, more particles, more clauses — but every new noun still needs its own diamond, and the verb still anchors the end.</p>
        </div>

        <div class="ss-sentence-build">
          <p class="ss-sentence-en">"I'm a fool who watches anime."</p>
          <p class="ss-sentence-jp-text">
            <span class="ss-w-noun">WATASHI</span>
            <span class="ss-w-h-wa">WA</span>
            <span class="ss-w-noun">ANIME</span>
            <span class="ss-w-h-o">WO</span>
            <span class="ss-w-verb">MIRU</span>
            <span class="ss-w-noun">BAKA</span>
            <span class="ss-w-part">DESU</span><span class="ss-w-stop">。</span>
          </p>
          <div class="ss-blocks-row">
            <span class="ss-blk ss-noun">私</span>
            <span class="ss-blk ss-part ss-h-wa">は</span>
            <span class="ss-blk ss-noun">アニメ</span>
            <span class="ss-blk ss-part ss-h-o">を</span>
            <span class="ss-blk ss-verb">見る</span>
            <span class="ss-blk ss-noun">バカ</span>
            <span class="ss-blk ss-part">です</span>
            <span class="ss-blk ss-stop">。</span>
          </div>
          <div class="ss-breakdown">
            <div class="ss-bd ss-w-noun"><span class="ss-jp">私</span><span class="ss-role">I</span></div>
            <div class="ss-bd ss-w-part"><span class="ss-jp">は</span><span class="ss-role">topic marker</span></div>
            <div class="ss-bd ss-w-noun"><span class="ss-jp">アニメ</span><span class="ss-role">anime (object)</span></div>
            <div class="ss-bd ss-w-part"><span class="ss-jp">を</span><span class="ss-role">object marker</span></div>
            <div class="ss-bd ss-w-verb"><span class="ss-jp">見る</span><span class="ss-role">watch — modifies バカ</span></div>
            <div class="ss-bd ss-w-noun"><span class="ss-jp">バカ</span><span class="ss-role">fool — the predicate</span></div>
            <div class="ss-bd ss-w-part"><span class="ss-jp">です</span><span class="ss-role">copula "am"</span></div>
          </div>
        </div>

        <p class="ss-footnote">
          See what happened? <span class="ss-pmark ss-o">を</span> still says "the thing being watched is <i>anime</i>" — even though the action of watching is now describing a <i>person</i> (バカ), not the speaker directly. Particles stay glued to their noun no matter what's happening around them.
        </p>

        <div class="ss-sentence-build" style="margin-top: 22px;">
          <p class="ss-sentence-en">"I watch anime with my cute cat."</p>
          <p class="ss-sentence-jp-text">
            <span class="ss-w-noun">WATASHI</span>
            <span class="ss-w-h-wa">WA</span>
            <span class="ss-w-noun">WATASHI</span>
            <span class="ss-w-h-no">NO</span>
            <span class="ss-w-verb">KAWAII</span>
            <span class="ss-w-noun">NEKO</span>
            <span class="ss-w-h-to">TO</span>
            <span class="ss-w-noun">ANIME</span>
            <span class="ss-w-h-o">WO</span>
            <span class="ss-w-verb">MIRU</span><span class="ss-w-stop">。</span>
          </p>
          <div class="ss-blocks-row">
            <span class="ss-blk ss-noun">私</span>
            <span class="ss-blk ss-part ss-h-wa">は</span>
            <span class="ss-blk ss-noun">私</span>
            <span class="ss-blk ss-part ss-h-no">の</span>
            <span class="ss-blk ss-verb">可愛い</span>
            <span class="ss-blk ss-noun">猫</span>
            <span class="ss-blk ss-part ss-h-to">と</span>
            <span class="ss-blk ss-noun">アニメ</span>
            <span class="ss-blk ss-part ss-h-o">を</span>
            <span class="ss-blk ss-verb">見る</span>
            <span class="ss-blk ss-stop">。</span>
          </div>
          <div class="ss-breakdown">
            <div class="ss-bd ss-w-noun"><span class="ss-jp">私 の 可愛い 猫</span><span class="ss-role">"my cute cat" — one big noun phrase</span></div>
            <div class="ss-bd ss-w-part"><span class="ss-jp">と (to)</span><span class="ss-role">co-participant — "with"</span></div>
            <div class="ss-bd ss-w-noun"><span class="ss-jp">アニメ</span><span class="ss-role">the object</span></div>
            <div class="ss-bd ss-w-part"><span class="ss-jp">を (wo)</span><span class="ss-role">object marker</span></div>
            <div class="ss-bd ss-w-verb"><span class="ss-jp">見る</span><span class="ss-role">the verb, anchoring it all</span></div>
          </div>
        </div>
      </section>

      <!-- 6. Word order is flexible -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="v" style="--rot: -3deg;"><span class="ss-kanji-num">六</span></span>
          <h2 class="ss-section-title">Word order changes the spotlight<em>same sentence, different emphasis</em></h2>
          <p class="ss-section-lede">Because particles do the labelling, you can shuffle the satellites around the verb. <b>The verb stays at the end</b> — but whatever sits closest to it gets the most weight.</p>
        </div>

        <div class="ss-reorder-list">
          <div class="ss-reorder-row">
            <div class="ss-nuance"><b>Neutral</b>Standard order — no special emphasis.</div>
            <div class="ss-jp-line">
              太郎<span class="ss-pc ss-wa">は</span> 日曜日<span class="ss-pc ss-ni">に</span> 公園<span class="ss-pc ss-de">で</span> 野球<span class="ss-pc ss-o">を</span> <span class="ss-verb-u">しました</span>。
              <div class="ss-trans">Taro played baseball at the park on Sunday.</div>
            </div>
          </div>

          <div class="ss-reorder-row">
            <div class="ss-nuance"><b>When-focused</b>Time slid toward the front, then verb.</div>
            <div class="ss-jp-line">
              日曜日<span class="ss-pc ss-ni">に</span> 太郎<span class="ss-pc ss-wa">は</span> 公園<span class="ss-pc ss-de">で</span> 野球<span class="ss-pc ss-o">を</span> <span class="ss-verb-u">しました</span>。
              <div class="ss-trans">On Sunday, Taro played baseball at the park.</div>
            </div>
          </div>

          <div class="ss-reorder-row">
            <div class="ss-nuance"><b>What-focused</b>Object hugged up next to the verb.</div>
            <div class="ss-jp-line">
              太郎<span class="ss-pc ss-wa">は</span> 公園<span class="ss-pc ss-de">で</span> 日曜日<span class="ss-pc ss-ni">に</span> 野球<span class="ss-pc ss-o">を</span> <span class="ss-verb-u">しました</span>。
              <div class="ss-trans">It was <i>baseball</i> Taro played at the park on Sunday.</div>
            </div>
          </div>
        </div>

        <p class="ss-footnote">
          Try saying each line out loud — the meaning stays put, but the <i>colour</i> of the sentence shifts.
        </p>
      </section>

      <!-- 7. The two rules -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="v" style="--rot: 4deg;"><span class="ss-kanji-num">七</span></span>
          <h2 class="ss-section-title">Only two rules are non-negotiable<em>everything else can move</em></h2>
        </div>

        <div class="ss-rules-two">
          <div class="ss-rule-pill">
            <span class="ss-num">壱</span>
            <h4>The verb goes at the end</h4>
            <p>Whatever the sentence is doing — saying, asking, describing — the <b>verb (or です)</b> is the last thing before the full stop. If your sentence is ending in a noun, you're missing your anchor.</p>
          </div>
          <div class="ss-rule-pill">
            <span class="ss-num">弐</span>
            <h4>Particles follow their noun</h4>
            <p>The diamond always sits <b>immediately after</b> the noun it's tagging. You can move a noun-and-its-particle as a single unit — but you can never separate them.</p>
          </div>
        </div>
      </section>

      <!-- 8. Confusing pairs -->
      <section class="ss-section">
        <div class="ss-section-head">
          <span class="ss-section-num" data-axis="v" style="--rot: -2deg;"><span class="ss-kanji-num">八</span></span>
          <h2 class="ss-section-title">Two pairs that trip everyone up<em>は vs が, に vs で</em></h2>
          <p class="ss-section-lede">These are the famous confusions. They feel like the same thing at first — but they tell different stories.</p>
        </div>

        <div class="ss-pairs">
          <div class="ss-pair">
            <div class="ss-pair-head">
              <span class="ss-pair-chip ss-wa">は</span>
              <span class="ss-pair-vs">vs.</span>
              <span class="ss-pair-chip ss-ga">が</span>
            </div>
            <div class="ss-pair-row">
              <div class="ss-pair-col">
                <h5>は · topic</h5>
                <p>Sets up what the sentence is <b>about</b>. Old information — already on the table.</p>
                <div class="ss-pair-ex">私<span class="ss-pc ss-wa">は</span>学生です。<span class="ss-en">As for me — student.</span></div>
              </div>
              <div class="ss-pair-col">
                <h5>が · subject</h5>
                <p>Identifies <b>who</b> or <b>what</b>. New information, often emphatic.</p>
                <div class="ss-pair-ex">私<span class="ss-pc ss-ga">が</span>学生です。<span class="ss-en"><i>I</i> am the student (not them).</span></div>
              </div>
            </div>
          </div>

          <div class="ss-pair">
            <div class="ss-pair-head">
              <span class="ss-pair-chip ss-ni">に</span>
              <span class="ss-pair-vs">vs.</span>
              <span class="ss-pair-chip ss-de">で</span>
            </div>
            <div class="ss-pair-row">
              <div class="ss-pair-col">
                <h5>に · existence / destination</h5>
                <p>Where someone <b>is</b>, or where they're <b>going to</b>.</p>
                <div class="ss-pair-ex">図書館<span class="ss-pc ss-ni">に</span>います。<span class="ss-en">I am at the library.</span></div>
              </div>
              <div class="ss-pair-col">
                <h5>で · place of action</h5>
                <p>Where something <b>happens</b>. The action's stage.</p>
                <div class="ss-pair-ex">図書館<span class="ss-pc ss-de">で</span>勉強します。<span class="ss-en">I study at the library.</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 9. End CTA -->
      <section class="ss-section">
        <div class="ss-end-cta">
          <h3>You've got the skeleton.</h3>
          <p>Next: walk through each particle individually, and start writing your own sentences from scratch.</p>
          <div class="ss-btn-row">
            <button class="ss-btn" data-ss-goto="particles">Study the particles →</button>
          </div>
        </div>
      </section>

    </div>`;

  // Wire the "Study the particles" CTA — switches to the particles
  // writing subpage using the same path used by the writing sidebar
  // (keep state in localStorage so a refresh lands the user back).
  const goPart = container.querySelector('[data-ss-goto="particles"]');
  if (goPart) {
    goPart.addEventListener('click', () => {
      APP.writingPage = 'particles';
      lsSet('jp:writingPage', 'particles');
      APP.particleMode = 'lessons';
      lsSet('jp:particleMode', 'lessons');
      APP.lessonId = null;
      lsSet('jp:lessonId', null);
      document.querySelector('.app').classList
        .toggle('show-particles-sidebar', shouldShowParticlesSidebar());
      if (typeof applyContextBg === 'function') applyContextBg();
      renderWriting(document.getElementById('main-inner'));
      renderWritingSidebar();
      renderParticlesSidebar();
    });
  }

  // Reveal each section-num kanji as the user scrolls. Same animation
  // pattern as the standalone page — IntersectionObserver where
  // available, plus a 4-second safety net so all glyphs are drawn even
  // if the observer never fires (e.g. when the entire page fits in the
  // viewport on a large monitor and nothing scrolls into view).
  const nums = Array.from(container.querySelectorAll('.ss-section-num'));
  const reveal = (el) => el.classList.add('ss-drawn');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { setTimeout(() => reveal(e.target), 320); io.unobserve(e.target); }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -8% 0px' });
    nums.forEach(n => io.observe(n));
  }
  // Safety net: draw all kanji within 4s no matter what.
  setTimeout(() => nums.forEach(reveal), 4000);
}

// ── Particle lessons ───────────────────────────────────────────────────
// Two screens, one mode:
//   1. CATALOG — grouped grid of lesson cards (ready + coming-soon). The
//      coming-soon cards aren't dead UI; they're the visible roadmap so
//      the learner can see where the path leads.
//   2. DETAIL  — a single lesson rendered as a vertical reading
//      experience: header, intro, numbered step cards, takeaways, then
//      prev/next nav between ready lessons.
//
// Inline checks store their picked answer on APP._lessonChecks (transient,
// resets on navigation away). Lesson id persists.
function renderParticleLessons(container) {
  if (!APP.lessonId) return renderLessonCatalog(container);
  return renderLessonDetail(container);
}

// Lookup table: particle char → its assigned color.
function particleColorMap() {
  const m = {};
  (window.PARTICLES || []).forEach(p => { m[p.char] = p.color; });
  return m;
}

// Particle chip — small colored pill with the kana character. Used in
// both catalog cards and lesson detail headers.
function particleChipHTML(ch, colors) {
  const c = colors[ch] || 'var(--ink-3)';
  return `<span class="lp-chip" style="--pc:${escAttr(c)}">${escHTML(ch)}</span>`;
}

// Big-particle title row. Renders each main particle in its assigned color
// at large size, separated by a small neutral middle-dot. The dot is the
// connector — never a particle character — so there\'s no visual confusion
// between "main" and "connector" particles.
//
// Special case: synthesis lesson lists all 12 particles. Showing them all
// would overflow; we collapse to a single "助" glyph in gold instead.
function bigParticleRowHTML(particles, colors, size /* 'sm' | 'md' | 'lg' */) {
  const cls = `lp-bigparticles lp-bigparticles-${size || 'md'}`;
  if (!particles || !particles.length) return '';
  if (particles.length > 4) {
    return `<div class="${cls}"><span class="lp-bigp lp-bigp-all">助</span></div>`;
  }
  const inner = particles.map(ch => {
    const c = colors[ch] || 'var(--ink-3)';
    return `<span class="lp-bigp" style="color:${escAttr(c)}">${escHTML(ch)}</span>`;
  }).join('<span class="lp-bigp-dot">·</span>');
  return `<div class="${cls}">${inner}</div>`;
}

// ── Catalog screen ─────────────────────────────────────────────────────
function renderLessonCatalog(container) {
  const blocks  = (window.PARTICLE_LESSON_BLOCKS || []);
  const lessons = (window.PARTICLE_LESSONS || []);
  const colors  = particleColorMap();

  const readyCount = lessons.filter(l => l.status === 'ready').length;
  const totalCount = lessons.length;

  const groupHTML = blocks.map(b => {
    const items = lessons.filter(l => l.block === b.id);
    if (!items.length) return '';
    return `
      <div class="lp-group">
        <div class="lp-group-hd">
          <h3>${escHTML(b.title)}</h3>
          <p>${escHTML(b.sub)}</p>
        </div>
        <div class="lp-grid">
          ${items.map(l => {
            const ready = l.status === 'ready';
            return `
              <button class="lp-card ${ready ? 'is-ready' : 'is-soon'}"
                      ${ready ? `data-lesson-id="${escAttr(l.id)}"` : 'disabled'}>
                <div class="lp-card-num">${String(l.num).padStart(2,'0')}</div>
                <div class="lp-card-body">
                  ${bigParticleRowHTML(l.particles, colors, 'md')}
                  <div class="lp-card-ja">${escHTML(l.titleJa)}</div>
                  <div class="lp-card-en">${escHTML(l.titleEn)}</div>
                </div>
                <div class="lp-card-time">${escHTML(l.time)}</div>
                ${ready ? '' : '<div class="lp-card-soon">coming soon</div>'}
              </button>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · particles</div>
      <div class="page-title-jp">レッスン</div>
      <div class="page-title-en">Step-by-step walk-throughs of each particle system.</div>
    </div>
    <div class="rule"></div>
    <div class="lp-summary">
      <b>${readyCount}</b> of <b>${totalCount}</b> lessons ready. The rest are mapped out — pick a card below to begin.
    </div>
    ${groupHTML}`;

  container.querySelectorAll('[data-lesson-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.lessonId = btn.dataset.lessonId;
      lsSet('jp:lessonId', APP.lessonId);
      APP._lessonChecks = {};  // reset per-lesson check state
      renderLessonDetail(container);
      window.scrollTo({ top: 0, behavior:'instant' });
    });
  });
}

// ── Detail screen ──────────────────────────────────────────────────────
function renderLessonDetail(container) {
  const lessons = (window.PARTICLE_LESSONS || []);
  const lesson  = lessons.find(l => l.id === APP.lessonId);
  if (!lesson || lesson.status !== 'ready') {
    APP.lessonId = null; lsSet('jp:lessonId', null);
    return renderLessonCatalog(container);
  }
  if (!APP._lessonChecks) APP._lessonChecks = {};

  const colors = particleColorMap();
  const bigParticles = bigParticleRowHTML(lesson.particles, colors, 'lg');

  // Prev / next among READY lessons only — coming-soon ones aren't
  // reachable from inside detail (they're catalog-only).
  const readyLessons = lessons.filter(l => l.status === 'ready');
  const ri = readyLessons.findIndex(l => l.id === lesson.id);
  const prev = ri > 0 ? readyLessons[ri - 1] : null;
  const next = ri < readyLessons.length - 1 ? readyLessons[ri + 1] : null;

  // ── Step renderers ───────────────────────────────────────────────────
  // Pattern row — particle cells in the assigned particle color; everything
  // else as italic placeholder slot.
  const renderPattern = (cells) => `
    <div class="lp-pattern">
      ${cells.map(c => {
        const col = colors[c];
        if (col) return `<span class="lp-pat-particle" style="color:${escAttr(col)}">${escHTML(c)}</span>`;
        return `<span class="lp-pat-slot">${escHTML(c)}</span>`;
      }).join('')}
    </div>`;

  // Re-use the parts-array machinery from the particle lesson page:
  // each segment that matches a particle char gets a colored span.
  const renderExampleJa = (parts) => {
    if (!Array.isArray(parts)) return '';
    return parts.map(seg => {
      const col = colors[seg];
      return col
        ? `<span class="pc" style="color:${escAttr(col)}">${escHTML(seg)}</span>`
        : escHTML(seg);
    }).join('');
  };

  const renderCheckStep = (step, stepIdx) => {
    const checkKey = `${lesson.id}::${stepIdx}`;
    const picked = APP._lessonChecks[checkKey];
    const correct = picked === step.answer;
    return `
      <div class="lp-check ${picked != null ? (correct ? 'is-correct' : 'is-wrong') : ''}">
        <div class="lp-check-hd">check</div>
        <div class="lp-check-q-ja">${escHTML(step.qJa)}</div>
        <div class="lp-check-q-en">${escHTML(step.qEn)}</div>
        <div class="lp-check-options">
          ${step.options.map((opt, i) => {
            let cls = 'lp-check-opt';
            if (picked != null) {
              if (i === step.answer) cls += ' correct';
              else if (i === picked) cls += ' wrong';
              else cls += ' dim';
            }
            return `<button class="${cls}" ${picked != null ? 'disabled' : ''}
                            data-check-pick="${stepIdx}" data-check-i="${i}">${escHTML(opt)}</button>`;
          }).join('')}
        </div>
        ${picked != null ? `
          <div class="lp-check-feedback">
            <div class="lp-check-verdict">${correct ? '✓ correct' : '✗ not quite'}</div>
            <div class="lp-check-explain">${step.explain}</div>
          </div>
        ` : ''}
      </div>`;
  };

  const renderStep = (step, i) => {
    if (step.type === 'concept') {
      return `
        <div class="lp-step lp-step-concept">
          <div class="lp-step-num">${i + 1}</div>
          <div class="lp-step-body">
            ${step.title ? `<div class="lp-step-title">${escHTML(step.title)}</div>` : ''}
            <div class="lp-step-prose">${step.body}</div>
          </div>
        </div>`;
    }
    if (step.type === 'pattern') {
      return `
        <div class="lp-step lp-step-pattern">
          <div class="lp-step-num">${i + 1}</div>
          <div class="lp-step-body">
            <div class="lp-step-title">Pattern</div>
            ${renderPattern(step.cells)}
            ${step.body ? `<div class="lp-step-prose">${step.body}</div>` : ''}
          </div>
        </div>`;
    }
    if (step.type === 'examples') {
      return `
        <div class="lp-step lp-step-examples">
          <div class="lp-step-num">${i + 1}</div>
          <div class="lp-step-body">
            <div class="lp-step-title">Examples</div>
            <div class="lp-examples">
              ${step.items.map(ex => `
                <div class="lp-example">
                  <div class="lp-ex-ja">${renderExampleJa(ex.parts)}</div>
                  ${ex.kana ? `<div class="lp-ex-kana">${escHTML(ex.kana)}</div>` : ''}
                  <div class="lp-ex-en">${escHTML(ex.en)}</div>
                  ${ex.note ? `<div class="lp-ex-note">${ex.note}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>`;
    }
    if (step.type === 'contrast') {
      return `
        <div class="lp-step lp-step-contrast">
          <div class="lp-step-num">${i + 1}</div>
          <div class="lp-step-body">
            <div class="lp-step-title">Contrast</div>
            ${step.body ? `<div class="lp-step-prose">${step.body}</div>` : ''}
            <div class="lp-contrast">
              <div class="lp-contrast-row">
                <div class="lp-contrast-ja">${renderExampleJa(step.a.parts)}</div>
                <div class="lp-contrast-en">${escHTML(step.a.en)}</div>
              </div>
              <div class="lp-contrast-vs">↕</div>
              <div class="lp-contrast-row">
                <div class="lp-contrast-ja">${renderExampleJa(step.b.parts)}</div>
                <div class="lp-contrast-en">${escHTML(step.b.en)}</div>
              </div>
            </div>
          </div>
        </div>`;
    }
    if (step.type === 'mistake') {
      return `
        <div class="lp-step lp-step-mistake">
          <div class="lp-step-num">${i + 1}</div>
          <div class="lp-step-body">
            <div class="lp-step-title lp-mistake-title">${escHTML(step.title)}</div>
            <div class="lp-step-prose">${step.body}</div>
          </div>
        </div>`;
    }
    if (step.type === 'check') {
      return `
        <div class="lp-step lp-step-check">
          <div class="lp-step-num">${i + 1}</div>
          <div class="lp-step-body">
            ${renderCheckStep(step, i)}
          </div>
        </div>`;
    }
    return '';
  };

  container.innerHTML = `
    <div class="lp-back-row">
      <button class="lp-back" data-back-to-catalog>← all lessons</button>
      <span class="lp-progress">lesson ${ri + 1} of ${readyLessons.length} <span class="lp-progress-sub">(ready)</span></span>
    </div>
    <div class="page-head lp-head">
      <div class="page-eyebrow">writing · lesson ${String(lesson.num).padStart(2,'0')}</div>
      ${bigParticles}
      <div class="lp-detail-ja">${escHTML(lesson.titleJa)}</div>
      <div class="lp-detail-en">${escHTML(lesson.titleEn)} <span class="lp-head-meta">· ${escHTML(lesson.time)}</span></div>
    </div>
    <div class="rule"></div>

    <div class="lp-intro">${lesson.intro}</div>

    <div class="lp-steps">
      ${lesson.steps.map((s, i) => renderStep(s, i)).join('')}
    </div>

    <div class="lp-takeaways">
      <div class="lp-takeaways-hd">Takeaways</div>
      <ul>
        ${lesson.takeaways.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>

    <div class="lp-foot-nav">
      ${prev ? `<button class="btn lp-foot-prev" data-go-lesson="${escAttr(prev.id)}">
                  <span class="lp-foot-dir">← previous</span>
                  <span class="lp-foot-title">${escHTML(prev.titleEn)}</span>
                </button>` : '<span></span>'}
      ${next ? `<button class="btn primary lp-foot-next" data-go-lesson="${escAttr(next.id)}">
                  <span class="lp-foot-dir">next →</span>
                  <span class="lp-foot-title">${escHTML(next.titleEn)}</span>
                </button>` : `<button class="btn primary" data-back-to-catalog>finish · back to all lessons</button>`}
    </div>`;

  // Event wiring.
  container.querySelectorAll('[data-back-to-catalog]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.lessonId = null; lsSet('jp:lessonId', null);
      APP._lessonChecks = {};
      renderLessonCatalog(container);
      window.scrollTo({ top: 0, behavior:'instant' });
    });
  });
  container.querySelectorAll('[data-go-lesson]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.lessonId = btn.dataset.goLesson;
      lsSet('jp:lessonId', APP.lessonId);
      APP._lessonChecks = {};
      renderLessonDetail(container);
      window.scrollTo({ top: 0, behavior:'instant' });
    });
  });
  container.querySelectorAll('[data-check-pick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const stepIdx = +btn.dataset.checkPick;
      const i = +btn.dataset.checkI;
      const key = `${lesson.id}::${stepIdx}`;
      if (APP._lessonChecks[key] != null) return;
      APP._lessonChecks[key] = i;
      renderLessonDetail(container);
    });
  });
}

// ── Particle articles ──────────────────────────────────────────────────
// Curiosity reads — short HTML articles about particle quirks. Two
// screens: catalog (cards with summaries) and detail (single article in
// editorial layout). State held on APP.articleId.
function renderParticleArticles(container) {
  if (!APP.articleId) return renderArticleCatalog(container);
  return renderArticleDetail(container);
}

function renderArticleCatalog(container) {
  const articles = (window.PARTICLE_ARTICLES || []);
  const colors   = particleColorMap();
  if (!articles.length) {
    container.innerHTML = `<div class="page-head"><div class="page-title-jp">記事</div><div class="page-title-en">Articles — none loaded</div></div>`;
    return;
  }

  const cardsHTML = articles.map(a => `
    <button class="lp-card lp-card-article is-ready" data-article-id="${escAttr(a.id)}">
      <div class="lp-card-num">${String(a.num).padStart(2,'0')}</div>
      <div class="lp-card-body">
        ${bigParticleRowHTML(a.particles, colors, 'md')}
        <div class="lp-card-ja">${escHTML(a.titleJa)}</div>
        <div class="lp-card-en">${escHTML(a.titleEn)}</div>
        <div class="lp-card-summary">${escHTML(a.summary)}</div>
      </div>
      <div class="lp-card-time">${escHTML(a.time)}</div>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · particles</div>
      <div class="page-title-jp">記事</div>
      <div class="page-title-en">Short reads that explain the <i>why</i> behind specific particle quirks.</div>
    </div>
    <div class="rule"></div>
    <div class="lp-summary">
      <b>${articles.length}</b> articles. Read in any order — pick whichever scratches an itch.
    </div>
    <div class="lp-grid">${cardsHTML}</div>`;

  container.querySelectorAll('[data-article-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.articleId = btn.dataset.articleId;
      lsSet('jp:articleId', APP.articleId);
      renderArticleDetail(container);
      window.scrollTo({ top: 0, behavior:'instant' });
    });
  });
}

function renderArticleDetail(container) {
  const articles = (window.PARTICLE_ARTICLES || []);
  const article = articles.find(a => a.id === APP.articleId);
  if (!article) {
    APP.articleId = null; lsSet('jp:articleId', null);
    return renderArticleCatalog(container);
  }
  const colors = particleColorMap();
  const bigParticles = bigParticleRowHTML(article.particles, colors, 'lg');

  // Prev / next among articles.
  const ai = articles.findIndex(a => a.id === article.id);
  const prev = ai > 0 ? articles[ai - 1] : null;
  const next = ai < articles.length - 1 ? articles[ai + 1] : null;

  container.innerHTML = `
    <div class="lp-back-row">
      <button class="lp-back" data-back-to-articles>← all articles</button>
      <span class="lp-progress">article ${ai + 1} of ${articles.length}</span>
    </div>
    <div class="page-head lp-head">
      <div class="page-eyebrow">writing · article ${String(article.num).padStart(2,'0')}</div>
      ${bigParticles}
      <div class="lp-detail-ja">${escHTML(article.titleJa)}</div>
      <div class="lp-detail-en">${escHTML(article.titleEn)} <span class="lp-head-meta">· ${escHTML(article.time)}</span></div>
    </div>
    <div class="rule"></div>
    <div class="lp-article-body">${article.body}</div>
    <div class="lp-foot-nav">
      ${prev ? `<button class="btn lp-foot-prev" data-go-article="${escAttr(prev.id)}">
                  <span class="lp-foot-dir">← previous</span>
                  <span class="lp-foot-title">${escHTML(prev.titleEn)}</span>
                </button>` : '<span></span>'}
      ${next ? `<button class="btn primary lp-foot-next" data-go-article="${escAttr(next.id)}">
                  <span class="lp-foot-dir">next →</span>
                  <span class="lp-foot-title">${escHTML(next.titleEn)}</span>
                </button>` : `<button class="btn primary" data-back-to-articles>back to all articles</button>`}
    </div>`;

  container.querySelectorAll('[data-back-to-articles]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.articleId = null; lsSet('jp:articleId', null);
      renderArticleCatalog(container);
      window.scrollTo({ top: 0, behavior:'instant' });
    });
  });
  container.querySelectorAll('[data-go-article]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.articleId = btn.dataset.goArticle;
      lsSet('jp:articleId', APP.articleId);
      renderArticleDetail(container);
      window.scrollTo({ top: 0, behavior:'instant' });
    });
  });
}

// ── Particle quiz: config screen ───────────────────────────────────────
// Shown before each test. User selects which particles + JLPT levels to
// test, plus how many questions. Choices persist; "Start test" filters
// the bank and seeds APP._quiz, then drops to the running quiz screen.
const JLPT_LEVELS = ['N5','N4','N3','N2','N1'];

function renderQuizConfig(container) {
  const bank = (window.PARTICLE_QUIZ_BANK || []);
  const all = (window.PARTICLES || []);
  if (!bank.length || !all.length) {
    container.innerHTML = `<div class="page-head"><div class="page-title-jp">クイズ</div><div class="page-title-en">Particle test — data not loaded</div></div>`;
    return;
  }

  // Per-particle question counts in the chosen levels, so the user can
  // see how big the candidate pool is for each option in real time.
  const levels = new Set(APP.quizLevels);
  const countByParticle = {};
  bank.forEach(q => { if (levels.has(q.level)) countByParticle[q.particle] = (countByParticle[q.particle]||0) + 1; });
  const pool = bank.filter(q =>
    APP.quizParticles.includes(q.particle) && levels.has(q.level)
  ).length;

  const particleChips = all.map(p => {
    const on = APP.quizParticles.includes(p.char);
    const n = countByParticle[p.char] || 0;
    return `
      <button class="qcfg-chip ${on ? 'on' : ''} ${n === 0 ? 'empty' : ''}"
              data-cfg-particle="${escAttr(p.char)}"
              style="--pc:${escAttr(p.color)}"
              ${n === 0 ? 'disabled title="no questions at the selected levels"' : ''}>
        <span class="qcfg-ja">${escHTML(p.char)}</span>
        <span class="qcfg-romaji">${escHTML(p.romaji)}</span>
        <span class="qcfg-count">${n}</span>
      </button>`;
  }).join('');

  const levelChips = JLPT_LEVELS.map(L => {
    const on = APP.quizLevels.includes(L);
    const n = bank.filter(q => q.level === L).length;
    return `
      <button class="qcfg-chip qcfg-level ${on ? 'on' : ''}"
              data-cfg-level="${L}">
        <span class="qcfg-ja">${L}</span>
        <span class="qcfg-count">${n}</span>
      </button>`;
  }).join('');

  const sizeOptions = [10, 20, 30, 50].map(n => `
    <button class="qcfg-chip qcfg-size ${APP.quizSize === n ? 'on' : ''}"
            data-cfg-size="${n}">${n}</button>
  `).join('');

  const canStart = pool > 0 && APP.quizParticles.length > 0 && APP.quizLevels.length > 0;
  const startCount = Math.min(APP.quizSize, pool);

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · test</div>
      <div class="page-title-jp">クイズ</div>
      <div class="page-title-en">Configure your particle test.</div>
    </div>
    <div class="rule"></div>

    <div class="qcfg-section">
      <div class="qcfg-hd">
        <h3>JLPT level</h3>
        <p>Pick one or more levels. N5 is most common; N1 is most subtle.</p>
      </div>
      <div class="qcfg-chips">${levelChips}</div>
    </div>

    <div class="qcfg-section">
      <div class="qcfg-hd">
        <h3>Particles</h3>
        <p>Pick which particles to test. The count shows how many questions exist at the chosen levels.</p>
        <div class="qcfg-bulk">
          <button class="qcfg-bulk-btn" data-cfg-bulk="all">all</button>
          <button class="qcfg-bulk-btn" data-cfg-bulk="none">none</button>
        </div>
      </div>
      <div class="qcfg-chips qcfg-chips-particle">${particleChips}</div>
    </div>

    <div class="qcfg-section">
      <div class="qcfg-hd">
        <h3>Question count</h3>
        <p>How many questions in this round. Repeats are rare given the bank size.</p>
      </div>
      <div class="qcfg-chips">${sizeOptions}</div>
    </div>

    <div class="qcfg-start-row">
      <div class="qcfg-summary">
        ${canStart
          ? `Pool: <b>${pool}</b> questions · this round: <b>${startCount}</b>`
          : `<span style="color:var(--rose)">No questions match — select at least one particle and one level.</span>`}
      </div>
      <button class="btn primary qcfg-start" ${canStart ? '' : 'disabled'} data-cfg-start>
        始める · start test →
      </button>
    </div>`;

  // Persist + re-render helper.
  const save = () => {
    lsSet('jp:quizParticles', APP.quizParticles);
    lsSet('jp:quizLevels',    APP.quizLevels);
    lsSet('jp:quizSize',      APP.quizSize);
  };

  container.querySelectorAll('[data-cfg-particle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ch = btn.dataset.cfgParticle;
      const i = APP.quizParticles.indexOf(ch);
      if (i >= 0) APP.quizParticles.splice(i, 1);
      else        APP.quizParticles.push(ch);
      save(); renderQuizConfig(container);
    });
  });
  container.querySelectorAll('[data-cfg-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      const L = btn.dataset.cfgLevel;
      const i = APP.quizLevels.indexOf(L);
      if (i >= 0) APP.quizLevels.splice(i, 1);
      else        APP.quizLevels.push(L);
      save(); renderQuizConfig(container);
    });
  });
  container.querySelectorAll('[data-cfg-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.quizSize = +btn.dataset.cfgSize || 20;
      save(); renderQuizConfig(container);
    });
  });
  container.querySelectorAll('[data-cfg-bulk]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.cfgBulk === 'all') APP.quizParticles = all.map(p => p.char);
      else                                APP.quizParticles = [];
      save(); renderQuizConfig(container);
    });
  });
  const startBtn = container.querySelector('[data-cfg-start]');
  if (startBtn) startBtn.addEventListener('click', () => {
    // Filter + shuffle + slice. Sampling is done once on session start
    // so the same item never appears twice within a single test.
    const filtered = bank.filter(q =>
      APP.quizParticles.includes(q.particle) && APP.quizLevels.includes(q.level)
    );
    if (!filtered.length) return;
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    // The source bank stores each question's correct answer as the FIRST
    // entry of `options` (data convention). If we use those arrays
    // verbatim, every quiz question shows the correct particle in the
    // first slot — a fatal pattern that lets users guess without
    // reading. Clone each item and shuffle its options so the answer
    // lands at a random index per question. Shuffling is done once at
    // session start (not per render) so re-renders during a single
    // question keep the same option order.
    const sampled = shuffled.slice(0, Math.min(APP.quizSize, shuffled.length))
      .map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    APP._quiz = {
      items: sampled,
      i: 0, picked: null, score: 0, done: false,
    };
    renderParticleQuiz(container);
  });
}

// ── Particle quiz: running screen ──────────────────────────────────────
// Three phases:
//   1. CONFIG  — user picks particles + JLPT levels + size, then starts
//   2. RUNNING — sampled questions, multiple-choice, feedback
//   3. DONE    — score + try-again
// State is kept on APP._quiz (transient). Config preferences persist via
// APP.quizParticles / quizLevels / quizSize → localStorage.
function renderParticleQuiz(container) {
  // Phase 1 — config screen. Always shown when there's no active session.
  if (!APP._quiz) return renderQuizConfig(container);

  const state = APP._quiz;
  const total = state.items.length;
  const q = state.items[state.i];

  const colorOf = (ch) => {
    const p = (window.PARTICLES || []).find(p => p.char === ch);
    return p ? p.color : 'var(--ink)';
  };

  if (state.done) {
    const verdict =
      state.score === total ? 'Perfect — you have these particles cold.' :
      state.score >= total * 0.75 ? 'Strong. A few more reps and you\'re there.' :
      state.score >= total * 0.5 ? 'Solid start — revisit the ones that tripped you up.' :
      'Take another look at the lessons and try again — these will stick.';
    container.innerHTML = `
      <div class="page-head">
        <div class="page-eyebrow">writing · test</div>
        <div class="page-title-jp">クイズ</div>
        <div class="page-title-en">Particle test — results</div>
      </div>
      <div class="rule"></div>
      <div class="quiz-card qz-done">
        <div class="num">${state.score}<small> / ${total}</small></div>
        <div class="msg">${escHTML(verdict)}</div>
        <button class="btn primary" data-quiz-action="restart">new test →</button>
      </div>`;
    container.querySelector('[data-quiz-action="restart"]').addEventListener('click', () => {
      APP._quiz = null;
      renderParticleQuiz(container);
    });
    return;
  }

  const pc = colorOf(q.answer);
  const sentenceHTML = q.sentence.map(s =>
    s === '_'
      ? `<span class="qz-blank ${state.picked ? 'filled' : ''}"
              style="${state.picked ? `--pc:${escAttr(pc)};` : ''}">${escHTML(state.picked || '')}</span>`
      : `<span>${escHTML(s)}</span>`
  ).join('');

  const choicesHTML = q.options.map(opt => {
    const color = colorOf(opt);
    let cls = 'qz-choice';
    if (state.picked) {
      if (opt === q.answer) cls += ' correct';
      else if (opt === state.picked) cls += ' wrong';
      else cls += ' dim';
    }
    return `<button class="${cls}" style="--pc:${escAttr(color)}"
                    data-quiz-pick="${escAttr(opt)}"
                    ${state.picked ? 'disabled' : ''}>
              <span>${escHTML(opt)}</span>
            </button>`;
  }).join('');

  const feedbackHTML = state.picked ? `
    <div class="qz-feedback ${state.picked === q.answer ? 'ok' : 'no'}">
      <div class="verdict">${state.picked === q.answer ? '✓ correct' : '✗ not quite'}</div>
      <div class="explain">${q.explain}</div>
      <div class="en-line">${escHTML(q.en)}</div>
    </div>
    <div class="qz-actions">
      <button class="btn primary" data-quiz-action="next">${state.i + 1 >= total ? 'see results' : 'next →'}</button>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">writing · test</div>
      <div class="page-title-jp">クイズ</div>
      <div class="page-title-en">Particle test — fill the blank.</div>
    </div>
    <div class="rule"></div>

    <div class="quiz-progress">
      <div style="width:${(state.i / total) * 100}%"></div>
    </div>
    <div class="quiz-card" style="--pc:${escAttr(pc)}">
      <div class="qz-prompt-eyebrow">question ${state.i + 1} of ${total} · fill the blank</div>
      <div class="qz-sentence">${sentenceHTML}</div>
      <div class="qz-en">${escHTML(q.en)}</div>
      <div class="qz-choices">${choicesHTML}</div>
      ${feedbackHTML}
    </div>`;

  container.querySelectorAll('[data-quiz-pick]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.picked) return;
      state.picked = btn.dataset.quizPick;
      if (state.picked === q.answer) state.score++;
      renderParticleQuiz(container);
    });
  });
  const nextBtn = container.querySelector('[data-quiz-action="next"]');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (state.i + 1 >= total) state.done = true;
    else { state.i++; state.picked = null; }
    renderParticleQuiz(container);
  });
}

// ── Card modal (writing/colors → deck flashcard preview) ───────────────
// Render a single color's deck flashcard into the modal body. Mirrors the
// flash-card markup used in renderFlashcards so the visual matches without
// the deck chrome (nav arrows, rails). The swatch SVG sits to the left of
// the kanji exactly like the deck card.
function colorCardModalHTML(card) {
  const swatch = card.swatch || '';
  const isLight = swatch.toLowerCase() === '#ffffff';
  const colorizeOn = APP.flashColorize && swatch && card.kanji;
  const colorSuffix = (colorizeOn && card.kanji.endsWith('色')) ? '色' : '';
  const colorMain = colorizeOn ? (colorSuffix ? card.kanji.slice(0, -1) : card.kanji) : '';
  const colorKanjiHTML = colorizeOn
    ? `<span class="color-glyph${isLight ? ' color-glyph-light' : ''}"${isLight ? '' : ` style="color:${escAttr(swatch)}"`}>${escHTML(colorMain)}</span>${colorSuffix ? `<span>${escHTML(colorSuffix)}</span>` : ''}`
    : escHTML(card.kanji);

  const swatchSVG = swatch
    ? `<svg class="flash-swatch"${isLight ? ' data-light' : ''} viewBox="0 0 60 80" fill="${escAttr(swatch)}"${isLight ? ' stroke="#c2b294" stroke-width="2.5"' : ''} xmlns="http://www.w3.org/2000/svg"><path d="M18 5C28 2 45 6 52 16C58 26 56 40 50 52C44 62 34 72 22 76C12 79 4 74 2 64C0 54 4 40 12 28C18 18 28 10 18 5Z"/>${!isLight ? '<path d="M38 12C44 18 48 30 46 42C44 54 36 64 26 70C20 73 14 72 12 66C10 58 14 46 22 36C28 28 36 20 38 12Z" opacity=".6"/>' : ''}</svg>`
    : '';

  return `
    <div class="flash-card">
      <div class="flash-kanji"><span class="flash-kanji-inner">${swatchSVG}${colorKanjiHTML}</span></div>
      <div class="flash-reading">
        ${card.kun ? `<span class="kun"><span class="label">kun</span>${escHTML(card.kun)}</span>` : ''}
        ${card.kun && card.on ? `<span style="color:var(--ink-4)">·</span>` : ''}
        ${card.on ? `<span class="on"><span class="label">on</span>${escHTML(card.on)}</span>` : ''}
        <button class="tts-btn" type="button" aria-label="読み上げ" title="読み上げ"
                data-speak="${escAttr(card.kun || card.on || card.kanji || '')}"
                style="margin-left:10px">${speakerIconSVG()}</button>
      </div>
      ${card.alt ? `<div style="text-align:center;font-family:var(--serif-jp);font-size:12px;color:var(--ink-4);margin-top:-2px">${escHTML(card.alt)}</div>` : ''}
      <div class="flash-bottom">
        <div class="flash-en" style="opacity:1;font-style:italic">
          <span class="eyebrow">meaning</span>
          ${escHTML(card.en)}
        </div>
      </div>
      ${card.notes ? `
        <div class="flash-notes">
          <span class="eyebrow">note</span>
          ${escHTML(card.notes)}
        </div>
      ` : ''}
      ${card.examples && card.examples.length ? `
        <div class="flash-examples">
          <span class="eyebrow">examples</span>
          ${card.examples.map(ex => `
            <div class="flash-ex-row">
              <span class="ex-word">${escHTML(ex.word)}</span>
              <span class="ex-reading">${escHTML(ex.reading)}</span>
              <span class="ex-meaning">${escHTML(ex.meaning)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${card.strokes ? `<div class="flash-foot"><span class="flash-strokes">${card.strokes}画</span></div>` : ''}
    </div>`;
}

function openColorFlashcard(kanji) {
  const colorCls = (window.FLASHCARD_CLASSES || []).find(c => c.id === 'colors');
  if (!colorCls) return;
  const card = colorCls.cards.find(c => c.kanji === kanji);
  if (!card) return;
  const body = document.getElementById('card-modal-body');
  const modal = document.getElementById('card-modal');
  const backdrop = document.getElementById('card-modal-backdrop');
  if (!body || !modal || !backdrop) return;
  body.innerHTML = colorCardModalHTML(card);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('is-open');
}

function closeCardModal() {
  const modal = document.getElementById('card-modal');
  const backdrop = document.getElementById('card-modal-backdrop');
  if (!modal || !backdrop) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('is-open');
}

function attachCardModalEvents() {
  const close = document.getElementById('card-modal-close');
  const backdrop = document.getElementById('card-modal-backdrop');
  if (close) close.addEventListener('click', closeCardModal);
  if (backdrop) backdrop.addEventListener('click', closeCardModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCardModal();
  });
}

// ── Radicals page ─────────────────────────────────────────────────────────
// A faceted-browse reference: the full Kangxi-style radical inventory
// grouped by stroke count, with selection state that intersects to surface
// which kanji in our flashcard deck contain those radicals. Click a result
// kanji → jump to its flashcard. Inspiration: jisho.org/#radical.

// Index: which radicals does a kanji contain? Falls back gracefully when a
// kanji isn't in KANJI_RADICALS (unmapped → empty list, never matches).
function radicalsForKanji(kanji) {
  return (window.KANJI_RADICALS && window.KANJI_RADICALS[kanji]) || [];
}

// Find every flashcard whose kanji matches the selection (intersection).
// Skips radical-type cards (they're meta-cards, not kanji to look up). An
// empty selection returns every kanji we have a decomposition for, so the
// page is browsable in both directions: pick a kanji you know → see which
// radicals build it (via the related-chips on the flashcard), OR pick
// radicals → see which kanji come back.
function kanjiMatchingRadicals(selected) {
  // Candidates (deduped non-radical cards that have a decomposition) are
  // precomputed once in Idx; only the per-selection intersection runs here.
  const out = [];
  for (const cand of Idx.radicalCandidates()) {
    // Intersection: every selected radical must be present.
    const hit = selected.length === 0 || selected.every(r => cand.radicals.includes(r));
    if (hit) out.push({ ...cand.card, classId: cand.classId });
  }
  return out;
}

// Jump to a kanji's flashcard. Switches section + class + index, persists,
// and updates the hash so back-button navigation behaves.
function jumpToKanjiFlashcard(kanji) {
  const e = Idx.cardEntry(kanji);
  if (!e) return;
  APP.flashClassId = e.classId;
  APP.flashIdx = e.idx;
  lsSet('jp:flashClass', e.classId);
  setSection('flashcards');
}

// ── Editorial flashcard layout (opt-in via cls.useEditorialLayout) ─────
// Two-column layout: square image + brush kanji on the left, info pane
// (meaning, examples, related cross-refs) on the right. Returns the
// inner card markup — the surrounding chrome (class strip, prev/next
// arrows, progress) comes from renderFlashcards.
// Compact lookup of common radical glosses — used on the back face of
// the editorial card to give a one-word hint next to each composition
// chip. Where the radical is also a kanji that lives as a flashcard in
// our deck, we prefer the card's `en` field (so 木 reads "tree" from
// the flashcard, not "tree" from this map — same answer, but kept in
// sync with the deck). This map covers the long tail of radicals that
// will never be standalone cards (⺉ ⺅ ⻌ etc).
const RADICAL_HINTS = {
  '一':'one','二':'two','三':'three','十':'ten','八':'eight','九':'nine',
  '亠':'lid','人':'person','⺅':'person','亻':'person','入':'enter','ハ':'eight',
  '冂':'box','冖':'cover','冫':'ice','刀':'sword','⺉':'sword','力':'power',
  '卜':'divination','厂':'cliff','厶':'private','又':'right hand',
  '口':'mouth','囗':'enclosure','土':'earth','士':'scholar','夂':'go slowly',
  '夕':'evening','大':'big','女':'woman','子':'child','宀':'roof','寸':'inch',
  '小':'small','山':'mountain','川':'river','工':'work','巾':'cloth','干':'dry',
  '弓':'bow','彳':'step','心':'heart','⺖':'heart','戸':'door','手':'hand',
  '⺘':'hand','支':'branch','文':'culture','斤':'axe','方':'direction','日':'sun',
  '月':'moon','木':'tree','欠':'lack','止':'stop','水':'water','⺡':'water',
  '火':'fire','⺣':'fire','爪':'claw','父':'father','犬':'dog','王':'king',
  '玄':'mystery','瓦':'tile','甘':'sweet','生':'life','用':'use','田':'rice field',
  '疒':'sickness','白':'white','皿':'dish','目':'eye','石':'stone','示':'altar',
  '禾':'grain','穴':'hole','立':'stand','竹':'bamboo','米':'rice','糸':'thread',
  '羽':'feather','耳':'ear','肉':'meat','自':'self','舌':'tongue','舟':'boat',
  '色':'color','虫':'insect','行':'go','衣':'clothes','見':'see','言':'speak',
  '豆':'bean','貝':'shell','足':'foot','身':'body','車':'cart','辛':'bitter',
  '辰':'dragon','酉':'wine','里':'village','金':'gold','長':'long','門':'gate',
  '隹':'small bird','雨':'rain','青':'blue','非':'wrong','音':'sound','頁':'page',
  '風':'wind','食':'eat','首':'neck','馬':'horse','骨':'bone','高':'tall',
  '魚':'fish','鳥':'bird',
  '气':'spirit','⺾':'grass','⻌':'walk','ヨ':'snout','丶':'dot','ノ':'slash',
  '勿':'do not','⻏':'town','⻖':'hill','⺨':'dog','⺭':'altar','⺲':'net',
  '儿':'legs','凵':'open box','匚':'box','匕':'spoon','卩':'seal',
  '尸':'corpse','幺':'thread','广':'eaves','彡':'hair',
  '戈':'spear','无':'not','曰':'say','歹':'death','殳':'weapon','比':'compare',
  '毋':'mother','毛':'fur','氏':'clan','爻':'mix','片':'slice','牙':'fang','牛':'cow',
  '皮':'skin','矛':'spear','矢':'arrow','禾':'grain','臣':'minister','至':'arrive',
  '臼':'mortar','艮':'stopping','虍':'tiger','西':'west','赤':'red','走':'run',
  '麻':'hemp','黄':'yellow','黒':'black','鬼':'demon','鼻':'nose',
  '𠆢':'roof','𠂉':'no comb',
};

// Build a kanji-order map ONCE so the composition sort can look up
// Kangxi position in O(1). Keyed by radical glyph → { strokes, idx }
// where idx is the global appearance order across all stroke groups.
let _radicalOrderCache = null;
function radicalOrderMap() {
  if (_radicalOrderCache) return _radicalOrderCache;
  const m = new Map();
  let i = 0;
  for (const group of (window.RADICALS_BY_STROKE || [])) {
    for (const r of (group.chars || [])) {
      m.set(r, { strokes: group.strokes, idx: i++ });
    }
  }
  _radicalOrderCache = m;
  return m;
}

// For each radical glyph, find the matching flashcard if one exists in
// our deck (kanji card OR radical card). Cached lazily for fast lookups.
let _radicalCardCache = null;
function radicalCardLookup() {
  if (_radicalCardCache) return _radicalCardCache;
  const m = {};
  for (const cls of (window.FLASHCARD_CLASSES || [])) {
    for (const c of (cls.cards || [])) {
      if (c.kanji && c.en && !c.type) m[c.kanji] = { en: c.en, classId: cls.id, id: c.id };
      if (c.type === 'radical' && c.titleEn) {
        const rads = Array.isArray(c.radical) ? c.radical : [c.radical];
        for (const r of rads) if (r) m[r] = { en: c.titleEn, classId: cls.id, id: c.id };
      }
    }
  }
  _radicalCardCache = m;
  return m;
}

// Render the composition chips for one kanji. Sorts the radicals by
// Kangxi order (stroke count, then within-stroke index) — same order
// the search page uses for its radical pad, so the learner sees a
// consistent ordering across the app. Chips that map to flashcards in
// our deck become clickable (jump-to-card on click).
function composeChipsHTML(kanji) {
  const radicals = (window.KANJI_RADICALS || {})[kanji];
  if (!radicals || !radicals.length) return '';
  // Don't show a card composed of just itself ("本 is made of 本") —
  // self-only chip would be visual noise.
  if (radicals.length === 1 && radicals[0] === kanji) return '';
  const order = radicalOrderMap();
  const sorted = [...radicals].sort((a, b) => {
    const oa = order.get(a) || { strokes: 99, idx: 999 };
    const ob = order.get(b) || { strokes: 99, idx: 999 };
    if (oa.strokes !== ob.strokes) return oa.strokes - ob.strokes;
    return oa.idx - ob.idx;
  });
  const cards = radicalCardLookup();
  return sorted.map(r => {
    const card = cards[r];
    const meaning = card ? card.en : (RADICAL_HINTS[r] || '');
    const linkable = !!card;
    const attrs = linkable
      ? `data-flash-jump="${escAttr(card.classId)}:${escAttr(card.id)}" role="button" tabindex="0"`
      : '';
    return `
      <span class="testcard-compose-chip${linkable ? ' is-linkable' : ''}" ${attrs}>
        <span class="testcard-compose-glyph">${escHTML(r)}</span>
        ${meaning && APP.flashShowEn ? `<span class="testcard-compose-gloss">${escHTML(meaning)}</span>` : ''}
      </span>`;
  }).join('');
}

// 畳語 (jōgo) — reduplicated kana words like にこにこ / ふにゃふにゃ /
// にゃーにゃー / ぴょんぴょん display as two stacked halves so the
// repeated mirror is readable top-to-bottom (にこ / にこ). Detects
// even-length strings whose two halves are exactly identical and
// splits at the midpoint with a <br>; non-reduplicated strings (人,
// 元気, ぴたり, 御飯, etc.) fall through unchanged. Used by the
// editorial card's front-face glyph.
function splitJougoGlyph(text) {
  const s = text || '';
  const chars = [...s];  // unicode-safe split — kana chars are single code points
  const n = chars.length;
  // Case 1: doubled-stem onomatopoeia (n even, front === back, e.g.
  // にこにこ → にこ / にこ, ふにゃふにゃ → ふにゃ / ふにゃ). Splitting
  // at the midpoint surfaces the reduplication visually — the eye
  // catches the doubling at a glance.
  if (n >= 4 && n % 2 === 0) {
    const half = n / 2;
    const front = chars.slice(0, half).join('');
    const back  = chars.slice(half).join('');
    if (front === back) {
      return escHTML(front) + '<br>' + escHTML(back);
    }
  }
  // Case 2: long non-doubled string (5+ chars) that would otherwise
  // overflow a single line in the small wrap-up tile. Split at the
  // ceiling-midpoint so the front line carries any extra char — this
  // matches the typical "doubled-stem + tail" morphology of these
  // words (くんくんぴょん → くんくん / ぴょん, where くんくん is the
  // reduplicated stem and ぴょん is the trailing morpheme). Used for
  // both kanji and kana strings; on kana strings the split is the
  // only way to make a 7-char word like くんくんぴょん fit a 78px
  // tile at the 22px glyph font-size.
  if (n >= 5) {
    const half = Math.ceil(n / 2);
    return escHTML(chars.slice(0, half).join(''))
         + '<br>'
         + escHTML(chars.slice(half).join(''));
  }
  return escHTML(s);
}

// Compute the longest visual line of a split kana/kanji string, used
// by callers to set a data attribute the CSS can read to scale fonts
// down for tight lines. Counts unicode code points per <br>-separated
// segment and returns the max.
function jougoGlyphMaxLineLen(text) {
  const s = text || '';
  if (!s) return 0;
  const html = splitJougoGlyph(s);
  // Strip any <br>, then take the longest segment by code-point count.
  // We can't just count chars because splitJougoGlyph returns escaped
  // HTML; the escape pass for kana is a no-op so [...] split is safe.
  const segments = html.split(/<br\s*\/?>/i);
  let max = 0;
  for (const seg of segments) {
    // Strip any &amp; / &lt; / etc that escHTML may have introduced.
    const stripped = seg.replace(/&[a-z#0-9]+;/gi, '_');
    const len = [...stripped].length;
    if (len > max) max = len;
  }
  return max;
}

// Wrap-up card — the virtual "you've reached the end of the deck" card
// that sits at position deck.length, one past the last real card. Shown
// in CARD view only. Renders every card in the class as a small image
// tile (no English). Click a tile to flip image ↔ kun/on reading. From
// here, "next" wraps back to card 0, "prev" goes to the last real card.
// "prev" from card 0 wraps to the wrap-up — so the deck loops cyclically
// through this screen.
function wrapupHTML(cls, deck) {
  const splitGlyph = (typeof splitJougoGlyph === 'function')
    ? splitJougoGlyph : escHTML;
  const tilesHTML = deck.map((c, i) => {
    // Type-radical cards have card.radical instead of card.kanji and
    // no kun/on — we show titleJa on the back face for those.
    const isRadical = c.type === 'radical';
    const glyph = c.kanji || (Array.isArray(c.radical) ? c.radical.join(' · ') : c.radical) || '';
    const folder = c.imageFolder || cls.imageFolder || 'kanji';
    // Radical cards don't have a kanji image; render the glyph itself
    // in the image face so the tile still identifies its card. Number
    // cards (digit field set) render the Roman numeral. Everything
    // else gets an image-slot that probes for the illustration.
    const imageFaceHTML = isRadical || !c.kanji
      ? `<div class="wrapup-radical-glyph">${escHTML(glyph)}</div>`
      : c.digit
      ? `<div class="wrapup-digit"${c.digit.length >= 4 ? ' data-digit-long="1"' : ''}>${escHTML(c.digit)}</div>`
      : `<image-slot
           id="wrapup-${escAttr(cls.id)}-${escAttr(c.id)}"
           image-key="${escAttr(folder)}/${escAttr(c.kanji)}"
           shape="rounded" radius="6" fit="contain" position="50% 50%" readonly
           placeholder=""></image-slot>`;
    // Back face: kanji glyph on top, kun + on stacked below. For
    // radicals (no kun/on), show titleJa ("うかんむり", "ごんべん"
    // etc) as the identity instead.
    const readings = isRadical
      ? `<span class="wrapup-title-ja">${escHTML(c.titleJa || '')}</span>`
      : `${c.kun ? `<span class="kun">${escHTML(c.kun)}</span>` : ''}
         ${c.kun && c.on ? '<span class="dot">·</span>' : ''}
         ${c.on ? `<span class="on">${escHTML(c.on)}</span>` : ''}`;
    return `
      <button type="button" class="wrapup-tile" data-flip="0"
              data-wrapup-tile="1"
              aria-label="${escAttr(glyph + (c.kun ? ' ' + c.kun : '') + (c.on ? ' ' + c.on : ''))}">
        <div class="wrapup-tile-face wrapup-face-image">${imageFaceHTML}</div>
        <div class="wrapup-tile-face wrapup-face-back">
          <div class="wrapup-tile-glyph" data-line-len="${
            (typeof jougoGlyphMaxLineLen === 'function')
              ? jougoGlyphMaxLineLen(glyph)
              : ([...(glyph || '')].length)
          }">${splitGlyph(glyph)}</div>
          <div class="wrapup-tile-readings">${readings}</div>
        </div>
      </button>`;
  }).join('');
  return `
    <div class="flash-card flash-wrapup">
      <div class="wrapup-head">
        <span class="wrapup-eyebrow">おしまい <em>· end of</em></span>
        <h2 class="wrapup-title">${escHTML(cls.titleJa)} <em>${escHTML(cls.titleEn)}</em></h2>
        <p class="wrapup-sub">${deck.length} cards — click any tile to flip between image and readings</p>
      </div>
      <div class="wrapup-grid">${tilesHTML}</div>
      <div class="wrapup-footer">
        <!-- Bulk-flip controls (left) — flip every tile in the grid at
             once. 絵 reveals all images; 字 returns every tile to the
             glyph + kun/on readings face. Match the testcard flip-btn
             furi+glyph stack so the visual rhythm is consistent. -->
        <div class="wrapup-flip-all" role="group" aria-label="flip all tiles">
          <button class="wrapup-flip-all-btn" data-wrapup-flip-all="image"
                  aria-label="show all images">
            <span class="wrapup-flip-all-furi">え</span>
            <span class="wrapup-flip-all-glyph">絵</span>
          </button>
          <button class="wrapup-flip-all-btn" data-wrapup-flip-all="readings"
                  aria-label="show all readings">
            <span class="wrapup-flip-all-furi">じ</span>
            <span class="wrapup-flip-all-glyph">字</span>
          </button>
        </div>
        <span class="wrapup-meta">${deck.length} / ${deck.length} · おしまい</span>
        <!-- Nav pair (right) — prev + next sit together, mirroring the
             editorial card's testcard-footer-nav. Prev wraps to the
             last real card; next wraps to card 0. -->
        <div class="wrapup-footer-nav">
          <button class="testcard-nav-btn" data-testcard-nav="prev" aria-label="previous card">
            <span class="testcard-nav-furi">まえ</span>
            <span class="testcard-nav-label"><span class="testcard-nav-arrow">←</span> 前</span>
          </button>
          <button class="testcard-nav-btn is-primary" data-testcard-nav="next" aria-label="back to first card">
            <span class="testcard-nav-furi">つぎ</span>
            <span class="testcard-nav-label">最初へ <span class="testcard-nav-arrow">→</span></span>
          </button>
        </div>
      </div>
    </div>`;
}

function editorialFlashcardHTML(card, cls, related, seeAlso) {
  // Use the EXACT same image path the classic flash-card resolves to —
  // so 人 in editorial mode shows the same illustration 人 shows in old
  // mode. Folder precedence matches the existing flash-card renderer:
  // card.imageFolder → cls.imageFolder → 'kanji' (the global default).
  const imageFolder = card.imageFolder || cls.imageFolder || 'kanji';
  const imageKey = card.kanji;

  // Example meanings respect the global English toggle — when the learner
  // hides English to study, both the meaning field AND the leader dotted
  // line drop out so the row reads as a clean kanji + romaji pair. The
  // "EXAMPLES" eyebrow itself stays visible so the section is still
  // recognizable. Toggle English back on to reveal the gloss.
  //
  // Each example kanji compound is a hover-to-play target — hovering
  // reveals a small speaker icon, clicking triggers TTS. data-speak
  // carries `ex.word` (the kanji compound) so Japanese voice engines
  // render the proper pronunciation; `ex.reading` is romaji-only and
  // would be mispronounced as English by most TTS voices.
  const showEnExamples = APP.flashShowEn;
  const examplesHTML = (card.examples || []).map(ex => `
    <li class="testcard-ex${showEnExamples ? '' : ' testcard-ex-noen'}">
      <span class="testcard-ex-kanji read-tts" data-speak="${escAttr(ex.word || '')}" title="play ${escAttr(ex.reading || '')}">
        ${escHTML(ex.word)}
        <span class="read-tts-icon" aria-hidden="true">${speakerIconSVG()}</span>
      </span>
      <span class="testcard-ex-romaji">${escHTML(ex.reading)}</span>
      ${showEnExamples ? `
        <span class="testcard-ex-leader" aria-hidden="true"></span>
        <span class="testcard-ex-en">${escHTML(ex.meaning)}</span>
      ` : ''}
    </li>
  `).join('');

  // Heisig + strokes chips
  const heisigHTML = (typeof heisigChip === 'function') ? heisigChip(card.kanji) : '';

  // "Also reads" = kanji sharing the kun reading (existing related index)
  const alsoReadsChips = (related || []).map(p => `
    <button class="testcard-chip" data-flash-jump="${escAttr(p.classId)}:${escAttr(p.id)}" title="${escAttr(p.en)}">
      <span class="testcard-chip-kanji">${escHTML(p.kanji)}</span>
      <span class="testcard-chip-en">${escHTML(p.en)}</span>
    </button>
  `).join('');

  // "See also" — explicit cross-refs declared on the card
  const seeAlsoChips = (seeAlso || []).map(p => `
    <button class="testcard-chip" data-flash-jump="${escAttr(p.classId)}:${escAttr(p.id)}" title="${escAttr(p.en)}">
      <span class="testcard-chip-kanji">${escHTML(p.kanji)}</span>
      <span class="testcard-chip-en">${escHTML(p.en)}</span>
    </button>
  `).join('');

  // Glyph + text font selection happens in the TOP CONTROL ROW now
  // (built in renderFlashcards), not inside the card. We just read the
  // current font choices to apply them to the rendered glyph + text.
  const glyphFont = APP.flashGlyphFont || 'brush';
  const glyphFontStack = (typeof fontStackFor === 'function')
    ? fontStackFor(glyphFont)
    : 'var(--font-title)';
  const textFont = APP.flashTextFont || 'mincho';
  const textFontStack = (typeof fontStackFor === 'function')
    ? fontStackFor(textFont)
    : 'var(--serif-jp)';

  // ── Back face content ───────────────────────────────────────────────
  // Stroke order source resolution — uses the manifest map built at
  // startup (window.STROKE_FORMATS, generated by the download script).
  // Linking the exact known extension per-kanji avoids the onerror dance
  // we had before, which apparently didn't fire reliably for some files
  // (e.g. 今, which has an SVG but no GIF).
  //   - manifest says 'gif' → load .gif
  //   - manifest says 'svg' → load .svg (Wikimedia animated SVG or
  //                                       KanjiVG+SMIL)
  //   - kanji not in manifest → no asset on disk → placeholder shows
  //
  // NB: the kanji goes into the URL UN-ENCODED. The original version
  // ran the character through encodeURIComponent, which produced
  // `%E6%9E%97-order.svg` style URLs. Modern HTTP servers decode that
  // correctly back to the kanji filename on disk, but file:// URL
  // handling is inconsistent — some browsers refuse to decode percent
  // escapes back to non-ASCII filenames, so they'd literally look for
  // a file with `%E6%9E%97` in its name and 404. The HTML spec lets
  // the browser handle URL encoding for the network request, so
  // passing the raw kanji works in BOTH file:// and HTTP contexts.
  // Extract kanji-only chars from card.kanji. The back-face stroke-order
  // panel needs to handle three shapes:
  //   1. Pure kana cards (にこにこ, ピンク) → no kanji at all → skip the
  //      stroke section entirely.
  //   2. Single kanji (人, 食, 茶) → existing single-panel render.
  //   3. Multi-kanji compound (元気, 御飯, 昨日) → render one panel
  //      per kanji, side by side.
  // Spec §4.4 / §4.5.
  const kanjiChars = [...(card.kanji || '')].filter(c => {
    const code = c.codePointAt(0);
    return (code >= 0x4E00 && code <= 0x9FFF)   // CJK Unified Ideographs
        || (code >= 0x3400 && code <= 0x4DBF);  // Extension A (rare but legal)
  });
  const strokePanels = kanjiChars.map(k => {
    const fmt = (window.STROKE_FORMATS || {})[k] || null;
    return {
      kanji: k,
      fmt,
      src: fmt ? `images/stroke/${k}-order.${fmt}` : null,
    };
  });
  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(card.kanji)}`;
  const composeChips = composeChipsHTML(card.kanji);
  const flipped = !!APP.flashFlipped;

  return `
    <div class="flash-card testcard-frame" style="--testcard-text-font:${escAttr(textFontStack)}">
      <div class="testcard-flip-wrap" data-flipped="${flipped}">
        <div class="testcard-flip-inner">
          <div class="testcard-flip-front" aria-hidden="${flipped}">
            <div class="testcard">
              <div class="testcard-left">
                <div class="testcard-image${card.digit ? ' testcard-image-digit' : ''}">
                  ${card.digit
                    ? `<span class="testcard-digit"${card.digit.length >= 4 ? ' data-digit-long="1"' : ''}>${escHTML(card.digit)}</span>`
                    : `<image-slot
                        id="flash-${escAttr(card.id)}"
                        image-key="${escAttr(imageFolder)}/${escAttr(imageKey)}"
                        shape="rounded" radius="8" fit="contain" position="50% 50%" readonly
                        placeholder="No illustration for ${escAttr(card.kanji)} yet"></image-slot>`}
                </div>
                <div class="testcard-glyph" style="font-family:${escAttr(glyphFontStack)}">${splitJougoGlyph(card.kanji)}</div>
                <div class="testcard-readings">
                  ${card.kun ? `<span class="testcard-reading-label">kun</span>
                    <span class="testcard-reading-val read-tts" data-speak="${escAttr(card.kun)}" title="play kun reading">
                      ${escHTML(card.kun)}
                      <span class="read-tts-icon" aria-hidden="true">${speakerIconSVG()}</span>
                    </span>` : ''}
                  ${card.kun && card.on ? `<span class="testcard-reading-dot">·</span>` : ''}
                  ${card.on ? `<span class="testcard-reading-label">on</span>
                    <span class="testcard-reading-val read-tts" data-speak="${escAttr(card.on)}" title="play on reading">
                      ${escHTML(card.on)}
                      <span class="read-tts-icon" aria-hidden="true">${speakerIconSVG()}</span>
                    </span>` : ''}
                </div>
              </div>

              <div class="testcard-right">
                <section class="testcard-section">
                  <div class="testcard-eyebrow">MEANING</div>
                  <div class="testcard-meaning">${APP.flashShowEn ? escHTML(card.en) : '— —'}</div>
                </section>

                <div class="testcard-rule"></div>

                ${examplesHTML ? `
                  <section class="testcard-section">
                    <div class="testcard-eyebrow">EXAMPLES</div>
                    <ul class="testcard-examples">${examplesHTML}</ul>
                  </section>
                  <div class="testcard-rule"></div>
                ` : ''}

                ${(alsoReadsChips || seeAlsoChips) ? `
                  <div class="testcard-related">
                    ${alsoReadsChips ? `
                      <section class="testcard-related-block">
                        <div class="testcard-eyebrow">ALSO READS ${escHTML(card.kun || '')}</div>
                        <div class="testcard-chips">${alsoReadsChips}</div>
                      </section>
                    ` : ''}
                    ${seeAlsoChips ? `
                      <section class="testcard-related-block">
                        <div class="testcard-eyebrow">SEE ALSO</div>
                        <div class="testcard-chips">${seeAlsoChips}</div>
                      </section>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="testcard-flip-back" aria-hidden="${!flipped}">
            <div class="testcard-back-head">
              <span class="testcard-back-glyph" style="font-family:${escAttr(glyphFontStack)}">${escHTML(card.kanji)}</span>
              <span class="testcard-back-readings">
                ${card.kun ? escHTML(card.kun) : ''}${card.kun && card.on ? ' · ' : ''}${card.on ? escHTML(card.on) : ''}
              </span>
              ${APP.flashShowEn ? `<span class="testcard-back-meaning">${escHTML(card.en || '')}</span>` : ''}
            </div>

            <div class="testcard-back-body">
              ${strokePanels.length === 0 ? '' : `
                <div class="testcard-back-stroke ${strokePanels.length > 1 ? 'is-multi' : ''}">
                  ${strokePanels.map(p => `
                    <div class="testcard-back-stroke-panel">
                      ${p.src ? (p.fmt === 'svg' ? `
                        <!-- SVG uses <object> instead of <img>: KanjiVG SVGs
                             animate via SMIL (stroke-dashoffset on each path),
                             and many browsers don't run SMIL inside <img>
                             tags — they render only the first frame, which
                             for these SVGs is "dashoffset=1" = stroke fully
                             hidden = empty box. <object> loads the SVG as its
                             own document, with full SMIL support. -->
                        <object
                          class="testcard-stroke-gif"
                          type="image/svg+xml"
                          data="${escAttr(p.src)}"
                          aria-label="Stroke order for ${escAttr(p.kanji)}">
                        </object>
                      ` : `
                        <!-- GIF uses plain <img> — animation is baked into
                             the file format itself, no SMIL needed. -->
                        <img
                          class="testcard-stroke-gif"
                          src="${escAttr(p.src)}"
                          alt="Stroke order for ${escAttr(p.kanji)}">
                      `) : `
                        <img class="testcard-stroke-gif is-missing" alt="" aria-hidden="true">
                        <div class="testcard-stroke-missing">
                          Stroke order for <strong>${escHTML(p.kanji)}</strong> isn't downloaded yet.<br>
                          Run <code>node scripts/download-stroke-gifs.mjs --jouyou</code> to fetch it.
                        </div>
                      `}
                      ${strokePanels.length > 1 ? `<div class="testcard-back-stroke-label">${escHTML(p.kanji)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              `}

              <div class="testcard-back-info">
                <section>
                  <div class="testcard-eyebrow">COMPOSED OF</div>
                  ${composeChips
                    ? `<div class="testcard-compose-chips">${composeChips}</div>`
                    : `<div class="testcard-compose-empty">No constituent radicals listed.</div>`}
                </section>

                ${card.writeNote ? `
                  <section>
                    <div class="testcard-eyebrow">WRITING NOTE</div>
                    <div class="testcard-back-note"><p>${escHTML(card.writeNote)}</p></div>
                  </section>
                ` : ''}

                ${card.strokes ? `
                  <section>
                    <div class="testcard-eyebrow">STROKES</div>
                    <div class="testcard-back-note"><p>${card.strokes} 画 — the total stroke count for this kanji.</p></div>
                  </section>
                ` : ''}
              </div>
            </div>

            <div class="testcard-back-credit">
              stroke order via <a href="${escAttr(wiktionaryUrl)}" target="_blank" rel="noopener noreferrer">Wiktionary</a> · CC BY-SA
            </div>
          </div>
        </div>
      </div>

      <div class="testcard-footer">
        <div class="testcard-footer-meta">
          ${heisigHTML}
          ${card.strokes ? `<span class="testcard-strokes">${card.strokes}画</span>` : ''}
        </div>
        <div class="testcard-footer-flip">
          <button class="testcard-flip-btn" data-testcard-flip data-flipped="${flipped}"
                  aria-label="${flipped ? 'show front of card' : 'show back of card (stroke order)'}"
                  title="${flipped ? 'おもて · front' : 'うら · back (stroke order)'}">
            <span class="testcard-nav-furi">${flipped ? 'おもて' : 'うら'}</span>
            <span class="testcard-flip-label">${flipped ? '表' : '裏'}</span>
          </button>
        </div>
        <div class="testcard-footer-nav">
          <button class="testcard-nav-btn" data-testcard-nav="prev" aria-label="previous card">
            <span class="testcard-nav-furi">まえ</span>
            <span class="testcard-nav-label"><span class="testcard-nav-arrow">←</span> 前</span>
          </button>
          <button class="testcard-nav-btn is-primary" data-testcard-nav="next" aria-label="next card">
            <span class="testcard-nav-furi">つぎ</span>
            <span class="testcard-nav-label">次 <span class="testcard-nav-arrow">→</span></span>
          </button>
        </div>
      </div>
    </div>`;
}

// ── List view ─────────────────────────────────────────────────────────
// Shows every kanji in the current class as a 2-column grid of rows.
// Each row: kanji glyph + readings + English meaning. Click a row →
// opens that card in card view.
//
// The list-specific font preferences (listGlyphFont / listTextFont) are
// applied via CSS variables on the wrapper — the glyph column uses
// --list-glyph-font, the readings/text use --list-text-font. Brush is
// filtered out of the dropdown options (in the top toggle row) since
// brush is too decorative for a scannable list, but if somehow brush
// is the active value we fall back to mincho here so the row stays
// readable.
function flashListViewHTML(cls, deck) {
  const safeFont = (id) => (id && id !== 'brush') ? id : 'mincho';
  const glyphStack = (typeof fontStackFor === 'function')
    ? fontStackFor(safeFont(APP.listGlyphFont))
    : 'var(--font-title)';
  const textStack = (typeof fontStackFor === 'function')
    ? fontStackFor(safeFont(APP.listTextFont))
    : 'var(--serif-jp)';
  const showEn = APP.flashShowEn;
  return `
    <div class="flash-list" style="--list-glyph-font:${escAttr(glyphStack)};--list-text-font:${escAttr(textStack)}">
      ${deck.map((c, i) => {
        const kanjiText = c.kanji || c.radical || '';
        // 7+ unicode chars opt into the wrap-allowed .is-long mode. Up to
        // 6 chars stay on a single line (default) so 2-glyph compounds like
        // 今日 don\'t stack vertically — visual scanning of the deck is
        // much easier when short words read horizontally.
        const isLong = [...kanjiText].length > 6;
        return `
        <button class="flash-list-row" data-flash-jump-idx="${i}">
          <span class="flash-list-kanji${isLong ? ' is-long' : ''}">${escHTML(kanjiText)}</span>
          <span class="flash-list-readings">
            ${c.kun ? `<span class="flash-list-kun">${escHTML(c.kun)}</span>` : ''}
            ${c.kun && c.on ? `<span class="flash-list-sep">·</span>` : ''}
            ${c.on ? `<span class="flash-list-on">${escHTML(c.on)}</span>` : ''}
          </span>
          ${showEn ? `<span class="flash-list-en">${escHTML(c.en || '')}</span>` : '<span class="flash-list-en flash-list-en-hidden">—</span>'}
          ${c.strokes ? `<span class="flash-list-strokes">${c.strokes}画</span>` : ''}
        </button>
      `;
      }).join('')}
    </div>`;
}

function renderSearch(container) {
  const raw = window.RADICALS_BY_STROKE || [];
  // Collapse the long tail to save vertical space: keep 1–7 as-is, merge
  // 8+9 into one row, and merge 10+ (everything from 10 onwards — sparse
  // and rarely needed in our deck) into one row. Each row carries a
  // display `label` so the renderer doesn\'t need to know the rule.
  const all = [];
  let pool89 = [];
  let pool10plus = [];
  for (const g of raw) {
    if (g.strokes <= 7)           all.push({ label: String(g.strokes),  chars: g.chars });
    else if (g.strokes <= 9)      pool89.push(...g.chars);
    else                          pool10plus.push(...g.chars);
  }
  if (pool89.length)     all.push({ label: '8+9',  chars: pool89 });
  if (pool10plus.length) all.push({ label: '10+',  chars: pool10plus });

  const selected = Array.isArray(APP.radicalsSelected) ? APP.radicalsSelected : [];
  const selectedSet = new Set(selected);
  const matches = kanjiMatchingRadicals(selected);

  // Pre-compute which radicals would yield zero results given the current
  // selection — those get dimmed (still clickable for browse-only, but
  // visually de-emphasized like jisho.org does). When nothing is selected
  // everything is "alive."
  const aliveRadicals = new Set();
  if (selected.length === 0) {
    for (const k in (window.KANJI_RADICALS || {})) {
      for (const r of (window.KANJI_RADICALS[k] || [])) aliveRadicals.add(r);
    }
  } else {
    // For each candidate radical, would adding it to the selection produce
    // any matches? If yes, mark as alive. Reuse Idx.radicalCandidates() — the
    // deduped non-radical cards with radicals precomputed — instead of
    // rebuilding the card-kanji list and re-resolving radicalsForKanji() for
    // every candidate radical on every render. Equivalent: dedup doesn't change
    // a .some() result, and candidates already exclude cards with no radicals
    // (which never matched under the old `rad.length` guard).
    const cands = Idx.radicalCandidates();
    for (const group of all) {
      for (const r of group.chars) {
        if (selectedSet.has(r)) { aliveRadicals.add(r); continue; }
        // would this radical, added to current selection, return any kanji?
        const next = [...selected, r];
        const has = cands.some(c => next.every(x => c.radicals.includes(x)));
        if (has) aliveRadicals.add(r);
      }
    }
  }

  container.innerHTML = `
    <div class="page-head">
      <div class="page-eyebrow">search · 検索</div>
      <h1 class="page-title-jp">ぶしゅ から さがす</h1>
      <div class="rule"></div>
      <p class="page-sub">
        Pick radicals to find kanji in your decks that contain all of them.
        Click a result to jump to its flashcard.
      </p>
    </div>

    <div class="rad-selected ${selected.length ? '' : 'is-empty'}">
      <span class="rad-selected-label">selected</span>
      <div class="rad-selected-chips">
        ${selected.length === 0
          ? `<span class="rad-selected-placeholder">none — pick from below</span>`
          : selected.map(r => `<button class="rad-chip is-active is-tray" data-rad-toggle="${escAttr(r)}">${escHTML(r)}</button>`).join('')
        }
      </div>
      ${selected.length ? `<button class="rad-clear" data-rad-clear>clear</button>` : ''}
    </div>

    <div class="rad-grid">
      ${all.map(group => `
        <div class="rad-stroke-row">
          <div class="rad-stroke-label">
            <span class="rad-stroke-num">${escHTML(group.label)}</span>
            <span class="rad-stroke-unit">画</span>
          </div>
          <div class="rad-stroke-chips">
            ${group.chars.map(r => `
              <button class="rad-chip ${selectedSet.has(r) ? 'is-active' : ''} ${aliveRadicals.has(r) ? '' : 'is-dim'}" data-rad-toggle="${escAttr(r)}">${escHTML(r)}</button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="rad-results">
      <div class="rad-results-head">
        <span class="rad-results-label">${selected.length === 0 ? 'all decomposed kanji' : 'matching kanji'}</span>
        <span class="rad-results-count">${matches.length}</span>
      </div>
      ${matches.length === 0 ? `
        <div class="rad-empty">
          ${selected.length === 0
            ? 'No kanji in the deck are decomposed yet.'
            : `No kanji in the deck contain ${selected.length === 1 ? 'this radical' : 'all of these radicals'}. Try a different combination.`}
        </div>
      ` : `
        <div class="rad-result-grid">
          ${matches.map(c => `
            <button class="rad-result" data-rad-kanji="${escAttr(c.kanji)}">
              <span class="rr-kanji">${escHTML(c.kanji)}</span>
              <span class="rr-body">
                ${c.kun ? `<span class="rr-reading">${escHTML(c.kun)}</span>` : ''}
                ${c.on ? `<span class="rr-on">${escHTML(c.on)}</span>` : ''}
                <span class="rr-en">${escHTML(c.en)}</span>
              </span>
            </button>
          `).join('')}
        </div>
      `}
    </div>`;

  // Toggle selection — selected radicals stack into the tray; clicking an
  // already-selected radical removes it.
  container.querySelectorAll('[data-rad-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = btn.dataset.radToggle;
      const next = selectedSet.has(r) ? selected.filter(x => x !== r) : [...selected, r];
      APP.radicalsSelected = next;
      lsSet('jp:radicalsSelected', next);
      renderSearch(container);
    });
  });

  container.querySelectorAll('[data-rad-clear]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.radicalsSelected = [];
      lsSet('jp:radicalsSelected', []);
      renderSearch(container);
    });
  });

  container.querySelectorAll('[data-rad-kanji]').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToKanjiFlashcard(btn.dataset.radKanji);
    });
  });
}

// ── Flashcards ───────────────────────────────────────────────────────────
// Build a "this kun reading also belongs to which kanji?" index across every
// flashcard class. We use the kun reading (the native Japanese word the
// kanji stands in for) because that's where the most surprising homophones
// live — e.g. 鼻 and 花 both read はな despite meaning very different things.
// Tags each card with classId so the related chip can hop to the right deck.
function relatedByKun(card, kunIdx) {
  if (!card || !card.kun) return [];
  const kun = card.kun.replace(/[().\s]/g, '');
  return (kunIdx.get(kun) || []).filter(p => p.kanji !== card.kanji);
}

// "See also" cross-references are manually declared via card.seeAlso.
// Bidirectional by design — a single declaration on either side surfaces
// the link on both. Used for visual-component / component-radical pairs
// where kun-based homophone matching wouldn't catch the relationship
// (e.g. 未 and 妹 share the 未 component but have different readings).
function lookupCardByKanji(kanji) {
  const e = Idx.cardEntry(kanji);
  return e ? Object.assign({}, e.card, { classId: e.classId }) : null;
}
function seeAlsoCards(card) {
  if (!card) return [];
  const seen = new Set();
  const out = [];
  for (const k of (card.seeAlso || [])) {
    if (k === card.kanji || seen.has(k)) continue;
    const c = lookupCardByKanji(k);
    if (c) { out.push(c); seen.add(k); }
  }
  // Reverse direction — peers that point AT this card auto-surface here.
  for (const e of Idx.seeAlsoReverse(card.kanji)) {
    if (e.card.kanji === card.kanji || seen.has(e.card.kanji)) continue;
    out.push(Object.assign({}, e.card, { classId: e.classId }));
    seen.add(e.card.kanji);
  }
  return out;
}

// Tracks the class id the flash-sidebar was last rendered with. When
// renderFlashSidebar is invoked and the class hasn't changed, we skip
// the innerHTML rebuild — otherwise the brush <img> would be recreated
// and its CSS animation would restart every time renderFlashcards is
// called (which happens on EVERY card flip, navigation, view toggle,
// English toggle, etc.). The brush should only re-fire when the
// active CLASS actually changes.
//
// Reset to null in setSection whenever we enter or leave flashcards
// (see setSection) so re-entry from another section forces a fresh
// render and triggers the tier-2 brush as part of the cascade.
let _lastRenderedFlashClass = null;
function renderFlashSidebar() {
  const el = document.getElementById('flash-sidebar');
  if (!el) return;
  // Skip the rebuild if the sidebar already shows the current class —
  // the existing DOM has the correct .active item and brush. Without
  // this guard, every next/prev/flip click would re-render the sidebar
  // and re-animate the brush.
  if (_lastRenderedFlashClass === APP.flashClassId) return;
  _lastRenderedFlashClass = APP.flashClassId;
  const classes = window.FLASHCARD_CLASSES || [];
  el.innerHTML = `
    <div class="flash-sidebar-head">categories</div>
    <ul class="cat-list">
      ${classes.map(c => {
        const isActive = c.id === APP.flashClassId;
        return `
        <li>
          <button class="cat-item ${isActive ? 'active' : ''}" data-flash-cat="${c.id}">
            <span class="cat-glyph">${c.glyph}</span>
            <span class="cat-label">
              <span class="cat-ja">${escHTML(c.titleJa)}</span>
              <span class="cat-en">${escHTML(c.titleEn)}</span>
            </span>
            ${isActive ? activeBrushHTML(2) : ''}
          </button>
        </li>
      `;
      }).join('')}
    </ul>`;
  el.querySelectorAll('[data-flash-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.flashCat === APP.flashClassId) return;
      APP.flashClassId = btn.dataset.flashCat;
      APP.flashIdx = 0;
      APP.flashFlipped = false;
      lsSet('jp:flashClass', APP.flashClassId);
      // Refresh the page bg too — flashcards rotates its bg on every
      // category change (random mode), or stays locked if the user has
      // picked a specific bg in the top-row dropdown.
      if (typeof applyContextBg === 'function') applyContextBg();
      // renderFlashcards calls renderFlashSidebar internally at the end
      // of its body, so we MUST NOT call it again here — doing so would
      // queue a second tier-2 brush with delay 0.18s (cascade position
      // 2 instead of 1), causing the brushstroke to fire ~180ms later
      // than it should after a click.
      renderFlashcards(document.getElementById('main-inner'));
    });
  });
}

function renderFlashcards(container) {
  const classes = window.FLASHCARD_CLASSES || [];
  if (!classes.length) { container.innerHTML = '<div class="empty-state">No flashcards loaded.</div>'; return; }
  const cls = classes.find(c => c.id === APP.flashClassId) || classes[0];
  // Filter out cards marked vocabOnly:true — these are vocabulary words
  // that live in a class's `cards` array so they show up in places like
  // the writing/colors reference grid (which reads from FLASHCARD_CLASSES),
  // but shouldn't appear as standalone flashcards. Used for loanwords
  // (オレンジ, ピンク) and softer compound-color variants (桃色) that
  // don't earn drill time in the Colors deck.
  const deck = (cls.cards || []).filter(c => !c.vocabOnly);
  if (!deck.length) {
    container.innerHTML = `<div class="empty-state">${escHTML(cls.titleEn)} — coming soon.</div>`;
    return;
  }
  // Wrap-up sits at position deck.length — one past the last real card.
  // Navigation now cycles through deck.length + 1 positions: 0..deck-1
  // are normal cards, deck.length is the wrap-up screen. Only positions
  // > deck.length get reset to 0 (handles a stored APP.flashIdx that
  // doesn't match the current class's size after a class switch).
  if (APP.flashIdx > deck.length) APP.flashIdx = 0;
  const isWrapup = APP.flashIdx === deck.length;
  const card = isWrapup ? null : deck[APP.flashIdx];
  const related = card ? relatedByKun(card, Idx.kunIndex()) : [];
  const seeAlso = card ? seeAlsoCards(card) : [];

  // Progress: full bar when on the wrap-up screen (you've reached the
  // end of the deck), proportional otherwise.
  const pct = isWrapup ? 100 : ((APP.flashIdx + 1) / deck.length) * 100;

  // Colors-class colorize: paint the kanji in the swatch color so the glyph
  // literally IS the color it names. For compound names ending in 色 (e.g.
  // 黄色, 茶色, 灰色, 水色) only the prefix is colored — the trailing 色 stays
  // in ink so the learner can still anchor on the base "color" kanji.
  // Loanwords (オレンジ, ピンク) and pure kanji (赤, 青, 緑) colorize fully.
  const colorizeOn = !isWrapup && APP.flashColorize && cls.id === 'colors' && card.swatch && card.kanji;
  const colorSuffix = (colorizeOn && card.kanji.endsWith('色')) ? '色' : '';
  const colorMain = colorizeOn ? (colorSuffix ? card.kanji.slice(0, -1) : card.kanji) : '';
  const isWhiteSwatch = !isWrapup && card.swatch && card.swatch.toLowerCase() === '#ffffff';
  // White on cream paper is invisible — switch to an outlined glyph instead
  // of a filled one so the kanji still reads.
  const colorKanjiHTML = isWrapup ? '' : (colorizeOn
    ? `<span class="color-glyph${isWhiteSwatch ? ' color-glyph-light' : ''}"${isWhiteSwatch ? '' : ` style="color:${escAttr(card.swatch)}"`}>${escHTML(colorMain)}</span>${colorSuffix ? `<span>${escHTML(colorSuffix)}</span>` : ''}`
    : escHTML(card.kanji));

  // Top control row — three groups laid out horizontally:
  //   1. View toggle  (card / list)
  //   2. Font dropdowns (glyph + text) — visible in BOTH views, but the
  //      list view\'s set excludes Brush (too decorative for a list).
  //   3. English toggle (英 / —) — always visible, applies to both views.
  const inCardView = APP.flashView === 'card';
  const inListView = APP.flashView === 'list';
  const fontOpts     = (typeof KANA_FONTS !== 'undefined' && KANA_FONTS.length) ? KANA_FONTS : [];
  const fontOptsList = fontOpts.filter(f => f.id !== 'brush');

  const fontPickersTopHTML = inCardView && fontOpts.length ? `
    <div class="flash-top-fontpickers">
      <span class="flash-top-fontpicker">
        <span class="flash-top-fontpicker-label">glyph</span>
        ${fontDropdownHTML(fontOpts, APP.flashGlyphFont || 'brush', 'glyph')}
      </span>
      <span class="flash-top-fontpicker">
        <span class="flash-top-fontpicker-label">text</span>
        ${fontDropdownHTML(fontOpts, APP.flashTextFont || 'mincho', 'cardText')}
      </span>
    </div>
  ` : inListView && fontOptsList.length ? `
    <div class="flash-top-fontpickers">
      <span class="flash-top-fontpicker">
        <span class="flash-top-fontpicker-label">glyph</span>
        ${fontDropdownHTML(fontOptsList, APP.listGlyphFont || 'mincho', 'listGlyph')}
      </span>
      <span class="flash-top-fontpicker">
        <span class="flash-top-fontpicker-label">text</span>
        ${fontDropdownHTML(fontOptsList, APP.listTextFont || 'mincho', 'listText')}
      </span>
    </div>
  ` : '';

  // English toggle — only the LIST view renders it inline at the top.
  // In CARD view the right rail (.flash-rail-right) already owns this
  // toggle, so duplicating it here would waste vertical space above the
  // card. Mobile still gets a separate inline copy via .flash-mobile-head
  // (the rails collapse off-canvas below 760px).
  const englishToggleHTML = `
    <div class="flash-top-en" role="group" aria-label="translations">
      <button class="pill-sq ${APP.flashShowEn ? 'active' : ''}" data-flash-en="true" title="Show English">英</button>
      <button class="pill-sq ${!APP.flashShowEn ? 'active' : ''}" data-flash-en="false" title="Hide English">—</button>
    </div>`;

  // Bg preference dropdown — flashcards-only. Lists 'random' + each
  // file in SECTION_BGS.flashcards. Random keeps cycling on every
  // category change; a specific filename locks the page to that bg.
  const bgPickerHTML = (() => {
    const list = (typeof SECTION_BGS !== 'undefined' && SECTION_BGS.flashcards) || [];
    if (!list.length) return '';
    const pref = APP.flashBgPref || 'random';
    // File path → bare filename for the option value + readable label.
    const fileName = p => p.split('/').pop();
    const labelFor = p => {
      const base = fileName(p).replace(/\.png$/, '');
      // bg-fuji → fuji  · bg-momiji → momiji  etc.
      return base.replace(/^bg-/, '');
    };
    const opts = [
      `<option value="random"${pref === 'random' ? ' selected' : ''}>random</option>`,
      `<option value="none"${pref === 'none' ? ' selected' : ''}>none</option>`,
      ...list.map(p => {
        const f = fileName(p);
        return `<option value="${escAttr(f)}"${pref === f ? ' selected' : ''}>${escHTML(labelFor(p))}</option>`;
      }),
    ].join('');
    return `
      <span class="flash-top-fontpicker flash-top-bgpicker">
        <span class="flash-top-fontpicker-label">bg</span>
        <select class="flash-bg-select" data-flash-bg aria-label="background preference">${opts}</select>
      </span>`;
  })();

  const viewToggleHTML = `
    <div class="flash-top-row">
      <div class="flash-view-toggle" role="group" aria-label="view">
        <button class="flash-view-btn ${inCardView ? 'is-active' : ''}" data-flash-view="card" title="single card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="1"/><line x1="13" y1="8" x2="20" y2="8"/><line x1="13" y1="12" x2="20" y2="12"/><line x1="13" y1="16" x2="18" y2="16"/></svg>
          <span>card</span>
        </button>
        <button class="flash-view-btn ${inListView ? 'is-active' : ''}" data-flash-view="list" title="list view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          <span>list</span>
        </button>
      </div>
      ${fontPickersTopHTML}
      ${bgPickerHTML}
      ${inListView ? englishToggleHTML : ''}
    </div>`;

  // LIST VIEW — short-circuit and render the whole-class list.
  if (APP.flashView === 'list') {
    container.innerHTML = `
      <div class="class-strip">
        ${classes.map(c => `
          <button class="class-tab ${c.id === APP.flashClassId ? 'active' : ''}" data-flash-class="${c.id}">
            <span class="glyph">${c.glyph}</span>
            <span class="label">
              <span class="ja">${escHTML(c.titleJa)}</span>
              <span class="en">${escHTML(c.titleEn)}</span>
            </span>
          </button>
        `).join('')}
      </div>
      ${viewToggleHTML}
      ${flashListViewHTML(cls, deck)}`;
    container.querySelectorAll('[data-flash-class]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.flashClass === APP.flashClassId) return;
        APP.flashClassId = btn.dataset.flashClass;
        APP.flashIdx = 0;
        APP.flashFlipped = false;
        lsSet('jp:flashClass', APP.flashClassId);
        if (typeof applyContextBg === 'function') applyContextBg();
        // renderFlashcards calls renderFlashSidebar internally — don't
        // double-call it or the cascade queues a second tier-2 brush and
        // the brushstroke starts 0.18s late.
        renderFlashcards(container);
      });
    });
    container.querySelectorAll('[data-flash-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        APP.flashView = btn.dataset.flashView;
        lsSet('jp:flashView', APP.flashView);
        renderFlashcards(container);
      });
    });
    // English toggle (英 / —) inside the list view — affects whether
    // each row\'s gloss renders.
    container.querySelectorAll('[data-flash-en]').forEach(btn => {
      btn.addEventListener('click', () => {
        APP.flashShowEn = btn.dataset.flashEn === 'true';
        lsSet('jp:flashShowEn', APP.flashShowEn);
        renderFlashcards(container);
      });
    });
    // Background picker — 'random' cycles a new bg on each category
    // change; a specific filename locks the flashcards page to that bg.
    container.querySelectorAll('[data-flash-bg]').forEach(sel => {
      sel.addEventListener('change', () => {
        APP.flashBgPref = sel.value || 'random';
        lsSet('jp:flashBgPref', APP.flashBgPref);
        if (typeof applyContextBg === 'function') applyContextBg();
      });
    });
    // Font dropdowns inside the list view — listGlyph + listText.
    // Same shared handler the card view uses; routes through
    // FONT_DROPDOWN_TARGETS to update the right APP state slot.
    initFontDropdownHandlers((target, fontId) => {
      const cfg = FONT_DROPDOWN_TARGETS[target];
      if (!cfg) return;
      APP[cfg.state] = fontId;
      lsSet(cfg.ls, fontId);
      if (target === 'listGlyph' || target === 'listText') {
        renderFlashcards(container);
      }
    });
    container.querySelectorAll('[data-flash-jump-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        APP.flashIdx = +btn.dataset.flashJumpIdx || 0;
        APP.flashView = 'card';
        APP.flashFlipped = false;
        lsSet('jp:flashView', 'card');
        renderFlashcards(container);
      });
    });
    // Sync the flash-sidebar active item — the card-view branch does
    // this in its final renderFlashSidebar() call (line ~19198), but
    // the list-view branch returns early so we must mirror it here.
    // Without this, clicking a sidebar category while in list view
    // updates the list itself but leaves the OLD .active highlight
    // and brushstroke pinned to the previous category.
    renderFlashSidebar();
    return;
  }

  container.innerHTML = `
    <div class="class-strip">
      ${classes.map(c => `
        <button class="class-tab ${c.id === APP.flashClassId ? 'active' : ''}" data-flash-class="${c.id}">
          <span class="glyph">${c.glyph}</span>
          <span class="label">
            <span class="ja">${escHTML(c.titleJa)}</span>
            <span class="en">${escHTML(c.titleEn)}</span>
          </span>
        </button>
      `).join('')}
    </div>
    ${viewToggleHTML}

    <div class="flash-mobile-head">
      <div class="floating-controls" style="margin:0">
        <span class="small-label">translations</span>
        <button class="pill ${APP.flashShowEn ? 'active' : ''}" data-flash-en="true">show</button>
        <button class="pill ${!APP.flashShowEn ? 'active' : ''}" data-flash-en="false">hide</button>
      </div>
    </div>

    <div class="flash-layout ${inCardView ? 'flash-layout-editorial' : ''}">
      <div class="flash-rail-left">
        <span class="flash-title-vert">絵 · 漢字 · よみかた</span>
      </div>

      <div class="flash-center">
        <button class="icon-btn flash-nav" id="flash-prev" title="previous (←)" aria-label="previous card">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="flash-deck flash-deck-editorial">
          <div class="flash-stage">
            ${isWrapup ? wrapupHTML(cls, deck) : card.type === 'radical' ? `
            <div class="flash-card radical-card">
              <div class="radical-head">
                ${Array.isArray(card.radical) ? `
                  <div class="radical-glyph radical-glyph-pair">
                    ${card.radical.map((r, i) => `
                      ${i > 0 ? '<span class="radical-sep">·</span>' : ''}
                      <span>${escHTML(r)}</span>
                    `).join('')}
                  </div>
                ` : `
                  <div class="radical-glyph">${escHTML(card.radical)}</div>
                `}
                ${card.from ? `
                  <div class="radical-arrow">←</div>
                  <div class="radical-from">
                    <span class="eyebrow">from</span>
                    <span class="radical-from-glyph${Array.isArray(card.from) ? ' radical-from-glyph-multi' : ''}">${
                      Array.isArray(card.from)
                        ? card.from.map((f, i) => `${i > 0 ? '<span class="radical-from-sep">+</span>' : ''}<span>${escHTML(f)}</span>`).join('')
                        : escHTML(card.from)
                    }</span>
                  </div>
                ` : ''}
              </div>
              <div class="radical-title">
                <span class="ja">${escHTML(card.titleJa)}</span>
                <span class="en">${escHTML(card.titleEn)}</span>
              </div>
              <div class="radical-desc">
                ${APP.flashShowEn ? `<p class="en">${escHTML(card.descEn)}</p>` : ''}
                <p class="ja">${escHTML(card.descJa)}</p>
              </div>
              <div class="radical-grid${(card.examples || []).length >= 6 ? ' radical-grid-6' : ''}${card.examplesAsImageCards ? ' radical-grid-img' : ''}">
                ${(card.examples || []).map((ex, i) => card.examplesAsImageCards ? `
                  <div class="radical-ex radical-ex-img">
                    <div class="radical-ex-image">
                      <image-slot id="rex-${escAttr(card.id)}-${i}"
                                  image-key="kanji/${escAttr(ex.kanji)}"
                                  shape="rounded" radius="6" fit="contain" position="50% 50%" readonly
                                  placeholder=""></image-slot>
                    </div>
                    <div class="rex-kanji">${escHTML(ex.kanji)}</div>
                    <div class="rex-reading">
                      ${ex.kun ? `<span class="kun">${escHTML(ex.kun)}</span>` : ''}
                      ${ex.kun && ex.on ? `<span class="dot">·</span>` : ''}
                      ${ex.on ? `<span class="on">${escHTML(ex.on)}</span>` : ''}
                    </div>
                    <div class="rex-en">${APP.flashShowEn ? escHTML(ex.en) : '— —'}</div>
                  </div>
                ` : `
                  <div class="radical-ex">
                    <div class="rex-kanji">${escHTML(ex.kanji)}</div>
                    <div class="rex-reading">
                      ${ex.kun ? `<span class="kun">${escHTML(ex.kun)}</span>` : ''}
                      ${ex.kun && ex.on ? `<span class="dot">·</span>` : ''}
                      ${ex.on ? `<span class="on">${escHTML(ex.on)}</span>` : ''}
                    </div>
                    <div class="rex-en">${APP.flashShowEn ? escHTML(ex.en) : '— —'}</div>
                  </div>
                `).join('')}
              </div>
              ${card.cta ? `
                <!-- CTA: navigates to another section of the app (typically
                     a vocab class+book+page) so the radical card can hand
                     the learner off to a fuller explainer. Click handler
                     is wired below this innerHTML block. -->
                <button class="radical-cta"
                        data-radical-cta="1"
                        data-cta-section="${escAttr(card.cta.target.section || '')}"
                        data-cta-vocab-class="${escAttr(card.cta.target.vocabClassId || '')}"
                        data-cta-vocab-book="${escAttr(card.cta.target.vocabBookId || '')}"
                        data-cta-vocab-page="${escAttr(card.cta.target.vocabPageId || '')}">
                  ${APP.flashShowEn && card.cta.labelEn ? `<span class="radical-cta-en">${escHTML(card.cta.labelEn)}</span>` : ''}
                  <span class="radical-cta-ja">${escHTML(card.cta.labelJa || card.cta.labelEn || '')}</span>
                </button>
              ` : ''}
              <div class="testcard-footer radical-footer">
                <div class="testcard-footer-meta">
                  ${card.strokes ? `<span class="testcard-strokes">${card.strokes}画</span>` : ''}
                </div>
                <!-- Radical cards don't carry a flip face yet (no
                     stroke-order GIF or composition to show — the
                     radical IS the decomposition). Keep an empty middle
                     slot so the 3-column grid stays aligned with the
                     editorial card's footer. -->
                <div class="testcard-footer-flip"></div>
                <div class="testcard-footer-nav">
                  <button class="testcard-nav-btn" data-testcard-nav="prev" aria-label="previous card">
                    <span class="testcard-nav-furi">まえ</span>
                    <span class="testcard-nav-label"><span class="testcard-nav-arrow">←</span> 前</span>
                  </button>
                  <button class="testcard-nav-btn is-primary" data-testcard-nav="next" aria-label="next card">
                    <span class="testcard-nav-furi">つぎ</span>
                    <span class="testcard-nav-label">次 <span class="testcard-nav-arrow">→</span></span>
                  </button>
                </div>
              </div>
            </div>
            ` : editorialFlashcardHTML(card, cls, related, seeAlso)}
          </div>
        </div>
        <button class="icon-btn flash-nav" id="flash-next" title="next (→)" aria-label="next card">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        </button>
      </div>

      <div class="flash-rail-inner">
        <div class="flash-label-vert">単語札</div>
        <div class="flash-progress-vert" aria-hidden="true">
          <div style="height:${pct}%"></div>
        </div>
      </div>

      <div class="flash-rail-right">
        <div class="flash-toggle-vert">
          <button class="pill-sq ${APP.flashShowEn ? 'active' : ''}" data-flash-en="true" title="Show English">英</button>
          <button class="pill-sq ${!APP.flashShowEn ? 'active' : ''}" data-flash-en="false" title="Hide English">—</button>
        </div>
      </div>
    </div>`;

  container.querySelectorAll('[data-flash-class]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.flashClass === APP.flashClassId) return;
      APP.flashClassId = btn.dataset.flashClass;
      APP.flashIdx = 0;
      APP.flashFlipped = false;
      lsSet('jp:flashClass', APP.flashClassId);
      if (typeof applyContextBg === 'function') applyContextBg();
      renderFlashcards(container);
    });
  });
  // View toggle — list vs card.
  container.querySelectorAll('[data-flash-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.flashView = btn.dataset.flashView;
      lsSet('jp:flashView', APP.flashView);
      renderFlashcards(container);
    });
  });
  // Background picker (card view) — same handler as the list-view one.
  container.querySelectorAll('[data-flash-bg]').forEach(sel => {
    sel.addEventListener('change', () => {
      APP.flashBgPref = sel.value || 'random';
      lsSet('jp:flashBgPref', APP.flashBgPref);
      if (typeof applyContextBg === 'function') applyContextBg();
    });
  });
  // Generic font-dropdown wiring — handles the two editorial-card
  // dropdowns (glyph + cardText), the kana page dropdown, and the
  // settings modal dropdowns. The handler is installed once at the
  // document level; each invocation routes to the right APP state slot
  // via FONT_DROPDOWN_TARGETS.
  initFontDropdownHandlers((target, fontId) => {
    const cfg = FONT_DROPDOWN_TARGETS[target];
    if (!cfg) return;
    APP[cfg.state] = fontId;
    lsSet(cfg.ls, fontId);
    if (typeof applyBodyClasses === 'function') applyBodyClasses();
    // Re-render the surface that owns the changed dropdown.
    if (target === 'glyph' || target === 'cardText' ||
        target === 'listGlyph' || target === 'listText') {
      renderFlashcards(container);
    } else if (target === 'kana') {
      renderWritingKana(container);
    }
    // Settings dropdowns (fontTitle / fontMenu1 / fontMenu2 / uiFont)
    // trigger applyBodyClasses above; the modal re-renders itself.
  });
  // Related-kanji chips: jump to the peer card in its class. Skip the
  // composition chips on the back face — those have their own dedicated
  // handler installed below (which sits inside a different node tree).
  container.querySelectorAll('[data-flash-jump]:not(.testcard-compose-chip)').forEach(btn => {
    btn.addEventListener('click', () => {
      const [classId, id] = btn.dataset.flashJump.split(':');
      const cls = (window.FLASHCARD_CLASSES || []).find(c => c.id === classId);
      if (!cls) return;
      APP.flashClassId = classId;
      APP.flashIdx = Math.max(0, cls.cards.findIndex(c => c.id === id));
      APP.flashFlipped = false;
      lsSet('jp:flashClass', APP.flashClassId);
      renderFlashcards(container);
    });
  });
  container.querySelectorAll('[data-flash-en]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.flashShowEn = btn.dataset.flashEn === 'true';
      renderFlashcards(container);
    });
  });
  // Helper: any nav action resets the flip state so the fresh card
  // always shows its front face. The learner explicitly opted into
  // turning the prior card over — but that intent doesn't carry across
  // to the next card.
  const navTo = (idx) => {
    // Modulo over (deck.length + 1) so the wrap-up screen at position
    // deck.length is reachable. From the last card, next → wrap-up.
    // From wrap-up, next → card 0. From card 0, prev → wrap-up.
    const N = deck.length + 1;
    APP.flashIdx = ((idx % N) + N) % N;
    APP.flashFlipped = false;
    renderFlashcards(container);
  };
  container.querySelector('#flash-prev').addEventListener('click', () => navTo(APP.flashIdx - 1));
  container.querySelector('#flash-next').addEventListener('click', () => navTo(APP.flashIdx + 1));
  // Editorial-view in-card nav buttons (前 / 次 with まえ/つぎ furigana)
  // Same behavior as the side arrows — just rendered inside the card.
  container.querySelectorAll('[data-testcard-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      navTo(APP.flashIdx + (btn.dataset.testcardNav === 'next' ? 1 : -1));
    });
  });
  // Radical-card CTA — hands the learner off to a fuller explainer in
  // another section (typically vocab → jougo → intro → jougo-explainer).
  // Reads section/class/book/page from data attributes; persists each
  // choice to localStorage so the navigation survives a reload.
  container.querySelectorAll('[data-radical-cta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSection = btn.dataset.ctaSection || 'vocab';
      const cls  = btn.dataset.ctaVocabClass;
      const book = btn.dataset.ctaVocabBook;
      const pageId = btn.dataset.ctaVocabPage;
      if (targetSection === 'vocab' && cls) {
        APP.vocabClassId = cls;
        lsSet('jp:vocabClass', cls);
        if (book) {
          APP.vocabBookId = book;
          lsSet('jp:vocabBook', book);
        }
        // Resolve pageId → pageIdx so deep-linking to a specific page
        // works even when the book has multiple pages.
        if (pageId) {
          const targetCls = (window.VOCAB_CLASSES || []).find(c => c.id === cls);
          const targetBook = targetCls && targetCls.books.find(b => b.id === book);
          const idx = targetBook && (targetBook.pages || []).findIndex(p => p.id === pageId);
          if (typeof idx === 'number' && idx >= 0) APP.vocabPageIdx = idx;
        }
      }
      setSection(targetSection);
    });
  });
  // Flip button — toggles APP.flashFlipped. The button rerenders the
  // card with the new state on `data-flipped`, the CSS animation runs.
  container.querySelectorAll('[data-testcard-flip]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.flashFlipped = !APP.flashFlipped;
      renderFlashcards(container);
    });
  });
  // Composition chips on the back face — clicking a linkable chip
  // jumps to that radical's card (if it exists in our deck). The chip
  // carries data-flash-jump="classId:cardId" pre-encoded.
  container.querySelectorAll('.testcard-compose-chip.is-linkable[data-flash-jump]').forEach(chip => {
    chip.addEventListener('click', () => {
      const [classId, id] = (chip.dataset.flashJump || '').split(':');
      if (!classId || !id) return;
      const targetCls = (window.FLASHCARD_CLASSES || []).find(c => c.id === classId);
      if (!targetCls) return;
      const targetIdx = targetCls.cards.findIndex(c => c.id === id);
      if (targetIdx < 0) return;
      APP.flashClassId = classId;
      APP.flashIdx = targetIdx;
      APP.flashFlipped = false;
      lsSet('jp:flashClass', APP.flashClassId);
      renderFlashcards(container);
    });
  });
  // Wrap-up tile flip — each tile shows the kanji glyph + kun/on
  // readings by default (data-flip="0") and flips to the image face
  // (data-flip="1") on click. State is held on the data-flip attribute
  // so a re-render of the wrap-up screen resets every tile cleanly.
  // CSS handles the crossfade via opacity rules on the two
  // .wrapup-tile-face children.
  container.querySelectorAll('[data-wrapup-tile]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.dataset.flip = btn.dataset.flip === '1' ? '0' : '1';
    });
  });
  // Bulk-flip buttons (絵 / 字 at the left of the wrap-up footer) —
  // set every tile's data-flip in one shot. 'image' → 1 (all images);
  // 'readings' → 0 (all glyph+readings, the default state).
  container.querySelectorAll('[data-wrapup-flip-all]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.wrapupFlipAll === 'image' ? '1' : '0';
      container.querySelectorAll('[data-wrapup-tile]').forEach(tile => {
        tile.dataset.flip = target;
      });
    });
  });

  // Arrows are flex-children of .flash-center (align-items:center),
  // pinned at the same vertical position as the page title. Pure CSS, no JS.

  // ── Fit long kanji/kana text to card width without line-breaking ──
  requestAnimationFrame(() => {
    const el = container.querySelector('.flash-kanji');
    if (!el) return;
    // Reset to CSS default so we measure the natural size
    el.style.fontSize = '';
    const maxW = el.parentElement.clientWidth - 48; // 24px padding each side
    if (el.scrollWidth > maxW && maxW > 0) {
      const scale = maxW / el.scrollWidth;
      const base = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = Math.floor(base * scale) + 'px';
    }
  });

  APP._flashKeyHandler = e => {
    // Keyboard arrows cycle the SAME deck.length + 1 positions as
    // navTo (cards 0..deck-1 plus the wrap-up at deck.length).
    const N = deck.length + 1;
    if (e.key === 'ArrowLeft')  { APP.flashIdx = (APP.flashIdx - 1 + N) % N; APP.flashFlipped = false; renderFlashcards(container); }
    if (e.key === 'ArrowRight') { APP.flashIdx = (APP.flashIdx + 1) % N;     APP.flashFlipped = false; renderFlashcards(container); }
    if (e.key === ' ')          { e.preventDefault(); APP.flashShowEn = !APP.flashShowEn; renderFlashcards(container); }
    // 'f' flips the card — quick keyboard access for power users so
    // they can study without reaching for the mouse. Doesn't fire if
    // an input/textarea has focus (we'd hijack typing). Inert on the
    // wrap-up (which has no flippable card).
    if (e.key === 'f' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
      APP.flashFlipped = !APP.flashFlipped;
      renderFlashcards(container);
    }
  };
  window.addEventListener('keydown', APP._flashKeyHandler);

  // ── Preload adjacent card images so arrow navigation feels instant ──
  const preloadIdxs = [
    (APP.flashIdx + 1) % deck.length,
    (APP.flashIdx - 1 + deck.length) % deck.length,
    (APP.flashIdx + 2) % deck.length,
  ];
  for (const i of preloadIdxs) {
    const c = deck[i];
    if (!c || !c.kanji) continue;
    const folder = c.imageFolder || cls.imageFolder || 'kanji';
    const encoded = encodeURIComponent(c.kanji);
    const img = new Image();
    img.src = './images/' + folder + '/' + encoded + '.webp';
  }

  // Keep the flash category sidebar in sync
  renderFlashSidebar();
}

// ── Dictionary ───────────────────────────────────────────────────────────
// Query-dependent slice of the dictionary — recomputed on each keystroke.
function dictFilter() {
  const norm = s => (s || '').toLowerCase().normalize('NFC');
  const query = norm(APP.dictQ);
  const filtered = (window.DICTIONARY || []).filter(e => {
    if (APP.dictKind  !== 'all' && e.kind  !== APP.dictKind)  return false;
    if (APP.dictLevel !== 'all' && e.level !== APP.dictLevel) return false;
    if (APP.dictTag   !== 'all' && !(e.tags||[]).includes(APP.dictTag)) return false;
    if (!query) return true;
    return (e.kanji||'').includes(APP.dictQ) || norm(e.kana).includes(query) || norm(e.en).includes(query);
  });
  return { filtered, kanjiHits: filtered.filter(e => e.kind === 'kanji'), wordHits: filtered.filter(e => e.kind === 'word') };
}

function dictClearBtnHTML() {
  return `<button class="icon-btn" id="dict-clear" title="clear">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
}

// Results-only markup (empty-state + Kanji/Words groups). Shared by the full
// render and the targeted keystroke update so the two can't drift.
function dictResultsHTML(kanjiHits, wordHits, filtered) {
  const groupHTML = (label, entries) => entries.length === 0 ? '' : `
    <section style="margin-bottom:36px">
      <div style="font-family:var(--serif);font-style:italic;font-size:13px;color:var(--ink-3);
                  letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;padding-bottom:6px;
                  border-bottom:1px dashed rgba(141,102,48,.25)">${escHTML(label)} · ${entries.length}</div>
      <div class="dict-list">
        ${entries.map(e => `
          <div class="dict-row">
            <div class="kanji-cell">
              <div class="furigana">${escHTML(e.kana)}</div>
              <div class="kanji">${escHTML(e.kanji)}</div>
            </div>
            <div class="en">${escHTML(e.en)}</div>
            <div class="meta"><span class="level level-${escAttr(e.level || 'NA')}">${escHTML(e.level)}</span></div>
            <div class="meta" style="min-width:80px">${escHTML((e.tags||[]).slice(0,2).join(' · '))}</div>
          </div>`).join('')}
      </div>
    </section>`;
  return `${filtered.length === 0 ? '<div class="empty-state">nothing matches yet — try clearing some filters</div>' : ''}
    ${groupHTML('Kanji', kanjiHits)}
    ${groupHTML('Words', wordHits)}`;
}

// Targeted keystroke update: refresh ONLY the results + entry count + clear
// button, leaving the page head, the search input (so focus/caret survive), and
// the filter pills untouched. The old path rebuilt the whole page innerHTML on
// every debounced keystroke — recreating the input and every filter pill each
// time. Result sections are the last children (after .filters), so they swap in
// place with no wrapper element (keeps the DOM structure identical).
function updateDictionaryResults(container) {
  const { filtered, kanjiHits, wordHits } = dictFilter();
  const count = container.querySelector('#dict-count');
  if (count) count.textContent = `${filtered.length} entries`;
  container.querySelectorAll(':scope > section, :scope > .empty-state').forEach(el => el.remove());
  container.insertAdjacentHTML('beforeend', dictResultsHTML(kanjiHits, wordHits, filtered));
  // Clear button appears/disappears only at the empty↔non-empty boundary.
  const input = container.querySelector('#dict-input');
  const clearBtn = container.querySelector('#dict-clear');
  if (APP.dictQ && !clearBtn && input) {
    input.insertAdjacentHTML('afterend', dictClearBtnHTML());
    const btn = container.querySelector('#dict-clear');
    if (btn) btn.addEventListener('click', () => { APP.dictQ = ''; renderDictionary(container); });
  } else if (!APP.dictQ && clearBtn) {
    clearBtn.remove();
  }
}

function renderDictionary(container) {
  if (APP.pendingDictQ) {
    APP.dictQ = APP.pendingDictQ;
    APP.dictKind = 'all'; APP.dictLevel = 'all'; APP.dictTag = 'all';
    APP.pendingDictQ = null;
  }

  const allTags = Idx.dictTags(); // memoized (was rebuilt via flatMap+Set+sort each keystroke)
  const { filtered, kanjiHits, wordHits } = dictFilter();

  const pill = (val, cur, key) =>
    `<button class="pill ${val === APP[key] ? 'active' : ''}" data-filter-key="${key}" data-filter-val="${escAttr(val)}">${escHTML(val === 'all' ? (key === 'dictTag' ? 'any' : 'all') : val)}</button>`;

  const clearBtnHTML = APP.dictQ ? dictClearBtnHTML() : '';

  container.innerHTML = `
    <div class="page-head">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <div class="page-eyebrow">dictionary · 辞書</div>
          <h1 class="page-title-jp">さがす</h1>
          <div class="page-title-en">Browse and search — kanji, words, and what they mean</div>
        </div>
        <div class="small-label" id="dict-count">${filtered.length} entries</div>
      </div>
      <div class="rule"></div>
    </div>

    <div class="search-bar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="dict-input" value="${escAttr(APP.dictQ)}" placeholder="kanji, kana, or english… (e.g. 風, kaze, mirror)" />
      ${clearBtnHTML}
    </div>

    <div class="filters">
      <span class="small-label">kind:</span>
      ${['all','kanji','word'].map(v => pill(v, APP.dictKind, 'dictKind')).join('')}
      <span class="floating-controls" style="margin:0"><span class="sep"></span></span>
      <span class="small-label">level:</span>
      ${['all',...(window.JLPT_LEVELS||['N5','N4','N3','N2','N1'])].map(v => pill(v, APP.dictLevel, 'dictLevel')).join('')}
      <span class="floating-controls" style="margin:0"><span class="sep"></span></span>
      <span class="small-label">tag:</span>
      ${['all',...allTags].map(v => pill(v, APP.dictTag, 'dictTag')).join('')}
    </div>

    ${dictResultsHTML(kanjiHits, wordHits, filtered)}`;

  const input = container.querySelector('#dict-input');
  let debTimer;
  input.addEventListener('input', () => {
    clearTimeout(debTimer);
    debTimer = setTimeout(() => {
      APP.dictQ = input.value;
      // Targeted results update instead of a full renderDictionary — the input
      // is never recreated, so focus survives naturally. Caret is restored to
      // the end to preserve the previous (full-rebuild) behavior exactly.
      updateDictionaryResults(container);
      input.setSelectionRange(input.value.length, input.value.length);
    }, 120);
  });
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  const clearBtn2 = container.querySelector('#dict-clear');
  if (clearBtn2) clearBtn2.addEventListener('click', () => { APP.dictQ = ''; renderDictionary(container); });

  container.querySelectorAll('[data-filter-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      APP[btn.dataset.filterKey] = btn.dataset.filterVal;
      renderDictionary(container);
    });
  });
}

// ── Hash change ──────────────────────────────────────────────────────────
window.addEventListener('hashchange', () => {
  const s = hashSection();
  if (s !== APP.section) { APP.section = s; const cl = document.querySelector('.app').classList; cl.toggle('show-vocab-sidebar', s === 'vocab'); cl.toggle('show-flash-sidebar', s === 'flashcards'); cl.toggle('show-writing-sidebar', s === 'writing'); cl.toggle('show-particles-sidebar', shouldShowParticlesSidebar()); /* updateSidebar() FIRST so the tier-1 brush enters the render-cycle queue before any tier-2/3 brushes from renderMain — order in the queue determines cascade order. */ updateSidebar(); renderMain(); }
});

// ── Jougo example modal ─────────────────────────────────────────────────
// Each illustrated tile on the jougo intro page (vocab → jougo → intro)
// carries data-ex-jp / data-ex-en plus its glyph/reading/gloss as DOM
// children. Clicking the tile (or Enter / Space when focused) opens a
// native <dialog> built lazily on first use. The dialog shows: larger
// image, glyph, kana reading, English gloss, and one example sentence
// (JP big serif + EN italic). Closes via the × button, backdrop click,
// or Escape (native dialog behavior).
let _jougoModal = null;
function ensureJougoModal() {
  if (_jougoModal) return _jougoModal;
  const dlg = document.createElement('dialog');
  dlg.className = 'jougo-modal';
  dlg.innerHTML = `
    <div class="jougo-modal-card">
      <button class="jougo-modal-close" aria-label="close (Esc)">×</button>
      <div class="jougo-modal-image-wrap">
        <img class="jougo-modal-image" alt="">
      </div>
      <div class="jougo-modal-body">
        <div class="jougo-modal-glyph"></div>
        <div class="jougo-modal-reading"></div>
        <div class="jougo-modal-en"></div>
        <div class="jougo-modal-example">
          <span class="jougo-modal-example-eyebrow">example</span>
          <div class="jougo-modal-example-jp-row">
            <p class="jp"></p>
            <button class="tts-btn jougo-modal-tts" type="button"
                    aria-label="読み上げ (speak)" title="読み上げ"
                    data-speak="">
              ${speakerIconSVG()}
            </button>
          </div>
          <p class="en"></p>
        </div>
      </div>
    </div>`;
  document.body.appendChild(dlg);
  // Close button
  dlg.querySelector('.jougo-modal-close').addEventListener('click', () => dlg.close());
  // Backdrop click — close when the click lands on the dialog element
  // ITSELF (not on the card or anything inside it). Native <dialog>
  // reports backdrop clicks with e.target === dlg, so the identity check
  // alone is enough to distinguish backdrop from card. We DON'T stop
  // propagation on the card — clicks inside must reach the document-level
  // [data-speak] delegate so the TTS speaker button works.
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
  _jougoModal = dlg;
  return dlg;
}
function openJougoModal(tile) {
  const dlg = ensureJougoModal();
  const img    = tile.querySelector('.jougo-tile-img');
  const glyph  = (tile.querySelector('.jougo-tile-glyph')   || {}).textContent || '';
  const read   = (tile.querySelector('.jougo-tile-reading') || {}).textContent || '';
  const en     = (tile.querySelector('.jougo-tile-en')      || {}).textContent || '';
  const exJp   = tile.dataset.exJp || '';
  const exEn   = tile.dataset.exEn || '';
  const modalImg = dlg.querySelector('.jougo-modal-image');
  const imageWrap = dlg.querySelector('.jougo-modal-image-wrap');
  // Image-less tiles (placeholder variant on the overview page) shouldn't
  // open the modal with a stale image from a previous open — hide the
  // image well entirely so the modal becomes glyph + reading + example
  // only, which reads as a deliberate "this word has no illustration
  // yet" state instead of leaking the previous viewer's tile.
  if (img && img.src) {
    modalImg.src = img.src;
    modalImg.alt = en || glyph;
    if (imageWrap) imageWrap.style.display = '';
  } else {
    modalImg.removeAttribute('src');
    modalImg.alt = '';
    if (imageWrap) imageWrap.style.display = 'none';
  }
  dlg.querySelector('.jougo-modal-glyph').textContent   = glyph;
  dlg.querySelector('.jougo-modal-reading').textContent = read;
  dlg.querySelector('.jougo-modal-en').textContent      = en;
  // Hide the entire example section when no JP sentence is present
  // (placeholder gallery tiles whose word isn't covered in Zone C).
  // Showing "EXAMPLE" with two empty lines would read as broken; the
  // cleaner move is to render the modal as glyph + gloss only.
  const example = dlg.querySelector('.jougo-modal-example');
  if (example) {
    if (exJp) {
      example.style.display = '';
      example.querySelector('.jp').textContent = exJp;
      example.querySelector('.en').textContent = exEn;
    } else {
      example.style.display = 'none';
      example.querySelector('.jp').textContent = '';
      example.querySelector('.en').textContent = '';
    }
  }
  // TTS button — speaks the JP example. The global [data-speak] click
  // delegate (above) handles playback; we keep the attribute fresh each
  // open so the button always carries the current sentence. Hidden when
  // there's no JP example.
  const ttsBtn = dlg.querySelector('.jougo-modal-tts');
  if (ttsBtn) {
    if (exJp) {
      ttsBtn.dataset.speak = exJp;
      ttsBtn.style.display = '';
    } else {
      ttsBtn.dataset.speak = '';
      ttsBtn.style.display = 'none';
    }
  }
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
}
// Document-level delegate — works regardless of when the explainer body
// gets injected, since vocab/jougo/intro is rendered into the main panel
// via innerHTML without a per-render attach step.
document.addEventListener('click', (e) => {
  const tile = e.target.closest('[data-jougo-modal]');
  if (!tile) return;
  openJougoModal(tile);
});
// Keyboard activation for accessibility — Enter or Space opens the modal
// when a tile is focused via Tab.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const tile = e.target.closest && e.target.closest('[data-jougo-modal]');
  if (!tile) return;
  e.preventDefault();
  openJougoModal(tile);
});

// ════════════════════════════════════════════════════════════════════════
// ── SPEAKING SUB-SYSTEM ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════
// New main-nav category sitting between Vocabulary (receptive) and Search
// (lookup). The Speaking section's verb is PRODUCE — the learner imitates,
// records, gets scored. Spec: docs/superpowers/specs/2026-05-28-speaking.
// {PRODUCT,DESIGN}.md.
//
// State model: APP.speakingCategoryId + APP.speakingPhraseId. Mic audio
// lives in APP.speakingUserBuffer (AudioBuffer, RAM-only, dies on phrase
// change). Scores live in APP.speakingScores (object | null).
//
// Pitch data: each phrase carries `chunks[]` where each chunk is { mora,
// pitch } — `mora` is an array of strings each representing exactly ONE
// mora (so じょ counts as one entry, not two), and `pitch` is a parallel
// array of 'H' / 'L' marks. The OJAD-style contour line is computed from
// these arrays at render time.

window.SPEAKING_CATEGORIES = [
  {
    id: 'greetings',
    kana: 'あいさつ',
    kanji: '挨拶',
    en: 'Greetings',
    glyph: '挨',
    description: 'The first words of any exchange — hello, good morning, and how to introduce yourself.',
    phrases: [
      {
        id: 'konnichiwa',
        chunks: [
          { mora: ['こ','ん','に','ち','は'], pitch: ['L','H','H','H','H'] },
        ],
        kanji: 'こんにちは',
        romaji: 'konnichiwa',
        en: 'Hello / Good afternoon.',
        pattern: 'heiban',
        accent: 0,
        notes: 'The all-purpose daytime hello. The final は is written ha but said “wa” — a leftover topic particle. Stays high and even.',
      },
      {
        id: 'ohayou',
        chunks: [
          { mora: ['お','は','よ','う'], pitch: ['L','H','H','H'] },
          { mora: ['ご','ざ','い','ま','す'], pitch: ['L','H','H','H','L'] },
        ],
        kanji: 'おはよう ございます',
        romaji: 'ohayou gozaimasu',
        en: 'Good morning. (polite)',
        pattern: 'nakadaka',
        accent: 4,
        notes: 'The polite morning greeting. Drop ございます for a casual おはよう with friends and family.',
      },
      {
        id: 'konbanwa',
        chunks: [
          { mora: ['こ','ん','ば','ん','は'], pitch: ['L','H','H','H','H'] },
        ],
        kanji: 'こんばんは',
        romaji: 'konbanwa',
        en: 'Good evening.',
        pattern: 'heiban',
        accent: 0,
        notes: 'The evening counterpart to こんにちは. Again the final は is said “wa.”',
      },
      {
        id: 'hajimemashite',
        chunks: [
          { mora: ['は','じ','め','ま','し','て'], pitch: ['L','H','H','H','L','L'] },
        ],
        kanji: 'はじめまして',
        romaji: 'hajimemashite',
        en: 'Nice to meet you. (first time)',
        pattern: 'nakadaka',
        accent: 4,
        notes: 'Said at a first meeting, before you give your name — literally “for the first time.” Usually paired with a bow.',
      },
      {
        id: 'ore-kenshin',
        chunks: [
          { mora: ['お','れ','は'], pitch: ['L','H','H'] },
          { mora: ['ケ','ン','シ','ン','で','す'], pitch: ['L','H','H','H','H','H'] },
        ],
        kanji: 'おれは ケンシンです',
        romaji: 'ore wa Kenshin desu',
        en: 'I am Kenshin.',
        pattern: 'heiban',
        accent: 0,
        notes: 'おれ is a rough, masculine “I” — fitting for a wandering swordsman. Names are written in katakana: ケンシン. The name + です stays high (heiban). Swap in your own name.',
      },
      {
        id: 'kaoru-iimasu',
        chunks: [
          { mora: ['カ','オ','ル','と'], pitch: ['L','H','H','H'] },
          { mora: ['い','い','ま','す'], pitch: ['L','H','H','L'] },
        ],
        kanji: 'カオルと いいます',
        romaji: 'Kaoru to iimasu',
        en: 'My name is Kaoru.',
        pattern: 'heiban',
        accent: 0,
        notes: 'A softer, polite way to give your name than 〜です. と marks the name being quoted; カオル is katakana. Use your own name in place of カオル.',
      },
      {
        id: 'yoroshiku',
        chunks: [
          { mora: ['よ','ろ','し','く'], pitch: ['L','H','H','H'] },
          { mora: ['お','ね','が','い','し','ま','す'], pitch: ['L','H','H','H','L','L','L'] },
        ],
        kanji: 'よろしく おねがいします',
        romaji: 'yoroshiku onegai shimasu',
        en: 'Please be kind to me.',
        pattern: 'nakadaka',
        accent: 4,
        notes: 'The phrase that closes almost every introduction — roughly “please treat me well.” There’s no clean English equivalent; the bow carries the rest.',
      },
    ],
  },
  {
    id: 'food',
    kana: 'たべもの',
    kanji: '食べ物',
    en: 'Food & Meals',
    glyph: '食',
    portrait: 'food',
    description: 'Greetings and exchanges at the table — what you say before, during, and after a meal.',
    phrases: [
      {
        id: 'itadakimasu',
        chunks: [
          { mora: ['い','た','だ','き','ま','す'], pitch: ['L','H','H','H','L','L'] },
        ],
        kanji: '頂きます',
        romaji: 'itadakimasu',
        en: 'I humbly receive (said before eating).',
        pattern: 'nakadaka',
        accent: 4,
        notes: 'A formula spoken before every meal — a thanks to everyone who made the food possible. Pitch falls after the 4th mora (き → ま).',
      },
      {
        id: 'oishii-desu',
        chunks: [
          { mora: ['お','い','し','い'], pitch: ['L','H','L','L'] },
          { mora: ['で','す'], pitch: ['L','L'] },
        ],
        kanji: '美味しいです',
        romaji: 'oishii desu',
        en: 'It is delicious.',
        pattern: 'atamadaka',
        accent: 2,
        notes: 'おいしい drops sharply after the second mora — the い (high) → し (low) is the diagnostic. です is unaccented and follows the previous low.',
      },
      {
        id: 'gochisousama',
        chunks: [
          { mora: ['ご','ち','そ','う','さ','ま','で','し','た'], pitch: ['L','H','H','H','H','H','H','H','H'] },
        ],
        kanji: 'ご馳走様でした',
        romaji: 'gochisousama deshita',
        en: 'Thank you for the feast (said after eating).',
        pattern: 'heiban',
        accent: 0,
        notes: 'The closing counterpart to いただきます — said as you put down your chopsticks. Heiban — stays high all the way through, no fall.',
      },
      {
        id: 'sushi-onegai',
        chunks: [
          { mora: ['お','す','し','を'], pitch: ['L','H','L','L'] },
          { mora: ['お','ね','が','い','し','ま','す'], pitch: ['L','H','H','H','L','L','L'] },
        ],
        kanji: 'お寿司を お願いします',
        romaji: 'osushi o onegai shimasu',
        en: 'Sushi, please.',
        pattern: 'nakadaka',
        accent: 4,
        notes: 'A polite ordering pattern: noun + を + おねがいします. The pitch drops after the 4th mora of おねがいします (い → し).',
      },
      {
        id: 'mizu-kudasai',
        chunks: [
          { mora: ['お','み','ず'], pitch: ['L','H','L'] },
          { mora: ['を'], pitch: ['L'] },
          { mora: ['く','だ','さ','い'], pitch: ['L','H','H','L'] },
        ],
        kanji: 'お水を ください',
        romaji: 'omizu o kudasai',
        en: 'Water, please.',
        pattern: 'nakadaka',
        accent: 3,
        notes: 'おみず is [2] (drop after み). ください is [3]: rises on だ, stays high on さ, falls on い.',
      },
      {
        id: 'kanjou-onegai',
        chunks: [
          { mora: ['お','か','ん','じょ','う'], pitch: ['L','H','H','H','H'] },
          { mora: ['お','ね','が','い','し','ま','す'], pitch: ['L','H','H','H','L','L','L'] },
        ],
        kanji: 'お勘定 お願いします',
        romaji: 'okanjou onegai shimasu',
        en: 'The bill, please.',
        pattern: 'heiban',
        accent: 0,
        notes: 'おかんじょう (the bill / check) stays high all the way through — heiban. The small ょ in じょ counts as part of じ, not its own mora.',
      },
      {
        id: 'sumimasen',
        chunks: [
          { mora: ['す','み','ま','せ','ん'], pitch: ['L','H','H','H','L'] },
        ],
        kanji: 'すみません',
        romaji: 'sumimasen',
        en: 'Excuse me / sorry (used to get a server\'s attention).',
        pattern: 'nakadaka',
        accent: 4,
        notes: 'Drops after the 4th mora. Universal apology + attention-getter — your most-used Japanese word.',
      },
      {
        id: 'menyu-onegai',
        chunks: [
          { mora: ['メ','ニュ','ー'], pitch: ['H','L','L'] },
          { mora: ['を'], pitch: ['L'] },
          { mora: ['お','ね','が','い','し','ま','す'], pitch: ['L','H','H','H','L','L','L'] },
        ],
        kanji: 'メニューを お願いします',
        romaji: 'menyu o onegai shimasu',
        en: 'A menu, please.',
        pattern: 'atamadaka',
        accent: 1,
        notes: 'メニュー is atamadaka [1] — the first mora メ is HIGH, the rest fall. ニュ is one mora (the ュ attaches to ニ). The long mark ー counts as its own mora.',
      },
      {
        id: 'kore-kudasai',
        chunks: [
          { mora: ['こ','れ','を'], pitch: ['L','H','H'] },
          { mora: ['く','だ','さ','い'], pitch: ['L','H','H','L'] },
        ],
        kanji: 'これを ください',
        romaji: 'kore o kudasai',
        en: 'This one, please.',
        pattern: 'nakadaka',
        accent: 3,
        notes: 'これ is heiban — こ rises to れ and を stays high, no drop. ください is [3]: up on だ, level on さ, then falls on the final い. The point-and-order staple when you don\'t know a dish\'s name.',
      },
      {
        id: 'osusume-nandesu',
        chunks: [
          { mora: ['お','す','す','め','は'], pitch: ['L','H','H','H','H'] },
          { mora: ['な','ん','で','す','か'], pitch: ['H','L','L','L','L'] },
        ],
        kanji: 'おすすめは 何ですか',
        romaji: 'osusume wa nan desu ka',
        en: 'What do you recommend?',
        pattern: 'atamadaka',
        accent: 1,
        notes: 'おすすめ stays high all the way through (heiban), and は keeps that high. The question word なん is [1] — high on な, dropping on ん; ですか trails low. In speech か lifts again as a question rise, separate from the lexical accent.',
      },
      {
        id: 'kore-nani',
        chunks: [
          { mora: ['こ','れ','は'], pitch: ['L','H','H'] },
          { mora: ['な','ん','で','す','か'], pitch: ['H','L','L','L','L'] },
        ],
        kanji: 'これは 何ですか',
        romaji: 'kore wa nan desu ka',
        en: 'What is this?',
        pattern: 'atamadaka',
        accent: 1,
        notes: 'Point at an unfamiliar dish and ask. これは is heiban (こ→れ rises, は stays high); なん is [1] — high on な, drop on ん. The simplest N5 way to find out what something is.',
      },
      {
        id: 'kore-ikura',
        chunks: [
          { mora: ['こ','れ','は'], pitch: ['L','H','H'] },
          { mora: ['い','く','ら','で','す','か'], pitch: ['H','L','L','L','L','L'] },
        ],
        kanji: 'これは いくらですか',
        romaji: 'kore wa ikura desu ka',
        en: 'How much is this?',
        pattern: 'atamadaka',
        accent: 1,
        notes: 'The price question. いくら (how much) is [1] — high on い, then drops, and ですか trails low. Pair it with これは to ask the cost of a specific item.',
      },
      {
        id: 'okawari-kudasai',
        chunks: [
          { mora: ['お','か','わ','り'], pitch: ['L','H','L','L'] },
          { mora: ['く','だ','さ','い'], pitch: ['L','H','H','L'] },
        ],
        kanji: 'おかわり ください',
        romaji: 'okawari kudasai',
        en: 'Seconds, please. (a refill)',
        pattern: 'nakadaka',
        accent: 3,
        notes: 'おかわり is a second helping or refill — rice, tea, a drink. It is [2] (drop after か). ください is [3]. The cheerful opposite of もう けっこうです.',
      },
      {
        id: 'mou-kekkou',
        chunks: [
          { mora: ['も','う'], pitch: ['H','L'] },
          { mora: ['け','っ','こ','う'], pitch: ['L','H','H','L'] },
          { mora: ['で','す'], pitch: ['L','L'] },
        ],
        kanji: 'もう 結構です',
        romaji: 'mou kekkou desu',
        en: 'No thank you — I\'ve had enough.',
        pattern: 'nakadaka',
        accent: 3,
        notes: 'The polite way to decline more food, usually with a small hand-wave in front of the face. もう = "already / now"; けっこう (enough, fine) is [3] — falls on the final う. Softer and warmer than a flat "no".',
      },
      {
        id: 'kekkou-desu',
        chunks: [
          { mora: ['け','っ','こ','う'], pitch: ['L','H','H','L'] },
          { mora: ['で','す'], pitch: ['L','L'] },
        ],
        kanji: '結構です',
        romaji: 'kekkou desu',
        en: 'No, thank you.',
        pattern: 'nakadaka',
        accent: 3,
        notes: 'Use this when food (or anything) is offered and you want to decline — “I’m fine, thank you.” The small hand-wave makes it unmistakable. Without もう it refuses the offer itself, not just seconds.',
      },
    ],
  },
];

// Lookup helpers — keep callers compact.
function findSpeakingCategory(id) {
  return (window.SPEAKING_CATEGORIES || []).find(c => c.id === id);
}
function findSpeakingPhrase(catId, phraseId) {
  const cat = findSpeakingCategory(catId);
  if (!cat) return null;
  return (cat.phrases || []).find(p => p.id === phraseId);
}
function defaultSpeakingCategory() {
  return (window.SPEAKING_CATEGORIES || [])[0] || null;
}
function defaultSpeakingPhrase(cat) {
  return cat && cat.phrases && cat.phrases[0] || null;
}

// ── Pitch contour SVG ───────────────────────────────────────────────────
// Renders the pitch-accent contour above a chunk of mora glyphs. Two
// styles, chosen by APP.pitchNotation (set in settings → Display):
//
//   'lines' (default) — the OJAD / textbook STEP notation. A horizontal
//      bar sits at the HIGH level over high mora and the LOW level over
//      low mora, with vertical connectors at the transitions — a square
//      wave drawn above the kana. This is the notation every Japanese
//      textbook uses (and the Waseda reference the user shared).
//
//   'dots' — a connected-dot polyline through each mora's pitch point.
//
// The SVG uses a PROPORTIONAL viewBox (count × COL units wide) stretched
// to width:100% of the mora row via preserveAspectRatio="none". Because
// the row width = sum of equal-width mora glyphs, each contour column
// lines up with its mora glyph automatically — regardless of the glyph's
// pixel width. vector-effect="non-scaling-stroke" keeps the stroke a
// constant screen thickness despite the non-uniform viewBox stretch
// (without it, the horizontal stretch would fatten vertical strokes and
// thin horizontal ones). This decoupling is what lets us widen the mora
// kerning freely without the contour drifting out of alignment.
//
// `chunk` is { mora: [...strings], pitch: [...'H'|'L'] }. `tone` 'model'
// = plain ink; 'user' = the sage overlay for the recorded-pitch compare.
function renderPitchContourSVG(chunk, tone = 'model') {
  const pitch = chunk.pitch || [];
  const moraCount = (chunk.mora || []).length;
  if (!moraCount) return '';
  const COL = 100;          // relative viewBox units per mora column
  const VBH = 100;          // viewBox height
  // High mora sit ABOVE the glyph (overline), low mora BELOW it
  // (underline) — the textbook "line position = pitch" form, which reads
  // far more clearly than packing every line into a band above the kana.
  // The glyph is centred between the two levels; vertical connectors at
  // H↔L transitions fall in the gap between adjacent kana, not across a
  // glyph's strokes.
  const HIGH_Y = 12;        // overline — near the top, above the glyph
  const LOW_Y  = 88;        // underline — near the bottom, below the glyph
  const W = moraCount * COL;
  const stroke = tone === 'user' ? 'var(--pitch-line-user)' : 'var(--pitch-line)';
  const opacity = tone === 'user' ? '0.65' : '1';
  const style = (APP.pitchNotation === 'dots') ? 'dots' : 'lines';

  let body;
  if (style === 'dots') {
    // Connected-dot polyline through each column center.
    const pts = pitch.map((p, i) => {
      const x = i * COL + COL / 2;
      const y = p === 'H' ? HIGH_Y : LOW_Y;
      return `${x},${y}`;
    }).join(' ');
    body = `
      <polyline points="${pts}" fill="none" stroke="${stroke}"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                vector-effect="non-scaling-stroke" opacity="${opacity}" />
      ${pitch.map((p, i) => {
        const x = i * COL + COL / 2;
        const y = p === 'H' ? HIGH_Y : LOW_Y;
        return `<circle cx="${x}" cy="${y}" r="3.2" vector-effect="non-scaling-stroke"
                        fill="${stroke}" opacity="${opacity}"/>`;
      }).join('')}`;
  } else {
    // OJAD step line — a single square-wave path. The horizontal bar
    // spans each mora's full column; vertical connectors join levels at
    // the column boundaries. Inset each bar slightly from the column
    // edges (PAD) so adjacent same-level bars read as one continuous
    // line but level-changes show a clean vertical step.
    const PAD = 6;
    let d = '';
    pitch.forEach((p, i) => {
      const y = p === 'H' ? HIGH_Y : LOW_Y;
      const x0 = i * COL;
      const x1 = (i + 1) * COL;
      if (i === 0) {
        d += `M ${x0 + PAD} ${y} `;
      } else {
        const prevY = pitch[i - 1] === 'H' ? HIGH_Y : LOW_Y;
        if (prevY !== y) {
          // vertical step at the boundary, then start this bar
          d += `L ${x0} ${prevY} L ${x0} ${y} `;
        } else {
          d += `L ${x0} ${y} `;
        }
      }
      d += `L ${x1 - (i === pitch.length - 1 ? PAD : 0)} ${y} `;
    });
    body = `
      <path d="${d}" fill="none" stroke="${stroke}"
            stroke-width="2" stroke-linejoin="miter" stroke-linecap="round"
            vector-effect="non-scaling-stroke" opacity="${opacity}" />`;
  }

  return `
    <svg class="pitch-contour-svg" viewBox="0 0 ${W} ${VBH}"
         preserveAspectRatio="none" aria-hidden="true"
         style="--contour-tone:${tone}">
      ${body}
    </svg>`;
}

// Pattern type chip HTML — small color-coded indicator beside the phrase.
// Pattern names map to per-pattern color tokens declared in CSS.
function renderPitchPatternChip(pattern, accent) {
  if (!pattern) return '';
  const labels = {
    heiban:    { ja: '平板', en: 'heiban',    desc: 'flat — no drop' },
    atamadaka: { ja: '頭高', en: 'atamadaka', desc: 'head-high — drop after mora 1' },
    nakadaka:  { ja: '中高', en: 'nakadaka',  desc: `middle-high — drop after mora ${accent || '?'}` },
    odaka:     { ja: '尾高', en: 'odaka',     desc: 'tail-high — drop on particle' },
  };
  const l = labels[pattern] || { ja: pattern, en: pattern, desc: '' };
  return `
    <span class="pitch-pattern-chip" data-pattern="${escAttr(pattern)}"
          title="${escAttr(l.en + ' — ' + l.desc)}">
      <span class="pitch-pattern-ja">${escHTML(l.ja)}</span>
      <span class="pitch-pattern-en">${escHTML(l.en)}</span>
      ${accent != null ? `<span class="pitch-pattern-num">[${accent}]</span>` : ''}
    </span>`;
}

// ── Mora row renderer — used in both the studio and the pitch basics page.
function renderMoraRow(chunk, tone = 'model', opts = {}) {
  const cls = 'pitch-mora-row' + (opts.inline ? ' is-inline' : '');
  return `
    <span class="${cls}">
      ${renderPitchContourSVG(chunk, tone)}
      ${(chunk.mora || []).map((m, i) => `
        <span class="pitch-mora" data-pitch="${escAttr(chunk.pitch[i] || 'L')}">${escHTML(m)}</span>
      `).join('')}
    </span>`;
}

// ── Inline pitch-accent markup: `かな{LHLL}` → rendered contour ────────
// The OJAD / textbook shorthand the user found: write a kana run followed
// by a brace of H/L marks (one per mora) and it renders the pitch line
// over the kana. Reusable anywhere — call pitchifyText(str) on a content
// string, or window.pitchify(element) to process the text nodes of an
// already-rendered container.
//
// The hard part is splitting kana into MORA correctly: small kana
// (ゃゅょ, small vowels, ゎ) attach to the preceding mora (きょ = 1 mora);
// the long mark ー, the sokuon っ, and ん are each their own mora.
const MORA_ATTACH = new Set([
  // small ya/yu/yo + small vowels + small wa — hiragana then katakana
  'ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ','ゎ',
  'ャ','ュ','ョ','ァ','ィ','ゥ','ェ','ォ','ヮ',
]);
function splitMora(kana) {
  const mora = [];
  for (const ch of Array.from(kana)) {
    if (MORA_ATTACH.has(ch) && mora.length) {
      mora[mora.length - 1] += ch;          // small kana fuses into the previous mora
    } else {
      mora.push(ch);                          // everything else (incl. ー っ ん) is its own mora
    }
  }
  return mora;
}

// Build the inline contour HTML for one `kana` + `marks` pair. If the
// mark count doesn't match the mora count we pad/truncate defensively so
// a small typo still renders something sensible rather than throwing.
function renderPitchMarkup(kana, marks) {
  const mora = splitMora(kana);
  if (!mora.length) return escHTML(kana);
  let pitch = String(marks).toUpperCase().replace(/[^HL]/g, '').split('');
  if (!pitch.length) return escHTML(kana);
  // Align lengths: repeat the last mark to pad, or trim the excess.
  while (pitch.length < mora.length) pitch.push(pitch[pitch.length - 1]);
  if (pitch.length > mora.length) pitch = pitch.slice(0, mora.length);
  return renderMoraRow({ mora, pitch }, 'model', { inline: true });
}

// String → string. Replaces every `かな{HL...}` occurrence in a plain-text
// string with its rendered inline contour. Matches hiragana, katakana,
// and the long mark; the brace holds H/L (case-insensitive). Other text
// passes through untouched (HTML-escaped).
const PITCH_MARKUP_RE = /([ぁ-ゖァ-ヺー]+)\{([HLhl]+)\}/g;
function pitchifyText(str) {
  let out = '', last = 0, m;
  PITCH_MARKUP_RE.lastIndex = 0;
  while ((m = PITCH_MARKUP_RE.exec(str))) {
    out += escHTML(str.slice(last, m.index));
    out += renderPitchMarkup(m[1], m[2]);
    last = m.index + m[0].length;
  }
  out += escHTML(str.slice(last));
  return out;
}

// DOM walker. Processes the text nodes of an already-rendered element,
// swapping any `かな{HL}` markup for rendered contours. Lets the notation
// work in "any html" — author the markup in content, call pitchify on the
// container after it mounts. Skips <script>/<style> and elements opting
// out via data-no-pitch.
function pitchify(root) {
  if (!root) return;
  const probe = /[ぁ-ゖァ-ヺー]+\{[HLhl]+\}/;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentNode;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
      if (p.closest && p.closest('[data-no-pitch]')) return NodeFilter.FILTER_REJECT;
      return probe.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  const targets = [];
  let node;
  while ((node = walker.nextNode())) targets.push(node);
  for (const t of targets) {
    const span = document.createElement('span');
    span.innerHTML = pitchifyText(t.nodeValue);
    t.replaceWith(span);
  }
}
window.pitchify = pitchify;
window.pitchifyText = pitchifyText;

// ── Speaking sidebar (categories list) ────────────────────────────────
function renderSpeakingSidebar() {
  const el = document.getElementById('speaking-sidebar');
  if (!el) return;
  const cats = window.SPEAKING_CATEGORIES || [];
  el.innerHTML = `
    <div class="flash-sidebar-head">categories</div>
    <ul class="cat-list">
      ${cats.map(c => {
        const isActive = c.id === APP.speakingCategoryId;
        return `
        <li>
          <button class="cat-item ${isActive ? 'active' : ''}" data-speaking-cat="${escAttr(c.id)}">
            <span class="cat-glyph">${escHTML(c.glyph)}</span>
            <span class="cat-label">
              <span class="cat-ja">${escHTML(c.kana)}</span>
              <span class="cat-en">${escHTML(c.en)}</span>
            </span>
            ${isActive ? activeBrushHTML(2) : ''}
          </button>
        </li>`;
      }).join('')}
    </ul>`;
  el.querySelectorAll('[data-speaking-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newId = btn.dataset.speakingCat;
      if (newId === APP.speakingCategoryId) return;
      APP.speakingCategoryId = newId;
      lsSet('jp:speakingCategory', newId);
      // Reset phrase to first in the new category — sidebar click is a
      // "start fresh" gesture (matches resetBookEntryState contract in
      // the vocab sub-system).
      const cat = findSpeakingCategory(newId);
      APP.speakingPhraseId = (cat && cat.phrases[0]) ? cat.phrases[0].id : null;
      lsSet('jp:speakingPhrase', APP.speakingPhraseId);
      stopAndForgetUserRecording();
      APP.speakingScores = null;
      renderSpeaking(document.getElementById('main-inner'));
      renderSpeakingSidebar();
    });
  });
}

// ── Studio screen ─────────────────────────────────────────────────────
function renderSpeaking(container) {
  if (typeof applyContextBg === 'function') applyContextBg();
  // Resolve current state defensively — persisted ids may be stale.
  let cat = APP.speakingCategoryId && findSpeakingCategory(APP.speakingCategoryId);
  if (!cat) cat = defaultSpeakingCategory();
  if (!cat) { container.innerHTML = `<div class="empty-state">No speaking categories registered.</div>`; return; }
  if (APP.speakingCategoryId !== cat.id) {
    APP.speakingCategoryId = cat.id;
    lsSet('jp:speakingCategory', cat.id);
  }
  let phrase = APP.speakingPhraseId && findSpeakingPhrase(cat.id, APP.speakingPhraseId);
  if (!phrase) phrase = defaultSpeakingPhrase(cat);
  if (!phrase) { container.innerHTML = `<div class="empty-state">${escHTML(cat.en)} — no phrases yet.</div>`; return; }
  if (APP.speakingPhraseId !== phrase.id) {
    APP.speakingPhraseId = phrase.id;
    lsSet('jp:speakingPhrase', phrase.id);
  }
  container.innerHTML = speakingStudioHTML(cat, phrase);
  wireSpeakingStudio(cat, phrase);
}

// Furigana for the recognized transcript. When the recognizer returned the
// phrase's own kanji form, align ruby against the KNOWN reading (exact); if
// it returned other text with kanji, fall back to best-effort per-character
// readings; pure kana passes through untouched. Returns escaped HTML.
function furiganaTranscript(transcript, phrase) {
  const t = (transcript || '').trim();
  if (!t) return '';
  const norm = s => (s || '').replace(/[\s　、。，．・!?！？「」『』,.]/g, '');
  const kanji = (phrase && phrase.kanji) || '';
  const kana = phrase ? (phrase.chunks || []).flatMap(c => c.mora || []).join('') : '';
  if (kanji && norm(t) === norm(kanji)) return withFurigana(kanji, kana);   // exact, aligned to known reading
  if (/[㐀-鿿]/.test(t)) return withFurigana(t);                            // other kanji → per-char best effort
  return escHTML(t);                                                         // pure kana
}

function speakingStudioHTML(cat, phrase) {
  const phraseIdx = cat.phrases.findIndex(p => p.id === phrase.id);
  const phraseTotal = cat.phrases.length;
  // Per-phrase scene illustration. Lives in the category folder
  // (images/speaking/<category>/<phrase>.webp) — the default convention.
  // Categories that ship a single shared image instead point `phrase.image`
  // (or `cat.portrait`) at a root-level file. image-slot probes extensions
  // and collapses (readonly) if nothing is found.
  const phraseImgKey = phrase.image
    ? `speaking/${escAttr(phrase.image)}`
    : `speaking/${escAttr(cat.id)}/${escAttr(phrase.id)}`;
  const fullKana = (phrase.chunks || []).map(c => (c.mora || []).join('')).join(' ');
  // Mora-by-mora chunk rendering for the display phrase. Each chunk shows
  // the pitch contour SVG above the row of mora glyphs; chunks are spaced
  // by a small gap so the eye sees word boundaries.
  const phraseHTML = (phrase.chunks || []).map(chunk => renderMoraRow(chunk, 'model')).join(
    `<span class="phrase-chunk-gap" aria-hidden="true">&nbsp;</span>`
  );
  // Score chips. Filled-dots = round(score / 20), capped at 5.
  const scores = APP.speakingScores || { rhythm: null, clarity: null, pitch: null, naturalness: null, overall: null };
  // Score chip — shows ONLY the Japanese label; the English name + a plain-
  // language note on HOW the dimension is measured live in a hover/focus
  // tooltip (keeps the row clean and stops the longer labels from wrapping).
  const chipHTML = (k, ja, en, desc, glyph) => {
    const s = scores[k];
    const filled = s == null ? 0 : Math.max(0, Math.min(5, Math.round(s / 20)));
    return `
      <div class="score-chip" data-score-dim="${k}" tabindex="0"
           aria-label="${escAttr(en + ' (' + ja + '). ' + desc)}">
        <span class="score-chip-glyph" aria-hidden="true">${glyph}</span>
        <span class="score-chip-ja">${escHTML(ja)}</span>
        <span class="score-chip-dots" aria-label="${s == null ? 'not yet scored' : s + ' out of 100'}">
          ${[0,1,2,3,4].map(i => `<span class="dot ${i < filled ? 'is-filled' : ''}"></span>`).join('')}
        </span>
        <span class="score-chip-tip" role="tooltip" aria-hidden="true">
          <span class="tip-ja">${escHTML(ja)}</span>
          <span class="tip-en">${escHTML(en)}</span>
          <span class="tip-desc">${escHTML(desc)}</span>
        </span>
      </div>`;
  };
  const overall = scores.overall;
  // Pre-built glyph SVGs (sumi-e accents — small, ink-only).
  const G_RHYTHM      = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 12 Q 7 4, 12 12 T 21 12"/></svg>`;
  const G_CLARITY     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 4 L13 11 L20 12 L13 13 L12 20 L11 13 L4 12 L11 11 Z"/></svg>`;
  const G_PITCH       = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,17 8,17 8,7 15,7 15,17 21,17"/></svg>`;
  const G_NATURALNESS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21 Q 5 16, 5 10 Q 5 4, 12 3 Q 19 4, 19 10 Q 19 16, 12 21 Z M12 3 Q 12 12, 12 21"/></svg>`;
  const G_MIC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="3" width="6" height="11" rx="3"/>
    <path d="M5 12a7 7 0 0 0 14 0"/>
    <path d="M12 19v3"/>
  </svg>`;
  const G_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>`;
  // Up Next — vertical list living in the bottom-left rail (beneath the
  // portrait, left of the audio tracks). Fills the empty left-column space
  // and scrolls internally so the page doesn't grow.
  const filmstripHTML = `
    <nav class="speaking-filmstrip" aria-label="Up next phrases">
      <div class="filmstrip-head">
        <div class="filmstrip-label">
          <span class="ja">これからのフレーズ</span>
          <span class="en">Up Next</span>
        </div>
        <div class="filmstrip-nav">
          <button class="filmstrip-arrow" data-speaking-walk="-1" type="button" aria-label="Previous phrase">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button class="filmstrip-arrow" data-speaking-walk="+1" type="button" aria-label="Next phrase">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      </div>
      <ol class="filmstrip-track">
        ${cat.phrases.map((p, i) => {
          const isCurrent = p.id === phrase.id;
          const isPast = i < phraseIdx;
          const enShort = (p.en || '').length > 40 ? (p.en || '').slice(0, 38) + '…' : (p.en || '');
          const kanaPreview = (p.chunks || []).map(c => (c.mora || []).join('')).join(' ');
          return `
            <li class="filmstrip-item ${isCurrent ? 'is-current' : ''} ${isPast ? 'is-past' : ''}">
              <button class="filmstrip-card" data-speaking-phrase="${escAttr(p.id)}"
                      type="button"
                      aria-label="${escAttr(kanaPreview + ' — ' + (p.en || ''))}"
                      aria-current="${isCurrent ? 'true' : 'false'}">
                <span class="filmstrip-num" aria-hidden="true">${i + 1}</span>
                <span class="filmstrip-text">
                  <span class="filmstrip-kana">${escHTML(kanaPreview)}</span>
                  <span class="filmstrip-en">${escHTML(enShort)}</span>
                </span>
              </button>
            </li>`;
        }).join('')}
      </ol>
    </nav>`;
  return `
    <div class="speaking-studio" tabindex="-1" data-category-id="${escAttr(cat.id)}" data-phrase-id="${escAttr(phrase.id)}">
      <aside class="speaking-portrait" aria-hidden="true">
        <div class="speaking-portrait-frame">
          <image-slot image-key="${phraseImgKey}" readonly></image-slot>
        </div>
      </aside>

      <section class="speaking-stage" aria-label="Practice stage">
        <div class="speaking-stage-eyebrow">
          <span class="eyebrow-left">
            <span class="eyebrow-glyph" aria-hidden="true">✿</span>
            <span class="eyebrow-text">PHRASE ${phraseIdx + 1} / ${phraseTotal}</span>
          </span>
          <span class="speaking-autoplay">
            <span class="speaking-autoplay-label">自動再生</span>
            <button class="settings-toggle speaking-autoplay-toggle" id="speaking-autoplay-toggle" type="button"
                    role="switch" aria-checked="${APP.speakingAutoplay ? 'true' : 'false'}"
                    title="自動再生 · Auto-play the model when a phrase loads"
                    aria-label="自動再生 (auto-play the model when a phrase loads)"><i></i></button>
          </span>
          ${renderPitchPatternChip(phrase.pattern, phrase.accent)}
        </div>

        <div class="speaking-phrase">
          <div class="phrase-mora-row">${phraseHTML}</div>
        </div>

        <div class="speaking-mic-row">
          <div class="speaking-mic-cluster">
            <button class="speaking-mic" id="speaking-mic" type="button"
                    data-state="idle"
                    aria-label="Tap to record">
              ${G_MIC}
            </button>
            ${(() => {
              const cloud = !!(APP.gcloudTtsKey && APP.gcloudStt !== false);
              return `<button class="speaking-stt-pick" id="speaking-stt-pick" type="button"
                      data-engine="${cloud ? 'cloud' : 'browser'}"
                      title="${escAttr('音声認識エンジン · speech recognition' + (APP.gcloudTtsKey ? ' — tap to switch Cloud ⇄ Browser' : ' — add a Google Cloud key in settings to use Cloud'))}"
                      aria-label="${escAttr('Speech recognition engine: ' + (cloud ? 'Google Cloud' : 'browser'))}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="3"/>
                  <path d="M9 10.5a2 2 0 1 0 0 3"/>
                  <path d="M16 10.5a2 2 0 1 0 0 3"/>
                </svg>
                <span class="stt-pick-label">${cloud ? 'API' : 'Browser'}</span>
              </button>`;
            })()}
          </div>
          <div class="speaking-mic-labels">
            <span class="mic-label-ja" id="speaking-mic-label-ja"><ruby>録音<rt>ろくおん</rt></ruby>する</span>
            <span class="mic-label-en" id="speaking-mic-label-en">Tap to Record</span>
          </div>
          <p class="speaking-silent-hint" id="speaking-silent-hint" role="status" aria-live="polite" hidden>
            <span class="ja">きこえませんでした</span>
            <span class="en"><em>We didn't hear anything — tap the mic and speak the phrase.</em></span>
          </p>
        </div>

        <!-- "Heard" line — shows the speech-to-text transcript of the last
             recording so the learner can SEE what the recognizer caught.
             Hidden until a recording lands. -->
        <div class="speaking-heard" id="speaking-heard" role="status" aria-live="polite" hidden>
          <span class="speaking-heard-label">
            <span class="ja">きこえた</span>
            <span class="en"><em>Heard</em></span>
          </span>
          <span class="speaking-heard-text" id="speaking-heard-text"></span>
        </div>

        <div class="speaking-waveforms" aria-label="Audio waveforms">
          <div class="waveform-row waveform-original">
            <div class="waveform-label">
              <span class="ja">お<ruby>手本<rt>てほん</rt></ruby></span>
              <span class="en"><em>Original</em></span>
            </div>
            <button class="waveform-play" id="speaking-play-original" type="button" aria-label="Play the model phrase">
              ${G_PLAY}
            </button>
            <svg class="waveform-svg" id="waveform-original-svg" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
              ${synthesizedWaveformPath(phrase, 'original')}
            </svg>
            <button class="waveform-voice" id="speaking-voice-open" type="button"
                    aria-label="再生する声を選ぶ (choose playback voice)" title="声を選ぶ · Choose voice"
                    aria-haspopup="dialog">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3.2"/>
                <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>
                <path d="M17.4 8.6a3 3 0 0 1 0 6.8"/>
                <path d="M19.4 6.4a6 6 0 0 1 0 11.2"/>
              </svg>
            </button>
          </div>
          <div class="waveform-row waveform-user">
            <div class="waveform-label">
              <span class="ja">あなた</span>
              <span class="en"><em>Your Version</em></span>
            </div>
            <button class="waveform-play" id="speaking-play-user" type="button" aria-label="Play your recording" disabled>
              ${G_PLAY}
            </button>
            <svg class="waveform-svg" id="waveform-user-svg" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0,20 L600,20" stroke="var(--waveform-user)" stroke-width="0.8" opacity="0.3" fill="none"/>
            </svg>
            <div class="waveform-duration" id="waveform-user-duration">— / —</div>
          </div>
        </div>

        <div class="speaking-scores">
          ${chipHTML('rhythm',      'リズム',  'Rhythm',      'Whether your beats match the phrase’s mora count and even, mora-timed spacing.', G_RHYTHM)}
          ${chipHTML('clarity',     'はっきり', 'Clarity',     'How crisply each syllable is articulated — read from the energy dips between morae.', G_CLARITY)}
          ${chipHTML('pitch',       'ピッチ',  'Pitch',       'Whether your high–low pitch contour follows the phrase’s accent pattern.', G_PITCH)}
          ${chipHTML('naturalness', '自然',    'Naturalness', 'Overall delivery — a believable speaking rate with the other three in balance.', G_NATURALNESS)}
          <div class="score-overall" data-has-score="${overall != null}">
            <span class="score-overall-num">${overall != null ? overall : '—'}</span>
            <span class="score-overall-denom">/100</span>
          </div>
        </div>

        ${(phrase.en || phrase.notes) ? `
        <div class="speaking-phrase-notes">
          ${phrase.en ? `<p class="speaking-note-en"><em>${escHTML(phrase.en)}</em></p>` : ''}
          ${phrase.notes ? `<p class="speaking-note-detail">${escHTML(phrase.notes)}</p>` : ''}
        </div>` : ''}
      </section>

      ${filmstripHTML}
    </div>`;
}

// ── Synthesized waveform SVG path for the model ──────────────────────────
// Web Speech API (the TTS the model uses) doesn't expose an audio buffer,
// so we can't draw the model's REAL waveform. The DESIGN.md §6.2 calls for
// a deterministic shape derived from the phrase content — looks like a
// real waveform but generated. We hash the mora count + pitch pattern into
// a pseudo-random seed, then synthesize 120 amplitude samples that respect
// the H/L pattern (higher amplitude during 'H' sections) so the shape
// reads as a real signal that matches the phrase's rhythm.
function synthesizedWaveformPath(phrase, kind) {
  const W = 600, H = 40, MID = H / 2;
  const morasFlat = (phrase.chunks || []).flatMap(c => (c.pitch || []).map(p => p));
  if (!morasFlat.length) return `<path d="M0,${MID} L${W},${MID}" stroke="var(--waveform-original)" stroke-width="0.8" fill="none"/>`;
  // Deterministic pseudo-random — same phrase id always → same shape.
  const seedStr = (phrase.id || 'x') + ':' + kind;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) | 0;
  function rnd() { seed = (seed * 1103515245 + 12345) | 0; return ((seed >>> 16) & 0x7fff) / 0x7fff; }
  const SAMPLES = 120;
  const bars = [];
  // Build bars: each bar's height comes from (a) which mora it lands on
  // (H mora → taller, L mora → shorter), and (b) jitter for natural look.
  for (let i = 0; i < SAMPLES; i++) {
    const moraIdx = Math.floor((i / SAMPLES) * morasFlat.length);
    const isHigh = morasFlat[moraIdx] === 'H';
    const base = isHigh ? 0.55 : 0.30;
    const jitter = (rnd() - 0.5) * 0.45;
    const env = Math.sin(Math.PI * (i / SAMPLES));   // amplitude envelope (fade in/out)
    const amp = Math.max(0.05, (base + jitter) * env);
    bars.push(amp);
  }
  const stroke = kind === 'user' ? 'var(--waveform-user)' : 'var(--waveform-original)';
  // Render as paired bars (top + bottom) for a symmetric look.
  const barW = W / SAMPLES;
  return bars.map((a, i) => {
    const x = i * barW + barW / 2;
    const h = a * (H - 6);
    return `<line x1="${x.toFixed(1)}" y1="${(MID - h / 2).toFixed(1)}"
                  x2="${x.toFixed(1)}" y2="${(MID + h / 2).toFixed(1)}"
                  stroke="${stroke}" stroke-width="${(barW * 0.6).toFixed(1)}" stroke-linecap="round"/>`;
  }).join('');
}

// Build a REAL waveform SVG path from the user's recorded AudioBuffer.
// Downsamples the buffer to ~120 amplitude bars; same visual style as
// the synthesized model waveform so the two rows read as a pair.
function realWaveformPath(audioBuffer, color) {
  const W = 600, H = 40, MID = H / 2, SAMPLES = 120;
  if (!audioBuffer || !audioBuffer.length) return '';
  const ch = audioBuffer.getChannelData(0);
  const block = Math.floor(ch.length / SAMPLES) || 1;
  const bars = [];
  for (let i = 0; i < SAMPLES; i++) {
    let max = 0;
    const start = i * block;
    const end = Math.min(ch.length, start + block);
    for (let j = start; j < end; j++) {
      const v = Math.abs(ch[j]);
      if (v > max) max = v;
    }
    // Boost so quiet phrases still show — cap at 1 to avoid clipping
    // into the bar's visual space.
    bars.push(Math.min(1, max * 2.5));
  }
  const barW = W / SAMPLES;
  return bars.map((a, i) => {
    const x = i * barW + barW / 2;
    const h = a * (H - 6);
    return `<line x1="${x.toFixed(1)}" y1="${(MID - h / 2).toFixed(1)}"
                  x2="${x.toFixed(1)}" y2="${(MID + h / 2).toFixed(1)}"
                  stroke="${color}" stroke-width="${(barW * 0.6).toFixed(1)}" stroke-linecap="round"/>`;
  }).join('');
}

// ── Mic capture + scoring ─────────────────────────────────────────────
// Captures audio with MediaRecorder, decodes into an AudioBuffer for the
// waveform draw + scoring, then throws the raw blob away. No data persists
// past the current phrase (per restriction in PRODUCT.md §4).
//
// Permission: the mic stream is acquired ONCE (getUserMedia → one prompt)
// and CACHED for the whole speaking session. Subsequent recordings reuse
// the live stream, so the browser never re-prompts on every tap (the
// previous version stopped the tracks after each recording, which on
// file:// re-triggered the permission prompt every single time). The
// stream is released only when the user leaves the Speaking section
// (setSection → SpeakingRecorder.release()), turning the browser's mic
// indicator back off.
// ── Google Cloud Speech-to-Text (optional, premium) ──────────────────
// When the user has set a Google Cloud key AND left cloud STT enabled, the
// Shadowing studio transcribes the RECORDED clip with Cloud STT instead of
// the browser's live recognizer — far more accurate, which directly lifts
// the content score. Uses the SAME key as the neural voices (enable both
// the Text-to-Speech and Speech-to-Text APIs on that one key).
function gcloudSttEnabled() {
  return !!(APP.gcloudTtsKey && APP.gcloudStt !== false);
}
// Encode an AudioBuffer's first channel as base64 LINEAR16 — headerless
// little-endian 16-bit PCM, the inline format Cloud STT expects.
function audioBufferToBase64PCM16(buf) {
  const ch = buf.getChannelData(0);
  const n = ch.length;
  const bytes = new Uint8Array(n * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < n; i++) {
    let s = ch[i]; if (s > 1) s = 1; else if (s < -1) s = -1;
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
// Recognize Japanese from a recorded AudioBuffer via Cloud STT. Returns the
// transcript ('' when the API genuinely heard nothing). THROWS on transport
// / key / quota errors so the caller can fall back to acoustic-only scoring
// instead of reporting "no words."
async function cloudRecognizeJa(buf) {
  const key = APP.gcloudTtsKey;
  if (!key || !buf || !buf.length) return '';
  const res = await fetch(
    'https://speech.googleapis.com/v1/speech:recognize?key=' + encodeURIComponent(key),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: Math.round(buf.sampleRate),
          languageCode: 'ja-JP',
          maxAlternatives: 1,
          model: 'latest_short',
        },
        audio: { content: audioBufferToBase64PCM16(buf) },
      }),
    }
  );
  if (!res.ok) throw new Error('Cloud STT HTTP ' + res.status);
  const data = await res.json();
  const alt = data.results && data.results[0] && data.results[0].alternatives && data.results[0].alternatives[0];
  return (alt && alt.transcript) ? alt.transcript.trim() : '';
}

const SpeakingRecorder = (function () {
  let mediaStream = null;     // cached across recordings within a session
  let mediaRecorder = null;
  let chunks = [];
  let startTime = 0;
  let stopTimer = null;
  let analyser = null;
  let srcNode = null;
  let audioCtx = null;
  let onStop = null;

  function ensureAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Acquire the mic stream once, cache it. Reused on every subsequent
  // record so the permission prompt fires only the first time.
  async function ensureStream() {
    if (mediaStream && mediaStream.active) return mediaStream;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices unavailable');
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    return mediaStream;
  }

  // ── Speech-to-text (Web Speech API) — Chrome/Edge expose it (webkit-
  // prefixed). The recognizer keeps its OWN mic capture, SEPARATE from
  // getUserMedia, so each `.start()` could fire its own permission prompt.
  // The old code newed-up and started a recognizer on EVERY take, which is
  // what re-prompted every time. Instead we create ONE recognizer and keep
  // it running continuously for the whole speaking session (reviving it if
  // Chrome auto-stops after a pause). A take just opens a "capture window":
  // clear the buffer when recording starts, snapshot the transcript when it
  // stops. Because getUserMedia is awaited first (granting the origin's mic
  // permission), the recognizer reuses that grant on persisting origins and
  // doesn't prompt separately. NOTE: on Chrome this routes audio to Google's
  // servers — a deliberate exception to the earlier "no cloud STT"
  // restriction, made because the user explicitly asked for STT.
  const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const STT_SUPPORTED = !!SRClass;
  let recog = null;
  let recogRunning = false;
  let sessionActive = false;     // true between the first start() and release()
  let captureWindow = false;     // true only while a take is being recorded
  let capturedFinal = '';
  let capturedInterim = '';

  function ensureRecog() {
    if (!STT_SUPPORTED || recog) return;
    recog = new SRClass();
    recog.lang = 'ja-JP';
    recog.interimResults = true;
    recog.continuous = true;
    recog.maxAlternatives = 1;
    recog.onresult = e => {
      if (!captureWindow) return;          // ignore anything said outside a take
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r || !r[0]) continue;
        if (r.isFinal) capturedFinal += r[0].transcript;
        else interim += r[0].transcript;
      }
      capturedInterim = interim;
    };
    recog.onerror = () => { /* no-speech / aborted — leave the buffer as-is */ };
    recog.onend = () => {
      recogRunning = false;
      // Only revive the recognizer if a take is STILL actively recording
      // (Chrome can end it mid-utterance after a pause). At idle we leave it
      // stopped — auto-restarting at a random non-gesture moment (e.g. right
      // as the user taps "play original") was triggering a stray mic prompt.
      // The next record tap re-arms it via startRecog(), by which point the
      // grant is already held, so no prompt.
      if (sessionActive && isRecording()) { try { recog.start(); recogRunning = true; } catch (e) {} }
    };
  }
  function startRecog() {
    ensureRecog();
    if (recog && !recogRunning) { try { recog.start(); recogRunning = true; } catch (e) {} }
  }

  async function start(onDoneCallback) {
    onStop = onDoneCallback;
    const stream = await ensureStream();          // mic grant FIRST (one prompt)
    chunks = [];

    // Pick the recognizer for this take. With a Google Cloud key + cloud STT
    // enabled we transcribe the RECORDED clip after it stops (more accurate,
    // and no second mic consumer → no extra permission prompt). Otherwise we
    // run the browser's live recognizer in parallel.
    const useCloud = gcloudSttEnabled();
    if (!useCloud) {
      sessionActive = true;
      capturedFinal = '';
      capturedInterim = '';
      captureWindow = true;
      startRecog();
    }

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: chunks[0] && chunks[0].type || 'audio/webm' });
      const arrayBuf = await blob.arrayBuffer();
      const ctx = ensureAudioCtx();
      let fullBuffer = null;
      try { fullBuffer = await ctx.decodeAudioData(arrayBuf.slice(0)); }
      catch (e) { fullBuffer = null; }
      // Trimmed copy (leading/trailing silence cropped) for the displayed
      // waveform, playback, and scoring. NOTE: do NOT feed this to Cloud STT
      // — the trailing-silence trim clips devoiced endings (the final す in
      // です/ます is whispered = near-silent), which made the recognizer miss
      // word endings. STT gets the FULL buffer below; its natural trailing
      // silence also helps the recognizer mark end-of-utterance.
      const audioBuffer = fullBuffer ? trimToRealBuffer(fullBuffer, ctx) : null;
      // Tear down the recorder + analyser, but KEEP the stream + recognizer
      // alive for the next take (no re-prompt).
      teardownRecorder();
      const duration = audioBuffer ? audioBuffer.duration : (Date.now() - startTime) / 1000;
      const deliver = (transcript, sttAvailable) => {
        if (onStop) onStop({ audioBuffer, duration, transcript, sttAvailable });
      };
      if (useCloud) {
        // Transcribe the FULL (untrimmed) clip with Cloud STT so devoiced
        // endings survive. On a transport / key / quota error, mark STT
        // unavailable so scoring falls back to the acoustic measures rather
        // than reporting "no words."
        let transcript = '', sttAvailable = true;
        if (fullBuffer) {
          try { transcript = await cloudRecognizeJa(fullBuffer); }
          catch (e) { console.warn('Cloud STT failed — scoring on sound only:', e); sttAvailable = false; }
        }
        deliver(transcript, sttAvailable);
      } else {
        // Browser recognizer: close the capture window + deliver, giving it a
        // brief grace to flush a final result if it hasn't produced one yet.
        const finish = () => {
          captureWindow = false;
          deliver((capturedFinal || capturedInterim || '').trim(), STT_SUPPORTED);
        };
        if (STT_SUPPORTED && !capturedFinal) setTimeout(finish, 700);
        else finish();
      }
    };
    // Live analyser for the recording-pulse — real input volume.
    const ctx = ensureAudioCtx();
    srcNode = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    srcNode.connect(analyser);
    startTime = Date.now();
    mediaRecorder.start();
    // Hard cap at 10s — protects against the user forgetting to stop.
    stopTimer = setTimeout(() => stop(), 10000);
    return { analyser };
  }

  // End the current take. The recognizer keeps running for the next one.
  function stop() {
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  // Reset the per-recording objects WITHOUT releasing the cached stream.
  function teardownRecorder() {
    if (srcNode) { try { srcNode.disconnect(); } catch (e) {} srcNode = null; }
    analyser = null;
    mediaRecorder = null;
  }

  // Fully release the mic when leaving the Speaking section — stop the
  // recognizer AND the stream tracks so the browser's recording indicator
  // turns off. The recognizer OBJECT is kept (just stopped) so re-entering
  // the section reuses the existing permission grant instead of re-prompting.
  function release() {
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    sessionActive = false;
    captureWindow = false;
    if (recog && recogRunning) { try { recog.stop(); } catch (e) {} }
    recogRunning = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') { try { mediaRecorder.stop(); } catch (e) {} }
    teardownRecorder();
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
  }

  function getAnalyser() { return analyser; }
  function isRecording() { return mediaRecorder && mediaRecorder.state === 'recording'; }
  function sttAvailable() { return STT_SUPPORTED; }

  return { start, stop, release, getAnalyser, isRecording, sttAvailable };
})();

function stopAndForgetUserRecording() {
  if (SpeakingRecorder.isRecording()) SpeakingRecorder.stop();
  APP.speakingUserBuffer = null;
  APP.speakingScores = null;
}

// ── Heuristic scoring engine ─────────────────────────────────────────
// Each score is 0-100 derived from a REAL signal. No randomness.
//
// The cardinal rule (fixed 2026-05-29 after silence scored 50-60): a
// recording with no actual SPEECH in it scores ZERO. Everything else
// scales up from there. The previous version measured duration, RMS,
// and pitch independently with no voice-activity gate, so silence —
// which still has a duration, a (near-zero) RMS that hit the floor
// branch, and an autocorrelation that fell back to a neutral 0.5
// agreement — accumulated to ~60. That was the bug.
//
// New pipeline:
//   1. analyzeAudio()  → frame-by-frame voice-activity detection (VAD).
//      Computes a noise floor, counts VOICED frames, measures voiced
//      duration + mean voiced RMS + peak.
//   2. SILENCE GATE    → if there isn't enough voiced audio, return all
//      zeros immediately. Pure silence / room tone scores 0.
//   3. PRESENCE RAMP   → a 0..1 confidence that real speech is present,
//      from voiced duration + loudness + peak. Every dimension is
//      multiplied by it, so a faint mumble scores low (not mid).
//   4. Per-dimension scoring from voiced signal only.
//
// Score bands for a recording that DOES contain speech: poor attempt
// 50-68, decent 70-85, model-matching 86-95. Never 100 (no perfect-
// verdict, per PRODUCT.md restriction §4).

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Frame-level analysis. Returns the per-frame RMS envelope (10ms hop —
// fine enough to resolve individual mora nuclei) plus a smoothed copy,
// the noise floor / voiced threshold, peak, and voiced summary. Every
// downstream dimension reads from this; the syllable-nucleus detector
// reads the smoothed envelope.
function analyzeAudio(audioBuffer) {
  const ch = audioBuffer.getChannelData(0);
  const sr = audioBuffer.sampleRate;
  const FRAME_SEC = 0.01;                         // 10ms hop
  const frameLen = Math.max(1, Math.floor(sr * FRAME_SEC));
  const frameRms = [];
  let peak = 0;
  for (let i = 0; i + frameLen <= ch.length; i += frameLen) {
    let sumSq = 0;
    for (let j = i; j < i + frameLen; j++) {
      const v = ch[j];
      sumSq += v * v;
      const a = v < 0 ? -v : v;
      if (a > peak) peak = a;
    }
    frameRms.push(Math.sqrt(sumSq / frameLen));
  }
  if (!frameRms.length) {
    return { peak: 0, voicedFrames: 0, voicedRatio: 0, voicedDurationSec: 0,
             meanVoicedRms: 0, totalDurationSec: ch.length / sr, voicedThreshold: 0.02,
             frameSec: FRAME_SEC, frameLen, frameRms: [], smooth: [], noiseFloor: 0 };
  }
  // Noise floor = 15th-percentile frame RMS (the quiet background between
  // or around speech). The voiced threshold sits a margin above it, with
  // an absolute floor so a totally-silent clip (floor ≈ 0) still requires
  // real energy to count as voiced.
  const sorted = [...frameRms].sort((a, b) => a - b);
  const noiseFloor = sorted[Math.floor(sorted.length * 0.15)] || 0;
  const voicedThreshold = Math.max(0.014, noiseFloor * 2.2);
  let voiced = 0, voicedSum = 0;
  for (const r of frameRms) {
    if (r > voicedThreshold) { voiced++; voicedSum += r; }
  }
  // Smoothed envelope (~50ms moving average) for nucleus peak-picking —
  // removes micro-fluctuation so each syllable reads as one bump.
  const W = 2; // ±2 frames ≈ 50ms total
  const smooth = new Array(frameRms.length);
  for (let i = 0; i < frameRms.length; i++) {
    let s = 0, c = 0;
    for (let j = Math.max(0, i - W); j <= Math.min(frameRms.length - 1, i + W); j++) { s += frameRms[j]; c++; }
    smooth[i] = s / c;
  }
  return {
    peak,
    voicedFrames: voiced,
    voicedRatio: voiced / frameRms.length,
    voicedDurationSec: voiced * FRAME_SEC,
    meanVoicedRms: voiced ? voicedSum / voiced : 0,
    totalDurationSec: ch.length / sr,
    voicedThreshold,
    noiseFloor,
    frameRms,
    smooth,
    frameLen,
    frameSec: FRAME_SEC,
  };
}

// A zero-copy, context-free stand-in for an AudioBuffer over a slice of an
// existing channel. Every downstream analyzer reads only getChannelData(0),
// sampleRate, length and duration — so a thin view is enough, and it avoids
// allocating a real AudioBuffer (which would need an AudioContext) just to
// score a cropped window. `subarray` shares memory, so no samples are copied.
function makeBufferView(srcCh, sr, s, e) {
  const slice = srcCh.subarray(s, e);
  return {
    sampleRate: sr,
    length: slice.length,
    duration: slice.length / sr,
    numberOfChannels: 1,
    getChannelData: () => slice,
  };
}

// Endpoint detection — crop the leading/trailing silence so only the part
// that actually carries speech is scored. We almost always pause briefly
// before and after speaking; that dead air skews the noise floor, the
// speaking rate, and the rhythm windows, making a good attempt look worse
// than it is. Standard energy VAD: a frame is "speech" when its RMS clears
// ~3× the noise floor (15th-percentile frame RMS) with an absolute minimum
// so true silence can't self-trigger. We keep a ~60ms pad on each side so
// the onset consonant and the final release aren't clipped.
// Returns { buffer, trimmed, startSec, endSec }. On all-silence or a clip
// that's already tight, returns the original buffer untouched.
function trimSilence(audioBuffer) {
  const ch = audioBuffer.getChannelData(0);
  const sr = audioBuffer.sampleRate;
  const n = ch.length;
  const frameLen = Math.max(1, Math.floor(sr * 0.01));   // 10ms frames
  const rms = [];
  for (let i = 0; i + frameLen <= n; i += frameLen) {
    let s = 0;
    for (let j = i; j < i + frameLen; j++) s += ch[j] * ch[j];
    rms.push(Math.sqrt(s / frameLen));
  }
  if (rms.length < 3) return { buffer: audioBuffer, trimmed: false };
  const sorted = [...rms].sort((a, b) => a - b);
  const noiseFloor = sorted[Math.floor(sorted.length * 0.15)] || 0;
  const thr = Math.max(0.012, noiseFloor * 3);
  let first = -1, last = -1;
  for (let i = 0; i < rms.length; i++) {
    if (rms[i] > thr) { if (first < 0) first = i; last = i; }
  }
  if (first < 0) return { buffer: audioBuffer, trimmed: false };   // pure silence — let the gate handle it
  const padF = 6;                                                  // ±60ms
  const sFrame = Math.max(0, first - padF);
  const eFrame = Math.min(rms.length - 1, last + padF);
  const s = sFrame * frameLen;
  const e = Math.min(n, (eFrame + 1) * frameLen);
  // Don't bother if there was barely anything to remove (<80ms total).
  if ((n - (e - s)) < frameLen * 8) return { buffer: audioBuffer, trimmed: false };
  return { buffer: makeBufferView(ch, sr, s, e), trimmed: true, startSec: s / sr, endSec: e / sr };
}

// Crop the silence into a REAL AudioBuffer (the view above shares memory and
// can't drive an AudioBufferSourceNode for playback). Used at capture time so
// the displayed waveform and the playback both show only the spoken part.
// Falls back to the original buffer if there's nothing to trim or the copy
// fails. `ctx` is any AudioContext (for createBuffer).
function trimToRealBuffer(audioBuffer, ctx) {
  const tr = trimSilence(audioBuffer);
  if (!tr.trimmed) return audioBuffer;
  const data = tr.buffer.getChannelData(0);
  if (!data.length) return audioBuffer;
  try {
    const out = ctx.createBuffer(1, data.length, tr.buffer.sampleRate);
    if (out.copyToChannel) out.copyToChannel(data, 0);
    else out.getChannelData(0).set(data);
    return out;
  } catch (e) { return audioBuffer; }
}

// Detect syllable nuclei — the per-mora vowel beats — from the smoothed
// energy envelope. A nucleus is a local energy peak that reaches a
// fraction of the loudest peak AND is separated from its neighbour by a
// genuine valley (a consonant closure dips the energy between vowels).
// The valley requirement is what stops a single sustained vowel ("WHOA")
// from registering as several beats, and what lets "i-ta-da-ki-ma-su"
// register as six. Returns [{ frame, t, energy }] in time order.
function detectSyllableNuclei(smooth, frameSec) {
  const n = smooth.length;
  if (!n) return [];
  let max = 0;
  for (let i = 0; i < n; i++) if (smooth[i] > max) max = smooth[i];
  if (max < 1e-4) return [];
  const peakThresh = max * 0.20;   // a nucleus must reach 20% of the loudest mora
  const valleyRatio = 0.70;        // the dip between two nuclei must fall below 70% of the quieter one
  // Raw local maxima above threshold.
  const peaks = [];
  for (let i = 1; i < n - 1; i++) {
    if (smooth[i] >= peakThresh && smooth[i] >= smooth[i - 1] && smooth[i] > smooth[i + 1]) peaks.push(i);
  }
  if (!peaks.length) {
    // No clear peak but there is energy — count it as a single broad nucleus
    // at the envelope's argmax (covers a held single vowel).
    let am = 0; for (let i = 0; i < n; i++) if (smooth[i] > smooth[am]) am = i;
    return smooth[am] >= peakThresh ? [{ frame: am, t: am * frameSec, energy: smooth[am] }] : [];
  }
  // Merge peaks that aren't separated by a real valley → one nucleus each.
  const merged = [peaks[0]];
  for (let k = 1; k < peaks.length; k++) {
    const prev = merged[merged.length - 1];
    const cur = peaks[k];
    let valley = Infinity;
    for (let i = prev; i <= cur; i++) if (smooth[i] < valley) valley = smooth[i];
    const quieter = Math.min(smooth[prev], smooth[cur]);
    if (quieter > 0 && valley < quieter * valleyRatio) {
      merged.push(cur);                                   // real dip → distinct nucleus
    } else if (smooth[cur] > smooth[prev]) {
      merged[merged.length - 1] = cur;                    // no dip → keep the louder
    }
  }
  return merged.map(i => ({ frame: i, t: i * frameSec, energy: smooth[i] }));
}

// ══════════════════════════════════════════════════════════════════════
// CONTENT ANALYSIS — did you say the RIGHT WORDS?
// ══════════════════════════════════════════════════════════════════════
// Structure (mora count, rhythm, pitch shape) isn't enough: gibberish
// with six even beats passes all of it. The missing signal is WHAT was
// said. Without cloud speech-to-text we can't transcribe, but we CAN
// check the VOWEL SEQUENCE — every Japanese mora carries one of five
// vowels (a/i/u/e/o), and the vowel is identifiable from its formants
// (F1/F2, the two lowest resonances of the vocal tract). So:
//   1. estimate F1/F2 at each syllable nucleus (cepstrally-smoothed FFT),
//   2. classify each into a/i/u/e/o,
//   3. DTW-align the detected vowel sequence against the phrase's
//      expected vowel sequence (with confusion-aware costs),
//   4. the alignment similarity is the content-accuracy (0..1).
// "itadakimasu" (i-a-a-i-a-u) vs "yoroshiku onegaishimasu"
// (o-o-i-u-o-e-a-i-i-a-u) overlap only at the tail → low accuracy.
// This is an approximation, not transcription — but it's enough to make
// the wrong words cost real points.

// In-place iterative radix-2 FFT. `inverse` divides by N at the end.
function fftRadix2(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k], ai = im[i + k];
        const br = re[i + k + len / 2], bi = im[i + k + len / 2];
        const vr = br * cwr - bi * cwi, vi = br * cwi + bi * cwr;
        re[i + k] = ar + vr; im[i + k] = ai + vi;
        re[i + k + len / 2] = ar - vr; im[i + k + len / 2] = ai - vi;
        const ncwr = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = ncwr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

// Estimate the first two formants (F1, F2) of a vowel window. Downsamples
// to ~8kHz (formants live below ~3.5kHz), Hamming-windows, cepstrally
// smooths the magnitude spectrum to remove the F0 harmonic ripple, then
// peak-picks F1 in 200-1000Hz and F2 in 800-3000Hz. Returns { f1, f2,
// strength } or null if no clear vowel.
function estimateFormants(ch, centerSample, sr) {
  const halfWin = Math.floor(sr * 0.05);                 // ±50ms
  const lo = Math.max(0, centerSample - halfWin);
  const hi = Math.min(ch.length, centerSample + halfWin);
  if (hi - lo < sr * 0.03) return null;
  // Downsample to ~8kHz with a box-average anti-alias.
  const TARGET = 8000;
  const ratio = sr / TARGET;
  const box = Math.max(1, Math.round(ratio));
  const ds = [];
  for (let x = lo; x + box <= hi; x += ratio) {
    const s = Math.floor(x);
    let sum = 0; for (let k = 0; k < box; k++) sum += ch[s + k];
    ds.push(sum / box);
  }
  if (ds.length < 64) return null;
  const N = 1024;
  const re = new Float64Array(N), im = new Float64Array(N);
  const M = Math.min(ds.length, N);
  let energy = 0;
  for (let i = 0; i < M; i++) {
    const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (M - 1)); // Hamming
    re[i] = ds[i] * w;
    energy += ds[i] * ds[i];
  }
  if (energy < 1e-6) return null;
  fftRadix2(re, im, false);
  // Log-magnitude spectrum (first half).
  const half = N / 2;
  const logmag = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const kk = k <= half ? k : N - k;
    const mag = Math.hypot(re[kk], im[kk]);
    logmag[k] = Math.log(mag + 1e-6);
  }
  // Cepstral smoothing: IFFT(logmag) → lifter low quefrency → FFT back.
  const cre = Float64Array.from(logmag), cim = new Float64Array(N);
  fftRadix2(cre, cim, true);
  const L = 30;                                          // lifter cutoff (quefrency bins)
  for (let k = L; k < N - L; k++) { cre[k] = 0; cim[k] = 0; }
  fftRadix2(cre, cim, false);                            // cre ≈ smoothed log spectrum
  const binHz = TARGET / N;
  // Peak-pick on the smoothed envelope.
  function peakIn(f0, f1) {
    const a = Math.max(2, Math.floor(f0 / binHz));
    const b = Math.min(half - 2, Math.floor(f1 / binHz));
    let bestK = -1, bestV = -Infinity;
    for (let k = a; k <= b; k++) {
      if (cre[k] >= cre[k - 1] && cre[k] >= cre[k + 1] && cre[k] > bestV) { bestV = cre[k]; bestK = k; }
    }
    return bestK > 0 ? bestK * binHz : 0;
  }
  const f1 = peakIn(200, 1000);
  const f2 = peakIn(850, 3000);
  if (!f1 || !f2 || f2 <= f1) return null;
  return { f1, f2, strength: energy };
}

// Vowel prototypes (Japanese, approximate Hz). Classification is in log
// space so it tolerates speaker-size differences (the RELATIVE layout —
// i high-F2, a high-F1, o low-everything — holds across voices).
const VOWEL_PROTOTYPES = [
  { v: 'a', f1: 750, f2: 1250 },
  { v: 'i', f1: 320, f2: 2300 },
  { v: 'u', f1: 350, f2: 1250 },
  { v: 'e', f1: 480, f2: 1900 },
  { v: 'o', f1: 480, f2: 850 },
];
function classifyVowel(f1, f2) {
  let best = null, bestD = Infinity;
  for (const p of VOWEL_PROTOTYPES) {
    const d = (Math.log(f1) - Math.log(p.f1)) ** 2 + (Math.log(f2) - Math.log(p.f2)) ** 2;
    if (d < bestD) { bestD = d; best = p.v; }
  }
  return best;
}

// Kana → vowel. Keyed on the LAST kana of a mora (small kana fused, so
// きょ → ょ → o). Katakana normalized to hiragana by codepoint shift.
const KANA_VOWEL = (function () {
  const rows = {
    a: 'あかさたなはまやらわがざだばぱぁゃゎ',
    i: 'いきしちにひみりゐぎじぢびぴぃ',
    u: 'うくすつぬふむゆるぐずづぶぷぅゅゔ',
    e: 'えけせてねへめれゑげぜでべぺぇ',
    o: 'おこそとのほもよろをごぞどぼぽぉょ',
  };
  const map = {};
  for (const v in rows) for (const ch of rows[v]) map[ch] = v;
  map['ん'] = 'N';
  map['っ'] = 'Q';
  return map;
})();
function moraVowel(moraStr, prevVowel) {
  let last = moraStr[moraStr.length - 1];
  if (last === 'ー' || last === 'ｰ') return prevVowel || null;   // long mark repeats
  // Katakana → hiragana.
  const code = last.charCodeAt(0);
  if (code >= 0x30A1 && code <= 0x30F6) last = String.fromCharCode(code - 0x60);
  return KANA_VOWEL[last] || null;
}
// The phrase's expected clear-vowel backbone (dropping ん and っ, which
// don't form clear vowel nuclei the detector keys on).
function expectedVowelSequence(phrase) {
  const mora = (phrase.chunks || []).flatMap(c => (c.mora || []));
  const seq = [];
  let prev = 'a';
  for (const m of mora) {
    const v = moraVowel(m, prev);
    if (!v || v === 'Q' || v === 'N') continue;
    seq.push(v);
    prev = v;
  }
  return seq;
}

// Confusion-aware cost between two vowels (0 = identical, 1 = unrelated).
// Acoustically close pairs (i↔e high-front, u↔o back) cost less so a
// classifier near-miss isn't fully penalized.
function vowelCost(a, b) {
  if (a === b) return 0;
  const pair = a < b ? a + b : b + a;
  // Only the truly adjacent pairs (high-front i↔e, back u↔o) get partial
  // forgiveness — a classifier near-miss between those is plausible. Every
  // other swap is a real error and costs full, so wrong vowels actually
  // tank the accuracy instead of riding generous partial credit.
  const close = { ei: 0.5, ou: 0.5 };
  return close[pair] != null ? close[pair] : 1.0;
}
// DTW similarity (0..1) between the user's detected vowels and the
// expected sequence. Insertions/deletions cost a gap; substitutions cost
// the confusion distance. Normalized by the longer length.
function vowelSequenceAccuracy(userV, expV) {
  const n = userV.length, m = expV.length;
  if (!m) return 0.5;            // nothing to compare against → neutral
  if (n < 2) return 0.15;        // basically no vowels detected → very low
  const GAP = 0.8, INF = 1e9;
  const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(INF));
  D[0][0] = 0;
  for (let i = 1; i <= n; i++) D[i][0] = i * GAP;
  for (let j = 1; j <= m; j++) D[0][j] = j * GAP;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = D[i - 1][j - 1] + vowelCost(userV[i - 1], expV[j - 1]);
      const del = D[i - 1][j] + GAP;
      const ins = D[i][j - 1] + GAP;
      D[i][j] = Math.min(sub, del, ins);
    }
  }
  const pathLen = Math.max(n, m);
  return clamp(1 - D[n][m] / pathLen, 0, 1);
}

// Levenshtein-based string similarity (0..1). Operates per code point so
// multi-byte kana/kanji compare correctly.
function stringSimilarity(a, b) {
  const al = Array.from(a || ''), bl = Array.from(b || '');
  const n = al.length, m = bl.length;
  if (!n && !m) return 1;
  if (!n || !m) return 0;
  const dp = new Array(m + 1);
  for (let j = 0; j <= m; j++) dp[j] = j;
  for (let i = 1; i <= n; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (al[i - 1] === bl[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return 1 - dp[m] / Math.max(n, m);
}

// Content accuracy from a speech-to-text transcript vs the phrase. STT
// (Web Speech API) returns Japanese either in kana or kanji, so we compare
// the recognized text against BOTH the phrase's kana reading and its kanji
// form and take the better match. Returns 0..1, or null when there's no
// transcript to judge (STT unavailable / nothing recognized).
function transcriptAccuracy(transcript, phrase) {
  if (!transcript) return null;
  const norm = s => (s || '').replace(/[\s　、。，．・!?！？「」『』,.・]/g, '');
  const t = norm(transcript);
  if (!t) return null;
  const kana = norm((phrase.chunks || []).flatMap(c => (c.mora || [])).join(''));
  const kanji = norm(phrase.kanji || '');
  let best = 0;
  for (const tgt of [kana, kanji]) if (tgt) best = Math.max(best, stringSimilarity(t, tgt));
  return best;
}

// The four-dimension scorer. Built around syllable-nucleus structure AND
// content accuracy (speech-to-text when available, vowel-formant matching
// as fallback) so it responds to WHAT was said, not just whether SOME
// sound happened. No hard-coded floors — every number flows from a
// measurement, so silence lands at ~0-2, a single shouted vowel ("WHOA")
// lands in the teens, and the WRONG phrase craters because the content
// multiplier collapses, all algorithmically.
//
// opts.transcript    — STT result string (or '' / null if none)
// opts.sttAvailable  — whether SpeechRecognition ran at all
function scoreSpeakingAttempt(phrase, audioBuffer, durationSec, opts = {}) {
  if (!audioBuffer) return null;
  // Crop leading/trailing silence so only the spoken part is scored — the
  // pre-speech pause was skewing the rate and rhythm windows. Everything
  // below works on this trimmed view; the full take is kept elsewhere for
  // playback/waveform.
  const work = trimSilence(audioBuffer).buffer;
  const a = analyzeAudio(work);
  const ch = work.getChannelData(0);
  const sr = work.sampleRate;

  const moraCount = (phrase.chunks || []).reduce((n, c) => n + (c.mora || []).length, 0) || 1;
  const expectedPitch = (phrase.chunks || []).flatMap(c => (c.pitch || []));

  // Voice-activity envelope → syllable nuclei.
  const nuclei = detectSyllableNuclei(a.smooth, a.frameSec);
  const N = nuclei.length;

  // ── CONTENT ACCURACY — did you say the right vowels? ──
  // Classify the vowel at each nucleus, compare the sequence to the
  // phrase's expected vowels via DTW. This is the signal that makes
  // gibberish / the wrong phrase cost real points (it was missing
  // before — "WHOA" and "yoroshiku…" both scored too high).
  const expectedVowels = expectedVowelSequence(phrase);
  const userVowels = [];
  for (const nu of nuclei) {
    const f = estimateFormants(ch, nu.frame * a.frameLen, sr);
    if (f) {
      const v = classifyVowel(f.f1, f.f2);
      if (v) userVowels.push(v);
    }
  }
  const formantAccuracy = vowelSequenceAccuracy(userVowels, expectedVowels);
  // Speech-to-text content accuracy (preferred when available — it
  // actually recognizes the WORDS, far more reliable than guessing
  // vowels from formants).
  const sttAccuracy = transcriptAccuracy(opts.transcript, phrase);
  // ── CONTENT (0..1): how much of the RIGHT phrase did you actually say? ──
  // This is the signal that separates a real attempt from gibberish. It is
  // intentionally FORGIVING at the top: the Web Speech recognizer drops or
  // mis-hears a mora or two even on a clean read, and string-distance on
  // flowing kana rarely exceeds ~0.8 for a genuinely correct attempt — so
  // we map "0.80 similarity" up to "essentially correct" rather than
  // punishing the recognizer's slack as if it were the speaker's error.
  let content01;
  if (sttAccuracy != null) {
    // STT recognized words — primary signal. forgive(0.12→0, 0.80→1).
    const sttForgiven = clamp((sttAccuracy - 0.12) / 0.68, 0, 1);
    // Formant vowels support: they can nudge a low STT (a mis-hear) up a
    // little, but STT leads. The wrong phrase tanks BOTH → content craters.
    content01 = clamp(0.80 * sttForgiven + 0.20 * formantAccuracy, 0, 1);
  } else {
    // No transcript (STT off, or it heard nothing). Lean on the formant
    // vowel-sequence, but it's a weak instrument — keep a modest floor so
    // an STT-less browser doesn't unfairly crater a good delivery, while
    // gibberish (low formant match) still pulls content down.
    content01 = clamp(0.30 + 0.55 * formantAccuracy, 0, 1);
  }
  const accuracy = content01;

  // Speech-presence confidence (0..1). Drives nothing on its own except
  // as a multiplier where loudness genuinely matters; structure is
  // judged by the nuclei, loudness by clarity. This stays continuous so
  // there's never a hard cliff — quiet real speech still scores, just
  // lower.
  const loud = clamp(a.meanVoicedRms / 0.05, 0, 1);
  const audible = clamp(a.peak / 0.10, 0, 1);

  // ── (1) RHYTHM — mora-structure match ──
  // Two parts: (a) does the BEAT COUNT match the mora count, and (b) are
  // the beats EVENLY spaced (Japanese is mora-timed / isochronous).
  const countErr = Math.abs(N - moraCount) / moraCount;
  // The nucleus detector is good but not perfect — ±1 beat on a 5-6 mora
  // phrase is essentially correct, so the penalty is gentle (1.0/mora, not
  // the old punishing 1.4) and a one-off detection slip no longer halves
  // the rhythm score.
  const countScore = clamp(1 - 1.0 * countErr, 0, 1);
  let evenness;
  if (N >= 3) {
    const iv = [];
    for (let i = 1; i < N; i++) iv.push(nuclei[i].t - nuclei[i - 1].t);
    const m = iv.reduce((s, v) => s + v, 0) / iv.length;
    const sd = Math.sqrt(iv.reduce((s, v) => s + (v - m) ** 2, 0) / iv.length);
    const cv = m > 0 ? sd / m : 1;                       // coefficient of variation of beat intervals
    // Real mora-timed speech still has cv ≈ 0.3-0.4 (morae aren't metronomic),
    // so we don't demand cv = 0 for full marks: cv ≤ 0.15 → 1, cv ≥ 0.85 → 0.
    evenness = clamp(1 - (cv - 0.15) / 0.70, 0, 1);
  } else {
    evenness = 0;                                        // can't have rhythm with <3 beats
  }
  const rhythm01 = countScore * 0.60 + evenness * 0.40;

  // ── (2) CLARITY — articulation crispness ──
  // Clear speech alternates loud vowels with quieter consonant closures,
  // so the envelope MODULATES. A mumble or a single held vowel is flat.
  // Measure the mean relative valley depth between adjacent nuclei, blend
  // with a signal-above-noise term. (A single loud vowel has high SNR but
  // ~zero modulation → capped clarity, which is correct: it's loud but
  // not articulate.)
  let modDepth = 0;
  if (N >= 2) {
    let sum = 0, cnt = 0;
    for (let i = 1; i < N; i++) {
      let valley = Infinity;
      for (let k = nuclei[i - 1].frame; k <= nuclei[i].frame; k++) if (a.smooth[k] < valley) valley = a.smooth[k];
      const hi = Math.min(nuclei[i - 1].energy, nuclei[i].energy);
      if (hi > 0) { sum += clamp((hi - valley) / hi, 0, 1); cnt++; }
    }
    modDepth = cnt ? sum / cnt : 0;
  }
  const snr = a.noiseFloor > 0
    ? clamp((a.meanVoicedRms - a.noiseFloor) / (a.noiseFloor * 6 + 0.04), 0, 1)
    : loud;
  // Articulation (modDepth) dominates — a single loud vowel ("WHOA") has
  // no inter-mora modulation and so caps low even though it's loud. SNR
  // and audibility contribute only a minority so a crisp-but-quiet read
  // still scores decently while a loud monosyllable does not.
  const clarity01 = clamp(modDepth * 1.6, 0, 1) * 0.72 + snr * 0.18 + audible * 0.10;

  // ── (3) PITCH — H/L contour match, sampled AT the nuclei ──
  // F0 is most stable at vowel centres, so we read pitch at each nucleus
  // rather than in blind windows. Then label H/L against the speaker's
  // own range and compare to the expected pattern, aligning the detected
  // beats to the expected mora positions. If the beat count is way off,
  // the contour can't really be judged → low.
  const pitch01 = scorePitchAtNuclei(ch, sr, nuclei, expectedPitch, a.frameLen);

  // ── (4) NATURALNESS — rate plausibility + balance ──
  // A natural delivery sits at a believable speaking rate (mora/sec) and
  // doesn't have one dimension wildly out of step with the others.
  const voicedSpan = N >= 2 ? (nuclei[N - 1].t - nuclei[0].t) : a.voicedDurationSec;
  const rate = voicedSpan > 0.05 ? (N / voicedSpan) : 0;  // beats per second
  // Comfortable JP speech ≈ 5-9 mora/sec; full credit in 4.5-9.5, falloff outside.
  let rateScore;
  if (rate >= 4.5 && rate <= 9.5) rateScore = 1;
  else if (rate < 4.5) rateScore = clamp(rate / 4.5, 0, 1);
  else rateScore = clamp(1 - (rate - 9.5) / 8, 0, 1);
  const trio01 = (rhythm01 + clarity01 + pitch01) / 3;
  const spread = Math.sqrt(
    ([rhythm01, clarity01, pitch01].reduce((s, v) => s + (v - trio01) ** 2, 0)) / 3
  );
  const balance = clamp(1 - spread * 1.6, 0, 1);
  // Multiplicative, not additive — naturalness can't exceed the trio's own
  // level, and rate/balance only MODULATE it.
  const naturalness01 = trio01 * (0.70 + 0.18 * rateScore + 0.12 * balance);

  // ── CONTENT GATE — multiply delivery by correctness (the user's model:
  // "100 for one, 50 for the other → send out 50"). A smooth logistic in
  // content01 rather than the old steep linear ramp: it SATURATES near 1
  // for a correct attempt (so recognizer slack never punishes real effort)
  // and drops STEEPLY below ~0.4 (so the wrong phrase / gibberish craters).
  // Normalized so perfect content → exactly 1.
  const gate = (() => {
    const k = 8, c0 = 0.40;
    const g = 1 / (1 + Math.exp(-(content01 - c0) * k));
    const gMax = 1 / (1 + Math.exp(-(1 - c0) * k));
    return clamp(g / gMax, 0, 1);
  })();
  // Gentle ease (gamma 0.85) lifts genuinely-good acoustic measures toward
  // the top of the range without inflating mediocre ones — a clean delivery
  // reads in the high 80s instead of being permanently capped in the 70s.
  const ease = x => Math.pow(clamp(x, 0, 1), 0.85);
  // Per-dimension gate weighting:
  //   • Rhythm — timing is partly content-independent (well-timed gibberish
  //     keeps a little), so it carries the gate only ~65%.
  //   • Clarity / Naturalness — "clear, natural delivery of the RIGHT words":
  //     almost fully gated.
  //   • Pitch — right contour on the right words: heavily gated.
  // Because every shown dimension carries the gate, OVERALL (their mean)
  // collapses for the wrong words without any extra multiply that would
  // double-count.
  // Calibration lift (~7%): a strong real attempt's acoustic measures top
  // out around 0.85-0.9 (nucleus detection is ±1, H/L pitch labelling is
  // coarse), so without this an excellent read caps in the low 80s. The
  // lift is multiplicative, so it rewards the high end without resurrecting
  // a crater (gibberish at ~20 stays ~21). Ceilings stay below 100 — a
  // literal perfect verdict is intentionally unreachable (PRODUCT.md §4).
  const LIFT = 1.07;
  const rhythm      = Math.round(clamp(ease(rhythm01)      * (0.35 + 0.65 * gate) * 99 * LIFT, 0, 99));
  const clarity     = Math.round(clamp(ease(clarity01)     * (0.12 + 0.88 * gate) * 97 * LIFT, 0, 98));
  const pitch       = Math.round(clamp(ease(pitch01)       * (0.15 + 0.85 * gate) * 96 * LIFT, 0, 98));
  const naturalness = Math.round(clamp(ease(naturalness01) * (0.12 + 0.88 * gate) * 97 * LIFT, 0, 98));

  const overall = Math.round((rhythm + clarity + pitch + naturalness) / 4);
  // Status flags for the UI ("heard" line + hints):
  //   silent   — essentially no structured speech (no nuclei / near-zero).
  //   noWords  — there WAS sound, STT ran, but recognized nothing.
  const silent = (N === 0) || overall < 8;
  const transcript = (opts.transcript || '').trim();
  const noWords = !silent && opts.sttAvailable && !transcript;
  return {
    rhythm, clarity, pitch, naturalness, overall,
    silent, noWords, accuracy, transcript,
    sttAvailable: !!opts.sttAvailable,
  };
}

// Pitch-contour score (0..1), sampled at the syllable nuclei. F0 is most
// stable at vowel centres, so we read pitch in a window centred on each
// nucleus rather than in blind equal slices. Each detected F0 is labelled
// H/L against the speaker's own range (midpoint of the 20th/80th-pct of
// detected F0 — auto-calibrates to any vocal range and survives skewed
// H/L counts where a median would collapse). The detected beat sequence
// is aligned to the expected mora positions by proportional index so it
// works even when the user produced a few too many / too few beats.
//
// Structural guard: the score is multiplied by how well the beat count
// matched the mora count — a 1-beat "WHOA" can't realize a 6-mora
// contour, so its pitch score stays near zero even if that one beat
// happens to land on the right side of the threshold.
function scorePitchAtNuclei(ch, sr, nuclei, expectedPitch, frameLen) {
  const M = expectedPitch.length;
  const N = nuclei.length;
  if (!M || N < 1) return 0;
  // A wider window (±60ms ≈ 120ms) packs more pitch periods, which the
  // normalized autocorrelation needs to lock confidently onto F0 —
  // especially after the mic's noise-suppression / AGC has scrubbed some
  // of the signal's periodicity. (This was the bug behind a flat 0 pitch:
  // a 90ms window rarely cleared the confidence bar on processed audio, so
  // fewer than two F0 readings survived and the score fell straight to ~0.)
  const half = Math.max(256, Math.floor(sr * 0.060));
  const raw = nuclei.map(nu => {
    const center = nu.frame * frameLen;
    const lo = Math.max(0, center - half);
    const hi = Math.min(ch.length, center + half);
    return estimatePitchHz(ch.subarray(lo, hi), sr);  // { hz, conf }
  });
  // Two-pass confidence gate: take the clearly-voiced readings first; if
  // that leaves fewer than two beats (common on quiet / processed input),
  // relax the bar rather than collapsing the whole dimension to zero.
  function pick(confMin) {
    return raw.map(r => (r.conf > confMin && r.hz > 70 && r.hz < 450) ? r.hz : null);
  }
  let f0 = pick(0.30);
  if (f0.filter(x => x != null).length < 2) f0 = pick(0.20);
  const valid = f0.filter(x => x != null);
  const coverage = valid.length / N;
  // Genuinely couldn't read a contour (e.g. one short beat). Give a small,
  // structure-scaled sliver rather than a hard zero — you DID voice it.
  if (valid.length < 2) return clamp(0.18 * (1 + coverage), 0.05, 0.30);
  // H/L threshold from the speaker's own range. Midpoint of the 20th/80th
  // percentile auto-calibrates to any voice and survives a skewed H/L split
  // (where a plain median would collapse onto one level).
  const sorted = [...valid].sort((x, y) => x - y);
  const lo = sorted[Math.floor(sorted.length * 0.20)];
  const hi = sorted[Math.floor(sorted.length * 0.80)];
  const threshold = (lo + hi) / 2;
  const userLabels = f0.map(h => (h == null ? null : (h >= threshold ? 'H' : 'L')));
  // Align: for each expected mora j, pick the proportionally-nearest beat.
  let agree = 0, total = 0;
  for (let j = 0; j < M; j++) {
    const k = N > 1 ? Math.round((j / (M - 1)) * (N - 1)) : 0;
    if (userLabels[k] == null) continue;
    if (userLabels[k] === expectedPitch[j]) agree++;
    total++;
  }
  if (!total) return clamp(0.18 * (1 + coverage), 0.05, 0.30);
  const agreement = agree / total;        // 0..1, chance ≈ 0.5 for binary H/L
  // Map agreement → shape score. Binary chance (0.5) sits at a modest 0.32
  // (you produced voiced pitch, just not a matching contour) and a clean
  // match (≈0.9+) reaches ~0.92. This is deliberately more generous than
  // before — Japanese pitch steps are only a few semitones, so even a good
  // speaker's H/L labelling lands around 0.8, which should read as good.
  const agree01 = clamp((agreement - 0.50) / 0.50, 0, 1);   // 0.5→0, 1.0→1
  const pitchShape = 0.30 + 0.62 * agree01;
  // Gentle structural / coverage modulation — they trim a poor contour but
  // no longer crush a good one (the old 1.2× count penalty + hard coverage
  // ramp were a big part of why pitch read near zero).
  const countMatch = clamp(1 - 0.8 * (Math.abs(N - M) / M), 0, 1);
  const cov01 = clamp(coverage / 0.6, 0, 1);
  return clamp(pitchShape * (0.60 + 0.40 * countMatch) * (0.70 + 0.30 * cov01), 0, 1);
}

// Pitch detector via NORMALIZED cross-correlation (NCCF) with an
// octave-error guard. Returns { hz, conf } where conf is the NCCF peak
// in 0..1 — ~1 for clearly voiced (periodic) audio, near-zero for noise
// / silence / fricatives. Caller treats conf below ~0.30 as "no pitch."
//
// Two fixes over the naive version that caused an octave-halving bug
// (a 175Hz mora detected as 87.5Hz):
//   (a) Energy-normalized correlation (divide by sqrt of both windows'
//       energy) instead of dividing by overlap length. The old length
//       normalization made LONGER lags score higher, biasing the result
//       toward the sub-harmonic (half the true frequency).
//   (b) Pick the FIRST local-max lag whose NCCF clears 80% of the global
//       max — not the global max itself. The true period is the first
//       strong peak; integer multiples of it (the octave-down errors)
//       are later peaks. Taking the first peak locks onto the fundamental.
function estimatePitchHz(buf, sr) {
  const N = buf ? buf.length : 0;
  if (N < 200) return { hz: 0, conf: 0 };
  const minF = 70, maxF = 420;
  const minLag = Math.floor(sr / maxF);
  const maxLag = Math.min(N - 1, Math.floor(sr / minF));
  if (maxLag <= minLag) return { hz: 0, conf: 0 };
  // Prefix sum of squares → O(1) energy of any prefix window.
  const pref = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) pref[i + 1] = pref[i] + buf[i] * buf[i];
  if (pref[N] < 1e-5) return { hz: 0, conf: 0 };
  const nccf = new Float64Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    const lim = N - lag;
    let corr = 0;
    for (let i = 0; i < lim; i++) corr += buf[i] * buf[i + lag];
    const e1 = pref[lim];                 // energy of buf[0..lim)
    const e2 = pref[lim + lag] - pref[lag]; // energy of buf[lag..lag+lim)
    const denom = Math.sqrt(e1 * e2);
    nccf[lag] = denom > 1e-9 ? corr / denom : 0;
  }
  let gmax = 0;
  for (let lag = minLag; lag <= maxLag; lag++) if (nccf[lag] > gmax) gmax = nccf[lag];
  // Compute the period down to a low confidence and let the CALLER decide
  // the cutoff (scorePitchAtNuclei runs a strict pass then a relaxed one).
  // Returning hz:0 too eagerly here was starving that relaxed pass.
  if (gmax < 0.18) return { hz: 0, conf: gmax };
  const thresh = 0.80 * gmax;
  let chosen = 0;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (nccf[lag] >= thresh && nccf[lag] >= nccf[lag - 1] && nccf[lag] >= nccf[lag + 1]) {
      chosen = lag; break;
    }
  }
  if (!chosen) {
    // Fallback: global argmax.
    for (let lag = minLag; lag <= maxLag; lag++) if (nccf[lag] === gmax) { chosen = lag; break; }
  }
  if (!chosen) return { hz: 0, conf: gmax };
  return { hz: sr / chosen, conf: gmax };
}

// ── Studio wiring ────────────────────────────────────────────────────
function wireSpeakingStudio(cat, phrase) {
  const root = document.querySelector('.speaking-studio');
  if (!root) return;

  // Auto-play the model once on phrase mount (per pedagogical pillar
  // §5.1 "Listen first, twice" — auto once, replay on demand).
  const fullKana = (phrase.chunks || []).map(c => (c.mora || []).join('')).join(' ');
  // Run after layout settles + voices load — but only if autoplay is on
  // (settings → Display → Auto-play phrases).
  if (APP.speakingAutoplay) {
    setTimeout(() => {
      if (typeof TTS !== 'undefined' && TTS.speak) TTS.speak(fullKana);
    }, 300);
  }

  // Replay-model button.
  const replayBtn = root.querySelector('#speaking-play-original');
  if (replayBtn) replayBtn.addEventListener('click', () => {
    if (typeof TTS !== 'undefined' && TTS.speak) TTS.speak(fullKana);
  });

  // Voice picker — opens the shared voice/volume/speed popover anchored to
  // the icon. It reads/writes APP.ttsVoiceURI, so the choice is the same
  // default the Settings voice dropdown uses (changing one changes both).
  const voiceOpenBtn = root.querySelector('#speaking-voice-open');
  if (voiceOpenBtn && typeof toggleAudioSettingsPopover === 'function') {
    voiceOpenBtn.addEventListener('click', (e) => toggleAudioSettingsPopover(e, voiceOpenBtn));
  }

  // Autoplay toggle — flips APP.speakingAutoplay (the same flag Settings →
  // "Auto-play phrases" controls, so the two stay in sync). Takes effect on
  // the next phrase load.
  const autoplayToggle = root.querySelector('#speaking-autoplay-toggle');
  if (autoplayToggle) autoplayToggle.addEventListener('click', () => {
    APP.speakingAutoplay = !APP.speakingAutoplay;
    lsSet('jp:speakingAutoplay', APP.speakingAutoplay);
    autoplayToggle.setAttribute('aria-checked', String(APP.speakingAutoplay));
  });

  // STT-engine pill (right of the mic) — flips APP.gcloudStt (Cloud ⇄
  // Browser), the same flag Settings → "Cloud speech recognition" controls.
  // With no key there's nothing to switch to, so it opens Settings to add
  // one. Applies to the next recording.
  const sttPick = root.querySelector('#speaking-stt-pick');
  if (sttPick) sttPick.addEventListener('click', () => {
    if (!APP.gcloudTtsKey) {
      if (typeof openSettingsModal === 'function') openSettingsModal();
      return;
    }
    APP.gcloudStt = (APP.gcloudStt === false);   // flip; default on
    lsSet('jp:gcloudStt', APP.gcloudStt);
    const cloud = APP.gcloudStt !== false;
    sttPick.dataset.engine = cloud ? 'cloud' : 'browser';
    const lbl = sttPick.querySelector('.stt-pick-label');
    if (lbl) lbl.textContent = cloud ? 'API' : 'Browser';
    sttPick.setAttribute('aria-label', 'Speech recognition engine: ' + (cloud ? 'Google Cloud STT API' : 'browser'));
  });

  // User-playback (after recording exists).
  const userPlayBtn = root.querySelector('#speaking-play-user');
  if (userPlayBtn) userPlayBtn.addEventListener('click', () => {
    if (!APP.speakingUserBuffer) return;
    // Reuse ONE playback AudioContext instead of allocating a fresh one per
    // tap. The old code new'd a context each click and only closed it in
    // src.onended — so navigating away (or re-tapping) mid-playback stranded
    // the context unclosed, and browsers cap concurrent contexts (~6), so the
    // studio would eventually fail to play. setSection closes this on leave.
    let ctx = APP._speakingPlayCtx;
    if (!ctx || ctx.state === 'closed') {
      ctx = APP._speakingPlayCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    // Stop any in-flight playback so rapid taps don't overlap or leak a source.
    if (APP._speakingPlaySrc) { try { APP._speakingPlaySrc.stop(); } catch (e) {} }
    const src = ctx.createBufferSource();
    APP._speakingPlaySrc = src;
    src.buffer = APP.speakingUserBuffer;
    src.connect(ctx.destination);
    src.onended = () => { if (APP._speakingPlaySrc === src) APP._speakingPlaySrc = null; };
    src.start();
  });

  // Mic button.
  const micBtn = root.querySelector('#speaking-mic');
  const micLabelJa = root.querySelector('#speaking-mic-label-ja');
  const micLabelEn = root.querySelector('#speaking-mic-label-en');
  const userSvg = root.querySelector('#waveform-user-svg');
  const userDur = root.querySelector('#waveform-user-duration');
  if (micBtn) micBtn.addEventListener('click', async () => {
    if (SpeakingRecorder.isRecording()) {
      SpeakingRecorder.stop();
      return;
    }
    micBtn.dataset.state = 'requesting';
    if (micLabelJa) micLabelJa.innerHTML = '<ruby>準備<rt>じゅんび</rt></ruby><ruby>中<rt>ちゅう</rt></ruby>…';
    if (micLabelEn) micLabelEn.textContent = 'Preparing…';
    try {
      await SpeakingRecorder.start(({ audioBuffer, duration, transcript, sttAvailable }) => {
        // Recording finished. Compute scores (with the STT transcript as
        // the content signal) + draw real waveform.
        APP.speakingUserBuffer = audioBuffer;
        const scores = scoreSpeakingAttempt(phrase, audioBuffer, duration, { transcript, sttAvailable });
        APP.speakingScores = scores;
        if (userSvg && audioBuffer) {
          userSvg.innerHTML = realWaveformPath(audioBuffer, 'var(--waveform-user)');
        }
        if (userDur) {
          const m = Math.floor(duration / 60), s = Math.round(duration % 60);
          userDur.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
        if (userPlayBtn) userPlayBtn.disabled = false;
        // Silent-recording hint — no substantial sound in the input.
        const silentHint = root.querySelector('#speaking-silent-hint');
        if (silentHint) silentHint.hidden = !(scores && scores.silent);
        // "Heard" line — show the recognized transcript, or the relevant
        // explanation when there's nothing to show.
        const heard = root.querySelector('#speaking-heard');
        const heardText = root.querySelector('#speaking-heard-text');
        if (heard && heardText) {
          if (scores.silent) {
            heard.hidden = true;                       // silent-hint covers this case
          } else if (scores.transcript) {
            heard.hidden = false;
            heard.dataset.state = 'ok';
            heardText.innerHTML = '「' + furiganaTranscript(scores.transcript, phrase) + '」';
          } else if (scores.noWords) {
            heard.hidden = false;
            heard.dataset.state = 'nowords';
            heardText.textContent = 'I caught sound but couldn’t make out any words — try again, a little clearer.';
          } else if (!scores.sttAvailable) {
            heard.hidden = false;
            heard.dataset.state = 'unavailable';
            heardText.textContent = 'Speech recognition isn’t available in this browser — scored on sound only. (Try Chrome or Edge for word matching.)';
          } else {
            heard.hidden = true;
          }
        }
        // Rerender scores in place (don't full-rerender the studio —
        // that would lose the user waveform we just drew).
        updateSpeakingScoresInPlace();
        micBtn.dataset.state = 'idle';
        if (micLabelJa) micLabelJa.innerHTML = '<ruby>録音<rt>ろくおん</rt></ruby>する';
        if (micLabelEn) micLabelEn.textContent = 'Tap to Record';
      });
      // Clear any prior hints when a new recording starts.
      const silentHintReset = root.querySelector('#speaking-silent-hint');
      if (silentHintReset) silentHintReset.hidden = true;
      const heardReset = root.querySelector('#speaking-heard');
      if (heardReset) heardReset.hidden = true;
      micBtn.dataset.state = 'recording';
      if (micLabelJa) micLabelJa.innerHTML = '<ruby>録音<rt>ろくおん</rt></ruby><ruby>中<rt>ちゅう</rt></ruby>…';
      if (micLabelEn) micLabelEn.textContent = 'Recording';
    } catch (e) {
      micBtn.dataset.state = 'denied';
      if (micLabelJa) micLabelJa.innerHTML = 'マイク<ruby>許可<rt>きょか</rt></ruby>なし';
      if (micLabelEn) micLabelEn.textContent = 'Mic permission needed';
      console.warn('Mic recording failed:', e);
    }
  });

  // Filmstrip clicks.
  root.querySelectorAll('[data-speaking-phrase]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.speakingPhrase;
      if (id === APP.speakingPhraseId) return;
      APP.speakingPhraseId = id;
      lsSet('jp:speakingPhrase', id);
      stopAndForgetUserRecording();
      renderSpeaking(document.getElementById('main-inner'));
    });
  });
  // Center the current phrase in the vertical Up Next list (scroll the
  // track itself, not the page).
  (() => {
    const track = root.querySelector('.filmstrip-track');
    const cur = root.querySelector('.filmstrip-item.is-current');
    if (track && cur) {
      track.scrollTop = Math.max(0, cur.offsetTop - track.clientHeight / 2 + cur.offsetHeight / 2);
    }
  })();
  // Walk arrows.
  root.querySelectorAll('[data-speaking-walk]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = parseInt(btn.dataset.speakingWalk, 10) || 0;
      const idx = cat.phrases.findIndex(p => p.id === phrase.id);
      const next = cat.phrases[(idx + dir + cat.phrases.length) % cat.phrases.length];
      if (next && next.id !== phrase.id) {
        APP.speakingPhraseId = next.id;
        lsSet('jp:speakingPhrase', next.id);
        stopAndForgetUserRecording();
        renderSpeaking(document.getElementById('main-inner'));
      }
    });
  });

  // Keyboard navigation.
  root.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft')        { e.preventDefault(); root.querySelector('[data-speaking-walk="-1"]').click(); }
    else if (e.key === 'ArrowRight')  { e.preventDefault(); root.querySelector('[data-speaking-walk="+1"]').click(); }
    else if (e.key === ' ' || e.key === 'Enter') {
      // Space / Enter on the practice surface = replay model. Mic activates
      // via mouse/touch only — accidental spacebar should NOT start the mic.
      if (document.activeElement === root || document.activeElement === document.body) {
        e.preventDefault();
        if (typeof TTS !== 'undefined' && TTS.speak) TTS.speak(fullKana);
      }
    }
  });
  // Mount focus so the keyboard handler picks up arrow keys.
  setTimeout(() => { if (root && document.activeElement === document.body) root.focus({ preventScroll: true }); }, 100);
}

// Update score chips in place after a recording lands — avoids a full
// re-render that would lose the user's waveform.
function updateSpeakingScoresInPlace() {
  const root = document.querySelector('.speaking-studio');
  if (!root) return;
  const s = APP.speakingScores || {};
  ['rhythm','clarity','pitch','naturalness'].forEach(k => {
    const chip = root.querySelector(`.score-chip[data-score-dim="${k}"]`);
    if (!chip) return;
    const dots = chip.querySelectorAll('.dot');
    const filled = s[k] == null ? 0 : Math.max(0, Math.min(5, Math.round(s[k] / 20)));
    dots.forEach((d, i) => d.classList.toggle('is-filled', i < filled));
    const dotsHost = chip.querySelector('.score-chip-dots');
    if (dotsHost) dotsHost.setAttribute('aria-label', s[k] == null ? 'not yet scored' : s[k] + ' out of 100');
  });
  const overallEl = root.querySelector('.score-overall');
  if (overallEl) {
    const has = s.overall != null;
    overallEl.dataset.hasScore = String(has);
    const num = overallEl.querySelector('.score-overall-num');
    if (num) num.textContent = has ? s.overall : '—';
  }
}

// ════════════════════════════════════════════════════════════════════════
// ── Pitch & Tones basics page ───────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════
// Teaching companion for the speaking sub-system. Single editorial scroll
// under Writing. Worked examples of the four canonical patterns +
// notation legend. Spec: 2026-05-28-speaking.DESIGN.md §6.6.
function renderWritingPitch(container) {
  const examples = [
    {
      pattern: 'heiban', accent: 0,
      word: { mora: ['さ','く','ら'], pitch: ['L','H','H'] },
      particle: { mora: ['が'], pitch: ['H'] },
      say: '桜が',
      headEn: 'sakura — cherry blossom',
      desc: 'Heiban (平板) is flat — the pitch rises after the first mora and stays high. The following particle stays high too. Most Japanese nouns are heiban.',
    },
    {
      pattern: 'atamadaka', accent: 1,
      word: { mora: ['は','し'], pitch: ['H','L'] },
      particle: { mora: ['が'], pitch: ['L'] },
      say: '箸が',
      headEn: 'hashi [1] — chopsticks',
      desc: 'Atamadaka (頭高) is head-high — the FIRST mora is high, then drops. The fall comes immediately after mora 1. はし with this pitch means "chopsticks."',
    },
    {
      pattern: 'nakadaka', accent: 2,
      word: { mora: ['は','し'], pitch: ['L','H'] },
      particle: { mora: ['が'], pitch: ['L'] },
      say: '橋が',
      headEn: 'hashi [2] — bridge',
      desc: 'Nakadaka (中高) drops somewhere in the middle (or at the end of) the word. はし with the drop AFTER mora 2 means "bridge" — the particle が catches the fall.',
    },
    {
      pattern: 'odaka', accent: 2,
      word: { mora: ['は','な'], pitch: ['L','H'] },
      particle: { mora: ['が'], pitch: ['L'] },
      say: '花が',
      headEn: 'hana — flower',
      desc: 'Odaka (尾高) looks flat on the word alone — は-な both rise — and only reveals the drop on the NEXT particle: は-な-↓が. The classic pair is 花 (flower, odaka) vs 鼻 (nose, heiban): identical said alone, but 花が falls on が while 鼻が stays high.',
    },
  ];
  // Common Japanese pitch-accent / intonation notations the learner will
  // see in other materials.
  const notationLegend = [
    { glyph: '￣', name: 'High plateau', desc: 'The OJAD line above kana marks the high-pitch run. Mora under it are H; mora outside it are L.' },
    { glyph: '↓', name: 'Down-step',     desc: 'A vertical drop at the end of a high plateau. The next mora is L, even if visually it sits on the same baseline.' },
    { glyph: '↑', name: 'Rising tone',   desc: 'Question intonation. Add an upward sweep at the END of a sentence to mark it as a question, even without か.' },
    { glyph: '／', name: 'Pause',         desc: 'A small breath between words or phrases. Written as a space in this app; spoken as a brief silence (~100-150ms).' },
    { glyph: '＝', name: 'Long sustain',  desc: 'A held vowel or katakana long mark (ー). The mora is held for two beats but stays at the same pitch.' },
  ];

  container.innerHTML = `
    <div class="pitch-page">
      <div class="page-head">
        <div class="page-eyebrow">pitch accent · 抑揚</div>
        <h1 class="page-title-jp"><ruby>抑揚<rt>よくよう</rt></ruby><span class="title-conj">と</span>トーン</h1>
        <div class="page-title-en">How Japanese rises and falls — and why it matters.</div>
        <div class="rule"></div>
      </div>

      <section class="pitch-section">
        <h2 class="pitch-section-title">
          <span class="num">一</span>
          <span class="ja">どうしてピッチが大切？</span>
          <span class="en"><em>Why pitch matters</em></span>
        </h2>
        <div class="pitch-section-body">
          <p>
            Japanese is a <strong>mora-timed, pitch-accented</strong> language. Unlike English (which uses stress
            — louder syllables) Japanese uses <em>pitch</em> — higher or lower mora — to mark meaning. Every word has
            a pitch pattern, and changing it can change the word entirely.
          </p>
          <p>
            The classic example is <ruby>橋<rt>はし</rt></ruby> (a bridge), <ruby>箸<rt>はし</rt></ruby> (chopsticks),
            and <ruby>端<rt>はし</rt></ruby> (an edge). All three are pronounced <em>hashi</em>. The pitch decides which —
            tap the speaker on each card to hear it (how clearly they differ depends on your device's Japanese voice).
          </p>
        </div>
        <div class="pitch-trio">
          ${['edge','bridge','chopsticks'].map((meaning, i) => {
            const pp = ['heiban','nakadaka','atamadaka'][i];
            const acc = [0,2,1][i];
            const wPitch = [['L','H'],['L','H'],['H','L']][i];
            const partPitch = [['H'],['L'],['L']][i];
            return `
              <article class="pitch-trio-card" data-pattern="${pp}">
                <div class="pitch-trio-glyph">
                  ${renderMoraRow({ mora:['は','し'], pitch: wPitch })}
                  <span class="pitch-trio-gap" aria-hidden="true">&nbsp;</span>
                  ${renderMoraRow({ mora:['が'], pitch: partPitch })}
                </div>
                ${renderPitchPatternChip(pp, acc)}
                <p class="pitch-trio-gloss">
                  <span class="ja">${escHTML(['端','橋','箸'][i])}</span>
                  <span class="en"><em>${escHTML(meaning)}</em></span>
                </p>
                <button class="tts-btn pitch-trio-tts" type="button"
                        aria-label="${escAttr('Hear ' + ['端','橋','箸'][i] + 'が — ' + meaning)}"
                        title="読み上げ (listen)"
                        data-speak="${escAttr(['端','橋','箸'][i] + 'が')}">
                  ${speakerIconSVG()}
                </button>
              </article>`;
          }).join('')}
        </div>
      </section>

      <section class="pitch-section">
        <h2 class="pitch-section-title">
          <span class="num">二</span>
          <span class="ja">よっつのパターン</span>
          <span class="en"><em>The four patterns</em></span>
        </h2>
        <div class="pitch-section-body">
          <p>
            Tokyo-standard Japanese has exactly four pitch accent patterns. Once you can hear the four, you can hear
            every word. The number in brackets <code>[n]</code> tells you how many mora are high before the drop —
            <code>[0]</code> means no drop (heiban), <code>[1]</code> means drop right after the first mora, etc.
          </p>
        </div>
        <div class="pitch-examples">
          ${examples.map(ex => `
            <article class="pitch-example" data-pattern="${ex.pattern}">
              <header class="pitch-example-head">
                ${renderPitchPatternChip(ex.pattern, ex.accent)}
                <button class="pitch-example-play" type="button"
                        data-speak="${escAttr(ex.say || (ex.word.mora.join('') + ex.particle.mora.join('')))}"
                        aria-label="Play the example">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20"/></svg>
                </button>
              </header>
              <div class="pitch-example-glyph">
                ${renderMoraRow(ex.word)}
                <span class="pitch-example-gap" aria-hidden="true">&nbsp;</span>
                ${renderMoraRow(ex.particle)}
              </div>
              <p class="pitch-example-en"><em>${escHTML(ex.headEn)}</em></p>
              <p class="pitch-example-desc">${escHTML(ex.desc)}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="pitch-section">
        <h2 class="pitch-section-title">
          <span class="num">三</span>
          <span class="ja">きごう</span>
          <span class="en"><em>Notation legend</em></span>
        </h2>
        <div class="pitch-section-body">
          <p>
            Common marks you'll see across textbooks and dictionaries. This app uses the OJAD-style line above the
            mora row — high mora sit under the line, low mora outside it.
          </p>
        </div>
        <dl class="pitch-legend">
          ${notationLegend.map(n => `
            <div class="pitch-legend-row">
              <dt><span class="pitch-legend-glyph">${escHTML(n.glyph)}</span><span class="pitch-legend-name">${escHTML(n.name)}</span></dt>
              <dd>${escHTML(n.desc)}</dd>
            </div>
          `).join('')}
        </dl>
      </section>

      <section class="pitch-section">
        <h2 class="pitch-section-title">
          <span class="num">四</span>
          <span class="ja">かきかた</span>
          <span class="en"><em>Notation shortcut</em></span>
        </h2>
        <div class="pitch-section-body">
          <p>
            You can write pitch accent inline anywhere on this site. Type a kana word followed by a brace of
            <strong>H</strong> / <strong>L</strong> marks — one per mora — and it renders the line over the kana:
          </p>
          <pre class="pitch-markup-code" data-no-pitch>ありがとう{LHLLL}</pre>
          <p>…turns into: ありがとう{LHLLL}</p>
          <p>
            <strong>L</strong> stands for <em>low</em>, <strong>H</strong> for <em>high</em>. One mark per mora —
            small kana fuse to the mora before them (きょ is one), and ー, っ, ん each count on their own.
            Write the reading in <em>kana</em> (kanji don't split into mora). A few more:
            にほんご{LHHHH} (heiban), わたし{LHL} (nakadaka), あめ{HLL} (atamadaka), おすし{LHL} (the sushi word).
          </p>
        </div>
      </section>

      <section class="pitch-section pitch-section-cta">
        <p class="pitch-cta-prompt">Ready to practice?</p>
        <button class="pitch-cta-btn" type="button" data-jump-speaking>
          <span class="ja">話す</span>
          <span class="en"><em>Speaking · Shadowing Studio</em></span>
        </button>
      </section>
    </div>`;

  // Render any inline かな{HL} markup in the prose (the "notation shortcut"
  // section above relies on this). data-no-pitch on the <pre> keeps the
  // literal syntax example un-rendered so the learner sees what to type.
  if (typeof pitchify === 'function') pitchify(container);

  // Wire example play buttons → TTS.
  container.querySelectorAll('.pitch-example-play[data-speak]').forEach(btn => {
    btn.addEventListener('click', () => {
      const txt = btn.dataset.speak;
      if (txt && typeof TTS !== 'undefined' && TTS.speak) TTS.speak(txt);
    });
  });
  // CTA → jump to speaking section.
  const ctaBtn = container.querySelector('[data-jump-speaking]');
  if (ctaBtn) ctaBtn.addEventListener('click', () => setSection('speaking'));
}

// ── Init ─────────────────────────────────────────────────────────────────
function init() {
  // Mark the persisted vocab book as fresh-entry so its page-entrance
  // choreography plays on first paint (matches the feel of clicking it
  // from the sidebar). Sidebar/strip clicks set this flag too via
  // resetBookEntryState(). The wire handlers consume + clear it.
  window.__bookEntranceFlag = APP.vocabBookId;
  applyBodyClasses();
  const appCl = document.querySelector('.app').classList;
  appCl.toggle('show-vocab-sidebar', APP.section === 'vocab');
  appCl.toggle('show-flash-sidebar', APP.section === 'flashcards');
  appCl.toggle('show-writing-sidebar', APP.section === 'writing');
  appCl.toggle('show-speaking-sidebar', APP.section === 'speaking');
  appCl.toggle('show-library-sidebar', APP.section === 'library');
  appCl.toggle('show-particles-sidebar', shouldShowParticlesSidebar());
  renderSidebar();
  renderMain();
  initSettings();
  initPopover();
  initTier3BrushPositioning();
  attachVocabDrawerEvents();
  attachCardModalEvents();
}

document.addEventListener('DOMContentLoaded', init);
