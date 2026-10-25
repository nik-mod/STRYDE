const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
const mix = (a, b, p) => a + (b - a) * p;

export function interpolateJourneyPose(from, to, progress) {
  const p = smooth(progress);
  return Object.fromEntries(Object.keys(from).map(key => [key, mix(from[key], to[key] ?? from[key], p)]));
}

function through(stops, progress) {
  const p = clamp(progress);
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) return interpolateJourneyPose(stops[i - 1][1], stops[i][1], (p - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  }
  return { ...stops.at(-1)[1] };
}

const pose = (rotationX, rotationY, rotationZ, fill = .94, cameraY = .04, exposure = .94) => ({ rotationX, rotationY, rotationZ, fill, cameraY, exposure });

// Absolute world-axis poses. The model's base yaw is applied beneath this rig,
// so X tilts reveal the actual top/outsole rather than rolling a side image.
const TRACKS = {
  hero: [
    [0, pose(.23, -.38, .18, .88)],
    [.35, pose(.55, .22, .08, .9)],
    [.66, pose(.18, .58, -.06, .91)],
    [1, pose(.08, 0, 0, .9)],
  ],
  deconstruction: [
    [0, pose(.08, 0, 0, .93)],
    [.44, pose(.32, -.4, .05, .98)],
    [1, pose(-.35, .3, -.04, .94)],
  ],
  materials: [
    [0, pose(.9, -.12, -.1, .94)],
    [.2, pose(.58, .18, -.05, .98)],
    [.43, pose(.05, -.1, 0, .94)],
    [.6, pose(-.34, .16, .04, .97)],
    [.82, pose(-1.42, .05, -.03, .91)],
    [1, pose(-1.33, -.16, 0, .94)],
  ],
  technology: [
    [0, pose(.1, -.18, -.08, .93)],
    [.42, pose(.4, .48, .06, .93)],
    [.75, pose(.25, -.28, -.025, .93)],
    [1, pose(.13, -.08, 0, .92)],
  ],
  featured: [
    [0, pose(.32, -.5, .12, .89)],
    [.5, pose(.18, .35, -.05, .95)],
    [1, pose(.1, .7, 0, .9)],
  ],
  finale: [
    [0, pose(.12, -.18, .04, .9)],
    [.58, pose(.16, .12, .02, .92)],
    [1, pose(.08, 0, 0, .9)],
  ],
};

export const JOURNEY_CHAPTERS = Object.freeze(Object.keys(TRACKS));

export function journeyPose(chapter, progress) {
  return through(TRACKS[chapter] || TRACKS.hero, progress);
}

export function inspectionPose(view) {
  return {
    profile: pose(.08, 0, 0, .9),
    upper: pose(1.35, .03, -.02, .88),
    outsole: pose(-1.42, .03, .02, .88),
  }[view] || null;
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
