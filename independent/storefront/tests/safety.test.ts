import test from "node:test";
import assert from "node:assert/strict";
import { permitted, liveCheckoutEnabled } from "../src/lib/policy";
import {
  guardMutation,
  body,
  addressSchema,
  RequestError,
} from "../src/lib/security";
import { available, money } from "../src/lib/types";
test("unreviewed merchandise never enters commercial catalog", () => {
  assert.equal(permitted({ metadata: null }, false), false);
  assert.equal(
    permitted({ metadata: { commerce_approved: true } }, false),
    false,
  );
  assert.equal(
    permitted(
      {
        metadata: {
          commerce_approved: true,
          identity_verified: true,
          sale_permitted: true,
          stryde_media: {
            approved: true,
            images: [
              {
                source: "stockx",
                license_status: "owner_attested",
                match_status: "owner_confirmed",
              },
            ],
          },
        },
      },
      false,
    ),
    true,
  );
});
test("approved owned concept media can back a saleable product", () => {
  const concept = {
    metadata: {
      commerce_approved: true,
      identity_verified: true,
      sale_permitted: true,
      stryde_media: {
        approved: true,
        images: [
          {
            source: "concept",
            license_status: "owned",
          },
        ],
      },
    },
  };
  assert.equal(permitted(concept, false), true);
  // A concept record claiming an unearned stockx provenance stays blocked.
  assert.equal(
    permitted(
      {
        metadata: {
          ...concept.metadata,
          stryde_media: {
            approved: true,
            images: [
              { source: "stockx", license_status: "owned" },
            ],
          },
        },
      },
      false,
    ),
    false,
  );
});
test("archive references sell in the test store but never in production", () => {
  const archive = {
    metadata: {
      commerce_approved: true,
      identity_verified: true,
      sale_permitted: true,
      stryde_media: {
        approved: true,
        images: [
          {
            source: "stockx",
            license_status: "archive_reference",
            match_status: "archive_reference",
          },
        ],
      },
    },
  };
  assert.equal(permitted(archive, true), true);
  assert.equal(permitted(archive, false), false);
});
test("fixtures are allowed only in explicit development mode", () => {
  assert.equal(
    permitted({ metadata: { development_fixture: true } }, false),
    false,
  );
  assert.equal(
    permitted({ metadata: { development_fixture: true } }, true),
    true,
  );
  assert.equal(liveCheckoutEnabled(), false);
});
test("mutations reject cross-site requests and non-JSON", () => {
  process.env.SITE_URL = "http://localhost:3000";
  assert.throws(
    () =>
      guardMutation(
        new Request("http://localhost:3000/api/cart", {
          method: "POST",
          headers: {
            origin: "https://attacker.example",
            "content-type": "application/json",
          },
        }),
      ),
    (error: unknown) => error instanceof RequestError && error.status === 403,
  );
  assert.throws(
    () =>
      guardMutation(
        new Request("http://localhost:3000/api/cart", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            "content-type": "text/plain",
          },
        }),
      ),
    (error: unknown) => error instanceof RequestError && error.status === 415,
  );
});
test("oversized bodies are canceled before JSON parsing", async () => {
  const request = new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    body: "x".repeat(17000),
  });
  await assert.rejects(
    body(request, addressSchema),
    (error: unknown) => error instanceof RequestError && error.status === 413,
  );
});
test("strict address schema rejects extra price fields", () => {
  assert.equal(
    addressSchema.safeParse({
      first_name: "Test",
      last_name: "User",
      address_1: "123 Test Street",
      city: "Tbilisi",
      postal_code: "0100",
      country_code: "ge",
      price: 0,
    }).success,
    false,
  );
});
test("stock and Medusa amounts use backend units without cents conversion", () => {
  assert.equal(
    available({
      id: "variant_test",
      title: "42",
      options: [],
      manage_inventory: true,
      allow_backorder: false,
      inventory_quantity: 0,
    }),
    false,
  );
  assert.equal(money(100, "usd"), "$100.00");
});
