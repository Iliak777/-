"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "./auth-form";

/** Shown in place of a page that needs a signed-in customer, with a line on why. */
export function SignInGate({ title, intro }: { title: string; intro: string }) {
  const router = useRouter();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{intro}</p>
      </div>
      <AuthForm onDone={() => router.refresh()} />
    </div>
  );
}
