import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDaySlots, getEarliestSlot } from "@/server/booking";
import { isValidDateString } from "@/lib/time";

const Query = z.object({
  serviceId: z.coerce.number().int().positive(),
  date: z.string().refine(isValidDateString),
  staffId: z.coerce.number().int().positive().optional(),
  earliest: z.enum(["1"]).optional(),
});

const toJson = (s: { start: Date; staffIds: number[] }) => ({ start: s.start.toISOString(), staffIds: s.staffIds });

/** GET /api/availability?serviceId=1&date=2026-10-05[&staffId=2][&earliest=1] */
export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const { serviceId, date, staffId, earliest } = parsed.data;

  const [slots, first] = await Promise.all([
    getDaySlots(serviceId, date, staffId ?? null),
    earliest ? getEarliestSlot(serviceId, staffId ?? null) : Promise.resolve(undefined),
  ]);
  return NextResponse.json(
    {
      date,
      slots: slots.map(toJson),
      ...(first !== undefined && { earliest: first ? { date: first.date, ...toJson(first.slot) } : null }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
