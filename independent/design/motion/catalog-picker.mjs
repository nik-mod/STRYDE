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
    const list = doc.createElement('div');
    list.id = `CatalogOptions-${select.name}`;
    list.className = 'collection-picker-options'; list.hidden = true;
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
      button.textContent = select.selectedOptions[0]?.textContent || select.options[0].textContent;
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
