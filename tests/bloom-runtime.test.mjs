import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { acquireBloomPipeline, resizeBloomPipeline, renderBloomPipeline } from '../src/lib/bloom-pipeline.ts';
import { ribbonGeometry } from '../src/lib/hero-geometry.ts';
import { heroMotion } from '../src/lib/hero-motion.ts';
import { rendererHarness } from './helpers/renderer.mjs';

const size = { width: 1440, height: 900, dpr: 1.5, scale: .5 };
function sceneWithRibbon() {
  const geometry = ribbonGeometry(0, 160);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  const scene = new THREE.Scene(); scene.add(mesh);
  return { geometry, mesh, scene, camera: new THREE.PerspectiveCamera() };
}

test('old attachment path reproduces exact installed Three.js .length error in RenderPass', () => {
  const gl = rendererHarness(), model = sceneWithRibbon();
  const uninitialized = new THREE.Mesh();
  uninitialized.geometry = model.geometry;
  model.scene.clear(); model.scene.add(uninitialized);
  const lease = acquireBloomPipeline(gl, model.scene, model.camera, size);
  assert.throws(() => lease.pipeline.composer.render(1 / 60), error => {
    assert.match(error.message, /Cannot read properties of undefined \(reading 'length'\)/);
    assert.match(error.stack, /WebGLMorphtargets\.js:140/);
    assert.match(error.stack, /RenderPass\.render/);
    assert.match(error.stack, /EffectComposer\.render/);
    return true;
  });
  lease.release(); model.geometry.dispose();
});

test('initialized ribbon renders through all real composer passes forward and backward', () => {
  const gl = rendererHarness(), model = sceneWithRibbon();
  const lease = acquireBloomPipeline(gl, model.scene, model.camera, size);
  const errors = [];
  for (const stage of [0, .12, .46, .7, 1, .7, .46, .12, 0]) {
    model.mesh.morphTargetInfluences[0] = heroMotion(stage).unfold;
    assert.equal(renderBloomPipeline(lease.pipeline, heroMotion(stage).bloom, 1 / 60, error => errors.push(error)), true);
  }
  assert.equal(errors.length, 0);
  assert.equal(gl.weights.length, 9);
  assert.ok(gl.calls > gl.weights.length); // Includes bright/blur/composite/output draws.
  lease.release(); model.geometry.dispose(); model.mesh.material.dispose();
});

test('composer sizing and DPR are ready before first frame and after desktop/mobile resize', () => {
  const gl = rendererHarness(), model = sceneWithRibbon();
  const lease = acquireBloomPipeline(gl, model.scene, model.camera, size);
  const resource = lease.pipeline;
  assert.equal(resource.ready, true);
  assert.equal(resource.composer.readBuffer.width, 2160);
  assert.equal(resource.composer.readBuffer.height, 1350);
  assert.equal(resource.bloom.renderTargetBright.width, 360);
  for (const next of [{ width: 390, height: 240, dpr: 1.15, scale: .3 }, size, { width: 1, height: 1, dpr: 1, scale: .3 }]) {
    resizeBloomPipeline(resource, next);
    assert.equal(resource.composer.readBuffer.width, next.width * next.dpr);
    for (const target of [...resource.bloom.renderTargetsHorizontal, ...resource.bloom.renderTargetsVertical]) {
      assert.ok(target.width >= 1 && target.height >= 1);
    }
    assert.equal(renderBloomPipeline(resource, .17, .016, assert.fail), true);
  }
  lease.release(); model.geometry.dispose(); model.mesh.material.dispose();
});

