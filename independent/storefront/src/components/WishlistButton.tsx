"use client";
import { useEffect, useState } from "react";
import { commerceRequest } from "./Commerce";
const GUEST_KEY = "stryde_wishlist";
function guestList(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function saveGuest(list: string[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(list.slice(0, 200)));
}
export function WishlistButton({
  handle,
  compact = false,
}: {
  handle: string;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setSaved(guestList().includes(handle));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (result) => {
        if (!result.customer) return;
        setSignedIn(true);
        // Server state wins for signed-in customers; merge guest hearts once.
        const guest = guestList();
        const remote = await commerceRequest<{ wishlist: string[] | null }>(
          "/account/wishlist",
        ).catch(() => null);
        const merged = [
          ...new Set([...(remote?.wishlist ?? []), ...(guest || [])]),
        ].slice(0, 200);
        if (guest.length) {
          for (const h of guest.filter((x) => !(remote?.wishlist ?? []).includes(x)))
            await commerceRequest("/account/wishlist", { action: "add", handle: h }).catch(
              () => null,
            );
          saveGuest([]);
        }
        setSaved(merged.includes(handle));
        void remote;
        void merged;
      })
      .catch(() => null);
  }, [handle]);
  async function toggle() {
    const next = !saved;
    setSaved(next);
    if (signedIn) {
      try {
        await commerceRequest("/account/wishlist", {
          action: next ? "add" : "remove",
          handle,
        });
      } catch {
        setSaved(!next);
      }
      return;
    }
    const list = guestList();
    saveGuest(
      next ? [...new Set([...list, handle])] : list.filter((h) => h !== handle),
    );
  }
  return (
    <button
      type="button"
      className={`wishlist-button${saved ? " is-saved" : ""}${compact ? " is-compact" : ""}`}
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      data-wishlist-handle={handle}
    >
      {saved ? "♥" : "♡"}
      {!compact && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
