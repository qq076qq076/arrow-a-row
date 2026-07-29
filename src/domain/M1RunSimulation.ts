import { getChapterDefinition, getNextChapterDefinition, type ChapterId } from '../content/ChapterDefinitions';
import { BUFF_CATALOG, BUFF_IDS, OFFENSIVE_BUFF_IDS, type BuffId } from '../content/BuffCatalog';

export type RunPhase = 'menu' | 'playing' | 'reward' | 'dead' | 'complete';
export type EnemyKind = 'melee' | 'ranged';
export type RewardId = 'storm_bow' | 'blade_nexus' | 'heartwood' | 'deadeye' | 'gale_heart' | 'ironbark';
export interface RunModifiers { readonly healthLevel?: number; readonly damageLevel?: number; readonly fireRateLevel?: number; readonly arrowSpeedLevel?: number; readonly pierceLevel?: number; readonly movementLevel?: number; }

export interface PlayerSnapshot { readonly x: number; readonly hp: number; readonly maxHp: number; readonly damage: number; readonly projectileCount: number; readonly arrowSpeed: number; readonly swordCount: number; readonly pierceCount: number; readonly movementSpeed: number; readonly damageReduction: number; readonly fireRateMultiplier: number; readonly arrowCharge: number; readonly pierceCharge: number; readonly swordCharge: number; }
export interface EnemySnapshot { readonly id: string; readonly kind: EnemyKind; readonly x: number; readonly z: number; readonly hp: number; readonly telegraphSeconds: number; readonly deathSeconds: number; }
export interface GateSnapshot { readonly groupId: string; readonly leftLabel: string; readonly rightLabel: string; readonly leftBuffId: BuffId; readonly rightBuffId: BuffId; readonly z: number; readonly isChosen: boolean; }
export interface ArrowSnapshot { readonly id: number; readonly x: number; readonly z: number; readonly vx: number; readonly piercesRemaining: number; readonly hitEnemyIds: readonly string[]; readonly hitBoss: boolean; }
export interface HitSnapshot { readonly id: number; readonly x: number; readonly z: number; readonly seconds: number; }
export interface PickupSnapshot { readonly id: number; readonly x: number; readonly z: number; readonly buffId: BuffId; readonly label: string; }
export interface BossSnapshot { readonly id: 'bos_moss_crown_a'; readonly hp: number; readonly maxHp: number; readonly z: number; readonly phase: 1 | 2; readonly telegraphSeconds: number; readonly telegraphText: string; readonly isDefeated: boolean; }
export interface M1RunSnapshot {
  readonly phase: RunPhase; readonly chapterId: ChapterId; readonly chapterTitle: string; readonly elapsedSeconds: number; readonly distanceMeters: number; readonly player: PlayerSnapshot;
  readonly enemies: readonly EnemySnapshot[]; readonly gates: readonly GateSnapshot[]; readonly arrows: readonly ArrowSnapshot[]; readonly hits: readonly HitSnapshot[]; readonly pickups: readonly PickupSnapshot[]; readonly collectedShards: number; readonly selectedGateIds: readonly string[];
  readonly boss: BossSnapshot | undefined; readonly rewardOptions: readonly RewardId[]; readonly selectedReward: RewardId | undefined; readonly earnedGold: number;
}

interface MutableEnemy { id: string; kind: EnemyKind; x: number; z: number; hp: number; attackCooldownSeconds: number; telegraphSeconds: number; deathSeconds: number; }
interface MutableGate { groupId: string; leftLabel: string; rightLabel: string; leftBuffId: BuffId; rightBuffId: BuffId; z: number; isChosen: boolean; }
interface MutableArrow { id: number; x: number; z: number; vx: number; piercesRemaining: number; hitEnemyIds: string[]; hitBoss: boolean; }
interface MutableHit { id: number; x: number; z: number; seconds: number; }
interface MutablePickup { id: number; x: number; z: number; buffId: BuffId; label: string; }
interface MutableBoss { hp: number; maxHp: number; z: number; phase: 1 | 2; telegraphSeconds: number; telegraphText: string; attackCooldownSeconds: number; isDefeated: boolean; }

