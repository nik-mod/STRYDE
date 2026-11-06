export type BankChoice = { id: "pp_tbc_tbc" | "pp_bog_bog"; name: string; mode: "sandbox" };
export type PaymentState = "not_started" | "pending" | "confirmed" | "declined" | "expired" | "review" | "refunded" | "refund_pending";
export interface PaymentResult { state: PaymentState; message?: string; order?: { reference: number; total: number; currency_code: string } }
export function bankCheckoutEnabled(env: Record<string, string | undefined> = process.env) {
  return env.NODE_ENV !== "production" && env.STRYDE_TEST_MODE === "true" && env.STRYDE_BANK_SANDBOX_UI === "true";
}
export function checkoutRedirect(value: unknown, provider: string): string {
  if (typeof value !== "string") throw new Error("Bank checkout link is unavailable.");
  const url = new URL(value);
  const allowed = provider === "pp_tbc_tbc" ? ["tpay.tbcbank.ge", "ecom.tbcpayments.ge"] : provider === "pp_bog_bog" ? ["payment.bog.ge"] : [];
  if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443") || !allowed.includes(url.hostname)) throw new Error("Bank checkout link could not be verified.");
  return url.href;
}
export const paymentCopy: Record<PaymentState, { title: string; text: string }> = {
  not_started: { title: "Choose how to pay.", text: "Continue to the bank’s secure page to enter your card details." },
  pending: { title: "Waiting for the bank.", text: "Your payment is still processing. Check its status before trying another payment." },
  confirmed: { title: "Your order is confirmed.", text: "The bank confirmed your payment and your order has been recorded." },
  declined: { title: "Payment was declined.", text: "The bank did not approve this payment. Review your card details with your bank before trying again." },
  expired: { title: "This payment has expired.", text: "The bank’s payment session has ended. Return to your bag to review your next step." },
  review: { title: "Let’s check this first.", text: "We couldn’t safely confirm the outcome. Do not pay again while this payment is being reviewed." },
  refunded: { title: "Your payment was refunded.", text: "The bank reports a refund. The time it takes to appear on your card depends on your issuing bank." },
  refund_pending: { title: "Your refund is processing.", text: "The bank has received the refund request. It has not yet confirmed completion." },
};
