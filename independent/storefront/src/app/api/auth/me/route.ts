import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/customer";
export async function GET() {
  try {
    const customer = await getCustomer();
    return NextResponse.json({
      customer: customer
        ? {
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ customer: null });
  }
}
