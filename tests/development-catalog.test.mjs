import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,stat } from 'node:fs/promises';
import { Liquid } from 'liquidjs';
import { conceptCatalog } from '../tools/fixtures/concept-catalog.mjs';
import { photographyCatalog } from '../tools/fixtures/photography-catalog.mjs';
import { renderPreview } from '../tools/preview.mjs';

function listing(html) {return html.match(/<section\b[^>]*\bcollection-page\b[\s\S]*?<\/section>/)?.[0] || '';}

test('local all-products page supplies six licensed photographic references, credited and non-commerce',async()=>{
  const html=listing(await renderPreview('/collections/all'));
  assert(html,'Collection section missing');
  assert.equal((html.match(/data-photography-reference/g)||[]).length,6);
  assert.equal(new Set(photographyCatalog.map(p=>p.name)).size,6);
  for(const photo of photographyCatalog){
    assert(html.includes(photo.name));
    assert(html.includes(photo.asset));
    assert(html.includes(photo.creator));
    assert(html.includes(photo.source));
    assert((await stat(`assets/${photo.asset}`)).size>1000);
  }
  assert.equal((html.match(/Photographic reference · Not store inventory/g)||[]).length,6);
  assert.doesNotMatch(html,/<form|href="\/products\/|\$|name="add"|name="checkout"|name="sort_by"|No products found/);
  assert.match(html,/Not store inventory or available for purchase/);
});

test('concept fallback is limited to the local all-products empty view and yields to native fixtures',async()=>{
  for(const [path,query]of[['/collections/all','concepts=0'],['/collections/other',''],['/collections/all','fixtures=1&image=1']]){
    const html=listing(await renderPreview(path,new URLSearchParams(query)));
    assert.doesNotMatch(html,/data-concept-entry|Arc Study|Tide Study/);
    if(query.includes('fixtures')){assert.match(html,/href="\/products\/preview-product"/);assert.match(html,/\$180\.00 USD/);assert.match(html,/preview-fixture.svg/);assert.match(html,/name="sort_by"/);}
    else assert.match(html,/No products found/);
  }
  assert.doesNotMatch(await renderPreview('/'),/data-concept-entry/);
});

async function nativeCollection(products,{catalog}={}){
  const engine=new Liquid({root:'snippets',extname:'.liquid'});
  engine.registerFilter('t',k=>k);engine.registerFilter('money_with_currency',v=>`$${v/100} USD`);
  engine.registerFilter('image_url',v=>v.url);engine.registerFilter('image_tag',url=>`<img src="${url}">`);
  engine.registerFilter('asset_url',v=>`/assets/${v}`);
  const source=(await readFile('sections/main-collection.liquid','utf8')).replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/,'').replace(/{%\s*paginate[^%]*%}|{%\s*endpaginate\s*%}/g,'');
  return engine.parseAndRender(source,{
    section:{id:'native',settings:{},...(catalog?{preview_catalog:catalog}:{})},
    collection:{title:'Merchant collection',url:'/collections/all',products,products_count:products.length,sort_by:'price-ascending',default_sort_by:'manual',sort_options:[{name:'Featured',value:'manual'},{name:'Price',value:'price-ascending'}],filters:[{label:'Color',type:'list',active_values:[],values:[{label:'Blue',param_name:'filter.v.option.color',value:'Blue',count:2,active:false}]}]},
    cart:{currency:{iso_code:'USD'}},paginate:{pages:2,current_page:1,parts:[{is_link:true,title:'2',url:'/collections/all?page=2'}],next:{url:'/collections/all?page=2'}},
  });
}

test('Shopify-shaped empty context cannot expose local concepts; native filters, prices, links and pagination survive',async()=>{
  const empty=await nativeCollection([]);assert.match(empty,/collection.empty/);assert.doesNotMatch(empty,/data-concept-entry|Arc Study/);
  const product={title:'Authentic merchant shoe',url:'/products/merchant-shoe',price:24900,available:false,price_varies:true,featured_image:{url:'/merchant.jpg'}};
  const html=await nativeCollection([product],{catalog:conceptCatalog});
  assert.match(html,/Authentic merchant shoe/);assert.match(html,/href="\/products\/merchant-shoe"/);assert.match(html,/\$249 USD/);assert.match(html,/products.sold_out/);assert.match(html,/products.from/);
  assert.match(html,/name="filter.v.option.color"/);assert.match(html,/value="price-ascending" selected/);assert.match(html,/href="\/collections\/all\?page=2"/);
  assert.doesNotMatch(html,/data-concept-entry|Arc Study/);
});
