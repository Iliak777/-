import { NextResponse } from "next/server";
import { z } from "zod";
import { currentCustomerId } from "@/lib/session";
import { cancelCustomerBooking } from "@/server/booking";

export async function POST(_req: Request, ctx: RouteContext<"/api/bookings/[id]/cancel">) {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const ok = await cancelCustomerBooking(customerId, id);
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "not_cancellable" }, { status: 409 });
}
