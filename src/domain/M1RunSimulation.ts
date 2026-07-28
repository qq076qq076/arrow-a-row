export type RunPhase = 'menu' | 'playing' | 'reward' | 'dead' | 'complete';
export type EnemyKind = 'melee' | 'ranged';
export type RewardId = 'storm_bow' | 'blade_nexus' | 'heartwood';

export interface PlayerSnapshot { readonly x: number; readonly hp: number; readonly maxHp: number; readonly damage: number; readonly projectileCount: number; readonly swordCount: number; }
export interface EnemySnapshot { readonly id: string; readonly kind: EnemyKind; readonly x: number; readonly z: number; readonly hp: number; readonly telegraphSeconds: number; }
export interface GateSnapshot { readonly groupId: string; readonly leftLabel: string; readonly rightLabel: string; readonly z: number; readonly isChosen: boolean; }
export interface ArrowSnapshot { readonly id: number; readonly x: number; readonly z: number; }
export interface BossSnapshot { readonly id: 'bos_moss_crown_a'; readonly hp: number; readonly maxHp: number; readonly phase: 1 | 2; readonly telegraphSeconds: number; readonly telegraphText: string; readonly isDefeated: boolean; }
export interface M1RunSnapshot {
  readonly phase: RunPhase; readonly elapsedSeconds: number; readonly distanceMeters: number; readonly player: PlayerSnapshot;
  readonly enemies: readonly EnemySnapshot[]; readonly gates: readonly GateSnapshot[]; readonly arrows: readonly ArrowSnapshot[]; readonly selectedGateIds: readonly string[];
  readonly boss: BossSnapshot | undefined; readonly rewardOptions: readonly RewardId[]; readonly selectedReward: RewardId | undefined; readonly earnedGold: number;
}

interface MutableEnemy { id: string; kind: EnemyKind; x: number; z: number; hp: number; attackCooldownSeconds: number; telegraphSeconds: number; }
interface MutableGate { groupId: string; leftLabel: string; rightLabel: string; z: number; isChosen: boolean; }
interface MutableArrow { id: number; x: number; z: number; }
interface MutableBoss { hp: number; maxHp: number; phase: 1 | 2; telegraphSeconds: number; telegraphText: string; attackCooldownSeconds: number; isDefeated: boolean; }

const WORLD_SPEED = 4;
const PLAYER_MAX_X = 5;
const PLAYER_MOVE_SPEED = 10;
const BOSS_START_DISTANCE = 48;
const REWARDS: readonly RewardId[] = ['storm_bow', 'blade_nexus', 'heartwood'];

export class M1RunSimulation {
  private phase: RunPhase = 'menu'; private elapsedSeconds = 0; private distanceMeters = 0; private targetX = 0;
  private player = { x: 0, hp: 100, maxHp: 100, damage: 1, projectileCount: 1, swordCount: 0 };
  private attackCooldownSeconds = 0; private nextArrowId = 1; private earnedGold = 0; private boss: MutableBoss | undefined;
  private selectedReward: RewardId | undefined; private readonly selectedGateIds = new Set<string>(); private readonly enemies: MutableEnemy[] = []; private readonly arrows: MutableArrow[] = [];
  private readonly gates: MutableGate[] = [
    { groupId: 'g01', leftLabel: '+1 箭矢', rightLabel: '最大 HP +25', z: 10, isChosen: false },
    { groupId: 'g02', leftLabel: '箭傷 +25%', rightLabel: '回復 25 HP', z: 28, isChosen: false },
  ];

  public start(): void {
    this.phase = 'playing'; this.elapsedSeconds = 0; this.distanceMeters = 0; this.targetX = 0; this.earnedGold = 0; this.boss = undefined; this.selectedReward = undefined;
    this.player = { x: 0, hp: 100, maxHp: 100, damage: 1, projectileCount: 1, swordCount: 0 }; this.attackCooldownSeconds = 0; this.nextArrowId = 1;
    this.selectedGateIds.clear(); this.enemies.length = 0; this.arrows.length = 0;
    this.gates.splice(0, this.gates.length,
      { groupId: 'g01', leftLabel: '+1 箭矢', rightLabel: '最大 HP +25', z: 10, isChosen: false },
      { groupId: 'g02', leftLabel: '箭傷 +25%', rightLabel: '回復 25 HP', z: 28, isChosen: false });
  }

