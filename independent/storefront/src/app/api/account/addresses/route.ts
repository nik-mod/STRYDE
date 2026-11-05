import { z } from "zod";
import { NextResponse } from "next/server";
import {
  getCustomer,
  addCustomerAddress,
  deleteCustomerAddress,
} from "@/lib/customer";
import { body, guardMutation, addressSchema, idSchema, RequestError } from "@/lib/security";
export async function GET() {
  try {
    const customer = await getCustomer();
    if (!customer)
      return NextResponse.json({ message: "Sign in first." }, { status: 401 });
    return NextResponse.json({ addresses: customer.addresses ?? [] });
  } catch {
    return NextResponse.json(
      { message: "Could not load addresses." },
      { status: 500 },
    );
  }
}
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), address: addressSchema }).strict(),
  z.object({ action: z.literal("remove"), id: idSchema }).strict(),
]);
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    const customer =
      value.action === "add"
        ? await addCustomerAddress(value.address)
        : await deleteCustomerAddress(value.id);
    return NextResponse.json({ addresses: customer.addresses });
  } catch (error) {
    const known = error instanceof RequestError;
    return NextResponse.json(
      { message: known ? (error as RequestError).message : "Could not update addresses." },
      { status: known ? (error as RequestError).status : 500 },
    );
  }
}
