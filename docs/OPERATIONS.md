# STRYDE Operations — Running the Store from Shopify Admin

Shopify Admin is the back office. This theme intentionally ships no custom
dashboard; everything below is native Shopify and needs no developer.

## Daily operations

| Task | Where |
| --- | --- |
| Add a product | Products → Add product. Set Colour + Size options; EU sizes as values. |
| Upload photography | Product → Media. The gallery, cards and variant swatch imagery follow automatically. |
| Change prices / sales | Product → Pricing. Compare-at price creates the sale badge. |
| Manage sizes/variants | Product → Variants (add/remove size×colour combinations). |
| Track inventory | Product → Variants → Inventory (enable tracking per variant; sold-out sizes disable themselves in the storefront). |
| Review orders | Orders. Payment status, fulfillment, customer notes all live here. |
| Fulfil an order | Orders → open order → Fulfil items → notify customer (order status page updates automatically). |
| Manage discounts | Discounts → create codes or automatic discounts (sale campaigns, free shipping). The cart shows Shopify's own discount lines. |
| Manage customers | Customers (accounts, addresses, order history). |
| Configure shipping | Settings → Shipping and delivery (zones, rates, thresholds, local pickup). |
| Configure payments | Settings → Payments (+ `docs/PAYMENTS-GEORGIA.md` for providers). |
| Analytics | Analytics → dashboards, reports by product/channel. |

## Theme-side merchant controls (theme editor)

- **Header** — navigation menu, announcement text/link (campaign bar).
- **Cart drawer** — free-shipping threshold number (the rate itself lives in
  Shopify shipping settings).
- **Product** — trust notes (sizing/delivery/returns/support) and the size
  guide page link.
- **FAQ / Size guide pages** — question blocks and size-table rows.
- **Footer** — footer menu (policies appear automatically once written).

## What the theme does vs. what Shopify does

- Theme: presentation, variant picking UX, cart UX, links to checkout,
  account/address/order-history pages, content pages.
- Shopify (authoritative): catalog, inventory, prices, discount math, tax and
  shipping calculation, checkout and payment, order creation, fulfillment,
  refunds, customer records, emails, analytics.

## Refunds, returns, cancellations

Processed in Shopify Admin (Orders → Refund/Cancel). Customer-facing policy
pages come from Settings → Policies. Never promise a refund timeline in theme
copy that the business hasn't approved.

## Order status communication

Shopify hosts the order status page and sends transactional emails. The
customer account area (`/account`) reads live Shopify data — order history and
fulfillment states shown there can never disagree with Admin.

## Local development vs. production

- `npm run dev` — same-Liquid local preview with fixture data and a simulated
  cart (no payments, no orders; clearly labeled on every page).
- A connected development store (`shopify theme dev`) — real Shopify data,
  Shopify's own test checkout. Use this for integration testing before launch.
- Production — publish the theme; the preview-only simulation code never runs
  there (it is injected solely by the local preview server).
