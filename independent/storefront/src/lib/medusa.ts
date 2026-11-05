import "server-only";
import type { Cart, Product, ShippingOption } from "./types";
import { permitted } from "./policy";
export class CommerceError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
// The hosted database is far away, so read-heavy catalog endpoints use a
// short-lived process cache. Anything request-specific — carts, checkout,
// customer data — is always fetched fresh.
interface CacheEntry {
  expires: number;
  data: unknown;
}
const readCache = new Map<string, CacheEntry>();
const READ_CACHE_TTL = 300_000;
let lastConnectionWarning = 0;
export async function medusa<T>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
  token?: string | null,
  cacheTtlMs = 0,
): Promise<T> {
  const origin = process.env.MEDUSA_BACKEND_URL;
  const key = process.env.MEDUSA_PUBLISHABLE_KEY;
  if (!origin || !key)
    throw new CommerceError(
      "The catalog is being prepared. Please check back soon.",
    );
  const cacheKey = `${key.slice(0, 12)}${path}`;
  if (
    cacheTtlMs > 0 &&
    method === "GET" &&
    !token &&
    readCache.has(cacheKey)
  ) {
    const entry = readCache.get(cacheKey)!;
    if (entry.expires > Date.now()) return entry.data as T;
    readCache.delete(cacheKey);
  }
  try {
    // Auth endpoints live at the API root, not under /store.
    const url = path.startsWith("/auth")
      ? `${origin}${path}`
      : `${origin}/store${path}`;
    const response = await fetch(url, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
      headers: {
        "x-publishable-api-key": key,
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      console.error(
        JSON.stringify({
          event: "commerce.request.failed",
          path: path.split("?")[0],
          status: response.status,
        }),
      );
      throw new CommerceError(
        response.status === 400 || response.status === 409
          ? "This selection is unavailable. Refresh your bag and try again."
          : "Commerce is temporarily unavailable. Please try again.",
        response.status >= 500 ? 503 : response.status,
      );
    }
    const data = (await response.json()) as T;
    if (cacheTtlMs > 0 && method === "GET" && !token)
      readCache.set(cacheKey, { expires: Date.now() + cacheTtlMs, data });
    return data;
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    // A recoverable service outage is rendered as an unavailable state by the
    // caller. Keep a bounded operational warning without a development overlay
    // for every request; unexpected HTTP failures above still log as errors.
    if (Date.now() - lastConnectionWarning > 60000) {
      lastConnectionWarning = Date.now();
      console.warn(JSON.stringify({ event: "commerce.connection.failed", error: error instanceof Error ? error.name : "unknown" }));
    }
    throw new CommerceError(
      "Commerce is temporarily unavailable. Please try again.",
    );
  }
}
const fields =
  "*variants.calculated_price,+variants.inventory_quantity,*images,*options.values,*variants.options,*collection,*categories,+metadata";
export const CATALOG_PAGE_SIZE = 12;
// Handle → id lookups are cached for the process; handles are stable.
const idCache = new Map<string, string | null>();
async function idForHandle(
  kind: "collection" | "product_category",
  handle: string,
): Promise<string | undefined> {
  const cacheKey = `${kind}:${handle}`;
  if (idCache.has(cacheKey)) return idCache.get(cacheKey) ?? undefined;
  const result = await medusa<{ [k: string]: { id: string; handle: string }[] }>(
    `/${kind === "collection" ? "collections" : "product-categories"}?handle=${encodeURIComponent(handle)}&limit=1`,
    undefined,
    "GET",
    undefined,
    READ_CACHE_TTL,
  );
  const list = result[kind === "collection" ? "collections" : "product_categories"] ?? [];
  const id = list[0]?.id;
  idCache.set(cacheKey, id ?? null);
  return id;
}
export type CatalogFacet = { id: string; handle: string; title?: string; name?: string };
export type CatalogPage = {
  products: Product[];
  // Products matching all filters (paginated source of the grid).
  count: number;
  // Whole-catalog size for the masthead.
  total: number;
  collections: CatalogFacet[];
  categories: CatalogFacet[];
  featured: Product[];
};
export async function catalogPage(options: {
  query?: string;
  collection?: string;
  category?: string;
  page?: number;
}): Promise<CatalogPage> {
  const region = process.env.MEDUSA_REGION_ID;
  if (!region)
    throw new CommerceError(
      "The catalog is being prepared. Please check back soon.",
    );
  const [collectionId, categoryId] = await Promise.all([
    options.collection ? idForHandle("collection", options.collection) : undefined,
    options.category ? idForHandle("product_category", options.category) : undefined,
  ]);
  const page = Math.max(1, options.page || 1);
  const listParams = new URLSearchParams({
    fields,
    region_id: region,
    limit: String(CATALOG_PAGE_SIZE),
    offset: String((page - 1) * CATALOG_PAGE_SIZE),
    order: "title",
  });
  if (options.query) listParams.set("q", options.query.slice(0, 100));
  if (collectionId) listParams.append("collection_id", collectionId);
  if (categoryId) listParams.append("category_id", categoryId);
  // Medusa orders by title server-side; the store's uniform $140 pricing makes
  // a server price order a no-op, so the sort control maps onto title order.
  const totalParams = new URLSearchParams({ limit: "1", region_id: region });
  if (options.query) totalParams.set("q", options.query.slice(0, 100));
  const [listResult, totalResult, featuredResult, collectionList, categoryList] =
    await Promise.all([
      medusa<{ products: Product[]; count: number }>(
        `/products?${listParams}`,
        undefined,
        "GET",
        undefined,
        READ_CACHE_TTL,
      ),
      medusa<{ count: number }>(`/products?${totalParams}`, undefined, "GET", undefined, READ_CACHE_TTL),
      medusa<{ products: Product[] }>(
        `/products?${new URLSearchParams({
          fields,
          region_id: region,
          limit: "2",
          order: "title",
        })}`,
        undefined,
        "GET",
        undefined,
        READ_CACHE_TTL,
      ),
      medusa<{ collections: CatalogFacet[] }>("/collections?limit=100", undefined, "GET", undefined, READ_CACHE_TTL),
      medusa<{ product_categories: CatalogFacet[] }>(
        "/product-categories?limit=100",
        undefined,
        "GET",
        undefined,
        READ_CACHE_TTL,
      ),
    ]);
  const products = listResult.products.filter((p) => permitted(p));
  return {
    products,
    count: listResult.count,
    total: totalResult.count,
    collections: collectionList.collections.filter((c) => !!c.handle),
    categories: categoryList.product_categories.filter((c) => !!c.handle),
    featured: featuredResult.products.filter((p) => permitted(p)),
  };
}
export async function relatedProducts(
  product: Pick<Product, "id" | "collection">,
): Promise<Product[]> {
  if (!product.collection) return [];
  const region = process.env.MEDUSA_REGION_ID;
  if (!region) return [];
  const params = new URLSearchParams({
    fields,
    region_id: region,
    limit: "4",
    order: "title",
  });
  params.append("collection_id", product.collection.id);
  const result = await medusa<{ products: Product[] }>(
    `/products?${params}`,
    undefined,
    "GET",
    undefined,
    READ_CACHE_TTL,
  );
  return result.products.filter((p) => permitted(p) && p.id !== product.id).slice(0, 3);
}
export async function product(handle: string) {
  if (!process.env.MEDUSA_REGION_ID)
    throw new CommerceError(
      "The catalog is being prepared. Please check back soon.",
    );
  const params = new URLSearchParams({
    handle,
    fields,
    region_id: process.env.MEDUSA_REGION_ID,
  });
  const result = await medusa<{ products: Product[] }>(
    `/products?${params}`,
    undefined,
    "GET",
    undefined,
    READ_CACHE_TTL,
  );
  return result.products.find((p) => permitted(p)) ?? null;
}
export const getCart = async (id: string) =>
  (
    await medusa<{ cart: Cart }>(
      `/carts/${id}?fields=+items.product.metadata,+promotions.code`,
    )
  ).cart;
export const shippingOptions = async (id: string) =>
  (
    await medusa<{ shipping_options: ShippingOption[] }>(
      `/shipping-options?cart_id=${encodeURIComponent(id)}`,
    )
  ).shipping_options;
