import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Liquid } from 'liquidjs';
import { mountListing } from '../src/motion/listing.mjs';

const campaignImage = { url: '/merchant-campaign.jpg', alt: 'Approved campaign photograph' };
const productImage = { url: '/merchant-product.jpg', alt: 'Selected product photograph' };

async function renderChapter(name, supplied = {}) {
  const source = await readFile(`sections/${name === 'hero' ? 'cinematic-hero' : `chapter-${name}`}.liquid`, 'utf8');
  const schema = JSON.parse(source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)[1]);
  const defaults = Object.fromEntries(schema.settings.filter(setting => setting.default !== undefined).map(setting => [setting.id, setting.default]));
  const engine = new Liquid({ root: 'snippets', extname: '.liquid' });
  engine.registerFilter('t', key => key);
  engine.registerFilter('asset_url', filename => `/assets/${filename}`);
  engine.registerFilter('image_url', image => image.url);
  engine.registerFilter('money_with_currency', cents => `$${cents / 100} USD`);
  engine.registerFilter('default_errors', () => '');
  engine.registerFilter('image_tag', (url, ...options) => {
    const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
    return `<img src="${escape(url)}" ${options.map(([key, value]) => `${key}="${escape(value)}"`).join(' ')}>`;
  });
  const markup = source.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/, '')
    .replace(/{%\s*form\s+'product'[^%]*%}/g, '<form method="post" action="/cart/add">')
    .replace(/{%\s*endform\s*%}/g, '</form>');
  return engine.parseAndRender(markup, {
    section: { id: `qa-${name}`, settings: { ...defaults, ...supplied } },
    settings: { brand_name: 'STRYDE' }, shop: { name: 'STRYDE' },
    routes: { all_products_collection_url: '/collections/all', search_url: '/search' }, form: {},
  });
}

test('the navy feature uses its live model only for the bundled study and yields to merchant imagery', async () => {
  const bundled = await renderChapter('featured', { use_tn_model: true, use_navy_model: true });
  assert.match(bundled, /nike-tn-deep-blue\.glb/);
  assert.match(bundled, /tn-navy-angle-2800\.webp/);
  const actual = await renderChapter('featured', { use_tn_model: true, use_navy_model: true,
    product: { title: 'Actual shoe', url: '/products/actual-shoe', featured_image: productImage, selected_or_first_available_variant: { price: 12000 } } });
  assert.match(actual, /merchant-product\.jpg/);
  assert.doesNotMatch(actual, /data-journey-model|tn-navy|data-featured-model/);
});

test('Technology prioritizes editorial override, then actual product imagery, before disclosed studies', async () => {
  const settings = { use_tn_model: true, product: { featured_image: productImage }, image: campaignImage };
  const override = await renderChapter('technology', settings);
  assert.match(override, /src="\/merchant-campaign.jpg"/);
  assert.match(override, /alt="Approved campaign photograph"/);
  assert.doesNotMatch(override, /merchant-product.jpg|data-tech-model|assets.concept_tag|hero.model_preview/);

  // A stale concept checkbox must never mark an actual selected product as concept art.
  const product = await renderChapter('technology', { ...settings, image: '', image_is_concept: true });
  assert.match(product, /src="\/merchant-product.jpg"/);
  assert.match(product, /alt="Selected product photograph"/);
  assert.doesNotMatch(product, /merchant-campaign.jpg|data-tech-model|assets.concept_tag|hero.model_preview/);

  const conceptOverride = await renderChapter('technology', { ...settings, image_is_concept: true });
  assert.match(conceptOverride, /merchant-campaign.jpg/);
  assert.match(conceptOverride, /assets.concept_tag/);
  assert.doesNotMatch(conceptOverride, /hero.model_preview|data-tech-model/);
});

test('Technology without a selected product discloses model and concept fallback images', async () => {
  for (const product of [undefined, null, '']) {
    const model = await renderChapter('technology', { use_tn_model: true, image: '', product, row_1_title: 'Merchant detail' });
    assert.match(model, /src="\/assets\/tn-profile-2800.webp"/);
    assert.match(model, /hero.model_preview/);
    assert.doesNotMatch(model, /src=""|assets.concept_tag/);
    const concept = await renderChapter('technology', { use_tn_model: false, image: null, product, row_1_title: 'Merchant detail' });
    assert.match(concept, /data-concept-image="featured"/);
    assert.match(concept, /assets.concept_tag/);
    assert.doesNotMatch(concept, /src=""|data-tech-model|hero.model_preview/);
    assert.match(concept, /Merchant detail/);
  }
});

