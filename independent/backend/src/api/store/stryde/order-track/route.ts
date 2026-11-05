import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import { allowOrderLookup, ownsTrackedOrder } from "../../../../lib/order-tracking";

// Authentication is enforced in middlewares.ts. Email/number are search fields,
// never authorization. Scope the database query and verify ownership again.
const input = z
  .object({
    display_id: z.coerce.number().int().min(1).max(10_000_000),
    email: z.string().email().max(254),
  })
  .strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  const customerId = (req as MedusaRequest & { auth_context?: { actor_id?: string } }).auth_context?.actor_id;
  if (!customerId) return res.status(401).json({ message: "Sign in to the account that placed this order." });
  if (!allowOrderLookup(customerId)) return res.status(429).json({ message: "Too many lookups. Wait a minute and try again." });
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
      "customer_id",
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
      "fulfillments.id",
      "fulfillments.packed_at",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
    ],
    filters: { display_id: String(parsed.data.display_id), customer_id: customerId },
  });
  const order = orders[0] as any;
  if (
    !ownsTrackedOrder(order, customerId, parsed.data.email)
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
      fulfillments: (order.fulfillments ?? []).map((fulfillment: any) => ({
        id: fulfillment.id,
        packed_at: fulfillment.packed_at,
        shipped_at: fulfillment.shipped_at,
        delivered_at: fulfillment.delivered_at,
        canceled_at: fulfillment.canceled_at,
        labels: (fulfillment.labels ?? []).map((label: any) => ({ tracking_number: label.tracking_number, tracking_url: label.tracking_url })),
      })),
    },
  });
}
