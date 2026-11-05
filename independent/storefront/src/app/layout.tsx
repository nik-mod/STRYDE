import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { design, experienceSource, assetSource } from "@/lib/design";
import { Commerce } from "@/components/Commerce";
import { isTestMode } from "@/lib/policy";
import "./independent.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "STRYDE — Beyond Ordinary", template: "%s — STRYDE" },
  description: "The STRYDE footwear edit. Different shapes. Different stories.",
  robots:
    process.env.NODE_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = (await headers()).get("x-stryde-path") || "/";
  const template =
    path === "/"
      ? "index"
      : path.startsWith("/products/")
        ? "product"
        : path.startsWith("/collections/") || path === "/search"
          ? "collection"
          : path === "/cart"
            ? "cart"
            : "page";
  const css = [
    "theme",
    "refinements",
    "recovery",
    "signature",
    ...(template === "index" ? ["experience", "form-edit"] : []),
    "storefront",
    "navigation",
    ...(template === "index"
      ? ["campaign-refinement", "closing", "site-intro", "editorial-finish"]
      : []),
    ...(template === "collection" ? ["collection-studio"] : []),
    ...(template === "product" ? ["product-studio"] : []),
    ...(["product", "collection"].includes(template)
      ? ["commerce-transitions"]
      : []),
    ...(template !== "index" ? ["footer"] : []),
  ];
  const styles = await Promise.all(
    css.map(async (name) => ({
      name,
      href: await assetSource(`assets/${name}.css`),
    })),
  );
  return (
    <html lang="en" className="js" suppressHydrationWarning>
      <head>
        {template === "index" && <>
          <link rel="preload" as="fetch" href="/assets/nike-tn-blue-white.glb" crossOrigin="anonymous" />
          <link rel="preload" as="fetch" href="/assets/studio-environment.hdr" crossOrigin="anonymous" />
        </>}
        <link
          rel="preload"
          href="/assets/archivo-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/archivo-var-italic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style
          dangerouslySetInnerHTML={{ __html: await design("variables.css") }}
        />
        {styles.map(({ name, href }) => (
          <link rel="stylesheet" href={href} key={name} />
        ))}
        {template === "index" && (
          <script
            dangerouslySetInnerHTML={{
              __html: await design("intro-bootstrap.js"),
            }}
          />
        )}
      </head>
      <body
        className={`template-${template}`}
        data-local-preview={isTestMode() ? "" : undefined}
      >
        {isTestMode() && (
          <aside className="preview-notice" role="note">
            STRYDE · LOCAL TEST STORE · TEST PAYMENTS ONLY — NO REAL CHARGES
          </aside>
        )}
        {children}
        <Commerce testMode={isTestMode()} />
        <Script
          id="stryde-experience"
          type="module"
          src={await experienceSource()}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
