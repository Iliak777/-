"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export function CancelButton({ id }: { id: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    if (!confirm(dict.me.cancelConfirm)) return;
    setBusy(true);
    await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
    router.refresh();
  }
  return (
    <button onClick={cancel} disabled={busy} className="mt-3 text-sm text-danger underline-offset-4 hover:underline disabled:opacity-50">
      {dict.me.cancelBooking}
    </button>
  );
}

export function SignOutButton() {
  const { dict } = useI18n();
  const router = useRouter();
  return (
    <button
      className="text-sm text-muted underline-offset-4 hover:underline"
      onClick={async () => {
        await fetch("/api/auth/signout", { method: "POST" });
        router.refresh();
      }}
    >
      {dict.nav.signOut}
    </button>
  );
}
