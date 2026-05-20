// Seed data for the learn-jp prototype.
// Designed to be easy to expand later — every entry is a flat object.

// ── VOCAB BOOKS ────────────────────────────────────────────────────────
// Each book has a stable id (used by image-slot keys + persistence) and a list
// of pages. Pages are typed: 'cheatsheet' | 'usage' | 'sentences'.
window.VOCAB_BOOKS = [
  {
    id: 'bathroom',
    titleJa: 'おふろば と せんめんしつ',
    titleEn: 'Bathroom & Washroom',
    glyph: '浴',
    primaryLevel: 'N5',
    pages: [
      {
        id: 'sheet-1',
        type: 'cheatsheet',
        title: 'おふろば と せんめんしつ の ことば',
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

// ── FLASHCARDS ─────────────────────────────────────────────────────────
// 10 starter cards focused on very common, basic words. The deck is image-
// first; user fills the images later.
window.FLASHCARDS = [
  { id:'wind',  kanji:'風',  kun:'かぜ',     on:'フウ',   en:'wind' },
  { id:'water', kanji:'水',  kun:'みず',     on:'スイ',   en:'water' },
  { id:'fire',  kanji:'火',  kun:'ひ',       on:'カ',     en:'fire' },
  { id:'tree',  kanji:'木',  kun:'き',       on:'ボク',   en:'tree / wood' },
  { id:'sun',   kanji:'日',  kun:'ひ',       on:'ニチ',   en:'sun / day' },
  { id:'moon',  kanji:'月',  kun:'つき',     on:'ゲツ',   en:'moon / month' },
  { id:'mtn',   kanji:'山',  kun:'やま',     on:'サン',   en:'mountain' },
  { id:'river', kanji:'川',  kun:'かわ',     on:'セン',   en:'river' },
  { id:'eye',   kanji:'目',  kun:'め',       on:'モク',   en:'eye' },
  { id:'hand',  kanji:'手',  kun:'て',       on:'シュ',   en:'hand' },
];

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
  { kind:'kanji', kanji:'木', kana:'き',       en:'tree',            level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'日', kana:'ひ',       en:'sun / day',       level:'N5', tags:['time'] },
  { kind:'kanji', kanji:'月', kana:'つき',     en:'moon / month',    level:'N5', tags:['time'] },
  { kind:'kanji', kanji:'目', kana:'め',       en:'eye',             level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'手', kana:'て',       en:'hand',            level:'N5', tags:['body'] },
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
  '光':'light', '音':'sound', '声':'voice', '花':'flower', '草':'grass',
  '海':'sea', '河':'stream', '池':'pond', '流':'flow', '泳':'swim',
  '汽':'steam', '注':'pour', '沢':'marsh', '漢':'Chinese',
  '強':'strong', '弱':'weak',
};

