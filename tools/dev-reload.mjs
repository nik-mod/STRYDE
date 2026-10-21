// Serialize source builds and only refresh after a successful build has finished.
export function createReloadQueue({ rebuild, broadcast, debounce = 100 }) {
  const pending = new Set();
  let timer; let current; let closed = false; let building = false;
  function schedule() {
    clearTimeout(timer);
    if (!closed) timer = setTimeout(drain, debounce);
  }
  function drain() {
    timer = undefined;
    if (closed || current || !pending.size) return;
    const files = [...pending]; pending.clear();
    const rebuildNeeded = files.some(file => file === 'src' || file.startsWith('src/'));
    current = (async () => {
      try {
        if (rebuildNeeded) { building = true; await rebuild(); }
        if (!closed) broadcast('reload', { files, rebuilt: rebuildNeeded });
      } catch (error) {
        if (!closed) broadcast('build-error', { message: 'JavaScript build failed. Fix the source; the next successful save will refresh the page.' });
        console.error('[dev] Build failed:', error.message);
      } finally {
        building = false;
      }
    })().finally(() => { current = undefined; if (pending.size) schedule(); });
  }
  return {
    get building() { return building; },
    add(file) { if (closed) return; pending.add(file.replaceAll('\\', '/')); schedule(); },
    async close() { closed = true; clearTimeout(timer); pending.clear(); await current; },
  };
}
