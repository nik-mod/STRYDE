# Contact delivery

The Contact page posts JSON to `/api/contact`. The server validates fields, origin, body size, a signed expiring form token and the hidden spam field before calling Resend. It sends plain text to a fixed server-configured inbox; the visitor is only the reply-to address. A success state requires an accepted provider response containing an email ID. Acceptance does not guarantee inbox delivery.

Set these server environment values, then restart the storefront:

- `RESEND_API_KEY`: sending access for the verified domain.
- `CONTACT_FROM_EMAIL`: an address on that verified domain, without a display name.
- `CONTACT_TO_EMAIL`: the inbox that receives enquiries.
- `CONTACT_FORM_SECRET`: at least 32 random characters. If omitted, the existing `CART_COOKIE_SECRET` is used with a separate signing prefix.
- `SITE_URL`: the exact public origin, including HTTPS, already required by the store.
- `STRYDE_CONTACT_EMAIL`: optional public email displayed on Contact. It is separate from the private delivery inbox.

With missing or invalid configuration, the page explains that sending is unavailable and the POST endpoint returns 503. No message is stored or falsely acknowledged. No addresses or business details are invented. The form stays readable without animation; it requires JavaScript for submission.

After configuration, test from the actual public origin and verify receipt/reply-to in the designated inbox. This implementation has only been tested with a mocked provider; no real email was sent during development. Follow the official [send-email API](https://resend.com/docs/api-reference/emails/send-email) and verify the sending domain's DNS in your Resend account.

The form token expires after 30 minutes. Expiry refreshes the token and asks the visitor to retry without discarding their text. Duplicate retries use a stable provider idempotency key. The app does not persist message bodies or log provider responses, API keys or visitor data.

Spam controls are deliberately bounded in process: 60 POST attempts per minute per process and 3 delivery attempts per email per 10 minutes. Email fingerprints are HMACs, not clear-text addresses. In production, configure an IP-based contact-route limit at the trusted reverse proxy/WAF across all instances. Do not trust arbitrary forwarding headers. Set provider sending limits and monitor abuse; add a challenge provider if traffic warrants it.

Before public launch, the merchant must approve privacy purposes, email processors, retention periods and contact/business details. Publish those in the structured policy data in `storefront/src/lib/store-information.ts`. The current policy pages describe preparation status, not approved commercial promises.
