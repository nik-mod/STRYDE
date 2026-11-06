import { createHash, verify } from "node:crypto";
import type { Bank, BankOptions } from "./config";
import { httpsUrl } from "./config";

export type BankStatus = "pending" | "captured" | "error" | "canceled" | "refunded" | "refund_pending";
export interface BankReceipt {
  bankId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: BankStatus;
  refundedAmount?: number;
}
export interface BankSession {
  bank_id: string;
  session_id: string;
  amount: number;
  currency: string;
  redirect_url: string;
}

// Public verification key published by BOG, checked 2026-11-06. Never replace
// this with a key supplied by a request or use JSON.stringify(body) for verification.
export const BOG_CALLBACK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

export function verifyBogSignature(raw: string | Buffer, signature: unknown, key = BOG_CALLBACK_PUBLIC_KEY): boolean {
  if (typeof signature !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature) || signature.length > 1024)
    return false;
  try { return verify("RSA-SHA256", Buffer.from(raw), key, Buffer.from(signature, "base64")); }
  catch { return false; }
}

// Medusa v2 amounts and bank amounts are major units (140 USD = 140, not 14000).
// All currencies enabled here have two fractional digits. Reject, never truncate.
export function money(value: unknown, allowZero = false): number {
  // Medusa can pass BigNumber or its serialized { value, precision } form.
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const big = value as { numeric?: unknown; value?: unknown };
    value = typeof big.numeric === "number" ? big.numeric : big.value;
  }
  if ((typeof value !== "string" && typeof value !== "number")
      || (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value)))
    throw new Error("Invalid payment amount");
  const number = Number(value);
  if (!Number.isFinite(number) || number > 1_000_000_000 || number < (allowZero ? 0 : 0.01)
      || Math.abs(number * 100 - Math.round(number * 100)) > 0.00001)
    throw new Error("Invalid payment amount or precision");
  return Math.round(number * 100) / 100;
}

export function bankId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,120}$/.test(value))
    throw new Error("Invalid bank payment identifier");
  return value;
}
export function sessionId(value: unknown): string {
  if (typeof value !== "string" || !/^payses_[A-Za-z0-9]{1,100}$/.test(value))
    throw new Error("Invalid payment session reference");
  return value;
}
export function bankRedirect(bank: Bank, value: unknown): string {
  const url = new URL(httpsUrl(value));
  const hosts = bank === "tbc" ? ["tpay.tbcbank.ge", "ecom.tbcpayments.ge"] : ["payment.bog.ge"];
  if (!hosts.includes(url.hostname) || (url.port && url.port !== "443"))
    throw new Error("Unexpected bank checkout host");
  return url.href;
}

// BOG requires UUIDv4 idempotency keys. Deterministic for a Medusa operation,
// different for every different operation. Do not generate a new key on retry.
export function operationKey(id: string): string {
  const bytes = createHash("sha256").update(id).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function assertReceipt(receipt: BankReceipt, expected: Pick<BankSession, "bank_id" | "session_id" | "amount" | "currency">) {
  if (receipt.bankId !== expected.bank_id || receipt.sessionId !== expected.session_id
      || money(receipt.amount) !== money(expected.amount)
      || receipt.currency !== expected.currency.toUpperCase())
    throw new Error("Bank payment does not match the stored payment session");
}

function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid bank response");
  return value as Record<string, any>;
}

export class BankClient {
  private token?: { value: string; expiresAt: number };
  private tokenRequest?: Promise<string>;
  constructor(readonly options: BankOptions, private readonly request: typeof fetch = fetch) {
    if (options.mode !== "sandbox" || !options.clientId || !options.clientSecret || !options.currencies.length
        || (options.bank === "tbc" && !options.apiKey)) throw new Error("Bank sandbox configuration is incomplete");
    httpsUrl(options.callbackUrl);
    httpsUrl(options.returnUrl);
  }

