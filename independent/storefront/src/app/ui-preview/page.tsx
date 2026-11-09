import { notFound } from "next/navigation";
import { isTestMode } from "@/lib/policy";
import Loading from "../loading";
import { ErrorPreview } from "@/components/ErrorPreview";
export const metadata={title:"UI state preview",robots:{index:false,follow:false}};
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (!isTestMode()) notFound();
  const { state } = await searchParams;
  return state === "error" ? <ErrorPreview /> : <Loading />;
}
