import { M1RunSimulation, type RewardId } from './M1RunSimulation';
import type { BuffId } from '../content/BuffCatalog';

export type BetaBuildId = 'arrow_storm' | 'deadeye' | 'ironbark';

export interface BetaBuildMetrics {
  readonly buildId: BetaBuildId;
  readonly campaigns: number;
  readonly completedCampaigns: number;
  readonly completionRate: number;
  readonly averageBossSeconds: number;
  readonly averageChoicesPerCampaign: number;
}

const BUILD_TARGETS: Record<BetaBuildId, { readonly buffId: BuffId; readonly rewardId: RewardId }> = {
  arrow_storm: { buffId: 'split_arrow', rewardId: 'storm_bow' },
  deadeye: { buffId: 'power_shot', rewardId: 'deadeye' },
  ironbark: { buffId: 'barkskin', rewardId: 'ironbark' },
};

export function runBetaBotCampaigns(buildId: BetaBuildId, campaigns: number): BetaBuildMetrics {
  const target = BUILD_TARGETS[buildId];
  let completedCampaigns = 0;
  let bossSeconds = 0;
  let choices = 0;
  const simulation = new M1RunSimulation();

  for (let campaign = 0; campaign < campaigns; campaign += 1) {
    simulation.start();
    let completed = true;
    for (let chapter = 0; chapter < 3; chapter += 1) {
      for (let tick = 0; tick < 12_000 && simulation.snapshot().phase === 'playing'; tick += 1) {
        const snapshot = simulation.snapshot();
        const nextGate = snapshot.gates.find((gate) => !gate.isChosen && gate.z >= snapshot.distanceMeters);
        if (snapshot.boss !== undefined || snapshot.distanceMeters >= 72) simulation.setTargetX(0);
        else if (nextGate?.leftBuffId === target.buffId) simulation.setTargetX(-5);
        else if (nextGate?.rightBuffId === target.buffId) simulation.setTargetX(5);
        else simulation.setTargetX(5);
        simulation.tick(1 / 30);
      }

      const result = simulation.snapshot();
      if (result.phase !== 'reward') { completed = false; break; }
      bossSeconds += result.elapsedSeconds;
      choices += result.selectedGateIds.length;
      const reward = result.rewardOptions.includes(target.rewardId) ? target.rewardId : result.rewardOptions[0]!;
      simulation.chooseReward(reward);
      if (chapter < 2 && !simulation.continueToNextChapter()) { completed = false; break; }
    }
    if (completed) completedCampaigns += 1;
  }

  const completedChapters = completedCampaigns * 3;
  return {
    buildId,
    campaigns,
    completedCampaigns,
    completionRate: completedCampaigns / campaigns,
    averageBossSeconds: completedChapters === 0 ? 0 : bossSeconds / completedChapters,
    averageChoicesPerCampaign: choices / campaigns,
  };
}
