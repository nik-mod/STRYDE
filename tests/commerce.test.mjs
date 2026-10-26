import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartClient, readCartResponse, fetchSections, CartError } from '../src/cart.mjs';
import { resolveVariant, valueAvailability, selectionFromVariant, normalizeVariants, relaxConflicts } from '../src/variant-picker.mjs';
import { selectVariant } from '../src/commerce.mjs';

const routes = { cartAdd: '/cart/add', cartChange: '/cart/change', cartFetch: '/cart.js' };
const cartOf = (count, total = count * 1000) => ({ item_count: count, total_price: total, items: [] });

test('variant matrix resolves full and partial footwear selections', () => {
  const variants = [
    { id: 1, available: true, options: ['Chalk', '40'] },
    { id: 2, available: true, options: ['Graphite', '40'] },
    { id: 3, available: false, options: ['Graphite', '42'] },
    { id: 4, available: true, options: ['Graphite', '41'] },
  ];
  assert.equal(resolveVariant(variants, ['Graphite', '40']).id, 2);
  assert.equal(resolveVariant(variants, ['Chalk', '41']), null, 'no chalk 41 exists');
  assert.equal(resolveVariant(variants, ['Graphite', null]).id, 2, 'partial selection resolves to the first completing variant');
  // Empty selections are wildcards: a default-variant product resolves, a
  // multi-option product would match its first variant, so callers seed the
  // selection from the preselected variant instead of passing [].
  assert.equal(resolveVariant([{ id: 7, available: true, options: [] }], []).id, 7);
  assert.equal(selectionFromVariant([{ name: 'Colour', position: 1, values: [] }, { name: 'Size', position: 2, values: [] }], variants[3]).join(','), 'Graphite,41');
  assert.deepEqual(normalizeVariants([{ id: 9, options: null }])[0].options, []);
});

test('value availability is computed per combination, not per option', () => {
  const variants = [
    { id: 1, available: true, options: ['Chalk', '40'] },
    { id: 2, available: false, options: ['Graphite', '40'] },
    { id: 3, available: true, options: ['Graphite', '41'] },
    { id: 4, available: false, options: ['Chalk', '39'] },
  ];
  // Size 40 from Graphite is sold out there but alive in Chalk — partial and
  // clickable rather than a dead end.
  assert.equal(valueAvailability(variants, 2, '40', ['Graphite', null]), 'partial');
  assert.equal(valueAvailability(variants, 2, '40', ['Chalk', null]), 'available');
  // Size 39 is sold out in every colour that carries it — fully disabled.
  assert.equal(valueAvailability(variants, 2, '39', [null, null]), 'unavailable');
  // Size 41 only exists in Graphite; from Chalk it is purchasable elsewhere,
  // so it stays clickable as a partial match instead of a dead end.
  assert.equal(valueAvailability(variants, 2, '41', ['Chalk', null]), 'partial');
  assert.equal(valueAvailability(variants, 2, '41', ['Graphite', null]), 'available');
  // Graphite from size 40: sold out at 40, alive at 41 — partial, clickable.
  assert.equal(valueAvailability(variants, 1, 'Graphite', [null, '40']), 'partial');
  assert.equal(valueAvailability(variants, 1, 'Sky', [null, null]), 'none');
  // Without other selections every existing value stays open.
  assert.equal(valueAvailability(variants, 1, 'Graphite', [null, null]), 'available');
});

test('picking a partial value relaxes only the conflicting selections', () => {
  const variants = [
    { id: 1, available: true, options: ['Chalk', '40'] },
    { id: 2, available: false, options: ['Graphite', '40'] },
    { id: 3, available: true, options: ['Graphite', '41'] },
  ];
  const selection = ['Chalk', '40'];
  selection[0] = 'Graphite';
  relaxConflicts(variants, selection, 1); // picked Graphite at position 1
  // Size 40 no longer leads anywhere in Graphite (40/Graphite is sold out).
  assert.deepEqual(selection, ['Graphite', null]);
  const selection2 = ['Chalk', '40'];
  // Pick Chalk again at position 1: size 40 still valid, stays selected.
  relaxConflicts(variants, selection2, 1);
  assert.deepEqual(selection2, ['Chalk', '40']);
});

test('legacy selectVariant lookup keeps ids and availability honest', () => {
  const variants = [{ id: 1, available: true }, { id: 2, available: false }];
  assert.equal(selectVariant(variants, '2').available, false);
  assert.equal(selectVariant(variants, 9), null);
});

