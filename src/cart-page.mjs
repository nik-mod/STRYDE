// Cart page: AJAX quantity edits and removals through the shared cart client,
// re-rendered by the Section Rendering API so totals, discounts and empty
// states always come back from Shopify formatted. The native form POST remains
// the fallback whenever the cart controller is unavailable.

import { getCartController } from './cart-drawer.mjs';
import { fetchSections } from './cart.mjs';

export function mountCartPage(root, { fetchImpl = (...arguments_) => fetch(...arguments_) } = {}) {
  const controller = getCartController();
  if (!controller) return () => {};
  const configNode = document.querySelector('script[data-cart-config]');
  let routes = null;
  try { routes = JSON.parse(configNode?.textContent || 'null')?.routes; } catch { routes = null; }
  if (!routes?.cart) return () => {};
  const main = document.getElementById('MainContent');
  if (!main) return () => {};
  // main survives the section swap; delegating there keeps working after re-render.
  const delegate = main;
  let busy = false;
  let rerenderToken = 0;
  let disposed = false;

  function announce(message) {
    const region = document.getElementById('CartStatus');
    if (region) region.textContent = message;
  }

  async function rerender() {
    const token = ++rerenderToken;
    busy = true;
    delegate.dataset.cartBusy = 'true';
    try {
      const sections = await fetchSections(routes.cart, ['main-cart'], fetchImpl);
      if (disposed || token !== rerenderToken) return;
      const incoming = document.createElement('div');
      incoming.innerHTML = sections['main-cart'];
      const next = incoming.querySelector('[data-cart-page]');
      if (next) main.innerHTML = next.outerHTML;
    } catch (error) {
      announce(error.message);
    } finally {
      if (token === rerenderToken) { busy = false; delete delegate.dataset.cartBusy; }
    }
  }

  function mutate(intent, message) {
    if (busy) return;
    busy = true;
    delegate.dataset.cartBusy = 'true';
    controller.client.change(intent)
      .then(() => { if (message) announce(message); return rerender(); })
      .catch(error => { announce(error.message); busy = false; delete delegate.dataset.cartBusy; });
  }

  function onClick(event) {
    const remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      const row = remove.closest('[data-cart-item]');
      const title = row?.querySelector('h2')?.textContent?.trim() || '';
      // Without JavaScript this remains a plain link to url_to_remove.
      event.preventDefault();
      mutate({ key: remove.dataset.key, quantity: 0 }, title ? `${title} — removed` : '');
    }
  }

  function onChange(event) {
    const input = event.target.closest('[data-quantity-input]');
    if (!input) return;
    const quantity = Math.max(0, Math.floor(Number(input.value) || 0));
    mutate({ key: input.dataset.key, quantity });
  }

  function onSubmit(event) {
    // The checkout submit stays native (it POSTs to Shopify); only guard
    // double submissions of it and the update button.
    if (busy) { event.preventDefault(); return; }
    const submitter = event.submitter;
    if (submitter?.name === 'checkout' || submitter?.name === 'update') submitter.disabled = true;
  }

  delegate.addEventListener('click', onClick);
  delegate.addEventListener('change', onChange);
  delegate.addEventListener('submit', onSubmit);
  return () => {
    disposed = true;
    delegate.removeEventListener('click', onClick);
    delegate.removeEventListener('change', onChange);
    delegate.removeEventListener('submit', onSubmit);
  };
}
