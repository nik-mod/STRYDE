export const CHAPTERS = Object.freeze(['hero', 'deconstruction', 'materials', 'technology', 'collection', 'featured', 'brand', 'finale']);
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

export function chapterState(index, progress, direction = 1) {
  const chapter = Math.round(clamp(index, 0, CHAPTERS.length - 1));
  const local = clamp(progress);
  return Object.freeze({ chapter, id: CHAPTERS[chapter], local, global: (chapter + local) / CHAPTERS.length, direction: direction < 0 ? -1 : 1 });
}

// Shared phase boundaries. The DOM timeline and the 3D rig both key off these,
// so an image fallback and a GLB model tell the same story at the same scroll.
// The initial viewport (progress 0) is the establish composition.
export const HERO_PHASES = Object.freeze(['establish', 'depth', 'transform', 'macro', 'handoff', 'rest']);

const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => { const c = clamp(t); return c * c * (3 - 2 * c); };
// Zero-based smooth segment: continuous at both ends, so phase sums never jump.
const span = (p, from, to) => smooth((p - from) / (to - from));

// No incremental transforms: the same input always returns the same pose in either direction.
export function heroPose(progress) {
  const p = clamp(progress);
  // Absolute poses keep fast scrolling and reverse seeks on the same path.
  // First turn away slightly, then reveal the side before levelling for Anatomy.
  const track = values => values[0]
    + (values[1] - values[0]) * span(p, 0, .18)
    + (values[2] - values[1]) * span(p, .18, .46)
    + (values[3] - values[2]) * span(p, .46, .72)
    + (values[4] - values[3]) * span(p, .72, .9);
  const rotationY = track([-.28, -.32, .1, .04, .02]);
  const rotationZ = track([.08, .06, .02, -.02, 0]);
  const rotationX = track([.23, .28, .32, .22, .16]);
  const cameraZ = track([4.8, 4.7, 4.6, 4.45, 4.8]);
  const cameraY = track([.1, .12, .08, .17, .08]);
  const fov = track([32, 32, 32, 33, 32]);
  const keyIntensity = track([3.4, 3.6, 3.8, 4.6, 3.4]);
  const rimIntensity = track([2, 2.3, 2.5, 2.8, 2]);
  return { rotationX, rotationY, rotationZ, cameraZ, cameraY, fov, keyIntensity, rimIntensity };
}

// Phase label for the current scroll position (shared with the DOM path).
export function heroPhase(progress) {
  const p = clamp(progress);
  if (p < .18) return 'depth';
  if (p < .46) return 'transform';
  if (p < .72) return 'macro';
  if (p < .9) return 'handoff';
  return 'rest';
}

export function createProgressBus() {
  let state = chapterState(0, 0);
  const listeners = new Set();
  return {
    get state() { return state; },
    publish(next) { state = next; for (const listener of listeners) listener(state); },
    subscribe(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener); },
    dispose() { listeners.clear(); },
    get subscriberCount() { return listeners.size; },
  };
}
