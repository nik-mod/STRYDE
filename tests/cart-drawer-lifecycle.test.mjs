import test from 'node:test';
import assert from 'node:assert/strict';
import { mountCartDrawer, getCartController } from '../src/cart-drawer.mjs';

const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const document = new EventTarget(), dialog = new EventTarget();
  const content = { innerHTML:'' }, status = { textContent:'' };
  const config = { routes:{root:'/',cartAdd:'/cart/add.js',cartChange:'/cart/change.js',cartFetch:'/cart.js'} };
  dialog.dataset = {}; dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  dialog.contains = () => false;
  dialog.querySelector = selector => selector === '[data-cart-drawer-content]' ? content : null;
  document.body = { hasAttribute:()=>false };
  document.querySelector = selector => selector.startsWith('dialog') ? dialog : {textContent:JSON.stringify(config)};
  document.querySelectorAll = () => [];
  document.getElementById = () => status;
  document.createElement = () => ({querySelector:()=>({innerHTML:'fresh cart'})});
  const click = () => {
    const event = new Event('click',{cancelable:true});
    Object.defineProperty(event,'target',{value:{closest:()=>({})}});
    document.dispatchEvent(event);
  };
  return {document,dialog,content,status,click};
}

test('restoring the cart drawer removes old open and mutation listeners', async () => {
  const f = fixture(); let requests = 0;
  const fetchImpl = async () => { requests++; return {ok:true,json:async()=>({'cart-drawer':'markup'})}; };
  const disposeFirst = mountCartDrawer({document:f.document,fetchImpl});
  disposeFirst();
  const disposeSecond = mountCartDrawer({document:f.document,fetchImpl});
  f.click(); await settle();
  assert.equal(requests,1,'one drawer refresh after a restored-page click');
  assert.equal(f.content.innerHTML,'fresh cart','the active controller owns the refresh');
  assert.equal(f.dialog.dataset.busy,undefined);
  disposeSecond(); f.click(); await settle();
  assert.equal(requests,1,'disposed listeners cannot reopen or refresh the cart');
  assert.equal(f.dialog.open,false);
  assert.equal(getCartController(),null);
});

test('a late request from the old drawer cannot clear a newer busy state or announce its error', async () => {
  const f = fixture(), requests = [];
  const fetchImpl = () => new Promise((resolve,reject)=>requests.push({resolve,reject}));
  const disposeFirst = mountCartDrawer({document:f.document,fetchImpl});
  f.click(); disposeFirst();
  const disposeSecond = mountCartDrawer({document:f.document,fetchImpl}); f.click();
  assert.equal(requests.length,2);
  requests[0].reject(new Error('old failure')); await settle();
  assert.equal(f.dialog.dataset.busy,'true');
  assert.equal(f.status.textContent,'');
  requests[1].resolve({ok:true,json:async()=>({'cart-drawer':'markup'})}); await settle();
  assert.equal(f.dialog.dataset.busy,undefined);
  assert.equal(f.content.innerHTML,'fresh cart');
  disposeSecond();
});
