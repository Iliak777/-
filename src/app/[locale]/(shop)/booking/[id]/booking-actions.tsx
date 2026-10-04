"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Icon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { fmt } from "@/i18n/config";
import { api } from "@/lib/api";

type Booking = { id: string; ref: string; serviceId: number; serviceName: string; when: string };

/** What a customer can do with an upcoming booking: calendar, directions, share, change, cancel. */
export function BookingActions({ booking, mapsUrl }: { booking: Booking; mapsUrl: string }) {
  const { locale, dict } = useI18n();
  const t = dict.confirmation;
  const toast = useToast();

  async function share() {
    const text = fmt(t.shareText, { service: booking.serviceName, when: booking.when, ref: booking.ref, address: dict.common.address });
    try {
      if (navigator.share) await navigator.share({ title: dict.common.appName, text });
      else {
        await navigator.clipboard.writeText(text);
        toast(t.copied);
      }
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  }

  const tile = "card flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition active:scale-[0.97]";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <a href={`/api/bookings/${booking.id}/calendar?locale=${locale}`} className={tile}>
          <Icon name="calendarPlus" className="h-5 w-5 text-gold-dark" />
          {t.addToCalendar}
        </a>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={tile}>
          <Icon name="pin" className="h-5 w-5 text-gold-dark" />
          {t.directions}
        </a>
        <button type="button" onClick={share} className={tile}>
          <Icon name="share" className="h-5 w-5 text-gold-dark" />
          {t.share}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/${locale}/book/${booking.serviceId}?change=${booking.id}`} className="btn-ghost">
          <Icon name="repeat" className="h-4 w-4" />
          {t.changeTime}
        </Link>
        <CancelBooking id={booking.id} label={booking.when} />
      </div>
    </div>
  );
}

/** Cancel with a confirmation sheet; reports failures instead of pretending it worked. */
function CancelBooking({ id, label }: { id: string; label: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    const res = await api(`/api/bookings/${id}/cancel`, { body: {} });
    setBusy(false);
    if (!res.ok) return setError(res.error === "network" ? dict.common.offline : res.error === "not_cancellable" ? dict.me.notCancellable : dict.common.error);
    setOpen(false);
    toast(dict.me.cancelled);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost text-danger">
        <Icon name="close" className="h-4 w-4" />
        {dict.me.cancelBooking}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={dict.me.cancelBooking} locked={busy}>
        <p className="font-display text-2xl leading-tight font-medium">{dict.me.cancelConfirm}</p>
        <p className="mt-1 text-sm text-muted">{label}</p>
        {error && (
          <p role="alert" className="animate-pop mt-3 flex items-center gap-2 text-sm text-danger">
            <Icon name="alert" className="h-4 w-4" />
            {error}
          </p>
        )}
        <div className="mt-5 grid gap-2">
          <button className="btn-danger w-full" disabled={busy} onClick={cancel}>
            {busy ? dict.common.loading : dict.me.cancelYes}
          </button>
          <button className="btn-ghost w-full" disabled={busy} onClick={() => setOpen(false)}>
            {dict.me.keepBooking}
          </button>
        </div>
      </Sheet>
    </>
  );
}
