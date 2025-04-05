import * as THREE from "three";
import { FOV, NEAR_PLANE, FAR_PLANE } from "../common/constants";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls";
import Lights from "./lights";
import { createGUI } from "./buildingParamsGUI";
import BuildingCreator, { BuildingPart } from "./buildingCreator";

const rendererParameters: THREE.WebGLRendererParameters = {
  antialias: true,
  alpha: true
};

const createCamera = () => {
  const aspectRatio = window.innerWidth / window.innerHeight;
  return new THREE.PerspectiveCamera(FOV, aspectRatio, NEAR_PLANE, FAR_PLANE);
}

const createRenderer = () => {
  const renderer = new THREE.WebGLRenderer(rendererParameters);
  renderer.setSize(window.innerWidth, window.innerHeight);
  return renderer
}

const createArcballControls = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  render: () => void
) => {
  const arcballControls = new ArcballControls(
    camera,
    renderer.domElement,
    scene
  );
  arcballControls.setGizmosVisible(false);
  arcballControls.addEventListener("change", render);
  return arcballControls;
};

export default class SceneWrapper {
  private static instance: SceneWrapper | null = null;

  public static getInstance(): SceneWrapper {
    if (this.instance === null) {
      this.instance = new SceneWrapper();
    }
    return this.instance;
  }

  private scene = new THREE.Scene();
  private renderer = createRenderer();
  private camera = createCamera();
  private arcballControls = createArcballControls(
    this.camera,
    this.renderer,
    this.scene,
    this.render.bind(this)
  );
  private lights = new Lights(this.scene);
  private animationFrameId: number | null = null;
  private gui = createGUI(this.onBuildClicked.bind(this));
  private buildingParts: BuildingPart[] = [];

  private constructor() {
    window.addEventListener("resize", this.handleWindowResize.bind(this));
  }

  private handleWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private zoomToFit(sceneBBox: THREE.Box3): void {
    const sceneBBoxSize = sceneBBox.getSize(new THREE.Vector3());
    const maxSize = Math.max(sceneBBoxSize.x, sceneBBoxSize.y, sceneBBoxSize.z);
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const distance = maxSize / (2 * Math.tan(fov / 2));
    this.camera.position.z = distance + sceneBBoxSize.z;
  }

  private cleanUpPreviousBuildingParts() {
    for (const part of this.buildingParts) {
      this.scene.remove(part);
    }
  }

  private async onBuildClicked(width: number, height: number, depth: number) {
    this.cleanUpPreviousBuildingParts();
    const buildingCreator = new BuildingCreator(width, height, depth, this.scene);
    this.buildingParts = await buildingCreator.build();
    this.zoomToFit(this.getBuildingPartsBBox());
  };

  private getBuildingPartsBBox() {
    const bbox = new THREE.Box3();
    for (const part of this.buildingParts) {
      bbox.expandByObject(part);
    }
    return bbox;
  }

  private clearScene() {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
    this.scene.clear();
  }

  public animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    this.render();
    this.arcballControls.update();
  }

  public addRendererToDOM(element: HTMLElement) {
    element.appendChild(this.renderer.domElement);
  }

  public dispose() {
    if (!this.animationFrameId) return;
    this.clearScene();
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener("resize", this.handleWindowResize);
    this.arcballControls.removeEventListener("change", this.render);
    this.arcballControls.dispose();
    this.gui.destroy();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    SceneWrapper.instance = null;
  }
}