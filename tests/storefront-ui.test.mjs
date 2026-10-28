import test from 'node:test';
import assert from 'node:assert/strict';
import { inPageAnchor } from '../src/motion/navigation.mjs';
import { mountListing } from '../src/motion/listing.mjs';
import { renderPreview } from '../tools/preview.mjs';

test('smooth navigation accepts only anchors in the same document and preserves external navigation', () => {
  const current = 'https://store.example/collections/all?q=blue';
  assert.equal(inPageAnchor('#MainContent', current), 'MainContent');
  assert.equal(inPageAnchor('#size%20guide', current), 'size guide');
  for (const href of ['https://other.example/#MainContent','/products/shoe#details','?q=red#MainContent','#','javascript:alert(1)','#%zz']) {
    assert.equal(inPageAnchor(href,current), null);
  }
});

test('preview search returns only matching photographs and leaves real fixture product search intact', async () => {
  const reference = await renderPreview('/search', new URLSearchParams('q=Nike+97'));
  assert.match(reference, /Nike Air Max 97/);
  assert.doesNotMatch(reference, /data-reference-name="adidas|data-reference-name="new balance/);
  assert.match(reference, /Not store inventory or available for purchase/);
  const fixture = await renderPreview('/search', new URLSearchParams('q=shoe&fixtures=1'));
  assert.match(fixture, /href="\/products\/preview-product"/);
  assert.doesNotMatch(fixture, /data-reference-catalog/);
});

test('search entry uses the collection field while native Shopify search still submits queries', async () => {
  const collection = await renderPreview('/collections/all');
  assert.match(collection, /id="CollectionSearch" type="search" name="q" data-photo-search/);
  const home = await renderPreview('/');
  assert.match(home, /class="header-search-link" href="\/collections\/all#CollectionSearch">Search<\/a>/);
  const search = await renderPreview('/search', new URLSearchParams('q=Nike&fixtures=1'));
  assert.match(search, /action="\/search"[^>]+data-predictive-form/);
  assert.match(search, /id="SearchInput" type="search" name="q" value="Nike"/);
  assert.match(search, /placeholder="Search a brand or model"/);
  assert.doesNotMatch(search, /<button class="button button-dark" type="submit">Search/);
  const native = await renderPreview('/collections/all', new URLSearchParams('fixtures=1'));
  assert.match(native, /collection-native-search/);
  assert.match(native, /id="CollectionSearch" type="search" name="q"/);
});

test('account preview uses the storefront layout without presenting an inactive sign-in form', async () => {
  const html = await renderPreview('/account');
  assert.match(html, /class="site-header"/);
  assert.match(html, /Customer sign-in will be available/);
  assert.match(html, /class="site-footer"/);
  assert.doesNotMatch(html, /type="password"/);
});

test('catalog combines filters, recovers from no matches, and detaches on unload', () => {
  const classes = new Set();
  const catalog = new EventTarget();
  catalog.classList = { add: name => classes.add(name), remove: name => classes.delete(name) };
  catalog.dataset = { studyOne:'study', studyOther:'studies' };
  const cards = [['Nike','nike air max 97'],['Nike','nike pegasus'],['Adidas','adidas gazelle']].map(([brand,name]) => ({dataset:{referenceBrand:brand,referenceName:name},hidden:false}));
  const buttons = ['all','Nike','Adidas'].map(brand => ({dataset:{referenceFilter:brand},setAttribute(name,value){this[name]=value;}}));
  const query = {value:'',focus(){this.focused=true;}};
  const count = {}, empty = {};
  catalog.querySelectorAll = selector => selector.includes('photography') ? cards : buttons;
  catalog.querySelector = selector => selector.includes('query') ? query : selector.includes('count') ? count : empty;
  const dispose = mountListing({querySelector:()=>catalog});
  const input = value => { query.value=value; const event=new Event('input'); Object.defineProperty(event,'target',{value:query});catalog.dispatchEvent(event); };
  const click = (filter,reset=false) => { const event=new Event('click');Object.defineProperty(event,'target',{value:{closest:selector=>selector.includes('filter')?filter:reset?{}:null}});catalog.dispatchEvent(event); };
  click(buttons[1]); input('max 97');
  assert.deepEqual(cards.map(card=>card.hidden),[false,true,true]);
  assert.equal(count.textContent,'1 / 3 study');
  input('no match'); assert.equal(empty.hidden,false);
  click(null,true); assert(cards.every(card=>!card.hidden));assert(query.focused);
  dispose();dispose(); input('no match');
  assert(cards.every(card=>!card.hidden));assert(!classes.has('is-filterable'));
});

test('chapter navigation applies header clearance once despite CSS scroll margins',async()=>{
 const {mountNavigation}=await import('../src/motion/navigation.mjs');
 let click,request,focused=false;
 const target={getBoundingClientRect:()=>({top:1200}),hasAttribute:()=>true,focus:()=>{focused=true;}};
 const link={href:'https://store.example/#chapter-materials',target:'',hasAttribute:()=>false,matches:()=>false};
 const document={addEventListener:(name,fn)=>{if(name==='click')click=fn;},getElementById:()=>target,querySelector:selector=>selector==='[data-mobile-menu][open]'?null:selector==='.site-header'?{offsetHeight:80}:selector==='.preview-notice'?{offsetHeight:30}:null};
 const environment={scrollY:500,location:{href:'https://store.example/',hash:''},history:{pushState(){}},addEventListener(){}};
 const scroller={start(){},scrollTo:(destination,options)=>{request={destination,...options};}};
 const dispose=mountNavigation({document,environment,getScroller:()=>scroller,onMenuChange(){}});
 click({target:{closest:()=>link},button:0,preventDefault(){}});
 assert.equal(request.destination,1700);assert.equal(request.offset,-128);
 request.onComplete();assert(focused);dispose();
});
