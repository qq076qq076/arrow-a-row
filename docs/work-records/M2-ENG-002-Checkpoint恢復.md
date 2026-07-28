# M2-ENG-002：第一章 Checkpoint 恢復

狀態：Completed｜角色：工程師｜Milestone：M2 垂直切片｜完成日期：2026-07-28｜Commit：`工程(M2)：完成第一章Checkpoint恢復`（以 Git history 的最終 hash 為準）

## 輸入與產出

- 處理 M2-ENG-001 驗收發現的缺口：checkpoint 已寫入但未被 simulation 還原。
- `M1RunSimulation.restore()` 從既有 snapshot 還原進行中的戰鬥或 Reward 狀態，候選 Reward 保持不變。
- 主選單讀取 IndexedDB checkpoint，顯示「繼續本局」，只有玩家點擊後才恢復，避免背景自動開跑。

## 完成標準與證據

| 標準 | 證據 |
| --- | --- |
| 恢復同一個 Reward 候選 | simulation test 比對 restore 前後 rewardOptions。 |
| visibility/pagehide 儲存後可使用 | BrowserLifecycle 的 save callback 持久化 snapshot，啟動時讀取並建立 CTA。 |
| 不破壞既有流程 | Vitest 5 files / 9 tests、build、Playwright Chrome + WebKit 4/4 均通過。 |

## 已知限制

- 恢復時攻擊 cooldown 以安全初值重設；不影響 HP、距離、Boss phase、Gate、Reward、金幣等玩家可見決定性狀態。

## 下一位角色交接：測試人員

執行 M2 regression；特別驗收 checkpoint CTA、Boss／Reward idempotency 和商店重複 tap。
