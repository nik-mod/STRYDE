import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { BigNumber, PaymentSessionStatus } from "@medusajs/framework/utils";
import {
  BankClient, BOG_CALLBACK_PUBLIC_KEY, assertReceipt, bankRedirect, money, operationKey,
  verifyBogSignature, type BankReceipt, type BankSession,
} from "../src/lib/bank-payments/client";
import { bankOptions, bankProviderModules, sandboxBankSessionAllowed, type Bank, type BankOptions } from "../src/lib/bank-payments/config";
import { bankProviderId, verifyBankCallback } from "../src/lib/bank-payments/callback";
import { HostedBankProvider } from "../src/lib/bank-payments/provider";
import { performOnce, type OperationStore, type Operation } from "../src/lib/bank-payments/operations";

const ref = "payses_TEST123";
function options(bank: Bank): BankOptions {
  return { bank, mode: "sandbox", clientId: "test-client", clientSecret: "test-secret", apiKey: "test-api-key",
    currencies: ["USD", "GEL"], callbackUrl: `https://api.stryde.example/hooks/stryde-payments/${bank}`,
    returnUrl: "https://stryde.example/checkout?view=return" };
}
function session(bank: Bank = "tbc"): BankSession {
  return { bank_id: "bank123", session_id: ref, amount: 140.25, currency: "USD",
    redirect_url: bank === "tbc" ? "https://tpay.tbcbank.ge/checkout/bank123" : "https://payment.bog.ge/?order_id=bank123" };
}
const receipt = (patch: Partial<BankReceipt> = {}): BankReceipt => ({ bankId: "bank123", sessionId: ref, amount: 140.25, currency: "USD", status: "captured", refundedAmount: 0, ...patch });
function fixture(bank: Bank, patch: Record<string, unknown> = {}) {
  return bank === "tbc" ? { payId: "bank123", extra2: ref, amount: 140.25, currency: "USD", status: "Succeeded", preAuth: false, ...patch }
    : { order_id: "bank123", external_order_id: ref, capture: "automatic", order_status: { key: "completed" },
      purchase_units: { request_amount: "140.25", transfer_amount: "140.25", currency_code: "USD" }, ...patch };
}
function mock(responses: (unknown | number)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const request = (async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    if (!responses.length) throw new Error("Unexpected bank request");
    const next = responses.shift();
    return typeof next === "number" ? new Response("sensitive bank error", { status: next }) : Response.json(next);
  }) as typeof fetch;
  return { calls, request };
}
const token = { access_token: "sandbox-token", expires_in: 3600 };

test("bank configuration defaults disabled and cannot enable live production checkout", () => {
  assert.deepEqual(bankProviderModules({}), []);
  assert.throws(() => bankOptions("tbc", { TBC_PAYMENT_MODE: "live" }), /certification/);
  assert.throws(() => bankOptions("bog", { BOG_PAYMENT_MODE: "sandbox", NODE_ENV: "production" }), /certification/);
  assert.throws(() => bankOptions("tbc", { TBC_PAYMENT_MODE: "sandbox" }), /Missing/);
  const env = { BOG_PAYMENT_MODE: "sandbox", BOG_CLIENT_ID: "test", BOG_CLIENT_SECRET: "test",
    BOG_PAYMENT_CURRENCIES: "usd,gel", PAYMENT_BACKEND_ORIGIN: "https://api.stryde.example", PAYMENT_RETURN_URL: "https://stryde.example/checkout" };
  assert.equal(bankProviderModules(env)[0].id, "bog");
  assert.throws(() => bankOptions("bog", { ...env, PAYMENT_BACKEND_ORIGIN: "http://localhost:9000" }), /HTTPS/);
  assert.throws(() => bankOptions("bog", { ...env, BOG_PAYMENT_CURRENCIES: "JPY" }), /currency/);
  assert.equal(sandboxBankSessionAllowed({ provider_id: "pp_bog_bog" }, { ...env, STRYDE_TEST_MODE: "true" }), true);
  assert.equal(sandboxBankSessionAllowed({ provider_id: "pp_bog_bog", data: { amount: 1 } }, { ...env, STRYDE_TEST_MODE: "true" }), false);
  assert.equal(sandboxBankSessionAllowed({ provider_id: "pp_bog_bog" }, { ...env, STRYDE_TEST_MODE: "true", NODE_ENV: "production" }), false);
  assert.equal(sandboxBankSessionAllowed({ provider_id: "pp_bog_bog" }, env), false);
});

