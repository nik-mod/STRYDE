import { ShaderChunk } from 'three';

// Material recovery for the existing fused blue preview atlas. Original albedo,
// ORM, normal maps and UVs stay intact. Height/color classify broad finish
// families; they are not an authenticated component or product-accuracy mask.
export function refinePreviewMaterial(material, geometry = null) {
  if (!material.map || !material.normalMap) return;
  geometry?.computeBoundingBox();
  const bounds = geometry?.boundingBox;
  const minY = bounds?.min.y ?? 0, height = Math.max(.00001, (bounds?.max.y ?? 1) - minY);
  const previous = material.onBeforeCompile.bind(material);
  material.normalScale?.set(.9, .9);
  material.envMapIntensity = .75;
  material.onBeforeCompile = shader => {
    previous(shader);
    shader.uniforms.shoeMinY = { value: minY };
    shader.uniforms.shoeHeight = { value: height };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float shoeMinY; uniform float shoeHeight; varying float vShoeHeight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShoeHeight = clamp((position.y - shoeMinY) / shoeHeight, 0.0, 1.0);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vShoeHeight;')
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        float textile = smoothstep(0.06, 0.22, diffuseColor.b - diffuseColor.r);
        float pale = smoothstep(0.38, 0.78, min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b))) * (1.0 - textile);
        float lower = 1.0 - smoothstep(0.22, 0.42, vShoeHeight);
        float darkRubber = 1.0 - smoothstep(0.025, 0.10, max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)));
        // Retain variation from the supplied roughness map, with believable
        // dielectric finishes instead of treating every region as the same shell.
        float finish = roughnessFactor;
        finish = mix(finish, clamp(roughnessFactor * 0.82, 0.48, 0.68), pale * (1.0 - lower));
        finish = mix(finish, clamp(roughnessFactor * 0.96, 0.66, 0.84), pale * lower);
        finish = mix(finish, clamp(roughnessFactor, 0.65, 0.88), textile * (1.0 - lower));
        finish = mix(finish, clamp(roughnessFactor * 0.62, 0.30, 0.45), textile * lower);
        roughnessFactor = mix(finish, max(finish, 0.82), darkRubber);
      `)
      .replace('#include <normal_fragment_maps>', ShaderChunk.normal_fragment_maps.replace(
        'mapN.xy *= normalScale;',
        // Amplify only relief already present in the original textile map;
        // keep pale overlays softer, instead of sharpening the entire mesh.
        `mapN.xy *= normalScale * mix(0.80, 1.18, textile * (1.0 - lower));
        // Filter unresolved relief from the supplied normal atlas into the
        // specular lobe. Distant weave should read as fabric, not shimmer.
        vec3 normalDx = dFdx(mapN), normalDy = dFdy(mapN);
        float normalVariance = min(0.12, 0.5 * (dot(normalDx, normalDx) + dot(normalDy, normalDy)));
        roughnessFactor = sqrt(min(1.0, roughnessFactor * roughnessFactor + normalVariance));`,
      ))
      .replace('#include <metalnessmap_fragment>', `
        #include <metalnessmap_fragment>
        metalnessFactor = min(metalnessFactor, 0.02);
      `);
    // The source normal map supplies seam and cage relief. No invented sine
    // weave, random grain, sharpening, geometry or transparent Air unit is added.
  };
  material.customProgramCacheKey = () => 'stryde-preview-material-finish-v5';
  material.needsUpdate = true;
}
