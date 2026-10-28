// Exposure matching across the actual, measured chapter boundary. There is no
// transition timer: skipped frames, reverse seeks and pins give the same grade.
export const CHAPTER_SURFACES = Object.freeze({
  hero: '#b9dced', deconstruction: '#eef5f7', materials: '#bfdfea',
  technology: '#092e46', collection: '#d9e9f1', featured: '#eef5f7',
  brand: '#061e30', finale: '#0b354c', footer: '#061e30',
});
const clamp = p => Math.max(0, Math.min(1, p));
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, p) => a.map((v, i) => Math.round(v + (b[i] - v) * p));
const css = c => `rgb(${c.join(', ')})`;
const luminance = c => c.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((n, v, i) => n + v * [.2126, .7152, .0722][i], 0);

export function chapterGrade(chapters, height) {
  let from = chapters[0]?.name || 'hero', to = from, progress = 0;
  for (let i = 1; i < chapters.length; i++) {
    const next = chapters[i];
    if (next.top >= height) break;
    from = chapters[i - 1].name; to = next.name;
    progress = clamp((height - next.top) / height);
    if (next.top > 0) break;
  }
  const blend = progress * progress * (3 - 2 * progress);
  const surface = mix(rgb(CHAPTER_SURFACES[from]), rgb(CHAPTER_SURFACES[to]), blend);
  const l = luminance(surface);
  // Preserve brand ink at the resting palettes. In the exposure crossover use
  // black/white so overlapping light/dark chapter copy remains readable.
  const ink = l > .179 ? mix([0, 0, 0], [16, 43, 59], clamp((l - .22) / .35))
    : mix([255, 255, 255], [238, 245, 247], clamp((.15 - l) / .10));
  return { from, to, progress: blend, surface: css(surface), ink: css(ink), light: l <= .179 };
}

export function chapterAtMidpoint(chapters, height) {
  return chapters.filter(chapter => chapter.top <= height / 2).at(-1)?.name || chapters[0]?.name || 'hero';
}

export function mountChapterContinuity({ document, scheduler, onActive }) {
  const environment = document.defaultView, body = document.body;
  if (!body.classList.contains('template-index')) return () => {};
  let targets = [], previous = '';
  const collect = () => {
    targets = [...document.querySelectorAll('section[data-env], [data-signature-footer]')];
  };
  const read = () => {
    const chapters = targets.map(e => ({ name: e.dataset.env || 'footer', top: e.getBoundingClientRect().top }));
    const state = chapterGrade(chapters, environment.innerHeight);
    const active = chapterAtMidpoint(chapters, environment.innerHeight);
    onActive?.(active === 'footer' ? 'finale' : active);
    const signature = `${state.surface}:${state.ink}:${state.from}:${state.to}:${state.progress.toFixed(4)}`;
    if (signature === previous) return;
    previous = signature;
    body.style.setProperty('--journey-surface', state.surface);
    body.style.setProperty('--journey-ink', state.ink);
    body.dataset.gradeFrom = state.from; body.dataset.gradeTo = state.to;
    body.dataset.gradeProgress = state.progress.toFixed(4);
    body.style.setProperty('--hero-surface-exit', state.from === 'hero' && state.to === 'deconstruction' ? state.progress.toFixed(4) : '0');
    const studioPresence = state.from === 'brand' ? 1 - state.progress : state.to === 'brand' ? state.progress : 0;
    body.style.setProperty('--journey-studio-light', `rgba(23, 62, 86, ${studioPresence.toFixed(3)})`);
    body.classList.toggle('journey-light-ink', state.light);
  };
  collect(); read(); body.classList.add('has-chapter-continuity');
  const detach = scheduler.add(read);
  document.addEventListener('shopify:section:load', collect);
  document.addEventListener('shopify:section:unload', collect);
  return () => {
    detach(); document.removeEventListener('shopify:section:load', collect); document.removeEventListener('shopify:section:unload', collect);
    body.classList.remove('has-chapter-continuity', 'journey-light-ink');
    body.style.removeProperty('--journey-surface'); body.style.removeProperty('--journey-ink');
    body.style.removeProperty('--journey-studio-light');
    body.style.removeProperty('--hero-surface-exit');
    delete body.dataset.gradeFrom; delete body.dataset.gradeTo; delete body.dataset.gradeProgress;
  };
}
