# Kanji N5 Curriculum — Design Spec

> **For agentic workers**: this spec is followed by an implementation plan in `docs/superpowers/plans/`. Use `superpowers:writing-plans` to draft that plan; do not start implementation from this spec directly.

**Goal:** Grow the Nihongo flashcards deck from its current ~104 unique kanji (unevenly spread across 18 classes, several of them stubs) to a **complete JLPT N5 coverage** (≈100 official N5 kanji) plus ~30 useful N4/N3 exceptions, organized into ~16 didactically-coherent classes of 10–20 cards each.

**Architecture:** Primarily a data change. The curriculum lives in `nihongo/data.js` under `window.FLASHCARD_CLASSES`. Each class is an ordered array of card objects; array order *is* the progression order. Kanji are grouped by theme and ordered by radical-prerequisite within each class. Where a radical is non-obvious in form (e.g., 亻 from 人, 飠 from 食), a dedicated `type:'radical'` interlude card breaks down the radical mid-deck — extending the existing pattern that already teaches `亻`, `ナ・ヨ`, `又`, `roof`, and `cliff` this way.

A **small renderer change** in `editorialFlashcardHTML` (`app.html`) handles back-face stroke order for multi-kanji compound cards (昨日, 元気, 御飯) and skips it entirely for kana-only cards (にこにこ, ピンク) — see §4.4.

**Tech stack:** Existing card schema already supports every field used (`{id, kanji, kun, on, en, strokes, examples, usage?, seeAlso?, type, radical, from, descEn, descJa, imageFolder}`). Renderer (`renderFlashcards` in `app.html`) walks the array, surfaces the front + back face, paints stroke order on the back from `images/stroke/<kanji>-order.{svg,gif}`, and reads `seeAlso` chips for cross-references. One narrow renderer change to support per-kanji stroke order on compound cards (§4.4).

---

## 1. Decisions locked during brainstorm

| Topic | Decision |
|---|---|
| Scope | Complete N5 (~100 kanji) + ~30 useful N4/N3 exceptions |
| Existing cards | Full creative latitude — may reorder, move between classes, consolidate stub classes; preserve card content |
| Image policy | Text-only for new cards. The image-slot picks up `images/kanji/<kanji>.webp` automatically when ever a file lands later |
| Organization | Hybrid (Approach C): theme-first categories, radical-ordered within each, mid-deck radical interludes |
| Build mechanics | Pure data change in `data.js`. No new fields. |
| Rollout | 4 batches in 4 commits (Cleanup → Reshape → Add ★ new → Radical interludes) |

---

## 2. Final category inventory (16 classes)

The current 18 classes collapse to 16: 8 polished, 4 repurposed/grown, 3 new, 1 untouched, 5 stub classes absorbed.

| # | Class id | Title (JA / EN) | Cards | Δ |
|---|---|---|---|---|
| 1 | `basic` | きほん / Basic | 15 | -8 |
| 2 | `numbers` | すうじ / Numbers | 14 | +2 |
| 3 | `colors` | いろ / Colors | 9 | -4 |
| 4 | `people` | ひと / People | 17 | -6 |
| 5 | `body` | からだ / Body | 19 | +2 |
| 6 | `nature` | しぜん / Nature & Elements | 12 | -11 |
| 7 | `sky-seasons` | そらときせつ / Sky & Seasons | 11 | +1 |
| 8 | `time` | とき / Time | 15 | -3 +6 |
| 9 | `school` | がっこう / School & Learning | 12 | +2 |
| 10 | `animals` | どうぶつ / Animals | 11 | -1 |
| 11 | `places` | ばしょ / Places & Compass | 14 | +9 |
| 12 | `rooms` | へや / Rooms | 10 | +1 |
| 13 | `food-drink` | たべもののみもの / Food & Drink | 10 | **NEW** (absorbs `drinks`, `food` stubs) |
| 14 | `verbs` | どうし / Verbs | 15 | **NEW** |
| 15 | `adjectives` | けいようし / Adjectives | 10 | **NEW** |
| 16 | `onomatopoeia` | ぎおんご / Onomatopoeia | 11 | unchanged |
| | | **Total cards** | **205** | |

