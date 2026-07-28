# Arrow a Row：跨職能工作流程與里程碑計畫

版本：0.1｜平台：iOS／Android 手機優先｜適用角色：PM、遊戲世界觀規劃師、介面設計師、建模師、工程師、測試人員

關聯文件：[遊戲規格](Arrow-a-Row-開發規格書.md)、[UI 規格](Arrow-a-Row-畫面流程與UI規格.md)、[技術規範](Arrow-a-Row-技術設計與程式規範.md)、[角色文件](roles/)。

## 1. 目的與基本原則

本計畫將完整遊戲拆為可驗收的工作階段，避免「所有人先做素材、最後才發現不好玩或跑不動」。每個 milestone 都必須產生可玩的 build 或可審查的明確產物；只有通過 Gate 才能擴大內容量。

核心原則：

1. **先驗證風險，再擴張內容**：先做單手操作、戰鬥、存檔／前後台、低階機效能，再做三章完整內容。
2. **規格單一來源**：需求以既有 GDD、UI、技術規範為準；衝突由 PM 發起決策紀錄後修正文檔。
3. **每個交接有可驗收契約**：不是「檔案交了」就完成，而是接收者能在指定環境使用、QA 能測。
4. **可回退、可重現**：內容 ID、seed、存檔版本、Git SHA、Unity／package 版本均需追蹤。
5. **手機真機優先**：Editor 可玩不代表完成；每個核心 milestone 都要在目標 Android／iPhone 上驗證。

## 2. 角色責任地圖（RACI）

R=執行、A=最終負責、C=諮詢、I=知會。

| 工作面向 | PM | 世界觀 | UI | 建模 | 工程 | QA |
| --- | --- | --- | --- | --- | --- |
| 產品範圍／版本 | A/R | C | C | C | C | C |
| 玩法、數值、關卡需求 | A | C | C | I | R（可行性） | C |
| 世界觀、命名、敘事文案 | A | R | C | C | I | C |
| 使用流程與視覺系統 | A | C | R | C | C | C |
| 3D 資產／動畫／Prefab | I | C | C | R | C | C |
| 客戶端、資料、平台、工具 | I | I | C | C | A/R | C |
| 測試策略、驗收與缺陷 | I | I | C | C | C | A/R |
| 發版 Go／No-Go | A | I | I | I | C | R（品質建議） |

> 注意：目前指定角色中沒有獨立「系統／關卡／數值設計師」。此責任必須由 PM 指派一位 owner（建議 PM 或工程 lead 兼任但需明確寫在 backlog），否則能力、敵人、Boss 與經濟沒有可驗收的內容來源。

## 3. 標準工作流程

```text
提出玩家問題／內容需求
 → PM 整理成可驗收需求卡
 → 世界觀/UI/建模/工程做可行性與設計輸入
 → PM 進 Ready，排入 milestone
 → 工程灰盒＋UI wireframe／資產 blockout
 → 內部 playtest 與 QA 測試
 → 修正、真機驗證、PR 審查
 → PM + QA 驗收
 → 合併 main、更新文件與版本紀錄
```

### 3.1 工作卡生命週期

| 狀態 | 進入條件 | owner 產出 | 離開條件 |
| --- | --- | --- | --- |
| Draft | 想法／問題已提出 | 問題描述與玩家價值 | PM 補齊需求。 |
| Ready | 範圍、驗收、owner、依賴已明確 | 已估點的工作卡 | 團隊承諾進 sprint。 |
| In Progress | 已開始實作 | 每日更新阻塞 | 有可審查內容。 |
| In Review | 提交設計／PR／資產 | review checklist | reviewer 核准。 |
| QA Ready | 已整合至測試 build | 測試說明、seed／資料 | QA 開始測。 |
| Verified | QA 通過 | 測試證據 | PM 依 milestone 納入。 |
| Done | 文件、監控、版本完成 | release note／資產索引 | 已進 main／發布版本。 |

### 3.2 需求進 Ready 的最小條件

