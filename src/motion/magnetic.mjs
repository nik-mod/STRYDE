import { magneticOffset } from './study-state.mjs';

// The anchor never moves: only its visual contents respond inside a stable hitbox.
export function mountMagnetic(element, { gsap, signal, environment = window, limit = 5 }) {
  const content = element.querySelector('[data-magnetic-content]');
  if (!content || signal.aborted) return () => {};

  const listeners = new AbortController();
  const xTo = gsap.quickTo(content, 'x', { duration: .28, ease: 'power3.out' });
  const yTo = gsap.quickTo(content, 'y', { duration: .28, ease: 'power3.out' });
  let bounds = null;
  let inside = false;
  let disposed = false;

  const reset = () => { xTo(0); yTo(0); };
  const enter = () => { inside = true; bounds = element.getBoundingClientRect(); };
  const leave = () => { inside = false; bounds = null; reset(); };
  const move = event => {
    if (!inside || !bounds || element.matches(':focus-visible')) return;
    const offset = magneticOffset({ x: event.clientX, y: event.clientY }, bounds, limit);
    xTo(offset.x); yTo(offset.y);
  };
  const options = { signal: listeners.signal };
  element.addEventListener('pointerenter', enter, options);
  element.addEventListener('pointermove', move, options);
  element.addEventListener('pointerleave', leave, options);
  element.addEventListener('focusin', reset, options);
  element.addEventListener('blur', leave, options);
  environment.addEventListener('resize', () => { bounds = inside ? element.getBoundingClientRect() : null; }, options);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    xTo.tween.kill(); yTo.tween.kill();
    gsap.set(content, { clearProps: 'transform' });
    signal.removeEventListener('abort', dispose);
  };
  signal.addEventListener('abort', dispose, { once: true });
  return dispose;
}
