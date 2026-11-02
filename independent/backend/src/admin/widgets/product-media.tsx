import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type {
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types";
import {
  Container,
  Heading,
  Button,
  Input,
  Label,
  Text,
  Badge,
} from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
const emptyIdentity = {
  brand: "",
  model: "",
  style_code: "",
  colorway: "",
  stockx_product_id: "",
  stockx_url: "",
};
async function request(path: string, value?: unknown) {
  const response = await fetch(path, {
    credentials: "include",
    headers: value ? { "Content-Type": "application/json" } : {},
    method: value ? "POST" : "GET",
    ...(value ? { body: JSON.stringify(value) } : {}),
  });
  const result: any = await response.json();
  if (!response.ok)
    throw new Error(result.message || "The request could not be completed.");
  return result;
}
const names: Record<string, string> = {
  brand: "Brand",
  model: "Exact model / revision",
  style_code: "Manufacturer style code",
  colorway: "Exact colorway",
  stockx_product_id: "StockX product ID",
  stockx_url: "StockX product reference (HTTPS)",
};
export default function ProductMedia({
  data,
}: DetailWidgetProps<AdminProduct>) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<any>(null);
  const [identity, setIdentity] = useState(emptyIdentity);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [license, setLicense] = useState("");
  const [source, setSource] = useState("");
  const [attribution, setAttribution] = useState("");
  const [rights, setRights] = useState(false);
  const [exact, setExact] = useState(false);
  const [markings, setMarkings] = useState(false);
  const [studio, setStudio] = useState(false);
  const [optimize, setOptimize] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sale, setSale] = useState(false);
  const [visible, setVisible] = useState(false);
  const endpoint = `/admin/stryde/products/${data.id}/media`;
  function accept(result: any, initial = false) {
    setState(result);
    setSelected(
      result.product.images
        .map((i: any) => result.records.find((r: any) => r.url === i.url)?.id)
        .filter(Boolean),
    );
    if (initial) {
      setIdentity({
        ...emptyIdentity,
        ...result.product.metadata?.stryde_identity,
      });
      setVerified(result.product.metadata?.identity_verified === true);
      setSale(result.product.metadata?.sale_permitted === true);
      setVisible(result.product.metadata?.commerce_approved === true);
    }
  }
  useEffect(() => {
    let active = true;
    request(endpoint)
      .then((result) => {
        if (active) accept(result, true);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [data.id]);
  async function mutate(value: any, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request(endpoint, value);
      accept(result);
      setMessage(success);
      await queryClient.invalidateQueries();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function lookup() {
    setBusy(true);
    setError("");
    try {
      const result = await request(
        `/admin/stryde/stockx?q=${encodeURIComponent(search)}`,
      );
      setMatches(result.products);
      setMessage(result.notice);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 12 * 1024 * 1024)
        throw new Error("Choose a file no larger than 12 MiB.");
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("The file could not be read."));
        reader.readAsDataURL(file);
      });
      const result = await request(endpoint, {
        action: "upload",
        content,
        source: "stockx",
        source_url: source,
        license_reference: license,
        attribution,
        rights_confirmed: rights,
        exact_match_confirmed: exact,
        markings_preserved: markings,
        studio_background_confirmed: studio,
        optimize_permitted: optimize,
      });
      accept(result);
      setMessage(
        "Media stored with provenance. Select it below, then save the gallery.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(id: string, direction: number) {
    const next = [...selected],
      at = next.indexOf(id),
      to = at + direction;
    if (at < 0 || to < 0 || to >= next.length) return;
    [next[at], next[to]] = [next[to], next[at]];
    setSelected(next);
  }
  const records =
    state?.records.filter((r: any) => !r.details.removed_at) || [];
  return (
    <Container className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level="h2">STRYDE product & media review</Heading>
        <Badge
          color={
            state?.product.metadata?.stryde_media?.approved ? "green" : "orange"
          }
        >
          {state?.product.metadata?.stryde_media?.approved
            ? "Media reviewed"
            : "Pending media"}
        </Badge>
      </div>
      <Text className="mt-2 text-ui-fg-subtle">
        Use the native product sections for descriptions, sizes, color variants,
        prices, inventory, categories and collections. This review controls
        commercial visibility and the StockX media standard.
      </Text>
      {data.metadata?.development_fixture === true && (
        <Text className="mt-3">
          Development fixture: keep separate from merchandise. Commercial
          publication is blocked.
        </Text>
      )}
      <fieldset disabled={busy} className="mt-6 grid gap-4">
        <Heading level="h3">Product identity</Heading>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(names).map(([key, name]) => (
            <div key={key}>
              <Label htmlFor={`stryde-${key}`}>{name}</Label>
              <Input
                id={`stryde-${key}`}
                value={identity[key as keyof typeof identity]}
                maxLength={key === "stockx_url" ? 1000 : 200}
                onChange={(e) =>
                  setIdentity({ ...identity, [key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={() =>
              mutate(
                { action: "identity", identity },
                "Identity saved. Review matching photos before publication.",
              )
            }
          >
            Save identity
          </Button>
        </div>
        <Label htmlFor="stryde-search">Authorized StockX catalog lookup</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="stryde-search"
            value={search}
            maxLength={120}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Exact style code or model"
          />
          <Button variant="secondary" onClick={lookup}>
            Search catalog
          </Button>
        </div>
        <Text className="text-ui-fg-subtle">
          Lookup requires approved credentials and a grant permitting this use.
          Catalog matching does not grant photo rights or prove merchandise
          authenticity.
        </Text>
        {matches.map((match) => (
          <div
            key={match.product_id}
            className="flex flex-wrap items-center gap-3 border-b pb-3"
          >
            <Text>
              {match.model} · {match.style_code} · {match.colorway}
            </Text>
            <Button
              variant="secondary"
              onClick={() => {
                setIdentity({
                  ...emptyIdentity,
                  ...match,
                  stockx_product_id: match.product_id,
                  stockx_url: match.source_url,
                });
                setSource(match.source_url);
              }}
            >
              Use candidate for review
            </Button>
          </div>
        ))}
        <Heading level="h3">Authorized StockX photograph</Heading>
        <Text>
          Upload only files you are entitled to display and store for this
          commercial storefront. A StockX page or API key alone is insufficient.
          Files are never fetched from a supplied URL.
        </Text>
        <div>
          <Label htmlFor="stryde-source">
            Original StockX image or product reference
          </Label>
          <Input
            id="stryde-source"
            type="url"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="stryde-license">
            Private license / written authorization reference
          </Label>
          <Input
            id="stryde-license"
            value={license}
            maxLength={1000}
            onChange={(e) => setLicense(e.target.value)}
          />
          <Text className="text-ui-fg-subtle">
            Reference your securely retained agreement. Do not paste passwords
            or API keys.
          </Text>
        </div>
        <div>
          <Label htmlFor="stryde-attribution">
            Required public attribution (leave empty only if none is required)
          </Label>
          <Input
            id="stryde-attribution"
            value={attribution}
            maxLength={1000}
            onChange={(e) => setAttribution(e.target.value)}
          />
        </div>
        {[
          [
            rights,
            setRights,
            "I have explicit permission for commercial storefront display and permanent storage.",
          ],
          [
            exact,
            setExact,
            "I checked the exact brand, model revision, style code and colorway against this product.",
          ],
          [
            markings,
            setMarkings,
            "All required source markings, watermarks and credits are preserved.",
          ],
          [
            studio,
            setStudio,
            "This is a sharp, neutral-background product photograph with accurate proportions.",
          ],
          [
            optimize,
            setOptimize,
            "The license also permits resizing and format conversion (optional).",
          ],
        ].map(([value, set, label], i) => (
          <label className="flex items-start gap-2" key={i}>
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
            />
            <span>{label as string}</span>
          </label>
        ))}
        <div>
          <Label htmlFor="stryde-file">
            JPEG, PNG or WebP · up to 12 MiB · minimum 1000 × 500 pixels
          </Label>
          <Input
            id="stryde-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={
              !rights || !exact || !markings || !studio || license.length < 3
            }
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <Heading level="h3">Gallery & publication</Heading>
        <Text>
          Select photos, then order them below. The first selected photograph is
          the primary image used in cards and the bag.
        </Text>
        {!records.length && (
          <Text>
            No authorized media has been recorded. The product remains pending
            media.
          </Text>
        )}
        {[
          ...selected
            .map((id) => records.find((r: any) => r.id === id))
            .filter(Boolean),
          ...records.filter((r: any) => !selected.includes(r.id)),
        ].map((r: any) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-4 border-b py-3"
          >
            <img
              src={r.url}
              width="100"
              height="80"
              style={{ objectFit: "contain" }}
              alt={`${r.details.model || "Media"} — ${r.details.colorway || "pending review"}`}
            />
            <div className="min-w-0 flex-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, r.id]
                        : selected.filter((id) => id !== r.id),
                    )
                  }
                />
                <span>
                  {selected[0] === r.id
                    ? "Primary image"
                    : selected.includes(r.id)
                      ? `Gallery ${selected.indexOf(r.id) + 1}`
                      : "Not selected"}
                </span>
              </label>
              <Text size="small">
                {r.details.source} · {r.width} × {r.height} ·{" "}
                {r.details.style_code}
              </Text>
              <Text size="small">
                License: {r.details.license_status} · Match:{" "}
                {r.details.match_status}
              </Text>
              <Text size="small">
                Authorization: {r.details.license_reference}
              </Text>
              <a
                className="text-ui-fg-interactive"
                href={r.details.source_url}
                target="_blank"
                rel="noreferrer"
              >
                Source reference
              </a>
            </div>
            <Button
              variant="secondary"
              disabled={!selected.includes(r.id) || selected[0] === r.id}
              onClick={() => move(r.id, -1)}
            >
              Move earlier
            </Button>
            <Button
              variant="secondary"
              disabled={
                !selected.includes(r.id) ||
                selected[selected.length - 1] === r.id
              }
              onClick={() => move(r.id, 1)}
            >
              Move later
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (
                  window.confirm(
                    "Remove this photo from the library and gallery? The product will return to draft.",
                  )
                )
                  void mutate(
                    { action: "remove", id: r.id },
                    "Photo detached; private provenance retained.",
                  );
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
          I verified the actual merchandise identity. Photo matching is not
          proof of authenticity.
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={sale}
            onChange={(e) => setSale(e.target.checked)}
          />
          The merchandise is permitted for sale and its description is accurate.
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
          />
          Show this reviewed product in the storefront when published.
        </label>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() =>
              mutate(
                {
                  action: "save",
                  ids: selected,
                  identity_verified: verified,
                  sale_permitted: sale,
                  visible: false,
                  publish: false,
                },
                "Draft gallery saved.",
              )
            }
          >
            Save as draft
          </Button>
          <Button
            onClick={() =>
              mutate(
                {
                  action: "save",
                  ids: selected,
                  identity_verified: verified,
                  sale_permitted: sale,
                  visible,
                  publish: true,
                },
                "Reviewed product published. Live checkout remains disabled.",
              )
            }
          >
            Publish reviewed product
          </Button>
        </div>
      </fieldset>
      <div className="mt-4">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                "Archive this product? It will be kept as a hidden draft.",
              )
            )
              void mutate({ action: "archive" }, "Archived as a hidden draft.");
          }}
        >
          Archive product
        </Button>
      </div>
      {busy && (
        <Text className="mt-4" role="status">
          Saving or checking media…
        </Text>
      )}
      {message && (
        <Text className="mt-4" role="status">
          {message}
        </Text>
      )}
      {error && (
        <Text className="mt-4 text-ui-fg-error" role="alert">
          {error}
        </Text>
      )}
      {state?.issues?.length > 0 && (
        <div className="mt-4">
          <Text weight="plus">Before publication</Text>
          <ul className="list-disc pl-5">
            {state.issues.map((issue: string) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
}
export const config = defineWidgetConfig({ zone: "product.details.after" });
