import test from "node:test";
import assert from "node:assert/strict";
import { createContactService } from "../src/lib/contact-server";
const env = { SITE_URL: "https://store.example", CART_COOKIE_SECRET: "test-secret-".repeat(4), RESEND_API_KEY: "test-key", CONTACT_FROM_EMAIL: "sender@store.example", CONTACT_TO_EMAIL: "inbox@store.example" };
function setup(fetcher: typeof fetch = async () => Response.json({ id: "test-receipt" })) {
  let time = 1800000000000;
  const service = createContactService({ env, fetcher, now: () => time });
  const token = service.token(); time += 2000;
  const value = { name: "Test visitor", email: "visitor@example.com", subject: "Product question", message: "A fictional product question for testing.", website: "", token };
  const request = (data: unknown = value, origin = env.SITE_URL) => new Request(`${env.SITE_URL}/api/contact`, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return { service, value, request, advance: (ms: number) => { time += ms; } };
}
test("unconfigured delivery never returns success or calls an email provider", async () => {
  let calls = 0;
  const service = createContactService({ env: { SITE_URL: env.SITE_URL }, fetcher: async () => { calls++; throw new Error(); } });
  const fixture = setup();
  assert.equal((await service.get().json()).ready, false);
  const response = await service.post(fixture.request());
  assert.equal(response.status, 503); assert.equal((await response.json()).accepted, undefined); assert.equal(calls, 0);
});
test("validation reports individual fields and rejects extra properties", async () => {
  const f = setup();
  const response = await f.service.post(f.request({ ...f.value, name: "", email: "invalid", subject: "", message: "tiny" }));
  assert.equal(response.status, 422);
  const result = await response.json();
  for (const field of ["name", "email", "subject", "message"]) assert(result.fields[field].length);
  assert.equal((await f.service.post(f.request({ ...f.value, to: "attacker@example.com" }))).status, 422);
});
test("cross-origin, non-JSON and oversized requests are rejected", async () => {
  const f = setup();
  assert.equal((await f.service.post(f.request(undefined, "https://other.example"))).status, 403);
  assert.equal((await f.service.post(new Request(`${env.SITE_URL}/api/contact`, { method: "POST", headers: { origin: env.SITE_URL }, body: "text" }))).status, 415);
  assert.equal((await f.service.post(f.request({ message: "x".repeat(17000) }))).status, 413);
});
test("tampered, expired and unrealistically early form tokens require refresh", async () => {
  const f = setup();
  assert.equal((await f.service.post(f.request({ ...f.value, token: f.value.token + "x" }))).status, 422);
  const fresh = f.service.token();
  assert.equal((await f.service.post(f.request({ ...f.value, token: fresh }))).status, 422);
  f.advance(1800001);
  const response = await f.service.post(f.request());
  assert.equal(response.status, 422); assert.equal((await response.json()).refresh, true);
});
test("honeypot rejects spam without a fake success", async () => {
  const f = setup();
  const response = await f.service.post(f.request({ ...f.value, website: "spam" }));
  assert.equal(response.status, 400); assert.equal((await response.json()).accepted, undefined);
});
test("provider acceptance is required; recipient and sender are fixed server-side", async () => {
  const sent: RequestInit[] = [];
  const f = setup(async (url, options) => { assert.equal(url, "https://api.resend.com/emails"); sent.push(options!); return Response.json({ id: "test-receipt" }); });
  for (let i = 0; i < 2; i++) assert.equal((await f.service.post(f.request())).status, 202);
  const payload = JSON.parse(String(sent[0].body));
  assert.deepEqual(payload.to, [env.CONTACT_TO_EMAIL]); assert.equal(payload.reply_to, f.value.email);
  assert.equal(payload.from, `STRYDE <${env.CONTACT_FROM_EMAIL}>`); assert.equal(payload.html, undefined);
  assert.equal((sent[0].headers as Record<string, string>)["Idempotency-Key"], (sent[1].headers as Record<string, string>)["Idempotency-Key"]);
});
test("provider rejection, missing receipt and network errors never return success", async () => {
  for (const fetcher of [async () => Response.json({ error: "rejected" }, { status: 403 }), async () => Response.json({}), async () => { throw new Error("timeout"); }]) {
    const f = setup(fetcher);
    const response = await f.service.post(f.request());
    assert.equal(response.status, 502); assert.equal((await response.json()).accepted, undefined);
  }
});
test("repeated email submissions are limited before provider delivery", async () => {
  let calls = 0;
  const f = setup(async () => { calls++; return Response.json({ id: "test-receipt" }); });
  for (let i = 0; i < 3; i++) assert.equal((await f.service.post(f.request())).status, 202);
  const response = await f.service.post(f.request());
  assert.equal(response.status, 429); assert.equal(calls, 3); assert.equal(response.headers.get("retry-after"), "600");
});
test("loopback aliases are accepted only in development", async () => {
  for (const mode of ["development", "production"]) {
    let time = 1800000000000;
    const service = createContactService({ env: { ...env, SITE_URL: "http://localhost:3000", NODE_ENV: mode }, now: () => time, fetcher: async () => Response.json({ id: "test-receipt" }) });
    const token = service.token(); time += 2000;
    const value = { ...setup().value, token };
    const request = new Request("http://127.0.0.1:3000/api/contact", { method: "POST", headers: { origin: "http://127.0.0.1:3000", "Content-Type": "application/json" }, body: JSON.stringify(value) });
    assert.equal((await service.post(request)).status, mode === "development" ? 202 : 403);
  }
});
