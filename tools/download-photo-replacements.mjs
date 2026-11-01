/** Download reviewed original product photographs without modifying image bytes. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const file = 'tools/fixtures/photo-replacements.json';
const replacements = JSON.parse(await readFile(file, 'utf8'));
const products = JSON.parse(await readFile('tools/fixtures/photo-shop.json', 'utf8'));
const allowed = new Set(['images.stockx.com', 'static2.goldengoose.com']);
await mkdir('assets/replacement-photos', { recursive: true });
const downloaded = new Map();
for (const item of replacements) {
  if (!products.some(product => product.id === item.replacesProductId)) throw new Error(`Unknown product: ${item.replacesProductId}`);
  const views = item.photos?.length ? item.photos.map(photo => ({ ...photo, url: photo.sourceImageUrl })) : [{ url: item.sourceImageUrl }];
  const photos = [];
  for (const [index, view] of views.entries()) {
    if (!allowed.has(new URL(view.url).hostname)) throw new Error('Unreviewed image supplier');
    let bytes = downloaded.get(view.url);
    if (!bytes) {
      const response = await fetch(view.url);
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Download failed: ${response.status} ${view.url}`);
      bytes = Buffer.from(await response.arrayBuffer());
      downloaded.set(view.url, bytes);
    }
    if (bytes.length < 5000 || bytes[0] !== 255 || bytes[1] !== 216) throw new Error('Invalid JPEG response');
    const src = view.src || `/assets/replacement-photos/${item.replacesProductId}-${String(index + 1).padStart(2, '0')}.jpg`;
    if (!/^\/assets\/replacement-photos\/[a-z0-9-]+\.jpg$/.test(src)) throw new Error('Invalid replacement asset path');
    await writeFile(`.${src}`, bytes);
    photos.push({ src, source: item.sourceUrl, sourceImageUrl: view.url, sha256: createHash('sha256').update(bytes).digest('hex'), ...(view.bounds ? { bounds: view.bounds } : {}), ...(view.studioGround ? { studioGround: view.studioGround } : {}) });
  }
  item.photos = photos;
  console.log(`${item.replacesProductId}: saved ${photos.length} matching product photos from ${item.photoSourceName}`);
}
await writeFile(file, JSON.stringify(replacements, null, 2) + '\n');
