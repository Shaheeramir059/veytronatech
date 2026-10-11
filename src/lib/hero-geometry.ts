import * as THREE from "three";

const ribbons = new Map<string, { geometry: THREE.BufferGeometry; users: number }>();
/** Reference-counted cache survives Strict Mode's synchronous effect replay. */
export function acquireRibbon(index: number, segments: number) {
  const key = `${index}:${segments}`;
  let entry = ribbons.get(key);
  if (!entry) { entry = { geometry: ribbonGeometry(index, segments), users: 0 }; ribbons.set(key, entry); }
  entry.users++;
  const resource = entry;
  let released = false;
  return { geometry: resource.geometry, release() {
    if (released) return;
    released = true; resource.users--;
    queueMicrotask(() => {
      if (resource.users === 0 && ribbons.get(key) === resource) { resource.geometry.dispose(); ribbons.delete(key); }
    });
  } };
}

export function ribbonGeometry(index: number, segments: number) {
  const positions: number[] = [], target: number[] = [], indices: number[] = [];
  const panel = Math.floor(index / 2) - 1;
  for (let u = 0; u <= segments; u++) {
    const a = u / segments * Math.PI * 2;
    const r = 1.48 + 0.22 * Math.sin(3 * a + index * 0.85);
    const twist = a * 2 + index * Math.PI / 3;
    for (let v = 0; v <= 2; v++) {
      const width = (v / 2 - 0.5) * 0.18;
      const x = (r + width * Math.cos(twist)) * Math.cos(a);
      const y = (r + width * Math.cos(twist)) * Math.sin(a);
      const z = 0.43 * Math.sin(3 * a + index) + width * Math.sin(twist);
      const tilt = index * Math.PI / 6;
      positions.push(x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt));
      // A rounded superellipse avoids sharp corners and keeps the closed topology.
      const px = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.24) * (0.65 + width);
      const py = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.24) * (1.06 + width);
      target.push(px + panel * 1.5, py, -Math.abs(panel) * 0.38 + (index % 2) * 0.06);
    }
  }
  for (let u = 0; u < segments; u++) for (let v = 0; v < 2; v++) {
    const a = u * 3 + v, b = a + 3;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const unfolded = new THREE.BufferGeometry();
  unfolded.setIndex(indices);
  unfolded.setAttribute("position", new THREE.Float32BufferAttribute(target, 3));
  unfolded.computeVertexNormals();
  geometry.morphAttributes.position = [unfolded.getAttribute("position")];
  geometry.morphAttributes.normal = [unfolded.getAttribute("normal")];
  unfolded.dispose();
  // Bounds must cover both morph endpoints to avoid frustum-culling flicker.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return geometry;
}


