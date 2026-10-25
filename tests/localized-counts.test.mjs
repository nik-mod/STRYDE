import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Liquid } from 'liquidjs';
import { renderPreview } from '../tools/preview.mjs';

test('preview uses localized singular and zero-count phrases without leaking interpolation markup', async () => {
  const listing = await renderPreview('/collections/all', new URLSearchParams('fixtures=1&image=1'));
  assert.match(listing, /class="collection-count micro">1 product<\/div>/);
  const empty = await renderPreview('/collections/other', new URLSearchParams('concepts=0'));
  assert.match(empty, /class="collection-count micro">0 products<\/div>/);
  for (const fixtures of [false, true]) {
    const query = new URLSearchParams({ q: '<script>shoe</script>' });
    if (fixtures) query.set('fixtures', '1');
    const html = await renderPreview('/search', query);
    const count = html.match(/class="micro search-count">([\s\S]*?)<\/p>/)?.[1];
    assert(count);
    assert.match(count, fixtures ? /1 result for/ : /0 results for/);
    assert.match(count, /&lt;script&gt;shoe&lt;\/script&gt;/);
    assert.doesNotMatch(count, /<script>|\{\{|\[object Object\]|search.results_count/);
  }
});

test('native collection and search count translations receive zero, singular and plural counts', async () => {
  const locale = JSON.parse(await readFile('locales/en.default.json', 'utf8'));
  const engine = new Liquid({ root: 'snippets', extname: '.liquid' });
  const calls = [];
  engine.registerFilter('t', (key, ...args) => {
    const options = Object.fromEntries(args.filter(arg => Array.isArray(arg) && arg.length === 2));
    let value = key.split('.').reduce((result, part) => result?.[part], locale) ?? key;
    if (typeof value === 'object') {
      calls.push([key, Number(options.count)]);
      value = value[Number(options.count) === 1 ? 'one' : 'other'];
    }
    return String(value).replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => options[name] ?? match);
  });
  engine.registerFilter('money_with_currency', cents => `$${cents / 100} USD`);
  const product = { title: 'Merchant shoe', url: '/products/merchant', price: 24900, available: true };
  for (const filename of ['main-collection', 'chapter-collection', 'main-search']) {
    const source = (await readFile(`sections/${filename}.liquid`, 'utf8'))
      .replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/g, '')
      .replace(/{%\s*paginate[^%]*%}|{%\s*endpaginate\s*%}/g, '');
    for (const count of [0, 1, 2]) {
      const collection = { title: 'Merchant selection', url: '/collections/all', products: Array.from({ length: count }, () => product), products_count: count, filters: [], sort_options: [] };
      const html = await engine.parseAndRender(source, {
        section: { id: 'qa', settings: { collection, heading: 'Merchant selection' } }, collection,
        search: { performed: true, results_count: count, results: [], terms: 'Merchant shoe' },
        routes: { all_products_collection_url: '/collections/all' }, cart: { currency: { iso_code: 'USD' } }, paginate: { pages: 1 },
      });
      if (filename === 'chapter-collection' && count === 0) continue;
      const text = filename === 'main-search'
        ? html.match(/class="micro search-count">([\s\S]*?)<\/p>/)?.[1]
        : html.match(/class="(?:collection-count micro|coll-count)">([\s\S]*?)<\/(?:div|p)>/)?.[1];
      assert(text, `${filename}: missing count`);
      const noun = filename === 'main-search' ? 'result' : 'product';
      assert.match(text, new RegExp(`^${count} ${noun}${count === 1 ? '' : 's'}(?:$| for)`));
      assert(calls.some(([key, value]) => key === (filename === 'main-search' ? 'search.results_count' : 'collection.product_count') && value === count));
    }
  }
});
