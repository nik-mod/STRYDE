import type { Product } from "@/lib/types";
import { mediaFor } from "@/lib/product-media";
export function Gallery({ product }: { product: Product }) {
  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [{ id: "cover", url: product.thumbnail }]
      : [];
  if (!images.length)
    return (
      <div className="studio-gallery">
        <div className="studio-gallery-stage studio-no-image">
          Image unavailable
        </div>
      </div>
    );
  return (
    <div className="studio-gallery" data-product-gallery data-gallery-normalize={product.metadata?.editorial_reference ? "" : undefined}>
      <figure className="studio-gallery-stage">
        <a
          className="studio-gallery-open"
          data-gallery-open
          href={images[0].url}
          aria-label="Enlarge product image"
        >
          <span className="studio-gallery-photo" data-product-transition-frame>
            <img
              data-gallery-image
              data-product-cover
              data-photo-bounds={mediaFor(product, images[0].url).bounds}
              src={images[0].url}
              alt={product.title}
              width={1200}
              height={1200}
              fetchPriority="high"
            />
          </span>
          <span className="studio-gallery-zoom">+ Enlarge</span>
        </a>
        <figcaption className="studio-gallery-caption">
          <span data-gallery-caption>View 01</span>
          <span data-gallery-count>
            01 / {String(images.length).padStart(2, "0")}
          </span>
        </figcaption>
        {images.length > 1 && (
          <div className="studio-gallery-controls">
            <button type="button" data-gallery-prev aria-label="Previous image">
              ←
            </button>
            <button type="button" data-gallery-next aria-label="Next image">
              →
            </button>
          </div>
        )}
      </figure>
      {images.length > 1 && (
        <div className="studio-gallery-thumbnails" aria-label="Product views">
          {images.map((image, index) => (
            <a
              className="studio-gallery-thumbnail"
              href={image.url}
              data-product-thumbnail
              data-image-url={image.url}
              data-photo-bounds={mediaFor(product, image.url).bounds}
              data-image-alt={`${product.title} — view ${index + 1}`}
              aria-label={`View product image ${index + 1}`}
              aria-current={index === 0 ? "true" : undefined}
              key={image.id}
            >
              <img
                src={mediaFor(product, image.url, 360).src}
                data-photo-bounds={mediaFor(product, image.url).bounds}
                width={120}
                height={120}
                alt=""
                loading="lazy"
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </a>
          ))}
        </div>
      )}
      <p className="studio-gallery-help">
        {images.length} views<span>Click to explore the details</span>
      </p>
      {images
        .map((image) => mediaFor(product, image.url).attribution)
        .filter(
          (credit, index, list) => credit && list.indexOf(credit) === index,
        )
        .map((credit) => (
          <p className="micro" key={credit}>
            {credit}
          </p>
        ))}
      <dialog
        className="studio-lightbox"
        data-gallery-dialog
        aria-label="Product image viewer"
      >
        <div className="studio-lightbox-toolbar">
          <span data-lightbox-count />
          <button
            type="button"
            data-lightbox-zoom
            aria-label="Zoom image"
            aria-pressed="false"
          >
            + Zoom
          </button>
          <button
            type="button"
            data-lightbox-close
            aria-label="Close image viewer"
          >
            ×
          </button>
        </div>
        <div className="studio-lightbox-canvas" data-lightbox-canvas>
          <img
            data-lightbox-image
            src={images[0].url}
            alt={product.title}
            width={1200}
            height={1200}
            draggable={false}
          />
        </div>
        <div className="studio-lightbox-navigation">
          <button type="button" data-lightbox-prev aria-label="Previous image">
            ←
          </button>
          <span>Use arrow keys to browse</span>
          <button type="button" data-lightbox-next aria-label="Next image">
            →
          </button>
        </div>
      </dialog>
    </div>
  );
}
