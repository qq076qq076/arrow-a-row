export interface AchievementDefinition { readonly id: string; readonly title: string; readonly description: string; }
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first_rift', title: '初線修復', description: '完成 CH01。' }, { id: 'mirror_route', title: '鏡面航線', description: '完成 CH02。' }, { id: 'ember_heart', title: '熾心止息', description: '完成 CH03。' }, { id: 'full_fan', title: '風之扇面', description: '同時擁有三支箭。' },
  { id: 'piercing_line', title: '穿線者', description: '取得穿透 +1。' }, { id: 'swift_current', title: '流光疾行', description: '箭速達到 30。' }, { id: 'blade_circle', title: '刃環初成', description: '擁有兩把飛劍。' }, { id: 'iron_path', title: '樹甲之路', description: '減傷達到 20%。' },
  { id: 'dust_collector', title: '晶塵拾荒者', description: '單局拾取 10 晶塵。' }, { id: 'echo_choice', title: '回響抉擇', description: '選擇第一份 Boss 回響。' }, { id: 'sixfold_thread', title: '六重引線', description: '完成 CH06。' }, { id: 'permanent_hand', title: '曙站常客', description: '購買任一永久強化。' },
];
