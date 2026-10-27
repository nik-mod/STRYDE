import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { refinePreviewMaterial } from './scene-materials.mjs';
import { journeyModelSpec, journeyModelKey } from './journey-models.mjs';
import { studyTransition, windowTransition, exchangeModelSpec, modelExchangePose, chapterCameraDistance, productWindowViewport, STUDY_EXCHANGE_RADIUS } from './journey-transition.mjs';
import { environmentFor } from './motion/environments.mjs';
import { journeyPose, journeyProgress, flowingMaterialSample, brandLighting, heroProductGate } from './journey-poses.mjs';
import { createHeroWorld, expandHeroCamera } from './hero-world.mjs';
import { bundledJourneyCamera } from './journey-cameras.mjs';
import { materialOrbit, materialOrbitCamera, MATERIAL_ORBIT_CAMERA } from './material-orbit.mjs';
import { anatomyTour, anatomyCamera } from './anatomy-tour.mjs';

const clamp = value => Math.min(1, Math.max(0, value));
const bundledChapterModels = {
  hero: ['blue-white:90'], deconstruction: ['monochrome:0'], materials: ['blue-white:90', 'deep-blue:0', 'monochrome:0'],
  technology: ['blue-white:90'], featured: ['deep-blue:0'], brand: ['blue-white:90'],
};

function disposeModel(model) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  model?.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  textures.forEach(texture => { texture.source?.data?.close?.(); texture.dispose(); });
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

// One renderer owns the product and hero world. In the hero its canvas is
// absolute inside the pinned stage, beneath HTML. Later chapters use the
// existing fixed/scissored windows; GSAP still owns every pin and scroll clock.
export async function mountJourneyScene(options) {
  const { root, signal } = options;
  const document = root.ownerDocument;
  const environment = document.defaultView;
  if (signal.aborted || environment.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  // Start in the foreground. A temporary tab switch pauses the shared clock;
  // it must not destroy textures and restart all decoding on return.
  let closed = false;
  let starting = false;
  let activeCleanup = null;
  const boot = async () => {
    if (closed || starting || activeCleanup || document.hidden) return;
    starting = true;
    try {
      const cleanup = await createJourneyScene(options);
      if (closed) cleanup();
      else activeCleanup = cleanup;
    } finally {
      starting = false;
    }
  };
  const visibility = () => {
    if (!document.hidden) void boot();
  };
  const cleanup = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener('visibilitychange', visibility);
    signal.removeEventListener('abort', cleanup);
    activeCleanup?.();
    activeCleanup = null;
  };
  document.addEventListener('visibilitychange', visibility);
  signal.addEventListener('abort', cleanup, { once: true });
  await boot();
  return cleanup;
}

