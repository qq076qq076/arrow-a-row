# M0-ENG-002：Three.js Web 專案基線

狀態：Completed｜角色：工程師｜Milestone：M0 啟動與基線｜完成日期：2026-07-28｜Commit：`工程(M0)：建立 Three.js 網頁技術基線`（查詢本檔案 Git history）

## 接收輸入與前置

- 本機可用 Node.js `v22.22.2`、npm `10.9.7`、Git。
- 技術規範已切換為 Three.js Web／PWA v0.2。
- UI、世界觀、資產 ID、內容與 QA Smoke 基線已存在。

## 已完成工作與證據

1. 已建立 Vite、React、TypeScript strict、Three.js、Zod、Vitest、Playwright 專案與 `package-lock.json`。
2. 已建立 WebGL2 不支援 fallback、Canvas container、requestAnimationFrame render bridge 與固定 30Hz `GameLoop`。
3. 已建立 React Shell／HUD placeholder、CSS safe-area、Service Worker／PWA manifest、`visibilitychange`／`pagehide` lifecycle port。
4. 已建立 IndexedDB `RunCheckpointRepository` 與 checkpoint round-trip unit test。
5. 已建立 content／asset manifest Zod schema、重複 ID validator、Chrome／WebKit 手機 viewport Playwright Smoke。
6. 驗證結果：`npm test` 3/3 通過；`npm run build` 通過；`npm run test:e2e` 2/2 通過。production JS gzip 為 185.81 kB；未 gzip chunk 685.43 kB，需在 M2 前完成 Three.js dynamic import／code split。

## 未完成但不阻塞 M0 的工作

- GitHub Actions CI workflow：需先確認 repository 的 CI 權限與 secrets owner，排入 ENG-10。
- 真實 iOS Safari／Chrome Android 實機測試：由 QA M0-WEB 進行，不以 Playwright viewport 取代。
- PWA 完整離線內容預快取：目前為 shell 與 runtime cache 基線，CH01 asset manifest 完成後在 M2 驗證完整離線 Run。

## QA 交接

提供給 QA：本機命令 `npm ci && npm run build && npm run preview -- --host 0.0.0.0 --port 4187`；測試命令 `npm test`、`npm run test:e2e`；需記錄 Git SHA、Node/package-lock hash、content／asset manifest hash。QA 執行 iOS Safari／Chrome Android／PWA 實機 Smoke，並另建工作紀錄。
