// The edit is a connected photographic field, not a stack of full-screen
// slides. Each product stays in document flow while its image moves in depth.
export function mountFormEdit(root, gsap, { mobile }) {
  const looks = [...root.querySelectorAll('[data-form-look]')];
  if (!looks.length) return;
  root.classList.add('is-form-flow');
  looks.forEach((look, index) => {
    const art = look.querySelector('.form-look-art');
    const image = art?.querySelector('img');
    if (!art || !image) return;
    gsap.fromTo(art, { clipPath: 'inset(8% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: look, start: 'top 95%', end: 'top 42%', scrub: .45 },
    });
    gsap.fromTo(image, { yPercent: mobile ? 3 : 6, rotation: index % 2 ? 1.5 : -1.5 }, {
      yPercent: mobile ? -3 : -6, rotation: index % 2 ? -1 : 1, ease: 'none',
      scrollTrigger: { trigger: look, start: 'top bottom', end: 'bottom top', scrub: .65 },
    });
  });
  return () => root.classList.remove('is-form-flow');
}
