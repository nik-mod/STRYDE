/** Repair destructive cutouts by restoring the corresponding untouched photographs. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = async file => JSON.parse(await readFile(file, 'utf8'));
const archive = await read('tools/fixtures/photo-shop.json');
const inventory = await read('reference/photo-audit/inventory.json');
const review = await read('tools/fixtures/reviewed-original-restorations.json');
const rows = new Map();
for (const index of review.photoIndices) {
  const photo = inventory[index];
  if (!photo || photo.kind !== 'archive') throw Error(`Invalid original photo ${index}`);
  const original = archive.find(item => item.id === photo.productId);
  if (!rows.has(original.id)) rows.set(original.id, {
    replacesProductId: original.id, photoSourceName: 'Original photography', matchNotes: review.notes,
    photographyStatus: 'original-restored', photos: original.photos.map(photo => ({ ...photo })),
  });
  const src = photo.src.replace('-white.webp', '.webp');
  if (src === photo.src || !/^\/assets\/shop-products\/pair-\d{4}-\d{2}\.webp$/.test(src)) throw Error('Invalid original asset');
  const bytes = await readFile(`.${src}`);
  rows.get(original.id).photos[photo.view - 1] = {
    ...original.photos[photo.view - 1], src, sha256: createHash('sha256').update(bytes).digest('hex'), imageTreatment: 'original-restored',
    ...(original.id === 'pair-0046' ? { bounds: photo.view === 1 ? [0, .205, 1, .665] : [0, .22, .96, .62], studioGround: 'warm' } : {}),
  };
}
await writeFile('tools/fixtures/photo-restorations.json', JSON.stringify([...rows.values()], null, 2) + '\n');
console.log(`Restored ${review.photoIndices.length} original photographs in ${rows.size} existing entries. Supplier replacements take precedence.`);
