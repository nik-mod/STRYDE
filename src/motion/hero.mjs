import { chapterState } from './contracts.mjs';

// The accessible heading remains intact. Split only its decorative rendering,
// then restore it so theme-editor remounts never nest the glyph wrappers.
function splitDisplayLine(line) {
  if (!line?.replaceChildren || !line.ownerDocument) return { glyphs: [], restore() {} };
  const text = line.textContent;
  const glyphs = Array.from(text).map(character => {
    const glyph = line.ownerDocument.createElement('span');
    glyph.className = 'hero-glyph'; glyph.textContent = character; glyph.dataset.glyph = character;
    return glyph;
  });
  line.replaceChildren(...glyphs);
  return { glyphs, restore() { line.textContent = text; } };
}

// The recovered opening film and the Hero share the existing lifecycle.
export function waitForHeroOpening(document, environment, play) {
  const html = document?.documentElement;
  const blocked = () => html?.classList.contains('site-intro-pending') || html?.classList.contains('site-intro-playing');
  if (!blocked() || !environment?.MutationObserver) { play(); return () => {}; }
  let active = true;
  const release = () => {
    if (!active) return;
    active = false; observer.disconnect();
    document.removeEventListener?.('stryde:intro-reveal', release); play();
  };
  const observer = new environment.MutationObserver(() => { if (!blocked()) release(); });
  document.addEventListener?.('stryde:intro-reveal', release, { once: true });
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  return () => { active = false; observer.disconnect(); document.removeEventListener?.('stryde:intro-reveal', release); };
}

export function mountHero(root, { gsap, bus, mobile, hasModel = false, surface = '#effaff', paper = '#b7ddef' }) {
  const stage = root.querySelector('[data-hero-stage]');
  if (!stage) return;
  const line1 = root.querySelector('[data-hero-line-1]');
  const line2 = root.querySelector('[data-hero-line-2]');
  const art = root.querySelector('[data-hero-art]');
  const arrival = root.querySelector('[data-hero-arrival]') || art;
  const copy = root.querySelector('[data-hero-copy]');
  const foot = root.querySelector('[data-hero-foot]');
  const atmosphere = root.querySelector('.hero-atmo');
  const first = splitDisplayLine(line1), second = splitDisplayLine(line2);
  const document = root.ownerDocument || (typeof globalThis.document === 'object' ? globalThis.document : null);
  const environment = document?.defaultView || window;
  const travel = mobile ? .75 : 1.0;
  const entrance = { progress: 1 };
  let intro = null, cancelOpening = () => {};
  const settleIntro = () => {
    cancelOpening();
    if (intro) { intro.progress(1).kill(); intro = null; }
  };
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root, start: 'top top',
      end: () => `+=${Math.round(stage.offsetHeight * travel)}`,
      pin: stage, pinSpacing: true, scrub: true, invalidateOnRefresh: true,
      onUpdate: self => {
        if (intro && self.progress > 0) {
          settleIntro();
          timeline.invalidate().progress(0, true).progress(self.progress, true);
        }
        bus.publish(chapterState(0, self.progress, self.direction));
      },
    },
  });
  // The line containers own restrained scroll separation; the glyphs own the
  // entrance. The product frame never scales, rolls or flies under HTML motion.
  timeline
    .fromTo(line1, { xPercent: 0, yPercent: 0, scale: 1 }, { xPercent: mobile ? 1 : 3, yPercent: -12, scale: 1, duration: .52, immediateRender: false }, 0)
    .fromTo(line2, { xPercent: 0, yPercent: 0, scale: 1 }, { xPercent: mobile ? 2 : 5, yPercent: 10, scale: 1, duration: .52, immediateRender: false }, 0)
    .to(line1, { xPercent: 0, yPercent: -4, duration: .48 }, .52)
    .to(line2, { xPercent: 0, yPercent: 4, duration: .48 }, .52)
    .fromTo(foot, { opacity: 1, y: 0 }, { opacity: 1, y: 0, duration: .84, immediateRender: false }, 0)
    .to(foot, { opacity: 0, y: -10, duration: .16 }, .84)
    .fromTo(stage, { backgroundColor: paper }, { backgroundColor: surface, immediateRender: true, duration: 1, ease: progress => Math.max(0, (progress - .72) / .28) }, 0);
  if (copy) timeline.fromTo(copy, { opacity: 1, y: 0 }, { opacity: .8, y: -4, duration: .84, immediateRender: false }, 0);
  if (atmosphere) timeline.fromTo(atmosphere, { yPercent: 0, opacity: 1 }, { yPercent: -3, opacity: .65, duration: 1, immediateRender: false }, 0);

  if ((environment.scrollY || 0) <= 24) {
    // Create inside the caller's GSAP context, but keep it paused until the
    // site intro has released the page. No delayed untracked animation exists.
    intro = gsap.timeline({ paused: true, onUpdate: () => {
      if (!timeline.scrollTrigger?.progress) bus.publish({ ...chapterState(0, 0), entrance: entrance.progress });
    } });
    intro.fromTo(entrance, { progress: 0 }, { progress: 1, duration: 1.4, ease: 'power3.out' }, 0);
    const letters = (glyphs, fallback, at) => {
      if (glyphs.length) {
        intro.fromTo(glyphs,
          { yPercent: 112, opacity: 1, rotationX: 28, rotationZ: 0, '--glyph-fill': 1 },
          { yPercent: 0, opacity: 1, rotationX: 0, rotationZ: 0, '--glyph-fill': 1,
            duration: 1.25, stagger: { each: .028, from: 'start' }, ease: 'expo.out' }, at);
      } else intro.fromTo(fallback, { yPercent: 110 }, { yPercent: 0, duration: .95, ease: 'expo.out' }, at);
    };
    letters(first.glyphs, line1, 0);
    letters(second.glyphs, line2, .16);
    if (arrival && !hasModel) intro.fromTo(arrival, { opacity: 1, scale: .98, xPercent: 0, y: 12, rotation: 0 }, { opacity: 1, scale: 1, xPercent: 0, y: 0, rotation: 0, duration: 1.4, ease: 'power3.out' }, 0);
    if (copy) intro.fromTo(copy, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, .35);
    if (foot) intro.fromTo(foot, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .65, ease: 'power3.out' }, .45);
    cancelOpening = waitForHeroOpening(document, environment, () => {
      if (!intro) return;
      if ((environment.scrollY || 0) > 24 || timeline.scrollTrigger?.progress > 0) settleIntro();
      else intro.play();
    });
  }
  return () => {
    cancelOpening(); intro?.kill(); first.restore(); second.restore();
  };
}
