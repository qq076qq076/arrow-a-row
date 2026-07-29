import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  CanvasTexture,
  ConeGeometry,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PointLight,
  Scene,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { M1RunSnapshot } from '../domain/M1RunSimulation';
import type { BuffId } from '../content/BuffCatalog';

const ENEMY_MATERIALS = {
  melee: new MeshBasicMaterial({ color: '#f06b5e' }),
  ranged: new MeshBasicMaterial({ color: '#a986ef' }),
};

const BUFF_ICON_GLYPHS: Record<BuffId, string> = {
  split_arrow: '↗', power_shot: '✦', swift_shot: '➤', rapid_fire: '≋', piercing_arrow: '⊹', lightning_targets: '⚡', lightning_damage: '✹', lightning_range: '⌁', vitality: '✚', windstep: '➟', barkskin: '◆',
};

const POLYHAVEN_ROCK_URL = `${import.meta.env.BASE_URL}assets/polyhaven/rock_07/rock_07.gltf`;
const POLYHAVEN_STREET_LAMP_URL = `${import.meta.env.BASE_URL}assets/polyhaven/street_lamp_01/street_lamp_01.gltf`;
const POLYHAVEN_GOTHIC_STATUE_URL = `${import.meta.env.BASE_URL}assets/polyhaven/gothic_statue/gothic_statue.gltf`;
const POLYHAVEN_BUFF_LANTERN_URL = `${import.meta.env.BASE_URL}assets/polyhaven/lantern_01/Lantern_01.gltf`;
const QUATERNIUS_PLAYER_URL = `${import.meta.env.BASE_URL}assets/quaternius/platformer/character.gltf`;
const QUATERNIUS_ENEMY_URL = `${import.meta.env.BASE_URL}assets/quaternius/platformer/enemy.gltf`;
const QUATERNIUS_GRASS_ROAD_URL = `${import.meta.env.BASE_URL}assets/quaternius/platformer/grass_road_tile.gltf`;

