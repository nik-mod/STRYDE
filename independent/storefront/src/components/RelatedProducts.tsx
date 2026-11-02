import { catalog } from "@/lib/medusa";
import { mediaFor } from "@/lib/product-media";
import type { Product } from "@/lib/types";
export async function RelatedProducts({ product }: { product: Product }) {
  let products: Product[] = [];
  try {
    products = (await catalog())
      .filter(
        (p) =>
          p.id !== product.id &&
          (!product.collection || p.collection?.id === product.collection.id),
      )
      .slice(0, 3);
  } catch {
    return null;
  }
  if (!products.length) return null;
  return (
    <section
      className="page-shell"
      style={{ paddingBottom: "4rem" }}
      aria-label="More from the collection"
    >
      <h2>More from the collection</h2>
      <div className="related-product-grid">
        {products.map((p) => {
          const image = mediaFor(p, p.thumbnail, 720);
          return (
            <article key={p.id}>
              <a href={`/products/${p.handle}`}>
                {image.src ? (
                  <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes="(max-width: 700px) 90vw, 30vw"
                    width={720}
                    height={600}
                    loading="lazy"
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      background: "#fff",
                    }}
                    alt={p.title}
                  />
                ) : (
                  <p>Photography pending approval</p>
                )}
                <h3>{p.title}</h3>
              </a>
              {image.attribution && (
                <p className="micro">{image.attribution}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
