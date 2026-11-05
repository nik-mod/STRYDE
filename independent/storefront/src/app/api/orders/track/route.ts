import { z } from "zod";
import { NextResponse } from "next/server";
import { medusa, CommerceError } from "@/lib/medusa";
import { customerToken } from "@/lib/customer";
import { body, guardMutation, RequestError } from "@/lib/security";
const input = z
  .object({
    display_id: z.coerce.number().int().min(1).max(10_000_000),
    email: z.email().max(254),
  })
  .strict();
interface TrackResult {
  order: {
    display_id: number;
    status: string;
    created_at: string;
    currency_code: string;
    total: number;
    subtotal: number;
    shipping_total: number;
    tax_total: number;
    items: {
      title: string;
      quantity: number;
      unit_price: number;
      thumbnail: string | null;
    }[];
  };
}
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const token = await customerToken();
    if (!token) throw new RequestError("Sign in to the account that placed this order.", 401);
    const value = await body(request, input);
    const result = await medusa<TrackResult>("/stryde/order-track", {
      display_id: value.display_id,
      email: value.email,
    }, "POST", token);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const known = error instanceof RequestError || error instanceof CommerceError;
    return NextResponse.json(
      {
        message: error instanceof CommerceError && error.status === 404 ? "No order matches those details in your account. Check the number and checkout email." : error instanceof CommerceError && error.status === 401 ? "Sign in again to look up your order." : error instanceof CommerceError && error.status === 429 ? "Too many lookups. Wait a minute and try again." : known
          ? (error as RequestError).message
          : "Order tracking is temporarily unavailable.",
      },
      { status: known ? (error as RequestError).status : 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
