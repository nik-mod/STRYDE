import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Gallery } from "@/components/Gallery";
import {
  EditorialProduct,
  editorialProduct,
} from "@/components/EditorialProduct";
import { isTestMode } from "@/lib/policy";
import { RelatedProducts } from "@/components/RelatedProducts";
import { ProductPicker } from "@/components/ProductPicker";
import { product } from "@/lib/medusa";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const handle = (await params).handle;
  const reference = isTestMode() ? editorialProduct(handle) : undefined;
  if (reference)
    return { title: reference.title, robots: { index: false, follow: false } };
  try {
    const item = await product(handle);
    return {
      title: item?.title || "Product",
      ...(item?.metadata?.development_fixture
        ? { robots: { index: false, follow: false } }
        : {}),
    };
  } catch {
    return { title: "Product" };
  }
}
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const handle = (await params).handle;
  if (isTestMode() && /^stockx-/.test(handle)) {
    if (!editorialProduct(handle)) notFound();
    return (
      <Shell>
        <EditorialProduct handle={handle} />
      </Shell>
    );
  }
  let item;
  let error = "";
  try {
    item = await product((await params).handle);
  } catch (cause) {
    error = (cause as Error).message;
  }
  if (error)
    return (
      <Shell>
        <section className="commerce-panel">
          <h1>The collection</h1>
          <p role="alert">{error}</p>
          <a href="/collections/all">Return to collection</a>
        </section>
      </Shell>
    );
  if (!item) notFound();
  return (
    <Shell>
      <section className="studio-product page-shell" data-product-section>
        <nav className="studio-breadcrumbs" aria-label="Breadcrumbs">
          <a data-collection-return href="/collections/all">
            ← Back to Collection
          </a>
          <span>{item.collection?.title || "Footwear"}</span>
        </nav>
        <div className="studio-product-layout">
          <Gallery product={item} />
          <div className="studio-product-information">
            <div className="studio-product-title">
              <h1>{item.title}</h1>
            </div>
            {item.metadata?.development_fixture === true && (
              <p className="fixture-label">
                Development fixture · Not commercial merchandise
              </p>
            )}
            <p className="studio-product-description">{item.description}</p>
            <ProductPicker
              product={item}
              selected={(await searchParams).variant}
            />
            <details className="studio-photo-details">
              <summary>Delivery & returns +</summary>
              <div>
                <p>
                  Available shipping options and applicable charges are
                  calculated at checkout.
                </p>
                <a href="/policies/shipping">Delivery information</a>
                <br />
                <a href="/policies/returns">Returns policy</a>
              </div>
            </details>
          </div>
        </div>
      </section>
      <RelatedProducts product={item} />
    </Shell>
  );
}
