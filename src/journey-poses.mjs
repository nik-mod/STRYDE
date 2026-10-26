const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const smooth = value => { const p = clamp(value); return p * p * p * (p * (p * 6 - 15) + 10); };
const mix = (a, b, p) => a + (b - a) * p;

export function interpolateJourneyPose(from, to, progress) {
  const p = smooth(progress);
  if (p === 0) return { ...from };
  if (p === 1) return { ...from, ...to };
  return Object.fromEntries(Object.keys(from).map(key => [key, mix(from[key], to[key] ?? from[key], p)]));
}

// Shape-preserving Hermite tangents carry velocity across inspection keys.
// A genuine change of direction or an authored hold still settles to zero;
// intermediate keys no longer restart an easing curve at every scroll beat.
function tourThrough(stops, progress) {
  const p = clamp(progress);
  const tangent = (index, key) => {
    if (index === 0 || index === stops.length - 1) return 0;
    const h0 = stops[index][0] - stops[index - 1][0], h1 = stops[index + 1][0] - stops[index][0];
    const d0 = (stops[index][1][key] - stops[index - 1][1][key]) / h0;
    const d1 = (stops[index + 1][1][key] - stops[index][1][key]) / h1;
    if (!d0 || !d1 || Math.sign(d0) !== Math.sign(d1)) return 0;
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  for (let i = 1; i < stops.length; i++) if (p <= stops[i][0]) {
    const [a, from] = stops[i - 1], [b, to] = stops[i], h = b - a, t = (p - a) / h;
    if (t === 0) return { ...from };
    if (t === 1) return { ...to };
    const t2 = t * t, t3 = t2 * t;
    return Object.fromEntries(Object.keys(from).map(key => from[key] === to[key] ? [key, from[key]] : [key,
      (2 * t3 - 3 * t2 + 1) * from[key] + (t3 - 2 * t2 + t) * h * tangent(i - 1, key)
      + (-2 * t3 + 3 * t2) * to[key] + (t3 - t2) * h * tangent(i, key)]));
  }
  return { ...stops.at(-1)[1] };
}

const pose = (rotationX, rotationY, rotationZ, fill = .94, cameraY = .04, exposure = .94) => ({ rotationX, rotationY, rotationZ, fill, cameraY, exposure });

// Absolute world-axis poses. The model's base yaw is applied beneath this rig,
// so X tilts reveal the actual top/outsole rather than rolling a side image.
const TRACKS = {
  hero: [
    [0, pose(.18, -.26, -.018, .88)],
    [.25, pose(.28, -.06, -.012, .88)],
    [.52, pose(.50, .22, .012, .88)],
    [.76, pose(.32, .12, .006, .88)],
    [1, pose(.18, -.10, 0, .88)],
  ],
  deconstruction: [
    [0, pose(.18, -.10, 0, .88)],
    [.17, pose(.18, -.10, 0, .88)],
    [.30, pose(.50, .10, 0, .88)],
    [.50, pose(.50, .10, 0, .88)],
    [.65, pose(-.32, .08, 0, .88)],
    [.84, pose(-.32, .08, 0, .88)],
    [1, pose(.22, -.06, 0, .88)],
  ],
  materials: [
    [0, pose(.3, -.28, -.02, .88)],
    [.18, pose(.43, .18, .015, .88)],
    [.3, pose(.16, -.06, 0, .88)],
    [.43, pose(.22, -.2, -.015, .88)],
    [.53, pose(.4, .28, .02, .88)],
    [.63, pose(.14, -.04, 0, .88)],
    [.78, pose(.26, -.26, -.015, .88)],
    [.92, pose(.4, .18, .015, .88)],
    [1, pose(.18, -.1, 0, .88)],
  ],
  technology: [
    [0, pose(.12, -.18, 0, .88)],
    [.45, pose(-.28, .12, 0, .88)],
    [.72, pose(.34, .10, 0, .88)],
    [1, pose(.44, -.06, 0, .88)],
  ],
  featured: [
    [0, pose(.14, -.14, -.012, .88)],
    [.62, pose(.34, .18, .012, .88)],
    [1, pose(.16, -.04, 0, .88)],
  ],
  brand: [
    [0, pose(.10, -.08, 0, .88)],
    [.24, pose(.56, -.08, 0, .88)],
    [.36, pose(.56, -.08, 0, .88)],
    [.50, pose(.10, -.08, 0, .88)],
    [.64, pose(-.56, -.08, 0, .88)],
    [1, pose(-.56, -.08, 0, .88)],
  ],
  finale: [
    [0, pose(.12, -.08, 0, .88)],
    [.6, pose(.12, 0, 0, .88)],
    [1, pose(.12, 0, 0, .88)],
  ],
};

export const JOURNEY_CHAPTERS = Object.freeze(Object.keys(TRACKS));

export function journeyPose(chapter, progress) {
  return tourThrough(TRACKS[chapter] || TRACKS.hero, progress);
}

// Shared editorial beats. The environment, actual camera and HTML timeline
// all consume the existing Hero progress; there is no additional scroll clock.
export function heroDirection(progress) {
  return tourThrough([
    [0, { dolly: 1, truck: 0, lift: 0, world: 0, strength: 1, light: 0 }],
    [.25, { dolly: .98, truck: .40, lift: .04, world: .62, strength: .95, light: .24 }],
    [.52, { dolly: .95, truck: 1.10, lift: .08, world: 1.40, strength: .72, light: .56 }],
    [.76, { dolly: .98, truck: 1.45, lift: .04, world: 1.85, strength: .86, light: .82 }],
    [1, { dolly: 1.02, truck: 1.60, lift: 0, world: 2.20, strength: .68, light: 1 }],
  ], progress);
}

// A virtual camera gate, not a DOM/model scale. It opens into the space yielded
// by the headline, then resolves to the original gate before the handoff.
export function heroProductGate(rect, progress, compact = false) {
  const p = clamp(progress);
  if (p === 0 || p === 1) return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  if (compact) return { left: rect.left, top: rect.top - rect.height * .035 * Math.sin(Math.PI * p) ** 2, width: rect.width, height: rect.height };
  const swell = Math.sin(Math.PI * p) ** 2 * .08;
  return { ...rect, left: rect.left - rect.width * swell, top: rect.top - rect.height * swell,
    width: rect.width * (1 + swell), height: rect.height * (1 + swell) };
}

export function brandStudyPhase(progress) {
  const angle = journeyPose('brand', progress).rotationX;
  return angle > .3 ? 1 : angle < -.3 ? 2 : 0;
}

export function brandLighting(progress) {
  const p = smooth(progress), angle = -.95 + p * 2.4;
  return {
    key: [Math.sin(angle) * 4.8, 2.1 + Math.sin(Math.PI * p) * 1.4, 2.4 + Math.cos(angle) * 1.6],
    rim: [-Math.sin(angle) * 3.2, 1.6, -3.1],
    keyIntensity: 2.8 + Math.sin(Math.PI * p) * .7,
    rimIntensity: 2.4,
  };
}

// One product stage travels between the two visible authored windows.
export function journeyHandoff(from, to, viewportHeight) {
  if (!(viewportHeight > 0)) return null;
  const fromBottom = from.top + from.height;
  const toBottom = to.top + to.height;
  if (fromBottom <= 0 || from.top >= viewportHeight || toBottom <= 0 || to.top >= viewportHeight) return null;
  const fromCenter = from.top + from.height / 2;
  const toCenter = to.top + to.height / 2;
  if (toCenter <= fromCenter) return null;
  const progress = clamp((viewportHeight / 2 - fromCenter) / (toCenter - fromCenter));
  if (progress <= 0 || progress >= 1) return null;
  return { index: progress < .5 ? 0 : 1, progress, opacity: 1 };
}

export function journeyProgress(scroll, start, end) {
  return Number.isFinite(scroll) && Number.isFinite(start) && Number.isFinite(end) && end > start
    ? clamp((scroll - start) / (end - start)) : 0;
}

export function flowingMaterialSample(frames, panels, viewportHeight) {
  const midline = viewportHeight * .48;
  let index = 0, best = -Infinity;
  frames.forEach((rect, candidate) => {
    const visible = Math.max(0, Math.min(viewportHeight, rect.bottom) - Math.max(0, rect.top));
    const contains = rect.top <= midline && rect.bottom >= midline;
    const centerDistance = Math.abs((rect.top + rect.bottom) / 2 - midline);
    const score = (contains ? 3 : 0) + visible / Math.max(1, Math.min(rect.height, viewportHeight)) - centerDistance / viewportHeight * .2;
    if (score > best) { best = score; index = candidate; }
  });
  const panel = panels[index];
  const local = clamp((viewportHeight * .8 - panel.top) / Math.max(1, panel.height + viewportHeight * .2));
  return { index, progress: (index + local) / Math.max(1, frames.length) };
}
