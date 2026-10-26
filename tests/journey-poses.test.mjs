import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from 'three';
import { JOURNEY_CHAPTERS, journeyPose, journeyProgress, flowingMaterialSample, journeyHandoff, brandStudyPhase, brandLighting, heroProductGate } from '../src/journey-poses.mjs';

test('the camera gate returns to its exact handoff and leaves phone width protected', () => {
  const rect = { left: 20, top: 290, width: 350, height: 340 };
  assert.deepEqual(heroProductGate(rect, 0), rect);
  assert.deepEqual(heroProductGate(rect, 1), rect);
  const forward = [0,.25,.5,.75,1].map(p => heroProductGate(rect, p));
  assert.deepEqual(forward, [1,.75,.5,.25,0].map(p => heroProductGate(rect, p)).reverse());
  for (const p of [.25,.5,.75]) {
    const compact = heroProductGate(rect, p, true);
    assert.equal(compact.left, rect.left); assert.equal(compact.width, rect.width);
    assert(compact.top < rect.top && compact.top > rect.top - 13);
  }
});

test('live journey poses remain finite and reverse seeks restore the same product pose', () => {
  for (const chapter of JOURNEY_CHAPTERS) {
    const positions = Array.from({ length: 101 }, (_, index) => index / 100);
    const forward = positions.map(progress => journeyPose(chapter, progress));
    assert.deepEqual(forward, [...positions].reverse().map(progress => journeyPose(chapter, progress)).reverse());
    for (const pose of forward) {
      assert(Object.values(pose).every(Number.isFinite));
      assert(pose.fill >= .8 && pose.fill <= .9, 'the whole shoe always retains a camera margin');
    }
    assert.deepEqual(journeyPose(chapter, -100), journeyPose(chapter, 0));
    assert.deepEqual(journeyPose(chapter, 100), journeyPose(chapter, 1));
  }
});

test('inspection keys carry continuous angular velocity instead of stopping each segment', () => {
  const epsilon = 1e-5;
  for (const key of [.25, .52, .76]) for (const axis of ['rotationX', 'rotationY', 'rotationZ']) {
    const center = journeyPose('hero', key)[axis];
    const before = (center - journeyPose('hero', key - epsilon)[axis]) / epsilon;
    const after = (journeyPose('hero', key + epsilon)[axis] - center) / epsilon;
    assert(Math.abs(before - after) < .003, `${axis} velocity is continuous at ${key}`);
  }
  const movingYaw = (journeyPose('hero', .25 + epsilon).rotationY - journeyPose('hero', .25 - epsilon).rotationY) / (2 * epsilon);
  assert(movingYaw > .3, 'the intermediate profile key carries motion through the upper reveal');
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

test('authored product tours keep bounded pitch, bank and a constant framing margin', () => {
  for (const chapter of JOURNEY_CHAPTERS) for (let index = 0; index <= 200; index++) {
    const pose = journeyPose(chapter, index / 200);
    assert(Math.abs(pose.rotationX) <= .65, `${chapter} never rolls flat or upside down`);
    assert(Math.abs(pose.rotationY) <= .55, `${chapter} holds a readable product view outside an exchange`);
    assert(Math.abs(pose.rotationZ) <= .065, `${chapter} keeps its authored bank inside the camera margin`);
    assert.equal(pose.fill, journeyPose(chapter, 0).fill);
  }
  assert(journeyPose('hero', .52).rotationX > journeyPose('hero', 0).rotationX + .2, 'the middle beat reveals the upper');
  assert.deepEqual(journeyPose('hero', 1), journeyPose('deconstruction', 0), 'the exit resolves to the next canonical profile');
  for (const chapter of JOURNEY_CHAPTERS) {
    for (const axis of ['rotationX', 'rotationY', 'rotationZ']) {
      const samples = Array.from({ length: 201 }, (_, index) => journeyPose(chapter, index / 200)[axis]);
      for (let i = 1; i < samples.length; i++) assert(Math.abs(samples[i] - samples[i - 1]) < .08, `${chapter} has no angular discontinuity`);
    }
  }
});

test('the live Brand studio reveals real surfaces and reverses its moving light exactly', () => {
  assert.equal(brandStudyPhase(.04), 0);
  assert.equal(brandStudyPhase(.32), 1);
  assert.equal(brandStudyPhase(.72), 2);
  assert.equal(brandStudyPhase(1), 2);
  const upper = journeyPose('brand', .32), sole = journeyPose('brand', .72);
  assert(new Vector3(0, 1, 0).applyEuler(new Euler(upper.rotationX, upper.rotationY, upper.rotationZ, 'XYZ')).z > .5);
  assert(new Vector3(0, -1, 0).applyEuler(new Euler(sole.rotationX, sole.rotationY, sole.rotationZ, 'XYZ')).z > .5);
  const positions = [0, .25, .5, .72, 1];
  assert.deepEqual(positions.map(brandLighting), [...positions].reverse().map(brandLighting).reverse());
  assert(brandLighting(0).key[0] < -3);
  assert(brandLighting(1).key[0] > 3);
  for (let index = 0; index <= 100; index++) {
    const p = index / 100;
    assert(journeyPose('brand', p).fill <= .9, 'the whole shoe keeps a clear camera margin');
    assert(brandLighting(p).key.every(Number.isFinite));
  }
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

test('all three material studies retain a recognizable upper and side silhouette', () => {
  for (const progress of [.18, .53, .92]) {
    const pose = journeyPose('materials', progress);
    const upper = new Vector3(0, 1, 0).applyEuler(new Euler(pose.rotationX, pose.rotationY, pose.rotationZ, 'XYZ'));
    assert(upper.z > .3 && upper.y > .8, 'the upper faces the viewer while the side remains readable');
  }
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
  const final = journeyPose('materials', samples[2].progress);
  const normal = new Vector3(0, 1, 0).applyEuler(new Euler(final.rotationX, final.rotationY, final.rotationZ, 'XYZ'));
  assert(normal.z > 0 && normal.y > .8, 'the navy study keeps the upper visible in flowing layouts');
});
