"use client";
import { usePathname } from "next/navigation";
import { Arrow } from "./Information";
const groups = [
  { title: "Customer care", links: [["Size guide", "/pages/size-guide"], ["FAQ", "/pages/faq"], ["Track order", "/orders/track"], ["Contact", "/pages/contact"]] },
  { title: "Store policies", links: [["Shipping", "/policies/shipping"], ["Returns", "/policies/returns"], ["Privacy", "/policies/privacy"], ["Terms", "/policies/terms"]] },
];
export function CareNavigation() {
  const path = usePathname();
  return <nav className="care-route-nav" aria-label="Customer care and policies">
    <div className="care-route-links">{groups.map(group => <div className="care-route-group" key={group.title}><span>{group.title}</span><div>{group.links.map(([label, href]) => <a key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}<Arrow diagonal/></a>)}</div></div>)}</div>
    <label className="care-route-select">Explore customer care<select value={path} onChange={event => window.location.assign(event.currentTarget.value)}>{groups.map(group => <optgroup key={group.title} label={group.title}>{group.links.map(([label, href]) => <option key={href} value={href}>{label}</option>)}</optgroup>)}</select></label>
  </nav>;
}
