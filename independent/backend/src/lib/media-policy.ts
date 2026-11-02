export type Identity = {
  brand: string;
  model: string;
  style_code: string;
  colorway: string;
  stockx_product_id: string;
  stockx_url: string;
};
export const normalizeStyle = (value: string) =>
  value.trim().toUpperCase().replace(/\s+/g, "");
export function stockxReference(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["stockx.com", "www.stockx.com", "images.stockx.com"].includes(
        url.hostname,
      ) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function mediaIssues(product: any, records: any[]) {
  const errors: string[] = [];
  const identity = product.metadata?.stryde_identity as Identity | undefined;
  if (product.metadata?.stryde_archived === true)
    errors.push(
      "Restore the archived product through media review before publishing.",
    );
  if (product.metadata?.development_fixture)
    errors.push("Development fixtures cannot be published as merchandise.");
  if (
    !identity ||
    Object.values(identity).some(
      (value) => typeof value !== "string" || !value.trim(),
    ) ||
    !stockxReference(identity.stockx_url)
  )
    errors.push(
      "Complete brand, model, style code, colorway and StockX reference.",
    );
  if (!product.images?.length)
    errors.push("Select an authorized primary image and gallery.");
  if (product.images?.length > 20)
    errors.push("A gallery can contain at most 20 images.");
  const seen = new Set<string>();
  for (const image of product.images || []) {
    const record = records.find((r) => r.url === image.url);
    const d = record?.details;
    if (
      !record ||
      !d ||
      !identity ||
      d.source !== "stockx" ||
      d.product_id !== identity.stockx_product_id ||
      normalizeStyle(d.style_code || "") !==
        normalizeStyle(identity.style_code) ||
      d.colorway !== identity.colorway ||
      d.brand !== identity.brand ||
      d.model !== identity.model ||
      !d.exact_match_confirmed ||
      !d.rights_confirmed ||
      !d.license_reference ||
      !d.markings_preserved ||
      !d.studio_background_confirmed
    )
      errors.push(
        "Every image must have an exact StockX identity match and recorded commercial display/storage permission.",
      );
    if (record && seen.has(record.sha256))
      errors.push("Remove duplicate photographs from the gallery.");
    if (record) seen.add(record.sha256);
  }
  if (product.images?.length && product.thumbnail !== product.images[0].url)
    errors.push("The first gallery image must be the primary image.");
  if (
    product.metadata?.identity_verified !== true ||
    product.metadata?.sale_permitted !== true
  )
    errors.push(
      "Confirm merchandise identity and permission to sell separately from photo rights.",
    );
  return [...new Set(errors)];
}
