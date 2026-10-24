// One-off editorial re-render harness (dev tool, never bundled into the theme).
// Loaded into the local preview page by the QA automation: re-renders the six
// TN study views from the bundled GLB with the site's studio lighting at
// 2800x2100 / 1000x750 so large displays stop upscaling 1400px sources.
// Results land on window.__tnRenders; the automation layer saves them to assets/.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { refinePreviewMaterial } from '../src/scene-materials.mjs';
import { fittedCameraZ } from '../src/scene-framing.mjs';

const SIZES = window.__tnSizes ?? [
  { suffix: '2800', width: 2800, height: 2100, quality: .92 },
  { suffix: '1000', width: 1000, height: 750, quality: .9 },
];

// Turntable+tilt framing per view. Base yaw 90deg reproduces the hero handoff
// profile; pitch tips the silhouette toward the lens for top/sole studies.
const VIEWS = window.__tnViews ?? [
  { name: 'profile', yaw: 90, pitch: 0, zoom: 1, lift: 0 },
  { name: 'heel', yaw: 270, pitch: 4, zoom: 1.04, lift: 0 },
  { name: 'angle', yaw: 55, pitch: 8, zoom: 1.02, lift: 0 },
  { name: 'top', yaw: 90, pitch: 82, zoom: 1.06, lift: 0 },
  { name: 'sole', yaw: 90, pitch: -82, zoom: .96, lift: 0 },
  { name: 'detail', yaw: 76, pitch: -16, zoom: 1.9, lift: .12 },
];

async function renderTN() {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 4 / 3, .01, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x5290b8, .9));
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xbfe8ff, 2); rim.position.set(-3, 2, -2);
  const fill = new THREE.DirectionalLight(0x8fd2f4, .55); fill.position.set(-2.6, .7, 3.4);
  scene.add(key, rim, fill);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), .04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = .32;
  pmrem.dispose();

  const bytes = await (await fetch('/assets/nike-tn-blue-white.glb', { credentials: 'omit' })).arrayBuffer();
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, new URL('/assets/', location.href).href);
  const model = gltf.scene;
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  model.traverse(node => {
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
      if (!material) continue;
      for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) {
        if (texture) { texture.anisotropy = anisotropy; texture.needsUpdate = true; }
      }
      if (material.normalMap && material.normalScale) material.normalScale.set(1.3, 1.3);
      refinePreviewMaterial(material, THREE.ShaderChunk.normal_fragment_maps);
    }
    if (node.isMesh) node.castShadow = true;
  });
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);

  const group = new THREE.Group();
  // Apply yaw first, then tilt around the world horizontal axis. Tilting
  // before yaw rolls a side profile upright instead of showing the outsole.
  group.rotation.order = 'XYZ';
  group.add(model);
  scene.add(group);

  const out = {};
  for (const view of VIEWS) {
    group.position.set(0, 0, 0);
    group.rotation.set(THREE.MathUtils.degToRad(view.pitch), THREE.MathUtils.degToRad(view.yaw), 0);
    group.updateMatrixWorld(true);
    const worldBounds = new THREE.Box3().setFromObject(group);
    const size = worldBounds.getSize(new THREE.Vector3());
    worldBounds.getCenter(group.position).negate();
    group.updateMatrixWorld(true);
    const world = new THREE.Box3().setFromObject(group);
    const footprint = Math.max(size.x, size.z);
    const corners = [];
    for (const x of [world.min.x, world.max.x]) for (const y of [world.min.y, world.max.y]) for (const z of [world.min.z, world.max.z]) corners.push(new THREE.Vector3(x, y, z));
    for (const sizeSpec of SIZES) {
      renderer.setPixelRatio(1);
      renderer.setSize(sizeSpec.width, sizeSpec.height, false);
      camera.aspect = sizeSpec.width / sizeSpec.height;
      camera.position.set(0, .18 + view.lift, fittedCameraZ(corners, { fov: 32, aspect: camera.aspect }) / view.zoom);
      camera.lookAt(0, view.lift * .5, 0);
      renderer.render(scene, camera);
      out[`${view.name}-${sizeSpec.suffix}`] = renderer.domElement.toDataURL('image/webp', sizeSpec.quality);
    }
  }
  const probe = new Image();
  probe.src = out['profile-2800'];
  await probe.decode();
  const pc = document.createElement('canvas');
  pc.width = 280; pc.height = 210;
  const px = pc.getContext('2d').getImageData(0, 0, 280, 210);
  pc.getContext('2d').drawImage(probe, 0, 0, 280, 210);
  const data = pc.getContext('2d').getImageData(0, 0, 280, 210).data;
  let minX = 280, minY = 210, maxX = 0, maxY = 0;
  for (let y = 0; y < 210; y++) for (let x = 0; x < 280; x++) {
    if (data[(y * 280 + x) * 4 + 3] > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  window.__tnProfileBounds = { minX, minY, maxX, maxY, w: 280, h: 210 };
  window.__tnRenders = out;
  window.__tnDone = true;
}

renderTN().catch(error => { window.__tnError = String(error); window.__tnDone = true; });
