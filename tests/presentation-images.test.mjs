import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { Liquid } from 'liquidjs';
import { renderPreview } from '../tools/preview.mjs';

function renderer() {
  const engine = new Liquid({root:'snippets',extname:'.liquid'});
  engine.registerFilter('t', key => key);
  engine.registerFilter('asset_url', file => `/assets/${file}`);
  engine.registerFilter('image_url', image => image.url);
  engine.registerFilter('image_tag', (url, ...options) => `<img src="${url}" ${options.map(([k,v]) => `${k}="${v}"`).join(' ')}>`);
  return engine;
}
const source = await readFile('snippets/presentation-image.liquid','utf8');
const image = {url:'/merchant-detail.jpg',alt:'Actual merchant photograph'};

test('campaign slots resolve to shipped assets and always disclose bundled concepts', async () => {
  const engine = renderer();
  for (const slot of ['collection_1','collection_2','collection_3','material_1','material_2','material_3','featured','finale']) {
    const html = await engine.parseAndRender(source,{slot});
    const asset = html.match(/src="\/assets\/([^"]+)"/)[1];
    assert((await stat(`assets/${asset}`)).size > 1000);
    assert.match(html,/assets.concept_tag/);
    assert.match(html,new RegExp(`data-concept-image="${slot}"`));
    assert.match(html,/loading="lazy"/);
  }
  const html = await renderPreview('/',new URLSearchParams('artwork=concept'));
  const collection = html.match(/<section\b[^>]*\bchapter-collection\b[\s\S]*?<\/section>/)[0];
  assert.equal(new Set([...collection.matchAll(/src="([^"]+)"/g)].map(m=>m[1])).size,3);
  assert.equal((collection.match(/Concept artwork · Temporary/g)||[]).length,3);
  assert.doesNotMatch(collection,/coll-tint/);
});

test('replacement photos suppress fallback art; concept uploads retain their disclosure', async () => {
  const engine=renderer();
  for (const slot of ['collection_2','material_2','featured','finale']) {
    const html=await engine.parseAndRender(source,{slot,image,crop_style:'--zoom: 2.7; --tx: -16%;'});
    assert.match(html,/\/merchant-detail.jpg/);
    assert.doesNotMatch(html,/stryde-concept|assets.concept_tag|--zoom: 2.7/);
    if(slot==='material_2') assert.match(html,/--zoom: 1; --tx: 0%; --ty: 0%;/);
    const concept=await engine.parseAndRender(source,{slot,image,image_is_concept:true});
    assert.match(concept,/assets.concept_tag/);
  }
});

test('standalone scene pickers never override configured product imagery or native links',async()=>{
  const engine=renderer();
  const raw=await readFile('sections/chapter-collection.liquid','utf8');
  const schema=JSON.parse(raw.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
  const defaults=Object.fromEntries(schema.settings.filter(s=>s.default!==undefined).map(s=>[s.id,s.default]));
  const markup=raw.replace(/{% schema %}[\s\S]*?{% endschema %}/,'');
  const settings={...defaults,scene_2_image:image,scene_2_image_is_concept:true};
  const render=settings=>engine.parseAndRender(markup,{section:{id:'qa',settings},routes:{all_products_collection_url:'/collections/all'}});
  const standalone=await render(settings);
  assert.match(standalone,/merchant-detail.jpg/);
  assert.equal((standalone.match(/assets.concept_tag/g)||[]).length,3);
  engine.registerFilter('money_with_currency',cents=>`$${cents/100}`);
  const product={title:'Actual shoe',url:'/products/actual',price:24000,available:true,featured_image:{url:'/actual.jpg'}};
  const native=await render({...settings,collection:{products_count:1,products:[product]}});
  assert.match(native,/actual.jpg/);assert.match(native,/href="\/products\/actual"/);
  assert.doesNotMatch(native,/merchant-detail.jpg|assets.concept_tag/);
});
