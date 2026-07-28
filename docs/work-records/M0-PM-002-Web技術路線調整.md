# M0-PM-002：技術路線調整為 Three.js Web／PWA

狀態：Completed｜角色：PM｜Milestone：M0 啟動與基線｜完成日期：2026-07-28｜Commit：`docs(pm): switch technical plan to Three.js web`（查詢本檔案 Git history）

## 決策

依使用者指示，停止 Unity／原生優先路線，改為手機瀏覽器／PWA 優先：Three.js 負責 3D render、TypeScript 30 Hz deterministic simulation、React DOM UI、Vite build、IndexedDB 存檔、PWA 離線 shell、Vitest／Playwright 測試。日後需要 App Store／Google Play 時才評估 Capacitor 薄殼。

## 影響與調整

| 舊方案 | 新方案 | 影響 |
| --- | --- | --- |
| Unity 6.3 + C# | Three.js + TypeScript | 工程文件、程式規範、M0 環境與 CI 重寫。 |
| Scene／Prefab／Addressables | Three Scene／GLB／asset manifest | 建模交付改 GLB、socket node、versioned URL/hash。 |
| 原生 app lifecycle | Page Visibility、pagehide、WebGL context lifecycle | checkpoint／恢復改為瀏覽器規格。 |
| Android/iOS build | Web deploy／PWA | QA 改驗證 iOS Safari、Chrome Android、離線／快取。 |
| Unity Editor blocker | Node/Vite project | 本機已有 Node 22/npm，工程 M0 可開始。 |

## 已更新的活文件

- README、工作流程、技術設計與程式規範。
- 工程、建模、世界觀、QA、系統／第一章文件中所有實作路線引用。
- 歷史紀錄 `M0-ENG-001` 保留為當時 Unity 方案的阻塞證據，不修改；本決策覆蓋其後續行動。

## 完成標準

- 技術棧、資料流、渲染 loop、存檔、PWA、測試、效能與安全規則已在技術規範 v0.2 定義。
- 角色交接已改為 GLB／asset manifest 與 Web build。
- 工程 M0 的解除條件不再需要 Unity；可依 M0-ENG-002 開始。

## 下一位角色交接：工程師

建立 Vite + TypeScript strict + Three.js + React 的最小 Web 專案；先完成 WebGL2 capability screen、Canvas／DOM layer、30Hz 空 simulation、Pointer input、IndexedDB smoke 與 `npm` CI scripts。完成後建立 `M0-ENG-002` 完成紀錄並獨立 commit。
