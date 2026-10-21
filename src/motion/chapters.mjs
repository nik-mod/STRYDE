// Scroll choreography for chapters 02–08 (Milestone 02.5).
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
      if (crop) gsap.set(image, { scale: crop.zoom, xPercent: crop.tx, yPercent: crop.ty });
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
      gsap.set(image, { scale: crop.zoom, xPercent: crop.tx, yPercent: crop.ty });
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
  const viewport = root.querySelector('[data-coll-viewport]');
  const track = root.querySelector('[data-coll-track]');
  if (!viewport || !track) return undefined;

  // Premium hover: scale/lift live on the nested visual wrapper as one tween,
  // pointer parallax on the image itself — never on the card the horizontal
  // tween owns. Fine pointers only; reduced motion never mounts this controller.
  const listeners = new AbortController();
  if (fine && !mobile) {
    root.querySelectorAll('.coll-card').forEach(card => {
      const visual = card.querySelector('[data-coll-visual]');
      const image = visual?.querySelector('img');
      if (!visual || !image) return;
      const driftX = gsap.quickTo(image, 'x', { duration: .7, ease: 'power3.out' });
      const driftY = gsap.quickTo(image, 'y', { duration: .7, ease: 'power3.out' });
      const enter = () => {
        gsap.to(visual, { scale: 1.055, y: -12, duration: .55, ease: 'power3.out', overwrite: 'auto' });
      };
      const leave = () => {
        gsap.to(visual, { scale: 1, y: 0, duration: .55, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(image, { x: 0, y: 0, duration: .7, ease: 'power3.out', overwrite: 'auto' });
      };
      const move = event => {
        const rect = card.getBoundingClientRect();
        driftX(((event.clientX - rect.left) / rect.width - .5) * 9);
        driftY(((event.clientY - rect.top) / rect.height - .5) * 7);
      };
      card.addEventListener('pointerenter', enter, { signal: listeners.signal });
      card.addEventListener('pointermove', move, { signal: listeners.signal });
      card.addEventListener('pointerleave', leave, { signal: listeners.signal });
    });
  }

  if (mobile) return () => listeners.abort();
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth + parseFloat(getComputedStyle(track).paddingRight || 0));
  if (distance() <= 0) return () => listeners.abort();
  viewport.classList.add('is-pinned');
  root.classList.add('is-reel-host');
  const horizontal = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: () => `+=${Math.round(distance())}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  // Spatial depth: cards arrive from slightly recessed poses as the reel
  // advances, driven by the horizontal tween through containerAnimation. The
  // first card is already on screen when the pin engages, so it skips the
  // entrance — its trigger would sit behind the container origin.
  root.querySelectorAll('.coll-card').forEach((card, index) => {
    if (index === 0) return;
    gsap.fromTo(card, { scale: .96, y: 30, autoAlpha: .4 }, {
      scale: 1,
      y: 0,
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: card,
        containerAnimation: horizontal,
        start: 'left 96%',
        end: 'left 58%',
        scrub: true,
      },
    });
  });
  const heading = root.querySelector('.chapter-heading');
  if (heading) {
    gsap.from(heading.querySelectorAll('.heading-line > span'), {
      yPercent: 115,
      duration: 1,
      ease: 'power4.out',
      scrollTrigger: { trigger: root, start: 'top 62%', toggleActions: 'play none none reverse' },
    });
  }
  return () => {
    listeners.abort();
    viewport.classList.remove('is-pinned');
    root.classList.remove('is-reel-host');
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
    .fromTo('[data-brand-watermark]', { scale: .82, autoAlpha: 0 }, { scale: 1.08, autoAlpha: 1, duration: .5, ease: 'power1.out' }, .05)
    .from('.brand-line-quiet > span', { yPercent: 118, duration: .22, ease: 'power4.out', stagger: .04 }, .16)
    .to('.brand-line-quiet > span', { '--brand-wght': 620, duration: .4, ease: 'none' }, .2)
    .from('.brand-line-loud > span', { yPercent: 118, duration: .2, ease: 'power4.out' }, .4)
    .from('.brand-manifesto', { y: 44, autoAlpha: 0, duration: .22, ease: 'power3.out' }, .62)
    .to({}, { duration: .16 });
  // Watermark keeps drifting behind the pinned composition.
  gsap.fromTo('[data-brand-watermark]', { yPercent: -47 }, {
    yPercent: -53,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

/* ------------------------------------------------------- 08 — finale */

function finale(root, gsap) {
  wipeIn(root, gsap);
  const stage = root.querySelector('[data-finale-stage]');
  if (!stage) return;
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: '+=170%',
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  timeline
    .fromTo('[data-finale-spot]', { autoAlpha: 0, scale: .55 }, { autoAlpha: 1, scale: 1.12, duration: .34, ease: 'power1.out' }, 0)
    .fromTo('[data-finale-shoe]', { y: '16vh', scale: .82, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .4, ease: 'power2.out' }, .1)
    .from('[data-finale-floor]', { scaleX: 0, duration: .18, ease: 'power2.inOut' }, .3)
    .from('.finale-kicker', { autoAlpha: 0, duration: .12 }, .34)
    .from('.finale-heading .heading-line > span', { yPercent: 118, duration: .2, ease: 'power4.out', stagger: .07 }, .4)
    .to('.finale-heading .heading-line > span', { '--brand-wght': 880, duration: .3, ease: 'none' }, .45)
    .from('.finale-sub', { y: 30, autoAlpha: 0, duration: .14, ease: 'power3.out' }, .62)
    .from('.finale-price', { autoAlpha: 0, duration: .1 }, .7)
    .from('.finale-actions > *', { y: 34, autoAlpha: 0, stagger: .06, duration: .14, ease: 'power3.out' }, .74)
    .to({}, { duration: .12 });
}

const CONTROLLERS = { deconstruction, materials, technology, collection, featured, brand, finale };

export function mountChapter(root, { gsap, mobile, fine }) {
  const controller = CONTROLLERS[root.dataset.chapter];
  if (!controller) return undefined;
  return controller(root, gsap, { mobile, fine }) || undefined;
}
