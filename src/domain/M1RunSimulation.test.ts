import { describe, expect, it } from 'vitest';
import { BUFF_IDS } from '../content/BuffCatalog';
import { BASE_ARROW_DAMAGE, BASE_CANNON_DAMAGE, BASE_LIGHTNING_DAMAGE_PER_SECOND, BOSS_START_DISTANCE, BOSS_STOP_DISTANCE, BOSS_WARNING_SECONDS, BOSS_WARNING_START_DISTANCE, CANNON_BLAST_RADIUS, CANNON_DAMAGE_BONUS, CANNON_RADIUS_BONUS, ENEMY_SPAWN_Z, LIFE_STEAL_BONUS, getArrowDamageMultiplier, M1RunSimulation } from './M1RunSimulation';

function advanceToDistance(simulation: M1RunSimulation, distanceMeters: number): void {
  while (simulation.snapshot().distanceMeters < distanceMeters) {
    const snapshot = simulation.snapshot();
    if (snapshot.phase === 'echo') {
      expect(snapshot.rewardOptions).toHaveLength(3);
      expect(simulation.chooseReward(snapshot.rewardOptions[0]!)).toBe(true);
      continue;
    }
    if (snapshot.phase !== 'playing') return;
    simulation.tick(1 / 30);
  }
}

function advanceToBossReward(simulation: M1RunSimulation, maxTicks = 18_000): ReturnType<M1RunSimulation['snapshot']> {
  for (let tick = 0; tick < maxTicks; tick += 1) {
    const snapshot = simulation.snapshot();
    if (snapshot.phase === 'echo') {
      expect(snapshot.rewardOptions).toHaveLength(3);
      expect(simulation.chooseReward(snapshot.rewardOptions[0]!)).toBe(true);
      continue;
    }
    if (snapshot.phase !== 'playing') break;
    if (snapshot.distanceMeters >= 42) simulation.setTargetX(0);
    simulation.tick(1 / 30);
  }
  return simulation.snapshot();
}

