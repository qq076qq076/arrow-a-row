import { getChapterDefinition, getNextChapterDefinition, type ChapterId } from '../content/ChapterDefinitions';
import { BUFF_CATALOG, BUFF_IDS, OFFENSIVE_BUFF_IDS, type BuffId } from '../content/BuffCatalog';

export type RunPhase = 'menu' | 'playing' | 'paused' | 'echo' | 'reward' | 'dead' | 'complete';
export type EnemyKind = 'melee' | 'ranged';
export type RewardId = 'storm_bow' | 'lightning_core' | 'heartwood' | 'deadeye' | 'gale_heart' | 'ironbark' | 'enemy_swarm';
export interface RunModifiers { readonly healthLevel?: number; readonly damageLevel?: number; readonly fireRateLevel?: number; readonly arrowSpeedLevel?: number; readonly pierceLevel?: number; readonly movementLevel?: number; }

export interface PlayerSnapshot { readonly x: number; readonly hp: number; readonly maxHp: number; readonly damage: number; readonly projectileCount: number; readonly arrowSpeed: number; readonly pierceCount: number; readonly movementSpeed: number; readonly damageReduction: number; readonly lifeSteal: number; readonly fireRateMultiplier: number; readonly arrowCharge: number; readonly pierceCharge: number; readonly lightningTargetCount: number; readonly lightningDamagePerSecond: number; readonly lightningRange: number; readonly lightningTargetCharge: number; readonly cannonUnlocked: boolean; readonly cannonDamage: number; readonly cannonBlastRadius: number; readonly cannonFireRateMultiplier: number; readonly enemyCountMultiplier: number; }
export interface EnemySnapshot { readonly id: string; readonly kind: EnemyKind; readonly x: number; readonly z: number; readonly hp: number; readonly telegraphSeconds: number; readonly deathSeconds: number; }
export interface GateSnapshot { readonly groupId: string; readonly leftLabel: string; readonly rightLabel: string; readonly leftBuffId: BuffId; readonly rightBuffId: BuffId; readonly centerLabel?: string; readonly centerBuffId?: BuffId; readonly z: number; readonly isChosen: boolean; }
export interface ArrowSnapshot { readonly id: number; readonly weapon: 'bow' | 'cannon'; readonly x: number; readonly z: number; readonly vx: number; readonly damage: number; readonly blastRadius: number; readonly piercesRemaining: number; readonly hitEnemyIds: readonly string[]; readonly hitBoss: boolean; }
export interface HitSnapshot { readonly id: number; readonly x: number; readonly z: number; readonly seconds: number; }
export interface PickupSnapshot { readonly id: number; readonly x: number; readonly z: number; readonly buffId: BuffId; readonly label: string; }
export interface BossSnapshot { readonly id: 'bos_moss_crown_a'; readonly hp: number; readonly maxHp: number; readonly z: number; readonly phase: 1 | 2; readonly telegraphSeconds: number; readonly telegraphText: string; readonly isDefeated: boolean; }
export interface M1RunSnapshot {
  readonly phase: RunPhase; readonly chapterId: ChapterId; readonly chapterTitle: string; readonly elapsedSeconds: number; readonly distanceMeters: number; readonly player: PlayerSnapshot;
  readonly enemies: readonly EnemySnapshot[]; readonly gates: readonly GateSnapshot[]; readonly arrows: readonly ArrowSnapshot[]; readonly hits: readonly HitSnapshot[]; readonly pickups: readonly PickupSnapshot[]; readonly lightningTargetIds: readonly string[]; readonly collectedShards: number; readonly selectedGateIds: readonly string[];
  readonly boss: BossSnapshot | undefined; readonly bossWarningSeconds: number; readonly wavesCompleted: number; readonly echoRound: number; readonly rewardOptions: readonly RewardId[]; readonly selectedReward: RewardId | undefined; readonly earnedGold: number;
}

interface MutableEnemy { id: string; kind: EnemyKind; x: number; z: number; hp: number; attackCooldownSeconds: number; telegraphSeconds: number; deathSeconds: number; }
interface MutableGate { groupId: string; leftLabel: string; rightLabel: string; leftBuffId: BuffId; rightBuffId: BuffId; centerLabel?: string; centerBuffId?: BuffId; z: number; isChosen: boolean; }
interface MutableArrow { id: number; weapon: 'bow' | 'cannon'; x: number; z: number; vx: number; damage: number; blastRadius: number; piercesRemaining: number; hitEnemyIds: string[]; hitBoss: boolean; }
interface MutableHit { id: number; x: number; z: number; seconds: number; }
interface MutablePickup { id: number; x: number; z: number; buffId: BuffId; label: string; }
interface MutableBoss { hp: number; maxHp: number; z: number; phase: 1 | 2; telegraphSeconds: number; telegraphText: string; attackCooldownSeconds: number; isDefeated: boolean; }

