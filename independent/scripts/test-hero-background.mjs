import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Group, PerspectiveCamera, DirectionalLight } from 'three';
import { createHeroWorld, expandHeroCamera } from '../design/motion/hero-world.mjs';
import { journeyPose } from '../design/motion/journey-poses.mjs';

for (const compact of [false, true]) test(`idle background stays independent of the scroll-directed product (${compact ? 'phone' : 'desktop'})`, () => {
  const stage = new EventTarget(), scene = new Scene();
  stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1440, height: 900 });
  const world = createHeroWorld({ scene, root: { querySelector: () => stage }, compact });
  const camera = new PerspectiveCamera(32, 1.4, .01, 100), rig = new Group();
  camera.position.set(0, .04, 4.4); rig.rotation.set(.18, -.26, -.018);
  expandHeroCamera(camera, { left: 700, top: 200, width: 650, height: 500 }, { left: 0, top: 30, width: 1440, height: 870 });
  const key = new DirectionalLight(), rim = new DirectionalLight();
  const snapshot = () => [camera.position.toArray(), camera.rotation.toArray(), camera.projectionMatrix.toArray(), rig.position.toArray(), rig.rotation.toArray()];
  const before = snapshot(), meshes = [];
  world.group.traverse(node => { if (node.isMesh) meshes.push(node); });
  assert.equal(meshes.length, 3, 'one floor and two rounded wave forms share the existing scene');
  const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>\n#include <aomap_fragment>' };
  meshes[0].material.onBeforeCompile(shader);
  for (const mesh of meshes) {
    const positions = mesh.geometry.attributes.position.array;
    assert(positions.every(Number.isFinite), 'geometry contains no invalid coordinates');
  }
  const update = (time, progress = 0) => world.update(time, progress, 1 / 30, camera, rig, key, rim);
  update(0);
  const initialSurface = world.group.position.toArray(), initialLight = key.position.toArray();
  stage.dispatchEvent(Object.assign(new Event('pointermove'), { pointerType: 'mouse', clientX: 1400, clientY: 300 }));
  stage.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerType: 'mouse', button: 0 }));
  for (let i = 1; i <= 180; i++) {
    update(i / 30, 0);
    assert.deepEqual(snapshot(), before, 'idle time and hold never rock the product');
  }
  assert.notDeepEqual(world.group.position.toArray(), initialSurface);
  assert.notDeepEqual(key.position.toArray(), initialLight);
  assert(shader.uniforms.worldPointer.value.x > .8);
  assert(shader.uniforms.worldPress.value > .1);
  assert(shader.uniforms.worldTime.value > 0);
  stage.dispatchEvent(new Event('pointerup'));
  for (let i = 0; i < 120; i++) update(7 + i / 30);
  assert(shader.uniforms.worldPress.value < .001, 'release settles the background');
  const pose = journeyPose('hero', .52);
  rig.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ);
  camera.position.set(0,.04,4.4); update(10,.52);
  const inspection = snapshot();
  assert.notDeepEqual(inspection,before,'scroll reveals an authored product inspection');
  camera.position.set(0,.04,4.4); update(20,.52);
  assert.deepEqual(snapshot(),inspection,'a fixed scroll position stays composed while the environment lives');
  let disposed = 0;
  for (const mesh of meshes) for (const resource of [mesh.geometry, mesh.material]) resource.addEventListener('dispose', () => disposed++);
  world.dispose();
  assert.equal(scene.children.length, 0);
  assert.equal(disposed, 6, 'all three geometries and materials are released');
});
test('Hero inspection is reversible and resolves to the next chapter pose',()=>{
  const samples=Array.from({length:601},(_,i)=>i/600);
  assert.deepEqual(samples.map(p=>journeyPose('hero',p)),samples.toReversed().map(p=>journeyPose('hero',p)).reverse());
  const last=journeyPose('hero',1), next=journeyPose('deconstruction',0);
  for(const key of ['rotationX','rotationY','rotationZ']) assert.equal(last[key],next[key]);
  assert(journeyPose('hero',.25).rotationY-journeyPose('hero',.75).rotationY>1.4,'orbit and reveal expose different sides');
  assert(journeyPose('hero',.5).rotationX>.7,'detail exposes the real upper');
  for(const at of [.25,.5,.75]) for(const key of ['rotationX','rotationY','rotationZ','fill']) {
    assert(Math.abs(journeyPose('hero',at-1e-6)[key]-journeyPose('hero',at+1e-6)[key])<.0001,'shot boundaries remain continuous');
  }
});
