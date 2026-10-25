import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Liquid } from 'liquidjs';
import { mountCollectionHover } from '../src/motion/collection-hover.mjs';
import { mountHeader } from '../src/motion/header.mjs';

async function collection(settings = {}) {
  const source = await readFile('sections/chapter-collection.liquid', 'utf8');
  const schema = JSON.parse(source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)[1]);
  const defaults = Object.fromEntries(schema.settings.filter(s => s.default !== undefined).map(s => [s.id, s.default]));
  const engine = new Liquid({ root: 'snippets', extname: '.liquid' });
  engine.registerFilter('t', key => key);
  engine.registerFilter('asset_url', file => `/assets/${file}`);
  engine.registerFilter('image_url', image => image.url);
  engine.registerFilter('image_tag', url => `<img src="${url}">`);
  engine.registerFilter('money_with_currency', cents => `$${cents / 100} USD`);
  const html = await engine.parseAndRender(source.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/, ''), {
    section: {id:'qa', settings:{...defaults,...settings}}, routes:{all_products_collection_url:'/collections/all'},
  });
  return {html, schema};
}

test('collection fields keep their existing defaults and independently honor merchant colors', async () => {
  const original = await collection();
  assert.deepEqual(original.schema.settings.filter(s => s.type === 'color').map(s => s.default), ['#41b4f0','#7fa9f6','#4fc4d4']);
  assert.deepEqual([...original.html.matchAll(/--scene-field: (#[a-f0-9]+)/g)].map(m => m[1]), ['#41b4f0','#7fa9f6','#4fc4d4']);
  const edited = await collection({field_1:'#112233',field_2:'#445566',field_3:'#778899'});
  assert.deepEqual([...edited.html.matchAll(/--scene-field: (#[a-f0-9]+)/g)].map(m => m[1]), ['#112233','#445566','#778899']);
});

test('real collection scenes preserve native data without concept labels or substitute artwork', async () => {
  const product = {title:'Merchant shoe',url:'/products/merchant-shoe',price:24000,available:true,featured_image:{url:'/merchant.jpg'}};
  const {html} = await collection({use_tn_model:true,collection:{products_count:2,products:[product,{...product,featured_image:null,available:false}]}});
  assert.match(html, /href="\/products\/merchant-shoe"/);
  assert.match(html, /\/merchant\.jpg/);
  assert.match(html, /\$240 USD/);
  assert.match(html, /products.sold_out/);
  assert.match(html, /hero.asset_pending/);
  assert.doesNotMatch(html, /assets.concept_tag|stryde-concept-v2|data-model-editorial-image/);
  const studies = (await collection({use_tn_model:true})).html;
  assert.equal((studies.match(/data-model-editorial-image/g)||[]).length,1);
  assert.equal((studies.match(/data-concept-image=/g)||[]).length,2);
  assert.match(studies, /collection.chrome_rear_note/);
  assert.doesNotMatch(studies, /money|Price on selection|coll-scene-link/);
  assert.match((await collection()).html, /assets.concept_tag/);
});

test('collection hover clamps cached pointer offsets and releases event-created tweens on unload', () => {
  const scene = new EventTarget(); const environment = new EventTarget();
  const image = {}; const visual = {querySelector:() => image};
  let reads = 0; let killed = 0; let cleared = 0; const calls = [];
  scene.querySelector = () => visual;
  scene.getBoundingClientRect = () => {reads++; return {left:0,top:0,width:200,height:100};};
  const gsap = {
    quickTo(target, axis) {
      assert.equal(target, image);
      const move = value => calls.push([axis,value]); move.tween = {kill:() => killed++}; return move;
    },
    to(target) {assert.equal(target,visual);return {kill:() => killed++};},
    set(targets, props) {assert.deepEqual(targets,[visual,image]);assert.equal(props.clearProps,'transform');cleared++;},
  };
  const pointer = (type, x=1000, y=-1000) => {const e=new Event(type);Object.assign(e,{clientX:x,clientY:y});scene.dispatchEvent(e);};
  const dispose = mountCollectionHover(scene,gsap,environment);
  pointer('pointerenter');for(let i=0;i<50;i++)pointer('pointermove');
  assert.equal(reads,1);assert.deepEqual(calls.slice(-2),[['x',5],['y',-4]]);
  pointer('pointerleave');assert.deepEqual(calls.slice(-2),[['x',0],['y',0]]);
  dispose();dispose();assert.equal(killed,4);assert.equal(cleared,1);
  const count=calls.length;pointer('pointerenter');pointer('pointermove');environment.dispatchEvent(new Event('resize'));
  assert.equal(calls.length,count);assert.equal(reads,1);
});

test('header unload cancels its queued frame and ignores a late callback', () => {
  const environment = new EventTarget(); environment.scrollY = 0;
  let queued; let cancelled = 0; let writes = 0;
  environment.requestAnimationFrame = callback => {queued=callback;return 1;};
  environment.cancelAnimationFrame = id => {assert.equal(id,1);cancelled++;};
  const header = {dataset:{},contains:() => false,classList:{toggle:() => writes++,add:() => writes++,remove:() => writes++}};
  const dispose = mountHeader(header,environment);
  environment.scrollY=300;environment.dispatchEvent(new Event('scroll'));
  assert.equal(typeof queued,'function');dispose();
  assert.equal(cancelled,1);assert.equal(header.dataset.headerBound,undefined);
  const after=writes;queued();environment.dispatchEvent(new Event('scroll'));assert.equal(writes,after);
});

test('collection header stays at its fixed position while scrolling down and back up',()=>{
 const environment=new EventTarget();environment.scrollY=0;let frame;
 environment.requestAnimationFrame=fn=>{frame=fn;return 1;};environment.cancelAnimationFrame=()=>{};
 const classes=new Set();const header={dataset:{},ownerDocument:{body:{classList:{contains:name=>name==='template-collection'}}},classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name),add:name=>classes.add(name),remove:(...names)=>names.forEach(name=>classes.delete(name))}};
 const dispose=mountHeader(header,environment);
 for(const y of [300,1600,600,0]){environment.scrollY=y;environment.dispatchEvent(new Event('scroll'));frame();assert(!classes.has('is-hidden'));}
 dispose();
});
