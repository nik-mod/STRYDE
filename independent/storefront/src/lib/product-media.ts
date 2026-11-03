import type { Product } from "./types";
export function mediaFor(
  product: Pick<Product, "metadata">,
  url: string | null | undefined,
  width = 1440,
) {
  const manifest = product.metadata?.stryde_media as any;
  const media = manifest?.images?.find((image: any) => image.url === url);
  const variants = (media?.variants || [])
    .filter((v: any) => typeof v.url === "string" && Number.isFinite(v.width))
    .sort((a: any, b: any) => a.width - b.width);
  const selected =
    variants.find((v: any) => v.width >= width) ||
    variants[variants.length - 1];
  return {
    src: selected?.url || url || "",
    srcSet: variants.length
      ? variants.map((v: any) => `${v.url} ${v.width}w`).join(", ")
      : undefined,
    attribution: media?.attribution || "",
    bounds: Array.isArray(media?.bounds) ? media.bounds.join(",") : undefined,
  };
}
