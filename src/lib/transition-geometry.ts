import * as THREE from "three";
import { acquireRibbon } from "./hero-geometry.ts";

export const NODES = [[-1.8,.9,0],[0,1.75,-.4],[1.8,.9,0],[-1.6,-.9,0],[0,-.2,.55],[1.6,-.9,0],[0,-1.65,-.2]] as const;
export const LINKS = [[0,1],[1,2],[0,4],[2,4],[3,4],[4,5],[3,6],[5,6],[1,4]] as const;
const TAU = Math.PI * 2;
function rotate(x: number, y: number, z: number, rx: number, ry: number, out: THREE.Vector3) {
  // Match Three's default XYZ Euler composition used by the original artwork.
  const xx = x * Math.cos(ry) + z * Math.sin(ry), zz = -x * Math.sin(ry) + z * Math.cos(ry);
  return out.set(xx, y * Math.cos(rx) - zz * Math.sin(rx), y * Math.sin(rx) + zz * Math.cos(rx));
}
function rectangle(t: number, width: number, height: number, out: THREE.Vector3) {
  const p = (t % 1) * 4;
  if (p < 1) out.set(width * (1 - p * 2), height, 0);
  else if (p < 2) out.set(-width, height * (3 - p * 2), 0);
  else if (p < 3) out.set(width * (p * 2 - 5), -height, 0);
  else out.set(width, height * (p * 2 - 7), 0);
  return out;
}

function bandPoint(anchor: number, index: number, t: number, width: number, out: THREE.Vector3) {
  const angle = t * TAU;
  if (anchor === 1) {
    const node = NODES[[0,1,2,3,5,6][index]];
    return rotate(node[0] + Math.cos(angle) * (.32 + width), node[1] + Math.sin(angle) * (.32 + width), node[2], .12, 0, out);
  }
  if (anchor === 2) {
    const radius = [1.22,1.7,2.26,1.91,1.94,1.88][index];
    const strip = index === 0 ? width * 2 : width * .14;
    return rotate(Math.cos(angle) * (radius + strip), Math.sin(angle) * (radius + strip), 0, index === 2 ? Math.PI / 5 + .16 : .16, 0, out);
  }
  if (anchor === 3) {
    const scale = 1 - Math.min(index, 4) * .11;
    const x = Math.sign(Math.cos(angle)) * Math.abs(Math.cos(angle)) ** .12 * (1.6 * scale + width * .16);
    const y = Math.sign(Math.sin(angle)) * Math.abs(Math.sin(angle)) ** .12 * (1.3 * scale + width * .16);
    return rotate(x, y, -index * .65, .15, -.25, out);
  }
  if (index === 2 || index === 3) {
    return rotate(Math.cos(angle) * ((index === 2 ? 2.32 : 2.6) + width * .12), Math.sin(angle) * ((index === 2 ? 2.32 : 2.6) + width * .12), -.3, index === 2 ? 1.2 : .1, index === 2 ? .4 : 1.1, out);
  }
  // Compatible closed strips become the two beveled V arms and their rear rims.
  const side = index % 2 ? 1 : -1;
  rectangle(t, .14 + width * .5, 1.35 + width * .5, out);
  const x = out.x, y = out.y, rotation = -side * .4;
  return out.set(x * Math.cos(rotation) - y * Math.sin(rotation) + side * .53, x * Math.sin(rotation) + y * Math.cos(rotation) + .08, index > 3 ? -.13 : .06);
}

export function transitionBand(index: number, segments: number) {
  const source = acquireRibbon(index, segments);
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(source.geometry.index!.clone());
  geometry.setAttribute("position", source.geometry.morphAttributes.position![0].clone());
  geometry.setAttribute("normal", source.geometry.morphAttributes.normal![0].clone());
  source.release();
  const point = new THREE.Vector3();
  geometry.morphAttributes.position = []; geometry.morphAttributes.normal = [];
  for (let anchor = 1; anchor <= 4; anchor++) {
    const array = new Float32Array((segments + 1) * 9);
    for (let u = 0; u <= segments; u++) for (let v = 0; v <= 2; v++) {
      bandPoint(anchor, index, u / segments, (v / 2 - .5) * .18, point);
      point.toArray(array, u * 9 + v * 3);
    }
    const target = new THREE.BufferGeometry(); target.setIndex(geometry.index!);
    target.setAttribute("position", new THREE.BufferAttribute(array, 3)); target.computeVertexNormals();
    geometry.morphAttributes.position.push(target.getAttribute("position"));
    geometry.morphAttributes.normal.push(target.getAttribute("normal")); target.dispose();
  }
  // Covers all endpoints; additive portal flight moves the object, not its buffers.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5);
  geometry.userData.transitionSegments = segments;
  return geometry;
}

