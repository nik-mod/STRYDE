import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterGrade, chapterAtMidpoint, CHAPTER_SURFACES } from '../src/motion/chapter-continuity.mjs';
import { bundledJourneyCamera } from '../src/journey-cameras.mjs';
import { readFile } from 'node:fs/promises';
import { Vector3, Euler } from 'three';
import { journeyPose } from '../src/journey-poses.mjs';
import { waitForIntroCompletion } from '../src/motion/lifecycle.mjs';

test('noncritical standalone startup waits for film completion and releases its observer on abort', async () => {
  let playing = true, update, disconnected = 0;
  const document = { documentElement: { classList: { contains: name => playing && name === 'site-intro-playing' } }, defaultView: { MutationObserver: class { constructor(callback) { update = callback; } observe() {} disconnect() { disconnected++; } } } };
  const first = new AbortController();
  const waiting = waitForIntroCompletion(document, first.signal);
  let ready = false; waiting.then(() => { ready = true; });
  await Promise.resolve(); assert(!ready);
  playing = false; update(); assert(await waiting); assert.equal(disconnected, 1);
  playing = true;
  const second = new AbortController(), aborted = waitForIntroCompletion(document, second.signal);
  second.abort(); assert.equal(await aborted, false); assert.equal(disconnected, 2);
});

test('measured chapter boundaries match exposure continuously in both directions and after skipped chapters', () => {
  const names = Object.keys(CHAPTER_SURFACES);
  for (let index = 1; index < names.length; index++) {
    const state = top => chapterGrade(names.map((name, i) => ({ name, top: top + (i - index) * 3000 })), 900);
    const forward = Array.from({ length: 101 }, (_, step) => state(900 - step * 9));
    const reverse = Array.from({ length: 101 }, (_, step) => state(step * 9)).reverse();
    assert.deepEqual(forward, reverse);
    assert.equal(forward[0].surface, chapterGrade([{ name: names[index - 1], top: 0 }], 900).surface, 'the prior chapter is settled before the next boundary enters');
    assert.equal(forward.at(-1).to, names[index]);
    assert.equal(forward.at(-1).progress, 1);
    assert.notEqual(forward[50].surface, forward[0].surface);
    assert.notEqual(forward[50].surface, forward.at(-1).surface);
    for (let step = 1; step < forward.length; step++) {
      const color = s => s.surface.match(/\d+/g).map(Number);
      assert(color(forward[step]).every((v, c) => Math.abs(v - color(forward[step - 1])[c]) <= 5), 'no hard color cut');
    }
    assert.equal(state(-2000).to, names[index], 'a fast jump derives the current destination without callbacks');
  }
});

test('chapter navigation follows the viewport midpoint after jumps and resizing', () => {
  const chapters = [{name:'hero',top:-6000},{name:'featured',top:-120},{name:'brand',top:620},{name:'finale',top:1800}];
  assert.equal(chapterAtMidpoint(chapters,900),'featured');
  assert.equal(chapterAtMidpoint(chapters,1440),'brand');
  assert.equal(chapterAtMidpoint(chapters.map(c=>({...c,top:c.top-1700})),900),'finale');
  assert.equal(chapterAtMidpoint(chapters,900),'featured','reversing a skipped interval restores its owner');
});

test('baked cameras contain the original hulls throughout every authored inspection', async () => {
  const models = {};
  for (const [key, file] of Object.entries({ blue: 'blue-white', mono: 'monochrome', navy: 'deep-blue' })) {
    const bytes = await readFile(new URL(`../assets/nike-tn-${file}.glb`, import.meta.url));
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
    const points = json.scenes[0].extras.strydeFramingHull.map(p => new Vector3(...p).applyAxisAngle(new Vector3(0, 1, 0), key === 'blue' ? Math.PI / 2 : 0));
    const min = new Vector3(Infinity, Infinity, Infinity), max = min.clone().negate();
    points.forEach(p => { min.min(p); max.max(p); });
    const center = min.clone().add(max).multiplyScalar(.5), size = max.clone().sub(min);
    models[key] = points.map(p => p.sub(center).multiplyScalar(2.6 / Math.max(size.x, size.y, size.z)));
  }
  const chapters = { hero: ['blue'], deconstruction: ['mono'], materials: ['blue', 'mono', 'navy'], technology: ['blue'], featured: ['navy'], brand: ['blue'] };
  const tangent = Math.tan(32 * Math.PI / 360);
  for (const [chapter, identities] of Object.entries(chapters)) for (const aspect of [.37, .71, 1.24, 1.83, 2.75, 4.1]) {
    const camera = bundledJourneyCamera(chapter, aspect);
    for (let step = 0; step <= 40; step++) {
      const pose = journeyPose(chapter, step / 40), rotation = new Euler(pose.rotationX, pose.rotationY, pose.rotationZ);
      for (const identity of identities) for (const source of models[identity]) {
        const p = source.clone().applyEuler(rotation);
        assert(Math.abs(p.x / ((camera - p.z) * tangent * aspect)) < .9, `${chapter} horizontal framing`);
        assert(Math.abs((p.y - pose.cameraY) / ((camera - p.z) * tangent)) < .9, `${chapter} vertical framing`);
      }
    }
  }
});
