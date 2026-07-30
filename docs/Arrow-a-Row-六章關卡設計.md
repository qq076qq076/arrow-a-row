# Arrow a Row：六章關卡與敵人生命成長設計

版本：0.2｜Owner：PM（暫兼系統／關卡／數值設計）｜狀態：M6 設計鎖定

## 六章結構

| 章節 | ID | 名稱／主題 | 遊戲重點 | Boss |
| ---: | --- | --- | --- | --- |
| 1 | `ch01_meadow` | 晨線草原／青綠金色 | 拖曳、Gate、自動射擊、直線躲彈 | 苔冠守衛 |
| 2 | `ch02_viaduct` | 鏡潮高架／靛藍銀色 | 飛行敵、交錯橫移、預判 | 鏡潮校準者 |
| 3 | `ch03_forge` | 熾心熔庭／紫琥珀 | 範圍預警、召喚、輸出檢定 | 熔脈監工 |
| 4 | `ch04_canopy` | 霧冠林海／翠綠白霧 | 遮蔽、衝鋒與遠程混編 | 枝語母體 |
| 5 | `ch05_archive` | 星圖遺庫／深藍金線 | 菁英 modifier、窄安全縫 | 無光抄錄者 |
| 6 | `ch06_horizon` | 裂光地平／白金虹彩 | 全 Build 終局檢定 | 靜滯之核 |

每章固定節奏為 `5 波小怪 → 回響三選一`，重複三輪後進入 `Boss → Reward`。第一波在 12m，之後每 8m 一波；第 5／10／15 波後各暫停一次並抽出 3 張不重複候選，玩家選 1 張後繼續。第三次回響確認後進入 Boss 前 5 秒閃爍警示，Boss 進場後靠近並停在距離玩家 3 單位。CH01 為固定教學 sequence；CH02–CH06 以同一資料 schema 配置。

## 敵人 HP 曲線

```text
chapterHpScale = [1.10、1.54、2.156、3.014、4.224、5.918]
roundHpScale = 1.00、1.05、1.10
waveHpScale = 1.00、1.04、1.08、1.12、1.16
enemyHp = round(baseHp × chapterHpScale × roundHpScale × waveHpScale)
eliteHp = round(enemyHp × 3.0)
bossHp = round(36 × chapterHpScale)
```

| 章節 | HP 倍率 | 第 1 波近／遠 | 第 15 波近／遠 | Boss HP |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 1.10 | 9 / 13 | 11 / 17 | 36 |
| 2 | 1.54 | 12 / 18 | 16 / 24 | 50 |
| 3 | 2.156 | 17 / 26 | 22 / 33 | 71 |
| 4 | 3.014 | 24 / 36 | 31 / 46 | 99 |
| 5 | 4.224 | 34 / 51 | 43 / 65 | 138 |
| 6 | 5.918 | 47 / 71 | 60 / 90 | 194 |

怪物傷害採較慢曲線 `1.22^(chapterIndex-1)`；若主要 Build 的普通敵 TTK 超過 2 秒，先調低 HP 曲線或增加 Gate 輸出保底。

## 每章戰鬥內容與驗收

| 章節 | 三場戰鬥／精英 | Gate 保底 | Boss 驗收 |
| --- | --- | --- | --- |
| CH01 | 近戰、近遠混編、混合波；凝霧射手隊長 | 箭數／箭傷 | 2 phase，教會預警與 Reward。 |
| CH02 | 飛行、遠程交錯、飛行近戰；鏡翅領航者 | 穿透／箭速／飛劍 | 2 phase，橫移預判。 |
| CH03 | 鈍甲、召喚、範圍混合；熔殼破陣者 | 攻速或穿透 | 2 phase，地面範圍預警。 |
| CH04 | 衝鋒、隱現遠程、近遠輪替；霧冠獵手 | 移速或護盾 | 2 phase，遮蔽不超過 1 秒。 |
| CH05 | 菁英 modifier、密集遠程、三類混編；星圖守庫者 | 生存與稀有輸出 | 2 phase，安全縫 ≥1.2m。 |
| CH06 | 全敵人、精英雙波、終局混編；裂光前衛 | 現有 Build tag 對應能力 | 3 phase，每段低壓窗口 ≥1 秒。 |

## 工程合約與完成標準

```ts
type ChapterDefinition = {
  id: ChapterId;
  index: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  enemyHpScale: number;
  enemyDamageScale: number;
  bossHp: number;
  bossPhaseCount: 2 | 3;
  unlockAfter?: ChapterId;
};
```

主選單選章、敵人／Boss HP、內容 validator 都必須讀此資料；renderer 不保存數值。每章首次通關解鎖下一章；任一章同 seed 必須重現相同 HP。三種主要 Build 均須能通過六章，普通敵 TTK 0.5–2 秒、Boss 25–70 秒。
