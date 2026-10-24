import { chapterState } from './contracts.mjs';

// The accessible heading stays intact in Liquid. Only the decorative copy is
// split; restore it on teardown so editor remounts cannot nest glyph wrappers.
function splitDisplayLine(line) {
  if (!line?.replaceChildren || !line.ownerDocument) return { glyphs: [], restore() {} };
  const text = line.textContent;
  const glyphs = Array.from(text).map(character => {
    const glyph = line.ownerDocument.createElement('span');
    glyph.className = 'hero-glyph';
    glyph.textContent = character;
    glyph.dataset.glyph = character;
    return glyph;
  });
  line.replaceChildren(...glyphs);
  return { glyphs, restore() { line.textContent = text; } };
}

export function mountHero(root, { gsap, bus, mobile, hasModel = false, fine = false, surface = '#effaff', paper = '#b7ddef' }) {
  const stage = root.querySelector('[data-hero-stage]');
  const line1 = root.querySelector('[data-hero-line-1]');
  const line2 = root.querySelector('[data-hero-line-2]');
  const art = root.querySelector('[data-hero-art]');
  const depth = root.querySelector('[data-hero-depth]');
  const type = root.querySelector('[data-hero-type]');
  const media = root.querySelector('[data-scene-host]');
  const ring = root.querySelector('[data-hero-ring]');
  const copy = root.querySelector('[data-hero-copy]');
  const foot = root.querySelector('[data-hero-foot]');
  const cue = root.querySelector('[data-hero-cue]');
  const cueLine = root.querySelector('[data-hero-cue-line]');
  const ticker = root.querySelector('[data-hero-ticker]');
  if (!stage) return;

  const arrival = root.querySelector('[data-hero-arrival]') || art;
  const study = root.querySelector('[data-hero-study]');
  const studyLabel = root.querySelector('[data-hero-study-label]');
  const studyProgress = root.querySelector('[data-hero-study-progress]');
  const atmosphere = root.querySelector('.hero-atmo');
  const edition = root.querySelector('.hero-edition');
  const light = root.querySelector('[data-hero-launch-light]');
  const statement = root.querySelector('[data-hero-statement]');
  const first = splitDisplayLine(line1);
  const second = splitDisplayLine(line2);
  const travel = mobile ? .85 : 1.65;
  let lastStudy = -1;
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
        const studyIndex = self.progress < .18 ? 0 : self.progress < .46 ? 1 : self.progress < .72 ? 2 : 3;
        if (studyLabel && lastStudy !== studyIndex) {
          studyLabel.textContent = ['01 / THE SILHOUETTE', '02 / IN MOTION', '03 / A CLOSER LOOK', '04 / EVERY LINE'][studyIndex];
          lastStudy = studyIndex;
        }
        bus.publish(chapterState(0, self.progress, self.direction));
      },
    },
  });

  // Scroll owns the outer composition; arrival owns a nested layer. Their
  // transforms never compete when someone scrolls before the opening finishes.
  timeline
    .fromTo(line1, { xPercent: 0, scale: 1, yPercent: 0 }, { xPercent: -3, scale: .98, yPercent: -5, immediateRender: false, duration: .72 }, 0)
    .fromTo(line2, { xPercent: 0, scale: 1, yPercent: 0 }, { xPercent: 4, scale: .98, yPercent: 6, immediateRender: false, duration: .72 }, 0)
    .fromTo(copy, { opacity: 1, y: 0 }, { opacity: .6, y: -12, immediateRender: false, duration: .72 }, 0)
    .fromTo(foot, { opacity: 1, y: 0 }, { opacity: 1, y: 0, immediateRender: false, duration: .82 }, 0)
    .to(foot, { opacity: 0, y: -16, duration: .18 }, .82)
    .fromTo(art, { scale: 1, xPercent: 0, yPercent: 0, rotation: 0 }, {
      scale: hasModel ? 1 : 1.08, xPercent: mobile ? 0 : -2, yPercent: -2,
      rotation: hasModel ? 0 : -5, immediateRender: false, duration: .46,
    }, 0)
    .to(art, { scale: hasModel ? 1 : 1.14, yPercent: -1, rotation: 0, duration: .26 }, .46)
    .to(art, { scale: 1, xPercent: 0, yPercent: 0, rotation: 0, duration: .18 }, .72)
    .to(cue, { opacity: 0, duration: .1 }, .02)
    .to(ticker, { opacity: 0, duration: .12 }, .02)
    .to(ring, { opacity: 0, duration: .2 }, .1)
    .fromTo(stage, { backgroundColor: paper }, { backgroundColor: surface, immediateRender: true, duration: 1, ease: progress => Math.max(0, (progress - .7) / .3) }, 0);
  if (studyProgress) timeline.fromTo(studyProgress, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
  if (study) timeline.to(study, { opacity: 0, y: -10, duration: .16 }, .84);
  if (atmosphere) timeline.fromTo(atmosphere, { xPercent: 0, opacity: 1 }, { xPercent: -5, opacity: .3, duration: 1 }, 0);
  if (edition) timeline.to(edition, { opacity: 0, duration: .15 }, .1);
  if (light) timeline.to(light, { opacity: 0, duration: .05 }, 0);

  // Entrance choreography (not scroll-bound). Only created when the visitor is
  // near the top: a paused .from() timeline applies its hidden start states on
  // creation, so building it mid-page would blank the hero.
  if ((window.scrollY || 0) < stage.offsetHeight * .4) {
    intro = gsap.timeline({ paused: true });
    // One short launch, with the product and action available before the
    // lettering finishes. Glyphs and scroll transforms have separate owners.
    const letterArrival = (glyphs, fallback, at, reverse = false) => {
      if (glyphs.length) {
        intro.fromTo(glyphs,
          { yPercent: 115, rotationX: -72, rotationZ: reverse ? -5 : 5, opacity: 0, transformOrigin: '50% 100% -20px' },
          { yPercent: 0, rotationX: 0, rotationZ: 0, opacity: 1, duration: 1.05,
            stagger: { each: .045, from: reverse ? 'end' : 'start' }, ease: 'expo.out' }, at);
      } else {
        intro.fromTo(fallback, { yPercent: 112, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.25, ease: 'expo.out' }, at);
      }
    };
    letterArrival(first.glyphs, line1, .04);
    letterArrival(second.glyphs, line2, .22, true);
    if (second.glyphs.length) intro.fromTo(second.glyphs, { '--glyph-fill': 0 }, {
      '--glyph-fill': 1, duration: .55, stagger: .045, ease: 'power2.inOut',
    }, .62);
    intro
      .fromTo(arrival, { opacity: 0, scale: 1.16, xPercent: 12, y: 48, rotation: -12 },
        { opacity: 1, scale: 1, xPercent: 0, y: 0, rotation: 0, duration: 1.65, ease: 'expo.out' }, .1)
      .fromTo(ring, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out' }, .4)
      .fromTo(copy, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, .48)
      .fromTo(foot, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, .58);
    if (statement) intro.fromTo(statement, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .7, ease: 'power3.inOut' }, .52);
    if (edition) intro.fromTo(edition, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .7 }, .25);
    if (study) intro.fromTo(study, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .8 }, .9);
    if (light) intro.fromTo(light, { xPercent: -110, opacity: 0 }, { xPercent: 110, opacity: .65, duration: 1.7, ease: 'power2.inOut' }, .05)
      .to(light, { opacity: 0, duration: .3 }, 1.45);
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
    if (type) layers.push({ el: type, x: gsap.quickTo(type, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(type, 'y', { duration: 1.1, ease: 'power3.out' }), scale: -7, yScale: -5 });
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
    first.restore();
    second.restore();
  };
}
