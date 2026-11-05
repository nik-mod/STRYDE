import { z } from "zod";
import { NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";
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
    shipping_address: { city: string | null; country_code: string | null } | null;
  };
}
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    const result = await medusa<TrackResult>("/stryde/order-track", {
      display_id: value.display_id,
      email: value.email,
    });
    return NextResponse.json(result);
  } catch (error) {
    const known = error instanceof RequestError;
    return NextResponse.json(
      {
        message: known
          ? (error as RequestError).message
          : "Order tracking is temporarily unavailable.",
      },
      { status: known ? (error as RequestError).status : 502 },
    );
  }
}
