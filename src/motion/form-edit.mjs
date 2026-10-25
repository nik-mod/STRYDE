// Four editorial plates, one scroll gesture. Clip reveals keep the products
// opaque; transforms carry the motion without another WebGL scene.
export function mountFormEdit(root, gsap, { mobile }) {
  const looks = [...root.querySelectorAll('[data-form-look]')];
  if (!looks.length) return;
  if (mobile) {
    looks.forEach(look => {
      gsap.from(look.querySelector('.form-look-art'), {
        y: 50, rotation: -5, scale: .94, ease: 'none',
        scrollTrigger: { trigger: look, start: 'top 85%', end: 'top 25%', scrub: .45 },
      });
      gsap.from(look.querySelectorAll('.form-look-copy > *'), {
        y: 24, stagger: .06, duration: .75, ease: 'power3.out',
        scrollTrigger: { trigger: look, start: 'top 60%', toggleActions: 'play none none reverse' },
      });
    });
    return;
  }

  root.classList.add('is-form-sequenced');
  const full = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
  const closed = 'polygon(115% 0%, 115% 0%, 100% 100%, 100% 100%)';
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: root, start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 3.2)}`,
      pin: true, scrub: .45, invalidateOnRefresh: true,
    },
  });
  const progress = [...root.querySelectorAll('[data-form-progress]')];
  looks.forEach((look, index) => {
    const at = index;
    const art = look.querySelector('.form-look-art');
    const type = look.querySelectorAll('.form-look-type > span');
    const copy = look.querySelectorAll('.form-look-copy > *');
    gsap.set(look, { zIndex: index + 1, clipPath: index ? closed : full });
    if (index) {
      timeline.to(look, { clipPath: full, duration: .42, ease: 'power2.inOut' }, at)
        .fromTo(art, { xPercent: 44, yPercent: 12, rotation: -13, scale: .9 },
          { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, duration: .62, ease: 'power3.out' }, at)
        .fromTo(type, { xPercent: 65 }, { xPercent: 0, stagger: .05, duration: .6, ease: 'power3.out' }, at + .04)
        .fromTo(copy, { y: 40, clipPath: 'inset(100% 0% 0% 0%)' },
          { y: 0, clipPath: 'inset(0% 0% 0% 0%)', stagger: .035, duration: .35, ease: 'power3.out' }, at + .24);
      const previous = looks[index - 1];
      timeline.to(previous.querySelector('.form-look-art'), { xPercent: -32, yPercent: -9, rotation: 9, scale: .94, duration: .55, ease: 'power2.inOut' }, at)
        .to(previous.querySelectorAll('.form-look-type > span'), { xPercent: -24, duration: .45, ease: 'power2.inOut' }, at);
    } else {
      timeline.fromTo(art, { rotation: -4, yPercent: 6, scale: .96 }, { rotation: 0, yPercent: 0, scale: 1, duration: .65, ease: 'power2.out' }, 0);
    }
    // Quiet movement during the hold, followed by a decisive spatial exchange.
    timeline.to(art, { yPercent: -2, duration: .32, ease: 'none' }, at + .65)
      .fromTo(progress[index], { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'none' }, at);
  });
  return () => root.classList.remove('is-form-sequenced');
}
