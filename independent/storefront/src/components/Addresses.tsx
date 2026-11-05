"use client";
import { useEffect, useState } from "react";
import { commerceRequest } from "./Commerce";
interface Address {
  id: string;
  first_name: string | null;
  last_name: string | null;
  address_1: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string | null;
}
export function Addresses({ signedIn }: { signedIn: boolean }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((result) => {
        if (result.addresses) setAddresses(result.addresses);
      })
      .catch(() => null)
      .finally(() => setReady(true));
  }, [signedIn]);
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await commerceRequest<{
        addresses: Address[];
      }>("/account/addresses", {
        action: "add",
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
      setAddresses(result.addresses);
      event.currentTarget.reset();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      const result = await commerceRequest<{ addresses: Address[] }>(
        "/account/addresses",
        { action: "remove", id },
      );
      setAddresses(result.addresses);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!signedIn)
    return (
      <section className="commerce-panel">
        <h1>Addresses.</h1>
        <p>
          <a href="/account">Sign in</a> to manage your address book.
        </p>
      </section>
    );
  return (
    <section className="commerce-panel">
      <h1>Addresses.</h1>
      <p>
        <a href="/account">← Back to account</a>
      </p>
      {message && (
        <p role="alert" className="commerce-message">
          {message}
        </p>
      )}
      {addresses.length ? (
        <ul className="account-order-list">
          {addresses.map((address) => (
            <li key={address.id}>
              {address.first_name} {address.last_name} · {address.address_1},{" "}
              {address.city} {address.postal_code},{" "}
              {(address.country_code ?? "").toUpperCase()}{" "}
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => remove(address.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        ready && <p>No saved addresses yet.</p>
      )}
      <h2>Save a new address</h2>
      <form className="checkout-form" onSubmit={add}>
        <label>
          First name
          <input required name="first_name" maxLength={150} />
        </label>
        <label>
          Last name
          <input required name="last_name" maxLength={150} />
        </label>
        <label className="wide">
          Street address
          <input required name="address_1" maxLength={150} />
        </label>
        <label>
          City
          <input required name="city" maxLength={150} />
        </label>
        <label>
          Postal code
          <input required name="postal_code" maxLength={150} />
        </label>
        <label>
          Country
          <select name="country_code" defaultValue="ge">
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
          {busy ? "Saving…" : "Save address ↗"}
        </button>
      </form>
    </section>
  );
}
