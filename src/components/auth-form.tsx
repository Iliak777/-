"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { api } from "@/lib/api";
import { useI18n } from "./i18n-provider";
import { Icon } from "./icons";

type Step = { kind: "phone" } | { kind: "code"; phone: string; devCode?: string; needName: boolean };

const RESEND_AFTER_SEC = 30;

/**
 * Phone number + SMS code sign-in. Calls `onDone` with the customer's name once
 * the session cookie is set. The code submits by itself on the 6th digit.
 */
export function AuthForm({ onDone, compact = false }: { onDone: (name: string) => void; compact?: boolean }) {
  const { dict } = useI18n();
  const t = dict.auth;
  const [step, setStep] = useState<Step>({ kind: "phone" });
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const message = (err?: string) =>
    err === "network" ? dict.common.offline : err === "invalid_phone" ? t.invalidPhone : (t[err as keyof typeof t] as string | undefined) ?? dict.common.error;

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api<{ phone: string; devCode?: string }>("/api/auth/otp", { body: { phone } });
    setBusy(false);
    if (!res.ok) return setError(message(res.error));
    setCode("");
    setResendIn(RESEND_AFTER_SEC);
    setStep({ kind: "code", phone: res.data.phone, devCode: res.data.devCode, needName: step.kind === "code" && step.needName });
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (step.kind !== "code" || busy) return;
    setBusy(true);
    setError(null);
    const res = await api<{ name: string }>("/api/auth/verify", { body: { phone: step.phone, code, name: name.trim() || undefined } });
    if (res.ok) return onDone(res.data.name);
    setBusy(false);
    if (res.error === "name_required") {
      if (step.needName) setError(t.name_required);
      return setStep({ ...step, needName: true });
    }
    setError(message(res.error));
  }

  function onCode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    // Saves a tap; a first-time customer still has to add a name.
    if (digits.length === 6 && step.kind === "code" && !step.needName) setTimeout(() => form.current?.requestSubmit(), 0);
  }

  return (
    <div className={compact ? "" : "card p-5"}>
      <h2 className="font-display text-2xl font-semibold">{t.title}</h2>
      <p className="mt-1 text-sm text-muted">{t.subtitle}</p>

      {step.kind === "phone" ? (
        <form onSubmit={sendCode} className="mt-4 space-y-3">
          <label className="block">
            <span className="eyebrow text-muted">{t.phoneLabel}</span>
            <input
              className="input mt-1"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="send"
              placeholder={t.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus={compact}
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={busy || !phone.trim()}>
            {busy ? dict.common.loading : t.sendCode}
          </button>
        </form>
      ) : (
        <form ref={form} onSubmit={verify} className="mt-4 space-y-3">
          <p className="text-sm">
            {fmt(t.codeSent, { phone: step.phone })}{" "}
            <button type="button" className="font-medium text-gold-dark underline underline-offset-4" onClick={() => setStep({ kind: "phone" })}>
              {t.changePhone}
            </button>
          </p>
          {step.devCode && <p className="rounded-xl bg-gold-soft px-3 py-2 text-sm">{fmt(t.devCode, { code: step.devCode })}</p>}
          <label className="block">
            <span className="eyebrow text-muted">{t.codeLabel}</span>
            <input
              className="input mt-1 text-center font-mono text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="done"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => onCode(e.target.value)}
              aria-invalid={!!error}
              autoFocus
              required
            />
          </label>
          {step.needName && (
            <label className="animate-pop block">
              <span className="eyebrow text-muted">{t.nameLabel}</span>
              <span className="block text-xs text-muted">{t.nameHint}</span>
              <input className="input mt-1" autoComplete="name" enterKeyHint="done" value={name} onChange={(e) => setName(e.target.value)} autoFocus required maxLength={80} />
            </label>
          )}
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy ? dict.common.loading : t.verify}
          </button>
          <button type="button" className="btn-link mx-auto flex disabled:text-muted" disabled={busy || resendIn > 0} onClick={() => sendCode()}>
            <Icon name="refresh" className="h-4 w-4" />
            {resendIn > 0 ? fmt(t.resendIn, { s: resendIn }) : t.resend}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="animate-pop mt-3 flex items-center gap-2 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
