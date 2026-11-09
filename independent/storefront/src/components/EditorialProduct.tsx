import { Gallery } from "./Gallery";
import { Arrow } from "./Information";
import type { Product } from "@/lib/types";
import { editorialDisplayColorway, editorialDisplayTitle, findEditorialProduct } from "@/lib/editorial-catalog";
import { PreviewProductPurchase } from "./PreviewProductPurchase";
export const editorialProduct = findEditorialProduct;
export function EditorialProduct({ handle }: { handle: string }) {
  const item = editorialProduct(handle);
  if (!item) return null;
  const title = editorialDisplayTitle(item);
  const colorway = editorialDisplayColorway(item);
  const product: Product = {
    id: item.id,
    handle,
    title: item.title,
    description: item.description,
    thumbnail: item.photos[0].src,
    images: item.photos.map((p, index) => ({
      id: `${item.id}-${index}`,
      url: p.src,
    })),
    metadata: { editorial_reference: true, stryde_media: { images: item.photos.map(p => ({ url: p.src, bounds: p.bounds })) } },
    options: [],
    variants: [],
  };
  return (
    <section
      className="studio-product studio-product-preview page-shell"
      data-product-section
    >
      <nav className="studio-breadcrumbs" aria-label="Breadcrumbs">
        <a data-collection-return href="/collections/all">
          <Arrow /> Back to collection
        </a>
      </nav>
      <div className="studio-product-layout">
        <Gallery product={product} />
        <div className="studio-product-information">
          <div className="studio-product-title">
            <h1>{title}</h1>
            <p className="studio-product-color">{colorway}</p>
          </div>
          <p className="studio-product-description">{item.description}</p>
          <PreviewProductPurchase handle={handle} title={item.title} image={item.photos[0].src} />
          <dl className="studio-product-facts">
            <div>
              <dt>Brand</dt>
              <dd>{item.brand}</dd>
            </div>
            {item.sku && (
              <div>
                <dt>Style code</dt>
                <dd>{item.sku}</dd>
              </div>
            )}
          </dl>
          <details className="studio-photo-details">
            <summary>About this photograph +</summary>
            <div>
              <p>
                Product photography from{" "}
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.archiveSource
                    ? "StockX image archive — view the source"
                    : "StockX — view the source"}
                </a>
                .{" "}
                {item.archiveSource
                  ? "The name is transcribed from the archive filename; style code and current availability are unverified."
                  : "This is an editorial reference, not an offer of inventory or an authenticity guarantee."}
                {item.resolution === "archive-thumbnail" &&
                  " The available archive photo is a low-resolution thumbnail."}
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