- 玩家問題、預期行為、非範圍、AC（驗收條件）完整。
- 連結相關 GDD／UI／技術條目；需新增世界觀、模型或文案時已有 owner。
- 內容資料有 ID、數值單位、解鎖條件、稀有度／權重（如適用）。
- 已標註存檔、RNG、效能、前後台、平台／隱私影響。
- 有測試方式與目標裝置，且依賴已排定。

## 4. 完整遊戲里程碑

時程以「週」表示相對順序，應由 PM 依團隊人數與實際速度換成日期；不可在尚未通過前一 Gate 時機械地開始後續內容量產。

| Milestone | 建議期間 | 核心問題 | 可玩的結果 |
| --- | ---: | --- | --- |
| M0 啟動與基線 | 1–2 週 | 我們要做什麼、如何驗收？ | 文件、repo、手機空殼。 |
| M1 核心灰盒 | 2–3 週 | 單手左右與自動射擊是否有趣？ | 60 秒灰盒 Run。 |
| M2 垂直切片 | 4–6 週 | 一章完整循環能否在手機跑穩？ | 第一章完整品質樣本。 |
| M3 系統完成 | 4–6 週 | 完整遊戲系統是否可串接與保存？ | 三章灰盒＋所有核心系統。 |
| M4 內容完成 | 5–8 週 | 三章內容是否足夠、原創、平衡？ | 從頭到尾可玩 Beta。 |
| M5 Beta／平衡 | 3–5 週 | 玩家能否理解、穩定、持續玩？ | 外部測試候選版。 |
| M6 RC／發版 | 2–4 週 | 能否安全上架與營運？ | Signed release candidate。 |
| M7 上架後穩定期 | 2 週 | 真實裝置是否穩定？ | 穩定版／hotfix 決策。 |

## 5. 各 Milestone 詳細工作包

### M0：啟動與基線

**目標**：所有人對產品、技術、內容邊界與交接方式有同一理解。

| 角色 | 必做交付物 |
| --- | --- |
| PM | Product brief、MVP／非範圍、backlog 初稿、風險台帳、決策紀錄模板。 |
| 世界觀 | 世界核心、三章名稱／情緒、命名規則、禁用元素。 |
| UI | 9:16 information architecture、主選單／HUD／獎勵低保真 flow、safe-area 規則。 |
| 建模 | 三章 moodboard、主角／敵人形狀語言、資產預算、Import preset。 |
| 工程 | Unity 6.3 LTS 專案、asmdef、CI 最小編譯、Android/iOS 空殼、coding baseline。 |
| QA | 裝置矩陣、測試計畫、bug template、M0 smoke checklist。 |

**Gate M0**：三份主規格及角色文件已核准；repo 可在乾淨環境建置 Android debug；所有角色／工作卡有 owner；未解決的系統設計 owner 已指定。

### M1：核心灰盒

**目標**：只驗證核心 60 秒體驗，禁止先追求完整美術。

| 工作包 | 最低內容 | 主要 owner |
| --- | --- | --- |
| 操作 | 直式單手拖曳、邊界、手指／UI 區隔、Android Back 暫停 | 工程＋UI。 |
| 戰鬥 | 自動索敵、箭、1 近戰敵、1 遠程敵、傷害、HP、死亡 | 工程。 |
| 路徑 | 2 組左右 Gate、立即加傷／箭數、一次戰鬥門 | 工程＋系統 owner。 |
| 回饋 | 灰盒傷害數字、命中、低血、門選取 | UI＋工程。 |
| 測試 | 5 人快速 playtest、Low Android、iPhone 真機 | QA。 |

**Gate M1**：新玩家 10 秒內能移動與過門；Gate 不會雙選；自動射擊可理解；60 秒無 soft lock；Low 裝置 30 FPS、Standard 60 FPS；至少 3 項 playtest 改善已完成。若失敗，回到 M1 調整手感，不進行內容量產。

### M2：垂直切片

**目標**：證明「一章完整品質」能運作，這是美術、UI、技術與存檔的共同驗證。

