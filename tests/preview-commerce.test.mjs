import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPreview, createPreviewServer, resetMockCart } from '../tools/preview.mjs';
import { readFile } from 'node:fs/promises';

test('preview mock cart serves the Shopify cart API shape with honest failures', async () => {
  const server = createPreviewServer().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    resetMockCart();
    let cart = await (await fetch(`${base}/cart.js`)).json();
    assert.equal(cart.item_count, 0);
    assert.equal(cart.token, 'dev-mock-cart');

    const add = await fetch(`${base}/cart/add.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: 102, quantity: 2 }] }) });
    assert.equal(add.status, 200);
    cart = await add.json();
    assert.equal(cart.item_count, 2);
    assert.equal(cart.items[0].key, 'dev-102');
    assert.equal(cart.total_price, 39000);

    const soldOut = await fetch(`${base}/cart/add.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: 103, quantity: 1 }] }) });
    assert.equal(soldOut.status, 422);
    assert.match((await soldOut.json()).message, /sold out/i);

    const change = await fetch(`${base}/cart/change.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'dev-102', quantity: 0 }) });
    cart = await change.json();
    assert.equal(cart.item_count, 0, 'quantity zero removes the line');
    const missing = await fetch(`${base}/cart/change.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'missing', quantity: 1 }) });
    assert.equal(missing.status, 422);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});

test('section rendering returns the drawer against the live mock cart', async () => {
  const sections = JSON.parse(await renderPreview('/cart', new URLSearchParams('sections=cart-drawer&fixtures=1')));
  assert.ok(sections['cart-drawer'].includes('data-cart-drawer-content'));
  assert.match(sections['cart-drawer'], /data-cart-count>1</);
  assert.match(sections['cart-drawer'], /Preview fixture \/ Footwear/);
  assert.match(sections['cart-drawer'], /data-cart-checkout/);
});

test('storefront pages carry the drawer, config routes and honest preview labels', async () => {
  const html = await renderPreview('/', new URLSearchParams('fixtures=1'));
  assert.match(html, /<dialog class="cart-drawer" data-cart-drawer/);
  assert.match(html, /data-lenis-prevent/);
  assert.match(html, /"cartAdd":"\/cart\/add\.js"/);
  assert.match(html, /"cartChange":"\/cart\/change\.js"/);
  assert.match(html, /"checkout":"\/checkout"/);
  assert.match(html, /SIMULATED COMMERCE/);
  assert.match(html, /rel="preload"[^>]+archivo-var\.woff2[^>]+as="font"[^>]+type="font\/woff2"[^>]+crossorigin/);
  assert.doesNotMatch(html, /api\.|secret|token=|password/i);
  // No third-party gateway or card collection anywhere in the preview output.
  assert.doesNotMatch(html, /<input[^>]+card|stripe|paypal|flitt/i);
});

test('product page stages the option picker with per-combination availability data', async () => {
  const html = await renderPreview('/products/preview-product', new URLSearchParams('image=1'));
  assert.match(html, /data-variant-picker/);
  assert.match(html, /variant-group-size/);
  assert.match(html, /variant-group-color/);
  const data = JSON.parse(html.match(/<script type="application\/json" data-product-variants>([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.options.length, 2);
  assert.equal(data.options[1].name, 'Size');
  assert.deepEqual(data.variants.map(variant => variant.options[1]), ['40', '41', '42']);
  assert.equal(data.selected, 101);
  // Native select stays the submitted input and the no-JS path.
  assert.match(html, /<select[^>]+name="id" data-variant-select>/);
  assert.match(html, /<noscript><form/);
  // Sticky purchase bar and gallery a11y.
  assert.match(html, /data-sticky-purchase/);
  assert.match(html, /aria-label="[^"]*photography"/);
});

test('cart page keeps native fallback controls alongside AJAX wiring', async () => {
  const html = await renderPreview('/cart', new URLSearchParams('fixtures=1'));
  assert.match(html, /data-cart-page/);
  assert.match(html, /data-quantity-input/);
  assert.match(html, /data-cart-remove/);
  assert.match(html, /name="updates\[\]"/);
  assert.match(html, /name="checkout"/);
  assert.match(html, /data-line-key="dev-101"/);
  assert.match(html, /aria-live="polite"/);
});

test('theme checkout path is a Shopify-hosted link, never a custom payment form', async () => {
  const html = await renderPreview('/cart', new URLSearchParams('fixtures=1'));
  assert.match(html, /href="\/checkout"/);
  assert.doesNotMatch(html, /action="https?:\/\/(?!localhost)[^"]*"/, 'no external form endpoints');
  assert.doesNotMatch(html, /name="card|cvv|expiry/i);
  const drawer = await renderPreview('/', new URLSearchParams('sections=cart-drawer'));
  assert.match(drawer, /NO ORDER IS CREATED/, 'dev checkout states its limits');
});

test('Georgian locale mirrors every English key', async () => {
  const en = JSON.parse(await readFile('locales/en.default.json', 'utf8'));
  const ka = JSON.parse(await readFile('locales/ka.json', 'utf8'));
  const keysOf = (node, prefix = '') => Object.entries(node).flatMap(([key, value]) => typeof value === 'object' && value !== null ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`]);
  const enKeys = keysOf(en).sort();
  const kaKeys = new Set(keysOf(ka));
  const missing = enKeys.filter(key => !kaKeys.has(key));
  assert.deepEqual(missing, [], `ka.json is missing: ${missing.join(', ')}`);
  assert.equal(keysOf(ka).length, enKeys.length, 'ka.json adds no unknown keys');
});
