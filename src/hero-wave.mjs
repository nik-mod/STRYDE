const clamp = p => Math.max(0, Math.min(1, p));
export function heroWave(progress) {
  const phase = clamp((progress - .16) / .68);
  const travel = phase * phase * (3 - 2 * phase);
  return { phase, x: -1.65 + travel * 3.3, strength: Math.sin(Math.PI * phase) ** 2 };
}
