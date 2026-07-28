import { useEffect, useRef, useState, type PointerEvent, type ReactElement } from 'react';
import { GameLoop } from '../domain/GameLoop';
import { M1RunSimulation, type M1RunSnapshot } from '../domain/M1RunSimulation';
import { ThreeRuntime } from '../rendering/ThreeRuntime';

const INITIAL_SNAPSHOT = new M1RunSimulation().snapshot();

export function App(): ReactElement {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef(new M1RunSimulation());
  const [snapshot, setSnapshot] = useState<M1RunSnapshot>(INITIAL_SNAPSHOT);
  const [isWebGlSupported] = useState(() => document.createElement('canvas').getContext('webgl2') !== null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container === null || !isWebGlSupported) return undefined;

    const runtime = new ThreeRuntime(container);
    const gameLoop = new GameLoop(
      { tick: (deltaSeconds) => simulationRef.current.tick(deltaSeconds) },
      () => {
        const nextSnapshot = simulationRef.current.snapshot();
        runtime.sync(nextSnapshot);
        runtime.render();
        setSnapshot(nextSnapshot);
      },
    );
    const onResize = (): void => runtime.resize();
    gameLoop.start();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      gameLoop.stop();
      runtime.dispose();
    };
  }, [isWebGlSupported]);

  const startRun = (): void => {
    simulationRef.current.start();
    setSnapshot(simulationRef.current.snapshot());
  };

  const movePlayer = (event: PointerEvent<HTMLDivElement>): void => {
    if (snapshot.phase !== 'playing') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    simulationRef.current.setTargetX(normalizedX * 5);
  };

  if (!isWebGlSupported) {
    return <main className="unsupported-screen"><h1>此裝置暫不支援</h1><p>Arrow a Row 需要 WebGL 2。</p></main>;
  }

  return (
    <main className="app-shell">
      <div
        ref={canvasContainerRef}
        className="game-canvas"
        aria-hidden="true"
        onPointerDown={movePlayer}
        onPointerMove={movePlayer}
      />
      {snapshot.phase === 'playing' && <RunHud snapshot={snapshot} />}
      {snapshot.phase === 'menu' && <MainMenu onStart={startRun} />}
      {snapshot.phase === 'dead' && <ResultScreen title="本局結束" onRestart={startRun} />}
      {snapshot.phase === 'complete' && <ResultScreen title="灰盒 Run 完成" onRestart={startRun} />}
    </main>
  );
}

function MainMenu({ onStart }: { readonly onStart: () => void }): ReactElement {
  return <section className="main-menu" aria-label="主選單"><p className="eyebrow">M1 Graybox</p><h1>Arrow a Row</h1><p>單手拖曳，選擇路徑，自動射擊。</p><button type="button" onClick={onStart}>開始新局</button></section>;
}

function RunHud({ snapshot }: { readonly snapshot: M1RunSnapshot }): ReactElement {
  const activeGate = snapshot.gates.find((gate) => !gate.isChosen);
  return <>
    <header className="hud"><button type="button" className="icon-button" aria-label="暫停遊戲">Ⅱ</button><p>HP {Math.ceil(snapshot.player.hp)} / {snapshot.player.maxHp}</p><button type="button" className="icon-button" aria-label="查看本局 Build">{snapshot.player.projectileCount} 箭</button></header>
    <p className="run-progress">距離 {Math.floor(snapshot.distanceMeters)}m / 60 秒</p>
    {activeGate !== undefined && <section className="gate-labels" aria-label="路徑選擇"><p>左：{activeGate.leftLabel}</p><p>右：{activeGate.rightLabel}</p></section>}
  </>;
}

function ResultScreen({ title, onRestart }: { readonly title: string; readonly onRestart: () => void }): ReactElement {
  return <section className="main-menu" aria-label={title}><h1>{title}</h1><p>重新開始，嘗試另一條路徑。</p><button type="button" onClick={onRestart}>再來一局</button></section>;
}
