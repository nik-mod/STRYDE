import { photoContentBounds, fitPhotoContent } from './product-gallery.mjs';

const MANAGED = ['q', 'brand', 'color', 'edit', 'sort', 'page'];
const clean = value => String(value || '').trim();
const normalize = value => clean(value).toLocaleLowerCase();
export const COLLECTION_PAGE_SIZE = 12;

export function prepareCatalog(catalog) {
  const entries = catalog.map((item, order) => {
    const identified = ['source-verified', 'visually-identified'].includes(item.identityStatus);
    const number = clean(item.id).replace(/\D/g, '').padStart(4, '0');
    const title = identified || item.identityStatus === 'filename'
      ? clean(item.title).replace(/\s*[·—]\s*(multiple colorways|model unverified)\s*$/i, '')
      : `Footwear study ${number}`;
    const cover = item.coverPhoto || item.photos?.[0];
    const alternate = item.photos?.find(photo => photo.src !== cover?.src);
    const colors = clean(item.colorway).split(/\s*\/\s*/).filter(color => color && !/mixed colorways/i.test(color));
    return {
      id: item.id, title, brand: clean(item.brand), colorway: clean(item.colorway), colors,
      identified, provisional: item.identityStatus === 'filename', count: Number(item.count) || item.photos?.length || 1,
      cover: cover?.src || '', alternate: alternate?.src || '', url: item.url, order,
      query: normalize(`${item.title} ${item.brand || ''} ${item.colorway || ''} ${item.sourceSet || ''}`),
    };
  }).filter(item => item.cover && /^\/products\//.test(item.url));
  // The opening edit shows the breadth of the supplied photographs. Rotate
  // through identified brands before continuing into the unlabelled studies.
  const groups = new Map();
  entries.filter(item => item.identified).forEach(item => {
    if (!groups.has(item.brand)) groups.set(item.brand, []);
    groups.get(item.brand).push(item);
  });
  let rank = 0;
  while ([...groups.values()].some(items => items.length)) {
    for (const items of groups.values()) if (items.length) items.shift().studioOrder = rank++;
  }
  entries.filter(item => !item.identified).forEach(item => { item.studioOrder = rank++; });
  return entries;
}

export function collectionHref(params, changes = {}, pathname = '/collections/all') {
  const query = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (!value || (key === 'sort' && value === 'studio') || (key === 'page' && Number(value) === 1)) query.delete(key);
    else query.set(key, value);
  }
  return pathname + (query.size ? `?${query}` : '');
}

