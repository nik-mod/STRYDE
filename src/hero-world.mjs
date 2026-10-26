import * as THREE from 'three';
import { heroDirection } from './journey-poses.mjs';

// A single continuous surface, shaped into three wind-folded crests. Both
// displacement and its normals run on the GPU; no vertex arrays are uploaded
// during animation. This is part of the journey scene, not another renderer.
const surface = /* glsl */`
  uniform float worldTime;
  uniform float worldProgress;
  uniform float worldStrength;
  varying vec3 vTerrain;
  // Height and exact first derivatives in one evaluation. Avoid the five
  // repeated height samples a finite-difference normal would require.
  vec3 crest(vec2 point, float center, float centerDx, float amplitude, float amplitudeDx, float width) {
    float delta = point.y - center;
    float g = exp(-delta * delta / (width * width));
    float slope = 2.0 * delta / (width * width);
    return vec3(amplitude * g, g * (amplitudeDx + amplitude * slope * centerDx), -slope * amplitude * g);
  }
  vec3 landscape(vec2 point) {
    float x = point.x, z = point.y, t = worldTime, p = worldProgress;
    float sideU = clamp((x + 4.5) / 6.0, 0.0, 1.0);
    float side = 0.52 + 0.48 * sideU * sideU * (3.0 - 2.0 * sideU);
    float sideDx = 0.48 * sideU * (1.0 - sideU);
    float aPhase = x * 0.58 + t * 0.48;
    float bPhase = x * 0.4 - t * 0.31 + 1.4;
    float cPhase = x * 0.31 + t * 0.23;
    float aAmp = 1.6 + 0.28 * sin(t * 0.6 + x * 0.3) + p * 0.24;
    float bAmp = 3.15 + 0.36 * sin(t * 0.45 - x * 0.2);
    float cAmp = 4.35 + 0.32 * cos(t * 0.35 + x * 0.4);
    // Wind travels through separate depth planes. Scroll opens the valley and
    // draws its far crest past the camera, rather than dissolving the world.
    vec3 field = crest(point, -2.0 + 0.85 * sin(aPhase) - p * 1.10, 0.493 * cos(aPhase),
      side * aAmp, sideDx * aAmp + side * 0.084 * cos(t * 0.6 + x * 0.3), 0.72 + p * 0.26);
    field += crest(point, -4.8 + 1.10 * sin(bPhase) + p * 1.8, 0.44 * cos(bPhase),
      side * bAmp, sideDx * bAmp - side * 0.072 * cos(t * 0.45 - x * 0.2), 0.92);
    field += crest(point, -7.4 + 1.0 * sin(cPhase) + p * 2.2, 0.31 * cos(cPhase),
      side * cAmp, sideDx * cAmp - side * 0.128 * sin(t * 0.35 + x * 0.4), 1.1);
    float micro = x * 1.3 + z * 0.7 + t * 0.55;
    field += vec3(0.035 * sin(micro), 0.0455 * cos(micro), 0.0245 * cos(micro));
    // A clear basin protects the whole sneaker throughout the transformation.
    float bzPoint = z + p * 0.5 - 0.05;
    vec2 basinU = clamp((abs(vec2(x, bzPoint)) - vec2(1.85, 0.85)) / vec2(0.95, 0.85), 0.0, 1.0);
    vec2 basinStep = basinU * basinU * (3.0 - 2.0 * basinU);
    vec2 basinDerivative = 6.0 * basinU * (1.0 - basinU) / vec2(0.95, 0.85) * sign(vec2(x, bzPoint));
    float basin = 1.0 - (1.0 - basinStep.x) * (1.0 - basinStep.y);
    field *= worldStrength;
    return vec3(-0.84 + basin * field.x,
      basin * field.y + basinDerivative.x * (1.0 - basinStep.y) * field.x,
      basin * field.z + basinDerivative.y * (1.0 - basinStep.x) * field.x);
  }
`;

// Expanding the existing product frustum keeps the shoe in exactly its authored
// DOM window, while revealing the surrounding world through the SAME camera.
export function expandHeroCamera(camera, product, stage) {
  camera.setViewOffset(product.width, product.height,
    stage.left - product.left, stage.top - product.top, stage.width, stage.height);
}

