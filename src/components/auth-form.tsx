"use client";

import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "./i18n-provider";

type Step = { kind: "phone" } | { kind: "code"; phone: string; devCode?: string; needName: boolean };

/** Phone number + SMS code sign-in. Calls `onDone` once the session cookie is set. */
export function AuthForm({ onDone, compact = false }: { onDone: () => void; compact?: boolean }) {
  const { dict } = useI18n();
  const t = dict.auth;
  const [step, setStep] = useState<Step>({ kind: "phone" });
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await post("/api/auth/otp", { phone });
    setBusy(false);
    if (!ok) return setError(data.error === "invalid_phone" ? t.invalidPhone : (t[data.error as keyof typeof t] ?? dict.common.error));
    setCode("");
    setStep({ kind: "code", phone: data.phone, devCode: data.devCode, needName: false });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "code") return;
    setBusy(true);
    setError(null);
    const { ok, data } = await post("/api/auth/verify", { phone: step.phone, code, name: name || undefined });
    setBusy(false);
    if (ok) return onDone();
    if (data.error === "name_required") {
      if (step.needName) setError(t.name_required);
      return setStep({ ...step, needName: true });
    }
    setError(t[data.error as keyof typeof t] ?? dict.common.error);
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
              placeholder={t.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={busy || !phone}>
            {t.sendCode}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-4 space-y-3">
          <p className="text-sm">
            {fmt(t.codeSent, { phone: step.phone })}{" "}
            <button type="button" className="text-gold-dark underline" onClick={() => setStep({ kind: "phone" })}>
              {t.changePhone}
            </button>
          </p>
          {step.devCode && <p className="rounded-xl bg-cream px-3 py-2 text-sm">{fmt(t.devCode, { code: step.devCode })}</p>}
          <label className="block">
            <span className="eyebrow text-muted">{t.codeLabel}</span>
            <input
              className="input mt-1 text-center text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
            />
          </label>
          {step.needName && (
            <label className="block">
              <span className="eyebrow text-muted">{t.nameLabel}</span>
              <span className="block text-xs text-muted">{t.nameHint}</span>
              <input className="input mt-1" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required maxLength={80} />
            </label>
          )}
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {t.verify}
          </button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
