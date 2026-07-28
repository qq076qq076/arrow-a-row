export interface Simulation {
  tick(deltaSeconds: number): void;
}

export interface GameLoopOptions {
  readonly ticksPerSecond: number;
  readonly maxFrameDeltaSeconds: number;
}

const DEFAULT_OPTIONS: GameLoopOptions = {
  ticksPerSecond: 30,
  maxFrameDeltaSeconds: 0.25,
};

export class GameLoop {
  private animationFrameId: number | undefined;
  private lastFrameTimeMs: number | undefined;
  private accumulatorSeconds = 0;
  private isRunning = false;

  public constructor(
    private readonly simulation: Simulation,
    private readonly render: (interpolationAlpha: number) => void,
    private readonly options: GameLoopOptions = DEFAULT_OPTIONS,
  ) {}

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.animationFrameId = requestAnimationFrame(this.onAnimationFrame);
  }

  public stop(): void {
    this.isRunning = false;
    this.lastFrameTimeMs = undefined;
    this.accumulatorSeconds = 0;

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  private readonly onAnimationFrame = (nowMs: number): void => {
    if (!this.isRunning) {
      return;
    }

    const lastFrameTimeMs = this.lastFrameTimeMs ?? nowMs;
    const frameDeltaSeconds = Math.min(
      (nowMs - lastFrameTimeMs) / 1000,
      this.options.maxFrameDeltaSeconds,
    );
    const fixedDeltaSeconds = 1 / this.options.ticksPerSecond;

    this.lastFrameTimeMs = nowMs;
    this.accumulatorSeconds += frameDeltaSeconds;

    while (this.accumulatorSeconds >= fixedDeltaSeconds) {
      this.simulation.tick(fixedDeltaSeconds);
      this.accumulatorSeconds -= fixedDeltaSeconds;
    }

    this.render(this.accumulatorSeconds / fixedDeltaSeconds);
    this.animationFrameId = requestAnimationFrame(this.onAnimationFrame);
  };
}
