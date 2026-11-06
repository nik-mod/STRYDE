import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { IPaymentModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { processPaymentWorkflow } from "@medusajs/medusa/core-flows";
import { bankOptions, type Bank } from "../../../../lib/bank-payments/config";
import { callbackClient, verifyBankCallback } from "../../../../lib/bank-payments/callback";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bank = req.params.bank as Bank;
  if (bank !== "tbc" && bank !== "bog") { res.sendStatus(404); return; }
  const options = bankOptions(bank);
  if (!options) { res.status(503).json({ message: "Bank integration is not configured" }); return; }
  const payment = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT);
  try {
    const receipt = await verifyBankCallback(bank, req.rawBody, req.headers, callbackClient(options),
      id => payment.retrievePaymentSession(id));
    if (receipt.status === "captured") {
      // Medusa uses a cart lock and idempotent authorization/capture. Do not
      // create orders manually or trust a browser's success query parameter.
      await processPaymentWorkflow(req.scope).run({ input: {
        action: "captured", data: { session_id: receipt.sessionId, amount: receipt.amount },
      } });
    }
    // Pending/failed/refunded notifications never run order completion. Automated
    // refund reconciliation is deliberately blocked in the provider adapter.
    res.sendStatus(200);
  } catch {
    // No bank response, token, raw callback or payer details in application logs.
    // Non-200 allows notification retries; transient failures cannot mark paid.
    res.status(503).json({ message: "Bank payment could not be verified or reconciled" });
  }
}