const WORLD_SPEED = 4;
const PLAYER_MAX_X = 5;
const PLAYER_MOVE_SPEED = 10;
export const WAVES_PER_ROUND = 5;
export const TOTAL_MINION_WAVES = WAVES_PER_ROUND * 3;
export const FIRST_WAVE_DISTANCE = 12;
export const WAVE_DISTANCE_INTERVAL = 8;
export const BOSS_WARNING_SECONDS = 5;
export const BOSS_STOP_DISTANCE = 3;
export const BOSS_WARNING_START_DISTANCE = FIRST_WAVE_DISTANCE + (TOTAL_MINION_WAVES - 1) * WAVE_DISTANCE_INTERVAL;
export const BOSS_START_DISTANCE = BOSS_WARNING_START_DISTANCE + BOSS_WARNING_SECONDS * WORLD_SPEED;
export const ENEMY_SPAWN_Z = 64;
export const ENEMY_BEHIND_PLAYER_Z = -2;
// Keep the old z=38-to-player travel time while moving visible road objects to the far edge.
const ROAD_APPROACH_SPEED = WORLD_SPEED * ENEMY_SPAWN_Z / 38;
export const BASE_ARROW_DAMAGE = 0.8 / 3;
export const BASE_LIGHTNING_DAMAGE_PER_SECOND = 5 / 3;
export const BASE_CANNON_DAMAGE = 2.4;
export const BASE_CANNON_INTERVAL_SECONDS = 1.6;
export const CANNON_DAMAGE_BONUS = 0.35;
export const CANNON_RADIUS_BONUS = 0.10;
export const CANNON_FIRE_RATE_BONUS = 0.25;
export const CANNON_BLAST_RADIUS = 2.4;
export const CANNON_PROJECTILE_SPEED = 12;
export const POWER_SHOT_DAMAGE_BONUS = 0.25 / 3;
export const LIGHTNING_DAMAGE_BONUS_PER_GATE = 2 / 3;
export const LIFE_STEAL_BONUS = 0.1;
export function getArrowDamageMultiplier(distance: number): number { return distance <= 8 ? 1.5 : distance <= 18 ? 0.9 : 0.55; }
const REWARDS: readonly RewardId[] = ['storm_bow', 'lightning_core', 'heartwood', 'deadeye', 'gale_heart', 'ironbark', 'enemy_swarm'];
const ROUND_HP_SCALES: readonly number[] = [1, 1.05, 1.1];
const WAVE_HP_SCALES: readonly number[] = [1, 1.04, 1.08, 1.12, 1.16];
interface WaveEnemySpec { readonly kind: EnemyKind; readonly x: number; }
interface WaveDefinition { readonly distance: number; readonly enemies: readonly WaveEnemySpec[]; }
const WAVE_TEMPLATES: ReadonlyArray<readonly WaveEnemySpec[]> = [
  [{ kind: 'melee', x: -1.4 }, { kind: 'melee', x: 1.4 }],
  [{ kind: 'melee', x: -1.8 }, { kind: 'ranged', x: 1.8 }],
  [{ kind: 'ranged', x: -2 }, { kind: 'ranged', x: 2 }],
  [{ kind: 'melee', x: -2.2 }, { kind: 'melee', x: 0 }, { kind: 'melee', x: 2.2 }],
  [{ kind: 'melee', x: -2 }, { kind: 'ranged', x: 0 }, { kind: 'ranged', x: 2 }],
];
const WAVE_DEFINITIONS: readonly WaveDefinition[] = Array.from({ length: TOTAL_MINION_WAVES }, (_, index) => ({
  distance: FIRST_WAVE_DISTANCE + index * WAVE_DISTANCE_INTERVAL,
  enemies: WAVE_TEMPLATES[index % WAVES_PER_ROUND]!,
}));

export class M1RunSimulation {
  private phase: RunPhase = 'menu'; private chapterId: ChapterId = 'ch01_meadow'; private elapsedSeconds = 0; private distanceMeters = 0; private targetX = 0;
  private player = { x: 0, hp: 100, maxHp: 100, damage: BASE_ARROW_DAMAGE, projectileCount: 0, arrowSpeed: 24, pierceCount: 0, movementSpeed: PLAYER_MOVE_SPEED, damageReduction: 0, lifeSteal: 0, fireRateMultiplier: 1, arrowCharge: 0, pierceCharge: 0, lightningTargetCount: 2, lightningDamagePerSecond: BASE_LIGHTNING_DAMAGE_PER_SECOND, lightningRange: 1, lightningTargetCharge: 0, cannonUnlocked: false, cannonDamage: BASE_CANNON_DAMAGE, cannonBlastRadius: CANNON_BLAST_RADIUS, cannonFireRateMultiplier: 1, enemyCountMultiplier: 1 };
  private attackCooldownSeconds = 0; private attackIntervalSeconds = 0.45; private cannonCooldownSeconds = 0; private lightningCooldownSeconds = 0; private nextArrowId = 1; private nextEffectId = 1; private earnedGold = 0; private collectedShards = 0; private bossWarningSeconds = 0; private boss: MutableBoss | undefined;
  private selectedReward: RewardId | undefined; private rewardOptions: RewardId[] = []; private wavesCompleted = 0; private echoRound = 0; private randomState = 1; private runNumber = 0; private readonly selectedGateIds = new Set<string>(); private readonly positionedEnemyIds = new Set<string>(); private readonly swarmDuplicatedIds = new Set<string>(); private readonly enemies: MutableEnemy[] = []; private readonly arrows: MutableArrow[] = []; private readonly hits: MutableHit[] = []; private readonly pickups: MutablePickup[] = []; private lightningTargetIds: string[] = [];
  private readonly gates: MutableGate[] = [
    { groupId: 'g01', leftLabel: '+1 箭矢', rightLabel: '電擊目標 +1', centerLabel: '火砲 +1', leftBuffId: 'split_arrow', centerBuffId: 'cannon_weapon', rightBuffId: 'lightning_targets', z: 10, isChosen: false },
    { groupId: 'g02', leftLabel: '箭速 +25%', rightLabel: '電擊目標 +1', leftBuffId: 'swift_shot', rightBuffId: 'lightning_targets', z: 52, isChosen: false },
    { groupId: 'g03', leftLabel: '+1 箭矢', rightLabel: '箭傷 +25%', leftBuffId: 'split_arrow', rightBuffId: 'power_shot', z: 92, isChosen: false },
  ];

