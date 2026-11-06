import { Arrow } from "./Information";
import { CareNavigation } from "./CareNavigation";

export function CustomerPage({ title, accent, introduction, children, className = "" }: {
  title: string; accent: string; introduction: string; children: React.ReactNode; className?: string;
}) {
  return <div className={`customer-page ${className}`}>
    <CareNavigation/>
    <header className="customer-heading"><h1>{title}<br /><em>{accent}</em></h1><p>{introduction}</p></header>
    {children}
    <aside className="customer-support"><div><h2>A little help goes a long way.</h2><p>Questions about a pair or an order? Start with our contact page.</p></div><a href="/pages/contact">Get in touch <Arrow diagonal /></a></aside>
  </div>;
}