export function catalogPage(entries, params = new URLSearchParams(), pathname = '/collections/all', pageSize = COLLECTION_PAGE_SIZE) {
  const q = clean(params.get('q')), brand = clean(params.get('brand')), color = clean(params.get('color'));
  const edit = params.get('edit') === 'identified' ? 'identified' : '';
  const sort = ['name-ascending', 'name-descending', 'views'].includes(params.get('sort')) ? params.get('sort') : 'studio';
  const words = normalize(q).split(/\s+/).filter(Boolean);
  const matches = entries.filter(item => (!brand || item.brand === brand) && (!color || item.colors.includes(color))
    && (!edit || item.identified) && words.every(word => item.query.includes(word)));
  matches.sort((a, b) => sort === 'name-ascending' ? a.title.localeCompare(b.title)
    : sort === 'name-descending' ? b.title.localeCompare(a.title)
      : sort === 'views' ? b.count - a.count || a.order - b.order
        : a.studioOrder - b.studioOrder);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.get('page'), 10) || 1));
  const href = changes => collectionHref(params, changes, pathname);
  const numbers = [...new Set([1, page - 1, page, page + 1, pages].filter(number => number > 0 && number <= pages))].sort((a, b) => a - b);
  const pagination = [];
  numbers.forEach((number, index) => {
    if (index && number - numbers[index - 1] > 1) pagination.push({ ellipsis: true, label: '…' });
    pagination.push({ number, label: String(number).padStart(2, '0'), current: number === page, url: href({ page: number }) });
  });
  return {
    q, brand, color, edit, sort, page, pages, total: matches.length, all: entries.length,
    named: entries.filter(item => item.identified).length,
    brands: [...new Set(entries.map(item => item.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    colors: [...new Set(entries.flatMap(item => item.colors))].sort((a, b) => a.localeCompare(b)),
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    rangeStart: matches.length ? (page - 1) * pageSize + 1 : 0, rangeEnd: Math.min(page * pageSize, matches.length),
    pagination, previous: page > 1 ? href({ page: page - 1 }) : '', next: page < pages ? href({ page: page + 1 }) : '',
    clearUrl: href(Object.fromEntries(MANAGED.map(key => [key, '']))),
    allUrl: href({ edit: '', page: '' }), namedUrl: href({ edit: 'identified', page: '' }),
    hasFilters: Boolean(q || brand || color || edit),
  };
}

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>';
function cardMarkup(item, index) {
  return `<article class="photo-shop-card" data-photo-card data-product-id="${escapeHTML(item.id)}" style="--card-order:${index}"><a class="photo-shop-image" data-product-open href="${escapeHTML(item.url)}" aria-label="View ${escapeHTML(item.title)}"><img data-product-cover src="${escapeHTML(item.cover)}" width="1000" height="1000" loading="${index < 3 ? 'eager' : 'lazy'}" alt="${escapeHTML(item.title)}">${item.alternate ? `<img class="photo-shop-alternate" src="${escapeHTML(item.alternate)}" width="1000" height="1000" loading="lazy" alt="">` : ''}<span class="photo-shop-count">${item.count} ${item.count === 1 ? 'view' : 'views'}</span><span class="photo-shop-open" aria-hidden="true">${arrow}</span></a><div class="photo-shop-info"><div><h2><a data-product-open href="${escapeHTML(item.url)}">${escapeHTML(item.title)}</a></h2><p class="photo-shop-colorway">${escapeHTML(item.colorway || (item.identified ? item.brand : 'Photo study'))}</p></div><span class="photo-shop-brand">${escapeHTML(item.brand || 'STRYDE')}</span></div></article>`;
}
function paginationMarkup(state) {
  if (state.pages <= 1) return '';
  return `<a class="collection-page-direction${state.previous ? '' : ' is-disabled'}" ${state.previous ? `href="${escapeHTML(state.previous)}" data-catalog-page` : 'aria-disabled="true"'}>${arrow}<span>Previous</span></a><div class="collection-page-numbers">${state.pagination.map(part => part.ellipsis ? '<span class="collection-page-gap" aria-hidden="true">…</span>' : `<a href="${escapeHTML(part.url)}" data-catalog-page${part.current ? ' aria-current="page"' : ''} aria-label="Page ${part.number}">${part.label}</a>`).join('')}</div><a class="collection-page-direction${state.next ? '' : ' is-disabled'}" ${state.next ? `href="${escapeHTML(state.next)}" data-catalog-page` : 'aria-disabled="true"'}><span>Next</span>${arrow}</a>`;
}

function mountProductContinuity(section) {
  const environment = section?.ownerDocument?.defaultView;
  if (!environment || !section.addEventListener) return () => {};
  const listeners = new AbortController();
  const clear = () => {
    section.querySelectorAll('[data-product-cover], .product-card-cover').forEach(image => image.style.removeProperty('view-transition-name'));
    section.querySelectorAll('.is-opening').forEach(card => card.classList.remove('is-opening'));
  };
  section.addEventListener('click', event => {
    const link = event.target.closest('[data-product-open]');
    if (!link || environment.matchMedia('(prefers-reduced-motion: reduce)').matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    clear();
    const image = link.closest('[data-product-id]')?.querySelector('[data-product-cover], .product-card-cover');
    if (image) {
      image.style.viewTransitionName = 'stryde-product-media';
      image.closest('[data-product-id]')?.classList.add('is-opening');
    }
  }, { signal: listeners.signal });
  environment.addEventListener('pageshow', clear, { signal: listeners.signal });
  return () => { listeners.abort(); clear(); };
}

function mountCatalogFraming(root) {
  const doc = root.ownerDocument, cache = new Map();
  const listeners = new AbortController();
  const fit = image => {
    if (!image.complete || !image.naturalWidth || !image.closest('[data-photo-card]')) return;
    const source = image.currentSrc || image.src;
    if (!cache.has(source)) {
      try {
        const canvas = doc.createElement('canvas');
        const ratio = Math.min(1, 192 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        cache.set(source, { ...photoContentBounds(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height), sourceWidth: canvas.width, sourceHeight: canvas.height });
        if (cache.size > 128) cache.delete(cache.keys().next().value);
      } catch { cache.set(source, null); }
    }
    const bounds = cache.get(source);
    if (!bounds) return;
    const frame = image.closest('.photo-shop-image').getBoundingClientRect();
    if (frame.width < 1 || frame.height < 1) return;
    const geometry = fitPhotoContent(bounds, bounds.sourceWidth, bounds.sourceHeight, frame.width, frame.height, .84);
    image.classList.add('has-content-framing');
    Object.assign(image.style, { inset: 'auto', maxWidth: 'none', padding: '0', ...Object.fromEntries(Object.entries(geometry).map(([key, value]) => [key, `${value}px`])) });
  };
  const fitAll = () => root.querySelectorAll('.photo-shop-image > img').forEach(fit);
  root.addEventListener('load', event => { if (event.target.matches?.('.photo-shop-image > img')) fit(event.target); }, { capture: true, signal: listeners.signal });
  const observer = doc.defaultView.ResizeObserver ? new doc.defaultView.ResizeObserver(fitAll) : null;
  observer?.observe(root.querySelector('[data-catalog-grid]'));
  fitAll();
  return { refresh: fitAll, dispose() { listeners.abort(); observer?.disconnect(); cache.clear(); } };
}

export function mountCollectionStudio(section) {
  const disposeContinuity = mountProductContinuity(section);
  if (!section?.ownerDocument?.defaultView) return disposeContinuity;
  const root = section.querySelector?.('[data-photo-shop]');
  const payload = root?.querySelector('[data-catalog-data]');
  if (!payload) return disposeContinuity;
  let entries;
  try { entries = JSON.parse(payload.textContent); } catch { return disposeContinuity; }
  const doc = section.ownerDocument, environment = doc.defaultView;
  const form = root.querySelector('[data-catalog-form]');
  const grid = root.querySelector('[data-catalog-grid]'), result = root.querySelector('[data-photo-results]');
  const pagination = root.querySelector('[data-catalog-pagination]'), empty = root.querySelector('[data-catalog-empty]');
  const reset = root.querySelector('[data-catalog-reset]');
  const listeners = new AbortController();
  const media = environment.matchMedia('(prefers-reduced-motion: reduce)');
  const framing = mountCatalogFraming(root);
  let timer, transition;
  const setControls = state => {
    for (const name of ['q', 'brand', 'color', 'sort']) if (form.elements[name]) form.elements[name].value = state[name];
    form.elements.edit.value = state.edit;
    root.querySelectorAll('[data-catalog-edit]').forEach(link => {
      const active = link.dataset.catalogEdit === state.edit;
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      link.href = link.dataset.catalogEdit ? state.namedUrl : state.allUrl;
    });
  };
  const render = (url, { history = 'push', scroll = false, focus = false } = {}) => {
    const state = catalogPage(entries, url.searchParams, url.pathname);
    // Out-of-range URLs and unknown sorts resolve to the same canonical state.
    const canonical = new URL(collectionHref(url.searchParams, { page: state.page, sort: state.sort }, url.pathname), url.origin);
    if (history !== 'none') environment.history[history === 'replace' ? 'replaceState' : 'pushState']({}, '', canonical);
    const update = () => {
      grid.innerHTML = state.items.map(cardMarkup).join('');
      framing.refresh();
      result.textContent = `${state.rangeStart}–${state.rangeEnd} of ${state.total} ${state.total === 1 ? 'design' : 'designs'}`;
      pagination.innerHTML = paginationMarkup(state);
      empty.hidden = state.total > 0;
      reset.hidden = !state.hasFilters;
      root.querySelectorAll('[data-catalog-reset]').forEach(link => { link.href = state.clearUrl; });
      setControls(state);
      if (scroll) section.scrollIntoView({ behavior: media.matches ? 'instant' : 'smooth', block: 'start' });
      if (focus) { result.tabIndex = -1; result.focus({ preventScroll: true }); }
    };
    transition?.skipTransition?.();
    if (doc.startViewTransition && !media.matches && scroll) {
      try {
        transition = doc.startViewTransition(update);
        transition.ready.catch(() => {});
        transition.finished.catch(() => {});
      } catch { update(); }
    } else update();
  };
  const apply = (history = 'push') => {
    const url = new URL(environment.location.href);
    const values = new FormData(form);
    for (const key of MANAGED) {
      if (key === 'page') url.searchParams.delete(key);
      else { const value = clean(values.get(key)); if (value && !(key === 'sort' && value === 'studio')) url.searchParams.set(key, value); else url.searchParams.delete(key); }
    }
    render(url, { history });
  };
  root.addEventListener('submit', event => { if (event.target === form) { event.preventDefault(); clearTimeout(timer); apply(); } }, { signal: listeners.signal });
  root.addEventListener('input', event => { if (event.target.name === 'q') { clearTimeout(timer); timer = setTimeout(() => apply('replace'), 180); } }, { signal: listeners.signal });
  root.addEventListener('change', event => { if (form.contains(event.target) && event.target.name !== 'q') { clearTimeout(timer); apply(); } }, { signal: listeners.signal });
  root.addEventListener('click', event => {
    const link = event.target.closest('[data-catalog-page], [data-catalog-edit], [data-catalog-reset]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); clearTimeout(timer);
    render(new URL(link.href, environment.location.href), { scroll: link.hasAttribute('data-catalog-page'), focus: link.hasAttribute('data-catalog-page') && event.detail === 0 });
  }, { signal: listeners.signal });
  environment.addEventListener('popstate', () => render(new URL(environment.location.href), { history: 'none' }), { signal: listeners.signal });
  root.classList.add('is-studio-ready');
  return () => { listeners.abort(); disposeContinuity(); framing.dispose(); clearTimeout(timer); transition?.skipTransition?.(); root.classList.remove('is-studio-ready'); };
}

