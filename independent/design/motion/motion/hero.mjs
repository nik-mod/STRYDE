import { chapterState } from './contracts.mjs';
import { heroPosterFrame } from '../hero-poster-framing.mjs';
import { heroDirection } from '../journey-poses.mjs';

// The accessible heading remains intact. Split only its decorative rendering,
// then restore it so theme-editor remounts never nest the glyph wrappers.
function splitDisplayLine(line) {
  if (!line?.replaceChildren || !line.ownerDocument) return { glyphs: [], restore() {} };
  const text = line.textContent;
  const glyphs = Array.from(text).map(character => {
    const glyph = line.ownerDocument.createElement('span');
    glyph.className = 'hero-glyph'; glyph.dataset.glyph = character;
    const ink = line.ownerDocument.createElement('span');
    ink.className = 'hero-glyph-motion'; ink.textContent = character;
    glyph.append(ink);
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
  const type = root.querySelector('[data-hero-type]');
  const foot = root.querySelector('[data-hero-foot]');
  const first = splitDisplayLine(line1), second = splitDisplayLine(line2);
  const document = root.ownerDocument || (typeof globalThis.document === 'object' ? globalThis.document : null);
  const environment = document?.defaultView || window;
  const syncPoster = () => {
    if (!root.querySelector('[data-hero-poster]') || !art?.getBoundingClientRect) return;
    const rect = art.getBoundingClientRect(), frame = heroPosterFrame(rect.width, rect.height);
    if (!frame) return;
    for (const [key, value] of Object.entries(frame)) root.style.setProperty(`--hero-poster-${key}`, `${value}px`);
  };
  syncPoster(); environment.addEventListener?.('resize', syncPoster);
  const portrait = () => environment.innerWidth <= 900 && environment.innerHeight > environment.innerWidth;
  const travel = () => portrait() || mobile ? .80 : 1.65;
  const entrance = { progress: 1 };
  const film = { progress: 0 };
  // Register the baseline in the caller's GSAP context for media-query cleanup.
  // Reusable setters avoid allocating a new tween on every scrub update.
  if (type) gsap.set(type, { scale:1, y:0, transformOrigin:'0% 50%' });
  const setTypeScale = type ? gsap.quickSetter(type, 'scale') : () => {};
  const setTypeY = type ? gsap.quickSetter(type, 'y', 'px') : () => {};
  let intro = null, cancelOpening = () => {};
  const settleIntro = () => {
    cancelOpening();
    if (intro) { intro.progress(1).kill(); intro = null; }
  };
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root, start: () => `top ${parseFloat(environment.getComputedStyle?.(root).getPropertyValue('--preview-height')) || 0}px`,
      end: () => `+=${Math.round(stage.offsetHeight * travel())}`,
      pin: stage, pinSpacing: true, scrub: true, invalidateOnRefresh: true,
      onUpdate: self => {
        if (intro && self.progress > .002) {
          settleIntro();
          timeline.invalidate().progress(0, true).progress(self.progress, true);
        }
        bus.publish(chapterState(0, self.progress, self.direction));
      },
    },
  });
  // One source of shot direction owns the optical gate and the reading space.
  // Type yields space for the upper inspection, then opens with the reveal.
  timeline
    .to(film, { progress: 1, duration: 1, onUpdate: () => {
      const shot = heroDirection(film.progress), narrow = portrait();
      setTypeScale(narrow ? 1-(1-shot.typeScale)*.24 : shot.typeScale);
      setTypeY(shot.typeY*(narrow ? .22 : 1));
      bus.publish(chapterState(0, film.progress, timeline.scrollTrigger?.direction));
    } }, 0)
    .fromTo(foot, { opacity: 1, y: 0 }, { opacity: .85, y: -12, duration: 1, immediateRender: false }, 0);
  if (copy) timeline.fromTo(copy, { opacity: 1, y: 0 }, { opacity: .8, y: -4, duration: .84, immediateRender: false }, 0);
  // The same blue ink deepens as recessed wave faces travel behind the word.
  // This preserves its legibility without a panel, halo or new scroll owner.
  if (line2) timeline.fromTo(line2, { color: '#2053a4' },
    { color: '#153e78', duration: .5, immediateRender: false }, 0)
    .to(line2, { color: '#2053a4', duration: .25 }, .5)
    .to(line2, { color: '#153e78', duration: .25 }, .75);
  // The atmosphere is a full-bleed reference surface. Moving its rectangle
  // upward exposed a flat strip at the bottom of the Hero.

  if ((environment.scrollY || 0) <= 24) {
    // Create inside the caller's GSAP context, but keep it paused until the
    // site intro has released the page. No delayed untracked animation exists.
    intro = gsap.timeline({ paused: true, onUpdate: () => {
      if ((timeline.scrollTrigger?.progress || 0) < .002) bus.publish({ ...chapterState(0, 0), entrance: entrance.progress });
    } });
    intro.fromTo(entrance, { progress: 0 }, { progress: 1, duration: 2.8, ease: 'power2.inOut' }, 0);
    const letters = (glyphs, fallback, at) => {
      if (glyphs.length) {
        intro.fromTo(glyphs,
          { yPercent: 110, xPercent: 0, scale: 1, opacity: 1, rotationX: 0, rotationY: 0, rotationZ: 0, '--glyph-fill': 1 },
          { yPercent: 0, xPercent: 0, scale: 1, opacity: 1, rotationX: 0, rotationY: 0, rotationZ: 0, '--glyph-fill': 1,
            duration: 1.15, stagger: .035, ease: 'expo.out' }, at);
      } else intro.fromTo(fallback, { yPercent: 110 }, { yPercent: 0, duration: .95, ease: 'expo.out' }, at);
    };
    letters(first.glyphs, line1, 0);
    letters(second.glyphs, line2, .45);
    const poster = root.querySelector('[data-hero-poster]');
    if (poster) gsap.set(poster, { scale:1,rotation:0,y:0 });
    if (arrival && !hasModel) intro.fromTo(arrival, { opacity: 1, scale: .98, xPercent: 0, y: 12, rotation: 0 }, { opacity: 1, scale: 1, xPercent: 0, y: 0, rotation: 0, duration: 2.8, ease: 'power2.inOut' }, 0);
    if (copy) intro.fromTo(copy, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, .35);
    const caption = root.querySelector('[data-hero-caption]');
    if (caption) {
      intro.fromTo(caption.querySelector('.hero-caption-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.out' }, .4);
      intro.fromTo(caption.querySelectorAll('p, a'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .08, ease: 'power3.out' }, .6);
    }
    if (foot) intro.fromTo(foot, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .65, ease: 'power3.out' }, .45);
    cancelOpening = waitForHeroOpening(document, environment, () => {
      if (!intro) return;
      if ((environment.scrollY || 0) > 24 || timeline.scrollTrigger?.progress > .002) settleIntro();
      else intro.play();
    });
  }
  return () => {
    environment.removeEventListener?.('resize', syncPoster);
    for (const key of ['width', 'height', 'left', 'top']) root.style?.removeProperty?.(`--hero-poster-${key}`);
    cancelOpening(); intro?.kill(); first.restore(); second.restore();
  };
}
