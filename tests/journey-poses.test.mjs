import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from 'three';
import { JOURNEY_CHAPTERS, journeyPose, journeyProgress, flowingMaterialSample, inspectionPose, journeyHandoff } from '../src/journey-poses.mjs';

test('live journey poses remain finite and reverse seeks restore the same product pose', () => {
  for (const chapter of JOURNEY_CHAPTERS) {
    const positions = Array.from({ length: 101 }, (_, index) => index / 100);
    const forward = positions.map(progress => journeyPose(chapter, progress));
    assert.deepEqual(forward, [...positions].reverse().map(progress => journeyPose(chapter, progress)).reverse());
    for (const pose of forward) {
      assert(Object.values(pose).every(Number.isFinite));
      assert(pose.fill >= .8 && pose.fill <= 1.15, 'only bounded deliberate close-ups may overfill the frame');
    }
    assert.deepEqual(journeyPose(chapter, -100), journeyPose(chapter, 0));
    assert.deepEqual(journeyPose(chapter, 100), journeyPose(chapter, 1));
  }
});

test('hero and finale preserve a camera margin throughout the turn', () => {
  for (const chapter of ['hero', 'finale']) {
    for (let step = 0; step <= 200; step++) {
      const pose = journeyPose(chapter, step / 200);
      assert(pose.fill <= .92, 'the product never overfills its authored window');
      assert(Math.abs(pose.rotationY) < .6, 'the product avoids an end-on silhouette');
    }
  }
  assert(Math.abs(journeyPose('finale', 0).fill - journeyPose('finale', 1).fill) < .03);
});

test('inspection controls expose actual upper and outsole surfaces', () => {
  for (const [view, axis] of [['upper', new Vector3(0, 1, 0)], ['outsole', new Vector3(0, -1, 0)]]) {
    const pose = inspectionPose(view);
    assert(axis.applyEuler(new Euler(pose.rotationX, pose.rotationY, pose.rotationZ, 'XYZ')).z > .9);
    assert(pose.fill < 1);
  }
  assert.equal(inspectionPose('unknown'), null);
});

test('chapter handoffs switch only inside visible product windows and reverse deterministically', () => {
  const sample = offset => journeyHandoff({ top: 100 - offset, height: 500 }, { top: 750 - offset, height: 500 }, 900);
  const positions = [0, 200, 350, 500, 700, 500, 350, 200, 0];
  const states = positions.map(sample);
  assert.deepEqual(states, [...states].reverse());
  assert.equal(states[0].index, 0);
  assert.equal(states[3].index, 1);
  for (const state of states.filter(Boolean)) assert(state.opacity >= 0 && state.opacity <= 1);
  assert.equal(journeyHandoff({ top: -600, height: 500 }, { top: 200, height: 500 }, 900), null);
  assert.equal(journeyHandoff({ top: 100, height: 500 }, { top: 950, height: 500 }, 900), null);
});

test('materials genuinely turn from the upper to the outsole in world space', () => {
  const upper = journeyPose('materials', 0);
  const outsole = journeyPose('materials', .84);
  const upperNormal = new Vector3(0, 1, 0).applyEuler(new Euler(upper.rotationX, upper.rotationY, upper.rotationZ, 'XYZ'));
  const outsoleNormal = new Vector3(0, -1, 0).applyEuler(new Euler(outsole.rotationX, outsole.rotationY, outsole.rotationZ, 'XYZ'));
  assert(upperNormal.z > .7, 'the upper faces the viewer in the color phase');
  assert(outsoleNormal.z > .9, 'the real underside faces the viewer in the foundation phase');
});

test('journey progress clamps jumps and rejects invalid geometry', () => {
  assert.equal(journeyProgress(1000, 0, 500), 1);
  assert.equal(journeyProgress(-1, 0, 500), 0);
  assert.equal(journeyProgress(50, 100, 0), 0);
  assert.equal(journeyProgress(NaN, 0, 100), 0);
  assert.equal(journeyProgress(250, 0, 500), .5);
});

test('flowing materials follow the visible frame instead of the first equally opaque panel', () => {
  const framesAt = offset => [100, 1000, 1900].map(top => ({ top: top - offset, bottom: top + 300 - offset, height: 300 }));
  const panelsAt = offset => [20, 920, 1820].map(top => ({ top: top - offset, height: 900 }));
  const stops = [0, 900, 1800, 900, 0];
  const samples = stops.map(offset => flowingMaterialSample(framesAt(offset), panelsAt(offset), 844));
  assert.deepEqual(samples.map(sample => sample.index), [0, 1, 2, 1, 0]);
  samples.forEach(({ index, progress }) => assert(progress >= index / 3 && progress <= (index + 1) / 3));
  assert.deepEqual(samples[1], samples[3], 'reverse restores the same frame and material phase');
  assert.deepEqual(samples[0], samples[4]);
  const outsole = journeyPose('materials', samples[2].progress);
  const normal = new Vector3(0, -1, 0).applyEuler(new Euler(outsole.rotationX, outsole.rotationY, outsole.rotationZ, 'XYZ'));
  assert(normal.z > .9, 'the third flowing panel renders the actual underside');
});
