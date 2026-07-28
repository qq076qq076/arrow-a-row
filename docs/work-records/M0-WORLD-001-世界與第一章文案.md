# M0-WORLD-001：世界核心、第一章文本與術語交接

狀態：Completed｜角色：遊戲世界觀規劃師｜Milestone：M0 啟動與基線｜完成日期：2026-07-28｜Commit：`docs(world): complete M0 narrative handoff`（查詢本檔案 Git history）

## 接收輸入

- [M0-PM-001](M0-PM-001-產品基線.md)
- [世界觀與敘事聖經](../roles/遊戲世界觀規劃師-世界觀與敘事聖經.md)
- [第一章垂直切片內容表](../Arrow-a-Row-第一章垂直切片內容表.md)
- [畫面流程與 UI 規格](../Arrow-a-Row-畫面流程與UI規格.md)

## 完成產出

1. 將世界核心固定為「織光原野／光軌／靜滯／引線者／回響」；其玩法對應已在世界觀聖經定義。
2. 交付第一章 `晨線草原`、Boss `苔冠守衛` 的開場、Phase、擊殺與結算文案。
3. 建立可由工程匯入的 [localization_narrative.csv](../content/localization_narrative.csv)，含繁中、英文、畫面 ID、觸發、字數限制。
4. 建立 [術語表](../content/世界觀術語表.md)，供 UI、建模、工程與 QA 使用。

## 完成標準與證據

| 標準 | 結果 |
| --- | --- |
| 三章／第一章的世界主題與命名可支持玩法 | 世界觀聖經第 2–3 節及術語表。 |
| 第一章所有必要玩家可見文案有繁中／英文 key | localization CSV 13 筆 key，覆蓋章節、Boss、Gate、結算、主選單與儲存錯誤。 |
| Gate 文案功能優先且符合字數限制 | `gate.sword_orbit.subtitle` 14 字上限，僅為功能副標。 |
| 不含參考作品可辨識 IP | 術語表禁用規則與全新世界名詞。 |
| 下一角色可直接使用 | UI 可綁 key，建模可依 CH01 mood／Boss 名稱，工程可匯入 CSV。 |

## 已知限制

- 第二、三章的逐字文案只需在 M4 Content Complete 前交付；目前只鎖定章節／Boss 名稱與情緒。
- 音效命名／台詞不在本工作包；待 PM 指派音效 owner。

## 下一位角色交接：介面設計師

使用 CSV 的 `screen_id`、字數上限與術語表，完成 M0 直式資訊架構、關鍵畫面低保真 flow、safe-area 及 Gate／Reward 文案容器規格。不得把文字轉為模型貼圖；所有顯示採 localization key。