async function createJourneyScene({ root, url, scheduler, signal, bus, ScrollTrigger, onReady }) {
  const document = root.ownerDocument, environment = document.defaultView;
  const inspectMotion = new URLSearchParams(environment.location.search).has('inspect');
  // Reproducible visual comparisons use the existing opt-in inspector only.
  const inspectionTime = inspectMotion ? new URLSearchParams(environment.location.search).get('worldTime') : null;
  const fixedWorldTime = inspectionTime !== null && Number.isFinite(Number(inspectionTime)) ? Math.max(0, Math.min(60, Number(inspectionTime))) : null;
  const readiness = new Set();
  const trace = stage => {
    if (!inspectMotion || readiness.has(stage)) return;
    readiness.add(stage);
    document.dispatchEvent(new environment.CustomEvent('stryde:hero-stage', { detail: { stage, at: environment.performance.now() } }));
  };
  trace('prepare');
  if (signal.aborted || environment.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const overlay = document.createElement('div');
  overlay.className = 'journey-canvas';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, { position: 'fixed', pointerEvents: 'none', zIndex: '5', overflow: 'hidden', display: 'none' });
  document.body.append(overlay);
  const status = root.querySelector('[data-model-status]');
  const setStatus = message => { if (status) { status.hidden = !message; status.textContent = message; } };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
  const anatomyFocus = new THREE.Vector3();
  const rig = new THREE.Group();
  rig.rotation.order = 'XYZ';
  scene.add(rig);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x5290b8, 1.05);
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xbfe8ff, 2); rim.position.set(-3, 2, -2);
  const fill = new THREE.DirectionalLight(0x8fd2f4, .65); fill.position.set(-2.6, .7, 3.4);
  const waveLight = new THREE.SpotLight(0xe6f6ff, 0, 8, .16, 1, 2);
  scene.add(ambient, key, rim, fill, waveLight, waveLight.target);
  const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.BackSide });
  let renderer, reflection, shadow, shadowPlane, shadowTexture, heroWorld;
  const heroStage = root.querySelector('[data-hero-stage]');
  const matchingPoster = Boolean(root.querySelector('[data-hero-poster]'));
  let worldTime = 0;
  let heroReadyTime = null;
  let shadowTime = -1, shadowProgress = -1;
  const updateHeroShadow = progress => {
    if (worldTime - shadowTime >= 1 / 30 || Math.abs(progress - shadowProgress) > .002) {
      renderer.shadowMap.needsUpdate = true;
      shadowTime = worldTime; shadowProgress = progress;
    }
  };
  const primary = { url, yaw: Number(root.dataset.modelYaw) || 90, variant: 'blue' };
  const assets = new Map(), loading = new Map(), failed = new Set();
  // Instances share their loaded GLB geometry/materials; no new GPU asset set.
  const orbitInstances = new Map();
  let loadQueue = Promise.resolve();
  const yieldMain = () => new Promise(resolve => environment.setTimeout(resolve, 0));
  let selectedAssets = [];
  const cameraFits = new Map();
  let activeModelKey = '', modelObserver;
  let disposed = false, lost = false, loaded = false, dirty = true, targetsDirty = true;
  let targets = [], owned = [], width = 0, height = 0, lastSignature = '';
  let detachFrame = () => {};
  let lastFrameTime = null;
  const release = () => {
    owned.forEach(target => target.classList.remove('has-journey-scene'));
    owned = [];
    overlay.style.display = 'none';
    delete root.dataset.heroLive;
  };
  const refresh = () => { targetsDirty = true; dirty = true; };
  const onLost = event => { event.preventDefault(); lost = true; release(); root.classList.remove('has-scene'); setStatus(root.dataset.contextLostLabel || '3D view interrupted. Product imagery remains available.'); };
  const onRestored = () => { lost = false; dirty = true; lastSignature = ''; root.classList.add('has-scene'); setStatus(''); };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    release(); detachFrame();
    document.removeEventListener('shopify:section:load', refresh);
    document.removeEventListener('shopify:section:unload', refresh);
    environment.removeEventListener('resize', refresh);
    ScrollTrigger?.removeEventListener('refresh', refresh);
    signal.removeEventListener('abort', cleanup);
    renderer?.domElement.removeEventListener('webglcontextlost', onLost);
    renderer?.domElement.removeEventListener('webglcontextrestored', onRestored);
    modelObserver?.disconnect();
    orbitInstances.clear();
    assets.forEach(asset => disposeModel(asset.model)); assets.clear(); cameraFits.clear();
    shadowPlane?.geometry.dispose(); key.shadow.dispose();
    shadow?.dispose(); shadowTexture?.dispose(); reflection?.dispose();
    heroWorld?.dispose(); depthMaterial.dispose();
    renderer?.dispose(); renderer?.forceContextLoss(); overlay.remove();
    root.classList.remove('has-scene'); setStatus('');
    root.style.removeProperty('--hero-live-blend'); delete root.dataset.heroLive;
  };
  signal.addEventListener('abort', cleanup, { once: true });
  document.addEventListener('shopify:section:load', refresh);
  document.addEventListener('shopify:section:unload', refresh);
  environment.addEventListener('resize', refresh, { passive: true });
  ScrollTrigger?.addEventListener('refresh', refresh);

  function collectTargets() {
    const result = [];
    const add = (chapter, section, visuals) => {
      visuals = visuals.filter(Boolean);
      if (section && visuals.length) {
        const pin = ScrollTrigger?.getAll().find(trigger => trigger.pin && (trigger.trigger === section || trigger.trigger?.closest?.('[data-chapter], [data-hero]') === section));
        result.push({ chapter, section, visuals, pin });
      }
    };
    add('hero', root, [root.querySelector('[data-scene-host]')]);
    const decon = document.querySelector('[data-chapter="deconstruction"][data-tn-editorial]');
    add('deconstruction', decon, decon?.querySelector('[data-model-fullshot]') ? [decon.querySelector('.decon-frame')] : []);
    const materials = document.querySelector('[data-chapter="materials"][data-tn-editorial]');
    const materialFrames = [...(materials?.querySelectorAll('.mat-frame') || [])].filter(frame => frame.querySelector('img[data-macro-image]'));
    // A mixed photo/model orbit remains an honest, cohesive 2.5D composition.
    add('materials', materials, materials?.dataset.materialOrbit === 'true' && materialFrames.length !== 3 ? [] : materialFrames);
    const technology = document.querySelector('[data-chapter="technology"]');
    add('technology', technology, technology?.querySelector('[data-tech-model]') ? [technology.querySelector('.tech-visual')] : []);
    const featured = document.querySelector('[data-chapter="featured"]');
    add('featured', featured, featured?.querySelector('[data-featured-model]') ? [featured.querySelector('.feat-frame')] : []);
    const brand = document.querySelector('[data-chapter="brand"][data-brand-live]');
    add('brand', brand, brand ? [brand.querySelector('[data-brand-window]')] : []);
    const finale = document.querySelector('[data-chapter="finale"]');
    add('finale', finale, finale?.querySelector('[data-finale-model]') ? [finale.querySelector('.finale-profile-window')] : []);
    targets = result; targetsDirty = false;
  }

  function sample(target) {
    const sectionRect = target.section.getBoundingClientRect();
    const pin = target.pin;
    let progress = target.chapter === 'hero' && bus?.state
      ? bus.state.local
      : pin ? journeyProgress(environment.scrollY, pin.start, pin.end)
        : clamp((environment.innerHeight * .75 - sectionRect.top) / Math.max(1, sectionRect.height));
    if (pin?.animation) progress = pin.animation.progress();
    if (target.chapter === 'brand' && !pin && Number.isFinite(Number(target.section.dataset.brandProgress))) progress = clamp(Number(target.section.dataset.brandProgress));
    if (target.chapter === 'deconstruction' && Number.isFinite(Number(target.section.dataset.anatomyProgress))) progress = clamp(Number(target.section.dataset.anatomyProgress));
    const orbitWindow = target.chapter === 'materials' && target.section.dataset.materialOrbit === 'true'
      ? target.section.querySelector('[data-material-orbit-window]') : null;
    if (orbitWindow) {
      const modelSpecs = target.visuals.map(frame => journeyModelSpec(frame.closest('[data-journey-model]')?.dataset, primary));
      progress = clamp(Number(target.section.dataset.orbitProgress) || 0);
      return { ...target, orbit: true, progress, visual: target.visuals[0], modelSpec: modelSpecs[0], modelSpecs,
        modelBlend: null, rect: orbitWindow.getBoundingClientRect(), sectionRect, pose: journeyPose('materials', 0) };
    }
    let visual = target.visuals[0];
    if (target.visuals.length > 1 && !pin) {
      // Flowing panels all have opacity 1. Use their actual on-screen geometry,
      // then map the visible panel's local reading progress into its third.
      const flow = flowingMaterialSample(
        target.visuals.map(candidate => candidate.getBoundingClientRect()),
        target.visuals.map(candidate => (candidate.closest('.mat-panel') || candidate).getBoundingClientRect()),
        environment.innerHeight,
      );
      visual = target.visuals[flow.index];
      progress = flow.progress;
    } else if (target.visuals.length > 1) {
      // A caption's visible owner is the same panel that owns the live model.
      // Scoring opacity also handles seeks during a merchant's fade transition.
      let score = -1;
      for (const candidate of target.visuals) {
        const panel = candidate.closest('.mat-panel');
        const style = environment.getComputedStyle(panel || candidate);
        const copy = panel?.querySelector('.mat-copy');
        const opacity = style.visibility === 'hidden' ? -1 : parseFloat(style.opacity) * (copy ? parseFloat(environment.getComputedStyle(copy).opacity) : 1);
        if (opacity > score) { score = opacity; visual = candidate; }
      }
    }
    const modelOwner = visual.closest('[data-journey-model]');
    if (!pin && target.chapter === 'featured' && modelOwner?.hasAttribute('data-journey-from-primary')) {
      // On flowing layouts the shoe changes while its actual visual window
      // is inside the screen, rather than after a long mobile text column.
      progress = clamp((environment.innerHeight * .6 - visual.getBoundingClientRect().top) / (environment.innerHeight * .48));
    }
    const modelSpec = journeyModelSpec(modelOwner?.dataset, primary);
    const modelSpecs = target.visuals.map(frame => journeyModelSpec(frame.closest('[data-journey-model]')?.dataset, primary));
    const exchangeWindow = modelOwner?.hasAttribute('data-journey-from-primary') ? {
      from: primary, to: modelSpec,
      start: Number(modelOwner.dataset.journeyChangeStart), end: Number(modelOwner.dataset.journeyChangeEnd),
    } : null;
    const anatomy = target.chapter === 'deconstruction' && target.section.classList.contains('is-anatomy-exploration');
    const anatomyOverview = target.chapter === 'deconstruction' && target.section.hasAttribute('data-anatomy') && !anatomy;
    return { ...target, progress, visual, modelSpec, modelSpecs, exchangeWindow, anatomy, anatomyOverview, pinned: Boolean(pin),
      modelBlend: null, rect: visual.getBoundingClientRect(), sectionRect, pose: journeyPose(target.chapter, progress) };
  }

  function motionFor(view, dt) {
    if (view.orbit) return view;
    if (view.anatomy) {
      const tour = anatomyTour(view.progress);
      return { ...view, tour, pose: { ...journeyPose('deconstruction', 0), rotationX: tour.rotationX, rotationY: tour.rotationY, rotationZ: tour.rotationZ } };
    }
    if (view.anatomyOverview) return { ...view, progress: 0, pose: journeyPose('deconstruction', 0) };
    // A single clock owns both the camera and the identity cut. Smoothing
    // panel-specific clocks used to reset the pose when the caption changed.
    // Lenis and the owning GSAP timeline already smooth the gesture. A second
    // time filter made camera/model poses trail their captions and kept stale
    // chapter progress after fast direction changes.
    const progress = view.progress;
    let modelSpec = view.modelSpec, modelBlend = null;
    if (view.chapter === 'materials') {
      const index = Math.min(view.modelSpecs.length - 1, Math.floor(progress * view.modelSpecs.length));
      modelSpec = view.modelSpecs[index];
      if (view.pinned) modelBlend = studyTransition(view.modelSpecs, progress);
      else if (index > 0) {
        const state = windowTransition(view.modelSpecs[index - 1], modelSpec, progress * view.modelSpecs.length - index, .16, .64);
        modelSpec = state.spec; modelBlend = state.blend;
      }
    }
    if (view.exchangeWindow) {
      const { from, to, start, end } = view.exchangeWindow;
      const state = windowTransition(from, to, progress, start, end);
      modelSpec = state.spec; modelBlend = state.blend;
    }
    return { ...view, progress, modelSpec, modelBlend,
      pose: modelExchangePose(journeyPose(view.chapter, progress), modelBlend?.progress ?? null) };
  }

  async function loadModel(spec) {
    const id = journeyModelKey(spec);
    if (assets.has(id)) return assets.get(id);
    if (loading.has(id)) return loading.get(id);
    if (failed.has(id) || disposed || signal.aborted) return null;
    const task = loadQueue.then(async () => {
      if (disposed || signal.aborted) return null;
      const modelURL = new URL(spec.url, url).href;
      const response = await fetch(modelURL, { signal, credentials: 'omit' });
      if (!response.ok) throw new Error(`Model response ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (disposed || signal.aborted) return null;
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, new URL('.', modelURL).href);
      if (id === journeyModelKey(primary)) trace('product-decoded');
      if (disposed || signal.aborted) { disposeModel(gltf.scene); return null; }
      const object = gltf.scene;
      try {
        const yaw = THREE.MathUtils.degToRad(spec.yaw);
        object.rotation.y += yaw;
        const bounds = new THREE.Box3().setFromObject(object);
        const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
        if (!Number.isFinite(size.length()) || size.length() === 0) throw new Error('Empty product model');
        object.position.sub(center);
        const surface = [], hull = object.userData.strydeFramingHull;
        if (Array.isArray(hull) && hull.length > 3 && hull.length < 5000 && hull.every(point => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite))) {
          const axis = new THREE.Vector3(0, 1, 0);
          hull.forEach(point => surface.push(new THREE.Vector3().fromArray(point).applyAxisAngle(axis, yaw).sub(center)));
        } else {
          const centered = new THREE.Box3().setFromObject(object);
          for (const x of [centered.min.x, centered.max.x]) for (const y of [centered.min.y, centered.max.y]) for (const z of [centered.min.z, centered.max.z]) surface.push(new THREE.Vector3(x, y, z));
        }
        const anisotropy = Math.min(environment.innerWidth <= 700 ? 4 : 16, renderer.capabilities.getMaxAnisotropy());
        const treatedMaterials = new Set();
        object.traverse(node => {
          if (node.isMesh) { node.castShadow = true; node.customDepthMaterial = depthMaterial; }
          for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
            if (!material || treatedMaterials.has(material)) continue;
            treatedMaterials.add(material);
            for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) if (texture) { texture.anisotropy = anisotropy; texture.needsUpdate = true; }
            if (material.normalScale) material.normalScale.set(1.2, 1.2);
            if (spec.variant !== 'blue') {
              material.envMapIntensity = .55;
              if ('specularIntensity' in material) material.specularIntensity = .6;
              material.specularColor?.setRGB(.8, .8, .8);
            } else refinePreviewMaterial(material, node.geometry);
          }
        });
        const scale = 2.6 / Math.max(size.x, size.y, size.z);
        const group = new THREE.Group(); group.scale.setScalar(scale); group.add(object);
        surface.forEach(point => point.multiplyScalar(scale));
        const asset = { model: object, group, points: surface, worldPoints: surface.map(() => new THREE.Vector3()), scale };
        // Spread texture uploads over tasks while the real HTML photograph is
        // usable. Alternate assets decode in sequence rather than contending
        // for the main thread and GPU at one chapter boundary.
        const textures = new Set();
        treatedMaterials.forEach(material => Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); }));
        for (const texture of textures) {
          await yieldMain();
          if (disposed || signal.aborted) { disposeModel(object); return null; }
          const image = texture.source?.data;
          if (environment.innerWidth <= 700 && image?.width > 2048 && environment.createImageBitmap) {
            try {
              const ratio = 2048 / image.width;
              const bitmap = await environment.createImageBitmap(image, { resizeWidth: 2048, resizeHeight: Math.round(image.height * ratio), resizeQuality: 'high', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
              if (disposed || signal.aborted) { bitmap.close(); disposeModel(object); return null; }
              texture.source.data = bitmap; image.close?.(); texture.needsUpdate = true;
            } catch { /* Older bitmap implementations retain the original map. */ }
          }
          renderer.initTexture(texture);
        }
        if (id === journeyModelKey(primary)) trace('product-uploaded');
        if (scene.environment) {
          const previousFog = scene.fog; scene.fog = null;
          const compilation = renderer.compileAsync(group, camera, scene);
          scene.fog = previousFog;
          await compilation;
        }
        if (disposed || signal.aborted) { disposeModel(object); return null; }
        assets.set(id, asset); dirty = true;
        return asset;
      } catch (error) { disposeModel(object); throw error; }
    }).catch(error => {
      failed.add(id);
      if (!disposed && !signal.aborted) console.warn('[STRYDE] Product model unavailable:', error.message);
      return null;
    }).finally(() => loading.delete(id));
    loadQueue = task;
    loading.set(id, task);
    return task;
  }

  function selectModel(spec, exchange = null) {
    if (exchange) { void loadModel(exchange.from); void loadModel(exchange.to); }
    const chosen = exchangeModelSpec(spec, exchange), id = journeyModelKey(chosen), asset = assets.get(id);
    if (!asset) { void loadModel(chosen); return false; }
    if (activeModelKey !== id) {
      selectedAssets.forEach(previous => rig.remove(previous.group));
      asset.group.position.set(0, 0, 0); asset.group.rotation.set(0, 0, 0);
      selectedAssets = [asset]; rig.add(asset.group);
      activeModelKey = id; lastSignature = ''; dirty = true;
    }
    overlay.dataset.model = chosen.variant;
    overlay.dataset.transition = exchange ? exchange.progress.toFixed(4) : '';
    return true;
  }

  function cameraDistanceFor(view) {
    if (view.anatomy) return anatomyCamera(view.rect.width / view.rect.height, view.tour.zoom);
    const target = targets.find(candidate => candidate.chapter === view.chapter);
    const specs = (target?.visuals || [view.visual]).map(visual => journeyModelSpec(visual.closest('[data-journey-model]')?.dataset, primary));
    if ((target?.visuals || []).some(visual => visual.closest('[data-journey-from-primary]'))) specs.push(primary);
    specs.push(view.modelSpec);
    const unique = [...new Map(specs.map(spec => [journeyModelKey(spec), spec])).entries()];
    // Fit all delivered shapes once, but never blank a ready shoe while an
    // unrelated later study is decoding. A newly delivered shape invalidates
    // this key naturally; its HTML photograph remains visible until ready.
    const available = unique.filter(([id]) => assets.has(id));
    if (!available.length) return null;
    const aspects = (target?.visuals || []).map(visual => visual.getBoundingClientRect()).filter(rect => rect.width > 1 && rect.height > 1).map(rect => rect.width / rect.height);
    const aspect = Math.max(.01, Math.floor(Math.min(view.rect.width / view.rect.height, ...aspects) * 100) / 100);
    const delivered = unique.map(([, spec]) => `${new URL(spec.url, url).pathname.match(/\/nike-tn-(blue-white|monochrome|deep-blue)\.glb$/)?.[1]}:${spec.yaw}`).sort();
    const bundled = JSON.stringify(delivered) === JSON.stringify(bundledChapterModels[view.chapter]);
    if (bundled) {
      const baked = bundledJourneyCamera(view.chapter, aspect);
      if (baked !== null) return baked;
    }
    const exchangeRanges = [];
    if (view.chapter === 'materials') {
      for (let index = 1; index < view.modelSpecs.length; index++) {
        if (journeyModelKey(view.modelSpecs[index - 1]) === journeyModelKey(view.modelSpecs[index])) continue;
        const boundary = index / view.modelSpecs.length;
        exchangeRanges.push([boundary - STUDY_EXCHANGE_RADIUS, boundary + STUDY_EXCHANGE_RADIUS], [(index + .16) / view.modelSpecs.length, (index + .64) / view.modelSpecs.length]);
      }
    } else if (view.exchangeWindow) exchangeRanges.push([view.exchangeWindow.start, view.exchangeWindow.end]);
    const key = JSON.stringify([view.chapter, aspect, available.map(([id]) => id).sort(), exchangeRanges]);
    if (!cameraFits.has(key)) cameraFits.set(key, chapterCameraDistance(available.map(([id]) => assets.get(id).points), view.chapter, { aspect, fov: camera.fov, includeExchange: exchangeRanges.length > 0, exchangeRanges }));
    return cameraFits.get(key);
  }

  function resolve() {
    if (targetsDirty || targets.some(target => !target.section.isConnected)) collectTargets();
    const samples = targets.filter(target => {
      const rect = target.section.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < environment.innerHeight;
    }).map(sample);
    const visible = samples.filter(view => view.rect.width > 1 && view.rect.height > 1 && view.rect.bottom > 0 && view.rect.top < environment.innerHeight);
    // Ownership follows visible product windows, never just the section at
    // the viewport center. Both sides of a boundary can remain complete.
    if (visible.length > 1) {
      const hero = visible.find(view => view.chapter === 'hero');
      // The Hero world must stay beneath its HTML in the pinned stage's
      // stacking context. Keep the incoming product's real photograph until
      // that stage leaves; moving its terrain to the body would cover type.
      if (hero) return { ...hero, ownedVisuals: [hero.visual], opacity: 1 };
      return { ...visible[0], views: visible, opacity: 1 };
    }
    if (visible.length === 1) {
      const current = visible[0];
      return { ...current, ownedVisuals: current.chapter === 'materials' && current.pinned ? current.visuals : [current.visual], opacity: 1 };
    }
    return null;
  }

  function lightFor(chapter, progress, exchange = null) {
    waveLight.intensity = 0;
    const grade = document.body.dataset;
    const from = environmentFor(grade.gradeFrom || chapter), to = environmentFor(grade.gradeTo || chapter);
    const blend = Number(grade.gradeProgress) || 0;
    const light = Object.fromEntries(['key', 'rim', 'exposure'].map(name => [name, from[name] + (to[name] - from[name]) * blend]));
    if (chapter === 'brand') {
      const studio = brandLighting(progress);
      key.position.set(...studio.key); rim.position.set(...studio.rim);
      key.intensity = studio.keyIntensity; rim.intensity = studio.rimIntensity;
      ambient.intensity = .55; fill.intensity = .25; scene.environmentIntensity = .23;
    } else {
      key.position.set(3, 4, 5); rim.position.set(-3, 2, -2);
      key.intensity = light.key; rim.intensity = light.rim;
      ambient.intensity = .62; fill.intensity = .34; scene.environmentIntensity = .46;
      if (chapter === 'hero') {
        key.position.set(2.6 - progress * .7, 4.5, 5);
        rim.position.set(-3.6, 2.6, -1.8);
        ambient.intensity = .42; fill.intensity = .3; scene.environmentIntensity = .38;
      }
      if (['deconstruction', 'materials', 'technology', 'featured'].includes(chapter)) {
        key.position.x += Math.sin(progress * Math.PI - .6) * .7;
        rim.position.z += Math.cos(progress * Math.PI) * .35;
      }
    }
    // A short softbox traverse follows the exchange, with no orbit traces
    // or orbiting lights. The material remains readable at the identity cut.
    if (exchange) {
      const energy = Math.sin(Math.PI * exchange.progress) ** 2;
      key.position.x += energy * .7;
      key.intensity += energy * .3;
      rim.intensity += energy * .15;
    }
    return light;
  }

  function renderBoundary(views, chapter, dt) {
    const motionViews = views.map(view => motionFor(view, dt));
    const signature = JSON.stringify(motionViews.map(view => [view.chapter, view.progress, journeyModelKey(view.modelSpec), view.rect.left, view.rect.top, view.rect.width, view.rect.height, view.sectionRect.top, view.sectionRect.bottom])) + document.body.dataset.gradeProgress;
    const liveWorld = views.some(view => view.chapter === 'hero');
    if (!liveWorld && !dirty && signature === lastSignature) return;
    restoreProductWindow();
    const targetWidth = Math.ceil(environment.innerWidth / 64) * 64;
    const targetHeight = Math.ceil(environment.innerHeight / 64) * 64;
    if (width !== targetWidth || height !== targetHeight) {
      width = targetWidth; height = targetHeight;
      const compact = environment.innerWidth <= 700;
      renderer.setPixelRatio(Math.min(environment.devicePixelRatio || 1, compact ? 1.25 : 1.5, Math.sqrt((compact ? 650000 : 2000000) / (width * height))));
      renderer.setSize(width, height, false);
    }
    Object.assign(overlay.style, { display: 'block', left: '0px', top: '0px', width: `${environment.innerWidth}px`, height: `${environment.innerHeight}px`, opacity: '1' });
    renderer.setScissorTest(false); renderer.autoClear = false; renderer.clear();
    const visible = [];
    const motion = [];
    for (const view of motionViews) {
      if (view.orbit) {
        if (renderMaterialOrbit(view)) {
          visible.push(...view.visuals);
          if (inspectMotion) motion.push({ chapter: 'materials', orbit: true, active: materialOrbit(view.progress).active });
        }
        continue;
      }
      if (!selectModel(view.modelSpec, view.modelBlend)) continue;
      const { pose } = view;
      const { rect } = view;
      if (rect.width < 2 || rect.height < 2) continue;
      const cameraZ = cameraDistanceFor(view);
      if (cameraZ === null) continue;
      const isHero = view.chapter === 'hero';
      const worldRect = isHero ? heroStage.getBoundingClientRect() : rect;
      const window = productWindowViewport(worldRect, view.sectionRect, { width: environment.innerWidth, height: environment.innerHeight }, { width, height });
      if (!window) continue;
      renderer.setViewport(...window.viewport);
      renderer.setScissor(...window.scissor); renderer.setScissorTest(true); renderer.clearDepth();
      if (camera.view?.enabled) camera.clearViewOffset();
      camera.rotation.set(0, 0, 0);
      camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
      rig.position.set(0, 0, 0);
      rig.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ, 'XYZ');
      if (view.anatomy) {
        anatomyFocus.set(view.tour.focusX, view.tour.focusY, view.tour.focusZ).applyEuler(rig.rotation);
        rig.position.copy(anatomyFocus).multiplyScalar(-1);
      }
      rig.updateMatrixWorld(true);
      let bottom = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      selectedAssets.forEach(asset => asset.points.forEach((point, index) => {
        const world = asset.worldPoints[index].copy(point).applyMatrix4(rig.matrixWorld);
        bottom = Math.min(bottom, world.y); minX = Math.min(minX, world.x); maxX = Math.max(maxX, world.x);
        minZ = Math.min(minZ, world.z); maxZ = Math.max(maxZ, world.z);
      }));
      shadowPlane.position.set((minX + maxX) / 2, bottom - .045, (minZ + maxZ) / 2);
      shadowPlane.scale.set(Math.max(.4, (maxX - minX) * 1.16), Math.max(.35, (maxZ - minZ) * 1.18), 1);
      camera.position.set(0, pose.cameraY, cameraZ);
      const light = lightFor(view.chapter, view.progress, view.modelBlend);
      if (view.anatomy) {
        key.position.set(view.tour.keyX, view.tour.keyY, view.tour.keyZ);
        key.intensity = 3.15; rim.position.set(3, 2.6, -2); rim.intensity = 1.8;
      }
      renderer.toneMappingExposure = pose.exposure * light.exposure;
      heroWorld.group.visible = isHero; scene.fog = isHero ? heroWorld.fog : null; shadowPlane.visible = !isHero && !view.anatomy;
      if (isHero) {
        expandHeroCamera(camera, heroProductGate(rect, view.progress, environment.innerWidth <= 700), worldRect);
        heroWorld.update(worldTime, view.progress, dt, camera, rig, key, rim);
        updateHeroShadow(view.progress);
      }
      renderer.render(scene, camera);
      if (inspectMotion && view.anatomy) {
        const projected = selectedAssets.flatMap(asset => asset.points.map(point => point.clone().applyMatrix4(rig.matrixWorld).project(camera)));
        const focus = new THREE.Vector3(view.tour.focusX, view.tour.focusY, view.tour.focusZ).applyMatrix4(rig.matrixWorld).project(camera);
        overlay.dataset.anatomyCamera = JSON.stringify({ progress: view.progress, active: view.tour.active,
          zoom: view.tour.zoom, focus: [view.tour.focusX, view.tour.focusY, view.tour.focusZ], focalScreen: focus.toArray(),
          bounds: { left: Math.min(...projected.map(p => p.x)), right: Math.max(...projected.map(p => p.x)), top: Math.max(...projected.map(p => p.y)), bottom: Math.min(...projected.map(p => p.y)) },
          position: rig.position.toArray(), rotation: rig.rotation.toArray(), camera: camera.position.toArray(),
          calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
      }
      if (inspectMotion) motion.push({ chapter: view.chapter, model: overlay.dataset.model, pose: [pose.rotationX, pose.rotationY, pose.rotationZ], camera: cameraZ, scale: selectedAssets[0].group.scale.toArray() });
      visible.push(...(view.chapter === 'materials' && view.pinned ? view.visuals : [view.visual]));
    }
    renderer.autoClear = true; renderer.setScissorTest(false);
    heroWorld.group.visible = false; scene.fog = null; shadowPlane.visible = true;
    if (camera.view?.enabled) camera.clearViewOffset();
    camera.rotation.set(0, 0, 0); rig.position.set(0, 0, 0);
    owned.filter(target => !visible.includes(target)).forEach(target => target.classList.remove('has-journey-scene'));
    visible.forEach(target => target.classList.add('has-journey-scene')); owned = visible;
    overlay.dataset.chapter = chapter;
    if (inspectMotion) overlay.dataset.motion = JSON.stringify(motion);
    if (!visible.length) release();
    lastSignature = signature; dirty = false;
    if (inspectMotion) {
      const textures = new Set();
      assets.forEach(asset => asset.model.traverse(node => {
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) if (material) Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
      }));
      overlay.dataset.resources = JSON.stringify({ frames: renderer.info.render.frame, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs?.length, assets: assets.size, buffer: [renderer.domElement.width, renderer.domElement.height], productMaps: [...textures].map(texture => [texture.image?.width, texture.image?.height]) });
    }
  }

  function renderMaterialOrbit(view) {
    const delivered = view.modelSpecs.map(spec => assets.get(journeyModelKey(spec)));
    view.modelSpecs.forEach(spec => { if (!assets.has(journeyModelKey(spec))) void loadModel(spec); });
    // All three photographs keep orbiting until all three models can take over.
    if (delivered.some(asset => !asset)) return false;
    const window = productWindowViewport(view.rect, view.sectionRect,
      { width: environment.innerWidth, height: environment.innerHeight }, { width, height });
    if (!window) return false;
    const state = materialOrbit(view.progress);
    selectedAssets.forEach(asset => rig.remove(asset.group)); selectedAssets = [];
    delivered.forEach((asset, index) => {
      const id = `${journeyModelKey(view.modelSpecs[index])}:${index}`;
      if (!orbitInstances.has(id)) orbitInstances.set(id, { ...asset, group: asset.group.clone(true) });
      const instance = orbitInstances.get(id), point = state.items[index];
      instance.group.position.set(point.x, point.y, point.z);
      instance.group.rotation.set(point.rotationX, point.rotationY, point.rotationZ, 'XYZ');
      rig.add(instance.group); selectedAssets.push(instance);
    });
    activeModelKey = 'material-orbit';
    rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); rig.updateMatrixWorld(true);
    if (camera.view?.enabled) camera.clearViewOffset();
    camera.rotation.set(0, 0, 0); camera.aspect = view.rect.width / view.rect.height;
    camera.position.set(0, MATERIAL_ORBIT_CAMERA.y, materialOrbitCamera(camera.aspect));
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    heroWorld.group.visible = false; scene.fog = null; shadowPlane.visible = false;
    lightFor('materials', view.progress);
    renderer.toneMappingExposure = .94 * environmentFor('materials').exposure;
    renderer.setViewport(...window.viewport); renderer.setScissor(...window.scissor);
    renderer.setScissorTest(true); renderer.clearDepth(); renderer.render(scene, camera);
    overlay.dataset.model = 'three-sneaker-orbit';
    if (inspectMotion) overlay.dataset.orbit = JSON.stringify({ progress: view.progress, active: state.active,
      camera: camera.position.toArray(), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      items: selectedAssets.map((asset, index) => {
        const points = asset.points.map(point => point.clone().applyEuler(asset.group.rotation).add(asset.group.position).project(camera));
        return { index, variant: view.modelSpecs[index].variant, position: asset.group.position.toArray(),
          bounds: { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
            top: Math.max(...points.map(p => p.y)), bottom: Math.min(...points.map(p => p.y)) } };
      }) });
    return true;
  }

  // Exit the hero without leaking its projection, fog, shadows or DOM owner
  // into a later chapter. Reparenting happens only at an ownership boundary.
  function restoreProductWindow() {
    delete root.dataset.heroLive;
    if (overlay.parentElement !== document.body) document.body.append(overlay);
    overlay.style.position = 'fixed';
    if (camera.view?.enabled) camera.clearViewOffset();
    camera.rotation.set(0, 0, 0);
    rig.position.set(0, 0, 0);
    if (heroWorld) heroWorld.group.visible = false;
    scene.fog = null;
    if (shadowPlane) shadowPlane.visible = true;
  }

  function renderHeroWorld(current, cameraZ, dt) {
    const stageRect = heroStage.getBoundingClientRect();
    if (stageRect.bottom <= 0 || stageRect.top >= environment.innerHeight) { release(); return; }
    if (overlay.parentElement !== heroStage) heroStage.append(overlay);
    if (heroReadyTime === null) {
      const covered = document.documentElement.classList.contains('site-intro-playing') &&
        !document.documentElement.hasAttribute('data-intro-revealing');
      // Complete the actual scene while the film is opaque. Holding its
      // opening pose until the Intro finishes avoids a second arrival/fade.
      heroReadyTime = worldTime - (covered ? .45 : 0);
    }
    const liveBlend = fixedWorldTime === null && matchingPoster && current.progress < .025 ? clamp((worldTime - heroReadyTime) / .45) : 1;
    const blendValue = liveBlend.toFixed(4);
    if (root.style.getPropertyValue('--hero-live-blend') !== blendValue) root.style.setProperty('--hero-live-blend', blendValue);
    root.dataset.heroLive = 'true';
    Object.assign(overlay.style, { position: 'absolute', display: 'block', left: '0px', top: '0px',
      width: `${stageRect.width}px`, height: `${stageRect.height}px`, opacity: String(current.opacity) });
    const targetWidth = Math.max(64, Math.ceil(environment.innerWidth / 64) * 64);
    const targetHeight = Math.max(64, Math.ceil(environment.innerHeight / 64) * 64);
    if (width !== targetWidth || height !== targetHeight) {
      width = targetWidth; height = targetHeight;
      renderer.setPixelRatio(Math.min(environment.devicePixelRatio || 1, environment.innerWidth <= 700 ? 1.25 : 1.5, Math.sqrt((environment.innerWidth <= 700 ? 650000 : 2000000) / (width * height))));
      renderer.setSize(width, height, false);
    }
    const { pose } = current;
    camera.position.set(0, pose.cameraY, cameraZ);
    expandHeroCamera(camera, heroProductGate(current.rect, current.progress, environment.innerWidth <= 700), stageRect);
    rig.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ, 'XYZ');
    lightFor('hero', current.progress);
    heroWorld.group.visible = true; scene.fog = heroWorld.fog; shadowPlane.visible = false;
    heroWorld.update(worldTime, current.progress, dt, camera, rig, key, rim, matchingPoster ? 1 : (bus?.state?.entrance ?? 1), renderer.domElement.height, waveLight, liveBlend);
    renderer.toneMappingExposure = pose.exposure * environmentFor('hero').exposure;
    updateHeroShadow(current.progress);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, width, height);
    renderer.render(scene, camera);
    trace('first-frame');
    if (liveBlend === 1) trace('full-world');
    owned.filter(target => target !== current.visual).forEach(target => target.classList.remove('has-journey-scene'));
    current.visual.classList.add('has-journey-scene'); owned = [current.visual];
    overlay.dataset.chapter = 'hero';
    if (inspectMotion) {
      const projected = selectedAssets.flatMap(asset => asset.points.map(point => {
        const p = point.clone().applyMatrix4(rig.matrixWorld).project(camera);
        return [stageRect.left + (p.x + 1) * stageRect.width / 2, stageRect.top + (1 - p.y) * stageRect.height / 2];
      }));
      overlay.dataset.world = JSON.stringify({ time: worldTime, progress: current.progress, camera: camera.position.toArray(),
        wave: { x: waveLight.target.position.x - rig.position.x, strength: waveLight.intensity / 20 }, blend: liveBlend,
        surface: heroWorld.group.position.toArray(), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
        buffer: [renderer.domElement.width, renderer.domElement.height],
        productBounds: { left: Math.min(...projected.map(p => p[0])), right: Math.max(...projected.map(p => p[0])), top: Math.min(...projected.map(p => p[1])), bottom: Math.max(...projected.map(p => p[1])) } });
      overlay.dataset.motion = JSON.stringify([{ chapter: 'hero', model: overlay.dataset.model,
        pose: [pose.rotationX, pose.rotationY, pose.rotationZ], camera: cameraZ, scale: selectedAssets[0].group.scale.toArray() }]);
    }
    lastSignature = '';
  }

  try {
    setStatus(matchingPoster ? '' : (root.dataset.loadingLabel || 'Loading product view…'));
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    key.castShadow = true;
    const shadowSize = environment.innerWidth <= 700 ? 256 : 512;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(key.shadow.camera, { left: -2.7, right: 2.7, top: 2.7, bottom: -2.7, near: .5, far: 16 });
    key.shadow.normalBias = .025; key.shadow.bias = -.00015;
    key.shadow.radius = 5; key.shadow.intensity = .5;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    overlay.append(renderer.domElement);
    trace('renderer');
    const reflectionTask = fetch(new URL(root.dataset.environmentUrl || 'studio-environment.hdr', url), { signal, credentials: 'omit' })
      .then(async response => {
        if (!response.ok) throw new Error(`Studio response ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (disposed || signal.aborted) return null;
        const texture = new HDRLoader().createDataTexture(bytes);
        texture.mapping = THREE.CubeUVReflectionMapping; texture.flipY = false;
        return texture;
      }).catch(() => null);
    const originalTask = loadModel(primary);
    reflection = await reflectionTask;
    const original = await originalTask;
    if (disposed || signal.aborted) return cleanup;
    if (!original) throw new Error('Opening model unavailable');
    trace('product-ready');
    selectModel(primary);
    // Load alternate shoes shortly before their authored windows enter view.
    // Both models share the existing canvas, camera, lighting and poses.
    modelObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const spec = journeyModelSpec(entry.target.dataset, primary);
        void loadModel(spec); modelObserver.unobserve(entry.target);
      }
    }, { rootMargin: `${Math.max(300, environment.innerHeight * (environment.innerWidth <= 700 ? .4 : .65))}px` });
    document.querySelectorAll('[data-journey-model]').forEach(target => modelObserver.observe(target));
    // Same RoomEnvironment, prefiltered offline. Visitors no longer compile
    // and draw the PMREM blur pipeline during the opening film.
    if (disposed || signal.aborted) { reflection?.dispose(); return cleanup; }
    scene.environment = reflection; scene.environmentIntensity = .36;
    // A feathered contact pool grounds the product without projecting a hard
    // directional silhouette across the frame. Alpha reaches zero at its edge.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 256;
    const context = shadowCanvas.getContext('2d');
    const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255,255,255,.25)');
    gradient.addColorStop(.4, 'rgba(255,255,255,.12)');
    gradient.addColorStop(.72, 'rgba(255,255,255,.035)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 256, 256);
    shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    shadow = new THREE.MeshBasicMaterial({ map: shadowTexture, color: 0x062030, transparent: true, opacity: .6, depthWrite: false, toneMapped: false });
    shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadow);
    shadowPlane.rotation.x = -Math.PI / 2;
    scene.add(shadowPlane);
    heroWorld = createHeroWorld({ scene, root, compact: environment.innerWidth <= 700 });
    // Compile the actual lit scene before taking ownership from its photograph.
    // Parallel shader compilation can finish without blocking an arrival frame.
    heroWorld.group.visible = true;
    scene.fog = heroWorld.fog;
    await yieldMain();
    if (disposed || signal.aborted) return cleanup;
    trace('world-compile-start');
    await renderer.compileAsync(scene, camera);
    trace('world-compiled');
    if (disposed || signal.aborted) return cleanup;
    heroWorld.group.visible = false; scene.fog = null;
    await renderer.compileAsync(rig, camera, scene);
    // The shadow pass has its own program; prewarm that exact material too.
    const depthStudy = new THREE.Group();
    original.model.traverse(node => { if (node.isMesh) depthStudy.add(new THREE.Mesh(node.geometry, depthMaterial)); });
    await renderer.compileAsync(depthStudy, camera, scene);
    trace('shaders-ready');
    depthStudy.clear();
    if (disposed || signal.aborted) return cleanup;
    onReady?.({ renderer, scene, camera, rig, world: heroWorld });
    loaded = true; root.classList.add('has-scene'); setStatus('');
    collectTargets();

    detachFrame = scheduler.add(time => {
      if (disposed || lost || !loaded || document.hidden || !root.isConnected) { if (!root.isConnected) release(); return; }
      const dt = lastFrameTime === null ? 1 / 60 : Math.min(.12, Math.max(.001, time - lastFrameTime));
      lastFrameTime = time;
      const opening = document.documentElement.classList.contains('site-intro-playing') || document.documentElement.classList.contains('site-intro-pending');
      // Establish one frame behind the film; resume during the shutter reveal
      // so the existing Hero arrival is already moving when it becomes visible.
      if (opening && owned.length && !document.documentElement.hasAttribute('data-intro-revealing')) return;
      let current = resolve();
      if (!current) { release(); lastSignature = ''; return; }
      if (current.views) {
        if (!opening && current.views.some(view => view.chapter === 'hero')) worldTime = fixedWorldTime ?? worldTime + dt;
        renderBoundary(current.views, current.chapter, dt); return;
      }
      if (current.chapter !== 'hero') { renderBoundary([current], current.chapter, dt); return; }
      current = motionFor(current, dt);
      const desiredKey = journeyModelKey(current.modelSpec);
      if (failed.has(desiredKey)) { release(); lastSignature = ''; return; }
      if (!selectModel(current.modelSpec, current.modelBlend)) { release(); lastSignature = ''; return; }
      const { rect } = current;
      const cameraZ = cameraDistanceFor(current);
      if (cameraZ === null) { release(); lastSignature = ''; return; }
      if (current.chapter === 'hero') {
        if (!opening) worldTime = fixedWorldTime ?? worldTime + dt;
        renderHeroWorld(current, cameraZ, dt); return;
      }
    });
  } catch (error) {
    if (!disposed && !signal.aborted) {
      cleanup();
      setStatus(root.dataset.errorLabel || '3D view unavailable. Product imagery remains available.');
      console.warn('[STRYDE] Journey model unavailable:', error.message);
    }
  }
  return cleanup;
}
