import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  backend = resolve(root, "backend");
const require = createRequire(resolve(backend, "package.json"));
const sharp = require("sharp");
const recordPath = resolve(root, ".data/product-management-qa.json");
function cli(script, env = {}) {
  const result = spawnSync(
    process.execPath,
    [resolve(backend, "node_modules/@medusajs/cli/cli.js"), "exec", script],
    {
      cwd: backend,
      env: { ...process.env, ...env },
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}
if (process.argv.includes("--cleanup")) {
  cli("./src/scripts/qa-media-fixture.ts", { STRYDE_QA_CLEANUP: "true" });
  console.log("QA cleanup passed.");
  process.exit(0);
}
const email = `qa-${Date.now()}@stryde.invalid`,
  password = randomBytes(32).toString("base64url");
await mkdir(resolve(root, ".data"), { recursive: true });
await writeFile(recordPath, JSON.stringify({ email, password }));
cli("./src/scripts/setup-owner.ts", {
  STRYDE_ADMIN_EMAIL: email,
  STRYDE_ADMIN_PASSWORD: password,
  STRYDE_QA_ADMIN: "true",
});
const origin = "http://127.0.0.1:9000";
let token;
async function api(path, body, expected = 200, method = body ? "POST" : "GET") {
  const r = await fetch(origin + path, {
    method,
    headers: {
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" }),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  assert.equal(r.status, expected, `${path}: ${JSON.stringify(data)}`);
  return data;
}
token = (await api("/auth/user/emailpass", { email, password })).token;
const [profile] = (await api("/admin/shipping-profiles")).shipping_profiles;
const channel = (await api("/admin/sales-channels")).sales_channels.find(c=>c.name==='STRYDE development only');
assert.ok(channel,'Run the development commerce seed before this QA check.');
const [location] = (await api("/admin/stock-locations")).stock_locations;
const { product } = await api("/admin/products", {
  title: "QA / Product management technical fixture",
  handle: `qa-media-${Date.now()}`,
  description:
    "Technical delivery test, not merchandise or a product photograph.",
  status: "draft",
  shipping_profile_id: profile.id,
  sales_channels: [{ id: channel.id }],
  metadata: { development_fixture: true, stryde_qa: true },
  options: [
    { title: "Size", values: ["40", "41"] },
    { title: "Color", values: ["Blue"] },
  ],
  variants: ["40", "41"].map((size) => ({
    title: `Blue / ${size}`,
    sku: `QA-${Date.now()}-${size}`,
    manage_inventory: true,
    options: { Size: size, Color: "Blue" },
    prices: [{ currency_code: "usd", amount: 123 }],
  })),
});
await mkdir(resolve(root, ".data"), { recursive: true });
await writeFile(
  recordPath,
  JSON.stringify({
    email,
    password,
    product_id: product.id,
    handle: product.handle,
  }),
);
const id = product.id,
  endpoint = `/admin/stryde/products/${id}/media`;
const variant = (
  await api(`/admin/products/${id}?fields=*variants.inventory_items`)
).product.variants[0];
const inventory = variant.inventory_items[0].inventory_item_id;
await api(`/admin/inventory-items/${inventory}/location-levels`, {
  location_id: location.id,
  stocked_quantity: 4,
});
await api(`/admin/products/${id}`, {
  title: "QA / Product management technical fixture — edited",
});
await api(`/admin/products/${id}/variants/${variant.id}`, {
  prices: [{ currency_code: "usd", amount: 124 }],
});
await api(endpoint, {
  action: "identity",
  identity: {
    brand: "Technical QA fixture",
    model: "No sneaker photograph",
    style_code: "QA-ONLY",
    colorway: "Neutral test chart",
    stockx_product_id: "not-a-stockx-product",
    stockx_url: "https://stockx.com/",
  },
});
for (const background of ["#ffffff", "#eeeeee"]) {
  const buffer = await sharp({
    create: { width: 1200, height: 800, channels: 3, background },
  })
    .png()
    .toBuffer();
  await api(endpoint, {
    action: "upload",
    source: "technical_test",
    content: buffer.toString("base64"),
    source_url: "https://stockx.com/",
    license_reference:
      "Technical test data only; no StockX license or image is claimed",
    attribution: "Technical QA image — not a sneaker photograph",
    rights_confirmed: true,
    exact_match_confirmed: true,
    markings_preserved: true,
    studio_background_confirmed: true,
    optimize_permitted: true,
  });
}
const state = await api(endpoint);
const ids = state.records.map((r) => r.id).reverse();
await api(endpoint, {
  action: "save",
  ids,
  identity_verified: false,
  sale_permitted: false,
  visible: false,
  publish: false,
});
assert.equal(
  (await api(`/admin/products/${id}`)).product.thumbnail,
  state.records[1].url,
);
await api(
  endpoint,
  {
    action: "save",
    ids,
    identity_verified: true,
    sale_permitted: true,
    visible: true,
    publish: true,
  },
  400,
);
await api(`/admin/products/${id}`, { status: "published" }, 400);
await api("/admin/stryde/stockx?q=QA-ONLY", undefined, 424);
const noAuth = await fetch(origin + endpoint);
assert.equal(noAuth.status, 401);
const [first] = state.records;
const media = await fetch(first.url);
assert.equal(media.status, 200);
assert.ok(media.headers.get("content-type").startsWith("image/"));
await api(endpoint, { action: "remove", id: first.id });
assert.equal((await api(`/admin/products/${id}`)).product.images.length, 1);
cli("./src/scripts/qa-media-fixture.ts");
await mkdir(resolve(root, "evidence"), { recursive: true });
await writeFile(
  resolve(root, "evidence/product-management-api.json"),
  JSON.stringify(
    {
      administratorCreatedAndAuthenticated: true,
      nativeProductCreateEdit: true,
      sizesColorsPricesInventory: true,
      technicalMediaUpload: true,
      galleryOrder: true,
      removeImage: true,
      unauthorizedStatus: noAuth.status,
      commercialPublicationBlocked: true,
      stockxAccessBlocked: true,
      mediaDeliveryStatus: media.status,
      stockxImagesFetched: 0,
    },
    null,
    2,
  ),
);
console.log(
  "Product-management API checks passed. Temporary QA credentials are in ignored .data for browser checks; run this script with --cleanup afterwards.",
);
