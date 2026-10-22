import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { mountHero } from '../src/motion/hero.mjs';

function heroHarness() {
  const selectors = [
    'stage', 'line-1', 'line-2', 'art', 'float', 'depth', 'type', 'ring', 'copy', 'foot', 'cue',
  ];
  const targets = Object.fromEntries(selectors.map(name => [name, {
    opacity: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, rotation: 0,
  }]));
  targets.stage.offsetHeight = 900;
  targets.stage.backgroundColor = '#b9d5e6';
  const root = { querySelector: selector => targets[selector.match(/^\[data-hero-(.*)\]$/)?.[1]] || null };
  let scrub, intro, trigger;
  const timelines = [];
  const clock = {
    ...gsap,
    timeline(options = {}) {
      const { scrollTrigger, ...settings } = options;
      const timeline = gsap.timeline({ ...settings, ...(scrollTrigger ? { paused: true } : {}) });
      timelines.push(timeline);
      if (scrollTrigger) {
        scrub = timeline;
        trigger = { ...scrollTrigger, progress: 0, direction: 1, kill() {} };
        timeline.scrollTrigger = trigger;
      } else intro = timeline;
      return timeline;
    },
  };
  const dispose = mountHero(root, { gsap: clock, bus: { publish() {} }, mobile: false, hasModel: true, paper: '#b9d5e6' });
  // Stop wall-clock advancement; explicit seeks below still run genuine GSAP
  // lazy initialization, overwrite resolution and interpolation.
  gsap.ticker.sleep();
  return {
    targets, intro,
    seek(progress) {
      trigger.direction = progress < trigger.progress ? -1 : 1;
      trigger.progress = progress;
      // ScrollTrigger renders its timeline before delivering onUpdate. This
      // ordering reproduces the first scroll capturing an unfinished entrance.
      scrub.progress(progress, true);
      trigger.onUpdate(trigger);
    },
    snapshot() {
      return Object.fromEntries(['art', 'copy', 'foot'].map(name => [name,
        Object.fromEntries(['opacity', 'y', 'yPercent', 'scale'].map(key => [key, targets[name][key]])),
      ]));
    },
    dispose() { dispose(); timelines.forEach(timeline => timeline.kill()); gsap.ticker.sleep(); },
  };
}

test('first hero scroll takes over an unfinished entrance and reverses to the established composition', () => {
  const previousWindow = globalThis.window;
  globalThis.window = Object.assign(new EventTarget(), { scrollY: 0 });
  let reference, interrupted;
  try {
    reference = heroHarness();
    reference.intro.progress(1, true);
    reference.seek(.87);
    reference.seek(0);
    const start = reference.snapshot();
    reference.seek(.03);
    const nearStart = reference.snapshot();

    interrupted = heroHarness();
    interrupted.intro.time(.08, true);
    assert(interrupted.targets.copy.opacity < 1, 'the delayed copy entrance must still be unfinished');
    interrupted.seek(.87);
    interrupted.seek(0);
    assert.deepEqual(interrupted.snapshot(), start, 'reverse must restore the completed entrance, regardless of lazy capture');
    assert.equal(interrupted.targets.copy.opacity, 1);
    assert.equal(interrupted.targets.copy.y, 0);
    assert.equal(interrupted.targets.foot.opacity, 1);
    assert.equal(interrupted.targets.art.opacity, 1);
    interrupted.seek(.03);
    assert.deepEqual(interrupted.snapshot(), nearStart, 'near-start motion must match a normal completed entrance');
    assert.equal(interrupted.intro.parent, null, 'the entrance must release ownership after scroll takes over');
  } finally {
    interrupted?.dispose();
    reference?.dispose();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    gsap.ticker.sleep();
  }
});

test('hero field and commerce restore after a full seek and an interrupted entrance', () => {
  const previousWindow = globalThis.window;
  globalThis.window = Object.assign(new EventTarget(), { scrollY: 0 });
  let harness;
  try {
    harness = heroHarness();
    harness.intro.time(.05, true);
    harness.seek(1);
    assert.deepEqual(gsap.utils.splitColor(harness.targets.stage.backgroundColor).slice(0, 3), [239, 250, 255]);
    assert.equal(harness.targets.foot.opacity, 0, 'commerce yields before the shared product bridge');
    harness.seek(0);
    assert.deepEqual(gsap.utils.splitColor(harness.targets.stage.backgroundColor).slice(0, 3), [185, 213, 230]);
    assert.equal(harness.targets.foot.opacity, 1);
    assert.equal(harness.targets.foot.y, 0);
    harness.seek(.5);
    assert.deepEqual(gsap.utils.splitColor(harness.targets.stage.backgroundColor).slice(0, 3), [185, 213, 230]);
  } finally {
    harness?.dispose();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    gsap.ticker.sleep();
  }
});
