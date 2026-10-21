// Hover owns only nested wrappers, never the scrubbed scene figure.
export function mountCollectionHover(scene, gsap, environment = window) {
  const visual = scene.querySelector('[data-coll-visual]');
  const image = visual?.querySelector('img');
  if (!visual || !image) return () => {};
  const listeners = new AbortController();
  const xTo = gsap.quickTo(image, 'x', { duration: .7, ease: 'power3.out' });
  const yTo = gsap.quickTo(image, 'y', { duration: .7, ease: 'power3.out' });
  let bounds = null;
  let visualTween;
  let disposed = false;
  const pose = (scale, y) => {
    visualTween?.kill();
    visualTween = gsap.to(visual, { scale, y, duration: .55, ease: 'power3.out' });
  };
  const reset = () => { bounds = null; pose(1, 0); xTo(0); yTo(0); };
  const options = { signal: listeners.signal };
  scene.addEventListener('pointerenter', () => {
    bounds = scene.getBoundingClientRect();
    pose(1.04, -10);
  }, options);
  scene.addEventListener('pointermove', event => {
    if (!bounds?.width || !bounds.height) return;
    const clamp = value => Math.max(-.5, Math.min(.5, value));
    xTo(clamp((event.clientX - bounds.left) / bounds.width - .5) * 10);
    yTo(clamp((event.clientY - bounds.top) / bounds.height - .5) * 8);
  }, options);
  scene.addEventListener('pointerleave', reset, options);
  environment.addEventListener('resize', () => { bounds = null; }, options);
  return () => {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    visualTween?.kill(); xTo.tween.kill(); yTo.tween.kill();
    gsap.set([visual, image], { clearProps: 'transform' });
  };
}
