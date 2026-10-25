import { journeyModelKey } from './journey-models.mjs';
import { Euler, Vector3 } from 'three';
import { journeyPose } from './journey-poses.mjs';
import { fittedCameraZ } from './scene-framing.mjs';

const clamp = value => Math.min(1, Math.max(0, value));
export function studyTransition(specs, progress, radius = .065) {
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

// A model identity is exchanged as one complete opaque product at the
// caption boundary. No axis stretching, half-shoe splice or heel spin.
export function exchangeModelSpec(spec, exchange = null) {
  return exchange ? (exchange.progress < .5 ? exchange.from : exchange.to) : spec;
}

// Fit the entire authored inspection once. The camera then stays put while
// the model turns, rather than retreating and advancing at every scroll step.
export function chapterCameraDistance(pointSets, chapter, { aspect, fov = 32 }) {
  if (!(aspect > 0) || !pointSets.length) return 0;
  const points = pointSets.flat();
  const world = points.map(() => new Vector3());
  const rotation = new Euler(0, 0, 0, 'XYZ');
  let distance = 0;
  for (let index = 0; index <= 40; index++) {
    const pose = journeyPose(chapter, index / 40);
    rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ, 'XYZ');
    points.forEach((point, i) => world[i].copy(point).applyEuler(rotation));
    distance = Math.max(distance, fittedCameraZ(world, { fov, aspect, y: pose.cameraY, fill: pose.fill }));
  }
  return distance * 1.015;
}

// A shared WebGL buffer can draw separate DOM windows. The viewport preserves
// each camera's full frame; the scissor clips it to its own chapter and screen.
export function productWindowViewport(rect, section, viewport, buffer) {
  const sx = buffer.width / viewport.width, sy = buffer.height / viewport.height;
  const x = rect.left * sx, y = (viewport.height - rect.top - rect.height) * sy;
  const width = rect.width * sx, height = rect.height * sy;
  const clipX = Math.max(0, x, section.left * sx);
  const clipY = Math.max(0, y, (viewport.height - section.bottom) * sy);
  const clipW = Math.min(buffer.width, x + width, section.right * sx) - clipX;
  const clipH = Math.min(buffer.height, y + height, (viewport.height - section.top) * sy) - clipY;
  if (![x, y, width, height, clipX, clipY, clipW, clipH].every(Number.isFinite) || width <= 0 || height <= 0 || clipW <= 0 || clipH <= 0) return null;
  return { viewport: [x, y, width, height], scissor: [clipX, clipY, clipW, clipH] };
}
