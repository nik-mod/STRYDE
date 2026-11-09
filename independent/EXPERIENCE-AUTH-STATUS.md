# Experience and customer accounts — 6 November 2026

## Implemented

- Larger Account/Search/bag controls, authored SVG icons and mobile touch targets.
- Removed the hero's lower caption, scroll instruction and divider.
- Increased the depth of the existing animated 3D waves without adding another hero renderer or increasing its pixel budget. Original intro and shoe choreography preserved.
- GSAP page-heading and support-content entrances on utility pages; the homepage retains its existing section choreography. Reduced-motion users see static, visible content.
- Sign-in, registration and recovery share a contained animated shoe scene. It pauses offscreen and in hidden tabs, releases GPU resources on unmount and uses the existing product photograph when WebGL is unavailable or reduced motion is requested.
- Customer registration/sign-in use Medusa and the configured Supabase Postgres database. They do **not** create Supabase Auth users. The session token stays in an HttpOnly cookie.
- Recovery requests use Medusa's customer reset-token flow. Links are single use and expire after 15 minutes. The browser removes the token fragment from the address bar; it is not included in HTTP requests or referrers. No reset token is exposed through a public outbox API.

## Verified

Frontend and backend TypeScript checks; existing frontend tests; desktop/mobile route captures with no horizontal overflow or page errors. A real verification customer was registered against the running commerce backend, signed out and signed back in. Its password was reset through the private development email outbox. Reusing the link failed, the previous password failed, and the new password signed in successfully. No real customer credentials were used or changed.

Normal-motion browser captures confirmed that the account WebGL scene and hero animate. Reduced-motion captures use their static fallbacks. This is browser verification, not a device-wide FPS or GPU benchmark.

## Email delivery still requires configuration

No email-provider credentials are configured. **Password changes work with a valid link; customers cannot yet receive those links in their inbox.** Development links are written to the private `independent/.data/emails` directory. Do not publish that directory or share reset-link files.

To enable actual inbox recovery:

1. Verify the STRYDE sending domain with Resend and add its required DNS records.
2. Set backend server variables `AUTH_EMAIL_MODE=resend`, `RESEND_API_KEY`, `AUTH_FROM_EMAIL` and `STOREFRONT_URL` (the public HTTPS storefront origin).
3. Set storefront server variable `AUTH_EMAIL_MODE=resend` only after the backend configuration is ready. Keep provider secrets off the browser and out of Git.
4. Restart the services, request a link for an owned test inbox, confirm receipt and complete a reset. Confirm provider failures are monitored and retried by the production event infrastructure.

Production refuses development-file delivery. A request acknowledgement does not prove inbox delivery: Medusa sends the event asynchronously. Provider acceptance, spam placement and final delivery must be checked with the configured service.

Public production still needs the existing deployment, proxy rate limiting, durable event infrastructure and business/payment readiness work. This pass does not activate payments, approve sample inventory, deploy, or claim that every browser/device has been performance-tested.
