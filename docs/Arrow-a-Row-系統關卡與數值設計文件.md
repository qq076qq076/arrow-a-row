# Arrow a Row：系統、關卡與數值設計文件

版本：0.2｜Owner：系統／關卡／數值設計師（未設專職時由 PM 指派）｜關聯：[遊戲規格](Arrow-a-Row-開發規格書.md)、[技術規範](Arrow-a-Row-技術設計與程式規範.md)、[第一章垂直切片內容表](Arrow-a-Row-第一章垂直切片內容表.md)

本文件是可量產遊戲內容的設計基線。所有數值是 MVP 起始值，必須集中於 JSON／CSV 內容資料表並經 Zod schema 驗證，不可硬編碼。任何改動均需提高 `contentVersion`、附 playtest 或 simulation 證據。

> M6 現行實作同步：目前程式的箭矢基礎傷害為 `0.8 / 3 ≈ 0.267`，開局箭數為 `0`；自動電擊為 `5 / 3 ≈ 1.667` 傷害／秒、初始 2 個鎖定目標、初始鎖定距離為 3。第一個 Gate 固定提供「+1 箭矢／火砲 +1／電擊目標 +1」左中右三選一；電擊會在敵人進入 3 單位鎖定距離後開始作用。第一個 Gate 以外的 Gate 與怪物掉落都從完整十六種 Buff 等機率抽取。另有慢速範圍火砲，可由 `cannon_weapon` 解鎖，並以 `cannon_damage`（傷害 +35%）、`cannon_radius`（爆炸範圍 +10%）與 `cannon_fire_rate`（射速 +25%）獨立強化。一般 Buff 的傷害加成也縮為原值三分之一。前 5／10 波只靠地面掉落 Buff，15 波完成後才提供 3 張不重複回響候選供玩家三選一，地面掉落 Buff 使用 Treasure Chest。小怪於道路最遠端 `z = 64` 生成；Boss 擊敗後須等小怪死亡或跑出玩家身後 `z < -2` 才進入結算。新增 `life_steal` Buff，初始吸血為 0%，依實際傷害比例回復生命。精確行為以 `src/domain/M1RunSimulation.ts`、`src/content/BuffCatalog.ts` 與 `src/rendering/ThreeRuntime.ts` 為準。

## 1. 設計目標與運行條件

| 項目 | 目標 |
| --- | --- |
| 單局長度 | 首局 4–6 分鐘；熟練玩家第一章 3–4 分鐘。 |
| 輸入 | 單手橫向拖曳；玩家不可手動瞄準／停下前進。 |
| 難度感受 | 路徑判斷清楚、躲彈可學、Build 成長可見；死亡能指出原因。 |
| 首局 KPI | 60–75% 到第一 Boss、30–45% 擊敗第一 Boss。 |
| Run 完整度 | MVP 三章可通關；通關後可選無盡模式。 |
| 內容原則 | 先確保弓箭／飛劍／夥伴三 Build 都可行，再新增變體。 |

## 2. 基礎規則與數值

### 2.1 玩家基礎屬性