const WORLD_SPEED = 4;
const PLAYER_MAX_X = 5;
const PLAYER_MOVE_SPEED = 10;
const BOSS_START_DISTANCE = 78;
const REWARDS: readonly RewardId[] = ['storm_bow', 'blade_nexus', 'heartwood', 'deadeye', 'gale_heart', 'ironbark'];

export class M1RunSimulation {
  private phase: RunPhase = 'menu'; private chapterId: ChapterId = 'ch01_meadow'; private elapsedSeconds = 0; private distanceMeters = 0; private targetX = 0;
  private player = { x: 0, hp: 100, maxHp: 100, damage: 1, projectileCount: 1, arrowSpeed: 24, swordCount: 0, pierceCount: 0, movementSpeed: PLAYER_MOVE_SPEED, damageReduction: 0, fireRateMultiplier: 1, arrowCharge: 0, pierceCharge: 0, swordCharge: 0 };
  private attackCooldownSeconds = 0; private attackIntervalSeconds = 0.45; private nextArrowId = 1; private nextEffectId = 1; private earnedGold = 0; private collectedShards = 0; private boss: MutableBoss | undefined;
  private selectedReward: RewardId | undefined; private rewardOptions: RewardId[] = []; private randomState = 1; private runNumber = 0; private readonly selectedGateIds = new Set<string>(); private readonly spawnedWaveIds = new Set<string>(); private readonly positionedEnemyIds = new Set<string>(); private readonly enemies: MutableEnemy[] = []; private readonly arrows: MutableArrow[] = []; private readonly hits: MutableHit[] = []; private readonly pickups: MutablePickup[] = [];
  private readonly gates: MutableGate[] = [
    { groupId: 'g01', leftLabel: '+1 箭矢', rightLabel: '箭傷 +25%', leftBuffId: 'split_arrow', rightBuffId: 'power_shot', z: 10, isChosen: false },
    { groupId: 'g02', leftLabel: '箭速 +25%', rightLabel: '飛劍 +1', leftBuffId: 'swift_shot', rightBuffId: 'flying_sword', z: 28, isChosen: false },
    { groupId: 'g03', leftLabel: '+1 箭矢', rightLabel: '箭傷 +25%', leftBuffId: 'split_arrow', rightBuffId: 'power_shot', z: 42, isChosen: false },
  ];

  public start(modifiers: RunModifiers = {}, chapterId: ChapterId = 'ch01_meadow'): void {
    const chapter = getChapterDefinition(chapterId);
    this.chapterId = chapter.id;
    this.randomState = (chapter.index * 2654435761 + ++this.runNumber) >>> 0;
    this.phase = 'playing'; this.elapsedSeconds = 0; this.distanceMeters = 0; this.targetX = 0; this.earnedGold = 0; this.boss = undefined; this.selectedReward = undefined; this.rewardOptions = [];
    const maxHp = 100 + (modifiers.healthLevel ?? 0) * 10;
    this.player = { x: 0, hp: maxHp, maxHp, damage: 1 + (modifiers.damageLevel ?? 0) * 0.2, projectileCount: 1, arrowSpeed: 24 + (modifiers.arrowSpeedLevel ?? 0) * 2, swordCount: 0, pierceCount: modifiers.pierceLevel ?? 0, movementSpeed: PLAYER_MOVE_SPEED + (modifiers.movementLevel ?? 0), damageReduction: 0, fireRateMultiplier: 1, arrowCharge: 0, pierceCharge: 0, swordCharge: 0 }; this.attackCooldownSeconds = 0; this.attackIntervalSeconds = Math.max(0.25, 0.45 - (modifiers.fireRateLevel ?? 0) * 0.04); this.nextArrowId = 1; this.nextEffectId = 1; this.collectedShards = 0;
    this.selectedGateIds.clear(); this.spawnedWaveIds.clear(); this.positionedEnemyIds.clear(); this.enemies.length = 0; this.arrows.length = 0; this.hits.length = 0; this.pickups.length = 0;
    this.gates.splice(0, this.gates.length, ...this.createGates());
  }

