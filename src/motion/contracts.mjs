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
  const rotationY = mix(-.38, .16, span(p, 0, .46)) + mix(0, .1, span(p, .46, .72)) - mix(0, .16, span(p, .72, .9));
  const rotationZ = .56 - mix(0, .2, span(p, 0, .46)) - mix(0, .44, span(p, .72, .9));
  const rotationX = .26 + mix(0, .02, span(p, .46, .72)) - mix(0, .28, span(p, .72, .9));
  const cameraZ = 4.8 - mix(0, .65, span(p, 0, .46)) - mix(0, .55, span(p, .46, .72)) + mix(0, .7, span(p, .72, .9));
  const cameraY = .1 + mix(0, .06, span(p, .46, .72)) - mix(0, .08, span(p, .72, .9));
  const fov = 32 + mix(0, 3.2, span(p, .46, .72)) - mix(0, 3.2, span(p, .72, .9));
  const keyIntensity = 3.4 + mix(0, 1.1, span(p, .46, .72)) - mix(0, 1.1, span(p, .72, .9));
  const rimIntensity = 2 + mix(0, .7, span(p, .46, .72)) - mix(0, .7, span(p, .72, .9));
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
