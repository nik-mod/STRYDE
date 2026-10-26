# STRYDE Store Setup Checklist

Everything a merchant must configure in **Shopify Admin** (or with providers)
before real trading. The theme code needs no changes for any item here.
Items marked ⚠ require external approval or credentials.

## 1. Store basics
- [ ] Settings → General: store name, legal business name, contact email,
      phone. The theme displays `shop.name`; nothing is invented.
- [ ] Set store currency to **GEL** (Settings → General). All theme prices use
      Shopify money filters and follow automatically.
- [ ] Online Store → Domains: connect the production domain.

## 2. Products & sizing
- [ ] Create real products with **two options**: `Colour` (or `Color`) and
      `Size` (EU values). The theme renders a colour group + EU size grid
      automatically from `product.options_with_values`.
- [ ] Set compare-at prices for sale items (sale badge + strikethrough appear
      automatically from real data).
- [ ] Upload photography per variant where colour-specific imagery matters.
- [ ] Fill the product `Materials` metafield (`custom.materials`) if you want
      the materials accordion.
- [ ] Inventory: enable tracking per variant so sold-out sizes disable
      themselves honestly.

## 3. Collections, search & discovery
- [ ] Create collections (e.g. "All", "Runners", "New in").
- [ ] Search & Discovery app (free): add filters (Size, Colour, Availability,
      Price) — the collection page renders native filters automatically.
- [ ] Search & Discovery: configure product recommendations (related) — the
      product page loads them via Shopify's engine when data exists.

## 4. Pages & policies (Settings → Policies / Online Store → Pages)
- [ ] Write Refund, Privacy, Terms, Shipping, Contact-information policies.
      They appear at `/policies/*` and in the footer automatically.
- [ ] Create a page (e.g. "Contact") and assign the **contact** template →
      native contact form.
- [ ] Create a page "FAQ" with the **faq** template → add Q&A blocks in the
      theme editor.
- [ ] Create a page "Size guide" with the **size-guide** template → add
      EU/US/UK/CM rows in the theme editor, then select that page in the
      product section's "Size guide page" setting.
- [ ] Fill the product-section trust notes (sizing/delivery/returns/support)
      only when the claims are real.

## 5. Shipping (nationwide Georgia)
- [ ] Settings → Shipping and delivery: create a Georgia shipping zone
      (Tbilisi, Batumi, Kutaisi, Rustavi and the rest of Georgia are covered
      by one GE zone).
- [ ] Define rates (flat/tiered/weight-based). Never invent transit promises;
      the theme intentionally shows "calculated at checkout".
- [ ] Optional: set a free-shipping threshold and enter the same amount in the
      cart drawer section setting — the progress bar uses your number.
- [ ] Decide local delivery/pickup (Shopify Local pickup) if wanted.

## 6. Payments ⚠
See `docs/PAYMENTS-GEORGIA.md` for the verified comparison.
- [ ] Immediate: enable manual **Cash on Delivery** and/or **Bank Transfer**
      with customer instructions (fee-exempt).
- [ ] Recommended gateway: **Flitt Payments** (TBC account + Georgian business
      registration + app install) or **UniPAY Checkout**.
- [ ] Enable "Show supported payment icons" — the footer renders them.
- [ ] Test with the provider's sandbox, then one real low-value order + refund.

## 7. Checkout & accounts
- [ ] Settings → Checkout: customer accounts **optional** (guest checkout
      available; both account modes are supported by the theme).
- [ ] Configure order confirmation email branding; optionally a thank-you
      page script (Settings → Checkout → Additional scripts).

## 8. Localization
- [ ] Settings → Languages: publish **Georgian** (theme ships `locales/ka.json`,
      fully mirrored with English) and optionally English.
- [ ] Translate any merchant-authored content (policies, pages, product
      descriptions) in Admin.

## 9. Taxes & legal ⚠
- [ ] Settings → Taxes: Georgian VAT rules — confirm with your accountant.
- [ ] Legal review of policies and consumer-rights disclosures for Georgia.

## 10. Launch verification (development store first)
- [ ] `npm run build && npm test && npm run validate` all green.
- [ ] Push theme to a development store; run a full purchase with a test
      payment; verify order email, order status page, and a refund.
- [ ] Only then publish the theme to the live store.
