import { mountCollectionHover } from './collection-hover.mjs';

// Scroll choreography for chapters 02–08 (Milestone 02.6).
// Every controller mounts inside the caller's gsap.context + matchMedia and may
// return extra cleanup. GSAP owns all initial hidden states, so no-JS and
// reduced-motion visitors always see the complete static layout.


function readCrop(element) {
  const style = element.style;
  return {
    zoom: parseFloat(style.getPropertyValue('--zoom')) || 1,
    tx: parseFloat(style.getPropertyValue('--tx')) || 0,
    ty: parseFloat(style.getPropertyValue('--ty')) || 0,
  };
}

// The next composition rises over the previous one: the incoming section is
// clipped to nothing and uncovers top-down as it scrolls into view. The clip
// lives entirely inside the motion context, so no-JS visitors are unaffected.
function wipeIn(section, gsap) {
  gsap.set(section, { clipPath: 'inset(0% 0% 100% 0%)' });
  gsap.to(section, {
    clipPath: 'inset(0% 0% 0% 0%)',
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 98%', end: 'top 4%', scrub: true },
  });
}

/* ------------------------------------------------- 02 — deconstruction */

function deconstruction(root, gsap) {
  const crops = [...root.querySelectorAll('.decon-crop')];
  if (crops.length > 1) {
    const sequence = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });
    for (let index = 1; index < crops.length; index++) {
      const at = index / crops.length - .16;
      sequence.to(crops[index - 1], { opacity: 0, duration: .1, ease: 'power1.inOut' }, at)
        .to(crops[index], { opacity: 1, duration: .1, ease: 'power1.inOut' }, at);
    }
  }
  // Slow living-macro drift on the active crop.
  const activeImage = root.querySelector('.decon-crop.is-active > img');
  const crop = activeImage ? readCrop(activeImage.parentElement) : null;
  if (activeImage && crop) {
    gsap.fromTo(activeImage, {
      scale: crop.zoom,
      xPercent: crop.tx,
      yPercent: crop.ty,
    }, {
      scale: crop.zoom * 1.05,
      yPercent: crop.ty - 2,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/* ---------------------------------------------------- 03 — materials */

function materials(root, gsap, { mobile }) {
  const panels = [...root.querySelectorAll('.mat-panel')];
  const journey = !mobile && panels.length > 1;
  if (journey) {
    // Frame owns the wipe; image owns the crop/pan. Leave the first image and
    // its copy visible at rest so the chapter has no empty entrance frame.
    root.classList.add('is-journey-host');
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * 1.25)}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    const phaseLength = 1 / panels.length;
    panels.forEach((panel, index) => {
      const image = panel.querySelector('.mat-frame > img');
      const frame = panel.querySelector('.mat-frame');
      const copy = panel.querySelector('.mat-copy');
      const crop = image ? readCrop(image) : null;
      if (copy) gsap.set(copy, { opacity: index === 0 ? 1 : 0 });
      // Discard pixel offsets parsed from the CSS fallback before applying the
      // same crop with GSAP. Otherwise the translation accumulates twice.
      if (crop) gsap.set(image, { x: 0, y: 0, scale: crop.zoom, xPercent: crop.tx, yPercent: crop.ty });
      const enter = index * phaseLength;
      if (index > 0) {
        gsap.set(panel, { autoAlpha: 0 });
        timeline.set(panel, { autoAlpha: 1 }, enter - phaseLength * .2);
        const outgoingCopy = panels[index - 1].querySelector('.mat-copy');
        // Keep one complete caption owner while the frame wipes. Switch both
        // columns atomically once most of the new landmark is established.
        const captionAt = enter + phaseLength * .055;
        if (copy) timeline.set(copy, { opacity: 1 }, captionAt);
        if (outgoingCopy) timeline.set(outgoingCopy, { opacity: 0 }, captionAt);
        timeline.fromTo(frame,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: phaseLength * .34, ease: 'none' },
          enter - phaseLength * .2);
        // The old subject stays complete behind the incoming wipe, then
        // releases after the new frame covers it. Reverse follows the same path.
        timeline.to(panels[index - 1], {
          autoAlpha: 0, duration: phaseLength * .18, ease: 'none',
        }, enter + phaseLength * .15);
      }
      if (crop) {
        const direction = index % 2 ? -1 : 1;
        // Merchant close-ups start at their authored static crop. During pan,
        // a small overscan keeps their edge inside the frame at either extreme.
        const motionZoom = Math.max(crop.zoom, 1.06);
        timeline.fromTo(image, {
          scale: motionZoom * 1.07, xPercent: crop.tx - direction * 2,
          yPercent: crop.ty + 1.5,
        }, {
          scale: motionZoom,
          xPercent: crop.tx + direction * 2,
          yPercent: crop.ty - 1.5,
          duration: phaseLength,
          ease: 'none',
        }, Math.max(0, enter - phaseLength * .18));
      }
    });
    return () => root.classList.remove('is-journey-host');
  }
  // Touch layout: flowing panels with their own settle choreography.
  panels.forEach(panel => {
    const image = panel.querySelector('.mat-frame > img');
    const crop = image ? readCrop(image) : null;
    if (image && crop) {
      const motionZoom = Math.max(crop.zoom, 1.06);
      gsap.set(image, { x: 0, y: 0, scale: crop.zoom, xPercent: crop.tx, yPercent: crop.ty });
      gsap.fromTo(image, { scale: motionZoom * 1.06, xPercent: crop.tx - 2, yPercent: crop.ty + 2 }, {
        scale: motionZoom,
        xPercent: crop.tx + 2,
        yPercent: crop.ty - 2,
        ease: 'none',
        scrollTrigger: { trigger: panel, start: 'top 92%', end: 'bottom 25%', scrub: true },
      });
    }
  });
  return undefined;
}

