import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act, StrictMode, useLayoutEffect, useRef } from 'react';
import { createRoot, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { acquireRibbon, ribbonGeometry } from '../src/lib/hero-geometry.ts';
import { heroMotion, QUALITY } from '../src/lib/hero-motion.ts';
import { rendererHarness } from './helpers/renderer.mjs';

extend(THREE);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('actual R3F primitive attachment leaves morph influences undefined, reproducing the pre-fix failure', async () => {
  const gl = rendererHarness(), root = createRoot(gl.domElement);
  const geometry = ribbonGeometry(0, QUALITY.desktop.segments);
  await root.configure({ gl, frameloop: 'never', size: { width: 1440, height: 900, top: 0, left: 0 } });
  let store;
  await act(async () => {
    store = root.render(React.createElement('mesh', null,
      React.createElement('primitive', { object: geometry, attach: 'geometry', dispose: null }),
      React.createElement('meshStandardMaterial')));
  });
  const scene = store.getState().scene;
  assert.equal(scene.children[0].geometry, geometry);
  assert.equal(scene.children[0].morphTargetInfluences, undefined);
  assert.throws(() => gl.render(scene), /Cannot read properties of undefined \(reading 'length'\)/);
  await act(async () => { root.unmount(); });
  geometry.dispose();
});

test('R3F initializes morph state in a Strict Mode tree before layout effects, quality changes and remount', async () => {
  const gl = rendererHarness(), root = createRoot(gl.domElement);
  await root.configure({ gl, frameloop: 'never', size: { width: 1440, height: 900, top: 0, left: 0 } });
  const observations = [];
  function Band({ geometry }) {
    const mesh = useRef(null);
    useLayoutEffect(() => {
      observations.push(mesh.current);
      assert.deepEqual(mesh.current.morphTargetInfluences, [0]);
    }, [geometry]);
    // Same constructor contract as HeroExperience.Ribbon: geometry must be an
    // argument, not attached to a previously constructed empty Mesh.
    return React.createElement('mesh', { ref: mesh, args: [geometry], name: 'hero-band' }, React.createElement('meshStandardMaterial'));
  }
  let store, previousLeases = [], previousMeshes = [];
  for (const preset of ['desktop', 'mobile', 'desktop']) {
    const leases = Array.from({ length: 6 }, (_, index) => acquireRibbon(index, QUALITY[preset].segments));
    await act(async () => {
      store = root.render(React.createElement(StrictMode, null, leases.map((lease, index) => React.createElement(Band, { key: index, geometry: lease.geometry }))));
    });
    const scene = store.getState().scene;
    assert.equal(scene.children.length, 6);
    scene.children.forEach((mesh, index) => {
      assert.equal(mesh.geometry, leases[index].geometry);
      if (previousMeshes[index]) assert.notEqual(mesh, previousMeshes[index]);
    });
    previousLeases.forEach(lease => lease.release());
    await Promise.resolve();
    for (const progress of [0, .12, .46, 1, .46, .12, 0]) {
      for (const mesh of scene.children) mesh.morphTargetInfluences[0] = heroMotion(progress).unfold;
      assert.doesNotThrow(() => gl.render(scene));
    }
    previousLeases = leases; previousMeshes = [...scene.children];
  }
  await act(async () => { root.render(null); });
  assert.equal(store.getState().scene.children.length, 0);
  // The standalone R3F root has a non-strict Provider above this boundary:
  // initial layout effects do not replay automatically in this CPU harness.
  // Explicitly remount the tree, while separate lease tests exercise the
  // synchronous setup/cleanup/setup sequence used by development Strict Mode.
  await act(async () => {
    root.render(React.createElement(StrictMode, null, previousLeases.map((lease, index) => React.createElement(Band, { key: index, geometry: lease.geometry }))));
  });
  assert.equal(store.getState().scene.children.length, 6);
  assert.doesNotThrow(() => gl.render(store.getState().scene));
  await act(async () => { root.render(null); });
  previousLeases.forEach(lease => lease.release());
  await Promise.resolve();
  assert.ok(observations.length >= 24);
  assert.equal(gl.weights.length, 132);
  await act(async () => { root.unmount(); });
});
