"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import { SCENES, STAGE_SPACING } from "@/lib/scenes";

import { HeroExperience, HeroBloom } from "./HeroExperience";
import { QUALITY } from "@/lib/hero-motion";
import { heroMotion } from "@/lib/hero-motion";
import { bridgeHandoff, cameraDolly, cameraLateral, cameraFilmOffset, cameraElevation, detailWeight } from "@/lib/transition-motion";
import { DeferredScenes } from "./DeferredScenes";
import { mark, measure } from "@/lib/profile";

type WorldProps = { progress: MutableRefObject<number>; onReady?: () => void; paused?: boolean };

const COLORS = {
  cyan: "#55d8ff",
  violet: "#7580ff",
  silver: "#b4cad8",
  dark: "#091525",
};

function FrameStars({ progress }: WorldProps) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(290 * 3);
    for (let i = 0; i < 290; i++) {
      const t = i + 1;
      arr[i * 3 + 0] = Math.sin(t * 91.431) * 21;
      arr[i * 3 + 1] = Math.sin(t * 43.9) * 12;
      arr[i * 3 + 2] = -55 + ((t * 19.73) % 72);
    }
    return arr;
  }, []);
  useFrame(() => {
    if (points.current) points.current.rotation.z = progress.current * .015;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#90c9ff" opacity={0.55} transparent depthWrite={false} />
    </points>
  );
}

function CameraJourney({ progress, mobile, firstFrame }: WorldProps & { mobile: boolean; firstFrame: boolean }) {
  const { camera, size } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const continuity = useRef(false);
  const lightRig = useRef<THREE.Group>(null), lightTilt = useRef<THREE.Group>(null);


  useFrame(() => {
    const current = Math.max(0, Math.min(SCENES.length - 1, progress.current));
    const cameraZ = 8.7 - current * STAGE_SPACING - cameraDolly(current);
    const axisX = mobile ? 0 : cameraLateral(current);
    camera.position.set(axisX, cameraElevation(current), cameraZ);
    camera.lookAt(axisX, 0, cameraZ - 9);
    if (camera instanceof THREE.PerspectiveCamera) {
      const offset = mobile ? 0 : cameraFilmOffset(current, camera.getFilmWidth());
      if (camera.filmOffset !== offset) { camera.filmOffset = offset; camera.updateProjectionMatrix(); }
    }

    groups.current.forEach((group, i) => {
      if (!group) return;
      // The carrier stays in the camera's moving world for the whole journey.
      // Secondary details overlap it; entire scenes no longer scale in/out.
      group.visible = i === 0 ? (!continuity.current || bridgeHandoff(current) < 1) : i === 2 ? continuity.current && current >= 1.02 : i > 2 && detailWeight(current, i) > .00001;
      const scale = mobile ? Math.min(0.76, size.width / size.height * 1.05) : 1;
      group.scale.setScalar(Math.max(scale, 0.001));
      group.position.x = mobile ? 0 : 2.03;
      group.position.y = 0;
      group.position.z = -current * STAGE_SPACING;
      group.rotation.z = Math.sin(current * 0.7) * 0.055;
    });
    if (lightRig.current) {
      lightRig.current.position.set(mobile ? 0 : 2.03, 0, -current * STAGE_SPACING);
      lightRig.current.scale.setScalar(mobile ? Math.min(.76, size.width / size.height * 1.05) : 1);
      lightRig.current.rotation.z = Math.sin(current * .7) * .055;
    }
    if (lightTilt.current) {
      const tilt = heroMotion(current).tilt;
      lightTilt.current.rotation.set(tilt, -tilt * 1.6, tilt * .35);
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 5]} intensity={3} color="#b7e9ff" />
      <directionalLight position={[-4, -1, 2]} intensity={1.3} color="#424ea8" />
      <fog attach="fog" args={[COLORS.dark, 11, 35]} />
      <FrameStars progress={progress} />
      <group ref={lightRig}><group ref={lightTilt}>
        <pointLight position={[2.4,1.8,2]} color="#a4e9ff" intensity={22} distance={8} />
        <pointLight position={[-2.8,-.6,-1]} color="#168cca" intensity={18} distance={7} />
        <pointLight position={[0,3,-1]} color="#dbefff" intensity={12} distance={6} />
      </group></group>
      {SCENES.slice(0, 2).map((scene, i) => (
        <group
          key={scene.id}
          position={[2.03, 0, -i * STAGE_SPACING]}
          ref={(node) => { groups.current[i] = node; }}
        >
          {i === 0 && <HeroExperience progress={progress} mobile={mobile} firstFrame={firstFrame} continuity={continuity} />}
        </group>
      ))}
      <DeferredScenes firstFrame={firstFrame} progress={progress} groupRefs={groups} mobile={mobile} continuity={continuity} />
    </>
  );
}

function World({ progress, onReady, paused = false }: WorldProps) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches);
  const [firstFrame, setFirstFrame] = useState(false);
  const ready = useRef(false);
  const handleFrame = useRef(() => {
    if (ready.current) return;
    ready.current = true; setFirstFrame(true); onReady?.();
  });
  const [suspended, setSuspended] = useState(false);
  useEffect(() => {
    const update = () => setSuspended(document.hidden);
    update(); document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <Canvas
      frameloop={suspended || paused ? "never" : "always"}
      camera={{ fov: 44, near: 0.1, far: 130, position: [0, 0, 8.7] }}
      dpr={[1, QUALITY[mobile ? "mobile" : "desktop"].dpr]}
      gl={defaults => {
        mark("webgl-context-start");
        const context = (defaults.canvas as HTMLCanvasElement).getContext("webgl2", { antialias: true, alpha: true, powerPreference: "high-performance" });
        mark("webgl-context-end"); measure("webgl-context", "webgl-context-start", "webgl-context-end");
        if (!context) throw new Error("WebGL 2 is unavailable");
        mark("renderer-start");
        const renderer = new THREE.WebGLRenderer({ ...defaults, context, antialias: true, alpha: true, powerPreference: "high-performance" });
        mark("renderer-end"); measure("renderer-construction", "renderer-start", "renderer-end");
        return renderer;
      }}
      onCreated={() => { mark("canvas-mounted"); measure("canvas-startup", "world-import-start", "canvas-mounted"); }}
      fallback={<div className="fallback-object" aria-hidden="true"><span>V</span></div>}
    >
      <CameraJourney progress={progress} mobile={mobile} firstFrame={firstFrame} />
      <HeroBloom progress={progress} mobile={mobile} onFirstFrame={handleFrame.current} />
    </Canvas>
  );
}

export default memo(World);


