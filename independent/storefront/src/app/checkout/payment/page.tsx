import { Shell } from "@/components/Shell";
import { HostedPayment } from "@/components/HostedPayment";
export const metadata = { title: "Payment status", robots: { index: false, follow: false } };
export default function Page() { return <Shell><HostedPayment/></Shell>; }
