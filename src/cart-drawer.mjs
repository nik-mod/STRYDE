// Cart drawer controller. One shared client per page drives the drawer, the
// header count and the cart page; content re-renders through the Section
// Rendering API so Liquid keeps formatting prices, discounts and translations.
// In the local preview the same code runs against mock endpoints; the checkout
// link is intercepted there and replaced with an explicit no-order notice.

import { createCartClient, fetchSections } from './cart.mjs';

let controller = null;
export function getCartController() { return controller; }

function readConfig(document) {
  const node = document.querySelector('script[data-cart-config]');
  if (!node) return null;
  try { return JSON.parse(node.textContent); } catch { return null; }
}

function announce(message) {
  const region = document.getElementById('CartStatus');
  if (region) region.textContent = message;
}

export function mountCartDrawer({ document, fetchImpl = (...arguments_) => fetch(...arguments_) } = {}) {
  const dialog = document.querySelector('dialog[data-cart-drawer]');
  const config = readConfig(document);
  if (!dialog || !config?.routes) return () => {};
  const { routes } = config;
  const client = createCartClient({ routes, fetchImpl });
  if (!client) return () => {};
  const devPreview = document.body.hasAttribute('data-local-preview');
  let refreshToken = 0;
  let disposed = false;

  function content() { return dialog.querySelector('[data-cart-drawer-content]'); }

  async function refresh() {
    const token = ++refreshToken;
    dialog.dataset.busy = 'true';
    try {
      const sections = await fetchSections(routes.root || '/', ['cart-drawer'], fetchImpl);
      if (disposed || token !== refreshToken) return;
      const next = document.createElement('div');
      next.innerHTML = sections['cart-drawer'];
      const incoming = next.querySelector('[data-cart-drawer-content]');
      if (incoming && content()) content().innerHTML = incoming.innerHTML;
    } catch (error) {
      announce(error.message);
    } finally {
      if (token === refreshToken) delete dialog.dataset.busy;
    }
  }

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    dialog.querySelector('[data-cart-close]')?.focus();
    void refresh();
  }

  function close() { if (dialog.open) dialog.close(); }

  dialog.addEventListener('click', event => {
    if (event.target === dialog) { close(); return; }
    const closeButton = event.target.closest('[data-cart-close]');
    if (closeButton) { event.preventDefault(); close(); return; }
    const closeLink = event.target.closest('[data-cart-close-link]');
    if (closeLink) { close(); return; } // The link still navigates natively.
    const quantityButton = event.target.closest('[data-cart-quantity]');
    if (quantityButton) {
      event.preventDefault();
      const quantity = Number(quantityButton.dataset.quantity);
      const key = quantityButton.dataset.key;
      dialog.dataset.busy = 'true';
      client.change({ key, quantity })
        .then(() => refresh())
        .catch(error => { announce(error.message); delete dialog.dataset.busy; });
      return;
    }
    const removeButton = event.target.closest('[data-cart-remove]');
    if (removeButton) {
      event.preventDefault();
      const row = removeButton.closest('[data-cart-item]');
      const title = row?.querySelector('h3')?.textContent?.trim() || '';
      dialog.dataset.busy = 'true';
      client.change({ key: removeButton.dataset.key, quantity: 0 })
        .then(() => { if (title) announce(title + ' — removed'); return refresh(); })
        .catch(error => { announce(error.message); delete dialog.dataset.busy; });
      return;
    }
    const checkout = event.target.closest('[data-cart-checkout]');
    if (checkout) {
      // Production navigates to Shopify's hosted checkout. The local preview
      // must never pretend an order happened, so it stops here and says so.
      if (devPreview) {
        event.preventDefault();
        const notice = dialog.querySelector('[data-dev-checkout]');
        if (notice) notice.hidden = false;
      }
    }
  });

  document.addEventListener('stryde:cart:change', event => {
    const count = event.detail?.cart?.item_count;
    if (!Number.isFinite(count)) return;
    for (const element of document.querySelectorAll('[data-cart-count]')) element.textContent = String(count);
  });

  document.addEventListener('stryde:cart:error', event => {
    announce(event.detail?.message || 'Cart error');
  });

  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-cart-open]');
    if (!opener) return;
    event.preventDefault();
    open();
  });

  controller = { client, open, close, refresh, get openState() { return dialog.open; } };

  return () => { close(); disposed = true; if (controller && controller.client === client) controller = null; };
}
