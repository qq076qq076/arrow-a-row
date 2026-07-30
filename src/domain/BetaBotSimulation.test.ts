import { describe, expect, it } from 'vitest';
import { runBetaBotCampaigns, type BetaBuildId } from './BetaBotSimulation';

describe('M5 beta bot balance', () => {
  it('keeps all three supported builds completable across 1,000 deterministic campaigns', () => {
    const builds: readonly BetaBuildId[] = ['arrow_storm', 'deadeye', 'ironbark'];
    const metrics = builds.map((buildId, index) => runBetaBotCampaigns(buildId, index === 0 ? 334 : 333));
    const completionRates = metrics.map((metric) => metric.completionRate);

    expect(metrics.reduce((total, metric) => total + metric.campaigns, 0)).toBe(1_000);
    expect(metrics.every((metric) => metric.completedCampaigns > 0)).toBe(true);
    // The short-range lightning baseline intentionally makes the early run
    // less forgiving; keep a narrow spread while allowing the longer boss
    // windows that result from waiting for a one-unit lock opportunity.
    expect(Math.max(...completionRates) - Math.min(...completionRates)).toBeLessThanOrEqual(0.16);
    expect(metrics.every((metric) => metric.averageBossSeconds >= 20 && metric.averageBossSeconds <= 65 && metric.averageChoicesPerCampaign >= 3)).toBe(true);
  }, 45_000);
});