test('Technology selected merchandise with no photograph never substitutes a model or concept image', async () => {
  const product = { title: 'Actual merchant shoe', url: '/products/merchant-shoe', featured_image: null };
  for (const use_tn_model of [true, false]) {
    const html = await renderChapter('technology', { product, use_tn_model, image: '', row_1_title: 'Merchant detail' });
    assert.doesNotMatch(html, /<img\b|data-tech-model|data-concept-image|hero.model_preview|assets.concept_tag/);
    assert.match(html, /Merchant detail/);
  }
  const override = await renderChapter('technology', { product, use_tn_model: true, image: campaignImage });
  assert.match(override, /src="\/merchant-campaign.jpg"/);
});

test('Brand merchant image replaces model and concept studies with opt-in concept disclosure', async () => {
  const image = await renderChapter('brand', { use_tn_model: true, image: campaignImage });
  assert.match(image, /src="\/merchant-campaign.jpg"/);
  assert.match(image, /alt="Approved campaign photograph"/);
  assert.doesNotMatch(image, /data-brand-model|tn-detail|stryde-concept|hero.model_preview|assets.concept_tag/);
  const concept = await renderChapter('brand', { use_tn_model: true, image: campaignImage, image_is_concept: true });
  assert.match(concept, /merchant-campaign.jpg/);
  assert.match(concept, /assets.concept_tag/);
  assert.doesNotMatch(concept, /data-brand-model|hero.model_preview/);
});

test('Brand empty campaign settings retain editable story and a disclosed visual fallback', async () => {
  for (const image of [undefined, null, '']) {
    const settings = { image, line_1: 'Closer & clearer', line_2: '<em>Move</em>', line_3: 'Stay curious.', manifesto: 'A story <script>unsafe()</script> & a detail.' };
    for (const use_tn_model of [true, false]) {
      const html = await renderChapter('brand', { ...settings, use_tn_model });
      assert.match(html, /Closer &amp; clearer/);
      assert.match(html, /&lt;em&gt;Move&lt;\/em&gt;/);
      assert.match(html, /Stay curious\./);
      // The manifesto renders word by word; each fragment must still escape.
      assert.match(html, /<span class="brand-word">A<\/span> <span class="brand-word">story<\/span>/);
      assert.match(html, /<span class="brand-word">&lt;script&gt;unsafe\(\)&lt;\/script&gt;<\/span>/);
      assert.match(html, /<span class="brand-word">&amp;<\/span> <span class="brand-word">a<\/span> <span class="brand-word">detail\.<\/span>/);
      assert.doesNotMatch(html, /<script>|<em>|src=""/);
      assert.match(html, use_tn_model ? /hero.model_preview/ : /assets.concept_tag/);
      assert.match(html, use_tn_model ? /tn-detail-2800.webp/ : /data-concept-image="material_2"/);
    }
  }
});

test('Materials detail pickers replace every automatic macro crop without inheriting its disclosure', async () => {
  const settings = { use_tn_model: true };
  for (let index = 1; index <= 3; index++) {
    settings[`panel_${index}_image`] = { url: `/merchant-detail-${index}.jpg`, alt: `Actual detail ${index}` };
    settings[`panel_${index}_title`] = `Detail ${index} & form`;
    settings[`panel_${index}_body`] = `Approved <detail ${index}>`;
  }
  const html = await renderChapter('materials', settings);
  for (let index = 1; index <= 3; index++) {
    assert.match(html, new RegExp(`src="/merchant-detail-${index}.jpg"`));
    assert.match(html, new RegExp(`alt="Actual detail ${index}"`));
    assert.match(html, new RegExp(`Detail ${index} &amp; form`));
    assert.match(html, new RegExp(`Approved &lt;detail ${index}&gt;`));
  }
  assert.equal((html.match(/--zoom: 1; --tx: 0%; --ty: 0%;/g) || []).length, 3);
  assert.doesNotMatch(html, /data-macro-image|data-concept-image|hero.model_preview|assets.concept_tag|\/assets\/tn-/);
  const concept = await renderChapter('materials', { ...settings, panel_2_image_is_concept: true });
  assert.equal((concept.match(/assets.concept_tag/g) || []).length, 1);
  assert.match(concept, /merchant-detail-2.jpg/);
});

test('Materials empty detail slots disclose each model or concept image independently', async () => {
  const model = await renderChapter('materials', { use_tn_model: true, panel_1_image: '', panel_2_image: null });
  assert.equal((model.match(/data-macro-image/g) || []).length, 3);
  assert.equal((model.match(/hero.model_preview/g) || []).length, 3);
  for (const view of ['detail', 'profile', 'sole']) assert.match(model, new RegExp(`src="/assets/tn-${view}-2800.webp"`));
  assert.doesNotMatch(model, /src=""|assets.concept_tag/);
  const concept = await renderChapter('materials', { use_tn_model: false });
  assert.equal((concept.match(/assets.concept_tag/g) || []).length, 3);
  assert.doesNotMatch(concept, /data-macro-image|hero.model_preview|src=""/);
});

