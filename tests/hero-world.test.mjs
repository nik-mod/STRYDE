import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3, Scene, Group, DirectionalLight } from 'three';
import { expandHeroCamera, createHeroWorld } from '../src/hero-world.mjs';

test('expanding to the full hero preserves the projected product window on desktop, phone and during exit', () => {
  const layouts = [
    [{ left: 662, top: 187, width: 756, height: 566 }, { left: 0, top: 30, width: 1440, height: 870 }],
    [{ left: 19.5, top: 323, width: 351, height: 342 }, { left: 0, top: 30, width: 390, height: 814 }],
    [{ left: 662, top: -153, width: 756, height: 566 }, { left: 0, top: -310, width: 1440, height: 870 }],
  ];
  const pixels = (point, camera, rect) => {
    const projected = point.clone().project(camera);
    return [rect.left + (projected.x + 1) / 2 * rect.width, rect.top + (1 - projected.y) / 2 * rect.height];
  };
  for (const [product, stage] of layouts) {
    const camera = new PerspectiveCamera(32, product.width / product.height, .01, 100);
    camera.position.set(0, .04, 4.4); camera.updateMatrixWorld();
    const points = [new Vector3(-1.3, -.5, .3), new Vector3(1.3, .5, -.3), new Vector3(0, 0, 0)];
    const before = points.map(point => pixels(point, camera, product));
    expandHeroCamera(camera, product, stage);
    points.forEach((point, index) => pixels(point, camera, stage).forEach((coordinate, axis) => {
      assert(Math.abs(coordinate - before[index][axis]) < 1e-8);
    }));
    camera.clearViewOffset();
    assert.deepEqual(points.map(point => pixels(point, camera, product)), before, 'later chapters recover the original projection');
  }
});

test('the world uses the supplied scene, animates camera/light, and releases its mesh and pointer listeners', () => {
  const scene = new Scene(), stage = new EventTarget();
  stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1440, height: 900 });
  const world = createHeroWorld({ scene, root: { querySelector: () => stage }, compact: false });
  assert.equal(scene.children.length, 1);
  assert.equal(world.group.children.length, 1, 'one continuous landscape mesh');
  const mesh = world.group.children[0];
  let geometryDisposed = 0, materialDisposed = 0;
  mesh.geometry.addEventListener('dispose', () => geometryDisposed++);
  mesh.material.addEventListener('dispose', () => materialDisposed++);
  const camera = new PerspectiveCamera(), rig = new Group(), key = new DirectionalLight(), rim = new DirectionalLight();
  const update = (time, progress) => {
    camera.position.set(0, .04, 4.4);
    world.update(time, progress, 1, camera, rig, key, rim);
    return { camera: camera.position.toArray(), light: key.position.toArray(), perspective: camera.rotation.toArray(), surface: world.group.position.toArray() };
  };
  const rest = update(0, 0), ambient = update(3, 0), scrolled = update(3, .7);
  assert.notDeepEqual(ambient.camera, rest.camera);
  assert.notDeepEqual(ambient.light, rest.light);
  assert.notDeepEqual(scrolled.surface, ambient.surface);
  assert.notDeepEqual(scrolled.perspective, ambient.perspective);
  const pointer = new Event('pointermove'); Object.assign(pointer, { clientX: 1440, clientY: 450 }); stage.dispatchEvent(pointer);
  const responsive = update(3, 0); assert.notDeepEqual(responsive.camera, ambient.camera);
  world.dispose();
  assert.equal(scene.children.length, 0);
  assert.equal(geometryDisposed, 1); assert.equal(materialDisposed, 1);
  stage.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: 0, clientY: 0 }));
  const after = update(3, 0);
  assert(after.camera[0] > ambient.camera[0], 'the removed pointer listener cannot retarget the disposed world');
});
