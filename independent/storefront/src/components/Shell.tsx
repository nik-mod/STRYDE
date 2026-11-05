import { design } from "@/lib/design";
import { headers } from "next/headers";
export async function Shell({
  children,
  home = false,
}: {
  children: React.ReactNode;
  home?: boolean;
}) {
  const header = await design("header.html");
  const path = (await headers()).get("x-stryde-path") || "/";
  const navigation = header.replace(/<a href="([^"]+)"/g, (tag, href) =>
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
    </div>
  );
}
