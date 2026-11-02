import { z } from "zod";
const windows = new Map<string, { count: number; reset: number }>();
export class RequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function guardMutation(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new URL(process.env.SITE_URL || "http://localhost:3000")
    .origin;
  if (
    origin !== allowed ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new RequestError("Please use the store to update your bag.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new RequestError("JSON required.", 415);
  // Per-process protection. Production proxy adds IP limits before Next, across instances.
  // Do not trust arbitrary X-Forwarded-For supplied directly by an internet client.
  const key = request.headers.get("cookie")?.slice(0, 256) || "new-session";
  const now = Date.now();
  if (windows.size >= 5000)
    for (const [id, value] of windows)
      if (value.reset < now) windows.delete(id);
  const value = windows.get(key);
  if (!value && windows.size >= 5000) {
    throw new RequestError('Please wait a minute before trying again.', 429);
  }
  if (value && value.reset > now) {
    if (++value.count > 50)
      throw new RequestError("Please wait a minute before trying again.", 429);
  } else windows.set(key, { count: 1, reset: now + 60000 });
}
export async function body<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Missing request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new RequestError("Request is too large.", 413);
    }
    chunks.push(part.value);
  }
  try {
    return schema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch {
    throw new RequestError("Check your details and try again.");
  }
}
export const idSchema = z
  .string()
  .regex(/^[a-z]+_[a-zA-Z0-9]+$/)
  .max(100);
export const addressSchema = z
  .object({
    first_name: z.string().trim().min(1).max(80),
    last_name: z.string().trim().min(1).max(80),
    address_1: z.string().trim().min(3).max(150),
    city: z.string().trim().min(1).max(100),
    postal_code: z.string().trim().min(1).max(20),
    country_code: z.string().regex(/^[a-z]{2}$/),
  })
  .strict();
