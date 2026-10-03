import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { BackLink } from "@/components/site-chrome";
import { localized } from "@/i18n/config";
import { formatDateTime, formatThb } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { CLINIC_MAPS_URL } from "@/lib/clinic";
import { currentCustomerId } from "@/lib/session";
import { getCustomerBooking } from "@/server/booking";
import { BookingActions } from "./booking-actions";

export default async function BookingPage({ params, searchParams }: PageProps<"/[locale]/booking/[id]">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const { id } = await params;
  const customerId = await currentCustomerId();
  if (!customerId) redirect(`/${locale}/me`);
  const booking = z.uuid().safeParse(id).success ? await getCustomerBooking(customerId, id) : null;
  if (!booking) notFound();
  const t = dict.confirmation;
  const sp = await searchParams;
  const justBooked = sp.new === "1" || sp.changed === "1";
  const upcoming = booking.status === "confirmed" && booking.startsAt > new Date();
  const serviceName = localized(booking.serviceName, locale);
  const when = formatDateTime(booking.startsAt, locale);

  const rows: [string, string][] = [
    [t.treatment, serviceName],
    [t.when, when],
    [t.practitioner, booking.staffName],
    [t.price, booking.priceThb === null ? dict.common.priceOnConsultation : formatThb(booking.priceThb, locale)],
    [t.where, dict.common.address],
  ];

  return (
    <div className="space-y-5">
      {justBooked ? (
        <div className="pt-4 text-center">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <span aria-hidden className="halo inset-0 animate-fade" />
            <span className="animate-check flex h-16 w-16 items-center justify-center rounded-full text-noir shadow-[0_8px_24px_-10px_rgb(179_142_85/0.8)]" style={{ background: "var(--sheen)" }}>
              <Icon name="check" className="h-8 w-8" strokeWidth={2.2} />
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-medium">{sp.changed === "1" ? t.changedTitle : t.title}</h1>
          <p className="mt-1 text-muted">{t.subtitle}</p>
        </div>
      ) : (
        <div>
          <BackLink href={`/${locale}/me`} label={dict.nav.myBookings} />
          <div className="flex items-end justify-between gap-3">
            <h1 className="font-display text-3xl font-medium">{t.details}</h1>
            <StatusPill status={booking.status} label={dict.me.status[booking.status]} />
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="silk relative isolate flex items-center justify-between gap-3 overflow-hidden px-5 py-5 text-white">
          <span aria-hidden className="halo -top-10 -right-10 w-32" />
          <div>
            <p className="eyebrow text-gold">{t.ref}</p>
            <p className="mt-1 font-mono text-2xl tracking-[0.2em] text-sheen">{booking.ref}</p>
          </div>
          <Icon name="sparkle" className="relative h-7 w-7 text-gold" />
        </div>
        <dl className="space-y-3 px-5 py-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {upcoming && <p className="border-t border-line px-5 py-3 text-xs text-muted">{dict.book.payAtClinic}</p>}
      </div>

      {upcoming ? (
        <BookingActions
          booking={{ id: booking.id, ref: booking.ref, serviceId: booking.serviceId, serviceName, when }}
          mapsUrl={CLINIC_MAPS_URL}
        />
      ) : (
        <Link href={`/${locale}/book/${booking.serviceId}`} className="btn-primary w-full">
          <Icon name="repeat" className="h-4 w-4" />
          {dict.home.bookAgain}
        </Link>
      )}

      {justBooked && (
        <Link href={`/${locale}`} className="btn-link mx-auto flex justify-center">
          {t.bookAnother}
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const tone = status === "confirmed" ? "bg-gold-soft text-gold-dark" : status === "completed" ? "bg-success/10 text-success" : "bg-line/60 text-muted";
  return <span className={`eyebrow shrink-0 rounded-full px-3 py-1.5 ${tone}`}>{label}</span>;
}
