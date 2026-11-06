import type { Bank, BankOptions } from "./config";
import { BankClient, assertReceipt, bankId, money, sessionId, verifyBogSignature } from "./client";
import { storedSession } from "./provider";

interface StoredPaymentSession {
  id: string;
  provider_id: string;
  amount: unknown;
  currency_code: string;
  data: Record<string, unknown>;
}
export const bankProviderId = (bank: Bank) => `pp_${bank}_${bank}`;

export async function verifyBankCallback(
  bank: Bank,
  raw: string | Buffer,
  headers: Record<string, unknown>,
  client: Pick<BankClient, "retrieve">,
  retrieveSession: (id: string) => Promise<StoredPaymentSession>,
) {
  if (!raw || Buffer.byteLength(raw) > 16384) throw new Error("Invalid bank callback body");
  if (bank === "bog" && !verifyBogSignature(raw, headers["callback-signature"]))
    throw new Error("Invalid BOG callback signature");
  const body = JSON.parse(raw.toString());
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid bank callback");
  if (bank === "bog" && body.event !== "order_payment") throw new Error("Unsupported bank callback event");
  const id = bankId(bank === "tbc" ? body.PaymentId : body.body?.order_id);
  // TBC notifications are not signed. The posted PaymentId is only a hint;
  // all status, amount, currency and merchant references come from bank GET.
  const receipt = await client.retrieve(id);
  const session = await retrieveSession(sessionId(receipt.sessionId));
  if (session.id !== receipt.sessionId || session.provider_id !== bankProviderId(bank))
    throw new Error("Callback does not belong to this payment provider");
  const stored = storedSession(session.data, bank);
  assertReceipt(receipt, stored);
  if (stored.session_id !== session.id || money(session.amount) !== stored.amount || session.currency_code.toUpperCase() !== stored.currency)
    throw new Error("Stored payment total has changed");
  return receipt;
}

// Cache only server configuration/short-lived bank tokens, never customer data.
const clients = new Map<string, BankClient>();
export function callbackClient(options: BankOptions) {
  const key = options.bank;
  let client = clients.get(key);
  if (!client) { client = new BankClient(options); clients.set(key, client); }
  return client;
}
