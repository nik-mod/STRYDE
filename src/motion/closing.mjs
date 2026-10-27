// The photographic campaign and the real footer have one lifecycle owner.
// All poses are absolute scroll samples; the existing GSAP clock owns time.
export function mountClosingCampaign(root, gsap, { mobile }) {
  const document = root.ownerDocument;
  const stage = root.querySelector('[data-closing-stage]');
  const focus = root.querySelector('[data-closing-focus]');
  const archive = [...root.querySelectorAll('[data-closing-photo]')];
  const copy = root.querySelector('[data-closing-copy]');
  const actions = root.querySelector('[data-closing-actions]');
  if (!stage || !focus) return;
  const compact = mobile || document.defaultView.innerWidth <= 900;
  const sequence = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
    trigger: root, start: compact ? 'top 65%' : 'top top',
    end: compact ? 'bottom 25%' : () => `+=${Math.round(document.defaultView.innerHeight * .9)}`,
    pin: compact ? false : stage, pinSpacing: true, scrub: true, invalidateOnRefresh: true,
  } });
  if (compact) {
    sequence.fromTo(focus, { y: 22, rotationX: 5 }, { y: -8, rotationX: 0, duration: 1 }, 0);
  } else {
    // Anticipation -> one complete, identifiable photograph. The other shoes
    // leave as separate photographs, never morphing into an unrelated GLB.
    sequence.fromTo(focus, { xPercent: 0, yPercent: 0, scale: 1, rotationY: -12, rotationZ: -5 },
      { xPercent: -8, yPercent: -2, scale: 1.12, rotationY: 0, rotationZ: -1, duration: .6 }, 0)
      .to(focus, { xPercent: -5, yPercent: -6, scale: 1.04, rotationZ: 0, duration: .4 }, .6)
      .to(archive, { xPercent: index => -25 - index * 12, y: 24, autoAlpha: 0, duration: .38, stagger: .035 }, .05)
      .to(copy, { yPercent: -18, opacity: .82, duration: .6 }, .1)
      .to(actions, { y: -8, duration: .7 }, .15);
  }
  // Chapter exposure matching owns surface color through the footer handoff.

  let footer = null, footerContext = null;
  const connectFooter = () => {
    const next = document.querySelector('[data-signature-footer]');
    if (next === footer) return;
    footerContext?.revert(); footerContext = null; footer = next;
    if (!footer) return;
    footerContext = gsap.context(() => {
      const word = footer.querySelector('[data-footer-word]');
      const letters = [...(word?.querySelectorAll?.('[data-footer-letter]') || [])];
      const commerce = footer.querySelector('.signature-commerce');
      const identity = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
        trigger: footer, start: 'top 140%', end: 'top 50%', scrub: .35, invalidateOnRefresh: true,
      } });
      // The only monumental STRYDE mark is the real, linked footer wordmark.
      // It rises as the photographic stage releases, then stays fully readable.
      if (letters.length) {
        word.classList.add('is-letter-revealing');
        gsap.set(letters, { yPercent: 115, rotationX: -24, scaleY: 1.12, backgroundPositionX: '0%' });
        identity.fromTo(letters, { yPercent: 115, rotationX: -24, scaleY: 1.12, backgroundPositionX: '0%' },
          { yPercent: 0, rotationX: 0, scaleY: 1, backgroundPositionX: '100%', duration: .62,
            stagger: .055, force3D: true }, 0);
      } else {
        identity.fromTo(word, { yPercent: 38, rotationX: -28, color: '#527f94', opacity: .65 },
          { yPercent: 0, rotationX: 0, color: '#dcecf2', opacity: 1, duration: .78 }, 0);
      }
      identity.fromTo(commerce, { y: 20, opacity: .65 }, { y: 0, opacity: 1, duration: .5 }, .45);
      // The campaign timeline alone owns the photograph. It travels out with
      // the document while the wordmark rises; a second focus tween used to
      // overwrite its pinned pose on direct reverse seeks.
      return () => word?.classList?.remove('is-letter-revealing');
    }, footer);
  };
  const onSection = event => {
    if (event.type === 'shopify:section:unload' && footer && event.target.contains?.(footer)) {
      footerContext?.revert(); footerContext = null; footer = null;
      return;
    }
    connectFooter();
  };
  connectFooter();
  document.addEventListener('shopify:section:load', onSection);
  document.addEventListener('shopify:section:unload', onSection);
  return () => {
    document.removeEventListener('shopify:section:load', onSection);
    document.removeEventListener('shopify:section:unload', onSection);
    footerContext?.revert();
  };
}
