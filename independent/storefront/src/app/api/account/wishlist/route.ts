import { z } from "zod";
import { NextResponse } from "next/server";
import { getCustomer, updateCustomerMetadata } from "@/lib/customer";
import { body, guardMutation, RequestError } from "@/lib/security";
const handleSchema = z.string().regex(/^[a-z0-9-]{1,120}$/);
const input = z
  .object({ action: z.enum(["add", "remove"]), handle: handleSchema })
  .strict();
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    const customer = await getCustomer();
    if (!customer)
      return NextResponse.json({ message: "Sign in first." }, { status: 401 });
    const current = Array.isArray(customer.metadata?.wishlist)
      ? (customer.metadata?.wishlist as unknown[]).filter(
          (h): h is string => typeof h === "string",
        )
      : [];
    const next =
      value.action === "add"
        ? [...new Set([...current, value.handle])].slice(0, 200)
        : current.filter((h) => h !== value.handle);
    const updated = await updateCustomerMetadata({
      ...(customer.metadata ?? {}),
      wishlist: next,
    });
    return NextResponse.json({
      wishlist: (updated.metadata?.wishlist as string[]) ?? [],
    });
  } catch (error) {
    const known = error instanceof RequestError;
    return NextResponse.json(
      { message: known ? (error as RequestError).message : "Could not update your wishlist." },
      { status: known ? (error as RequestError).status : 500 },
    );
  }
}
export async function GET() {
  try {
    const customer = await getCustomer();
    if (!customer) return NextResponse.json({ wishlist: null });
    const wishlist = Array.isArray(customer.metadata?.wishlist)
      ? (customer.metadata?.wishlist as unknown[]).filter(
          (h): h is string => typeof h === "string",
        )
      : [];
    return NextResponse.json({ wishlist });
  } catch {
    return NextResponse.json({ wishlist: null });
  }
}