function linkPoint(anchor: number, index: number, t: number, out: THREE.Vector3) {
  if (anchor === 0) return out.set((index % 3 - 1) * 1.5 + (t - .5) * 1.02, .77 - Math.floor(index / 3) * .6, -Math.abs(index % 3 - 1) * .38 - .008);
  if (anchor === 1) {
    const [a,b] = LINKS[index], start = NODES[a], end = NODES[b];
    return rotate(start[0] + (end[0]-start[0])*t, start[1] + (end[1]-start[1])*t, start[2] + (end[2]-start[2])*t, .12, 0, out);
  }
  if (anchor === 2) {
    const angle = (index + t * .94) / 9 * TAU;
    return rotate(Math.cos(angle) * 1.22, Math.sin(angle) * 1.22, .03, .16, 0, out);
  }
  if (anchor === 3) {
    const layer = index % 5, scale = 1 - layer * .11;
    rectangle(t, 1.6 * scale, 1.3 * scale, out);
    return rotate(out.x, out.y, -layer * .65, .15, -.25, out);
  }
  const side = index % 2 ? 1 : -1;
  return out.set(side * (.05 + 1.07 * t), -1.16 + 2.6 * t, .12 + Math.floor(index / 2) * .012);
}

function appendPathAnchor(result: THREE.BufferGeometry, anchor: number, segments: number) {
    const point = new THREE.Vector3();
    const positions: number[] = [], normals: number[] = [], indices: number[] = [];
    for (let path = 0; path < 9; path++) {
      const curve = new THREE.CatmullRomCurve3(Array.from({ length: segments + 1 }, (_, i) => linkPoint(anchor, path, i / segments, point).clone()));
      const tube = new THREE.TubeGeometry(curve, segments, .012, 4, false);
      const offset = positions.length / 3;
      positions.push(...tube.getAttribute("position").array); normals.push(...tube.getAttribute("normal").array);
      for (const value of tube.index!.array) indices.push(value + offset);
      tube.dispose();
    }
    const position = new THREE.Float32BufferAttribute(positions, 3), normal = new THREE.Float32BufferAttribute(normals, 3);
    if (anchor === 0) { result.setAttribute("position", position); result.setAttribute("normal", normal); result.setIndex(indices); }
    else { (result.morphAttributes.position ??= []).push(position); (result.morphAttributes.normal ??= []).push(normal); }
}
/** Open tubes keep identical topology; they never morph into closed surfaces. */
export function transitionPaths(segments: number) {
  const result = new THREE.BufferGeometry();
  for (let anchor = 0; anchor <= 4; anchor++) appendPathAnchor(result, anchor, segments);
  result.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5);
  return result;
}

