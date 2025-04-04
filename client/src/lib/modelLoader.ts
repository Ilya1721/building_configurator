import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";

export async function loadObjWithMtl(
  objPath: string,
  mtlPath: string,
  scene: THREE.Scene
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onObjLoaded = (object: THREE.Group<THREE.Object3DEventMap>) => {
      scene.add(object);
      resolve();
    };

    const onObjLoadingFailed = (error: unknown) => {
      console.error("Failed to load .obj file:", error);
      reject(error);
    }

    const onMtlLoaded = (materials: MTLLoader.MaterialCreator) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load(objPath, onObjLoaded, undefined, onObjLoadingFailed);
    };

    const onMtlLoadingFailed = (error: unknown) => {
      console.error("Failed to load .mtl file:", error);
      reject(error);
    }

    const mtlLoader = new MTLLoader();
    mtlLoader.load(mtlPath, onMtlLoaded, undefined, onMtlLoadingFailed);
  });
}
