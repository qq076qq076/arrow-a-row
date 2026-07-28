export type RunPhase = 'menu' | 'playing' | 'dead' | 'complete';
export type EnemyKind = 'melee' | 'ranged';

export interface PlayerSnapshot {
  readonly x: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly damage: number;
  readonly projectileCount: number;
}

export interface EnemySnapshot {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly x: number;
  readonly z: number;
  readonly hp: number;
  readonly telegraphSeconds: number;
}

export interface GateSnapshot {
  readonly groupId: string;
  readonly leftLabel: string;
  readonly rightLabel: string;
  readonly z: number;
  readonly isChosen: boolean;
}

export interface ArrowSnapshot {
  readonly id: number;
  readonly x: number;
  readonly z: number;
}

export interface M1RunSnapshot {
  readonly phase: RunPhase;
  readonly elapsedSeconds: number;
  readonly distanceMeters: number;
  readonly player: PlayerSnapshot;
  readonly enemies: readonly EnemySnapshot[];
  readonly gates: readonly GateSnapshot[];
  readonly arrows: readonly ArrowSnapshot[];
  readonly selectedGateIds: readonly string[];
}

interface MutableEnemy {
  id: string;
  kind: EnemyKind;
  x: number;
  z: number;
  hp: number;
  attackCooldownSeconds: number;
  telegraphSeconds: number;
}

interface MutableGate {
  groupId: string;
  leftLabel: string;
  rightLabel: string;
  z: number;
  isChosen: boolean;
}

interface MutableArrow {
  id: number;
  x: number;
  z: number;
}

const RUN_DURATION_SECONDS = 60;
const WORLD_SPEED_METERS_PER_SECOND = 4;
const PLAYER_MAX_X = 5;
const PLAYER_MOVE_SPEED = 10;

export class M1RunSimulation {
  private phase: RunPhase = 'menu';
  private elapsedSeconds = 0;
  private distanceMeters = 0;
  private targetX = 0;
  private player = { x: 0, hp: 100, maxHp: 100, damage: 1, projectileCount: 1 };
  private attackCooldownSeconds = 0;
  private nextArrowId = 1;
  private readonly selectedGateIds = new Set<string>();
  private readonly enemies: MutableEnemy[] = [];
  private readonly arrows: MutableArrow[] = [];
  private readonly gates: MutableGate[] = [
    { groupId: 'g01', leftLabel: '+1 箭矢', rightLabel: '最大 HP +25', z: 10, isChosen: false },
    { groupId: 'g02', leftLabel: '箭傷 +25%', rightLabel: '回復 25 HP', z: 28, isChosen: false },
  ];

  public start(): void {
    this.phase = 'playing';
    this.elapsedSeconds = 0;
    this.distanceMeters = 0;
    this.targetX = 0;
    this.player = { x: 0, hp: 100, maxHp: 100, damage: 1, projectileCount: 1 };
    this.attackCooldownSeconds = 0;
    this.nextArrowId = 1;
    this.selectedGateIds.clear();
    this.enemies.length = 0;
    this.arrows.length = 0;
    this.gates[0] = { groupId: 'g01', leftLabel: '+1 箭矢', rightLabel: '最大 HP +25', z: 10, isChosen: false };
    this.gates[1] = { groupId: 'g02', leftLabel: '箭傷 +25%', rightLabel: '回復 25 HP', z: 28, isChosen: false };
  }

  public setTargetX(targetX: number): void {
    this.targetX = Math.max(-PLAYER_MAX_X, Math.min(PLAYER_MAX_X, targetX));
  }

  public tick(deltaSeconds: number): void {
    if (this.phase !== 'playing') return;

    this.elapsedSeconds += deltaSeconds;
    this.distanceMeters += WORLD_SPEED_METERS_PER_SECOND * deltaSeconds;
    this.movePlayer(deltaSeconds);
    this.resolveGates();
    this.spawnEnemies();
    this.updateEnemies(deltaSeconds);
    this.attackCooldownSeconds -= deltaSeconds;
    if (this.attackCooldownSeconds <= 0) this.fireAtNearestEnemy();
    this.updateArrows(deltaSeconds);

    if (this.player.hp <= 0) this.phase = 'dead';
    if (this.elapsedSeconds >= RUN_DURATION_SECONDS) this.phase = 'complete';
  }

