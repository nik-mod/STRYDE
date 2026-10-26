import test from 'node:test';
import assert from 'node:assert/strict';
import { mountSiteIntro, shouldPlaySiteIntro, isInternalHomeReturn, markInternalHomeReturn, SITE_INTRO_RETURN_KEY } from '../src/motion/site-intro.mjs';
import { renderPreview } from '../tools/preview.mjs';
import { isHomeDocumentNavigation } from '../src/motion/navigation.mjs';

test('the intro is a separate homepage overlay and is absent from collection and product routes', async () => {
  const home = await renderPreview('/');
  assert.match(home, /data-site-intro role="dialog"[^>]* hidden/);
  assert.match(home, /data-hero-stage/);
  assert.doesNotMatch(home, /getItem\('stryde:intro-seen:v1'\)/, 'an old seen marker cannot suppress a fresh entry');
  assert.match(home, /removeItem\('stryde:intro-internal-return:v1'\)/, 'internal navigation intent is consumed once');
  assert(home.indexOf('data-site-intro role="dialog"') < home.indexOf('<main id="MainContent"'));
  for (const route of ['/collections/all', '/products/preview-product']) {
    const page = await renderPreview(route, new URLSearchParams('fixtures=1'));
    assert.doesNotMatch(page, /data-site-intro/);
    assert.doesNotMatch(page, /site-intro\.css/);
  }
});

test('the site introduction runs at entry and preserves restored visits, anchors, editor sessions and reduced motion', () => {
  assert.equal(shouldPlaySiteIntro(), true);
  for (const options of [{ internalReturn: true }, { reduced: true }, { designMode: true }, { hash: '#chapter-materials' }, { restoredY: 300 }, { navigationType: 'back_forward' }]) {
    assert.equal(shouldPlaySiteIntro(options), false);
  }
  assert.equal(shouldPlaySiteIntro({ navigationType: 'reload', restoredY: 0 }), true);
});

test('fresh entries and reloads play while internal returns consume a short-lived navigation intent', () => {
  const entry = { currentURL: 'https://stryde.test/', navigationType: 'navigate', now: 20000 };
  assert.equal(isInternalHomeReturn(entry), false);
  assert.equal(isInternalHomeReturn({ ...entry, referrer: 'https://another.test/' }), false);
  assert.equal(isInternalHomeReturn({ ...entry, referrer: 'https://stryde.test/collections/all' }), true);
  assert.equal(isInternalHomeReturn({ ...entry, navigationType: 'reload', referrer: 'https://stryde.test/collections/all' }), false);
  assert.equal(isInternalHomeReturn({ ...entry, marker: { path: '/', time: 19000 } }), true);
  assert.equal(isInternalHomeReturn({ ...entry, navigationType: 'reload', marker: { path: '/', time: 19000 } }), false);
  assert.equal(isInternalHomeReturn({ ...entry, marker: { path: '/', time: 1000 } }), false);
  assert.equal(isInternalHomeReturn({ ...entry, marker: { path: '/elsewhere', time: 19000 } }), false);
  const storage = new Map();
  const environment = { location: { href: entry.currentURL }, sessionStorage: { setItem: (key, value) => storage.set(key, value) } };
  markInternalHomeReturn(environment, '/');
  assert.equal(JSON.parse(storage.get(SITE_INTRO_RETURN_KEY)).path, '/');
  assert.doesNotThrow(() => markInternalHomeReturn({ ...environment, get sessionStorage() { throw new Error('Blocked'); } }, '/'));
});

test('same-document home anchors cannot leave an internal-return intent', () => {
  const home = 'https://stryde.test/';
  assert.equal(isHomeDocumentNavigation('#chapter-hero', home, home), false);
  assert.equal(isHomeDocumentNavigation('/#MainContent', home, home + '#chapter-brand'), false);
  assert.equal(isHomeDocumentNavigation('/?view=studio#MainContent', home, home + '?view=studio'), false);
  assert.equal(isHomeDocumentNavigation('/', home, 'https://stryde.test/collections/all'), true);
  assert.equal(isHomeDocumentNavigation('/?view=studio', home, home), true);
  assert.equal(isHomeDocumentNavigation('https://another.test/', home, home), false);
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
  const skipControl = new EventTarget();
  skipControl.focus = () => { document.activeElement = skipControl; };
  const root = {
    hidden: true,
    parentElement: { children: [] },
    querySelector: selector => selector === '[data-intro-skip]' ? skipControl : ({}),
    focus() { document.activeElement = root; },
    querySelectorAll: () => [{}, {}],
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key),
    contains: element => element === root || element === skipControl,
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
  return { controller, root, header, main, alreadyInert, document, classes, timers, attributes, skipControl,
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
  assert.equal(h.document.activeElement, h.skipControl);
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

test('the visible Skip control, Escape and watchdog all release the recovered film', () => {
  for (const exit of ['skip', 'escape', 'watchdog']) {
    const h = harness();
    if (exit === 'escape') {
      const event = new Event('keydown', { cancelable: true });
      Object.assign(event, { key: 'Escape' }); h.document.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
    } else if (exit === 'skip') h.skipControl.dispatchEvent(new Event('click'));
    else [...h.timers.values()][0]();
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
