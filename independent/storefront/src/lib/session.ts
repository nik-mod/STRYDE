import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const cookieName = "stryde_bag";
function sign(value: string) {
  const secret = process.env.CART_COOKIE_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("CART_COOKIE_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("base64url");
}
export async function readSession() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || !/^cart_[a-zA-Z0-9]+$/.test(parts[0])) return null;
  const [id, expires, signature] = parts;
  if (!Number.isSafeInteger(Number(expires)) || Number(expires) < Date.now())
    return null;
  const expected = sign(`${id}.${expires}`);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null;
  return id;
}
export async function writeSession(id: string) {
  const expires = Date.now() + 7 * 86400000;
  const value = `${id}.${expires}`;
  (await cookies()).set(cookieName, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 86400,
  });
}
