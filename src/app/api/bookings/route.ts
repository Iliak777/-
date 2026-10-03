import { NextResponse } from "next/server";
import { z } from "zod";
import { currentCustomer } from "@/server/customer";
import { locales } from "@/i18n/config";
import { createBooking } from "@/server/booking";

const Body = z.object({
  serviceId: z.number().int().positive(),
  staffId: z.number().int().positive().nullable(),
  startsAt: z.iso.datetime(),
  locale: z.enum(locales),
  replaceId: z.uuid().optional(),
});

export async function POST(req: Request) {
  const customerId = (await currentCustomer())?.id;
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const res = await createBooking({ ...parsed.data, customerId, startsAt: new Date(parsed.data.startsAt) });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
  return NextResponse.json({ id: res.id, ref: res.ref }, { status: 201 });
}
