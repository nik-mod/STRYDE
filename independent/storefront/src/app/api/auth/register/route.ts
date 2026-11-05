import { z } from "zod";
import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/customer";
import { body, guardMutation, RequestError } from "@/lib/security";
const input = z
  .object({
    email: z.email().max(254),
    password: z.string().min(8).max(200),
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
  })
  .strict();
export async function POST(request: Request) {
  try {
    guardMutation(request);
    const value = await body(request, input);
    const customer = await registerCustomer(value);
    return NextResponse.json({
      customer: {
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
    });
  } catch (error) {
    const known = error instanceof RequestError;
    return NextResponse.json(
      {
        message:
          known || error instanceof Error
            ? (error as Error).message
            : "Registration is temporarily unavailable.",
      },
      { status: known ? (error as RequestError).status : 500 },
    );
  }
}
