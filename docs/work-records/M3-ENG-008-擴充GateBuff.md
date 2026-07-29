# M3-ENG-008：擴充 Gate Buff

狀態：Completed｜角色：工程師｜Milestone：M3 系統完成｜完成日期：2026-07-29｜Commit：`工程(M3)：擴充箭速與飛劍Buff`（以 Git history 的最終 hash 為準）

新增第三組 Gate：左側 `箭速 +25%`、右側 `飛劍 +1`；箭速實際套用至投射物前進速度，飛劍數會保留至下一章。原有箭數與箭傷 Gate 保留。

驗收：新增箭速／飛劍單元測試；Vitest 14、production build、Chrome/WebKit 6/6 通過。
