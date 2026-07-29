# M2-ENG-005：Gate 內嵌獎勵文字

狀態：Completed｜角色：工程師｜Milestone：M2 垂直切片｜完成日期：2026-07-29｜Commit：`工程(M2)：將獎勵文字置於Gate方塊`（以 Git history 的最終 hash 為準）

## 完成內容

- 移除固定於螢幕下方的左右 Gate 獎勵說明。
- 每個 Gate 方塊正面建立 CanvasTexture 3D 文字牌，顯示對應增益（例如 `+1 箭矢`、`最大 HP +25`）。
- 文字牌與 Gate group 同步移動、始終面向鏡頭，並在 Gate 選擇後一起隱藏與釋放貼圖資源。

## 驗收證據

- Vitest：5 files / 9 tests 通過。
- TypeScript 與 production build 通過。
- Playwright Chrome / WebKit：6/6 通過。

## 下一位角色交接：QA

在直式與橫式實機確認 Gate 接近時，文字位於左右對應方塊正面、沒有固定 HUD 重複資訊，且中文字不被裁切。
