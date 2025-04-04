import React, { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls.js";
import { GUI } from "dat.gui";
import './scene.css';
import {
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_COLOR,
  DIRECTIONAL_LIGHT_INTENSITY,
  FAR_PLANE,
  FOV,
  GROUND_COLOR,
  HEMISPHERE_LIGHT_INTENSITY,
  NEAR_PLANE,
  SKY_COLOR,
} from "../common/constants";
import { createGUI } from "../lib/buildingParamsGUI";
import BuildingCreator, { BuildingPart } from "../lib/buildingCreator";
import CameraWrapper from "../lib/cameraWrapper";
import SceneWrapper from "../lib/sceneWrapper";

const Scene: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const cameraWrapperRef = useRef<CameraWrapper>(null);
  const sceneWrapperRef = useRef<SceneWrapper>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const arcballControlsRef = useRef<ArcballControls>(null);
  const guiRef = useRef<GUI>(null);
  const animationFrameIdRef = useRef<number>(null);
  const buildingPartsRef = useRef<BuildingPart[]>([]);

  const handleWindowResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };

  const render = () => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }

  const initArcballControls = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    arcballControlsRef.current = new ArcballControls(cameraRef.current, rendererRef.current.domElement, sceneRef.current);
    arcballControlsRef.current.setGizmosVisible(false);
    arcballControlsRef.current.addEventListener("change", render);
  }, []);

  const initCamera = useCallback(() => {
    if (!sceneRef.current) return;
    const aspectRatio = window.innerWidth / window.innerHeight;
    cameraRef.current = new THREE.PerspectiveCamera(FOV, aspectRatio, NEAR_PLANE, FAR_PLANE);
    cameraWrapperRef.current = new CameraWrapper(cameraRef.current, sceneRef.current);
    window.addEventListener("resize", handleWindowResize);
    initArcballControls();
  }, [initArcballControls]);

  const onBuildClicked = useCallback(async (width: number, height: number, depth: number) => {
    if (!sceneRef.current || !cameraWrapperRef.current || !sceneWrapperRef.current) return;
    const buildingCreator = new BuildingCreator(width, height, depth, sceneRef.current);
    cleanUpPreviousBuildingParts();
    buildingPartsRef.current = await buildingCreator.build();
    cameraWrapperRef.current.zoomToFit(getBuildingPartsBBox());
  }, []);

  const cleanUpPreviousBuildingParts = () => {
    for (const part of buildingPartsRef.current) {
      sceneRef.current?.remove(part);
    }
  }

  const getBuildingPartsBBox = (): THREE.Box3 => {
    const bbox = new THREE.Box3();
    for (const part of buildingPartsRef.current) {
      bbox.expandByObject(part);
    }
    return bbox;
  }

  const initGUI = useCallback(() => {
    guiRef.current = createGUI(onBuildClicked);
  }, [onBuildClicked]);

  const initScene = useCallback(() => {
    sceneRef.current = new THREE.Scene();
    sceneWrapperRef.current = new SceneWrapper(sceneRef.current);
    initRenderer();
    initCamera();
    addLights();
    initGUI();
  }, [initCamera, initGUI]);

  const initRenderer = () => {
    if (!sceneContainerRef.current) return;
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    sceneContainerRef.current.appendChild(rendererRef.current.domElement);
  }

  const addLights = () => {
    if (!sceneRef.current) return;

    const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
    directionalLight.position.set(5, 5, 5);
    sceneRef.current.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(SKY_COLOR, GROUND_COLOR, HEMISPHERE_LIGHT_INTENSITY);
    sceneRef.current.add(hemisphereLight);
  }

  const cleanup = useCallback(() => {
    if (!rendererRef.current || !arcballControlsRef.current || !guiRef.current || !animationFrameIdRef.current) return;
    cancelAnimationFrame(animationFrameIdRef.current);
    window.removeEventListener("resize", handleWindowResize);
    arcballControlsRef.current.removeEventListener("change", render);
    arcballControlsRef.current.dispose();
    guiRef.current.destroy();
    sceneWrapperRef.current?.cleanUp();
    rendererRef.current.dispose();
    rendererRef.current.domElement.remove();
  }, []);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !arcballControlsRef.current) return;
    animationFrameIdRef.current = requestAnimationFrame(animate);
    arcballControlsRef.current.update();
    render();
  }, []);

  useEffect(() => {
    if (!sceneContainerRef.current) return;

    initScene();
    animate();

    return () => {
      cleanup();
    };
  }, [animate, cleanup, initScene]);

  return <div ref={sceneContainerRef} />;
};

export default Scene;
