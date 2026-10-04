import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { SignInGate } from "@/components/sign-in-gate";
import { EmptyState } from "@/components/states";
import { localized } from "@/i18n/config";
import { formatDateTime } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { maskPhone } from "@/lib/phone";
import { listCustomerBookings, type CustomerBooking } from "@/server/booking";
import { currentCustomer } from "@/server/customer";
import { DeleteAccountButton, SignOutButton } from "./actions";

export default async function MyBookingsPage({ params }: PageProps<"/[locale]/me">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const customer = await currentCustomer();
  if (!customer) return <SignInGate title={dict.me.title} intro={dict.me.signInIntro} />;

  const now = new Date();
  const all = await listCustomerBookings(customer.id);
  const upcoming = all.filter((b) => b.startsAt > now && b.status === "confirmed");
  const past = all.filter((b) => !upcoming.includes(b)).reverse();

  const row = (b: CustomerBooking, isUpcoming: boolean) => (
    <li key={b.id}>
      <Link href={`/${locale}/booking/${b.id}`} className={`card flex items-center gap-4 p-4 transition active:scale-[0.99] ${isUpcoming ? "" : "opacity-80"}`}>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{localized(b.serviceName, locale)}</p>
          <p className="text-sm text-muted">
            {formatDateTime(b.startsAt, locale)} · {b.staffName}
          </p>
          <p className="mt-1 flex items-center gap-2">
            <span className={`eyebrow rounded-full px-2 py-0.5 ${b.status === "confirmed" ? "bg-gold-soft text-gold-dark" : "bg-line/60 text-muted"}`}>{dict.me.status[b.status]}</span>
            <span className="font-mono text-xs tracking-widest text-muted">{b.ref}</span>
          </p>
        </div>
        <Icon name="chevronRight" className="h-5 w-5 text-muted" />
      </Link>
    </li>
  );

  return (
    <div className="space-y-7">
      <h1 className="font-display text-3xl font-medium">{dict.me.title}</h1>

      {all.length === 0 && (
        <div className="card">
          <EmptyState icon="calendar" title={dict.me.none} text={dict.me.noneHint} action={{ href: `/${locale}`, label: dict.common.toTreatments }} />
        </div>
      )}
      {upcoming.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="eyebrow text-muted">{dict.me.upcoming}</h2>
          <ul className="space-y-2.5">{upcoming.map((b) => row(b, true))}</ul>
        </section>
      )}
      {past.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="eyebrow text-muted">{dict.me.past}</h2>
          <ul className="space-y-2.5">{past.map((b) => row(b, false))}</ul>
        </section>
      )}

      <section className="space-y-2.5">
        <h2 className="eyebrow text-muted">{dict.me.account}</h2>
        <div className="card divide-y divide-line">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft font-display text-lg font-medium text-gold-dark">
              {customer.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{customer.name}</p>
              <p className="text-sm text-muted">{maskPhone(customer.phone)}</p>
            </div>
          </div>
          <Link href={`/${locale}/privacy`} className="flex min-h-12 items-center gap-3 px-4 text-sm">
            <Icon name="shield" className="h-5 w-5 text-muted" />
            <span className="flex-1">{dict.privacy.title}</span>
            <Icon name="chevronRight" className="h-4 w-4 text-muted" />
          </Link>
          <SignOutButton />
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
