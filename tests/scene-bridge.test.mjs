import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneBridge, handoffProgress, profileFootprint, projectionWindow } from '../src/scene-bridge.mjs';
import { PerspectiveCamera, Vector3 } from 'three';

class Element {
  constructor() { this.style = {}; this.attributes = new Map(); this.children = []; this.parentNode = null; this.connected = false; }
  get isConnected() { return this.parentNode ? this.parentNode.isConnected : this.connected; }
  get nextSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this) + 1] || null; }
  append(child) { this.insertBefore(child, null); }
  insertBefore(child, sibling) {
    child.remove();
    const index = sibling ? this.children.indexOf(sibling) : this.children.length;
    this.children.splice(index, 0, child); child.parentNode = this;
  }
  remove() { if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); this.parentNode = null; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
}

function fixture() {
  const environment = { scrollY: 0, innerWidth: 1440, innerHeight: 900, getComputedStyle: () => ({ top: '134px' }) };
  const body = new Element(), host = new Element(), canvas = new Element(), sibling = new Element(), target = new Element();
  body.connected = host.connected = target.connected = true;
  host.append(canvas); host.append(sibling);
  canvas.setAttribute('style', 'display: block'); target.style.opacity = '.7';
  const stage = { offsetHeight: 900 };
  const document = { body, querySelector: () => target, createElement: () => new Element() };
  const root = { ownerDocument: document, dataset: { modelYaw: '90' }, isConnected: true,
    querySelector: () => stage, getBoundingClientRect: () => ({ bottom: 1900 - environment.scrollY }) };
  host.getBoundingClientRect = () => ({ left: 640, top: 180 - Math.max(0, environment.scrollY - 1000), width: 700, height: 500 });
  target.getBoundingClientRect = () => ({ left: 760, top: Math.max(134, 2000 - environment.scrollY), width: 600, height: 500 });
  target.closest = () => target;
  return { root, host, canvas, sibling, target, environment, body };
}

test('single-canvas handoff is seekable in either direction and restores all DOM ownership', () => {
  const f = fixture();
  const bridge = createSceneBridge(f);
  assert.equal(bridge.update().active, false);
  f.environment.scrollY = 1433;
  const midway = { ...bridge.update() };
  assert.equal(midway.progress, .5);
  assert.equal(midway.active, true);
  assert.equal(f.body.children.length, 1);
  const overlay = f.body.children[0];
  assert.equal(overlay.children[0], f.canvas, 'reuse the same canvas, never a second renderer');
  const rectangle = [overlay.style.left, overlay.style.top, overlay.style.width, overlay.style.height];
  f.environment.scrollY = 1900;
  assert.equal(bridge.update().active, false);
  assert.deepEqual(f.host.children, [f.canvas, f.sibling]);
  assert.equal(f.body.children.length, 0);
  assert.equal(f.target.style.opacity, '.7');
  f.environment.scrollY = 1433;
  assert.deepEqual(bridge.update(), midway);
  assert.deepEqual([overlay.style.left, overlay.style.top, overlay.style.width, overlay.style.height], rectangle);
  bridge.dispose(); bridge.dispose();
  assert.deepEqual(f.host.children, [f.canvas, f.sibling]);
  assert.equal(f.canvas.getAttribute('style'), 'display: block');
  assert.equal(f.target.style.opacity, '.7');
  assert.equal(f.body.children.length, 0);
});

test('handoff stays disabled for merchant models and stacked phone layouts', () => {
  const merchant = fixture(); merchant.root.dataset.modelYaw = undefined;
  assert.equal(createSceneBridge(merchant), null);
  const phone = fixture(); phone.environment.innerWidth = 390;
  assert.equal(createSceneBridge(phone), null);
  assert.deepEqual(phone.host.children, [phone.canvas, phone.sibling]);
  assert.equal(phone.target.style.opacity, '.7');
});

test('handoff progress clamps abrupt jumps and rejects invalid geometry', () => {
  assert.equal(handoffProgress(-100, 100, 200), 0);
  assert.equal(handoffProgress(9999, 100, 200), 1);
  assert.equal(handoffProgress(150, 100, 200), .5);
  assert.equal(handoffProgress(150, 200, 100), 0);
  assert.equal(handoffProgress(NaN, 100, 200), 0);
});

test('profile landing measures the image alpha subject rather than its padded frame', () => {
  // Bounds re-measured from the 2800×2100 transparent render: probe space
  // 280×210 reports left 20, top 56, size 232×106 → ×10.
  assert.deepEqual(profileFootprint({ left: 100, top: 50, width: 1400, height: 1400 }), {
    left: 200, top: 505, width: 1160, height: 530,
  });
  const scaled = profileFootprint({ left: 0, top: 0, width: 700, height: 525 });
  assert.deepEqual(scaled, { left: 50, top: 140, width: 580, height: 265 });
});

test('the real Three camera lands a projected subject in the requested alpha footprint', () => {
  const width = 700, height = 600;
  const camera = new PerspectiveCamera(33, width / height, .01, 100);
  camera.position.z = 5; camera.updateMatrixWorld();
  const points = [new Vector3(-1, -.5, 0), new Vector3(1, .5, 0)];
  const bounds = () => {
    const projected = points.map(point => point.clone().project(camera));
    const left = (projected[0].x + 1) * width / 2;
    const top = (1 - projected[1].y) * height / 2;
    return { left, top, width: (projected[1].x - projected[0].x) * width / 2, height: (projected[1].y - projected[0].y) * height / 2 };
  };
  const desired = { left: 90, top: 330, width: 440, height: 220 };
  const original = bounds();
  const view = projectionWindow(original, desired, width, height);
  camera.setViewOffset(width, height, view.x, view.y, view.width, view.height);
  for (const [key, value] of Object.entries(bounds())) assert(Math.abs(value - desired[key]) < 1e-8, key);
  camera.clearViewOffset();
  assert.deepEqual(bounds(), original, 'reverse restores the unmodified camera projection');
});
