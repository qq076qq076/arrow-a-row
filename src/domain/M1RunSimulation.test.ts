import { describe, expect, it } from 'vitest';
import { M1RunSimulation } from './M1RunSimulation';

function advanceToDistance(simulation: M1RunSimulation, distanceMeters: number): void {
  while (simulation.snapshot().distanceMeters < distanceMeters) simulation.tick(1 / 30);
}

describe('M1RunSimulation', () => {
  it('applies the left gate once even after more ticks', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    simulation.setTargetX(-4);
    advanceToDistance(simulation, 11);
    const afterGate = simulation.snapshot();
    advanceToDistance(simulation, 14);

    expect(afterGate.player.projectileCount).toBe(2);
    expect(simulation.snapshot().player.projectileCount).toBe(2);
    expect(simulation.snapshot().selectedGateIds).toEqual(['g01']);
  });

  it('uses the same initial state for each fixed-seed M1 run', () => {
    const first = new M1RunSimulation();
    const second = new M1RunSimulation();
    first.start();
    second.start();
    first.setTargetX(-2);
    second.setTargetX(-2);
    for (let index = 0; index < 60; index += 1) {
      first.tick(1 / 30);
      second.tick(1 / 30);
    }
    expect(first.snapshot()).toEqual(second.snapshot());
  });
});
