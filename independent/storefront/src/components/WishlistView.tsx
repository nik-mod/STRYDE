"use client";
import { useEffect, useState } from "react";
import { mediaFor } from "@/lib/product-media";
import type { Product } from "@/lib/types";
import { money } from "@/lib/types";
export function WishlistView({ signedIn }: { signedIn: boolean }) {
  const [handles, setHandles] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = async () => {
      let list: string[] = [];
      if (signedIn) {
        const remote = await fetch("/api/account/wishlist")
          .then((r) => r.json())
          .catch(() => null);
        list = remote?.wishlist ?? [];
      }
      if (!list.length) {
        try {
          list = JSON.parse(localStorage.getItem("stryde_wishlist") || "[]");
        } catch {}
      }
      setHandles(list);
      if (list.length) {
        const params = new URLSearchParams({ limit: "50" });
        for (const handle of list.slice(0, 50)) params.append("handle", handle);
        const result = await fetch(`/api/wishlist-products?${params}`)
          .then((r) => r.json())
          .catch(() => null);
        setProducts(result?.products ?? []);
      }
      setReady(true);
    };
    void load();
  }, [signedIn]);
  return (
    <section className="commerce-panel">
      <h1>Your wishlist.</h1>
      <p>
        <a href="/account">← Back to account</a>
      </p>
      {!ready ? (
        <p>Loading…</p>
      ) : products.length ? (
        <div className="photo-shop-grid" data-grid-density="comfortable">
          {products.map((item) => (
            <article className="photo-shop-card" key={item.id}>
              <a className="photo-shop-image" href={`/products/${item.handle}`}>
                <span className="photo-shop-photo">
                  {item.thumbnail && (
                    <img
                      src={mediaFor(item, item.thumbnail, 720).src}
                      width={1000}
                      height={1000}
                      alt={item.title}
                      loading="lazy"
                    />
                  )}
                </span>
              </a>
              <div className="photo-shop-info">
                <div>
                  <h2>
                    <a href={`/products/${item.handle}`}>{item.title}</a>
                  </h2>
                  <p className="photo-shop-price">
                    {item.variants[0]?.calculated_price
                      ? money(
                          item.variants[0].calculated_price.calculated_amount,
                          item.variants[0].calculated_price.currency_code,
                        )
                      : ""}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>
          Nothing saved yet — tap ♡ on any pair.{" "}
          <a href="/collections/all">Explore the collection ↗</a>
        </p>
      )}
      {handles.length > products.length && ready && (
        <p className="micro">Some saved pairs are no longer available.</p>
      )}
    </section>
  );
}
