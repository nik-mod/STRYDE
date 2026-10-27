// Open the printed local URL once in a WebGL browser. The exact existing
// Three.js RoomEnvironment is baked; no product asset is altered or generated.
import http from 'node:http';
import { writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { DataUtils } from 'three';
const bundle = await build({ entryPoints: ['tools/models/bake-studio-environment-client.mjs'], bundle: true, write: false, format: 'esm', minify: true });
const encodeChannel = bytes => {
  const output = [];
  for (let i = 0; i < bytes.length;) {
    let repeat = 1;
    while (repeat < 127 && i + repeat < bytes.length && bytes[i + repeat] === bytes[i]) repeat++;
    if (repeat >= 4) { output.push(128 + repeat, bytes[i]); i += repeat; continue; }
    const start = i; i += repeat;
    while (i < bytes.length && i - start < 124) {
      if (i + 3 < bytes.length && bytes[i] === bytes[i + 1] && bytes[i] === bytes[i + 2] && bytes[i] === bytes[i + 3]) break;
      i++;
    }
    output.push(i - start, ...bytes.subarray(start, i));
  }
  return Buffer.from(output);
};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/capture') {
    const width = Number(url.searchParams.get('width')), height = Number(url.searchParams.get('height'));
    if (width !== 384 || height !== 512) { res.writeHead(400); return res.end('Unexpected atlas dimensions'); }
    const chunks = []; for await (const part of req) chunks.push(part);
    const raw = Buffer.concat(chunks);
    if (raw.length !== width * height * 8) throw new Error('Invalid half-float atlas');
    const rows = [Buffer.from(`#?RADIANCE\n# Three.js RoomEnvironment, sigma .04, PMREM size 128\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`)];
    for (let y = 0; y < height; y++) {
      rows.push(Buffer.from([2, 2, width >> 8, width & 255]));
      const channels = Array.from({ length: 4 }, () => new Uint8Array(width));
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 8;
        const c = [0, 2, 4].map(offset => DataUtils.fromHalfFloat(raw.readUInt16LE(i + offset)));
        const maximum = Math.max(...c);
        if (maximum < 1e-32) continue;
        const exponent = Math.floor(Math.log2(maximum)) + 1, scale = 256 / 2 ** exponent;
        c.forEach((v, channel) => { channels[channel][x] = Math.min(255, Math.round(v * scale)); });
        channels[3][x] = exponent + 128;
      }
      channels.forEach(channel => rows.push(encodeChannel(channel)));
    }
    const hdr = Buffer.concat(rows);
    await writeFile('assets/studio-environment.hdr', hdr);
    console.log(`Baked ${width}×${height} CubeUV HDR atlas: ${hdr.length} bytes`);
    res.end('saved'); server.close(); return;
  }
  res.setHeader('Content-Type', url.pathname === '/render.js' ? 'text/javascript' : 'text/html');
  res.end(url.pathname === '/render.js' ? bundle.outputFiles[0].contents : '<!doctype html><title>STRYDE studio bake</title><body>Rendering…<script type="module" src="/render.js"></script>');
});
server.listen(9297, '127.0.0.1', () => console.log('Bake studio: http://127.0.0.1:9297'));
