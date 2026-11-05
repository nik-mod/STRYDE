import { Shell } from "@/components/Shell";
import { Addresses } from "@/components/Addresses";
import { getCustomer } from "@/lib/customer";
export const metadata = { title: "Your addresses" };
export const dynamic = "force-dynamic";
export default async function AccountAddresses() {
  const customer = await getCustomer();
  return (
    <Shell>
      <Addresses signedIn={!!customer} />
    </Shell>
  );
}
