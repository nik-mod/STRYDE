import test from "node:test";
import assert from "node:assert/strict";
import passwordReset from "../src/subscribers/password-reset";

function fixture(t: { after: (fn: () => void) => void }, fetcher: typeof fetch = async () => Response.json({ id: "test-receipt" })) {
  const names = ["NODE_ENV", "STOREFRONT_URL", "AUTH_EMAIL_MODE", "RESEND_API_KEY", "AUTH_FROM_EMAIL"];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { NODE_ENV: "production", STOREFRONT_URL: "https://store.example", AUTH_EMAIL_MODE: "resend", RESEND_API_KEY: "fictional-test-key", AUTH_FROM_EMAIL: "STRYDE <accounts@store.example>" });
  globalThis.fetch = fetcher;
  t.after(() => { globalThis.fetch = originalFetch; for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; } });
  return (data = { actor_type: "customer", entity_id: "visitor@example.test", token: "fictional-reset-token" }) => passwordReset({ event: { data } } as Parameters<typeof passwordReset>[0]);
}

test("customer recovery sends a fixed-origin fragment link and stable idempotency key", async t => {
  const calls: RequestInit[] = [];
  const send = fixture(t, async (url, options) => { assert.equal(url, "https://api.resend.com/emails"); calls.push(options!); return Response.json({ id: "test-receipt" }); });
  await send(); await send();
  const payload = JSON.parse(String(calls[0].body));
  assert.deepEqual(payload.to, ["visitor@example.test"]);
  assert.equal(payload.from, "STRYDE <accounts@store.example>");
  const link = new URL(payload.text.match(/https:\/\/\S+/)[0]);
  assert.equal(link.origin, "https://store.example"); assert.equal(link.pathname, "/account/reset-password");
  assert.equal(link.search, ""); assert.equal(new URLSearchParams(link.hash.slice(1)).get("token"), "fictional-reset-token");
  assert.equal((calls[0].headers as Record<string, string>)["Idempotency-Key"], (calls[1].headers as Record<string, string>)["Idempotency-Key"]);
});

test("admin recovery events never enter the customer delivery path", async t => {
  let calls = 0;
  const send = fixture(t, async () => { calls++; return Response.json({ id: "test-receipt" }); });
  await send({ actor_type: "user", entity_id: "admin@example.test", token: "fictional-reset-token" });
  assert.equal(calls, 0);
});

test("production refuses unconfigured delivery instead of writing a development link", async t => {
  const send = fixture(t); delete process.env.RESEND_API_KEY;
  await assert.rejects(send(), /not configured/);
});

test("production recovery refuses HTTP links and recipient header injection", async t => {
  const send = fixture(t); process.env.STOREFRONT_URL = "http://store.example";
  await assert.rejects(send(), /HTTPS/);
  await assert.rejects(send({ actor_type: "customer", entity_id: "visitor@example.test\r\nBcc: other@example.test", token: "fictional-reset-token" }), /Invalid recovery recipient/);
});

test("provider rejection and missing receipts fail delivery", async t => {
  const send = fixture(t, async () => Response.json({ error: "rejected" }, { status: 403 }));
  await assert.rejects(send(), /not accepted/);
  globalThis.fetch = async () => Response.json({});
  await assert.rejects(send(), /not accepted/);
});
