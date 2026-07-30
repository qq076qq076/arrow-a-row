# Arrow a Row：遊戲開發規格書

版本：0.2｜2026-07-28｜目標平台：iOS／Android（手機優先）；PC 為可選延伸｜用途：供企劃、工程、美術、QA 實作一款玩法取向相近、但內容與資產完全原創的單人 Roguelite 自動跑酷射擊遊戲。

> 工作區未提供原始碼、執行檔、素材或設計稿。本文件根據公開資料逆向整理；「參考確認」是公開資料可支持的行為，「建議值」是為了可直接開發而提出的規格，不代表原作精確數據。不得複製原作名稱、角色、UI、美術、音樂、文字、關卡或程式碼。

## 1. 產品定義

### 1.1 核心提案

玩家單手拖曳控制左右走位。角色自動往前、自動向前射擊；玩家在左右岔路中選擇強化或戰鬥，從隨機能力組成 Build，擊敗多段首領。死亡後以本局取得的金幣購買永久升級，再次挑戰更遠距離／更高分數。每局核心流程應控制在 4–8 分鐘，適合碎片化手機遊玩。

### 1.2 參考確認

| 項目 | 已確認行為 |
| --- | --- |
| 平台模式 | Steam 參考版本是免費單人 PC 遊戲，2023-08-20 發布。 |
| 操作 | 除選單外只需左／右操作；角色會自動奔跑與射箭。 |
| 循環 | 選擇 power-up、戰鬥、挑戰 Boss；擊敗 Boss 可通關，亦可繼續刷新分數。 |
| 輔助戰力 | 寵物與飛劍會協助戰鬥；飛劍是有冷卻的索敵投射物。 |
| 局外進度 | 用金幣買永久升級；局內至少選過一次的能力才會解鎖到商店。 |
| 首領獎勵 | 擊殺 Boss 後從 3 個獎勵選 1，可花金幣重擲候選。 |