  /** Restores only data produced by snapshot(); cooldowns restart safely on resume. */
  public restore(snapshot: M1RunSnapshot): boolean {
    if (snapshot.phase !== 'playing' && snapshot.phase !== 'reward') return false;
    this.phase = snapshot.phase; this.elapsedSeconds = snapshot.elapsedSeconds; this.distanceMeters = snapshot.distanceMeters; this.targetX = snapshot.player.x;
    this.player = { ...snapshot.player }; this.attackCooldownSeconds = 0.1; this.nextArrowId = Math.max(1, ...snapshot.arrows.map((arrow) => arrow.id + 1)); this.earnedGold = snapshot.earnedGold; this.selectedReward = snapshot.selectedReward;
    this.selectedGateIds.clear(); snapshot.selectedGateIds.forEach((id) => this.selectedGateIds.add(id)); this.enemies.splice(0, this.enemies.length, ...snapshot.enemies.map((enemy) => ({ ...enemy, attackCooldownSeconds: 0.5 }))); this.arrows.splice(0, this.arrows.length, ...snapshot.arrows.map((arrow) => ({ ...arrow })));
    this.gates.splice(0, this.gates.length, ...snapshot.gates.map((gate) => ({ ...gate })));
    this.boss = snapshot.boss === undefined ? undefined : { hp: snapshot.boss.hp, maxHp: snapshot.boss.maxHp, phase: snapshot.boss.phase, telegraphSeconds: snapshot.boss.telegraphSeconds, telegraphText: snapshot.boss.telegraphText, attackCooldownSeconds: 1, isDefeated: snapshot.boss.isDefeated };
    return true;
  }

  public setTargetX(targetX: number): void { this.targetX = Math.max(-PLAYER_MAX_X, Math.min(PLAYER_MAX_X, targetX)); }
  public chooseReward(rewardId: RewardId): boolean {
    if (this.phase !== 'reward' || this.selectedReward !== undefined || !REWARDS.includes(rewardId)) return false;
    this.selectedReward = rewardId;
    if (rewardId === 'storm_bow') this.player.projectileCount += 2;
    if (rewardId === 'blade_nexus') this.player.swordCount += 2;
    if (rewardId === 'heartwood') { this.player.maxHp += 60; this.player.hp += 60; }
    this.phase = 'complete';
    return true;
  }

  public tick(deltaSeconds: number): void {
    if (this.phase !== 'playing') return;
    this.elapsedSeconds += deltaSeconds; this.movePlayer(deltaSeconds); this.resolveGates(); this.spawnEnemies(); this.updateEnemies(deltaSeconds);
    if (this.boss === undefined && this.distanceMeters >= BOSS_START_DISTANCE) this.spawnBoss();
    this.updateBoss(deltaSeconds); this.attackCooldownSeconds -= deltaSeconds;
    if (this.attackCooldownSeconds <= 0) this.fireAtNearestTarget(); this.updateArrows(deltaSeconds);
    if (this.player.hp <= 0) this.phase = 'dead';
    if (this.boss === undefined) this.distanceMeters += WORLD_SPEED * deltaSeconds;
  }

  public snapshot(): M1RunSnapshot {
    return { phase: this.phase, elapsedSeconds: this.elapsedSeconds, distanceMeters: this.distanceMeters, player: { ...this.player }, enemies: this.enemies.map((enemy) => ({ ...enemy })), gates: this.gates.map((gate) => ({ ...gate })), arrows: this.arrows.map((arrow) => ({ ...arrow })), selectedGateIds: [...this.selectedGateIds], boss: this.boss === undefined ? undefined : { id: 'bos_moss_crown_a', hp: this.boss.hp, maxHp: this.boss.maxHp, phase: this.boss.phase, telegraphSeconds: this.boss.telegraphSeconds, telegraphText: this.boss.telegraphText, isDefeated: this.boss.isDefeated }, rewardOptions: REWARDS, selectedReward: this.selectedReward, earnedGold: this.earnedGold };
  }

