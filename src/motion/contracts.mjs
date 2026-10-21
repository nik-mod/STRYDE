export const CHAPTERS = Object.freeze(['hero', 'deconstruction', 'materials', 'technology', 'collection', 'featured', 'brand', 'finale']);
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
export function chapterState(index, progress, direction = 1) {
  const chapter = Math.round(clamp(index, 0, CHAPTERS.length - 1));
  const local = clamp(progress);
  return Object.freeze({ chapter, id: CHAPTERS[chapter], local, global: (chapter + local) / CHAPTERS.length, direction: direction < 0 ? -1 : 1 });
}
// No incremental transforms: the same input always returns the same pose in either direction.
export function foundationPose(progress) {
  const p = clamp(progress);
  return { rotationY: -.34 + p * .58, rotationZ: -.08 + p * .1, cameraZ: 4.8 - p * .45 };
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
