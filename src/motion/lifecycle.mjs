// Own asynchronous resources across section unloads and media-query changes.
export function createScope() {
  const controller = new AbortController(); const cleanups = new Set();
  const add = cleanup => { if (typeof cleanup !== 'function') return; if (controller.signal.aborted) cleanup(); else cleanups.add(cleanup); };
  return {
    signal: controller.signal,
    add,
    async run(initialize) { try { add(await initialize(controller.signal)); } catch (error) { if (!controller.signal.aborted) throw error; } },
    dispose() { if (controller.signal.aborted) return; controller.abort(); for (const cleanup of cleanups) cleanup(); cleanups.clear(); },
  };
}
export function createScheduler(ticker) {
  const frames = new Set(); let lenis = null; let ticking = false;
  const tick = time => { lenis?.raf(time * 1000); for (const frame of frames) frame(time); };
  const sync = () => { const needsTick = Boolean(lenis || frames.size); if (needsTick === ticking) return; ticking = needsTick; if (ticking) ticker.add(tick); else ticker.remove(tick); };
  return {
    add(frame) { frames.add(frame); sync(); return () => { frames.delete(frame); sync(); }; },
    setLenis(value) { lenis = value; sync(); },
    dispose() { frames.clear(); lenis = null; sync(); },
  };
}
