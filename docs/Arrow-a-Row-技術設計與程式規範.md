# Arrow a Row：Web 3D 技術設計與程式規範

版本：0.2｜2026-07-28｜目標：手機瀏覽器／PWA 優先，桌面瀏覽器支援｜關聯：[遊戲規格](Arrow-a-Row-開發規格書.md)、[UI 規格](Arrow-a-Row-畫面流程與UI規格.md)

本文件取代先前 Unity 方案。核心遊戲使用 **Three.js + TypeScript**；React 僅負責 DOM UI，不讓 React reconciliation 進入 3D 戰鬥迴圈。專案交付為靜態 Web App／PWA；若日後需要 App Store／Google Play，以 Capacitor 包裝同一個已驗證的 Web build，不重寫遊戲。

官方基線：[Three.js 安裝與 GLTFLoader](https://threejs.org/manual/en/installation.html)、[Three.js 場景／相機／渲染器](https://threejs.org/manual/en/creating-a-scene.html)、[WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)、[Vite](https://vite.dev/guide/)。Three.js 的 WebGLRenderer 目前以 WebGL 2 為基礎，因此啟動時必須做能力偵測並提供不支援畫面。

## 1. 固定技術棧

| 層面 | 採用 | 規範／理由 |
| --- | --- | --- |
| 建置與開發 | Vite + TypeScript strict | 快速開發、ESM、可產出靜態檔；`vite build` 不做型別檢查，CI 必須額外跑 `tsc --noEmit`。 |
| 3D 渲染 | Three.js `WebGLRenderer` | 建立 Scene、PerspectiveCamera、Renderer；使用原生 Three.js，不以 React Three Fiber 承擔核心 simulation。 |
| UI | React + CSS Modules／CSS variables | 主選單、商店、HUD、獎勵、Modal；DOM UI 與 Canvas 疊放。 |
| 遊戲規則 | 純 TypeScript domain modules | 固定 30 Hz simulation、可重現 RNG、無 DOM／Three.js 依賴。 |
| 資產 | glTF 2.0 / GLB、KTX2／WebP、Web Audio | `GLTFLoader` 由 asset loader 統一管理；內容 manifest 控制預載與釋放。 |
| 資料驗證 | TypeScript types + Zod schema | JSON content、存檔、remote config 都在邊界驗證。 |
| 本地儲存 | IndexedDB（透過小型 repository adapter） | Profile、Run checkpoint、交易日誌；不用 localStorage 存交易。 |
| 非同步 | 原生 Promise、AbortController | asset load／儲存／網路必可取消；simulation 不使用 async。 |
| 測試 | Vitest（unit）、Playwright（E2E／手機 viewport） | Domain、content、流程與 PWA smoke 分層。 |
| PWA | Web App Manifest + Service Worker（Workbox 或等價方案） | shell 可離線啟動；遊戲內容採版本化快取，更新不破壞 active Run。 |
| CI | GitHub Actions 或同級 Node CI | `npm ci`、lint、typecheck、unit、build、Playwright、Lighthouse／bundle budget。 |
| 原生包裝（延後） | Capacitor | 只在需商店發行時加入；維持 Web API adapter，避免原生耦合。 |

### 1.1 瀏覽器支援

- 主支援：最近兩個主要版本的 iOS Safari、Chrome Android、Chrome／Safari／Edge Desktop。
- 必需能力：WebGL 2、ES modules、IndexedDB、Web Audio、Pointer Events、Service Worker（PWA 可選；無 SW 時仍可線上遊玩）。
- 首次載入執行 `WebGL.isWebGL2Available()` 或等價能力檢查；不支援時顯示可理解的 fallback，不進入空白 Canvas。
- 鎖直式體驗，以 CSS safe-area inset 適配瀏海／手勢區；網頁無法保證鎖定方向時，橫置顯示「請轉回直式」遮罩並停止 simulation。

## 2. 架構與依賴方向

```text
DOM Presentation (React screens, HUD, accessibility, input adapters)
     ↓ commands / read-model subscription
Application (RunFlow, Shop, Save, Reward, Navigation use cases)
     ↓ ports
Domain (combat, stats, RNG, rules, immutable content contracts)
     ↑ adapter implementation
Infrastructure (Three renderer, IndexedDB, fetch, PWA, Web Audio, browser lifecycle)
```

規則：

1. `domain/` 不得 import React、Three.js、DOM、IndexedDB、fetch 或時間 API。
2. `application/` 只依賴 domain 與 port interface；不能直接讀寫 Canvas、URL、IndexedDB。
3. `presentation/` 不算傷害、不抽選項、不扣金；只 dispatch command、render snapshot。
4. `rendering/` 將 immutable `FrameSnapshot` 映射成 Three.js `Object3D`；它不能反向改 simulation。
5. `infrastructure/` 可使用瀏覽器 API，但不能決定玩法規則；任何資料先經 schema 驗證。

## 3. 專案目錄與模組邊界

```text
src/
  app/             composition root、routes、runtime lifecycle
  domain/          combat、stats、rng、run reducer、value objects
  application/     use cases、ports、commands、read models
  content/         JSON、Zod schema、catalog、content validator
  rendering/       ThreeRuntime、scene factories、render bridges、pools
  presentation/    React screens、HUD、CSS、accessibility、input adapters
  infrastructure/  IndexedDB、fetch、PWA、audio、telemetry、browser APIs
  shared/          branded ID、result、clock、logger、math
  test/            factories、fixtures、browser helpers
public/
  assets/          versioned GLB、texture、audio、manifest
  icons/           PWA icons
docs/
```

- 每個模組以 `index.ts` 定義公開 API；禁止跨資料夾 deep import。
- 遊戲內容 JSON 放 `src/content/data/` 或 versioned CDN manifest；GLB／貼圖放 `public/assets/`，不得把平衡數值藏在 GLB extras。
- public asset 名稱永久穩定，如 `ch01/bos_moss_crown_v1.glb`；內容 ID 不重用。
- 任何 asset URL 經 manifest 存取；不得在 feature 中散落字串路徑。

## 4. 遊戲與渲染流程

### 4.1 啟動

```text
index.html → main.tsx → capability check → load AppShell
 → fetch/load content manifest → validate Zod schemas
 → load Profile + recover Run from IndexedDB
 → create GameRuntime (domain + application + renderer adapters)
 → render MainMenu or ResumeRun
```

網路、PWA 更新、analytics、遠端設定失敗不得阻止本地可玩流程。content schema 失敗時停止開始 Run、顯示版本錯誤與重試／清快取選項。

### 4.2 固定 simulation 與獨立渲染

```text
requestAnimationFrame(now)
 → accumulate elapsed (clamp max 250ms)
 → while accumulator >= 1/30:
      input.sample → simulation.tick(1/30) → events → checkpoint schedule
 → renderer.sync(frameSnapshot, interpolationAlpha)
 → renderer.render(scene, camera)
```

- 使用 `requestAnimationFrame`，不可用 `setInterval`；瀏覽器分頁不可見時 rAF 暫停，仍要靠 `visibilitychange` 立即 checkpoint。
- tick 固定 30 Hz；畫面可 30／60／120 Hz，但同 seed、輸入序列、content version 的 simulation hash 必一致。
- tick 順序固定：`Input → Movement → Spawn → Target → Fire → Projectile → Collision → Combat → State checks → Events`。
- 三維畫面採 XZ 世界，玩家固定近鏡頭，世界向負 Z 捲動；Three.js 物件只反映 simulation 座標。

### 4.3 Three.js runtime

| 項目 | 規格 |
| --- | --- |
| Canvas | 由 `ThreeRuntime` 唯一持有；React 只提供 container ref，不直接操作 Scene。 |
| Renderer | `WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })`；pixel ratio 上限依品質檔為 1／1.5／2。 |
| Color | `SRGBColorSpace`；統一 tone mapping，材質不可各自調色。 |
| Camera | 固定俯視 PerspectiveCamera；viewport resize 更新 aspect／safe-area UI，但不改 simulation 寬度。 |
| Light | 1 directional + 1 hemisphere；baked／vertex lighting 優先，預設禁用即時陰影。 |
| Loading | GLB 透過 `GLTFLoader`；首局前以 `renderer.compileAsync()`／texture init 預熱，避免首次 Boss 卡頓。 |
| Dispose | 章節卸載時釋放 geometry、material、texture、audio buffer 的引用；object pool 自己持有共享資源。 |

### 4.4 池化與效能降級

- `RenderPool<T>` 管理箭、敵彈、敵人、傷害數字、命中特效。borrower 不得直接 `dispose()` shared geometry／material。
- Low／Standard／High 的敵彈上限為 60／120／160；超限時 simulation 依「最遠、最舊、低威脅」淘汰，並同步移除 render object。
- dynamic resolution：先降 pixel ratio（Low 1.0、Standard 1.5、High 2.0），再關閉後處理／粒子；不改遊戲數值或 RNG。
- 監控 `renderer.info.render.calls`、triangles、texture／geometry 數及 frame-time bucket；所有資料只在同意遙測時外送。

## 5. 資料、存檔與生命週期

### 5.1 Content

```text
authoring JSON/CSV → build-time Zod validator → versioned content manifest
 → runtime schema validation → immutable ContentCatalog → domain queries
```

validator 必查：ID 唯一、引用存在、權重非負、stack 合法、前置無循環、localized key 齊全、asset manifest 存在、數值範圍有效。內容改動提高 `contentVersion`；replay 必記 contentVersion。

### 5.2 IndexedDB

stores：`profile`、`runCheckpoint`、`transactions`、`settings`、`syncQueue`。每次交易或 checkpoint 以 transaction 原子寫入，並保留最後一份合法 Run snapshot。不能以 localStorage 保存金幣、能力、reward 或 transaction。

checkpoint 時機：過門、Boss 開始／死亡、重擲／選卡、`visibilitychange(hidden)`、`pagehide`、死亡／勝利。不可每 frame 寫入。profile 金幣只能透過 `EconomyService`，每筆交易有 idempotency key。

### 5.3 瀏覽器生命週期

| 事件 | 行為 |
| --- | --- |
| `visibilitychange` hidden | 停 simulation、立即 checkpoint、suspend audio。 |
| visible | 進 React 暫停 overlay，玩家按繼續才重啟 tick。 |
| `pagehide` | 嘗試最後一次輕量 checkpoint；不依賴 async 完成作唯一保護。 |
| `online/offline` | 更新 read model；核心流程不中斷，sync queue 退避重試。 |
| `webglcontextlost` | `preventDefault`、停止渲染、顯示恢復中；context restored 後重建 renderer resource。 |
| low memory（不可可靠偵測） | 依 page hidden／章節卸載主動釋放非必要 asset，不假設瀏覽器會通知。 |

## 6. TypeScript 寫作風格

- `tsconfig` 開啟 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride`；CI 跑 `tsc --noEmit`。
- Type、interface、class 用 `PascalCase`；變數／函式用 `camelCase`；常數用 `UPPER_SNAKE_CASE`；boolean 用 `is/has/can` 前綴。
- ID 使用 branded type（如 `AbilityId`、`RunId`），禁止裸 `string` 混用。
- domain state 使用 `readonly` object／array；reducer 回傳新 state + event，不在 UI 或 renderer 改 state。
- 函式建議 <40 行，class <300 行；guard clause 優先。禁止 `any`、非必要 type assertion、mutable global、隱式 enum 數值。
- 非同步函式後綴 `Async`；所有可取消 IO 接 `AbortSignal`。事件 handler 可 fire-and-forget，但必包 `void handler().catch(reportError)`。
- 禁止在 render loop 使用 array spread、`map/filter/reduce`、JSON stringify、DOM query、fetch、IndexedDB、React state update 或大型配置搜尋。

### 6.1 範例

```ts
export function applyGate(
  state: RunState,
  command: ChooseGateCommand,
): TransitionResult<RunState> {
  if (state.chosenGroups.has(command.choiceGroupId)) {
    return failure('gate_already_chosen');
  }

  const nextState = withGateModifier(state, command);
  return success(nextState, [{ type: 'GateChosen', command }]);
}
```

## 7. UI、輸入與可近用性

- React screen state 訂閱 application read model，HUD 更新節流至每 render frame；不得讓全 App context 在每 30 Hz tick re-render。
- `PointerEvent` 作為主輸入。僅在 Canvas 非 UI 區 `pointerdown` 後 `setPointerCapture`；`pointermove` 轉為 `MoveAxis` 或 target X；`pointerup/cancel` 立即煞停。
- 必設定 `touch-action: none` 於 Canvas 拖曳區，且不可阻止 UI scroll／click。
- DOM button 有可見 focus、`aria-label`、最少 48dp 觸控面積；Canvas 內戰鬥物件不需可點，但 Gate 的效果需同步以 DOM／aria-live 讀出。
- CSS 使用 `env(safe-area-inset-*)`；直式 header／footer 的資訊不可被瀏海或手勢列遮擋。

## 8. 資產規格

| 類型 | 格式／上限 | 規則 |
| --- | --- | --- |
| 3D 模型 | GLB（glTF 2.0） | 預算沿用美術規格；Draco／Meshopt 壓縮僅經真機比較後啟用。 |
| 貼圖 | WebP／KTX2 | 優先 atlas、mipmap、平台合適壓縮；避免多個透明全屏貼圖。 |
| 音訊 | OGG／AAC | BGM 串流、短 SFX decode／pool；背景時 suspend。 |
| UI | SVG／WebP | SVG 需 sanitize；不執行外部 script。 |
| manifest | JSON + Zod | asset hash／version／size／preload group 都要存在。 |

建模交付的 FBX 只作 source；工程 pipeline 轉成 GLB，為每個角色／敵人建立 `Object3D` factory、socket map 與 dispose policy。不存在 Unity Prefab／Addressables 概念。

## 9. PWA、網路與安全

- PWA precache 僅 App shell、字體、首局必要 asset；章節 asset runtime cache 採版本化 URL，更新後不刪除 active Run 所需版本。
- service worker 更新提示只在主選單顯示；Run 中不自動 reload。玩家有 checkpoint 時先保存、提示「下局套用更新」。
- 所有 API HTTPS、token 儲存在受平台保護的 cookie／安全 storage strategy（由後端設計決定），不寫入 log、URL、analytics。
- Remote config 只允許白名單平衡／feature flag，必經 Zod schema 與 content version；不下載／執行任意 JavaScript。
- analytics、崩潰資料與第三方 SDK 在同意後才啟用；預設最小蒐集且不含廣告 ID／精確位置。

## 10. 測試與品質閘門

| 層級 | 工具 | 範圍 |
| --- | --- | --- |
| Unit | Vitest | damage、RNG、gate lock、reward、經濟、migration、replay hash。 |
| Content | Vitest + Zod | 所有 JSON／localization／asset manifest。 |
| Integration | Vitest | IndexedDB adapter、checkpoint idempotency、lifecycle port fake。 |
| E2E | Playwright | 主選單、新局、drag、pause、reward、離線、mobile viewport。 |
| Device | 真機瀏覽器／PWA | iOS Safari、Chrome Android、safe area、background、WebGL context。 |
| Soak | Node simulation | 10,000 seed、100 Run、無負金／無 non-determinism。 |

每 PR：`npm ci` → lint → `tsc --noEmit` → unit/content → production build。每日：Playwright mobile smoke、bundle budget、10,000 seed。RC：真機矩陣、Lighthouse、PWA offline、長時間 heat／memory profile。

## 11. 效能預算

| 指標 | Low | Standard | High |
| --- | ---: | ---: | ---: |
| FPS | 30 | 60 | 60 |
| P95 frame time | <33.3ms | <16.7ms | <16.7ms |
| pixel ratio cap | 1.0 | 1.5 | 2.0 |
| 敵對彈體 | 60 | 120 | 160 |
| draw calls（戰鬥目標） | ≤80 | ≤120 | ≤160 |
| 首次可玩 JS + critical asset | ≤2MB gzip | ≤3MB gzip | ≤3MB gzip |
| 初次完整下載 | ≤8MB | ≤12MB | ≤12MB |

profile 需在真機 Chrome Android／Safari iOS 取得。使用 Chrome Performance、Safari Web Inspector、Three.js renderer.info、Lighthouse；不得以桌面 DevTools 成績作發布依據。

## 12. Git、CI 與完成定義

- `main` 永遠可 `npm ci && npm run build`；短期 feature branch；每個角色工作包保持獨立 commit。
- package 版本以 `package-lock.json` 鎖定；package upgrade 是獨立 PR，需 bundle、E2E 與瀏覽器相容性回歸。
- 不提交 `.env`、token、私鑰、node_modules、Playwright trace 中的私密資料；資產大檔使用 Git LFS 或 versioned object storage。
- 每個 release artifact 必可追至 Git SHA、Node 版本、package-lock hash、content version、asset manifest hash、CI run。

Definition of Done：功能符合分層與 TS 規則；內容／文字 schema 驗證；unit/E2E 證據；不破 deterministic replay、IndexedDB checkpoint、PWA 更新、visibility／context lost、safe area；真機 profile 無預算回歸；文件／變更紀錄完整。

## 附錄：必要 port

```ts
export interface RunRepository {
  load(signal?: AbortSignal): Promise<RunLoadResult>;
  saveCheckpoint(save: RunSave, signal?: AbortSignal): Promise<void>;
  clear(signal?: AbortSignal): Promise<void>;
}

export interface PlayerInput {
  sample(): InputFrame;
  consumePause(): boolean;
}

export interface RenderBridge {
  sync(snapshot: FrameSnapshot, alpha: number): void;
  dispose(): void;
}

export interface RandomStream {
  nextUint32(): number;
  nextFloat01(): number;
  snapshot(): RandomState;
}
```
