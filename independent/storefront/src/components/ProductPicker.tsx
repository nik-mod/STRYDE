"use client";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { available, money } from "@/lib/types";
import { commerceRequest } from "./Commerce";
export function ProductPicker({
  product,
  selected,
}: {
  product: Product;
  selected?: string;
}) {
  const initial =
    product.variants.find((v) => v.id === selected) ||
    product.variants.find(available) ||
    product.variants[0];
  const [variant, setVariant] = useState<
    Product["variants"][number] | undefined
  >(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!variant) return;
    setBusy(true);
    setMessage("");
    try {
      await commerceRequest("/cart", {
        action: "add",
        variant_id: variant.id,
        quantity: 1,
      });
      document.dispatchEvent(new CustomEvent("stryde:bag-added"));
      setMessage("Added to your bag.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="independent-picker" onSubmit={add}>
      <p className="price-line">
        {variant?.calculated_price
          ? money(
              variant.calculated_price.calculated_amount,
              variant.calculated_price.currency_code,
            )
          : "Price unavailable"}
      </p>
      <fieldset>
        <legend>Choose your size / variant</legend>
        <div className="size-options">
          {product.variants.map((value) => (
            <button
              type="button"
              key={value.id}
              disabled={!available(value)}
              aria-pressed={value.id === variant?.id}
              onClick={() => {
                setVariant(value);
                const url = new URL(location.href);
                url.searchParams.set("variant", value.id);
                history.replaceState(history.state, "", url);
              }}
            >
              {value.title}
              {!available(value) ? " · Sold out" : ""}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="sr-only" htmlFor="variant">
        Variant
      </label>
      <select
        id="variant"
        className="sr-only"
        value={variant?.id || ""}
        onChange={(event) =>
          setVariant(product.variants.find((v) => v.id === event.target.value))
        }
      >
        {product.variants.map((value) => (
          <option key={value.id} value={value.id} disabled={!available(value)}>
            {value.title}
          </option>
        ))}
      </select>
      <button
        className="button button-dark"
        disabled={
          busy || !variant || !available(variant) || !variant.calculated_price
        }
        type="submit"
      >
        {busy
          ? "Adding…"
          : variant && available(variant)
            ? "Add to bag ↗"
            : "Sold out"}
      </button>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
