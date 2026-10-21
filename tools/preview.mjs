import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { Liquid } from 'liquidjs';

const root = process.cwd();
const engine = new Liquid({ root: [resolve('snippets')], extname: '.liquid', strictFilters: false });
let locale = JSON.parse(await readFile('locales/en.default.json', 'utf8'));
engine.registerFilter('t', key => key.split('.').reduce((value, part) => value?.[part], locale) || key);
engine.registerFilter('asset_url', name => `/assets/${name}`);
engine.registerFilter('stylesheet_tag', url => `<link rel="stylesheet" href="${url}">`);
engine.registerFilter('json', value => JSON.stringify(value ?? null));
engine.registerFilter('money', value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0) / 100));
engine.registerFilter('money_with_currency', value => `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0) / 100)} USD`);
engine.registerFilter('handle', value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
engine.registerFilter('structured_data', () => '{}');
engine.registerFilter('default_errors', () => '');
engine.registerFilter('image_url', value => value?.url || '');
engine.registerFilter('image_tag', (value, ...args) => {
  const attributes = Object.fromEntries(args.filter(arg => Array.isArray(arg) && arg.length === 2));
  const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  return `<img src="${escape(value)}" ${Object.entries(attributes).filter(([key]) => ['class', 'width', 'height', 'alt', 'loading', 'fetchpriority'].includes(key)).map(([key, value]) => `${key}="${escape(value)}"`).join(' ')}>`;
});
function prepare(source) {
  return source.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/g, '')
    .replace(/{%\s*form\s+'product'[^%]*%}/g, '<form method="post" action="/cart/add" class="product-form">')
    .replace(/{%\s*endform\s*%}/g, '</form>')
    .replace(/{%\s*paginate[^%]*%}|{%\s*endpaginate\s*%}/g, '');
}
export async function renderPreview(pathname, query = new URLSearchParams()) {
  locale = JSON.parse(await readFile('locales/en.default.json', 'utf8'));
  const settings = JSON.parse(await readFile('config/settings_data.json', 'utf8')).current;
  const fixture = {
    id: 1, title: 'Preview fixture / Footwear', handle: 'preview-product', url: '/products/preview-product', vendor: 'Preview data', available: true, price: 18000, price_varies: true,
    description: '<p>This is local fixture data for checking the product form. Connect a Shopify store for real merchandise and transactions.</p>', images: [], has_only_default_variant: false,
    variants: [
      { id: 101, title: 'Chalk / 40', available: true, price: 18000, compare_at_price: 0 },
      { id: 102, title: 'Graphite / 41', available: true, price: 19500, compare_at_price: 22000 },
      { id: 103, title: 'Graphite / 42', available: false, price: 19500, compare_at_price: 0 }
    ]
  };
  fixture.selected_or_first_available_variant = fixture.variants.find(variant => String(variant.id) === query.get('variant')) || fixture.variants[0];
  if (query.get('image') === '1') fixture.featured_image = { url: '/preview-fixture.svg', alt: 'Local test image — fixture data only' };
  const populated = query.get('fixtures') === '1';
  const template = pathname === '/' ? 'index' : pathname.startsWith('/products/') ? 'product' : pathname.startsWith('/collections/') ? 'collection' : pathname === '/cart' ? 'cart' : pathname === '/search' ? 'search' : pathname.startsWith('/pages/') ? 'page' : '404';
  const context = {
    settings, shop: { name: settings.brand_name, policies: [], customer_accounts_enabled: true }, request: { locale: { iso_code: 'en' }, page_type: template }, page_title: template === 'index' ? settings.brand_name : template, current_page: 1, canonical_url: `http://localhost:${process.env.PORT || 9292}${pathname}`,
    routes: { root_url: '/', all_products_collection_url: '/collections/all', search_url: '/search', cart_url: '/cart', account_url: '/account' },
    cart: { item_count: populated && template === 'cart' ? 1 : 0, items: populated && template === 'cart' ? [{ product: fixture, variant: fixture.variants[0], quantity: 1, index: 0, final_price: 18000, final_line_price: 18000, url: fixture.url, url_to_remove: '/cart', properties: [] }] : [], total_price: 18000, currency: { iso_code: 'USD' } },
    product: fixture, collection: { title: 'The collection', url: '/collections/all', products: populated ? [fixture] : [], products_count: populated ? 1 : 0, filters: [], sort_options: [{ name: 'Featured', value: 'manual' }, { name: 'Price, low to high', value: 'price-ascending' }], default_sort_by: 'manual' },
    search: { performed: Boolean(query.get('q')), terms: query.get('q') || '', results: populated ? [{ ...fixture, object_type: 'product' }] : [], results_count: populated ? 1 : 0 }, page: { title: 'Preview page', content: '<p>Merchant content will appear here.</p>' }, paginate: { pages: 1, current_page: 1, parts: [] }, form: {}
  };
  async function section(type, id, supplied = {}) {
    const source = await readFile(`sections/${type}.liquid`, 'utf8');
    const schema = JSON.parse(source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)?.[1] || '{}');
    const defaults = Object.fromEntries((schema.settings || []).filter(setting => setting.default !== undefined).map(setting => [setting.id, setting.default]));
    const sectionSettings = { ...defaults, ...supplied };
    if (type === 'cinematic-foundation') {
      if (populated) { sectionSettings.featured_product = fixture; sectionSettings.collection = context.collection; }
      if (query.get('model')) sectionSettings.model_url = query.get('model');
    }
    return engine.parseAndRender(prepare(source), { ...context, section: { id, settings: sectionSettings } });
  }
  const templateConfig = JSON.parse(await readFile(`templates/${template}.json`, 'utf8'));
  let content = '';
  for (const id of templateConfig.order) { const definition = templateConfig.sections[id]; content += await section(definition.type, id, definition.settings); }
  const layout = prepare(await readFile('layout/theme.liquid', 'utf8')).replace(/{%\s*sections 'header-group'\s*%}/, '{{ preview_header }}').replace(/{%\s*sections 'footer-group'\s*%}/, '{{ preview_footer }}');
  let result = await engine.parseAndRender(layout, { ...context, content_for_layout: content, content_for_header: '', preview_header: await section('header', 'header'), preview_footer: await section('footer', 'footer') });
  result = result.replace(/<form([^>]*method="post"[^>]*)>/g, '<form$1 data-preview-commerce>');
  result = result.replace(/<body([^>]*)>/, '<body$1 data-local-preview><aside class="preview-notice" role="note">LOCAL PREVIEW · FIXTURE DATA · COMMERCE DISABLED</aside>');
  result = result.replace('</body>', '<script>document.addEventListener("submit",e=>{if(e.target.method.toLowerCase()==="post"){e.preventDefault();alert("Local preview: connect a Shopify store to use commerce.")}});document.querySelectorAll("[name=checkout],[name=add]").forEach(b=>{b.disabled=true;b.setAttribute("title","Commerce disabled in local preview")});</script></body>');
  return result;
}
export function createPreviewServer({ handleRequest, transformHTML = html => html } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (handleRequest?.(req, res, url)) return;
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end('Local preview: commerce disabled.'); }
      if (url.pathname === '/account') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(transformHTML('<!doctype html><html lang="en"><title>Local account preview</title><body><h1>Account preview</h1><p>No store is connected. Customer sign-in uses Shopify on a real storefront.</p><a href="/">Return to preview</a></body></html>')); }
      if (url.pathname === '/preview-fixture.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700"><rect width="900" height="700" fill="#effaff"/><text x="450" y="330" text-anchor="middle" fill="#073653" font-family="sans-serif" font-size="42">LOCAL TEST IMAGE</text><text x="450" y="390" text-anchor="middle" fill="#073653" font-family="sans-serif" font-size="24">Fixture only · No merchandise</text></svg>'); }
      if (url.pathname.startsWith('/assets/')) {
        const path = resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (!path.startsWith(resolve(root, 'assets') + sep)) { res.writeHead(403); return res.end(); }
        const type = ({ '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' })[extname(path)] || 'application/octet-stream';
        const data = await readFile(path); res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); return res.end(data);
      }
      const html = await renderPreview(url.pathname, url.searchParams);
      const known = /^\/$|^\/products\/[^/]+$|^\/collections\/[^/]+$|^\/cart$|^\/search$|^\/pages\/[^/]+$/.test(url.pathname);
      res.writeHead(known ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(transformHTML(html));
    } catch (error) { console.error(error); res.writeHead(error.code === 'ENOENT' ? 404 : 500); res.end(`Preview rendering failed: ${error.message}`); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/preview.mjs')) {
  createPreviewServer().listen(Number(process.env.PORT || 9292), '127.0.0.1', () => console.log(`Same-Liquid preview: http://127.0.0.1:${process.env.PORT || 9292} (commerce disabled)`));
}
