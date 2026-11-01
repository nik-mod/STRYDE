import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {prepareCatalog,catalogPage} from '../src/collection-studio.mjs';
import {renderPreview} from '../tools/preview.mjs';
import {modelExchangePose} from '../src/journey-transition.mjs';
import {journeyPose} from '../src/journey-poses.mjs';
import {mergeCatalogPhotography} from '../tools/fixtures/catalog-photography.mjs';
const edit=JSON.parse(await readFile('tools/fixtures/stockx-edit.json','utf8'));
test('curated references have distinct identities, original local photographs and source metadata',async()=>{
 assert.equal(edit.length,20);assert.equal(new Set(edit.map(x=>x.sourceUrl)).size,edit.length);
 assert.equal(new Set(edit.map(x=>x.sku)).size,edit.length);
 for(const item of edit){
  assert(item.title&&item.brand&&item.colorway&&item.description&&item.sku);
  assert.equal(new URL(item.sourceUrl).hostname,'stockx.com');
  assert.equal(new URL(item.sourceImageUrl).hostname,'images.stockx.com');
  assert(!item.price&&!item.available&&!item.variants,'references never imply store inventory');
  const photo=item.photos[0],bytes=await readFile(`.${photo.src}`);
  assert(bytes.length>5000);assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256);
 }
});
test('one footwear gallery keeps all original products and applies only matched StockX photography',async()=>{
 const entries=prepareCatalog(edit);
 assert.equal(catalogPage(entries,new URLSearchParams('edit=stockx')).total,20);
 const result=catalogPage(entries,new URLSearchParams('brand=Nike&q=FJ4736-400'));
 assert.equal(result.total,1);assert.equal(result.items[0].title,edit[15].title);
 const html=await renderPreview(edit[15].url);
 assert(html.includes(edit[15].sku));assert(html.includes(edit[15].sourceUrl));assert(html.includes(edit[15].description));
 const home=await renderPreview('/');
 assert(home.includes('/collections/all?brand=adidas'));
 const gallery=await renderPreview('/collections/all');
 assert(!gallery.includes('Named designs')&&!gallery.includes('StockX edit'));
 const payload=JSON.parse(gallery.match(/<script[^>]*data-catalog-data[^>]*>([\s\S]*?)<\/script>/)[1]);
 const archive=JSON.parse(await readFile('tools/fixtures/photo-shop.json','utf8'));
 const originalIds=[...edit.filter(item=>!item.replacesProductId),...archive].map(item=>item.id);
 assert.equal(payload.length,908);
 assert.deepEqual(new Set(payload.map(item=>item.id)),new Set(originalIds));
 const original=archive.find(item=>item.id==='pair-0018');
 const updated=mergeCatalogPhotography(archive,edit).find(item=>item.id===original.id);
 for(const field of ['id','url','title','brand','colorway','description','identityStatus']) assert.equal(updated[field],original[field], `Photo replacement changed ${field}`);
 assert.equal(payload.find(item=>item.id===original.id).cover,'/assets/stockx-edit/stockx-0020.jpg');
 assert(payload.some(item=>item.id==='pair-0077'), 'Keep products even without matching replacement photos');
 const untouched=mergeCatalogPhotography(archive,edit).find(item=>item.id==='pair-0077');
 assert.deepEqual(untouched,archive.find(item=>item.id==='pair-0077'));
 const seen=new Set();
 const allEntries=prepareCatalog(mergeCatalogPhotography(archive,edit));
 for(let page=1;page<=76;page++) for(const item of catalogPage(allEntries,new URLSearchParams({page})).items) seen.add(item.id);
 assert.deepEqual(seen,new Set(originalIds));
 const mexico=await renderPreview('/products/pair-0018');
 assert(mexico.includes('/assets/stockx-edit/stockx-0020.jpg'));
 assert(!mexico.includes('/assets/shop-products/'));
});
test('exchange takes a bounded short arc and returns to its starting pose without a revolution',()=>{
 const base=journeyPose('materials',.33);
 for(let n=0;n<=200;n++){
  const pose=modelExchangePose(base,n/200);
  assert(pose.rotationY>=Math.min(0,base.rotationY)-1e-8&&pose.rotationY<=Math.PI/2+1e-8);
  assert(Math.abs(pose.rotationZ)<=Math.abs(base.rotationZ)+1e-8);
 }
 assert.deepEqual(modelExchangePose(base,0),base);
 assert(Math.abs(modelExchangePose(base,1).rotationY-base.rotationY)<1e-10);
});
