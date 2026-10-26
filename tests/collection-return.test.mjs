import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionReturnContext, rememberCollectionProduct, mountCollectionReturn } from '../src/collection-return.mjs';
import { renderPreview } from '../tools/preview.mjs';

test('return context accepts only recent same-origin collection-to-product navigation', () => {
  const time = 10000000;
  const context = { collection: 'https://shop.example/en/collections/runners?sort_by=title-ascending&page=2', product: 'https://shop.example/en/products/shoe', time };
  assert.equal(collectionReturnContext(context, context.product + '?variant=42', time + 1), context);
  for (const bad of [null, { ...context, collection: 'https://other.example/collections/all' },
    { ...context, product: 'https://other.example/en/products/shoe' }, { ...context, collection: 'https://shop.example/cart' },
    { ...context, time: time - 1800001 }, { ...context, time: time + 1 }]) {
    assert.equal(collectionReturnContext(bad, context.product, time), null);
  }
  assert.equal(collectionReturnContext(context, 'https://shop.example/en/products/other', time), null);
});

test('native product navigation preserves query, position and unrelated history state; return traverses instead of pushing a route', () => {
  const data = new Map(), collection = 'https://shop.example/collections/all?brand=Nike&sort=views&page=2';
  const history = { length: 3, state: { merchant: 'keep' }, replaceState(state) { this.state = state; }, back() { this.backs = (this.backs || 0) + 1; } };
  const environment = { location: { href: collection }, history, sessionStorage: { setItem: (k, v) => data.set(k, v), getItem: k => data.get(k) } };
  const checkpoint = { y: 2340, url: collection };
  rememberCollectionProduct(environment, '/products/shoe', checkpoint, 'shoe-1');
  assert.equal(history.state.merchant, 'keep');
  assert.deepEqual(history.state.strydeCollectionScroll, { ...checkpoint, focusProduct: 'shoe-1' });
  environment.location.href = 'https://shop.example/products/shoe'; history.state = {};
  const link = new EventTarget(); link.target = ''; link.href = '/collections/all';
  link.getAttribute = () => '/collections/all'; link.setAttribute = (_, v) => { link.href = v; };
  const root = { ownerDocument: { defaultView: environment, referrer: collection }, querySelectorAll: () => [link] };
  let dispose = mountCollectionReturn(root);
  assert.equal(link.href, collection);
  const click = new Event('click', { cancelable: true }); Object.defineProperty(click, 'button', { value: 0 }); link.dispatchEvent(click);
  assert(click.defaultPrevented); assert.equal(history.backs, 1);
  dispose();
  // A BFCache remount still reconnects, including when another product has
  // replaced the session's most recent context.
  data.clear(); root.ownerDocument.referrer = '';
  dispose = mountCollectionReturn(root);
  assert.equal(link.href, collection);
  const modified = new Event('click', { cancelable: true }); Object.defineProperties(modified, { button: { value: 0 }, ctrlKey: { value: true } }); link.dispatchEvent(modified);
  assert(!modified.defaultPrevented); assert.equal(history.backs, 1);
  dispose(); link.dispatchEvent(click); assert.equal(history.backs, 1);
});

test('photo product has usable Collection links without JavaScript and preserves native fixture forms', async () => {
  const photo = await renderPreview('/products/pair-0001');
  assert.equal((photo.match(/data-collection-return href="\/collections\/all"/g) || []).length, 2);
  assert.match(photo, /Back to Collection/);
  assert.doesNotMatch(photo, /class="studio-collection-return"[^>]*href=""/);
  const native = await renderPreview('/products/preview-product', new URLSearchParams('fixtures=1&variant=102'));
  assert.match(native, /data-collection-return href="\/collections\/all"/);
  assert.match(native, /action="\/cart\/add"/);
});
