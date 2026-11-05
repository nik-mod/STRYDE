import { Shell } from "@/components/Shell";
import { AccountAuth } from "@/components/AccountAuth";
import { getCustomer, customerOrders } from "@/lib/customer";
import { money } from "@/lib/types";
export const metadata = { title: "Your orders" };
export const dynamic = "force-dynamic";
export default async function AccountOrders() {
  const customer = await getCustomer();
  if (!customer)
    return (
      <Shell>
        <AccountAuth redirectTo="/account/orders" />
      </Shell>
    );
  let orders: Awaited<ReturnType<typeof customerOrders>> = [];
  try {
    orders = await customerOrders();
  } catch {}
  return (
    <Shell>
      <section className="commerce-panel">
        <h1>Your orders.</h1>
        <p>
          <a href="/account">← Back to account</a>
        </p>
        {orders.length ? (
          <ul className="account-order-list">
            {orders.map((order) => (
              <li key={order.id} className="account-order">
                <p className="bag-summary">
                  <strong>#{order.display_id}</strong> ·{" "}
                  {money(order.total, order.currency_code)} · {order.status} ·{" "}
                  {new Date(order.created_at).toLocaleDateString("en-US")}
                </p>
                <ul>
                  {(order.items ?? []).map((item, index) => (
                    <li key={index}>
                      {item.quantity} × {item.title} —{" "}
                      {money(item.unit_price * item.quantity, order.currency_code)}
                    </li>
                  ))}
                </ul>
                {order.shipping_address && (
                  <p className="micro">
                    Shipping to {order.shipping_address.city},{" "}
                    {(order.shipping_address.country_code ?? "").toUpperCase()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            No orders yet.{" "}
            <a href="/collections/all">Explore the collection.</a>
          </p>
        )}
        <p>
          <a href="/orders/track">Track an order ↗</a>
        </p>
      </section>
    </Shell>
  );
}