  public snapshot(): M1RunSnapshot {
    return {
      phase: this.phase,
      elapsedSeconds: this.elapsedSeconds,
      distanceMeters: this.distanceMeters,
      player: { ...this.player },
      enemies: this.enemies.map((enemy) => ({ ...enemy })),
      gates: this.gates.map((gate) => ({ ...gate })),
      arrows: this.arrows.map((arrow) => ({ ...arrow })),
      selectedGateIds: [...this.selectedGateIds],
    };
  }

  private movePlayer(deltaSeconds: number): void {
    const delta = this.targetX - this.player.x;
    const maxMove = PLAYER_MOVE_SPEED * deltaSeconds;
    this.player.x += Math.max(-maxMove, Math.min(maxMove, delta));
  }

  private resolveGates(): void {
    for (const gate of this.gates) {
      if (gate.isChosen || this.distanceMeters < gate.z) continue;
      const isLeft = this.player.x < 0;
      gate.isChosen = true;
      this.selectedGateIds.add(gate.groupId);

      if (gate.groupId === 'g01' && isLeft) this.player.projectileCount += 1;
      if (gate.groupId === 'g01' && !isLeft) {
        this.player.maxHp += 25;
        this.player.hp += 25;
      }
      if (gate.groupId === 'g02' && isLeft) this.player.damage *= 1.25;
      if (gate.groupId === 'g02' && !isLeft) this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
    }
  }

  private spawnEnemies(): void {
    if (this.distanceMeters >= 15 && !this.hasEnemy('melee-1')) {
      this.enemies.push(
        { id: 'melee-1', kind: 'melee', x: -2, z: 30, hp: 8, attackCooldownSeconds: 0, telegraphSeconds: 0 },
        { id: 'melee-2', kind: 'melee', x: 0, z: 34, hp: 8, attackCooldownSeconds: 0, telegraphSeconds: 0 },
        { id: 'melee-3', kind: 'melee', x: 2, z: 38, hp: 8, attackCooldownSeconds: 0, telegraphSeconds: 0 },
      );
    }
    if (this.distanceMeters >= 35 && !this.hasEnemy('ranged-1')) {
      this.enemies.push({ id: 'ranged-1', kind: 'ranged', x: 0, z: 38, hp: 12, attackCooldownSeconds: 2, telegraphSeconds: 0 });
    }
  }

  private updateEnemies(deltaSeconds: number): void {
    for (const enemy of this.enemies) {
      enemy.z -= WORLD_SPEED_METERS_PER_SECOND * deltaSeconds;
      enemy.attackCooldownSeconds -= deltaSeconds;

      if (enemy.kind === 'melee' && enemy.z <= 1.2 && enemy.attackCooldownSeconds <= 0) {
        this.player.hp -= 10;
        enemy.attackCooldownSeconds = 1;
      }

      if (enemy.kind === 'ranged') {
        if (enemy.attackCooldownSeconds <= 0 && enemy.telegraphSeconds <= 0) enemy.telegraphSeconds = 0.6;
        if (enemy.telegraphSeconds > 0) {
          enemy.telegraphSeconds -= deltaSeconds;
          if (enemy.telegraphSeconds <= 0) {
            this.player.hp -= Math.abs(this.player.x - enemy.x) < 1.2 ? 12 : 0;
            enemy.attackCooldownSeconds = 3.5;
          }
        }
      }
    }
  }

  private fireAtNearestEnemy(): void {
    const target = this.enemies.filter((enemy) => enemy.z > 0).sort((a, b) => a.z - b.z)[0];
    this.attackCooldownSeconds = 0.65;
    if (target === undefined) return;

    for (let index = 0; index < this.player.projectileCount; index += 1) {
      const offset = (index - (this.player.projectileCount - 1) / 2) * 0.3;
      this.arrows.push({ id: this.nextArrowId++, x: this.player.x + offset, z: 1 });
      if (Math.abs(target.x - (this.player.x + offset)) < 2.5) target.hp -= this.player.damage;
    }
  }

  private updateArrows(deltaSeconds: number): void {
    for (const arrow of this.arrows) arrow.z += 24 * deltaSeconds;
    for (let index = this.arrows.length - 1; index >= 0; index -= 1) {
      const arrow = this.arrows[index];
      if (arrow !== undefined && arrow.z > 45) this.arrows.splice(index, 1);
    }
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      if (enemy !== undefined && (enemy.hp <= 0 || enemy.z < -2)) this.enemies.splice(index, 1);
    }
  }

  private hasEnemy(id: string): boolean {
    return this.enemies.some((enemy) => enemy.id === id);
  }
}
