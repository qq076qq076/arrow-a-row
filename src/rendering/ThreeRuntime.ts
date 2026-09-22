import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  CanvasTexture,
  ConeGeometry,
  DirectionalLight,
  FogExp2,
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
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { M1RunSnapshot } from '../domain/M1RunSimulation';
import { getLoopedWorldZ } from '../domain/WorldMotion';
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
const POLYHAVEN_GRASS_MEDIUM_URL = `${import.meta.env.BASE_URL}assets/polyhaven/grass_medium_02/grass_medium_02_1k.gltf`;
const POLYHAVEN_SHRUB_URL = `${import.meta.env.BASE_URL}assets/polyhaven/shrub_02/shrub_02_1k.gltf`;
const POLYHAVEN_AIRDUCT_URL = `${import.meta.env.BASE_URL}assets/polyhaven/modular_airduct_circular_01/modular_airduct_circular_01_1k.gltf`;
const POLYHAVEN_STEEL_SHELVES_URL = `${import.meta.env.BASE_URL}assets/polyhaven/steel_frame_shelves_01/steel_frame_shelves_01_1k.gltf`;
const POLYHAVEN_CRYSTALLINE_ICEPLANT_URL = `${import.meta.env.BASE_URL}assets/polyhaven/crystalline_iceplant/crystalline_iceplant_1k.gltf`;
const SCENERY_LOOP_LENGTH = 72;
const SCENERY_VISIBLE_START_Z = -8;
const SCENERY_VISIBLE_END_Z = 64;
const ROAD_SEGMENT_LENGTH = 7;
const ROAD_LOOP_LENGTH = 24 * ROAD_SEGMENT_LENGTH;
const ROAD_LOOP_START_Z = -ROAD_SEGMENT_LENGTH / 2;

type BackdropStyle = 'meadow' | 'viaduct' | 'forge' | 'canopy' | 'archive' | 'horizon';

interface AtmospherePalette {
  readonly skyTop: string;
  readonly skyHorizon: string;
  readonly skyLow: string;
  readonly fog: string;
  readonly ground: string;
  readonly ridge: string;
  readonly ridgeFar: string;
  readonly glow: string;
  readonly mote: string;
}

