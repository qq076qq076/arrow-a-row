# M2：CH01 Web 程序化灰盒資產交付

版本：0.2.0｜角色：建模師／技術美術｜日期：2026-07-28

## 交付決策

第一章垂直切片採用 `primitive-kit` 程序化灰盒，而非假冒完成版 GLB。這讓 Three.js runtime 可即時建立低多邊形物件，不需要網路載入、外部授權素材或貼圖；正式 GLB 會在 M4 美術製作階段替換，並維持相同的 asset ID 與 socket 合約。

資產清單位於 [manifest.json](/Users/walkerlin/Project/arrow%20a%20row/public/assets/manifest.json)，並由 `ContentManifestSchema` 驗證。`kind: procedural` 表示 runtime 以原生 Three.js primitive 產生；`kind: glb` 為未來可載入檔案的保留路徑。

## M2 可玩資產

| ID | 形狀／顏色 | socket | 效能規則 |
| --- | --- | --- | --- |
| `chr_seeker_a` | 靛藍膠囊／方塊主角 | Root、BowSocket、SwordOrbitCenter、HitPoint | 1 mesh；不透明。 |
| `enm_mist_runner_a` | 暖紅近戰方塊 | Root、HitPoint | 共用幾何與材質。 |
| `enm_reed_slinger_a` | 紫色遠程方塊 | Root、Muzzle、HitPoint | 共用幾何與材質。 |
| `bos_moss_crown_a` | 苔綠分段冠形 Boss | Root、HitPoint、Muzzle、SummonPoint | 最多 3 個不透明 mesh；預警由 emissive 色替換。 |
| `env_meadow_path_straight_a` | 青綠跑道／路標 Gate | Root | 共用平面／盒體；不透明。 |

## 完成標準

1. manifest 的 ID、預載群組、socket 可被 Zod schema 驗證。
2. 直式鏡頭下主角、敵人、Boss 與 Gate 使用高對比輪廓，不使用透明材質。
3. 沒有外部素材、網路請求、模型載入失敗風險；可直接由 ThreeRuntime 的 primitive renderer 替代。
4. 程序化資產只使用共用幾何／材質，避免每 frame 建立 mesh。

## 對工程交接

- 將 `bos_moss_crown_a` 實作為可變色的 Boss mesh；telegraph 時使用黃色／橘色發光或高對比材質，攻擊後回復苔綠。
- 保持 manifest 的 ID 不變。未來 GLB 導入以相同 ID、socket 置換 `procedural` 條目，simulation 不得依賴模型細節。
- M2 可以不載入 GLB，但不能把遊戲數值寫入 renderer 或 manifest。
