import * as THREE from "three";
import { loadObjWithMtl } from "./modelLoader";

export default class BuildingCreator {
  constructor(
    private width: number,
    private height: number,
    private depth: number,
    private scene: THREE.Scene
  ) {}

  private buildingParts: THREE.Group<THREE.Object3DEventMap>[] = [];

  public async build(): Promise<void> {
    await this.buildFloor();
    this.centerBuilding();
  }

  private async buildFloor(): Promise<void> {
    const floor = await loadObjWithMtl(
      "/models/ruberoid_1000x1000x2.obj",
      "/models/ruberoid_1000x1000x2.mtl",
      this.scene
    );
    floor.scale.set(this.width, floor.scale.y, this.depth);
    this.buildingParts.push(floor);
  }

  private centerBuilding(): void {
    const bbox = new THREE.Box3();
    for (const part of this.buildingParts) {
      bbox.expandByObject(part);
    }
    const center = bbox.getCenter(new THREE.Vector3());
    for (const part of this.buildingParts) {
      part.position.sub(center);
    }
  }
}
