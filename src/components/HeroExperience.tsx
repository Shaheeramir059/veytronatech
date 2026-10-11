"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { acquireRibbon } from "@/lib/hero-geometry";
import { heroMotion, QUALITY } from "@/lib/hero-motion";
import { mark, measure, profileEnabled, recordFrame, reportFailure } from "@/lib/profile";
import { acquireBloomPipeline, invalidateBloomPipeline, resizeBloomPipeline, renderBloomPipeline, type BloomPipeline } from "@/lib/bloom-pipeline";
import type { MutableRefObject } from "react";
import { chromeRim } from "@/lib/chrome";
import { bridgeHandoff } from "@/lib/transition-motion";

type Props = { progress: MutableRefObject<number>; mobile: boolean };

const environments = new WeakMap<THREE.WebGLRenderer, { map: THREE.WebGLRenderTarget; users: number }>();
function acquireEnvironment(gl: THREE.WebGLRenderer) {
  let entry = environments.get(gl);
  if (!entry) {
    mark("pmrem-start");
    const generator = new THREE.PMREMGenerator(gl), room = new RoomEnvironment();
    try { entry = { map: generator.fromScene(room, 0.04), users: 0 }; environments.set(gl, entry); }
    finally { room.dispose(); generator.dispose(); }
    mark("pmrem-end"); measure("pmrem-cpu-submission", "pmrem-start", "pmrem-end");
  }
  const resource = entry;
  resource.users++;
  let released = false;
  return { texture: resource.map.texture, release() {
    if (released) return;
    released = true; resource.users--;
    queueMicrotask(() => {
      if (resource.users === 0 && environments.get(gl) === resource) { resource.map.dispose(); environments.delete(gl); }
    });
  } };
}

// Six closed, woven metal bands share topology with six website-frame outlines.
// Built-in morph targets interpolate on the GPU; no vertex buffers change per frame.
function Ribbon({ index, progress, mobile, environment, continuity }: Props & { index: number; environment: THREE.Texture | null; continuity: MutableRefObject<boolean> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  // Effect allocation pairs with disposal even during Strict Mode's setup/cleanup cycle.
  useEffect(() => {
    mark(`ribbon-${index}-start`);
    const lease = acquireRibbon(index, QUALITY[mobile ? "mobile" : "desktop"].segments);
    setGeometry(lease.geometry);
    mark(`ribbon-${index}-end`); measure(`ribbon-${index}-cpu`, `ribbon-${index}-start`, `ribbon-${index}-end`);
    return lease.release;
  }, [index, mobile]);
  useFrame(() => {
    if (progress.current > 1.88) return;
    if (mesh.current?.morphTargetInfluences) mesh.current.morphTargetInfluences[0] = heroMotion(progress.current).unfold;
    if (material.current) {
      // Identical frame geometry transfers before its next deformation starts.
      // Keep the source opaque beneath the prepared copy to avoid a dark dip;
      // stop its depth writes during the overlap to prevent coplanar fighting.
      material.current.depthWrite = !continuity.current || bridgeHandoff(progress.current) === 0;
    }
  });
  return geometry ? (
    // Mesh's constructor initializes morphTargetInfluences before any renderer
    // or compiler sees it. Attaching geometry afterward skips that initialization.
    <mesh ref={mesh} name="hero-band" args={[geometry]}>
      <meshStandardMaterial ref={material} transparent color={index % 2 ? "#536474" : "#202c3b"} metalness={1} roughness={0.22} envMap={environment} envMapIntensity={1.7} side={THREE.DoubleSide} onBeforeCompile={chromeRim} customProgramCacheKey={() => "veytrona-chrome-rim-v1"} />
    </mesh>
  ) : null;
}

function WebsitePanel({ index, progress, continuity }: { index: number; progress: MutableRefObject<number>; continuity: MutableRefObject<boolean> }) {
  const group = useRef<THREE.Group>(null);
  const materials = useRef<THREE.Material[]>([]);
  useEffect(() => {
    const owned: THREE.Material[] = [];
    group.current?.traverse(object => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.Material) { object.material.transparent = true; owned.push(object.material); }
    });
    materials.current = owned;
  }, []);
  useFrame(() => {
    if (progress.current > 1.88) return;
    if (!group.current) return;
    const t = heroMotion(progress.current).panels;
    group.current.visible = t > 0.001;
    group.current.scale.setScalar(Math.max(0.001, t));
    group.current.position.set(index * 1.5, (1 - t) * (index % 2 ? 0.3 : -0.3), -Math.abs(index) * 0.38 - 0.04);
    group.current.rotation.y = index * -0.08 * (1 - t);
    const opacity = 1 - (continuity.current ? bridgeHandoff(progress.current) : 0);
    for (let i = 0; i < materials.current.length; i++) materials.current[i].opacity = opacity;
  });
  return (
    <group ref={group} visible={false} name="website-panel">
      <mesh><boxGeometry args={[1.18, 1.96, 0.055]} /><meshStandardMaterial color="#081522" metalness={0.65} roughness={0.3} /></mesh>
      <mesh position={[0, 0.77, 0.032]}><planeGeometry args={[1.02, 0.025]} /><meshBasicMaterial color="#78dcff" /></mesh>
      {[0, 1, 2].map(i => <mesh key={i} position={[-0.38 + i * 0.1, 0.87, 0.033]}><circleGeometry args={[0.018, 8]} /><meshBasicMaterial color="#7991ac" /></mesh>)}
      <mesh position={[0, 0.27, 0.032]}><planeGeometry args={[1.02, 0.68]} /><meshBasicMaterial color={index === 0 ? "#284768" : "#172b43"} /></mesh>
      <mesh position={[-0.17, -0.26, 0.033]}><planeGeometry args={[0.68, 0.055]} /><meshBasicMaterial color="#a9c4d4" /></mesh>
      {[0, 1, 2].map(i => <mesh key={i} position={[-0.09, -0.43 - i * 0.13, 0.033]}><planeGeometry args={[0.84, 0.025]} /><meshBasicMaterial color="#506881" /></mesh>)}
      <mesh position={[-0.29, -0.81, 0.033]}><planeGeometry args={[0.4, 0.11]} /><meshBasicMaterial color="#3e93b2" /></mesh>
    </group>
  );
}

