"use client";
import { useEffect, useState } from "react";
import { BagLines, commerceRequest } from "./Commerce";
import { PromoForm } from "./PromoForm";
import type { Cart } from "@/lib/types";
import { money } from "@/lib/types";
export function CartPage({ testMode }: { testMode: boolean }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    commerceRequest<{ cart: Cart | null }>("/cart")
      .then((value) => setCart(value.cart))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);
  async function update(id: string, quantity: number) {
    setBusy(true);
    try {
      const result = await commerceRequest<{ cart: Cart }>("/cart", {
        action: "update",
        line_id: id,
        quantity,
      });
      setCart(result.cart);
      setMessage("");
      document.dispatchEvent(new Event("stryde:bag-changed"));
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="commerce-panel">
      <h1>Your bag.</h1>
      {message && <p role="alert">{message}</p>}
      {loading ? (
        <p>Loading your bag…</p>
      ) : cart?.items.length ? (
        <>
          <BagLines cart={cart} update={update} busy={busy} />
          <p className="bag-summary">
            Subtotal{" "}
            <span>
              {money(cart.item_subtotal ?? cart.subtotal, cart.currency_code)}
            </span>
          </p>
          <PromoForm cart={cart} onUpdate={(updated) => setCart(updated)} />
          {typeof cart.discount_total === "number" && cart.discount_total > 0 && (
            <p className="bag-summary">
              Discount{" "}
              <span>−{money(cart.discount_total, cart.currency_code)}</span>
            </p>
          )}
          <p>Shipping and applicable taxes are calculated at checkout.</p>
          {testMode && (
            <p className="fixture-label">Test checkout · No real payment</p>
          )}
          <a className="button button-dark" href="/checkout">
            Continue to {testMode ? "test " : ""}checkout ↗
          </a>
        </>
      ) : (
        <p>
          Your bag is empty.{" "}
          <a href="/collections/all">Explore the collection ↗</a>
        </p>
      )}
    </section>
  );
}
