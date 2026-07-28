import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactElement } from 'react';
import { GameLoop } from '../domain/GameLoop';
import { M1RunSimulation, type M1RunSnapshot, type RewardId } from '../domain/M1RunSimulation';
import { BrowserLifecycle } from '../infrastructure/BrowserLifecycle';
import { DEFAULT_PROFILE, ProfileRepository, type Profile } from '../infrastructure/ProfileRepository';
import { RunCheckpointRepository } from '../infrastructure/RunCheckpointRepository';
import { ThreeRuntime } from '../rendering/ThreeRuntime';

const INITIAL_SNAPSHOT = new M1RunSimulation().snapshot();
const rewardNames: Record<RewardId, string> = { storm_bow: '風暴弓｜箭數 +2', blade_nexus: '刃環核心｜飛劍 +2', heartwood: '心木護佑｜最大 HP +60' };

export function App(): ReactElement {
  const canvasContainerRef = useRef<HTMLDivElement>(null); const simulationRef = useRef(new M1RunSimulation()); const checkpointRef = useRef(new RunCheckpointRepository()); const profileRef = useRef(new ProfileRepository()); const pendingCheckpointRef = useRef<M1RunSnapshot | undefined>(undefined); const isMouseDraggingRef = useRef(false);
  const [snapshot, setSnapshot] = useState<M1RunSnapshot>(INITIAL_SNAPSHOT); const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE); const [screen, setScreen] = useState<'game' | 'shop'>('game'); const [selectedCard, setSelectedCard] = useState<RewardId>(); const [hasCheckpoint, setHasCheckpoint] = useState(false); const [isWebGlSupported] = useState(() => document.createElement('canvas').getContext('webgl2') !== null);

  useEffect(() => { void profileRef.current.loadAsync().then(setProfile).catch(() => undefined); void checkpointRef.current.loadAsync().then((checkpoint) => { const saved = checkpoint?.payload as M1RunSnapshot | undefined; if (saved?.phase === 'playing' || saved?.phase === 'reward') { pendingCheckpointRef.current = saved; setHasCheckpoint(true); } }).catch(() => undefined); }, []);
  useEffect(() => {
    const container = canvasContainerRef.current; if (container === null || !isWebGlSupported) return undefined;
    const runtime = new ThreeRuntime(container); const save = async (): Promise<void> => { const current = simulationRef.current.snapshot(); if (current.phase === 'playing' || current.phase === 'reward') await checkpointRef.current.saveAsync({ runId: 'ch01-active', contentVersion: '0.2.0', savedAtMs: Date.now(), simulationTick: Math.floor(current.elapsedSeconds * 30), payload: current }); };
    const lifecycle = new BrowserLifecycle({ onSuspend: save, onResume: () => undefined });
    const gameLoop = new GameLoop({ tick: (deltaSeconds) => simulationRef.current.tick(deltaSeconds) }, () => { const next = simulationRef.current.snapshot(); runtime.sync(next); runtime.render(); setSnapshot(next); });
    const onResize = (): void => runtime.resize(); lifecycle.start(); gameLoop.start(); window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); lifecycle.stop(); gameLoop.stop(); runtime.dispose(); };
  }, [isWebGlSupported]);

  const startRun = (): void => { setScreen('game'); setSelectedCard(undefined); setHasCheckpoint(false); simulationRef.current.start(); setSnapshot(simulationRef.current.snapshot()); };
  const resumeRun = (): void => { const saved = pendingCheckpointRef.current; if (saved === undefined || !simulationRef.current.restore(saved)) return; setScreen('game'); setHasCheckpoint(false); setSnapshot(simulationRef.current.snapshot()); };
  const movePlayerFromClientX = (clientX: number, element: HTMLDivElement): void => { if (simulationRef.current.snapshot().phase !== 'playing') return; const bounds = element.getBoundingClientRect(); simulationRef.current.setTargetX((((clientX - bounds.left) / bounds.width) * 2 - 1) * 5); };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => { event.currentTarget.setPointerCapture(event.pointerId); movePlayerFromClientX(event.clientX, event.currentTarget); };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => { movePlayerFromClientX(event.clientX, event.currentTarget); };
  const onMouseDown = (event: MouseEvent<HTMLDivElement>): void => { isMouseDraggingRef.current = true; movePlayerFromClientX(event.clientX, event.currentTarget); };
  const onMouseMove = (event: MouseEvent<HTMLDivElement>): void => { if (isMouseDraggingRef.current) movePlayerFromClientX(event.clientX, event.currentTarget); };
  const onMouseUp = (): void => { isMouseDraggingRef.current = false; };
  const confirmReward = (): void => { if (selectedCard === undefined || !simulationRef.current.chooseReward(selectedCard)) return; const next = simulationRef.current.snapshot(); setSnapshot(next); const updated = { ...profile, gold: profile.gold + next.earnedGold }; setProfile(updated); void profileRef.current.saveAsync(updated); void checkpointRef.current.clearAsync(); };
  const buy = (key: 'healthLevel' | 'damageLevel' | 'fireRateLevel'): void => { const cost = 20 + profile[key] * 15; if (profile.gold < cost || profile[key] >= 5) return; const updated = { ...profile, gold: profile.gold - cost, [key]: profile[key] + 1 }; setProfile(updated); void profileRef.current.saveAsync(updated); };
  if (!isWebGlSupported) return <main className="unsupported-screen"><h1>此裝置暫不支援</h1><p>Arrow a Row 需要 WebGL 2。</p></main>;
  return <main className="app-shell"><div ref={canvasContainerRef} className="game-canvas" aria-hidden="true" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} />
    {screen === 'shop' ? <Shop profile={profile} onBuy={buy} onBack={() => setScreen('game')} /> : <>
      {snapshot.phase === 'playing' && <RunHud snapshot={snapshot} />}
      {snapshot.phase === 'menu' && <MainMenu onStart={startRun} onResume={hasCheckpoint ? resumeRun : undefined} onShop={() => setScreen('shop')} gold={profile.gold} />}
      {snapshot.phase === 'reward' && <RewardScreen snapshot={snapshot} selected={selectedCard} onSelect={setSelectedCard} onConfirm={confirmReward} />}
      {snapshot.phase === 'dead' && <ResultScreen title="本局結束" detail="光軌尚未熄滅。" onRestart={startRun} onShop={() => setScreen('shop')} />}
      {snapshot.phase === 'complete' && <ResultScreen title="第一章完成" detail={`獲得 ${snapshot.earnedGold} 金幣，第一道裂隙已修復。`} onRestart={startRun} onShop={() => setScreen('shop')} />}
    </>}</main>;
}
function MainMenu({ onStart, onResume, onShop, gold }: { readonly onStart: () => void; readonly onResume: (() => void) | undefined; readonly onShop: () => void; readonly gold: number }): ReactElement { return <section className="main-menu" aria-label="主選單"><p className="eyebrow">CH01 垂直切片</p><h1>Arrow a Row</h1><p>{onResume === undefined ? '單手拖曳，選擇路徑，自動射擊。' : '一段光軌仍在等待你。'}</p>{onResume !== undefined && <button type="button" onClick={onResume}>繼續本局</button>}<button type="button" onClick={onStart}>開始第一章</button><button type="button" className="secondary" onClick={onShop}>永久強化｜{gold} 金幣</button></section>; }
function RunHud({ snapshot }: { readonly snapshot: M1RunSnapshot }): ReactElement { const activeGate = snapshot.gates.find((gate) => !gate.isChosen); return <><header className="hud"><p>HP {Math.ceil(snapshot.player.hp)} / {snapshot.player.maxHp}</p><p>{snapshot.player.projectileCount} 箭</p></header>{snapshot.boss !== undefined ? <section className="boss-hud"><strong>苔冠守衛｜P{snapshot.boss.phase}</strong><progress value={snapshot.boss.hp} max={snapshot.boss.maxHp} />{snapshot.boss.telegraphSeconds > 0 && <p>{snapshot.boss.telegraphText}</p>}</section> : <p className="run-progress">距離 {Math.floor(snapshot.distanceMeters)}m / Boss</p>}{activeGate !== undefined && <section className="gate-labels"><p>左：{activeGate.leftLabel}</p><p>右：{activeGate.rightLabel}</p></section>}</>; }
function RewardScreen({ snapshot, selected, onSelect, onConfirm }: { readonly snapshot: M1RunSnapshot; readonly selected: RewardId | undefined; readonly onSelect: (id: RewardId) => void; readonly onConfirm: () => void }): ReactElement { return <section className="modal-card" aria-label="選擇一份回響"><h1>選擇一份回響</h1><p>苔冠重新聽見了風。</p>{snapshot.rewardOptions.map((id) => <button className={selected === id ? 'selected' : 'secondary'} key={id} type="button" onClick={() => onSelect(id)}>{rewardNames[id]}</button>)}<button type="button" disabled={selected === undefined} onClick={onConfirm}>確認選擇</button></section>; }
function ResultScreen({ title, detail, onRestart, onShop }: { readonly title: string; readonly detail: string; readonly onRestart: () => void; readonly onShop: () => void }): ReactElement { return <section className="main-menu" aria-label={title}><h1>{title}</h1><p>{detail}</p><button type="button" onClick={onRestart}>再來一局</button><button type="button" className="secondary" onClick={onShop}>前往商店</button></section>; }
function Shop({ profile, onBuy, onBack }: { readonly profile: Profile; readonly onBuy: (key: 'healthLevel' | 'damageLevel' | 'fireRateLevel') => void; readonly onBack: () => void }): ReactElement { const items: Array<readonly ['healthLevel' | 'damageLevel' | 'fireRateLevel', string]> = [['healthLevel', '曙光體魄'], ['damageLevel', '弓弦研磨'], ['fireRateLevel', '迅捷弦律']]; return <section className="modal-card" aria-label="永久強化"><h1>永久強化</h1><p>金幣：{profile.gold}</p>{items.map(([key, label]) => { const cost = 20 + profile[key] * 15; return <div className="shop-item" key={key}><span>{label} Lv.{profile[key]}</span><button type="button" disabled={profile.gold < cost || profile[key] >= 5} onClick={() => onBuy(key)}>購買 {cost} 金幣</button></div>; })}<button type="button" className="secondary" onClick={onBack}>返回</button></section>; }
