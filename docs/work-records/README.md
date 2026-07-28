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
| 1 | PM | M0 產品基線、範圍、風險與角色交接啟動 | Completed（已由 Web 決策覆蓋技術部分） | [M0-PM-001](M0-PM-001-產品基線.md)、[M0-PM-002](M0-PM-002-Web技術路線調整.md) | `docs(pm): switch technical plan to Three.js web` |
| 2 | 遊戲世界觀規劃師 | M0 世界核心、章節 brief、術語與禁用清單 | Completed | [M0-WORLD-001](M0-WORLD-001-世界與第一章文案.md) | `docs(world): complete M0 narrative handoff` |
| 3 | 介面設計師 | M0 資訊架構、直式 flow、安全區基線 | Completed | [M0-UI-001](M0-UI-001-資訊架構與直式線框.md) | `docs(ui): complete M0 mobile UX handoff` |
| 4 | 建模師 | M0 美術方向、資產預算、章節 kit 規劃 | Completed | [M0-ART-001](M0-ART-001-晨線草原資產基線.md) | `docs(art): complete M0 chapter asset handoff` |
| 5 | 工程師 | M0 Three.js Web 專案、CI、3D runtime、PWA 空殼 | Completed（CI workflow 待 ENG-10） | [M0-ENG-002](M0-ENG-002-Web專案基線待執行.md) | `工程(M0)：建立 Three.js 網頁技術基線` |
| 6 | 測試人員 | M0 裝置矩陣、測試策略、Smoke 基線 | Completed（自動化）／Ready（實機） | [M0-QA-001](M0-QA-001-測試基線設計.md)、[M0-QA-002](M0-QA-002-Web自動化Smoke.md) | `測試(M0)：完成網頁自動化 Smoke 驗證` |

## M1：核心灰盒

| 順序 | 角色 | 工作包 | 狀態 | 紀錄 | Commit |
| ---: | --- | --- | --- | --- | --- |
| 1 | PM | 核心灰盒範圍與固定內容 | Completed | [M1-PM-001](M1-PM-001-核心灰盒範圍鎖定.md) | `PM(M1)：鎖定核心灰盒範圍` |
| 2 | 工程師 | Run、輸入、Gate、戰鬥與灰盒 UI | Completed | [M1-ENG-001](M1-ENG-001-核心灰盒實作.md) | `工程(M1)：完成核心灰盒玩法` |
| 3 | 測試人員 | M1 回歸與可用性驗收 | Completed（自動化）／Ready（實機） | [M1-QA-001](M1-QA-001-核心灰盒回歸.md) | `測試(M1)：完成核心灰盒自動化驗收` |

## M2：第一章垂直切片

| 順序 | 角色 | 工作包 | 狀態 | 紀錄 | Commit |
| ---: | --- | --- | --- | --- | --- |
| 1 | PM | 第一章垂直切片範圍與 Gate | Completed | [M2-PM-001](M2-PM-001-垂直切片範圍鎖定.md) | `PM(M2)：鎖定第一章垂直切片範圍` |
| 2 | 遊戲世界觀規劃師 | CH01 Boss／Reward／商店文案補齊 | Completed | [M2-WORLD-001](M2-WORLD-001-第一章戰鬥與商店文案.md) | `世界觀(M2)：補齊第一章戰鬥與商店文案` |
| 3 | 介面設計師 | M2 狀態規格與互動基線 | Completed | [M2-UI-001](M2-UI-001-第一章互動狀態.md) | `介面(M2)：完成第一章互動狀態規格` |
| 4 | 建模師 | CH01 Web 3D 資產與 manifest 基線 | Completed | [M2-ART-001](M2-ART-001-第一章Web灰盒資產.md) | `建模(M2)：完成第一章Web灰盒資產` |
| 5 | 工程師 | CH01 端到端玩法、存檔與商店 | Completed | [M2-ENG-001](M2-ENG-001-第一章端到端實作.md)、[M2-ENG-002](M2-ENG-002-Checkpoint恢復.md)、[M2-ENG-003](M2-ENG-003-桌機鏡頭與輸入修正.md)、[M2-ENG-004](M2-ENG-004-自適應主角取景.md) | `工程(M2)：完成第一章垂直切片玩法`、`工程(M2)：完成第一章Checkpoint恢復`、`工程(M2)：修正桌機鏡頭與滑鼠操作`、`工程(M2)：確保主角在各視窗可見` |
| 6 | 測試人員 | M2 垂直切片回歸 | Completed（自動化）／Ready（實機） | [M2-QA-001](M2-QA-001-第一章垂直切片回歸.md) | `測試(M2)：完成第一章垂直切片回歸` |