| key | 初值 | 下限／上限 | 說明 |
| --- | ---: | --- | --- |
| `maxHp` | 100 | 1 / 500 | 生命上限。 |
| `baseDamage` | 0.267 | 0.1 / 999 | 每支箭基礎傷害；由原始 `0.8` 縮為三分之一。 |
| `lightningDamagePerSecond` | 1.667 | 0 / 999 | 自動電擊對單一目標的初始每秒傷害；由原始 `5` 縮為三分之一。 |
| `attackIntervalSeconds` | 0.65 | 0.12 / 5.0 | 每次自動射擊間隔。 |
| `projectileCount` | 0 | 0 / 12 | 每次發射箭數；第一個 Gate 取得 `split_arrow` 後才開始射箭。 |
| `lightningTargetCount` | 2 | 0 / 12 | 自動電擊的初始鎖定目標數；第一個 Gate 可再增加 1。 |
| `cannonUnlocked` | false | — | 取得 `cannon_weapon` 後啟用火砲。 |
| `cannonDamage` | 2.4 | 0 / 999 | 火砲每發範圍傷害。 |
| `cannonBlastRadius` | 2.4 | 0 / 999 | 火砲爆炸半徑；取得 `cannon_radius` 後每次完整 Buff 增加 10%。 |
| `cannonIntervalSeconds` | 1.6 | 0.35 / 5.0 | 火砲初始發射間隔，慢於弓箭。 |
| `spreadDegrees` | 0 | 0 / 40 | 多箭總散布角。 |
| `rangeMeters` | 22 | 5 / 60 | 箭射程。 |
| `projectileSpeedMps` | 24 | 8 / 60 | 箭速。 |
| `critChance01` | 0 | 0 / 0.8 | 暴擊率。 |
| `critMultiplier` | 2.0 | 1 / 5 | 暴擊倍率。 |
| `pierceCount` | 0 | 0 / 8 | 額外命中數。 |
| `damageReduction01` | 0 | 0 / 0.70 | 受到傷害減免。 |
| `lifeSteal01` | 0 | 0 / 0.25 | 依實際傷害回復 HP。 |
| `moveSpeedMps` | 7 | 4 / 11 | 橫移最大速度。 |

### 2.2 傷害、治療與射速

```text
finalDamage = baseDamage × (1 + additiveDamagePct)
            × product(moreDamageMultipliers)
            × (isCritical ? critMultiplier : 1)
actualDamage = min(finalDamage, targetCurrentHp)
healing = min(actualDamage × lifeSteal01, 15)
incomingDamage = max(1, floor(enemyDamage × (1 - damageReduction01)))
shotsPerSecond = 1 / attackIntervalSeconds
expectedArrowDps = projectileCount × shotsPerSecond × baseDamage
                   × (1 + additiveDamagePct)
                   × (1 + critChance01 × (critMultiplier - 1))
```

- `additiveDamagePct` 同類相加；`moreDamageMultipliers` 只供 Epic／特殊能力使用。
- 治療、HP 與傷害顯示取整，但 simulation 不提早取整。
- 直接治療溢出不轉為護盾；護盾僅由明確效果提供。
- 同一投射物不重複命中同一 target；Boss phase 無敵不消耗穿透。

## 3. Run、章節與路段模型

### 3.1 六章結構

| 章節 | 建議時長 | 一般 Gate | 戰鬥 | 精英 | Boss | 難度重點 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 晨線草原 | 3–4 分 | 5 | 3 | 1 | 1 | 教會移動、射擊、門、首領獎勵。 |
| 2 鏡潮高架 | 4–5 分 | 6 | 4 | 1 | 1 | 飛行敵、穿透、橫向預判。 |
| 3 熾心熔庭 | 4–6 分 | 6 | 4 | 2 | 1 | 密集預警、召喚與 Build 檢定。 |
| 4 霧冠林海 | 4–6 分 | 6 | 4 | 1 | 1 | 衝鋒、遮蔽與近遠輪替。 |
| 5 星圖遺庫 | 5–6 分 | 7 | 4 | 2 | 1 | 菁英 modifier 與窄安全縫。 |
| 6 裂光地平 | 5–7 分 | 7 | 5 | 2 | 1 | 全 Build 終局與三段 Boss。 |

每章的標準節奏：`5 波小怪 → 地面掉落 Buff` 重複三次，接著 `最終回響三選一 → Boss → Reward`。首局章 1 使用固定 sequence；其後每章可在波次模板池抽樣，但不可跳過第 15 波後的最終回響。

### 3.2 Segment 定義

| type | 長度／時間 | 目的 | 允許內容 |
| --- | --- | --- |
| `Safe` | 6–10 秒 | 閱讀、調整位置、預載 | 環境、金幣微粒，無命中傷害。 |
| `Choice` | 5–8 秒 | 左／中／右決策 | 一般 Gate 兩門，開場主武器 Gate 三門、明確數值／風險。 |
| `Combat` | 12–20 秒 | 輸出與走位 | 1–2 種敵人、可躲彈。 |
| `Elite` | 20–30 秒 | 壓力與保證回報 | 1 精英＋支援敵或小型波次。 |
| `Boss` | 45–75 秒 | Build 檢驗與章節高潮 | 2–3 phase、清楚空檔。 |

