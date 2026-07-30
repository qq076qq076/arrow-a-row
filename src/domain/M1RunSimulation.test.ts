import { describe, expect, it } from 'vitest';
import { BUFF_IDS } from '../content/BuffCatalog';
import { BASE_ARROW_DAMAGE, BASE_LIGHTNING_DAMAGE_PER_SECOND, getArrowDamageMultiplier, M1RunSimulation } from './M1RunSimulation';

function advanceToDistance(simulation: M1RunSimulation, distanceMeters: number): void {
  while (simulation.snapshot().distanceMeters < distanceMeters) simulation.tick(1 / 30);
}

describe('M1RunSimulation', () => {
  it('starts every run with exactly one arrow', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    expect(simulation.snapshot().player.projectileCount).toBe(1);
  });

  it('starts lightning with a one-unit lock range', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    expect(simulation.snapshot().player.lightningRange).toBe(1);
  });

  it('freezes simulation state while paused and resumes from the same state', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    simulation.tick(1 / 30);
    const beforePause = simulation.snapshot();
    expect(simulation.togglePause()).toBe(true);
    simulation.tick(2);
    expect(simulation.snapshot().distanceMeters).toBe(beforePause.distanceMeters);
    expect(simulation.togglePause()).toBe(true);
    simulation.tick(1 / 30);
    expect(simulation.snapshot().distanceMeters).toBeGreaterThan(beforePause.distanceMeters);
  });

  it('fires immediately, then makes the Boss approach from beyond the fifth wave', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    simulation.setTargetX(5);
    simulation.tick(1 / 30);
    expect(simulation.snapshot().arrows).toHaveLength(1);

    advanceToDistance(simulation, 77.9);
    expect(simulation.snapshot().boss).toBeUndefined();
    simulation.setTargetX(0);
    advanceToDistance(simulation, 78);
    simulation.tick(1 / 30);
    expect(simulation.snapshot().phase).toBe('playing');
    const arrivingBoss = simulation.snapshot().boss;
    expect(arrivingBoss?.z).toBeGreaterThan(15);

    const initialBossHp = arrivingBoss?.hp ?? 0;
    for (let tick = 0; tick < 360; tick += 1) simulation.tick(1 / 30);
    expect(simulation.snapshot().boss?.z).toBeGreaterThanOrEqual(15);
    expect(simulation.snapshot().boss?.hp).toBeLessThan(initialBossHp);
  });

  it('offers a stable development-only Boss preview snapshot for renderer checks', () => {
    const simulation = new M1RunSimulation();
    simulation.start({}, 'ch02_viaduct');
    simulation.enterBossPreview();

    const preview = simulation.snapshot();
    expect(preview.distanceMeters).toBe(78);
    expect(preview.boss).toMatchObject({ z: 10, hp: 9_999, maxHp: 9_999, isDefeated: false });
  });

  it('applies permanent profile modifiers to a new run', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 2, damageLevel: 3, fireRateLevel: 4 });
    const player = simulation.snapshot().player;
    expect(player.maxHp).toBe(120);
    expect(player.hp).toBe(120);
    expect(player.damage).toBeCloseTo(1.28);
    expect(player.projectileCount).toBe(1);
  });

  it('uses a weaker base arrow but rewards close-range hits, while lightning is the stronger short-range baseline', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    expect(simulation.snapshot().player.damage).toBe(BASE_ARROW_DAMAGE);
    expect(simulation.snapshot().player.lightningDamagePerSecond).toBe(BASE_LIGHTNING_DAMAGE_PER_SECOND);
    expect(getArrowDamageMultiplier(6)).toBe(1.5);
    expect(getArrowDamageMultiplier(14)).toBe(0.9);
    expect(getArrowDamageMultiplier(24)).toBe(0.55);
  });

  it('applies the three additional permanent upgrades to a new run', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ arrowSpeedLevel: 2, pierceLevel: 1, movementLevel: 3 });
    expect(simulation.snapshot().player.arrowSpeed).toBe(28);
    expect(simulation.snapshot().player.pierceCount).toBe(1);
    expect(simulation.snapshot().player.movementSpeed).toBe(13);
  });

  it('applies a randomly generated left gate once even after more ticks', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    simulation.setTargetX(-4);
    advanceToDistance(simulation, 11);
    const afterGate = simulation.snapshot();
    advanceToDistance(simulation, 14);

    expect(afterGate.selectedGateIds).toEqual(['g01']);
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
    expect(gates.slice(0, 2)).toHaveLength(2);
    expect(gates.slice(0, 2).flatMap((gate) => [gate.leftLabel, gate.rightLabel]).join(' ')).not.toMatch(/HP|生命|回復|治療/);
  });

  it('draws distinct random Gate options from the nine-Buff catalog', () => {
    const seen = new Set<string>();
    const simulation = new M1RunSimulation();
    for (let index = 0; index < 12; index += 1) {
      simulation.start();
      const gates = simulation.snapshot().gates;
      expect(gates.slice(0, 2).flatMap((gate) => [gate.leftLabel, gate.rightLabel]).join(' ')).not.toMatch(/生命|移速|減傷/);
      gates.forEach((gate) => { seen.add(gate.leftBuffId); seen.add(gate.rightBuffId); expect(gate.leftBuffId).not.toBe(gate.rightBuffId); });
    }
    expect(seen).toContain('piercing_arrow');
    expect(seen.size).toBeGreaterThanOrEqual(BUFF_IDS.length - 1);
  });

  it('drops a readable one-third Buff pickup when a minor enemy is defeated', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ damageLevel: 20 });
    for (let tick = 0; tick < 600 && simulation.snapshot().pickups.length === 0; tick += 1) simulation.tick(1 / 30);
    const pickup = simulation.snapshot().pickups[0];
    expect(pickup?.buffId).toBeDefined();
    expect(pickup?.label).toMatch(/\+⅓|\+\d/);
  });

  it('automatically locks up to two forward enemies and damages them once per second', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ damageLevel: 0 });
    expect(simulation.snapshot().player.lightningTargetCount).toBe(2);
    const initial = simulation.snapshot();
    simulation.restore({
      ...initial,
      enemies: [
        { id: 'test-near-left', kind: 'melee', x: -0.2, z: 0.9, hp: 100, telegraphSeconds: 0, deathSeconds: 0 },
        { id: 'test-near-right', kind: 'melee', x: 0.2, z: 0.9, hp: 100, telegraphSeconds: 0, deathSeconds: 0 },
      ],
      arrows: [],
      lightningTargetIds: [],
    });
    simulation.tick(1 / 30);

    const snapshot = simulation.snapshot();
    expect(snapshot.lightningTargetIds).toHaveLength(2);
    expect(snapshot.player.lightningRange).toBe(1);
    expect(snapshot.lightningTargetIds.every((id) => snapshot.enemies.some((enemy) => enemy.id === id && enemy.z > 0))).toBe(true);
  });

  it('fires multiple arrows in a forward fan rather than parallel lines', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    let gate = simulation.snapshot().gates[0]!;
    for (let attempt = 0; gate.leftBuffId !== 'split_arrow' && gate.rightBuffId !== 'split_arrow'; attempt += 1) {
      simulation.start();
      gate = simulation.snapshot().gates[0]!;
      if (attempt > 12) throw new Error('測試序列未提供箭矢 Buff。');
    }
    simulation.setTargetX(gate.leftBuffId === 'split_arrow' ? -5 : 5);
    advanceToDistance(simulation, 11);
    expect(simulation.snapshot().player.projectileCount).toBe(2);
    for (let tick = 0; tick < 30 && !simulation.snapshot().arrows.some((arrow) => arrow.vx !== 0); tick += 1) simulation.tick(1 / 30);
    const velocities = simulation.snapshot().arrows.map((arrow) => arrow.vx);
    expect(velocities.some((velocity) => velocity < 0)).toBe(true);
    expect(velocities.some((velocity) => velocity > 0)).toBe(true);
  });

  it('stops a base arrow at its first hit and grants continued flight only with piercing', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    expect(simulation.snapshot().arrows).toHaveLength(0);
    simulation.tick(1 / 30);
    expect(simulation.snapshot().arrows[0]?.piercesRemaining).toBe(0);

    let gate = simulation.snapshot().gates[0]!;
    for (let attempt = 0; gate.leftBuffId !== 'piercing_arrow' && gate.rightBuffId !== 'piercing_arrow'; attempt += 1) {
      simulation.start();
      gate = simulation.snapshot().gates[0]!;
      if (attempt > 18) throw new Error('測試序列未提供穿透 Buff。');
    }
    simulation.setTargetX(gate.leftBuffId === 'piercing_arrow' ? -5 : 5);
    advanceToDistance(simulation, 11);
    expect(simulation.snapshot().player.pierceCount).toBe(1);
    for (let tick = 0; tick < 30 && !simulation.snapshot().arrows.some((arrow) => arrow.piercesRemaining === 1); tick += 1) simulation.tick(1 / 30);
    expect(simulation.snapshot().arrows.some((arrow) => arrow.piercesRemaining === 1)).toBe(true);
  });

  it('reaches Boss reward and applies it exactly once', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    simulation.setTargetX(5);
    for (let index = 0; index < 2500 && simulation.snapshot().phase === 'playing'; index += 1) { if (simulation.snapshot().distanceMeters >= 42) simulation.setTargetX(0); simulation.tick(1 / 30); }

    expect(simulation.snapshot().phase).toBe('reward');
    expect(simulation.snapshot().earnedGold).toBe(30);
    const selectedReward = simulation.snapshot().rewardOptions[0]!;
    expect(simulation.snapshot().rewardOptions).toHaveLength(3);
    expect(new Set(simulation.snapshot().rewardOptions).size).toBe(3);
    expect(simulation.chooseReward(selectedReward)).toBe(true);
    expect(simulation.snapshot().phase).toBe('complete');
    expect(simulation.snapshot().selectedReward).toBe(selectedReward);
    expect(simulation.chooseReward(selectedReward)).toBe(false);
  });

  it('restores an in-progress reward choice without replacing its candidates', () => {
    const source = new M1RunSimulation();
    source.start();
    source.setTargetX(5);
    for (let index = 0; index < 2500 && source.snapshot().phase === 'playing'; index += 1) { if (source.snapshot().distanceMeters >= 42) source.setTargetX(0); source.tick(1 / 30); }
    const restored = new M1RunSimulation();
    expect(restored.restore(source.snapshot())).toBe(true);
    expect(restored.snapshot().phase).toBe('reward');
    expect(restored.snapshot().rewardOptions).toEqual(source.snapshot().rewardOptions);
  });

  it('carries the selected Build through all six chapters and stops after CH06', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 100, damageLevel: 5, fireRateLevel: 5 });
    const bossHpByChapter: number[] = [];

    for (let chapterIndex = 1; chapterIndex <= 6; chapterIndex += 1) {
      simulation.setTargetX(5);
      for (let tick = 0; tick < 12000 && simulation.snapshot().phase === 'playing'; tick += 1) { if (simulation.snapshot().distanceMeters >= 42) simulation.setTargetX(0); simulation.tick(1 / 30); }
      const reward = simulation.snapshot();
      expect(reward.phase).toBe('reward');
      expect(reward.chapterId).toBe(`ch0${chapterIndex}_${['meadow', 'viaduct', 'forge', 'canopy', 'archive', 'horizon'][chapterIndex - 1]}`);
      bossHpByChapter.push(reward.boss?.maxHp ?? 0);
      const selectedReward = reward.rewardOptions[0]!;
      expect(simulation.chooseReward(selectedReward)).toBe(true);
      expect(simulation.snapshot().selectedReward).toBe(selectedReward);
      expect(simulation.continueToNextChapter()).toBe(chapterIndex < 6);
    }

    expect(bossHpByChapter).toEqual([36, 50, 71, 99, 138, 194]);
  });
});
