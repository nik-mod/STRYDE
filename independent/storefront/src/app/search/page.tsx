import { Shell } from "@/components/Shell";
import { Catalog } from "@/components/Catalog";
export const metadata = { title: "Search the collection" };
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Shell>
      <Catalog params={await searchParams} />
    </Shell>
  );
}
