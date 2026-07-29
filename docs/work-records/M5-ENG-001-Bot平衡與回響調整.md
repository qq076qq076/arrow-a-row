# M5-ENG-001：Bot 平衡與回響調整

狀態：Completed｜角色：工程師｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`工程(M5)：完成Bot平衡與回響調整`（以 Git history 的最終 hash 為準）

## 產出

- 新增 deterministic `BetaBotSimulation`，以 Arrow Storm、Deadeye、Ironbark 三種既有 Build 目標選擇 Gate 與 Boss 回響。
- 加入 1,000 campaign（334／333／333）回歸：驗證完成率差距 ≤15 個百分點、平均 Boss 耗時 20–45 秒，並確認每局至少三次 Gate 選擇。
- 依 bot 結果只調整既有回響數值：風暴弓增為箭數 +2／箭傷 +40%；獵手印記為箭傷 +35%；鐵木護甲增為減傷 +40%／最大 HP +30。
- 更新畫面文案與 localization CSV 的數值註記。

## 結果

| Build | Campaign | 完成率 | 平均 Boss 耗時 |
| --- | ---: | ---: | ---: |
| Arrow Storm | 334 | 77.8% | 38.1 秒 |
| Deadeye | 333 | 85.0% | 34.7 秒 |
| Ironbark | 333 | 77.2% | 40.0 秒 |

完成率最大差距為 7.8 個百分點，符合 ≤15 個百分點的 M5 bot KPI。

## 交接

QA 執行完整 unit、build、Chrome／WebKit viewport 回歸；真人與實機數據依 PM 的風險接受，在 M6 前完成。
