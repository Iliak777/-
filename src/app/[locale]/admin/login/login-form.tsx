"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { adminLogin } from "@/server/admin-actions";

export function LoginForm() {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState(adminLogin, undefined);
  // Controlled so the email survives React's form reset after a failed attempt.
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="mt-6 space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="eyebrow text-muted">{dict.admin.email}</span>
        <input className="input mt-1" type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="eyebrow text-muted">{dict.admin.password}</span>
        <input className="input mt-1" type="password" name="password" autoComplete="current-password" required />
      </label>
      {state?.error && <p role="alert" className="text-sm text-danger">{dict.admin.badLogin}</p>}
      <button className="btn-primary w-full" disabled={pending}>{dict.admin.login}</button>
    </form>
  );
}
