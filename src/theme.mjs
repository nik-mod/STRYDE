import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createProgressBus } from './motion/contracts.mjs';
import { mountProduct, mountRecommendations } from './commerce.mjs';
import { mountCartDrawer } from './cart-drawer.mjs';
import { mountCartPage } from './cart-page.mjs';
import { mountPredictiveSearch } from './predictive-search.mjs';
import { createScope, createScheduler, waitForIntroCompletion } from './motion/lifecycle.mjs';
import { mountHero } from './motion/hero.mjs';
import { mountChapter } from './motion/chapters.mjs';
import { mountHeader } from './motion/header.mjs';
import { mountEnvironments } from './motion/environments.mjs';
import { mountMagnetic } from './motion/magnetic.mjs';
import { mountListing } from './motion/listing.mjs';
import { mountNavigation } from './motion/navigation.mjs';
import { mountTriggerInspection } from './motion/inspection.mjs';
import { mountSiteIntro, shouldPlaySiteIntro } from './motion/site-intro.mjs';

gsap.registerPlugin(ScrollTrigger);
// All high-frequency work shares GSAP's clock. No second requestAnimationFrame loop.
let lenis = null;
const scheduler = createScheduler(gsap.ticker);
gsap.ticker.lagSmoothing(0);
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const instances = new Map();
const checkpointKey = () => `stryde:scroll-checkpoint:${location.pathname}${location.search}${location.hash}`;
let pageActive = true;
let exitScroll = null;
let reloadScroll = null;
try {
  if (['reload', 'back_forward'].includes(performance.getEntriesByType('navigation')[0]?.type)) {
    reloadScroll = history.state?.strydeCollectionScroll || JSON.parse(sessionStorage.getItem(checkpointKey()) || 'null');
  }
} catch { /* Storage may be unavailable; native restoration remains the fallback. */ }

function scrollCheckpoint() {
  return { y: scrollY, width: innerWidth, height: innerHeight, url: location.href, reduced: reduceQuery.matches, time: Date.now(),
    focusProduct: document.activeElement?.closest?.('[data-product-id]')?.dataset.productId || history.state?.strydeCollectionScroll?.focusProduct };
}

function restoreScroll(checkpoint) {
  if (!checkpoint || !Number.isFinite(checkpoint.y) || checkpoint.y < 0 || checkpoint.url !== location.href ||
      checkpoint.width !== innerWidth || checkpoint.height !== innerHeight || checkpoint.reduced !== reduceQuery.matches ||
      Date.now() - checkpoint.time > 1800000) return;
  // Pagehide cleanup removes pins and can clamp the browser's saved scroll.
  // Restore only a same-viewport reload/BFCache entry, after fonts and pins settle.
  document.fonts.ready.then(() => requestAnimationFrame(() => {
    if (!pageActive || checkpoint.url !== location.href) return;
    ScrollTrigger.refresh();
    if (lenis) { lenis.resize(); lenis.scrollTo(checkpoint.y, { immediate: true, force: true }); }
    else window.scrollTo({ top: checkpoint.y, behavior: 'instant' });
    ScrollTrigger.update();
    if (checkpoint.focusProduct) [...document.querySelectorAll('[data-product-id]')].find(card => card.dataset.productId === checkpoint.focusProduct)?.querySelector('[data-product-open]:not([aria-hidden="true"])')?.focus({ preventScroll: true });
  }));
}

function scrollToGallery(target) {
  ScrollTrigger.refresh();
  const clearance = (document.querySelector('.site-header')?.offsetHeight || 0) + (document.querySelector('.preview-notice')?.offsetHeight || 0) + 18;
  const y = Math.max(0, target.getBoundingClientRect().top + scrollY - clearance);
  if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); }
  else window.scrollTo({ top: y, behavior: 'instant' });
  ScrollTrigger.update();
}

function isModalOpen() { return [...document.querySelectorAll('dialog[open], [aria-modal="true"]:not([hidden]), [data-mobile-menu][open]')].some(element => element.matches('dialog') ? element.open : element.getClientRects().length > 0); }
function syncScroll() {
  if (reduceQuery.matches) { lenis?.destroy(); lenis = null; scheduler.setLenis(null); return; }
  if (!lenis) { lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, anchors: false, prevent: node => Boolean(node.closest('[data-lenis-prevent], dialog, [aria-modal="true"]')) }); lenis.on('scroll', ScrollTrigger.update); scheduler.setLenis(lenis); }
  if (isModalOpen()) lenis.stop(); else lenis.start();
}