test("major-unit money conversion preserves decimals and rejects unsafe values", () => {
  assert.equal(money(140.25), 140.25);
  assert.equal(money(new BigNumber("140.25")), 140.25);
  assert.equal(money({ value: "140.25", precision: 20 }), 140.25);
  for (const value of [0, -1, NaN, Infinity, 10.001, "", null, undefined, true, [], [140], "0x8c", " 140 ", {}]) assert.throws(() => money(value));
});

test("bank checkout redirects reject non-bank hosts, credentials and executable URLs", () => {
  assert.match(bankRedirect("bog", "https://payment.bog.ge/?order_id=test"), /^https:/);
  for (const value of ["https://payment.bog.ge.evil.example/", "https://payment.bog.ge:444/", "http://payment.bog.ge/",
    "https://user:secret@payment.bog.ge/", "javascript:alert(1)", "https://evil.example/"]) assert.throws(() => bankRedirect("bog", value));
});

test("BOG operation keys are stable UUIDv4 values and vary per operation", () => {
  assert.match(operationKey(ref), /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(operationKey(ref), operationKey(ref));
  assert.notEqual(operationKey(ref), operationKey(`refund:${ref}`));
});

for (const bank of ["tbc", "bog"] as const) {
  test(`${bank}: authenticates correctly and creates only a bank-hosted card session with trusted totals`, async () => {
    const created = bank === "tbc" ? { payId: "bank123", amount: 140.25, currency: "USD", status: "Created",
      links: [{ rel: "self", uri: "https://api.tbcbank.ge/ignore" }, { rel: "approval_url", uri: session(bank).redirect_url }] }
      : { id: "bank123", _links: { redirect: { href: session(bank).redirect_url } } };
    const http = mock([token, created, fixture(bank)]), client = new BankClient(options(bank), http.request);
    const result = await client.create(ref, 140.25, "usd");
    assert.equal(result.amount, 140.25);
    assert.equal(result.redirect_url, session(bank).redirect_url);
    assert.equal(http.calls.length, 2);
    const authHeaders = http.calls[0].init.headers as Record<string, string>;
    assert.equal(authHeaders["Content-Type"], "application/x-www-form-urlencoded");
    const form = http.calls[0].init.body as URLSearchParams;
    const body = JSON.parse(http.calls[1].init.body as string);
    if (bank === "tbc") {
      assert.equal(form.get("client_id"), "test-client");
      assert.equal(form.get("client_secret"), "test-secret");
      assert.equal(authHeaders.apikey, "test-api-key");
      assert.equal(body.extra2, ref); assert.equal(body.merchantPaymentId, ref);
      assert.deepEqual(body.methods, [5]); assert.equal(body.saveCard, false); assert.equal(body.preAuth, false);
      assert.deepEqual(body.amount, { currency: "USD", total: 140.25 });
    } else {
      assert.equal(form.get("grant_type"), "client_credentials");
      assert.equal(authHeaders.Authorization, `Basic ${Buffer.from("test-client:test-secret").toString("base64")}`);
      assert.equal(body.external_order_id, ref); assert.equal(body.capture, "automatic");
      assert.deepEqual(body.payment_method, ["card"]);
      assert.equal(body.purchase_units.total_amount, 140.25);
      assert.equal((http.calls[1].init.headers as Record<string, string>)["Idempotency-Key"], operationKey(`create:${ref}`));
      assert.equal(body.redirect_urls.fail, body.redirect_urls.success);
    }
    assert.deepEqual(await client.retrieve("bank123"), receipt());
    assert.equal(http.calls.length, 3, "token is cached, not persisted");
    for (const call of http.calls) { assert.equal(call.init.redirect, "error"); assert.ok(call.init.signal); }
  });

  test(`${bank}: rejects unsupported merchant currency before network access`, async () => {
    const http = mock([]), client = new BankClient(options(bank), http.request);
    await assert.rejects(client.create(ref, 140, "EUR"), /not enabled/);
    assert.equal(http.calls.length, 0);
  });

  test(`${bank}: pending, failed and refunded bank statuses never authorize payment`, async () => {
    const statuses = bank === "tbc" ? [["Created", "pending"], ["Failed", "error"], ["Expired", "canceled"], ["PartialReturned", "refunded"]]
      : [["processing", "pending"], ["rejected", "error"], ["refunded", "refunded"], ["refunded_partially", "refunded"]];
    for (const [state, expected] of statuses) {
      const http = mock([token, fixture(bank, bank === "tbc" ? { status: state } : { order_status: { key: state } })]);
      assert.equal((await new BankClient(options(bank), http.request).retrieve("bank123")).status, expected);
    }
  });

  test(`${bank}: rejects unknown status, mismatched bank IDs and malformed session references`, async () => {
    for (const patch of (bank === "tbc" ? [{ status: "Anything" }, { payId: "someone-else" }, { extra2: "cart_123" }]
      : [{ order_status: { key: "Anything" } }, { order_id: "someone-else" }, { external_order_id: "cart_123" }])) {
      const http = mock([token, fixture(bank, patch)]);
      await assert.rejects(new BankClient(options(bank), http.request).retrieve("bank123"));
    }
  });
}

test("BOG rejects a completed receipt if the full amount was not captured", async () => {
  const http = mock([token, fixture("bog", { purchase_units: { request_amount: "140.25", transfer_amount: "1.00", currency_code: "USD" } })]);
  await assert.rejects(new BankClient(options("bog"), http.request).retrieve("bank123"), /full requested amount/);
});

test("bank errors redact body/secrets, and failed mutations are never retried automatically", async () => {
  const http = mock([token, 500]), client = new BankClient(options("tbc"), http.request);
  await assert.rejects(client.create(ref, 140, "USD"), error => {
    assert.equal((error as Error).message, "Bank request failed (HTTP 500)"); return true;
  });
  assert.equal(http.calls.length, 2);
});

test("bank network timeout/unknown result is not treated as paid and is not retried", async () => {
  let count = 0;
  const request = (async () => { count++; throw new Error("secret internal message"); }) as typeof fetch;
  await assert.rejects(new BankClient(options("bog"), request).create(ref, 140, "USD"), /outcome must be checked/);
  assert.equal(count, 1);
});

test("receipt comparison rejects wrong amount, currency, session and bank IDs", () => {
  assert.doesNotThrow(() => assertReceipt(receipt(), session()));
  for (const patch of [{ amount: 1 }, { currency: "GEL" }, { sessionId: "payses_OTHER" }, { bankId: "other" }])
    assert.throws(() => assertReceipt(receipt(patch), session()), /does not match/);
});

test("BOG signature verification uses the exact raw body and rejects tampering and missing signatures", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const key = publicKey.export({ type: "spki", format: "pem" }).toString();
  const raw = '{ "event": "order_payment", "body": {"order_id":"bank123"} }';
  const signature = sign("RSA-SHA256", Buffer.from(raw), privateKey).toString("base64");
  assert.equal(verifyBogSignature(raw, signature, key), true);
  assert.equal(verifyBogSignature(JSON.stringify(JSON.parse(raw)), signature, key), false);
  assert.equal(verifyBogSignature(raw, signature), false, "a self-signed request cannot impersonate BOG");
  assert.equal(verifyBogSignature(raw, undefined, key), false);
  assert.equal(verifyBogSignature(raw, "invalid!", key), false);
  assert.match(BOG_CALLBACK_PUBLIC_KEY, /BEGIN PUBLIC KEY/);
});

