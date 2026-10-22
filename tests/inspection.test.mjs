import test from 'node:test';
import assert from 'node:assert/strict';
import { mountTriggerInspection } from '../src/motion/inspection.mjs';

function element() {
  return { dataset: {}, children: [], parent: null,
    setAttribute() {},
    append(child) { child.parent = this; this.children.push(child); },
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; },
  };
}

test('trigger inspection stays preview-only and reads actual triggers without creating animation work', () => {
  const location = { search: '?inspect=1' };
  const body = element(); let local = false; body.hasAttribute = () => local;
  const document = { body, createElement: element, defaultView: { location, scrollY: 25 } };
  const jobs = new Set();
  const scheduler = { add(job) { jobs.add(job); return () => jobs.delete(job); } };
  const chapter = { tagName: 'SECTION', id: 'hero', classList: [], dataset: {}, hasAttribute: () => true };
  chapter.closest = () => chapter;
  const trigger = { vars: { id: 'hero-main' }, trigger: chapter, start: 10, end: 900, progress: .25, isActive: true, pin: chapter, animation: { totalProgress: () => .25 } };
  let triggers = [trigger];
  const ScrollTrigger = { getAll: () => triggers, create() { assert.fail('inspection must not create triggers'); } };
  const options = { ScrollTrigger, scheduler, document, location };
  mountTriggerInspection(options)();
  assert.equal(jobs.size, 0); assert.equal(body.children.length, 0);
  local = true; location.search = '';
  mountTriggerInspection(options)();
  assert.equal(jobs.size, 0); assert.equal(body.children.length, 0);
  location.search = '?inspect=1';
  const dispose = mountTriggerInspection(options);
  assert.equal(jobs.size, 1);
  const container = body.children[0], record = container.children[0];
  assert.equal(container.hidden, true);
  assert.equal(container.children.length, 1);
  assert.equal(record.dataset.start, '10'); assert.equal(record.dataset.end, '900');
  assert.equal(record.dataset.progress, '0.25');
  trigger.progress = .75; trigger.start = 20;
  for (const job of jobs) job();
  assert.equal(container.children.length, 1, 'updates reuse the record for the same actual trigger');
  assert.equal(record.dataset.progress, '0.75'); assert.equal(record.dataset.start, '20');
  triggers = [];
  for (const job of jobs) job();
  assert.equal(container.children.length, 0);
  dispose();
  assert.equal(jobs.size, 0); assert.equal(body.children.length, 0);
});