  public start(modifiers: RunModifiers = {}, chapterId: ChapterId = 'ch01_meadow'): void {
    const chapter = getChapterDefinition(chapterId);
    this.chapterId = chapter.id;
    this.randomState = (chapter.index * 2654435761 + ++this.runNumber) >>> 0;
    this.phase = 'playing'; this.elapsedSeconds = 0; this.distanceMeters = 0; this.targetX = 0; this.earnedGold = 0; this.bossWarningSeconds = 0; this.boss = undefined; this.selectedReward = undefined; this.rewardOptions = []; this.wavesCompleted = 0; this.echoRound = 0;
    const maxHp = 100 + (modifiers.healthLevel ?? 0) * 10;
    this.player = { x: 0, hp: maxHp, maxHp, damage: BASE_ARROW_DAMAGE * (1 + (modifiers.damageLevel ?? 0) * 0.2), projectileCount: 0, arrowSpeed: 24 + (modifiers.arrowSpeedLevel ?? 0) * 2, pierceCount: modifiers.pierceLevel ?? 0, movementSpeed: PLAYER_MOVE_SPEED + (modifiers.movementLevel ?? 0), damageReduction: 0, lifeSteal: 0, fireRateMultiplier: 1, arrowCharge: 0, pierceCharge: 0, lightningTargetCount: 2, lightningDamagePerSecond: BASE_LIGHTNING_DAMAGE_PER_SECOND, lightningRange: 1, lightningTargetCharge: 0, cannonUnlocked: false, cannonDamage: BASE_CANNON_DAMAGE, cannonBlastRadius: CANNON_BLAST_RADIUS, cannonFireRateMultiplier: 1, enemyCountMultiplier: 1 }; this.attackCooldownSeconds = 0; this.attackIntervalSeconds = Math.max(0.25, 0.45 - (modifiers.fireRateLevel ?? 0) * 0.04); this.cannonCooldownSeconds = 0; this.lightningCooldownSeconds = 0; this.nextArrowId = 1; this.nextEffectId = 1; this.collectedShards = 0;
    this.selectedGateIds.clear(); this.positionedEnemyIds.clear(); this.swarmDuplicatedIds.clear(); this.enemies.length = 0; this.arrows.length = 0; this.hits.length = 0; this.pickups.length = 0; this.lightningTargetIds = [];
    this.gates.splice(0, this.gates.length, ...this.createGates());
  }

  /** Development-only renderer aid; App exposes it only from a Vite DEV URL. */
  public enterBossPreview(): void {
    if (this.phase !== 'playing') return;
    this.distanceMeters = BOSS_START_DISTANCE;
    this.bossWarningSeconds = 0;
    this.wavesCompleted = TOTAL_MINION_WAVES;
    this.echoRound = 1;
    this.spawnBoss();
    if (this.boss === undefined) return;
    this.boss.z = BOSS_STOP_DISTANCE;
    this.boss.hp = 9_999;
    this.boss.maxHp = 9_999;
    this.boss.attackCooldownSeconds = 9_999;
    this.boss.telegraphSeconds = 0;
  }

