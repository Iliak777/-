import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { fmt, localized } from "@/i18n/config";
import { formatDateTime } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { listCustomerBookings } from "@/server/booking";
import { listActiveServices, listCategories } from "@/server/catalog";
import { currentCustomer } from "@/server/customer";
import { ServiceList } from "./service-list";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const [cats, svcs, customer] = await Promise.all([listCategories(), listActiveServices(), currentCustomer()]);
  const bookings = customer ? await listCustomerBookings(customer.id) : [];

  const items = svcs.map((s) => ({
    id: s.id,
    categoryId: s.categoryId,
    name: localized(s.name, locale),
    // Searching also matches the English name, which tourists often know.
    keywords: `${localized(s.name, locale)} ${s.name.en} ${localized(s.description, locale)}`.toLowerCase(),
    description: localized(s.description, locale),
    durationMin: s.durationMin,
    priceThb: s.priceThb,
  }));
  const usedCats = cats
    .filter((c) => items.some((i) => i.categoryId === c.id))
    .map((c) => ({ id: c.id, name: localized(c.name, locale) }));

  // Returning customers: their next visit, and one-tap rebooking of what they had before.
  const now = new Date();
  const next = bookings.find((b) => b.status === "confirmed" && b.startsAt > now);
  const activeIds = new Set(svcs.map((s) => s.id));
  const rebook = [...bookings]
    .reverse()
    .filter((b) => b.status !== "cancelled" && activeIds.has(b.serviceId))
    .filter((b, i, all) => all.findIndex((x) => x.serviceId === b.serviceId) === i)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {customer ? (
        <section>
          <p className="text-sm text-muted">{fmt(dict.home.hello, { name: customer.name.split(" ")[0] })}</p>
          <h1 className="font-display text-[2rem] leading-tight font-semibold">{dict.home.whatToday}</h1>
        </section>
      ) : (
        <section className="rounded-3xl bg-noir px-5 py-6 text-white">
          <p className="eyebrow text-gold">{dict.common.tagline}</p>
          <h1 className="mt-2 font-display text-[1.85rem] leading-tight font-semibold">{dict.home.heroTitle}</h1>
          <p className="mt-1.5 text-sm text-white/70">{dict.home.heroSubtitle}</p>
        </section>
      )}

      {next && (
        <Link href={`/${locale}/booking/${next.id}`} className="card flex items-center gap-4 border-gold/50 p-4 transition active:scale-[0.99]">
          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gold-soft text-gold-dark">
            <Icon name="calendar" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block text-gold-dark">{dict.home.nextVisit}</span>
            <span className="block truncate font-medium">{localized(next.serviceName, locale)}</span>
            <span className="block text-sm text-muted">{formatDateTime(next.startsAt, locale)} · {next.staffName}</span>
          </span>
          <Icon name="chevronRight" className="h-5 w-5 text-muted" />
        </Link>
      )}

      {rebook.length > 0 && (
        <section className="space-y-2">
          <h2 className="eyebrow text-muted">{dict.home.bookAgain}</h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {rebook.map((b) => (
              <Link key={b.serviceId} href={`/${locale}/book/${b.serviceId}`} className="chip gap-1.5 border-gold/50">
                <Icon name="repeat" className="h-4 w-4 text-gold-dark" />
                {localized(b.serviceName, locale)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ServiceList categories={usedCats} services={items} />

      <Link href={`/${locale}/chat`} className="card flex items-center gap-4 p-4 transition active:scale-[0.99]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-noir text-gold">
          <Icon name="chat" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{dict.home.chatTitle}</span>
          <span className="block text-sm text-muted">{dict.home.chatCta}</span>
        </span>
        <Icon name="chevronRight" className="h-5 w-5 text-muted" />
      </Link>
    </div>
  );
}
