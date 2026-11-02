// Import the complete accessible archive, with optional matching CDN upgrades.
// No marketplace crawling, credentials, proxies, prices, or stock are involved.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "backend/package.json"));
const sharp = require("sharp");
const cache = resolve(root, ".data/stockx-import");
const source = "https://github.com/msaaksjarvi/stockx-image-dataset";
const manifest = JSON.parse(
  await readFile(resolve(cache, "manifest.json"), "utf8"),
);
const catalogFile = resolve(root, "storefront/src/data/stockx-editorial.json");
const previous = JSON.parse(await readFile(catalogFile, "utf8"));
const curated = previous.filter((p) => !p.archiveSource);
const normalizeFilename = (name) =>
  name
    .toLowerCase()
    .replace(/-product(?=\.)/, "")
    .replace(/\.(jpg|webp|png)$/, "");
const curatedNames = new Set(
  curated.map((p) =>
    normalizeFilename(
      decodeURIComponent(new URL(p.sourceImageUrl).pathname.split("/").at(-1)),
    ),
  ),
);
const brands = [
  ["A-Bathing-Ape-", "A Bathing Ape"],
  ["Air-Jordan-", "Jordan"],
  ["Air-Max-", "Nike"],
  ["New-Balance-", "New Balance"],
  ["Louis-Vuitton-", "Louis Vuitton"],
  ["Under-Armour-", "Under Armour"],
  ["Off-White-", "Off-White"],
  ["Dolce-Gabbana-", "Dolce & Gabbana"],
  ["Dr-Martens-", "Dr. Martens"],
  ["Golden-Goose-", "Golden Goose"],
  ["Common-Projects-", "Common Projects"],
  ["Axel-Arigato-", "Axel Arigato"],
  ["Christian-Louboutin-", "Christian Louboutin"],
  ["Palm-Angels-", "Palm Angels"],
  ["Rick-Owens-", "Rick Owens"],
  ["Maison-Margiela-", "Maison Margiela"],
  ["Saint-Laurent-", "Saint Laurent"],
  ["Stella-McCartney-", "Stella McCartney"],
  ["Bottega-Veneta-", "Bottega Veneta"],
  ["Li-Ning-", "Li-Ning"],
  ["Onitsuka-Tiger-", "Onitsuka Tiger"],
  ["The-North-Face-", "The North Face"],
  ["Jimmy-Choo-", "Jimmy Choo"],
  ["Polo-Ralph-Lauren-", "Polo Ralph Lauren"],
  ["Alexander-McQueen-", "Alexander McQueen"],
  ["Alexander-Wang-", "Alexander Wang"],
  ["730-Footwear-", "730 Footwear"],
  ["Zoom-", "Nike"],
  ["Lebron-", "Nike"],
  ["Travis-Scott-", "Travis Scott"],
  ...[
    "Nike",
    "Balenciaga",
    "Puma",
    "Converse",
    "Reebok",
    "Vans",
    "Dior",
    "Gucci",
    "Saucony",
    "Asics",
    "Crocs",
    "Clarks",
    "Burberry",
    "Diadora",
    "Fendi",
    "Timberland",
    "Givenchy",
    "Mizuno",
    "Prada",
    "Autry",
    "Salomon",
    "Lanvin",
    "Birkenstock",
    "Hermes",
    "Valentino",
    "Karhu",
    "Fila",
    "Chanel",
    "Curry",
    "Ewing",
    "Brooks",
    "Suicoke",
    "Jordan",
    "Supreme",
    "Merrell",
    "Rhude",
    "Supra",
    "Yeezy",
    "On",
    "Veja",
    "Hoka",
  ].map((brand) => [brand + "-", brand]),
  ["Adidas-", "adidas"],
];
const colorNames = new Map(
  "Black White Grey Gray Blue Red Green Yellow Orange Pink Purple Brown Beige Cream Tan Silver Gold Navy Burgundy Olive Volt Sail"
    .split(" ")
    .map((c) => [c.toLowerCase(), c === "Gray" ? "Grey" : c]),
);
const photoDirs = [
  resolve(root, "design/assets/stockx-archive"),
  resolve(root, "storefront/public/assets/stockx-archive"),
];
for (const path of photoDirs) await mkdir(path, { recursive: true });
await mkdir(resolve(cache, "upgrades"), { recursive: true });
const report = {
  source,
  archiveImages: 11957,
  exactDuplicatesRemoved: 53,
  curatedOverlap: 0,
  imported: 0,
  higherResolution: 0,
  archiveResolution: 0,
  failed: [],
  completeCurrentStockXCatalog: false,
  commercialRightsConfirmed: false,
  startedAt: new Date().toISOString(),
};
const added = new Array(manifest.length);
let next = 0;
async function comparable(bytes) {
  // Compare named source to archive thumbnail before accepting a larger image.
  return sharp(bytes)
    .flatten({ background: "#fff" })
    .resize(40, 28, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
}
async function importImage(row, index) {
  if (curatedNames.has(normalizeFilename(row.filename))) {
    report.curatedOverlap++;
    return;
  }
  const original = await readFile(
    resolve(cache, "originals", row.sha256 + ".jpg"),
  );
  const meta = await sharp(original, { limitInputPixels: 40000000 }).metadata();
  if (!meta.width || !meta.height) throw new Error("Invalid JPEG");
  const stem = row.filename.slice(0, -4);
  const id = "stockx-archive-" + row.sha256.slice(0, 16);
  const upgradeFile = resolve(cache, "upgrades", row.sha256 + ".webp");
  let bytes = original,
    sourceImageUrl = "",
    high = false;
  const url = new URL(
    `https://images.stockx.com/images/${encodeURIComponent(stem)}-Product.jpg`,
  );
  url.search = new URLSearchParams({
    auto: "compress",
    fit: "fill",
    fm: "webp",
    w: "1000",
    q: "85",
  }).toString();
  try {
    let candidate;
    try {
      candidate = await readFile(upgradeFile);
    } catch {
      if (process.argv.includes("--upgrade")) {
        const response = await fetch(url, {
          redirect: "error",
          signal: AbortSignal.timeout(12000),
        });
        if (response.status === 403 || response.status === 429)
          throw new Error(`CDN_RATE_LIMIT:${response.status}`);
        if (
          response.ok &&
          response.headers.get("content-type")?.startsWith("image/")
        ) {
          const data = Buffer.from(await response.arrayBuffer());
          if (data.length < 12 * 1024 * 1024) candidate = data;
        }
      }
    }
    if (candidate) {
      const hd = await sharp(candidate, {
        limitInputPixels: 40000000,
      }).metadata();
      const a = await comparable(original),
        b = await comparable(candidate);
      let difference = 0;
      for (let i = 0; i < a.length; i++) difference += Math.abs(a[i] - b[i]);
      if (
        hd.width >= 600 &&
        difference / a.length < 16 &&
        Math.abs(meta.width / meta.height - hd.width / hd.height) < 0.12
      ) {
        bytes = candidate;
        high = true;
        sourceImageUrl = url.href;
        await writeFile(upgradeFile, candidate);
      }
    }
  } catch (error) {
    if (error.message?.startsWith("CDN_RATE_LIMIT:")) {
      upgradeStopped = true;
    }
  }
  const output = high
    ? bytes
    : await sharp(bytes).webp({ quality: 88 }).toBuffer();
  for (const directory of photoDirs)
    await writeFile(resolve(directory, id + ".webp"), output);
  const brand =
    brands.find(([prefix]) =>
      stem.toLowerCase().startsWith(prefix.toLowerCase()),
    )?.[1] || "Other";
  const title = stem.replaceAll("-", " ");
  const colors = [
    ...new Set(
      stem
        .split("-")
        .map((w) => colorNames.get(w.toLowerCase()))
        .filter(Boolean),
    ),
  ];
  added[index] = {
    id,
    title,
    brand,
    colorway: colors.join(" / "),
    sku: "",
    description:
      title +
      ". Archived StockX photography; product name transcribed from the archive filename.",
    sourceUrl: source,
    sourceImageUrl,
    sourceSet: "StockX editorial edit",
    identityStatus: "filename",
    count: 1,
    url: "/products/" + id,
    photos: [
      {
        src: "/assets/stockx-archive/" + id + ".webp",
        source,
        sha256: createHash("sha256").update(output).digest("hex"),
      },
    ],
    archiveSource: source,
    originalFilename: row.filename,
    originalSha256: row.sha256,
    resolution: high ? "matched-cdn" : "archive-thumbnail",
    licensingStatus: "commercial-use-not-confirmed",
  };
  report.imported++;
  if (high) report.higherResolution++;
  else report.archiveResolution++;
}
let upgradeStopped = false;
async function worker() {
  while (next < manifest.length) {
    const index = next++,
      row = manifest[index];
    // A rate-limit stops additional CDN requests; cached archive photos still import.
    if (upgradeStopped) {
      const flag = process.argv.indexOf("--upgrade");
      if (flag >= 0) process.argv.splice(flag, 1);
    }
    try {
      await importImage(row, index);
    } catch (error) {
      report.failed.push({ filename: row.filename, message: error.message });
    }
    if ((index + 1) % 250 === 0)
      console.log(
        JSON.stringify({
          processed: index + 1,
          imported: report.imported,
          higherResolution: report.higherResolution,
          archiveResolution: report.archiveResolution,
        }),
      );
  }
}
await Promise.all(Array.from({ length: 12 }, () => worker()));
const all = [...curated, ...added.filter(Boolean)];
await writeFile(catalogFile + ".tmp", JSON.stringify(all) + "\n");
await rename(catalogFile + ".tmp", catalogFile);
report.totalModels = all.length;
report.finishedAt = new Date().toISOString();
report.cdnRequestsStopped = upgradeStopped;
await mkdir(resolve(root, "evidence"), { recursive: true });
await writeFile(
  resolve(root, "evidence/stockx-archive-import.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
