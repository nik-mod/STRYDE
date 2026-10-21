import test from 'node:test';
import assert from 'node:assert/strict';
import { heroPose, heroPhase, HERO_PHASES, CHAPTERS } from '../src/motion/contracts.mjs';
import { environmentFor, ENVIRONMENTS } from '../src/motion/environments.mjs';
import { magneticOffset, mountMagnetic } from '../src/motion/magnetic.mjs';

test('every chapter has a deterministic environment preset with finite lighting values', () => {
  assert.deepEqual(Object.keys(ENVIRONMENTS).sort(), [...CHAPTERS].sort());
  for (const name of CHAPTERS) {
    const env = environmentFor(name);
    for (const value of Object.values(env)) assert.ok(Number.isFinite(value) && value > 0, `${name}:${value}`);
    assert.equal(environmentFor(name), env, 'presets are frozen singletons');
  }
  assert.equal(environmentFor('unknown'), ENVIRONMENTS.hero);
});

test('the hero pose is continuous across every phase boundary and clamp-safe', () => {
  for (const boundary of [.18, .46, .72, .9]) {
    const before = heroPose(boundary - 1e-9);
    const after = heroPose(boundary + 1e-9);
    for (const key of Object.keys(before)) assert.ok(Math.abs(before[key] - after[key]) < 1e-6, `${boundary}:${key}`);
  }
  for (const key of Object.keys(heroPose(0))) {
    assert.equal(heroPose(-1)[key], heroPose(0)[key], `underflow:${key}`);
    assert.equal(heroPose(2)[key], heroPose(1)[key], `overflow:${key}`);
  }
});

test('seeking the same stop forward or backward restores the identical pose', () => {
  const stops = [0, .09, .18, .3, .46, .6, .72, .8, .9, 1];
  const forward = stops.map(heroPose);
  const backward = [...stops].reverse().map(heroPose).reverse();
  assert.deepEqual(forward, backward);
});

test('the hero settles into a deterministic handoff pose for chapter 02', () => {
  const macro = heroPose(.72);
  const rest = heroPose(1);
  assert.deepEqual(Object.keys(rest), ['rotationY', 'rotationZ', 'cameraZ', 'cameraY', 'fov', 'keyIntensity', 'rimIntensity']);
  assert.ok(Math.abs(rest.rotationY) < .2, 'rest rotation stays near centered');
  assert.ok(Math.abs(rest.rotationZ) < .1, 'rest tilt levels out');
  assert.ok(rest.cameraZ > macro.cameraZ, 'camera pulls back out of the macro close-up');
  assert.ok(rest.fov < macro.fov, 'lens returns to the establish focal length');
  assert.ok(macro.keyIntensity > rest.keyIntensity, 'macro phase lifts the key light');
  assert.deepEqual([0, .2, .5, .8, .999].map(heroPhase), ['depth', 'transform', 'macro', 'handoff', 'rest']);
  assert.equal(HERO_PHASES[0], 'establish');
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
