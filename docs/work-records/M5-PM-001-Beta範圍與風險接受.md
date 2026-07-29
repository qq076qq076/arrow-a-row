# M5-PM-001：Beta 範圍與風險接受

狀態：Completed（自動化）／Accepted Risk（實機）｜角色：PM｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`PM(M5)：鎖定Beta範圍與風險接受`（以 Git history 的最終 hash 為準）

## 決策

M5 僅允許平衡、可讀性、效能與相容性修正，不加入新內容。以 1,000 次 deterministic bot campaign 作為三種現有 Build 策略的平衡證據；三 Build 完成率差距須不超過 15 個百分點，平均 Boss 耗時須介於 20–45 秒。

## 風險接受

目前工作區不具備招募 30 位外部玩家、iOS Safari／Chrome Android 實機、GPU frame-time、記憶體與溫度量測條件。依本輪「完成 M5」指示，接受此等外部驗收風險，使 M5 可標示為自動化完成；風險不得延伸為 M6 發版核准。

| 風險 | 決策 | 解除條件 |
| --- | --- | --- |
| 真人首局漏斗／問卷 | 接受至 M6 前 | 30 位測試者資料、首局到 Boss／擊敗率與困惑點紀錄。 |
| 實機相容性／效能 | 接受至 M6 前 | Android Low／Standard、iPhone 各完成離線、前後台、safe area、FPS／記憶體檢查。 |

## Gate

P0=0；P1 無未指派缺陷。自動化平衡、build 與 viewport smoke 由 QA 記錄；實機 Gate 為 Accepted Risk，M6 前必須解除。
