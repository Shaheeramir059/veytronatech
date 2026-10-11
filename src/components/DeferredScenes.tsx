"use client";
import { useEffect, useRef, useState, type ComponentType, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scheduleIdle, scenePreloadDeadline } from "@/lib/loading";
import { mark, measure } from "@/lib/profile";
import { STAGE_SPACING } from "@/lib/scenes";
import { QUALITY } from "@/lib/hero-motion";

let pending: Promise<typeof import("./LaterArtifacts")> | null = null;
function preload() {
  return pending ??= import("./LaterArtifacts").catch(error => { pending = null; throw error; });
}

type ArtifactProps = { index: number; progress: MutableRefObject<number>; mobile: boolean; continuity: MutableRefObject<boolean> };
export function DeferredScenes({ firstFrame, progress, groupRefs, mobile, continuity }: { firstFrame: boolean; progress: MutableRefObject<number>; groupRefs: MutableRefObject<(THREE.Group | null)[]>; mobile: boolean; continuity: MutableRefObject<boolean> }) {
  const [Artifact, setArtifact] = useState<ComponentType<ArtifactProps> | null>(null);
  const [count, setCount] = useState(1);
  const prepared = useRef(new Set<number>());
  const { gl, camera, scene } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const cancel = useRef<(() => void) | null>(null);
  const target = useRef<THREE.WebGLRenderTarget | null>(null);
  const alive = useRef(false);
  const priority = useRef(1);
  useFrame(() => {
    priority.current = scenePreloadDeadline(progress.current);
    if (Artifact && priority.current > count) setCount(priority.current);
  });
  useEffect(() => {
    if (!firstFrame && progress.current < 1) return;
    let active = true;
    mark("later-import-start");
    preload().then(module => {
      mark("later-import-end"); measure("later-code-load", "later-import-start", "later-import-end");
      if (active) setArtifact(() => module.default);
    }).catch(error => console.error("Deferred scene preload failed", error));
    return () => { active = false; };
  }, [firstFrame, progress]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; continuity.current = false; cancel.current?.(); target.current?.dispose(); target.current = null; };
  }, []);
  useEffect(() => { prepared.current.clear(); }, [mobile]);
  useEffect(() => {
    if (!Artifact) return;
    let active = true;
    const next = async () => {
      const index = Array.from({ length: count }, (_, i) => i + 1).find(i => !prepared.current.has(i));
      if (index === undefined) {
        if (count < 5) cancel.current = scheduleIdle(() => setCount(value => value + 1));
        return;
      }
      const group = index === 1 ? groupRefs.current[0] : groups.current[index];
      if (!group) return;
      // The carrier allocates cached geometry in an effect. Wait for its actual
      // meshes before warming or acknowledging the handoff, including resizing.
      if (index === 2) {
        let bands = 0;
        group.traverse(object => {
          if (object instanceof THREE.Mesh && object.name === "continuity-band" && object.geometry.userData.transitionSegments === QUALITY[mobile ? "mobile" : "desktop"].segments) bands++;
        });
        if (bands !== 6) { cancel.current = scheduleIdle(() => { void next().catch(console.error); }); return; }
      }
      const warmScene = new THREE.Scene();
      warmScene.fog = scene.fog;
      warmScene.environment = scene.environment;
      // Clones share geometry/materials. No duplicate GPU buffers or texture uploads.
      const clone = group.clone(true);
      const shareInstances = (source: THREE.Object3D, copy: THREE.Object3D) => {
        if (source instanceof THREE.InstancedMesh && copy instanceof THREE.InstancedMesh) {
          copy.instanceMatrix = source.instanceMatrix; copy.instanceColor = source.instanceColor;
        }
        source.children.forEach((child, i) => shareInstances(child, copy.children[i]));
      };
      shareInstances(group, clone);
      clone.visible = true;
      warmScene.add(clone);
      scene.traverse(object => {
        if (object instanceof THREE.Light) warmScene.add(object.clone());
      });
      clone.traverse(object => { object.frustumCulled = false; object.visible = true; });
      mark(`scene-${index + 1}-compile-start`);
      await gl.compileAsync(warmScene, camera);
      mark(`scene-${index + 1}-compile-end`);
      measure(`scene-${index + 1}-shader-wall`, `scene-${index + 1}-compile-start`, `scene-${index + 1}-compile-end`);
      if (!active || !alive.current) return;
      // A tiny offscreen draw warms geometry uploads without exposing the scene.
      // Keep one reusable target; schedule the draw outside the main frame callback.
      cancel.current = scheduleIdle(() => {
        if (!active || !alive.current) return;
        target.current ??= new THREE.WebGLRenderTarget(1, 1);
        const previous = gl.getRenderTarget();
        try { gl.setRenderTarget(target.current); gl.render(warmScene, camera); }
        finally { gl.setRenderTarget(previous); }
        prepared.current.add(index);
        if (index === 2) continuity.current = true;
        mark(`scene-${index + 1}-prepared`);
        cancel.current = scheduleIdle(() => { void next().catch(console.error); });
      });
    };
    cancel.current = scheduleIdle(() => { void next().catch(console.error); });
    return () => { active = false; cancel.current?.(); };
  }, [Artifact, count, gl, scene, camera, mobile, continuity]);
  return <>{Artifact && [2, 3, 4, 5].filter(index => index <= count).map(index => (
    <group key={index} name={`later-stage-${index}`} visible={false} position={[2.03, 0, -index * STAGE_SPACING]} ref={node => { groups.current[index] = node; groupRefs.current[index] = node; }}>
      <Artifact index={index} progress={progress} mobile={mobile} continuity={continuity} />
    </group>
  ))}</>;
}
