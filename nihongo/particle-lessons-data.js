// Japanese particle lessons.
//
// Each lesson has:
//   id          : stable URL-friendly slug
//   num         : ordinal (1-based, drives catalog order + prev/next)
//   titleJa     : Japanese title — short, descriptive
//   titleEn     : English title — what the learner walks away knowing
//   particles[] : characters that appear; drives chip rendering + color
//   block       : grouping for the catalog ('foundation', 'object', etc.)
//   time        : estimated reading time (e.g. '6 min')
//   status      : 'ready' or 'coming-soon'
//   intro       : framing paragraph (HTML-safe)
//   steps[]     : ordered step cards — see step shapes below
//   takeaways[] : 3–5 closing bullets
//
// Step shapes:
//   { type:'concept',  title, body }              — single-idea paragraph
//   { type:'pattern',  cells:[…], body }           — abstract pattern row
//   { type:'examples', items:[ {ja,parts,kana,en,note?} … ] }
//   { type:'contrast', a:{ja,parts,en}, b:{ja,parts,en}, body }
//   { type:'mistake',  title, body }              — common-error callout
//   { type:'check',    qJa, qEn, options:[…], answer:idx, explain }
//
// Coming-soon lessons carry only id, num, titleJa, titleEn, particles,
// block, time, status — they appear in the catalog as a roadmap but
// have no detail body.

window.PARTICLE_LESSON_BLOCKS = [
  { id:'foundation',  title:'Foundation',        sub:'は と が — the bedrock' },
  { id:'action',      title:'Action & Place',    sub:'を · に · で · へ — what verbs do and where' },
  { id:'time',        title:'Time & Recipients', sub:'に — when, and to whom' },
  { id:'description', title:'Description',       sub:'の — possession, kind, and turning verbs into nouns' },
  { id:'joining',     title:'Joining',           sub:'と と や — how things group together' },
  { id:'additive',    title:'Additive',          sub:'も — also, too, even' },
  { id:'range',       title:'Range',             sub:'から と まで — from, until, because' },
  { id:'synthesis',   title:'Synthesis',         sub:'pulling all twelve particles together' },
  { id:'omission',    title:'Omission',          sub:'when particles disappear — and why' },
];

