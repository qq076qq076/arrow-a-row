# Arrow a Row：技術設計與程式規範

版本：0.1｜2026-07-28｜適用平台：iOS／Android（手機優先）｜關聯：[遊戲開發規格書](Arrow-a-Row-開發規格書.md)、[畫面流程與 UI 規格](Arrow-a-Row-畫面流程與UI規格.md)

本文件是工程團隊的實作契約。它定義技術選型、程式邊界、資料／控制流、編碼風格、測試、建置、效能與發版要求；新功能若違反本文件，需在 PR 中記錄理由、影響與替代方案。

## 1. 技術決策

### 1.1 固定技術棧

| 層面 | 採用 | 規範與理由 |
| --- | --- | --- |
| 遊戲引擎 | Unity 6.3 LTS，鎖定完整 patch 版 | 專案建立後只允許升 patch；minor／major 升級須建立 upgrade branch、完整回歸與簽核。Unity 官方將 LTS 定位為 production lock-in／live service 的穩定選擇，6.3 LTS 支援至 2027-12。 |
| 語言 | C#，Unity 隨 6.3 LTS 支援的版本 | 不引入外部腳本語言；禁止 runtime dynamic／reflection 驅動核心玩法。 |
| 渲染 | Universal Render Pipeline（URP） | 使用 Mobile／Forward+ 可配置 renderer；以 shader variant stripping、baked lighting、LOD、GPU instancing 為預設。 |
| UI | UI Toolkit（Shell、商店、設定、結算）+ UGUI（遊戲 HUD 如需極低延遲） | 同一畫面不可混用兩種方案。MVP 先以 UI Toolkit 實作所有非戰鬥畫面；HUD 的技術選型需在垂直切片實測後固定。 |
| 輸入 | Unity Input System | 手機拖曳、Android Back、暫停與 PC fallback 全接到抽象 `IPlayerInput`。不使用舊 Input Manager。 |
| 非同步 | `async/await` + 專案內 `Task` 封裝 | 非同步只用於載入、儲存、網路；simulation 不使用 async，不讓 continuation 直接改遊戲狀態。 |
| 資產 | Addressables | 章節、VFX、音訊與 UI 圖集依 label 分組；不可在戰鬥即時同步載入。 |
| 存檔 | JSON DTO + 原子檔案寫入 + checksum | 以 repository 封裝；Profile 和 Run 分檔，schema migration 必做。 |
| 後端（可選） | REST API + 任一符合團隊能力的 BaaS／自建服務 | MVP 不依賴；服務只能透過 `IRemoteProfileGateway`、`IAnalyticsSink`、`IRemoteConfigGateway` 存取。 |
| CI | GitHub Actions 或同級 CI + Unity batchmode | 每 PR 編譯、格式／靜態檢查、EditMode 測試；每日 Android build + PlayMode smoke。 |
| 發布 | Fastlane（簽署／上傳）或等價受控 pipeline | 憑證僅存 CI secret／平台安全儲存；絕不提交至 Git。 |