**Five stub classes are absorbed**: `drinks` (1 → into Food & Drink), `food` (1 → into Food & Drink), `concepts` (2 → 音 to Sky & Seasons, 双 to People), `people2` (2 → into People), `body2` (6 → into Body). Existing class id `nature2` is renamed to `sky-seasons` (its content matches that better); existing `directions` is renamed to `places` and grown.

Unique kanji glyphs in the final deck ≈ **130** (≈100 official N5 + ~30 N4/N3 exceptions — existing 茶 紫 雪 草 竹 虫 蛸 烏賊 貝 plus new 持 打 言 話 読 短 強 弱 働 忙 卵 etc.).

---

## 3. Per-class card lists

Notation: no marker = existing card kept as-is. ★ = new card. ◆ = `type:'radical'` interlude card.

### 3.1 — `basic` (基本) · 15 cards
Pictographic foundations. Standalone — no radical dependencies.
```
1.  日   sun / day
2.  月   moon / month
3.  山   mountain
4.  川   river
5.  木   tree                       (unlocks 林 森 本 in Nature, 校 in School, 休 in People)
6.  火   fire                       (unlocks 秋 in Sky & Seasons)
7.  水   water
8.  土   soil
9.  田   rice field                 (unlocks 男 in People, 思 in Verbs)
10. 大   big
11. 小   small
12. 円   yen / circle
13. 玉   jewel / ball
14. 金   gold / money / metal       (also reads Friday; central N5 kanji)
15. 車   vehicle / car              (N5; common counter / compound)
```
Moves out of current `basic`: 王 生 国 → Places; 町 村 市 → seeAlso chips on Places kanji (not full cards); 立 → Verbs; 力 → drop standalone card, referenced inline in 男's breakdown text on the People card; 刀 → drop standalone card, referenced inline on 切 (Verbs); 弓 → drop (rare for N5); 糸 → drop; 宀 → moved to Rooms as a ◆ radical interlude.

### 3.2 — `numbers` (数) · 14 cards
```
1.  一     one
2.  二     two
3.  三     three
4.  四     four
5.  五     five
6.  六     six
7.  七     seven
8.  八     eight
9.  九     nine
10. 十     ten
11. 百     hundred
12. 千     thousand
13. ★万    ten thousand
14. ★半    half                     (bridges to Time class)
```

### 3.3 — `colors` (色) · 9 cards
```
1.  色   color (the radical-bearing kanji that describes itself)
2.  白   white
3.  黒   black
4.  赤   red
5.  青   blue
6.  黄   yellow
7.  茶   tea (color)                 (N4 exception, existing — also lives in Food & Drink)
8.  緑   green                       (N4 exception, existing)
9.  紫   purple                      (N4 exception, existing)
```
*(Existing color cards 黄色, 灰色, 水色 drop — compound vocab, not single-glyph kanji. 黄色's reading lives in 黄's `usage`; 灰色 / 水色 move to a future vocab page. オレンジ・ピンク also drop — pure katakana loanwords.)*

### 3.4 — `people` (人) · 17 cards
```
1.  人        person (pictograph)
2.  ◆         亻 — left-side person (existing radical card)
3.  休        rest = 亻 + 木             seeAlso:[木]
4.  入        enter (pictograph)
5.  子        child (pictograph)
6.  女        woman (pictograph)
7.  好        like = 女 + 子              seeAlso:[子]
8.  母        mother (pictograph)
9.  姉        older sister               usage:お姉さん
10. 妹        younger sister
11. 父        father (pictograph)
12. 男        man = 田 + 力               seeAlso:[田]
13. 兄        older brother              usage:お兄さん
14. 弟        younger brother
15. ◆         ナ・ヨ + 又 (two-hands — existing radical card)
16. 友        friend = hands + 又
17. 双        pair = 又 + 又              (absorbs concepts/people2)
```
Drops from current `people`: the 姉妹 + 兄弟 compound cards (covered by `usage`); 仕 何 → Verbs class; 取 受 反 → drop (N4-leaning, low value here).
Absorbs from `people2`: 赤ちゃん, 双子 → folded into the existing People examples / usage chips, not full new cards.

