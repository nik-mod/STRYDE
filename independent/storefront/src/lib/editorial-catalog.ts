import "server-only";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { prepareCatalog } from "./reference-catalog.mjs";

export type EditorialReference = {
  id: string;
  title: string;
  brand: string;
  colorway: string;
  description: string;
  sku: string;
  sourceUrl: string;
  url: string;
  photos: { src: string }[];
  archiveSource?: string;
  resolution?: string;
};
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
      p.photos.length > 0 &&
      p.photos.every((photo) =>
        /^\/assets\/(?:stockx-edit|stockx-archive|replacement-photos)\/[a-zA-Z0-9-]+\.(?:webp|jpg|png)$/.test(
          photo.src,
        ),
      ),
  );
  entries = prepareCatalog(products);
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
