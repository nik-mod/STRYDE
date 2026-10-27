import { materialOrbit, projectMaterialOrbit } from '../material-orbit.mjs';

export function mountMaterialOrbit(root, gsap, panels, select) {
  const document = root.ownerDocument, environment = document.defaultView;
  const stage = root.querySelector('[data-mat-panels]');
  const orbit = document.createElement('div'); orbit.className = 'mat-orbit';
  orbit.setAttribute('data-material-orbit-window', '');
  const moved = panels.map(panel => {
    const media = panel.querySelector('.mat-media');
    const marker = document.createComment('Material media home');
    media.before(marker); media.classList.add('mat-orbit-item'); orbit.append(media);
    const images = [...media.querySelectorAll('img')].map(image => ({ image, loading: image.getAttribute('loading') }));
    images.forEach(({ image }) => { image.loading = 'eager'; });
    return { media, marker, images, copy: panel.querySelector('.mat-copy') };
  });
  stage.prepend(orbit); root.classList.add('is-journey-host', 'is-material-orbit');
  root.dataset.materialOrbit = 'true';
  if (moved.every(({ media }) => media.querySelector('[data-macro-image]'))) {
    root.setAttribute('data-orbit-bundled', '');
    const disclosure = moved[0].media.querySelector('.asset-tag')?.cloneNode(true);
    if (disclosure) { disclosure.classList.add('mat-orbit-disclosure'); orbit.append(disclosure); }
  }
  let width = 1, height = 1, baseWidth = 1;
  const measure = () => {
    const rect = orbit.getBoundingClientRect(); width = rect.width; height = rect.height; baseWidth = width * .6;
    moved.forEach(({ media }) => { media.style.width = `${baseWidth}px`; media.style.height = `${baseWidth * .75}px`; });
    render();
  };
  const cursor = { progress: 0 };
  const render = () => {
    const state = materialOrbit(cursor.progress);
    root.dataset.orbitProgress = String(cursor.progress);
    root.style.setProperty('--orbit-copy-y', `${state.items[state.active].x * 6}px`);
    select(state.active);
    moved.forEach(({ media, copy }, index) => {
      const point = state.items[index], projected = projectMaterialOrbit(point, width, height);
      // These are honest 2.5D photographs until all genuine GLBs are ready.
      // Apparent size and stacking derive from the exact same orbital depth.
      media.style.transform = `translate3d(${projected.x}px,${projected.y}px,0) translate(-50%,-50%) rotate(${point.rotationZ * 180 / Math.PI}deg) scale(${projected.width * 1.15 / baseWidth})`;
      media.style.zIndex = String(Math.round((point.z + 4) * 100));
      if (copy) { copy.style.visibility = index === state.active ? 'visible' : 'hidden'; copy.setAttribute('aria-hidden', String(index !== state.active)); }
    });
  };
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: root, start: 'top top', end: () => `+=${Math.round(environment.innerHeight * 2.05)}`,
    pin: true, scrub: true, invalidateOnRefresh: true, onRefresh: measure,
  } });
  timeline.to(cursor, { progress: 1, duration: 1, ease: 'none', onUpdate: render });
  measure();
  const resize = new environment.ResizeObserver(measure); resize.observe(orbit);
  const click = event => {
    const link = event.target.closest?.('[data-study-index]');
    if (!link) return;
    const index = Number(link.dataset.studyIndex);
    if (!Number.isInteger(index) || index < 0 || index > 2) return;
    event.preventDefault();
    const trigger = timeline.scrollTrigger;
    environment.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * [0.06, .5, .94][index], behavior: 'smooth' });
  };
  root.addEventListener('click', click);
  return () => {
    resize.disconnect(); root.removeEventListener('click', click);
    moved.forEach(({ media, marker, images, copy }) => {
      marker.replaceWith(media); media.classList.remove('mat-orbit-item');
      for (const property of ['width', 'height', 'transform', 'z-index']) media.style.removeProperty(property);
      copy?.style.removeProperty('visibility'); copy?.removeAttribute('aria-hidden');
      images.forEach(({ image, loading }) => { if (loading === null) image.removeAttribute('loading'); else image.setAttribute('loading', loading); });
    });
    orbit.remove(); root.classList.remove('is-journey-host', 'is-material-orbit');
    root.removeAttribute('data-orbit-bundled');
    delete root.dataset.materialOrbit; delete root.dataset.orbitProgress; delete root.dataset.materialActive;
    root.style.removeProperty('--orbit-copy-y');
  };
}
