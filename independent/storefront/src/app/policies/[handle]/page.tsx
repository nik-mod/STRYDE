import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
const policies: Record<string, { title: string; content: string }> = {
  returns: {
    title: "Returns",
    content:
      "Commercial sales are not open yet. The merchant must publish the approved return window, condition requirements, return address, refund method, costs and exceptions before accepting orders. Test orders do not create shipments or charges.",
  },
  shipping: {
    title: "Shipping",
    content:
      "International shipping is not enabled. Service areas, carrier agreements, actual rates, delivery estimates, duties and customs responsibilities must be confirmed before commercial checkout opens. Development shipping rates are test data.",
  },
  privacy: {
    title: "Privacy",
    content:
      "This development store uses an essential, signed bag cookie to maintain your cart. Delivery information entered during test checkout is stored in the local commerce database. Use fictional test details. A production privacy notice identifying the business, contact, processors, retention and applicable privacy rights is required before launch.",
  },
  terms: {
    title: "Terms",
    content:
      "This store is in development. Test products, prices and inventory are not commercial offers. No real payments are accepted. Business identity, merchandise identity, sales terms, applicable consumer rights and dispute handling must be reviewed and published before launch.",
  },
};
export default async function Policy({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const policy = policies[(await params).handle];
  if (!policy) notFound();
  return (
    <Shell>
      <section className="commerce-panel">
        <p className="fixture-label">
          Store information · Preparation in progress
        </p>
        <h1>{policy.title}.</h1>
        <p>{policy.content}</p>
        <a className="text-link" href="/">
          Back to STRYDE ↗
        </a>
      </section>
    </Shell>
  );
}
