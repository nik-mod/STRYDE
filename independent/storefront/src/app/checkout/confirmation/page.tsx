import { Shell } from "@/components/Shell";
import { PreviewConfirmation } from "@/components/PreviewShopping";
import { isTestMode } from "@/lib/policy";
import { notFound } from "next/navigation";
export const metadata={title:"Checkout preview confirmation",robots:{index:false,follow:false}};
export default function Page(){if(!isTestMode())notFound();return <Shell><PreviewConfirmation/></Shell>;}
