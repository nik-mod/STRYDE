import { notFound } from "next/navigation";
import { isTestMode } from "@/lib/policy";
import { Shell } from "@/components/Shell";
import { ShopPage } from "@/components/ShopUI";
import { ShopLoading } from "@/components/PreviewShopping";
import { ErrorPreview } from "@/components/ErrorPreview";
export const metadata={title:"UI state preview",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{state?:string}>}){if(!isTestMode())notFound();const{state}=await searchParams;if(state==="error")return <ErrorPreview/>;return <Shell><ShopPage title="Just a" accent="moment." description="We’re getting the next page ready."><ShopLoading/></ShopPage></Shell>;}
