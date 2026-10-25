import { mountProductGallery } from './product-gallery.mjs';

export function selectVariant(variants, id) {
  return variants.find(variant => String(variant.id) === String(id)) || null;
}
export function mountProduct(root) {
  const gallery = mountProductGallery(root);
  const select = root.querySelector('[data-variant-select]');
  const data = root.querySelector('[data-product-variants]');
  if (!select || !data) return () => gallery.dispose();
  const { variants, labels } = JSON.parse(data.textContent);
  const abort = new AbortController();
  const options = [...root.querySelectorAll('[data-variant-option]')];
  if (options.length) root.classList.add('has-variant-options');
  const update = (changeURL = true) => {
    const variant = selectVariant(variants, select.value);
    const button = root.querySelector('[data-add-to-cart]');
    button.disabled = !variant?.available || Boolean(root.querySelector('form[data-preview-commerce]'));
    button.childNodes[0].textContent = variant?.available ? labels.add : labels.soldOut;
    root.querySelector('[data-product-availability]').textContent = variant?.available ? labels.available : labels.soldOut;
    options.forEach(option => option.setAttribute('aria-pressed', String(option.dataset.variantOption === select.value)));
    if (!variant) return;
    root.querySelector('[data-product-price]').textContent = variant.price;
    const compare = root.querySelector('[data-product-compare]');
    compare.textContent = variant.comparePrice;
    compare.hidden = !variant.onSale;
    if (variant.image) gallery.showSource(variant.image, variant.imageAlt || '');
    if (changeURL) { const url = new URL(location.href); url.searchParams.set('variant', variant.id); history.replaceState({}, '', url); }
  };
  select.addEventListener('change', () => update(), { signal: abort.signal });
  options.forEach(option => option.addEventListener('click', () => {
    select.value = option.dataset.variantOption;
    update();
  }, { signal: abort.signal }));
  update(false);
  return () => { abort.abort(); gallery.dispose(); root.classList.remove('has-variant-options'); };
}
