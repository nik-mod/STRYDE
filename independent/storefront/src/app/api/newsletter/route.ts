import { z } from "zod";
import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { body, guardMutation, RequestError } from "@/lib/security";
const input = z.object({ email: z.email().max(254) }).strict();
// Development newsletter: subscriptions are recorded locally (never committed)
// until a real email/marketing provider is approved. No welcome email is sent.
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    const outDir = resolve(process.cwd(), "../.data");
    await mkdir(outDir, { recursive: true });
    await appendFile(
      resolve(outDir, "newsletter.jsonl"),
      JSON.stringify({ email: value.email.toLowerCase(), at: new Date().toISOString() }) +
        "\n",
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const known = error instanceof RequestError;
    return NextResponse.json(
      {
        message: known
          ? (error as RequestError).message
          : "Sign-up is temporarily unavailable.",
      },
      { status: known ? (error as RequestError).status : 500 },
    );
  }
}
