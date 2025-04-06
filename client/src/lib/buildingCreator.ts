import * as THREE from "three";
import { loadObjWithMtl } from "./modelLoader";

export type BuildingPart = THREE.Group<THREE.Object3DEventMap>;

export default class BuildingCreator {
  constructor(
    private width: number,
    private height: number,
    private depth: number,
    private scene: THREE.Scene
  ) {}

  private buildingParts: BuildingPart[] = [];
  private buildingBBox: THREE.Box3 = new THREE.Box3();

  public async build(): Promise<BuildingPart[]> {
    const floor = await this.buildFloor();
    await this.buildGroundBeams(floor);
    await this.buildHorizontalRoofBeams();
    this.centerBuilding();
    return this.buildingParts;
  }

  private async buildFloor(): Promise<BuildingPart> {
    const floor = await loadObjWithMtl(
      "/models/ruberoid_1000x1000x2.obj",
      "/models/ruberoid_1000x1000x2.mtl",
      this.scene
    );
    floor.scale.set(this.width, floor.scale.y, this.depth);
    this.addPart(floor);
    return floor;
  }

  private async buildGroundBeams(floor: BuildingPart): Promise<void> {
    const groundBeam = await loadObjWithMtl(
      "/models/balk_150x150x2200.obj",
      "/models/balk_150x150x2200.mtl",
      this.scene
    );

    const groundBeams = [groundBeam, ...this.copyPart(groundBeam, 5)];
    const groundBeamBBox = new THREE.Box3().setFromObject(groundBeam);
    const floorBBox = new THREE.Box3().setFromObject(floor);

    this.moveGroundBeamsToPoints(
      groundBeams,
      floorBBox,
      groundBeamBBox
    );

    this.resizeGroundBeams(groundBeams, groundBeamBBox);
  }

  private async buildHorizontalRoofBeams(): Promise<void> {
    const roofBeam = await loadObjWithMtl(
      "/models/balk_150x150x1000.obj",
      "/models/balk_150x150x1000.mtl",
      this.scene
    );
    roofBeam.translateY(this.height);
    roofBeam.scale.setX(this.width);
    this.addPart(roofBeam);
  }

  private resizeGroundBeams(groundBeams: BuildingPart[], groundBeamBBox: THREE.Box3) {
    const bboxSize = groundBeamBBox.getSize(new THREE.Vector3());
    for (const beam of groundBeams) {
      const heightScale = this.getScaleFactor(bboxSize.y, this.height);
      beam.scale.setY(heightScale);
    }
  }

  private getScaleFactor(dimension: number, desiredDimension: number) {
    return desiredDimension / dimension;
  }

  private moveGroundBeamsToPoints(
    groundBeams: BuildingPart[],
    floorBBox: THREE.Box3,
    groundBeamBBox: THREE.Box3
  ) {
    const cornerGroundBeamsPoints = this.getCornerGroundBeamsPoints(floorBBox);
    const midGroundBeamsPoints = this.getMidGroundBeamsPoints(cornerGroundBeamsPoints);
    const floorBBoxCenter = floorBBox.getCenter(new THREE.Vector3());
    const groundBeamBBoxSize = groundBeamBBox.getSize(new THREE.Vector3());

    for (let i = 0; i < 2; ++i) {
      this.moveGroundBeamToPoint(
        groundBeams[i],
        floorBBoxCenter,
        midGroundBeamsPoints[i],
        groundBeamBBoxSize.x * 0.5
      );
      this.addPart(groundBeams[i]);
    }

    const moveDistance = this.depth * 0.5 - groundBeamBBoxSize.z * 0.5;
    const moveVector = new THREE.Vector3(0, 0, moveDistance);
    const negMoveVector = moveVector.clone().negate();

    for (let cornerIdx = 2, midIdx = 0; cornerIdx < 6; ++cornerIdx) {
      const vec = cornerIdx % 2 === 1 ? negMoveVector : moveVector;
      groundBeams[cornerIdx].position.copy(groundBeams[midIdx].position.clone().add(vec));
      this.addPart(groundBeams[cornerIdx]);
      midIdx = cornerIdx % 2 === 1 ? midIdx + 1 : midIdx;
    }
  }

  private moveGroundBeamToPoint(
    beam: BuildingPart,
    floorBBoxCenter: THREE.Vector3,
    point: THREE.Vector3,
    distanceToAdjust: number
  ) {
    const moveVector = floorBBoxCenter.clone().sub(point).normalize();
    moveVector.multiplyScalar(distanceToAdjust);
    beam.position.copy(point.clone().add(moveVector));
  }

  private getCornerGroundBeamsPoints(floorBBox: THREE.Box3): THREE.Vector3[] {
    const min = floorBBox.min;
    const max = floorBBox.max;

    const corners = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(min.x, min.y, max.z),
    ];

    return corners;
  }

  private getMidGroundBeamsPoints(corners: THREE.Vector3[]): THREE.Vector3[] {
    const midLeft = new THREE.Vector3()
      .addVectors(corners[0], corners[3])
      .multiplyScalar(0.5);
    const midRight = new THREE.Vector3()
      .addVectors(corners[1], corners[2])
      .multiplyScalar(0.5);

    return [midLeft, midRight];
  }

  private copyPart = (
    part: BuildingPart,
    numberOfCopies: number
  ): BuildingPart[] => {
    const copiedParts: BuildingPart[] = [];

    for (let i = 0; i < numberOfCopies; ++i) {
      const clonedPart = part.clone();
      copiedParts.push(clonedPart);
      this.scene.add(clonedPart);
    }

    return copiedParts;
  };

  private addPart(part: BuildingPart): void {
    this.buildingParts.push(part);
    this.buildingBBox.expandByObject(part);
  }

  private centerBuilding(): void {
    const center = this.buildingBBox.getCenter(new THREE.Vector3());
    for (const part of this.buildingParts) {
      part.position.sub(center);
    }
  }
}
