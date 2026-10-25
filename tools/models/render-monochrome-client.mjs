import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { fittedCameraZ } from '../../src/scene-framing.mjs';

const status = document.querySelector('p');
const prefix = document.body.dataset.prefix || 'tn-mono';
try {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .88;
  renderer.setPixelRatio(1);
  renderer.setClearColor(0, 0);
  document.body.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 4 / 3, .01, 100);
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xbfe8ff, 2); rim.position.set(-3, 2, -2);
  const fill = new THREE.DirectionalLight(0x8fd2f4, .65); fill.position.set(-2.6, .7, 3.4);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5290b8, 1.05), key, rim, fill);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const reflection = pmrem.fromScene(room, .04); room.dispose(); pmrem.dispose();
  scene.environment = reflection.texture; scene.environmentIntensity = .36;
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/model.glb');
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  const rig = new THREE.Group(); rig.add(model); rig.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z)); scene.add(rig);
  const hull = model.userData.strydeFramingHull.map(point => new THREE.Vector3().fromArray(point).sub(center));
  model.traverse(node => {
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
      if (!material) continue;
      material.envMapIntensity = .55;
      if ('specularIntensity' in material) material.specularIntensity = .6;
      material.specularColor?.setRGB(.8, .8, .8);
      for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) if (texture) texture.anisotropy = 8;
      if (material.normalScale) material.normalScale.set(1.2, 1.2);
    }
  });
  const views = [
    ['angle', .23, -.38, .12], ['profile', .08, 0, 0],
    ['heel', .12, -1.65, 0], ['top', 1.35, .03, -.02],
    ['sole', -1.42, .03, .02], ['detail', .25, -.45, 0],
  ];
  for (const [name, x, y, z] of views) {
    rig.rotation.set(x, y, z); rig.updateMatrixWorld(true);
    const points = hull.map(point => point.clone().applyMatrix4(rig.matrixWorld));
    for (const width of [700, 1000, 1400, 2800]) {
      const height = width * .75;
      renderer.setSize(width, height, false);
      camera.position.set(0, .04, fittedCameraZ(points, { fov: 32, aspect: 4 / 3, y: .04, fill: name === 'detail' ? 1.35 : .9 }));
      renderer.render(scene, camera);
      const blob = await new Promise(resolve => renderer.domElement.toBlob(resolve, 'image/webp', .92));
      const response = await fetch(`/capture/${prefix}-${name}-${width}.webp`, { method: 'POST', body: blob });
      if (!response.ok) throw new Error(await response.text());
      status.textContent = `Saved ${name} ${width} × ${height}`;
    }
  }
  status.textContent = 'Complete — 24 transparent product renders saved.';
  renderer.dispose(); reflection.dispose();
} catch (error) { status.textContent = `Error: ${error.message}`; console.error(error); }
