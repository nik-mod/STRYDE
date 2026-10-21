import { clamp } from './contracts.mjs';

export const STUDY_BOUNDARIES = Object.freeze([0, .22, .62, 1]);
export const smoothStep = value => value * value * (3 - 2 * value);

// Authored poses, never accumulated deltas. Flat artwork has no rotation axis.
export function studyKeyframes(mobile = false) {
  return [
    { at: 0, phase: 'establish', art: { xPercent: 0, yPercent: 0, scale: 1 }, primary: { xPercent: 0, yPercent: 0 }, secondary: { xPercent: 0, yPercent: 0 }, crop: 0 },
    { at: .22, phase: 'inspect', art: { xPercent: mobile ? -.5 : -1, yPercent: -1, scale: mobile ? 1.012 : 1.025 }, primary: { xPercent: -2, yPercent: -3 }, secondary: { xPercent: 2, yPercent: 3 }, crop: 0 },
    { at: .62, phase: 'handoff', art: { xPercent: mobile ? -1 : -4, yPercent: mobile ? -2 : -4, scale: mobile ? 1.035 : 1.075 }, primary: { xPercent: mobile ? -6 : -9, yPercent: -15 }, secondary: { xPercent: mobile ? 6 : 10, yPercent: 15 }, crop: 12 },
    { at: 1, phase: 'rest', art: { xPercent: mobile ? 0 : -2, yPercent: -2, scale: mobile ? .97 : .96 }, primary: { xPercent: mobile ? -8 : -12, yPercent: -45 }, secondary: { xPercent: mobile ? 8 : 13, yPercent: 45 }, crop: 100 },
  ];
}

export function sampleStudy(progress, mobile = false) {
  const p = clamp(progress);
  const frames = studyKeyframes(mobile);
  const nextIndex = frames.findIndex((frame, index) => index > 0 && p <= frame.at);
  const next = frames[nextIndex < 0 ? frames.length - 1 : nextIndex];
  const previous = frames[Math.max(0, (nextIndex < 0 ? frames.length - 1 : nextIndex) - 1)];
  const local = smoothStep(clamp((p - previous.at) / (next.at - previous.at)));
  const interpolate = (a, b) => a + (b - a) * local;
  const vector = key => Object.fromEntries(Object.keys(previous[key]).map(name => [name, interpolate(previous[key][name], next[key][name])]));
  const phase = p < .22 ? 'establish' : p < .62 ? 'inspect' : p < 1 ? 'handoff' : 'rest';
  return { progress: p, phase, art: vector('art'), primary: vector('primary'), secondary: vector('secondary'), crop: interpolate(previous.crop, next.crop) };
}

export function magneticOffset(point, bounds, limit = 5) {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 };
  const strength = Math.max(0, Number.isFinite(limit) ? limit : 0);
  const axis = value => clamp(value, -1, 1) * strength;
  return {
    x: axis((point.x - bounds.left - bounds.width / 2) / (bounds.width / 2)),
    y: axis((point.y - bounds.top - bounds.height / 2) / (bounds.height / 2)),
  };
}
