import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import * as THREE from 'three';
import { acquireTransitions, acquireTransitionsAsync } from '../src/lib/transition-geometry.ts';
import { writeInstancePose, writeTransitionWeights } from '../src/lib/transition-motion.ts';
const result = { methodology: 'Node CPU generation/cache/update timings; not browser startup, GPU duration or FPS.', presets: {} };
for (const [preset, segments] of [['desktop', 160], ['mobile', 72]]) {
  const started = performance.now(), keeper = await acquireTransitionsAsync(segments, () => new Promise(resolve => setImmediate(resolve))), coldMs = performance.now() - started;
  const resource = keeper.resource, cacheHits = [];
  for (let i = 0; i < 31; i++) {
    const start = performance.now(), lease = acquireTransitions(segments);
    cacheHits.push(performance.now() - start); lease.release();
  }
  const pose = new Float64Array(9), weights = new Float64Array(4), object = new THREE.Object3D(), updateTimings = [];
  for (let i = 0; i < 1201; i++) {
    const stage = 1 + (i % 601) / 150, start = performance.now();
    for (let band = 0; band < 7; band++) writeTransitionWeights(stage, weights);
    for (let fragment = 0; fragment < 45; fragment++) {
      writeInstancePose(stage, fragment < 38 ? fragment : fragment - 38, fragment < 38 ? resource.fragments : resource.nodes, pose);
      object.position.set(pose[0],pose[1],pose[2]); object.rotation.set(pose[3],pose[4],pose[5]); object.scale.set(pose[6],pose[7],pose[8]); object.updateMatrix();
    }
    updateTimings.push(performance.now() - start);
  }
  const geometries = [...resource.bands, resource.paths];
  const geometryBytes = geometries.reduce((sum, geometry) => sum + geometry.index.array.byteLength + Object.values(geometry.attributes).reduce((total, attribute) => total + attribute.array.byteLength, 0) + Object.values(geometry.morphAttributes).flat().reduce((total, attribute) => total + attribute.array.byteLength, 0), 0);
  const triangles = geometries.reduce((sum, geometry) => sum + geometry.index.count / 3, 0);
  cacheHits.sort((a,b) => a-b); updateTimings.sort((a,b) => a-b);
  result.presets[preset] = { nodeSlicedPreparationWallMs: coldMs, preparationCpuSumMs: resource.cpuSlices.reduce((a,b) => a+b, 0), preparationCpuMaxSliceMs: Math.max(...resource.cpuSlices), preparationCpuSlicesMs: resource.cpuSlices, cacheMedianMs: cacheHits[15], cpuPoseMedianMs: updateTimings[600], cpuPoseP95Ms: updateTimings[1140], persistentMorphBytes: geometryBytes, carrierTriangles: triangles };
  keeper.release(); await Promise.resolve();
}
fs.mkdirSync('performance', { recursive: true });
fs.writeFileSync('performance/phase3-cpu.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