官方參考：[Unity 6.3 LTS 支援政策](https://unity.com/releases/unity-6/support)、[Unity 6 Player 系統需求](https://docs.unity3d.com/6000.0/Documentation/Manual/system-requirements.html)。本專案產品下限仍採 iOS 15+／Android 10+；高於引擎下限是為了降低 QA 矩陣與維持效能。

### 1.2 必要 Unity packages

在 `Packages/manifest.json` 鎖定可重現版本；版本由 Tech Lead 在建立專案當日依 Unity 6.3 相容矩陣選定並記入 `docs/TECH_VERSIONS.md`。未經 PR 審查不得手改 lockfile。

| Package／能力 | 用途 | 是否必要 |
| --- | --- | --- |
| Input System | 觸控、Back、鍵盤／手把 fallback | 是 |
| Addressables | 可卸載內容與預載 | 是 |
| Test Framework | EditMode／PlayMode 測試 | 是 |
| URP | 手機渲染 | 是 |
| TextMeshPro 或 UI Toolkit Text | 字體、繁中 fallback | 是 |
| Mobile Notifications | 僅日後有明確通知設計才加入 | 否 |
| IAP / Ads SDK | 只有核准商業規格後才加入，以 adapter 隔離 | 否 |
| Firebase / Sentry 等 SDK | Crash／遙測經隱私審查後才加入 | 否 |

禁止：未核准 analytics SDK、會自動收集裝置識別的 SDK、未 pin version 的 Git package、以 `Resources.Load` 當常規資產載入、runtime 下載與執行任意程式碼。

## 2. 架構原則

### 2.1 分層與依賴方向

```text
Presentation   UI Toolkit / HUD / VFX / Audio / Input adapters
     ↓ 只呼叫 Use Case、訂閱 Read Model
Application    RunFlow / Shop / Save / Reward / Navigation use cases
     ↓ 依賴抽象介面與 Domain
Domain         Combat / Stats / RNG / Rules / immutable content contracts
     ↑ 由 Infrastructure 實作介面
Infrastructure Unity scene / Addressables / JSON / HTTP / platform lifecycle
```

規則：

1. `Domain` 不得引用 `UnityEngine`、MonoBehaviour、UI、Addressables、檔案或網路。
2. `Application` 不得直接呼叫 `PlayerPrefs`、`SceneManager`、`Instantiate` 或 SDK；只能使用 interface。
3. `Presentation` 不計算傷害、不抽獎、不扣金、不寫檔；它送 command、渲染 state。
4. `Infrastructure` 不能決定遊戲規則，只負責實作 port。
5. 任何跨層 callback 都要使用明確 DTO／event，不傳 `GameObject`、`MonoBehaviour` 或可變 collection。

### 2.2 Assembly Definition

| Assembly | 可依賴 | 不可依賴 | 內容 |
| --- | --- | --- | --- |
| `Arrow.Domain` | .NET BCL | Unity、其他 Arrow assembly | 值物件、規則、RNG、測試。 |
| `Arrow.Application` | Domain | Presentation、Infrastructure | use case、ports、state machine。 |
| `Arrow.Content` | Domain、Unity（只限 ScriptableObject 轉 DTO） | Presentation | 內容定義、validator。 |
| `Arrow.Infrastructure` | Application、Domain、Content、Unity | Presentation | save、asset、platform、HTTP adapter。 |
| `Arrow.Presentation` | Application、Domain、Content、Unity | Infrastructure concrete type | screens、HUD、scene presenter。 |
| `Arrow.Composition` | 所有 production assembly | test assemblies | bootstrap、DI composition root。 |
| `*.Tests` | 對應 production assembly、Test Framework | 不必要 runtime assembly | unit／integration tests。 |

`Arrow.Composition` 是唯一可 `new` concrete infrastructure 的位置。DI 容器非必要；MVP 用手寫 composition root，避免 Service Locator。

### 2.3 專案目錄

```text
Assets/Arrow/
  Art/ Audio/ Fonts/ Materials/ Prefabs/ Shaders/ VFX/
  Content/
    Abilities/ Enemies/ Bosses/ Segments/ Balance/ Localization/
  Scenes/
    Bootstrap.unity  Shell.unity  Run.unity
  Scripts/
    Domain/ Application/ Content/ Infrastructure/ Presentation/ Composition/
    Editor/ Tests/EditMode/ Tests/PlayMode/
  UI/
    Shell/ RunHud/ Shared/ Theme/
  Addressables/
  Settings/
Packages/
ProjectSettings/
docs/
```

- 每個 C# 檔只放一個 public top-level type，檔名必與 type 同名。
- `.meta` 必提交；不可移動／刪除資產而不檢查 GUID 參照。
- `Assets/Arrow/Content` 僅保存資料；Prefab 不得成為平衡數值唯一來源。
- `Resources/` 只允許 Unity 強制資產；新增任何檔案須 Tech Lead 核准。

## 3. 核心資料與控制流

### 3.1 開機與依賴組裝

```text
App launch
 → Bootstrapper.Awake()
 → 建立 Logger、Clock、FileStore、ContentCatalog、PlatformLifecycleAdapter
 → LoadProfileUseCase
 → RecoverRunUseCase（讀取雙檔 checkpoint、驗 checksum、migration）
 → 建立 NavigationCoordinator
 → 顯示 MainMenuScreen
```

任何載入錯誤都導向可恢復 UI（資料修復／重試）；不得因單一 analytics、遠端設定、雲端同步失敗阻止本地遊玩。

### 3.2 新局與戰鬥流

```text
StartRun command
 → RunFactory.Create(profile, contentVersion, seed)
 → SaveRunCheckpoint (state=LoadingRun)
 → AssetPreloader.LoadChapterOne
 → RunStateMachine.Enter(Intro or Traverse)
 → Fixed-step SimulationTick
      InputSample → Movement → Spawn → Targeting → Fire → Projectile
      → Collision → CombatResolver → Death/Reward checks → Events
 → Presenter consumes immutable FrameSnapshot
 → 每個安全 checkpoint 寫 RunSave
```

**tick 順序不可任意更換**。對同一 seed、輸入序列與內容版本，tick 結果必須一致。建議 simulation 固定 30 Hz；畫面 30／60 Hz 可插值，但不得改變命中、RNG、冷卻或傷害。

### 3.3 選擇門與獎勵流

```text
Gate trigger
 → GateResolver.TryLock(choiceGroupId, gateId)
 → GateChosen event
 → ApplyModifier / StartEncounter
 → SaveRunCheckpoint

BossDefeated
 → StopEnemyProjectiles → RewardGenerator.Generate(seed stream)
 → state=Reward → SaveRunCheckpoint(cards, rerollCount)
 → UI selection → SelectRewardUseCase
 → validate → apply modifier → save → next segment
```

門與卡片必須採 idempotency key：`runId + choiceGroupId` 或 `runId + bossId + rewardIndex`。重複 UI 點擊、重送事件或 App 恢復不可產生第二次套用。

### 3.4 存檔／同步流

```text
Mutating command
 → validate domain rule
 → create transaction record (before/after/version/idempotencyKey)
 → atomic local write: temp → fsync → replace → backup
 → update in-memory read model
 → enqueue cloud sync (if authenticated/network available)
 → server acknowledgement updates sync cursor only
```

- Profile、Run、transaction log 三檔分離；保留最近一份合法備份。
- Run checkpoint 時機：過門、Boss 開始／死亡、Reward 重擲／選取、App 背景、死亡／勝利；不要每 frame 寫檔。
- Profile 金幣只能由 `EconomyService` 變更。結算與商店購買都要帶 transaction id。
- 雲端衝突策略：Profile 用伺服器權威 transaction log；Run 預設只保留最新 device 的尚未結算 checkpoint，顯示清楚的覆蓋提示。不能簡單以 timestamp 合併金幣。

### 3.5 App 生命週期

| 平台事件 | 必做動作 |
| --- | --- |
| `OnApplicationPause(true)`／失焦 | 立刻發 `AppSuspending`、停止 tick、同步 checkpoint、mute／pause audio。 |
| `OnApplicationFocus(true)` | 從記憶體或檔案驗證 Run，進入 Pause UI；玩家確認後才 tick。 |
| 低記憶體 | 釋放非當章 Addressables、清空安全 object pool、寫 checkpoint；不可直接清除活躍 Run。 |
| 網路變更 | 更新 connectivity read model；重試同步採退避，不中斷 simulation。 |
| 裝置旋轉 | 鎖直式；不重載 scene／Run。 |

## 4. Domain 建模規範

### 4.1 值物件與資料責任

| Type | 不可變性 | 責任 |
| --- | --- | --- |
| `RunState` | immutable record | 章節、分數、RNG state、玩家 stats、modifier、狀態。 |
| `PlayerStats` | immutable record | 最終屬性與 clamp；不保存 UI 字串。 |
| `AbilityDefinition` | immutable content DTO | 能力 id、stack 規則、效果與前置條件。 |
| `ModifierInstance` | immutable record | ability id、stack、來源、取得 tick。 |
| `ChoiceGroup` | immutable | 門 id、候選、lock 結果。 |
| `CommandResult<T>` | immutable | 成功資料或可本地化的 error code。 |
| `DomainEvent` | immutable | 已發生的事實，供 Application／Presentation 訂閱。 |

Domain method 應回傳新 state + events，而非修改 public field。例如：`RunReducer.ApplyGate(state, command) -> TransitionResult`。禁止讓 UI 直接改 `player.hp`。

### 4.2 RNG

- 採可序列化 deterministic PRNG（PCG32 或同級），禁止 `UnityEngine.Random` 用於任何結果性決策。
- `routeRng`、`rewardRng`、`combatRng`、`cosmeticRng` 分 stream；cosmetic 不得消耗 gameplay stream。
- 每次有結果的亂數抽樣都記錄 `stream`、`beforeState`、`result`，僅在 dev／QA build 可匯出。
- 不用 `Dictionary` 迭代順序、系統時間、frame rate 當隨機／排序依據。

### 4.3 數值與單位

- 所有時間以秒、距離以 meter、角度以 degree、比率以 0–1 float；名稱要包含單位或型別，如 `cooldownSeconds`、`rangeMeters`、`critChance01`。
- 金幣、層數、分數使用整數；傷害 simulation 用 `float`，顯示時由 formatter 統一取整。
- clamp 發生的位置唯一且可測。例如 `DamageReduction01` 建構時 clamp 0–0.70，UI 不再自行 clamp。
- 禁止 magic number。除了 `0`、`1`、`-1`，所有遊戲數值要命名常數或內容資料。

## 5. C# 寫作風格

### 5.1 基準

- 使用 `.editorconfig`、Rider/ReSharper 或 Roslyn analyzer；CI 將 warning 視為 error（第三方 assembly 可例外）。
- 4 空格縮排、UTF-8、LF、檔案結尾 newline；使用 block namespace。
- public 成員與 type 用 `PascalCase`；private field 用 `_camelCase`；區域變數／參數用 `camelCase`；介面以 `I` 開頭；async method 後綴 `Async`。
- Bool 命名採可判讀語意：`isAlive`、`hasCheckpoint`、`canReroll`；事件採過去式：`BossDefeated`；command 採動詞：`StartRunCommand`。
- 類別命名依責任：`*Service`（domain operation）、`*UseCase`（application transaction）、`*Presenter`（UI 綁定）、`*Repository`（本地資料）、`*Gateway`（遠端／平台）、`*Factory`、`*Validator`。禁止 `Manager`、`Helper`、`Utils` 當泛稱。

### 5.2 類別與方法

```csharp
public sealed class PurchaseUpgradeUseCase
{
    private readonly IProfileRepository _profileRepository;
    private readonly IUpgradeCatalog _upgradeCatalog;

    public PurchaseUpgradeUseCase(
        IProfileRepository profileRepository,
        IUpgradeCatalog upgradeCatalog)
    {
        _profileRepository = profileRepository;
        _upgradeCatalog = upgradeCatalog;
    }

    public async Task<CommandResult<ProfileSnapshot>> ExecuteAsync(
        UpgradeId upgradeId,
        CancellationToken cancellationToken)
    {
        // Validate → mutate domain state → persist atomically → return read model.
    }
}
```

- 一個 class 只一個主要責任；建議 <300 行，超過需分拆並在 PR 說明。
- 方法應做一件事，建議 <40 行；guard clause 優先，巢狀條件最多 3 層。
- constructor injection；不得用 global singleton、靜態 mutable state 或 Service Locator。
- `MonoBehaviour` 只做 Unity 生命週期、序列化參照、轉送輸入／畫面事件；核心規則移到純 C# class。
- `Update`／`FixedUpdate` 不做 GC allocation、IO、LINQ、Addressables load、網路請求或大型搜尋。
- `async void` 僅可作 UI event handler；其餘一律 `Task`。每個可取消流程都接受 `CancellationToken` 並在 scene／screen 釋放時取消。
- 不吞例外。可預期錯誤回 `CommandResult`；非預期錯誤記 structured log 後顯示安全錯誤 UI。

### 5.3 禁止與替代

| 禁止 | 原因 | 替代 |
| --- | --- | --- |
| `FindAnyObjectByType`、`GameObject.Find` 於 runtime | 不可預測且慢 | 序列化注入／composition root。 |
| `GetComponent` 於每 frame | CPU／GC 壓力 | `Awake` 快取。 |
| `PlayerPrefs` 存遊戲交易 | 無 migration／原子性 | `IProfileRepository`。 |
| `UnityEngine.Random` 核心邏輯 | 無法 replay | deterministic RNG。 |
| `DateTime.Now` 作規則 | 不可重現／易被改時間 | `IClock`，server time 僅做帳號服務。 |
| `new WaitForSeconds` 熱路徑 | allocation | cache 或 tick timer。 |
| coroutine 寫商業交易 | 取消／例外難追蹤 | `Task` + use case。 |
| 字串當 id／事件名散落 | 打字錯誤與重構困難 | strongly typed ID／constants。 |

### 5.4 註解、日誌與錯誤碼

- 註解寫「為何」，不重述程式「做什麼」。公開 API、非直覺規則、外部 SDK adapter 使用 XML doc。
- TODO 格式：`TODO(OWNER, YYYY-MM-DD): reason`；過期 TODO 視為 bug。
- log 一律結構化：`event=run_checkpoint_saved runId=... version=...`，不得記錄 token、完整帳號、IP、原始裝置 ID。
- 面向玩家的錯誤是本地化 `ErrorCode`；例外訊息只能進 log，不能直接顯示。

## 6. Unity 與內容實作規則

### 6.1 Scene 與 Prefab

- 常駐 scene 僅 `Bootstrap`；`Shell` 與 `Run` 可 additive 載入。切畫面不應重啟整個 App。
- Prefab 為視覺／碰撞組裝；不得藏有未記錄的平衡常數。每個 runtime prefab 需指定 pool policy。
- 禁止 nested prefab 超過 3 層；避免 override 失控。共用部分抽成 prefab variant 或 component。
- 任何 Scene 修改都要有 reviewer；禁止將測試物件、debug log、未使用 light／camera 留進 production scene。

### 6.2 Content pipeline

```text
ScriptableObject authoring asset
 → ContentValidator (Editor/CI)
 → immutable Content DTO at boot
 → Catalog indexed by typed ID
 → Domain queries catalog through interface
```

validator 必查：ID 唯一、引用存在、稀有度／權重合法、stack 上限正數、前置條件無循環、localized key 齊全、數值在規範範圍、Addressables label 正確。

內容 ID 永不重用。刪除能力時保留 tombstone／migration map，讓舊存檔可讀；改動平衡資料要提高 `contentVersion`，影響 replay 的變更需在 patch note 記錄。

### 6.3 Object pool 與渲染

- Projectile、enemy、damage number、hit VFX、pickup 必走 pool；pool owner 明確，borrower 不得直接 Destroy。
- 敵彈上限：Low 60、Standard 120、High 160；達上限時依「離玩家最遠、最舊、低威脅」順序淘汰，規則寫入 Domain／simulation。
- 預熱只在 loading／安全段；戰鬥中不可同步擴池造成掉幀。超出預熱池採 soft cap／降級效果並遙測。
- UI 圖集、Sprite Atlas、材質共享、GPU instancing、baked light 為預設；避免透明全屏疊層與 overdraw。

## 7. API、隱私與安全

### 7.1 網路抽象

```csharp
public interface IRemoteProfileGateway
{
    Task<SyncResult> SyncAsync(ProfileTransactionBatch batch, CancellationToken cancellationToken);
}
```

- 所有 API 走 HTTPS；認證 token 使用平台安全儲存，不能在 log／analytics／URL query 輸出。
- retry 僅對可安全重試且有 idempotency key 的 request；exponential backoff + jitter，最多 3 次，之後排隊。
- API DTO 與 domain model 分離。永不將 server response 直接 deserialize 成可執行的遊戲規則。
- Remote Config 僅能調整白名單平衡／開關，需 schema、版本、簽名／驗證與 rollback；不可推送程式碼。

### 7.2 隱私

- 預設最小蒐集：不取精確位置、通訊錄、廣告 ID 或跨 App 追蹤。
- analytics 要先獲使用者同意（依目標市場與平台規範），拒絕後使用 no-op sink。
- Data deletion、consent change、restore purchase／帳號登出均要有可測 user flow。
- 第三方 SDK 引入前需安全／隱私清單：資料類型、目的、傳輸端點、保留期、退出方式、SDK version、owner。

## 8. 測試策略

| 層級 | 位置 | 範圍 | 必要案例 |
| --- | --- | --- | --- |
| Unit/EditMode | `Domain.Tests` | 無 Unity runtime 的規則 | 傷害、clamp、RNG、門 lock、pity、經濟、migration。 |
| Application tests | `Application.Tests` | fake repository／clock | 開局、重擲、購買、結算 idempotency、背景 checkpoint。 |
| Content validation | Editor/CI | 所有 SO 資料 | 內容引用與數值完整性。 |
| PlayMode | 裝置／模擬器 | Unity adapter、scene、input、pool | 觸控拖曳、暫停、Boss reward、前後台。 |
| Device smoke | Android/iOS 真機 | lifecycle、效能、safe area | 冷啟動、Run、切後台、恢復、購買 UI。 |
| Soak/bot | CI nightly | 長跑與 seed | 100 Run、10,000 seed、無 crash、無負金、determinism。 |

### 8.1 最低品質閘門

- Domain／Application 修改須有對應 unit test；bug fix 先建立可失敗的 regression test。
- 核心 Domain lines coverage ≥80%，branch coverage ≥70%；coverage 不是取代情境測試。
- 每 PR：compile、format/analyzer、EditMode tests、content validator、buildable Android debug。
- 每日：PlayMode smoke、10,000 seed simulation、Android device build；每週 iOS device smoke 與 memory／thermal profile。
- Release candidate：所有 AC、UI、MOB 驗收已附測試證據；P0 bug=0、crash-free 目標≥99.5%（有正式 telemetry 後量測）。

### 8.2 Determinism test 範例

1. 使用固定 `seed=12345`、固定 30 Hz、固定輸入序列執行 2 次。
2. 比對每 60 tick 的 `RunStateHash`、門候選、reward 候選、HP、score、RNG state。
3. 完全一致才通過；不一致須輸出第一個不同 tick 與 event log。
4. 於 30 FPS／60 FPS rendering 條件重跑，simulation hash 仍須一致。

## 9. 效能與可觀測性

### 9.1 預算

| 指標 | Low | Standard | High |
| --- | ---: | ---: | ---: |
| FPS 目標 | 30 | 60 | 60 |
| P95 frame time | <33.3 ms | <16.7 ms | <16.7 ms |
| 敵對彈體 | 60 | 120 | 160 |
| 戰鬥常駐記憶體 | ≤350 MB | ≤500 MB | ≤650 MB |
| CPU GC allocation／frame | 0 B（戰鬥） | 0 B（戰鬥） | 0 B（戰鬥） |
| 冷啟動到主選單 | ≤8 秒 | ≤5 秒 | ≤5 秒 |

- 使用 Unity Profiler、Memory Profiler、Frame Debugger 與真機 GPU profiler；Editor 成績不作 release 結論。
- 每個功能 PR 若新增常駐 allocation、draw call、shader variant、Addressables group，要附前後 profile／合理性。
- Telemetry 最低記錄：startup time、frame-time bucket、crash、ANR、OOM、checkpoint failure、Run outcome、content version；取樣與同意遵循隱私章節。

### 9.2 Crash／ANR 處理

1. 每個 crash report 需有 app version、content version、裝置級別、最後 50 個非敏感 domain event。
2. P0 crash／資料損失：停止相關 rollout、建立 regression test、修復、hotfix review。
3. P1 crash：下一個 patch 前修復；若影響特定裝置，設 remote kill switch／關閉重特效並公告。

## 10. Git、PR 與 CI/CD

### 10.1 Git 規範

- 使用 trunk-based development：`main` 永遠可建置；短生命 feature branch，以 feature flag／內容開關漸進整合。
- Branch：`feature/AR-123-gate-reward`、`fix/AR-456-checkpoint-duplication`、`chore/AR-789-unity-patch`。
- Commit：`feat(run): add idempotent gate resolution`；一個 commit 一個可理解目的。不得混入格式化全專案、二進位資產與功能變更。
- 提交 Unity YAML asset／scene 前，確認 Smart Merge 設定；大檔採 Git LFS，二進位檔不可隨意 reimport。
- 永不 commit：簽名 key、provision profile、token、真實 API endpoint secret、個人 IDE 設定、Library/、Temp/、Logs/。

### 10.2 PR 模板與審查

PR 必填：目的、行為改變、架構影響、內容／存檔 migration、測試證據、真機／效能證據、風險與 rollback。涉及經濟、RNG、存檔、隱私、SDK、建置、平台生命週期的 PR 必須由對應 owner 再加一位工程 reviewer 核准。

Reviewer 檢查：

1. 依賴方向與 assembly 是否正確？
2. 是否導入 allocation、singleton、magic number、未可取消 async 或重複交易？
3. 內容是否有 validator、migration、localization、Addressables label？
4. 手機 safe area、前後台、離線與低階機是否仍成立？
5. 是否有足夠測試，且測試驗證行為而不是實作細節？

### 10.3 Pipeline

```text
Pull Request: restore cache → compile → analyzer/format → unit tests
  → content validation → Android debug build → report artifacts

main nightly: same checks → PlayMode smoke → determinism bot → Android APK/AAB
  → iOS archive (macOS runner) → profile baseline comparison → notify

release tag: reproducible signed build → automated smoke → store metadata validation
  → staged rollout 1% → monitor crash/ANR/checkpoint errors → expand or rollback
```

Build 版本：`major.minor.patch+buildNumber`。iOS build number 與 Android versionCode 自動遞增且不可重用；每一 release artifact 必可追到 Git SHA、Unity patch、package lock、content version、CI run。

## 11. 完成定義（Definition of Done）

任何程式／內容工作項要完成，必須同時滿足：

1. 已符合本文件的分層、命名、風格與安全規則。
2. 所有玩家可見文字進 localization table；繁中與英文至少完成。
3. 有 unit／integration／device test 的適當證據，並通過 CI quality gate。
4. 不破壞 deterministic replay、存檔 migration、離線流程、前後台恢復與 safe area。
5. 無新增未審查第三方 SDK、secret、個資欄位或未記錄 remote config。
6. 以目標裝置測試效能；有變動時附 profile 差異。
7. PR 已審核、文件與 changelog 更新；feature flag／rollback path 已定義（若適用）。

## 附錄 A：建議基礎介面

```csharp
public interface IRunRepository
{
    Task<RunLoadResult> LoadAsync(CancellationToken cancellationToken);
    Task SaveCheckpointAsync(RunSave save, CancellationToken cancellationToken);
    Task ClearAsync(CancellationToken cancellationToken);
}

public interface IPlayerInput
{
    float ReadMoveAxis();
    bool ConsumePausePressed();
    bool ConsumeBuildPressed();
}

public interface IRandomStream
{
    uint NextUInt();
    float NextFloat01();
    RandomState Snapshot();
}

public interface IGameClock
{
    long SimulationTick { get; }
    float FixedDeltaSeconds { get; }
}
```

介面應小而穩定；不要建立「萬用」`IGameService`。若 method 超過 5 個且服務有多種責任，拆為專用 port。

## 附錄 B：開發環境鎖定表

在第一次技術啟動會議確認並填入，之後改動等同 dependency upgrade：

| 項目 | 鎖定值 | Owner | 變更程序 |
| --- | --- | --- | --- |
| Unity Editor | Unity 6.3 LTS `6000.3.xf1`（填精確 patch） | Tech Lead | upgrade branch + 全回歸。 |
| Android toolchain | Unity Hub 隨版 SDK/NDK/JDK（填精確版） | Build Engineer | Android build smoke。 |
| Xcode | 填正式支援版 | iOS Engineer | archive + 真機 smoke。 |
| Package lock | Git 提交的 lockfile SHA | Tech Lead | PR + compatibility review。 |
| Target OS | iOS 15+／Android 10+ | Product + QA | device matrix review。 |
