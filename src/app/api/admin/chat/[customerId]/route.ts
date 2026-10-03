import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { currentAdminId } from "@/lib/session";
import { listMessages, markRead, MAX_MESSAGE_LENGTH, sendMessage } from "@/server/chat";

type Ctx = RouteContext<"/api/admin/chat/[customerId]">;

async function guard(ctx: Ctx) {
  if (!(await currentAdminId())) return null;
  const { customerId } = await ctx.params;
  return z.uuid().safeParse(customerId).success ? customerId : null;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const customerId = await guard(ctx);
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const after = Number(req.nextUrl.searchParams.get("after") ?? 0) || 0;
  const messages = await listMessages(customerId, after);
  if (messages.some((m) => m.sender === "customer")) await markRead(customerId, "staff");
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}

const Body = z.object({ body: z.string().min(1).max(MAX_MESSAGE_LENGTH) });

export async function POST(req: Request, ctx: Ctx) {
  const customerId = await guard(ctx);
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const message = await sendMessage(customerId, "staff", parsed.data.body);
  return NextResponse.json({ message }, { status: 201 });
}
