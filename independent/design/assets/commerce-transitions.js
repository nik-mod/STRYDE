// Registered before first paint, including BFCache activation. Native document
// navigation and history remain the owners; this only names their snapshots.
(() => {
  const root = document.documentElement;
  const clear = () => {
    document.querySelectorAll('[data-commerce-media]').forEach(image => {
      image.style.removeProperty('view-transition-name'); image.removeAttribute('data-commerce-media');
    });
    document.querySelectorAll('.is-opening').forEach(card => { card.classList.remove('is-opening'); delete card.dataset.openingView; });
    if (root.dataset.commerceTransition === 'product') delete root.dataset.commerceTransition;
  };
  const configure = (event, activation) => {
    const transition = event.viewTransition;
    if (!transition) return;
    const from = activation?.from?.url;
    // Some engines expose no destination entry for a history traversal. The
    // validated native return context still identifies this collection entry.
    const to = activation?.entry?.url || (activation?.navigationType === 'traverse' ? history.state?.strydeProductReturn?.collection : null);
    const collection = url => /\/(?:collections)\/[^/]+\/?$/.test(new URL(url).pathname);
    const product = url => /\/products\/[^/]+\/?$/.test(new URL(url).pathname);
    const listing = from && to && collection(from) && collection(to) && new URL(from).pathname === new URL(to).pathname;
    if (!from || !to || matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !(listing || (collection(from) && product(to)) || (product(from) && collection(to)))) {
      transition.skipTransition(); return;
    }
    document.querySelectorAll('[data-commerce-media]').forEach(image => image.style.removeProperty('view-transition-name'));
    root.dataset.commerceTransition = listing ? 'catalog' : 'product';
    if (listing) {
      const backwards = Number(new URL(to).searchParams.get('page') || 1) < Number(new URL(from).searchParams.get('page') || 1);
      root.style.setProperty('--catalog-direction', backwards ? '-1' : '1');
      transition.ready.catch(() => {});
      transition.finished.then(() => {
        if (root.dataset.commerceTransition === 'catalog') { delete root.dataset.commerceTransition; root.style.removeProperty('--catalog-direction'); }
      });
      return;
    }
    // The incoming snapshot precedes the theme's asynchronous scroll restore.
    // Restore this collection entry now so its selected card is already in the
    // viewport when named, rather than dissolving a large shoe over a second one.
    if (product(from) && window.location && collection(window.location.href)) {
      const saved = history.state?.strydeCollectionScroll;
      if (saved?.url === window.location.href && saved.width === innerWidth && saved.height === innerHeight &&
          saved.reduced === false && Number.isFinite(saved.y) && saved.y >= 0 &&
          Number.isFinite(saved.time) && Date.now() - saved.time >= 0 && Date.now() - saved.time < 1800000) {
        window.scrollTo({ top: saved.y, behavior: 'instant' });
      }
    }
    let image;
    if (document.querySelector('[data-product-section]')) image = document.querySelector('[data-gallery-image]');
    else {
      const path = new URL(product(to) ? to : from).pathname;
      const link = [...document.querySelectorAll('[data-product-open]')].find(link => new URL(link.href).pathname === path);
      const card = link?.closest('[data-product-id], .product-card');
      card?.classList.add('is-opening');
      image = card?.querySelector(card.dataset.openingView === 'alternate' ? '.photo-shop-alternate, .product-card-alternate' : '[data-product-cover], .product-card-cover');
    }
    const frame = image?.closest('[data-product-transition-frame], .product-card-media') || image;
    const rect = frame?.getBoundingClientRect();
    // A missing, offscreen or undecoded view gets a quiet page dissolve instead
    // of stretching a blank photograph or flying a shoe across the whole page.
    if (image?.complete && image.naturalWidth && rect.bottom > 0 && rect.top < innerHeight) {
      frame.setAttribute('data-commerce-media', '');
      frame.style.viewTransitionName = 'stryde-product-media';
    }
    transition.ready.catch(() => {});
    transition.finished.then(clear, clear);
  };
  addEventListener('pageswap', event => configure(event, event.activation));
  addEventListener('pagereveal', event => configure(event, window.navigation?.activation));
})();
