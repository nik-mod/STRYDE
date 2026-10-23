const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };

export function handoffProgress(scroll, start, end) {
  if (![scroll, start, end].every(Number.isFinite) || end <= start) return 0;
  return clamp((scroll - start) / (end - start));
}

// Measured alpha bounds of the bundled 2800×2100 transparent profile render
// (probe space 280×210 → ×10: left 200, top 560, size 2320×1060). The DOM image
// rectangle already includes its live crop/translation; contain adds padding.
export function profileFootprint(rect) {
  const scale = Math.min(rect.width / 2800, rect.height / 2100);
  return {
    left: rect.left + (rect.width - 2800 * scale) / 2 + 200 * scale,
    top: rect.top + (rect.height - 2100 * scale) / 2 + 560 * scale,
    width: 2320 * scale, height: 1060 * scale,
  };
}

export function projectionWindow(projected, desired, width, height, blend = 1) {
  if (projected.width <= 0 || projected.height <= 0 || desired.width <= 0 || desired.height <= 0) return null;
  const scale = Math.min(desired.width / projected.width, desired.height / projected.height);
  const zoom = 1 + (scale - 1) * blend;
  const originalX = projected.left + projected.width / 2, originalY = projected.top + projected.height / 2;
  const centerX = originalX + (desired.left + desired.width / 2 - originalX) * blend;
  const centerY = originalY + (desired.top + desired.height / 2 - originalY) * blend;
  return { x: originalX - centerX / zoom, y: originalY - centerY / zoom, width: width / zoom, height: height / zoom };
}

// Reuse the live renderer only for the bundled TN's own adjacent profile study.
// A neutral overlay escapes the Hero's clipping/transformed pointer layers.
// Geometry is read by the existing renderer scheduler, never another clock.
export function createSceneBridge({ root, host, canvas, environment = window }) {
  const document = root.ownerDocument;
  const target = document.querySelector('[data-chapter="deconstruction"][data-tn-editorial] .decon-frame');
  const stage = root.querySelector('[data-hero-stage]');
  if (root.dataset.modelYaw !== '90' || !target || !stage || environment.innerWidth <= 700) return null;
  const originalParent = canvas.parentNode;
  const originalNext = canvas.nextSibling;
  const originalCanvasStyle = canvas.getAttribute('style');
  const originalOpacity = target.style.opacity;
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('data-scene-bridge', '');
  Object.assign(overlay.style, { position: 'fixed', pointerEvents: 'none', zIndex: '4', overflow: 'hidden' });
  let disposed = false;
  let lastScroll = NaN;
  let lastWidth = 0;
  let lastHeight = 0;
  let naturalTargetTop = null;
  let state = { active: false, changed: false, progress: 0, mix: 0, width: 0, height: 0 };

  const restore = () => {
    if (canvas.parentNode === overlay) {
      originalParent.insertBefore(canvas, originalNext?.parentNode === originalParent ? originalNext : null);
      if (originalCanvasStyle === null) canvas.removeAttribute('style');
      else canvas.setAttribute('style', originalCanvasStyle);
    }
    target.style.opacity = originalOpacity;
    overlay.remove();
    lastScroll = NaN;
    state = { ...state, active: false, changed: true, mix: 0 };
  };

  return {
    target,
    update() {
      if (disposed) return state;
      const scroll = environment.scrollY || 0;
      const width = environment.innerWidth, height = environment.innerHeight;
      if (scroll === lastScroll && width === lastWidth && height === lastHeight) { state.changed = false; return state; }
      const resized = width !== lastWidth || height !== lastHeight;
      lastScroll = scroll; lastWidth = width; lastHeight = height;
      if (width <= 700 || !target.isConnected || !root.isConnected) {
        if (state.active) restore();
        return state;
      }
      const targetRect = target.getBoundingClientRect();
      const visual = target.closest('.decon-visual');
      const stickyTop = Math.max(0, parseFloat(environment.getComputedStyle(visual || target).top) || 0);
      if (naturalTargetTop === null || resized || targetRect.top > stickyTop + 2) naturalTargetTop = targetRect.top + scroll;
      const stageHeight = stage.offsetHeight;
      const start = root.getBoundingClientRect().bottom + scroll - stageHeight;
      const end = Math.max(start + 1, naturalTargetTop - stickyTop);
      const progress = handoffProgress(scroll, start, end);
      if (progress <= 0 || progress >= 1) {
        const wasActive = state.active;
        if (wasActive) restore();
        state = { ...state, active: false, changed: wasActive || resized, progress, mix: 0 };
        return state;
      }
      const source = host.getBoundingClientRect();
      // Once the Hero pin releases its host scrolls away. Reconstruct the
      // release rectangle so fast jumps and reverse seeks share the same path.
      const sourceTop = source.top + Math.max(0, scroll - start);
      const t = smooth(progress);
      const landing = smooth((progress - .6) / .2);
      const carryLeft = source.left + (targetRect.left - source.left) * t;
      const carryTop = sourceTop + (stickyTop - sourceTop) * t;
      const carryWidth = source.width + (targetRect.width - source.width) * t;
      const carryHeight = source.height + (targetRect.height - source.height) * t;
      const left = carryLeft + (targetRect.left - carryLeft) * landing;
      const top = carryTop + (targetRect.top - carryTop) * landing;
      const viewportWidth = carryWidth + (targetRect.width - carryWidth) * landing;
      const viewportHeight = carryHeight + (targetRect.height - carryHeight) * landing;
      const image = target.querySelector?.('.decon-crop.is-active > img');
      const footprint = image ? profileFootprint(image.getBoundingClientRect()) : null;
      // Alignment (landing) completes at progress .8. Only then does the static
      // image snap fully opaque UNDER the still-opaque overlay; the canvas then
      // fades away on top of it. Nothing is ever semi-transparent over the page,
      // and the aligned stack makes the swap read as one continuous shoe.
      const dissolve = smooth((progress - .8) / .2);
      Object.assign(overlay.style, {
        left: `${left}px`, top: `${top}px`, width: `${viewportWidth}px`, height: `${viewportHeight}px`, opacity: String(1 - dissolve),
      });
      if (!overlay.isConnected) document.body.append(overlay);
      if (canvas.parentNode !== overlay) overlay.append(canvas);
      Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
      target.style.opacity = dissolve > 0 ? '1' : '0';
      state = { active: true, changed: true, progress, mix: smooth(progress / .65), width: viewportWidth, height: viewportHeight,
        left, top, footprint, projectionMix: landing };
      return state;
    },
    restore,
    dispose() { if (disposed) return; restore(); disposed = true; },
  };
}
