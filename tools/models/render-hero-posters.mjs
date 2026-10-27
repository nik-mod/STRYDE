import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { build } from 'esbuild';
import { renderPreview } from '../preview.mjs';
const bundle = await build({ entryPoints: ['tools/models/render-hero-posters-client.mjs'], bundle: true, format: 'esm', write: false, minify: true });
const server = http.createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'POST' && /^\/capture\/hero-(world|product)-(desktop|mobile)\.webp$/.test(path)) {
      const chunks = []; for await (const part of request) chunks.push(part);
      await writeFile(`assets/${path.split('/').at(-1)}`, Buffer.concat(chunks)); response.end('saved'); return;
    }
    if (path === '/render.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle.outputFiles[0].contents); return; }
    if (path.startsWith('/assets/')) {
      const file = resolve(`.${path}`);
      if (!file.startsWith(resolve('assets') + '\\')) throw new Error('Invalid asset path');
      response.setHeader('Content-Type', ({ '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' })[extname(file)] || 'application/octet-stream');
      response.end(await readFile(file)); return;
    }
    const html = (await renderPreview('/')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
    response.setHeader('Content-Type', 'text/html'); response.end(html.replace('</body>', '<script type="module" src="/render.js"></script></body>'));
  } catch (error) { response.writeHead(500); response.end(error.message); }
});
server.listen(9298, '127.0.0.1', () => console.log('Hero poster export: http://127.0.0.1:9298'));
