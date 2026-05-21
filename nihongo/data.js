// Seed data for the nihongo study app.
// Designed to be easy to expand later — every entry is a flat object.

// ── VOCAB CLASSES ──────────────────────────────────────────────────────
// Top-level grouping. Each class holds a set of related books (categories).
// Books with `pages: []` render a placeholder — they reserve their slot in
// the UI before content lands.
const HOME_BOOKS = [
  {
    id: 'bathroom',
    titleJa: 'よくしつ',
    titleEn: 'Bathroom',
    glyph: '浴',
    primaryLevel: 'N5',
    pages: [
      {
        id: 'sheet-1',
        type: 'cheatsheet',
        title: 'よくしつ の ことば',
        subtitle: 'Bathroom & washroom — words for the space',
        // image-slot id; user drops the watercolor cheatsheet here
        imageSlotId: 'sheet-bathroom-1',
        items: [
          { num:1,  kanji:'浴室',              kana:'よくしつ',           en:'bathroom' },
          { num:2,  kanji:'鏡',                kana:'かがみ',             en:'mirror' },
          { num:3,  kanji:'洗面台',            kana:'せんめんだい',       en:'washbasin / vanity' },
          { num:4,  kanji:'蛇口',              kana:'じゃぐち',           en:'faucet / tap' },
          { num:5,  kanji:'シャワー',          kana:'しゃわー',           en:'shower' },
          { num:6,  kanji:'浴槽',              kana:'よくそう',           en:'bathtub' },
          { num:7,  kanji:'トイレ',            kana:'といれ',             en:'toilet' },
          { num:8,  kanji:'トイレットペーパー',kana:'といれっとぺーぱー', en:'toilet paper' },
          { num:9,  kanji:'バスマット',        kana:'ばすまっと',         en:'bath mat' },
          { num:10, kanji:'タオル',            kana:'たおる',             en:'towel' },
          { num:11, kanji:'ドア',              kana:'どあ',               en:'door' },
          { num:12, kanji:'窓',                kana:'まど',               en:'window' },
        ]
      },
      {
        id: 'sheet-2',
        type: 'cheatsheet',
        title: 'せんめんだい の ことば',
        subtitle: 'At the sink — closer look',
        imageSlotId: 'sheet-bathroom-2',
        items: [
          { num:1,  kanji:'洗面台',     kana:'せんめんだい',     en:'washbasin' },
          { num:2,  kanji:'鏡',         kana:'かがみ',           en:'mirror' },
          { num:3,  kanji:'蛇口',       kana:'じゃぐち',         en:'faucet' },
          { num:4,  kanji:'液体せっけん',kana:'えきたいせっけん', en:'liquid soap' },
          { num:5,  kanji:'歯ブラシ',   kana:'はぶらし',         en:'toothbrush' },
          { num:6,  kanji:'歯みがき粉', kana:'はみがきこ',       en:'toothpaste' },
          { num:7,  kanji:'コップ',     kana:'こっぷ',           en:'cup' },
          { num:8,  kanji:'ハンドタオル',kana:'はんどたおる',     en:'hand towel' },
          { num:9,  kanji:'くし',       kana:'くし',             en:'comb' },
          { num:10, kanji:'せっけん',   kana:'せっけん',         en:'soap bar' },
          { num:11, kanji:'ドライヤー', kana:'どらいやー',       en:'hair dryer' },
        ]
      },
      {
        id: 'usage',
        type: 'usage',
        title: 'つかいかた',
        subtitle: 'How these words show up in everyday actions',
        items: [
          { ja:'手を洗う',          kana:'てを あらう',          en:'to wash hands' },
          { ja:'シャワーを浴びる',  kana:'しゃわーを あびる',    en:'to take a shower' },
          { ja:'お風呂に入る',      kana:'おふろに はいる',      en:'to take a bath' },
          { ja:'歯を磨く',          kana:'はを みがく',          en:'to brush teeth' },
          { ja:'顔を洗う',          kana:'かおを あらう',        en:'to wash face' },
          { ja:'髪を乾かす',        kana:'かみを かわかす',      en:'to dry hair' },
          { ja:'タオルで体を拭く',  kana:'たおるで からだを ふく',en:'to dry off with a towel' },
          { ja:'鏡を見る',          kana:'かがみを みる',        en:'to look in the mirror' },
          { ja:'蛇口をひねる',      kana:'じゃぐちを ひねる',    en:'to turn the faucet' },
          { ja:'窓を開ける',        kana:'まどを あける',        en:'to open the window' },
        ]
      },
      {
        id: 'sentences',
        type: 'sentences',
        title: 'ぶん',
        subtitle: 'In sentences — start with N5, see more as you grow',
        items: [
          { ja:'食べる 前に、手を 洗います。',
            en:'I wash my hands before eating.', level:'N5' },
          { ja:'毎日 シャワーを 浴びます。',
            en:'I take a shower every day.', level:'N5' },
          { ja:'歯を 磨いてから 寝ます。',
            en:'After brushing my teeth, I go to sleep.', level:'N5' },
          { ja:'タオルで 顔を 拭いて ください。',
            en:'Please dry your face with the towel.', level:'N5' },
          { ja:'寒い 時、人は あまり シャワーを 浴びません。',
            en:"When it's cold, people don't shower much.", level:'N4' },
          { ja:'でも、それは よくないかも しれませんね。',
            en:"But maybe that's not such a good thing, you know?", level:'N4' },
          { ja:'お風呂の あとで、髪を 乾かします。',
            en:'After the bath, I dry my hair.', level:'N4' },
          { ja:'鏡を 見て、髪を 整えました。',
            en:'I looked in the mirror and fixed my hair.', level:'N4' },
          { ja:'窓を 開けると、新鮮な 空気が 入って きます。',
            en:'When you open the window, fresh air comes in.', level:'N3' },
          { ja:'毎朝、洗面台で 顔を 洗うのが 一日の はじまりです。',
            en:'Every morning, washing my face at the sink is how the day begins.', level:'N3' },
          { ja:'蛇口を 閉め忘れない ように 気を つけて ください。',
            en:'Please be careful not to forget to turn off the faucet.', level:'N3' },
          { ja:'湿気の せいで、鏡が くもって しまいました。',
            en:'Because of the humidity, the mirror has fogged up.', level:'N2' },
        ]
      },
    ]
  },
  {
    id: 'kitchen',
    titleJa: 'だいどころ',
    titleEn: 'Kitchen',
    glyph: '台',
    primaryLevel: 'N5',
    pages: [
      {
        id: 'sheet-1',
        type: 'cheatsheet',
        title: 'だいどころ の ことば',
        subtitle: 'In the kitchen',
        imageSlotId: 'sheet-kitchen-1',
        items: [
          { num:1,  kanji:'冷蔵庫',     kana:'れいぞうこ',  en:'refrigerator' },
          { num:2,  kanji:'電子レンジ', kana:'でんしれんじ',en:'microwave' },
          { num:3,  kanji:'コンロ',     kana:'こんろ',      en:'stovetop' },
          { num:4,  kanji:'鍋',         kana:'なべ',        en:'pot' },
          { num:5,  kanji:'フライパン', kana:'ふらいぱん',  en:'frying pan' },
          { num:6,  kanji:'包丁',       kana:'ほうちょう',  en:'kitchen knife' },
          { num:7,  kanji:'まな板',     kana:'まないた',    en:'cutting board' },
          { num:8,  kanji:'お皿',       kana:'おさら',      en:'plate' },
          { num:9,  kanji:'コップ',     kana:'こっぷ',      en:'cup / glass' },
          { num:10, kanji:'箸',         kana:'はし',        en:'chopsticks' },
        ]
      },
      {
        id: 'usage',
        type: 'usage',
        title: 'つかいかた',
        subtitle: 'Doing things in the kitchen',
        items: [
          { ja:'ご飯を作る',   kana:'ごはんを つくる', en:'to cook a meal' },
          { ja:'お皿を洗う',   kana:'おさらを あらう', en:'to wash dishes' },
          { ja:'野菜を切る',   kana:'やさいを きる',   en:'to cut vegetables' },
          { ja:'お湯を沸かす', kana:'おゆを わかす',   en:'to boil water' },
          { ja:'冷蔵庫を開ける',kana:'れいぞうこを あける',en:'to open the fridge' },
        ]
      },
      {
        id: 'sentences',
        type: 'sentences',
        title: 'ぶん',
        subtitle: 'Sentences in the kitchen',
        items: [
          { ja:'毎晩、母が ご飯を 作ります。',  en:'Every night, my mother cooks dinner.', level:'N5' },
          { ja:'お皿を 洗って ください。',     en:'Please wash the dishes.', level:'N5' },
          { ja:'冷蔵庫に 何も ありません。',   en:"There's nothing in the fridge.", level:'N5' },
          { ja:'包丁は 危ない から、気を つけて。',en:"Knives are dangerous, so be careful.", level:'N4' },
          { ja:'お湯が 沸いたら、麺を 入れて ください。',en:'When the water boils, add the noodles.', level:'N4' },
          { ja:'残った 料理は 冷蔵庫に しまって おきましょう。',en:'Let’s put the leftover food away in the fridge.', level:'N3' },
        ]
      }
    ]
  },
  {
    id: 'livingroom',
    titleJa: 'いま',
    titleEn: 'Living Room',
    glyph: '居',
    primaryLevel: 'N5',
    pages: [
      {
        id: 'sheet-1',
        type: 'cheatsheet',
        title: 'いま の ことば',
        subtitle: 'In the living room',
        imageSlotId: 'sheet-livingroom-1',
        items: [
          { num:1,  kanji:'ソファ',     kana:'そふぁ',      en:'sofa' },
          { num:2,  kanji:'テーブル',   kana:'てーぶる',    en:'table' },
          { num:3,  kanji:'テレビ',     kana:'てれび',      en:'television' },
          { num:4,  kanji:'本棚',       kana:'ほんだな',    en:'bookshelf' },
          { num:5,  kanji:'カーテン',   kana:'かーてん',    en:'curtain' },
          { num:6,  kanji:'絨毯',       kana:'じゅうたん',  en:'rug / carpet' },
          { num:7,  kanji:'クッション', kana:'くっしょん',  en:'cushion' },
          { num:8,  kanji:'時計',       kana:'とけい',      en:'clock' },
          { num:9,  kanji:'ランプ',     kana:'らんぷ',      en:'lamp' },
          { num:10, kanji:'植木鉢',     kana:'うえきばち',  en:'potted plant' },
        ]
      },
      {
        id: 'usage',
        type: 'usage',
        title: 'つかいかた',
        subtitle: 'Spending time in the living room',
        items: [
          { ja:'テレビを見る',     kana:'てれびを みる',    en:'to watch TV' },
          { ja:'ソファに座る',     kana:'そふぁに すわる',  en:'to sit on the sofa' },
          { ja:'本を読む',         kana:'ほんを よむ',      en:'to read a book' },
          { ja:'カーテンを閉める', kana:'かーてんを しめる',en:'to close the curtain' },
          { ja:'お茶を飲む',       kana:'おちゃを のむ',    en:'to drink tea' },
        ]
      },
      {
        id: 'sentences',
        type: 'sentences',
        title: 'ぶん',
        subtitle: 'Living-room sentences',
        items: [
          { ja:'ソファで 休んで います。',  en:"I'm resting on the sofa.", level:'N5' },
          { ja:'テレビを 見ても いいですか？',en:'Can I watch TV?', level:'N5' },
          { ja:'夜は、カーテンを 閉めます。',en:'At night, I close the curtains.', level:'N5' },
          { ja:'時々、本を 読みながら お茶を 飲みます。',en:'Sometimes I drink tea while reading.', level:'N4' },
          { ja:'部屋を きれいに してから、友達を 呼びました。',en:'After cleaning the room, I invited friends over.', level:'N3' },
        ]
      }
    ]
  },
  {
    id: 'bedroom',
    titleJa: 'しんしつ',
    titleEn: 'Bedroom',
    glyph: '寝',
    primaryLevel: 'N5',
    pages: [
      {
        id: 'sheet-1',
        type: 'cheatsheet',
        title: 'しんしつ の ことば',
        subtitle: 'In the bedroom',
        imageSlotId: 'sheet-bedroom-1',
        items: [
          { num:1,  kanji:'ベッド',     kana:'べっど',      en:'bed' },
          { num:2,  kanji:'枕',         kana:'まくら',      en:'pillow' },
          { num:3,  kanji:'布団',       kana:'ふとん',      en:'futon / duvet' },
          { num:4,  kanji:'目覚まし時計',kana:'めざましどけい',en:'alarm clock' },
          { num:5,  kanji:'クローゼット',kana:'くろーぜっと',en:'closet' },
          { num:6,  kanji:'引き出し',   kana:'ひきだし',    en:'drawer' },
          { num:7,  kanji:'鏡',         kana:'かがみ',      en:'mirror' },
          { num:8,  kanji:'スタンド',   kana:'すたんど',    en:'bedside lamp' },
          { num:9,  kanji:'カーテン',   kana:'かーてん',    en:'curtain' },
        ]
      },
      {
        id: 'usage',
        type: 'usage',
        title: 'つかいかた',
        subtitle: 'Going to bed / waking up',
        items: [
          { ja:'寝る',           kana:'ねる',           en:'to sleep / go to bed' },
          { ja:'起きる',         kana:'おきる',         en:'to wake up' },
          { ja:'目覚ましをかける',kana:'めざましを かける',en:'to set the alarm' },
          { ja:'布団をたたむ',   kana:'ふとんを たたむ',en:'to fold up the futon' },
        ]
      },
      {
        id: 'sentences',
        type: 'sentences',
        title: 'ぶん',
        subtitle: 'Bedroom sentences',
        items: [
          { ja:'十時に 寝ます。',          en:'I go to bed at 10.', level:'N5' },
          { ja:'目覚ましを 七時に かけました。',en:'I set the alarm for 7.', level:'N5' },
          { ja:'なかなか 眠れません。',    en:"I can't really get to sleep.", level:'N4' },
          { ja:'寝る 前に、本を 少し 読みます。',en:'Before bed, I read a little.', level:'N4' },
        ]
      }
    ]
  },
  {
    id: 'entrance',
    titleJa: 'げんかん',
    titleEn: 'Entrance',
    glyph: '玄',
    primaryLevel: 'N5',
    pages: [
      {
        id: 'sheet-1',
        type: 'cheatsheet',
        title: 'げんかん の ことば',
        subtitle: 'At the entrance',
        imageSlotId: 'sheet-entrance-1',
        items: [
          { num:1,  kanji:'玄関',     kana:'げんかん',    en:'entryway' },
          { num:2,  kanji:'靴',       kana:'くつ',        en:'shoes' },
          { num:3,  kanji:'スリッパ', kana:'すりっぱ',    en:'slippers' },
          { num:4,  kanji:'傘',       kana:'かさ',        en:'umbrella' },
          { num:5,  kanji:'鍵',       kana:'かぎ',        en:'key' },
          { num:6,  kanji:'郵便受け', kana:'ゆうびんうけ',en:'mailbox' },
          { num:7,  kanji:'ドア',     kana:'どあ',        en:'door' },
        ]
      },
      {
        id: 'usage',
        type: 'usage',
        title: 'つかいかた',
        subtitle: 'Coming and going',
        items: [
          { ja:'靴を脱ぐ', kana:'くつを ぬぐ', en:'to take off shoes' },
          { ja:'靴を履く', kana:'くつを はく', en:'to put on shoes' },
          { ja:'鍵をかける',kana:'かぎを かける',en:'to lock (with a key)' },
          { ja:'家を出る', kana:'いえを でる', en:'to leave the house' },
        ]
      },
      {
        id: 'sentences',
        type: 'sentences',
        title: 'ぶん',
        subtitle: 'Entrance sentences',
        items: [
          { ja:'家に 入る 時、靴を 脱ぎます。', en:"When you enter the house, you take off your shoes.", level:'N5' },
          { ja:'雨が 降って いるから、傘を 持って いきます。',en:"It's raining, so I'll take an umbrella.", level:'N4' },
          { ja:'出かける 前に、鍵を かけるのを 忘れないで ください。',en:"Don't forget to lock the door before going out.", level:'N3' },
        ]
      }
    ]
  },
];

