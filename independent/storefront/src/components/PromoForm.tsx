"use client";
import { useState } from "react";
import { commerceRequest } from "./Commerce";
import type { Cart } from "@/lib/types";
export function PromoForm({
  cart,
  onUpdate,
}: {
  cart: Cart;
  onUpdate: (cart: Cart) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const applied = (cart.promotions ?? [])
    .map((p) => p.code)
    .filter((code): code is string => typeof code === "string");
  async function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const code = String(data.get("code") || "").trim();
    if (!code) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await commerceRequest<{ cart: Cart }>("/cart", {
        action: "promo",
        code,
      });
      onUpdate(result.cart);
      form.reset();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(code: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await commerceRequest<{ cart: Cart }>("/cart", {
        action: "promo-remove",
        code,
      });
      onUpdate(result.cart);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="promo-block">
      <form className="promo-form" onSubmit={apply}>
        <label className="promo-input">
          Promo code
          <input
            name="code"
            placeholder="e.g. WELCOME10"
            maxLength={40}
            autoComplete="off"
          />
        </label>
        <button type="submit" className="button" disabled={busy}>
          {busy ? "…" : "Apply "}
        </button>
      </form>
      {message && (
        <p role="alert" className="commerce-message">
          {message}
        </p>
      )}
      {applied.length > 0 && (
        <p className="micro">
          Applied:{" "}
          {applied.map((code) => (
            <span key={code}>
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => remove(code)}
              >
                {code} ×
              </button>{" "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
