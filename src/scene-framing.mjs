// Fit the actual silhouette points, or original bound corners when no hull is
// available. Re-boxing a rotated shoe creates empty space and camera retreat.
// Camera looks down -Z; recompute on pose AND viewport changes, without dolly
// accumulation or DOM scaling. A small safe area also covers pointer parallax.
export function fittedCameraZ(points, { fov, aspect, y = 0, fill = .94 }) {
  const tangent = Math.tan(fov * Math.PI / 360) * fill;
  let distance = .01;
  for (const point of points) {
    distance = Math.max(distance, point.z + Math.abs(point.x) / (tangent * aspect), point.z + Math.abs(point.y - y) / tangent);
  }
  return distance;
}

// Continue a fit from an existing distance with additional points — e.g. the
// studio set beneath the product — so the whole composition stays framed.
export function widestCameraZ(distance, points, { fov, aspect, y = 0, fill = .94 }) {
  const tangent = Math.tan(fov * Math.PI / 360) * fill;
  let result = distance;
  for (const point of points) {
    result = Math.max(result, point.z + Math.abs(point.x) / (tangent * aspect), point.z + Math.abs(point.y - y) / tangent);
  }
  return result;
}
