import { Shell } from "@/components/Shell";
import { Checkout } from "@/components/Checkout";
import { isTestMode } from "@/lib/policy";
import { bankCheckoutEnabled } from "@/lib/hosted-payment";
export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Shell>
      <Checkout testMode={isTestMode()} bankSandbox={bankCheckoutEnabled()} />
    </Shell>
  );
}
