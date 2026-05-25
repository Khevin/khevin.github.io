// Particle "curiosity" articles — short reads that explain the WHY
// behind specific quirks of Japanese particles. Each article complements
// the lessons but doesn't depend on them; you can read articles to
// scratch a specific itch ("why is は pronounced wa?") without committing
// to a full lesson.
//
// Each article:
//   id           : stable slug
//   num          : ordinal (catalog order)
//   titleJa      : Japanese title (descriptive — particle prefix is rendered from `particles`)
//   titleEn      : English title
//   particles[]  : which particles this article touches (drives chips)
//   time         : reading estimate
//   summary      : 1–2 sentence pitch shown on the card
//   after        : optional — which lesson this best follows (id), surfaced in detail header
//   body         : HTML body of the article (rich text with h3, p, examples, etc.)

window.PARTICLE_ARTICLES = [

  // ═══════════════════════════════════════════════════════════════════════
  // Article 1 — pronunciation: は/wa, へ/e, を/o
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:'article-01-pronunciation',
    num:1,
    titleJa:'読み方の謎',
    titleEn:'Why は is wa, へ is e, を is o',
    particles:['は','へ','を'],
    time:'4 min',
    summary:'Three particles you see constantly are spelled one way and pronounced another. The reason isn\'t random — it\'s a frozen snapshot of how Japanese sounds drifted over a thousand years.',
    after:'lesson-01-wa-intro',
    body:`
      <p>Three particles in modern Japanese have a quirk that trips up every beginner: they\'re <b>spelled one way</b> and <b>pronounced another</b>.</p>
      <ul class="article-list">
        <li><span class="ja">は</span> as a particle is pronounced <i>wa</i>, not <i>ha</i>.</li>
        <li><span class="ja">へ</span> as a particle is pronounced <i>e</i>, not <i>he</i>.</li>
        <li><span class="ja">を</span> is pronounced <i>o</i>, identical to <span class="ja">お</span>.</li>
      </ul>
      <p>If you\'ve been wondering why — the short answer is <b>history</b>. The long answer is fascinating.</p>

      <h3>The big picture: sounds drift, spelling freezes</h3>
      <p>Languages change over centuries — sounds soften, vowels shift, consonants disappear. Spelling, by contrast, is conservative: once writers settle on a way to render a word, that spelling sticks around long after the pronunciation has wandered off.</p>
      <p>English does this constantly. <i>Knight</i> used to be pronounced "k-nicht" — the K was audible and the GH was a hard German-style /ç/. Modern speakers say "nite," but the K and GH live on as silent letters, fossils of a previous era.</p>
      <p>Japanese went through the same process. The 1946 spelling reform fixed most of the drift — but for three particles, the old spelling was kept because the reform planners deemed them too embedded in everyday writing to change without breaking literacy overnight.</p>

      <h3>は read "wa"</h3>
      <p>In Old Japanese (8th century), the <span class="ja">は</span>-row kana (<span class="ja">は ひ ふ へ ほ</span>) were pronounced with a clear <b>/p/</b> sound — pa pi pu pe po. Over centuries, the /p/ softened, first to /ɸ/ (the airy "fu" sound you still hear in <span class="ja">富士</span> Fuji), and then to /h/ (ha hi hu he ho). That\'s how we got modern <span class="ja">は</span> = <i>ha</i> inside ordinary words.</p>
      <p>But when <span class="ja">は</span> sat between two words as a particle, it took an even softer path — straight to <b>/wa/</b>. By the time the 1946 reform happened, every Japanese speaker pronounced the topic particle as <i>wa</i>, but writers had been spelling it <span class="ja">は</span> for a thousand years.</p>
      <p>The reform committee considered changing the spelling to <span class="ja">わ</span> to match pronunciation. They chose not to — the topic particle appears in every other sentence, and changing it would have made all existing texts feel broken overnight. So we get the rule: <b>spelled <span class="ja">は</span>, pronounced <i>wa</i>, when it\'s a particle.</b></p>

      <h3>へ read "e"</h3>
      <p>Same story, narrower scope. <span class="ja">へ</span> went /pe/ → /ɸe/ → /he/ in ordinary words. As a directional particle, it softened to /e/. Reform left the spelling alone because <span class="ja">へ</span> as "to/toward" was too frequent in writing to disrupt.</p>

      <h3>を read "o"</h3>
      <p>This one\'s the cleanest. <span class="ja">を</span> originally pronounced <i>/wo/</i>, softened to /o/, and ended up sounding identical to <span class="ja">お</span>. The reform faced a real choice here: <span class="ja">を</span> appears almost <i>only</i> as the object particle in modern Japanese — it\'s no longer part of any common word. Why keep a special kana that sounds exactly like <span class="ja">お</span>?</p>
      <p>The answer is <b>readability</b>. By preserving <span class="ja">を</span> uniquely for the direct-object particle, the reform let readers scan a paragraph and locate every direct object instantly — the eye finds <span class="ja">を</span> and knows: "that\'s what the verb is acting on." Spelling reform usually optimizes for writers; here it optimized for readers.</p>

      <h3>The takeaway</h3>
      <p>The "weird" pronunciations are actually orderly. They preserve <b>historical spelling</b> for the three particles you\'ll see most. Once you know the rule — spelled-as-the-old, pronounced-as-the-new — you stop second-guessing it.</p>
      <p>And the next time someone tells you Japanese spelling is illogical, you can point at English\'s silent K\'s and GH\'s and say "we\'re all in the same boat."</p>
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Article 2 — particles vs prepositions
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:'article-02-particles-vs-prepositions',
    num:2,
    titleJa:'助詞と前置詞',
    titleEn:'Particles vs prepositions — why Japanese marks the end',
    particles:['に','で','を','と'],
    time:'5 min',
    summary:'English puts little markers before the noun ("to school," "with chopsticks"). Japanese puts them after. This isn\'t a cosmetic difference — it changes what word order can do.',
    body:`
      <p>English speakers internalize a rule so deeply they forget it\'s a rule: little function-words (to, with, on, from, by) sit <b>before</b> the noun they\'re marking. <i>To</i> school. <i>With</i> a pencil. <i>On</i> the desk. These are called <b>prepositions</b> — pre = "before."</p>
      <p>Japanese inverts that. Every marker sits <b>after</b> the noun:</p>
      <ul class="article-list">
        <li>学校<b class="pc" style="color:#3a7a4a">に</b>行く — school-to go</li>
        <li>鉛筆<b class="pc" style="color:#2e7a3f">で</b>書く — pencil-with write</li>
        <li>机<b class="pc" style="color:#c43a4a">の</b>上<b class="pc" style="color:#3a7a4a">に</b>ある — desk-of-top-on exists</li>
      </ul>
      <p>Same job, opposite position. The category name flips too: <b>particles</b> (no "pre-" prefix — they\'re after).</p>
      <p>The position swap looks cosmetic. It isn\'t. It reshapes what the rest of the language can do.</p>

      <h3>Word order becomes flexible</h3>
      <p>In English, "John ate sushi" and "Sushi ate John" mean completely different things. Word order <i>is</i> the marker — the noun before the verb is the subject; the noun after is the object. Move one, lose everything.</p>
      <p>Japanese can\'t lose track. The role is glued to each noun via its particle:</p>
      <ul class="article-list">
        <li>太郎<b class="pc" style="color:#c97a2c">が</b>寿司<b class="pc" style="color:#5a2e8a">を</b>食べた。</li>
        <li>寿司<b class="pc" style="color:#5a2e8a">を</b>太郎<b class="pc" style="color:#c97a2c">が</b>食べた。</li>
      </ul>
      <p>Both mean "Taro ate sushi." The <span class="ja"><b style="color:#c97a2c">が</b></span> says "this is the subject" wherever Taro sits in the sentence; the <span class="ja"><b style="color:#5a2e8a">を</b></span> says "this is the object" wherever sushi sits. Word order becomes a tool for <b>emphasis</b> and <b>rhythm</b>, not grammar. Want to foreground the object? Start with it. Want a poetic effect? Move things around.</p>

      <h3>Verbs go at the end — and that\'s fine</h3>
      <p>Once roles are particle-marked, the verb can wait until the very end without confusing anyone. Listeners hold the nouns in mind — each one carrying its little role-tag — and the verb arrives last to tie them together. This is why Japanese feels like it\'s "saving the punchline" to native English speakers, and it\'s also why interrupting a Japanese sentence is harder: the meaning isn\'t fully formed until the verb lands.</p>

      <h3>Particles are shorter than they look</h3>
      <p>Beginners feel particles add complexity. Compare:</p>
      <ul class="article-list">
        <li>English: <i>from the station to the school</i> — 6 words, 2 articles, 2 prepositions</li>
        <li>Japanese: <span class="ja">駅<b class="pc" style="color:#a04a8a">から</b>学校<b class="pc" style="color:#3a7a8a">まで</b></span> — 6 characters, 2 particles, no articles</li>
      </ul>
      <p>Particles do more with less. They also skip English\'s annoying "is the article needed here? definite or indefinite?" choices — Japanese just doesn\'t have articles to argue about.</p>

      <h3>The shift in thinking</h3>
      <p>Stop translating word-by-word from English. Read the noun, then look at its particle, and you know its role. The whole sentence becomes Lego: nouns + role-markers + verb. Once the chunks click together, Japanese stops feeling backwards and starts feeling <i>direct</i>.</p>
    `,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Article 3 — why question words always take が
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:'article-03-question-words-take-ga',
    num:3,
    titleJa:'疑問詞は必ずが',
    titleEn:'Why every question word takes が — never は',
    particles:['は','が'],
    time:'4 min',
    summary:'This is the single most common particle mistake beginners make: 誰は来ましたか? — it\'s not just unusual, it\'s nonsense. Here\'s why, in one short read.',
    after:'lesson-02-ga-vs-wa',
    body:`
      <p>You\'ll meet this mistake in every beginner classroom: a student trying to say "who came?" produces <span class="ja">誰は来ましたか?</span> The teacher gently corrects it to <span class="ja">誰<b class="pc" style="color:#c97a2c">が</b>来ましたか?</span> and moves on.</p>
      <p>If you\'ve been told "use <span class="ja">が</span>, not <span class="ja">は</span>, with question words" without a real explanation — here\'s the why, in one short read.</p>

      <h3>は means "as for X"</h3>
      <p>Lesson 1 taught you the mental translation: every time you see <span class="ja"><b style="color:#8a2538">は</b></span>, read it as "<i>as for X…</i>" <span class="ja">私<b style="color:#8a2538">は</b></span> → "as for me…" <span class="ja">今日<b style="color:#8a2538">は</b></span> → "as for today…"</p>
      <p>The point of <span class="ja">は</span> is to <b>set up something the listener already knows about</b>. You can\'t talk "about" something the listener doesn\'t know exists yet.</p>

      <h3>Question words are inherently unknown</h3>
      <p>What does a question word mean?</p>
      <ul class="article-list">
        <li><span class="ja">誰</span> = "who" — the asker doesn\'t know who</li>
        <li><span class="ja">何</span> = "what" — the asker doesn\'t know what</li>
        <li><span class="ja">どれ</span> = "which one" — the asker doesn\'t know which</li>
      </ul>
      <p>Now plug <span class="ja"><b style="color:#8a2538">は</b></span> into <span class="ja">誰<b style="color:#8a2538">は</b>来ましたか?</span>. You\'re literally saying: <i>"as for who, did they come?"</i> But you can\'t set up "who" as the topic — the whole point of asking is that "who" is unknown. The sentence collapses semantically before it\'s even finished.</p>
      <p>So we reach for <span class="ja"><b style="color:#c97a2c">が</b></span> — the <b>new-information</b> particle. <span class="ja">が</span> is exactly the particle for identification, for asking "which one," for marking new arrivals into the conversation. Question words and <span class="ja">が</span> are a perfect fit.</p>

      <h3>The answer follows the same rule</h3>
      <p>When you answer with new information, the answer also takes <span class="ja"><b style="color:#c97a2c">が</b></span>:</p>
      <ul class="article-list">
        <li>Q: <span class="ja">誰<b class="pc" style="color:#c97a2c">が</b>来ましたか?</span></li>
        <li>A: <span class="ja">田中さん<b class="pc" style="color:#c97a2c">が</b>来ました。</span> — "Tanaka came." (Tanaka is the new info — answers "who.")</li>
      </ul>
      <p>But once Tanaka is established as a known person, subsequent mentions switch to <span class="ja"><b style="color:#8a2538">は</b></span>:</p>
      <ul class="article-list">
        <li>Q: <span class="ja">田中さん<b class="pc" style="color:#8a2538">は</b>何をしましたか?</span> — "As for Tanaka, what did he do?"</li>
        <li>A: <span class="ja">田中さん<b class="pc" style="color:#8a2538">は</b>来ました。</span> — comment on the now-known topic.</li>
      </ul>

      <h3>The one rule to remember</h3>
      <p><b>Question words = identification = <span class="ja">が</span>.</b></p>
      <p>Answers that supply <i>new</i> info — same rule, <span class="ja"><b style="color:#c97a2c">が</b></span>. Later references back to the now-known thing — switch to <span class="ja"><b style="color:#8a2538">は</b></span>.</p>
      <p>If you remember nothing else: never put <span class="ja">は</span> after a question word. The grammar will tell you why.</p>
    `,
  },

];
