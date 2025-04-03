import React, { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls.js";
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

const Scene: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const arcballControlsRef = useRef<ArcballControls>(null);

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
    const aspectRatio = window.innerWidth / window.innerHeight;
    cameraRef.current = new THREE.PerspectiveCamera(FOV, aspectRatio, NEAR_PLANE, FAR_PLANE);
    cameraRef.current.position.z = 5;
    window.addEventListener("resize", handleWindowResize);
    initArcballControls();
  }, [initArcballControls]);

  const initScene = useCallback(() => {
    sceneRef.current = new THREE.Scene();
    initRenderer();
    initCamera();
    addLights();
  }, [initCamera]);

  const initRenderer = () => {
    if (!sceneContainerRef.current) return;
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
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
    if (!rendererRef.current || !arcballControlsRef.current) return;
    sceneContainerRef.current?.removeChild(rendererRef.current.domElement);
    window.removeEventListener("resize", handleWindowResize);
    arcballControlsRef.current.removeEventListener("change", render);
  }, []);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !arcballControlsRef.current) return;
    requestAnimationFrame(animate);
    arcballControlsRef.current.update();
    render();
  }, []);

  const loadModel = () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: "blue" });
    const cube = new THREE.Mesh(geometry, material);
    sceneRef.current?.add(cube);
  }

  useEffect(() => {
    if (!sceneContainerRef.current) return;

    initScene();
    loadModel();
    animate();

    return () => {
      cleanup();
    };
  }, [animate, cleanup, initScene]);

  return <div ref={sceneContainerRef} />;
};

export default Scene;
