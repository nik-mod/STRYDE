import test from 'node:test';
import assert from 'node:assert/strict';
import { materialOrbit, projectMaterialOrbit } from '../src/material-orbit.mjs';

test('the same three shoes advance through a coherent ring and reverse to identical positions', () => {
  assert.deepEqual([0, .5, 1].map(p => materialOrbit(p).active), [0, 1, 2]);
  const positions = Array.from({ length: 401 }, (_, i) => i / 400);
  const forward = positions.map(materialOrbit);
  assert.deepEqual(forward, positions.reverse().map(materialOrbit).reverse());
  for (const state of forward) {
    assert.equal(state.items.length, 3);
    const front = state.items[state.active];
    assert(state.items.every(item => front.z >= item.z - 1e-10));
    for (const item of state.items) assert(Math.abs((item.x / 1.95) ** 2 + ((item.z + 1.85) / 1.85) ** 2 - 1) < 1e-10);
  }
});

test('orbit holds are stable, transitions are continuous and photographs retain a recognizable size', () => {
  assert.deepEqual(materialOrbit(-2), materialOrbit(0));
  assert.deepEqual(materialOrbit(2), materialOrbit(1));
  for (const boundary of [.12, .42, .58, .88]) {
    assert(Math.abs(materialOrbit(boundary - 1e-6).angle - materialOrbit(boundary + 1e-6).angle) < 1e-8);
  }
  for (const [width, height] of [[878, 560], [820, 435], [1000, 600]]) for (let p = 0; p <= 1; p += .01) {
    for (const item of materialOrbit(p).items) {
      const frame = projectMaterialOrbit(item, width, height);
      assert(frame.width > width * .2, 'rear shoes remain recognizable');
      assert(frame.x - frame.width / 2 > 0 && frame.x + frame.width / 2 < width, 'photographic silhouette stays in its gate');
    }
  }
});
