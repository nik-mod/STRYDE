import { mountCollectionStudio } from '../collection-studio.mjs';

// Local reference photography stays non-commerce. Native Shopify listings
// retain their server-rendered filters, sorting and product links.
export function mountListing(root, options = {}) {
  const disposeStudio = mountCollectionStudio(root, options);
  if (root?.querySelector?.('[data-photo-shop]')?.matches?.('[data-photo-shop]')) return disposeStudio;
  const catalog = root?.querySelector?.('[data-reference-catalog]');
  if (!catalog?.querySelectorAll) return disposeStudio;
  const cards = [...catalog.querySelectorAll('[data-photography-reference]')];
  const buttons = [...catalog.querySelectorAll('[data-reference-filter]')];
  const query = catalog.querySelector('[data-reference-query]');
  const count = catalog.querySelector('[data-reference-count]');
  const empty = catalog.querySelector('[data-reference-empty]');
  const listeners = new AbortController();
  let brand = 'all';
  const update = () => {
    const words = (query?.value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const card of cards) {
      const matches = (brand === 'all' || card.dataset.referenceBrand === brand)
        && words.every(word => card.dataset.referenceName.includes(word));
      card.hidden = !matches;
      if (matches) shown++;
    }
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.referenceFilter === brand)));
    if (count) count.textContent = `${shown} / ${cards.length} ${shown === 1 ? catalog.dataset.studyOne : catalog.dataset.studyOther}`;
    if (empty) empty.hidden = shown > 0;
  };
  catalog.classList.add('is-filterable');
  catalog.addEventListener('input', event => { if (event.target === query) update(); }, { signal: listeners.signal });
  catalog.addEventListener('click', event => {
    const filter = event.target.closest('[data-reference-filter]');
    if (filter) { brand = filter.dataset.referenceFilter; update(); }
    if (event.target.closest('[data-reference-reset]')) {
      brand = 'all';
      if (query) query.value = '';
      update();
      query?.focus();
    }
  }, { signal: listeners.signal });
  update();
  return () => {
    listeners.abort();
    disposeStudio();
    catalog.classList.remove('is-filterable');
    cards.forEach(card => { card.hidden = false; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.referenceFilter === 'all')));
    if (empty) empty.hidden = true;
    if (count) count.textContent = `${cards.length} ${catalog.dataset.studyOther}`;
  };
}
