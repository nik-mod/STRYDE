import { anatomyTour, ANATOMY_DETAIL_PROGRESS } from '../anatomy-tour.mjs';

export function mountAnatomy(root, gsap) {
  const environment = root.ownerDocument.defaultView;
  const items = [...root.querySelectorAll('.decon-item')];
  const crops = [...root.querySelectorAll('.decon-crop')];
  const images = crops.map(crop => crop.querySelector('img')).filter(Boolean).map(image => ({ image, loading: image.getAttribute('loading') }));
  const links = [...root.querySelectorAll('[data-anatomy-step]')];
  const cursor = { progress: 0 };
  root.classList.add('is-anatomy-exploration');
  const render = () => {
    const state = anatomyTour(cursor.progress);
    root.dataset.anatomyProgress = String(cursor.progress);
    root.dataset.anatomyActive = String(state.active);
    root.style.setProperty('--anatomy-progress', String(cursor.progress));
    items.forEach((item, index) => {
      item.style.visibility = index === state.active ? 'visible' : 'hidden';
      item.style.transform = `translateX(${index === state.active ? state.captionOffset : 0}px)`;
      item.setAttribute('aria-hidden', String(index !== state.active));
    });
    links.forEach((link, index) => {
      if (index === state.active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    });
    const requested = 0; // Keep the complete silhouette until the live model is ready.
    const image = crops[requested]?.querySelector('img');
    const activeView = image?.complete && image.naturalWidth ? requested : 0;
    crops.forEach((crop, index) => { crop.style.opacity = index === activeView ? '1' : '0'; });
  };
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: root, start: 'top top', end: () => `+=${Math.round(environment.innerHeight * 2.8)}`,
    pin: true, scrub: true, invalidateOnRefresh: true,
  } });
  timeline.to(cursor, { progress: 1, duration: 1, ease: 'none', onUpdate: render });
  render();
  const observer = new environment.IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      crops.forEach(crop => { const image = crop.querySelector('img'); if (image) image.loading = 'eager'; });
      observer.disconnect();
    }
  }, { rootMargin: '350px' });
  observer.observe(root);
  const loaded = () => render();
  crops.forEach(crop => crop.querySelector('img')?.addEventListener('load', loaded));
  const click = event => {
    const link = event.target.closest?.('[data-anatomy-step]');
    if (!link) return;
    const index = Number(link.dataset.anatomyStep);
    if (!Number.isInteger(index) || !ANATOMY_DETAIL_PROGRESS[index]) return;
    event.preventDefault();
    const trigger = timeline.scrollTrigger;
    environment.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * ANATOMY_DETAIL_PROGRESS[index], behavior: 'smooth' });
  };
  root.addEventListener('click', click);
  return () => {
    observer.disconnect(); root.removeEventListener('click', click);
    items.forEach(item => { item.style.removeProperty('visibility'); item.style.removeProperty('transform'); item.removeAttribute('aria-hidden'); });
    links.forEach(link => link.removeAttribute('aria-current'));
    crops.forEach(crop => { crop.style.removeProperty('opacity'); crop.querySelector('img')?.removeEventListener('load', loaded); });
    images.forEach(({ image, loading }) => { if (loading === null) image.removeAttribute('loading'); else image.setAttribute('loading', loading); });
    root.classList.remove('is-anatomy-exploration');
    delete root.dataset.anatomyProgress; delete root.dataset.anatomyActive; root.style.removeProperty('--anatomy-progress');
  };
}
