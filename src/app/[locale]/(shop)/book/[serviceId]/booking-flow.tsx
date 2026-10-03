"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { useI18n } from "@/components/i18n-provider";
import { fmt } from "@/i18n/config";
import { formatDate, formatDateTime, formatThb, formatTime } from "@/i18n/format";
import { BOOKING_HORIZON_DAYS } from "@/lib/availability";
import { addDays, localDateString, localToUtc } from "@/lib/time";

type Slot = { start: string; staffIds: number[] };
type Earliest = (Slot & { date: string }) | null;
type Props = {
  service: { id: number; name: string; durationMin: number; priceThb: number | null };
  practitioners: { id: number; name: string }[];
  customerName: string | null;
};

const REFRESH_MS = 30_000;

async function fetchAvailability(serviceId: number, date: string, staffId: number | null) {
  const q = new URLSearchParams({ serviceId: String(serviceId), date, earliest: "1" });
  if (staffId) q.set("staffId", String(staffId));
  const res = await fetch(`/api/availability?${q}`, { cache: "no-store" });
  return res.ok ? ((await res.json()) as { slots: Slot[]; earliest: Earliest }) : null;
}

export function BookingFlow({ service, practitioners, customerName }: Props) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const today = localDateString(new Date());
  const [staffId, setStaffId] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  // Slots are tagged with the day/practitioner they belong to, so a stale list never shows.
  const viewKey = `${date}|${staffId}`;
  const [loaded, setLoaded] = useState<{ key: string; slots: Slot[] } | null>(null);
  const slots = loaded?.key === viewKey ? loaded.slots : null;
  const [earliest, setEarliest] = useState<Earliest | undefined>(undefined);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [signedInAs, setSignedInAs] = useState(customerName);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const jumpToEarliest = useRef(true);

  const staffName = (ids: number[]) => practitioners.find((p) => p.id === ids[0])?.name ?? "";

  const [refreshTick, setRefreshTick] = useState(0);
  const reload = () => setRefreshTick((n) => n + 1);

  // Load now, then keep availability fresh while the page is open.
  useEffect(() => {
    let alive = true;
    const run = () =>
      fetchAvailability(service.id, date, staffId).then((data) => {
        if (!alive || !data) return;
        setEarliest(data.earliest);
        // First load: open the day of the earliest slot so the grid is never empty for no reason.
        if (jumpToEarliest.current && data.earliest && data.earliest.date !== date) {
          jumpToEarliest.current = false;
          setDate(data.earliest.date);
          return;
        }
        jumpToEarliest.current = false;
        setLoaded({ key: `${date}|${staffId}`, slots: data.slots });
      });
    run();
    const timer = setInterval(run, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [service.id, date, staffId, refreshTick]);

  async function book(slot: Slot) {
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: service.id, staffId, startsAt: slot.start, locale }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/${locale}/booking/${id}`);
      return;
    }
    setBusy(false);
    if (res.status === 401) return setSignedInAs(null);
    setSelected(null);
    setNotice(res.status === 409 ? dict.book.slotTaken : dict.common.error);
    reload();
  }

  const days = Array.from({ length: BOOKING_HORIZON_DAYS }, (_, i) => addDays(today, i));
  const dayLabel = (d: string) =>
    d === today ? dict.common.today : d === addDays(today, 1) ? dict.common.tomorrow : formatDate(localToUtc(d, 12 * 60), locale);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`;

  return (
    <div className="space-y-5">
      {/* The fastest path: one tap on the earliest free time. */}
      <section className="card border-gold/40 p-5">
        <p className="eyebrow text-gold-dark">{dict.book.earliestTitle}</p>
        {earliest === undefined ? (
          <p className="mt-2 text-muted">{dict.common.loading}</p>
        ) : earliest === null ? (
          <p className="mt-2 text-sm">{dict.book.noSlotsAtAll}</p>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-semibold">
                {earliest.date === today ? `${dict.common.today}, ${formatTime(new Date(earliest.start), locale)}` : formatDateTime(new Date(earliest.start), locale)}
              </p>
              <p className="text-sm text-muted">{fmt(dict.book.earliestWith, { staff: staffName(earliest.staffIds) })}</p>
            </div>
            <button className="btn-gold shrink-0" onClick={() => setSelected(earliest)}>
              {dict.book.bookEarliest}
            </button>
          </div>
        )}
      </section>

      {notice && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{notice}</p>}

      <section className="space-y-3">
        <h2 className="eyebrow text-muted">{dict.book.orChoose}</h2>
        {practitioners.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]" aria-label={dict.book.practitioner}>
            <button className={chip(staffId === null)} onClick={() => setStaffId(null)}>
              {dict.book.anyPractitioner}
            </button>
            {practitioners.map((p) => (
              <button key={p.id} className={chip(staffId === p.id)} onClick={() => setStaffId(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        )}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {days.map((d) => (
            <button key={d} className={chip(d === date)} onClick={() => setDate(d)}>
              {dayLabel(d)}
            </button>
          ))}
        </div>
        {slots === null ? (
          <p className="py-6 text-center text-muted">{dict.common.loading}</p>
        ) : slots.length === 0 ? (
          <p className="py-6 text-center text-muted">{dict.book.noSlots}</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {slots.map((s) => (
              <button key={s.start} className="rounded-xl border border-line bg-paper py-3 text-sm transition hover:border-gold active:scale-95" onClick={() => setSelected(s)}>
                {formatTime(new Date(s.start), locale)}
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-30 flex items-end bg-ink/40" onClick={() => !busy && setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="mx-auto w-full max-w-2xl rounded-t-3xl bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow text-gold-dark">{dict.book.confirmTitle}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{service.name}</p>
            <p className="text-sm text-muted">
              {formatDateTime(new Date(selected.start), locale)} · {staffName(selected.staffIds)} ·{" "}
              {service.priceThb === null ? dict.common.priceOnConsultation : formatThb(service.priceThb, locale)}
            </p>
            <p className="mt-1 text-xs text-muted">{dict.book.payAtClinic}</p>
            <div className="mt-4">
              {signedInAs ? (
                <div className="space-y-2">
                  <button className="btn-primary w-full" disabled={busy} onClick={() => book(selected)}>
                    {busy ? dict.common.loading : dict.book.confirmButton}
                  </button>
                  <p className="text-center text-xs text-muted">{fmt(dict.book.bookingAs, { name: signedInAs })}</p>
                </div>
              ) : (
                <AuthForm
                  compact
                  onDone={() => {
                    // Signed in: book straight away, no extra tap.
                    setSignedInAs("…");
                    book(selected);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
