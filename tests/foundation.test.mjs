import test from 'node:test';
import assert from 'node:assert/strict';
import { heroPose, heroPhase, HERO_PHASES, chapterState, createProgressBus } from '../src/motion/contracts.mjs';
import { createScope, createScheduler } from '../src/motion/lifecycle.mjs';
import { selectVariant } from '../src/commerce.mjs';
import { renderPreview } from '../tools/preview.mjs';

test('chapter boundaries normalize to one continuous reversible eight-chapter range', () => {
  assert.equal(chapterState(0, -2).global, 0); assert.equal(chapterState(7, 2).global, 1);
  for (let chapter = 0; chapter < 7; chapter++) assert.equal(chapterState(chapter, 1).global, chapterState(chapter + 1, 0).global);
  assert.deepEqual(heroPose(.5), heroPose(.5));
  const forward = [0, .2, .7, 1].map(heroPose); const backward = [1, .7, .2, 0].map(heroPose).reverse();
  assert.deepEqual(forward, backward); assert.equal(chapterState(2, .5, -20).direction, -1);
});

test('progress observers are detachable and disposal prevents later delivery', () => {
  const bus = createProgressBus(); let events = 0;
  const unsubscribe = bus.subscribe(() => events++); bus.publish(chapterState(0, .5)); unsubscribe(); bus.publish(chapterState(1, .5));
  assert.equal(events, 2); assert.equal(bus.subscriberCount, 0);
  bus.subscribe(() => events++); bus.dispose(); bus.publish(chapterState(3, 1)); assert.equal(events, 3);
});

test('section or media cleanup cancels pending initialization and disposes a late resource once', async () => {
  const scope = createScope(); let resolveResource; let resourceSignal; let disposed = 0;
  const pending = scope.run(signal => { resourceSignal = signal; return new Promise(resolve => { resolveResource = resolve; }); });
  scope.dispose(); assert.equal(resourceSignal.aborted, true); resolveResource(() => disposed++); await pending;
  scope.dispose(); assert.equal(disposed, 1);
});

test('an unloaded section does not retain a ready resource', async () => {
  const scope = createScope(); let disposed = 0;
  await scope.run(async () => () => disposed++); scope.dispose(); scope.dispose(); assert.equal(disposed, 1);
});

test('one ticker synchronizes Lenis and scene callbacks and detaches when motion is disabled', () => {
  const callbacks = new Set(); const ticker = { add: callback => callbacks.add(callback), remove: callback => callbacks.delete(callback) };
  const scheduler = createScheduler(ticker); let time; let rendered = 0;
  assert.equal(callbacks.size, 0); scheduler.setLenis({ raf: value => { time = value; } });
  const remove = scheduler.add(() => rendered++); assert.equal(callbacks.size, 1);
  for (const callback of callbacks) callback(.25);
  assert.equal(time, 250); assert.equal(rendered, 1);
  scheduler.setLenis(null); assert.equal(callbacks.size, 1); remove(); assert.equal(callbacks.size, 0); scheduler.dispose();
});

test('variant lookup never substitutes an unavailable or unknown ID', () => {
  const variants = [{ id: 1, available: true }, { id: 2, available: false }];
  assert.equal(selectVariant(variants, '2').available, false); assert.equal(selectVariant(variants, 9), null);
});

test('same-Liquid product rendering binds sold-out deep links, price and native variant selection', async () => {
  const soldOut = await renderPreview('/products/preview-product', new URLSearchParams('variant=103'));
  assert.match(soldOut, /data-add-to-cart disabled/); assert.match(soldOut, /value="103" selected disabled/); assert.match(soldOut, /\$195\.00 USD/);
  assert.match(soldOut, /<noscript><form action="\/products\/preview-product" method="get"/); assert.match(soldOut, /name="variant"/);
  const available = await renderPreview('/products/preview-product', new URLSearchParams('variant=102'));
  assert.match(available, /value="102" selected/); assert.match(available, /\$220\.00 USD/); assert.doesNotMatch(available, /data-add-to-cart disabled/);
});

test('home stages the eight cinematic chapters with honest temporary assets', async () => {
  const html = await renderPreview('/');
  assert.match(html, /data-hero/);
  for (const chapter of ['deconstruction', 'materials', 'technology', 'collection', 'featured', 'brand', 'finale']) {
    assert.match(html, new RegExp(`data-chapter="${chapter}"`));
  }
  assert.match(html, /Concept artwork/); assert.match(html, /STRYDE ONE/);
  assert.match(html, /LOCAL PREVIEW/); assert.match(html, /\/assets\/theme\.js/);
  assert.match(html, /stryde-concept-v2\.png/); assert.match(html, /href="\/account"/);
  assert.doesNotMatch(html, /data-model-url=/); assert.doesNotMatch(html, /\$180|\$195/); assert.doesNotMatch(html, /name="add"/);
});

test('native empty routes render useful content and fixture commerce stays labeled', async () => {
  assert.match(await renderPreview('/cart'), /Your bag is empty/);
  assert.match(await renderPreview('/collections/all', new URLSearchParams('concepts=0')), /No products found/);
  assert.match(await renderPreview('/search', new URLSearchParams('q=test')), /No results/);
  const fixture = await renderPreview('/cart', new URLSearchParams('fixtures=1'));
  assert.match(fixture, /name="updates\[\]"/); assert.match(fixture, /name="checkout"/); assert.match(fixture, /COMMERCE DISABLED/);
});

test('hero product title, selected price and native add-to-cart use the selected Shopify product', async () => {
  const available = await renderPreview('/', new URLSearchParams('fixtures=1&variant=102'));
  assert.match(available, /Preview fixture \/ Footwear/); assert.match(available, /\$195\.00 USD/);
  assert.match(available, /name="add"/); assert.match(available, /Concept artwork/);
  assert.doesNotMatch(available, /STRYDE ONE/);
  const soldOut = await renderPreview('/', new URLSearchParams('fixtures=1&variant=103'));
  assert.match(soldOut, /Sold out/); assert.match(soldOut, /name="add" disabled/);
});

test('a configured hero image or model URL replaces the hero concept artwork', async () => {
  const image = await renderPreview('/', new URLSearchParams('fixtures=1&image=1'));
  assert.match(image, /preview-fixture\.svg/); assert.match(image, /class="hero-image"/);
  const model = await renderPreview('/', new URLSearchParams('model=/licensed-test.glb'));
  assert.match(model, /data-model-url="\/licensed-test\.glb"/);
  assert.match(model, /Product imagery not provided/);
  assert.match(model, /stryde-concept-v2\.png/); // later chapters still use labeled concept art
});