  /** Restores only data produced by snapshot(); cooldowns restart safely on resume. */
  public restore(snapshot: M1RunSnapshot): boolean {
    if (snapshot.phase !== 'playing' && snapshot.phase !== 'reward') return false;
    this.phase = snapshot.phase; this.chapterId = snapshot.chapterId ?? 'ch01_meadow'; this.elapsedSeconds = snapshot.elapsedSeconds; this.distanceMeters = snapshot.distanceMeters; this.targetX = snapshot.player.x;
    this.player = { ...snapshot.player, pierceCount: snapshot.player.pierceCount ?? 0, pierceCharge: snapshot.player.pierceCharge ?? 0 }; this.attackCooldownSeconds = 0.1; this.nextArrowId = Math.max(1, ...snapshot.arrows.map((arrow) => arrow.id + 1)); this.earnedGold = snapshot.earnedGold; this.collectedShards = snapshot.collectedShards ?? 0; this.selectedReward = snapshot.selectedReward; this.rewardOptions = [...snapshot.rewardOptions];
    this.selectedGateIds.clear(); snapshot.selectedGateIds.forEach((id) => this.selectedGateIds.add(id)); this.positionedEnemyIds.clear(); snapshot.enemies.forEach((enemy) => this.positionedEnemyIds.add(enemy.id)); this.enemies.splice(0, this.enemies.length, ...snapshot.enemies.map((enemy) => ({ ...enemy, deathSeconds: enemy.deathSeconds ?? 0, attackCooldownSeconds: 0.5 }))); this.arrows.splice(0, this.arrows.length, ...snapshot.arrows.map((arrow) => ({ ...arrow, vx: arrow.vx ?? 0, piercesRemaining: arrow.piercesRemaining ?? 0, hitEnemyIds: [...(arrow.hitEnemyIds ?? [])], hitBoss: arrow.hitBoss ?? false })));
    this.gates.splice(0, this.gates.length, ...snapshot.gates.map((gate) => ({ ...gate }))); this.hits.splice(0, this.hits.length, ...(snapshot.hits ?? []).map((hit) => ({ ...hit }))); this.pickups.splice(0, this.pickups.length, ...(snapshot.pickups ?? []).map((pickup) => ({ ...pickup })));
    this.boss = snapshot.boss === undefined ? undefined : { hp: snapshot.boss.hp, maxHp: snapshot.boss.maxHp, z: snapshot.boss.z ?? 15, phase: snapshot.boss.phase, telegraphSeconds: snapshot.boss.telegraphSeconds, telegraphText: snapshot.boss.telegraphText, attackCooldownSeconds: 1, isDefeated: snapshot.boss.isDefeated };
    return true;
  }

  public setTargetX(targetX: number): void { this.targetX = Math.max(-PLAYER_MAX_X, Math.min(PLAYER_MAX_X, targetX)); }
  public chooseReward(rewardId: RewardId): boolean {
    if (this.phase !== 'reward' || this.selectedReward !== undefined || !this.rewardOptions.includes(rewardId)) return false;
    this.selectedReward = rewardId;
    if (rewardId === 'storm_bow') { this.player.projectileCount += 2; this.player.damage *= 1.4; }
    if (rewardId === 'blade_nexus') this.player.swordCount += 2;
    if (rewardId === 'heartwood') { this.player.maxHp += 60; this.player.hp += 60; }
    if (rewardId === 'deadeye') this.player.damage *= 1.35;
    if (rewardId === 'gale_heart') this.player.arrowSpeed *= 1.4;
    if (rewardId === 'ironbark') { this.player.damageReduction = Math.min(0.6, this.player.damageReduction + 0.4); this.player.maxHp += 30; this.player.hp += 30; }
    this.phase = 'complete';
    return true;
  }

  public continueToNextChapter(): boolean {
    if (this.phase !== 'complete') return false;
    const next = getNextChapterDefinition(this.chapterId);
    if (next === undefined) return false;
    this.chapterId = next.id; this.phase = 'playing'; this.elapsedSeconds = 0; this.distanceMeters = 0; this.targetX = 0; this.boss = undefined; this.selectedReward = undefined; this.rewardOptions = []; this.earnedGold = 0; this.attackCooldownSeconds = 0;
    this.enemies.length = 0; this.arrows.length = 0; this.hits.length = 0; this.pickups.length = 0; this.selectedGateIds.clear(); this.spawnedWaveIds.clear(); this.positionedEnemyIds.clear();
    this.randomState = (getChapterDefinition(next.id).index * 2654435761 + ++this.runNumber) >>> 0;
    this.gates.splice(0, this.gates.length, ...this.createGates());
    return true;
  }

