import test from 'node:test';
import assert from 'node:assert/strict';
import { heroWave } from '../src/hero-wave.mjs';

test('the product wave crosses once from toe to heel, resolves at both ends and reverses exactly', () => {
  const forward = Array.from({ length: 101 }, (_, i) => heroWave(i / 100));
  const reverse = Array.from({ length: 101 }, (_, i) => heroWave((100 - i) / 100)).reverse();
  assert.deepEqual(forward, reverse);
  assert.equal(forward[0].strength, 0);
  assert(forward.at(-1).strength < 1e-20);
  assert(Math.abs(heroWave(.5).x) < 1e-10);
  assert(Math.abs(heroWave(.5).strength - 1) < 1e-10);
  for (let i = 1; i < forward.length; i++) {
    assert(forward[i].x >= forward[i - 1].x);
    assert(forward[i].strength >= 0 && forward[i].strength <= 1);
  }
  assert.deepEqual(heroWave(-3), forward[0]);
  assert.deepEqual(heroWave(5), forward.at(-1));
});
