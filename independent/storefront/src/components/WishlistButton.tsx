"use client";
import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/wishlist-state";
import { ShopIcon } from "./ShopUI";
export function WishlistButton({handle,compact=false}:{handle:string;compact?:boolean}){const{handles,ready,toggle,busy:syncing}=useWishlist(),[busy,setBusy]=useState(false);const saved=handles.includes(handle);return <button type="button" className={`wishlist-button${saved?" is-saved":""}${compact?" is-compact":""}`} disabled={!ready||busy||syncing} aria-pressed={saved} aria-label={saved?"Remove from wishlist":"Save to wishlist"} data-wishlist-handle={handle} onClick={async()=>{if(busy)return;setBusy(true);try{await toggle(handle);}finally{setBusy(false);}}}><ShopIcon name="heart" size={20}/>{!compact&&<span>{saved?"Saved":"Save"}</span>}</button>;}


// Catalog pagination swaps native markup. Keep those hearts connected to the
// same state as React product/wishlist buttons without remounting the catalog.
export function CatalogWishlistBridge(){const{handles,ready,toggle,busy,error,clearError}=useWishlist();useEffect(()=>{const sync=()=>{document.querySelectorAll<HTMLButtonElement>("[data-catalog-wishlist]").forEach(button=>{const saved=handles.includes(button.dataset.wishlistHandle||"");button.classList.toggle("is-saved",saved);button.setAttribute("aria-pressed",String(saved));button.setAttribute("aria-label",saved?"Remove from wishlist":"Save to wishlist");button.disabled=!ready||busy;});};sync();const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});const click=async(event:MouseEvent)=>{const button=(event.target as Element).closest<HTMLButtonElement>("[data-catalog-wishlist]");if(!button||button.disabled)return;event.preventDefault();button.disabled=true;await toggle(button.dataset.wishlistHandle||"");sync();};document.addEventListener("click",click);return()=>{observer.disconnect();document.removeEventListener("click",click);};},[handles.join(","),ready,busy]);return error ? <div className="wishlist-feedback" role="alert"><p>{error}</p><button type="button" aria-label="Dismiss saved-pairs message" onClick={clearError}><ShopIcon name="close" size={20}/></button></div> : null;}


