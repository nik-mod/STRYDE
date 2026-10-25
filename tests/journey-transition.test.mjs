import test from 'node:test';
import assert from 'node:assert/strict';
import { shoeTurn, studyTransition, windowTransition, turnPose, travelWindow, transitionCamera } from '../src/journey-transition.mjs';

const blue = { url: '/blue.glb', yaw: 90, variant: 'blue' };
const drift = { url: '/drift.glb', yaw: 0, variant: 'drift' };
const navy = { url: '/navy.glb', yaw: 0, variant: 'navy' };

test('the third shoe arrives through the same reversible turn inside its feature window', () => {
  const progress = [0, .24, .3, .44, .6, .64, 1];
  const samples = progress.map(p => windowTransition(blue, navy, p));
  assert.deepEqual(samples, [...progress].reverse().map(p => windowTransition(blue, navy, p)).reverse());
  assert.equal(samples[0].spec, blue);
  assert.equal(samples.at(-1).spec, navy);
  assert.equal(samples[3].blend.from, blue);
  assert.equal(samples[3].blend.to, navy);
  assert(Math.abs(samples[3].blend.progress - .5) < 1e-10);
  assert.equal(windowTransition(navy, navy, .5).blend, null);
});

test('scroll seeks and reverse scrolling select the same continuous shoe transformation', () => {
  const stops = [.1, .24, 1 / 3, .42, .5, .7];
  const forward = stops.map(p => studyTransition([blue, drift, drift], p));
  const backward = [...stops].reverse().map(p => studyTransition([blue, drift, drift], p)).reverse();
  assert.deepEqual(forward, backward);
  assert.equal(forward[0], null);
  assert.equal(forward.at(-1), null, 'the second Drift study does not swap to another model');
  assert(Math.abs(forward[2].progress - .5) < 1e-10);
  assert.equal(forward[2].from, blue);
  assert.equal(forward[2].to, drift);
});

test('both shoes meet at the same heel pose while their opaque surfaces change', () => {
  const source = { rotationX: .8, rotationY: .4, rotationZ: -.1, fill: .94 };
  const target = { rotationX: -.1, rotationY: -.3, rotationZ: .08, fill: .94 };
  const sourceHeel = turnPose(source, .5), targetHeel = turnPose(target, .5);
  for (const key of Object.keys(sourceHeel)) assert(Math.abs(sourceHeel[key] - targetHeel[key]) < 1e-10);
  assert.equal(shoeTurn(.3).surface, 0);
  assert.equal(shoeTurn(.7).surface, 1);
  assert.equal(shoeTurn(.5).surface, .5);
  assert.deepEqual(turnPose(source, 0), source);
  for (let i = 0; i <= 100; i++) {
    const p = i / 100, state = shoeTurn(p);
    assert(state.surface >= 0 && state.surface <= 1);
    assert(state.turn >= 0 && state.turn <= 1);
    assert(Object.values(turnPose(source, p)).every(Number.isFinite));
  }
});

test('the camera and product window arrive at both exact endpoints without a jump at the handoff', () => {
  const from = { left: 750, top: -100, width: 600, height: 450 };
  const to = { left: 100, top: 500, width: 720, height: 500 };
  assert.deepEqual(travelWindow(from, to, 0), from);
  assert.deepEqual(travelWindow(from, to, 1), to);
  const before = travelWindow(from, to, .49999), after = travelWindow(from, to, .50001);
  for (const key of Object.keys(before)) assert(Math.abs(before[key] - after[key]) < .03);
  assert.equal(transitionCamera(4, 6, 0), 4);
  assert.equal(transitionCamera(4, 6, 1), 6);
  assert.equal(transitionCamera(4, 6, .5), 6, 'the midpoint fits the larger of the two silhouettes');
});
