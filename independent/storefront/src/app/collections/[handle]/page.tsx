import { Shell } from "@/components/Shell";
import { Catalog } from "@/components/Catalog";
export const metadata = { title: "The collection" };
export default async function Collection({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Shell>
      <Catalog collection={(await params).handle} params={await searchParams} />
    </Shell>
  );
}