const ATMOSPHERE_PALETTES: Record<BackdropStyle, AtmospherePalette> = {
  meadow: { skyTop: '#173b46', skyHorizon: '#75a994', skyLow: '#e4c878', fog: '#789786', ground: '#355846', ridge: '#3f6949', ridgeFar: '#6c8d5c', glow: '#ffd47a', mote: '#f7df83' },
  viaduct: { skyTop: '#0c1735', skyHorizon: '#416c9c', skyLow: '#9fcbe1', fog: '#567797', ground: '#111d38', ridge: '#203e67', ridgeFar: '#3f6387', glow: '#b8e7ff', mote: '#85d8ff' },
  forge: { skyTop: '#1e0c21', skyHorizon: '#6d2d35', skyLow: '#e17344', fog: '#6e3d42', ground: '#25121c', ridge: '#4a222c', ridgeFar: '#743529', glow: '#ff8a4a', mote: '#ffb054' },
  canopy: { skyTop: '#0d2928', skyHorizon: '#356f5c', skyLow: '#8fc6a0', fog: '#4f7564', ground: '#142e26', ridge: '#214a38', ridgeFar: '#407658', glow: '#a6f2c8', mote: '#75e6c1' },
  archive: { skyTop: '#070d25', skyHorizon: '#263e6b', skyLow: '#81764f', fog: '#3b4764', ground: '#0d1430', ridge: '#172850', ridgeFar: '#36496c', glow: '#f0d27a', mote: '#f7db7d' },
  horizon: { skyTop: '#18102d', skyHorizon: '#604b82', skyLow: '#c29f78', fog: '#62567c', ground: '#251b3d', ridge: '#432f5e', ridgeFar: '#755b89', glow: '#fff0a8', mote: '#d9baff' },
};

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
  private readonly skyTextures = new Map<BackdropStyle, CanvasTexture>();
  private readonly forgeRoadTextures = new Map<number, CanvasTexture>();
  private readonly canopyRoadTextures = new Map<number, CanvasTexture>();
  private readonly archiveRoadTextures = new Map<number, CanvasTexture>();
  private readonly horizonRoadTextures = new Map<number, CanvasTexture>();
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
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.setClearColor(new Color('#173b3a'));
    this.scene.fog = new FogExp2('#789786', 0.012);
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
    this.createAtmosphericStages();
    this.createDenseChapterBackdrops();
    this.createViaductSetPieces();
    this.createForgeSetPieces();
    this.createCanopySetPieces();
    this.createArchiveSetPieces();
    this.createHorizonSetPieces();
    this.loadPolyhavenScenery();
    this.loadPolyhavenViaductScenery();
    this.loadPolyhavenBossModel();
    this.loadPolyhavenCh02BossModel();
    this.loadPolyhavenBuffModel();
    this.loadPolyhavenPickupModel();
    this.loadPlayerModel();
    this.loadQuaterniusRoadModel();
    this.loadPolyhavenBackgroundKit();
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
    // Narrow phones need a wider vertical FOV so all three lanes and their
    // roadside framing stay inside the small horizontal viewing angle.
    this.camera.fov = this.camera.aspect > 1 ? 62 : this.camera.aspect < 0.6 ? 68 : 58;
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
      this.syncRoad(snapshot);
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
    const atmosphereStyle: BackdropStyle = chapterId === 'ch02_viaduct' ? 'viaduct' : chapterId === 'ch03_forge' ? 'forge' : chapterId === 'ch04_canopy' ? 'canopy' : chapterId === 'ch05_archive' ? 'archive' : chapterId === 'ch06_horizon' ? 'horizon' : 'meadow';
    const atmosphere = ATMOSPHERE_PALETTES[atmosphereStyle];
    this.renderer.setClearColor(new Color(palette[0]!));
    this.scene.background = this.getSkyTexture(atmosphereStyle);
    if (this.scene.fog instanceof FogExp2) {
      this.scene.fog.color.set(atmosphere.fog);
      this.scene.fog.density = atmosphereStyle === 'forge' || atmosphereStyle === 'canopy' ? 0.015 : 0.012;
    }
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
    this.syncRoadModelVisibility(chapterId);
  }

  private syncRoadModelVisibility(chapterId: M1RunSnapshot['chapterId']): void {
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
    this.animateAtmosphere(performance.now() / 1000);
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
    for (const texture of this.skyTextures.values()) texture.dispose();
    this.skyTextures.clear();
    for (const texture of this.forgeRoadTextures.values()) texture.dispose();
    this.forgeRoadTextures.clear();
    for (const texture of this.canopyRoadTextures.values()) texture.dispose();
    this.canopyRoadTextures.clear();
    for (const texture of this.archiveRoadTextures.values()) texture.dispose();
    this.archiveRoadTextures.clear();
    for (const texture of this.horizonRoadTextures.values()) texture.dispose();
    this.horizonRoadTextures.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private createRoad(): void {
    for (let index = 0; index < 24; index += 1) {
      const segment = new Mesh(this.roadGeometry, this.roadMaterials[index % this.roadMaterials.length]!);
      segment.position.set(0, -0.1, index * ROAD_SEGMENT_LENGTH + ROAD_SEGMENT_LENGTH / 2);
      segment.userData.roadIndex = index;
      this.roadMeshes.push(segment);
      this.scene.add(segment);
    }
  }

  private createAtmosphericStages(): void {
    const stages: ReadonlyArray<readonly [Group, BackdropStyle]> = [
      [this.sceneryGroup, 'meadow'],
      [this.viaductSceneryGroup, 'viaduct'],
      [this.forgeSceneryGroup, 'forge'],
      [this.canopySceneryGroup, 'canopy'],
      [this.archiveSceneryGroup, 'archive'],
      [this.horizonSceneryGroup, 'horizon'],
    ];
    for (const [group, style] of stages) this.createAtmosphericStage(group, style);
  }

  private createAtmosphericStage(targetGroup: Group, style: BackdropStyle): void {
    const palette = ATMOSPHERE_PALETTES[style];
    const ground = new Mesh(new BoxGeometry(64, 0.08, 104), new MeshBasicMaterial({ color: palette.ground }));
    ground.name = `${style}-outer-ground`;
    ground.position.set(0, -0.19, 37);
    targetGroup.add(ground);

    const sun = new Mesh(new SphereGeometry(style === 'archive' ? 2.2 : 3.4, 20, 12), new MeshBasicMaterial({ color: palette.glow, transparent: true, opacity: style === 'forge' ? 0.72 : 0.88, fog: false }));
    sun.name = `${style}-horizon-glow`;
    sun.position.set(style === 'viaduct' || style === 'archive' ? 9.5 : -10.5, style === 'canopy' ? 8.5 : 7.2, 60);
    sun.userData.floatBaseY = sun.position.y;
    sun.userData.floatAmplitude = 0.12;
    sun.userData.floatSpeed = 0.22;
    targetGroup.add(sun);

    const ridgeMaterial = new MeshBasicMaterial({ color: palette.ridge, transparent: true, opacity: 0.9 });
    const ridgeFarMaterial = new MeshBasicMaterial({ color: palette.ridgeFar, transparent: true, opacity: 0.72 });
    const ridgeXs = style === 'viaduct' || style === 'archive'
      ? [-26, -18, -10, 10, 18, 26] as const
      : [-23, -14, -5, 5, 14, 23] as const;
    for (const [index, x] of ridgeXs.entries()) {
      const isFar = index % 2 === 0;
      const geometry = style === 'viaduct' || style === 'archive'
        ? new BoxGeometry(7 + (index % 3), 7 + (index % 4) * 1.4, 4)
        : style === 'horizon'
          ? new OctahedronGeometry(4.5 + (index % 2), 0)
          : new ConeGeometry(7 + (index % 3), 8 + (index % 2) * 3, style === 'forge' ? 5 : 7);
      const ridge = new Mesh(geometry, isFar ? ridgeFarMaterial.clone() : ridgeMaterial.clone());
      ridge.position.set(x, style === 'horizon' ? 3.6 : style === 'viaduct' || style === 'archive' ? ridge.geometry.boundingBox?.max.y ?? 3.5 : 2.8, isFar ? 68 : 61);
      if (style === 'horizon') ridge.scale.set(1.35, 1.9, 0.72);
      ridge.rotation.y = (index % 2 === 0 ? -1 : 1) * 0.18;
      targetGroup.add(ridge);
    }

    const cloudMaterial = new MeshBasicMaterial({ color: style === 'forge' ? '#5b3038' : style === 'archive' ? '#8c91b0' : style === 'horizon' ? '#b39cc7' : '#d7e2cf', transparent: true, opacity: style === 'forge' ? 0.28 : 0.34, depthWrite: false, fog: false });
    for (let index = 0; index < 5; index += 1) {
      const cloud = new Group();
      cloud.name = `${style}-cloud-${index}`;
      const puffCount = style === 'forge' ? 4 : 3;
      for (let puff = 0; puff < puffCount; puff += 1) {
        const mesh = new Mesh(new SphereGeometry(1.2 + puff * 0.28, 8, 5), cloudMaterial.clone());
        mesh.position.set(puff * 1.45, Math.sin(puff) * 0.35, puff % 2 === 0 ? 0 : -0.5);
        mesh.scale.set(1.8, style === 'forge' ? 1.15 : 0.7, 0.9);
        cloud.add(mesh);
      }
      cloud.position.set(-18 + index * 8.5, 7.5 + (index % 3) * 2.1, 42 + (index % 2) * 11);
      cloud.userData.cloudBaseX = cloud.position.x;
      cloud.userData.cloudAmplitude = 1.4 + index * 0.22;
      cloud.userData.cloudSpeed = 0.06 + index * 0.012;
      cloud.userData.cloudPhase = index * 0.9;
      cloud.userData.lowQualityVisible = index % 2 === 0;
      targetGroup.add(cloud);
    }

    const moteCount = style === 'meadow' || style === 'canopy' ? 28 : 20;
    for (let index = 0; index < moteCount; index += 1) {
      const size = 0.035 + (index % 4) * 0.018;
      const mote = new Mesh(new SphereGeometry(size, 5, 4), new MeshBasicMaterial({ color: palette.mote, transparent: true, opacity: 0.38 + (index % 3) * 0.16, fog: false }));
      mote.name = `${style}-mote-${index}`;
      const side = index % 2 === 0 ? -1 : 1;
      mote.position.set(side * (6.2 + ((index * 37) % 30) / 10), 0.7 + ((index * 19) % 45) / 10, 4 + ((index * 29) % 570) / 10);
      mote.userData.floatBaseY = mote.position.y;
      mote.userData.floatAmplitude = 0.18 + (index % 4) * 0.08;
      mote.userData.floatSpeed = 0.75 + (index % 5) * 0.14;
      mote.userData.floatPhase = index * 0.73;
      mote.userData.atmosphereDetail = true;
      mote.userData.detailIndex = index;
      targetGroup.add(mote);
    }

    this.addChapterEdgeDetails(targetGroup, style, palette);
  }

  private addChapterEdgeDetails(targetGroup: Group, style: BackdropStyle, palette: AtmospherePalette): void {
    const placements = [9, 18, 29, 41, 53, 65] as const;
    for (const [index, z] of placements.entries()) {
      const detail = new Group();
      detail.name = `${style}-edge-detail-${index}`;
      const side = index % 2 === 0 ? -1 : 1;
      detail.position.set(side * (6.2 + (index % 3) * 0.7), 0, z);
      detail.userData.worldZ = z;
      detail.userData.sceneryIndex = targetGroup.children.length;
      detail.userData.lowQualityVisible = index % 2 === 0;

      if (style === 'meadow') {
        for (let blade = 0; blade < 7; blade += 1) {
          const stem = new Mesh(new ConeGeometry(0.045, 0.65 + (blade % 3) * 0.18, 5), new MeshBasicMaterial({ color: blade % 2 === 0 ? '#82ad70' : '#b5c977' }));
          stem.position.set((blade - 3) * 0.22, 0.34 + (blade % 3) * 0.09, (blade % 2) * 0.2);
          stem.rotation.z = (blade - 3) * 0.035;
          detail.add(stem);
          if (blade % 2 === 0) {
            const flower = new Mesh(new SphereGeometry(0.1, 6, 4), new MeshBasicMaterial({ color: blade % 4 === 0 ? '#ffd979' : '#f2a9a0' }));
            flower.position.set(stem.position.x, stem.position.y + 0.37, stem.position.z);
            detail.add(flower);
          }
        }
        const post = new Mesh(new BoxGeometry(0.18, 1.25, 0.18), new MeshBasicMaterial({ color: '#7d6847' }));
        post.position.set(side * -0.55, 0.62, 0.25);
        detail.add(post);
      } else if (style === 'viaduct' || style === 'forge') {
        const frame = new Mesh(new TorusGeometry(0.72, 0.09, 6, 18), new MeshBasicMaterial({ color: palette.glow, transparent: true, opacity: 0.7 }));
        frame.position.y = 1.25;
        frame.rotation.y = Math.PI / 2;
        detail.add(frame);
        const base = new Mesh(new BoxGeometry(0.8, 1.15, 0.8), new MeshBasicMaterial({ color: palette.ridge }));
        base.position.y = 0.55;
        detail.add(base);
      } else if (style === 'canopy') {
        const trunk = new Mesh(new ConeGeometry(0.42, 2.7, 7), new MeshBasicMaterial({ color: '#345541' }));
        trunk.position.y = 1.35;
        detail.add(trunk);
        for (const [x, y] of [[-0.35, 2.45], [0.3, 2.7], [0.05, 3.15]] as const) {
          const crown = new Mesh(new SphereGeometry(0.75, 7, 5), new MeshBasicMaterial({ color: x > 0 ? '#4f8a67' : '#396e55' }));
          crown.position.set(x, y, 0);
          detail.add(crown);
        }
      } else if (style === 'archive') {
        const pillar = new Mesh(new BoxGeometry(0.8, 3.2, 0.8), new MeshBasicMaterial({ color: palette.ridge }));
        pillar.position.y = 1.6;
        detail.add(pillar);
        const beacon = new Mesh(new OctahedronGeometry(0.34, 0), new MeshBasicMaterial({ color: palette.glow }));
        beacon.position.y = 3.45;
        beacon.userData.floatBaseY = beacon.position.y;
        detail.add(beacon);
      } else {
        const shard = new Mesh(new OctahedronGeometry(0.75, 0), new MeshBasicMaterial({ color: index % 2 === 0 ? palette.glow : palette.mote, transparent: true, opacity: 0.78 }));
        shard.position.y = 1.35;
        shard.scale.set(0.65, 2.2, 0.65);
        detail.add(shard);
        const ring = new Mesh(new TorusGeometry(1.1, 0.06, 6, 22), new MeshBasicMaterial({ color: palette.glow, transparent: true, opacity: 0.55 }));
        ring.position.y = 1.3;
        ring.rotation.x = Math.PI / 2;
        detail.add(ring);
      }
      targetGroup.add(detail);
    }
  }

  private createViaductSetPieces(): void {
    const bayPositions = [8, 22, 36, 50, 64] as const;
    for (const [bayIndex, z] of bayPositions.entries()) {
      const bay = new Group();
      bay.name = `ch02-viaduct-bay-${bayIndex}`;
      bay.userData.worldZ = z;
      bay.userData.sceneryIndex = this.viaductSceneryGroup.children.length;
      bay.userData.lowQualityVisible = bayIndex % 2 === 0;
      bay.userData.viaductSetPiece = true;
      bay.userData.pulsePhase = bayIndex * 0.8;

      for (const side of [-1, 1] as const) {
        const mirrorWater = new Mesh(
          new BoxGeometry(7.4, 0.035, 11.6),
          new MeshBasicMaterial({ color: bayIndex % 2 === 0 ? '#20568a' : '#2d72a6', transparent: true, opacity: 0.58, depthWrite: false }),
        );
        mirrorWater.name = 'viaduct-mirror-water';
        mirrorWater.position.set(side * 9.55, -0.115, 0);
        bay.add(mirrorWater);

        const innerReflection = new Mesh(
          new BoxGeometry(1.9, 0.045, 9.5),
          new MeshBasicMaterial({ color: '#72c9ef', transparent: true, opacity: 0.26, depthWrite: false }),
        );
        innerReflection.position.set(side * 7.15, -0.085, bayIndex % 2 === 0 ? -0.65 : 0.65);
        innerReflection.rotation.y = side * 0.06;
        innerReflection.userData.viaductGlow = true;
        innerReflection.userData.baseOpacity = 0.26;
        bay.add(innerReflection);

        const rail = new Mesh(new BoxGeometry(0.18, 0.42, 11.8), new MeshBasicMaterial({ color: '#274d78' }));
        rail.position.set(side * 5.82, 0.2, 0);
        bay.add(rail);

        const lightStrip = new Mesh(
          new BoxGeometry(0.08, 0.08, 11.7),
          new MeshBasicMaterial({ color: '#8ce3ff', transparent: true, opacity: 0.78 }),
        );
        lightStrip.position.set(side * 5.72, 0.46, 0);
        lightStrip.userData.viaductGlow = true;
        lightStrip.userData.baseOpacity = 0.78;
        bay.add(lightStrip);

        for (const [postIndex, localZ] of [-4.5, 0, 4.5].entries()) {
          const post = new Mesh(new BoxGeometry(0.34, 2.8, 0.34), new MeshBasicMaterial({ color: postIndex === 1 ? '#315f92' : '#203f68' }));
          post.position.set(side * 6.45, 1.4, localZ);
          bay.add(post);

          const beacon = new Mesh(
            new SphereGeometry(0.18, 8, 6),
            new MeshBasicMaterial({ color: '#b8efff', transparent: true, opacity: 0.9, fog: false }),
          );
          beacon.position.set(side * 6.45, 2.95, localZ);
          beacon.userData.viaductGlow = true;
          beacon.userData.baseOpacity = 0.9;
          bay.add(beacon);
        }

        const calibrationRing = new Mesh(
          new TorusGeometry(0.72, 0.075, 6, 24),
          new MeshBasicMaterial({ color: '#7edbff', transparent: true, opacity: 0.72 }),
        );
        calibrationRing.position.set(side * 7.35, 1.55, bayIndex % 2 === 0 ? -2.3 : 2.3);
        calibrationRing.rotation.y = Math.PI / 2;
        calibrationRing.userData.viaductGlow = true;
        calibrationRing.userData.baseOpacity = 0.72;
        bay.add(calibrationRing);
      }

      this.viaductSceneryGroup.add(bay);
    }
  }

  private createForgeSetPieces(): void {
    const bayPositions = [8, 22, 36, 50, 64] as const;
    for (const [bayIndex, z] of bayPositions.entries()) {
      const bay = new Group();
      bay.name = `ch03-forge-bay-${bayIndex}`;
      bay.userData.worldZ = z;
      bay.userData.sceneryIndex = this.forgeSceneryGroup.children.length;
      bay.userData.lowQualityVisible = bayIndex % 2 === 0;
      bay.userData.forgeSetPiece = true;
      bay.userData.pulsePhase = bayIndex * 0.74;

      for (const side of [-1, 1] as const) {
        const lavaBed = new Mesh(
          new BoxGeometry(2.9, 0.08, 11.7),
          new MeshBasicMaterial({ color: '#3b1018' }),
        );
        lavaBed.position.set(side * 7.25, -0.12, 0);
        bay.add(lavaBed);

        const lavaFlow = new Mesh(
          new BoxGeometry(2.35, 0.035, 11.45),
          new MeshBasicMaterial({ color: bayIndex % 2 === 0 ? '#ff5b24' : '#e54320', transparent: true, opacity: 0.62, depthWrite: false }),
        );
        lavaFlow.position.set(side * 7.25, -0.065, 0);
        lavaFlow.userData.forgeGlow = true;
        lavaFlow.userData.baseOpacity = 0.62;
        bay.add(lavaFlow);

        const basaltLip = new Mesh(new BoxGeometry(0.22, 0.46, 11.8), new MeshBasicMaterial({ color: '#351c28' }));
        basaltLip.position.set(side * 5.68, 0.13, 0);
        bay.add(basaltLip);

        const emberRail = new Mesh(
          new BoxGeometry(0.075, 0.075, 11.65),
          new MeshBasicMaterial({ color: '#ff9b52', transparent: true, opacity: 0.74 }),
        );
        emberRail.position.set(side * 5.56, 0.39, 0);
        emberRail.userData.forgeGlow = true;
        emberRail.userData.baseOpacity = 0.74;
        bay.add(emberRail);

        for (const [columnIndex, localZ] of [-4.6, 4.6].entries()) {
          const column = new Mesh(new BoxGeometry(0.82, 4.6, 0.82), new MeshBasicMaterial({ color: columnIndex === 0 ? '#452536' : '#55283a' }));
          column.position.set(side * 8.95, 2.3, localZ);
          bay.add(column);

          const hotJoint = new Mesh(
            new TorusGeometry(0.34, 0.085, 6, 18),
            new MeshBasicMaterial({ color: '#ff7540', transparent: true, opacity: 0.78 }),
          );
          hotJoint.position.set(side * 8.49, 2.25, localZ);
          hotJoint.rotation.y = Math.PI / 2;
          hotJoint.userData.forgeGlow = true;
          hotJoint.userData.baseOpacity = 0.78;
          bay.add(hotJoint);
        }

        const furnaceWall = new Mesh(new BoxGeometry(2.25, 3.2, 1.05), new MeshBasicMaterial({ color: '#4b2433' }));
        furnaceWall.position.set(side * 9.35, 1.6, bayIndex % 2 === 0 ? -1.35 : 1.35);
        bay.add(furnaceWall);

        const furnaceMouth = new Mesh(
          new TorusGeometry(0.7, 0.14, 6, 20),
          new MeshBasicMaterial({ color: '#ff6a31', transparent: true, opacity: 0.82 }),
        );
        furnaceMouth.position.set(side * 8.76, 1.45, furnaceWall.position.z);
        furnaceMouth.rotation.y = Math.PI / 2;
        furnaceMouth.userData.forgeGlow = true;
        furnaceMouth.userData.baseOpacity = 0.82;
        bay.add(furnaceMouth);

        const chimney = new Mesh(new BoxGeometry(0.72, 4.4, 0.72), new MeshBasicMaterial({ color: '#2d1a27' }));
        chimney.position.set(side * 10.15, 4.4, -furnaceWall.position.z);
        bay.add(chimney);

        for (let sparkIndex = 0; sparkIndex < 3; sparkIndex += 1) {
          const spark = new Mesh(
            new SphereGeometry(0.055 + sparkIndex * 0.012, 5, 4),
            new MeshBasicMaterial({ color: sparkIndex === 1 ? '#ffd06b' : '#ff7a38', transparent: true, opacity: 0.84, fog: false }),
          );
          spark.position.set(side * (6.35 + sparkIndex * 0.45), 0.55 + sparkIndex * 0.52, -3.4 + sparkIndex * 3.3 + (bayIndex % 2) * 0.8);
          spark.userData.forgeSpark = true;
          spark.userData.sparkBaseY = spark.position.y;
          spark.userData.sparkSpeed = 0.52 + sparkIndex * 0.12;
          spark.userData.sparkPhase = bayIndex * 0.58 + sparkIndex * 0.86;
          spark.userData.baseOpacity = 0.84;
          bay.add(spark);
        }
      }

      this.forgeSceneryGroup.add(bay);
    }
  }

  private createCanopySetPieces(): void {
    const bayPositions = [8, 22, 36, 50, 64] as const;
    for (const [bayIndex, z] of bayPositions.entries()) {
      const bay = new Group();
      bay.name = `ch04-canopy-bay-${bayIndex}`;
      bay.userData.worldZ = z;
      bay.userData.sceneryIndex = this.canopySceneryGroup.children.length;
      bay.userData.lowQualityVisible = bayIndex % 2 === 0;
      bay.userData.canopySetPiece = true;
      bay.userData.mistPhase = bayIndex * 0.68;

      for (const side of [-1, 1] as const) {
        const mossBank = new Mesh(
          new BoxGeometry(3.1, 0.42, 11.7),
          new MeshBasicMaterial({ color: bayIndex % 2 === 0 ? '#214d3b' : '#295743' }),
        );
        mossBank.position.set(side * 7.15, 0.03, 0);
        bay.add(mossBank);

        const earthBank = new Mesh(
          new BoxGeometry(3.9, 0.74, 11.75),
          new MeshBasicMaterial({ color: '#17372f' }),
        );
        earthBank.position.set(side * 9.85, -0.06, 0);
        bay.add(earthBank);

        const rootEdge = new Mesh(
          new TorusGeometry(0.82, 0.14, 6, 20),
          new MeshBasicMaterial({ color: '#4f7456' }),
        );
        rootEdge.position.set(side * 6.28, 0.44, bayIndex % 2 === 0 ? -2.8 : 2.8);
        rootEdge.rotation.set(Math.PI / 2, 0, 0);
        rootEdge.scale.set(0.7, 1.65, 0.7);
        bay.add(rootEdge);

        const trunk = new Mesh(
          new ConeGeometry(0.82, 6.8, 7),
          new MeshBasicMaterial({ color: bayIndex % 2 === 0 ? '#315744' : '#294c3d' }),
        );
        trunk.position.set(side * (8.45 + (bayIndex % 2) * 0.55), 3.4, bayIndex % 2 === 0 ? 1.6 : -1.6);
        trunk.rotation.z = side * (bayIndex % 2 === 0 ? -0.055 : 0.07);
        bay.add(trunk);

        const branch = new Mesh(new BoxGeometry(3.2, 0.42, 0.52), new MeshBasicMaterial({ color: '#355e49' }));
        branch.position.set(side * 7.55, 5.25, trunk.position.z);
        branch.rotation.z = side * 0.32;
        bay.add(branch);

        for (const [crownIndex, crownY] of [5.65, 6.55].entries()) {
          const crown = new Mesh(
            new SphereGeometry(1.42 - crownIndex * 0.12, 8, 5),
            new MeshBasicMaterial({ color: crownIndex === 0 ? '#3a795b' : '#4b8f6b', transparent: true, opacity: 0.92 }),
          );
          crown.position.set(side * (7.55 + crownIndex * 0.82), crownY, trunk.position.z + (crownIndex === 0 ? -0.35 : 0.5));
          crown.scale.set(1.5, 0.78, 1.05);
          bay.add(crown);
        }

        for (let vineIndex = 0; vineIndex < 3; vineIndex += 1) {
          const vine = new Mesh(
            new BoxGeometry(0.055, 1.75 + vineIndex * 0.42, 0.055),
            new MeshBasicMaterial({ color: vineIndex % 2 === 0 ? '#61a87b' : '#477c60', transparent: true, opacity: 0.82 }),
          );
          vine.position.set(side * (6.15 + vineIndex * 0.5), 4.45 - vineIndex * 0.2, trunk.position.z + 0.65 - vineIndex * 0.56);
          vine.rotation.z = side * (0.035 + vineIndex * 0.018);
          vine.userData.canopyVine = true;
          vine.userData.vineBaseRotation = vine.rotation.z;
          vine.userData.vinePhase = bayIndex * 0.72 + vineIndex * 0.85;
          bay.add(vine);
        }

        const sideMist = new Mesh(
          new BoxGeometry(3.6, 1.15, 9.8),
          new MeshBasicMaterial({ color: '#79bca0', transparent: true, opacity: 0.105, depthWrite: false }),
        );
        sideMist.position.set(side * 8.1, 1.05, bayIndex % 2 === 0 ? -0.7 : 0.7);
        sideMist.userData.canopyMist = true;
        sideMist.userData.baseOpacity = 0.105;
        sideMist.userData.mistBaseX = sideMist.position.x;
        sideMist.userData.mistSide = side;
        bay.add(sideMist);

        for (let sporeIndex = 0; sporeIndex < 4; sporeIndex += 1) {
          const spore = new Mesh(
            new SphereGeometry(0.055 + (sporeIndex % 2) * 0.025, 6, 4),
            new MeshBasicMaterial({ color: sporeIndex % 2 === 0 ? '#8ff1c8' : '#c0f7d6', transparent: true, opacity: 0.72, fog: false }),
          );
          spore.position.set(side * (6.2 + sporeIndex * 0.68), 0.65 + sporeIndex * 0.74, -3.6 + sporeIndex * 2.4 + (bayIndex % 2) * 0.6);
          spore.userData.canopySpore = true;
          spore.userData.sporeBaseY = spore.position.y;
          spore.userData.sporeSpeed = 0.38 + sporeIndex * 0.075;
          spore.userData.sporePhase = bayIndex * 0.61 + sporeIndex * 0.77;
          spore.userData.baseOpacity = 0.72;
          bay.add(spore);
        }
      }

      this.canopySceneryGroup.add(bay);
    }
  }

  private createArchiveSetPieces(): void {
    const bayPositions = [8, 22, 36, 50, 64] as const;
    for (const [bayIndex, z] of bayPositions.entries()) {
      const bay = new Group();
      bay.name = `ch05-archive-bay-${bayIndex}`;
      bay.userData.worldZ = z;
      bay.userData.sceneryIndex = this.archiveSceneryGroup.children.length;
      bay.userData.lowQualityVisible = bayIndex % 2 === 0;
      bay.userData.archiveSetPiece = true;
      bay.userData.archivePhase = bayIndex * 0.71;

      for (const side of [-1, 1] as const) {
        const plinth = new Mesh(
          new BoxGeometry(3.2, 0.34, 11.7),
          new MeshBasicMaterial({ color: bayIndex % 2 === 0 ? '#101b3d' : '#14234b' }),
        );
        plinth.position.set(side * 7.18, -0.01, 0);
        bay.add(plinth);

        const goldRail = new Mesh(
          new BoxGeometry(0.085, 0.08, 11.65),
          new MeshBasicMaterial({ color: '#e5c76a', transparent: true, opacity: 0.74 }),
        );
        goldRail.position.set(side * 5.58, 0.22, 0);
        goldRail.userData.archiveGlow = true;
        goldRail.userData.baseOpacity = 0.74;
        bay.add(goldRail);

        const pillarZ = bayIndex % 2 === 0 ? -2.9 : 2.9;
        for (const offsetZ of [-3.9, 3.9] as const) {
          const pillar = new Mesh(new BoxGeometry(0.72, 5.4, 0.9), new MeshBasicMaterial({ color: '#1a2c59' }));
          pillar.position.set(side * 8.55, 2.7, offsetZ);
          bay.add(pillar);

          const cap = new Mesh(new BoxGeometry(1.1, 0.24, 1.25), new MeshBasicMaterial({ color: '#9b8650' }));
          cap.position.set(side * 8.55, 5.35, offsetZ);
          bay.add(cap);
        }

        const archiveCase = new Mesh(new BoxGeometry(1.65, 3.85, 0.78), new MeshBasicMaterial({ color: '#162650' }));
        archiveCase.position.set(side * 9.15, 1.95, pillarZ);
        bay.add(archiveCase);
        for (let shelfIndex = 0; shelfIndex < 3; shelfIndex += 1) {
          const shelfLight = new Mesh(
            new BoxGeometry(0.08, 0.14, 0.58),
            new MeshBasicMaterial({ color: shelfIndex === 1 ? '#f0d77d' : '#b9a25c', transparent: true, opacity: 0.76 }),
          );
          shelfLight.position.set(side * 8.28, 1.05 + shelfIndex * 0.9, pillarZ);
          shelfLight.userData.archiveGlow = true;
          shelfLight.userData.baseOpacity = 0.76;
          bay.add(shelfLight);
        }

        const starMapRing = new Mesh(
          new TorusGeometry(0.92, 0.065, 6, 28),
          new MeshBasicMaterial({ color: '#e8ce73', transparent: true, opacity: 0.58, depthWrite: false }),
        );
        starMapRing.position.set(side * 6.78, 2.35, -pillarZ * 0.72);
        starMapRing.rotation.y = Math.PI / 2;
        starMapRing.userData.archiveOrbit = true;
        starMapRing.userData.orbitBaseRotation = starMapRing.rotation.z;
        starMapRing.userData.orbitPhase = bayIndex * 0.83 + (side > 0 ? 0.45 : 0);
        starMapRing.userData.archiveGlow = true;
        starMapRing.userData.baseOpacity = 0.58;
        bay.add(starMapRing);

        for (let starIndex = 0; starIndex < 4; starIndex += 1) {
          const angle = starIndex * Math.PI * 0.5 + bayIndex * 0.23;
          const star = new Mesh(
            new OctahedronGeometry(0.085 + (starIndex % 2) * 0.025, 0),
            new MeshBasicMaterial({ color: starIndex % 2 === 0 ? '#f4dc88' : '#b9c9ff', transparent: true, opacity: 0.82, fog: false }),
          );
          star.position.set(side * (6.45 + Math.cos(angle) * 0.55), 2.35 + Math.sin(angle) * 0.65, -pillarZ * 0.72 + (starIndex - 1.5) * 0.18);
          star.userData.archiveStar = true;
          star.userData.starBaseY = star.position.y;
          star.userData.starPhase = bayIndex * 0.69 + starIndex * 0.9;
          star.userData.baseOpacity = 0.82;
          bay.add(star);
        }

        for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) {
          const page = new Mesh(
            new BoxGeometry(0.42, 0.58, 0.025),
            new MeshBasicMaterial({ color: pageIndex === 1 ? '#efe3ad' : '#c8c3a2', transparent: true, opacity: 0.6, side: 2 }),
          );
          page.position.set(side * (6.25 + pageIndex * 0.72), 1.15 + pageIndex * 0.72, -3.25 + pageIndex * 3.15 + (bayIndex % 2) * 0.5);
          page.rotation.set(0.15 + pageIndex * 0.08, side * (0.25 + pageIndex * 0.12), side * 0.08);
          page.userData.archivePage = true;
          page.userData.pageBaseY = page.position.y;
          page.userData.pageBaseRotationY = page.rotation.y;
          page.userData.pagePhase = bayIndex * 0.64 + pageIndex * 0.82;
          bay.add(page);
        }
      }

      this.archiveSceneryGroup.add(bay);
    }
  }

  private createHorizonSetPieces(): void {
    const bayPositions = [8, 22, 36, 50, 64] as const;
    for (const [bayIndex, z] of bayPositions.entries()) {
      const bay = new Group();
      bay.name = `ch06-horizon-bay-${bayIndex}`;
      bay.userData.worldZ = z;
      bay.userData.sceneryIndex = this.horizonSceneryGroup.children.length;
      bay.userData.lowQualityVisible = bayIndex % 2 === 0;
      bay.userData.horizonSetPiece = true;
      bay.userData.horizonPhase = bayIndex * 0.76;

      for (const side of [-1, 1] as const) {
        const island = new Mesh(
          new BoxGeometry(3.25, 0.42, 10.8),
          new MeshBasicMaterial({ color: bayIndex % 2 === 0 ? '#34264f' : '#432e5f' }),
        );
        island.position.set(side * 7.24, 0.12, 0);
        island.rotation.z = side * (bayIndex % 2 === 0 ? 0.022 : -0.028);
        island.userData.horizonFloat = true;
        island.userData.floatBaseY = island.position.y;
        island.userData.floatAmplitude = 0.08;
        island.userData.floatSpeed = 0.42;
        island.userData.floatPhase = bayIndex * 0.67 + (side > 0 ? 0.6 : 0);
        bay.add(island);

        const edgeLight = new Mesh(
          new BoxGeometry(0.085, 0.085, 11.35),
          new MeshBasicMaterial({ color: '#fff0a8', transparent: true, opacity: 0.72 }),
        );
        edgeLight.position.set(side * 5.58, 0.38, 0);
        edgeLight.userData.horizonGlow = true;
        edgeLight.userData.baseOpacity = 0.72;
        bay.add(edgeLight);

        for (let fragmentIndex = 0; fragmentIndex < 3; fragmentIndex += 1) {
          const fragment = new Mesh(
            new OctahedronGeometry(0.65 + fragmentIndex * 0.2, 0),
            new MeshBasicMaterial({ color: fragmentIndex === 1 ? '#866bb1' : '#644d88', transparent: true, opacity: 0.9 }),
          );
          fragment.position.set(side * (8.2 + fragmentIndex * 1.15), 0.85 + fragmentIndex * 0.72, -3.5 + fragmentIndex * 3.45 + (bayIndex % 2) * 0.65);
          fragment.scale.set(1.25, 0.42 + fragmentIndex * 0.14, 1.05);
          fragment.rotation.set(0.12 * fragmentIndex, side * (0.3 + fragmentIndex * 0.2), side * 0.16);
          fragment.userData.horizonFragment = true;
          fragment.userData.fragmentBaseY = fragment.position.y;
          fragment.userData.fragmentBaseRotationY = fragment.rotation.y;
          fragment.userData.fragmentPhase = bayIndex * 0.7 + fragmentIndex * 0.82;
          bay.add(fragment);
        }

        const anchor = new Mesh(new OctahedronGeometry(0.82, 0), new MeshBasicMaterial({ color: '#5b427d' }));
        anchor.position.set(side * 7.25, 2.65, bayIndex % 2 === 0 ? -2.15 : 2.15);
        anchor.scale.set(0.78, 2.45, 0.78);
        bay.add(anchor);

        const anchorRing = new Mesh(
          new TorusGeometry(1.15, 0.075, 6, 28),
          new MeshBasicMaterial({ color: '#f8e7a0', transparent: true, opacity: 0.62, depthWrite: false }),
        );
        anchorRing.position.copy(anchor.position);
        anchorRing.rotation.x = Math.PI / 2;
        anchorRing.userData.horizonOrbit = true;
        anchorRing.userData.orbitBaseRotation = anchorRing.rotation.z;
        anchorRing.userData.orbitPhase = bayIndex * 0.78 + (side > 0 ? 0.48 : 0);
        anchorRing.userData.horizonGlow = true;
        anchorRing.userData.baseOpacity = 0.62;
        bay.add(anchorRing);

        const tower = new Mesh(new BoxGeometry(0.62, 5.8, 0.72), new MeshBasicMaterial({ color: '#2b2046' }));
        tower.position.set(side * 9.5, 3.05, -anchor.position.z);
        bay.add(tower);
        for (let signalIndex = 0; signalIndex < 3; signalIndex += 1) {
          const signalBar = new Mesh(
            new BoxGeometry(0.92 - signalIndex * 0.16, 0.09, 0.09),
            new MeshBasicMaterial({ color: signalIndex === 0 ? '#fff1ad' : '#c7aef2', transparent: true, opacity: 0.66 }),
          );
          signalBar.position.set(side * 9.08, 3.9 + signalIndex * 0.55, tower.position.z);
          signalBar.userData.horizonGlow = true;
          signalBar.userData.baseOpacity = 0.66;
          bay.add(signalBar);
        }

        for (let boltIndex = 0; boltIndex < 3; boltIndex += 1) {
          const bolt = new Mesh(
            new BoxGeometry(0.055, 1.25, 0.055),
            new MeshBasicMaterial({ color: '#f7edbd', transparent: true, opacity: 0.15, fog: false }),
          );
          bolt.position.set(side * (7.8 + boltIndex * 0.55), 5.1 - boltIndex * 0.42, 2.9 - boltIndex * 0.58 + (bayIndex % 2) * 0.7);
          bolt.rotation.z = side * (boltIndex % 2 === 0 ? 0.52 : -0.48);
          bolt.userData.horizonBolt = true;
          bolt.userData.boltPhase = bayIndex * 0.81 + boltIndex * 0.54 + (side > 0 ? 0.35 : 0);
          bay.add(bolt);
        }
      }

      this.horizonSceneryGroup.add(bay);
    }
  }

  private getSkyTexture(style: BackdropStyle): CanvasTexture {
    const cached = this.skyTextures.get(style);
    if (cached !== undefined) return cached;
    const palette = ATMOSPHERE_PALETTES[style];
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立天空背景。');
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(0.58, palette.skyHorizon);
    gradient.addColorStop(1, palette.skyLow);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const glowX = style === 'viaduct' || style === 'archive' ? 760 : 260;
    const glowY = style === 'canopy' ? 190 : 155;
    const glowGradient = context.createRadialGradient(glowX, glowY, 8, glowX, glowY, style === 'archive' ? 72 : 108);
    glowGradient.addColorStop(0, palette.glow);
    glowGradient.addColorStop(0.34, `${palette.glow}c7`);
    glowGradient.addColorStop(1, `${palette.glow}00`);
    context.fillStyle = glowGradient;
    context.beginPath();
    context.arc(glowX, glowY, style === 'archive' ? 72 : 108, 0, Math.PI * 2);
    context.fill();

    const drawRidge = (baseline: number, amplitude: number, color: string, offset: number): void => {
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(0, canvas.height);
      context.lineTo(0, baseline);
      for (let x = 0; x <= canvas.width; x += 64) {
        const peak = Math.sin((x + offset) * 0.018) * amplitude + Math.sin((x + offset) * 0.041) * amplitude * 0.35;
        context.lineTo(x, baseline - Math.abs(peak));
      }
      context.lineTo(canvas.width, canvas.height);
      context.closePath();
      context.fill();
    };
    drawRidge(330, style === 'viaduct' || style === 'archive' ? 32 : 54, `${palette.ridgeFar}b8`, 37);
    drawRidge(390, style === 'horizon' ? 86 : 62, palette.ridge, 113);

    context.fillStyle = style === 'forge' ? '#e8a2722c' : '#f5f1d426';
    for (let index = 0; index < 9; index += 1) {
      const x = 42 + ((index * 137) % 920);
      const y = 70 + ((index * 53) % 170);
      context.beginPath();
      context.ellipse(x, y, 65 + (index % 3) * 22, 12 + (index % 2) * 7, (index % 2 === 0 ? -1 : 1) * 0.08, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = `${palette.mote}8c`;
    for (let index = 0; index < 48; index += 1) {
      const x = (index * 83 + 29) % canvas.width;
      const y = (index * 47 + 21) % 310;
      const radius = 0.8 + (index % 3) * 0.65;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.skyTextures.set(style, texture);
    return texture;
  }

  private animateAtmosphere(timeSeconds: number): void {
    const activeGroup = this.themedChapterId === 'ch02_viaduct' ? this.viaductSceneryGroup : this.themedChapterId === 'ch03_forge' ? this.forgeSceneryGroup : this.themedChapterId === 'ch04_canopy' ? this.canopySceneryGroup : this.themedChapterId === 'ch05_archive' ? this.archiveSceneryGroup : this.themedChapterId === 'ch06_horizon' ? this.horizonSceneryGroup : this.sceneryGroup;
    for (const child of activeGroup.children) {
      const floatBaseY = child.userData.floatBaseY as number | undefined;
      if (floatBaseY !== undefined) {
        const amplitude = (child.userData.floatAmplitude as number | undefined) ?? 0.2;
        const speed = (child.userData.floatSpeed as number | undefined) ?? 0.8;
        const phase = (child.userData.floatPhase as number | undefined) ?? 0;
        child.position.y = floatBaseY + Math.sin(timeSeconds * speed + phase) * amplitude;
      }
      const cloudBaseX = child.userData.cloudBaseX as number | undefined;
      if (cloudBaseX !== undefined) {
        const amplitude = child.userData.cloudAmplitude as number;
        const speed = child.userData.cloudSpeed as number;
        const phase = child.userData.cloudPhase as number;
        child.position.x = cloudBaseX + Math.sin(timeSeconds * speed + phase) * amplitude;
        child.visible = this.qualityMode === 'standard' || child.userData.lowQualityVisible === true;
      }
      if (child.userData.atmosphereDetail === true) {
        const detailIndex = child.userData.detailIndex as number;
        child.visible = this.qualityMode === 'standard' || detailIndex % 3 === 0;
        child.rotation.y = timeSeconds * (0.18 + (detailIndex % 4) * 0.04);
      }
      if (child.userData.viaductSetPiece === true) {
        const phase = child.userData.pulsePhase as number;
        const pulse = 0.82 + Math.sin(timeSeconds * 1.6 + phase) * 0.18;
        child.traverse((node) => {
          if (!(node instanceof Mesh) || node.userData.viaductGlow !== true) return;
          const material = node.material as MeshBasicMaterial;
          material.opacity = (node.userData.baseOpacity as number) * pulse;
        });
      }
      if (child.userData.forgeSetPiece === true) {
        const phase = child.userData.pulsePhase as number;
        const pulse = 0.76 + Math.sin(timeSeconds * 2.05 + phase) * 0.24;
        child.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          if (node.userData.forgeGlow === true) {
            const material = node.material as MeshBasicMaterial;
            material.opacity = (node.userData.baseOpacity as number) * pulse;
          }
          if (node.userData.forgeSpark === true) {
            const speed = node.userData.sparkSpeed as number;
            const sparkPhase = node.userData.sparkPhase as number;
            const rise = (timeSeconds * speed + sparkPhase) % 2.8;
            node.position.y = (node.userData.sparkBaseY as number) + rise;
            const material = node.material as MeshBasicMaterial;
            material.opacity = (node.userData.baseOpacity as number) * (1 - rise / 3.1);
          }
        });
      }
      if (child.userData.canopySetPiece === true) {
        const phase = child.userData.mistPhase as number;
        child.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          if (node.userData.canopyMist === true) {
            const side = node.userData.mistSide as number;
            node.position.x = (node.userData.mistBaseX as number) + side * Math.sin(timeSeconds * 0.22 + phase) * 0.28;
            const material = node.material as MeshBasicMaterial;
            material.opacity = (node.userData.baseOpacity as number) * (0.78 + Math.sin(timeSeconds * 0.38 + phase) * 0.22);
          }
          if (node.userData.canopyVine === true) {
            node.rotation.z = (node.userData.vineBaseRotation as number) + Math.sin(timeSeconds * 0.6 + (node.userData.vinePhase as number)) * 0.035;
          }
          if (node.userData.canopySpore === true) {
            const speed = node.userData.sporeSpeed as number;
            const sporePhase = node.userData.sporePhase as number;
            const rise = (timeSeconds * speed + sporePhase) % 2.6;
            node.position.y = (node.userData.sporeBaseY as number) + rise;
            const material = node.material as MeshBasicMaterial;
            material.opacity = (node.userData.baseOpacity as number) * (1 - rise / 3.1);
          }
        });
      }
      if (child.userData.archiveSetPiece === true) {
        const phase = child.userData.archivePhase as number;
        const pulse = 0.8 + Math.sin(timeSeconds * 1.05 + phase) * 0.2;
        child.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          if (node.userData.archiveGlow === true) {
            const material = node.material as MeshBasicMaterial;
            material.opacity = (node.userData.baseOpacity as number) * pulse;
          }
          if (node.userData.archiveOrbit === true) {
            node.rotation.z = (node.userData.orbitBaseRotation as number) + timeSeconds * 0.18 + (node.userData.orbitPhase as number);
          }
          if (node.userData.archiveStar === true) {
            const starPhase = node.userData.starPhase as number;
            node.position.y = (node.userData.starBaseY as number) + Math.sin(timeSeconds * 0.72 + starPhase) * 0.16;
            const material = node.material as MeshBasicMaterial;
            material.opacity = (node.userData.baseOpacity as number) * (0.68 + Math.sin(timeSeconds * 1.35 + starPhase) * 0.32);
          }
          if (node.userData.archivePage === true) {
            const pagePhase = node.userData.pagePhase as number;
            node.position.y = (node.userData.pageBaseY as number) + Math.sin(timeSeconds * 0.58 + pagePhase) * 0.18;
            node.rotation.y = (node.userData.pageBaseRotationY as number) + Math.sin(timeSeconds * 0.42 + pagePhase) * 0.22;
          }
        });
      }
      if (child.userData.horizonSetPiece === true) {
        const phase = child.userData.horizonPhase as number;
        const pulse = 0.76 + Math.sin(timeSeconds * 1.3 + phase) * 0.24;
        child.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          if (node.userData.horizonGlow === true) {
            const material = node.material as MeshBasicMaterial;
            material.opacity = (node.userData.baseOpacity as number) * pulse;
          }
          if (node.userData.horizonFloat === true) {
            node.position.y = (node.userData.floatBaseY as number) + Math.sin(timeSeconds * (node.userData.floatSpeed as number) + (node.userData.floatPhase as number)) * (node.userData.floatAmplitude as number);
          }
          if (node.userData.horizonFragment === true) {
            const fragmentPhase = node.userData.fragmentPhase as number;
            node.position.y = (node.userData.fragmentBaseY as number) + Math.sin(timeSeconds * 0.48 + fragmentPhase) * 0.18;
            node.rotation.y = (node.userData.fragmentBaseRotationY as number) + timeSeconds * 0.08;
          }
          if (node.userData.horizonOrbit === true) {
            node.rotation.z = (node.userData.orbitBaseRotation as number) + timeSeconds * 0.24 + (node.userData.orbitPhase as number);
          }
          if (node.userData.horizonBolt === true) {
            const flicker = Math.sin(timeSeconds * 3.1 + (node.userData.boltPhase as number));
            const material = node.material as MeshBasicMaterial;
            material.opacity = flicker > 0.72 ? 0.72 : 0.08;
          }
        });
      }
    }
  }

  private createDenseChapterBackdrops(): void {
    const bays: ReadonlyArray<readonly [number, number, number, number]> = [
      [-8, 8, 0.35, 0.12], [8.5, 20, 0.55, -0.16], [-9.2, 32, 0.7, 0.2],
      [9.8, 44, 0.85, -0.12], [-10.4, 56, 1, 0.16], [11, 68, 1.12, -0.2],
    ];
    this.addBackdropBays(this.sceneryGroup, 'ch01-backdrop', 'meadow', bays, '#355f43', '#d6b45a');
    this.addBackdropBays(this.viaductSceneryGroup, 'ch02-backdrop', 'viaduct', bays, '#1d3f70', '#70b8e8');
    this.addBackdropBays(this.forgeSceneryGroup, 'ch03-backdrop', 'forge', bays, '#51283a', '#e36b37');
    this.addBackdropBays(this.canopySceneryGroup, 'ch04-backdrop', 'canopy', bays, '#214d3d', '#62bea0');
    this.addBackdropBays(this.archiveSceneryGroup, 'ch05-backdrop', 'archive', bays, '#182751', '#d2b85e');
    this.addBackdropBays(this.horizonSceneryGroup, 'ch06-backdrop', 'horizon', bays, '#4b3564', '#e8d88b');
  }

  private addBackdropBays(
    targetGroup: Group,
    name: string,
    style: BackdropStyle,
    placements: ReadonlyArray<readonly [number, number, number, number]>,
    primaryColor: string,
    accentColor: string,
  ): void {
    for (const [placementIndex, [x, z, scale, rotationY]] of placements.entries()) {
      const bay = this.createBackdropBay(style, primaryColor, accentColor, placementIndex);
      bay.name = `${name}:${placementIndex}`;
      bay.position.set(x, 0, z);
      bay.rotation.y = rotationY;
      bay.scale.setScalar(scale);
      bay.userData.worldZ = z;
      bay.userData.sceneryIndex = targetGroup.children.length;
      bay.userData.lowQualityVisible = placementIndex % 2 === 0;
      targetGroup.add(bay);
    }
  }

  private createBackdropBay(style: BackdropStyle, primaryColor: string, accentColor: string, variant: number): Group {
    const bay = new Group();
    const direction = variant % 2 === 0 ? 1 : -1;
    const primary = new MeshBasicMaterial({ color: primaryColor });
    const accent = new MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.82 });
    const add = (mesh: Mesh, x: number, y: number, z: number, scaleX = 1, scaleY = 1, scaleZ = 1): Mesh => {
      mesh.position.set(x, y, z);
      mesh.scale.set(scaleX, scaleY, scaleZ);
      bay.add(mesh);
      return mesh;
    };

    if (style === 'meadow') {
      add(new Mesh(new SphereGeometry(1.8, 8, 5), primary), 0, 0.02, 0, 2.25, 0.5, 1.35);
      for (const [x, height] of [[-1.3, 1.6], [0.15, 2.1], [1.25, 1.35]] as const) {
        add(new Mesh(new ConeGeometry(0.22, 1, 5), primary), x, height / 2, -0.25, 1, height, 1);
      }
      add(new Mesh(new BoxGeometry(0.18, 1.7, 0.18), accent), direction * 0.7, 1.05, 0.25);
      const flag = add(new Mesh(new ConeGeometry(0.48, 0.85, 3), accent), direction * 1.05, 1.65, 0.25);
      flag.rotation.z = -direction * Math.PI / 2;
    } else if (style === 'viaduct') {
      add(new Mesh(new BoxGeometry(4.2, 0.24, 5.2), primary), 0, 0.12, 0);
      add(new Mesh(new BoxGeometry(0.9, 5.4, 0.9), primary), direction * 0.65, 2.7, 0);
      add(new Mesh(new BoxGeometry(3.8, 0.32, 0.6), primary), 0, 4.5, 0);
      add(new Mesh(new TorusGeometry(0.62, 0.11, 6, 18), accent), -direction * 0.45, 2.7, -0.5);
      add(new Mesh(new BoxGeometry(0.18, 2.8, 0.18), accent), -direction * 1.25, 1.55, 0.2);
    } else if (style === 'forge') {
      add(new Mesh(new BoxGeometry(3.6, 0.18, 4.8), accent), 0, 0.1, 0);
      add(new Mesh(new BoxGeometry(3.1, 3.4, 1.25), primary), 0, 1.7, 0.2);
      add(new Mesh(new BoxGeometry(0.78, 5.4, 0.78), primary), direction * 1.2, 2.7, -0.1);
      add(new Mesh(new TorusGeometry(0.72, 0.14, 6, 18), accent), -direction * 0.45, 1.75, -0.52);
      add(new Mesh(new BoxGeometry(2.1, 0.16, 0.22), accent), -direction * 0.25, 0.72, -0.5);
    } else if (style === 'canopy') {
      add(new Mesh(new SphereGeometry(1.7, 8, 5), primary), 0, 0.02, 0, 2.2, 0.42, 1.4);
      add(new Mesh(new BoxGeometry(0.92, 5.2, 0.92), primary), direction * 0.35, 2.6, 0);
      const branch = add(new Mesh(new BoxGeometry(3.2, 0.42, 0.55), primary), -direction * 0.45, 3.7, 0);
      branch.rotation.z = direction * 0.42;
      add(new Mesh(new SphereGeometry(1.35, 7, 5), primary), -direction * 0.55, 4.9, 0, 1.45, 0.82, 1.1);
      add(new Mesh(new SphereGeometry(0.22, 6, 4), accent), direction * 0.9, 3.1, -0.65);
      add(new Mesh(new SphereGeometry(0.16, 6, 4), accent), -direction * 1.25, 4.25, -0.55);
    } else if (style === 'archive') {
      add(new Mesh(new BoxGeometry(4.2, 0.2, 5.2), primary), 0, 0.1, 0);
      add(new Mesh(new BoxGeometry(0.42, 5.1, 0.8), primary), -1.45, 2.55, 0);
      add(new Mesh(new BoxGeometry(0.42, 5.1, 0.8), primary), 1.45, 2.55, 0);
      add(new Mesh(new BoxGeometry(3.35, 0.38, 0.8), primary), 0, 4.75, 0);
      for (const y of [1.15, 2.15, 3.15]) add(new Mesh(new BoxGeometry(2.45, 0.14, 0.55), accent), 0, y, -0.5);
      add(new Mesh(new SphereGeometry(0.3, 8, 6), accent), direction * 0.8, 4.1, -0.65);
    } else {
      add(new Mesh(new BoxGeometry(4.1, 0.3, 3.8), primary), 0, 0.15, 0);
      add(new Mesh(new OctahedronGeometry(1.15, 0), primary), direction * 0.25, 2.3, 0, 0.9, 2.2, 0.9);
      add(new Mesh(new OctahedronGeometry(0.55, 0), primary), -direction * 1.55, 1.45, -0.4, 0.7, 1.4, 0.7);
      add(new Mesh(new OctahedronGeometry(0.38, 0), accent), direction * 1.55, 3.5, 0.2, 0.6, 1.8, 0.6);
      add(new Mesh(new TorusGeometry(1.55, 0.1, 6, 24), accent), 0, 2.4, -0.55);
    }
    return bay;
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
      this.syncRoadModelVisibility(this.themedChapterId ?? 'ch01_meadow');
    });
  }

  private attachCh01RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch01-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch01-road-model';
    model.scale.set(5.5, 0.16, 3.5);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set((road.userData.roadIndex as number) % 2 === 0 ? '#294f3d' : '#4c7a57');
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
    model.scale.set(5.5, 0.16, 3.5);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = null;
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set((road.userData.roadIndex as number) % 2 === 0 ? '#203d68' : '#38699a');
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
    model.scale.set(5.5, 0.16, 3.5);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = this.getForgeRoadTexture((road.userData.roadIndex as number) % 2);
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#ffffff');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private getForgeRoadTexture(variant: number): CanvasTexture {
    const cached = this.forgeRoadTextures.get(variant);
    if (cached !== undefined) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立熔庭道路貼圖。');

    context.fillStyle = variant === 0 ? '#3d2028' : '#52272c';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#24151e';
    context.lineWidth = 5;
    for (const y of [0, 128, 256]) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    for (const [x, offset] of [[96, 0], [288, 0], [0, 128], [192, 128], [384, 128]] as const) {
      context.beginPath();
      context.moveTo(x, offset);
      context.lineTo(x, offset + 128);
      context.stroke();
    }

    for (const side of [-1, 1] as const) {
      const baseX = side < 0 ? 28 : canvas.width - 28;
      context.strokeStyle = '#7e3429';
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(baseX, 0);
      for (let index = 0; index <= 8; index += 1) {
        context.lineTo(baseX + side * (((index * 17 + variant * 11) % 19) - 9), index * 32);
      }
      context.stroke();
      context.strokeStyle = '#e7652e';
      context.lineWidth = 2;
      context.stroke();
    }

    context.fillStyle = '#6d3937';
    for (let index = 0; index < 18; index += 1) {
      const x = 56 + ((index * 73 + variant * 31) % 270);
      const y = 18 + ((index * 47 + variant * 19) % 220);
      context.fillRect(x, y, 3 + index % 4, 2 + index % 3);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.forgeRoadTextures.set(variant, texture);
    return texture;
  }

  private attachCh04RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch04-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch04-road-model';
    model.scale.set(5.5, 0.16, 3.5);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = this.getCanopyRoadTexture((road.userData.roadIndex as number) % 2);
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#ffffff');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private getCanopyRoadTexture(variant: number): CanvasTexture {
    const cached = this.canopyRoadTextures.get(variant);
    if (cached !== undefined) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立林海道路貼圖。');

    context.fillStyle = variant === 0 ? '#245744' : '#2d674e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#173d32';
    context.lineWidth = 5;
    for (const y of [0, 128, 256]) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    for (const [x, offset] of [[96, 0], [288, 0], [0, 128], [192, 128], [384, 128]] as const) {
      context.beginPath();
      context.moveTo(x, offset);
      context.lineTo(x, offset + 128);
      context.stroke();
    }

    context.strokeStyle = '#709264';
    context.lineWidth = 4;
    for (const side of [-1, 1] as const) {
      const edgeX = side < 0 ? 24 : canvas.width - 24;
      context.beginPath();
      context.moveTo(edgeX, 0);
      for (let index = 0; index <= 8; index += 1) {
        context.lineTo(edgeX + side * (((index * 13 + variant * 7) % 17) - 8), index * 32);
      }
      context.stroke();
    }

    context.fillStyle = '#4f7c58';
    for (let index = 0; index < 28; index += 1) {
      const x = 40 + ((index * 67 + variant * 29) % 300);
      const y = 12 + ((index * 43 + variant * 17) % 230);
      context.beginPath();
      context.ellipse(x, y, 5 + index % 6, 2 + index % 4, (index % 5) * 0.32, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = '#315d43';
    context.lineWidth = 3;
    for (let index = 0; index < 6; index += 1) {
      const x = 62 + index * 52;
      context.beginPath();
      context.moveTo(x, index % 2 === 0 ? 0 : 256);
      context.bezierCurveTo(x - 18, 72, x + 22, 168, x + (index % 2 === 0 ? 15 : -15), index % 2 === 0 ? 132 : 124);
      context.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.canopyRoadTextures.set(variant, texture);
    return texture;
  }

  private attachCh05RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch05-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch05-road-model';
    model.scale.set(5.5, 0.16, 3.5);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = this.getArchiveRoadTexture((road.userData.roadIndex as number) % 2);
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#ffffff');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private getArchiveRoadTexture(variant: number): CanvasTexture {
    const cached = this.archiveRoadTextures.get(variant);
    if (cached !== undefined) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立遺庫道路貼圖。');

    context.fillStyle = variant === 0 ? '#182653' : '#202f63';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#0e1738';
    context.lineWidth = 5;
    for (const y of [0, 128, 256]) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    for (const [x, offset] of [[96, 0], [288, 0], [0, 128], [192, 128], [384, 128]] as const) {
      context.beginPath();
      context.moveTo(x, offset);
      context.lineTo(x, offset + 128);
      context.stroke();
    }

    for (const [lineIndex, x] of [42, 118, 192, 266, 342].entries()) {
      context.strokeStyle = lineIndex === 2 ? '#d9be62' : '#927f47';
      context.lineWidth = lineIndex === 2 ? 3 : 2;
      context.globalAlpha = lineIndex === 2 ? 0.68 : 0.44;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    context.globalAlpha = 1;

    context.fillStyle = '#e2ca72';
    for (let index = 0; index < 18; index += 1) {
      const x = 28 + ((index * 83 + variant * 31) % 328);
      const y = 18 + ((index * 47 + variant * 19) % 220);
      context.globalAlpha = 0.28 + (index % 4) * 0.09;
      context.beginPath();
      context.arc(x, y, 1.2 + index % 3, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.strokeStyle = '#756a78';
    context.lineWidth = 1;
    for (let index = 0; index < 7; index += 1) {
      const startX = 34 + index * 52;
      const startY = 32 + ((index * 39 + variant * 13) % 170);
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(startX + 26, startY + (index % 2 === 0 ? 18 : -16));
      context.lineTo(startX + 42, startY + 4);
      context.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.archiveRoadTextures.set(variant, texture);
    return texture;
  }

  private attachCh06RoadModel(road: Mesh): void {
    if (this.roadModelTemplate === undefined || road.getObjectByName('ch06-road-model') !== undefined) return;
    const model = this.roadModelTemplate.clone(true);
    model.name = 'ch06-road-model';
    model.scale.set(5.5, 0.16, 3.5);
    model.position.y = -0.16;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const material = (child.material as MeshBasicMaterial).clone();
        material.map = this.getHorizonRoadTexture((road.userData.roadIndex as number) % 2);
        material.vertexColors = false;
        if (material.color !== undefined) material.color.set('#ffffff');
        child.material = material;
      }
    });
    model.visible = false;
    road.add(model);
  }

  private getHorizonRoadTexture(variant: number): CanvasTexture {
    const cached = this.horizonRoadTextures.get(variant);
    if (cached !== undefined) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('無法建立地平道路貼圖。');

    context.fillStyle = variant === 0 ? '#392b55' : '#493462';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#211835';
    context.lineWidth = 7;
    for (const y of [0, 128, 256]) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    for (const [x, offset] of [[96, 0], [288, 0], [0, 128], [192, 128], [384, 128]] as const) {
      context.beginPath();
      context.moveTo(x, offset);
      context.lineTo(x, offset + 128);
      context.stroke();
    }

    for (const side of [-1, 1] as const) {
      const edgeX = side < 0 ? 26 : canvas.width - 26;
      context.strokeStyle = '#fff0ac';
      context.lineWidth = 4;
      context.globalAlpha = 0.72;
      context.beginPath();
      context.moveTo(edgeX, 0);
      for (let index = 0; index <= 8; index += 1) {
        context.lineTo(edgeX + side * (((index * 19 + variant * 13) % 23) - 11), index * 32);
      }
      context.stroke();
    }

    context.strokeStyle = '#c4aff0';
    context.lineWidth = 2;
    context.globalAlpha = 0.46;
    for (let index = 0; index < 7; index += 1) {
      const startX = 54 + index * 45;
      const startY = 20 + ((index * 41 + variant * 17) % 196);
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(startX + 19, startY + (index % 2 === 0 ? 20 : -18));
      context.lineTo(startX + 7, startY + (index % 2 === 0 ? 42 : -38));
      context.stroke();
    }
    context.globalAlpha = 1;

    context.fillStyle = '#80659c';
    for (let index = 0; index < 24; index += 1) {
      const x = 38 + ((index * 71 + variant * 23) % 304);
      const y = 14 + ((index * 43 + variant * 29) % 226);
      context.beginPath();
      context.moveTo(x, y - 4);
      context.lineTo(x + 4, y + 2);
      context.lineTo(x - 3, y + 5);
      context.closePath();
      context.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.horizonRoadTextures.set(variant, texture);
    return texture;
  }

  private loadPolyhavenScenery(): void {
    new GLTFLoader().load(POLYHAVEN_ROCK_URL, (gltf) => {
      if (this.isDisposed) return;
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [
        [-7.4, 10, 6.5, 0.35], [7.6, 22, 5.8, -0.7], [-7.8, 38, 6.2, 1.15], [7.7, 56, 5.5, -1.55],
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

  private loadPolyhavenBackgroundKit(): void {
    this.loadGltf(POLYHAVEN_GRASS_MEDIUM_URL, 'Poly Haven Grass Medium 02', (scene) => {
      this.addSceneryModels(scene, this.sceneryGroup, 'ch01-grass', [
        [-6.8, 14, 0.2, 0.38, 0], [6.9, 30, -0.75, 0.34, 0], [-7.1, 46, 0.55, 0.36, 0], [7.2, 62, -1.2, 0.4, 0],
      ], '#7aa86c', 0.2);
    });
    this.loadGltf(POLYHAVEN_SHRUB_URL, 'Poly Haven Shrub 02 (meadow and canopy)', (scene) => {
      this.addSceneryModels(scene, this.sceneryGroup, 'ch01-shrub', [
        [-7, 18, 0.2, 0.42, 0], [7.1, 34, -0.6, 0.38, 0], [-7.3, 50, 0.8, 0.45, 0],
      ], '#5f9567', 0.18);
      this.addSceneryModels(scene, this.canopySceneryGroup, 'ch04-shrub', [
        [7.2, 16, -0.25, 0.42, 0], [-7.2, 30, 0.45, 0.38, 0], [7.2, 54, -0.7, 0.45, 0], [-7.2, 68, 0.15, 0.4, 0],
      ], '#4d8f70', 0.22);
    });
    this.loadGltf(POLYHAVEN_AIRDUCT_URL, 'Poly Haven Modular Airduct Circular 01', (scene) => {
      this.addSceneryModels(scene, this.viaductSceneryGroup, 'ch02-airduct', [
        [-7.2, 18, Math.PI / 2, 0.55, 2.4], [7.2, 34, -Math.PI / 2, 0.5, 2.4], [-7.2, 50, Math.PI / 2, 0.55, 2.4],
      ], '#5e94bf', 0.2);
      this.addSceneryModels(scene, this.forgeSceneryGroup, 'ch03-airduct', [
        [7.2, 20, -Math.PI / 2, 0.62, 2.1], [-7.2, 42, Math.PI / 2, 0.58, 2.1], [7.2, 64, -Math.PI / 2, 0.62, 2.1],
      ], '#c15d43', 0.25);
      this.addSceneryModels(scene, this.horizonSceneryGroup, 'ch06-airduct', [
        [-7.3, 22, Math.PI / 2, 0.55, 2.4], [7.3, 46, -Math.PI / 2, 0.5, 2.4],
      ], '#a995d4', 0.28);
    });
    this.loadGltf(POLYHAVEN_STEEL_SHELVES_URL, 'Poly Haven Steel Frame Shelves 01', (scene) => {
      this.addSceneryModels(scene, this.archiveSceneryGroup, 'ch05-steel-shelf', [
        [7.2, 22, -Math.PI / 2, 1.1, 0], [-7.2, 48, Math.PI / 2, 1.05, 0], [7.2, 70, -Math.PI / 2, 1.1, 0],
      ], '#4b6995', 0.28);
    });
    this.loadGltf(POLYHAVEN_CRYSTALLINE_ICEPLANT_URL, 'Poly Haven Crystalline Iceplant', (scene) => {
      this.addSceneryModels(scene, this.horizonSceneryGroup, 'ch06-crystal-groundcover', [
        [-7.3, 16, 0.2, 0.8, 0.08], [7.3, 34, -0.4, 0.72, 0.08], [-7.3, 52, 0.5, 0.78, 0.08], [7.3, 70, -0.8, 0.68, 0.08],
      ], '#c4b4ff', 0.38);
    });
  }

  private addSceneryModels(
    template: Group,
    targetGroup: Group,
    name: string,
    placements: ReadonlyArray<readonly [number, number, number, number, number?]>,
    tint: string,
    tintAmount: number,
  ): void {
    for (const [x, z, rotationY, scale, y = 0] of placements) {
      const model = template.clone(true);
      model.name = `${name}:${targetGroup.children.length}`;
      model.position.set(x, y, z);
      model.rotation.y = rotationY;
      model.scale.setScalar(scale);
      this.tintSceneryModel(model, tint, tintAmount);
      model.userData.worldZ = z;
      model.userData.sceneryIndex = targetGroup.children.length;
      targetGroup.add(model);
    }
  }

  private tintSceneryModel(model: Group, tint: string, amount: number): void {
    const color = new Color(tint);
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const materials = sourceMaterials.map((source) => {
        const material = source.clone();
        if ('color' in material && material.color instanceof Color) material.color.lerp(color, amount);
        return material;
      });
      child.material = materials.length === 1 ? materials[0]! : materials;
    });
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
        [-6.8, 12, Math.PI / 2], [6.8, 26, -Math.PI / 2], [-6.8, 40, Math.PI / 2], [6.8, 54, -Math.PI / 2],
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
        [6.8, 18, -Math.PI / 2], [-6.8, 34, Math.PI / 2], [6.8, 50, -Math.PI / 2],
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
      const placements: ReadonlyArray<readonly [number, number, number]> = [[-6.9, 16, 0.2], [6.9, 44, -0.4], [-7, 62, 0.7]];
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
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[7.2, 10, -Math.PI / 2, 1.2], [-7.2, 30, Math.PI / 2, 1.05], [7.2, 52, -Math.PI / 2, 1.2]];
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
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[-7.5, 12, 0.2, 1.1], [7.5, 38, -0.35, 0.9], [-7.5, 60, 0.4, 1.15]];
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
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[7, 22, -Math.PI / 2, 1.3], [-7, 48, Math.PI / 2, 1.15], [7, 70, -Math.PI / 2, 1.25]];
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
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[-7, 21, 0.35, 1.35], [7, 51, -0.4, 1.2]];
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
      const placements: ReadonlyArray<readonly [number, number, number, number]> = [[-7.2, 10, Math.PI / 2, 1.45], [7.2, 35, -Math.PI / 2, 1.25], [-7.2, 64, Math.PI / 2, 1.4]];
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
      for (const [x, z, rotationY] of [[-7.2, 14, Math.PI / 2], [7.2, 42, -Math.PI / 2], [-7.2, 68, Math.PI / 2]] as const) {
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

  private syncRoad(snapshot: M1RunSnapshot): void {
    for (const road of this.roadMeshes) {
      const roadIndex = road.userData.roadIndex as number;
      const baseWorldZ = roadIndex * ROAD_SEGMENT_LENGTH + ROAD_SEGMENT_LENGTH / 2;
      road.position.z = getLoopedWorldZ(baseWorldZ, snapshot.distanceMeters, ROAD_LOOP_START_Z, ROAD_LOOP_LENGTH);
    }
  }

  private syncScenery(snapshot: M1RunSnapshot): void {
    for (const group of [this.sceneryGroup, this.viaductSceneryGroup, this.forgeSceneryGroup, this.canopySceneryGroup, this.archiveSceneryGroup, this.horizonSceneryGroup]) {
      for (const prop of group.children) {
        const worldZ = prop.userData.worldZ as number | undefined;
        const index = prop.userData.sceneryIndex as number | undefined;
        if (worldZ === undefined || index === undefined) continue;
        const relativeZ = getLoopedWorldZ(worldZ, snapshot.distanceMeters, SCENERY_VISIBLE_START_Z, SCENERY_LOOP_LENGTH);
        const lowQualityVisible = prop.userData.lowQualityVisible === true || index % 3 === 0;
        prop.position.z = relativeZ;
        prop.visible = relativeZ > SCENERY_VISIBLE_START_Z && relativeZ < SCENERY_VISIBLE_END_Z && (this.qualityMode === 'standard' || lowQualityVisible);
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
