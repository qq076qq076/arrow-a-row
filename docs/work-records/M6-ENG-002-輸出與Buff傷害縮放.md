# M6-ENG-002：輸出與 Buff 傷害縮放

狀態：Completed｜角色：工程師｜Milestone：M6 關卡節奏重整｜完成日期：2026-07-30

## 需求

- 降低輸出的初始值與 Buff 加傷害為原本的三分之一。
- 地面掉落 Buff 改用寶箱模型。
- 檢查文件，使目前規則與程式實作一致。

## 目前數值

「初始輸出」採箭矢與自動電擊兩項基礎輸出；一般 Buff 的傷害加成同步縮放。回響獎勵是獨立系統，維持原本數值。

| 項目 | 原值 | 目前值 |
| --- | ---: | ---: |
| 箭矢基礎傷害 | 0.8 | `0.8 / 3 ≈ 0.267` |
| 自動電擊傷害／秒 | 5 | `5 / 3 ≈ 1.667` |
| `power_shot` Gate | +25% | `+25% / 3 ≈ +8.3%` |
| `power_shot` 小怪掉落 | +8% | `+8% / 3 ≈ +2.8%` |
| `lightning_damage` Gate | +2 | `+2 / 3 ≈ +0.67` |
| `lightning_damage` 小怪掉落 | +1 | `+1 / 3 ≈ +0.22` |

程式中的精確值使用除法保留，HUD 顯示值則以一位小數或兩位小數四捨五入。

## 模型與提示文字

- Gate Buff 維持 Lantern 01。
- 小怪掉落的地面 Buff 使用 Poly Haven Treasure Chest，不再與 Gate 共用燈籠模型。
- 掉落提示文字使用與打怪掉落一致的可讀尺寸，現行 3D 文字字型尺寸為 `128px`。

## 文件同步

- 現行 Buff 清單、倍率與掉落／Gate 模型記錄於 `docs/Arrow-a-Row-Buff系統設計.md`。
- 三輪五波與章內回響三選一記錄於 `docs/work-records/M6-PM-001-三輪五波與回響流程.md` 與 `docs/work-records/M6-ENG-001-三輪五波與章內回響實作.md`。
- M5 的初始輸出表保留作歷史基線，並在 `M5-ENG-004` 明確標示 M6 修訂值。

## 驗證

- `npm test -- --run`：33 tests passed。
- `npm run build`：production build passed；保留既有 Vite chunk size warning。
