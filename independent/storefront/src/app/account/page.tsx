import { Shell } from "@/components/Shell";
import { AccountAuth, LogoutButton } from "@/components/AccountAuth";
import { getCustomer, customerOrders } from "@/lib/customer";
import { money } from "@/lib/types";
export const metadata = { title: "Your account" };
export const dynamic = "force-dynamic";
export default async function Account() {
  const customer = await getCustomer();
  if (!customer)
    return (
      <Shell>
        <AccountAuth />
      </Shell>
    );
  let orders: Awaited<ReturnType<typeof customerOrders>> = [];
  try {
    orders = await customerOrders();
  } catch {}
  return (
    <Shell>
      <section className="commerce-panel">
        <h1>Your account.</h1>
        <p>
          {customer.first_name} {customer.last_name} · {customer.email}
        </p>
        <div className="account-grid">
          <div>
            <h2>Orders</h2>
            {orders.length ? (
              <ul className="account-order-list">
                {orders.slice(0, 3).map((order) => (
                  <li key={order.id}>
                    <a href="/account/orders">
                      #{order.display_id} · {money(order.total, order.currency_code)}{" "}
                      · {order.status}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No orders yet.{" "}
                <a href="/collections/all">Find your next move.</a>
              </p>
            )}
            <p>
              <a className="button" href="/account/orders">
                All orders ↗
              </a>
            </p>
          </div>
          <div>
            <h2>Addresses</h2>
            {customer.addresses?.length ? (
              <ul className="account-order-list">
                {customer.addresses.slice(0, 3).map((address) => (
                  <li key={address.id}>
                    {address.address_1}, {address.city}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No saved addresses yet.</p>
            )}
            <p>
              <a className="button" href="/account/addresses">
                Manage addresses ↗
              </a>
            </p>
          </div>
          <div>
            <h2>Wishlist</h2>
            <p>Pairs you have saved for later.</p>
            <p>
              <a className="button" href="/account/wishlist">
                View wishlist ↗
              </a>
            </p>
          </div>
        </div>
        <p>
          <a href="/orders/track">Track a guest order ↗</a> ·{" "}
          <LogoutButton />
        </p>
      </section>
    </Shell>
  );
}
