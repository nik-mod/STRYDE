import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Liquid } from 'liquidjs';
import { mountClosingCampaign } from '../src/motion/closing.mjs';

async function footer(page, { links = [], policies = [], payments = [] } = {}) {
  const engine = new Liquid({ root: 'snippets', extname: '.liquid' });
  engine.registerFilter('t', key => key);
  engine.registerFilter('payment_type_svg_tag', type => `<svg data-payment="${type}"></svg>`);
  const source = (await readFile('sections/footer.liquid', 'utf8')).replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/, '');
  return engine.parseAndRender(source, {
    request: { page_type: page }, settings: { brand_name: 'STRYDE' },
    shop: { name: 'STRYDE', policies, enabled_payment_types: payments },
    section: { settings: { menu: { links } } },
    routes: { root_url: '/', all_products_collection_url: '/collections/all', search_url: '/search' },
  });
}

test('the signature footer preserves configured support, policy, social and payment entries on both layouts', async () => {
  const configured = {
    links: [{ title: 'Contact & support', url: '/pages/contact' }, { title: 'Shipping and returns', url: '/pages/delivery' }, { title: 'Configured social', url: 'https://example.com/brand' }],
    policies: [{ title: 'Privacy policy', url: '/policies/privacy-policy' }, { title: 'Terms', url: '/policies/terms-of-service' }],
    payments: ['visa'],
  };
  for (const page of ['index', 'product']) {
    const html = await footer(page, configured);
    for (const item of [...configured.links, ...configured.policies]) assert(html.includes(`href="${item.url}"`));
    assert.match(html, /Contact &amp; support/);
    assert.match(html, /data-payment="visa"/);
    assert.match(html, /href="#MainContent"/);
    assert.equal(html.includes('data-signature-footer'), page === 'index');
    assert.equal(html.includes('data-footer-word'), page === 'index');
  }
});

test('an unconfigured footer exposes real browse routes without inventing support or policy destinations', async () => {
  const html = await footer('index');
  for (const url of ['/collections/all', '/search', '/#chapter-deconstruction', '/#chapter-brand']) assert(html.includes(`href="${url}"`));
  assert.doesNotMatch(html, /\/policies\/|\/pages\/contact|instagram|newsletter|data-payment=/);
});

test('footer section replacement reconnects only its own reveal and disposal removes the shared lifecycle listeners', () => {
  const document = new EventTarget();
  document.defaultView = { innerWidth: 1440, innerHeight: 900 };
  let currentFooter = { querySelector: () => ({}) }, timelines = 0, contexts = 0, reversions = 0;
  document.querySelector = () => currentFooter;
  const root = { ownerDocument: document, querySelector: () => ({}), querySelectorAll: () => [{}, {}, {}] };
  const gsap = {
    timeline() { timelines++; return { fromTo() { return this; }, to() { return this; } }; },
    context(callback) { contexts++; callback(); return { revert() { reversions++; } }; },
  };
  const dispose = mountClosingCampaign(root, gsap, { mobile: false });
  assert.equal(timelines, 2, 'one product sequence and one reveal for the real footer');
  document.dispatchEvent(new Event('shopify:section:load'));
  assert.equal(contexts, 1, 'an unrelated section event creates no competing footer controller');
  const unload = new Event('shopify:section:unload');
  Object.defineProperty(unload, 'target', { value: { contains: element => element === currentFooter } });
  document.dispatchEvent(unload);
  assert.equal(reversions, 1);
  currentFooter = { querySelector: () => ({}) };
  document.dispatchEvent(new Event('shopify:section:load'));
  assert.equal(contexts, 2);
  assert.equal(timelines, 3, 'reloading the footer does not duplicate the pinned product sequence');
  dispose();
  assert.equal(reversions, 2);
  document.dispatchEvent(new Event('shopify:section:load'));
  assert.equal(contexts, 2);
});
