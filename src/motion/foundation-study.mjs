import { chapterState } from './contracts.mjs';
import { smoothStep, studyKeyframes } from './study-state.mjs';

export function createFoundationStudy(root, { gsap, bus, mobile }) {
  const stage = root.querySelector('.foundation-stage');
  const primary = root.querySelector('[data-title-primary]');
  const secondary = root.querySelector('[data-title-secondary]');
  const primaryMask = root.querySelector('[data-type-mask-primary]');
  const secondaryMask = root.querySelector('[data-type-mask-secondary]');
  const art = root.querySelector('[data-asset-frame]');
  const plane = root.querySelector('[data-handoff-plane]');
  const fill = root.querySelector('[data-chapter-fill]');
  const surface = getComputedStyle(root).getPropertyValue('--surface').trim() || '#effaff';
  const frames = studyKeyframes(mobile);

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      // Header height must not subtract from travel. Read dimensions only on refresh.
      end: () => `+=${Math.max(1, root.offsetHeight - stage.offsetHeight)}`,
      pin: stage,
      pinSpacing: false,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: self => bus.publish(chapterState(0, self.progress, self.direction)),
    },
  });

  timeline.set(primaryMask, { clipPath: 'inset(0% 0% 0% 0%)' }, 0);
  timeline.set(secondaryMask, { clipPath: 'inset(0% 0% 0% 0%)' }, 0);
  for (let index = 1; index < frames.length; index++) {
    const previous = frames[index - 1];
    const frame = frames[index];
    const timing = { duration: frame.at - previous.at, ease: smoothStep };
    timeline.to(art, { ...frame.art, ...timing }, previous.at)
      .to(primary, { ...frame.primary, ...timing }, previous.at)
      .to(secondary, { ...frame.secondary, ...timing }, previous.at)
      .to(primaryMask, { clipPath: `inset(0% 0% ${frame.crop}% 0%)`, ...timing }, previous.at)
      .to(secondaryMask, { clipPath: `inset(${frame.crop}% 0% 0% 0%)`, ...timing }, previous.at);
  }

  // One diagonal material plane resolves the study into the actual footer surface.
  timeline.set(plane, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' }, 0);
  timeline.to(plane, { clipPath: 'polygon(0% 72%, 100% 32%, 100% 100%, 0% 100%)', duration: .22, ease: smoothStep }, .62);
  timeline.to(plane, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .16, ease: smoothStep }, .84);
  timeline.to(root, { backgroundColor: surface, duration: .38, ease: smoothStep }, .62);
  timeline.to(fill, { scaleX: 1, duration: 1, ease: 'none' }, 0);
  return timeline;
}
