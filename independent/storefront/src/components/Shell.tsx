import { design, experienceSource } from "@/lib/design";
import { headers } from "next/headers";
import { Footer } from "./Footer";
import { HydratedShell } from "./HydratedShell";
export async function Shell({
  children,
  home = false,
  enhance = true,
}: {
  children: React.ReactNode;
  home?: boolean;
  enhance?: boolean;
}) {
  const header = await design("header.html");
  let navigation = home
    ? header
    : header.replace(/<a data-home-only\b[^>]*>[\s\S]*?<\/a>/g, "");
  // The independent store adds an account entry point next to search in both
  // the desktop header and the mobile navigation list.
  navigation = navigation.replace(
    '<a class="header-search-link" href="/search">Search</a>',
    '<a class="header-search-link" href="/account" aria-label="Your account"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></svg><span>Account</span></a>\n    <a class="header-search-link" href="/search" aria-label="Search sneakers"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>Search</span></a>',
  );
  navigation = navigation.replace(
    /(<nav\b[^>]*class="mobile-menu-panel"[^>]*>)([\s\S]*?)(<\/nav>)/,
    (whole, opening, items, closing) => items.includes('href="/account"')
      ? whole
      : `${opening}<a href="/account">Account</a>${items}${closing}`,
  );
  const path = (await headers()).get("x-stryde-path") || "/";
  navigation = navigation.replace(/<a\b[^>]*\bhref="([^"]+)"/g, (tag, href) =>
    href === path ? `${tag} aria-current="page"` : tag,
  );
  return (
    <HydratedShell source={await experienceSource()} enhance={enhance}>
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
      <Footer />
    </HydratedShell>
  );
}
