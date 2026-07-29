# M3-ENG-003：連續六章 Run 與 Build 繼承

狀態：Completed｜角色：工程師｜Milestone：M3 系統完成｜完成日期：2026-07-29｜Commit：`工程(M3)：完成連續六章Build繼承`（以 Git history 的最終 hash 為準）

## 完成內容

- Boss Reward 確認後，CH01–CH05 結算畫面提供「前往下一章」。
- 下一章重設場景、敵人、Boss、Gate、短暫特效與距離，但保留玩家 HP／Max HP、箭數、傷害、飛劍、攻速、永久升級與晶塵。
- CH06 是連續 Run 的終點，不再顯示下一章 CTA。

## 驗收證據

- Vitest 5 files / 12 tests、production build 通過。
- Playwright Chrome/WebKit 手機與桌機 6/6 通過。

## 下一位角色交接：QA

執行 CH01→CH02→…→CH06 長流程：每章選任一 Reward 後比對下一章 HUD 的 Build 數值，且確認怪物／Boss HP 依章節上升。