來源：[Steam 商店頁](https://store.steampowered.com/app/2495980/_Arrow_a_Row/)、[Steam 社群操作說明](https://steamcommunity.com/app/2495980/discussions/0/4345480979784713736/)、[商店資料](https://arrow-a-row.fandom.com/wiki/Store)。原參考為 PC；以下平台規格是本專案的手機化設計，不是原作宣稱。

### 1.3 設計支柱

1. 一眼可讀：玩家在 1–2 秒能判斷左右兩路的利益與風險。
2. 低輸入、高深度：操作極簡，但弓箭、飛劍、寵物、生存能力能形成有辨識度的 Build。
3. 受控隨機：選項有權重、保底、互斥與重擲，不能因壞 RNG 無法遊玩。
4. 即時爽感：每個升級必須在箭列、攻速、傷害數字、召喚物或生存條上立即可感。

### 1.4 平台範圍與商業原則

- 首發支援 iOS 15+ 與 Android 10+，直式操作為主；橫式與平板為同一內容的自適應佈局，非獨立玩法。
- 遊戲核心必須可離線遊玩；登入、雲端備份、廣告或內購均不得阻斷首次遊玩、核心戰鬥或死亡後結算。
- MVP 採「免費下載、無強制廣告」；若日後導入激勵式廣告或內購，只能提供可選加速／外觀，不能販售戰鬥數值、不能以廣告取代正常結算獎勵。
- 金幣、永久升級、成就與雲端帳號如有同步，後端為權威資料；離線變更須以可審計交易佇列合併。

### 1.5 非目標

- MVP 不做手動瞄準、跳躍、近戰連段、PvP、開放世界、裝備背包與付費轉蛋。
- 驗收目標是「原創且同類型的完整體驗」，不是精準複製參考作品。

## 2. 遊戲流程

```text
啟動 → 主選單／商店 → 新局 → 首局教學
  → 自動前進 + 左右走位 + 自動射擊
  → 岔路（增益／事件／戰鬥）→ 小怪／精英 → Boss
  → 三選一 Boss 獎勵（可重擲）→ 下一章
  → 最終 Boss 勝利，或 HP 歸零死亡
  → 結算（分數、金幣、解鎖）→ 商店／再來一局
```

### 2.1 Run 狀態機

| 狀態 | 進入條件 | 允許輸入 | 離開條件 |
| --- | --- | --- | --- |
| `LoadingRun` | 開始新局 | 無 | 所有資料與場景就緒。 |
| `Intro` | 首局／章節開場 | 跳過 | 開場結束。 |
| `Traverse` | 一般路段 | 左右移動 | 門、戰鬥或 Boss 觸發。 |
| `ChoiceLock` | 玩家進入選擇門 | 無，0.15 秒防抖 | 效果套用完成。 |
| `Encounter` | 敵群／精英出現 | 左右移動 | 敵人全滅。 |
| `Boss` | 到達首領區 | 左右移動 | Boss 或玩家死亡。 |
| `Reward` | Boss 死亡 | 選擇／重擲 | 確認獎勵。 |
| `Paused` | 暫停 | 選單 | 繼續／離開。 |
| `Death` / `Victory` | HP=0／最終 Boss 死亡 | 結算操作 | 資料寫入且返回選單。 |

唯一的 `RunStateMachine` 可切換狀態。UI、輸入、生成器、時間縮放均訂閱它；禁止任何子系統自行結算或切場景。

### 2.2 首局教學（建議）

| 時段 | 強制內容 | 成功條件 |
| --- | --- | --- |
| 0–5 秒 | 空路段：「左右移動」 | 任一方向移動 0.5 秒。 |
| 5–12 秒 | 兩個無害增益門：「穿過想選的門」 | 穿越一門。 |
| 12–25 秒 | 3 個慢速近戰敵人：「箭會自動攻擊」 | 擊殺 1 個。 |
| 25–40 秒 | 一個有預警的投射物 | 通過戰鬥。 |
| 40–55 秒 | 小型 Boss、三選一獎勵 | 選擇一張卡。 |

教學只顯示一次但可於設定重看；其 RNG 固定，保證體驗到箭數、傷害、攻速三種直接增益。

## 3. 操作與空間模型

### 3.1 輸入

| 裝置 | 對應 |
| --- | --- |
| 觸控（主要） | 手指在螢幕任意非 UI 區域水平拖曳；角色追隨觸點 X，抬手後煞停。不可要求雙手。 |
| 觸控備援 | 左右半屏按住模式，可於設定切換；避免部分玩家拖曳時手指遮住角色。 |
| 鍵盤（PC） | `A`/`←` 左移，`D`/`→` 右移；同時按下停止。 |
| 手把（PC） | 左類比 X 軸／D-pad，dead zone 0.15。 |

觸控細則：UI 元件優先攔截觸控；手指起點在安全區／HUD 上不得啟動角色移動；以 `targetX = clamp(worldX(touchX), minX, maxX)` 追隨，最大追隨速度使用 `moveSpeed`。手指、角色、危險彈體的最小視覺距離至少 1.2 個角色寬，避免手指遮擋造成不可反應傷害。

### 3.2 世界與鏡頭（建議值）

- 採 XZ 平面：X 為躲避、Z 為前進，Y 僅供模型高度與拋物線。
- 玩家固定在 `z=0`，世界向負 Z 捲動；可避免長時間 run 的浮點誤差。
- 可行走範圍 `x = -5…5m`；角色半徑 0.35m；移速 7m/s；加減速 35m/s²。
- 高俯角第三人稱固定鏡頭，直式為 9:16 設計基準；必須同時看見兩路與至少 2.5 秒前方預告。
- 支援 16:9、18:9、19.5:9、20:9 直式比例；橫式／平板採擴張背景與 HUD 重排，不能裁掉岔路。
- 以裝置 safe area 佈局。瀏海、挖孔、圓角與 Android 手勢列不得承載可點選按鈕、HP 或 Gate 關鍵文字。

### 3.3 碰撞規則

| 物件 | 碰撞對象 | 結果 |
| --- | --- | --- |
| Player | 敵彈、敵體、門、拾取物、邊界 | 傷害／選擇／拾取／限制位置。 |
| PlayerProjectile | 敵人、Boss、可破壞物 | 傷害、穿透扣次數。 |
| AllyProjectile | 敵人、Boss | 與玩家箭同邏輯，不傷害玩家。 |
| Gate | Player | 同選擇組僅第一個有效門觸發。 |

## 4. 戰鬥機制

### 4.1 屬性模型

所有數值存於內容資料，不硬編碼；內部用 `float`、UI 依規則顯示。屬性變更後送出 `StatsChanged`，避免 HUD 或發射器快取舊值。

| 屬性 | 建議初值 | 目的 |
| --- | ---: | --- |
| `maxHp` / `hp` | 100 / 100 | 死亡與生存。參考商店也列基礎 HP 100。 |
| `baseDamage` | 0.267 | 箭傷；目前實作使用 `0.8 / 3`。 |
| `attackInterval` | 0.45 秒 | 弓箭自動射擊間隔；實際攻速為 `1 / interval`。 |
| `projectileCount` | 0 | 每次發射的箭數；第一個 Gate 固定提供 `+1 箭矢`。 |
| `lightningTargetCount` | 2 | 自動電擊初始鎖定目標數；第一個 Gate 可選 `+1`。 |
| `cannonUnlocked` | false | 取得火砲 Buff 後啟用範圍砲擊。 |
| `cannonInterval` | 1.6 秒 | 火砲獨立發射間隔，初始慢於弓箭。 |
| `spreadDeg` | 12° | 多箭對稱散布。 |
| `range` / `projectileSpeed` | 22m / 24m/s | 箭的有效距離與飛行感。 |
| `critChance` / `critMult` | 0% / 2.0 | 暴擊率限制 0–80%。 |
| `pierce` | 0 | 額外命中數。 |
| `damageReduction` / `lifeSteal` | 0% / 0% | 減傷上限 70%；吸血以實際傷害算。 |
| `moveSpeed` | 7m/s | 只影響橫移。 |

### 4.2 自動射擊

1. 每 `attackInterval` 建立一次發射事件；在暫停、獎勵、死亡時停止。
2. 優先選取前方 120° 視錐內最近的存活目標；距離相同時 Boss 優先，然後威脅值高者。
3. 無目標時仍向世界前方射擊，維持操作回饋。
4. 多箭從目標方向平均對稱散開；單箭無散布。
5. 投射物必須 object pool 化，禁止每支箭 Instantiate/Destroy。

### 4.3 傷害公式（建議）

```text
rawDamage    = baseDamage × (1 + additiveDamagePct) × product(moreMultipliers)
isCritical   = random01 < critChance
dealtDamage  = rawDamage × (isCritical ? critMult : 1) × target.damageTakenMultiplier
actualDamage = min(dealtDamage, target.hp)
heal         = min(actualDamage × lifeSteal, 15)
incoming     = max(1, floor(enemyDamage × (1 - damageReduction)))
```

- 預設沒有傷害浮動；如需要，最多 ±5%。
- 每一投射物對同一目標只命中一次，用 `hitTargetIds` 阻止多 collider 重算。
- Boss 無敵轉場命中顯示免疫，不消耗穿透。

### 4.4 敵人與公平性

| 類型 | 行為 | MVP |
| --- | --- | --- |
| 近戰跑者 | 向玩家接近，接觸傷害 | 是 |
| 遠程射手 | 停止、預警、發射直線彈 | 是 |
| 蛇行飛行者 | X 軸正弦移動、間隔射擊 | 是 |
| 精英 | 標準敵人 + 高 HP／加速／召喚 modifier | 是 |
| 盾牌敵人 | 前方減傷，要求替代解法 | MVP+ |

敵人攻擊必須在命中前至少 0.35 秒預警；畫面外敵人不得發射可命中的彈體；彈體進入可視範圍前應保留 0.45 秒反應時間。

### 4.5 Boss

- MVP 三章、每章一隻 Boss；第三隻為最終 Boss。參考資料提及五段 stage，可在正式內容擴充。
- 2–3 phase（例如 70%／35% HP），轉場停火 0.8 秒並明確提示。
- 每隻至少三招、可背誦的固定循環：移位 → 預警射擊 → 召喚／彈幕 → 空檔。
- Boss 死亡立即清除敵彈，播放 0.5–1 秒擊殺回饋後才開獎勵。

## 5. 路徑、事件與隨機

### 5.1 路段組成

每章由 `Segment[]` 構成。第一版以手工模板和受控抽樣製作，不必建完全程序化關卡。

| 節點 | 每章建議量 | 功能 |
| --- | ---: | --- |
| Safe | 1 | 讓玩家調整位置與讀取前方。 |
| Choice | 4–6 | 左右二選一：純增益、風險換收益、戰鬥。 |
| Combat | 3–5 | 一波敵人或短時間生存。 |
| Elite | 1 | 高壓戰鬥，保證高價值獎勵。 |
| Boss | 1 | 章節結束、三選一。 |

### 5.2 Gate 規格

同一 `ChoiceGroup` 的左右門 Z 座標相同、門寬至少 2.2m、門中心距至少 2.0m。進入後：

1. 鎖定選擇、寫入 `choiceId`、播放選中效果。
2. 另一路立即失效。
3. 即時增益立刻套用；戰鬥門切至 `Encounter`。
4. 不可倒退重選。重疊碰撞時門中心較近者勝出；完全相同時固定選左門，確保可測。

### 5.3 選項池規則

| 規則 | 實作要求 |
| --- | --- |
| 同組排重 | 同一能力不可出現兩次；排除語意相反且數值誤導的組合。 |
| 首局保底 | 第一章前三次至少各出一次直接輸出、一次生存／閃避空間；不出純負面。 |
| 適配權重 | 箭數 ≥4 時降低再出箭數權重，提高傷害／攻速／穿透；HP <35% 時提高治療、護盾、減傷。 |
| 風險可讀 | 戰鬥門顯示敵人等級、獎勵稀有度、預估威脅。 |
| 稀有保底 | 連續 6 個選項無 Rare，下次至少一張 Rare。 |
| 可重現 | 保存 seed、內容版本和每次抽樣；同 seed + 同選擇必得相同結果。 |

### 5.4 RNG

- 使用獨立 deterministic PRNG（如 PCG32），不可使用引擎全域亂數。
- 分 `routeRng`、`rewardRng`、`combatRng`、`cosmeticRng`；視覺亂數不能影響結果。
- 抽取前先過濾不相容內容，再依稀有度加權；抽完更新 pity counter。
- Debug 版可輸入 seed、顯示下一組選項、強制指定獎勵。

## 6. Build、獎勵與經濟

### 6.1 能力分類

| 類別 | 代表能力 | 視覺回饋 |
| --- | --- | --- |
| 弓箭 | 箭數、傷害、攻速、射程、彈速、穿透、暴擊 | 箭列、軌跡、傷害數字。 |
| 生存 | 最大 HP、治療、護盾、減傷、吸血 | HP 條、護盾環。 |
| 飛劍 | 飛劍數、冷卻、傷害、索敵數、環繞 | 繞身、飛出、命中。 |
| 寵物 | 解鎖／升星、攻擊頻率、彈體 | 跟隨並自動攻擊。 |
| 全域 | 金幣、重擲券、轉換效果 | HUD 圖示和短說明。 |

每張能力資料必含：`id`、本地化名、說明、稀有度、類別、最大層數、前置條件、數值曲線、互斥群組、圖示、VFX/SFX、商店解鎖資格。

### 6.2 Boss 三選一

- 擊殺 Boss 產生三張不同卡；暫停 simulation 和發射。
- 卡面顯示目前 → 取得後層數與關鍵數值，例如「飛劍 CD：2.0 → 1.5 秒」。
- 重擲花局外金幣；建議費用 `2, 4, 6…`，每章重置。公開社群說明首抽可為 2 金幣。
- 重擲不可回看舊卡，且保留稀有度保底。
- 選定後寫入 `RewardSelected`，播放套用動畫才載入下一段。

### 6.3 局外商店

參考商店可確認基礎永久項目含生命、箭傷、箭頻率、飛劍數、騎劍加速；公開表列 HP 初始 100、箭傷／箭頻率／飛劍各初始 1，前三者有三個額外等級。表列 HP 每級 8 金、箭傷／頻率／飛劍每級 10 金、騎劍 20 金。以下是可平衡調整的建議值：

| 商品 | 效果 | 建議成本 | 解鎖 |
| --- | --- | ---: | --- |
| 最大生命 | +25／級，最多 4 級 | 8,12,18,28 | 預設 |
| 箭傷 | +1／級，最多 4 級 | 10,15,22,32 | 預設 |
| 攻速 | 間隔 ×0.92／級，最多 4 級 | 10,15,22,32 | 預設 |
| 初始飛劍 | +1，最多 3 級 | 12,18,28 | 局內發現飛劍 |
| 騎劍起跑 | 開局橫移速 +15% | 20 | 局內發現騎劍 |
| 暴擊 | +5%／級，最多 2 級 | 18,30 | 局內發現暴擊 |

`GoldEarned = floor(chapterReached×2 + bossesDefeated×4 + elitesDefeated + score/500)` 為建議起點。購買要先確認餘額，成功後原子扣款與存檔；失敗不得有負金或幽靈等級。

## 7. 數值建模與平衡

```text
chapterScale(c) = 1.55 ^ (c - 1)
enemyHp = baseHp × chapterScale(c) × (1 + 0.08 × encounterIndex)
enemyDamage = baseDamage × (1.25 ^ (c - 1))
bossHp = 28 × (1.85 ^ (c - 1)) × (1 + 0.12 × bossIndex)
expectedArrowDps = projectileCount / attackInterval × baseDamage
  × (1 + additiveDamagePct) × product(moreMultipliers)
  × (1 + critChance × (critMult - 1))
effectiveDps = expectedArrowDps × hitRate + allyDps
timeToKill = enemyHp / effectiveDps
```

校準目標：普通敵人 TTK 0.5–2 秒、精英 4–8 秒、Boss phase 20–45 秒。新玩家首局看到第一 Boss 的比例 60–75%，首局擊敗它的比例 30–45%；完成約 8–12 局與合理永久投資後，最終 Boss 勝率約 50%。這是 playtest KPI，不是保證值。

防止組合爆炸：傷害／攻速同類使用加法桶；僅特色能力採乘法。箭數上限 12、發射間隔下限 0.12 秒、飛劍上限 10、敵對彈體上限 120。每個新能力須進行 10,000 局 bot simulation，檢查勝率、平均 DPS、選取率、共現率與最大彈量。

## 8. 資料模型、存檔與遙測

```ts
type RunState = 'LoadingRun'|'Intro'|'Traverse'|'ChoiceLock'|'Encounter'|
  'Boss'|'Reward'|'Paused'|'Death'|'Victory';
interface PlayerStats { maxHp:number; hp:number; baseDamage:number; attackInterval:number;
  projectileCount:number; spreadDeg:number; range:number; projectileSpeed:number;
  critChance:number; critMult:number; pierce:number; damageReduction:number;
  lifeSteal:number; moveSpeed:number; }
interface Modifier { id:string; stacks:number; source:'gate'|'reward'|'meta'; }
interface RunSave { schemaVersion:number; contentVersion:string; seed:number; state:RunState;
  chapter:number; score:number; goldEarned:number; stats:PlayerStats; modifiers:Modifier[];
  choices:string[]; rngState:string; }
interface ProfileSave { schemaVersion:number; gold:number; purchasedUpgrades:Record<string,number>;
  discoveredAbilities:string[]; settings:Settings; lifetimeStats:LifetimeStats; }
```

- Profile 與 Run 分檔；商店購買、過門、擊殺 Boss、死亡／勝利時寫 checkpoint。
- 用 `schemaVersion` migration；讀取失敗先備份壞檔，回到安全可啟動 Profile，不可靜默清空。
- 單機採 JSON + checksum；中斷恢復時不得重抽未完成獎勵。
- 戰鬥規則不依賴 UI 或場景物件，能 headless unit test。`CombatResolver` 是唯一傷害入口。

每個遙測事件帶 `run_id`、`seed`、`content_version`、`chapter`、`elapsed_seconds`，不含個資：

| 事件 | 額外欄位 | 目的 |
| --- | --- | --- |
| `run_started` | meta levels、tutorial flag | 首局與留存。 |
| `gate_presented/chosen` | 左右 option ID、HP、反應時間 | 選項分布、可讀性。 |
| `enemy_killed` | enemy ID、damage source | Build 產出。 |
| `boss_started/defeated` | boss ID、時間 | 難度斷點。 |
| `reward_rerolled/selected` | cards、cost、次數 | 重擲經濟。 |
| `run_ended` | outcome、score、gold、death cause | 漏斗與平衡。 |
| `shop_purchase` | item、level、cost、balance | 局外節奏。 |

## 9. UI、可近用性、內容量

### 9.1 HUD

- 左上：HP／Max HP、護盾；低 HP 以形狀／脈動加色彩提示。
- 上方：章節與進度，Boss 時才顯示 Boss HP。
- 右上：分數與金幣，變化顯示 `+N`。
- 下方：弓、飛劍、寵物等關鍵能力圖示與層數；Tab／手把鍵開完整 Build。
- 門的文字要有實色底與圖示，任何特效不可遮蔽名稱、數值、稀有度。

### 9.2 必備設定

主／音樂／效果音量、解析度／全螢幕、語言、震動、鏡頭震動、色弱高對比門色、字幕與傷害數字、重綁按鍵。暫停時完全停止 simulation；只用鍵盤也可完成所有選單。

### 9.3 MVP 內容下限

| 類別 | 最低量 |
| --- | ---: |
| 主題章節／Boss | 3 / 3（每 Boss 2 phase、3 招） |
| 普通敵人／精英 modifier | 4 / 3 |
| 一般能力／Boss 獎勵 | 24 / 12 |
| 路段模板／永久升級 | 18 / 6 |
| 成就 | 12 |

## 10. 驗收標準

### 10.1 P0 功能

| ID | 驗收條件 |
| --- | --- |
| AC-01 | 新檔可開始、完成首局教學；連續 10 次冷啟動無阻斷。 |
| AC-02 | 鍵盤／手把移動一致，玩家不可離開邊界；60/120 FPS 同輸入位置誤差 <0.1m。 |
| AC-03 | 自動索敵與射擊正確；發射間隔誤差 ±1 frame。 |
| AC-04 | 每個 ChoiceGroup 恰有一筆選擇，斜穿／重疊觸發不可套用兩次。 |
| AC-05 | 暴擊、穿透、吸血、減傷、死亡均經單一傷害公式；有正常、上限、同幀多命中單測。 |
| AC-06 | HP=0 僅進 Death 一次，之後不掉落、不加分、不開獎勵；壓測 1,000 次無雙重結算。 |
| AC-07 | Boss 三選一可選、可按成本重擲；不重複、不負金。 |
| AC-08 | 商店扣款正確、金幣不足不可買、重啟仍保留；寫檔失敗不產生幽靈升級。 |
| AC-09 | checkpoint 恢復後 seed／HP／選項／RNG 結果不變；同 seed 同選擇 checksum 相同。 |
| AC-10 | 最終 Boss 顯示勝利結算；若提供無盡模式，流程與難度提升清楚可驗。 |

### 10.2 P1 體驗、平衡、技術

| ID | 標準／測法 |
| --- | --- |
| UX-01 | 5 位未接觸測試者中至少 4 位在 10 秒內完成移動與首次過門。 |
| UX-02 | 正常遊玩距離可辨識門名稱、正負效果、稀有度；1080p 和 150% UI 均不截字。 |
| UX-03 | QA 逐招錄影確認無不可避免傷害，所有敵攻均有規定預警。 |
| BAL-01 | 首局與最終 Boss 勝率符合第 7 節 KPI，以 30 人或 1,000 bot run 驗證。 |
| BAL-02 | 弓箭、飛劍、召喚三種 Build 各 20 次受控 run 的勝率差 ≤15 個百分點。 |
| PERF-01 | 目標手機在 720×1600、60 FPS 模式、120 敵彈時 P95 frame time <16.7ms；30 FPS 省電模式 P95 <33.3ms；100 局 bot run 無 crash、soft lock、記憶體線性成長。 |
| MOB-01 | 觸控拖曳、按住模式、瀏海／手勢安全區與前後台恢復均能完成完整 Run。 |
| ACC-01 | 離線可完整遊玩；不經同意不送遙測；觸控可完成所有遊戲與選單流程，PC 版則純鍵盤可完成。 |

## 11. QA 測試矩陣

| 面向 | 必測邊界情境 |
| --- | --- |
| 走位 | 邊界長按、左右同按、失焦、低／高 FPS、手把 drift。 |
| 門 | 同幀雙門、過門瞬間死亡／暫停、尚未生成完成、重開事件重疊。 |
| 戰鬥 | 多箭穿透同目標、DOT／召喚同幀擊殺、Boss 無敵轉場、物件池耗盡。 |
| 獎勵 | 全能力滿層、互斥卡、重擲至金幣不足、UI 關閉／改解析度。 |
| 存檔 | 購買時強制中斷、壞 JSON、舊 schema、Reward 狀態 checkpoint。 |
| RNG | 10,000 seed 分布、首局保底、pity、同 seed replay、視覺 RNG 隔離。 |
| 在地化 | 繁中／英文長字串、數字格式、字型 fallback。 |

## 12. 里程碑與風險

| 階段 | 完成定義 |
| --- | --- |
| M0 Pre-production | 本文件、技術選型、灰盒與平衡假設核准。 |
| M1 Playable core | 一條路、橫移、自動箭、1 敵人、1 門、死亡／重開可玩。 |
| M2 Roguelite loop | 三章灰盒、Boss、獎勵、永久升級、存檔、seed replay 完成。 |
| M3 Content complete | MVP 內容、美術、音效、文案接入。 |
| M4 Balance & QA | P0 全過，平衡 KPI、可近用性、效能達標。 |
| M5 Release | 商店素材、隱私、崩潰監控、回歸測試完成。 |

| 風險 | 處置 |
| --- | --- |
| 未能操作參考版本 | 本文件以原創相似玩法為界；若取得合法測試權，再做錄影逐幀差異表。 |
| 彈幕效能 | object pool、空間分割、固定彈體上限、特效降級。 |
| 隨機壞局 | 保底、適配權重、重擲、seed replay、遙測監控。 |
| IP／商業風險 | 世界觀、名稱、素材、怪物、文本、數值均原創；發行前法務審查。 |

## 附錄：能力資料範例（建議值）

| id | 類別 | 效果 | 稀有度 | 最大層 |
| --- | --- | --- | --- | ---: |
| `arrow_count` | 弓箭 | 箭數 +1 | Common | 8 |
| `arrow_damage` | 弓箭 | 傷害 +25% | Common | 8 |
| `rapid_fire` | 弓箭 | 間隔 ×0.88 | Rare | 6 |
| `piercing_tip` | 弓箭 | 穿透 +1 | Rare | 4 |
| `critical_eye` | 弓箭 | 暴擊 +12% | Rare | 5 |
| `iron_skin` | 生存 | 減傷 +8% | Rare | 5 |
| `field_mend` | 生存 | 立即治療 20 HP | Common | 1 |
| `vampiric_string` | 生存 | 吸血 +3% | Epic | 4 |
| `sword_orbit` | 飛劍 | 飛劍 +1 | Rare | 6 |
| `sword_haste` | 飛劍 | 冷卻 ×0.82 | Rare | 6 |
| `wolf_companion` | 寵物 | 每秒 4 傷害的寵物 | Epic | 1 |

## 附錄：手機技術、生命週期與營運規格

### 裝置級別與效能預算

| 級別 | 目標 | 預設畫質 | 重要限制 |
| --- | --- | --- | --- |
| Low | 3–4 年前中階 Android | 30 FPS、低特效 | 敵彈 60、動態陰影關、粒子 50%。 |
| Standard | 主流 Android／iPhone | 60 FPS、中畫質 | 敵彈 120、粒子 100%、簡化陰影。 |
| High | 近兩年旗艦／平板 | 60 FPS、高畫質 | 敵彈 160；不能以提高玩法上限製造不公平。 |

- 初始安裝包目標 ≤250 MB；首次可玩內容 ≤120 MB；後續章節資產採按需下載並有 Wi-Fi 提示。
- 戰鬥常駐記憶體目標：Low ≤350 MB、Standard ≤500 MB；進出 Run 3 次後記憶體增幅 <10%。
- 所有 VFX 提供低階替代方案。物件池、貼圖壓縮、音訊串流與 Addressable／按需資產載入為必做項。

### 前景／背景與中斷

| 事件 | 系統動作 | 玩家看到的結果 |
| --- | --- | --- |
| App 進背景、鎖屏、來電、通知遮罩 | 當幀停止 simulation，原子寫 Run checkpoint。 | 回前景開 R-03 暫停選單。 |
| OS 回收 App | 最近 checkpoint 可恢復；若正寫入則採雙檔／交易日誌回復。 | 主選單顯示 `繼續本局`。 |
| 網路中斷 | 核心流程繼續；同步事件排隊。 | 只在雲端／商店頁顯示非阻斷提示。 |
| 裝置旋轉 | 鎖定直式；使用者旋轉不重載 Run。 | 畫面維持直式，無數據遺失。 |
| 低電量／過熱 | 建議切 30 FPS／低特效，玩家可拒絕。 | 不改變數值、敵人數或 RNG。 |

### 手機專屬驗收

| ID | 驗收條件 |
| --- | --- |
| MOB-02 | iPhone 瀏海、Dynamic Island、Android 挖孔／手勢列裝置上，所有可點按元件與 Gate 文字均在 safe area 內。 |
| MOB-03 | 以單手拖曳完成第一章；5 名玩家中至少 4 名不需教學外協助。 |
| MOB-04 | Run 任一狀態切後台 30 秒、被系統回收、再開 App 後可恢復最近 checkpoint，無額外扣血、重抽或重複結算。 |
| MOB-05 | 無網路、飛航模式、網路切換下可開始、完成、結算與購買既有離線項目。 |
| MOB-06 | App Store / Google Play 的隱私、追蹤同意、年齡分級、資料刪除與內購復原流程在發行前由平台 checklist 驗證。 |
