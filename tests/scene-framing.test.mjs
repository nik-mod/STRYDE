import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Euler, Matrix4, Vector3 } from 'three';
import { fittedCameraZ } from '../src/scene-framing.mjs';
import { heroPose } from '../src/motion/contracts.mjs';

test('every hero pose and aspect keeps all model bounds inside the camera safe area', () => {
  const source = new Box3(new Vector3(-1.1, -.5, -.4), new Vector3(1.1, .5, .4));
  for (const aspect of [.55, .9, 1.4, 2.5, 4]) {
    for (let step = 0; step <= 100; step++) {
      const pose = heroPose(step / 100);
      const rotation = new Matrix4().makeRotationFromEuler(new Euler(pose.rotationX, pose.rotationY, pose.rotationZ));
      const points = [];
      for (const x of [source.min.x, source.max.x]) for (const y of [source.min.y, source.max.y]) for (const z of [source.min.z, source.max.z]) points.push(new Vector3(x,y,z).applyMatrix4(rotation));
      const options = {fov:pose.fov, aspect, y:pose.cameraY};
      const z = fittedCameraZ(points, options), tangent = Math.tan(pose.fov * Math.PI / 360);
      let largest = 0;
      for (const point of points) {
        const x = Math.abs(point.x / ((z - point.z) * tangent * aspect));
        const y = Math.abs((point.y - pose.cameraY) / ((z - point.z) * tangent));
        assert(x <= .940001 && y <= .940001);
        largest = Math.max(largest,x,y);
      }
      assert(largest >= .939999, 'the shoe must use its available safe area, not retreat beyond it');
      assert.equal(fittedCameraZ(points, options), z, 'repeat/reverse seeks cannot accumulate camera distance');
    }
  }
});
