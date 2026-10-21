// A browsing page, not a pinned chapter. Existing runtime owns clock and scroll.
export function mountListing(root, { gsap }) {
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const heading = root.querySelector('[data-listing-heading]');
      if (heading) gsap.fromTo(heading, { y: 18, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: .65, ease: 'power3.out',
        scrollTrigger: { trigger: heading, start: 'top 98%', toggleActions: 'play none none reverse' },
      });
      const entries = [...root.querySelectorAll('[data-listing-entry], .product-grid > .product-card')];
      // Each entry reveals when it reaches the viewport. No column-dependent
      // delay, so touch scrolling and breakpoint changes never wait on a row.
      // Keep complete artwork visible even before its entrance is triggered:
      // deep links, abrupt scrolls and full-page captures remain useful.
      entries.forEach(entry => gsap.fromTo(entry, { y: 26 }, {
        y: 0, duration: .65, ease: 'power3.out',
        scrollTrigger: { trigger: entry, start: 'top 98%', toggleActions: 'play none none reverse' },
      }));
    });
  }, root);
  return () => { media.revert(); context.revert(); };
}