| 區域 | 最低交付 |
| --- | --- |
| 遊戲 | 第一章 4–6 Gate、3 戰鬥段、1 精英、1 Boss（2 phase）、三選一、重擲。 |
| Build | 弓箭、生存、飛劍各至少 3 能力；一種明確可成形 Build。 |
| Meta | 金幣結算、至少 3 項永久升級、商店、發現解鎖。 |
| UI | 高保真主選單、HUD、暫停、Build、獎勵、結算、商店、錯誤／恢復。 |
| 美術 | 主角、章 1 環境、2 普通敵、Boss、基本動畫與原創 UI 風格。 |
| 技術 | checkpoint、前後台恢復、內容 validator、pool、seed replay。 |
| QA | 端到端案例、背景／OS 回收、safe area、初步效能 profile。 |

**Gate M2**：可由新檔完整遊玩至第一 Boss、選獎勵、死亡／結算／商店／重開；所有 P0 AC 通過；真機恢復不重抽／不重複給金；Standard 裝置戰鬥 P95 <16.7ms。M2 是是否繼續投資完整內容的主要 Go/No-Go。

### M3：系統完成（Feature Complete）

**目標**：不新增核心系統；先讓完整遊戲的骨架、存檔與所有高風險流程打通。

| 工作包 | 交付 |
| --- | --- |
| 章節骨架 | 三章的 segment flow、Boss script、難度曲線與灰盒內容。 |
| Build 系統 | 24 一般能力 schema、12 Boss 獎勵 schema、互斥／stack／pity／權重。 |
| 敵人系統 | 4 普通敵、精英 modifier、3 Boss 的資料驅動腳本。 |
| 完整 Meta | 6 永久升級、成就資料、所有 migration 與解鎖流程。 |
| 設定與平台 | 30／60 FPS、低特效、音效、色弱、安全區、離線、生命週期。 |
| 工具 | content validator、seed／事件 log、bot／soak 基礎工具。 |

**Gate M3**：可從頭到尾用灰盒完整通關；沒有 placeholder 系統、沒有未決定的存檔 schema；每個能力／敵人／Boss 有資料 validation；P0 功能完成。此後新增功能必須取代既有 scope，而非擴張。

### M4：內容完成（Content Complete）

**目標**：以已鎖定系統導入所有最終內容與文案，進入可平衡 Beta。

| 角色 | 完成工作 |
| --- | --- |
| PM | 內容 burn-down、feature freeze、外部測試招募與版本計畫。 |
| 世界觀 | 全部章節／Boss／能力／錯誤的繁中與英文 localization、術語表鎖定。 |
| UI | 最終 design system、所有狀態、平板適配、低特效／色弱檢查。 |
| 建模 | 3 章 kit、所有敵人／Boss／夥伴／動畫、LOD、Addressables、授權清單。 |
| 工程 | 資產整合、內容 bundle、品質設定、analytics consent gate、crash hooks。 |
| QA | 全內容回歸、缺失資產／文案／引用檢查、100 Run soak。 |

**Gate M4**：3 章、3 Boss、24／12 能力、4 敵人、6 Meta 升級、12 成就完成；繁中／英文無缺 key；content validator 全通過；無 placeholder 文案／資產；從乾淨安裝可離線完成整局。

### M5：Beta、平衡與相容性

**目標**：用測試者資料驗證難度、可讀性、穩定性；只修正與調整，不新增大型內容。

| 活動 | 產出 |
| --- | --- |
| 封閉 playtest | 行為錄影、問卷、首局漏斗、誤觸與困惑點。 |
| 平衡 run | 30 位玩家／1,000 bot run，三 Build 的勝率、TTK、選取率。 |
| 相容性 | 裝置矩陣、OS、safe area、網路、前後台、低電量。 |
| 效能 | frame time、記憶體、溫度、啟動、ANR／crash。 |
| 回歸 | 每修復一個 P0/P1，對應 regression case 與完整 smoke。 |

**Gate M5**：首局、三 Build、效能與手機驗收 KPI 達標或 PM 正式接受風險；P0=0；P1 均有修復或明確延期理由；沒有未測試的內容／裝置變更。

### M6：RC 與發版

**目標**：產出可重現、可簽署、合規的發版候選。

