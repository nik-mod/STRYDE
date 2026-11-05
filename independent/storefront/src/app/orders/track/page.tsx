import { Shell } from "@/components/Shell";
import { OrderTrack } from "@/components/OrderTrack";
export const metadata = { title: "Track your order" };
export default function TrackOrder() {
  return (
    <Shell>
      <OrderTrack />
    </Shell>
  );
}
