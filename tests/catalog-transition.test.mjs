import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogTransition, prepareCatalogImages } from '../src/catalog-transition.mjs';

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function harness({ reduced = false, native = false } = {}) {
  const root = { attributes: new Map(), setAttribute(k, v) { this.attributes.set(k, v); }, removeAttribute(k) { this.attributes.delete(k); } };
  const styles = new Map();
  const document = { documentElement: { dataset: {}, style: { setProperty: (k, v) => styles.set(k, v), removeProperty: k => styles.delete(k) } } };
  const effects = [];
  const grid = { animate(frames, timing) {
    const finished = deferred();
    const effect = { frames, timing, finished: finished.promise, cancel() { finished.resolve(); }, finish: finished.resolve };
    effects.push(effect); return effect;
  } };
  const transitions = [];
  if (native) document.startViewTransition = update => {
    const finish = deferred();
    const transition = { ready: Promise.resolve(), updateCallbackDone: Promise.resolve().then(update), finished: finish.promise,
      skipTransition() { this.skipped = true; finish.resolve(); }, finish: finish.resolve };
    transitions.push(transition); return transition;
  };
  const environment = { matchMedia: () => ({ matches: reduced }) };
  return { controller: createCatalogTransition({ document, environment, root, grid }), root, document, effects, transitions, styles };
}

test('a superseded or disposed image preparation cannot replace the current catalog or clear its busy state', async () => {
  const h = harness({ reduced: false });
  const old = deferred(), latest = deferred(), commits = [];
  const first = h.controller.run({ prepare: () => old.promise, update: () => commits.push('old') });
  const second = h.controller.run({ prepare: () => latest.promise, update: () => commits.push('latest') });
  old.resolve(); await first;
  assert(h.root.attributes.has('aria-busy')); assert.deepEqual(commits, []);
  latest.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(commits, ['latest']);
  h.effects[0].finish(); await second;
  assert(!h.root.attributes.has('aria-busy'));
  const pending = deferred();
  const last = h.controller.run({ prepare: () => pending.promise, update: () => commits.push('disposed') });
  h.controller.dispose(); pending.resolve(); await last;
  assert.deepEqual(commits, ['latest']);
});

test('native page transitions commit once, reverse direction, and release snapshots when interrupted', async () => {
  const h = harness({ native: true }); const commits = [];
  const first = h.controller.run({ update: () => commits.push(2), direction: 1 });
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(commits, [2]); assert.equal(h.document.documentElement.dataset.commerceTransition, 'catalog');
  const second = h.controller.run({ update: () => commits.push(1), direction: -1 });
  await Promise.resolve(); await Promise.resolve();
  assert(h.transitions[0].skipped); assert.deepEqual(commits, [2, 1]);
  assert.equal(h.styles.get('--catalog-direction'), '-1');
  await first; assert(h.root.attributes.has('aria-busy'));
  h.transitions[1].finish(); await second;
  assert(!h.root.attributes.has('aria-busy')); assert.equal(h.document.documentElement.dataset.commerceTransition, undefined);
  assert.equal(h.styles.size, 0);
});

test('reduced motion and history restoration commit immediately without image delays or animation', async () => {
  for (const [reduced, animate] of [[true, true], [false, false]]) {
    const h = harness({ reduced, native: true }); let commits = 0;
    await h.controller.run({ animate, prepare: () => assert.fail('must not delay history or reduced motion'), update: () => commits++ });
    assert.equal(commits, 1); assert.equal(h.transitions.length, 0); assert.equal(h.effects.length, 0);
  }
});

test('photograph preparation is bounded and handles failed, stalled and aborted images', async () => {
  let count = 0;
  class FailedImage { constructor() { count++; } decode() { return Promise.reject(new Error('missing')); } }
  await prepareCatalogImages(Array.from({ length: 12 }, () => ({ cover: '/shoe.webp' })), { Image: FailedImage }, new AbortController().signal);
  assert.equal(count, 6);
  class StalledImage { decode() { return new Promise(() => {}); } }
  await prepareCatalogImages([{ cover: '/slow.webp' }], { Image: StalledImage }, new AbortController().signal, 5);
  const abort = new AbortController();
  const pending = prepareCatalogImages([{ cover: '/slow.webp' }], { Image: StalledImage }, abort.signal, 10000);
  abort.abort(); await pending;
});
