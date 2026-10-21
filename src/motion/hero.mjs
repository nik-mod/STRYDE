import { chapterState } from './contracts.mjs';

// Phase boundaries mirror HERO_PHASES in contracts.mjs. Positions are fractions
// of the pinned travel, so every tween is authored, reversible and scrub-safe.
const DEPTH_END = .18;
const TRANSFORM_END = .46;
const MACRO_END = .72;
const HANDOFF_END = .9;

export function mountHero(root, { gsap, bus, mobile, hasModel = false, fine = false, surface = '#effaff' }) {
  const stage = root.querySelector('[data-hero-stage]');
  const line1 = root.querySelector('[data-hero-line-1]');
  const line2 = root.querySelector('[data-hero-line-2]');
  const art = root.querySelector('[data-hero-art]');
  const float = root.querySelector('[data-hero-float]');
  const depth = root.querySelector('[data-hero-depth]');
  const type = root.querySelector('[data-hero-type]');
  const media = root.querySelector('[data-scene-host]');
  const ring = root.querySelector('[data-hero-ring]');
  const copy = root.querySelector('[data-hero-copy]');
  const foot = root.querySelector('[data-hero-foot]');
  const cue = root.querySelector('[data-hero-cue]');
  const cueLine = root.querySelector('[data-hero-cue-line]');
  if (!stage) return;

  const travel = mobile ? 1.1 : 2.1;
  let intro = null;
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: () => `+=${Math.round(stage.offsetHeight * travel)}`,
      pin: stage,
      pinSpacing: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: self => {
        // Any real scroll takes over from the entrance — jump it to its end state.
        if (intro?.isActive()) intro.progress(1);
        bus.publish(chapterState(0, self.progress, self.direction));
      },
    },
  });

  // Phase 01 → 02 — depth: the type world recedes, the product begins to move.
  timeline
    .to(line1, { xPercent: -3.5, scale: 1.05, ease: 'power1.inOut', duration: DEPTH_END }, 0)
    .to(line2, { xPercent: 3.5, scale: 1.05, ease: 'power1.inOut', duration: DEPTH_END }, 0)
    .to(float, { yPercent: -4, ease: 'power1.inOut', duration: DEPTH_END }, 0)
    .to(ring, { rotation: 16, scale: 1.04, ease: 'power1.inOut', duration: DEPTH_END }, 0)
    .to(copy, { opacity: .55, y: -20, ease: 'power1.inOut', duration: DEPTH_END }, 0)
    .to(cue, { opacity: 0, duration: .08 }, .05);

  // Phase 02 → 03 — transform: the shoe grows, the first line masks out.
  timeline
    .to(line1, { yPercent: -114, ease: 'power2.in', duration: .2 }, DEPTH_END + .02)
    .to(art, { scale: hasModel ? 1 : 1.22, xPercent: hasModel ? 0 : -2, rotation: hasModel ? 0 : 3, ease: 'power1.inOut', duration: TRANSFORM_END - DEPTH_END }, DEPTH_END)
    .to(float, { yPercent: -9, duration: TRANSFORM_END - DEPTH_END }, DEPTH_END)
    .to(ring, { scale: 1.14, opacity: .75, duration: TRANSFORM_END - DEPTH_END }, DEPTH_END);

  // Phase 03 → 04 — macro: the product dominates, the second line masks out.
  timeline
    .to(art, { scale: hasModel ? 1 : 1.62, yPercent: hasModel ? 0 : 6, rotation: hasModel ? 0 : -3, ease: 'power1.inOut', duration: MACRO_END - TRANSFORM_END }, TRANSFORM_END)
    .to(line2, { yPercent: 114, ease: 'power2.in', duration: .18 }, TRANSFORM_END + .02)
    .to(ring, { opacity: 0, scale: 1.22, duration: .16 }, TRANSFORM_END + .04)
    .to(copy, { opacity: 0, duration: .12 }, TRANSFORM_END);

  // Phase 04 → 05 — handoff: settle into the deterministic pose shared with
  // chapter 02; the stage color resolves into the next chapter's surface.
  timeline
    .to(art, { scale: hasModel ? 1 : 1.3, xPercent: 0, yPercent: 0, rotation: 0, ease: 'power2.inOut', duration: HANDOFF_END - MACRO_END }, MACRO_END)
    .to(float, { yPercent: 0, ease: 'power2.inOut', duration: HANDOFF_END - MACRO_END }, MACRO_END)
    .to(stage, { backgroundColor: surface, ease: 'power1.inOut', duration: HANDOFF_END - MACRO_END }, MACRO_END)
    .to(foot, { opacity: 0, y: -34, ease: 'power2.in', duration: .14 }, MACRO_END)
    .to({}, { duration: 1 - HANDOFF_END }, HANDOFF_END);

  // Entrance choreography (not scroll-bound). Only created when the visitor is
  // near the top: a paused .from() timeline applies its hidden start states on
  // creation, so building it mid-page would blank the hero.
  if ((window.scrollY || 0) < stage.offsetHeight * .4) {
    intro = gsap.timeline({ paused: true });
    intro
      .from(line1, { yPercent: 114, duration: 1.1, ease: 'power4.out' }, 0)
      .from(line2, { yPercent: 114, duration: 1.1, ease: 'power4.out' }, .12)
      .from(art, { opacity: 0, scale: .92, y: 26, duration: 1.3, ease: 'power3.out' }, .18)
      .from(ring, { opacity: 0, duration: 1, ease: 'power2.out' }, .4)
      .from(copy, { opacity: 0, y: 18, duration: .9, ease: 'power3.out' }, .5)
      .from(foot, { opacity: 0, y: 18, duration: .9, ease: 'power3.out' }, .62);
    intro.play();
  }

  // Gentle idle float on the temporary artwork only. A real 3D product keeps a
  // deterministic rig: idle motion there would break the chapter handoff.
  const loops = [];
  if (!hasModel && media) {
    loops.push(gsap.to(media, { y: -12, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  }
  if (cueLine) {
    loops.push(gsap.fromTo(cueLine, { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1, duration: 1.2, repeat: -1, yoyo: true, ease: 'power1.inOut' }));
  }

  // Pointer-responsive depth: a small damped offset on its own layer, composed
  // on top of the scroll-controlled base pose. Never writes the same transform
  // properties the scrub timeline owns.
  const listeners = new AbortController();
  if (fine) {
    const layers = [];
    if (depth) layers.push({ el: depth, x: gsap.quickTo(depth, 'x', { duration: .9, ease: 'power3.out' }), y: gsap.quickTo(depth, 'y', { duration: .9, ease: 'power3.out' }), scale: 16, yScale: 12 });
    if (type) layers.push({ el: type, x: gsap.quickTo(type, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(type, 'y', { duration: 1.1, ease: 'power3.out' }), scale: -7, yScale: -5 });
    const onMove = event => {
      if (document.hidden || timeline.scrollTrigger?.progress >= 1) return;
      const rx = event.clientX / window.innerWidth - .5;
      const ry = event.clientY / window.innerHeight - .5;
      for (const layer of layers) {
        layer.x(rx * layer.scale);
        layer.y(ry * layer.yScale);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true, signal: listeners.signal });
  }

  return () => {
    listeners.abort();
    loops.forEach(loop => loop.kill());
    intro?.kill();
  };
}
