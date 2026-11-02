// Local-preview reader only: observes existing triggers on the shared clock.
export function mountTriggerInspection({ ScrollTrigger, scheduler, document, location }) {
  if (!document.body.hasAttribute('data-local-preview') || new URLSearchParams(location.search).get('inspect') !== '1') return () => {};
  const container = document.createElement('div');
  container.hidden = true;
  container.setAttribute('data-scroll-inspection', '');
  document.body.append(container);
  const records = new Map();
  let nextIdentity = 0;
  const selector = element => {
    if (!element?.tagName) return '';
    if (element.id) return `#${element.id}`;
    const classes = [...element.classList].filter(name => name !== 'is-active').slice(0, 3);
    return `${element.tagName.toLowerCase()}${classes.map(name => `.${name}`).join('')}`;
  };
  const read = () => {
    const triggers = ScrollTrigger.getAll();
    const live = new Set(triggers);
    for (const [trigger, record] of records) if (!live.has(trigger)) { record.output.remove(); records.delete(trigger); }
    triggers.forEach((trigger, order) => {
      let record = records.get(trigger);
      if (!record) {
        const output = document.createElement('output');
        output.setAttribute('data-scroll-trigger-record', '');
        record = { output, identity: nextIdentity++ };
        records.set(trigger, record);
        container.append(output);
      }
      const element = trigger.trigger;
      const chapter = element?.closest?.('[data-chapter], [data-hero]');
      const values = {
        identity: record.identity,
        order,
        id: trigger.vars.id || '',
        chapter: chapter?.dataset.chapter || (chapter?.hasAttribute('data-hero') ? 'hero' : ''),
        triggerSelector: selector(element),
        start: trigger.start,
        end: trigger.end,
        progress: trigger.progress,
        active: Boolean(trigger.isActive),
        pin: Boolean(trigger.pin),
        pinSelector: selector(trigger.pin),
        animationProgress: trigger.animation?.totalProgress() ?? null,
      };
      for (const [key, value] of Object.entries(values)) {
        const next = String(value);
        if (record.output.dataset[key] !== next) record.output.dataset[key] = next;
      }
      const serialized = JSON.stringify(values);
      if (record.output.textContent !== serialized) record.output.textContent = serialized;
    });
    container.dataset.count = String(triggers.length);
    container.dataset.scrollY = String(location === document.defaultView?.location ? document.defaultView.scrollY : 0);
  };
  read();
  const detach = scheduler.add(read);
  return () => { detach(); records.clear(); container.remove(); };
}
