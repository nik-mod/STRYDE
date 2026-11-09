import { isTestMode } from "@/lib/policy";
import { getEditorialEntries } from "@/lib/editorial-catalog";
import { catalogPage } from "@/lib/reference-catalog.mjs";

export function GET(request: Request) {
  if (!isTestMode()) return new Response(null, { status: 404 });
  const params = new URL(request.url).searchParams;
  const pathname = params.get("view") === "search" ? "/search" : "/collections/all";
  params.delete("view");
  if ([...params.values()].some((value) => value.length > 200))
    return Response.json({ error: "Filter is too long" }, { status: 400 });
  const state = catalogPage(getEditorialEntries(), params, pathname);
  return Response.json(state, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
