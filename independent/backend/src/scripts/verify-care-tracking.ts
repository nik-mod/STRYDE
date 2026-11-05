import type { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
export default async function verify({ container }: ExecArgs) {
 if(process.env.NODE_ENV === "production" || process.env.STRYDE_TEST_MODE !== "true") throw new Error("Local test mode required.");
 if (!["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error("Loopback database required.");
 const env=await readFile(resolve(process.cwd(),"../storefront/.env.local"),"utf8");
 const key=env.match(/^MEDUSA_PUBLISHABLE_KEY=(.+)$/m)![1].trim();
 const orders=container.resolve(Modules.ORDER);const customers=container.resolve(Modules.CUSTOMER);const auth=container.resolve(Modules.AUTH);
 const actors:{id:string;token:string;email:string;identity:string}[]=[];let orderId:string|undefined;
 const results:Record<string,unknown>={};
 const call=async(path:string,data:unknown,token?:string)=>{const response=await fetch(`http://127.0.0.1:9000${path}`,{method:"POST",headers:{"content-type":"application/json","x-publishable-api-key":key,...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});return {status:response.status,data:await response.json()};};
 try {
  for(let i=0;i<2;i++) {
   const email=`care-verify-${Date.now()}-${i}@example.invalid`;const password=crypto.randomUUID();
   const registered=await call("/auth/customer/emailpass/register",{email,password});assert.equal(registered.status,200);
   const created=await call("/store/customers",{email,first_name:"Temporary",last_name:"Care verification"},registered.data.token);assert.equal(created.status,200);
   const login=await call("/auth/customer/emailpass",{email,password});assert.equal(login.status,200);
   const payload=JSON.parse(Buffer.from(login.data.token.split('.')[1],'base64url').toString());
   actors.push({id:created.data.customer.id,email,token:login.data.token,identity:payload.auth_identity_id});
  }
  const [order]=await orders.createOrders([{currency_code:"usd",email:actors[0].email,customer_id:actors[0].id,items:[{title:"Temporary order lookup verification",quantity:1,unit_price:0}],metadata:{temporary_verification:true}}] as any);orderId=order.id;
  const details={display_id:order.display_id,email:actors[0].email};
  const anonymous=await call("/store/stryde/order-track",details);assert.equal(anonymous.status,401);results.anonymous={status:anonymous.status};
  const owner=await call("/store/stryde/order-track",details,actors[0].token);assert.equal(owner.status,200);assert.equal(owner.data.order.display_id,order.display_id);assert.equal(owner.data.order.shipping_address,undefined);assert.equal(owner.data.order.email,undefined);assert.deepEqual(owner.data.order.fulfillments,[]);results.owner={status:owner.status,matched:true,fulfillments:0,privateFieldsAbsent:true};
  const proxy=async(token?:string)=>{const r=await fetch("http://localhost:3000/api/orders/track",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json",...(token?{cookie:`stryde_customer=${token}`}:{})},body:JSON.stringify(details)});return {status:r.status,data:await r.json()};};
  const proxyOwner=await proxy(actors[0].token);assert.equal(proxyOwner.status,200);assert.equal(proxyOwner.data.order.display_id,order.display_id);
  const proxyOther=await proxy(actors[1].token);assert.equal(proxyOther.status,404);const proxyGuest=await proxy();assert.equal(proxyGuest.status,401);results.storefrontProxy={owner:200,otherOwner:404,anonymous:401};
  const other=await call("/store/stryde/order-track",details,actors[1].token);assert.equal(other.status,404);results.otherOwner={status:other.status,disclosedOrder:!!other.data.order};
  const wrong=await call("/store/stryde/order-track",{...details,email:"wrong@example.invalid"},actors[0].token);assert.equal(wrong.status,404);results.wrongEmail={status:wrong.status,disclosedOrder:!!wrong.data.order};
  let limited=0;for(let i=0;i<12;i++) {const r=await call("/store/stryde/order-track",details,actors[0].token);if(r.status===429)limited++;}assert.ok(limited>0);results.rateLimit={status:429,enforced:true};
 } finally {
  if(orderId)await orders.deleteOrders([orderId]);
  for(const actor of actors){await customers.deleteCustomers([actor.id]);if(actor.identity)await auth.deleteAuthIdentities([actor.identity]);}
  results.cleanup="Temporary zero-value order, customers and auth identities deleted; no payment, inventory mutation, fulfillment or email workflow used.";
  await writeFile(resolve(process.cwd(),"../evidence/customer-experience/tracking-integration.json"),JSON.stringify(results,null,2));
 }
 console.log("CARE_TRACKING_VERIFICATION_PASSED");
}


