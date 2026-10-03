import { z } from "zod";
import { getDictionary, hasLocale, localized } from "@/i18n/config";
import { icsEvent } from "@/lib/ics";
import { currentCustomerId } from "@/lib/session";
import { getCustomerBooking } from "@/server/booking";

/** GET /api/bookings/<id>/calendar?locale=en: the booking as an .ics file for "Add to calendar". */
export async function GET(req: Request, ctx: RouteContext<"/api/bookings/[id]/calendar">) {
  const customerId = await currentCustomerId();
  const { id } = await ctx.params;
  if (!customerId || !z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const booking = await getCustomerBooking(customerId, id);
  if (!booking) return new Response("Not found", { status: 404 });

  const l = new URL(req.url).searchParams.get("locale") ?? "en";
  const locale = hasLocale(l) ? l : "en";
  const dict = getDictionary(locale);
  const title = `${localized(booking.serviceName, locale)} · ${dict.common.appName}`;
  const body = icsEvent({
    uid: `${booking.id}@klinique`,
    start: booking.startsAt,
    end: booking.endsAt,
    title,
    location: dict.common.address,
    description: `${dict.confirmation.ref}: ${booking.ref}\n${booking.staffName}`,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="klinique-${booking.ref}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
