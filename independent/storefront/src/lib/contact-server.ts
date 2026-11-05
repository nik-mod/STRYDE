// Server entry points only. Never import this module from a Client Component.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { contactInput } from "./contact-input";
import { body, RequestError, isStoreOrigin } from "./security";
type Env = Record<string, string | undefined>;
export const deliveryUnavailable = "Message delivery is not connected yet. Your message has not been sent. Please try again once STRYDE opens its contact service.";
export function contactConfig(env: Env = process.env) {
  const from = env.CONTACT_FROM_EMAIL || "", to = env.CONTACT_TO_EMAIL || "";
  const secret = env.CONTACT_FORM_SECRET || env.CART_COOKIE_SECRET || "";
  return { from, to, secret, key: env.RESEND_API_KEY || "", ready: Boolean(env.RESEND_API_KEY && z.email().safeParse(from).success && z.email().safeParse(to).success && secret.length >= 32) };
}
export function publicContactEmail(env: Env = process.env) {
  const email = env.STRYDE_CONTACT_EMAIL || "";
  return z.email().safeParse(email).success ? email : null;
}
export function createContactService({ env = process.env, fetcher = fetch, now = Date.now }: { env?: Env; fetcher?: typeof fetch; now?: () => number } = {}) {
  const attempts = new Map<string, { count: number; reset: number }>();
  let windowStart = 0, requests = 0;
  const sign = (value: string) => createHmac("sha256", contactConfig(env).secret).update(`stryde-contact:${value}`).digest("base64url");
  const token = () => {
    if (contactConfig(env).secret.length < 32) return "";
    const value = `${now()}.${randomUUID()}`;
    return `${value}.${sign(value)}`;
  };
  const response = (value: unknown, status = 200, retryAfter = 60) => Response.json(value, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": String(retryAfter) } : {}) } });
  const get = () => response({ ready: contactConfig(env).ready, token: token() });
  async function post(request: Request) {
    try {
      if (!isStoreOrigin(request, env)) throw new RequestError("Please submit the form from STRYDE.", 403);
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("JSON required.", 415);
      const time = now();
      if (time - windowStart >= 60000) { windowStart = time; requests = 0; }
      if (++requests > 60) throw new RequestError("The contact service is busy. Please wait a minute and try again.", 429);
      const parsed = contactInput.safeParse(await body(request, z.unknown()));
      if (!parsed.success) return response({ error: "Check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, 422);
      const value = parsed.data;
      if (value.website) throw new RequestError("This message could not be submitted.");
      const config = contactConfig(env);
      if (!config.ready) return response({ error: deliveryUnavailable }, 503);
      const [issued, nonce, signature, extra] = value.token.split(".");
      const expected = sign(`${issued}.${nonce}`);
      if (extra !== undefined || !/^\d{13}$/.test(issued || "") || !/^[a-f0-9-]{36}$/.test(nonce || "") || !/^[A-Za-z0-9_-]{43}$/.test(signature || "") || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) || time - Number(issued) > 1800000 || time - Number(issued) < 700)
        return response({ error: "This form has expired or is not ready. Refresh the form and try again.", refresh: true }, 422);
      // Bounded, per-process flood protection; the production edge must also
      // enforce IP limits across instances. No untrusted forwarding IP is used.
      for (const [id, entry] of attempts) if (entry.reset <= time) attempts.delete(id);
      const fingerprint = sign(value.email.toLowerCase());
      const entry = attempts.get(fingerprint);
      if (entry && entry.count >= 3) return response({ error: "Please wait before sending another message." }, 429, Math.ceil((entry.reset - time) / 1000));
      if (!entry && attempts.size >= 5000) throw new RequestError("Please wait before sending another message.", 429);
      attempts.set(fingerprint, { count: (entry?.count || 0) + 1, reset: entry?.reset || time + 600000 });
      const idempotencyKey = sign(JSON.stringify([value.token, value.name, value.email, value.subject, value.message]));
      const result = await fetcher("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "Idempotency-Key": `contact/${idempotencyKey}` },
        body: JSON.stringify({ from: `STRYDE <${config.from}>`, to: [config.to], reply_to: value.email, subject: `STRYDE contact — ${value.subject}`, text: `Name: ${value.name}\nEmail: ${value.email}\nSubject: ${value.subject}\n\n${value.message}` }),
      });
      const receipt = await result.json().catch(() => null);
      if (!result.ok || typeof receipt?.id !== "string" || !receipt.id) throw new RequestError("The email service could not accept your message. Your text is still here; please try again later.", 502);
      return response({ accepted: true, message: "Your message was accepted for delivery. Replies will go to the email address you provided." }, 202);
    } catch (error) {
      return response({ error: error instanceof RequestError ? error.message : "Your message could not be sent. Please try again later." }, error instanceof RequestError ? error.status : 502);
    }
  }
  return { get, post, token };
}
