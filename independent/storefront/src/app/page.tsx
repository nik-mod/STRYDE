import { Shell } from "@/components/Shell";
import { design } from "@/lib/design";
export default async function Home() {
  return (
    <Shell home>
      <div
        className="markup-fragment"
        dangerouslySetInnerHTML={{ __html: await design("home.html") }}
      />
    </Shell>
  );
}
