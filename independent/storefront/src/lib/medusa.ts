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
export async function medusa<T>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
): Promise<T> {
  const origin = process.env.MEDUSA_BACKEND_URL;
  const key = process.env.MEDUSA_PUBLISHABLE_KEY;
  if (!origin || !key)
    throw new CommerceError(
      "The catalog is being prepared. Please check back soon.",
    );
  try {
    const response = await fetch(`${origin}/store${path}`, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        "x-publishable-api-key": key,
        "Content-Type": "application/json",
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
    return await response.json();
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    console.error(
      JSON.stringify({
        event: "commerce.connection.failed",
        error: error instanceof Error ? error.name : "unknown",
      }),
    );
    throw new CommerceError(
      "Commerce is temporarily unavailable. Please try again.",
    );
  }
}
const fields =
  "*variants.calculated_price,+variants.inventory_quantity,*images,*options.values,*variants.options,*collection,*categories,+metadata";
export async function catalog(query = "") {
  const region = process.env.MEDUSA_REGION_ID;
  if (!region)
    throw new CommerceError(
      "The catalog is being prepared. Please check back soon.",
    );
  const products: Product[] = [];
  // Backend search + server-side price sorting. The catalog is small; no client fixture catalog.
  // Move sorting to a dedicated search index when the commercial catalog grows.
  for (let offset = 0; ; offset += 100) {
    if (offset >= 10000)
      throw new CommerceError(
        "The catalog needs a search index before it can be displayed.",
      );
    const params = new URLSearchParams({
      fields,
      region_id: region,
      limit: "100",
      offset: String(offset),
      ...(query ? { q: query.slice(0, 100) } : {}),
    });
    const result = await medusa<{ products: Product[]; count: number }>(
      `/products?${params}`,
    );
    products.push(...result.products.filter((p) => permitted(p)));
    if (offset + 100 >= result.count) break;
  }
  return products;
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
  const result = await medusa<{ products: Product[] }>(`/products?${params}`);
  return result.products.find((p) => permitted(p)) ?? null;
}
export const getCart = async (id: string) =>
  (
    await medusa<{ cart: Cart }>(
      `/carts/${id}?fields=%2Bitems.product.metadata`,
    )
  ).cart;
export const shippingOptions = async (id: string) =>
  (
    await medusa<{ shipping_options: ShippingOption[] }>(
      `/shipping-options?cart_id=${encodeURIComponent(id)}`,
    )
  ).shipping_options;
