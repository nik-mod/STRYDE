import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac } from "node:crypto";
import { guardMutation, body, RequestError } from "@/lib/security";
import { customerCookie } from "@/lib/customer";
const attempts = new Map<string, { count: number; until: number }>();
const input = z.discriminatedUnion("action", [z.object({ action: z.literal("request"), email: z.email().max(254) }).strict(), z.object({ action: z.literal("reset"), token: z.string().min(20).max(4096), password: z.string().min(8).max(200) }).strict()]);
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    const origin = process.env.MEDUSA_BACKEND_URL;
    if (!origin) throw new RequestError("Account recovery is unavailable. Please try again later.", 503);
    if (value.action === "request") {
      if (process.env.NODE_ENV === "production" && process.env.AUTH_EMAIL_MODE !== "resend") throw new RequestError("Recovery email delivery is not connected yet.", 503);
      const now = Date.now();
      for (const [key, item] of attempts) if (item.until < now) attempts.delete(key);
      const secret = process.env.CART_COOKIE_SECRET;
      if (!secret || secret.length < 32) throw new RequestError("Recovery is unavailable.", 503);
      const key = createHmac("sha256", secret).update(value.email.trim().toLowerCase()).digest("hex");
      const entry = attempts.get(key);
      if ((entry?.count || 0) >= 3 || attempts.size >= 5000) throw new RequestError("Please wait before requesting another recovery link.", 429);
      attempts.set(key, { count: (entry?.count || 0) + 1, until: entry?.until || now + 900000 });
      const response = await fetch(`${origin}/auth/customer/emailpass/reset-password`, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: value.email.trim().toLowerCase() }) });
      if (!response.ok) throw new RequestError("The recovery request could not be processed. Please try later.", 503);
      return NextResponse.json({ message: process.env.AUTH_EMAIL_MODE === "resend" ? "If an account matches this email, a recovery link will be sent. Check your inbox and spam folder." : "If an account matches, a recovery link is written to the private development email outbox. Inbox delivery is not connected yet." });
    }
    const response = await fetch(`${origin}/auth/customer/emailpass/update`, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/json", Authorization: `Bearer ${value.token}` }, body: JSON.stringify({ password: value.password }) });
    if (!response.ok) throw new RequestError("This link is expired, already used or invalid. Request a new recovery link.", 400);
    const result = await response.json();
    if (result.success !== true) throw new RequestError("The password could not be changed. Request a new recovery link.");
    const output = NextResponse.json({ success: true, message: "Your password has been changed. Sign in with your new password." });
    output.cookies.set(customerCookie, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return output;
  } catch (error) {
    return NextResponse.json({ message: error instanceof RequestError ? error.message : "Account recovery is temporarily unavailable." }, { status: error instanceof RequestError ? error.status : 503 });
  }
}
