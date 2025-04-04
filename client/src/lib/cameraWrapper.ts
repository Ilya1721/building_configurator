import * as THREE from "three";
import SceneWrapper from "./sceneWrapper";

export default class CameraWrapper {
  constructor(
    private camera: THREE.PerspectiveCamera,
    private scene: THREE.Scene
  ) {
    this.sceneWrapper = new SceneWrapper(scene);
  }

  private sceneWrapper: SceneWrapper | null = null;

  public zoomToFit(sceneBBox: THREE.Box3): void {
    if (!this.sceneWrapper) return;
    const sceneBBoxSize = sceneBBox.getSize(new THREE.Vector3());
    const maxSize = Math.max(sceneBBoxSize.x, sceneBBoxSize.y, sceneBBoxSize.z);
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const distance = maxSize / (2 * Math.tan(fov / 2));
    this.camera.position.z = distance + sceneBBoxSize.z;
  }
}
