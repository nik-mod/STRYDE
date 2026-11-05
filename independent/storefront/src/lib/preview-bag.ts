"use client";
import { useEffect, useState } from "react";
import { EMPTY_PREVIEW_BAG, readPreviewBag, previewLineId, PREVIEW_COMMERCE, type PreviewBag, type PreviewLine } from "./preview-commerce";
const KEY = "stryde_preview_bag_v1", EVENT = "stryde:preview-bag-changed";
export function loadPreviewBag(): PreviewBag { try { return readPreviewBag(JSON.parse(localStorage.getItem(KEY) || "null")); } catch { return readPreviewBag(null); } }
function persist(bag: PreviewBag) { localStorage.setItem(KEY, JSON.stringify(readPreviewBag(bag))); window.dispatchEvent(new Event(EVENT)); }
export function addPreviewLine(line: PreviewLine) {
 const bag = loadPreviewBag(), existing = bag.items.find(item => previewLineId(item) === previewLineId(line));
 if (existing) existing.quantity = Math.min(PREVIEW_COMMERCE.maxQuantity, existing.quantity + line.quantity); else bag.items.push(line);
 persist(bag); document.dispatchEvent(new Event("stryde:preview-bag-open"));
}
export function usePreviewBag() {
 const [bag, setBag] = useState<PreviewBag>(EMPTY_PREVIEW_BAG), [ready, setReady] = useState(false);
 useEffect(() => { const update = () => { setBag(loadPreviewBag()); setReady(true); }; update(); window.addEventListener(EVENT, update); window.addEventListener("storage", update); return () => { window.removeEventListener(EVENT, update); window.removeEventListener("storage", update); }; }, []);
 return { bag, ready, update: (id: string, quantity: number) => persist({ ...loadPreviewBag(), items: loadPreviewBag().items.flatMap(line => previewLineId(line) !== id ? [line] : quantity <= 0 ? [] : [{ ...line, quantity: Math.min(quantity, PREVIEW_COMMERCE.maxQuantity) }]) }), setPromo: (promo: boolean) => persist({ ...loadPreviewBag(), promo }), clear: () => persist(EMPTY_PREVIEW_BAG) };
}
