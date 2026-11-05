"use client";
import { useEffect, useRef, useState } from "react";
import type { Cart } from "@/lib/types";
import { money } from "@/lib/types";
import { mediaFor } from "@/lib/product-media";
import { PreviewBagDrawer } from "./PreviewShopping";
import { CatalogWishlistBridge } from "./WishlistButton";
export async function commerceRequest<T>(
  path: string,
  value?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: value ? "POST" : "GET",
    cache: "no-store",
    headers: value ? { "Content-Type": "application/json" } : {},
    ...(value ? { body: JSON.stringify(value) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Please try again.");
  return result;
}
export function BagLines({
  cart,
  update,
  busy,
}: {
  cart: Cart;
  update: (id: string, quantity: number) => void;
  busy: boolean;
}) {
  return (
    <>
      {cart.items.map((line) => (
        <article className="commerce-bag-line" key={line.id}>
          {line.thumbnail ? (
            <img
              src={
                mediaFor(
                  line.product || { metadata: null },
                  line.thumbnail,
                  360,
                ).src
              }
              width={120}
              height={120}
              alt=""
            />
          ) : (
            <span>Image unavailable</span>
          )}
          <div>
            <h2>
              <a href={`/products/${line.product_handle}`}>{line.title}</a>
            </h2>
            <p className="micro">{line.variant_title}</p>
            {mediaFor(line.product || { metadata: null }, line.thumbnail)
              .attribution && (
              <p className="micro">
                {
                  mediaFor(line.product || { metadata: null }, line.thumbnail)
                    .attribution
                }
              </p>
            )}
            <p>{money(line.unit_price * line.quantity, cart.currency_code)}</p>
            <div className="quantity-row">
              <button
                disabled={busy}
                type="button"
                onClick={() => update(line.id, line.quantity - 1)}
                aria-label={`Decrease quantity for ${line.title}`}
              >
                −
              </button>
              <span>{line.quantity}</span>
              <button
                disabled={busy}
                type="button"
                onClick={() => update(line.id, line.quantity + 1)}
                aria-label={`Increase quantity for ${line.title}`}
              >
                +
              </button>
              <button
                disabled={busy}
                type="button"
                onClick={() => update(line.id, 0)}
              >
                Remove
              </button>
            </div>
          </div>
        </article>
      ))}
    </>
  );
}
export function Commerce({ testMode }: { testMode: boolean }) {
  return <>{testMode ? <PreviewBagDrawer /> : <LiveCommerce testMode={false} />}<CatalogWishlistBridge /></>;
}
function LiveCommerce({ testMode }: { testMode: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    try {
      const result = await commerceRequest<{ cart: Cart | null }>("/cart");
      setCart(result.cart);
      setMessage("");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };
  useEffect(() => {
    const open = () => {
      opener.current = document.activeElement as HTMLElement;
      if (!dialog.current?.open) dialog.current?.showModal();
      void refresh();
    };
    const click = (event: MouseEvent) => {
      const target = (event.target as Element).closest<HTMLElement>(
        "[data-cart-open]",
      );
      if (target && !event.metaKey && !event.ctrlKey && event.button === 0) {
        event.preventDefault();
        target.focus();
        open();
      }
    };
    document.addEventListener("click", click);
    document.addEventListener("stryde:bag-added", open);
    document.addEventListener("stryde:bag-changed", refresh);
    void refresh();
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("stryde:bag-added", open);
      document.removeEventListener("stryde:bag-changed", refresh);
    };
  }, []);
  useEffect(() => {
    const count =
      cart?.items.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
    const sync = () => {
    if (!document.querySelector(".document-shell[data-hydrated]")) return;
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(count);
    });
    document
      .querySelectorAll("[data-cart-open]")
      .forEach((node) =>
        node.setAttribute("aria-label", `Your bag (${count})`),
      );
    };
    sync();
    document.addEventListener("stryde:page-ready", sync);
    return () => document.removeEventListener("stryde:page-ready", sync);
  }, [cart]);
  async function update(id: string, quantity: number) {
    setBusy(true);
    setMessage("");
    try {
      const result = await commerceRequest<{ cart: Cart }>("/cart", {
        action: "update",
        line_id: id,
        quantity,
      });
      setCart(result.cart);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      className="cart-drawer"
      data-cart-drawer
      ref={dialog}
      aria-label="Your bag"
      onClose={() => opener.current?.focus()}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className="cart-drawer-content">
        <div className="cart-drawer-scroll" data-lenis-prevent>
          <header className="cart-drawer-header">
            <h2>
              Your bag
              <sup>
                {cart?.items.reduce((sum, line) => sum + line.quantity, 0) ?? 0}
              </sup>
            </h2>
            <button
              className="cart-drawer-close"
              type="button"
              aria-label="Close bag"
              onClick={() => dialog.current?.close()}
            >
              ×
            </button>
          </header>
          {message && (
            <p className="commerce-message" role="alert">
              {message}
            </p>
          )}
          {cart?.items.length ? (
            <BagLines cart={cart} update={update} busy={busy} />
          ) : (
            <div className="cart-drawer-empty">
              <p>Your bag is empty.</p>
              <a className="button" href="/collections/all">
                Explore the collection ↗
              </a>
            </div>
          )}
        </div>
        {!!cart?.items.length && (
          <footer className="cart-drawer-footer">
            <p className="cart-drawer-subtotal">
              Subtotal{" "}
              <span>
                {money(
                  cart.item_subtotal ?? cart.subtotal,
                  cart.currency_code,
                )}
              </span>
            </p>
            <p className="micro">
              Shipping and applicable taxes are calculated at checkout.
            </p>
            {testMode && (
              <p className="fixture-label">
                Test order only · No money will be collected
              </p>
            )}
            <a className="button button-dark button-full" href="/checkout">
              {testMode ? "Continue to test checkout" : "Review checkout"} ↗
            </a>
            <a className="text-link" href="/cart">
              View bag ↗
            </a>
          </footer>
        )}
      </div>
    </dialog>
  );
}
