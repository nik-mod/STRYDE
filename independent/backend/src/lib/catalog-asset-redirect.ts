// Imported catalog photos live on the storefront. Their relative URLs also
// appear in Medusa Admin, where the browser otherwise requests the API host.
export function catalogAssetRedirect(path: string, storefrontOrigin: string) {
  const pathname = path.split("?")[0];
  if (!/^\/assets\/(stockx-edit|stockx-archive|replacement-photos)\/[a-zA-Z0-9-]+\.(webp|jpg|png)$/.test(pathname)) return null;
  try {
    const origin = new URL(storefrontOrigin);
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) return null;
    return new URL(pathname, origin.origin).href;
  } catch { return null; }
}
