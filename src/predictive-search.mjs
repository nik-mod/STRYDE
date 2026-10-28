// Predictive search on the search page: debounced queries against Shopify's
// /search/suggest endpoint with section rendering, so product, query and page
// suggestions arrive as themed Liquid HTML. Failures degrade to a notice —
// full search on Enter always works, with or without this enhancement.

export function mountPredictiveSearch(root, { fetchImpl = (...arguments_) => fetch(...arguments_), debounceMs = 220 } = {}) {
  const form = root.querySelector('[data-predictive-form]');
  const input = form?.querySelector('input[type="search"]');
  const label = root.querySelector('[data-predictive-label]')?.textContent?.trim() || '';
  if (!form || !input) return () => {};
  let panel = root.querySelector('[data-predictive-panel]');
  const created = !panel;
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'predictive-panel';
    panel.setAttribute('data-predictive-panel', '');
    panel.setAttribute('role', 'region');
    if (label) panel.setAttribute('aria-label', label);
    panel.setAttribute('aria-live', 'polite');
    form.after(panel);
  }
  panel.hidden = true;
  const errorLabel = root.querySelector('[data-predictive-error]')?.textContent?.trim() || '';
  let timer = 0;
  let token = 0;
  let disposed = false;
  let request = null;
  const hide = () => { panel.hidden = true; };

  async function suggest(terms) {
    const current = ++token;
    if (!terms.trim()) { hide(); panel.innerHTML = ''; return; }
    const url = new URL(form.dataset.predictiveUrl || `${form.getAttribute('action')}/suggest`, location.href);
    url.searchParams.set('q', terms.trim());
    url.searchParams.set('resources[type]', 'product,query,page');
    url.searchParams.set('resources[limit]', '6');
    url.searchParams.set('section_id', 'predictive-search');
    try {
      request?.abort(); request = new AbortController();
      const response = await fetchImpl(url, { headers: { Accept: 'text/html' }, signal: request.signal });
      if (!response.ok) throw new Error(`suggest ${response.status}`);
      const html = await response.text();
      if (disposed || current !== token) return;
      const incoming = document.createElement('div');
      incoming.innerHTML = html;
      const results = incoming.querySelector('[data-predictive-results]');
      panel.innerHTML = results ? results.innerHTML : '';
      panel.hidden = !panel.innerHTML.trim();
    } catch {
      if (disposed || current !== token) return;
      panel.innerHTML = errorLabel ? `<p class="micro predictive-error">${errorLabel}</p>` : '';
      panel.hidden = !errorLabel;
    }
  }

  const onInput = () => {
    clearTimeout(timer);
    ++token; request?.abort(); hide();
    if (!input.value.trim()) { panel.innerHTML = ''; return; }
    timer = setTimeout(() => { void suggest(input.value); }, debounceMs);
  };
  const cancel = () => { clearTimeout(timer); ++token; request?.abort(); hide(); };
  const onKey = event => {
    if (event.key === 'Escape') {
      const wasOpen = !panel.hidden;
      cancel();
      if (wasOpen) { event.preventDefault(); input.focus({ preventScroll: true }); }
    } else if (!panel.hidden && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      const links = [...panel.querySelectorAll('a[href]')];
      if (!links.length) return;
      event.preventDefault();
      const index = links.indexOf(root.ownerDocument.activeElement);
      const down = event.key === 'ArrowDown';
      const next = index < 0 ? (down ? 0 : links.length - 1) : (index + (down ? 1 : -1) + links.length) % links.length;
      links[next].focus();
    }
  };
  const onBlur = event => { if (!root.contains(event.relatedTarget)) cancel(); };
  input.addEventListener('input', onInput);
  root.addEventListener('keydown', onKey);
  root.addEventListener('focusout', onBlur);
  panel.id = panel.dataset.panelId || `${input.id || 'Search'}Suggestions`;
  input.setAttribute('aria-controls', panel.id);
  if (label) input.setAttribute('aria-label', label);
  form.addEventListener('submit', cancel);
  return () => {
    disposed = true; cancel(); input.removeEventListener('input', onInput);
    root.removeEventListener('keydown', onKey); root.removeEventListener('focusout', onBlur);
    form.removeEventListener('submit', cancel);
    input.removeAttribute('aria-controls');
    if (created) panel.remove();
  };
}
