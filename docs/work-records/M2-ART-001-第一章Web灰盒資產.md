# M2-ART-001：第一章 Web 灰盒資產與 Manifest

狀態：Completed｜角色：建模師／技術美術｜Milestone：M2 垂直切片｜完成日期：2026-07-28｜Commit：`建模(M2)：完成第一章Web灰盒資產`（以 Git history 的最終 hash 為準）

## 接收輸入

- [M2-PM-001](M2-PM-001-垂直切片範圍鎖定.md)
- [M2-UI-001](M2-UI-001-第一章互動狀態.md)
- [3D 資產與技術美術規格](../roles/建模師-3D資產與技術美術規格.md)

## 完成產出

- [第一章 Web 灰盒資產交付](../art/M2-CH01-Web灰盒資產交付.md)。
- `public/assets/manifest.json`：可版本化的程序化資產、群組、socket 合約。
- Content manifest schema 擴充為 `glb` 與 `procedural` 兩種資產來源，附單元測試。

## 完成標準與證據

| 標準 | 證據 |
| --- | --- |
| CH01 可有 Web 原生替代資產 | manifest 具主角、兩類敵人、Boss、環境五個 ID。 |
| socket／預載群組可交接 | 每筆 manifest 都列出 socket 與 preloadGroup。 |
| 低成本可讀性 | 交付文件限定不透明共用 primitive，Boss 預警以材質變色表現。 |
| 型別化內容可驗證 | `ContentSchema.test.ts` 驗證程序化條目與重複 ID 拒絕。 |

## 已知風險

- 此為可玩灰盒，不是最終 GLB、動畫或貼圖交付；M4 前須以相同 ID／socket 替換。
- 真機 GPU profile 和正式 GLB loader 測試須由後續美術產線完成。

## 下一位角色交接：工程師

依 asset ID 建立 Boss 與第一章 runtime 表現；只有 renderer 可讀取 `kind`／socket，simulation 與數值不得依賴模型資產。
