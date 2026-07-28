# 工作交接紀錄索引

本資料夾是依 [工作流程與里程碑計畫](../Arrow-a-Row-工作流程與里程碑計畫.md) 執行的不可變交接紀錄。每位角色完成一個 milestone 工作包時，必須：

1. 新增一份 `M{n}-{ROLE}-{seq}-{slug}.md` 紀錄；不得覆寫既有完成紀錄。
2. 列出輸入文件、具體產出、完成標準與證據、已知風險、下一位角色的可執行起點。
3. 更新本索引的狀態。
4. 將該角色產出和紀錄以獨立 commit 提交；commit hash 回填到紀錄與索引（若 commit hash 無法事前得知，可在提交後以 amend 補回）。

## 狀態定義

| 狀態 | 意義 |
| --- | --- |
| `Ready` | 所需輸入齊全，角色可開始。 |
| `In Progress` | 角色正在執行，尚不可作下游依據。 |
| `Completed` | 已符合完成標準、已提交 commit，可供下一角色使用。 |
| `Blocked` | 缺少權限、工具、決策或外部輸入；必須明列解除條件。 |

## M0：啟動與基線

| 順序 | 角色 | 工作包 | 狀態 | 紀錄 | Commit |
| ---: | --- | --- | --- | --- | --- |
| 1 | PM | M0 產品基線、範圍、風險與角色交接啟動 | Completed | [M0-PM-001](M0-PM-001-產品基線.md) | `docs(pm): record M0 product baseline handoff` |
| 2 | 遊戲世界觀規劃師 | M0 世界核心、章節 brief、術語與禁用清單 | Completed | [M0-WORLD-001](M0-WORLD-001-世界與第一章文案.md) | `docs(world): complete M0 narrative handoff` |
| 3 | 介面設計師 | M0 資訊架構、直式 flow、安全區基線 | Ready | — | — |
| 4 | 建模師 | M0 美術方向、資產預算、章節 kit 規劃 | Ready | — | — |
| 5 | 工程師 | M0 Unity 專案、CI、asmdef、手機空殼 | Ready | — | — |
| 6 | 測試人員 | M0 裝置矩陣、測試策略、Smoke 基線 | Ready | — | — |
