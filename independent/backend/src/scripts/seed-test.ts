import type { ExecArgs } from "@medusajs/framework/types";
import {
  Modules,
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  createCollectionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export default async function seed({ container }: ExecArgs) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.STRYDE_TEST_MODE !== "true"
  )
    throw new Error(
      "Test fixtures cannot be seeded outside explicit development mode.",
    );
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const storeService = container.resolve(Modules.STORE);
  const fulfillment = container.resolve(Modules.FULFILLMENT);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const channelService = container.resolve(Modules.SALES_CHANNEL);
  let [channel] = await channelService.listSalesChannels({
    name: "STRYDE development only",
  });
  if (!channel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "STRYDE development only" }] },
    });
    channel = result[0];
  }
  const [store] = await storeService.listStores();
  await storeService.updateStores(store.id, {
    supported_currencies: [{ currency_code: "usd", is_default: true }],
  });
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: channel.id },
    },
  });
  const regionService = container.resolve(Modules.REGION);
  let [region] = await regionService.listRegions({ name: "TEST — Georgia" });
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "TEST — Georgia",
            currency_code: "usd",
            countries: ["ge"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = result[0];
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "ge", provider_id: "tp_system" }],
    });
  }
  const stock = container.resolve(Modules.STOCK_LOCATION);
  let [location] = await stock.listStockLocations({
    name: "TEST — virtual stock, not saleable inventory",
  });
  let profile = (
    await fulfillment.listShippingProfiles({ type: "default" })
  )[0];
  if (!profile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Development footwear", type: "default" }] },
    });
    profile = result[0];
  }
  if (!location) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "TEST — virtual stock, not saleable inventory",
            address: {
              city: "Test city",
              country_code: "GE",
              address_1: "Development fixture",
            },
          },
        ],
      },
    });
    location = result[0];
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: { default_location_id: location.id },
      },
    });
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });
    const set = await fulfillment.createFulfillmentSets({
      name: "TEST shipping only",
      type: "shipping",
      service_zones: [
        {
          name: "TEST Georgia",
          geo_zones: [{ country_code: "ge", type: "country" }],
        },
      ],
    });
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: set.id },
    });
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "TEST delivery — no shipment",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: set.service_zones[0].id,
          shipping_profile_id: profile.id,
          type: {
            label: "Test",
            description: "Development only. No delivery commitment.",
            code: "test",
          },
          prices: [
            { currency_code: "usd", amount: 5 },
            { region_id: region.id, amount: 5 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    });
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: location.id, add: [channel.id] },
    });
  }
  let { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { type: "publishable", title: "STRYDE development storefront" },
  });
  let key: { id: string; token: string } | undefined = keys[0];
  if (!key) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "STRYDE development storefront",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });
    key = result[0];
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: key.id, add: [channel.id] },
    });
  }
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: "development-footwear-01" },
  });
  if (!existing.length) {
    const { result: cats } = await createProductCategoriesWorkflow(
      container,
    ).run({
      input: {
        product_categories: [
          {
            name: "Development footwear",
            handle: "development-footwear",
            is_active: true,
          },
        ],
      },
    });
    const { result: collections } = await createCollectionsWorkflow(
      container,
    ).run({
      input: {
        collections: [
          { title: "Development collection", handle: "development" },
        ],
      },
    });
    const products = Array.from({ length: 14 }, (_, index) => ({
      title: `TEST / Footwear ${String(index + 1).padStart(2, "0")}`,
      handle: `development-footwear-${String(index + 1).padStart(2, "0")}`,
      description:
        "Development fixture for testing independent commerce. This is not real merchandise, pricing or stock. No authenticity or brand partnership is claimed.",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: profile.id,
      collection_id: collections[0].id,
      category_ids: [cats[0].id],
      metadata: {
        development_fixture: true,
        commerce_approved: false,
        identity_verified: false,
        sale_permitted: false,
      },
      thumbnail: "/assets/concept-shoe.svg",
      images: [
        { url: "/assets/concept-shoe.svg" },
        { url: "/assets/concept-shoe-side.svg" },
      ],
      options: [{ title: "EU size", values: ["40", "41", "42"] }],
      variants: ["40", "41", "42"].map((size, i) => ({
        title: size,
        sku: `TEST-${index + 1}-${size}`,
        options: { "EU size": size },
        manage_inventory: true,
        allow_backorder: false,
        prices: [{ currency_code: "usd", amount: 100 + index * 5 + i }],
      })),
      sales_channels: [{ id: channel.id }],
    }));
    // Concept imagery belongs to the existing design assets. Never turn unverified
    // branded reference photographs into a saleable catalog.
    for (const p of products) {
      p.thumbnail = "/assets/stryde-concept-side-v1.webp";
      p.images = [
        { url: "/assets/stryde-concept-side-v1.webp" },
        { url: "/assets/stryde-concept-rear-v1.webp" },
        { url: "/assets/stryde-concept-detail-v1.webp" },
      ];
    }
    await createProductsWorkflow(container).run({ input: { products } });
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "title", "inventory_items.inventory_item_id"],
      filters: { sku: products.flatMap((p) => p.variants.map((v) => v.sku)) },
    });
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: variants.flatMap((v: any) =>
          v.inventory_items.map((item: any) => ({
            inventory_item_id: item.inventory_item_id,
            location_id: location.id,
            stocked_quantity: v.title === "42" ? 0 : 5,
          })),
        ),
      },
    });
  }
  const frontend = resolve(process.cwd(), "../storefront/.env.local");
  let env = await readFile(frontend, "utf8");
  env = env
    .replace(
      /^MEDUSA_PUBLISHABLE_KEY=.*$/m,
      `MEDUSA_PUBLISHABLE_KEY=${key.token}`,
    )
    .replace(/^MEDUSA_REGION_ID=.*$/m, `MEDUSA_REGION_ID=${region.id}`);
  await writeFile(frontend, env);
  logger.info(
    "Development fixtures are ready in PostgreSQL. Frontend configuration updated. No real products or payments.",
  );
}
