import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { context } from 'esbuild';
import { buildOptions, isGeneratedScript, pruneChunks } from './build-config.mjs';
import { createPreviewServer } from './preview.mjs';
import { createReloadQueue } from './dev-reload.mjs';

const clientScript = `<script data-stryde-dev>
(() => {
  let events; let instance;
  function connect() {
    events = new EventSource('/__stryde_dev/events');
    events.addEventListener('hello', event => {
      const next = JSON.parse(event.data).instance;
      if (instance && instance !== next) location.reload();
      instance = next;
    });
    events.addEventListener('reload', () => location.reload());
    events.addEventListener('build-error', event => console.error('[STRYDE dev]', JSON.parse(event.data).message));
  }
  connect();
  addEventListener('pagehide', () => events.close());
  addEventListener('pageshow', event => { if (event.persisted) connect(); });
})();
</script>`;

export async function startDevelopment({ port = Number(process.env.PORT || 9292), host = '127.0.0.1', debounce = 100 } = {}) {
  const compiler = await context(buildOptions);
  const generated = new Map();
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  async function rebuild() {
    const result = await compiler.rebuild();
    const outputs = Object.keys(result.metafile.outputs).map(file => file.replaceAll('\\', '/'));
    for (const file of generated.keys()) if (!outputs.includes(file)) generated.set(file, null);
    await pruneChunks(result);
    for (const file of outputs) if (isGeneratedScript(file)) generated.set(file, digest(await readFile(file)));
  }
  try { await rebuild(); }
  catch (error) { await compiler.dispose(); throw error; }
  const instance = randomUUID();
  const clients = new Set(); const watchers = [];
  let closing;
  function broadcast(event, data) {
    for (const client of clients) client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (event === 'reload') console.log(`[dev] Refreshed: ${data.files.join(', ')}${data.rebuilt ? ' (rebuilt JavaScript)' : ''}`);
  }
  const queue = createReloadQueue({
    debounce, broadcast,
    rebuild,
  });
  const server = createPreviewServer({
    handleRequest(req, res, url) {
      if (url.pathname !== '/__stryde_dev/events') return false;
      if (req.method !== 'GET') { res.writeHead(405); res.end(); return true; }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write(`retry: 250\nevent: hello\ndata: ${JSON.stringify({ instance })}\n\n`);
      clients.add(res); req.on('close', () => clients.delete(res));
      return true;
    },
    transformHTML: html => html.replace('</body>', `${clientScript}</body>`),
  });
  const heartbeat = setInterval(() => { for (const client of clients) client.write(': heartbeat\n\n'); }, 20000);
  heartbeat.unref();
  async function close() {
    if (closing) return closing;
    closing = (async () => {
      watchers.forEach(watcher => watcher.close()); clearInterval(heartbeat);
      await queue.close();
      for (const client of clients) client.end(); clients.clear();
      await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
      await compiler.dispose();
    })();
    return closing;
  }
  try {
    for (const directory of ['src', 'assets', 'layout', 'sections', 'snippets', 'templates', 'config', 'locales']) {
      const watcher = watch(directory, { recursive: true }, async (_event, filename) => {
        const file = `${directory}/${String(filename || '')}`.replaceAll('\\', '/');
        if (/\.(tmp|swp|log)$|~$/.test(file)) return;
        if (directory === 'assets' && isGeneratedScript(file)) {
          if (queue.building) return;
          try {
            const content = digest(await readFile(file));
            if (generated.get(file) === content) return;
            generated.set(file, content);
          } catch (error) {
            if (error.code === 'ENOENT' && generated.get(file) === null) return;
            if (error.code === 'ENOENT') generated.set(file, null);
          }
        }
        queue.add(file);
      });
      watcher.on('error', error => { console.error(`[dev] Watch failed for ${directory}:`, error.message); void close(); });
      watchers.push(watcher);
    }
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  } catch (error) { await close(); throw error; }
  return { server, close, url: `http://localhost:${server.address().port}` };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/dev.mjs')) {
  try {
    const development = await startDevelopment();
    console.log(`STRYDE development: ${development.url}\nWatching Liquid, styles, source JavaScript, assets, templates, settings and translations.\nLocal fixtures only; Shopify authentication is not required. Commerce remains disabled.`);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await development.close(); process.exit(0); });
  } catch (error) {
    console.error(`[dev] ${error.code === 'EADDRINUSE' ? 'Port is already in use. Stop the existing server or set PORT to another local port.' : error.message}`);
    process.exitCode = 1;
  }
}
