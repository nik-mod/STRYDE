import type { Product } from "./types";
export const isTestMode = () =>
  process.env.STRYDE_TEST_MODE === "true" &&
  process.env.NODE_ENV !== "production";
export function permitted(
  product: Pick<Product, "metadata">,
  testing = isTestMode(),
) {
  if (product.metadata?.development_fixture === true) return testing;
  return (
    product.metadata?.stryde_archived !== true &&
    product.metadata?.commerce_approved === true &&
    product.metadata?.identity_verified === true &&
    product.metadata?.sale_permitted === true &&
    (product.metadata?.stryde_media as any)?.approved === true &&
    (product.metadata?.stryde_media as any)?.images?.length > 0 &&
    (product.metadata?.stryde_media as any)?.images.every(
      (image: any) =>
        image.source === "stockx" &&
        image.license_status === "owner_attested" &&
        image.match_status === "owner_confirmed",
    )
  );
}
export const liveCheckoutEnabled = () => false; // No live provider has been approved or implemented.