window.VOCAB_CLASSES = [
  {
    id: 'home',
    glyph: '家',
    titleJa: 'いえ',
    titleEn: 'Home',
    pageTitleJa: '部屋ごとに ことばを 集める',
    pageTitleEn: 'Vocabulary, gathered room by room',
    books: HOME_BOOKS,
  },
  {
    id: 'eating-out',
    glyph: '食',
    titleJa: 'がいしょく',
    titleEn: 'Eating Out',
    pageTitleJa: '食べに 出かける',
    pageTitleEn: 'Words for sitting down somewhere',
    books: [
      { id:'sushi-ya', titleJa:'すしや',   titleEn:'Sushi',       glyph:'寿', primaryLevel:'N5', pages:[] },
      { id:'omakase',  titleJa:'おまかせ', titleEn:'Omakase',     glyph:'板', primaryLevel:'N4', pages:[] },
      { id:'izakaya',  titleJa:'いざかや', titleEn:'Izakaya',     glyph:'串', primaryLevel:'N5', pages:[] },
      { id:'ramen-ya', titleJa:'ラーメン', titleEn:'Ramen',       glyph:'麺', primaryLevel:'N5', pages:[] },
      { id:'yatai',    titleJa:'やたい',   titleEn:'Street Food', glyph:'屋', primaryLevel:'N5', pages:[] },
      { id:'konbini',  titleJa:'コンビニ', titleEn:'Conbini',     glyph:'便', primaryLevel:'N5', pages:[] },
    ],
  },
  {
    id: 'stays',
    glyph: '宿',
    titleJa: 'やど',
    titleEn: 'Stays',
    pageTitleJa: '場面ごとに ことばを 集める',
    pageTitleEn: 'Places and scenes — beyond home',
    books: [
      { id:'hotel',  titleJa:'ホテル',   titleEn:'Hotel',       glyph:'宿', primaryLevel:'N5', pages:[] },
      { id:'office', titleJa:'おふぃす', titleEn:'Office',      glyph:'働', primaryLevel:'N4', pages:[] },
      { id:'airbnb', titleJa:'えあびー', titleEn:'Airbnb host', glyph:'貸', primaryLevel:'N3', pages:[] },
      { id:'dorm',   titleJa:'りょう',   titleEn:'Dorm',        glyph:'寮', primaryLevel:'N4', pages:[] },
    ],
  },
];

