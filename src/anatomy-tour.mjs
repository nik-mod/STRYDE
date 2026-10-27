const clamp = p => Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
const smooth = p => { const t = clamp(p); return t * t * t * (t * (t * 6 - 15) + 10); };
const shot = (rx, ry, rz, x, y, z, zoom, keyX, keyY, keyZ) => ({
  rotationX: rx, rotationY: ry, rotationZ: rz, focusX: x, focusY: y, focusZ: z, zoom, keyX, keyY, keyZ,
});
const full = shot(.18, -.18, -.015, 0, 0, 0, 1, -3, 3.8, 4);
export const ANATOMY_STOPS = Object.freeze([
  [0, full], [.06, full],
  [.15, shot(.50, -.22, -.025, -.36, .18, .22, 1.42, -3, 4, 4)],
  [.20, shot(.50, -.22, -.025, -.36, .18, .22, 1.42, -3, 4, 4)],
  [.31, shot(.16, -.38, -.015, .05, .06, .30, 1.45, -4, 1.8, 4)],
  [.36, shot(.16, -.38, -.015, .05, .06, .30, 1.45, -4, 1.8, 4)],
  [.47, shot(.03, .20, 0, .40, -.35, .20, 1.55, 3, .6, 4)],
  [.52, shot(.03, .20, 0, .40, -.35, .20, 1.55, 3, .6, 4)],
  [.63, shot(-1.12, -.12, -.03, 0, -.25, 0, 1.18, -1, -2, 4)],
  [.68, shot(-1.12, -.12, -.03, 0, -.25, 0, 1.18, -1, -2, 4)],
  [.79, shot(.72, -.35, -.08, .45, .20, 0, 1.50, 2, 4, 3)],
  [.84, shot(.72, -.35, -.08, .45, .20, 0, 1.50, 2, 4, 3)],
  [.95, full], [1, full],
]);
export const ANATOMY_DETAIL_PROGRESS = [.175, .335, .495, .655, .815];
export function anatomyTour(progress) {
  const p = clamp(progress);
  let pose = full;
  for (let i = 1; i < ANATOMY_STOPS.length; i++) if (p <= ANATOMY_STOPS[i][0]) {
    const [a, from] = ANATOMY_STOPS[i - 1], [b, to] = ANATOMY_STOPS[i];
    const t = smooth((p - a) / (b - a));
    pose = Object.fromEntries(Object.keys(from).map(key => [key, from[key] + (to[key] - from[key]) * t]));
    break;
  }
  const active = p < .26 ? 0 : p < .42 ? 1 : p < .58 ? 2 : p < .74 ? 3 : 4;
  const start = [0, .26, .42, .58, .74][active];
  return { ...pose, active, captionOffset: (active % 2 ? 10 : -10) * (1 - smooth((p - start) / .055)) };
}
export function anatomyCamera(aspect, zoom) {
  return Math.max(2.85, 4.7 / Math.max(.5, aspect)) / zoom;
}
