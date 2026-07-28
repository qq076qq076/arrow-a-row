# 測試人員：QA 測試策略與驗收手冊

版本：0.1｜平台：iOS／Android｜基線：[遊戲規格](../Arrow-a-Row-開發規格書.md)、[UI 規格](../Arrow-a-Row-畫面流程與UI規格.md)、[技術規範](../Arrow-a-Row-技術設計與程式規範.md)

## 1. QA 目標與責任

QA 驗證規格是否被正確實作、玩家是否能穩定完成流程、資料是否安全、目標手機是否可接受；QA 不替設計決定平衡方向，但需以證據指出可讀性、難度與技術風險。每個 defect 必可重現、分類、追蹤並在修復 build 回歸。

## 2. 裝置矩陣

| 群組 | 至少覆蓋 | 重點 |
| --- | --- | --- |
| Android Low | Android 10、3–4 年前中階、挖孔／手勢 | 30 FPS、記憶體、熱、safe area。 |
| Android Standard | Android 12+ 主流機 | 60 FPS、不同解析度、背景恢復。 |
| Android High | 近兩年旗艦 | 120Hz 螢幕與 60 FPS lock、Vulkan／OpenGL fallback。 |
| iPhone 非瀏海／瀏海 | iOS 15+ 各一 | safe area、背景、通知／來電。 |
| iPad | 4:3 或近似比例 | UI 重排、拖曳、效能。 |

每次 RC 至少跑 Low Android、Standard Android、瀏海 iPhone、iPad；OS 更新或 Unity／SDK 更新後擴大矩陣。

## 3. 測試層級與案例集

| 套件 | 何時跑 | 核心案例 |
| --- | --- | --- |
| Smoke | 每日 build | 冷啟動、新局、過門、Boss、結算、商店、返回。 |
| Functional | 每個 Epic QA Ready | 狀態機、能力、敵人、Boss、UI state。 |
| Save/Lifecycle | 每次存檔相關改動 | 交易、migration、背景、OS 回收、飛航模式。 |
| Regression | RC／hotfix | 已修 P0/P1、核心流程與高風險區。 |
| Compatibility | RC | 裝置矩陣、safe area、字級、語言、低電量。 |
| Performance/Soak | nightly／RC | 100 Run、長時間背景切換、記憶體／溫度／FPS。 |
| Exploratory | 每週 playtest | 壞 RNG、誤觸、未預期流程、玩家理解。 |

## 4. P0 測試清單

1. 新檔：進主選單 → 新局 → 單手拖曳 → Gate → 戰鬥 → Boss 獎勵 → 死亡／勝利 → 商店 → 再玩。
2. Gate：斜向高速穿過、同幀兩門、過門時死亡／暫停／切後台；每組只能套用一次。
3. 戰鬥：暴擊、穿透、多箭、飛劍、寵物、護盾、吸血、Boss phase、投射物清除。
4. Reward：三卡、重擲、不足金幣、互斥卡、滿層卡、選卡後立即切後台。
5. 存檔：商店購買中斷、Run checkpoint、壞檔、舊 schema、死亡／勝利重開、重複結算。
6. 生命週期：鎖屏、來電、通知、背景 30 秒、OS 強制終止、回前景、網路切換。
7. UI：瀏海、挖孔、手勢列、720×1280、1080×1920、平板、繁中／英文、150% 字級、色弱模式。

## 5. 缺陷規格

| 等級 | 定義 | SLA |
| --- | --- | --- |
| P0 Blocker | crash、資料遺失、無法開始／結算、付費誤扣、不可恢復 Run | 停止 RC；立即 owner；修復後全回歸。 |
| P1 Critical | 核心玩法錯誤、嚴重效能、主要裝置不可用 | 當前版本修；若無法修需 PM Go/No-Go。 |
| P2 Major | 顯著 UI、內容、平衡或特定裝置問題 | 排入最近 sprint。 |
| P3 Minor | 不阻塞的視覺／文案問題 | 排程修復或累積處理。 |

Bug 格式：標題、build／Git SHA、裝置／OS、帳號狀態、seed、前置、精確步驟、實際／預期、頻率、錄影／截圖、log、影響、回歸案例。沒有可重現步驟的問題標 `Needs Investigation`，不可直接關閉。

## 6. 驗收證據與發版建議

QA 對每個 AC、UI、MOB 編號建立測試案例與證據連結。RC 報告必含：測試範圍、裝置矩陣、通過／失敗數、未修問題與風險、FPS／記憶體資料、crash／ANR、存檔與前後台結果、Go／No-Go 建議。QA 建議不是最終商業決策，但 PM 若覆蓋 P0／P1 建議必須留書面風險接受紀錄。
