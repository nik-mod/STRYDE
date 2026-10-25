import test from 'node:test';
import assert from 'node:assert/strict';
import { mountSiteIntro, shouldPlaySiteIntro } from '../src/motion/site-intro.mjs';
import { renderPreview } from '../tools/preview.mjs';

test('the intro is a separate homepage overlay and is absent from collection and product routes', async () => {
  const home = await renderPreview('/');
  assert.match(home, /data-site-intro role="dialog"[^>]* hidden/);
  assert.match(home, /data-hero-stage/);
  assert(home.indexOf('data-site-intro role="dialog"') < home.indexOf('<main id="MainContent"'));
  for (const route of ['/collections/all', '/products/preview-product']) {
    const page = await renderPreview(route, new URLSearchParams('fixtures=1'));
    assert.doesNotMatch(page, /data-site-intro/);
    assert.doesNotMatch(page, /site-intro\.css/);
  }
});

test('the site introduction runs at entry and preserves restored visits, anchors, editor sessions and reduced motion', () => {
  assert.equal(shouldPlaySiteIntro(), true);
  for (const options of [{ reduced: true }, { designMode: true }, { hash: '#chapter-materials' }, { restoredY: 300 }, { navigationType: 'back_forward' }]) {
    assert.equal(shouldPlaySiteIntro(options), false);
  }
  assert.equal(shouldPlaySiteIntro({ navigationType: 'reload', restoredY: 0 }), true);
});

function harness({ skip = false, broken = false } = {}) {
  const document = new EventTarget();
  const classes = new Set(['site-intro-pending']);
  document.documentElement = { classList: {
    contains: name => classes.has(name),
    add: (...names) => names.forEach(name => classes.add(name)),
    remove: (...names) => names.forEach(name => classes.delete(name)),
  } };
  const main = { inert: false, focus() { document.activeElement = main; } };
  const header = { inert: false };
  const alreadyInert = { inert: true };
  document.body = {}; document.activeElement = document.body;
  const attributes = new Map();
  const root = {
    hidden: true,
    parentElement: { children: [] },
    querySelector: () => ({}),
    focus() { document.activeElement = root; },
    querySelectorAll: () => [{}, {}],
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key),
    contains: element => element === root,
  };
  root.parentElement.children = [root, header, main, alreadyInert];
  document.querySelector = selector => selector === '[data-site-intro]' ? root : selector === '#MainContent' ? main : null;
  const timers = new Map(); let nextTimer = 0, changes = 0, kills = 0, completion;
  const environment = {
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  };
  const timeline = { fromTo() { return this; }, to() { return this; }, play() {}, kill() { kills++; } };
  const gsap = { timeline(options) { if (broken) throw new Error('Unavailable animation engine'); completion = options.onComplete; return timeline; } };
  const controller = mountSiteIntro({ gsap, document, environment, skip, onChange() { changes++; } });
  return { controller, root, header, main, alreadyInert, document, classes, timers, attributes,
    complete() { completion(); }, changes: () => changes, kills: () => kills };
}

test('completion reveals the homepage, restores existing inert states and releases all listeners and timers', () => {
  const h = harness();
  assert.equal(h.root.hidden, false);
  assert.equal(h.header.inert, true);
  assert.equal(h.main.inert, true);
  assert.equal(h.document.activeElement, h.root);
  assert.equal(h.attributes.get('aria-modal'), 'true');
  const tab = new Event('keydown', { cancelable: true });
  Object.assign(tab, { key: 'Tab' }); h.document.dispatchEvent(tab);
  assert.equal(tab.defaultPrevented, true);
  assert.equal(h.document.activeElement, h.root);
  h.complete();
  assert.equal(h.root.hidden, true);
  assert.equal(h.header.inert, false);
  assert.equal(h.main.inert, false);
  assert.equal(h.alreadyInert.inert, true);
  assert.equal(h.document.activeElement, h.main);
  assert.equal(h.timers.size, 0);
  assert.equal(h.classes.size, 0);
  h.controller.dispose();
  assert.equal(h.changes(), 1);
  assert.equal(h.kills(), 1);
});

test('Escape and the watchdog release the intro without visible controls', () => {
  for (const exit of ['escape', 'watchdog']) {
    const h = harness();
    if (exit === 'escape') {
      const event = new Event('keydown', { cancelable: true });
      Object.assign(event, { key: 'Escape' }); h.document.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
    } else [...h.timers.values()][0]();
    assert.equal(h.root.hidden, true, exit);
    assert.equal(h.main.inert, false, exit);
    assert.equal(h.timers.size, 0, exit);
    assert.equal(h.changes(), 1, exit);
  }
});

test('skipped or failed introductions cannot leave the homepage locked', () => {
  for (const options of [{ skip: true }, { broken: true }]) {
    const h = harness(options);
    assert.equal(h.root.hidden, true);
    assert.equal(h.main.inert, false);
    assert.equal(h.header.inert, false);
    assert.equal(h.classes.size, 0);
    assert.equal(h.timers.size, 0);
  }
});

test('page teardown releases the overlay without moving focus to a departing document', () => {
  const h = harness();
  h.controller.dispose();
  assert.equal(h.document.activeElement, h.root);
  assert.equal(h.main.inert, false);
  assert.equal(h.root.hidden, true);
  assert.equal(h.timers.size, 0);
});
