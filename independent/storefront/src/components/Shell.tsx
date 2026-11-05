import { design } from "@/lib/design";
import { headers } from "next/headers";
import { NewsletterForm } from "./NewsletterForm";
export async function Shell({
  children,
  home = false,
}: {
  children: React.ReactNode;
  home?: boolean;
}) {
  const header = await design("header.html");
  let navigation = home
    ? header
    : header.replace(/<a data-home-only\b[^>]*>[\s\S]*?<\/a>/g, "");
  // The independent store adds an account entry point next to search in both
  // the desktop header and the mobile navigation list.
  navigation = navigation.replace(
    '<a class="header-search-link" href="/search">Search</a>',
    '<a class="header-search-link" href="/account">Account</a>\n    <a class="header-search-link" href="/search">Search</a>',
  );
  navigation = navigation.replace(
    '<a href="/search">Search</a>\n        <a href="/cart">Your bag (0)</a>',
    '<a href="/account">Account</a>\n        <a href="/search">Search</a>\n        <a href="/cart">Your bag (0)</a>',
  );
  const path = (await headers()).get("x-stryde-path") || "/";
  navigation = navigation.replace(/<a href="([^"]+)"/g, (tag, href) =>
    href === path ? `${tag} aria-current="page"` : tag,
  );
  return (
    <div className="document-shell">
      {home && (
        <div
          className="markup-fragment"
          dangerouslySetInnerHTML={{ __html: await design("intro.html") }}
        />
      )}
      <a className="skip-link" href="#MainContent">
        Skip to content
      </a>
      <div
        className="markup-fragment"
        dangerouslySetInnerHTML={{ __html: navigation }}
      />
      <main id="MainContent" tabIndex={-1}>
        {children}
      </main>
      {home && (
        <div
          className="markup-fragment"
          dangerouslySetInnerHTML={{ __html: await design("journey.html") }}
        />
      )}
      <div
        className="markup-fragment"
        dangerouslySetInnerHTML={{ __html: await design("footer.html") }}
      />
      <nav className="policy-links" aria-label="Store information">
        <a href="/collections/all">Collection</a>
        <a href="/pages/size-guide">Size guide</a>
        <a href="/pages/faq">FAQ</a>
        <a href="/orders/track">Track order</a>
        <a href="/pages/contact">Contact</a>
        <a href="/policies/returns">Returns</a>
        <a href="/policies/shipping">Shipping</a>
        <a href="/policies/privacy">Privacy</a>
        <a href="/policies/terms">Terms</a>
      </nav>
      <div className="newsletter-band">
        <NewsletterForm />
      </div>
    </div>
  );
}
