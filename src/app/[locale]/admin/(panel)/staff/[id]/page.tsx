import { notFound } from "next/navigation";
import { localized } from "@/i18n/config";
import { formatDateTime } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { localDateString, minutesToHhmm } from "@/lib/time";
import { addTimeOff, removeTimeOff, saveStaff } from "@/server/admin-actions";
import { allServices, staffDetail } from "@/server/admin-queries";

export default async function StaffEditPage({ params }: PageProps<"/[locale]/admin/staff/[id]">) {
  const { locale, dict } = await pageI18n(params);
  const { id } = await params;
  const isNew = id === "new";
  const person = isNew ? null : await staffDetail(Number(id) || 0);
  if (!isNew && !person) notFound();
  const svcs = await allServices();
  const t = dict.admin.staff;
  const today = localDateString(new Date());

  return (
    <div className="max-w-2xl space-y-8">
      <form action={saveStaff} className="space-y-5">
        <h1 className="font-display text-3xl font-medium">{isNew ? t.new : t.edit}</h1>
        <input type="hidden" name="locale" value={locale} />
        {person && <input type="hidden" name="id" value={person.id} />}
        <label className="block">
          <span className="eyebrow text-muted">{t.name}</span>
          <input className="input mt-1" name="name" defaultValue={person?.name} required maxLength={80} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={person?.active ?? true} className="h-5 w-5 accent-[var(--gold)]" />
          {t.active}
        </label>

        <fieldset>
          <legend className="eyebrow text-muted">{t.hours}</legend>
          <div className="mt-2 space-y-2">
            {t.weekdays.map((label, d) => {
              const h = person?.hours.find((x) => x.weekday === d);
              return (
                <div key={d} className="grid grid-cols-[7rem_1fr_1fr] items-center gap-2">
                  <span className="text-sm">{label}</span>
                  <input className="input py-2" type="time" name={`start_${d}`} defaultValue={h ? minutesToHhmm(h.startMin) : ""} step={900} />
                  <input className="input py-2" type="time" name={`end_${d}`} defaultValue={h ? minutesToHhmm(h.endMin) : ""} step={900} />
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow text-muted">{t.treatments}</legend>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {svcs.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={person?.serviceIds.includes(s.id)} className="h-4 w-4 accent-[var(--gold)]" />
                {localized(s.name, locale)}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn-primary">{dict.common.save}</button>
      </form>

      {person && (
        <section className="space-y-3">
          <h2 className="eyebrow text-muted">{t.timeOff}</h2>
          <ul className="space-y-2">
            {person.timeOff.map((o) => (
              <li key={o.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
                <span>
                  {formatDateTime(o.startsAt, locale)} → {formatDateTime(o.endsAt, locale)}
                  {o.note && <span className="text-muted"> · {o.note}</span>}
                </span>
                <form action={removeTimeOff}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="staffId" value={person.id} />
                  <button className="text-danger hover:underline">{t.remove}</button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addTimeOff} className="card grid gap-2 p-3 sm:grid-cols-2">
            <input type="hidden" name="staffId" value={person.id} />
            <label className="text-sm">{t.from}
              <div className="flex gap-2"><input className="input py-2" type="date" name="fromDate" defaultValue={today} required /><input className="input py-2" type="time" name="fromTime" /></div>
            </label>
            <label className="text-sm">{t.to}
              <div className="flex gap-2"><input className="input py-2" type="date" name="toDate" defaultValue={today} required /><input className="input py-2" type="time" name="toTime" /></div>
            </label>
            <input className="input py-2 sm:col-span-2" name="note" placeholder={t.note} maxLength={200} />
            <button className="btn-ghost sm:col-span-2">+ {t.addTimeOff}</button>
          </form>
        </section>
      )}
    </div>
  );
}
