import { z } from "zod";
import { NextResponse } from "next/server";
import { medusa, getCart, CommerceError } from "@/lib/medusa";
import { readSession, writeSession } from "@/lib/session";
import { customerToken } from "@/lib/customer";
import { body, guardMutation, idSchema, RequestError } from "@/lib/security";
import { permitted } from "@/lib/policy";
import type { Cart, Product } from "@/lib/types";
const input = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("add"),
      variant_id: idSchema,
      quantity: z.number().int().min(1).max(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("update"),
      line_id: idSchema,
      quantity: z.number().int().min(0).max(20),
    })
    .strict(),
  z
    .object({
      action: z.literal("promo"),
      code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
    })
    .strict(),
  z
    .object({
      action: z.literal("promo-remove"),
      code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
    })
    .strict(),
]);
export async function GET() {
  try {
    const id = await readSession();
    return NextResponse.json({ cart: id ? await getCart(id) : null });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    let id = await readSession();
    // With a signed-in customer, Medusa attaches the cart (and later the
    // order) to the customer so order history works.
    const token = await customerToken();
    if (value.action === "add") {
      const params = new URLSearchParams({
        "variants[id]": value.variant_id,
        fields: "+metadata",
        limit: "1",
      });
      const result = await medusa<{ products: Product[] }>(
        `/products?${params}`,
      );
      if (!result.products[0] || !permitted(result.products[0]))
        throw new RequestError("This product is not available for sale.", 403);
      if (id) {
        // A session can outlive its cart (expired backend cart, database
        // switch). Detect a dead cart once and start fresh transparently.
        const existing = await getCart(id).catch(() => null);
        if (!existing) {
          await writeSession("");
          id = null;
        }
      }
      if (!id) {
        const created = await medusa<{ cart: Cart }>(
          "/carts",
          { region_id: process.env.MEDUSA_REGION_ID },
          "POST",
          token,
        );
        id = created.cart.id;
        await writeSession(id);
      }
      // Medusa determines all prices and checks available inventory.
      const resultCart = await medusa<{ cart: Cart }>(
        `/carts/${id}/line-items`,
        { variant_id: value.variant_id, quantity: value.quantity },
        "POST",
        token,
      );
      return NextResponse.json(resultCart);
    }
    if (!id)
      throw new RequestError(
        "Your bag has expired. Please add your items again.",
        404,
      );
    if (value.action === "promo" || value.action === "promo-remove") {
      try {
        await medusa(
          `/carts/${id}/promotions`,
          { promo_codes: [value.code.toUpperCase()] },
          value.action === "promo" ? "POST" : "DELETE",
        );
      } catch {
        throw new RequestError(
          value.action === "promo"
            ? "That promo code is not valid."
            : "That promo code was not applied to your bag.",
          400,
        );
      }
      return NextResponse.json({ cart: await getCart(id) });
    }
    const cart = await getCart(id);
    if (!cart.items.some((line) => line.id === value.line_id))
      throw new RequestError("This item is not in your bag.", 404);
    if (value.quantity === 0)
      await medusa(
        `/carts/${id}/line-items/${value.line_id}`,
        undefined,
        "DELETE",
      );
    else
      await medusa(`/carts/${id}/line-items/${value.line_id}`, {
        quantity: value.quantity,
      });
    return NextResponse.json({ cart: await getCart(id) });
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  const known = error instanceof CommerceError || error instanceof RequestError;
  if (!known)
    console.error(
      JSON.stringify({
        event: "cart.failed",
        error: error instanceof Error ? error.name : "unknown",
      }),
    );
  return NextResponse.json(
    {
      message: known
        ? error.message
        : "Your bag could not be updated. Please try again.",
    },
    { status: known ? error.status : 500 },
  );
}
