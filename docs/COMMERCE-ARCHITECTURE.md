# STRYDE Commerce Architecture

How the cinematic storefront talks to Shopify. Shopify stays the source of
truth for products, variants, inventory, prices, discounts, cart, checkout,
orders and customers; the theme renders and never computes commerce truth.

## Layers

```
Liquid sections/snippets        src/ modules (bundled by esbuild → assets/theme.js)
─────────────────────────       ─────────────────────────────────────────────────
main-product.liquid             variant-picker.mjs   option matrix (size × colour)
 └ variant-picker.liquid        product-form.mjs     AJAX add, sticky bar, errors
cart-drawer.liquid (all pages)  cart.mjs             Cart Ajax client (serialized)
main-cart.liquid                cart-drawer.mjs      drawer controller + shared client
main-collection / main-search   cart-page.mjs        cart page AJAX re-render
product-recommendations.liquid  predictive-search.mjs /search/suggest enhancement
customers/* templates           commerce.mjs         orchestration + recommendations
```

## Cart flow (production)

1. Buy box submit → `product-form.mjs` validates the selected variant and
   hands `{id, quantity}` to the shared cart client (`cart.mjs`).
2. The client serializes every mutation through a single promise queue
   (double-clicks and quantity races can never interleave) and POSTs to
   Shopify's Cart Ajax API: `/cart/add.js`, `/cart/change.js`, `/cart.js`.
3. Each response dispatches `stryde:cart:change`; header counts
   (`[data-cart-count]`) and the live region (`#CartStatus`) update from it.
4. Drawer and cart page re-render through the **Section Rendering API**
   (`/?sections=cart-drawer`, `/cart?sections=main-cart`), so every subtotal,
   discount and translation is formatted by Liquid, never by client code.
5. On failure the client refetches `/cart.js` (authoritative state wins) and
   surfaces the store's own error message inline.

## Variants

`variant-picker.mjs` implements a three-state availability matrix:
`available` (in stock in this combination), `partial` (sold out under the
current other selection but purchasable in another — clickable, de-emphasised,
clicking relaxes conflicting selections), `unavailable` (sold out everywhere it
exists — disabled). The native `<select name="id">` stays the submitted input
and the no-JS path; the URL deep link (`?variant=`) always mirrors the
selection via `history.replaceState`.

## Checkout

Cart drawer and cart page link/submit to `routes.checkout_url` — Shopify's
hosted checkout only. The theme never collects card data, contains no gateway
credentials, and never marks orders paid from frontend state. Payment provider
configuration: see `docs/PAYMENTS-GEORGIA.md`.

## Customer accounts

Classic Liquid templates (`templates/customers/*`) cover sign-in,
registration, password recovery, activation, order history, order detail and
an address book. If the merchant enables new (hosted) customer accounts,
Shopify routes authentication there and these templates stop being used —
either mode works without theme changes. Guest checkout always remains
available.

## Local development (npm run dev)

`tools/preview.mjs` renders the same Liquid through liquidjs with deterministic
fixtures and an **in-memory mock cart** implementing the same Cart Ajax API
endpoints plus `?sections=` section rendering — the storefront JavaScript runs
one code path in preview and production. The preview labels itself
("SIMULATED COMMERCE · NO PAYMENTS OR ORDERS"), intercepts the checkout link
with an explicit no-order notice, and never simulates a successful payment.
Mock state resets on server restart; `?fixtures=1` resets it to one known
line.

## Testing

- `tests/commerce.test.mjs` — variant matrix, availability states, relaxation,
  cart client serialization/race/error taxonomy, section fetching.
- `tests/preview-commerce.test.mjs` — mock cart API contracts, section
  rendering, honest labels, checkout link integrity, Georgian locale parity.
- `tools/validate.mjs` — template/section/locale presence plus the original
  structural rules; `npm run theme:check` — Shopify Theme Check (clean except
  one intentional preview-only snippet warning).
