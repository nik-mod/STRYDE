// Trim only a verified white/transparent image ground; the shipping image stays
// intact. This corrects large blank margins in the imported photography.
export function photoContentBounds(pixels, width, height) {
  let left = width, right = -1, top = height, bottom = -1;
  const isGround = offset => pixels[offset + 3] < 24 || Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) > 242;
  const corners = [0, (width - 1) * 4, (height - 1) * width * 4, (height * width - 1) * 4];
  if (!corners.every(isGround)) return { left: 0, top: 0, width, height };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!isGround((y * width + x) * 4)) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  if (right - left < 4 || bottom - top < 4) return { left: 0, top: 0, width, height };
  const padding = Math.max(width, height) * .035;
  left = Math.max(0, left - padding); top = Math.max(0, top - padding);
  right = Math.min(width, right + padding); bottom = Math.min(height, bottom + padding);
  return { left, top, width: right - left, height: bottom - top };
}

export function fitPhotoContent(bounds, sourceWidth, sourceHeight, frameWidth, frameHeight, fill = .84) {
  const scale = Math.min(frameWidth * fill / bounds.width, frameHeight * fill / bounds.height);
  return { width: sourceWidth * scale, height: sourceHeight * scale, left: (frameWidth - bounds.width * scale) / 2 - bounds.left * scale, top: (frameHeight - bounds.height * scale) / 2 - bounds.top * scale };
}

/** One DOM gallery serves native products and editorial preview photo sets. */
export function galleryIndex(index, length) {
  return length > 0 ? ((Math.trunc(index) % length) + length) % length : 0;
}

