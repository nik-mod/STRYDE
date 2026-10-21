import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDY_BOUNDARIES, studyKeyframes, sampleStudy, magneticOffset } from '../src/motion/study-state.mjs';
import { mountMagnetic } from '../src/motion/magnetic.mjs';

test('authored study phases are continuous at every boundary in both responsive compositions', () => {
  for (const mobile of [false, true]) {
    for (const boundary of STUDY_BOUNDARIES) {
      const before = sampleStudy(boundary - 1e-7, mobile);
      const after = sampleStudy(boundary + 1e-7, mobile);
      for (const group of ['art', 'primary', 'secondary']) {
        for (const key of Object.keys(before[group])) assert.ok(Math.abs(before[group][key] - after[group][key]) < .001, `${mobile}:${boundary}:${group}.${key}`);
      }
      assert.ok(Math.abs(before.crop - after.crop) < .001);
    }
    for (const frame of studyKeyframes(mobile)) {
      const actual = sampleStudy(frame.at, mobile);
      assert.deepEqual(actual.art, frame.art);
      assert.deepEqual(actual.primary, frame.primary);
      assert.deepEqual(actual.secondary, frame.secondary);
    }
  }
});

test('seeking the same stop forward or backward restores all study values without accumulating transforms', () => {
  const stops = [0, .09, .22, .37, .62, .82, 1];
  for (const mobile of [false, true]) {
    const forward = stops.map(progress => sampleStudy(progress, mobile));
    const backward = [...stops].reverse().map(progress => sampleStudy(progress, mobile)).reverse();
    assert.deepEqual(forward, backward);
    assert.equal(sampleStudy(-1, mobile).progress, 0);
    assert.equal(sampleStudy(8, mobile).progress, 1);
    assert.equal(sampleStudy(.5, mobile).phase, 'inspect');
    assert.equal(sampleStudy(.82, mobile).phase, 'handoff');
    assert.equal(sampleStudy(1, mobile).phase, 'rest');
    assert.ok(sampleStudy(.62, mobile).art.scale > sampleStudy(0, mobile).art.scale);
    assert.ok(sampleStudy(1, mobile).art.scale < sampleStudy(.62, mobile).art.scale);
    assert.equal('rotation' in sampleStudy(.5, mobile).art, false);
  }
});

test('magnetic response stays centered and bounded even for points outside its cached rectangle', () => {
  const bounds = { left: 100, top: 200, width: 200, height: 50 };
  assert.deepEqual(magneticOffset({ x: 200, y: 225 }, bounds), { x: 0, y: 0 });
  assert.deepEqual(magneticOffset({ x: -1000, y: 9000 }, bounds), { x: -5, y: 5 });
  assert.deepEqual(magneticOffset({ x: 300, y: 250 }, bounds, 3), { x: 3, y: 3 });
  assert.deepEqual(magneticOffset({ x: 200, y: 225 }, { ...bounds, width: 0 }), { x: 0, y: 0 });
});

test('magnetic controller caches geometry, preserves the outer hitbox, resets, and tears down listeners/tweens', () => {
  const environment = new EventTarget();
  const element = new EventTarget();
  const content = {};
  let reads = 0;
  let killed = 0;
  let cleared = 0;
  let focused = false;
  const calls = [];
  element.querySelector = () => content;
  element.matches = () => focused;
  element.getBoundingClientRect = () => { reads++; return { left: 0, top: 0, width: 100, height: 40 }; };
  const gsap = {
    quickTo(target, axis) {
      assert.equal(target, content);
      const set = value => calls.push([axis, value]);
      set.tween = { kill() { killed++; } };
      return set;
    },
    set(target, properties) { assert.equal(target, content); assert.equal(properties.clearProps, 'transform'); cleared++; },
  };
  const pointer = (type, x = 100, y = 40) => {
    const event = new Event(type); Object.assign(event, { clientX: x, clientY: y }); element.dispatchEvent(event);
  };
  const abort = new AbortController();
  const dispose = mountMagnetic(element, { gsap, signal: abort.signal, environment });
  pointer('pointerenter');
  for (let index = 0; index < 20; index++) pointer('pointermove');
  assert.equal(reads, 1);
  assert.deepEqual(calls.slice(-2), [['x', 5], ['y', 5]]);
  focused = true; const count = calls.length; pointer('pointermove'); assert.equal(calls.length, count);
  pointer('pointerleave'); assert.deepEqual(calls.slice(-2), [['x', 0], ['y', 0]]);
  abort.abort(); dispose();
  assert.equal(killed, 2); assert.equal(cleared, 1);
  const finalCount = calls.length; pointer('pointerenter'); pointer('pointermove'); environment.dispatchEvent(new Event('resize'));
  assert.equal(calls.length, finalCount); assert.equal(reads, 1);
});
