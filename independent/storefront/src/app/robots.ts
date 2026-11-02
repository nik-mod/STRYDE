import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow:
        process.env.NODE_ENV === "production"
          ? ["/api/", "/cart", "/checkout"]
          : ["/"],
    },
    sitemap: `${process.env.SITE_URL || "http://localhost:3000"}/sitemap.xml`,
  };
}
