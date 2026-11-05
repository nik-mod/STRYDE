"use client";
import { Arrow } from "./Information";
import { ShopPage } from "./ShopUI";
import { Footer } from "./Footer";
export function ErrorScreen({retry}:{retry:()=>void}){return <div className="error-frame"><header className="state-header"><a href="/" aria-label="STRYDE home">STRYDE</a><a href="/collections/all">Collection<Arrow/></a></header><main id="MainContent"><ShopPage title="A pause," accent="not the end." description="This page couldn’t load. Try again, or find your way back to the collection."><div className="shop-state-actions"><button type="button" className="shop-button" onClick={retry}>Try again<Arrow/></button><a href="/collections/all" className="shop-text-link">Back to the collection<Arrow/></a></div></ShopPage></main><Footer/></div>;}
