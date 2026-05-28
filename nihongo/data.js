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
        title: 'よくしつ',
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
        title: 'せんめんだい',
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
        title: 'だいどころ',
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
        id: 'sheet-2',
        type: 'cheatsheet',
        title: 'もっと だいどころ',
        subtitle: 'More in the kitchen',
        imageSlotId: 'sheet-kitchen-2',
        items: [
          { num:1,  kanji:'炊飯器',     kana:'すいはんき',  en:'rice cooker' },
          { num:2,  kanji:'やかん',     kana:'やかん',      en:'kettle' },
          { num:3,  kanji:'シンク',     kana:'しんく',      en:'sink' },
          { num:4,  kanji:'トースター', kana:'とーすたー',  en:'toaster' },
          { num:5,  kanji:'オーブン',   kana:'おーぶん',    en:'oven' },
          { num:6,  kanji:'食器棚',     kana:'しょっきだな',en:'cupboard / dish cabinet' },
          { num:7,  kanji:'茶碗',       kana:'ちゃわん',    en:'rice bowl' },
          { num:8,  kanji:'お椀',       kana:'おわん',      en:'soup bowl' },
          { num:9,  kanji:'ボウル',     kana:'ぼうる',      en:'mixing bowl' },
          { num:10, kanji:'スプーン',   kana:'すぷーん',    en:'spoon' },
          { num:11, kanji:'ふきん',     kana:'ふきん',      en:'dish towel' },
          { num:12, kanji:'ゴミ箱',     kana:'ごみばこ',    en:'trash can' },
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
        title: 'いま',
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
        id: 'sheet-2',
        type: 'cheatsheet',
        title: 'わしつ',
        subtitle: 'Japanese-style room (washitsu)',
        imageSlotId: 'sheet-livingroom-2',
        items: [
          { num:1,  kanji:'畳',         kana:'たたみ',      en:'tatami mat' },
          { num:2,  kanji:'障子',       kana:'しょうじ',    en:'shoji (paper sliding door)' },
          { num:3,  kanji:'座布団',     kana:'ざぶとん',    en:'zabuton (floor cushion)' },
          { num:4,  kanji:'ちゃぶ台',   kana:'ちゃぶだい',  en:'chabudai (low dining table)' },
          { num:5,  kanji:'和紙ランプ', kana:'わしらんぷ',  en:'washi paper lamp' },
          { num:6,  kanji:'のれん',     kana:'のれん',      en:'noren (entrance curtain)' },
          { num:7,  kanji:'行灯',       kana:'あんどん',    en:'andon (square paper lantern)' },
          { num:8,  kanji:'提灯',       kana:'ちょうちん',  en:'chōchin (round paper lantern)' },
          { num:9,  kanji:'盆栽',       kana:'ぼんさい',    en:'bonsai (miniature tree)' },
          { num:10, kanji:'花瓶',       kana:'かびん',      en:'vase (for ikebana)' },
          { num:11, kanji:'掛軸',       kana:'かけじく',    en:'kakejiku (hanging scroll)' },
          { num:12, kanji:'床の間',     kana:'とこのま',    en:'tokonoma (display alcove)' },
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
        title: 'しんしつ',
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
          { num:10, kanji:'おもちゃ',   kana:'おもちゃ',    en:'toys' },
          { num:11, kanji:'服',         kana:'ふく',        en:'clothes' },
          { num:12, kanji:'シーツ',     kana:'しーつ',      en:'bedsheets' },
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
        title: 'げんかん',
        subtitle: 'At the entrance',
        imageSlotId: 'sheet-entrance-1',
        items: [
          { num:1,  kanji:'玄関',         kana:'げんかん',      en:'entryway' },
          { num:2,  kanji:'靴',           kana:'くつ',          en:'shoes' },
          { num:3,  kanji:'スリッパ',     kana:'すりっぱ',      en:'slippers' },
          { num:4,  kanji:'傘',           kana:'かさ',          en:'umbrella' },
          { num:5,  kanji:'鍵',           kana:'かぎ',          en:'key' },
          { num:6,  kanji:'郵便受け',     kana:'ゆうびんうけ',  en:'mailbox' },
          { num:7,  kanji:'ドア',         kana:'どあ',          en:'door' },
          { num:8,  kanji:'ドアノブ',     kana:'どあのぶ',      en:'doorknob' },
          { num:9,  kanji:'窓',           kana:'まど',          en:'window' },
          { num:10, kanji:'インターホン', kana:'いんたーほん',  en:'intercom / doorbell' },
          { num:11, kanji:'車',           kana:'くるま',        en:'car' },
          { num:12, kanji:'車庫',         kana:'しゃこ',        en:'garage (car storage)' },
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
  {
    id: 'hallway',
    titleJa: 'ろうか',
    titleEn: 'Hallway',
    glyph: '廊',
    primaryLevel: 'N5',
    pages: [
      {
        id: 'sheet-1',
        type: 'cheatsheet',
        title: 'ろうか',
        subtitle: 'Words you find along the hallway',
        imageSlotId: 'sheet-hallway-1',
        items: [
          { num:1,  kanji:'廊下',       kana:'ろうか',           en:'hallway / corridor' },
          { num:2,  kanji:'階段',       kana:'かいだん',         en:'stairs' },
          { num:3,  kanji:'壁',         kana:'かべ',             en:'wall' },
          { num:4,  kanji:'床',         kana:'ゆか',             en:'floor' },
          { num:5,  kanji:'天井',       kana:'てんじょう',       en:'ceiling' },
          { num:6,  kanji:'電気',       kana:'でんき',           en:'light / electric light' },
          { num:7,  kanji:'時計',       kana:'とけい',           en:'wall clock' },
          { num:8,  kanji:'絵',         kana:'え',               en:'painting / picture' },
          { num:9,  kanji:'写真',       kana:'しゃしん',         en:'photo' },
          { num:10, kanji:'本棚',       kana:'ほんだな',         en:'bookshelf' },
          { num:11, kanji:'戸棚',       kana:'とだな',           en:'cupboard' },
          { num:12, kanji:'カーペット', kana:'かーぺっと',       en:'carpet' },
        ]
      },
      {
        id: 'usage',
        type: 'usage',
        title: 'つかいかた',
        subtitle: 'Verbs and phrases for the hallway',
        items: [
          { ja:'階段を 上がる',     kana:'かいだんを あがる',     en:'to go up the stairs' },
          { ja:'階段を 下りる',     kana:'かいだんを おりる',     en:'to go down the stairs' },
          { ja:'電気を つける',     kana:'でんきを つける',       en:'to turn on the light' },
          { ja:'電気を 消す',       kana:'でんきを けす',         en:'to turn off the light' },
          { ja:'絵を 飾る',         kana:'えを かざる',           en:'to hang / display a painting' },
          { ja:'本を 棚に 戻す',    kana:'ほんを たなに もどす',  en:'to put a book back on the shelf' },
          { ja:'廊下を 歩く',       kana:'ろうかを あるく',       en:'to walk down the hallway' },
          { ja:'時計を 見る',       kana:'とけいを みる',         en:'to look at the clock' },
        ]
      },
      {
        id: 'sentences',
        type: 'sentences',
        title: 'ぶん',
        subtitle: 'Hallway sentences',
        items: [
          { ja:'廊下に 絵が かかって います。',
            en:'A painting is hanging in the hallway.', level:'N5' },
          { ja:'階段の 上に 本棚が あります。',
            en:'There is a bookshelf at the top of the stairs.', level:'N5' },
          { ja:'夜は 廊下の 電気を つけて ください。',
            en:'Please turn on the hallway light at night.', level:'N5' },
          { ja:'壁の 時計が 七時を 指して います。',
            en:'The wall clock points to seven.', level:'N4' },
          { ja:'戸棚の 中に 古い 写真が しまって あります。',
            en:'Old photos are kept inside the cupboard.', level:'N4' },
          { ja:'カーペットの 上で 歩くと、足音が 聞こえません。',
            en:"When you walk on the carpet, footsteps can't be heard.", level:'N4' },
          { ja:'天井が 高いと、部屋が 広く 感じます。',
            en:'When the ceiling is high, the room feels spacious.', level:'N3' },
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
      // The Experience — sits at the top, rolls a random restaurant from
      // EATING_OUT_RESTAURANTS and runs you through an interactive scene.
      // The other 6 books are normal vocab books that will get
      // cheatsheet/usage/sentences pages over time.
      { id:'experience',   titleJa:'体験',    titleEn:'Experience',     glyph:'体', primaryLevel:'N4', pages:[], isExperience:true },
      // Food vocabulary gallery removed from sidebar — its content now
      // lives directly on each restaurant's menu page (the visual food-
      // gallery header above the menu rows pulls from the FOOD_GALLERY
      // constant). The FOOD_GALLERY data itself is still used by every
      // menu-reference page, just not exposed as a standalone book.
      // Flavors — Phase 1 of the Flavors & Textures sub-system (see
      // docs/superpowers/specs/2026-05-26-flavors-textures.PRODUCT.md).
      // Editorial register, bento → drill-in immersion layout. The page
      // is rendered by renderFlavorsPage() in app.html, dispatched off
      // the isFlavorsPage:true flag in the renderVocab empty-state
      // branch. The `flavors` array below seeds the 10 sensory primitives;
      // each carries its color world (--flood / --ink / --chip), the
      // canonical food, the kana + optional kanji, and a one-line note
      // for the immersion-view drawer. English glosses live here too —
      // they only surface inside the collapsed <details> drawer per the
      // brief's pedagogical rule (multi-channel encoding, English last).
      { id:'flavors', titleJa:'あじ', titleEn:'Flavors',
        glyph:'味', primaryLevel:'N4', pages:[],
        isExperience:true, isFlavorsPage:true,
        // Order (user-set):
        //   oishii → amai → karai → tsumetai → suppai → nigai →
        //   sawayaka → atsui → shoppai → mazui
        // Opens with the anchor "tasty", walks through the canonical
        // sensory primitives (sweet / spicy / cold / sour / bitter),
        // shifts to the qualifier register (refreshing / hot / salty),
        // and closes on the rejected food. Bento renders 5×2 — the
        // top row carries the positive sensory ramp; the bottom row
        // carries the qualifier-and-negative pair.
        flavors: [
          { id:'oishii',  kana:'おいしい', kanji:'',       romaji:'oishii',
            en:'delicious / tasty',
            canonicalFood:{ ja:'おにぎり', en:'rice ball' },
            flood:'#fbf3e8', ink:'#2a2520', chip:'#d8a06a',
            notes:'The anchor flavor — the broad, warm "tasty" that umbrellas every other.' },
          { id:'amai',    kana:'あまい',   kanji:'甘い',    romaji:'amai',
            en:'sweet',
            canonicalFood:{ ja:'いちごケーキ', en:'strawberry cake' },
            flood:'#fbe1e7', ink:'#5a2a3a', chip:'#e69cb1',
            notes:'Sakura pink. Strawberry shortcake, mochi, りんご飴.' },
          { id:'karai',   kana:'からい',   kanji:'辛い',    romaji:'karai',
            en:'spicy / hot',
            canonicalFood:{ ja:'唐辛子', en:'chili pepper' },
            flood:'#c84a3a', ink:'#fbf3e8', chip:'#e6603a',
            notes:'Chili crimson. The only flavor that floods dark — cream ink on red.' },
          { id:'tsumetai', kana:'つめたい', kanji:'冷たい', romaji:'tsumetai',
            en:'cold (temperature)',
            canonicalFood:{ ja:'アイスクリーム', en:'ice cream' },
            flood:'#c8e0e8', ink:'#1e3a4f', chip:'#7ba8b8',
            notes:'Ice cyan. Cold without being white — closer to glacier-edge than to pure ice.' },
          { id:'suppai',  kana:'すっぱい', kanji:'酸っぱい', romaji:'suppai',
            en:'sour',
            canonicalFood:{ ja:'レモン', en:'lemon' },
            flood:'#f4dd6a', ink:'#3a2e10', chip:'#e6c440',
            notes:'Lemon yellow — the universal citric-acid color. The cheek-tightening pucker.' },
          { id:'nigai',   kana:'にがい',   kanji:'苦い',    romaji:'nigai',
            en:'bitter',
            canonicalFood:{ ja:'コーヒー', en:'coffee' },
            flood:'#3a2a1f', ink:'#f0d8b8', chip:'#6e4a30',
            notes:'Espresso dark — the only fully-dark flood. Coffee, beer foam, charred fish skin.' },
          { id:'sawayaka', kana:'さわやか', kanji:'爽やか', romaji:'sawayaka',
            en:'refreshing',
            canonicalFood:{ ja:'レモネード', en:'lemonade' },
            flood:'#c8e6d8', ink:'#1f3a30', chip:'#6ea890',
            notes:'Mint-water. Cool refreshment, mid-saturation cool green.' },
          { id:'atsui',   kana:'あつい',   kanji:'熱い',    romaji:'atsui',
            en:'hot (temperature)',
            canonicalFood:{ ja:'味噌汁', en:'miso soup' },
            flood:'#e07645', ink:'#3a1a10', chip:'#c8541f',
            notes:'Ember. Thermal heat — terracotta-leaning, distinct from chili-heat (karai).' },
          { id:'shoppai', kana:'しょっぱい', kanji:'',     romaji:'shoppai',
            en:'salty',
            canonicalFood:{ ja:'ポテトチップス', en:'potato chips' },
            flood:'#dfe6ec', ink:'#1e3a5f', chip:'#7d96ad',
            notes:'Sea-salt blue. Brine, chip-bag silver, the cooler salt-water register.' },
          { id:'mazui',   kana:'まずい',   kanji:'',       romaji:'mazui',
            en:'bad-tasting / off',
            canonicalFood:{ ja:'まずい顔', en:'sour face' },
            flood:'#d8d9b0', ink:'#3a3a25', chip:'#7d8a4a',
            notes:'The rejected-food shade. Sickly green-yellow before the kana is even read.' },
        ] },
      // Edibles Database — Phase 3 of the Flavors & Textures sub-system.
      // Per PRODUCT.md §7.3, eight categories of foodstuffs each with
      // 10+ items carrying their flavor + texture profile. The renderer
      // (renderEdiblesPageHTML in app.html) walks three views:
      //   1. category-browse (8 tiles, click → category-grid)
      //   2. category-grid   (N items in a denser bento)
      //   3. item-detail     (image + identity + flavor/texture badges
      //                       + notes drawer — Phase 3 spread)
      //
      // Phase 3a (this commit): only kudamono is populated, as the test
      // of the database engine. The other 7 categories carry items:[]
      // and render as "coming soon" tiles on the category-browse view.
      // Each populated item carries the full Phase 3 data shape:
      //   { id, kanji, kana, romaji, en, flavors[], textures[], season[], notes }
      // — flavors[] are FK ids into the Flavors book (clickable, jump
      // to the flavor immersion); textures[] are kana strings for now
      // (Phase 2 will turn them into FK ids when Textures ships).
      { id:'edibles', titleJa:'しょくざい', titleEn:'Edibles',
        glyph:'食材', primaryLevel:'N4', pages:[],
        isExperience:true, isEdiblesPage:true,
        categories: [
          // ── Kudamono (Fruits) — Phase 3a populated. ──────────────
          { id:'kudamono', kanji:'果物', kana:'くだもの', romaji:'kudamono',
            en:'Fruits', glyph:'果',
            items: [
              { id:'ringo',  kanji:'林檎',   kana:'りんご',     romaji:'ringo',
                en:'apple',
                flavors:['amai', 'suppai'],
                textures:['シャキシャキ', 'ジューシー'],
                season:['秋 autumn'],
                notes:'Aomori grows ~60% of Japan\'s apples. Fuji is the classic eating apple — large, crisp, honey-sweet. The variety system is dense: 王林 (Ourin, yellow-green), 紅玉 (Kougyoku, tart cooking apple), 津軽 (Tsugaru, early-season). Often given as a midwinter gift in red netted boxes.' },
              { id:'ichigo', kanji:'苺',     kana:'いちご',     romaji:'ichigo',
                en:'strawberry',
                flavors:['amai', 'suppai'],
                textures:['ジューシー', 'やわらかい'],
                season:['冬 winter', '春 spring'],
                notes:'Hothouse-grown to peak for Christmas — strawberry shortcake is the Japanese Christmas cake. Tochiotome and あまおう (Amaou — Fukuoka prestige variety, big and sweet) dominate. Often eaten with sweetened condensed milk (練乳).' },
              { id:'mikan',  kanji:'蜜柑',   kana:'みかん',     romaji:'mikan',
                en:'mandarin orange / satsuma',
                flavors:['amai', 'suppai'],
                textures:['ジューシー', 'プチプチ'],
                season:['冬 winter'],
                notes:'The defining winter fruit. Eaten under the kotatsu by the boxful. 温州みかん (unshu mikan, seedless and easy-peel) is the standard cultivar. Iyokan and dekopon are the prestige tiers. Often boxed as winter gifts.' },
              { id:'budou',  kanji:'葡萄',   kana:'ぶどう',     romaji:'budou',
                en:'grapes',
                flavors:['amai'],
                textures:['ぷりぷり', 'ジューシー'],
                season:['秋 autumn'],
                notes:'巨峰 (Kyoho — large, deep purple, slip-skin) and 種なしシャインマスカット (seedless Shine Muscat — green, edible-skin, the prestige fruit) lead. Sold one cluster at a time, expensive. A single Ruby Roman grape can sell for ¥10,000.' },
              { id:'momo',   kanji:'桃',     kana:'もも',       romaji:'momo',
                en:'peach',
                flavors:['amai'],
                textures:['とろとろ', 'ジューシー'],
                season:['夏 summer'],
                notes:'山梨 (Yamanashi) and 福島 (Fukushima) are the peach prefectures. 白桃 (hakutou, white peach) is the prized cultivar — extremely fragrant, eaten so ripe the flesh almost melts. Folkloric: Momotaro the Peach Boy was found inside one.' },
              { id:'meron',  kanji:'',       kana:'メロン',     romaji:'meron',
                en:'melon',
                flavors:['amai'],
                textures:['ジューシー', 'やわらかい'],
                season:['夏 summer'],
                notes:'The luxury fruit. 夕張メロン (Yubari melon from Hokkaido — orange-flesh, net-skin) is the gift-fruit ne plus ultra — premium pairs auction for ¥2-3 million. Eaten chilled, sometimes with prosciutto.' },
              { id:'suika',  kanji:'西瓜',   kana:'すいか',     romaji:'suika',
                en:'watermelon',
                flavors:['amai'],
                textures:['シャリシャリ', 'ジューシー'],
                season:['夏 summer'],
                notes:'Summer beach + festival staple. 西瓜割り (suikawari) is the blindfolded watermelon-smashing game played on beaches. Square watermelons (grown in glass cubes for shipping) exist as ¥10,000+ luxury items in Tokyo department stores.' },
              { id:'banana', kanji:'',       kana:'バナナ',     romaji:'banana',
                en:'banana',
                flavors:['amai'],
                textures:['もちもち', 'クリーミー'],
                season:['通年 year-round'],
                notes:'Almost entirely imported (Philippines, Ecuador). The cheapest fruit at the supermarket — usually ¥150 for a hand. A breakfast and post-workout staple; Dole and Del Monte own the shelves.' },
              { id:'kaki',   kanji:'柿',     kana:'かき',       romaji:'kaki',
                en:'persimmon',
                flavors:['amai'],
                textures:['シャキシャキ', 'とろとろ'],
                season:['秋 autumn'],
                notes:'Two cultivars with opposite textures: 富有柿 (Fuyu, eaten crisp like an apple) and 蜂屋柿 (Hachiya, eaten when ultra-ripe and jelly-soft). 干し柿 (hoshigaki — slow-dried, white frost of natural sugar) is a centuries-old delicacy.' },
              { id:'nashi',  kanji:'梨',     kana:'なし',       romaji:'nashi',
                en:'Japanese pear / nashi',
                flavors:['amai', 'suppai'],
                textures:['シャリシャリ', 'ジューシー'],
                season:['秋 autumn'],
                notes:'Round, not pear-shaped. Snow-white flesh that crunches like an apple with the juice of a watermelon. 幸水 (Kousui) and 豊水 (Hosui) are the standard cultivars; 二十世紀梨 (Nijisseiki — "twentieth-century pear", Tottori) is the iconic one.' },
              { id:'ume', kanji:'梅', kana:'うめ', romaji:'ume',
                en:'Japanese plum',
                flavors:['suppai', 'shoppai'],
                textures:['もちもち', 'やわらかい'],
                season:['初夏 early summer'],
                notes:'Never eaten raw — the fruit exists to be preserved. 梅干し (umeboshi, salt-cured red-pink bullet) is the center of the Hinomaru bento (a single ume on white rice = Japanese flag). 梅酒 (umeshu) is the rock-sugar-and-shochu plum liqueur made every June. Harvested green; the blossom is also a major early-spring symbol, beloved before sakura takes over.' },
              { id:'sakuranbo', kanji:'桜桃', kana:'さくらんぼ', romaji:'sakuranbo',
                en:'cherry',
                flavors:['amai', 'suppai'],
                textures:['ジューシー', 'ぷりぷり'],
                season:['初夏 early summer'],
                notes:'山形 (Yamagata) grows ~70% of Japan\'s cherries. 佐藤錦 (Satonishiki) is the prestige cultivar — small, bright, intensely sweet with a hint of tartness. Sold in beautifully arranged single-layer boxes at department stores for ¥10,000+ as midyear gifts (お中元).' },
              { id:'remon', kanji:'檸檬', kana:'レモン', romaji:'remon',
                en:'lemon',
                flavors:['suppai', 'sawayaka'],
                textures:['ジューシー'],
                season:['冬 winter'],
                notes:'広島 (Hiroshima) and the Setouchi inland-sea islands grow most of Japan\'s domestic lemons. 瀬戸内レモン (Setouchi lemon) is the prestige — thin-skinned, fragrant, used unpeeled. The base of レモンサワー (the shochu-and-soda highball that defines izakaya drinking) and squeezed onto karaage, grilled fish, and shabu-shabu ponzu.' },
              { id:'orenji', kanji:'', kana:'オレンジ', romaji:'orenji',
                en:'orange',
                flavors:['amai', 'suppai'],
                textures:['ジューシー', 'プチプチ'],
                season:['冬 winter'],
                notes:'Mostly imported — Florida and Valencia oranges dominate the supermarket. Sold individually or in mesh bags. Squeezed into オレンジジュース (the homemade kind a parent makes for a sick child) or used in fruit baskets and Western-style desserts. Distinct from mikan, which is the native winter satsuma.' },
              { id:'gureepufuruutsu', kanji:'', kana:'グレープフルーツ', romaji:'gureepufuruutsu',
                en:'grapefruit',
                flavors:['suppai', 'nigai'],
                textures:['ジューシー'],
                season:['通年 year-round'],
                notes:'The classic Japanese breakfast fruit — halved and eaten with a serrated spoon. Mostly imported from Florida and South Africa. ピンクグレープフルーツ (pink, sweeter) and 白 (white, more bitter) are the two camps. Also the base flavor for 酎ハイ (chuhai) — the standard izakaya cocktail.' },
              { id:'kiwi', kanji:'', kana:'キウイ', romaji:'kiwi',
                en:'kiwi fruit',
                flavors:['amai', 'suppai'],
                textures:['ジューシー', 'プチプチ'],
                season:['冬 winter', '春 spring'],
                notes:'Mostly Zespri (New Zealand) at the supermarket. ゼスプリ ゴールド (gold kiwi) is sweeter, less acidic, and more expensive than the standard green. Marketed heavily as a vitamin-C health food. Halved and scooped out with a teaspoon is the standard breakfast way.' },
              { id:'painappuru', kanji:'', kana:'パイナップル', romaji:'painappuru',
                en:'pineapple',
                flavors:['amai', 'suppai'],
                textures:['ジューシー', 'シャキシャキ'],
                season:['夏 summer'],
                notes:'沖縄 (Okinawa) is the only Japanese-grown source — Ishigaki and Iriomote islands. Otherwise imported from the Philippines and Taiwan. Sold pre-cut in plastic packs or whole. The Hawaiian-influenced summer fruit; the famous pineapple-on-pizza debate exists in Japan too.' },
              { id:'mangoo', kanji:'', kana:'マンゴー', romaji:'mangoo',
                en:'mango',
                flavors:['amai'],
                textures:['とろとろ', 'ジューシー'],
                season:['夏 summer'],
                notes:'宮崎 (Miyazaki) mango is the luxury fruit-gift — 太陽のタマゴ (Taiyō no Tamago, "egg of the sun") variety can sell for ¥10,000+ per pair at auction. Lower-tier supermarket fruit comes from the Philippines and Thailand. Eaten chilled in slices or layered into 杏仁豆腐 / parfaits with vanilla ice cream.' },
              { id:'buruuberii', kanji:'', kana:'ブルーベリー', romaji:'buruuberii',
                en:'blueberry',
                flavors:['amai', 'suppai'],
                textures:['プチプチ', 'ジューシー'],
                season:['夏 summer'],
                notes:'Topping for yogurt, pancakes, and chiizukeeki. Some domestic production (Tokyo Hachiōji, Nagano), but mostly imported frozen. Marketed heavily for eye health — a Shōwa-era myth conflated with WWII RAF-pilot folklore that took root in Japanese supplement advertising.' },
              { id:'abokado', kanji:'', kana:'アボカド', romaji:'abokado',
                en:'avocado',
                flavors:['oishii'],
                textures:['とろとろ', 'クリーミー'],
                season:['通年 year-round'],
                notes:'Almost entirely imported from Mexico. The defining ingredient of the California Roll (which was invented in LA but reimported to Japan as a sushi norm). Eaten in アボカド丼 (sliced over rice with soy + wasabi), sandwiches, and salads. Marketed as 森のバター (forest butter).' },
            ]
          },
          // ── Yasai (Vegetables) — Phase 3b. ───────────────────────
          { id:'yasai', kanji:'野菜', kana:'やさい', romaji:'yasai',
            en:'Vegetables', glyph:'野',
            items: [
              { id:'kyabetsu', kanji:'', kana:'キャベツ', romaji:'kyabetsu', en:'cabbage',
                flavors:['amai'], textures:['シャキシャキ', 'ジューシー'], season:['冬 winter', '春 spring'],
                notes:'The base of okonomiyaki, the side under tonkatsu, and the heart of gyoza filling. 春キャベツ (spring) is loose-leafed and tender; 冬キャベツ (winter) is tight and crisp.' },
              { id:'daikon', kanji:'大根', kana:'だいこん', romaji:'daikon', en:'daikon radish',
                flavors:['karai', 'suppai'], textures:['シャキシャキ', 'ジューシー'], season:['冬 winter'],
                notes:'White Japanese radish, often a meter long. Eaten raw as 大根おろし (grated, with grilled fish), simmered in oden, or pickled as たくあん. Winter daikon is sweet; summer daikon is peppery.' },
              { id:'ninjin', kanji:'人参', kana:'にんじん', romaji:'ninjin', en:'carrot',
                flavors:['amai'], textures:['シャキシャキ'], season:['秋 autumn', '冬 winter'],
                notes:'The supermarket standard, plus the regional 京人参 (kyō-ninjin, slender deep-red Kyoto cultivar used in kaiseki). Common in nimono (simmered dishes), curry, and bento sides cut into flower shapes for kids.' },
              { id:'tamanegi', kanji:'玉ねぎ', kana:'たまねぎ', romaji:'tamanegi', en:'onion',
                flavors:['amai', 'karai'], textures:['シャキシャキ'], season:['春 spring', '秋 autumn'],
                notes:'The foundation of Japanese curry, gyudon, and sukiyaki. 新玉ねぎ (shin-tamanegi, spring new-crop) is so mild it can be eaten raw in salads — sliced with bonito flakes and ponzu.' },
              { id:'tomato', kanji:'', kana:'トマト', romaji:'tomato', en:'tomato',
                flavors:['suppai', 'amai'], textures:['ジューシー'], season:['夏 summer'],
                notes:'Sweeter than Western tomatoes — Japanese cultivars (桃太郎 Momotaro, アメーラ Amela) are bred for sugar content. Often eaten plain sliced with salt, or chilled whole as 冷やしトマト.' },
              { id:'kyuuri', kanji:'胡瓜', kana:'きゅうり', romaji:'kyuuri', en:'cucumber',
                flavors:['sawayaka'], textures:['シャキシャキ'], season:['夏 summer'],
                notes:'Thinner and crisper than Western cucumbers. Eaten raw with miso (もろきゅう), pickled as 浅漬け (asazuke), or in cold noodle dishes. The classic summer cooling vegetable.' },
              { id:'nasu', kanji:'茄子', kana:'なす', romaji:'nasu', en:'eggplant',
                flavors:['amai'], textures:['とろとろ'], season:['夏 summer', '秋 autumn'],
                notes:'Long, slender Japanese eggplant — sweeter, less bitter than Western varieties. Famous as 茄子の田楽 (miso-glazed), 麻婆茄子 (mapo eggplant), or grilled whole and topped with bonito flakes.' },
              { id:'shiitake', kanji:'椎茸', kana:'しいたけ', romaji:'shiitake', en:'shiitake mushroom',
                flavors:['oishii'], textures:['もちもち'], season:['秋 autumn'],
                notes:'The umami king. Fresh shiitake gets grilled or simmered; dried (干し椎茸 hoshi-shiitake) is rehydrated and its broth becomes the foundation of vegetarian Buddhist dashi.' },
              { id:'negi', kanji:'葱', kana:'ねぎ', romaji:'negi', en:'Japanese leek',
                flavors:['karai'], textures:['シャキシャキ'], season:['冬 winter'],
                notes:'Long white leek-onion hybrid. Sliced into ramen, in miso soup, as a yakitori component (ねぎま — alternating chicken + leek on the skewer), or grilled whole and dipped in tare.' },
              { id:'hourensou', kanji:'ほうれん草', kana:'ほうれんそう', romaji:'hourensou', en:'spinach',
                flavors:['oishii'], textures:['やわらかい'], season:['冬 winter'],
                notes:'Blanched and served as ほうれん草のおひたし (lightly seasoned, with bonito flakes and a drop of soy) — the classic vegetable side of the home meal.' },
              { id:'jagaimo', kanji:'じゃが芋', kana:'じゃがいも', romaji:'jagaimo', en:'potato',
                flavors:['oishii', 'amai'], textures:['もちもち', 'やわらかい'], season:['通年 year-round'],
                notes:'The backbone of 肉じゃが (nikujaga, the home-cooking dish that defines mom\'s cooking), Japanese curry, and コロッケ (korokke). 北海道 (Hokkaido) is the prestige source. メークイン (May Queen — waxy, holds shape in stew) and 男爵 (Danshaku, "Baron" — floury, for mashing). The name comes from ジャガタラ (Jakarta) — Dutch traders brought it from Java.' },
              { id:'satsumaimo', kanji:'薩摩芋', kana:'さつまいも', romaji:'satsumaimo', en:'sweet potato',
                flavors:['amai'], textures:['もちもち', 'やわらかい'], season:['秋 autumn'],
                notes:'The defining autumn root. 焼き芋 (yaki-imo, slow-roasted in a stone-oven truck cruising the neighborhood with a haunting "yaki-imo~" call) is a winter street-food ritual. 紅はるか (Beni Haruka) and 鳴門金時 (Naruto Kintoki) are the prestige cultivars. The name means "Satsuma potato" (Kagoshima\'s old domain name).' },
              { id:'kabocha', kanji:'南瓜', kana:'かぼちゃ', romaji:'kabocha', en:'Japanese pumpkin',
                flavors:['amai', 'oishii'], textures:['もちもち', 'やわらかい'], season:['秋 autumn', '冬 winter'],
                notes:'Dark-green skin, dense bright-orange flesh — sweeter and denser than American pumpkins. Eaten in tempura, simmered as かぼちゃの煮物, or roasted. Traditionally eaten on 冬至 (winter solstice) as a vitamin-rich charm against the cold. The name comes from "Cambodia," the trading route from which it arrived in the 1500s.' },
              { id:'hakusai', kanji:'白菜', kana:'はくさい', romaji:'hakusai', en:'napa cabbage',
                flavors:['amai', 'sawayaka'], textures:['シャキシャキ', 'やわらかい'], season:['冬 winter'],
                notes:'The essential winter nabe vegetable — layered into the bottom of every hot pot to wilt sweetly in the broth. Also the base for kimchi (the Korean import that became a Japanese supermarket staple), 浅漬け (light pickles), and gyoza filling. Sold by the half- or quarter-head in winter — a full one is enormous.' },
              { id:'shouga', kanji:'生姜', kana:'しょうが', romaji:'shouga', en:'ginger',
                flavors:['karai', 'sawayaka'], textures:['シャキシャキ'], season:['通年 year-round'],
                notes:'Grated into nabe dipping sauce, hiyayakko (cold tofu), and the marinade for 生姜焼き (shōgayaki — pork stir-fried in ginger-soy). 紅生姜 (beni-shōga, red-pickled threads) tops takoyaki and gyūdon; ガリ (gari, pink-pickled thin slices) is the sushi-bar palate cleanser. 新生姜 (shin-shōga, young summer ginger) is the seasonal pickle base.' },
              { id:'ninniku', kanji:'大蒜', kana:'にんにく', romaji:'ninniku', en:'garlic',
                flavors:['karai', 'oishii'], textures:['シャキシャキ'], season:['通年 year-round'],
                notes:'青森 (Aomori) grows ~70% of Japan\'s domestic garlic — 福地ホワイト六片 (Fukuchi white six-clove) is the prestige cultivar, with huge cloves and a creamy roasted flavor. The aromatic base of yakiniku marinades, gyoza filling, peperoncino. 黒にんにく (kuro-ninniku, fermented black garlic) is the sweet-balsamic health-food variant.' },
              { id:'piiman', kanji:'', kana:'ピーマン', romaji:'piiman', en:'green bell pepper',
                flavors:['nigai', 'sawayaka'], textures:['シャキシャキ'], season:['夏 summer'],
                notes:'The kids\' nemesis vegetable — slightly bitter, slightly grassy, often the rejected piece on a child\'s plate. Used in 青椒肉絲 (chinjao rōsu, Chinese-style beef and pepper stir-fry), stuffed-pepper bento sides, and chopped into ナポリタン. The sweeter, riper red/yellow cousin is パプリカ.' },
              { id:'moyashi', kanji:'萌やし', kana:'もやし', romaji:'moyashi', en:'bean sprouts',
                flavors:['sawayaka'], textures:['シャキシャキ', 'ぷりぷり'], season:['通年 year-round'],
                notes:'The cheapest vegetable in Japan — usually ¥30 per generous bag. The bulk-up filler in ramen toppings, stir-fries, and student-budget cooking. 緑豆もやし (mungbean sprout) is the standard; 大豆もやし (soybean sprout) is fatter and used in Korean-style bibimbap and nabe.' },
              { id:'gobou', kanji:'牛蒡', kana:'ごぼう', romaji:'gobou', en:'burdock root',
                flavors:['oishii', 'nigai'], textures:['シャキシャキ'], season:['秋 autumn', '冬 winter'],
                notes:'Long brown earth-root with a distinctive woody-mineral flavor. Julienned and stir-fried as きんぴらごぼう (kinpira gobō — soy, mirin, chili, sesame), simmered in 筑前煮 (chikuzen-ni), or shaved into ささがき curls for soba toppings and 豚汁. Almost unknown in Western kitchens.' },
              { id:'renkon', kanji:'蓮根', kana:'れんこん', romaji:'renkon', en:'lotus root',
                flavors:['oishii'], textures:['シャキシャキ'], season:['秋 autumn', '冬 winter'],
                notes:'The cross-section is iconic — a wheel of evenly-spaced holes that Japanese culture reads as 見通しが良い (clear-sight, a good-luck omen). Used in tempura, 筑前煮 (chikuzen-ni), 挟み焼き (hasamiyaki, stuffed with seasoned ground meat and pan-fried), and as a standard お節 (osechi) New Year ingredient.' },
              { id:'murasaki-tamanegi', kanji:'紫玉ねぎ', kana:'むらさきたまねぎ', romaji:'murasaki-tamanegi', en:'red / purple onion',
                flavors:['karai', 'sawayaka'], textures:['シャキシャキ'], season:['春 spring', '夏 summer'],
                notes:'Called 紫 (purple) in Japanese, not "red." Milder and sweeter than the white tamanegi — sliced thin and used raw in salads, sandwiches, and カルパッチョ (carpaccio). The concentric purple rings on the cross-section are the visual appeal.' },
              { id:'burokkorii', kanji:'', kana:'ブロッコリー', romaji:'burokkorii', en:'broccoli',
                flavors:['nigai', 'sawayaka'], textures:['シャキシャキ', 'やわらかい'], season:['冬 winter'],
                notes:'A relatively recent Western import — became standard supermarket stock in the 1980s. Blanched and added to bento as a green spacer, in グラタン (gratin), in pasta, or stir-fried with garlic. Sold in plastic-wrapped heads year-round.' },
              { id:'kimuchi', kanji:'', kana:'キムチ', romaji:'kimuchi', en:'kimchi',
                flavors:['karai', 'suppai', 'shoppai'], textures:['シャキシャキ', 'ぷりぷり'], season:['通年 year-round'],
                notes:'Korean-origin spicy fermented napa cabbage (はくさい), now a Japanese supermarket staple. Eaten as a side, in 豚キムチ炒め (pork-kimchi stir-fry), キムチ鍋 (hot pot), and キムチチャーハン (kimchi fried rice). 宗家 (Jongga) and 牛角 lead the supermarket shelves. See also: はくさい (the base vegetable).' },
            ]
          },
          // ── Niku (Meat) — Phase 3c. ──────────────────────────────
          { id:'niku', kanji:'肉', kana:'にく', romaji:'niku',
            en:'Meat', glyph:'肉',
            items: [
              { id:'gyuuniku', kanji:'牛肉', kana:'ぎゅうにく', romaji:'gyuuniku', en:'beef',
                flavors:['oishii'], textures:['とろとろ'], season:['通年 year-round'],
                notes:'Imported supermarket-grade through legendary wagyu (和牛). 神戸 (Kobe), 松阪 (Matsusaka), 近江 (Omi) are the prestige cultivars. A5 grade marks the highest marbling — the steak melts on the tongue at body temperature.' },
              { id:'butaniku', kanji:'豚肉', kana:'ぶたにく', romaji:'butaniku', en:'pork',
                flavors:['oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'The everyday Japanese meat — more common at home than beef. Star of tonkatsu, shabu-shabu, and 豚汁 (tonjiru, pork miso soup). 黒豚 (kuro-buta, Kagoshima) is the prestige breed.' },
              { id:'toriniku', kanji:'鶏肉', kana:'とりにく', romaji:'toriniku', en:'chicken',
                flavors:['oishii'], textures:['もちもち', 'ぷりぷり'], season:['通年 year-round'],
                notes:'Cuts: もも (thigh) for juiciness, 胸 (breast) for leanness, 手羽先 (wings) for grilling. The base of karaage, oyakodon, and yakitori. 比内地鶏 (Hinai-jidori) is the prestige free-range breed.' },
              { id:'beekon', kanji:'', kana:'ベーコン', romaji:'beekon', en:'bacon',
                flavors:['shoppai', 'oishii'], textures:['もちもち', 'カリカリ'], season:['通年 year-round'],
                notes:'Imported via Western influence. Sold pre-cut in vacuum packs; eaten in carbonara, breakfast plates, or 肉巻き-style wrapped around asparagus or rice.' },
              { id:'hamu', kanji:'', kana:'ハム', romaji:'hamu', en:'ham',
                flavors:['shoppai'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Pink, sliced sandwich ham — a konbini staple. ロースハム (loin ham) is the standard; プロシュート (prosciutto) is imported for special occasions.' },
              { id:'sooseeji', kanji:'', kana:'ソーセージ', romaji:'sooseeji', en:'sausage',
                flavors:['shoppai', 'oishii'], textures:['ぷりぷり'], season:['通年 year-round'],
                notes:'ウインナー (wiener) is the small-skinned breakfast sausage — a bento staple, often cut into tako-shape (octopus) for kids. Schau Essen and Johsonville lead the supermarket shelves.' },
              { id:'suteeki', kanji:'', kana:'ステーキ', romaji:'suteeki', en:'steak',
                flavors:['oishii'], textures:['とろとろ'], season:['通年 year-round'],
                notes:'Often the celebration meal — birthdays, anniversaries, raises. Wagyu steak is the prestige tier; いきなりステーキ (Ikinari Steak) chains made the experience accessible at lunch.' },
              { id:'hikiniku', kanji:'挽き肉', kana:'ひきにく', romaji:'hikiniku', en:'ground meat',
                flavors:['oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'The base of ハンバーグ (hamburger steak — a yōshoku favorite), 麻婆豆腐, gyoza filling, and そぼろ丼 (soboro-don, soy-simmered ground meat over rice). Sold as 牛 / 豚 / 合い挽き (mixed).' },
              { id:'kamoniku', kanji:'鴨肉', kana:'かもにく', romaji:'kamoniku', en:'duck meat',
                flavors:['oishii'], textures:['とろとろ'], season:['冬 winter'],
                notes:'A winter delicacy — 鴨南蛮 (duck-and-leek soba), 鴨ロース (duck breast). Fattier than chicken; the crispy duck-fat-glazed skin is the prized cut at high-end soba shops.' },
              { id:'ramuniku', kanji:'ラム肉', kana:'らむにく', romaji:'ramuniku', en:'lamb',
                flavors:['oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Less common than beef/pork in Japanese cuisine, but Hokkaido has a strong lamb tradition: ジンギスカン (Genghis Khan) — lamb grilled at the table on a dome-shaped pan over a charcoal brazier.' },
              { id:'hanbaagaa', kanji:'', kana:'ハンバーガー', romaji:'hanbaagaa', en:'hamburger',
                flavors:['oishii', 'shoppai'], textures:['もちもち', 'ぷりぷり'], season:['通年 year-round'],
                notes:'The Western fast-food burger. McDonald\'s (マック / マクド) and モスバーガー (Mos Burger, Japan-original since 1972) dominate. テリヤキバーガー (teriyaki burger) is the Japanese-original variant — a teriyaki-glazed beef patty that became a McDonald\'s Japan signature. Note: distinct from ハンバーグ (hamburg steak, no bun), which is a separate yōshoku dish.' },
              { id:'furaido-chikin', kanji:'', kana:'フライドチキン', romaji:'furaido-chikin', en:'fried chicken (Western)',
                flavors:['oishii', 'shoppai'], textures:['カリカリ', 'ぷりぷり'], season:['通年 year-round'],
                notes:'Bone-in Western-style fried chicken — KFC (ケンタッキー) is so dominant the chain made fried chicken Japan\'s unofficial Christmas Eve meal. The ad campaign "ケンタッキーでクリスマス" (1974) created the tradition; families now pre-order buckets weeks in advance. Distinct from 唐揚げ (karaage), the smaller boneless Japanese cousin.' },
            ]
          },
          // ── Sakana (Fish & Sea) — Phase 3d. ──────────────────────
          { id:'sakana', kanji:'魚', kana:'さかな', romaji:'sakana',
            en:'Fish & Sea', glyph:'魚',
            items: [
              { id:'maguro', kanji:'鮪', kana:'まぐろ', romaji:'maguro', en:'tuna',
                flavors:['oishii'], textures:['とろとろ'], season:['冬 winter'],
                notes:'The king of sushi. 赤身 (akami, lean red) is the everyday cut; 中トロ (chūtoro, medium-fatty) and 大トロ (ōtoro, fatty belly) climb the price tier. 本マグロ (hon-maguro, Bluefin) tops Toyosu auctions.' },
              { id:'samon', kanji:'', kana:'サーモン', romaji:'samon', en:'salmon',
                flavors:['oishii'], textures:['とろとろ', 'ぷりぷり'], season:['秋 autumn'],
                notes:'Now ubiquitous, but not traditionally Japanese — Norwegian salmon was introduced via Project Japan in 1980. 焼き鮭 (yakizake, grilled salmon) is the standard breakfast protein at ryokan.' },
              { id:'saba', kanji:'鯖', kana:'さば', romaji:'saba', en:'mackerel',
                flavors:['oishii'], textures:['もちもち'], season:['秋 autumn'],
                notes:'Cheap, fatty, oily — the unprincipled fish that nourishes the country. 鯖の味噌煮 (saba simmered in miso) and 〆鯖 (vinegar-cured sashimi-grade) are home staples.' },
              { id:'tai', kanji:'鯛', kana:'たい', romaji:'tai', en:'sea bream',
                flavors:['oishii'], textures:['ぷりぷり'], season:['春 spring'],
                notes:'The celebratory fish — served whole at weddings, baby-naming ceremonies, and New Year. 真鯛 (madai, red sea bream) is the standard. Its name is a pun on めでたい (auspicious).' },
              { id:'buri', kanji:'鰤', kana:'ぶり', romaji:'buri', en:'yellowtail (mature)',
                flavors:['oishii'], textures:['とろとろ'], season:['冬 winter'],
                notes:'The winter prestige fish. Same species as hamachi (the younger fish becomes buri when fully mature). 寒ブリ (kan-buri, cold-season-caught) is the highest grade — fatty, rich, and sweet at the belly.' },
              { id:'unagi', kanji:'鰻', kana:'うなぎ', romaji:'unagi', en:'eel',
                flavors:['amai', 'oishii'], textures:['とろとろ'], season:['夏 summer'],
                notes:'Grilled, glazed in tare (sweet soy), served on rice as うな丼 / うな重. Eaten on 土用の丑の日 (doyō no ushi no hi) — a summer holiday for stamina. Endangered; prices climb yearly.' },
              { id:'tako', kanji:'蛸', kana:'たこ', romaji:'tako', en:'octopus',
                flavors:['oishii'], textures:['ぷりぷり'], season:['夏 summer'],
                notes:'Boiled until tender, eaten as sushi (red and rubbery), takoyaki (Osaka street food), or tako-su (vinegared). 明石 (Akashi, Hyogo) is the prestige source — strong currents give the octopus thicker muscle.' },
              { id:'ika', kanji:'烏賊', kana:'いか', romaji:'ika', en:'squid',
                flavors:['oishii'], textures:['ぷりぷり'], season:['通年 year-round'],
                notes:'Sliced thin as sashimi, deep-fried as ika furai, or simmered with daikon. スルメ (surume, dried squid) is the classic drinking snack. 蛍烏賊 (hotaru-ika, firefly squid) is the spring delicacy.' },
              { id:'ebi', kanji:'海老', kana:'えび', romaji:'ebi', en:'shrimp / prawn',
                flavors:['amai', 'oishii'], textures:['ぷりぷり'], season:['通年 year-round'],
                notes:'車海老 (kuruma-ebi, prawn) for tempura and sushi nigiri. 甘海老 (ama-ebi, sweet shrimp) eaten raw — the only shrimp better sweet than savory. ぼたん海老 (botan-ebi) is the prestige sashimi-grade.' },
              { id:'kani', kanji:'蟹', kana:'かに', romaji:'kani', en:'crab',
                flavors:['amai'], textures:['ぷりぷり'], season:['冬 winter'],
                notes:'冬の王様 (king of winter). タラバガニ (king crab), 毛蟹 (kegani, hairy crab from Hokkaido), and ズワイガニ (zuwai, snow crab from the Japan Sea) are the three prestige cultivars.' },
            ]
          },
          // ── Kokumotsu (Grains) — Phase 3e. ───────────────────────
          { id:'kokumotsu', kanji:'穀物', kana:'こくもつ', romaji:'kokumotsu',
            en:'Grains', glyph:'穀',
            items: [
              { id:'gohan', kanji:'ご飯', kana:'ごはん', romaji:'gohan', en:'cooked rice',
                flavors:['amai', 'oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Just "rice" — and also literally the word for "meal." Short-grain japonica, sticky when cooked. Premium cultivars: コシヒカリ (Koshihikari), あきたこまち (Akita-Komachi), 新潟魚沼 (Niigata Uonuma).' },
              { id:'onigiri', kanji:'御握り', kana:'おにぎり', romaji:'onigiri', en:'rice ball',
                flavors:['shoppai', 'oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Triangular rice ball wrapped in nori. Classic fillings: 梅 (ume plum), 鮭 (salmon), 昆布 (kombu), おかか (bonito flakes). The cheapest food in Japan; konbini chains sell millions a day.' },
              { id:'mochi', kanji:'餅', kana:'もち', romaji:'mochi', en:'rice cake',
                flavors:['amai', 'oishii'], textures:['もちもち'], season:['冬 winter'],
                notes:'Pounded sticky rice. Eaten grilled with shoyu, in 雑煮 (zōni, New Year soup), or as the wrapper for daifuku. 餅つき (mochi-tsuki) is a New Year ritual — pound the rice in a stone mortar with wooden mallets.' },
              { id:'pan', kanji:'', kana:'パン', romaji:'pan', en:'bread',
                flavors:['amai'], textures:['ふわふわ', 'もちもち'], season:['通年 year-round'],
                notes:'Japanese bread is famously soft + sweet — softer than its European cousins. 菓子パン (kashi-pan, sweet bread), あんパン (anpan, red-bean-filled), クリームパン (cream-filled). The word comes from Portuguese "pão" via 16th-century traders.' },
              { id:'shokupan', kanji:'食パン', kana:'しょくパン', romaji:'shokupan', en:'Japanese milk bread',
                flavors:['amai'], textures:['ふわふわ', 'もちもち'], season:['通年 year-round'],
                notes:'The thick-sliced cottony white loaf. Sold in 6-slice or 8-slice packs at the bakery. Eaten toasted with butter, in 卵サンド (egg-salad sandwich), or as the base for fruit sando.' },
              { id:'udon', kanji:'饂飩', kana:'うどん', romaji:'udon', en:'udon noodles',
                flavors:['oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Thick wheat noodles in dashi broth. 讃岐うどん (Sanuki, Kagawa prefecture) is the prestige cultivar — chewy and square-cut. Eaten hot as かけうどん or cold as ざるうどん.' },
              { id:'soba', kanji:'蕎麦', kana:'そば', romaji:'soba', en:'soba noodles',
                flavors:['oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Buckwheat noodles, thinner than udon. 信州そば (Shinshu, Nagano) and 出雲そば (Izumo, Shimane) are prestige. ざるそば (cold dipping) in summer, かけそば (hot broth) in winter. 年越しそば eaten on New Year\'s Eve.' },
              { id:'raamen', kanji:'', kana:'ラーメン', romaji:'raamen', en:'ramen',
                flavors:['oishii', 'shoppai'], textures:['もちもち'], season:['通年 year-round'],
                notes:'The national obsession. Four base broths: 塩 (shio, salt), 醤油 (shoyu, soy), 味噌 (miso), 豚骨 (tonkotsu, pork bone). Each region carries its own variant. The standard salaryman lunch.' },
              { id:'pasuta', kanji:'', kana:'パスタ', romaji:'pasuta', en:'pasta',
                flavors:['oishii'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Imported via the post-war era and thoroughly Japanized. 和風スパゲッティ (wafū spaghetti — mentaiko, shiso, mushrooms), ナポリタン (Napolitan, ketchup-based) are the homegrown standards.' },
              { id:'genmai', kanji:'玄米', kana:'げんまい', romaji:'genmai', en:'brown rice',
                flavors:['oishii'], textures:['もちもち', 'シャキシャキ'], season:['通年 year-round'],
                notes:'Unpolished rice. Chewier, nuttier, more nutritious than white rice. Common in health-food restaurants and macrobiotic cuisine; sold in the same bags as white rice at supermarkets.' },
              { id:'nattou', kanji:'納豆', kana:'なっとう', romaji:'nattou', en:'fermented soybeans',
                flavors:['oishii', 'nigai'], textures:['ねばねば', 'ぷちぷち'], season:['通年 year-round'],
                notes:'The famously divisive Japanese breakfast — fermented soybeans webbed in sticky threads (糸 ito), eaten over rice with soy and the mustard packet that comes in the styrofoam cup. 茨城 (Ibaraki) is the historical heartland. Stir vigorously with chopsticks until foamy — that\'s when the umami opens up. Pairs naturally with ご飯, たまご (TKG-style), and ねぎ.' },
            ]
          },
          // ── Nyuuseihin (Dairy & Eggs) — Phase 3f. ────────────────
          { id:'nyuuseihin', kanji:'乳製品', kana:'にゅうせいひん', romaji:'nyuuseihin',
            en:'Dairy & Eggs', glyph:'乳',
            items: [
              { id:'tamago', kanji:'卵', kana:'たまご', romaji:'tamago', en:'egg',
                flavors:['oishii'], textures:['とろとろ'], season:['通年 year-round'],
                notes:'Eaten raw in 卵かけご飯 (TKG — raw egg over hot rice + soy), in tamagoyaki (sweet rolled omelet), or as the topping on gyudon, oyakodon, sukiyaki. Japanese eggs are salmonella-tested for safe raw consumption — the brown supermarket egg is the standard.' },
              { id:'gyuunyuu', kanji:'牛乳', kana:'ぎゅうにゅう', romaji:'gyuunyuu', en:'milk',
                flavors:['amai', 'oishii'], textures:['クリーミー'], season:['通年 year-round'],
                notes:'Drunk plain after a bath at a sentō (public bath) is a Shōwa-era ritual — hand on hip, glass on chest. Hokkaido milk (especially 北海道牛乳) is the prestige cultivar — richer, less processed.' },
              { id:'bataa', kanji:'', kana:'バター', romaji:'bataa', en:'butter',
                flavors:['oishii'], textures:['クリーミー', 'とろとろ'], season:['通年 year-round'],
                notes:'Often melted on Sapporo-style miso ramen, on hot corn (バターコーン), or on grilled Hokkaido scallops. The classic Japanese-toast topping: butter + honey + thick shokupan. Yotsuba (Hokkaido) is the prestige brand.' },
              { id:'chiizu', kanji:'', kana:'チーズ', romaji:'chiizu', en:'cheese',
                flavors:['oishii', 'shoppai'], textures:['もちもち'], season:['通年 year-round'],
                notes:'6P チーズ (Yukijirushi six-wedge round) is the childhood snack. Used in modern recipes: チーズタッカルビ (cheese dak galbi), gratin, pizza. Less central than in Western cuisines but rising — natural-cheese imports doubled in the last decade.' },
              { id:'yooguruto', kanji:'', kana:'ヨーグルト', romaji:'yooguruto', en:'yogurt',
                flavors:['suppai'], textures:['クリーミー', 'とろとろ'], season:['通年 year-round'],
                notes:'Eaten plain or with fruit for breakfast. R-1 (Meiji) ヨーグルト is the immune-boosting probiotic the country goes through. プレーン (no sugar), 砂糖入り (sweetened), or アロエ (with aloe) are the standard supermarket options.' },
              { id:'namakuriimu', kanji:'生クリーム', kana:'なまクリーム', romaji:'namakuriimu', en:'whipped cream',
                flavors:['amai'], textures:['ふわふわ', 'クリーミー'], season:['通年 year-round'],
                notes:'On strawberry shortcake (the Japanese Christmas cake), fruit sando, and parfaits. Often whipped less stiff than Western versions — lighter, airier, less sweetened. The shortcake-cream layer between sponges is half the dessert\'s identity.' },
              { id:'purin', kanji:'', kana:'プリン', romaji:'purin', en:'pudding',
                flavors:['amai'], textures:['とろとろ', 'もちもち'], season:['通年 year-round'],
                notes:'Caramel custard. The konbini standard is Morinaga or Glico. プッチンプリン (Pucchin Purin, Glico) is the iconic shape — invert the cup, pull the tab at the bottom, and a dome plops onto the plate with a satisfying suction-snap.' },
              { id:'aisukuriimu', kanji:'', kana:'アイスクリーム', romaji:'aisukuriimu', en:'ice cream',
                flavors:['amai', 'tsumetai'], textures:['クリーミー', 'やわらかい'], season:['夏 summer'],
                notes:'抹茶 (matcha) and 黒ごま (black sesame) are the iconic Japanese flavors. Haagen-Dazs is omnipresent. ソフトクリーム (soft-serve, often Hokkaido lavender or Yubari melon) sits alongside it at every farm stand and tourist spot.' },
              { id:'tounyuu', kanji:'豆乳', kana:'とうにゅう', romaji:'tounyuu', en:'soy milk',
                flavors:['oishii'], textures:['クリーミー'], season:['通年 year-round'],
                notes:'Not technically dairy, but shelved with milk. The base for tofu — also drunk as a beverage. キッコーマン (Kikkoman) makes flavored versions: 抹茶, 紅茶, ココア, バナナ, even コーンスープ. A coffee-shop alternative milk staple.' },
              { id:'mayoneezu', kanji:'', kana:'マヨネーズ', romaji:'mayoneezu', en:'mayonnaise',
                flavors:['oishii'], textures:['クリーミー'], season:['通年 year-round'],
                notes:'Kewpie マヨネーズ (since 1925) is the national brand — egg-yolk-only (no whites), more umami than Western mayo, packaged in the iconic red-cap squeeze bottle. Squeezed onto okonomiyaki, takoyaki, fried chicken, sandwiches, and famously onto pizza.' },
            ]
          },
          // ── Kashi (Sweets) — Phase 3g. ───────────────────────────
          { id:'kashi', kanji:'菓子', kana:'かし', romaji:'kashi',
            en:'Sweets', glyph:'菓',
            items: [
              { id:'dango', kanji:'団子', kana:'だんご', romaji:'dango', en:'rice dumplings',
                flavors:['amai'], textures:['もちもち'], season:['通年 year-round'],
                notes:'Three-color dango on a skewer: pink (cherry), white (plain), green (mugwort) — the classic 花見 (cherry-blossom-viewing) spring sweet. みたらし団子 (mitarashi, sweet soy glaze) is the year-round version.' },
              { id:'daifuku', kanji:'大福', kana:'だいふく', romaji:'daifuku', en:'mochi with red bean',
                flavors:['amai'], textures:['もちもち'], season:['通年 year-round'],
                notes:'White mochi ball with sweet red bean (あんこ) filling. 苺大福 (strawberry daifuku) is the modern variation — a whole strawberry inside the bean paste. Sold at every wagashi shop in Japan.' },
              { id:'dorayaki', kanji:'銅鑼焼き', kana:'どらやき', romaji:'dorayaki', en:'pancake sandwich with anko',
                flavors:['amai'], textures:['ふわふわ', 'もちもち'], season:['通年 year-round'],
                notes:'Two pancakes sandwiching anko. Doraemon\'s favorite food — the cartoon cat made the sweet internationally famous. The name comes from 銅鑼 (dora, a gong) which the round shape resembles.' },
              { id:'taiyaki', kanji:'鯛焼き', kana:'たいやき', romaji:'taiyaki', en:'fish-shaped pastry',
                flavors:['amai'], textures:['もちもち', 'カリカリ'], season:['冬 winter'],
                notes:'Fish-shaped pastry filled with anko (or custard, chocolate). Originated in 1909 Tokyo. Eaten hot off the iron, often by the dozen on winter festival nights. The 尾 (tail) is the prized last bite.' },
              { id:'ohagi', kanji:'御萩', kana:'おはぎ', romaji:'ohagi', en:'sticky rice with sweet bean',
                flavors:['amai'], textures:['もちもち'], season:['秋 autumn'],
                notes:'Inverse daifuku — sticky rice on the OUTSIDE, anko coating it from the OUTSIDE. Eaten at 彼岸 (higan, the equinox) as an ancestor offering. Same dessert as 牡丹餅 (botamochi) but with a seasonal name swap.' },
              { id:'manjuu', kanji:'饅頭', kana:'まんじゅう', romaji:'manjuu', en:'steamed bun',
                flavors:['amai'], textures:['もちもち', 'ふわふわ'], season:['通年 year-round'],
                notes:'Steamed bun with sweet filling — anko, kuri (chestnut), or matcha. 温泉まんじゅう (onsen manjū) is the souvenir bought at every hot-spring town, sold by the boxful.' },
              { id:'youkan', kanji:'羊羹', kana:'ようかん', romaji:'youkan', en:'jellied red bean',
                flavors:['amai'], textures:['ねばねば'], season:['通年 year-round'],
                notes:'Jellied red-bean paste cut into rectangular blocks. Dense, chewy, intensely sweet. 練りようかん (neri-yōkan) is the standard; 水ようかん (mizu-yōkan) is the lighter, jelly-soft summer version.' },
              { id:'kakigoori', kanji:'かき氷', kana:'かきごおり', romaji:'kakigoori', en:'shaved ice',
                flavors:['amai', 'tsumetai'], textures:['シャリシャリ'], season:['夏 summer'],
                notes:'Shaved ice with colored syrup — strawberry, melon, blue Hawaii, matcha. The summer festival staple. 宇治金時 (Uji-kintoki, matcha syrup + anko + condensed milk) is the kaiseki-tier version.' },
              { id:'warabimochi', kanji:'蕨餅', kana:'わらびもち', romaji:'warabimochi', en:'bracken starch jelly',
                flavors:['amai'], textures:['もちもち', 'とろとろ'], season:['夏 summer'],
                notes:'Bracken-starch jelly cubes coated in kinako (toasted soybean flour) and drizzled with kuromitsu (black-sugar syrup). 京都 (Kyoto) is the prestige source — the Daitoku-ji area has shops 400 years old.' },
              { id:'anmitsu', kanji:'餡蜜', kana:'あんみつ', romaji:'anmitsu', en:'agar + bean + fruit dessert',
                flavors:['amai'], textures:['シャキシャキ', 'もちもち'], season:['夏 summer'],
                notes:'A bowl of agar cubes (寒天 kanten), fruit, anko, and a drizzle of kuromitsu. The summer cafe specialty — kiwi, mandarin, cherry, banana, mochi balls, and a glossy anko mound, all chilled. Often topped with matcha ice cream for the deluxe version (クリームあんみつ).' },
              // Note: poppukoon, furaido-poteto, poteto-chippusu, piinattsu
              // were removed from the kashi category — they're industrial
              // snacks (mostly potatoes + popcorn + peanuts) that don't fit
              // the traditional-Japanese-sweets framing. The images are
              // still wired into FLAVOR_EXAMPLES.shoppai for the flavor
              // immersion view.
            ]
          },
          // ── Nomimono (Drinks) — Phase 3h. ────────────────────────
          // All 10 drinks now have images. The 3 I originally misread
          // as sweets in batch 6 turned out to be juusu (the file
          // I'd named daifuku-variant), tansansui (was anmitsu), and
          // ocha (was kakigoori-variant — the amber-tinted glass with
          // wheat decoration; user to verify the image content matches
          // the ocha intent, as the AI generated it amber-leaning).
          { id:'nomimono', kanji:'飲み物', kana:'のみもの', romaji:'nomimono',
            en:'Drinks', glyph:'飲',
            items: [
              { id:'ocha', kanji:'お茶', kana:'おちゃ', romaji:'ocha', en:'green tea',
                flavors:['oishii', 'nigai'], textures:['さらさら'], season:['通年 year-round'],
                notes:'Just "tea" — almost always sencha (green) or hōjicha (roasted green). Served free with the meal at restaurants, hot in winter and cold in summer. Bottled ocha (Iyemon, 伊右衛門 / Oi Ocha, おーいお茶) lines every konbini fridge.' },
              { id:'maccha', kanji:'抹茶', kana:'まっちゃ', romaji:'maccha', en:'matcha',
                flavors:['nigai', 'oishii'], textures:['クリーミー'], season:['通年 year-round'],
                notes:'Powdered green tea, whisked into hot water with a 茶筅 (chasen, bamboo whisk) until it froths. The center of 茶道 (sadō, the tea ceremony). 宇治 (Uji, Kyoto) is the prestige source — Yamamasa, Marukyu-Koyamaen, Ippodo are the canonical houses. Modern uses: lattes, ice cream, sweets, pasta.' },
              { id:'mugicha', kanji:'麦茶', kana:'むぎちゃ', romaji:'mugicha', en:'barley tea',
                flavors:['oishii'], textures:['さらさら'], season:['夏 summer'],
                notes:'Roasted barley tea, drunk cold in summer from pitchers in every Japanese fridge. Caffeine-free, served to kids and adults alike. The taste of every Japanese childhood summer afternoon.' },
              { id:'uuroncha', kanji:'烏龍茶', kana:'ウーロンちゃ', romaji:'uuroncha', en:'oolong tea',
                flavors:['tsumetai', 'nigai'], textures:['さらさら'], season:['通年 year-round'],
                notes:'Chinese-origin partially-oxidized tea. Drunk hot in winter, cold from vending machines in summer. The default izakaya non-alcoholic order paired with greasy food — cuts through the oil.' },
              { id:'mizu', kanji:'水', kana:'みず', romaji:'mizu', en:'water',
                flavors:['tsumetai'], textures:['さらさら'], season:['通年 year-round'],
                notes:'Free at restaurants — served alongside hot tea before you order. Japanese tap water is safe and drinkable nationwide; bottled water is for portability rather than quality. 南アルプス天然水 (Suntory) and いろはす (Coca-Cola) dominate the konbini shelves.' },
              { id:'koohii', kanji:'', kana:'コーヒー', romaji:'koohii', en:'coffee',
                flavors:['nigai', 'oishii'], textures:['クリーミー'], season:['通年 year-round'],
                notes:'From Portuguese "café" via 18th-century Dutch traders. Japanese coffee culture spans the smoke-filled 喫茶店 (kissaten, Showa-era jazz coffee shops), the omnipresent vending-machine canned coffee (Boss, Wonda, Georgia), and the modern third-wave Tokyo specialty scene.' },
              { id:'nihonshu', kanji:'日本酒', kana:'にほんしゅ', romaji:'nihonshu', en:'sake / rice wine',
                flavors:['oishii'], textures:['さらさら'], season:['通年 year-round'],
                notes:'Brewed rice wine. 純米 (junmai, no added alcohol), 吟醸 (ginjō, ≤60% rice polish), 大吟醸 (daiginjō, ≤50%) are the polish-grade tiers — more polished = clearer, more delicate. Served warm (kan) in winter, cold (reishu) in summer, in a 徳利 (tokkuri flask) + お猪口 (ochoko cup).' },
              { id:'biiru', kanji:'', kana:'ビール', romaji:'biiru', en:'beer',
                flavors:['nigai', 'oishii'], textures:['さらさら'], season:['夏 summer', '通年 year-round'],
                notes:'Japan\'s four major breweries: アサヒ (Asahi), キリン (Kirin), サッポロ (Sapporo), サントリー (Suntory). All crisp dry lagers, served ice cold. "とりあえず生" ("a draft to start") is the unofficial opening line of every izakaya order.' },
              { id:'juusu', kanji:'', kana:'ジュース', romaji:'juusu', en:'juice',
                flavors:['amai', 'suppai'], textures:['ジューシー'], season:['通年 year-round'],
                notes:'Usually orange juice in default reference (オレンジジュース) — the breakfast staple at family restaurants and business hotels. 100% no-sugar-added cartons line the konbini shelves; ミニッツメイド and カゴメ are the dominant brands.' },
              { id:'tansansui', kanji:'炭酸水', kana:'たんさんすい', romaji:'tansansui', en:'sparkling water',
                flavors:['tsumetai'], textures:['さらさら'], season:['通年 year-round'],
                notes:'Plain or lemon-flavored carbonated water. ウィルキンソン (Wilkinson, since 1904) is the iconic Japanese sparkling-water brand — also the standard Highball mixer at home (whisky + Wilkinson + lemon = the canonical Japanese highball).' },
            ]
          },
        ]
      },
      // Textures — Phase 2 placeholder. Sits below edibles in the sidebar
      // order (was previously between flavors and edibles; moved here to
      // group the populated books — flavors + edibles — together and
      // keep the coming-soon placeholder out of the way until Phase 2
      // ships). Phase 2 will replace this with a real textures book
      // carrying the doubled-kana onomatopoeia (もちもち, さくさく,
      // ねばねば, ぱりぱり, さらさら, ふわふわ, とろとろ, シャキシャキ,
      // ぷりぷり, カリカリ) and the brush-motion-line signature
      // treatment per DESIGN.md §5.4.
      { id:'textures', titleJa:'しょっかん', titleEn:'Textures', glyph:'食感', primaryLevel:'N4', pages:[], isExperience:true, isComingSoon:true },
      // Fast food chains — direct launch into a specific restaurant's
      // scene flow (not random). `isFastFood:true` puts them in their
      // own sidebar group between Interactive and Books; `restaurantId`
      // tells the renderer which EATING_OUT_RESTAURANTS entry to load.
      // (No interactive McDonald's/KFC books here anymore — they moved
      // into the `fast-food` hub book in the Books group below, with a
      // card selector at the top of the page instead of the bottom
      // pager.)
      // ── Yatai (Street Food) — chain-selector hub ───────────────
      // 4 establishment types on a 1-row card selector. No per-page
      // restaurantId — the experience button rolls a random yatai.
      // Placed first in the books group: street food is the most
      // approachable entry point for beginners (no reservations, no
      // ordering script, eat outside with your hands).
      { id:'yatai', titleJa:'やたい', titleEn:'Street Food', glyph:'屋', primaryLevel:'N5',
        isCategoryHub:true, randomCategory:'yatai',
        pages: [
          // Street Food pages auto-resolve their big-image + selector
          // thumbnail to images/vocab/<page.id>.png. Drop a PNG with
          // the matching name and both spots fill in. Explicit
          // imageSrc / coverImageSrc / coverImage overrides still win
          // if you ever need a different file.
          {
            id:'takoyaki', type:'cheatsheet',
            title:'たこ焼き', subtitle:'Octopus balls + the takoyaki stand',
            imageSlotId:'sheet-takoyaki',
            chainName:{ ja:'たこ焼き', en:'Takoyaki' },
            items: [
              { num:1,  kanji:'たこ焼き',   kana:'たこやき',     en:'takoyaki — octopus balls' },
              { num:2,  kanji:'タコ',       kana:'たこ',         en:'octopus' },
              { num:3,  kanji:'鰹節',       kana:'かつおぶし',   en:'bonito flakes' },
              { num:4,  kanji:'青のり',     kana:'あおのり',     en:'green seaweed flakes' },
              { num:5,  kanji:'ソース',     kana:'そーす',       en:'okonomi sauce' },
              { num:6,  kanji:'マヨネーズ', kana:'まよねーず',   en:'mayonnaise' },
              { num:7,  kanji:'紅生姜',     kana:'べにしょうが', en:'red pickled ginger' },
              { num:8,  kanji:'鉄板',       kana:'てっぱん',     en:'iron griddle' },
              { num:9,  kanji:'楊枝',       kana:'ようじ',       en:'toothpick (for eating)' },
              { num:10, kanji:'舟皿',       kana:'ふねざら',     en:'boat-shaped paper tray' },
            ]
          },
          {
            id:'okonomiyaki', type:'cheatsheet',
            title:'お好み焼き', subtitle:'Savory pancake at a teppan stall',
            imageSlotId:'sheet-okonomiyaki',
            chainName:{ ja:'お好み焼き', en:'Okonomiyaki' },
            items: [
              { num:1,  kanji:'お好み焼き', kana:'おこのみやき', en:'okonomiyaki — savory pancake' },
              { num:2,  kanji:'キャベツ',   kana:'きゃべつ',     en:'cabbage (main filler)' },
              { num:3,  kanji:'豚肉',       kana:'ぶたにく',     en:'pork' },
              { num:4,  kanji:'卵',         kana:'たまご',       en:'egg' },
              { num:5,  kanji:'小麦粉',     kana:'こむぎこ',     en:'wheat flour' },
              { num:6,  kanji:'ソース',     kana:'そーす',       en:'okonomi sauce' },
              { num:7,  kanji:'マヨネーズ', kana:'まよねーず',   en:'mayonnaise' },
              { num:8,  kanji:'へら',       kana:'へら',         en:'spatula (eat directly off it)' },
              { num:9,  kanji:'鉄板',       kana:'てっぱん',     en:'iron griddle' },
              { num:10, kanji:'関西風',     kana:'かんさいふう', en:'Kansai style (everything mixed in)' },
            ]
          },
          {
            id:'yakitori', type:'cheatsheet',
            title:'焼き鳥屋台', subtitle:'Grilled chicken skewers, charcoal smoke',
            imageSlotId:'sheet-yakitori-stall',
            chainName:{ ja:'焼き鳥', en:'Yakitori' },
            items: [
              { num:1,  kanji:'焼き鳥',   kana:'やきとり',   en:'grilled chicken skewers' },
              { num:2,  kanji:'串',       kana:'くし',       en:'skewer' },
              { num:3,  kanji:'タレ',     kana:'たれ',       en:'sweet soy glaze' },
              { num:4,  kanji:'塩',       kana:'しお',       en:'salt seasoning' },
              { num:5,  kanji:'炭火',     kana:'すみび',     en:'charcoal fire' },
              { num:6,  kanji:'もも',     kana:'もも',       en:'chicken thigh' },
              { num:7,  kanji:'ねぎま',   kana:'ねぎま',     en:'chicken + leek' },
              { num:8,  kanji:'つくね',   kana:'つくね',     en:'chicken meatball' },
              { num:9,  kanji:'レモン',   kana:'れもん',     en:'lemon (for skewers)' },
              { num:10, kanji:'七味',     kana:'しちみ',     en:'shichimi (seven-spice pepper)' },
            ]
          },
          {
            id:'festival', type:'cheatsheet',
            title:'縁日', subtitle:'Festival stalls — sweets and games',
            imageSlotId:'sheet-festival',
            chainName:{ ja:'縁日', en:'Festival' },
            items: [
              { num:1,  kanji:'縁日',           kana:'えんにち',         en:'festival day' },
              { num:2,  kanji:'屋台',           kana:'やたい',           en:'food stall / cart' },
              { num:3,  kanji:'綿菓子',         kana:'わたがし',         en:'cotton candy' },
              { num:4,  kanji:'りんご飴',       kana:'りんごあめ',       en:'candy apple' },
              { num:5,  kanji:'焼きとうもろこし', kana:'やきとうもろこし', en:'grilled corn on the cob' },
              { num:6,  kanji:'かき氷',         kana:'かきごおり',       en:'shaved ice' },
              { num:7,  kanji:'たい焼き',       kana:'たいやき',         en:'fish-shaped sweet pastry' },
              { num:8,  kanji:'天ぷら',         kana:'てんぷら',         en:'tempura (battered & deep-fried)' },
              { num:9,  kanji:'提灯',           kana:'ちょうちん',       en:'paper lantern' },
              { num:10, kanji:'浴衣',           kana:'ゆかた',           en:'summer kimono (worn at festivals)' },
            ]
          },
        ]
      },

      // ── Sushi (寿司) — single-restaurant hub ──────────────────────
      // 3 pages: vocab cheatsheet → explanation → menu reference.
      // The experience button rolls a random sushi restaurant.
      { id:'sushi-ya', titleJa:'すしや', titleEn:'Sushi', glyph:'寿', primaryLevel:'N5',
        isCategoryHub:true, randomCategory:'sushi',
        pages: [
          {
            id:'vocab', type:'cheatsheet',
            title:'寿司', subtitle:'Words at a sushi counter',
            imageSlotId:'sheet-sushi-vocab',
            items: [
              { num:1,  kanji:'寿司',   kana:'すし',     en:'sushi' },
              { num:2,  kanji:'握り',   kana:'にぎり',   en:'nigiri (hand-pressed)' },
              { num:3,  kanji:'巻物',   kana:'まきもの', en:'maki (rolls)' },
              { num:4,  kanji:'刺身',   kana:'さしみ',   en:'sashimi (raw fish, no rice)' },
              { num:5,  kanji:'醤油',   kana:'しょうゆ', en:'soy sauce' },
              { num:6,  kanji:'山葵',   kana:'わさび',   en:'wasabi' },
              { num:7,  kanji:'ガリ',   kana:'がり',     en:'pickled ginger' },
              { num:8,  kanji:'板前',   kana:'いたまえ', en:'sushi chef (itamae)' },
              { num:9,  kanji:'シャリ', kana:'しゃり',   en:'sushi rice' },
              { num:10, kanji:'ネタ',   kana:'ねた',     en:'topping (the fish on top)' },
            ]
          },
          {
            id:'intro', type:'explanation',
            title:'寿司について', subtitleEn:'About sushi',
            heroImageSrc:'images/covers/sushi.webp',
            sections: [
              { ja:'寿司は、酢で味付けしたご飯（シャリ）の上に魚や貝、卵などのネタをのせた料理。江戸時代に屋台料理として広まった「握り寿司」が今の主流。',
                en:"Sushi is vinegared rice (shari) topped with fish, shellfish, egg, or other neta. The hand-pressed nigiri style we know today emerged as street food in the Edo period (1603–1868)." },
              { ja:'値段はピンキリ。回転寿司なら一皿100〜500円で気楽に。本格的な寿司屋ではカウンターで板前さんが目の前で握ってくれる — 5,000円から数万円まで。',
                en:"Prices range widely. Conveyor-belt shops are 100–500 yen per plate, casual and relaxed. A traditional sushi counter (kaiten ja nai) — where the itamae presses each piece in front of you — runs anywhere from ¥5,000 to tens of thousands." },
              { ja:'食べ方のマナー: 醤油はネタにつける（シャリじゃなく）、ガリは口直しに、わさびは小さじ少々を寿司に直接。手で食べてもOK。',
                en:"Etiquette: dip the topping side into soy sauce (not the rice), eat gari as a palate cleanser between pieces, put a tiny dab of wasabi directly on the sushi. Eating with fingers is fine." },
            ]
          },
          {
            id:'menu', type:'menu-reference',
            title:'寿司屋のメニュー', subtitleEn:'What you might see at a sushi counter',
            // All eleven rows now carry photographic PNGs (the SVGs we
            // shipped before are kept on disk as a fallback but no row
            // references them anymore). foodImg accepts the full filename
            // so the renderer doesn't need an extension fix.
            items: [
              { kanji:'マグロ',     kana:'まぐろ',     en:'tuna nigiri',          price:300, foodImg:'sushi-maguro.webp' },
              { kanji:'サーモン',   kana:'さーもん',   en:'salmon nigiri',        price:280, foodImg:'sushi-salmon.webp' },
              { kanji:'エビ',       kana:'えび',       en:'shrimp nigiri',        price:250, foodImg:'sushi-ebi.webp' },
              { kanji:'巻き寿司',   kana:'まきずし',   en:'maki rolls',           price:400, foodImg:'sushi-maki.webp' },
              { kanji:'うに',       kana:'うに',       en:'sea urchin',           price:450, foodImg:'sushi-uni.webp' },
              { kanji:'いくら',     kana:'いくら',     en:'salmon roe',           price:380, foodImg:'sushi-ikura.webp' },
              { kanji:'玉子',       kana:'たまご',     en:'tamago (sweet egg)',    price:180, foodImg:'sushi-tamago.webp' },
              { kanji:'ハマチ',     kana:'はまち',     en:'yellowtail',           price:280, foodImg:'sushi-hamachi.webp' },
              { kanji:'お味噌汁',   kana:'おみそしる', en:'miso soup',            price:200, foodImg:'dish-miso-soup.webp' },
              { kanji:'日本酒',     kana:'にほんしゅ', en:'sake',                  price:700, foodImg:'drink-sake.webp' },
              { kanji:'お茶',       kana:'おちゃ',     en:'green tea (free)',     price:0,   foodImg:'drink-ocha.webp' },
            ]
          },
        ]
      },

      // ── Omakase (おまかせ) — single-restaurant hub ──────────────
      { id:'omakase', titleJa:'おまかせ', titleEn:'Omakase', glyph:'板', primaryLevel:'N4',
        isCategoryHub:true, randomCategory:'omakase',
        pages: [
          {
            id:'vocab', type:'cheatsheet',
            title:'おまかせ', subtitle:"Words at a chef's-choice counter",
            imageSlotId:'sheet-omakase-vocab',
            // Each item carries a `spot:{x,y}` (% of the image) so the
            // renderer can draw an interactive hotspot over the painted
            // number, linking image ↔ vocab. `note` adds cultural context
            // shown on hover.
            items: [
              { num:1,  kanji:'おまかせ',   kana:'おまかせ',   romaji:'omakase',     en:"chef's choice (\"I'll leave it to you\")",
                spot:{ x:50, y:58 }, note:'Sit, eat what the chef serves. No menu, no choices — the standard order at a sushi counter.' },
              { num:2,  kanji:'コース',     kana:'こーす',     romaji:'kōsu',        en:'course',
                spot:{ x:28, y:55 }, note:'From French "cours" via English. A set meal of 3–7 dishes served in sequence.' },
              { num:3,  kanji:'一品',       kana:'いっぴん',   romaji:'ippin',       en:'single dish',
                spot:{ x:80, y:62 }, note:'À la carte — a signature dish ordered on its own, separate from any course.' },
              { num:4,  kanji:'カウンター', kana:'かうんたー', romaji:'kauntā',      en:'counter seat',
                spot:{ x:24, y:78 }, note:'The chef-facing bar. The best omakase seats — you watch the food being made.' },
              { num:5,  kanji:'職人',       kana:'しょくにん', romaji:'shokunin',    en:'artisan / craftsman',
                spot:{ x:50, y:30 }, note:'Years of training, deep specialization. Closer to "master craftsman" than "cook."' },
              { num:6,  kanji:'旬',         kana:'しゅん',     romaji:'shun',        en:'in season',
                spot:{ x:58, y:50 }, note:'Peak season for an ingredient. The chef\'s calendar — what arrives daily drives the menu.' },
              { num:7,  kanji:'食材',       kana:'しょくざい', romaji:'shokuzai',    en:'ingredient',
                spot:{ x:76, y:48 }, note:'Raw materials before cooking. At this level, sourcing matters as much as technique.' },
              { num:8,  kanji:'器',         kana:'うつわ',     romaji:'utsuwa',      en:'vessel / bowl',
                spot:{ x:40, y:75 }, note:'The vessel is part of the meal. Each course gets a pot, plate, or bowl chosen for it specifically.' },
              { num:9,  kanji:'盛り付け',   kana:'もりつけ',   romaji:'moritsuke',   en:'plating / presentation',
                spot:{ x:58, y:78 }, note:'How a chef arranges food on the plate. A serious art — sometimes weeks of practice for a single composition.' },
              { num:10, kanji:'懐石',       kana:'かいせき',   romaji:'kaiseki',     en:'kaiseki (formal multi-course)',
                spot:{ x:75, y:76 }, note:'The most formal multi-course meal. Originated with tea ceremony — austere, seasonal, deeply traditional.' },
            ]
          },
          {
            id:'intro', type:'explanation',
            title:'おまかせについて', subtitleEn:'About omakase dining',
            heroImageSrc:'images/covers/omakase.webp',
            sections: [
              { ja:'「おまかせ」は「シェフに任せる」という意味。メニューを選ばず、職人さんに今日のおすすめを全部任せるスタイル。',
                en:"Omakase literally means \"I'll leave it to you.\" You skip the menu entirely and trust the itamae or chef to serve their best for the day." },
              { ja:'材料は毎日変わる。旬の食材を最高の状態で出すのが板前の腕の見せ所。同じ店でも、季節によってまったく違うものが出てくる。',
                en:"Ingredients change daily. Surfacing seasonal (shun) ingredients at their peak is the chef's craft. Visit the same shop in spring and winter — the meal is unrecognizable." },
              { ja:'値段は5,000円から数万円。高い理由は食材だけじゃなく、職人の技と器・盛り付けの美しさにも。静かに、目で楽しんで、感謝の気持ちで食べる。',
                en:"Prices range from ¥5,000 to tens of thousands. The cost isn't just the ingredients — it's the chef's skill, the vessels, the plating. Eat quietly, look closely, and show appreciation." },
            ]
          },
          {
            id:'menu', type:'menu-reference',
            title:'おまかせのメニュー', subtitleEn:"What you might see on a chef's course",
            // The 5 omakase courses keep their existing illustrated SVG
            // covers (those read at-a-glance as "the whole course" — a
            // photo would only show one piece). Individual nigiri photos
            // belong in the FOOD_GALLERY sushi section. Drinks below use
            // the new PNG photographs the user just added.
            items: [
              { kanji:'おまかせ五貫',       kana:'おまかせごかん',         en:'classic 5-piece nigiri',  price:5000, foodImg:'omakase-classic-five.webp' },
              { kanji:'おまかせプレミアム', kana:'おまかせぷれみあむ',     en:'premium 5-piece',         price:9000, foodImg:'omakase-premium-five.webp' },
              { kanji:'おまかせ刺身',       kana:'おまかせさしみ',         en:'sashimi assortment',      price:5500, foodImg:'dish-sashimi-platter.webp' },
              { kanji:'おまかせ天ぷら',     kana:'おまかせてんぷら',       en:'tempura course',          price:6500, foodImg:'omakase-tempura.webp' },
              { kanji:'おまかせ懐石',       kana:'おまかせかいせき',       en:'kaiseki tasting',         price:12000, foodImg:'omakase-kaiseki.webp' },
              { kanji:'日本酒',             kana:'にほんしゅ',             en:'sake',                    price:1000, foodImg:'drink-sake.webp' },
              { kanji:'白ワイン',           kana:'しろわいん',             en:'white wine',              price:1200, foodImg:'drink-wine-white.webp' },
              { kanji:'お茶',               kana:'おちゃ',                 en:'green tea',               price:0,    foodImg:'drink-ocha.webp' },
            ]
          },
        ]
      },

      // ── Izakaya (居酒屋) — single-restaurant hub ────────────────
      { id:'izakaya', titleJa:'いざかや', titleEn:'Izakaya', glyph:'串', primaryLevel:'N5',
        isCategoryHub:true, randomCategory:'izakaya',
        pages: [
          {
            id:'vocab', type:'cheatsheet',
            title:'居酒屋', subtitle:'Words at a Japanese pub',
            imageSlotId:'sheet-izakaya-vocab',
            items: [
              { num:1,  kanji:'居酒屋',     kana:'いざかや',   en:'Japanese pub' },
              { num:2,  kanji:'生ビール',   kana:'なまびーる', en:'draft beer' },
              { num:3,  kanji:'お通し',     kana:'おとおし',   en:'small starter (auto-served, charged)' },
              { num:4,  kanji:'枝豆',       kana:'えだまめ',   en:'edamame' },
              { num:5,  kanji:'唐揚げ',     kana:'からあげ',   en:'fried chicken' },
              { num:6,  kanji:'串',         kana:'くし',       en:'skewer' },
              { num:7,  kanji:'刺身',       kana:'さしみ',     en:'sashimi platter' },
              { num:8,  kanji:'お酒',       kana:'おさけ',     en:'alcohol (generic)' },
              { num:9,  kanji:'乾杯',       kana:'かんぱい',   en:'cheers!' },
              { num:10, kanji:'おしぼり',   kana:'おしぼり',   en:'wet hand towel' },
            ]
          },
          {
            id:'intro', type:'explanation',
            title:'居酒屋について', subtitleEn:'About izakaya',
            heroImageSrc:'images/covers/izakaya.webp',
            sections: [
              { ja:'居酒屋は日本のパブ。飲みながら少しずつ食べる、複数人でシェアするスタイル。「とりあえず生で」がほぼ全ての席の始まりの言葉。',
                en:"An izakaya is a Japanese pub. The model is small plates shared between friends while drinking. \"Toriaezu nama de\" (\"a draft to start with\") is the near-universal opening line." },
              { ja:'入ると、頼んでないのに「お通し」という小さな前菜が出る。これは席料みたいなもので、300〜500円ぐらい。断れないので、文化として受け取る。',
                en:"Right after you sit, a small starter called otōshi arrives without ordering — effectively a cover charge of 300-500 yen. You can't decline it; it's part of the cultural contract." },
              { ja:'メニューは焼き鳥、刺身、枝豆、唐揚げなどの小皿料理が中心。「シェアして食べる」が前提なので、何種類か頼んで皆で取り分ける。',
                en:"The menu is small-plate territory: yakitori, sashimi, edamame, karaage, simmered things, pickles. Sharing is assumed — order four or five things and pass them around." },
            ]
          },
          {
            id:'menu', type:'menu-reference',
            title:'居酒屋のメニュー', subtitleEn:'What you might see at an izakaya',
            // FOOD rows get the new photographic PNGs; DRINK rows stay
            // on their existing SVG covers per the food-vocab convention
            // ("only the food, not the drinks"). Sake/beer/highball
            // continue to read as flat illustrated icons against the
            // photographed dishes — a deliberate contrast.
            items: [
              { kanji:'生ビール',     kana:'なまびーる', en:'draft beer',          price:500, foodImg:'drink-beer.webp' },
              { kanji:'ハイボール',   kana:'はいぼーる', en:'highball',            price:480, foodImg:'drink-highball.webp' },
              { kanji:'日本酒',       kana:'にほんしゅ', en:'sake',                price:600, foodImg:'drink-sake.webp' },
              // ── Yakitori (skewer) menu — the izakaya core. Pulls from
              // FOOD_GALLERY.yakitori so each shows up in the visual
              // header above grouped under "焼き鳥 · Yakitori".
              { kanji:'もも',         kana:'もも',       en:'momo — chicken thigh',     price:280, foodImg:'yakitori-momo.webp' },
              { kanji:'ねぎま',       kana:'ねぎま',     en:'negima — thigh + leek',    price:300, foodImg:'yakitori-negima.webp' },
              { kanji:'皮',           kana:'かわ',       en:'kawa — crispy skin',       price:240, foodImg:'yakitori-kawa.webp' },
              { kanji:'ささみ',       kana:'ささみ',     en:'sasami — tenderloin',      price:280, foodImg:'yakitori-sasami.webp' },
              { kanji:'手羽先',       kana:'てばさき',   en:'tebasaki — chicken wings', price:420, foodImg:'yakitori-tebasaki.webp' },
              { kanji:'つくね',       kana:'つくね',     en:'tsukune — chicken meatball', price:320, foodImg:'yakitori-tsukune.webp' },
              // ── Dumplings (餃子) — three gyoza forms + shumai. Pulls
              // from FOOD_GALLERY.dumplings.
              { kanji:'焼き餃子',     kana:'やきぎょうざ', en:'yaki-gyoza (pan-fried)',  price:520, foodImg:'dish-gyoza.webp' },
              { kanji:'水餃子',       kana:'すいぎょうざ', en:'sui-gyoza (boiled)',      price:540, foodImg:'dumpling-gyoza-sui.webp' },
              { kanji:'揚げ餃子',     kana:'あげぎょうざ', en:'age-gyoza (deep-fried)',  price:560, foodImg:'dumpling-gyoza-age.webp' },
              { kanji:'焼売',         kana:'しゅうまい',   en:'shumai — open-top steamed', price:480, foodImg:'dumpling-shumai.webp' },
              // ── Other yōshoku / izakaya staples. Tonkatsu and tempura
              // come from FOOD_GALLERY.other; the rest are izakaya-original.
              { kanji:'枝豆',         kana:'えだまめ',   en:'edamame',             price:400, foodImg:'dish-edamame.webp' },
              { kanji:'唐揚げ',       kana:'からあげ',   en:'karaage (Japanese fried chicken)', price:700, foodImg:'dish-karaage.webp' },
              { kanji:'とんかつ',     kana:'とんかつ',   en:'tonkatsu (fried pork cutlet)',     price:980, foodImg:'dish-tonkatsu.webp' },
              { kanji:'天ぷら',       kana:'てんぷら',   en:'tempura (assorted)',  price:880, foodImg:'dish-tempura.webp' },
              { kanji:'刺身盛り合わせ', kana:'さしみもりあわせ', en:'sashimi platter', price:1200, foodImg:'dish-sashimi-platter.webp' },
              { kanji:'冷奴',         kana:'ひややっこ', en:'cold tofu',           price:380, foodImg:'dish-hiyayakko.webp' },
              { kanji:'お新香盛り',   kana:'おしんこもり', en:'pickle assortment', price:450, foodImg:'dish-oshinko.webp' },
            ]
          },
        ]
      },

      // ── Ramen (ラーメン) — single-restaurant hub ────────────────
      { id:'ramen-ya', titleJa:'ラーメン', titleEn:'Ramen', glyph:'麺', primaryLevel:'N5',
        isCategoryHub:true, randomCategory:'ramen',
        pages: [
          {
            id:'vocab', type:'cheatsheet',
            title:'ラーメン', subtitle:'Words at a ramen shop',
            imageSlotId:'sheet-ramen-vocab',
            items: [
              { num:1,  kanji:'ラーメン',     kana:'らーめん',     en:'ramen' },
              { num:2,  kanji:'麺',           kana:'めん',         en:'noodles' },
              { num:3,  kanji:'スープ',       kana:'すーぷ',       en:'broth' },
              { num:4,  kanji:'醤油',         kana:'しょうゆ',     en:'soy sauce (broth)' },
              { num:5,  kanji:'味噌',         kana:'みそ',         en:'miso (broth)' },
              { num:6,  kanji:'塩',           kana:'しお',         en:'salt (broth)' },
              { num:7,  kanji:'豚骨',         kana:'とんこつ',     en:'pork bone (broth)' },
              { num:8,  kanji:'チャーシュー', kana:'ちゃーしゅー', en:'braised pork slice' },
              { num:9,  kanji:'メンマ',       kana:'めんま',       en:'bamboo shoots' },
              { num:10, kanji:'替え玉',       kana:'かえだま',     en:'noodle refill (tonkotsu shops)' },
            ]
          },
          {
            id:'intro', type:'explanation',
            title:'ラーメンについて', subtitleEn:'About ramen',
            heroImageSrc:'images/covers/ramen.webp',
            sections: [
              { ja:'ラーメンは元々中国から来た料理。1910年に東京・浅草の「来々軒」が日本風に出して以来、地域ごとに進化した日本食。',
                en:'Ramen originally came from China. Since 1910 — when Tokyo\'s "Rairaiken" first served it in a Japanese style — it has evolved into a regional Japanese cuisine all its own.' },
              { ja:'スープは大きく4種類: 醤油（東京・関東）、味噌（札幌）、塩（函館）、豚骨（博多）。担々麺・つけ麺などのバリエーションも多い。',
                en:'Four main broth styles: shōyu (soy — Tokyo/Kantō), miso (Sapporo), shio (salt — Hakodate), tonkotsu (pork bone — Hakata). Variations like tantanmen and tsukemen are everywhere too.' },
              { ja:'食べ方: 熱いうちにすするのが正解。音を立てて吸って、麺と空気を一緒に口に入れる。スープも全部飲んでいいけど、塩分多めなので注意。',
                en:'Eat it hot. Slurping is correct — pulling air through the noodles cools and aerates them, and it\'s how the locals do it. You can drink the broth too, but it\'s salt-heavy, so go easy.' },
            ]
          },
          {
            id:'menu', type:'menu-reference',
            title:'ラーメン屋のメニュー', subtitleEn:'What you might see at a ramen shop',
            items: [
              { kanji:'塩ラーメン',     kana:'しおらーめん',     en:'shio (salt) ramen',       price:850,  foodImg:'ramen-shio.webp' },
              { kanji:'醤油ラーメン',   kana:'しょうゆらーめん', en:'shōyu (soy) ramen',       price:900,  foodImg:'ramen-shoyu.webp' },
              { kanji:'味噌ラーメン',   kana:'みそらーめん',     en:'miso ramen',              price:950,  foodImg:'ramen-miso.webp' },
              { kanji:'豚骨ラーメン',   kana:'とんこつらーめん', en:'tonkotsu ramen',          price:1000, foodImg:'ramen-tonkotsu.webp' },
              { kanji:'担々麺',         kana:'たんたんめん',     en:'tantanmen (spicy sesame)', price:1050, foodImg:'ramen-tantanmen.webp' },
              { kanji:'つけ麺',         kana:'つけめん',         en:'tsukemen (dipping)',       price:1100, foodImg:'ramen-tsukemen.webp' },
              { kanji:'焼き餃子',       kana:'やきぎょうざ',     en:'pan-fried gyoza',          price:500,  foodImg:'dish-gyoza.webp' },
              { kanji:'チャーシュー丼', kana:'チャーシューどん', en:'pork rice bowl',           price:600 },
              { kanji:'生ビール',       kana:'なまびーる',       en:'draft beer',               price:550,  foodImg:'drink-beer.webp' },
              // The same ocha photograph that appears on the omakase
              // and izakaya menus — green tea is the universal free
              // drink at any Japanese restaurant.
              { kanji:'お茶',           kana:'おちゃ',           en:'green tea',                price:0,    foodImg:'drink-ocha.webp' },
            ]
          },
        ]
      },

      // ── Konbini (コンビニ) — 4-page hub ─────────────────────────
      // Two cheatsheets (the aisles + the counter), one explanation
      // (the cultural role of the konbini in Japan), one menu-reference
      // (typical prices on the items learners would actually buy). The
      // two cheatsheets each carry their own illustrated panel — the
      // first an aisle-wide view of products on shelves, the second a
      // close-up of the register counter. Spot coords are approximate;
      // the renderer will overlay numbered hotspots at the marked %
      // positions and the user can tighten them after the images
      // arrive.
      { id:'konbini', titleJa:'コンビニ', titleEn:'Conbini', glyph:'便', primaryLevel:'N5',
        isCategoryHub:true, randomCategory:'konbini',
        pages: [
          // ── Page 1 — Inside the konbini (the aisles + cooler) ─────
          // A wide illustrated panel of the konbini interior with 10
          // numbered hotspots. Mostly product nouns the learner sees
          // through the door: prepared food cases, drink cooler,
          // snack aisle, freezer, magazine rack.
          {
            id:'aisles', type:'cheatsheet',
            title:'コンビニの中', subtitle:'Inside the konbini — the aisles and the cooler',
            // Renderer probes images/vocab/<book.id>-<imageSlotId>.webp →
            // images/vocab/konbini-sheet-aisles.webp
            imageSlotId:'sheet-aisles',
            // Spot coords tightened against the rendered artwork — the
            // store layout reads roughly: コンビニ sign across the top;
            // left wall has the bento + onigiri + sandwich cases stacked
            // L→R; mid-back has the magazine rack and a small drink-end
            // cap; right wall is the snack aisle (front) and bread/
            // pastry shelves; back-right is the standing drink cooler;
            // front-left is the low ice-cream freezer.
            items: [
              { num:1,  kanji:'コンビニ',     kana:'こんびに',     romaji:'konbini',     en:'convenience store',
                spot:{ x:32, y:6 },  note:'Shortened from "convenience store" (コンビニエンスストア). 7-Eleven, ローソン (Lawson), ファミマ (Family Mart) are the big three. ~55,000 locations nationwide, most open 24/7.' },
              { num:2,  kanji:'お弁当',       kana:'おべんとう',   romaji:'obentou',     en:'bento box meal',
                spot:{ x:14, y:48 }, note:'Sits in the heated case near the register. Konbini bento is famously good — a full meal (rice, protein, two or three sides) for ¥500-700. The clerk asks 「温めますか？」 (warm it up?) at checkout.' },
              { num:3,  kanji:'おにぎり',     kana:'おにぎり',     romaji:'onigiri',     en:'rice ball',
                spot:{ x:25, y:42 }, note:'Triangular rice ball in the chilled case. Classic fillings: 鮭 (salmon), 梅 (ume plum), ツナマヨ (tuna-mayo), 昆布 (kombu). 7-Eleven sells over 2 billion onigiri a year.' },
              { num:4,  kanji:'サンドイッチ', kana:'さんどいっち', romaji:'sandoicchi',  en:'sandwich (crustless)',
                spot:{ x:35, y:50 }, note:'Japanese konbini sandwiches are crustless, triangular, and sealed in plastic. Iconic fillings: 卵 (egg-salad), ハム (ham), ツナ (tuna), フルーツサンド (fruit sando — whipped cream + fruit).' },
              { num:5,  kanji:'お菓子',       kana:'おかし',       romaji:'okashi',      en:'snacks / sweets aisle',
                spot:{ x:74, y:55 }, note:'The snack aisle. Pocky, KitKat (Japan-exclusive flavors), potato chips (Calbee, Koikeya), and seasonal limited editions rotating every few weeks.' },
              { num:6,  kanji:'パン',         kana:'ぱん',         romaji:'pan',         en:'bread / pastry',
                spot:{ x:90, y:62 }, note:'Japanese konbini bread — soft, sweet, often filled. メロンパン (melon pan), あんパン (anko-filled), カレーパン (curry-filled). Always near the rice products.' },
              { num:7,  kanji:'ジュース',     kana:'じゅーす',     romaji:'juusu',       en:'juice / soft drink',
                spot:{ x:84, y:25 }, note:'In the standing drink cooler at the back wall. Includes juice, sodas, sports drinks. Cans are 100-160円, plastic bottles 130-180円.' },
              { num:8,  kanji:'お茶',         kana:'おちゃ',       romaji:'ocha',        en:'bottled tea',
                spot:{ x:70, y:25 }, note:'Bottled green tea — 伊右衛門 (Iyemon), おーいお茶 (Oi Ocha), 綾鷹 (Ayataka). Always cold in summer, warm in winter (look for the red 「あったかい」 sticker).' },
              { num:9,  kanji:'アイス',       kana:'あいす',       romaji:'aisu',        en:'ice cream',
                spot:{ x:16, y:78 }, note:'The freezer case near the entrance. Gari-Gari-kun (the iconic blue popsicle), Pino (mini-cones), Häagen-Dazs, ハーゲンダッツ 抹茶 (matcha — Japan-only).' },
              { num:10, kanji:'雑誌',         kana:'ざっし',       romaji:'zasshi',      en:'magazines',
                spot:{ x:53, y:32 }, note:'Magazine rack near the front window — manga, fashion, news weeklies. Customers stand and read (立ち読み tachiyomi) without buying; konbini have mostly tolerated this since the 1980s.' },
            ]
          },
          // ── Page 2 — At the counter (the register + services) ────
          // Close-up of the register area. Less product, more action —
          // the verbs and the service vocabulary the learner needs
          // when actually checking out.
          {
            id:'register', type:'cheatsheet',
            title:'レジで', subtitle:'At the counter — the register and the services',
            // Renderer probes images/vocab/konbini-sheet-register.webp
            imageSlotId:'sheet-register',
            // Spot coords tightened against the rendered artwork. The
            // composition: customer back-view foreground-left; clerk
            // mid-frame behind the counter; register + scanner on the
            // counter line; microwave on a shelf behind the clerk;
            // plastic bag + chopstick dispenser + receipt printer on
            // the right end of the counter; ATM in the right corner.
            items: [
              { num:1,  kanji:'レジ',         kana:'れじ',         romaji:'reji',        en:'register / checkout',
                spot:{ x:32, y:38 }, note:'From English "register." The single counter at the front of every konbini. In rush hours one clerk runs it; quiet hours sometimes self-checkout (セルフレジ).' },
              { num:2,  kanji:'店員',         kana:'てんいん',     romaji:'ten\'in',     en:'store clerk',
                spot:{ x:55, y:30 }, note:'いらっしゃいませ (irasshaimase, "welcome") greets every customer on entry. Often a part-time worker (バイト) or a foreign-trainee. Famously polite even at 3am.' },
              { num:3,  kanji:'お客',         kana:'おきゃく',     romaji:'okyaku',      en:'customer',
                spot:{ x:13, y:50 }, note:'The honorific お+客. Used by clerks addressing the buyer ("お客様"). The customer-side word is just 自分 (jibun, "myself") — never "okyaku" about oneself.' },
              { num:4,  kanji:'バーコード',   kana:'ばーこーど',   romaji:'baakoodo',    en:'barcode',
                spot:{ x:48, y:48 }, note:'Beep-beep ピッピッ. From English. Every product scanned at the konbini register; the price flashes on the small customer-facing display.' },
              { num:5,  kanji:'温める',       kana:'あたためる',   romaji:'atatameru',   en:'warm up (microwave)',
                spot:{ x:42, y:15 }, note:'The clerk asks 「温めますか？」 (atatamemasu ka? = "warm it up?") when scanning a bento or pasta. Yes = the microwave behind the counter (秒数 30s-1m). Always offered, never automatic.' },
              { num:6,  kanji:'お箸',         kana:'おはし',       romaji:'ohashi',      en:'chopsticks',
                spot:{ x:83, y:42 }, note:'「お箸はおつけしますか？」 (do you need chopsticks?). The clerk asks; you say はい (yes, please) or いりません (no thanks). Comes with a tiny wet napkin.' },
              { num:7,  kanji:'袋',           kana:'ふくろ',       romaji:'fukuro',      en:'bag',
                spot:{ x:67, y:35 }, note:'Since July 2020 plastic bags are paid (3-5円). The clerk asks 「袋はいりますか？」 (do you need a bag?). Saying 「袋いりません」 (no bag) saves a few yen and a small carbon receipt.' },
              { num:8,  kanji:'支払い',       kana:'しはらい',     romaji:'shiharai',    en:'payment',
                spot:{ x:46, y:80 }, note:'Cash (現金), card, PayPay, Suica, iD, 楽天ペイ — every konbini takes everything. The clerk asks 「お支払いは？」 (how are you paying?). Just hold up the method you want.' },
              { num:9,  kanji:'レシート',     kana:'れしーと',     romaji:'reshiito',    en:'receipt',
                spot:{ x:67, y:82 }, note:'From English. Always offered; you can refuse with 「レシートいりません」. Carries a thin paper QR for the chain\'s loyalty program (T-Point, Ponta, dPoint).' },
              { num:10, kanji:'ATM',         kana:'えーてぃーえむ', romaji:'ATM',         en:'ATM machine',
                spot:{ x:92, y:18 }, note:'In the corner of every konbini. 7-Eleven\'s セブン銀行 ATM is the most foreign-card-friendly in Japan (works with most overseas Visa/Mastercard for cash withdrawal in JPY, 24/7, fee 110-220円).' },
            ]
          },
          // ── Page 3 — Explanation (the cultural role) ──────────────
          {
            id:'intro', type:'explanation',
            title:'コンビニについて', subtitleEn:'About the konbini',
            heroImageSrc:'images/covers/konbini.webp',
            sections: [
              { ja:'コンビニは「コンビニエンスストア」の略 — 24時間、年中無休、半径500メートル以内に最低一つはある日本の生活インフラ。セブンイレブン、ローソン、ファミマの三社が全国約55,000店を独占する。',
                en:'"Konbini" is short for "convenience store" — 24-hour, 365-day, the kind of place a typical Japanese city block has at least one of every 500 meters. The big three — 7-Eleven, Lawson, FamilyMart — dominate ~55,000 stores nationwide.' },
              { ja:'食べ物の質は世界的に有名。お弁当、おにぎり、サンドイッチ、パン — どれもまともなレストランに匹敵する。冬は肉まん、おでん、ホット飲料。夏はかき氷、冷たい麺、アイス。新商品は2週ごとに入れ替わる。',
                en:'The food is internationally famous. Bento, onigiri, sandwiches, pastries — all of restaurant-grade quality at street-snack prices. Winter brings nikuman, oden, hot drinks; summer brings shaved ice, cold noodles, ice cream. The product mix rotates every two weeks.' },
              { ja:'食べ物以外でもなんでもできる場所：ATMでお金を下ろす、コピー機で印刷、宅配便を出す、税金や公共料金を払う、チケットを買う、トイレを借りる。「コンビニで全部できる」は日本生活の合言葉。',
                en:'Beyond food, the konbini is a one-stop civic counter: withdraw cash at the ATM, photocopy at the multi-function machine, ship a package, pay taxes and utility bills, buy concert tickets, use the restroom. "You can do everything at the konbini" is a quiet pillar of Japanese daily life.' },
            ]
          },
          // ── Page 4 — Menu reference (the full konbini shelf) ──────
          // Pulls every item from KONBINI_SECTIONS — the same set the
          // Eating Out scene flow uses for the konbini experience.
          // Every row resolves to a real .webp in images/konbini/ via
          // konbiniImg (the resolver's fourth lookup field).
          //
          // Note on the misc shelf — these are NON-FOOD items (cigarettes,
          // lighter, batteries, umbrella, phone charger, band-aids). They
          // were dropped from a previous version of this menu because no
          // images existed; with artwork now in place they're restored
          // because they're a real and culturally distinct part of the
          // konbini experience (the konbini is a one-stop civic counter,
          // not just a food store — per the intro page).
          {
            id:'menu', type:'menu-reference',
            title:'コンビニの棚', subtitleEn:"What's on the konbini shelves",
            items: [
              // ── おにぎり (5) ──────────────────────────────────────
              { kanji:'ツナマヨおにぎり', kana:'つなまよおにぎり',   en:'tuna mayo (best-seller)', price:160, konbiniImg:'onigiri-tunamayo.webp' },
              { kanji:'鮭おにぎり',       kana:'しゃけおにぎり',     en:'grilled salmon',          price:170, konbiniImg:'onigiri-sake.webp' },
              { kanji:'明太子おにぎり',   kana:'めんたいこおにぎり', en:'spicy pollack roe',       price:190, konbiniImg:'onigiri-mentaiko.webp' },
              { kanji:'梅おにぎり',       kana:'うめおにぎり',       en:'pickled plum',            price:130, konbiniImg:'onigiri-ume.webp' },
              { kanji:'昆布おにぎり',     kana:'こんぶおにぎり',     en:'simmered kelp',           price:140, konbiniImg:'onigiri-kombu.webp' },
              // ── ホットフード (5) ────────────────────────────────
              { kanji:'肉まん',           kana:'にくまん',           en:'steamed pork bun',        price:150, konbiniImg:'hot-nikuman.webp' },
              { kanji:'からあげ',         kana:'からあげ',           en:'fried chicken bites',     price:200, konbiniImg:'hot-karaage.webp' },
              { kanji:'おでん',           kana:'おでん',             en:'oden (simmered stew)',    price:220, konbiniImg:'hot-oden.webp' },
              { kanji:'フランク',         kana:'ふらんく',           en:'frankfurter on a stick',  price:180, konbiniImg:'hot-frankfurt.webp' },
              { kanji:'コロッケ',         kana:'ころっけ',           en:'potato croquette',        price:130, konbiniImg:'hot-korokke.webp' },
              // ── 飲み物 (6) ──────────────────────────────────────
              { kanji:'お茶',             kana:'おちゃ',             en:'green tea (bottle)',      price:150, konbiniImg:'drink-ocha.webp' },
              { kanji:'コーヒー',         kana:'こーひー',           en:'canned coffee',           price:130, konbiniImg:'drink-coffee.webp' },
              { kanji:'お水',             kana:'おみず',             en:'bottled water',           price:110, konbiniImg:'drink-water.webp' },
              { kanji:'ポカリ',           kana:'ぽかり',             en:'Pocari Sweat (sports)',   price:160, konbiniImg:'drink-pocari.webp' },
              { kanji:'オレンジ',         kana:'おれんじじゅーす',   en:'orange juice',            price:170, konbiniImg:'drink-juice.webp' },
              { kanji:'ビール',           kana:'びーる',             en:'beer (can)',              price:280, konbiniImg:'drink-beer.webp' },
              // ── お菓子 (6) ──────────────────────────────────────
              { kanji:'ポッキー',         kana:'ぽっきー',           en:'Pocky',                   price:160, konbiniImg:'sweet-pocky.webp' },
              { kanji:'ハーゲンダッツ',   kana:'はーげんだっつ',     en:'Häagen-Dazs (ice cream)', price:340, konbiniImg:'sweet-haagen.webp' },
              { kanji:'プリン',           kana:'ぷりん',             en:'caramel pudding',         price:180, konbiniImg:'sweet-purin.webp' },
              { kanji:'大福',             kana:'だいふく',           en:'mochi with red bean',     price:150, konbiniImg:'sweet-daifuku.webp' },
              { kanji:'チョコ',           kana:'ちょこ',             en:'chocolate bar',           price:140, konbiniImg:'sweet-choco.webp' },
              { kanji:'グミ',             kana:'ぐみ',               en:'gummy candy',             price:120, konbiniImg:'sweet-gummy.webp' },
              // ── 雑貨 (6) — non-food, konbini-as-civic-counter ────
              { kanji:'タバコ',           kana:'たばこ',             en:'cigarettes',              price:600,  konbiniImg:'misc-tabako.webp' },
              { kanji:'ライター',         kana:'らいたー',           en:'lighter',                 price:100,  konbiniImg:'misc-lighter.webp' },
              { kanji:'電池',             kana:'でんち',             en:'AA batteries (4-pack)',   price:380,  konbiniImg:'misc-denchi.webp' },
              { kanji:'傘',               kana:'かさ',               en:'plastic umbrella',        price:500,  konbiniImg:'misc-kasa.webp' },
              { kanji:'充電器',           kana:'じゅうでんき',       en:'phone charger',           price:1200, konbiniImg:'misc-charger.webp' },
              { kanji:'絆創膏',           kana:'ばんそうこう',       en:'band-aids',               price:280,  konbiniImg:'misc-bandaid.webp' },
            ]
          },
        ]
      },
      // Fast Food hub — single book that holds McDonald's + KFC as
      // selectable pages. Custom renderer (isFastFoodHub) shows the
      // chains as cards at the top, an "experience" launch button per
      // page, then the standard 2-col cheatsheet. Each page carries its
      // own `restaurantId` so the button knows which scene flow to load.
      // titleJa uses '\n' to split ファスト | フード across two lines in the
      // sidebar card — keeps FU DO from getting broken in half by the
      // narrow column width.
      { id:'fast-food', titleJa:'ファスト\nフード', titleEn:'Fast Food', glyph:'速', primaryLevel:'N5', isCategoryHub:true,
        pages: [
          {
            id:'mcdonalds',
            type:'cheatsheet',
            title:'マック',
            subtitle:'Burger anatomy + counter-service words',
            imageSlotId:'sheet-mcdonalds-1',
            // File the user dropped at images/vocab/. The image-slot
            // picks this up as a fallback when no drop has been made
            // in the browser yet (IndexedDB empty for this slot).
            imageSrc:'images/vocab/mcd-sheet-mcd-1.webp',
            restaurantId:'mcdonalds',
            chainName:{ ja:'マクドナルド', en:"McDonald's" },
            coverImage:'mcdonalds',
            items: [
              { num:1,  kanji:'ハンバーガー', kana:'はんばーがー',   en:'hamburger' },
              { num:2,  kanji:'パン',         kana:'ぱん',           en:'bun / bread' },
              { num:3,  kanji:'パティ',       kana:'ぱてぃ',         en:'patty (beef)' },
              { num:4,  kanji:'チーズ',       kana:'ちーず',         en:'cheese' },
              { num:5,  kanji:'レタス',       kana:'れたす',         en:'lettuce' },
              { num:6,  kanji:'ピクルス',     kana:'ぴくるす',       en:'pickles' },
              { num:7,  kanji:'ケチャップ',   kana:'けちゃっぷ',     en:'ketchup' },
              { num:8,  kanji:'シェイク',     kana:'しぇいく',       en:'shake' },
              { num:9,  kanji:'ストロー',     kana:'すとろー',       en:'straw' },
              { num:10, kanji:'トレー',       kana:'とれー',         en:'tray' },
            ]
          },
          // Matsuya — Japan's gyudon (beef-bowl) chain. Vocab-only
          // entry (no experience flow), so a single file at
          // images/vocab/matsuya.webp serves both the selector
          // thumbnail and the cheatsheet's big image via auto-resolve.
          {
            id:'matsuya',
            type:'cheatsheet',
            title:'松屋',
            subtitle:'Gyudon bowl + ticket-machine words',
            imageSlotId:'sheet-matsuya-1',
            chainName:{ ja:'松屋', en:'Matsuya' },
            items: [
              { num:1,  kanji:'牛丼',     kana:'ぎゅうどん',     en:'gyudon — beef bowl', furigana:'<ruby>牛丼<rt>ぎゅうどん</rt></ruby>' },
              { num:2,  kanji:'並盛',     kana:'なみもり',       en:'regular size', furigana:'<ruby>並盛<rt>なみもり</rt></ruby>' },
              { num:3,  kanji:'大盛',     kana:'おおもり',       en:'large size', furigana:'<ruby>大盛<rt>おおもり</rt></ruby>' },
              { num:4,  kanji:'牛肉',     kana:'ぎゅうにく',     en:'beef', furigana:'<ruby>牛肉<rt>ぎゅうにく</rt></ruby>' },
              { num:5,  kanji:'玉ねぎ',   kana:'たまねぎ',       en:'onion', furigana:'<ruby>玉<rt>たま</rt></ruby>ねぎ' },
              { num:6,  kanji:'紅生姜',   kana:'べにしょうが',   en:'red pickled ginger', furigana:'<ruby>紅生姜<rt>べにしょうが</rt></ruby>' },
              { num:7,  kanji:'半熟卵',   kana:'はんじゅくたまご', en:'soft-boiled egg', furigana:'<ruby>半熟卵<rt>はんじゅくたまご</rt></ruby>' },
              { num:8,  kanji:'味噌汁',   kana:'みそしる',       en:'miso soup', furigana:'<ruby>味噌汁<rt>みそしる</rt></ruby>' },
              { num:9,  kanji:'定食',     kana:'ていしょく',     en:'set meal (main + soup + rice)', furigana:'<ruby>定食<rt>ていしょく</rt></ruby>' },
              { num:10, kanji:'券売機',   kana:'けんばいき',     en:'meal-ticket vending machine', furigana:'<ruby>券売機<rt>けんばいき</rt></ruby>' },
            ]
          },
          {
            id:'kfc',
            type:'cheatsheet',
            title:'ケンタ',
            subtitle:'Chicken cuts + frying / size words',
            imageSlotId:'sheet-kfc-1',
            imageSrc:'images/vocab/kfc-sheet-kfc-1.webp',
            restaurantId:'kfc',
            chainName:{ ja:'ケンタッキー', en:'KFC' },
            coverImage:'kfc',
            items: [
              { num:1,  kanji:'チキン',   kana:'ちきん',     en:'chicken' },
              { num:2,  kanji:'もも',     kana:'もも',       en:'thigh (chicken cut)' },
              { num:3,  kanji:'むね',     kana:'むね',       en:'breast (chicken cut)' },
              { num:4,  kanji:'手羽',     kana:'てば',       en:'wing (chicken cut)' },
              { num:5,  kanji:'皮',       kana:'かわ',       en:'skin' },
              { num:6,  kanji:'衣',       kana:'ころも',     en:'breading / coating' },
              { num:7,  kanji:'揚げ物',   kana:'あげもの',   en:'fried food' },
              { num:8,  kanji:'ピース',   kana:'ぴーす',     en:'piece (1 piece, 2 piece…)' },
              { num:9,  kanji:'バーレル', kana:'ばーれる',   en:'barrel (the big bucket)' },
              { num:10, kanji:'辛い',     kana:'からい',     en:'spicy' },
            ]
          },
          // Ekibenya Matsuri — the famous ekiben shop inside Tokyo
          // Station. Vocab-only entry: single file at
          // images/vocab/ekibenya.webp covers both spots via
          // auto-resolve. No experience flow attached.
          {
            id:'ekibenya',
            type:'cheatsheet',
            title:'駅弁屋 祭',
            subtitle:'Station bento words for the bullet-train ride',
            imageSlotId:'sheet-ekibenya-1',
            chainName:{ ja:'駅弁屋 祭', en:'Ekibenya' },
            items: [
              { num:1,  kanji:'駅弁',       kana:'えきべん',     en:'ekiben — station bento', furigana:'<ruby>駅弁<rt>えきべん</rt></ruby>' },
              { num:2,  kanji:'弁当',       kana:'べんとう',     en:'boxed meal', furigana:'<ruby>弁当<rt>べんとう</rt></ruby>' },
              { num:3,  kanji:'ご飯',       kana:'ごはん',       en:'rice (cooked)', furigana:'ご<ruby>飯<rt>はん</rt></ruby>' },
              { num:4,  kanji:'おかず',     kana:'おかず',       en:'side dishes (non-rice items)' },
              { num:5,  kanji:'鮭',         kana:'しゃけ',       en:'salmon (most popular ekiben filling)', furigana:'<ruby>鮭<rt>しゃけ</rt></ruby>' },
              { num:6,  kanji:'梅干し',     kana:'うめぼし',     en:'pickled plum', furigana:'<ruby>梅干<rt>うめぼ</rt></ruby>し' },
              { num:7,  kanji:'海苔',       kana:'のり',         en:'nori — seaweed sheet', furigana:'<ruby>海苔<rt>のり</rt></ruby>' },
              { num:8,  kanji:'漬物',       kana:'つけもの',     en:'pickles (the small partitioned ones)', furigana:'<ruby>漬物<rt>つけもの</rt></ruby>' },
              { num:9,  kanji:'割り箸',     kana:'わりばし',     en:'disposable chopsticks (snap apart)', furigana:'<ruby>割<rt>わ</rt></ruby>り<ruby>箸<rt>ばし</rt></ruby>' },
              { num:10, kanji:'新幹線',     kana:'しんかんせん', en:'shinkansen — bullet train (where you eat it)', furigana:'<ruby>新幹線<rt>しんかんせん</rt></ruby>' },
            ]
          },
        ]
      },
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
  {
    id: 'internet',
    glyph: '網',
    titleJa: 'ネット',
    titleEn: 'Internet',
    pageTitleJa: 'ネット の ことば',
    pageTitleEn: 'Language for online life — sites & apps you use every day',
    books: [
      // Websites — browser-based services. Section header in the sidebar
      // groups these visually under "websites" via the `section` field.
      { id:'gmail',    titleJa:'ジーメール',   titleEn:'Gmail',    glyph:'郵', section:'websites',   primaryLevel:'N4', pages:[] },
      // Mobile apps — phone-first messaging and social tools.
      { id:'whatsapp', titleJa:'ワッツアップ', titleEn:'WhatsApp', glyph:'話', section:'mobile apps', primaryLevel:'N4', pages:[] },
    ],
  },
  {
    id: 'jougo',
    glyph: '畳',
    titleJa: 'じょうご',
    titleEn: 'Jougo',
    pageTitleJa: '畳語 — くりかえし',
    pageTitleEn: 'Reduplicated words — repeated for emphasis & texture',
    books: [
      {
        id: 'intro',
        titleJa: 'いんとろ',
        titleEn: 'Intro',
        glyph: '々',
        primaryLevel: 'N5',
        pages: [
          {
            id: 'jougo-explainer',
            type: 'explainer',
            title: '々 と 畳語',
            subtitle: 'The iteration mark and how Japanese repeats itself',
            bodyHTML: `
              <section class="jougo-section">
                <h3>A · What is 畳語 (jōgo)?</h3>
                <p><strong class="ja">畳語</strong> (<em>jōgo</em>) literally means "stacked words" — words formed by <em>reduplication</em>, the deliberate repeating of a kanji, a kana, or a whole word. The first character, <span class="glyph-inline">畳</span> (<em>tatamu</em>, "to fold / stack"), is the same one used for the woven mats on the floor of a Japanese room. The image is identical: layers laid on top of each other.</p>
                <figure class="jougo-cover">
                  <img src="images/covers/jougo.webp" alt="Jōgo cover — the layered tatami metaphor for stacked words" loading="lazy">
                </figure>
                <p>Languages around the world use repetition for emphasis — English "very very tired," "tiny tiny ant," child-speak "doggy doggy." Japanese formalised the same intuition into a productive grammatical device. Where English uses repetition <em>occasionally</em> for colour, Japanese uses it <em>structurally</em> — and it even has a dedicated written mark to make repeated kanji shorter on the page.</p>
                <p>Reduplication does one of four things in Japanese:</p>
                <ul>
                  <li><strong>Plurality</strong> — turns a singular noun into "many of them" (<span class="ja">人</span> "person" → <span class="ja">人々</span> "people").</li>
                  <li><strong>Cyclicity</strong> — turns a moment into a recurring pattern (<span class="ja">時</span> "time" → <span class="ja">時々</span> "sometimes / time after time").</li>
                  <li><strong>Intensification</strong> — boosts an adjective (<span class="ja">若い</span> "young" → <span class="ja">若々しい</span> "youthful-looking, full of youth").</li>
                  <li><strong>Texture</strong> — kana reduplication paints a sensation (<span class="ja">ぽよぽよ</span> "soft and squishy," <span class="ja">ちくちく</span> "prickly"). This branch is called <em>onomatopoeia</em> (擬音語/擬態語) and lives in its own book.</li>
                </ul>
              </section>

              <section class="jougo-section">
                <h3>B · The 々 mark (kasanenoma / odoriji / noma)</h3>
                <figure class="jougo-noma-figure">
                  <img src="images/vocabulary/々.webp" alt="Hand cupped behind ear — &lsquo;say it again&rsquo;, the gesture that the 々 mark performs in writing" loading="lazy">
                  <figcaption>「もう一度」— the hand cupped behind the ear asks for the previous sound again. The 々 mark does the same thing in writing: it says <em>repeat what just came before</em>.</figcaption>
                </figure>
                <p>The symbol <span class="glyph-inline">々</span> is the <em>kanji iteration mark</em>. It is not itself a kanji and has no reading of its own — it simply says <em>"repeat the previous kanji."</em> Several names exist for it:</p>
                <ul>
                  <li><span class="ja">同の字点</span> (<em>dō-no-jiten</em>) — "the same-character mark," its formal name.</li>
                  <li><span class="ja">踊り字</span> (<em>odoriji</em>) — "dancing mark," the everyday name.</li>
                  <li><span class="ja">ノマ</span> (<em>noma</em>) — colloquial, because the shape resembles the katakana ノ + マ.</li>
                </ul>
                <h4>Etymology</h4>
                <p>The mark is a cursive shorthand for <span class="ja">仝</span>, an archaic variant of <span class="ja">同</span> ("same"). Scribes copying manuscripts wrote <span class="ja">仝</span> in flowing strokes; the abbreviation eventually settled into the modern <span class="glyph-inline">々</span>. So <span class="ja">人々</span> is read as "person + same-as-the-previous" → <em>hitobito</em>.</p>
                <h4>Pronunciation &amp; rendaku</h4>
                <p>The repeated kanji usually keeps the same reading, but it very often triggers <em>rendaku</em> (sequential voicing) — an unvoiced first consonant becomes voiced:</p>
                <ul>
                  <li><span class="ja">人</span> <em>hito</em> + <span class="glyph-inline">々</span> → <span class="ja">人々</span> <em>hito<strong>b</strong>ito</em> (not <em>hitohito</em>)</li>
                  <li><span class="ja">時</span> <em>toki</em> + <span class="glyph-inline">々</span> → <span class="ja">時々</span> <em>toki<strong>d</strong>oki</em></li>
                  <li><span class="ja">国</span> <em>kuni</em> + <span class="glyph-inline">々</span> → <span class="ja">国々</span> <em>kuni<strong>g</strong>uni</em></li>
                  <li><span class="ja">山</span> <em>yama</em> + <span class="glyph-inline">々</span> → <span class="ja">山々</span> <em>yama<strong>y</strong>ama</em> (no rendaku — <em>y</em> stays)</li>
                </ul>
                <h4>Typing 々</h4>
                <p>Most IMEs accept any of these inputs to produce <span class="glyph-inline">々</span>: <code>onaji</code> ("same"), <code>noma</code>, <code>kurikaeshi</code> ("repetition"), or <code>dou</code>. On Mac and iOS you can also press-and-hold a kanji and pick the duplication mark from the suggestion bar.</p>
                <h4>When NOT to use 々</h4>
                <p>The mark only repeats <strong>kanji</strong>. Kana reduplication — <span class="ja">ちくちく</span>, <span class="ja">ぴょんぴょん</span>, <span class="ja">わくわく</span> — is always written out in full. You will not see <span class="ja">ちく々</span> in standard Japanese. (Old-fashioned hiragana <em>did</em> have its own iteration mark, <span class="glyph-inline">ゝ</span>, but it is essentially extinct outside calligraphy and family names like <span class="ja">いすゞ</span>.)</p>
              </section>

              <section class="jougo-section">
                <h3>C · Common 々 vocab, grouped by feel</h3>
                <p>The 々 mark shows up most often in a handful of semantic neighbourhoods. Here are the ones you will meet in everyday reading.</p>

                <h4>Plurality — "many of these"</h4>
                <div class="jougo-grid">
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="駅前には人々が忙しそうに歩いていた。" data-ex-en="People were walking busily in front of the station."><img class="jougo-tile-img" src="images/vocabulary/hitobito.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">人々</span><span class="jougo-tile-reading">hitobito</span><span class="jougo-tile-en">people</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="朝日に照らされた山々が金色に輝いていた。" data-ex-en="The mountains glowed gold in the morning sun."><img class="jougo-tile-img" src="images/vocabulary/yamayama.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">山々</span><span class="jougo-tile-reading">yamayama</span><span class="jougo-tile-en">mountains</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="秋になると、木々の葉が赤や黄色に染まる。" data-ex-en="When autumn comes, the leaves of the trees turn red and yellow."><img class="jougo-tile-img" src="images/vocabulary/kigi.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">木々</span><span class="jougo-tile-reading">kigi</span><span class="jougo-tile-en">trees</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="アジアの国々はそれぞれ独自の文化を持っている。" data-ex-en="The countries of Asia each have their own unique culture."><img class="jougo-tile-img" src="images/vocabulary/kuniguni.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">国々</span><span class="jougo-tile-reading">kuniguni</span><span class="jougo-tile-en">countries</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="我々は明日までに結論を出さなければならない。" data-ex-en="We must reach a conclusion by tomorrow."><img class="jougo-tile-img" src="images/vocabulary/warebare.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">我々</span><span class="jougo-tile-reading">wareware</span><span class="jougo-tile-en">we (formal)</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="引っ越しには諸々の費用がかかる。" data-ex-en="Moving involves all sorts of expenses."><img class="jougo-tile-img" src="images/vocabulary/moromoro.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">諸々</span><span class="jougo-tile-reading">moromoro</span><span class="jougo-tile-en">various things</span></div>
                </div>

                <h4>Time-cycling &amp; frequency</h4>
                <div class="jougo-grid">
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="私は時々一人で映画を見に行きます。" data-ex-en="I sometimes go to the movies by myself."><img class="jougo-tile-img" src="images/vocabulary/tokidoki.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">時々</span><span class="jougo-tile-reading">tokidoki</span><span class="jougo-tile-en">sometimes</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="春が近づくにつれて、段々暖かくなってきた。" data-ex-en="As spring approaches, it has gradually been getting warmer."><img class="jougo-tile-img" src="images/vocabulary/dandan.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">段々</span><span class="jougo-tile-reading">dandan</span><span class="jougo-tile-en">gradually</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="新しいアイデアが次々と浮かんできた。" data-ex-en="New ideas came to mind one after another."><img class="jougo-tile-img" src="images/vocabulary/tsugitsugi.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">次々</span><span class="jougo-tile-reading">tsugitsugi</span><span class="jougo-tile-en">one after another</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="練習を続ければ、益々上手になるよ。" data-ex-en="If you keep practicing, you'll get better and better."><img class="jougo-tile-img" src="images/vocabulary/masumasu.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">益々</span><span class="jougo-tile-reading">masumasu</span><span class="jougo-tile-en">more and more</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="体調は徐々に良くなっています。" data-ex-en="My condition is slowly getting better."><img class="jougo-tile-img" src="images/vocabulary/jojo.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">徐々</span><span class="jougo-tile-reading">jojo (ni)</span><span class="jougo-tile-en">slowly, gradually</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="観客が続々と会場に集まってきた。" data-ex-en="Audience members streamed into the venue in succession."><img class="jougo-tile-img" src="images/vocabulary/zokuzoku.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">続々</span><span class="jougo-tile-reading">zokuzoku</span><span class="jougo-tile-en">in succession</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="工事は着々と進んでいる。" data-ex-en="Construction is progressing steadily."><img class="jougo-tile-img" src="images/vocabulary/chakuchaku.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">着々</span><span class="jougo-tile-reading">chakuchaku</span><span class="jougo-tile-en">steadily</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="近々お会いできるのを楽しみにしています。" data-ex-en="I look forward to meeting you in the near future."><img class="jougo-tile-img" src="images/vocabulary/chikajika.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">近々</span><span class="jougo-tile-reading">chikajika</span><span class="jougo-tile-en">in the near future</span></div>
                </div>

                <h4>Intensification — 々しい adjectives</h4>
                <p>Adjective stems can repeat and take the <span class="ja">-しい</span> ending. The result is a richer, more textural version of the base: not just "young" but "youth-filled," not just "rough" but "wild and rough all over."</p>
                <div class="jougo-grid">
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="祖母は八十歳だが、とても若々しい。" data-ex-en="My grandmother is eighty, but she looks remarkably youthful."><img class="jougo-tile-img" src="images/vocabulary/wakawakashii.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">若々しい</span><span class="jougo-tile-reading">wakawakashii</span><span class="jougo-tile-en">youthful, full of youth</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="病み上がりの彼の声は弱々しかった。" data-ex-en="His voice sounded frail just after recovering from illness."><img class="jougo-tile-img" src="images/vocabulary/yowayowashii.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">弱々しい</span><span class="jougo-tile-reading">yowayowashii</span><span class="jougo-tile-en">weak-looking, frail</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="彼女は華々しいデビューを飾った。" data-ex-en="She made a brilliant debut."><img class="jougo-tile-img" src="images/vocabulary/hanabanashii.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">華々しい</span><span class="jougo-tile-reading">hanabanashii</span><span class="jougo-tile-en">glorious, brilliant</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="嵐の海は荒々しく岩を打ち付けていた。" data-ex-en="The stormy sea was crashing wildly against the rocks."><img class="jougo-tile-img" src="images/vocabulary/araarashii.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">荒々しい</span><span class="jougo-tile-reading">araarashii</span><span class="jougo-tile-en">wild, rough, violent</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="仰々しい挨拶はやめて、普通に話そう。" data-ex-en="Let's drop the pompous greetings and just talk normally."><img class="jougo-tile-img" src="images/vocabulary/gyougyoushii.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">仰々しい</span><span class="jougo-tile-reading">gyōgyōshii</span><span class="jougo-tile-en">pompous, exaggerated</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="制服を着た彼の姿は凛々しかった。" data-ex-en="He looked gallant in his uniform."><img class="jougo-tile-img" src="images/vocabulary/ririshii.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">凛々しい</span><span class="jougo-tile-reading">ririshii</span><span class="jougo-tile-en">gallant, dignified</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="今朝採れた瑞々しい桃を食べた。" data-ex-en="I ate a juicy, fresh peach that was picked this morning."><img class="jougo-tile-img" src="images/vocabulary/mizumizushii.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">瑞々しい</span><span class="jougo-tile-reading">mizumizushii</span><span class="jougo-tile-en">fresh, succulent</span></div>
                  <div class="jougo-tile"><span class="jougo-tile-glyph">々々しい</span><span class="jougo-tile-reading">— pattern</span><span class="jougo-tile-en">stem + 々 + しい</span></div>
                </div>

                <h4>States &amp; variety — "each / every / various"</h4>
                <div class="jougo-grid">
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="旅行先で色々な料理を試した。" data-ex-en="We tried all sorts of dishes at our travel destination."><img class="jougo-tile-img" src="images/vocabulary/iroiro.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">色々</span><span class="jougo-tile-reading">iroiro</span><span class="jougo-tile-en">various, all sorts of</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="世界には様々な文化がある。" data-ex-en="There are diverse cultures in the world."><img class="jougo-tile-img" src="images/vocabulary/samazama.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">様々</span><span class="jougo-tile-reading">samazama</span><span class="jougo-tile-en">diverse, various</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="会計は別々でお願いします。" data-ex-en="Please split the check, separately."><img class="jougo-tile-img" src="images/vocabulary/betsubetsu.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">別々</span><span class="jougo-tile-reading">betsubetsu</span><span class="jougo-tile-en">separately</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="各々が自分の意見を述べた。" data-ex-en="Each person stated their own opinion."><img class="jougo-tile-img" src="images/vocabulary/onoono.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">各々</span><span class="jougo-tile-reading">onoono</span><span class="jougo-tile-en">each, respectively</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="お土産は銘々の袋に分けてください。" data-ex-en="Please separate the souvenirs into individual bags."><img class="jougo-tile-img" src="images/vocabulary/meimei.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">銘々</span><span class="jougo-tile-reading">meimei</span><span class="jougo-tile-en">each (individual)</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="部屋の隅々まできれいに掃除した。" data-ex-en="I cleaned every corner of the room."><img class="jougo-tile-img" src="images/vocabulary/sumizumi.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">隅々</span><span class="jougo-tile-reading">sumizumi</span><span class="jougo-tile-en">every corner</span></div>
                </div>

                <h4>Mood adverbs — how an action feels</h4>
                <div class="jougo-grid">
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="朝早々に出発した方がいい。" data-ex-en="We'd better leave bright and early in the morning."><img class="jougo-tile-img" src="images/vocabulary/sousou.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">早々</span><span class="jougo-tile-reading">sōsō</span><span class="jougo-tile-en">immediately, right away</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="私は元々運動が苦手だ。" data-ex-en="I've never been good at sports to begin with."><img class="jougo-tile-img" src="images/vocabulary/motomoto.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">元々</span><span class="jougo-tile-reading">motomoto</span><span class="jougo-tile-en">originally, from the start</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="彼は渋々ながら手伝ってくれた。" data-ex-en="He reluctantly helped me out."><img class="jougo-tile-img" src="images/vocabulary/shibushibu.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">渋々</span><span class="jougo-tile-reading">shibushibu</span><span class="jougo-tile-en">reluctantly</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="子供たちは嬉々として公園を走り回った。" data-ex-en="The children ran around the park gleefully."><img class="jougo-tile-img" src="images/vocabulary/kiki.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">嬉々</span><span class="jougo-tile-reading">kiki (to shite)</span><span class="jougo-tile-en">joyfully</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="花嫁が静々と通路を歩いて来た。" data-ex-en="The bride walked down the aisle quietly and gracefully."><img class="jougo-tile-img" src="images/vocabulary/shizushizu.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">静々</span><span class="jougo-tile-reading">shizushizu</span><span class="jougo-tile-en">quietly, calmly</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="引退後、彼は悠々と暮らしている。" data-ex-en="Since retiring, he's been living a leisurely life."><img class="jougo-tile-img" src="images/vocabulary/yuuyuu.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">悠々</span><span class="jougo-tile-reading">yūyū</span><span class="jougo-tile-en">relaxed, leisurely</span></div>
                </div>

                <h4>Living things &amp; the rest</h4>
                <div class="jougo-grid">
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="蝶々が花から花へ飛び回っている。" data-ex-en="A butterfly flits from flower to flower."><img class="jougo-tile-img" src="images/vocabulary/choucho.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">蝶々</span><span class="jougo-tile-reading">chōchō</span><span class="jougo-tile-en">butterfly</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="納豆は粘々していて、外国人には食べづらい。" data-ex-en="Nattō is sticky, and many foreigners find it hard to eat."><img class="jougo-tile-img" src="images/vocabulary/nebaneba.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">粘々</span><span class="jougo-tile-reading">nebaneba</span><span class="jougo-tile-en">sticky, gooey</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="電車が遅れて苛々した。" data-ex-en="The train was delayed and I got irritated."><img class="jougo-tile-img" src="images/vocabulary/iraira.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">苛々する</span><span class="jougo-tile-reading">iraira suru</span><span class="jougo-tile-en">to get irritated</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="子供と一緒に謎々をして遊んだ。" data-ex-en="I played riddles with the kid."><img class="jougo-tile-img" src="images/vocabulary/nazonazo.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">謎々</span><span class="jougo-tile-reading">nazonazo</span><span class="jougo-tile-en">a riddle</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="先々月、新しい仕事を始めました。" data-ex-en="I started a new job the month before last."><img class="jougo-tile-img" src="images/vocabulary/sensengetsu.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">先々月</span><span class="jougo-tile-reading">sensengetsu</span><span class="jougo-tile-en">month before last</span></div>
                  <div class="jougo-tile jougo-tile-illus" role="button" tabindex="0" data-jougo-modal="1" data-ex-jp="日々の積み重ねが大切だ。" data-ex-en="It's the daily accumulation that matters."><img class="jougo-tile-img" src="images/vocabulary/hibi.webp" alt="" loading="lazy"><span class="jougo-tile-glyph">日々</span><span class="jougo-tile-reading">hibi / nichinichi</span><span class="jougo-tile-en">days, daily life</span></div>
                </div>
              </section>

              <section class="jougo-section">
                <h3>D · The bridge to kana reduplication</h3>
                <p>The instinct behind <span class="glyph-inline">々</span> — "say it twice for texture" — does not stop at kanji. Open any Japanese novel and you will trip over kana reduplications on every page:</p>
                <ul>
                  <li><span class="ja">にこにこ笑う</span> — <em>to smile broadly</em> (not just smile — smile with the corners crinkled)</li>
                  <li><span class="ja">ふにゃふにゃのパン</span> — <em>floppy, limp bread</em></li>
                  <li><span class="ja">きらきら光る</span> — <em>to twinkle / sparkle</em></li>
                  <li><span class="ja">ぴょんぴょん跳ぶ</span> — <em>to hop and hop</em></li>
                </ul>
                <p>These are <em>onomatopoeia</em> in the broad Japanese sense — <span class="ja">擬音語</span> (mimicking sound) and <span class="ja">擬態語</span> (mimicking state/manner). They are the kana cousins of 々-jōgo and live in the <strong>Onomatopoeia</strong> book of this class. Same instinct, different script.</p>
                <p>One pattern, two surface forms: <span class="glyph-inline">人々</span> packs the repetition into a single typographic mark; <span class="ja">にこにこ</span> spells it out. The underlying linguistic move is identical — repetition for plurality, frequency, intensity, or texture.</p>
              </section>

              <section class="jougo-section">
                <h3>E · For deeper study</h3>
                <ul>
                  <li><a href="https://www.kanshudo.com/grammar/%E3%80%85" target="_blank" rel="noopener">Kanshudo — grammar entry for 々</a> · history, voicing rules, edge cases.</li>
                  <li><a href="https://jisho.org/search/%E3%80%85%20%23sentences" target="_blank" rel="noopener">Jisho.org — sentence search for 々</a> · live examples pulled from Tatoeba, with English translations.</li>
                </ul>
              </section>
            `,
          },
        ],
      },
      // (Removed) — the jougo flashcards book lived here, aggregating
      // every card tagged 'jougo' across the FLASHCARD_CLASSES decks.
      // Redundant once the Flashcards section gained its own jougo
      // category — keeping both meant the same set surfaced in two
      // places under two different chrome families.
      {
        id: 'ono',
        titleJa: 'オノマトペ',
        titleEn: 'Onomatopoeia',
        glyph: '音',
        primaryLevel: 'N4',
        pages: [
          {
            // Merged overview page — three editorial zones replace the
            // old cheatsheet/usage/sentences trio so the reader can hold
            // visual, collocation, and sentence senses of each word in
            // one scroll. Zone A is image-heavy (gallery grid), zone B
            // is text-only (compact collocation cards), zone C is the
            // long letterpressed sentence stripe. Different rhythm per
            // zone so the eye never confuses one for the other.
            id: 'overview',
            type: 'jougo-overview',
            title: 'オノマトペ',
            subtitle: 'Sound-symbolic words — the texture of Japanese',
            galleryIntro: 'Each onomatopoeia paints a sensation — squishy, prickly, glittering, dripping. Click any tile to enlarge the painting and hear the word read aloud.',
            gallery: [
              { glyph:'にこにこ',     reading:'nikoniko',     en:'smiling, beaming',           image:'にこにこ' },
              { glyph:'ぽよぽよ',     reading:'poyopoyo',     en:'soft and squishy',           image:'ぽよぽよ' },
              { glyph:'ちくちく',     reading:'chikuchiku',   en:'prickly, stinging',          image:'ちくちく' },
              { glyph:'ふにゃふにゃ', reading:'funyafunya',   en:'floppy, limp',               image:'ふにゃふにゃ' },
              { glyph:'くすくす',     reading:'kusukusu',     en:'giggling, snickering',       image:'くすくす' },
              { glyph:'にゃーにゃー', reading:'nyaa-nyaa',    en:'meow meow',                  image:'にゃーにゃー' },
              { glyph:'ぴたり',       reading:'pitari',       en:'exactly right / stopping dead', image:'ぴたり' },
              { glyph:'ぴょんぴょん', reading:'pyonpyon',     en:'hopping, bouncing',          image:'ぴょんぴょん' },
              { glyph:'ぽたぽた',     reading:'potapota',     en:'drip drip',                  image:'ぽたぽた' },
              { glyph:'コロコロ',     reading:'korokoro',     en:'rolling, tumbling',          image:'コロコロ' },
            ],
            dailyIntro: 'In speech, an onomatopoeia attaches to a verb or adjective and tints its meaning. Notice how each pairing forms a tight unit — the texture word and its verb live together as a single chunk.',
            daily: [
              { glyph:'にこにこ',     phrase:'にこにこ笑う',          phraseKana:'にこにこ わらう',          en:'to smile broadly' },
              { glyph:'ぽよぽよ',     phrase:'ぽよぽよした肌',        phraseKana:'ぽよぽよ した はだ',       en:'soft, squishy skin' },
              { glyph:'ちくちく',     phrase:'ちくちく痛い',          phraseKana:'ちくちく いたい',          en:'to sting / prickle' },
              { glyph:'ふにゃふにゃ', phrase:'ふにゃふにゃになる',    phraseKana:'ふにゃふにゃ に なる',     en:'to go all floppy' },
              { glyph:'くすくす',     phrase:'くすくす笑う',          phraseKana:'くすくす わらう',          en:'to giggle' },
              { glyph:'にゃーにゃー', phrase:'猫がにゃーにゃー鳴く',  phraseKana:'ねこが にゃーにゃー なく', en:'the cat meows' },
              { glyph:'ぴたり',       phrase:'答えがぴたりと合う',    phraseKana:'こたえが ぴたりと あう',   en:'the answer fits exactly' },
              { glyph:'ぴょんぴょん', phrase:'うさぎがぴょんぴょん跳ぶ', phraseKana:'うさぎが ぴょんぴょん とぶ', en:'the rabbit hops around' },
              { glyph:'ぽたぽた',     phrase:'水がぽたぽた落ちる',    phraseKana:'みずが ぽたぽた おちる',   en:'water drips down' },
              { glyph:'コロコロ',     phrase:'ボールがコロコロ転がる', phraseKana:'ぼーるが ころころ ころがる', en:'the ball rolls along' },
            ],
            sentencesIntro: 'Same words, full sentences. Tap the speaker to hear each one read at study pace.',
            sentences: [
              { ja:'赤ちゃんが にこにこ 笑って います。',          en:'The baby is smiling happily.',                       level:'N5' },
              { ja:'猫が にゃーにゃー 鳴いて いるよ。',            en:'The cat is meowing, you know.',                      level:'N5' },
              { ja:'蛇口から 水が ぽたぽた 落ちて います。',       en:'Water is dripping from the faucet.',                 level:'N5' },
              { ja:'このクッション、ぽよぽよ して 気持ちいい。',   en:'This cushion is soft and squishy — feels nice.',     level:'N4' },
              { ja:'セーターが ちくちく して、かゆい。',           en:'The sweater is prickly and itchy.',                  level:'N4' },
              { ja:'みんなが くすくす 笑って いたので、恥ずかしく なった。', en:'Everyone was giggling, so I got embarrassed.',   level:'N4' },
              { ja:'うさぎが 庭を ぴょんぴょん 跳んで いた。',     en:'A rabbit was hopping around the garden.',            level:'N4' },
              { ja:'暑さで アイスが ふにゃふにゃに なって しまった。', en:'The ice cream went all floppy from the heat.',       level:'N3' },
              { ja:'計算が ぴたりと 合った とき、うれしかった。',  en:'I was happy when the numbers matched exactly.',      level:'N3' },
              { ja:'落ち葉が コロコロ 転がって いった。',          en:'The fallen leaves tumbled away.',                    level:'N4' },
            ],
          },
        ],
      },
      {
        id: 'jougo-common',
        titleJa: 'よくつかう',
        titleEn: 'Common Jougo',
        glyph: '畳',
        primaryLevel: 'N4',
        pages: [
          {
            // Same three-zone overview structure as the Onomatopoeia
            // book — gallery / collocation cards / sentence stripes.
            // Words without per-word illustrations (まだまだ, なかなか,
            // わざわざ, ぴかぴか, ばらばら) render with a paper-2 +
            // giant-glyph placeholder via the no-image fallback in the
            // .jougo-tile-illus chrome.
            id: 'overview',
            type: 'jougo-overview',
            title: 'よく つかう 畳語',
            subtitle: 'Repeated words that add nuance — emphasis, plurality, vagueness',
            galleryIntro: 'Twelve workhorses you\'ll hear daily — words that double themselves to mean "more of," "kind of," or "all over." Click a tile to enlarge it and hear the word.',
            gallery: [
              { glyph:'いろいろ',     reading:'iroiro',     en:'various, all sorts of',         image:'iroiro' },
              { glyph:'時々',         reading:'tokidoki',   en:'sometimes',                     image:'tokidoki' },
              { glyph:'段々',         reading:'dandan',     en:'gradually, little by little',   image:'dandan' },
              { glyph:'人々',         reading:'hitobito',   en:'people (plural)',               image:'hitobito' },
              { glyph:'次々',         reading:'tsugitsugi', en:'one after another',             image:'tsugitsugi' },
              { glyph:'別々',         reading:'betsubetsu', en:'separately, individually',      image:'betsubetsu' },
              { glyph:'まだまだ',     reading:'madamada',   en:'still a long way / not yet',    image:'madamada' },
              { glyph:'なかなか',     reading:'nakanaka',   en:'quite / not easily',            image:'nakanaka' },
              { glyph:'ますます',     reading:'masumasu',   en:'more and more, increasingly',   image:'masumasu' },
              { glyph:'わざわざ',     reading:'wazawaza',   en:'purposely, going out of one\'s way', image:'wazawaza' },
              { glyph:'ぴかぴか',     reading:'pikapika',   en:'sparkling, shiny',              image:'pikapika' },
              { glyph:'ばらばら',     reading:'barabara',   en:'scattered, in pieces',          image:'barabara' },
            ],
            dailyIntro: 'Each jōgo locks onto a verb, adjective, or noun and tints it. Reading the phrase whole — texture word + its partner — is how the pairing settles into memory.',
            daily: [
              { glyph:'いろいろ',     phrase:'いろいろな人',          phraseKana:'いろいろ な ひと',          en:'various people' },
              { glyph:'時々',         phrase:'時々雨が降る',          phraseKana:'ときどき あめが ふる',      en:'it rains sometimes' },
              { glyph:'段々',         phrase:'段々寒くなる',          phraseKana:'だんだん さむく なる',      en:'to gradually get cold' },
              { glyph:'人々',         phrase:'人々が集まる',          phraseKana:'ひとびとが あつまる',       en:'people gather' },
              { glyph:'次々',         phrase:'次々と届く',            phraseKana:'つぎつぎと とどく',         en:'to arrive one after another' },
              { glyph:'別々',         phrase:'別々に払う',            phraseKana:'べつべつに はらう',         en:'to pay separately' },
              { glyph:'まだまだ',     phrase:'まだまだ頑張る',        phraseKana:'まだまだ がんばる',         en:'to keep trying (still more to go)' },
              { glyph:'なかなか',     phrase:'なかなか決められない',  phraseKana:'なかなか きめられない',     en:'can\'t easily decide' },
              { glyph:'ますます',     phrase:'ますます好きになる',    phraseKana:'ますます すきに なる',      en:'to like more and more' },
              { glyph:'わざわざ',     phrase:'わざわざ来てくれた',    phraseKana:'わざわざ きて くれた',      en:'went out of their way to come' },
            ],
            sentencesIntro: 'Same words, in full sentences. Tap the speaker to hear each one read at study pace.',
            sentences: [
              { ja:'いろいろ ありがとう ございます。',                 en:'Thank you for everything.',                         level:'N5' },
              { ja:'時々、友達と カフェに 行きます。',                 en:'Sometimes I go to a café with friends.',            level:'N5' },
              { ja:'段々 日本語が 分かるように なりました。',          en:'I gradually came to understand Japanese.',          level:'N4' },
              { ja:'人々は 桜の 下で お花見を して いた。',            en:'People were having hanami under the cherry trees.', level:'N4' },
              { ja:'荷物が 次々と 届いて、部屋が いっぱいに なった。', en:'Packages arrived one after another and filled the room.', level:'N3' },
              { ja:'別々に 注文しても いいですか？',                   en:'Is it okay if we order separately?',                level:'N4' },
              { ja:'まだまだ 暑い 日が 続きそう です。',               en:'It seems like the hot days will continue for a while yet.', level:'N4' },
              { ja:'この 問題は なかなか 難しい。',                    en:'This problem is quite difficult.',                  level:'N4' },
              { ja:'ますます 便利に なって きた。',                    en:'It\'s become more and more convenient.',            level:'N3' },
            ],
          },
        ]
      },
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
      { id:'sun',       kanji:'日', kun:'ひ',     on:'ニチ',   en:'sun / day', strokes:4, examples:[{word:'日曜日',reading:'NICHIYŌbi',meaning:'Sunday'},{word:'毎日',reading:'MAINICHI',meaning:'every day'},{word:'日の出',reading:'hinode',meaning:'sunrise'}] },
      { id:'moon',      kanji:'月', kun:'つき',   on:'ゲツ',   en:'moon / month', strokes:4, examples:[{word:'月曜日',reading:'GETSUYŌbi',meaning:'Monday'},{word:'正月',reading:'SHŌGATSU',meaning:'New Year'},{word:'月見',reading:'tsukimi',meaning:'moon viewing'}] },
      { id:'mtn',       kanji:'山', kun:'やま',   on:'サン',   en:'mountain', strokes:3, examples:[{word:'富士山',reading:'FUJISAN',meaning:'Mt. Fuji'},{word:'山道',reading:'yamaji',meaning:'mountain path'},{word:'山火事',reading:'yamakaji',meaning:'wildfire'}] },
      { id:'river',     kanji:'川', kun:'かわ',   on:'セン',   en:'river', strokes:3, examples:[{word:'川上',reading:'kawakami',meaning:'upstream'},{word:'川下',reading:'kawashimo',meaning:'downstream'},{word:'小川',reading:'ogawa',meaning:'stream'}] },
      { id:'tree',      kanji:'木', kun:'き',     on:'ボク',   en:'tree / wood',
        strokes:4, examples:[{word:'木曜日',reading:'MOKUYŌbi',meaning:'Thursday'},{word:'木造',reading:'MOKUZŌ',meaning:'wooden'},{word:'木陰',reading:'kokage',meaning:'tree shade'}] },
      { id:'book',      kanji:'本', kun:'もと',   on:'ホン',   en:'book / origin / root',
        strokes:5, seeAlso:['木'], examples:[{word:'日本',reading:'NIHON',meaning:'Japan'},{word:'本当',reading:'HONTŌ',meaning:'really'},{word:'本棚',reading:'hondana',meaning:'bookshelf'}] },
      { id:'fire',      kanji:'火', kun:'ひ',     on:'カ',     en:'fire',
        strokes:4, examples:[{word:'火曜日',reading:'KAYŌbi',meaning:'Tuesday'},{word:'火山',reading:'KAZAN',meaning:'volcano'},{word:'火花',reading:'hibana',meaning:'spark'}] },
      { id:'water',     kanji:'水', kun:'みず',   on:'スイ',   en:'water',
        strokes:4, examples:[{word:'水曜日',reading:'SUIYŌbi',meaning:'Wednesday'},{word:'水泳',reading:'SUIEI',meaning:'swimming'},{word:'水着',reading:'mizugi',meaning:'swimsuit'}] },
      // 氷 (ice) = 水 with a frozen-mark stroke at the top-left. Sits
      // right after 水 in the deck so the water → frozen-water mnemonic
      // lands while 水 is still warm in memory. N3 by JLPT level but
      // pedagogically a natural neighbour of 水.
      { id:'ice',       kanji:'氷', kun:'こおり', on:'ヒョウ', en:'ice', strokes:5, seeAlso:['水'],
        examples:[{word:'氷水',reading:'kōrimizu',meaning:'ice water'},{word:'氷山',reading:'HYŌZAN',meaning:'iceberg'},{word:'かき氷',reading:'kakigōri',meaning:'shaved ice'}] },
      { id:'earth',     kanji:'土', kun:'つち',   on:'ド',     en:'earth / soil / Saturday',
        strokes:3, examples:[{word:'土曜日',reading:'DOYŌbi',meaning:'Saturday'},{word:'土地',reading:'TOCHI',meaning:'land'},{word:'土産',reading:'miyage',meaning:'souvenir'}] },
      { id:'ricefield', kanji:'田', kun:'た',     on:'デン',   en:'rice field', strokes:5, examples:[{word:'田んぼ',reading:'tanbo',meaning:'rice paddy'},{word:'田園',reading:'DEN\'EN',meaning:'countryside'},{word:'田植え',reading:'taue',meaning:'rice planting'}] },
      { id:'big',       kanji:'大', kun:'おお',   on:'ダイ',   en:'big / large', strokes:3, examples:[{word:'大学',reading:'DAIGAKU',meaning:'university'},{word:'大人',reading:'otona',meaning:'adult'},{word:'大きい',reading:'ōkii',meaning:'big'}] },
      { id:'small',     kanji:'小', kun:'ちい',   on:'ショウ', en:'small', strokes:3, examples:[{word:'小学校',reading:'SHŌGAKKŌ',meaning:'elementary school'},{word:'小さい',reading:'chiisai',meaning:'small'},{word:'小鳥',reading:'kotori',meaning:'small bird'}] },
      { id:'yen',       kanji:'円', kun:'まる',   on:'エン',   en:'yen / circle', strokes:4, examples:[{word:'円形',reading:'ENKEI',meaning:'circle'},{word:'円高',reading:'ENdaka',meaning:'strong yen'},{word:'百円',reading:'HYAKUEN',meaning:'100 yen'}] },
      { id:'king',      kanji:'王', kun:'おう',   on:'オウ',   en:'king', strokes:4, examples:[{word:'王子',reading:'ŌJI',meaning:'prince'},{word:'女王',reading:'JOŌ',meaning:'queen'},{word:'王様',reading:'Ōsama',meaning:'king'}] },
      { id:'life',      kanji:'生', kun:'い',     on:'セイ',   en:'life / give birth / student', strokes:5, examples:[{word:'学生',reading:'GAKUSEI',meaning:'student'},{word:'先生',reading:'SENSEI',meaning:'teacher'},{word:'生活',reading:'SEIKATSU',meaning:'daily life'},{word:'生まれる',reading:'umareru',meaning:'to be born'}] },
      { id:'jewel',     kanji:'玉', kun:'たま',   on:'ギョク', en:'jewel / ball', strokes:5, examples:[{word:'玉ねぎ',reading:'tamanegi',meaning:'onion'},{word:'目玉',reading:'medama',meaning:'eyeball'},{word:'宝玉',reading:'HŌGYOKU',meaning:'jewel'}] },
      { id:'country',   kanji:'国', kun:'くに',   on:'コク',   en:'country', strokes:8, seeAlso:['王'], examples:[{word:'外国',reading:'GAIKOKU',meaning:'foreign country'},{word:'国民',reading:'KOKUMIN',meaning:'citizens'},{word:'国語',reading:'KOKUGO',meaning:'Japanese (subject)'}] },
      { id:'gold',      kanji:'金', kun:'かね',   on:'キン',   en:'gold / money / metal', strokes:8, examples:[{word:'金曜日',reading:'KIN\'YŌbi',meaning:'Friday'},{word:'お金',reading:'okane',meaning:'money'},{word:'金魚',reading:'kingyo',meaning:'goldfish'}] },
      { id:'vehicle',   kanji:'車', kun:'くるま', on:'シャ',   en:'vehicle / car', strokes:7, examples:[{word:'自動車',reading:'JIDŌSHA',meaning:'car'},{word:'電車',reading:'DENSHA',meaning:'train'},{word:'車輪',reading:'SHARIN',meaning:'wheel'}] },
    ],
  },
  {
    id: 'numbers',
    titleJa: 'すうじ',
    titleEn: 'Numbers',
    glyph: '千',
    cards: [
      // Numbers carry a `digit` field used as the card's "image" — the
      // editorial flashcard + wrap-up tile render it in the image slot
      // instead of probing for a .webp. We use Roman numerals where the
      // shape carries mnemonic weight (I, II, III mirror the strokes
      // of 一, 二, 三; X mirrors the cross of 十; XX mirrors 廿 = two
      // tens fused) and Arabic numerals for 4–9 where the Roman form
      // (IV, V, VI…) loses the visual mnemonic and just becomes a code.
      { id:'one',      kanji:'一', digit:'I',    kun:'ひと',     on:'イチ',   en:'one', strokes:1, examples:[{word:'一月',reading:'ICHIGATSU',meaning:'January'},{word:'一人',reading:'hitori',meaning:'one person'},{word:'一番',reading:'ICHIBAN',meaning:'number one'}] },
      { id:'two',      kanji:'二', digit:'II',   kun:'ふた',     on:'ニ',     en:'two', strokes:2, examples:[{word:'二月',reading:'NIGATSU',meaning:'February'},{word:'二人',reading:'futari',meaning:'two people'},{word:'二階',reading:'NIKAI',meaning:'second floor'}] },
      { id:'three',    kanji:'三', digit:'III',  kun:'み',       on:'サン',   en:'three', strokes:3, examples:[{word:'三月',reading:'SANGATSU',meaning:'March'},{word:'三角',reading:'SANKAKU',meaning:'triangle'},{word:'三つ',reading:'mittsu',meaning:'three things'}] },
      { id:'four',     kanji:'四', digit:'4',    kun:'よ',       on:'シ',     en:'four', strokes:5, examples:[{word:'四月',reading:'SHIGATSU',meaning:'April'},{word:'四季',reading:'SHIKI',meaning:'four seasons'},{word:'四角',reading:'SHIKAKU',meaning:'square'}] },
      { id:'five',     kanji:'五', digit:'5',    kun:'いつ',     on:'ゴ',     en:'five', strokes:4, examples:[{word:'五月',reading:'GOGATSU',meaning:'May'},{word:'五感',reading:'GOKAN',meaning:'five senses'},{word:'五つ',reading:'itsutsu',meaning:'five things'}] },
      { id:'six',      kanji:'六', digit:'6',    kun:'む',       on:'ロク',   en:'six', strokes:4, examples:[{word:'六月',reading:'ROKUGATSU',meaning:'June'},{word:'六つ',reading:'muttsu',meaning:'six things'},{word:'六本木',reading:'ROPPONGI',meaning:'Roppongi'}] },
      { id:'seven',    kanji:'七', digit:'7',    kun:'なな',     on:'シチ',   en:'seven', strokes:2, examples:[{word:'七月',reading:'SHICHIGATSU',meaning:'July'},{word:'七夕',reading:'tanabata',meaning:'Star Festival'},{word:'七つ',reading:'nanatsu',meaning:'seven things'}] },
      { id:'eight',    kanji:'八', digit:'8',    kun:'や',       on:'ハチ',   en:'eight', strokes:2, examples:[{word:'八月',reading:'HACHIGATSU',meaning:'August'},{word:'八百屋',reading:'yaoya',meaning:'greengrocer'},{word:'八つ',reading:'yattsu',meaning:'eight things'}] },
      { id:'nine',     kanji:'九', digit:'9',    kun:'ここの',   on:'キュウ', en:'nine', strokes:2, examples:[{word:'九月',reading:'KUGATSU',meaning:'September'},{word:'九州',reading:'KYŪSHŪ',meaning:'Kyushu'},{word:'九つ',reading:'kokonotsu',meaning:'nine things'}] },
      { id:'ten',      kanji:'十', digit:'X',    kun:'とお',     on:'ジュウ', en:'ten', strokes:2, examples:[{word:'十月',reading:'JŪGATSU',meaning:'October'},{word:'十分',reading:'JŪBUN',meaning:'enough'},{word:'十字路',reading:'JŪJIRO',meaning:'crossroads'}] },
      // ◆十 — 十 as a structural primitive. Same two crossed strokes
      // the learner just met as "ten," but Heisig labels the shape
      // "needle" when it appears inside other kanji (the vertical
      // stroke piercing the horizontal one like a sewing needle
      // through cloth). One of the most prolific primitives — shows
      // up in 古 (old), 早 (early), 計 (calculate), 千 (thousand),
      // 南 (south), 真 (true), 直 (straight), and many more.
      { id:'needle-radical', type:'radical',
        radical:'十', from:'十',
        titleJa:'じゅう', titleEn:'ten (radical) · needle',
        descEn:'The same 十 you just met — but now as a piece sitting INSIDE other kanji. Two strokes crossing at right angles. Heisig calls it "needle" because the vertical stroke pierces through the horizontal one. One of the busiest primitives in the language: 古 (十 over 口 → "ten mouths have spoken it" → old), 早 (日 over 十 → the sun above the needle of dawn → early), 計 (words + ten → counting up → calculate), 千 (a stroke leaning across 十 → thousand).',
        descJa:'いま見た「十」を、漢字の中の部品として見る。たて棒が横棒を貫く形 ──「針（はり）」のイメージ。漢字の上・下・横・中に広く現れる：古（十 + 口、十の口が語り継いだ → 古い）、早（日 + 十、日が針の先に昇る → 早い）、計（言 + 十、ことばで数える → はかる）、千（一画 + 十 → せん）。',
        examples:[
          { kanji:'古', kun:'ふる',   on:'コ',     en:'old' },
          { kanji:'早', kun:'はや',   on:'ソウ',   en:'early / fast' },
          { kanji:'計', kun:'はか',   on:'ケイ',   en:'measure / calculate' },
          { kanji:'千', kun:'ち',     on:'セン',   en:'thousand' },
        ] },
      // 廿 (twenty) — two 十 fused into one glyph. Literary/historical
      // kanji: still alive in 廿日 (hatsuka, "the 20th of the month")
      // and a few set expressions. Pedagogically it earns its slot
      // because the shape recurs as a primitive in 世 / 度 / 散 / 席 —
      // see the radical card immediately below.
      { id:'twenty',   kanji:'廿', digit:'XX', kun:'にじゅう', on:'ジュウ', en:'twenty', strokes:4,
        notes:'Old / literary character for "twenty" — two 十 (ten) joined at the foot. Modern Japanese usually writes 二十 instead, but 廿 survives in 廿日 (hatsuka, the 20th of the month) and a handful of set phrases. Worth meeting now because its silhouette shows up as a structural piece inside 世, 度, 散, 席 — the radical card next door names that shape.',
        examples:[
          {word:'廿日',     reading:'hatsuka',         meaning:'the 20th (of the month)'},
          {word:'廿歳',     reading:'hatachi',         meaning:'twenty years old (lit. variant of 二十歳)'},
          {word:'廿世紀',   reading:'NIJISSEIKI',      meaning:'the 20th century (literary)'},
        ] },
      // Radical card — 廿 as a structural primitive. It rarely sits
      // on its own in modern kanji; instead it lives at the top of
      // characters where Heisig reads it as "twenty." Four examples
      // span the four big domains it shows up in: world (世),
      // measure (度), scatter (散), and seat (席).
      { id:'twenty-radical', type:'radical',
        radical:'廿', from:'十',
        titleJa:'にじゅう', titleEn:'twenty (radical)',
        descEn:'廿 as a structural primitive — two tens fused into one shape. Rarely stands alone in modern kanji; instead it sits at the top of compounds where Heisig labels it "twenty." Spot it in 世 (world), 度 (degree), 散 (scatter), and 席 (seat).',
        descJa:'「廿」は十が二つ重なった形。現代の漢字では単独で書かれることは少ないが、世・度・散・席など、いろいろな漢字の上半分に部品として残っている。',
        examples:[
          { kanji:'世', kun:'よ',    on:'セイ', en:'world / generation' },
          { kanji:'度', kun:'たび',  on:'ド',   en:'degree / times' },
          { kanji:'散', kun:'ち',    on:'サン', en:'scatter / disperse' },
          { kanji:'席', kun:'',      on:'セキ', en:'seat / place' },
        ] },
      { id:'hundred',  kanji:'百', kun:'もも',     on:'ヒャク', en:'hundred', strokes:6, examples:[{word:'百円',reading:'HYAKUEN',meaning:'100 yen'},{word:'百科',reading:'HYAKKA',meaning:'encyclopedia'},{word:'三百',reading:'SANBYAKU',meaning:'three hundred'}] },
      { id:'thousand', kanji:'千', digit:'1000', kun:'ち',       on:'セン',   en:'thousand', strokes:3, examples:[{word:'千円',reading:'SEN\'EN',meaning:'1000 yen'},{word:'千葉',reading:'CHIBA',meaning:'Chiba'},{word:'千年',reading:'SENNEN',meaning:'millennium'}] },
      { id:'ten-thousand', kanji:'万', kun:'よろず', on:'マン',   en:'ten thousand', strokes:3,
        examples:[
          {word:'一万',   reading:'ICHIMAN',  meaning:'10,000'},
          {word:'万歳',   reading:'BANZAI',   meaning:'banzai / hurray'},
          {word:'万一',   reading:'MAN\'ICHI', meaning:'just in case'},
        ] },
      { id:'half-num', kanji:'半', kun:'なか.ば', on:'ハン', en:'half', strokes:5,
        examples:[
          {word:'半分', reading:'HANBUN',  meaning:'half'},
          {word:'半年', reading:'HANTOSHI', meaning:'half a year'},
          {word:'半額', reading:'HANGAKU', meaning:'half price'},
        ] },
    ],
  },
  {
    id: 'people',
    titleJa: 'ひと',
    titleEn: 'People',
    glyph: '人',
    cards: [
      { id:'person', kanji:'人', kun:'ひと',     on:'ジン',   en:'person',
        strokes:2,
        examples:[
          {word:'日本人',reading:'NIHONJIN',meaning:'Japanese person'},
          {word:'大人',reading:'otona',meaning:'adult'},
          {word:'人口',reading:'JINKŌ',meaning:'population'},
        ] },
      // Radical card — person becomes 亻 (にんべん) when it lives on the left side
      // of a compound kanji. Renders as a stand-alone "radical breakdown" layout.
      { id:'person-radical', type:'radical',
        radical:'亻', from:'人',
        titleJa:'にんべん', titleEn:'person radical',
        descEn:'A variant of 人 that lives on the left side of a kanji — a person seen from the side, legs apart. Marks kanji that have something to do with people or what people do.',
        descJa:'「人」の変形。漢字の左がわに立ち、足を開いた人の姿を表す。人や、人のすることに関わる漢字につく。',
        examples:[
          { kanji:'体', kun:'からだ', on:'タイ',   en:'body' },
          { kanji:'仕', kun:'つか',   on:'シ',     en:'serve / work under' },
          { kanji:'休', kun:'やす',   on:'キュウ', en:'rest / break' },
          { kanji:'何', kun:'なに',   on:'カ',     en:'what' },
        ] },
      // 休 (rest) — 亻 + 木 = "a person resting against a tree." Sits with the
      // person radical it follows; the body card 体 stays in Body for thematic
      // grouping with mouth/eye/heart/etc.
      { id:'rest',   kanji:'休', kun:'やす',     on:'キュウ', en:'rest / holiday',
        seeAlso:['木'],
        strokes:6,
        examples:[
          {word:'休日',reading:'KYŪJITSU',meaning:'holiday'},
          {word:'休憩',reading:'KYŪKEI',meaning:'break'},
          {word:'休み',reading:'yasumi',meaning:'rest / day off'},
        ] },
      { id:'enter',  kanji:'入', kun:'はい',     on:'ニュウ', en:'enter',
        strokes:2,
        examples:[
          {word:'入口',reading:'iriguchi',meaning:'entrance'},
          {word:'入学',reading:'NYŪGAKU',meaning:'enrollment'},
          {word:'入場',reading:'NYŪJŌ',meaning:'admission'},
        ] },
      // female cluster
      { id:'child',  kanji:'子', kun:'こ',       on:'シ',     en:'child',
        strokes:3,
        examples:[
          {word:'子供',reading:'kodomo',meaning:'children'},
          {word:'女子',reading:'JOSHI',meaning:'girl'},
          {word:'子犬',reading:'koinu',meaning:'puppy'},
        ] },
      { id:'woman',  kanji:'女', kun:'おんな',   on:'ジョ',   en:'woman',
        strokes:3,
        examples:[
          {word:'女性',reading:'JOSEI',meaning:'woman'},
          {word:'女の子',reading:'onnanoko',meaning:'girl'},
          {word:'女子',reading:'JOSHI',meaning:'girl / woman'},
        ] },
      { id:'like',   kanji:'好', kun:'す',       on:'コウ',   en:'like / fond',
        strokes:6,
        examples:[
          {word:'好き',reading:'suki',meaning:'like'},
          {word:'好物',reading:'KŌBUTSU',meaning:'favorite food'},
          {word:'好意',reading:'KŌI',meaning:'goodwill'},
        ] },
      { id:'mother', kanji:'母', kun:'はは',     on:'ボ',     en:'mother',
        usage:{ ja:'お母さん', kana:'おかあさん' },
        strokes:5,
        examples:[
          {word:'お母さん',reading:'okaasan',meaning:'mother (polite)'},
          {word:'母国',reading:'BOKOKU',meaning:'motherland'},
          {word:'母音',reading:'BOIN',meaning:'vowel'},
        ] },
      { id:'oneesan', kanji:'姉', kun:'あね',    on:'シ',     en:'older sister',
        usage:{ ja:'お姉さん', kana:'おねえさん' },
        strokes:8,
        examples:[
          {word:'お姉さん',reading:'onēsan',meaning:'older sister (polite)'},
          {word:'姉妹',reading:'SHIMAI',meaning:'sisters'},
          {word:'義姉',reading:'GISHI',meaning:'sister-in-law'},
        ] },
      { id:'imouto', kanji:'妹', kun:'いもうと', on:'マイ',   en:'younger sister',
        strokes:8,
        examples:[
          {word:'妹さん',reading:'imōtosan',meaning:'younger sister (polite)'},
          {word:'姉妹',reading:'SHIMAI',meaning:'sisters'},
          {word:'義妹',reading:'GIMAI',meaning:'sister-in-law'},
        ] },
      // Vocab compound card — 姉 + 妹 together form the everyday word
      // for "sisters." Back face renders both kanji's stroke order
      // side-by-side (spec §4.4).
      { id:'shimai', kanji:'姉妹', kun:'しまい', on:'シマイ', en:'sisters',
        examples:[
          {word:'姉妹',     reading:'shimai',       meaning:'sisters'},
          {word:'三姉妹',   reading:'sanshimai',    meaning:'three sisters'},
          {word:'姉妹都市', reading:'shimai toshi', meaning:'sister city'},
        ] },
      // male cluster
      { id:'father', kanji:'父', kun:'ちち',     on:'フ',     en:'father',
        usage:{ ja:'お父さん', kana:'おとうさん' },
        strokes:4,
        examples:[
          {word:'お父さん',reading:'otōsan',meaning:'father (polite)'},
          {word:'父母',reading:'FUBO',meaning:'parents'},
          {word:'父親',reading:'chichioya',meaning:'father'},
        ] },
      { id:'man',    kanji:'男', kun:'おとこ',   on:'ダン',   en:'man',
        seeAlso:['田'],
        strokes:7,
        examples:[
          {word:'男性',reading:'DANSEI',meaning:'man'},
          {word:'男の子',reading:'otokonoko',meaning:'boy'},
          {word:'男子',reading:'DANSHI',meaning:'boy / man'},
        ] },
      { id:'oniisan', kanji:'兄', kun:'あに',    on:'ケイ',   en:'older brother',
        usage:{ ja:'お兄さん', kana:'おにいさん' },
        strokes:5,
        examples:[
          {word:'お兄さん',reading:'onīsan',meaning:'older brother (polite)'},
          {word:'兄弟',reading:'KYŌDAI',meaning:'siblings'},
          {word:'兄貴',reading:'aniki',meaning:'big bro'},
        ] },
      { id:'otouto', kanji:'弟', kun:'おとうと', on:'テイ',   en:'younger brother',
        strokes:7,
        examples:[
          {word:'弟子',reading:'DESHI',meaning:'disciple'},
          {word:'兄弟',reading:'KYŌDAI',meaning:'siblings'},
          {word:'弟さん',reading:'otōtosan',meaning:'younger brother (polite)'},
        ] },
      // Vocab compound card — 兄 + 弟 together form the everyday word
      // for "brothers / siblings." Back face renders both kanji's
      // stroke order side-by-side (spec §4.4).
      { id:'kyoudai', kanji:'兄弟', kun:'きょうだい', on:'キョウダイ', en:'brothers / siblings',
        examples:[
          {word:'兄弟',     reading:'kyōdai',        meaning:'brothers / siblings'},
          {word:'兄弟姉妹', reading:'kyōdai shimai', meaning:'all siblings'},
          {word:'義兄弟',   reading:'gikyōdai',      meaning:'in-law siblings'},
        ] },
      // Radical card — two more hand-derived forms (ナ on top, 又 on the
      // right-hand side of compounds). Companion to the ナ・ヨ card in Body:
      // that one introduced ナ as a hand variant; this one pairs ナ with 又
      // to set up the etymology of 友 — two hands clasping in friendship —
      // which is the very next card. 又 is itself a standalone kanji meaning
      // "again," but here it's framed as what it originally pictured: a
      // right hand.
      { id:'hands-radical', type:'radical',
        radical:['ナ', '又'], from:'手',
        titleJa:'ふたつ の 手', titleEn:'two hands (ナ · 又)',
        descEn:'Both are ancient pictographs of a hand. Put them side by side and you get 友 — two hands clasping in friendship. The ナ form rides at the top of 友, 有, 在; the 又 form lives at the right of 双, 取, 受 — always a hand doing something.',
        descJa:'どちらも むかし は 手 の かたち。ふたつ ならべる と「友」 — ふたつ の 手 が つなぐ。「ナ」 は 「友」「有」「在」 の うえ、「又」 は 「双」「取」「受」 の みぎ に あらわれる。',
        examples:[
          { kanji:'友', kun:'とも', on:'ユウ', en:'friend' },
          { kanji:'双', kun:'ふた', on:'ソウ', en:'pair / both' },
          { kanji:'取', kun:'と',   on:'シュ', en:'take / grab' },
          { kanji:'受', kun:'う',   on:'ジュ', en:'receive' },
        ] },
      { id:'friend', kanji:'友', kun:'とも',     on:'ユウ',   en:'friend',
        seeAlso:['手'],
        strokes:4,
        notes:'友 = ナ (one hand) + 又 (the other hand) — two hands clasping. The pictograph for friendship.',
        examples:[
          {word:'友達',reading:'tomodachi',meaning:'friend'},
          {word:'友人',reading:'YŪJIN',meaning:'friend (formal)'},
          {word:'友好',reading:'YŪKŌ',meaning:'friendship'},
        ] },
      { id:'pair', kanji:'双', kun:'ふた', on:'ソウ', en:'pair / both',
        seeAlso:['友'],
        strokes:4,
        notes:'双 = 又 + 又 — two hands side by side. Same hand-pictograph that pairs with ナ in 友 (friend), here doubled to mean "a matching pair."',
        examples:[
          {word:'双子',reading:'futago',meaning:'twins'},
          {word:'双方',reading:'SŌHŌ',meaning:'both sides / both parties'},
          {word:'双葉',reading:'futaba',meaning:'sprout / pair of leaves'},
        ] },
      // Vocab compound card — 双 + 子 together form the everyday word
      // for "twins" (a matched pair of children). Back face renders
      // both kanji's stroke order side-by-side (spec §4.4).
      { id:'futago', kanji:'双子', kun:'ふたご', en:'twins',
        examples:[
          {word:'双子',     reading:'futago',          meaning:'twins'},
          {word:'双子座',   reading:'futagoza',        meaning:'Gemini (zodiac)'},
          {word:'一卵性双生児', reading:'ichirantai sōseiji', meaning:'identical twins'},
        ] },
      // 云 → ◆厶 cluster — follows the kanji-before-radical rule. 云
      // is the standalone glyph (rare in modern Japanese as a verb,
      // but the structural pictograph the learner needs to recognize
      // the 厶 component sitting at the bottom). ◆厶 then names the
      // role that bottom-shape plays across the writing system:
      // "private / personal / I" — the curled-up self.
      { id:'say-classical', kanji:'云', kun:'い',    on:'ウン',  en:'say (classical) / so they say',
        seeAlso:['言'],
        strokes:4,
        notes:'The classical / literary verb for "to say" — replaced by 言う in modern speech, but still alive in set phrases. 云 = 二 (two) on top + 厶 (the curled-up self) at the bottom: an old pictograph of breath spiraling up out of a mouth into the air. Lives on inside 雲 (cloud) where that same breath becomes vapor, and in stiff written phrases like 〜と云う = "what is called 〜" (the more bookish twin of 〜という).',
        examples:[
          {word:'云う',    reading:'iu',         meaning:'to say (classical / literary)'},
          {word:'と云う',  reading:'to iu',      meaning:'called / known as (formal)'},
          {word:'云々',    reading:'unnun',      meaning:'and so on, etcetera'},
          {word:'伝々云々', reading:'denden-unnun', meaning:'blah blah blah (dismissive)'},
        ] },
      { id:'mu-radical', type:'radical',
        radical:'厶', from:'厶',
        titleJa:'む', titleEn:'private · I · myself',
        descEn:'A curled-up shape — historically a pictograph of an arm wrapped around something to keep it for oneself. The character that means "private" or "personal" in its original sense. 厶 plants itself at the bottom or side of compounds about the SELF, what is HELD CLOSE, what is KEPT BACK — 私 (grain + 厶 = "my own grain" → "I, private"), 公 (八 split-open over 厶 = "what is no longer private" → "public"), 弘 (bow + 厶 = drawn back wide → "vast"), and the 云 you just met (breath spiraling up from the self).',
        descJa:'「厶」は、自分の腕で何かを抱え込む形 — もとは「私的なもの・自分のもの」を表す字。漢字の下や横にすわって「自分・自我・かかえこむ」を表すしるしになる。例：私（禾 + 厶 → 自分の米 → わたし）、公（八 + 厶 → 私を割って開く → おおやけ）、弘（弓 + 厶 → 弓をひろく引く → ひろい）、いま見た云（自分から立ちのぼる息）。',
        examples:[
          { kanji:'私', kun:'わたし', on:'シ',  en:'I / private' },
          { kanji:'公', kun:'おおやけ', on:'コウ', en:'public / official' },
          { kanji:'弘', kun:'ひろ',   on:'コウ', en:'vast / spread wide' },
          { kanji:'云', kun:'い',     on:'ウン', en:'say (classical)' },
        ] },
      // 私 — the FIRST full kanji card that uses 厶 from the radical
      // page above. 禾 (grain stalk, the agrarian root of "harvest")
      // on the left + 厶 (private/self) on the right = "my own grain"
      // → "I." Pedagogically the cleanest payoff for the 厶 page:
      // the radical's most common compound, the first-person pronoun
      // every learner has already met as わたし.
      { id:'i-private',kanji:'私', kun:'わたし', on:'シ',     en:'I / me / private',
        seeAlso:['厶'],
        strokes:7,
        notes:'禾 (grain stalk) on the left + 厶 (the curled-up self) on the right — "my own grain" → "I, mine, private." The everyday first-person pronoun: わたし is the standard neutral, わたくし is the formal-polite version (used in business and ceremonial settings). 私 also stands alone as a noun for "the private sphere," set against its opposite 公 (the public sphere). All the abstract "private vs public" vocabulary in modern Japanese — 私立 (private school), 私生活 (private life), 私服 (street clothes, civilian dress) — pivots on this single character.',
        examples:[
          {word:'私',      reading:'watashi',         meaning:'I / me'},
          {word:'私たち',  reading:'watashitachi',    meaning:'we / us'},
          {word:'私立',    reading:'SHIRITSU',        meaning:'private (school, university, hospital)'},
          {word:'私生活',  reading:'SHISEIKATSU',     meaning:'private life'},
        ] },
      // 公 — the OPPOSITE of 私, sitting right next to it. 八 (split
      // open, the number eight, two strokes diverging) above 厶
      // (private/self) = "the private cracked open, made visible" →
      // public, official, open. The 私 ↔ 公 pair is one of the
      // foundational opposites in Japanese vocabulary, like 内 / 外
      // or 上 / 下. Every public-sphere word in modern Japanese is
      // built on 公: 公園 (public park), 公務員 (civil servant),
      // 公開 (open to the public, released), 公平 (impartial, fair).
      { id:'public',   kanji:'公', kun:'おおやけ', on:'コウ',   en:'public / official',
        seeAlso:['厶','私'],
        strokes:4,
        notes:'八 (split open, two strokes diverging) over 厶 (the curled-up self) — "the private cracked open and made visible" → public. The cultural opposite of 私: 私 vs 公 = private vs public, individual vs society, the home vs the outside world. Carries a formal/official register: 公務員 (civil servant), 公園 (public park), 公開 (open to the public / release), 公平 (impartial). Also the historical honorific suffix attached to important figures — 信長公 (Lord Nobunaga), 公爵 (duke).',
        examples:[
          {word:'公',     reading:'KŌ',         meaning:'public / official / lord (honorific)'},
          {word:'公園',   reading:'KŌEN',       meaning:'public park'},
          {word:'公開',   reading:'KŌKAI',      meaning:'open to the public / release'},
          {word:'公務員', reading:'KŌMUIN',     meaning:'civil servant / government worker'},
        ] },
      // 会 closes out People — a meeting kanji that visually rests on
      // the 云 cluster just introduced. Top half is the "gather under
      // one roof" cap (人-like 亼); bottom half contains the same 云
      // shape, the breath / words rising up from the gathered selves.
      // When people gather (人) and the talking starts (云), that IS
      // a 会 — a meeting, association, society, conference. Sits
      // after 私 and 公 so the People class ends with the same 厶
      // family it opened — individual self → public self → gathered
      // selves.
      { id:'meet',     kanji:'会', kun:'あ',     on:'カイ',   en:'meeting / meet / association',
        seeAlso:['人','云'],
        strokes:6,
        notes:'人 (people gathered under one roof) sitting on top of 云 (the breath rising from the self). When people gather and the talking starts, that\'s a 会. Covers every kind of coming-together: a casual meet-up, a formal conference, a club, a society, an athletic meet. The verb 会う (au) "to meet" carries the wider sense of "encounter" — including bad ones: 事故に会う means "to have an accident," literally "to encounter an accident."',
        examples:[
          {word:'会',     reading:'KAI',     meaning:'meeting / assembly / society'},
          {word:'会員',   reading:'KAIIN',   meaning:'member'},
          {word:'例会',   reading:'REIKAI',  meaning:'regular meeting'},
          {word:'会う',   reading:'au',      meaning:'to meet / encounter'},
        ] },
    ],
  },
  {
    id: 'nature',
    titleJa: 'しぜん',
    titleEn: 'Nature',
    glyph: '森',
    cards: [
      // Composed natural objects. The five elemental pictographs (日月山川木火水土田)
      // live in Basic; this class focuses on composed kanji that USE them.
      { id:'woods',    kanji:'林', kun:'はやし', on:'リン',   en:'woods',
        seeAlso:['木'],
        strokes:8, examples:[{word:'林道',reading:'RINDŌ',meaning:'forest road'},{word:'山林',reading:'SANRIN',meaning:'mountain forest'},{word:'林業',reading:'RINGYŌ',meaning:'forestry'}] },
      { id:'forest',   kanji:'森', kun:'もり',   on:'シン',   en:'forest',
        seeAlso:['木'],
        strokes:12, examples:[{word:'森林',reading:'SHINRIN',meaning:'forest'},{word:'森林浴',reading:'SHINRINYOKU',meaning:'forest bathing'},{word:'森の中',reading:'morinonaka',meaning:'in the forest'}] },
      { id:'stone',    kanji:'石', kun:'いし',   on:'セキ',   en:'stone / rock',
        strokes:5, examples:[{word:'石油',reading:'SEKIYU',meaning:'petroleum'},{word:'宝石',reading:'HŌSEKI',meaning:'jewel'},{word:'石橋',reading:'ishibashi',meaning:'stone bridge'}] },
      { id:'rock',     kanji:'岩', kun:'いわ',   on:'ガン',   en:'rock / boulder',
        seeAlso:['山','石'],
        strokes:8, examples:[{word:'岩石',reading:'GANSEKI',meaning:'rock'},{word:'岩山',reading:'iwayama',meaning:'rocky mountain'},{word:'溶岩',reading:'YŌGAN',meaning:'lava'}] },
      { id:'rain',     kanji:'雨', kun:'あめ',   on:'ウ',     en:'rain',
        strokes:8, examples:[{word:'梅雨',reading:'TSUYU',meaning:'rainy season'},{word:'大雨',reading:'ōame',meaning:'heavy rain'},{word:'雨水',reading:'amamizu',meaning:'rainwater'}] },
      { id:'snow',     kanji:'雪', kun:'ゆき',   on:'セツ',   en:'snow',
        seeAlso:['雨'],
        strokes:11, examples:[{word:'雪だるま',reading:'yukidaruma',meaning:'snowman'},{word:'大雪',reading:'ōyuki',meaning:'heavy snow'},{word:'雪国',reading:'yukiguni',meaning:'snow country'}] },
      { id:'bamboo',   kanji:'竹', kun:'たけ',   on:'チク',   en:'bamboo',
        strokes:6, examples:[{word:'竹林',reading:'CHIKURIN',meaning:'bamboo grove'},{word:'竹の子',reading:'takenoko',meaning:'bamboo shoot'},{word:'竹馬',reading:'takeuma',meaning:'stilts'}] },
      { id:'grass',    kanji:'草', kun:'くさ',   on:'ソウ',   en:'grass',
        seeAlso:['茶'],
        strokes:9, examples:[{word:'草原',reading:'SŌGEN',meaning:'grassland'},{word:'草花',reading:'kusabana',meaning:'wildflower'},{word:'雑草',reading:'ZASSŌ',meaning:'weed'}] },
      { id:'insect',   kanji:'虫', kun:'むし',   on:'チュウ', en:'insect · bichinho (pt)',
        strokes:6, examples:[{word:'虫歯',reading:'mushiba',meaning:'cavity'},{word:'昆虫',reading:'KONCHŪ',meaning:'insect'},{word:'害虫',reading:'GAICHŪ',meaning:'pest'}] },
      // 風 (wind) — moved over from the old Sky & Seasons class when
      // that bucket was repurposed for Society. Lives in Nature with
      // the other living/atmospheric kanji (虫, 雨, 雪, etc.).
      { id:'wind',     kanji:'風', kun:'かぜ',   on:'フウ',   en:'wind',
        strokes:9,
        examples:[{word:'台風',reading:'TAIFŪ',meaning:'typhoon'},{word:'風景',reading:'FŪKEI',meaning:'scenery'},{word:'風邪',reading:'kaze',meaning:'cold (illness)'}] },
      // 元 → 元々 → ◆々 → 気 → 元気 cluster — pedagogical staircase to
      // the compound 元気. Both ingredients (元 and 気) and the iteration
      // mark explainer (◆々) land BEFORE the compound, so when the
      // learner reaches 元気 every piece has been individually taught.
      // 気 used to sit at the head of this cluster but moved next to its
      // compound — the back-to-back pairing 気 → 元気 helps the kun→on
      // reading shift land cleanly.
      { id:'origin',   kanji:'元', kun:'もと',   on:'ゲン',   en:'origin / source / former',
        strokes:4,
        seeAlso:['気'],
        notes:'A pictograph of a person\'s head and shoulders — the head is the SOURCE of thought, the place where things begin. As a standalone noun 元 means "origin" or "former" (元の場所, "the original place"). On the on-reading ゲン it pairs with 気 to form 元気 (the energy at one\'s source).',
        examples:[
          {word:'元気',     reading:'GENKI',     meaning:'energetic / well'},
          {word:'元の',     reading:'moto no',   meaning:'original / former'},
          {word:'元日',     reading:'GANJITSU',  meaning:'New Year\'s Day'},
          {word:'地元',     reading:'jimoto',    meaning:'local area, hometown'},
        ] },
      { id:'motomoto', kanji:'元々', kun:'もともと', on:'',    en:'originally / from the start',
        tags:['jougo'],
        seeAlso:['元'],
        notes:'A 畳語 (jōgo) — reduplicate 元 with the 々 iteration mark to intensify it from "origin" into "from the very beginning." Used adverbially: 元々この街で生まれた = "I was born in this town from the start."',
        examples:[
          {word:'元々好きだった',  reading:'motomoto suki datta',  meaning:'I liked it from the start'},
          {word:'元々の予定',      reading:'motomoto no yotei',    meaning:'the original plan'},
          {word:'元々違う',        reading:'motomoto chigau',      meaning:'different from the outset'},
        ] },
      // ◆々 — radical-style explainer for the kanji iteration mark.
      // Not actually a radical (々 has no Unicode CJK code point in the
      // ideographs block and isn't a kanji at all), but the radical card
      // shape is the right vehicle: a teaching interlude that lives
      // between two related kanji and gives the learner a name and
      // mental model for a structural element. The CTA at the bottom
      // jumps to the full 畳語 explainer page in vocab/jougo/intro.
      { id:'noma-mark', type:'radical',
        radical:'々', from:'仝',
        titleJa:'おどりじ', titleEn:'the iteration mark',
        descEn:'々 is the kanji iteration mark — it says "repeat the previous kanji." Not a kanji itself, just a typographic shorthand. Names: 同の字点 (dō-no-jiten, formal), 踊り字 (odoriji, "dancing mark"), ノマ (noma, after its shape ノ + マ). It derives from cursive 仝, an archaic variant of 同 (same). So 人々 reads as "person + same-as-previous" → hitobito. Rendaku usually kicks in (人 hito → 人々 hito-bito).',
        descJa:'「々」は同じ漢字を繰り返すしるし。漢字ではなく、書く手間を省くためのしるし。正式名は「同の字点」、ふつうに「踊り字」、形からは「ノマ」とも呼ぶ。古い「仝」(同のくずし字)からきている。例：人々 = hitobito、時々 = tokidoki、元々 = motomoto。',
        examples:[
          { kanji:'人々', kun:'ひとびと',   on:'',     en:'people (plural)' },
          { kanji:'時々', kun:'ときどき',   on:'',     en:'sometimes' },
          { kanji:'元々', kun:'もともと',   on:'',     en:'originally' },
          { kanji:'山々', kun:'やまやま',   on:'',     en:'mountains' },
          { kanji:'木々', kun:'きぎ',       on:'',     en:'trees' },
          { kanji:'国々', kun:'くにぐに',   on:'',     en:'countries' },
        ],
        tags:['jougo'],
        // CTA renders below the description as a soft gold button. The
        // renderer in app.html reads this object, paints the button, and
        // wires it to navigate the user to the target page on click.
        cta: {
          labelEn: 'Read the full 畳語 essay →',
          labelJa: '畳語をくわしく',
          target: { section:'vocab', vocabClassId:'jougo', vocabBookId:'intro', vocabPageId:'jougo-explainer' },
        },
      },
      { id:'spirit',   kanji:'気', kun:'き',     on:'キ',     en:'spirit / air / energy',
        strokes:6, examples:[{word:'天気',reading:'TENKI',meaning:'weather'},{word:'元気',reading:'GENKI',meaning:'energetic'},{word:'気持ち',reading:'kimochi',meaning:'feeling'}] },
      { id:'genki',    kanji:'元気', kun:'げんき', on:'',     en:'well / fine / energetic / lively',
        seeAlso:['気','元'],
        notes:'元 (gen, origin) + 気 (ki, spirit / energy) — literally "original energy" or "vigorous spirit." It points at the whole package: mental, emotional, and physical life-force. That\'s why お元気ですか? isn\'t just "how are you?" — it\'s asking whether your life-force is intact today. When someone\'s 元気 is low, you offer it back: 元気を出して ("cheer up — get your energy out") or note its absence with 元気ないね ("you don\'t seem yourself").',
        examples:[
          {word:'お元気ですか',     reading:'o-genki desu ka',     meaning:'how are you?'},
          {word:'元気な子供',       reading:'genki na kodomo',     meaning:'energetic child'},
          {word:'元気を出して',     reading:'genki o dashite',     meaning:'cheer up! (lit. let out your energy)'},
          {word:'元気ないね',       reading:'genki nai ne',        meaning:"you don't seem well / energetic"},
        ] },
    ],
  },
  {
    // Society — the bucket that started life as "Sky & Seasons" and got
    // repurposed once the seasons moved over to Time (they really wanted
    // to be next to 何時 / 朝 / 昼 / 夜) and 風 moved back to Nature with
    // 虫 / 雨 / 雪. What stayed are the kanji that describe the human
    // world: 天 / 天気 (the sky as a social phenomenon), 工 / 穴 / 空
    // (worked spaces — the carpenter's-square / cave / dug-out sky
    // cluster), 雲, 花, and the 世 → 界 → 世界 → 世間 spine that names
    // the social world directly. The glyph leads with 世.
    id: 'sky-seasons',
    titleJa: 'しゃかい',
    titleEn: 'Society',
    glyph: '世',
    // Order: 天 → 天気 → 星 → 工 → ◆工 → 穴 → ◆穴 → 空 → 雲 → 花 →
    //        世 → 界 → 世界 → 世間 → 葉.
    cards: [
      { id:'heaven',   kanji:'天', kun:'あめ',   on:'テン',   en:'heaven / sky',
        strokes:4,
        examples:[
          {word:'天気',reading:'TENKI',meaning:'weather'},
          {word:'天才',reading:'TENSAI',meaning:'genius'},
          {word:'天井',reading:'tenjō',meaning:'ceiling'},
        ] },
      // 天気 lands right after 天 as its everyday compound — 天 (sky /
      // heaven) + 気 (spirit / atmosphere / mood) = "the mood of the
      // sky" → weather. Same 気 the learner just met in 元気 over in
      // Nature, so this is the second time it's appearing as the
      // "atmosphere/mood" half of a compound.
      { id:'weather',  kanji:'天気', kun:'てんき', on:'',       en:'weather',
        seeAlso:['天','気'],
        notes:'天 (ten, sky) + 気 (ki, spirit / atmosphere) — literally "the mood of the sky." The same 気 used in 元気 (original-energy → well/fine), here describing the atmosphere itself. 天気予報 (TENKI YOHŌ) is the weather forecast you see on TV; お天気 (with the polite お-) is how it sounds in everyday conversation.',
        examples:[
          {word:'天気予報',  reading:'TENKI YOHŌ',    meaning:'weather forecast'},
          {word:'いい天気',  reading:'ii tenki',      meaning:'nice weather'},
          {word:'お天気は？', reading:'o-tenki wa?',   meaning:'how\'s the weather?'},
        ] },
      // 星 — paired with the sky/atmosphere triplet (天 → 天気 → 星)
      // so the celestial-overhead cluster lands together before we
      // pivot down to the worked-spaces sequence (工 / 穴 / 空).
      { id:'star',     kanji:'星', kun:'ほし',   on:'セイ',   en:'star',
        seeAlso:['日'],
        strokes:9, examples:[{word:'星座',reading:'SEIZA',meaning:'constellation'},{word:'流れ星',reading:'nagareboshi',meaning:'shooting star'},{word:'星空',reading:'hoshizora',meaning:'starry sky'}] },
      // 工 → ◆工 → 穴 → ◆穴 → 空 cluster — follows the default
      // kanji-before-radical rule (commit 601598f). The learner meets
      // the glyph + illustration FIRST, then the radical card lifts
      // the curtain on the structural role it plays. By the time 空
      // arrives, both ingredients have been seen as kanji AND as the
      // shapes-with-jobs they become inside compounds.
      { id:'craft',    kanji:'工', kun:'',       on:'コウ',   en:'work / craft / construction',
        seeAlso:['工'],
        strokes:3,
        notes:'The carpenter\'s-square pictograph — the L-shaped right-angle measuring tool used to mark lumber. As a noun on its own 工 means "work" or "craft" in the industrial sense, appearing almost entirely in compounds. Reads コウ in nearly every compound (工事, 工場, 工業), with the rare 大工 (DAIKU, "big-工" = carpenter) being one of the few that breaks the COW pattern.',
        examples:[
          {word:'工事', reading:'KŌJI',   meaning:'construction work'},
          {word:'工場', reading:'KŌJŌ',   meaning:'factory'},
          {word:'工業', reading:'KŌGYŌ',  meaning:'industry'},
          {word:'大工', reading:'DAIKU',  meaning:'carpenter'},
        ] },
      { id:'takumi-radical', type:'radical',
        radical:'工', from:'工',
        titleJa:'たくみへん', titleEn:'carpenter\'s square',
        descEn:'The same 工 you just met — but now as a structural piece. The carpenter\'s-square pictograph plants itself inside compounds about WORK, CRAFTING, and MAKING — 空 (a hollow dug out by workers → "empty / sky"), 紅 (thread + 工 = the worked red dye → "crimson"), 江 (water + 工 = water-worked-into-a-channel → "river / inlet"), 功 (work + strength → "merit / achievement").',
        descJa:'いま見た「工」を、こんどは漢字の部品として見る。差し金（さしがね）の象形が漢字の中に入ると「仕事・工作・つくる」を表すしるしになる。例：空（穴 + 工、職人が掘り出した空間 → 空っぽ・そら）、紅（糸 + 工、染め上げた赤 → くれない）、江（水 + 工、人が掘った水路 → 入り江）、功（工 + 力、骨折って成し遂げる → てがら）。',
        examples:[
          { kanji:'空', kun:'そら',   on:'クウ', en:'empty / sky' },
          { kanji:'紅', kun:'くれない', on:'コウ', en:'crimson' },
          { kanji:'江', kun:'え',     on:'コウ', en:'creek / inlet' },
          { kanji:'功', kun:'',       on:'コウ', en:'merit / achievement' },
        ] },
      { id:'hole',     kanji:'穴', kun:'あな',   on:'ケツ',   en:'hole / cave / opening',
        seeAlso:['穴'],
        strokes:5,
        notes:'A pictograph of a cave dwelling — 宀 (roof) sitting over 八 (the splayed legs of the entrance). Kun-reading あな dominates everyday speech: 穴 alone just means "a hole," from a small puncture to a literal cave. On-reading ケツ shows up in medical / formal compounds (毛穴 KEANA = pore). Slangy idiom: 穴場 (anaba, "hole-place") = a hidden gem only insiders know.',
        examples:[
          {word:'穴',          reading:'ana',           meaning:'hole'},
          {word:'穴場',        reading:'anaba',         meaning:'hidden gem, secret spot'},
          {word:'落とし穴',    reading:'otoshi-ana',    meaning:'pitfall / trap'},
          {word:'鼻の穴',      reading:'hana no ana',   meaning:'nostril'},
        ] },
      { id:'anakanmuri-radical', type:'radical',
        radical:'穴', from:'穴',
        titleJa:'あなかんむり', titleEn:'cave / hole crown',
        descEn:'The same 穴 you just met — but now as a "crown" (kanmuri) planted on TOP of other compounds. Marks kanji about caves, holes, openings, and hidden interior spaces — 空 (cave + worked-floor 工 = the hollow they dug out → "empty / sky"), 窓 (cave + heart = the opening you peer through → "window"), 究 (cave + nine = digging to the deepest point → "investigate"), 突 (cave + dog = the dog bursts out of the den → "poke / thrust").',
        descJa:'いま見た「穴」を、こんどは「かんむり」として漢字の上にのせる形で見る。穴・あな・すきま・奥まった場所を表す漢字につく。例：空（穴の下に工 → 掘り抜いた空間 → 空っぽ・そら）、窓（穴 + 心 → のぞき見る開口 → まど）、究（穴 + 九 → いちばん奥まで → きわめる）、突（穴 + 犬 → 犬が穴から飛び出す → つく）。',
        examples:[
          { kanji:'空', kun:'そら',   on:'クウ', en:'empty / sky' },
          { kanji:'窓', kun:'まど',   on:'ソウ', en:'window' },
          { kanji:'究', kun:'きわ',   on:'キュウ', en:'investigate deeply' },
          { kanji:'突', kun:'つ',     on:'トツ', en:'poke / thrust' },
        ] },
      // The structural payoff — both ingredients (穴 on top, 工 on
      // the bottom) just landed, so 空 reads as a literal compound
      // rather than a fresh shape. The mnemonic almost writes itself:
      // "workers (工) hollowed out a cave (穴) and left it empty (空)."
      { id:'sky',      kanji:'空', kun:'そら',   on:'クウ',   en:'empty / sky',
        seeAlso:['穴','工'],
        strokes:8,
        notes:'空 = 穴 (cave, on top) + 工 (workers / craftsmanship, underneath). "Workers carved out a cave and left it empty" — so 空 carries both senses: 空っぽ (kara-ppo, empty) and 空 (sora, the sky — that wide empty above us). Same kanji, two opposite-feeling meanings rooted in the same idea of emptiness.',
        examples:[
          {word:'空気',  reading:'KŪKI',     meaning:'air (the empty stuff)'},
          {word:'空港',  reading:'KŪKŌ',     meaning:'airport'},
          {word:'空色',  reading:'sorairo',  meaning:'sky blue'},
          {word:'空っぽ', reading:'kara-ppo', meaning:'empty (colloquial)'},
        ] },
      { id:'cloud',    kanji:'雲', kun:'くも',   on:'ウン',   en:'cloud',
        seeAlso:['雨'],
        strokes:12, examples:[{word:'雨雲',reading:'amagumo',meaning:'rain cloud'},{word:'入道雲',reading:'nyūdōgumo',meaning:'cumulonimbus'},{word:'雲海',reading:'UNKAI',meaning:'sea of clouds'}] },
      { id:'flower',   kanji:'花', kun:'はな',   on:'カ',     en:'flower',
        seeAlso:['茶'],
        strokes:7, examples:[{word:'花火',reading:'hanabi',meaning:'fireworks'},{word:'花見',reading:'hanami',meaning:'flower viewing'},{word:'生け花',reading:'ikebana',meaning:'flower arrangement'}] },
      // 世 → 界 → 世界 → 世間 — the social-world spine of the class.
      // The learner already met 廿 in Numbers as a kanji and as a
      // primitive. Here 世 cashes that pattern in (same 廿 silhouette
      // over a wide base), 界 names "bounded sphere," and the two
      // weld together into 世界 (the geographic world) and 世間 (the
      // social one).
      { id:'generation', kanji:'世', kun:'よ', on:'セイ', en:'world / generation / era',
        seeAlso:['廿'],
        strokes:5,
        notes:'廿 (twenty, the primitive met in Numbers) over a wide base — Heisig reads it as "twenty + ten" stacked, the span of a generation. As a noun on its own 世 means "the world" or "the age one lives in" (この世, "this world"). On the on-reading it pairs widely: 世紀 (a century), 世界 (the world), 中世 (the Middle Ages).',
        examples:[
          {word:'世紀',     reading:'SEIKI',         meaning:'century'},
          {word:'世の中',   reading:'yo-no-naka',    meaning:'society / the world we live in'},
          {word:'二世',     reading:'NISEI',         meaning:'second generation'},
          {word:'中世',     reading:'CHŪSEI',        meaning:'the Middle Ages'},
        ] },
      // 界 — the second ingredient of 世界 (and the one less likely to
      // stand alone in everyday speech). 田 (rice paddy) + 介 (a person
      // wedged between two boundaries) — Heisig reads it as "the
      // person standing between two fields" → boundary, sphere, realm.
      // Once 界 lands, 世界 reads as a compound rather than a fresh
      // shape: 世 (era / world) + 界 (bounded sphere) = "the bounded
      // realm of an era."
      { id:'boundary', kanji:'界', kun:'',     on:'カイ',   en:'boundary / sphere / realm',
        strokes:9,
        notes:'界 alone is rare in everyday Japanese — it mostly lives inside compounds. 田 (rice paddy) over 介 (a person wedged between two strokes) → "the boundary between fields," then extended to any "sphere" or "realm" (academic, business, natural). 世界 (the world), 業界 (an industry / "trade-sphere"), 限界 (the limit), 自然界 (the natural world).',
        examples:[
          {word:'業界',   reading:'GYŌKAI',   meaning:'industry / trade'},
          {word:'限界',   reading:'GENKAI',   meaning:'limit / boundary'},
          {word:'自然界', reading:'SHIZENKAI',meaning:'the natural world'},
          {word:'政界',   reading:'SEIKAI',   meaning:'political world'},
        ] },
      { id:'sekai',    kanji:'世界', kun:'せかい', on:'',       en:'the world',
        seeAlso:['世','界'],
        notes:'世 (sei, world / generation) + 界 (kai, boundary / sphere) — literally "the bounded realm of an era." Where 世 on its own leans toward "society" or "the age," 世界 specifically means the geographic and human world. 世界中 (sekaijuu) means "all over the world"; 世界一 (sekai-ichi) means "the best in the world."',
        examples:[
          {word:'世界中',     reading:'sekai-juu',     meaning:'all over the world'},
          {word:'世界一',     reading:'SEKAI-ICHI',    meaning:'the best in the world'},
          {word:'世界地図',   reading:'SEKAI CHIZU',   meaning:'world map'},
        ] },
      { id:'seken',    kanji:'世間', kun:'せけん', on:'',       en:'society / the public / the world (in the social sense)',
        seeAlso:['世'],
        notes:'世 (sei, world / generation) + 間 (ken, the space-between) — literally "the space between people in this world." If 世界 is the geographic world out there, 世間 is the SOCIAL world: what people say, what "they" think, the court of public opinion. 世間体 (seken-tei) is your appearance to society, 世間話 (seken-banashi) is small talk, and 世間知らず (seken-shirazu, "doesn\'t know the world") is what you call someone naïve about how society actually works.',
        examples:[
          {word:'世間体',       reading:'SEKEN-tei',          meaning:'one\'s appearance to society'},
          {word:'世間話',       reading:'SEKEN-banashi',      meaning:'small talk / chit-chat'},
          {word:'世間知らず',   reading:'SEKEN-shirazu',      meaning:'naïve about the world / unworldly'},
        ] },
      { id:'leaf',     kanji:'葉', kun:'は',     on:'ヨウ',   en:'leaf',
        seeAlso:['木'],
        strokes:12, examples:[{word:'言葉',reading:'kotoba',meaning:'word'},{word:'葉書',reading:'hagaki',meaning:'postcard'},{word:'紅葉',reading:'KŌYŌ',meaning:'autumn leaves'}] },
      // 町 → 寸 → 村 → ◆寸 cluster — closes the Society class with the
      // built-environment that frames social life. 町 (town) and 村
      // (village) bracket the scale; 寸 (sun, the historical Japanese
      // inch and "a small bit") sits between them because it's the
      // structural component of 村 — and once the learner has met it
      // as a kanji, the ◆寸 radical card lifts the curtain on the
      // many other characters it builds (守 protect, 寺 temple, 対
      // versus, 専 specialty, …).
      { id:'town',  kanji:'町', kun:'まち', on:'チョウ', en:'town / city block', strokes:7,
        seeAlso:['田'],
        notes:'町 = 田 (rice paddy) + 丁 (a wooden block / nail). A "town" started as the gridded block of fields that grew into the urban block we still call 町 — every Japanese city is divided into 町, and addresses run NNN番地, M丁目, X町 from the inside out. Kun-reading まち covers the everyday "town" sense; on-reading チョウ shows up in administrative compounds (町長, 町内会, 下町).',
        examples:[
          {word:'町',       reading:'machi',        meaning:'town / neighborhood'},
          {word:'町内',     reading:'CHŌNAI',       meaning:'within the neighborhood'},
          {word:'下町',     reading:'shitamachi',   meaning:'old downtown / "low town"'},
          {word:'町長',     reading:'CHŌCHŌ',       meaning:'town mayor'},
        ] },
      // 寸 (sun) — the historical Japanese inch (~3 cm), built as a
      // pictograph of a hand with a thumb marking a small distance.
      // Survives in modern Japanese mostly as "a little / a bit" and
      // in set expressions; the on-reading スン is what almost every
      // compound uses. Pedagogically it lands HERE because it's the
      // right half of 村 (next card) — meeting the part first lets
      // the village land as a real compound rather than a fresh
      // shape.
      { id:'sun',   kanji:'寸', kun:'',     on:'スン',   en:'sun (small unit) / a bit', strokes:3,
        notes:'寸 = a pictograph of a hand with the thumb marking a small distance from the wrist — historically the Japanese "inch" (one 寸 ≈ 3 cm). Almost never appears alone in modern Japanese; survives in idioms and measure-words. 一寸 (issun) is "one sun" or "a tiny bit" — 一寸法師 (Issun-bōshi) is the inch-high folktale hero, the Japanese Tom Thumb. 寸前 (sunzen) is "just before" — literally "a bit in front of." As a primitive it shows up in 村 (next card), 守 (protect), 寺 (temple), 対 (versus), 専 (specialty).',
        examples:[
          {word:'寸法',     reading:'SUNPŌ',        meaning:'dimensions / measurements'},
          {word:'一寸',     reading:'CHOTTO',       meaning:'a little / just a moment (also issun)'},
          {word:'寸前',     reading:'SUNZEN',       meaning:'just before / on the verge of'},
          {word:'寸劇',     reading:'SUNGEKI',      meaning:'a short skit / sketch'},
        ] },
      // 村 — once 寸 has landed, this reads as a compound: 木 (tree)
      // + 寸 (a hand measuring / a small bit) = "the place where
      // trees are measured" → the village. The compound IS the
      // mnemonic; Heisig's "tree + glue" version works too if you
      // prefer.
      { id:'village', kanji:'村', kun:'むら', on:'ソン', en:'village', strokes:7,
        seeAlso:['木', '寸'],
        notes:'村 = 木 (tree) + 寸 (the small-measure / hand-tool primitive met just above). Read it as "the place where the trees are measured out" — the village as the human-scale clearing inside the forest. Kun-reading むら is the everyday word; on-reading ソン shows up in administrative compounds (村長, 農村, 漁村). The 〜村 suffix is still the legal unit of "village" in Japanese local government, ranked just below 〜町.',
        examples:[
          {word:'村',       reading:'mura',         meaning:'village'},
          {word:'村人',     reading:'murabito',     meaning:'villager'},
          {word:'村長',     reading:'SONCHŌ',       meaning:'village headman'},
          {word:'農村',     reading:'NŌSON',        meaning:'farming village'},
        ] },
      // 寺 — second 寸-compound in a row. 土 (earth) + 寸 (the hand
      // primitive just met) = "the earth-place where hands serve"
      // → temple. The pair 村 → 寺 makes the 寸 primitive land
      // twice in immediate succession before the radical card
      // pulls the curtain back. Kun-reading てら is the everyday
      // word (お寺 with the honorific お- is how you'll hear it);
      // on-reading ジ shows up in formal / administrative compounds
      // (寺院, 寺社).
      { id:'temple', kanji:'寺', kun:'てら', on:'ジ', en:'temple', strokes:6,
        seeAlso:['土', '寸'],
        notes:'寺 = 土 (earth) + 寸 (hand-measure / small-unit primitive). Read it as "the earth-place where hands serve" — temple. The everyday word is お寺 (otera) with the polite お- prefix; bare てら sounds blunt. On-reading ジ binds to formal compounds: 寺院 (a temple complex), 寺社 (temples + shrines together), 山寺 (a mountain temple).',
        examples:[
          {word:'お寺',     reading:'otera',         meaning:'temple (everyday)'},
          {word:'寺院',     reading:'JIIN',          meaning:'temple / temple complex'},
          {word:'寺社',     reading:'JISHA',         meaning:'temples and shrines'},
          {word:'山寺',     reading:'yamadera',      meaning:'mountain temple'},
        ] },
      // ◆寸 — radical-style explainer. Same 寸 the learner just met
      // as a kanji, but now as a structural piece sitting INSIDE
      // other characters. Examples picked for variety of position
      // (right side / underneath / right with company) so the
      // learner sees the primitive in multiple contexts.
      { id:'sun-radical', type:'radical',
        radical:'寸', from:'寸',
        titleJa:'すん', titleEn:'small-measure radical',
        descEn:'The same 寸 you just met — but now as a piece inside other characters. The hand-with-thumb pictograph plants itself inside compounds about doing-something-with-the-hand, measuring, holding, and human-scale control. 村 (tree + 寸 = village), 守 (roof + 寸 = the hand under the roof protects), 寺 (the earth-place where hands serve = temple), 対 (text + 寸 = opposing / versus).',
        descJa:'いま見た「寸」を、漢字の中の部品として見る。手で何かをはかる・つかむ・治めるという意味のしるしになる。例：村（木 + 寸、木を測る場所 → 村）、守（宀 + 寸、屋根の下で手を尽くす → まもる）、寺（土 + 寸、手を尽くす場所 → てら）、対（文 + 寸、手で向き合う → たい）。',
        examples:[
          { kanji:'村', kun:'むら', on:'ソン', en:'village' },
          { kanji:'守', kun:'まも', on:'シュ', en:'protect / guard' },
          { kanji:'寺', kun:'てら', on:'ジ',   en:'temple' },
          { kanji:'対', kun:'',    on:'タイ', en:'versus / opposite' },
        ] },
      // 京 closes the Society class — the kanji for "capital" extends
      // the social-world thread one rung higher (from town 町 to
      // village 村 to capital 京). Pictograph of a tall building on
      // a hill, the seat of the emperor. Surfaces in 東京 / 京都 /
      // 北京 — the three major capitals the learner already half-
      // recognizes from romaji.
      { id:'capital', kanji:'京', kun:'みやこ', on:'キョウ', en:'capital city', strokes:8,
        notes:'京 is a pictograph of a tall building on a hill — the imperial residence, the historical capital. Two on-readings: キョウ in Japanese contexts (東京, 京都) and ケイ in some compounds (京阪 Kei-Han = the Kyoto-Osaka corridor). The 京 of "capital" also extends to "of Kyoto" in compounds like 京風 (Kyoto-style) and 京野菜 (Kyoto vegetables). Closes the Society class because the capital sits at the top of the 町 → 村 → 京 social hierarchy you\'ve been building.',
        examples:[
          {word:'東京',     reading:'TŌKYŌ',         meaning:'Tokyo ("eastern capital")'},
          {word:'京都',     reading:'KYŌTO',         meaning:'Kyoto ("capital metropolis")'},
          {word:'北京',     reading:'PEKIN',         meaning:'Beijing ("northern capital")'},
          {word:'京野菜',   reading:'KYŌ-yasai',     meaning:'Kyoto-grown vegetables'},
        ] },
    ],
  },
  {
    id: 'time',
    titleJa: 'とき',
    titleEn: 'Time',
    glyph: '今',
    // Order: 今 分 時 半 年 [7 day cards] 曜 ◆曜 後 春 夏 秋 冬 何 早 遅 朝 昼 夕 夜 前 先.
    // 今 leads — same kanji as the class glyph, the broad "now" frame
    // that anchors the rest of the deck. Then 分 → 時 (the smaller
    // unit teaches the bigger one — same 半 + 分 pattern that gives
    // 半分). 来 carved out for Verbs (Task 16). 秒 / 昨日 dropped.
    // 前 / 先 closing the class on purpose: both are bidirectional
    // time/space markers that read most cleanly once the learner has
    // met the whole calendar — 午前 / 先週 / 先月 / 名前 collapse into
    // place at the end rather than sitting awkwardly between 年 and
    // the seven days where they were originally introduced.
    cards: [
      { id:'now',      kanji:'今', kun:'いま',     on:'コン',   en:'now / present', strokes:4,
        usage:{ ja:'今日', kana:'きょう' },
        notes:'今 (kon, now) + 日 (nichi, day) gives 今日 (kyō, today) — a jukujikun where both kanji collapse into きょう. The same 今- prefix gives this-week / this-month / this-year.',
        examples:[
          {word:'今すぐ',reading:'ima sugu',meaning:'right now'},
          {word:'今夜',reading:'KONYA',meaning:'tonight'},
          {word:'今度',reading:'KONDO',meaning:'next time / this time'},
          {word:'今週',reading:'konshū',meaning:'this week'},
          {word:'今月',reading:'kongetsu',meaning:'this month'},
          {word:'今年',reading:'kotoshi',meaning:'this year'},
        ] },
      { id:'minute',   kanji:'分', kun:'わ',       on:'フン',   en:'minute / part / understand', strokes:4,
        notes:'分 has a wide range — minutes (一分 ippun), portions (半分 hanbun "half"), and understanding (分かる wakaru "to understand"). The on-reading shifts: フン / プン after small-tsu, ブン for portions.',
        examples:[
          {word:'一分',reading:'IPPUN',meaning:'one minute'},
          {word:'十分',reading:'JIPPUN',meaning:'ten minutes (also JŪBUN = enough)'},
          {word:'半分',reading:'HANBUN',meaning:'half'},
          {word:'自分',reading:'JIBUN',meaning:'oneself'},
          {word:'気分',reading:'KIBUN',meaning:'mood / feeling'},
          {word:'分かる',reading:'wakaru',meaning:'to understand'},
        ] },
      // 時 lands right after 分 — the learner just met "minute" and now
      // gets the larger unit that contains 60 of them. The 一時 / 何時
      // examples below carry straight over to telling time.
      { id:'hour',     kanji:'時', kun:'とき',     on:'ジ',     en:'hour / time', strokes:10,
        seeAlso:['日'],
        examples:[{word:'時間',reading:'JIKAN',meaning:'time / hours'},{word:'何時',reading:'NANJI',meaning:'what time'},{word:'一時',reading:'ICHIJI',meaning:'one o\'clock'}] },
      // 半 is cross-listed with Numbers (ALLOWED_DUPLICATES includes 半).
      { id:'half', kanji:'半', kun:'なか.ば', on:'ハン', en:'half', strokes:5,
        examples:[
          {word:'半分', reading:'HANBUN',  meaning:'half'},
          {word:'半年', reading:'HANTOSHI', meaning:'half a year'},
          {word:'半額', reading:'HANGAKU', meaning:'half price'},
        ] },
      { id:'year', kanji:'年', kun:'とし', on:'ネン', en:'year', strokes:6,
        examples:[
          {word:'毎年',   reading:'MAINEN',  meaning:'every year'},
          {word:'今年',   reading:'kotoshi', meaning:'this year'},
          {word:'来年',   reading:'RAINEN',  meaning:'next year'},
        ] },
      // 7 days of the week — three-glyph compounds anchored by 曜 (the
      // "day-of-week" connector) sandwiched between an elemental kanji
      // (日 月 火 水 木 金 土) and a final 日. The pattern matches the
      // Five-Elements + Sun + Moon planetary days carried over from
      // classical Chinese astronomy. Order: Sunday first, following
      // the JIS-standard week start. Each card carries one note —
      // the elemental association and the rōmaji nuance for that day.
      { id:'nichiyoubi', kanji:'日曜日', kun:'にちようび', on:'',  en:'Sunday',
        seeAlso:['日'],
        notes:'日 (nichi, sun) + 曜 (yō, day-of-the-week) + 日 (bi, day) → "sun-day-day," a.k.a. Sunday. The pattern repeats for the other six days, each starting with a different elemental kanji (月 moon, 火 fire/Mars, 水 water/Mercury, 木 wood/Jupiter, 金 metal/Venus, 土 earth/Saturn) — the same planet-day mapping that gave English Sun-day, Mon-day, Sat-urn-day.',
        examples:[
          {word:'日曜日',       reading:'NICHIYŌBI',         meaning:'Sunday'},
          {word:'毎週日曜日',   reading:'maishū nichiyōbi',  meaning:'every Sunday'},
          {word:'日曜大工',     reading:'NICHIYŌ-DAIKU',     meaning:'DIY (lit. "Sunday carpenter")'},
        ] },
      { id:'getsuyoubi', kanji:'月曜日', kun:'げつようび', on:'',  en:'Monday',
        seeAlso:['月'],
        notes:'月 (getsu, moon) + 曜 (yō) + 日 (bi) → Monday, "moon-day." Same pattern as English Mon-day (from Old English Mōnandæg, "moon\'s day").',
        examples:[
          {word:'月曜日',       reading:'GETSUYŌBI',         meaning:'Monday'},
          {word:'月曜から金曜', reading:'getsuyō kara kin\'yō', meaning:'Monday through Friday'},
          {word:'先月曜日',     reading:'sen-GETSUYŌBI',     meaning:'last Monday'},
        ] },
      { id:'kayoubi', kanji:'火曜日', kun:'かようび', on:'',  en:'Tuesday',
        seeAlso:['火'],
        notes:'火 (ka, fire) + 曜 + 日 → Tuesday. The elemental match is the planet Mars (火星, kasei, the "fire star"), matching English Tues-day from Norse Tiw, the god of war whom the Romans equated with Mars.',
        examples:[
          {word:'火曜日',       reading:'KAYŌBI',            meaning:'Tuesday'},
          {word:'火曜の朝',     reading:'KAYŌ no asa',       meaning:'Tuesday morning'},
          {word:'今度の火曜日', reading:'kondo no KAYŌBI',   meaning:'next Tuesday'},
        ] },
      { id:'suiyoubi', kanji:'水曜日', kun:'すいようび', on:'',  en:'Wednesday',
        seeAlso:['水'],
        notes:'水 (sui, water) + 曜 + 日 → Wednesday. Matches the planet Mercury (水星, suisei, the "water star") — same as French mercredi (Mercury\'s day).',
        examples:[
          {word:'水曜日',       reading:'SUIYŌBI',           meaning:'Wednesday'},
          {word:'水曜の夜',     reading:'SUIYŌ no yoru',     meaning:'Wednesday night'},
          {word:'水曜定休日',   reading:'SUIYŌ TEIKYŪBI',    meaning:'closed on Wednesdays'},
        ] },
      { id:'mokuyoubi', kanji:'木曜日', kun:'もくようび', on:'',  en:'Thursday',
        seeAlso:['木'],
        notes:'木 (moku, wood/tree) + 曜 + 日 → Thursday. The planet is Jupiter (木星, mokusei, the "wood star") — and Thurs-day in English is Thor\'s day, the Norse equivalent of Jupiter.',
        examples:[
          {word:'木曜日',       reading:'MOKUYŌBI',          meaning:'Thursday'},
          {word:'木曜の午後',   reading:'MOKUYŌ no GOGO',    meaning:'Thursday afternoon'},
          {word:'毎週木曜日',   reading:'maishū MOKUYŌBI',   meaning:'every Thursday'},
        ] },
      { id:'kinyoubi', kanji:'金曜日', kun:'きんようび', on:'',  en:'Friday',
        seeAlso:['金'],
        notes:'金 (kin, metal/gold) + 曜 + 日 → Friday. The planet is Venus (金星, kinsei, the "gold star") — same as French vendredi (Venus\' day) or Italian venerdì.',
        examples:[
          {word:'金曜日',       reading:'KIN\'YŌBI',         meaning:'Friday'},
          {word:'花の金曜日',   reading:'hana no KIN\'YŌBI', meaning:'TGIF (lit. "flowery Friday")'},
          {word:'金曜の夜',     reading:'KIN\'YŌ no yoru',   meaning:'Friday night'},
        ] },
      { id:'doyoubi', kanji:'土曜日', kun:'どようび', on:'',  en:'Saturday',
        seeAlso:['土'],
        notes:'土 (do, earth/soil) + 曜 + 日 → Saturday. The planet is Saturn (土星, dosei, the "earth star") — and Sat-urn-day in English IS Saturn\'s day. The whole week closes the loop: every day of the Japanese week pairs with the same planet as its Romance / Germanic counterpart.',
        examples:[
          {word:'土曜日',       reading:'DOYŌBI',            meaning:'Saturday'},
          {word:'土曜の昼',     reading:'DOYŌ no hiru',      meaning:'Saturday noon'},
          {word:'土日',         reading:'DONICHI',           meaning:'the weekend (Sat + Sun)'},
        ] },
      // 曜 — the day-of-the-week marker the learner has now met seven
      // times. We surface it as its own kanji card right after the
      // seven days so the closed-set framing lands: every appearance
      // of 曜 in plain Japanese is one of those seven names plus a
      // small set of celestial-body compounds. The ◆曜 radical card
      // that follows decomposes the glyph (日 + 翟) and names the
      // mnemonic.
      { id:'you', kanji:'曜', kun:'', on:'ヨウ', en:'day of the week / shining',
        seeAlso:['日'],
        strokes:18,
        notes:'曜 alone almost never appears in modern Japanese — it lives inside the seven 曜日 names and a small set of celestial-body words. Etymology: 日 (sun) + 翟 (a long-tailed bird) → "shines bright like a sun-bird" → celestial body → day of the week. The right half 翟 is rare and basically lives inside this character; you only need to recognize 曜, not write it from scratch.',
        examples:[
          {word:'曜日',     reading:'YŌBI',          meaning:'day of the week'},
          {word:'七曜',     reading:'SHICHIYŌ',      meaning:'the seven celestial bodies / days of the week'},
          {word:'何曜日',   reading:'NANIYŌBI',      meaning:'what day of the week?'},
        ] },
      // ◆曜 — radical-style explainer. The kanji-before-radical rule
      // holds: meet 曜 as a kanji first, then the radical card lifts
      // the curtain on the seven-slot closed set. Pedagogically this
      // is the "you've already met every appearance of this character"
      // reveal — once the learner sees the chip row of all seven
      // day names, the daunting 18-stroke glyph collapses into a
      // memorable closed set.
      { id:'you-radical', type:'radical',
        // 'from' carries two components: 日 (sun, the meaning radical
        // on the left) and 隹 (short-tailed bird, the recognizable
        // piece sitting inside the right-half 翟). The renderer in
        // app.html handles array form by joining glyphs with a + sep.
        radical:'曜', from:['日', '隹'],
        titleJa:'よう', titleEn:'day-of-the-week marker',
        descEn:'曜 = 日 (sun) + 翟 (long-tailed bird, which contains 隹 "short-tailed bird") — historically "shines bright like a sun-bird," narrowed to "celestial body" → day of the week. You don\'t need to memorize this character in isolation: it appears in only seven words in everyday Japanese — the seven days you just learned. After meeting all seven, you\'ve seen 曜 seven times, which is enough.',
        descJa:'「曜」は 日（太陽）＋ 翟（尾の長い鳥、中に「隹」を含む）から成る — もとは「太陽の鳥のように輝く」、そこから「天体」「曜日」へ。右側の「翟」は単独ではほとんど使わない。実用上は七つの曜日のなかでしか出会わないので、その七つを覚えれば「曜」も自然に身についている。',
        // Render the 7 example day names as image-first cards using
        // the same illustrations from the Days & Time basics page.
        // The renderer probes images/kanji/<compound>.webp for each
        // example.kanji when this flag is set.
        examplesAsImageCards: true,
        examples:[
          { kanji:'日曜日', kun:'にちようび', on:'',  en:'Sunday' },
          { kanji:'月曜日', kun:'げつようび', on:'',  en:'Monday' },
          { kanji:'火曜日', kun:'かようび',   on:'',  en:'Tuesday' },
          { kanji:'水曜日', kun:'すいようび', on:'',  en:'Wednesday' },
          { kanji:'木曜日', kun:'もくようび', on:'',  en:'Thursday' },
          { kanji:'金曜日', kun:'きんようび', on:'',  en:'Friday' },
          { kanji:'土曜日', kun:'どようび',   on:'',  en:'Saturday' },
        ] },
      { id:'after', kanji:'後', kun:'うし', on:'ゴ', en:'after / behind', strokes:9,
        examples:[
          {word:'後',   reading:'ato',  meaning:'later / after'},
          {word:'午後', reading:'GOGO', meaning:'afternoon / PM'},
          {word:'最後', reading:'SAIGO', meaning:'last / final'},
        ] },
      // 春夏秋冬 — the four seasons. Moved over from the old Sky &
      // Seasons class (now Society) because the seasons are time
      // markers more than weather: they live alongside 朝 / 昼 / 夕 /
      // 夜 (parts of the day) and 年 / 月 / 週 (longer time spans).
      // Calendar order: spring → summer → autumn → winter.
      { id:'spring',   kanji:'春', kun:'はる',   on:'シュン', en:'spring',
        strokes:9, examples:[{word:'春分',reading:'SHUNBUN',meaning:'spring equinox'},{word:'春休み',reading:'haruyasumi',meaning:'spring break'},{word:'青春',reading:'SEISHUN',meaning:'youth'}] },
      { id:'summer',   kanji:'夏', kun:'なつ',   on:'カ',     en:'summer',
        strokes:10, examples:[{word:'夏休み',reading:'natsuyasumi',meaning:'summer break'},{word:'夏至',reading:'GESHI',meaning:'summer solstice'},{word:'真夏',reading:'manatsu',meaning:'midsummer'}] },
      { id:'autumn',   kanji:'秋', kun:'あき',   on:'シュウ', en:'autumn',
        seeAlso:['火'],
        strokes:9, examples:[{word:'秋分',reading:'SHŪBUN',meaning:'autumn equinox'},{word:'秋風',reading:'akikaze',meaning:'autumn breeze'},{word:'秋田',reading:'AKITA',meaning:'Akita'}] },
      { id:'winter',   kanji:'冬', kun:'ふゆ',   on:'トウ',   en:'winter',
        strokes:5, examples:[{word:'冬休み',reading:'fuyuyasumi',meaning:'winter break'},{word:'冬至',reading:'TŌJI',meaning:'winter solstice'},{word:'冬眠',reading:'TŌMIN',meaning:'hibernation'}] },
      { id:'what', kanji:'何', kun:'なに', on:'カ', en:'what / how many', strokes:7,
        examples:[
          {word:'何時', reading:'NANJI',  meaning:'what time'},
          {word:'何人', reading:'NANNIN', meaning:'how many people'},
          {word:'何か', reading:'nanika', meaning:'something'},
        ] },
      { id:'early',    kanji:'早', kun:'はや',     on:'ソウ',   en:'early / fast', strokes:6, examples:[{word:'早朝',reading:'SŌCHŌ',meaning:'early morning'},{word:'早い',reading:'hayai',meaning:'early'},{word:'早起き',reading:'hayaoki',meaning:'early rising'}] },
      { id:'late',     kanji:'遅', kun:'おそ',     on:'チ',     en:'late / slow', strokes:12,
        examples:[{word:'遅刻',reading:'CHIKOKU',meaning:'lateness / tardiness'},{word:'遅い',reading:'osoi',meaning:'late / slow'},{word:'遅れる',reading:'okureru',meaning:'to be late / fall behind'}] },
      { id:'morning', kanji:'朝', kun:'あさ', on:'チョウ', en:'morning', strokes:12,
        seeAlso:['月'],
        examples:[
          {word:'朝',     reading:'asa',       meaning:'morning'},
          {word:'今朝',   reading:'kesa',      meaning:'this morning'},
          {word:'朝食',   reading:'CHŌSHOKU',  meaning:'breakfast'},
        ] },
      { id:'noon',     kanji:'昼', kun:'ひる',     on:'チュウ', en:'noon / daytime', strokes:9,
        examples:[{word:'昼食',reading:'CHŪSHOKU',meaning:'lunch (formal)'},{word:'昼ご飯',reading:'hiru gohan',meaning:'lunch'},{word:'真昼',reading:'mahiru',meaning:'midday / broad daylight'}] },
      { id:'evening',  kanji:'夕', kun:'ゆう',     on:'セキ',   en:'evening', strokes:3, examples:[{word:'夕方',reading:'yūgata',meaning:'evening'},{word:'夕日',reading:'yūhi',meaning:'sunset'},{word:'夕食',reading:'YŪSHOKU',meaning:'dinner'}] },
      { id:'night', kanji:'夜', kun:'よる', on:'ヤ', en:'night', strokes:8,
        examples:[
          {word:'夜',     reading:'yoru',    meaning:'night'},
          {word:'今夜',   reading:'KON\'YA', meaning:'tonight'},
          {word:'夜中',   reading:'yonaka',  meaning:'midnight'},
        ] },
      // 前 / 先 — closing pair. Both are bidirectional markers that
      // span time and space (前 = before/in-front; 先 = ahead/previous/
      // tip), so they sit best at the end of the class, after the
      // calendar (年 / 7 days / seasons / parts-of-day) has fully
      // taught the time axis. 前 first because 午前 ↔ 午後 is the
      // cleanest hand-off from the just-met 後; 先 closes the deck
      // with 先生 — the honorific that quietly reframes the whole
      // class as a teacher-student transaction.
      { id:'before', kanji:'前', kun:'まえ', on:'ゼン', en:'before / front', strokes:9,
        examples:[
          {word:'前',   reading:'mae',  meaning:'before / in front'},
          {word:'午前', reading:'GOZEN', meaning:'morning / AM'},
          {word:'名前', reading:'namae', meaning:'name'},
        ] },
      { id:'ahead',    kanji:'先', kun:'さき',     on:'セン',   en:'ahead / previous / tip', strokes:6,
        usage:{ ja:'先生', kana:'せんせい' },
        notes:'先 (sen, ahead) + 生 (sei, life) gives 先生 (sensei) — "one born ahead in life." Honorific for teachers, doctors, professors, and respected experts. Also marks past time: 先週 (last week), 先月 (last month).',
        examples:[{word:'先生',reading:'SENSEI',meaning:'teacher'},{word:'先月',reading:'SENGETSU',meaning:'last month'},{word:'先端',reading:'SENTAN',meaning:'cutting edge'}] },
    ],
  },
  {
    id: 'school',
    titleJa: 'がっこう',
    titleEn: 'School',
    glyph: '学',
    // Order: 宀 → ◆宀 → 字 → 学 → 校 → 文 → 名 → 言 → ◆言 → 話 → 読 → 書 → 本 → 生.
    //
    // Kanji-before-radical applies to 宀 too now (was previously the
    // ◆宀 → 宀 exception). The standalone glyph + illustration lands
    // first; the radical card then names the role it plays under the
    // roofs of 家, 室, 宿, 守. 字 still lives right after the radical
    // lesson because 字 IS 宀 + 子 (child under a roof learning a
    // character) — both ingredients have been seen by the time 字
    // arrives, and 学 (which does NOT use 宀) reads cleanly as
    // contrast against the cluster.
    //
    // Same pattern as 言 → ◆言 → 話 / 読 (gonben below) and 手 → ◆扌
    // → 持 / 打 over in Body. Kanji is the source, radical reveals
    // the embedding.
    cards: [
      // 宀 as a standalone learner card — the radical's pictograph
      // taught first so the illustration lands. Image lives at
      // images/kanji/宀.webp; back-face stroke order is the natural
      // 3-stroke roof shape.
      { id:'roof',     kanji:'宀', kun:'うかんむり', on:'',       en:'roof / crown / cap (radical)',
        strokes:3,
        examples:[
          {word:'家',     reading:'ie',    meaning:'house (uses 宀 as roof)'},
          {word:'室',     reading:'shitsu', meaning:'room'},
          {word:'宿',     reading:'yado',  meaning:'inn / lodging'},
        ] },
      { id:'ukanmuri-radical', type:'radical',
        radical:'宀', from:'宀',
        titleJa:'うかんむり', titleEn:'roof / cap',
        descEn:'The same 宀 you just met — but now as a structural piece. A roof in profile (left wall, gabled top, right wall) plants itself on top of compound kanji to mark "things that happen under a roof": houses, rooms, family life, shelter from the elements.',
        descJa:'いま見た「宀」を、こんどは漢字の部品として見る。横から見た屋根のかたちが漢字の上にのって、家・部屋・家族・しのぎの場—屋根の下で起きること—を表す漢字につく。',
        examples:[
          { kanji:'家', kun:'いえ', on:'カ',  en:'house / home' },
          { kanji:'室', kun:'むろ', on:'シツ', en:'room' },
          { kanji:'宿', kun:'やど', on:'シュク', en:'lodging / inn' },
          { kanji:'守', kun:'まも', on:'シュ', en:'protect / keep' },
        ] },
      { id:'character', kanji:'字', kun:'じ',     on:'ジ',     en:'character / letter',
        seeAlso:['子','宀'],
        strokes:6,
        examples:[
          {word:'文字',reading:'MOJI',meaning:'character'},
          {word:'漢字',reading:'KANJI',meaning:'kanji'},
          {word:'数字',reading:'SŪJI',meaning:'number'},
        ] },
      { id:'learn',    kanji:'学', kun:'まな',     on:'ガク',   en:'learn / study',
        seeAlso:['子'], strokes:8, examples:[{word:'学校',reading:'GAKKŌ',meaning:'school'},{word:'学生',reading:'GAKUSEI',meaning:'student'},{word:'学ぶ',reading:'manabu',meaning:'to learn'}] },
      { id:'school',   kanji:'校', kun:'',         on:'コウ',   en:'school',
        seeAlso:['木'],
        strokes:10, examples:[{word:'学校',reading:'GAKKŌ',meaning:'school'},{word:'校長',reading:'KŌCHŌ',meaning:'principal'},{word:'高校',reading:'KŌKŌ',meaning:'high school'}] },
      { id:'writing',  kanji:'文', kun:'ふみ',     on:'ブン',   en:'writing / text / culture', strokes:4, examples:[{word:'文化',reading:'BUNKA',meaning:'culture'},{word:'文学',reading:'BUNGAKU',meaning:'literature'},{word:'文字',reading:'MOJI',meaning:'character'}] },
      { id:'name',     kanji:'名', kun:'な',       on:'メイ',   en:'name / fame', strokes:6, examples:[{word:'名前',reading:'namae',meaning:'name'},{word:'名人',reading:'MEIJIN',meaning:'master'},{word:'有名',reading:'YŪMEI',meaning:'famous'}] },
      { id:'say', kanji:'言', kun:'い', on:'ゲン', en:'say / word', strokes:7,
        seeAlso:['口'],
        examples:[
          {word:'言う',   reading:'iu',    meaning:'to say'},
          {word:'言葉',   reading:'kotoba', meaning:'word / language'},
          {word:'方言',   reading:'HŌGEN', meaning:'dialect'},
        ] },
      // 言 (standalone) introduced FIRST, then ◆言 shows how it tucks
      // onto the left side of compounds. Same rule as 手 → ◆扌 in Body:
      // teach the kanji, THEN reveal the radical role it plays.
      { id:'gonben-radical', type:'radical',
        radical:'言', from:'言',
        titleJa:'ごんべん', titleEn:'left-side speech',
        descEn:'When 言 (say / word) lives on the left side of a compound, it keeps its full shape — the rectangular speech-marks stacked above an open mouth (口). Marks kanji about saying, asking, reading, naming, recording.',
        descJa:'「言」が漢字の左がわに立つときも、形はそのまま。口の上に積まれた言葉のかたち。話す、訊く、読む、名づける、記すこと—言葉に関する漢字につく。',
        examples:[
          { kanji:'話', kun:'はな', on:'ワ',   en:'talk / story' },
          { kanji:'読', kun:'よ',   on:'ドク', en:'read' },
          { kanji:'語', kun:'かた', on:'ゴ',   en:'language / tell' },
          { kanji:'記', kun:'しる', on:'キ',   en:'record / chronicle' },
        ] },
      { id:'talk', kanji:'話', kun:'はな', on:'ワ', en:'talk / story', strokes:13,
        seeAlso:['言'],
        examples:[
          {word:'話す',   reading:'hanasu', meaning:'to speak'},
          {word:'電話',   reading:'DENWA',  meaning:'telephone'},
          {word:'会話',   reading:'KAIWA',  meaning:'conversation'},
        ] },
      { id:'read', kanji:'読', kun:'よ', on:'ドク', en:'read', strokes:14,
        seeAlso:['言'],
        examples:[
          {word:'読む',   reading:'yomu',     meaning:'to read'},
          {word:'読書',   reading:'DOKUSHO',  meaning:'reading (a book)'},
          {word:'音読',   reading:'ONDOKU',   meaning:'reading aloud'},
        ] },
      { id:'write',    kanji:'書', kun:'か',       on:'ショ',   en:'write / book / calligraphy',
        seeAlso:['日'],
        strokes:10,
        examples:[
          {word:'読書',reading:'DOKUSHO',meaning:'reading books'},
          {word:'書道',reading:'SHODŌ',meaning:'calligraphy'},
          {word:'書く',reading:'kaku',meaning:'to write'},
        ] },
    ],
  },
  {
    id: 'colors',
    titleJa: 'いろ',
    titleEn: 'Colors',
    glyph: '色',
    cards: [
      { id:'color',    kanji:'色', kun:'いろ',     on:'シキ',   en:'color', strokes:6,
        notes:'The base "color" kanji. Appears as the trailing 色 in compound color names (黄色, 茶色, 灰色, 水色) where it pairs with another kanji that names the hue.',
        examples:[{word:'色々',reading:'iroiro',meaning:'various / all sorts'},{word:'色紙',reading:'SHIKISHI',meaning:'colored paper'},{word:'景色',reading:'KESHIKI',meaning:'scenery'}] },
      { id:'white',    kanji:'白', kun:'しろ',     on:'ハク',   en:'white', swatch:'#ffffff', strokes:5, examples:[{word:'白紙',reading:'HAKUSHI',meaning:'blank paper'},{word:'白黒',reading:'SHIROKURO',meaning:'black and white'},{word:'白鳥',reading:'HAKUCHŌ',meaning:'swan'}] },
      { id:'black',    kanji:'黒', kun:'くろ',     on:'コク',   en:'black', swatch:'#111111', strokes:11, examples:[{word:'黒板',reading:'KOKUBAN',meaning:'blackboard'},{word:'黒い猫',reading:'kuroi neko',meaning:'black cat'},{word:'黒字',reading:'KUROJI',meaning:'surplus / in the black'}] },
      { id:'red',      kanji:'赤', kun:'あか',     on:'セキ',   en:'red', swatch:'#c0302a', strokes:7, examples:[{word:'赤ちゃん',reading:'akachan',meaning:'baby'},{word:'赤道',reading:'SEKIDŌ',meaning:'equator'},{word:'赤字',reading:'AKAJI',meaning:'deficit'}] },
      { id:'blue',     kanji:'青', kun:'あお',     on:'セイ',   en:'blue / green', swatch:'#2563a0', strokes:8, examples:[{word:'青空',reading:'aozora',meaning:'blue sky'},{word:'青年',reading:'SEINEN',meaning:'youth'},{word:'青春',reading:'SEISHUN',meaning:'springtime of life'}] },
      { id:'yellow',   kanji:'黄', kun:'き',    on:'コウ',   en:'yellow', swatch:'#d4a017', strokes:11,
        usage:{ ja:'黄色', kana:'きいろ' },
        notes:'黄色 [kiiro] is a compound: 黄 [ki] (yellow) + 色 [iro] (color). The i-adjective form is 黄色い [kiiroi].',
        examples:[{word:'黄色',reading:'kiiro',meaning:'yellow'},{word:'黄色い花',reading:'kiiroi hana',meaning:'yellow flower'},{word:'黄金',reading:'ŌGON',meaning:'gold / golden'}] },
      { id:'tea',      kanji:'茶', kun:'ちゃ', on:'チャ', en:'tea / brown', swatch:'#8b6340',
        strokes:9,
        usage:{ ja:'お茶', kana:'おちゃ' },
        notes:'茶 [cha] is "tea." With 色 [iro] (color) it forms 茶色 [chairo] — "tea color" = brown. The i-adjective form is 茶色い [chairoi].',
        examples:[
          {word:'お茶',     reading:'ocha',     meaning:'tea (polite)'},
          {word:'紅茶',     reading:'KŌCHA',    meaning:'black tea'},
          {word:'抹茶',     reading:'MATCHA',   meaning:'matcha (powdered green tea)'},
          {word:'喫茶店',   reading:'KISSATEN', meaning:'café'},
          {word:'茶色',     reading:'chairo',   meaning:'brown (tea color)'},
        ] },
      { id:'green',    kanji:'緑', kun:'みどり',   on:'リョク', en:'green', swatch:'#2e8b57', strokes:14, examples:[{word:'緑茶',reading:'RYOKUCHA',meaning:'green tea'},{word:'緑色',reading:'midori iro',meaning:'green color'},{word:'新緑',reading:'SHINRYOKU',meaning:'fresh green'}] },
      { id:'purple',   kanji:'紫', kun:'むらさき', on:'シ',     en:'purple', swatch:'#6b2fa0', strokes:12, examples:[{word:'紫色',reading:'murasaki iro',meaning:'purple color'},{word:'紫外線',reading:'SHIGAISEN',meaning:'ultraviolet'}] },
      // 灰色 (gray) — full flashcard. The 灰 (ash) component is rare enough
      // that it's worth its own card; the compound is high-frequency
      // everyday vocab (gray skies, gray hair, "gray area").
      { id:'gray',     kanji:'灰色', kun:'はいいろ', on:'',       en:'gray', swatch:'#888a86',
        notes:'灰 [hai] is "ash." Pairs with 色 [iro] for "ash color" = gray.',
        examples:[
          {word:'灰色',     reading:'haiiro',         meaning:'gray'},
          {word:'灰色の空', reading:'haiiro no sora', meaning:'gray sky'},
          {word:'灰皿',     reading:'haizara',        meaning:'ashtray'},
        ] },
      // Vocab-only entries (vocabOnly:true skips them from the flashcards
      // deck, but they still surface on the writing/colors reference grid
      // which reads from FLASHCARD_CLASSES). Loanwords + softer native
      // pinks that learners will encounter but don't need drilled as
      // standalone flashcards.
      { id:'momoiro',  kanji:'桃色', kun:'ももいろ', on:'',       en:'peach pink', swatch:'#f7a8b8', vocabOnly:true,
        notes:'桃 [momo] is "peach." 桃色 (momoiro) is the softer / more poetic Japanese word for pink; the loanword ピンク covers the brighter modern shade.' },
      { id:'pink',     kanji:'ピンク', kun:'ぴんく',  on:'',       en:'pink (loanword)', swatch:'#f4a8c0', vocabOnly:true,
        notes:'Loanword from English "pink." More common in everyday speech than the native 桃色 (momoiro).' },
      { id:'orange',   kanji:'オレンジ', kun:'おれんじ', on:'',     en:'orange (loanword)', swatch:'#f08c2a', vocabOnly:true,
        notes:'Loanword from English "orange." Used for both the color and the fruit. The native 橙色 (daidaiiro) sounds literary.' },
    ],
  },
  {
    id: 'body',
    titleJa: 'からだ',
    titleEn: 'Body',
    glyph: '体',
    // Spec §3.5 order: 体 口 目 見 自 鼻 耳 心 手 [◆扌 — added in Batch 4]
    //   持 打 足 首 頭 顔 髪 歯 腕.
    cards: [
      { id:'body',  kanji:'体', kun:'からだ',   on:'タイ', en:'body',
        seeAlso:['本'],
        strokes:7,
        examples:[
          {word:'体育',reading:'TAIIKU',meaning:'physical education'},
          {word:'体力',reading:'TAIRYOKU',meaning:'stamina'},
          {word:'体温',reading:'TAION',meaning:'body temperature'},
        ] },
      { id:'mouth', kanji:'口', kun:'くち',     on:'コウ', en:'mouth / opening / entrance',
        strokes:3,
        examples:[
          {word:'入口',reading:'iriguchi',meaning:'entrance'},
          {word:'人口',reading:'JINKŌ',meaning:'population'},
          {word:'口紅',reading:'kuchibeni',meaning:'lipstick'},
        ] },
      // 目 cluster — same eye-radical shape across 見 / 自 / 首. 鼻 also
      // carries 自 (its old pictograph) so it sits near self.
      { id:'eye',   kanji:'目', kun:'め',       on:'モク', en:'eye',
        strokes:5,
        examples:[
          {word:'目的',reading:'MOKUTEKI',meaning:'purpose'},
          {word:'目玉',reading:'medama',meaning:'eyeball'},
          {word:'目覚まし',reading:'mezamashi',meaning:'alarm clock'},
        ] },
      { id:'look',  kanji:'見', kun:'み',       on:'ケン', en:'look / see',
        strokes:7,
        examples:[
          {word:'見学',reading:'KENGAKU',meaning:'field trip'},
          {word:'花見',reading:'hanami',meaning:'flower viewing'},
          {word:'見本',reading:'mihon',meaning:'sample'},
        ] },
      { id:'self',  kanji:'自', kun:'みずから', on:'ジ',   en:'self / oneself',
        usage:{ ja:'自分', kana:'じぶん' },
        strokes:6,
        examples:[
          {word:'自分',reading:'JIBUN',meaning:'oneself'},
          {word:'自然',reading:'SHIZEN',meaning:'nature'},
          {word:'自転車',reading:'JITENSHA',meaning:'bicycle'},
        ] },
      // 首 follows 自 directly — they share the same "self / from-the-
      // neck-up" sphere, and 首 itself contains 自 at the bottom-right.
      { id:'neck',  kanji:'首', kun:'くび',     on:'シュ', en:'neck',
        strokes:9,
        examples:[
          {word:'首都',reading:'SHUTO',meaning:'capital city'},
          {word:'首相',reading:'SHUSHŌ',meaning:'prime minister'},
          {word:'手首',reading:'tekubi',meaning:'wrist'},
        ] },
      { id:'ear',   kanji:'耳', kun:'みみ',     on:'ジ',   en:'ear',
        strokes:6,
        examples:[
          {word:'耳鳴り',reading:'miminari',meaning:'ringing in ears'},
          {word:'耳元',reading:'mimimoto',meaning:'near one\'s ear'},
          {word:'早耳',reading:'hayamimi',meaning:'sharp ears'},
        ] },
      // 足 lands right after 耳 — pairs the two sensory / extremity
      // kanji as a head-end / foot-end bookend before the deck dives
      // into 心 / 手.
      { id:'foot',  kanji:'足', kun:'あし',     on:'ソク', en:'foot / leg',
        strokes:7,
        examples:[
          {word:'足跡',reading:'ashiato',meaning:'footprint'},
          {word:'足りる',reading:'tariru',meaning:'to be enough'},
          {word:'遠足',reading:'ENSOKU',meaning:'field trip'},
        ] },
      { id:'heart', kanji:'心', kun:'こころ',   on:'シン', en:'heart / mind',
        strokes:4,
        examples:[
          {word:'安心',reading:'ANSHIN',meaning:'peace of mind'},
          {word:'心配',reading:'SHINPAI',meaning:'worry'},
          {word:'心臓',reading:'SHINZŌ',meaning:'heart (organ)'},
        ] },
      { id:'hand',  kanji:'手', kun:'て',       on:'シュ', en:'hand',
        strokes:4,
        examples:[
          {word:'手紙',reading:'tegami',meaning:'letter'},
          {word:'握手',reading:'AKUSHU',meaning:'handshake'},
          {word:'手話',reading:'SHUWA',meaning:'sign language'},
        ] },
      { id:'tehen-radical', type:'radical',
        radical:'扌', from:'手',
        titleJa:'てへん', titleEn:'left-side hand',
        descEn:'When 手 lives on the LEFT side of a compound kanji, the bottom-right stroke flattens and it becomes 扌 — same hand, side-on. Marks kanji that involve doing something with the hands: holding, hitting, pushing, drawing.',
        descJa:'「手」が漢字の左がわに立つとき、右下の払いが平らになり「扌」になる。同じ手の形をふくむ。手で何かをすること—持つ、打つ、押す、引く—に関する漢字につく。',
        examples:[
          { kanji:'打', kun:'う',   on:'ダ',   en:'hit / strike' },
          { kanji:'持', kun:'も',   on:'ジ',   en:'hold / carry' },
          { kanji:'押', kun:'お',   on:'オウ', en:'push' },
          { kanji:'引', kun:'ひ',   on:'イン', en:'pull' },
        ] },
      // 打 lands before 持 — simpler kanji (5 strokes vs 9), simpler
      // verb ("hit" before "hold"), and the order matches how the
      // ◆扌 examples list reads.
      { id:'hit',   kanji:'打', kun:'う',       on:'ダ',   en:'hit / strike',
        seeAlso:['手'],
        strokes:5,
        examples:[
          {word:'打つ',   reading:'utsu',   meaning:'to hit'},
          {word:'打者',   reading:'DASHA',  meaning:'batter'},
          {word:'打撃',   reading:'DAGEKI', meaning:'blow / impact'},
        ] },
      { id:'hold',  kanji:'持', kun:'も',       on:'ジ',   en:'hold / carry',
        seeAlso:['手'],
        strokes:9,
        examples:[
          {word:'持つ',   reading:'motsu',   meaning:'to hold'},
          {word:'気持ち', reading:'kimochi', meaning:'feeling / mood'},
          {word:'持参',   reading:'JISAN',   meaning:'bringing along'},
        ] },
      // ◆廾 (にじゅうあし / "twenty-feet") — two hands held up beneath
      // a kanji, set into a wide base. Sits at the BOTTOM of 鼻 (which
      // is itself 自 + 田 + 廾) and shows up under 弁 (speech) and 弊
      // (evil), among others. The earlier ナ・ヨ + 又 hands card covered
      // the SIDE-hand forms; 廾 is the lifted-up pair from below. Lands
      // right before 鼻 so the breakdown ladders 自 → 田 → 廾 = 鼻 reads
      // cleanly on the next card.
      { id:'niju-ashi-radical', type:'radical',
        radical:'廾', from:'廾',
        titleJa:'にじゅうあし', titleEn:'two hands raised (base)',
        descEn:'A pair of hands raised together as a base — same hands the ナ·又 card covered, but viewed FROM BELOW supporting whatever sits on top. Lives at the BOTTOM of 鼻 (nose) and 弁 (speech / dialect), and inside 弊 (evil). When you see 廾 as the lower platform of a kanji, the meaning usually involves something being held up, supported, or presented.',
        descJa:'下から ささえる ふたつ の 手。「ナ」「又」 の カード で 出 た 手 と 同じ かたち だが、ここ では 下 から 上 を ささえる 形。「鼻」 の 下、「弁」 の 下、「弊」 の 内側 に あらわれる。漢字 の 下 に 廾 が ある とき、なにか を ささえる・もち上げる 意味 を もつ こと が おおい。',
        examples:[
          { kanji:'鼻', kun:'はな', on:'ビ',  en:'nose (自 + 田 + 廾)' },
          { kanji:'弁', kun:'',     on:'ベン', en:'speech / dialect' },
          { kanji:'弊', kun:'',     on:'ヘイ', en:'evil / harm' },
          { kanji:'葬', kun:'ほうむ', on:'ソウ', en:'bury / funeral' },
        ] },
      { id:'nose',  kanji:'鼻', kun:'はな',     on:'ビ',   en:'nose',
        seeAlso:['自'],
        notes:'鼻 = 自 (the old pictograph for nose) + 田 (interesting / grid) + 廾 (two-hands raised base). The original 自 came to mean "self" because people point at their nose to indicate themselves, so the language built 鼻 on top to recover the body-part reading.',
        strokes:14,
        examples:[
          {word:'鼻水',reading:'hanamizu',meaning:'runny nose'},
          {word:'鼻歌',reading:'hanauta',meaning:'humming'},
          {word:'鼻血',reading:'hanaji',meaning:'nosebleed'},
        ] },
      { id:'head',  kanji:'頭', kun:'あたま',   on:'トウ', en:'head',
        strokes:16,
        examples:[
          {word:'頭痛',reading:'ZUTSŪ',meaning:'headache'},
          {word:'先頭',reading:'SENTŌ',meaning:'lead / front'},
          {word:'頭金',reading:'atamakin',meaning:'down payment'},
        ] },
      { id:'face',  kanji:'顔', kun:'かお',     on:'ガン', en:'face',
        strokes:18,
        examples:[
          {word:'顔色',reading:'kaoiro',meaning:'complexion'},
          {word:'笑顔',reading:'egao',meaning:'smile'},
          {word:'顔面',reading:'GANMEN',meaning:'face surface'},
        ] },
      { id:'hair',  kanji:'髪', kun:'かみ',     on:'ハツ', en:'hair',
        strokes:14,
        examples:[
          {word:'髪型',reading:'kamigata',meaning:'hairstyle'},
          {word:'髪の毛',reading:'kaminoke',meaning:'strand of hair'},
          {word:'金髪',reading:'KINPATSU',meaning:'blond hair'},
        ] },
      { id:'tooth', kanji:'歯', kun:'は',       on:'シ',   en:'tooth',
        strokes:12,
        examples:[
          {word:'歯医者',reading:'haisha',meaning:'dentist'},
          {word:'歯磨き',reading:'hamigaki',meaning:'toothbrushing'},
          {word:'虫歯',reading:'mushiba',meaning:'cavity'},
        ] },
      { id:'arm',   kanji:'腕', kun:'うで',     on:'ワン', en:'arm',
        strokes:12,
        examples:[
          {word:'腕時計',reading:'udedokei',meaning:'wristwatch'},
          {word:'腕前',reading:'udemae',meaning:'skill'},
          {word:'腕立て伏せ',reading:'udetatefuse',meaning:'push-up'},
        ] },
    ],
  },
  {
    id: 'animals',
    titleJa: 'どうぶつ',
    titleEn: 'Animals',
    glyph: '犬',
    // Order: 貝 犬 ◆犭 猫 鳥 魚 馬 牛 豚 鶏 蛸 烏賊.
    // 貝 leads — its kanji is structurally the simplest (a pictographic
    // shell sitting on two legs). 犬 → ◆犭 → 猫 keeps the beast-
    // radical family together (kanji-then-radical for 犬, then the
    // first 犭-compound 猫 immediately after). 狼 / 狐 are introduced
    // in the Animals II deck — the radical card flags them as
    // upcoming examples but doesn't ask the learner to retain them
    // here.
    cards: [
      { id:'shellfish', kanji:'貝', kun:'かい',       on:'バイ',   en:'shellfish / shell', strokes:7,
        examples:[{word:'貝殻',reading:'kaigara',meaning:'seashell'},{word:'二枚貝',reading:'nimaigai',meaning:'bivalve'},{word:'貝柱',reading:'kaibashira',meaning:'scallop (adductor muscle)'}] },
      { id:'dog',       kanji:'犬', kun:'いぬ',       on:'ケン',   en:'dog', strokes:4,
        examples:[{word:'子犬',reading:'koinu',meaning:'puppy'},{word:'番犬',reading:'BANKEN',meaning:'guard dog'},{word:'犬小屋',reading:'inugoya',meaning:'doghouse'}] },
      // ◆犭 — the beast / animal radical. 犬 (dog) becomes 犭 when
      // it slides onto the left side of a compound — same trick as
      // 人 → 亻 in People. Marks kanji about four-legged animals;
      // the right half names which one. Lands right after 犬;
      // 猫 follows immediately as the first 犭-compound. Wolf and
      // fox land in Animals II — flagged here as preview examples.
      { id:'kemonohen-radical', type:'radical',
        radical:'犭', from:'犬',
        titleJa:'けものへん', titleEn:'beast radical',
        descEn:'A variant of 犬 that lives on the left side of a kanji — three thin strokes evoking a slim animal in profile, paws and tail. Marks kanji about four-legged beasts; the right half names the species. Whenever you see 犭 on the left, expect an animal.',
        descJa:'「犬」が漢字の左がわに立つときの変形。三本の細い線で、しなやかな四つ足のけものを表す。漢字の右がわがどの動物かを示す。',
        examples:[
          { kanji:'猫', kun:'ねこ',   on:'ビョウ', en:'cat' },
          { kanji:'狼', kun:'おおかみ', on:'ロウ', en:'wolf (in Animals II)' },
          { kanji:'狐', kun:'きつね', on:'コ',     en:'fox (in Animals II)' },
          { kanji:'獣', kun:'けもの', on:'ジュウ', en:'beast / wild animal' },
        ] },
      { id:'cat',       kanji:'猫', kun:'ねこ',       on:'ビョウ', en:'cat', strokes:11,
        examples:[{word:'猫舌',reading:'nekojita',meaning:'cat tongue (sensitive to heat)'},{word:'子猫',reading:'koneko',meaning:'kitten'},{word:'黒猫',reading:'kuroneko',meaning:'black cat'}] },
      // 子犬 → 子猫 — the 子-prefix pattern for young animals. Both
      // kanji have already landed (子 in People, 犬 / 猫 just above),
      // so these read as compounds: 子 (child) + animal = baby
      // animal. Same pattern extends to 子豚 (piglet), 子鳥 (baby
      // bird), 子馬 (foal), 子牛 (calf) — the curriculum surfaces
      // those as examples on each animal card, but 子犬 / 子猫 are
      // common enough to earn their own slot.
      { id:'koinu', kanji:'子犬', kun:'こいぬ', on:'', en:'puppy',
        seeAlso:['子', '犬'],
        notes:'子 (child) + 犬 (dog) — literally "child-dog." Same prefix pattern as 子猫 (kitten), 子豚 (piglet), 子鳥 (baby bird), 子馬 (foal), 子牛 (calf). Sometimes written 仔犬 with the alternative "young animal" kanji 仔, but 子犬 is the standard form.',
        examples:[
          {word:'子犬',         reading:'koinu',          meaning:'puppy'},
          {word:'子犬の頃',     reading:'koinu no koro',  meaning:'puppyhood'},
          {word:'迷い子犬',     reading:'mayoigo-inu',    meaning:'lost puppy'},
        ] },
      { id:'koneko', kanji:'子猫', kun:'こねこ', on:'', en:'kitten',
        seeAlso:['子', '猫'],
        notes:'子 (child) + 猫 (cat) — "child-cat" → kitten. Same 子-prefix pattern as 子犬 (puppy). The compound itself is the standard everyday word; the 仔猫 spelling shows up in literary or veterinary contexts.',
        examples:[
          {word:'子猫',         reading:'koneko',         meaning:'kitten'},
          {word:'子猫を拾う',   reading:'koneko o hirou', meaning:'to pick up a stray kitten'},
          {word:'三毛子猫',     reading:'mike-koneko',    meaning:'tortoiseshell kitten'},
        ] },
      { id:'bird',      kanji:'鳥', kun:'とり',       on:'チョウ', en:'bird', strokes:11,
        examples:[
          {word:'白鳥',reading:'HAKUCHŌ',meaning:'swan'},
          {word:'鳥居',reading:'torii',meaning:'shrine gate'},
          {word:'焼き鳥',reading:'yakitori',meaning:'grilled chicken skewer'},
          {word:'小鳥',reading:'kotori',meaning:'small bird'},
        ] },
      // 白鳥 → 黒鳥 — color + 鳥 compound pair. Both ingredients have
      // landed (白 / 黒 in Colors, 鳥 just above). 白鳥 (swan) is the
      // common word; 黒鳥 (black swan) carries the Taleb-popularized
      // "rare unexpected event" connotation in modern Japanese the
      // same way it does in English.
      { id:'swan', kanji:'白鳥', kun:'はくちょう', on:'', en:'swan',
        seeAlso:['白', '鳥'],
        notes:'白 (white) + 鳥 (bird) → "white bird," the standard word for swan. The on-on reading HAKUCHŌ is what you\'ll hear in most contexts; the kun-on reading しらとり is older / poetic and shows up in place names (白鳥町, 白鳥神社).',
        examples:[
          {word:'白鳥',       reading:'HAKUCHŌ',         meaning:'swan'},
          {word:'白鳥の湖',   reading:'HAKUCHŌ no mizūmi', meaning:'Swan Lake'},
          {word:'白鳥座',     reading:'HAKUCHŌ-za',      meaning:'Cygnus (the constellation)'},
        ] },
      { id:'black-swan', kanji:'黒鳥', kun:'こくちょう', on:'', en:'black swan',
        seeAlso:['黒', '鳥'],
        notes:'黒 (black) + 鳥 (bird) → black swan. The compound is structurally identical to 白鳥 and reads with the same on-on pattern (KOKU-CHŌ). Outside of the literal Australian species, the term carries the modern "rare disruptive event" sense from Taleb\'s book — translated into Japanese as『黒い白鳥』(the "black white-bird," a deliberate paradox) but the bird itself stays 黒鳥.',
        examples:[
          {word:'黒鳥',         reading:'KOKUCHŌ',          meaning:'black swan'},
          {word:'黒鳥効果',     reading:'KOKUCHŌ KŌKA',     meaning:'the black-swan effect'},
          {word:'黒鳥のような', reading:'KOKUCHŌ no yō na', meaning:'black-swan-like (unforeseen)'},
        ] },
      // 鶏 closes the bird block — sitting next to 鳥 / 白鳥 / 黒鳥
      // keeps all the avian cards together before the deck pivots
      // to 魚 (fish) and the four-legged staples.
      { id:'chicken',   kanji:'鶏', kun:'にわとり',   on:'ケイ',   en:'chicken', strokes:19,
        examples:[{word:'鶏肉',reading:'TORINIKU',meaning:'chicken meat'},{word:'鶏卵',reading:'KEIRAN',meaning:'hen egg'},{word:'養鶏',reading:'YŌKEI',meaning:'poultry farming'}] },
      { id:'fish',      kanji:'魚', kun:'さかな',     on:'ギョ',   en:'fish', strokes:11,
        examples:[{word:'金魚',reading:'kingyo',meaning:'goldfish'},{word:'魚屋',reading:'sakanaya',meaning:'fish shop'},{word:'焼き魚',reading:'yakizakana',meaning:'grilled fish'}] },
      { id:'horse',     kanji:'馬', kun:'うま',       on:'バ',     en:'horse', strokes:10,
        examples:[{word:'競馬',reading:'KEIBA',meaning:'horse racing'},{word:'馬車',reading:'BASHA',meaning:'horse-drawn carriage'},{word:'乗馬',reading:'JŌBA',meaning:'horseback riding'}] },
      { id:'cow',       kanji:'牛', kun:'うし',       on:'ギュウ', en:'cow / bull', strokes:4,
        examples:[{word:'牛肉',reading:'GYŪNIKU',meaning:'beef'},{word:'牛乳',reading:'GYŪNYŪ',meaning:'milk'},{word:'牛丼',reading:'GYŪDON',meaning:'beef bowl'}] },
      { id:'pig',       kanji:'豚', kun:'ぶた',       on:'トン',   en:'pig', strokes:11,
        examples:[{word:'豚肉',reading:'BUTANIKU',meaning:'pork'},{word:'豚カツ',reading:'tonkatsu',meaning:'pork cutlet'},{word:'子豚',reading:'kobuta',meaning:'piglet'}] },
      // 蛙 → 蛇 → 蛸 — the 虫-radical block. All three share 虫
      // (insect / small creature) as their left-side semantic
      // component, then differ on the right. The block reads as
      // "small ground-living creatures before the cephalopods and
      // the sea creatures that follow."
      { id:'frog',      kanji:'蛙', kun:'かえる',     on:'ア',     en:'frog', strokes:12,
        seeAlso:['虫'],
        notes:'蛙 = 虫 (insect / small creature) + 圭 (jewel / auspicious). Often written かえる in kana for casual or children\'s contexts. Cultural: 雨蛙 (amagaeru, tree frog) hides in summer rain, and the proverb 蛙の子は蛙 ("a frog\'s child is a frog") means "the apple doesn\'t fall far from the tree."',
        examples:[
          {word:'蛙',          reading:'kaeru',          meaning:'frog'},
          {word:'雨蛙',        reading:'amagaeru',       meaning:'tree frog (lit. "rain frog")'},
          {word:'蛙の子は蛙',  reading:'kaeru no ko wa kaeru', meaning:'"like father, like son"'},
        ] },
      { id:'snake',     kanji:'蛇', kun:'へび',       on:'ジャ',   en:'snake / serpent', strokes:11,
        seeAlso:['虫'],
        notes:'蛇 = 虫 + 它 (an old snake pictograph). The on-reading ジャ shows up in 大蛇 (daija, a giant serpent — the 蛇 of myth, like Yamata-no-Orochi) and 蛇行 (jakō, "snake-walking" = meandering). The everyday faucet 蛇口 (jaguchi, "snake mouth") gets its name from the curved spout. 藪蛇 (yabu-hebi, "snake from the bushes") is the cultural shorthand for "unintended consequences from poking trouble."',
        examples:[
          {word:'蛇',          reading:'hebi',           meaning:'snake'},
          {word:'大蛇',        reading:'DAIJA',          meaning:'giant snake / serpent'},
          {word:'蛇口',        reading:'jaguchi',        meaning:'faucet ("snake mouth")'},
          {word:'毒蛇',        reading:'dokuhebi',       meaning:'venomous snake'},
        ] },
      { id:'octopus',   kanji:'蛸', kun:'たこ',       on:'ショウ', en:'octopus', strokes:15,
        examples:[{word:'蛸焼き',reading:'takoyaki',meaning:'octopus balls'},{word:'蛸壺',reading:'takotsubo',meaning:'octopus pot'}] },
      // 鯨 → 鮫 → ◆交 — sea-creature pair using the 魚 (fish) radical,
      // then the structural radical 交 that 鮫 just showcased on its
      // right side.
      { id:'whale',     kanji:'鯨', kun:'くじら',     on:'ゲイ',   en:'whale', strokes:19,
        seeAlso:['魚','京'],
        notes:'鯨 = 魚 (fish) + 京 (capital city). Heisig\'s mnemonic: "the capital city of fish" — whales as the largest creatures in the sea. The on-reading ゲイ binds to formal compounds: 捕鯨 (hogei, whaling), 鯨肉 (geiniku, whale meat). Cultural-literary: 『白鯨』 is the Japanese title of Moby-Dick.',
        examples:[
          {word:'鯨',          reading:'kujira',         meaning:'whale'},
          {word:'捕鯨',        reading:'HOGEI',          meaning:'whaling'},
          {word:'鯨肉',        reading:'GEINIKU',        meaning:'whale meat'},
          {word:'白鯨',        reading:'HAKUGEI',        meaning:'Moby-Dick ("white whale")'},
        ] },
      { id:'shark',     kanji:'鮫', kun:'さめ',       on:'コウ',   en:'shark', strokes:17,
        seeAlso:['魚'],
        notes:'鮫 = 魚 (fish) + 交 (cross / intersect — the radical card lands right after this). Cultural: 鮫肌 (samehada, "shark-skin") means rough or dry skin, and showed up famously as a character\'s power in modern manga. 人食い鮫 (hitokui-zame) is the "man-eating shark" trope.',
        examples:[
          {word:'鮫',          reading:'same',           meaning:'shark'},
          {word:'鮫肌',        reading:'samehada',       meaning:'rough skin ("shark skin")'},
          {word:'人食い鮫',    reading:'hitokui-zame',   meaning:'man-eating shark'},
          {word:'鮫釣り',      reading:'samezuri',       meaning:'shark fishing'},
        ] },
      // ◆交 — radical-style explainer. The right half of 鮫 (just met)
      // turns out to be 交, a structural primitive that means
      // "crossing / mingling / exchange." Shows up across many kanji
      // about intersection: 校 (school as crossroads of learning),
      // 効 (effect as crossed forces), 較 (compare as crossed
      // differences), 郊 (suburb as the crossing between city and
      // country).
      { id:'kou-radical', type:'radical',
        radical:'交', from:'交',
        titleJa:'こう / まじわる', titleEn:'cross / intersect / mingle',
        descEn:'The same 交 you just met in 鮫 (魚 + 交). Means "crossing" in three senses — physical (intersecting), social (mingling), and commercial (exchange). When you see 交 inside another kanji, expect the meaning to involve some kind of mixing or meeting. Pictographically: 亠 (a lid) over 父 (father) — Heisig\'s mnemonic ladders it as "a person with legs crossed."',
        descJa:'いま「鮫」(魚 + 交) の右がわで出会った「交」。「まじわる・まじる・かわす」を意味し、物が交差する、人が交わる、ものを交換する — どの意味でも「交」が中にあれば「混ざる」「ぶつかる」イメージを持つ。',
        examples:[
          { kanji:'鮫', kun:'さめ', on:'コウ', en:'shark (just met)' },
          { kanji:'校', kun:'',    on:'コウ', en:'school' },
          { kanji:'効', kun:'き',  on:'コウ', en:'effect / efficacy' },
          { kanji:'較', kun:'',    on:'カク', en:'compare / contrast' },
        ] },
      // 亀 closes the class — a pictographic kanji of a turtle in
      // profile, shell on top, head + tail + feet underneath. Twelve
      // strokes that all need to land correctly; the proverb
      // 亀の甲より年の功 sits at the heart of Japanese age-respect.
      { id:'turtle',    kanji:'亀', kun:'かめ',       on:'キ',     en:'turtle', strokes:11,
        notes:'亀 is one of the most-photographed kanji because the pictograph is still legible: shell on top, head + four legs + tail underneath. Cultural: 鶴亀 (tsuru-kame, "crane and turtle") is the standard longevity-symbol pair, and 亀の甲より年の功 ("the turtle\'s shell is worth less than years of experience") is the proverb honoring elderly wisdom.',
        examples:[
          {word:'亀',          reading:'kame',           meaning:'turtle'},
          {word:'海亀',        reading:'umigame',        meaning:'sea turtle'},
          {word:'鶴亀算',      reading:'tsurukame-zan',  meaning:'"crane-turtle math" (classic puzzle)'},
          {word:'亀の甲',      reading:'kame no ko',     meaning:'turtle shell'},
        ] },
    ],
  },
  {
    id: 'rooms',
    titleJa: 'へや',
    titleEn: 'Rooms',
    glyph: '室',
    // Spec §3.12 order: [◆宀 — added in Batch 4] 戸 門 開 閉 窓 床 天井 棚 本棚.
    // 出 carved out for Verbs (Task 16) — full card preserved in scratch
    // comment near the eventual Verbs slot. 閤 dropped (rare).
    cards: [
      { id:'door',      kanji:'戸',   kun:'と',     on:'コ',         en:'door',
        strokes:4,
        examples:[
          {word:'戸棚',reading:'todana',meaning:'cupboard'},
          {word:'木戸',reading:'kido',meaning:'wooden gate'},
          {word:'戸口',reading:'toguchi',meaning:'doorway'},
        ] },
      { id:'gate',      kanji:'門',   kun:'かど',   on:'モン',       en:'gate',
        strokes:8,
        examples:[
          {word:'門前',reading:'MONZEN',meaning:'before the gate'},
          {word:'専門',reading:'SENMON',meaning:'specialty'},
          {word:'正門',reading:'SEIMON',meaning:'main gate'},
        ] },
      { id:'open',      kanji:'開',   kun:'ひら',   on:'カイ',       en:'open',
        strokes:12,
        examples:[
          {word:'開始',reading:'KAISHI',meaning:'start'},
          {word:'公開',reading:'KŌKAI',meaning:'public release'},
          {word:'開く',reading:'hiraku',meaning:'to open'},
        ] },
      { id:'close',     kanji:'閉',   kun:'し',     on:'ヘイ',       en:'close / shut',
        seeAlso:['門'],
        strokes:11,
        examples:[
          {word:'閉める', reading:'shimeru', meaning:'to close (tr.)'},
          {word:'閉まる', reading:'shimaru', meaning:'to close (intr.)'},
          {word:'閉店',   reading:'HEITEN',  meaning:'shop closing'},
        ] },
      { id:'window',    kanji:'窓',   kun:'まど',   on:'ソウ',       en:'window',
        strokes:11,
        examples:[
          {word:'窓口',reading:'madoguchi',meaning:'counter / window'},
          {word:'窓際',reading:'madogiwa',meaning:'by the window'},
          {word:'窓辺',reading:'madobe',meaning:'windowsill'},
        ] },
      { id:'floor',     kanji:'床',   kun:'ゆか',   on:'ショウ',     en:'floor',
        strokes:7,
        examples:[
          {word:'床の間',reading:'tokonoma',meaning:'alcove'},
          {word:'起床',reading:'KISHŌ',meaning:'getting up'},
          {word:'床屋',reading:'tokoya',meaning:'barber'},
        ] },
      { id:'ceiling',   kanji:'天井', kun:'てんじょう', on:'テンジョウ', en:'ceiling',
        strokes:8 },
      { id:'shelf',     kanji:'棚',   kun:'たな',   on:'',           en:'shelf',
        strokes:12,
        examples:[
          {word:'本棚',reading:'hondana',meaning:'bookshelf'},
          {word:'棚上げ',reading:'tanaage',meaning:'shelving'},
          {word:'戸棚',reading:'todana',meaning:'cupboard'},
        ] },
      { id:'bookshelf', kanji:'本棚', kun:'ほんだな', on:'ホンダナ',   en:'bookshelf',
        strokes:17 },
    ],
  },
  {
    id: 'places',
    titleJa: 'ばしょ',
    titleEn: 'Places & Compass',
    glyph: '東',
    // Spec §3.11 order: 上 下 左 右 中 東 西 南 北 王 国 家 店 駅.
    cards: [
      { id:'up',    kanji:'上', kun:'うえ',   on:'ジョウ', en:'up / above',
        strokes:3,
        examples:[
          {word:'上手',reading:'jōzu',meaning:'skilled'},
          {word:'以上',reading:'IJŌ',meaning:'or more'},
          {word:'上着',reading:'uwagi',meaning:'jacket'},
        ] },
      { id:'down',  kanji:'下', kun:'した',   on:'カ',     en:'down / below',
        strokes:3,
        examples:[
          {word:'下手',reading:'heta',meaning:'unskilled'},
          {word:'地下',reading:'CHIKA',meaning:'underground'},
          {word:'下着',reading:'shitagi',meaning:'underwear'},
        ] },
      { id:'left',  kanji:'左', kun:'ひだり', on:'サ',     en:'left',
        strokes:5,
        examples:[
          {word:'左手',reading:'hidarite',meaning:'left hand'},
          {word:'左右',reading:'SAYŪ',meaning:'left and right'},
          {word:'左折',reading:'SASETSU',meaning:'left turn'},
        ] },
      { id:'right', kanji:'右', kun:'みぎ',   on:'ウ',     en:'right',
        strokes:5,
        examples:[
          {word:'右手',reading:'migite',meaning:'right hand'},
          {word:'右折',reading:'USETSU',meaning:'right turn'},
          {word:'左右',reading:'SAYŪ',meaning:'left and right'},
        ] },
      { id:'middle',kanji:'中', kun:'なか',   on:'チュウ', en:'middle / inside',
        strokes:4,
        examples:[
          {word:'中学',reading:'CHŪGAKU',meaning:'middle school'},
          {word:'中心',reading:'CHŪSHIN',meaning:'center'},
          {word:'世界中',reading:'SEKAIJŪ',meaning:'worldwide'},
        ] },
      { id:'east', kanji:'東', kun:'ひがし', on:'トウ', en:'east', strokes:8,
        examples:[
          {word:'東京',   reading:'TŌKYŌ',         meaning:'Tokyo'},
          {word:'東口',   reading:'higashiguchi',  meaning:'east exit'},
          {word:'関東',   reading:'KANTŌ',         meaning:'Kanto region'},
        ] },
      { id:'west', kanji:'西', kun:'にし', on:'セイ・サイ', en:'west', strokes:6,
        examples:[
          {word:'関西',   reading:'KANSAI',     meaning:'Kansai region'},
          {word:'西口',   reading:'nishiguchi', meaning:'west exit'},
          {word:'北西',   reading:'HOKUSEI',    meaning:'northwest'},
        ] },
      { id:'south', kanji:'南', kun:'みなみ', on:'ナン', en:'south', strokes:9,
        examples:[
          {word:'南口',   reading:'minamiguchi', meaning:'south exit'},
          {word:'南極',   reading:'NANKYOKU',    meaning:'south pole'},
          {word:'南米',   reading:'NANBEI',      meaning:'South America'},
        ] },
      { id:'north', kanji:'北', kun:'きた', on:'ホク', en:'north', strokes:5,
        examples:[
          {word:'北口',     reading:'kitaguchi', meaning:'north exit'},
          {word:'北海道',   reading:'HOKKAIDŌ',  meaning:'Hokkaido'},
          {word:'東北',     reading:'TŌHOKU',    meaning:'northeast / Tohoku region'},
        ] },
      { id:'house', kanji:'家', kun:'いえ', on:'カ', en:'house / home', strokes:10,
        examples:[
          {word:'家',     reading:'ie',     meaning:'house'},
          {word:'家族',   reading:'KAZOKU', meaning:'family'},
          {word:'画家',   reading:'GAKA',   meaning:'painter'},
        ] },
      { id:'shop', kanji:'店', kun:'みせ', on:'テン', en:'shop / store', strokes:8,
        examples:[
          {word:'店',       reading:'mise',     meaning:'shop'},
          {word:'書店',     reading:'SHOTEN',   meaning:'bookstore'},
          {word:'店員',     reading:'TEN\'IN',  meaning:'shop clerk'},
        ] },
      { id:'station', kanji:'駅', kun:'えき', on:'エキ', en:'station', strokes:14,
        seeAlso:['馬'],
        examples:[
          {word:'駅',       reading:'eki',       meaning:'station'},
          {word:'駅前',     reading:'ekimae',    meaning:'in front of the station'},
          {word:'東京駅',   reading:'TŌKYŌ-eki', meaning:'Tokyo Station'},
        ] },
    ],
  },
  {
    id: 'food-drink',
    titleJa: 'たべもの・のみもの',
    titleEn: 'Food & Drink',
    glyph: '食',
    imageFolder: 'food',
    // Spec §3.13 order: 米 飯 ◆飠 食 飲 茶 酒 肉 卵 御飯.
    // ◆飠 radical card lands in Batch 4 (Task 18) between 飯 and 食.
    cards: [
      { id:'rice-grain', kanji:'米', kun:'こめ', on:'ベイ', en:'rice / America (kome / bei)', strokes:6,
        examples:[
          {word:'米',     reading:'kome', meaning:'rice (raw)'},
          {word:'米国',   reading:'BEIKOKU', meaning:'America'},
          {word:'新米',   reading:'SHINMAI', meaning:'new rice / novice'},
        ] },
      { id:'cooked-rice', kanji:'飯', kun:'めし', on:'ハン', en:'cooked rice / meal', strokes:12,
        seeAlso:['米'],
        examples:[
          {word:'御飯',   reading:'GOHAN', meaning:'cooked rice / meal'},
          {word:'朝飯',   reading:'asameshi', meaning:'breakfast'},
          {word:'夕飯',   reading:'YŪHAN', meaning:'dinner'},
        ] },
      { id:'shoku-radical', type:'radical',
        radical:'飠', from:'食',
        titleJa:'しょくへん', titleEn:'food / eat (left side)',
        descEn:'When 食 (eat / food) lives on the LEFT side of a compound, it compresses into 飠 — the same lid + heaped-rice silhouette, made narrow. Marks kanji about food: cooking, drinking, restaurants, particular dishes.',
        descJa:'「食」が漢字の左がわに立つとき、せまく圧縮されて「飠」になる。同じふた + ご飯の山のかたち。食べること、飲むこと、料理、料理屋に関する漢字につく。',
        examples:[
          { kanji:'飯', kun:'めし', on:'ハン', en:'cooked rice / meal' },
          { kanji:'飲', kun:'の',   on:'イン', en:'drink' },
          { kanji:'館', kun:'やかた', on:'カン', en:'large building / hall' },
          { kanji:'飼', kun:'か',   on:'シ',   en:'raise / keep (animal)' },
        ] },
      { id:'eat', kanji:'食', kun:'た', on:'ショク', en:'eat / food', strokes:9,
        examples:[
          {word:'食べる', reading:'taberu', meaning:'to eat'},
          {word:'食事',   reading:'SHOKUJI', meaning:'a meal'},
          {word:'食堂',   reading:'SHOKUDŌ', meaning:'cafeteria'},
        ] },
      { id:'drink', kanji:'飲', kun:'の', on:'イン', en:'drink', strokes:12,
        seeAlso:['食'],
        examples:[
          {word:'飲む',   reading:'nomu', meaning:'to drink'},
          {word:'飲み物', reading:'nomimono', meaning:'a drink'},
          {word:'飲料',   reading:'INRYŌ', meaning:'beverage'},
        ] },
      { id:'tea', kanji:'茶', kun:'ちゃ', on:'チャ', en:'tea', strokes:9,
        usage:{ ja:'お茶', kana:'おちゃ' },
        examples:[
          {word:'お茶',     reading:'ocha',     meaning:'tea (polite)'},
          {word:'紅茶',     reading:'KŌCHA',    meaning:'black tea'},
          {word:'抹茶',     reading:'MATCHA',   meaning:'matcha (powdered green tea)'},
          {word:'喫茶店',   reading:'KISSATEN', meaning:'café'},
        ] },
      { id:'alcohol', kanji:'酒', kun:'さけ', on:'シュ', en:'alcohol / sake', strokes:10,
        examples:[
          {word:'酒',     reading:'sake', meaning:'sake / alcohol'},
          {word:'日本酒', reading:'NIHONSHU', meaning:'Japanese sake'},
          {word:'居酒屋', reading:'IZAKAYA', meaning:'izakaya'},
        ] },
      { id:'meat', kanji:'肉', kun:'にく', on:'ニク', en:'meat / flesh', strokes:6,
        examples:[
          {word:'牛肉',   reading:'GYŪNIKU', meaning:'beef'},
          {word:'豚肉',   reading:'butaniku', meaning:'pork'},
          {word:'鶏肉',   reading:'toriniku', meaning:'chicken (meat)'},
        ] },
      { id:'egg', kanji:'卵', kun:'たまご', on:'ラン', en:'egg', strokes:7,
        examples:[
          {word:'卵',     reading:'tamago', meaning:'egg'},
          {word:'生卵',   reading:'namatamago', meaning:'raw egg'},
          {word:'卵焼き', reading:'tamagoyaki', meaning:'rolled omelet'},
        ] },
      { id:'gohan', kanji:'御飯', kun:'ごはん', on:'', en:'cooked rice / meal',
        notes:'御 [go] is the honorific prefix that softens 飯 [han, meal] into everyday polite speech. Often written ご飯 with the prefix in hiragana.',
        examples:[
          {word:'御飯を食べる', reading:'gohan o taberu', meaning:'to eat a meal'},
          {word:'朝御飯',       reading:'asagohan',       meaning:'breakfast'},
          {word:'夕御飯',       reading:'yūgohan',        meaning:'dinner'},
        ] },
    ],
  },
  {
    // Animals II — wild / non-domestic creatures. Starts with the two
    // 犭-compounds (狼 wolf, 狐 fox) that wouldn't fit in the main
    // Animals deck without crowding the staple-creature list. The
    // beast-radical (◆犭) was already introduced over in Animals,
    // so these read as "the radical you already know, applied to
    // wild animals." Glyph is 狼 (the wolf as the deck's anchor).
    id: 'animals-2',
    titleJa: 'やせいどうぶつ',
    titleEn: 'Animals II',
    glyph: '狼',
    cards: [
      // 狼 (ookami) — 犭 + 良 ("good"). Modern usage leans into the
      // cultural metonyms: 一匹狼 (lone wolf), 狼狽 (panic). Also
      // lives in 狼煙 (noroshi, signal fire) — historically lit
      // with wolf dung for its unique smoke trail.
      { id:'wolf',      kanji:'狼', kun:'おおかみ',   on:'ロウ',   en:'wolf', strokes:10,
        seeAlso:['犬'],
        examples:[
          {word:'狼',        reading:'ōkami',         meaning:'wolf'},
          {word:'一匹狼',    reading:'IPPIKI-ōkami',  meaning:'lone wolf'},
          {word:'狼狽',      reading:'RŌBAI',         meaning:'panic / confusion'},
          {word:'狼煙',      reading:'noroshi',       meaning:'signal fire'},
        ] },
      // 狐 (kitsune) — the trickster of Japanese folklore. 犭 + 瓜
      // ("melon" — Heisig's "fox-melon" mnemonic). The 狐 of folklore
      // shape-shifts, marries (狐の嫁入り, the sunshower wedding),
      // and serves Inari at every red-torii shrine.
      { id:'fox',       kanji:'狐', kun:'きつね',     on:'コ',     en:'fox', strokes:8,
        seeAlso:['犬'],
        examples:[
          {word:'狐',         reading:'kitsune',         meaning:'fox'},
          {word:'狐火',       reading:'kitsunebi',       meaning:'fox-fire (will-o\'-the-wisp)'},
          {word:'狐の嫁入り', reading:'kitsune no yomeiri', meaning:'"fox wedding" (sunshower)'},
          {word:'白狐',       reading:'BYAKKO',          meaning:'white fox (Inari\'s messenger)'},
        ] },
    ],
  },
  {
    id: 'verbs',
    titleJa: 'どうし',
    titleEn: 'Verbs',
    glyph: '行',
    imageFolder: 'kanji',
    // Order: 行 → 止 → 来 → 出 → 立 → 聞 → 買 → 売 → 知 → 思 → 待 → 帰 → 切 → 走 → 働 → 忙.
    // 止 (stop) lands right after 行 (go) as its semantic opposite —
    // the go/stop pair lets the learner anchor 止's reading and meaning
    // on a verb they just met. 止 is also a foundational radical
    // appearing inside 歩 (walk), 正 (correct), 武 (military), so the
    // early introduction pays back later compounds.
    cards: [
      { id:'go', kanji:'行', kun:'い', on:'コウ', en:'go', strokes:6,
        examples:[
          {word:'行く',   reading:'iku', meaning:'to go'},
          {word:'銀行',   reading:'GINKŌ', meaning:'bank'},
          {word:'旅行',   reading:'RYOKŌ', meaning:'travel'},
        ] },
      { id:'stop', kanji:'止', kun:'と', on:'シ', en:'stop / halt', strokes:4,
        notes:'Semantic opposite of 行 (go). Originally a pictograph of a foot planted in place — the same foot-shape that lives at the bottom of 歩 (walk: 止 stacked twice) and 正 (correct: a straight foot meeting a line). Transitive 止める (tomeru) "to stop something" vs intransitive 止まる (tomaru) "to come to a stop."',
        examples:[
          {word:'止まる', reading:'tomaru', meaning:'to stop (intransitive)'},
          {word:'止める', reading:'tomeru', meaning:'to stop (transitive)'},
          {word:'中止',   reading:'CHŪSHI', meaning:'cancellation / suspension'},
          {word:'停止',   reading:'TEISHI', meaning:'halt / standstill'},
          {word:'禁止',   reading:'KINSHI', meaning:'prohibition'},
        ] },
      { id:'come', kanji:'来', kun:'く', on:'ライ', en:'come / next / future', strokes:7,
        notes:'The verb 来る (kuru, "to come") is one of the two irregular verbs in Japanese — the stem changes (く・き・こ) by tense. As a prefix, ライ marks "next/coming" (来週, 来月, 来年). Pairs with 去 (kyo, past / leave) for last-year vs next-year.',
        examples:[
          {word:'来る',reading:'kuru',meaning:'to come'},
          {word:'未来',reading:'MIRAI',meaning:'future'},
          {word:'将来',reading:'SHŌRAI',meaning:'future (career)'},
          {word:'来年',reading:'RAINEN',meaning:'next year'},
          {word:'去年',reading:'KYONEN',meaning:'last year'},
        ] },
      { id:'exit', kanji:'出', kun:'で', on:'シュツ', en:'go out / exit', strokes:5,
        examples:[
          {word:'出口',     reading:'deguchi',   meaning:'exit'},
          {word:'出発',     reading:'SHUPPATSU', meaning:'departure'},
          {word:'出来る',   reading:'dekiru',    meaning:'can do'},
        ] },
      { id:'stand', kanji:'立', kun:'た', on:'リツ', en:'stand / establish', strokes:5,
        examples:[
          {word:'立場',reading:'tachiba',meaning:'standpoint'},
          {word:'独立',reading:'DOKURITSU',meaning:'independence'},
          {word:'立派',reading:'RIPPA',meaning:'splendid'},
        ] },
      { id:'hear', kanji:'聞', kun:'き', on:'ブン', en:'hear / ask', strokes:14,
        seeAlso:['耳','門'],
        examples:[
          {word:'聞く',   reading:'kiku', meaning:'to hear / ask'},
          {word:'新聞',   reading:'SHINBUN', meaning:'newspaper'},
          {word:'見聞',   reading:'KENBUN', meaning:'observation'},
        ] },
      { id:'buy', kanji:'買', kun:'か', on:'バイ', en:'buy', strokes:12,
        seeAlso:['貝'],
        examples:[
          {word:'買う',   reading:'kau', meaning:'to buy'},
          {word:'買物',   reading:'kaimono', meaning:'shopping'},
          {word:'売買',   reading:'BAIBAI', meaning:'buying and selling'},
        ] },
      { id:'sell', kanji:'売', kun:'う', on:'バイ', en:'sell', strokes:7,
        seeAlso:['買'],
        examples:[
          {word:'売る',   reading:'uru', meaning:'to sell'},
          {word:'売れる', reading:'ureru', meaning:'to sell well'},
          {word:'売店',   reading:'BAITEN', meaning:'kiosk'},
        ] },
      { id:'know', kanji:'知', kun:'し', on:'チ', en:'know', strokes:8,
        examples:[
          {word:'知る',   reading:'shiru', meaning:'to know'},
          {word:'知識',   reading:'CHISHIKI', meaning:'knowledge'},
          {word:'知人',   reading:'CHIJIN', meaning:'acquaintance'},
        ] },
      { id:'think', kanji:'思', kun:'おも', on:'シ', en:'think', strokes:9,
        seeAlso:['心','田'],
        examples:[
          {word:'思う',   reading:'omou', meaning:'to think'},
          {word:'意思',   reading:'ISHI', meaning:'intention'},
          {word:'思想',   reading:'SHISŌ', meaning:'thought / ideology'},
        ] },
      { id:'wait', kanji:'待', kun:'ま', on:'タイ', en:'wait', strokes:9,
        examples:[
          {word:'待つ',   reading:'matsu', meaning:'to wait'},
          {word:'期待',   reading:'KITAI', meaning:'expectation'},
          {word:'招待',   reading:'SHŌTAI', meaning:'invitation'},
        ] },
      { id:'return', kanji:'帰', kun:'かえ', on:'キ', en:'return (home)', strokes:10,
        examples:[
          {word:'帰る',   reading:'kaeru', meaning:'to return home'},
          {word:'帰国',   reading:'KIKOKU', meaning:'returning to home country'},
          {word:'日帰り', reading:'higaeri', meaning:'day trip'},
        ] },
      { id:'cut', kanji:'切', kun:'き', on:'セツ', en:'cut', strokes:4,
        examples:[
          {word:'切る',   reading:'kiru', meaning:'to cut'},
          {word:'親切',   reading:'SHINSETSU', meaning:'kindness'},
          {word:'大切',   reading:'TAISETSU', meaning:'important'},
        ] },
      { id:'run', kanji:'走', kun:'はし', on:'ソウ', en:'run', strokes:7,
        examples:[
          {word:'走る',   reading:'hashiru', meaning:'to run'},
          {word:'競走',   reading:'KYŌSŌ', meaning:'race'},
          {word:'脱走',   reading:'DASSŌ', meaning:'escape'},
        ] },
      { id:'work', kanji:'働', kun:'はたら', on:'ドウ', en:'work / labor', strokes:13,
        examples:[
          {word:'働く',   reading:'hataraku', meaning:'to work'},
          {word:'労働',   reading:'RŌDŌ', meaning:'labor'},
          {word:'共働き', reading:'tomobataraki', meaning:'dual-income household'},
        ] },
      { id:'busy', kanji:'忙', kun:'いそが', on:'ボウ', en:'busy', strokes:6,
        examples:[
          {word:'忙しい', reading:'isogashii', meaning:'busy'},
          {word:'多忙',   reading:'TABŌ', meaning:'very busy'},
          {word:'繁忙',   reading:'HANBŌ', meaning:'pressure of business'},
        ] },
    ],
  },
  {
    id: 'adjectives',
    titleJa: 'けいようし',
    titleEn: 'Adjectives',
    glyph: '高',
    imageFolder: 'kanji',
    // Spec §3.15 order: 高 安 多 少 古 新 長 短 強 弱.
    cards: [
      { id:'tall', kanji:'高', kun:'たか', on:'コウ', en:'tall / expensive / high', strokes:10,
        examples:[
          {word:'高い',   reading:'takai', meaning:'tall / expensive'},
          {word:'高校',   reading:'KŌKŌ', meaning:'high school'},
          {word:'最高',   reading:'SAIKŌ', meaning:'the best / highest'},
        ] },
      { id:'cheap', kanji:'安', kun:'やす', on:'アン', en:'cheap / safe / peaceful', strokes:6,
        examples:[
          {word:'安い',   reading:'yasui', meaning:'cheap'},
          {word:'安心',   reading:'ANSHIN', meaning:'relief / peace of mind'},
          {word:'安全',   reading:'ANZEN', meaning:'safety'},
        ] },
      { id:'many', kanji:'多', kun:'おお', on:'タ', en:'many / much', strokes:6,
        examples:[
          {word:'多い',   reading:'ōi', meaning:'many'},
          {word:'多分',   reading:'TABUN', meaning:'probably'},
          {word:'多数',   reading:'TASŪ', meaning:'majority'},
        ] },
      { id:'few', kanji:'少', kun:'すく', on:'ショウ', en:'few / a little', strokes:4,
        examples:[
          {word:'少ない', reading:'sukunai', meaning:'few'},
          {word:'少し',   reading:'sukoshi', meaning:'a little'},
          {word:'少年',   reading:'SHŌNEN', meaning:'boy / youth'},
        ] },
      { id:'old', kanji:'古', kun:'ふる', on:'コ', en:'old', strokes:5,
        examples:[
          {word:'古い',   reading:'furui', meaning:'old (of things)'},
          {word:'古本',   reading:'furuhon', meaning:'used book'},
          {word:'中古',   reading:'CHŪKO', meaning:'second-hand'},
        ] },
      { id:'new', kanji:'新', kun:'あたら', on:'シン', en:'new', strokes:13,
        examples:[
          {word:'新しい', reading:'atarashii', meaning:'new'},
          {word:'新聞',   reading:'SHINBUN', meaning:'newspaper'},
          {word:'最新',   reading:'SAISHIN', meaning:'newest'},
        ] },
      { id:'long', kanji:'長', kun:'なが', on:'チョウ', en:'long / chief', strokes:8,
        examples:[
          {word:'長い',   reading:'nagai', meaning:'long'},
          {word:'社長',   reading:'SHACHŌ', meaning:'company president'},
          {word:'校長',   reading:'KŌCHŌ', meaning:'school principal'},
        ] },
      { id:'short', kanji:'短', kun:'みじか', on:'タン', en:'short', strokes:12,
        examples:[
          {word:'短い',   reading:'mijikai', meaning:'short'},
          {word:'短時間', reading:'TANJIKAN', meaning:'short time'},
          {word:'短歌',   reading:'TANKA', meaning:'tanka poetry'},
        ] },
      { id:'strong', kanji:'強', kun:'つよ', on:'キョウ', en:'strong', strokes:11,
        examples:[
          {word:'強い',   reading:'tsuyoi', meaning:'strong'},
          {word:'勉強',   reading:'BENKYŌ', meaning:'study'},
          {word:'強化',   reading:'KYŌKA', meaning:'reinforcement'},
        ] },
      { id:'weak', kanji:'弱', kun:'よわ', on:'ジャク', en:'weak', strokes:10,
        examples:[
          {word:'弱い',   reading:'yowai', meaning:'weak'},
          {word:'弱点',   reading:'JAKUTEN', meaning:'weakness'},
          {word:'弱気',   reading:'yowaki', meaning:'timidity'},
        ] },
    ],
  },
  {
    id: 'onomatopoeia',
    titleJa: 'オノマトペ',
    titleEn: 'Onomatopoeia',
    glyph: '音',
    imageFolder: 'vocabulary',
    cards: [
      { id:'nikoniko',   kanji:'にこにこ',     kun:'niko niko',   on:'', en:'smiling, beaming', tags:['jougo'],
        examples:[{word:'にこにこ笑う',reading:'niko niko warau',meaning:'to smile broadly'},{word:'にこにこ顔',reading:'niko niko gao',meaning:'smiley face'}] },
      { id:'poyopoyo',   kanji:'ぽよぽよ',     kun:'poyo poyo',   on:'', en:'soft and squishy', tags:['jougo'],
        examples:[{word:'ぽよぽよした肌',reading:'poyo poyo shita hada',meaning:'soft squishy skin'},{word:'ぽよぽよのお腹',reading:'poyo poyo no onaka',meaning:'squishy belly'}] },
      { id:'chikuchiku', kanji:'ちくちく',     kun:'chiku chiku',  on:'', en:'prickly, stinging', tags:['jougo'],
        examples:[{word:'ちくちく痛い',reading:'chiku chiku itai',meaning:'to sting / prickle'},{word:'ちくちくする',reading:'chiku chiku suru',meaning:'to feel prickly'}] },
      { id:'funyafunya', kanji:'ふにゃふにゃ', kun:'funya funya',  on:'', en:'floppy, limp', tags:['jougo'],
        examples:[{word:'ふにゃふにゃになる',reading:'funya funya ni naru',meaning:'to go all floppy'},{word:'ふにゃふにゃの麺',reading:'funya funya no men',meaning:'limp noodles'}] },
      { id:'kusukusu',   kanji:'くすくす',     kun:'kusu kusu',    on:'', en:'giggling, snickering', tags:['jougo'],
        examples:[{word:'くすくす笑う',reading:'kusu kusu warau',meaning:'to giggle'},{word:'くすくす笑い',reading:'kusu kusu warai',meaning:'a giggle / snicker'}] },
      { id:'nyanya',     kanji:'にゃーにゃー', kun:'nyā nyā',      on:'', en:'meow meow', tags:['jougo'],
        examples:[{word:'にゃーにゃー鳴く',reading:'nyā nyā naku',meaning:'to meow'},{word:'にゃーと鳴く',reading:'nyā to naku',meaning:'to go meow'}] },
      { id:'wanwan',     kanji:'ワンワン',     kun:'wan wan',      on:'', en:'woof woof (dog barking)', tags:['jougo'],
        examples:[{word:'ワンワン吠える',reading:'wan wan hoeru',meaning:'to bark (woof woof)'},{word:'ワンワンと鳴く',reading:'wan wan to naku',meaning:'the dog goes woof'}] },
      { id:'pitari',     kanji:'ぴたり',       kun:'pitari',       on:'', en:'exactly right / stopping dead', tags:['jougo'],
        examples:[{word:'ぴたりと合う',reading:'pitari to au',meaning:'to match exactly'},{word:'ぴたりと止まる',reading:'pitari to tomaru',meaning:'to stop dead'}] },
      { id:'pyonpyon',   kanji:'ぴょんぴょん', kun:'pyon pyon',    on:'', en:'hopping, bouncing', tags:['jougo'],
        examples:[{word:'ぴょんぴょん跳ぶ',reading:'pyon pyon tobu',meaning:'to hop around'},{word:'ぴょんと跳ねる',reading:'pyon to haneru',meaning:'to bounce up'}] },
      { id:'potapota',   kanji:'ぽたぽた',     kun:'pota pota',    on:'', en:'drip drip', tags:['jougo'],
        examples:[{word:'ぽたぽた落ちる',reading:'pota pota ochiru',meaning:'to drip down'},{word:'ぽたぽた垂れる',reading:'pota pota tareru',meaning:'to dribble'}] },
      { id:'korokoro',   kanji:'コロコロ',     kun:'koro koro',    on:'', en:'rolling, tumbling', tags:['jougo'],
        examples:[{word:'コロコロ転がる',reading:'koro koro korogaru',meaning:'to roll around'},{word:'コロコロ変わる',reading:'koro koro kawaru',meaning:'to change frequently'}] },
    ],
  },
];

// Flat list for any code that still expects FLASHCARDS as a single array.
window.FLASHCARDS = window.FLASHCARD_CLASSES.flatMap(c => c.cards);

// ── RADICALS ───────────────────────────────────────────────────────────
// The Kangxi-style radical inventory used by jisho.org/#radical, grouped by
// stroke count. Includes positional variants (⺅, ⺾, ⻌, ⺣ etc.) alongside
// the canonical 214 radicals — this is what shows up in the radical-search
// grid. Stroke counts are dense in the low single digits and sparse past 8;
// the gaps (15, 16) are intentional — no radicals at those counts.
window.RADICALS_BY_STROKE = [
  { strokes:1,  chars:['一','｜','丶','ノ','乙','亅'] },
  { strokes:2,  chars:['二','亠','人','⺅','𠆢','儿','入','ハ','丷','冂','冖','冫','几','凵','刀','⺉','力','勹','匕','匚','十','卜','卩','厂','厶','又','マ','九','ユ','乃','𠂉'] },
  { strokes:3,  chars:['⻌','口','囗','土','士','夂','夕','大','女','子','宀','寸','小','⺌','尢','尸','屮','山','川','巛','工','已','巾','干','幺','广','廴','廾','弋','弓','ヨ','彑','彡','彳','⺖','⺘','⺡','⺨','⺾','⻏','⻖','也','亡','及','久'] },
  { strokes:4,  chars:['⺹','心','戈','戸','手','支','攵','文','斗','斤','方','无','日','曰','月','木','欠','止','歹','殳','比','毛','氏','气','水','火','⺣','爪','父','爻','爿','片','牛','犬','⺭','王','元','井','勿','尤','五','屯','巴','毋'] },
  { strokes:5,  chars:['玄','瓦','甘','生','用','田','疋','疒','癶','白','皮','皿','目','矛','矢','石','示','禸','禾','穴','立','⻂','世','巨','冊','母','⺲','牙'] },
  { strokes:6,  chars:['瓜','竹','米','糸','缶','羊','羽','而','耒','耳','聿','肉','自','至','臼','舌','舟','艮','色','虍','虫','血','行','衣','西'] },
  { strokes:7,  chars:['臣','見','角','言','谷','豆','豕','豸','貝','赤','走','足','身','車','辛','辰','酉','釆','里','舛','麦'] },
  { strokes:8,  chars:['金','長','門','隶','隹','雨','青','非','奄','岡','免','斉'] },
  { strokes:9,  chars:['面','革','韭','音','頁','風','飛','食','首','香','品'] },
  { strokes:10, chars:['馬','骨','高','髟','鬥','鬯','鬲','鬼','竜','韋'] },
  { strokes:11, chars:['魚','鳥','鹵','鹿','麻','亀','啇','黄','黒'] },
  { strokes:12, chars:['黍','黹','無','歯'] },
  { strokes:13, chars:['黽','鼎','鼓','鼠'] },
  { strokes:14, chars:['鼻','齊'] },
  { strokes:17, chars:['龠'] },
];

// Kanji → constituent radicals (using the exact glyphs from RADICALS_BY_STROKE
// so the filter intersection works on identity). This is a curated subset
// covering the kanji in our flashcard deck. Each entry lists the radicals a
// learner would intuitively see when looking at the kanji — not the full IDS
// decomposition. Unmapped kanji simply won't appear in filter results, which
// is acceptable for an MVP — the table grows as we go.
//
// Convention: when a kanji IS itself a radical (人, 木, 山, 雨, 音, etc.) we
// map it to a single-element array containing itself, so selecting that
// radical surfaces the kanji.
window.KANJI_RADICALS = {
  // Basic
  '宀':['宀'], '刀':['刀'], '力':['力'], '弓':['弓'],
  '市':['亠','巾'], '田':['田'], '町':['田'], '村':['木','寸'],
  '王':['王'], '生':['生'], '国':['囗','王'],
  '日':['日'], '月':['月'], '山':['山'], '川':['川'],
  '大':['大'], '小':['小'], '円':['冂'], '金':['金'],
  '玉':['王','丶'], '糸':['糸'], '車':['車'], '立':['立'],
  // People
  '人':['人'], '入':['入'], '母':['母'], '女':['女'],
  '姉':['女','巾','亠'], '妹':['女','木'], '父':['父'],
  '男':['田','力'], '兄':['口','儿'], '弟':['弓'],
  '子':['子'], '好':['女','子'], '友':['又'], '反':['厂','又'],
  '字':['宀','子'],
  // Nature
  '火':['火'], '炎':['火'], '水':['水'], '氷':['水','丶'], '元気':['儿','气'],
  '木':['木'], '本':['木','一'], '土':['土'], '去':['土','厶'],
  '林':['木'], '森':['木'],
  '厂':['厂'], '石':['石'], '岩':['山','石'], '宕':['宀','石'],
  '未':['木'], '虫':['虫'],
  '春':['日'], '夏':['夂'], '秋':['禾','火'], '冬':['夂','冫'],
  '雨':['雨'], '傘':['人','十'], '風':['風'], '空':['穴','工'],
  '花':['⺾'], '雪':['雨','ヨ'], '雲':['雨'], '星':['日','生'],
  '葉':['⺾','木'], '草':['⺾'],
  '竹':['竹'], '犬':['犬'], '貝':['貝'], '気':['气'],
  // Body
  '体':['⺅','木'], '休':['⺅','木'], '手':['手'],
  '目':['目'], '見':['見'], '自':['自'], '首':['目'],
  '口':['口'], '耳':['耳'], '足':['足'], '心':['心'],
  // Drinks/Food
  '茶':['⺾','木','人'],
  // Numbers
  '一':['一'], '二':['二'], '三':['一'], '四':['囗'],
  '五':['五'], '六':['亠','ハ'], '七':['一'], '八':['ハ'],
  '九':['九'], '十':['十'], '百':['白','一'], '千':['ノ','十'],
  // Colors
  '色':['色'], '白':['白'], '赤':['赤'], '青':['青'],
  '黒':['黒'], '緑':['糸'], '紫':['止','匕','糸'],
  // School
  '学':['子','⺌'], '校':['木'], '文':['文'],
  '書':['聿','日'], '筆':['竹','聿'],
  '名':['夕','口'], '正':['止'],
  // Concepts
  '音':['音'], '双':['又'],
  // Directions
  '上':['卜','一'], '下':['卜','一'], '左':['工'], '右':['口'], '中':['口'],
  // Rooms
  '戸':['戸'], '門':['門'], '閤':['門'], '窓':['穴','心'],
  '開':['門'], '出':['凵'], '床':['广','木'],
  '棚':['木','月'],
  // Time — anchored on 今 (now), then expanded outward. 先 cluster sits in
  // the middle, daily-rhythm pair (early/late, noon/evening) follows, and
  // the clock face (hour, minute, second) closes. 日 / 月 / 年 themselves
  // live in Basic (not duplicated here).
  '今':['人'], '今日':['人','日'], '今週':['人','⻌'],
  '今月':['人','月'], '今年':['人','ノ','十'],
  '先':['儿'], '昨日':['日'], '去年':['土','厶','ノ','十'],
  '来':['木','一'], '来年':['木','一','ノ','十'],
  '先生':['儿','生'],
  '早':['日','十'], '遅':['⻌','尸','羊'], '昼':['尸','日'], '夕':['夕'],
  '時':['日','寸'], '分':['ハ','刀'], '秒':['禾','小'],
  // Animals
  '猫':['⺨','⺾','田'], '鳥':['鳥'], '鶏':['鳥'],
  '豚':['豕','月'], '牛':['牛'], '魚':['魚'], '蛸':['虫'],
  '馬':['馬'],
  // Body 2
  '頭':['豆','頁'], '顔':['立','彡','頁'], '髪':['髟'],
  '歯':['歯'], '鼻':['鼻'], '腕':['月','宀'],
};

// ── RESTAURANT SCENES ─────────────────────────────────────────────────
// Interactive ordering experiences for the Eating Out vocab books. Each
// scene is a step-array driven by a shared engine in app.html. Steps share
// a small vocabulary of types: dialogue, menu, order, wait, receive,
// extras, pay, goodbye. Items in steps may carry `variants` for
// repeatability — the engine picks one at random per visit.
//
// Adding a new restaurant = adding a key here. No engine changes needed.
//
// Currently only ramen-ya is fully populated; the others ship as "coming
// soon" stubs that the engine renders politely.
// Per-category templates: the step arc + dialogue, shared across every shop
// in that category. Each step references a `svg` key — the engine resolves
// it to `images/food/${svg}.svg`. Restaurant variants supply NPC, setting,
// and menu; the template supplies the conversational scaffold.

// ── KONBINI SHELVES ───────────────────────────────────────────────────
// Shared across all 3 convenience-store variants — the konbini experience
// is "browse the same aisles" no matter which chain you walk into. Five
// sections, each with two-column item grid. Items declare an `id` used
// for the per-item image lookup: images/konbini/<id>.png (placeholder.svg
// fallback). Picking items adds them to state.selected the same way
// menu rows do, so order/pay/goodbye work unchanged.
//
// Onigiri flavors are the canonical top-5 staples you'll find at every
// chain (ツナマヨ leads modern surveys; the others rotate in the top 5).
window.KONBINI_SECTIONS = [
  {
    id: 'onigiri', glyph: '飯',
    label: { ja: 'おにぎり', en: 'Rice balls' },
    items: [
      { id:'onigiri-tunamayo', kanji:'ツナマヨ',  kana:'ツナマヨ',     en:'tuna mayo (#1 best-seller)', price:160, category:'food' },
      { id:'onigiri-sake',     kanji:'鮭',         kana:'しゃけ',       en:'grilled salmon',             price:170, category:'food', furigana:'<ruby>鮭<rt>しゃけ</rt></ruby>' },
      { id:'onigiri-mentaiko', kanji:'明太子',     kana:'めんたいこ',   en:'spicy pollack roe',          price:190, category:'food', furigana:'<ruby>明太子<rt>めんたいこ</rt></ruby>' },
      { id:'onigiri-ume',      kanji:'梅',         kana:'うめ',         en:'pickled plum',               price:130, category:'food', furigana:'<ruby>梅<rt>うめ</rt></ruby>' },
      { id:'onigiri-kombu',    kanji:'こんぶ',     kana:'こんぶ',       en:'simmered kelp',              price:140, category:'food' },
    ],
  },
  {
    id: 'drinks', glyph: '飲',
    label: { ja: '飲み物', en: 'Drinks', furigana: '<ruby>飲<rt>の</rt></ruby>み<ruby>物<rt>もの</rt></ruby>' },
    items: [
      { id:'drink-ocha',    kanji:'お茶',       kana:'おちゃ',         en:'green tea (bottle)',    price:150, category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
      { id:'drink-coffee',  kanji:'コーヒー',   kana:'こーひー',       en:'canned coffee',         price:130, category:'drink' },
      { id:'drink-water',   kanji:'お水',       kana:'おみず',         en:'bottled water',         price:110, category:'drink', furigana:'お<ruby>水<rt>みず</rt></ruby>' },
      { id:'drink-pocari',  kanji:'ポカリ',     kana:'ぽかり',         en:'Pocari Sweat (sports)', price:160, category:'drink' },
      { id:'drink-juice',   kanji:'オレンジ',   kana:'オレンジジュース', en:'orange juice',          price:170, category:'drink' },
      { id:'drink-beer',    kanji:'ビール',     kana:'びーる',         en:'beer (can)',            price:280, category:'drink' },
    ],
  },
  {
    id: 'hot', glyph: '温',
    label: { ja: 'ホットフード', en: 'Hot food' },
    items: [
      { id:'hot-nikuman',     kanji:'肉まん',     kana:'にくまん',       en:'steamed pork bun',     price:150, category:'food', furigana:'<ruby>肉<rt>にく</rt></ruby>まん' },
      { id:'hot-karaage',     kanji:'からあげ',   kana:'からあげ',       en:'fried chicken',        price:200, category:'food' },
      { id:'hot-oden',        kanji:'おでん',     kana:'おでん',         en:'oden (simmered stew)', price:220, category:'food' },
      { id:'hot-frankfurt',   kanji:'フランク',   kana:'ふらんく',       en:'frankfurter on a stick', price:180, category:'food' },
      { id:'hot-korokke',     kanji:'コロッケ',   kana:'ころっけ',       en:'potato croquette',     price:130, category:'food' },
    ],
  },
  {
    id: 'sweets', glyph: '菓',
    label: { ja: 'お菓子', en: 'Snacks & sweets', furigana: 'お<ruby>菓子<rt>かし</rt></ruby>' },
    items: [
      { id:'sweet-pocky',     kanji:'ポッキー',     kana:'ぽっきー',       en:'Pocky',              price:160, category:'food' },
      { id:'sweet-haagen',    kanji:'ハーゲンダッツ', kana:'はーげんだっつ', en:'Häagen-Dazs (ice cream)', price:340, category:'food' },
      { id:'sweet-purin',     kanji:'プリン',       kana:'ぷりん',         en:'caramel pudding',    price:180, category:'food' },
      { id:'sweet-daifuku',   kanji:'大福',         kana:'だいふく',       en:'mochi with red bean', price:150, category:'food', furigana:'<ruby>大福<rt>だいふく</rt></ruby>' },
      { id:'sweet-choco',     kanji:'チョコ',       kana:'ちょこ',         en:'chocolate bar',      price:140, category:'food' },
      { id:'sweet-gummy',     kanji:'グミ',         kana:'ぐみ',           en:'gummy candy',        price:120, category:'food' },
    ],
  },
  {
    id: 'misc', glyph: '雑',
    label: { ja: '雑貨', en: 'Cigarettes & misc', furigana: '<ruby>雑貨<rt>ざっか</rt></ruby>' },
    items: [
      { id:'misc-tabako',    kanji:'タバコ',     kana:'たばこ',         en:'cigarettes',          price:600, category:'misc' },
      { id:'misc-lighter',   kanji:'ライター',   kana:'らいたー',       en:'lighter',             price:100, category:'misc' },
      { id:'misc-denchi',    kanji:'電池',       kana:'でんち',         en:'AA batteries (4-pack)', price:380, category:'misc', furigana:'<ruby>電池<rt>でんち</rt></ruby>' },
      { id:'misc-kasa',      kanji:'傘',         kana:'かさ',           en:'plastic umbrella',    price:500, category:'misc', furigana:'<ruby>傘<rt>かさ</rt></ruby>' },
      { id:'misc-charger',   kanji:'充電器',     kana:'じゅうでんき',   en:'phone charger',       price:1200, category:'misc', furigana:'<ruby>充電器<rt>じゅうでんき</rt></ruby>' },
      { id:'misc-bandaid',   kanji:'絆創膏',     kana:'ばんそうこう',   en:'band-aids',           price:280, category:'misc', furigana:'<ruby>絆創膏<rt>ばんそうこう</rt></ruby>' },
    ],
  },
];

window.RESTAURANT_TEMPLATES = {
  'ramen': {
    steps: [
      // 1. Greeting — server calls out, you pick a hello. NPC variants
      // and player choices are personality-tagged so a gruff shop doesn't
      // shout cheerfully and a formal shop doesn't get a casual "yo".
      { id:'greet', type:'dialogue', svg:'greet-bow',
        npc: {
          ja: 'いらっしゃい!',
          en: 'Welcome!',
          variants: [
            // warm — friendly, default ramen-shop vibe
            { ja:'いらっしゃい!', en:'Welcome!', personality:'warm' },
            { ja:'はい、いらっしゃい!', en:'Yes, welcome in!', personality:'warm' },
            { ja:'今日も寒いね。座って座って!', en:"Cold again today, huh. Sit, sit!", personality:'warm',
              furigana:'<ruby>今日<rt>きょう</rt></ruby>も<ruby>寒<rt>さむ</rt></ruby>いね。<ruby>座<rt>すわ</rt></ruby>って<ruby>座<rt>すわ</rt></ruby>って!' },
            // formal — keigo, restrained
            { ja:'いらっしゃいませ。', en:'Welcome (formal).', personality:'formal' },
            { ja:'お席へどうぞ。', en:'Please, take a seat.', personality:'formal',
              furigana:'お<ruby>席<rt>せき</rt></ruby>へどうぞ。' },
            // chatty — talks more
            { ja:'おっ、お客さん! 久しぶり?', en:"Oh, customer! Been a while?", personality:'chatty',
              furigana:'おっ、お<ruby>客<rt>きゃく</rt></ruby>さん! <ruby>久<rt>ひさ</rt></ruby>しぶり?' },
            { ja:'いいタイミング! 今、空いてるよ。', en:"Good timing! It's open right now.", personality:'chatty' },
            // gruff — minimal
            { ja:'おう。', en:'Yeah.', personality:'gruff' },
            { ja:'…いらっしゃい。', en:'...welcome.', personality:'gruff' },
            // cold — almost silent
            { ja:'(無言で頷く)', en:'(silent nod)', personality:'cold' },
            { ja:'(視線だけ)', en:'(just a glance)', personality:'cold',
              furigana:'(<ruby>視線<rt>しせん</rt></ruby>だけ)' },
          ],
        },
        narrative: {
          ja:'カウンターに座る。', en:'You sit at the counter.',
          furigana:'カウンターに<ruby>座<rt>すわ</rt></ruby>る。',
        },
        choices: [
          // Universal — anyone can say this
          { ja:'こんにちは。', kana:'konnichi wa', en:'Hello.' },
          // Warm/chatty fit casual greetings
          { ja:'どうも。', kana:'dōmo', en:'Hey.', personality:['warm','chatty','gruff'] },
          { ja:'お邪魔します。', kana:'ojama shimasu', en:'Excuse me (entering).', personality:['warm','formal','chatty'],
            furigana:'お<ruby>邪魔<rt>じゃま</rt></ruby>します。' },
          // Formal-leaning
          { ja:'お願いします。', kana:'onegai shimasu', en:'Please.', personality:['formal','warm','chatty'],
            furigana:'お<ruby>願<rt>ねが</rt></ruby>いします。' },
          { ja:'すみません。', kana:'sumimasen', en:'Excuse me.', personality:['formal','gruff','cold'] },
          // Closed shop — silent option
          { ja:'(黙って座る)', kana:'(silent)', en:'(sit quietly)', personality:['cold','gruff'],
            furigana:'(<ruby>黙<rt>だま</rt></ruby>って<ruby>座<rt>すわ</rt></ruby>る)' },
          // Chatty response (reciprocate)
          { ja:'こんばんは、お久しぶりです。', kana:'konban wa, ohisashiburi desu', en:"Good evening, it's been a while.", personality:['chatty','warm'],
            furigana:'こんばんは、お<ruby>久<rt>ひさ</rt></ruby>しぶりです。' },
        ],
        next: 'menu',
      },

      // 2. Menu — paper-typeset menu page, pick a ramen + optional side.
      { id:'menu', type:'menu', svg:'menu-paper',
        prompt: {
          ja:'メニューを見る。何にしようか。',
          en:'You look at the menu. What will it be?',
          furigana:'メニューを<ruby>見<rt>み</rt></ruby>る。<ruby>何<rt>なに</rt></ruby>にしようか。',
        },
        items: [
          { kanji:'醤油ラーメン',   kana:'しょうゆラーメン',   en:'soy-sauce ramen',     price:900,  category:'ramen', furigana:'<ruby>醤油<rt>しょうゆ</rt></ruby>ラーメン' },
          { kanji:'味噌ラーメン',   kana:'みそラーメン',       en:'miso ramen',          price:950,  category:'ramen', furigana:'<ruby>味噌<rt>みそ</rt></ruby>ラーメン' },
          { kanji:'塩ラーメン',     kana:'しおラーメン',       en:'salt ramen',          price:850,  category:'ramen', furigana:'<ruby>塩<rt>しお</rt></ruby>ラーメン' },
          { kanji:'豚骨ラーメン',   kana:'とんこつラーメン',   en:'pork-bone ramen',    price:1000,  category:'ramen', furigana:'<ruby>豚骨<rt>とんこつ</rt></ruby>ラーメン' },
          { kanji:'つけ麺',         kana:'つけめん',           en:'dipping noodles',    price:1100,  category:'ramen', furigana:'つけ<ruby>麺<rt>めん</rt></ruby>' },
          { kanji:'担々麺',         kana:'たんたんめん',       en:'spicy sesame ramen', price:1050,  category:'ramen', furigana:'<ruby>担々麺<rt>たんたんめん</rt></ruby>' },
          { kanji:'焼き餃子',       kana:'やきぎょうざ',       en:'pan-fried dumplings', price:500,  category:'side',  furigana:'<ruby>焼<rt>や</rt></ruby>き<ruby>餃子<rt>ぎょうざ</rt></ruby>' },
          { kanji:'チャーシュー丼', kana:'チャーシューどん',   en:'pork rice bowl',      price:600,  category:'side',  furigana:'チャーシュー<ruby>丼<rt>どん</rt></ruby>' },
          { kanji:'生ビール',       kana:'なまびーる',         en:'draft beer',          price:550,  category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
          { kanji:'お茶',           kana:'おちゃ',             en:'green tea',           price:0,    category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
        ],
        // Up to 3 picks so the player can grab ramen + a side + a drink.
        pick: { min:1, max:3, requireCategory:'ramen' },
        next: 'recommend',
      },

      // 3. Optional branch: ask for a recommendation. Skips by default.
      { id:'recommend', type:'branch', svg:'menu-point',
        prompt: {
          ja:'おすすめを聞いてもいい。',
          en:'You could ask for a recommendation. Or not.',
          furigana:'おすすめを<ruby>聞<rt>き</rt></ruby>いてもいい。',
        },
        choices: [
          { id:'ask',  ja:'おすすめは何ですか?', kana:'osusume wa nan desu ka', en:"What do you recommend?",      next:'recommend-reply',
            furigana:'おすすめは<ruby>何<rt>なん</rt></ruby>ですか?' },
          { id:'skip', ja:'(注文に進む)',        kana:'(skip)',                  en:'(go straight to ordering)', next:'order',
            furigana:'(<ruby>注文<rt>ちゅうもん</rt></ruby>に<ruby>進<rt>すす</rt></ruby>む)' },
        ],
      },
      { id:'recommend-reply', type:'dialogue', svg:'menu-point',
        npc: {
          ja: '今日は味噌が美味いよ。寒いからね。',
          en: 'The miso is good today. It\'s cold out, after all.',
          furigana: '<ruby>今日<rt>きょう</rt></ruby>は<ruby>味噌<rt>みそ</rt></ruby>が<ruby>美味<rt>うま</rt></ruby>いよ。<ruby>寒<rt>さむ</rt></ruby>いからね。',
          variants: [
            { ja:'今日は味噌が美味いよ。寒いからね。', en:"The miso is good today. It's cold out.",
              furigana:'<ruby>今日<rt>きょう</rt></ruby>は<ruby>味噌<rt>みそ</rt></ruby>が<ruby>美味<rt>うま</rt></ruby>いよ。<ruby>寒<rt>さむ</rt></ruby>いからね。' },
            { ja:'やっぱり豚骨でしょう。', en:"Tonkotsu, of course.",
              furigana:'やっぱり<ruby>豚骨<rt>とんこつ</rt></ruby>でしょう。' },
            { ja:'つけ麺、いいよ。', en:"Tsukemen — that's a good choice.",
              furigana:'つけ<ruby>麺<rt>めん</rt></ruby>、いいよ。' },
          ],
        },
        choices: [
          { ja:'じゃあ、それで。',     kana:'jā, sore de',       en:'That, then.' },
          { ja:'ありがとうございます。', kana:'arigatō gozaimasu', en:'Thank you (I\'ll think).' },
        ],
        next: 'order',
      },

      // 4. Order — assemble your sentence. Engine inserts selection.
      { id:'order', type:'order', svg:'order-speak',
        prompt: {
          ja:'注文する。', en:'Place your order.',
          furigana:'<ruby>注文<rt>ちゅうもん</rt></ruby>する。',
        },
        template: {
          ja: '{items} を お願いします。',
          en: 'I\'ll have {items}, please.',
          furigana: '{items} を お<ruby>願<rt>ねが</rt></ruby>いします。',
        },
        confirm: {
          ja:'はい、{items}ですね。少々お待ちください。',
          en:'Right, {items}. One moment please.',
          furigana:'はい、{items}ですね。<ruby>少々<rt>しょうしょう</rt></ruby>お<ruby>待<rt>ま</rt></ruby>ちください。',
        },
        next: 'wait',
      },

      // 5. The Pause — atmospheric beat.
      { id:'wait', type:'wait', svg:'wait-clock',
        lines: [
          { ja:'湯気。麺を打つ音。', en:'Steam. The sound of noodles being struck against the board.',
            furigana:'<ruby>湯気<rt>ゆげ</rt></ruby>。<ruby>麺<rt>めん</rt></ruby>を<ruby>打<rt>う</rt></ruby>つ<ruby>音<rt>おと</rt></ruby>。' },
          { ja:'隣の客がビールを飲んでいる。', en:'The customer next to you is drinking a beer.',
            furigana:'<ruby>隣<rt>となり</rt></ruby>の<ruby>客<rt>きゃく</rt></ruby>がビールを<ruby>飲<rt>の</rt></ruby>んでいる。' },
          { ja:'時計の音だけが聞こえる。', en:'Only the ticking of the clock.',
            furigana:'<ruby>時計<rt>とけい</rt></ruby>の<ruby>音<rt>おと</rt></ruby>だけが<ruby>聞<rt>き</rt></ruby>こえる。' },
        ],
        next: 'receive',
      },

      // 6. Receive — the bowl arrives. Hover ingredients to learn vocab.
      { id:'receive', type:'receive', svg:'bowl-ramen',
        npc: {
          ja:'お待たせしました。', en:'Sorry to keep you waiting.',
          furigana:'お<ruby>待<rt>ま</rt></ruby>たせしました。',
        },
        narrative: {
          ja:'湯気が立つ。', en:'Steam rises.',
          furigana:'<ruby>湯気<rt>ゆげ</rt></ruby>が<ruby>立<rt>た</rt></ruby>つ。',
        },
        vocab: [
          { kanji:'麺',           kana:'めん',         en:'noodles',           furigana:'<ruby>麺<rt>めん</rt></ruby>' },
          { kanji:'スープ',       kana:'すーぷ',       en:'soup / broth' },
          { kanji:'葱',           kana:'ねぎ',         en:'green onion',       furigana:'<ruby>葱<rt>ねぎ</rt></ruby>' },
          { kanji:'玉子',         kana:'たまご',       en:'egg',               furigana:'<ruby>玉子<rt>たまご</rt></ruby>' },
          { kanji:'海苔',         kana:'のり',         en:'nori (seaweed)',    furigana:'<ruby>海苔<rt>のり</rt></ruby>' },
          { kanji:'チャーシュー', kana:'ちゃーしゅー', en:'roast pork slice' },
          { kanji:'メンマ',       kana:'めんま',       en:'bamboo shoots' },
          { kanji:'コーン',       kana:'こーん',       en:'corn' },
        ],
        prompt: { ja:'いただきます。', en:'(Thank you for the meal — said before eating.)' },
        next: 'extras',
      },

      // 7. Extras branch — refill noodles (kaedama) yes/no.
      { id:'extras', type:'branch', svg:'bowl-ramen',
        prompt: {
          ja:'麺を半分くらい食べた。', en:'You\'ve eaten about half the noodles.',
          furigana:'<ruby>麺<rt>めん</rt></ruby>を<ruby>半分<rt>はんぶん</rt></ruby>くらい<ruby>食<rt>た</rt></ruby>べた。',
        },
        choices: [
          { id:'kaedama', ja:'替え玉、お願いします。', kana:'kaedama, onegai shimasu', en:'Extra noodles, please.', next:'kaedama-reply',
            furigana:'<ruby>替<rt>か</rt></ruby>え<ruby>玉<rt>だま</rt></ruby>、お<ruby>願<rt>ねが</rt></ruby>いします。' },
          { id:'none',    ja:'(そのまま食べ終える)',   kana:'(finish as is)',           en:'(finish as is)',          next:'pay',
            furigana:'(そのまま<ruby>食<rt>た</rt></ruby>べ<ruby>終<rt>お</rt></ruby>える)' },
        ],
      },
      { id:'kaedama-reply', type:'dialogue', svg:'bowl-ramen',
        npc: {
          ja:'はい、固さは?', en:'Sure — how firm do you want them?',
          furigana:'はい、<ruby>固<rt>かた</rt></ruby>さは?',
        },
        choices: [
          { ja:'普通で。',     kana:'futsū de',     en:'Normal, please.',     furigana:'<ruby>普通<rt>ふつう</rt></ruby>で。' },
          { ja:'硬めで。',     kana:'katame de',    en:'Firm, please.',       furigana:'<ruby>硬<rt>かた</rt></ruby>めで。' },
          { ja:'バリカタで。', kana:'barikata de',  en:'Extra firm, please.' },
        ],
        addPrice: 200,
        next: 'pay',
      },

      // 8. Pay — cash or card.
      { id:'pay', type:'pay', svg:'pay-register',
        npc: {
          ja:'お会計は{total}円になります。', en:'That comes to ¥{total}.',
          furigana:'お<ruby>会計<rt>かいけい</rt></ruby>は{total}<ruby>円<rt>えん</rt></ruby>になります。',
        },
        choices: [
          { id:'cash', ja:'現金で。', kana:'genkin de', en:'Cash, please.', furigana:'<ruby>現金<rt>げんきん</rt></ruby>で。' },
          { id:'card', ja:'カードで。', kana:'kādo de',  en:'Card, please.' },
        ],
        next: 'goodbye',
      },

      // 9. Goodbye — polite exit. Variants by personality.
      { id:'goodbye', type:'goodbye', svg:'bow-thanks',
        npc: {
          ja: 'ありがとうございました! また来てくださいね。',
          en: 'Thank you very much! Come again.',
          furigana:'ありがとうございました! また<ruby>来<rt>き</rt></ruby>てくださいね。',
          variants: [
            // warm
            { ja:'ありがとう! また来てね。', en:'Thanks! Come back soon.', personality:'warm',
              furigana:'ありがとう! また<ruby>来<rt>き</rt></ruby>てね。' },
            { ja:'ありがとうございました! また来てくださいね。', en:'Thank you very much! Come again.', personality:'warm',
              furigana:'ありがとうございました! また<ruby>来<rt>き</rt></ruby>てくださいね。' },
            // formal
            { ja:'ありがとうございました。お気をつけて。', en:'Thank you. Take care on your way.', personality:'formal',
              furigana:'ありがとうございました。お<ruby>気<rt>き</rt></ruby>をつけて。' },
            // chatty
            { ja:'ありがとう! 今度はもっと早く来てね!', en:'Thanks! Come back sooner next time!', personality:'chatty',
              furigana:'ありがとう! <ruby>今度<rt>こんど</rt></ruby>はもっと<ruby>早<rt>はや</rt></ruby>く<ruby>来<rt>き</rt></ruby>てね!' },
            // gruff
            { ja:'おう、また。', en:'Yeah, later.', personality:'gruff' },
            { ja:'どうも。', en:'Thanks.', personality:'gruff' },
            // cold
            { ja:'(軽く頭を下げる)', en:'(slight bow)', personality:'cold',
              furigana:'(<ruby>軽<rt>かる</rt></ruby>く<ruby>頭<rt>あたま</rt></ruby>を<ruby>下<rt>さ</rt></ruby>げる)' },
          ],
        },
        choices: [
          { ja:'ごちそうさまでした。', kana:'gochisōsama deshita', en:'It was a feast. (Thanks for the meal.)' },
          { ja:'美味しかったです!', kana:'oishikatta desu', en:'It was delicious!', personality:['warm','chatty','formal'],
            furigana:'<ruby>美味<rt>おい</rt></ruby>しかったです!' },
          { ja:'また来ます。', kana:'mata kimasu', en:"I'll come again.", personality:['warm','chatty','formal'],
            furigana:'また<ruby>来<rt>き</rt></ruby>ます。' },
          { ja:'どうも。', kana:'dōmo', en:'Thanks.', personality:['gruff','cold','warm'] },
          { ja:'(軽く頭を下げて出る)', kana:'(slight bow and leave)', en:'(slight bow, then leave)', personality:['cold','gruff'],
            furigana:'(<ruby>軽<rt>かる</rt></ruby>く<ruby>頭<rt>あたま</rt></ruby>を<ruby>下<rt>さ</rt></ruby>げて<ruby>出<rt>で</rt></ruby>る)' },
        ],
        next: 'receipt',
      },

      // 10. Receipt — outro. Auto-rendered by engine from session state.
      { id:'receipt', type:'receipt', svg:'receipt-paper' },
    ],
  },

  // Lite template — a shorter 7-step arc shared by non-ramen restaurants.
  // Variants supply menu items, NPC, setting. Greeting → menu → order →
  // receive → pay → goodbye → receipt. No optional branches (kept tight).
  'lite': {
    steps: [
      { id:'greet', type:'dialogue', svg:'greet-bow',
        npc: {
          ja:'いらっしゃいませ。', en:'Welcome.',
          variants: [
            // warm
            { ja:'いらっしゃい!', en:'Welcome!', personality:'warm' },
            { ja:'はーい、こんにちは!', en:'Hey, hello there!', personality:'warm' },
            { ja:'お疲れさまです!', en:"Welcome — long day, huh?", personality:'warm',
              furigana:'お<ruby>疲<rt>つか</rt></ruby>れさまです!' },
            // formal
            { ja:'いらっしゃいませ。', en:'Welcome (formal).', personality:'formal' },
            { ja:'ようこそ、お越しくださいました。', en:'Welcome, thank you for coming.', personality:'formal',
              furigana:'ようこそ、お<ruby>越<rt>こ</rt></ruby>しくださいました。' },
            { ja:'いらっしゃいませ、何名様ですか?', en:'Welcome — how many in your party?', personality:'formal',
              furigana:'いらっしゃいませ、<ruby>何名様<rt>なんめいさま</rt></ruby>ですか?' },
            // chatty
            { ja:'いらっしゃい! 今日はどう?', en:'Welcome! How are you today?', personality:'chatty',
              furigana:'いらっしゃい! <ruby>今日<rt>きょう</rt></ruby>はどう?' },
            { ja:'おっ、いらっしゃい! 何にする?', en:"Oh, welcome! What'll it be?", personality:'chatty',
              furigana:'おっ、いらっしゃい! <ruby>何<rt>なに</rt></ruby>にする?' },
            // gruff
            { ja:'おう。', en:'Yeah.', personality:'gruff' },
            { ja:'…どうぞ。', en:'...go ahead.', personality:'gruff' },
            // cold
            { ja:'(軽く頷く)', en:'(light nod)', personality:'cold',
              furigana:'(<ruby>軽<rt>かる</rt></ruby>く<ruby>頷<rt>うなず</rt></ruby>く)' },
          ],
        },
        choices: [
          { ja:'こんにちは。', kana:'konnichi wa', en:'Hello.' },
          { ja:'どうも。', kana:'dōmo', en:'Hey.', personality:['warm','chatty','gruff'] },
          { ja:'お願いします。', kana:'onegai shimasu', en:'Please.', personality:['formal','warm','chatty'],
            furigana:'お<ruby>願<rt>ねが</rt></ruby>いします。' },
          { ja:'すみません。', kana:'sumimasen', en:'Excuse me.', personality:['formal','gruff','cold'] },
          { ja:'お邪魔します。', kana:'ojama shimasu', en:'Excuse me (entering).', personality:['warm','formal','chatty'],
            furigana:'お<ruby>邪魔<rt>じゃま</rt></ruby>します。' },
          { ja:'(黙って座る)', kana:'(silent)', en:'(sit quietly)', personality:['cold','gruff'],
            furigana:'(<ruby>黙<rt>だま</rt></ruby>って<ruby>座<rt>すわ</rt></ruby>る)' },
          { ja:'今日もよろしく!', kana:'kyō mo yoroshiku', en:'Looking forward to it today!', personality:['chatty','warm'],
            furigana:'<ruby>今日<rt>きょう</rt></ruby>もよろしく!' },
        ],
        next:'menu',
      },
      { id:'menu', type:'menu', svg:'menu-paper',
        prompt: {
          ja:'メニューを見る。', en:'You look at the menu.',
          furigana:'メニューを<ruby>見<rt>み</rt></ruby>る。',
        },
        items: [],  // variant supplies
        // Up to 5 picks: sushi shops + omakase + izakaya + yatai all
        // run on the lite template and these surfaces routinely have
        // 5+ small dishes (skewers, nigiri pieces, side plates) you'd
        // actually order at once. Min stays at 1.
        pick: { min:1, max:5 },
        next:'order',
      },
      { id:'order', type:'order', svg:'order-speak',
        prompt: { ja:'注文する。', en:'Place your order.', furigana:'<ruby>注文<rt>ちゅうもん</rt></ruby>する。' },
        template: {
          ja:'{items} を お願いします。', en:"I'll have {items}, please.",
          furigana:'{items} を お<ruby>願<rt>ねが</rt></ruby>いします。',
        },
        confirm: {
          ja:'はい、{items}ですね。', en:'Right, {items}.',
          furigana:'はい、{items}ですね。',
        },
        next:'receive',
      },
      { id:'receive', type:'receive', svg:'bowl-ramen',
        npc: { ja:'お待たせしました。', en:'Sorry to keep you waiting.', furigana:'お<ruby>待<rt>ま</rt></ruby>たせしました。' },
        narrative: { ja:'運ばれてくる。', en:'It arrives.', furigana:'<ruby>運<rt>はこ</rt></ruby>ばれてくる。' },
        vocab: [],  // variant supplies
        prompt: { ja:'いただきます。', en:'(Thanks for the meal — said before eating.)' },
        next:'pay',
      },
      { id:'pay', type:'pay', svg:'pay-register',
        npc: {
          ja:'お会計は{total}円になります。', en:'That comes to ¥{total}.',
          furigana:'お<ruby>会計<rt>かいけい</rt></ruby>は{total}<ruby>円<rt>えん</rt></ruby>になります。',
        },
        choices: [
          { id:'cash', ja:'現金で。', kana:'genkin de', en:'Cash, please.', furigana:'<ruby>現金<rt>げんきん</rt></ruby>で。' },
          { id:'card', ja:'カードで。', kana:'kādo de',  en:'Card, please.' },
        ],
        next:'goodbye',
      },
      { id:'goodbye', type:'goodbye', svg:'bow-thanks',
        npc: {
          ja:'ありがとうございました!', en:'Thank you very much!',
          variants: [
            { ja:'ありがとう! またね。', en:'Thanks! See you.', personality:'warm',
              furigana:'ありがとう! またね。' },
            { ja:'ありがとうございました!', en:'Thank you very much!', personality:'warm' },
            { ja:'ありがとうございました。お気をつけて。', en:'Thank you. Take care.', personality:'formal',
              furigana:'ありがとうございました。お<ruby>気<rt>き</rt></ruby>をつけて。' },
            { ja:'ありがとう! 楽しんでくれた?', en:'Thanks! Did you enjoy it?', personality:'chatty',
              furigana:'ありがとう! <ruby>楽<rt>たの</rt></ruby>しんでくれた?' },
            { ja:'おう、どうも。', en:'Yeah, thanks.', personality:'gruff' },
            { ja:'(頷く)', en:'(nods)', personality:'cold',
              furigana:'(<ruby>頷<rt>うなず</rt></ruby>く)' },
          ],
        },
        choices: [
          { ja:'ごちそうさまでした。', kana:'gochisōsama deshita', en:'Thanks for the meal.' },
          { ja:'美味しかったです!', kana:'oishikatta desu', en:'It was delicious!', personality:['warm','chatty','formal'],
            furigana:'<ruby>美味<rt>おい</rt></ruby>しかったです!' },
          { ja:'また来ます。', kana:'mata kimasu', en:"I'll come back.", personality:['warm','chatty','formal'],
            furigana:'また<ruby>来<rt>き</rt></ruby>ます。' },
          { ja:'どうも。', kana:'dōmo', en:'Thanks.', personality:['gruff','cold','warm'] },
        ],
        next:'receipt',
      },
      { id:'receipt', type:'receipt', svg:'receipt-paper' },
    ],
  },

  // ── FASTFOOD template ───────────────────────────────────────────────
  // Counter-service chains (KFC, McDonald's, etc). Brand-colored menu
  // board replaces the paper menu look; clerk dialogue is scripted /
  // formal (it's a chain). Adds an eat-in-or-takeout beat after the
  // order. Skips lookAround (no kitchen wait inside the experience).
  'fastfood': {
    skipLookAround: true,
    steps: [
      { id:'greet', type:'dialogue', svg:'greet-bow',
        npc: {
          ja:'いらっしゃいませ。こちらでご注文ですか?', en:'Welcome. Are you ordering here?',
          furigana:'いらっしゃいませ。こちらでご<ruby>注文<rt>ちゅうもん</rt></ruby>ですか?',
          variants: [
            { ja:'いらっしゃいませ。こちらでご注文ですか?', en:'Welcome. Are you ordering here?', personality:'formal',
              furigana:'いらっしゃいませ。こちらでご<ruby>注文<rt>ちゅうもん</rt></ruby>ですか?' },
            { ja:'いらっしゃいませ! ご注文をどうぞ。', en:'Welcome! Your order, please.', personality:'formal',
              furigana:'いらっしゃいませ! ご<ruby>注文<rt>ちゅうもん</rt></ruby>をどうぞ。' },
            { ja:'いらっしゃいませ。次のお客様、どうぞ。', en:'Welcome. Next customer, please.', personality:'formal',
              furigana:'いらっしゃいませ。<ruby>次<rt>つぎ</rt></ruby>のお<ruby>客様<rt>きゃくさま</rt></ruby>、どうぞ。' },
          ],
        },
        narrative: {
          ja:'カウンターに進む。', en:'You step up to the counter.',
          furigana:'カウンターに<ruby>進<rt>すす</rt></ruby>む。',
        },
        choices: [
          { ja:'はい、お願いします。', kana:'hai, onegai shimasu', en:'Yes, please.',
            furigana:'はい、お<ruby>願<rt>ねが</rt></ruby>いします。' },
          { ja:'すみません、メニュー見ていいですか?', kana:'sumimasen, menyū mite ii desu ka?', en:'Excuse me, can I look at the menu?',
            furigana:'すみません、メニュー<ruby>見<rt>み</rt></ruby>ていいですか?' },
        ],
        next:'menu',
      },

      // The colorful brand-themed menu board. Items are variant-supplied.
      // `next` points to 'sizes' but the engine routes there only when
      // the player has picked sized items (chicken bucket, fries S/M/L).
      // Otherwise the menu Next button skips straight to 'order'.
      { id:'menu', type:'menu', svg:null,
        prompt: {
          ja:'メニューを見る。何にしようか。', en:'You look at the menu board. What will it be?',
          furigana:'メニューを<ruby>見<rt>み</rt></ruby>る。<ruby>何<rt>なに</rt></ruby>にしようか。',
        },
        items: [],  // variant supplies
        pick: { min:1, max:5 },
        next:'sizes',
      },

      // Size picker — only reached when the player picked items that
      // declare a `sizes` array (KFC chicken buckets, fries). The
      // engine renders one size grid per sized item and unlocks the
      // Next button when every item has its size chosen.
      { id:'sizes', type:'sizes', svg:null,
        npc: {
          ja:'サイズはどうしますか?', en:'What size would you like?',
          furigana:'サイズはどうしますか?',
        },
        next:'order',
      },

      { id:'order', type:'order', svg:'order-speak',
        prompt: { ja:'注文する。', en:'Place your order.', furigana:'<ruby>注文<rt>ちゅうもん</rt></ruby>する。' },
        template: {
          ja:'{items}、お願いします。', en:"{items}, please.",
          furigana:'{items}、お<ruby>願<rt>ねが</rt></ruby>いします。',
        },
        confirm: {
          ja:'{items}ですね。店内でお召し上がりですか?お持ち帰りですか?',
          en:"{items}, right? Eat in, or take out?",
          furigana:'{items}ですね。<ruby>店内<rt>てんない</rt></ruby>でお<ruby>召<rt>め</rt></ruby>し<ruby>上<rt>あ</rt></ruby>がりですか?お<ruby>持<rt>も</rt></ruby>ち<ruby>帰<rt>かえ</rt></ruby>りですか?',
        },
        next:'dinein',
      },

      // Fast-food-specific branch — eat in / take out.
      { id:'dinein', type:'branch', svg:null,
        prompt: { ja:'どっちにしようか。', en:'Which one?', furigana:'どっちにしようか。' },
        choices: [
          { id:'eat-in',   ja:'店内でお願いします。',     kana:'tennai de onegai shimasu',     en:'Eat in, please.', next:'pay',
            furigana:'<ruby>店内<rt>てんない</rt></ruby>でお<ruby>願<rt>ねが</rt></ruby>いします。' },
          { id:'takeout',  ja:'持ち帰りでお願いします。', kana:'mochikaeri de onegai shimasu', en:'Take out, please.', next:'pay',
            furigana:'<ruby>持<rt>も</rt></ruby>ち<ruby>帰<rt>かえ</rt></ruby>りでお<ruby>願<rt>ねが</rt></ruby>いします。' },
        ],
      },

      { id:'pay', type:'pay', svg:'pay-register',
        npc: {
          ja:'お会計は{total}円になります。', en:'That comes to ¥{total}.',
          furigana:'お<ruby>会計<rt>かいけい</rt></ruby>は{total}<ruby>円<rt>えん</rt></ruby>になります。',
        },
        choices: [
          { id:'cash', ja:'現金で。',     kana:'genkin de',  en:'Cash, please.', furigana:'<ruby>現金<rt>げんきん</rt></ruby>で。' },
          { id:'card', ja:'カードで。',   kana:'kādo de',    en:'Card, please.' },
          { id:'ic',   ja:'スイカで。',   kana:'suika de',   en:'IC card, please.' },
        ],
        next:'wait',
      },

      // Short counter wait — buzzer / fryer / tray sounds.
      { id:'wait', type:'wait', svg:'wait-clock',
        lines: [
          { ja:'番号を呼ばれるのを待つ。', en:'You wait for your number to be called.',
            furigana:'<ruby>番号<rt>ばんごう</rt></ruby>を<ruby>呼<rt>よ</rt></ruby>ばれるのを<ruby>待<rt>ま</rt></ruby>つ。' },
          { ja:'カウンターの向こうで、フライヤーの音。', en:'Behind the counter — the sound of the fryer.',
            furigana:'カウンターの<ruby>向<rt>む</rt></ruby>こうで、フライヤーの<ruby>音<rt>おと</rt></ruby>。' },
          { ja:'BGMが流れている。', en:'Background music plays.',
            furigana:'BGMが<ruby>流<rt>なが</rt></ruby>れている。' },
        ],
        next:'receive',
      },

      { id:'receive', type:'receive', svg:null,
        npc: {
          ja:'お待たせしました。{items}でございます。',
          en:"Sorry to keep you waiting. Here's your {items}.",
          furigana:'お<ruby>待<rt>ま</rt></ruby>たせしました。{items}でございます。',
        },
        narrative: { ja:'トレーを受け取る。', en:'You take the tray.',
          furigana:'トレーを<ruby>受<rt>う</rt></ruby>け<ruby>取<rt>と</rt></ruby>る。' },
        vocab: [],  // variant supplies
        prompt: { ja:'いただきます。', en:'(Thanks for the meal.)' },
        next:'goodbye',
      },

      { id:'goodbye', type:'goodbye', svg:'bow-thanks',
        npc: {
          ja:'ありがとうございました。またお越しくださいませ。',
          en:'Thank you very much. Please come again.',
          furigana:'ありがとうございました。またお<ruby>越<rt>こ</rt></ruby>しくださいませ。',
        },
        choices: [
          { ja:'ごちそうさまでした。',     kana:'gochisōsama deshita', en:'Thanks for the meal.' },
          { ja:'どうも。',                 kana:'dōmo',                en:'Thanks.' },
        ],
        next:'receipt',
      },

      { id:'receipt', type:'receipt', svg:'receipt-paper' },
    ],
  },

  // ── KONBINI template ────────────────────────────────────────────────
  // Different shape from sit-down shops. The customer browses 5 aisle
  // sections (KONBINI_SECTIONS) via tabs, picks items into a basket,
  // then takes them to the register. No "food arrives" beat — you're
  // already holding what you bought when you walk to the counter.
  // Skipped steps vs. lite: no recommend branch (clerk doesn't pitch),
  // no receive step (no kitchen). Order step verbalizes the basket.
  'konbini': {
    skipLookAround: true,
    steps: [
      { id:'greet', type:'dialogue', svg:'greet-bow',
        npc: {
          ja:'いらっしゃいませ。', en:'Welcome.',
          variants: [
            { ja:'いらっしゃいませ。', en:'Welcome (formal).', personality:'formal' },
            { ja:'いらっしゃいませー!', en:'Welcome in!', personality:'formal' },
            { ja:'(店内アナウンス) いらっしゃいませ、こんにちは。', en:'(automated) Welcome, hello.', personality:'formal',
              furigana:'(<ruby>店内<rt>てんない</rt></ruby>アナウンス) いらっしゃいませ、こんにちは。' },
          ],
        },
        narrative: {
          ja:'自動ドアが開く。', en:'The automatic door slides open.',
          furigana:'<ruby>自動<rt>じどう</rt></ruby>ドアが<ruby>開<rt>ひら</rt></ruby>く。',
        },
        choices: [
          { ja:'こんにちは。', kana:'konnichi wa', en:'Hello.' },
          { ja:'(軽く会釈)', kana:'(slight bow)', en:'(slight bow)',
            furigana:'(<ruby>軽<rt>かる</rt></ruby>く<ruby>会釈<rt>えしゃく</rt></ruby>)' },
          { ja:'(無言で店内へ)', kana:'(silent)', en:'(walk in silently)',
            furigana:'(<ruby>無言<rt>むごん</rt></ruby>で<ruby>店内<rt>てんない</rt></ruby>へ)' },
        ],
        next:'shelf',
      },

      // The shelf — tabs across the top, items in a 2-column grid below.
      // Sections are pulled from KONBINI_SECTIONS (variant doesn't supply;
      // the experience is the same across all three chains).
      { id:'shelf', type:'shelf', svg:null,
        prompt: {
          ja:'店内を回る。', en:'You walk the aisles.',
          furigana:'<ruby>店内<rt>てんない</rt></ruby>を<ruby>回<rt>まわ</rt></ruby>る。',
        },
        sections: [],  // resolveScene fills from window.KONBINI_SECTIONS
        pick: { min:1, max:6 },
        next:'order',
      },

      // Order step — uses a 16:9 cashier image instead of the SVG.
      // The image replaces the per-step SVG block when `cashierImage`
      // is set on the step (engine reads it from `images/eating out/`).
      { id:'order', type:'order', svg:null, cashierImage:'konbini-cashier',
        prompt: { ja:'レジへ行く。', en:'You head to the register.', furigana:'レジへ<ruby>行<rt>い</rt></ruby>く。' },
        template: {
          ja:'これ、お願いします。', en:"These, please.",
          furigana:'これ、お<ruby>願<rt>ねが</rt></ruby>いします。',
        },
        confirm: {
          ja:'{items}、ですね。袋はご利用ですか?', en:'{items}, right? Need a bag?',
          furigana:'{items}、ですね。<ruby>袋<rt>ふくろ</rt></ruby>はご<ruby>利用<rt>りよう</rt></ruby>ですか?',
        },
        next:'bag',
      },

      // Konbini-specific beat — bag or no bag. No SVG: this is a quick
      // one-question branch between the cashier interaction (already has
      // its own 16:9 image) and the payment step, so an extra illustration
      // would just add visual weight without telling the player anything
      // new. The `svg:null` opts out of the per-step illustration block.
      { id:'bag', type:'branch', svg:null,
        prompt: { ja:'袋、どうしようか。', en:'Bag or no bag?', furigana:'<ruby>袋<rt>ふくろ</rt></ruby>、どうしようか。' },
        choices: [
          { id:'bag-yes', ja:'袋、お願いします。', kana:'fukuro, onegai shimasu', en:"Yes, a bag please.", next:'pay',
            furigana:'<ruby>袋<rt>ふくろ</rt></ruby>、お<ruby>願<rt>ねが</rt></ruby>いします。' },
          { id:'bag-no',  ja:'袋はいいです。', kana:'fukuro wa ii desu', en:"No bag, thanks.", next:'pay',
            furigana:'<ruby>袋<rt>ふくろ</rt></ruby>はいいです。' },
        ],
      },

      // Pay step — cash diverts to a `change` beat; card / IC go
      // straight to goodbye (no change to count). The engine honors
      // per-choice `next` ahead of step.next.
      { id:'pay', type:'pay', svg:'pay-register',
        npc: {
          ja:'お会計は{total}円になります。', en:'That comes to ¥{total}.',
          furigana:'お<ruby>会計<rt>かいけい</rt></ruby>は{total}<ruby>円<rt>えん</rt></ruby>になります。',
        },
        choices: [
          { id:'cash', ja:'現金で。',     kana:'genkin de',  en:'Cash, please.', next:'change', furigana:'<ruby>現金<rt>げんきん</rt></ruby>で。' },
          { id:'card', ja:'カードで。',   kana:'kādo de',    en:'Card, please.' },
          { id:'ic',   ja:'スイカで。',   kana:'suika de',   en:'IC card (Suica), please.' },
        ],
        next:'goodbye',
      },

      // Change beat — only reached after paying cash. Engine computes
      // the rounded-up payment and the change breakdown (bills + coins)
      // and renders a 16:9 cashier-handing-change image alongside.
      { id:'change', type:'change', svg:null, cashierImage:'konbini-change',
        npc: {
          ja:'{payment}円お預かりします。{change}円のお返しです。',
          en:'I received ¥{payment}. Here is ¥{change} in change.',
          furigana:'{payment}<ruby>円<rt>えん</rt></ruby>お<ruby>預<rt>あず</rt></ruby>かりします。{change}<ruby>円<rt>えん</rt></ruby>のお<ruby>返<rt>かえ</rt></ruby>しです。',
        },
        next:'goodbye',
      },

      { id:'goodbye', type:'goodbye', svg:'bow-thanks',
        npc: {
          ja:'ありがとうございました。', en:'Thank you very much.',
          variants: [
            { ja:'ありがとうございました。', en:'Thank you very much.', personality:'formal' },
            { ja:'またお越しくださいませ。', en:'Please come again.', personality:'formal',
              furigana:'またお<ruby>越<rt>こ</rt></ruby>しくださいませ。' },
          ],
        },
        choices: [
          { ja:'どうも。', kana:'dōmo',        en:'Thanks.' },
          { ja:'ありがとう。', kana:'arigatō', en:'Thank you.' },
        ],
        next:'receipt',
      },

      { id:'receipt', type:'receipt', svg:'receipt-paper' },
    ],
  },
};

// "friend" template — for return-visit shops where the NPC already knows
// the player. Mostly mirrors the lite arc but with custom greeting,
// goodbye, and a few personality-specific touches (English mixed in,
// casual speech only, no keigo). Used by Kaz's Place.
window.RESTAURANT_TEMPLATES.friend = {
  steps: [
    // 1. Greeting — Kaz recognizes you. No "irasshaimase" — he says hello
    // like a friend.
    { id:'greet', type:'dialogue', svg:'greet-bow',
      npc: {
        ja:'おっ、戻ってきたか! Welcome back, my friend!',
        en:"Oh, you're back! Welcome back, my friend!",
        variants: [
          { ja:'おっ、戻ってきたか! Welcome back!',           en:"Oh, you're back! Welcome back!",          personality:'friend',
            furigana:'おっ、<ruby>戻<rt>もど</rt></ruby>ってきたか! Welcome back!' },
          { ja:'Hey, look who\'s in Tokyo tonight!',          en:"Hey, look who's in Tokyo tonight!",       personality:'friend' },
          { ja:'お久しぶり! Long time no see!',                en:'Long time no see, friend!',                personality:'friend',
            furigana:'お<ruby>久<rt>ひさ</rt></ruby>しぶり! Long time no see!' },
          { ja:'また会えたな! Good to see you, my friend!',   en:'Good to see you again, my friend!',        personality:'friend',
            furigana:'また<ruby>会<rt>あ</rt></ruby>えたな! Good to see you, my friend!' },
          { ja:'おかえり! Where\'ve you been hiding?',         en:"Welcome back! Where have you been hiding?", personality:'friend' },
          { ja:'You came back! 嬉しいよ。',                    en:"You came back! I'm so glad.",              personality:'friend',
            furigana:'You came back! <ruby>嬉<rt>うれ</rt></ruby>しいよ。' },
        ],
      },
      narrative: {
        ja:'カズが顔を上げて、笑顔で迎えてくれる。',
        en:'Kaz looks up from the grill, grinning when he sees you.',
        furigana:'カズが<ruby>顔<rt>かお</rt></ruby>を<ruby>上<rt>あ</rt></ruby>げて、<ruby>笑顔<rt>えがお</rt></ruby>で<ruby>迎<rt>むか</rt></ruby>えてくれる。',
      },
      choices: [
        { ja:'カズさん、ただいま!', kana:'Kaz-san, tadaima!', en:"Kaz-san, I'm back!", personality:'friend' },
        { ja:'Hey Kaz, good to see you!', kana:'(English)', en:'Hey Kaz, good to see you!', personality:'friend' },
        { ja:'また来ちゃった!', kana:'mata kichatta!', en:'I came again!', personality:'friend',
          furigana:'また<ruby>来<rt>き</rt></ruby>ちゃった!' },
        { ja:'カズさん、元気だった?', kana:'Kaz-san, genki datta?', en:"Kaz-san, how have you been?", personality:'friend',
          furigana:'カズさん、<ruby>元気<rt>げんき</rt></ruby>だった?' },
      ],
      next:'kaz-story',
    },

    // 2. A story moment — Kaz catches you up. Only on the friend path.
    { id:'kaz-story', type:'dialogue', svg:'menu-point',
      npc: {
        ja:'前回ね、覚えてる? あの時の話の続きだけど…',
        en:"Last time you were here — remember? Anyway, picking up where that story left off...",
        furigana:'<ruby>前回<rt>ぜんかい</rt></ruby>ね、<ruby>覚<rt>おぼ</rt></ruby>えてる? あの<ruby>時<rt>とき</rt></ruby>の<ruby>話<rt>はなし</rt></ruby>の<ruby>続<rt>つづ</rt></ruby>きだけど…',
        variants: [
          { ja:'前回ね、覚えてる? あの時の話の続きだけど…', en:"Remember last time? Picking up where that story left off…",
            personality:'friend',
            furigana:'<ruby>前回<rt>ぜんかい</rt></ruby>ね、<ruby>覚<rt>おぼ</rt></ruby>えてる? あの<ruby>時<rt>とき</rt></ruby>の<ruby>話<rt>はなし</rt></ruby>の<ruby>続<rt>つづ</rt></ruby>きだけど…' },
          { ja:'最近さ、面白いお客さんが来てね…', en:"So recently, this funny customer came in...", personality:'friend',
            furigana:'<ruby>最近<rt>さいきん</rt></ruby>さ、<ruby>面白<rt>おもしろ</rt></ruby>いお<ruby>客<rt>きゃく</rt></ruby>さんが<ruby>来<rt>き</rt></ruby>てね…' },
          { ja:'You won\'t believe what happened last week…', en:"You won't believe what happened last week...", personality:'friend' },
        ],
      },
      choices: [
        { ja:'え、何があったの?', kana:'e, nani ga atta no?', en:'Oh? What happened?', personality:'friend',
          furigana:'え、<ruby>何<rt>なに</rt></ruby>があったの?' },
        { ja:'Tell me, tell me!', kana:'(English)', en:'Tell me, tell me!', personality:'friend' },
        { ja:'(身を乗り出す)', kana:'(lean in)', en:'(lean in to listen)', personality:'friend',
          furigana:'(<ruby>身<rt>み</rt></ruby>を<ruby>乗<rt>の</rt></ruby>り<ruby>出<rt>だ</rt></ruby>す)' },
      ],
      next:'menu',
    },

    { id:'menu', type:'menu', svg:'menu-paper',
      prompt: {
        ja:'いつものでもいい? Or pick something?',
        en:'Your usual? Or pick something?',
        furigana:'いつものでもいい? Or pick something?',
      },
      items: [],  // variant supplies
      // Kaz's yakitori — 5 skewers is the right ballpark for one sitting.
      pick: { min:1, max:5 },
      next:'order',
    },
    { id:'order', type:'order', svg:'order-speak',
      prompt: { ja:'注文する。', en:'You order.', furigana:'<ruby>注文<rt>ちゅうもん</rt></ruby>する。' },
      template: {
        ja:'カズさん、{items} 頼むよ。',
        en:"Kaz, give me {items}.",
        furigana:'カズさん、{items} <ruby>頼<rt>たの</rt></ruby>むよ。',
      },
      confirm: {
        ja:'よっしゃ、{items}ね。任せて!',
        en:"Got it — {items}. Leave it to me!",
        furigana:'よっしゃ、{items}ね。<ruby>任<rt>まか</rt></ruby>せて!',
      },
      next:'receive',
    },
    { id:'receive', type:'receive', svg:'dish-yakitori',
      npc: {
        ja:'はい、お待たせ! 熱いから気をつけて。',
        en:"Here you go! Careful, it's hot.",
        furigana:'はい、お<ruby>待<rt>ま</rt></ruby>たせ! <ruby>熱<rt>あつ</rt></ruby>いから<ruby>気<rt>き</rt></ruby>をつけて。',
        variants: [
          { ja:'はい、お待たせ! 熱いから気をつけて。', en:"Here you go! Careful, it's hot.", personality:'friend',
            furigana:'はい、お<ruby>待<rt>ま</rt></ruby>たせ! <ruby>熱<rt>あつ</rt></ruby>いから<ruby>気<rt>き</rt></ruby>をつけて。' },
          { ja:'どうぞ。Today\'s extra crispy.', en:"Here you go. Today's extra crispy.", personality:'friend' },
        ],
      },
      narrative: { ja:'カズが串を渡してくれる。', en:'Kaz hands over the skewers.',
        furigana:'カズが<ruby>串<rt>くし</rt></ruby>を<ruby>渡<rt>わた</rt></ruby>してくれる。' },
      vocab: [
        { kanji:'焼き鳥', kana:'やきとり', en:'grilled chicken skewer', furigana:'<ruby>焼<rt>や</rt></ruby>き<ruby>鳥<rt>とり</rt></ruby>' },
        { kanji:'タレ',   kana:'たれ',     en:'savory sauce' },
        { kanji:'塩',     kana:'しお',     en:'salt seasoning', furigana:'<ruby>塩<rt>しお</rt></ruby>' },
        { kanji:'炭火',   kana:'すみび',   en:'charcoal grill', furigana:'<ruby>炭火<rt>すみび</rt></ruby>' },
        { kanji:'串',     kana:'くし',     en:'skewer', furigana:'<ruby>串<rt>くし</rt></ruby>' },
      ],
      prompt: { ja:'いただきます!', en:"Let's eat!" },
      next:'pay',
    },
    { id:'pay', type:'pay', svg:'pay-register',
      npc: {
        ja:'{total}円ね。Cash works.',
        en:"That's ¥{total}. Cash is fine.",
        furigana:'{total}<ruby>円<rt>えん</rt></ruby>ね。Cash works.',
      },
      choices: [
        { id:'cash', ja:'現金で!', kana:'genkin de!', en:'Cash!', personality:'friend',
          furigana:'<ruby>現金<rt>げんきん</rt></ruby>で!' },
        { id:'card', ja:'カードでもいい?', kana:'kādo demo ii?', en:"Can I use a card?", personality:'friend' },
      ],
      next:'goodbye',
    },
    { id:'goodbye', type:'goodbye', svg:'bow-thanks',
      npc: {
        ja:'また来てね! 次は写真撮ろう。',
        en:"Come back, alright? Next time let's take a photo.",
        furigana:'また<ruby>来<rt>き</rt></ruby>てね! <ruby>次<rt>つぎ</rt></ruby>は<ruby>写真<rt>しゃしん</rt></ruby><ruby>撮<rt>と</rt></ruby>ろう。',
        variants: [
          { ja:'また来てね! 次は写真撮ろう。', en:"Come back, alright? Next time let's take a photo.", personality:'friend',
            furigana:'また<ruby>来<rt>き</rt></ruby>てね! <ruby>次<rt>つぎ</rt></ruby>は<ruby>写真<rt>しゃしん</rt></ruby><ruby>撮<rt>と</rt></ruby>ろう。' },
          { ja:'Safe travels, my friend! 気をつけてね。', en:'Safe travels, my friend!', personality:'friend',
            furigana:'Safe travels, my friend! <ruby>気<rt>き</rt></ruby>をつけてね。' },
          { ja:'See you next time! 待ってるよ。', en:"See you next time! I'll be waiting.", personality:'friend',
            furigana:'See you next time! <ruby>待<rt>ま</rt></ruby>ってるよ。' },
        ],
      },
      choices: [
        { ja:'ごちそうさま、カズさん!', kana:'gochisōsama, Kaz-san!', en:'Thanks for the meal, Kaz!', personality:'friend' },
        { ja:'See you next time, Kaz!', kana:'(English)', en:'See you next time, Kaz!', personality:'friend' },
        { ja:'また来るよ!', kana:'mata kuru yo!', en:"I'll be back!", personality:'friend',
          furigana:'また<ruby>来<rt>く</rt></ruby>るよ!' },
      ],
      next:'receipt',
    },
    { id:'receipt', type:'receipt', svg:'receipt-paper' },
  ],
};

// EATING_OUT_RESTAURANTS — flat list of 18+ shops. The Experience book
// rolls one at random. Each entry references a template (ramen = full
// 12-step arc, lite = 7-step). Variant supplies: name, npc, setting,
// menu items, optional receive vocab, and optional receive svg override.
window.EATING_OUT_RESTAURANTS = [
  // ── RAMEN (3, full template) ─────────────────────────────────────
  {
    id:'ramen-yabu', category:'ramen', template:'ramen', personality:'warm',
    name: { ja:'藪ラーメン', en:'Yabu Ramen' },
    npc: { name:'Satō-san', nameJa:'佐藤さん', glyph:'佐' },
    setting: { ja:'下町の小さなラーメン屋', en:'A small ramen shop in an old neighborhood' },
    monologue: {
      ja:'下町のラーメン屋。気軽に入れる雰囲気。値段も手頃。リラックスして注文しよう。',
      en:"An old-neighborhood ramen shop. Easy to walk into, reasonable prices. Relax and order.",
      furigana:'<ruby>下町<rt>したまち</rt></ruby>のラーメン<ruby>屋<rt>や</rt></ruby>。<ruby>気軽<rt>きがる</rt></ruby>に<ruby>入<rt>はい</rt></ruby>れる<ruby>雰囲気<rt>ふんいき</rt></ruby>。<ruby>値段<rt>ねだん</rt></ruby>も<ruby>手頃<rt>てごろ</rt></ruby>。リラックスして<ruby>注文<rt>ちゅうもん</rt></ruby>しよう。',
    },
  },
  {
    id:'ramen-tora', category:'ramen', template:'ramen', personality:'gruff',
    name: { ja:'虎拉麺', en:'Tora Ramen' },
    npc: { name:'Yamada-san', nameJa:'山田さん', glyph:'山' },
    setting: { ja:'屋台風のラーメン店', en:'A yatai-style ramen counter — no chit-chat' },
    monologue: {
      ja:'屋台風のラーメン店。常連が多そう。余計な会話はせず、サッと注文してサッと食べよう。',
      en:"A yatai-style ramen counter. Looks like a regulars' place. Skip the small talk — order quick, eat quick.",
      furigana:'<ruby>屋台<rt>やたい</rt></ruby><ruby>風<rt>ふう</rt></ruby>のラーメン<ruby>店<rt>てん</rt></ruby>。<ruby>常連<rt>じょうれん</rt></ruby>が<ruby>多<rt>おお</rt></ruby>そう。<ruby>余計<rt>よけい</rt></ruby>な<ruby>会話<rt>かいわ</rt></ruby>はせず、サッと<ruby>注文<rt>ちゅうもん</rt></ruby>してサッと<ruby>食<rt>た</rt></ruby>べよう。',
    },
  },
  {
    id:'ramen-michi', category:'ramen', template:'ramen', personality:'chatty',
    name: { ja:'みち食堂', en:'Michi Shokudō' },
    npc: { name:'Tanaka-san', nameJa:'田中さん', glyph:'田' },
    setting: { ja:'駅前のラーメン食堂', en:'A ramen joint near the station — owner loves to talk' },
    monologue: {
      ja:'駅前のラーメン食堂。店主が話し好きみたい。少し雑談しても大丈夫そう。',
      en:"A ramen joint by the station. The owner seems chatty. A little small talk should be fine.",
      furigana:'<ruby>駅前<rt>えきまえ</rt></ruby>のラーメン<ruby>食堂<rt>しょくどう</rt></ruby>。<ruby>店主<rt>てんしゅ</rt></ruby>が<ruby>話<rt>はなし</rt></ruby><ruby>好<rt>ず</rt></ruby>きみたい。<ruby>少<rt>すこ</rt></ruby>し<ruby>雑談<rt>ざつだん</rt></ruby>しても<ruby>大丈夫<rt>だいじょうぶ</rt></ruby>そう。',
    },
  },

  // ── SUSHI (3, lite) ──────────────────────────────────────────────
  {
    id:'sushi-kiyo', category:'sushi', template:'lite', personality:'formal', hasInside:true,
    name: { ja:'清寿司', en:'Kiyo Sushi' },
    npc: { name:'Kondō-san', nameJa:'近藤さん', glyph:'板' },
    setting: { ja:'カウンター席の寿司屋', en:'A counter-seat sushi shop — quietly traditional' },
    monologue: {
      ja:'カウンター席の寿司屋。少し高めの値段帯。丁寧な日本語で、姿勢を正して。',
      en:"A counter-seat sushi shop. A bit on the pricier side. Speak politely, sit up straight.",
      furigana:'カウンター<ruby>席<rt>せき</rt></ruby>の<ruby>寿司屋<rt>すしや</rt></ruby>。<ruby>少<rt>すこ</rt></ruby>し<ruby>高<rt>たか</rt></ruby>めの<ruby>値段帯<rt>ねだんたい</rt></ruby>。<ruby>丁寧<rt>ていねい</rt></ruby>な<ruby>日本語<rt>にほんご</rt></ruby>で、<ruby>姿勢<rt>しせい</rt></ruby>を<ruby>正<rt>ただ</rt></ruby>して。',
    },
    menu: [
      { kanji:'マグロ',    kana:'まぐろ',     en:'tuna nigiri',         price:300, category:'sushi' },
      { kanji:'サーモン',  kana:'さーもん',   en:'salmon nigiri',       price:280, category:'sushi' },
      { kanji:'エビ',      kana:'えび',       en:'shrimp nigiri',       price:250, category:'sushi' },
      { kanji:'イカ',      kana:'いか',       en:'squid nigiri',        price:220, category:'sushi' },
      { kanji:'玉子',      kana:'たまご',     en:'tamago nigiri',       price:180, category:'sushi', furigana:'<ruby>玉子<rt>たまご</rt></ruby>' },
      { kanji:'うに',      kana:'うに',       en:'sea urchin',          price:450, category:'sushi' },
      { kanji:'巻き寿司',  kana:'まきずし',   en:'maki rolls',          price:400, category:'sushi', furigana:'<ruby>巻<rt>ま</rt></ruby>き<ruby>寿司<rt>ずし</rt></ruby>' },
      { kanji:'お味噌汁',  kana:'おみそしる', en:'miso soup',           price:200, category:'side',  furigana:'お<ruby>味噌汁<rt>みそしる</rt></ruby>' },
      { kanji:'日本酒',    kana:'にほんしゅ', en:'sake',                price:700, category:'drink', furigana:'<ruby>日本酒<rt>にほんしゅ</rt></ruby>' },
      { kanji:'お茶',      kana:'おちゃ',     en:'green tea',           price:0,   category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: 'dish-sushi',
    receiveVocab: [
      { kanji:'寿司', kana:'すし', en:'sushi', furigana:'<ruby>寿司<rt>すし</rt></ruby>' },
      { kanji:'醤油', kana:'しょうゆ', en:'soy sauce', furigana:'<ruby>醤油<rt>しょうゆ</rt></ruby>' },
      { kanji:'山葵', kana:'わさび', en:'wasabi', furigana:'<ruby>山葵<rt>わさび</rt></ruby>' },
      { kanji:'箸',   kana:'はし', en:'chopsticks', furigana:'<ruby>箸<rt>はし</rt></ruby>' },
    ],
  },
  {
    id:'sushi-tama', category:'sushi', template:'lite', personality:'chatty', hasInside:true,
    name: { ja:'玉鮨', en:'Tama Sushi' },
    npc: { name:'Saitō-san', nameJa:'斉藤さん', glyph:'寿' },
    setting: { ja:'回転寿司のお店', en:'A conveyor-belt sushi place' },
    monologue: {
      ja:'回転寿司。気楽な雰囲気。好きなものを好きなだけ。店員さんと少し話してもOK。',
      en:"Conveyor-belt sushi. Relaxed vibe. Take what you like. A little chat with staff is fine.",
      furigana:'<ruby>回転寿司<rt>かいてんずし</rt></ruby>。<ruby>気楽<rt>きらく</rt></ruby>な<ruby>雰囲気<rt>ふんいき</rt></ruby>。<ruby>好<rt>す</rt></ruby>きなものを<ruby>好<rt>す</rt></ruby>きなだけ。<ruby>店員<rt>てんいん</rt></ruby>さんと<ruby>少<rt>すこ</rt></ruby>し<ruby>話<rt>はな</rt></ruby>してもOK。',
    },
    menu: [
      { kanji:'マグロ',    kana:'まぐろ',     en:'tuna',         price:200, category:'sushi' },
      { kanji:'サーモン',  kana:'さーもん',   en:'salmon',       price:180, category:'sushi' },
      { kanji:'エビ',      kana:'えび',       en:'shrimp',       price:160, category:'sushi' },
      { kanji:'ハマチ',    kana:'はまち',     en:'yellowtail',   price:220, category:'sushi' },
      { kanji:'いくら',    kana:'いくら',     en:'salmon roe',   price:280, category:'sushi' },
      { kanji:'巻き寿司',  kana:'まきずし',   en:'maki rolls',   price:280, category:'sushi', furigana:'<ruby>巻<rt>ま</rt></ruby>き<ruby>寿司<rt>ずし</rt></ruby>' },
      { kanji:'生ビール',  kana:'なまびーる', en:'draft beer',   price:480, category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
      { kanji:'お茶',      kana:'おちゃ',     en:'green tea',    price:0,   category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: 'dish-sushi',
  },
  {
    id:'sushi-hana', category:'sushi', template:'lite', personality:'formal', hasInside:true,
    name: { ja:'花鮨', en:'Hana Sushi' },
    npc: { name:'Honda-san', nameJa:'本田さん', glyph:'本' },
    setting: { ja:'カウンターだけの寿司屋', en:'A counter-only sushi shop' },
    monologue: {
      ja:'カウンターだけの本格的な寿司屋。職人さんに敬意を払って、静かに食べよう。',
      en:"A counter-only traditional sushi shop. Respect the itamae, eat quietly.",
      furigana:'カウンターだけの<ruby>本格的<rt>ほんかくてき</rt></ruby>な<ruby>寿司屋<rt>すしや</rt></ruby>。<ruby>職人<rt>しょくにん</rt></ruby>さんに<ruby>敬意<rt>けいい</rt></ruby>を<ruby>払<rt>はら</rt></ruby>って、<ruby>静<rt>しず</rt></ruby>かに<ruby>食<rt>た</rt></ruby>べよう。',
    },
    menu: [
      { kanji:'おまかせ五貫',  kana:'おまかせごかん', en:"chef's choice (5-piece)", price:1800, category:'sushi', furigana:'おまかせ<ruby>五貫<rt>ごかん</rt></ruby>' },
      { kanji:'マグロ',        kana:'まぐろ',         en:'tuna nigiri',             price:320, category:'sushi' },
      { kanji:'サーモン',      kana:'さーもん',       en:'salmon nigiri',           price:300, category:'sushi' },
      { kanji:'エビ',          kana:'えび',           en:'shrimp nigiri',           price:280, category:'sushi' },
      { kanji:'巻き寿司',      kana:'まきずし',       en:'maki rolls',              price:420, category:'sushi', furigana:'<ruby>巻<rt>ま</rt></ruby>き<ruby>寿司<rt>ずし</rt></ruby>' },
      { kanji:'日本酒',        kana:'にほんしゅ',     en:'sake',                    price:900, category:'drink', furigana:'<ruby>日本酒<rt>にほんしゅ</rt></ruby>' },
      { kanji:'お茶',          kana:'おちゃ',         en:'green tea',               price:0,   category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: 'dish-sushi',
  },

  // ── OMAKASE (3, lite) ────────────────────────────────────────────
  {
    id:'omakase-hibiki', category:'omakase', template:'lite', personality:'formal',
    name: { ja:'響', en:'Hibiki' },
    npc: { name:'Itō-san', nameJa:'伊藤さん', glyph:'匠' },
    setting: { ja:'静かな小さな店', en:'A quiet little restaurant' },
    monologue: {
      ja:'静かな小さな店。おまかせコースのみ。料理が出される順番を待ち、丁寧に味わおう。',
      en:"A quiet little place. Omakase course only. Wait for each dish to be served, savor it carefully.",
      furigana:'<ruby>静<rt>しず</rt></ruby>かな<ruby>小<rt>ちい</rt></ruby>さな<ruby>店<rt>みせ</rt></ruby>。おまかせコースのみ。<ruby>料理<rt>りょうり</rt></ruby>が<ruby>出<rt>だ</rt></ruby>される<ruby>順番<rt>じゅんばん</rt></ruby>を<ruby>待<rt>ま</rt></ruby>ち、<ruby>丁寧<rt>ていねい</rt></ruby>に<ruby>味<rt>あじ</rt></ruby>わおう。',
    },
    menu: [
      { kanji:'おまかせ五貫',       kana:'おまかせごかん',         en:'classic five nigiri',                price:5000,  category:'omakase', furigana:'おまかせ<ruby>五貫<rt>ごかん</rt></ruby>' },
      { kanji:'おまかせプレミアム', kana:'おまかせぷれみあむ',     en:'premium five — uni, ikura, toro',    price:9000,  category:'omakase' },
      { kanji:'おまかせ刺身',       kana:'おまかせさしみ',         en:'sashimi assortment',                 price:4500,  category:'omakase', furigana:'おまかせ<ruby>刺身<rt>さしみ</rt></ruby>' },
      { kanji:'日本酒',             kana:'にほんしゅ',             en:'sake',                               price:800,   category:'drink', furigana:'<ruby>日本酒<rt>にほんしゅ</rt></ruby>' },
      { kanji:'お茶',               kana:'おちゃ',                 en:'green tea',                          price:0,     category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: 'omakase-classic-five',
  },
  {
    id:'omakase-sen', category:'omakase', template:'lite', personality:'cold',
    name: { ja:'千', en:'Sen' },
    npc: { name:'Hayashi-san', nameJa:'林さん', glyph:'匠' },
    setting: { ja:'カウンター8席の店', en:'An 8-seat counter restaurant' },
    monologue: {
      ja:'高級店だ。カウンター8席のみ。失礼のないように、静かに、礼儀正しく。',
      en:"This is a high-end place. Only 8 seats at the counter. Don't be rude — quiet, polite.",
      furigana:'<ruby>高級店<rt>こうきゅうてん</rt></ruby>だ。カウンター8<ruby>席<rt>せき</rt></ruby>のみ。<ruby>失礼<rt>しつれい</rt></ruby>のないように、<ruby>静<rt>しず</rt></ruby>かに、<ruby>礼儀正<rt>れいぎただ</rt></ruby>しく。',
    },
    menu: [
      { kanji:'おまかせプレミアム', kana:'おまかせぷれみあむ', en:'premium tasting',           price:12000, category:'omakase' },
      { kanji:'おまかせ天ぷら',     kana:'おまかせてんぷら',   en:'tempura course at the bar', price:6000,  category:'omakase', furigana:'おまかせ<ruby>天<rt>てん</rt></ruby>ぷら' },
      { kanji:'おまかせ刺身',       kana:'おまかせさしみ',     en:'sashimi assortment',        price:5000,  category:'omakase', furigana:'おまかせ<ruby>刺身<rt>さしみ</rt></ruby>' },
      { kanji:'日本酒',             kana:'にほんしゅ',         en:'sake',                      price:1200,  category:'drink', furigana:'<ruby>日本酒<rt>にほんしゅ</rt></ruby>' },
      { kanji:'白ワイン',           kana:'しろわいん',         en:'white wine',                price:1200,  category:'drink', furigana:'<ruby>白<rt>しろ</rt></ruby>ワイン' },
      { kanji:'お茶',               kana:'おちゃ',             en:'green tea',                 price:0,     category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: 'omakase-premium-five',
  },
  {
    id:'omakase-mori', category:'omakase', template:'lite', personality:'formal',
    name: { ja:'杜', en:'Mori' },
    npc: { name:'Inoue-san', nameJa:'井上さん', glyph:'匠' },
    setting: { ja:'隠れ家の懐石料理店', en:'A hidden kaiseki restaurant' },
    monologue: {
      ja:'隠れ家の懐石料理店。一品ずつ、味わって食べる。会話は控えめに。',
      en:"A hidden kaiseki spot. Eat each dish slowly. Keep conversation light.",
      furigana:'<ruby>隠<rt>かく</rt></ruby>れ<ruby>家<rt>が</rt></ruby>の<ruby>懐石料理店<rt>かいせきりょうりてん</rt></ruby>。<ruby>一品<rt>いっぴん</rt></ruby>ずつ、<ruby>味<rt>あじ</rt></ruby>わって<ruby>食<rt>た</rt></ruby>べる。<ruby>会話<rt>かいわ</rt></ruby>は<ruby>控<rt>ひか</rt></ruby>えめに。',
    },
    menu: [
      { kanji:'おまかせ懐石', kana:'おまかせかいせき', en:'kaiseki — small-plate tasting',  price:12000, category:'omakase', furigana:'おまかせ<ruby>懐石<rt>かいせき</rt></ruby>' },
      { kanji:'おまかせ刺身', kana:'おまかせさしみ',   en:'sashimi assortment',             price:5500,  category:'omakase', furigana:'おまかせ<ruby>刺身<rt>さしみ</rt></ruby>' },
      { kanji:'おまかせ天ぷら', kana:'おまかせてんぷら', en:'tempura course',               price:6500,  category:'omakase', furigana:'おまかせ<ruby>天<rt>てん</rt></ruby>ぷら' },
      { kanji:'日本酒',       kana:'にほんしゅ',       en:'sake',                           price:1000,  category:'drink', furigana:'<ruby>日本酒<rt>にほんしゅ</rt></ruby>' },
      { kanji:'お茶',         kana:'おちゃ',           en:'green tea',                      price:0,     category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: 'omakase-kaiseki',
  },

  // ── IZAKAYA (3, lite) ────────────────────────────────────────────
  {
    id:'izakaya-akari', category:'izakaya', template:'lite', personality:'warm',
    name: { ja:'あかり', en:'Akari' },
    npc: { name:'Suzuki-san', nameJa:'鈴木さん', glyph:'居' },
    setting: { ja:'居酒屋のテーブル席', en:'A table seat at the izakaya' },
    monologue: {
      ja:'テーブル席の居酒屋。気楽に飲んで食べる場所。店員さんも明るい。普段着で大丈夫。',
      en:"Izakaya, table seating. A place to drink and eat casually. Staff is friendly. Everyday clothes are fine.",
      furigana:'テーブル<ruby>席<rt>せき</rt></ruby>の<ruby>居酒屋<rt>いざかや</rt></ruby>。<ruby>気楽<rt>きらく</rt></ruby>に<ruby>飲<rt>の</rt></ruby>んで<ruby>食<rt>た</rt></ruby>べる<ruby>場所<rt>ばしょ</rt></ruby>。<ruby>店員<rt>てんいん</rt></ruby>さんも<ruby>明<rt>あか</rt></ruby>るい。<ruby>普段着<rt>ふだんぎ</rt></ruby>で<ruby>大丈夫<rt>だいじょうぶ</rt></ruby>。',
    },
    menu: [
      { kanji:'生ビール',   kana:'なまびーる',   en:'draft beer',         price:500, category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
      { kanji:'ハイボール', kana:'はいぼーる',   en:'highball',           price:480, category:'drink' },
      { kanji:'焼き鳥',     kana:'やきとり',     en:'grilled chicken skewers', price:600, category:'food', furigana:'<ruby>焼<rt>や</rt></ruby>き<ruby>鳥<rt>とり</rt></ruby>' },
      { kanji:'枝豆',       kana:'えだまめ',     en:'edamame',             price:400, category:'food', furigana:'<ruby>枝豆<rt>えだまめ</rt></ruby>' },
      { kanji:'唐揚げ',     kana:'からあげ',     en:'fried chicken',       price:700, category:'food', furigana:'<ruby>唐揚<rt>からあ</rt></ruby>げ' },
      { kanji:'刺身盛り合わせ', kana:'さしみもりあわせ', en:'sashimi platter', price:1200, category:'food', furigana:'<ruby>刺身盛<rt>さしみも</rt></ruby>り<ruby>合<rt>あ</rt></ruby>わせ' },
      { kanji:'焼き餃子',   kana:'やきぎょうざ', en:'pan-fried gyoza',     price:520, category:'food', furigana:'<ruby>焼<rt>や</rt></ruby>き<ruby>餃子<rt>ぎょうざ</rt></ruby>' },
      { kanji:'とんかつ',   kana:'とんかつ',     en:'pork cutlet',         price:1100, category:'food' },
    ],
    receiveSvg: 'dish-yakitori',
  },
  {
    id:'izakaya-tsuki', category:'izakaya', template:'lite', personality:'gruff',
    name: { ja:'つき', en:'Tsuki' },
    npc: { name:'Mori-san', nameJa:'森さん', glyph:'居' },
    setting: { ja:'路地裏の居酒屋', en:'A back-alley izakaya' },
    monologue: {
      ja:'路地裏の居酒屋。常連が多い。余計なことは話さず、注文を簡潔に。',
      en:"Back-alley izakaya. Mostly regulars. Skip the chit-chat, order short.",
      furigana:'<ruby>路地裏<rt>ろじうら</rt></ruby>の<ruby>居酒屋<rt>いざかや</rt></ruby>。<ruby>常連<rt>じょうれん</rt></ruby>が<ruby>多<rt>おお</rt></ruby>い。<ruby>余計<rt>よけい</rt></ruby>なことは<ruby>話<rt>はな</rt></ruby>さず、<ruby>注文<rt>ちゅうもん</rt></ruby>を<ruby>簡潔<rt>かんけつ</rt></ruby>に。',
    },
    menu: [
      { kanji:'ハイボール', kana:'はいぼーる', en:'highball',          price:450, category:'drink' },
      { kanji:'日本酒',     kana:'にほんしゅ', en:'sake',              price:600, category:'drink', furigana:'<ruby>日本酒<rt>にほんしゅ</rt></ruby>' },
      { kanji:'生ビール',   kana:'なまびーる', en:'draft beer',        price:500, category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
      { kanji:'串カツ',     kana:'くしかつ',   en:'fried skewers',     price:500, category:'food',  furigana:'<ruby>串<rt>くし</rt></ruby>カツ' },
      { kanji:'もつ煮',     kana:'もつに',     en:'simmered offal',    price:600, category:'food',  furigana:'もつ<ruby>煮<rt>に</rt></ruby>' },
      { kanji:'揚げ餃子',   kana:'あげぎょうざ', en:'deep-fried gyoza', price:520, category:'food',  furigana:'<ruby>揚<rt>あ</rt></ruby>げ<ruby>餃子<rt>ぎょうざ</rt></ruby>' },
      { kanji:'天ぷら',     kana:'てんぷら',   en:'tempura',           price:900, category:'food', furigana:'<ruby>天<rt>てん</rt></ruby>ぷら' },
    ],
    receiveSvg: 'dish-yakitori',
  },
  {
    id:'izakaya-take', category:'izakaya', template:'lite', personality:'chatty',
    name: { ja:'たけ', en:'Take' },
    npc: { name:'Wada-san', nameJa:'和田さん', glyph:'居' },
    setting: { ja:'大衆居酒屋', en:'A bustling popular izakaya' },
    monologue: {
      ja:'大衆居酒屋。賑やかで楽しい。店員さんと少し話してもいい雰囲気。',
      en:"A popular bustling izakaya. Lively and fun. A bit of small talk with staff is fine.",
      furigana:'<ruby>大衆<rt>たいしゅう</rt></ruby><ruby>居酒屋<rt>いざかや</rt></ruby>。<ruby>賑<rt>にぎ</rt></ruby>やかで<ruby>楽<rt>たの</rt></ruby>しい。<ruby>店員<rt>てんいん</rt></ruby>さんと<ruby>少<rt>すこ</rt></ruby>し<ruby>話<rt>はな</rt></ruby>してもいい<ruby>雰囲気<rt>ふんいき</rt></ruby>。',
    },
    menu: [
      { kanji:'生ビール',   kana:'なまびーる', en:'draft beer',           price:480, category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
      { kanji:'ハイボール', kana:'はいぼーる', en:'highball',             price:450, category:'drink' },
      { kanji:'冷奴',       kana:'ひややっこ', en:'cold tofu',             price:380, category:'food', furigana:'<ruby>冷奴<rt>ひややっこ</rt></ruby>' },
      { kanji:'焼き餃子',   kana:'やきぎょうざ', en:'pan-fried gyoza',    price:500, category:'food', furigana:'<ruby>焼<rt>や</rt></ruby>き<ruby>餃子<rt>ぎょうざ</rt></ruby>' },
      { kanji:'水餃子',     kana:'すいぎょうざ', en:'boiled gyoza',       price:520, category:'food', furigana:'<ruby>水<rt>すい</rt></ruby><ruby>餃子<rt>ぎょうざ</rt></ruby>' },
      { kanji:'焼売',       kana:'しゅうまい', en:'shumai (steamed)',     price:480, category:'food', furigana:'<ruby>焼売<rt>しゅうまい</rt></ruby>' },
      { kanji:'お新香盛り', kana:'おしんこもり', en:'pickle assortment',  price:450, category:'food' },
    ],
    receiveSvg: 'dish-yakitori',
  },

  // ── YATAI (street food, 3, lite) ─────────────────────────────────
  {
    id:'yatai-tora', category:'yatai', template:'lite', personality:'warm',
    name: { ja:'とら屋台', en:'Tora Yatai' },
    npc: { name:'Nakamura-san', nameJa:'中村さん', glyph:'屋' },
    setting: { ja:'橋のたもとの屋台', en:'A street stall by the bridge' },
    monologue: {
      ja:'橋のたもとの屋台。気さくな店主。立ち食いだから、サッと注文してサッと食べよう。',
      en:"A street stall by the bridge. The owner's friendly. It's stand-up eating — order quick, eat quick.",
      furigana:'<ruby>橋<rt>はし</rt></ruby>のたもとの<ruby>屋台<rt>やたい</rt></ruby>。<ruby>気<rt>き</rt></ruby>さくな<ruby>店主<rt>てんしゅ</rt></ruby>。<ruby>立<rt>た</rt></ruby>ち<ruby>食<rt>ぐ</rt></ruby>いだから、サッと<ruby>注文<rt>ちゅうもん</rt></ruby>してサッと<ruby>食<rt>た</rt></ruby>べよう。',
    },
    menu: [
      { kanji:'たこ焼き', kana:'たこやき', en:'octopus balls',      price:600, category:'food', furigana:'たこ<ruby>焼<rt>や</rt></ruby>き' },
      { kanji:'お好み焼き', kana:'おこのみやき', en:'savory pancake', price:700, category:'food', furigana:'お<ruby>好<rt>この</rt></ruby>み<ruby>焼<rt>や</rt></ruby>き' },
      { kanji:'焼きそば', kana:'やきそば', en:'fried noodles',       price:500, category:'food', furigana:'<ruby>焼<rt>や</rt></ruby>きそば' },
      { kanji:'生ビール', kana:'なまびーる', en:'draft beer',        price:500, category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
      { kanji:'お茶',     kana:'おちゃ',   en:'green tea',           price:0,   category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: 'dish-yakitori',
  },
  {
    id:'yatai-yumi', category:'yatai', template:'lite', personality:'chatty',
    name: { ja:'ゆみの店', en:'Yumi-no-mise' },
    npc: { name:'Shibata-san', nameJa:'柴田さん', glyph:'屋' },
    setting: { ja:'お祭りの屋台', en:'A festival stall' },
    monologue: {
      ja:'お祭りの屋台。店主が陽気で話しかけてくる。お祭り気分で楽しもう!',
      en:"A festival stall. The owner is chatty and cheerful. Lean into the festival mood!",
      furigana:'お<ruby>祭<rt>まつ</rt></ruby>りの<ruby>屋台<rt>やたい</rt></ruby>。<ruby>店主<rt>てんしゅ</rt></ruby>が<ruby>陽気<rt>ようき</rt></ruby>で<ruby>話<rt>はな</rt></ruby>しかけてくる。お<ruby>祭<rt>まつ</rt></ruby>り<ruby>気分<rt>きぶん</rt></ruby>で<ruby>楽<rt>たの</rt></ruby>しもう!',
    },
    menu: [
      { kanji:'焼きとうもろこし', kana:'やきとうもろこし', en:'grilled corn', price:400, category:'food', furigana:'<ruby>焼<rt>や</rt></ruby>きとうもろこし' },
      { kanji:'りんご飴',       kana:'りんごあめ',       en:'candy apple',  price:500, category:'food', furigana:'りんご<ruby>飴<rt>あめ</rt></ruby>' },
      { kanji:'綿菓子',         kana:'わたがし',         en:'cotton candy', price:400, category:'food', furigana:'<ruby>綿菓子<rt>わたがし</rt></ruby>' },
    ],
    receiveSvg: 'dish-yakitori',
  },
  {
    id:'yatai-hyaku', category:'yatai', template:'lite', personality:'gruff',
    name: { ja:'百屋台', en:'Hyaku Yatai' },
    npc: { name:'Ogawa-san', nameJa:'小川さん', glyph:'屋' },
    setting: { ja:'夜店の通り', en:'A row of night-market stalls' },
    monologue: {
      ja:'夜店の通り。屋台の店主は無口な感じ。注文は簡潔に、サッと済ませよう。',
      en:"A row of night-market stalls. The owner here is the quiet type. Keep orders short.",
      furigana:'<ruby>夜店<rt>よみせ</rt></ruby>の<ruby>通<rt>とお</rt></ruby>り。<ruby>屋台<rt>やたい</rt></ruby>の<ruby>店主<rt>てんしゅ</rt></ruby>は<ruby>無口<rt>むくち</rt></ruby>な<ruby>感<rt>かん</rt></ruby>じ。<ruby>注文<rt>ちゅうもん</rt></ruby>は<ruby>簡潔<rt>かんけつ</rt></ruby>に、サッと<ruby>済<rt>す</rt></ruby>ませよう。',
    },
    menu: [
      { kanji:'焼きそば', kana:'やきそば', en:'fried noodles', price:500, category:'food', furigana:'<ruby>焼<rt>や</rt></ruby>きそば' },
      { kanji:'焼き鳥',   kana:'やきとり', en:'yakitori',      price:300, category:'food', furigana:'<ruby>焼<rt>や</rt></ruby>き<ruby>鳥<rt>とり</rt></ruby>' },
      { kanji:'生ビール', kana:'なまびーる', en:'draft beer', price:600, category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
    ],
    receiveSvg: 'dish-yakitori',
  },

  // ── FASTFOOD (2) — international chains via 'fastfood' template ─────
  // Brand-colored menu boards (driven by the `brand` field) instead of
  // the paper menu look. Items use chain-specific Japanese names — the
  // way they actually appear on the real menus.
  {
    id:'kfc', category:'fastfood', template:'fastfood', personality:'formal',
    name: { ja:'ケンタッキー', en:'KFC' },
    npc: { name:'店員', nameJa:'店員さん', glyph:'店' },
    setting: { ja:'チキンのファストフード店', en:'A fried-chicken chain' },
    monologue: {
      ja:'KFCに入る。カウンターで注文して、レジで払い、番号を呼ばれたら受け取る。サッと流れに乗ろう。',
      en:"You walk into KFC. Order at the counter, pay at the register, pick up when your number's called. Just go with the flow.",
      furigana:'KFCに<ruby>入<rt>はい</rt></ruby>る。カウンターで<ruby>注文<rt>ちゅうもん</rt></ruby>して、レジで<ruby>払<rt>はら</rt></ruby>い、<ruby>番号<rt>ばんごう</rt></ruby>を<ruby>呼<rt>よ</rt></ruby>ばれたら<ruby>受<rt>う</rt></ruby>け<ruby>取<rt>と</rt></ruby>る。サッと<ruby>流<rt>なが</rt></ruby>れに<ruby>乗<rt>の</rt></ruby>ろう。',
    },
    // Brand theming used by the fast-food menu renderer. `primary` is
    // the dominant background tone, `accent` is the text/contrast color
    // on top of it, `badge` is the price-chip color (lifted off the
    // primary for visual separation).
    brand: {
      primary: '#E4002B',  // KFC red
      accent:  '#FFFFFF',
      badge:   '#FCC72C',  // gold
      label:   'KFC · Kentucky Fried Chicken',
    },
    // Item IDs map 1:1 to image files: images/food/<id>.png. When a PNG
    // isn't there yet, the brand menu falls back to scene-placeholder.
    //
    // Sized items: chicken (オリジナル / レッドホット / 辛旨) and fries
    // declare a `sizes` array. Each size has its own JP label + kana +
    // EN gloss + price. The `price` on the parent is the from-price
    // shown on the menu card ("¥600〜"). After the player picks a sized
    // item, the engine routes to the sizes step (see fastfood template)
    // where they choose 2/4/8/16 ピース for chicken or S/M/L for fries —
    // the size labels use the real Japanese names KFC actually prints.
    menu: [
      { id:'kfc-original',  kanji:'オリジナルチキン',     kana:'オリジナルチキン',     en:'Original Recipe Chicken',          price:600, category:'food',
        sizes: [
          { id:'2pc',  svg:'kfc-bucket-s',  label:'2ピース',                 kana:'にピース',                       en:'2 pieces (single)',          price:600  },
          { id:'4pc',  svg:'kfc-bucket-m',  label:'4ピースパック',           kana:'よんピースパック',               en:'4-piece pack',               price:1180 },
          { id:'8pc',  svg:'kfc-bucket-l',  label:'8ピースバーレル',         kana:'はちピースバーレル',             en:'8-piece barrel (family)',    price:2300 },
          { id:'16pc', svg:'kfc-bucket-xl', label:'16ピースパーティバーレル', kana:'じゅうろくピースパーティバーレル', en:'16-piece party barrel',    price:4500 },
        ],
      },
      { id:'kfc-redhot',    kanji:'レッドホットチキン',   kana:'レッドホットチキン',   en:'Red Hot Chicken',                  price:660, category:'food',
        sizes: [
          { id:'2pc',  svg:'kfc-bucket-s',  label:'2ピース',                 kana:'にピース',                       en:'2 pieces (single)',          price:660  },
          { id:'4pc',  svg:'kfc-bucket-m',  label:'4ピースパック',           kana:'よんピースパック',               en:'4-piece pack',               price:1280 },
          { id:'8pc',  svg:'kfc-bucket-l',  label:'8ピースバーレル',         kana:'はちピースバーレル',             en:'8-piece barrel (family)',    price:2480 },
          { id:'16pc', svg:'kfc-bucket-xl', label:'16ピースパーティバーレル', kana:'じゅうろくピースパーティバーレル', en:'16-piece party barrel',    price:4850 },
        ],
      },
      { id:'kfc-karauma',   kanji:'辛旨チキン',           kana:'からうまチキン',       en:'Spicy Crispy Chicken',             price:660, category:'food', furigana:'<ruby>辛旨<rt>からうま</rt></ruby>チキン',
        sizes: [
          { id:'2pc',  svg:'kfc-bucket-s',  label:'2ピース',                 kana:'にピース',                       en:'2 pieces (single)',          price:660  },
          { id:'4pc',  svg:'kfc-bucket-m',  label:'4ピースパック',           kana:'よんピースパック',               en:'4-piece pack',               price:1280 },
          { id:'8pc',  svg:'kfc-bucket-l',  label:'8ピースバーレル',         kana:'はちピースバーレル',             en:'8-piece barrel (family)',    price:2480 },
          { id:'16pc', svg:'kfc-bucket-xl', label:'16ピースパーティバーレル', kana:'じゅうろくピースパーティバーレル', en:'16-piece party barrel',    price:4850 },
        ],
      },
      { id:'kfc-sandwich',  kanji:'チキンフィレサンド',   kana:'チキンフィレサンド',   en:'Chicken Fillet Sandwich',          price:440, category:'food' },
      { id:'kfc-twister',   kanji:'ツイスター',           kana:'ツイスター',           en:'Twister (wrap)',                   price:400, category:'food' },
      { id:'kfc-fries',     kanji:'フライドポテト',       kana:'フライドポテト',       en:'French fries',                     price:250, category:'food',
        sizes: [
          // KFC Japan uses S/M/L for fries — the size labels are written
          // in katakana and the お客様 hears them at the register, so the
          // kana column is what to learn for the spoken form.
          { id:'s', label:'Sサイズ', kana:'エスサイズ', en:'Small',  price:250 },
          { id:'m', label:'Mサイズ', kana:'エムサイズ', en:'Medium', price:330 },
          { id:'l', label:'Lサイズ', kana:'エルサイズ', en:'Large',  price:430 },
        ],
      },
      { id:'kfc-biscuit',   kanji:'ビスケット',           kana:'ビスケット',           en:'Biscuit',                          price:250, category:'food' },
      { id:'kfc-coleslaw',  kanji:'コールスロー',         kana:'コールスロー',         en:'Coleslaw',                         price:250, category:'food' },
      { id:'kfc-pepsi',     kanji:'ペプシ',               kana:'ペプシ',               en:'Pepsi',                            price:230, category:'drink' },
      { id:'kfc-ocha',      kanji:'お茶',                 kana:'おちゃ',               en:'green tea',                        price:230, category:'drink', furigana:'お<ruby>茶<rt>ちゃ</rt></ruby>' },
    ],
    receiveSvg: null,
    // 16:9 tray scene image — clerk handing the tray across the counter.
    // When present, replaces the food SVG block AND suppresses the small
    // drink-SVG cluster (the tray composition already shows the drink).
    // Falls back through .jpg and scene-placeholder when the PNG isn't
    // there yet, so adding kfc-tray.png later is a drop-and-go.
    receiveImage: 'kfc-tray',
    receiveVocab: [
      { kanji:'チキン',         kana:'チキン',         en:'chicken' },
      { kanji:'レジ袋',         kana:'レジぶくろ',     en:'plastic bag', furigana:'レジ<ruby>袋<rt>ぶくろ</rt></ruby>' },
      { kanji:'紙ナプキン',     kana:'かみナプキン',   en:'paper napkin', furigana:'<ruby>紙<rt>かみ</rt></ruby>ナプキン' },
      { kanji:'店内',           kana:'てんない',       en:'dine-in', furigana:'<ruby>店内<rt>てんない</rt></ruby>' },
      { kanji:'持ち帰り',       kana:'もちかえり',     en:'take-out', furigana:'<ruby>持<rt>も</rt></ruby>ち<ruby>帰<rt>かえ</rt></ruby>り' },
    ],
  },
  {
    id:'mcdonalds', category:'fastfood', template:'fastfood', personality:'formal',
    name: { ja:'マクドナルド', en:"McDonald's" },
    npc: { name:'店員', nameJa:'店員さん', glyph:'店' },
    setting: { ja:'街角のファストフード店', en:'A corner fast-food restaurant' },
    monologue: {
      ja:'マクドナルドだ。「マック」とも呼ぶ。レジに並んで、注文して、トレーを受け取る。世界中で同じ流れ。',
      en:"It's McDonald's — locals call it 'Makku.' Get in line, order, take the tray. Same flow worldwide.",
      furigana:'マクドナルドだ。「マック」とも<ruby>呼<rt>よ</rt></ruby>ぶ。レジに<ruby>並<rt>なら</rt></ruby>んで、<ruby>注文<rt>ちゅうもん</rt></ruby>して、トレーを<ruby>受<rt>う</rt></ruby>け<ruby>取<rt>と</rt></ruby>る。<ruby>世界中<rt>せかいじゅう</rt></ruby>で<ruby>同<rt>おな</rt></ruby>じ<ruby>流<rt>なが</rt></ruby>れ。',
    },
    brand: {
      primary: '#DA291C',  // McDonald's red
      accent:  '#FFFFFF',
      badge:   '#FFC72C',  // golden arches yellow
      label:   "McDonald's · マック",
    },
    menu: [
      { id:'mcd-bigmac',       kanji:'ビッグマック',         kana:'ビッグマック',         en:'Big Mac',                          price:480, category:'food' },
      { id:'mcd-cheeseburger', kanji:'チーズバーガー',       kana:'チーズバーガー',       en:'Cheeseburger',                     price:200, category:'food' },
      { id:'mcd-doublecheese', kanji:'ダブルチーズバーガー', kana:'ダブルチーズバーガー', en:'Double Cheeseburger',              price:400, category:'food' },
      { id:'mcd-fish',         kanji:'フィレオフィッシュ',   kana:'フィレオフィッシュ',   en:'Filet-O-Fish',                     price:420, category:'food' },
      { id:'mcd-tsukimi',      kanji:'月見バーガー',         kana:'つきみバーガー',       en:'Tsukimi Burger (seasonal)',        price:460, category:'food', furigana:'<ruby>月見<rt>つきみ</rt></ruby>バーガー' },
      { id:'mcd-fries',        kanji:'マックポテト',         kana:'マックポテト',         en:'McDonald’s fries',                 price:330, category:'food' },
      { id:'mcd-nuggets',      kanji:'チキンナゲット',       kana:'チキンナゲット',       en:'Chicken McNuggets (5 pc)',         price:240, category:'food' },
      { id:'mcd-cola',         kanji:'コーラ',               kana:'コーラ',               en:'Coca-Cola',                        price:230, category:'drink' },
      { id:'mcd-shake',        kanji:'マックシェイク',       kana:'マックシェイク',       en:'McShake',                          price:260, category:'food' },
      { id:'mcd-coffee',       kanji:'ホットコーヒー',       kana:'ホットコーヒー',       en:'Hot coffee',                       price:150, category:'drink' },
    ],
    receiveSvg: null,
    // 16:9 tray scene — clerk handing across the counter. Replaces the
    // food SVG and suppresses the drink-SVG cluster (the tray already
    // shows the drink in the composition).
    receiveImage: 'mcd-tray',
    receiveVocab: [
      { kanji:'トレー',         kana:'トレー',         en:'tray' },
      { kanji:'ストロー',       kana:'ストロー',       en:'straw' },
      { kanji:'紙袋',           kana:'かみぶくろ',     en:'paper bag', furigana:'<ruby>紙袋<rt>かみぶくろ</rt></ruby>' },
      { kanji:'店内',           kana:'てんない',       en:'dine-in', furigana:'<ruby>店内<rt>てんない</rt></ruby>' },
      { kanji:'持ち帰り',       kana:'もちかえり',     en:'take-out', furigana:'<ruby>持<rt>も</rt></ruby>ち<ruby>帰<rt>かえ</rt></ruby>り' },
    ],
  },
  // Note: Matsuya and Ekibenya Matsuri live ONLY in the Fast Food
  // book's vocab pages (not as restaurants here). They're vocabulary-
  // only entries — no experience flow, no menu, no scene engine
  // touch-points. Single image per chain via the auto-resolve to
  // images/vocab/<page.id>.png.

  // ── KONBINI (3) — real chain names, shared shelf via 'konbini' template
  // No per-variant menu: all 3 chains expose the same KONBINI_SECTIONS
  // shelves. The chain only changes branding (name, setting, monologue).
  {
    id:'konbini-lawson', category:'konbini', template:'konbini', personality:'formal',
    name: { ja:'ローソン', en:'Lawson' },
    npc: { name:'店員', nameJa:'店員さん', glyph:'店' },
    setting: { ja:'24時間のコンビニ', en:'A 24-hour convenience store' },
    monologue: {
      ja:'24時間営業のコンビニ。棚を見て、買うものを決めて、レジへ。',
      en:"24-hour convenience store. Walk the aisles, pick what you want, take it to the register.",
      furigana:'24<ruby>時間<rt>じかん</rt></ruby><ruby>営業<rt>えいぎょう</rt></ruby>のコンビニ。<ruby>棚<rt>たな</rt></ruby>を<ruby>見<rt>み</rt></ruby>て、<ruby>買<rt>か</rt></ruby>うものを<ruby>決<rt>き</rt></ruby>めて、レジへ。',
    },
  },
  {
    id:'konbini-family', category:'konbini', template:'konbini', personality:'formal',
    name: { ja:'ファミリーマート', en:'FamilyMart' },
    npc: { name:'店員', nameJa:'店員さん', glyph:'店' },
    setting: { ja:'駅前のコンビニ', en:'A convenience store by the station' },
    monologue: {
      ja:'駅前のコンビニ。棚を順番に回って、必要なものを取る。',
      en:"Convenience store by the station. Walk the sections, pick up what you need.",
      furigana:'<ruby>駅前<rt>えきまえ</rt></ruby>のコンビニ。<ruby>棚<rt>たな</rt></ruby>を<ruby>順番<rt>じゅんばん</rt></ruby>に<ruby>回<rt>まわ</rt></ruby>って、<ruby>必要<rt>ひつよう</rt></ruby>なものを<ruby>取<rt>と</rt></ruby>る。',
    },
  },
  {
    id:'konbini-seven', category:'konbini', template:'konbini', personality:'formal',
    name: { ja:'セブン-イレブン', en:'Seven-Eleven' },
    npc: { name:'店員', nameJa:'店員さん', glyph:'店' },
    setting: { ja:'交差点のコンビニ', en:'A convenience store at the intersection' },
    monologue: {
      ja:'交差点のコンビニ。同じ流れ — 棚を見て、レジへ。電子マネーが便利。',
      en:"Convenience store at the intersection. Same drill — browse the shelves, head to the register. IC card is easiest.",
      furigana:'<ruby>交差点<rt>こうさてん</rt></ruby>のコンビニ。<ruby>同<rt>おな</rt></ruby>じ<ruby>流<rt>なが</rt></ruby>れ — <ruby>棚<rt>たな</rt></ruby>を<ruby>見<rt>み</rt></ruby>て、レジへ。<ruby>電子<rt>でんし</rt></ruby>マネーが<ruby>便利<rt>べんり</rt></ruby>。',
    },
  },

  // ── KAZ'S PLACE (the friend) ─────────────────────────────────────
  // A returning-visitor scene. Kaz remembers the player, code-switches
  // between casual Japanese and English, tells stories, treats the player
  // like an old friend. Uses the `friend` template (defined separately
  // below in RESTAURANT_TEMPLATES) which overrides the greet step with
  // returning-customer dialogue.
  {
    id:'kazu-no-mise', category:'yatai', template:'friend', personality:'friend',
    name: { ja:'カズの店', en:"Kaz's Place" },
    npc: { name:'Kaz', nameJa:'カズさん', glyph:'友' },
    setting: { ja:'カズの焼き鳥屋台 — 一人でやってる', en:"Kaz's yakitori stand — he runs it alone, and he remembers you" },
    monologue: {
      ja:'カズの店だ! 久しぶりに会う友達。カジュアルに、嬉しい気持ちを伝えよう。英語も交えて大丈夫。',
      en:"It's Kaz's place! Old friend, been a while. Be casual, show how happy you are. English is fine to mix in.",
      furigana:'カズの<ruby>店<rt>みせ</rt></ruby>だ! <ruby>久<rt>ひさ</rt></ruby>しぶりに<ruby>会<rt>あ</rt></ruby>う<ruby>友達<rt>ともだち</rt></ruby>。カジュアルに、<ruby>嬉<rt>うれ</rt></ruby>しい<ruby>気持<rt>きも</rt></ruby>ちを<ruby>伝<rt>つた</rt></ruby>えよう。<ruby>英語<rt>えいご</rt></ruby>も<ruby>交<rt>まじ</rt></ruby>えて<ruby>大丈夫<rt>だいじょうぶ</rt></ruby>。',
    },
    menu: [
      { kanji:'おまかせ盛り合わせ', kana:'おまかせもりあわせ', en:"Kaz's chef pick", price:1500, category:'food', furigana:'おまかせ<ruby>盛<rt>も</rt></ruby>り<ruby>合<rt>あ</rt></ruby>わせ' },
      { kanji:'もも',   kana:'もも',     en:'chicken thigh',     price:280, category:'food' },
      { kanji:'ねぎま', kana:'ねぎま',   en:'chicken + leek',    price:300, category:'food' },
      { kanji:'皮',     kana:'かわ',     en:'chicken skin',      price:260, category:'food', furigana:'<ruby>皮<rt>かわ</rt></ruby>' },
      { kanji:'ささみ', kana:'ささみ',   en:'breast tenderloin', price:300, category:'food' },
      { kanji:'手羽先', kana:'てばさき', en:'chicken wings',     price:340, category:'food', furigana:'<ruby>手羽先<rt>てばさき</rt></ruby>' },
      { kanji:'つくね', kana:'つくね',   en:'chicken meatball',  price:320, category:'food' },
      { kanji:'砂肝',   kana:'すなぎも', en:'chicken gizzard',   price:280, category:'food', furigana:'<ruby>砂肝<rt>すなぎも</rt></ruby>' },
      { kanji:'生ビール', kana:'なまびーる', en:'draft beer',    price:500, category:'drink', furigana:'<ruby>生<rt>なま</rt></ruby>ビール' },
      { kanji:'ハイボール', kana:'はいぼーる', en:'highball',    price:450, category:'drink' },
      { kanji:'日本酒',   kana:'にほんしゅ',   en:'sake',         price:600, category:'drink', furigana:'<ruby>日本酒<rt>にほんしゅ</rt></ruby>' },
    ],
    receiveSvg: 'dish-yakitori',
    receiveHot: true,
  },
];

// Backwards compat — keep RESTAURANT_SCENES as an empty stub so old code
// doesn't crash if it references it. The engine reads from the new
// EATING_OUT_RESTAURANTS + RESTAURANT_TEMPLATES path.
window.RESTAURANT_SCENES = {};

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
  { kind:'kanji', kanji:'止', kana:'と.まる',  en:'stop / halt',     level:'N4', tags:[] },
  { kind:'kanji', kanji:'戸', kana:'と',       en:'door',            level:'N3', tags:[] },
  { kind:'kanji', kanji:'門', kana:'もん',     en:'gate',            level:'N3', tags:[] },
  { kind:'kanji', kanji:'閤', kana:'こう',     en:'side door',       level:'N1', tags:[] },
  { kind:'kanji', kanji:'開', kana:'ひら.く',  en:'open',            level:'N4', tags:[] },
  { kind:'kanji', kanji:'床', kana:'ゆか',     en:'floor',           level:'N3', tags:['home'] },
  { kind:'kanji', kanji:'棚', kana:'たな',     en:'shelf',           level:'N2', tags:['home'] },
  { kind:'word',  kanji:'天井', kana:'てんじょう', en:'ceiling',         level:'N3', tags:['home'] },
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
  { kind:'kanji', kanji:'字', kana:'じ',       en:'character / letter', level:'N4', tags:[] },
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
  { kind:'kanji', kanji:'厂', kana:'がけ',     en:'cliff (radical)', level:'—', tags:['nature'] },
  { kind:'kanji', kanji:'石', kana:'いし',     en:'stone / rock',    level:'N5', tags:['nature'] },
  { kind:'kanji', kanji:'岩', kana:'いわ',     en:'rock / boulder',  level:'N3', tags:['nature'] },
  { kind:'kanji', kanji:'宕', kana:'ほら',     en:'cave',            level:'—', tags:['nature'] },
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
  { kind:'kanji', kanji:'宀', kana:'うかんむり', en:'roof / crown / cap (radical)', level:'—', tags:[] },
  { kind:'kanji', kanji:'円', kana:'えん',     en:'yen / circle',     level:'N5', tags:[] },
  { kind:'kanji', kanji:'大', kana:'おお',     en:'big / large',      level:'N5', tags:['adj'] },
  { kind:'kanji', kanji:'小', kana:'ちい',     en:'small',            level:'N5', tags:['adj'] },
  { kind:'kanji', kanji:'上', kana:'うえ',     en:'up / above',       level:'N5', tags:[] },
  { kind:'kanji', kanji:'下', kana:'した',     en:'down / below',     level:'N5', tags:[] },
  { kind:'kanji', kanji:'日', kana:'ひ',       en:'sun / day',       level:'N5', tags:['time'] },
  { kind:'kanji', kanji:'月', kana:'つき',     en:'moon / month',    level:'N5', tags:['time'] },
  { kind:'kanji', kanji:'目', kana:'め',       en:'eye',             level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'体', kana:'からだ',   en:'body',            level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'手', kana:'て',       en:'hand',            level:'N5', tags:['body'] },
  { kind:'kanji', kanji:'見', kana:'み.る',    en:'look / see',      level:'N5', tags:[] },
  { kind:'kanji', kanji:'自', kana:'じ',       en:'self / oneself',  level:'N4', tags:[] },
  { kind:'kanji', kanji:'口', kana:'くち',     en:'mouth / opening / entrance', level:'N5', tags:['body'] },
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
  '湿':'しめ', '残':'のこ', '行':'い', '止':'と', '来':'く',
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
  '大':'おお',
  '戸':'と', '門':'もん',
  '床':'ゆか', '天':'てん', '井':'じょう',
  '閤':'こう',
  '厂':'がけ',
  '岩':'いわ',
  '宀':'うかんむり', '宕':'ほら',
  '字':'じ', '書':'か',
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

  // Grade 1 additions
  '一':'いち', '二':'に', '三':'さん', '四':'よん', '五':'ご',
  '六':'ろく', '七':'なな', '八':'はち', '九':'きゅう', '十':'じゅう',
  '百':'ひゃく', '千':'せん',
  '白':'しろ', '赤':'あか', '青':'あお',
  '金':'かね', '玉':'たま', '糸':'いと', '車':'くるま', '立':'た',
  '休':'やす', '犬':'いぬ', '貝':'かい', '気':'き', '竹':'たけ',
  '左':'ひだり', '右':'みぎ',
  '年':'とし', '早':'はや', '夕':'ゆう', '先':'さき',
  '学':'まな', '校':'こう', '文':'ぶん', '名':'な', '正':'ただ',
};

// ── KANJI MEANINGS ─────────────────────────────────────────────────────
// Used to render the per-character breakdown of multi-kanji words inside
// the vocab popover (e.g. 浴室 → 浴 = bathe, 室 = room). Keep entries short
// and concrete — one or two words, lowercase. Extendable: add as you grow.
window.KANJI_MEANINGS = {
  // bathroom
  '浴':'bathe', '室':'room', '鏡':'mirror', '洗':'wash', '面':'face',
  '台':'stand', '所':'place', '蛇':'snake', '口':'mouth / opening', '槽':'tank',
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
  '湿':'damp', '残':'remain', '行':'go', '止':'stop', '来':'come',
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
  '大':'big',
  '戸':'door', '門':'gate',
  '床':'floor', '天':'heaven', '井':'well',
  '閤':'side door',
  '厂':'cliff',
  '岩':'rock',
  '宀':'roof / crown / cap', '宕':'cave',
  '字':'character', '書':'write / book',
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

  // Grade 1 additions
  '一':'one', '二':'two', '三':'three', '四':'four', '五':'five',
  '六':'six', '七':'seven', '八':'eight', '九':'nine', '十':'ten',
  '百':'hundred', '千':'thousand',
  '白':'white', '赤':'red', '青':'blue / green',
  '金':'gold / money', '玉':'jewel', '糸':'thread', '車':'vehicle', '立':'stand',
  '休':'rest', '犬':'dog', '貝':'shell', '気':'spirit / air', '竹':'bamboo',
  '左':'left', '右':'right',
  '年':'year', '早':'early', '夕':'evening', '先':'ahead / prior',
  '学':'learn', '校':'school', '文':'writing', '名':'name', '正':'correct',
};

// ── PARTICLES ───────────────────────────────────────────────────────────
// Japanese particles for the Writing → Particles lesson page.
// Each particle:
//   char     : the kana itself (は, を…)
//   romaji   : pronunciation (NOT spelling — は is "wa", を is "o", へ is "e")
//   color    : hex from the app's existing particle palette
//   role     : Japanese name of the function (topic marker, etc.)
//   tagline  : short English phrasing of what it does
//   note     : optional pronunciation / spelling caveat
//   uses     : 1–3 grammar uses, each with pattern + examples
//   compare  : optional "vs another particle" callout (HTML-safe text)
//
// Example sentences mark the particle's spot with the literal char inside
// the sentence — the renderer highlights it via class .pc. Keep particles
// at the exact position they appear in the ja string.
window.PARTICLES = [
  {
    char: 'は', romaji: 'wa', color: '#8a2538',
    role: '主題 — topic marker',
    tagline: 'marks what the sentence is about. "As for X…"',
    note: 'Spelled は but pronounced <b>wa</b> when used as a particle.',
    uses: [
      {
        rule: 'topic',
        title: 'introduce the topic',
        pattern: ['Topic', 'は', 'comment'],
        examples: [
          { ja:'私は学生です。',    parts:['私','は','学生です。'],
            kana:'わたしは がくせい です。',  en:'As for me, I\'m a student.' },
          { ja:'これは本です。',    parts:['これ','は','本です。'],
            kana:'これは ほん です。',        en:'As for this, it\'s a book.' },
          { ja:'今日は寒いです。',  parts:['今日','は','寒いです。'],
            kana:'きょうは さむい です。',    en:'As for today, it\'s cold.' },
          { ja:'弟は背が高いです。',
            parts:['弟','は','背','が','高いです。'],
            kana:'おとうとは せが たかい です。',
            en:'As for my brother, he\'s tall.  (X は Y が pattern — umbrella topic, inner subject)' },
        ],
      },
      {
        rule: 'contrast',
        title: 'set up a contrast',
        pattern: ['X', 'は', '… が', 'Y', 'は', '…'],
        examples: [
          { ja:'コーヒーは好きですが、お茶は好きじゃない。',
            parts:['コーヒー','は','好きです','が','、お茶','は','好きじゃない。'],
            kana:'こーひーは すきですが、おちゃは すきじゃない。',
            en:'As for coffee, I like it — but as for tea, not so much.' },
        ],
      },
    ],
    compare: {
      hd: 'は vs が',
      body: 'Use <span class="ja">は</span> when the noun is the <i>topic</i> already on the table — old information. Use <span class="ja">が</span> when you are <i>identifying</i> who or what, or introducing new information. <span class="ja">私<b class="pc" style="color:#8a2538">は</b>学生です</span> = "As for me, student." <span class="ja">私<b class="pc" style="color:#c97a2c">が</b>学生です</span> = "<i>I</i> am the student (not them)."'
    },
  },

  {
    char: 'が', romaji: 'ga', color: '#c97a2c',
    role: '主格 — subject marker',
    tagline: 'identifies who or what is doing the action, or introduces something new.',
    uses: [
      {
        rule: 'subject',
        title: 'mark the grammatical subject',
        pattern: ['Subject', 'が', 'verb / adj.'],
        examples: [
          { ja:'雨が降っています。',   parts:['雨','が','降っています。'],
            kana:'あめが ふっています。',     en:'It is raining. (rain is falling)' },
          { ja:'猫がいます。',         parts:['猫','が','います。'],
            kana:'ねこが います。',           en:'There is a cat.' },
          { ja:'頭が痛いです。',       parts:['頭','が','痛いです。'],
            kana:'あたまが いたい です。',    en:'My head hurts.  (body sensations always take が)' },
        ],
      },
      {
        rule: 'preference / ability',
        title: 'with 好き・上手・できる',
        pattern: ['Object', 'が', '好き / 上手 / できる'],
        examples: [
          { ja:'寿司が好きです。',     parts:['寿司','が','好きです。'],
            kana:'すしが すき です。',        en:'I like sushi.' },
          { ja:'日本語ができます。',   parts:['日本語','が','できます。'],
            kana:'にほんごが できます。',     en:'I can speak Japanese.' },
        ],
      },
      {
        rule: 'but',
        title: 'soft "but" between clauses',
        pattern: ['…clause 1', '、', '…clause 2'],
        examples: [
          { ja:'高いですが、おいしい。', parts:['高いです','が','、おいしい。'],
            kana:'たかいですが、おいしい。',  en:"It's expensive, but tasty." },
        ],
      },
    ],
  },

  {
    char: 'を', romaji: 'o', color: '#5a2e8a',
    role: '目的格 — object marker',
    tagline: 'marks the direct object — the thing being acted on.',
    note: 'Spelled を but pronounced <b>o</b>, identical to お in sound.',
    uses: [
      {
        rule: 'direct object',
        title: 'the thing you do something to',
        pattern: ['Object', 'を', 'verb'],
        examples: [
          { ja:'本を読みます。',     parts:['本','を','読みます。'],
            kana:'ほんを よみます。',       en:'I read a book.' },
          { ja:'水を飲みました。',   parts:['水','を','飲みました。'],
            kana:'みずを のみました。',     en:'I drank water.' },
          { ja:'シャワーを浴びる。', parts:['シャワー','を','浴びる。'],
            kana:'しゃわーを あびる。',     en:'to take a shower.' },
        ],
      },
      {
        rule: 'path / leaving',
        title: 'path traversed, or place left',
        pattern: ['Place', 'を', 'verb of motion'],
        examples: [
          { ja:'公園を歩きます。',   parts:['公園','を','歩きます。'],
            kana:'こうえんを あるきます。', en:'I walk through the park.' },
          { ja:'家を出ました。',     parts:['家','を','出ました。'],
            kana:'いえを でました。',       en:'I left the house.' },
        ],
      },
    ],
  },

  {
    char: 'に', romaji: 'ni', color: '#3a7a4a',
    role: '方向・時間 — destination & time',
    tagline: 'destination, point in time, indirect object — a precise pin.',
    uses: [
      {
        rule: 'destination',
        title: 'going to a place',
        pattern: ['Place', 'に', '行く / 来る / 帰る'],
        examples: [
          { ja:'学校に行きます。',   parts:['学校','に','行きます。'],
            kana:'がっこうに いきます。',   en:'I go to school.' },
          { ja:'東京に住んでいます。', parts:['東京','に','住んでいます。'],
            kana:'とうきょうに すんでいます。', en:'I live in Tokyo.' },
        ],
      },
      {
        rule: 'time',
        title: 'specific point in time',
        pattern: ['Time', 'に', 'event'],
        examples: [
          { ja:'七時に起きます。',   parts:['七時','に','起きます。'],
            kana:'しちじに おきます。',     en:'I wake up at seven.' },
          { ja:'月曜日に会いましょう。', parts:['月曜日','に','会いましょう。'],
            kana:'げつようびに あいましょう。', en:"Let's meet on Monday." },
        ],
      },
      {
        rule: 'indirect object',
        title: 'the recipient — "to (someone)"',
        pattern: ['Person', 'に', '物 を verb'],
        examples: [
          { ja:'友達にプレゼントをあげました。',
            parts:['友達','に','プレゼント','を','あげました。'],
            kana:'ともだちに ぷれぜんとを あげました。',
            en:'I gave a present to my friend.' },
        ],
      },
    ],
    compare: {
      hd: 'に vs で',
      body: 'Use <span class="ja"><b class="pc" style="color:#3a7a4a">に</b></span> for the destination of motion or a static location of existence. Use <span class="ja"><b class="pc" style="color:#2e7a3f">で</b></span> for the place where an action <i>happens</i>. <span class="ja">図書館<b class="pc" style="color:#3a7a4a">に</b>います</span> = "I am at the library." <span class="ja">図書館<b class="pc" style="color:#2e7a3f">で</b>勉強します</span> = "I study at the library."'
    },
  },

  {
    char: 'で', romaji: 'de', color: '#2e7a3f',
    role: '場所・手段 — place of action & means',
    tagline: 'where an action takes place, or the tool used to do it.',
    uses: [
      {
        rule: 'place of action',
        title: 'where the verb happens',
        pattern: ['Place', 'で', 'verb'],
        examples: [
          { ja:'カフェで働きます。',   parts:['カフェ','で','働きます。'],
            kana:'かふぇで はたらきます。', en:'I work at a café.' },
          { ja:'公園で遊びました。',   parts:['公園','で','遊びました。'],
            kana:'こうえんで あそびました。', en:'I played in the park.' },
        ],
      },
      {
        rule: 'means / tool',
        title: '"by" or "with" — the instrument',
        pattern: ['Tool', 'で', 'verb'],
        examples: [
          { ja:'電車で行きます。',     parts:['電車','で','行きます。'],
            kana:'でんしゃで いきます。',   en:'I go by train.' },
          { ja:'箸で食べます。',       parts:['箸','で','食べます。'],
            kana:'はしで たべます。',       en:'I eat with chopsticks.' },
          { ja:'日本語で話しましょう。', parts:['日本語','で','話しましょう。'],
            kana:'にほんごで はなしましょう。', en:"Let's speak in Japanese." },
        ],
      },
    ],
  },

  {
    char: 'へ', romaji: 'e', color: '#2a5b94',
    role: '方向 — direction',
    tagline: 'toward — emphasizes the direction of motion, not the destination itself.',
    note: 'Spelled へ but pronounced <b>e</b> when used as a particle.',
    uses: [
      {
        rule: 'direction',
        title: 'heading toward a place',
        pattern: ['Place', 'へ', '行く / 来る / 帰る'],
        examples: [
          { ja:'東京へ行きます。',     parts:['東京','へ','行きます。'],
            kana:'とうきょうへ いきます。', en:'I am heading to Tokyo.' },
          { ja:'家へ帰ります。',       parts:['家','へ','帰ります。'],
            kana:'いえへ かえります。',     en:'I am going home.' },
        ],
      },
    ],
    compare: {
      hd: 'へ vs に',
      body: 'Often interchangeable for destinations — <span class="ja"><b class="pc" style="color:#2a5b94">へ</b></span> feels slightly more about the path / direction, <span class="ja"><b class="pc" style="color:#3a7a4a">に</b></span> about the arrival point. In spoken Japanese <span class="ja">に</span> is more common.'
    },
  },

  {
    char: 'の', romaji: 'no', color: '#c43a4a',
    role: '所有・修飾 — possession & modification',
    tagline: 'links two nouns: the first one describes or owns the second.',
    uses: [
      {
        rule: 'possession',
        title: 'whose? — "X\'s Y"',
        pattern: ['Owner', 'の', 'thing'],
        examples: [
          { ja:'私の本です。',         parts:['私','の','本です。'],
            kana:'わたしの ほん です。',    en:'It is my book.' },
          { ja:'友達の車を運転しました。',
            parts:['友達','の','車','を','運転しました。'],
            kana:'ともだちの くるまを うんてんしました。', en:"I drove my friend's car." },
        ],
      },
      {
        rule: 'description',
        title: 'kind / type — like an English adjective',
        pattern: ['Description', 'の', 'noun'],
        examples: [
          { ja:'日本語の先生です。',   parts:['日本語','の','先生です。'],
            kana:'にほんごの せんせい です。', en:'I am a Japanese-language teacher.' },
          { ja:'木のテーブル。',       parts:['木','の','テーブル。'],
            kana:'きの てーぶる。',         en:'A wooden table.' },
        ],
      },
      {
        rule: 'nominalizer',
        title: 'turn a verb phrase into a noun',
        pattern: ['…verb (plain)', 'の', '…'],
        examples: [
          { ja:'本を読むのが好きです。',
            parts:['本','を','読む','の','が','好きです。'],
            kana:'ほんを よむのが すき です。', en:'I like reading books.' },
        ],
      },
    ],
  },

  {
    char: 'と', romaji: 'to', color: '#2a5b94',
    role: '同伴・引用 — with, and, quotation',
    tagline: 'connects nouns exhaustively ("X and Y"), or marks accompaniment.',
    uses: [
      {
        rule: 'and (exhaustive)',
        title: 'list two or more specific items',
        pattern: ['Noun', 'と', 'Noun'],
        examples: [
          { ja:'パンと牛乳を買いました。',
            parts:['パン','と','牛乳','を','買いました。'],
            kana:'ぱんと ぎゅうにゅうを かいました。', en:'I bought bread and milk.' },
        ],
      },
      {
        rule: 'with (companion)',
        title: 'doing something together',
        pattern: ['Person', 'と', 'verb'],
        examples: [
          { ja:'友達と映画を見ました。',
            parts:['友達','と','映画','を','見ました。'],
            kana:'ともだちと えいがを みました。', en:'I watched a movie with a friend.' },
        ],
      },
      {
        rule: 'quotation',
        title: 'what someone says or thinks',
        pattern: ['"quote"', 'と', '言う / 思う'],
        examples: [
          { ja:'「ありがとう」と言いました。',
            parts:['「ありがとう」','と','言いました。'],
            kana:'「ありがとう」と いいました。', en:'I said "thank you."' },
          { ja:'春になると、桜が咲く。',
            parts:['春になる','と','、桜','が','咲く。'],
            kana:'はるに なると、さくらが さく。',
            en:'When spring comes, cherry blossoms bloom.  (と as automatic conditional — "whenever X, Y")' },
        ],
      },
    ],
    compare: {
      hd: 'と vs や',
      body: '<span class="ja"><b class="pc" style="color:#2a5b94">と</b></span> lists items <i>exhaustively</i> — these and only these. <span class="ja"><b class="pc" style="color:#8d6630">や</b></span> lists items <i>representatively</i> — these and others like them.'
    },
  },

  {
    char: 'も', romaji: 'mo', color: '#6a3a92',
    role: '同類 — also, too',
    tagline: 'adds something to what was just said — replaces は, が, or を.',
    uses: [
      {
        rule: 'also',
        title: '"X also / X too"',
        pattern: ['X', 'も', '…'],
        examples: [
          { ja:'私も学生です。',       parts:['私','も','学生です。'],
            kana:'わたしも がくせい です。', en:'I am also a student.' },
          { ja:'コーヒーも飲みます。', parts:['コーヒー','も','飲みます。'],
            kana:'こーひーも のみます。',   en:'I also drink coffee.' },
        ],
      },
      {
        rule: 'emphasis',
        title: 'even — surprising or large amount',
        pattern: ['Number', 'も', 'verb'],
        examples: [
          { ja:'三時間も待ちました。', parts:['三時間','も','待ちました。'],
            kana:'さんじかんも まちました。', en:'I waited (as much as) three hours.' },
          { ja:'誰も来なかった。',     parts:['誰','も','来なかった。'],
            kana:'だれも こなかった。',
            en:'Nobody came.  (question word + も + negative = "no one / nothing / nowhere")' },
        ],
      },
    ],
  },

  {
    char: 'から', romaji: 'kara', color: '#a04a8a',
    role: '起点 — from, because',
    tagline: 'starting point in space, time, or causation.',
    uses: [
      {
        rule: 'from (place / time)',
        title: 'where or when something starts',
        pattern: ['Start', 'から', '…'],
        examples: [
          { ja:'九時から働きます。',   parts:['九時','から','働きます。'],
            kana:'くじから はたらきます。', en:'I work from nine.' },
          { ja:'アメリカから来ました。', parts:['アメリカ','から','来ました。'],
            kana:'あめりかから きました。', en:'I came from America.' },
        ],
      },
      {
        rule: 'because',
        title: 'reason — "since / so"',
        pattern: ['Reason clause', 'から', '、 result clause'],
        examples: [
          { ja:'寒いから、コートを着ます。',
            parts:['寒い','から','、コート','を','着ます。'],
            kana:'さむいから、こーとを きます。', en:"It's cold, so I'll wear a coat." },
        ],
      },
    ],
  },

  {
    char: 'まで', romaji: 'made', color: '#3a7a8a',
    role: '到達点 — until, as far as',
    tagline: 'ending point in space or time — pairs naturally with から.',
    uses: [
      {
        rule: 'until / as far as',
        title: 'where or when something ends',
        pattern: ['Start', 'から', 'End', 'まで'],
        examples: [
          { ja:'九時から五時まで働きます。',
            parts:['九時','から','五時','まで','働きます。'],
            kana:'くじから ごじまで はたらきます。', en:'I work from nine until five.' },
          { ja:'駅まで歩きました。',         parts:['駅','まで','歩きました。'],
            kana:'えきまで あるきました。',          en:'I walked as far as the station.' },
        ],
      },
    ],
  },

  {
    char: 'や', romaji: 'ya', color: '#8d6630',
    role: '例示 — and (among others)',
    tagline: 'lists examples, not the whole set — "things like X and Y."',
    uses: [
      {
        rule: 'representative list',
        title: '"X, Y, and so on"',
        pattern: ['Noun', 'や', 'Noun', '(など)'],
        examples: [
          { ja:'りんごやみかんが好きです。',
            parts:['りんご','や','みかん','が','好きです。'],
            kana:'りんごや みかんが すき です。',
            en:'I like apples and oranges (and similar fruits).' },
          { ja:'机の上に本やペンなどがあります。',
            parts:['机','の','上','に','本','や','ペンなど','が','あります。'],
            kana:'つくえの うえに ほんや ぺんなどが あります。',
            en:'On the desk there are books, pens, and the like.' },
        ],
      },
    ],
  },
];

// ── PARTICLE_QUIZ — moved to particle-quiz-data.js ─────────────────────
// The legacy 10-item quiz lives in particle-quiz-data.js now, under
// window.PARTICLE_QUIZ_BANK (~200 items, particle + JLPT-level tagged).
// The lesson page reads from that bank via the config screen.
