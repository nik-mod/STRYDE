import test from 'node:test';
import assert from 'node:assert/strict';
import { anatomyTour, anatomyCamera, ANATOMY_DETAIL_PROGRESS, ANATOMY_STOPS } from '../src/anatomy-tour.mjs';

test('anatomy has five distinct inspections and resolves to its original full silhouette', () => {
  const views = ANATOMY_DETAIL_PROGRESS.map(anatomyTour);
  assert.deepEqual(views.map(view => view.active), [0, 1, 2, 3, 4]);
  assert(views[0].rotationX > views[1].rotationX, 'mesh is inspected from above the side structure');
  assert(views[2].focusY < -.3, 'Air inspection targets the lower silhouette');
  assert(views[3].rotationX < -1, 'the outsole actually turns toward the viewer');
  assert(views[4].focusX > .4 && views[4].rotationX > .6, 'finishing view approaches the laces and collar');
  for (const key of ['rotationX','rotationY','rotationZ','focusX','focusY','focusZ','zoom']) {
    assert.equal(anatomyTour(0)[key], anatomyTour(1)[key]);
  }
});

test('anatomy camera and focus are continuous, bounded and exactly reversible', () => {
  const positions = Array.from({ length: 601 }, (_, i) => i / 600);
  const forward = positions.map(anatomyTour);
  assert.deepEqual(forward, [...positions].reverse().map(anatomyTour).reverse());
  for (const view of forward) {
    assert(view.zoom >= 1 && view.zoom <= 1.55);
    assert(Object.values(view).every(Number.isFinite));
    assert(anatomyCamera(2.7, view.zoom) > 1.8);
  }
  for (const [at] of ANATOMY_STOPS.slice(1,-1)) {
    const left = anatomyTour(at - 1e-6), right = anatomyTour(at + 1e-6);
    for (const key of ['rotationX','rotationY','rotationZ','focusX','focusY','focusZ','zoom']) assert(Math.abs(left[key]-right[key]) < 1e-8);
  }
  assert.deepEqual(anatomyTour(-1), anatomyTour(0));
  assert.deepEqual(anatomyTour(2), anatomyTour(1));
});