export function instanceLayouts(count: number, nodes = false) {
  const layouts = Array.from({ length: 5 }, () => new Float32Array(count * 9));
  const point = new THREE.Vector3();
  for (let anchor = 0; anchor < 5; anchor++) for (let i = 0; i < count; i++) {
    let rx = 0, ry = 0, rz = 0, sx = .035, sy = .12, sz = .035;
    if (anchor === 0) {
      const tile = i % 36, panel = Math.floor(tile / 12) - 1, cell = tile % 12;
      point.set(panel * 1.5 + (cell % 3 - 1) * .34, .27 + (Math.floor(cell / 3) - 1.5) * .17, -Math.abs(panel) * .38 - .008);
      sx = nodes ? .08 : .34; sy = nodes ? .08 : .17; sz = nodes ? .005 : .025;
    } else if (anchor === 1) {
      if (nodes) { const p = NODES[i]; rotate(p[0], p[1], p[2], .12, 0, point); sx = sy = sz = i === 4 ? .308 : .22; }
      else { const link = i % 9; linkPoint(1, link, (Math.floor(i / 9) + 1) / 6, point); sx = sz = .025; sy = .08; }
    } else if (anchor === 2) {
      const angle = i / count * TAU;
      rotate(Math.cos(angle) * 1.91, Math.sin(angle) * 1.91, 0, .16, 0, point);
      rx = .16; rz = angle - Math.PI / 2;
      if (nodes) { sx = .065; sy = .11; sz = .065; }
      else sy = (.2 + Math.abs(Math.sin(i * 1.7)) * .35) * (.85 + Math.sin(3 * 3.2 + i * .8) * .26);
    } else if (anchor === 3) {
      const layer = nodes ? i % 5 : Math.floor(i / 8) % 5, scale = 1 - layer * .11;
      rectangle(i / count, 1.6 * scale, 1.3 * scale, point);
      rotate(point.x, point.y, -layer * .65, .15, -.25, point); rx = .15; ry = -.25;
      sx = sz = nodes ? .06 : .025; sy = nodes ? .09 : .16;
    } else {
      const side = i % 2 ? 1 : -1, t = Math.floor(i / 2) / Math.max(1, Math.ceil(count / 2) - 1);
      point.set(side * (.06 + 1.04 * t), -1.16 + 2.6 * t, .14);
      rz = -side * .4; sx = sz = nodes ? .055 : .025; sy = nodes ? .085 : .09;
    }
    layouts[anchor].set([point.x,point.y,point.z,rx,ry,rz,sx,sy,sz], i * 9);
  }
  return layouts;
}

type Resources = { bands: THREE.BufferGeometry[]; paths: THREE.BufferGeometry; fragments: Float32Array[]; nodes: Float32Array[]; users: number; cpuSlices: number[] };
const resources = new Map<number, Resources>();
const pending = new Map<number, Promise<Resources>>();
function leaseResource(segments: number, owned: Resources) {
  owned.users++; let released = false;
  return { resource: owned, release() {
    if (released) return; released = true; owned.users--;
    queueMicrotask(() => {
      if (owned.users !== 0 || resources.get(segments) !== owned) return;
      owned.bands.forEach(geometry => geometry.dispose()); owned.paths.dispose(); resources.delete(segments);
    });
  } };
}
/** Production preloads one ribbon or path anchor per bounded idle slice. */
export async function acquireTransitionsAsync(segments: number, yieldTask: () => Promise<void>) {
  let entry = resources.get(segments);
  if (!entry) {
    let build = pending.get(segments);
    if (!build) {
      build = (async () => {
        const bands: THREE.BufferGeometry[] = [], paths = new THREE.BufferGeometry(), cpuSlices: number[] = [];
        try {
          for (let i = 0; i < 6; i++) { await yieldTask(); const start = performance.now(); bands.push(transitionBand(i, segments)); cpuSlices.push(performance.now() - start); }
          for (let anchor = 0; anchor < 5; anchor++) { await yieldTask(); const start = performance.now(); appendPathAnchor(paths, anchor, segments > 100 ? 24 : 12); cpuSlices.push(performance.now() - start); }
          paths.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5);
          const resource = { bands, paths, fragments: instanceLayouts(38), nodes: instanceLayouts(7, true), users: 0, cpuSlices };
          resources.set(segments, resource); return resource;
        } catch (error) { bands.forEach(geometry => geometry.dispose()); paths.dispose(); throw error; }
      })();
      pending.set(segments, build);
      void build.finally(() => pending.delete(segments)).catch(() => {});
    }
    entry = await build;
  }
  return leaseResource(segments, entry);
}
export function acquireTransitions(segments: number) {
  let entry = resources.get(segments);
  if (!entry) {
    entry = { bands: Array.from({ length: 6 }, (_, i) => transitionBand(i, segments)), paths: transitionPaths(segments > 100 ? 24 : 12), fragments: instanceLayouts(38), nodes: instanceLayouts(7, true), users: 0, cpuSlices: [] };
    resources.set(segments, entry);
  }
  return leaseResource(segments, entry);
}
