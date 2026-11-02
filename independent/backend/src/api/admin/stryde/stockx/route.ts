import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
// Catalog lookup only. No undocumented image endpoints, HTML fetching or scraping.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  if (
    !process.env.STOCKX_API_KEY ||
    !process.env.STOCKX_ACCESS_TOKEN ||
    !process.env.STOCKX_CATALOG_USE_AUTHORIZATION
  ) {
    res
      .status(424)
      .json({
        message:
          "StockX catalog lookup needs approved API access, a valid access token, and a recorded grant permitting this STRYDE use. Image display rights are a separate grant.",
      });
    return;
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2 || q.length > 120) {
    res
      .status(400)
      .json({
        message: "Enter a style code or product name (2–120 characters).",
      });
    return;
  }
  const url = new URL("https://api.stockx.com/v2/catalog/search");
  url.searchParams.set("query", q);
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("pageNumber", "1");
  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.STOCKX_API_KEY,
        Authorization: `Bearer ${process.env.STOCKX_ACCESS_TOKEN}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      res
        .status(502)
        .json({
          message: `StockX rejected the authorized catalog request (${response.status}). Check approval, token expiry and quota.`,
        });
      return;
    }
    const data: any = await response.json();
    res.json({
      products: (data.products || []).map((p: any) => ({
        product_id: p.productId,
        brand: p.brand,
        model: p.title,
        style_code: p.styleId,
        colorway: p.productAttributes?.colorway,
        source_url: `https://stockx.com/${encodeURIComponent(p.urlKey)}`,
      })),
      images_available: false,
      notice:
        "Candidates require human exact-style/colorway confirmation. No image or authenticity rights are granted by this match.",
    });
  } catch {
    res
      .status(502)
      .json({
        message:
          "StockX catalog lookup is unavailable. No fallback scraper is used.",
      });
  }
}
