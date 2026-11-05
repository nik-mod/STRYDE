// Measure existing local files only. Photo bytes, provenance and approval stay intact.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { photoContentBounds } from '../design/motion/product-gallery.mjs';
import { hasSharpSneakerPhoto } from '../storefront/src/lib/sneaker-selection.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(resolve(root, 'backend/package.json'))('sharp');
const file = resolve(root, 'storefront/src/data/stockx-editorial.json');
const rows = JSON.parse(await readFile(file, 'utf8'));
let measured = 0;
for (const row of rows.filter(hasSharpSneakerPhoto)) for (const photo of row.photos) {
  if (!/^\/assets\/(stockx-edit|stockx-archive|replacement-photos)\/[a-zA-Z0-9-]+\.(webp|jpg|png)$/.test(photo.src)) continue;
  if (photo.bounds && photo.width && photo.height) continue;
  const source = resolve(root, 'design', photo.src.slice(1));
  const metadata = await sharp(source).metadata();
  const { data, info } = await sharp(source).resize({ width: 384, height: 384, fit: 'inside', withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = photoContentBounds(data, info.width, info.height);
  photo.bounds = [b.left / info.width, b.top / info.height, b.width / info.width, b.height / info.height];
  photo.width = metadata.width; photo.height = metadata.height;
  measured++;
}
await writeFile(file, JSON.stringify(rows, null, 2) + '\n');
console.log(JSON.stringify({ measured, products: rows.filter(hasSharpSneakerPhoto).length }));