test('cart responses map Shopify failures to typed errors', async () => {
  const soldOut = new Response(JSON.stringify({ status: 422, message: 'Sold out', description: 'All 42 gone' }), { status: 422 });
  await assert.rejects(readCartResponse(soldOut), error => {
    assert.equal(error.code, 'cart_unprocessable');
    assert.equal(error.message, 'All 42 gone');
    return true;
  });
  const notFound = new Response('[]', { status: 404 });
  await assert.rejects(readCartResponse(notFound), error => error.code === 'cart_not_found');
  const malformed = new Response(JSON.stringify({ nope: true }), { status: 200 });
  await assert.rejects(readCartResponse(malformed), error => error.code === 'cart_parse');
  const good = new Response(JSON.stringify(cartOf(2)), { status: 200 });
  assert.equal((await readCartResponse(good)).item_count, 2);
});

test('cart client rejects invalid input before any request', async () => {
  let requests = 0;
  const client = createCartClient({ routes, fetchImpl: async () => { requests += 1; return new Response(JSON.stringify(cartOf(0))); } });
  await assert.rejects(client.add({ id: undefined, quantity: 1 }), error => error.code === 'cart_invalid_input');
  await assert.rejects(client.add({ id: 101, quantity: 0 }), error => error.code === 'cart_invalid_input');
  await assert.rejects(client.change({ key: 'x' }), error => error.code === 'cart_invalid_input');
  await assert.rejects(client.change({ key: 'x', quantity: -1 }), error => error.code === 'cart_invalid_input');
  assert.equal(requests, 0);
});

test('concurrent mutations serialize and the last server response wins', async () => {
  const order = [];
  const fetchImpl = async (url, options) => {
    const started = order.length;
    order.push(`start:${url}:${options?.body ?? ''}`);
    await new Promise(resolve => setTimeout(resolve, url === '/cart/add' ? 25 : 5));
    order.push(`end:${started}`);
    return new Response(JSON.stringify(cartOf(url === '/cart/add' ? 1 : 5)));
  };
  const client = createCartClient({ routes, fetchImpl });
  const events = [];
  const target = new EventTarget();
  target.addEventListener('stryde:cart:change', event => events.push(event.detail.cart.item_count));
  const client2 = createCartClient({ routes, fetchImpl, target });

  const [added, changed] = [client2.add({ id: 101, quantity: 1 }), client2.change({ key: 'k', quantity: 5 })];
  await Promise.all([added, changed]);
  // The slow add must fully finish before the fast change starts: no interleaving.
  assert.match(order[0], /start:\/cart\/add/);
  assert.equal(order[1], 'end:0');
  assert.match(order[2], /start:\/cart\/change/);
  assert.equal(order[3], 'end:2', 'the change request only starts after the add settled');
  assert.equal(client2.getCart().item_count, 5, 'last response wins');
  assert.deepEqual(events, [1, 5], 'every mutation announces the authoritative cart');
});

test('a failed mutation resyncs from the server and surfaces the original error', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(`${options?.method || 'GET'} ${url}`);
    if (url === '/cart/change.js' || (url === '/cart/change' && options?.method === 'POST')) {
      return new Response(JSON.stringify({ message: 'Cannot add more' }), { status: 422 });
    }
    return new Response(JSON.stringify(cartOf(3)));
  };
  const client = createCartClient({ routes, fetchImpl });
  await assert.rejects(client.change({ key: 'k', quantity: 4 }), error => {
    assert.ok(error instanceof CartError);
    assert.equal(error.message, 'Cannot add more');
    return true;
  });
  assert.deepEqual(calls, ['POST /cart/change', 'GET /cart.js'], 'the client refetches the authoritative cart after a failure');
  assert.equal(client.getCart().item_count, 3);
});

test('fetchSections builds the section rendering request and validates the payload', async () => {
  const seen = [];
  const fetchImpl = async url => {
    seen.push(String(url));
    return new Response(JSON.stringify({ 'cart-drawer': '<div>bag</div>', 'main-cart': '<section>cart</section>' }));
  };
  const html = await fetchSections('/?x=1', ['cart-drawer', 'main-cart'], fetchImpl);
  assert.match(seen[0], /[?&]sections=cart-drawer%2Cmain-cart$/);
  assert.equal(html['cart-drawer'], '<div>bag</div>');
  await assert.rejects(
    fetchSections('/', ['missing-section'], async () => new Response(JSON.stringify({ 'other': '' }))),
    error => error.code === 'sections_parse',
  );
  await assert.rejects(
    fetchSections('/', ['cart-drawer'], async () => new Response('nope', { status: 500 })),
    error => error.code === 'sections_request',
  );
});

test('cart client refuses to construct without complete routes', () => {
  assert.equal(createCartClient({ routes: { cartAdd: '/cart/add' } }), null);
  assert.equal(createCartClient(), null);
});
