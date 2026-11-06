import { timingSafeEqual } from "node:crypto";
import { z } from "@medusajs/framework/zod";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { createPaymentCollectionForCartWorkflow, createPaymentSessionsWorkflow, processPaymentWorkflow } from "@medusajs/medusa/core-flows";
import { bankOptions, type Bank } from "../../../../lib/bank-payments/config";
import { callbackClient, bankProviderId } from "../../../../lib/bank-payments/callback";
import { assertReceipt, money } from "../../../../lib/bank-payments/client";
import { storedSession } from "../../../../lib/bank-payments/provider";
import { operationStore, performOnce } from "../../../../lib/bank-payments/operations";

const input = z.object({ action: z.enum(["options", "start", "status"]), cart_id: z.string().regex(/^cart_[a-zA-Z0-9]+$/), provider_id: z.enum(["pp_tbc_tbc", "pp_bog_bog"]).optional() }).strict();
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const expected = process.env.PAYMENT_BRIDGE_SECRET || "", supplied = req.headers["x-stryde-payment-bridge"];
  if (process.env.NODE_ENV === "production" || process.env.STRYDE_TEST_MODE !== "true" || expected.length < 32) { res.sendStatus(503); return; }
  if (typeof supplied !== "string" || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) { res.sendStatus(403); return; }
  const parsed = input.safeParse(req.body);
  if (!parsed.success) { res.sendStatus(400); return; }
  const { action, cart_id, provider_id } = parsed.data;
  const query = req.scope.resolve("query"), payment = req.scope.resolve(Modules.PAYMENT);
  const key = `checkout:${cart_id}`;
  try {
    const { data: [cart] } = await query.graph({ entity: "cart", fields: ["id", "total", "currency_code", "region_id", "email", "completed_at", "items.id", "shipping_address.country_code", "shipping_methods.id", "payment_collection.id", "payment_collection.payment_sessions.id", "payment_collection.payment_sessions.provider_id", "payment_collection.payment_sessions.data"], filters: { id: cart_id } });
    if (!cart) { res.sendStatus(404); return; }
    const { data: [region] } = await query.graph({ entity: "region", fields: ["id", "payment_providers.id", "countries.iso_2"], filters: { id: cart.region_id } });
    const providers = (["tbc", "bog"] as Bank[]).flatMap(bank => {
      const options = bankOptions(bank);
      return options && options.currencies.includes(cart.currency_code.toUpperCase()) && region?.payment_providers?.some(p => p.id === bankProviderId(bank))
        ? [{ id: bankProviderId(bank), name: bank === "tbc" ? "TBC Bank" : "Bank of Georgia", mode: "sandbox" }] : [];
    });
    if (action === "options") { res.json({ providers }); return; }
    if (action === "start") {
      if (!providers.some(p => p.id === provider_id) || !cart.items?.length || !cart.email || !cart.shipping_methods?.length
          || !region?.countries?.some(c => c.iso_2 === cart.shipping_address?.country_code) || cart.completed_at) { res.status(409).json({ message: "Check delivery details and payment availability first." }); return; }
      const session = await performOnce(operationStore, key, { cart_id, provider_id }, async () => {
        const collection = cart.payment_collection || (await createPaymentCollectionForCartWorkflow(req.scope).run({ input: { cart_id } })).result;
        const { result } = await createPaymentSessionsWorkflow(req.scope).run({ input: { payment_collection_id: collection.id, provider_id } });
        const bank = provider_id === "pp_tbc_tbc" ? "tbc" : "bog";
        const data = storedSession(result.data, bank);
        if (money(cart.total) !== data.amount || cart.currency_code.toUpperCase() !== data.currency) throw new Error("Cart total changed");
        return { id: result.id, provider_id, ...data };
      });
      if (session.provider_id !== provider_id) { res.status(409).json({ message: "An existing bank payment must be checked before switching providers." }); return; }
      res.json({ state: "redirect", redirect_url: session.redirect_url, session_id: session.id }); return;
    }
    let operation = await operationStore.get(key);
    if (!operation) { res.json({ state: "not_started" }); return; }
    if (operation.state !== "submitted") {
      // Recover a successful session whose final ledger write/HTTP response was
      // interrupted. This only inspects persisted Medusa data; it never creates a payment.
      const candidates = cart.payment_collection?.payment_sessions?.filter(s => s.provider_id === operation.details.provider_id && s.data?.session_id === s.id) || [];
      if (candidates.length !== 1) { res.json({ state: "review", message: "Payment outcome needs review. Do not pay again." }); return; }
      const found = candidates[0];
      const data = storedSession(found.data, found.provider_id === "pp_tbc_tbc" ? "tbc" : "bog");
      await operationStore.save(key, "submitted", { ...operation.details, result: { id: found.id, provider_id: found.provider_id, ...data } });
      operation = await operationStore.get(key);
    }
    const saved = operation.details.result;
    const session = await payment.retrievePaymentSession(saved.id);
    if (session.provider_id !== saved.provider_id || !["pp_tbc_tbc", "pp_bog_bog"].includes(session.provider_id)) throw new Error("Payment provider mismatch");
    const bank = session.provider_id === "pp_tbc_tbc" ? "tbc" : "bog";
    const options = bankOptions(bank);
    if (!options) throw new Error("Provider unavailable");
    const data = storedSession(session.data, bank);
    const receipt = await callbackClient(options).retrieve(data.bank_id);
    assertReceipt(receipt, data);
    if (data.session_id !== session.id || data.amount !== money(session.amount) || data.currency !== session.currency_code.toUpperCase()) throw new Error("Session mismatch");
    if (receipt.status === "captured") {
      try { await processPaymentWorkflow(req.scope).run({ input: { action: "captured", data: { session_id: session.id, amount: receipt.amount } } }); }
      catch { res.json({ state: "review", message: "Payment is confirmed by the bank; your order needs review. Do not pay again." }); return; }
      const { data: [link] } = await query.graph({ entity: "order_cart", fields: ["order.id", "order.display_id", "order.total", "order.currency_code"], filters: { cart_id } });
      if (!link?.order) { res.json({ state: "review", message: "Payment is confirmed; order processing needs review. Do not pay again." }); return; }
      res.json({ state: "confirmed", order: { reference: link.order.display_id, total: link.order.total, currency_code: link.order.currency_code } }); return;
    }
    res.json({ state: receipt.status === "error" ? "declined" : receipt.status === "canceled" ? "expired" : receipt.status === "refunded" ? "refunded" : receipt.status === "refund_pending" ? "refund_pending" : "pending" });
  } catch {
    res.status(409).json({ state: "review", message: "We could not verify the payment. Check its status before paying again." });
  }
}
