// Product buy-box orchestration: option-group variant picking (footwear sizes
// and colours), variant URL deep links, price/compare/sale/badge updates, the
// AJAX buy form and the related-products loader. The native <select name="id">
// remains the single submitted source of variant identity.

import { mountProductGallery } from './product-gallery.mjs';
import { mountVariantPicker, normalizeOptions, normalizeVariants, relaxConflicts, resolveVariant, selectionFromVariant } from './variant-picker.mjs';
import { mountProductForm } from './product-form.mjs';

export function selectVariant(variants, id) {
  return normalizeVariants(variants).find(variant => String(variant.id) === String(id)) || null;
}

export function mountProduct(root) {
  const gallery = mountProductGallery(root);
  const select = root.querySelector('[data-variant-select]');
  const data = root.querySelector('[data-product-variants]');
  const form = mountProductForm(root, { devPreview: document.body.hasAttribute('data-local-preview') });
  if (!select || !data) return () => { form(); gallery.dispose(); };
  let payload;
  try { payload = JSON.parse(data.textContent); } catch { return () => { form(); gallery.dispose(); }; }
  const variants = normalizeVariants(payload.variants);
  const options = normalizeOptions(payload.options);
  const labels = payload.labels || {};
  const abort = new AbortController();
  const picker = mountVariantPicker(root, {
    onChange: (position, value) => {
      selection[position - 1] = value;
      relaxConflicts(variants, selection, position);
      update();
    },
  });
  if (options.length) root.classList.add('has-variant-options');
  const selection = selectionFromVariant(options, selectVariant(variants, payload.selected) || selectVariant(variants, select.value));
  const elements = {
    price: root.querySelector('[data-product-price]'),
    compare: root.querySelector('[data-product-compare]'),
    saleBadge: root.querySelector('[data-product-sale-badge]'),
    availability: root.querySelector('[data-product-availability]'),
    button: root.querySelector('[data-add-to-cart]'),
    sticky: root.querySelector('[data-sticky-purchase]'),
    stickyPrice: root.querySelector('[data-sticky-price]'),
  };

  function update(changeURL = true) {
    const variant = resolveVariant(variants, selection) || selectVariant(variants, select.value);
    picker.render({ variants, options, selection, variant, labels });
    if (!variant) {
      elements.button.dataset.unavailable = 'true';
      elements.button.disabled = true;
      elements.availability.textContent = labels.soldOut || '';
      return;
    }
    select.value = String(variant.id);
    const available = Boolean(variant.available);
    elements.button.dataset.unavailable = String(!available);
    elements.button.disabled = !available;
    elements.button.childNodes[0].textContent = available ? (labels.add || elements.button.textContent) : (labels.soldOut || '');
    elements.availability.textContent = available ? (labels.available || '') : (labels.soldOut || '');
    elements.price.textContent = variant.price;
    if (elements.compare) {
      elements.compare.textContent = variant.comparePrice;
      elements.compare.hidden = !variant.onSale;
    }
    if (elements.saleBadge) elements.saleBadge.hidden = !variant.onSale;
    if (elements.stickyPrice) elements.stickyPrice.textContent = variant.price;
    if (variant.image) gallery.showSource(variant.image, variant.imageAlt || '');
    if (changeURL) {
      const url = new URL(location.href);
      url.searchParams.set('variant', variant.id);
      history.replaceState({}, '', url);
    }
  }

  select.addEventListener('change', () => {
    const variant = selectVariant(variants, select.value);
    const next = selectionFromVariant(options, variant);
    for (let index = 0; index < next.length; index += 1) selection[index] = next[index];
    update(false);
  }, { signal: abort.signal });

  update(false);
  return () => {
    abort.abort();
    picker.dispose();
    form();
    gallery.dispose();
    root.classList.remove('has-variant-options');
  };
}

// Related products: Shopify's recommendation engine via the Section Rendering
// API. Loads once, near the viewport; an empty recommendation set keeps the
// section invisible rather than inventing "related" merchandise.
export function mountRecommendations(root, { fetchImpl = (...arguments_) => fetch(...arguments_) } = {}) {
  const url = root.dataset.recommendationsUrl;
  if (!url || root.dataset.recommendations === undefined) return () => {};
  let cancelled = false;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    fetchImpl(url, { headers: { Accept: 'application/json' } })
      .then(response => {
        if (!response.ok) throw new Error(`Recommendations unavailable (${response.status}).`);
        return response.text();
      })
      .then(html => {
        if (cancelled) return;
        const incoming = document.createElement('div');
        incoming.innerHTML = html;
        const replacement = incoming.firstElementChild;
        if (!replacement || !replacement.innerHTML.trim()) return; // No recommendations: stay hidden.
        root.innerHTML = replacement.innerHTML;
        root.removeAttribute('data-recommendations');
      })
      .catch(() => { /* Recommendations are progressive; silence is acceptable. */ });
  }, { rootMargin: '400px' });
  observer.observe(root);
  return () => { cancelled = true; observer.disconnect(); };
}
