import { test } from "node:test";
import assert from "node:assert/strict";
import { readPreviewBag, previewTotals, EMPTY_PREVIEW_BAG, PREVIEW_COMMERCE } from "../src/lib/preview-commerce";
const line = { handle:"stockx-0001", title:"Sample sneaker", image:"/assets/stockx-edit/adidas-samba.webp", size:"42", quantity:1 };
test("corrupted storage yields a fresh empty bag without contaminating the empty state",()=>{
 for(const value of [null, undefined, [], "bad", {items: "bad"}]) {const bag=readPreviewBag(value);bag.items.push({...line});assert.equal(EMPTY_PREVIEW_BAG.items.length,0);assert.equal(readPreviewBag(null).items.length,0);}
});
test("preview storage rejects unexpected paths, sizes and quantities",()=>{
 for(const patch of [{handle:"anything"},{image:"https://example.com/shoe.jpg"},{image:"/assets/stockx-edit/../../secret.png"},{size:"99"},{quantity:0},{quantity:-1},{quantity:1.5},{quantity:"1"}]) assert.equal(readPreviewBag({items:[{...line,...patch}]}).items.length,0);
 assert.equal(readPreviewBag({items:[line],promo:"true"}).promo,false);
});
test("bag merges duplicate pairs by size and caps quantities",()=>{
 const bag=readPreviewBag({items:[line,{...line,quantity:12},{...line,size:"43"}],promo:true});
 assert.equal(bag.items.length,2);assert.equal(bag.items[0].quantity,PREVIEW_COMMERCE.maxQuantity);assert.equal(bag.items[1].quantity,1);assert.equal(bag.promo,true);
 assert.equal(readPreviewBag({items:[{...line,handle:"stockx-archive-0123456789abcdef"}]}).items.length,1);
});
test("sample totals apply the illustrative discount before delivery",()=>{
 const bag=readPreviewBag({items:[{...line,quantity:2}],promo:true});
 assert.deepEqual(previewTotals(bag,19),{subtotal:280,discount:28,shipping:19,total:271});
 assert.deepEqual(previewTotals({items:[],promo:false}),{subtotal:0,discount:0,shipping:0,total:0});
});
