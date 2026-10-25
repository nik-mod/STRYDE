// Model identity belongs to the active product window, including each material
// panel. A chapter with no override continues to use the original hero model.
export function journeyModelSpec(override = {}, primary) {
  const url = override.journeyModel || primary.url;
  const rawYaw = override.journeyModel ? override.journeyYaw : primary.yaw;
  const yaw = rawYaw === undefined || rawYaw === '' ? primary.yaw : Number(rawYaw);
  return {
    url,
    yaw: Number.isFinite(yaw) ? yaw : primary.yaw,
    variant: override.journeyModel ? (override.journeyVariant || 'blue') : primary.variant,
  };
}

export function journeyModelKey(spec) {
  return JSON.stringify([spec.url, spec.yaw, spec.variant]);
}