function getComputedStyleValue(root, name, fallback) {
  const value = getComputedStyle(root).getPropertyValue(name).trim();
  return value || fallback;
}

function mountHeroSection(root) {
  const bus = createProgressBus();
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add({ motion: '(prefers-reduced-motion: no-preference)', mobile: '(max-width: 700px)', fine: '(hover: hover) and (pointer: fine)' }, ({ conditions }) => {
      if (!conditions.motion) return;
      const scope = createScope();
      scope.add(mountHero(root, { gsap, bus, mobile: conditions.mobile, hasModel: Boolean(root.dataset.modelUrl), fine: conditions.fine, surface: getComputedStyleValue(root, '--surface', '#effaff'), paper: getComputedStyleValue(root, '--paper', '#b7ddef') }));
      if (conditions.fine) {
        root.querySelectorAll('[data-magnetic]').forEach(element => scope.add(mountMagnetic(element, { gsap, signal: scope.signal })));
      }
      if (root.dataset.modelUrl) {
        const journey = root.dataset.modelYaw === '90' && document.querySelector('[data-chapter="materials"][data-tn-editorial]');
        const observer = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          observer.disconnect();
          scope.run(async signal => {
            // The shared Hero world is critical to the reveal. Prepare it
            // beneath the existing film; unrelated model viewers stay deferred.
            if (!journey && !await waitForIntroCompletion(document, signal)) return;
            const { mountScene } = journey ? { mountScene: (await import('./journey-scene.mjs')).mountJourneyScene } : await import('./scene.mjs');
            if (signal.aborted || reduceQuery.matches) return;
            return mountScene({ root, url: new URL(root.dataset.modelUrl, location.href).href, bus, scheduler, signal, gsap, ScrollTrigger });
          }).catch(error => {
            const status = root.querySelector('[data-model-status]');
            status.hidden = false; status.textContent = root.dataset.errorLabel;
            console.warn('[STRYDE] Scene bundle unavailable:', error.message);
          });
        }, { rootMargin: '200px' });
        // Restored scroll positions can start after the hero. Any visible
        // product chapter must be able to initialize the shared renderer.
        const observed = journey ? document.querySelectorAll('[data-hero], [data-chapter][data-tn-editorial], [data-chapter="technology"]') : [root];
        observed.forEach(element => observer.observe(element));
        return () => { observer.disconnect(); scope.dispose(); };
      }
      return () => scope.dispose();
    });
  }, root);
  return () => { media.revert(); context.revert(); bus.dispose(); };
}

function mountChapterSection(root) {
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add({ motion: '(prefers-reduced-motion: no-preference)', mobile: '(max-width: 700px)', materialsFlow: '(max-width: 1180px), (max-height: 640px)', portraitTablet: '(min-width: 701px) and (max-width: 1000px) and (orientation: portrait)', collectionFlow: '(max-width: 900px), (hover: none) and (pointer: coarse)', fine: '(hover: hover) and (pointer: fine)', ...(root.dataset.chapter === 'brand' ? { brandFit: '(min-height: 740px)' } : {}), ...(root.dataset.chapter === 'deconstruction' ? { anatomyFit: '(min-width: 1001px) and (min-height: 720px)' } : {}) }, ({ conditions }) => {
      if (!conditions.motion) return;
      const flow = root.dataset.chapter === 'collection' ? conditions.collectionFlow : root.dataset.chapter === 'materials' ? conditions.materialsFlow : conditions.mobile || (root.dataset.chapter === 'finale' && conditions.portraitTablet);
      return mountChapter(root, { gsap, mobile: flow, fine: conditions.fine });
    });
  }, root);
  return () => { media.revert(); context.revert(); };
}

let environmentDispose = null;
let progressTween = null;
function ensureEnvironments(scope) {
  if (environmentDispose) return;
  if (scope !== document && !scope.querySelector?.('[data-env]')) return;
  environmentDispose = mountEnvironments(scope === document ? document : scope, { scheduler });
}

