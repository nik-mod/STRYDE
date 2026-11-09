import { headers } from "next/headers";
import { Arrow } from "./Information";
import { catalogPage, CATALOG_PAGE_SIZE } from "@/lib/medusa";
import { money, type Product } from "@/lib/types";
import { mediaFor } from "@/lib/product-media";
import { isTestMode } from "@/lib/policy";
import { EditorialCatalog } from "./EditorialCatalog";
import { CollectionOpening } from "./CollectionOpening";
export async function Catalog({
  params,
  collection,
}: {
  params: Record<string, string | undefined>;
  collection?: string;
}) {
  const searchOnly = (await headers()).get("x-stryde-path") === "/search";
  params = Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  // The local photo collection is the browsing source, even when checkout
  // fixtures exist in Medusa. Fixtures must never replace the sneaker edit.
  // Commercial mode continues to use the approved Medusa catalog below.
  if (isTestMode() && (!collection || collection === "all"))
    return <EditorialCatalog params={params} searchOnly={searchOnly} />;
  const query = params.q?.slice(0, 100) || "";
  const page = Math.max(1, Number.parseInt(params.page || "1") || 1);
  let result: Awaited<ReturnType<typeof catalogPage>> | null = null;
  let error = "";
  try {
    result = await catalogPage({
      query,
      collection,
      category: params.category,
      page,
    });
  } catch (cause) {
    error = (cause as Error).message;
  }
  const all = result?.products ?? [];
  const sort = ["price-asc", "price-desc", "title"].includes(params.sort || "")
    ? params.sort
    : "title";
  // The uniform $140 catalog makes a client price re-sort a no-op; title order
  // comes from the backend. Kept for when price variation returns.
  const sorted = [...all];
  if (sort === "price-asc")
    sorted.sort(
      (a, b) => variantPrice(a) - variantPrice(b) || a.title.localeCompare(b.title),
    );
  else if (sort === "price-desc")
    sorted.sort(
      (a, b) => variantPrice(b) - variantPrice(a) || a.title.localeCompare(b.title),
    );
  const pages = Math.max(1, Math.ceil((result?.count ?? 0) / CATALOG_PAGE_SIZE));
  const shown = sorted;
  const collectionTitle = result?.collections.find((item) => item.handle === collection)?.title || "All sneakers";
  const pairs = searchOnly || query || page > 1 || params.category ? [] : (result?.featured ?? []).flatMap((item) => {
    if (!item.thumbnail) return [];
    const media = mediaFor(item, item.thumbnail, 720);
    return [{ href: `/products/${item.handle}`, title: item.title, image: media.src, srcSet: media.srcSet }];
  });
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
      <CollectionOpening
        title={searchOnly ? "Search sneakers" : collectionTitle}
        pairs={pairs}
      />
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
              {(result?.collections ?? []).map((c) => (
                <option key={c.id} value={c.handle}>
                  {c.title || c.handle}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select name="category" defaultValue={params.category || ""}>
              <option value="">All categories</option>
              {(result?.categories ?? []).map((c) => (
                <option key={c.id} value={c.handle}>
                  {c.name || c.handle}
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
            Apply
          </button>
        </form>
        <div className="collection-browser-meta">
          <p role="status">
            {result?.count
              ? `${(page - 1) * CATALOG_PAGE_SIZE + 1}–${Math.min(page * CATALOG_PAGE_SIZE, result.count)} of ${result.count} pairs`
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
                <span className="photo-shop-open" aria-hidden="true"><Arrow diagonal/></span>
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
                    {Number.isFinite(variantPrice(item))
                      ? money(
                          variantPrice(item),
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
              {pageWindow(page, pages).map((number) =>
                number === null ? (
                  <span key={`gap-${number}`}>…</span>
                ) : (
                  <a
                    href={pageUrl(number)}
                    key={number}
                    aria-current={page === number ? "page" : undefined}
                  >
                    {number}
                  </a>
                ),
              )}
            </div>
            {page < pages && <a href={pageUrl(page + 1)}>Next →</a>}
          </nav>
        )}
      </div>
    </section>
  );
}
function variantPrice(product: Product) {
  return Math.min(
    ...product.variants.map(
      (v) => v.calculated_price?.calculated_amount ?? Infinity,
    ),
  );
}
// 285 pages cannot all be listed; show first, last and the local window.
function pageWindow(page: number, pages: number): (number | null)[] {
  if (pages <= 7)
    return Array.from({ length: pages }, (_, i) => i + 1);
  const windowed = new Set<number>([1, 2, pages - 1, pages]);
  for (let n = page - 1; n <= page + 1; n += 1)
    if (n >= 1 && n <= pages) windowed.add(n);
  const ordered = [...windowed].sort((a, b) => a - b);
  const output: (number | null)[] = [];
  let previous = 0;
  for (const number of ordered) {
    if (number - previous > 1) output.push(null);
    output.push(number);
    previous = number;
  }
  return output;
}
