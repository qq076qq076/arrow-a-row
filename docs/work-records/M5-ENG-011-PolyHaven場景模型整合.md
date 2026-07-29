# M5-ENG-011：Poly Haven 場景模型整合

狀態：Completed｜角色：工程師｜Milestone：M5 Beta／平衡與相容性｜完成日期：2026-07-29｜Commit：`工程(M5)：整合Poly Haven場景模型`（以 Git history 的最終 hash 為準）

採用 Poly Haven `Rock 07` 的 CC0 1K glTF 模型，取代 CH01 道路兩側的灰盒景物；加入環境光與方向光，並依章節調整光色。來源、作者、檔案、使用位置及授權完整記錄於 `docs/assets/PolyHaven-來源與授權.md`。

驗證：Vitest 25/25、production build 通過；以本機 Chrome 實際開始第一章，確認 Rock 07 在道路兩側載入、比例合理、光線可辨識，且 console 無錯誤或警告。
