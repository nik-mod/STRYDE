import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {prepareCatalog,catalogPage} from '../src/collection-studio.mjs';
import {renderPreview} from '../tools/preview.mjs';
import {modelExchangePose} from '../src/journey-transition.mjs';
import {journeyPose} from '../src/journey-poses.mjs';
const edit=JSON.parse(await readFile('tools/fixtures/stockx-edit.json','utf8'));
test('curated references have distinct identities, original local photographs and source metadata',async()=>{
 assert.equal(edit.length,19);assert.equal(new Set(edit.map(x=>x.sourceUrl)).size,edit.length);
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
test('StockX edit can be filtered by brand and searched by style code with working detail pages',async()=>{
 const archive=JSON.parse(await readFile('tools/fixtures/photo-shop.json','utf8'));
 const entries=prepareCatalog([...edit,...archive]);
 assert.equal(catalogPage(entries,new URLSearchParams('edit=stockx')).total,19);
 const result=catalogPage(entries,new URLSearchParams('edit=stockx&brand=Nike&q=FJ4736-400'));
 assert.equal(result.total,1);assert.equal(result.items[0].title,edit[15].title);
 const html=await renderPreview(edit[15].url);
 assert(html.includes(edit[15].sku));assert(html.includes(edit[15].sourceUrl));assert(html.includes(edit[15].description));
 const home=await renderPreview('/');
 assert(home.includes('/collections/all?edit=stockx&amp;brand=adidas'));
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
