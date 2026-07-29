# M4-QA-001：內容回歸與 Soak

狀態：Completed（自動化）／Ready（實機）｜角色：測試人員｜Milestone：M4 內容完成｜完成日期：2026-07-29｜Commit：`測試(M4)：完成內容回歸與Soak`（以 Git history 的最終 hash 為準）

## 範圍與證據

| 驗收項目 | 自動化證據 | 結果 |
| --- | --- | --- |
| M4 內容回歸 | Vitest：6 files / 20 tests | Pass |
| 三章、三 Boss、章節接續 | `M1RunSimulation.test.ts` 與 `M4ContentSoak.test.ts` | Pass |
| 100 Run soak | 100 次連續 CH01→CH03 完整 campaign；每章驗證三張不重複回響、可結算且可接續 | Pass |
| 六項永久強化、12 成就與保存 | simulation／ProfileRepository 回歸 | Pass |
| asset manifest schema | ContentManifestSchema 拒絕重複 ID；三章程序化 kit schema 回歸 | Pass |
| 建置 | `npm run build` | Pass |
| 手機 viewport 操作 Smoke | Playwright Chromium／WebKit 共 6/6 | Pass |

## Gate 判定

M4 Web 凍結範圍的自動化驗收已完成。三章內容、Boss、六項永久強化、12 成就、雙語內容資料與程序化 manifest 均納入回歸；100 Run simulation soak 未發現 crash 或 soft lock。

## 尚待實機（不以模擬器替代）

- iOS Safari 與 Chrome Android 各完整完成一次 CH01→CH03，含離線啟動、背景恢復、checkpoint、商店與成就。
- 於目標裝置量測 Low／Standard 品質設定的 FPS、記憶體與溫度；確認 safe area、色弱可讀性與 150% 字級。

上述是真機 Release QA，不阻塞 M4 的「自動化完成」狀態；在取得裝置證據前，不可宣稱實機 Gate 已完成。
