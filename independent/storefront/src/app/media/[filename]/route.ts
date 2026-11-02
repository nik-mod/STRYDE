import { NextResponse } from "next/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/.test(filename))
    return new NextResponse(null, { status: 404 });
  const origin = process.env.MEDUSA_BACKEND_URL;
  if (!origin) return new NextResponse(null, { status: 503 });
  try {
    // Fixed, configured upstream; URLs from users cannot become fetch targets.
    const response = await fetch(`${origin}/static/${filename}`, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) return new NextResponse(null, { status: 404 });
    const type = response.headers.get("content-type")?.split(";")[0] || "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(type))
      return new NextResponse(null, { status: 415 });
    const reader = response.body?.getReader();
    if (!reader) return new NextResponse(null, { status: 502 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > 12 * 1024 * 1024) {
        await reader.cancel();
        return new NextResponse(null, { status: 413 });
      }
      chunks.push(chunk.value);
    }
    return new NextResponse(Buffer.concat(chunks), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
