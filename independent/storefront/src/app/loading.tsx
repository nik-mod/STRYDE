import { Shell } from "@/components/Shell";
import { ShopPage } from "@/components/ShopUI";
import { ShopLoading } from "@/components/PreviewShopping";
export default function Loading(){return <Shell enhance={false}><ShopPage title="Just a" accent="moment." description="We’re getting the next page ready."><ShopLoading/></ShopPage></Shell>;}

