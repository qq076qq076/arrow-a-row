# M2-ENG-006：前兩波純輸出 Gate

狀態：Completed｜角色：工程師｜Milestone：M2 垂直切片｜完成日期：2026-07-29｜Commit：`工程(M2)：調整前兩波獎勵為純輸出`（以 Git history 的最終 hash 為準）

## 規則調整

| 項目 | 調整後 |
| --- | --- |
| 初始箭矢 | 固定為 `1`。 |
| Gate 1 | 左 `+1 箭矢`；右 `箭傷 +25%`。 |
| Gate 2 | 左 `+1 箭矢`；右 `箭傷 +25%`。 |
| 前兩波生命類增益 | 完全移除最大 HP、治療、回復。 |

## 驗收證據

- 新增 unit test 鎖定初始箭數為 1 與前兩 Gate 無 HP／生命／回復／治療文字。
- Vitest：5 files / 11 tests 通過。
- production build 通過；Playwright Chrome/WebKit：6/6 通過。

## 下一位角色交接：QA

確認兩個 Gate 的方塊內嵌文字皆只出現箭矢或箭傷，右側選擇不改變 HP／最大 HP。
