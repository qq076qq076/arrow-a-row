import { useEffect, useRef, useState, type ReactElement } from 'react';
import { GameLoop, type Simulation } from '../domain/GameLoop';
import { ThreeRuntime } from '../rendering/ThreeRuntime';

const emptySimulation: Simulation = {
  tick: () => undefined,
};

export function App(): ReactElement {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isWebGlSupported] = useState(() => {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  });

  useEffect(() => {
    const container = canvasContainerRef.current;

    if (container === null || !isWebGlSupported) {
      return undefined;
    }

    const runtime = new ThreeRuntime(container);
    const gameLoop = new GameLoop(emptySimulation, (alpha) => runtime.render(alpha));
    const onResize = (): void => runtime.resize();

    gameLoop.start();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      gameLoop.stop();
      runtime.dispose();
    };
  }, [isWebGlSupported]);

  if (!isWebGlSupported) {
    return (
      <main className="unsupported-screen">
        <h1>此裝置暫不支援</h1>
        <p>Arrow a Row 需要 WebGL 2。請更新瀏覽器或使用較新的裝置。</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div ref={canvasContainerRef} className="game-canvas" aria-hidden="true" />
      <header className="hud">
        <button type="button" className="icon-button" aria-label="暫停遊戲">Ⅱ</button>
        <p>HP 100 / 100</p>
        <button type="button" className="icon-button" aria-label="查看本局 Build">Build</button>
      </header>
      <section className="main-menu" aria-label="主選單">
        <p className="eyebrow">M0 Web Runtime</p>
        <h1>Arrow a Row</h1>
        <p>Three.js、TypeScript 與 React 技術基線已啟動。</p>
        <button type="button">開始新局</button>
      </section>
    </main>
  );
}
