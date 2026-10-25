import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareCatalog, catalogPage, collectionHref } from '../src/collection-studio.mjs';
const data = JSON.parse(await readFile(new URL('../tools/fixtures/photo-shop.json', import.meta.url), 'utf8'));
const entries = prepareCatalog(data);

test('studio pagination keeps every supplied photo group reachable without flooding the document', () => {
  const first = catalogPage(entries);
  assert.equal(first.items.length, 12);
  assert.equal(first.total, 889);
  assert.equal(first.pages, 75);
  assert.equal(new Set(first.items.slice(0, 3).map(item => item.brand)).size, 3);
  assert(first.items.every(item => item.identified));
  const seen = new Set();
  for (let page = 1; page <= first.pages; page++) {
    for (const item of catalogPage(entries, new URLSearchParams({ page })).items) seen.add(item.id);
  }
  assert.equal(seen.size, entries.length);
  assert.equal(catalogPage(entries, new URLSearchParams('page=999')).page, 75);
  assert.equal(catalogPage(entries, new URLSearchParams('page=-7')).page, 1);
});

test('brand, color, name and edit filters combine and pagination preserves their URLs', () => {
  const state = catalogPage(entries, new URLSearchParams('brand=Golden+Goose&color=White&q=star&edit=identified&sort=views'));
  assert(state.total > 0);
  assert(state.items.every(item => item.brand === 'Golden Goose' && item.colors.includes('White') && item.query.includes('star') && item.identified));
  assert(state.items.every((item, index) => !index || item.count <= state.items[index - 1].count));
  if (state.next) {
    const url = new URL(state.next, 'http://localhost');
    assert.equal(url.searchParams.get('brand'), 'Golden Goose');
    assert.equal(url.searchParams.get('color'), 'White');
    assert.equal(url.searchParams.get('q'), 'star');
    assert.equal(url.searchParams.get('page'), '2');
  }
  assert.equal(new URL(state.clearUrl, 'http://localhost').search, '');
});

test('empty searches, unknown filter values and page requests remain safe and useful', () => {
  for (const query of ['q=no-such-footwear-123456', 'brand=No+such+brand', 'color=Invalid+Color']) {
    const state = catalogPage(entries, new URLSearchParams(query));
    assert.equal(state.total, 0);
    assert.equal(state.rangeStart, 0);
    assert.equal(state.rangeEnd, 0);
    assert.equal(state.page, 1);
    assert.equal(state.items.length, 0);
  }
  assert.equal(catalogPage(entries, new URLSearchParams('sort=unknown')).sort, 'studio');
  assert.equal(collectionHref(new URLSearchParams('q=Nike&page=2&photography=1'), { page: 1 }), '/collections/all?q=Nike&photography=1');
});
