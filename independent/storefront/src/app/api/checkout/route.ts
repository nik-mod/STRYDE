import { z } from "zod";
import { NextResponse } from "next/server";
import {
  medusa,
  getCart,
  product,
  shippingOptions,
  CommerceError,
} from "@/lib/medusa";
import { readSession, cookieName } from "@/lib/session";
import {
  body,
  guardMutation,
  addressSchema,
  idSchema,
  RequestError,
} from "@/lib/security";
import { isTestMode } from "@/lib/policy";
import { paymentAdapter } from "@/lib/payments";
import type { Cart } from "@/lib/types";
const input = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("address"),
      email: z.email().max(254),
      address: addressSchema,
    })
    .strict(),
  z.object({ action: z.literal("shipping"), option_id: idSchema }).strict(),
  z.object({ action: z.literal("complete-test") }).strict(),
]);
export async function GET() {
  try {
    const id = await readSession();
    const cart = id ? await getCart(id) : null;
    return NextResponse.json({
      cart,
      shipping_options: cart?.shipping_address
        ? await shippingOptions(cart.id)
        : [],
      test_mode: isTestMode(),
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    guardMutation(request);
    if (!isTestMode())
      throw new RequestError(
        "Live checkout is unavailable pending payment-provider approval.",
        403,
      );
    const value = await body(request, input);
    const id = await readSession();
    if (!id) throw new RequestError("Your bag has expired.", 404);
    let cart = await getCart(id);
    if (!cart.items.length) throw new RequestError("Your bag is empty.");
    // Re-read each product at checkout. The development provider accepts only
    // explicit fixtures; it can never create a commercial order without payment.
    for (const line of cart.items) {
      const item = await product(line.product_handle);
      if (item?.metadata?.development_fixture !== true)
        throw new RequestError(
          "Only development fixtures can use test checkout.",
          403,
        );
    }
    if (value.action === "address") {
      const region = await medusa<{
        region: { countries: { iso_2: string }[] };
      }>(`/regions/${cart.region_id}`);
      if (
        !region.region.countries.some(
          (c) => c.iso_2 === value.address.country_code,
        )
      )
        throw new RequestError("Shipping is not available for this country.");
      const updated = await medusa<{ cart: Cart }>(`/carts/${id}`, {
        email: value.email,
        shipping_address: value.address,
        billing_address: value.address,
      });
      return NextResponse.json({
        cart: updated.cart,
        shipping_options: await shippingOptions(id),
      });
    }
    if (value.action === "shipping") {
      const options = await shippingOptions(id);
      if (!options.some((o) => o.id === value.option_id))
        throw new RequestError("That shipping option is unavailable.");
      const updated = await medusa<{ cart: Cart }>(
        `/carts/${id}/shipping-methods`,
        { option_id: value.option_id },
      );
      return NextResponse.json({ cart: updated.cart });
    }
    if (!cart.email || !cart.shipping_address || !cart.shipping_methods?.length)
      throw new RequestError(
        "Complete your address and shipping selection first.",
      );
    await paymentAdapter().initialize(cart);
    // Medusa's cart completion workflow owns inventory reservation, transaction
    // state and repeat-completion protection. No total is accepted from the client.
    const result = await medusa<{
      type: string;
      order?: {
        id: string;
        display_id: number;
        total: number;
        currency_code: string;
      };
      error?: unknown;
    }>(`/carts/${id}/complete`, {});
    if (result.type !== "order" || !result.order)
      throw new RequestError(
        "The test order could not be completed. Refresh the bag and try again.",
        409,
      );
    // Do not expose a general order lookup by ID. Confirmation belongs only to
    // the signed cart session that just completed this order.
    const response = NextResponse.json({
      test_order: {
        reference: result.order.display_id,
        total: result.order.total,
        currency_code: result.order.currency_code,
      },
      message:
        "Test order created. No real payment or shipment. Email is not configured.",
    });
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  const known = error instanceof CommerceError || error instanceof RequestError;
  if (!known)
    console.error(
      JSON.stringify({
        event: "checkout.failed",
        error: error instanceof Error ? error.name : "unknown",
      }),
    );
  return NextResponse.json(
    { message: known ? error.message : "Checkout is temporarily unavailable." },
    { status: known ? error.status : 500 },
  );
}
