"use client";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { acquireTransitions, acquireTransitionsAsync } from "@/lib/transition-geometry";
import { scheduleIdle } from "@/lib/loading";
import { bridgeHandoff, detailWeight, transitionAmount, writeInstancePose, writeTransitionWeights, portalFlight, spiralAngle } from "@/lib/transition-motion";
import { chromeRim } from "@/lib/chrome";
import { QUALITY } from "@/lib/hero-motion";
import { mark, measure, reportFailure } from "@/lib/profile";

type Props = { index: number; progress: MutableRefObject<number>; mobile: boolean; continuity: MutableRefObject<boolean> };
function chrome(color: string) {
  const material = new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: .22, envMapIntensity: 1.7, side: THREE.DoubleSide, transparent: true });
  material.onBeforeCompile = chromeRim; material.customProgramCacheKey = () => "veytrona-chrome-rim-v1";
  return material;
}
function createMaterials(environment: THREE.Texture | null) {
  const glow = { value: 0 };
  const spiral = { value: 0 };
  const twist = (shader: Parameters<THREE.Material["onBeforeCompile"]>[0]) => {
    shader.uniforms.uSpiral = spiral;
    shader.vertexShader = "uniform float uSpiral;\n" + shader.vertexShader
      .replace("#include <morphtarget_vertex>", "#include <morphtarget_vertex>\nvec2 spiralPoint = transformed.xy; transformed.xy = vec2(cos(uSpiral)*spiralPoint.x-sin(uSpiral)*spiralPoint.y, sin(uSpiral)*spiralPoint.x+cos(uSpiral)*spiralPoint.y);")
      .replace("#include <morphnormal_vertex>", "#include <morphnormal_vertex>\nvec2 spiralNormal = objectNormal.xy; objectNormal.xy = vec2(cos(uSpiral)*spiralNormal.x-sin(uSpiral)*spiralNormal.y, sin(uSpiral)*spiralNormal.x+cos(uSpiral)*spiralNormal.y);");
  };
  const metals = [chrome("#202c3b"), chrome("#536474")];
  metals.forEach(material => { material.envMap = environment; material.onBeforeCompile = shader => { chromeRim(shader); twist(shader); }; material.customProgramCacheKey = () => "veytrona-continuity-chrome-v1"; });
  const paths = new THREE.MeshBasicMaterial({ color: "#55d8ff", transparent: true, depthWrite: false });
  paths.onBeforeCompile = twist; paths.customProgramCacheKey = () => "veytrona-continuity-path-v1";
  const fragments = new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true, transparent: true, depthWrite: false });
  fragments.onBeforeCompile = shader => {
    shader.uniforms.uFragmentLight = glow;
    shader.fragmentShader = "uniform float uFragmentLight;\n" + shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.63, 0.9), uFragmentLight);");
  };
  fragments.customProgramCacheKey = () => "veytrona-fragment-flow-v1";
  return { chrome: metals, paths, nodes: new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, metalness: .5, roughness: .16, emissive: "#55d8ff", emissiveIntensity: .7, transparent: true }), shells: new THREE.MeshBasicMaterial({ color: "#55d8ff", transparent: true, wireframe: true, depthWrite: false }), halo: new THREE.MeshBasicMaterial({ color: "#55d8ff", transparent: true, depthWrite: false }), fragments, glow, spiral };
}
type Package = { resource: ReturnType<typeof acquireTransitions>["resource"]; materials: ReturnType<typeof createMaterials>; release: () => void };

