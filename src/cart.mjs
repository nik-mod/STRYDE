// Shopify Cart AJAX client. Every mutation is serialized through one queue so
// concurrent clicks (double add, quantity race) can never interleave requests,
// and the last server response always wins. Shopify stays the source of truth:
// this module only sends intents and reports what Shopify returned.

export class CartError extends Error {
  constructor(message, { status = 0, code = 'cart_request' } = {}) {
    super(message);
    this.name = 'CartError';
    this.status = status;
    this.code = code;
  }
}

// Shopify cart endpoints answer 4xx with {status, message, description?} on
// sold-out mid-session items, bad variant ids and quantity limits.
export async function readCartResponse(response) {
  let payload = null;
  try { payload = await response.json(); } catch { /* Non-JSON failures fall through with status alone. */ }
  if (!response.ok) {
    const description = payload && typeof payload === 'object' && (payload.description || payload.message || payload.status);
    const message = typeof description === 'string' && description.trim() ? description : `Cart request failed (${response.status || 'network'})`;
    const code = response.status === 422 ? 'cart_unprocessable' : response.status === 404 ? 'cart_not_found' : !response.status ? 'cart_network' : 'cart_request';
    throw new CartError(message, { status: response.status, code });
  }
  if (!payload || typeof payload.item_count !== 'number') throw new CartError('Cart response was not understood.', { code: 'cart_parse' });
  return payload;
}

export function createCartClient({ routes, fetchImpl = (...arguments_) => fetch(...arguments_), target = typeof document === 'undefined' ? null : document } = {}) {
  if (!routes || !routes.cartAdd || !routes.cartChange || !routes.cartFetch) return null;
  let queue = Promise.resolve();
  let cart = null;

  function run(operation) {
    // Serialize: each operation starts only after the previous settled, so a
    // rejected request can never strand a later one on stale line numbers.
    const settled = queue.then(operation, operation);
    queue = settled.then(() => {}, () => {});
    return settled;
  }

  async function send(url, body, method = 'POST') {
    const response = await fetchImpl(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const next = await readCartResponse(response);
    cart = next;
    target?.dispatchEvent(new CustomEvent('stryde:cart:change', { detail: { cart: next }, bubbles: true }));
    return next;
  }

  function recover(error) {
    // A failed mutation leaves the UI's line numbers suspect; resync silently
    // so listeners get the authoritative cart before the rejection surfaces.
    return run(async () => {
      try { await send(routes.cartFetch, undefined, 'GET'); } catch { /* Offline stays offline; the original error matters more. */ }
    }).then(() => { throw error; }, () => { throw error; });
  }

  return {
    getCart: () => cart,
    refresh: () => run(() => send(routes.cartFetch, undefined, 'GET').catch(async error => {
      if (error instanceof CartError && error.code !== 'cart_parse') throw error;
      throw error;
    })),
    add({ id, quantity = 1, properties } = {}) {
      if (!Number.isFinite(Number(id)) || Number(quantity) < 1) return Promise.reject(new CartError('Select a variant before adding to the bag.', { code: 'cart_invalid_input' }));
      return run(() => send(routes.cartAdd, { items: [{ id: Number(id), quantity: Math.floor(Number(quantity)), ...(properties ? { properties } : {}) }] }, 'POST')).catch(recover);
    },
    change({ key, quantity } = {}) {
      if (!key || !Number.isFinite(Number(quantity)) || Number(quantity) < 0) return Promise.reject(new CartError('The bag line could not be updated.', { code: 'cart_invalid_input' }));
      return run(() => send(routes.cartChange, { id: String(key), quantity: Math.floor(Number(quantity)) }, 'POST')).catch(recover);
    },
    mutate(url, body, method = 'POST') {
      return run(() => send(url, body, method)).catch(recover);
    },
  };
}

// Section Rendering API helper: /any-route?sections=a,b returns fresh HTML per
// section. This is how the drawer and the cart page re-render through Liquid,
// keeping every price, discount and translation server-formatted.
export async function fetchSections(url, sectionIds, fetchImpl = (...arguments_) => fetch(...arguments_)) {
  const request = new URL(url, typeof location === 'undefined' ? 'http://stryde.local/' : location.href);
  request.searchParams.set('sections', sectionIds.join(','));
  const response = await fetchImpl(request, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) throw new CartError(`Section rendering failed (${response.status}).`, { status: response.status, code: 'sections_request' });
  const payload = await response.json();
  const html = {};
  for (const id of sectionIds) {
    if (typeof payload[id] !== 'string') throw new CartError(`Section "${id}" was not returned.`, { code: 'sections_parse' });
    html[id] = payload[id];
  }
  return html;
}
