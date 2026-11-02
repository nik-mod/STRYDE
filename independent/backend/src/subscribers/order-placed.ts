import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
// No email address or delivery promise is fabricated. The durable Medusa order
// remains the source of truth; configure an email provider before launch.
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
}
export const config: SubscriberConfig = { event: "order.placed" };
