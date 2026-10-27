import * as THREE from 'three';
import { heroDirection } from './journey-poses.mjs';
import { heroWave } from './hero-wave.mjs';

// A single continuous surface, shaped into three wind-folded crests. Both
// displacement and its normals run on the GPU; no vertex arrays are uploaded
// during animation. This is part of the journey scene, not another renderer.
const surface = /* glsl */`
  uniform float worldTime;
  uniform float worldProgress;
  uniform float worldStrength;
  uniform vec2 worldProductCenter;
  varying vec3 vTerrain;
  varying vec3 vWaveNormal;
  varying float vWaveOcclusion;
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
    // Recovered from aa3d365's original three-crest signature wave.
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
    // Smaller wind folds travel across the large crests. Their analytical
    // derivatives keep the same geometry and a single lighting pass.
    float fold = z * 5.2 + x * 1.45 + 0.6 * sin(x * 0.8 - t * 0.38) - t * 0.85;
    float foldDx = 1.45 + 0.48 * cos(x * 0.8 - t * 0.38);
    float envelope = 0.5 + 0.5 * sin(z * 0.6 + x * 0.2 - t * 0.24);
    float envelopeDx = 0.1 * cos(z * 0.6 + x * 0.2 - t * 0.24);
    float envelopeDz = 0.3 * cos(z * 0.6 + x * 0.2 - t * 0.24);
    field += vec3(0.045 * envelope * sin(fold),
      0.045 * (envelopeDx * sin(fold) + envelope * cos(fold) * foldDx),
      0.045 * (envelopeDz * sin(fold) + envelope * cos(fold) * 5.2));
    // A clear basin protects the whole sneaker throughout the transformation.
    vec2 basinPoint = point - worldProductCenter;
    vec2 basinU = clamp((abs(basinPoint) - vec2(2.15, 1.4)) / vec2(0.95, 1.1), 0.0, 1.0);
    vec2 basinStep = basinU * basinU * (3.0 - 2.0 * basinU);
    vec2 basinDerivative = 6.0 * basinU * (1.0 - basinU) / vec2(0.95, 1.1) * sign(basinPoint);
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
  const uniforms = { worldTime: { value: 0 }, worldProgress: { value: 0 }, worldStrength: { value: 1 }, worldProductCenter: { value: new THREE.Vector2() }, worldExit: { value: 0 }, worldViewportHeight: { value: 1 } };
  const material = new THREE.MeshStandardMaterial({
    color: 0x98c6de, roughness: .47, metalness: 0, envMapIntensity: .38,
    side: THREE.DoubleSide, transparent: true, forceSinglePass: true,
  });
  const surfaceColor = new THREE.Color(), restingColor = material.color.clone();
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${surface}`)
      .replace('#include <beginnormal_vertex>', /* glsl */`
        vec3 terrainField = landscape(position.xz);
        vec3 objectNormal = normalize(vec3(-terrainField.y, 1.0, -terrainField.z));
        vWaveNormal = objectNormal;
        // Two height-only neighborhood samples estimate soft valley occlusion
        // on the existing mesh. They do not displace or alter its normals.
        float neighbors = .5 * (landscape(position.xz + vec2(0.0, -.55)).x
          + landscape(position.xz + vec2(0.0, .55)).x);
        vWaveOcclusion = clamp((neighbors - terrainField.x - .025) * 1.5, 0.0, 1.0);
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif
      `)
      .replace('#include <begin_vertex>', /* glsl */`
        vec3 transformed = vec3(position.x, terrainField.x, position.z);
        vTerrain = transformed;
      `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', /* glsl */`
      #include <common>
      uniform float worldExit;
      uniform float worldViewportHeight;
      varying vec3 vTerrain;
      varying vec3 vWaveNormal;
      varying float vWaveOcclusion;
      // Continuous, object-bound mineral grain. No time input: the light and
      // surface move together without texture swimming or random frame noise.
      float waveHash(vec2 p) {
        vec3 h = fract(vec3(p.xyx) * .1031);
        h += dot(h, h.yzx + 33.33);
        return fract((h.x + h.y) * h.z);
      }
      float waveNoise(vec2 p) {
        vec2 cell = floor(p), f = fract(p);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        return mix(mix(waveHash(cell), waveHash(cell + vec2(1, 0)), u.x),
          mix(waveHash(cell + vec2(0, 1)), waveHash(cell + vec2(1, 1)), u.x), u.y);
      }
      float filteredWaveNoise(vec2 p) {
        float footprint = max(length(dFdx(p)), length(dFdy(p)));
        return mix(waveNoise(p), .5, smoothstep(.4, 1.2, footprint));
      }
      float waveVolumeHash(vec3 p) {
        p = fract(p * .1031);
        p += dot(p, p.zyx + 31.32);
        return fract((p.x + p.y) * p.z);
      }
      float waveVolume(vec3 p) {
        float footprint = max(length(dFdx(p)), length(dFdy(p)));
        vec3 cell = floor(p), f = fract(p);
        vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        float low = mix(mix(waveVolumeHash(cell), waveVolumeHash(cell + vec3(1,0,0)), u.x),
          mix(waveVolumeHash(cell + vec3(0,1,0)), waveVolumeHash(cell + vec3(1,1,0)), u.x), u.y);
        float high = mix(mix(waveVolumeHash(cell + vec3(0,0,1)), waveVolumeHash(cell + vec3(1,0,1)), u.x),
          mix(waveVolumeHash(cell + vec3(0,1,1)), waveVolumeHash(cell + vec3(1,1,1)), u.x), u.y);
        return mix(mix(low, high, u.z), .5, smoothstep(.4, 1.2, footprint));
      }
    `)
      .replace('#include <color_fragment>', /* glsl */`
        #include <color_fragment>
        float crest = smoothstep(.4, 4.2, vTerrain.y);
        float mineral = waveNoise(vTerrain.xz * .72 + vec2(7.1, 3.7));
        // Volume sampling gives the steep faces the same tactile detail as
        // the floor instead of stretching a flat XZ texture into vertical lines.
        vec3 mineralSpace = vTerrain * vec3(1.0, .85, 1.0);
        float reliefBody = waveVolume(mineralSpace * 7.5 + vec3(5.3, 2.7, 9.1));
        float grain = waveVolume(mineralSpace * 31.0);
        float pore = filteredWaveNoise(vTerrain.xz * 92.0 + vec2(13.4, 5.7));
        vec3 sculpturalNormal = normalize(vWaveNormal);
        float orientation = dot(sculpturalNormal, normalize(vec3(-.4, .7, .55)));
        float recess = (1.0 - smoothstep(-.05, .72, orientation)) * (1.0 - crest * .5);
        // Silver-blue ceramic in the midtones, ocean-blue only on turned-away
        // faces, icy neutral light confined to the highest upward crests.
        vec3 powder = mix(vec3(.40, .57, .73), vec3(.64, .78, .90), smoothstep(-.8, 2.8, vTerrain.y));
        powder = mix(powder, vec3(.16, .34, .54), recess * .62);
        powder = mix(powder, vec3(.20, .39, .57), vWaveOcclusion * .36);
        float crestLight = crest * smoothstep(.35, .95, orientation);
        powder = mix(powder, vec3(.98, 1.0, 1.015), crestLight);
        vec3 tonal = mix(vec3(.94, .97, 1.015), vec3(1.025, 1.015, .99), mineral);
        float slopeShade = .93 + .07 * abs(sculpturalNormal.y);
        diffuseColor.rgb *= powder * tonal * slopeShade
          * (1.0 + (reliefBody - .5) * .07 + (grain - .5) * .035);
        // Smooth satin, with no engraved stripes. Fade the finite mesh before
        // its physical edge and feather the viewport floor into the blue set.
        float domain = max(abs(vTerrain.x) / 13.0, abs(vTerrain.z) / 12.0);
        diffuseColor.a *= 1.0 - smoothstep(0.72, 1.0, domain);
        // Feather this terrain's own lower screen edge into the incoming
        // surface. The separate product material remains fully opaque.
        diffuseColor.a *= smoothstep(0.0, max(0.12, worldExit * 0.6), gl_FragCoord.y / worldViewportHeight);
      `)
      .replace('#include <roughnessmap_fragment>', /* glsl */`
        #include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (mineral - .5) * .12 + (reliefBody - .5) * .12
          + (grain - .5) * .16 + (pore - .5) * .06 - crestLight * .035, .34, .66);
      `)
      .replace('#include <normal_fragment_maps>', /* glsl */`
        #include <normal_fragment_maps>
        // Sub-pixel filtered microrelief affects light only; the original
        // vertices, animated crests and silhouette remain exactly intact.
        float relief = ((reliefBody - .5) * .0045 + (grain - .5) * .0018 + (pore - .5) * .00035)
          * mix(.5, 1.0, smoothstep(-.8, .8, vTerrain.y))
          * mix(.3, 1.0, abs(sculpturalNormal.y));
        vec3 sigmaX = dFdx(-vViewPosition), sigmaY = dFdy(-vViewPosition);
        vec3 r1 = cross(sigmaY, normal), r2 = cross(normal, sigmaX);
        float determinant = dot(sigmaX, r1) * faceDirection;
        vec3 gradient = sign(determinant) * (dFdx(relief) * r1 + dFdy(relief) * r2);
        normal = normalize(max(abs(determinant), 1e-10) * normal - gradient);
      `)
      .replace('#include <aomap_fragment>', /* glsl */`
        #include <aomap_fragment>
        reflectedLight.indirectDiffuse *= 1.0 - vWaveOcclusion * .48;
        reflectedLight.indirectSpecular *= 1.0 - vWaveOcclusion * .25;
      `);
  };
  material.customProgramCacheKey = () => 'stryde-silver-ceramic-v12';
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
    update(time, progress, dt, camera, rig, key, rim, entrance = 1, viewportHeight = 1, waveLight = null, surfaceBlend = 1) {
      const body = root.ownerDocument?.body;
      const exit = body?.dataset.gradeFrom === 'hero' && body.dataset.gradeTo === 'deconstruction'
        ? Number(body.dataset.gradeProgress) || 0 : 0;
      if (exit > 0) {
        surfaceColor.set(body.style.getPropertyValue('--journey-surface'));
        fog.color.copy(surfaceColor);
        material.color.copy(restingColor).lerp(surfaceColor, exit);
      } else { fog.color.set(0xc5e2ee); material.color.copy(restingColor); }
      material.opacity = (1 - exit) * surfaceBlend;
      uniforms.worldExit.value = exit;
      uniforms.worldViewportHeight.value = viewportHeight;
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
      const breathe = Math.max(0, Math.min(1, (1 - progress) / .18)) * entrance;
      rig.position.y += Math.sin(time * .48) * .016 * breathe;
      rig.rotation.x += (Math.sin(time * .36) * .010 - pointerY * .012) * breathe;
      rig.rotation.y += (Math.sin(time * .32) * .016 + pointerX * .025) * breathe;
      rig.rotation.z += Math.sin(time * .38) * .003 * breathe;
      rig.rotation.x += .30 * (1 - entrance);
      rig.rotation.y += .56 * (1 - entrance);
      rig.rotation.z -= .025 * (1 - entrance);
      group.position.set(truck * .5, 0, direction.world * .42);
      // The clearance follows the actual product in terrain-local space.
      // The old independent Z drift let a crest pass through the sneaker
      // late in the Hero, which looked like the product fading/disappearing.
      uniforms.worldProductCenter.value.set(rig.position.x - group.position.x, rig.position.z - group.position.z);
      key.position.set(-4.5 + direction.light * 7.8 + Math.sin(time * .2) * .5,
        3.5 + Math.cos(time * .18) * .2, 2.6);
      key.intensity = 2.45 + Math.sin(time * .2) * .12;
      rim.position.set(-3.0, 2.5, -2.5); rim.intensity = 1.85;
      if (waveLight) {
        const wave = heroWave(progress), x = rig.position.x + wave.x;
        waveLight.position.set(x, 1.25, 2.6);
        waveLight.target.position.set(x, .05, 0);
        waveLight.intensity = 20 * wave.strength;
      }

    },
    dispose() {
      stage.removeEventListener('pointermove', pointer); stage.removeEventListener('pointerleave', leave);
      scene.remove(group); geometry.dispose(); material.dispose();
    },
  };
}
