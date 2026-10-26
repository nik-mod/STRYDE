// Buy-box wiring: AJAX add-to-bag through the shared cart client, inline error
// handling, a mobile sticky purchase bar, and a full no-JS fallback — when the
// cart controller is missing the native form POST simply proceeds.

import { getCartController } from './cart-drawer.mjs';

export function mountProductForm(root, { labels = {}, devPreview = false } = {}) {
  const form = root.querySelector('form.product-form');
  const button = root.querySelector('[data-add-to-cart]');
  if (!form || !button) return () => {};
  const quantity = form.querySelector('[name="quantity"]');
  const error = root.querySelector('[data-form-error]');
  const sticky = root.querySelector('[data-sticky-purchase]');
  const stickyButton = sticky?.querySelector('[data-sticky-add]');
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let submitting = false;

  function announce(message) {
    const region = document.getElementById('CartStatus');
    if (region) region.textContent = message;
  }

  function setBusy(busy) {
    submitting = busy;
    button.dataset.currentLabel ??= button.childNodes[0].textContent;
    const unavailable = button.dataset.unavailable === 'true';
    button.disabled = busy || unavailable;
    if (stickyButton) stickyButton.disabled = busy || unavailable;
    button.childNodes[0].textContent = busy
      ? (labels.adding || 'Adding…')
      : unavailable ? (labels.soldOut || button.dataset.currentLabel) : button.dataset.currentLabel;
  }

  async function submit(variantId, amount) {
    const controller = getCartController();
    if (!controller) return true; // No drawer/client: let the native POST run.
    if (submitting) return false;
    setBusy(true);
    if (error) { error.hidden = true; error.textContent = ''; }
    try {
      await controller.client.add({ id: variantId, quantity: amount });
      announce(labels.added || 'Added to bag');
      controller.open();
      return false;
    } catch (failure) {
      if (error) { error.textContent = failure.message; error.hidden = false; }
      else announce(failure.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener('submit', event => {
    const controller = getCartController();
    if (!controller) return; // Native POST fallback (no-JS or drawer missing).
    event.preventDefault();
    const select = form.querySelector('[data-variant-select]');
    const variantId = select?.value;
    if (!variantId || button.disabled) return;
    void submit(variantId, Math.max(1, Number(quantity?.value) || 1));
  }, options);

  if (stickyButton && sticky) {
    stickyButton.addEventListener('click', () => {
      const select = form.querySelector('[data-variant-select]');
      const variantId = select?.value;
      if (!variantId || button.disabled) return;
      void submit(variantId, Math.max(1, Number(quantity?.value) || 1));
    }, options);
    const reveal = new IntersectionObserver(entries => {
      const offscreen = !entries.some(entry => entry.isIntersecting);
      const variantReady = Boolean(form.querySelector('[data-variant-select]')?.value) && button.dataset.unavailable !== 'true';
      sticky.hidden = !(offscreen && variantReady);
    }, { rootMargin: '-10% 0px' });
    reveal.observe(button);
    abort.signal.addEventListener('abort', () => reveal.disconnect());
  }

  return () => abort.abort();
}
