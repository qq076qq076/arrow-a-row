import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three';
import type { M1RunSnapshot } from '../domain/M1RunSimulation';

const ENEMY_MATERIALS = {
  melee: new MeshBasicMaterial({ color: '#c76b7a' }),
  ranged: new MeshBasicMaterial({ color: '#b48cdb' }),
};

export class ThreeRuntime {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.1, 100);
  private readonly renderer: WebGLRenderer;
  private readonly playerMesh = new Mesh(new BoxGeometry(0.8, 1.2, 0.8), new MeshBasicMaterial({ color: '#f4c95d' }));
  private readonly bossMesh = new Mesh(new BoxGeometry(2.4, 2.2, 1.4), new MeshBasicMaterial({ color: '#6ea65a' }));
  private readonly enemyMeshes = new Map<string, Mesh>();
  private readonly arrowMeshes = new Map<number, Mesh>();
  private readonly gateGroups = new Map<string, Group>();

  public constructor(private readonly container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(new Color('#173b3a'));
    this.container.append(this.renderer.domElement);
    this.camera.position.set(0, 10, 10);
    this.camera.lookAt(0, 0, 13);
    this.scene.add(this.playerMesh);
    this.scene.add(this.bossMesh);
    this.bossMesh.visible = false;
    this.resize();
  }

  public resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public sync(snapshot: M1RunSnapshot): void {
    this.playerMesh.position.set(snapshot.player.x, 0.6, 0);
    this.syncGates(snapshot);
    this.syncEnemies(snapshot);
    this.syncArrows(snapshot);
    this.syncBoss(snapshot);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.playerMesh.geometry.dispose();
    this.playerMesh.material.dispose();
    this.disposeMesh(this.bossMesh);
    for (const mesh of this.enemyMeshes.values()) this.disposeMesh(mesh);
    for (const mesh of this.arrowMeshes.values()) this.disposeMesh(mesh);
    for (const group of this.gateGroups.values()) group.traverse((child) => {
      if (child instanceof Mesh) this.disposeMesh(child);
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private syncBoss(snapshot: M1RunSnapshot): void {
    const boss = snapshot.boss;
    this.bossMesh.visible = boss !== undefined && !boss.isDefeated;
    if (boss === undefined || boss.isDefeated) return;
    this.bossMesh.position.set(0, 1.1, 15);
    const material = this.bossMesh.material as MeshBasicMaterial;
    material.color.set(boss.telegraphSeconds > 0 ? '#f4c95d' : boss.phase === 2 ? '#b7774f' : '#6ea65a');
    this.bossMesh.scale.setScalar(boss.telegraphSeconds > 0 ? 1.08 : 1);
  }

  private syncGates(snapshot: M1RunSnapshot): void {
    for (const gate of snapshot.gates) {
      let group = this.gateGroups.get(gate.groupId);
      if (group === undefined) {
        group = new Group();
        const left = new Mesh(new BoxGeometry(2, 2.5, 0.25), new MeshBasicMaterial({ color: '#5bb5d8' }));
        const right = new Mesh(new BoxGeometry(2, 2.5, 0.25), new MeshBasicMaterial({ color: '#8ccf9b' }));
        left.position.x = -2.5;
        right.position.x = 2.5;
        group.add(left, right);
        this.gateGroups.set(gate.groupId, group);
        this.scene.add(group);
      }
      group.position.z = gate.z - snapshot.distanceMeters;
      group.visible = !gate.isChosen;
    }
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
        mesh = new Mesh(new BoxGeometry(0.9, 1.1, 0.9), ENEMY_MATERIALS[enemy.kind]);
        this.enemyMeshes.set(enemy.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(enemy.x, 0.55, enemy.z);
      mesh.scale.setScalar(enemy.telegraphSeconds > 0 ? 1.25 : 1);
    }
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

  private disposeMesh(mesh: Mesh): void {
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
    else if (mesh.material !== ENEMY_MATERIALS.melee && mesh.material !== ENEMY_MATERIALS.ranged) mesh.material.dispose();
  }
}
