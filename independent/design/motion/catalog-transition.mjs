// Keep the current edit on screen while the next page's opening photographs
// decode. Requests are replaceable: a quick second click or Back owns the result.
export function prepareCatalogImages(items, environment, signal, timeout = 900) {
  if (!environment.Image || signal.aborted) return Promise.resolve();
  return new Promise(resolve => {
    const images = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      images.forEach(image => { image.onload = null; image.onerror = null; });
      resolve();
    };
    const timer = setTimeout(finish, timeout);
    signal.addEventListener('abort', finish, { once: true });
    Promise.all(items.slice(0, 6).map(item => {
      const image = new environment.Image();
      images.push(image);
      image.src = item.cover;
      if (image.decode) return image.decode().catch(() => {});
      return new Promise(done => { image.onload = done; image.onerror = done; if (image.complete) done(); });
    })).then(finish);
  });
}

export function createCatalogTransition({ document, root, grid, environment = document.defaultView }) {
  let request = null, transition = null, animation = null, disposed = false;
  const clear = () => {
    root.removeAttribute('aria-busy');
    if (document.documentElement.dataset.commerceTransition === 'catalog') {
      delete document.documentElement.dataset.commerceTransition;
      document.documentElement.style.removeProperty('--catalog-direction');
    }
  };
  const cancel = () => {
    request?.abort(); request = null;
    transition?.skipTransition(); transition = null;
    animation?.cancel(); animation = null;
    clear();
  };
  return {
    async run({ prepare, update, animate = true, direction = 1 }) {
      cancel();
      if (disposed) return;
      const current = new AbortController(); request = current;
      const active = () => !disposed && request === current && !current.signal.aborted;
      root.setAttribute('aria-busy', 'true');
      const motion = animate && !environment.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        if (motion) await prepare?.(current.signal);
        if (!active()) return;
        const commit = () => active() ? update(current.signal) : undefined;
        if (motion && document.startViewTransition) {
          document.documentElement.dataset.commerceTransition = 'catalog';
          document.documentElement.style.setProperty('--catalog-direction', direction < 0 ? '-1' : '1');
          const next = document.startViewTransition(commit); transition = next;
          // Skipping a superseded animation rejects ready, not the update.
          next.ready.catch(() => {});
          await next.updateCallbackDone;
          await next.finished;
        } else {
          await commit();
          if (motion && active() && grid.animate) {
            animation = grid.animate([{ opacity: .5, transform: `translateY(8px)` }, { opacity: 1, transform: 'none' }], {
              duration: 260, easing: 'cubic-bezier(.16,1,.3,1)',
            });
            await animation.finished.catch(() => {});
          }
        }
      } finally {
        if (request === current) { request = null; transition = null; animation = null; clear(); }
      }
    },
    cancel,
    dispose() { disposed = true; cancel(); },
  };
}
