# M3-UI-002：Build HUD 與瞄準提示

狀態：Completed｜角色：介面設計師／工程師｜Milestone：M3 系統完成｜完成日期：2026-07-29｜Commit：`介面(M3)：加入Build狀態與瞄準提示`（以 Git history 的最終 hash 為準）

## 輸入

- [M3-ENG-014](M3-ENG-014-正前方箭矢方向.md)：箭矢固定往正前方，玩家需以橫向走位對準目標。

## 已完成產出

- Run HUD 顯示即時 Build：箭數、穿透、箭速、射速、飛劍、減傷。
- Run 開始至第一個 Gate 前顯示「箭矢只往正前方射出，拖曳角色對準敵人」提示，之後自動消失，不遮擋長流程畫面。
- Build 面板設為非互動、支援安全區、可在窄螢幕換行，並避開 Boss HUD。
- E2E 新增可見性驗證：開始 Run 後確認 Build 面板與瞄準提示皆存在。

## 完成標準與證據

- Vitest 5 files / 18 tests、production build 通過。
- Playwright Chrome／WebKit 6/6 通過，含新 HUD 的可見性斷言。

## 下一位角色起點

QA 可在實機檢查低解析度裝置的換行與 Boss HUD 間距；若顯示太密，可保留箭數／穿透／箭速為常駐，其他數值改成展開面板。
