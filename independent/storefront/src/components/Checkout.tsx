"use client";
import { useEffect, useState } from "react";
import { commerceRequest } from "./Commerce";
import { PromoForm } from "./PromoForm";
import type { Cart, ShippingOption } from "@/lib/types";
import { money } from "@/lib/types";
import { PreviewCheckout } from "./PreviewShopping";
export function Checkout({ testMode, bankSandbox = false }: { testMode: boolean; bankSandbox?: boolean }) {
  return testMode && !bankSandbox ? <PreviewCheckout /> : <LiveCheckout testMode={testMode && bankSandbox} />;
}
function LiveCheckout({ testMode }: { testMode: boolean }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    commerceRequest<{ cart: Cart | null; shipping_options: ShippingOption[] }>(
      "/checkout",
    )
      .then((result) => {
        setCart(result.cart);
        setOptions(result.shipping_options);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setReady(true));
  }, []);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await commerceRequest<{
        cart: Cart;
        shipping_options: ShippingOption[];
      }>("/checkout", {
        action: "address",
        email: data.get("email"),
        address: Object.fromEntries(
          [
            "first_name",
            "last_name",
            "address_1",
            "city",
            "postal_code",
            "country_code",
          ].map((name) => [name, data.get(name)]),
        ),
      });
      setCart(result.cart);
      setOptions(result.shipping_options);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function shipping(option_id: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await commerceRequest<{ cart: Cart }>("/checkout", {
        action: "shipping",
        option_id,
      });
      setCart(result.cart);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="commerce-panel">
      <h1>{testMode ? "Checkout — test mode" : "Checkout."}</h1>
      {testMode ? (
        <p className="fixture-label">
          Development only · Test payment · No real charge or shipment
        </p>
      ) : (
        <p>
          Checkout will open after payment and shipping services are approved.
        </p>
      )}
      {message && (
        <p role="alert" className="commerce-message">
          {message}
        </p>
      )}
      {!ready ? (
        <p>Loading your bag…</p>
      ) : !cart?.items.length ? (
        <p>
          Your bag is empty.{" "}
          <a href="/collections/all">Explore the collection.</a>
        </p>
      ) : (
        <>
          <p>
            {cart.items.reduce((sum, line) => sum + line.quantity, 0)} items ·
            Subtotal{" "}
            {money(
              cart.item_subtotal ?? cart.subtotal,
              cart.currency_code,
            )}
          </p>
          {testMode && (
            <>
              <h2>Delivery details</h2>
              <form className="checkout-form" onSubmit={save}>
                <label className="wide">
                  Email
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    defaultValue={cart.email}
                    maxLength={254}
                  />
                </label>
                {(
                  [
                    "first_name",
                    "last_name",
                    "address_1",
                    "city",
                    "postal_code",
                  ] as const
                ).map((name) => (
                  <label
                    key={name}
                    className={name === "address_1" ? "wide" : undefined}
                  >
                    {
                      {
                        first_name: "First name",
                        last_name: "Last name",
                        address_1: "Street address",
                        city: "City",
                        postal_code: "Postal code",
                      }[name]
                    }
                    <input
                      required
                      name={name}
                      maxLength={150}
                      defaultValue={cart.shipping_address?.[name]}
                      autoComplete={
                        {
                          first_name: "given-name",
                          last_name: "family-name",
                          address_1: "address-line1",
                          city: "address-level2",
                          postal_code: "postal-code",
                        }[name]
                      }
                    />
                  </label>
                ))}
                <label>
                  Country
                  <select
                    name="country_code"
                    defaultValue="ge"
                    autoComplete="country"
                  >
                    <option value="ge">Georgia</option>
                    <option value="us">United States</option>
                    <option value="gb">United Kingdom</option>
                    <option value="de">Germany</option>
                    <option value="fr">France</option>
                    <option value="it">Italy</option>
                    <option value="es">Spain</option>
                    <option value="nl">Netherlands</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="button button-dark wide"
                >
                  Save details & calculate shipping ↗
                </button>
              </form>
              {options.length > 0 && (
                <>
                  <h2>Shipping</h2>
                  <div className="checkout-options">
                    {options.map((option) => (
                      <button
                        key={option.id}
                        className="button"
                        disabled={busy}
                        onClick={() => shipping(option.id)}
                        type="button"
                      >
                        {option.name} ·{" "}
                        {money(
                          option.calculated_price?.calculated_amount ??
                            option.amount,
                          cart.currency_code,
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {!!cart.shipping_methods?.length && (
                <>
                  <h2>Payment</h2>
                  <PromoForm
                    cart={cart}
                    onUpdate={(updated) => setCart(updated)}
                  />
                  <p>
                    Shipping {money(cart.shipping_total, cart.currency_code)} ·
                    Tax {money(cart.tax_total, cart.currency_code)}
                    {typeof cart.discount_total === "number" &&
                    cart.discount_total > 0
                      ? ` · Discount −${money(cart.discount_total, cart.currency_code)}`
                      : ""}
                  </p>
                  <p className="bag-summary">
                    Total{" "}
                    <strong>{money(cart.total, cart.currency_code)}</strong>
                  </p>
                  <p>Card details are entered on the bank’s secure page.</p>
                  <a href="/checkout/payment" className="button button-dark">Choose bank payment ↗</a>
                  <p>
                    <a href="/policies/returns">Returns</a> ·{" "}
                    <a href="/policies/terms">Terms</a> ·{" "}
                    <a href="/policies/privacy">Privacy</a>
                  </p>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
