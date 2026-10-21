// A subtle render-time material study for the bundled preview model only.
// Preserve its original PBR maps; do not manufacture higher-resolution geometry.
export function refinePreviewMaterial(material, normalChunk) {
  if (!material.map || !material.normalMap) return;
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = shader => {
    previous(shader);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
      #include <roughnessmap_fragment>
      float studyFabric = smoothstep(0.06, 0.24, diffuseColor.b - diffuseColor.r);
      float studyPale = smoothstep(0.5, 0.85, diffuseColor.r) * (1.0 - studyFabric);
      roughnessFactor = clamp(roughnessFactor + studyFabric * 0.15 + studyPale * 0.05, 0.04, 1.0);
    `).replace('#include <normal_fragment_maps>', normalChunk.replace('mapN.xy *= normalScale;', `
      vec2 studyUv = vNormalMapUv * 360.0;
      float studyVisibility = 1.0 - smoothstep(0.3, 1.0, max(fwidth(studyUv.x), fwidth(studyUv.y)));
      mapN.xy += sin(studyUv * 6.283185) * (0.7 + 0.3 * cos(studyUv.yx * 6.283185)) * 0.16 * studyFabric * studyVisibility;
      vec2 grainUv = vNormalMapUv * 1100.0;
      float grainVisibility = 1.0 - smoothstep(0.3, 0.9, max(fwidth(grainUv.x), fwidth(grainUv.y)));
      vec2 grain = fract(sin(vec2(dot(floor(grainUv), vec2(127.1,311.7)), dot(floor(grainUv), vec2(269.5,183.3)))) * 43758.5453) - 0.5;
      mapN.xy += grain * 0.10 * studyPale * grainVisibility;
      mapN.xy *= normalScale;
    `));
  };
  material.customProgramCacheKey = () => 'stryde-preview-surface-v2';
  material.needsUpdate = true;
}
