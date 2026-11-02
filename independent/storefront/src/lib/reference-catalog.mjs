// Preserved pure catalog state from the original STRYDE collection. No platform runtime.
const MANAGED = ["q", "brand", "color", "edit", "sort", "page"];
const clean = (value) => String(value || "").trim();
const normalize = (value) => clean(value).toLocaleLowerCase();
export const COLLECTION_PAGE_SIZE = 12;

export function prepareCatalog(catalog) {
  const entries = catalog
    .map((item, order) => {
      const identified = ["source-verified", "visually-identified"].includes(
        item.identityStatus,
      );
      const number = clean(item.id).replace(/\D/g, "").padStart(4, "0");
      const title =
        identified || item.identityStatus === "filename"
          ? clean(item.title).replace(
              /\s*[·—]\s*(multiple colorways|model unverified)\s*$/i,
              "",
            )
          : `Footwear study ${number}`;
      const cover = item.coverPhoto || item.photos?.[0];
      const colors = clean(item.colorway)
        .split(/\s*\/\s*/)
        .filter((color) => color && !/mixed colorways/i.test(color));
      return {
        id: item.id,
        title,
        brand: clean(item.brand),
        colorway: clean(item.colorway),
        colors,
        source:
          item.sourceSet === "StockX editorial edit" ? "stockx" : "archive",
        sku: clean(item.sku),
        description: clean(item.description),
        identified,
        provisional: item.identityStatus === "filename",
        count: Number(item.count) || item.photos?.length || 1,
        cover: cover?.src || "",
        alternate: "",
        url: item.url,
        order,
        coverBounds: cover?.bounds?.join(",") || "",
        alternateBounds: "",
        studioGround: cover?.studioGround || "",
        alternateStudioGround: "",
        query: normalize(
          `${item.title} ${item.brand || ""} ${item.colorway || ""} ${item.sourceSet || ""} ${item.sku || ""}`,
        ),
      };
    })
    .filter((item) => item.cover && /^\/products\//.test(item.url));
  // The opening edit shows the breadth of the supplied photographs. Rotate
  // through identified brands before continuing into the unlabelled studies.
  const groups = new Map();
  entries
    .filter((item) => item.identified || item.provisional)
    .forEach((item) => {
      if (!groups.has(item.brand)) groups.set(item.brand, []);
      groups.get(item.brand).push(item);
    });
  let rank = 0;
  while ([...groups.values()].some((items) => items.length)) {
    for (const items of groups.values())
      if (items.length) items.shift().studioOrder = rank++;
  }
  entries
    .filter((item) => !item.identified && !item.provisional)
    .forEach((item) => {
      item.studioOrder = rank++;
    });
  return entries;
}

export function collectionHref(
  params,
  changes = {},
  pathname = "/collections/all",
) {
  const query = new URLSearchParams(params);
  query.delete("edit");
  for (const [key, value] of Object.entries(changes)) {
    if (key === "edit") continue;
    if (
      !value ||
      (key === "sort" && value === "studio") ||
      (key === "page" && Number(value) === 1)
    )
      query.delete(key);
    else query.set(key, value);
  }
  return pathname + (query.size ? `?${query}` : "");
}

export function catalogPage(
  entries,
  params = new URLSearchParams(),
  pathname = "/collections/all",
  pageSize = COLLECTION_PAGE_SIZE,
) {
  const q = clean(params.get("q")),
    brand = clean(params.get("brand")),
    color = clean(params.get("color"));
  const sort = ["name-ascending", "name-descending", "views"].includes(
    params.get("sort"),
  )
    ? params.get("sort")
    : "studio";
  const words = normalize(q).split(/\s+/).filter(Boolean);
  const matches = entries.filter(
    (item) =>
      (!brand || item.brand === brand) &&
      (!color || item.colors.includes(color)) &&
      words.every((word) => item.query.includes(word)),
  );
  matches.sort((a, b) =>
    sort === "name-ascending"
      ? a.title.localeCompare(b.title)
      : sort === "name-descending"
        ? b.title.localeCompare(a.title)
        : sort === "views"
          ? b.count - a.count || a.order - b.order
          : a.studioOrder - b.studioOrder,
  );
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(params.get("page"), 10) || 1),
  );
  const href = (changes) => collectionHref(params, changes, pathname);
  const numbers = [
    ...new Set(
      [1, page - 1, page, page + 1, pages].filter(
        (number) => number > 0 && number <= pages,
      ),
    ),
  ].sort((a, b) => a - b);
  const pagination = [];
  numbers.forEach((number, index) => {
    if (index && number - numbers[index - 1] > 1)
      pagination.push({ ellipsis: true, label: "…" });
    pagination.push({
      number,
      label: String(number).padStart(2, "0"),
      current: number === page,
      url: href({ page: number }),
    });
  });
  return {
    q,
    brand,
    color,
    sort,
    page,
    pages,
    total: matches.length,
    all: entries.length,
    featured: (entries.some((item) => item.source === "stockx")
      ? ["stockx-0001", "stockx-0019"]
      : ["pair-0053", "pair-0024"]
    )
      .map((id) => entries.find((item) => item.id === id && item.identified))
      .filter(Boolean),
    brands: [
      ...new Set(entries.map((item) => item.brand).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b)),
    colors: [...new Set(entries.flatMap((item) => item.colors))].sort((a, b) =>
      a.localeCompare(b),
    ),
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    rangeStart: matches.length ? (page - 1) * pageSize + 1 : 0,
    rangeEnd: Math.min(page * pageSize, matches.length),
    pagination,
    previous: page > 1 ? href({ page: page - 1 }) : "",
    next: page < pages ? href({ page: page + 1 }) : "",
    clearUrl: href(Object.fromEntries(MANAGED.map((key) => [key, ""]))),
    activeFilters: [
      ["q", q ? `Search: ${q}` : ""],
      ["brand", brand],
      ["color", color],
    ]
      .filter(([, label]) => label)
      .map(([key, label]) => ({ label, url: href({ [key]: "", page: "" }) })),
    hasFilters: Boolean(q || brand || color),
  };
}
