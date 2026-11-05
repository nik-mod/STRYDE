import { NextResponse } from "next/server";
import { product } from "@/lib/medusa";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const handles = [...new Set(url.searchParams.getAll("handle"))]
    .filter((handle) => /^[a-z0-9-]{1,120}$/.test(handle))
    .slice(0, 50);
  if (!handles.length) return NextResponse.json({ products: [] });
  const results = await Promise.all(
    handles.map((handle) => product(handle).catch(() => null)),
  );
  return NextResponse.json({
    products: results.filter((p): p is NonNullable<typeof p> => !!p),
  });
}
