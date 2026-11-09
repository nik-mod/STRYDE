import { Arrow } from "./Information";
const iconPaths = {
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  bag: "M5.5 8h13l1 12h-15l1-12ZM9 9V6a3 3 0 0 1 6 0v3",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  search: "M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Zm-1.9 4.6L21 21",
  expand: "M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5",
  zoom: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1.75 4.25L20 20M7 10h6m-3-3v6",
  plus: "M5 12h14M12 5v14",
  minus: "M5 12h14",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
};

export function ShopIcon({ name, size = 24 }: { name: keyof typeof iconPaths; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={iconPaths[name]} />
    </svg>
  );
}
export function PreviewNote({ children }: { children?: React.ReactNode }) { return <p className="shop-preview-note">{children || "UI preview. Sizes, prices and availability are sample values. No purchase or charge is made."}</p>; }
export function ShopPage({ title, accent, description, children }: { title: string; accent?: string; description?: string; children: React.ReactNode }) { return <section className="shop-page"><header className="shop-heading"><h1>{title}{accent && <><br/><em>{accent}</em></>}</h1>{description && <p>{description}</p>}</header>{children}</section>; }
export function ShopEmpty({ title, children, href = "/collections/all", action = "Explore the collection" }: { title: string; children: React.ReactNode; href?: string; action?: string }) { return <div className="shop-empty"><ShopIcon name="bag" size={48}/><h2>{title}</h2><p>{children}</p><a className="shop-button" href={href}>{action}<Arrow/></a></div>; }
export function AccountShell({ title, description, active = "/account", children }: { title: string; description: string; active?: string; children: React.ReactNode }) { const links = [["Overview", "/account"], ["Orders", "/account/orders"], ["Addresses", "/account/addresses"], ["Wishlist", "/account/wishlist"]]; return <ShopPage title={title} description={description}><div className="account-layout"><nav className="account-navigation" aria-label="Account navigation">{links.map(([label, href]) => <a href={href} key={href} aria-current={active === href ? "page" : undefined}>{label}<Arrow diagonal/></a>)}<a href="/pages/contact">Get help<Arrow diagonal/></a></nav><div className="account-content">{children}</div></div></ShopPage>; }
