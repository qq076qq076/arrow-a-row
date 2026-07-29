# M3-QA-002：隨機 Buff 與戰鬥可讀性回歸

狀態：Completed（自動化）／Ready（實機）｜角色：測試人員｜Milestone：M3 系統完成｜完成日期：2026-07-29｜Commit：`測試(M3)：完成隨機Buff戰鬥回歸`（以 Git history 的最終 hash 為準）

## 輸入

- [M3-ENG-010](M3-ENG-010-隨機Buff與小怪掉落.md)：八種 Buff、掉落與遠距 Boss 改動。
- [Buff 系統設計](../Arrow-a-Row-Buff系統設計.md)：效果與產生規則。

## 自動化驗收結果

| 驗收項目 | 證據 | 結果 |
| --- | --- | --- |
| 八種 Buff 皆可成為選項 | 連續六次 Run 抽樣覆蓋 catalog 八種 ID | Pass |
| 前兩組 Gate 維持輸出導向 | 無生命、移速、減傷文字 | Pass |
| Gate 左右不重複且僅套用一次 | Simulation unit case | Pass |
| 小怪掉落三分之一 Buff | 死亡後存在具名稱與 Buff ID 的拾取物 | Pass |
| Boss 遠距進場可受傷 | 進場位置仍大於 15 時 HP 已降低 | Pass |
| 操作回歸 | Chrome Pixel 7、WebKit iPhone 13；觸控與滑鼠流程 | Pass，6/6 |
| 編譯與功能回歸 | Vitest 5 files / 16 tests；production build | Pass |

## 視覺檢查範圍

程式檢查確認道路由 8 提高至 24 個 segment；血條每幀抵銷敵人本體旋轉。這兩項需於實機補做目視驗收，確認在不同螢幕比例與 GPU 上的遠方可讀性。

## 尚待實機

- Android Chrome 與 iOS Safari 各完成一次 CH01，確認 3D 血條沒有轉動、掉落 Buff 文字不被角色或 HUD 遮住。
- 檢查遠距 Boss 受傷時，HP 條的下降與命中特效是否足以讓玩家理解。
- 以低階裝置量測 24 段道路下戰鬥時的 FPS 與記憶體。

## 下一位角色交接：介面設計師／工程師

若實機發現掉落文字不可讀，優先調整文字尺寸、對比、遠距淡出或 HUD 的 Build 摘要；不得在 M3 再擴充新的 Buff 類型。