### 3.5 — `body` (体) · 19 cards
```
1.  体    body = 亻 + 本                seeAlso:[本]
2.  口    mouth (pictograph)
3.  目    eye (pictograph)
4.  見    see = 目 + 儿
5.  自    self (pictograph of nose)
6.  鼻    nose = 自 + 田 + 廾
7.  耳    ear (pictograph)
8.  心    heart (pictograph)
9.  手    hand (pictograph)
10. ◆     扌 — left-side hand (NEW radical card)
11. ★持   hold = 扌 + 寺                (N4 exception — user-requested)
12. ★打   hit = 扌 + 丁                 (N4 exception — user-requested)
13. 足    foot (pictograph)
14. 首    neck
15. 頭    head                          (absorbs from body2)
16. 顔    face                          (absorbs from body2)
17. 髪    hair                          (absorbs from body2)
18. 歯    teeth                         (absorbs from body2)
19. 腕    arm                           (absorbs from body2)
```
Drops from current `body`: 録 書 当 雪 有 佐 (mis-shelved in current state) — 書 → School; 雪 → Nature; rest drop.

### 3.6 — `nature` (自然) · 12 cards
*Pictographic elements (日月山川木火水土田) already in Basic. Nature focuses on composed natural objects.*
```
1.  林     woods = 木 + 木                seeAlso:[木]
2.  森     forest = 木 + 木 + 木            seeAlso:[木]
3.  本     origin / book = 木 + base-line   seeAlso:[木] (also referenced from Body, School)
4.  石     stone (pictograph)
5.  岩     boulder = 山 + 石                seeAlso:[山,石]
6.  雨     rain (pictograph)
7.  雪     snow = 雨 + 帚                   seeAlso:[雨]   (N4 exception, existing)
8.  竹     bamboo (pictograph)            (N4 exception, existing)
9.  草     grass = 艹 + 早                  seeAlso:[茶 for 艹]
10. 虫     insect (pictograph)             (N4 exception, existing)
11. 気     spirit / energy
12. 元気   healthy / energetic            (compound, kept — common vocab)
```
Drops from current `nature`: 厂 (cliff) → drop as standalone card; 宕 → drop (rare); 未 → drop (N4 grammar marker, not high-priority); 炎 → drop (rare); 傘 → drop (rare); 風 → moved to Sky & Seasons; 去 → seeAlso chip only.

### 3.7 — `sky-seasons` (空と季節) · 11 cards
```
1.  天     heaven / sky
2.  空     sky = 穴 + 工
3.  雲     cloud = 雨 + 云                  seeAlso:[雨]
4.  星     star = 日 + 生                   seeAlso:[日]
5.  風     wind                           (moved from Nature)
6.  花     flower = 艹 + 化                 seeAlso:[茶 for 艹]
7.  葉     leaf = 艹 + 世 + 木               seeAlso:[木]
8.  春     spring
9.  夏     summer
10. 秋     autumn = 禾 + 火                 seeAlso:[火]
11. 冬     winter
```
*(Existing 音 from `concepts` is dropped — relocates to a vocab/onomatopoeia note, not a flashcard.)*

### 3.8 — `time` (時) · 15 cards
*Compound cards (今日 / 今週 / 今月 / 今年 / 去年 / 来年 / 先生) demoted to `usage` fields on the relevant kanji card; they don't get standalone flashcards.*
```
1.  時     time / o'clock
2.  分     minute / part
3.  ★半    half                          (cross-listed with Numbers)
4.  年     year
5.  今     now
6.  先     earlier / ahead               (先生 lives as 先's usage)
7.  ★前    before / front
8.  ★後    after / behind
9.  ★何    what / how many
10. 早     early
11. 遅     late
12. ★朝    morning
13. 昼     daytime
14. 夕     evening
15. ★夜    night
```
Drops from current `time`: 秒 (N4-rare); 来 → Verbs; 去 → drop (N4 grammar marker); 7 compound cards demoted to `usage` fields.

