import { describe, expect, it } from 'vitest';
import { M1RunSimulation } from './M1RunSimulation';

function advanceToDistance(simulation: M1RunSimulation, distanceMeters: number): void {
  while (simulation.snapshot().distanceMeters < distanceMeters) simulation.tick(1 / 30);
}

describe('M1RunSimulation', () => {
  it('starts every run with exactly one arrow', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    expect(simulation.snapshot().player.projectileCount).toBe(1);
  });

  it('applies permanent profile modifiers to a new run', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 2, damageLevel: 3, fireRateLevel: 4 });
    const player = simulation.snapshot().player;
    expect(player.maxHp).toBe(120);
    expect(player.hp).toBe(120);
    expect(player.damage).toBeCloseTo(1.6);
    expect(player.projectileCount).toBe(1);
  });

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

  it('offers no health reward in either of the first two gates', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const gates = simulation.snapshot().gates;
    expect(gates).toHaveLength(2);
    expect(gates.flatMap((gate) => [gate.leftLabel, gate.rightLabel]).join(' ')).not.toMatch(/HP|生命|回復|治療/);
  });

  it('reaches Boss reward and applies it exactly once', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    simulation.setTargetX(5);
    for (let index = 0; index < 2500 && simulation.snapshot().phase === 'playing'; index += 1) simulation.tick(1 / 30);

    expect(simulation.snapshot().phase).toBe('reward');
    expect(simulation.snapshot().earnedGold).toBe(30);
    expect(simulation.chooseReward('storm_bow')).toBe(true);
    expect(simulation.snapshot().phase).toBe('complete');
    expect(simulation.snapshot().player.projectileCount).toBeGreaterThanOrEqual(3);
    expect(simulation.chooseReward('storm_bow')).toBe(false);
  });

  it('restores an in-progress reward choice without replacing its candidates', () => {
    const source = new M1RunSimulation();
    source.start();
    source.setTargetX(5);
    for (let index = 0; index < 2500 && source.snapshot().phase === 'playing'; index += 1) source.tick(1 / 30);
    const restored = new M1RunSimulation();
    expect(restored.restore(source.snapshot())).toBe(true);
    expect(restored.snapshot().phase).toBe('reward');
    expect(restored.snapshot().rewardOptions).toEqual(source.snapshot().rewardOptions);
  });
});