  public tick(deltaSeconds: number): void {
    if (this.phase !== 'playing') return;
    this.elapsedSeconds += deltaSeconds; this.movePlayer(deltaSeconds); this.resolveGates(); this.spawnEnemies(); this.spawnExtraWaves(); this.updateEnemies(deltaSeconds);
    if (this.boss === undefined && this.distanceMeters >= BOSS_START_DISTANCE) this.spawnBoss();
    this.updateBoss(deltaSeconds); this.attackCooldownSeconds -= deltaSeconds;
    if (this.attackCooldownSeconds <= 0) this.fireAtNearestTarget(); this.updateArrows(deltaSeconds); this.updateEffects(deltaSeconds); this.updatePickups(deltaSeconds);
    if (this.player.hp <= 0) this.phase = 'dead';
    if (this.boss === undefined) this.distanceMeters += WORLD_SPEED * deltaSeconds;
  }

  public snapshot(): M1RunSnapshot {
    const chapter = getChapterDefinition(this.chapterId);
    return { phase: this.phase, chapterId: chapter.id, chapterTitle: chapter.title, elapsedSeconds: this.elapsedSeconds, distanceMeters: this.distanceMeters, player: { ...this.player }, enemies: this.enemies.map((enemy) => ({ ...enemy })), gates: this.gates.map((gate) => ({ ...gate })), arrows: this.arrows.map((arrow) => ({ ...arrow })), hits: this.hits.map((hit) => ({ ...hit })), pickups: this.pickups.map((pickup) => ({ ...pickup })), collectedShards: this.collectedShards, selectedGateIds: [...this.selectedGateIds], boss: this.boss === undefined ? undefined : { id: 'bos_moss_crown_a', hp: this.boss.hp, maxHp: this.boss.maxHp, z: this.boss.z, phase: this.boss.phase, telegraphSeconds: this.boss.telegraphSeconds, telegraphText: this.boss.telegraphText, isDefeated: this.boss.isDefeated }, rewardOptions: this.rewardOptions, selectedReward: this.selectedReward, earnedGold: this.earnedGold };
  }

