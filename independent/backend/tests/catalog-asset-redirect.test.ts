import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogAssetRedirect } from "../src/lib/catalog-asset-redirect";
test("admin resolves catalog photographs through the configured storefront", () => {
  assert.equal(catalogAssetRedirect("/assets/stockx-archive/shoe-hq.webp", "https://stryde.example"), "https://stryde.example/assets/stockx-archive/shoe-hq.webp");
  for (const path of ["/assets/stockx-edit/../../.env", "/assets/stockx-edit/%2e%2e.env", "//external.example/a.png", "/assets/other/private.png"]) assert.equal(catalogAssetRedirect(path, "https://stryde.example"), null);
  assert.equal(catalogAssetRedirect("/assets/stockx-edit/shoe.webp", "javascript:alert(1)"), null);
});
