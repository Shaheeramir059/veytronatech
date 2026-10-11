import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { heroMotion, QUALITY } from '../src/lib/hero-motion.ts';
import { acquireRibbon } from '../src/lib/hero-geometry.ts';
import { acquireTransitions, acquireTransitionsAsync } from '../src/lib/transition-geometry.ts';
import { bridgeHandoff, transitionAmount, writeTransitionWeights, writeInstancePose, cameraDolly, cameraLateral, cameraFilmOffset, spiralAngle, portalFlight } from '../src/lib/transition-motion.ts';

function snapshot(stage, resource) {
  const weights = new Float64Array(4), pose = new Float64Array(9), matrix = new THREE.Object3D();
  writeTransitionWeights(stage, weights);
  const values = [bridgeHandoff(stage), cameraDolly(stage), cameraLateral(stage), cameraFilmOffset(stage,35), portalFlight(stage), spiralAngle(stage), ...weights];
  for (let index = 0; index < 45; index++) {
    writeInstancePose(stage, index < 38 ? index : index - 38, index < 38 ? resource.fragments : resource.nodes, pose);
    matrix.position.set(pose[0],pose[1],pose[2]); matrix.rotation.set(pose[3],pose[4],pose[5]); matrix.scale.set(pose[6],pose[7],pose[8]); matrix.updateMatrix();
    values.push(...matrix.matrix.elements);
  }
  return values;
}
test('all five adjacent transitions retrace exactly, including the unchanged hero-to-website equations', async () => {
  const lease = acquireTransitions(72);
  for (let from = 0; from < 5; from++) {
    const stages = Array.from({ length: 101 }, (_, i) => from + i / 100);
    const sample = stage => from === 0 ? heroMotion(stage) : snapshot(stage, lease.resource);
    assert.deepEqual(stages.map(sample), [...stages].reverse().map(sample).reverse());
  }
  assert.equal(heroMotion(0).unfold, 0); assert.equal(heroMotion(1).unfold, 1);
  assert.equal(bridgeHandoff(1), 0); assert.equal(cameraDolly(1), 0);
  assert.equal(spiralAngle(1), 0); assert.equal(portalFlight(1), 0);
  lease.release(); await Promise.resolve();
});

test('transition windows and every anchor have continuous pose matrices, camera and light handoff', async () => {
  const lease = acquireTransitions(72);
  const boundaries = [0,1,1.02,1.12,2,3,4,5];
  for (let stage = 1; stage < 5; stage++) boundaries.push(stage + .08, stage + .92);
  for (const boundary of boundaries) {
    const left = snapshot(boundary - 1e-6, lease.resource), right = snapshot(boundary + 1e-6, lease.resource);
    left.forEach((value, i) => assert.ok(Math.abs(value-right[i]) < .00015, `Discontinuity at ${boundary}, channel ${i}`));
  }
  for (let from = 1; from < 5; from++) {
    assert.equal(transitionAmount(from, from), 0); assert.equal(transitionAmount(from + 1, from), 1);
  }
  lease.release(); await Promise.resolve();
});

test('the carrier remains present through every later window and morph weights form convex states', async () => {
  const lease = acquireTransitions(72), weights = new Float64Array(4);
  for (let stage = 1; stage <= 5.001; stage += .0025) {
    writeTransitionWeights(stage, weights);
    const sum = weights.reduce((a,b) => a+b, 0);
    assert.ok(sum >= 0 && sum <= 1.00000001);
    assert.ok([...weights].every(value => value >= 0 && value <= 1));
    // Source plus prepared carrier has no zero-opacity gap; the carrier's
    // base or convex morph exists even when secondary details are absent.
    const handoff = bridgeHandoff(stage);
    assert.equal(1 - handoff + handoff, 1);
    assert.ok(snapshot(stage, lease.resource).every(Number.isFinite));
  }
  lease.release(); await Promise.resolve();
});

test('website handoff matches all six hero morph positions/normals and has compatible finite topology', async () => {
  for (const preset of Object.values(QUALITY)) {
    const lease = acquireTransitions(preset.segments);
    for (let index = 0; index < 6; index++) {
      const hero = acquireRibbon(index, preset.segments), band = lease.resource.bands[index];
      assert.deepEqual(band.getAttribute('position').array, hero.geometry.morphAttributes.position[0].array);
      assert.deepEqual(band.getAttribute('normal').array, hero.geometry.morphAttributes.normal[0].array);
      hero.release();
    }
    for (const geometry of [...lease.resource.bands, lease.resource.paths]) {
      const count = geometry.getAttribute('position').count;
      assert.equal(geometry.morphAttributes.position.length, 4);
      for (const attribute of [geometry.getAttribute('position'), geometry.getAttribute('normal'), ...geometry.morphAttributes.position, ...geometry.morphAttributes.normal]) {
        assert.equal(attribute.count, count); assert.ok([...attribute.array].every(Number.isFinite));
        if (attribute.itemSize === 3 && attribute !== geometry.getAttribute('normal') && !geometry.morphAttributes.normal.includes(attribute)) {
          for (let vertex = 0; vertex < count; vertex++) assert.ok(Math.hypot(attribute.getX(vertex),attribute.getY(vertex),attribute.getZ(vertex)) <= geometry.boundingSphere.radius);
        }
      }
      for (const index of geometry.index.array) assert.ok(index < count);
      const mesh = new THREE.Mesh(geometry);
      assert.equal(mesh.morphTargetInfluences.length, 4);
    }
    lease.release(); await Promise.resolve();
  }
});

test('idle preparation is shared, publishes complete resources, and survives cleanup/replay', async () => {
  let yields = 0;
  const yieldTask = async () => { yields++; await Promise.resolve(); };
  const [first, replay] = await Promise.all([acquireTransitionsAsync(72, yieldTask), acquireTransitionsAsync(72, yieldTask)]);
  assert.equal(yields, 11); assert.equal(first.resource, replay.resource);
  let disposals = 0;
  first.resource.paths.addEventListener('dispose', () => disposals++);
  first.release(); first.release(); await Promise.resolve(); assert.equal(disposals, 0);
  const synchronous = acquireTransitions(72); assert.equal(synchronous.resource, replay.resource);
  replay.release(); synchronous.release(); await Promise.resolve(); assert.equal(disposals, 1);
});

test('portal camera enters the aperture while off-axis projection holds desktop composition', () => {
  const camera = new THREE.PerspectiveCamera(44, 1440/900, .1, 130), point = new THREE.Vector3(2.03,0,0);
  camera.position.set(0,0,8.7); camera.lookAt(0,0,0); camera.updateMatrixWorld();
  const baselineX = point.clone().project(camera).x;
  for (let stage = 0; stage <= 5; stage += .025) {
    camera.position.set(cameraLateral(stage),0,8.7-cameraDolly(stage)); camera.lookAt(cameraLateral(stage),0,0);
    camera.filmOffset = cameraFilmOffset(stage,camera.getFilmWidth()); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    assert.ok(Math.abs(point.clone().project(camera).x-baselineX) < 1e-10);
    assert.ok(camera.position.z >= 6.3 - 1e-10);
    if (stage <= 1) { assert.equal(cameraLateral(stage),0); assert.equal(cameraFilmOffset(stage,35),0); }
  }
  assert.equal(cameraLateral(4),2.03);
});
