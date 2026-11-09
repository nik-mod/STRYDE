import { z } from "zod";
import { NextResponse } from "next/server";
import { loginCustomer } from "@/lib/customer";
import { CommerceError } from "@/lib/medusa";
import { body, guardMutation } from "@/lib/security";
import { RequestError } from "@/lib/security";
const input = z
  .object({ email: z.string().trim().pipe(z.email().max(254)).transform(value => value.toLowerCase()), password: z.string().min(1).max(200) })
  .strict();
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    const customer = await loginCustomer(value);
    return NextResponse.json({
      customer: {
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
    });
  } catch (error) {
    const known = error instanceof RequestError || error instanceof CommerceError;
    return NextResponse.json(
      { message: known ? (error as RequestError).message : "Sign in is temporarily unavailable." },
      { status: known ? (error as RequestError).status : 500 },
    );
  }
}
