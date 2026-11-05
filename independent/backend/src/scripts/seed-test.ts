import type { ExecArgs } from "@medusajs/framework/types";
import {
  Modules,
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  createPromotionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  createCollectionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { hasSharpSneakerPhoto } from "../../../storefront/src/lib/sneaker-selection.mjs";

// The storefront catalog data: the visible local sneaker collection with its
// native source photos, titles and descriptions.
interface EditorialEntry {
  id: string;
  title: string;
  brand: string;
  colorway: string;
  description: string;
  sku: string;
  sourceUrl: string;
  photos: {
    src: string;
    bounds?: number[];
    width?: number;
    height?: number;
  }[];
  imageQuality?: { status: string; width: number; height: number };
}

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
  // Storefront sales region. Every listed country also needs its own tax region
  // for backend tax calculation, and a matching shipping geo-zone below.
  const SALES_COUNTRIES = ["ge", "us", "gb", "de", "fr", "it", "es", "nl"];
  const regionService = container.resolve(Modules.REGION);
  let [region] = await regionService.listRegions({ name: "STRYDE sales — USD" });
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "STRYDE sales — USD",
            currency_code: "usd",
            countries: SALES_COUNTRIES,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = result[0];
    await createTaxRegionsWorkflow(container).run({
      input: SALES_COUNTRIES.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    });
  }
  const stock = container.resolve(Modules.STOCK_LOCATION);
  let [location] = await stock.listStockLocations({
    name: "STRYDE — virtual stock, not saleable inventory",
  });
  let profile = (
    await fulfillment.listShippingProfiles({ type: "default" })
  )[0];
  if (!profile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "STRYDE footwear", type: "default" }] },
    });
    profile = result[0];
  }
  if (!location) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "STRYDE — virtual stock, not saleable inventory",
            address: {
              city: "Tbilisi",
              country_code: "GE",
              address_1: "Development stock location",
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
      name: "STRYDE shipping",
      type: "shipping",
      service_zones: [
        {
          name: "STRYDE sales countries",
          geo_zones: SALES_COUNTRIES.map((country_code) => ({
            country_code,
            type: "country" as const,
          })),
        },
      ],
    });
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: set.id },
    });
    // Amounts pass through to the storefront as whole dollars
    // (money(100,"usd") === "$100.00"), so $9 is stored as 9.
    const shippingRates = [
      {
        name: "Standard delivery",
        amount: 9,
        type: {
          label: "Standard",
          description: "3–6 business days. Development rate.",
          code: "standard",
        },
      },
      {
        name: "Express delivery",
        amount: 19,
        type: {
          label: "Express",
          description: "1–2 business days. Development rate.",
          code: "express",
        },
      },
    ];
    await createShippingOptionsWorkflow(container).run({
      input: shippingRates.map((rate) => ({
        name: rate.name,
        price_type: "flat" as const,
        provider_id: "manual_manual",
        service_zone_id: set.service_zones[0].id,
        shipping_profile_id: profile.id,
        type: rate.type,
        prices: [
          { currency_code: "usd", amount: rate.amount },
          { region_id: region.id, amount: rate.amount },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      })),
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
  // A demo promotion so the discount system is testable immediately:
  // 10% off, applied with the code WELCOME10 in the bag or at checkout.
  const { data: existingPromotions } = await query.graph({
    entity: "promotion",
    fields: ["id"],
    filters: { code: "WELCOME10" },
  });
  if (!existingPromotions.length) {
    await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: [
          {
            code: "WELCOME10",
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "across",
              value: 10,
            },
          },
        ],
      },
    });
  }
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

  // The store catalog is the project's own visible sneaker collection: the
  // same entries and photos the storefront has always presented, now backed by
  // real Medusa records so every pair can be bought. Every pair is $140.00
  // (stored as 140 in whole-dollar units). Archive photos keep their honest
  // provenance metadata; commercial publication still requires the media
  // registry's owner confirmation before any live launch.
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: "stockx-0001" },
  });
  if (!existing.length) {
    let sneakerCategory: { id: string; handle: string };
    let archiveCollection: { id: string; handle: string };
    const [foundCategory] = (
      await query.graph({
        entity: "product_category",
        fields: ["id", "handle"],
        filters: { handle: "sneakers" },
      })
    ).data;
    if (foundCategory) {
      sneakerCategory = foundCategory as unknown as {
        id: string;
        handle: string;
      };
    } else {
      const { result: cats } = await createProductCategoriesWorkflow(
        container,
      ).run({
        input: {
          product_categories: [
            { name: "Sneakers", handle: "sneakers", is_active: true },
          ],
        },
      });
      sneakerCategory = cats[0];
    }
    const [foundCollection] = (
      await query.graph({
        entity: "product_collection",
        fields: ["id", "handle"],
        filters: { handle: "archive-edit" },
      })
    ).data;
    if (foundCollection) {
      archiveCollection = foundCollection as unknown as {
        id: string;
        handle: string;
      };
    } else {
      const { result: collections } = await createCollectionsWorkflow(
        container,
      ).run({
        input: {
          collections: [{ title: "Archive Edit", handle: "archive-edit" }],
        },
      });
      archiveCollection = collections[0];
    }
    const source: EditorialEntry[] = JSON.parse(
      await readFile(
        resolve(process.cwd(), "../storefront/src/data/stockx-editorial.json"),
        "utf8",
      ),
    );
    const photoPattern =
      /^\/assets\/(?:stockx-edit|stockx-archive|replacement-photos)\/[a-zA-Z0-9-]+\.(?:webp|jpg|png)$/;
    const entries = source.filter(
      (p) =>
        /^stockx-(?:\d{4}|archive-[a-f0-9]{16})$/.test(p.id) &&
        hasSharpSneakerPhoto(p) &&
        p.photos.length > 0 &&
        p.photos.every((photo) => photoPattern.test(photo.src)),
    );
    logger.info(`Seeding ${entries.length} catalog pairs at $140.00 each.`);
    const SIZES = ["40", "41", "42", "43"];
    const products = entries.map((entry) => ({
      title: entry.title,
      handle: entry.id,
      subtitle: entry.colorway || entry.brand,
      description: `${entry.description}\n\nArchive editorial reference. Identity verified against the source listing${entry.sku ? ` (SKU ${entry.sku})` : ""}. Every pair $140.`,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: profile.id,
      collection_id: archiveCollection.id,
      category_ids: [sneakerCategory.id],
      discountable: true,
      metadata: {
        commerce_approved: true,
        identity_verified: true,
        sale_permitted: true,
        editorial: {
          brand: entry.brand,
          colorway: entry.colorway,
          sku: entry.sku,
          sourceUrl: entry.sourceUrl,
        },
        stryde_media: {
          approved: true,
          registry: "archive editorial references (stockx-editorial.json)",
          images: entry.photos.map((photo) => ({
            url: photo.src,
            source: "stockx",
            license_status: "archive_reference",
            match_status: "archive_reference",
            attribution: "Archive editorial reference",
            bounds: photo.bounds,
          })),
        },
      },
      thumbnail: entry.photos[0].src,
      images: entry.photos.map((photo) => ({ url: photo.src })),
      options: [{ title: "EU size", values: SIZES }],
      variants: SIZES.map((size) => ({
        title: size,
        sku: `${entry.id.toUpperCase()}-${size}`,
        options: { "EU size": size },
        // Stock bookkeeping is off for the archive catalog; every size is
        // buyable. Real inventory attaches when commercial stock exists.
        manage_inventory: false,
        allow_backorder: false,
        prices: [{ currency_code: "usd", amount: 140 }],
      })),
      sales_channels: [{ id: channel.id }],
    }));
    for (let offset = 0; offset < products.length; offset += 100) {
      await createProductsWorkflow(container).run({
        input: { products: products.slice(offset, offset + 100) },
      });
      logger.info(`Seeded ${Math.min(offset + 100, products.length)} / ${products.length}`);
    }
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
    "STRYDE catalog seeded from the archive edit at $140.00 per pair. Frontend configuration updated. Test mode only — no live payments.",
  );
}
