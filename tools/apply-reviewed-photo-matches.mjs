/** Apply visually reviewed supplier matches to existing IDs; never add products. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const archive = await read('tools/fixtures/photo-shop.json');
const groups = await read('tools/fixtures/reviewed-stockx-matches.json');
const file = 'tools/fixtures/photo-replacements.json';
const replacements = await read(file);
const byId = new Map(replacements.map(item => [item.replacesProductId, item]));
const seen = new Set();
await mkdir('assets/replacement-photos', { recursive: true });
for (const group of groups) {
  if (!/^[a-z0-9-]+$/.test(group.key) || new URL(group.sourceImageUrl).hostname !== 'images.stockx.com') throw Error('Invalid reviewed source');
  for (const id of group.productIds) {
    if (seen.has(id) || !archive.some(item => item.id === id)) throw Error(`Invalid or repeated product ${id}`);
    seen.add(id);
  }
  const response = await fetch(group.sourceImageUrl);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw Error(`Supplier download failed: ${group.key}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 5000 || bytes[0] !== 255 || bytes[1] !== 216) throw Error('Invalid supplier JPEG');
  const src = `/assets/replacement-photos/${group.key}.jpg`;
  await writeFile(`.${src}`, bytes);
  const photo = { src, source: group.sourceUrl, sourceImageUrl: group.sourceImageUrl, sha256: createHash('sha256').update(bytes).digest('hex') };
  for (const id of group.productIds) byId.set(id, {
    replacesProductId: id, sourceUrl: group.sourceUrl, sourceImageUrl: group.sourceImageUrl,
    photoSourceName: 'StockX', matchNotes: group.matchNotes, photos: [photo],
  });
  console.log(`${group.key}: ${group.productIds.length} existing products`);
}
await writeFile(file, JSON.stringify([...byId.values()], null, 2) + '\n');
console.log(`${seen.size} reviewed matches applied; ${byId.size} total photo replacements. No catalog entries changed.`);
