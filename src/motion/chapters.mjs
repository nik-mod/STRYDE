import { mountCollectionHover } from './collection-hover.mjs';

// Scroll choreography for chapters 02–08 (Milestone 02.6).
// Every controller mounts inside the caller's gsap.context + matchMedia and may
// return extra cleanup. GSAP owns all initial hidden states, so no-JS and
// reduced-motion visitors always see the complete static layout.

const clamp01 = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

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

// Shared-field chapters arrive instead: content rises into place once.
function arrive(section, gsap) {
  const flow = section.querySelectorAll(':scope > *');
  gsap.from(flow, {
    y: 56,
    autoAlpha: 0,
    stagger: .07,
    duration: .9,
    ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none reverse' },
  });
}

function revealLineMasks(sections, gsap, { scrub = false } = {}) {
  sections.forEach((span, index) => {
    gsap.from(span, {
      yPercent: 115,
      duration: 1,
      ease: 'power4.out',
      delay: scrub ? 0 : index * .09,
      scrollTrigger: scrub
        ? { trigger: span, start: 'top 92%', end: 'top 55%', scrub: true }
        : { trigger: span, start: 'top 92%', toggleActions: 'play none none reverse' },
    });
  });
}

/* ------------------------------------------------- 02 — deconstruction */

function deconstruction(root, gsap) {
  arrive(root, gsap);
  const crops = [...root.querySelectorAll('.decon-crop')];
  if (crops.length > 1) {
    const sequence = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top 45%', end: 'bottom 75%', scrub: true },
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
  root.querySelectorAll('.decon-item').forEach(item => {
    gsap.from(item, {
      x: -28,
      autoAlpha: 0,
      duration: .8,
      ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  });
}

/* ---------------------------------------------------- 03 — materials */

function materials(root, gsap, { mobile }) {
  arrive(root, gsap);
  const panels = [...root.querySelectorAll('.mat-panel')];
  const journey = !mobile && panels.length > 1;
  if (journey) {
    // Pinned macro journey on desktop: the whole section becomes a viewport
    // stage; phases crossfade with depth as the scroll advances.
    const stage = root.querySelector('[data-mat-panels]');
    root.classList.add('is-journey-host');
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * 2.2)}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    const phaseLength = 1 / panels.length;
    panels.forEach((panel, index) => {
      const image = panel.querySelector('.mat-frame > img');
      const crop = image ? readCrop(image) : null;
      // Discard pixel offsets parsed from the CSS fallback before applying the
      // same crop with GSAP. Otherwise the translation accumulates twice.
      if (crop) gsap.set(image, { x: 0, y: 0, scale: crop.zoom, xPercent: crop.tx, yPercent: crop.ty });
      const enter = index * phaseLength;
      const leave = enter + phaseLength;
      if (index > 0) {
        timeline.fromTo(panel,
          { autoAlpha: 0, scale: 1.09, yPercent: 4 },
          { autoAlpha: 1, scale: 1, yPercent: 0, duration: phaseLength * .5, ease: 'power1.inOut' },
          enter - phaseLength * .22);
      }
      if (crop) {
        timeline.fromTo(image, { scale: crop.zoom * 1.12 }, {
          scale: crop.zoom,
          duration: phaseLength * .8,
          ease: 'power1.out',
        }, Math.max(0, enter - phaseLength * .18));
      }
      const copy = panel.querySelector('.mat-copy');
      if (copy) {
        if (index > 0) {
          timeline.from(copy.children, {
            y: 44,
            autoAlpha: 0,
            stagger: .06,
            duration: phaseLength * .4,
            ease: 'power3.out',
          }, enter + phaseLength * .08);
        } else {
          // The first phase's copy is part of the resting composition.
          gsap.from(copy.children, {
            y: 44,
            autoAlpha: 0,
            stagger: .06,
            duration: .9,
            ease: 'power3.out',
            scrollTrigger: { trigger: root, start: 'top 72%', toggleActions: 'play none none reverse' },
          });
        }
      }
      if (index < panels.length - 1) {
        timeline.to(panel, {
          autoAlpha: 0,
          scale: .965,
          yPercent: -4,
          duration: phaseLength * .3,
          ease: 'power1.in',
        }, leave - phaseLength * .3);
      }
    });
    return () => root.classList.remove('is-journey-host');
  }
  // Touch layout: flowing panels with their own settle choreography.
  panels.forEach(panel => {
    const image = panel.querySelector('.mat-frame > img');
    const crop = image ? readCrop(image) : null;
    if (image && crop) {
      gsap.set(image, { x: 0, y: 0, scale: crop.zoom, xPercent: crop.tx, yPercent: crop.ty });
      gsap.fromTo(image, { scale: crop.zoom * 1.14, yPercent: crop.ty - 3 }, {
        scale: crop.zoom,
        yPercent: crop.ty,
        ease: 'none',
        scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top 20%', scrub: true },
      });
    }
    const copy = panel.querySelector('.mat-copy');
    if (copy) {
      gsap.from(copy.children, {
        y: 42,
        autoAlpha: 0,
        stagger: .1,
        duration: .9,
        ease: 'power3.out',
        scrollTrigger: { trigger: panel, start: 'top 75%', toggleActions: 'play none none reverse' },
      });
    }
  });
  return undefined;
}

/* --------------------------------------------------- 04 — technology */

function technology(root, gsap) {
  wipeIn(root, gsap);
  const words = [...root.querySelectorAll('.tech-heading .heading-word-inner')];
  if (words.length) {
    gsap.from(words, {
      yPercent: 118,
      stagger: .09,
      duration: 1,
      ease: 'power4.out',
      scrollTrigger: { trigger: root, start: 'top 55%', toggleActions: 'play none none reverse' },
    });
  }
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
  root.querySelectorAll('.tech-row').forEach((row, index) => {
    gsap.from(row, {
      x: -34,
      autoAlpha: 0,
      duration: .85,
      delay: index * .05,
      ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 86%', toggleActions: 'play none none reverse' },
    });
  });
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
      end: () => `+=${Math.round(window.innerHeight * (1.15 + scenes.length * 1.15))}`,
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
      .fromTo(art, { x: 0, xPercent: index === 0 ? 10 : 18, scale: .9, autoAlpha: 0 }, { x: 0, xPercent: 0, scale: 1, autoAlpha: 1, duration: span * .5, ease: 'power2.out' }, index === 0 ? 0 : at + span * .12)
      .fromTo(num, { xPercent: index % 2 ? -18 : 22, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: span * .46, ease: 'power2.out' }, index === 0 ? .015 : at + span * .1)
      .fromTo(copy, { y: 46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: span * .4, ease: 'power3.out', stagger: .02 }, index === 0 ? .05 : at + span * .24);
    // Continuous in-phase drift: the numeral and the product keep moving.
    timeline
      .fromTo(num, { yPercent: index % 2 ? 8 : -6 }, { yPercent: index % 2 ? -6 : 8, duration: span, ease: 'none' }, at)
      .fromTo(art, { y: index % 2 ? 14 : -12 }, { y: index % 2 ? -12 : 14, duration: span, ease: 'none' }, at);
  });

  // Exit: the final composition recedes while the stage resolves into the
  // featured chapter's surface — no blank frames.
  const last = scenes[scenes.length - 1];
  // Exit: copy lifts away but the product stays on stage through the pin's
  // end — the featured chapter arrives over the receding composition, so no
  // blank frame can exist between the chapters.
  timeline
    .to(last.querySelector('.coll-scene-figure'), { scale: .88, yPercent: -10, duration: span * .3, ease: 'power1.inOut' }, .9)
    .to(last.querySelectorAll('.coll-scene-copy > *'), { autoAlpha: 0, y: -26, duration: span * .22, ease: 'power1.in', stagger: .012 }, .9)
    .to(last.querySelector('.coll-scene-num'), { yPercent: 14, duration: span * .28, ease: 'power1.in' }, .9)

  return () => {
    disposeHover();
    root.classList.remove('is-sequenced');
  };
}


