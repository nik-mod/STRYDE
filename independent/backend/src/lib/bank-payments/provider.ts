import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils";
import type {
  InitiatePaymentInput, InitiatePaymentOutput, AuthorizePaymentInput, AuthorizePaymentOutput,
  CapturePaymentInput, CapturePaymentOutput, CancelPaymentInput, CancelPaymentOutput,
  DeletePaymentInput, DeletePaymentOutput, GetPaymentStatusInput, GetPaymentStatusOutput,
  RetrievePaymentInput, RetrievePaymentOutput, UpdatePaymentInput, UpdatePaymentOutput,
  RefundPaymentInput, RefundPaymentOutput, ProviderWebhookPayload, WebhookActionResult,
} from "@medusajs/framework/types";
import { BankClient, assertReceipt, bankId, bankRedirect, money, sessionId, type BankReceipt, type BankSession } from "./client";
import type { BankOptions } from "./config";
import { operationStore, performOnce, type OperationStore } from "./operations";

export function storedSession(data: Record<string, unknown> | undefined, bank: BankOptions["bank"]): BankSession {
  if (!data || typeof data.currency !== "string") throw new Error("Stored bank session is missing");
  return {
    bank_id: bankId(data.bank_id), session_id: sessionId(data.session_id), amount: money(data.amount),
    currency: data.currency.toUpperCase(), redirect_url: bankRedirect(bank, data.redirect_url),
  };
}
function medusaStatus(receipt: BankReceipt): PaymentSessionStatus {
  switch (receipt.status) {
    case "captured": return PaymentSessionStatus.CAPTURED;
    case "canceled": return PaymentSessionStatus.CANCELED;
    case "error": case "refunded": case "refund_pending": return PaymentSessionStatus.ERROR;
    default: return PaymentSessionStatus.PENDING;
  }
}

export abstract class HostedBankProvider extends AbstractPaymentProvider<BankOptions> {
  protected client: BankClient;
  protected operations: OperationStore = operationStore;
  constructor(cradle: Record<string, unknown>, protected options: BankOptions) {
    super(cradle, options);
    this.client = new BankClient(options);
  }
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    // Medusa inserts this session ID after creating the database row. Other
    // client-supplied fields, totals, URLs and bank identifiers are never copied.
    const ref = sessionId(input.data?.session_id);
    const data = await performOnce(this.operations, `session:${ref}`, { session_id: ref, amount: money(input.amount), currency: input.currency_code.toUpperCase() },
      () => this.client.create(ref, input.amount, input.currency_code));
    return { id: data.bank_id, data: { ...data }, status: PaymentSessionStatus.PENDING };
  }
  protected async checked(data: Record<string, unknown> | undefined) {
    const session = storedSession(data, this.options.bank);
    const receipt = await this.client.retrieve(session.bank_id);
    assertReceipt(receipt, session);
    return { session, receipt };
  }
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { session, receipt } = await this.checked(input.data);
    return { data: { ...session }, status: medusaStatus(receipt) };
  }
  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return this.authorizePayment(input);
  }
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const { session } = await this.checked(input.data);
    // Never store raw receipts (which can contain payer/card details) in Medusa.
    return { data: { ...session } };
  }
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const { session, receipt } = await this.checked(input.data);
    if (receipt.status !== "captured") throw new Error("Bank payment has not been captured");
    // Both adapters request automatic capture. No second bank charge is made.
    return { data: { ...session } };
  }
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const { session, receipt } = await this.checked(input.data);
    if (money(input.amount) !== session.amount || input.currency_code.toUpperCase() !== session.currency)
      throw new Error("A hosted payment total cannot be changed; reconcile the old bank session first");
    return { data: { ...session }, status: medusaStatus(receipt) };
  }
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const { session, receipt } = await this.checked(input.data);
    if (!["error", "canceled"].includes(receipt.status))
      throw new Error("Bank payment must expire or be reconciled before cancellation; captured payments require a refund");
    return { data: { ...session } };
  }
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input);
  }
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { session, receipt } = await this.checked(input.data);
    if (money(input.amount) !== session.amount) throw new Error("Only a full bank refund is supported; partial refunds require manual review");
    const key = `refund:${this.options.bank}:${session.bank_id}`;
    const existing = await this.operations.get(key);
    if (!existing) {
      if (receipt.status !== "captured" || receipt.refundedAmount) throw new Error("Payment is not eligible for a full automated refund");
      await performOnce(this.operations, key, { session_id: session.session_id, amount: session.amount },
        () => this.client.requestFullRefund(session.bank_id, session.amount, key));
    }
    // Async acknowledgements are NOT completed refunds. Repeating the same
    // Medusa refund after bank confirmation reuses this ledger entry, never POSTs again.
    const confirmed = await this.client.retrieve(session.bank_id);
    assertReceipt(confirmed, session);
    if (confirmed.status !== "refunded" || confirmed.refundedAmount !== session.amount)
      throw new Error("Bank refund is pending reconciliation; do not submit another bank refund");
    await this.operations.save(key, "confirmed", { session_id: session.session_id, amount: session.amount });
    return { data: { ...session } };
  }
  async getWebhookActionAndData(_payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    // Use /hooks/stryde-payments/:bank, which verifies against the stored Medusa
    // session (including currency/total/provider/bank ID) before running a workflow.
    return { action: "not_supported" };
  }
}