| 工作 | Owner |
| --- | --- |
| 版本凍結、release checklist、商店 metadata、截圖、隱私說明 | PM＋UI＋世界觀。 |
| Signed AAB／IPA、versionCode、proguard／symbol、crash mapping | 工程。 |
| 最終 smoke、RC 回歸、商店安裝、restore／刪除資料流程 | QA。 |
| 發行 build 視覺／音訊／授權最終確認 | 建模＋世界觀＋PM。 |

**Gate M6**：release artifact 可由 Git SHA、Unity／package lock、content version、CI run 重現；商店流程通過；P0=0；PM 和 QA 有書面 Go／No-Go；回滾版本已準備。

### M7：上架後穩定期

第一階段採小比例 rollout。每日檢查 crash-free、ANR、啟動失敗、checkpoint 失敗、首局完成率、設備集中問題。觸發 rollback：P0 資料遺失、crash 明顯超門檻、主要裝置無法開始／恢復。兩週穩定後才排入下一版內容與功能。

## 6. 跨職能交接清單

| 交接 | 提供物 | 接收者驗收 |
| --- | --- | --- |
| 世界觀 → UI／建模 | 章節 brief、術語、文案 key、moodboard、禁用項 | 功能詞可讀、可放入畫面、形狀／色彩可執行。 |
| UI → 工程 | flow、wireframe、高保真、redline、state matrix、asset export | 所有 state／safe area／觸控行為明確，無未定義狀態。 |
| 建模 → 工程 | 原檔、FBX、貼圖、Prefab、socket、LOD、材質統計 | 可 import、無 missing ref、預算內、label 正確。 |
| PM／系統 owner → 工程 | 資料表、ID、數值、條件、AC | 可 validator 驗證、無模糊邏輯。 |
| 工程 → QA | build、變更清單、測試帳號／seed、已知問題、log 位置 | 能安裝、能重現、測試範圍可判定。 |
| QA → PM／工程 | defect、證據、風險、回歸結果 | 有嚴重度、owner、版本與可執行下一步。 |

## 7. 品質 Gate 與發版規則

| 類型 | 不可妥協項 |
| --- | --- |
| 功能 | 無法開始、結算、存檔、背景恢復、Gate／Reward 重複套用均為 P0。 |
| 技術 | 目標裝置 P95 frame time、記憶體、crash／ANR、離線與 safe area。 |
| 內容 | 所有內容資料有效、ID 唯一、無 placeholder、無未授權資產、文案完整。 |
| UI | 觸控命中範圍、誤觸防護、低血／預警／Gate 可讀、色弱模式。 |
| 流程 | PR review、CI 綠燈、測試證據、版本可追溯、決策有紀錄。 |

任何 Gate 未通過時可採三種行動：`Hold`（先修復）、`Reduce Scope`（移除低價值內容）、`Accept Risk`（僅 PM 可決定，QA／工程需留下具體風險與期限）。不得以「之後再看」取代決策。

## 8. 每週作業節奏與儀表板

| 時間 | 行動 | PM 維護的看板 |
| --- | --- | --- |
| 週一 | 規劃、依賴確認、風險排序 | milestone burn-down、Ready 卡。 |
| 每日 | 15 分鐘同步 | 阻塞、build 狀態、P0/P1。 |
| 週三 | 真機 playtest／內容 review | 觀察、影片、改善項。 |
| 週四 | QA triage | 缺陷 aging、回歸、裝置覆蓋。 |
| 週五 | Demo／retrospective | 已驗收結果、範圍差異、下週承諾。 |

儀表板最少顯示：milestone 狀態、完成／剩餘工作、P0/P1、CI 成功率、測試案例通過率、目標裝置 FPS／記憶體、內容完成度、已知風險 owner／截止日。

## 9. 文件維護

- PM 是本計畫 owner；任何 milestone scope 變更同步更新本文件與角色文件。
- 工程規範、UI flow、GDD 的版本號在每次 Gate 記錄；build notes 寫入使用的版本組合。
- 每個 milestone 結束做 retrospective：保留有效流程、修正失敗交接、更新下一階段 checklist。文件不是一次性產物，而是團隊的執行合約。
