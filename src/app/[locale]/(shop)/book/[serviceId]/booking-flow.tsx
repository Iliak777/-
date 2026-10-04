"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { useI18n } from "@/components/i18n-provider";
import { Icon, type IconName } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { InlineError } from "@/components/states";
import { fmt, intlLocale } from "@/i18n/config";
import { formatDate, formatDateTime, formatTime } from "@/i18n/format";
import { api } from "@/lib/api";
import { BOOKING_HORIZON_DAYS } from "@/lib/availability";
import { addDays, CLINIC_TZ, localDateString, localMinutes, localToUtc } from "@/lib/time";

type Slot = { start: string; staffIds: number[] };
type Earliest = (Slot & { date: string }) | null;
type Props = {
  service: { id: number; name: string; durationMin: number; price: string };
  practitioners: { id: number; name: string }[];
  customerName: string | null;
  initial: { date: string; slots: Slot[]; earliest: Earliest };
  replace: { id: string; ref: string; startsAt: string } | null;
};

const REFRESH_MS = 30_000;
const PERIODS = [
  { key: "morning", until: 12 * 60 },
  { key: "afternoon", until: 17 * 60 },
  { key: "evening", until: 24 * 60 },
] as const;

export function BookingFlow({ service, practitioners, customerName, initial, replace }: Props) {
  const { locale, dict } = useI18n();
  const t = dict.book;
  const router = useRouter();
  const today = localDateString(new Date());
  const [staffId, setStaffId] = useState<number | null>(null);
  const [date, setDate] = useState(initial.date);
  // Slots are tagged with the day/practitioner they belong to, so a stale list never shows.
  const viewKey = `${date}|${staffId}`;
  const [loaded, setLoaded] = useState<{ key: string; slots: Slot[] }>({ key: `${initial.date}|null`, slots: initial.slots });
  const slots = loaded.key === viewKey ? loaded.slots : null;
  const [earliest, setEarliest] = useState<Earliest>(initial.earliest);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [signedInAs, setSignedInAs] = useState(customerName);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const firstRun = useRef(true);
  const dayStrip = useRef<HTMLDivElement>(null);

  const staffName = (ids: number[]) => practitioners.find((p) => p.id === (staffId ?? ids[0]))?.name ?? "";
  const reload = useCallback(() => setRefreshTick((n) => n + 1), []);

  // Load the open day (the server already sent the first one), then keep it fresh while the page is open.
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const q = new URLSearchParams({ serviceId: String(service.id), date, earliest: "1" });
      if (staffId) q.set("staffId", String(staffId));
      const res = await api<{ slots: Slot[]; earliest: Earliest }>(`/api/availability?${q}`);
      if (!alive) return;
      setLoadFailed(!res.ok);
      if (!res.ok) return;
      setEarliest(res.data.earliest);
      setLoaded({ key: `${date}|${staffId}`, slots: res.data.slots });
    };
    if (firstRun.current) firstRun.current = false;
    else run();
    const timer = setInterval(run, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [service.id, date, staffId, refreshTick]);

  // Keep the chosen day visible in the strip (e.g. after jumping to the earliest day).
  useEffect(() => {
    dayStrip.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [date]);

  function choose(slot: Slot) {
    setSheetError(null);
    setSelected(slot);
  }

  async function book(slot: Slot) {
    setBusy(true);
    setNotice(null);
    setSheetError(null);
    const res = await api<{ id: string }>("/api/bookings", {
      body: { serviceId: service.id, staffId, startsAt: slot.start, locale, replaceId: replace?.id },
    });
    if (res.ok) {
      router.push(`/${locale}/booking/${res.data.id}?${replace ? "changed" : "new"}=1`);
      return; // stay busy until the confirmation screen takes over
    }
    setBusy(false);
    if (res.status === 401) return setSignedInAs(null);
    if (res.error === "slot_taken") {
      setSelected(null);
      setNotice(t.slotTaken);
      return reload();
    }
    setSheetError(res.error === "too_many" ? t.tooMany : res.error === "not_changeable" ? t.notChangeable : res.error === "network" ? dict.common.offline : dict.common.error);
  }

  const days = Array.from({ length: BOOKING_HORIZON_DAYS }, (_, i) => addDays(today, i));
  const weekday = new Intl.DateTimeFormat(intlLocale[locale], { timeZone: CLINIC_TZ, weekday: "short" });
  const monthYear = new Intl.DateTimeFormat(intlLocale[locale], { timeZone: CLINIC_TZ, month: "long", year: "numeric" });
  const noon = (d: string) => localToUtc(d, 12 * 60);
  const dayTop = (d: string) => (d === today ? dict.common.today : d === addDays(today, 1) ? dict.common.tomorrow : weekday.format(noon(d)));
  const dayLabel = (d: string) => (d === addDays(today, 1) ? dict.common.tomorrow : formatDate(noon(d), locale));
  const whenLabel = (s: Slot) =>
    localDateString(new Date(s.start)) === today ? `${dict.common.today}, ${formatTime(new Date(s.start), locale)}` : formatDateTime(new Date(s.start), locale);

  const grouped = PERIODS.map((p, i) => ({
    key: p.key,
    slots: (slots ?? []).filter((s) => {
      const m = localMinutes(new Date(s.start));
      return m < p.until && m >= (i === 0 ? 0 : PERIODS[i - 1].until);
    }),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-6">
      {replace && (
        <p className="flex items-start gap-2.5 rounded-2xl bg-gold-soft px-4 py-3 text-sm">
          <Icon name="repeat" className="mt-0.5 h-4 w-4 text-gold-dark" />
          {fmt(t.changingFrom, { ref: replace.ref, when: formatDateTime(new Date(replace.startsAt), locale) })}
        </p>
      )}

      {/* The fastest path: one tap on the earliest free time. */}
      <section className="silk relative isolate overflow-hidden rounded-[1.75rem] p-6 text-white">
        <span aria-hidden className="halo -right-16 -bottom-24 w-60" />
        <p className="eyebrow flex items-center gap-2 text-gold">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
          {t.earliestTitle}
        </p>
        {earliest === null ? (
          <p className="mt-3 text-sm text-white/80">{t.noSlotsAtAll}</p>
        ) : (
          <>
            <p className="mt-3 font-display text-[2rem] leading-tight font-medium tabular-nums">{whenLabel(earliest)}</p>
            <p className="mt-1 text-sm text-white/65">{fmt(t.earliestWith, { staff: staffName(earliest.staffIds) })}</p>
            <button className="btn-gold mt-5 w-full" onClick={() => choose(earliest)}>
              {t.bookEarliest}
            </button>
          </>
        )}
      </section>

      {notice && (
        <p role="alert" className="animate-pop flex items-center gap-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" />
          {notice}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="eyebrow text-muted">{t.orChoose}</h2>

        {practitioners.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted">{t.practitioner}</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={t.practitioner}>
              <button className="chip" aria-pressed={staffId === null} onClick={() => setStaffId(null)}>
                {t.anyPractitioner}
              </button>
              {practitioners.map((p) => (
                <button key={p.id} className="chip" aria-pressed={staffId === p.id} onClick={() => setStaffId(p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted">{monthYear.format(noon(date))}</p>
          <div ref={dayStrip} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t.day}>
            {days.map((d) => (
              <button
                key={d}
                aria-pressed={d === date}
                onClick={() => setDate(d)}
                className="flex h-[4.5rem] w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-full border border-line bg-paper transition active:scale-95 aria-pressed:border-noir aria-pressed:bg-noir aria-pressed:text-gold"
              >
                <span className="max-w-full truncate px-1 text-[0.65rem] opacity-70">{dayTop(d)}</span>
                <span className="font-display text-xl leading-tight font-medium">{Number(d.slice(8))}</span>
              </button>
            ))}
          </div>
        </div>

        {loadFailed && slots === null ? (
          <InlineError text={dict.common.loadFailed} retryLabel={dict.common.retry} onRetry={reload} />
        ) : slots === null ? (
          <div className="grid grid-cols-4 gap-2" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-11" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
            <p className="text-sm text-muted">{t.noSlots}</p>
            {earliest && earliest.date !== date && (
              <button className="btn-ghost mt-4" onClick={() => setDate(earliest.date)}>
                {fmt(t.jumpTo, { day: dayLabel(earliest.date) })}
                <Icon name="chevronRight" className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.key}>
                <p className="mb-2 text-xs text-muted">{t.periods[g.key]}</p>
                <div className="grid grid-cols-4 gap-2">
                  {g.slots.map((s) => (
                    <button
                      key={s.start}
                      aria-pressed={selected?.start === s.start}
                      className={`h-11 rounded-full border bg-paper text-sm font-medium tabular-nums transition hover:border-gold active:scale-95 aria-pressed:border-noir aria-pressed:bg-noir aria-pressed:text-gold ${s.start === earliest?.start ? "border-gold text-gold-dark" : "border-line"}`}
                      onClick={() => choose(s)}
                    >
                      {formatTime(new Date(s.start), locale)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={replace ? t.changeTitle : t.confirmTitle} locked={busy}>
        {selected && (
          <div className="space-y-4">
            <p className="font-display text-2xl leading-tight font-medium">{service.name}</p>
            <ul className="space-y-2.5 text-sm">
              <SummaryRow icon="calendar" text={whenLabel(selected)} strong />
              <SummaryRow icon="user" text={staffName(selected.staffIds)} />
              <SummaryRow icon="clock" text={fmt(dict.common.minutes, { n: service.durationMin })} />
              <SummaryRow icon="pin" text={dict.common.address} />
              <SummaryRow icon="tag" text={service.price} />
            </ul>
            <p className="rounded-2xl bg-cream px-4 py-2.5 text-xs text-muted">{t.payAtClinic}</p>
            {sheetError && (
              <p role="alert" className="animate-pop flex items-center gap-2 text-sm text-danger">
                <Icon name="alert" className="h-4 w-4" />
                {sheetError}
              </p>
            )}
            {signedInAs ? (
              <div className="space-y-2">
                <button className="btn-primary w-full" disabled={busy} onClick={() => book(selected)}>
                  {busy ? dict.common.loading : replace ? t.changeButton : t.confirmButton}
                </button>
                <p className="text-center text-xs text-muted">{fmt(t.bookingAs, { name: signedInAs })}</p>
              </div>
            ) : (
              <div className="border-t border-line pt-4">
                <AuthForm
                  compact
                  onDone={(name) => {
                    // Signed in: book straight away, no extra tap.
                    setSignedInAs(name);
                    book(selected);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function SummaryRow({ icon, text, strong = false }: { icon: IconName; text: string; strong?: boolean }) {
  if (!text) return null;
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-gold-dark">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className={strong ? "font-semibold" : ""}>{text}</span>
    </li>
  );
}