test("BOG callback with missing/forged signature is rejected before parsing or contacting bank", async () => {
  let calls = 0;
  await assert.rejects(verifyBankCallback("bog", "not even JSON", {}, { retrieve: async () => { calls++; return receipt(); } }, async () => { throw new Error(); }), /signature/);
  assert.equal(calls, 0);
});

function dbSession(patch: Record<string, any> = {}) {
  return { id: ref, provider_id: bankProviderId("tbc"), amount: 140.25, currency_code: "usd", data: { ...session() }, ...patch };
}
test("TBC callback ignores posted success and verifies amount/currency/reference/provider against stored Medusa session", async () => {
  const raw = JSON.stringify({ PaymentId: "bank123", status: "Succeeded", amount: 1 });
  const client = { retrieve: async () => receipt({ status: "pending" }) };
  assert.equal((await verifyBankCallback("tbc", raw, {}, client, async () => dbSession())).status, "pending");
  for (const patch of [{ amount: 1 }, { currency_code: "gel" }, { provider_id: bankProviderId("bog") }, { data: { ...session(), bank_id: "other" } }])
    await assert.rejects(verifyBankCallback("tbc", raw, {}, client, async () => dbSession(patch)));
});

test("TBC callback replays re-read authoritative state and cannot resurrect a refunded payment", async () => {
  const raw = JSON.stringify({ PaymentId: "bank123" });
  const states: BankReceipt[] = [receipt(), receipt({ status: "refunded" })];
  const client = { retrieve: async () => states.shift()! };
  assert.equal((await verifyBankCallback("tbc", raw, {}, client, async () => dbSession())).status, "captured");
  assert.equal((await verifyBankCallback("tbc", raw, {}, client, async () => dbSession())).status, "refunded");
});

