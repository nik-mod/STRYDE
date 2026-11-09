import { Arrow } from "./Information";

type FeaturedPair = {
  href: string;
  title: string;
  caption?: string;
  image: string;
  srcSet?: string;
  bounds?: string;
};

export function CollectionOpening({
  title,
  pairs = [],
  description,
  editorial = false,
}: {
  title: string;
  pairs?: FeaturedPair[];
  description?: string;
  editorial?: boolean;
}) {
  if (!pairs.length) {
    return (
      <header className="collection-opening" data-listing-heading>
        <h1>{title}</h1>
      </header>
    );
  }

  return (
    <header className="collection-masthead" data-collection-masthead data-listing-heading>
      <div className="collection-masthead-top">
        <span>STRYDE / THE FOOTWEAR EDIT</span>
      </div>
      <div className="collection-masthead-copy">
        <h1>
          <span>FIND YOUR</span>
          <em>NEXT MOVE.</em>
        </h1>
        <div className="collection-masthead-bottom">
          {description && <p>{description}</p>}
          <a href="#CollectionGallery" className="collection-explore">
            Browse sneakers <Arrow />
          </a>
        </div>
      </div>
      <div className="collection-masthead-art">
        <div className="collection-orbit" aria-hidden="true">
          <span>EVERYDAY / ANYWHERE</span>
        </div>
        <span className="collection-art-mark" aria-hidden="true">S/</span>
        {pairs.slice(0, 2).map((pair, index) => (
          <a
            key={pair.href}
            className={`collection-hero-piece collection-hero-piece-${index + 1}`}
            href={pair.href}
            aria-label={`Explore ${pair.title}`}
            data-product-open
          >
            <span className="collection-hero-media">
              <img
                src={pair.image}
                srcSet={pair.srcSet}
                sizes={pair.srcSet ? "(max-width: 700px) 80vw, 40vw" : undefined}
                data-catalog-hero-image={editorial ? "" : undefined}
                data-photo-bounds={pair.bounds}
                width={1000}
                height={1000}
                alt=""
                decoding="async"
              />
            </span>
            <span className="collection-hero-caption" aria-hidden="true">
              0{index + 1} / {pair.caption || "STRYDE"}
            </span>
          </a>
        ))}
      </div>
    </header>
  );
}