test('Strict Mode ownership replay retains live passes, final cleanup disposes once', async () => {
  const gl = rendererHarness(), model = sceneWithRibbon();
  for (let refresh = 0; refresh < 5; refresh++) {
    const first = acquireBloomPipeline(gl, model.scene, model.camera, size), original = first.pipeline;
    let targetDisposals = 0, shaderDisposals = 0;
    original.composer.renderTarget1.addEventListener('dispose', () => targetDisposals++);
    original.bloom.materialHighPassFilter.addEventListener('dispose', () => shaderDisposals++);
    first.release(); first.release();
    const replay = acquireBloomPipeline(gl, model.scene, model.camera, size);
    assert.equal(replay.pipeline, original);
    await Promise.resolve();
    assert.equal(original.disposed, false);
    assert.equal(targetDisposals, 0);
    assert.equal(renderBloomPipeline(original, .17, .016, assert.fail), true);
    replay.release();
    await Promise.resolve();
    assert.equal(original.disposed, true);
    assert.equal(targetDisposals, 1);
    assert.equal(shaderDisposals, 1);
    assert.equal(renderBloomPipeline(original, .17, .016, assert.fail), false);
  }
  model.geometry.dispose(); model.mesh.material.dispose();
});

test('cache separates scenes/cameras, and one owner cannot dispose another owner’s pipeline', async () => {
  const gl = rendererHarness(), model = sceneWithRibbon();
  const first = acquireBloomPipeline(gl, model.scene, model.camera, size);
  const second = acquireBloomPipeline(gl, model.scene, model.camera, size);
  const otherScene = new THREE.Scene(), otherCamera = new THREE.PerspectiveCamera();
  const a = acquireBloomPipeline(gl, otherScene, model.camera, size);
  const b = acquireBloomPipeline(gl, model.scene, otherCamera, size);
  assert.notEqual(a.pipeline, first.pipeline); assert.notEqual(b.pipeline, first.pipeline);
  assert.equal(a.pipeline.renderPass.scene, otherScene); assert.equal(b.pipeline.renderPass.camera, otherCamera);
  first.release(); await Promise.resolve();
  assert.equal(second.pipeline.disposed, false);
  second.release(); a.release(); b.release(); await Promise.resolve();
  model.geometry.dispose(); model.mesh.material.dispose();
});

test('failed pass restores renderer state, reports once, supports fallback and fresh retry', async () => {
  const gl = rendererHarness(), model = sceneWithRibbon();
  const lease = acquireBloomPipeline(gl, model.scene, model.camera, size);
  const beforeColor = gl.getClearColor(new THREE.Color()), beforeViewport = gl.getViewport(new THREE.Vector4());
  gl.failAt = 2; // Fail in bloom after RenderPass, while a composer target is bound.
  const errors = [];
  assert.equal(renderBloomPipeline(lease.pipeline, .17, .016, error => errors.push(error)), false);
  assert.equal(errors.length, 1);
  assert.equal(gl.autoClear, true); assert.equal(gl.getRenderTarget(), null);
  assert.equal(gl.getClearAlpha(), .3);
  assert.deepEqual(gl.getClearColor(new THREE.Color()), beforeColor);
  assert.deepEqual(gl.getViewport(new THREE.Vector4()), beforeViewport);
  const calls = gl.calls;
  assert.equal(renderBloomPipeline(lease.pipeline, .17, .016, error => errors.push(error)), false);
  assert.equal(gl.calls, calls); assert.equal(errors.length, 1);
  assert.doesNotThrow(() => gl.render(model.scene, model.camera));
  const retry = acquireBloomPipeline(gl, model.scene, model.camera, size);
  assert.notEqual(retry.pipeline, lease.pipeline);
  lease.release(); await Promise.resolve();
  assert.equal(retry.pipeline.disposed, false);
  assert.equal(renderBloomPipeline(retry.pipeline, .17, .016, assert.fail), true);
  retry.release(); model.geometry.dispose(); model.mesh.material.dispose();
});

test('invalid initialization is never cached and a valid retry succeeds', () => {
  const gl = rendererHarness(), model = sceneWithRibbon();
  assert.throws(() => acquireBloomPipeline(gl, model.scene, model.camera, { ...size, dpr: NaN }), /Invalid bloom/);
  const retry = acquireBloomPipeline(gl, model.scene, model.camera, size);
  assert.equal(retry.pipeline.ready, true);
  assert.equal(renderBloomPipeline(retry.pipeline, .17, .016, assert.fail), true);
  retry.release(); model.geometry.dispose(); model.mesh.material.dispose();
});
