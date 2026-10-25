// Local, reproducible transparent fallback renders of the supplied GLB.
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['tools/models/render-monochrome-client.mjs'], bundle: true, write: false, format: 'esm', minify: true });
const [modelPath = 'assets/nike-tn-monochrome.glb', prefix = 'tn-mono'] = process.argv.slice(2);
if (!/^tn-[a-z-]+$/.test(prefix)) throw new Error('Use a safe TN asset prefix');
const model = await readFile(modelPath);
const sha256 = createHash('sha256').update(model).digest('hex');
const names = new Set(['angle', 'profile', 'heel', 'top', 'sole', 'detail'].flatMap(view => [700, 1000, 1400, 2800].map(size => `${prefix}-${view}-${size}.webp`)));
http.createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    if (request.method === 'POST' && path.startsWith('/capture/')) {
      const name = path.slice(9);
      if (!names.has(name)) { response.writeHead(400); return response.end('Unknown render'); }
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (size > 6000000) throw new Error('Render too large'); chunks.push(chunk); }
      await writeFile(`assets/${name}`, Buffer.concat(chunks));
      await writeFile(`assets/${name}.json`, JSON.stringify({ model: modelPath, sha256, method: 'Three.js render of supplied model geometry and embedded textures', generated: false, width: Number(name.match(/-(\d+)\.webp$/)[1]), transparent: true }, null, 2));
      console.log(`Saved ${name}`); return response.end('saved');
    }
    if (path === '/model.glb') { response.setHeader('Content-Type', 'model/gltf-binary'); return response.end(model); }
    if (path === '/render.js') { response.setHeader('Content-Type', 'text/javascript'); return response.end(bundle.outputFiles[0].contents); }
    response.setHeader('Content-Type', 'text/html');
    response.end(`<!doctype html><title>STRYDE model rendering</title><style>body{margin:0;background:#b9dced;font:16px system-ui}canvas{width:90vw!important;height:auto!important}p{padding:20px}</style><body data-prefix="${prefix}"><p>Rendering the supplied sneaker…</p><script type="module" src="/render.js"></script>`);
  } catch (error) { response.writeHead(500); response.end(error.message); }
}).listen(9296, '127.0.0.1', () => console.log('Render studio: http://127.0.0.1:9296'));