### 3.3 Gate 生成規則

每個一般 `ChoiceGroup` 有固定左／右 Gate；開場主武器 `ChoiceGroup` 額外提供中央 Gate。候選先經「相容性篩選」再經權重抽取，最後套用保底。

| 規則 | 數值／行為 |
| --- | --- |
| 門寬／間距 | 每門寬 ≥2.2m，中心距 ≥2.0m；至少 2.5 秒前可讀。 |
| 同組限制 | 不重複 ID；不出兩個完全相同效果；不出不可能選取的滿層項。 |
| 首局前 3 門 | 必含至少一個傷害／箭數／攻速選項與一個生存／安全選項。 |
| HP 安全權重 | HP <35% 時，`heal`／`maxHp`／`damageReduction` 權重 ×2。 |
| 箭數飽和 | `projectileCount >= 4` 時，`arrow_count` 權重 ×0.35。 |
| 稀有保底 | 連續 6 個候選沒有 Rare，下一個 Choice／Reward 至少一張 Rare。 |
| 戰鬥門 | 顯示敵人等級與獎勵稀有度；第一章前兩門禁止出現。 |

## 4. 敵人、精英與 Boss 數值模型

### 4.1 基礎敵人角色

| archetype | 行為 | base HP | base damage | 速度／CD | 設計目的 |
| --- | --- | ---: | ---: | --- | --- |
| `MeleeRunner` | 直線接近，接觸一次傷害後退 | 8 | 10 | 3.4m/s | 教玩家維持輸出。 |
| `RangedShooter` | 停止蓄力 0.6s，生成速度 12m/s 的直線敵彈 | 12 | 12 | 3.5s | 教玩家橫移躲彈；敵彈命中才造成傷害。 |
| `SineFlyer` | 正弦橫移，低頻射擊 | 10 | 9 | 3.2s | 檢驗預判與射程。 |
| `Bulwark` | 前方 60% 減傷，慢速靠近 | 28 | 16 | 2.2m/s | 驗證穿透／飛劍／側向。 |

敵人傷害只在 telegraph 後發生。遠程敵人在蓄力期間停止前進，完成蓄力後生成沿自身 X 軸直線前進、速度 `12m/s` 的敵彈；敵彈速度高於道路敵人的約 `6.7m/s` 接近速度，避免視覺上與敵人相對停滯。敵彈必須碰到玩家才造成傷害，命中後立即回收。接觸傷害對同一敵人有 1.0 秒玩家受擊 CD。所有敵人有 `threatScore` 供索敵同距離排序。

### 4.2 章節成長

```text
chapterHpScale = 1.40 ^ (chapter - 1)
chapterDamageScale = 1.22 ^ (chapter - 1)
encounterHpScale = 1 + 0.08 × encounterIndexWithinChapter
enemyHp = round(baseHp × chapterHpScale × encounterHpScale)
enemyDamage = round(baseDamage × chapterDamageScale)
eliteHp = enemyHp × 3.0
eliteDamage = enemyDamage × 1.35
```

普通敵預期 TTK 0.5–2.0 秒、精英 4–8 秒。若多 Build 未達 TTK，優先調低敵 HP 曲線，不以不可躲傷害補難度。

### 4.3 Boss 原則

| 項目 | 規則 |
| --- | --- |
| Boss HP | `28 × 1.85^(chapter-1) × (1 + 0.12 × bossIndex)` 為起點，需按實測調整。 |
| Phase | 第一章 2 phase（70% HP），第二／三章 2–3 phase（70%／35%）。 |
| 預警 | 所有招式至少 0.35 秒，致命／追蹤招至少 0.6 秒。 |
| 空檔 | 每個攻擊循環後保留 1.0–1.5 秒低壓窗口。 |
| 失敗公平性 | Boss 不可在 phase 轉換、獎勵、暫停恢復首幀造成傷害。 |
| 擊殺 | 清除敵彈→擊殺演出→產生 Reward；不得先出 UI 再清彈。 |

