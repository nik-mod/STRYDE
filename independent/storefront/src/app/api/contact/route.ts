import { createContactService } from "@/lib/contact-server";
export const runtime = "nodejs";
const service = createContactService();
export async function GET() { return service.get(); }
export async function POST(request: Request) { return service.post(request); }
