import type { ExecArgs } from "@medusajs/framework/types";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";
export default async function audit({ container }: ExecArgs) {
  const products = await container
    .resolve("product")
    .listProducts({}, { relations: ["images"], take: 10000 });
  const rows = [];
  const seen = new Map<string, string[]>();
  for (const p of products) {
    const photos = [];
    for (const image of p.images) {
      let info: any = {
        url: image.url,
        source: "unverified",
        dimensions: null,
        sha256: null,
      };
      if (image.url.startsWith("/assets/") && !image.url.includes(".."))
        try {
          const buffer = await readFile(
            resolve(process.cwd(), "../design/assets", image.url.slice(8)),
          );
          const m = await sharp(buffer).metadata();
          info = {
            ...info,
            source: p.metadata?.development_fixture
              ? "development concept artwork"
              : "local asset; provenance unverified",
            dimensions: [m.width, m.height],
            sha256: createHash("sha256").update(buffer).digest("hex"),
            low_resolution: Math.max(m.width || 0, m.height || 0) < 1000,
          };
          seen.set(info.sha256, [...(seen.get(info.sha256) || []), p.id]);
        } catch {
          info.missing = true;
        }
      photos.push(info);
    }
    const identity = p.metadata?.stryde_identity as any;
    rows.push({
      id: p.id,
      title: p.title,
      status: p.status,
      development_fixture: p.metadata?.development_fixture === true,
      brand: identity?.brand || null,
      model: identity?.model || null,
      style_code: identity?.style_code || null,
      colorway: identity?.colorway || null,
      current_images: photos,
      verified_stockx_match: null,
      replacement_available: false,
      license_status: "not supplied",
      model_colorway_assessment:
        "Cannot verify from generic fixture identity; no visual guess made.",
      proposed_action: p.metadata?.development_fixture
        ? "Retain only as a labeled development fixture; never convert to merchandise. Create a separate accurate draft with licensed StockX media."
        : "Keep draft/pending media until exact identity and authorization are reviewed.",
    });
  }
  const report = {
    generated_at: new Date().toISOString(),
    products: rows,
    duplicates: [...seen]
      .filter(([, ids]) => ids.length > 1)
      .map(([sha256, ids]) => ({ sha256, product_ids: ids })),
    note: "No remote images fetched, no source watermark altered and no product or image replaced.",
  };
  const dir = resolve(process.cwd(), "../docs/catalog-audit");
  await mkdir(dir, { recursive: true });
  await writeFile(
    resolve(dir, "products.json"),
    JSON.stringify(report, null, 2),
  );
  const cell = (v: any) => `"${String(v ?? "Unknown").replaceAll('"', '""')}"`;
  await writeFile(
    resolve(dir, "products.csv"),
    [
      "Product ID,Current title,Brand,Model,Style code,Colorway,Current source,Verified StockX match,Replacement available,License status,Proposed action",
      ...rows.map((r) =>
        [
          r.id,
          r.title,
          r.brand,
          r.model,
          r.style_code,
          r.colorway,
          r.current_images.map((i) => i.source).join("; "),
          "None",
          false,
          r.license_status,
          r.proposed_action,
        ]
          .map(cell)
          .join(","),
      ),
    ].join("\n"),
  );
  console.log(
    `Audited ${rows.length} products. No catalog mutations or remote image requests.`,
  );
}
