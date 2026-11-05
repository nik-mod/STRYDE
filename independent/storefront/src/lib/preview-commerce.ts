// UI-only values. Replace with verified merchandise data when commerce is connected.
export const PREVIEW_COMMERCE = { unitPrice: 140, currency: "usd", sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46"], maxQuantity: 10, standardShipping: 9, expressShipping: 19, promoCode: "PREVIEW10" } as const;
export interface PreviewLine { handle: string; title: string; image: string; size: string; quantity: number }
export interface PreviewBag { items: PreviewLine[]; promo: boolean }
export const EMPTY_PREVIEW_BAG: PreviewBag = { items: [], promo: false };
export const previewLineId = (line: Pick<PreviewLine, "handle" | "size">) => `${line.handle}:${line.size}`;
export function readPreviewBag(value: unknown): PreviewBag {
  if (!value || typeof value !== "object" || !Array.isArray((value as PreviewBag).items)) return { items: [], promo: false };
  const items: PreviewLine[] = [];
  for (const item of (value as PreviewBag).items.slice(0, 50)) {
    if (!item || typeof item !== "object" || typeof item.handle !== "string" || !/^stockx-(?:\d{4}|archive-[a-f0-9]{16})$/.test(item.handle) || typeof item.title !== "string" || typeof item.image !== "string" || !/^\/assets\/(?:stockx-edit|stockx-archive|replacement-photos)\/[a-zA-Z0-9-]+\.(?:webp|jpg|png)$/.test(item.image) || !PREVIEW_COMMERCE.sizes.includes(item.size as typeof PREVIEW_COMMERCE.sizes[number]) || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    const entry = { handle: item.handle, title: item.title.slice(0, 200), image: item.image, size: item.size, quantity: Math.min(item.quantity, PREVIEW_COMMERCE.maxQuantity) };
    const existing = items.find(line => previewLineId(line) === previewLineId(entry));
    if (existing) existing.quantity = Math.min(PREVIEW_COMMERCE.maxQuantity, existing.quantity + entry.quantity); else items.push(entry);
  }
  return { items, promo: (value as PreviewBag).promo === true };
}
export function previewTotals(bag: PreviewBag, shipping = 0) {
  const subtotal = bag.items.reduce((sum, line) => sum + line.quantity * PREVIEW_COMMERCE.unitPrice, 0);
  const discount = bag.promo ? Math.round(subtotal * 10) / 100 : 0;
  return { subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
}
