import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renderPreview } from '../tools/preview.mjs';

const chapter = html => html.match(/<section\b[^>]*\bchapter-collection\b[\s\S]*?<\/section>/)[0];
test('the four-look edit ships four photographs with truthful captions and no invented purchase data', async () => {
  const html = chapter(await renderPreview('/'));
  assert.match(html, /data-form-edit/);
  assert.equal((html.match(/data-form-look/g) || []).length, 4);
  for (const [name, title] of [['sky.png','Sky blue / Gum'], ['midnight.png','Midnight / Gum'], ['court.png','Navy / Ivory'], ['charcoal.webp','Charcoal / Gum']]) {
    assert.match(html, new RegExp(`form-edit-${name}`));
    assert.ok(html.includes(title));
    const file = `assets/form-edit-${name}`;
    const provenance = JSON.parse(await readFile(`${file}.json`, 'utf8'));
    assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'), provenance.sha256);
  }
  assert.match(html, /Photographic references · Not store inventory/);
  assert.doesNotMatch(html, /Nike Air Max Plus Tuned|priceCurrency|\$\d/);
  assert.equal((html.match(/data-form-progress/g) || []).length, 4, 'the restored sequence has one progress stop per photograph');
});

test('native collection products take precedence over the editorial edit', async () => {
  const html = chapter(await renderPreview('/', new URLSearchParams('fixtures=1&image=1')));
  assert.doesNotMatch(html, /data-form-edit|data-form-look|form-edit-sky/);
  assert.match(html, /preview-fixture.svg/);
  assert.match(html, /products\/preview-product/);
});
