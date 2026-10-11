import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act, StrictMode } from 'react';
import { createRoot, extend, advance } from '@react-three/fiber';
import * as THREE from 'three';
import { rendererHarness } from './helpers/renderer.mjs';
import { loadComponent } from './helpers/component.mjs';
extend(THREE);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('actual later assembly renders forward/reverse with stable resources, resize replacement and cleanup', async () => {
  const { default: Artifact } = await loadComponent('src/components/LaterArtifacts.tsx');
  globalThis.window = { devicePixelRatio: 1, requestIdleCallback(task) { queueMicrotask(task); return 1; }, cancelIdleCallback() {} };
  const gl = rendererHarness(), root = createRoot(gl.domElement), progress = { current: 1 }, continuity = { current: true };
  const reflectedScene = new THREE.Scene(), environment = new THREE.Texture(); reflectedScene.environment = environment;
  await root.configure({ gl, scene: reflectedScene, frameloop: 'never', size: { width: 1440, height: 900, top: 0, left: 0 } });
  let store;
  await act(async () => { store = root.render(React.createElement(StrictMode, null, React.createElement(Artifact, { index: 2, progress, continuity, mobile: false }))); });
  const state = store.getState(), scene = state.scene;
  const matrices = () => {
    const data = []; scene.traverse(object => { if (object.isInstancedMesh) data.push(...object.instanceMatrix.array); }); return data;
  };
  const bands = []; scene.traverse(object => { if (object.name === 'continuity-band') bands.push(object); });
  assert.equal(bands.length, 6); const geometries = bands.map(mesh => mesh.geometry), materials = bands.map(mesh => mesh.material);
  materials.forEach(material => { assert.equal(material.envMap, environment); assert.equal(material.envMapIntensity,1.7); });
  const stages = [1,1.02,1.08,1.12,1.5,1.92,2,2.08,2.5,2.92,3,3.08,3.5,3.92,4,4.08,4.5,4.92,5];
  const states = [];
  for (const stage of stages) {
    progress.current = stage;
    assert.doesNotThrow(() => advance(stage * 1000, false, state));
    states.push(matrices());
    bands.forEach((mesh,i) => { assert.equal(mesh.geometry, geometries[i]); assert.equal(mesh.material, materials[i]); assert.ok(mesh.morphTargetInfluences.every(Number.isFinite)); });
    materials.forEach(material => { assert.equal(material.depthWrite, stage >= 1.08); });
  }
  for (let i = stages.length - 1; i >= 0; i--) {
    progress.current = stages[i]; advance(i * 17, false, state); assert.deepEqual(matrices(), states[i]);
  }
  const firstInstance = scene.getObjectByProperty('isInstancedMesh', true), version = firstInstance.instanceMatrix.version;
  scene.traverse(object => {
    if (object.isInstancedMesh && object.count === 38) assert.equal(object.material.depthWrite,false, 'Translucent fragments must not occlude chrome');
  });
  advance(10000, false, state); advance(20000, false, state);
  assert.equal(firstInstance.instanceMatrix.version, version, 'idle frames must not upload unchanged instance matrices');
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
  materials[0].onBeforeCompile(shader, gl);
  assert.ok(shader.uniforms.uSpiral); assert.match(shader.vertexShader, /spiralPoint/); assert.match(shader.vertexShader, /spiralNormal/);
  const cacheKey = materials[0].customProgramCacheKey();
  progress.current = 2.5; advance(22000, false, state); assert.equal(materials[0].customProgramCacheKey(), cacheKey);
  await act(async () => { root.render(React.createElement(StrictMode, null, React.createElement(Artifact, { index: 2, progress, continuity, mobile: true }))); });
  const mobileBand = scene.getObjectByName('continuity-band');
  assert.notEqual(mobileBand.geometry, geometries[0]); assert.equal(mobileBand.geometry.userData.transitionSegments, 72);
  assert.doesNotThrow(() => advance(23000, false, state));
  let disposal = 0; mobileBand.geometry.addEventListener('dispose', () => disposal++);
  await act(async () => root.unmount()); await Promise.resolve(); assert.equal(disposal, 1);
  environment.dispose(); delete globalThis.window;
});