  /** Restores only data produced by snapshot(); cooldowns restart safely on resume. */
  public restore(snapshot: M1RunSnapshot): boolean {
    if (snapshot.phase !== 'playing' && snapshot.phase !== 'echo' && snapshot.phase !== 'reward') return false;
    const restoredWaves = Math.max(0, Math.min(TOTAL_MINION_WAVES, snapshot.wavesCompleted ?? 0));
    const isLegacyMidChapterEcho = snapshot.phase === 'echo' && restoredWaves < TOTAL_MINION_WAVES;
    this.phase = isLegacyMidChapterEcho ? 'playing' : snapshot.phase; this.chapterId = snapshot.chapterId ?? 'ch01_meadow'; this.elapsedSeconds = snapshot.elapsedSeconds; this.distanceMeters = snapshot.distanceMeters; this.targetX = snapshot.player.x;
    this.player = { ...snapshot.player, projectileCount: snapshot.player.projectileCount ?? 0, cannonUnlocked: snapshot.player.cannonUnlocked ?? false, cannonDamage: snapshot.player.cannonDamage ?? BASE_CANNON_DAMAGE, cannonBlastRadius: snapshot.player.cannonBlastRadius ?? CANNON_BLAST_RADIUS, cannonFireRateMultiplier: snapshot.player.cannonFireRateMultiplier ?? 1, damage: snapshot.player.damage ?? BASE_ARROW_DAMAGE, pierceCount: snapshot.player.pierceCount ?? 0, pierceCharge: snapshot.player.pierceCharge ?? 0, lightningTargetCount: snapshot.player.lightningTargetCount ?? 2, lightningDamagePerSecond: snapshot.player.lightningDamagePerSecond ?? BASE_LIGHTNING_DAMAGE_PER_SECOND, lightningRange: snapshot.player.lightningRange ?? 1, lightningTargetCharge: snapshot.player.lightningTargetCharge ?? 0, enemyCountMultiplier: snapshot.player.enemyCountMultiplier ?? 1, lifeSteal: snapshot.player.lifeSteal ?? 0 }; this.attackCooldownSeconds = 0.1; this.cannonCooldownSeconds = 0.1; this.lightningCooldownSeconds = 0; this.nextArrowId = Math.max(1, ...snapshot.arrows.map((arrow) => arrow.id + 1)); this.earnedGold = snapshot.earnedGold; this.collectedShards = snapshot.collectedShards ?? 0; this.bossWarningSeconds = snapshot.bossWarningSeconds ?? 0; this.wavesCompleted = restoredWaves; this.echoRound = restoredWaves >= TOTAL_MINION_WAVES && snapshot.echoRound > 0 ? 1 : 0; this.selectedReward = snapshot.selectedReward === ('blade_nexus' as never) ? 'lightning_core' : snapshot.selectedReward; this.rewardOptions = isLegacyMidChapterEcho ? [] : snapshot.rewardOptions.map((reward) => reward === ('blade_nexus' as never) ? 'lightning_core' : reward);
    this.selectedGateIds.clear(); snapshot.selectedGateIds.forEach((id) => this.selectedGateIds.add(id)); this.positionedEnemyIds.clear(); this.swarmDuplicatedIds.clear(); const swarmSourceIds = new Set(snapshot.enemies.filter((enemy) => enemy.id.includes('-swarm-')).map((enemy) => enemy.id.split('-swarm-')[0]!)); snapshot.enemies.forEach((enemy) => { this.positionedEnemyIds.add(enemy.id); if (swarmSourceIds.has(enemy.id)) this.swarmDuplicatedIds.add(enemy.id); }); this.enemies.splice(0, this.enemies.length, ...snapshot.enemies.map((enemy) => ({ ...enemy, deathSeconds: enemy.deathSeconds ?? 0, attackCooldownSeconds: 0.5 }))); this.arrows.splice(0, this.arrows.length, ...snapshot.arrows.map((arrow) => ({ ...arrow, weapon: arrow.weapon ?? 'bow', vx: arrow.vx ?? 0, damage: arrow.damage ?? snapshot.player.damage, blastRadius: arrow.blastRadius ?? 0, piercesRemaining: arrow.piercesRemaining ?? 0, hitEnemyIds: [...(arrow.hitEnemyIds ?? [])], hitBoss: arrow.hitBoss ?? false })));
    this.gates.splice(0, this.gates.length, ...snapshot.gates.map((gate) => ({ ...gate, leftBuffId: gate.leftBuffId === ('flying_sword' as never) ? 'lightning_targets' : gate.leftBuffId, rightBuffId: gate.rightBuffId === ('flying_sword' as never) ? 'lightning_targets' : gate.rightBuffId, leftLabel: gate.leftBuffId === ('flying_sword' as never) ? '電擊目標 +1' : gate.leftLabel, rightLabel: gate.rightBuffId === ('flying_sword' as never) ? '電擊目標 +1' : gate.rightLabel }))); this.hits.splice(0, this.hits.length, ...(snapshot.hits ?? []).map((hit) => ({ ...hit }))); this.pickups.splice(0, this.pickups.length, ...(snapshot.pickups ?? []).map((pickup) => ({ ...pickup, buffId: pickup.buffId === ('flying_sword' as never) ? 'lightning_targets' : pickup.buffId, label: pickup.buffId === ('flying_sword' as never) ? '鎖定碎片 +⅓' : pickup.label }))); this.lightningTargetIds = [...(snapshot.lightningTargetIds ?? [])];
    this.boss = snapshot.boss === undefined ? undefined : { hp: snapshot.boss.hp, maxHp: snapshot.boss.maxHp, z: snapshot.boss.z ?? 15, phase: snapshot.boss.phase, telegraphSeconds: snapshot.boss.telegraphSeconds, telegraphText: snapshot.boss.telegraphText, attackCooldownSeconds: 1, isDefeated: snapshot.boss.isDefeated };
    return true;
  }

  public setTargetX(targetX: number): void { this.targetX = Math.max(-PLAYER_MAX_X, Math.min(PLAYER_MAX_X, targetX)); }
  public togglePause(): boolean { if (this.phase === 'playing') { this.phase = 'paused'; return true; } if (this.phase === 'paused') { this.phase = 'playing'; return true; } return false; }
  public chooseReward(rewardId: RewardId): boolean {
    if ((this.phase !== 'reward' && this.phase !== 'echo') || this.selectedReward !== undefined || !this.rewardOptions.includes(rewardId)) return false;
    const isChapterEcho = this.phase === 'echo';
    this.selectedReward = rewardId;
    if (rewardId === 'storm_bow') { this.player.projectileCount += 2; this.player.damage *= 1.4; }
    if (rewardId === 'lightning_core') { this.player.lightningTargetCount += 1; this.player.lightningDamagePerSecond += 3; this.player.lightningRange += 6; }
    if (rewardId === 'heartwood') { this.player.maxHp += 60; this.player.hp += 60; }
    if (rewardId === 'deadeye') this.player.damage *= 1.35;
    if (rewardId === 'gale_heart') this.player.arrowSpeed *= 1.4;
    if (rewardId === 'ironbark') { this.player.damageReduction = Math.min(0.6, this.player.damageReduction + 0.4); this.player.maxHp += 30; this.player.hp += 30; }
    if (rewardId === 'enemy_swarm') this.player.enemyCountMultiplier = Math.min(2, this.player.enemyCountMultiplier * 2);
    if (isChapterEcho) {
      this.phase = 'playing';
      this.rewardOptions = [];
      this.selectedReward = undefined;
      if (this.wavesCompleted >= TOTAL_MINION_WAVES) this.bossWarningSeconds = BOSS_WARNING_SECONDS;
      return true;
    }
    this.phase = 'complete';
    return true;
  }

