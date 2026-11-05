import { NextResponse } from "next/server";
import { logoutCustomer } from "@/lib/customer";
import { guardMutation } from "@/lib/security";
export async function POST(request: Request) {
  try {
    guardMutation(request);
    await logoutCustomer();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "Sign out failed. Please try again." },
      { status: 500 },
    );
  }
}
