import { test } from "node:test";
import assert from "node:assert/strict";
import { allowOrderLookup, ownsTrackedOrder } from "../src/lib/order-tracking";
test("tracking requires owner identity even when the email and order number are known", () => {
 const order={customer_id:"customer_owner",email:"Owner@example.com"};
 assert.equal(ownsTrackedOrder(order,"customer_other","Owner@example.com"),false);
 assert.equal(ownsTrackedOrder(order,"customer_owner","wrong@example.com"),false);
 assert.equal(ownsTrackedOrder(undefined,"customer_owner","Owner@example.com"),false);
 assert.equal(ownsTrackedOrder(order,"customer_owner"," owner@example.com "),true);
});
test("lookup limits cannot be reset by changing emails or order numbers", () => {
 for(let i=0;i<10;i++) assert.equal(allowOrderLookup("customer_rate",1000),true);
 assert.equal(allowOrderLookup("customer_rate",1000),false);
 assert.equal(allowOrderLookup("customer_other",1000),true);
 assert.equal(allowOrderLookup("customer_rate",61000),true);
});
