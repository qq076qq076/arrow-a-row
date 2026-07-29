# M5-ENG-010：Bot 測試 CI 逾時容錯

狀態：Completed｜角色：工程師｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`工程(M5)：調整Bot測試CI逾時`（以 Git history 的最終 hash 為準）

維持 1,000 局確定性 Beta Bot 平衡驗收的覆蓋範圍，並僅對這一項計算密集的測試設定 45 秒專屬逾時。CI 的預設 5 秒逾時會受到共享 runner CPU 效能影響；此變更不放寬任何完成率、Boss 時間或選擇次數的斷言。

驗證：單獨執行 Bot 平衡測試與完整 Vitest 測試組。
