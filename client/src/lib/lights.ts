import * as THREE from "three";
import {
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_COLOR,
  DIRECTIONAL_LIGHT_INTENSITY,
  GROUND_COLOR,
  HEMISPHERE_LIGHT_INTENSITY,
  SKY_COLOR,
} from "../common/constants";

export default class Lights {
  private ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
  private directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
  private hemisphereLight = new THREE.HemisphereLight(SKY_COLOR, GROUND_COLOR, HEMISPHERE_LIGHT_INTENSITY);

  constructor(private scene: THREE.Scene) {
    this.scene.add(this.ambientLight);
    this.scene.add(this.directionalLight);
    this.scene.add(this.hemisphereLight);
  }
}