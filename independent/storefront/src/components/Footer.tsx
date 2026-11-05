import { Arrow } from "./Information";
import { NewsletterForm } from "./NewsletterForm";

const groups = [
  { title: "Explore", links: [["Collection", "/collections/all"], ["About", "/pages/about"], ["Account", "/account"], ["Wishlist", "/account/wishlist"]] },
  { title: "Customer care", links: [["Size guide", "/pages/size-guide"], ["FAQ", "/pages/faq"], ["Track order", "/orders/track"], ["Contact", "/pages/contact"]] },
  { title: "Policies", links: [["Shipping", "/policies/shipping"], ["Returns", "/policies/returns"], ["Privacy", "/policies/privacy"], ["Terms", "/policies/terms"]] },
];
export function Footer() {
  return <footer className="site-footer" data-signature-footer>
    <div className="signature-identity" data-footer-identity><a className="signature-wordmark" href="/" aria-label="STRYDE — Home" style={{ "--brand-characters": 6 } as React.CSSProperties}><span data-footer-word aria-hidden="true">{"STRYDE".split("").map(letter => <span className="signature-letter-mask" key={letter}><span data-footer-letter>{letter}</span></span>)}</span></a></div>
    <div className="signature-commerce"><p className="signature-statement">Your next pair starts here.</p><a className="signature-shop" href="/collections/all">View the collection <Arrow /></a></div>
    <div className="signature-directory">{groups.map(group => <nav key={group.title} aria-label={group.title}><p className="footer-group-title">{group.title}</p>{group.links.map(([text, href]) => <a key={href} href={href}>{text}</a>)}</nav>)}</div>
    <div className="footer-newsletter"><div><h2>Stay in the rotation.</h2><p>New pairs. New perspectives.</p></div><NewsletterForm /></div>
    <div className="footer-meta"><p>© 2026 STRYDE</p><a href="#MainContent" className="back-top">Back to top <Arrow diagonal /></a></div>
  </footer>;
}
