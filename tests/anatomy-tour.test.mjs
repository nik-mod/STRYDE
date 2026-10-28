import test from 'node:test';
import assert from 'node:assert/strict';
import { anatomyTour, anatomyCamera, ANATOMY_DETAIL_PROGRESS, ANATOMY_STOPS } from '../src/anatomy-tour.mjs';

test('anatomy has five distinct inspections and resolves to its original full silhouette', () => {
  const views = ANATOMY_DETAIL_PROGRESS.map(anatomyTour);
  assert.deepEqual(views.map(view => view.active), [0, 1, 2, 3, 4]);
  assert(views[0].rotationX > views[1].rotationX, 'mesh is inspected from above the side structure');
  assert(views[2].focusY < -.3, 'Air inspection targets the lower silhouette');
  assert(views[3].rotationX < -1, 'the outsole actually turns toward the viewer');
  assert(views[4].focusY > .3 && views[4].rotationX > .9, 'finishing view approaches the laces and collar from above');
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

test('anatomy framing retains every transformed hull point with breathing room', () => {
  const hull = [{ x: -1.5, y: .65, z: .4 }, { x: 1.1, y: -.8, z: .6 }, { x: .3, y: .9, z: -.2 }];
  const tangent = Math.tan(32 * Math.PI / 360);
  for (const aspect of [1.2, 2.7, 4.5]) for (const zoom of [1, 1.42, 1.55]) {
    const distance = anatomyCamera(aspect, zoom, hull);
    for (const point of hull) {
      assert(Math.abs(point.x / ((distance - point.z) * tangent * aspect)) <= .900001);
      assert(Math.abs((point.y - .04) / ((distance - point.z) * tangent)) <= .900001);
    }
  }
});
