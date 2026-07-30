export const BUFF_IDS = ['split_arrow', 'power_shot', 'swift_shot', 'rapid_fire', 'piercing_arrow', 'lightning_targets', 'lightning_damage', 'lightning_range', 'life_steal', 'vitality', 'windstep', 'barkskin'] as const;

export type BuffId = (typeof BUFF_IDS)[number];

export interface BuffDefinition {
  readonly id: BuffId;
  readonly gateLabel: string;
  readonly pickupLabel: string;
  readonly isOffensive: boolean;
}

/** Gate grants 100% of an effect; enemy drops grant the readable 1/3 variant. */
export const BUFF_CATALOG: Record<BuffId, BuffDefinition> = {
  split_arrow: { id: 'split_arrow', gateLabel: '+1 箭矢', pickupLabel: '箭矢碎片 +⅓', isOffensive: true },
  power_shot: { id: 'power_shot', gateLabel: '箭傷 +8.3%', pickupLabel: '箭傷 +2.8%', isOffensive: true },
  swift_shot: { id: 'swift_shot', gateLabel: '箭速 +25%', pickupLabel: '箭速 +8%', isOffensive: true },
  rapid_fire: { id: 'rapid_fire', gateLabel: '射速 +12%', pickupLabel: '射速 +4%', isOffensive: true },
  piercing_arrow: { id: 'piercing_arrow', gateLabel: '穿透 +1', pickupLabel: '穿透碎片 +⅓', isOffensive: true },
  lightning_targets: { id: 'lightning_targets', gateLabel: '電擊目標 +1', pickupLabel: '鎖定碎片 +⅓', isOffensive: true },
  lightning_damage: { id: 'lightning_damage', gateLabel: '電擊傷害 +0.67', pickupLabel: '電能 +0.22', isOffensive: true },
  lightning_range: { id: 'lightning_range', gateLabel: '電擊距離 +6', pickupLabel: '電距 +2', isOffensive: true },
  life_steal: { id: 'life_steal', gateLabel: '吸血 +10%', pickupLabel: '吸血 +3.3%', isOffensive: true },
  vitality: { id: 'vitality', gateLabel: '生命 +20', pickupLabel: '生命 +7', isOffensive: false },
  windstep: { id: 'windstep', gateLabel: '移速 +20%', pickupLabel: '移速 +7%', isOffensive: false },
  barkskin: { id: 'barkskin', gateLabel: '減傷 +15%', pickupLabel: '減傷 +5%', isOffensive: false },
};

export const OFFENSIVE_BUFF_IDS = BUFF_IDS.filter((id) => BUFF_CATALOG[id].isOffensive);
