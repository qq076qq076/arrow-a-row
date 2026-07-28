import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  BoxGeometry,
} from 'three';

export class ThreeRuntime {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.1, 100);
  private readonly renderer: WebGLRenderer;
  private readonly demoMesh: Mesh<BoxGeometry, MeshBasicMaterial>;

  public constructor(private readonly container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(new Color('#173b3a'));
    this.container.append(this.renderer.domElement);

    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);

    this.demoMesh = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: '#f4c95d' }),
    );
    this.scene.add(this.demoMesh);

    this.resize();
  }

  public resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public render(interpolationAlpha: number): void {
    this.demoMesh.rotation.y += 0.01 * interpolationAlpha;
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.demoMesh.geometry.dispose();
    this.demoMesh.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
