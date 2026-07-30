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
import type { ChapterId } from '../content/ChapterDefinitions';

const ENEMY_MATERIALS = {
  melee: new MeshBasicMaterial({ color: '#f06b5e' }),
  ranged: new MeshBasicMaterial({ color: '#a986ef' }),
};

const BUFF_ICON_GLYPHS: Record<BuffId, string> = {
  split_arrow: '↗', power_shot: '✦', swift_shot: '➤', rapid_fire: '≋', piercing_arrow: '⊹', lightning_targets: '⚡', lightning_damage: '✹', lightning_range: '⌁', cannon_weapon: '◉', cannon_damage: '✹', cannon_radius: '◎', cannon_fire_rate: '➶', life_steal: '♥', vitality: '✚', windstep: '➟', barkskin: '◆',
};

const POLYHAVEN_ROCK_URL = `${import.meta.env.BASE_URL}assets/polyhaven/rock_07/rock_07.gltf`;
const POLYHAVEN_STREET_LAMP_URL = `${import.meta.env.BASE_URL}assets/polyhaven/street_lamp_01/street_lamp_01.gltf`;
const POLYHAVEN_GOTHIC_STATUE_URL = `${import.meta.env.BASE_URL}assets/polyhaven/gothic_statue/gothic_statue.gltf`;
const POLYHAVEN_BUFF_LANTERN_URL = `${import.meta.env.BASE_URL}assets/polyhaven/lantern_01/Lantern_01.gltf`;
const POLYHAVEN_PICKUP_CHEST_URL = `${import.meta.env.BASE_URL}assets/polyhaven/treasure_chest/treasure_chest_1k.gltf`;
const POLY_PIZZA_ARCHER_URL = `${import.meta.env.BASE_URL}assets/poly-pizza/archer/archer.glb`;
const QUATERNIUS_GRASS_ROAD_URL = `${import.meta.env.BASE_URL}assets/quaternius/platformer/grass_road_tile.gltf`;
const POLYHAVEN_CANNON_URL = `${import.meta.env.BASE_URL}assets/polyhaven/cannon_01/cannon_01.gltf`;
const POLYHAVEN_AMMO_BOX_URL = `${import.meta.env.BASE_URL}assets/polyhaven/ammo_box/ammo_box.gltf`;
const POLYHAVEN_DRILL_PRESS_URL = `${import.meta.env.BASE_URL}assets/polyhaven/drill_press_01/drill_press_01.gltf`;
const POLYHAVEN_POWER_BOX_URL = `${import.meta.env.BASE_URL}assets/backlog/polyhaven/power_box_01/power_box_01.gltf`;
const POLYHAVEN_BARREL_URL = `${import.meta.env.BASE_URL}assets/polyhaven/barrel_01/barrel_01.gltf`;
const POLYHAVEN_BARREL_STOVE_URL = `${import.meta.env.BASE_URL}assets/polyhaven/barrel_stove/barrel_stove.gltf`;
const POLYHAVEN_INDUSTRIAL_PIPES_URL = `${import.meta.env.BASE_URL}assets/polyhaven/modular_industrial_pipes_01/modular_industrial_pipes_01.gltf`;
const POLYHAVEN_ROOT_CLUSTER_URL = `${import.meta.env.BASE_URL}assets/polyhaven/root_cluster_01/root_cluster_01.gltf`;
const POLYHAVEN_TREE_STUMP_URL = `${import.meta.env.BASE_URL}assets/polyhaven/tree_stump_01/tree_stump_01.gltf`;
const POLYHAVEN_FIR_SAPLING_URL = `${import.meta.env.BASE_URL}assets/polyhaven/fir_sapling/fir_sapling.gltf`;
const POLYHAVEN_PINE_ROOTS_URL = `${import.meta.env.BASE_URL}assets/polyhaven/pine_roots/pine_roots.gltf`;
const POLYHAVEN_TREE_SMALL_URL = `${import.meta.env.BASE_URL}assets/backlog/polyhaven/tree_small_02/tree_small_02.gltf`;
const POLYHAVEN_SHELF_URL = `${import.meta.env.BASE_URL}assets/polyhaven/Shelf_01/Shelf_01_1k.gltf`;
const POLYHAVEN_SCHOOL_DESK_URL = `${import.meta.env.BASE_URL}assets/polyhaven/SchoolDesk_01/SchoolDesk_01_1k.gltf`;
const POLYHAVEN_MARBLE_BUST_URL = `${import.meta.env.BASE_URL}assets/polyhaven/marble_bust_01/marble_bust_01_1k.gltf`;
const POLYHAVEN_VINTAGE_RADIO_URL = `${import.meta.env.BASE_URL}assets/polyhaven/vintage_radio_transceiver/vintage_radio_transceiver_1k.gltf`;

