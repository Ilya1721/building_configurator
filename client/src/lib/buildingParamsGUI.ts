import { GUI } from "dat.gui";
import { BUILDING_DIMENSION_STEP, MAX_BUILDING_DIMENSION, MIN_BUILDING_DIMENSION } from "../common/constants";

export const createGUI = (
  onBuildClicked: (width: number, height: number, depth: number) => void
): GUI => {
  const params = {
    width: MIN_BUILDING_DIMENSION,
    height: MIN_BUILDING_DIMENSION,
    depth: MIN_BUILDING_DIMENSION,
    build: () => {
      onBuildClicked(params.width, params.height, params.depth);
    },
  };

  const gui = new GUI();
  gui.add(params, "width", MIN_BUILDING_DIMENSION, MAX_BUILDING_DIMENSION).step(BUILDING_DIMENSION_STEP);
  gui.add(params, "height", MIN_BUILDING_DIMENSION, MAX_BUILDING_DIMENSION).step(BUILDING_DIMENSION_STEP);
  gui.add(params, "depth", MIN_BUILDING_DIMENSION, MAX_BUILDING_DIMENSION).step(BUILDING_DIMENSION_STEP);
  gui.add(params, "build");

  return gui;
};