// Flat list for cross-class lookups (dictionary jumps, popover word lookup).
window.VOCAB_BOOKS = window.VOCAB_CLASSES.flatMap(c => c.books);

// ── FLASHCARDS ─────────────────────────────────────────────────────────
// Cards are grouped into classes. Each class is a focused thematic deck;
// adding more classes is the easiest way to grow the curriculum.
window.FLASHCARD_CLASSES = [
  {
    id: 'basic',
    titleJa: 'きほん',
    titleEn: 'Basic',
    glyph: '一',
    cards: [
      // elements lead: 火 水 氷 (fire then water then ice)
      { id:'fire',      kanji:'火', kun:'ひ',     on:'カ',     en:'fire' },
      { id:'water',     kanji:'水', kun:'みず',   on:'スイ',   en:'water' },
      { id:'ice',       kanji:'氷', kun:'こおり', on:'ヒョウ', en:'ice' },
      { id:'tree',      kanji:'木', kun:'き',     on:'ボク',   en:'tree / wood' },
      { id:'book',      kanji:'本', kun:'もと',   on:'ホン',   en:'book / origin / root' },
      { id:'earth',     kanji:'土', kun:'つち',   on:'ド',     en:'earth / soil / Saturday' },
      { id:'leave',     kanji:'去', kun:'さる',   on:'キョ',   en:'to leave / past' },
      { id:'katana',    kanji:'刀', kun:'かたな', on:'トウ',   en:'katana / sword' },
      { id:'power',     kanji:'力', kun:'ちから', on:'リョク', en:'power / strength' },
      { id:'bow',       kanji:'弓', kun:'ゆみ',   on:'キュウ', en:'bow' },
      { id:'city',      kanji:'市', kun:'いち',   on:'シ',     en:'market / city' },
      { id:'ricefield', kanji:'田', kun:'た',     on:'デン',   en:'rice field' },
      { id:'town',      kanji:'町', kun:'まち',   on:'チョウ', en:'town' },
      { id:'village',   kanji:'村', kun:'むら',   on:'ソン',   en:'village' },
      { id:'king',      kanji:'王', kun:'おう',   on:'オウ',   en:'king' },
      { id:'life',      kanji:'生', kun:'い',     on:'セイ',   en:'life' },
      { id:'country',   kanji:'国', kun:'くに',   on:'コク',   en:'country' },
      { id:'sun',       kanji:'日', kun:'ひ',     on:'ニチ',   en:'sun / day' },
      { id:'moon',      kanji:'月', kun:'つき',   on:'ゲツ',   en:'moon / month' },
      { id:'mtn',       kanji:'山', kun:'やま',   on:'サン',   en:'mountain' },
      { id:'river',     kanji:'川', kun:'かわ',   on:'セン',   en:'river' },
      { id:'yen',       kanji:'円', kun:'まる',   on:'エン',   en:'yen / circle' },
    ],
  },
  {
    id: 'people',
    titleJa: 'ひと',
    titleEn: 'People',
    glyph: '人',
    cards: [
      { id:'person', kanji:'人', kun:'ひと',     on:'ジン',   en:'person' },
      { id:'enter',  kanji:'入', kun:'はい',     on:'ニュウ', en:'enter' },
      { id:'exit',   kanji:'出', kun:'で',       on:'シュツ', en:'go out / exit' },
      // female cluster
      { id:'mother', kanji:'母', kun:'はは',     on:'ボ',     en:'mother',
        usage:{ ja:'お母さん', kana:'おかあさん' } },
      { id:'woman',  kanji:'女', kun:'おんな',   on:'ジョ',   en:'woman' },
      { id:'oneesan', kanji:'姉', kun:'あね',    on:'シ',     en:'older sister',
        usage:{ ja:'お姉さん', kana:'おねえさん' } },
      { id:'imouto', kanji:'妹', kun:'いもうと', on:'マイ',   en:'younger sister' },
      { id:'shimai', kanji:'姉妹', kun:'しまい', on:'シマイ', en:'sisters' },
      // male cluster
      { id:'father', kanji:'父', kun:'ちち',     on:'フ',     en:'father',
        usage:{ ja:'お父さん', kana:'おとうさん' } },
      { id:'man',    kanji:'男', kun:'おとこ',   on:'ダン',   en:'man' },
      { id:'oniisan', kanji:'兄', kun:'あに',    on:'ケイ',   en:'older brother',
        usage:{ ja:'お兄さん', kana:'おにいさん' } },
      { id:'otouto', kanji:'弟', kun:'おとうと', on:'テイ',   en:'younger brother' },
      { id:'kyoudai', kanji:'兄弟', kun:'きょうだい', on:'キョウダイ', en:'brothers / siblings' },
      // others
      { id:'child',  kanji:'子', kun:'こ',       on:'シ',     en:'child' },
      { id:'like',   kanji:'好', kun:'す',       on:'コウ',   en:'like / fond' },
      { id:'every',  kanji:'毎', kun:'まい',     on:'マイ',   en:'every' },
      { id:'friend', kanji:'友', kun:'とも',     on:'ユウ',   en:'friend' },
      { id:'anti',   kanji:'反', kun:'そら',     on:'ハン',   en:'anti- / opposite' },
    ],
  },
  {
    id: 'nature',
    titleJa: 'しぜん',
    titleEn: 'Nature',
    glyph: '自',
    cards: [
      // wood family + the not-yet/insect lead-in
      { id:'woods',    kanji:'林', kun:'はやし', on:'リン',   en:'woods' },
      { id:'forest',   kanji:'森', kun:'もり',   on:'シン',   en:'forest' },
      { id:'mada',     kanji:'未', kun:'まだ',   on:'ミ',     en:'not yet / unripe',
        seeAlso:['妹'] },
      { id:'insect',   kanji:'虫', kun:'むし',   on:'チュウ', en:'insect' },
      // seasons (N5)
      { id:'spring',   kanji:'春', kun:'はる',   on:'シュン', en:'spring' },
      { id:'summer',   kanji:'夏', kun:'なつ',   on:'カ',     en:'summer' },
      { id:'autumn',   kanji:'秋', kun:'あき',   on:'シュウ', en:'autumn' },
      { id:'winter',   kanji:'冬', kun:'ふゆ',   on:'トウ',   en:'winter' },
      // weather
      { id:'rain',     kanji:'雨', kun:'あめ',   on:'ウ',     en:'rain' },
      { id:'umbrella', kanji:'傘', kun:'かさ',   on:'サン',   en:'umbrella' },
      { id:'wind',     kanji:'風', kun:'かぜ',   on:'フウ',   en:'wind' },
      { id:'sky',      kanji:'空', kun:'そら',   on:'クウ',   en:'sky' },
      { id:'flower',   kanji:'花', kun:'はな',   on:'カ',     en:'flower' },
      { id:'snow',     kanji:'雪', kun:'ゆき',   on:'セツ',   en:'snow' },
      { id:'cloud',    kanji:'雲', kun:'くも',   on:'ウン',   en:'cloud' },
      { id:'star',     kanji:'星', kun:'ほし',   on:'セイ',   en:'star' },
      { id:'leaf',     kanji:'葉', kun:'は',     on:'ヨウ',   en:'leaf' },
      { id:'grass',    kanji:'草', kun:'くさ',   on:'ソウ',   en:'grass' },
    ],
  },
  {
    id: 'body',
    titleJa: 'からだ',
    titleEn: 'Body',
    glyph: '体',
    // Basic-first within thematic clusters. The 目見自首 cluster sits
    // together right after the eye — they all share the rectangular 目
    // component as a visual hook, even though their meanings diverge.
    cards: [
      { id:'hand',  kanji:'手', kun:'て',       on:'シュ', en:'hand' },
      // 目 cluster — same eye-radical shape
      { id:'eye',   kanji:'目', kun:'め',       on:'モク', en:'eye' },
      { id:'look',  kanji:'見', kun:'み',       on:'ケン', en:'look / see' },
      { id:'self',  kanji:'自', kun:'みずから', on:'ジ',   en:'self / oneself',
        usage:{ ja:'自分', kana:'じぶん' } },
      { id:'neck',  kanji:'首', kun:'くび',     on:'シュ', en:'neck' },
      // other body parts
      { id:'mouth', kanji:'口', kun:'くち',     on:'コウ', en:'mouth' },
      { id:'ear',   kanji:'耳', kun:'みみ',     on:'ジ',   en:'ear' },
      { id:'foot',  kanji:'足', kun:'あし',     on:'ソク', en:'foot / leg' },
      { id:'face',  kanji:'顔', kun:'かお',     on:'ガン', en:'face' },
      { id:'head',  kanji:'頭', kun:'あたま',   on:'トウ', en:'head' },
      { id:'hair',  kanji:'髪', kun:'かみ',     on:'ハツ', en:'hair' },
      { id:'tooth', kanji:'歯', kun:'は',       on:'シ',   en:'tooth' },
      { id:'heart', kanji:'心', kun:'こころ',   on:'シン', en:'heart / mind' },
      { id:'nose',  kanji:'鼻', kun:'はな',     on:'ビ',   en:'nose' },
      { id:'arm',   kanji:'腕', kun:'うで',     on:'ワン', en:'arm' },
    ],
  },
  {
    id: 'directions',
    titleJa: 'ほうこう',
    titleEn: 'Directions',
    glyph: '方',
    cards: [
      { id:'up',   kanji:'上', kun:'うえ', on:'ジョウ', en:'up / above' },
      { id:'down', kanji:'下', kun:'した', on:'カ',     en:'down / below' },
    ],
  },
];

