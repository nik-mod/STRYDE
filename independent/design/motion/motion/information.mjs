// Interior editorial pages use the existing GSAP clock and lifecycle. Content
// starts visible; no JS, reduced motion and delayed loading keep it readable.
export function mountInformation(root, { gsap }) {
  const photos = root.querySelector('.about-lineup') ? mountPhotoFraming(root, { images: '.about-pair img', hostSelector: '[data-about-shoe]', fill: .82 }) : null;
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const introduction = root.querySelector('.contact-introduction h1');
      if (introduction) {
        const arrival = gsap.timeline();
        arrival.fromTo(introduction, { y:24 }, { y:0, duration:1.15, ease:'expo.out' }, 0)
          .fromTo(root.querySelector('.contact-form-panel'), { y:32 }, { y:0, duration:1.25, ease:'expo.out' }, .08);
      }
      root.querySelectorAll('[data-info-reveal]').forEach(section => {
        gsap.fromTo(section, { y: 18, opacity: .8 }, { y: 0, opacity: 1, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: section, start: 'top 92%', once: true } });
      });
      const lineup = root.querySelector('.about-lineup');
      if (lineup) gsap.fromTo(lineup.querySelectorAll('[data-about-shoe]'), { yPercent: i => i === 1 ? -3 : 3 }, { yPercent: i => i === 1 ? 3 : -3, ease: 'none', scrollTrigger: { trigger: lineup, start: 'top bottom', end: 'bottom top', scrub: .7 } });
    });
  }, root);
  return () => { media.revert(); context.revert(); photos?.dispose(); };
}
import { mountPhotoFraming } from '../collection-studio.mjs';
