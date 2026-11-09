import "server-only";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { prepareCatalog } from "./reference-catalog.mjs";
import { hasSharpSneakerPhoto } from "./sneaker-selection.mjs";

export type EditorialReference = {
  id: string;
  title: string;
  brand: string;
  colorway: string;
  description: string;
  sku: string;
  sourceUrl: string;
  url: string;
  photos: { src: string; bounds?: number[]; width?: number; height?: number }[];
  archiveSource?: string;
  resolution?: string;
  imageQuality?: { status: string; width: number; height: number };
};

// The archive keeps its source names. The named edit has reviewed model names
// so the colorway can sit on its own line without guessing at archive titles.
const modelNames: Record<string, string> = {
  "stockx-0001": "adidas Samba OG",
  "stockx-0002": "Salomon XT-6",
  "stockx-0003": "New Balance 2002R",
  "stockx-0004": "New Balance 2002R Protection Pack",
  "stockx-0005": "Air Jordan 1 Retro Low OG",
  "stockx-0006": "Nike Air Force 1 Low ’07",
  "stockx-0007": "New Balance 550",
  "stockx-0008": "New Balance 550",
  "stockx-0009": "ASICS GEL-NYC",
  "stockx-0010": "ASICS GEL-NYC",
  "stockx-0011": "Nike Zoom Vomero 5 (Women’s)",
  "stockx-0012": "Nike Zoom Vomero 5",
  "stockx-0013": "Nike Zoom Vomero 5",
  "stockx-0014": "ASICS GEL-1130",
  "stockx-0015": "ASICS GEL-1130",
  "stockx-0016": "Nike Air Max Plus (Women’s)",
  "stockx-0017": "adidas Campus 00s",
  "stockx-0018": "Nike P-6000",
  "stockx-0019": "New Balance 9060",
  "stockx-0021": "Maison Margiela Replica",
  "stockx-0022": "Maison Margiela Replica",
  "stockx-0023": "Maison Margiela Replica",
  "stockx-0024": "Maison Margiela Replica",
  "stockx-0025": "Maison Margiela Replica",
  "stockx-0026": "Golden Goose Super-Star",
};

export function editorialDisplayTitle(item: Pick<EditorialReference, "id" | "title">) {
  return modelNames[item.id] ?? item.title;
}

export function editorialDisplayColorway(item: Pick<EditorialReference, "id" | "title" | "colorway">) {
  const model = modelNames[item.id];
  // Keep named colorways distinct when the archive's broad color labels match.
  if (model && item.id !== "stockx-0001" && item.title.startsWith(`${model} `))
    return item.title.slice(model.length + 1);
  return item.colorway;
}

const filename = join(process.cwd(), "src/data/stockx-editorial.json");
let stamp = "";
let products: EditorialReference[] = [];
let entries: any[] = [];
let handles = new Map<string, EditorialReference>();
function load() {
  const stat = statSync(filename);
  const version = `${stat.mtimeMs}:${stat.size}`;
  if (version === stamp) return;
  const source: EditorialReference[] = JSON.parse(
    readFileSync(filename, "utf8"),
  );
  // The retired Takeout archive includes shoe parts and hand-held cutouts.
  // Only the current StockX photo sets belong in this preview.
  products = source.filter(
    (p) =>
      /^stockx-(?:\d{4}|archive-[a-f0-9]{16})$/.test(p.id) &&
      hasSharpSneakerPhoto(p) &&
      p.photos.length > 0 &&
      p.photos.every((photo) =>
        /^\/assets\/(?:stockx-edit|stockx-archive|replacement-photos)\/[a-zA-Z0-9-]+\.(?:webp|jpg|png)$/.test(
          photo.src,
        ),
      ),
  );
  entries = prepareCatalog(products).map((item: Pick<EditorialReference, "id" | "title" | "colorway">) => ({
    ...item,
    displayTitle: editorialDisplayTitle(item),
    displayColorway: editorialDisplayColorway(item),
  }));
  handles = new Map(products.map((p) => [p.url.slice("/products/".length), p]));
  stamp = version;
}
export function getEditorialEntries() {
  load();
  return entries;
}
export function findEditorialProduct(handle: string) {
  load();
  return handles.get(handle);
}
