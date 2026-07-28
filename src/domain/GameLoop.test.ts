import { describe, expect, it, vi } from 'vitest';
import { GameLoop, type Simulation } from './GameLoop';

describe('GameLoop', () => {
  it('does not start more than one animation loop', () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockReturnValue(1);
    const simulation: Simulation = { tick: vi.fn() };
    const loop = new GameLoop(simulation, vi.fn());

    loop.start();
    loop.start();

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    loop.stop();
  });
});
