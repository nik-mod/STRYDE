// Product-specific environments (Soda-style adaptation). Each homepage chapter
// declares an environment name; the controller tracks which one owns the
// viewport center and exposes it globally for the fixed chrome, and — once a
// production GLB exists — as the lighting/exposure preset for the shared scene.
// Deterministic and data-driven: no invented products or inventories here.

import { mountChapterContinuity, chapterAtMidpoint } from './chapter-continuity.mjs';

export const ENVIRONMENTS = Object.freeze({
  hero: Object.freeze({ key: 3.4, rim: 2.0, exposure: 1.0 }),
  deconstruction: Object.freeze({ key: 3.0, rim: 1.8, exposure: 1.0 }),
  materials: Object.freeze({ key: 3.6, rim: 2.2, exposure: 1.02 }),
  technology: Object.freeze({ key: 2.6, rim: 2.8, exposure: .96 }),
  collection: Object.freeze({ key: 3.4, rim: 2.0, exposure: 1.0 }),
  featured: Object.freeze({ key: 3.2, rim: 2.2, exposure: 1.0 }),
  brand: Object.freeze({ key: 3.4, rim: 2.0, exposure: 1.0 }),
  finale: Object.freeze({ key: 4.2, rim: 2.6, exposure: 1.06 }),
});

export function environmentFor(name) {
  return ENVIRONMENTS[name] ?? ENVIRONMENTS.hero;
}

export function mountEnvironments(scope = document, { onChange, scheduler } = {}) {
  const targets = [...scope.querySelectorAll('[data-env]')];
  if (!targets.length) return () => {};
  const apply = name => {
    if (document.documentElement.dataset.env === name) return;
    document.documentElement.dataset.env = name;
    document.querySelectorAll('[data-chapter-link]').forEach(link => {
      if (link.dataset.chapterLink === name) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    onChange?.(name);
  };
  // The shared scroll clock already measures chapter boundaries for the grade.
  // Use those same measurements for navigation rather than observer delivery order.
  const disposeContinuity = scheduler ? mountChapterContinuity({ document: scope.ownerDocument || scope, scheduler, onActive: apply }) : () => {};
  const read = () => apply(chapterAtMidpoint(targets.map(target => ({ name: target.dataset.env, top: target.getBoundingClientRect().top })), window.innerHeight));
  const observer = !scheduler ? new IntersectionObserver(read, { rootMargin: '-45% 0px -45% 0px' }) : null;
  if (observer) { targets.forEach(target => observer.observe(target)); read(); }
  return () => {
    disposeContinuity();
    observer?.disconnect();
    delete document.documentElement.dataset.env;
  };
}