  public continueToNextChapter(): boolean {
    if (this.phase !== 'complete') return false;
    const next = getNextChapterDefinition(this.chapterId);
    if (next === undefined) return false;
    this.chapterId = next.id; this.phase = 'playing'; this.elapsedSeconds = 0; this.distanceMeters = 0; this.targetX = 0; this.bossWarningSeconds = 0; this.boss = undefined; this.selectedReward = undefined; this.rewardOptions = []; this.wavesCompleted = 0; this.echoRound = 0; this.earnedGold = 0; this.attackCooldownSeconds = 0; this.cannonCooldownSeconds = 0;
    this.enemies.length = 0; this.arrows.length = 0; this.hits.length = 0; this.pickups.length = 0; this.lightningTargetIds = []; this.selectedGateIds.clear(); this.positionedEnemyIds.clear(); this.swarmDuplicatedIds.clear();
    this.randomState = (getChapterDefinition(next.id).index * 2654435761 + ++this.runNumber) >>> 0;
    this.gates.splice(0, this.gates.length, ...this.createGates());
    return true;
  }

  public tick(deltaSeconds: number): void {
    if (this.phase !== 'playing') return;
    this.elapsedSeconds += deltaSeconds; this.movePlayer(deltaSeconds); this.resolveGates(); this.spawnEncounterWave(); this.duplicateSwarmEnemies(); this.updateEnemies(deltaSeconds);
    if (this.boss === undefined) {
      if (this.bossWarningSeconds > 0) {
        this.bossWarningSeconds = Math.max(0, this.bossWarningSeconds - deltaSeconds);
        if (this.bossWarningSeconds <= 0) this.spawnBoss();
      }
    }
    this.updateBoss(deltaSeconds); this.attackCooldownSeconds -= deltaSeconds; this.cannonCooldownSeconds -= deltaSeconds;
    this.fireAtNearestTarget(); this.updateArrows(deltaSeconds); this.updateLightning(deltaSeconds); this.updateEffects(deltaSeconds); this.updatePickups(deltaSeconds);
    if (this.player.hp <= 0) this.phase = 'dead';
    if (this.phase === 'playing') this.tryCompleteBossReward();
    if (this.boss === undefined) this.distanceMeters += WORLD_SPEED * deltaSeconds;
  }

  public snapshot(): M1RunSnapshot {
    const chapter = getChapterDefinition(this.chapterId);
    return { phase: this.phase, chapterId: chapter.id, chapterTitle: chapter.title, elapsedSeconds: this.elapsedSeconds, distanceMeters: this.distanceMeters, player: { ...this.player }, enemies: this.enemies.map((enemy) => ({ ...enemy })), gates: this.gates.map((gate) => ({ ...gate })), arrows: this.arrows.map((arrow) => ({ ...arrow })), hits: this.hits.map((hit) => ({ ...hit })), pickups: this.pickups.map((pickup) => ({ ...pickup })), lightningTargetIds: [...this.lightningTargetIds], collectedShards: this.collectedShards, selectedGateIds: [...this.selectedGateIds], boss: this.boss === undefined ? undefined : { id: 'bos_moss_crown_a', hp: this.boss.hp, maxHp: this.boss.maxHp, z: this.boss.z, phase: this.boss.phase, telegraphSeconds: this.boss.telegraphSeconds, telegraphText: this.boss.telegraphText, isDefeated: this.boss.isDefeated }, bossWarningSeconds: this.bossWarningSeconds, wavesCompleted: this.wavesCompleted, echoRound: this.echoRound, rewardOptions: this.rewardOptions, selectedReward: this.selectedReward, earnedGold: this.earnedGold };
  }