// Flat list for any code that still expects FLASHCARDS as a single array.
window.FLASHCARDS = window.FLASHCARD_CLASSES.flatMap(c => c.cards);

// ── DICTIONARY ─────────────────────────────────────────────────────────
// Mixed kanji + vocabulary index. Each entry has kind ('kanji' | 'word')
// so the dictionary can filter by it.
window.DICTIONARY = [
  // single kanji
  { kind:'kanji', kanji:'風', kana:'かぜ',     en:'wind',            level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'水', kana:'みず',     en:'water',           level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'火', kana:'ひ',       en:'fire',            level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'山', kana:'やま',     en:'mountain',        level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'川', kana:'かわ',     en:'river',           level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'人', kana:'ひと',     en:'person',          level:'N5', tags:[] },
  { kind:'kanji', kanji:'入', kana:'はい.る',  en:'enter / put in',  level:'N5', tags:[] },
  { kind:'kanji', kanji:'出', kana:'で.る',    en:'go out / exit',   level:'N5', tags:[] },
  { kind:'kanji', kanji:'父', kana:'ちち',     en:'father',          level:'N5', tags:[] },
  { kind:'kanji', kanji:'母', kana:'はは',     en:'mother',          level:'N5', tags:[] },
  { kind:'kanji', kanji:'兄', kana:'あに',     en:'older brother',   level:'N5', tags:[] },
  { kind:'kanji', kanji:'姉', kana:'あね',     en:'older sister',    level:'N5', tags:[] },
  { kind:'kanji', kanji:'弟', kana:'おとうと', en:'younger brother', level:'N4', tags:[] },
  { kind:'kanji', kanji:'妹', kana:'いもうと', en:'younger sister',  level:'N4', tags:[] },
  { kind:'word',  kanji:'姉妹', kana:'しまい',    en:'sisters',            level:'N4', tags:[] },
  { kind:'word',  kanji:'兄弟', kana:'きょうだい', en:'brothers / siblings', level:'N4', tags:[] },
  { kind:'kanji', kanji:'子', kana:'こ',       en:'child',           level:'N5', tags:[] },
  { kind:'kanji', kanji:'女', kana:'おんな',   en:'woman',           level:'N5', tags:[] },
  { kind:'kanji', kanji:'好', kana:'す.き',    en:'like / fond',     level:'N5', tags:[] },
  { kind:'kanji', kanji:'男', kana:'おとこ',   en:'man',             level:'N5', tags:[] },
  { kind:'kanji', kanji:'毎', kana:'まい',     en:'every',           level:'N5', tags:['time'] },
  { kind:'kanji', kanji:'友', kana:'とも',     en:'friend',          level:'N4', tags:[] },
  { kind:'kanji', kanji:'反', kana:'はん',     en:'anti- / opposite', level:'N3', tags:[] },
  { kind:'kanji', kanji:'氷', kana:'こおり',   en:'ice',             level:'N3', tags:['nature'] },
  { kind:'kanji', kanji:'雪', kana:'ゆき',     en:'snow',            level:'N4', tags:['nature'] },
  { kind:'kanji', kanji:'空', kana:'そら',     en:'sky',             level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'雲', kana:'くも',     en:'cloud',           level:'N4', tags:['nature'] },
  { kind:'kanji', kanji:'星', kana:'ほし',     en:'star',            level:'N4', tags:['nature'] },
  { kind:'kanji', kanji:'葉', kana:'は',       en:'leaf',            level:'N3', tags:['nature'] },
  { kind:'kanji', kanji:'草', kana:'くさ',     en:'grass',           level:'N3', tags:['nature'] },
  { kind:'kanji', kanji:'未', kana:'まだ',     en:'not yet / unripe', level:'N3', tags:[] },
  { kind:'kanji', kanji:'木', kana:'き',       en:'tree',            level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'本', kana:'ほん',     en:'book / origin / root', level:'N5', tags:['home'] },
  { kind:'kanji', kanji:'林', kana:'はやし',   en:'woods',           level:'N4', tags:['nature'] },
  { kind:'kanji', kanji:'森', kana:'もり',     en:'forest',          level:'N4', tags:['nature'] },
  { kind:'kanji', kanji:'土', kana:'つち',     en:'earth / soil / Saturday', level:'N5', tags:['nature','time'] },
  { kind:'kanji', kanji:'去', kana:'さ.る',   en:'to leave / past',  level:'N4', tags:['time'] },
  { kind:'kanji', kanji:'刀', kana:'かたな',   en:'katana / sword',   level:'N3', tags:[] },
  { kind:'kanji', kanji:'力', kana:'ちから',   en:'power / strength', level:'N4', tags:[] },
  { kind:'kanji', kanji:'弓', kana:'ゆみ',     en:'bow',              level:'N3', tags:[] },
  { kind:'kanji', kanji:'市', kana:'いち',     en:'market / city',    level:'N4', tags:[] },
  { kind:'kanji', kanji:'田', kana:'た',       en:'rice field',       level:'N4', tags:['nature'] },
  { kind:'kanji', kanji:'町', kana:'まち',     en:'town',             level:'N4', tags:[] },
  { kind:'kanji', kanji:'村', kana:'むら',     en:'village',          level:'N4', tags:[] },
  { kind:'kanji', kanji:'王', kana:'おう',     en:'king',             level:'N4', tags:[] },
  { kind:'kanji', kanji:'生', kana:'なま',     en:'life / raw',       level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'国', kana:'くに',     en:'country',          level:'N5', tags:[] },
  { kind:'kanji', kanji:'円', kana:'えん',     en:'yen / circle',     level:'N5', tags:[] },
  { kind:'kanji', kanji:'上', kana:'うえ',     en:'up / above',       level:'N5', tags:[] },
  { kind:'kanji', kanji:'下', kana:'した',     en:'down / below',     level:'N5', tags:[] },
  { kind:'kanji', kanji:'日', kana:'ひ',       en:'sun / day',       level:'N5', tags:['time'] },
  { kind:'kanji', kanji:'月', kana:'つき',     en:'moon / month',    level:'N5', tags:['time'] },
  { kind:'kanji', kanji:'目', kana:'め',       en:'eye',             level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'手', kana:'て',       en:'hand',            level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'見', kana:'み.る',    en:'look / see',      level:'N5', tags:[] },
  { kind:'kanji', kanji:'自', kana:'じ',       en:'self / oneself',  level:'N4', tags:[] },
  { kind:'kanji', kanji:'口', kana:'くち',     en:'mouth',           level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'耳', kana:'みみ',     en:'ear',             level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'鼻', kana:'はな',     en:'nose',            level:'N3', tags:['body'] },
  { kind:'kanji', kanji:'足', kana:'あし',     en:'foot / leg',      level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'顔', kana:'かお',     en:'face',            level:'N4', tags:['body'] },
  { kind:'kanji', kanji:'頭', kana:'あたま',   en:'head',            level:'N4', tags:['body'] },
  { kind:'kanji', kanji:'髪', kana:'かみ',     en:'hair',            level:'N4', tags:['body'] },
  { kind:'kanji', kanji:'歯', kana:'は',       en:'tooth',           level:'N4', tags:['body'] },
  { kind:'kanji', kanji:'心', kana:'こころ',   en:'heart / mind',    level:'N4', tags:['body'] },
  { kind:'kanji', kanji:'腕', kana:'うで',     en:'arm',             level:'N3', tags:['body'] },
  { kind:'kanji', kanji:'首', kana:'くび',     en:'neck',            level:'N3', tags:['body'] },
  { kind:'kanji', kanji:'花', kana:'はな',     en:'flower',          level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'雨', kana:'あめ',     en:'rain',            level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'春', kana:'はる',     en:'spring',          level:'N5', tags:['time','nature'] },
  { kind:'kanji', kanji:'夏', kana:'なつ',     en:'summer',          level:'N5', tags:['time','nature'] },
  { kind:'kanji', kanji:'秋', kana:'あき',     en:'autumn',          level:'N5', tags:['time','nature'] },
  { kind:'kanji', kanji:'冬', kana:'ふゆ',     en:'winter',          level:'N5', tags:['time','nature'] },
  { kind:'kanji', kanji:'虫', kana:'むし',     en:'insect',          level:'N4', tags:['animal','nature'] },
  { kind:'kanji', kanji:'鏡', kana:'かがみ',   en:'mirror',          level:'N4', tags:['home'] },
  { kind:'kanji', kanji:'窓', kana:'まど',     en:'window',          level:'N4', tags:['home'] },
  { kind:'kanji', kanji:'蛇', kana:'へび',     en:'snake',           level:'N2', tags:['animal'] },
  { kind:'kanji', kanji:'鍵', kana:'かぎ',     en:'key',              level:'N2', tags:['home'] },
  { kind:'kanji', kanji:'浴', kana:'ヨク',     en:'bathe',           level:'N3', tags:['home'] },
  { kind:'kanji', kanji:'寝', kana:'ね.る',    en:'sleep',           level:'N3', tags:['home'] },
  { kind:'kanji', kanji:'冷', kana:'つめ.たい', en:'cold (to touch)',level:'N3', tags:['adj'] },

  // words
  { kind:'word', kanji:'浴室',       kana:'よくしつ',    en:'bathroom',       level:'N4', tags:['home','bathroom'] },
  { kind:'word', kanji:'洗面台',     kana:'せんめんだい', en:'washbasin',     level:'N3', tags:['home','bathroom'] },
  { kind:'word', kanji:'蛇口',       kana:'じゃぐち',    en:'faucet',         level:'N2', tags:['home','bathroom'] },
  { kind:'word', kanji:'シャワー',   kana:'しゃわー',    en:'shower',         level:'N5', tags:['home','bathroom'] },
  { kind:'word', kanji:'浴槽',       kana:'よくそう',    en:'bathtub',        level:'N2', tags:['home','bathroom'] },
  { kind:'word', kanji:'トイレ',     kana:'といれ',      en:'toilet',         level:'N5', tags:['home','bathroom'] },
  { kind:'word', kanji:'タオル',     kana:'たおる',      en:'towel',          level:'N5', tags:['home'] },
  { kind:'word', kanji:'歯ブラシ',   kana:'はぶらし',    en:'toothbrush',     level:'N4', tags:['home','bathroom'] },
  { kind:'word', kanji:'冷蔵庫',     kana:'れいぞうこ',  en:'refrigerator',   level:'N4', tags:['home','kitchen'] },
  { kind:'word', kanji:'電子レンジ', kana:'でんしれんじ',en:'microwave',      level:'N3', tags:['home','kitchen'] },
  { kind:'word', kanji:'包丁',       kana:'ほうちょう',  en:'kitchen knife',  level:'N3', tags:['home','kitchen'] },
  { kind:'word', kanji:'お皿',       kana:'おさら',      en:'plate',          level:'N5', tags:['home','kitchen'] },
  { kind:'word', kanji:'箸',         kana:'はし',        en:'chopsticks',     level:'N5', tags:['home','kitchen'] },
  { kind:'word', kanji:'ソファ',     kana:'そふぁ',      en:'sofa',           level:'N5', tags:['home','livingroom'] },
  { kind:'word', kanji:'テレビ',     kana:'てれび',      en:'television',     level:'N5', tags:['home','livingroom'] },
  { kind:'word', kanji:'本棚',       kana:'ほんだな',    en:'bookshelf',      level:'N4', tags:['home','livingroom'] },
  { kind:'word', kanji:'カーテン',   kana:'かーてん',    en:'curtain',        level:'N5', tags:['home'] },
  { kind:'word', kanji:'ベッド',     kana:'べっど',      en:'bed',            level:'N5', tags:['home','bedroom'] },
  { kind:'word', kanji:'布団',       kana:'ふとん',      en:'futon / duvet',  level:'N4', tags:['home','bedroom'] },
  { kind:'word', kanji:'枕',         kana:'まくら',      en:'pillow',         level:'N3', tags:['home','bedroom'] },
  { kind:'word', kanji:'目覚まし時計',kana:'めざましどけい',en:'alarm clock',  level:'N3', tags:['home','bedroom'] },
  { kind:'word', kanji:'玄関',       kana:'げんかん',    en:'entryway',       level:'N4', tags:['home','entrance'] },
  { kind:'word', kanji:'靴',         kana:'くつ',        en:'shoes',          level:'N5', tags:['home','entrance'] },
  { kind:'word', kanji:'傘',         kana:'かさ',        en:'umbrella',       level:'N4', tags:['home','entrance'] },
  { kind:'word', kanji:'鍵',         kana:'かぎ',        en:'key',            level:'N3', tags:['home','entrance'] },
];

