// Hero atmosphere: a slow field of soft light motes on the sky set. A 2D
// canvas keeps this off the WebGL renderer (the product owns that context);
// all animation shares the GSAP ticker — no second rAF loop. Depth layers
// parallax against scroll and pointer, so the resting hero breathes and the
// scrolled hero keeps a sense of air behind the product.
const LAYERS = [
  { count: 26, depth: .05, size: [4, 9], alpha: [.05, .12], rise: [4, 9] },
  { count: 20, depth: .12, size: [6, 13], alpha: [.08, .17], rise: [7, 13] },
  { count: 12, depth: .22, size: [10, 20], alpha: [.1, .2], rise: [10, 17] },
];

function makeSprite(size, tint) {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = size;
  const context = sprite.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(size / 2, size / 2, size * .04, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${tint},.9)`);
  gradient.addColorStop(.45, `rgba(${tint},.38)`);
  gradient.addColorStop(1, `rgba(${tint},0)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return sprite;
}

const randomBetween = ([min, max]) => min + Math.random() * (max - min);

export function mountAtmosphere(stage, { gsap, environment = window } = {}) {
  if (!stage || typeof stage.appendChild !== 'function' || typeof document === 'undefined') return () => {};
  if (environment.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-atmo-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  const context = canvas.getContext('2d');
  if (!context) return () => {};

  const sprites = [makeSprite(64, '255,255,255'), makeSprite(64, '214,238,252')].filter(Boolean);
  if (!sprites.length) return () => {};
  const layerParticles = LAYERS.map(layer => Array.from({ length: layer.count }, () => ({
    x: Math.random(), y: Math.random(),
    size: randomBetween(layer.size),
    alpha: randomBetween(layer.alpha),
    rise: randomBetween(layer.rise),
    sway: Math.random() * Math.PI * 2,
    swayRate: .12 + Math.random() * .2,
    sprite: sprites[Math.random() < .82 ? 0 : 1],
  })));

  let width = 0, height = 0, dpr = 1, visible = false, pointerX = 0, pointerTargetX = 0, removeTick = () => {};
  const resize = () => {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(environment.devicePixelRatio || 1, 1.5);
    width = Math.max(1, Math.round(rect.width)); height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  };
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(stage); resize();
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; }, { rootMargin: '60px' }) : null;
  observer?.observe(stage); visible = observer ? visible : true;

  const onPointer = event => {
    const rect = stage.getBoundingClientRect();
    pointerTargetX = ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
  };
  stage.addEventListener?.('pointermove', onPointer, { passive: true });

  const draw = time => {
    if (document.hidden || !visible || !width) return;
    const scroll = environment.scrollY || 0;
    pointerX += (pointerTargetX - pointerX) * .06;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    layerParticles.forEach((particles, layerIndex) => {
      const layer = LAYERS[layerIndex];
      const drift = (scroll * layer.depth) % (height + 240);
      for (const particle of particles) {
        const y = ((particle.y * (height + 240) - particle.rise * time - drift) % (height + 240) + (height + 240)) % (height + 240) - 120;
        const x = particle.x * width
          + Math.sin(time * particle.swayRate + particle.sway) * 16
          + pointerX * layer.depth * 90;
        const alpha = particle.alpha * (0.72 + 0.28 * Math.sin(time * .5 + particle.sway * 2.1));
        context.globalAlpha = Math.max(0, alpha);
        const drawSize = particle.size * 6;
        context.drawImage(particle.sprite, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
      }
    });
    context.globalAlpha = 1;
  };
  removeTick = (() => {
    const tick = time => draw(time);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  })();

  return () => {
    removeTick();
    resizeObserver?.disconnect();
    observer?.disconnect();
    stage.removeEventListener?.('pointermove', onPointer);
    canvas.remove();
  };
}
