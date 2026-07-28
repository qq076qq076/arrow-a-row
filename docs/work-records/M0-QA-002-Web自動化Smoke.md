# M0-QA-002：Web／PWA 自動化 Smoke 執行

狀態：Completed（自動化）／Ready（實機）｜角色：測試人員｜Milestone：M0 啟動與基線｜完成日期：2026-07-28｜Commit：`測試(M0)：完成網頁自動化 Smoke 驗證`（查詢本檔案 Git history）

## 接收輸入

- [M0-ENG-002](M0-ENG-002-Web專案基線待執行.md)
- [M0 QA 裝置矩陣與 Smoke 案例](../qa/M0-裝置矩陣與Smoke測試案例.md)
- [Web 技術設計與程式規範](../Arrow-a-Row-技術設計與程式規範.md)

## 執行範圍與結果

| 類別 | 命令／環境 | 結果 |
| --- | --- | --- |
| Unit／content／storage | `npm test` | Pass：3 test files、3 tests。 |
| Production build | `npm run build` | Pass：TypeScript typecheck + Vite build。 |
| Chrome 手機 viewport | Playwright `Pixel 7` | Pass：主選單標題與 `開始新局` 可見。 |
| WebKit 手機 viewport | Playwright `iPhone 13` | Pass：主選單標題與 `開始新局` 可見。 |
| bundle 觀察 | Vite output | Warning：Three.js 初始 chunk 685.43 kB（gzip 185.81 kB）；M2 前需 code split。 |

## 已驗證的 M0 Smoke

- WebGL 2 可用時 React／Three.js runtime 能顯示主選單。
- 手機 viewport 下主要 CTA 可見。
- Run checkpoint repository 的寫入與讀回 unit test 通過。
- content manifest 會拒絕重複 asset ID。

## 尚未驗證（不可誤標 Pass）

| 案例 | 原因 | 下一步 |
| --- | --- | --- |
| iOS Safari 真機 | Playwright WebKit 不是 iOS 真機 | 在 iOS 15+ 瀏海 iPhone 開 staging／本機 LAN。 |
| Chrome Android 真機 | Playwright Pixel viewport 不是實機 GPU／觸控 | 在 AND-L、AND-S 執行拖曳、safe area、WebGL profile。 |
| PWA 離線完整 Run | 尚無 CH01 asset manifest／完整 Run | M2 完成後測 service worker cache 與飛航模式。 |
| 背景、pagehide、context lost | 尚未有完整 Run UI | M1 接入 Run state 後依 SMK-005～007 驗證。 |

## QA 結論

工程 Web M0 的自動化品質 Gate 已通過，可進入 M1 灰盒核心。實機 smoke 不應阻塞目前的 M1 研發，但必須在 M2 垂直切片 Gate 前完成。初始 Three.js chunk 警告已登錄為效能風險，M2 前需以 lazy load／manual chunk 解決。

## 下一位角色交接：M1 工程＋UI＋建模

工程可在現有 runtime 上接入 `RunStateMachine`、Pointer 拖曳、Gate 和 combat graybox；UI 依 M0 線框接入主選單／HUD；建模師先交付低模 GLB。每個 M1 子工作包仍須新增交接紀錄與中文 commit。
