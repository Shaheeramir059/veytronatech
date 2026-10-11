import test from 'node:test';
import assert from 'node:assert/strict';
import { getJourneyStage } from '../src/lib/journey.ts';

test('section anchors select the same stages forward and backward', () => {
  const stops = [0, 900, 1800, 2700, 3600, 4500];
  for (const index of [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]) {
    assert.equal(getJourneyStage(stops[index], stops), index);
  }
});

test('short viewports and variable section heights keep anchors aligned', () => {
  const stops = [0, 700, 1450, 2150, 2850, 3550];
  assert.equal(getJourneyStage(700, stops), 1);
  assert.equal(getJourneyStage(1075, stops), 1.5);
  assert.equal(getJourneyStage(3550, stops), 5);
  assert.equal(getJourneyStage(3850, stops), 5);
});

test('overscroll is clamped and restored positions interpolate immediately', () => {
  const stops = [0, 844, 1688, 2532, 3376, 4220];
  assert.equal(getJourneyStage(-100, stops), 0);
  assert.equal(getJourneyStage(9999, stops), 5);
  assert.equal(getJourneyStage(2110, stops), 2.5);
});
