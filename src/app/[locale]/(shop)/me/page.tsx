import { connection } from "next/server";
import { localized } from "@/i18n/config";
import { formatDateTime } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { SignInGate } from "@/components/sign-in-gate";
import { listCustomerBookings } from "@/server/booking";
import { currentCustomer } from "@/server/customer";
import { maskPhone } from "@/lib/phone";
import { CancelButton, SignOutButton } from "./actions";

export default async function MyBookingsPage({ params }: PageProps<"/[locale]/me">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const customer = await currentCustomer();
  if (!customer) return <SignInGate />;

  const now = new Date();
  const all = await listCustomerBookings(customer.id);
  const upcoming = all.filter((b) => b.startsAt > now && b.status === "confirmed");
  const past = all.filter((b) => !upcoming.includes(b)).reverse();

  const list = (items: typeof all, cancellable: boolean) => (
    <ul className="space-y-3">
      {items.map((b) => (
        <li key={b.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{localized(b.serviceName, locale)}</p>
              <p className="text-sm text-muted">
                {formatDateTime(b.startsAt, locale)} · {b.staffName}
              </p>
              <p className="mt-1 font-mono text-xs tracking-widest text-muted">{b.ref}</p>
            </div>
            <span className={`eyebrow shrink-0 ${b.status === "confirmed" ? "text-gold-dark" : "text-muted"}`}>{dict.me.status[b.status]}</span>
          </div>
          {cancellable && <CancelButton id={b.id} />}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">{dict.me.title}</h1>
          <p className="text-sm text-muted">
            {customer.name} · {maskPhone(customer.phone)}
          </p>
        </div>
        <SignOutButton />
      </div>
      {all.length === 0 && <p className="text-muted">{dict.me.none}</p>}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow text-muted">{dict.me.upcoming}</h2>
          {list(upcoming, true)}
        </section>
      )}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow text-muted">{dict.me.past}</h2>
          {list(past, false)}
        </section>
      )}
    </div>
  );
}
