import { Shell } from "@/components/Shell";
import { ShopPage } from "@/components/ShopUI";
import { Arrow } from "@/components/Information";

export default function NotFound() {
  return <Shell><ShopPage title="This page has" accent="moved on." description="We couldn’t find that page or pair. Explore the collection to find your next one."><div className="shop-state-actions"><a className="shop-button" href="/collections/all">Explore the collection<Arrow/></a><a className="shop-text-link" href="/search">Search sneakers<Arrow/></a></div></ShopPage></Shell>;
}
