import type { Product } from "./types";
export const isTestMode = () =>
  process.env.STRYDE_TEST_MODE === "true" &&
  process.env.NODE_ENV !== "production";
interface MediaRecord {
  source?: unknown;
  license_status?: unknown;
  match_status?: unknown;
}
// Media states that can back a saleable product:
//  - stockx with owner_attested + owner_confirmed: photography the owner has
//    personally attested and confirmed for commercial use (live-ready).
//  - stockx with archive_reference: the project's own visible archive edit.
//    Sellable in the local test store only; never in production, because
//    commercial image authorization is not established by an archive download.
//  - concept: artwork produced in-repo from the project's own concept renders.
function imageApproved(image: MediaRecord, testing: boolean) {
  if (image.source === "stockx") {
    if (
      image.license_status === "owner_attested" &&
      image.match_status === "owner_confirmed"
    )
      return true;
    return testing && image.license_status === "archive_reference";
  }
  if (image.source === "concept")
    return image.license_status === "owned";
  return false;
}
export function permitted(
  product: Pick<Product, "metadata">,
  testing = isTestMode(),
) {
  if (product.metadata?.development_fixture === true) return testing;
  const media = product.metadata?.stryde_media as
    | { approved?: unknown; images?: MediaRecord[] }
    | undefined;
  return (
    product.metadata?.stryde_archived !== true &&
    product.metadata?.commerce_approved === true &&
    product.metadata?.identity_verified === true &&
    product.metadata?.sale_permitted === true &&
    media?.approved === true &&
    Array.isArray(media?.images) &&
    media.images.length > 0 &&
    media.images.every((image) => imageApproved(image, testing))
  );
}
export const liveCheckoutEnabled = () => false; // No live provider has been approved or implemented.
