import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Euler, Vector3 } from 'three';
import { journeyModelSpec, journeyModelKey } from '../src/journey-models.mjs';
import { journeyPose } from '../src/journey-poses.mjs';
import { fittedCameraZ } from '../src/scene-framing.mjs';
import { renderPreview } from '../tools/preview.mjs';

const primary = { url: '/assets/nike-tn-blue-white.glb', yaw: 90, variant: 'blue' };
const drift = { journeyModel: '/assets/nike-tn-monochrome.glb', journeyYaw: '0', journeyVariant: 'drift' };

test('a product window selects its own shoe and preserves zero yaw without changing the original', () => {
  assert.deepEqual(journeyModelSpec(undefined, primary), primary);
  const selected = journeyModelSpec(drift, primary);
  assert.equal(selected.yaw, 0);
  assert.equal(selected.variant, 'drift');
  assert.equal(selected.url, drift.journeyModel);
  assert.notEqual(journeyModelKey(primary), journeyModelKey(selected));
  assert.deepEqual(journeyModelSpec({}, primary), primary);
  assert.equal(journeyModelSpec({ ...drift, journeyYaw: 'invalid' }, primary).yaw, 90);
  assert.equal(primary.yaw, 90);
});

test('the original opening stays blue and the new model occupies the existing chapter 02 and 03 windows', async () => {
  const html = await renderPreview('/');
  const config = JSON.parse(await readFile(new URL('../templates/index.json', import.meta.url)));
  assert.deepEqual(config.order, ['hero','deconstruction','materials','technology','collection','featured','brand','finale']);
  assert.match(html, /data-model-url="\/assets\/nike-tn-blue-white\.glb"/);
  const intro = html.slice(html.indexOf('data-site-intro'), html.indexOf('<a class="skip-link"'));
  for (const marker of ['move-glyph', 'different-glyph', 'glyph', 'curtain', 'macros', 'skip']) {
    assert.match(intro, new RegExp(`data-intro-${marker}`));
  }
  assert.match(intro, /tn-angle-1400.webp/);
  assert.doesNotMatch(intro, /<canvas|data-model-url=/, 'the recovered film adds no second live sneaker renderer');
  assert.doesNotMatch(html, /model-spotlight|drift-spotlight|spotlight-model/);
  assert.equal((html.match(/data-model-url=/g) || []).length, 1);
  assert.equal((html.match(/data-journey-model="\/assets\/nike-tn-monochrome.glb"/g) || []).length, 2);
  const anatomy = html.slice(html.indexOf('id="chapter-deconstruction"'), html.indexOf('id="chapter-materials"'));
  assert.match(anatomy, /Air Max Plus Drift/);
  assert.doesNotMatch(anatomy, /data-journey-from-primary/, 'Anatomy starts with its own product instead of borrowing the Hero model');
  assert.match(anatomy, /White \/ Black \/ Silver/);
  assert.match(anatomy, /tn-mono-profile-2800.webp/);
  assert.match(anatomy, /tn-mono-top-2800.webp/);
  assert.match(anatomy, /tn-mono-sole-2800.webp/);
  assert.doesNotMatch(anatomy, /Sky blue|White laces|Blue \/ White/);
  const material = html.slice(html.indexOf('id="chapter-materials"'), html.indexOf('id="chapter-technology"'));
  const blue = material.slice(0, material.indexOf('id="MatPanel-materials-2"'));
  const white = material.slice(material.indexOf('id="MatPanel-materials-2"'), material.indexOf('id="MatPanel-materials-3"'));
  const navy = material.slice(material.indexOf('id="MatPanel-materials-3"'));
  assert.match(blue, /tn-angle-2800.webp/);
  assert.match(blue, /The original, in blue/);
  assert.match(white, /The Drift, in detail/);
  assert.match(white, /tn-mono-profile-2800.webp/);
  assert.match(navy, /After hours\. In blue/);
  assert.match(navy, /tn-navy-angle-2800.webp/);
  assert.match(navy, /nike-tn-deep-blue.glb/);
  assert.doesNotMatch(navy, /tn-mono-sole/);
  assert.doesNotMatch(white, /blue accents|white laces|gradient upper/);
});

test('the Drift remains inside the existing chapter cameras at phone and desktop aspect ratios', async () => {
  const bytes = await readFile(new URL('../assets/nike-tn-monochrome.glb', import.meta.url));
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
  const hull = gltf.scenes[gltf.scene || 0].extras.strydeFramingHull;
  const min = new Vector3(Infinity, Infinity, Infinity), max = min.clone().negate();
  for (const point of hull) { min.min(new Vector3(...point)); max.max(new Vector3(...point)); }
  const center = min.clone().add(max).multiplyScalar(.5), size = max.clone().sub(min);
  const scale = 2.6 / Math.max(size.x, size.y, size.z);
  const points = hull.map(point => new Vector3(...point).sub(center).multiplyScalar(scale));
  for (const chapter of ['deconstruction','materials']) for (const aspect of [.6, 1, 2.4]) for (let i = 0; i <= 100; i++) {
    const pose = journeyPose(chapter, i / 100), rotation = new Euler(pose.rotationX, pose.rotationY, pose.rotationZ, 'XYZ');
    const world = points.map(point => point.clone().applyEuler(rotation));
    const z = fittedCameraZ(world, { fov: 32, aspect, y: pose.cameraY, fill: pose.fill });
    const tangent = Math.tan(32 * Math.PI / 360);
    for (const point of world) {
      assert(z > point.z);
      assert(Math.abs(point.x / ((z - point.z) * tangent * aspect)) <= 1);
      assert(Math.abs((point.y - pose.cameraY) / ((z - point.z) * tangent)) <= 1);
    }
  }
});

test('the third supplied shoe owns chapter 06 and ships with a bounded delivery mesh', async () => {
  const html = await renderPreview('/');
  const featured = html.slice(html.indexOf('id="chapter-featured"'), html.indexOf('id="chapter-brand"'));
  assert.match(featured, /nike-tn-deep-blue\.glb/);
  assert.doesNotMatch(featured, /data-journey-from-primary/, 'the navy chapter presents its own model without a repeated spin');
  assert.match(featured, /tn-navy-angle-2800\.webp/);
  assert.match(featured, /Blue \/ Navy \/ White/);
  const bytes = await readFile(new URL('../assets/nike-tn-deep-blue.glb', import.meta.url));
  const model = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
  const delivery = model.asset.extras.deliveryMesh;
  assert(delivery.triangles <= 200000);
  assert(delivery.error < .001);
  assert.equal(model.images.length, 3, 'all original PBR texture maps remain embedded');
  assert(model.scenes[0].extras.strydeFramingHull.length < 5000);
});
