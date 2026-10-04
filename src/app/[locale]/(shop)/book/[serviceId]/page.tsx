import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { BackLink } from "@/components/site-chrome";
import { Icon } from "@/components/icons";
import { fmt, localized } from "@/i18n/config";
import { formatThb } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { localDateString } from "@/lib/time";
import { getActiveService, getCustomerBooking, getDaySlots, getEarliestSlot, staffForService } from "@/server/booking";
import { currentCustomer } from "@/server/customer";
import { BookingFlow } from "./booking-flow";

const toJson = (s: { start: Date; staffIds: number[] }) => ({ start: s.start.toISOString(), staffIds: s.staffIds });

export default async function BookPage({ params, searchParams }: PageProps<"/[locale]/book/[serviceId]">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const { serviceId } = await params;
  const id = Number(serviceId);
  const svc = Number.isInteger(id) && id > 0 ? await getActiveService(id) : null;
  if (!svc) notFound();

  const [practitioners, customer, earliest] = await Promise.all([staffForService(svc.id), currentCustomer(), getEarliestSlot(svc.id, null)]);
  // Rendered with the first free day already open, so the earliest time shows without a second request.
  const initialDate = earliest?.date ?? localDateString(new Date());
  const initialSlots = earliest ? await getDaySlots(svc.id, initialDate, null) : [];

  // "Change time" from a booking: the new time replaces that booking.
  const changeId = (await searchParams).change;
  const changing =
    customer && typeof changeId === "string" && z.uuid().safeParse(changeId).success ? await getCustomerBooking(customer.id, changeId) : null;
  const replace = changing && changing.serviceId === svc.id && changing.status === "confirmed" && changing.startsAt > new Date() ? changing : null;

  const name = localized(svc.name, locale);
  const price = svc.priceThb === null ? dict.common.priceOnConsultation : formatThb(svc.priceThb, locale);

  return (
    <div className="space-y-5">
      <BackLink href={replace ? `/${locale}/booking/${replace.id}` : `/${locale}`} label={dict.common.back} />
      <div className="-mt-2">
        <h1 className="font-display text-[2rem] leading-tight font-medium">{name}</h1>
        <p className="mt-1 text-sm text-muted">{localized(svc.description, locale)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gold-dark">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {fmt(dict.common.minutes, { n: svc.durationMin })}
          </span>
          <span className="inline-flex items-center rounded-full bg-gold-soft px-3 py-1.5">{price}</span>
        </div>
      </div>
      <BookingFlow
        service={{ id: svc.id, name, durationMin: svc.durationMin, price }}
        practitioners={practitioners}
        customerName={customer?.name ?? null}
        initial={{ date: initialDate, slots: initialSlots.map(toJson), earliest: earliest ? { date: earliest.date, ...toJson(earliest.slot) } : null }}
        replace={replace ? { id: replace.id, ref: replace.ref, startsAt: replace.startsAt.toISOString() } : null}
      />
    </div>
  );
}