/** One assembly from the website surface to the final V; never unmounted on scroll. */
function ContinuousAssembly({ progress, mobile, continuity }: Omit<Props, "index">) {
  const { scene } = useThree();
  const [assets, setAssets] = useState<Package | null>(null);
  const bands = useRef<(THREE.Mesh | null)[]>([]), paths = useRef<THREE.Mesh>(null);
  const nodes = useRef<THREE.InstancedMesh>(null), shells = useRef<THREE.InstancedMesh>(null), fragments = useRef<THREE.InstancedMesh>(null);
  const scratch = useRef<{ matrix: THREE.Object3D; pose: Float64Array } | null>(null);
  const lastStage = useRef<number | null>(null), lastReady = useRef(false);
  const lastAssets = useRef<Package | null>(null);
  const owned = useRef(new Set<Package>());
  useEffect(() => () => { owned.current.forEach(assets => assets.release()); owned.current.clear(); }, []);
  useEffect(() => {
    let active = true;
    mark("continuity-geometry-start");
    void acquireTransitionsAsync(QUALITY[mobile ? "mobile" : "desktop"].segments, () => new Promise(resolve => { scheduleIdle(resolve); })).then(lease => {
      if (!active) { lease.release(); return; }
      // An explicit map preserves the hero's 1.7 intensity. Three otherwise
      // substitutes scene.environmentIntensity for a material using a scene map.
      const materials = createMaterials(scene.environment); let released = false;
      const next = { resource: lease.resource, materials, release() {
        if (released) return; released = true; lease.release();
        materials.chrome.forEach(material => material.dispose()); materials.paths.dispose(); materials.nodes.dispose(); materials.shells.dispose(); materials.halo.dispose(); materials.fragments.dispose();
      } };
      owned.current.add(next);
      scratch.current = { matrix: new THREE.Object3D(), pose: new Float64Array(9) }; lastStage.current = null;
      setAssets(next);
      mark("continuity-geometry-end"); measure("continuity-preparation-wall", "continuity-geometry-start", "continuity-geometry-end");
    }).catch(error => { if (active) reportFailure("continuity preparation failed", error); });
    return () => { active = false; };
  }, [mobile, scene]);
  useEffect(() => {
    if (!assets || !fragments.current || !nodes.current || !shells.current) return;
    // A quality replacement releases the previous package only after its meshes
    // have been replaced in the commit; keep the old assembly live while building.
    owned.current.forEach(previous => { if (previous !== assets) { previous.release(); owned.current.delete(previous); } });
    const color = new THREE.Color();
    for (let i = 0; i < 38; i++) fragments.current.setColorAt(i, color.set(Math.floor((i % 36) / 12) === 1 ? "#284768" : "#172b43"));
    fragments.current.instanceColor!.needsUpdate = true;
    for (let i = 0; i < 7; i++) nodes.current.setColorAt(i, color.set(i === 4 ? "#55d8ff" : "#7580ff"));
    nodes.current.instanceColor!.needsUpdate = true;
    for (const mesh of [fragments.current, nodes.current, shells.current]) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, [assets]);
  useFrame(() => {
    const stage = progress.current;
    if (!assets || !scratch.current || (lastStage.current === stage && lastReady.current === continuity.current && lastAssets.current === assets)) return;
    lastStage.current = stage; lastReady.current = continuity.current; lastAssets.current = assets;
    const { resource, materials } = assets, handoff = continuity.current ? bridgeHandoff(stage) : 0;
    materials.chrome.forEach(material => { material.opacity = handoff; material.depthWrite = handoff >= .999; });
    materials.paths.opacity = .54 * handoff; materials.nodes.opacity = handoff;
    materials.nodes.depthWrite = handoff >= .999;
    materials.shells.opacity = .36 * handoff; materials.fragments.opacity = handoff * (1 - .12 * transitionAmount(stage, 1));
    materials.glow.value = transitionAmount(stage, 1);
    materials.halo.opacity = .6 * handoff * detailWeight(stage, 2);
    materials.spiral.value = spiralAngle(stage);
    bands.current.forEach((mesh, index) => {
      if (!mesh?.morphTargetInfluences) return;
      writeTransitionWeights(stage, mesh.morphTargetInfluences);
      mesh.position.z = index === 5 ? portalFlight(stage) : 0;
    });
    if (paths.current?.morphTargetInfluences) writeTransitionWeights(stage, paths.current.morphTargetInfluences);
    const { matrix, pose } = scratch.current;
    for (let i = 0; i < 38; i++) {
      writeInstancePose(stage, i, resource.fragments, pose);
      matrix.position.set(pose[0],pose[1],pose[2]); matrix.rotation.set(pose[3],pose[4],pose[5]);
      matrix.scale.set(pose[6],pose[7],pose[8]); matrix.updateMatrix();
      fragments.current?.setMatrixAt(i, matrix.matrix);
    }
    for (let i = 0; i < 7; i++) {
      writeInstancePose(stage, i, resource.nodes, pose);
      matrix.position.set(pose[0],pose[1],pose[2]); matrix.rotation.set(pose[3],pose[4],pose[5]);
      matrix.scale.set(pose[6],pose[7],pose[8]); matrix.updateMatrix(); nodes.current?.setMatrixAt(i, matrix.matrix);
      matrix.scale.multiplyScalar(1.45); matrix.updateMatrix(); shells.current?.setMatrixAt(i, matrix.matrix);
    }
    if (fragments.current) fragments.current.instanceMatrix.needsUpdate = true;
    if (nodes.current) nodes.current.instanceMatrix.needsUpdate = true;
    if (shells.current) shells.current.instanceMatrix.needsUpdate = true;
  });
  return assets ? <group name="continuous-assembly">
    {assets.resource.bands.map((geometry, i) => <mesh key={i} args={[geometry, assets.materials.chrome[i % 2]]} name="continuity-band" dispose={null} ref={node => { bands.current[i] = node; }} />)}
    <mesh args={[assets.resource.paths, assets.materials.paths]} dispose={null} ref={paths} name="continuity-paths" />
    <instancedMesh ref={nodes} args={[undefined, assets.materials.nodes, 7]} frustumCulled={false}><octahedronGeometry args={[1,1]} /></instancedMesh>
    <instancedMesh ref={shells} args={[undefined, assets.materials.shells, 7]} frustumCulled={false}><icosahedronGeometry args={[1,1]} /></instancedMesh>
    <instancedMesh ref={fragments} args={[undefined, assets.materials.fragments, 38]} frustumCulled={false}><boxGeometry args={[1,1,1]} /></instancedMesh>
    <mesh rotation={[1.12,.1,0]} material={assets.materials.halo}><torusGeometry args={[2.55,.009,mobile ? 4 : 8,mobile ? 72 : 130]} /></mesh>
  </group> : null;
}

function VoiceDetail({ progress, mobile }: { progress: MutableRefObject<number>; mobile: boolean }) {
  const sphere = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null);
  const ring = useRef<THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>>(null);
  useFrame(() => {
    const weight = detailWeight(progress.current, 3);
    if (sphere.current) { sphere.current.material.opacity = .72 * weight; sphere.current.scale.setScalar(.5 + weight * .5); }
    if (ring.current) { ring.current.material.opacity = weight; ring.current.scale.setScalar(.85 + weight * .15); }
  });
  return <group rotation={[.16,0,0]}>
    <mesh ref={ring}><torusGeometry args={[1.22,.18,mobile ? 12 : 24,mobile ? 72 : 118]} /><meshStandardMaterial color="#20486c" metalness={.88} roughness={.15} emissive="#175f9a" emissiveIntensity={.75} transparent opacity={0} depthWrite={false} /></mesh>
    <mesh ref={sphere}><sphereGeometry args={[.69,mobile ? 16 : 32,mobile ? 12 : 24]} /><meshBasicMaterial color="#173c70" transparent opacity={0} depthWrite={false} /></mesh>
  </group>;
}
function ImmersiveDetail({ progress }: { progress: MutableRefObject<number> }) {
  const floor = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>>(null), orb = useRef<THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshStandardMaterial>>(null);
  useFrame(() => {
    const stage = progress.current, weight = detailWeight(stage, 4), fold = transitionAmount(stage, 4);
    if (floor.current) { floor.current.material.opacity = .56 * weight; floor.current.rotation.x = -Math.PI / 2 + fold * Math.PI / 2; floor.current.scale.set(1 - fold * .85, 1, 1); floor.current.position.y = -1.27 + fold * 1.1; }
    if (orb.current) { orb.current.scale.setScalar(.25 + weight * .75); orb.current.material.opacity = weight; orb.current.position.z = -2.8 + fold * 2.4; }
  });
  return <group rotation={[.15,-.25,0]}>
    <mesh ref={floor} position={[0,-1.27,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.15,4.2]} /><meshStandardMaterial color="#14243b" metalness={.7} roughness={.2} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    <mesh ref={orb} position={[0,.3,-2.8]}><icosahedronGeometry args={[.7,1]} /><meshStandardMaterial color="#55d8ff" wireframe emissive="#55d8ff" emissiveIntensity={.5} transparent opacity={0} depthWrite={false} /></mesh>
  </group>;
}
function FinaleDetail({ progress }: { progress: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const stage = progress.current, fold = transitionAmount(stage, 4);
    if (group.current) { group.current.scale.setScalar(.001 + fold * .46); group.current.rotation.set(Math.sin(stage * .13) * .08, stage * .09, 0); }
  });
  return <group ref={group} scale={.001} position={[0,.06,-.65]}>
    <mesh><octahedronGeometry args={[1.66,0]} /><meshStandardMaterial color="#b7dff2" metalness={.88} roughness={.2} emissive="#11324c" emissiveIntensity={.18} flatShading /></mesh>
    <mesh scale={1.01}><octahedronGeometry args={[1.66,0]} /><meshBasicMaterial wireframe transparent opacity={.6} color="#55d8ff" depthWrite={false} /></mesh>
  </group>;
}
export default function LaterArtifact({ index, ...props }: Props) {
  switch (index) {
    case 2: return <ContinuousAssembly {...props} />;
    case 3: return <VoiceDetail progress={props.progress} mobile={props.mobile} />;
    case 4: return <ImmersiveDetail progress={props.progress} />;
    default: return <FinaleDetail progress={props.progress} />;
  }
}
