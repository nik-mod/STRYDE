import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { heroPose } from './motion/contracts.mjs';
import { refinePreviewMaterial } from './scene-materials.mjs';
import { fittedCameraZ } from './scene-framing.mjs';
import { createSceneBridge, projectionWindow } from './scene-bridge.mjs';

export function disposeObject(object) {
  const textures = new Set(); const materials = new Set(); const geometries = new Set();
  object.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
      if (!material) continue; materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  textures.forEach(texture => { texture.source?.data?.close?.(); texture.dispose(); });
  materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
}

// Outgoing scene state for the chapter 02 (deconstruction) controller. Chapter
// 01's seek(1) must equal chapter 02's seek(0) for every shared property.
export function captureHandoff({ camera, rig, lights }) {
  return Object.freeze({
    camera: Object.freeze({ position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov }),
    rig: Object.freeze({ position: rig.position.toArray(), quaternion: rig.quaternion.toArray(), scale: rig.scale.toArray() }),
    lights: Object.freeze(lights.map(light => Object.freeze({ intensity: light.intensity, position: light.position.toArray() }))),
  });
}

export async function mountScene({ root, url, bus, scheduler, signal }) {
  if (signal.aborted || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const host = root.querySelector('[data-scene-host]');
  const status = root.querySelector('[data-model-status]');
  const fallback = host.querySelector('.hero-image, .concept-visual, .model-fallback');
  const setStatus = message => { status.hidden = !message; status.textContent = message; };
  let renderer; let disposed = false; let model; let visible = false; let contextLost = false; let bridge;
  let dirty = true; let lastProgress = null;
  let currentPose = heroPose(bus.state?.local || 0);
  const framingPoints = [], worldPoints = [];
  const projectedPoint = new THREE.Vector3();
  let unsubscribe = () => {}; let removeFrame = () => {}; let observer; let resizeObserver;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
  camera.position.set(0, .1, 4.8);
  const rig = new THREE.Group(); scene.add(rig);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x6f9fc0, 1.05); scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(-3, 2, -2); scene.add(rim);
  const lights = [key, rim];
  const cleanup = () => {
    if (disposed) return; disposed = true;
    unsubscribe(); removeFrame(); observer?.disconnect(); resizeObserver?.disconnect(); bridge?.dispose();
    renderer?.domElement.removeEventListener('webglcontextlost', onLost);
    renderer?.domElement.removeEventListener('webglcontextrestored', onRestored);
    if (model) disposeObject(model);
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    if (fallback) fallback.hidden = false;
    setStatus('');
  };
  const onLost = event => { event.preventDefault(); contextLost = true; bridge?.restore(); if (fallback) fallback.hidden = false; setStatus(root.dataset.contextLostLabel || '3D view interrupted. Product imagery remains available.'); };
  const onRestored = () => { contextLost = false; dirty = true; if (fallback && model) fallback.hidden = true; setStatus(''); };
  signal.addEventListener('abort', cleanup, { once: true });
  try {
    setStatus(root.dataset.loadingLabel || 'Loading product view…');
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .9;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    host.append(renderer.domElement);
    bridge = createSceneBridge({ root, host, canvas: renderer.domElement });
    let viewportWidth = 0, viewportHeight = 0;
    const resize = () => {
      if (disposed) return;
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      // Bound GPU fill cost on large/retina screens without changing CSS size.
      const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1600000 / (width * height)));
      renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
      viewportWidth = width; viewportHeight = height;
      camera.aspect = width / height; camera.updateProjectionMatrix(); dirty = true;
    };
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
    observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) dirty = true; }, { rootMargin: '40px' }); observer.observe(host);
    // Abortable fetch; decoding is disposed if the section disappears while parsing.
    const response = await fetch(url, { signal, credentials: 'omit' });
    if (!response.ok) throw new Error(`Model response ${response.status}`);
    const bytes = await response.arrayBuffer();
    if (signal.aborted) return cleanup;
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, new URL('.', url).href);
    if (disposed || signal.aborted) { disposeObject(gltf.scene); return cleanup; }
    model = gltf.scene;
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    model.traverse(node => {
      for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
        if (!material) continue;
        for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) {
          if (!texture) continue;
          texture.anisotropy = anisotropy;
          texture.needsUpdate = true;
        }
        if (root.dataset.modelYaw) {
          if (material.normalMap && material.normalScale) material.normalScale.set(1.3, 1.3);
          refinePreviewMaterial(material, THREE.ShaderChunk.normal_fragment_maps);
        }
      }
    });
    model.rotation.y += THREE.MathUtils.degToRad(Number(root.dataset.modelYaw) || 0);
    const bounds = new THREE.Box3().setFromObject(model); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.length()) || size.length() === 0) throw new Error('Empty model');
    model.position.sub(center);
    const modelBounds = new THREE.Box3().setFromObject(model);
    const hull = model.userData.strydeFramingHull;
    if (Array.isArray(hull) && hull.length > 3 && hull.length < 5000 && hull.every(point=>Array.isArray(point) && point.length === 3 && point.every(Number.isFinite))) {
      const yaw = THREE.MathUtils.degToRad(Number(root.dataset.modelYaw) || 0), axis = new THREE.Vector3(0,1,0);
      for (const point of hull) framingPoints.push(new THREE.Vector3().fromArray(point).applyAxisAngle(axis,yaw).sub(center));
    } else {
      // Merchant models without a baked hull retain a safe oriented-box fit.
      for (const x of [modelBounds.min.x, modelBounds.max.x]) for (const y of [modelBounds.min.y, modelBounds.max.y]) for (const z of [modelBounds.min.z, modelBounds.max.z]) framingPoints.push(new THREE.Vector3(x,y,z));
    }
    for (let i = 0; i < framingPoints.length; i++) worldPoints.push(new THREE.Vector3());
    const mobileFit = innerWidth <= 700 ? .82 : 1;
    const scale = ((Number(root.dataset.modelSize) || 2.2) * mobileFit) / Math.max(size.x, size.y, size.z);
    rig.scale.setScalar(scale); rig.add(model);
    // The rig follows the same authored five-phase pose the image fallback
    // scrubs against: rotation, lens, camera height and lighting derive from
    // heroPose(progress). Distance fits the silhouette instead of stacking a
    // second authored zoom on top. No property uses accumulated deltas.
    unsubscribe = bus.subscribe(state => {
      if (state.local === lastProgress) return;
      lastProgress = state.local;
      const pose = currentPose = heroPose(state.local);
      rig.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ);
      camera.position.set(0, pose.cameraY, pose.cameraZ);
      if (camera.fov !== pose.fov) { camera.fov = pose.fov; camera.updateProjectionMatrix(); }
      key.intensity = pose.keyIntensity;
      rim.intensity = pose.rimIntensity;
      dirty = true;
    });
    removeFrame = scheduler.add(() => {
      if (document.hidden || contextLost || disposed) return;
      const handoff = bridge?.update();
      if (handoff?.changed) dirty = true;
      if (!dirty || (!visible && !handoff?.active)) return;
      if (camera.view?.enabled) camera.clearViewOffset();
      if (handoff?.active) {
        const width = Math.max(1, Math.round(handoff.width)), height = Math.max(1, Math.round(handoff.height));
        if (width !== viewportWidth || height !== viewportHeight) {
          const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1600000 / (width * height)));
          renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
          viewportWidth = width; viewportHeight = height;
          camera.aspect = width / height; camera.updateProjectionMatrix();
        }
        // Match the existing profile render's camera orientation. This changes
        // only the bridge, preserving the Hero's deterministic pose contract.
        const mix = handoff.mix;
        rig.rotation.set(
          THREE.MathUtils.lerp(currentPose.rotationX, .077431086955443, mix),
          THREE.MathUtils.lerp(currentPose.rotationY, 0, mix),
          THREE.MathUtils.lerp(currentPose.rotationZ, 0, mix),
        );
        camera.position.y = THREE.MathUtils.lerp(currentPose.cameraY, 0, mix);
        const fov = THREE.MathUtils.lerp(currentPose.fov, 33, mix);
        if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      } else if (handoff?.changed) {
        resize();
        rig.rotation.set(currentPose.rotationX, currentPose.rotationY, currentPose.rotationZ);
        camera.position.y = currentPose.cameraY;
        camera.fov = currentPose.fov; camera.updateProjectionMatrix();
      }
      if (framingPoints.length) {
        rig.updateMatrixWorld(true);
        for (let i = 0; i < framingPoints.length; i++) worldPoints[i].copy(framingPoints[i]).applyMatrix4(rig.matrixWorld);
        camera.position.z = fittedCameraZ(worldPoints, { fov: camera.fov, aspect: camera.aspect, y: camera.position.y });
        if (handoff?.active && handoff.footprint && handoff.projectionMix > 0) {
          camera.updateMatrixWorld();
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const point of worldPoints) {
            projectedPoint.copy(point).project(camera);
            const x = (projectedPoint.x + 1) * viewportWidth / 2;
            const y = (1 - projectedPoint.y) * viewportHeight / 2;
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }
          const footprint = handoff.footprint;
          const view = projectionWindow({ left: minX, top: minY, width: maxX - minX, height: maxY - minY }, {
            left: footprint.left - handoff.left, top: footprint.top - handoff.top,
            width: footprint.width, height: footprint.height,
          }, viewportWidth, viewportHeight, handoff.projectionMix);
          if (view) camera.setViewOffset(viewportWidth, viewportHeight, view.x, view.y, view.width, view.height);
        }
      }
      renderer.render(scene, camera);
      dirty = false;
    });
    if (fallback) fallback.hidden = true; setStatus('');
  } catch (error) {
    if (signal.aborted || disposed) return cleanup;
    cleanup();
    setStatus(root.dataset.errorLabel || '3D view unavailable. Product imagery remains available.');
    console.warn('[STRYDE] Model unavailable:', error.message);
  }
  return cleanup;
}