export function HeroExperience({ progress, mobile, firstFrame, continuity }: Props & { firstFrame: boolean; continuity: MutableRefObject<boolean> }) {
  const { gl, scene } = useThree();
  const sculpture = useRef<THREE.Group>(null), core = useRef<THREE.Group>(null);
  const [environment, setEnvironment] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const lease = acquireEnvironment(gl);
    setEnvironment(lease.texture);
    const previous = scene.environment;
    scene.environment = lease.texture;
    return () => { if (scene.environment === lease.texture) scene.environment = previous; lease.release(); };
  }, [gl, scene]);
  const particles = useMemo(() => {
    const count = QUALITY[mobile ? "mobile" : "desktop"].particles;
    return new Float32Array(Array.from({ length: count * 3 }, (_, i) => Math.sin((i + 1) * 127.13) * (i % 3 === 2 ? 1.8 : 2.8)));
  }, [mobile]);
  useFrame(() => {
    if (progress.current > 1.88) return;
    const motion = heroMotion(progress.current);
    if (sculpture.current) sculpture.current.rotation.set(motion.tilt, -motion.tilt * 1.6, motion.tilt * 0.35);
    if (core.current) core.current.scale.setScalar(Math.max(0.001, motion.core));
  });
  return environment ? (
    <group ref={sculpture} name="hero-sculpture">
      {Array.from({ length: 6 }, (_, index) => <Ribbon key={index} index={index} progress={progress} mobile={mobile} environment={environment} continuity={continuity} />)}
      <group ref={core}>
        {/* The two beveled-looking chrome arms form the studio's V silhouette. */}
        {[-1, 1].map(side => <mesh key={side} position={[side * 0.27, 0.04, 0]} rotation={[0.15, side * 0.12, -side * 0.38]}><boxGeometry args={[0.23, 1.27, 0.34]} /><meshStandardMaterial color="#889ba9" metalness={1} roughness={0.17} envMap={environment} envMapIntensity={1.5} /></mesh>)}
        <mesh rotation={[0.3, 0.6, 0]}><torusKnotGeometry args={[0.67, 0.065, mobile ? 72 : 140, 8, 2, 3]} /><meshStandardMaterial color="#344858" metalness={1} roughness={0.24} envMap={environment} /></mesh>
        <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry><pointsMaterial color="#84d8ee" size={mobile ? 0.018 : 0.014} transparent opacity={0.48} depthWrite={false} /></points>
      </group>
      {(firstFrame || progress.current > 0.1) && [-1, 0, 1].map(index => <WebsitePanel key={index} index={index} progress={progress} continuity={continuity} />)}
    </group>
  ) : null;
}