// ── LEVELS ─────────────────────────────────────────────────────────────
window.JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

// ── KANJI READINGS ─────────────────────────────────────────────────────
// Default reading per kanji, used as furigana in the popover. Kanji
// readings are context-dependent (浴 reads よく in 浴室 but あ in 浴びる) — this
// map captures the *most common* reading for our seed vocabulary. Words
// that need a different reading can override later via per-word data.
window.KANJI_READINGS = {
  // bathroom
  '浴':'よく', '室':'しつ', '鏡':'かがみ', '洗':'せん', '面':'めん',
  '台':'だい', '所':'しょ', '蛇':'じゃ', '口':'くち', '槽':'そう',
  '窓':'まど', '紙':'がみ', '便':'びん', '器':'き',
  '石':'いし', '鹸':'けん', '歯':'は', '磨':'みが', '粉':'こ',
  '液':'えき', '体':'たい',

  // kitchen
  '冷':'れい', '蔵':'ぞう', '庫':'こ',
  '電':'でん', '子':'こ',
  '包':'ほう', '丁':'ちょう',
  '皿':'さら', '箸':'はし', '鍋':'なべ',
  '板':'いた', '野':'や', '菜':'さい',
  '料':'りょう', '理':'り',
  '湯':'ゆ', '水':'みず', '火':'ひ',
  '麺':'めん',

  // living room
  '本':'ほん', '棚':'だな',
  '時':'と', '計':'けい',
  '植':'う', '木':'き', '鉢':'ばち',
  '絨':'じゅう', '毯':'たん',

  // bedroom
  '枕':'まくら', '布':'ふ', '団':'とん',
  '目':'め', '覚':'ざ', '引':'ひ', '出':'で',

  // entrance
  '玄':'げん', '関':'かん',
  '靴':'くつ', '傘':'かさ', '鍵':'かぎ',
  '郵':'ゆう', '受':'う',
  '家':'いえ', '入':'はい',

  // common verb / sentence kanji
  '食':'た', '前':'まえ', '手':'て', '毎':'まい', '日':'にち',
  '寒':'さむ', '人':'ひと', '夜':'よる', '朝':'あさ',
  '晩':'ばん', '眠':'ねむ',
  '顔':'かお', '拭':'ふ', '呂':'ろ',
  '開':'あ', '一':'いち',
  '飯':'はん', '作':'つく', '何':'なに',
  '呼':'よ', '脱':'ぬ', '降':'ふ',
  '持':'も', '切':'き', '座':'すわ', '履':'は',
  '空':'そら', '気':'き', '新':'しん', '鮮':'せん',
  '湿':'しめ', '残':'のこ', '行':'い', '来':'く',
  '中':'なか', '友':'とも', '達':'たち',
  '部':'へ', '屋':'や',
  '見':'み', '読':'よ', '休':'やす', '飲':'の', '聞':'き',
  '寝':'ね', '起':'お', '熱':'ねつ',
  '小':'ちい', '少':'すこ', '十':'じゅう', '七':'なな',
  '茶':'ちゃ', '若':'わか',
  '夕':'ゆう', '昼':'ひる',
  '母':'はは', '父':'ちち', '私':'わたし',
  '危':'あぶ', '沸':'わ',
  '整':'ととの', '髪':'かみ', '乾':'かわ',
  '風':'かぜ', '邪':'じゃ', '景':'けい',
  '緒':'しょ', '始':'はじ',
  '閉':'し', '忘':'わす',
  '生':'い',
  '山':'やま', '川':'かわ', '月':'つき', '雨':'あめ', '雪':'ゆき',
  '春':'はる', '夏':'なつ', '秋':'あき', '冬':'ふゆ', '虫':'むし',
  '林':'はやし', '森':'もり',
  '土':'つち', '去':'さ', '王':'おう', '国':'くに',
  '刀':'かたな', '力':'ちから', '弓':'ゆみ', '市':'いち', '田':'た', '町':'まち', '村':'むら',
  '円':'えん',
  '上':'うえ', '下':'した',
  '鼻':'はな', '耳':'みみ',
  '父':'ちち', '母':'はは', '女':'おんな', '男':'おとこ', '好':'す',
  '反':'はん', '氷':'こおり',
  '葉':'は', '星':'ほし', '雲':'くも',
  '足':'あし', '頭':'あたま', '心':'こころ', '腕':'うで', '首':'くび',
  '兄':'あに', '姉':'あね', '弟':'おとうと', '妹':'いもうと',
  '自':'じ', '未':'まだ',
  '光':'ひかり', '音':'おと', '声':'こえ', '花':'はな', '草':'くさ',
  '海':'うみ', '河':'かわ', '池':'いけ', '流':'なが', '泳':'およ',
  '汽':'き', '注':'そそ', '沢':'さわ', '漢':'かん',
  '強':'つよ', '弱':'よわ',
};

