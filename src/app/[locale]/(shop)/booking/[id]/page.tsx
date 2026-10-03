import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import { localized } from "@/i18n/config";
import { formatDateTime, formatThb } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { currentCustomerId } from "@/lib/session";
import { getCustomerBooking } from "@/server/booking";

export default async function ConfirmationPage({ params }: PageProps<"/[locale]/booking/[id]">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const { id } = await params;
  const customerId = await currentCustomerId();
  if (!customerId) redirect(`/${locale}/me`);
  const booking = z.uuid().safeParse(id).success ? await getCustomerBooking(customerId, id) : null;
  if (!booking) notFound();
  const t = dict.confirmation;

  const rows: [string, string][] = [
    [t.treatment, localized(booking.serviceName, locale)],
    [t.when, formatDateTime(booking.startsAt, locale)],
    [t.practitioner, booking.staffName],
    [t.price, booking.priceThb === null ? dict.common.priceOnConsultation : formatThb(booking.priceThb, locale)],
    [t.where, dict.common.address],
  ];

  return (
    <div className="space-y-5 pt-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl text-paper">✓</div>
      <div>
        <h1 className="font-display text-3xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-muted">{t.subtitle}</p>
      </div>
      <div className="card p-5 text-left">
        <p className="eyebrow text-muted">{t.ref}</p>
        <p className="font-mono text-2xl tracking-widest">{booking.ref}</p>
        <dl className="mt-4 space-y-3 border-t border-line pt-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">{dict.book.payAtClinic}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href={`/${locale}/me`} className="btn-primary">{t.viewBookings}</Link>
        <Link href={`/${locale}`} className="btn-ghost">{t.bookAnother}</Link>
      </div>
    </div>
  );
}
