import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Arrow } from "@/components/Information";
import { storePolicies } from "@/lib/store-information";
type Props = { params: Promise<{ handle: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const handle = (await params).handle;
  const policy = Object.hasOwn(storePolicies, handle) ? storePolicies[handle] : undefined;
  return { title: policy?.title || "Store information" };
}
export default async function Policy({ params }: Props) {
  const handle = (await params).handle, policy = Object.hasOwn(storePolicies, handle) ? storePolicies[handle] : undefined;
  if (!policy) notFound();
  return <Shell><article className={`information-page policy-page policy-${handle}`} data-information>
    <header className="information-heading"><h1>{policy.title}<span>.</span></h1><p>{policy.introduction}</p></header>
    <div className="policy-layout">
      <aside className="policy-sidebar"><nav aria-label="Store information">{Object.entries(storePolicies).map(([key, p]) => <a key={key} href={`/policies/${key}`} aria-current={key === handle ? "page" : undefined}>{p.title}<Arrow diagonal /></a>)}</nav><a className="information-back" href="/collections/all">Back to the collection <Arrow /></a></aside>
      <div className="policy-reading"><div className="publication-note"><strong>Policies in preparation</strong><p>Commercial checkout is closed while the details below are finalized.</p></div>
        {policy.sections.map((section, index) => <section key={section.id} id={section.id} className="policy-section" data-info-reveal><h2>{section.title}</h2><p>{section.text}</p>{index === 0 && <nav className="policy-contents" aria-label="On this page">{policy.sections.slice(1).map(item => <a key={item.id} href={`#${item.id}`}>{item.title}<Arrow diagonal /></a>)}</nav>}{section.pending && <><h3>Details awaiting approval</h3><ul>{section.pending.map(item => <li key={item}>{item}</li>)}</ul></>}</section>)}
        <div className="policy-help"><h2>A question about the store?</h2><a href="/pages/contact">Contact STRYDE <Arrow /></a></div>
      </div>
    </div>
  </article></Shell>;
}
