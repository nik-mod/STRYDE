export const SITE_INTRO_RETURN_KEY = 'stryde:intro-internal-return:v1';

export function isInternalHomeReturn({ currentURL, referrer = '', navigationType = '', marker = null, now = Date.now() } = {}) {
  if (navigationType !== 'navigate') return false;
  try {
    const current = new URL(currentURL);
    if (referrer && new URL(referrer).origin === current.origin) return true;
    return Boolean(marker && marker.path === current.pathname && Number.isFinite(marker.time) && now >= marker.time && now - marker.time < 15000);
  } catch { return false; }
}

export function markInternalHomeReturn(environment, href) {
  try {
    const target = new URL(href, environment.location.href);
    environment.sessionStorage?.setItem(SITE_INTRO_RETURN_KEY, JSON.stringify({ path: target.pathname, time: Date.now() }));
  } catch { /* Same-origin referrer detection remains available without storage. */ }
}

export function shouldPlaySiteIntro({ reduced = false, restoredY = 0, hash = '', navigationType = '', designMode = false, internalReturn = false } = {}) {
  return !internalReturn && !reduced && !designMode && !hash && navigationType !== 'back_forward' && !(restoredY > 24);
}

export function mountSiteIntro({ gsap, document, environment, skip = false, onChange = () => {} }) {
  const root = document.querySelector('[data-site-intro]');
  const html = document.documentElement;
  const noop = { finish() {}, dispose() {} };
  if (!root || skip || !html.classList.contains('site-intro-pending')) {
    html.classList.remove('site-intro-pending');
    return noop;
  }

  const previousFocus = document.activeElement;
  const siblings = [...root.parentElement.children].filter(element => element !== root).map(element => ({ element, inert: element.inert }));
  const one = name => root.querySelector(`[data-intro-${name}]`);
  const all = name => [...root.querySelectorAll(`[data-intro-${name}]`)];
  const move = all('move-glyph');
  const different = all('different-glyph');
  const glyphs = all('glyph');
  const panels = all('macro');
  const shoe = one('shoe');
  const trails = all('trail');
  const skipButton = one('skip');
  const heroFrame = () => document.querySelector('[data-hero-art]')?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1440, height: 900 };
  const landingFrame = () => document.querySelector('[data-hero-poster] img')?.getBoundingClientRect?.() || { left: heroFrame().left + heroFrame().width * .08, top: heroFrame().top + heroFrame().height * .08, width: heroFrame().width * .84, height: heroFrame().height * .84 };
  let timeline, watchdog, done = false;

  const finish = ({ restoreFocus = true } = {}) => {
    if (done) return;
    done = true;
    timeline?.kill();
    environment.clearTimeout(watchdog);
    document.removeEventListener('keydown', onKey);
    skipButton?.removeEventListener?.('click', onSkip);
    html.removeAttribute?.('data-intro-revealing');
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    root.removeAttribute('aria-modal');
    html.classList.remove('site-intro-pending', 'site-intro-playing');
    siblings.forEach(({ element, inert }) => { element.inert = inert; });
    if (restoreFocus && root.contains(document.activeElement)) {
      const target = previousFocus && previousFocus !== document.body && previousFocus.isConnected
        ? previousFocus : document.querySelector('#MainContent');
      target?.focus({ preventScroll: true });
    }
    onChange();
  };
  const onSkip = () => finish();
  const onKey = event => {
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
    if (event.key === 'Tab') { event.preventDefault(); (skipButton?.focus ? skipButton : root).focus({ preventScroll: true }); }
  };

  root.hidden = false;
  root.removeAttribute('aria-hidden');
  root.setAttribute('aria-modal', 'true');
  siblings.forEach(({ element }) => { element.inert = true; });
  html.classList.add('site-intro-playing');
  html.classList.remove('site-intro-pending');
  document.addEventListener('keydown', onKey);
  skipButton?.addEventListener?.('click', onSkip);
  root.focus({ preventScroll: true });
  watchdog = environment.setTimeout(() => finish(), 7500);

  try {
    timeline = gsap.timeline({ paused: true, onComplete: () => finish() });
    timeline
      // An oversized type hit, a compressed second beat, then the aperture opens.
      .fromTo(move, { yPercent: 125, rotationX: -80, scale: 1.4, opacity: 0 }, {
        yPercent: 0, rotationX: 0, scale: 1, opacity: 1, duration: .62,
        stagger: .035, ease: 'expo.out',
      }, .05)
      .fromTo(one('speedlines'), { xPercent: -25, scaleX: .4 }, { xPercent: 15, scaleX: 1.4, duration: 1.4, ease: 'power2.inOut' }, 0)
      .to(one('move'), { scale: 1.15, rotation: -7, duration: .45, ease: 'power2.in' }, .52)
      .to(move, { yPercent: -150, rotationX: 55, opacity: 0, duration: .28, stagger: .012, ease: 'power3.in' }, .59)
      .fromTo(different, { yPercent: 130, scaleY: 1.7, rotation: 12, opacity: 0 }, {
        yPercent: 0, scaleY: 1, rotation: 0, opacity: 1, duration: .6, stagger: .025, ease: 'expo.out',
      }, .94)
      .to(one('different'), { scaleX: .6, scaleY: .6, rotation: -10, opacity: 0, duration: .42, ease: 'power3.in' }, 1.55)
      .to(one('iris'), { scale: 1, duration: .72, ease: 'power4.inOut' }, 1.38)
      .to(one('kinetic'), { autoAlpha: 0, duration: .2 }, 2.03)
      // Three product views sweep through on alternating vectors, with a brief
      // shared hold so every shoe is readable before the panels exit.
      .fromTo(one('macros'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .01 }, 1.76)
      .fromTo(panels, { yPercent: i => i % 2 ? -115 : 115 }, {
        yPercent: 0, duration: .68, stagger: .075, ease: 'expo.out',
      }, 1.76)
      .fromTo(all('macro-image'), { scale: index => index === 0 ? 1.35 : 1.12, yPercent: 5, rotation: 18 }, {
        scale: 1, yPercent: -6, rotation: 10, duration: 1.18, stagger: .045, ease: 'power2.out',
      }, 1.79)
      .to(panels, { yPercent: i => i % 2 ? 115 : -115, duration: .7, stagger: .06, ease: 'power3.inOut' }, 2.85)
      .to(one('macros'), { autoAlpha: 0, duration: .01 }, 3.69)
      // Pull back from the detail into a product suspended inside an orbital field.
      .fromTo(one('stage'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .01 }, 2.84)
      .fromTo(one('grid'), { opacity: 0, scale: 1.4 }, { opacity: .7, scale: 1, duration: 1.3, ease: 'power3.out' }, 2.91)
      .fromTo(glyphs, {
        xPercent: i => (i - 2.5) * 65, yPercent: i => i % 2 ? -130 : 130,
        rotationX: -70, rotation: i => (i - 2.5) * 8, scale: .6, opacity: 0,
      }, { xPercent: 0, yPercent: 0, rotationX: 0, rotation: 0, scale: 1, opacity: 1,
        duration: 1.02, stagger: { each: .04, from: 'center' }, ease: 'expo.out',
      }, 3.05)
      .fromTo(trails, { opacity: 0, yPercent: 40, scale: .55 }, { opacity: .18, yPercent: -5, scale: 1, duration: .72, stagger: .1, ease: 'power3.out' }, 3.06)
      .to(trails, { yPercent: -85, opacity: 0, scale: 1.15, duration: .8, stagger: .08, ease: 'power2.in' }, 3.72)
      .fromTo(shoe, { opacity: 0, xPercent: 52, yPercent: 40, scale: 1.65, rotation: -32 }, {
        opacity: 1, xPercent: 0, yPercent: 0, scale: 1, rotation: -8, duration: 1.05, ease: 'expo.out',
      }, 3.16)
      .fromTo(one('shadow'), { opacity: 0, scaleX: .4 }, { opacity: .65, scaleX: 1, duration: 1.1, ease: 'power3.out' }, 3.26)
      .fromTo(all('orbit'), { strokeDashoffset: 3600 }, { strokeDashoffset: 0, duration: 1.75, stagger: .09, ease: 'power2.inOut' }, 3.01)
      .fromTo(one('halo'), { scale: .2, opacity: 0 }, { scale: 1.4, opacity: 1, duration: 1.6, ease: 'expo.out' }, 3.16)
      .fromTo(one('orbits'), { rotation: -20, scale: .7 }, { rotation: 12, scale: 1.06, duration: 2.5, ease: 'power2.out' }, 3.06)
      .fromTo(one('echo'), { y: 0, opacity: 0, scale: 1 }, { y: 38, opacity: .6, scale: 1.03, duration: 1.1, ease: 'power3.out' }, 3.61)
      .fromTo(all('edge'), { scaleX: 0 }, { scaleX: 1, duration: 1.3, stagger: .12, ease: 'expo.out' }, 3.66)
      .to(shoe, { yPercent: -5, rotation: 4, scale: 1.06, duration: .45, ease: 'sine.inOut' }, 4.21)
      .to(one('word'), { scale: 1.035, duration: 1.5, ease: 'sine.inOut' }, 4.01)
      .fromTo(all('signoff-word'), { yPercent: 120, rotation: 5, opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, duration: .75, stagger: .09, ease: 'expo.out' }, 4.11)
      .fromTo(one('light'), { xPercent: -100, opacity: 0 }, { xPercent: 100, opacity: .65, duration: 1.2, ease: 'power2.inOut' }, 4.31)
      .to(one('light'), { opacity: 0, duration: .18 }, 5.31)
      // Dock the same photographic subject into the live product's camera gate.
      // The film, shutters and live Hero overlap in time, so there is no empty beat.
      .to(one('echo'), { y: 80, opacity: 0, duration: .45 }, 5.41)
      .to(one('product'), {
        left: () => landingFrame().left + landingFrame().width / 2,
        top: () => landingFrame().top + landingFrame().height / 2,
        width: () => landingFrame().width,
        height: () => landingFrame().height,
        duration: .7, ease: 'power3.inOut',
      }, 4.75)
      .to(shoe, { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, opacity: 1, duration: .65, ease: 'power2.inOut' }, 4.75)
      .to(one('shadow'), { scaleX: .4, opacity: 0, duration: .35 }, 5.54)
      .to(glyphs, { yPercent: -28, rotation: 0,
        opacity: 0, duration: .5, stagger: .015, ease: 'power2.in',
      }, 5.67)
      .to(one('signoff'), { y: -18, opacity: 0, duration: .35, ease: 'power2.in' }, 5.76)
      .to([one('wash'), one('halo'), one('orbits'), one('grid')], { opacity: 0, duration: .55 }, 5.2)
      .to(one('film'), { backgroundColor: '#b7ddef', opacity: 0, duration: .8 }, 5.55)
      .to(all('curtain'), { yPercent: i => i % 2 ? 101 : -101, duration: .85,
        stagger: { each: .055, from: 'center' }, ease: 'power4.inOut',
      }, 5.55);
    // Start the existing Hero entrance beneath the opening shutters. Its own
    // timeline still owns the headline and live model; no second 3D controller.
    timeline.call?.(() => {
      html.setAttribute?.('data-intro-revealing', '');
      document.dispatchEvent(new environment.Event('stryde:intro-reveal'));
    }, [], 5.05);
    timeline.timeScale?.(1.35);
    timeline.play();
  } catch {
    finish();
  }

  return { finish, dispose() { finish({ restoreFocus: false }); } };
}