export class ThreeRuntime {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.1, 100);
  private readonly renderer: WebGLRenderer;
  private readonly playerMesh = new Mesh(new BoxGeometry(0.8, 1.2, 0.8), new MeshBasicMaterial({ color: '#f4c95d' }));
  private readonly bossMesh: Mesh = new Mesh(new BoxGeometry(2.4, 2.2, 1.4), new MeshBasicMaterial({ color: '#6ea65a' }));
  private readonly bossTelegraphRing = new Mesh(new TorusGeometry(2.1, 0.12, 8, 32), new MeshBasicMaterial({ color: '#f4c95d', transparent: true, opacity: 0.88 }));
  private readonly roadGeometry = new BoxGeometry(11, 0.12, 7);
  private readonly roadMaterials = [new MeshBasicMaterial({ color: '#315f4a' }), new MeshBasicMaterial({ color: '#3d7755' })];
  private readonly roadMeshes: Mesh[] = [];
  private readonly enemyMeshes = new Map<string, Mesh>();
  private readonly arrowMeshes = new Map<number, Mesh>();
  private readonly hitMeshes = new Map<number, Mesh>();
  private readonly pickupMeshes = new Map<number, Mesh>();
  private readonly lightningMeshes = new Map<string, Mesh>();
  private readonly lightningArcs = new Map<string, Line>();
  private readonly gateGroups = new Map<string, Group>();
  private readonly sceneryGroup = new Group();
  private readonly viaductSceneryGroup = new Group();
  private bossModelTemplate: Group | undefined;
  private buffModelTemplate: Group | undefined;
  private playerModelTemplate: Group | undefined;
  private enemyModelTemplate: Group | undefined;
  private roadModelTemplate: Group | undefined;
  private readonly ambientLight = new AmbientLight('#cde4d0', 1.7);
  private readonly sunLight = new DirectionalLight('#fff0c4', 2.8);
  private isDisposed = false;
  private qualityMode: 'low' | 'standard' = 'standard';
  private bossChapterId: M1RunSnapshot['chapterId'] = 'ch01_meadow';

  public constructor(private readonly container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(new Color('#173b3a'));
    this.container.append(this.renderer.domElement);
    this.updateCamera(0);
    this.scene.add(this.playerMesh);
    this.scene.add(this.bossMesh);
    this.scene.add(this.bossTelegraphRing);
    this.sunLight.position.set(-4, 9, -2);
    this.scene.add(this.ambientLight, this.sunLight, this.sceneryGroup, this.viaductSceneryGroup);
    this.createRoad();
    this.loadPolyhavenScenery();
    this.loadPolyhavenViaductScenery();
    this.loadPolyhavenBossModel();
    this.loadPolyhavenBuffModel();
    this.loadQuaterniusActorModels();
    this.loadQuaterniusRoadModel();
    this.bossMesh.visible = false;
    this.bossTelegraphRing.visible = false;
    this.resize();
  }

  public setQuality(mode: 'low' | 'standard'): void {
    this.qualityMode = mode;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mode === 'low' ? 1 : 1.5));
    this.resize();
  }

  public resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    // A short landscape viewport needs a wider vertical view; a tall phone can
    // keep the runner larger while still reserving the lower gameplay area.
    this.camera.fov = this.camera.aspect > 1 ? 62 : 52;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public sync(snapshot: M1RunSnapshot): void {
    this.syncChapterTheme(snapshot.chapterId);
    this.playerMesh.position.set(snapshot.player.x, 0.6, 0);
    this.updateCamera(snapshot.player.x);
    this.syncScenery(snapshot);
    this.syncGates(snapshot);
    this.syncEnemies(snapshot);
    this.syncArrows(snapshot);
    this.syncHits(snapshot);
    this.syncPickups(snapshot);
    this.syncLightning(snapshot);
    this.syncBoss(snapshot);
  }

  private syncChapterTheme(chapterId: M1RunSnapshot['chapterId']): void {
    if (this.bossChapterId !== chapterId) {
      this.bossMesh.geometry.dispose();
      this.bossMesh.geometry = chapterId === 'ch02_viaduct' ? new OctahedronGeometry(1.45, 1) : chapterId === 'ch03_forge' ? new IcosahedronGeometry(1.35, 1) : new BoxGeometry(2.4, 2.2, 1.4);
      this.bossChapterId = chapterId;
    }
    this.syncChapterBossModel(chapterId);
    const isMirrorViaduct = chapterId === 'ch02_viaduct';
    const isForge = chapterId === 'ch03_forge';
    const palette = chapterId === 'ch04_canopy' ? ['#1b3b32', '#356c54', '#5c9b70'] : chapterId === 'ch05_archive' ? ['#101b3d', '#263d70', '#b69a50'] : chapterId === 'ch06_horizon' ? ['#392b4d', '#7a5d9b', '#e0c97a'] : isForge ? ['#3b1e35', '#64334e', '#9a4f3b'] : isMirrorViaduct ? ['#172849', '#243d69', '#31528a'] : ['#173b3a', '#315f4a', '#3d7755'];
    this.renderer.setClearColor(new Color(palette[0]!));
    this.roadMaterials[0]!.color.set(palette[1]!);
    this.roadMaterials[1]!.color.set(palette[2]!);
    this.ambientLight.color.set(isForge ? '#ffb39a' : isMirrorViaduct ? '#b9d9ff' : '#b5d3bd');
    this.sunLight.color.set(isForge ? '#ff8e63' : isMirrorViaduct ? '#c4dcff' : '#fff0c4');
    this.sceneryGroup.visible = chapterId === 'ch01_meadow';
    this.viaductSceneryGroup.visible = chapterId === 'ch02_viaduct';
    for (const road of this.roadMeshes) {
      const model = road.getObjectByName('ch01-road-model');
      if (model !== undefined) model.visible = chapterId === 'ch01_meadow';
      const material = road.material as MeshBasicMaterial;
      material.colorWrite = chapterId !== 'ch01_meadow';
      material.depthWrite = chapterId !== 'ch01_meadow';
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.isDisposed = true;
    this.playerMesh.geometry.dispose();
    this.playerMesh.material.dispose();
    this.disposeMesh(this.bossMesh);
    this.disposeMesh(this.bossTelegraphRing);
    this.roadGeometry.dispose();
    this.roadMaterials.forEach((material) => material.dispose());
    for (const mesh of this.enemyMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.arrowMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.hitMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.pickupMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.lightningMeshes.values()) this.disposeMesh(mesh);
    for (const line of this.lightningArcs.values()) this.disposeLine(line);
    for (const group of this.gateGroups.values()) group.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
      if (child instanceof Sprite) {
        child.material.map?.dispose();
        child.material.dispose();
      }
    });
    this.sceneryGroup.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
    });
    this.viaductSceneryGroup.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private createRoad(): void {
    for (let index = 0; index < 24; index += 1) {
      const segment = new Mesh(this.roadGeometry, this.roadMaterials[index % this.roadMaterials.length]!);
      segment.position.set(0, -0.1, index * 7 + 3.5);
      this.roadMeshes.push(segment);
      this.scene.add(segment);
    }
  }

  private loadQuaterniusRoadModel(): void {
    this.loadGltf(QUATERNIUS_GRASS_ROAD_URL, 'Quaternius Grass Road Tile', (scene) => {
      this.roadModelTemplate = scene;
      for (const road of this.roadMeshes) this.attachCh01RoadModel(road);
    });
  }

  private attachCh01RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch01-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch01-road-model';
    model.scale.set(11, 0.16, 7);
    model.position.y = 0.1;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#315f4a');
        child.material = material;
      }
    });
    road.add(model);
    const material = road.material as MeshBasicMaterial;
    material.colorWrite = false;
    material.depthWrite = false;
  }

  private loadPolyhavenScenery(): void {
    new GLTFLoader().load(POLYHAVEN_ROCK_URL, (gltf) => {
      if (this.isDisposed) return;
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [
        [-7.4, 10, 10, 0.35], [7.3, 22, 9, -0.7], [-7.2, 38, 11, 1.15], [7.3, 56, 10, -1.55],
      ];
      for (const [index, [x, z, scale, rotationY]] of placements.entries()) {
        const rock = gltf.scene.clone(true);
        rock.position.set(x, 0.04, z);
        rock.rotation.y = rotationY;
        rock.scale.setScalar(scale);
        rock.userData.worldZ = z;
        rock.userData.sceneryIndex = index;
        this.sceneryGroup.add(rock);
      }
    }, undefined, (error: unknown) => console.warn('Poly Haven Rock 07 載入失敗。', error));
  }

  private loadGltf(url: string, label: string, onLoad: (scene: Group) => void): void {
    const resourcePath = new URL('.', new URL(url, window.location.href)).href;
    void fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.arrayBuffer();
      })
      .then((source) => new Promise<Group>((resolve, reject) => {
        new GLTFLoader().parse(source, resourcePath, (gltf) => resolve(gltf.scene), reject);
      }))
      .then((scene) => {
        if (!this.isDisposed) onLoad(scene);
      })
      .catch((error: unknown) => console.warn(`${label} 載入失敗。`, error));
  }

  private loadQuaterniusActorModels(): void {
    this.loadGltf(QUATERNIUS_PLAYER_URL, 'Quaternius Character', (scene) => {
      this.playerModelTemplate = scene;
      this.attachPlayerModel();
    });
    this.loadGltf(QUATERNIUS_ENEMY_URL, 'Quaternius Enemy', (scene) => {
      this.enemyModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) this.attachEnemyModel(enemy, enemy.userData.kind as 'melee' | 'ranged');
    });
  }

  private attachPlayerModel(): void {
    if (this.playerModelTemplate === undefined || this.playerMesh.getObjectByName('player-model') !== undefined) return;
    const model = this.playerModelTemplate.clone(true);
    model.name = 'player-model';
    model.scale.setScalar(0.2);
    model.position.set(0, -0.61, 0);
    this.playerMesh.add(model);
    const material = this.playerMesh.material as MeshBasicMaterial;
    material.colorWrite = false;
    material.depthWrite = false;
  }

  private attachEnemyModel(anchor: Mesh, kind: 'melee' | 'ranged'): void {
    if (this.enemyModelTemplate === undefined || anchor.getObjectByName('enemy-model') !== undefined) return;
    const model = this.enemyModelTemplate.clone(true);
    model.name = 'enemy-model';
    model.scale.setScalar(kind === 'ranged' ? 0.86 : 0.96);
    model.position.set(0, -0.55, 0);
    model.rotation.y = kind === 'ranged' ? Math.PI : 0;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        if (material.color !== undefined) material.color.lerp(new Color(kind === 'ranged' ? '#a986ef' : '#f06b5e'), 0.22);
        child.material = material;
      }
    });
    anchor.add(model);
    const material = anchor.material as MeshBasicMaterial;
    material.colorWrite = false;
    material.depthWrite = false;
  }

  private loadPolyhavenViaductScenery(): void {
    new GLTFLoader().load(POLYHAVEN_STREET_LAMP_URL, (gltf) => {
      if (this.isDisposed) return;
      const placements: ReadonlyArray<readonly [number, number, number]> = [
        [-5.1, 12, Math.PI / 2], [5.1, 26, -Math.PI / 2], [-5.1, 40, Math.PI / 2], [5.1, 54, -Math.PI / 2],
      ];
      for (const [x, z, rotationY] of placements) {
        const lamp = gltf.scene.clone(true);
        lamp.position.set(x, 0, z);
        lamp.rotation.y = rotationY;
        lamp.scale.setScalar(0.75);
        const glow = new PointLight('#9dc9ff', 1.5, 9, 2);
        glow.position.set(0, 3.2, 0);
        lamp.add(glow);
        this.viaductSceneryGroup.add(lamp);
      }
    }, undefined, (error: unknown) => console.warn('Poly Haven Street Lamp 01 載入失敗。', error));
  }

  private loadPolyhavenBossModel(): void {
    this.loadGltf(POLYHAVEN_GOTHIC_STATUE_URL, 'Poly Haven Gothic Statue', (scene) => {
      this.bossModelTemplate = scene;
      this.syncChapterBossModel(this.bossChapterId);
    });
  }

  private loadPolyhavenBuffModel(): void {
    this.loadGltf(POLYHAVEN_BUFF_LANTERN_URL, 'Poly Haven Lantern 01', (scene) => {
      this.buffModelTemplate = scene;
      for (const pickup of this.pickupMeshes.values()) this.attachBuffModel(pickup, '#71e6d1', 1.7);
      for (const group of this.gateGroups.values()) {
        for (const anchor of group.children.filter((child): child is Mesh => child.name === 'buff-anchor')) this.attachBuffModel(anchor, anchor.userData.color as string, 5);
      }
    });
  }

  private attachBuffModel(anchor: Mesh, color: string, scale: number): void {
    if (this.buffModelTemplate === undefined || anchor.userData.buffModelAttached === true) return;
    const model = this.buffModelTemplate.clone(true);
    model.name = 'buff-model';
    model.scale.setScalar(scale);
    model.position.set(0, -0.52, 0.02);
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        if (material.color !== undefined) material.color.lerp(new Color(color), 0.3);
        child.material = material;
      }
    });
    const anchorMaterial = anchor.material as MeshBasicMaterial;
    anchorMaterial.colorWrite = false;
    anchorMaterial.depthWrite = false;
    anchor.add(model);
    anchor.userData.buffModelAttached = true;
  }

  private syncChapterBossModel(chapterId: M1RunSnapshot['chapterId']): void {
    const existingModel = this.bossMesh.getObjectByName('chapter-boss-model');
    if (chapterId !== 'ch01_meadow' || this.bossModelTemplate === undefined) {
      if (existingModel !== undefined) this.bossMesh.remove(existingModel);
      this.bossMesh.userData.chapterBossAttached = false;
      const material = this.bossMesh.material as MeshBasicMaterial;
      material.colorWrite = true;
      material.depthWrite = true;
      return;
    }
    if (existingModel !== undefined) return;
    const model = this.bossModelTemplate.clone(true);
    model.name = 'chapter-boss-model';
    model.scale.setScalar(1.5);
    model.position.set(0, -1.05, 0);
    this.bossMesh.add(model);
    const material = this.bossMesh.material as MeshBasicMaterial;
    material.colorWrite = false;
    material.depthWrite = false;
    this.bossMesh.userData.chapterBossAttached = true;
  }

  private syncScenery(snapshot: M1RunSnapshot): void {
    for (const rock of this.sceneryGroup.children) {
      const worldZ = rock.userData.worldZ as number | undefined;
      const index = rock.userData.sceneryIndex as number | undefined;
      if (worldZ === undefined || index === undefined) continue;
      const relativeZ = worldZ - snapshot.distanceMeters;
      rock.position.z = relativeZ;
      rock.visible = relativeZ > -8 && relativeZ < 64 && (this.qualityMode === 'standard' || index < 2);
    }
  }

  private updateCamera(playerX: number): void {
    // Keep the runner in the lower third even on narrow portrait windows. The
    // camera tracks laterally so moving to either edge cannot leave it offscreen.
    this.camera.position.set(playerX * 0.75, 7, -6);
    this.camera.lookAt(playerX * 0.45, 0, 6);
  }

  private syncBoss(snapshot: M1RunSnapshot): void {
    const boss = snapshot.boss;
    this.bossMesh.visible = boss !== undefined && !boss.isDefeated;
    this.bossTelegraphRing.visible = false;
    if (boss === undefined || boss.isDefeated) return;
    this.bossMesh.position.set(0, 1.1, boss.z);
    const material = this.bossMesh.material as MeshBasicMaterial;
    const baseColor = snapshot.chapterId === 'ch02_viaduct' ? '#7fa8ef' : snapshot.chapterId === 'ch03_forge' ? '#dc7449' : '#6ea65a';
    material.color.set(boss.telegraphSeconds > 0 ? '#f4c95d' : boss.phase === 2 ? '#b7774f' : baseColor);
    const baseScale = snapshot.chapterId === 'ch02_viaduct' ? 0.9 : snapshot.chapterId === 'ch03_forge' ? 1.1 : 1;
    const isAttackTelegraph = boss.telegraphSeconds > 0 && boss.telegraphText !== '靜滯正在加深！';
    const pulse = isAttackTelegraph ? 1 + Math.sin(performance.now() / 70) * 0.12 : 1;
    this.bossMesh.scale.setScalar(baseScale * pulse);
    this.bossMesh.rotation.y += isAttackTelegraph ? 0.12 : 0.02;
    if (isAttackTelegraph) {
      this.bossTelegraphRing.visible = true;
      this.bossTelegraphRing.position.set(0, 0.06, boss.z);
      this.bossTelegraphRing.rotation.x = -Math.PI / 2;
      this.bossTelegraphRing.rotation.z += 0.16;
      this.bossTelegraphRing.scale.setScalar(0.85 + (1 - boss.telegraphSeconds / 0.75) * 1.55);
    }
  }

  private syncGates(snapshot: M1RunSnapshot): void {
    for (const gate of snapshot.gates) {
      let group = this.gateGroups.get(gate.groupId);
      const signature = `${gate.leftBuffId}:${gate.rightBuffId}`;
      if (group !== undefined && group.userData.signature !== signature) {
        this.scene.remove(group);
        group.traverse((child) => {
          if (child instanceof Mesh) this.disposeMesh(child);
          if (child instanceof Sprite) { child.material.map?.dispose(); child.material.dispose(); }
        });
        this.gateGroups.delete(gate.groupId);
        group = undefined;
      }
      if (group === undefined) {
        group = new Group();
        group.userData.signature = signature;
        const left = this.createGateBuffAnchor('#5bb5d8');
        const right = this.createGateBuffAnchor('#8ccf9b');
        left.position.x = -2.5;
        right.position.x = 2.5;
        group.add(
          left,
          right,
          this.createGateLabel(gate.leftBuffId, gate.leftLabel, '#5bb5d8', -2.5, gate.groupId === 'g01'),
          this.createGateLabel(gate.rightBuffId, gate.rightLabel, '#8ccf9b', 2.5, gate.groupId === 'g01'),
        );
        this.gateGroups.set(gate.groupId, group);
        this.scene.add(group);
      }
      group.position.z = gate.z - snapshot.distanceMeters;
      group.visible = !gate.isChosen;
    }
  }

  private createGateBuffAnchor(color: string): Mesh {
    const anchor = new Mesh(new BoxGeometry(2, 2.5, 0.25), new MeshBasicMaterial({ color }));
    anchor.name = 'buff-anchor';
    anchor.userData.color = color;
    this.attachBuffModel(anchor, color, 5);
    return anchor;
  }

  private createGateLabel(buffId: BuffId, text: string, background: string, x: number, isOpeningGate: boolean): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立 Gate 文字貼圖。');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#f8f7ef';
    context.lineWidth = 16;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    context.fillStyle = '#102c2a';
    context.font = `800 ${isOpeningGate ? 142 : 104}px system-ui, sans-serif`;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.font = `800 ${isOpeningGate ? 154 : 112}px system-ui, sans-serif`;
    context.fillText(BUFF_ICON_GLYPHS[buffId], isOpeningGate ? 70 : 92, canvas.height / 2 + 4);
    context.font = `800 ${isOpeningGate ? 112 : 80}px system-ui, sans-serif`;
    context.fillText(text, isOpeningGate ? 230 : 190, canvas.height / 2 + 4);
    const material = new SpriteMaterial({ map: new CanvasTexture(canvas), transparent: false });
    const label = new Sprite(material);
    label.position.set(x, 0.2, -0.18);
    label.scale.set(isOpeningGate ? 2.2 : 1.85, isOpeningGate ? 0.55 : 0.46, 1);
    return label;
  }

  private syncEnemies(snapshot: M1RunSnapshot): void {
    const activeIds = new Set(snapshot.enemies.map((enemy) => enemy.id));
    for (const [id, mesh] of this.enemyMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.disposeMesh(mesh);
        this.enemyMeshes.delete(id);
      }
    }
    for (const enemy of snapshot.enemies) {
      let mesh = this.enemyMeshes.get(enemy.id);
      if (mesh === undefined) {
        mesh = this.createEnemyMesh(enemy.kind);
        this.enemyMeshes.set(enemy.id, mesh);
        this.scene.add(mesh);
      }
      const deathProgress = enemy.deathSeconds / 0.45;
      const scale = enemy.deathSeconds > 0 ? 0.35 + deathProgress * 0.65 : enemy.telegraphSeconds > 0 ? 1.25 : 1;
      mesh.position.set(enemy.x, 0.55 - (1 - deathProgress) * 0.35, enemy.z);
      mesh.scale.setScalar(scale);
      mesh.rotation.y += enemy.kind === 'ranged' ? 0.045 : 0.015;
      const healthFill = mesh.getObjectByName('health-fill') as Mesh | undefined;
      const healthBackground = mesh.getObjectByName('health-background') as Mesh | undefined;
      // Enemy bodies may spin, but their HP bars stay stable and readable.
      if (healthBackground !== undefined) healthBackground.rotation.y = -mesh.rotation.y;
      if (healthFill !== undefined) healthFill.rotation.y = -mesh.rotation.y;
      if (healthFill !== undefined) healthFill.scale.x = Math.max(0, enemy.hp / (enemy.kind === 'melee' ? 8 : 12));
    }
  }

  private createEnemyMesh(kind: 'melee' | 'ranged'): Mesh {
    const geometry = kind === 'melee' ? new ConeGeometry(0.72, 1.45, 4) : new SphereGeometry(0.72, 10, 8);
    const mesh = new Mesh(geometry, ENEMY_MATERIALS[kind]);
    mesh.userData.kind = kind;
    const label = this.createEnemyLabel(kind === 'melee' ? '衝鋒獸' : '芽砲手');
    label.position.set(0, 1.1, 0);
    const healthBackground = new Mesh(new BoxGeometry(1, 0.07, 0.04), new MeshBasicMaterial({ color: '#321d25' }));
    healthBackground.name = 'health-background';
    healthBackground.position.set(0, 1.28, 0);
    const healthFill = new Mesh(new BoxGeometry(0.92, 0.04, 0.05), new MeshBasicMaterial({ color: '#84e38a' }));
    healthFill.name = 'health-fill';
    healthFill.position.set(0, 1.28, -0.03);
    mesh.add(label, healthBackground, healthFill);
    this.attachEnemyModel(mesh, kind);
    return mesh;
  }

  private createEnemyLabel(text: string): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立怪物文字貼圖。');
    context.fillStyle = '#102c2a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f8f7ef';
    context.font = '700 58px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 3);
    const label = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), transparent: false }));
    label.scale.set(1.05, 0.26, 1);
    return label;
  }

  private syncArrows(snapshot: M1RunSnapshot): void {
    const activeIds = new Set(snapshot.arrows.map((arrow) => arrow.id));
    for (const [id, mesh] of this.arrowMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.disposeMesh(mesh);
        this.arrowMeshes.delete(id);
      }
    }
    for (const arrow of snapshot.arrows) {
      let mesh = this.arrowMeshes.get(arrow.id);
      if (mesh === undefined) {
        mesh = new Mesh(new SphereGeometry(0.12, 8, 8), new MeshBasicMaterial({ color: '#fff4ba' }));
        this.arrowMeshes.set(arrow.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(arrow.x, 0.8, arrow.z);
    }
  }

  private syncHits(snapshot: M1RunSnapshot): void {
    this.syncTransientMeshes(snapshot.hits, this.hitMeshes, () => new Mesh(new SphereGeometry(0.28, 8, 8), new MeshBasicMaterial({ color: '#fff4ba' })), (mesh, hit) => {
      mesh.position.set(hit.x, 0.8, hit.z);
      mesh.scale.setScalar(1 + (0.2 - hit.seconds) * 5);
    });
  }

  private syncLightning(snapshot: M1RunSnapshot): void {
    const targets = new Set(snapshot.lightningTargetIds);
    for (const [id, mesh] of this.lightningMeshes) {
      if (!targets.has(id)) { this.scene.remove(mesh); this.disposeMesh(mesh); this.lightningMeshes.delete(id); }
    }
    for (const [id, line] of this.lightningArcs) {
      if (!targets.has(id)) { this.scene.remove(line); this.disposeLine(line); this.lightningArcs.delete(id); }
    }
    for (const enemy of snapshot.enemies) {
      if (!targets.has(enemy.id)) continue;
      let mesh = this.lightningMeshes.get(enemy.id);
      if (mesh === undefined) {
        mesh = new Mesh(new OctahedronGeometry(0.52, 1), new MeshBasicMaterial({ color: '#a9ecff', transparent: true, opacity: 0.8 }));
        this.lightningMeshes.set(enemy.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(enemy.x, 1.1, enemy.z);
      mesh.rotation.y += 0.18;
      const pulse = 0.9 + Math.sin(performance.now() / 55) * 0.2;
      mesh.scale.setScalar(pulse);
      this.syncLightningArc(enemy.id, snapshot.player.x, enemy.x, enemy.z);
    }
    if (targets.has('boss') && snapshot.boss !== undefined) this.syncLightningArc('boss', snapshot.player.x, 0, snapshot.boss.z);
  }

  private syncLightningArc(id: string, startX: number, endX: number, endZ: number): void {
    let line = this.lightningArcs.get(id);
    if (line === undefined) {
      line = new Line(new BufferGeometry(), new LineBasicMaterial({ color: '#b9f4ff', transparent: true, opacity: 0.95 }));
      this.lightningArcs.set(id, line);
      this.scene.add(line);
    }
    const phase = performance.now() / 48 + id.length;
    const points = [0, 0.25, 0.5, 0.75, 1].map((progress) => new Vector3(startX + (endX - startX) * progress + (progress === 0 || progress === 1 ? 0 : Math.sin(phase + progress * 13) * 0.42), 0.72 + Math.sin(phase + progress * 9) * 0.12, endZ * progress));
    line.geometry.setFromPoints(points);
  }

  private syncPickups(snapshot: M1RunSnapshot): void {
    this.syncTransientMeshes(snapshot.pickups, this.pickupMeshes, () => this.createPickupMesh(), (mesh, pickup) => {
      mesh.position.set(pickup.x, 0.45, pickup.z);
      mesh.rotation.y += 0.08;
      const label = mesh.getObjectByName('pickup-label') as Sprite | undefined;
      if (label !== undefined && (label.userData.text !== pickup.label || label.userData.buffId !== pickup.buffId)) {
        label.material.map?.dispose();
        label.material.dispose();
        const replacement = this.createPickupLabel(pickup.label, pickup.buffId);
        replacement.name = 'pickup-label';
        mesh.remove(label);
        mesh.add(replacement);
      }
    });
  }

  private createPickupMesh(): Mesh {
    const mesh = new Mesh(new OctahedronGeometry(0.3), new MeshBasicMaterial({ color: '#71e6d1' }));
    const label = this.createPickupLabel('Buff +⅓', 'split_arrow');
    label.name = 'pickup-label';
    mesh.add(label);
    this.attachBuffModel(mesh, '#71e6d1', 1.7);
    return mesh;
  }

  private createPickupLabel(text: string, buffId: BuffId): Sprite {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 420;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立掉落 Buff 文字貼圖。');
    context.fillStyle = '#102c2a'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#e8fff1'; context.lineWidth = 12; context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    this.drawPickupIcon(context, buffId, canvas.width / 2, 108);
    context.fillStyle = '#f8f7ef'; context.font = '800 108px system-ui, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, canvas.width / 2, 294);
    const label = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), transparent: false }));
    label.userData.text = text; label.userData.buffId = buffId; label.position.set(0, 1.1, 0); label.scale.set(3, 1.22, 1);
    return label;
  }

  private drawPickupIcon(context: CanvasRenderingContext2D, buffId: BuffId, x: number, y: number): void {
    const icons: Record<BuffId, readonly [string, string]> = { split_arrow: ['➤', '#f4c95d'], power_shot: ['✦', '#ff9a6b'], swift_shot: ['≫', '#71e6d1'], rapid_fire: ['⚡', '#fff4ba'], piercing_arrow: ['⇥', '#a986ef'], lightning_targets: ['⚡', '#9ee8ff'], lightning_damage: ['✹', '#b3a6ff'], lightning_range: ['⌁', '#71e6d1'], vitality: ['+', '#ff8d9b'], windstep: ['➜', '#83d7ff'], barkskin: ['⬡', '#8fe39a'] };
    const [glyph, color] = icons[buffId];
    context.fillStyle = color; context.beginPath(); context.arc(x, y, 72, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#102c2a'; context.font = '800 104px system-ui, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(glyph, x, y + 4);
  }

  private syncTransientMeshes<T extends { readonly id: number }>(items: readonly T[], meshes: Map<number, Mesh>, create: () => Mesh, update: (mesh: Mesh, item: T) => void): void {
    const activeIds = new Set(items.map((item) => item.id));
    for (const [id, mesh] of meshes) { if (!activeIds.has(id)) { this.scene.remove(mesh); this.disposeMesh(mesh); meshes.delete(id); } }
    for (const item of items) { let mesh = meshes.get(item.id); if (mesh === undefined) { mesh = create(); meshes.set(item.id, mesh); this.scene.add(mesh); } update(mesh, item); }
  }

  private disposeMesh(mesh: Mesh): void {
    mesh.geometry.dispose();
    mesh.traverse((child) => {
      if (child instanceof Sprite) {
        child.material.map?.dispose();
        child.material.dispose();
      }
    });
    if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
    else if (mesh.material !== ENEMY_MATERIALS.melee && mesh.material !== ENEMY_MATERIALS.ranged) mesh.material.dispose();
  }

  private disposeLine(line: Line): void { line.geometry.dispose(); if (Array.isArray(line.material)) line.material.forEach((material) => material.dispose()); else line.material.dispose(); }
}