/* --------------------------------------------------- 04 — technology */

function technology(root, gsap) {
  const image = root.querySelector('.tech-visual img');
  const imageScale = image?.hasAttribute('data-tech-model') ? 1.5 : 1;
  if (image) gsap.fromTo(image, { scale: imageScale * 1.06, xPercent: -2 }, {
    scale: imageScale, xPercent: 2, ease: 'none',
    scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
  });
  const word = root.querySelector('[data-tech-word]');
  if (word) {
    gsap.fromTo(word, { xPercent: 4, '--tech-wght': 640 }, {
      xPercent: -7,
      '--tech-wght': 900,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  const spine = root.querySelector('[data-tech-spine]');
  const rows = root.querySelector('[data-tech-rows]');
  if (spine && rows) {
    gsap.fromTo(spine, { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: rows, start: 'top 82%', end: 'bottom 55%', scrub: true },
    });
  }
}

/* -------------------------------------------------- 05 — collection */

function collection(root, gsap, { mobile, fine }) {
  const stage = root.querySelector('[data-coll-stage]');
  const scenes = [...root.querySelectorAll('[data-coll-scene]')];

  // Premium hover: scale/lift on the nested visual wrapper as one tween,
  // pointer parallax on the image — never on elements the sequence owns.
  const hoverCleanups = fine && !mobile ? scenes.map(scene => mountCollectionHover(scene, gsap)) : [];
  const disposeHover = () => hoverCleanups.forEach(dispose => dispose());

  if (!stage || scenes.length === 0 || mobile) {
    // Flow layout: each scene gets its own arrival moment.
    scenes.forEach((scene, index) => {
      const art = scene.querySelector('.coll-scene-art');
      const copy = scene.querySelectorAll('.coll-scene-copy > *');
      gsap.from(art, {
        x: index % 2 ? 60 : -60,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: scene, start: 'top 72%', toggleActions: 'play none none reverse' },
      });
      gsap.from(copy, {
        y: 40,
        autoAlpha: 0,
        stagger: .08,
        duration: .9,
        ease: 'power3.out',
        scrollTrigger: { trigger: scene, start: 'top 62%', toggleActions: 'play none none reverse' },
      });
    });
    return disposeHover;
  }

  // Desktop: one pinned, scrub-controlled product sequence. Every fraction of
  // the timeline carries motion — intro, per-product focus, spatial
  // transitions, and the exit handoff into the featured chapter.
  root.classList.add('is-sequenced');
  const heading = [...root.querySelectorAll('.chapter-heading .heading-line > span')];
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * (.15 + scenes.length * .48))}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  const span = .9 / scenes.length;

  // Intro: the headline lands, then yields the stage to product 01.
  timeline
    .from(heading, { xPercent: 4, duration: .06, ease: 'power4.out' }, 0)
    .to(root, { backgroundColor: () => scenes[0].style.getPropertyValue('--scene-field') || '#41b4f0', duration: .07, ease: 'power1.inOut' }, 0)
    .to(heading, { yPercent: -118, autoAlpha: 0, duration: .05, ease: 'power2.in' }, .07);

  scenes.forEach((scene, index) => {
    const at = index * span;
    const art = scene.querySelector('.coll-scene-figure');
    const num = scene.querySelector('.coll-scene-num');
    const copy = scene.querySelectorAll('.coll-scene-copy > *');
    const field = scene.style.getPropertyValue('--scene-field') || '#41b4f0';
    if (index > 0) {
      const prev = scenes[index - 1];
      timeline
        .to(prev.querySelector('.coll-scene-figure'), { x: 0, xPercent: -14, scale: .84, autoAlpha: 0, duration: span * .34, ease: 'power2.in' }, at)
        .to(prev.querySelector('.coll-scene-num'), { xPercent: -26, autoAlpha: 0, duration: span * .3, ease: 'power1.in' }, at)
        .to(prev.querySelectorAll('.coll-scene-copy > *'), { y: -34, autoAlpha: 0, duration: span * .26, ease: 'power2.in', stagger: .015 }, at)
        .to(root, { backgroundColor: field, duration: span * .34, ease: 'power1.inOut' }, at);
    }
    timeline
      .fromTo(art, { x: 0, xPercent: index === 0 ? 0 : index === 1 ? -12 : 8, scale: index === 0 ? 1 : .96, autoAlpha: index === 0 ? 1 : 0 }, { x: 0, xPercent: 0, scale: 1, autoAlpha: 1, duration: span * .5, ease: 'power2.out' }, index === 0 ? 0 : at + span * .12)
      // Keep the decorative index quiet: autoAlpha: 1 overrides CSS opacity.
      .fromTo(num, { xPercent: index === 0 ? 0 : index % 2 ? -18 : 22, autoAlpha: index === 0 ? .12 : 0 }, { xPercent: 0, autoAlpha: .12, duration: span * .46, ease: 'power2.out' }, index === 0 ? .015 : at + span * .1)
      .fromTo(copy, { y: index === 0 ? 0 : 46, autoAlpha: index === 0 ? 1 : 0 }, { y: 0, autoAlpha: 1, duration: span * .4, ease: 'power3.out', stagger: .02 }, index === 0 ? .05 : at + span * .24);
    // Continuous in-phase drift: the numeral and the product keep moving.
    timeline
      .fromTo(num, { yPercent: index % 2 ? 8 : -6 }, { yPercent: index % 2 ? -6 : 8, duration: span, ease: 'none' }, at)
      .fromTo(art, { y: index % 2 ? 14 : -12 }, { y: index % 2 ? -12 : 14, duration: span, ease: 'none' }, at);
  });

  // Exit: the final composition recedes while the stage resolves into the
  // featured chapter's surface — no blank frames.
  const last = scenes[scenes.length - 1];
  // Keep the final title, context and link visible through the handoff. Fading
  // these within the pin leaves an apparently broken, empty half-screen.
  timeline
    .to(last.querySelector('.coll-scene-figure'), { scale: 1, yPercent: -2, duration: span * .3, ease: 'power1.inOut' }, .9)
    .to(last.querySelector('.coll-scene-num'), { yPercent: 0, duration: span * .28, ease: 'power1.in' }, .9)

  return () => {
    disposeHover();
    root.classList.remove('is-sequenced');
  };
}


