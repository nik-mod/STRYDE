// Product-specific environments (Soda-style adaptation). Each homepage chapter
// declares an environment name; the controller tracks which one owns the
// viewport center and exposes it globally for the fixed chrome, and — once a
// production GLB exists — as the lighting/exposure preset for the shared scene.
// Deterministic and data-driven: no invented products or inventories here.

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

export function mountEnvironments(scope = document, { onChange } = {}) {
  const targets = [...scope.querySelectorAll('[data-env]')];
  if (!targets.length) return () => {};
  const apply = name => {
    if (document.documentElement.dataset.env === name) return;
    document.documentElement.dataset.env = name;
    onChange?.(name);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) apply(entry.target.dataset.env);
  }, { rootMargin: '-45% 0px -45% 0px' });
  targets.forEach(target => observer.observe(target));
  const midline = window.innerHeight / 2;
  const current = targets.find(target => {
    const rect = target.getBoundingClientRect();
    return rect.top <= midline && rect.bottom >= midline;
  });
  if (current) apply(current.dataset.env);
  return () => {
    observer.disconnect();
    delete document.documentElement.dataset.env;
  };
}
