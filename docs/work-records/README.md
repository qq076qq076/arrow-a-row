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
| 5 | 工程師 | CH01 端到端玩法、存檔與商店 | Completed | [M2-ENG-001](M2-ENG-001-第一章端到端實作.md)、[M2-ENG-002](M2-ENG-002-Checkpoint恢復.md)、[M2-ENG-003](M2-ENG-003-桌機鏡頭與輸入修正.md)、[M2-ENG-004](M2-ENG-004-自適應主角取景.md)、[M2-ENG-005](M2-ENG-005-Gate內嵌獎勵文字.md)、[M2-ENG-006](M2-ENG-006-前兩波純輸出Gate.md)、[M2-ENG-007](M2-ENG-007-怪物辨識與擊殺回饋.md) | `工程(M2)：完成第一章垂直切片玩法`、`工程(M2)：完成第一章Checkpoint恢復`、`工程(M2)：修正桌機鏡頭與滑鼠操作`、`工程(M2)：確保主角在各視窗可見`、`工程(M2)：將獎勵文字置於Gate方塊`、`工程(M2)：調整前兩波獎勵為純輸出`、`工程(M2)：加入怪物辨識與擊殺動畫` |
| 6 | 測試人員 | M2 垂直切片回歸 | Completed（自動化）／Ready（實機） | [M2-QA-001](M2-QA-001-第一章垂直切片回歸.md) | `測試(M2)：完成第一章垂直切片回歸` |

## M3：系統完成

| 順序 | 角色 | 工作包 | 狀態 | 紀錄 | Commit |
| ---: | --- | --- | --- | --- | --- |
| 1 | PM | 六章關卡、敵人血量曲線與資料合約 | Completed | [M3-PM-001](M3-PM-001-六章關卡與血量曲線.md) | `PM(M3)：完成六章關卡與血量規劃` |
| 2 | 工程師 | 永久成長生效、血條、命中與晶塵回饋 | Completed | [M3-ENG-001](M3-ENG-001-成長與戰鬥回饋.md) | `工程(M3)：完成成長與戰鬥回饋` |
| 3 | 工程師 | 六章選擇、血量套用與灰盒資料骨架 | Completed | [M3-ENG-002](M3-ENG-002-六章資料驅動灰盒.md) | `工程(M3)：接入六章血量成長系統` |
| 4 | 工程師 | 連續六章接續與 Build 繼承 | Completed | [M3-ENG-003](M3-ENG-003-連續六章Run.md) | `工程(M3)：完成連續六章Build繼承` |
| 5 | 工程師 | CH02 鏡潮高架灰盒內容 | Completed | [M3-ENG-004](M3-ENG-004-鏡潮高架灰盒內容.md) | `工程(M3)：完成鏡潮高架灰盒內容` |
| 6 | 工程師 | 章節解鎖與 IndexedDB 保存 | Completed | [M3-ENG-005](M3-ENG-005-章節解鎖與保存.md) | `工程(M3)：完成章節解鎖與保存` |
| 7 | 測試人員 | 六章長流程回歸 | Completed（自動化）／Ready（實機） | [M3-QA-001](M3-QA-001-六章長流程回歸.md) | `測試(M3)：完成六章長流程回歸` |
| 8 | 工程師 | 擴充箭速與飛劍 Gate Buff | Completed | [M3-ENG-008](M3-ENG-008-擴充GateBuff.md) | `工程(M3)：擴充箭速與飛劍Buff` |
| 9 | 工程師 | 戰鬥節奏、遠距 Boss 進場與自動射箭 | Completed | [M3-ENG-009](M3-ENG-009-戰鬥節奏與Boss進場.md) | `工程(M3)：調整戰鬥節奏與Boss進場` |
| 10 | 工程師 | 隨機八種 Buff、小怪掉落與遠距 Boss 受傷 | Completed | [M3-ENG-010](M3-ENG-010-隨機Buff與小怪掉落.md) | `工程(M3)：完成隨機Buff與小怪掉落` |
| 11 | 測試人員 | 隨機 Buff、掉落與戰鬥可讀性回歸 | Completed（自動化）／Ready（實機） | [M3-QA-002](M3-QA-002-隨機Buff與戰鬥可讀性回歸.md) | `測試(M3)：完成隨機Buff戰鬥回歸` |
| 12 | 工程師 | 多箭扇形彈道 | Completed | [M3-ENG-011](M3-ENG-011-扇形箭矢彈道.md) | `工程(M3)：完成扇形箭矢彈道` |
| 13 | 工程師 | 戰鬥密度、隨機站位與隨機回響 | Completed | [M3-ENG-012](M3-ENG-012-戰鬥密度與隨機回響.md) | `工程(M3)：提升戰鬥密度與隨機回響` |
| 14 | 工程師 | 箭矢碰撞與穿透 Buff | Completed | [M3-ENG-013](M3-ENG-013-箭矢碰撞與穿透Buff.md) | `工程(M3)：完成箭矢碰撞與穿透Buff` |
| 15 | 工程師 | 固定正前方箭矢方向 | Completed | [M3-ENG-014](M3-ENG-014-正前方箭矢方向.md) | `工程(M3)：修正箭矢固定正前方` |
| 16 | 介面設計師／工程師 | Build HUD 與正前方瞄準提示 | Completed | [M3-UI-002](M3-UI-002-BuildHUD與瞄準提示.md) | `介面(M3)：加入Build狀態與瞄準提示` |
| 17 | 介面設計師／工程師 | Buff 掉落圖示與放大說明 | Completed | [M3-UI-003](M3-UI-003-Buff圖示與可讀性.md) | `介面(M3)：放大Buff文字並加入圖示` |

