import test from "node:test";
import assert from "node:assert/strict";
import { bankCheckoutEnabled, checkoutRedirect, paymentCopy } from "../src/lib/hosted-payment";
test("bank UI requires explicit development sandbox mode and cannot open production payments", () => {
  assert.equal(bankCheckoutEnabled({}), false);
  assert.equal(bankCheckoutEnabled({ NODE_ENV: "production", STRYDE_TEST_MODE: "true", STRYDE_BANK_SANDBOX_UI: "true" }), false);
  assert.equal(bankCheckoutEnabled({ NODE_ENV: "development", STRYDE_TEST_MODE: "true", STRYDE_BANK_SANDBOX_UI: "true" }), true);
});
test("hosted checkout rejects an arbitrary or mismatched redirect even if the server response is compromised", () => {
  assert.equal(checkoutRedirect("https://payment.bog.ge/?order_id=one", "pp_bog_bog"), "https://payment.bog.ge/?order_id=one");
  for (const link of ["https://payment.bog.ge.evil.example/", "javascript:alert(1)", "https://u:p@payment.bog.ge/", "https://tpay.tbcbank.ge/checkout/one", "https://payment.bog.ge:444/"])
    assert.throws(() => checkoutRedirect(link, "pp_bog_bog"));
});
test("uncertain and processing payment states never present confirmation or invite another charge", () => {
  for (const state of ["pending", "review", "refund_pending"] as const) assert.notEqual(paymentCopy[state].title, paymentCopy.confirmed.title);
  assert.match(paymentCopy.review.text, /Do not pay again/);
  assert.match(paymentCopy.refund_pending.text, /not yet confirmed/);
});
