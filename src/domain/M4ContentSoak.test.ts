import { describe, expect, it } from 'vitest';
import { M1RunSimulation } from './M1RunSimulation';

function clearChapter(simulation: M1RunSimulation): void {
  simulation.setTargetX(5);
  for (let tick = 0; tick < 12_000 && simulation.snapshot().phase !== 'reward' && simulation.snapshot().phase !== 'dead'; tick += 1) {
    const snapshot = simulation.snapshot();
    if (snapshot.phase === 'echo') {
      expect(snapshot.rewardOptions).toHaveLength(3);
      expect(new Set(snapshot.rewardOptions).size).toBe(3);
      expect(simulation.chooseReward(snapshot.rewardOptions[0]!)).toBe(true);
      continue;
    }
    if (snapshot.distanceMeters >= 42) simulation.setTargetX(0);
    simulation.tick(1 / 30);
  }
  const reward = simulation.snapshot();
  expect(reward.phase).toBe('reward');
  expect(reward.rewardOptions).toHaveLength(3);
  expect(new Set(reward.rewardOptions).size).toBe(3);
  expect(simulation.chooseReward(reward.rewardOptions[0]!)).toBe(true);
}

describe('M4 content soak', () => {
  it('completes 100 consecutive CH01–CH03 campaigns without a soft lock', () => {
    for (let run = 0; run < 100; run += 1) {
      const simulation = new M1RunSimulation();
      simulation.start({ healthLevel: 5, damageLevel: 5, fireRateLevel: 5, arrowSpeedLevel: 5, pierceLevel: 5, movementLevel: 5 });

      for (let chapter = 1; chapter <= 3; chapter += 1) {
        clearChapter(simulation);
        expect(simulation.snapshot().chapterId).toBe(`ch0${chapter}_${['meadow', 'viaduct', 'forge'][chapter - 1]}`);
        expect(simulation.continueToNextChapter()).toBe(true);
      }
    }
  });
});
