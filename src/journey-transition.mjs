import { journeyModelKey } from './journey-models.mjs';

const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
const mix = (a, b, p) => a + (b - a) * p;

// The identity change occupies a short part of a longer, continuous heel turn.
// It is spatial replacement of opaque surfaces, never a dissolve to blank.
export function shoeTurn(progress) {
  const p = clamp(progress);
  return { turn: Math.sin(Math.PI * p) ** 2, surface: smooth((p - .38) / .24) };
}

export function studyTransition(specs, progress, radius = .11) {
  for (let index = 1; index < specs.length; index++) {
    if (journeyModelKey(specs[index - 1]) === journeyModelKey(specs[index])) continue;
    const boundary = index / specs.length;
    if (progress >= boundary - radius && progress <= boundary + radius) {
      return { from: specs[index - 1], to: specs[index], progress: clamp((progress - boundary + radius) / (radius * 2)) };
    }
  }
  return null;
}

export function windowTransition(from, to, progress, start = .24, end = .64) {
  if (journeyModelKey(from) === journeyModelKey(to) || progress >= end) return { spec: to, blend: null };
  if (progress <= start) return { spec: from, blend: null };
  const local = clamp((progress - start) / (end - start));
  return { spec: local < .5 ? from : to, blend: { from, to, progress: local } };
}

export function turnPose(pose, progress) {
  const { turn } = shoeTurn(progress);
  return {
    ...pose,
    rotationX: mix(pose.rotationX, .1, turn),
    rotationY: mix(pose.rotationY, -Math.PI / 2, turn),
    rotationZ: mix(pose.rotationZ, 0, turn),
  };
}

export function travelWindow(from, to, progress) {
  const p = smooth(progress);
  return Object.fromEntries(['left', 'top', 'width', 'height'].map(key => [key, mix(from[key], to[key], p)]));
}

export function transitionCamera(from, to, progress) {
  const p = smooth(progress), distance = mix(from, to, p);
  return distance + Math.sin(Math.PI * p) ** 2 * (Math.max(from, to) - distance);
}
