import { chapterState } from './contracts.mjs';

// Phase boundaries mirror HERO_PHASES in contracts.mjs. Positions are fractions
// of the pinned travel, so every tween is authored, reversible and scrub-safe.
const DEPTH_END = .18;
const TRANSFORM_END = .46;
const MACRO_END = .72;
const HANDOFF_END = .9;

export function mountHero(root, { gsap, bus, mobile, hasModel = false, fine = false, surface = '#effaff', paper = '#b7ddef' }) {
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

  const travel = mobile ? .65 : 1.05;
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
        // A fast jump can initialize scrub tweens while delayed entrance
        // children still own hidden states. Settle that entrance once, then
        // render this exact scroll position again from canonical start values.
        if (intro && self.progress > 0) {
          intro.progress(1).kill();
          intro = null;
          timeline.invalidate().progress(0, true).progress(self.progress, true);
        }
        bus.publish(chapterState(0, self.progress, self.direction));
      },
    },
  });

  // The whole headline remains a stable reading zone. Product poses are
  // scrubbed by the existing bus; HTML never masks away individual words.
  timeline
    .fromTo(line1, { xPercent: 0, scale: 1, yPercent: 0 }, { xPercent: 2, scale: 1, yPercent: 0, immediateRender: false, duration: .46, ease: 'none' }, 0)
    .to(line1, { xPercent: 0, duration: .44, ease: 'none' }, .46)
    .fromTo(line2, { xPercent: 0, scale: 1, yPercent: 0 }, { xPercent: -1.5, scale: 1, yPercent: 0, immediateRender: false, duration: .46, ease: 'none' }, 0)
    .to(line2, { xPercent: 0, duration: .44, ease: 'none' }, .46)
    .fromTo(copy, { opacity: 1, y: 0 }, { opacity: 1, y: 0, immediateRender: false, duration: 1 }, 0)
    .fromTo(foot, { opacity: 1, y: 0 }, { opacity: 1, y: 0, immediateRender: false, duration: .82 }, 0)
    .to(foot, { opacity: 0, y: -16, duration: .18 }, .82)
    .fromTo(art, { scale: 1, xPercent: 0, yPercent: 0, rotation: 0 }, { scale: hasModel ? 1.03 : 1, xPercent: 0, yPercent: 0, rotation: 0, immediateRender: false, duration: .46, ease: 'none' }, 0)
    .to(art, { scale: 1, xPercent: 0, yPercent: 0, rotation: 0, duration: .44, ease: 'none' }, .46)
    .to(cue, { opacity: 0, duration: .12 }, .05)
    .to(ring, { opacity: 0, duration: .2 }, .1)
    .fromTo(stage, { backgroundColor: paper }, { backgroundColor: surface, immediateRender: true, duration: 1, ease: progress => Math.max(0, (progress - .7) / .3) }, 0);

  // Entrance choreography (not scroll-bound). Only created when the visitor is
  // near the top: a paused .from() timeline applies its hidden start states on
  // creation, so building it mid-page would blank the hero.
  if ((window.scrollY || 0) < stage.offsetHeight * .4) {
    intro = gsap.timeline({ paused: true });
    intro
      .fromTo(line1, { yPercent: 114 }, { yPercent: 0, duration: 1.1, ease: 'power4.out' }, 0)
      .fromTo(line2, { yPercent: 114 }, { yPercent: 0, duration: 1.1, ease: 'power4.out' }, .12)
      .fromTo(art, { opacity: 0, scale: .92, y: 26 }, { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power3.out' }, .18)
      .fromTo(ring, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out' }, .4)
      .fromTo(copy, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, .5)
      .fromTo(foot, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, .62);
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
