import { Shell } from "@/components/Shell";
import { Checkout } from "@/components/Checkout";
import { isTestMode } from "@/lib/policy";
export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Shell>
      <Checkout testMode={isTestMode()} />
    </Shell>
  );
}