for (const name of ['hero', 'featured', 'finale']) {
  test(`${name} keeps merchandise and native purchase data when its photograph is missing`, async () => {
    const variant = { id: 771, price: 24900, available: true, compare_at_price: 0 };
    const product = { title: 'Actual merchant shoe', url: '/products/merchant-shoe', featured_image: null, has_only_default_variant: true, selected_or_first_available_variant: variant };
    const settings = { [name === 'hero' ? 'featured_product' : 'product']: product };
    const verifyCommerce = html => {
      assert.match(html, /action="\/cart\/add"/);
      assert.match(html, /name="id" value="771"/);
      assert.match(html, /name="add"/);
      assert.match(html, /href="\/products\/merchant-shoe"/);
      assert.match(html, /\$249 USD/);
    };
    for (const use_tn_model of [true, false]) {
      const html = await renderChapter(name, { ...settings, use_tn_model });
      verifyCommerce(html);
      assert.match(html, /hero.asset_pending/);
      assert.doesNotMatch(html, /<img\b|data-model-url=|data-finale-model|data-concept-image|assets.concept_tag|hero.model_preview/);
    }
    const override = await renderChapter(name, { ...settings, use_tn_model: true, image: campaignImage });
    verifyCommerce(override);
    assert.match(override, /src="\/merchant-campaign.jpg"/);
    assert.doesNotMatch(override, /hero.asset_pending|data-model-url=|data-finale-model|assets.concept_tag|hero.model_preview/);

    if (name === 'hero') {
      const model = await renderChapter(name, { ...settings, use_tn_model: true, model_url: '/licensed-product.glb' });
      verifyCommerce(model);
      assert.match(model, /data-model-url="\/licensed-product.glb"/);
      assert.doesNotMatch(model, /nike-tn-blue-white.glb|<img\b|assets.concept_tag|hero.model_preview/);
      const metafield = await renderChapter(name, { featured_product: { ...product, metafields: { custom: { cinematic_model: { value: { url: '/metafield-product.glb' } } } } } });
      assert.match(metafield, /data-model-url="\/metafield-product.glb"/);
      verifyCommerce(metafield);
    }
  });
}

test('blank Brand lines create no empty display rows while configured story and image survive', async () => {
  for (const blank of ['', null, '   ']) {
    for (const omitted of [1, 2, 3]) {
      const settings = { image: campaignImage, line_1: 'First & form', line_2: 'Second line', line_3: 'Third line', manifesto: 'Merchant story' };
      settings[`line_${omitted}`] = blank;
      const html = await renderChapter('brand', settings);
      assert.equal((html.match(/class="brand-line /g) || []).length, 2);
      assert.doesNotMatch(html, /class="brand-line [^"]*"><span>\s*<\/span>/);
      assert.match(html, /merchant-campaign.jpg/);
      assert.match(html, /<span class="brand-word">Merchant<\/span> <span class="brand-word">story<\/span>/);
      if (omitted !== 1) assert.match(html, /First &amp; form/);
    }
  }
});

test('Hero TN edition belongs only to its bundled model, never merchant imagery or merchandise', async () => {
  const bundled = await renderChapter('hero', { use_tn_model: true });
  assert.match(bundled, /01 \/ TN/);
  for (const override of [
    { image: campaignImage },
    { model_url: '/merchant.glb' },
    { featured_product: { title: 'Merchant shoe', selected_or_first_available_variant: { id: 771, price: 24900, available: true } } },
  ]) {
    const html = await renderChapter('hero', { use_tn_model: true, ...override });
    const edition = html.match(/<div class="hero-edition">[\s\S]*?<\/div>/)?.[0];
    assert(edition);
    assert.doesNotMatch(edition, /TN/);
    assert.match(edition, /<span>01<\/span>/);
  }
});

test('catalog mounting leaves browsing entries still and supplies safe repeatable lifecycle cleanup', () => {
  const entries = Array.from({ length: 10 }, () => ({ opacity: 1, y: 0 }));
  const heading = {};
  const root = { querySelector: () => heading, querySelectorAll: () => entries };
  const motions = [];
  const clock = {
    context(callback) { callback(); return { revert() {} }; },
    matchMedia() { return { add(query, callback) { callback(); }, revert() {} }; },
    fromTo(target) { motions.push(target); }, from(target) { motions.push(target); }, to(target) { motions.push(target); },
  };
  const dispose = mountListing(root, { gsap: clock });
  assert.equal(typeof dispose, 'function', 'the runtime always calls section cleanup on unload or reduced-motion changes');
  dispose(); dispose();
  assert(motions.every(target => target === heading), 'browsing entries must not receive replayed entrance motion');
  assert(entries.every(entry => entry.opacity === 1 && entry.y === 0));
});