  private movePlayer(deltaSeconds: number): void { const delta = this.targetX - this.player.x; const maxMove = this.player.movementSpeed * deltaSeconds; this.player.x += Math.max(-maxMove, Math.min(maxMove, delta)); }
  private resolveGates(): void { for (const gate of this.gates) { if (gate.isChosen || this.distanceMeters < gate.z) continue; gate.isChosen = true; this.selectedGateIds.add(gate.groupId); this.applyBuff(this.player.x < 0 ? gate.leftBuffId : gate.rightBuffId, 1); } }
  private createGates(): MutableGate[] {
    const drawPair = (pool: readonly BuffId[]): readonly [BuffId, BuffId] => { const first = pool[this.nextRandomIndex(pool.length)]!; const alternatives = pool.filter((id) => id !== first); return [first, alternatives[this.nextRandomIndex(alternatives.length)]!]; };
    const first = drawPair(OFFENSIVE_BUFF_IDS); const second = drawPair(OFFENSIVE_BUFF_IDS); const third = drawPair(BUFF_IDS);
    return [this.makeGate('g01', 10, first), this.makeGate('g02', 28, second), this.makeGate('g03', 42, third)];
  }
  private makeGate(groupId: string, z: number, pair: readonly [BuffId, BuffId]): MutableGate { return { groupId, z, leftBuffId: pair[0], rightBuffId: pair[1], leftLabel: BUFF_CATALOG[pair[0]].gateLabel, rightLabel: BUFF_CATALOG[pair[1]].gateLabel, isChosen: false }; }
  private nextRandomIndex(length: number): number { this.randomState = (1664525 * this.randomState + 1013904223) >>> 0; return this.randomState % length; }
  private drawRewards(): RewardId[] { const pool = [...REWARDS]; const choices: RewardId[] = []; while (choices.length < 3) choices.push(pool.splice(this.nextRandomIndex(pool.length), 1)[0]!); return choices; }
  private applyBuff(buffId: BuffId, scale: number): void {
    if (buffId === 'split_arrow') { this.player.arrowCharge += scale; while (this.player.arrowCharge >= 1) { this.player.projectileCount += 1; this.player.arrowCharge -= 1; } }
    if (buffId === 'power_shot') this.player.damage *= 1 + 0.25 * scale;
    if (buffId === 'swift_shot') this.player.arrowSpeed *= 1 + 0.25 * scale;
    if (buffId === 'rapid_fire') this.player.fireRateMultiplier *= 1 - 0.12 * scale;
    if (buffId === 'piercing_arrow') { this.player.pierceCharge += scale; while (this.player.pierceCharge >= 1) { this.player.pierceCount += 1; this.player.pierceCharge -= 1; } }
    if (buffId === 'flying_sword') { this.player.swordCharge += scale; while (this.player.swordCharge >= 1) { this.player.swordCount += 1; this.player.swordCharge -= 1; } }
    if (buffId === 'vitality') { const amount = 20 * scale; this.player.maxHp += amount; this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount); }
    if (buffId === 'windstep') this.player.movementSpeed *= 1 + 0.2 * scale;
    if (buffId === 'barkskin') this.player.damageReduction = Math.min(0.6, this.player.damageReduction + 0.15 * scale);
  }
  private spawnEnemies(): void { const scale = getChapterDefinition(this.chapterId).enemyHpScale; if (this.chapterId === 'ch02_viaduct') { if (this.distanceMeters >= 15 && !this.hasEnemy('mirror-wing-1')) this.enemies.push({ id: 'mirror-wing-1', kind: 'ranged', x: -3, z: 30, hp: Math.round(12 * scale), attackCooldownSeconds: 1, telegraphSeconds: 0, deathSeconds: 0 }, { id: 'mirror-wing-2', kind: 'ranged', x: 3, z: 35, hp: Math.round(12 * scale), attackCooldownSeconds: 1.8, telegraphSeconds: 0, deathSeconds: 0 }); if (this.distanceMeters >= 35 && !this.hasEnemy('viaduct-runner-1')) this.enemies.push({ id: 'viaduct-runner-1', kind: 'melee', x: 0, z: 38, hp: Math.round(8 * scale), attackCooldownSeconds: 0, telegraphSeconds: 0, deathSeconds: 0 }); return; } if (this.chapterId === 'ch03_forge') { if (this.distanceMeters >= 15 && !this.hasEnemy('ember-shell-1')) this.enemies.push({ id: 'ember-shell-1', kind: 'melee', x: 0, z: 30, hp: Math.round(8 * scale), attackCooldownSeconds: 0, telegraphSeconds: 0, deathSeconds: 0 }, { id: 'ember-shell-2', kind: 'melee', x: -3, z: 36, hp: Math.round(8 * scale), attackCooldownSeconds: 0, telegraphSeconds: 0, deathSeconds: 0 }); if (this.distanceMeters >= 35 && !this.hasEnemy('forge-slinger-1')) this.enemies.push({ id: 'forge-slinger-1', kind: 'ranged', x: -2.5, z: 38, hp: Math.round(12 * scale), attackCooldownSeconds: 0.8, telegraphSeconds: 0, deathSeconds: 0 }, { id: 'forge-slinger-2', kind: 'ranged', x: 2.5, z: 41, hp: Math.round(12 * scale), attackCooldownSeconds: 1.5, telegraphSeconds: 0, deathSeconds: 0 }); return; } if (this.distanceMeters >= 15 && !this.hasEnemy('melee-1')) this.enemies.push({ id: 'melee-1', kind: 'melee', x: -2, z: 30, hp: Math.round(8 * scale), attackCooldownSeconds: 0, telegraphSeconds: 0, deathSeconds: 0 }, { id: 'melee-2', kind: 'melee', x: 0, z: 34, hp: Math.round(8 * scale), attackCooldownSeconds: 0, telegraphSeconds: 0, deathSeconds: 0 }, { id: 'melee-3', kind: 'melee', x: 2, z: 38, hp: Math.round(8 * scale), attackCooldownSeconds: 0, telegraphSeconds: 0, deathSeconds: 0 }); if (this.distanceMeters >= 35 && !this.hasEnemy('ranged-1')) this.enemies.push({ id: 'ranged-1', kind: 'ranged', x: 0, z: 38, hp: Math.round(12 * scale), attackCooldownSeconds: 2, telegraphSeconds: 0, deathSeconds: 0 }); }
  private spawnExtraWaves(): void { const scale = getChapterDefinition(this.chapterId).enemyHpScale; const add = (id: string, at: number, kind: EnemyKind, x: number): void => { if (this.distanceMeters >= at && !this.hasEnemy(id)) this.enemies.push({ id, kind, x, z: 38, hp: Math.round((kind === 'melee' ? 8 : 12) * scale), attackCooldownSeconds: kind === 'ranged' ? 1 : 0, telegraphSeconds: 0, deathSeconds: 0 }); }; add('wave-3a', 24, 'melee', -2); add('wave-3b', 24, 'melee', 2); add('wave-4a', 38, 'ranged', -3); add('wave-4b', 38, 'ranged', 3); add('wave-5a', 48, 'melee', 0); add('wave-6a', 56, 'ranged', -2.5); add('wave-6b', 56, 'ranged', 2.5); add('wave-7a', 66, 'melee', 0); }
  private updateEnemies(deltaSeconds: number): void { for (const enemy of this.enemies) { if (!this.positionedEnemyIds.has(enemy.id)) { enemy.x = Math.max(-4.6, Math.min(4.6, enemy.x + (this.nextRandomIndex(17) - 8) / 10)); this.positionedEnemyIds.add(enemy.id); } if (enemy.deathSeconds > 0) { enemy.deathSeconds = Math.max(0, enemy.deathSeconds - deltaSeconds); continue; } enemy.z -= WORLD_SPEED * deltaSeconds; enemy.attackCooldownSeconds -= deltaSeconds; if (enemy.kind === 'melee' && enemy.z <= 1.2 && Math.abs(this.player.x - enemy.x) < 1.2 && enemy.attackCooldownSeconds <= 0) { this.takeDamage(10); enemy.attackCooldownSeconds = 1; } if (enemy.kind === 'ranged') { if (enemy.attackCooldownSeconds <= 0 && enemy.telegraphSeconds <= 0) enemy.telegraphSeconds = 0.6; if (enemy.telegraphSeconds > 0) { enemy.telegraphSeconds -= deltaSeconds; if (enemy.telegraphSeconds <= 0) { if (Math.abs(this.player.x - enemy.x) < 1.2) this.takeDamage(12); enemy.attackCooldownSeconds = 3.5; } } } } }
  private spawnBoss(): void { const hp = getChapterDefinition(this.chapterId).bossHp; const messages: Record<ChapterId, string> = { ch01_meadow: '苔冠守衛被靜滯困住了。', ch02_viaduct: '鏡潮校準者正在鎖定航線！', ch03_forge: '熔脈監工正在蓄積震波！', ch04_canopy: '枝語母體正在喚醒霧冠！', ch05_archive: '無光抄錄者正在改寫星圖！', ch06_horizon: '靜滯之核正在撕裂地平！' }; this.boss = { hp, maxHp: hp, z: 46, phase: 1, telegraphSeconds: 0.8, telegraphText: messages[this.chapterId], attackCooldownSeconds: 2.5, isDefeated: false }; }
  private updateBoss(deltaSeconds: number): void { const boss = this.boss; if (boss === undefined || boss.isDefeated) return; if (boss.z > 15) { boss.z = Math.max(15, boss.z - WORLD_SPEED * deltaSeconds); return; } if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { boss.phase = 2; boss.telegraphSeconds = 0.8; boss.telegraphText = '靜滯正在加深！'; boss.attackCooldownSeconds = 2.2; } boss.attackCooldownSeconds -= deltaSeconds; if (boss.telegraphSeconds > 0) { boss.telegraphSeconds -= deltaSeconds; if (boss.telegraphSeconds <= 0 && boss.telegraphText !== '靜滯正在加深！') { if (Math.abs(this.player.x) < 2.3) this.takeDamage(boss.phase === 1 ? 14 : 20); boss.attackCooldownSeconds = boss.phase === 1 ? 2.7 : 2.1; } return; } if (boss.attackCooldownSeconds <= 0) { boss.telegraphSeconds = 0.75; boss.telegraphText = boss.phase === 1 ? '藤刺正在瞄準！' : '震波正在擴散！'; } }
  private fireAtNearestTarget(): void { this.attackCooldownSeconds = this.attackIntervalSeconds * this.player.fireRateMultiplier; for (let index = 0; index < this.player.projectileCount; index += 1) { const spreadIndex = index - (this.player.projectileCount - 1) / 2; const angleRadians = spreadIndex * 0.14; const offset = spreadIndex * 0.18; this.arrows.push({ id: this.nextArrowId++, x: this.player.x + offset, z: 1, vx: Math.sin(angleRadians) * this.player.arrowSpeed, piercesRemaining: this.player.pierceCount, hitEnemyIds: [], hitBoss: false }); } }
  private damageEnemy(enemy: MutableEnemy, damage: number): void { enemy.hp -= damage; this.addHit(enemy.x, enemy.z); if (enemy.hp <= 0) { enemy.hp = 0; enemy.deathSeconds = 0.45; const buffId = BUFF_IDS[this.nextRandomIndex(BUFF_IDS.length)]!; this.pickups.push({ id: this.nextEffectId++, x: enemy.x, z: enemy.z, buffId, label: BUFF_CATALOG[buffId].pickupLabel }); } }
  private takeDamage(amount: number): void { this.player.hp -= amount * (1 - this.player.damageReduction); }
  private addHit(x: number, z: number): void { this.hits.push({ id: this.nextEffectId++, x, z, seconds: 0.2 }); }
  private updateArrows(deltaSeconds: number): void { for (let index = this.arrows.length - 1; index >= 0; index -= 1) { const arrow = this.arrows[index]; if (arrow === undefined) continue; arrow.x += arrow.vx * deltaSeconds; arrow.z += Math.sqrt(Math.max(0, this.player.arrowSpeed ** 2 - arrow.vx ** 2)) * deltaSeconds; if (this.tryArrowHit(arrow)) { if (arrow.piercesRemaining <= 0) { this.arrows.splice(index, 1); continue; } arrow.piercesRemaining -= 1; } if (arrow.z > 45 || Math.abs(arrow.x) > 12) this.arrows.splice(index, 1); } for (let index = this.enemies.length - 1; index >= 0; index -= 1) { const enemy = this.enemies[index]; if (enemy !== undefined && (enemy.z < -2 || (enemy.hp <= 0 && enemy.deathSeconds <= 0))) this.enemies.splice(index, 1); } }
  private tryArrowHit(arrow: MutableArrow): boolean { const enemy = this.enemies.filter((candidate) => !arrow.hitEnemyIds.includes(candidate.id) && candidate.deathSeconds <= 0 && Math.abs(candidate.z - arrow.z) < 0.75 && Math.abs(candidate.x - arrow.x) < 0.85).sort((left, right) => left.z - right.z)[0]; if (enemy !== undefined) { arrow.hitEnemyIds.push(enemy.id); this.damageEnemy(enemy, this.player.damage); return true; } const boss = this.boss; if (boss !== undefined && !arrow.hitBoss && !boss.isDefeated && Math.abs(boss.z - arrow.z) < 1 && Math.abs(arrow.x) < 1.5) { arrow.hitBoss = true; boss.hp -= this.player.damage; this.addHit(0, boss.z); if (boss.hp <= 0) { boss.hp = 0; boss.isDefeated = true; this.earnedGold = 30; this.rewardOptions = this.drawRewards(); this.phase = 'reward'; } return true; } return false; }
  private updateEffects(deltaSeconds: number): void { for (let index = this.hits.length - 1; index >= 0; index -= 1) { const hit = this.hits[index]; if (hit === undefined) continue; hit.seconds -= deltaSeconds; if (hit.seconds <= 0) this.hits.splice(index, 1); } }
  private updatePickups(deltaSeconds: number): void { for (let index = this.pickups.length - 1; index >= 0; index -= 1) { const pickup = this.pickups[index]; if (pickup === undefined) continue; pickup.z -= WORLD_SPEED * deltaSeconds; if (pickup.z < 1.4 && Math.abs(pickup.x - this.player.x) < 1.5) { this.collectedShards += 1; this.applyBuff(pickup.buffId, 1 / 3); this.pickups.splice(index, 1); } else if (pickup.z < -2) this.pickups.splice(index, 1); } }
  private hasEnemy(id: string): boolean { if (this.spawnedWaveIds.has(id)) return true; if (this.enemies.some((enemy) => enemy.id === id)) return true; this.spawnedWaveIds.add(id); return false; }
}