window.PARTICLE_LESSONS = [

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 01 — は: introducing the topic
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-01-wa-intro',
    num:1,
    titleJa:'トピック導入',
    titleEn:'Introducing the topic',
    particles:['は'],
    block:'foundation',
    time:'6 min',
    status:'ready',
    intro:`<b>は</b> is the most-used particle in Japanese — and the most-misunderstood. It does not mark the subject. It marks the <i>topic</i>: <b>what the conversation is about</b>. Get this right early and most of Japanese sentence structure clicks into place.`,
    steps:[
      { type:'concept',
        title:'は marks the topic, not the subject',
        body:`The literal reading of <b>は</b> is "<i>as for X…</i>" — it announces: "the rest of this sentence is going to comment on X." The comment can be anything — a description, an action, even another question. <br><br>Important note on pronunciation: when は is a particle, it's spelled は but <b>pronounced</b> <i>wa</i> (not <i>ha</i>). In every other context, は reads <i>ha</i>. This is a historical spelling quirk you just memorize.`,
      },
      { type:'pattern',
        cells:['Topic','は','comment'],
        body:`The pattern is unforgiving in its simplicity. <b>Topic</b> sets the stage; <b>comment</b> says something about it.`,
      },
      { type:'examples',
        items:[
          { ja:'私は学生です。', parts:['私','は','学生です。'],
            kana:'わたしは がくせい です。', en:'As for me, I\'m a student.' },
          { ja:'これは本です。', parts:['これ','は','本です。'],
            kana:'これは ほん です。', en:'As for this, it\'s a book.' },
          { ja:'今日は寒いです。', parts:['今日','は','寒いです。'],
            kana:'きょうは さむい です。', en:'As for today, it\'s cold.',
            note:'Notice は can mark a time. It\'s not "subject" — there\'s no subject of "cold" here, just a topic frame.' },
          { ja:'田中さんは先生です。', parts:['田中さん','は','先生です。'],
            kana:'たなかさんは せんせい です。', en:'As for Tanaka, he\'s a teacher.' },
          { ja:'私の犬はかわいいです。', parts:['私の犬','は','かわいいです。'],
            kana:'わたしのいぬは かわいい です。', en:'As for my dog, it\'s cute.' },
        ],
      },
      { type:'concept',
        title:'Why "as for…" matters',
        body:`The verb in Japanese is <span class="ja">です</span> / <span class="ja">だ</span> / etc. <b>は</b> is a <i>separate</i> marker that just announces the topic — it is not the verb "to be." That\'s why は can attach to a time (<span class="ja">今日は…</span>), a place (<span class="ja">家では…</span>), or anything else. It\'s about <i>about-ness</i>, not <i>subject-hood</i>.`,
      },
      { type:'mistake',
        title:'Common mistake — "は means is"',
        body:`English translations often read "I am…", "It is…" — so it\'s tempting to map <b>は</b> onto English "is." Don\'t. The <span class="ja">です</span> at the end of the sentence is the "is." <b>は</b> just frames what we\'re talking about. We\'ll see in Lesson 2 why this distinction matters.`,
      },
      { type:'check',
        qJa:'朝ごはん___パンを食べます。',
        qEn:'"As for breakfast, I eat bread." — which particle fills the blank?',
        options:['は','が','を','で'],
        answer:0,
        explain:`<b>は</b> — we\'re setting up "breakfast" as the frame. The actual sentence is about what gets eaten then.`,
      },
    ],
    takeaways:[
      'は marks the topic (about-ness), not the grammatical subject.',
      'Pronounced wa (not ha) when used as a particle.',
      'Pattern: [topic] は [comment].',
      'Mentally translate as "as for X…" — it stops you mapping it onto English "is."',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 02 — が: the subject marker (and how it differs from は)
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-02-ga-vs-wa',
    num:2,
    titleJa:'主語マーカー',
    titleEn:'The subject marker (and は vs が)',
    particles:['が','は'],
    block:'foundation',
    time:'9 min',
    status:'ready',
    intro:`<b>が</b> is the <i>true</i> subject marker. While <b>は</b> announces the topic, <b>が</b> introduces something <i>new</i> or <i>identifies</i> a specific entity. Knowing when to use が instead of は is the single most useful piece of grammar to get right early — it shapes how natural your Japanese sounds.`,
    steps:[
      { type:'concept',
        title:'が = new information, or identification',
        body:`Think of <b>が</b> as the <i>spotlight</i> particle. It puts a spotlight on a specific subject — either because it\'s being introduced for the first time, or because it\'s being identified out of a set ("<i>this</i> one, not that one").`,
      },
      { type:'concept',
        title:'The three core uses of が',
        body:`Three patterns drill <b>が</b> into your bones. Learn these and you\'ve covered ~80% of where が shows up:<br><br>
        • <b>Existence</b> — something exists / appears: <span class="ja">猫<b style="color:#c97a2c">が</b>います</span> (there is a cat). The cat is new to the scene.<br>
        • <b>Preference / ability</b> — <span class="ja">好き</span>, <span class="ja">上手</span>, <span class="ja">できる</span> take <b>が</b> for what you like / can do: <span class="ja">寿司<b style="color:#c97a2c">が</b>好きです</span>.<br>
        • <b>Body sensations</b> — <span class="ja">頭<b style="color:#c97a2c">が</b>痛い</span>, <span class="ja">お腹<b style="color:#c97a2c">が</b>空いた</span>. The body part is what is doing the hurting / being empty.`,
      },
      { type:'contrast',
        body:`Same words, different particle, completely different meaning. Read both English glosses carefully:`,
        a:{ ja:'私は学生です。', parts:['私','は','学生です。'],
            en:'As for me, I\'m a student.  (talking about myself — old info)' },
        b:{ ja:'私が学生です。', parts:['私','が','学生です。'],
            en:'I\'m the student.  (answering "who is the student?" — new info, identifying)' },
      },
      { type:'concept',
        title:'The question-answer flow',
        body:`The cleanest way to feel <b>が</b> vs <b>は</b> is in question-answer pairs:<br><br>
        Q: <span class="ja">誰<b style="color:#c97a2c">が</b>来ましたか?</span> — Who came?  <span style="color:var(--ink-3)">(question word always が)</span><br>
        A: <span class="ja">田中さん<b style="color:#c97a2c">が</b>来ました。</span> — Tanaka came.  <span style="color:var(--ink-3)">(new info, answers "who")</span><br><br>
        But if the conversation is already about Tanaka:<br><br>
        Q: <span class="ja">田中さん<b style="color:#8a2538">は</b>何をしましたか?</span> — As for Tanaka, what did he do?<br>
        A: <span class="ja">田中さん<b style="color:#8a2538">は</b>来ました。</span> — Tanaka came.  <span style="color:var(--ink-3)">(comment on a known topic)</span>`,
      },
      { type:'concept',
        title:'Rule 1 — question words always take が, never は',
        body:`<span class="ja">誰</span>, <span class="ja">何</span>, <span class="ja">どれ</span>, <span class="ja">どこ</span>, <span class="ja">いつ</span> — all always take <b>が</b>. You cannot say <span class="ja">誰<b style="color:#8a2538">は</b>来ましたか</span> — it would mean "as for who…", which is meaningless. Question words by definition introduce <i>new</i> info, so they take the new-info particle.`,
      },
      { type:'concept',
        title:'Rule 2 — first mention takes が, later mentions take は',
        body:`When something appears for the <i>first time</i> in a conversation, it takes <b>が</b>. The next time you mention it — now it\'s "old" — it takes <b>は</b>. Classic story opening:<br><br>
        <span class="ja">昔々、ある男<b style="color:#c97a2c">が</b>住んでいました。</span><br>
        <span style="color:var(--ink-3);font-style:italic">Once upon a time, a man lived.  (が — introducing the character)</span><br><br>
        <span class="ja">その男<b style="color:#8a2538">は</b>毎日、川で釣りをしていました。</span><br>
        <span style="color:var(--ink-3);font-style:italic">The man fished in the river every day.  (は — he\'s now the known topic)</span>`,
      },
      { type:'examples',
        items:[
          { ja:'雨が降っています。', parts:['雨','が','降っています。'],
            kana:'あめが ふっています。', en:'It\'s raining.',
            note:'Weather statements report new facts → が.' },
          { ja:'頭が痛いです。', parts:['頭','が','痛いです。'],
            kana:'あたまが いたい です。', en:'My head hurts.',
            note:'Body sensations always take が.' },
          { ja:'寿司が好きです。', parts:['寿司','が','好きです。'],
            kana:'すしが すき です。', en:'I like sushi.',
            note:'好き / 嫌い / 上手 / 下手 all take が.' },
          { ja:'お金がありません。', parts:['お金','が','ありません。'],
            kana:'おかねが ありません。', en:'I don\'t have money.',
            note:'ある / いる always take が for the thing existing (or not).' },
        ],
      },
      { type:'check',
        qJa:'誰___来ましたか。',
        qEn:'"Who came?" — which particle?',
        options:['は','が','を','と'],
        answer:1,
        explain:`<b>が</b> — question words always take <b>が</b>, never <b>は</b>. The questioner doesn\'t know who came; the answer will be new info.`,
      },
    ],
    takeaways:[
      'が marks the grammatical subject — introduces new info or identifies.',
      'は marks the topic (often old info); が puts a spotlight on a specific subject.',
      'Question words (誰, 何, どれ, …) always take が, never は.',
      '好き, 上手, できる, ある, いる — all take が for the thing involved.',
      'First mention → が. Subsequent mentions of the same thing → は.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 03 — X は Y が: the umbrella topic
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-03-wa-ga-umbrella',
    num:3,
    titleJa:'二重主語',
    titleEn:'X は Y が — the umbrella topic pattern',
    particles:['は','が'],
    block:'foundation',
    time:'8 min',
    status:'ready',
    intro:`Many natural Japanese sentences carry <b>both</b> は and が. This isn\'t redundancy — it\'s the fundamental "umbrella topic" pattern, where one particle frames the conversation and the other marks the actual grammatical subject. Master this and an enormous category of Japanese suddenly makes sense.`,
    steps:[
      { type:'pattern',
        cells:['Big topic','は','smaller thing','が','adj. / verb'],
        body:`The <b>big topic</b> sets the frame: "let\'s talk about X." The <b>smaller thing</b> + <b>が</b> is the grammatical subject of the adjective or verb that follows.`,
      },
      { type:'examples',
        items:[
          { ja:'弟は背が高いです。', parts:['弟','は','背','が','高いです。'],
            kana:'おとうとは せが たかい です。',
            en:'As for my brother, his height is tall.  (= My brother is tall.)',
            note:'弟 is the topic (what we\'re talking about). 背 (height) is the actual subject of 高い.' },
          { ja:'象は鼻が長い。', parts:['象','は','鼻','が','長い。'],
            kana:'ぞうは はなが ながい。',
            en:'As for elephants, their noses are long.  (= Elephants have long noses.)' },
          { ja:'私は日本語が話せます。', parts:['私','は','日本語','が','話せます。'],
            kana:'わたしは にほんごが はなせます。',
            en:'As for me, Japanese is speakable.  (= I can speak Japanese.)' },
          { ja:'京都は寺が多い。', parts:['京都','は','寺','が','多い。'],
            kana:'きょうとは てらが おおい。',
            en:'As for Kyoto, temples are many.  (= Kyoto has many temples.)' },
        ],
      },
      { type:'concept',
        title:'Why both particles?',
        body:`English collapses these into "My brother is tall." Japanese keeps the <i>frame</i> and the <i>actual subject</i> visible separately:<br><br>
        • The <b>topic</b> (frame) is 弟 — the rest of the sentence comments on him.<br>
        • The grammatical <b>subject</b> of 高い (tall) is 背 (height), not 弟 himself.<br><br>
        Without <b>は</b>, you\'d have a sentence about heights in general. Without <b>が</b>, you\'d lose track of what is actually tall. Both work together to keep the picture clear.`,
      },
      { type:'concept',
        title:'Where this pattern lives — everywhere',
        body:`Once you see it, you\'ll see it everywhere. Some of the most common categories:<br><br>
        • <b>Preferences</b> — <span class="ja">私<b style="color:#8a2538">は</b>コーヒー<b style="color:#c97a2c">が</b>好きです。</span> (I like coffee)<br>
        • <b>Abilities</b> — <span class="ja">弟<b style="color:#8a2538">は</b>ピアノ<b style="color:#c97a2c">が</b>上手だ。</span> (My brother is good at piano)<br>
        • <b>Possession via ある/いる</b> — <span class="ja">田中さん<b style="color:#8a2538">は</b>車<b style="color:#c97a2c">が</b>ある。</span> (Tanaka has a car)<br>
        • <b>Body / qualities</b> — <span class="ja">彼<b style="color:#8a2538">は</b>声<b style="color:#c97a2c">が</b>いい。</span> (He has a nice voice)<br>
        • <b>Geography / collections</b> — <span class="ja">日本<b style="color:#8a2538">は</b>山<b style="color:#c97a2c">が</b>多い。</span> (Japan has many mountains)`,
      },
      { type:'mistake',
        title:'The trap — "but は IS the subject in 私は学生です!"',
        body:`Not quite. <span class="ja">私<b style="color:#8a2538">は</b>学生です</span> is the <i>simple</i> case — there\'s no smaller thing inside that needs marking. The pattern still applies: <span class="ja">私<b style="color:#8a2538">は</b></span> = [topic], <span class="ja">学生です</span> = [comment]. No が because nothing inside needs to be picked out.<br><br>
        Compare to <span class="ja">私<b style="color:#8a2538">は</b>背<b style="color:#c97a2c">が</b>高いです</span> — now there <i>is</i> an inner thing (背), and it takes <b>が</b>. Same topic, but the comment now has its own internal structure.`,
      },
      { type:'concept',
        title:'A reading shortcut',
        body:`When you see <span class="ja">X<b style="color:#8a2538">は</b>Y<b style="color:#c97a2c">が</b>...</span> in the wild, parse it as: <i>"As for X, Y is …"</i>. Don\'t try to map it onto a single English subject. Two visible roles, two visible markers — keep them both.`,
      },
      { type:'check',
        qJa:'象___鼻___長い。',
        qEn:'"Elephants have long noses." — which particles fill the two blanks?',
        options:['は · が','が · は','は · を','の · が'],
        answer:0,
        explain:`<b>は · が</b>. <span class="ja">象<b style="color:#8a2538">は</b></span> sets the frame ("as for elephants…"), and <span class="ja">鼻<b style="color:#c97a2c">が</b></span> marks the actual grammatical subject of 長い (long).`,
      },
    ],
    takeaways:[
      'The X は Y が pattern uses both particles — they\'re not interchangeable.',
      'は frames the topic; が marks the inner grammatical subject.',
      'This pattern underlies preferences, abilities, possessions, descriptions, and geography.',
      'Mentally parse it as "as for X, Y is …" — keep both roles visible.',
      'No inner subject? No が — just topic + comment (Lesson 1 case).',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Coming-soon roadmap. Visible in the catalog as a roadmap so the
  // learner can see where the path leads. Detail bodies will be filled in
  // batches. titleJa contains only the descriptive part — the particle
  // prefix is rendered from `particles` by the catalog renderer.
  // ════════════════════════════════════════════════════════════════════════

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 04 — を: what verbs act on (object · path · leaving)
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-04-wo', num:4,
    titleJa:'動作の対象', titleEn:'What verbs act on (object · path · leaving)',
    particles:['を'], block:'action', time:'7 min', status:'ready',
    intro:`<b>を</b> marks the thing a verb is engaged with. The textbook calls it the "direct object" particle, but the Japanese concept is wider than English: <b>を</b> also covers <i>paths traversed</i> and <i>places left from</i>. All three share one idea — the verb is doing something <i>to</i> or <i>through</i> that noun.`,
    steps:[
      { type:'concept',
        title:'を marks what the verb operates on',
        body:`The pattern is [noun] <b>を</b> [verb]. The verb does the action; <b>を</b> labels what it does it to. Reading? <i>を</i> is on the book. Drinking? <i>を</i> is on the water.`,
      },
      { type:'pattern', cells:['Object','を','verb'],
        body:`The most common use — and the one most beginners learn first.`,
      },
      { type:'examples', items:[
        { ja:'本を読みます。', parts:['本','を','読みます。'], kana:'ほんを よみます。', en:'I read a book.' },
        { ja:'水を飲みました。', parts:['水','を','飲みました。'], kana:'みずを のみました。', en:'I drank water.' },
        { ja:'映画を見ます。', parts:['映画','を','見ます。'], kana:'えいがを みます。', en:'I watch a movie.' },
        { ja:'手紙を書きました。', parts:['手紙','を','書きました。'], kana:'てがみを かきました。', en:'I wrote a letter.' },
      ]},
      { type:'concept',
        title:'を for paths — "through" something',
        body:`When the verb is a motion verb (<span class="ja">歩く</span> walk, <span class="ja">走る</span> run, <span class="ja">飛ぶ</span> fly, <span class="ja">渡る</span> cross), <b>を</b> can mark the path traversed. Think of the path as what the motion is operating on.`,
      },
      { type:'examples', items:[
        { ja:'公園を歩きます。', parts:['公園','を','歩きます。'], kana:'こうえんを あるきます。', en:'I walk through the park.',
          note:'Note: <span class="ja">公園で歩く</span> means "walk IN the park" (action location). <span class="ja">公園を歩く</span> means "walk THROUGH the park" (path).' },
        { ja:'道を渡ります。', parts:['道','を','渡ります。'], kana:'みちを わたります。', en:'I cross the road.' },
        { ja:'空を飛ぶ。', parts:['空','を','飛ぶ。'], kana:'そらを とぶ。', en:'To fly through the sky.' },
      ]},
      { type:'concept',
        title:'を for "place left from"',
        body:`Verbs of departure (<span class="ja">出る</span> leave, <span class="ja">降りる</span> get off, <span class="ja">卒業する</span> graduate) take <b>を</b> for the place being left. The departure engages directly with the place.`,
      },
      { type:'examples', items:[
        { ja:'家を出ました。', parts:['家','を','出ました。'], kana:'いえを でました。', en:'I left the house.' },
        { ja:'電車を降ります。', parts:['電車','を','降ります。'], kana:'でんしゃを おります。', en:'I get off the train.' },
        { ja:'大学を卒業しました。', parts:['大学','を','卒業しました。'], kana:'だいがくを そつぎょうしました。', en:'I graduated from university.' },
      ]},
      { type:'concept',
        title:'Why all three uses share the same particle',
        body:`The common thread: in each case, the verb engages <i>directly</i> with the noun. Reading engages with a book. Walking engages with a park (as the path). Leaving engages with a house. <b>を</b> marks "the noun the verb operates on" — a slightly wider concept than English "direct object."`,
      },
      { type:'mistake',
        title:'を for path vs で for location',
        body:`<span class="ja">公園<b style="color:#5a2e8a">を</b>歩く</span> = walk along/through the park (the park is the path). <span class="ja">公園<b style="color:#2e7a3f">で</b>歩く</span> = walk inside the park (the park is where the action happens). Both are grammatical, but they paint different pictures. Pick the one that matches your meaning.`,
      },
      { type:'check',
        qJa:'駅___降ります。', qEn:'"I get off the train (station)." — which particle?',
        options:['を','で','に','から'], answer:0,
        explain:`<b>を</b>. Verbs of departure — <span class="ja">降りる</span>, <span class="ja">出る</span>, <span class="ja">卒業する</span> — take <b>を</b> for the place being left.`,
      },
    ],
    takeaways:[
      'を marks the thing the verb directly engages with.',
      'Three uses: direct object · path traversed · place left from.',
      'Motion verbs + を = "through" (walk, run, fly through).',
      'Departure verbs + を = "leave from" (out of a house, off a train).',
      'Test: "what is the verb operating on?" That gets を.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 05 — に: destination & location of existence
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-05-ni-place', num:5,
    titleJa:'場所と存在', titleEn:'Destination & location of existence',
    particles:['に'], block:'action', time:'7 min', status:'ready',
    intro:`<b>に</b> is the most versatile particle in Japanese. Across many lessons, you\'ll see it pin nouns to <i>specific points</i> — in space, in time, in social relationships. This lesson covers the two pillars: where things <b>are</b> (existence), and where things <b>go</b> (destination).`,
    steps:[
      { type:'concept',
        title:'The mental model — に as a thumbtack',
        body:`Think of <b>に</b> as a thumbtack. It pins a noun to a specific point. The point can be a place you\'re going to, a place you\'re at, or a surface something rests on. The unifying idea: there is a <i>specific point</i>, and the noun is fixed to it.`,
      },
      { type:'pattern', cells:['Place','に','motion verb'],
        body:`First pillar: destination. Motion verbs (<span class="ja">行く</span>, <span class="ja">来る</span>, <span class="ja">帰る</span>) take <b>に</b> for where you end up.`,
      },
      { type:'examples', items:[
        { ja:'学校に行きます。', parts:['学校','に','行きます。'], kana:'がっこうに いきます。', en:'I go to school.' },
        { ja:'東京に行く。', parts:['東京','に','行く。'], kana:'とうきょうに いく。', en:'I\'m going to Tokyo.' },
        { ja:'家に帰る。', parts:['家','に','帰る。'], kana:'いえに かえる。', en:'I go home.' },
        { ja:'駅に着きました。', parts:['駅','に','着きました。'], kana:'えきに つきました。', en:'I arrived at the station.' },
      ]},
      { type:'pattern', cells:['Place','に','existence verb'],
        body:`Second pillar: location of existence. <span class="ja">いる</span> (for animate beings), <span class="ja">ある</span> (for objects), <span class="ja">住む</span> (to reside) all take <b>に</b>.`,
      },
      { type:'examples', items:[
        { ja:'公園にいます。', parts:['公園','に','います。'], kana:'こうえんに います。', en:'I\'m at the park.' },
        { ja:'机に本があります。', parts:['机','に','本','が','あります。'], kana:'つくえに ほんが あります。', en:'There\'s a book on the desk.' },
        { ja:'東京に住んでいます。', parts:['東京','に','住んでいます。'], kana:'とうきょうに すんでいます。', en:'I live in Tokyo.' },
      ]},
      { type:'concept',
        title:'Surfaces things land on',
        body:`When something lands on, attaches to, or comes to rest on a surface, <b>に</b> marks the surface. Same thumbtack logic — a specific point where the noun ends up resting.`,
      },
      { type:'examples', items:[
        { ja:'椅子に座る。', parts:['椅子','に','座る。'], kana:'いすに すわる。', en:'Sit on the chair.' },
        { ja:'黒板に書く。', parts:['黒板','に','書く。'], kana:'こくばんに かく。', en:'Write on the blackboard.' },
        { ja:'木に登る。', parts:['木','に','登る。'], kana:'きに のぼる。', en:'Climb the tree.' },
      ]},
      { type:'concept',
        title:'The unifying mental model',
        body:`Whether destination, location, or surface — <b>に</b> always answers "to what specific point?" The point is the thumbtack location. Next lesson will show how <b>に</b> differs from <b>で</b> (the most-confused pair in Japanese).`,
      },
      { type:'check',
        qJa:'東京___住んでいます。', qEn:'"I live in Tokyo." — which particle?',
        options:['に','で','を','へ'], answer:0,
        explain:`<b>に</b>. <span class="ja">住む</span> is a state of being — you reside <i>at</i> Tokyo. State verbs (<span class="ja">いる</span>, <span class="ja">ある</span>, <span class="ja">住む</span>) always take <b>に</b>.`,
      },
    ],
    takeaways:[
      'に = "pin to a specific point in space."',
      'For motion verbs: marks the destination ("going to").',
      'For existence verbs (いる, ある, 住む): marks where the thing is.',
      'For surface verbs (座る, 書く, 登る): marks the surface.',
      'Next lesson: how に differs from で (the classic confusion).',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 06 — で: place of action, means, cause
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-06-de', num:6,
    titleJa:'動作の場所と手段', titleEn:'Place of action · means · cause',
    particles:['で'], block:'action', time:'7 min', status:'ready',
    intro:`Where <b>に</b> is the thumbtack (where something <i>is</i> or <i>goes</i>), <b>で</b> is the channel through which something <i>happens</i>. It answers "where, by what means, or because of what?" — three uses that share one idea: <b>で</b> is the medium of an action.`,
    steps:[
      { type:'concept',
        title:'で marks the channel of an action',
        body:`Three flavors of <b>で</b>: (1) where the action takes place, (2) the tool or means used, (3) the cause. All three share the idea of <b>で</b> being the <i>medium</i> through which something occurs.`,
      },
      { type:'pattern', cells:['Place','で','action verb'],
        body:`First use: place of action. The verb happens at this place — distinct from where you simply exist (which is <b>に</b>).`,
      },
      { type:'examples', items:[
        { ja:'カフェで働きます。', parts:['カフェ','で','働きます。'], kana:'かふぇで はたらきます。', en:'I work at a café.' },
        { ja:'公園で遊ぶ。', parts:['公園','で','遊ぶ。'], kana:'こうえんで あそぶ。', en:'I play in the park.' },
        { ja:'学校で勉強します。', parts:['学校','で','勉強します。'], kana:'がっこうで べんきょうします。', en:'I study at school.' },
        { ja:'レストランで食事する。', parts:['レストラン','で','食事する。'], kana:'れすとらんで しょくじする。', en:'I dine at a restaurant.' },
      ]},
      { type:'concept',
        title:'で as means or tool',
        body:`When <b>で</b> attaches to a tool, vehicle, or material, it means "with" or "by." The thing in question is what makes the action possible.`,
      },
      { type:'examples', items:[
        { ja:'箸で食べます。', parts:['箸','で','食べます。'], kana:'はしで たべます。', en:'I eat with chopsticks.' },
        { ja:'電車で行く。', parts:['電車','で','行く。'], kana:'でんしゃで いく。', en:'I go by train.' },
        { ja:'鉛筆で書きます。', parts:['鉛筆','で','書きます。'], kana:'えんぴつで かきます。', en:'I write with a pencil.' },
        { ja:'日本語で話しましょう。', parts:['日本語','で','話しましょう。'], kana:'にほんごで はなしましょう。', en:'Let\'s speak in Japanese.' },
      ]},
      { type:'concept',
        title:'で as cause',
        body:`<b>で</b> can attach to a cause or reason — "because of X." This use overlaps with <span class="ja">から</span> (Lesson 16) but feels more terse and factual.`,
      },
      { type:'examples', items:[
        { ja:'病気で休む。', parts:['病気','で','休む。'], kana:'びょうきで やすむ。', en:'I\'m off because of illness.' },
        { ja:'大雨で電車が止まった。', parts:['大雨','で','電車','が','止まった。'], kana:'おおあめで でんしゃが とまった。', en:'The train stopped because of heavy rain.' },
      ]},
      { type:'concept',
        title:'で with quantities — group size or total',
        body:`<b>で</b> with a number marks the group or total: "in a group of N" or "for N total."`,
      },
      { type:'examples', items:[
        { ja:'一人で行く。', parts:['一人','で','行く。'], kana:'ひとりで いく。', en:'I\'ll go alone.' },
        { ja:'全部で五千円です。', parts:['全部','で','五千円です。'], kana:'ぜんぶで ごせんえんです。', en:'It\'s 5000 yen in total.' },
      ]},
      { type:'concept',
        title:'Mental model — で is the medium',
        body:`In every use, ask: "what is the medium through which this happens?" Place where it happens. Tool that makes it possible. Cause that triggers it. Group size that defines it. <b>で</b> = the channel through which the action flows.`,
      },
      { type:'check',
        qJa:'箸___食べます。', qEn:'"I eat with chopsticks." — which particle?',
        options:['で','に','を','と'], answer:0,
        explain:`<b>で</b>. The chopsticks are the <i>means</i> by which the action happens — they\'re the channel through which eating occurs.`,
      },
    ],
    takeaways:[
      'で marks the medium / channel of an action.',
      'Place of action — where something HAPPENS (not where you exist).',
      'Means or tool — by/with what.',
      'Cause — because of what.',
      'Quantity — "in a group of N" or "for N total."',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 07 — に vs で: the classic location confusion
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-07-ni-vs-de', num:7,
    titleJa:'場所の対比', titleEn:'に vs で — the classic location confusion',
    particles:['に','で'], block:'action', time:'8 min', status:'ready',
    intro:`This is the single most-asked particle question in Japanese learning. Both <b>に</b> and <b>で</b> can attach to a place — but they mean different things. Get this right and you\'ve cleared the biggest stumbling block in early Japanese grammar.`,
    steps:[
      { type:'concept',
        title:'The rule in one sentence',
        body:`<b>に</b> for state. <b>で</b> for action. <b>に</b> says where something <i>is</i> (or is going to). <b>で</b> says where something <i>happens</i>.`,
      },
      { type:'contrast',
        body:`Same place, two roles. Notice how the verb dictates the particle:`,
        a:{ ja:'図書館にいます。', parts:['図書館','に','います。'],
            en:'I\'m at the library.  (state — I exist at the library)' },
        b:{ ja:'図書館で勉強します。', parts:['図書館','で','勉強します。'],
            en:'I study at the library.  (action — studying happens at the library)' },
      },
      { type:'concept',
        title:'More side-by-side pairs',
        body:`Same place noun, different verb, different particle. Pay attention to which verb is a state and which is an action:<br><br>
        • <span class="ja">公園<b style="color:#3a7a4a">に</b>いる</span> (state) ↔ <span class="ja">公園<b style="color:#2e7a3f">で</b>遊ぶ</span> (action)<br>
        • <span class="ja">カフェ<b style="color:#3a7a4a">に</b>いる</span> (state) ↔ <span class="ja">カフェ<b style="color:#2e7a3f">で</b>働く</span> (action)<br>
        • <span class="ja">学校<b style="color:#3a7a4a">に</b>いる</span> (state) ↔ <span class="ja">学校<b style="color:#2e7a3f">で</b>勉強する</span> (action)`,
      },
      { type:'concept',
        title:'The test you can apply',
        body:`Ask yourself: "Is the verb a state of being (<span class="ja">いる</span>, <span class="ja">ある</span>, <span class="ja">住む</span>, <span class="ja">立つ</span>), or an action that happens at this place?" State → <b>に</b>. Action → <b>で</b>.`,
      },
      { type:'concept',
        title:'Edge case — verbs of arrival',
        body:`<span class="ja">行く</span>, <span class="ja">来る</span>, <span class="ja">帰る</span>, <span class="ja">着く</span> are motion verbs but they take <b>に</b>. Why? They\'re not "happening at" a place — they\'re <i>ending at</i> a place. The <b>に</b> marks where you END UP, not where the action occurs.`,
      },
      { type:'mistake',
        title:'で with 住む / ある / いる',
        body:`Living, existing, and being are STATES, not actions. They <i>always</i> take <b>に</b>. <span class="ja">東京<b style="color:#3a7a4a">に</b>住んでいる</span> ✓. <span class="ja">東京<b style="color:#2e7a3f">で</b>住んでいる</span> ✗. Even though living "happens" at a place in English thinking, in Japanese it\'s a state.`,
      },
      { type:'mistake',
        title:'に with 働く / 勉強する',
        body:`Working and studying are ACTIONS. They <i>always</i> take <b>で</b>. <span class="ja">学校<b style="color:#2e7a3f">で</b>勉強する</span> ✓. <span class="ja">学校<b style="color:#3a7a4a">に</b>勉強する</span> ✗. Even though you\'re also AT the school, the verb tells you the role.`,
      },
      { type:'concept',
        title:'The mental model side-by-side',
        body:`<b>に</b> thumbtacks the noun to a point — you ARE there, you GO there, you LAND there. <b>で</b> is the field where activity unfolds — the verb USES the place.`,
      },
      { type:'check',
        qJa:'公園___遊びました。', qEn:'"I played in the park." — which particle?',
        options:['で','に','を','へ'], answer:0,
        explain:`<b>で</b>. <span class="ja">遊ぶ</span> (to play) is an action, not a state. The park is where the playing <i>happens</i> — so で.`,
      },
    ],
    takeaways:[
      'に = state (BE, LIVE, GO TO, ARRIVE AT) / で = action (HAPPEN, DO).',
      'Motion verbs (行く, 来る, 帰る) take に — destination, not place-of-action.',
      '住む, ある, いる always take に.',
      '働く, 勉強する, 食べる, 遊ぶ always take で.',
      'Test: "Is the verb a state or an action?" That tells you the particle.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 08 — へ vs に: direction nuance
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-08-e-vs-ni', num:8,
    titleJa:'方向のニュアンス', titleEn:'へ vs に — direction nuance',
    particles:['へ','に'], block:'action', time:'5 min', status:'ready',
    intro:`For destinations, both <b>へ</b> and <b>に</b> work — and they\'re often interchangeable. But each carries a subtly different feeling. <b>へ</b> emphasizes the <i>direction</i> (the going-toward); <b>に</b> emphasizes the <i>destination</i> (the arriving-at).`,
    steps:[
      { type:'concept',
        title:'Same job, different emphasis',
        body:`In modern Japanese, <b>へ</b> and <b>に</b> for destinations are nearly synonymous. The slight difference: <b>へ</b> leans toward "heading toward"; <b>に</b> leans toward "arriving at." A native speaker would understand either, but feel a slight color shift.`,
      },
      { type:'concept',
        title:'Pronunciation reminder',
        body:`<b>へ</b> as a particle is pronounced <i>e</i>, not <i>he</i>. Same historical quirk as <span class="ja">は</span>/wa and <span class="ja">を</span>/o.`,
      },
      { type:'contrast',
        body:`Both grammatical, slight difference in feel:`,
        a:{ ja:'東京へ行く。', parts:['東京','へ','行く。'],
            en:'I\'m heading to Tokyo.  (the journey, the direction)' },
        b:{ ja:'東京に行く。', parts:['東京','に','行く。'],
            en:'I\'m going to Tokyo.  (the arrival point, the destination)' },
      },
      { type:'concept',
        title:'When へ feels right',
        body:`Direction emphasized (compass bearings: <span class="ja">北<b style="color:#2a5b94">へ</b>向かう</span> "head north"). Letters and messages addressed somewhere (<span class="ja">お母さん<b style="color:#2a5b94">へ</b></span> "To Mother"). Slightly formal or poetic register. Travel narratives.`,
      },
      { type:'concept',
        title:'When に feels right',
        body:`The destination matters more than the path. Spoken or casual speech. Specific arrival points (clinics, addresses, named buildings). Most everyday "I\'m going to X" statements.`,
      },
      { type:'concept',
        title:'へ has only ONE use',
        body:`Unlike <b>に</b> (which marks time, indirect objects, surfaces, locations of existence — many roles), <b>へ</b> ONLY marks direction. If the meaning isn\'t "toward," you can\'t use <b>へ</b>.`,
      },
      { type:'mistake',
        title:'Overusing へ',
        body:`In modern spoken Japanese, <b>に</b> is far more common. <b>へ</b> can sound bookish if overused — like a 1985 textbook. When in doubt, use <b>に</b>.`,
      },
      { type:'check',
        qJa:'家___帰ります。', qEn:'"I\'m going home." — best particle?',
        options:['に','で','を','が'], answer:0,
        explain:`Both <b>に</b> and <b>へ</b> are grammatical here. <b>に</b> is more common in spoken Japanese. <b>へ</b> would emphasize the journey home rather than the arrival.`,
      },
    ],
    takeaways:[
      'へ and に are largely interchangeable for destinations.',
      'へ emphasizes direction (the going-toward). に emphasizes arrival (the at-ness).',
      'へ has only ONE use — direction. に has many.',
      'In modern spoken Japanese, default to に. Use へ for emphasis or formality.',
      'Pronounced "e," not "he."',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 09 — に: time + indirect object (the recipient)
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-09-ni-time', num:9,
    titleJa:'時間と相手', titleEn:'に — time markers + indirect object (to whom)',
    particles:['に'], block:'time', time:'7 min', status:'ready',
    intro:`Beyond space, <b>に</b> pins two more categories: <b>points in time</b> and <b>recipients of actions</b>. Both follow the same thumbtack logic — a specific point you can pin to (a clock time, a date, or a specific person who receives something).`,
    steps:[
      { type:'concept',
        title:'に for specific points in time',
        body:`When a time expression is a specific point — a clock time, a date, a day of the week, a month, a year — <b>に</b> marks it.`,
      },
      { type:'examples', items:[
        { ja:'七時に起きる。', parts:['七時','に','起きる。'], kana:'しちじに おきる。', en:'I wake up at seven.' },
        { ja:'月曜日に会う。', parts:['月曜日','に','会う。'], kana:'げつようびに あう。', en:'We meet on Monday.' },
        { ja:'三月に旅行する。', parts:['三月','に','旅行する。'], kana:'さんがつに りょこうする。', en:'I travel in March.' },
        { ja:'2024年に卒業しました。', parts:['2024年','に','卒業しました。'], kana:'にせんにじゅうよねんに そつぎょうしました。', en:'I graduated in 2024.' },
      ]},
      { type:'concept',
        title:'When に is NOT needed for time',
        body:`Time expressions that are <i>relative</i> — "today," "tomorrow," "this week," "every day" — do NOT take <b>に</b>. They\'re not points on a calendar; they\'re relative references.`,
      },
      { type:'examples', items:[
        { ja:'今日行く。', parts:['今日行く。'], kana:'きょう いく。', en:'I\'m going today.  (no に)' },
        { ja:'明日来る。', parts:['明日来る。'], kana:'あした くる。', en:'I\'ll come tomorrow.  (no に)' },
        { ja:'毎日勉強する。', parts:['毎日勉強する。'], kana:'まいにち べんきょうする。', en:'I study every day.  (no に)' },
        { ja:'来週会いましょう。', parts:['来週会いましょう。'], kana:'らいしゅう あいましょう。', en:'Let\'s meet next week.  (no に)' },
      ]},
      { type:'concept',
        title:'The rule of thumb',
        body:`Can you answer "when?" with a calendar date or clock time? Then use <b>に</b>. If it\'s relative ("today," "every day," "soon"), no particle.`,
      },
      { type:'concept',
        title:'に for the recipient — "to whom"',
        body:`When an action has a recipient (the person you give something to, talk to, write to, ask), <b>に</b> marks that person. The recipient is the "point" the action is aimed at — same thumbtack logic.`,
      },
      { type:'examples', items:[
        { ja:'友達にプレゼントをあげる。', parts:['友達','に','プレゼント','を','あげる。'], kana:'ともだちに ぷれぜんとを あげる。', en:'I give my friend a present.' },
        { ja:'母に電話する。', parts:['母','に','電話する。'], kana:'ははに でんわする。', en:'I call my mother.' },
        { ja:'先生に質問しました。', parts:['先生','に','質問しました。'], kana:'せんせいに しつもんしました。', en:'I asked the teacher a question.' },
      ]},
      { type:'concept',
        title:'The unifying mental model',
        body:`Time <b>に</b>, recipient <b>に</b>, destination <b>に</b>, surface <b>に</b> — all the same thumbtack. <b>に</b> says "pin this to a specific point in time / person / location / surface." When in doubt, ask: "is there a specific point being pinned to?"`,
      },
      { type:'mistake',
        title:'Putting に on relative times',
        body:`<span class="ja">今日<b>に</b>行く</span> is wrong. <span class="ja">今日行く</span> is correct. <span class="ja">今日</span> doesn\'t need a marker — it\'s not pointing to a specific calendar slot, just "today."`,
      },
      { type:'check',
        qJa:'母___電話しました。', qEn:'"I called my mother." — which particle?',
        options:['に','を','で','と'], answer:0,
        explain:`<b>に</b>. The mother is the <i>recipient</i> of the action — the call is aimed at her. Recipient → <b>に</b>.`,
      },
    ],
    takeaways:[
      'に for specific points in time (7am, Monday, March, 2024).',
      'NO particle for relative times (today, tomorrow, every day, soon).',
      'に for recipients (the person being given/told/called/asked something).',
      'Same "thumbtack" mental model — pin to a specific point.',
      'Test: can I pin it to a calendar? Then use に.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 10 — の: possession & description
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-10-no-possession', num:10,
    titleJa:'所有と修飾', titleEn:'の — possession & description',
    particles:['の'], block:'description', time:'6 min', status:'ready',
    intro:`<b>の</b> is the connective tissue between nouns. It joins two nouns to show possession, description, or relationship. After <span class="ja">は</span> and <span class="ja">が</span>, it\'s the most-used particle in Japanese — every other sentence has one.`,
    steps:[
      { type:'concept',
        title:'の as the noun-noun connector',
        body:`When two nouns are connected, <b>の</b> sits between them. The first noun describes or possesses the second. Translation often flips order: <span class="ja">私<b style="color:#c43a4a">の</b>本</span> reads as "my book" but literally is "I-OF-book."`,
      },
      { type:'pattern', cells:['Noun A','の','Noun B'],
        body:`Read as "A\'s B" or "B of A."`,
      },
      { type:'examples', items:[
        { ja:'私の本です。', parts:['私','の','本です。'], kana:'わたしの ほんです。', en:'It\'s my book.' },
        { ja:'田中さんの家。', parts:['田中さん','の','家。'], kana:'たなかさんの いえ。', en:'Tanaka\'s house.' },
        { ja:'友達の車。', parts:['友達','の','車。'], kana:'ともだちの くるま。', en:'A friend\'s car.' },
      ]},
      { type:'concept',
        title:'の for description / kind',
        body:`Beyond ownership, <b>の</b> links any descriptive relationship — material, type, affiliation, language, country.`,
      },
      { type:'examples', items:[
        { ja:'木のテーブル。', parts:['木','の','テーブル。'], kana:'きの てーぶる。', en:'A wooden table.  (table OF wood)' },
        { ja:'日本語の先生。', parts:['日本語','の','先生。'], kana:'にほんごの せんせい。', en:'A Japanese-language teacher.' },
        { ja:'大学の学生。', parts:['大学','の','学生。'], kana:'だいがくの がくせい。', en:'A university student.' },
      ]},
      { type:'concept',
        title:'の for spatial relationships',
        body:`Position words (<span class="ja">上</span> above, <span class="ja">下</span> below, <span class="ja">前</span> in front, <span class="ja">後ろ</span> behind, <span class="ja">中</span> inside) connect to the noun they refer to via <b>の</b>.`,
      },
      { type:'examples', items:[
        { ja:'机の上。', parts:['机','の','上。'], kana:'つくえの うえ。', en:'On top of the desk.  (desk-OF-top)' },
        { ja:'駅の前で会う。', parts:['駅','の','前','で','会う。'], kana:'えきの まえで あう。', en:'Meet in front of the station.' },
        { ja:'箱の中にある。', parts:['箱','の','中','に','ある。'], kana:'はこの なかに ある。', en:'It\'s inside the box.' },
      ]},
      { type:'concept',
        title:'の as "the one"',
        body:`You can drop the second noun and let <b>の</b> stand alone — meaning "the one belonging to / of X."`,
      },
      { type:'examples', items:[
        { ja:'これは私のです。', parts:['これは私','の','です。'], kana:'これは わたしの です。', en:'This is mine.  ("the one belonging to me")' },
        { ja:'赤いのをください。', parts:['赤い','の','をください。'], kana:'あかいの を ください。', en:'The red one, please.' },
      ]},
      { type:'concept',
        title:'の chains naturally',
        body:`<b>の</b> can stack. <span class="ja">私<b style="color:#c43a4a">の</b>友達<b style="color:#c43a4a">の</b>車</span> = "my friend\'s car." Read left to right: my → friend → car. Three nouns, two の\'s.`,
      },
      { type:'check',
        qJa:'友達___本。', qEn:'"My friend\'s book."',
        options:['の','と','に','で'], answer:0,
        explain:`<b>の</b>. Two nouns side-by-side, one describes/possesses the other → <b>の</b>.`,
      },
    ],
    takeaways:[
      'の is the noun-noun connector — joins two nouns into one phrase.',
      'Covers possession, description, kind, material, spatial relationships.',
      'Can stand alone as "the one" (赤いの = "the red one").',
      'Stacks naturally — 私の友達の家 ("my friend\'s house").',
      'If a sentence has two nouns side-by-side and one describes the other, you almost always need の.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 11 — の: nominalizer & sentence-final question marker
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-11-no-nominalize', num:11,
    titleJa:'名詞化と疑問', titleEn:'の — nominalizer & question marker',
    particles:['の'], block:'description', time:'7 min', status:'ready',
    intro:`<b>の</b> has a second life that has nothing to do with possession. It turns verbs into nouns ("the thing of X-ing"), softens questions, and shows up at the end of explanatory sentences. This is the trickier <b>の</b> — N4-N3 territory but worth meeting early.`,
    steps:[
      { type:'concept',
        title:'の as nominalizer',
        body:`Adding <b>の</b> after a verb in plain form turns the verb into a noun. "Reading books" becomes a thing — something that can be liked, hated, easy, hard, fast, slow.`,
      },
      { type:'pattern', cells:['Plain verb','の','adjective / verb'],
        body:`The <b>の</b> wraps everything before it into a single noun-like unit.`,
      },
      { type:'examples', items:[
        { ja:'本を読むのが好きです。', parts:['本','を','読む','の','が','好きです。'], kana:'ほんを よむのが すきです。', en:'I like reading books.',
          note:'The "reading-books" cluster becomes a noun, then が marks it as the subject of 好き.' },
        { ja:'行くのは無理だ。', parts:['行く','の','は','無理だ。'], kana:'いくのは むりだ。', en:'Going is impossible.' },
        { ja:'走るのが速い。', parts:['走る','の','が','速い。'], kana:'はしるのが はやい。', en:'Running is fast.' },
      ]},
      { type:'concept',
        title:'の vs こと — two nominalizers',
        body:`<span class="ja">こと</span> also nominalizes verbs. The difference: <b>の</b> is for concrete, observable actions ("running," "eating"). <span class="ja">こと</span> is for abstract concepts ("running is good for the body" as a general principle).`,
      },
      { type:'examples', items:[
        { ja:'走るのが好き。', parts:['走る','の','が','好き。'], kana:'はしるのが すき。', en:'I like running.  (concrete: I enjoy the activity)' },
        { ja:'走ることが体にいい。', parts:['走ることが体にいい。'], kana:'はしることが からだに いい。', en:'Running is good for the body.  (abstract principle)' },
      ]},
      { type:'concept',
        title:'の as sentence-final question softener',
        body:`In casual speech, adding <b>の</b> to the end of a question makes it warmer, softer, more inviting. It signals genuine curiosity rather than formal interrogation.`,
      },
      { type:'examples', items:[
        { ja:'どこに行くの？', parts:['どこ','に','行く','の','？'], kana:'どこに いくの？', en:'Where are you going?  (warm, curious)' },
        { ja:'何を食べたの？', parts:['何','を','食べた','の','？'], kana:'なにを たべたの？', en:'What did you eat?' },
        { ja:'大丈夫なの？', parts:['大丈夫な','の','？'], kana:'だいじょうぶなの？', en:'Are you okay?  (caring tone)' },
      ]},
      { type:'concept',
        title:'のだ / んだ — the explanation form',
        body:`<b>の</b> at the end of a statement (often contracted to <span class="ja">んだ</span> in speech) frames the sentence as an <i>explanation</i> or <i>reason</i>. It tells the listener "here\'s the context / why."`,
      },
      { type:'examples', items:[
        { ja:'風邪なんだ。', parts:['風邪なんだ。'], kana:'かぜなんだ。', en:'I have a cold.  (explaining why)' },
        { ja:'行きたかったんだ。', parts:['行きたかったんだ。'], kana:'いきたかったんだ。', en:'I wanted to go.  (giving context)' },
      ]},
      { type:'mistake',
        title:'Trying to use こと everywhere',
        body:`Textbooks often teach <span class="ja">こと</span> as the "primary" nominalizer. In real speech, <b>の</b> is much more common for everyday actions. <span class="ja">食べるの</span>, <span class="ja">行くの</span>, <span class="ja">見るの</span> — these are normal, natural Japanese.`,
      },
      { type:'check',
        qJa:'行く___は無理だ。', qEn:'"Going is impossible." — which particle?',
        options:['の','こと','と','が'], answer:0,
        explain:`<b>の</b>. The verb <span class="ja">行く</span> becomes a noun via <b>の</b>; the resulting noun is the topic of <span class="ja">無理だ</span>.`,
      },
    ],
    takeaways:[
      'の nominalizes verbs — turns "X-ing" into a noun.',
      'For concrete activities, prefer の over こと. (好き, 上手, 楽しい → almost always の.)',
      'In casual speech, the sentence-final の softens questions: どこに行くの?',
      'In のだ / んだ form, frames explanations and reasons.',
      'This の has nothing to do with possession の — same character, different role.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 12 — と: exhaustive "and" · with · quotation
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-12-to-and-with', num:12,
    titleJa:'列挙と同伴と引用', titleEn:'と — exhaustive "and" · with · quotation',
    particles:['と'], block:'joining', time:'7 min', status:'ready',
    intro:`<b>と</b> has three closely-related uses: it joins nouns into an exhaustive list, marks accompaniment, and frames quotations. All three share one idea — "binding two things together."`,
    steps:[
      { type:'concept',
        title:'と as exhaustive "and"',
        body:`When you say "A and B" and you mean <i>exactly those two things, no others implied</i> — use <b>と</b>. The list is closed.`,
      },
      { type:'pattern', cells:['Noun A','と','Noun B'],
        body:`Just A and B. Nothing else.`,
      },
      { type:'examples', items:[
        { ja:'パンと牛乳を買う。', parts:['パン','と','牛乳','を','買う。'], kana:'ぱんと ぎゅうにゅうを かう。', en:'I buy bread and milk.  (only those two)' },
        { ja:'父と母。', parts:['父','と','母。'], kana:'ちちと はは。', en:'Father and mother.' },
        { ja:'私と田中さんが行く。', parts:['私','と','田中さん','が','行く。'], kana:'わたしと たなかさんが いく。', en:'Tanaka and I are going.' },
      ]},
      { type:'concept',
        title:'と as "with" (companion)',
        body:`When an action is done <i>together</i> with someone, <b>と</b> marks the partner. The partner shares the action.`,
      },
      { type:'examples', items:[
        { ja:'友達と映画を見る。', parts:['友達','と','映画','を','見る。'], kana:'ともだちと えいがを みる。', en:'I watch a movie with a friend.' },
        { ja:'父と話す。', parts:['父','と','話す。'], kana:'ちちと はなす。', en:'I talk with my father.' },
        { ja:'犬と遊ぶ。', parts:['犬','と','遊ぶ。'], kana:'いぬと あそぶ。', en:'I play with my dog.' },
      ]},
      { type:'concept',
        title:'と as quotation',
        body:`When you report what someone said, thought, or wrote, the quoted content is followed by <b>と</b>. The <b>と</b> binds the quoted text to the verb of speaking / thinking / writing.`,
      },
      { type:'examples', items:[
        { ja:'「ありがとう」と言った。', parts:['「ありがとう」','と','言った。'], kana:'「ありがとう」と いった。', en:'I said "thank you."' },
        { ja:'「行く」と思う。', parts:['「行く」','と','思う。'], kana:'「いく」と おもう。', en:'I think I\'ll go.' },
        { ja:'田中と呼ばれる。', parts:['田中','と','呼ばれる。'], kana:'たなかと よばれる。', en:'I\'m called Tanaka.' },
      ]},
      { type:'concept',
        title:'The unifying idea — "binding two things"',
        body:`A bound to B (and). Person bound to action (with). Words bound to the verb of speaking (quotation). Always two things, joined into one structure.`,
      },
      { type:'mistake',
        title:'Using と for an open-ended list',
        body:`<span class="ja">りんご<b style="color:#2a5b94">と</b>みかんが好き</span> means "I like apples and oranges (only those two)." If you also like other fruits, use <span class="ja">や</span> instead (next lesson).`,
      },
      { type:'check',
        qJa:'友達___映画を見ました。', qEn:'"I watched a movie with a friend."',
        options:['と','で','に','が'], answer:0,
        explain:`<b>と</b>. The friend is the <i>companion</i> in the action — doing it together → <b>と</b>.`,
      },
    ],
    takeaways:[
      'と for exhaustive lists ("A and B, exactly those").',
      'と for companions ("with a friend, with mother").',
      'と for quotations (「X」と言う = "say X").',
      'All three share the "binding" idea — two things, joined.',
      'For partial lists ("apples, oranges, etc."), use や instead.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 13 — と: conditional ("when X, Y always")
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-13-to-conditional', num:13,
    titleJa:'自動的条件', titleEn:'と — the automatic conditional',
    particles:['と'], block:'joining', time:'5 min', status:'ready',
    intro:`<b>と</b> has another life: when attached to a plain verb, it forms a conditional meaning "when X happens, Y inevitably follows." This is the conditional of natural laws, predictable outcomes, and recurring habits.`,
    steps:[
      { type:'concept',
        title:'と as the "automatic" conditional',
        body:`Pattern: <b>[plain verb] と</b> + result. Translation: "when X, Y always happens." Use it for natural laws, mechanical processes, predictable consequences, recurring habits.`,
      },
      { type:'pattern', cells:['Plain verb','と','、result'],
        body:`Verb stays in plain form. <b>と</b> attaches directly. A comma usually follows.`,
      },
      { type:'examples', items:[
        { ja:'春になると、桜が咲く。', parts:['春になる','と','、桜','が','咲く。'], kana:'はるに なると、さくらが さく。', en:'When spring comes, cherry blossoms bloom.' },
        { ja:'朝起きると、コーヒーを飲む。', parts:['朝起きる','と','、コーヒー','を','飲む。'], kana:'あさ おきると、こーひーを のむ。', en:'When I wake up in the morning, I drink coffee.  (habit)' },
        { ja:'ボタンを押すと、ドアが開く。', parts:['ボタン','を','押す','と','、ドア','が','開く。'], kana:'ぼたんを おすと、どあが ひらく。', en:'When you press the button, the door opens.  (mechanical)' },
      ]},
      { type:'concept',
        title:'と vs other conditionals',
        body:`Japanese has four conditionals — each with a flavor:<br>
        • <b>と</b> — automatic / predictable / natural law<br>
        • <span class="ja">ば</span> — hypothetical / "if"<br>
        • <span class="ja">たら</span> — "after / once X happens, then Y"<br>
        • <span class="ja">なら</span> — "if it\'s the case that X"<br>
        <b>と</b> is for "always happens this way."`,
      },
      { type:'concept',
        title:'Common categories',
        body:`Weather and seasons (<span class="ja">春になると…</span>). Natural science (<span class="ja">温度が上がると、水が沸騰する</span>). Mechanical processes (<span class="ja">ボタンを押すと…</span>). Habitual patterns (<span class="ja">家に帰ると、テレビをつける</span>).`,
      },
      { type:'mistake',
        title:'と + command or invitation',
        body:`<b>と</b> cannot be followed by commands, requests, or invitations. <span class="ja">春になると、来てください</span> ✗. The result clause must be a declarative outcome — something that automatically happens, not something requested.`,
      },
      { type:'mistake',
        title:'と for one-time future events',
        body:`<span class="ja">明日雨が降ると、出かけません</span> sounds odd. For one-off conditional plans, use <span class="ja">ば</span> or <span class="ja">たら</span>. <b>と</b> is for repeating, automatic, or universal patterns.`,
      },
      { type:'check',
        qJa:'春になる___、桜が咲く。', qEn:'"When spring comes, cherry blossoms bloom."',
        options:['と','ば','たら','し'], answer:0,
        explain:`<b>と</b>. Cherry blossoms blooming when spring comes is a <i>natural law</i> — every year, every time. That\'s the <b>と</b> conditional.`,
      },
    ],
    takeaways:[
      'と after a plain verb = "when X, Y always happens."',
      'Use for natural laws, predictable outcomes, mechanical processes, habits.',
      'Cannot be followed by commands or requests.',
      'For hypotheticals, use ば. For sequences, use たら. For "if it\'s true that," use なら.',
      'Same と as "and / with / quotation" — different role, same character.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 14 — や (vs と): representative list
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-14-ya', num:14,
    titleJa:'代表的列挙', titleEn:'や vs と — representative list',
    particles:['や','と'], block:'joining', time:'5 min', status:'ready',
    intro:`<b>や</b> lists examples without committing to the full set. It\'s "and" with an implied "etc." — perfect for when you\'re listing types or kinds without saying "exactly these and no others."`,
    steps:[
      { type:'concept',
        title:'や lists examples, not the whole set',
        body:`<b>や</b> says "things like X and Y." The full list is bigger; X and Y are just representatives. The listener understands "and others like them."`,
      },
      { type:'pattern', cells:['Noun A','や','Noun B','(など)'],
        body:`Often paired with <span class="ja">など</span> ("etc.") at the end. <span class="ja">など</span> is optional — <b>や</b> already implies "and others."`,
      },
      { type:'examples', items:[
        { ja:'りんごやみかんが好き。', parts:['りんご','や','みかん','が','好き。'], kana:'りんごや みかんが すき。', en:'I like things like apples and oranges.  (and similar fruits)' },
        { ja:'本やペンを買った。', parts:['本','や','ペン','を','買った。'], kana:'ほんや ぺんを かった。', en:'I bought things like books and pens.' },
        { ja:'公園やデパートに行く。', parts:['公園','や','デパート','に','行く。'], kana:'こうえんや でぱーとに いく。', en:'I go to places like the park and the department store.' },
      ]},
      { type:'contrast',
        body:`Side-by-side with <b>と</b>. Notice the implication shift:`,
        a:{ ja:'りんごとみかんが好き。', parts:['りんご','と','みかん','が','好き。'],
            en:'I like apples and oranges.  (exactly those two — exhaustive)' },
        b:{ ja:'りんごやみかんが好き。', parts:['りんご','や','みかん','が','好き。'],
            en:'I like apples, oranges, and others like them.  (representative)' },
      },
      { type:'concept',
        title:'When to choose や',
        body:`You\'re listing examples, not the whole inventory. The actual list is longer or open-ended. You want to imply variety without spelling it all out.`,
      },
      { type:'concept',
        title:'Often paired with など',
        body:`<span class="ja">パン<b style="color:#8d6630">や</b>おにぎりなどを食べる</span> = "I eat things like bread and rice balls." The <span class="ja">など</span> reinforces the "etc." reading.`,
      },
      { type:'mistake',
        title:'Using や for an exhaustive pair',
        body:`<span class="ja">夫と妻</span> (husband and wife) — only two people, use <b>と</b>. <span class="ja">夫や妻</span> sounds strange because there\'s no "etc." possible.`,
      },
      { type:'mistake',
        title:'や with verbs or adjectives',
        body:`<b>や</b> only works between <i>nouns</i>. You can\'t connect verbs or adjectives with や. For "I read books, watch movies, etc.," you\'d structure differently.`,
      },
      { type:'check',
        qJa:'りんご___みかんが好き。', qEn:'"I like apples, oranges, and similar fruits."',
        options:['や','と','も','に'], answer:0,
        explain:`<b>や</b>. The "and similar fruits" reading means the list is representative, not exhaustive → <b>や</b>.`,
      },
    ],
    takeaways:[
      'や = "X, Y, and others like them" (representative list).',
      'と = "X and Y, exhaustively" (closed list).',
      'Often paired with など ("etc.") for emphasis.',
      'Only works between nouns — not verbs or adjectives.',
      'Test: did you list everything you mean, or only examples? Everything → と. Examples → や.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 15 — も: also, emphasis, with negatives
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-15-mo', num:15,
    titleJa:'同類と強調', titleEn:'も — also · emphasis · with negatives',
    particles:['も'], block:'additive', time:'7 min', status:'ready',
    intro:`<b>も</b> is the additive particle — it says "also," "too," "as well." But it has powerful secondary lives: emphasizing surprisingly large quantities, and pairing with question words + negatives to form sweeping statements like "nobody," "nothing," "nowhere."`,
    steps:[
      { type:'concept',
        title:'も as "also / too"',
        body:`When something is added to what was already said, <b>も</b> replaces the particle that would normally appear (<span class="ja">は</span>, <span class="ja">が</span>, or <span class="ja">を</span>).`,
      },
      { type:'examples', items:[
        { ja:'私も学生です。', parts:['私','も','学生です。'], kana:'わたしも がくせいです。', en:'I\'m also a student.' },
        { ja:'コーヒーも飲む。', parts:['コーヒー','も','飲む。'], kana:'こーひーも のむ。', en:'I drink coffee too.' },
        { ja:'田中さんも来た。', parts:['田中さん','も','来た。'], kana:'たなかさんも きた。', en:'Tanaka also came.' },
      ]},
      { type:'concept',
        title:'Replaces は / が / を, but stacks after に / で / と / へ',
        body:`<b>も</b> replaces topic / subject / object particles (<span class="ja">は</span>, <span class="ja">が</span>, <span class="ja">を</span>). For others (<span class="ja">に</span>, <span class="ja">で</span>, <span class="ja">と</span>, <span class="ja">へ</span>), <b>も</b> stacks AFTER them: <span class="ja">学校<b style="color:#3a7a4a">に</b><b style="color:#6a3a92">も</b>行く</span> (I\'ll go to school too).`,
      },
      { type:'concept',
        title:'も for emphasis with quantities — "as much as N"',
        body:`When <b>も</b> attaches to a number or quantity, it means "as much as" — emphasizing how surprisingly large the amount is.`,
      },
      { type:'examples', items:[
        { ja:'三時間も待った。', parts:['三時間','も','待った。'], kana:'さんじかんも まった。', en:'I waited (as much as) three hours.' },
        { ja:'五年も日本にいる。', parts:['五年','も','日本','に','いる。'], kana:'ごねんも にほんに いる。', en:'I\'ve been in Japan for five whole years.' },
        { ja:'1万円もした。', parts:['1万円','も','した。'], kana:'いちまんえんも した。', en:'It cost (as much as) 10,000 yen.' },
      ]},
      { type:'concept',
        title:'Question word + も + negative = sweeping "no"',
        body:`When a question word (<span class="ja">誰</span>, <span class="ja">何</span>, <span class="ja">どこ</span>, <span class="ja">いつ</span>) takes <b>も</b> and is followed by a negative verb, the meaning becomes <i>universal negation</i>.`,
      },
      { type:'examples', items:[
        { ja:'誰も来なかった。', parts:['誰','も','来なかった。'], kana:'だれも こなかった。', en:'Nobody came.' },
        { ja:'何も食べていない。', parts:['何','も','食べていない。'], kana:'なにも たべていない。', en:'I haven\'t eaten anything.' },
        { ja:'どこにも行かない。', parts:['どこ','に','も','行かない。'], kana:'どこにも いかない。', en:'I\'m not going anywhere.' },
      ]},
      { type:'concept',
        title:'も…も — "both X and Y"',
        body:`Doubling up: <span class="ja">A も B も</span> = "both A and B" (or "neither A nor B" with a negative).`,
      },
      { type:'examples', items:[
        { ja:'犬も猫も好き。', parts:['犬','も','猫','も','好き。'], kana:'いぬも ねこも すき。', en:'I like both dogs and cats.' },
        { ja:'パンもご飯も食べない。', parts:['パン','も','ご飯','も','食べない。'], kana:'ぱんも ごはんも たべない。', en:'I eat neither bread nor rice.' },
      ]},
      { type:'mistake',
        title:'Forgetting も with question words',
        body:`<span class="ja">誰は来なかった</span> is wrong (and meaningless — "as for who, came-not"). For sweeping negation, the pattern is always <span class="ja">誰<b style="color:#6a3a92">も</b></span> or <span class="ja">何<b style="color:#6a3a92">も</b></span> + negative.`,
      },
      { type:'check',
        qJa:'誰___来なかった。', qEn:'"Nobody came." — which particle?',
        options:['も','が','は','と'], answer:0,
        explain:`<b>も</b>. Question word (<span class="ja">誰</span>) + <b>も</b> + negative verb (<span class="ja">来なかった</span>) = "no one came." The classic sweeping-negation pattern.`,
      },
    ],
    takeaways:[
      'も = "also / too" (replaces は, が, を).',
      'With quantities: emphatic "as much as N."',
      'Question word + も + negative = "nobody / nothing / nowhere."',
      'も…も = "both X and Y" (or "neither" with negative).',
      'Memorize the question-word + も + negative pattern — used constantly.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 16 — から & まで: from-to in space/time + because
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-16-kara-made', num:16,
    titleJa:'範囲と理由', titleEn:'から & まで — from, until, because',
    particles:['から','まで'], block:'range', time:'7 min', status:'ready',
    intro:`<b>から</b> and <b>まで</b> are a pair. <b>から</b> marks where something starts (in space, time, or causation). <b>まで</b> marks where it ends. Together they describe a range — from-to. Separately, each is a workhorse in its own right.`,
    steps:[
      { type:'concept',
        title:'から — starting point',
        body:`In space, time, and reason, <b>から</b> marks where something begins.`,
      },
      { type:'examples', items:[
        { ja:'九時から働く。', parts:['九時','から','働く。'], kana:'くじから はたらく。', en:'I work from 9.' },
        { ja:'アメリカから来た。', parts:['アメリカ','から','来た。'], kana:'あめりかから きた。', en:'I came from America.' },
        { ja:'駅から歩く。', parts:['駅','から','歩く。'], kana:'えきから あるく。', en:'I walk from the station.' },
      ]},
      { type:'concept',
        title:'まで — ending point',
        body:`<b>まで</b> marks where motion or duration stops.`,
      },
      { type:'examples', items:[
        { ja:'五時まで働く。', parts:['五時','まで','働く。'], kana:'ごじまで はたらく。', en:'I work until 5.' },
        { ja:'駅まで歩く。', parts:['駅','まで','歩く。'], kana:'えきまで あるく。', en:'I walk as far as the station.' },
      ]},
      { type:'pattern', cells:['Start','から','end','まで'],
        body:`Used together, から〜まで describes a complete range.`,
      },
      { type:'examples', items:[
        { ja:'九時から五時まで働く。', parts:['九時','から','五時','まで','働く。'], kana:'くじから ごじまで はたらく。', en:'I work from 9 to 5.' },
        { ja:'月曜日から金曜日まで。', parts:['月曜日','から','金曜日','まで','。'], kana:'げつようびから きんようびまで。', en:'Monday through Friday.' },
        { ja:'家から駅まで十分。', parts:['家','から','駅','まで','十分。'], kana:'いえから えきまで じゅっぷん。', en:'10 minutes from home to the station.' },
      ]},
      { type:'concept',
        title:'から as "because" (reason)',
        body:`<b>から</b> also expresses causation. Pattern: <b>[clause] から、[clause]</b>. The clause before <b>から</b> is the reason; the clause after is the result.`,
      },
      { type:'examples', items:[
        { ja:'寒いから、コートを着る。', parts:['寒い','から','、コート','を','着る。'], kana:'さむいから、こーとを きる。', en:'Because it\'s cold, I\'ll wear a coat.' },
        { ja:'忙しいから、行けない。', parts:['忙しい','から','、行けない。'], kana:'いそがしいから、いけない。', en:'Because I\'m busy, I can\'t go.' },
        { ja:'お腹が空いたから、食べよう。', parts:['お腹','が','空いた','から','、食べよう。'], kana:'おなかが すいたから、たべよう。', en:'I\'m hungry, so let\'s eat.' },
      ]},
      { type:'concept',
        title:'まで with verbs — "until X happens"',
        body:`Beyond places and times, <b>まで</b> can attach to verbs to mean "until X happens."`,
      },
      { type:'examples', items:[
        { ja:'終わるまで待つ。', parts:['終わる','まで','待つ。'], kana:'おわるまで まつ。', en:'I\'ll wait until it ends.' },
        { ja:'寝るまで本を読む。', parts:['寝る','まで','本','を','読む。'], kana:'ねるまで ほんを よむ。', en:'I read until I sleep.' },
      ]},
      { type:'concept',
        title:'まで as "even"',
        body:`In some contexts, <b>まで</b> means "even" — extending the scope to an extreme.`,
      },
      { type:'examples', items:[
        { ja:'子供までできる。', parts:['子供','まで','できる。'], kana:'こどもまで できる。', en:'Even a child can do it.' },
      ]},
      { type:'check',
        qJa:'九時___五時まで働きます。', qEn:'"I work from 9 to 5." — which particle?',
        options:['から','まで','に','で'], answer:0,
        explain:`<b>から</b>. The starting point of the range → <b>から</b>; the endpoint is already marked with <span class="ja">まで</span>.`,
      },
    ],
    takeaways:[
      'から = starting point (space, time, reason).',
      'まで = ending point (space, time).',
      'から〜まで = a range.',
      'から as "because" — the pre-clause is the reason.',
      'まで can attach to verbs ("until X happens") and mean "even" in some contexts.',
      'These two particles are inseparable — learn them together.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 17 — Synthesis: the particle ecosystem
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-17-synthesis', num:17,
    titleJa:'助詞のまとめ', titleEn:'The ecosystem — common mistakes + the map',
    particles:['は','が','を','に','で','へ','の','と','も','から','まで','や'],
    block:'synthesis', time:'10 min', status:'ready',
    intro:`You now know all twelve core Japanese particles. This lesson zooms out: how do they fit together as a system, what mental models keep them straight, and what mistakes to avoid as you build longer sentences. Treat it as a reference you can return to.`,
    steps:[
      { type:'concept',
        title:'The map — twelve particles, by role',
        body:`<b>は</b> topic ("as for X") · <b>が</b> subject / new info / identification · <b>を</b> direct object · path · leaving · <b>に</b> destination · location of existence · time · recipient (the thumbtack) · <b>で</b> place of action · means · cause (the channel) · <b>へ</b> direction (overlap with に, more journey-emphasis) · <b>の</b> noun-noun connector · nominalizer · <b>と</b> exhaustive "and" · with · quotation · conditional · <b>や</b> representative list · <b>も</b> also · emphasis · sweeping "no" with negative · <b>から</b> starting point · because · <b>まで</b> ending point · "even"`,
      },
      { type:'concept',
        title:'The mental model — particles as role-markers',
        body:`English uses word order to assign roles ("John ate sushi" vs "Sushi ate John"). Japanese uses particles. Word order becomes flexible because <i>each noun carries its role on its back</i>. The verb sits at the end, and as you read left to right, each particle tells you HOW the noun relates to that final verb.`,
      },
      { type:'concept',
        title:'The classic confusions, recapped',
        body:`• <b>は vs が</b> — topic (known) vs subject (new info). Question words always take <b>が</b>.<br>
        • <b>に vs で</b> — state vs action. <span class="ja">ある / いる / 住む</span> → <b>に</b>. <span class="ja">働く / 勉強する / 食べる</span> → <b>で</b>.<br>
        • <b>へ vs に</b> — usually interchangeable; <b>へ</b> emphasizes direction, <b>に</b> emphasizes arrival.<br>
        • <b>と vs や</b> — exhaustive vs representative. "Exactly these two" → <b>と</b>. "And similar things" → <b>や</b>.`,
      },
      { type:'concept',
        title:'The X は Y が insight (Lesson 3, revisited)',
        body:`The umbrella topic pattern underlies a huge chunk of natural Japanese:<br>
        • <span class="ja">弟<b style="color:#8a2538">は</b>背<b style="color:#c97a2c">が</b>高い</span> (umbrella + inner subject)<br>
        • <span class="ja">私<b style="color:#8a2538">は</b>コーヒー<b style="color:#c97a2c">が</b>好き</span> (preferences)<br>
        • <span class="ja">田中さん<b style="color:#8a2538">は</b>ピアノ<b style="color:#c97a2c">が</b>上手</span> (skills)<br>
        When you see two markers in one sentence, parse it as "as for X, Y is [adj/verb]."`,
      },
      { type:'concept',
        title:'The "particle field" sensation',
        body:`Long Japanese sentences feel daunting until you internalize particles. Try reading a sentence by skipping the nouns and just listening for the particles:<br><br>
        <span class="ja">私<b style="color:#8a2538">は</b>今日コーヒー<b style="color:#5a2e8a">を</b>カフェ<b style="color:#2e7a3f">で</b>友達<b style="color:#2a5b94">と</b>飲んだ。</span><br><br>
        Even without recognizing every noun: topic (me), object (coffee), place of action (café), companion (friend). The particles tell you the shape of the sentence before the words do.`,
      },
      { type:'mistake',
        title:'Final checklist — common mistakes',
        body:`• Putting <span class="ja">は</span> after a question word → use <span class="ja">が</span><br>
        • Using <span class="ja">で</span> with <span class="ja">住む / ある / いる</span> → use <span class="ja">に</span> (state)<br>
        • Using <span class="ja">に</span> with <span class="ja">働く / 勉強する</span> → use <span class="ja">で</span> (action)<br>
        • Putting <span class="ja">に</span> on relative times (<span class="ja">今日, 明日, 毎日</span>) → drop the particle<br>
        • Using <span class="ja">と</span> for an open-ended list → use <span class="ja">や</span><br>
        • Treating <span class="ja">の</span> as only "of" → remember the nominalizer and the sentence-final softener`,
      },
      { type:'concept',
        title:'Where to go next',
        body:`You have the foundation. Next steps in your own time:<br>
        • <b>Compound particles</b> — について, によって, によると, から見ると. These build on your base.<br>
        • <b>Sentence-ending particles</b> — よ, ね, よね, かな, さ. For nuance and tone.<br>
        • <b>Casual variants</b> — って (instead of と), とか (instead of や), なんて. Spoken Japanese.<br>
        • <b>Subtle ones</b> — のに, ものの, わけ, ばかり. N3-N2 territory; nuanced grammar.`,
      },
      { type:'concept',
        title:'The single most important takeaway',
        body:`Particles are not decorations. They are the structural skeleton of every Japanese sentence. <i>Reading Japanese is reading particles.</i> <i>Listening is listening for particles.</i> Once they click — and they do — Japanese stops feeling like a puzzle and starts feeling like a system.`,
      },
      { type:'check',
        qJa:'弟___背___高いです。', qEn:'"My brother is tall." — the umbrella topic pattern, which particles?',
        options:['は · が','が · は','は · を','の · が'], answer:0,
        explain:`<b>は · が</b>. <span class="ja">弟<b style="color:#8a2538">は</b></span> sets the topic ("as for my brother"), and <span class="ja">背<b style="color:#c97a2c">が</b></span> marks the actual subject of <span class="ja">高い</span> (tall). The pattern you\'ve seen across many lessons.`,
      },
    ],
    takeaways:[
      'All 12 particles fit into 6 functional groups: topic/subject, object/place, time, description, joining, additive/range.',
      'Word order is flexible because particles carry the roles.',
      'The classic confusions (は/が, に/で, へ/に, と/や) all have clean rules — review them when uncertain.',
      'The X は Y が pattern underlies the most natural Japanese sentences.',
      'Particles are the skeleton — everything else hangs off them. You\'re fluent in the system now.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // Lesson 18 — Zero が: when the subject marker disappears
  // ════════════════════════════════════════════════════════════════════════
  {
    id:'lesson-18-zero-ga', num:18,
    titleJa:'ゼロガ', titleEn:'Zero が — when the subject marker disappears',
    particles:['が','∅'],
    block:'omission', time:'8 min', status:'ready',
    intro:`In casual speech, native speakers drop <b>が</b> all the time. <span class="ja">お腹空いた</span> ("I'm hungry") and <span class="ja">時間ある？</span> ("Got time?") both contain a hidden が that linguists call <i>ゼロが</i> — "zero が." The particle is gone from the surface, but the grammatical role it marked is still there. Learning to hear the gap is the difference between sounding like a textbook and sounding like a person.`,
    steps:[
      { type:'concept',
        title:'What "zero が" means',
        body:`Zero が ( <span class="ja">ゼロガ / ガ格の省略</span> ) is the linguistic name for a <b>dropped</b> subject marker. The subject is still there; the particle that marks it is just invisible. Compare:<br>
        • Full: <span class="ja">お腹<b style="color:#c97a2c">が</b>空いた</span> — "my stomach has emptied → I'm hungry"<br>
        • Zero: <span class="ja">お腹<b style="color:#999">∅</b>空いた</span> — same meaning, casual register<br>
        The "∅" symbol is how linguists mark the slot where が <i>would</i> sit. You don't write it — it's a teaching device.`,
      },
      { type:'concept',
        title:'Zero が is NOT the same as は-topicalization',
        body:`When you say <span class="ja">私<b style="color:#8a2538">は</b>学生です</span>, <b>は</b> didn't replace <b>が</b> — <b>は</b> made the noun the <i>topic</i>, which happens to suppress the subject marker. That's a different mechanism.<br><br>
        Zero が is when <i>no marker appears at all</i>, but the noun is still grammatically the subject. Compare:<br>
        • <span class="ja">田中さん<b style="color:#8a2538">は</b>来ました</span> — topic structure (formal, neutral)<br>
        • <span class="ja">田中さん<b style="color:#c97a2c">が</b>来ました</span> — subject + が (focus on Tanaka)<br>
        • <span class="ja">田中さん<b style="color:#999">∅</b>来た</span> — zero が (casual)<br>
        Same skeletal meaning across all three; only the register and emphasis shift.`,
      },
      { type:'concept',
        title:'Where you hear zero が in the wild',
        body:`Zero が is heavily concentrated in:<br>
        • <b>Short casual sentences</b> with <span class="ja">ある / いる / 空く / 痛い / 上手</span>: <span class="ja">時間∅ある？</span> · <span class="ja">頭∅痛い</span> · <span class="ja">弟∅サッカー上手</span><br>
        • <b>Exclamations</b>: <span class="ja">雨∅降ってきた！</span> · <span class="ja">電車∅来た！</span><br>
        • <b>Subordinate clauses with question-words</b>: <span class="ja">誰∅来るか分からない</span> ("I don't know who's coming")<br>
        • <b>Relative clauses</b> (this is where it pairs with の — see Lesson 10): <span class="ja">私∅作った料理</span> ("the dish I made")`,
      },
      { type:'concept',
        title:'When you CANNOT drop が',
        body:`Zero が breaks down when the listener can't recover the subject. Two reliable triggers <i>force</i> the particle back in:<br>
        • <b>Question words</b> as subjects: <span class="ja">誰<b style="color:#c97a2c">が</b>来ましたか？</span> ("Who came?") — dropping が here would be ungrammatical, not just casual. Lesson 2's rule still holds.<br>
        • <b>Contrast / emphasis</b>: <span class="ja">私<b style="color:#c97a2c">が</b>やります</span> ("<i>I'll</i> do it") — pulling が back in is HOW you focus the subject. Drop it and the emphasis dies.<br>
        Rule of thumb: if the が is doing work (identifying or focusing), keep it. If it's just marking a subject everyone already knows, you can drop it.`,
      },
      { type:'concept',
        title:'Register — when zero が sounds natural vs. wrong',
        body:`Zero が lives mostly in <b>spoken, casual</b> Japanese. It also appears in writing that mimics speech: manga, song lyrics, casual messages, blog posts.<br><br>
        It feels <i>wrong</i> in:<br>
        • Formal writing (essays, reports, news)<br>
        • Business email<br>
        • Polite speech to strangers or superiors<br>
        • Any sentence longer than ~12 syllables, where the listener needs the marker to parse the role<br>
        When in doubt with a new conversational partner, keep the が. As you get more comfortable in casual settings, you'll start dropping it on instinct.`,
      },
      { type:'mistake',
        title:'The two common traps',
        body:`• <b>Dropping が in a "who/what" question</b> — <span class="ja">誰来るか？</span> sounds broken. Native speakers do say <span class="ja">誰来る？</span> in very casual speech, but it's the kind of thing that takes years of immersion to pull off. Stick to <span class="ja">誰<b style="color:#c97a2c">が</b>来る？</span> as a learner.<br>
        • <b>Dropping が in long sentences</b> — <span class="ja">昨日学校でクラスメート手伝った課題終わった</span> is parseable to a native ear but feels lazy and unclear. The full sentence with markers (<span class="ja">クラスメート<b style="color:#c97a2c">が</b>...課題<b style="color:#c97a2c">が</b>...</span>) is what natural Japanese actually does.`,
      },
      { type:'concept',
        title:'The mental model — particles as optional armor',
        body:`Think of particles as the skeleton's <i>visible</i> armor. In short, casual sentences the underlying skeleton is obvious to both speakers, so the armor comes off and the language gets faster. In longer or more formal sentences the armor stays on so nobody loses the thread.<br><br>
        Zero が isn't a separate particle — it's <b>the SAME が, just not pronounced</b>. The grammatical role is unchanged. Once you accept that, hearing where it should be becomes second nature.`,
      },
      { type:'check',
        qJa:'お腹___空いた！', qEn:'"I\'m hungry!" — casual spoken Japanese. Which is most natural?',
        options:['お腹が空いた','お腹は空いた','お腹空いた (zero が)','お腹を空いた'], answer:2,
        explain:`<b>お腹空いた</b> (zero が) is what you'll hear from a friend at lunch. The <b>が</b> is grammatically there but unmarked. <span class="ja">お腹<b style="color:#c97a2c">が</b>空いた</span> is also correct — slightly more emphatic or careful. <span class="ja">お腹<b style="color:#8a2538">は</b>空いた</span> implies contrast ("my stomach is empty <i>but</i>...") and <span class="ja">を</span> is wrong because 空く is intransitive.`,
      },
      { type:'check',
        qJa:'誰___来ましたか？', qEn:'"Who came?" — particle?',
        options:['が','は','∅ (drop it)','を'], answer:0,
        explain:`<b>が</b>. Question words as subjects always take が (Lesson 2, Rule 1). Even though casual speech allows dropping が in many places, question-word subjects are one of the contexts where <i>you cannot</i>. Zero が isn't allowed here.`,
      },
    ],
    takeaways:[
      'Zero が means the が is grammatically there but not pronounced — the subject role still holds.',
      'It\'s common in casual speech (esp. with ある / いる / 痛い / 上手 / short exclamations) and in relative clauses.',
      'It\'s different from は-topicalization — は actively topicalizes; zero が just omits the marker.',
      'You cannot drop が after a question word as subject, or when contrast/focus is the whole point.',
      'Heard but rarely taught — internalizing zero が is part of moving from textbook Japanese to spoken Japanese.',
    ],
  },
];
