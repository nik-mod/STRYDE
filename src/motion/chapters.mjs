import { mountFormEdit } from './form-edit.mjs';
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
  const items = [...root.querySelectorAll('.decon-item')];
  // The ghost numeral shares the outlined-numeral language with chapter 03
  // and keeps drifting through the whole chapter, tying the two fields.
  const ghost = root.querySelector('.decon-ghost');
  if (ghost) {
    gsap.fromTo(ghost, { yPercent: 14 }, {
      yPercent: -14, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  if (crops.length > 1) {
    const sequence = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });
    for (let index = 1; index < crops.length; index++) {
      const at = index / crops.length - .16;
      // Replace both image owners at the same instant. A sequential fade
      // leaves an empty shoe-shaped gap during ordinary and fast scrolling.
      sequence.set(crops[index - 1], { opacity: 0 }, at)
        .set(crops[index], { opacity: 1 }, at);
    }
    // Technical annotations sit on the frame and swap with the same
    // timeline positions as the crops, so the label always names the
    // study actually on screen — the note is attached to the image.
    const notes = [...root.querySelectorAll('[data-decon-note]')];
    if (notes.length === crops.length) {
      notes.forEach((note, index) => gsap.set(note, { autoAlpha: index === 0 ? 1 : 0 }));
      for (let index = 1; index < crops.length; index++) {
        const at = index / crops.length - .16;
        sequence.to(notes[index - 1], { autoAlpha: 0, yPercent: -22, duration: .08, ease: 'power1.inOut' }, at)
          .fromTo(notes[index], { autoAlpha: 0, yPercent: 22 }, { autoAlpha: 1, yPercent: 0, duration: .08, ease: 'power1.inOut' }, at + .09);
      }
    }
    // The reading list tracks the crop sequence: the group matching the
    // active study stays at full ink, the rest recede. Same timeline, so
    // reverse scrolling stays in lockstep with the imagery.
    if (items.length >= crops.length) {
      const groups = crops.map((_, crop) => [
        Math.floor(crop * items.length / crops.length),
        Math.floor((crop + 1) * items.length / crops.length),
      ]);
      items.forEach((item, index) => gsap.set(item, { opacity: groups[0][0] <= index && index < groups[0][1] ? 1 : .82 }));
      for (let crop = 1; crop < crops.length; crop++) {
        const at = crop / crops.length - .16;
        for (let group = 0; group < groups.length; group++) {
          const opacity = group === crop ? 1 : .82;
          for (let index = groups[group][0]; index < groups[group][1]; index++) {
            sequence.to(items[index], { opacity, duration: .12, ease: 'power1.inOut' }, at);
          }
        }
      }
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
  const railItems = [...(root.querySelector?.('[data-mat-rail]')?.children ?? [])];
  const links = [...root.querySelectorAll('[data-study-index]')];
  const select = active => {
    root.dataset.materialActive = String(active);
    railItems.forEach((item, index) => item.classList.toggle('is-active', index === active));
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  };
  select(0);
  if (!mobile && panels.length > 1) {
    root.classList.add('is-journey-host');
    const timeline = gsap.timeline({ scrollTrigger: {
      trigger: root, start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 1.7)}`,
      pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true,
    }});
    // The live shoe keeps turning through the boundary. Captions use a staged
    // masked reveal so two different product titles never overlap.
    timeline.to({ progress: 0 }, { progress: 1, duration: 1, ease: 'none' }, 0);
    panels.forEach((panel, index) => {
      const copy = panel.querySelector('.mat-copy');
      const frame = panel.querySelector('.mat-frame');
      const image = panel.querySelector('.mat-frame > img');
      const rule = panel.querySelector('.mat-rule');
      gsap.set(panel, { autoAlpha: index === 0 ? 1 : 0 });
      if (copy) gsap.set(copy, { opacity: 1 });
      if (frame) gsap.set(frame, { clipPath: 'inset(0% 0% 0% 0%)' });
      if (index > 0) {
        const at = index / panels.length;
        const duration = .055;
        timeline.set(panels[index - 1], { autoAlpha: 0 }, at)
          .set(panel, { autoAlpha: 1 }, at);
        if (copy) timeline.fromTo(copy, { y: 14, clipPath: 'inset(100% 0% 0% 0%)' },
          { y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'sine.out' }, at);
        const previousCopy = panels[index - 1].querySelector('.mat-copy');
        if (previousCopy) timeline.to(previousCopy, { y: -10, clipPath: 'inset(0% 0% 100% 0%)', duration, ease: 'sine.in' }, at - duration);
      }
      if (image) {
        const crop = readCrop(image);
        timeline.fromTo(image,
          { x: 0, y: 0, scale: crop.zoom, xPercent: crop.tx, yPercent: crop.ty + 1 },
          { scale: crop.zoom, yPercent: crop.ty - 1, duration: 1 / panels.length, ease: 'none' }, index / panels.length);
      }
      if (rule) timeline.fromTo(rule, { scaleX: .15 }, { scaleX: 1, duration: 1 / panels.length, ease: 'none' }, index / panels.length);
    });
    timeline.eventCallback('onUpdate', () => select(Math.min(panels.length - 1, Math.floor(timeline.progress() * panels.length))));
    const click = event => {
      const link = event.target.closest?.('[data-study-index]');
      if (!link) return;
      const index = Number(link.dataset.studyIndex);
      if (!Number.isInteger(index) || index < 0 || index >= panels.length) return;
      event.preventDefault();
      const trigger = timeline.scrollTrigger;
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (index + .45) / panels.length, behavior: 'smooth' });
    };
    root.addEventListener?.('click', click);
    return () => { root.removeEventListener?.('click', click); root.classList.remove('is-journey-host'); delete root.dataset.materialActive; };
  }
  // Flowing layouts retain every study. Motion adds depth without hiding the
  // main image or making a touch visitor scrub a desktop-length pin.
  panels.forEach((panel, index) => {
    const media = panel.querySelector('.mat-media');
    if (media) gsap.fromTo(media, { y: 28 }, { y: 0, ease: 'none', scrollTrigger: {
      trigger: panel, start: 'top 95%', end: 'top 45%', scrub: true,
      onEnter: () => select(index), onEnterBack: () => select(index),
    } });
  });
  return () => { delete root.dataset.materialActive; };
}
/* --------------------------------------------------- 04 — technology */

function technology(root, gsap, { mobile }) {
  const stack = root.querySelector('[data-tech-stack]');
  const views = [...root.querySelectorAll('.tech-view')];
  const image = root.querySelector('.tech-visual img');
  // Contain-fit keeps the whole silhouette; the scale stays inside the
  // visual column so the shoe never bleeds across the reading rows. The
  // stacked mobile flow has no spare column to bleed into, so it stays 1:1.
  const imageScale = image?.hasAttribute('data-tech-model') && !mobile ? 1.08 : 1;
  if (views.length > 1) {
    // The study TURNS with the findings. Each row owns a view; the row's
    // own scrubbed reveal reports reachability, so jumps and reverse seeks
    // resolve exactly like gradual scrolling.
    views.forEach(view => {
      gsap.fromTo(view, { scale: imageScale * 1.05, xPercent: -1.5 },
        { scale: imageScale, xPercent: 1.5, ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  } else if (image) {
    gsap.fromTo(image, { scale: imageScale * 1.06, xPercent: -2, rotation: mobile ? 0 : -4 },
      {
        scale: imageScale, xPercent: 2, rotation: 0, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
      });
  }
  // The reading rows arrive as a scrubbed cascade — each finding steps in
  // after the last, so the technical story builds with the scroll. The row
  // reveal doubles as the view owner: at half-progress its study takes the stage.
  const techRows = [...root.querySelectorAll('.tech-row')];
  const reached = techRows.map(() => false);
  const syncViews = () => {
    if (views.length < 2) return;
    let active = 0;
    reached.forEach((flag, index) => { if (flag) active = index; });
    const target = Math.min(active, views.length - 1);
    views.forEach((view, index) => view.classList.toggle('is-active', index === target));
  };
  if (techRows.length && !mobile) {
    techRows.forEach((row, index) => {
      gsap.fromTo(row, { y: 52, autoAlpha: 0, rotationX: 6 },
        {
          y: 0, autoAlpha: 1, rotationX: 0, ease: 'none',
          scrollTrigger: { trigger: row, start: 'top 94%', end: 'top 58%', scrub: true },
          onUpdate() { reached[index] = this.progress() > .45; syncViews(); },
        });
      const num = row.querySelector('.tech-num');
      if (num) gsap.fromTo(num, { scale: 1.6, autoAlpha: 0 },
        {
          scale: 1, autoAlpha: 1, ease: 'none',
          scrollTrigger: { trigger: row, start: 'top 94%', end: 'top 62%', scrub: true },
        });
    });
    syncViews();
  }
  const word = root.querySelector('[data-tech-word]');
  if (word) {
    // The outlined word passes THROUGH the viewport: horizontal drift,
    // weight swell and a scale push give the exit a sense of depth.
    gsap.fromTo(word, { xPercent: 4, scale: .96, '--tech-wght': 640 }, {
      xPercent: -7,
      scale: 1.22,
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
  if (root.hasAttribute('data-form-edit')) return mountFormEdit(root, gsap, { mobile });
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
    // The photograph breathes inside its plate — a slow settle-drift that
    // keeps every phase of the pin in motion.
    const photo = scene.querySelector('.coll-scene-visual img');
    if (photo) timeline.fromTo(photo, { scale: 1.1, yPercent: -2.5 },
      { scale: 1.02, yPercent: 2.5, duration: span, ease: 'none' }, at);
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

function featured(root, gsap, { mobile }) {
  const frame = root.querySelector('.feat-frame');
  const image = root.querySelector('.feat-frame > img');
  // Campaign reveal: the study uncovers through a closing window while the
  // image counter-zooms, then the copy stacks in behind it. Scrubbed, so
  // the reveal works forward and backward.
  if (!mobile && frame) {
    // The heading's mask-rise belongs to sceneFlow; the rest of the copy
    // stacks in behind the uncover.
    const copy = [...root.querySelectorAll('.feat-copy > *')].filter(part => !part.classList.contains('feat-title'));
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top 82%', end: 'top 18%', scrub: true },
    });
    timeline.fromTo(frame, { clipPath: 'inset(14% 34% 14% 34%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: .62, ease: 'none' }, 0);
    if (image) timeline.fromTo(image, { scale: 1.3, yPercent: -3 },
      { scale: 1.08, yPercent: 0, duration: .72, ease: 'none' }, 0);
    copy.forEach((part, index) => {
      timeline.fromTo(part, { y: 44, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .3, ease: 'none' }, .3 + index * .09);
    });
    // The studio set drifts against the scroll after the reveal — a quiet
    // parallax that keeps the frame alive between chapters.
    gsap.fromTo(frame, { y: 18 }, {
      y: -18, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  } else if (image) {
    const model = image.hasAttribute('data-featured-model');
    const scale = model ? 1.08 : 1;
    const drift = model ? 1.2 : 1.6;
    gsap.fromTo(image, { yPercent: -drift, scale }, {
      yPercent: drift,
      scale,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  if (!mobile && frame?.hasAttribute('data-journey-from-primary') && root.offsetHeight <= window.innerHeight) {
    // Keep the entire product on screen while its identity changes. The
    // shared journey renderer reads this pin's scrubbed progress directly.
    gsap.timeline({ scrollTrigger: {
      trigger: root,
      start: () => `top ${Math.max(0, Math.min(window.innerHeight * .08, (window.innerHeight - root.offsetHeight) / 2))}px`,
      end: () => `+=${Math.round(window.innerHeight * .85)}`,
      pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true,
    } }).to({ progress: 0 }, { progress: 1, duration: 1, ease: 'none' });
  }
  const word = root.querySelector('[data-feat-word]');
  if (word) {
    gsap.fromTo(word, { xPercent: 5, yPercent: -12 }, {
      xPercent: -5, yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/* -------------------------------------------------------- 07 — brand */

function brand(root, gsap, { mobile }) {
  const stage = root.querySelector('[data-brand-stage]');
  if (!stage) return;
  const image = root.querySelector('.brand-visual > img');
  const visual = root.querySelector('[data-brand-visual]');
  const editorial = root.querySelector('.brand-editorial');
  const words = [...root.querySelectorAll('.brand-word')];
  const values = [...root.querySelectorAll('.brand-value')];
  const lines = root.querySelectorAll('.brand-line > span');
  // The manifesto reads WITH the scroll: words arrive one by one, the way a
  // statement is spoken — the chapter's signature move.
  if (words.length) {
    gsap.fromTo(words, { opacity: .58 },
      { opacity: 1, stagger: .5, ease: 'none',
        scrollTrigger: { trigger: root.querySelector('[data-brand-manifesto]') || stage, start: 'top 84%', end: 'bottom 45%', scrub: true } });
  }
  // The study uncovers from its right edge while the values cascade in —
  // the editorial row fills with motion instead of sitting still.
  if (visual) gsap.fromTo(visual, { clipPath: 'inset(0% 0% 0% 16%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'none',
      scrollTrigger: { trigger: editorial, start: 'top 82%', end: 'top 38%', scrub: true } });
  const crop = 1.02;
  if (image) gsap.fromTo(image, { scale: crop * 1.16, xPercent: -1, yPercent: -2 }, {
    scale: crop, xPercent: 1, yPercent: 2, ease: 'none',
    scrollTrigger: { trigger: editorial, start: 'top bottom', end: 'bottom top', scrub: true },
  });
  values.forEach((value, index) => {
    gsap.fromTo(value, { y: 44, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: .8, ease: 'power2.out',
        scrollTrigger: { trigger: value, start: 'top 88%', toggleActions: 'play none none reverse' },
        delay: index * .06 });
    const mark = value.querySelector('i');
    if (mark) gsap.fromTo(mark, { scale: 1.7, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: .7, ease: 'power2.out',
        scrollTrigger: { trigger: value, start: 'top 88%', toggleActions: 'play none none reverse' } });
  });
  if (editorial) gsap.fromTo(editorial, { xPercent: mobile ? 0 : -2 }, { xPercent: 0, ease: 'none',
    scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } });
  lines.forEach((line, index) => {
    gsap.fromTo(line, { yPercent: 112 }, { yPercent: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: '.brand-lines', start: 'top 92%', toggleActions: 'play none none reverse' },
      delay: index * .1 });
  });
}

/* ------------------------------------------------------- 08 — finale */

function finale(root, gsap, { mobile }) {
  const stage = root.querySelector('[data-finale-stage]');
  if (!stage) return;
  const shoe = root.querySelector('[data-finale-shoe]');
  const heading = root.querySelector('.finale-heading');
  const word = root.querySelector('[data-finale-word]');
  const spot = root.querySelector('[data-finale-spot]');
  const floor = root.querySelector('[data-finale-floor]');
  const context = root.querySelectorAll('.finale-kicker, .finale-sub, .finale-price');
  const controls = root.querySelector('.finale-actions');
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: stage, start: mobile ? 'top 85%' : 'top top',
    end: mobile ? 'clamp(bottom bottom)' : () => `+=${Math.round(window.innerHeight * 1.05)}`,
    pin: !mobile, scrub: true, invalidateOnRefresh: true,
  }});
  // The climax, staged: the light pool blooms wide while the monumental word
  // swells and releases to texture, the floor line sweeps the stage, and the
  // product lands with a settle — rising into place, cresting, then locking.
  if (spot) timeline.fromTo(spot, { autoAlpha: 0, scale: .66 },
    { autoAlpha: 1, scale: 1.14, duration: .44, ease: 'none' }, 0);
  if (word) {
    // The word is already present as texture when the stage arrives — the
    // dark field never reads as empty before the reveal takes over.
    timeline.fromTo(word, { autoAlpha: .3, scale: .82 },
      { autoAlpha: 1, scale: 1, duration: .3, ease: 'none' }, .04);
    timeline.to(word, { scale: 1.16, autoAlpha: .16, duration: .56, ease: 'none' }, .34);
  }
  if (floor) timeline.fromTo(floor, { scaleX: 0 },
    { scaleX: 1, duration: .3, ease: 'none' }, .12);
  // A light sweep crosses the monumental word as it crests — the stage
  // catches a passing highlight instead of holding a flat texture.
  const sheen = root.querySelector('[data-finale-sheen]');
  if (sheen) timeline.fromTo(sheen, { xPercent: -140, autoAlpha: 0 },
    { xPercent: 260, autoAlpha: 1, duration: .34, ease: 'power1.inOut' }, .3)
    .to(sheen, { autoAlpha: 0, duration: .12, ease: 'none' }, .66);
  const liveModel = shoe?.hasAttribute('data-finale-model');
  if (liveModel) gsap.set(shoe, { scale: 1, yPercent: 0, rotationZ: 0, autoAlpha: 1 });
  else {
    timeline.fromTo(shoe, { scale: .9, yPercent: 4, rotationZ: -2, autoAlpha: 1 },
      { scale: 1, yPercent: 0, rotationZ: 0, autoAlpha: 1, duration: .5, ease: 'none' }, .02);
  }
  // After the landing the shoe keeps breathing — a slow float with a hint of
  // sway that holds the stage alive while the reader decides. Independent of
  // the scrub, so it also runs at the resting end-state. One tween, two
  // properties — separate same-element tweens can silently no-op.
  const floatTarget = shoe?.querySelector('[data-finale-float]') || shoe?.querySelector('img') || shoe;
  if (floatTarget && !liveModel) gsap.to(floatTarget, {
    yPercent: -2.1, rotation: 1.15, duration: 2.9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: .8,
  });
  // The monumental word never fully settles either: a long lateral drift
  // keeps the dark stage moving after the reveal completes.
  if (word) gsap.to(word, {
    xPercent: 1.4, duration: 5.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1,
  });
  const titleParts = root.querySelectorAll('.finale-heading .heading-line');
  titleParts.forEach((part, index) => timeline.fromTo(part,
    { x: (index === 0 ? -1 : 1) * 18, y: index === 0 ? -12 : 12, rotationX: 4, autoAlpha: 1 },
    { x: 0, y: 0, rotationX: 0, autoAlpha: 1, duration: .3, ease: 'none' }, .08 + index * .04));
  if (context.length) timeline.fromTo(context, { autoAlpha: 1, y: 10 },
    { autoAlpha: 1, y: 0, duration: .25, ease: 'none' }, .1);
  if (controls) {
    const buttons = [...controls.children];
    buttons.forEach((button, index) => timeline.fromTo(button,
      { autoAlpha: 1, y: 12, scale: .98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: .25, ease: 'none' }, .12 + index * .04));
  }
}

const CONTROLLERS = { deconstruction, materials, technology, collection, featured, brand, finale };

/* ------------------------------------------------------ boundary continuity */

// Scene flow: every chapter arrives already in motion — a perspective dolly
// or a depth settle on its stage — and keeps drifting as it leaves, so the
// boundary between two chapters reads as one continuous camera move instead
// of a slide cut. Headings rise through their existing line masks in the
// same pass. Pinned chapters animate only inner stage wrappers inside the
// pre-pin zone, so the pin takes over from an already-settled composition.
// Everything is scrubbed, therefore reversible, and lives inside the
// chapter's own motion context.
const FLOW = {
  deconstruction: { stage: '.decon-grid', arrive: { rotationX: 4, yPercent: 9, scale: .97 }, depart: -5 },
  materials: { stage: '[data-mat-panels]', arrive: { yPercent: 7, scale: .985 }, pin: true },
  technology: { stage: '.tech-stage', arrive: { rotationX: 3, yPercent: 8, scale: .98 }, depart: -5 },
  collection: { stage: '[data-coll-stage]', arrive: { yPercent: 7, scale: .985 }, pin: true },
  featured: { stage: '.feat-grid', arrive: { rotationX: 3.5, yPercent: 8, scale: .975 }, depart: -5 },
  brand: { stage: '[data-brand-stage]', arrive: { rotationX: 5, yPercent: 10, scale: .96 }, depart: -6 },
  // The pin owns the outer stage's transform, including its exit translation.
  // Animate the content so a direct seek cannot overwrite that translation.
  finale: { stage: '.finale-inner', arrive: { yPercent: 6, scale: .99 }, pin: true },
};

function sceneFlow(root, gsap) {
  const plan = FLOW[root.dataset.chapter];
  // Test doubles may stub only the controller's own queries.
  if (!plan || typeof root.querySelector !== 'function' || typeof root.querySelectorAll !== 'function') return;
  const heading = root.querySelectorAll('.chapter-heading .heading-line > span, .tech-heading .heading-word-inner, .feat-title .heading-line > span');
  if (heading.length) {
    gsap.fromTo(heading, { yPercent: 114 }, {
      yPercent: 0, ease: 'none', stagger: .05,
      scrollTrigger: { trigger: root, start: 'top 86%', end: 'top 44%', scrub: true },
    });
  }
  const stage = plan.stage ? root.querySelector(plan.stage) : null;
  if (stage) {
    gsap.set(stage, { transformPerspective: 1200, transformOrigin: '50% 0%' });
    gsap.fromTo(stage, { ...plan.arrive }, {
      rotationX: 0, yPercent: 0, scale: 1, ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top bottom',
        end: plan.pin ? 'top top' : 'top 30%',
        scrub: true,
      },
    });
    if (plan.depart) {
      gsap.fromTo(stage, { yPercent: 0 }, {
        yPercent: plan.depart, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: root, start: 'bottom 96%', end: 'bottom 4%', scrub: true },
      });
    }
  }
}

export function mountChapter(root, { gsap, mobile, fine }) {
  const controller = CONTROLLERS[root.dataset.chapter];
  if (!controller) return undefined;
  const dispose = controller(root, gsap, { mobile, fine }) || undefined;
  if (!mobile) {
    sceneFlow(root, gsap);
    // Chapter handoff: the anatomy composition rises over the hero's sky,
    // where the clipped region shows the page field and reads as a
    // continuation of the gradient. Elsewhere the clip would expose the
    // raw body between two light fields, so those boundaries rely on the
    // scene-flow arrivals instead.
    if (root.dataset.chapter === 'deconstruction') {
      wipeIn(root, gsap);
    }
  }
  return dispose;
}
