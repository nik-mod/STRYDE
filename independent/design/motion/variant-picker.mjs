// Footwear option matrix: sizes, colours, or plain values. Pure functions
// resolve which variant a selection points at and which values are still
// possible; the DOM layer keeps buttons, the native <select> and the URL in
// sync with that resolution.

export function normalizeOptions(options) {
  return (options || []).map((option, index) => ({
    name: String(option.name || `Option ${index + 1}`),
    position: Number(option.position) || index + 1,
    values: (option.values || []).map(String),
  }));
}

export function normalizeVariants(variants) {
  return (variants || []).map(variant => ({
    ...variant,
    options: (variant.options || []).map(value => (value === null || value === undefined ? '' : String(value))),
  }));
}

// The first variant whose option values match every filled selection slot.
// Unfilled slots (null) match anything, so partial selections resolve to null
// only when no variant completes them.
export function resolveVariant(variants, selection) {
  return normalizeVariants(variants).find(variant => variant.options.every((value, index) => selection[index] === undefined || selection[index] === null || selection[index] === value)) || null;
}

export function selectionFromVariant(options, variant) {
  const selection = [];
  for (const option of normalizeOptions(options)) selection[option.position - 1] = variant?.options?.[option.position - 1] ?? null;
  return selection;
}

// A value at one position lands in one of three states:
// - 'available': some in-stock variant carries it and agrees with the other
//   selected values. Normal button.
// - 'partial': no in-stock variant fits the current other selections, but the
//   value is purchasable in another combination. Rendered de-emphasised and
//   still clickable — footwear needs this so a customer can jump from
// "Chalk / 40" to "Graphite" without a dead end; clicking relaxes the
//   conflicting selections.
// - 'unavailable' / 'none': every variant with this value is sold out, or no
//   variant carries it at all. Disabled.
export function valueAvailability(variants, position, value, selection) {
  const index = position - 1;
  let exists = false;
  let purchasableAnywhere = false;
  let compatibleAvailable = false;
  for (const variant of normalizeVariants(variants)) {
    if (variant.options[index] !== value) continue;
    exists = true;
    if (variant.available) purchasableAnywhere = true;
    const compatible = variant.options.every((optionValue, optionIndex) => optionIndex === index || selection[optionIndex] === undefined || selection[optionIndex] === null || selection[optionIndex] === optionValue);
    if (compatible && variant.available) { compatibleAvailable = true; break; }
  }
  if (compatibleAvailable) return 'available';
  if (purchasableAnywhere) return 'partial';
  return exists ? 'unavailable' : 'none';
}

// After picking a 'partial' value, drop the other selections that no longer
// lead to a purchasable variant, keeping every still-valid choice in place.
export function relaxConflicts(variants, selection, position) {
  const picked = selection[position - 1];
  if (picked === undefined || picked === null) return selection;
  for (let index = 0; index < selection.length; index += 1) {
    if (index === position - 1 || selection[index] === undefined || selection[index] === null) continue;
    const viable = normalizeVariants(variants).some(variant => variant.available
      && variant.options[position - 1] === picked
      && variant.options[index] === selection[index]);
    if (!viable) selection[index] = null;
  }
  return selection;
}

export function mountVariantPicker(root, { onChange, getVariants, getSelection } = {}) {
  const picker = root.querySelector('[data-variant-picker]');
  if (!picker) return () => {};
  const abort = new AbortController();
  const status = picker.querySelector('[data-variant-status]');
  const optionsSignal = { signal: abort.signal };

  picker.addEventListener('click', event => {
    const button = event.target.closest('[data-variant-value]');
    if (!button || button.getAttribute('aria-disabled') === 'true' || button.disabled) return;
    const group = button.closest('[data-variant-group]');
    const position = Number(group.dataset.optionPosition);
    onChange?.(position, button.dataset.variantValue);
  }, optionsSignal);

  function render({ variants, options, selection, variant, labels }) {
    for (const group of picker.querySelectorAll('[data-variant-group]')) {
      const position = Number(group.dataset.optionPosition);
      const option = normalizeOptions(options).find(entry => entry.position === position);
      if (!option) continue;
      const selectedValue = selection[position - 1] ?? null;
      const selectedLabel = group.querySelector('[data-option-selected]');
      if (selectedLabel) selectedLabel.textContent = selectedValue ? ` — ${selectedValue}` : '';
      for (const button of group.querySelectorAll('[data-variant-value]')) {
        const state = valueAvailability(variants, position, button.dataset.variantValue, selection);
        button.setAttribute('aria-pressed', String(selectedValue === button.dataset.variantValue));
        button.setAttribute('aria-disabled', String(state === 'unavailable' || state === 'none'));
        button.dataset.variantState = state;
        if (state === 'none') button.hidden = true; else button.hidden = false;
      }
      // Hide groups whose every value became impossible only when another
      // option already narrows the matrix; a lone option always shows all values.
    }
    if (status) {
      const missing = normalizeOptions(options).find(option => !selection[option.position - 1]);
      status.textContent = !variant && missing
        ? (labels?.selectOption || 'Select {{ option }}').replace('{{ option }}', missing.name)
        : !variant ? (labels?.unavailableCombination || '') : '';
    }
  }

  return { render, dispose: () => abort.abort() };
}
