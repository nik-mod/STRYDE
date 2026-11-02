import { catalog } from "@/lib/medusa";
import { money, type Product } from "@/lib/types";
import { mediaFor } from "@/lib/product-media";
import { isTestMode } from "@/lib/policy";
import { EditorialCatalog } from "./EditorialCatalog";
export async function Catalog({
  params,
  collection,
}: {
  params: Record<string, string | undefined>;
  collection?: string;
}) {
  params = Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const query = params.q?.slice(0, 100) || "";
  let all: Product[] = [];
  let error = "";
  try {
    all = await catalog(query);
  } catch (cause) {
    error = (cause as Error).message;
  }
  if (params.fixtures !== "1") {
    all = all.filter((p) => p.metadata?.development_fixture !== true);
    if (isTestMode() && !all.length && (!collection || collection === "all"))
      return <EditorialCatalog params={params} />;
  }
  const collections = [
    ...new Map(
      all
        .filter((p) => p.collection)
        .map((p) => [p.collection!.handle, p.collection!]),
    ).values(),
  ];
  const categories = [
    ...new Map(
      all.flatMap((p) => p.categories || []).map((c) => [c.handle, c]),
    ).values(),
  ];
  const price = (p: Product) =>
    Math.min(
      ...p.variants.map(
        (v) => v.calculated_price?.calculated_amount ?? Infinity,
      ),
    );
  let filtered = all.filter(
    (p) =>
      (!collection ||
        collection === "all" ||
        p.collection?.handle === collection) &&
      (!params.category ||
        p.categories?.some((c) => c.handle === params.category)) &&
      (!params.collection || p.collection?.handle === params.collection),
  );
  const sort = ["price-asc", "price-desc", "title"].includes(params.sort || "")
    ? params.sort
    : "title";
  filtered.sort((a, b) =>
    sort === "price-asc"
      ? price(a) - price(b)
      : sort === "price-desc"
        ? price(b) - price(a)
        : a.title.localeCompare(b.title),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(params.page || "1") || 1),
  );
  const shown = filtered.slice((page - 1) * 12, page * 12);
  const pageUrl = (number: number) => {
    const search = new URLSearchParams(
      Object.entries(params).filter(
        (entry): entry is [string, string] => !!entry[1],
      ),
    );
    search.set("page", String(number));
    return `?${search}#CollectionGallery`;
  };
  return (
    <section
      className="page-shell collection-page collection-studio"
      data-listing-section
    >
      <header
        className="collection-masthead"
        data-collection-masthead
        data-listing-heading
      >
        <div className="collection-masthead-top">
          <span>STRYDE / THE FOOTWEAR EDIT</span>
          <span>Good shoes. New perspectives.</span>
        </div>
        <div className="collection-masthead-copy">
          <p className="collection-eyebrow">
            <span /> THE COLLECTION
          </p>
          <h1>
            <span>FIND YOUR</span>
            <em>NEXT MOVE.</em>
          </h1>
          <div className="collection-masthead-bottom">
            <p>
              Different shapes. Different stories.
              <br />
              Find the pair that feels like you.
            </p>
            <a href="#CollectionGallery" className="collection-explore">
              Explore the edit ↗
            </a>
          </div>
        </div>
        <div
          className="collection-masthead-art"
          aria-label="From the collection"
        >
          <div className="collection-orbit" aria-hidden="true">
            <span>EVERYDAY / ANYWHERE</span>
          </div>
          <span className="collection-art-mark" aria-hidden="true">
            S/
          </span>
          {all.slice(0, 2).map((item, index) => (
            <a
              href={`/products/${item.handle}`}
              className={`collection-hero-piece collection-hero-piece-${index + 1}`}
              key={item.id}
              aria-label={`Explore ${item.title}`}
            >
              <div className="collection-hero-media">
                {item.thumbnail && (
                  <img
                    data-catalog-hero-image
                    src={mediaFor(item, item.thumbnail, 720).src}
                    srcSet={mediaFor(item, item.thumbnail).srcSet}
                    sizes="(max-width: 700px) 80vw, 40vw"
                    width={1000}
                    height={1000}
                    alt={item.title}
                  />
                )}
              </div>
              <span className="collection-hero-caption">
                0{index + 1} / STRYDE
              </span>
            </a>
          ))}
        </div>
        <div className="collection-masthead-foot">
          <span>
            <b>{all.length}</b> pairs in the edit.
          </span>
          <span>Find your next move.</span>
        </div>
      </header>
      <div id="CollectionGallery" className="photo-shop collection-browser">
        <form
          className="independent-filters"
          method="get"
          role="search"
          aria-label="Browse the collection"
        >
          <label className="search-control">
            Search
            <input
              id="CollectionSearch"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={100}
              placeholder="Search the collection"
            />
          </label>
          <label>
            Collection
            <select name="collection" defaultValue={params.collection || ""}>
              <option value="">All collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.handle}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select name="category" defaultValue={params.category || ""}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.handle}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select name="sort" defaultValue={sort}>
              <option value="title">Name</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
            </select>
          </label>
          <button className="button button-dark" type="submit">
            Apply ↗
          </button>
        </form>
        <div className="collection-browser-meta">
          <p role="status">
            {filtered.length
              ? `${(page - 1) * 12 + 1}–${Math.min(page * 12, filtered.length)} of ${filtered.length} pairs`
              : "No products available"}
          </p>
          <a href="?">Clear filters</a>
        </div>
        {error && (
          <p className="commerce-message" role="alert">
            {error}
          </p>
        )}
        <div className="photo-shop-grid" data-grid-density="comfortable">
          {shown.map((item) => (
            <article
              className="photo-shop-card"
              data-product-id={item.id}
              key={item.id}
            >
              <a
                className="photo-shop-image"
                data-product-open
                href={`/products/${item.handle}`}
                aria-label={`View ${item.title}`}
              >
                <span className="photo-shop-card-top">
                  <span>{item.collection?.title || "Footwear"}</span>
                </span>
                <span
                  className="photo-shop-photo"
                  data-product-transition-frame
                >
                  {item.thumbnail ? (
                    <img
                      data-product-cover
                      src={mediaFor(item, item.thumbnail, 720).src}
                      srcSet={mediaFor(item, item.thumbnail).srcSet}
                      sizes="(max-width: 700px) 90vw, 33vw"
                      width={1000}
                      height={1000}
                      loading="lazy"
                      alt={item.title}
                    />
                  ) : (
                    <span>Photography pending approval</span>
                  )}
                </span>
                <span className="photo-shop-open" aria-hidden="true">
                  ↗
                </span>
                <span className="photo-shop-discover" aria-hidden="true">
                  Explore the pair
                </span>
              </a>
              <div className="photo-shop-info">
                <div>
                  <h2>
                    <a data-product-open href={`/products/${item.handle}`}>
                      {item.title}
                    </a>
                  </h2>
                  {mediaFor(item, item.thumbnail).attribution && (
                    <p className="micro">
                      {mediaFor(item, item.thumbnail).attribution}
                    </p>
                  )}
                  {item.metadata?.development_fixture === true && (
                    <p className="fixture-label">Development fixture</p>
                  )}
                  <p className="photo-shop-price">
                    {Number.isFinite(price(item))
                      ? money(
                          price(item),
                          item.variants.find((v) => v.calculated_price)
                            ?.calculated_price?.currency_code,
                        )
                      : "Price unavailable"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!shown.length && !error && (
          <div className="collection-browser-empty">
            <p>No matching designs.</p>
            <p>Try another search or clear the filters.</p>
          </div>
        )}
        {pages > 1 && (
          <nav className="collection-pagination" aria-label="Collection pages">
            {page > 1 && <a href={pageUrl(page - 1)}>← Previous</a>}
            <div className="collection-page-numbers">
              {Array.from({ length: pages }, (_, i) => (
                <a
                  href={pageUrl(i + 1)}
                  key={i}
                  aria-current={page === i + 1 ? "page" : undefined}
                >
                  {i + 1}
                </a>
              ))}
            </div>
            {page < pages && <a href={pageUrl(page + 1)}>Next →</a>}
          </nav>
        )}
      </div>
    </section>
  );
}
