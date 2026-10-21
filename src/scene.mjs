import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { heroPose } from './motion/contracts.mjs';

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
  let renderer; let disposed = false; let model; let visible = false; let contextLost = false;
  let dirty = true; let lastProgress = null;
  let unsubscribe = () => {}; let removeFrame = () => {}; let observer; let resizeObserver;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
  camera.position.set(0, .1, 4.8);
  const rig = new THREE.Group(); scene.add(rig);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x6f9fc0, 2.6); scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(-3, 2, -2); scene.add(rim);
  const lights = [key, rim];
  const cleanup = () => {
    if (disposed) return; disposed = true;
    unsubscribe(); removeFrame(); observer?.disconnect(); resizeObserver?.disconnect();
    renderer?.domElement.removeEventListener('webglcontextlost', onLost);
    renderer?.domElement.removeEventListener('webglcontextrestored', onRestored);
    if (model) disposeObject(model);
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    if (fallback) fallback.hidden = false;
    setStatus('');
  };
  const onLost = event => { event.preventDefault(); contextLost = true; if (fallback) fallback.hidden = false; setStatus(root.dataset.contextLostLabel || '3D view interrupted. Product imagery remains available.'); };
  const onRestored = () => { contextLost = false; dirty = true; if (fallback && model) fallback.hidden = true; setStatus(''); };
  signal.addEventListener('abort', cleanup, { once: true });
  try {
    setStatus(root.dataset.loadingLabel || 'Loading product view…');
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: innerWidth > 700, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    host.append(renderer.domElement);
    const resize = () => {
      if (disposed) return;
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      // Bound GPU fill cost on large/retina screens without changing CSS size.
      const ratio = Math.min(devicePixelRatio || 1, innerWidth > 700 ? 1.5 : 1, Math.sqrt(1600000 / (width * height)));
      renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix(); dirty = true;
    };
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
    observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) dirty = true; }, { rootMargin: '40px' }); observer.observe(host);
    // Abortable fetch; decoding is disposed if the section disappears while parsing.
    const response = await fetch(url, { signal, credentials: 'omit' });
    if (!response.ok) throw new Error(`Model response ${response.status}`);
    const bytes = await response.arrayBuffer();
    if (signal.aborted) return cleanup;
    const gltf = await new GLTFLoader().parseAsync(bytes, new URL('.', url).href);
    if (disposed || signal.aborted) { disposeObject(gltf.scene); return cleanup; }
    model = gltf.scene;
    model.rotation.y += THREE.MathUtils.degToRad(Number(root.dataset.modelYaw) || 0);
    const bounds = new THREE.Box3().setFromObject(model); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.length()) || size.length() === 0) throw new Error('Empty model');
    model.position.sub(center);
    const mobileFit = innerWidth <= 700 ? .82 : 1;
    const scale = ((Number(root.dataset.modelSize) || 2.2) * mobileFit) / Math.max(size.x, size.y, size.z);
    rig.scale.setScalar(scale); rig.add(model);
    // The rig follows the same authored five-phase pose the image fallback
    // scrubs against: rotation, camera dolly and lighting all derive from the
    // shared heroPose(progress), never from accumulated deltas.
    unsubscribe = bus.subscribe(state => {
      if (state.local === lastProgress) return;
      lastProgress = state.local;
      const pose = heroPose(state.local);
      rig.rotation.set(0, pose.rotationY, pose.rotationZ);
      camera.position.set(0, pose.cameraY, pose.cameraZ);
      if (camera.fov !== pose.fov) { camera.fov = pose.fov; camera.updateProjectionMatrix(); }
      key.intensity = pose.keyIntensity;
      rim.intensity = pose.rimIntensity;
      dirty = true;
    });
    removeFrame = scheduler.add(() => {
      if (!dirty || !visible || document.hidden || contextLost || disposed) return;
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
