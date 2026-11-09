import { getEditorialEntries } from "@/lib/editorial-catalog";
import { catalogPage } from "@/lib/reference-catalog.mjs";
import { WishlistButton } from "./WishlistButton";
import { ShopIcon } from "./ShopUI";
import { CollectionOpening } from "./CollectionOpening";

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 12h16m-7-7 7 7-7 7" />
    </svg>
  );
}
export function EditorialCatalog({
  params,
  searchOnly = false,
}: {
  params: Record<string, string | undefined>;
  searchOnly?: boolean;
}) {
  const entries = getEditorialEntries();
  const query = new URLSearchParams(
    Object.entries(params).filter(
      (e): e is [string, string] => typeof e[1] === "string",
    ),
  );
  const pathname = searchOnly ? "/search" : "/collections/all";
  const state: any = catalogPage(entries, query, pathname);
  const pairs = searchOnly ? [] : state.featured.map((item: (typeof entries)[number]) => ({
      href: item.url,
      title: item.displayTitle,
      caption: item.brand,
      image: item.cover,
      bounds: item.coverBounds,
  }));
  return (
    <section
      className="page-shell collection-page collection-studio"
      data-listing-section
      data-section-id="restored-collection"
    >
      <CollectionOpening
        title={searchOnly ? "Search sneakers" : "Sneaker edit"}
        description="From the Samba’s low gum sole to the sculpted New Balance 9060."
        pairs={pairs}
        editorial
      />
      <div className="photo-shop collection-browser" data-photo-shop>
        <div className="collection-gallery-heading" id="CollectionGallery">
          {!searchOnly && <h2>All sneakers</h2>}
          <p data-photo-results role="status" aria-live="polite">
            {state.total ? `${state.rangeStart}–${state.rangeEnd} of ${state.total.toLocaleString("en")} ${state.total === 1 ? "pair" : "pairs"}` : "No pairs found"}
          </p>
        </div>
        <div className="collection-toolbar">
          <form
            className="collection-browser-controls"
            method="get"
            action={pathname}
            data-catalog-form
            role="search"
            aria-label="Browse the collection"
          >
            <label className="collection-search">
              <ShopIcon name="search" size={20} />
              <span className="sr-only">Search the collection</span>
              <input
                id="CollectionSearch"
                type="search"
                name="q"
                data-photo-search
                defaultValue={state.q}
                placeholder="Search sneakers"
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>
            <label className="collection-select">
              <span>Brand</span>
              <select
                name="brand"
                aria-label="Filter by brand"
                defaultValue={state.brand}
              >
                <option value="">All brands</option>
                {state.brands.map((brand: string) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
            <label className="collection-select">
              <span>Color</span>
              <select
                name="color"
                aria-label="Filter by color"
                defaultValue={state.color}
              >
                <option value="">All colors</option>
                {state.colors.map((color: string) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
            <label className="collection-select collection-sort">
              <span>Sort</span>
              <select
                name="sort"
                aria-label="Sort the collection"
                defaultValue={state.sort}
              >
                <option value="studio">Featured</option>
                <option value="name-ascending">Name, A–Z</option>
                <option value="name-descending">Name, Z–A</option>
              </select>
            </label>
            <button className="collection-filter-submit" type="submit">
              Apply filters <Arrow />
            </button>
          </form>
        </div>
        <div className="collection-browser-meta">
          <div className="collection-meta-actions">
            <a
              href={state.clearUrl}
              data-catalog-reset
              hidden={!state.hasFilters}
            >
              Clear filters <ShopIcon name="close" size={14} />
            </a>
            <div
              className="collection-density"
              role="group"
              aria-label="Gallery density"
            >
              <button
                type="button"
                data-catalog-density="comfortable"
                aria-label="Roomy gallery"
                aria-pressed="true"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M2 3h6v14H2zM12 3h6v14h-6z" />
                </svg>
              </button>
              <button
                type="button"
                data-catalog-density="compact"
                aria-label="Compact gallery"
                aria-pressed="false"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M1 3h4v14H1zM8 3h4v14H8zM15 3h4v14h-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div
          className="collection-active-filters"
          data-catalog-active
          hidden={!state.hasFilters}
        >
          {state.activeFilters.map((filter: any) => (
            <a href={filter.url} data-catalog-remove key={filter.label}>
              {filter.label} <ShopIcon name="close" size={14} />
              <span className="sr-only">Remove filter</span>
            </a>
          ))}
        </div>
        <div
          className="photo-shop-grid"
          data-catalog-grid
          data-grid-density="comfortable"
        >
          {state.items.map((item: any, index: number) => (
            <article
              className="photo-shop-card"
              data-photo-card
              data-product-id={item.id}
              style={{ "--card-order": index } as React.CSSProperties}
              key={item.id}
            >
              <WishlistButton handle={item.url.slice("/products/".length)} compact />
              <a
                className="photo-shop-image"
                data-product-open
                href={item.url}
                aria-label={`View ${[item.displayTitle, item.displayColorway].filter(Boolean).join(", ")}`}
              >
                <span
                  className="photo-shop-photo"
                  data-product-transition-frame
                >
                  <img
                    data-product-cover
                    data-studio-ground={item.studioGround}
                    data-photo-bounds={item.coverBounds}
                    src={item.cover}
                    width={1000}
                    height={1000}
                    loading={index < 3 ? "eager" : "lazy"}
                    alt={item.title}
                  />
                </span>
                <span className="photo-shop-open" aria-hidden="true">
                  <Arrow />
                </span>
                <span className="photo-shop-discover" aria-hidden="true">
                  Explore the pair
                </span>
              </a>
              <div className="photo-shop-info">
                <div>
                  <h2>
                    <a data-product-open href={item.url}>
                      {item.displayTitle}
                    </a>
                  </h2>
                  <p className="photo-shop-colorway">{item.displayColorway}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div
          className="collection-browser-empty"
          data-catalog-empty
          hidden={state.total > 0}
        >
          <p>No matching designs.</p>
          <p>Try another brand, model, or color.</p>
          <a href={state.clearUrl} data-catalog-reset>
            View all footwear <Arrow />
          </a>
        </div>
        <nav
          className="collection-pagination"
          aria-label="Collection pages"
          data-catalog-pagination
        >
          {state.pages > 1 && (
            <>
              <a
                className={`collection-page-direction${state.previous ? "" : " is-disabled"}`}
                href={state.previous || undefined}
                data-catalog-page={state.previous ? "" : undefined}
                aria-disabled={!state.previous}
              >
                <Arrow />
                <span>Previous</span>
              </a>
              <div className="collection-page-numbers">
                {state.pagination.map((part: any, index: number) =>
                  part.ellipsis ? (
                    <span key={index}>…</span>
                  ) : (
                    <a
                      href={part.url}
                      data-catalog-page
                      aria-current={part.current ? "page" : undefined}
                      aria-label={`Page ${part.number}`}
                      key={index}
                    >
                      {part.label}
                    </a>
                  ),
                )}
              </div>
              <a
                className={`collection-page-direction${state.next ? "" : " is-disabled"}`}
                href={state.next || undefined}
                data-catalog-page={state.next ? "" : undefined}
                aria-disabled={!state.next}
              >
                <span>Next</span>
                <Arrow />
              </a>
            </>
          )}
        </nav>
        <script
          type="application/json"
          data-catalog-data
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              endpoint: "/api/reference-catalog",
            }).replaceAll("<", String.fromCharCode(92) + "u003c"),
          }}
        />
      </div>
    </section>
  );
}
