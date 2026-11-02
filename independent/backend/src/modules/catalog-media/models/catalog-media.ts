import { model } from "@medusajs/framework/utils";
export const CatalogMedia = model.define("catalog_media", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  url: model.text(),
  original_url: model.text(),
  sha256: model.text(),
  width: model.number(),
  height: model.number(),
  details: model.json(),
});