## M4：內容完成

| 順序 | 角色 | 工作包 | 狀態 | 紀錄 | Commit |
| ---: | --- | --- | --- | --- | --- |
| 1 | PM | M4 Web 內容範圍、Gate 與交付順序凍結 | Completed | [M4-PM-001](M4-PM-001-內容完成範圍凍結.md) | `PM(M4)：凍結Web內容完成範圍` |
| 2 | 遊戲世界觀規劃師 | CH01–CH03 localization 與術語鎖定 | Completed | [M4-WORLD-001](M4-WORLD-001-前三章Localization鎖定.md) | `世界觀(M4)：鎖定前三章雙語文案` |
| 3 | 介面設計師 | M4 全畫面 state／可近用性規格 | Completed | [M4-UI-001](M4-UI-001-內容完成UI狀態規格.md) | `介面(M4)：鎖定內容完成UI狀態` |
| 4 | 建模師 | 三章程序化資產 kit 與 manifest | Completed | [M4-ART-001](M4-ART-001-三章程序化資產Kit.md) | `建模(M4)：完成三章程序化資產Kit` |
| 5 | 工程師 | 六項永久強化、成就、前三章視覺、品質與離線基線 | Completed | [M4-ENG-001](M4-ENG-001-六項永久強化.md)、[M4-ENG-002](M4-ENG-002-成就資料與保存.md)、[M4-ENG-003](M4-ENG-003-前三章Boss視覺整合.md)、[M4-ENG-004](M4-ENG-004-品質與離線基線.md) | `工程(M4)：完成六項永久強化`、`工程(M4)：加入成就資料與保存`、`工程(M4)：整合前三章Boss視覺`、`工程(M4)：完成品質與離線基線` |
| 6 | 測試人員 | M4 內容回歸、100 Run soak、品質與離線回歸 | Completed（自動化）／Ready（實機） | [M4-QA-001](M4-QA-001-內容回歸與Soak.md)、[M4-QA-002](M4-QA-002-品質與離線回歸.md) | `測試(M4)：完成內容回歸與Soak`、`測試(M4)：完成品質與離線回歸` |

## M5：Beta／平衡與相容性

| 順序 | 角色 | 工作包 | 狀態 | 紀錄 | Commit |
| ---: | --- | --- | --- | --- | --- |
| 1 | PM | Beta 範圍、平衡 KPI 與外部驗收風險接受 | Completed（自動化）／Accepted Risk（實機） | [M5-PM-001](M5-PM-001-Beta範圍與風險接受.md) | `PM(M5)：鎖定Beta範圍與風險接受` |
| 2 | 工程師 | 1,000 局 bot 平衡、回響調整、初始 Gate／Boss 預警、自動電擊、近距離傷害與暫停操作 | Completed | [M5-ENG-001](M5-ENG-001-Bot平衡與回響調整.md)、[M5-ENG-002](M5-ENG-002-初始Gate與Boss預警可讀性.md)、[M5-ENG-003](M5-ENG-003-飛劍替換為自動電擊.md)、[M5-ENG-004](M5-ENG-004-電擊動畫與近距離傷害.md)、[M5-ENG-005](M5-ENG-005-暫停與操作可近用性.md) | `工程(M5)：完成Bot平衡與回響調整`、`工程(M5)：改善初始Gate與Boss預警`、`工程(M5)：以自動電擊取代飛劍`、`工程(M5)：加入電擊動畫與近距離傷害`、`工程(M5)：加入暫停與操作可近用性` |
| 3 | 測試人員 | M5 回歸、viewport 與風險結案 | Completed（自動化）／Accepted Risk（實機） | [M5-QA-001](M5-QA-001-Beta回歸與相容性結案.md) | `測試(M5)：完成Beta回歸與相容性結案` |
| 4 | PM | 可玩性與 GitHub Pages 發布優化 | Completed | [M5-PM-002](M5-PM-002-可玩性與Web發布優化.md) | `PM(M5)：鎖定可玩性與Web發布優化` |
| 5 | 工程師 | GitHub Pages workflow 與 README 公開連結 | Completed（workflow）／Pending（首次遠端部署） | [M5-ENG-006](M5-ENG-006-GitHubPages發布.md) | `工程(M5)：建立GitHub Pages發布` |
| 6 | 工程師 | 修正滑鼠／觸控左右輸入方向 | Completed | [M5-ENG-007](M5-ENG-007-修正左右輸入方向.md) | `工程(M5)：修正左右輸入方向` |
| 7 | 工程師 | 一般怪物生命提高 10% | Completed | [M5-ENG-008](M5-ENG-008-一般怪物生命提高.md) | `工程(M5)：提高一般怪物生命` |
