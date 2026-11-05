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
    '<a class="header-search-link" href="/account">Account</a>\n    <a class="header-search-link" href="/search">Search</a>',
  );
  navigation = navigation.replace(
    /(<nav\b[^>]*class="mobile-menu-panel"[^>]*>)([\s\S]*?)(<\/nav>)/,
    (whole, opening, items, closing) => items.includes('href="/account"')
      ? whole
      : `${opening}<a href="/account">Account</a>${items}${closing}`,
  );
  const path = (await headers()).get("x-stryde-path") || "/";
  navigation = navigation.replace(/<a href="([^"]+)"/g, (tag, href) =>
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
