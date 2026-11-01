import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { mergeCatalogPhotography } from '../tools/fixtures/catalog-photography.mjs';
import { prepareCatalog, catalogPage } from '../src/collection-studio.mjs';
import { reviewedPhotoBounds, fitPhotoContent } from '../src/product-gallery.mjs';
import { renderPreview } from '../tools/preview.mjs';

const archive = JSON.parse(await readFile('tools/fixtures/photo-shop.json', 'utf8'));
const references = JSON.parse(await readFile('tools/fixtures/stockx-edit.json', 'utf8'));
const replacements = JSON.parse(await readFile('tools/fixtures/photo-replacements.json', 'utf8'));

test('matched photo replacements preserve every original product and all non-photo fields', () => {
  const before = mergeCatalogPhotography(archive, references);
  const after = mergeCatalogPhotography(before, replacements);
  assert.equal(after.length, 908);
  assert.deepEqual(after.map(item => item.id), before.map(item => item.id));
  for (const original of before) {
    const updated = after.find(item => item.id === original.id);
    for (const field of ['id', 'url', 'title', 'brand', 'colorway', 'description', 'identityStatus', 'sku']) assert.equal(updated[field], original[field]);
    if (!replacements.some(item => item.replacesProductId === original.id)) assert.deepEqual(updated, original);
  }
  const page = catalogPage(prepareCatalog(after), new URLSearchParams('page=76'));
  assert.equal(page.total, 908); assert.equal(page.items.length, 8);
  assert(page.items.find(item => item.id === 'pair-0885').cover.startsWith('/assets/replacement-photos/'));
  assert(page.items.find(item => item.id === 'pair-0887').cover.startsWith('/assets/replacement-photos/'));
});

test('downloaded original photographs have verified supplier URLs and unchanged bytes', async () => {
  for (const replacement of replacements) {
    assert(archive.some(item => item.id === replacement.replacesProductId));
    assert(replacement.matchNotes && replacement.photoSourceName);
    assert(replacement.photos.length);
    for (const photo of replacement.photos) {
      assert(['images.stockx.com', 'static2.goldengoose.com'].includes(new URL(photo.sourceImageUrl).hostname));
      const bytes = await readFile(`.${photo.src}`);
      assert(bytes.length > 5000);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), photo.sha256);
    }
    const html = await renderPreview(`/products/${replacement.replacesProductId}`);
    assert(html.includes(replacement.photos[0].src));
    assert(html.includes(replacement.photoSourceName));
    assert(!html.includes(`/assets/shop-products/${replacement.replacesProductId}-`));
  }
});

test('reviewed studio framing retains the entire shoe at desktop and mobile sizes', () => {
  for (const photo of replacements.flatMap(item => item.photos).filter(photo => photo.bounds)) {
    const bounds = reviewedPhotoBounds(photo.bounds.join(','), 1200, 1600);
    assert(bounds);
    for (const [width, height] of [[427, 395], [164, 182]]) {
      const fit = fitPhotoContent(bounds, 1200, 1600, width, height, .8);
      assert(fit.left + bounds.left * fit.width / 1200 >= 0);
      assert(fit.top + bounds.top * fit.height / 1600 >= 0);
      assert(fit.left + (bounds.left + bounds.width) * fit.width / 1200 <= width);
      assert(fit.top + (bounds.top + bounds.height) * fit.height / 1600 <= height);
    }
  }
  for (const invalid of ['', '0,0,1,2', '-1,0,1,1', '0,0,NaN,1', '0,0,0,0']) assert.equal(reviewedPhotoBounds(invalid, 100, 100), null);
});