/* ----------------------------------------------------- 06 — featured */

function featured(root, gsap) {
  arrive(root, gsap);
  const image = root.querySelector('.feat-frame > img');
  if (image) {
    gsap.fromTo(image, { yPercent: -9, scale: 1.08 }, {
      yPercent: 9,
      scale: 1.08,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  const frame = root.querySelector('.feat-frame');
  if (frame) {
    gsap.from(frame, {
      rotate: -6,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 30%', scrub: true },
    });
  }
  const copy = root.querySelector('.feat-copy');
  if (copy) {
    gsap.from(copy.children, {
      y: 42,
      autoAlpha: 0,
      stagger: .09,
      duration: .9,
      ease: 'power3.out',
      scrollTrigger: { trigger: copy, start: 'top 76%', toggleActions: 'play none none reverse' },
    });
  }
}

/* -------------------------------------------------------- 07 — brand */

function brand(root, gsap) {
  wipeIn(root, gsap);
  const stage = root.querySelector('[data-brand-stage]');
  if (!stage) return;
  const quiet = [...root.querySelectorAll('.brand-line-quiet > span')];
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: '+=160%',
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  timeline
    .fromTo('[data-brand-rule]', { scaleX: 0 }, { scaleX: 1, duration: .16, ease: 'power2.inOut' }, 0)
    .fromTo('[data-brand-watermark]', { scale: .9, autoAlpha: .35 }, { scale: 1.08, autoAlpha: 1, duration: .5, ease: 'power1.out' }, 0)
    .from(quiet.slice(1), { yPercent: 118, duration: .22, ease: 'power4.out' }, .12)
    .to('.brand-line-quiet > span', { '--brand-wght': 620, duration: .4, ease: 'none' }, .2)
    .from('.brand-line-loud > span', { yPercent: 118, duration: .2, ease: 'power4.out' }, .2)
    .from('.brand-manifesto', { y: 44, autoAlpha: 0, duration: .22, ease: 'power3.out' }, .4)
    .to({}, { duration: .16 });
  // Watermark keeps drifting behind the pinned composition.
  gsap.fromTo('[data-brand-watermark]', { yPercent: -3 }, {
    yPercent: 3,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

/* ------------------------------------------------------- 08 — finale */

function finale(root, gsap) {
  wipeIn(root, gsap);
  const stage = root.querySelector('[data-finale-stage]');
  if (!stage) return;
  const word = root.querySelector('[data-finale-word]');
  if (word) gsap.set(word, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: '+=200%',
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  timeline
    .fromTo('[data-finale-spot]', { autoAlpha: 0, scale: .5 }, { autoAlpha: 1, scale: 1.15, duration: .3, ease: 'power1.out' }, 0)
    .fromTo('[data-finale-shoe]', { y: '10vh', scale: .86, rotation: -4, autoAlpha: 1 }, { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: .38, ease: 'power2.out' }, 0)
    .fromTo('[data-finale-word]', { x: 0, y: 0, autoAlpha: 0, scale: .72 }, { x: 0, y: 0, autoAlpha: 1, scale: 1.04, duration: .34, ease: 'power1.out' }, .2)
    .from('[data-finale-floor]', { scaleX: 0, duration: .16, ease: 'power2.inOut' }, .3)
    .from('.finale-kicker', { autoAlpha: 0, duration: .1 }, .34)
    .from('.finale-heading .heading-line > span', { yPercent: 118, duration: .18, ease: 'power4.out', stagger: .06 }, .4)
    .to('.finale-heading .heading-line > span', { '--brand-wght': 880, duration: .26, ease: 'none' }, .46)
    .from('.finale-sub', { y: 30, autoAlpha: 0, duration: .12, ease: 'power3.out' }, .6)
    .from('.finale-price', { autoAlpha: 0, duration: .08 }, .68)
    .fromTo('.finale-actions .hero-cart, .finale-actions .finale-ghost', { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .05, duration: .12, ease: 'power3.out' }, .72)
    .to({}, { duration: .14 });
  // The outlined word keeps a slow counter-drift behind the product.
  if (word) {
    timeline.fromTo(word, { yPercent: -44 }, {
      yPercent: -56,
      duration: 1,
      ease: 'none',
    }, 0);
  }
}

const CONTROLLERS = { deconstruction, materials, technology, collection, featured, brand, finale };

export function mountChapter(root, { gsap, mobile, fine }) {
  const controller = CONTROLLERS[root.dataset.chapter];
  if (!controller) return undefined;
  return controller(root, gsap, { mobile, fine }) || undefined;
}
