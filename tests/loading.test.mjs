import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireRibbon } from '../src/lib/hero-geometry.ts';
import { scenePreloadDeadline } from '../src/lib/loading.ts';

test('resource leases survive Strict Mode replay and dispose after the final user', async () => {
  const first = acquireRibbon(0, 72);
  const geometry = first.geometry;
  let disposed = 0;
  geometry.addEventListener('dispose', () => disposed++);
  first.release();
  const replay = acquireRibbon(0, 72);
  const secondUser = acquireRibbon(0, 72);
  assert.equal(replay.geometry, geometry);
  assert.equal(secondUser.geometry, geometry);
  await Promise.resolve();
  assert.equal(disposed, 0);
  replay.release(); replay.release();
  await Promise.resolve();
  assert.equal(disposed, 0);
  secondUser.release();
  await Promise.resolve();
  assert.equal(disposed, 1);
  const fresh = acquireRibbon(0, 72);
  assert.notEqual(fresh.geometry, geometry);
  fresh.release();
  await Promise.resolve();
});

test('scene preload priorities cover upcoming visibility and restored deep anchors', () => {
  assert.equal(scenePreloadDeadline(0), 2);
  for (let stage = 0; stage <= 5; stage += .01) {
    const deadline = scenePreloadDeadline(stage);
    assert.ok(deadline >= 2 && deadline <= 5);
    for (let index = 2; index <= 5; index++) {
      if (stage >= index - 1.0) assert.ok(deadline >= index, `Scene ${index} is requested too late`);
    }
  }
  assert.equal(scenePreloadDeadline(5), 5);
  assert.equal(scenePreloadDeadline(-1), 2);
});