export function createHeroWorld({ scene, root, compact }) {
  const group = new THREE.Group(); group.name = 'Hero living landscape'; group.visible = false;
  const geometry = new THREE.PlaneGeometry(26, 24, compact ? 96 : 112, compact ? 160 : 192);
  geometry.rotateX(-Math.PI / 2);
  const uniforms = { worldTime: { value: 0 }, worldProgress: { value: 0 }, worldStrength: { value: 1 } };
  const material = new THREE.MeshStandardMaterial({
    color: 0x98c6de, roughness: .48, metalness: 0, envMapIntensity: .32,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${surface}`)
      .replace('#include <beginnormal_vertex>', /* glsl */`
        vec3 terrainField = landscape(position.xz);
        vec3 objectNormal = normalize(vec3(-terrainField.y, 1.0, -terrainField.z));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif
      `)
      .replace('#include <begin_vertex>', /* glsl */`
        vec3 transformed = vec3(position.x, terrainField.x, position.z);
        vTerrain = transformed;
      `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTerrain;')
      .replace('#include <color_fragment>', /* glsl */`
        #include <color_fragment>
        float crest = smoothstep(-0.7, 2.5, vTerrain.y);
        diffuseColor.rgb *= mix(vec3(0.40, 0.66, 0.88), vec3(1.0, 1.0, 1.0), crest);
      `);
  };
  material.customProgramCacheKey = () => 'stryde-wind-valley-v3';
  const terrain = new THREE.Mesh(geometry, material);
  terrain.name = 'Continuous animated satin terrain'; terrain.receiveShadow = true;
  // The plane's undeformed bounds do not include the high crests.
  terrain.frustumCulled = false;
  group.add(terrain); scene.add(group);
  const stage = root.querySelector('[data-hero-stage]');
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  const pointer = event => {
    if (event.pointerType === 'touch') return;
    const rect = stage.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  };
  const leave = () => { targetX = targetY = 0; };
  stage.addEventListener('pointermove', pointer, { passive: true });
  stage.addEventListener('pointerleave', leave);
  const fog = new THREE.Fog(0xc5e2ee, 11, 27);
  return {
    group, fog,
    update(time, progress, dt, camera, rig, key, rim, entrance = 1) {
      const direction = heroDirection(progress);
      uniforms.worldTime.value = time;
      uniforms.worldProgress.value = direction.world;
      uniforms.worldStrength.value = direction.strength;
      const damping = 1 - Math.exp(-dt * 3);
      pointerX += (targetX - pointerX) * damping; pointerY += (targetY - pointerY) * damping;
      const truck = Math.sin(time * .20) * .055 + direction.truck + pointerX * .09;
      const lift = Math.sin(time * .22) * .008 + direction.lift - pointerY * .012;
      camera.position.x = truck; camera.position.y += lift;
      camera.position.z *= direction.dolly * (1 + (1 - entrance) * .04);
      camera.rotation.set(Math.sin(progress * Math.PI) * .016 - pointerY * .004,
        -Math.sin(progress * Math.PI) * .055 + pointerX * .008, 0);
      // The world has real parallax, but the subject's frame and original scale
      // stay protected. One small 3D arrival resolves into the first scroll pose.
      rig.position.set(truck, lift + .035 * (1 - entrance), 0);
      rig.rotation.y -= .10 * (1 - entrance);
      group.position.z = direction.world * .42;
      key.position.set(-3.8 + direction.light * 7.0 + Math.sin(time * .32) * .65,
        3.2 + Math.cos(time * .28) * .25, 4.5);
      key.intensity = 2.65 + Math.sin(time * .32) * .18;
      rim.position.set(-3.0, 2.5, -2.5); rim.intensity = 1.65;

    },
    dispose() {
      stage.removeEventListener('pointermove', pointer); stage.removeEventListener('pointerleave', leave);
      scene.remove(group); geometry.dispose(); material.dispose();
    },
  };
}
