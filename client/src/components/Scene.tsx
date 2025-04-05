import React, { useEffect, useRef } from "react";
import SceneWrapper from "../lib/sceneWrapper";

const Scene: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneWrapper = SceneWrapper.getInstance();

  useEffect(() => {
    if (!sceneContainerRef.current) return;

    sceneWrapper.addRendererToDOM(sceneContainerRef.current);
    sceneWrapper.animate();

    return () => {
      sceneWrapper.dispose();
    };
  }, [sceneWrapper]);

  return <div ref={sceneContainerRef} />;
};

export default Scene;
