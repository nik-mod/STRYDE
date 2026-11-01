/** Save unchanged official brand photographs after manual model/color review. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = async file => JSON.parse(await readFile(file, 'utf8'));
const archive = await read('tools/fixtures/photo-shop.json');
const groups = await read('tools/fixtures/reviewed-brand-matches.json');
const file = 'tools/fixtures/photo-replacements.json';
const entries = new Map((await read(file)).map(item => [item.replacesProductId, item]));
await mkdir('assets/replacement-photos', { recursive: true });
for (const group of groups) {
  if (!/^[a-z0-9-]+$/.test(group.key) || new URL(group.sourceImageUrl).hostname !== 'static2.goldengoose.com' || new URL(group.sourceUrl).hostname !== 'www.goldengoose.com') throw Error('Unreviewed supplier');
  for (const id of group.productIds) if (!archive.some(item => item.id === id)) throw Error(`Unknown original product ${id}`);
  const response = await fetch(group.sourceImageUrl);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw Error(`Image unavailable: ${group.sku}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 5000 || bytes[0] !== 255 || bytes[1] !== 216) throw Error('Invalid supplier JPEG');
  const src = `/assets/replacement-photos/${group.key}.jpg`;
  await writeFile(`.${src}`, bytes);
  for (const id of group.productIds) entries.set(id, {
    replacesProductId: id, sourceUrl: group.sourceUrl, sourceImageUrl: group.sourceImageUrl,
    photoSourceName: 'Golden Goose', matchNotes: group.matchNotes, matchedModel: group.model, matchedStyle: group.sku,
    photos: [{ src, source: group.sourceUrl, sourceImageUrl: group.sourceImageUrl, sha256: createHash('sha256').update(bytes).digest('hex'), bounds: group.bounds, studioGround: 'warm' }],
  });
  console.log(`${group.sku}: ${group.productIds.length} existing products`);
}
await writeFile(file, JSON.stringify([...entries.values()], null, 2) + '\n');
