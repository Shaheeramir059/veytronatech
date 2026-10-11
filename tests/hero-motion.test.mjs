import test from 'node:test';
import assert from 'node:assert/strict';
import { heroMotion, ease, QUALITY } from '../src/lib/hero-motion.ts';
import { ribbonGeometry } from '../src/lib/hero-geometry.ts';

test('hero and website endpoints clamp safely under overscroll', () => {
  assert.deepEqual(heroMotion(-1), heroMotion(0));
  const end = heroMotion(1);
  assert.equal(end.unfold, 1);
  assert.equal(end.panels, 1);
  assert.equal(end.core, 0);
  assert.equal(end.travel, 1);
  assert.equal(heroMotion(5).bloom, 0);
});

test('reverse scrolling exactly retraces the geometry transforms', () => {
  const stages = Array.from({ length: 101 }, (_, i) => i / 100);
  const forward = stages.map(heroMotion);
  const reverse = [...stages].reverse().map(heroMotion).reverse();
  assert.deepEqual(forward, reverse);
  for (let i = 1; i < forward.length; i++) {
    assert.ok(forward[i].unfold >= forward[i - 1].unfold);
    assert.ok(forward[i].panels >= forward[i - 1].panels);
    assert.ok(Math.abs(forward[i].unfold - forward[i - 1].unfold) < 0.03);
  }
});

test('transition boundaries are continuous with flat easing tangents', () => {
  for (const stage of [0, 0.08, 0.12, 0.46, 0.73, 0.75, 0.88, 0.9, 1, 1.35]) {
    const left = heroMotion(stage - 0.000001), right = heroMotion(stage + 0.000001);
    for (const key of Object.keys(left)) assert.ok(Math.abs(left[key] - right[key]) < 0.00002, `${key} jumps at ${stage}`);
  }
  assert.ok(ease(0.0001) < 1e-9);
  assert.ok(1 - ease(0.9999) < 1e-9);
});

test('all sculpture morphs have finite matching topology and conservative bounds', () => {
  for (const preset of Object.values(QUALITY)) for (let band = 0; band < 6; band++) {
    const geometry = ribbonGeometry(band, preset.segments);
    const position = geometry.getAttribute('position');
    const target = geometry.morphAttributes.position[0];
    assert.equal(position.count, target.count);
    assert.equal(geometry.getAttribute('normal').count, geometry.morphAttributes.normal[0].count);
    for (const attribute of [position, target, geometry.getAttribute('normal'), geometry.morphAttributes.normal[0]]) {
      assert.ok([...attribute.array].every(Number.isFinite));
    }
    for (let i = 0; i < position.count; i++) {
      assert.ok(Math.hypot(position.getX(i), position.getY(i), position.getZ(i)) <= geometry.boundingSphere.radius);
      assert.ok(Math.hypot(target.getX(i), target.getY(i), target.getZ(i)) <= geometry.boundingSphere.radius);
    }
    for (const index of geometry.index.array) assert.ok(index < position.count);
    geometry.dispose();
  }
});

test('mobile preset limits GPU work and DPR', () => {
  assert.ok(QUALITY.mobile.dpr <= 1.2);
  assert.ok(QUALITY.desktop.dpr <= 1.5);
  assert.ok(QUALITY.mobile.segments < QUALITY.desktop.segments);
  assert.ok(QUALITY.mobile.particles < QUALITY.desktop.particles);
  assert.ok(QUALITY.mobile.bloomScale < QUALITY.desktop.bloomScale);
});
