export function inPageAnchor(href, currentURL) {
  try {
    const current = new URL(currentURL), target = new URL(href, currentURL);
    if (target.origin !== current.origin || target.pathname !== current.pathname || target.search !== current.search || !target.hash) return null;
    return decodeURIComponent(target.hash.slice(1)) || null;
  } catch { return null; }
}

// One delegated owner covers section remounts, keyboard focus, and smooth
// anchors. Native navigation remains available when motion is reduced.
export function mountNavigation({ document, environment = window, getScroller, onMenuChange }) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const openMenu = () => document.querySelector('[data-mobile-menu][open]');
  const close = menu => { menu.open = false; onMenuChange(); };
  const focusTarget = target => {
    const temporary = !target.hasAttribute('tabindex');
    if (temporary) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (temporary) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true, signal: controller.signal });
  };
  document.addEventListener('toggle', event => {
    const menu = event.target;
    if (!menu.matches?.('[data-mobile-menu]')) return;
    const summary = menu.querySelector('summary');
    if (summary) summary.setAttribute('aria-label', menu.open ? menu.dataset.closeLabel : menu.dataset.openLabel);
    onMenuChange();
  }, { capture: true, signal: controller.signal });
  document.addEventListener('keydown', event => {
    const menu = openMenu();
    if (!menu) return;
    if (event.key === 'Escape') { event.preventDefault(); close(menu); menu.querySelector('summary')?.focus(); }
    if (event.key === 'Tab') {
      const stops = [...menu.querySelectorAll('summary, a[href], button, input, select, [tabindex="0"]')].filter(el => el.getClientRects().length && !el.disabled);
      const first = stops[0], last = stops.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !menu.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !menu.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  }, options);
  document.addEventListener('click', event => {
    const menu = openMenu();
    const link = event.target.closest?.('a[href]');
    if (menu && (link || !menu.contains(event.target))) close(menu);
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || link.hasAttribute('download') || link.target === '_blank') return;
    const id = inPageAnchor(link.href, environment.location.href);
    const scroller = getScroller();
    const target = id && document.getElementById(id);
    if (!target || !scroller) return;
    event.preventDefault();
    const clearance = (document.querySelector('.site-header')?.offsetHeight || 0) + (document.querySelector('.preview-notice')?.offsetHeight || 0) + 18;
    if (environment.location.hash !== `#${id}`) environment.history.pushState(null, '', `#${encodeURIComponent(id)}`);
    scroller.start();
    scroller.scrollTo(target, { offset: -clearance, duration: 1.1, onComplete: () => focusTarget(target) });
  }, options);
  environment.addEventListener('resize', () => { const menu = openMenu(); if (menu && !menu.getClientRects().length) close(menu); }, options);
  return () => controller.abort();
}
