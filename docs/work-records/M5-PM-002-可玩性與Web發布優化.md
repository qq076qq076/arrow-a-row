# M5-PM-002：可玩性與 Web 發布優化

狀態：Completed｜角色：PM｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`PM(M5)：鎖定可玩性與Web發布優化`（以 Git history 的最終 hash 為準）

## 本輪決策

在不擴增關卡與核心內容的前提下，優先改善一次完整遊玩中的控制與交付：

1. 加入暫停／繼續與 Escape 鍵，暫停時 simulation 不推進且不接受移動輸入。
2. 維持電擊近距離主傷害、箭矢近距離高傷的已鎖定平衡方向；不得再回退飛劍內容。
3. 建立 GitHub Pages workflow，main 推送後自動建置／部署；README 必須提供公開網址與本機啟動說明。

## 驗收

- 暫停後距離、HP、敵人與冷卻不變；繼續後可正常完成 Run。
- GitHub Actions 可從乾淨環境執行 `npm ci`、test、build、Pages deploy。
- README 包含 `https://qq076qq076.github.io/arrow-a-row/` 與部署狀態連結。

## 風險

GitHub Pages 的首次公開 URL 以 repository 的 Pages 設定與 Actions 權限為準；若 repository 禁用 Pages，workflow 會明確失敗，需由 repository owner 在 Settings → Pages 啟用「GitHub Actions」。
