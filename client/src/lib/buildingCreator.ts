import * as THREE from "three";
import { loadObjWithMtl } from "./modelLoader";

export type BuildingPart = THREE.Group<THREE.Object3DEventMap>;

interface GroundBeamsData {
  groundBeams: BuildingPart[];
  groundBeamBBox: THREE.Box3;
  heightScale: number;
}

interface RoofBeamsData {
  roofBeamBBox: THREE.Box3;
}

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
    const floorBBox = new THREE.Box3().setFromObject(floor);
    const { groundBeamBBox, heightScale } = await this.buildGroundBeams(floorBBox);
    const { roofBeamBBox } = await this.buildHorizontalRoofBeams(groundBeamBBox);
    await this.buildCornerBeams(groundBeamBBox, heightScale);
    await this.buildRoofInternalLodges(roofBeamBBox);
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

  private async buildGroundBeams(
    floorBBox: THREE.Box3
  ): Promise<GroundBeamsData> {
    const groundBeam = await loadObjWithMtl(
      "/models/balk_150x150x2200.obj",
      "/models/balk_150x150x2200.mtl",
      this.scene
    );

    const groundBeams = [groundBeam, ...this.copyPart(groundBeam, 5)];
    const groundBeamBBox = new THREE.Box3().setFromObject(groundBeam);
    this.moveGroundBeamsToPoints(groundBeams, floorBBox, groundBeamBBox);

    const groundBeamBBoxSize = groundBeamBBox.getSize(new THREE.Vector3());
    const heightScale = this.getScaleFactor(groundBeamBBoxSize.y, this.height);
    this.resizeGroundBeams(groundBeams, heightScale);

    return {
      groundBeams,
      groundBeamBBox,
      heightScale
    };
  }

  private getGroundBeamDepth(groundBeamBBox: THREE.Box3): number {
    return groundBeamBBox.getSize(new THREE.Vector3()).z;
  }

  private getGroundBeamWidth(groundBeamBBox: THREE.Box3): number {
    return groundBeamBBox.getSize(new THREE.Vector3()).x;
  }

  private getRoofBeamWidth(roofBeamBBox: THREE.Box3): number {
    return roofBeamBBox.getSize(new THREE.Vector3()).y;
  }

  private async buildHorizontalRoofBeams(
    groundBeamBBox: THREE.Box3
  ): Promise<RoofBeamsData> {
    const firstRoofBeam = await loadObjWithMtl(
      "/models/balk_150x150x1000.obj",
      "/models/balk_150x150x1000.mtl",
      this.scene
    );

    const roofBeamBBox = new THREE.Box3().setFromObject(firstRoofBeam);
    const groundBeamDepth = this.getGroundBeamDepth(groundBeamBBox);
    const groundBeamWidth = this.getGroundBeamWidth(groundBeamBBox);

    firstRoofBeam.translateY(this.height);
    firstRoofBeam.scale.setX(this.width);
    firstRoofBeam.position.z = -groundBeamDepth * 0.5;
    this.addPart(firstRoofBeam);

    const secondRoofBeam = this.copyPart(firstRoofBeam, 1)[0];
    secondRoofBeam.translateZ(-this.depth + groundBeamDepth);
    this.addPart(secondRoofBeam);

    const thirdRoofBeam = this.copyPart(firstRoofBeam, 1)[0];
    thirdRoofBeam.rotateY(THREE.MathUtils.degToRad(90));
    thirdRoofBeam.scale.setX(this.depth - 2 * groundBeamDepth);
    thirdRoofBeam.translateX(groundBeamDepth * 0.5);
    thirdRoofBeam.translateZ(groundBeamWidth * 0.5);
    this.addPart(thirdRoofBeam);

    const fourthRoofBeam = this.copyPart(thirdRoofBeam, 1)[0];
    fourthRoofBeam.translateZ(this.width - groundBeamWidth);
    this.addPart(fourthRoofBeam);

    return {
      roofBeamBBox
    }
  }

  private async buildCornerBeams(groundBeamBBox: THREE.Box3, heightScale: number) {
    const firstCornerBeam = await loadObjWithMtl(
      "/models/balk_corner.obj",
      "/models/balk_corner.mtl",
      this.scene
    );
    firstCornerBeam.scale.setY(heightScale);

    const groundBeamBBoxSize = groundBeamBBox.getSize(new THREE.Vector3());
    firstCornerBeam.translateZ(-groundBeamBBoxSize.z * 0.5);
    firstCornerBeam.translateX(groundBeamBBoxSize.x);
    this.addPart(firstCornerBeam);

    const secondCornerBeam = this.copyPart(firstCornerBeam, 1)[0];
    const groundBeamWidth = this.getGroundBeamWidth(groundBeamBBox);
    const groundBeamDepth = this.getGroundBeamDepth(groundBeamBBox);
    secondCornerBeam.translateX(this.width - groundBeamWidth * 2);
    secondCornerBeam.rotateY(THREE.MathUtils.degToRad(180));
    this.addPart(secondCornerBeam);

    const thirdCornerBeam = this.copyPart(firstCornerBeam, 1)[0];
    const fourthCornerBeam = this.copyPart(secondCornerBeam, 1)[0];
    thirdCornerBeam.translateZ(-this.depth + groundBeamDepth);
    fourthCornerBeam.translateZ(this.depth - groundBeamDepth);
    this.addPart(thirdCornerBeam);
    this.addPart(fourthCornerBeam);

    const fifthCornerBeam = this.copyPart(firstCornerBeam, 1)[0];
    fifthCornerBeam.rotateY(THREE.MathUtils.degToRad(90));
    fifthCornerBeam.translateZ(-groundBeamWidth * 0.5);
    fifthCornerBeam.translateX(groundBeamDepth * 0.5);
    this.addPart(fifthCornerBeam);

    const sixthCornerBeam = this.copyPart(fifthCornerBeam, 1)[0];
    sixthCornerBeam.translateZ(this.width - groundBeamWidth);
    this.addPart(sixthCornerBeam);

    const seventhCornerBeam = this.copyPart(thirdCornerBeam, 1)[0];
    seventhCornerBeam.rotateY(THREE.MathUtils.degToRad(-90));
    seventhCornerBeam.translateZ(groundBeamWidth * 0.5);
    seventhCornerBeam.translateX(groundBeamDepth * 0.5);
    this.addPart(seventhCornerBeam);

    const eighthCornerBeam = this.copyPart(seventhCornerBeam, 1)[0];
    eighthCornerBeam.translateZ(-this.width + groundBeamWidth);
    this.addPart(eighthCornerBeam);

    const ninethCornerBeam = this.copyPart(fifthCornerBeam, 1)[0];
    ninethCornerBeam.translateX(0.5 * (this.depth - groundBeamDepth));
    this.addPart(ninethCornerBeam);

    const tenthCornerBeam = this.copyPart(ninethCornerBeam, 1)[0];
    tenthCornerBeam.translateZ(this.width - groundBeamWidth);
    this.addPart(tenthCornerBeam);

    const eleventhCornerBeam = this.copyPart(seventhCornerBeam, 1)[0];
    eleventhCornerBeam.translateX(0.5 * (this.depth - groundBeamDepth));
    this.addPart(eleventhCornerBeam);

    const twelvethCornerBeam = this.copyPart(eleventhCornerBeam, 1)[0];
    twelvethCornerBeam.translateZ(-this.width + groundBeamWidth);
    this.addPart(twelvethCornerBeam);
  }

  private async buildRoofInternalLodges(roofBeamBBox: THREE.Box3) {
    const firstLodge = await loadObjWithMtl(
      "/models/Lodge_20x200x1000.obj",
      "/models/Lodge_20x200x1000.mtl",
      this.scene
    );

    const roofBeamWidth = this.getRoofBeamWidth(roofBeamBBox);
    firstLodge.scale.setX(this.width + 0.36);
    firstLodge.translateY(this.height + roofBeamWidth + 0.1);
    firstLodge.translateZ(0.18);
    firstLodge.translateX(-0.18);
    this.addPart(firstLodge);

    const secondLodge = this.copyPart(firstLodge, 1)[0];
    secondLodge.translateZ(-this.depth - 0.36);
    this.addPart(secondLodge);

    const firstLodgeBBox = new THREE.Box3().setFromObject(firstLodge);
    const firstLodgeBBoxSize = firstLodgeBBox.getSize(new THREE.Vector3());
    const thirdLodge = this.copyPart(firstLodge, 1)[0];
    thirdLodge.scale.setX(this.depth + 0.36 - firstLodgeBBoxSize.z);
    thirdLodge.rotateY(THREE.MathUtils.degToRad(90));
    this.addPart(thirdLodge);

    const fourthLodge = this.copyPart(thirdLodge, 1)[0];
    fourthLodge.scale.setX(this.depth + 0.36 + firstLodgeBBoxSize.z);
    fourthLodge.translateZ(this.width + 0.36);
    fourthLodge.translateX(-firstLodgeBBoxSize.z);
    this.addPart(fourthLodge);
  }

  private resizeGroundBeams(
    groundBeams: BuildingPart[],
    heightScale: number
  ) {
    for (const beam of groundBeams) {
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
    const midGroundBeamsPoints = this.getMidGroundBeamsPoints(
      cornerGroundBeamsPoints
    );
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
      groundBeams[cornerIdx].position.copy(
        groundBeams[midIdx].position.clone().add(vec)
      );
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
