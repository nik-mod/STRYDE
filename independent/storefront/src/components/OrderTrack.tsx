"use client";
import { useEffect, useRef, useState } from "react";
import { commerceRequest } from "./Commerce";
import { money } from "@/lib/types";
import { CustomerPage } from "./CustomerPage";
import { Arrow } from "./Information";
interface TrackedOrder {
  display_id: number; status: string; created_at: string; currency_code: string; total: number;
  items: { title: string; quantity: number; unit_price: number }[];
  fulfillments?: { id: string; packed_at?: string | null; shipped_at?: string | null; delivered_at?: string | null; canceled_at?: string | null; labels: { tracking_number: string; tracking_url: string }[] }[];
}
function safeTrackingUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function OrderTrack() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<"loading" | "signed-out" | "signed-in" | "unavailable">("loading");
  const resultRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    let active = true;
    commerceRequest<{ customer: { email: string } | null }>("/auth/me").then(result => { if (active) setSession(result.customer ? "signed-in" : "signed-out"); }).catch(() => { if (active) setSession("unavailable"); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (order) resultRef.current?.focus(); else if (message) errorRef.current?.focus(); }, [order, message]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage(""); setOrder(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await commerceRequest<{ order: TrackedOrder }>("/orders/track", { display_id: data.get("display_id"), email: data.get("email") });
      setOrder(result.order);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <CustomerPage title="Your order," accent="in view." introduction="Check the latest status recorded by STRYDE. Keep your order number and checkout email close.">
    <div className="customer-split tracking-layout"><aside className="tracking-context"><svg viewBox="0 0 220 170" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="m28 57 82-36 82 36v66l-82 33-82-33Zm0 0 82 35 82-35M110 92v64M68 40l82 35v28" /></svg><h2>A secure place<br />to check in.</h2><p>Only orders belonging to your signed-in account can be shown. An order number alone never unlocks personal details.</p><a className="customer-link" href="/account/orders">View account orders <Arrow diagonal /></a><div className="customer-note"><strong>Order status, not carrier tracking.</strong><p>Live carrier tracking is not connected. No shipment or delivery estimate is inferred from an internal order status.</p></div></aside>
    <div className="tracking-tool"><h2>Find an order.</h2><p>Use the number on your confirmation and the email entered at checkout.</p>
      {session !== "signed-in" && <div className="tracking-session" role="status">{session === "loading" ? <p>Checking your account…</p> : <><p>{session === "unavailable" ? "Account verification is temporarily unavailable. Refresh the page or try signing in again." : "Sign in to the account that placed this order before looking it up. Guest order lookup is not available yet."}</p><a href="/account">Sign in to continue <Arrow diagonal /></a></>}</div>}
      <form className="customer-form" onSubmit={submit} aria-busy={busy}>
        <div><label htmlFor="track-number">Order number</label><input id="track-number" required name="display_id" inputMode="numeric" pattern="[0-9]{1,8}" maxLength={8} placeholder="e.g. 3" aria-describedby="track-number-hint" disabled={session !== "signed-in" || busy} /><p id="track-number-hint" className="field-hint">Enter the number without the # symbol.</p></div>
        <div><label htmlFor="track-email">Checkout email</label><input id="track-email" required type="email" name="email" autoComplete="email" maxLength={254} placeholder="you@example.com" disabled={session !== "signed-in" || busy} /></div>
        {message && <p ref={errorRef} tabIndex={-1} role="alert" className="customer-error">{message}</p>}
        <button type="submit" disabled={busy || session !== "signed-in"} className="information-action">{busy ? "Checking your order…" : "Check order status"}<Arrow /></button>
        <span className="sr-only" role="status">{busy ? "Looking up your order. Please wait." : ""}</span>
      </form>
      {order && <section className="tracking-result" ref={resultRef} tabIndex={-1} aria-labelledby="order-result-title"><div className="tracking-result-header"><h2 id="order-result-title">Order #{order.display_id}</h2><span>{order.status.replaceAll("_", " ")}</span></div><dl><div><dt>Placed</dt><dd>{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</dd></div><div><dt>Order total</dt><dd>{money(order.total, order.currency_code)}</dd></div></dl><ul>{order.items.map((item, index) => <li key={index}><span>{item.title}<small>Quantity {item.quantity}</small></span><span>{money(item.unit_price * item.quantity, order.currency_code)}</span></li>)}</ul>{order.fulfillments?.map((fulfillment, index) => <div className="tracking-fulfillment" key={fulfillment.id}><h3>Fulfillment {index + 1}</h3><dl>{([ ["Packed", fulfillment.packed_at], ["Shipped", fulfillment.shipped_at], ["Delivered", fulfillment.delivered_at], ["Canceled", fulfillment.canceled_at] ] as const).filter(([, date]) => !!date).map(([label, date]) => <div key={label}><dt>{label}</dt><dd>{new Date(date!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</dd></div>)}</dl>{fulfillment.labels.map((label, i) => <p key={i}>Tracking reference: {label.tracking_number}{safeTrackingUrl(label.tracking_url) && <> · <a href={safeTrackingUrl(label.tracking_url)!} target="_blank" rel="noopener noreferrer">Open carrier website</a></>}</p>)}{!fulfillment.packed_at && !fulfillment.shipped_at && !fulfillment.delivered_at && !fulfillment.canceled_at && !fulfillment.labels.length && <p>No fulfillment events have been recorded.</p>}</div>)}<p className="customer-note">This is the current internal order record. Fulfillment events appear only when entered in the store. Live carrier event syncing is not connected.</p></section>}
      <a className="customer-link tracking-shop" href="/collections/all">Continue shopping <Arrow /></a>
    </div></div>
  </CustomerPage>;
}


