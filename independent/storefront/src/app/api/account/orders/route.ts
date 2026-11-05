import { NextResponse } from "next/server";
import { getCustomer, customerOrders } from "@/lib/customer";
export async function GET() {
  try {
    const customer = await getCustomer();
    if (!customer)
      return NextResponse.json({ message: "Sign in first." }, { status: 401 });
    const orders = await customerOrders();
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { message: "Order history is temporarily unavailable." },
      { status: 500 },
    );
  }
}
