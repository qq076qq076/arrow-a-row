# M5-ENG-002：初始 Gate 與 Boss 預警可讀性

狀態：Completed｜角色：工程師｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`工程(M5)：改善初始Gate與Boss預警`（以 Git history 的最終 hash 為準）

## 產出

- 第一組 Gate（開局兩個 Buff）改為放大尺寸的「圖示＋文字」標籤；其他 Gate 同樣補齊 Buff 圖示，維持較緊湊的尺寸。
- Boss 的實際攻擊預警不再只有 HUD 文字：Boss 會脈衝放大、加速旋轉，並在地面顯示隨蓄力進度擴張的警示環。
- Phase 轉換文案不觸發攻擊環，避免把非傷害事件誤導為攻擊。

## 驗證

- Vitest 7 files / 22 tests passed。
- production build passed。
- Playwright Chromium／WebKit mobile viewport 8/8 passed。