class TestProvider extends HostedBankProvider {
  static identifier = "unit-test";
  useClient(client: BankClient) { this.client = client; }
  useStore(store: OperationStore) { this.operations = store; }
}
test("Medusa provider re-verifies bank state on authorize/capture and never returns raw card data", async () => {
  const http = mock([token, { ...fixture("tbc"), paymentCardNumber: "do-not-store" }, fixture("tbc"), fixture("tbc", { status: "Failed" })]);
  const provider = new TestProvider({}, options("tbc"));
  provider.useClient(new BankClient(options("tbc"), http.request));
  const result = await provider.authorizePayment({ data: { ...session(), attacker: "ignored" } });
  assert.equal(result.status, PaymentSessionStatus.CAPTURED);
  assert.deepEqual(result.data, session());
  await assert.doesNotReject(provider.capturePayment({ data: { ...session() } }));
  await assert.rejects(provider.capturePayment({ data: { ...session() } }), /not been captured/);
});

test("partial refunds, premature deletion and changed totals fail explicitly rather than pretending success", async () => {
  const http = mock([token, fixture("tbc"), fixture("tbc", { status: "Created" }), fixture("tbc")]);
  const provider = new TestProvider({}, options("tbc"));
  provider.useClient(new BankClient(options("tbc"), http.request));
  await assert.rejects(provider.refundPayment({ amount: 10, data: { ...session() } }), /Only a full/);
  await assert.rejects(provider.deletePayment({ data: { ...session() } }), /reconciled/);
  await assert.rejects(provider.updatePayment({ data: { ...session() }, amount: 141, currency_code: "USD" }), /cannot be changed/);
  assert.deepEqual(await provider.getWebhookActionAndData({ data: {}, rawData: "{}", headers: {} }), { action: "not_supported" });
});

function memoryStore(): OperationStore {
  const entries = new Map<string, Operation>();
  return { async reserve(key, details) { if (entries.has(key)) return false; entries.set(key, { state: "reserved", details }); return true; }, async get(key) { return entries.get(key); }, async save(key, state, details) { entries.set(key, { state, details }); } };
}
test("durable reservation permits only one mutation across concurrent requests and reuses the recorded result", async () => {
  const store = memoryStore(); let calls = 0;
  const run = () => performOnce(store, "checkout:one", {}, async () => { calls++; await new Promise(r => setTimeout(r, 10)); return { bankId: "one" }; });
  const results = await Promise.allSettled([run(), run()]);
  assert.equal(calls, 1); assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.deepEqual(await run(), { bankId: "one" }); assert.equal(calls, 1);
});
test("unknown mutation outcome and a crashed reservation never trigger another bank POST", async () => {
  const store = memoryStore(); let calls = 0;
  const run = () => performOnce(store, "unknown", {}, async () => { calls++; throw new Error("timeout"); });
  await assert.rejects(run(), /timeout/); await assert.rejects(run(), /reconciliation/); assert.equal(calls, 1);
  await store.reserve("crashed", {});
  await assert.rejects(performOnce(store, "crashed", {}, async () => { calls++; }), /reconciliation/); assert.equal(calls, 1);
});
for (const bank of ["tbc", "bog"] as const) {
  test(`${bank}: a pending full refund is not reported completed and retry never resubmits it`, async () => {
    const pending = fixture(bank, bank === "tbc" ? { status: "CancelPaymentProcessing" } : { order_status: { key: "refund_requested" } });
    const refunded = fixture(bank, bank === "tbc" ? { status: "Returned", returnedAmount: 140.25 } : { order_status: { key: "refunded" }, purchase_units: { request_amount: "140.25", transfer_amount: "0", refund_amount: "140.25", currency_code: "USD" } });
    const http = mock([token, fixture(bank), bank === "tbc" ? {} : { key: "request_received", action_id: "action123" }, pending, refunded, refunded]);
    const provider = new TestProvider({}, options(bank)); provider.useClient(new BankClient(options(bank), http.request)); provider.useStore(memoryStore());
    await assert.rejects(provider.refundPayment({ amount: 140.25, data: { ...session(bank) } }), /pending reconciliation/);
    await assert.doesNotReject(provider.refundPayment({ amount: 140.25, data: { ...session(bank) } }));
    const posts = http.calls.filter(c => c.init.method === "POST" && !c.url.includes("token"));
    assert.equal(posts.length, 1);
  });
}