describe('M1RunSimulation', () => {
  it('starts every run without arrows and guarantees the first Gate weapon choice', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const snapshot = simulation.snapshot();
    expect(snapshot.player.projectileCount).toBe(0);
    expect(snapshot.player.lightningTargetCount).toBe(2);
    expect(new Set([snapshot.gates[0]?.leftBuffId, snapshot.gates[0]?.centerBuffId, snapshot.gates[0]?.rightBuffId])).toEqual(new Set(['split_arrow', 'cannon_weapon', 'lightning_targets']));
    expect(snapshot.gates[0]?.centerLabel).toBe('火砲 +1');

    const centerChoice = new M1RunSimulation();
    centerChoice.start();
    centerChoice.setTargetX(0);
    advanceToDistance(centerChoice, 11);
    expect(centerChoice.snapshot().player.cannonUnlocked).toBe(true);
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

  it('runs three five-wave rounds with one final echo, then warns five seconds before Boss', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 100 });
    simulation.setTargetX(5);
    simulation.tick(1 / 30);
    expect(simulation.snapshot().arrows).toHaveLength(0);

    for (let round = 1; round <= 3; round += 1) {
      while (simulation.snapshot().phase === 'playing' && simulation.snapshot().wavesCompleted < round * 5) simulation.tick(1 / 30);
      const roundEnd = simulation.snapshot();
      expect(roundEnd.wavesCompleted).toBe(round * 5);
      expect(roundEnd.enemies.some((enemy) => enemy.id.startsWith(`wave-${round * 5}-`))).toBe(true);
      if (round < 3) expect(roundEnd.phase).toBe('playing');
    }

    const echo = simulation.snapshot();
    expect(echo.phase).toBe('echo');
    expect(echo.echoRound).toBe(1);
    expect(echo.rewardOptions).toHaveLength(3);
    expect(new Set(echo.rewardOptions).size).toBe(3);
    expect(echo.boss).toBeUndefined();
    expect(simulation.chooseReward(echo.rewardOptions[0]!)).toBe(true);

    const warning = simulation.snapshot();
    expect(warning.phase).toBe('playing');
    expect(warning.wavesCompleted).toBe(15);
    expect(warning.distanceMeters).toBeGreaterThanOrEqual(BOSS_WARNING_START_DISTANCE);
    expect(warning.boss).toBeUndefined();
    expect(warning.bossWarningSeconds).toBe(BOSS_WARNING_SECONDS);

    simulation.tick(BOSS_WARNING_SECONDS - 0.1);
    expect(simulation.snapshot().boss).toBeUndefined();
    simulation.tick(0.1);
    expect(simulation.snapshot().phase).toBe('playing');
    const arrivingBoss = simulation.snapshot().boss;
    expect(simulation.snapshot().distanceMeters).toBeLessThanOrEqual(BOSS_START_DISTANCE);
    expect(arrivingBoss?.z).toBeGreaterThan(BOSS_STOP_DISTANCE);

    simulation.restore({ ...simulation.snapshot(), boss: { ...arrivingBoss!, hp: 999_999, maxHp: 999_999 } });
    simulation.setTargetX(0);
    const initialBossHp = simulation.snapshot().boss?.hp ?? 0;
    for (let tick = 0; tick < 360; tick += 1) simulation.tick(1 / 30);
    expect(simulation.snapshot().boss?.z).toBe(BOSS_STOP_DISTANCE);
    expect(simulation.snapshot().boss?.hp).toBeLessThan(initialBossHp);
  });

  it('offers a stable development-only Boss preview snapshot for renderer checks', () => {
    const simulation = new M1RunSimulation();
    simulation.start({}, 'ch02_viaduct');
    simulation.enterBossPreview();

    const preview = simulation.snapshot();
    expect(preview.distanceMeters).toBe(BOSS_START_DISTANCE);
    expect(preview.boss).toMatchObject({ z: BOSS_STOP_DISTANCE, hp: 9_999, maxHp: 9_999, isDefeated: false });
  });

  it('uses fifteen waves and one final echo in every chapter', () => {
    const chapters = ['ch01_meadow', 'ch02_viaduct', 'ch03_forge', 'ch04_canopy', 'ch05_archive', 'ch06_horizon'] as const;
    for (const chapterId of chapters) {
      const simulation = new M1RunSimulation();
      simulation.start({ healthLevel: 100 }, chapterId);
      const echoRounds: number[] = [];
      for (let tick = 0; tick < 6_000 && simulation.snapshot().phase !== 'echo' && simulation.snapshot().phase !== 'dead'; tick += 1) {
        const snapshot = simulation.snapshot();
        simulation.setTargetX(snapshot.wavesCompleted >= 15 ? 0 : 5);
        simulation.tick(1 / 30);
      }
      const echo = simulation.snapshot();
      if (echo.phase === 'echo') {
        echoRounds.push(echo.echoRound);
        expect(echo.rewardOptions).toHaveLength(3);
        expect(simulation.chooseReward(echo.rewardOptions[0]!)).toBe(true);
      }
      expect(echoRounds).toEqual([1]);
      expect(simulation.snapshot().phase).toBe('playing');
      expect(simulation.snapshot().wavesCompleted).toBe(15);
      expect(simulation.snapshot().bossWarningSeconds).toBe(BOSS_WARNING_SECONDS);
    }
  });

  it('restores the final chapter echo before allowing the Boss warning', () => {
    const source = new M1RunSimulation();
    source.start({ healthLevel: 100 });
    while (source.snapshot().phase === 'playing') source.tick(1 / 30);
    const checkpoint = source.snapshot();
    expect(checkpoint.phase).toBe('echo');
    expect(checkpoint.wavesCompleted).toBe(15);

    const restored = new M1RunSimulation();
    expect(restored.restore(checkpoint)).toBe(true);
    expect(restored.snapshot().phase).toBe('echo');
    expect(restored.snapshot().rewardOptions).toHaveLength(3);
    expect(restored.chooseReward(restored.snapshot().rewardOptions[0]!)).toBe(true);
    expect(restored.snapshot().phase).toBe('playing');
    expect(restored.snapshot().wavesCompleted).toBe(15);
    expect(restored.snapshot().bossWarningSeconds).toBe(BOSS_WARNING_SECONDS);
  });

  it('applies the PM first-wave HP anchors to every chapter', () => {
    const chapters = [
      ['ch01_meadow', 9], ['ch02_viaduct', 12], ['ch03_forge', 17],
      ['ch04_canopy', 24], ['ch05_archive', 34], ['ch06_horizon', 47],
    ] as const;
    for (const [chapterId, meleeHp] of chapters) {
      const simulation = new M1RunSimulation();
      simulation.start({}, chapterId);
      while (simulation.snapshot().wavesCompleted < 1) simulation.tick(1 / 30);
      const firstWave = simulation.snapshot().enemies.filter((enemy) => enemy.id.startsWith('wave-1-'));
      expect(firstWave.filter((enemy) => enemy.kind === 'melee')[0]?.hp).toBe(meleeHp);
      expect(Math.max(...firstWave.map((enemy) => enemy.hp))).toBe(meleeHp);
    }
  });

  it('randomly offers the swarm echo and doubles minions in the next chapter', () => {
    const simulation = new M1RunSimulation();
    let swarmReward: ReturnType<M1RunSimulation['snapshot']> | undefined;

    for (let attempt = 0; attempt < 24 && swarmReward === undefined; attempt += 1) {
      simulation.start();
      const setup = simulation.snapshot();
      simulation.restore({
        ...setup,
        enemies: [],
        player: { ...setup.player, lightningTargetCount: 1, projectileCount: 0 },
        boss: { id: 'bos_moss_crown_a', hp: 1, maxHp: 1, z: 1, phase: 1, telegraphSeconds: 0, telegraphText: 'Boss 進場！', isDefeated: false },
      });
      for (let tick = 0; tick < 90 && simulation.snapshot().phase === 'playing'; tick += 1) simulation.tick(1 / 30);
      const reward = simulation.snapshot();
      if (reward.rewardOptions.includes('enemy_swarm')) swarmReward = reward;
    }

    expect(swarmReward).toBeDefined();
    expect(simulation.chooseReward('enemy_swarm')).toBe(true);
    expect(simulation.snapshot().player.enemyCountMultiplier).toBe(2);
    expect(simulation.continueToNextChapter()).toBe(true);
    advanceToDistance(simulation, 16);
    expect(simulation.snapshot().enemies).toHaveLength(4);
  });

  it('restores an unexpanded swarm run without losing the doubling effect', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const setup = simulation.snapshot();
    simulation.restore({
      ...setup,
      player: { ...setup.player, enemyCountMultiplier: 2 },
      enemies: [{ id: 'restore-minion', kind: 'melee', x: 0, z: 20, hp: 10, telegraphSeconds: 0, deathSeconds: 0 }],
    });
    simulation.tick(1 / 30);

    expect(simulation.snapshot().enemies.map((enemy) => enemy.id)).toEqual(['restore-minion', 'restore-minion-swarm-1']);
  });

  it('applies permanent profile modifiers to a new run', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 2, damageLevel: 3, fireRateLevel: 4 });
    const player = simulation.snapshot().player;
    expect(player.maxHp).toBe(120);
    expect(player.hp).toBe(120);
    expect(player.damage).toBeCloseTo(BASE_ARROW_DAMAGE * 1.6);
    expect(player.projectileCount).toBe(0);
  });

  it('uses a weaker base arrow but rewards close-range hits, while lightning is the stronger short-range baseline', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    expect(simulation.snapshot().player.damage).toBe(BASE_ARROW_DAMAGE);
    expect(simulation.snapshot().player.lifeSteal).toBe(0);
    expect(simulation.snapshot().player.lightningDamagePerSecond).toBe(BASE_LIGHTNING_DAMAGE_PER_SECOND);
    expect(getArrowDamageMultiplier(6)).toBe(1.5);
    expect(getArrowDamageMultiplier(14)).toBe(0.9);
    expect(getArrowDamageMultiplier(24)).toBe(0.55);
  });

  it('takes current enemy HP on collision and kills the colliding enemy', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const initial = simulation.snapshot();
    simulation.restore({
      ...initial,
      player: { ...initial.player, hp: 80 },
      enemies: [{ id: 'collision-enemy', kind: 'melee', x: 0, z: 0.9, hp: 17, telegraphSeconds: 0, deathSeconds: 0 }],
      arrows: [],
      lightningTargetIds: [],
    });
    simulation.tick(1 / 30);

    const snapshot = simulation.snapshot();
    expect(snapshot.player.hp).toBe(63);
    expect(snapshot.collectedShards).toBe(1);
    expect(snapshot.enemies[0]).toMatchObject({ id: 'collision-enemy', hp: 0 });
    expect(snapshot.enemies[0]?.deathSeconds).toBeGreaterThan(0);
  });

  it('heals by the actual damage multiplied by life steal', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const initial = simulation.snapshot();
    simulation.restore({
      ...initial,
      player: { ...initial.player, hp: 50, lifeSteal: 0.2, lightningTargetCount: 1, lightningRange: 6 },
      enemies: [{ id: 'life-steal-target', kind: 'melee', x: 0, z: 5, hp: 100, telegraphSeconds: 0, deathSeconds: 0 }],
      arrows: [],
      lightningTargetIds: [],
    });
    simulation.tick(1 / 30);

    const snapshot = simulation.snapshot();
    expect(snapshot.player.hp).toBeCloseTo(50 + BASE_LIGHTNING_DAMAGE_PER_SECOND * 0.2);
    expect(snapshot.enemies[0]?.hp).toBeCloseTo(100 - BASE_LIGHTNING_DAMAGE_PER_SECOND);
  });

  it('applies one-third damage bonuses for regular arrow and lightning Buffs', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      gates: [
        { ...started.gates[0]!, leftBuffId: 'power_shot', rightBuffId: 'split_arrow', leftLabel: '箭傷 +8.3%', rightLabel: '+1 箭矢' },
        { ...started.gates[1]!, z: 18, leftBuffId: 'lightning_damage', rightBuffId: 'split_arrow', leftLabel: '電擊傷害 +0.67', rightLabel: '+1 箭矢' },
        ...started.gates.slice(2),
      ],
    });
    simulation.setTargetX(-5);
    advanceToDistance(simulation, 11);
    expect(simulation.snapshot().player.damage).toBeCloseTo(BASE_ARROW_DAMAGE * (1 + 0.25 / 3));
    advanceToDistance(simulation, 19);
    expect(simulation.snapshot().player.lightningDamagePerSecond).toBeCloseTo(BASE_LIGHTNING_DAMAGE_PER_SECOND + 2 / 3);
  });

  it('applies full and one-third life steal from Gate and pickup Buffs', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      player: { ...started.player, projectileCount: 1 },
      gates: [
        { ...started.gates[0]!, leftBuffId: 'life_steal', rightBuffId: 'split_arrow', leftLabel: '吸血 +10%', rightLabel: '+1 箭矢' },
        ...started.gates.slice(1),
      ],
    });
    simulation.setTargetX(-5);
    advanceToDistance(simulation, 11);
    expect(simulation.snapshot().player.lifeSteal).toBeCloseTo(LIFE_STEAL_BONUS);

    const afterGate = simulation.snapshot();
    simulation.restore({
      ...afterGate,
      player: { ...afterGate.player, x: 0, lifeSteal: 0 },
      pickups: [{ id: 999, x: 0, z: 1.2, buffId: 'life_steal', label: '吸血 +3.3%' }],
    });
    simulation.tick(1 / 30);
    expect(simulation.snapshot().player.lifeSteal).toBeCloseTo(LIFE_STEAL_BONUS / 3);
  });

  it('collecting a Buff pickup does not damage the player', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const initial = simulation.snapshot();
    simulation.restore({
      ...initial,
      player: { ...initial.player, hp: 47 },
      enemies: [],
      pickups: [{ id: 1000, x: 0, z: 1.2, buffId: 'life_steal', label: '吸血 +3.3%' }],
    });
    simulation.tick(1 / 30);

    expect(simulation.snapshot().player.hp).toBe(47);
    expect(simulation.snapshot().pickups).toHaveLength(0);
  });

  it('moves monsters and Buff pickups at the same approach speed', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const initial = simulation.snapshot();
    simulation.restore({
      ...initial,
      enemies: [{ id: 'speed-enemy', kind: 'melee', x: 0, z: 20, hp: 100, telegraphSeconds: 0, deathSeconds: 0 }],
      pickups: [{ id: 1001, x: 0, z: 20, buffId: 'life_steal', label: '吸血 +3.3%' }],
    });
    simulation.tick(1 / 30);

    const snapshot = simulation.snapshot();
    expect(snapshot.enemies[0]?.z).toBeCloseTo(snapshot.pickups[0]?.z ?? 0);
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

  it('draws distinct random Gate options from the expanded Buff catalog', () => {
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
    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      player: { ...started.player, projectileCount: 1, damage: 100 },
      enemies: [{ id: 'pickup-target', kind: 'melee', x: 0, z: 3, hp: 1, telegraphSeconds: 0, deathSeconds: 0 }],
      arrows: [],
    });
    for (let tick = 0; tick < 600 && simulation.snapshot().pickups.length === 0; tick += 1) simulation.tick(1 / 30);
    const pickup = simulation.snapshot().pickups[0];
    expect(pickup?.buffId).toBeDefined();
    expect(pickup?.label).toMatch(/\+⅓|\+\d/);
  });

  it('spawns enemies at the far road edge and waits for stragglers before reward', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 100 });
    while (simulation.snapshot().wavesCompleted < 1) simulation.tick(1 / 30);
    expect(simulation.snapshot().enemies.every((enemy) => enemy.z >= ENEMY_SPAWN_Z - 0.3)).toBe(true);

    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      enemies: [{ id: 'last-straggler', kind: 'melee', x: 0, z: 0.5, hp: 100, telegraphSeconds: 0, deathSeconds: 0 }],
      boss: { id: 'bos_moss_crown_a', hp: 0, maxHp: 36, z: BOSS_STOP_DISTANCE, phase: 2, telegraphSeconds: 0, telegraphText: 'Boss 已擊敗', isDefeated: true },
      rewardOptions: [],
      selectedReward: undefined,
      earnedGold: 30,
    });
    simulation.tick(1 / 30);
    expect(simulation.snapshot().phase).toBe('playing');

    for (let tick = 0; tick < 120 && simulation.snapshot().phase === 'playing'; tick += 1) simulation.tick(1 / 30);
    expect(simulation.snapshot().phase).toBe('reward');
  });

  it('automatically locks up to two forward enemies and damages them once per second', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ damageLevel: 0 });
    expect(simulation.snapshot().player.lightningTargetCount).toBe(2);
    const initial = simulation.snapshot();
    simulation.restore({
      ...initial,
      player: { ...initial.player, lightningTargetCount: 2, lightningRange: 2 },
      enemies: [
        { id: 'test-near-left', kind: 'melee', x: -0.2, z: 2, hp: 100, telegraphSeconds: 0, deathSeconds: 0 },
        { id: 'test-near-right', kind: 'melee', x: 0.2, z: 2, hp: 100, telegraphSeconds: 0, deathSeconds: 0 },
      ],
      arrows: [],
      lightningTargetIds: [],
    });
    simulation.tick(1 / 30);

    const snapshot = simulation.snapshot();
    expect(snapshot.lightningTargetIds).toHaveLength(2);
    expect(snapshot.player.lightningRange).toBe(2);
    expect(snapshot.lightningTargetIds.every((id) => snapshot.enemies.some((enemy) => enemy.id === id && enemy.z > 0))).toBe(true);
  });

  it('fires multiple arrows in a forward fan rather than parallel lines', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      gates: [
        { ...started.gates[0]!, leftBuffId: 'split_arrow', rightBuffId: 'lightning_targets', leftLabel: '+1 箭矢', rightLabel: '電擊目標 +1' },
        { ...started.gates[1]!, z: 18, leftBuffId: 'split_arrow', rightBuffId: 'lightning_targets', leftLabel: '+1 箭矢', rightLabel: '電擊目標 +1' },
        ...started.gates.slice(2),
      ],
    });
    simulation.setTargetX(-5);
    advanceToDistance(simulation, 19);
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
    expect(simulation.snapshot().arrows).toHaveLength(0);

    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      player: { ...started.player, projectileCount: 1 },
      gates: [
        { ...started.gates[0]!, leftBuffId: 'piercing_arrow', rightBuffId: 'lightning_targets', leftLabel: '穿透 +1', rightLabel: '電擊目標 +1' },
        ...started.gates.slice(1),
      ],
    });
    simulation.setTargetX(-5);
    advanceToDistance(simulation, 11);
    expect(simulation.snapshot().player.pierceCount).toBe(1);
    for (let tick = 0; tick < 30 && !simulation.snapshot().arrows.some((arrow) => arrow.piercesRemaining === 1); tick += 1) simulation.tick(1 / 30);
    expect(simulation.snapshot().arrows.some((arrow) => arrow.piercesRemaining === 1)).toBe(true);
  });

  it('unlocks the slow cannon and applies blast damage to multiple targets', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      gates: [
        { ...started.gates[0]!, leftBuffId: 'cannon_weapon', rightBuffId: 'lightning_targets', leftLabel: '解鎖火砲', rightLabel: '電擊目標 +1' },
        ...started.gates.slice(1),
      ],
    });
    simulation.setTargetX(-5);
    advanceToDistance(simulation, 11);
    expect(simulation.snapshot().player.cannonUnlocked).toBe(true);
    expect(simulation.snapshot().player.cannonDamage).toBe(BASE_CANNON_DAMAGE);

    const armed = simulation.snapshot();
    simulation.restore({
      ...armed,
      player: { ...armed.player, cannonUnlocked: true },
      enemies: [
        { id: 'cannon-left', kind: 'melee', x: -0.6, z: 3, hp: 3, telegraphSeconds: 0, deathSeconds: 0 },
        { id: 'cannon-right', kind: 'melee', x: 0.6, z: 3, hp: 3, telegraphSeconds: 0, deathSeconds: 0 },
      ],
      arrows: [{ id: 900, weapon: 'cannon', x: 0, z: 2.5, vx: 0, damage: BASE_CANNON_DAMAGE, blastRadius: CANNON_BLAST_RADIUS, piercesRemaining: 0, hitEnemyIds: [], hitBoss: false }],
    });
    simulation.tick(1 / 30);
    const result = simulation.snapshot();
    expect(result.arrows).toHaveLength(0);
    expect(result.enemies.every((enemy) => enemy.hp < 3)).toBe(true);
  });

  it('scales cannon damage and blast radius from full and dropped Buffs', () => {
    const simulation = new M1RunSimulation();
    simulation.start();
    const started = simulation.snapshot();
    simulation.restore({
      ...started,
      player: { ...started.player, x: 0, cannonUnlocked: true },
      pickups: [
        { id: 901, x: 0, z: 1.2, buffId: 'cannon_damage', label: '砲彈傷害 +11.7%' },
        { id: 902, x: 0, z: 1.2, buffId: 'cannon_radius', label: '砲擊範圍 +3.3%' },
      ],
    });

    simulation.tick(1 / 30);
    const upgraded = simulation.snapshot();
    expect(upgraded.player.cannonDamage).toBeCloseTo(BASE_CANNON_DAMAGE * (1 + CANNON_DAMAGE_BONUS / 3));
    expect(upgraded.player.cannonBlastRadius).toBeCloseTo(CANNON_BLAST_RADIUS * (1 + CANNON_RADIUS_BONUS / 3));

    simulation.tick(0.1);
    const cannonShot = simulation.snapshot().arrows.find((arrow) => arrow.weapon === 'cannon');
    expect(cannonShot?.damage).toBeCloseTo(upgraded.player.cannonDamage);
    expect(cannonShot?.blastRadius).toBeCloseTo(upgraded.player.cannonBlastRadius);
  });

  it('reaches Boss reward and applies it exactly once', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 100 });
    simulation.setTargetX(5);
    advanceToBossReward(simulation);

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
    source.start({ healthLevel: 100 });
    source.setTargetX(5);
    advanceToBossReward(source);
    const restored = new M1RunSimulation();
    expect(restored.restore(source.snapshot())).toBe(true);
    expect(restored.snapshot().phase).toBe('reward');
    expect(restored.snapshot().rewardOptions).toEqual(source.snapshot().rewardOptions);
  });

  it('carries the selected Build through all six chapters and stops after CH06', () => {
    const simulation = new M1RunSimulation();
    simulation.start({ healthLevel: 125, damageLevel: 5, fireRateLevel: 5 });
    const bossHpByChapter: number[] = [];

    for (let chapterIndex = 1; chapterIndex <= 6; chapterIndex += 1) {
      simulation.setTargetX(5);
      const reward = advanceToBossReward(simulation);
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
