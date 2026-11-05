import type { MetadataRoute } from "next";
import { medusa } from "@/lib/medusa";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_URL || "http://localhost:3000";
  // Handles only: the full product payloads would be far too heavy here.
  const handles: string[] = [];
  try {
    for (let offset = 0; offset < 20000; offset += 1000) {
      const result = await medusa<{
        products: { handle: string; metadata: Record<string, unknown> | null }[];
        count: number;
      }>(
        `/products?fields=handle,+metadata&limit=1000&offset=${offset}`,
      );
      for (const p of result.products)
        if (!p.metadata?.development_fixture) handles.push(p.handle);
      if (offset + 1000 >= result.count) break;
    }
  } catch {}
  return [
    { url: origin },
    { url: `${origin}/collections/all` },
    ...handles.map((handle) => ({ url: `${origin}/products/${handle}` })),
  ];
}