function mount(scope = document) {
  ensureEnvironments(scope);
  const header = scope.matches?.('.site-header') ? scope : scope.querySelector?.('.site-header');
  if (header && !instances.has(header)) instances.set(header, mountHeader(header));
  const roots = [...scope.querySelectorAll('[data-hero], [data-chapter], [data-product-section], [data-listing-section], [data-cart-page], [data-recommendations-url], [data-predictive-root]')];
  if (scope.matches?.('[data-hero], [data-chapter], [data-product-section], [data-listing-section], [data-cart-page], [data-recommendations-url], [data-predictive-root]')) roots.push(scope);
  for (const root of roots) {
    if (instances.has(root)) continue;
    instances.set(root, root.matches('[data-hero]') ? mountHeroSection(root) : root.matches('[data-chapter]') ? mountChapterSection(root) : root.matches('[data-predictive-root]') ? mountPredictiveSearch(root) : root.matches('[data-listing-section]') ? mountListing(root, { captureScroll: scrollCheckpoint, restoreScroll, scrollToGallery }) : root.matches('[data-cart-page]') ? mountCartPage(root) : root.matches('[data-recommendations-url]') ? mountRecommendations(root) : mountProduct(root));
  }
  ScrollTrigger.refresh();
  const progress = document.querySelector('[data-story-progress]');
  if (progress && !progressTween) progressTween = gsap.fromTo(progress, { scaleX: 0 }, {
    scaleX: 1, ease: 'none', scrollTrigger: { id: 'story-progress', trigger: '#MainContent', start: 'top top', endTrigger: document.querySelector('[data-signature-footer]') || '#MainContent', end: 'bottom bottom', scrub: true },
  });
}
function unmount(scope) { for (const [root, dispose] of instances) if (scope === root || scope.contains(root)) { dispose(); instances.delete(root); } }
const siteIntro = mountSiteIntro({
  gsap, document, environment: window, onChange: () => { syncScroll(); ScrollTrigger.refresh(); },
  skip: !shouldPlaySiteIntro({ reduced: reduceQuery.matches, restoredY: reloadScroll?.y || window.scrollY, hash: location.hash, navigationType: performance.getEntriesByType('navigation')[0]?.type }),
});
syncScroll();
let disposeCartDrawer = mountCartDrawer({ document });
mount();
let disposeNavigation = mountNavigation({ document, getScroller: () => lenis, onMenuChange: syncScroll });
let disposeInspection = mountTriggerInspection({ ScrollTrigger, scheduler, document, location });
document.addEventListener('shopify:section:load', event => { mount(event.target); syncScroll(); });
document.addEventListener('shopify:section:unload', event => { unmount(event.target); syncScroll(); ScrollTrigger.refresh(); });
reduceQuery.addEventListener('change', () => { siteIntro.finish(); syncScroll(); unmount(document); mount(); });
const modalObserver = new MutationObserver(syncScroll);
modalObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open', 'aria-modal', 'hidden'] });
document.addEventListener('visibilitychange', () => { if (document.hidden) lenis?.stop(); else syncScroll(); });
window.addEventListener('pagehide', () => {
  // A cross-document media transition can change the outgoing scroll before
  // pagehide. Keep the collection position captured at product activation.
  exitScroll = history.state?.strydeOpeningProduct && history.state.strydeCollectionScroll?.url === location.href
    ? history.state.strydeCollectionScroll : scrollCheckpoint();
  try {
    sessionStorage.setItem(checkpointKey(), JSON.stringify(exitScroll));
    if (document.querySelector('[data-listing-section]')) history.replaceState({ ...history.state, strydeCollectionScroll: exitScroll }, '');
  } catch { /* Optional restoration only. */ }
  pageActive = false;
  siteIntro.dispose();
  disposeInspection();
  progressTween?.scrollTrigger?.kill(); progressTween?.revert(); progressTween = null;
  disposeNavigation();
  disposeCartDrawer();
  unmount(document); environmentDispose?.(); environmentDispose = null; lenis?.destroy(); lenis = null; scheduler.setLenis(null); modalObserver.disconnect();
});
window.addEventListener('pageshow', event => {
  pageActive = true;
  if (history.state?.strydeOpeningProduct) history.replaceState({ ...history.state, strydeOpeningProduct: null }, '');
  if (event.persisted) { syncScroll(); disposeCartDrawer = mountCartDrawer({ document }); mount(); disposeNavigation = mountNavigation({ document, getScroller: () => lenis, onMenuChange: syncScroll }); disposeInspection = mountTriggerInspection({ ScrollTrigger, scheduler, document, location }); modalObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open', 'aria-modal', 'hidden'] }); }
  restoreScroll(event.persisted ? exitScroll : reloadScroll);
  reloadScroll = null;
});