  private async http(url: string, init: RequestInit): Promise<Record<string, any>> {
    let response: Response;
    try {
      response = await this.request(url, { ...init, redirect: "error", signal: AbortSignal.timeout(10_000) });
    } catch {
      // A timed-out creation may already exist at the bank. Never retry it here.
      throw new Error("Bank connection failed; payment outcome must be checked before retrying");
    }
    if (!response.ok) throw new Error(`Bank request failed (HTTP ${response.status})`);
    try { const text = await response.text(); return text.trim() ? object(JSON.parse(text)) : {}; }
    catch { throw new Error("Invalid bank response"); }
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    if (this.tokenRequest) return this.tokenRequest;
    this.tokenRequest = (async () => {
      const { bank, clientId, clientSecret, apiKey } = this.options;
      const tbc = bank === "tbc";
      const data = await this.http(tbc ? "https://api.tbcbank.ge/v1/tpay/access-token"
        : "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded",
          ...(tbc ? { apikey: apiKey! } : { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` }) },
        body: new URLSearchParams(tbc ? { client_id: clientId, client_secret: clientSecret } : { grant_type: "client_credentials" }),
      });
      if (typeof data.access_token !== "string" || !data.access_token || !Number.isFinite(Number(data.expires_in)) || Number(data.expires_in) <= 0)
        throw new Error("Invalid bank authentication response");
      this.token = { value: data.access_token, expiresAt: Date.now() + Math.max(0, Math.min(Number(data.expires_in), 3600) - 60) * 1000 };
      return this.token.value;
    })();
    try { return await this.tokenRequest; } finally { this.tokenRequest = undefined; }
  }

  private async api(path: string, method = "GET", body?: unknown, key?: string) {
    const token = await this.accessToken();
    const tbc = this.options.bank === "tbc";
    return this.http(`${tbc ? "https://api.tbcbank.ge/v1/tpay" : "https://api.bog.ge/payments/v1"}${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json",
        ...(tbc ? { apikey: this.options.apiKey! } : { "Accept-Language": "en", ...(key ? { "Idempotency-Key": key } : {}) }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  async create(reference: string, amountInput: unknown, currencyInput: string): Promise<BankSession> {
    const ref = sessionId(reference), amount = money(amountInput), currency = currencyInput.toUpperCase();
    if (!this.options.currencies.includes(currency)) throw new Error("Currency is not enabled for this merchant");
    const returnUrl = new URL(this.options.returnUrl);
    returnUrl.searchParams.set("payment_session", ref);
    const tbc = this.options.bank === "tbc";
    const data = await this.api(tbc ? "/payments" : "/ecommerce/orders", "POST", tbc ? {
      amount: { currency, total: amount }, returnurl: returnUrl.href, callbackUrl: this.options.callbackUrl,
      preAuth: false, language: "EN", merchantPaymentId: ref, extra2: ref,
      methods: [5], saveCard: false, expirationMinutes: 12, description: "STRYDE sneakers",
    } : {
      callback_url: this.options.callbackUrl, external_order_id: ref, capture: "automatic", ttl: 12,
      payment_method: ["card"],
      // The provider only receives a trusted Medusa payment total. This is an
      // aggregate checkout line, not fabricated per-product prices or tax data.
      purchase_units: { currency, total_amount: amount, basket: [{ product_id: ref, description: "STRYDE checkout", quantity: 1, unit_price: amount }] },
      redirect_urls: { success: returnUrl.href, fail: returnUrl.href },
    }, operationKey(`create:${ref}`));
    const id = bankId(tbc ? data.payId : data.id);
    if (tbc && (data.currency !== currency || money(data.amount) !== amount || data.status !== "Created"))
      throw new Error("Unexpected TBC payment creation response");
    const redirect = tbc ? (Array.isArray(data.links) ? data.links.find(link => link.rel === "approval_url")?.uri : undefined)
      : data._links?.redirect?.href;
    return { bank_id: id, session_id: ref, amount, currency, redirect_url: bankRedirect(this.options.bank, redirect) };
  }

  async retrieve(idInput: string): Promise<BankReceipt> {
    const id = bankId(idInput), tbc = this.options.bank === "tbc";
    const data = await this.api(tbc ? `/payments/${id}` : `/receipt/${id}`);
    const status = tbc ? data.status : data.order_status?.key;
    const statuses: Record<string, BankStatus> = tbc ? {
      Created: "pending", Processing: "pending", Succeeded: "captured", Failed: "error", Expired: "canceled",
      WaitingConfirm: "pending", CancelPaymentProcessing: "pending", PaymentCompletionProcessing: "pending",
      Returned: "refunded", PartialReturned: "refunded",
    } : { created: "pending", processing: "pending", completed: "captured", rejected: "error",
      refund_requested: "refund_pending", refunded: "refunded", refunded_partially: "refunded",
      auth_requested: "pending", blocked: "pending", partial_completed: "pending" };
    if (!Object.hasOwn(statuses, status)) throw new Error("Unknown bank payment status");
    const result: BankReceipt = {
      bankId: bankId(tbc ? data.payId : data.order_id),
      sessionId: sessionId(tbc ? data.extra2 : data.external_order_id),
      amount: money(tbc ? data.amount : data.purchase_units?.request_amount),
      currency: tbc ? data.currency : data.purchase_units?.currency_code,
      status: statuses[status],
      refundedAmount: money((tbc ? data.returnedAmount : data.purchase_units?.refund_amount) ?? 0, true),
    };
    if (result.bankId !== id || !this.options.currencies.includes(result.currency)) throw new Error("Unexpected bank payment details");
    if (result.status === "captured") {
      if (tbc && data.preAuth !== false) throw new Error("Unexpected pre-authorized TBC payment");
      if (!tbc && (data.capture !== "automatic" || money(data.purchase_units?.transfer_amount) !== result.amount))
        throw new Error("Bank has not captured the full requested amount");
    }
    return result;
  }

  async requestFullRefund(id: string, amount: number, operation: string): Promise<{ accepted: true; actionId?: string }> {
    const tbc = this.options.bank === "tbc";
    const result = await this.api(tbc ? `/payments/${bankId(id)}/cancel` : `/payment/refund/${bankId(id)}`, "POST", { amount: money(amount) }, operationKey(operation));
    if (!tbc && (result.key !== "request_received" || typeof result.action_id !== "string")) throw new Error("Refund acknowledgement is invalid; reconciliation is required");
    return { accepted: true, ...(!tbc ? { actionId: result.action_id } : {}) };
  }
}
