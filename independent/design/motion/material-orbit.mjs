const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value); return p * p * p * (p * (p * 6 - 15) + 10); };
export const MATERIAL_ORBIT_CAMERA = { z: 6.15, y: .08, fov: 32 };

// One ring, two 120-degree advances, three reading holds. This same projection
// drives the real models and the photographic fallback, including reverse seeks.
export function materialOrbit(progress) {
  const p = clamp(progress);
  const turn = smooth((p - .12) / .3) + smooth((p - .58) / .3);
  const angle = -turn * Math.PI * 2 / 3;
  const items = Array.from({ length: 3 }, (_, index) => {
    const theta = angle + index * Math.PI * 2 / 3;
    const front = Math.cos(theta);
    return { index, x: Math.sin(theta) * 1.95, y: Math.sin(theta) * .78 - .42 * front,
      z: (front - 1) * 2.35, rotationX: .18 + (1 - front) * .10,
      rotationY: -.18 + Math.sin(theta) * .42, rotationZ: -.025 + Math.sin(theta) * .06,
      emphasis: (front + 1) / 2 };
  });
  const active = items.reduce((a, b) => a.z >= b.z ? a : b).index;
  return { angle, active, items };
}

// Keep every sneaker inside the same camera gate across short desktop windows.
export function materialOrbitCamera(aspect) {
  return Math.max(MATERIAL_ORBIT_CAMERA.z, 8.2 / Math.max(.5, aspect));
}

export function projectMaterialOrbit(item, width, height) {
  const tangent = Math.tan(MATERIAL_ORBIT_CAMERA.fov * Math.PI / 360);
  const depth = materialOrbitCamera(width / height) - item.z;
  const unit = height / (2 * tangent * depth);
  return { x: width / 2 + item.x * unit, y: height / 2 - (item.y - MATERIAL_ORBIT_CAMERA.y) * unit,
    width: 2.6 * unit, depth };
}
