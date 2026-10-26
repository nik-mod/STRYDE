# STRYDE — Payment Providers for a Georgian Shopify Store

Researched and verified against official sources on 2026-10-26. This document
compares the realistic ways a Shopify store registered in Georgia (Tbilisi,
GEL) can accept payments, and lists the exact activation steps for each.
Nothing here is activated yet — every path requires merchant action in Shopify
Admin and/or with the provider.

**The theme's role is done:** the storefront hands off to Shopify's hosted
checkout through `routes.checkout_url` (cart drawer and cart page). The theme
never collects card data, never stores payment secrets, and never marks orders
as paid. Payment configuration lives entirely in Shopify Admin.

---

## 1. Verified situation

| Question | Answer | Source |
| --- | --- | --- |
| Is Shopify Payments available in Georgia? | **No.** Georgia is not on the supported-countries list. | help.shopify.com — Shopify Payments supported countries |
| What does Shopify's Georgia gateway list include? | **UniPAY Checkout** and **PayPal Express Checkout** are the Georgia-tagged entries; a shared global list adds ~60 more. | shopify.com/payment-gateways/georgia |
| Are manual methods (Cash on Delivery, bank transfer) supported? | **Yes**, custom manual methods included, and manual payments are **exempt** from Shopify third-party transaction fees. | help.shopify.com — manual payments |
| Do external gateways cost extra? | **Yes.** Third-party transaction fees apply by plan: Basic 2%, Grow 1%, Advanced 0.6%, Plus 0.2%. | shopify.com/pricing + help.shopify.com third-party transaction fees |

## 2. Provider comparison

### Flitt Payments — TBC-affiliated PSP (strongest verified Shopify path)

- **What:** online gateway operated by TPAY LLC (reg. 0100-7704), affiliated
  with TBC Bank; serves businesses registered in Georgia (also UZ/MD/AM).
- **Shopify compatibility:** official app — **"Flitt Payments"** on the Shopify
  App Store (apps.shopify.com/flitt-payments). Visa, Mastercard, Apple Pay,
  Google Pay, bank transfer.
- **Requires:** Georgian business registration, **active TBC bank account**,
  onboarding/verification at portal.flitt.com.
- **Published fees (flitt.com/pricing, GEL volume tiers):** Starter 2.2%
  domestic / 2.5% international cards; Growth 2.0% / 2.5%; Enterprise custom.
  Payouts within 24h. **GEL, USD, EUR** settlement.
- **Activation:** register at portal.flitt.com → complete verification →
  install the "Flitt Payments" app in Shopify → connect credentials → enable
  wallets in Flitt portal. Shopify's third-party transaction fee still applies.

### UniPAY Checkout — on Shopify's official Georgia list

- **What:** Georgian PSP; the gateway Shopify itself lists for Georgia.
- **Methods:** Visa, Mastercard, AMEX, Google Pay, Apple Pay
  (unipay.com/shopify).
- **Published pricing (unipay.com/pricing):** activation 48 GEL one-time;
  domestic Visa/MC 2.5% + 0.25 GEL; wallets 3.0% + 0.25 GEL; AMEX 4.0% +
  0.35 GEL; international Visa/MC 3.0% + 0.35 GEL; payouts every second day.
- **Activation:** create UniPAY Business Account → verification → in Shopify
  Admin → Settings → Payments search "UniPAY checkout" → install → enter
  Merchant ID + KEY.

### PayWise — third-party connector for Bank of Georgia (not a bank product)

- **What:** paywise.ge — a Georgian-language paid bridge that connects Bank of
  Georgia acquiring to Shopify. Currently supports BOG only.
- **Requires:** Bank of Georgia business account + online payments enabled in
  BOG Business Manager + bank-issued Public/Secret keys.
- **Fees:** PayWise charges annually (349 GEL/yr cards, 449 GEL/yr
  installments, 59 GEL/yr extras like Apple Pay); bank acquiring commission is
  separate.
- **Caution:** PayWise markets that merchants "avoid Shopify's extra 2%".
  This contradicts Shopify's official policy (third-party fees apply whenever
  an external gateway processes). Budget for the fee regardless.

### TBC TPay / UFC — no first-party Shopify plugin

- TBC's gateway is **TPay** (developers.tbcbank.ge, GEL/USD/EUR, Apple Pay).
  TBC's developer documentation lists no Shopify integration. The practical
  TBC route on Shopify is **Flitt** (above).
- **UFC** (United Financial Corporation) advertises acquiring but shows no
  Shopify integration; relationship to TBC is not stated. **Not verified.**

### PayPal

- Listed by Shopify for Georgia (Express Checkout) and PayPal markets business
  accounts at paypal.com/ge/business. Whether a Georgian entity can receive
  and withdraw is **not verified from official sources** — confirm with PayPal
  directly before relying on it.

### Manual methods — Cash on Delivery & Bank Transfer

- Native Shopify support: Settings → Payments → Manual payment methods.
  COD and bank transfer are common and trusted in Georgia; orders arrive
  **pending/unpaid** and staff marks them paid after settlement. **No
  third-party transaction fees.**

## 3. Recommendation (in activation order)

1. **Cash on Delivery + Bank Transfer (manual)** — zero approvals, live in
   minutes, fee-exempt, matches Georgian shopping habits.
2. **Flitt Payments** — official Shopify app, TBC settlement in GEL,
   cards + Apple Pay/Google Pay. Best automated option for a TBC-banked
   merchant.
3. **UniPAY Checkout** as a comparison quote (or primary if the merchant banks
   elsewhere and prefers Shopify-listed providers).
4. **PayPal** only after confirming receive/withdraw capability with PayPal GE.

## 4. Shopify Admin configuration checklist (merchant)

1. Settings → Payments → add **manual payment methods** (Cash on Delivery,
   Bank Transfer) with customer-facing instructions.
2. Install **Flitt Payments** (or UniPAY) after provider verification; enter
   the credentials the provider issues — never paste provider secrets into
   theme files.
3. Settings → Payments → show supported payment icons (the theme renders
   `shop.enabled_payment_types` in the footer automatically).
4. Settings → Checkout → customer accounts: choose **accounts optional**
   (guest checkout stays available — the theme supports both).
5. Test with the provider's sandbox/test mode first; in production verify a
   real low-value order and refund it before announcing launch.

## 5. What the theme guarantees (and never does)

- Hands off to **Shopify-hosted checkout only** — no custom card collection,
  no payment fields, no client-side secrets.
- The local development preview **simulates the cart API only**; its checkout
  is intercepted with an explicit "no order is created" notice. Simulated
  payments do not exist anywhere in this repository.
- Order payment status shown to customers comes from Shopify order data, never
  from frontend redirects.
