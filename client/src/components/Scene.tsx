import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import './scene.css';

const Scene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create a Three.js Scene
    const scene = new THREE.Scene();

    // Create a Camera
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.z = 5;

    // Create a Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Create a Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: "blue" });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Add Lighting
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on Component Unmount
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default Scene;