  private movePlayer(deltaSeconds: number): void { const delta = this.targetX - this.player.x; const maxMove = this.player.movementSpeed * deltaSeconds; this.player.x += Math.max(-maxMove, Math.min(maxMove, delta)); }
  private resolveGates(): void { for (const gate of this.gates) { if (gate.isChosen || this.distanceMeters < gate.z) continue; gate.isChosen = true; this.selectedGateIds.add(gate.groupId); const selectedBuff = gate.centerBuffId !== undefined && this.player.x >= -1.7 && this.player.x <= 1.7 ? gate.centerBuffId : this.player.x < 0 ? gate.leftBuffId : gate.rightBuffId; this.applyBuff(selectedBuff, 1); } }
  private createGates(): MutableGate[] {
    const drawPair = (pool: readonly BuffId[]): readonly [BuffId, BuffId] => { const legacyPool = pool.filter((id) => id !== 'cannon_radius'); const firstLegacy = legacyPool[this.nextRandomIndex(legacyPool.length)]!; const first = pool.includes('cannon_radius') && this.randomState % pool.length === pool.length - 1 ? 'cannon_radius' : firstLegacy; const alternatives = pool.filter((id) => id !== first); const alternativeLegacyPool = alternatives.filter((id) => id !== 'cannon_radius'); const secondLegacy = alternativeLegacyPool[this.nextRandomIndex(alternativeLegacyPool.length)]!; const second = alternatives.includes('cannon_radius') && this.randomState % alternatives.length === alternatives.length - 1 ? 'cannon_radius' : secondLegacy; return [first, second]; };
    const second = drawPair(OFFENSIVE_BUFF_IDS); const third = drawPair(BUFF_IDS);
    return [this.makeGate('g01', 10, ['split_arrow', 'lightning_targets'], 'cannon_weapon'), this.makeGate('g02', 52, second), this.makeGate('g03', 92, third)];
  }
  private makeGate(groupId: string, z: number, pair: readonly [BuffId, BuffId], centerBuffId?: BuffId): MutableGate { return { groupId, z, leftBuffId: pair[0], rightBuffId: pair[1], leftLabel: BUFF_CATALOG[pair[0]].gateLabel, rightLabel: BUFF_CATALOG[pair[1]].gateLabel, ...(centerBuffId === undefined ? {} : { centerBuffId, centerLabel: BUFF_CATALOG[centerBuffId].gateLabel }), isChosen: false }; }
  private nextRandomIndex(length: number): number { this.randomState = (1664525 * this.randomState + 1013904223) >>> 0; return this.randomState % length; }
  private drawPickupBuffId(): BuffId { const legacyPool = BUFF_IDS.filter((id) => id !== 'cannon_radius'); const legacyBuffId = legacyPool[this.nextRandomIndex(legacyPool.length)]!; return this.randomState % BUFF_IDS.length === BUFF_IDS.length - 1 ? 'cannon_radius' : legacyBuffId; }
  private drawRewards(): RewardId[] { const pool = [...REWARDS]; const choices: RewardId[] = []; while (choices.length < 3) choices.push(pool.splice(this.nextRandomIndex(pool.length), 1)[0]!); return choices; }
  private applyBuff(buffId: BuffId, scale: number): void {
    if (buffId === 'split_arrow') { this.player.arrowCharge += scale; while (this.player.arrowCharge >= 1) { this.player.projectileCount += 1; this.player.arrowCharge -= 1; } }
    if (buffId === 'power_shot') this.player.damage *= 1 + POWER_SHOT_DAMAGE_BONUS * scale;
    if (buffId === 'swift_shot') this.player.arrowSpeed *= 1 + 0.25 * scale;
    if (buffId === 'rapid_fire') this.player.fireRateMultiplier *= 1 - 0.12 * scale;
    if (buffId === 'piercing_arrow') { this.player.pierceCharge += scale; while (this.player.pierceCharge >= 1) { this.player.pierceCount += 1; this.player.pierceCharge -= 1; } }
    if (buffId === 'lightning_targets') { this.player.lightningTargetCharge += scale; while (this.player.lightningTargetCharge >= 1) { this.player.lightningTargetCount += 1; this.player.lightningTargetCharge -= 1; } }
    if (buffId === 'lightning_damage') this.player.lightningDamagePerSecond += LIGHTNING_DAMAGE_BONUS_PER_GATE * scale;
    if (buffId === 'lightning_range') this.player.lightningRange += 6 * scale;
    if (buffId === 'cannon_weapon') this.player.cannonUnlocked = true;
    if (buffId === 'cannon_damage') this.player.cannonDamage *= 1 + CANNON_DAMAGE_BONUS * scale;
    if (buffId === 'cannon_radius') this.player.cannonBlastRadius *= 1 + CANNON_RADIUS_BONUS * scale;
    if (buffId === 'cannon_fire_rate') this.player.cannonFireRateMultiplier = Math.max(0.35, this.player.cannonFireRateMultiplier * (1 - CANNON_FIRE_RATE_BONUS * scale));
    if (buffId === 'life_steal') this.player.lifeSteal = Math.min(1, this.player.lifeSteal + LIFE_STEAL_BONUS * scale);
    if (buffId === 'vitality') { const amount = 20 * scale; this.player.maxHp += amount; this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount); }
    if (buffId === 'windstep') this.player.movementSpeed *= 1 + 0.2 * scale;
    if (buffId === 'barkskin') this.player.damageReduction = Math.min(0.6, this.player.damageReduction + 0.15 * scale);
  }
  private spawnEncounterWave(): void {
    const wave = WAVE_DEFINITIONS[this.wavesCompleted];
    if (wave === undefined || this.distanceMeters < wave.distance) return;
    const chapterScale = getChapterDefinition(this.chapterId).enemyHpScale;
    const roundIndex = Math.floor(this.wavesCompleted / WAVES_PER_ROUND);
    const waveIndex = this.wavesCompleted % WAVES_PER_ROUND;
    const roundScale = ROUND_HP_SCALES[roundIndex] ?? 1;
    const waveScale = WAVE_HP_SCALES[waveIndex] ?? 1;
    for (const [enemyIndex, spec] of wave.enemies.entries()) {
      const baseHp = spec.kind === 'melee' ? 8 : 12;
      this.enemies.push({ id: `wave-${this.wavesCompleted + 1}-${enemyIndex + 1}`, kind: spec.kind, x: spec.x, z: ENEMY_SPAWN_Z, hp: Math.round(baseHp * chapterScale * roundScale * waveScale), attackCooldownSeconds: spec.kind === 'ranged' ? 1 : 0, telegraphSeconds: 0, deathSeconds: 0 });
    }
    this.wavesCompleted += 1;
    if (this.wavesCompleted === TOTAL_MINION_WAVES) {
      this.echoRound = 1;
      this.rewardOptions = this.drawRewards();
      this.selectedReward = undefined;
      this.phase = 'echo';
    }
  }
  private duplicateSwarmEnemies(): void { if (this.player.enemyCountMultiplier <= 1) return; for (const enemy of [...this.enemies]) { if (enemy.id.includes('-swarm-') || this.swarmDuplicatedIds.has(enemy.id)) continue; this.swarmDuplicatedIds.add(enemy.id); for (let copy = 1; copy < this.player.enemyCountMultiplier; copy += 1) { const offset = copy % 2 === 1 ? -1.35 : 1.35; this.enemies.push({ ...enemy, id: `${enemy.id}-swarm-${copy}`, x: Math.max(-4.6, Math.min(4.6, enemy.x + offset)), z: enemy.z + 1.5 * copy }); } } }
  private updateEnemies(deltaSeconds: number): void { for (const enemy of this.enemies) { if (!this.positionedEnemyIds.has(enemy.id)) { enemy.x = Math.max(-4.6, Math.min(4.6, enemy.x + (this.nextRandomIndex(17) - 8) / 10)); this.positionedEnemyIds.add(enemy.id); } if (enemy.deathSeconds > 0) { enemy.deathSeconds = Math.max(0, enemy.deathSeconds - deltaSeconds); continue; } enemy.z -= ROAD_APPROACH_SPEED * deltaSeconds; if (enemy.hp > 0 && enemy.z <= 1.2 && Math.abs(this.player.x - enemy.x) < 1.2) { this.resolveEnemyCollision(enemy); continue; } enemy.attackCooldownSeconds -= deltaSeconds; if (enemy.kind === 'ranged') { if (enemy.attackCooldownSeconds <= 0 && enemy.telegraphSeconds <= 0) enemy.telegraphSeconds = 0.6; if (enemy.telegraphSeconds > 0) { enemy.telegraphSeconds -= deltaSeconds; if (enemy.telegraphSeconds <= 0) { if (Math.abs(this.player.x - enemy.x) < 1.2) this.takeDamage(12); enemy.attackCooldownSeconds = 3.5; } } } } }
  private spawnBoss(): void { const hp = getChapterDefinition(this.chapterId).bossHp; const messages: Record<ChapterId, string> = { ch01_meadow: '苔冠守衛被靜滯困住了。', ch02_viaduct: '鏡潮校準者正在鎖定航線！', ch03_forge: '熔脈監工正在蓄積震波！', ch04_canopy: '枝語母體正在喚醒霧冠！', ch05_archive: '無光抄錄者正在改寫星圖！', ch06_horizon: '靜滯之核正在撕裂地平！' }; this.boss = { hp, maxHp: hp, z: 46, phase: 1, telegraphSeconds: 0.8, telegraphText: messages[this.chapterId], attackCooldownSeconds: 2.5, isDefeated: false }; }
  private updateBoss(deltaSeconds: number): void { const boss = this.boss; if (boss === undefined || boss.isDefeated) return; if (boss.z > BOSS_STOP_DISTANCE) { boss.z = Math.max(BOSS_STOP_DISTANCE, boss.z - WORLD_SPEED * deltaSeconds); return; } if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { boss.phase = 2; boss.telegraphSeconds = 0.8; boss.telegraphText = '靜滯正在加深！'; boss.attackCooldownSeconds = 2.2; } boss.attackCooldownSeconds -= deltaSeconds; if (boss.telegraphSeconds > 0) { boss.telegraphSeconds -= deltaSeconds; if (boss.telegraphSeconds <= 0 && boss.telegraphText !== '靜滯正在加深！') { if (Math.abs(this.player.x) < 2.3) this.takeDamage(boss.phase === 1 ? 14 : 20); boss.attackCooldownSeconds = boss.phase === 1 ? 2.7 : 2.1; } return; } if (boss.attackCooldownSeconds <= 0) { boss.telegraphSeconds = 0.75; boss.telegraphText = boss.phase === 1 ? '藤刺正在瞄準！' : '震波正在擴散！'; } }
  private fireAtNearestTarget(): void {
    if (this.player.projectileCount > 0 && this.attackCooldownSeconds <= 0) {
      this.attackCooldownSeconds = this.attackIntervalSeconds * this.player.fireRateMultiplier;
      for (let index = 0; index < this.player.projectileCount; index += 1) {
        const spreadIndex = index - (this.player.projectileCount - 1) / 2;
        const angleRadians = spreadIndex * 0.14;
        const offset = spreadIndex * 0.18;
        this.arrows.push({ id: this.nextArrowId++, weapon: 'bow', x: this.player.x + offset, z: 1, vx: Math.sin(angleRadians) * this.player.arrowSpeed, damage: this.player.damage, blastRadius: 0, piercesRemaining: this.player.pierceCount, hitEnemyIds: [], hitBoss: false });
      }
    }
    if (this.player.cannonUnlocked && this.cannonCooldownSeconds <= 0) {
      this.cannonCooldownSeconds = BASE_CANNON_INTERVAL_SECONDS * this.player.cannonFireRateMultiplier;
      this.arrows.push({ id: this.nextArrowId++, weapon: 'cannon', x: this.player.x, z: 1, vx: 0, damage: this.player.cannonDamage, blastRadius: this.player.cannonBlastRadius, piercesRemaining: 0, hitEnemyIds: [], hitBoss: false });
    }
  }
  private updateLightning(deltaSeconds: number): void {
    const targets = this.enemies.filter((enemy) => enemy.hp > 0 && enemy.deathSeconds <= 0 && enemy.z > 0 && Math.hypot(enemy.x - this.player.x, enemy.z) <= this.player.lightningRange).sort((left, right) => Math.hypot(left.x - this.player.x, left.z) - Math.hypot(right.x - this.player.x, right.z)).slice(0, this.player.lightningTargetCount);
    const boss = this.boss;
    const canLockBoss = boss !== undefined && !boss.isDefeated && boss.z > 0 && Math.hypot(this.player.x, boss.z) <= this.player.lightningRange && targets.length < this.player.lightningTargetCount;
    this.lightningTargetIds = [...targets.map((target) => target.id), ...(canLockBoss ? ['boss'] : [])];
    this.lightningCooldownSeconds -= deltaSeconds;
    if (this.lightningCooldownSeconds > 0 || (targets.length === 0 && !canLockBoss)) return;
    for (const target of targets) this.damageEnemy(target, this.player.lightningDamagePerSecond);
    if (canLockBoss && boss !== undefined) this.damageBoss(boss, this.player.lightningDamagePerSecond);
    this.lightningCooldownSeconds += 1;
  }
  private resolveEnemyCollision(enemy: MutableEnemy): void { const collisionDamage = enemy.hp; this.player.hp -= collisionDamage; this.damageEnemy(enemy, collisionDamage); }
  private damageEnemy(enemy: MutableEnemy, damage: number): void { if (enemy.hp <= 0 || enemy.deathSeconds > 0) return; const actualDamage = Math.min(enemy.hp, Math.max(0, damage)); if (actualDamage <= 0) return; enemy.hp -= actualDamage; this.healFromDamage(actualDamage); this.addHit(enemy.x, enemy.z); if (enemy.hp <= 0) { enemy.hp = 0; enemy.deathSeconds = 0.45; const buffId = this.drawPickupBuffId(); this.pickups.push({ id: this.nextEffectId++, x: enemy.x, z: enemy.z, buffId, label: BUFF_CATALOG[buffId].pickupLabel }); } }
  private damageBoss(boss: MutableBoss, damage: number): void { if (boss.isDefeated) return; const actualDamage = Math.min(boss.hp, Math.max(0, damage)); if (actualDamage <= 0) return; boss.hp -= actualDamage; this.healFromDamage(actualDamage); this.addHit(0, boss.z); if (boss.hp <= 0) { boss.hp = 0; boss.isDefeated = true; this.earnedGold = 30; } }
  private healFromDamage(actualDamage: number): void { this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.min(actualDamage * this.player.lifeSteal, 15)); }
  private tryCompleteBossReward(): void {
    if (this.boss === undefined || !this.boss.isDefeated || this.phase !== 'playing') return;
    const hasUnclearedEnemy = this.enemies.some((enemy) => enemy.deathSeconds > 0 || (enemy.hp > 0 && enemy.z >= ENEMY_BEHIND_PLAYER_Z));
    if (hasUnclearedEnemy) return;
    this.rewardOptions = this.drawRewards();
    this.selectedReward = undefined;
    this.phase = 'reward';
  }
  private takeDamage(amount: number): void { this.player.hp -= amount * (1 - this.player.damageReduction); }
  private addHit(x: number, z: number): void { this.hits.push({ id: this.nextEffectId++, x, z, seconds: 0.2 }); }
  private updateArrows(deltaSeconds: number): void { for (let index = this.arrows.length - 1; index >= 0; index -= 1) { const arrow = this.arrows[index]; if (arrow === undefined) continue; const projectileSpeed = arrow.weapon === 'cannon' ? CANNON_PROJECTILE_SPEED : this.player.arrowSpeed; arrow.x += arrow.vx * deltaSeconds; arrow.z += Math.sqrt(Math.max(0, projectileSpeed ** 2 - arrow.vx ** 2)) * deltaSeconds; if (this.tryArrowHit(arrow)) { if (arrow.piercesRemaining <= 0) { this.arrows.splice(index, 1); continue; } arrow.piercesRemaining -= 1; } if (arrow.z > 45 || Math.abs(arrow.x) > 12) this.arrows.splice(index, 1); } for (let index = this.enemies.length - 1; index >= 0; index -= 1) { const enemy = this.enemies[index]; if (enemy !== undefined && (enemy.z < -2 || (enemy.hp <= 0 && enemy.deathSeconds <= 0))) this.enemies.splice(index, 1); } }
  private tryArrowHit(arrow: MutableArrow): boolean {
    if (arrow.weapon === 'cannon') {
      const blastTargets = this.enemies.filter((candidate) => candidate.hp > 0 && candidate.deathSeconds <= 0 && Math.hypot(candidate.x - arrow.x, candidate.z - arrow.z) <= arrow.blastRadius);
      const boss = this.boss;
      const hitsBoss = boss !== undefined && !boss.isDefeated && Math.hypot(arrow.x, boss.z - arrow.z) <= arrow.blastRadius;
      if (blastTargets.length === 0 && !hitsBoss) return false;
      for (const target of blastTargets) { arrow.hitEnemyIds.push(target.id); this.damageEnemy(target, arrow.damage); }
      if (hitsBoss && boss !== undefined) { arrow.hitBoss = true; this.damageBoss(boss, arrow.damage); }
      return true;
    }
    const enemy = this.enemies.filter((candidate) => candidate.hp > 0 && !arrow.hitEnemyIds.includes(candidate.id) && candidate.deathSeconds <= 0 && Math.abs(candidate.z - arrow.z) < 0.75 && Math.abs(candidate.x - arrow.x) < 0.85).sort((left, right) => left.z - right.z)[0]; if (enemy !== undefined) { arrow.hitEnemyIds.push(enemy.id); this.damageEnemy(enemy, arrow.damage * getArrowDamageMultiplier(arrow.z)); return true; } const boss = this.boss; if (boss !== undefined && !arrow.hitBoss && !boss.isDefeated && Math.abs(boss.z - arrow.z) < 1 && Math.abs(arrow.x) < 1.5) { arrow.hitBoss = true; this.damageBoss(boss, arrow.damage * getArrowDamageMultiplier(arrow.z)); return true; } return false;
  }
  private updateEffects(deltaSeconds: number): void { for (let index = this.hits.length - 1; index >= 0; index -= 1) { const hit = this.hits[index]; if (hit === undefined) continue; hit.seconds -= deltaSeconds; if (hit.seconds <= 0) this.hits.splice(index, 1); } }
  private updatePickups(deltaSeconds: number): void { for (let index = this.pickups.length - 1; index >= 0; index -= 1) { const pickup = this.pickups[index]; if (pickup === undefined) continue; pickup.z -= ROAD_APPROACH_SPEED * deltaSeconds; if (pickup.z < 1.4 && Math.abs(pickup.x - this.player.x) < 1.5) { this.collectPickup(pickup); this.pickups.splice(index, 1); } else if (pickup.z < -2) this.pickups.splice(index, 1); } }
  private collectPickup(pickup: MutablePickup): void { this.collectedShards += 1; this.applyBuff(pickup.buffId, 1 / 3); }
}
