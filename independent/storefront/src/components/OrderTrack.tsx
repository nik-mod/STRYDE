"use client";
import { useState } from "react";
import { commerceRequest } from "./Commerce";
import { money } from "@/lib/types";
interface TrackedOrder {
  display_id: number;
  status: string;
  created_at: string;
  currency_code: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  items: { title: string; quantity: number; unit_price: number }[];
  shipping_address: { city: string | null; country_code: string | null } | null;
}
export function OrderTrack() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setOrder(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await commerceRequest<{ order: TrackedOrder }>(
        "/orders/track",
        {
          display_id: data.get("display_id"),
          email: data.get("email"),
        },
      );
      setOrder(result.order);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="commerce-panel">
      <h1>Track your order.</h1>
      <p>
        Enter the order number from your confirmation and the email used at
        checkout.
      </p>
      {message && (
        <p role="alert" className="commerce-message">
          {message}
        </p>
      )}
      <form className="checkout-form" onSubmit={submit}>
        <label>
          Order number
          <input
            required
            name="display_id"
            inputMode="numeric"
            placeholder="e.g. 3"
            maxLength={9}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="button button-dark wide"
        >
          {busy ? "Looking…" : "Track order ↗"}
        </button>
      </form>
      {order && (
        <div className="account-order">
          <p className="bag-summary">
            <strong>#{order.display_id}</strong> ·{" "}
            {money(order.total, order.currency_code)} · {order.status} ·{" "}
            {new Date(order.created_at).toLocaleDateString("en-US")}
          </p>
          <ul>
            {order.items.map((item, index) => (
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
        </div>
      )}
      <p>
        Signed in? <a href="/account/orders">Your orders live in your account ↗</a>
      </p>
    </section>
  );
}
