import { Gallery } from "./Gallery";
import type { Product } from "@/lib/types";
import { findEditorialProduct } from "@/lib/editorial-catalog";
export const editorialProduct = findEditorialProduct;
export function EditorialProduct({ handle }: { handle: string }) {
  const item = editorialProduct(handle);
  if (!item) return null;
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
    metadata: { editorial_reference: true },
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
          ← Back to Collection
        </a>
        <span>{item.brand}</span>
      </nav>
      <div className="studio-product-layout">
        <Gallery product={product} />
        <div className="studio-product-information">
          <div className="studio-product-title">
            <h1>{item.title}</h1>
            <p className="studio-product-color">{item.colorway}</p>
          </div>
          <p className="studio-product-description">{item.description}</p>
          <p className="studio-preview-label">Collection preview</p>
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
          <p className="studio-preview-note">
            Photography reference · Product availability and pricing are not yet
            confirmed.
          </p>
          <a
            className="studio-collection-return"
            data-collection-return
            href="/collections/all"
          >
            <span>Back to Collection</span>↗
          </a>
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
