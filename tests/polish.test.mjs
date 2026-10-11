import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { copyPose, titleFitScale } from '../src/lib/typography-motion.ts';
import { cameraDolly, cameraLateral, cameraFilmOffset, cameraElevation, portalFlight, writeTransitionWeights } from '../src/lib/transition-motion.ts';
import { acquireTransitions } from '../src/lib/transition-geometry.ts';

test('all six copy blocks stay inside reading bounds, with collision-free handoffs and reversible rapid/slow scroll', () => {
  // Heights are representative input measurements, not browser font/layout QA.
  for (const [width, viewport, height, step] of [[1440,900,462,.01],[390,844,368,.01],[430,932,390,.01],[768,1024,462,.01],[1920,1080,490,.01],[1440,900,462,.19],[390,844,368,.19],[430,932,390,.19],[768,1024,462,.19],[1920,1080,490,.19]]) {
    const mobile = width <= 760, spacing = viewport;
    const stages = Array.from({ length: Math.ceil(5 / step) + 1 }, (_, i) => Math.min(5, i * step));
    const sample = stage => Array.from({ length: 6 }, (_, index) => {
      const naturalTop = index * spacing + (mobile ? 110 : (viewport - height) / 2), scroll = stage * spacing;
      const pose = copyPose(stage,index,scroll,naturalTop,height,viewport,mobile,false);
      const top = naturalTop - scroll + pose.shift;
      if (pose.opacity > 0) {
        assert.ok(top >= (mobile ? 100 : 112) - 1e-8);
        assert.ok(top + height <= viewport - (mobile ? 76 : 86) + 1e-8);
      }
      return pose;
    });
    const forward = stages.map(sample);
    assert.deepEqual(forward, [...stages].reverse().map(sample).reverse());
    for (const poses of forward) assert.ok(poses.filter(pose => pose.opacity > .01).length <= 1, 'Two reading blocks must not occupy the slot together');
    for (let index = 0; index < 6; index++) {
      assert.equal(sample(index)[index].opacity, 1);
      assert.equal(sample(index)[index].interactive, true);
      for (const boundary of [index-.5,index-.24,index,index+.24,index+.5]) {
        const before = sample(boundary-1e-6)[index], after = sample(boundary+1e-6)[index];
        assert.ok(Math.abs(before.shift-after.shift) < .003);
        assert.ok(Math.abs(before.opacity-after.opacity) < .0001);
      }
    }
  }
});

test('reduced motion and oversized zoomed copy keep complete normal flow; refreshed font widths fit the column', () => {
  for (const stage of [0,.5,1,2.5,5]) {
    assert.deepEqual(copyPose(stage,2,stage*900,1900,470,900,false,true), { shift:0,opacity:1,interactive:true });
    assert.deepEqual(copyPose(stage,2,stage*844,1800,820,844,true,false), { shift:0,opacity:1,interactive:true });
  }
  for (const width of [306,540,610]) for (const measured of [0,180,480,900]) {
    const factor = titleFitScale(width,measured);
    assert.ok(factor >= 0 && factor <= 1);
    assert.ok(measured * factor <= width);
    assert.equal(titleFitScale(width,measured), factor);
  }
});

test('camera rail preserves hero motion and has continuous position and velocity through all later boundaries', () => {
  const channels = [cameraDolly,cameraLateral,cameraElevation,stage => cameraFilmOffset(stage,35)];
  const derivative = (fn,stage) => (fn(stage+1e-5)-fn(stage-1e-5))/2e-5;
  for (let stage = 0; stage <= 1; stage += .01) {
    assert.equal(cameraDolly(stage),0); assert.equal(cameraLateral(stage),0);
    assert.equal(cameraElevation(stage),.12+Math.sin(stage*Math.PI)*.11);
  }
  for (const boundary of [1,1.08,1.5,1.92,2,2.08,2.92,3,3.08,3.92,4,4.08,4.92,5]) {
    for (const fn of channels) {
      assert.ok(Math.abs(fn(boundary-1e-6)-fn(boundary+1e-6)) < .0001);
      assert.ok(Math.abs(derivative(fn,boundary-1e-5)-derivative(fn,boundary+1e-5)) < .005);
    }
  }
});

test('actual interpolated portal strip maintains near-plane clearance on desktop and mobile', async t => {
  const lease = acquireTransitions(72), geometry = lease.resource.bands[5];
  const mesh = new THREE.Mesh(geometry), point = new THREE.Vector3();
  const camera = new THREE.PerspectiveCamera(44,1440/900,.1,130);
  let minimum = Infinity, oldMinimum = Infinity;
  for (const mobile of [false,true]) for (let stage = 3; stage <= 4.00001; stage += .005) {
    const z = 8.7-cameraDolly(stage), x = mobile ? 0 : cameraLateral(stage);
    camera.position.set(x,cameraElevation(stage),z); camera.lookAt(x,0,z-9); camera.updateMatrixWorld();
    writeTransitionWeights(stage,mesh.morphTargetInfluences);
    const scale = mobile ? .76 : 1;
    for (let vertex = 0; vertex < geometry.getAttribute('position').count; vertex++) {
      mesh.getVertexPosition(vertex,point);
      point.z += portalFlight(stage); point.multiplyScalar(scale); point.x += mobile ? 0 : 2.03;
      minimum = Math.min(minimum,-point.clone().applyMatrix4(camera.matrixWorldInverse).z);
      point.z += (portalFlight(stage)*9/6.4-portalFlight(stage))*scale;
      oldMinimum = Math.min(oldMinimum,-point.applyMatrix4(camera.matrixWorldInverse).z);
    }
  }
  assert.ok(minimum > 2, `Portal clearance ${minimum}`);
  assert.ok(oldMinimum < .5, `Regression reproduction ${oldMinimum}`);
  t.diagnostic(`CPU portal depth sweep: old peak ${oldMinimum.toFixed(4)}, repaired peak ${minimum.toFixed(4)} world units in front of camera (near plane 0.1).`);
  lease.release(); await Promise.resolve();
});
