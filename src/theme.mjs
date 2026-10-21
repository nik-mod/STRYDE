import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createProgressBus } from './motion/contracts.mjs';
import { mountProduct } from './commerce.mjs';
import { createScope, createScheduler } from './motion/lifecycle.mjs';
import { createFoundationStudy } from './motion/foundation-study.mjs';
import { mountMagnetic } from './motion/magnetic.mjs';

gsap.registerPlugin(ScrollTrigger);
// All high-frequency work shares GSAP's clock. No second requestAnimationFrame loop.
let lenis = null;
const scheduler = createScheduler(gsap.ticker);
gsap.ticker.lagSmoothing(0);
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const instances = new Map();

function isModalOpen() { return [...document.querySelectorAll('dialog[open], [aria-modal="true"]:not([hidden]), [data-mobile-menu][open]')].some(element => element.matches('dialog') ? element.open : element.getClientRects().length > 0); }
function syncScroll() {
  if (reduceQuery.matches) { lenis?.destroy(); lenis = null; scheduler.setLenis(null); return; }
  if (!lenis) { lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, anchors: false, prevent: node => Boolean(node.closest('[data-lenis-prevent], dialog, [aria-modal="true"]')) }); lenis.on('scroll', ScrollTrigger.update); scheduler.setLenis(lenis); }
  if (isModalOpen()) lenis.stop(); else lenis.start();
}

function mountFoundation(root) {
  const bus = createProgressBus();
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add({ motion: '(prefers-reduced-motion: no-preference)', mobile: '(max-width: 700px)', fine: '(hover: hover) and (pointer: fine)' }, ({ conditions }) => {
      if (!conditions.motion) return;
      const scope = createScope();
      createFoundationStudy(root, { gsap, bus, mobile: conditions.mobile });
      if (conditions.fine) {
        root.querySelectorAll('[data-magnetic]').forEach(element => scope.add(mountMagnetic(element, { gsap, signal: scope.signal })));
      }
      if (root.dataset.modelUrl) {
        const observer = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          observer.disconnect();
          scope.run(async signal => {
            const { mountScene } = await import('./scene.mjs');
            if (signal.aborted || reduceQuery.matches) return;
            return mountScene({ root, url: new URL(root.dataset.modelUrl, location.href).href, bus, scheduler, signal });
          }).catch(error => {
            const status = root.querySelector('[data-model-status]');
            status.hidden = false; status.textContent = root.dataset.errorLabel;
            console.warn('[STRYDE] Scene bundle unavailable:', error.message);
          });
        }, { rootMargin: '200px' });
        observer.observe(root);
        return () => { observer.disconnect(); scope.dispose(); };
      }
      return () => scope.dispose();
    });
  }, root);
  return () => { media.revert(); context.revert(); bus.dispose(); };
}

function mount(scope = document) {
  const roots = [...scope.querySelectorAll('[data-foundation], [data-product-section]')];
  if (scope.matches?.('[data-foundation], [data-product-section]')) roots.push(scope);
  for (const root of roots) if (!instances.has(root)) instances.set(root, root.matches('[data-foundation]') ? mountFoundation(root) : mountProduct(root));
  scope.querySelectorAll('[data-mobile-menu]').forEach(menu => {
    if (menu.dataset.bound) return; menu.dataset.bound = 'true';
    menu.addEventListener('toggle', syncScroll);
    menu.addEventListener('keydown', event => { if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); } });
    menu.addEventListener('click', event => { if (event.target.closest('a')) menu.open = false; });
  });
  ScrollTrigger.refresh();
}
function unmount(scope) { for (const [root, dispose] of instances) if (scope === root || scope.contains(root)) { dispose(); instances.delete(root); } }
syncScroll(); mount();
document.addEventListener('shopify:section:load', event => { mount(event.target); syncScroll(); });
document.addEventListener('shopify:section:unload', event => { unmount(event.target); syncScroll(); ScrollTrigger.refresh(); });
reduceQuery.addEventListener('change', () => { syncScroll(); unmount(document); mount(); });
const modalObserver = new MutationObserver(syncScroll);
modalObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open', 'aria-modal', 'hidden'] });
document.addEventListener('visibilitychange', () => { if (document.hidden) lenis?.stop(); else syncScroll(); });
window.addEventListener('pagehide', () => { unmount(document); lenis?.destroy(); lenis = null; scheduler.setLenis(null); modalObserver.disconnect(); });
window.addEventListener('pageshow', event => { if (event.persisted) { syncScroll(); mount(); modalObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open', 'aria-modal', 'hidden'] }); } });
