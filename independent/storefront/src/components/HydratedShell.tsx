"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

// DOM-driven galleries and navigation may only mutate the markup after this
// page's React tree has hydrated, including streamed server content.
export function HydratedShell({ children, source, enhance = true }: {
  children: React.ReactNode; source: string; enhance?: boolean;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => { if (hydrated) document.dispatchEvent(new Event("stryde:page-ready")); }, [hydrated]);
  return <div className="document-shell" data-hydrated={hydrated ? "true" : undefined}>{children}{hydrated && enhance &&
    <Script id="stryde-experience" type="module" src={source} crossOrigin="anonymous" strategy="afterInteractive"/>
  }</div>;
}