/** A small bright-pass bloom, with half/third-size buffers and no external assets. */
export function HeroBloom({ progress, mobile, onFirstFrame }: Props & { onFirstFrame: () => void }) {
  const { gl, scene, camera, size, viewport } = useThree();
  const pipeline = useRef<BloomPipeline | null>(null);
  const lease = useRef<ReturnType<typeof acquireBloomPipeline> | null>(null);
  const compiled = useRef(false), compiling = useRef(false), first = useRef(false);
  const lastFrame = useRef(0);
  const alive = useRef(false);
  const generation = useRef(0);
  const attemptedSize = useRef("");
  const config = useRef({ width: 1, height: 1, dpr: 1, scale: 0.5 });
  config.current = { width: Math.max(1, size.width), height: Math.max(1, size.height), dpr: viewport.dpr || gl.getPixelRatio(), scale: QUALITY[mobile ? "mobile" : "desktop"].bloomScale };
  const sizeKey = `${config.current.width}:${config.current.height}:${config.current.dpr}:${config.current.scale}`;
  const initialize = useCallback(() => {
    attemptedSize.current = `${config.current.width}:${config.current.height}:${config.current.dpr}:${config.current.scale}`;
    mark("composer-start");
    try {
      const next = acquireBloomPipeline(gl, scene, camera, config.current);
      const previous = lease.current;
      lease.current = next; pipeline.current = next.pipeline;
      previous?.release();
      mark("composer-end"); measure("composer-init", "composer-start", "composer-end");
    } catch (error) {
      pipeline.current = null; lease.current?.release(); lease.current = null;
      reportFailure("bloom initialization failed", error);
    }
  }, [gl, scene, camera]);
  useLayoutEffect(() => {
    alive.current = true; generation.current++;
    compiled.current = false; compiling.current = false;
    initialize();
    const restore = () => {
      generation.current++; compiled.current = false; compiling.current = false;
      if (pipeline.current) invalidateBloomPipeline(pipeline.current);
      initialize();
    };
    gl.domElement.addEventListener("webglcontextrestored", restore);
    return () => {
      alive.current = false; generation.current++;
      gl.domElement.removeEventListener("webglcontextrestored", restore);
      pipeline.current = null; lease.current?.release(); lease.current = null;
    };
  }, [gl, initialize]);
  useLayoutEffect(() => {
    const resource = pipeline.current;
    if (!resource || resource.failed) {
      // An initialization failure gets a fresh attempt when sizing changes;
      // recurring failures are logged per attempt, never retried every frame.
      if (attemptedSize.current !== sizeKey) initialize();
      return;
    }
    try { resizeBloomPipeline(resource, config.current); attemptedSize.current = sizeKey; }
    catch (error) {
      invalidateBloomPipeline(resource); pipeline.current = null;
      lease.current?.release(); lease.current = null;
      reportFailure("bloom resize failed", error);
    }
  }, [sizeKey, initialize]);
  useFrame((_, delta) => {
    const now = performance.now();
    const profiling = profileEnabled();
    if (profiling) { gl.info.autoReset = false; gl.info.reset(); }
    if (!compiled.current && !compiling.current) {
      let bands = 0;
      scene.traverse(object => { if (object.name === "hero-band") bands++; });
      if (bands === 6) {
        compiling.current = true;
        const attempt = generation.current;
        mark("hero-shader-start");
        void gl.compileAsync(scene, camera).then(() => {
          if (!alive.current || generation.current !== attempt) return;
          compiled.current = true;
          mark("hero-shader-end"); measure("hero-shader-wall", "hero-shader-start", "hero-shader-end");
        }).catch(error => {
          if (!alive.current || generation.current !== attempt) return;
          // Retain the visible scene fallback; avoid an unbounded compile retry loop.
          compiled.current = true; reportFailure("hero shader preparation failed", error);
        });
      }
    }
    // Let compileAsync finish before rendering the opening sculpture. This uses
    // KHR_parallel_shader_compile where supported rather than a forced gl.finish.
    if (!compiled.current && progress.current < 1) return;
    if (!first.current) mark("first-frame-submit-start");
    const bloomed = pipeline.current && progress.current < 1 && renderBloomPipeline(
      pipeline.current, heroMotion(progress.current).bloom, delta,
      error => reportFailure("bloom render failed", error)
    );
    if (pipeline.current?.failed) {
      pipeline.current = null; lease.current?.release(); lease.current = null;
    }
    if (!bloomed) gl.render(scene, camera);
    if (!first.current && compiled.current) {
      first.current = true;
      mark("first-frame-submit-end"); measure("first-frame-cpu-submit", "first-frame-submit-start", "first-frame-submit-end");
      mark("first-3d-submitted"); measure("hero-startup", "world-import-start", "first-3d-submitted");
      onFirstFrame();
    }
    if (profiling && lastFrame.current && now - lastFrame.current < 1000) recordFrame({ ms: now - lastFrame.current, calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures });
    lastFrame.current = now;
  }, 1);
  return null;
}


