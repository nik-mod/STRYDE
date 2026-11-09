/** Enhance real form selects; the native GET form remains the no-JS fallback. */
export function mountCatalogPickers(form) {
  const doc = form.ownerDocument;
  const listeners = new AbortController();
  const pickers = [];
  let openPicker;
  const close = (restoreFocus = false) => {
    if (!openPicker) return;
    const { button, list } = openPicker;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus({ preventScroll: true });
    openPicker = null;
  };
  for (const select of form.querySelectorAll('.collection-select select')) {
    const field = select.parentElement;
    // A non-label wrapper avoids the label's native select activation competing
    // with the enhanced button and its options.
    const wrapper = doc.createElement('div');
    wrapper.className = field.className + ' has-picker';
    field.replaceWith(wrapper);
    wrapper.append(...field.childNodes);
    const label = wrapper.querySelector('span');
    label.id = `CatalogLabel-${select.name}`;
    const button = doc.createElement('button');
    button.type = 'button'; button.className = 'collection-picker-trigger';
    button.id = `CatalogTrigger-${select.name}`;
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-labelledby', `${label.id} ${button.id}`);
    const selectedLabel = doc.createElement('span');
    button.append(selectedLabel);
    const list = doc.createElement('div');
    list.id = `CatalogOptions-${select.name}`;
    list.className = 'collection-picker-options'; list.hidden = true;
    // Keep wheel/touch scrolling inside this list, outside the page scroller.
    list.setAttribute('data-lenis-prevent', '');
    list.addEventListener('wheel', event => event.stopPropagation(), { passive: true, signal: listeners.signal });
    let drag, swallowClick = false;
    const finishDrag = event => {
      if (!drag || drag.id !== event.pointerId) return;
      swallowClick = drag.moved;
      drag = null;
      list.classList.remove('is-dragging');
      if (list.hasPointerCapture(event.pointerId)) list.releasePointerCapture(event.pointerId);
    };
    list.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.offsetX >= list.clientWidth && event.target === list) return;
      swallowClick = false;
      drag = { id: event.pointerId, y: event.clientY, top: list.scrollTop, moved: false };
    }, { signal: listeners.signal });
    list.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      if (!event.buttons) { finishDrag(event); return; }
      const distance = event.clientY - drag.y;
      if (!drag.moved && Math.abs(distance) < 5) return;
      drag.moved = true;
      if (!list.hasPointerCapture(event.pointerId)) list.setPointerCapture(event.pointerId);
      list.classList.add('is-dragging');
      event.preventDefault();
      list.scrollTop = drag.top - distance;
    }, { signal: listeners.signal });
    list.addEventListener('pointerup', finishDrag, { signal: listeners.signal });
    list.addEventListener('pointercancel', finishDrag, { signal: listeners.signal });
    list.addEventListener('lostpointercapture', () => { drag = null; list.classList.remove('is-dragging'); }, { signal: listeners.signal });
    list.addEventListener('click', event => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault(); event.stopImmediatePropagation();
    }, { capture: true, signal: listeners.signal });
    list.setAttribute('role', 'listbox'); list.setAttribute('aria-labelledby', label.id);
    button.setAttribute('aria-controls', list.id);
    const options = [...select.options].map(option => {
      const choice = doc.createElement('button');
      choice.type = 'button'; choice.className = 'collection-picker-option'; choice.tabIndex = -1;
      choice.setAttribute('role', 'option'); choice.textContent = option.textContent;
      choice.addEventListener('click', () => {
        select.value = option.value; close(true); sync();
        select.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
      }, { signal: listeners.signal });
      list.append(choice); return choice;
    });
    const picker = { button, list, select, options };
    const show = (last = false) => {
      close(); openPicker = picker;
      const bounds = wrapper.getBoundingClientRect();
      const viewport = doc.defaultView.innerHeight;
      const header = (doc.querySelector('.site-header')?.offsetHeight || 0) + (doc.querySelector('.preview-notice')?.offsetHeight || 0);
      const below = viewport - bounds.bottom - 16, above = bounds.top - header - 16;
      const upward = below < 160 && above > below;
      list.style.top = upward ? 'auto' : 'calc(100% + 7px)';
      list.style.bottom = upward ? 'calc(100% + 7px)' : 'auto';
      list.style.maxHeight = `${Math.max(44, Math.min(340, viewport * .46, upward ? above : below))}px`;
      list.hidden = false; button.setAttribute('aria-expanded', 'true');
      options[last ? options.length - 1 : Math.max(0, select.selectedIndex)].focus({ preventScroll: true });
    };
    button.addEventListener('click', () => openPicker === picker ? close() : show(), { signal: listeners.signal });
    button.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); show(event.key === 'End');
        if (event.key === 'Home') options[0].focus();
      }
    }, { signal: listeners.signal });
    let typed = '', typedAt = 0;
    list.addEventListener('keydown', event => {
      const current = options.indexOf(doc.activeElement);
      let next;
      if (event.key === 'ArrowDown') next = (current + 1) % options.length;
      if (event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = options.length - 1;
      if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      if (event.key === 'Tab') { close(true); return; }
      if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typed = Date.now() - typedAt < 600 ? typed + event.key : event.key; typedAt = Date.now();
        const found = options.findIndex(option => option.textContent.toLocaleLowerCase().startsWith(typed.toLocaleLowerCase()));
        if (found >= 0) next = found;
      }
      if (next !== undefined) { event.preventDefault(); options[next].focus(); }
    }, { signal: listeners.signal });
    const sync = () => {
      selectedLabel.textContent = select.selectedOptions[0]?.textContent || select.options[0].textContent;
      options.forEach((option, index) => option.setAttribute('aria-selected', String(index === select.selectedIndex)));
    };
    wrapper.append(button, list); sync(); pickers.push({ ...picker, sync, wrapper });
  }
  doc.addEventListener('pointerdown', event => {
    if (openPicker && !openPicker.button.parentElement.contains(event.target)) close();
  }, { signal: listeners.signal });
  form.addEventListener('focusout', event => {
    if (openPicker && !openPicker.button.parentElement.contains(event.relatedTarget)) close();
  }, { signal: listeners.signal });
  return {
    sync: () => pickers.forEach(picker => picker.sync()),
    dispose: () => { close(); listeners.abort(); pickers.forEach(({ wrapper, button, list }) => { wrapper.classList.remove('has-picker'); button.remove(); list.remove(); }); },
  };
}
