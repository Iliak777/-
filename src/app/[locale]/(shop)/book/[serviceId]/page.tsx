import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { fmt, localized } from "@/i18n/config";
import { formatThb } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { getActiveService, staffForService } from "@/server/booking";
import { currentCustomer } from "@/server/customer";
import { BookingFlow } from "./booking-flow";

export default async function BookPage({ params }: PageProps<"/[locale]/book/[serviceId]">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const { serviceId } = await params;
  const id = Number(serviceId);
  const svc = Number.isInteger(id) && id > 0 ? await getActiveService(id) : null;
  if (!svc) notFound();
  const [practitioners, customer] = await Promise.all([staffForService(svc.id), currentCustomer()]);
  const name = localized(svc.name, locale);

  return (
    <div className="space-y-5">
      <Link href={`/${locale}`} className="text-sm text-muted">
        ‹ {dict.common.back}
      </Link>
      <div>
        <h1 className="font-display text-3xl font-semibold">{name}</h1>
        <p className="mt-1 text-sm text-muted">{localized(svc.description, locale)}</p>
        <p className="mt-2 text-sm text-gold-dark">
          {fmt(dict.common.minutes, { n: svc.durationMin })} ·{" "}
          {svc.priceThb === null ? dict.common.priceOnConsultation : formatThb(svc.priceThb, locale)}
        </p>
      </div>
      <BookingFlow
        service={{ id: svc.id, name, durationMin: svc.durationMin, priceThb: svc.priceThb }}
        practitioners={practitioners}
        customerName={customer?.name ?? null}
      />
    </div>
  );
}
