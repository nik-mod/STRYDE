export function selectVariant(variants, id) {
  return variants.find(variant => String(variant.id) === String(id)) || null;
}
export function mountProduct(root) {
  const select = root.querySelector('[data-variant-select]');
  const data = root.querySelector('[data-product-variants]');
  if (!select || !data) return () => {};
  const { variants, labels } = JSON.parse(data.textContent);
  const abort = new AbortController();
  const image = root.querySelector('[data-product-media] img');
  const update = (changeURL = true) => {
    const variant = selectVariant(variants, select.value);
    const button = root.querySelector('[data-add-to-cart]');
    button.disabled = !variant?.available || Boolean(root.querySelector('form[data-preview-commerce]'));
    button.childNodes[0].textContent = variant?.available ? labels.add : labels.soldOut;
    root.querySelector('[data-product-availability]').textContent = variant?.available ? labels.available : labels.soldOut;
    if (!variant) return;
    root.querySelector('[data-product-price]').textContent = variant.price;
    const compare = root.querySelector('[data-product-compare]');
    compare.textContent = variant.comparePrice;
    compare.hidden = !variant.onSale;
    if (image && variant.image) { image.removeAttribute('srcset'); image.src = variant.image; image.alt = variant.imageAlt || ''; }
    if (changeURL) { const url = new URL(location.href); url.searchParams.set('variant', variant.id); history.replaceState({}, '', url); }
  };
  select.addEventListener('change', () => update(), { signal: abort.signal });
  root.querySelectorAll('[data-product-thumbnail]').forEach(thumbnail => thumbnail.addEventListener('click', event => {
    if (!image) return;
    event.preventDefault(); image.removeAttribute('srcset'); image.src = thumbnail.dataset.imageUrl; image.alt = thumbnail.dataset.imageAlt;
  }, { signal: abort.signal }));
  update(false);
  return () => abort.abort();
}
