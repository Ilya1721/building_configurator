import * as THREE from "three";

export default class SceneWrapper {
  constructor(private scene: THREE.Scene) {}

  public cleanUp() {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
    this.scene.clear();
  }
}