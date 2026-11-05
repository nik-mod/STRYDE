import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
// No email address or delivery promise is fabricated. With no SMTP provider
// configured, the confirmation content a real provider would send is written
// to .data/emails as an .eml file; the durable Medusa order remains the source
// of truth. Configure an email provider before launch.
export default async function orderPlaced({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  logger.info(
    JSON.stringify({
      event: "stryde.order.placed",
      order_id: event.data.id,
      notification: "email_provider_not_configured",
    }),
  );
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "item_subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "created_at",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "shipping_address.first_name",
        "shipping_address.city",
        "shipping_address.country_code",
      ],
      filters: { id: event.data.id },
    });
    const order = orders[0] as any;
    if (!order) return;
    const outDir = resolve(process.cwd(), "../.data/emails");
    await mkdir(outDir, { recursive: true });
    const currency = order.currency_code || "usd";
    const usd = (amount: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(amount);
    const lines = (order.items ?? [])
      .map(
        (item: any) =>
          `  ${item.quantity} x ${item.title} — ${usd(
            item.unit_price * item.quantity,
          )}`,
      )
      .join("\r\n");
    const body = [
      `Hi ${order.shipping_address?.first_name ?? "there"},`,
      "",
      `Thank you for your STRYDE order #${order.display_id}.`,
      "",
      `Order summary:`,
      lines,
      "",
      `Items: ${usd(order.item_subtotal ?? 0)}`,
      order.discount_total
        ? `Discount: −${usd(order.discount_total)}`
        : "",
      `Shipping: ${usd(order.shipping_total)}`,
      `Tax: ${usd(order.tax_total)}`,
      `Total: ${usd(order.total)}`,
      "",
      "This is a development store: no payment has been taken and nothing",
      "will ship. Track the order any time with its number and this email",
      "address on the order tracking page.",
    ].join("\r\n");
    const eml = [
      `From: STRYDE orders <orders@stryde.local>`,
      `To: ${order.email}`,
      `Subject: STRYDE order #${order.display_id} received`,
      `Date: ${new Date(order.created_at ?? Date.now()).toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      body,
    ].join("\r\n");
    await writeFile(resolve(outDir, `order-${order.display_id}.eml`), eml);
    logger.info(`Order confirmation written to .data/emails for order #${order.display_id}.`);
  } catch (error) {
    logger.error(
      `Order confirmation email failed: ${
        error instanceof Error ? error.message : "unknown"
      }`,
    );
  }
}
export const config: SubscriberConfig = { event: "order.placed" };
