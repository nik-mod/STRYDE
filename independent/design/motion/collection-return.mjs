const RETURN_KEY = 'stryde:collection-return';
const MAX_AGE = 30 * 60 * 1000;

export function collectionReturnContext(context, currentURL, now = Date.now()) {
  try {
    const current = new URL(currentURL), collection = new URL(context.collection), product = new URL(context.product);
    if (collection.origin !== current.origin || product.origin !== current.origin ||
        !/^(\/[^/]+)?\/collections\//.test(collection.pathname) || product.pathname !== current.pathname ||
        !Number.isFinite(context.time) || now < context.time || now - context.time > MAX_AGE) return null;
    return context;
  } catch { return null; }
}

// Store context on the outgoing native history entry. Product URLs stay native;
// no product router, overlay or additional scroll controller is introduced.
export function rememberCollectionProduct(environment, product, checkpoint, productId) {
  try {
    const target = new URL(product, environment.location.href);
    if (target.origin !== new URL(environment.location.href).origin || !/\/products\//.test(target.pathname)) return;
    const time = Date.now(), entry = `${time.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const context = { collection: environment.location.href, product: target.href, entry, time };
    environment.history.replaceState({ ...environment.history.state, strydeCollectionEntry: entry, strydeOpeningProduct: target.href,
      strydeCollectionScroll: { ...checkpoint, focusProduct: productId } }, '');
    environment.sessionStorage.setItem(RETURN_KEY, JSON.stringify(context));
  } catch { /* Native links and browser history remain usable without storage. */ }
}

export function mountCollectionReturn(root) {
  const environment = root.ownerDocument?.defaultView;
  if (!environment) return () => {};
  const links = [...root.querySelectorAll('[data-collection-return]')];
  const abort = new AbortController();
  const originals = links.map(link => link.getAttribute('href'));
  const connect = () => {
    let context;
    try { context = collectionReturnContext(environment.history.state?.strydeProductReturn || JSON.parse(environment.sessionStorage.getItem(RETURN_KEY)), environment.location.href); } catch { return; }
    if (!context) return;
    const fromCollection = root.ownerDocument.referrer === context.collection.split('#')[0];
    const sameEntry = environment.history.state?.strydeProductReturn?.entry === context.entry;
    if (!fromCollection && !sameEntry) return;
    environment.history.replaceState({ ...environment.history.state, strydeProductReturn: context }, '');
    links.forEach(link => { link.href = context.collection; });
    return context;
  };
  const context = connect();
  if (context) links.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || environment.history.length < 2) return;
    // This product entry was reached directly from the saved collection entry.
    // Traversal preserves its Forward entry as well as page/filter/scroll state.
    event.preventDefault(); environment.history.back();
  }, { signal: abort.signal }));
  return () => { abort.abort(); links.forEach((link, index) => link.setAttribute('href', originals[index])); };
}