### 3.9 — `school` (学校) · 12 cards
```
1.  学     learn
2.  校     school = 木 + 交                seeAlso:[木]
3.  字     character
4.  文     text / writing
5.  名     name
6.  ◆      言 — speech radical (NEW)
7.  ★言    say                            seeAlso:[口]
8.  ★話    talk = 言 + 舌                  seeAlso:[言]
9.  ★読    read = 言 + 売                  seeAlso:[言]
10. 書     write
11. 本     book                          (cross-listed in Nature)
12. 生     student / life
```
Drops from current `school`: 筆 律 建 正 → drop (N4 or rare).

### 3.10 — `animals` (動物) · 11 cards
```
1.  犬     dog
2.  猫     cat
3.  鳥     bird
4.  魚     fish                          (cross-listed in Food & Drink)
5.  馬     horse                         (unlocks 駅 in Places)
6.  牛     cow
7.  豚     pig
8.  鶏     chicken
9.  貝     shell                         (unlocks 買 in Verbs)
10. 蛸     octopus                       (N4 exception, existing)
11. 烏賊   squid                         (N4 exception, existing — compound card)
```
Drops from current `animals`: 小鳥 (compound → into 鳥's `usage`).

### 3.11 — `places` (場所) · 14 cards
*(Renamed from current `directions`.)*
```
1.  上     up
2.  下     down
3.  左     left
4.  右     right
5.  中     middle
6.  ★東    east
7.  ★西    west
8.  ★南    south
9.  ★北    north
10. 王     king                          (moved from Basic)
11. 国     country = 囗 + 王              (moved from Basic; seeAlso:[王])
12. ★家    house
13. ★店    shop
14. ★駅    station = 馬 + 尺              seeAlso:[馬]
```
Moves: 田 stays in Basic (needed early by 男, 思); 町 村 市 → seeAlso chips on 国/家 (skip full cards — they're not on the most-essential N5 short-list); 生 → School.

### 3.12 — `rooms` (部屋) · 10 cards
```
1.  ◆      宀 — roof radical (moved from Basic, where it was misplaced)
2.  戸     door (single-pane pictograph)
3.  門     gate (paired-doors pictograph)
4.  開     open
5.  ★閉    close                         (pair to 開)
6.  窓     window
7.  床     floor
8.  天井   ceiling (compound — kept as common vocab)
9.  棚     shelf
10. 本棚   bookshelf (compound — kept as common vocab)
```
Drops from current `rooms`: 閤 (rare); 出 → Verbs (it's a motion verb, not an interior feature).

### 3.13 — `food-drink` (食) · 10 cards · **NEW**
Absorbs the stubs `drinks` (茶) and `food` (御飯).
```
1.  ★米    rice grain (pictograph)
2.  ★飯    cooked rice
3.  ◆      飠 — food/eat radical (NEW)
4.  ★食    eat
5.  ★飲    drink = 飠 + 欠                seeAlso:[食]
6.  茶     tea                           (existing; cross-listed in Colors)
7.  ★酒    alcohol = 氵 + 酉
8.  ★肉    meat (pictograph)
9.  ★卵    egg                           (N4 exception)
10. 御飯   meal                          (existing compound, moved from food stub)
```

### 3.14 — `verbs` (動詞) · 15 cards · **NEW**
Action kanji that don't already live in a thematic class.
```
1.  ★行    go
2.  ★来    come                          (moved from Time)
3.  ★出    exit                          (moved from Rooms)
4.  ★立    stand                         (moved from Basic)
5.  ★聞    hear = 門 + 耳                  seeAlso:[耳,門]
6.  ★買    buy = 罒 + 貝                   seeAlso:[貝]
7.  ★売    sell                           seeAlso:[買]
8.  ★知    know = 矢 + 口
9.  ★思    think = 田 + 心                 seeAlso:[心,田]
10. ★待    wait = 彳 + 寺
11. ★帰    return (home)
12. ★切    cut = 七 + 刀                   (seeAlso:[刀] — 刀 dropped from Basic but referenced here)
13. ★走    run
14. ★働    work                           (N4 exception, very common)
15. ★忙    busy = 忄 + 亡                  (N4 exception, useful pair to 働)
```
Does not duplicate: 食/飲 (in Food & Drink) · 見 (in Body) · 言/話/読/書 (in School) · 開/閉 (in Rooms) · 入 (in People).

### 3.15 — `adjectives` (形容詞) · 10 cards · **NEW**
*Does not duplicate 大 / 小 (in Basic) or 早 / 遅 (in Time).*
```
1.  ★高    tall / expensive
2.  ★安    cheap / safe
3.  ★多    many
4.  ★少    few
5.  ★古    old
6.  ★新    new
7.  ★長    long
8.  ★短    short                         (N4 exception)
9.  ★強    strong                        (N4 exception)
10. ★弱    weak                          (N4 exception)
```

### 3.16 — `onomatopoeia` (擬音) · 11 cards · UNTOUCHED
The existing 11 sound-word cards (にこにこ、ぽよぽよ、ちくちく、ふにゃふにゃ、くすくす、にゃーにゃー、ワンワン、ぴたり、ぴょんぴょん、ぽたぽた、コロコロ) stay as-is. Kana-only, no radical prerequisites.

---

## 4. Card-shape policies

### 4.1 — Radical-interlude cards (`type: 'radical'`)
A radical gets its own card when **all three** are true:
1. It appears in 2+ kanji in the deck
2. Its visual form differs from any standalone kanji already taught
3. The compound kanji's structure is non-obvious without it

**Seven radical interludes confirmed:**
- `亻` (left-side person) — People · *existing*
- `ナ・ヨ + 又` (two-hands) — People · *existing*
- `扌` (left-side hand) — Body · **NEW**
- `言` (left-side speech) — School · **NEW**
- `飠` (food/eat) — Food & Drink · **NEW**
- `宀` (roof) — Rooms · **NEW** (relocated from Basic where it was misfit)
- `艹` (grass) — *inline* on 茶's card; does not earn its own interlude (under-threshold)

### 4.2 — `seeAlso` chips
- `seeAlso: ['kanji', 'kanji']` lists kanji from **other classes** the learner needs to know first
- Renders on the card's back face as clickable cross-references (existing UI behavior)
- Asymmetric — only list dependencies, not dependents
- Every `seeAlso` target must exist somewhere else in the deck (validated in §6)

### 4.3 — Compound cards (multi-glyph `kanji` value)
- **Keep** as standalone cards: 元気, 御飯 (high-frequency vocab learners say more often than the parts)
- **Demote** to `usage:{ja:'...', kana:'...'}` on the parent kanji: 姉妹 (→ 姉's `usage`), 兄弟 (→ 兄's), 黄色 (→ 黄's), 今日 / 今週 / 今月 / 今年 / 去年 / 来年 / 先生 (→ 今's, 先's, 来's `usage` fields)
- **Drop** entirely: 灰色, 水色 (vocab page material, not kanji-card material)

### 4.4 — Back-face stroke order rule
The back face's stroke-order panel renders based on which **kanji glyphs** (CJK Unified Ideographs) appear in `card.kanji`. Logic:

| `card.kanji` shape | Behavior |
|---|---|
| Pure kana (にこにこ, ピンク, ぴたり) | Skip the stroke-order section entirely. The flip-back still shows the glyph/readings/meaning header, just no stroke panel. |
| Single kanji (人, 食, 茶) | Existing behavior — one stroke panel for that kanji from `images/stroke/<k>-order.{svg,gif}`. |
| Multi-kanji compound (元気, 御飯, 昨日, 烏賊, 天井) | Render one stroke panel **per kanji**, side by side. Each panel sized to fit half/third of the stroke-order area. The label under each panel shows just that kanji glyph. |
| Mixed kanji + kana (赤ちゃん, お母さん, 双子 if kept) | Show stroke panels only for the kanji characters in order. Skip the kana entirely. |

**Renderer change (small)**, in `editorialFlashcardHTML` (`app.html ~line 15254`):

```js
// Extract kanji-only chars from card.kanji
const kanjiChars = [...(card.kanji || '')].filter(c => {
  const code = c.codePointAt(0);
  return (code >= 0x4E00 && code <= 0x9FFF)   // CJK Unified Ideographs
      || (code >= 0x3400 && code <= 0x4DBF);  // Extension A (rare but legal)
});

// 0 chars → don't render stroke section at all
// 1 char → existing single-panel render
// 2+ chars → render N panels side by side
```

Layout for 2+ panels: a thin horizontal flex row inside the existing `.testcard-back-stroke` container, equal-width children. No new CSS class needed — just `display:flex; gap:12px;` on the container when multi.

### 4.5 — Audit (retroactive)
After the curriculum redesign settles, the cards needing the new behavior:

**Skip stroke order (kana-only):** all 11 Onomatopoeia cards (にこにこ・ぽよぽよ・ちくちく・ふにゃふにゃ・くすくす・にゃーにゃー・ワンワン・ぴたり・ぴょんぴょん・ぽたぽた・コロコロ).

**Multi-kanji panels:** 元気 (Nature), 御飯 (Food & Drink), 天井 (Rooms), 本棚 (Rooms), 烏賊 (Animals). If any of the demoted compound cards (姉妹, 兄弟, 黄色, 今日…) are accidentally kept post-redesign, they fall into this bucket too — the audit catches them.

**Mixed kanji + kana:** unlikely after the redesign (赤ちゃん and 双子 demoted to `usage` chips). If any remain, the renderer auto-handles them — no per-card config needed.

---

## 5. Build mechanics & rollout

Pure data change in `nihongo/data.js`. No new schema fields. Renderer unchanged.

**Four batches in four commits.** Each batch independently safe to ship; old classes keep working until rewritten.

| Batch | What lands | Blast radius |
|---|---|---|
| **1. Cleanup** | Drop stub classes (`drinks`, `food`, `concepts`, `people2`, `body2`). Move their cards into their new homes. Fold duplicate compound cards (姉妹, 兄弟, 黄色 etc.) into `usage` fields on parents. | Pure deletion + relocation. No new content. |
| **2. Reshape existing** | Reorder + retitle existing classes per §3.1–3.12. Move 王/生/国 to Places. Add `seeAlso` chips. Rename `nature2` → `sky-seasons`, `directions` → `places`. | Touches existing cards only. |
| **3. Add ★ new kanji** | All ~35 new cards. Verbs, Adjectives, Food & Drink classes created. New cards added to Time, Places, Body. | All-new content. No regression risk on existing cards. |
| **4. Radical interludes** | Four NEW ◆ radical cards: 扌 (Body), 言 (School), 飠 (Food & Drink), 宀 (Rooms — relocated). | Smallest batch. Final polish. |

---

## 6. Verification

After each batch:

**Programmatic (Node):**
```js
// scripts/validate-flashcard-curriculum.mjs
// Walks window.FLASHCARD_CLASSES and asserts:
//   - per-class card count is in [9, 22]
//   - every card has {id, kanji, en}; non-radical cards also need readings
//   - every seeAlso target appears somewhere in the deck (no broken refs)
//   - no duplicate id within a class
//   - every kanji glyph appears in at most one flashcard (cross-class
//     dups are accidental except for the small documented set:
//     茶, 本, 魚, 半 — these are intentionally cross-listed)
```

**Live preview:**
- Open flashcards, walk each class via the sidebar
- Confirm card counts match §2 inventory
- Confirm back-face `seeAlso` chips render and link to valid cards
- Spot-check 3–5 cards per class for kanji + readings + examples + stroke order
- No console errors

---

## 7. Out of scope

- Stroke-order GIF/SVG downloads for new kanji — the existing `scripts/download-stroke-gifs.mjs --jouyou` already covers all jouyou kanji; new cards should resolve their stroke art automatically
- Image generation for new cards — image-slot picks up `images/kanji/<kanji>.webp` whenever a file lands; design ships text-only
- Code changes to the renderer — `renderFlashcards` already handles every field used
- Runtime prerequisite gating (lock-screen on cards) — current author-time ordering is sufficient
- A `vocab` redesign for the dropped compound cards (灰色, 水色, 小鳥, etc.) — they're noted as future vocab-page material; not in this spec
