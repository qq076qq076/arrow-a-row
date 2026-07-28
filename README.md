# Arrow a Row（手機版原創專案）

一款 iOS／Android 手機優先、直式單手操作的單人 Roguelite 自動跑酷射擊遊戲。玩家自動前進與射擊，透過左右拖曳選擇增益、閃避敵彈、建立弓箭／飛劍／夥伴 Build，擊敗章節 Boss。

> 本專案以公開可觀察的同類玩法作為研究起點，但世界觀、美術、角色、文本、數值、關卡與程式碼必須完全原創；不得複製任何既有遊戲資產或 IP。

## 目前狀態

- 階段：`M0 啟動與基線` 進行中。
- 已完成：PM、世界觀規劃、UI、建模、QA 的文件化 M0 交接。
- 工程狀態：`Ready`。技術路線已改為 Three.js + TypeScript + React + Vite；本機已有 Node.js 22 與 npm，可開始 Web／PWA 專案。
- 真機 QA：測試設計需由「原生 Android build」改為「手機瀏覽器／PWA」Smoke，等待工程 Web build 後執行。

完整狀態與下一步請見：[工作交接紀錄索引](docs/work-records/README.md)。

## 文件導航

### 產品與設計

- [遊戲開發規格書](docs/Arrow-a-Row-開發規格書.md)
- [畫面流程與 UI 規格](docs/Arrow-a-Row-畫面流程與UI規格.md)
- [系統、關卡與數值設計文件](docs/Arrow-a-Row-系統關卡與數值設計文件.md)
- [第一章垂直切片內容表](docs/Arrow-a-Row-第一章垂直切片內容表.md)
- [工作流程與里程碑計畫](docs/Arrow-a-Row-工作流程與里程碑計畫.md)

### 工程與品質

- [技術設計與程式規範](docs/Arrow-a-Row-技術設計與程式規範.md)
- [M0 工程環境與專案基線紀錄](docs/work-records/M0-ENG-001-工程環境與專案基線.md)
- [M0 QA 裝置矩陣與 Smoke 案例](docs/qa/M0-裝置矩陣與Smoke測試案例.md)

### 角色交付

- [PM](docs/roles/PM-產品與製作管理文件.md)
- [遊戲世界觀規劃師](docs/roles/遊戲世界觀規劃師-世界觀與敘事聖經.md)
- [介面設計師](docs/roles/介面設計師-UIUX設計交付文件.md)
- [建模師](docs/roles/建模師-3D資產與技術美術規格.md)
- [工程師](docs/roles/工程師-實作工作包與接口規格.md)
- [測試人員](docs/roles/測試人員-QA測試策略與驗收手冊.md)

## 接續 M0 的前置條件

工程 M0 需要：

1. Node.js 22 LTS 與 npm（目前環境已具備）。
2. 系統／關卡／數值設計的具名 owner，負責核准後續 content 變更。
3. 部署環境與網域／HTTPS 的 owner（M2 前可用 staging）。

工程師依更新後的技術規範建立 Vite 專案、Three.js WebGL 2 runtime、React UI、IndexedDB、PWA、Vitest／Playwright；QA 再以 iOS Safari 與 Chrome Android 執行 M0 Smoke。

## 工作與提交規則

- 每位角色完成一個 milestone 工作包，必須新增 `docs/work-records/M{n}-{ROLE}-{seq}-*.md`。
- 紀錄需包含輸入、產出、完成標準與證據、風險／阻塞、下一角色交接。
- 每個完成工作包需以獨立 Git commit 提交；不可將多角色交付混在同一提交。
- 功能、內容、UI 與技術變更依 [技術規範](docs/Arrow-a-Row-技術設計與程式規範.md) 的 PR、測試與版本規則執行。

## M0 已完成提交

| Commit | 工作包 |
| --- | --- |
| `842cd4e` | PM：產品基線與交接啟動 |
| `04e079d` | 世界觀：世界核心、術語與第一章文案 |
| `a9ac7d0` | UI：手機資訊架構與直式線框 |
| `50a4f49` | 建模：晨線草原資產基線 |
| `cceecec` | 工程：環境阻塞紀錄 |
| `f397b9f` | QA：裝置矩陣與 Smoke 測試設計 |
