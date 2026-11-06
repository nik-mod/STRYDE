import { NextResponse } from "next/server";
import { z } from "zod";
import { bankCheckoutEnabled, checkoutRedirect } from "@/lib/hosted-payment";
import { body, guardMutation, RequestError } from "@/lib/security";
import { readSession } from "@/lib/session";
import { CommerceError, getCart, product } from "@/lib/medusa";
import { permitted } from "@/lib/policy";

const schema = z.object({ action: z.enum(["options", "start", "status"]), provider_id: z.enum(["pp_tbc_tbc", "pp_bog_bog"]).optional() }).strict();
export async function POST(request: Request) {
  try {
    guardMutation(request);
    if (!bankCheckoutEnabled()) return NextResponse.json({ enabled: false, providers: [], state: "not_started", message: "Bank checkout is not available yet." });
    const value = await body(request, schema), cartId = await readSession();
    if (!cartId) throw new RequestError("Your bag is unavailable. Return to the collection to start again.", 404);
    const cart = await getCart(cartId);
    if (value.action === "start") {
      if (!cart.items.length || !cart.email || !cart.shipping_address || !cart.shipping_methods?.length) throw new RequestError("Complete your delivery details before choosing payment.", 409);
      for (const line of cart.items) {
        const item = await product(line.product_handle);
        if (!item || (!permitted(item) && item.metadata?.development_fixture !== true)) throw new RequestError("A pair in your bag is unavailable for checkout.", 409);
      }
    }
    const origin = process.env.MEDUSA_BACKEND_URL, key = process.env.MEDUSA_PUBLISHABLE_KEY, bridge = process.env.PAYMENT_BRIDGE_SECRET;
    if (!origin || !key || !bridge || bridge.length < 32) throw new RequestError("Bank checkout is not configured yet.", 503);
    const response = await fetch(`${origin}/store/stryde/payments`, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(60000),
      headers: { "Content-Type": "application/json", "x-publishable-api-key": key, "x-stryde-payment-bridge": bridge }, body: JSON.stringify({ ...value, cart_id: cartId }) });
    const result = await response.json();
    if (value.action === "start" && result.redirect_url) result.redirect_url = checkoutRedirect(result.redirect_url, value.provider_id!);
    return NextResponse.json({ ...result, enabled: true, ...(value.action === "options" ? { total: cart.total, currency_code: cart.currency_code } : {}) }, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const known = error instanceof RequestError || error instanceof CommerceError;
    return NextResponse.json({ state: "review", message: known ? error.message : "Payment verification is unavailable. Do not pay again until its status is checked." }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } });
  }
}
