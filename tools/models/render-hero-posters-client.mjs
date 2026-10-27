// Offline fallback export through the production scene, not a second renderer
// in the storefront. The GLB, camera, materials and environment are identical.
import { mountJourneyScene } from '../../src/journey-scene.mjs';
const root = document.querySelector('[data-hero]');
root.querySelector('[data-hero-poster]')?.removeAttribute('data-hero-poster');
document.documentElement.className = 'js';
document.body.classList.add('has-chapter-continuity');
document.body.style.setProperty('--journey-surface', '#b9dced');
document.body.style.setProperty('--journey-ink', '#102b3b');
const frames = [], abort = new AbortController();
let view;
const cleanup = await mountJourneyScene({ root, url: new URL(root.dataset.modelUrl, location.href).href,
  scheduler: { add(frame) { frames.push(frame); return () => {}; } }, signal: abort.signal,
  bus: { state: { local: 0, entrance: 1 } }, onReady: state => { view = state; },
});
frames.forEach(frame => frame(0));
const { renderer, scene, camera, rig, world } = view;
const stage = root.querySelector('[data-hero-stage]').getBoundingClientRect();
const compact = innerWidth <= 700, suffix = compact ? 'mobile' : 'desktop';
const output = document.createElement('canvas'); output.width = Math.round(stage.width); output.height = Math.round(stage.height);
const context = output.getContext('2d', { willReadFrequently: true });
async function save(name, crop = false) {
  renderer.render(scene, camera);
  context.clearRect(0, 0, output.width, output.height);
  context.drawImage(renderer.domElement, 0, 0, output.width, output.height);
  let canvas = output;
  if (crop) {
    const data = context.getImageData(0, 0, output.width, output.height).data;
    let left = output.width, right = 0, top = output.height, bottom = 0;
    for (let y = 0; y < output.height; y++) for (let x = 0; x < output.width; x++) if (data[(y * output.width + x) * 4 + 3] > 3) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    canvas = document.createElement('canvas'); canvas.width = right - left + 5; canvas.height = bottom - top + 5;
    canvas.getContext('2d').drawImage(output, left - 2, top - 2, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .94));
  await fetch(`/capture/${name}-${suffix}.webp`, { method: 'POST', body: blob });
}
rig.visible = false; await save('hero-world');
if (!new URLSearchParams(location.search).has('worldOnly')) {
  rig.visible = true; world.group.visible = false; await save('hero-product', true);
}
abort.abort(); cleanup();
document.body.dataset.postersReady = 'true';
