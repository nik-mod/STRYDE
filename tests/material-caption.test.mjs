import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { mountChapter } from '../src/motion/chapters.mjs';

test('Materials keeps exactly one full caption through both wipes and reverse seeks', () => {
  const previousWindow = globalThis.window;
  globalThis.window = { innerHeight: 900 };
  const panels = Array.from({ length: 3 }, () => {
    const image = { scale: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, style: { getPropertyValue: () => '0' } };
    const frame = { clipPath: 'inset(0% 0% 0% 0%)' };
    const copy = { opacity: 1, autoAlpha: 1 };
    return { autoAlpha: 1, image, frame, copy, querySelector: selector => ({ '.mat-frame > img': image, '.mat-frame': frame, '.mat-copy': copy })[selector] };
  });
  const root = { dataset: { chapter: 'materials' }, classList: { add() {}, remove() {} }, querySelectorAll: () => panels };
  let timeline;
  const clock = { ...gsap, timeline({ scrollTrigger, ...options }) { timeline = gsap.timeline({ ...options, paused: true }); return timeline; } };
  let dispose;
  try {
    dispose = mountChapter(root, { gsap: clock, mobile: false, fine: false });
    gsap.ticker.sleep();
    const positions = [0, .25, .29, .31, .33, .35, .38, .5, .61, .63, .66, .68, .7, .72, 1];
    const ownerAt = progress => {
      timeline.progress(progress, true);
      const visible = panels.filter(panel => panel.copy.opacity > .99 && panel.copy.autoAlpha > .99 && panel.autoAlpha > .99);
      assert.equal(visible.length, 1, `exactly one readable caption at ${progress}`);
      return panels.indexOf(visible[0]);
    };
    const forward = positions.map(ownerAt);
    assert.deepEqual(forward, [...positions].reverse().map(ownerAt).reverse(), 'reverse restores the same caption owner at each image state');
    assert.equal(forward[0], 0);
    assert.equal(forward.at(-1), 2);
  } finally {
    dispose?.();
    timeline?.kill();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    gsap.ticker.sleep();
  }
});