  private movePlayer(deltaSeconds: number): void { const delta = this.targetX - this.player.x; const maxMove = PLAYER_MOVE_SPEED * deltaSeconds; this.player.x += Math.max(-maxMove, Math.min(maxMove, delta)); }
  private resolveGates(): void { for (const gate of this.gates) { if (gate.isChosen || this.distanceMeters < gate.z) continue; const isLeft = this.player.x < 0; gate.isChosen = true; this.selectedGateIds.add(gate.groupId); if (gate.groupId === 'g01' && isLeft) this.player.projectileCount += 1; if (gate.groupId === 'g01' && !isLeft) { this.player.maxHp += 25; this.player.hp += 25; } if (gate.groupId === 'g02' && isLeft) this.player.damage *= 1.25; if (gate.groupId === 'g02' && !isLeft) this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25); } }
  private spawnEnemies(): void { if (this.distanceMeters >= 15 && !this.hasEnemy('melee-1')) this.enemies.push({ id: 'melee-1', kind: 'melee', x: -2, z: 30, hp: 8, attackCooldownSeconds: 0, telegraphSeconds: 0 }, { id: 'melee-2', kind: 'melee', x: 0, z: 34, hp: 8, attackCooldownSeconds: 0, telegraphSeconds: 0 }, { id: 'melee-3', kind: 'melee', x: 2, z: 38, hp: 8, attackCooldownSeconds: 0, telegraphSeconds: 0 }); if (this.distanceMeters >= 35 && !this.hasEnemy('ranged-1')) this.enemies.push({ id: 'ranged-1', kind: 'ranged', x: 0, z: 38, hp: 12, attackCooldownSeconds: 2, telegraphSeconds: 0 }); }
  private updateEnemies(deltaSeconds: number): void { for (const enemy of this.enemies) { enemy.z -= WORLD_SPEED * deltaSeconds; enemy.attackCooldownSeconds -= deltaSeconds; if (enemy.kind === 'melee' && enemy.z <= 1.2 && enemy.attackCooldownSeconds <= 0) { this.player.hp -= 10; enemy.attackCooldownSeconds = 1; } if (enemy.kind === 'ranged') { if (enemy.attackCooldownSeconds <= 0 && enemy.telegraphSeconds <= 0) enemy.telegraphSeconds = 0.6; if (enemy.telegraphSeconds > 0) { enemy.telegraphSeconds -= deltaSeconds; if (enemy.telegraphSeconds <= 0) { if (Math.abs(this.player.x - enemy.x) < 1.2) this.player.hp -= 12; enemy.attackCooldownSeconds = 3.5; } } } } }
  private spawnBoss(): void { this.enemies.length = 0; this.boss = { hp: 36, maxHp: 36, phase: 1, telegraphSeconds: 0.8, telegraphText: '苔冠守衛被靜滯困住了。', attackCooldownSeconds: 2.5, isDefeated: false }; }
  private updateBoss(deltaSeconds: number): void { const boss = this.boss; if (boss === undefined || boss.isDefeated) return; if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { boss.phase = 2; boss.telegraphSeconds = 0.8; boss.telegraphText = '靜滯正在加深！'; boss.attackCooldownSeconds = 2.2; } boss.attackCooldownSeconds -= deltaSeconds; if (boss.telegraphSeconds > 0) { boss.telegraphSeconds -= deltaSeconds; if (boss.telegraphSeconds <= 0 && boss.telegraphText !== '靜滯正在加深！') { if (Math.abs(this.player.x) < 2.3) this.player.hp -= boss.phase === 1 ? 14 : 20; boss.attackCooldownSeconds = boss.phase === 1 ? 2.7 : 2.1; } return; } if (boss.attackCooldownSeconds <= 0) { boss.telegraphSeconds = 0.75; boss.telegraphText = boss.phase === 1 ? '藤刺正在瞄準！' : '震波正在擴散！'; } }
  private fireAtNearestTarget(): void { this.attackCooldownSeconds = 0.45; const target = this.boss !== undefined && !this.boss.isDefeated ? 'boss' : this.enemies.filter((enemy) => enemy.z > 0).sort((a, b) => a.z - b.z)[0]; if (target === undefined) return; for (let index = 0; index < this.player.projectileCount; index += 1) { const offset = (index - (this.player.projectileCount - 1) / 2) * 0.3; this.arrows.push({ id: this.nextArrowId++, x: this.player.x + offset, z: 1 }); if (target === 'boss') { this.boss!.hp -= this.player.damage; if (this.boss!.hp <= 0) { this.boss!.hp = 0; this.boss!.isDefeated = true; this.earnedGold = 30; this.phase = 'reward'; } } else if (Math.abs(target.x - (this.player.x + offset)) < 2.5) target.hp -= this.player.damage; } }
  private updateArrows(deltaSeconds: number): void { for (const arrow of this.arrows) arrow.z += 24 * deltaSeconds; for (let index = this.arrows.length - 1; index >= 0; index -= 1) { const arrow = this.arrows[index]; if (arrow !== undefined && arrow.z > 45) this.arrows.splice(index, 1); } for (let index = this.enemies.length - 1; index >= 0; index -= 1) { const enemy = this.enemies[index]; if (enemy !== undefined && (enemy.hp <= 0 || enemy.z < -2)) this.enemies.splice(index, 1); } }
  private hasEnemy(id: string): boolean { return this.enemies.some((enemy) => enemy.id === id); }
}
