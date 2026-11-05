export type Variant = {
  id: string;
  title: string;
  manage_inventory: boolean;
  allow_backorder: boolean;
  inventory_quantity?: number;
  options: { value: string; option_id: string }[];
  calculated_price?: { calculated_amount: number; currency_code: string };
};
export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  images: { id: string; url: string }[];
  options: { id: string; title: string; values: { value: string }[] }[];
  variants: Variant[];
  metadata: Record<string, unknown> | null;
  collection?: { id: string; title: string; handle: string } | null;
  categories?: { id: string; name: string; handle: string }[];
};
export type Cart = {
  id: string;
  currency_code: string;
  email?: string;
  region_id: string;
  items: {
    id: string;
    product_id: string;
    variant_id: string;
    title: string;
    variant_title: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    thumbnail: string | null;
    product_handle: string;
    product?: { metadata: Record<string, unknown> | null };
  }[];
  subtotal: number;
  // Medusa includes selected shipping in `subtotal` once a method exists;
  // `item_subtotal` is the goods-only figure used for the bag header.
  item_subtotal?: number;
  discount_total?: number;
  promotions?: { code?: string }[];
  total: number;
  shipping_total: number;
  tax_total: number;
  shipping_address?: Address;
  shipping_methods?: { id: string }[];
  payment_collection?: {
    id: string;
    payment_sessions: {
      id: string;
      provider_id: string;
      status: string;
      data: Record<string, unknown>;
    }[];
  };
};
export type Address = {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postal_code: string;
  country_code: string;
};
export type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  price_type: string;
  calculated_price?: { calculated_amount: number };
};
export const money = (amount: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
export const available = (variant: Variant) =>
  !variant.manage_inventory ||
  variant.allow_backorder ||
  (variant.inventory_quantity ?? 0) > 0;
