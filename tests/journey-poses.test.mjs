import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from 'three';
import { JOURNEY_CHAPTERS, journeyPose, journeyProgress, flowingMaterialSample, journeyHandoff, brandStudyPhase, brandLighting } from '../src/journey-poses.mjs';

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

test('every chapter uses restrained pitch, no roll, and a constant framing margin', () => {
  for (const chapter of JOURNEY_CHAPTERS) for (let index = 0; index <= 200; index++) {
    const pose = journeyPose(chapter, index / 200);
    assert(Math.abs(pose.rotationX) <= .65, `${chapter} never rolls flat or upside down`);
    assert(Math.abs(pose.rotationY) <= .3, `${chapter} avoids end-on spins`);
    assert.equal(pose.rotationZ, 0, `${chapter} has no decorative roll`);
    assert.equal(pose.fill, journeyPose(chapter, 0).fill);
  }
  assert.deepEqual(journeyPose('hero', .48), journeyPose('hero', 1), 'hero holds its settled profile');
  for (const chapter of ['deconstruction', 'materials', 'technology', 'featured', 'finale']) {
    for (const axis of ['rotationX', 'rotationY']) {
      const samples = Array.from({ length: 201 }, (_, index) => journeyPose(chapter, index / 200)[axis]);
      const direction = Math.sign(samples.at(-1) - samples[0]);
      for (let i = 1; i < samples.length; i++) assert((samples[i] - samples[i - 1]) * direction >= -1e-10, `${chapter} does not rock back and forth`);
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

test('materials genuinely turn from the upper to the outsole in world space', () => {
  const upper = journeyPose('materials', 0);
  const outsole = journeyPose('materials', .84);
  const upperNormal = new Vector3(0, 1, 0).applyEuler(new Euler(upper.rotationX, upper.rotationY, upper.rotationZ, 'XYZ'));
  const outsoleNormal = new Vector3(0, -1, 0).applyEuler(new Euler(outsole.rotationX, outsole.rotationY, outsole.rotationZ, 'XYZ'));
  assert(upperNormal.z > .5 && upperNormal.y > .7, 'the upper is visible through a gentle tilt, not a flat overhead flip');
  assert(outsoleNormal.z > .5 && outsoleNormal.y < -.7, 'the real underside is visible without turning the shoe upside down');
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
  assert(normal.z > .5 && normal.y < -.7, 'the third flowing panel shows a restrained view of the actual underside');
});
