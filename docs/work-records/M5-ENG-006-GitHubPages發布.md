# M5-ENG-006：GitHub Pages 發布

狀態：Completed（workflow）／Pending（首次遠端部署）｜角色：工程師｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`工程(M5)：建立GitHub Pages發布`（以 Git history 的最終 hash 為準）

## 產出

- 建立 `.github/workflows/deploy-pages.yml`：main 推送或手動 dispatch 依序執行 `npm ci`、Vitest、production build、上傳 Pages artifact、部署。
- Vite 在 GitHub Actions build 使用 `/arrow-a-row/` base path，本機仍使用 `/`。
- README 加入 GitHub Pages 公開網址與 workflow 連結。

## 驗證

- 本機 production build passed。
- 使用 `GITHUB_ACTIONS=true npm run build` 驗證 Pages base path passed。

## 發布交接

推送後，repository owner 需確認 Settings → Pages 的 source 為 GitHub Actions；成功 URL 為 `https://qq076qq076.github.io/arrow-a-row/`。若首次 workflow 因 Pages 未開啟而失敗，啟用後以 workflow_dispatch 重跑。
