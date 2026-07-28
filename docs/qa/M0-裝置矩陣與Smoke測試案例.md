# M0：裝置矩陣與 Smoke 測試案例

版本：0.1｜Owner：QA｜狀態：測試設計完成；真機執行等待 ENG M0 解鎖。

## 1. 最小裝置矩陣

| ID | 類型 | OS／螢幕特徵 | 測試優先事項 | M0 實機狀態 |
| --- | --- | --- | --- | --- |
| AND-L | Android Low | Android 10、720×1600、挖孔／手勢列 | 30 FPS、記憶體、safe area、背景恢復 | Pending build |
| AND-S | Android Standard | Android 12+、1080×2400 | 60 FPS、拖曳、Vulkan／OpenGL | Pending build |
| AND-H | Android High | Android 14+、120Hz | FPS lock、溫度、長跑 | Pending build |
| IOS-N | iPhone 瀏海 | iOS 15+、Dynamic Island／瀏海 | safe area、來電／鎖屏、背景 | Pending build |
| IOS-P | iPad | iOS 15+、4:3 | UI 重排、拖曳、效能 | Pending build |

具體型號、OS build、可用儲存空間、網路條件與測試者填入每次 build 的測試報告；不能以模擬器替代 AND-L 或 IOS-N。

## 2. M0 Smoke 案例

| Case ID | 前置 | 操作 | 預期結果 | 執行狀態 |
| --- | --- | --- | --- | --- |
| SMK-001 | 清除網站資料／首次開啟 | 冷啟動 | 在目標時間進主選單，無 uncaught error／瀏覽器崩潰。 | Pending web build |
| SMK-002 | 主選單 | 開始新局 | 建立單一 Run，無重複載入。 | Blocked: no build |
| SMK-003 | Run | 在非 UI 區單手左右拖曳 | 角色橫移；點 UI 不會移動角色。 | Blocked: no build |
| SMK-004 | Run | 開暫停、恢復 | simulation 停止／恢復；無殘留移動。 | Blocked: no build |
| SMK-005 | Run | 切後台 30 秒再回前景 | 顯示已自動暫停；無額外傷害。 | Blocked: no build |
| SMK-006 | Run | OS 終止後重開 | 主選單出現可繼續 checkpoint。 | Blocked: no build |
| SMK-007 | 任意畫面 | 檢查瀏海、挖孔、手勢列 | CTA、HP、Gate 關鍵文字未被裁切。 | Blocked: no build |
| SMK-008 | 飛航模式／PWA | 開始／結束一局 | 已快取內容可玩、本地結算可用。 | Pending web build |

## 3. 執行與證據規則

每個案例要附：網站版本／Git SHA、Node／package-lock hash、content version、asset manifest hash、裝置／瀏覽器／OS、結果、錄影或截圖、console log、實測啟動時間／FPS（如適用）、bug ID。失敗案例不可只寫「失敗」；需填實際行為與重現率。

## 4. ENG M0 解鎖後的 QA 順序

1. 安裝 Android debug build，執行 SMK-001～004。
2. 在 AND-L 與 IOS-N 執行 SMK-005～008。
3. 將結果寫入 `docs/work-records/M0-QA-002-真機Smoke執行.md`，並獨立 commit。
4. 所有 Smoke 通過後，QA 才可將 M0-QA 真機階段標為 Completed，並允許 M1 進行真機驗收。