export class ThreeRuntime {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.1, 100);
  private readonly renderer: WebGLRenderer;
  private readonly playerMesh = new Mesh(new BoxGeometry(0.8, 1.2, 0.8), new MeshBasicMaterial({ color: '#f4c95d' }));
  // Keep the visual avatar on its own anchor: it is updated with the runner
  // position every frame and cannot be left behind by the invisible hitbox.
  private readonly playerModelAnchor = new Group();
  private readonly bossMesh: Mesh = new Mesh(new BoxGeometry(2.4, 2.2, 1.4), new MeshBasicMaterial({ color: '#6ea65a' }));
  private readonly bossTelegraphRing = new Mesh(new TorusGeometry(2.1, 0.12, 8, 32), new MeshBasicMaterial({ color: '#f4c95d', transparent: true, opacity: 0.88 }));
  private readonly roadGeometry = new BoxGeometry(11, 0.12, 7);
  private readonly roadMaterials = [new MeshBasicMaterial({ color: '#315f4a' }), new MeshBasicMaterial({ color: '#3d7755' })];
  private readonly roadMeshes: Mesh[] = [];
  private readonly enemyMeshes = new Map<string, Mesh>();
  private readonly enemyMeshPools = new Map<string, Mesh[]>();
  private readonly arrowMeshes = new Map<number, Mesh>();
  private readonly arrowMeshPool: Mesh[] = [];
  private readonly enemyProjectileMeshes = new Map<number, Mesh>();
  private readonly hitMeshes = new Map<number, Mesh>();
  private readonly pickupMeshes = new Map<number, Mesh>();
  private readonly transientMeshPools = new Map<Map<number, Mesh>, Mesh[]>();
  private readonly lightningMeshes = new Map<string, Mesh>();
  private readonly lightningArcs = new Map<string, Line>();
  private readonly gateGroups = new Map<string, Group>();
  private readonly sceneryGroup = new Group();
  private readonly viaductSceneryGroup = new Group();
  private readonly forgeSceneryGroup = new Group();
  private readonly canopySceneryGroup = new Group();
  private readonly archiveSceneryGroup = new Group();
  private readonly horizonSceneryGroup = new Group();
  private bossModelTemplate: Group | undefined;
  private ch02BossModelTemplate: Group | undefined;
  private ch03BossModelTemplate: Group | undefined;
  private ch04BossModelTemplate: Group | undefined;
  private ch05BossModelTemplate: Group | undefined;
  private ch06BossModelTemplate: Group | undefined;
  private buffModelTemplate: Group | undefined;
  private pickupModelTemplate: Group | undefined;
  private playerModelTemplate: Group | undefined;
  private ch02MeleeModelTemplate: Group | undefined;
  private ch02RangedModelTemplate: Group | undefined;
  private ch03MeleeModelTemplate: Group | undefined;
  private ch03RangedModelTemplate: Group | undefined;
  private ch04MeleeModelTemplate: Group | undefined;
  private ch04RangedModelTemplate: Group | undefined;
  private ch05MeleeModelTemplate: Group | undefined;
  private ch05RangedModelTemplate: Group | undefined;
  private ch06MeleeModelTemplate: Group | undefined;
  private ch06RangedModelTemplate: Group | undefined;
  private cannonBallModelTemplate: Group | undefined;
  private roadModelTemplate: Group | undefined;
  private readonly ambientLight = new AmbientLight('#cde4d0', 1.7);
  private readonly sunLight = new DirectionalLight('#fff0c4', 2.8);
  private isDisposed = false;
  private qualityMode: 'low' | 'standard' = 'standard';
  private bossChapterId: M1RunSnapshot['chapterId'] = 'ch01_meadow';
  private themedChapterId: M1RunSnapshot['chapterId'] | undefined;
  private lastSimulationKey: string | undefined;

  public constructor(private readonly container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(new Color('#173b3a'));
    this.container.append(this.renderer.domElement);
    // The box is a simulation hitbox only. Rendering it underneath the GLTF
    // avatar can create coplanar depth noise that looks like clothing flicker.
    this.playerMesh.visible = false;
    this.updateCamera(0);
    // The collision box is simulation-only; keep it out of the render tree so
    // a legacy avatar mesh can never reappear above the current archer model.
    this.scene.add(this.playerModelAnchor);
    this.scene.add(this.bossMesh);
    this.scene.add(this.bossTelegraphRing);
    this.sunLight.position.set(-4, 9, -2);
    this.scene.add(this.ambientLight, this.sunLight, this.sceneryGroup, this.viaductSceneryGroup, this.forgeSceneryGroup, this.canopySceneryGroup, this.archiveSceneryGroup, this.horizonSceneryGroup);
    this.createRoad();
    this.loadPolyhavenScenery();
    this.loadPolyhavenViaductScenery();
    this.loadPolyhavenBossModel();
    this.loadPolyhavenCh02BossModel();
    this.loadPolyhavenBuffModel();
    this.loadPolyhavenPickupModel();
    this.loadPlayerModel();
    this.loadQuaterniusRoadModel();
    this.loadPolyhavenViaductProps();
    this.loadPolyhavenCh02EnemyModels();
    this.loadPolyhavenForgeModels();
    this.loadPolyhavenCanopyModels();
    this.loadPolyhavenArchiveModels();
    this.loadPolyhavenHorizonModels();
    this.bossMesh.visible = false;
    this.bossTelegraphRing.visible = false;
    this.resize();
  }

  public setQuality(mode: 'low' | 'standard'): void {
    this.qualityMode = mode;
    this.lastSimulationKey = undefined;
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
    this.playerModelAnchor.position.set(snapshot.player.x, 0.6, 0);
    const simulationKey = `${snapshot.chapterId}|${snapshot.phase}|${snapshot.elapsedSeconds}|${snapshot.distanceMeters}|${snapshot.player.x}|${snapshot.wavesCompleted}|${snapshot.bossWarningSeconds}|${snapshot.boss?.z ?? ''}|${snapshot.boss?.hp ?? ''}`;
    const simulationChanged = simulationKey !== this.lastSimulationKey;
    this.lastSimulationKey = simulationKey;
    if (simulationChanged) {
      this.syncScenery(snapshot);
      this.syncGates(snapshot);
      this.syncEnemies(snapshot);
      this.syncEnemyProjectiles(snapshot);
      this.syncArrows(snapshot);
      this.syncHits(snapshot);
      this.syncPickups(snapshot);
    }
    this.syncLightning(snapshot);
    this.syncBoss(snapshot);
  }

  private syncChapterTheme(chapterId: M1RunSnapshot['chapterId']): void {
    if (this.themedChapterId === chapterId) return;
    this.themedChapterId = chapterId;
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
    this.ambientLight.color.set(chapterId === 'ch05_archive' ? '#b6b5e6' : chapterId === 'ch06_horizon' ? '#cab7ec' : isForge ? '#ffb39a' : isMirrorViaduct ? '#b9d9ff' : '#b5d3bd');
    this.sunLight.color.set(chapterId === 'ch05_archive' ? '#f4d27c' : chapterId === 'ch06_horizon' ? '#f5e7ad' : isForge ? '#ff8e63' : isMirrorViaduct ? '#c4dcff' : '#fff0c4');
    this.sceneryGroup.visible = chapterId === 'ch01_meadow';
    this.viaductSceneryGroup.visible = chapterId === 'ch02_viaduct';
    this.forgeSceneryGroup.visible = chapterId === 'ch03_forge';
    this.canopySceneryGroup.visible = chapterId === 'ch04_canopy';
    this.archiveSceneryGroup.visible = chapterId === 'ch05_archive';
    this.horizonSceneryGroup.visible = chapterId === 'ch06_horizon';
    for (const road of this.roadMeshes) {
      const ch01Model = road.getObjectByName('ch01-road-model');
      const ch02Model = road.getObjectByName('ch02-road-model');
      const ch03Model = road.getObjectByName('ch03-road-model');
      const ch04Model = road.getObjectByName('ch04-road-model');
      const ch05Model = road.getObjectByName('ch05-road-model');
      const ch06Model = road.getObjectByName('ch06-road-model');
      if (ch01Model !== undefined) ch01Model.visible = chapterId === 'ch01_meadow';
      if (ch02Model !== undefined) ch02Model.visible = chapterId === 'ch02_viaduct';
      if (ch03Model !== undefined) ch03Model.visible = chapterId === 'ch03_forge';
      if (ch04Model !== undefined) ch04Model.visible = chapterId === 'ch04_canopy';
      if (ch05Model !== undefined) ch05Model.visible = chapterId === 'ch05_archive';
      if (ch06Model !== undefined) ch06Model.visible = chapterId === 'ch06_horizon';
      const material = road.material as MeshBasicMaterial;
      material.colorWrite = chapterId !== 'ch01_meadow' && chapterId !== 'ch02_viaduct' && chapterId !== 'ch03_forge' && chapterId !== 'ch04_canopy' && chapterId !== 'ch05_archive' && chapterId !== 'ch06_horizon';
      material.depthWrite = material.colorWrite;
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.isDisposed = true;
    this.playerMesh.geometry.dispose();
    this.playerMesh.material.dispose();
    this.playerModelAnchor.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
    });
    this.disposeMesh(this.bossMesh);
    this.disposeMesh(this.bossTelegraphRing);
    this.roadGeometry.dispose();
    this.roadMaterials.forEach((material) => material.dispose());
    for (const mesh of this.enemyMeshes.values()) this.disposeMesh(mesh);
    for (const pool of this.enemyMeshPools.values()) for (const mesh of pool) this.disposeMesh(mesh);
    for (const mesh of this.arrowMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.arrowMeshPool) this.disposeMesh(mesh);
    for (const mesh of this.enemyProjectileMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.hitMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.pickupMeshes.values()) this.disposeMesh(mesh);
    for (const pool of this.transientMeshPools.values()) for (const mesh of pool) this.disposeMesh(mesh);
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
    this.forgeSceneryGroup.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
    });
    this.canopySceneryGroup.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
    });
    this.archiveSceneryGroup.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
    });
    this.horizonSceneryGroup.traverse((child) => {
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
      for (const road of this.roadMeshes) {
        this.attachCh01RoadModel(road);
        this.attachCh02RoadModel(road);
        this.attachCh03RoadModel(road);
        this.attachCh04RoadModel(road);
        this.attachCh05RoadModel(road);
        this.attachCh06RoadModel(road);
      }
    });
  }

  private attachCh01RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch01-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch01-road-model';
    model.scale.set(11, 0.16, 7);
    model.position.y = -0.16;
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

  private attachCh02RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch02-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch02-road-model';
    model.scale.set(11, 0.16, 7);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#274b7a');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private attachCh03RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch03-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch03-road-model';
    model.scale.set(11, 0.16, 7);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#4b2425');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private attachCh04RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch04-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch04-road-model';
    model.scale.set(11, 0.16, 7);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#28604f');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private attachCh05RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch05-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch05-road-model';
    model.scale.set(11, 0.16, 7);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#1f2b5c');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private attachCh06RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch06-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch06-road-model';
    model.scale.set(11, 0.16, 7);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#594178');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
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
    const loader = new GLTFLoader();
    void fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.arrayBuffer();
      })
      .then((source) => new Promise<Group>((resolve, reject) => {
        loader.parse(source, resourcePath, (gltf) => resolve(gltf.scene), reject);
      }))
      .then((scene) => {
        if (!this.isDisposed) {
          onLoad(scene);
          this.lastSimulationKey = undefined;
        }
      })
      .catch((error: unknown) => console.warn(`${label} 載入失敗。`, error));
  }

  private loadPlayerModel(): void {
    this.loadGltf(POLY_PIZZA_ARCHER_URL, 'Poly Pizza Archer', (scene) => {
      this.playerModelTemplate = scene;
      this.attachPlayerModel();
    });
  }

  private attachPlayerModel(): void {
    if (this.playerModelTemplate === undefined) return;
    // A hot reload or a repeated asset callback can leave a previous player
    // visual on the anchor. Always replace the anchor contents before
    // attaching the single current archer instance so no legacy head/body can
    // remain visible.
    for (const child of [...this.playerModelAnchor.children]) child.removeFromParent();
    this.playerMesh.clear();
    const model = this.playerModelTemplate.clone(true);
    model.name = 'player-model';
    model.scale.setScalar(0.2);
    model.position.set(0, -0.62, 0);
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const stabilizeMaterial = (source: MeshBasicMaterial): MeshBasicMaterial => {
        const material = source.clone();
        // Keep the avatar opaque and deterministic when several clothing shells
        // share a nearly identical surface in the source GLTF.
        material.depthWrite = false;
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = -1;
        return material;
      };
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => stabilizeMaterial(material as MeshBasicMaterial))
        : stabilizeMaterial(child.material as MeshBasicMaterial);
      child.renderOrder = 10;
    });
    this.playerModelAnchor.add(model);
    const material = this.playerMesh.material as MeshBasicMaterial;
    material.colorWrite = false;
    material.depthWrite = false;
  }

  private attachEnemyModel(anchor: Mesh, kind: 'melee' | 'ranged', chapterId: ChapterId): void {
    const template = chapterId === 'ch02_viaduct'
      ? (kind === 'melee' ? this.ch02MeleeModelTemplate : this.ch02RangedModelTemplate)
      : chapterId === 'ch03_forge'
        ? (kind === 'melee' ? this.ch03MeleeModelTemplate : this.ch03RangedModelTemplate)
        : chapterId === 'ch04_canopy'
          ? (kind === 'melee' ? this.ch04MeleeModelTemplate : this.ch04RangedModelTemplate)
        : chapterId === 'ch05_archive'
            ? (kind === 'melee' ? this.ch05MeleeModelTemplate : this.ch05RangedModelTemplate)
            : chapterId === 'ch06_horizon'
              ? (kind === 'melee' ? this.ch06MeleeModelTemplate : this.ch06RangedModelTemplate)
      : undefined;
    if (template === undefined || anchor.getObjectByName('enemy-model') !== undefined) return;
    const model = template.clone(true);
    model.name = 'enemy-model';
    model.scale.setScalar(chapterId === 'ch02_viaduct' ? (kind === 'ranged' ? 0.68 : 0.82) : chapterId === 'ch03_forge' ? (kind === 'ranged' ? 0.72 : 0.94) : chapterId === 'ch04_canopy' ? (kind === 'ranged' ? 0.52 : 0.9) : chapterId === 'ch05_archive' ? (kind === 'ranged' ? 0.72 : 1.2) : chapterId === 'ch06_horizon' ? (kind === 'ranged' ? 0.68 : 0.85) : kind === 'ranged' ? 0.86 : 0.96);
    model.position.set(0, chapterId === 'ch02_viaduct' || chapterId === 'ch03_forge' || chapterId === 'ch04_canopy' || chapterId === 'ch05_archive' || chapterId === 'ch06_horizon' ? -0.67 : -0.55, 0);
    model.rotation.y = chapterId === 'ch02_viaduct' ? (kind === 'ranged' ? Math.PI : Math.PI / 2) : chapterId === 'ch03_forge' ? (kind === 'ranged' ? Math.PI / 2 : 0) : chapterId === 'ch04_canopy' ? (kind === 'ranged' ? Math.PI : 0) : chapterId === 'ch05_archive' ? (kind === 'ranged' ? Math.PI / 2 : Math.PI) : chapterId === 'ch06_horizon' ? Math.PI / 2 : kind === 'ranged' ? Math.PI : 0;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        // Cloned GLTF nodes share this immutable-by-kind material; cloning a
        // material for every enemy needlessly increases GPU state changes.
        const material = child.material as MeshBasicMaterial;
        const tint = chapterId === 'ch02_viaduct' ? (kind === 'ranged' ? '#8cd7ff' : '#4d8ee8') : chapterId === 'ch03_forge' ? (kind === 'ranged' ? '#ff8b48' : '#b84d32') : chapterId === 'ch04_canopy' ? (kind === 'ranged' ? '#7ae8d0' : '#4a9e72') : chapterId === 'ch05_archive' ? (kind === 'ranged' ? '#f1cf71' : '#9f94d5') : chapterId === 'ch06_horizon' ? (kind === 'ranged' ? '#fff0a5' : '#b58bff') : kind === 'ranged' ? '#a986ef' : '#f06b5e';
        if (chapterId === 'ch02_viaduct' || chapterId === 'ch03_forge' || chapterId === 'ch04_canopy' || chapterId === 'ch05_archive' || chapterId === 'ch06_horizon') {
          material.map = null;
          material.vertexColors = false;
          if (material.color !== undefined) material.color.set(tint);
        } else if (material.color !== undefined) material.color.lerp(new Color(tint), 0.22);
        child.material = material;
      }
    });
    anchor.add(model);
    // Enemy materials already carry the chapter tint and use MeshBasicMaterial;
    // per-enemy PointLights only add draw overhead without changing the result.
    const material = anchor.material as MeshBasicMaterial;
    material.colorWrite = false;
    material.depthWrite = false;
  }

  private loadPolyhavenViaductScenery(): void {
    this.loadGltf(POLYHAVEN_STREET_LAMP_URL, 'Poly Haven Street Lamp 01', (scene) => {
      const placements: ReadonlyArray<readonly [number, number, number]> = [
        [-5.1, 12, Math.PI / 2], [5.1, 26, -Math.PI / 2], [-5.1, 40, Math.PI / 2], [5.1, 54, -Math.PI / 2],
      ];
      for (const [x, z, rotationY] of placements) {
        const lamp = scene.clone(true);
        lamp.position.set(x, 0, z);
        lamp.rotation.y = rotationY;
        lamp.scale.setScalar(0.75);
        lamp.userData.worldZ = z;
        lamp.userData.sceneryIndex = this.viaductSceneryGroup.children.length;
        const glow = new PointLight('#9dc9ff', 1.5, 9, 2);
        glow.position.set(0, 3.2, 0);
        lamp.add(glow);
        this.viaductSceneryGroup.add(lamp);
      }
    });
  }

  private loadPolyhavenViaductProps(): void {
    this.loadGltf(POLYHAVEN_POWER_BOX_URL, 'Poly Haven Power Box 01', (scene) => {
      const placements: ReadonlyArray<readonly [number, number, number]> = [
        [5.4, 18, -Math.PI / 2], [-5.4, 34, Math.PI / 2], [5.4, 50, -Math.PI / 2],
      ];
      for (const [x, z, rotationY] of placements) {
        const prop = scene.clone(true);
        prop.name = 'viaduct-power-box';
        prop.position.set(x, 0.18, z);
        prop.rotation.y = rotationY;
        prop.scale.setScalar(2.2);
        prop.userData.worldZ = z;
        prop.userData.sceneryIndex = this.viaductSceneryGroup.children.length;
        const glow = new PointLight('#4fa9ff', 1.4, 7, 2);
        glow.position.set(0, 0.5, 0);
        prop.add(glow);
        this.viaductSceneryGroup.add(prop);
      }
    });
  }

  private loadPolyhavenBossModel(): void {
    this.loadGltf(POLYHAVEN_GOTHIC_STATUE_URL, 'Poly Haven Gothic Statue', (scene) => {
      this.bossModelTemplate = scene;
      this.syncChapterBossModel(this.bossChapterId);
    });
  }

  private loadPolyhavenCh02BossModel(): void {
    this.loadGltf(POLYHAVEN_DRILL_PRESS_URL, 'Poly Haven Drill Press 01', (scene) => {
      this.ch02BossModelTemplate = scene;
      this.syncChapterBossModel(this.bossChapterId);
    });
  }

  private loadPolyhavenCh02EnemyModels(): void {
    this.loadGltf(POLYHAVEN_AMMO_BOX_URL, 'Poly Haven Ammo Box', (scene) => {
      this.ch02MeleeModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch02_viaduct' && enemy.userData.kind === 'melee') {
          enemy.getObjectByName('enemy-model')?.removeFromParent();
          this.attachEnemyModel(enemy, 'melee', 'ch02_viaduct');
        }
      }
    });
    this.loadGltf(POLYHAVEN_CANNON_URL, 'Poly Haven Cannon 01', (scene) => {
      this.ch02RangedModelTemplate = scene;
      const cannonBall = scene.getObjectByName('cannon_01_ball_01');
      if (cannonBall !== undefined) {
        this.cannonBallModelTemplate = new Group();
        const ball = cannonBall.clone(true);
        ball.position.set(0, 0, 0);
        ball.rotation.set(0, 0, 0);
        this.cannonBallModelTemplate.add(ball);
        for (const arrow of this.arrowMeshes.values()) {
          if (arrow.userData.weapon === 'cannon') this.configureArrowMesh(arrow, 'cannon');
        }
      }
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch02_viaduct' && enemy.userData.kind === 'ranged') {
          enemy.getObjectByName('enemy-model')?.removeFromParent();
          this.attachEnemyModel(enemy, 'ranged', 'ch02_viaduct');
        }
      }
    });
  }

  private loadPolyhavenForgeModels(): void {
    this.loadGltf(POLYHAVEN_BARREL_URL, 'Poly Haven Barrel 01', (scene) => {
      this.ch03MeleeModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch03_forge' && enemy.userData.kind === 'melee') {
          enemy.getObjectByName('enemy-model')?.removeFromParent();
          this.attachEnemyModel(enemy, 'melee', 'ch03_forge');
        }
      }
      const placements: ReadonlyArray<readonly [number, number, number]> = [[-5.4, 16, 0.2], [5.4, 44, -0.4], [-5.5, 62, 0.7]];
      for (const [x, z, rotationY] of placements) {
        const barrel = scene.clone(true);
        barrel.position.set(x, 0.12, z);
        barrel.rotation.y = rotationY;
        barrel.scale.setScalar(1.35);
        barrel.userData.worldZ = z;
        barrel.userData.sceneryIndex = this.forgeSceneryGroup.children.length;
        const glow = new PointLight('#ff6a2f', 1.1, 6, 2);
        glow.position.set(0, 0.65, 0);
        barrel.add(glow);
        this.forgeSceneryGroup.add(barrel);
      }
    });
    this.loadGltf(POLYHAVEN_CANNON_URL, 'Poly Haven Cannon 01 (forge)', (scene) => {
      this.ch03RangedModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch03_forge' && enemy.userData.kind === 'ranged') {
          enemy.getObjectByName('enemy-model')?.removeFromParent();
          this.attachEnemyModel(enemy, 'ranged', 'ch03_forge');
        }
      }
    });
    this.loadGltf(POLYHAVEN_BARREL_STOVE_URL, 'Poly Haven Barrel Stove', (scene) => {
      this.ch03BossModelTemplate = scene;
      this.syncChapterBossModel(this.bossChapterId);
    });
    this.loadGltf(POLYHAVEN_INDUSTRIAL_PIPES_URL, 'Poly Haven Modular Industrial Pipes 01', (scene) => {
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[5.9, 10, -Math.PI / 2, 1.2], [-5.9, 30, Math.PI / 2, 1.05], [5.9, 52, -Math.PI / 2, 1.2]];
      for (const [x, z, rotationY, scale] of placements) {
        const pipes = scene.clone(true);
        pipes.position.set(x, 0, z);
        pipes.rotation.y = rotationY;
        pipes.scale.setScalar(scale);
        pipes.userData.worldZ = z;
        pipes.userData.sceneryIndex = this.forgeSceneryGroup.children.length;
        const glow = new PointLight('#f26a30', 1.25, 8, 2);
        glow.position.set(0, 1.1, 0);
        pipes.add(glow);
        this.forgeSceneryGroup.add(pipes);
      }
    });
  }

  private loadPolyhavenCanopyModels(): void {
    this.loadGltf(POLYHAVEN_TREE_STUMP_URL, 'Poly Haven Tree Stump 01', (scene) => {
      this.ch04MeleeModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch04_canopy' && enemy.userData.kind === 'melee') this.attachEnemyModel(enemy, 'melee', 'ch04_canopy');
      }
    });
    this.loadGltf(POLYHAVEN_FIR_SAPLING_URL, 'Poly Haven Fir Sapling', (scene) => {
      this.ch04RangedModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch04_canopy' && enemy.userData.kind === 'ranged') this.attachEnemyModel(enemy, 'ranged', 'ch04_canopy');
      }
    });
    this.loadGltf(POLYHAVEN_ROOT_CLUSTER_URL, 'Poly Haven Root Cluster 01', (scene) => {
      this.ch04BossModelTemplate = scene;
      this.syncChapterBossModel(this.bossChapterId);
    });
    this.loadGltf(POLYHAVEN_TREE_SMALL_URL, 'Poly Haven Tree Small 02', (scene) => {
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[-6.2, 12, 0.2, 1.1], [6.2, 38, -0.35, 0.9], [-6.2, 60, 0.4, 1.15]];
      for (const [x, z, rotationY, scale] of placements) {
        const tree = scene.clone(true);
        tree.position.set(x, 0, z);
        tree.rotation.y = rotationY;
        tree.scale.setScalar(scale);
        tree.userData.worldZ = z;
        tree.userData.sceneryIndex = this.canopySceneryGroup.children.length;
        const glow = new PointLight('#6fe3c2', 1.1, 8, 2);
        glow.position.set(0, 2.2, 0);
        tree.add(glow);
        this.canopySceneryGroup.add(tree);
      }
    });
    this.loadGltf(POLYHAVEN_PINE_ROOTS_URL, 'Poly Haven Pine Roots', (scene) => {
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[5.3, 22, -Math.PI / 2, 1.3], [-5.4, 48, Math.PI / 2, 1.15], [5.2, 70, -Math.PI / 2, 1.25]];
      for (const [x, z, rotationY, scale] of placements) {
        const roots = scene.clone(true);
        roots.position.set(x, 0, z);
        roots.rotation.y = rotationY;
        roots.scale.setScalar(scale);
        roots.userData.worldZ = z;
        roots.userData.sceneryIndex = this.canopySceneryGroup.children.length;
        const glow = new PointLight('#4cb996', 0.9, 7, 2);
        glow.position.set(0, 0.7, 0);
        roots.add(glow);
        this.canopySceneryGroup.add(roots);
      }
    });
  }

  private loadPolyhavenArchiveModels(): void {
    this.loadGltf(POLYHAVEN_SCHOOL_DESK_URL, 'Poly Haven School Desk 01', (scene) => {
      this.ch05MeleeModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch05_archive' && enemy.userData.kind === 'melee') {
          enemy.getObjectByName('enemy-model')?.removeFromParent();
          this.attachEnemyModel(enemy, 'melee', 'ch05_archive');
        }
      }
    });
    this.loadGltf(POLYHAVEN_CANNON_URL, 'Poly Haven Cannon 01 (archive)', (scene) => {
      this.ch05RangedModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch05_archive' && enemy.userData.kind === 'ranged') {
          enemy.getObjectByName('enemy-model')?.removeFromParent();
          this.attachEnemyModel(enemy, 'ranged', 'ch05_archive');
        }
      }
    });
    this.loadGltf(POLYHAVEN_MARBLE_BUST_URL, 'Poly Haven Marble Bust 01', (scene) => {
      this.ch05BossModelTemplate = scene;
      this.syncChapterBossModel(this.bossChapterId);
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[-5.6, 21, 0.35, 1.35], [5.6, 51, -0.4, 1.2]];
      for (const [x, z, rotationY, scale] of placements) {
        const bust = scene.clone(true);
        bust.position.set(x, 0, z);
        bust.rotation.y = rotationY;
        bust.scale.setScalar(scale);
        bust.userData.worldZ = z;
        bust.userData.sceneryIndex = this.archiveSceneryGroup.children.length;
        const glow = new PointLight('#e8c96f', 1.25, 7, 2);
        glow.position.set(0, 1.05, 0);
        bust.add(glow);
        this.archiveSceneryGroup.add(bust);
      }
    });
    this.loadGltf(POLYHAVEN_SHELF_URL, 'Poly Haven Shelf 01', (scene) => {
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[-5.6, 10, Math.PI / 2, 1.45], [5.6, 35, -Math.PI / 2, 1.25], [-5.6, 64, Math.PI / 2, 1.4]];
      for (const [x, z, rotationY, scale] of placements) {
        const shelf = scene.clone(true);
        shelf.position.set(x, 0, z);
        shelf.rotation.y = rotationY;
        shelf.scale.setScalar(scale);
        shelf.userData.worldZ = z;
        shelf.userData.sceneryIndex = this.archiveSceneryGroup.children.length;
        const glow = new PointLight('#e2c36a', 1.1, 7, 2);
        glow.position.set(0, 1.5, 0);
        shelf.add(glow);
        this.archiveSceneryGroup.add(shelf);
      }
    });
  }

  private loadPolyhavenHorizonModels(): void {
    this.loadGltf(POLYHAVEN_AMMO_BOX_URL, 'Poly Haven Ammo Box (horizon)', (scene) => {
      this.ch06MeleeModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch06_horizon' && enemy.userData.kind === 'melee') this.attachEnemyModel(enemy, 'melee', 'ch06_horizon');
      }
    });
    this.loadGltf(POLYHAVEN_CANNON_URL, 'Poly Haven Cannon (horizon)', (scene) => {
      this.ch06RangedModelTemplate = scene;
      for (const enemy of this.enemyMeshes.values()) {
        if (enemy.userData.chapterId === 'ch06_horizon' && enemy.userData.kind === 'ranged') this.attachEnemyModel(enemy, 'ranged', 'ch06_horizon');
      }
    });
    this.loadGltf(POLYHAVEN_VINTAGE_RADIO_URL, 'Poly Haven Vintage Radio Transceiver (horizon)', (scene) => {
      this.ch06BossModelTemplate = scene;
      this.syncChapterBossModel(this.bossChapterId);
    });
    this.loadGltf(POLYHAVEN_INDUSTRIAL_PIPES_URL, 'Poly Haven Industrial Pipes (horizon)', (scene) => {
      for (const [x, z, rotationY] of [[-5.8, 14, Math.PI / 2], [5.8, 42, -Math.PI / 2], [-5.8, 68, Math.PI / 2]] as const) {
        const prop = scene.clone(true);
        prop.position.set(x, 0, z);
        prop.rotation.y = rotationY;
        prop.scale.setScalar(1.15);
        prop.userData.worldZ = z;
        prop.userData.sceneryIndex = this.horizonSceneryGroup.children.length;
        const glow = new PointLight('#e7d1ff', 1.25, 8, 2);
        glow.position.set(0, 1, 0);
        prop.add(glow);
        this.horizonSceneryGroup.add(prop);
      }
    });
  }

  private loadPolyhavenBuffModel(): void {
    this.loadGltf(POLYHAVEN_BUFF_LANTERN_URL, 'Poly Haven Lantern 01', (scene) => {
      this.buffModelTemplate = scene;
      for (const group of this.gateGroups.values()) {
        for (const anchor of group.children.filter((child): child is Mesh => child.name === 'buff-anchor')) this.attachBuffModel(anchor, anchor.userData.color as string, 5);
      }
    });
  }

  private loadPolyhavenPickupModel(): void {
    this.loadGltf(POLYHAVEN_PICKUP_CHEST_URL, 'Poly Haven Treasure Chest', (scene) => {
      this.pickupModelTemplate = scene;
      for (const pickup of this.pickupMeshes.values()) this.attachPickupModel(pickup, '#71e6d1', 1.8);
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

  private attachPickupModel(anchor: Mesh, color: string, scale: number): void {
    if (this.pickupModelTemplate === undefined || anchor.userData.pickupModelAttached === true) return;
    const model = this.pickupModelTemplate.clone(true);
    model.name = 'pickup-model';
    model.scale.setScalar(scale);
    model.position.set(0, -0.32, 0.02);
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        if (material.color !== undefined) material.color.lerp(new Color(color), 0.08);
        child.material = material;
      }
    });
    const glow = new PointLight(color, 0.75, 3.5, 2);
    glow.position.set(0, 0.25, 0);
    model.add(glow);
    const anchorMaterial = anchor.material as MeshBasicMaterial;
    anchorMaterial.colorWrite = false;
    anchorMaterial.depthWrite = false;
    anchor.add(model);
    anchor.userData.pickupModelAttached = true;
  }

  private syncChapterBossModel(chapterId: M1RunSnapshot['chapterId']): void {
    const template = chapterId === 'ch01_meadow' ? this.bossModelTemplate : chapterId === 'ch02_viaduct' ? this.ch02BossModelTemplate : chapterId === 'ch03_forge' ? this.ch03BossModelTemplate : chapterId === 'ch04_canopy' ? this.ch04BossModelTemplate : chapterId === 'ch05_archive' ? this.ch05BossModelTemplate : chapterId === 'ch06_horizon' ? this.ch06BossModelTemplate : undefined;
    const expectedName = `chapter-boss-model:${chapterId}`;
    for (const child of [...this.bossMesh.children]) {
      if (child.name.startsWith('chapter-boss-model:') && child.name !== expectedName) this.bossMesh.remove(child);
    }
    const existingModel = this.bossMesh.getObjectByName(expectedName);
    if (template === undefined) {
      if (existingModel !== undefined) this.bossMesh.remove(existingModel);
      this.bossMesh.userData.chapterBossAttached = false;
      const material = this.bossMesh.material as MeshBasicMaterial;
      material.colorWrite = true;
      material.depthWrite = true;
      return;
    }
    if (existingModel !== undefined) return;
    const model = template.clone(true);
    model.name = expectedName;
    if (chapterId === 'ch02_viaduct') model.scale.set(14, 6, 14);
    else if (chapterId === 'ch03_forge') model.scale.setScalar(1.8);
    else if (chapterId === 'ch04_canopy') model.scale.setScalar(1.65);
    else if (chapterId === 'ch05_archive') model.scale.setScalar(11);
    else if (chapterId === 'ch06_horizon') model.scale.setScalar(12);
    else model.scale.setScalar(1.5);
    model.position.set(0, chapterId === 'ch02_viaduct' ? -1.02 : chapterId === 'ch03_forge' ? -1.25 : chapterId === 'ch04_canopy' ? -1.1 : chapterId === 'ch05_archive' ? -0.79 : chapterId === 'ch06_horizon' ? 0.22 : -1.05, 0);
    if (chapterId === 'ch02_viaduct' || chapterId === 'ch03_forge') model.rotation.y = Math.PI;
    if (chapterId === 'ch02_viaduct') {
      model.traverse((child) => {
        if (child instanceof Mesh) {
          const material = (child.material as MeshBasicMaterial).clone();
          material.map = null;
          material.vertexColors = false;
          if (material.color !== undefined) material.color.set('#91c9ff');
          child.material = material;
        }
      });
    }
    if (chapterId === 'ch03_forge') {
      const core = new PointLight('#ff642d', 2.5, 11, 2);
      core.position.set(0, 1.1, 0.2);
      model.add(core);
    }
    if (chapterId === 'ch04_canopy') {
      const core = new PointLight('#70edd0', 2.2, 10, 2);
      core.position.set(0, 1.3, 0);
      model.add(core);
    }
    if (chapterId === 'ch05_archive') {
      const core = new PointLight('#f4d36c', 2.4, 11, 2);
      core.position.set(0, 0.22, 0.03);
      model.add(core);
    }
    if (chapterId === 'ch06_horizon') {
      model.traverse((child) => {
        if (child instanceof Mesh) {
          const material = (child.material as MeshBasicMaterial).clone();
          if (material.color !== undefined) material.color.lerp(new Color('#b58bff'), 0.42);
          child.material = material;
        }
      });
      const core = new PointLight('#fff0a5', 2.6, 12, 2);
      core.position.set(0, 0.08, 0.12);
      model.add(core);
    }
    this.bossMesh.add(model);
    const material = this.bossMesh.material as MeshBasicMaterial;
    material.colorWrite = false;
    material.depthWrite = false;
    this.bossMesh.userData.chapterBossAttached = true;
  }

  private syncScenery(snapshot: M1RunSnapshot): void {
    for (const group of [this.sceneryGroup, this.viaductSceneryGroup, this.forgeSceneryGroup, this.canopySceneryGroup, this.archiveSceneryGroup, this.horizonSceneryGroup]) {
      for (const prop of group.children) {
        const worldZ = prop.userData.worldZ as number | undefined;
        const index = prop.userData.sceneryIndex as number | undefined;
        if (worldZ === undefined || index === undefined) continue;
        const relativeZ = worldZ - snapshot.distanceMeters;
        prop.position.z = relativeZ;
        prop.visible = relativeZ > -8 && relativeZ < 64 && (this.qualityMode === 'standard' || index < 2);
      }
    }
  }

  private updateCamera(playerX: number): void {
    // Keep a stable world-space frame so lateral input visibly moves the avatar
    // instead of the camera cancelling the movement on screen.
    void playerX;
    this.camera.position.set(0, 7, -6);
    this.camera.lookAt(0, 0, 6);
  }

  private syncBoss(snapshot: M1RunSnapshot): void {
    const boss = snapshot.boss;
    this.bossMesh.visible = boss !== undefined && !boss.isDefeated;
    this.bossTelegraphRing.visible = false;
    if (boss === undefined || boss.isDefeated) return;
    this.bossMesh.position.set(0, 1.1, boss.z);
    const material = this.bossMesh.material as MeshBasicMaterial;
    const baseColor = snapshot.chapterId === 'ch02_viaduct' ? '#7fa8ef' : snapshot.chapterId === 'ch03_forge' ? '#dc7449' : snapshot.chapterId === 'ch04_canopy' ? '#62b78c' : snapshot.chapterId === 'ch05_archive' ? '#d8b765' : '#6ea65a';
    material.color.set(boss.telegraphSeconds > 0 ? '#f4c95d' : boss.phase === 2 ? '#b7774f' : baseColor);
    const baseScale = snapshot.chapterId === 'ch02_viaduct' ? 1.05 : snapshot.chapterId === 'ch03_forge' ? 1.1 : snapshot.chapterId === 'ch05_archive' ? 1.12 : 1;
    const isAttackTelegraph = boss.telegraphSeconds > 0 && boss.telegraphText !== '靜滯正在加深！';
    const pulse = isAttackTelegraph ? 1 + Math.sin(performance.now() / 70) * 0.12 : 1;
    this.bossMesh.scale.setScalar(baseScale * pulse);
    this.bossMesh.rotation.y = 0;
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
      const signature = `${gate.leftBuffId}:${gate.centerBuffId ?? ''}:${gate.rightBuffId}`;
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
        const center = gate.centerBuffId === undefined ? undefined : this.createGateBuffAnchor('#f4c95d');
        const right = this.createGateBuffAnchor('#8ccf9b');
        const gateX = center === undefined ? [-2.5, 2.5] : [-3, 0, 3];
        left.position.x = gateX[0]!;
        right.position.x = center === undefined ? gateX[1]! : gateX[2]!;
        group.add(left, right, this.createGateLabel(gate.leftBuffId, gate.leftLabel, '#5bb5d8', left.position.x, gate.groupId === 'g01'), this.createGateLabel(gate.rightBuffId, gate.rightLabel, '#8ccf9b', right.position.x, gate.groupId === 'g01'));
        if (center !== undefined && gate.centerBuffId !== undefined && gate.centerLabel !== undefined) {
          center.position.x = gateX[1]!;
          group.add(center, this.createGateLabel(gate.centerBuffId, gate.centerLabel, '#f4c95d', center.position.x, gate.groupId === 'g01'));
        }
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
        mesh.visible = false;
        this.enemyMeshes.delete(id);
        const poolKey = `${mesh.userData.chapterId as string}:${mesh.userData.kind as string}`;
        const pool = this.enemyMeshPools.get(poolKey) ?? [];
        pool.push(mesh);
        this.enemyMeshPools.set(poolKey, pool);
      }
    }
    for (const enemy of snapshot.enemies) {
      let mesh = this.enemyMeshes.get(enemy.id);
      if (mesh !== undefined && mesh.userData.chapterId !== snapshot.chapterId) {
        this.scene.remove(mesh);
        mesh.visible = false;
        this.enemyMeshes.delete(enemy.id);
        const poolKey = `${mesh.userData.chapterId as string}:${mesh.userData.kind as string}`;
        const pool = this.enemyMeshPools.get(poolKey) ?? [];
        pool.push(mesh);
        this.enemyMeshPools.set(poolKey, pool);
        mesh = undefined;
      }
      if (mesh === undefined) {
        mesh = this.createEnemyMesh(enemy.kind, snapshot.chapterId);
        this.enemyMeshes.set(enemy.id, mesh);
        this.scene.add(mesh);
      }
      const deathProgress = enemy.deathSeconds / 0.45;
      const scale = enemy.deathSeconds > 0 ? 0.35 + deathProgress * 0.65 : enemy.telegraphSeconds > 0 ? 1.25 : 1;
      mesh.position.set(enemy.x, 0.55 - (1 - deathProgress) * 0.35, enemy.z);
      mesh.scale.setScalar(scale);
      const healthFill = mesh.getObjectByName('health-fill') as Mesh | undefined;
      if (healthFill !== undefined) healthFill.scale.x = Math.max(0, enemy.hp / (enemy.kind === 'melee' ? 8 : 12));
    }
  }

  private createEnemyMesh(kind: 'melee' | 'ranged', chapterId: ChapterId): Mesh {
    const poolKey = `${chapterId}:${kind}`;
    const pool = this.enemyMeshPools.get(poolKey);
    const pooledMesh = pool?.pop();
    if (pooledMesh !== undefined) {
      pooledMesh.visible = true;
      return pooledMesh;
    }
    const geometry = kind === 'melee' ? new ConeGeometry(0.72, 1.45, 4) : new SphereGeometry(0.72, 10, 8);
    const mesh = new Mesh(geometry, ENEMY_MATERIALS[kind]);
    mesh.userData.kind = kind;
    mesh.userData.chapterId = chapterId;
    const label = this.createEnemyLabel(chapterId === 'ch02_viaduct' ? (kind === 'melee' ? '磁軌獵犬' : '鏡翼炮台') : chapterId === 'ch03_forge' ? (kind === 'melee' ? '熔殼步兵' : '炭火投擲者') : chapterId === 'ch04_canopy' ? (kind === 'melee' ? '孢囊衝撞獸' : '飛芽施法體') : chapterId === 'ch05_archive' ? (kind === 'melee' ? '抄錄傀儡' : '浮頁施法體') : kind === 'melee' ? '衝鋒獸' : '芽砲手');
    label.position.set(0, 1.1, 0);
    const healthBackground = new Mesh(new BoxGeometry(1.15, 0.12, 0.06), new MeshBasicMaterial({ color: '#321d25' }));
    healthBackground.name = 'health-background';
    healthBackground.position.set(0, 1.31, 0);
    const healthFill = new Mesh(new BoxGeometry(1.07, 0.08, 0.07), new MeshBasicMaterial({ color: '#84e38a' }));
    healthFill.name = 'health-fill';
    healthFill.position.set(0, 1.31, -0.04);
    mesh.add(label, healthBackground, healthFill);
    this.attachEnemyModel(mesh, kind, chapterId);
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
        mesh.visible = false;
        this.arrowMeshes.delete(id);
        this.arrowMeshPool.push(mesh);
      }
    }
    for (const arrow of snapshot.arrows) {
      let mesh = this.arrowMeshes.get(arrow.id);
      if (mesh === undefined) {
        mesh = this.arrowMeshPool.pop() ?? new Mesh(new BoxGeometry(0.05, 0.05, 0.72), new MeshBasicMaterial({ color: '#f4c95d' }));
        this.configureArrowMesh(mesh, arrow.weapon);
        mesh.visible = true;
        this.arrowMeshes.set(arrow.id, mesh);
        this.scene.add(mesh);
      } else if (mesh.userData.weapon !== arrow.weapon) {
        this.configureArrowMesh(mesh, arrow.weapon);
      }
      mesh.position.set(arrow.x, 0.8, arrow.z);
    }
  }

  private syncEnemyProjectiles(snapshot: M1RunSnapshot): void {
    this.syncTransientMeshes(snapshot.enemyProjectiles, this.enemyProjectileMeshes, () => new Mesh(new SphereGeometry(0.16, 8, 8), new MeshBasicMaterial({ color: '#ff8b48' })), (mesh, projectile) => {
      mesh.position.set(projectile.x, 0.72, projectile.z);
      mesh.scale.setScalar(1 + Math.sin(projectile.id) * 0.08);
    });
  }

  private configureArrowMesh(mesh: Mesh, weapon: 'bow' | 'cannon'): void {
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
    else mesh.material.dispose();
    mesh.clear();
    mesh.rotation.set(0, 0, 0);
    mesh.scale.setScalar(1);
    mesh.userData.weapon = weapon;
    if (weapon === 'bow') {
      mesh.geometry = new BoxGeometry(0.05, 0.05, 0.72);
      mesh.material = new MeshBasicMaterial({ color: '#f4c95d' });
      const arrowHead = new Mesh(new ConeGeometry(0.11, 0.26, 6), new MeshBasicMaterial({ color: '#fff4ba' }));
      arrowHead.rotation.x = Math.PI / 2;
      arrowHead.position.z = 0.48;
      mesh.add(arrowHead);
      return;
    }
    mesh.geometry = new SphereGeometry(0.16, 8, 8);
    mesh.material = new MeshBasicMaterial({ color: '#ff795d' });
    if (this.cannonBallModelTemplate !== undefined) {
      const cannonBall = this.cannonBallModelTemplate.clone(true);
      cannonBall.scale.setScalar(0.9);
      mesh.add(cannonBall);
      mesh.visible = true;
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
      mesh.rotation.y = 0;
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
    this.attachPickupModel(mesh, '#71e6d1', 1.8);
    return mesh;
  }

  private createPickupLabel(text: string, buffId: BuffId): Sprite {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 420;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立掉落 Buff 文字貼圖。');
    context.fillStyle = '#102c2a'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#e8fff1'; context.lineWidth = 12; context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    this.drawPickupIcon(context, buffId, canvas.width / 2, 108);
    context.fillStyle = '#f8f7ef'; context.font = '800 128px system-ui, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, canvas.width / 2, 294);
    const label = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), transparent: false }));
    label.userData.text = text; label.userData.buffId = buffId; label.position.set(0, 1.1, 0); label.scale.set(3.25, 1.32, 1);
    return label;
  }

  private drawPickupIcon(context: CanvasRenderingContext2D, buffId: BuffId, x: number, y: number): void {
    const icons: Record<BuffId, readonly [string, string]> = { split_arrow: ['➤', '#f4c95d'], power_shot: ['✦', '#ff9a6b'], swift_shot: ['≫', '#71e6d1'], rapid_fire: ['⚡', '#fff4ba'], piercing_arrow: ['⇥', '#a986ef'], lightning_targets: ['⚡', '#9ee8ff'], lightning_damage: ['✹', '#b3a6ff'], lightning_range: ['⌁', '#71e6d1'], cannon_weapon: ['◉', '#ff9a6b'], cannon_damage: ['✹', '#ff795d'], cannon_radius: ['◎', '#ffb04a'], cannon_fire_rate: ['➶', '#ffd16b'], life_steal: ['♥', '#ff6b9d'], vitality: ['+', '#ff8d9b'], windstep: ['➜', '#83d7ff'], barkskin: ['⬡', '#8fe39a'] };
    const [glyph, color] = icons[buffId];
    context.fillStyle = color; context.beginPath(); context.arc(x, y, 72, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#102c2a'; context.font = '800 104px system-ui, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(glyph, x, y + 4);
  }

  private syncTransientMeshes<T extends { readonly id: number }>(items: readonly T[], meshes: Map<number, Mesh>, create: () => Mesh, update: (mesh: Mesh, item: T) => void): void {
    const pool = this.transientMeshPools.get(meshes) ?? [];
    this.transientMeshPools.set(meshes, pool);
    const activeIds = new Set(items.map((item) => item.id));
    for (const [id, mesh] of meshes) { if (!activeIds.has(id)) { this.scene.remove(mesh); mesh.visible = false; meshes.delete(id); pool.push(mesh); } }
    for (const item of items) { let mesh = meshes.get(item.id); if (mesh === undefined) { mesh = pool.pop() ?? create(); mesh.visible = true; meshes.set(item.id, mesh); this.scene.add(mesh); } update(mesh, item); }
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
