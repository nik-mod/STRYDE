import { Shell } from "@/components/Shell";
import { ShopPage } from "@/components/ShopUI";
import { Arrow } from "@/components/Information";
export default function NotFound(){return <Shell><ShopPage title="A different" accent="turn." description="That page isn’t here. There’s a whole collection waiting in another direction."><div className="shop-state-actions"><a className="shop-button" href="/collections/all">Explore the collection<Arrow/></a><a className="shop-text-link" href="/pages/contact">Get in touch<Arrow/></a></div></ShopPage></Shell>;}
