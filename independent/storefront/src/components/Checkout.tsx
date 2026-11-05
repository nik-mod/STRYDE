"use client";
import { useEffect, useState } from "react";
import { commerceRequest } from "./Commerce";
import { PromoForm } from "./PromoForm";
import type { Cart, ShippingOption } from "@/lib/types";
import { money } from "@/lib/types";
import { PreviewCheckout } from "./PreviewShopping";
const TEST_CARD = "4242 4242 4242 4242";
function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
export function Checkout({ testMode }: { testMode: boolean }) {
  return testMode ? <PreviewCheckout /> : <LiveCheckout testMode={false} />;
}
function LiveCheckout({ testMode }: { testMode: boolean }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    reference: number;
    total: number;
    currency_code: string;
  } | null>(null);
  const [paid, setPaid] = useState<{ brand: string; last4: string } | null>(
    null,
  );
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
  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await commerceRequest<{
        test_order: { reference: number; total: number; currency_code: string };
        payment: { brand?: string; last4?: string };
        message: string;
      }>("/checkout", {
        action: "pay",
        card: {
          number: String(data.get("card_number") || ""),
          name: String(data.get("card_name") || ""),
          expiry: String(data.get("card_expiry") || ""),
          cvc: String(data.get("card_cvc") || ""),
        },
      });
      setConfirmed(result.test_order);
      if (result.payment?.last4)
        setPaid({ brand: result.payment.brand || "Card", last4: result.payment.last4 });
      setMessage(result.message);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (confirmed)
    return (
      <section className="commerce-panel">
        <p className="fixture-label">Development confirmation</p>
        <h1>{paid ? "Payment successful." : "Test order received."}</h1>
        <p>
          Order #{confirmed.reference} ·{" "}
          {money(confirmed.total, confirmed.currency_code)}
        </p>
        {paid && (
          <p>
            Paid with {paid.brand} •••• {paid.last4}{" "}
            <span className="fixture-label">(test mode — no real charge)</span>
          </p>
        )}
        <p role="status">{message}</p>
        <a href="/collections/all" className="button button-dark">
          Back to collection ↗
        </a>
      </section>
    );
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
                  <p className="fixture-label">
                    Test payment · Use {TEST_CARD}, any future expiry and any
                    CVC · A card ending 0002 simulates a decline · Card details
                    are never stored
                  </p>
                  <form className="checkout-form" onSubmit={pay}>
                    <label className="wide">
                      Card number
                      <input
                        required
                        name="card_number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder={TEST_CARD}
                        maxLength={23}
                        onChange={(event) => {
                          const target = event.currentTarget;
                          target.value = formatCardNumber(target.value);
                        }}
                      />
                    </label>
                    <label className="wide">
                      Name on card
                      <input
                        required
                        name="card_name"
                        autoComplete="cc-name"
                        maxLength={120}
                      />
                    </label>
                    <label>
                      Expiry (MM/YY)
                      <input
                        required
                        name="card_expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="12/29"
                        maxLength={5}
                        onChange={(event) => {
                          const target = event.currentTarget;
                          target.value = formatExpiry(target.value);
                        }}
                      />
                    </label>
                    <label>
                      Security code
                      <input
                        required
                        name="card_cvc"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="CVC"
                        maxLength={4}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={busy}
                      className="button button-dark wide"
                    >
                      {busy
                        ? "Processing payment…"
                        : `Pay ${money(cart.total, cart.currency_code)} ↗`}
                    </button>
                  </form>
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
