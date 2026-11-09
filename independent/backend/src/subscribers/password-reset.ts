import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
export default async function passwordReset({ event }: SubscriberArgs<{ actor_type: string; entity_id: string; token: string }>) {
  if (event.data.actor_type !== "customer") return;
  const { entity_id: email, token } = event.data;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email)) throw new Error("Invalid recovery recipient");
  const site = new URL(process.env.STOREFRONT_URL || process.env.STORE_CORS?.split(",")[0] || "http://localhost:3000");
  if (process.env.NODE_ENV === "production" && site.protocol !== "https:") throw new Error("Recovery requires HTTPS");
  const url = new URL("/account/reset-password", site);
  // Fragments are not sent in HTTP requests or referrer headers.
  url.hash = new URLSearchParams({ token }).toString();
  const text = `Reset your STRYDE password\n\nUse this single-use link within 15 minutes:\n${url.href}\n\nIf you did not request this, ignore this email. Your password has not changed.`;
  const id = createHash("sha256").update(token).digest("hex");
  if (process.env.AUTH_EMAIL_MODE === "resend" && process.env.RESEND_API_KEY && process.env.AUTH_FROM_EMAIL) {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `password-reset/${id}` }, body: JSON.stringify({ from: process.env.AUTH_FROM_EMAIL, to: [email], subject: "Reset your STRYDE password", text }) });
    const receipt = await response.json().catch(() => null);
    if (!response.ok || !receipt?.id) throw new Error("Recovery email was not accepted by the delivery provider");
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Recovery email delivery is not configured");
  const directory = resolve(process.cwd(), "../.data/emails");
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, `password-reset-${id}.eml`), `To: ${email}\r\nSubject: Reset your STRYDE password\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${text}`, { mode: 0o600 });
}
export const config: SubscriberConfig = { event: "auth.password_reset" };
