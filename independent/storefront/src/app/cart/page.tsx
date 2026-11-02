import { Shell } from "@/components/Shell";
import { CartPage } from "@/components/CartPage";
import { isTestMode } from "@/lib/policy";
export const metadata = {
  title: "Your bag",
  robots: { index: false, follow: false },
};
export default function Bag() {
  return (
    <Shell>
      <CartPage testMode={isTestMode()} />
    </Shell>
  );
}
