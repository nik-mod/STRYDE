import { design } from "@/lib/design";
export async function Shell({
  children,
  home = false,
}: {
  children: React.ReactNode;
  home?: boolean;
}) {
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
        dangerouslySetInnerHTML={{ __html: await design("header.html") }}
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
        <a href="/policies/returns">Returns</a>
        <a href="/policies/shipping">Shipping</a>
        <a href="/policies/privacy">Privacy</a>
        <a href="/policies/terms">Terms</a>
        <a href="/pages/contact">Contact</a>
      </nav>
    </div>
  );
}
