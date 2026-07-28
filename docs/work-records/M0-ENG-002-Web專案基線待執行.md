# M0-ENG-002：Three.js Web 專案基線

狀態：Ready｜角色：工程師｜Milestone：M0 啟動與基線｜建立日期：2026-07-28

## 前置已滿足

- 本機可用 Node.js `v22.22.2`、npm `10.9.7`、Git。
- 技術規範已切換為 Three.js Web／PWA v0.2。
- UI、世界觀、資產 ID、內容與 QA Smoke 基線已存在。

## 待完成工作與完成標準

1. 建立 Vite React TypeScript strict 專案與 package lock；`npm ci`、`npm run typecheck`、`npm run test`、`npm run build` 可執行。
2. 加入 Three.js，提供 WebGL2 unsupported screen、Canvas container、固定 30Hz 空 simulation 與 requestAnimationFrame render bridge。
3. 建立 React Shell／Run route、CSS safe-area、Pointer input adapter、visibility/pagehide checkpoint port。
4. 建立 IndexedDB repository 的最小 Profile／Run schema 與 Vitest。
5. 加入 content JSON + Zod validator、GLB asset manifest schema、Playwright mobile viewport smoke。
6. 建立 CI workflow；本機／CI 產出可部署的靜態 `dist/`。

## QA 交接

完成後提供 staging URL 或本機啟動命令、Git SHA、Node/package-lock hash、content／asset manifest hash、已知問題；QA 執行更新後的 M0 Smoke（iOS Safari／Chrome Android／PWA）。