/* ----------------------------------------------------- 06 — featured */

function featured(root, gsap) {
  const image = root.querySelector('.feat-frame > img');
  if (image) {
    const model = image.hasAttribute('data-featured-model');
    // Keep the complete silhouette inside the frame: a light drift only.
    // Larger scales crop the shoe mid-scroll and read as broken imagery.
    const scale = model ? 1.08 : 1;
    const drift = model ? 1.2 : 1.6;
    gsap.fromTo(image, { yPercent: -drift, scale }, {
      yPercent: drift,
      scale,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/* -------------------------------------------------------- 07 — brand */

function brand(root, gsap, { mobile }) {
  const stage = root.querySelector('[data-brand-stage]');
  if (!stage) return;
  const image = root.querySelector('.brand-visual > img');
  const visual = root.querySelector('.brand-visual');
  const editorial = root.querySelector('.brand-editorial');
  const lines = root.querySelectorAll('.brand-line > span');
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top 80%',
      end: 'bottom 25%',
      pin: false,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  const crop = 1.02;
  if (image) timeline.fromTo(image, { scale: crop, xPercent: -1, yPercent: 0 }, {
    scale: crop, xPercent: 1, yPercent: 0, duration: 1, ease: 'none',
  }, 0);

  if (editorial) timeline.fromTo(editorial, { xPercent: mobile ? 0 : -3 }, { xPercent: -1, duration: 1, ease: 'none' }, 0);
  if (lines.length) timeline.to(lines, { '--brand-wght': 680, duration: 1, ease: 'none' }, 0);
  const rule = root.querySelector('[data-brand-rule]');
  if (rule) timeline.fromTo(rule, { scaleX: .45 }, { scaleX: 1, duration: 1, ease: 'none' }, 0);
}

/* ------------------------------------------------------- 08 — finale */

function finale(root, gsap, { mobile }) {
  const stage = root.querySelector('[data-finale-stage]');
  if (!stage) return;
  const shoe = root.querySelector('[data-finale-shoe]');
  const heading = root.querySelector('.finale-heading');
  const context = root.querySelectorAll('.finale-kicker, .finale-sub, .finale-price');
  const controls = root.querySelector('.finale-actions');
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: stage, start: mobile ? 'top 85%' : 'top top',
    end: mobile ? 'clamp(bottom bottom)' : () => `+=${Math.round(window.innerHeight * .8)}`,
    pin: !mobile, scrub: true, invalidateOnRefresh: true,
  }});
  timeline.fromTo(shoe, { scale: .94, xPercent: -4, yPercent: 0, autoAlpha: 1 },
    { scale: 1, xPercent: 0, yPercent: 0, autoAlpha: 1, duration: .72, ease: 'none' }, 0);
  const titleParts = root.querySelectorAll('.finale-heading .heading-line');
  titleParts.forEach((part, index) => timeline.fromTo(part,
    { x: (index === 0 ? -1 : 1) * 14, y: index === 0 ? -16 : 16, autoAlpha: .45 },
    { x: 0, y: 0, autoAlpha: 1, duration: .4, ease: 'none' }, .3));
  if (context.length) timeline.fromTo(context, { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: .2, ease: 'none' }, .58);
  if (controls) timeline.fromTo(controls, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: .2, ease: 'none' }, .8);
}

const CONTROLLERS = { deconstruction, materials, technology, collection, featured, brand, finale };

export function mountChapter(root, { gsap, mobile, fine }) {
  const controller = CONTROLLERS[root.dataset.chapter];
  if (!controller) return undefined;
  const dispose = controller(root, gsap, { mobile, fine }) || undefined;
  // Chapter handoff: the incoming composition rises over the previous one.
  // Desktop only — the flowing mobile layout keeps its own arrival motion.
  if (!mobile && (root.dataset.chapter === 'deconstruction' || root.dataset.chapter === 'featured')) {
    wipeIn(root, gsap);
  }
  return dispose;
}