export function mountProductGallery(root) {
  const gallery = root.querySelector('[data-product-gallery]');
  const image = gallery?.querySelector('[data-gallery-image]');
  if (!gallery || !image) return { dispose() {}, showSource() {} };
  const environment = root.ownerDocument.defaultView;
  const abort = new AbortController();
  const on = (node, type, callback, options = {}) => node?.addEventListener(type, callback, { ...options, signal: abort.signal });
  const thumbs = [...gallery.querySelectorAll('[data-product-thumbnail]')];
  const sources = thumbs.length ? thumbs.map(thumb => ({ src: thumb.dataset.imageUrl, alt: thumb.dataset.imageAlt || '' })) : [{ src: image.src, alt: image.alt }];
  const dialog = gallery.querySelector('[data-gallery-dialog]');
  const largeImage = dialog?.querySelector('[data-lightbox-image]');
  const largeCanvas = dialog?.querySelector('[data-lightbox-canvas]');
  const zoom = dialog?.querySelector('[data-lightbox-zoom]');
  let index = 0, external = null, previousFocus = null, animation = null, swipeStart = null;
  let disposed = false, ignoreClickUntil = 0;
  const normalize = gallery.hasAttribute('data-gallery-normalize');
  const boundsCache = new Map();
  const visibleThumbnails = new Set();
  const error = root.ownerDocument.createElement('p');
  error.className = 'studio-gallery-error'; error.setAttribute('role', 'status'); error.hidden = true;
  error.textContent = 'Image unavailable. Choose another view.';
  gallery.querySelector('.studio-gallery-stage').append(error);
  const loading = root.ownerDocument.createElement('p');
  loading.className = 'studio-gallery-loading'; loading.setAttribute('role', 'status'); loading.hidden = true; loading.textContent = 'Loading image…';
  gallery.querySelector('.studio-gallery-stage').append(loading);
  const boundsFor = picture => {
    if (!picture.complete || !picture.naturalWidth) return null;
    const source = picture.currentSrc || picture.src;
    if (boundsCache.has(source)) return boundsCache.get(source);
    try {
      const canvas = root.ownerDocument.createElement('canvas');
      const ratio = Math.min(1, 192 / Math.max(picture.naturalWidth, picture.naturalHeight));
      canvas.width = Math.max(1, Math.round(picture.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(picture.naturalHeight * ratio));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      const bounds = photoContentBounds(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      const result = { ...bounds, sourceWidth: canvas.width, sourceHeight: canvas.height };
      boundsCache.set(source, result); return result;
    } catch { boundsCache.set(source, null); return null; }
  };
  const fit = (picture, frame, fill = .84, cachedOnly = false) => {
    if (!normalize || !picture || !frame) return;
    if (cachedOnly && !boundsCache.has(picture.currentSrc || picture.src)) return;
    const bounds = boundsFor(picture);
    if (!bounds) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const geometry = fitPhotoContent(bounds, bounds.sourceWidth, bounds.sourceHeight, rect.width, rect.height, fill);
    picture.classList.add('has-content-framing');
    Object.assign(picture.style, Object.fromEntries(Object.entries(geometry).map(([key, value]) => [key, `${value}px`])));
  };
  const fitAll = () => {
    fit(image, gallery.querySelector('[data-gallery-open]'));
    thumbs.forEach(thumb => fit(thumb.querySelector('img'), thumb, .8, !visibleThumbnails.has(thumb)));
    if (dialog?.open && !dialog.classList.contains('is-zoomed')) fit(largeImage, largeCanvas, .9);
  };
  on(image, 'load', () => { gallery.setAttribute('aria-busy', 'false'); error.hidden = true; loading.hidden = true; fitAll(); });
  on(image, 'error', () => { gallery.setAttribute('aria-busy', 'false'); error.hidden = false; loading.hidden = true; });
  thumbs.forEach(thumb => on(thumb.querySelector('img'), 'load', fitAll));
  on(largeImage, 'load', fitAll);
  const resize = environment.ResizeObserver ? new environment.ResizeObserver(fitAll) : null;
  resize?.observe(gallery);
  // Frame thumbnails as they enter the horizontal rail. Offscreen photographs
  // keep their native lazy loading and never cause a speculative readback.
  const thumbnailRail = gallery.querySelector('.studio-gallery-thumbnails');
  const thumbnailObserver = normalize && thumbnailRail && environment.IntersectionObserver
    ? new environment.IntersectionObserver(entries => {
      if (disposed) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleThumbnails.add(entry.target);
          fit(entry.target.querySelector('img'), entry.target, .8);
        } else visibleThumbnails.delete(entry.target);
      }
    }, { root: thumbnailRail, threshold: .02 }) : null;
  thumbs.forEach(thumb => thumbnailObserver?.observe(thumb));

  const sameSource = (a, b) => { try { return new URL(a, environment.location.href).pathname === new URL(b, environment.location.href).pathname; } catch { return a === b; } };
  index = Math.max(0, sources.findIndex(source => sameSource(source.src, image.src)));
  const number = value => String(value).padStart(2, '0');
  const resetZoom = () => {
    dialog?.classList.remove('is-zoomed');
    zoom?.setAttribute('aria-pressed', 'false');
    if (largeCanvas) { largeCanvas.scrollTop = 0; largeCanvas.scrollLeft = 0; }
    if (largeImage) { largeImage.classList.remove('has-content-framing'); largeImage.removeAttribute('style'); }
  };
  const update = (animate = true) => {
    if (disposed) return;
    const source = external || sources[index];
    gallery.setAttribute('aria-busy', 'true'); loading.hidden = false; error.hidden = true;
    image.classList.remove('has-content-framing'); image.removeAttribute('style');
    image.removeAttribute('srcset');
    image.src = source.src;
    image.alt = source.alt;
    gallery.querySelector('[data-gallery-open]').href = source.src;
    thumbs.forEach((thumb, position) => {
      if (!external && position === index) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
    const count = external ? 'Variant view' : `${number(index + 1)} / ${number(sources.length)}`;
    gallery.querySelector('[data-gallery-count]').textContent = count;
    gallery.querySelector('[data-gallery-caption]').textContent = external ? 'Variant view' : `View ${number(index + 1)}`;
    if (largeImage) { largeImage.src = source.src; largeImage.alt = source.alt; }
    if (dialog) dialog.querySelector('[data-lightbox-count]').textContent = count;
    resetZoom();
    fitAll();
    if (image.complete && image.naturalWidth) { gallery.setAttribute('aria-busy', 'false'); loading.hidden = true; }
    animation?.cancel();
    if (animate && !environment.matchMedia('(prefers-reduced-motion: reduce)').matches && image.animate) {
      animation = image.animate([{ opacity: .25, transform: 'translateX(10px) scale(.99)' }, { opacity: 1, transform: 'translateX(0) scale(1)' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  };
  const show = next => { external = null; index = galleryIndex(next, sources.length); update(); };
  const close = () => { if (dialog?.open) dialog.close(); };
  const open = event => {
    if (Date.now() < ignoreClickUntil) { event?.preventDefault(); return; }
    if (!dialog?.showModal) return;
    event?.preventDefault();
    previousFocus = root.ownerDocument.activeElement;
    update(false);
    dialog.showModal();
    fitAll();
    dialog.querySelector('[data-lightbox-close]')?.focus();
  };
  thumbs.forEach((thumb, position) => on(thumb, 'click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); show(position);
    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }));
  on(gallery.querySelector('[data-gallery-prev]'), 'click', () => show(index - 1));
  on(gallery.querySelector('[data-gallery-next]'), 'click', () => show(index + 1));
  on(gallery.querySelector('[data-gallery-open]'), 'click', open);
  on(dialog?.querySelector('[data-lightbox-close]'), 'click', close);
  on(dialog?.querySelector('[data-lightbox-prev]'), 'click', () => show(index - 1));
  on(dialog?.querySelector('[data-lightbox-next]'), 'click', () => show(index + 1));
  on(dialog, 'close', () => { resetZoom(); previousFocus?.focus?.({ preventScroll: true }); });
  on(dialog, 'click', event => { if (event.target === dialog) close(); });
  on(zoom, 'click', () => {
    const active = dialog.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(active));
    if (active) { largeImage.classList.remove('has-content-framing'); largeImage.removeAttribute('style'); } else fitAll();
  });
  on(gallery, 'keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); show(index + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  for (const surface of [gallery.querySelector('.studio-gallery-stage'), largeCanvas]) {
    on(surface, 'pointerdown', event => { if (event.pointerType === 'touch' && !dialog?.classList.contains('is-zoomed')) swipeStart = { x: event.clientX, y: event.clientY }; }, { passive: true });
    on(surface, 'pointerup', event => {
      if (!swipeStart) return;
      const dx = event.clientX - swipeStart.x, dy = event.clientY - swipeStart.y; swipeStart = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { ignoreClickUntil = Date.now() + 400; show(index + (dx < 0 ? 1 : -1)); }
    }, { passive: true });
    on(surface, 'pointercancel', () => { swipeStart = null; }, { passive: true });
  }
  gallery.classList.add('is-ready');
  update(false);
  return {
    showSource(src, alt = '') {
      const found = sources.findIndex(source => sameSource(source.src, src));
      if (found >= 0) { index = found; external = null; }
      else external = { src, alt };
      update(false);
    },
    dispose() { disposed = true; close(); abort.abort(); animation?.cancel(); gallery.classList.remove('is-ready'); resize?.disconnect(); thumbnailObserver?.disconnect(); visibleThumbnails.clear(); error.remove(); loading.remove(); },
  };
}
