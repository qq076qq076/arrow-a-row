# M4：三章程序化資產 Kit

Web 版使用原創 Three.js primitive kit，非 placeholder GLB。三章共用主角與兩種敵人輪廓；章節以道路材質、環境色、Boss 形狀與 VFX 色彩區分。

| 章節 | 環境 | Boss 輪廓 | 主色 | 資產 ID |
| --- | --- | --- | --- | --- |
| CH01 晨線草原 | 圓潤草浪、分段石路 | 苔冠方盾 | 青綠／金 | `env_meadow_path_straight_a`、`bos_moss_crown_a` |
| CH02 鏡潮高架 | 弧形鏡面、高架節點 | 雙鏡校準柱 | 靛藍／銀 | `env_mirror_viaduct_path_a`、`bos_mirror_calibrator_a` |
| CH03 熾心熔庭 | 厚石板、熔脈裂紋 | 分段熔核 | 紫／琥珀 | `env_emberheart_court_path_a`、`bos_vein_overseer_a` |

每項資產保留 `Root`、`HitPoint`，遠程／Boss 額外保留 `Muzzle`。程序化幾何需共用 material，避免每 frame 配置；所有 ID 已列入 manifest 並經 schema 驗證。
