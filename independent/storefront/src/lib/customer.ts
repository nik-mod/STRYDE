import "server-only";
import { cookies } from "next/headers";
import { medusa, CommerceError } from "./medusa";
import { isTestMode } from "./policy";

// Customer accounts use Medusa's emailpass provider. The JWT never reaches
// client JavaScript: it lives in an HttpOnly cookie and every call to Medusa
// happens server-side. Cart association uses the same token, so completed
// orders land in the customer's history.
export const customerCookie = "stryde_customer";
export interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  addresses: CustomerAddress[];
}
export interface CustomerAddress {
  id: string;
  first_name: string | null;
  last_name: string | null;
  address_1: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string | null;
  phone: string | null;
  is_default_shipping?: boolean;
}
export interface OrderSummary {
  id: string;
  display_id: number;
  status: string;
  email: string | null;
  currency_code: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  created_at: string;
  items: {
    title: string;
    quantity: number;
    unit_price: number;
    thumbnail: string | null;
  }[];
  shipping_address: { city: string | null; country_code: string | null } | null;
}
async function readCustomerToken() {
  return (await cookies()).get(customerCookie)?.value ?? null;
}
export async function customerToken() {
  return readCustomerToken();
}
export async function getCustomer(): Promise<Customer | null> {
  const token = await readCustomerToken();
  if (!token) return null;
  try {
    const result = await medusa<{ customer: Customer }>(
      "/customers/me",
      undefined,
      "GET",
      token,
    );
    return result.customer;
  } catch {
    return null;
  }
}
export async function registerCustomer(input: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<Customer> {
  const register = await medusa<{ token: string }>(
    "/auth/customer/emailpass/register",
    { email: input.email, password: input.password },
    "POST",
  ).catch((error) => {
    if (!(error instanceof CommerceError) || ![400, 409].includes(error.status)) throw error;
    throw new CommerceError(
      "An account with this email already exists. Try signing in instead.",
      409,
    );
  });
  await medusa<{ customer: Customer }>(
    "/customers",
    {
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
    },
    "POST",
    register.token,
  );
  return loginCustomer({ email: input.email, password: input.password });
}
export async function loginCustomer(input: {
  email: string;
  password: string;
}): Promise<Customer> {
  const result = await medusa<{ token: string }>(
    "/auth/customer/emailpass",
    { email: input.email, password: input.password },
    "POST",
  ).catch((error) => {
    if (!(error instanceof CommerceError) || error.status !== 401) throw error;
    throw new CommerceError("Email or password is incorrect.", 401);
  });
  const customer = await medusa<{ customer: Customer }>(
    "/customers/me",
    undefined,
    "GET",
    result.token,
  );
  await writeCustomerCookie(result.token);
  return customer.customer;
}
export async function logoutCustomer() {
  (await cookies()).set(customerCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
async function writeCustomerCookie(token: string) {
  (await cookies()).set(customerCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 86400,
  });
}
export async function customerOrders(): Promise<OrderSummary[]> {
  const token = await readCustomerToken();
  if (!token) return [];
  const result = await medusa<{ orders: OrderSummary[] }>(
    "/orders?fields=*items,*shipping_address&limit=100&order=-created_at",
    undefined,
    "GET",
    token,
  );
  return (result.orders ?? []).sort((a, b) =>
    b.display_id - a.display_id,
  );
}
export async function addCustomerAddress(address: {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}): Promise<Customer> {
  const token = await readCustomerToken();
  if (!token) throw new CommerceError("Sign in to save addresses.", 401);
  const result = await medusa<{ customer: Customer }>(
    "/customers/me/addresses",
    address,
    "POST",
    token,
  );
  return result.customer;
}
export async function deleteCustomerAddress(id: string): Promise<Customer> {
  const token = await readCustomerToken();
  if (!token) throw new CommerceError("Sign in to manage addresses.", 401);
  const result = await medusa<{ parent: Customer }>(
    `/customers/me/addresses/${id}`,
    undefined,
    "DELETE",
    token,
  );
  return result.parent;
}
export async function updateCustomerMetadata(
  metadata: Record<string, unknown>,
): Promise<Customer> {
  const token = await readCustomerToken();
  if (!token) throw new CommerceError("Sign in first.", 401);
  const result = await medusa<{ customer: Customer }>(
    "/customers/me",
    { metadata },
    "POST",
    token,
  );
  return result.customer;
}
export { isTestMode };
