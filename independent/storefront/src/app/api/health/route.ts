import { NextResponse } from "next/server";
export async function GET() {
  try {
    const origin = process.env.MEDUSA_BACKEND_URL;
    if (!origin) throw new Error();
    const response = await fetch(`${origin}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error();
    return NextResponse.json({ status: "ready" });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