// ── KANJI MEANINGS ─────────────────────────────────────────────────────
// Used to render the per-character breakdown of multi-kanji words inside
// the vocab popover (e.g. 浴室 → 浴 = bathe, 室 = room). Keep entries short
// and concrete — one or two words, lowercase. Extendable: add as you grow.
window.KANJI_MEANINGS = {
  // bathroom
  '浴':'bathe', '室':'room', '鏡':'mirror', '洗':'wash', '面':'face',
  '台':'stand', '所':'place', '蛇':'snake', '口':'mouth', '槽':'tank',
  '窓':'window', '紙':'paper', '便':'convenience', '器':'container',
  '石':'stone', '鹸':'lye', '歯':'tooth', '磨':'polish', '粉':'powder',
  '液':'liquid', '体':'body',

  // kitchen
  '冷':'cold', '蔵':'storage', '庫':'warehouse',
  '電':'electric', '子':'child',
  '包':'wrap', '丁':'chop',
  '皿':'plate', '箸':'chopsticks', '鍋':'pot',
  '板':'board', '野':'field', '菜':'vegetable',
  '料':'fee', '理':'reason',
  '湯':'hot water', '水':'water', '火':'fire',
  '麺':'noodle',

  // living room
  '本':'book', '棚':'shelf',
  '時':'time', '計':'count',
  '植':'plant', '木':'tree', '鉢':'bowl',
  '絨':'rug', '毯':'blanket',

  // bedroom
  '枕':'pillow', '布':'cloth', '団':'group',
  '目':'eye', '覚':'awake', '引':'pull', '出':'exit',

  // entrance
  '玄':'mystery', '関':'barrier',
  '靴':'shoe', '傘':'umbrella', '鍵':'key',
  '郵':'mail', '受':'receive',
  '家':'home', '入':'enter',

  // common verbs / sentence kanji
  '食':'eat', '前':'before', '手':'hand', '毎':'every', '日':'day',
  '寒':'cold', '人':'person', '夜':'night', '朝':'morning',
  '晩':'evening', '眠':'sleep',
  '顔':'face', '拭':'wipe', '呂':'bath',
  '開':'open', '一':'one',
  '飯':'meal', '作':'make', '何':'what',
  '呼':'call', '脱':'take off', '降':'fall',
  '持':'hold', '切':'cut', '座':'sit', '履':'put on',
  '空':'sky', '気':'air', '新':'new', '鮮':'fresh',
  '湿':'damp', '残':'remain', '行':'go', '来':'come',
  '中':'middle', '友':'friend', '達':'arrive',
  '部':'section', '屋':'shop',
  '見':'see', '読':'read', '休':'rest', '飲':'drink', '聞':'hear',
  '寝':'sleep', '起':'rise', '熱':'heat',
  '小':'small', '少':'few', '十':'ten', '七':'seven',
  '茶':'tea', '若':'young',
  '夕':'evening', '昼':'noon',
  '母':'mother', '父':'father', '私':'I',
  '危':'danger', '沸':'boil',
  '整':'arrange', '髪':'hair',
  '乾':'dry',
  '風':'wind', '邪':'evil', '景':'view',
  '緒':'cord', '始':'begin',
  '閉':'close', '忘':'forget',
  '生':'life',
  '山':'mountain', '川':'river', '月':'moon', '雨':'rain', '雪':'snow',
  '春':'spring', '夏':'summer', '秋':'autumn', '冬':'winter', '虫':'insect',
  '林':'woods', '森':'forest',
  '土':'earth', '去':'leave', '王':'king', '国':'country',
  '刀':'katana', '力':'power', '弓':'bow', '市':'city', '田':'field', '町':'town', '村':'village',
  '円':'yen',
  '上':'up', '下':'down',
  '鼻':'nose', '耳':'ear',
  '女':'woman', '男':'man', '好':'like',
  '反':'opposite', '氷':'ice',
  '葉':'leaf', '星':'star', '雲':'cloud',
  '足':'foot', '頭':'head', '心':'heart', '腕':'arm', '首':'neck',
  '兄':'older brother', '姉':'older sister', '弟':'younger brother', '妹':'younger sister',
  '自':'self', '未':'not yet',
  '光':'light', '音':'sound', '声':'voice', '花':'flower', '草':'grass',
  '海':'sea', '河':'stream', '池':'pond', '流':'flow', '泳':'swim',
  '汽':'steam', '注':'pour', '沢':'marsh', '漢':'Chinese',
  '強':'strong', '弱':'weak',
};

