import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";

// Guest order tracking. An order is only disclosed when both the order number
// and the exact email used at checkout match. The response is a safe subset:
// no customer record, no payment session data, no addresses beyond city/country.
const input = z
  .object({
    display_id: z.coerce.number().int().min(1).max(10_000_000),
    email: z.string().email().max(254),
  })
  .strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = input.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Enter your order number and the checkout email." });
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "display_id",
      "email",
      "status",
      "created_at",
      "currency_code",
      "total",
      "subtotal",
      "shipping_total",
      "tax_total",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.thumbnail",
      "shipping_address.city",
      "shipping_address.country_code",
    ],
    filters: { display_id: String(parsed.data.display_id) },
  });
  const order = orders[0] as any;
  if (
    !order ||
    String(order.email ?? "")
      .trim()
      .toLowerCase() !== parsed.data.email.trim().toLowerCase()
  ) {
    return res.status(404).json({
      message: "No order matches that number and email combination.",
    });
  }
  return res.json({
    order: {
      display_id: order.display_id,
      status: order.status,
      created_at: order.created_at,
      currency_code: order.currency_code,
      total: order.total,
      subtotal: order.subtotal,
      shipping_total: order.shipping_total,
      tax_total: order.tax_total,
      items: (order.items ?? []).map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        thumbnail: item.thumbnail ?? null,
      })),
      shipping_address: order.shipping_address
        ? {
            city: order.shipping_address.city,
            country_code: order.shipping_address.country_code,
          }
        : null,
    },
  });
}