## 5. 能力與 Build 系統

### 5.1 稀有度與權重

| 稀有度 | 基礎權重 | 效果定位 | 顯示 |
| --- | ---: | --- | --- |
| Common | 70 | 直接、小幅、可疊 | 灰白。 |
| Rare | 25 | Build 關鍵、複合效果 | 藍紫。 |
| Epic | 5 | 改變玩法／解鎖夥伴 | 金橘。 |

權重先受章節、已持有 Build、pity、互斥規則修正。Boss Reward 至少 1 Rare；第一章 Boss 固定提供至少一張「建立 Build」的 Rare。

### 5.2 MVP 一般能力池（24）

| id | 稀有 | 最大層 | 每層效果 | 類別 |
| --- | --- | ---: | --- | --- |
| `arrow_count` | Common | 8 | 箭數 +1 | 弓箭 |
| `arrow_damage` | Common | 8 | 加法傷害 +25% | 弓箭 |
| `rapid_fire` | Rare | 6 | 間隔 ×0.88 | 弓箭 |
| `longshot` | Common | 4 | 射程 +6m | 弓箭 |
| `swift_fletching` | Common | 4 | 箭速 +20% | 弓箭 |
| `piercing_tip` | Rare | 4 | 穿透 +1 | 弓箭 |
| `critical_eye` | Rare | 5 | 暴擊 +12% | 弓箭 |
| `wide_arc` | Common | 3 | 散布 +8°，箭數 +1 | 弓箭 |
| `vital_reserve` | Common | 4 | Max HP +25，立即同量治療 | 生存 |
| `field_mend` | Common | 1 | 立即治療 25 HP | 生存 |
| `iron_skin` | Rare | 5 | 減傷 +8% | 生存 |
| `vampiric_string` | Epic | 4 | 吸血 +3% | 生存 |
| `windstep` | Common | 3 | 移速 +0.7m/s | 生存 |
| `ward_shard` | Rare | 3 | 護盾 +20（進入戰鬥時刷新） | 生存 |
| `sword_orbit` | Rare | 6 | 飛劍 +1 | 飛劍 |
| `sword_haste` | Rare | 6 | 飛劍 CD ×0.82 | 飛劍 |
| `sword_edge` | Common | 6 | 飛劍傷害 +35% | 飛劍 |
| `sword_reach` | Common | 4 | 飛劍索敵 +4m | 飛劍 |
| `returning_blade` | Epic | 1 | 飛劍回程可再命中一次 | 飛劍 |
| `pet_spark` | Epic | 1 | 解鎖基礎夥伴 | 夥伴 |
| `pet_training` | Rare | 5 | 夥伴傷害 +30% | 夥伴 |
| `pet_haste` | Common | 4 | 夥伴攻擊 CD ×0.85 | 夥伴 |
| `shared_focus` | Rare | 3 | 夥伴命中使弓傷 +10% 2 秒 | 夥伴 |
| `echo_cache` | Common | 3 | 金幣結算 +10% | 全域 |

### 5.3 Boss Reward 池（12）

| id | 稀有 | 效果 | 前置／互斥 |
| --- | --- | --- |
| `storm_bow` | Rare | 箭數 +2、散布 -4° | 無。 |
| `heartwood` | Rare | Max HP +60、減傷 +8% | 無。 |
| `blade_nexus` | Rare | 解鎖 2 飛劍、CD 2.2 秒 | 無。 |
| `companion_call` | Epic | 解鎖夥伴，基礎 DPS 4 | 無。 |
| `critical_mass` | Rare | 暴擊 +20%、暴傷 +0.5 | 無。 |
| `piercing_rain` | Rare | 穿透 +2、箭速 +25% | 無。 |
| `lifeline` | Epic | 吸血 +5%，Max HP -15 | 與 `glass_string` 互斥。 |
| `glass_string` | Epic | more damage ×1.5，Max HP -25% | 與 `lifeline` 互斥。 |
| `orbit_forge` | Epic | 飛劍傷害 ×1.7、飛劍 +1 | 需有飛劍。 |
| `pack_instinct` | Epic | 夥伴攻速 ×1.5、夥伴 +1 | 需有夥伴。 |
| `second_wind` | Rare | 立即滿血，之後每章第一次致命傷保留 1 HP | 每 Run 1。 |
| `echoed_shot` | Epic | 每第 4 次射擊額外複製一次 | 無。 |

