import { Shell } from "@/components/Shell";
import { WishlistView } from "@/components/WishlistView";
import { getCustomer } from "@/lib/customer";
export const metadata = { title: "Your wishlist" };
export const dynamic = "force-dynamic";
export default async function AccountWishlist() {
  const customer = await getCustomer();
  return (
    <Shell>
      <WishlistView signedIn={!!customer} />
    </Shell>
  );
}
