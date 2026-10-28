import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../assets/commerce-transitions.js', import.meta.url), 'utf8');

function setup({ product = false, reduced = false, alternate = false } = {}) {
  const handlers = {}, names = new Map(), attributes = new Set(), classes = new Set(), styles = new Map();
  const image = { complete: true, naturalWidth: 1000, style: { set viewTransitionName(value) { names.set('media', value); }, removeProperty() { names.delete('media'); } },
    setAttribute: name => attributes.add(name), removeAttribute: name => attributes.delete(name), getBoundingClientRect: () => ({ top: 200, bottom: 600 }), closest() { return this; } };
  const card = { dataset: { openingView: alternate ? 'alternate' : 'cover' }, classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    querySelector(selector) { assert.equal(selector.includes('alternate'), alternate); return image; } };
  const root = { dataset: {}, style: { setProperty: (key, value) => styles.set(key, value), removeProperty: key => styles.delete(key) } };
  const document = { documentElement: root,
    querySelector(selector) { return product ? selector === '[data-product-section]' ? {} : image : null; },
    querySelectorAll(selector) {
      if (selector === '[data-product-open]') return [{ href: 'https://shop.example/products/shoe', closest: () => card }];
      if (selector === '[data-commerce-media]') return attributes.has('data-commerce-media') ? [image] : [];
      if (selector === '.is-opening') return classes.has('is-opening') ? [card] : [];
      return [];
    } };
  const history = { state: { strydeProductReturn: { collection: 'https://shop.example/collections/all?page=2' } } };
  const window = { navigation: { activation: null } };
  vm.runInNewContext(source, { document, history, window, innerHeight: 900, innerWidth: 1440, URL, matchMedia: () => ({ matches: reduced }), addEventListener: (name, fn) => { handlers[name] = fn; } });
  return { handlers, image, root, names, attributes, classes, window, styles, history };
}
function transition() {
  let finish;
  const finished = new Promise(resolve => { finish = resolve; });
  return { ready: Promise.resolve(), finished, finish, skipTransition() { this.skipped = true; } };
}
const entry = url => ({ url: `https://shop.example${url}` });

test('native collection/product snapshots are named only during navigation and cleaned after completion', async () => {
  const h = setup({ alternate: true }), effect = transition();
  h.handlers.pageswap({ viewTransition: effect, activation: { from: entry('/collections/all'), entry: entry('/products/shoe') } });
  assert.equal(h.root.dataset.commerceTransition, 'product'); assert.equal(h.names.get('media'), 'stryde-product-media');
  effect.finish(); await effect.finished;
  assert.equal(h.names.size, 0); assert.equal(h.attributes.size, 0); assert.equal(h.classes.size, 0); assert.equal(h.root.dataset.commerceTransition, undefined);
});

test('history traversal without a destination entry retains its saved collection return transition', async () => {
  const h = setup({ product: true }), effect = transition();
  h.handlers.pageswap({ viewTransition: effect, activation: { from: entry('/products/shoe'), navigationType: 'traverse' } });
  assert(!effect.skipped); assert.equal(h.names.get('media'), 'stryde-product-media');
  effect.finish(); await effect.finished;
});

test('native Shopify pagination uses a page dissolve with direction and no shared product snapshot', async () => {
  const h = setup(), effect = transition();
  h.handlers.pageswap({ viewTransition: effect, activation: { from: entry('/collections/all?page=2'), entry: entry('/collections/all') } });
  assert.equal(h.root.dataset.commerceTransition, 'catalog'); assert.equal(h.styles.get('--catalog-direction'), '-1');
  assert.equal(h.names.size, 0); effect.finish(); await effect.finished;
  assert.equal(h.styles.size, 0); assert.equal(h.root.dataset.commerceTransition, undefined);
});

test('return snapshot restores the saved viewport before deciding whether its selected card is visible', async () => {
  const h = setup(), effect = transition(); let y = 0;
  const url = 'https://shop.example/collections/all?page=2';
  h.window.location = { href: url };
  h.history.state.strydeCollectionScroll = { url, width: 1440, height: 900, reduced: false, y: 1400, time: Date.now() };
  h.window.scrollTo = options => { y = options.top; assert.equal(options.behavior, 'instant'); };
  h.image.getBoundingClientRect = () => ({ top: 1800 - y, bottom: 2200 - y });
  h.handlers.pagereveal({ viewTransition: effect });
  assert.equal(y, 0); // No activation: no speculative restoration.
  h.window.navigation.activation = { from: entry('/products/shoe'), entry: { url } };
  h.handlers.pagereveal({ viewTransition: effect });
  assert.equal(y, 1400); assert.equal(h.names.get('media'), 'stryde-product-media');
  effect.finish(); await effect.finished;
});

test('reduced motion, unrelated routes and unavailable images do not create a flying product layer', async () => {
  for (const reduced of [false, true]) {
    const h = setup({ reduced });
    const unrelated = transition();
    h.handlers.pageswap({ viewTransition: unrelated, activation: { from: entry('/collections/all'), entry: entry('/cart') } });
    assert(unrelated.skipped);
    const effect = transition(); h.image.complete = false;
    h.handlers.pageswap({ viewTransition: effect, activation: { from: entry('/collections/all'), entry: entry('/products/shoe') } });
    assert.equal(h.names.size, 0); assert.equal(Boolean(effect.skipped), reduced);
    effect.finish(); await effect.finished;
  }
});
