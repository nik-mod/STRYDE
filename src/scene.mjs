import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { foundationPose } from './motion/contracts.mjs';

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

export async function mountScene({ root, url, bus, scheduler, signal }) {
  if (signal.aborted || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const host = root.querySelector('[data-scene-host]');
  const status = root.querySelector('[data-model-status]');
  const fallback = host.querySelector('.foundation-image, .asset-empty');
  const setStatus = message => { status.hidden = !message; status.textContent = message; };
  let renderer; let disposed = false; let model; let visible = false; let contextLost = false;
  let unsubscribe = () => {}; let removeFrame = () => {}; let observer; let resizeObserver;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
  camera.position.set(0, .1, 4.8);
  const rig = new THREE.Group(); scene.add(rig);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7c7a6f, 2.8));
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(-3, 2, -2); scene.add(rim);
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
  const onLost = event => { event.preventDefault(); contextLost = true; if (fallback) fallback.hidden = false; setStatus(root.dataset.contextLostLabel || '3D view interrupted. Product image remains available.'); };
  const onRestored = () => { contextLost = false; if (fallback && model) fallback.hidden = true; setStatus(''); };
  signal.addEventListener('abort', cleanup, { once: true });
  try {
    setStatus(root.dataset.loadingLabel || 'Loading product view…');
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: innerWidth > 700, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth > 700 ? 1.75 : 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    host.append(renderer.domElement);
    const resize = () => { if (disposed) return; const { width, height } = host.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
    observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { rootMargin: '40px' }); observer.observe(host);
    // Abortable fetch; decoding is disposed if the section disappears while parsing.
    const response = await fetch(url, { signal, credentials: 'omit' });
    if (!response.ok) throw new Error(`Model response ${response.status}`);
    const bytes = await response.arrayBuffer();
    if (signal.aborted) return cleanup;
    const gltf = await new GLTFLoader().parseAsync(bytes, new URL('.', url).href);
    if (disposed || signal.aborted) { disposeObject(gltf.scene); return cleanup; }
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.length()) || size.length() === 0) throw new Error('Empty model');
    model.position.sub(center); const scale = 2.2 / Math.max(size.x, size.y, size.z); rig.scale.setScalar(scale); rig.add(model);
    unsubscribe = bus.subscribe(state => { const pose = foundationPose(state.local); rig.rotation.set(0, pose.rotationY, pose.rotationZ); camera.position.z = pose.cameraZ; });
    removeFrame = scheduler.add(() => { if (visible && !document.hidden && !contextLost && !disposed) renderer.render(scene, camera); });
    if (fallback) fallback.hidden = true; setStatus('');
  } catch (error) {
    if (signal.aborted || disposed) return cleanup;
    cleanup();
    setStatus(root.dataset.errorLabel || '3D view unavailable. Product image remains available.');
    console.warn('[STRYDE] Model unavailable:', error.message);
  }
  return cleanup;
}
