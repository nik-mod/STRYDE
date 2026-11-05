import type { MetadataRoute } from "next";
import { catalog } from "@/lib/medusa";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_URL || "http://localhost:3000";
  let products: Awaited<ReturnType<typeof catalog>> = [];
  try {
    products = await catalog();
  } catch {}
  return [
    { url: origin },
    { url: `${origin}/collections/all` },
    ...["/pages/about", "/pages/contact", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"].map(path => ({ url: `${origin}${path}` })),
    ...products
      .filter((p) => !p.metadata?.development_fixture)
      .map((p) => ({ url: `${origin}/products/${p.handle}` })),
  ];
}
