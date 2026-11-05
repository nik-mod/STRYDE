import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ message: "Newsletter signup is not connected yet. No subscription was created." }, { status: 503 });
}
