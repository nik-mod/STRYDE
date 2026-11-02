import "server-only";
import { isTestMode } from "./policy";
import { medusa, CommerceError } from "./medusa";
import type { Cart } from "./types";
// Add a bank adapter only after merchant approval, using the bank's supported
// hosted redirect and verified callbacks. Never use browser returns as payment proof.
export interface PaymentAdapter {
  readonly id: string;
  readonly mode: "test" | "live";
  initialize(cart: Cart): Promise<void>;
}
const development: PaymentAdapter = {
  id: "pp_system_default",
  mode: "test",
  async initialize(cart) {
    if (!isTestMode())
      throw new CommerceError("Live payments are not enabled.", 403);
    const collection =
      cart.payment_collection ||
      (
        await medusa<{ payment_collection: { id: string } }>(
          "/payment-collections",
          { cart_id: cart.id },
        )
      ).payment_collection;
    await medusa(`/payment-collections/${collection.id}/payment-sessions`, {
      provider_id: "pp_system_default",
    });
  },
};
export function paymentAdapter(): PaymentAdapter {
  if (isTestMode()) return development;
  throw new CommerceError(
    "Checkout will be available after the merchant payment provider is approved and configured.",
    403,
  );
}
