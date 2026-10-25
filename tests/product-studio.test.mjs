import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryIndex, photoContentBounds, fitPhotoContent } from '../src/product-gallery.mjs';
import { renderPreview } from '../tools/preview.mjs';

test('gallery wraps next and previous controls without invalid indices', () => {
  assert.equal(galleryIndex(-1, 14), 13);
  assert.equal(galleryIndex(14, 14), 0);
  assert.equal(galleryIndex(29, 14), 1);
  assert.equal(galleryIndex(0, 0), 0);
});

test('photo preview stages real images as one focusable gallery without invented commerce', async () => {
  const html = await renderPreview('/products/pair-0001');
  assert.match(html, /data-product-section/);
  assert.match(html, /data-product-gallery/);
  assert.equal((html.match(/data-product-thumbnail/g) || []).length, 14);
  assert.match(html, /Golden Goose Ball Star Sneakers<\/h1>/);
  assert.match(html, /Mixed colorways/);
  assert.match(html, /data-gallery-dialog/);
  assert.match(html, /not available to purchase/);
  assert.doesNotMatch(html, /Grouped by|Takeout source set|BEFORE THIS GOES LIVE/);
  assert.doesNotMatch(html, /name="add"|data-add-to-cart/);
});

test('native studio retains product forms and sold-out variant selection', async () => {
  const html = await renderPreview('/products/preview-product', new URLSearchParams('fixtures=1&image=1&variant=103'));
  assert.match(html, /data-product-gallery/);
  assert.match(html, /name="id"/);
  assert.match(html, /name="quantity"/);
  assert.match(html, /data-variant-options/);
  assert.match(html, /data-variant-select/);
  assert.match(html, /data-product-availability/);
  assert.match(html, /data-add-to-cart/);
  assert.match(html, /data-preview-commerce/);
});

test('white-ground framing fits a padded photograph while preserving its full content', () => {
  const width = 100, height = 100, pixels = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 40; y < 60; y++) for (let x = 20; x < 80; x++) { const offset = (y * width + x) * 4; pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 30; }
  const bounds = photoContentBounds(pixels, width, height);
  assert(bounds.left < 20 && bounds.top < 40, 'padding protects the white edges around the shoe');
  assert(bounds.width > 60 && bounds.width < 70);
  const fit = fitPhotoContent(bounds, width, height, 800, 500);
  assert(fit.left + bounds.left * fit.width / width >= 0);
  assert(fit.top + bounds.top * fit.height / height >= 0);
  assert(fit.left + (bounds.left + bounds.width) * fit.width / width <= 800);
  assert(fit.top + (bounds.top + bounds.height) * fit.height / height <= 500);
  pixels[0] = 0;
  assert.deepEqual(photoContentBounds(pixels, width, height), {left: 0, top: 0, width, height}, 'non-white photographic backgrounds are never trimmed');
});
