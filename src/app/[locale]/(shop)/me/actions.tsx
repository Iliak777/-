"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Icon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";

const rowClass = "flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm transition active:bg-cream";

export function SignOutButton() {
  const { dict } = useI18n();
  const router = useRouter();
  const toast = useToast();
  return (
    <button
      className={rowClass}
      onClick={async () => {
        const res = await api("/api/auth/signout", { body: {} });
        if (!res.ok) return toast(dict.common.error, "error");
        toast(dict.me.signedOut);
        router.refresh();
      }}
    >
      <Icon name="logout" className="h-5 w-5 text-muted" />
      {dict.nav.signOut}
    </button>
  );
}

/** Account deletion, required by the App Store for any app with sign-up. */
export function DeleteAccountButton() {
  const { locale, dict } = useI18n();
  const t = dict.me;
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await api("/api/account", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError(res.error === "network" ? dict.common.offline : dict.common.error);
    setOpen(false);
    toast(t.deleted);
    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <>
      <button className={`${rowClass} text-danger`} onClick={() => setOpen(true)}>
        <Icon name="trash" className="h-5 w-5" />
        {t.deleteAccount}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.deleteAccount} locked={busy}>
        <p className="font-display text-2xl leading-tight font-semibold">{t.deleteConfirm}</p>
        <p className="mt-2 text-sm text-muted">{t.deleteExplain}</p>
        {error && (
          <p role="alert" className="animate-pop mt-3 flex items-center gap-2 text-sm text-danger">
            <Icon name="alert" className="h-4 w-4" />
            {error}
          </p>
        )}
        <div className="mt-5 grid gap-2">
          <button className="btn-danger w-full" disabled={busy} onClick={remove}>
            {busy ? dict.common.loading : t.deleteYes}
          </button>
          <button className="btn-ghost w-full" disabled={busy} onClick={() => setOpen(false)}>
            {dict.common.cancel}
          </button>
        </div>
      </Sheet>
    </>
  );
}
