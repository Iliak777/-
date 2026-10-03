import Link from "next/link";
import { localized } from "@/i18n/config";
import { formatDate, formatTime } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { addDays, isValidDateString, localDateString, localToUtc } from "@/lib/time";
import { setAppointmentStatus } from "@/server/admin-actions";
import { appointmentsOn } from "@/server/admin-queries";

export default async function AppointmentsPage({ params, searchParams }: PageProps<"/[locale]/admin">) {
  const { locale, dict } = await pageI18n(params);
  const q = (await searchParams).date;
  const date = typeof q === "string" && isValidDateString(q) ? q : localDateString(new Date());
  const rows = await appointmentsOn(date);
  const t = dict.admin.appointments;
  const base = `/${locale}/admin`;

  const statusButton = (id: string, status: string, label: string, cls = "") => (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`rounded-full border border-line px-3 py-1 text-xs hover:border-gold ${cls}`}>{label}</button>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">{formatDate(localToUtc(date, 12 * 60), locale)}</h1>
        <div className="flex gap-2">
          <Link className="btn-ghost px-3 py-1.5" href={`${base}?date=${addDays(date, -1)}`}>‹</Link>
          <Link className="btn-ghost px-3 py-1.5" href={base}>{dict.common.today}</Link>
          <Link className="btn-ghost px-3 py-1.5" href={`${base}?date=${addDays(date, 1)}`}>›</Link>
        </div>
        <form className="flex gap-2">
          <input type="date" name="date" defaultValue={date} className="input py-1.5" aria-label={t.date} />
          <button className="btn-ghost px-3 py-1.5">→</button>
        </form>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">{t.none}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className={`card flex flex-wrap items-center gap-x-6 gap-y-2 p-4 ${r.status === "cancelled" ? "opacity-50" : ""}`}>
              <div className="w-28 font-medium">
                {formatTime(r.startsAt, locale)}–{formatTime(r.endsAt, locale)}
              </div>
              <div className="min-w-40 flex-1">
                <p className="font-medium">{localized(r.serviceName, locale)}</p>
                <p className="text-sm text-muted">{r.staffName}</p>
              </div>
              <div className="min-w-40 flex-1 text-sm">
                <p>{r.customerName}</p>
                <a className="text-muted hover:underline" href={`tel:${r.phone}`}>{r.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-gold-dark">{dict.me.status[r.status]}</span>
                {r.status === "confirmed" && (
                  <>
                    {statusButton(r.id, "completed", t.markCompleted)}
                    {statusButton(r.id, "no_show", t.markNoShow)}
                    {statusButton(r.id, "cancelled", t.cancel, "text-danger")}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
