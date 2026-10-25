import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { refinePreviewMaterial } from './scene-materials.mjs';
import { fittedCameraZ } from './scene-framing.mjs';
import { journeyModelSpec, journeyModelKey } from './journey-models.mjs';
import { shoeTurn, studyTransition, windowTransition, turnPose, travelWindow, transitionCamera } from './journey-transition.mjs';
import { environmentFor } from './motion/environments.mjs';
import { journeyPose, journeyProgress, interpolateJourneyPose, flowingMaterialSample, inspectionPose, journeyHandoff } from './journey-poses.mjs';

const chapterOrder = ['hero', 'deconstruction', 'materials', 'technology', 'collection', 'featured', 'brand', 'finale'];
const clamp = value => Math.min(1, Math.max(0, value));

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

// The scene owns only its overlay and model. GSAP retains ownership of section
// pins and HTML choreography; no canvas is moved into a transformed pin.
export async function mountJourneyScene(options) {
  const { root, signal } = options;
  const document = root.ownerDocument;
  const environment = document.defaultView;
  if (signal.aborted || environment.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  // Each Chrome preview tab used to create a full WebGL context and load both
  // shoe models, even while hidden. Start only in the foreground and release
  // its GPU buffers when hidden; reopen with the same lifecycle when focused.
  let closed = false;
  let starting = false;
  let activeCleanup = null;
  const boot = async () => {
    if (closed || starting || activeCleanup || document.hidden) return;
    starting = true;
    try {
      const cleanup = await createJourneyScene(options);
      if (closed || document.hidden) cleanup();
      else activeCleanup = cleanup;
    } finally {
      starting = false;
    }
  };
  const visibility = () => {
    if (document.hidden) {
      activeCleanup?.();
      activeCleanup = null;
    } else void boot();
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

async function createJourneyScene({ root, url, scheduler, signal, bus, ScrollTrigger }) {
  const document = root.ownerDocument, environment = document.defaultView;
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
  const rig = new THREE.Group();
  rig.rotation.order = 'XYZ';
  scene.add(rig);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x5290b8, 1.05);
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xbfe8ff, 2); rim.position.set(-3, 2, -2);
  const fill = new THREE.DirectionalLight(0x8fd2f4, .65); fill.position.set(-2.6, .7, 3.4);
  scene.add(ambient, key, rim, fill);
  let renderer, reflection, shadow, shadowPlane, shadowTexture;
  const primary = { url, yaw: Number(root.dataset.modelYaw) || 90, variant: 'blue' };
  const assets = new Map(), loading = new Map(), failed = new Set();
  let selectedAssets = [];
  const sweepResolution = { value: new THREE.Vector2(1, 1) };
  let activeModelKey = '', modelObserver;
  let disposed = false, lost = false, loaded = false, dirty = true, targetsDirty = true;
  let targets = [], owned = [], width = 0, height = 0, lastSignature = '', previousY = environment.scrollY, lastScrollTime = 0;
  let detachFrame = () => {};
  let inspection = null, inspectionStart = 0, inspectionFrom = null, renderedPose = journeyPose('hero', 0);
  let releaseFrom = null, releaseStart = 0;
  let previousFrameTime = 0;
  const viewButtons = [...root.querySelectorAll('[data-scene-view]')];
  const resetInspection = () => {
    inspection = null;
    viewButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
  };
  const inspect = event => {
    const button = event.target.closest('[data-scene-view]');
    if (!button || !root.contains(button) || !loaded || lost) return;
    inspection = inspectionPose(button.dataset.sceneView);
    if (!inspection) return;
    inspectionFrom = { ...renderedPose };
    releaseFrom = null;
    inspectionStart = performance.now() / 1000;
    viewButtons.forEach(view => view.setAttribute('aria-pressed', String(view === button)));
    const label = root.querySelector('[data-hero-view-label]');
    if (label) label.textContent = button.textContent.trim();
    dirty = true;
  };
  root.addEventListener('click', inspect);
  const release = () => {
    owned.forEach(target => target.classList.remove('has-journey-scene'));
    owned = [];
    overlay.style.display = 'none';
  };
  const refresh = () => { targetsDirty = true; dirty = true; };
  const onLost = event => { event.preventDefault(); lost = true; release(); root.classList.remove('has-scene'); resetInspection(); setStatus(root.dataset.contextLostLabel || '3D view interrupted. Product imagery remains available.'); };
  const onRestored = () => { lost = false; dirty = true; lastSignature = ''; root.classList.add('has-scene'); setStatus(''); };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    release(); detachFrame();
    root.removeEventListener('click', inspect);
    resetInspection();
    document.removeEventListener('shopify:section:load', refresh);
    document.removeEventListener('shopify:section:unload', refresh);
    environment.removeEventListener('resize', refresh);
    signal.removeEventListener('abort', cleanup);
    renderer?.domElement.removeEventListener('webglcontextlost', onLost);
    renderer?.domElement.removeEventListener('webglcontextrestored', onRestored);
    modelObserver?.disconnect();
    assets.forEach(asset => disposeModel(asset.model)); assets.clear();
    shadowPlane?.geometry.dispose(); key.shadow.dispose();
    shadow?.dispose(); shadowTexture?.dispose(); reflection?.dispose();
    renderer?.dispose(); renderer?.forceContextLoss(); overlay.remove();
    root.classList.remove('has-scene'); setStatus('');
  };
  signal.addEventListener('abort', cleanup, { once: true });
  document.addEventListener('shopify:section:load', refresh);
  document.addEventListener('shopify:section:unload', refresh);
  environment.addEventListener('resize', refresh, { passive: true });

  function collectTargets() {
    const result = [];
    const add = (chapter, section, visuals) => {
      visuals = visuals.filter(Boolean);
      if (section && visuals.length) result.push({ chapter, section, visuals });
    };
    add('hero', root, [root.querySelector('[data-scene-host]')]);
    const decon = document.querySelector('[data-chapter="deconstruction"][data-tn-editorial]');
    add('deconstruction', decon, decon?.querySelector('[data-model-fullshot]') ? [decon.querySelector('.decon-frame')] : []);
    const materials = document.querySelector('[data-chapter="materials"][data-tn-editorial]');
    add('materials', materials, [...(materials?.querySelectorAll('.mat-frame') || [])].filter(frame => frame.querySelector('img[data-macro-image]')));
    const technology = document.querySelector('[data-chapter="technology"]');
    add('technology', technology, technology?.querySelector('[data-tech-model]') ? [technology.querySelector('.tech-visual')] : []);
    const featured = document.querySelector('[data-chapter="featured"]');
    add('featured', featured, featured?.querySelector('[data-featured-model]') ? [featured.querySelector('.feat-frame')] : []);
    const finale = document.querySelector('[data-chapter="finale"]');
    add('finale', finale, finale?.querySelector('[data-finale-model]') ? [finale.querySelector('.finale-profile-window')] : []);
    targets = result; targetsDirty = false;
  }

  function sample(target) {
    const sectionRect = target.section.getBoundingClientRect();
    const pin = ScrollTrigger?.getAll().find(trigger => trigger.pin && (trigger.trigger === target.section || trigger.trigger?.closest?.('[data-chapter], [data-hero]') === target.section));
    let progress = target.chapter === 'hero' && bus?.state
      ? bus.state.local
      : pin ? journeyProgress(environment.scrollY, pin.start, pin.end)
        : clamp((environment.innerHeight * .75 - sectionRect.top) / Math.max(1, sectionRect.height));
    if (['materials', 'featured'].includes(target.chapter) && pin?.animation) progress = pin.animation.progress();
    let visual = target.visuals[0], flowBlend = null, flowRect = null;
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
      for (let index = 1; index < target.visuals.length; index++) {
        const from = target.visuals[index - 1], to = target.visuals[index];
        const fromSpec = journeyModelSpec(from.closest('[data-journey-model]')?.dataset, primary);
        const toSpec = journeyModelSpec(to.closest('[data-journey-model]')?.dataset, primary);
        if (journeyModelKey(fromSpec) === journeyModelKey(toSpec)) continue;
        const fromRect = from.getBoundingClientRect(), toRect = to.getBoundingClientRect();
        const handoff = journeyHandoff(fromRect, toRect, environment.innerHeight);
        if (handoff) {
          flowBlend = { from: fromSpec, to: toSpec, progress: handoff.progress };
          flowRect = travelWindow(fromRect, toRect, handoff.progress);
          break;
        }
      }
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
    if (!pin && modelOwner?.hasAttribute('data-journey-from-primary')) {
      // On flowing layouts the shoe changes while its actual visual window
      // is inside the screen, rather than after a long mobile text column.
      progress = clamp((environment.innerHeight * .6 - visual.getBoundingClientRect().top) / (environment.innerHeight * .48));
    }
    let modelSpec = journeyModelSpec(modelOwner?.dataset, primary);
    let modelBlend = flowBlend || (target.chapter === 'materials' && pin ? studyTransition(
      target.visuals.map(frame => journeyModelSpec(frame.closest('[data-journey-model]')?.dataset, primary)), progress,
    ) : null);
    if (modelOwner?.hasAttribute('data-journey-from-primary')) {
      const transition = windowTransition(primary, modelSpec, progress,
        Number(modelOwner.dataset.journeyChangeStart), Number(modelOwner.dataset.journeyChangeEnd));
      modelSpec = transition.spec; modelBlend = transition.blend;
    }
    const pose = journeyPose(target.chapter, progress);
    return { ...target, progress, visual, modelSpec, modelBlend, rect: flowRect || visual.getBoundingClientRect(), sectionRect, pose: modelBlend ? turnPose(pose, modelBlend.progress) : pose };
  }

  async function loadModel(spec) {
    const id = journeyModelKey(spec);
    if (assets.has(id)) return assets.get(id);
    if (loading.has(id)) return loading.get(id);
    if (failed.has(id) || disposed || signal.aborted) return null;
    const task = (async () => {
      const modelURL = new URL(spec.url, url).href;
      const response = await fetch(modelURL, { signal, credentials: 'omit' });
      if (!response.ok) throw new Error(`Model response ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (disposed || signal.aborted) return null;
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, new URL('.', modelURL).href);
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
        const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const cut = { value: -1 }, role = { value: 0 };
        const treatedMaterials = new Set();
        object.traverse(node => {
          for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
            if (!material || treatedMaterials.has(material)) continue;
            treatedMaterials.add(material);
            for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]) if (texture) { texture.anisotropy = anisotropy; texture.needsUpdate = true; }
            if (material.normalScale) material.normalScale.set(1.2, 1.2);
            if (spec.variant !== 'blue') {
              material.envMapIntensity = .55;
              if ('specularIntensity' in material) material.specularIntensity = .6;
              material.specularColor?.setRGB(.8, .8, .8);
            } else refinePreviewMaterial(material, THREE.ShaderChunk.normal_fragment_maps);
            const compile = material.onBeforeCompile.bind(material);
            const cacheKey = material.customProgramCacheKey.bind(material);
            material.onBeforeCompile = (shader, webgl) => {
              compile(shader, webgl);
              Object.assign(shader.uniforms, { uShoeCut: cut, uShoeRole: role, uShoeResolution: sweepResolution });
              shader.fragmentShader = 'uniform float uShoeCut; uniform float uShoeRole; uniform vec2 uShoeResolution;\n' + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
                float shoeX = gl_FragCoord.x / uShoeResolution.x;
                float shoeY = gl_FragCoord.y / uShoeResolution.y;
                float shoeSurface = shoeX + .025 * sin(shoeY * 6.2831853);
                if (uShoeRole != 0.0 && (shoeSurface - uShoeCut) * uShoeRole < 0.0) discard;
              `);
            };
            material.customProgramCacheKey = () => cacheKey() + '|opaque-shoe-turn-v1';
          }
        });
        const scale = 2.6 / Math.max(size.x, size.y, size.z);
        const group = new THREE.Group(); group.scale.setScalar(scale); group.add(object);
        surface.forEach(point => point.multiplyScalar(scale));
        const asset = { model: object, group, points: surface, worldPoints: surface.map(() => new THREE.Vector3()), cut, role,
          scale, size: size.clone().multiplyScalar(scale), fitScale: new THREE.Vector3(1, 1, 1) };
        assets.set(id, asset); dirty = true;
        return asset;
      } catch (error) { disposeModel(object); throw error; }
    })().catch(error => {
      failed.add(id);
      if (!disposed && !signal.aborted) console.warn('[STRYDE] Product model unavailable:', error.message);
      return null;
    }).finally(() => loading.delete(id));
    loading.set(id, task);
    return task;
  }

  function selectModel(spec, blend = null) {
    const specs = blend ? [blend.from, blend.to] : [spec];
    const ids = specs.map(journeyModelKey), id = ids.join('|');
    const next = ids.map(key => assets.get(key));
    if (next.some(asset => !asset)) { specs.forEach(candidate => { void loadModel(candidate); }); return false; }
    if (activeModelKey !== id) {
      selectedAssets.forEach(asset => { rig.remove(asset.group); asset.role.value = 0; });
      selectedAssets = next;
      next.forEach(asset => rig.add(asset.group));
      activeModelKey = id; lastSignature = ''; dirty = true;
    }
    const surface = blend ? shoeTurn(blend.progress).surface : 0;
    const envelope = blend ? next[0].size.clone().lerp(next[1].size, surface) : null;
    next.forEach((asset, index) => {
      asset.role.value = blend ? (index === 0 ? 1 : -1) : 0;
      asset.cut.value = - .05 + surface * 1.1;
      // Match the full silhouette envelope at the heel, then restore the new
      // shoe's exact proportions as the turn opens back into its side view.
      asset.fitScale.set(1, 1, 1);
      if (envelope) asset.fitScale.copy(envelope).divide(asset.size);
      asset.group.scale.copy(asset.fitScale).multiplyScalar(asset.scale);
    });
    overlay.dataset.model = blend ? (surface <= 0 ? blend.from.variant : surface >= 1 ? blend.to.variant : `${blend.from.variant}-to-${blend.to.variant}`) : spec.variant;
    overlay.dataset.transition = blend ? blend.progress.toFixed(4) : '';
    return true;
  }

  function resolve() {
    if (targetsDirty || targets.some(target => !target.section.isConnected)) collectTargets();
    const samples = targets.map(sample);
    const midline = environment.innerHeight * .5;
    // The real section at the viewport's center decides ownership. A collection
    // photograph or brand composition intentionally releases the TN renderer.
    const centered = [...document.querySelectorAll('section[data-env]')].find(section => {
      const rect = section.getBoundingClientRect();
      return rect.top <= midline && rect.bottom > midline;
    });
    let current = samples.find(target => target.section === centered);
    for (let index = 1; index < samples.length; index++) {
      const from = samples[index - 1], to = samples[index];
      if (chapterOrder.indexOf(to.chapter) !== chapterOrder.indexOf(from.chapter) + 1) continue;
      const handoff = journeyHandoff(from.rect, to.rect, environment.innerHeight);
      if (handoff) {
        const modelBlend = journeyModelKey(from.modelSpec) !== journeyModelKey(to.modelSpec)
          ? { from: from.modelSpec, to: to.modelSpec, progress: handoff.progress } : null;
        const pose = interpolateJourneyPose(from.pose, to.pose, handoff.progress);
        return { ...[from, to][handoff.index], modelBlend, pose: modelBlend ? turnPose(pose, modelBlend.progress) : pose,
          rect: travelWindow(from.rect, to.rect, handoff.progress), visuals: [...from.visuals, ...to.visuals], opacity: 1 };
      }
    }
    if (!current) return null;
    const rect = current.rect;
    if (rect.width < 2 || rect.height < 2 || rect.bottom < 0 || rect.top > environment.innerHeight) return null;
    // Fade at the edges of chapters separated by photography or brand content.
    const index = chapterOrder.indexOf(current.chapter);
    const previousLive = samples.some(target => chapterOrder.indexOf(target.chapter) === index - 1);
    const nextLive = samples.some(target => chapterOrder.indexOf(target.chapter) === index + 1);
    const enter = previousLive || current.chapter === 'hero' ? 1 : clamp((environment.innerHeight - current.sectionRect.top) / (environment.innerHeight * .4));
    const leave = nextLive || current.chapter === 'finale' ? 1 : clamp(current.sectionRect.bottom / (environment.innerHeight * .4));
    return { ...current, visuals: current.chapter === 'materials' ? current.visuals : [current.visual], opacity: Math.min(enter, leave) };
  }

  try {
    setStatus(root.dataset.loadingLabel || 'Loading product view…');
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);
    overlay.append(renderer.domElement);
    const original = await loadModel(primary);
    if (disposed || signal.aborted) return cleanup;
    if (!original) throw new Error('Opening model unavailable');
    selectModel(primary);
    // Load alternate shoes shortly before their authored windows enter view.
    // Both models share the existing canvas, camera, lighting and poses.
    modelObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const spec = journeyModelSpec(entry.target.dataset, primary);
        void loadModel(spec); modelObserver.unobserve(entry.target);
      }
    }, { rootMargin: '700px' });
    document.querySelectorAll('[data-journey-model]').forEach(target => modelObserver.observe(target));
    const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
    reflection = pmrem.fromScene(room, .04); room.dispose(); pmrem.dispose();
    scene.environment = reflection.texture; scene.environmentIntensity = .36;
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
    loaded = true; root.classList.add('has-scene'); setStatus('');
    collectTargets();

    detachFrame = scheduler.add(time => {
      const dt = Math.min(.05, Math.max(0, time - (previousFrameTime || time - 1 / 60)));
      previousFrameTime = time;
      if (disposed || lost || !loaded || document.hidden || !root.isConnected) { if (!root.isConnected) release(); return; }
      const current = resolve();
      if (!current) { release(); lastSignature = ''; return; }
      const desiredKey = journeyModelKey(current.modelSpec);
      if (failed.has(desiredKey)) { release(); lastSignature = ''; return; }
      if (!selectModel(current.modelSpec, current.modelBlend)) { release(); lastSignature = ''; return; }
      const { rect } = current;
      const scroll = environment.scrollY;
      const now = performance.now() / 1000;
      if (scroll !== previousY) {
        previousY = scroll; lastScrollTime = time;
        if (inspection) { releaseFrom = { ...renderedPose }; releaseStart = now; resetInspection(); }
      }
      if (current.chapter !== 'hero') { if (inspection) resetInspection(); releaseFrom = null; }
      const inspectionProgress = clamp((now - inspectionStart) / .65);
      const releaseProgress = clamp((now - releaseStart) / .35);
      if (releaseProgress >= 1) releaseFrom = null;
      const targetPose = inspection ? interpolateJourneyPose(inspectionFrom, inspection, inspectionProgress)
        : releaseFrom ? interpolateJourneyPose(releaseFrom, current.pose, releaseProgress) : current.pose;
      // Frame-rate independent settling absorbs wheel steps, trackpad bursts
      // and chapter jumps without changing the authored final angles.
      const settle = 1 - Math.exp(-12 * dt);
      const pose = Object.fromEntries(Object.entries(targetPose).map(([key, value]) => [key,
        Math.abs(value - renderedPose[key]) < .00001 ? value : renderedPose[key] + (value - renderedPose[key]) * settle,
      ]));
      renderedPose = pose;
      const resting = !inspection && !releaseFrom && time - lastScrollTime > .2 && ((current.chapter === 'hero' && current.progress < .06) || (current.chapter === 'finale' && current.progress > .82));
      const signature = [activeModelKey, current.modelBlend?.progress.toFixed(5) || '', ...Object.values(pose).map(value => value.toFixed(5)), current.chapter, current.progress.toFixed(5), rect.left.toFixed(2), rect.top.toFixed(2), rect.width.toFixed(2), rect.height.toFixed(2), current.opacity.toFixed(3), inspection ? inspectionProgress.toFixed(4) + ':' + viewButtons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.sceneView : releaseFrom ? `release-${releaseProgress.toFixed(4)}` : 'scroll'].join(':');
      if (!dirty && !resting && signature === lastSignature) return;
      lastSignature = signature; dirty = false;
      // CSS geometry remains exact, but GPU storage changes only at 64px
      // boundaries while the canvas travels between differently sized stages.
      const targetWidth = Math.max(64, Math.ceil(rect.width / 64) * 64), targetHeight = Math.max(64, Math.ceil(rect.height / 64) * 64);
      if (width !== targetWidth || height !== targetHeight) {
        width = targetWidth; height = targetHeight;
        const dpr = Math.min(environment.devicePixelRatio || 1, 1.5, Math.sqrt(2000000 / (width * height)));
        renderer.setPixelRatio(Math.max(1, dpr)); renderer.setSize(width, height, false);
        sweepResolution.value.set(renderer.domElement.width, renderer.domElement.height);
      }
      const aspect = rect.width / rect.height;
      if (camera.aspect !== aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
      Object.assign(overlay.style, { display: 'block', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, opacity: String(current.opacity) });
      const idle = resting ? Math.sin(time * .9) * .012 : 0;
      rig.position.y = idle;
      rig.rotation.set(pose.rotationX, pose.rotationY + (resting ? Math.sin(time * .43) * .016 : 0), pose.rotationZ, 'XYZ');
      rig.updateMatrixWorld(true);
      let bottom = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      selectedAssets.forEach(asset => asset.points.forEach((point, index) => {
        const world = asset.worldPoints[index].copy(point).multiply(asset.fitScale).applyMatrix4(rig.matrixWorld);
        bottom = Math.min(bottom, world.y); minX = Math.min(minX, world.x); maxX = Math.max(maxX, world.x);
        minZ = Math.min(minZ, world.z); maxZ = Math.max(maxZ, world.z);
      }));
      shadowPlane.position.set((minX + maxX) / 2, bottom - .045, (minZ + maxZ) / 2);
      shadowPlane.scale.set(Math.max(.4, (maxX - minX) * 1.16), Math.max(.35, (maxZ - minZ) * 1.18), 1);
      const fit = { fov: camera.fov, aspect: camera.aspect, y: pose.cameraY, fill: environment.innerWidth <= 700 ? Math.min(.95, pose.fill) : pose.fill };
      const distances = selectedAssets.map(asset => fittedCameraZ(asset.worldPoints, fit));
      camera.position.set(0, pose.cameraY, current.modelBlend ? transitionCamera(distances[0], distances[1], current.modelBlend.progress) : distances[0]);
      const light = environmentFor(current.chapter);
      key.intensity = light.key; rim.intensity = light.rim;
      renderer.toneMappingExposure = pose.exposure * light.exposure;
      renderer.render(scene, camera);
      owned.filter(target => !current.visuals.includes(target)).forEach(target => target.classList.remove('has-journey-scene'));
      current.visuals.forEach(target => target.classList.add('has-journey-scene'));
      owned = current.visuals;
      overlay.dataset.chapter = current.chapter;
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
