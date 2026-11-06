"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow } from "./Information";
import { ShopPage, PreviewNote, ShopIcon } from "./ShopUI";
import { checkoutRedirect, paymentCopy, type BankChoice, type PaymentResult } from "@/lib/hosted-payment";
import { money } from "@/lib/types";

async function call(action: string, provider_id?: string) {
  const response = await fetch("/api/checkout/hosted", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...(provider_id ? { provider_id } : {}) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Payment verification is temporarily unavailable.");
  return result;
}
export function HostedPayment() {
  const [ready, setReady] = useState(false), [enabled, setEnabled] = useState(false), [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<BankChoice[]>([]), [selected, setSelected] = useState("");
  const [result, setResult] = useState<PaymentResult>({ state: "not_started" });
  const [message, setMessage] = useState("");
  const [availabilityFailed, setAvailabilityFailed] = useState(false);
  const [total, setTotal] = useState<{ amount: number; currency: string } | null>(null);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null), focusStatus = useRef(false);
  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try { const next = await call("status"); if (next.enabled === false) { setEnabled(false); return; } setResult(next); }
    catch (error) { setResult({ state: "review" }); setMessage((error as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  }, []);
  const loadOptions = useCallback(async () => {
    setBusy(true); setMessage("");
    try {
      const next = await call("options");
      setAvailabilityFailed(false);
      setEnabled(next.enabled === true); setProviders(next.providers || []); setSelected(next.providers?.[0]?.id || "");
      if (typeof next.total === "number") setTotal({ amount: next.total, currency: next.currency_code });
      // Query parameters are never evidence of payment. Status is bound only to
      // the signed cart cookie on the server, even after refresh/back navigation.
      if (next.enabled) await check();
    } catch (error) { setAvailabilityFailed(true); setMessage((error as Error).message); }
    finally { setReady(true); setBusy(false); }
  }, [check]);
  useEffect(() => { void loadOptions(); }, [loadOptions]);
  useEffect(() => { if (focusStatus.current) { heading.current?.focus(); focusStatus.current = false; } }, [result.state, availabilityFailed, ready, busy]);
  useEffect(() => {
    if (!enabled || result.state !== "pending") return;
    let count = 0;
    const timer = setInterval(() => { if (++count > 10) { clearInterval(timer); return; } void check(); }, 6000);
    return () => clearInterval(timer);
  }, [enabled, result.state, check]);
  async function start(event: React.FormEvent) {
    event.preventDefault(); if (inFlight.current || !selected) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try { const next = await call("start", selected); window.location.assign(checkoutRedirect(next.redirect_url, selected)); }
    catch (error) { setResult({ state: "review" }); setMessage((error as Error).message); inFlight.current = false; setBusy(false); }
  }
  const state = Object.hasOwn(paymentCopy, result.state) ? result.state : "review";
  const copy = paymentCopy[state];
  return <ShopPage title="Your payment," accent="in good hands." description="A clear next step, from your bag to the bank and back.">
    <PreviewNote>Development checkout. Real customer payments are not open.</PreviewNote>
    <div className="shopping-layout"><div className="checkout-review" aria-busy={busy || !ready}>
      {!ready ? <p role="status">Checking payment availability…</p> : <>
        <h2 ref={heading} tabIndex={-1}>{availabilityFailed ? "We couldn’t check your payment." : enabled ? copy.title : "Payments are not open yet."}</h2>
        <p role="status" aria-live="polite">{availabilityFailed ? "The payment service could not be reached. Try checking again before making another payment." : enabled ? result.message || copy.text : "You can keep exploring STRYDE. Bank checkout will open after the payment service is configured and tested."}</p>
        {message && <p className="shop-error-text" role="alert">{message}</p>}
        {!availabilityFailed && (state === "not_started" || !enabled) && <form className="shop-form" onSubmit={start}>
          <fieldset className="payment-providers"><legend>Pay by card through</legend>
            {([{ id: "pp_tbc_tbc", name: "TBC Bank" }, { id: "pp_bog_bog", name: "Bank of Georgia" }]).map(bank => {
              const available = enabled && providers.some(p => p.id === bank.id);
              return <label key={bank.id} className="payment-provider"><input type="radio" name="payment_provider" value={bank.id} checked={selected === bank.id} disabled={!available || busy} onChange={() => setSelected(bank.id)}/><span><strong>{bank.name}</strong><small>{available ? "Bank-hosted card checkout · sandbox" : "Not available yet"}</small></span></label>;
            })}
          </fieldset>
          <p className="shop-muted">Card details are entered on the bank’s page. STRYDE does not collect your card number or security code here.</p>
          <button className="shop-button" type="submit" disabled={!enabled || !selected || busy}>{busy ? "Preparing bank checkout…" : "Continue to the bank"}<Arrow/></button>
        </form>}
        {availabilityFailed ? <button type="button" className="shop-button" disabled={busy} onClick={() => { focusStatus.current = true; void loadOptions(); }}>{busy ? "Checking availability…" : "Try checking again"}<Arrow/></button> : enabled && ["pending", "review", "refund_pending"].includes(state) && <button type="button" className="shop-button" disabled={busy} onClick={() => { focusStatus.current = true; void check(); }}>{busy ? "Checking with the bank…" : "Check payment status"}<Arrow/></button>}
        {enabled && state === "confirmed" && result.order && <dl className="payment-confirmation"><dt>Order reference</dt><dd>#{result.order.reference}</dd><dt>Confirmed total</dt><dd>{money(result.order.total, result.order.currency_code)}</dd></dl>}
        <a className="shop-text-link" href={state === "confirmed" ? "/collections/all" : "/cart"}>{state === "confirmed" ? "Back to the collection" : "Return to your bag"}<Arrow/></a>
      </>}
    </div><aside className="shop-summary"><ShopIcon name="bag" size={32}/><h2>{state === "confirmed" && enabled ? "Order recorded." : "The next step."}</h2>{total && <div className="shop-total"><span>Checkout total</span><strong>{money(total.amount, total.currency)}</strong></div>}<p>{availabilityFailed ? "A connection problem does not tell us whether a payment went through. Check its outcome before paying again." : !enabled ? "You can review the checkout experience while we prepare the payment service." : state === "confirmed" ? "Your confirmation is linked to this checkout. Keep your order reference for any questions." : state === "not_started" ? "Choose an available bank to continue. You will enter card details on its secure page." : state === "declined" ? "Review the declined payment with your bank before arranging another attempt." : state === "expired" ? "This bank session has ended. Review your bag before arranging a new checkout." : state === "refunded" ? "Keep your order reference while your card issuer processes the refund." : state === "refund_pending" ? "The refund is awaiting confirmation. Checking its status does not send another refund request." : "Keep this page available while we verify the payment. If you return later, we’ll check its status again."}</p>{enabled && ["pending", "review"].includes(state) && <p className="shop-muted">If the outcome is unclear, check it before paying again.</p>}<a className="shop-text-link" href="/pages/contact">Payment help<Arrow/></a></aside></div>
  </ShopPage>;
}
