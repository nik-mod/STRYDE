import test from 'node:test';
import assert from 'node:assert/strict';
import { studyTransition, windowTransition, exchangeModelSpec, chapterCameraDistance, productWindowViewport } from '../src/journey-transition.mjs';
import { JOURNEY_CHAPTERS, journeyPose } from '../src/journey-poses.mjs';
import { Euler, Vector3 } from 'three';

const blue = { url: '/blue.glb', yaw: 90, variant: 'blue' };
const drift = { url: '/drift.glb', yaw: 0, variant: 'drift' };
const navy = { url: '/navy.glb', yaw: 0, variant: 'navy' };

test('a configured model exchange remains reversible inside its feature window', () => {
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

test('chapter boundary drawing cannot paint over the next chapter heading', () => {
  const viewport = { width: 1440, height: 900 }, buffer = { width: 1472, height: 960 };
  const outgoing = productWindowViewport({ left: 65, top: -200, width: 740, height: 500 },
    { left: 0, right: 1440, top: -900, bottom: 450 }, viewport, buffer);
  const incoming = productWindowViewport({ left: 65, top: 760, width: 740, height: 500 },
    { left: 0, right: 1440, top: 450, bottom: 1600 }, viewport, buffer);
  const cssBounds = draw => {
    const [x, y, w, h] = draw.scissor;
    return { left: x / buffer.width * viewport.width, top: viewport.height - (y + h) / buffer.height * viewport.height,
      right: (x + w) / buffer.width * viewport.width, bottom: viewport.height - y / buffer.height * viewport.height };
  };
  const a = cssBounds(outgoing), b = cssBounds(incoming);
  assert(a.top >= 0 && a.bottom <= 450);
  assert(b.top >= 760 && b.bottom <= 900);
  assert(a.bottom < b.top, 'the reading band between the windows remains clear');
  assert.equal(productWindowViewport({ left: 65, top: 950, width: 740, height: 500 },
    { left: 0, right: 1440, top: 450, bottom: 1600 }, viewport, buffer), null);
});

test('scroll seeks and reverse scrolling select the same model exchange interval', () => {
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

test('different models exchange as complete objects in a shared neutral pose', () => {
  const exchange = progress => ({ from: blue, to: drift, progress });
  assert.equal(exchangeModelSpec(blue, exchange(.49999)), blue);
  assert.equal(exchangeModelSpec(blue, exchange(.5)), drift);
  assert.equal(exchangeModelSpec(navy), navy);
  assert.deepEqual(journeyPose('materials', .27), journeyPose('materials', .39), 'the model changes during an authored neutral hold');
  for (let index = 0; index <= 100; index++) {
    const selected = exchangeModelSpec(blue, exchange(index / 100));
    assert(selected === blue || selected === drift, 'one original model identity, never a hybrid surface');
  }
});

test('one chapter camera fits every bounded pose and both natural model proportions', () => {
  const corners = (x, y, z) => [-x, x].flatMap(a => [-y, y].flatMap(b => [-z, z].map(c => new Vector3(a, b, c))));
  const models = [corners(1.3, .48, .38), corners(1.3, .57, .43)];
  const originals = models.map(points => points.map(point => point.toArray()));
  for (const chapter of JOURNEY_CHAPTERS) for (const aspect of [.8, 1.5, 2.6]) {
    const camera = chapterCameraDistance(models, chapter, { aspect });
    assert(Number.isFinite(camera) && camera > 0);
    assert.equal(camera, chapterCameraDistance(models, chapter, { aspect }));
    for (let step = 0; step <= 100; step++) {
      const pose = journeyPose(chapter, step / 100);
      const rotation = new Euler(pose.rotationX, pose.rotationY, pose.rotationZ, 'XYZ');
      const tangent = Math.tan(32 * Math.PI / 360);
      for (const model of models) for (const source of model) {
        const point = source.clone().applyEuler(rotation);
        assert(camera > point.z);
        assert(Math.abs(point.x / ((camera - point.z) * tangent * aspect)) < .9);
        assert(Math.abs((point.y - pose.cameraY) / ((camera - point.z) * tangent)) < .9);
      }
    }
  }
  assert.deepEqual(models.map(points => points.map(point => point.toArray())), originals, 'camera planning never stretches or mutates product geometry');
});
