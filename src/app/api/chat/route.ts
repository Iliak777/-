import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { currentCustomerId } from "@/lib/session";
import { listMessages, markRead, MAX_MESSAGE_LENGTH, sendMessage } from "@/server/chat";

/** GET /api/chat?after=<id>: the signed-in customer's new messages. */
export async function GET(req: NextRequest) {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const after = Number(req.nextUrl.searchParams.get("after") ?? 0) || 0;
  const messages = await listMessages(customerId, after);
  if (messages.some((m) => m.sender === "staff")) await markRead(customerId, "customer");
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}

const Body = z.object({ body: z.string().min(1).max(MAX_MESSAGE_LENGTH) });

export async function POST(req: Request) {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const message = await sendMessage(customerId, "customer", parsed.data.body);
  if (!message) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  return NextResponse.json({ message }, { status: 201 });
}
