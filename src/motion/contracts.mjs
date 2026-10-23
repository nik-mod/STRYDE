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
  // A wider, more theatrical arc: the establish sweep travels further before
  // the macro close-up breathes in, and the handoff levels the shoe dead-flat
  // for the chapter-02 projection. Spans stay smooth and boundary-continuous.
  const rotationY = mix(-.4, .18, span(p, 0, .46)) + mix(0, .06, span(p, .46, .72)) - mix(0, .22, span(p, .72, .9));
  const rotationZ = .56 - mix(0, .24, span(p, 0, .46)) - mix(0, .06, span(p, .46, .72)) - mix(0, .24, span(p, .72, .9));
  const rotationX = .26 + mix(0, .02, span(p, .46, .72)) - mix(0, .28, span(p, .72, .9));
  const cameraZ = 4.8 - mix(0, .7, span(p, 0, .46)) - mix(0, .6, span(p, .46, .72)) + mix(0, .8, span(p, .72, .9));
  const cameraY = .1 + mix(0, .07, span(p, .46, .72)) - mix(0, .09, span(p, .72, .9));
  const fov = 32 + mix(0, 4, span(p, .46, .72)) - mix(0, 3.6, span(p, .72, .9));
  const keyIntensity = 3.4 + mix(0, 1.2, span(p, .46, .72)) - mix(0, 1.2, span(p, .72, .9));
  const rimIntensity = 2 + mix(0, .8, span(p, .46, .72)) - mix(0, .8, span(p, .72, .9));
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
