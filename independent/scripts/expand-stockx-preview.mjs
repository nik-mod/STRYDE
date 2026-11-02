// Expand the local editorial preview from explicit, existing StockX references.
// This does not crawl StockX, enumerate its marketplace, or publish merchandise.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reference = resolve(root, "..");
const file = resolve(root, "storefront/src/data/stockx-editorial.json");
const current = JSON.parse(await readFile(file, "utf8"));
const replacements = JSON.parse(
  await readFile(
    resolve(reference, "tools/fixtures/photo-replacements.json"),
    "utf8",
  ),
);
const identities = {
  "maison-margiela-replica-light-blue": {
    title: "Maison Margiela Replica Light Blue",
    brand: "Maison Margiela",
    colorway: "Light Blue / White",
    sku: "S57WS0511P8224HA813",
  },
  "maison-margiela-replica-glicine": {
    title: "Maison Margiela Replica Glicine",
    brand: "Maison Margiela",
    colorway: "Lilac / Cream / Gum",
    sku: "",
  },
  "maison-margiela-replica-roseate": {
    title: "Maison Margiela Replica Roseate",
    brand: "Maison Margiela",
    colorway: "Pink / Cream / Gum",
    sku: "",
  },
  "maison-margiela-replica-navy-black": {
    title: "Maison Margiela Replica Navy Black",
    brand: "Maison Margiela",
    colorway: "Navy / Black / Gum",
    sku: "",
  },
  "maison-margiela-replica-dark-brown": {
    title: "Maison Margiela Replica Dark Brown",
    brand: "Maison Margiela",
    colorway: "Dark Brown",
    sku: "S57WS0236 P1895 T2153",
  },
  "golden-goose-super-star-white-black": {
    title: "Golden Goose Super-Star White Black",
    brand: "Golden Goose",
    colorway: "White / Black",
    sku: "GMF00102.F000318.10220",
  },
};
const start = current.length;
let fetched = 0,
  checked = 0;
for (const row of replacements) {
  if (!row.sourceUrl?.startsWith("https://stockx.com/")) continue;
  const slug = new URL(row.sourceUrl).pathname.slice(1);
  let entry = current.find((p) => p.sourceUrl === row.sourceUrl);
  if (!entry) {
    const identity = identities[slug];
    if (!identity) throw new Error(`No reviewed identity for ${slug}`);
    const id = `stockx-${String(Math.max(...current.map((p) => Number(p.id.replace("stockx-", "")))) + 1).padStart(4, "0")}`;
    entry = {
      id,
      ...identity,
      description: `${identity.title}. Product photography reference from StockX.`,
      sourceUrl: row.sourceUrl,
      sourceImageUrl: row.sourceImageUrl,
      sourceSet: "StockX editorial edit",
      identityStatus: "source-verified",
      count: 0,
      url: `/products/${id}`,
      photos: [],
      licensingStatus: "commercial-use-not-confirmed",
    };
    current.push(entry);
  }
  for (const photo of row.photos || []) {
    if (
      !/^\/assets\/replacement-photos\/[a-z0-9-]+\.(jpg|webp|png)$/.test(
        photo.src,
      )
    )
      throw new Error("Unexpected local image path");
    const original = resolve(reference, photo.src.slice(1));
    let bytes;
    try {
      bytes = await readFile(original);
    } catch {
      if (!process.argv.includes("--fetch-missing"))
        throw new Error(
          `Missing cached photo ${photo.src}. Re-run with --fetch-missing for the explicit public URL.`,
        );
      const url = new URL(photo.sourceImageUrl || row.sourceImageUrl);
      if (url.protocol !== "https:" || url.hostname !== "images.stockx.com")
        throw new Error("Unrecognized image source");
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/")
      )
        throw new Error(
          `Public image unavailable (${response.status}); no bypass attempted.`,
        );
      bytes = Buffer.from(await response.arrayBuffer());
      fetched++;
    }
    if (bytes.length > 12 * 1024 * 1024 || bytes.length < 5000)
      throw new Error("Unexpected photo size");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (photo.sha256 && photo.sha256 !== sha256)
      throw new Error(
        `Source identity changed for ${photo.src}; manual review required.`,
      );
    checked++;
    if (entry.photos.some((p) => p.sha256 === sha256)) continue;
    const target = resolve(root, "design", photo.src.slice(1));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    const publicTarget = resolve(root, "storefront/public", photo.src.slice(1));
    await mkdir(dirname(publicTarget), { recursive: true });
    await writeFile(publicTarget, bytes);
    entry.photos.push({ ...photo, source: row.sourceUrl, sha256 });
    entry.count = entry.photos.length;
  }
}
await writeFile(file, JSON.stringify(current, null, 2) + "\n");
const report = {
  previousModels: start,
  models: current.length,
  addedModels: current.length - start,
  photoFiles: current.reduce((n, p) => n + p.photos.length, 0),
  reviewedReferencesChecked: checked,
  newPublicDownloads: fetched,
  completeStockXCatalog: false,
  commercialRightsConfirmed: false,
};
await mkdir(resolve(root, "evidence"), { recursive: true });
await writeFile(
  resolve(root, "evidence/stockx-preview-expansion.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
