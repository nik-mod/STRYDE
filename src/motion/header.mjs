// Fixed header: solid backdrop once the page scrolls, hidden on the way down,
// revealed on the way up. Pure scroll math, independent of the animation rig.
export function mountHeader(header, environment = window) {
  if (!header || header.dataset.headerBound) return () => {};
  header.dataset.headerBound = 'true';

  let lastY = environment.scrollY || 0;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = environment.scrollY || 0;
    header.classList.toggle('is-solid', y > 24);
    if (y > lastY + 2 && y > 180 && !header.contains(document.activeElement)) {
      header.classList.add('is-hidden');
    } else if (y < lastY - 2 || y <= 180) {
      header.classList.remove('is-hidden');
    }
    lastY = y;
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      environment.requestAnimationFrame(update);
    }
  };

  environment.addEventListener('scroll', onScroll, { passive: true });
  update();
  return () => {
    environment.removeEventListener('scroll', onScroll);
    delete header.dataset.headerBound;
    header.classList.remove('is-solid', 'is-hidden');
  };
}