### 5.4 Build 成功條件

| Build | 最小成形 | 強項 | 弱項／平衡約束 |
| --- | --- | --- |
| 弓箭 | `arrow_count` 2 層 + `rapid_fire` 或 `arrow_damage` 2 層 | 穩定遠程、清群 | 散布太廣時對單體命中率下降。 |
| 飛劍 | `blade_nexus` 或 `sword_orbit` 2 層 + `sword_haste` | 近距離高爆發、自動索敵 | 需要靠近，對遠程預警壓力高。 |
| 夥伴 | `companion_call/pet_spark` + `pet_training`／`pet_haste` | 自動持續輸出、走位自由 | 成形較慢，初期輸出低。 |

MVP bot／受控 run 中，每種 Build 至少 20 次可擊敗最終 Boss；三者勝率差不超過 15 個百分點。

## 6. 局外經濟與進度

### 6.1 金幣

```text
goldEarned = floor(chapterReached × 2 + bossesDefeated × 4
                   + elitesDefeated + score / 500)
```

金幣只在結算時計入 Profile。Boss Reward 重擲消耗局外金幣時，必在重擲當刻建立 transaction；若 Run 未完成，消耗仍保留，避免中斷刷卡。

### 6.2 永久升級（MVP）

| id | 等級／效果 | 成本 | 解鎖 |
| --- | --- | --- | --- |
| `meta_health` | 4 級，每級 +25 Max HP | 8/12/18/28 | 預設 |
| `meta_damage` | 4 級，每級 +1 baseDamage | 10/15/22/32 | 預設 |
| `meta_fire_rate` | 4 級，每級 interval ×0.92 | 10/15/22/32 | 預設 |
| `meta_sword` | 3 級，每級 +1 初始飛劍 | 12/18/28 | 首次發現飛劍 |
| `meta_windstep` | 1 級，起始移速 +15% | 20 | 首次發現 windstep |
| `meta_crit` | 2 級，每級暴擊 +5% | 18/30 | 首次發現暴擊 |

首局應可拿到 5–8 金；完成第一 Boss 約 10–14 金。目標為第一局後能買一個低階升級，第三至第五局開始感覺局外投資有效。

## 7. 數據表格式與驗證

每份內容資料都要有 `id`、`contentVersion`、`displayKey`、`rarity`、`tags`、`unlockCondition`、`maxStacks`、`weight`、`source`、`deprecated`。數值欄位必含單位後綴。資料 validator 必阻擋：重複 ID、空翻譯 key、非法上限、負權重、互斥項同時出現、前置循環、Boss／Segment 引用遺失。

## 8. 平衡流程

1. 設計師修改資料表，列明假設與目標（例：第一章 Boss TTK 35 秒）。
2. 工程以 content validator + 10,000 seed bot simulation 產出勝率、TTK、選取率、最大彈量。
3. QA 在 Low／Standard 裝置以指定 seed 做人工可讀性與效能驗證。
4. PM／系統 owner 只在數據、玩家觀察與風險齊全時核准 `contentVersion`。
5. 改動傷害曲線、經濟、RNG、存檔相容時須做回歸測試與 release note。

## 9. 全局驗收標準

- 所有 Ability、Enemy、Boss、Segment 可由資料載入，沒有 gameplay hard-code。
- 相同 seed、內容版本與輸入序列，Gate、Reward、敵人、分數與結算完全一致。
- 第一章首局固定 sequence 保證教學與可行 Build；後續 run 的隨機規則符合第 3.3 節。
- 任一狀態下 HP、金幣、能力層數、傷害減免均不超出規定上限。
- 每次調數值均有 owner、版本、測試證據和 rollback 前版資料。
