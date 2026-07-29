# M5-QA-001：Beta 回歸與相容性結案

狀態：Completed（自動化）／Accepted Risk（實機）｜角色：測試人員｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`測試(M5)：完成Beta回歸與相容性結案`（以 Git history 的最終 hash 為準）

## 自動化驗收

| 範圍 | 結果 |
| --- | --- |
| 1,000 deterministic bot campaign、三種既有 Build | Pass：77.2%–85.0% 完成率，最大差距 7.8 個百分點；Boss 平均 34.7–40.0 秒。 |
| 100 CH01→CH03 campaign soak | Pass：無 crash／soft lock。 |
| Unit／repository／content 回歸 | Pass：Vitest 7 files / 22 tests。 |
| Production build | Pass：TypeScript 與 Vite build。 |
| 手機相容性 viewport | Pass：Playwright Chromium／WebKit 8/8，包含畫質切換。 |
| P0／P1 | 自動化範圍內未發現 P0；未建立未指派 P1。 |

## Gate 與風險

M5 的自動化平衡、回歸、browser viewport 與 build Gate 通過。依 [PM 風險接受](M5-PM-001-Beta範圍與風險接受.md)，真人 playtest、實體 iOS／Android 離線、前後台、safe area、FPS／記憶體／溫度驗收列為 Accepted Risk；這些資料是 M6 發版前的必要解除條件，不可用本報告取代。

## 結論

M5 可作為外部測試候選版完成交接；未授權進入 M6 發版候選，直到上述實機與真人資料補齊。
