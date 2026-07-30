# M6-ENG-005：碰撞擊殺與吸血 Buff

狀態：Completed｜角色：工程師｜Milestone：M6 關卡節奏重整｜完成日期：2026-07-30

## 實作

- 人物與怪物碰撞時，扣除等同怪物當前生命值的 HP，並立即將怪物生命值降為 0，保留死亡表現與 Buff 掉落。
- 新增 `life_steal` Buff；玩家初始吸血比例為 `0`，Gate 提供 `+10%`，小怪掉落提供 `+3.3%`。
- 所有箭矢、電擊與碰撞擊殺造成的實際傷害，均依吸血比例回復玩家生命；單次回復上限 15，且不超過最大生命。
- HUD、Gate／掉落圖示、Buff catalog 與設計文件同步更新。

## 驗收

- 碰撞傷害等於怪物當前生命值，碰撞後怪物生命值為 0。
- 預設 `lifeSteal` 為 0；取得 Buff 後依實際傷害比例回復。

## 驗證

- `npm test -- --run`：Vitest 7 files／39 tests passed。
- `npm run build`：production build passed；保留既有 Vite chunk size warning。
- `npm run test:e2e`：Playwright mobile Chrome／Safari 12/12 passed。
